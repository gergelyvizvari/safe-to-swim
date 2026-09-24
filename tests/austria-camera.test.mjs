import test from 'node:test'
import assert from 'node:assert/strict'
import { getWebcamsForLocation } from '../src/webcamSources.js'
const id='alte-donau-yachtclub-seewind'
const camera=site=>getWebcamsForLocation(site).find(c=>c.id===id)
const upper={id:'eea-AT1300002100010010',waterType:'lake',latitude:48.2506,longitude:16.4033}
test('Seewind is a labelled nearby upper-lake shore view with distance and external fallback',()=>{
 const c=camera(upper);assert.ok(c);assert.equal(c.coverage,'nearby-shore');assert.ok(c.distance>.6&&c.distance<.9)
 assert.equal(c.verifiedOn,'2026-09-24');assert.equal(c.streams,undefined);assert.match(c.pageUrl,/yachtclub-seewind.at\/main\/wetter\/webcam\/$/)
 assert.ok(camera({...upper,id:'eea-AT1300002200010060',latitude:48.2439,longitude:16.4192}))
})
test('Nearby lower-lake, Neue Donau, changed water type and missing location never inherit the camera',()=>{
 for(const site of [{...upper,id:'eea-AT1300002200010030'},{...upper,id:'nearby-new-danube'},{...upper,waterType:'coastal'},{...upper,id:undefined},{...upper,latitude:47,longitude:15}])assert.equal(camera(site),undefined)
 assert.deepEqual(getWebcamsForLocation(null),[])
})
