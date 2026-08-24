import { COASTAL_LOCATIONS } from './coastalLocations.js'

function distanceInKilometres(first, second) {
  const radius = 6371
  const toRadians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = toRadians(second.latitude - first.latitude)
  const longitudeDelta = toRadians(second.longitude - first.longitude)
  const firstLatitude = toRadians(first.latitude)
  const secondLatitude = toRadians(second.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

export function getWaterQualityForLocation(location) {
  if (location.source) return { site: location, distance: 0 }
  const officialSites = COASTAL_LOCATIONS.filter((site) => site.source)
  const nearest = officialSites.reduce((best, site) => {
    const distance = distanceInKilometres(location, site)
    return !best || distance < best.distance ? { site, distance } : best
  }, null)
  return nearest?.distance <= 20 ? nearest : null
}

export function classificationTone(classification) {
  if (classification === 'Poor') return 'poor'
  if (classification === 'Sufficient') return 'sufficient'
  if (classification === 'Good') return 'good'
  if (classification === 'Excellent') return 'excellent'
  return 'unclassified'
}
