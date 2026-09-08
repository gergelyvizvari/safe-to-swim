import { URLSearchParams } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSearch, searchCatalogue, getLocation } from '../server/catalogue.js'
import { buildImport } from '../scripts/import-catalogue.mjs'
import { extractObservation } from '../server/observations.js'
import { authorized } from '../api/source-checks.js'
import { SOURCES } from '../server/sourceRegistry.js'
import { getSafety } from '../src/safety.js'

test('catalogue validates bounded pagination, paired coordinates and viewport bounds', () => {
  for (const query of ['kind=river','limit=501','offset=-1','limit=2.5','west=0','west=10&east=0&south=0&north=10','lat=42','lat=&lon=0','lat=91&lon=0']) {
    assert.throws(() => parseSearch(new URLSearchParams(query)), query)
  }
  assert.equal(parseSearch(new URLSearchParams('kind=lake&limit=20')).page_size,20)
})

test('search supports diacritics, country/type filters and stable nonoverlapping pages', async () => {
  const first = await searchCatalogue(parseSearch(new URLSearchParams('q=balaton&kind=lake&country=Hungary&limit=10')))
  const second = await searchCatalogue(parseSearch(new URLSearchParams('q=balaton&kind=lake&country=Hungary&limit=10&offset=10')))
  assert.ok(first.total > 100)
  assert.equal(first.total,second.total)
  assert.equal(new Set([...first.items,...second.items].map(l=>l.id)).size,20)
  assert.ok(first.items.every(l=>l.waterType==='lake' && l.nation==='Hungary'))
  const accented = await searchCatalogue(parseSearch(new URLSearchParams('q=fured')))
  assert.ok(accented.items.some(l=>/FÜRED|FURED/i.test(l.name)))
})

test('viewport and nearest queries are spatial; unknown IDs do not silently select Brighton', async () => {
  const near = await searchCatalogue(parseSearch(new URLSearchParams('lat=50.8159&lon=-0.1287&limit=1')))
  assert.equal(near.items[0].id,'brighton')
  const bounds = await searchCatalogue(parseSearch(new URLSearchParams('west=-1&east=0&south=50&north=51')))
  assert.ok(bounds.items.every(l=>l.longitude >= -1 && l.longitude <= 0 && l.latitude >=50 && l.latitude<=51))
  assert.equal(await getLocation('not-a-location'),null)
  const brighton = await getLocation('brighton')
  assert.ok(brighton.sources.some(s=>s.type==='weather'))
  assert.ok(brighton.waterQuality.site.source)
})

test('import preserves all IDs and references, shares targets, and never gives lakes marine bindings', () => {
  const tables = buildImport()
  const locations = new Map(tables.locations.map(l=>[l.id,l]))
  const targets = new Map(tables.source_targets.map(t=>[t.id,t]))
  assert.equal(locations.size,tables.locations.length)
  assert.ok(locations.size > 21000)
  assert.equal(targets.size,tables.source_targets.length)
  const sources = new Set(tables.data_sources.map(s=>s.id))
  for (const b of tables.location_sources) {
    assert.ok(locations.has(b.location_id))
    assert.ok(targets.has(b.target_id))
    assert.ok(sources.has(targets.get(b.target_id).source_id))
    if (locations.get(b.location_id).water_type === 'lake') assert.notEqual(b.data_type,'marine')
  }
  assert.equal(tables.source_targets.filter(t=>t.source_id==='official-storm').length,1)
  assert.ok(tables.location_sources.filter(b=>b.data_type==='storm').length > 100)
})

const binding = (type, config = {}) => ({ data_type:type, target:{ id:'test', external_id:'Station A', label:'Regional observations', coverage_type:'water_body', config, source:SOURCES.find(s=>s.id===`official-${type}`) } })

test('observation normalization distinguishes stale publications and failed checks from retrieval time', () => {
  const now = Date.parse('2026-09-08T12:00:00Z')
  const state = { status:'healthy', checked_at:new Date(now).toISOString(), payload:{ publishedAt:'2026-09-08T11:55:00Z', stations:[{station:'Station A', windKmh:12}] } }
  assert.equal(extractObservation(binding('wind'),state,now).status,'available')
  assert.equal(extractObservation(binding('wind'),{...state,status:'unavailable'},now).status,'stale')
  assert.equal(extractObservation(binding('wind'),state,now+3600000).status,'stale')
  assert.equal(extractObservation(binding('wind'),undefined,now).status,'unavailable')
  const station = binding('wind'); station.target.coverage_type='station'
  assert.equal(extractObservation(station,state,now).stations[0].station,'Station A')
})

test('water samples require exact identity; a neighbouring or duplicate match stays unmatched', () => {
  const identity = { name:'Beach A',latitude:47,longitude:18 }
  const b = binding('quality',identity)
  const now = Date.parse('2026-09-08T12:00:00Z')
  const site = {...identity,sampledOn:'2026-09-07',result:'pass'}
  const state = sites => ({status:'healthy',checked_at:new Date(now).toISOString(),payload:{sites}})
  assert.equal(extractObservation(b,state([site]),now).status,'available')
  assert.equal(extractObservation(b,state([{...site,name:'Beach B'}]),now).status,'unmatched')
  assert.equal(extractObservation(b,state([site,site]),now).status,'unmatched')
  assert.equal(extractObservation(b,state([{...site,sampledOn:null}]),now).status,'stale')
})

test('scheduled checks require an exact nonempty server secret', () => {
  assert.equal(authorized(undefined,undefined),false)
  assert.equal(authorized('Bearer secret','secret'),true)
  assert.equal(authorized('Bearer wrong','secret'),false)
  assert.equal(authorized('secret','secret'),false)
})

test('a closed official site never gets a favourable assessment', () => {
  const result = getSafety({waveHeight:0.1,gusts:5,windSpeed:5,windDirection:180},{seaBearing:180},key=>key,'en',{quality:{site:{classification:'Closed'}}})
  assert.notEqual(result.level,'good')
})
