import test from 'node:test'
import assert from 'node:assert/strict'
import { formatWindReadings, formatWindSpeed, getSafety, getWindAssessment, windDataLabel, windRiskLabel, windMissingLabel } from '../src/safety.js'
import { shoreWindDirection } from '../src/locationUtils.js'
import { LANGUAGES, makeTranslator } from '../src/i18n.js'
import { windMessages } from '../src/windMessages.js'

const location = { seaBearing: 180 }
const calm = { windDirection: 180, windSpeed: 5, gusts: 8, waveHeight: 0.2 }
const assess = (patch, place = location, source = 'live') => getWindAssessment({ ...calm, ...patch }, place, source)

test('wind is reported by its source, with three distinct shore-relative directions', () => {
  assert.equal(shoreWindDirection(0, 180), 'offshore')
  assert.equal(shoreWindDirection(180, 180), 'onshore')
  assert.equal(shoreWindDirection(90, 180), 'alongshore')
  assert.equal(shoreWindDirection(359, 180), 'offshore')
  assert.equal(shoreWindDirection(55, 180), 'offshore')
  assert.equal(shoreWindDirection(56, 180), 'alongshore')
  assert.equal(shoreWindDirection(null, 180), 'unknownDirection')
  assert.equal(assess({ seaBearing: 0 }, {}).direction, 'offshore')
  assert.equal(assess({ seaBearing: 0 }).direction, 'onshore')
})

test('wind warnings use the same rounded thresholds as the main assessment', () => {
  const cases = [
    [{ windDirection: 0, windSpeed: 5 }, 'caution', 'offshore'],
    [{ windDirection: 0, windSpeed: 11.4 }, 'caution', 'offshore'],
    [{ windDirection: 0, windSpeed: 11.5 }, 'danger', 'dangerOffshore'],
    [{ gusts: 19.4 }, 'low', 'belowThreshold'],
    [{ gusts: 19.5 }, 'caution', 'cautionGusts'],
    [{ gusts: 27.4 }, 'caution', 'cautionGusts'],
    [{ gusts: 27.5 }, 'danger', 'dangerGusts'],
    [{ gusts: 30, windDirection: null }, 'danger', 'dangerGusts'],
  ]
  for (const [patch, level, effect] of cases) {
    const wind = assess(patch)
    assert.equal(wind.level, level)
    assert.equal(wind.effect, effect)
    const safety = getSafety({ ...calm, ...patch }, location, makeTranslator('en'), 'en-GB', { quality: null })
    assert.equal(safety.level, level === 'low' ? 'good' : level)
  }
})

test('missing shoreline, direction and speed receive different explanations, never a low rating', () => {
  for (const [patch, place, missing] of [
    [{}, {}, 'missingShore'],
    [{ windDirection: null }, location, 'missingDirection'],
    [{ windSpeed: null }, location, 'missingSpeed'],
    [{ gusts: null }, location, 'missingSpeed'],
    [{}, { ...location, marineModelSupported: false }, 'missingShore'],
  ]) {
    const wind = assess(patch, place)
    assert.equal(wind.missing, missing)
    assert.equal(wind.effect, missing)
    assert.equal(wind.level, 'unknown')
  }
  assert.equal(assess({ gusts: 30 }, {}).level, 'danger')
  assert.equal(assess({ gusts: 30 }, {}).missing, 'missingShore')
})

test('saved readings remain visible with explicit stale status and no current risk recommendation', () => {
  const wind = assess({ gusts: 35, windDirection: 0 }, location, 'stale')
  assert.equal(wind.level, 'unknown')
  assert.equal(wind.direction, 'unknownDirection')
  assert.equal(wind.windSpeed, 5)
  assert.equal(wind.gusts, 35)
  assert.equal(wind.windDirection, 0)
  assert.equal(wind.effect, 'stale')
  assert.equal(wind.availability, 'stale')
  assert.match(windDataLabel(wind, makeTranslator('en')), /Saved.*not current/)
  assert.match(windRiskLabel(wind, makeTranslator('en')), /not assessed/)
  const unavailable = assess({ gusts: 35 }, location, 'unavailable')
  assert.equal(unavailable.windSpeed, null)
  assert.equal(unavailable.gusts, null)
  assert.equal(unavailable.windDirection, null)
  assert.equal(unavailable.availability, 'unavailable')
  assert.equal(unavailable.effect, 'noDataHelp')
})

test('18 mph gusts with missing shoreline metadata are available data and a partial assessment', () => {
  const wind = assess({ windSpeed: 9, gusts: 18, windDirection: 315 }, {})
  const t = makeTranslator('en')
  assert.equal(wind.availability, 'available')
  assert.equal(wind.gusts, 18)
  assert.equal(wind.windDirection, 315)
  assert.deepEqual(wind.missingFields, ['shoreOrientation'])
  assert.equal(windRiskLabel(wind, t), 'Partial wind assessment')
  assert.equal(windDataLabel(wind, t), 'Wind forecast available')
  assert.equal(windMissingLabel(wind, t, 'en-GB'), 'Missing: shoreline orientation.')
  assert.doesNotMatch(windRiskLabel(wind, t), /Insufficient data/)
  const hero = getSafety({ ...calm, waveHeight: 1, gusts: 18 }, {}, t, 'en-GB', { quality: null })
  assert.equal(hero.level, 'danger')
  assert.match(hero.reason, /1\.0 m strong waves/)
})

test('multiple missing fields are preserved; one known gust reading is not no data', () => {
  const wind = assess({ windSpeed: null, windDirection: null, gusts: 18 }, {})
  assert.equal(wind.availability, 'partial')
  assert.equal(wind.gusts, 18)
  assert.deepEqual(wind.missingFields, ['windSpeed', 'windDirection', 'shoreOrientation'])
  assert.match(windMissingLabel(wind, makeTranslator('en'), 'en-GB'), /wind speed, wind direction and shoreline orientation/)
  const danger = assess({ windSpeed: null, windDirection: null, gusts: 30 }, {})
  assert.equal(danger.availability, 'partial')
  assert.equal(danger.level, 'danger')
  assert.equal(windRiskLabel(danger, makeTranslator('en')), 'Swimming not recommended')
})

test('marine source failure does not turn complete wind measurements into missing wind data', () => {
  const wind = assess({}, location, 'partial')
  assert.equal(wind.availability, 'available')
  assert.equal(wind.level, 'low')
  assert.deepEqual(wind.missingFields, [])
  assert.equal(windMissingLabel(wind, makeTranslator('en'), 'en-GB'), '')
})

test('empty, loading and refreshing states are distinguished without hiding existing readings', () => {
  const empty = assess({ windSpeed: null, windDirection: null, gusts: null })
  const t = makeTranslator('en')
  assert.equal(empty.availability, 'unavailable')
  assert.equal(windDataLabel(empty, t, true), 'Loading wind data…')
  assert.equal(windDataLabel(empty, t, false), 'Wind data unavailable')
  assert.equal(windRiskLabel(empty, t), 'Current wind risk not assessed')
  assert.equal(windDataLabel(assess({}), t, true), 'Wind forecast available')
})

test('all supported languages explain the wind without missing keys or placeholders', () => {
  for (const { code, locale } of LANGUAGES) {
    assert.deepEqual(Object.keys(windMessages[code]).sort(), Object.keys(windMessages.en).sort())
    const t = makeTranslator(code)
    const keys = Object.entries(windMessages.en).flatMap(([key, value]) => typeof value === 'object' ? Object.keys(value).map(child => `${key}.${child}`) : [key])
    for (const key of keys) {
      assert.doesNotMatch(t(`windAdvice.${key}`, { speed: '5', gusts: '8', value: '12', caution: '20', danger: '28', fields: 'test' }), /windAdvice\.|\{\w+\}|\[object Object\]/)
    }
    const safety = getSafety(calm, {}, t, locale, { quality: null })
    assert.equal(safety.level, 'unknown')
    assert.match(safety.description, /mph.*km\/h/)
    assert.ok(safety.description.includes(t('windAdvice.missingShore')))
  }
  assert.equal(formatWindSpeed(null, 'en-GB'), '—')
  assert.equal(formatWindSpeed(12, 'en-GB'), '12 mph / 19 km/h')
  assert.equal(formatWindSpeed(20, 'en-GB'), '20 mph / 32 km/h')
  assert.equal(formatWindSpeed(28, 'en-GB'), '28 mph / 45 km/h')
  assert.match(formatWindReadings(assess({ windSpeed: null }), makeTranslator('en'), 'en-GB'), /Wind —/)
})
