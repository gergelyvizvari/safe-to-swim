import { QUALITY_SITES } from './balatonQualitySites.js'
import { loadSource } from './balatonSources.js'
import { EUROPEAN_BATHING_WATERS } from '../src/europeanBathingWaters.generated.js'
import { isBalaton } from '../src/balaton.js'

const ids = new Set(EUROPEAN_BATHING_WATERS.filter(isBalaton).map(site => site.id))

export function matchQuality(locationId, sites) {
  const identity = QUALITY_SITES[locationId]
  if (!identity) return null
  const matches = sites.filter(site => site.name === identity.name
    && Math.abs(site.latitude - identity.latitude) < 0.0001
    && Math.abs(site.longitude - identity.longitude) < 0.0001)
  return matches.length === 1 ? matches[0] : null
}

export async function getBalatonData(locationId, loader = loadSource) {
  if (!ids.has(locationId)) return null
  const keys = ['temperature', 'wind', 'storm', 'quality']
  const results = await Promise.allSettled(keys.map(key => loader(key)))
  const output = { locationId, checkedAt: new Date().toISOString() }
  results.forEach((result, index) => {
    const key = keys[index]
    if (result.status === 'rejected') output[key] = { status: 'unavailable' }
    else if (key === 'quality') {
      const { sites, ...meta } = result.value
      const sample = matchQuality(locationId, sites)
      output[key] = { ...meta, status: sample ? 'available' : 'unmatched', sample }
    } else output[key] = { status: 'available', ...result.value }
  })
  return output
}
