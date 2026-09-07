import { getBalatonData } from '../server/balatonService.js'

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    return response.status(405).json({ error: 'Method not allowed' })
  }
  const url = new URL(request.url, 'http://localhost')
  try {
    const data = await getBalatonData(url.searchParams.get('location'))
    if (!data) return response.status(400).json({ error: 'Unknown Balaton location' })
    return response.status(200).json(data)
  } catch {
    return response.status(503).json({ error: 'Sources unavailable' })
  }
}
