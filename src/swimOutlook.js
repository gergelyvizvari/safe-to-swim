import { weatherWarningDuringInterval } from './weatherAlertMessages.js'
import { getSafety } from './safety.js'

// Three consecutive hourly samples bound a complete two-hour window.
export function findCalmestWindow(forecast, location, { now = Date.now(), source, quality, weatherAlerts } = {}) {
  if (source !== 'live') return null
  const hours = [...new Map(forecast.map((hour) => [hour.time, hour])).values()]
    .filter((hour) => Date.parse(hour.time) >= now)
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time))
  let best = null
  for (let index = 0; index < hours.length - 2; index += 1) {
    const points = hours.slice(index, index + 3)
    if (weatherAlerts?.locationId === location.id && weatherWarningDuringInterval(weatherAlerts, points[0].time, points[2].time, now)) continue
    if (points.some((point, offset) => point.isDay !== true
      || Date.parse(point.time) !== Date.parse(points[0].time) + offset * 3600000
      || getSafety(point, location, (key) => key, 'en-GB', { source, quality, weatherAlerts }).level !== 'good')) continue
    const wave = Math.max(...points.map((point) => point.waveHeight))
    const gusts = Math.max(...points.map((point) => point.gusts))
    const score = wave / 0.6 + gusts / 20
    if (!best || score < best.score) best = { start: points[0], end: points[2], wave, gusts, score }
  }
  return best
}
