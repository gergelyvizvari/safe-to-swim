import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeEuropeanSite } from '../scripts/generate-european-bathing-waters.mjs'
import { COASTAL_LOCATIONS, findCoastalLocation, findNearestCoastalLocation } from '../src/coastalLocations.js'
import { EUROPEAN_BATHING_WATERS } from '../src/europeanBathingWaters.generated.js'
import { getOfficialWaterUrl, getWaterQualityForLocation } from '../src/waterQuality.js'
import { normalize } from '../src/coastalData.js'
import { getSafety } from '../src/safety.js'
import { findCalmestWindow } from '../src/swimOutlook.js'
import { makeTranslator } from '../src/i18n.js'
import { buildMarineUrl, fallbackFor } from '../src/coastalData.js'

const attributes = { bathingWaterIdentifier: 'TEST', bathingWaterName: 'Beach', countryName: 'France', countryCode: 'FR', latitude: 43, longitude: 7, bwWaterCategory: 'Coastal', qualityStatus: 'Excellent' }
test('EEA import excludes rivers, invalid and non-European overseas sites', () => {
  assert.equal(normalizeEuropeanSite({ attributes })[6], 'Excellent')
  for (const patch of [{ bwWaterCategory: 'River' }, { latitude: null }, { longitude: NaN }, { latitude: -21 }, { longitude: -61 }, { bathingWaterIdentifier: '' }]) {
    assert.equal(normalizeEuropeanSite({ attributes: { ...attributes, ...patch } }), null)
  }
  assert.equal(normalizeEuropeanSite({ attributes: { ...attributes, qualityStatus: 'Not classified' } })[6], 'Unclassified')
})
test('European catalogue is substantial, unique and preserves UK deep links', () => {
  assert.ok(EUROPEAN_BATHING_WATERS.length > 14000)
  assert.equal(new Set(COASTAL_LOCATIONS.map(site => site.id)).size, COASTAL_LOCATIONS.length)
  assert.equal(findCoastalLocation('brighton').name, 'Brighton Beach')
  for (const nation of ['France', 'Spain', 'Italy', 'Greece', 'Croatia', 'Portugal', 'Ireland', 'Denmark', 'Sweden', 'Finland', 'Albania']) {
    const site = EUROPEAN_BATHING_WATERS.find(site => site.nation === nation && site.waterType === 'coastal')
    assert.ok(site, nation)
    assert.equal(findCoastalLocation(site.id), site)
    assert.ok(Math.abs(findNearestCoastalLocation(site.latitude, site.longitude).latitude - site.latitude) < 0.001)
    assert.equal(getWaterQualityForLocation(site).site, site)
    assert.match(getOfficialWaterUrl(site), /eea.europa.eu/)
    assert.equal(buildMarineUrl(site).searchParams.get('latitude'), String(site.latitude))
    assert.equal(fallbackFor(site).current.waveHeight, null)
    assert.equal(site.seaBearing, null)
    assert.equal(site.riskLevel, null)
  }
})

test('lake sites are searchable and retain water type and source data', () => {
  assert.equal(normalizeEuropeanSite({ attributes: { ...attributes, bwWaterCategory: 'Lake' } })[7], 'lake')
  const lakes = EUROPEAN_BATHING_WATERS.filter(site => site.waterType === 'lake')
  assert.ok(lakes.length > 6000)
  assert.ok(lakes.some(site => site.nation === 'Hungary' && /balaton/i.test(site.name)))
  for (const site of lakes) {
    assert.equal(site.marineModelSupported, false)
    assert.equal(getWaterQualityForLocation(site).site, site)
  }
})
test('Loch Ness is discoverable under both names and uses lake data handling', () => {
  const site = findCoastalLocation('sepa-200305')
  assert.match(site.name, /Loch Ness/)
  assert.match(site.name, /Dores/)
  assert.equal(site.waterType, 'lake')
  assert.equal(site.marineModelSupported, false)
  assert.equal(getWaterQualityForLocation(site).site, site)
  assert.match(getOfficialWaterUrl(site), /location=200305/)
  assert.equal(normalize({ current: { time: 1788782400 }, hourly: { time: [] } }, null, site).current.waveHeight, null)
})

test('lake normalization discards even accidentally supplied marine data and never recommends a swim', () => {
  const lake = EUROPEAN_BATHING_WATERS.find(site => site.waterType === 'lake' && site.classification === 'Excellent')
  const time = Math.floor(Date.now() / 1000)
  const weather = { current: { time, temperature_2m: 23, wind_speed_10m: 4, wind_gusts_10m: 6, wind_direction_10m: 180, is_day: 1 }, hourly: { time: [time], temperature_2m: [23] } }
  const marine = { current: { time, wave_height: 0.1, sea_surface_temperature: 28, sea_level_height_msl: 1, ocean_current_velocity: 0.2 }, hourly: { time: [time], wave_height: [0.1], sea_level_height_msl: [1] } }
  const data = normalize(weather, marine, lake)
  assert.equal(data.current.temperature, 23)
  for (const key of ['waveHeight', 'seaTemperature', 'seaLevel', 'currentVelocity']) assert.equal(data.current[key], null)
  assert.deepEqual(data.tides.series, [])
  assert.equal(data.forecast[0].waveHeight, null)
  assert.equal(normalize(weather, null, lake).source, 'partial')
  const t = makeTranslator('hu')
  assert.equal(getSafety(data.current, lake, t, 'hu-HU', { source: 'partial' }).title, t('lakeDecision.limited'))
  assert.equal(getSafety(data.current, lake, t, 'hu-HU', { source: 'partial' }).level, 'unknown')
  assert.equal(getSafety({ ...data.current, gusts: 35 }, lake, t, 'hu-HU').level, 'danger')
  assert.equal(getSafety(data.current, lake, t, 'hu-HU', { source: 'stale' }).level, 'unknown')
  assert.equal(findCalmestWindow(data.forecast, lake, { source: 'live' }), null)
})
test('coastal locations do not inherit a nearby lake classification', () => {
  const lake = EUROPEAN_BATHING_WATERS.find(site => site.waterType === 'lake')
  const result = getWaterQualityForLocation({ ...lake, source: null, waterType: 'coastal', marineModelSupported: true })
  assert.ok(result === null || result.site.waterType !== 'lake')
  for (const language of ['en', 'hu', 'fr', 'it', 'es']) {
    assert.notEqual(makeTranslator(language)('lake.description'), 'lake.description')
  }
})
