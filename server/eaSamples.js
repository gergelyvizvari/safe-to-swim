import { EA_BRIGHTON_SITES } from './eaBrightonSites.js'
// Environment Agency Bathing Water API, Open Government Licence v3.0.
// One regional collection serves all verified site bindings; never fetched per visitor.
export const EA_SAMPLES_URL = 'https://environment.data.gov.uk/doc/bathing-water-quality/in-season/latest.json?_pageSize=1000&min-bwq_samplingPoint.lat=50.7&max-bwq_samplingPoint.lat=50.9&min-bwq_samplingPoint.long=-0.6&max-bwq_samplingPoint.long=0.2'
export function parseEaSamples(data) {
  if (!Array.isArray(data?.result?.items) || data.result.next) throw new Error('Incomplete EA sample collection')
  const sites = data.result.items.filter(item => EA_BRIGHTON_SITES.some(site => site.externalId === item.bwq_bathingWater?.eubwidNotation)).map(item => {
    const id = item.bwq_bathingWater?.eubwidNotation
    const point = item.bwq_samplingPoint
    const timestamp = item.sampleDateTime?.inXSDDateTime?._value
    if (!/^uk[a-z0-9]+-\d+$/.test(id ?? '') || ![point?.lat, point?.long].every(Number.isFinite)
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(timestamp ?? '')
      || !Number.isFinite(Date.parse(timestamp + 'Z')) || item.isReplacedBy
      || /withdrawal/.test(JSON.stringify(item.recordStatus ?? ''))) throw new Error('Invalid EA sample identity')
    const counts = ['escherichiaColi', 'intestinalEnterococci'].map(key => {
      const value = item[`${key}Count`], qualifier = item[`${key}Qualifier`]?.countQualifierNotation
      if (!Number.isFinite(value) || value < 0 || !['<', '=', '>'].includes(qualifier)) throw new Error('Invalid EA count')
      return { key, value, qualifier }
    })
    // The provider supplies a date-time without an offset. Show only its calendar
    // date; use the earliest possible London day boundary for conservative ageing.
    const sampledOn = timestamp.slice(0, 10)
    return { id, name: item.bwq_bathingWater.name?._value ?? id, latitude: point.lat, longitude: point.long,
      sampledOn, publishedAt: new Date(Date.parse(sampledOn + 'T00:00:00Z') - 3600000).toISOString(),
      result: 'unknown', counts }
  })
  if (!sites.length || new Set(sites.map(s => s.id)).size !== sites.length) throw new Error('Empty or ambiguous EA samples')
  return { sites }
}
export async function loadEaSamples() {
  const response = await fetch(EA_SAMPLES_URL, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('EA sample collection unavailable')
  return { ...parseEaSamples(await response.json()), fetchedAt: new Date().toISOString() }
}
