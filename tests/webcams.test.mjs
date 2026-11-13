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
  assert.ok(getWebcamForLocation({id:'brighton',waterType:'coastal',latitude:50.8211,longitude:-0.1495}).streams.length===2)
  assert.equal(getWebcamsForLocation({latitude:60,longitude:25}).length,0)
  assert.equal(getWebcamsForLocation(null).length,0)
})

test('Annecy panorama is a source link for reviewed lake sites, never a nearby-waterbody substitute',()=>{
  const point={latitude:45.90424,longitude:6.14754,waterType:'lake',id:'eea-FRK2874010D074220'}
  const [camera]=getWebcamsForLocation(point)
  assert.equal(camera.id,'fr-annecy-albigny-panorama')
  assert.equal(camera.coverage,'nearby-shore')
  assert.ok(camera.distance>0.2 && camera.distance<0.3)
  assert.ok(camera.pageUrl.startsWith('https://app.webcam-hd.com/'))
  assert.equal(camera.streams,undefined) // External link; no stale thumbnail or unlicensed embed.
  assert.deepEqual(getWebcamsForLocation({...point,id:'different-lake'}),[])
  assert.deepEqual(getWebcamsForLocation({...point,waterType:'coastal'}),[])
  assert.deepEqual(getWebcamsForLocation({...point,id:undefined}),[])
})

test('Apelviken shore camera is limited to its reviewed bay and keeps external fallback',()=>{
  const point={id:'eea-SE0A11383000000633',latitude:57.0837,longitude:12.2556,waterType:'coastal'}
  const [camera]=getWebcamsForLocation(point)
  assert.equal(camera.id,'se-apelviken-solviken')
  assert.equal(camera.coverage,'nearby-shore')
  assert.ok(camera.distance>0.4 && camera.distance<0.5)
  assert.equal(camera.pageUrl,'https://www.apelviken.se/webbkamera')
  assert.equal(camera.streams,undefined)
  assert.equal(camera.imageUrl,undefined)
  assert.deepEqual(getWebcamsForLocation({...point,id:'eea-SE0A11383000000632'}),[])
  assert.deepEqual(getWebcamsForLocation({...point,waterType:'lake'}),[])
  assert.deepEqual(getWebcamsForLocation({...point,id:undefined}),[])
})

test('De Toko stays an external nearby North Sea view for its reviewed site only', () => {
  const site = { id: 'eea-NLBW95_CALLOBSD', latitude: 52.83562, longitude: 4.68891, waterType: 'coastal' }
  const camera = getWebcamForLocation(site)
  assert.equal(camera.id, 'nl-callantsoog-de-toko')
  assert.equal(camera.coverage, 'nearby-shore')
  assert.ok(camera.distance > 0.08 && camera.distance < 0.1)
  assert.equal(camera.pageUrl, 'https://www.strandpaviljoendetoko.nl/webcam/')
  assert.equal(camera.streams, undefined)
  assert.equal(camera.imageUrl, undefined)
  for (const changed of [{ ...site, waterType: 'lake' }, { ...site, id: 'eea-NLBW95_GROOTKTBSD' }]) {
    assert.ok(!getWebcamsForLocation(changed).some(c => c.id === camera.id))
  }
})

test('Trassenheide links the rescue tower camera only at the main Baltic beach', () => {
  const site = { id: 'eea-DEMV_PR_1_0701', waterType: 'coastal', latitude: 54.0967, longitude: 13.8805 }
  const camera = getWebcamForLocation(site)
  assert.equal(camera.id, 'de-trassenheide-rettungsturm')
  assert.equal(camera.coverage, 'beach')
  assert.ok(camera.distance < 0.05)
  assert.equal(camera.pageUrl, 'https://www.wetter-trassenheide.de/template/trassenheide/webcamstrand/webcam_strand/index.php')
  assert.equal(camera.streams, undefined)
  assert.equal(camera.imageUrl, undefined)
  assert.deepEqual(getWebcamsForLocation({ ...site, id: 'eea-DEMV_PR_1_0740' }), [])
  assert.deepEqual(getWebcamsForLocation({ ...site, waterType: 'lake' }), [])
})

test('UK camera matches require a reviewed coastal identity, never proximity alone', () => {
  for (const camera of VERIFIED_WEBCAMS.filter(c => c.checkedOn === '2026-11-13')) {
    const point = { id: camera.locationIds[0], waterType: 'coastal', latitude: camera.latitude, longitude: camera.longitude }
    assert.ok(getWebcamsForLocation(point).some(c => c.id === camera.id))
    for (const changed of [{ ...point, id: 'unreviewed-neighbour' }, { ...point, id: undefined }, { ...point, waterType: 'lake' }]) {
      assert.ok(!getWebcamsForLocation(changed).some(c => c.id === camera.id))
    }
  }
  assert.deepEqual(getWebcamsForLocation({ id: 'st-andrews-west', waterType: 'coastal', latitude: 56.34734, longitude: -2.80507 }), [])
  assert.deepEqual(getWebcamsForLocation({ id: 'portrush-east', waterType: 'coastal', latitude: 55.20652, longitude: -6.61332 }), [])
})

test('Sidmouth camera links keep separate beaches, approximate distances and no unlicensed player', () => {
  const town = { id: 'ea-ukk4301-21800', waterType: 'coastal', latitude: 50.6761847, longitude: -3.243034 }
  const jacobs = { ...town, id: 'ea-ukk4301-21900', latitude: 50.675251, longitude: -3.24792 }
  assert.deepEqual(getWebcamsForLocation(town).map(c => c.id), ['uk-sidmouth-esplanade', 'uk-sidmouth-port-royal'])
  assert.deepEqual(getWebcamsForLocation(jacobs).map(c => c.id), ['uk-sidmouth-jacobs-ladder'])
  for (const camera of [...getWebcamsForLocation(town), ...getWebcamsForLocation(jacobs)]) {
    assert.equal(camera.verification, 'verified')
    assert.equal(camera.approximateCoordinates, true)
    assert.ok(camera.distance > 0 && camera.distance < 1)
    assert.equal(camera.streams, undefined)
    assert.equal(camera.imageUrl, undefined)
    assert.ok(camera.pageUrl.startsWith('https://sidmouth.gov.uk/webcams/'))
  }
  assert.deepEqual(getWebcamsForLocation(town, 0.01), [])
})

test('uncertain freshness retains operator links without verification dates or invented images', () => {
  for (const c of VERIFIED_WEBCAMS.filter(c => c.verification === 'unconfirmed')) {
    assert.equal(c.verifiedOn, undefined)
    assert.ok(c.pageUrl.startsWith('https://'))
    assert.equal(c.imageUrl, undefined)
  }
  assert.equal(VERIFIED_WEBCAMS.find(c => c.id === 'fistral-beach').pageUrl, 'https://fistralbeach.co.uk/fistral-beach-webcam/')
})


test('legacy UK detail responses retain official coastal type without overriding an explicit lake type', () => {
  const detail = { id: 'fistral', latitude: 50.4182891, longitude: -5.1003122, waterQuality: { site: { waterType: 'coastal' } } }
  assert.equal(getWebcamForLocation(detail).id, 'fistral-beach')
  assert.deepEqual(getWebcamsForLocation({ ...detail, waterType: 'lake' }), [])
})
