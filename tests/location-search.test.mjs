import { URLSearchParams } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { locationSearchScore } from '../src/locationSearch.js'
import { locationDisplayName } from '../src/locationNames.js'
import { searchCatalogue, parseSearch } from '../server/catalogue.js'
import { filterMapLocations } from '../src/mapCatalogue.js'
import { COASTAL_LOCATIONS } from '../src/coastalLocations.js'

const almadi = { name: 'Balatonalmádi Wesselényi strand', area: 'Balaton', nation: 'Hungary' }
test('search tolerates accents, casing, missing letters and adjacent swaps', () => {
  for (const query of ['BALATONALMADI', 'balatonalmádi', 'balatonalmádi wesselenyi', 'balatonalmad', 'balatonamadi', 'balatonalmdi', 'balatonalmadi wesseleniy']) {
    assert.ok(Number.isFinite(locationSearchScore(almadi, query)), query)
  }
  assert.ok(locationSearchScore(almadi, 'balatonalmadi') < locationSearchScore(almadi, 'balatonamadi'))
  assert.equal(locationSearchScore(almadi, 'Brighton'), Infinity)
  assert.equal(locationSearchScore(almadi, 'zz'), Infinity)
  assert.equal(locationSearchScore(almadi, 'balatonalmadi missing'), Infinity)
})

test('official identifiers restore names without modifying the source name', () => {
  const site = COASTAL_LOCATIONS.find(item => item.id === 'eea-HUBW_01930')
  const rawName = site.name
  assert.equal(locationDisplayName(site), 'Balatonfüred, Esterházy Strand')
  assert.equal(site.name, rawName)
  assert.equal(locationDisplayName({ id: 'unlisted-hu', name: 'BALATON BALATONFURED ARANYHID MH', nation: 'Hungary' }), 'Balaton Balatonfüred Aranyhíd MH')
  assert.equal(locationDisplayName({ id: 'unknown', name: 'Original Å name' }), 'Original Å name')
})

test('fuzzy list and map matches agree and filters remain strict', async () => {
  const query = 'balatonamadi'
  const options = parseSearch(new URLSearchParams({ q: query, country: 'Hungary', kind: 'lake', limit: '500' }))
  const list = await searchCatalogue(options)
  const map = filterMapLocations(COASTAL_LOCATIONS, query, 'Hungary', 'lake')
  assert.ok(list.total >= 7)
  assert.deepEqual(list.items.map(item => item.id).sort(), map.map(item => item.id).sort())
  assert.equal(filterMapLocations(COASTAL_LOCATIONS, query, 'France', 'lake').length, 0)
  const first = await searchCatalogue({ ...options, page_size: 3 })
  const next = await searchCatalogue({ ...options, page_size: 3, page_offset: 3 })
  assert.equal(new Set([...first.items, ...next.items].map(item => item.id)).size, 6)
})

test('localized names fall back to native and source names; aliases are searchable', () => {
  const location={id:'localized',name:'SOURCE NAME',nameRecord:{nativeLanguage:'hu',names:{hu:{name:'Helyi név',sourceUrl:'https://example.org/source',verifiedOn:'2026-09-09'},en:{name:'English name',sourceUrl:'https://example.org/source',verifiedOn:'2026-09-09'}},aliases:[{name:'Old label',language:'en'}]}}
  assert.equal(locationDisplayName(location,'en-GB'),'English name')
  assert.equal(locationDisplayName(location,'fr'),'Helyi név')
  assert.ok(Number.isFinite(locationSearchScore(location,'old label')))
  assert.ok(Number.isFinite(locationSearchScore(location,'English name')))
  assert.equal(locationDisplayName({id:'none',name:'Source only'},'hu'),'Source only')
})
