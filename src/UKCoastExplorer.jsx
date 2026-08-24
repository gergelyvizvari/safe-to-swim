import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { LocateFixed, MapPin, Search } from 'lucide-react'
import { COASTAL_LOCATIONS } from './coastalLocations.js'

const UK_BOUNDS = L.latLngBounds([49.55, -8.65], [59.15, 2.1])
const NATIONS = ['All', 'England', 'Wales', 'Scotland', 'Northern Ireland']

const CLASSIFICATION_COLORS = {
  Excellent: '#147aa2',
  Good: '#5b96ad',
  Sufficient: '#c18425',
  Poor: '#b34030',
  Unclassified: '#77817e',
}

function safePopup(location, t) {
  const wrapper = document.createElement('div')
  const heading = document.createElement('strong')
  const detail = document.createElement('p')
  heading.textContent = location.name
  detail.textContent = `${location.area} · ${location.classification ? t('explorer.classification', { value: location.classification }) : t('explorer.modelLocation')}`
  wrapper.append(heading, detail)
  return wrapper
}

export function UKCoastExplorer({ selectedLocation, onSelect, t }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const lastFocusedIdRef = useRef(selectedLocation.id)
  const [query, setQuery] = useState('')
  const [nation, setNation] = useState('All')

  const officialLocations = useMemo(() => COASTAL_LOCATIONS.filter((location) => location.source), [])
  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('en-GB')
    return officialLocations.filter((location) => {
      const matchesNation = nation === 'All' || location.nation === nation
      const searchableText = `${location.name} ${location.area} ${location.nation}`.toLocaleLowerCase('en-GB')
      return matchesNation && (!normalizedQuery || searchableText.includes(normalizedQuery))
    })
  }, [nation, officialLocations, query])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined
    const map = L.map(containerRef.current, {
      minZoom: 5,
      maxZoom: 15,
      scrollWheelZoom: false,
      zoomControl: true,
      preferCanvas: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map)
    map.fitBounds(UK_BOUNDS, { padding: [12, 12] })
    mapRef.current = map
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const markers = L.layerGroup().addTo(map)

    filteredLocations.forEach((location) => {
      const isSelected = location.id === selectedLocation.id
      const color = CLASSIFICATION_COLORS[location.classification] ?? CLASSIFICATION_COLORS.Unclassified
      L.circleMarker([location.latitude, location.longitude], {
        radius: isSelected ? 8 : 4.5,
        color: isSelected ? '#ffffff' : color,
        fillColor: isSelected ? '#147aa2' : color,
        fillOpacity: isSelected ? 1 : 0.72,
        weight: isSelected ? 3 : 1,
      })
        .bindTooltip(`${location.name} · ${location.classification}`, { direction: 'top', sticky: true })
        .bindPopup(safePopup(location, t))
        .on('click', () => onSelect(location.id))
        .addTo(markers)
    })

    return () => markers.remove()
  }, [filteredLocations, onSelect, selectedLocation.id, t])

  useEffect(() => {
    if (lastFocusedIdRef.current === selectedLocation.id) return
    lastFocusedIdRef.current = selectedLocation.id
    mapRef.current?.setView([selectedLocation.latitude, selectedLocation.longitude], 10)
  }, [selectedLocation])

  useEffect(() => {
    if (!mapRef.current || (!query.trim() && nation === 'All') || filteredLocations.length === 0) return
    const resultBounds = L.latLngBounds(filteredLocations.map((location) => [location.latitude, location.longitude]))
    mapRef.current.fitBounds(resultBounds, { padding: [28, 28], maxZoom: 10 })
  }, [filteredLocations, nation, query])

  function selectLocation(location) {
    onSelect(location.id)
  }

  function resetMap() {
    mapRef.current?.fitBounds(UK_BOUNDS, { padding: [12, 12] })
  }

  return (
    <section className="panel uk-explorer" aria-labelledby="uk-explorer-title">
      <div className="section-heading uk-explorer-heading">
        <div>
          <span className="eyebrow">{t('explorer.eyebrow')}</span>
          <h2 id="uk-explorer-title">{t('explorer.title')}</h2>
        </div>
        <span className="location-count"><MapPin size={14} />{t('explorer.count', { count: officialLocations.length })}</span>
      </div>
      <div className="uk-explorer-grid">
        <div className="beach-finder">
          <label className="beach-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">{t('explorer.searchLabel')}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('explorer.searchPlaceholder')} type="search" />
          </label>
          <div className="nation-filters" role="group" aria-label={t('explorer.filterLabel')}>
            {NATIONS.map((item) => (
              <button className={nation === item ? 'is-active' : ''} type="button" aria-pressed={nation === item} onClick={() => setNation(item)} key={item}>
                {t(`explorer.nations.${item === 'Northern Ireland' ? 'ni' : item.toLowerCase()}`)}
              </button>
            ))}
          </div>
          <div className="beach-results-meta">{t('explorer.results', { count: filteredLocations.length })}</div>
          <div className="beach-results">
            {filteredLocations.slice(0, 10).map((location) => (
              <button className={location.id === selectedLocation.id ? 'is-selected' : ''} type="button" onClick={() => selectLocation(location)} key={location.id}>
                <span className="result-pin"><MapPin size={15} /></span>
                <span><strong>{location.name}</strong><small>{location.area} · {location.nation}</small></span>
                <i className={`classification-dot ${location.classification?.toLowerCase()}`} title={location.classification} />
              </button>
            ))}
            {filteredLocations.length === 0 && <div className="beach-empty">{t('explorer.empty')}</div>}
          </div>
          {filteredLocations.length > 10 && <p className="result-hint">{t('explorer.refine')}</p>}
        </div>
        <div className="uk-map-frame">
          <div className="uk-map-canvas" ref={containerRef} role="region" aria-label={t('explorer.mapLabel')} />
          <button className="uk-map-reset" type="button" onClick={resetMap}><LocateFixed size={15} />{t('explorer.reset')}</button>
          <div className="uk-map-legend">
            <span><i className="excellent" />{t('explorer.excellent')}</span>
            <span><i className="good" />{t('explorer.good')}</span>
            <span><i className="sufficient" />{t('explorer.sufficient')}</span>
            <span><i className="poor" />{t('explorer.poor')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
