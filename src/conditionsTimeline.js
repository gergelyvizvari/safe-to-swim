export function buildConditionsTimeline(current, forecast) {
  const unique = new Map(forecast.filter((point) => Date.parse(point.time) >= Date.parse(current.time)).map((point) => [Date.parse(point.time), point]))
  unique.set(Date.parse(current.time), { ...current })
  return [...unique.values()].sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
}

// Fixed-duration windows continue across midnight and keep their hourly scale.
export function conditionsWindow(timeline, selectedTime) {
  const duration = 12 * 3600000
  const first = Date.parse(timeline[0].time)
  const last = Date.parse(timeline.at(-1).time)
  const selected = Math.max(first, Math.min(last, Date.parse(selectedTime)))
  const blockStart = first + Math.floor((selected - first) / duration) * duration
  const start = Math.min(blockStart, Math.max(first, last - duration))
  const end = start + duration
  const points = timeline.filter((point) => Date.parse(point.time) >= start && Date.parse(point.time) <= end)
  const plotPoints = [...points]
  for (const boundary of [start, end]) {
    if (points.some((point) => Date.parse(point.time) === boundary)) continue
    const afterIndex = timeline.findIndex((point) => Date.parse(point.time) > boundary)
    const before = timeline[afterIndex - 1]
    const after = timeline[afterIndex]
    if (!before || !after) continue
    const gap = Date.parse(after.time) - Date.parse(before.time)
    if (gap > 90 * 60000) continue
    const fraction = (boundary - Date.parse(before.time)) / gap
    const point = { time: new Date(boundary).toISOString(), isDay: before.isDay }
    for (const key of ['temperature', 'seaTemperature', 'seaLevel', 'windSpeed', 'gusts']) {
      point[key] = Number.isFinite(before[key]) && Number.isFinite(after[key]) ? before[key] + (after[key] - before[key]) * fraction : null
    }
    plotPoints.push(point)
  }
  plotPoints.sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
  return { start, end, points, plotPoints }
}

// Missing samples and time gaps remain gaps in the drawing.
export function metricSegments(points, key) {
  const segments = []
  let segment = []
  for (const point of points) {
    if (!Number.isFinite(point[key])) {
      if (segment.length) segments.push(segment)
      segment = []
      continue
    }
    if (segment.length && Date.parse(point.time) - Date.parse(segment.at(-1).time) > 90 * 60000) {
      segments.push(segment)
      segment = []
    }
    segment.push(point)
  }
  if (segment.length) segments.push(segment)
  return segments
}
