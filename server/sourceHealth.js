import { collectSource } from './observations.js'
import { SOURCES } from './sourceRegistry.js'

export async function checkSource(source) {
  const configured = SOURCES.find(item => item.id === source.id)
  if (!configured || configured.url !== source.url || configured.adapter !== source.adapter) throw new Error('Unverified source configuration')
  if (source.adapter.startsWith('hungaromet_') || source.adapter === 'nngyk_quality') {
    return { payload: await collectSource(source), check_kind: 'observations' }
  }
  const url = new URL(source.url)
  const model = source.adapter.startsWith('open_meteo_')
  if (model) {
    // Provider canary only: this does not assert coverage of every bathing site.
    url.searchParams.set('latitude','50.8159')
    url.searchParams.set('longitude','-0.1287')
    url.searchParams.set('current',source.adapter === 'open_meteo_weather' ? 'temperature_2m' : 'wave_height')
    url.searchParams.set('timeformat','unixtime')
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Source unavailable')
  if (model) {
    const data = await response.json()
    const metric = source.adapter === 'open_meteo_weather' ? 'temperature_2m' : 'wave_height'
    if (!Number.isFinite(data.current?.time) || !Number.isFinite(data.current?.[metric])) throw new Error('Forecast schema changed')
    return { payload: { publishedAt: new Date(data.current.time * 1000).toISOString() }, check_kind: 'model_canary' }
  }
  // Link-only sources have no machine-readable publication time. A successful
  // check indicates reachability, never fresh classifications or valid forecasts.
  if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('Unexpected source format')
  await response.body?.cancel()
  return { payload: { reachable: true }, check_kind: 'link_reachability' }
}
