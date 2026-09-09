import { load } from 'cheerio'
import { HUNGARY_REGIONS } from './hungaryRegions.generated.js'

export const ALERT_SOURCE = 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-hungary'
export const ALERT_WEB = 'https://www.met.hu/idojaras/veszelyjelzes/'
const TTL = 5 * 60 * 1000
export const ALERT_MAX_AGE = 2 * 60 * 60 * 1000
const capCache = new Map()
let feedCache
let pending

function inRing([x, y], ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = ring[i], [c, d] = ring[j]
    const cross = (x - a) * (d - b) - (y - b) * (c - a)
    if (Math.abs(cross) < 1e-10 && x >= Math.min(a,c) && x <= Math.max(a,c) && y >= Math.min(b,d) && y <= Math.max(b,d)) return true
    if ((b > y) !== (d > y) && x < (c - a) * (y - b) / (d - b) + a) inside = !inside
  }
  return inside
}
export function regionForLocation(location) {
  if (location.nation !== 'Hungary' && location.countryCode !== 'HU') return null
  return HUNGARY_REGIONS.find(({ geometry }) => {
    const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
    return polygons.some(rings => inRing([location.longitude, location.latitude], rings[0]) && !rings.slice(1).some(ring => inRing([location.longitude, location.latitude], ring)))
  })?.properties.NUTS_ID ?? null
}
const regionMatches = (code, region) => code === region || code === 'HU10' && ['HU11','HU12'].includes(region)
const xml = source => load(source, { xmlMode: true })
const value = ($, node, tag) => $(node).children().filter((_, child) => child.name?.split(':').at(-1) === tag).first().text().trim()

export function parseAlertFeed(source) {
  const $ = xml(source)
  if (!$('feed').length || !Number.isFinite(Date.parse($('feed > updated').text()))) throw new Error('Invalid warning feed')
  return { updatedAt: $('feed > updated').text(), entries: $('entry').toArray().map(node => ({
    id: value($, node, 'identifier'), status: value($, node, 'status'), messageType: value($, node, 'message_type'), scope: value($, node, 'scope'),
    region: $(node).find('valueName').filter((_, item) => $(item).text() === 'NUTS2').next('value').text(),
    url: $(node).find('link[type="application/cap+xml"]').attr('href'),
  })) }
}
export function parseCap(source, language, region, now = Date.now()) {
  const $ = xml(source), root = $('alert')
  if (!root.length || value($,root,'status') !== 'Actual' || value($,root,'scope') !== 'Public' || !['Alert','Update'].includes(value($,root,'msgType'))) return []
  const infos = root.children('info').toArray()
  const info = infos.find(node => value($,node,'language').split('-')[0] === language.split('-')[0]) ?? infos.find(node => value($,node,'language').startsWith('en')) ?? infos[0]
  if (!info) throw new Error('Missing CAP information')
  const areas = $(info).children('area').toArray().filter(node => $(node).find('valueName').toArray().some(item => $(item).text() === 'NUTS2' && regionMatches($(item).next('value').text(),region)))
  if (!areas.length) return []
  const startsAt = value($,info,'onset') || value($,info,'effective')
  const expiresAt = value($,info,'expires'), issuedAt = value($,root,'sent')
  if (![startsAt,expiresAt,issuedAt].every(date => Number.isFinite(Date.parse(date))) || Date.parse(startsAt) >= Date.parse(expiresAt) || Date.parse(issuedAt) > now + 60000) throw new Error('Invalid CAP times')
  if (Date.parse(expiresAt) <= now) return []
  const parameter = key => $(info).children('parameter').toArray().find(node => value($,node,'valueName') === key)
  const level = Number(value($, parameter('awareness_level'), 'value').split(';')[0])
  if (![2,3,4].includes(level)) return []
  return [{ id: value($,root,'identifier'), level, event: value($,info,'event'), description: value($,info,'description'), instruction: value($,info,'instruction'),
    language: value($,info,'language'), area: areas.map(node => value($,node,'areaDesc')).join(', '), region, startsAt, expiresAt, issuedAt,
    hazard: Number(value($,parameter('awareness_type'),'value').split(';')[0]), sourceUrl: ALERT_WEB }]
}
async function read(url) {
  const parsed = new URL(url)
  if (parsed.origin !== 'https://feeds.meteoalarm.org' || !(parsed.href === ALERT_SOURCE || parsed.pathname.startsWith('/api/v1/warnings/feeds-hungary/'))) throw new Error('Unexpected warning URL')
  const response = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'error' })
  if (!response.ok) throw new Error('Warning source unavailable')
  return response.text()
}
async function feed() {
  if (feedCache && Date.now() - feedCache.checkedAt < TTL) return feedCache
  if (!pending) pending = read(ALERT_SOURCE).then(source => {
    feedCache = { ...parseAlertFeed(source), checkedAt: Date.now() }
    capCache.clear() // Revalidate documents even when providers reuse an URL.
    return feedCache
  }).finally(() => { pending = null })
  return pending
}
export async function getWeatherAlerts(location, language = 'en', now = Date.now()) {
  const region = regionForLocation(location)
  const base = { locationId: location.id, supported: Boolean(region), region, sourceUrl: ALERT_WEB, items: [], checkedAt: null, status: 'unsupported' }
  if (!region) return base
  try {
    const data = await feed()
    const urls = [...new Set(data.entries.filter(entry => regionMatches(entry.region,region) && entry.status === 'Actual' && entry.scope === 'Public' && ['Alert','Update'].includes(entry.messageType)).map(entry => entry.url))]
    if (urls.length > 40) throw new Error('Unexpected warning count')
    const items = []
    for (let i=0; i<urls.length; i+=4) {
      const documents = await Promise.all(urls.slice(i,i+4).map(async url => {
        if (!capCache.has(url)) capCache.set(url, read(url).catch(error => { capCache.delete(url); throw error }))
        return capCache.get(url)
      }))
      items.push(...documents.flatMap(doc => parseCap(doc,language,region,now)))
    }
    const unique = [...new Map(items.map(item => [item.id,item])).values()].sort((a,b) => b.level-a.level || Date.parse(a.startsAt)-Date.parse(b.startsAt))
    const stale = now - Date.parse(data.updatedAt) > ALERT_MAX_AGE || Date.parse(data.updatedAt) > now + 60000
    return { ...base, status: stale ? 'stale' : 'available', updatedAt: data.updatedAt, checkedAt: new Date(data.checkedAt).toISOString(), items: unique }
  } catch { return { ...base, status: 'unavailable' } }
}
