import { useCallback, useEffect, useMemo, useState } from 'react'

function buildWeatherUrl(location) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    hourly: 'temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day',
    daily: 'sunrise,sunset',
    wind_speed_unit: 'mph',
    timezone: 'Europe/London',
    forecast_days: '2',
  }).toString()
  return url
}

function buildMarineUrl(location) {
  const url = new URL('https://marine-api.open-meteo.com/v1/marine')
  url.search = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: 'wave_height,wave_direction,wave_period,sea_level_height_msl,sea_surface_temperature,ocean_current_velocity',
    hourly: 'wave_height,wave_direction,wave_period,sea_level_height_msl,sea_surface_temperature,ocean_current_velocity',
    timezone: 'Europe/London',
    forecast_days: '2',
  }).toString()
  return url
}

function fallbackFor(location) {
  const now = Date.now()
  return {
    current: {
      time: new Date(now).toISOString(), temperature: 14, feelsLike: 13, weatherCode: 3,
      windSpeed: 12, windDirection: 240, gusts: 20, waveHeight: 0.7, waveDirection: 220,
      wavePeriod: 6.4, seaTemperature: 15.2, seaLevel: 0.4, currentVelocity: 0.3,
    },
    forecast: Array.from({ length: 8 }, (_, offset) => ({
      time: new Date(now + offset * 3600000).toISOString(),
      waveHeight: Math.max(0.4, 0.7 - offset * 0.04),
      wavePeriod: 6.4,
      gusts: Math.max(14, 20 - offset),
      windSpeed: Math.max(8, 12 - offset * 0.5),
      windDirection: 240,
      weatherCode: 3,
      temperature: 14,
      seaTemperature: 15.2,
      seaLevel: 0.4 + 0.8 * Math.cos(((offset - 2) / 12.4) * Math.PI * 2),
      isDay: true,
    })),
    daylight: {
      sunrise: new Date(new Date(now).setHours(5, 45, 0, 0)).toISOString(),
      sunset: new Date(new Date(now).setHours(20, 15, 0, 0)).toISOString(),
    },
    tides: {
      trend: 'rising',
      events: [
        { offset: 2, type: 'high', height: 1.2 },
        { offset: 8, type: 'low', height: -1.05 },
        { offset: 14, type: 'high', height: 1.35 },
        { offset: 20, type: 'low', height: -0.92 },
      ].map((item) => ({ ...item, time: new Date(now + item.offset * 3600000).toISOString() })),
      series: Array.from({ length: 25 }, (_, offset) => ({
        time: new Date(now + offset * 3600000).toISOString(),
        height: 0.1 + 1.2 * Math.cos(((offset - 2) / 12.4) * Math.PI * 2),
      })),
    },
    source: 'sample',
    locationId: location.id,
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
  const change = nextLevel - currentLevel

  return {
    trend: Math.abs(change) < 0.015 ? 'slack' : change > 0 ? 'rising' : 'falling',
    events: events.slice(0, 4),
    series: times.slice(currentIndex, currentIndex + 25).map((time, offset) => ({
      time,
      height: levels[currentIndex + offset],
    })).filter((point) => Number.isFinite(point.height)),
  }
}

function normalize(weather, marine, location) {
  const weatherIndex = closestIndex(weather.hourly.time)
  const marineIndex = closestIndex(marine.hourly.time)
  const forecast = Array.from({ length: 8 }, (_, offset) => {
    const wi = Math.min(weatherIndex + offset, weather.hourly.time.length - 1)
    const mi = Math.min(marineIndex + offset, marine.hourly.time.length - 1)
    return {
      time: weather.hourly.time[wi],
      waveHeight: marine.hourly.wave_height[mi],
      wavePeriod: marine.hourly.wave_period[mi],
      gusts: weather.hourly.wind_gusts_10m[wi],
      windSpeed: weather.hourly.wind_speed_10m[wi],
      windDirection: weather.hourly.wind_direction_10m[wi],
      weatherCode: weather.hourly.weather_code[wi],
      temperature: weather.hourly.temperature_2m[wi],
      seaTemperature: marine.hourly.sea_surface_temperature[mi],
      seaLevel: marine.hourly.sea_level_height_msl[mi],
      isDay: Boolean(weather.hourly.is_day[wi]),
    }
  })

  return {
    current: {
      time: weather.current.time,
      temperature: weather.current.temperature_2m,
      feelsLike: weather.current.apparent_temperature,
      weatherCode: weather.current.weather_code,
      windSpeed: weather.current.wind_speed_10m,
      windDirection: weather.current.wind_direction_10m,
      gusts: weather.current.wind_gusts_10m,
      waveHeight: marine.current.wave_height,
      waveDirection: marine.current.wave_direction,
      wavePeriod: marine.current.wave_period,
      seaTemperature: marine.current.sea_surface_temperature,
      seaLevel: marine.current.sea_level_height_msl,
      currentVelocity: marine.current.ocean_current_velocity,
    },
    forecast,
    daylight: {
      sunrise: weather.daily.sunrise[0],
      sunset: weather.daily.sunset[0],
    },
    tides: getTideData(marine.hourly.time, marine.hourly.sea_level_height_msl, marineIndex),
    source: 'live',
    locationId: location.id,
  }
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

export function useCoastalConditions(location) {
  const [data, setData] = useState(() => fallbackFor(location))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const locationFallback = useMemo(() => fallbackFor(location), [location])

  const refresh = useCallback(() => {
    setLoading(true)
    setError(false)
    setRefreshKey((key) => key + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      fetchJson(buildWeatherUrl(location), controller.signal),
      fetchJson(buildMarineUrl(location), controller.signal),
    ])
      .then(([weather, marine]) => setData(normalize(weather, marine, location)))
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setData(fallbackFor(location))
          setError(true)
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [location, refreshKey])

  const isCurrentLocation = data.locationId === location.id
  return useMemo(() => ({
    data: isCurrentLocation ? data : locationFallback,
    loading: loading || !isCurrentLocation,
    error: isCurrentLocation ? error : false,
    refresh,
  }), [data, error, isCurrentLocation, loading, locationFallback, refresh])
}
