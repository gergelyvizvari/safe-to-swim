import { database } from '../server/supabase.js'
import { collectSource } from '../server/observations.js'
import { SOURCES } from '../server/sourceRegistry.js'
import { isObservationStale } from '../src/balaton.js'

// Operator fallback when the hosting provider is denied by the public EA API.
// Uses the same live adapter, never a saved fixture. Does not clear cloud failures
// or alter the existing retry schedule. No new scheduler or credentials.
const source=SOURCES.find(s=>s.id==='ea-brighton-samples')
const payload=await collectSource(source)
const checkedAt=new Date().toISOString()
const old=payload.sites.some(s=>isObservationStale(s.publishedAt,source.stale_seconds*1000))
console.log(JSON.stringify({source:source.id,sites:payload.sites.length,oldSamples:old,mode:process.argv.includes('--apply')?'apply':'dry-run'}))
if(process.argv.includes('--apply')) {
  const [prior]=await database(`source_state?source_id=eq.${source.id}`)
  if(!prior || prior.lease_until && Date.parse(prior.lease_until)>Date.now())throw new Error('Collector active or source not initialized')
  const result=await database(`source_state?source_id=eq.${source.id}&checked_at=eq.${encodeURIComponent(prior.checked_at)}`,{
    method:'PATCH',prefer:'return=representation',body:{payload,checked_at:checkedAt,succeeded_at:checkedAt,published_at:null,check_kind:'observations',status:old||prior.error_code?'stale':'healthy'},
  })
  if(result.length!==1)throw new Error('Concurrent collector update; no overwrite')
  console.log('Stored live EA payload; cloud error and retry schedule preserved.')
}
