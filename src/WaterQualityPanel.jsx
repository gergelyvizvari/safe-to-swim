import { AlertTriangle, ArrowUpRight, ChevronDown, CloudRain, Database, Droplets, MapPin } from 'lucide-react'
import { CATALOG_UPDATED_ON } from './bathingWaters.generated.js'
import { classificationTone, getWaterQualityForLocation, getOfficialWaterUrl } from './waterQuality.js'

const SOURCE_META = {
  eea: { provider: 'European Environment Agency (EEA)' },
  ea: {
    provider: 'Environment Agency',
  },
  nrw: {
    provider: 'Natural Resources Wales',
  },
  sepa: {
    provider: 'SEPA',
  },
  daera: {
    provider: 'DAERA',
  },
}

export default function WaterQualityPanel({ location, locale, t }) {
  const quality = getWaterQualityForLocation(location)
  if (!quality) return null

  const { site, distance } = quality
  const source = SOURCE_META[site.source]
  const tone = classificationTone(site.classification)
  const formattedDistance = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(distance)
  const snapshotDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/London' }).format(new Date(`${site.catalogUpdatedOn ?? CATALOG_UPDATED_ON}T12:00:00Z`))

  return (
    <section className={`panel water-quality-panel ${tone}`} aria-labelledby="water-quality-title">
      <details className="quality-disclosure">
        <summary>
          <div>
            <span className="eyebrow">{t('waterQuality.eyebrow')}</span>
            <h2 id="water-quality-title">{t('waterQuality.title')}<Droplets size={21} aria-hidden="true" /></h2>
          </div>
          <div className="quality-summary-result">
            <strong>{t(`waterQuality.classes.${tone}`)}</strong>
            <span>{t('outlook.snapshot', { date: snapshotDate })}</span>
          </div>
          <span className="official-data"><Database size={14} />{t('waterQuality.official')}</span>
          <ChevronDown className="quality-chevron" size={20} aria-hidden="true" />
        </summary>
        <div className="quality-expanded">
          <div className="water-quality-grid">
            <div className="classification-card">
              <span className="quality-icon"><Droplets size={22} /></span>
              <div>
                <span>{t('waterQuality.annual', { year: site.classificationYear ?? '—' })}</span>
                <strong>{t(`waterQuality.classes.${tone}`)}</strong>
              </div>
            </div>
            <div className="quality-details">
              <div><span>{t('waterQuality.monitoringSite')}</span><strong><MapPin size={14} />{site.name}</strong>{distance > 0.2 && <small>{t('waterQuality.nearest', { distance: formattedDistance })}</small>}</div>
              <div><span>{t('waterQuality.provider')}</span><strong>{source.provider}</strong><small>{t('waterQuality.snapshot', { date: snapshotDate })}</small></div>
            </div>
            <div className="quality-advice">
              {site.riskLevel ? (
                <div className={`quality-notice risk-${site.riskLevel.toLowerCase()}`}>
                  <AlertTriangle size={17} />
                  <span><strong>{t('waterQuality.shortTerm')}</strong>{site.riskLevel.toLowerCase() === 'normal' ? t('outlook.normal') : t('outlook.elevated')}</span>
                </div>
              ) : (
                <div className="quality-notice neutral"><Database size={17} /><span><strong>{t('waterQuality.shortTerm')}</strong>{t('waterQuality.noPrediction')}</span></div>
              )}
              {site.heavyRainRisk && <div className="quality-notice rain"><CloudRain size={17} /><span><strong>{t('waterQuality.afterRain')}</strong>{t('waterQuality.rainAdvice')}</span></div>}
            </div>
          </div>
          <div className="water-quality-footer">
            <p>{t('waterQuality.note')}</p>
            <a href={getOfficialWaterUrl(site)} target="_blank" rel="noreferrer">{t('waterQuality.openSource')} <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </details>
    </section>
  )
}
