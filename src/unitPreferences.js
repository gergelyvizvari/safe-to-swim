export const UNIT_STORAGE_KEY = 'safe-to-swim-units'
export const DEFAULT_UNIT_PREFERENCES = { wind: 'auto', temperature: 'auto' }

export function normalizeUnitPreferences(value) {
  return {
    wind: ['mph', 'km/h'].includes(value?.wind) ? value.wind : 'auto',
    temperature: ['°C', '°F'].includes(value?.temperature) ? value.temperature : 'auto',
  }
}

export function readUnitPreferences(storage) {
  try { return normalizeUnitPreferences(JSON.parse(storage.getItem(UNIT_STORAGE_KEY))) }
  catch { return { ...DEFAULT_UNIT_PREFERENCES } }
}

export function saveUnitPreferences(storage, preferences) {
  try { storage.setItem(UNIT_STORAGE_KEY, JSON.stringify(normalizeUnitPreferences(preferences))) }
  catch { /* The current selection still works when browser storage is unavailable. */ }
}

export function temperatureUnit(preference) {
  return preference === '°F' ? '°F' : '°C'
}

export function temperatureDisplayValue(celsius, preference) {
  if (!Number.isFinite(celsius)) return null
  return temperatureUnit(preference) === '°F' ? celsius * 9 / 5 + 32 : celsius
}

export function formatTemperatureValue(celsius, locale, preference) {
  const value = temperatureDisplayValue(celsius, preference)
  return value === null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)
}

export function formatTemperature(celsius, locale, preference) {
  return Number.isFinite(celsius) ? `${formatTemperatureValue(celsius, locale, preference)} ${temperatureUnit(preference)}` : '—'
}
