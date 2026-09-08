import { BALATON_SOURCES, isBalaton } from '../src/balaton.js'
import { QUALITY_SITES } from './balatonQualitySites.js'

export const SOURCES = [
  { id: 'open-meteo-weather', name: 'Open-Meteo', adapter: 'open_meteo_weather', url: 'https://api.open-meteo.com/v1/forecast', refresh_seconds: 300, stale_seconds: 1800 },
  { id: 'open-meteo-marine', name: 'Open-Meteo Marine', adapter: 'open_meteo_marine', url: 'https://marine-api.open-meteo.com/v1/marine', refresh_seconds: 300, stale_seconds: 1800 },
  ...['temperature', 'wind', 'storm', 'quality'].map(kind => ({ id: `official-${kind}`, name: kind === 'quality' ? 'NNGYK' : 'HungaroMet', adapter: kind === 'quality' ? 'nngyk_quality' : `hungaromet_${kind}`, url: BALATON_SOURCES[kind], refresh_seconds: kind === 'quality' ? 86400 : 60, stale_seconds: { temperature: 129600, wind: 1800, storm: 7200, quality: 2592000 }[kind] })),
  ...['windForecast', 'waveForecast'].map(kind => ({ id: `official-${kind}`, name: 'HungaroMet', adapter: 'external_map', url: BALATON_SOURCES[kind], refresh_seconds: 3600, stale_seconds: 86400 })),
  ...['eea','ea','nrw','sepa','daera'].map(id => ({ id, name: id.toUpperCase(), adapter: 'annual_catalogue', url: { eea: 'https://www.eea.europa.eu/en/analysis/maps-and-charts/state-of-bathing-waters-in-2025', ea: 'https://environment.data.gov.uk/bwq/profiles/', nrw: 'https://environment.data.gov.uk/wales/bathing-waters/profiles/', sepa: 'https://bathingwaters.sepa.org.uk/locations-and-results/results/', daera: 'https://www.daera-ni.gov.uk/articles/about-bathing-water-quality' }[id], refresh_seconds: 604800, stale_seconds: 34560000 })),
]

// Used only for the initial import / local catalogue. Runtime DB assignments are authoritative.
export function initialBindings(location) {
  const bindings = []
  const add = (type, sourceId, externalId, label, coverage, config = {}) => {
    const source = SOURCES.find(item => item.id === sourceId)
    bindings.push({ location_id: location.id, data_type: type, priority: 100, enabled: true,
      target: { id: `${sourceId}:${externalId}`, source_id: sourceId, external_id: externalId, label, coverage_type: coverage, config, source } })
  }
  add('weather', 'open-meteo-weather', location.id, location.name, 'model_point', { latitude: location.latitude, longitude: location.longitude })
  if (location.marineModelSupported !== false && location.waterType !== 'lake') add('marine', 'open-meteo-marine', location.id, location.name, 'model_point', { latitude: location.latitude, longitude: location.longitude })
  if (location.source) add('annual_quality', location.source, location.id, location.name, 'site')
  if (isBalaton(location)) {
    for (const type of ['temperature','wind','storm','windForecast','waveForecast']) add(type, `official-${type}`, 'balaton', 'Balaton', 'water_body')
    const identity = QUALITY_SITES[location.id]
    if (identity) add('quality', 'official-quality', location.id, identity.name, 'site', identity)
  }
  return bindings
}

export function publicBindings(bindings) {
  return bindings.filter(b => b.enabled !== false && b.target?.source?.enabled !== false).map(b => ({
    type: b.data_type, targetId: b.target.id, label: b.target.label, coverage: b.target.coverage_type,
    provider: b.target.source.name, url: b.target.source.url, adapter: b.target.source.adapter,
    ...(b.target.coverage_type === 'model_point' ? { latitude: b.target.config.latitude, longitude: b.target.config.longitude } : {}),
    refreshSeconds: b.target.source.refresh_seconds, staleSeconds: b.target.source.stale_seconds,
  }))
}
