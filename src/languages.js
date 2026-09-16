// Country-level official languages, including both written Norwegian standards.
// Regional-only languages are outside this catalogue's scope.
export const DEFAULT_LANGUAGE = 'en'
export const EUROPEAN_LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-GB' },
  { code: 'sq', label: 'Shqip', locale: 'sq-AL' },
  { code: 'hy', label: 'Հայերեն', locale: 'hy-AM' },
  { code: 'az', label: 'Azərbaycanca', locale: 'az-AZ' },
  { code: 'be', label: 'Беларуская', locale: 'be-BY' },
  { code: 'bs', label: 'Bosanski', locale: 'bs-BA' },
  { code: 'bg', label: 'Български', locale: 'bg-BG' },
  { code: 'ca', label: 'Català', locale: 'ca-AD' },
  { code: 'hr', label: 'Hrvatski', locale: 'hr-HR' },
  { code: 'cs', label: 'Čeština', locale: 'cs-CZ' },
  { code: 'da', label: 'Dansk', locale: 'da-DK' },
  { code: 'nl', label: 'Nederlands', locale: 'nl-NL' },
  { code: 'et', label: 'Eesti', locale: 'et-EE' },
  { code: 'fi', label: 'Suomi', locale: 'fi-FI' },
  { code: 'fr', label: 'Français', locale: 'fr-FR' },
  { code: 'ka', label: 'ქართული', locale: 'ka-GE' },
  { code: 'de', label: 'Deutsch', locale: 'de-DE' },
  { code: 'el', label: 'Ελληνικά', locale: 'el-GR' },
  { code: 'hu', label: 'Magyar', locale: 'hu-HU' },
  { code: 'is', label: 'Íslenska', locale: 'is-IS' },
  { code: 'ga', label: 'Gaeilge', locale: 'ga-IE' },
  { code: 'it', label: 'Italiano', locale: 'it-IT' },
  { code: 'kk', label: 'Қазақша', locale: 'kk-KZ' },
  { code: 'la', label: 'Latina', locale: 'la' },
  { code: 'lv', label: 'Latviešu', locale: 'lv-LV' },
  { code: 'lt', label: 'Lietuvių', locale: 'lt-LT' },
  { code: 'lb', label: 'Lëtzebuergesch', locale: 'lb-LU' },
  { code: 'mk', label: 'Македонски', locale: 'mk-MK' },
  { code: 'mt', label: 'Malti', locale: 'mt-MT' },
  { code: 'cnr', label: 'Crnogorski', locale: 'sr-Latn-ME' },
  { code: 'nb', label: 'Norsk bokmål', locale: 'nb-NO' },
  { code: 'nn', label: 'Norsk nynorsk', locale: 'nn-NO' },
  { code: 'pl', label: 'Polski', locale: 'pl-PL' },
  { code: 'pt', label: 'Português', locale: 'pt-PT' },
  { code: 'ro', label: 'Română', locale: 'ro-RO' },
  { code: 'rm', label: 'Rumantsch', locale: 'rm-CH' },
  { code: 'ru', label: 'Русский', locale: 'ru-RU' },
  { code: 'sr', label: 'Српски', locale: 'sr-Cyrl-RS' },
  { code: 'sk', label: 'Slovenčina', locale: 'sk-SK' },
  { code: 'sl', label: 'Slovenščina', locale: 'sl-SI' },
  { code: 'es', label: 'Español', locale: 'es-ES' },
  { code: 'sv', label: 'Svenska', locale: 'sv-SE' },
  { code: 'tr', label: 'Türkçe', locale: 'tr-TR' },
  { code: 'uk', label: 'Українська', locale: 'uk-UA' },
]

// Only complete, validated packs are offered in the interface.
const availableLanguages = new Set(['en', 'fr', 'it', 'es', 'hu', 'de', 'pt', 'nl', 'hr', 'bs', 'cnr', 'sr', 'nb', 'nn', 'ro', 'ca', 'sv', 'da', 'cs', 'sk', 'pl', 'sl', 'fi', 'et', 'lv', 'lt', 'tr', 'ru', 'uk', 'be', 'bg', 'mk', 'sq', 'el', 'lb', 'is', 'mt', 'ga', 'rm', 'la', 'az', 'kk', 'hy', 'ka'])
export const LANGUAGES = EUROPEAN_LANGUAGES.filter(({ code }) => availableLanguages.has(code))

export function resolveLanguage(value) {
  if (typeof value !== 'string') return DEFAULT_LANGUAGE
  const tag = value.toLowerCase().replaceAll('_', '-')
  const base = tag.split('-')[0]
  const code = tag === 'sr-latn-me' ? 'cnr' : base === 'no' ? 'nb' : base
  return LANGUAGES.some(language => language.code === code) ? code : DEFAULT_LANGUAGE
}

export function localeFor(language) {
  return LANGUAGES.find(item => item.code === resolveLanguage(language)).locale
}
