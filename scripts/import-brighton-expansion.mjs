import { readFile } from 'node:fs/promises'
import { database } from '../server/supabase.js'
import { EA_BRIGHTON_SITES } from '../server/eaBrightonSites.js'
import { initialBindings, SOURCES } from '../server/sourceRegistry.js'

// Re-runnable, additive import through the configured project's service-role REST
// API. Each table request is atomic; bindings are written last. No schema changes.
// An orientation uses optimistic metadata equality, so concurrent edits are never
// replaced. A interrupted run can safely resume; it is not a cross-table transaction.
const apply = process.argv.includes('--apply')
const records = JSON.parse(await readFile(new URL('../public/data/shore-orientations.json', import.meta.url))).locations
const rows = [], orientations = []
for (const site of EA_BRIGHTON_SITES) {
  const [row] = await database(`locations?id=eq.${site.locationId}&active=eq.true&limit=1`)
  if (!row || row.water_type !== 'coastal' || Math.abs(row.latitude-site.latitude) > .00001 || Math.abs(row.longitude-site.longitude) > .00001) throw new Error(`Changed identity: ${site.locationId}`)
  const binding = initialBindings({ ...row.metadata, id: row.id, latitude: row.latitude, longitude: row.longitude, waterType: row.water_type }).find(b=>b.target.source_id==='ea-brighton-samples')
  if (!binding) throw new Error(`Missing binding: ${row.id}`)
  rows.push(binding)
  const orientation=records.find(r=>r.locationId===row.id)
  if (orientation && row.metadata.seaBearing == null) orientations.push({row,orientation})
}
console.log(JSON.stringify({mode:apply?'apply':'dry-run',bindings:rows.length,missingOrientations:orientations.length}))
if (apply) {
  const source=SOURCES.find(s=>s.id==='ea-brighton-samples')
  const [existing]=await database(`data_sources?id=eq.${source.id}`)
  if(existing && (existing.adapter!==source.adapter || existing.url!==source.url))throw new Error('Existing source configuration differs')
  await database('data_sources',{method:'POST',prefer:'resolution=ignore-duplicates,return=representation',body:[source]})
  await database('source_targets',{method:'POST',prefer:'resolution=ignore-duplicates,return=representation',body:rows.map(({target})=>({id:target.id,source_id:target.source_id,external_id:target.external_id,label:target.label,coverage_type:target.coverage_type,config:target.config}))})
  // Verify targets before enabling any binding, including on interrupted reruns.
  for(const {target} of rows){const [actual]=await database(`source_targets?id=eq.${encodeURIComponent(target.id)}`);if(!actual || ![actual.config.latitude,actual.config.longitude].every(Number.isFinite) || actual.external_id!==target.external_id||actual.source_id!==target.source_id||Math.abs(actual.config.latitude-target.config.latitude)>.00001||Math.abs(actual.config.longitude-target.config.longitude)>.00001)throw new Error('Existing target differs')}
  await database('location_sources',{method:'POST',prefer:'resolution=ignore-duplicates,return=representation',body:rows.map(({target,...binding})=>({...binding,target_id:target.id}))})
  let applied=0
  for(const {row,orientation:o} of orientations){
    const params=new URLSearchParams({id:`eq.${row.id}`,active:'eq.true',water_type:'eq.coastal',latitude:`gte.${row.latitude-.00001}`,longitude:`gte.${row.longitude-.00001}`,metadata:`eq.${JSON.stringify(row.metadata)}`})
    params.append('latitude',`lte.${row.latitude+.00001}`)
    params.append('longitude',`lte.${row.longitude+.00001}`)
    const updated=await database(`locations?${params}`,{method:'PATCH',prefer:'return=representation',body:{metadata:{...row.metadata,seaBearing:o.seaBearing,shoreOrientation:o.shoreOrientation},updated_at:new Date().toISOString()}})
    if(updated.length!==1)throw new Error(`Concurrent edit: ${row.id}; rerun after review`)
    applied++
  }
  console.log(JSON.stringify({bindingsPrepared:rows.length,orientationsApplied:applied}))
}
