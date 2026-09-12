import process from 'node:process'
import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { estimateSeaBearing, normalizeBearing } from '../scripts/lib/shore-orientation.mjs'
import { withShoreOrientation } from '../src/shoreOrientations.js'
import dataset from '../public/data/shore-orientations.json' with { type: 'json' }
import { getLocation, getMapCatalogue } from '../server/catalogue.js'
import { getWindAssessment } from '../src/safety.js'
import { shoreWindDirection } from '../src/locationUtils.js'
const site = { latitude: 0, longitude: 0, waterType: 'coastal' }
const way = points => ({ type: 'way', id: 1, tags: { natural: 'coastline' }, geometry: points.map(([lon,lat])=>({lon,lat})) })
test('directed local coastline normals and wraparound follow meteorological wind convention', () => {
  for (const [points, expected] of [
    [[[0,-.002],[0,.002]],90], [[[-.002,0],[.002,0]],180],
    [[[0,.002],[0,-.002]],270], [[[.002,0],[-.002,0]],0],
  ]) {
    assert.equal(estimateSeaBearing(site,[way(points)]).seaBearing,expected)
    assert.equal(shoreWindDirection((expected+180)%360,expected),'offshore')
    assert.equal(shoreWindDirection(expected,expected),'onshore')
  }
  assert.equal(normalizeBearing(360),0)
  assert.equal(normalizeBearing(-1),359)
  assert.equal(shoreWindDirection(359,0),'onshore')
})
test('lakes, unavailable geometries and competing shores cannot supply a coastal bearing', () => {
  assert.equal(estimateSeaBearing({...site,waterType:'lake'},[]).reason,'not-coastal')
  assert.equal(estimateSeaBearing(site,[]).reason,'no-local-coastline')
  assert.equal(estimateSeaBearing({...site,latitude:NaN},[]).reason,'invalid-coordinate')
  assert.equal(estimateSeaBearing(site,[way([[0,-.002],[0,.002]]),way([[.0001,.002],[.0001,-.002]])]).reason,'complex-local-coastline')
})
test('reviewed overrides require exact identity, coordinates, water type and preserve north-facing manual records', () => {
  const record=dataset.locations[0], location={...record,id:record.locationId,waterType:'coastal',seaBearing:null}
  assert.equal(withShoreOrientation(location).seaBearing,record.seaBearing)
  for (const change of [{id:'different'},{waterType:'lake'},{waterType:'river'},{latitude:location.latitude+.01},{latitude:NaN},{seaBearing:0}]) {
    const changed={...location,...change}
    assert.equal(withShoreOrientation(changed,record),changed)
  }
})
test('all reviewed bearings reach detail and map APIs and remove the missing-orientation assessment',async () => {
  const map=await getMapCatalogue()
  for (const record of dataset.locations) {
    const location=await getLocation(record.locationId)
    assert.equal(location.seaBearing,record.seaBearing)
    assert.equal(location.shoreOrientation.estimated,true)
    assert.equal(map.find(l=>l.id===record.locationId).seaBearing,record.seaBearing)
    const wind=getWindAssessment({windSpeed:5,gusts:8,windDirection:record.seaBearing},location,'live')
    assert.ok(!wind.missingFields.includes('shoreOrientation'))
  }
})
test('database detail and paginated map search retain authoritative shoreline metadata', async t => {
  const saved={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY}
  process.env.SUPABASE_URL='https://catalogue.example.invalid'
  process.env.SUPABASE_SECRET_KEY='test-only'
  t.after(()=>{
    if(saved.url===undefined)delete process.env.SUPABASE_URL;else process.env.SUPABASE_URL=saved.url
    if(saved.key===undefined)delete process.env.SUPABASE_SECRET_KEY;else process.env.SUPABASE_SECRET_KEY=saved.key
  })
  const row={id:'db-only',name:'DB coast',nation:'Italy',latitude:1,longitude:2,water_type:'coastal',metadata:{seaBearing:0,shoreOrientation:{reviewed:true}}}
  t.mock.method(globalThis,'fetch',async input=>{
    const u=new URL(input)
    if(u.pathname.endsWith('/locations')){
      if(u.searchParams.has('select')) {
        assert.match(u.searchParams.get('select'),/seaBearing:metadata->seaBearing/)
        assert.match(u.searchParams.get('select'),/shoreOrientation:metadata->shoreOrientation/)
        return globalThis.Response.json(u.searchParams.has('id')?[]:[{...row,...row.metadata}])
      }
      return globalThis.Response.json([row])
    }
    return globalThis.Response.json([])
  })
  const api=await import('../server/catalogue.js?shore-db-test')
  assert.equal((await api.getLocation('db-only')).seaBearing,0)
  assert.equal((await api.getMapCatalogue())[0].seaBearing,0)
  assert.deepEqual((await api.getMapCatalogue())[0].shoreOrientation,{reviewed:true})
})
