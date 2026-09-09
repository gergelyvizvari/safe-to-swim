import { getLocation } from '../server/catalogue.js'
import { getWeatherAlerts } from '../server/weatherAlerts.js'
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'Method not allowed'}) }
  const params = new URL(req.url,'http://localhost').searchParams
  const id = params.get('location'), language = params.get('language') ?? 'en'
  if (!id || id.length > 200 || !['en','hu','fr','it','es'].includes(language)) return res.status(400).json({error:'Invalid query'})
  try {
    const location = await getLocation(id)
    if (!location) return res.status(404).json({error:'Unknown location'})
    return res.status(200).json(await getWeatherAlerts(location,language))
  } catch { return res.status(503).json({error:'Warnings unavailable'}) }
}
