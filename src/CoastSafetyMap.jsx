import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, ArrowUpRight, Flag, Info, LocateFixed, MapPin } from 'lucide-react'

const COAST_BOUNDS = L.latLngBounds(
  [50.8055, -0.205],
  [50.835, -0.089],
)

const COASTLINE = [
  [50.8267, -0.2040], [50.8264, -0.2015], [50.8259, -0.1930], [50.8253, -0.1892],
  [50.8249, -0.1850], [50.8244, -0.1790], [50.8239, -0.1740], [50.8236, -0.1690],
  [50.8231, -0.1645], [50.8225, -0.1603], [50.8216, -0.1540], [50.8209, -0.1504],
  [50.8197, -0.1420], [50.8191, -0.1366], [50.8188, -0.1324], [50.8179, -0.1250],
  [50.8168, -0.1180], [50.8156, -0.1110], [50.8121, -0.1031], [50.8109, -0.0965],
  [50.8111, -0.0897],
]

const LIFEGUARD_ZONES = [
  { id: 'west-hove', label: 'West Hove / Lagoon', shoreline: [[50.8264, -0.2010], [50.8259, -0.1955]], season: 'peak' },
  { id: 'hove-lawns', label: 'Hove Lawns', shoreline: [[50.8239, -0.1745], [50.8230, -0.1655]], season: 'main' },
  { id: 'west-pier', label: 'West Pier / Bandstand', shoreline: [[50.8217, -0.1554], [50.8212, -0.1528]], season: 'main' },
  { id: 'west-street', label: 'West Street / Seafront Office', shoreline: [[50.8208, -0.1498], [50.8198, -0.1435]], season: 'main' },
  { id: 'palace-west', label: 'Palace Pier West', shoreline: [[50.8197, -0.1417], [50.8192, -0.1383]], season: 'main' },
  { id: 'palace-east', label: 'Palace Pier East', shoreline: [[50.8191, -0.1353], [50.8187, -0.1327]], season: 'main' },
  { id: 'dukes-mound', label: "Duke's Mound", shoreline: [[50.8180, -0.1260], [50.8162, -0.1150]], season: 'main' },
]

// OpenStreetMap man_made=groyne geometries, simplified only where the source way
// outlines a wider structure. Snapshot: 2026-08-21.
const GROYNES = [
  [[50.8191455, -0.1390739], [50.8185893, -0.1393460]],
  [[50.8228766, -0.1630905], [50.8222954, -0.1632300]],
  [[50.8220605, -0.1575226], [50.8217335, -0.1575253]],
  [[50.8227153, -0.1617810], [50.8223503, -0.1617880], [50.8222724, -0.1617612], [50.8222216, -0.1617317]],
  [[50.8230500, -0.1645096], [50.8224739, -0.1647000]],
  [[50.8225217, -0.1603442], [50.8219845, -0.1605105]],
  [[50.8222875, -0.1589070], [50.8218379, -0.1590541]],
  [[50.8232430, -0.1661772], [50.8228134, -0.1661582]],
  [[50.8239360, -0.1733887], [50.8233432, -0.1735299]],
  [[50.8237437, -0.1707291], [50.8232846, -0.1707854]],
  [[50.8234078, -0.1675593], [50.8228690, -0.1677015]],
  [[50.8239128, -0.1721971], [50.8234352, -0.1721667]],
  [[50.8235963, -0.1692061], [50.8230694, -0.1692571]],
  [[50.8239372, -0.1747492], [50.8233018, -0.1749155]],
  [[50.8243441, -0.1780862], [50.8237727, -0.1780514]],
  [[50.8111129, -0.0896991], [50.8113184, -0.0896004]],
  [[50.8184593, -0.1325214], [50.8187813, -0.1323846]],
  [[50.8113109, -0.0905569], [50.8115012, -0.0904776]],
  [[50.8114499, -0.0914421], [50.8116940, -0.0913133]],
  [[50.8249253, -0.1849527], [50.8248313, -0.1849623], [50.8247904, -0.1849383], [50.8244749, -0.1849503]],
  [[50.8208652, -0.1503533], [50.8203288, -0.1506112]],
  [[50.8212188, -0.1521688], [50.8205202, -0.1525021]],
  [[50.8215883, -0.1539507], [50.8209645, -0.1542589]],
  [[50.8246202, -0.1863534], [50.8253055, -0.1864051]],
  [[50.8247740, -0.1877504], [50.8254338, -0.1878388]],
  [[50.8248980, -0.1892645], [50.8255817, -0.1891680]],
  [[50.8252431, -0.1912825], [50.8257247, -0.1911487]],
  [[50.8253062, -0.1929412], [50.8258865, -0.1928151]],
  [[50.8244288, -0.1790965], [50.8239188, -0.1791662]],
  [[50.8244212, -0.1802143], [50.8240294, -0.1803209]],
  [[50.8264237, -0.2011512], [50.8258254, -0.2011080]],
  [[50.8266767, -0.2039324], [50.8259529, -0.2039860]],
  [[50.8266031, -0.2031912], [50.8259647, -0.2030969]],
  [[50.8265204, -0.2021433], [50.8259575, -0.2021346]],
]

const FIXED_HAZARDS = [
  {
    id: 'west-pier', label: 'West Pier', detailKey: 'map.westPierDetail',
    line: [[50.8193760, -0.1522931], [50.8187711, -0.1525479], [50.8186050, -0.1517325], [50.8192303, -0.1514589]], center: [50.8189, -0.1520],
  },
  {
    id: 'palace-pier', label: 'Palace Pier', detailKey: 'map.palacePierDetail',
    line: [[50.8191287, -0.1366057], [50.8158108, -0.1370658], [50.8144946, -0.1367715]], center: [50.8168, -0.1368],
  },
  {
    id: 'marina', labelKey: 'map.marina', detailKey: 'map.marinaDetail',
    line: [[50.8120, -0.1042], [50.8085, -0.1007], [50.8088, -0.0954]], center: [50.8098, -0.1002],
  },
]

const INCIDENT_POINTS = [
  { label: 'West Street', value: '27%', position: [50.8197, -0.1450] },
  { label: 'Palace Pier West', value: '18%', position: [50.8193, -0.1385] },
  { label: 'Palace Pier East', value: '17%', position: [50.8189, -0.1340] },
]

const WATERLINE_OFFSET = 0.0005

const PATROL_SEASONS = {
  2026: {
    main: ['05-23', '09-06'],
    peak: ['07-18', '09-06'],
  },
}

const TONE_STYLE = {
  good: { color: '#147aa2', fillColor: '#65acce' },
  caution: { color: '#a96b13', fillColor: '#e5b855' },
  danger: { color: '#ad3828', fillColor: '#dc604c' },
}

function patrolStatus(dateString, season) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(dateString)).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  const schedule = PATROL_SEASONS[Number(parts.year)]?.[season]
  if (!schedule) return 'unknown'
  const dateKey = `${parts.month}-${parts.day}`
  const minutes = Number(parts.hour) * 60 + Number(parts.minute)
  return dateKey >= schedule[0] && dateKey <= schedule[1] && minutes >= 600 && minutes < 1080
    ? 'active'
    : 'inactive'
}

function moveSeaward(points, offset = WATERLINE_OFFSET) {
  return points.map(([latitude, longitude]) => [latitude - offset, longitude])
}

function zoneWaterline(zone) {
  return moveSeaward(zone.shoreline)
}

function zonePolygon(zone) {
  const [start, end] = zoneWaterline(zone)
  return [
    start,
    end,
    [end[0] - 0.00042, end[1]],
    [start[0] - 0.00042, start[1]],
  ]
}

function zoneMarker(zone) {
  const [start, end] = zoneWaterline(zone)
  return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
}

function textPopup(title, detail) {
  const wrapper = document.createElement('div')
  const heading = document.createElement('strong')
  const paragraph = document.createElement('p')
  heading.textContent = title
  paragraph.textContent = detail
  wrapper.append(heading, paragraph)
  return wrapper
}

export function CoastSafetyMap({ safety, current, modelPoint, location, t }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [layers, setLayers] = useState({ zones: true, hazards: true, incidents: false })
  const hasDetailedMap = location.hasDetailedMap === true
  const resolvedModelPoint = useMemo(() => (
    [modelPoint?.latitude, modelPoint?.longitude].every(Number.isFinite)
      ? [modelPoint.latitude, modelPoint.longitude]
      : null
  ), [modelPoint])
  const activeStations = useMemo(
    () => hasDetailedMap ? LIFEGUARD_ZONES.filter((zone) => patrolStatus(current.time, zone.season) === 'active').length : 0,
    [current.time, hasDetailedMap],
  )
  const overallTone = safety.level === 'danger' ? 'danger' : safety.level !== 'good' || (hasDetailedMap && activeStations === 0) ? 'caution' : 'good'
  const statusLabel = hasDetailedMap && overallTone === 'good'
    ? t('map.activeZones', { count: activeStations })
    : overallTone === 'danger' ? t('map.notRecommended') : t('map.checkOnSite')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined
    const map = L.map(containerRef.current, {
      minZoom: 10,
      maxZoom: 18,
      scrollWheelZoom: true,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map)
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)
    map.fitBounds(COAST_BOUNDS, { padding: [18, 18] })
    mapRef.current = map
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (hasDetailedMap) {
      const bounds = L.latLngBounds(COAST_BOUNDS.getSouthWest(), COAST_BOUNDS.getNorthEast())
      if (resolvedModelPoint) bounds.extend(resolvedModelPoint)
      map.fitBounds(bounds, { padding: [18, 18] })
    } else if (resolvedModelPoint) {
      map.fitBounds([resolvedModelPoint, [location.latitude, location.longitude]], { padding: [42, 42], maxZoom: 13 })
    } else map.setView([location.latitude, location.longitude], 13)
  }, [hasDetailedMap, location.latitude, location.longitude, resolvedModelPoint])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined
    const overlay = L.layerGroup().addTo(map)

    if (!hasDetailedMap) {
      L.circle([location.latitude, location.longitude], {
        radius: 700,
        color: TONE_STYLE[overallTone].color,
        fillColor: TONE_STYLE[overallTone].fillColor,
        fillOpacity: 0.14,
        weight: 2,
      }).bindPopup(textPopup(location.name, t('map.modelOnly'))).addTo(overlay)
      if (resolvedModelPoint) L.marker(resolvedModelPoint, {
        icon: L.divIcon({ className: 'current-map-marker', html: `<span></span><b>${t('map.modelLabel')}</b>`, iconSize: [110, 28], iconAnchor: [11, 14] }),
        zIndexOffset: 400,
      }).bindTooltip(t('map.modelTooltip')).addTo(overlay)
      return () => overlay.remove()
    }

    if (layers.zones) {
      L.polyline(moveSeaward(COASTLINE), { color: '#bc8428', weight: 3, opacity: 0.75, dashArray: '5 7', lineCap: 'round' })
        .bindPopup(textPopup(t('map.unguardedTitle'), t('map.unguardedDetail')))
        .addTo(overlay)

      LIFEGUARD_ZONES.forEach((zone) => {
        const patrol = patrolStatus(current.time, zone.season)
        const active = patrol === 'active'
        const tone = active ? 'good' : 'caution'
        const style = TONE_STYLE[tone]
        const detail = active ? t('map.patrolActive') : patrol === 'unknown' ? t('map.patrolUnknown') : t('map.patrolInactive')
        if (active) {
          L.polygon(zonePolygon(zone), {
            color: style.color,
            fillColor: style.fillColor,
            fillOpacity: 0.22,
            weight: 1.5,
          })
            .bindTooltip(zone.label, { direction: 'top', sticky: true })
            .bindPopup(textPopup(zone.label, detail))
            .addTo(overlay)
          L.polyline(zoneWaterline(zone), { color: style.color, weight: 7, opacity: 0.94, lineCap: 'round' }).addTo(overlay)
        }
        L.circleMarker(zoneMarker(zone), {
          radius: active ? 5 : 4,
          color: '#ffffff',
          fillColor: style.color,
          fillOpacity: 1,
          weight: 2,
        })
          .bindTooltip(`${zone.label} – ${active ? t('map.activePost') : patrol === 'unknown' ? t('map.unknownPost') : t('map.inactivePost')}`)
          .bindPopup(textPopup(zone.label, detail))
          .addTo(overlay)
      })
    }

    if (layers.hazards) {
      GROYNES.forEach((line, index) => {
        L.polyline(line, { color: '#c33f2c', weight: 4, opacity: 0.82 })
          .bindTooltip(t('map.groyne', { number: index + 1 }))
          .addTo(overlay)
      })

      FIXED_HAZARDS.forEach((hazard) => {
        const label = hazard.labelKey ? t(hazard.labelKey) : hazard.label
        const detail = t(hazard.detailKey)
        L.polyline(hazard.line, { color: '#ad3828', weight: 5, opacity: 0.9 })
          .bindTooltip(label, { direction: 'top', sticky: true })
          .bindPopup(textPopup(label, detail))
          .addTo(overlay)
        L.marker(hazard.center, {
          icon: L.divIcon({ className: 'hazard-map-marker', html: '<span>!</span>', iconSize: [28, 28], iconAnchor: [14, 14] }),
          zIndexOffset: 300,
        })
          .bindTooltip(label, { direction: 'top' })
          .bindPopup(textPopup(label, detail))
          .addTo(overlay)
      })
    }

    if (layers.incidents) {
      INCIDENT_POINTS.forEach((incident) => {
        L.marker(incident.position, {
          icon: L.divIcon({
            className: 'incident-map-marker',
            html: `<span>${incident.value}</span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          }),
        })
          .bindTooltip(t('map.incidentTooltip', { value: incident.value, place: incident.label }))
          .bindPopup(textPopup(incident.label, t('map.incidentDetail', { value: incident.value })))
          .addTo(overlay)
      })
    }

    if (resolvedModelPoint) L.marker(resolvedModelPoint, {
      icon: L.divIcon({ className: 'current-map-marker', html: `<span></span><b>${t('map.modelLabel')}</b>`, iconSize: [110, 28], iconAnchor: [11, 14] }),
      zIndexOffset: 400,
    }).bindTooltip(t('map.modelTooltip')).addTo(overlay)

    return () => overlay.remove()
  }, [current.time, hasDetailedMap, layers, location.latitude, location.longitude, location.name, overallTone, resolvedModelPoint, safety.level, t])

  function toggleLayer(name) {
    setLayers((currentLayers) => ({ ...currentLayers, [name]: !currentLayers[name] }))
  }

  function resetMap() {
    if (hasDetailedMap) {
      const bounds = L.latLngBounds(COAST_BOUNDS.getSouthWest(), COAST_BOUNDS.getNorthEast())
      if (resolvedModelPoint) bounds.extend(resolvedModelPoint)
      mapRef.current?.fitBounds(bounds, { padding: [18, 18] })
    } else if (resolvedModelPoint) {
      mapRef.current?.fitBounds([resolvedModelPoint, [location.latitude, location.longitude]], { padding: [42, 42], maxZoom: 13 })
    } else mapRef.current?.setView([location.latitude, location.longitude], 13)
  }

  return (
    <section className="panel coast-map-panel" aria-labelledby="coast-map-title">
      <div className="section-heading map-heading">
        <div><span className="eyebrow">{hasDetailedMap ? 'Hove Lagoon → Brighton Marina' : `${location.area} · ${location.nation}`}</span><h2 id="coast-map-title">{t('map.title')}</h2></div>
        <button className="map-reset-button" type="button" onClick={resetMap}><LocateFixed size={15} />{t('map.reset')}</button>
      </div>
      <div className="map-status-row">
        <span className={`map-current-status ${overallTone}`}><i />{statusLabel}</span>
        <span>{t(hasDetailedMap ? 'map.statusNote' : 'map.modelStatusNote')}</span>
      </div>
      {hasDetailedMap && (
        <div className="map-layer-controls" aria-label={t('map.layers')}>
          <button className={layers.zones ? 'is-active zones' : ''} type="button" aria-pressed={layers.zones} onClick={() => toggleLayer('zones')}><Flag size={14} />{t('map.zones')}</button>
          <button className={layers.hazards ? 'is-active hazards' : ''} type="button" aria-pressed={layers.hazards} onClick={() => toggleLayer('hazards')}><AlertTriangle size={14} />{t('map.hazards', { count: GROYNES.length })}</button>
          <button className={layers.incidents ? 'is-active incidents' : ''} type="button" aria-pressed={layers.incidents} onClick={() => toggleLayer('incidents')}><MapPin size={14} />{t('map.incidents')}</button>
        </div>
      )}
      <div className="coast-map-frame">
        <div className="coast-map-canvas" ref={containerRef} role="region" aria-label={`${location.name} — ${t('map.title')}`} />
        <div className="map-legend" aria-label={t('map.legend')}>
          <strong>{t('map.legend')}</strong>
          {hasDetailedMap && <span><i className="good" />{t('map.activeZone')}</span>}
          {hasDetailedMap && <span><i className="caution" />{t('map.unguarded')}</span>}
          {hasDetailedMap && <span><i className="danger" />{t('map.physicalHazard')}</span>}
          {resolvedModelPoint && <span><i className="model" />{t('map.modelPoint')}</span>}
          {hasDetailedMap && layers.incidents && <span><i className="incident" />{t('map.incidentShare')}</span>}
        </div>
      </div>
      <div className="map-footnote">
        <Info size={15} />
        <span>{hasDetailedMap ? t('map.footnote', { count: GROYNES.length }) : t('map.modelOnly')}</span>
        {hasDetailedMap && (
          <span className="map-source-links">
            <a href="https://www.brighton-hove.gov.uk/libraries-leisure-and-arts/seafront/lifeguard-posts-map" target="_blank" rel="noreferrer">{t('map.postsSource')} <ArrowUpRight size={14} /></a>
            <a href="https://www.brighton-hove.gov.uk/libraries-leisure-and-arts/seafront/swimming-sea-safety" target="_blank" rel="noreferrer">{t('map.safetySource')} <ArrowUpRight size={14} /></a>
            <a href="https://democracy.brighton-hove.gov.uk/documents/g10706/Public%20reports%20pack%2009th-Mar-2023%2016.00%20Tourism%20Equalities%20Communities%20Culture%20Committee.pdf?T=10" target="_blank" rel="noreferrer">{t('map.incidentSource')} <ArrowUpRight size={14} /></a>
          </span>
        )}
      </div>
    </section>
  )
}
