import { getMapCatalogue, getLocation, parseSearch, searchCatalogue } from '../server/catalogue.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }) }
  const params = new URL(req.url, 'http://localhost').searchParams
  let options
  try { options = parseSearch(params) } catch { return res.status(400).json({ error: 'Invalid query' }) }
  try {
    if (params.get('map') === 'true') {
      const items = await getMapCatalogue()
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300')
      return res.status(200).json(items)
    }
    if (params.has('id')) {
      const location = await getLocation(params.get('id'))
      return res.status(location ? 200 : 404).json(location ?? { error: 'Unknown location' })
    }
    return res.status(200).json(await searchCatalogue(options))
  } catch { return res.status(503).json({ error: 'Catalogue unavailable' }) }
}
