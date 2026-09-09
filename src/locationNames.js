import { HUNGARIAN_LOCATION_NAMES, LOCATION_NAME_RECORDS } from './hungarianLocationNames.generated.js'

const fold = word => word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
// Restore only unambiguous spellings attested in the official Hungarian list.
const spellings = new Map()
for (const name of Object.values(HUNGARIAN_LOCATION_NAMES)) {
  for (const word of name.match(/\p{L}+/gu) ?? []) {
    const key = fold(word)
    const spelling = word.toLocaleLowerCase('hu')
    if (!spellings.has(key)) spellings.set(key, spelling)
    else if (spellings.get(key) !== spelling) spellings.set(key, null)
  }
}
// Operator spelling: https://balatonfuredistrandok.hu/aranyhid-strand-nyitas/
spellings.set('aranyhid', 'aranyhíd')
spellings.set('brazay', 'brázay')
const cache = new WeakMap()
export function getLocationNameRecord(location) {
  return location.nameRecord ?? LOCATION_NAME_RECORDS[location.officialId ?? location.id?.replace(/^eea-/, '')] ?? null
}
export function locationSearchNames(location) {
  const record = getLocationNameRecord(location)
  return [location.name, ...Object.values(record?.names ?? {}).map(entry => entry.name), ...(record?.aliases ?? []).map(alias => typeof alias === 'string' ? alias : alias.name)].filter(Boolean)
}
export function locationDisplayName(location, locale = 'en') {
  const record = getLocationNameRecord(location)
  const language = locale.toLowerCase().split('-')[0]
  const names = record?.names ?? {}
  const trusted = entry => entry?.sourceUrl && entry?.verifiedOn && entry?.name
  const official = trusted(names[locale.toLowerCase()]) || trusted(names[language]) || trusted(names[record?.nativeLanguage])
  if (official) return official
  if (cache.has(location)) return cache.get(location)
  let name = official ?? location.name
  if (!official && (location.nation === 'Hungary' || location.countryCode === 'HU')) {
    name = name.replace(/\p{L}+/gu, word => {
      const verified = spellings.get(fold(word))
      if (!verified) return word === word.toUpperCase() && word.length > 3 ? word[0] + word.slice(1).toLocaleLowerCase('hu') : word
      return /^\p{Lu}/u.test(word) ? verified[0].toLocaleUpperCase('hu') + verified.slice(1) : verified
    })
  }
  cache.set(location, name)
  return name
}
