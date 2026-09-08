import { getObservations } from '../server/observations.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({ error: 'Method not allowed' }) }
  const id = new URL(req.url, 'http://localhost').searchParams.get('location')
  if (!id || id.length > 200) return res.status(400).json({ error: 'Invalid location' })
  try { return res.status(200).json(await getObservations(id)) }
  catch { return res.status(503).json({ error: 'Observations unavailable' }) }
}
