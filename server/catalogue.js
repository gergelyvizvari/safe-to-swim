import { hasDatabase, database, rpc } from './supabase.js'
import { initialBindings, publicBindings } from './sourceRegistry.js'
import { distanceToCoastalLocation } from '../src/locationUtils.js'

const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const localCatalogue = () => import('../src/coastalLocations.js')

export function parseSearch(params) {
  const number = (key, fallback, min, max) => {
    if (!params.has(key)) return fallback
    const value = Number(params.get(key))
    if (!params.get(key)?.trim() || !Number.isFinite(value) || value < min || value > max) throw new Error('Invalid query')
    return value
  }
  const kind = params.get('kind') ?? 'all'
  if (!['all','coastal','lake'].includes(kind)) throw new Error('Invalid query')
  const query = (params.get('q') ?? '').trim()
  if (query.length > 200) throw new Error('Invalid query')
  const result = { query, kind, country: params.get('country') ?? '',
    page_offset: number('offset', 0, 0, 1000000), page_size: number('limit', 80, 1, 500),
    west: number('west', null, -180, 180), east: number('east', null, -180, 180), south: number('south', null, -90, 90), north: number('north', null, -90, 90),
    near_lat: number('lat', null, -90, 90), near_lon: number('lon', null, -180, 180), featured_only: params.get('featured') === 'true' }
  if (!Number.isInteger(result.page_offset) || !Number.isInteger(result.page_size)) throw new Error('Invalid query')
  const bounds = [result.west,result.east,result.south,result.north]
  if (bounds.some(v => v !== null) && (bounds.some(v => v === null) || result.west > result.east || result.south > result.north)) throw new Error('Invalid query')
  if ((result.near_lat === null) !== (result.near_lon === null)) throw new Error('Invalid query')
  return result
}

export async function searchCatalogue(options) {
  if (hasDatabase()) return rpc('search_locations', options)
  const { COASTAL_LOCATIONS, FEATURED_LOCATIONS } = await localCatalogue()
  const featured = new Set(FEATURED_LOCATIONS.map(l => l.id))
  const items = COASTAL_LOCATIONS.filter(l => (options.kind === 'all' || (l.waterType ?? 'coastal') === options.kind)
    && (!options.country || l.nation === options.country)
    && (!options.featured_only || featured.has(l.id))
    && normalize(`${l.name} ${l.area} ${l.nation}`).includes(normalize(options.query))
    && (options.west === null || l.longitude >= options.west && l.longitude <= options.east && l.latitude >= options.south && l.latitude <= options.north))
  items.sort((a,b) => options.near_lat !== null
    ? distanceToCoastalLocation(options.near_lat,options.near_lon,a) - distanceToCoastalLocation(options.near_lat,options.near_lon,b)
    : Number(featured.has(b.id)) - Number(featured.has(a.id)) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
  return { total: items.length, items: items.slice(options.page_offset, options.page_offset + options.page_size), nations: [...new Set(COASTAL_LOCATIONS.map(l => l.nation))].sort() }
}

export async function getLocation(id) {
  if (hasDatabase()) {
    const rows = await database(`locations?id=eq.${encodeURIComponent(id)}&active=eq.true&limit=1`)
    if (!rows[0]) return null
    const row = rows[0]
    const bindings = await getBindings(id)
    const classifications = await database(`annual_classifications?location_id=eq.${encodeURIComponent(id)}&order=year.desc&limit=1`)
    const annual = classifications[0]
    return { ...row.metadata, id: row.id, name: row.name, area: row.area, nation: row.nation, latitude: row.latitude, longitude: row.longitude, waterType: row.water_type,
      ...(annual ? { classification: annual.classification, classificationYear: annual.year, source: annual.source_id } : {}),
      marineModelSupported: row.water_type !== 'lake' && bindings.some(b => b.data_type === 'marine' && b.target.source.adapter === 'open_meteo_marine'), sources: publicBindings(bindings) }
  }
  const { COASTAL_LOCATIONS } = await localCatalogue()
  const location = COASTAL_LOCATIONS.find(l => l.id === id)
  if (!location) return null
  // Preserve the existing, explicitly labelled nearby annual-classification association.
  const { getWaterQualityForLocation } = await import('../src/waterQuality.js')
  return { ...location, waterQuality: getWaterQualityForLocation(location, COASTAL_LOCATIONS), sources: publicBindings(initialBindings(location)) }
}

export async function getBindings(id) {
  if (hasDatabase()) {
    const rows = await database(`location_sources?location_id=eq.${encodeURIComponent(id)}&enabled=eq.true&select=*,target:source_targets(*,source:data_sources(*))&order=priority.asc`)
    return rows.filter(b => b.target.source.enabled)
  }
  const { COASTAL_LOCATIONS } = await localCatalogue()
  const location = COASTAL_LOCATIONS.find(l => l.id === id)
  return location ? initialBindings(location) : []
}
