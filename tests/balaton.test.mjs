import test from 'node:test'
import { URL } from 'node:url'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseTemperature, parseStorm, parseWind, parseQuality, budapestTime } from '../server/balatonSources.js'
import { getBalatonData, matchQuality } from '../server/balatonService.js'
import { isBalaton, isObservationStale } from '../src/balaton.js'
import { balatonMessages } from '../src/balatonMessages.js'
import { findCoastalLocation } from '../src/coastalLocations.js'
const fixture = key => readFileSync(new URL(`./fixtures/balaton-${key}.html`, import.meta.url), 'utf8')

test('temperature only uses Balaton stations, preserves missing readings and converts Budapest publication time', () => {
  const result = parseTemperature(fixture('temperature'))
  assert.equal(result.stations.length, 3)
  assert.deepEqual(result.stations[1], { station: 'Balatonakali', temperature: null })
  assert.equal(result.publishedAt, '2026-09-07T07:40:00.000Z')
  assert.equal(budapestTime('2026','01','07','09','40'), '2026-01-07T08:40:00.000Z')
  assert.throws(() => parseTemperature('<html>maintenance</html>'))
})

test('storm state uses validated basin headers and icons; unknown icons never mean no warning', () => {
  const html = fixture('storm')
  assert.deepEqual(parseStorm(html).basins.map(x => x.level), [0, 0, 0])
  assert.equal(parseStorm(html.replace('viharjelzes0.png', 'viharjelzes2.png')).basins[0].level, 2)
  assert.equal(parseStorm(html.replace('viharjelzes0.png', 'offline.png')).basins[0].level, null)
  assert.throws(() => parseStorm(html.replace('Nyugati medence', 'Changed basin')))
  assert.throws(() => parseStorm(html.replace('2026-09-07 16 16:32 UTC', 'no timestamp')))
})

test('measured wind distinguishes gusts from mean wind and keeps UTC time', () => {
  const result = parseWind(fixture('wind'))
  assert.deepEqual(result.stations[0], { station: 'Balatonaliga', gustKmh: 11, windKmh: 7 })
  assert.equal(result.publishedAt, '2026-09-07T17:46:00Z')
})

test('water samples match verified site identities, never adjacent beaches or annual classes', () => {
  const {sites} = parseQuality(fixture('quality'))
  const esterhazy = sites.find(x => x.name.includes('Esterházy'))
  assert.equal(esterhazy.result, 'pass')
  assert.match(esterhazy.sampledOn, /^2026-/)
  assert.equal(matchQuality('eea-HUBW_01987', sites), null)
  assert.equal(matchQuality('eea-HUBW_01935', sites), null)
  const matchedId = 'eea-HUBW_01930'
  assert.equal(matchQuality(matchedId, sites), esterhazy)
  assert.equal(matchQuality(matchedId, [esterhazy, esterhazy]), null)
  assert.equal(matchQuality(matchedId, [{...esterhazy, latitude: esterhazy.latitude + 0.01}]), null)
  assert.equal(parseQuality(fixture('quality').replaceAll('megfelelő', 'nem megfelelő')).sites[0].result, 'fail')
})

test('individual source failures do not suppress other observations; invalid sites never fetch', async () => {
  const loader = async key => { if (key === 'wind') throw Error('offline'); return key === 'quality' ? { sites: [] } : { stations: [], basins: [] } }
  const data = await getBalatonData('eea-HUBW_01901', loader)
  assert.equal(data.wind.status, 'unavailable')
  assert.equal(data.temperature.status, 'available')
  assert.equal(data.quality.status, 'unmatched')
  assert.equal(await getBalatonData('brighton', () => { throw Error('must not fetch') }), null)
})

test('freshness is based on source time and future or undated data stay unknown', () => {
  const now = Date.parse('2026-09-07T12:00:00Z')
  assert.equal(isObservationStale('2026-09-07T11:50:00Z', 1800000, now), false)
  for (const value of [null, 'bad', '2026-09-06T12:00:00Z', '2026-09-08T12:00:00Z']) assert.equal(isObservationStale(value,1800000,now), true)
  assert.equal(isBalaton(findCoastalLocation('sepa-200305')), false)
  assert.equal(isBalaton(findCoastalLocation('eea-HUBW_01901')), true)
  for (const lang of ['hu','en','fr','it','es']) for (const value of Object.values(balatonMessages(lang))) assert.ok(typeof value === 'string' && value.length)
})

test('API rejects mutations and non-Balaton locations without caching the response', async () => {
  const { default: handler } = await import('../api/balaton.js')
  const response = () => ({ headers: {}, setHeader(key,value) { this.headers[key] = value }, status(code) { this.code = code; return this }, json(body) { this.body = body } })
  const mutation = response()
  await handler({ method: 'POST', url: '/api/balaton?location=eea-HUBW_01930' }, mutation)
  assert.equal(mutation.code, 405)
  assert.equal(mutation.headers.Allow, 'GET')
  const invalid = response()
  await handler({ method: 'GET', url: '/api/balaton?location=brighton' }, invalid)
  assert.equal(invalid.code, 400)
  assert.equal(invalid.headers['Cache-Control'], 'no-store')
})
