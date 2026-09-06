import { smoothTidePath } from './tideCurvePath.js'
import { useEffect, useId, useRef, useState } from 'react'

export default function TideCurve({ tides, selectedTime, onSelect, locale, t }) {
  const gradientId = useId()
  const series = tides.series ?? []
  const svgRef = useRef(null)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [width, setWidth] = useState(560)
  useEffect(() => {
    if (!svgRef.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(1, entry.contentRect.width)))
    observer.observe(svgRef.current)
    return () => observer.disconnect()
  }, [series.length])
  if (!series.length) return <p className="panel-note">{t('tide.unavailable')}</p>
  const selectedIndex = Math.max(0, series.findIndex((point) => point.time === selectedTime))
  const windowStart = selectedIndex <= 24 ? 0 : Math.min(Math.max(0, series.length - 25), selectedIndex - 12)
  const visible = series.slice(windowStart, windowStart + 25)
  const selected = series[selectedIndex]
  const height = 160
  const padding = 14
  const minimum = Math.min(...visible.map((point) => point.height))
  const maximum = Math.max(...visible.map((point) => point.height))
  const range = Math.max(maximum - minimum, 0.1)
  const start = Date.parse(visible[0].time)
  const end = Date.parse(visible.at(-1).time)
  const x = (time) => padding + (Date.parse(time) - start) / Math.max(end - start, 1) * (width - padding * 2)
  const y = (level) => padding + (maximum - level + (maximum === minimum ? 0.05 : 0)) / range * (height - padding * 2)
  const line = smoothTidePath(visible.map((point) => ({ x: x(point.time), y: y(point.height) })))
  const timeLabel = (time, date = false) => new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/London', ...(date ? { weekday: 'short', day: 'numeric', month: 'short' } : {}), hour: '2-digit', minute: '2-digit',
  }).format(new Date(time))
  const number = (value) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  const event = tides.events.find((item) => item.time === selected.time)
  const chooseAtPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const time = start + Math.max(0, Math.min(1, (fraction * width - padding) / (width - padding * 2))) * (end - start)
    const closest = visible.reduce((best, point) => Math.abs(Date.parse(point.time) - time) < Math.abs(Date.parse(best.time) - time) ? point : best)
    onSelect(closest.time)
  }
  return (
    <div className="tide-chart">
      <div className="tide-chart-reading" aria-live="polite" aria-atomic="true">
        <div><span>{event ? t(`tide.${event.type}`) : t('tide.interactive.selected')}</span><strong>{timeLabel(selected.time, true)}</strong></div>
        <strong>{number(selected.height)} <small>m MSL</small></strong>
      </div>
      <p className="tide-chart-hint">{t('tide.interactive.hint')}</p>
      <div className="tide-plot">
        <div className="tide-y-labels" aria-hidden="true"><span>{number(maximum)} m</span><span>{number(minimum)} m</span></div>
        <div className={`tide-plot-main${keyboardFocus ? ' keyboard-focus' : ''}`} role="slider"
          onFocus={(event) => setKeyboardFocus(event.currentTarget.matches(':focus-visible'))}
          onBlur={() => setKeyboardFocus(false)} tabIndex={0}
          aria-label={t('tide.interactive.choose')} aria-valuemin={0} aria-valuemax={series.length - 1} aria-valuenow={selectedIndex}
          aria-valuetext={`${timeLabel(selected.time, true)}, ${number(selected.height)} m MSL`}
          onKeyDown={(event) => {
            setKeyboardFocus(true)
            const next = { ArrowRight: selectedIndex + 1, ArrowUp: selectedIndex + 1, ArrowLeft: selectedIndex - 1, ArrowDown: selectedIndex - 1, Home: 0, End: series.length - 1 }[event.key]
            if (next === undefined) return
            event.preventDefault()
            onSelect(series[Math.max(0, Math.min(series.length - 1, next))].time)
          }}>
          <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"
            onPointerDown={(event) => { setKeyboardFocus(false); event.currentTarget.parentElement.focus({ preventScroll: true }); setKeyboardFocus(false); event.currentTarget.setPointerCapture(event.pointerId); chooseAtPointer(event) }}
            onPointerMove={(event) => { if (event.buttons === 1) chooseAtPointer(event) }}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".22" /><stop offset="1" stopColor="currentColor" stopOpacity=".02" /></linearGradient></defs>
            {[padding, height / 2, height - padding].map((level) => <line className="tide-grid-line" key={level} x1={padding} x2={width - padding} y1={level} y2={level} />)}
            <path fill={`url(#${gradientId})`} d={`${line} L${x(visible.at(-1).time)},${height} L${x(visible[0].time)},${height} Z`} />
            <path className="tide-path" d={line} vectorEffect="non-scaling-stroke" />
            {tides.events.filter((item) => Date.parse(item.time) >= start && Date.parse(item.time) <= end).map((item) => <circle key={item.time} className={`tide-dot ${item.type}`} cx={x(item.time)} cy={y(item.height)} r="4" vectorEffect="non-scaling-stroke" />)}
            <line className="tide-selection-line" x1={x(selected.time)} x2={x(selected.time)} y1={0} y2={height} />
            <circle className="tide-selected-dot" cx={x(selected.time)} cy={y(selected.height)} r="5" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="tide-x-labels" aria-hidden="true">{[visible[0], visible[Math.floor((visible.length - 1) / 2)], visible.at(-1)].map((point, index) => <span key={index}>{timeLabel(point.time, index !== 1)}</span>)}</div>
        </div>
      </div>
      <div className="tide-chart-controls">
        <button type="button" onClick={() => onSelect(series[0].time)} disabled={selectedIndex === 0}>{t('tide.interactive.reset')}</button>
      </div>
    </div>
  )
}
