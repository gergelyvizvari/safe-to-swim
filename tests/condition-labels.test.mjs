import test from 'node:test'
import assert from 'node:assert/strict'
import { conditionLabels } from '../src/conditionLabels.js'
const location = { seaBearing: 180 }
const points = [0, 1, 2, 1].map((seaLevel, i) => ({ time: new Date(Date.UTC(2026, 8, 6, 12 + i)).toISOString(), seaLevel, windSpeed: 7.4, gusts: 15.2, windDirection: 180 }))
test('plain labels distinguish shore direction and identify the next model turning point', () => {
  const labels = conditionLabels(points[0], location, points)
  assert.equal(labels.strength, 'light')
  assert.equal(labels.direction, 'onshore')
  assert.equal(labels.tide, 'rising')
  assert.deepEqual(labels.turn, { time: points[2].time, kind: 'high' })
  assert.equal(conditionLabels({ ...points[0], windDirection: 0 }, location, points).direction, 'offshore')
  assert.equal(conditionLabels({ ...points[0], windDirection: 90 }, location, points).direction, 'alongshore')
})
test('missing samples and long gaps do not become confident tide predictions', () => {
  const missing = points.map((point, i) => i === 1 ? { ...point, seaLevel: null } : point)
  assert.equal(conditionLabels(missing[0], location, missing).tide, 'unknown')
  assert.equal(conditionLabels(missing[0], location, missing).turn, null)
  assert.equal(conditionLabels(points[0], location, [points[0], points[3]]).tide, 'unknown')
  assert.equal(conditionLabels({ ...points[0], windDirection: null }, location, points).direction, 'unknownDirection')
})
