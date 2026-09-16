import { DEFAULT_LANGUAGE, isLanguageLoaded, loadLanguage, makeTranslator, resolveLanguage } from './i18n.js'
import { useEffect, useState } from 'react'
import App from './App.jsx'
import { catalogueRequest } from './catalogueClient.js'
import { catalogueMessages } from './catalogueMessages.js'

export default function CatalogueApp() {
  const [language, setLanguage] = useState(() => resolveLanguage(localStorage.getItem('safe-to-swim-language')))
  const [languageRequest, setLanguageRequest] = useState(() => ({ code: language, status: isLanguageLoaded(language) ? 'ready' : 'loading', attempt: 0 }))
  const requestLanguage = code => setLanguageRequest(previous => ({ code, status: 'loading', attempt: previous.attempt + 1 }))
  const t = makeTranslator(language)
  useEffect(() => {
    if (languageRequest.status !== 'loading') return
    let active = true
    loadLanguage(languageRequest.code).then(() => {
      if (!active) return
      setLanguage(languageRequest.code)
      setLanguageRequest(previous => ({ ...previous, status: 'ready' }))
    }).catch(() => {
      if (active) setLanguageRequest(previous => ({ ...previous, status: 'error' }))
    })
    return () => { active = false }
  }, [languageRequest])
  const [id, setId] = useState(() => localStorage.getItem('safe-to-swim-location') ?? 'brighton')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ location: null, error: null })
  const copy = catalogueMessages(language)
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
  if (!isLanguageLoaded(language)) return <main className="catalogue-gate" aria-busy={languageRequest.status === 'loading'}>
    <span className="eyebrow">safe to swim</span>
    <h1 role="status">{t(languageRequest.status === 'error' ? 'language.error' : 'language.loading')}</h1>
    {languageRequest.status === 'error' && <><button type="button" onClick={() => requestLanguage(languageRequest.code)}>{copy.retry}</button><button type="button" onClick={() => requestLanguage(DEFAULT_LANGUAGE)}>English</button></>}
  </main>
  if (state.location?.id !== id) return <main className="catalogue-gate"><span className="eyebrow">safe to swim</span>
    <h1>{state.error ? state.error === 'not_found' ? copy.missing : copy.error : copy.loading}</h1>
    {state.error && <button type="button" onClick={() => { setState({ location: null, error: null }); setAttempt(value => value + 1) }}>{copy.retry}</button>}
    {state.error === 'not_found' && <button type="button" onClick={() => select('brighton')}>Brighton Beach</button>}
  </main>
  return <>
    {languageRequest.status === 'error' && <div className="data-notice" role="alert">{t('language.error')} <button type="button" onClick={() => requestLanguage(languageRequest.code)}>{copy.retry}</button></div>}
    <App location={state.location} onSelectLocation={select} language={language} onLanguageChange={requestLanguage} languageLoading={languageRequest.status === 'loading'} />
  </>
}
