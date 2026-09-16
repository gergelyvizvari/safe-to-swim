import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_UNIT_PREFERENCES, readUnitPreferences, saveUnitPreferences, temperatureDisplayValue, formatTemperature } from '../src/unitPreferences.js'
import { windUnit, formatWindSpeed, formatStationWind } from '../src/windUnits.js'
import { LANGUAGES, loadLanguage, makeTranslator } from '../src/i18n.js'
import { getSafety, WIND_THRESHOLDS } from '../src/safety.js'

await Promise.all(LANGUAGES.map(({ code }) => loadLanguage(code)))

test('unset and automatic wind units follow language; overrides survive language changes', () => {
  for (const { code, locale } of LANGUAGES) {
    assert.equal(windUnit(locale, 'auto'), code === 'en' ? 'mph' : 'km/h')
    assert.equal(windUnit(locale, 'mph'), 'mph')
    assert.equal(windUnit(locale, 'km/h'), 'km/h')
    assert.equal(formatTemperature(20, locale, 'auto'), '20 °C')
    assert.equal(formatTemperature(20, locale, '°F'), '68 °F')
    for (const preference of ['mph', 'km/h']) {
      assert.equal(formatStationWind(32.18688, locale, preference), formatWindSpeed(20, locale, preference))
    }
  }
})

test('preferences persist independently, reset to language defaults, and tolerate inaccessible or corrupt storage', () => {
  let stored = null
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value } }
  assert.deepEqual(readUnitPreferences(storage), DEFAULT_UNIT_PREFERENCES)
  saveUnitPreferences(storage, { wind: 'mph', temperature: '°F' })
  assert.deepEqual(readUnitPreferences(storage), { wind: 'mph', temperature: '°F' })
  saveUnitPreferences(storage, { wind: 'auto', temperature: '°F' })
  assert.deepEqual(readUnitPreferences(storage), { wind: 'auto', temperature: '°F' })
  saveUnitPreferences(storage, DEFAULT_UNIT_PREFERENCES)
  assert.deepEqual(readUnitPreferences(storage), DEFAULT_UNIT_PREFERENCES)
  for (const invalid of ['{', 'null', '42', '{"wind":"knots","temperature":"K"}']) {
    stored = invalid
    assert.deepEqual(readUnitPreferences(storage), DEFAULT_UNIT_PREFERENCES)
  }
  const denied = { getItem() { throw Error('denied') }, setItem() { throw Error('denied') } }
  assert.deepEqual(readUnitPreferences(denied), DEFAULT_UNIT_PREFERENCES)
  assert.doesNotThrow(() => saveUnitPreferences(denied, DEFAULT_UNIT_PREFERENCES))
})

test('temperature conversions preserve zero, negative and missing values', () => {
  assert.equal(temperatureDisplayValue(0, '°F'), 32)
  assert.equal(temperatureDisplayValue(-40, '°F'), -40)
  for (const missing of [null, undefined, NaN, Infinity]) {
    assert.equal(temperatureDisplayValue(missing, '°F'), null)
    assert.equal(formatTemperature(missing, 'en-GB', '°F'), '—')
  }
})

test('wind override changes warning text without changing risk, including at threshold boundaries', () => {
  const location = { seaBearing: 180 }
  for (const { code, locale } of LANGUAGES) {
    const t = makeTranslator(code)
    for (const [gusts, expected] of [[WIND_THRESHOLDS.gustCaution, 'caution'], [WIND_THRESHOLDS.gustDanger, 'danger']]) {
      const conditions = { waveHeight: 0.2, windSpeed: 5, gusts, windDirection: 180 }
      for (const unit of ['mph', 'km/h']) {
        const result = getSafety(conditions, location, t, locale, { quality: null, windUnit: unit })
        assert.equal(result.level, expected, `${code} ${unit}`)
        assert.ok(result.description.includes(formatWindSpeed(gusts, locale, unit)), `${code}: ${result.description}`)
        assert.doesNotMatch(result.description, /\{\w+\}/)
      }
    }
  }
})
