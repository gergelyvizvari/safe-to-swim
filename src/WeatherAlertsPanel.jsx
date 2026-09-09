import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AppModal } from './AppModal.jsx'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { weatherAlertMessages, weatherWarningsAt } from './weatherAlertMessages.js'
export default function WeatherAlertsPanel({ state, language, locale, selectedTime, isNow }) {
  const [open, setOpen] = useState(false)
  const [now,setNow] = useState(Date.now)
  useEffect(() => { const timer=setInterval(()=>setNow(Date.now()),60000); return ()=>clearInterval(timer) },[])
  if (state.supported === false) return null
  const copy=weatherAlertMessages(language)
  const date=value=>new Intl.DateTimeFormat(locale,{dateStyle:'short',timeStyle:'short'}).format(new Date(value))
  const stale=state.status==='stale' || state.checkedAt && now-Date.parse(state.checkedAt)>10*60000
  const items=weatherWarningsAt(state.items, isNow ? now : selectedTime)
  const uncertain = state.loading || stale || state.status !== 'available'
  const level = uncertain ? 'stale' : Math.max(0, ...items.map(item => item.level))
  const label = state.loading ? copy.loading : uncertain ? copy.chipUnavailable : items.length ? copy.title : copy.chipNone
  return <>
    <button type="button" className={`weather-alert-chip level-${level}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <AlertTriangle size={16} aria-hidden="true" /><span>{label}</span>{!uncertain && items.length > 0 && <span className="weather-alert-count">{items.length}</span>}
    </button>
    {open && createPortal(<AppModal className="weather-alerts" titleId="weather-alerts-title" closeLabel={copy.close} onClose={() => setOpen(false)}>
    <h2 id="weather-alerts-title"><AlertTriangle size={20}/>{copy.title}</h2>
    <p>{date(isNow ? now : selectedTime)}</p>
    {state.loading ? <p role="status">{copy.loading}</p> : state.status==='unavailable' || state.status==='unsupported' ? <p role="status">{copy.unavailable}</p> : stale ? <p role="status">{copy.stale}</p> : items.length===0 ? <p>{copy.none}</p> : null}
    <div className="weather-alert-list">{items.map(item=><article key={item.id} className={`weather-warning level-${stale?'stale':item.level}`} lang={item.language}>
      <strong>{item.event}</strong>
      <p><span lang={language}>{copy.levels[item.level]} · {Date.parse(item.startsAt)>now?copy.future:copy.active}</span> · {item.area}</p>
      <p>{date(item.startsAt)} – {date(item.expiresAt)}</p>
      <details><summary lang={language}>{copy.details}</summary><p>{item.description}</p><p>{item.instruction}</p><small>{copy.issued}: {date(item.issuedAt)}</small></details>
    </article>)}</div>
    <p className="panel-note">{copy.scope}</p>
    <div className="weather-alert-source"><a href={state.sourceUrl??'https://www.met.hu/idojaras/veszelyjelzes/'} target="_blank" rel="noreferrer">HungaroMet · MeteoAlarm — {copy.source} <ArrowUpRight size={14}/></a>{state.checkedAt&&<small>{copy.checked}: {date(state.checkedAt)}</small>}</div>
  </AppModal>, document.body)}
  </>
}
