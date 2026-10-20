import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseUiras, loadUiras, UIRAS_URL } from '../server/uiras.js'
import { initialBindings } from '../server/sourceRegistry.js'
import { extractObservation } from '../server/observations.js'
import { checkSource } from '../server/sourceHealth.js'
import { observedWaterTemperature } from '../src/observedWaterTemperature.js'
const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/uiras-vetokannas.json', import.meta.url)))
const now = Date.parse('2026-10-09T08:00:00Z')
const location = { id: 'eea-FI181092003', name: 'VETOKANNAS', waterType: 'lake', latitude: 60.27, longitude: 24.8811 }
const binding = initialBindings(location).find(b => b.data_type === 'temperature')

test('UiRaS preserves measured water temperature, offset timestamp and exact sensor identity', () => {
  const p = parseUiras(fixture(), now)
  assert.equal(p.stations[0].temperature, 12.25)
  assert.equal(p.publishedAt, '2026-10-09T07:36:17.249Z')
  assert.equal(p.stations[0].measurementKind, 'measured')
  for (const changed of [{ id: 'another-beach' }, { waterType: 'coastal' }, { longitude: 25 }]) {
    assert.equal(initialBindings({ ...location, ...changed }).some(b => b.data_type === 'temperature'), false)
  }
})

test('UiRaS rejects moved/duplicate sensors, missing data, nonnumeric and future measurements', () => {
  for (const mutate of [d => { d.features = [] }, d => d.features.push(d.features[0]),
    d => { d.features[0].geometry.coordinates[0] += 0.1 },
    d => { d.features[0].properties.name = 'Another lake' },
    d => { d.features[0].properties.measurement.temp_water = null },
    d => { d.features[0].properties.measurement.temp_water = '12.25' },
    d => { d.features[0].properties.measurement.time = '2026-10-10T08:00:00Z' },
    d => { d.features[0].properties.measurement.time = '2026-10-09T07:00:00' }]) {
    const data = fixture(); mutate(data); assert.throws(() => parseUiras(data, now))
  }
  const data = fixture(); data.features[0].properties.measurement.temp_water = 0
  assert.equal(parseUiras(data, now).stations[0].temperature, 0)
})

test('UiRaS observation flows to temperature UI but old, failed and mismatched data do not', () => {
  const payload = parseUiras(fixture(), now)
  const state = { status: 'healthy', checked_at: new Date(now).toISOString(), payload }
  const item = extractObservation(binding, state, now)
  assert.equal(item.status, 'available'); assert.equal(item.distanceMetres, 42)
  assert.equal(observedWaterTemperature(location, { locationId: location.id, items: [item] }, now).temperature, 12.25)
  for (const update of [{ status: 'unavailable' }, { checked_at: '2026-10-08T08:00:00Z' },
    { payload: { ...payload, publishedAt: new Date(now).toISOString(), stations: [{ ...payload.stations[0], publishedAt: '2026-10-08T08:00:00Z' }] } }]) {
    const old = extractObservation(binding, { ...state, ...update }, now)
    assert.equal(old.status, 'stale')
    assert.equal(observedWaterTemperature(location, { locationId: location.id, items: [old] }, now), null)
  }
  const wrong = extractObservation({ ...binding, target: { ...binding.target, external_id: 'other' } }, state, now)
  assert.equal(wrong.status, 'unmatched'); assert.deepEqual(wrong.stations, [])
})

test('UiRaS collector fetches shared endpoint and handles provider failure', async () => {
  await assert.rejects(loadUiras(async () => ({ ok: false, status: 503 })))
  await assert.rejects(loadUiras(async () => { throw new Error('timeout') }))
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async url => { calls++; assert.equal(url, UIRAS_URL); return { ok: true, json: async () => fixture() } }
  try {
    const r = await checkSource(binding.target.source)
    assert.equal(r.check_kind, 'observations'); assert.equal(calls, 1)
    assert.equal(r.payload.stations[0].id, binding.target.external_id)
  } finally { globalThis.fetch = original }
})

test('UiRaS coastal sensors bind only exact beaches, preserving distinct distances and sample times', () => {
  const data = JSON.parse(readFileSync(new URL('./fixtures/uiras-helsinki-coastal.json', import.meta.url)))
  const time = Date.parse('2026-10-20T11:00:00Z')
  const payload = parseUiras(data, time)
  const sites = [
    { id: 'eea-FI110910019', waterType: 'coastal', latitude: 60.2076, longitude: 25.1149, distance: 42, temperature: 8.93 },
    { id: 'eea-FI110910006', waterType: 'coastal', latitude: 60.1986, longitude: 25.0759, distance: 33, temperature: 9.81 },
  ]
  for (const site of sites) {
    const b = initialBindings(site).find(b => b.data_type === 'temperature')
    const item = extractObservation(b, { status: 'healthy', checked_at: new Date(time).toISOString(), payload }, time)
    assert.equal(item.status, 'available')
    assert.equal(item.distanceMetres, site.distance)
    assert.equal(observedWaterTemperature(site, { locationId: site.id, items: [item] }, time).temperature, site.temperature)
    for (const changed of [{ waterType: 'lake' }, { id: 'nearby-beach' }, { latitude: site.latitude + 0.01 }]) {
      assert.equal(initialBindings({ ...site, ...changed }).some(b => b.data_type === 'temperature'), false)
    }
  }
  // A fresh second sensor must not refresh the first sensor's stale/missing reading.
  data.features[0].properties.measurement.time = '2026-10-19T10:00:00Z'
  let b = initialBindings(sites[0]).find(b => b.data_type === 'temperature')
  let item = extractObservation(b, { status: 'healthy', checked_at: new Date(time).toISOString(), payload: parseUiras(data, time) }, time)
  assert.equal(item.status, 'stale')
  data.features[0].properties.measurement = null
  item = extractObservation(b, { status: 'healthy', checked_at: new Date(time).toISOString(), payload: parseUiras(data, time) }, time)
  assert.equal(item.status, 'unmatched')
  // The retired Marjaniemi ID must not substitute for the reviewed replacement.
  data.features[1].id = 'retired-sensor'
  assert.throws(() => parseUiras(data, time), /Missing/)
})
