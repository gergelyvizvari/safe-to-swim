import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  ArrowUp,
  Beer,
  Camera,
  Check,
  ChevronDown,
  Compass,
  Droplets,
  Download,
  Flag,
  Info,
  Languages,
  LocateFixed,
  MapPin,
  Play,
  RefreshCw,
  ShieldAlert,
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react'
import { useCoastalConditions } from './useCoastalConditions.js'
import { compassFor, DEFAULT_LANGUAGE, LANGUAGES, localeFor, makeTranslator } from './i18n.js'
import { findCoastalLocation, findNearestCoastalLocation, isOffshoreWind } from './coastalLocations.js'
import { LocationPickerScreen } from './LocationPickerScreen.jsx'
import { InstallGuide } from './InstallGuide.jsx'
import { SupportPrompt } from './SupportPrompt.jsx'
import { usePWAInstall } from './usePWAInstall.js'
import { getWebcamForLocation } from './webcamSources.js'
import { classificationTone, getWaterQualityForLocation } from './waterQuality.js'

const WaterQualityPanel = lazy(() => import('./WaterQualityPanel.jsx'))
const UKCoastExplorer = lazy(() => import('./UKCoastExplorer.jsx').then((module) => ({ default: module.UKCoastExplorer })))
const CoastSafetyMap = lazy(() => import('./CoastSafetyMap.jsx').then((module) => ({ default: module.CoastSafetyMap })))

function directionLabel(degrees, language) {
  if (!Number.isFinite(degrees)) return '—'
  return compassFor(language)[Math.round(degrees / 45) % 8]
}

function weatherLabel(code, t) {
  if (code === 0) return t('weather.clear')
  if (code <= 3) return t('weather.partlyCloudy')
  if (code <= 48) return t('weather.fog')
  if (code <= 67) return t('weather.rain')
  if (code <= 77) return t('weather.drizzle')
  if (code <= 82) return t('weather.showers')
  return t('weather.storm')
}

function formatNumber(value, locale, fractionDigits = 1) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

function getSafetyReadings(conditions, location) {
  return {
    waveHeight: Math.round(conditions.waveHeight * 10) / 10,
    gusts: Math.round(conditions.gusts),
    windSpeed: Math.round(conditions.windSpeed),
    offshore: isOffshoreWind(conditions.windDirection, location.seaBearing),
  }
}

function getSafety(conditions, location, t, locale) {
  const { waveHeight, gusts, windSpeed, offshore } = getSafetyReadings(conditions, location)
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

function compareConditions(selected, current, location) {
  const selectedReadings = getSafetyReadings(selected, location)
  const currentReadings = getSafetyReadings(current, location)
  const offshoreRisk = (value) => value === true ? 2 : value === null ? 1 : 0
  const changes = [
    selectedReadings.waveHeight - currentReadings.waveHeight,
    selectedReadings.gusts - currentReadings.gusts,
    offshoreRisk(selectedReadings.offshore) - offshoreRisk(currentReadings.offshore),
  ].filter((change) => change !== 0)

  if (!changes.length) return 'stable'
  if (changes.every((change) => change > 0)) return 'worse'
  if (changes.every((change) => change < 0)) return 'better'
  return 'mixed'
}

function formatTime(dateString, locale, options = {}) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', ...options,
  }).format(new Date(dateString))
}

function formatDate(dateString, locale) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/London', weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date(dateString))
}

function tideDayLabel(dateString, currentTime, locale, t) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const eventDate = formatter.format(new Date(dateString))
  const today = formatter.format(new Date(currentTime))
  const tomorrow = formatter.format(new Date(new Date(currentTime).getTime() + 86400000))
  if (eventDate === today) return t('tide.today')
  if (eventDate === tomorrow) return t('tide.tomorrow')
  return new Intl.DateTimeFormat(locale, { timeZone: 'Europe/London', weekday: 'short' }).format(new Date(dateString))
}

function Header({ location, onOpenLocationPicker, onUseCurrentLocation, onOpenSupport, onInstall, showInstall, locating, locationFeedback, onRefresh, loading, language, onLanguageChange, t }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={t('header.home')}>
        <span className="brand-mark"><Waves size={21} strokeWidth={2.4} /></span>
        <span>safe<span>to</span>swim</span>
      </a>
      <div className="header-actions">
        <button className="location-picker" type="button" onClick={onOpenLocationPicker} aria-label={t('header.chooseLocation')}>
          <MapPin size={17} />
          <span className="location-picker-label">{location.name}</span>
        </button>
        <button
          className={`icon-button geolocation-button ${locating ? 'locating' : ''}`}
          type="button"
          onClick={onUseCurrentLocation}
          disabled={locating}
          aria-label={locating ? t('header.locating') : t('header.locate')}
          aria-describedby={locationFeedback ? 'location-feedback' : undefined}
          title={locating ? t('header.locating') : t('header.locate')}
        >
          <LocateFixed size={18} />
        </button>
        <span className="sr-only" id="location-feedback" aria-live="polite">{locationFeedback}</span>
        <label className="language-picker">
          <Languages size={16} aria-hidden="true" />
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label={t('header.language')}>
            {LANGUAGES.map((item) => <option value={item.code} key={item.code}>{item.code.toUpperCase()} · {item.label}</option>)}
          </select>
        </label>
        {showInstall && (
          <button className="icon-button install-trigger" type="button" onClick={onInstall} aria-label={t('install.open')} title={t('install.open')}>
            <Download size={17} />
          </button>
        )}
        <button className="icon-button support-trigger" type="button" onClick={onOpenSupport} aria-label={t('support.open')} title={t('support.open')}>
          <Beer size={17} />
        </button>
        <button className="icon-button refresh-button" type="button" onClick={onRefresh} aria-label={t('header.refresh')}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
      </div>
    </header>
  )
}

function SafetyHero({ safety, current, source, loading, language, locale, isNow, quality, t }) {
  const StatusIcon = safety.icon
  const qualityTone = quality ? classificationTone(quality.site.classification) : 'unclassified'
  const windDirection = directionLabel(current.windDirection, language)
  return (
    <section className={`safety-hero ${safety.level}`} aria-labelledby="safety-title">
      <div className="hero-content">
        <div className="status-pill"><StatusIcon size={16} />{safety.eyebrow}</div>
        <h1 id="safety-title">{safety.title}</h1>
        <p>{safety.description}</p>
        <div className="hero-meta">
          <span>{formatDate(current.time, locale)}</span>
          <span aria-hidden="true">•</span>
          <span>{isNow ? t('safety.updatedAt', { time: formatTime(current.time, locale) }) : t('decision.selectedAt', { time: formatTime(current.time, locale) })}</span>
          <span className="live-dot"><i />{loading ? t('safety.updating') : source === 'live' ? t('safety.liveData') : t('safety.sampleData')}</span>
        </div>
      </div>
      <div className="wave-visual" aria-hidden="true">
        <svg viewBox="0 0 430 250" fill="none">
          <path d="M-30 173C35 144 92 147 137 177C182 207 242 206 282 166C323 126 381 127 452 159" />
          <path d="M-30 197C38 166 91 171 139 199C188 228 242 225 289 188C337 151 394 153 460 182" />
          <path d="M-20 221C49 192 101 196 149 223C198 251 253 249 300 213C347 177 401 179 468 207" />
        </svg>
      </div>
      <div className="hero-sea-facts">
        <article className="hero-sea-fact hero-sea-temperature">
          <span>{t('conditions.waterTemperature')}</span>
          <strong>{formatNumber(current.seaTemperature, locale)} <small>°C</small></strong>
        </article>
        <article className={`hero-sea-fact hero-water-quality ${qualityTone}`}>
          <span>{t('waterQuality.annualShort')}</span>
          <strong>{t(`waterQuality.classes.${qualityTone}`)}</strong>
        </article>
        <article className="hero-sea-fact hero-reading">
          <span>{t('safety.wave')}</span>
          <strong>{formatNumber(current.waveHeight, locale)} <small>m</small></strong>
        </article>
        <article className="hero-sea-fact hero-wind-fact">
          <span>{t('safety.gusts')}</span>
          <div className="hero-wind-reading">
            <span className="hero-wind-compass" aria-hidden="true">
              <span className="hero-compass-north">N</span>
              <span className="hero-wind-needle" style={{ transform: `rotate(${current.windDirection}deg)` }} />
            </span>
            <strong>{Math.round(current.gusts)} <small>mph</small></strong>
            <span className="sr-only">{t('conditions.from', { direction: windDirection })}</span>
          </div>
        </article>
      </div>
    </section>
  )
}

function MetricCard({ icon: Icon, label, value, unit, detail, tone, children }) {
  return (
    <article className={`metric-card ${tone ?? ''}`}>
      <div className="metric-heading">
        <span className="metric-icon"><Icon size={19} /></span>
        <span>{label}</span>
      </div>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <div className="metric-detail">{detail}</div>
      {children}
    </article>
  )
}

function ConditionsGrid({ current, forecast, language, locale, t }) {
  const windDirection = directionLabel(current.windDirection, language)
  const isRising = forecast[1]?.seaLevel >= current.seaLevel
  return (
    <section className="metrics-grid" aria-label={t('conditions.aria')}>
      <MetricCard
        icon={Waves} label={t('conditions.waveHeight')} value={formatNumber(current.waveHeight, locale)} unit="m"
        detail={t('conditions.period', { value: formatNumber(current.wavePeriod, locale) })} tone={current.waveHeight >= 1 ? 'metric-warn' : ''}
      >
        <div className="mini-waves" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </MetricCard>
      <MetricCard
        icon={Wind} label={t('conditions.wind')} value={Math.round(current.windSpeed)} unit="mph"
        detail={t('conditions.gusts', { value: Math.round(current.gusts) })} tone={current.gusts >= 28 ? 'metric-warn' : ''}
      >
        <div className="direction"><Compass size={15} style={{ transform: `rotate(${current.windDirection}deg)` }} />{t('conditions.from', { direction: windDirection })}</div>
      </MetricCard>
      <MetricCard
        icon={Droplets} label={t('conditions.seaLevel')} value={formatNumber(current.seaLevel, locale)} unit="m MSL"
        detail={isRising ? t('conditions.rising') : t('conditions.falling')}
      >
        <div className="tide-line" aria-hidden="true"><span /></div>
      </MetricCard>
      <MetricCard
        icon={Thermometer} label={t('conditions.waterTemperature')} value={formatNumber(current.seaTemperature, locale)} unit="°C"
        detail={`${t('conditions.air', { value: Math.round(current.temperature) })} · ${weatherLabel(current.weatherCode, t)}`}
      >
        <div className="temperature-note"><Info size={14} /> {t('conditions.wetsuit')}</div>
      </MetricCard>
    </section>
  )
}

function SwimDecision({ current, forecast, location, source, loading, language, locale, quality, t }) {
  const currentTime = new Date(current.time).getTime()
  const hours = [
    current,
    ...forecast.filter((hour) => new Date(hour.time).getTime() > currentTime),
  ].slice(0, 8)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = hours[selectedIndex]
  const safety = getSafety(selected, location, t, locale)
  const currentSafety = getSafety(current, location, t, locale)
  const selectedOffshore = getSafetyReadings(selected, location).offshore
  const windStatus = selectedOffshore === null ? 'unknown' : selectedOffshore ? 'offshore' : 'safe'
  const SelectedIcon = safety.icon
  const rank = { good: 0, caution: 1, danger: 2 }
  const change = selectedIndex === 0
    ? 'now'
    : rank[safety.level] < rank[currentSafety.level]
      ? 'better'
      : rank[safety.level] > rank[currentSafety.level]
        ? 'worse'
        : compareConditions(selected, current, location)

  return (
    <>
      <SafetyHero safety={safety} current={selected} source={source} loading={loading} language={language} locale={locale} isNow={selectedIndex === 0} quality={quality} t={t} />
      <section className="panel decision-panel" aria-labelledby="decision-title">
        <div className="section-heading decision-heading">
          <div>
            <span className="eyebrow">{t('decision.eyebrow')}</span>
            <h2 id="decision-title">{t('decision.title')}</h2>
          </div>
          <span className="decision-hint">{t('decision.hint')}</span>
        </div>
        <div className="decision-times" role="group" aria-label={t('decision.aria')}>
          {hours.map((hour, index) => {
            const hourSafety = getSafety(hour, location, t, locale)
            return (
              <button
                className={`decision-time ${hourSafety.level} ${selectedIndex === index ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                key={`${hour.time}-${index}`}
              >
                <span>{index === 0 ? t('forecast.now') : formatTime(hour.time, locale)}</span>
                <strong><i />{t(`decision.levels.${hourSafety.level}`)}</strong>
              </button>
            )
          })}
        </div>
        <div className={`decision-summary ${safety.level}`} role="status" aria-live="polite">
          <span className="decision-summary-icon"><SelectedIcon size={19} /></span>
          <div>
            <strong>{t(`decision.change.${change}`)}</strong>
            <span>{t('decision.reasonDetails', {
              time: selectedIndex === 0 ? t('forecast.now') : formatTime(selected.time, locale),
              reason: safety.reason,
            })}</span>
          </div>
          <div className="decision-readings" aria-hidden="true">
            <span><Waves size={15} />{formatNumber(selected.waveHeight, locale)} m</span>
            <span><Wind size={15} />{Math.round(selected.gusts)} mph</span>
            <span><Compass size={15} />{t(`decision.wind.${windStatus}`)}</span>
          </div>
        </div>
        <div className="forecast-footnote"><Info size={15} /> {t('forecast.note')}</div>
      </section>
    </>
  )
}

function DetailedConditions({ data, location, language, locale, t, safety, onLocationChange }) {
  const [hasOpened, setHasOpened] = useState(false)
  return (
    <details className="details-disclosure" onToggle={(event) => event.currentTarget.open && setHasOpened(true)}>
      <summary>
        <div>
          <span className="eyebrow">{t('details.eyebrow')}</span>
          <strong>{t('details.title')}</strong>
        </div>
        <span>{t('details.summary')}</span>
        <ChevronDown size={20} aria-hidden="true" />
      </summary>
      {hasOpened && <div className="details-content">
        <ConditionsGrid current={data.current} forecast={data.forecast} language={language} locale={locale} t={t} />
        <SafetyChecklist current={data.current} location={location} t={t} />
        <Suspense fallback={null}><UKCoastExplorer selectedLocation={location} onSelect={onLocationChange} t={t} /></Suspense>
        <Suspense fallback={null}><CoastSafetyMap safety={safety} current={data.current} location={location} t={t} /></Suspense>
      </div>}
    </details>
  )
}

function TideCurve({ tides, t }) {
  if (!tides.series?.length) return null
  const width = 560
  const height = 138
  const paddingX = 18
  const paddingY = 19
  const levels = tides.series.map((point) => point.height)
  const minimum = Math.min(...levels)
  const maximum = Math.max(...levels)
  const range = Math.max(maximum - minimum, 0.1)
  const startTime = new Date(tides.series[0].time).getTime()
  const endTime = new Date(tides.series.at(-1).time).getTime()
  const xForTime = (time) => paddingX + ((new Date(time).getTime() - startTime) / Math.max(endTime - startTime, 1)) * (width - paddingX * 2)
  const yForHeight = (level) => paddingY + ((maximum - level) / range) * (height - paddingY * 2)
  const points = tides.series.map((point) => [xForTime(point.time), yForHeight(point.height)])
  const linePath = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${points.at(-1)[0]} ${height} L${points[0][0]} ${height} Z`

  return (
    <div className="tide-curve" aria-hidden="true">
      <span className="tide-scale high">{t('tide.high')}</span>
      <span className="tide-scale low">{t('tide.low')}</span>
      <svg viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="tide-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4aa6c8" stopOpacity=".3" />
            <stop offset="1" stopColor="#4aa6c8" stopOpacity=".02" />
          </linearGradient>
        </defs>
        <path className="tide-area" d={areaPath} />
        <path className="tide-path" d={linePath} />
        {tides.events.map((event) => {
          const x = xForTime(event.time)
          const y = yForHeight(event.height)
          if (x < paddingX || x > width - paddingX) return null
          return <g key={`${event.type}-${event.time}`}><line className="tide-guide" x1={x} x2={x} y1={y} y2={height} /><circle className={`tide-dot ${event.type}`} cx={x} cy={y} r="5" /></g>
        })}
        <circle className="tide-now-dot" cx={points[0][0]} cy={points[0][1]} r="6" />
      </svg>
    </div>
  )
}

function TidePanel({ tides, current, locale, t }) {
  const trend = tides.trend === 'rising'
    ? { label: t('tide.towardHigh'), detail: t('tide.rising'), icon: ArrowUp }
    : tides.trend === 'falling'
      ? { label: t('tide.towardLow'), detail: t('tide.falling'), icon: ArrowDown }
      : { label: t('tide.nearTurn'), detail: t('tide.slack'), icon: Waves }
  const TrendIcon = trend.icon
  const renderEvent = (event) => {
    const isHigh = event.type === 'high'
    const EventIcon = isHigh ? ArrowUp : ArrowDown
    return (
      <article className={`tide-event ${event.type}`} key={`${event.type}-${event.time}`}>
        <span className={`tide-event-icon ${event.type}`}><EventIcon size={14} /></span>
        <div>
          <span>{tideDayLabel(event.time, current.time, locale, t)} · {isHigh ? t('tide.high') : t('tide.low')}</span>
          <strong>{formatTime(event.time, locale)}</strong>
        </div>
        <small>{formatNumber(event.height, locale, 2)} m</small>
      </article>
    )
  }

  return (
    <section className="panel tide-panel" aria-labelledby="tide-title">
      <div className="section-heading">
        <div><span className="eyebrow">{t('tide.eyebrow')}</span><h2 id="tide-title">{t('tide.title')}</h2></div>
        <span className={`tide-trend ${tides.trend}`}><TrendIcon size={15} />{trend.label}</span>
      </div>
      <div className="tide-primary-events" aria-label={t('tide.eventsAria')}>
        {tides.events.slice(0, 2).map(renderEvent)}
      </div>
      <TideCurve tides={tides} t={t} />
      <div className="tide-current-compact">
        <Droplets size={15} />
        <span>{trend.detail}</span>
        <strong>{formatNumber(current.seaLevel, locale, 2)} m MSL</strong>
      </div>
      {tides.events.length > 2 && <details className="tide-more">
        <summary>{t('tide.moreTimes')} <ChevronDown size={16} /></summary>
        <div className="tide-more-events">{tides.events.slice(2).map(renderEvent)}</div>
      </details>}
      <div className="panel-note"><Info size={15} /> {t('tide.note')}</div>
    </section>
  )
}

function WebcamPanel({ location, locale, t }) {
  const webcam = getWebcamForLocation(location)
  const [activeCamera, setActiveCamera] = useState(webcam?.streams?.[0]?.id ?? null)
  const [isLoaded, setIsLoaded] = useState(false)
  const camera = webcam?.streams?.find((stream) => stream.id === activeCamera)

  const distance = webcam?.distance > 1
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(webcam.distance)
    : null

  return (
    <section className="panel webcam-panel" aria-labelledby="webcam-title">
      <div className="section-heading webcam-heading">
        <div><span className="eyebrow">{t('webcam.eyebrow')}</span><h2 id="webcam-title">{t('webcam.title', { location: location.name })}</h2></div>
        {webcam && <span className="camera-live"><i />{t('webcam.verified')}</span>}
      </div>
      {webcam?.streams && <div className="camera-tabs" role="group" aria-label={t('webcam.selector')}>
        {webcam.streams.map((item) => (
          <button
            className={activeCamera === item.id ? 'is-active' : ''}
            type="button"
            aria-pressed={activeCamera === item.id}
            onClick={() => { setActiveCamera(item.id); setIsLoaded(false) }}
            key={item.id}
          >
            <Camera size={14} />{t(item.labelKey)}
          </button>
        ))}
      </div>}
      <div className="camera-stage">
        {camera && isLoaded ? (
          <iframe
            key={activeCamera}
            src={camera.embedUrl}
            title={`${webcam.name} – ${t(camera.labelKey)}`}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : camera ? (
          <button className="camera-consent" type="button" onClick={() => setIsLoaded(true)}>
            <span><Play size={22} fill="currentColor" /></span>
            <strong>{t('webcam.load')}</strong>
            <small>{t('webcam.consent')}</small>
          </button>
        ) : webcam ? (
          <a className="camera-external" href={webcam.pageUrl} target="_blank" rel="noreferrer">
            <span><Camera size={23} /></span>
            <strong>{t('webcam.open')}</strong>
            <small>{t('webcam.external')}</small>
            <em>{t('webcam.openAction')} <ArrowUpRight size={14} /></em>
          </a>
        ) : (
          <div className="camera-empty">
            <span><Camera size={23} /></span>
            <strong>{t('webcam.unavailableTitle')}</strong>
            <small>{t('webcam.unavailable')}</small>
          </div>
        )}
      </div>
      <div className="camera-source">
        <span>{t('webcam.note')}</span>
        {webcam && <a href={webcam.pageUrl} target="_blank" rel="noreferrer">
          {distance
            ? t('webcam.nearbySource', { name: webcam.name, distance })
            : t('webcam.source', { name: webcam.sourceName })} <ArrowUpRight size={14} />
        </a>}
      </div>
    </section>
  )
}

function SafetyChecklist({ current, location, t }) {
  const offshore = isOffshoreWind(current.windDirection, location.seaBearing)
  const windCheck = offshore === null
    ? { text: t('checklist.windUnknown'), status: 'on-site', label: t('checklist.onSite') }
    : offshore
      ? { text: t('checklist.windOffshore'), status: 'bad', label: t('checklist.offshore') }
      : { text: t('checklist.windSafe'), status: 'good', label: t('checklist.okay') }
  const checks = [
    { icon: Flag, title: t('checklist.flagTitle'), text: t('checklist.flagText'), status: 'on-site', label: t('checklist.onSite') },
    { icon: Wind, title: t('checklist.windTitle'), ...windCheck },
    { icon: Waves, title: t('checklist.beachTitle'), text: t('checklist.beachText'), status: current.waveHeight >= 0.8 ? 'bad' : 'good', label: current.waveHeight >= 0.8 ? t('checklist.elevated') : t('checklist.moderate') },
  ]

  return (
    <section className="panel checklist-panel" aria-labelledby="checklist-title">
      <div className="section-heading compact">
        <div><span className="eyebrow">{t('checklist.eyebrow')}</span><h2 id="checklist-title">{t('checklist.title')}</h2></div>
      </div>
      <div className="check-list">
        {checks.map((item) => {
          const ItemIcon = item.icon
          return (
            <div className="check-item" key={item.title}>
              <span className="check-icon"><ItemIcon size={20} /></span>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
              <span className={`check-status ${item.status}`}>{item.status === 'good' && <Check size={13} />}{item.label}</span>
            </div>
          )
        })}
      </div>
      <a className="lifeguard-link" href={location.rnliUrl ?? 'https://rnli.org/find-my-nearest/lifeguarded-beaches'} target="_blank" rel="noreferrer">
        {t('checklist.lifeguard')} <ArrowUpRight size={16} />
      </a>
    </section>
  )
}

function DataNotice({ error, t }) {
  if (!error) return null
  return (
    <div className="data-notice" role="status">
      <Info size={16} /> {t('notice.unavailable')}
    </div>
  )
}

export default function App() {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem('safe-to-swim-language')
    return LANGUAGES.some((item) => item.code === savedLanguage) ? savedLanguage : DEFAULT_LANGUAGE
  })
  const [locationId, setLocationId] = useState(() => window.localStorage.getItem('safe-to-swim-location') ?? 'brighton')
  const [geolocationStatus, setGeolocationStatus] = useState('idle')
  const [locatedName, setLocatedName] = useState('')
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [installGuideOpen, setInstallGuideOpen] = useState(false)
  const { installed, installReady, isIOS, requestInstall } = usePWAInstall()
  const location = findCoastalLocation(locationId)
  const { data, loading, error, refresh } = useCoastalConditions(location)
  const locale = localeFor(language)
  const t = useMemo(() => makeTranslator(language), [language])
  const safety = getSafety(data.current, location, t, locale)
  const waterQuality = getWaterQualityForLocation(location)
  const locating = geolocationStatus === 'locating'
  const locationFeedback = geolocationStatus === 'found'
    ? t('header.locationFound', { location: locatedName })
    : geolocationStatus === 'denied'
      ? t('header.locationDenied')
      : geolocationStatus === 'error'
        ? t('header.locationError')
        : ''

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeolocationStatus('error')
      return
    }

    setGeolocationStatus('locating')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearestLocation = findNearestCoastalLocation(coords.latitude, coords.longitude)
        setLocationId(nearestLocation.id)
        setLocatedName(nearestLocation.name)
        setGeolocationStatus('found')
      },
      (geolocationError) => {
        setGeolocationStatus(geolocationError.code === geolocationError.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  const installApp = async () => {
    if (installReady) {
      await requestInstall()
      return
    }
    setInstallGuideOpen(true)
  }

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem('safe-to-swim-language', language)
  }, [language])

  useEffect(() => {
    window.localStorage.setItem('safe-to-swim-location', location.id)
    document.title = `Safe to Swim — ${location.name}`
  }, [location])

  return (
    <div className="app-shell" id="top">
      <Header
        location={location}
        onOpenLocationPicker={() => setLocationPickerOpen(true)}
        onUseCurrentLocation={useCurrentLocation}
        onOpenSupport={() => setSupportOpen(true)}
        onInstall={installApp}
        showInstall={!installed}
        locating={locating}
        locationFeedback={locationFeedback}
        onRefresh={refresh}
        loading={loading}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />
      {locationPickerOpen && (
        <LocationPickerScreen
          location={location}
          onClose={() => setLocationPickerOpen(false)}
          onSelect={setLocationId}
          onUseCurrentLocation={useCurrentLocation}
          locating={locating}
          locationFeedback={locationFeedback}
          t={t}
        />
      )}
      {supportOpen && <SupportPrompt onClose={() => setSupportOpen(false)} t={t} />}
      {installGuideOpen && <InstallGuide isIOS={isIOS} onClose={() => setInstallGuideOpen(false)} t={t} />}
      <main>
        <DataNotice error={error} t={t} />
        <SwimDecision key={`${location.id}-${data.current.time}`} current={data.current} forecast={data.forecast} location={location} source={data.source} loading={loading} language={language} locale={locale} quality={waterQuality} t={t} />
        <Suspense fallback={null}><WaterQualityPanel location={location} locale={locale} t={t} /></Suspense>
        <div className="live-grid">
          <TidePanel tides={data.tides} current={data.current} locale={locale} t={t} />
          <WebcamPanel key={location.id} location={location} locale={locale} t={t} />
        </div>
        <DetailedConditions data={data} location={location} language={language} locale={locale} t={t} safety={safety} onLocationChange={setLocationId} />
        <section className="disclaimer">
          <div><Info size={18} /><p><strong>{t('disclaimer.important')}</strong> {t('disclaimer.text')}</p></div>
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">{t('disclaimer.data')} <ArrowUpRight size={14} /></a>
        </section>
      </main>
      <footer>
        <span>safe<span>to</span>swim</span>
        <p>{t('footer.tagline')}</p>
        <a href="#top">{t('footer.back')} <ArrowUpRight size={14} /></a>
      </footer>
    </div>
  )
}
