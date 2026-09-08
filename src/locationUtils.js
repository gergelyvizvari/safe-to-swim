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

export function shoreWindDirection(windDirection, seaBearing) {
  const offshore = isOffshoreWind(windDirection, seaBearing)
  return offshore === null ? 'unknownDirection' : offshore ? 'offshore'
    : circularDistance(windDirection, seaBearing) <= 55 ? 'onshore' : 'alongshore'
}
