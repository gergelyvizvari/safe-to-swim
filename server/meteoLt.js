// Lithuanian Hydrometeorological Service, API data CC BY-SA 4.0.
// Station observations, not a beach sample or surface-temperature guarantee.
export const METEO_LT_URL = 'https://api.meteo.lt/v1/hydro-stations/palangos-vms/observations/measured/latest'
export const METEO_LT_SITE = {
  locationId: 'eea-LT0032500101012', locationLatitude: 55.92, locationLongitude: 21.049,
  stationId: 'palangos-vms', name: 'Palangos VMS', waterBody: 'Baltijos jūra',
  latitude: 55.920336, longitude: 21.044301, distanceMetres: 295,
}

export function parseMeteoLt(data, station = METEO_LT_SITE, now = Date.now()) {
  const s = data?.station, c = s?.coordinates
  if (s?.code !== station.stationId || s?.name !== station.name || s?.waterBody !== station.waterBody
    || c?.latitude !== station.latitude || c?.longitude !== station.longitude) throw new Error('Meteo LT station identity changed')
  if (!Array.isArray(data.observations) || !data.observations.length) throw new Error('Missing Meteo LT observations')
  const seen = new Set()
  const observations = data.observations.map(o => {
    const raw = o.observationTimeUtc
    const iso = typeof raw === 'string' ? raw.replace(' ', 'T') + 'Z' : ''
    const time = Date.parse(iso)
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw ?? '') || !Number.isFinite(time)
      || new Date(time).toISOString() !== iso.replace('Z', '.000Z') || time > now + 300000 || seen.has(time)) throw new Error('Invalid Meteo LT timestamp')
    seen.add(time)
    if (o.waterTemperature !== null && (!Number.isFinite(o.waterTemperature) || o.waterTemperature < -2 || o.waterTemperature > 40)) throw new Error('Invalid Meteo LT temperature')
    return { time, temperature: o.waterTemperature }
  }).sort((a,b) => b.time - a.time)
  // Latest missing (including ice cover) must not be disguised by an older value.
  const latest = observations[0]
  if (!Number.isFinite(latest.temperature)) throw new Error('Missing latest Meteo LT temperature')
  const publishedAt = new Date(latest.time).toISOString()
  return { publishedAt, stations: [{ id: station.stationId, station: station.name, waterBody: station.waterBody,
    latitude: station.latitude, longitude: station.longitude, temperature: latest.temperature, publishedAt, measurementKind: 'measured' }] }
}

export async function loadMeteoLt(fetcher = fetch) {
  const response = await fetcher(METEO_LT_URL, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Meteo LT unavailable')
  return { ...parseMeteoLt(await response.json()), fetchedAt: new Date().toISOString() }
}
