import { URL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCap, parseAlertFeed, regionForLocation } from '../server/weatherAlerts.js'
import { activeWeatherWarning, weatherWarningDuringInterval } from '../src/weatherAlertMessages.js'
import { getSafety } from '../src/safety.js'
import { makeTranslator } from '../src/i18n.js'
const cap=readFileSync(new URL('./fixtures/weather-warning.xml',import.meta.url),'utf8')
const feed=readFileSync(new URL('./fixtures/weather-feed.xml',import.meta.url),'utf8')
const now=Date.parse('2026-09-09T10:00:00Z')

test('warning regions use coordinates, including legacy Central Hungary code',()=>{
  assert.equal(regionForLocation({nation:'Hungary',latitude:46.95,longitude:17.89}),'HU21')
  assert.equal(regionForLocation({nation:'Hungary',latitude:46.77,longitude:17.24}),'HU22')
  assert.equal(regionForLocation({nation:'Hungary',latitude:46.90,longitude:18.05}),'HU23')
  assert.equal(regionForLocation({nation:'England',latitude:50.82,longitude:-0.13}),null)
  const central=cap.replaceAll('HU22','HU10')
  assert.equal(parseCap(central,'hu','HU11',now).length,1)
  assert.equal(parseCap(central,'hu','HU12',now).length,1)
})
test('CAP preserves source language, region and future onset; excludes expired and test messages',()=>{
  const hu=parseCap(cap,'hu','HU22',now)[0]
  assert.match(hu.event,/zivatar/)
  assert.equal(hu.area,'Nyugat-Dunántúl')
  assert.ok(Date.parse(hu.startsAt)>now)
  assert.match(parseCap(cap,'fr','HU22',now)[0].event,/thunderstorm/)
  assert.equal(parseCap(cap,'hu','HU21',now).length,0)
  assert.equal(parseCap(cap,'hu','HU22',Date.parse(hu.expiresAt)).length,0)
  for(const changed of [cap.replace('<status>Actual','<status>Test'),cap.replace('<msgType>Alert','<msgType>Cancel'),cap.replace('<scope>Public','<scope>Restricted')]) assert.equal(parseCap(changed,'hu','HU22',now).length,0)
  assert.throws(()=>parseCap(cap.replaceAll('2026-09-11T00:59:59+02:00','bad-date'),'hu','HU22',now))
})
test('invalid feeds fail rather than reporting no warnings',()=>{
  assert.ok(parseAlertFeed(feed).entries.length>0)
  assert.throws(()=>parseAlertFeed('<html>Unavailable</html>'))
})
test('only fresh active warnings for the selected location change the swim assessment',()=>{
  const warning=parseCap(cap,'hu','HU22',now)[0]
  const active=Date.parse(warning.startsAt)+60000
  const state={locationId:'test',status:'available',checkedAt:new Date(active).toISOString(),items:[warning]}
  assert.equal(activeWeatherWarning({...state,checkedAt:new Date(now).toISOString()},now,now),null)
  assert.ok(activeWeatherWarning(state,active,active))
  assert.equal(activeWeatherWarning({...state,status:'stale'},active,active),null)
  assert.equal(activeWeatherWarning(state,active,active+11*60000),null)
  const location={id:'test',waterType:'lake',marineModelSupported:false}
  const calm={time:new Date(active).toISOString(),windSpeed:2,gusts:4,weatherCode:0,windDirection:90}
  const options={now:active,source:'partial',weatherAlerts:state}
  assert.equal(getSafety(calm,location,makeTranslator('hu'),'hu-HU',options).level,'danger')
  assert.notEqual(getSafety(calm,{...location,id:'other'},makeTranslator('hu'),'hu-HU',options).level,'danger')
  assert.notEqual(getSafety(calm,location,makeTranslator('hu'),'hu-HU',{...options,weatherAlerts:{...state,status:'stale'}}).level,'danger')
})

test('API rejects invalid requests and reports unsupported locations explicitly',async()=>{
  const {default:handler}=await import('../api/weather-alerts.js')
  const call=async(url,method='GET')=>{
    const result={headers:{}}
    const response={setHeader:(key,value)=>{result.headers[key]=value},status:code=>{result.status=code;return response},json:body=>{result.body=body;return result}}
    await handler({url,method},response)
    return result
  }
  assert.equal((await call('/api/weather-alerts','POST')).status,405)
  assert.equal((await call('/api/weather-alerts?location=brighton&language=invalid')).status,400)
  assert.equal((await call('/api/weather-alerts?location=missing-id')).status,404)
  const response=await call('/api/weather-alerts?location=brighton')
  assert.equal(response.status,200)
  assert.equal(response.body.status,'unsupported')
  assert.equal(response.body.supported,false)
})


test('short warnings between hourly samples exclude the overlapping swim window',()=>{
  const state={status:'available',checkedAt:new Date(now).toISOString(),items:[{startsAt:new Date(now+30*60000).toISOString(),expiresAt:new Date(now+45*60000).toISOString(),level:2,hazard:3}]}
  assert.equal(weatherWarningDuringInterval(state,new Date(now).toISOString(),new Date(now+2*3600000).toISOString(),now),true)
  assert.equal(weatherWarningDuringInterval(state,new Date(now+3600000).toISOString(),new Date(now+2*3600000).toISOString(),now),false)
})


test('warning display follows the selected instant with inclusive onset and exclusive expiry', async () => {
  const { weatherWarningsAt } = await import('../src/weatherAlertMessages.js')
  const items = [
    { id: 'today', startsAt: '2026-09-09T00:00:00Z', expiresAt: '2026-09-10T00:00:00Z' },
    { id: 'tomorrow', startsAt: '2026-09-10T00:00:00Z', expiresAt: '2026-09-11T00:00:00Z' },
  ]
  assert.deepEqual(weatherWarningsAt(items, '2026-09-09T12:00:00Z').map(item => item.id), ['today'])
  assert.deepEqual(weatherWarningsAt(items, '2026-09-10T00:00:00Z').map(item => item.id), ['tomorrow'])
  assert.deepEqual(weatherWarningsAt(items, '2026-09-11T00:00:00Z'), [])
})
