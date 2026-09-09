import { locationSearchScore, normalizeSearch } from './locationSearch.js'
// A compact map index is loaded once; moving the map never makes a catalogue request.
let pending
export function loadMapCatalogue() {
  if (!pending) pending = fetch('/api/catalogue?map=true', { signal: AbortSignal.timeout(60000) })
    .then(response => { if (!response.ok) throw new Error('Catalogue unavailable'); return response.json() })
    .catch(error => { pending = null; throw error })
  return pending
}
export const normalizeMapSearch = normalizeSearch
export function filterMapLocations(items, query, country, kind) {
  return items.filter(item => (!country || item.nation === country)
    && (kind === 'all' || (item.waterType ?? 'coastal') === kind)
    && Number.isFinite(locationSearchScore(item, query)))
}
