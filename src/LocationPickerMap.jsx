import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Check, Droplets, LocateFixed, MapPin, Navigation, Waves, Wind } from 'lucide-react'
import { distanceToCoastalLocation } from './coastalLocations.js'
import { useCoastalConditions } from './useCoastalConditions.js'
import { formatNumber, formatWholeNumber, getSafety } from './safety.js'
import { classificationTone, getWaterQualityForLocation } from './waterQuality.js'

const UK_BOUNDS = L.latLngBounds([49.55, -8.65], [59.15, 2.1])

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
  const hasLivePreview = !loading && !error && data.source === 'live'
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
            {location.area} · {location.nation}
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
        <span><Waves size={15} /><small>{t('safety.wave')}</small><strong>{hasLivePreview ? `${formatNumber(data.current.waveHeight, locale)} m` : '—'}</strong></span>
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

export default function LocationPickerMap({ locations, selectedLocation, searchActive, userPosition, onSelect, locale, t }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [activeLocationId, setActiveLocationId] = useState(selectedLocation.id)
  const [expandedLocationIds, setExpandedLocationIds] = useState([])
  const visibleActiveLocationId = locations.some((location) => location.id === activeLocationId)
    ? activeLocationId
    : locations[0]?.id ?? null
  const activeLocation = useMemo(
    () => locations.find((location) => location.id === visibleActiveLocationId) ?? null,
    [locations, visibleActiveLocationId],
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined
    const map = L.map(containerRef.current, {
      minZoom: 5,
      maxZoom: 15,
      scrollWheelZoom: true,
      zoomControl: true,
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
            setExpandedLocationIds((currentIds) => [
              ...new Set([...currentIds, ...group.map((location) => location.id)]),
            ])
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
    const map = mapRef.current
    if (!map || !searchActive || !locations.length) return
    const bounds = L.latLngBounds(locations.map((location) => [location.latitude, location.longitude]))
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 11, animate: false })
  }, [locations, searchActive])

  const resetMap = () => {
    setExpandedLocationIds([])
    mapRef.current?.fitBounds(UK_BOUNDS, { padding: [12, 12] })
  }

  return (
    <div className="location-map-view">
      <div className="location-picker-map" ref={containerRef} role="region" aria-label={t('locationPicker.mapAria')} />
      <button className="location-map-reset" type="button" onClick={resetMap}>
        <LocateFixed size={15} />{t('locationPicker.resetMap')}
      </button>
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
      ) : (
        <div className="location-map-empty">{t('locationPicker.mapEmpty')}</div>
      )}
    </div>
  )
}
