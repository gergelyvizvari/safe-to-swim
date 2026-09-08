import { useState } from 'react'
import LocationPickerMap from './LocationPickerMap.jsx'
import { catalogueMessages } from './catalogueMessages.js'
import { useCatalogue } from './useCatalogue.js'

export function UKCoastExplorer({ selectedLocation, onSelect, t }) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [waterType, setWaterType] = useState('all')
  const result = useCatalogue({ q: query, country, kind: waterType, limit: 10 })
  const locale = document.documentElement.lang || 'en'
  const copy = catalogueMessages(locale)
  return <section className="panel uk-explorer" aria-labelledby="uk-explorer-title">
    <div className="section-heading"><div><span className="eyebrow">{t('explorer.eyebrow')}</span><h2 id="uk-explorer-title">{t('explorer.title')}</h2></div></div>
    <div className="uk-explorer-grid"><div className="beach-finder">
      <label className="beach-search"><span className="sr-only">{t('explorer.searchLabel')}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('explorer.searchPlaceholder')} /></label>
      <label className="catalogue-country"><span className="sr-only">{copy.country}</span><select value={country} onChange={event => setCountry(event.target.value)}><option value="">{copy.country}</option>{result.nations.map(n => <option key={n}>{n}</option>)}</select></label>
      <div className="nation-filters" role="group" aria-label={t('lake.filter')}>{['all','coastal','lake'].map(type => <button key={type} type="button" aria-pressed={waterType === type} className={waterType === type ? 'is-active' : ''} onClick={() => setWaterType(type)}>{t(`lake.${type}`)}</button>)}</div>
      <p role="status">{result.loading ? copy.loading : result.error ? copy.error : t('explorer.results', { count: result.total })}</p>
      <div className="beach-results">{result.items.map(location => <button type="button" key={location.id} onClick={() => onSelect(location.id)}><span><strong>{location.name}</strong><small>{location.nation}</small></span></button>)}</div>
      {result.total > 10 && <p className="result-hint">{t('explorer.refine')}</p>}
    </div><LocationPickerMap query={query} country={country} waterType={waterType} selectedLocation={selectedLocation} onSelect={onSelect} locale={locale} t={t} /></div>
  </section>
}
