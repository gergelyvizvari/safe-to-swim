// Forecasts and assessment thresholds use mph internally; convert only for display.
const KMH_PER_MPH = 1.609344

export function windUnit(locale = 'en-GB', preference) {
  if (preference === 'mph' || preference === 'km/h') return preference
  return /^en(?:-|$)/i.test(locale) ? 'mph' : 'km/h'
}

export function windDisplayValue(mph, locale, preference) {
  return Number.isFinite(mph) ? mph * (windUnit(locale, preference) === 'mph' ? 1 : KMH_PER_MPH) : null
}

export function formatWindValue(mph, locale, preference) {
  const value = windDisplayValue(mph, locale, preference)
  return value === null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
}

export function formatWindSpeed(mph, locale, preference) {
  return Number.isFinite(mph) ? `${formatWindValue(mph, locale, preference)} ${windUnit(locale, preference)}` : '—'
}

export function formatStationWind(kmh, locale, preference) {
  return formatWindSpeed(Number.isFinite(kmh) ? kmh / KMH_PER_MPH : null, locale, preference)
}
