import test from 'node:test'
import assert from 'node:assert/strict'
import { observedWaterTemperature } from '../src/observedWaterTemperature.js'
const now = Date.parse('2026-09-09T11:00:00Z')
const location = { id: 'siofok', name: 'BALATON SIOFOK ARANYPART' }
const item = { type: 'temperature', status: 'available', publishedAt: '2026-09-09T06:30:00Z', staleSeconds: 86400, stations: [{station:'Siófok',temperature:21},{station:'Tihanyrév',temperature:23},{station:'Balatonakali',temperature:null}] }
const observations = { locationId: location.id, items: [item] }
test('uses the named station or an explicit average of available source stations', () => {
  assert.equal(observedWaterTemperature(location, observations, now).temperature, 21)
  const regional = observedWaterTemperature({...location,name:'BALATON CSOPAK'}, observations, now)
  assert.deepEqual([regional.temperature,regional.regional,regional.stations.length], [22,true,2])
})
test('rejects mismatched, failed, stale, undated and missing measurements', () => {
  assert.equal(observedWaterTemperature(location,{...observations,locationId:'other'},now),null)
  assert.equal(observedWaterTemperature(location,{...observations,error:true},now),null)
  for (const patch of [{status:'stale'},{publishedAt:null},{publishedAt:'2026-09-07T00:00:00Z'},{stations:[{station:'Siófok',temperature:null}]}]) {
    assert.equal(observedWaterTemperature(location,{...observations,items:[{...item,...patch}]},now),null)
  }
})
