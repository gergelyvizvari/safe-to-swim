import { locationDisplayName } from './locationNames.js'
import { useState } from 'react'
import { ChevronRight, MapPin, Waves } from 'lucide-react'
import LocationPickerMap from './LocationPickerMap.jsx'
import { catalogueMessages } from './catalogueMessages.js'
import { useCatalogue } from './useCatalogue.js'

export function UKCoastExplorer({ selectedLocation, onSelect, t }) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [waterType, setWaterType] = useState('all')
  const [offset, setOffset] = useState(0)
  const result = useCatalogue({ q: query, country, kind: waterType, limit: 10, offset })
  const locale = document.documentElement.lang || 'en'
  const copy = catalogueMessages(locale)
  return <section className="panel uk-explorer" aria-labelledby="uk-explorer-title">
    <div className="section-heading"><div><span className="eyebrow">{t('explorer.eyebrow')}</span><h2 id="uk-explorer-title">{t('explorer.title')}</h2></div></div>
    <div className="uk-explorer-grid"><div className="beach-finder">
      <label className="beach-search"><span className="sr-only">{t('explorer.searchLabel')}</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setOffset(0) }} placeholder={t('explorer.searchPlaceholder')} /></label>
      <label className="catalogue-country"><span className="sr-only">{copy.country}</span><select value={country} onChange={event => { setCountry(event.target.value); setOffset(0) }}><option value="">{copy.country}</option>{result.nations.map(n => <option key={n}>{n}</option>)}</select></label>
      <div className="nation-filters" role="group" aria-label={t('lake.filter')}>{['all','coastal','lake'].map(type => <button key={type} type="button" aria-pressed={waterType === type} className={waterType === type ? 'is-active' : ''} onClick={() => { setWaterType(type); setOffset(0) }}>{t(`lake.${type}`)}</button>)}</div>
      <p className="beach-results-meta" role="status">{result.loading ? copy.loading : result.error ? copy.error : t('explorer.results', { count: result.total.toLocaleString(locale) })}</p>
      <div className="beach-results" aria-busy={result.loading}>{result.items.map(location => <button type="button" key={location.id} className={selectedLocation.id === location.id ? 'is-selected' : ''} aria-pressed={selectedLocation.id === location.id} onClick={() => onSelect(location.id)}>
        <span className="result-pin">{location.waterType === 'lake' ? <Waves size={16} /> : <MapPin size={16} />}</span>
        <span><strong>{locationDisplayName(location, locale)}</strong><small>{[location.area, location.nation].filter((value, index, values) => value && values.indexOf(value) === index).join(' · ')}</small></span>
        <ChevronRight size={14} />
      </button>)}</div>
      {!result.loading && !result.error && result.total === 0 && <p className="beach-empty">{t('explorer.empty')}</p>}
      {(offset > 0 || result.total > 10) && <div className="catalogue-pagination">
        <button type="button" disabled={offset === 0 || result.loading} onClick={() => setOffset(value => Math.max(0, value - 10))}>{copy.previous}</button>
        <button type="button" disabled={result.loading || offset + 10 >= result.total} onClick={() => setOffset(value => value + 10)}>{copy.more}</button>
      </div>}

    </div><LocationPickerMap query={query} country={country} waterType={waterType} selectedLocation={selectedLocation} onSelect={onSelect} locale={locale} t={t} /></div>
  </section>
}
