import { AlertTriangle, ArrowUpRight, ChevronDown, CloudRain, Database, Droplets, MapPin } from 'lucide-react'
import { CATALOG_UPDATED_ON } from './bathingWaters.generated.js'
import { classificationTone, getWaterQualityForLocation } from './waterQuality.js'

const SOURCE_META = {
  ea: {
    provider: 'Environment Agency',
    sourceUrl: (site) => `https://environment.data.gov.uk/bwq/profiles/?_search=${encodeURIComponent(site.name)}`,
  },
  nrw: {
    provider: 'Natural Resources Wales',
    sourceUrl: (site) => `https://environment.data.gov.uk/wales/bathing-waters/profiles/?_search=${encodeURIComponent(site.name)}`,
  },
  sepa: {
    provider: 'SEPA',
    sourceUrl: (site) => `https://bathingwaters.sepa.org.uk/locations-and-results/results/?location=${site.id.replace('sepa-', '')}`,
  },
  daera: {
    provider: 'DAERA',
    sourceUrl: () => 'https://www.daera-ni.gov.uk/articles/about-bathing-water-quality',
  },
}

export default function WaterQualityPanel({ location, locale, t }) {
  const quality = getWaterQualityForLocation(location)
  if (!quality) return null

  const { site, distance } = quality
  const source = SOURCE_META[site.source]
  const tone = classificationTone(site.classification)
  const formattedDistance = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(distance)
  const snapshotDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/London' }).format(new Date(`${CATALOG_UPDATED_ON}T12:00:00Z`))
  const summaryKey = site.riskLevel?.toLowerCase() === 'normal'
    ? 'summaryNormal'
    : site.riskLevel
      ? 'summaryElevated'
      : 'summaryAnnual'

  return (
    <section className={`panel water-quality-panel ${tone}`} aria-labelledby="water-quality-title">
      <details className="quality-disclosure">
        <summary>
          <span className="quality-summary-icon"><Droplets size={21} /></span>
          <div>
            <span className="eyebrow">{t('waterQuality.eyebrow')}</span>
            <h2 id="water-quality-title">{t('waterQuality.title')}</h2>
          </div>
          <div className="quality-summary-result">
            <strong>{t(`waterQuality.classes.${tone}`)}</strong>
            <span>{t(`waterQuality.${summaryKey}`)}</span>
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
                  <span><strong>{t('waterQuality.shortTerm')}</strong>{site.riskLevel.toLowerCase() === 'normal' ? t('waterQuality.riskNormal') : t('waterQuality.riskElevated')}</span>
                </div>
              ) : (
                <div className="quality-notice neutral"><Database size={17} /><span><strong>{t('waterQuality.shortTerm')}</strong>{t('waterQuality.noPrediction')}</span></div>
              )}
              {site.heavyRainRisk && <div className="quality-notice rain"><CloudRain size={17} /><span><strong>{t('waterQuality.afterRain')}</strong>{t('waterQuality.rainAdvice')}</span></div>}
            </div>
          </div>
          <div className="water-quality-footer">
            <p>{t('waterQuality.note')}</p>
            <a href={source.sourceUrl(site)} target="_blank" rel="noreferrer">{t('waterQuality.openSource')} <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </details>
    </section>
  )
}
