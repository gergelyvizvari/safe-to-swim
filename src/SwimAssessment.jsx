import { Compass, Droplets, Waves } from 'lucide-react'
import { CATALOG_UPDATED_ON } from './bathingWaters.generated.js'
import { getOfficialWaterUrl } from './waterQuality.js'
import { getSafetyReadings } from './safety.js'

export default function SwimAssessment({ current, location, quality, source, locale, t }) {
  const { waveHeight, gusts, windSpeed, offshore } = getSafetyReadings(current, location)
  const stale = source === 'stale' || source === 'unavailable'
  const wave = stale || !Number.isFinite(waveHeight) ? 'unknown' : waveHeight >= 1 ? 'danger' : waveHeight >= 0.6 ? 'caution' : 'low'
  const wind = stale ? 'unknown' : gusts >= 28 || (offshore && windSpeed >= 12) ? 'danger'
    : gusts >= 20 || offshore ? 'caution'
    : !Number.isFinite(gusts) || !Number.isFinite(windSpeed) || offshore === null ? 'unknown' : 'low'
  const waterConcern = quality?.site.classification === 'Poor' || (quality?.site.riskLevel && quality.site.riskLevel.toLowerCase() !== 'normal')
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Europe/London' }).format(new Date(`${quality?.site.catalogUpdatedOn ?? CATALOG_UPDATED_ON}T12:00:00Z`))
  return (
    <section className="assessment" aria-label={t('outlook.factors')}>
      {location.marineModelSupported !== false && <div className={`assessment-factor ${wave}`}><Waves size={18} /><div><strong>{t('outlook.waves')}</strong><span>{t(`outlook.${wave}`)}</span></div></div>}
      <div className={`assessment-factor ${wind}`}><Compass size={18} /><div><strong>{t('outlook.wind')}</strong><span>{t(`outlook.${wind}`)}</span>{wind !== 'unknown' && <small>{t(offshore === null ? 'decision.wind.unknown' : offshore ? 'outlook.offshore' : 'outlook.onshore')}</small>}</div></div>
      <div className={`assessment-factor ${waterConcern ? 'caution' : 'unknown'}`}><Droplets size={18} /><div><strong>{t('outlook.water')}</strong><span>{t(waterConcern ? 'outlook.waterText' : 'outlook.waterUnknown')}</span>{quality && <><small>{t('outlook.snapshot', { date })}</small><small>{t('outlook.nearby', { name: quality.site.name, distance: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(quality.distance) })}</small><a href={getOfficialWaterUrl(quality.site)} target="_blank" rel="noreferrer">{t('outlook.waterCheck')}</a></>}</div></div>
    </section>
  )
}
