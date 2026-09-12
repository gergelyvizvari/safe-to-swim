import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { estimateSeaBearing, normalizeBearing } from './lib/shore-orientation.mjs'
const dataset = JSON.parse(await readFile(new URL('../public/data/shore-orientations.json', import.meta.url)))

for (const site of dataset.locations) {
  const provenance = site.shoreOrientation
  const snapshot = JSON.parse(await readFile(new URL(`../data/shorelines/${provenance.snapshotFile}`, import.meta.url)))
  for (const version of provenance.wayVersions) assert.equal(snapshot.elements.find(w => w.id === version.id)?.version, version.version)
  let bearing
  if (provenance.reviewedVertexIndices || provenance.reviewedVertices) {
    const way = snapshot.elements.find(w => w.id === provenance.wayIds[0])
    const [a, b] = provenance.reviewedVertices ? provenance.reviewedVertices.map(v => snapshot.elements.find(w => w.id === v.wayId).geometry[v.index]) : provenance.reviewedVertexIndices.map(i => way.geometry[i])
    const sx = 111320 * Math.cos(site.latitude * Math.PI / 180)
    const dx = (b.lon - a.lon) * sx, dy = (b.lat - a.lat) * 111320
    bearing = normalizeBearing(Math.round(Math.atan2(dx, dy) * 180 / Math.PI + 90))
    if (provenance.waterSideCheck) assert.ok(((site.longitude - (a.lon + b.lon) / 2) * sx * dy - (site.latitude - (a.lat + b.lat) / 2) * 111320 * dx) > 0, 'Sampling point must be on the water side')
  } else {
    const result = estimateSeaBearing({ ...site, waterType: 'coastal' }, snapshot.elements)
    bearing = result.seaBearing
    const p = result.shorePoint, angle = bearing * Math.PI / 180
    const offset = ((site.latitude - p.latitude) * Math.cos(angle) + (site.longitude - p.longitude) * Math.cos(site.latitude * Math.PI / 180) * Math.sin(angle)) * 111320
    assert.ok(Math.abs(offset) <= 150, 'Catalogue point must be on the reviewed local shore')
    if (offset < 0) assert.match(provenance.reviewNote, /landward/, 'Landward offsets need explicit review')
  }
  assert.equal(bearing, site.seaBearing, site.locationId)
}
console.log(`Reproduced ${dataset.locations.length} shoreline bearings against versioned directed coastlines.`)
