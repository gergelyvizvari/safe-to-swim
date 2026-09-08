import { ArrowUpRight, RefreshCw } from 'lucide-react'
import { balatonMessages } from './balatonMessages.js'
import { catalogueMessages } from './catalogueMessages.js'
import { isObservationStale } from './balaton.js'

export default function ObservationsPanel({ observations: state, language, locale }) {
  const copy = balatonMessages(language)
  const { now } = state
  const date = value => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
  const number = value => Number.isFinite(value) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value) : '—'
  const order = ['storm', 'quality', 'temperature', 'wind', 'windForecast', 'waveForecast']
  return <section className="panel balaton-panel" aria-labelledby="observations-title">
    <div className="section-heading"><h2 id="observations-title">{catalogueMessages(language).title}</h2><button type="button" aria-label={copy.refresh} disabled={state.loading} onClick={state.refresh}><RefreshCw size={17} /></button></div>
    {state.loading && <p role="status">{copy.loading}</p>}
    {state.error && <p role="status">{copy.unavailable}</p>}
    <div className="balaton-cards">{[...state.items].sort((a,b) => order.indexOf(a.type) - order.indexOf(b.type)).map(item => {
      const stale = state.error || item.status === 'stale' || item.format !== 'link' && isObservationStale(item.publishedAt, item.staleSeconds * 1000, now)
      return <article className={item.type === 'wind' ? 'observations-wind' : ''} key={`${item.type}:${item.targetId}`}>
        <span className="eyebrow">{item.provider} · {item.label}</span><h3>{copy[item.type] ?? item.type}</h3>
        {item.status === 'unavailable' && <p>{copy.unavailable}</p>}
        {item.status === 'unmatched' && <p>{copy.unmatched}</p>}
        {item.sample && <><strong className={item.sample.result === 'fail' ? 'balaton-alert' : ''}>{copy[item.sample.result ?? 'unknown']}</strong><p>{item.sample.name}</p><p>{copy.sampled}: {item.sample.sampledOn ?? '—'}</p><p className="panel-note">{copy.sampleNote}</p></>}
        {item.basins && <><div className="balaton-basins">{item.basins.map(basin => <div key={basin.basin} className={!stale && basin.level > 0 ? 'balaton-alert' : ''}><span>{copy[basin.basin] ?? basin.basin}</span><strong>{copy[Number.isInteger(basin.level) ? `level${basin.level}` : 'unknown']}</strong></div>)}</div><p className="panel-note">{copy.stormNote}</p></>}
        {item.stations && <><details open={item.stations.length <= 3}><summary>{copy[item.type]} · {item.stations.length}</summary><dl className="balaton-stations">{item.stations.map(station => <div key={station.station}><dt>{station.station}</dt><dd>{item.type === 'temperature' ? `${number(station.temperature)} °C` : `${number(station.windKmh)} km/h · ${copy.gusts}: ${number(station.gustKmh)} km/h`}</dd></div>)}</dl></details><p className="panel-note">{copy.stationNote}</p></>}
        {item.publishedAt && item.type !== 'quality' && <p className="panel-note">{copy.published}: {date(item.publishedAt)}</p>}
        {stale && item.status !== 'unavailable' && item.status !== 'unmatched' && <p className="balaton-old">{copy.stale}</p>}
        {item.checkedAt && <p className="panel-note">{copy.checked}: {date(item.checkedAt)}</p>}
        <a href={item.url} target="_blank" rel="noreferrer">{copy.open} <ArrowUpRight size={14} /></a>
      </article>
    })}</div>
  </section>
}
