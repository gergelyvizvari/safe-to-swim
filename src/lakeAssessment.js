import { isObservationStale } from './balaton.js'

// Only observations assigned to this site can influence its assessment. A
// water-body observation is not silently promoted to a site observation.
export function assessLake(conditions, location, { source, quality, observations, now = Date.now(), isNow = true, wind, thresholds }) {
  const weatherFresh = source !== 'stale' && source !== 'unavailable'
  const reasons = []
  const known = []
  const gaps = ['localWater']
  let level = 'unknown'
  const addRisk = (key, severity) => {
    reasons.push(key)
    if (severity === 'danger' || level !== 'danger') level = severity
  }
  if (weatherFresh) {
    if ([95, 96, 99].includes(conditions.weatherCode)) addRisk('thunder', 'danger')
    if (wind.gusts >= thresholds.gustDanger) addRisk('gustDanger', 'danger')
    else if (wind.gusts >= thresholds.gustCaution || wind.windSpeed >= thresholds.gustCaution) addRisk('gustCaution', 'caution')
    if (Number.isFinite(wind.windSpeed) && Number.isFinite(wind.gusts) && wind.gusts < thresholds.gustCaution && wind.windSpeed < thresholds.gustCaution) known.push('lowerWind')
    if (!Number.isFinite(wind.windSpeed) || !Number.isFinite(wind.gusts)) gaps.push('windMissing')
    if (!Number.isFinite(conditions.weatherCode)) gaps.push('weatherMissing')
  } else gaps.push('weatherStale')

  const siteQuality = quality?.distance === 0 && quality.site?.id === location.id ? quality.site : null
  if (siteQuality?.classification === 'Closed') addRisk('closure', 'danger')
  else if (siteQuality?.classification === 'Poor' || siteQuality?.riskLevel && siteQuality.riskLevel.toLowerCase() !== 'normal') addRisk('qualityConcern', 'caution')

  const assigned = isNow && observations?.locationId === location.id
    ? (observations.items ?? []).filter(item => item.format !== 'link' && item.status !== 'unmatched'
      && location.sources?.some(binding => binding.targetId === item.targetId && binding.type === item.type && binding.coverage === item.coverage)) : []
  const fresh = !observations?.error
    ? assigned.filter(item => item.status === 'available'
      && Number.isFinite(item.staleSeconds) && item.staleSeconds > 0
      && !isObservationStale(item.publishedAt, item.staleSeconds * 1000, now)
      && !isObservationStale(item.checkedAt, 3 * 60000, now))
    : []
  const storm = fresh.filter(item => item.type === 'storm' && Array.isArray(item.basins))
  const specificStorm = storm.filter(item => ['basin', 'site'].includes(item.coverage) && item.basins.length === 1 && [0, 1, 2].includes(item.basins[0].level))
  const coversWholeLake = item => item.coverage === 'water_body' && item.basins.length === 3 && ['west', 'central', 'east'].every(key => item.basins.some(basin => basin.basin === key))
  const unresolved = assigned.some(item => !fresh.includes(item) && Number.isFinite(Date.parse(item.publishedAt))
    && (item.type === 'storm' && item.basins?.some(basin => [1, 2].includes(basin.level))
      && !(specificStorm.length ? specificStorm : storm.filter(coversWholeLake)).some(report => report.basins.every(basin => basin.level === 0) && Date.parse(report.publishedAt) >= Date.parse(item.publishedAt))
      || item.type === 'quality' && item.coverage === 'site' && item.sample?.result === 'fail'))
  if (unresolved) known.push('previousConcern')
  let hasStormCoverage = false
  for (const item of specificStorm.length ? specificStorm : storm) {
    const levels = item.basins.map(basin => basin.level)
    const valid = levels.length > 0 && levels.every(value => [0, 1, 2].includes(value))
    const exact = ['basin', 'site'].includes(item.coverage) && levels.length === 1
    const wholeLake = coversWholeLake(item)
    if (valid && (exact || wholeLake)) hasStormCoverage = true
    if (valid && (exact || wholeLake) && levels.every(value => value === 2)) addRisk('stormDanger', 'danger')
    else if (valid && (exact || wholeLake) && levels.every(value => value >= 1)) addRisk('stormCaution', 'caution')
    else if (levels.some(value => value > 0)) addRisk('regionalStorm', 'caution')
    else if (valid && (exact || wholeLake)) known.push('stormClear')
  }
  if (!isNow) gaps.push('futureWarnings')
  else if (!hasStormCoverage) gaps.push(observations?.loading ? 'warningsLoading' : 'warningsUnknown')
  if (fresh.some(item => item.type === 'quality' && item.coverage === 'site' && item.sample?.result === 'fail')) addRisk('failedSample', 'danger')
  if (fresh.some(item => item.type === 'wind' && item.stations?.some(station => station.windKmh >= thresholds.gustCaution * 1.609344 || station.gustKmh >= thresholds.gustCaution * 1.609344))) addRisk('stationWind', 'caution')

  const key = level === 'danger' ? 'avoid' : level === 'caution' ? 'caution' : unresolved ? 'unresolved' : known.includes('lowerWind') ? 'limited' : 'insufficient'
  return { level, key, reasons: [...new Set(reasons)], known: [...new Set(known)], gaps: [...new Set(gaps)] }
}
