import test from 'node:test'
import assert from 'node:assert/strict'
import { getSafety } from '../src/safety.js'
import { LANGUAGES, makeTranslator } from '../src/i18n.js'
import { lakeDecisionMessages } from '../src/lakeMessages.js'

const now = Date.parse('2026-09-08T18:00:00Z')
const calm = { time: new Date(now).toISOString(), windSpeed: 4, gusts: 8, weatherCode: 0, windDirection: 90 }
const location = { id: 'lake-test', waterType: 'lake', marineModelSupported: false, sources: [
  { targetId: 'storm', type: 'storm', coverage: 'water_body' },
  { targetId: 'basin', type: 'storm', coverage: 'basin' },
  { targetId: 'sample', type: 'quality', coverage: 'site' },
  { targetId: 'wind', type: 'wind', coverage: 'water_body' },
] }
const item = patch => ({ type: 'storm', targetId: 'storm', coverage: 'water_body', status: 'available', staleSeconds: 7200, publishedAt: new Date(now - 60000).toISOString(), checkedAt: new Date(now - 10000).toISOString(), ...patch })
const basins = levels => ['west', 'central', 'east'].map((basin, index) => ({ basin, level: levels[index] }))
const assessment = (patch = {}, items = [], options = {}) => getSafety({ ...calm, ...patch }, location, makeTranslator('en'), 'en-GB', {
  source: 'partial', now, quality: null, observations: { locationId: location.id, items, error: false, loading: false }, ...options,
})

test('calm weather provides a qualified wind assessment, never a green swimming clearance', () => {
  const result = assessment({}, [item({ basins: basins([0, 0, 0]) })])
  assert.equal(result.title, lakeDecisionMessages.en.limited)
  assert.equal(result.level, 'unknown')
  assert.ok(result.known.includes(lakeDecisionMessages.en.lowerWind))
  assert.ok(result.known.includes(lakeDecisionMessages.en.stormClear))
  assert.ok(result.gaps.includes(lakeDecisionMessages.en.localWater))
  assert.match(result.action, /water temperature/)
})

test('weather danger and caution survive incomplete lake data', () => {
  assert.equal(assessment({ gusts: 28, windSpeed: null }).level, 'danger')
  assert.equal(assessment({ gusts: 20 }).level, 'caution')
  assert.equal(assessment({ gusts: null, windSpeed: 22 }).level, 'caution')
  for (const weatherCode of [95, 96, 99]) assert.equal(assessment({ weatherCode }).level, 'danger')
  const missing = assessment({ windSpeed: null, gusts: null, weatherCode: null })
  assert.equal(missing.title, lakeDecisionMessages.en.insufficient)
  assert.ok(missing.gaps.includes(lakeDecisionMessages.en.windMissing))
  assert.ok(missing.gaps.includes(lakeDecisionMessages.en.weatherMissing))
})

test('regional warnings are not silently assigned to the beach; complete coverage is required', () => {
  const regional = assessment({}, [item({ basins: basins([2, 0, 0]) })])
  assert.equal(regional.level, 'caution')
  assert.ok(regional.known.includes(lakeDecisionMessages.en.regionalStorm))
  assert.equal(assessment({}, [item({ basins: basins([2, 2, 2]) })]).level, 'danger')
  assert.equal(assessment({}, [item({ basins: basins([1, 1, 1]) })]).level, 'caution')
  const incomplete = assessment({}, [item({ basins: basins([0, null, 0]) })])
  assert.ok(!incomplete.known.includes(lakeDecisionMessages.en.stormClear))
  assert.ok(incomplete.gaps.includes(lakeDecisionMessages.en.warningsUnknown))
  const duplicate = assessment({}, [item({ basins: [...basins([0, 0, 0]), { basin: 'west', level: 0 }] })])
  assert.ok(!duplicate.known.includes(lakeDecisionMessages.en.stormClear))
})

test('verified basin coverage takes precedence over another basin warning', () => {
  const exact = item({ targetId: 'basin', coverage: 'basin', basins: [{ basin: 'east', level: 0 }] })
  const result = assessment({}, [exact, item({ basins: basins([2, 0, 0]) })])
  assert.equal(result.level, 'unknown')
  assert.ok(result.known.includes(lakeDecisionMessages.en.stormClear))
  assert.equal(assessment({}, [{ ...exact, basins: [{ basin: 'east', level: 2 }] }]).level, 'danger')
})

test('stale, overdue, wrongly assigned and unmatched observations cannot influence the decision', () => {
  for (const patch of [
    { status: 'stale' }, { status: 'unmatched' }, { targetId: 'other-site' },
    { coverage: 'site' }, { publishedAt: null }, { staleSeconds: null },
    { checkedAt: new Date(now - 4 * 60000).toISOString() },
    { publishedAt: new Date(now - 3 * 3600000).toISOString() },
  ]) {
    const result = assessment({}, [item({ basins: basins([2, 2, 2]), ...patch })])
    assert.equal(result.level, 'unknown', JSON.stringify(patch))
    assert.ok(result.gaps.includes(lakeDecisionMessages.en.warningsUnknown))
  }
  assert.equal(assessment({}, [], { observations: { locationId: 'other', items: [item({ basins: basins([2, 2, 2]) })] } }).level, 'unknown')
  assert.equal(assessment({}, [], { observations: { locationId: location.id, error: true, items: [item({ basins: basins([2, 2, 2]) })] } }).level, 'unknown')
})

test('fresh official danger remains actionable even when weather is unavailable', () => {
  assert.equal(assessment({}, [item({ basins: basins([2, 2, 2]) })], { source: 'stale' }).level, 'danger')
  const stale = assessment({ gusts: 35 }, [], { source: 'stale' })
  assert.equal(stale.level, 'unknown')
  assert.ok(stale.gaps.includes(lakeDecisionMessages.en.weatherStale))
})

test('a failed warning refresh is not interpreted as the end of the previous warning', () => {
  const report = item({ basins: basins([2, 2, 2]), status: 'stale' })
  const stale = assessment({}, [report])
  assert.equal(stale.title, lakeDecisionMessages.en.unresolved)
  assert.equal(stale.level, 'unknown')
  assert.ok(stale.known.includes(lakeDecisionMessages.en.previousConcern))
  assert.equal(assessment({}, [], { observations: { locationId: location.id, error: true, items: [report] } }).title, lakeDecisionMessages.en.unresolved)
  assert.equal(assessment({}, [item({ basins: basins([0, 0, 0]) })]).title, lakeDecisionMessages.en.limited)
  const clearedBasin = item({ targetId: 'basin', coverage: 'basin', basins: [{ basin: 'east', level: 0 }] })
  assert.equal(assessment({}, [report, clearedBasin]).title, lakeDecisionMessages.en.limited)
})

test('current warnings and water samples are not treated as future forecasts', () => {
  const items = [item({ basins: basins([2, 2, 2]) }), item({ type: 'quality', targetId: 'sample', coverage: 'site', sample: { result: 'fail' } })]
  assert.equal(assessment({}, items).level, 'danger')
  const future = assessment({}, items, { isNow: false })
  assert.equal(future.level, 'unknown')
  assert.ok(future.gaps.includes(lakeDecisionMessages.en.futureWarnings))
  assert.ok(!future.known.includes(lakeDecisionMessages.en.stormClear))
})

test('annual excellent quality and passing samples do not become current water clearance', () => {
  const quality = { distance: 0, site: { id: location.id, classification: 'Excellent' } }
  const passing = item({ type: 'quality', targetId: 'sample', coverage: 'site', sample: { result: 'pass' } })
  assert.equal(assessment({}, [passing], { quality }).level, 'unknown')
  assert.equal(assessment({}, [{ ...passing, sample: { result: 'fail' } }], { quality }).level, 'danger')
  assert.equal(assessment({}, [], { quality: { ...quality, site: { ...quality.site, classification: 'Closed' } } }).level, 'danger')
  assert.equal(assessment({}, [], { quality: { ...quality, site: { ...quality.site, classification: 'Poor' } } }).level, 'caution')
  assert.equal(assessment({}, [], { quality: { distance: 1, site: { id: 'other', classification: 'Closed' } } }).level, 'unknown')
})

test('strong station wind is identified as station evidence, not a measurement at the beach', () => {
  const result = assessment({}, [item({ type: 'wind', targetId: 'wind', stations: [{ station: 'nearby', gustKmh: 40 }] })])
  assert.equal(result.level, 'caution')
  assert.ok(result.known.includes(lakeDecisionMessages.en.stationWind))
})

test('lake assessment messages are present in every supported language', () => {
  for (const { code } of LANGUAGES) {
    assert.deepEqual(Object.keys(lakeDecisionMessages[code]).sort(), Object.keys(lakeDecisionMessages.en).sort())
    const t = makeTranslator(code)
    for (const key of Object.keys(lakeDecisionMessages.en)) assert.doesNotMatch(t(`lakeDecision.${key}`), /lakeDecision\.|\{\w+\}/)
  }
})
