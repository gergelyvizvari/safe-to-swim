import { loadLanguage } from '../src/languagePacks.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { formatWindSpeed, formatStationWind, windDisplayValue } from '../src/windUnits.js'
import { getSafety } from '../src/safety.js'
import { LANGUAGES, makeTranslator } from '../src/i18n.js'

await Promise.all(LANGUAGES.map(({ code }) => loadLanguage(code)))

test('wind units convert forecast and station inputs consistently in every language', () => {
  for (const { code, locale } of LANGUAGES) {
    assert.equal(formatWindSpeed(20, locale), code === 'en' ? '20 mph' : '32 km/h')
    assert.equal(formatStationWind(32.18688, locale), formatWindSpeed(20, locale))
    for (const value of [null, undefined, NaN, Infinity]) assert.equal(formatWindSpeed(value, locale), '—')
    assert.equal(formatWindSpeed(0, locale), code === 'en' ? '0 mph' : '0 km/h')
  }
  assert.equal(windDisplayValue(10, 'hu-HU'), 16.09344)
})

test('localized warning values retain the same assessment level', () => {
  for (const { code, locale } of LANGUAGES) {
    const result = getSafety({ waveHeight: 0.2, windSpeed: 10, gusts: 28, windDirection: 180 }, { seaBearing: 180 }, makeTranslator(code), locale, { quality: null })
    assert.equal(result.level, 'danger')
    assert.ok(result.description.includes(code === 'en' ? '28 mph' : '45 km/h'))
    assert.doesNotMatch(result.description, /\{\w+\}/)
  }
})
