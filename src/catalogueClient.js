export async function catalogueRequest(params, signal) {
  const timeout = AbortSignal.timeout(20000)
  const response = await fetch(`/api/catalogue?${new URLSearchParams(params)}`, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
  if (!response.ok) throw new Error(response.status === 404 ? 'not_found' : 'unavailable')
  return response.json()
}
