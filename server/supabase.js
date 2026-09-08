export function hasDatabase() {
  if (Boolean(process.env.SUPABASE_URL) !== Boolean(process.env.SUPABASE_SECRET_KEY)) throw new Error('Incomplete Supabase configuration')
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)
}

// Server only. Never expose this key through a VITE_ environment variable.
export async function database(path, { method = 'GET', body, prefer } = {}) {
  if (!hasDatabase()) throw new Error('Supabase is not configured')
  const key = process.env.SUPABASE_SECRET_KEY
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Database request failed (${response.status})`)
  return response.status === 204 ? null : response.json()
}

export const rpc = (name, body) => database(`rpc/${name}`, { method: 'POST', body })
