import test from 'node:test'
import assert from 'node:assert/strict'
import { getMapCatalogue } from '../server/catalogue.js'
import { filterMapLocations } from '../src/mapCatalogue.js'

test('map index includes the complete catalogue, with no search-page truncation', async () => {
  const items = await getMapCatalogue()
  assert.ok(items.length > 21000)
  assert.equal(new Set(items.map(item => item.id)).size, items.length)
  assert.ok(items.every(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)))
  assert.ok(items.some(item => item.id === 'brighton'))
  assert.equal(await getMapCatalogue(), items)
})

test('map filters combine accent-insensitive search, country and water type', () => {
  const items = [
    { id: 'a', name: 'Füred', area: 'Balaton', nation: 'Hungary', waterType: 'lake' },
    { id: 'b', name: 'Fured', area: 'Coast', nation: 'France', waterType: 'coastal' },
  ]
  assert.deepEqual(filterMapLocations(items, 'fured', 'Hungary', 'lake').map(item => item.id), ['a'])
  assert.equal(filterMapLocations(items, 'missing', '', 'all').length, 0)
  assert.equal(filterMapLocations(items, '', '', 'all').length, 2)
})
