import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { URLSearchParams } from 'node:url'
import { loadEnv } from 'vite'
import { buildImport } from './import-catalogue.mjs'
import { database } from '../server/supabase.js'
import { getLocation, parseSearch, searchCatalogue } from '../server/catalogue.js'

export const AUDITED_LAKE_IDS = [
  'nrw-ukl2201-36040', // Llanishen Reservoir
  'nrw-ukl1200-39975', // Llyn Padarn
  'nrw-ukl1302-40550', // Marine Lake, Rhyl
  'sepa-125079', // Luss Bay, Loch Lomond
  'daera-30203', // Rea's Wood, Lough Neagh
]

export function lakeRepairRows() {
  const tables = buildImport()
  const ids = new Set(AUDITED_LAKE_IDS)
  const locations = tables.locations.filter(row => ids.has(row.id))
  assert.equal(locations.length, ids.size)
  assert.ok(locations.every(row => row.water_type === 'lake' && row.metadata.marineModelSupported === false))
  const bindings = tables.location_sources.filter(row => ids.has(row.location_id))
  assert.ok(bindings.every(row => row.data_type !== 'marine'))
  const targets = new Set(bindings.map(row => row.target_id))
  return {
    locations,
    source_targets: tables.source_targets.filter(row => targets.has(row.id)),
    location_sources: bindings,
    annual_classifications: tables.annual_classifications.filter(row => ids.has(row.location_id)),
  }
}

async function repair() {
  const env = loadEnv('development', process.cwd(), '')
  for (const key of ['SUPABASE_URL', 'SUPABASE_SECRET_KEY']) if (!process.env[key] && env[key]) process.env[key] = env[key]
  const tables = lakeRepairRows()
  const filter = `in.(${AUDITED_LAKE_IDS.join(',')})`
  const locations = await database(`locations?id=${filter}`)
  const bindings = await database(`location_sources?location_id=${filter}`)
  const annual = await database(`annual_classifications?location_id=${filter}`)
  const existing = new Map(locations.map(row => [row.id, row]))
  assert.ok(locations.every(row => row.active || row.metadata?.auditedLakeRepairPending === true), 'An audited site was independently deactivated; review before applying')
  const missing = tables.locations.filter(row => !existing.has(row.id))
  const summary = {
    missing: missing.map(row => row.id),
    reclassify: locations.filter(row => row.water_type !== 'lake').map(row => row.id),
    disableMarine: bindings.filter(row => row.data_type === 'marine' && row.enabled).map(row => row.location_id),
  }
  console.log(JSON.stringify(summary))
  if (!process.argv.includes('--apply')) return

  // Save the touched rows before writing. The path is unique; reruns keep earlier backups.
  const backup = `/tmp/safe-to-swim-lake-repair-${Date.now()}.json`
  await writeFile(backup, JSON.stringify({ locations, bindings, annual, missing: missing.map(row => row.id) }, null, 2), { mode: 0o600, flag: 'wx' })
  console.log(`Backup: ${backup}`)
  const insert = async (table, rows) => {
    if (rows.length) await database(table, { method: 'POST', body: rows, prefer: 'resolution=ignore-duplicates,return=representation' })
  }
  // New sites remain hidden until their source graph and quality data are ready.
  await insert('locations', missing.map(row => ({ ...row, active: false, metadata: { ...row.metadata, auditedLakeRepairPending: true } })))
  await insert('source_targets', tables.source_targets)
  await insert('location_sources', tables.location_sources)
  await insert('annual_classifications', tables.annual_classifications)
  await database(`location_sources?location_id=${filter}&data_type=eq.marine&enabled=eq.true`, {
    method: 'PATCH', body: { enabled: false }, prefer: 'return=representation',
  })
  for (const row of tables.locations) {
    // Re-read to preserve curated names, classifications, and unrelated metadata.
    const [current] = await database(`locations?id=eq.${row.id}`)
    const { auditedLakeRepairPending, ...metadata } = current.metadata
    await database(`locations?id=eq.${row.id}`, {
      method: 'PATCH', prefer: 'return=representation',
      body: {
        water_type: 'lake',
        metadata: { ...metadata, waterType: 'lake', marineModelSupported: false },
        updated_at: new Date().toISOString(),
        // Preserve inactive records; only activate sites inserted by this repair.
        ...(auditedLakeRepairPending ? { active: true } : {}),
      },
    })
  }
  const enabledMarine = await database(`location_sources?location_id=${filter}&data_type=eq.marine&enabled=eq.true`)
  assert.equal(enabledMarine.length, 0)
  for (const id of AUDITED_LAKE_IDS) {
    const site = await getLocation(id)
    assert.equal(site.waterType, 'lake')
    assert.equal(site.marineModelSupported, false)
    assert.ok(!site.sources.some(source => source.type === 'marine'))
    assert.ok(site.sources.some(source => source.type === 'weather'))
    assert.ok(site.sources.some(source => source.type === 'annual_quality'))
  }
  const reasWood = await getLocation('daera-30203')
  assert.equal(reasWood.classification, 'Poor')
  assert.equal(reasWood.classificationYear, 2025)
  for (const country of ['Wales', 'Scotland', 'Northern Ireland']) {
    const result = await searchCatalogue(parseSearch(new URLSearchParams({ country, kind: 'lake', limit: '100' })))
    console.log(JSON.stringify({ country, total: result.total, items: result.items.map(row => ({ id: row.id, name: row.name })) }))
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await repair()
