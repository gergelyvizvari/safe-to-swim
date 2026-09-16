import { getMessages } from './languagePacks.js'
export { DEFAULT_LANGUAGE, LANGUAGES, localeFor, resolveLanguage } from './languages.js'
export { loadLanguage, isLanguageLoaded } from './languagePacks.js'

function getValue(dictionary, key) {
  return key.split('.').reduce((value, part) => value?.[part], dictionary)
}

export function makeTranslator(language) {
  return (key, variables = {}) => {
    const template = getValue(getMessages(language), key) ?? getValue(getMessages('en'), key) ?? key
    return String(template).replace(/\{(\w+)\}/g, (_, name) => variables[name] ?? `{${name}}`)
  }
}

export function compassFor(language) {
  return getMessages(language).compass
}
