import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, LocateFixed, MapPin, Search, Waves, X } from 'lucide-react'
import { COASTAL_LOCATIONS, FEATURED_LOCATIONS } from './coastalLocations.js'

const MAX_SEARCH_RESULTS = 80

function normalizeSearch(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-GB')
    .trim()
}

function cardTone(location) {
  return [...location.id].reduce((total, character) => total + character.charCodeAt(0), 0) % 6
}

function LocationCard({ location, selected, onSelect, t }) {
  return (
    <button
      className={`location-card location-card-tone-${cardTone(location)} ${selected ? 'is-selected' : ''}`}
      type="button"
      onClick={() => onSelect(location.id)}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="location-card-waves" aria-hidden="true"><Waves size={76} strokeWidth={1.2} /></span>
      <span className="location-card-copy">
        <strong>{location.name}</strong>
        <span>{location.area} · {location.nation}</span>
      </span>
      <span className="location-card-pin" aria-hidden="true"><MapPin size={18} /></span>
      {selected && <span className="location-card-selected"><Check size={14} /> {t('locationPicker.selected')}</span>}
    </button>
  )
}

export function LocationPickerScreen({ location, onClose, onSelect, onUseCurrentLocation, locating, locationFeedback, t }) {
  const [search, setSearch] = useState('')
  const searchRef = useRef(null)
  const previousFocusRef = useRef(null)
  const dialogRef = useRef(null)
  const normalizedSearch = normalizeSearch(search)
  const matchingLocations = useMemo(() => {
    if (!normalizedSearch) return []
    return COASTAL_LOCATIONS.filter((item) => normalizeSearch(`${item.name} ${item.area} ${item.nation}`).includes(normalizedSearch))
  }, [normalizedSearch])
  const visibleResults = matchingLocations.slice(0, MAX_SEARCH_RESULTS)
  const suggestedLocations = FEATURED_LOCATIONS.filter((item) => item.id !== location.id)

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
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
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
            <p>{t('locationPicker.subtitle', { count: COASTAL_LOCATIONS.length })}</p>
          </div>
          <button className="location-screen-close" type="button" onClick={onClose} aria-label={t('locationPicker.close')}>
            <X size={23} />
          </button>
        </header>

        <div className="location-search">
          <Search size={20} aria-hidden="true" />
          <label className="sr-only" htmlFor="location-search-input">{t('locationPicker.searchLabel')}</label>
          <input
            id="location-search-input"
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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

        <div className="location-screen-content">
          {normalizedSearch ? (
            <section aria-labelledby="location-results-title">
              <div className="location-list-heading">
                <h2 id="location-results-title">{t('locationPicker.results', { count: matchingLocations.length })}</h2>
              </div>
              {visibleResults.length ? (
                <div className="location-card-grid">
                  {visibleResults.map((item) => (
                    <LocationCard key={item.id} location={item} selected={item.id === location.id} onSelect={selectLocation} t={t} />
                  ))}
                </div>
              ) : <p className="location-empty">{t('locationPicker.empty')}</p>}
              {matchingLocations.length > MAX_SEARCH_RESULTS && (
                <p className="location-refine">{t('locationPicker.refine', { count: MAX_SEARCH_RESULTS })}</p>
              )}
            </section>
          ) : (
            <>
              <section aria-labelledby="selected-location-title">
                <div className="location-list-heading"><h2 id="selected-location-title">{t('locationPicker.current')}</h2></div>
                <div className="location-card-grid location-current-grid">
                  <LocationCard location={location} selected onSelect={selectLocation} t={t} />
                </div>
              </section>
              <section aria-labelledby="suggested-locations-title">
                <div className="location-list-heading"><h2 id="suggested-locations-title">{t('locationPicker.suggested')}</h2></div>
                <div className="location-card-grid">
                  {suggestedLocations.map((item) => (
                    <LocationCard key={item.id} location={item} selected={false} onSelect={selectLocation} t={t} />
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
