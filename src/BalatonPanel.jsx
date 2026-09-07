import { useEffect, useState } from 'react'
import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { BALATON_SOURCES, isObservationStale } from './balaton.js'
import { balatonMessages } from './balatonMessages.js'

function SourceLink({ url, label }) {
  return <a href={url} target="_blank" rel="noreferrer">{label} <ArrowUpRight size={14} aria-hidden="true" /></a>
}

function Forecast({ kind, copy }) {
  const [open, setOpen] = useState(false)
  return <details className="balaton-forecast">
    <summary>{copy[kind]}</summary>
    <p className="panel-note">{copy.forecastNote}</p>
    {open ? <div className="balaton-frame"><iframe title={`HungaroMet · ${copy[kind]}`} src={`${BALATON_SOURCES[kind]}main.php`} loading="lazy" referrerPolicy="no-referrer" /></div>
      : <button type="button" onClick={() => setOpen(true)}>{copy.showForecast}</button>}
    <SourceLink url={BALATON_SOURCES[kind]} label={copy.open} />
  </details>
}

export default function BalatonPanel({ location, language, locale }) {
  const copy = balatonMessages(language)
  const [state, setState] = useState({ data: null, loading: true, error: false })
  const [refresh, setRefresh] = useState(0)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    let active = true
    fetch(`/api/balaton?location=${encodeURIComponent(location.id)}`, { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json() })
      .then(data => { if (data.locationId !== location.id) throw new Error('Wrong location'); if (active) setState({ data, loading: false, error: false }) })
      .catch(() => { if (active) setState({ data: null, loading: false, error: true }) })
      .finally(() => window.clearTimeout(timeout))
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [location.id, refresh])
  useEffect(() => {
    const interval = window.setInterval(() => { setNow(Date.now()); setRefresh(value => value + 1) }, 60000)
    return () => window.clearInterval(interval)
  }, [])
  const data = state.data?.locationId === location.id ? state.data : null
  const date = (value, dateOnly = false) => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...(dateOnly ? { timeZone: 'UTC' } : { timeStyle: 'short' }) }).format(new Date(value)) : '—'
  const number = value => Number.isFinite(value) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value) : '—'
  const stamp = (source, maxAge) => source?.publishedAt && <p className="panel-note">{copy.published}: {date(source.publishedAt)}{isObservationStale(source.publishedAt, maxAge, now) && <strong className="balaton-old">{copy.stale}</strong>}</p>
  const sample = data?.quality?.sample
  const stormOld = isObservationStale(data?.storm?.publishedAt, 2 * 3600000, now)
  return <section className="panel balaton-panel" aria-labelledby="balaton-title">
    <div className="section-heading"><div><span className="eyebrow">NNGYK · HungaroMet</span><h2 id="balaton-title">{copy.title}</h2></div>
      <button type="button" aria-label={copy.refresh} disabled={state.loading} onClick={() => { setNow(Date.now()); setState(previous => ({ ...previous, loading: true })); setRefresh(value => value + 1) }}><RefreshCw size={17} aria-hidden="true" /></button></div>
    {state.loading && <p role="status">{copy.loading}</p>}
    {state.error && <p role="status">{copy.unavailable}</p>}
    <div className="balaton-cards">
      <article><h3>{copy.storm}</h3>
        <div className="balaton-basins">{['west', 'central', 'east'].map(basin => {
          const level = data?.storm?.basins?.find(item => item.basin === basin)?.level
          return <div key={basin} className={!stormOld && level > 0 ? 'balaton-alert' : ''}><span>{copy[basin]}</span><strong>{copy[Number.isInteger(level) ? `level${level}` : 'unknown']}</strong></div>
        })}</div>
        {stamp(data?.storm, 2 * 3600000)}
        {data?.storm?.status === 'unavailable' && <p>{copy.unavailable}</p>}
        <p className="panel-note">{copy.stormNote}</p><SourceLink url={BALATON_SOURCES.storm} label={copy.open} />
      </article>
      <article><h3>{copy.quality}</h3>
        {sample ? <><strong className={sample.result === 'fail' ? 'balaton-alert' : ''}>{copy[sample.result ?? 'unknown']}</strong><p>{sample.name}</p><p>{copy.sampled}: {date(sample.sampledOn, true)}</p>
          {isObservationStale(sample.sampledOn, 30 * 86400000, now) && <p className="balaton-old">{copy.stale}</p>}</>
          : <p>{data?.quality?.status === 'unmatched' ? copy.unmatched : state.loading ? copy.loading : copy.unavailable}</p>}
        <p className="panel-note">{copy.sampleNote}</p><SourceLink url={BALATON_SOURCES.quality} label={copy.open} />
      </article>
      <article><h3>{copy.temperature}</h3>
        <dl className="balaton-stations">{(data?.temperature?.stations ?? []).map(item => <div key={item.station}><dt>{item.station}</dt><dd>{number(item.temperature)} °C</dd></div>)}</dl>
        {!data?.temperature?.stations && !state.loading && <p>{copy.unavailable}</p>}
        {stamp(data?.temperature, 36 * 3600000)}<p className="panel-note">{copy.stationNote}</p><SourceLink url={BALATON_SOURCES.temperature} label={copy.open} />
      </article>
    </div>
    <details className="balaton-wind"><summary>{copy.wind} · HungaroMet</summary>
      {stamp(data?.wind, 30 * 60000)}
      {data?.wind?.stations ? <div className="balaton-table"><table><thead><tr><th>{copy.wind}</th><th>km/h</th><th>{copy.gusts} · km/h</th></tr></thead><tbody>{data.wind.stations.map(item => <tr key={item.station}><th scope="row">{item.station}</th><td>{number(item.windKmh)}</td><td>{number(item.gustKmh)}</td></tr>)}</tbody></table></div> : <p>{state.loading ? copy.loading : copy.unavailable}</p>}
      <p className="panel-note">{copy.stationNote}</p><SourceLink url={BALATON_SOURCES.wind} label={copy.open} />
    </details>
    <Forecast kind="windForecast" copy={copy} /><Forecast kind="waveForecast" copy={copy} />
    {data?.checkedAt && <p className="panel-note">{copy.checked}: {date(data.checkedAt)}</p>}
  </section>
}
