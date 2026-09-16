// Forecasts and assessment thresholds use mph internally; convert only for display.
const KMH_PER_MPH = 1.609344

export function windUnit(locale = 'en-GB') {
  return /^en(?:-|$)/i.test(locale) ? 'mph' : 'km/h'
}

export function windDisplayValue(mph, locale) {
  return Number.isFinite(mph) ? mph * (windUnit(locale) === 'mph' ? 1 : KMH_PER_MPH) : null
}

export function formatWindValue(mph, locale) {
  const value = windDisplayValue(mph, locale)
  return value === null ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)
}

export function formatWindSpeed(mph, locale) {
  return Number.isFinite(mph) ? `${formatWindValue(mph, locale)} ${windUnit(locale)}` : '—'
}

export function formatStationWind(kmh, locale) {
  return formatWindSpeed(Number.isFinite(kmh) ? kmh / KMH_PER_MPH : null, locale)
}
