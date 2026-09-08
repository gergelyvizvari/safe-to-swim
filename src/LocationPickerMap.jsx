import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Check, Droplets, LocateFixed, MapPin, Navigation, Waves, Wind } from 'lucide-react'
import { distanceToCoastalLocation } from './locationUtils.js'
import { useCoastalConditions } from './useCoastalConditions.js'
import { formatNumber, formatWholeNumber, getSafety } from './safety.js'
import { classificationTone, getWaterQualityForLocation } from './waterQuality.js'

import { useCatalogue } from './useCatalogue.js'
import { catalogueMessages } from './catalogueMessages.js'

const EUROPE_BOUNDS = L.latLngBounds([27, -32], [71.5, 45])

function qualityToneForLocation(location) {
  const quality = getWaterQualityForLocation(location)
  return classificationTone(quality?.site.classification ?? location.classification)
}

function markerIcon(location, active) {
  const classification = qualityToneForLocation(location)
  return L.divIcon({
    className: `location-picker-map-marker ${classification} ${active ? 'is-active' : ''}`,
    html: '<span></span>',
    iconSize: [active ? 24 : 18, active ? 24 : 18],
    iconAnchor: [active ? 12 : 9, active ? 12 : 9],
  })
}

function clusterIcon(count) {
  const size = count >= 100 ? 46 : count >= 25 ? 42 : 38
  return L.divIcon({
    className: 'location-picker-map-cluster',
    html: `<span>${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function clusterVisibleLocations(map, locations, expandedLocationIds) {
  const visibleBounds = map.getBounds().pad(0.18)
  const visibleLocations = locations.filter((location) => (
    visibleBounds.contains([location.latitude, location.longitude])
  ))

  if (map.getZoom() >= map.getMaxZoom()) return visibleLocations.map((location) => [location])

  const expandedIds = new Set(expandedLocationIds)
  const cellSize = map.getZoom() <= 6 ? 68 : map.getZoom() <= 8 ? 58 : 48
  const groups = new Map()

  visibleLocations.forEach((location) => {
    if (expandedIds.has(location.id)) {
      groups.set(`expanded:${location.id}`, [location])
      return
    }
    const point = map.latLngToContainerPoint([location.latitude, location.longitude])
    const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`
    const group = groups.get(key) ?? []
    group.push(location)
    groups.set(key, group)
  })

  return [...groups.values()]
}

function MapSelectionCard({ location, selected, userPosition, onSelect, locale, t }) {
  const { data, loading, error } = useCoastalConditions(location)
  const hasLivePreview = !loading && !error && (data.source === 'live' || (location.marineModelSupported === false && data.source === 'partial'))
  const safety = hasLivePreview ? getSafety(data.current, location, t, locale) : null
  const SafetyIcon = safety?.icon
  const qualityTone = qualityToneForLocation(location)
  const distance = userPosition
    ? distanceToCoastalLocation(userPosition.latitude, userPosition.longitude, location)
    : null

  return (
    <div className="location-map-selection" role="status" aria-live="polite">
      <div className="location-map-selection-heading">
        <span className="location-map-selection-pin"><MapPin size={18} /></span>
        <span className="location-map-selection-copy">
          <strong>{location.name}</strong>
          <small>
            {location.area !== location.nation ? `${location.area} · ` : ''}{location.nation}
            {Number.isFinite(distance) && <> · {t('locationPicker.distanceAway', { distance: formatNumber(distance, locale) })}</>}
          </small>
        </span>
        <span className={`location-map-safety ${safety?.level ?? 'loading'}`}>
          {SafetyIcon && <SafetyIcon size={14} />}
          {loading
            ? t('locationPicker.previewLoading')
            : safety
              ? t(`decision.levels.${safety.level}`)
              : t('locationPicker.previewUnavailable')}
        </span>
      </div>

      <div className="location-map-readings" aria-label={t('locationPicker.previewAria')}>
        <span><Waves size={15} /><small>{t(location.marineModelSupported === false ? 'lake.air' : 'safety.wave')}</small><strong>{hasLivePreview ? location.marineModelSupported === false ? `${formatNumber(data.current.temperature, locale)} °C` : `${formatNumber(data.current.waveHeight, locale)} m` : '—'}</strong></span>
        <span><Wind size={15} /><small>{t('safety.gusts')}</small><strong>{hasLivePreview ? `${formatWholeNumber(data.current.gusts)} mph` : '—'}</strong></span>
        <span className={qualityTone}><Droplets size={15} /><small>{t('waterQuality.annualShort')}</small><strong>{t(`waterQuality.classes.${qualityTone}`)}</strong></span>
      </div>

      <button type="button" onClick={() => onSelect(location.id)}>
        {selected ? <Check size={14} /> : <Navigation size={14} />}
        {t(selected ? 'locationPicker.selected' : 'locationPicker.selectMapLocation')}
      </button>
    </div>
  )
}

export default function LocationPickerMap({ query = '', waterType = 'all', country = '', selectedLocation, userPosition, onSelect, locale, t }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [activeLocationId, setActiveLocationId] = useState(selectedLocation.id)
  const [expandedLocationIds, setExpandedLocationIds] = useState([])
  const [bounds, setBounds] = useState({ west: -32, south: 27, east: 45, north: 72 })
  const result = useCatalogue({ q: query, kind: waterType, country, limit: 500, ...bounds })
  const locations = result.items
  const activeLocation = locations.find(item => item.id === activeLocationId) ?? null
  const visibleActiveLocationId = activeLocation?.id
  const copy = catalogueMessages(locale.split('-')[0])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined
    const map = L.map(containerRef.current, {
      minZoom: 3,
      maxZoom: 15,
      scrollWheelZoom: true,
      zoomControl: true,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    map.fitBounds(EUROPE_BOUNDS, { padding: [12, 12] })
    mapRef.current = map
    const updateBounds = () => {
      const b = map.getBounds()
      setBounds({ west: Math.max(-180,b.getWest()), east: Math.min(180,b.getEast()), south: Math.max(-90,b.getSouth()), north: Math.min(90,b.getNorth()) })
    }
    map.on('moveend', updateBounds)
    updateBounds()
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const markerLayer = L.layerGroup().addTo(map)

    const renderMarkers = () => {
      markerLayer.clearLayers()
      const groups = clusterVisibleLocations(map, locations, expandedLocationIds)

      groups.forEach((group) => {
        if (group.length === 1) {
          const location = group[0]
          const active = location.id === visibleActiveLocationId
          L.marker([location.latitude, location.longitude], {
            icon: markerIcon(location, active),
            keyboard: true,
            riseOnHover: true,
            title: location.name,
            alt: location.name,
          })
            .bindTooltip(location.name, { direction: 'top', sticky: true })
            .on('click', () => {
              setActiveLocationId(location.id)
              map.panTo([location.latitude, location.longitude])
            })
            .addTo(markerLayer)
          return
        }

        const bounds = L.latLngBounds(group.map((location) => [location.latitude, location.longitude]))
        const center = bounds.getCenter()
        const clusterLabel = t('locationPicker.clusterLabel', { count: group.length })
        L.marker(center, {
          icon: clusterIcon(group.length),
          keyboard: true,
          title: clusterLabel,
          alt: clusterLabel,
        })
          .bindTooltip(clusterLabel, { direction: 'top' })
          .on('click', () => {
            const targetZoom = map.getBoundsZoom(bounds, false, L.point(84, 84))
            if (targetZoom >= map.getMaxZoom()) {
              setExpandedLocationIds(group.map((location) => location.id))
            }
            map.fitBounds(bounds, { padding: [42, 42], maxZoom: map.getMaxZoom(), animate: false })
          })
          .on('add', ({ target }) => target.getElement()?.setAttribute('aria-label', clusterLabel))
          .addTo(markerLayer)
      })

    }

    renderMarkers()
    map.on('zoomend moveend', renderMarkers)
    return () => {
      map.off('zoomend moveend', renderMarkers)
      markerLayer.remove()
    }
  }, [expandedLocationIds, locations, t, visibleActiveLocationId])

  useEffect(() => {
    mapRef.current?.fitBounds(EUROPE_BOUNDS, { padding: [12, 12], animate: false })
  }, [query, waterType, country])

  const resetMap = () => {
    setExpandedLocationIds([])
    mapRef.current?.fitBounds(EUROPE_BOUNDS, { padding: [12, 12] })
  }

  return (
    <div className="location-map-view">
      <div className="location-picker-map" ref={containerRef} role="region" aria-label={t('locationPicker.mapAria')} />
      <button className="location-map-reset" type="button" onClick={resetMap}>
        <LocateFixed size={15} />{t('locationPicker.resetMap')}
      </button>
      {(result.loading || result.error || result.total > locations.length) && <p className="catalogue-map-status" role="status">{result.loading ? copy.loading : result.error ? copy.error : copy.zoom}</p>}
      {activeLocation ? (
        <MapSelectionCard
          key={activeLocation.id}
          location={activeLocation}
          selected={activeLocation.id === selectedLocation.id}
          userPosition={userPosition}
          onSelect={onSelect}
          locale={locale}
          t={t}
        />
      ) : !result.loading && locations.length === 0 ? (
        <div className="location-map-empty">{t('locationPicker.mapEmpty')}</div>
      ) : null}
    </div>
  )
}
