import test from 'node:test'
import assert from 'node:assert/strict'
import { URLSearchParams } from 'node:url'
import { fromLinkedData, fromNorthernIreland } from '../scripts/generate-bathing-waters.mjs'
import { AUDITED_LAKE_IDS, lakeRepairRows } from '../scripts/repair-audited-lakes.mjs'
import { parseSearch, searchCatalogue } from '../server/catalogue.js'
import { buildImport } from '../scripts/import-catalogue.mjs'

test('UK import retains official lake types and excludes rivers', () => {
  const site = { name: { _value: 'Example' }, samplingPoint: { lat: 54, long: -3 } }
  const convert = type => fromLinkedData({ ...site, type: [`http://environment.data.gov.uk/def/bathing-water/${type}BathingWater`] }, 'England', 'ea')
  assert.equal(convert('Lake').waterType, 'lake')
  assert.equal(convert('Coastal').waterType, 'coastal')
  assert.equal(convert('River'), null)
})

test('all audited lakes retain lake classification and have no marine bindings', () => {
  const tables = lakeRepairRows()
  assert.deepEqual(tables.locations.map(row => row.id).sort(), [...AUDITED_LAKE_IDS].sort())
  for (const row of tables.locations) {
    assert.equal(row.water_type, 'lake')
    assert.equal(row.metadata.marineModelSupported, false)
    assert.ok(!tables.location_sources.some(binding => binding.location_id === row.id && binding.data_type === 'marine'))
  }
  assert.ok(tables.annual_classifications.some(row => row.location_id === 'daera-30203' && row.year === 2025 && row.classification === 'Poor'))
})

test('DAERA verified inland lake separates annual classification from current NoBathing indicator', () => {
  const feature = { geometry: { coordinates: [-6.22, 54.7] }, properties: { Unique_Site_ID_Code: 30203, Type: 'Inland', Site_name: "Rea's Wood", water_quality_indicator: 'NoBathing' } }
  const site = fromNorthernIreland(feature)
  assert.equal(site.waterType, 'lake')
  assert.equal(site.classification, 'Poor')
  assert.equal(site.classificationYear, 2025)
  assert.equal(fromNorthernIreland({ ...feature, properties: { ...feature.properties, Unique_Site_ID_Code: 99999 } }), null)
})

test('English lakes reach search and database import without marine models', async () => {
  const result = await searchCatalogue(parseSearch(new URLSearchParams('country=England&kind=lake&limit=100')))
  assert.ok(result.total > 0)
  assert.ok(result.items.some(site => site.name.startsWith('Windermere')))
  assert.ok(result.items.every(site => site.waterType === 'lake' && site.marineModelSupported === false))
  const imported = buildImport()
  for (const site of result.items) {
    assert.equal(imported.locations.find(row => row.id === site.id).water_type, 'lake')
    assert.ok(!imported.location_sources.some(row => row.location_id === site.id && row.data_type === 'marine'))
  }
})
