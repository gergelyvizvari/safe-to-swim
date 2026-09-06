import test from 'node:test'
import assert from 'node:assert/strict'
import { buildConditionsTimeline, conditionsWindow, metricSegments } from '../src/conditionsTimeline.js'
const hour = (h, temperature) => ({ time: `2026-09-06T${String(h).padStart(2, '0')}:00:00Z`, temperature, isDay: true })
test('timeline excludes past, sorts hours and preserves current reading on duplicate timestamps', () => {
  const result = buildConditionsTimeline(hour(12, 20), [hour(14, 22), hour(11, 19), hour(12, 18), hour(13, 21)])
  assert.deepEqual(result.map((p) => p.temperature), [20, 21, 22])
})
test('missing values and missing hours split a curve into separate segments', () => {
  const result = metricSegments([hour(12, 20), hour(13, null), hour(14, 22), hour(17, 19)], 'temperature')
  assert.deepEqual(result.map((segment) => segment.length), [1, 1, 1])
  assert.deepEqual(metricSegments([hour(12, null)], 'temperature'), [])
})

test('12-hour windows cross midnight and keep their duration at the forecast end', () => {
  const start = Date.parse('2026-09-06T16:00:00Z')
  const timeline = Array.from({ length: 49 }, (_, i) => ({ time: new Date(start + i * 3600000).toISOString() }))
  const initial = conditionsWindow(timeline, timeline[0].time)
  assert.equal(initial.end - initial.start, 12 * 3600000)
  assert.equal(initial.points.length, 13)
  assert.equal(initial.points.at(-1).time, '2026-09-07T04:00:00.000Z')
  assert.equal(conditionsWindow(timeline, timeline[8].time).start, initial.start)
  for (const selected of timeline) {
    const window = conditionsWindow(timeline, selected.time)
    assert.equal(window.end - window.start, 12 * 3600000)
    assert.ok(window.points.includes(selected))
    assert.ok(window.end <= Date.parse(timeline.at(-1).time))
  }
})

test('short forecasts retain the 12-hour scale without adding samples', () => {
  const timeline = [hour(12, 20), hour(13, 21)]
  const window = conditionsWindow(timeline, timeline[1].time)
  assert.equal(window.end - window.start, 12 * 3600000)
  assert.deepEqual(window.points, timeline)
})

test('partial-hour boundaries interpolate only available neighbouring model samples', () => {
  const start = Date.parse('2026-09-06T16:45:00Z')
  const timeline = [{ time: new Date(start).toISOString(), seaLevel: 0 }, ...Array.from({ length: 15 }, (_, i) => ({ time: new Date(start + (15 + i * 60) * 60000).toISOString(), seaLevel: i }))]
  const window = conditionsWindow(timeline, timeline[0].time)
  assert.equal(Date.parse(window.plotPoints.at(-1).time), window.end)
  assert.equal(window.plotPoints.at(-1).seaLevel, 11.75)
  assert.ok(!window.points.includes(window.plotPoints.at(-1)))
  timeline[13].seaLevel = null
  assert.equal(conditionsWindow(timeline, timeline[0].time).plotPoints.at(-1).seaLevel, null)
})

test('chart preserves the same current daylight value used by the hero', () => {
  const current = { ...hour(12, 20), isDay: false }
  const points = buildConditionsTimeline(current, [hour(12, 20), hour(13, 21)])
  assert.equal(points[0].isDay, false)
  assert.equal(points[1].isDay, true)
})
