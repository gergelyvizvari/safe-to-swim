import { getBindings } from './catalogue.js'
import { loadSource } from './balatonSources.js'
import { database, hasDatabase } from './supabase.js'
import { isObservationStale } from '../src/balaton.js'
import { SOURCES } from './sourceRegistry.js'

const parserKeys = { hungaromet_temperature: 'temperature', hungaromet_wind: 'wind', hungaromet_storm: 'storm', nngyk_quality: 'quality' }

export function extractObservation(binding, state, now = Date.now()) {
  const { target, data_type: type } = binding
  const source = target.source
  const result = { type, targetId: target.id, label: target.label, coverage: target.coverage_type,
    provider: source.name, url: source.url, staleSeconds: source.stale_seconds,
    checkedAt: state?.checked_at ?? null, publishedAt: state?.payload?.publishedAt ?? null,
    status: state?.status ?? 'unavailable' }
  if (source.adapter === 'external_map') return { ...result, status: 'available', format: 'link' }
  if (!state?.payload) return result
  const payload = state.payload
  if (type === 'quality') {
    const identity = target.config
    const matches = (payload.sites ?? []).filter(site => site.name === identity.name && Math.abs(site.latitude - identity.latitude) < 0.0001 && Math.abs(site.longitude - identity.longitude) < 0.0001)
    result.sample = matches.length === 1 ? matches[0] : null
    result.publishedAt = result.sample?.sampledOn ?? null
    if (!result.sample) result.status = 'unmatched'
  } else if (type === 'storm') {
    result.basins = target.coverage_type === 'basin' ? payload.basins?.filter(b => b.basin === target.external_id) : payload.basins
  } else {
    result.stations = target.coverage_type === 'station' ? payload.stations?.filter(s => s.station === target.external_id) : payload.stations
  }
  if ((result.stations && !result.stations.length) || (result.basins && !result.basins.length)) result.status = 'unmatched'
  const checkOverdue = isObservationStale(state.checked_at, Math.max(source.refresh_seconds * 3, 180) * 1000, now)
  if (result.status !== 'unmatched' && (state.status !== 'healthy' || checkOverdue || isObservationStale(result.publishedAt, source.stale_seconds * 1000, now))) result.status = 'stale'
  else if (result.status === 'healthy') result.status = 'available'
  return result
}

export async function getObservations(id) {
  const bindings = (await getBindings(id)).filter(b => parserKeys[b.target.source.adapter] || b.target.source.adapter === 'external_map')
  const states = new Map()
  await Promise.all([...new Map(bindings.map(b => [b.target.source.id, b.target.source])).values()].map(async source => {
    if (source.adapter === 'external_map') return
    if (hasDatabase()) {
      const rows = await database(`source_state?source_id=eq.${encodeURIComponent(source.id)}&limit=1`)
      states.set(source.id, rows[0])
    } else {
      try { const payload = await loadSource(parserKeys[source.adapter]); states.set(source.id, { status: 'healthy', checked_at: payload.fetchedAt, payload }) }
      catch { states.set(source.id, { status: 'unavailable' }) }
    }
  }))
  return { locationId: id, items: bindings.map(b => extractObservation(b, states.get(b.target.source.id))) }
}

export async function collectSource(source) {
  const key = parserKeys[source.adapter]
  if (!key) throw new Error('Unsupported source adapter')
  // An adapter is tied to a verified provider endpoint; changing a URL requires
  // updating and testing the adapter, rather than silently relabelling its data.
  if (source.url !== SOURCES.find(item => item.adapter === source.adapter)?.url) throw new Error('Source endpoint changed')
  return loadSource(key)
}
