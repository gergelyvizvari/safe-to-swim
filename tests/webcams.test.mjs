import test from 'node:test'
import assert from 'node:assert/strict'
import { VERIFIED_WEBCAMS,getWebcamsForLocation,getWebcamForLocation } from '../src/webcamSources.js'

test('Balaton has multiple geolocated source links ordered by actual distance',()=>{
  const location={name:'BALATON BADACSONY STRAND',nation:'Hungary',countryCode:'HU',latitude:46.7882,longitude:17.5075,waterType:'lake'}
  const cameras=getWebcamsForLocation(location)
  assert.ok(cameras.length>3)
  assert.equal(cameras[0].id,'idokep-badacsony_strand')
  assert.ok(cameras.every((camera,i)=>camera.distance<=20 && (!i || camera.distance>=cameras[i-1].distance)))
  assert.ok(cameras.every(camera=>camera.pageUrl.startsWith('https://www.idokep.hu/webkamera/')&&camera.verifiedOn))
  assert.equal(new Set(VERIFIED_WEBCAMS.map(c=>c.id)).size,VERIFIED_WEBCAMS.length)
})
test('camera lookup preserves UK streams and leaves distant locations empty',()=>{
  assert.ok(getWebcamForLocation({latitude:50.8211,longitude:-0.1495}).streams.length===2)
  assert.equal(getWebcamsForLocation({latitude:60,longitude:25}).length,0)
  assert.equal(getWebcamsForLocation(null).length,0)
})
