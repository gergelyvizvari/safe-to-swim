import { useEffect, useState } from 'react'
import { catalogueRequest } from './catalogueClient.js'

export function useCatalogue(params) {
  const key = new URLSearchParams(params).toString()
  const [state, setState] = useState({ key: '', items: [], total: 0, nations: [], error: false })
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      catalogueRequest(new URLSearchParams(key), controller.signal)
        .then(data => setState({ ...data, key, error: false }))
        .catch(() => { if (!controller.signal.aborted) setState({ key, items: [], total: 0, nations: [], error: true }) })
    }, 180)
    return () => { clearTimeout(timer); controller.abort() }
  }, [key])
  return state.key === key ? { ...state, loading: false } : { items: [], total: 0, nations: state.nations, error: false, loading: true }
}
