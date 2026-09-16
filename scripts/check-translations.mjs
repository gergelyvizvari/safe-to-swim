import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { LANGUAGES } from '../src/languages.js'

export function flattenMessages(value, prefix = '') {
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .flatMap(([key, child]) => Object.entries(flattenMessages(child, prefix ? `${prefix}.${key}` : key))))
  return { [prefix]: value }
}

export function validateTranslation(reference, translation) {
  const source = flattenMessages(reference)
  const target = flattenMessages(translation)
  const errors = []
  for (const [key, value] of Object.entries(source)) {
    const translated = target[key]
    if (typeof translated !== 'string' || !translated.trim()) { errors.push(`${key}: missing text`); continue }
    const placeholders = text => (text.match(/\{\w+\}/g) ?? []).sort().join(',')
    if (placeholders(value) !== placeholders(translated)) errors.push(`${key}: interpolation variables differ`)
    if (/\[9\d{4}\]|\b\d{4}\s*\|/.test(translated)) errors.push(`${key}: translation marker remains`)
  }
  for (const key of Object.keys(target)) if (!(key in source)) errors.push(`${key}: unknown key`)
  if (!Array.isArray(translation.compass) || translation.compass.length !== 8) errors.push('compass: expected eight directions')
  return errors
}

export async function checkTranslations() {
  const reference = JSON.parse(await readFile(new URL('../src/locales/en.json', import.meta.url), 'utf8'))
  const failures = []
  for (const { code } of LANGUAGES) {
    try {
      const pack = JSON.parse(await readFile(new URL(`../src/locales/${code}.json`, import.meta.url), 'utf8'))
      failures.push(...validateTranslation(reference, pack).map(error => `${code}: ${error}`))
    } catch (error) { failures.push(`${code}: ${error.message}`) }
  }
  return failures
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const failures = await checkTranslations()
  if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1 }
  else console.log(`All ${LANGUAGES.length} language packs have complete keys and matching interpolation variables.`)
}
