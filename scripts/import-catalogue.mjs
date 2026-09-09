import { getLocationNameRecord } from '../src/locationNames.js'
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { COASTAL_LOCATIONS, FEATURED_LOCATIONS } from '../src/coastalLocations.js'
import { getWaterQualityForLocation } from '../src/waterQuality.js'
import { CATALOG_UPDATED_ON } from '../src/catalogMetadata.js'
import { initialBindings, SOURCES } from '../server/sourceRegistry.js'
import { isBalaton } from '../src/balaton.js'

export function buildImport() {
  const featured = new Set(FEATURED_LOCATIONS.map(l => l.id))
  const targets = new Map()
  const bindings = []
  const classifications = []
  const locations = COASTAL_LOCATIONS.map(location => {
    for (const binding of initialBindings(location)) {
      const target = { ...binding.target }
      delete target.source
      targets.set(target.id, target)
      bindings.push({ location_id: location.id, target_id: target.id, data_type: binding.data_type, priority: binding.priority, enabled: true })
    }
    if (location.source && location.classificationYear) classifications.push({ location_id: location.id, source_id: location.source, year: location.classificationYear, classification: location.classification })
    return { id: location.id, name: location.name, nation: location.nation, area: location.area ?? '',
      latitude: location.latitude, longitude: location.longitude, water_type: location.waterType ?? 'coastal', water_body_id: isBalaton(location) ? 'balaton' : null,
      featured: featured.has(location.id), active: true,
      metadata: { ...location, nameRecord: getLocationNameRecord(location), catalogUpdatedOn: location.catalogUpdatedOn ?? CATALOG_UPDATED_ON,
        ...(!location.source ? { waterQuality: getWaterQualityForLocation(location, COASTAL_LOCATIONS) } : {}) } }
  })
  return { water_bodies: [{ id: 'balaton', name: 'Balaton', water_type: 'lake' }], data_sources: SOURCES, locations, source_targets: [...targets.values()], location_sources: bindings, annual_classifications: classifications }
}

export function importSql(tables) {
  const quote = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`
  const statements = ['begin;']
  for (const [table, rows] of Object.entries(tables)) {
    if (!rows.length) continue
    const columns = Object.keys(rows[0])
    for (let offset = 0; offset < rows.length; offset += 300) {
      // Recordset omits generated/default fields; existing curated assignments are preserved.
      const updates = table === 'locations' ? `on conflict (id) do update set name=excluded.name,nation=excluded.nation,area=excluded.area,latitude=excluded.latitude,longitude=excluded.longitude,metadata=excluded.metadata || case when locations.metadata->'nameRecord' is not null and locations.metadata->'nameRecord' <> 'null'::jsonb then jsonb_build_object('nameRecord',locations.metadata->'nameRecord') else '{}'::jsonb end,updated_at=now()`
        : table === 'annual_classifications' ? 'on conflict (location_id,source_id,year) do update set classification=excluded.classification,imported_at=now()' : 'on conflict do nothing'
      statements.push(`insert into public.${table} (${columns.join(',')}) select ${columns.map(c => `r.${c}`).join(',')} from jsonb_populate_recordset(null::public.${table}, ${quote(rows.slice(offset,offset+300))}) r ${updates};`)
    }
  }
  statements.push('commit;')
  return statements.join('\n')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tables = buildImport()
  const output = process.argv[2] ?? '/tmp/safe-to-swim-catalogue.sql'
  await writeFile(output, importSql(tables))
  console.log(JSON.stringify(Object.fromEntries(Object.entries(tables).map(([table,rows]) => [table, rows.length]))))
  console.log(`Transactional import written to ${output}`)
}
