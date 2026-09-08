import { timingSafeEqual } from 'node:crypto'
import { database, hasDatabase, rpc } from '../server/supabase.js'
import { checkSource } from '../server/sourceHealth.js'
import { isObservationStale } from '../src/balaton.js'

export function authorized(header, secret) {
  if (!secret || !header) return false
  const actual = Buffer.from(header)
  const expected = Buffer.from(`Bearer ${secret}`)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!authorized(req.headers.authorization, process.env.CRON_SECRET)) return res.status(401).json({ error: 'Unauthorized' })
  try {
    if (!hasDatabase()) return res.status(503).json({ error: 'Database not configured' })
    const sources = await rpc('claim_source_checks', { batch_size: 8 })
    const results = await Promise.all(sources.map(async source => {
      const checkedAt = new Date().toISOString()
      const path = `source_state?source_id=eq.${encodeURIComponent(source.id)}`
      const prior = (await database(path))[0]
      let update
      try {
        const { payload, check_kind } = await checkSource(source)
        const old = payload.publishedAt ? isObservationStale(payload.publishedAt, source.stale_seconds * 1000) : false
        update = { status: old ? 'stale' : 'healthy', check_kind, payload, published_at: payload.publishedAt ?? null, succeeded_at: checkedAt, consecutive_failures: 0, error_code: null }
      } catch {
        // Keep the last valid payload and its original measurement timestamps.
        update = { status: 'unavailable', consecutive_failures: (prior?.consecutive_failures ?? 0) + 1, error_code: 'fetch_or_parse_failed' }
      }
      await database(path, { method: 'PATCH', body: { ...update, checked_at: checkedAt, lease_until: null, next_check_at: new Date(Date.now() + source.refresh_seconds * 1000).toISOString() } })
      return { source: source.id, status: update.status, attention: update.status === 'stale' || update.consecutive_failures >= 3 }
    }))
    return res.status(200).json({ checked: results.length, results })
  } catch { return res.status(503).json({ error: 'Source checks failed' }) }
}
