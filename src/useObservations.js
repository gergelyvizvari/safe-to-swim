import { useCallback, useEffect, useState } from 'react'

export function useObservations(location) {
  const enabled = location.sources?.some(source => ['temperature', 'wind', 'storm', 'quality', 'windForecast', 'waveForecast'].includes(source.type)) ?? false
  const [state, setState] = useState({ locationId: location.id, items: [], loading: enabled, error: false })
  const [refreshKey, setRefreshKey] = useState(0)
  const [now, setNow] = useState(Date.now)
  const refresh = useCallback(() => {
    setNow(Date.now())
    setState(previous => ({ ...previous, loading: true }))
    setRefreshKey(value => value + 1)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    let active = true
    fetch(`/api/observations?location=${encodeURIComponent(location.id)}`, { signal: controller.signal, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json() })
      .then(data => {
        if (data.locationId !== location.id || !Array.isArray(data.items)) throw new Error('Invalid observations')
        if (active) setState({ locationId: location.id, items: data.items, loading: false, error: false })
      })
      .catch(() => {
        if (active) setState(previous => ({ locationId: location.id, items: previous.locationId === location.id ? previous.items : [], loading: false, error: true }))
      })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [location.id, enabled, refreshKey])

  useEffect(() => {
    if (!enabled) return
    const interval = setInterval(() => { setNow(Date.now()); setRefreshKey(value => value + 1) }, 60000)
    return () => clearInterval(interval)
  }, [enabled])

  return {
    ...(enabled && state.locationId === location.id ? state : { locationId: location.id, items: [], loading: enabled, error: false }),
    now, refresh, enabled,
  }
}
