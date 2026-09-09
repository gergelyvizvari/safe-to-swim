import { isObservationStale } from './balaton.js'

const normalize = value => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function observedWaterTemperature(location, observations, now = Date.now()) {
  if (observations?.locationId !== location.id || observations.error) return null
  for (const item of observations.items ?? []) {
    if (item.type !== 'temperature' || item.status !== 'available' || !Number.isFinite(item.staleSeconds)
      || isObservationStale(item.publishedAt, item.staleSeconds * 1000, now)) continue
    const stations = (item.stations ?? []).filter(station => Number.isFinite(station.temperature))
    if (!stations.length) continue
    // Match a named station only when the location contains its complete name.
    // Otherwise average the available stations bound to this location's source.
    const name = ` ${normalize(location.name)} `
    const matching = stations.filter(station => name.includes(` ${normalize(station.station)} `))
    const selected = matching.length === 1 ? matching : stations
    return { ...item, stations: selected, temperature: selected.reduce((sum, station) => sum + station.temperature, 0) / selected.length, regional: matching.length !== 1 }
  }
  return null
}
