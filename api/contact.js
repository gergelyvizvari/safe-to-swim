import { createHash } from 'node:crypto'

const MAX_BYTES = 24_000
const WINDOW = 10 * 60 * 1000

async function readBody(req) {
  if (Number(req.headers['content-length']) > MAX_BYTES) throw new Error('payload')
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    if (Buffer.byteLength(raw) > MAX_BYTES) throw new Error('payload')
    return JSON.parse(raw)
  }
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk)
    if (bytes > MAX_BYTES) throw new Error('payload')
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function createContactHandler({ fetchImpl = (...args) => fetch(...args), env = process.env, now = Date.now } = {}) {
  // Best-effort per-instance throttling; deployment-wide limits belong at the edge.
  const attempts = new Map()
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'method' })
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'invalid' })
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ error: 'invalid' })
    const time = now()
    for (const [key, entry] of attempts) if (entry.until <= time) attempts.delete(key)
    const ip = (env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress) || 'unknown'
    const entry = attempts.get(ip) || { count: 0, until: time + WINDOW }
    if (entry.count >= 5 || attempts.size >= 10_000 && !attempts.has(ip)) {
      res.setHeader('Retry-After', String(Math.ceil((entry.until - time) / 1000)))
      return res.status(429).json({ error: 'rateLimit' })
    }
    entry.count++
    attempts.set(ip, entry)
    let body
    try { body = await readBody(req) } catch { return res.status(400).json({ error: 'invalid' }) }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'invalid' })
    if (body.website) return res.status(200).json({ ok: true })
    const { name = '', email, message, requestId } = body
    if (typeof name !== 'string' || name.length > 100 || /[\r\n\0]/.test(name) ||
        typeof email !== 'string' || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ||
        typeof message !== 'string' || message.trim().length < 10 || message.length > 5000 ||
        typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(requestId)) return res.status(400).json({ error: 'invalid' })
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return res.status(503).json({ error: 'unavailable' })
    const payload = {
      from: env.RESEND_FROM_EMAIL,
      to: ['vizvari.gergely@gmail.com'],
      reply_to: email.trim(),
      subject: 'Safe to Swim · New message',
      text: `Name: ${name.trim() || '(not provided)'}\nEmail: ${email.trim()}\n\n${message.trim()}`,
    }
    const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex')
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contact/${requestId}/${digest}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok || !(await response.json()).id) return res.status(502).json({ error: 'unavailable' })
      return res.status(200).json({ ok: true })
    } catch { return res.status(502).json({ error: 'unavailable' }) }
  }
}

export default createContactHandler()
