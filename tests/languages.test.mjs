import test from 'node:test'
import assert from 'node:assert/strict'
import { EUROPEAN_LANGUAGES, LANGUAGES, resolveLanguage, localeFor } from '../src/languages.js'
import { checkTranslations, validateTranslation } from '../scripts/check-translations.mjs'
import { getMessages, isLanguageLoaded, loadLanguage } from '../src/languagePacks.js'
import { makeTranslator } from '../src/i18n.js'

test('all advertised languages have complete packs and preserve dynamic values', async () => {
  assert.equal(LANGUAGES.length, 44)
  assert.deepEqual(LANGUAGES, EUROPEAN_LANGUAGES)
  assert.deepEqual(await checkTranslations(), [])
  for (const { code, locale } of LANGUAGES) {
    await loadLanguage(code)
    assert.equal(isLanguageLoaded(code), true)
    assert.notEqual(makeTranslator(code)('header.language'), 'header.language')
    assert.ok(makeTranslator(code)('locationPicker.subtitle', { count: '123' }).includes('123'))
    assert.doesNotThrow(() => new Intl.NumberFormat(locale).format(1234.5))
    assert.doesNotThrow(() => new Intl.DateTimeFormat(locale).format(new Date()))
    assert.doesNotThrow(() => new Intl.ListFormat(locale).format(['A', 'B']))
  }
})

test('language tags and stored values resolve predictably', () => {
  assert.equal(resolveLanguage('de-DE'), 'de')
  assert.equal(resolveLanguage('FR_fr'), 'fr')
  assert.equal(resolveLanguage(null), 'en')
  assert.equal(resolveLanguage('../../not-a-language'), 'en')
  assert.equal(localeFor('de'), 'de-DE')
  assert.equal(new Set(LANGUAGES.map(({ code }) => code)).size, LANGUAGES.length)
})

test('concurrent pack requests share a load and unknown languages use the English fallback', async () => {
  const [a, b] = await Promise.all([loadLanguage('de'), loadLanguage('de-DE')])
  assert.equal(a, b)
  assert.equal(await loadLanguage('unsupported'), getMessages('en'))
})

test('translation validation catches lost placeholders and unfinished records', () => {
  const reference = { message: 'Wind {speed}', compass: Array(8).fill('N') }
  assert.deepEqual(validateTranslation(reference, { ...reference, message: 'Vent {speed}' }), [])
  assert.ok(validateTranslation(reference, { ...reference, message: 'Vent' }).some(error => error.includes('variables')))
  assert.ok(validateTranslation(reference, { ...reference, message: '[90000]' }).some(error => error.includes('marker')))
})
