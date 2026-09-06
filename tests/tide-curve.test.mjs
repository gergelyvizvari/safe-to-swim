import test from 'node:test'
import assert from 'node:assert/strict'
import { smoothTidePath } from '../src/tideCurvePath.js'

test('smooth curve passes through samples and control points stay within each segment range', () => {
  const points = [{ x: 0, y: 2 }, { x: 1, y: 5 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 8, y: 9 }]
  const path = smoothTidePath(points)
  assert.ok(path.startsWith('M0,2'))
  const segments = path.split(' C').slice(1)
  assert.equal(segments.length, points.length - 1)
  segments.forEach((segment, index) => {
    const values = segment.split(/[ ,]/).map(Number)
    const previous = points[index]
    const next = points[index + 1]
    assert.deepEqual(values.slice(-2), [next.x, next.y])
    for (const y of [values[1], values[3]]) assert.ok(y >= Math.min(previous.y, next.y) && y <= Math.max(previous.y, next.y))
  })
})
test('empty, single point and flat curves remain valid', () => {
  assert.equal(smoothTidePath([]), '')
  assert.equal(smoothTidePath([{ x: 1, y: 2 }]), 'M1,2')
  assert.equal(smoothTidePath([{ x: 0, y: 2 }, { x: 3, y: 2 }]), 'M0,2 C1,2 2,2 3,2')
})
