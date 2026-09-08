import { useEffect, useState } from 'react'
import App from './App.jsx'
import { catalogueRequest } from './catalogueClient.js'
import { catalogueMessages } from './catalogueMessages.js'

export default function CatalogueApp() {
  const [id, setId] = useState(() => localStorage.getItem('safe-to-swim-location') ?? 'brighton')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ location: null, error: null })
  const copy = catalogueMessages(localStorage.getItem('safe-to-swim-language'))
  useEffect(() => {
    const controller = new AbortController()
    catalogueRequest({ id }, controller.signal)
      .then(location => setState({ location, error: null }))
      .catch(error => { if (!controller.signal.aborted) setState({ location: null, error: error.message }) })
    return () => controller.abort()
  }, [id, attempt])
  const select = next => {
    // Selecting the current site closes the picker without clearing its data:
    // an unchanged ID would not trigger the loading effect again.
    if (next === id) return
    setState({ location: null, error: null })
    setId(next)
  }
  if (state.location?.id !== id) return <main className="catalogue-gate"><span className="eyebrow">safe to swim</span>
    <h1>{state.error ? state.error === 'not_found' ? copy.missing : copy.error : copy.loading}</h1>
    {state.error && <button type="button" onClick={() => { setState({ location: null, error: null }); setAttempt(value => value + 1) }}>{copy.retry}</button>}
    {state.error === 'not_found' && <button type="button" onClick={() => select('brighton')}>Brighton Beach</button>}
  </main>
  return <App location={state.location} onSelectLocation={select} />
}
