// Forum Virium Helsinki / HRI, CC BY 4.0. One shared export, never per beach.
export const UIRAS_URL = 'https://bri3.fvh.io/opendata/uiras/uiras_latest.geojson'
export const UIRAS_SITES = [{ locationId: 'eea-FI181092003', sensorId: '70B3D57050001BA6', name: 'Vetokannas', latitude: 60.27026, longitude: 24.88056, locationLatitude: 60.27, locationLongitude: 24.8811, serviceMapId: 42505 }]

export function parseUiras(data, now = Date.now()) {
  if (data?.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Invalid UiRaS collection')
  const stations = []
  for (const site of UIRAS_SITES) {
    const matches = data.features.filter(f => f.id === site.sensorId)
    if (matches.length > 1) throw new Error('Ambiguous UiRaS sensor')
    if (!matches.length) continue
    const f = matches[0], p = f.properties, m = p?.measurement, c = f.geometry?.coordinates
    if (f.geometry?.type !== 'Point' || !Array.isArray(c) || c.length !== 2
      || !c.every(Number.isFinite) || Math.abs(c[0] - site.longitude) > 0.00001 || Math.abs(c[1] - site.latitude) > 0.00001
      || p?.name !== site.name || p.servicemap_url !== `https://palvelukartta.hel.fi/fi/unit/${site.serviceMapId}`) throw new Error('UiRaS sensor moved or identity changed')
    if (!m) continue
    if (!Number.isFinite(m.temp_water) || m.temp_water < -2 || m.temp_water > 40
      || !/(Z|[+-]\d{2}:\d{2})$/.test(m.time ?? '') || !Number.isFinite(Date.parse(m.time))
      || Date.parse(m.time) > now + 300000) throw new Error('Invalid UiRaS measurement')
    stations.push({ id: site.sensorId, station: site.name, latitude: site.latitude, longitude: site.longitude,
      temperature: m.temp_water, publishedAt: new Date(m.time).toISOString(), measurementKind: 'measured' })
  }
  if (!stations.length) throw new Error('Missing UiRaS measurements')
  return { stations, publishedAt: stations.map(s => s.publishedAt).sort().at(-1) }
}

export async function loadUiras(fetcher = fetch) {
  const response = await fetcher(UIRAS_URL, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('UiRaS unavailable')
  return { ...parseUiras(await response.json()), fetchedAt: new Date().toISOString() }
}
