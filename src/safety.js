import { activeWeatherWarning, weatherAlertMessages } from './weatherAlertMessages.js'
import { AlertTriangle, Check, CircleHelp, ShieldAlert } from 'lucide-react'
import { getWaterQualityForLocation } from './waterQuality.js'
import { isOffshoreWind, shoreWindDirection } from './locationUtils.js'
import { assessLake } from './lakeAssessment.js'

// Product warning thresholds in mph, not universal swimming safety limits.
export const WIND_THRESHOLDS = { offshore: 12, gustCaution: 20, gustDanger: 28 }

export function formatNumber(value, locale, fractionDigits = 1) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatWholeNumber(value) {
  return Number.isFinite(value) ? Math.round(value) : '—'
}

export function getSafetyReadings(conditions, location) {
  const seaBearing = Number.isFinite(location.seaBearing) ? location.seaBearing : conditions.seaBearing
  return {
    waveHeight: location.marineModelSupported !== false && Number.isFinite(conditions.waveHeight) ? Math.round(conditions.waveHeight * 10) / 10 : null,
    gusts: Number.isFinite(conditions.gusts) ? Math.round(conditions.gusts) : null,
    windSpeed: Number.isFinite(conditions.windSpeed) ? Math.round(conditions.windSpeed) : null,
    offshore: location.marineModelSupported === false ? null : isOffshoreWind(conditions.windDirection, seaBearing),
  }
}

export function getSafety(conditions, location, t, locale, options = {}) {
  const result = baseSafety(conditions, location, t, locale, options)
  const now = options.now ?? Date.now()
  const warning = options.weatherAlerts?.locationId === location.id ? activeWeatherWarning(options.weatherAlerts, options.isNow === false ? conditions.time : now, now) : null
  if (!warning) return result
  const copy = weatherAlertMessages(locale)
  const level = warning.hazard === 3 || warning.level >= 3 ? 'danger' : 'caution'
  if (result.level === 'danger' && level !== 'danger') return result
  return { ...result, level, eyebrow: copy.title, title: copy[level], description: warning.event,
    reason: warning.event, action: copy.action, known: [warning.event], icon: level === 'danger' ? ShieldAlert : AlertTriangle }
}

function baseSafety(conditions, location, t, locale, { source, quality = getWaterQualityForLocation(location), observations, now, isNow = true } = {}) {
  if (location.waterType === 'lake' || location.marineModelSupported === false) {
    const wind = getWindAssessment(conditions, location, source)
    const evidence = assessLake(conditions, location, { source, quality, observations, now, isNow, wind, thresholds: WIND_THRESHOLDS })
    const known = [...evidence.reasons, ...evidence.known].map(key => t(`lakeDecision.${key}`))
    const description = wind.availability !== 'unavailable' ? `${windDataLabel(wind, t)}: ${formatWindReadings(wind, t, locale)}.` : windDataLabel(wind, t)
    const action = t(`lakeDecision.${evidence.key}Action`)
    return { level: evidence.level, eyebrow: t('lakeDecision.label'), title: t(`lakeDecision.${evidence.key}`), description,
      reason: `${t(`lakeDecision.${evidence.key}`)} ${evidence.reasons.map(key => t(`lakeDecision.${key}`)).join(' ')} ${description}`, action, known, gaps: evidence.gaps.map(key => t(`lakeDecision.${key}`)),
      icon: evidence.level === 'danger' ? ShieldAlert : evidence.level === 'caution' ? AlertTriangle : CircleHelp }
  }
  const special = (level, key) => ({ level, eyebrow: t(`outlook.${key}Label`), title: t(`outlook.${key}Title`), description: t(`outlook.${key}Text`), reason: t(`outlook.${key}Text`), icon: level === 'unknown' ? CircleHelp : AlertTriangle })
  if (source === 'stale' || source === 'unavailable') return special('unknown', 'stale')
  const waterConcern = ['Poor', 'Closed'].includes(quality?.site.classification) || (quality?.site.riskLevel && quality.site.riskLevel.toLowerCase() !== 'normal')
  const { waveHeight, gusts, windSpeed, offshore } = getSafetyReadings(conditions, location)
  const formatReasons = (reasons) => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(reasons)
  const dangerReasons = []
  if (waveHeight >= 1) dangerReasons.push(t('safety.waveReason', { value: formatNumber(waveHeight, locale) }))
  if (gusts >= WIND_THRESHOLDS.gustDanger) dangerReasons.push(t('safety.gustReason', { value: gusts }))
  if (offshore && windSpeed >= WIND_THRESHOLDS.offshore) dangerReasons.push(t('safety.offshoreReason'))

  if (dangerReasons.length) {
    const reasons = formatReasons(dangerReasons)
    return {
      level: 'danger', eyebrow: t('safety.dangerEyebrow'), title: t('safety.dangerTitle'),
      description: t('safety.dangerDescription', { reasons }),
      reason: t('decision.reasons.danger', { reasons }),
      icon: ShieldAlert,
    }
  }

  if (waterConcern) return special('caution', 'water')
  if (!Number.isFinite(waveHeight) || !Number.isFinite(gusts)) {
    return {
      level: 'unknown', eyebrow: t('safety.unknownEyebrow'), title: t('safety.unknownTitle'),
      description: t('safety.unknownDescription'),
      reason: t('decision.reasons.unknown'),
      icon: CircleHelp,
    }
  }
  const cautionReasons = []
  if (waveHeight >= 0.6) cautionReasons.push(t('safety.waveReason', { value: formatNumber(waveHeight, locale) }))
  if (gusts >= WIND_THRESHOLDS.gustCaution) cautionReasons.push(t('safety.gustReason', { value: gusts }))
  if (offshore) cautionReasons.push(t('safety.offshoreReason'))

  if (cautionReasons.length) {
    const reasons = formatReasons(cautionReasons)
    return {
      level: 'caution', eyebrow: t('safety.cautionEyebrow'), title: t('safety.cautionTitle'),
      description: t('safety.cautionDescription', { reasons }),
      reason: t('decision.reasons.caution', { reasons }),
      icon: AlertTriangle,
    }
  }

  if (offshore === null || !Number.isFinite(windSpeed)) {
    const wind = getWindAssessment(conditions, location, source)
    const description = `${formatWindReadings(wind, t, locale)}. ${t(`windAdvice.${wind.missing}`)}`
    return { ...special('unknown', 'wind'), title: t('windAdvice.incompleteTitle'), description, reason: description }
  }


  return {
    level: 'good', eyebrow: t('safety.goodEyebrow'), title: t('safety.goodTitle'),
    description: t('safety.goodDescription'),
    reason: t(offshore === null ? 'decision.reasons.goodUnknown' : 'decision.reasons.good'),
    icon: Check,
  }
}

export function getWindAssessment(conditions, location, source) {
  const readings = getSafetyReadings(conditions, location)
  // Data availability and assessment completeness are independent. In
  // particular, absent shoreline metadata must not hide a valid wind forecast.
  const windSpeed = source === 'unavailable' ? null : readings.windSpeed
  const gusts = source === 'unavailable' ? null : readings.gusts
  const windDirection = source !== 'unavailable' && Number.isFinite(conditions.windDirection) ? conditions.windDirection : null
  const { offshore } = readings
  const bearing = Number.isFinite(location.seaBearing) ? location.seaBearing : conditions.seaBearing
  const shoreKnown = location.marineModelSupported !== false && Number.isFinite(bearing)
  const missingFields = [
    ...(!Number.isFinite(windSpeed) ? ['windSpeed'] : []),
    ...(!Number.isFinite(gusts) ? ['gusts'] : []),
    ...(!Number.isFinite(windDirection) ? ['windDirection'] : []),
    ...(!shoreKnown ? ['shoreOrientation'] : []),
  ]
  const measurementCount = [windSpeed, gusts, windDirection].filter(Number.isFinite).length
  const availability = !measurementCount ? 'unavailable' : source === 'stale' ? 'stale' : measurementCount === 3 ? 'available' : 'partial'
  const stale = availability === 'stale'
  const unavailable = availability === 'unavailable'
  const direction = stale || unavailable || !shoreKnown ? 'unknownDirection' : shoreWindDirection(windDirection, bearing)
  const missing = missingFields.includes('windSpeed') || missingFields.includes('gusts') ? 'missingSpeed'
    : missingFields.includes('windDirection') ? 'missingDirection' : missingFields.includes('shoreOrientation') ? 'missingShore' : null
  const level = stale || unavailable ? 'unknown' : gusts >= WIND_THRESHOLDS.gustDanger || (offshore && windSpeed >= WIND_THRESHOLDS.offshore) ? 'danger'
    : gusts >= WIND_THRESHOLDS.gustCaution || offshore ? 'caution' : missing ? 'unknown' : 'low'
  const effect = unavailable ? 'noDataHelp' : stale ? 'stale' : gusts >= WIND_THRESHOLDS.gustDanger ? 'dangerGusts'
    : offshore && windSpeed >= WIND_THRESHOLDS.offshore ? 'dangerOffshore'
    : gusts >= WIND_THRESHOLDS.gustCaution ? 'cautionGusts' : missing ?? (offshore ? 'offshore' : 'belowThreshold')
  return { windSpeed, gusts, windDirection, direction, level, effect, missing, missingFields, availability, stale }
}

export function windDataLabel(wind, t, loading = false) {
  return t(`windAdvice.data.${loading && wind.availability === 'unavailable' ? 'loading' : wind.availability}`)
}

export function windRiskLabel(wind, t) {
  if (wind.stale || wind.availability === 'unavailable') return t('windAdvice.notAssessed')
  return wind.level === 'unknown' ? t('windAdvice.partialAssessment')
    : wind.level === 'low' ? t('windAdvice.belowWarning') : t(`outlook.${wind.level}`)
}

export function windMissingLabel(wind, t, locale) {
  const fields = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' })
    .format(wind.missingFields.map(field => t(`windAdvice.fields.${field}`)))
  return fields ? t('windAdvice.missingFields', { fields }) : ''
}

export function formatWindSpeed(mph, locale) {
  if (!Number.isFinite(mph)) return '—'
  return `${formatWholeNumber(mph)} mph / ${formatNumber(mph * 1.609344, locale, 0)} km/h`
}

export function formatWindReadings(wind, t, locale) {
  return t('windAdvice.readings', { speed: formatWindSpeed(wind.windSpeed, locale), gusts: formatWindSpeed(wind.gusts, locale) })
}

export function compareConditions(selected, current, location) {
  const selectedReadings = getSafetyReadings(selected, location)
  const currentReadings = getSafetyReadings(current, location)
  const offshoreRisk = (value) => value === true ? 2 : value === null ? 1 : 0
  const changes = [
    Number.isFinite(selectedReadings.waveHeight) && Number.isFinite(currentReadings.waveHeight)
      ? selectedReadings.waveHeight - currentReadings.waveHeight
      : null,
    Number.isFinite(selectedReadings.gusts) && Number.isFinite(currentReadings.gusts)
      ? selectedReadings.gusts - currentReadings.gusts
      : null,
    offshoreRisk(selectedReadings.offshore) - offshoreRisk(currentReadings.offshore),
  ].filter((change) => Number.isFinite(change) && change !== 0)

  if (!changes.length) return 'stable'
  if (changes.every((change) => change > 0)) return 'worse'
  if (changes.every((change) => change < 0)) return 'better'
  return 'mixed'
}
