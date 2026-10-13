import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseMeteoLt, loadMeteoLt, METEO_LT_URL, METEO_LT_SITE } from '../server/meteoLt.js'
import { initialBindings } from '../server/sourceRegistry.js'
import { extractObservation } from '../server/observations.js'
import { checkSource } from '../server/sourceHealth.js'
import { observedWaterTemperature } from '../src/observedWaterTemperature.js'
const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/meteo-lt-palangos.json', import.meta.url)))
const now = Date.parse('2026-10-13T08:00:00Z')
const location = { id: METEO_LT_SITE.locationId, name: 'BENDROJO PLIAZO', waterType: 'coastal', latitude: 55.92, longitude: 21.049 }
const binding = initialBindings(location).find(b => b.data_type === 'temperature')
const parse = d => parseMeteoLt(d, METEO_LT_SITE, now)

test('Meteo LT preserves UTC measured station data and binds only the reviewed beach', () => {
  const d = fixture(); d.observations.reverse()
  const p = parse(d)
  assert.equal(p.stations[0].temperature, 13.9)
  assert.equal(p.publishedAt, '2026-10-13T07:00:00.000Z')
  assert.equal(p.stations[0].measurementKind, 'measured')
  for (const changed of [{ id: 'another-beach' }, { waterType: 'lake' }, { longitude: 21.1 }]) {
    assert.equal(initialBindings({ ...location, ...changed }).some(b => b.target.source.adapter === 'meteo_lt_temperature'), false)
  }
  const zero = fixture(); zero.observations.forEach(o => { o.waterTemperature = 0 })
  assert.equal(parse(zero).stations[0].temperature, 0)
})

test('Meteo LT rejects wrong waterbody, moved stations and invalid or missing latest measurements', () => {
  for (const mutate of [d => { d.station.waterBody = 'Kuršių marios' },
    d => { d.station.coordinates.longitude += 0.01 }, d => { d.station.code = 'other' },
    d => { d.observations = [] }, d => d.observations.push(d.observations[0]),
    d => { d.observations[1].waterTemperature = null },
    d => { d.observations[1].waterTemperature = '13.9' },
    d => { d.observations[1].observationTimeUtc = '2026-10-13 09:00:00' },
    d => { d.observations[1].observationTimeUtc = '2026-02-30 07:00:00' },
    d => { d.observations[1].observationTimeUtc = '2026-10-13T07:00:00Z' }]) {
    const d = fixture(); mutate(d); assert.throws(() => parse(d))
  }
})

test('Meteo LT station temperature reaches evaluation; stale and mismatched waterbody do not', () => {
  const payload = parse(fixture())
  const state = { status: 'healthy', checked_at: new Date(now).toISOString(), payload }
  const item = extractObservation(binding, state, now)
  assert.equal(observedWaterTemperature(location, { locationId: location.id, items: [item] }, now).regional, false)
  assert.equal(item.status, 'available'); assert.equal(item.distanceMetres, 295)
  assert.equal(observedWaterTemperature(location, { locationId: location.id, items: [item] }, now).temperature, 13.9)
  for (const update of [{ status: 'unavailable' }, { checked_at: '2026-10-12T08:00:00Z' },
    { payload: { ...payload, stations: [{ ...payload.stations[0], publishedAt: '2026-10-12T08:00:00Z' }] } }]) {
    const old = extractObservation(binding, { ...state, ...update }, now)
    assert.equal(old.status, 'stale')
    assert.equal(observedWaterTemperature(location, { locationId: location.id, items: [old] }, now), null)
  }
  const wrong = extractObservation(binding, { ...state, payload: { ...payload, stations: [{ ...payload.stations[0], waterBody: 'Kuršių marios' }] } }, now)
  assert.equal(wrong.status, 'unmatched'); assert.deepEqual(wrong.stations, [])
})

test('Meteo LT collector uses one shared read and reports provider failures', async () => {
  await assert.rejects(loadMeteoLt(async () => ({ ok: false, status: 503 })))
  await assert.rejects(loadMeteoLt(async () => { throw new Error('timeout') }))
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async url => { calls++; assert.equal(url, METEO_LT_URL); return { ok: true, json: async () => fixture() } }
  try {
    const r = await checkSource(binding.target.source)
    assert.equal(r.check_kind, 'observations'); assert.equal(calls, 1)
    assert.equal(r.payload.stations[0].id, 'palangos-vms')
  } finally { globalThis.fetch = original }
})
