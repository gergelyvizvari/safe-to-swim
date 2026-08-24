import { OFFICIAL_BATHING_WATERS } from './bathingWaters.generated.js'

export const FEATURED_LOCATIONS = [
  {
    id: 'brighton',
    name: 'Brighton Beach',
    area: 'East Sussex',
    nation: 'England',
    latitude: 50.8159,
    longitude: -0.1287,
    seaBearing: 180,
    hasDetailedMap: true,
    rnliUrl: 'https://rnli.org/find-my-nearest/lifeguarded-beaches/brighton-beach',
  },
  {
    id: 'bournemouth',
    name: 'Bournemouth Beach',
    area: 'Dorset',
    nation: 'England',
    latitude: 50.7158683,
    longitude: -1.8748905,
    seaBearing: 180,
  },
  {
    id: 'fistral',
    name: 'Fistral Beach',
    area: 'Cornwall',
    nation: 'England',
    latitude: 50.4182891,
    longitude: -5.1003122,
    seaBearing: 285,
  },
  {
    id: 'blackpool',
    name: 'Blackpool Beach',
    area: 'Lancashire',
    nation: 'England',
    latitude: 53.8109345,
    longitude: -3.0574227,
    seaBearing: 280,
  },
  {
    id: 'scarborough-south',
    name: 'Scarborough South Bay',
    area: 'North Yorkshire',
    nation: 'England',
    latitude: 54.2787,
    longitude: -0.3942,
    seaBearing: 120,
  },
  {
    id: 'whitley-bay',
    name: 'Whitley Bay',
    area: 'Tyne and Wear',
    nation: 'England',
    latitude: 55.0503922,
    longitude: -1.4482486,
    seaBearing: 90,
  },
  {
    id: 'llandudno-north',
    name: 'Llandudno North Shore',
    area: 'Conwy',
    nation: 'Wales',
    latitude: 53.3259593,
    longitude: -3.8274791,
    seaBearing: 15,
  },
  {
    id: 'tenby-north',
    name: 'Tenby North Beach',
    area: 'Pembrokeshire',
    nation: 'Wales',
    latitude: 51.6758859,
    longitude: -4.7013816,
    seaBearing: 45,
  },
  {
    id: 'st-andrews-west',
    name: 'St Andrews West Sands',
    area: 'Fife',
    nation: 'Scotland',
    latitude: 56.3473407,
    longitude: -2.8050703,
    seaBearing: 45,
  },
  {
    id: 'portobello',
    name: 'Portobello Beach',
    area: 'Edinburgh',
    nation: 'Scotland',
    latitude: 55.9558065,
    longitude: -3.1100734,
    seaBearing: 30,
  },
  {
    id: 'aberdeen',
    name: 'Aberdeen Beach',
    area: 'Aberdeen',
    nation: 'Scotland',
    latitude: 57.1586697,
    longitude: -2.0780436,
    seaBearing: 90,
  },
  {
    id: 'portrush-east',
    name: 'Portrush East Strand',
    area: 'County Antrim',
    nation: 'Northern Ireland',
    latitude: 55.2065203,
    longitude: -6.6133153,
    seaBearing: 15,
  },
]

const INLAND_BATHING_WATER_IDS = new Set([
  'sepa-366986', // Loch Morlich
  'nrw-ukl1302-40550', // Marine Lake, Rhyl
])

export const OFFICIAL_LOCATIONS = OFFICIAL_BATHING_WATERS.map((location) => ({
  ...location,
  marineModelSupported: !INLAND_BATHING_WATER_IDS.has(location.id),
}))

export const COASTAL_LOCATIONS = [...FEATURED_LOCATIONS, ...OFFICIAL_LOCATIONS]

export const DEFAULT_LOCATION = COASTAL_LOCATIONS[0]

export function findCoastalLocation(locationId) {
  return COASTAL_LOCATIONS.find((location) => location.id === locationId) ?? DEFAULT_LOCATION
}

export function findNearestCoastalLocation(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return DEFAULT_LOCATION

  return COASTAL_LOCATIONS.reduce((nearest, location) => (
    distanceToCoastalLocation(latitude, longitude, location) < distanceToCoastalLocation(latitude, longitude, nearest) ? location : nearest
  ), DEFAULT_LOCATION)
}

export function distanceToCoastalLocation(latitude, longitude, location) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !location) return null
  const toRadians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = toRadians(location.latitude - latitude)
  const longitudeDelta = toRadians(location.longitude - longitude)
  const firstLatitude = toRadians(latitude)
  const secondLatitude = toRadians(location.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  return 6371 * angularDistance
}

export function circularDistance(first, second) {
  return Math.abs(((first - second + 540) % 360) - 180)
}

export function isOffshoreWind(windDirection, seaBearing, tolerance = 55) {
  if (!Number.isFinite(windDirection) || !Number.isFinite(seaBearing)) return null
  const offshoreWindSource = (seaBearing + 180) % 360
  return circularDistance(windDirection, offshoreWindSource) <= tolerance
}
