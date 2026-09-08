import { useCallback, useEffect, useMemo, useState } from 'react'

import { buildWeatherUrl, buildMarineUrl, fetchJson, fallbackFor, normalize, retainAfterFailure, isDataStale } from './coastalData.js'

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function useCoastalConditions(location) {
  const [data, setData] = useState(() => fallbackFor(location))
  const [clock, setClock] = useState(() => Date.now())
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
    let cancelled = false
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15000)
    const weatherTarget = location.sources?.find(source => source.type === 'weather' && source.adapter === 'open_meteo_weather')
    const marineTarget = location.sources?.find(source => source.type === 'marine' && source.adapter === 'open_meteo_marine')
    const modelPoint = target => Number.isFinite(target?.latitude) && Number.isFinite(target?.longitude) ? target : location
    Promise.allSettled([
      location.sources && !weatherTarget ? Promise.resolve(null) : fetchJson(buildWeatherUrl(modelPoint(weatherTarget)), controller.signal),
      location.marineModelSupported === false || location.sources && !marineTarget ? Promise.resolve(null) : fetchJson(buildMarineUrl(modelPoint(marineTarget)), controller.signal),
    ]).then(([weather, marine]) => {
      if (cancelled) return
      const weatherData = weather.status === 'fulfilled' ? weather.value : null
      const marineData = marine.status === 'fulfilled' ? marine.value : null
      if (!weatherData && !marineData) {
        setData((previous) => retainAfterFailure(previous, location))
        setError(true)
      } else {
        setData(normalize(weatherData, marineData, location))
        setError(weather.status === 'rejected' || marine.status === 'rejected')
      }
    }).catch(() => {
      if (!cancelled) {
        setData((previous) => retainAfterFailure(previous, location))
        setError(true)
      }
    }).finally(() => {
      window.clearTimeout(timeout)
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true; window.clearTimeout(timeout); controller.abort() }
  }, [location, refreshKey])

  useEffect(() => {
    const ticker = window.setInterval(() => setClock(Date.now()), 60000)
    const interval = window.setInterval(refresh, AUTO_REFRESH_INTERVAL_MS)
    return () => { window.clearInterval(interval); window.clearInterval(ticker) }
  }, [refresh])

  const isCurrentLocation = data.locationId === location.id
  return useMemo(() => ({
    data: isCurrentLocation ? (isDataStale(data, clock) ? { ...data, source: 'stale' } : data) : locationFallback,
    loading: loading || !isCurrentLocation,
    error: isCurrentLocation ? error : false,
    refresh,
  }), [clock, data, error, isCurrentLocation, loading, locationFallback, refresh])
}
