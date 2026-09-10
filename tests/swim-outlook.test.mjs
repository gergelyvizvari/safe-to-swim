import test from 'node:test'
import assert from 'node:assert/strict'
import { getSafety } from '../src/safety.js'
import { findCalmestWindow } from '../src/swimOutlook.js'
import { normalize, fallbackFor, retainAfterFailure, isDataStale } from '../src/coastalData.js'
import { makeTranslator, LANGUAGES } from '../src/i18n.js'
import { outlookMessages } from '../src/outlookMessages.js'

const location = { id: 'test', seaBearing: 180, latitude: 0, longitude: 0 }
const calm = { waveHeight: 0.2, gusts: 8, windSpeed: 5, windDirection: 180, isDay: true }
const t = makeTranslator('en')
const level = (changes, options = {}) => getSafety({ ...calm, ...changes }, location, t, 'en-GB', { quality: null, ...options }).level
const start = Date.parse('2026-09-07T09:00:00Z')
const hours = Array.from({ length: 6 }, (_, i) => ({ ...calm, time: new Date(start + i * 3600000).toISOString() }))
const options = { now: start, source: 'live', quality: null }

test('thresholds match displayed readings, including conservative rounding boundaries', () => {
  for (const [waveHeight, expected] of [[0.54, 'good'], [0.55, 'caution'], [0.94, 'caution'], [0.95, 'danger'], [1, 'danger']]) assert.equal(level({ waveHeight }), expected)
  for (const [gusts, expected] of [[19.4, 'good'], [19.5, 'caution'], [27.4, 'caution'], [27.5, 'danger'], [28, 'danger']]) assert.equal(level({ gusts }), expected)
  assert.equal(level({ windDirection: 0, windSpeed: 12 }), 'danger')
})
test('missing wind never produces a favourable rating; known danger remains visible', () => {
  assert.equal(level({ windDirection: null }), 'unknown')
  assert.equal(level({ windSpeed: null }), 'unknown')
  assert.equal(level({ waveHeight: null, gusts: 30 }), 'danger')
  assert.equal(level({ waveHeight: 1.2, gusts: null }), 'danger')
})
test('saved water concerns and stale data suppress favourable ratings', () => {
  assert.equal(level({}, { quality: { site: { classification: 'Poor' } } }), 'caution')
  assert.equal(level({}, { quality: { site: { riskLevel: 'increased' } } }), 'caution')
  assert.equal(level({}, { source: 'stale' }), 'unknown')
})
test('window requires three consecutive daylight samples; earliest wins ties', () => {
  const result = findCalmestWindow(hours, location, options)
  assert.equal(result.start.time, hours[0].time)
  assert.equal(Date.parse(result.end.time) - Date.parse(result.start.time), 7200000)
  assert.equal(findCalmestWindow([hours[0], hours[2], hours[3]], location, options), null)
  assert.equal(findCalmestWindow(hours.slice(0, 2), location, options), null)
  assert.equal(findCalmestWindow(hours.map((hour) => ({ ...hour, isDay: false })), location, options), null)
})
test('window excludes past, missing, offshore, polluted and stale data', () => {
  assert.equal(findCalmestWindow(hours, location, { ...options, now: start + 5 * 3600000 }), null)
  for (const patch of [{ gusts: null }, { windDirection: null }, { windDirection: 0 }, { waveHeight: 0.7 }]) assert.equal(findCalmestWindow(hours.map((hour) => ({ ...hour, ...patch })), location, options), null)
  assert.equal(findCalmestWindow(hours, location, { ...options, source: 'partial' }), null)
  assert.equal(findCalmestWindow(hours, location, { ...options, source: 'stale' }), null)
  assert.equal(findCalmestWindow(hours, location, { ...options, quality: { site: { riskLevel: 'increased' } } }), null)
})
test('window ranks worst conditions across the whole interval', () => {
  const data = hours.map((hour, i) => ({ ...hour, waveHeight: i < 3 ? 0.5 : 0.2 }))
  assert.equal(findCalmestWindow(data, location, options).start.time, hours[3].time)
})
const times = hours.map((hour) => Date.parse(hour.time) / 1000)
const weather = { current: { time: times[0], wind_gusts_10m: 8 }, hourly: { time: times, wind_gusts_10m: times.map(() => 8), is_day: times.map(() => 1) }, daily: {} }
const marine = { current: { time: times[0], wave_height: 0.2 }, hourly: { time: times, wave_height: times.map(() => 0.2) } }
test('independent source failures retain available fields with partial status', () => {
  const weatherOnly = normalize(weather, null, location)
  assert.equal(weatherOnly.current.gusts, 8)
  assert.equal(weatherOnly.current.waveHeight, null)
  assert.equal(weatherOnly.source, 'partial')
  const marineOnly = normalize(null, marine, location)
  assert.equal(marineOnly.current.waveHeight, 0.2)
  assert.equal(marineOnly.current.gusts, null)
  assert.equal(marineOnly.source, 'partial')
  assert.equal(normalize(weather, marine, { ...location, marineModelSupported: false }).current.waveHeight, null)
})
test('forecast joins marine and weather on exact timestamps', () => {
  const future = Math.ceil(Date.now() / 3600000) * 3600 + 3600
  const weatherData = { ...weather, hourly: { ...weather.hourly, time: [future, future + 3600, future + 7200] } }
  const marineData = { ...marine, hourly: { time: [future + 3600, future + 7200], wave_height: [0.3, 0.4] } }
  const data = normalize(weatherData, marineData, location)
  assert.equal(data.forecast[0].waveHeight, null)
  assert.equal(data.forecast[1].waveHeight, 0.3)
})
test('failed refresh preserves data only for the same location and labels it stale', () => {
  const previous = normalize(weather, marine, location)
  assert.equal(retainAfterFailure(previous, location).current.waveHeight, 0.2)
  assert.equal(retainAfterFailure(previous, location).source, 'stale')
  assert.equal(retainAfterFailure(previous, { ...location, id: 'other' }).current.waveHeight, null)
  assert.equal(fallbackFor(location).daylight.sunrise, null)
  assert.equal(isDataStale({ ...previous, source: 'partial' }, previous.fetchedAt + 16 * 60000), true)
})
test('new copy exists and interpolates in all supported languages', () => {
  for (const { code } of LANGUAGES) {
    for (const key of Object.keys(outlookMessages.en)) assert.ok(outlookMessages[code][key], `${code}: ${key}`)
    assert.ok(!makeTranslator(code)('outlook.reason', { wave: '0.2', gusts: 8 }).includes('{'))
  }
})

test('tide series includes later turning points so every available card can select the chart', () => {
  const base = Math.floor(Date.now() / 3600000) * 3600
  const time = Array.from({ length: 60 }, (_, i) => base + i * 3600)
  const levels = time.map((_, i) => Math.cos(i * Math.PI / 6))
  const data = normalize({ ...weather, hourly: { time } }, { ...marine, hourly: { time, sea_level_height_msl: levels } }, location)
  assert.ok(data.tides.series.length > 25)
  assert.equal(data.tides.events.length, 6)
  for (const event of data.tides.events) assert.ok(data.tides.series.some((point) => point.time === event.time && point.height === event.height))
})

test('darkness preserves the conditions rating; the hero presents a separate warning', () => {
  assert.equal(level({ isDay: true }), 'good')
  assert.equal(level({ isDay: false }), 'good')
  assert.equal(level({ isDay: false, waveHeight: 1.2 }), 'danger')
  assert.equal(level({ isDay: false, gusts: null }), 'unknown')
  assert.equal(level({ isDay: false, windDirection: null }), 'unknown')
  assert.equal(level({ isDay: false }, { source: 'stale' }), 'unknown')
  for (const language of LANGUAGES) {
    const translate = makeTranslator(language.code)
    for (const key of ['nightLabel', 'nightTitle', 'nightText']) assert.notEqual(translate(`timeline.${key}`), `timeline.${key}`)
  }
})

test('current daylight is normalized for the hero, with a bounded hourly fallback', () => {
  const now = Math.floor(Date.now() / 1000)
  const input = { ...weather, current: { ...weather.current, time: now, is_day: 0 }, hourly: { ...weather.hourly, time: [now], is_day: [1] } }
  assert.equal(normalize(input, marine, location).current.isDay, false)
  input.current.is_day = 1
  input.hourly.is_day = [0]
  assert.equal(normalize(input, marine, location).current.isDay, true)
  delete input.current.is_day
  assert.equal(normalize(input, marine, location).current.isDay, false)
  input.hourly.time = [now - 7200]
  assert.equal(normalize(input, marine, location).current.isDay, null)
  assert.equal(normalize(null, marine, location).current.isDay, null)
})

test('missing shoreline metadata preserves a measured outlook with a separate limitation', () => {
  const place = { ...location, seaBearing: null }
  const point = { ...calm, waveHeight: 0.4, gusts: 15, windSpeed: 9 }
  const assess = (patch = {}, extra = {}) => getSafety({ ...point, ...patch }, place, t, 'en-GB', { ...options, ...extra })
  const result = assess()
  assert.equal(result.level, 'caution')
  assert.equal(result.title, 'Low waves, modest gusts.')
  assert.match(result.description, /0\.4 m.*9 mph.*15 mph/)
  assert.match(result.note, /Shoreline orientation/)
  assert.ok(result.reason.includes(result.note))
  assert.equal(assess({ windDirection: null }).level, 'unknown')
  assert.equal(assess({ windSpeed: null }).level, 'unknown')
  assert.equal(assess({ gusts: null }).level, 'unknown')
  assert.equal(assess({ waveHeight: null }).level, 'unknown')
  assert.equal(assess({}, { source: 'stale' }).level, 'unknown')
  assert.equal(assess({}, { source: 'unavailable' }).level, 'unknown')
  assert.equal(assess({ waveHeight: 1 }).level, 'danger')
  assert.equal(assess({ gusts: 28 }).level, 'danger')
  assert.equal(assess({ waveHeight: 0.6 }).title, t('safety.cautionTitle'))
  assert.equal(assess({ gusts: 20 }).title, t('safety.cautionTitle'))
  assert.equal(assess({}, { quality: { site: { classification: 'Poor' } } }).title, t('outlook.waterTitle'))
  assert.equal(assess({ seaBearing: 180 }).level, 'good')
  assert.equal(findCalmestWindow(hours, place, options), null)
})
