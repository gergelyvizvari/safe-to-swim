import { useEffect, useId, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Moon, Sun, Thermometer, Waves, Wind } from 'lucide-react'
import { buildConditionsTimeline, conditionsWindow, metricSegments } from './conditionsTimeline.js'
import { conditionLabels } from './conditionLabels.js'
import { getSafety } from './safety.js'
import { smoothTidePath } from './tideCurvePath.js'

const dayFormatter = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })
const dayKey = (time) => dayFormatter.format(new Date(time))
const metrics = [
  { key: 'temperature', label: 'air', unit: '°C', color: '#a56732', top: 68, bottom: 124 },
  { key: 'windSpeed', label: 'wind', unit: 'mph', color: '#486778', top: 80, bottom: 114 },
  { key: 'gusts', label: 'gusts', unit: 'mph', color: '#486778', top: 80, bottom: 114, dashed: true },
  { key: 'seaLevel', label: 'tide', unit: 'm MSL', color: '#c5f0f1', top: 150, bottom: 260 },
  { key: 'seaTemperature', label: 'water', unit: '°C', color: '#85bfcf', top: 370, bottom: 416 },
]

const plottedMetrics = metrics.filter(({ key }) => key === 'windSpeed' || key === 'seaLevel')

export default function ConditionsTimeline({ location, quality, current, forecast, selectedTime, onSelect, locale, source, loading, t }) {
  const id = useId()
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [viewport, setViewport] = useState(700)
  const scrollRef = useRef(null)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setViewport(Math.max(1, entry.contentRect.width)))
    observer.observe(scrollRef.current)
    return () => observer.disconnect()
  }, [])
  const timeline = buildConditionsTimeline(current, forecast)
  const index = Math.max(0, timeline.findIndex((point) => point.time === selectedTime))
  const selected = timeline[index]
  const assessment = (point) => getSafety(point, location, t, locale, { source, quality })
  const selectedSafety = assessment(selected)
  const SafetyIcon = selectedSafety.icon
  const labels = conditionLabels(selected, location, timeline)
  const TideIcon = labels.tide === 'rising' ? ArrowUp : labels.tide === 'falling' ? ArrowDown : ArrowRight
  const day = dayKey(selected.time)
  const days = [...new Set(timeline.map((point) => dayKey(point.time)))]
  const { start, end, points: visible, plotPoints } = conditionsWindow(timeline, selected.time)
  const width = Math.max(viewport, 640)
  const height = 320
  const pad = 28
  const x = (time) => pad + (Date.parse(time) - start) / Math.max(end - start, 1) * (width - 2 * pad)
  const selectedX = x(selected.time)
  useEffect(() => {
    const element = scrollRef.current
    if (selectedX < element.scrollLeft + 24 || selectedX > element.scrollLeft + viewport - 24) {
      element.scrollTo({ left: Math.max(0, selectedX - viewport / 2), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    }
  }, [selectedX, viewport, day])
  const bounds = (key) => {
    const keys = key === 'temperature' || key === 'seaTemperature' ? ['temperature', 'seaTemperature'] : key === 'gusts' || key === 'windSpeed' ? ['windSpeed', 'gusts'] : ['seaLevel']
    const values = plotPoints.flatMap((point) => keys.map((field) => point[field])).filter(Number.isFinite)
    const min = keys.includes('windSpeed') ? 0 : values.length ? Math.floor(Math.min(...values)) : 0
    return { min, max: Math.max(min + 1, values.length ? Math.ceil(Math.max(...values)) : 1), available: values.length > 0 }
  }
  const y = (value, metric) => {
    const { min, max } = bounds(metric.key)
    return metric.bottom - (value - min) / (max - min) * (metric.bottom - metric.top)
  }
  const tideMetric = metrics.find((metric) => metric.key === 'seaLevel')
  const waterAreas = metricSegments(plotPoints, 'seaLevel').map((segment) => {
    const first = segment[0]
    const last = segment.at(-1)
    const points = segment.map((point) => ({ x: x(point.time), y: y(point.seaLevel, tideMetric) }))
    // Reuse the exact line geometry; edge fill must not change its tangents.
    const left = Date.parse(first.time) === start ? 0 : points[0].x
    const right = Date.parse(last.time) === end ? width : points.at(-1).x
    const curve = smoothTidePath(points)
    // Continue the endpoint tangents through the visual padding only.
    // These margins add no selectable forecast samples.
    const slope = (a, b) => (b.y - a.y) / (b.x - a.x)
    const leftY = points[0].y + (left - points[0].x) * (points.length > 1 ? slope(points[0], points[1]) : 0)
    const rightY = points.at(-1).y + (right - points.at(-1).x) * (points.length > 1 ? slope(points.at(-2), points.at(-1)) : 0)
    const surface = `M${left},${leftY} ${curve.replace(/^M/, 'L')} L${right},${rightY}`
    return { time: first.time, surface, path: `${surface} L${right},${height} L${left},${height} Z` }
  })
  const number = (value, key) => Number.isFinite(value) ? new Intl.NumberFormat(locale, { maximumFractionDigits: key === 'seaLevel' ? 2 : 1 }).format(value) : '—'
  const time = (value, full = false) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', ...(full ? { weekday: 'short', month: 'short', day: 'numeric' } : {}) }).format(new Date(value))
  const date = (key) => new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(timeline.find((point) => dayKey(point.time) === key).time))
  const step = (offset) => onSelect(timeline[Math.max(0, Math.min(timeline.length - 1, index + offset))].time)
  const choosePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, ((event.clientX - rect.left) / rect.width * width - pad) / (width - 2 * pad)))
    const target = start + fraction * (end - start)
    onSelect(visible.reduce((best, point) => Math.abs(Date.parse(point.time) - target) < Math.abs(Date.parse(best.time) - target) ? point : best).time)
  }
  const skyColor = (point, i) => {
    if (point.isDay == null) return '#c8d7df'
    if (visible[i - 1]?.isDay != null && visible[i - 1].isDay !== point.isDay) return point.isDay ? '#dfd8cb' : '#b9b5c4'
    if (point.isDay && visible[i + 1]?.isDay === false) return '#ebd8c8'
    return point.isDay ? '#eaf4f8' : '#a4b9cb'
  }
  return (
    <section className="panel conditions-timeline unified-timeline" aria-label={t('timeline.eyebrow')}>
      <span className="eyebrow">{t('timeline.eyebrow')} · 12 h</span>
      <div className="timeline-days" role="group" aria-label={t('decision.daysAria')}>
        {days.map((key) => <button type="button" key={key} aria-pressed={day === key} onClick={() => {
          const candidates = timeline.filter((point) => dayKey(point.time) === key)
          onSelect((candidates.find((point) => time(point.time) === time(selected.time)) ?? candidates[0]).time)
        }}>{date(key)}</button>)}
      </div>
      <div className={`scene-readings ${selected.isDay === false ? 'is-night' : 'is-day'}`}>
        <div className="scene-clock"><button type="button" aria-label={t('timeline.previousHour')} disabled={index === 0} onClick={() => step(-1)}><ChevronLeft size={18} /></button><strong aria-live="polite">{selected.isDay === true ? <Sun size={18} /> : selected.isDay === false ? <Moon size={18} /> : null}{time(selected.time, true)}</strong><button type="button" aria-label={t('timeline.nextHour')} disabled={index === timeline.length - 1} onClick={() => step(1)}><ChevronRight size={18} /></button><button type="button" className="timeline-now" onClick={() => onSelect(current.time)} disabled={selected.time === current.time}>{t('forecast.now')}</button></div>
        <div className="scene-icon-values">
          {[{ ...metrics[0], Icon: Thermometer }, { ...metrics[4], Icon: Waves }].map(({ key, label, unit, Icon }) => <div key={key} title={t(`timeline.${label}`)}><Icon size={17} aria-hidden="true" /><span className="sr-only">{t(`timeline.${label}`)}: </span><strong>{number(selected[key], key)}<small> {unit}</small></strong></div>)}
          <div title={`${t('timeline.wind')} · ${t(`conditions.${labels.direction}`)}`}><Wind size={17} aria-hidden="true" /><span className="sr-only">{t('timeline.wind')}: </span><strong>{t(`conditions.${labels.strength}`)}</strong></div>
          <div title={t('timeline.tide')}><TideIcon size={17} aria-hidden="true" /><span className="sr-only">{t('timeline.tide')}: </span><strong>{t(`conditions.${labels.tide}`)}</strong></div>
        </div>
        <div className={`scene-safety ${selectedSafety.level}`} role="status"><SafetyIcon size={15} /><strong>{selectedSafety.title}</strong></div>
        {selected.isDay === false && <div className="scene-night-warning"><Moon size={14} /><span><strong>{t('timeline.nightLabel')}</strong> · {t('timeline.nightText')}</span></div>}
      </div>
      <div className="scene-shell">
      <div className="scene-band-labels" aria-hidden="true">{plottedMetrics.map((metric) => <span key={metric.key} className={metric.key === 'seaTemperature' ? 'water-label' : ''} style={{ top: metric.top - 25 }}>{t(`timeline.${metric.label}`)} · {metric.unit}</span>)}</div>
      <div className="scene-scroll" ref={scrollRef}>
        <div style={{ width }}>
          <div className={`scene-plot${keyboardFocus ? ' keyboard-focus' : ''}`} tabIndex={0} role="slider"
            aria-label={t('timeline.choose')} aria-valuemin={0} aria-valuemax={timeline.length - 1} aria-valuenow={index}
            aria-valuetext={`${time(selected.time, true)}, ${metrics.map(({ key, label, unit }) => `${t(`timeline.${label}`)} ${number(selected[key], key)} ${unit}`).join(', ')}`}
            onFocus={(event) => setKeyboardFocus(event.currentTarget.matches(':focus-visible'))} onBlur={() => setKeyboardFocus(false)}
            onKeyDown={(event) => {
              const next = { ArrowLeft: index - 1, ArrowDown: index - 1, ArrowRight: index + 1, ArrowUp: index + 1, Home: 0, End: timeline.length - 1 }[event.key]
              if (next === undefined) return
              event.preventDefault(); setKeyboardFocus(true); onSelect(timeline[Math.max(0, Math.min(timeline.length - 1, next))].time)
            }}>
            <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true"
              onPointerDown={(event) => { event.currentTarget.parentElement.focus({ preventScroll: true }); setKeyboardFocus(false); event.currentTarget.setPointerCapture(event.pointerId); choosePointer(event) }}
              onPointerMove={(event) => { if (event.buttons === 1) choosePointer(event) }}>
              <defs>
                <linearGradient id={`${id}-sky`}>{visible.map((point, i) => <stop key={point.time} offset={`${(x(point.time) / width) * 100}%`} stopColor={skyColor(point, i)} />)}</linearGradient>
                <linearGradient id={`${id}-water`}>{visible.map((point) => <stop key={point.time} offset={`${(x(point.time) / width) * 100}%`} stopColor={point.isDay === false ? '#173c56' : '#0b516f'} />)}</linearGradient>
                <linearGradient id={`${id}-depth`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#071d36" stopOpacity="0" /><stop offset="1" stopColor="#071d36" stopOpacity=".3" /></linearGradient>
                <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="white" stopOpacity=".14" /><stop offset="1" stopColor="white" stopOpacity="0" /></linearGradient>
              </defs>
              <rect width={width} height={height} fill={`url(#${id}-sky)`} />
              <rect width={width} height="140" fill={`url(#${id}-haze)`} />
              {visible.map((point, i) => i % 6 === 0 && point.isDay != null ? <g key={point.time} transform={`translate(${x(point.time)},27)`} opacity=".7">
                {point.isDay ? <><circle r="6" fill="#bc954f" /><circle r="10" fill="none" stroke="#bc954f" strokeDasharray="1 5" /></> : <><path d="M2 -7 A8 8 0 1 0 7 4 A7 7 0 0 1 2 -7" fill="#37566e" /><circle cx="15" cy="-10" r="1" fill="white" /></>}
              </g> : null)}
              {waterAreas.map((area) => <g key={area.time}>
                <path d={area.path} fill={`url(#${id}-water)`} />
                <path d={area.path} fill={`url(#${id}-depth)`} />
              </g>)}
              {visible.map((point) => <line key={point.time} x1={x(point.time)} x2={x(point.time)} y1="42" y2={height} stroke="white" strokeOpacity=".09" strokeDasharray="2 5" />)}
              {plottedMetrics.map((metric) => <g key={metric.key} fill={metric.color} stroke={metric.color}>
                {metricSegments(plotPoints, metric.key).map((segment) => <g key={segment[0].time}>
                  <path d={metric.key === 'seaLevel' ? waterAreas.find((area) => area.time === segment[0].time).surface : smoothTidePath(segment.map((point) => ({ x: x(point.time), y: y(point[metric.key], metric) })))} fill="none" strokeWidth={metric.key === 'seaLevel' ? 3 : metric.dashed ? 1 : 1.6} strokeDasharray={metric.dashed ? '4 4' : undefined} />
                  {segment.length === 1 && <circle cx={x(segment[0].time)} cy={y(segment[0][metric.key], metric)} r="3" />}
                </g>)}
                {Number.isFinite(selected[metric.key]) && <circle cx={selectedX} cy={y(selected[metric.key], metric)} r="4" stroke="#17364c" strokeWidth="2" />}
              </g>)}
              {timeline.map((point, i) => {
                const center = x(point.time)
                const previous = timeline[i - 1]
                const next = timeline[i + 1]
                const halfHour = (width - 2 * pad) / 24
                const left = previous && Date.parse(point.time) - Date.parse(previous.time) <= 90 * 60000 ? (x(previous.time) + center) / 2 : Math.max(0, center - halfHour)
                const right = next && Date.parse(next.time) - Date.parse(point.time) <= 90 * 60000 ? (center + x(next.time)) / 2 : Math.min(width, center + halfHour)
                if (right <= 0 || left >= width) return null
                return <rect key={point.time} className={`scene-risk-band ${assessment(point).level}`} x={left} y={height - 6} width={right - left} height="6" />
              })}
              <line x1={selectedX} x2={selectedX} y1="0" y2={height} stroke="#587b91" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </div>
          <div className="scene-hours" role="group" aria-label={t('decision.aria')} style={{ height: 48 }}>
            {visible.map((point) => <button type="button" key={point.time} aria-label={`${time(point.time)}, ${assessment(point).title}`} title={`${time(point.time)} · ${assessment(point).title} — ${assessment(point).reason}`} aria-pressed={selected.time === point.time} className={point === visible[0] || point === visible.at(-1) || selected.time === point.time || new Date(point.time).getUTCMinutes() !== 0 || Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23' }).format(new Date(point.time))) % 3 === 0 ? 'is-labelled' : 'is-tick'} style={{ left: x(point.time) }} onClick={() => onSelect(point.time)}>{time(point.time)}</button>)}
          </div>
        </div>
      </div>
      </div>
      <details className="scene-scale-details"><summary>{t('conditions.details')}</summary><div className="scene-values">{metrics.map(({ key, label, unit }) => <div key={key}><span>{t(`timeline.${label}`)}</span><strong>{number(selected[key], key)} <small>{unit}</small></strong></div>)}</div><p className="scene-scale-note">{t('timeline.wind')}: {t(`conditions.${labels.strength}`)} · {t(`conditions.${labels.direction}`)}. {t('timeline.gusts')}: {t(`conditions.${labels.gusts}`)}.</p>
      <p className="scene-scale-note">{t('timeline.tide')}: {t(`conditions.${labels.tide}`)}{labels.turn && <> · {t(`conditions.${labels.turn.kind}`)} ≈ {time(labels.turn.time, true)}</>}</p><div className="scene-legend">{plottedMetrics.map((metric) => { const scale = bounds(metric.key); return <span key={metric.key}>{metric.key === 'seaLevel' || metric.key === 'seaTemperature' ? <Waves size={13} /> : metric.key === 'windSpeed' ? <Wind size={13} /> : <Sun size={13} />}{t(`timeline.${metric.label}`)} · {scale.available ? `${scale.min}–${scale.max}` : '—'} {metric.unit}</span> })}</div>
      <div className="scene-risk-legend">{['good', 'caution', 'danger', 'unknown'].map((level) => <span className={`scene-safety ${level}`} key={level}><i />{t(`decision.levels.${level}`)}</span>)}</div><p className="tide-chart-hint">{t('timeline.unifiedHint')}</p><p className="scene-scale-note">{t('timeline.separateScales')}</p></details>
      <div className="timeline-footer"><span>{loading ? t('outlook.loading') : source === 'stale' ? t('outlook.staleLabel') : t('timeline.model')}</span></div>
    </section>
  )
}
