import test from 'node:test'
import assert from 'node:assert/strict'
import { favouriteRecord, normalizeFavourites, readFavourites, writeFavourites, toggleFavourite, filterFavourites } from '../src/favourites.js'

const beach = { id: 'brighton', name: 'Brighton Beach', area: 'Brighton', nation: 'England', waterType: 'coastal', latitude: 50, weather: { temperature: 20 } }
const lake = { id: 'test-lake', name: 'Árnyas tó', area: 'Balaton', nation: 'Hungary', waterType: 'lake' }

test('save and remove by stable ID without retaining observations or coordinates', () => {
  const first = toggleFavourite([], beach)
  assert.equal(first.length, 1)
  assert.equal(first[0].latitude, undefined)
  assert.equal(first[0].weather, undefined)
  const both = toggleFavourite(first, lake)
  assert.deepEqual(both.map(item => item.id), ['brighton', 'test-lake'])
  assert.deepEqual(toggleFavourite(both, { ...beach, name: 'Renamed beach' }), [favouriteRecord(lake)])
  assert.equal(first.length, 1)
})

test('stored favourites survive reload, reject malformed entries and remove duplicate IDs', () => {
  let value = null
  const storage = { getItem: () => value, setItem: (_, next) => { value = next } }
  assert.deepEqual(readFavourites(storage), [])
  assert.equal(writeFavourites(storage, [beach, lake]), true)
  assert.deepEqual(readFavourites(storage), [favouriteRecord(beach), favouriteRecord(lake)])
  assert.deepEqual(normalizeFavourites([null, 1, {}, { id: 'bad' }, { id: '', name: 'bad' }, beach, { ...beach, name: 'Duplicate' }]), [favouriteRecord(beach)])
  for (const corrupt of ['{', 'null', '{}', '42']) { value = corrupt; assert.deepEqual(readFavourites(storage), []) }
  const denied = { getItem() { throw Error('denied') }, setItem() { throw Error('denied') } }
  assert.deepEqual(readFavourites(denied), [])
  assert.equal(writeFavourites(denied, [lake]), false)
})

test('favourite search combines accent-insensitive names, country and water filters', () => {
  const saved = normalizeFavourites([beach, lake])
  assert.deepEqual(filterFavourites(saved, { search: 'arnyas balaton', waterType: 'lake', country: 'Hungary' }).map(item => item.id), ['test-lake'])
  assert.deepEqual(filterFavourites(saved, { search: 'England', waterType: 'coastal' }).map(item => item.id), ['brighton'])
  assert.deepEqual(filterFavourites(saved, { country: 'England', waterType: 'lake' }), [])
  assert.deepEqual(filterFavourites(saved, { search: 'missing' }), [])
})
