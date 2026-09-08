import { ArrowUpRight, ChevronDown, Compass, Droplets, Info, Waves } from 'lucide-react'
import { CATALOG_UPDATED_ON } from './catalogMetadata.js'
import { classificationTone, getOfficialWaterUrl } from './waterQuality.js'
import { formatNumber, formatWholeNumber, formatWindSpeed, getSafetyReadings, windDataLabel, windRiskLabel, windMissingLabel, WIND_THRESHOLDS } from './safety.js'
import { compassFor } from './i18n.js'

export default function SwimAssessment({ current, wind, loading, location, quality, source, language, locale, t }) {
  const { waveHeight } = getSafetyReadings(current, location)
  const stale = source === 'stale' || source === 'unavailable'
  const wave = stale || !Number.isFinite(waveHeight) ? 'unknown' : waveHeight >= 1 ? 'danger' : waveHeight >= 0.6 ? 'caution' : 'low'
  const from = Number.isFinite(wind.windDirection)
    ? t('conditions.from', { direction: compassFor(language)[Math.round(wind.windDirection / 45) % 8] }) : null
  const hasWindData = wind.availability !== 'unavailable'
  const missingLabel = windMissingLabel(wind, t, locale)
  const waterConcern = quality?.site.classification === 'Poor' || (quality?.site.riskLevel && quality.site.riskLevel.toLowerCase() !== 'normal')
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Europe/London' }).format(new Date(`${quality?.site.catalogUpdatedOn ?? CATALOG_UPDATED_ON}T12:00:00Z`))
  const showWindAdvice = !(loading && !hasWindData) && ['dangerGusts', 'dangerOffshore', 'stale', 'noDataHelp'].includes(wind.effect)
  const modelTime = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(current.time))
  return (
    <section className={`assessment${location.marineModelSupported === false ? ' assessment-inland' : ''}`} aria-label={t('outlook.factors')}>
      {location.marineModelSupported !== false && <article className={`assessment-factor ${wave}`}>
        <header className="assessment-heading"><span className="assessment-icon"><Waves size={19} aria-hidden="true" /></span><h3>{t('outlook.waves')}</h3></header>
        <dl className="assessment-metrics"><div><dt>{t('conditions.waveHeight')}</dt><dd>{formatNumber(waveHeight, locale)} <span>m</span></dd></div></dl>
        <p className="assessment-status">{t(`outlook.${wave}`)}</p>
        {Number.isFinite(current.wavePeriod) && <p className="assessment-copy">{t('conditions.period', { value: formatNumber(current.wavePeriod, locale) })}</p>}
        <p className="assessment-footer assessment-meta">{t(stale ? 'outlook.staleLabel' : 'outlook.model', { time: modelTime })}</p>
      </article>}
      <article className={`assessment-factor ${wind.level}`}>
        <header className="assessment-heading"><span className="assessment-icon"><Compass size={19} aria-hidden="true" /></span><h3>{t('outlook.wind')}</h3>{(!loading || hasWindData) && <span className="assessment-meta">{windDataLabel(wind, t, loading)}</span>}</header>
        {hasWindData && <dl className="assessment-metrics assessment-wind-metrics">
          {[[t('outlook.wind'), wind.windSpeed], [t('safety.gusts'), wind.gusts]].map(([label, value]) => <div key={label}>
            <dt>{label}</dt><dd>{formatWholeNumber(value)} <span>mph</span></dd>
            <dd className="assessment-metric-secondary">{formatNumber(Number.isFinite(value) ? value * 1.609344 : null, locale, 0)} km/h</dd>
          </div>)}
        </dl>}
        {from && <p className="assessment-direction">{from}{wind.direction !== 'unknownDirection' && <> · {t(`conditions.${wind.direction}`)}</>}</p>}
        <p className="assessment-status">{loading && !hasWindData ? windDataLabel(wind, t, loading) : windRiskLabel(wind, t)}</p>
        {showWindAdvice && <p className="assessment-copy">{t(`windAdvice.${wind.effect}`)}</p>}
        {missingLabel && !wind.stale && hasWindData && <p className="assessment-note"><Info size={15} aria-hidden="true" /><span>{missingLabel}</span></p>}
        <details className="wind-guidance assessment-footer">
          <summary>{t('windAdvice.details')}<ChevronDown size={16} aria-hidden="true" /></summary>
          <div className="wind-guidance-content">
            {!showWindAdvice && <p>{t(`windAdvice.${wind.effect}`)}</p>}
            {wind.missing && hasWindData && !wind.stale && wind.effect !== wind.missing && <p>{t(`windAdvice.${wind.missing}`)}</p>}
            {wind.direction !== 'unknownDirection' && <>
              {wind.effect !== wind.direction && <p>{t(`windAdvice.${wind.direction}`)}</p>}
              <p>{t('windAdvice.directionEstimate')}</p>
            </>}
            <strong>{t('windAdvice.thresholds')}</strong>
            <ul>
              <li>{t('windAdvice.offshoreThreshold', { value: formatWindSpeed(WIND_THRESHOLDS.offshore, locale) })}</li>
              <li>{t('windAdvice.gustThreshold', { caution: formatWindSpeed(WIND_THRESHOLDS.gustCaution, locale), danger: formatWindSpeed(WIND_THRESHOLDS.gustDanger, locale) })}</li>
            </ul>
            <p>{t('windAdvice.limits')}</p>
            <a href="https://rnli.org/water-safety/choose-your-activity/open-water-swimming" target="_blank" rel="noreferrer">{t('windAdvice.source')} <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
        </details>
      </article>
      <article className={`assessment-factor ${waterConcern ? 'caution' : 'unknown'}`}>
        <header className="assessment-heading"><span className="assessment-icon"><Droplets size={19} aria-hidden="true" /></span><h3>{t('outlook.water')}</h3></header>
        {quality && <dl className="assessment-metrics"><div><dt>{t('waterQuality.annualShort')}</dt><dd className="assessment-quality-value">{t(`waterQuality.classes.${classificationTone(quality.site.classification)}`)}</dd></div></dl>}
        <p className="assessment-status">{t(waterConcern ? 'outlook.waterText' : 'outlook.waterUnknown')}</p>
        {quality && <>
          <p className="assessment-meta">{t('outlook.snapshot', { date })}</p>
          <p className="assessment-meta">{t('outlook.nearby', { name: quality.site.name, distance: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(quality.distance) })}</p>
          <a className="assessment-footer assessment-source" href={getOfficialWaterUrl(quality.site)} target="_blank" rel="noreferrer">{t('outlook.waterCheck')} <ArrowUpRight size={16} aria-hidden="true" /></a>
        </>}
      </article>
    </section>
  )
}
