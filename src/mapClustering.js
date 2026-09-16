// Group in world pixels, never viewport pixels: panning must not change membership.
export function clusterMapLocations(map, locations, expandedLocationIds = []) {
  const zoom = map.getZoom()
  if (zoom >= map.getMaxZoom()) return locations.map(location => [location])
  const expandedIds = new Set(expandedLocationIds)
  const cellSize = zoom <= 6 ? 68 : zoom <= 8 ? 58 : 48
  const groups = new Map()
  for (const location of locations) {
    const point = map.project([location.latitude, location.longitude], zoom)
    const key = expandedIds.has(location.id) ? `expanded:${location.id}`
      : `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`
    const group = groups.get(key) ?? []
    group.push(location)
    groups.set(key, group)
  }
  return [...groups.values()]
}

export function visibleMapClusters(map, groups) {
  const bounds = map.getBounds().pad(0.18)
  // Cull only after grouping, so even edge clusters retain their full counts.
  return groups.filter(group => group.some(location => bounds.contains([location.latitude, location.longitude])))
}
