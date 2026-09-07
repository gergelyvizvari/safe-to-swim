import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
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
  Thermometer,
  Waves,
  Wind,
} from 'lucide-react'
import { useCoastalConditions } from './useCoastalConditions.js'
import { compassFor, DEFAULT_LANGUAGE, LANGUAGES, localeFor, makeTranslator } from './i18n.js'
import { findCoastalLocation, findNearestCoastalLocation } from './coastalLocations.js'
import { LocationPickerScreen } from './LocationPickerScreen.jsx'
import { InstallGuide } from './InstallGuide.jsx'
import { SupportPrompt } from './SupportPrompt.jsx'
import { usePWAInstall } from './usePWAInstall.js'
import { getWebcamForLocation } from './webcamSources.js'
import { classificationTone, getWaterQualityForLocation } from './waterQuality.js'
import { compareConditions, formatNumber, formatWholeNumber, getSafety, getSafetyReadings } from './safety.js'
import TideCurve from './TideCurve.jsx'
import SwimAssessment from './SwimAssessment.jsx'
import { findCalmestWindow } from './swimOutlook.js'

const WaterQualityPanel = lazy(() => import('./WaterQualityPanel.jsx'))
const UKCoastExplorer = lazy(() => import('./UKCoastExplorer.jsx').then((module) => ({ default: module.UKCoastExplorer })))
const CoastSafetyMap = lazy(() => import('./CoastSafetyMap.jsx').then((module) => ({ default: module.CoastSafetyMap })))

function directionLabel(degrees, language) {
  if (!Number.isFinite(degrees)) return '—'
  return compassFor(language)[Math.round(degrees / 45) % 8]
}

function weatherLabel(code, t) {
  if (!Number.isFinite(code)) return t('conditions.unavailable')
  if (code === 0) return t('weather.clear')
  if (code <= 3) return t('weather.partlyCloudy')
  if (code <= 48) return t('weather.fog')
  if (code <= 67) return t('weather.rain')
  if (code <= 77) return t('weather.drizzle')
  if (code <= 82) return t('weather.showers')
  return t('weather.storm')
}

function formatTime(dateString, locale, options = {}) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit', ...options,
  }).format(new Date(dateString))
}

function formatDate(dateString, locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long', month: 'long', day: 'numeric',
  }).format(new Date(dateString))
}

function tideDayLabel(dateString, currentTime, locale, t) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const eventDate = formatter.format(new Date(dateString))
  const today = formatter.format(new Date(currentTime))
  const tomorrow = formatter.format(new Date(new Date(currentTime).getTime() + 86400000))
  if (eventDate === today) return t('tide.today')
  if (eventDate === tomorrow) return t('tide.tomorrow')
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(dateString))
}

function tideCountdown(dateString, currentTime, t) {
  const totalMinutes = Math.max(0, Math.ceil((new Date(dateString).getTime() - new Date(currentTime).getTime()) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours && minutes) return t('tide.durationHoursMinutes', { hours, minutes })
  if (hours) return t('tide.durationHours', { hours })
  return t('tide.durationMinutes', { minutes })
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
        <button className="icon-button refresh-button" type="button" onClick={onRefresh} disabled={loading} aria-label={t('header.refresh')} title={t('header.refresh')}>
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
        </button>
      </div>
    </header>
  )
}

function SafetyHero({ inland, safety, current, source, loading, language, locale, isNow, quality, t }) {
  const StatusIcon = safety.icon
  const qualityTone = quality ? classificationTone(quality.site.classification) : 'unclassified'
  const windDirection = directionLabel(current.windDirection, language)
  return (
    <section className={`safety-hero ${safety.level}`} aria-labelledby="safety-title">
      <div className="hero-content">
        <div className="status-pill"><StatusIcon size={16} />{safety.eyebrow}</div>
        <h1 id="safety-title">{safety.title}</h1>
        <p>{safety.description}</p>
        {current.isDay === false && <div className="hero-night-warning" role="note"><AlertTriangle size={16} aria-hidden="true" /><span><strong>{t('timeline.nightLabel')}</strong> · {t('timeline.nightTitle')}</span></div>}
        <div className="hero-meta">
          <span>{formatDate(current.time, locale)}</span>
          <span aria-hidden="true">•</span>
          <span>{isNow ? t('outlook.model', { time: formatTime(current.time, locale) }) : t('decision.selectedAt', { time: formatTime(current.time, locale) })}</span>
          <span className="live-dot"><i />{loading ? t('safety.updating') : source === 'stale' ? t('outlook.staleLabel') : source === 'live' ? t('safety.liveData') : source === 'partial' ? t('safety.partialData') : t('safety.unavailableData')}</span>
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
          <span>{t(inland ? 'lake.air' : 'conditions.waterTemperature')}</span>
          <strong>{formatNumber(inland ? current.temperature : current.seaTemperature, locale)} <small>°C</small></strong>
        </article>
        <article className={`hero-sea-fact hero-water-quality ${qualityTone}`}>
          <span>{t('waterQuality.annualShort')}</span>
          <strong>{t(`waterQuality.classes.${qualityTone}`)}</strong>
        </article>
        <article className="hero-sea-fact hero-reading">
          <span>{t(inland ? 'conditions.wind' : 'safety.wave')}</span>
          <strong>{formatNumber(inland ? current.windSpeed : current.waveHeight, locale)} <small>{inland ? 'mph' : 'm'}</small></strong>
        </article>
        <article className="hero-sea-fact hero-wind-fact">
          <span>{t('safety.gusts')}</span>
          <div className="hero-wind-reading">
            <span className="hero-wind-compass" aria-hidden="true">
              <span className="hero-compass-north">N</span>
              {Number.isFinite(current.windDirection) && <span className="hero-wind-needle" style={{ transform: `rotate(${current.windDirection}deg)` }} />}
            </span>
            <strong>{formatWholeNumber(current.gusts)} <small>mph</small></strong>
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

function ConditionsGrid({ current, forecast, language, locale, isNow, t }) {
  const windDirection = directionLabel(current.windDirection, language)
  const nextPoint = forecast.find((point) => new Date(point.time).getTime() > new Date(current.time).getTime())
  const seaLevelChange = Number.isFinite(current.seaLevel) && Number.isFinite(nextPoint?.seaLevel)
    ? nextPoint.seaLevel - current.seaLevel
    : null
  const seaLevelDetail = seaLevelChange === null
    ? t('conditions.unavailable')
    : Math.abs(seaLevelChange) < 0.015
      ? t('conditions.slack')
      : seaLevelChange > 0 ? t('conditions.rising') : t('conditions.falling')
  const roundedWaveHeight = Number.isFinite(current.waveHeight) ? Math.round(current.waveHeight * 10) / 10 : null
  const roundedGusts = Number.isFinite(current.gusts) ? Math.round(current.gusts) : null
  return (
    <section className="metrics-grid" aria-label={t(isNow ? 'conditions.aria' : 'conditions.selectedAria', { time: formatTime(current.time, locale) })}>
      <MetricCard
        icon={Waves} label={t('conditions.waveHeight')} value={formatNumber(current.waveHeight, locale)} unit="m"
        detail={t('conditions.period', { value: formatNumber(current.wavePeriod, locale) })} tone={roundedWaveHeight >= 1 ? 'metric-warn' : ''}
      >
        <div className="mini-waves" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </MetricCard>
      <MetricCard
        icon={Wind} label={t('conditions.wind')} value={formatWholeNumber(current.windSpeed)} unit="mph"
        detail={t('conditions.gusts', { value: formatWholeNumber(current.gusts) })} tone={roundedGusts >= 28 ? 'metric-warn' : ''}
      >
        <div className="direction"><Compass size={15} style={Number.isFinite(current.windDirection) ? { transform: `rotate(${current.windDirection}deg)` } : undefined} />{t('conditions.from', { direction: windDirection })}</div>
      </MetricCard>
      <MetricCard
        icon={Droplets} label={t('conditions.seaLevel')} value={formatNumber(current.seaLevel, locale)} unit="m MSL"
        detail={seaLevelDetail}
      >
        <div className="tide-line" aria-hidden="true"><span /></div>
      </MetricCard>
      <MetricCard
        icon={Thermometer} label={t('conditions.waterTemperature')} value={formatNumber(current.seaTemperature, locale)} unit="°C"
        detail={`${t('conditions.air', { value: formatWholeNumber(current.temperature) })} · ${weatherLabel(current.weatherCode, t)}`}
      >
        {Number.isFinite(current.seaTemperature) && <div className="temperature-note"><Info size={14} /> {t('conditions.wetsuit')}</div>}
      </MetricCard>
    </section>
  )
}

function localDateKey(dateString) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(dateString))
}

function localHour(dateString) {
  return Number(new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', hourCycle: 'h23',
  }).format(new Date(dateString)))
}

function buildForecastDays(current, forecast, recommendedTime, selectedTime) {
  const currentTime = new Date(current.time).getTime()
  const uniqueHours = new Map()
  ;[current, ...forecast]
    .filter((hour) => new Date(hour.time).getTime() >= currentTime)
    .forEach((hour) => uniqueHours.set(hour.time, hour))

  const grouped = new Map()
  ;[...uniqueHours.values()].forEach((hour) => {
    const key = localDateKey(hour.time)
    const day = grouped.get(key) ?? []
    day.push(hour)
    grouped.set(key, day)
  })

  return [...grouped.entries()].map(([key, dayHours], dayIndex) => {
    const daytimeHours = dayHours.filter((hour) => {
      const hourOfDay = localHour(hour.time)
      return hourOfDay >= 6 && hourOfDay <= 20 && hourOfDay % 2 === 0
    })
    const visible = dayIndex === 0 ? dayHours.slice(0, 8) : (daytimeHours.length ? daytimeHours : dayHours.filter((_, index) => index % 2 === 0)).slice(0, 8)
    for (const time of [recommendedTime, selectedTime]) {
      const extra = dayHours.find((hour) => hour.time === time)
      if (extra && !visible.includes(extra)) visible.push(extra)
    }
    return { key, hours: visible.sort((a, b) => Date.parse(a.time) - Date.parse(b.time)) }
  })
}

function forecastDayLabel(day, dayIndex, locale, t) {
  if (dayIndex === 0) return t('forecast.today')
  if (dayIndex === 1) return t('forecast.tomorrow')
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(new Date(day.hours[0].time))
}

function SwimDecision({ current, forecast, location, source, loading, language, locale, quality, onSelectedChange, t }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])
  const inland = location.marineModelSupported === false
  const bestWindow = findCalmestWindow(forecast, location, { now, source, quality })
  const [selectedTime, setSelectedTime] = useState(current.time)
  const forecastDays = buildForecastDays(current, forecast, bestWindow?.start.time, selectedTime)
  const selectedDayIndex = Math.max(0, forecastDays.findIndex((day) => day.key === localDateKey(selectedTime)))
  const selectedDay = forecastDays[selectedDayIndex] ?? forecastDays[0]
  const hours = selectedDay.hours
  const selectedIndex = Math.max(0, hours.findIndex((hour) => hour.time === selectedTime))
  const selected = hours[selectedIndex]
  const isNow = selected.time === current.time
  const safety = getSafety(selected, location, t, locale, { source, quality })
  const currentSafety = getSafety(current, location, t, locale, { source, quality })
  const selectedOffshore = getSafetyReadings(selected, location).offshore
  const windStatus = selectedOffshore === null ? 'unknown' : selectedOffshore ? 'offshore' : 'safe'
  const SelectedIcon = safety.icon
  const rank = { good: 0, caution: 1, danger: 2 }
  const change = safety.level === 'unknown' || currentSafety.level === 'unknown'
    ? 'unknown'
    : isNow
    ? 'now'
    : rank[safety.level] < rank[currentSafety.level]
      ? 'better'
      : rank[safety.level] > rank[currentSafety.level]
        ? 'worse'
        : compareConditions(selected, current, location)

  useEffect(() => {
    onSelectedChange(selected)
  }, [onSelectedChange, selected])

  return (
    <>
      <SafetyHero inland={inland} safety={safety} current={selected} source={source} loading={loading} language={language} locale={locale} isNow={isNow} quality={quality} t={t} />
      <SwimAssessment current={selected} location={location} quality={quality} source={source} locale={locale} t={t} />
      <section className="panel decision-panel" aria-labelledby="decision-title">
        <div className="section-heading decision-heading">
          <div>
            <span className="eyebrow">{t(inland ? 'lake.label' : 'decision.eyebrow')}</span>
            <h2 id="decision-title">{t(inland ? 'lake.forecast' : 'decision.title')}</h2>
          </div>
          <span className="decision-hint">{t('decision.hint')}</span>
        </div>
        {!inland && <div className="outlook-window" aria-live="polite">
          <div>
            <span className="eyebrow">{t('outlook.title')}</span>
            {loading ? <p>{t('outlook.loading')}</p> : bestWindow ? <>
              <h3>{formatDate(bestWindow.start.time, locale)} · {formatTime(bestWindow.start.time, locale)}–{formatTime(bestWindow.end.time, locale)}</h3>
              <p>{t('outlook.reason', { wave: formatNumber(bestWindow.wave, locale), gusts: Math.ceil(bestWindow.gusts) })}</p>
            </> : <p>{t(source === 'stale' ? 'outlook.staleText' : 'outlook.empty')}</p>}
            <small>{t('outlook.scope')}</small>
          </div>
          {!loading && bestWindow && <button type="button" onClick={() => {
            setSelectedTime(bestWindow.start.time)
          }}>{t('outlook.view')} <ArrowUpRight size={16} /></button>}
        </div>}
        <div className="decision-days" role="group" aria-label={t('decision.daysAria')}>
          {forecastDays.map((day, dayIndex) => (
            <button
              className={selectedDayIndex === dayIndex ? 'is-selected' : ''}
              type="button"
              aria-pressed={selectedDayIndex === dayIndex}
              onClick={() => {
                setSelectedTime(day.hours[0].time)
              }}
              key={day.key}
            >
              {forecastDayLabel(day, dayIndex, locale, t)}
            </button>
          ))}
        </div>
        <div className="decision-times" role="group" aria-label={t('decision.aria')}>
          {hours.map((hour, index) => {
            const hourSafety = getSafety(hour, location, t, locale, { source, quality })
            return (
              <button
                className={`decision-time ${hourSafety.level} ${selectedIndex === index ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedTime(hour.time)}
                key={`${hour.time}-${index}`}
              >
                <span>{hour.time === current.time ? t('forecast.now') : formatTime(hour.time, locale)}</span>
                <strong>{inland ? `${formatNumber(hour.temperature, locale)} °C` : <><i />{t(`decision.levels.${hourSafety.level}`)}</>}</strong>
              </button>
            )
          })}
        </div>
        <div className={`decision-summary ${safety.level}`} role="status" aria-live="polite">
          <span className="decision-summary-icon"><SelectedIcon size={19} /></span>
          <div>
            <strong>{t(`decision.change.${change}`)}</strong>
            <span>{t('decision.reasonDetails', {
              time: isNow ? t('forecast.now') : formatTime(selected.time, locale),
              reason: safety.reason,
            })}</span>
          </div>
          <div className="decision-readings" aria-hidden="true">
            {!inland && <span><Waves size={15} />{formatNumber(selected.waveHeight, locale)} m</span>}
            <span><Wind size={15} />{formatWholeNumber(selected.gusts)} mph</span>
            {!inland && <span><Compass size={15} />{t(`decision.wind.${windStatus}`)}</span>}
          </div>
        </div>
        {!inland && <div className="forecast-footnote"><Info size={15} /> {t('forecast.note')}</div>}
      </section>
    </>
  )
}

function DetailedConditions({ data, selected, location, language, locale, t, safety, onLocationChange }) {
  const inland = location.marineModelSupported === false
  const [hasOpened, setHasOpened] = useState(false)
  const isNow = selected.time === data.current.time
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
        {!inland && <ConditionsGrid current={selected} forecast={data.forecast} language={language} locale={locale} isNow={isNow} t={t} />}
        {!inland && <SafetyChecklist current={selected} location={location} t={t} />}
        <Suspense fallback={null}><UKCoastExplorer selectedLocation={location} onSelect={onLocationChange} t={t} /></Suspense>
        {!inland && <Suspense fallback={null}><CoastSafetyMap safety={safety} current={selected} modelPoint={data.marineModelPoint} location={location} t={t} /></Suspense>}
      </div>}
    </details>
  )
}

function TidePanel({ tides, current, locale, t }) {
  const [selectedTime, setSelectedTime] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const updateClock = () => setNow(Date.now())
    const interval = window.setInterval(updateClock, 60000)
    return () => window.clearInterval(interval)
  }, [])

  const trend = tides.trend === 'rising'
    ? { label: t('tide.towardHigh'), detail: t('tide.rising'), icon: ArrowUp }
    : tides.trend === 'falling'
      ? { label: t('tide.towardLow'), detail: t('tide.falling'), icon: ArrowDown }
      : tides.trend === 'slack'
        ? { label: t('tide.nearTurn'), detail: t('tide.slack'), icon: Waves }
        : { label: t('tide.unavailable'), detail: t('tide.unavailable'), icon: Info }
  const TrendIcon = trend.icon
  const upcomingEvents = tides.events.filter((event) => new Date(event.time).getTime() > now)
  const nextEvent = upcomingEvents[0]
  const NextEventIcon = nextEvent?.type === 'high' ? ArrowUp : ArrowDown
  const renderEvent = (event) => {
    const isHigh = event.type === 'high'
    const EventIcon = isHigh ? ArrowUp : ArrowDown
    return (
      <button type="button" className={`tide-event ${event.type}`} key={`${event.type}-${event.time}`}
        aria-pressed={selectedTime === event.time} onClick={() => setSelectedTime(event.time)}
        disabled={!tides.series.some((point) => point.time === event.time)}>
        <span className={`tide-event-icon ${event.type}`}><EventIcon size={14} /></span>
        <div>
          <span>{tideDayLabel(event.time, now, locale, t)} · {isHigh ? t('tide.high') : t('tide.low')}</span>
          <strong>≈ {formatTime(event.time, locale)}</strong>
        </div>
        <small>{formatNumber(event.height, locale, 2)} m</small>
      </button>
    )
  }

  return (
    <section className="panel tide-panel" aria-labelledby="tide-title">
      <div className="section-heading">
        <div><span className="eyebrow">{t('tide.eyebrow')}</span><h2 id="tide-title">{t('tide.title')}</h2></div>
        <span className={`tide-trend ${tides.trend}`}><TrendIcon size={15} />{trend.label}</span>
      </div>
      {nextEvent && (
        <button type="button" className={`tide-next-turn ${nextEvent.type}`}
          aria-pressed={selectedTime === nextEvent.time}
          disabled={!tides.series.some((point) => point.time === nextEvent.time)}
          onClick={() => setSelectedTime(nextEvent.time)}>
          <span className="tide-next-turn-icon"><NextEventIcon size={18} /></span>
          <div>
            <span>{trend.detail}</span>
            <strong>≈ {t('tide.nextTurnSummary', {
              event: t(nextEvent.type === 'high' ? 'tide.high' : 'tide.low'),
              duration: tideCountdown(nextEvent.time, now, t),
            })}</strong>
            <small>{tideDayLabel(nextEvent.time, now, locale, t)} · {formatTime(nextEvent.time, locale)}</small>
          </div>
        </button>
      )}
      <div className="tide-primary-events" aria-label={t('tide.eventsAria')}>
        {upcomingEvents.slice(0, 2).map(renderEvent)}
      </div>
      <TideCurve tides={tides} selectedTime={selectedTime} onSelect={setSelectedTime} locale={locale} t={t} />
      <div className="tide-current-compact">
        <Droplets size={15} />
        <span>{t('tide.interactive.current')} · {formatTime(current.time, locale)}</span>
        <strong>{formatNumber(current.seaLevel, locale, 2)} m MSL</strong>
      </div>
      {upcomingEvents.length > 2 && <details className="tide-more">
        <summary>{t('tide.moreTimes')} <ChevronDown size={16} /></summary>
        <div className="tide-more-events">{upcomingEvents.slice(2).map(renderEvent)}</div>
      </details>}
      {tides.trend !== 'unknown' && <div className="panel-note"><Info size={15} /> {t('tide.note')}</div>}
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
        <div><span className="eyebrow">{t('webcam.eyebrow')}</span><h2 id="webcam-title">{t('webcam.title', { location: webcam?.name ?? location.name })}</h2></div>
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
  const offshore = getSafetyReadings(current, location).offshore
  const windCheck = offshore === null
    ? { text: t('checklist.windUnknown'), status: 'on-site', label: t('checklist.onSite') }
    : offshore
      ? { text: t('checklist.windOffshore'), status: 'bad', label: t('checklist.offshore') }
      : { text: t('checklist.windSafe'), status: 'good', label: t('checklist.okay') }
  const waveCheck = !Number.isFinite(current.waveHeight)
    ? { status: 'on-site', label: t('checklist.unavailable') }
    : current.waveHeight >= 0.8
      ? { status: 'bad', label: t('checklist.elevated') }
      : { status: 'good', label: t('checklist.moderate') }
  const checks = [
    { icon: Flag, title: t('checklist.flagTitle'), text: t('checklist.flagText'), status: 'on-site', label: t('checklist.onSite') },
    { icon: Wind, title: t('checklist.windTitle'), ...windCheck },
    { icon: Waves, title: t('checklist.beachTitle'), text: t('checklist.beachText'), ...waveCheck },
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

function DataNotice({ error, source, t }) {
  if (!error && source !== 'stale') return null
  return (
    <div className="data-notice" role="status">
      <Info size={16} /> {t(source === 'stale' ? 'outlook.staleText' : source === 'partial' ? 'outlook.partial' : 'notice.unavailable')}
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
  const [userPosition, setUserPosition] = useState(null)
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [installGuideOpen, setInstallGuideOpen] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const { installed, installReady, isIOS, requestInstall } = usePWAInstall()
  const location = findCoastalLocation(locationId)
  const { data, loading, error, refresh } = useCoastalConditions(location)
  const locale = localeFor(language)
  const t = useMemo(() => makeTranslator(language), [language])
  const selectionKey = `${location.id}-${data.current.time}`
  const selectedConditions = selectedSnapshot?.key === selectionKey ? selectedSnapshot.conditions : data.current
  const safety = getSafety(selectedConditions, location, t, locale, { source: data.source })
  const waterQuality = getWaterQualityForLocation(location)
  const handleSelectedChange = useCallback((conditions) => {
    setSelectedSnapshot({ key: selectionKey, conditions })
  }, [selectionKey])
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
        setUserPosition({ latitude: coords.latitude, longitude: coords.longitude })
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
          userPosition={userPosition}
          onClose={() => setLocationPickerOpen(false)}
          onSelect={setLocationId}
          onUseCurrentLocation={useCurrentLocation}
          locating={locating}
          locationFeedback={locationFeedback}
          locale={locale}
          t={t}
        />
      )}
      {supportOpen && <SupportPrompt onClose={() => setSupportOpen(false)} t={t} />}
      {installGuideOpen && <InstallGuide isIOS={isIOS} onClose={() => setInstallGuideOpen(false)} t={t} />}
      <main>
        <DataNotice error={error} source={data.source} t={t} />
        <p className="panel-note">{t('locationPicker.timeZone', { zone: Intl.DateTimeFormat().resolvedOptions().timeZone })}</p>
        <SwimDecision key={selectionKey} current={data.current} forecast={data.forecast} location={location} source={data.source} loading={loading} language={language} locale={locale} quality={waterQuality} onSelectedChange={handleSelectedChange} t={t} />
        <Suspense fallback={null}><WaterQualityPanel location={location} locale={locale} t={t} /></Suspense>
        <div className="live-grid">
          {location.marineModelSupported !== false && <TidePanel key={location.id} tides={data.tides} current={data.current} locale={locale} t={t} />}
          <WebcamPanel key={location.id} location={location} locale={locale} t={t} />
        </div>
        <DetailedConditions data={data} selected={selectedConditions} location={location} language={language} locale={locale} t={t} safety={safety} onLocationChange={setLocationId} />
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
