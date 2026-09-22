import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseEaSamples } from '../server/eaSamples.js'
import { EA_BRIGHTON_SITES } from '../server/eaBrightonSites.js'
import { initialBindings } from '../server/sourceRegistry.js'
import { extractObservation } from '../server/observations.js'
const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/ea-brighton-latest.json', import.meta.url)))
const location = EA_BRIGHTON_SITES.find(s => s.name === 'Brighton Central')
const binding = () => initialBindings({ ...location, id: location.locationId, waterType: 'coastal' }).find(b => b.data_type === 'quality')
test('EA regional collection preserves censored lab counts and excludes unassigned historical Newhaven', () => {
  const payload = parseEaSamples(fixture())
  assert.equal(payload.sites.length,13)
  const sample = payload.sites.find(s => s.id === location.externalId)
  assert.equal(sample.sampledOn,'2026-09-10')
  assert.equal(sample.result,'unknown')
  assert.deepEqual(sample.counts[0],{key:'escherichiaColi',value:10,qualifier:'<'})
  assert.equal(payload.publishedAt,undefined)
})
test('EA identity and age remain site-specific; healthy collection does not refresh an old sample', () => {
  const now=Date.parse('2026-09-22T12:00:00Z'), payload=parseEaSamples(fixture())
  const state={status:'healthy',checked_at:new Date(now).toISOString(),payload}
  const observation=extractObservation(binding(),state,now)
  assert.equal(observation.status,'stale')
  assert.equal(observation.sample.sampledOn,'2026-09-10')
  assert.match(observation.url,/site=ukj2100-14950$/)
  assert.equal(extractObservation(binding(),undefined,now).status,'unavailable')
  const wrong=JSON.parse(JSON.stringify(state));wrong.payload.sites.find(s=>s.id===location.externalId).longitude+=.001
  assert.equal(extractObservation(binding(),wrong,now).status,'unmatched')
  assert.equal(initialBindings({...location,id:location.locationId,waterType:'lake'}).some(b=>b.data_type==='quality'),false)
})
test('EA collector rejects pagination, missing counts, unknown qualifiers, duplicate and withdrawn samples', () => {
  for(const mutate of [j=>j.result.next='page2',j=>delete j.result.items[0].intestinalEnterococciCount,j=>j.result.items[0].intestinalEnterococciQualifier.countQualifierNotation='?',j=>j.result.items.push(j.result.items[0]),j=>j.result.items[0].recordStatus='withdrawal']) {
    const data=fixture();mutate(data);assert.throws(()=>parseEaSamples(data))
  }
})
