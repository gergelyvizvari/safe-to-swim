import test from 'node:test'
import { Buffer } from 'node:buffer'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createContactHandler } from '../api/contact.js'

const body = { name: 'Test Visitor', email: 'visitor@example.com', message: 'A useful suggestion for the app.', requestId: '01234567-89ab-4cde-8fab-0123456789ab' }
const env = { RESEND_API_KEY: 'test-private-key', RESEND_FROM_EMAIL: 'Safe to Swim <hello@example.com>' }
async function call(handler, data = body, options = {}) {
  const req = Object.assign(Readable.from(options.chunks || []), { method: 'POST', headers: { 'content-type': 'application/json' }, socket: { remoteAddress: '127.0.0.1' }, body: data }, options)
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value }, status(code) { this.code = code; return this }, json(value) { this.body = value; return this } }
  await handler(req, res)
  return res
}

test('forwards only to owner, uses visitor reply-to, and keeps retries idempotent', async () => {
  const calls = []
  const handler = createContactHandler({ env, fetchImpl: async (url, options) => { calls.push({ url, ...options }); return { ok: true, json: async () => ({ id: 'email-id' }) } } })
  assert.equal((await call(handler, { ...body, to: 'attacker@example.com', from: 'attacker@example.com' })).code, 200)
  await call(handler)
  const payload = JSON.parse(calls[0].body)
  assert.deepEqual(payload.to, ['vizvari.gergely@gmail.com'])
  assert.equal(payload.from, env.RESEND_FROM_EMAIL)
  assert.equal(payload.reply_to, body.email)
  assert.match(payload.text, /A useful suggestion/)
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key'])
  await call(handler, { ...body, message: 'A changed message with new content.' })
  assert.notEqual(calls[0].headers['Idempotency-Key'], calls[2].headers['Idempotency-Key'])
})

test('invalid input and unsupported requests never reach Resend', async () => {
  const handler = createContactHandler({ env, fetchImpl: () => { assert.fail('unexpected send') } })
  assert.equal((await call(handler, body, { method: 'GET' })).code, 405)
  assert.equal((await call(handler, body, { headers: { 'content-type': 'text/plain' } })).code, 415)
  assert.equal((await call(handler, body, { headers: { 'sec-fetch-site': 'cross-site' } })).code, 403)
  assert.equal((await call(handler, { ...body, email: 'bad\r\n@example.com' })).code, 400)
  assert.equal((await call(handler, { ...body, message: 'tiny' })).code, 400)
  assert.equal((await call(handler, { ...body, message: 'a'.repeat(25_000) })).code, 400)
  assert.equal((await call(handler, '{bad json')).code, 400)
  assert.equal((await call(handler, { ...body, website: 'spam.example' })).code, 200)
})

test('reads local streamed JSON, including Unicode split between chunks', async () => {
  let sent
  const handler = createContactHandler({ env, fetchImpl: async (_, options) => { sent = JSON.parse(options.body); return { ok: true, json: async () => ({ id: 'id' }) } } })
  const raw = Buffer.from(JSON.stringify({ ...body, message: 'Fürdés előtt egy ötlet.' }))
  const split = raw.indexOf(Buffer.from('ü')) + 1
  assert.equal((await call(handler, undefined, { body: undefined, chunks: [raw.subarray(0, split), raw.subarray(split)] })).code, 200)
  assert.match(sent.text, /Fürdés előtt/)
})

test('missing configuration and provider failures stay private and do not claim success', async () => {
  assert.equal((await call(createContactHandler({ env: {} }))).code, 503)
  for (const fetchImpl of [async () => ({ ok: false }), async () => { throw new Error('test-private-key') }, async () => ({ ok: true, json: async () => ({}) })]) {
    const result = await call(createContactHandler({ env, fetchImpl }))
    assert.equal(result.code, 502)
    assert.deepEqual(result.body, { error: 'unavailable' })
  }
})

test('limits repeated submissions and allows them after the window expires', async () => {
  let time = 1000
  const handler = createContactHandler({ env, now: () => time, fetchImpl: async () => ({ ok: true, json: async () => ({ id: 'id' }) }) })
  for (let i = 0; i < 5; i++) assert.equal((await call(handler)).code, 200)
  assert.equal((await call(handler)).code, 429)
  time += 600_001
  assert.equal((await call(handler)).code, 200)
})
