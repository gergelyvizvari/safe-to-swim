import test from 'node:test'
import assert from 'node:assert/strict'
import { clusterMapLocations, visibleMapClusters } from '../src/mapClustering.js'

const locations = [
  { id: 'a', latitude: 10, longitude: 10 },
  { id: 'b', latitude: 20, longitude: 20 },
  { id: 'c', latitude: 30, longitude: 90 },
]
function mapAt(left, zoom = 5) {
  return {
    getZoom: () => zoom,
    getMaxZoom: () => 15,
    project: ([lat, lon]) => ({ x: lon, y: lat }),
    getBounds: () => ({ pad: () => ({ contains: ([, lon]) => lon >= left && lon <= left + 70 }) }),
  }
}
test('panning preserves cluster membership and full counts at viewport edges', () => {
  const first = mapAt(0)
  const moved = mapAt(15)
  const before = clusterMapLocations(first, locations)
  const after = clusterMapLocations(moved, locations)
  assert.deepEqual(after, before)
  assert.deepEqual(visibleMapClusters(first, before).map(g => g.map(l => l.id)), [['a', 'b']])
  assert.deepEqual(visibleMapClusters(moved, after).map(g => g.map(l => l.id)), [['a', 'b']])
})
test('filters, expanded sites and maximum zoom keep every site exactly once', () => {
  assert.deepEqual(clusterMapLocations(mapAt(0), locations.slice(1)).flat().map(l => l.id).sort(), ['b', 'c'])
  assert.equal(clusterMapLocations(mapAt(0), locations, ['a']).length, 3)
  assert.equal(clusterMapLocations(mapAt(0, 15), locations).length, 3)
})
