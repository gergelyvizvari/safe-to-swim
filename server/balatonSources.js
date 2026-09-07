import { load } from 'cheerio'
import { BALATON_SOURCES } from '../src/balaton.js'

const clean = (value) => value.replace(/\s+/g, ' ').trim()
const numeric = (value, min, max) => {
  if (!/^-?\d+(?:[.,]\d+)?$/.test(value.trim())) return null
  const number = Number(value.replace(',', '.'))
  return Number.isFinite(number) && number >= min && number <= max ? number : null
}

function checkedDate(year, month, day) {
  const value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null
}

// The mobile page labels publication time in Hungarian local time, without an offset.
// Resolve Europe/Budapest explicitly, including DST, independently of the server zone.
export function budapestTime(year, month, day, hour, minute) {
  const dayString = checkedDate(year, month, day)
  if (!dayString || Number(hour) > 23 || Number(minute) > 59) return null
  const wall = Date.parse(`${dayString}T${hour}:${minute}:00Z`)
  for (const offset of [1, 2]) {
    const candidate = new Date(wall - offset * 3600000)
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(candidate)
    if (parts === `${hour}:${minute}`) return candidate.toISOString()
  }
  return null
}

function metTimestamp($) {
  const tooltip = $('.idfriss').attr('onmouseover') ?? ''
  const match = tooltip.match(/(\d{4})-(\d{2})-(\d{2})\s+\d{1,2}\s+(\d{2}):(\d{2}) UTC/)
  if (!match) throw new Error('Missing HungaroMet timestamp')
  const [, y, m, d, h, min] = match
  if (!checkedDate(y, m, d) || Number(h) > 23 || Number(min) > 59) throw new Error('Invalid timestamp')
  return `${y}-${m}-${d}T${h}:${min}:00Z`
}

export function parseTemperature(html) {
  const $ = load(html)
  const heading = $('h1').filter((_, el) => clean($(el).text()) === 'Balaton')
  const stations = []
  heading.next('ul').find('tr').each((_, row) => {
    const cells = $(row).find('td')
    const station = clean(cells.eq(0).text())
    if (['Siófok', 'Balatonakali', 'Tihanyrév'].includes(station)) {
      stations.push({ station, temperature: numeric(clean(cells.eq(1).text()).replace(/\s*°C$/, ''), 0, 40) })
    }
  })
  const stamp = $('.idopont').text().match(/(\d{4})\.(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/)
  const publishedAt = stamp ? budapestTime(...stamp.slice(1)) : null
  if (!stations.length || !publishedAt) throw new Error('Unrecognised temperature page')
  return { publishedAt, stations }
}

export function parseStorm(html) {
  const $ = load(html)
  const basins = []
  const names = ['Nyugati medence', 'Középső medence', 'Keleti medence']
  const keys = ['west', 'central', 'east']
  const headers = $('.irGa-tbl th').map((_, el) => clean($(el).text())).get()
  if (headers.join('|') !== names.join('|')) throw new Error('Unknown storm basins')
  $('.irGa-tbl td').each((index, el) => {
    const icon = $(el).find('img').attr('src') ?? ''
    const match = icon.match(/\/viharjelzes([012])\.png$/)
    basins.push({ basin: keys[index], level: match ? Number(match[1]) : null })
  })
  if (basins.length !== 3) throw new Error('Incomplete storm page')
  return { publishedAt: metTimestamp($), basins }
}

export function parseWind(html) {
  const $ = load(html)
  const stations = []
  $('tr').each((_, row) => {
    const station = clean($(row).find('th a').text())
    if (station && $(row).find('td.Wfi').length === 2) {
      const cells = $(row).find('td.Wfi')
      stations.push({ station, gustKmh: numeric(clean(cells.eq(0).text()), 0, 250), windKmh: numeric(clean(cells.eq(1).text()), 0, 250) })
    }
  })
  if (!stations.length) throw new Error('Unrecognised wind page')
  return { publishedAt: metTimestamp($), stations }
}

export function parseQuality(html) {
  const $ = load(html)
  const sites = []
  $('tr').each((_, row) => {
    const coordinates = clean($(row).find('td.A').text()).match(/^(\d+\.\d+),(\d+\.\d+)$/)
    const name = clean($(row).find('td.B').text())
    if (!coordinates || !name) return
    const sampleText = clean($(row).find('td.F').text())
    const result = sampleText.match(/Vízminta értékelése:\s*(nem megfelelő|megfelelő)(?=Mintavétel|\s|$)/)
    const date = clean($(row).find('td.C').text()).match(/^(\d{4})\.\s*(\d{2})\.\s*(\d{2})\.$/)
    const sampledOn = date ? checkedDate(...date.slice(1)) : null
    sites.push({ name, latitude: Number(coordinates[1]), longitude: Number(coordinates[2]), sampledOn, result: result ? result[1] === 'megfelelő' ? 'pass' : 'fail' : null })
  })
  if (!sites.length) throw new Error('Unrecognised NNGYK page')
  return { sites }
}

const parsers = { temperature: parseTemperature, wind: parseWind, storm: parseStorm, quality: parseQuality }
const cache = new Map()
const inFlight = new Map()

export async function loadSource(key, fetcher = fetch) {
  const cached = cache.get(key)
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < 60000) return cached
  if (inFlight.has(key)) return inFlight.get(key)
  const promise = (async () => {
    const response = await fetcher(BALATON_SOURCES[key], { signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new Error('Source unavailable')
    const html = await response.text()
    if (html.length > 2000000) throw new Error('Unexpected source size')
    const result = { ...parsers[key](html), fetchedAt: new Date().toISOString(), sourceUrl: BALATON_SOURCES[key] }
    cache.set(key, result)
    return result
  })()
  inFlight.set(key, promise)
  try { return await promise } finally { inFlight.delete(key) }
}
