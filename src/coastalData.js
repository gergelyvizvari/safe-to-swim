function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null
}

export function buildWeatherUrl(location) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: 'is_day,temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    hourly: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day',
    daily: 'sunrise,sunset',
    wind_speed_unit: 'mph',
    timezone: 'GMT',
    timeformat: 'unixtime',
    forecast_days: '3',
  }).toString()
  return url
}

export function buildMarineUrl(location) {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine')
  url.search = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: 'wave_height,wave_direction,wave_period,sea_level_height_msl,sea_surface_temperature,ocean_current_velocity',
    hourly: 'wave_height,wave_direction,wave_period,sea_level_height_msl,sea_surface_temperature,ocean_current_velocity',
    timezone: 'GMT',
    timeformat: 'unixtime',
    forecast_days: '3',
  }).toString()
  return url
}

export function fallbackFor(location) {
  const now = Date.now()
  const seaBearing = Number.isFinite(location.seaBearing) ? location.seaBearing : null
  return {
    current: {
      time: new Date(now).toISOString(), isDay: null, temperature: null, feelsLike: null, weatherCode: null,
      windSpeed: null, windDirection: null, gusts: null, waveHeight: null, waveDirection: null,
      wavePeriod: null, seaTemperature: null, seaLevel: null, currentVelocity: null, seaBearing,
    },
    forecast: Array.from({ length: 72 }, (_, offset) => ({
      time: new Date(now + offset * 3600000).toISOString(),
      waveHeight: null,
      wavePeriod: null,
      gusts: null,
      windSpeed: null,
      windDirection: null,
      weatherCode: null,
      temperature: null,
      seaTemperature: null,
      seaLevel: null,
      isDay: null,
      seaBearing,
    })),
    daylight: {
      sunrise: null,
      sunset: null,
    },
    tides: {
      trend: 'unknown',
      events: [],
      series: [],
    },
    source: 'unavailable',
    locationId: location.id,
    marineModelPoint: null,
  }
}

function closestIndex(times, target = new Date()) {
  if (!times?.length) return 0
  const targetTime = target.getTime()
  return times.reduce((best, time, index) => (
    Math.abs(new Date(time).getTime() - targetTime) < Math.abs(new Date(times[best]).getTime() - targetTime)
      ? index
      : best
  ), 0)
}

function toIsoTime(value) {
  if (value == null) return null
  const milliseconds = typeof value === 'number' ? value * 1000 : new Date(value).getTime()
  return new Date(milliseconds).toISOString()
}

function getTideData(times, levels, currentIndex) {
  const events = []

  for (let index = Math.max(1, currentIndex); index < times.length - 1; index += 1) {
    const previous = levels[index - 1]
    const current = levels[index]
    const next = levels[index + 1]
    if (![previous, current, next].every(Number.isFinite)) continue

    let type = null
    if (current >= previous && current > next) type = 'high'
    if (current <= previous && current < next) type = 'low'
    if (!type) continue

    const event = { type, time: times[index], height: current }
    const lastEvent = events.at(-1)
    if (lastEvent?.type === type) {
      const isMoreExtreme = type === 'high' ? current > lastEvent.height : current < lastEvent.height
      if (isMoreExtreme) events[events.length - 1] = event
    } else {
      events.push(event)
    }
  }

  const currentLevel = levels[currentIndex]
  const nextLevel = levels[Math.min(currentIndex + 1, levels.length - 1)]
  const change = Number.isFinite(currentLevel) && Number.isFinite(nextLevel) ? nextLevel - currentLevel : null

  return {
    trend: change === null ? 'unknown' : Math.abs(change) < 0.015 ? 'slack' : change > 0 ? 'rising' : 'falling',
    events: events.slice(0, 6),
    series: times.slice(currentIndex, currentIndex + 73).map((time, offset) => ({
      time,
      height: levels[currentIndex + offset],
    })).filter((point) => Number.isFinite(point.height)),
  }
}

export function normalize(weather, marine, location) {
  const complete = Boolean(weather && marine)
  const timeline = weather?.hourly.time ?? marine?.hourly.time
  if (!timeline?.length) return fallbackFor(location)
  weather ??= { hourly: { time: timeline }, current: {}, daily: {} }
  marine ??= { hourly: { time: timeline }, current: {} }
  const currentTime = toIsoTime(weather.current.time ?? marine.current.time) ?? new Date().toISOString()
  const weatherTimes = weather.hourly.time.map(toIsoTime)
  const daylightIndex = closestIndex(weatherTimes, new Date(currentTime))
  const nearbyDay = Math.abs(Date.parse(weatherTimes[daylightIndex]) - Date.parse(currentTime)) <= 3600000 ? weather.hourly.is_day?.[daylightIndex] : null
  const currentDay = weather.current.is_day ?? nearbyDay
  const marineTimes = marine.hourly.time.map(toIsoTime)
  const marineModelPoint = [marine.latitude, marine.longitude].every(Number.isFinite)
    ? { latitude: marine.latitude, longitude: marine.longitude }
    : null
  const marineModelSupported = location.marineModelSupported !== false
  const seaBearing = Number.isFinite(location.seaBearing) ? location.seaBearing : null
  const weatherIndex = closestIndex(weatherTimes)
  const marineIndex = closestIndex(marineTimes)
  const forecastLength = Math.min(
    72,
    weather.hourly.time.length - weatherIndex,
  )
  const forecast = Array.from({ length: forecastLength }, (_, offset) => {
    const wi = Math.min(weatherIndex + offset, weather.hourly.time.length - 1)
    const mi = marineTimes.indexOf(weatherTimes[wi])
    return {
      time: weatherTimes[wi],
      waveHeight: marineModelSupported ? finiteOrNull(marine.hourly.wave_height?.[mi]) : null,
      wavePeriod: marineModelSupported ? finiteOrNull(marine.hourly.wave_period?.[mi]) : null,
      gusts: finiteOrNull(weather.hourly.wind_gusts_10m?.[wi]),
      windSpeed: finiteOrNull(weather.hourly.wind_speed_10m?.[wi]),
      windDirection: finiteOrNull(weather.hourly.wind_direction_10m?.[wi]),
      weatherCode: finiteOrNull(weather.hourly.weather_code?.[wi]),
      temperature: finiteOrNull(weather.hourly.temperature_2m?.[wi]),
      seaTemperature: marineModelSupported ? finiteOrNull(marine.hourly.sea_surface_temperature?.[mi]) : null,
      seaLevel: marineModelSupported ? finiteOrNull(marine.hourly.sea_level_height_msl?.[mi]) : null,
      isDay: Number.isFinite(weather.hourly.is_day?.[wi]) ? weather.hourly.is_day[wi] === 1 : null,
      seaBearing,
    }
  })

  return {
    current: {
      time: currentTime,
      isDay: currentDay === 1 ? true : currentDay === 0 ? false : null,
      temperature: finiteOrNull(weather.current.temperature_2m),
      feelsLike: finiteOrNull(weather.current.apparent_temperature),
      weatherCode: finiteOrNull(weather.current.weather_code),
      windSpeed: finiteOrNull(weather.current.wind_speed_10m),
      windDirection: finiteOrNull(weather.current.wind_direction_10m),
      gusts: finiteOrNull(weather.current.wind_gusts_10m),
      waveHeight: marineModelSupported ? finiteOrNull(marine.current.wave_height) : null,
      waveDirection: marineModelSupported ? finiteOrNull(marine.current.wave_direction) : null,
      wavePeriod: marineModelSupported ? finiteOrNull(marine.current.wave_period) : null,
      seaTemperature: marineModelSupported ? finiteOrNull(marine.current.sea_surface_temperature) : null,
      seaLevel: marineModelSupported ? finiteOrNull(marine.current.sea_level_height_msl) : null,
      currentVelocity: marineModelSupported ? finiteOrNull(marine.current.ocean_current_velocity) : null,
      seaBearing,
    },
    forecast,
    daylight: {
      sunrise: toIsoTime(weather.daily?.sunrise?.[0]),
      sunset: toIsoTime(weather.daily?.sunset?.[0]),
    },
    tides: marineModelSupported
      ? getTideData(marineTimes, marine.hourly.sea_level_height_msl ?? [], marineIndex)
      : { trend: 'unknown', events: [], series: [] },
    source: complete && marineModelSupported && Number.isFinite(marine.current?.wave_height) ? 'live' : 'partial',
    fetchedAt: Date.now(),
    marineTime: toIsoTime(marine.current.time),
    locationId: location.id,
    marineModelPoint: marineModelSupported ? marineModelPoint : null,
  }
}

export async function fetchJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  const data = await response.json()
  if (!data.current || !Array.isArray(data.hourly?.time) || !data.hourly.time.length) throw new Error('Incomplete API response')
  return data
}


export function retainAfterFailure(previous, location) {
  return previous.locationId === location.id && previous.fetchedAt
    ? { ...previous, source: 'stale' }
    : fallbackFor(location)
}

export function isDataStale(data, now) {
  return Boolean(data.fetchedAt && now - data.fetchedAt > 15 * 60 * 1000)
    || (data.source === 'live' && [data.current.time, data.marineTime].some((time) => time && now - Date.parse(time) > 3 * 3600000))
}
