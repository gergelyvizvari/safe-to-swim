import { shoreWindDirection } from './locationUtils.js'

export function conditionLabels(point, location, timeline) {
  const bearing = Number.isFinite(location.seaBearing) ? location.seaBearing : point.seaBearing
  const direction = shoreWindDirection(point.windDirection, bearing)
  const strength = !Number.isFinite(point.windSpeed) ? 'unknown' : point.windSpeed < 8 ? 'light' : point.windSpeed < 20 ? 'moderate' : 'strong'
  const gusts = !Number.isFinite(point.gusts) ? 'unknown' : point.gusts >= 28 ? 'strongGusts' : point.gusts >= 20 ? 'livelyGusts' : 'mildGusts'
  const index = timeline.findIndex((sample) => sample.time === point.time)
  const adjacent = (a, b) => a && b && Number.isFinite(a.seaLevel) && Number.isFinite(b.seaLevel) && Date.parse(b.time) - Date.parse(a.time) <= 90 * 60000
  const next = timeline[index + 1]
  const previous = timeline[index - 1]
  const delta = adjacent(point, next) ? next.seaLevel - point.seaLevel : adjacent(previous, point) ? point.seaLevel - previous.seaLevel : null
  const tide = delta === null ? 'unknown' : Math.abs(delta) < 0.01 ? 'steady' : delta > 0 ? 'rising' : 'falling'
  let turn = null
  for (let i = Math.max(1, index + 1); i < timeline.length - 1; i++) {
    const [before, sample, after] = timeline.slice(i - 1, i + 2)
    if (!adjacent(before, sample) || !adjacent(sample, after)) break
    const high = sample.seaLevel > before.seaLevel && sample.seaLevel > after.seaLevel
    const low = sample.seaLevel < before.seaLevel && sample.seaLevel < after.seaLevel
    if (high || low) { turn = { time: sample.time, kind: high ? 'high' : 'low' }; break }
  }
  return { direction, strength, gusts, tide, turn }
}
