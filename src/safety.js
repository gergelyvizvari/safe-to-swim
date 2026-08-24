import { AlertTriangle, Check, CircleHelp, ShieldAlert } from 'lucide-react'
import { isOffshoreWind } from './coastalLocations.js'

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
    waveHeight: Number.isFinite(conditions.waveHeight) ? Math.round(conditions.waveHeight * 10) / 10 : null,
    gusts: Number.isFinite(conditions.gusts) ? Math.round(conditions.gusts) : null,
    windSpeed: Number.isFinite(conditions.windSpeed) ? Math.round(conditions.windSpeed) : null,
    offshore: isOffshoreWind(conditions.windDirection, seaBearing),
  }
}

export function getSafety(conditions, location, t, locale) {
  const { waveHeight, gusts, windSpeed, offshore } = getSafetyReadings(conditions, location)
  if (!Number.isFinite(waveHeight) || !Number.isFinite(gusts)) {
    return {
      level: 'unknown', eyebrow: t('safety.unknownEyebrow'), title: t('safety.unknownTitle'),
      description: t('safety.unknownDescription'),
      reason: t('decision.reasons.unknown'),
      icon: CircleHelp,
    }
  }
  const formatReasons = (reasons) => new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(reasons)
  const dangerReasons = []
  if (waveHeight >= 1) dangerReasons.push(t('safety.waveReason', { value: formatNumber(waveHeight, locale) }))
  if (gusts >= 28) dangerReasons.push(t('safety.gustReason', { value: gusts }))
  if (offshore && windSpeed >= 12) dangerReasons.push(t('safety.offshoreReason'))

  if (dangerReasons.length) {
    const reasons = formatReasons(dangerReasons)
    return {
      level: 'danger', eyebrow: t('safety.dangerEyebrow'), title: t('safety.dangerTitle'),
      description: t('safety.dangerDescription', { reasons }),
      reason: t('decision.reasons.danger', { reasons }),
      icon: ShieldAlert,
    }
  }

  const cautionReasons = []
  if (waveHeight >= 0.6) cautionReasons.push(t('safety.waveReason', { value: formatNumber(waveHeight, locale) }))
  if (gusts >= 20) cautionReasons.push(t('safety.gustReason', { value: gusts }))
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

  return {
    level: 'good', eyebrow: t('safety.goodEyebrow'), title: t('safety.goodTitle'),
    description: t('safety.goodDescription'),
    reason: t(offshore === null ? 'decision.reasons.goodUnknown' : 'decision.reasons.good'),
    icon: Check,
  }
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
