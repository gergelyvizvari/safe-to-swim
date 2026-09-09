import { locationDisplayName, locationSearchNames } from './locationNames.js'

export const normalizeSearch = value => (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const index = new WeakMap()
function searchable(location) {
  if (!index.has(location)) {
    const text = normalizeSearch(`${locationDisplayName(location)} ${locationSearchNames(location).join(" ")} ${location.area} ${location.nation}`)
    index.set(location, { text, words: [...new Set(text.split(' '))] })
  }
  return index.get(location)
}

// Bounded Damerau-Levenshtein distance, including adjacent letter swaps.
function distance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  let beforePrevious
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) row[j] = Math.min(row[j], beforePrevious[j - 2] + 1)
    }
    if (Math.min(...row) > limit) return limit + 1
    beforePrevious = previous
    previous = row
  }
  return previous[b.length]
}

export function locationSearchScore(location, query) {
  const term = normalizeSearch(query)
  if (!term) return 0
  const { text, words } = searchable(location)
  if (text.includes(term)) return 0
  let score = 0
  for (const token of term.split(' ')) {
    if (words.some(word => word.includes(token))) { score += 1; continue }
    // Short inputs stay precise; longer names tolerate one or two mistakes.
    const limit = token.length < 4 ? 0 : token.length < 8 ? 1 : 2
    if (!limit) return Infinity
    let best = limit + 1
    for (const word of words) best = Math.min(best, distance(token, word, limit))
    if (best > limit) return Infinity
    score += 10 + best
  }
  return score
}
