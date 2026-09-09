import { useEffect, useState } from 'react'
export function useWeatherAlerts(location, language) {
  const enabled = location.nation === 'Hungary' || location.countryCode === 'HU'
  const key = `${location.id}:${language}`
  const [state, setState] = useState({key:'',items:[],status:'unavailable'})
  useEffect(() => {
    if (!enabled) return
    let alive = true
    let controller
    const refresh = () => {
      controller?.abort()
      controller = new AbortController()
      fetch(`/api/weather-alerts?${new URLSearchParams({location:location.id,language})}`, {signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])})
        .then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json() })
        .then(data => { if (alive && data.locationId === location.id) setState({...data,key}) })
        .catch(() => { if (alive) setState({key,items:[],status:'unavailable'}) })
    }
    refresh()
    const interval = setInterval(refresh,5*60000)
    return () => { alive = false; controller?.abort(); clearInterval(interval) }
  }, [enabled,location.id,language,key])
  return !enabled ? {supported:false,items:[],status:'unsupported'} : state.key === key ? {...state,loading:false} : {supported:true,items:[],loading:true}
}
