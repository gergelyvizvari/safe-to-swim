import { locationSearchNames } from './locationNames.js'

export const FAVOURITES_STORAGE_KEY = 'safe-to-swim-favourites'

// Store display metadata only. Selecting an ID still loads the current catalogue record.
export function favouriteRecord(location) {
  if (!location || typeof location.id !== 'string' || !location.id.trim() || typeof location.name !== 'string' || !location.name.trim()) return null
  return Object.fromEntries(['id', 'name', 'area', 'nation', 'officialId', 'countryCode', 'waterType']
    .filter(key => typeof location[key] === 'string').map(key => [key, location[key]]))
}

export function normalizeFavourites(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  return value.map(favouriteRecord).filter(item => {
    if (!item || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function readFavourites(storage) {
  try { return normalizeFavourites(JSON.parse(storage.getItem(FAVOURITES_STORAGE_KEY))) }
  catch { return [] }
}

export function writeFavourites(storage, favourites) {
  try { storage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(normalizeFavourites(favourites))); return true }
  catch { return false }
}

export function toggleFavourite(favourites, location) {
  const record = favouriteRecord(location)
  if (!record) return favourites
  return favourites.some(item => item.id === record.id)
    ? favourites.filter(item => item.id !== record.id)
    : [...favourites, record]
}

const fold = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
export function filterFavourites(favourites, { search = '', waterType = 'all', country = '' } = {}) {
  const terms = fold(search).trim().split(/\s+/).filter(Boolean)
  return favourites.filter(item => {
    if (waterType !== 'all' && (item.waterType ?? 'coastal') !== waterType) return false
    if (country && item.nation !== country) return false
    const text = fold([...locationSearchNames(item), item.area, item.nation].join(' '))
    return terms.every(term => text.includes(term))
  })
}
