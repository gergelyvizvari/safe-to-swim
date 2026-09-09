import { locationDisplayName } from './locationNames.js'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Check, List, LocateFixed, Map, MapPin, Search, Waves, X } from 'lucide-react'
import { useCatalogue } from './useCatalogue.js'
import { catalogueMessages } from './catalogueMessages.js'

const MAX_SEARCH_RESULTS = 80
const LocationPickerMap = lazy(() => import('./LocationPickerMap.jsx'))

function cardTone(location) {
  return [...location.id].reduce((total, character) => total + character.charCodeAt(0), 0) % 6
}

function LocationCard({ location, selected, onSelect, t, locale, interactive = true }) {
  const Card = interactive ? 'button' : 'div'
  return (
    <Card
      className={`location-card location-card-tone-${cardTone(location)} ${selected ? 'is-selected' : ''}${interactive ? '' : ' location-card-static'}`}
      type={interactive ? 'button' : undefined}
      onClick={interactive ? () => onSelect(location.id) : undefined}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="location-card-waves" aria-hidden="true"><Waves size={76} strokeWidth={1.2} /></span>
      <span className="location-card-copy">
        <strong>{locationDisplayName(location, locale)}</strong>
        <span>{location.area !== location.nation ? `${location.area} · ` : ''}{location.nation} · {t(`lake.${location.waterType ?? 'coastal'}`)}</span>
      </span>
      <span className="location-card-pin" aria-hidden="true"><MapPin size={18} /></span>
      {selected && <span className="location-card-selected"><Check size={14} /> {t('locationPicker.selected')}</span>}
    </Card>
  )
}

export function LocationPickerScreen({ location, userPosition, onClose, onSelect, onUseCurrentLocation, locating, locationFeedback, locale, t }) {
  const [search, setSearch] = useState('')
  const [waterType, setWaterType] = useState('all')
  const [view, setView] = useState('list')
  const searchRef = useRef(null)
  const previousFocusRef = useRef(null)
  const dialogRef = useRef(null)
  const [country, setCountry] = useState('')
  const [offset, setOffset] = useState(0)
  const normalizedSearch = search.trim()
  const copy = catalogueMessages(locale.split('-')[0])
  const result = useCatalogue({ q: search, kind: waterType, country, offset, limit: MAX_SEARCH_RESULTS })
  const suggested = useCatalogue({ featured: true, limit: 12 })
  const visibleResults = result.items
  const suggestedLocations = suggested.items.filter(item => item.id !== location.id)

  useEffect(() => {
    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    searchRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])')]
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [onClose])

  const selectLocation = (locationId) => {
    onSelect(locationId)
    onClose()
  }

  return (
    <div className="location-screen" role="dialog" aria-modal="true" aria-labelledby="location-screen-title" ref={dialogRef}>
      <div className="location-screen-shell">
        <header className="location-screen-header">
          <div>
            <span className="location-screen-eyebrow"><Waves size={17} /> safe<span>to</span>swim</span>
            <h1 id="location-screen-title">{t('locationPicker.title')}</h1>
            <p>{t('locationPicker.subtitle', { count: result.loading ? '…' : result.total })}</p>
          </div>
          <button className="location-screen-close" type="button" onClick={onClose} aria-label={t('locationPicker.close')}>
            <X size={23} />
          </button>
        </header>

        <div className="location-view-toggle" role="group" aria-label={t('locationPicker.viewLabel')}>
          <button className={view === 'list' ? 'is-active' : ''} type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <List size={16} />{t('locationPicker.listView')}
          </button>
          <button className={view === 'map' ? 'is-active' : ''} type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>
            <Map size={16} />{t('locationPicker.mapView')}
          </button>
        </div>

        <div className="nation-filters" role="group" aria-label={t('lake.filter')}>
          {['all', 'coastal', 'lake'].map((type) => <button key={type} type="button" className={waterType === type ? 'is-active' : ''} aria-pressed={waterType === type} onClick={() => { setWaterType(type); setOffset(0) }}>{t(`lake.${type}`)}</button>)}
        </div>
        <label className="catalogue-country"><span className="sr-only">{copy.country}</span><select value={country} onChange={event => { setCountry(event.target.value); setOffset(0) }}><option value="">{copy.country}</option>{result.nations.map(nation => <option key={nation} value={nation}>{nation}</option>)}</select></label>
        <div className="location-search">
          <Search size={20} aria-hidden="true" />
          <label className="sr-only" htmlFor="location-search-input">{t('locationPicker.searchLabel')}</label>
          <input
            id="location-search-input"
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setOffset(0) }}
            placeholder={t('locationPicker.searchPlaceholder')}
            autoComplete="off"
          />
        </div>

        <button className="nearest-location-action" type="button" onClick={onUseCurrentLocation} disabled={locating}>
          <span><LocateFixed size={21} /></span>
          <span>
            <strong>{locating ? t('header.locating') : t('locationPicker.useLocation')}</strong>
            {locationFeedback && <small role="status">{locationFeedback}</small>}
          </span>
        </button>

        <div className={`location-screen-content ${view === 'map' ? 'is-map' : ''}`}>
          {view === 'map' ? (
            <Suspense fallback={<div className="location-map-loading">{t('locationPicker.mapLoading')}</div>}>
              <LocationPickerMap
                key={location.id}
                query={search}
                waterType={waterType}
                country={country}
                selectedLocation={location}
                searchActive={Boolean(normalizedSearch) || waterType !== 'all'}
                userPosition={userPosition}
                onSelect={selectLocation}
                locale={locale}
                t={t}
              />
            </Suspense>
          ) : normalizedSearch || waterType !== 'all' || country ? (
            <section aria-labelledby="location-results-title">
              <div className="location-list-heading">
                <h2 id="location-results-title">{t('locationPicker.results', { count: result.total })}</h2>
              </div>
              {result.loading ? <p role="status">{copy.loading}</p> : result.error ? <p role="alert">{copy.error}</p> : visibleResults.length ? (
                <div className="location-card-grid">
                  {visibleResults.map((item) => (
                    <LocationCard key={item.id} location={item} selected={item.id === location.id} onSelect={selectLocation} t={t} locale={locale} />
                  ))}
                </div>
              ) : <p className="location-empty">{t('locationPicker.empty')}</p>}
              <div className="catalogue-pagination">
                {offset > 0 && <button type="button" onClick={() => setOffset(value => Math.max(0, value - MAX_SEARCH_RESULTS))}>{copy.previous}</button>}
                {offset + MAX_SEARCH_RESULTS < result.total && <button type="button" onClick={() => setOffset(value => value + MAX_SEARCH_RESULTS)}>{copy.more}</button>}
              </div>
            </section>
          ) : (
            <>
              <section aria-labelledby="selected-location-title">
                <div className="location-list-heading"><h2 id="selected-location-title">{t('locationPicker.current')}</h2></div>
                <div className="location-card-grid location-current-grid">
                  <LocationCard location={location} selected interactive={false} t={t} locale={locale} />
                </div>
              </section>
              <section aria-labelledby="suggested-locations-title">
                <div className="location-list-heading"><h2 id="suggested-locations-title">{t('locationPicker.suggested')}</h2></div>
                <div className="location-card-grid">
                  {suggested.error && <p role="alert">{copy.error}</p>}
                  {suggested.loading && <p role="status">{copy.loading}</p>}
                  {suggestedLocations.map((item) => (
                    <LocationCard key={item.id} location={item} selected={false} onSelect={selectLocation} t={t} locale={locale} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
