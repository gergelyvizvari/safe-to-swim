import { LANGUAGES, resolveLanguage } from './languages.js'
import en from './locales/en.json' with { type: 'json' }
import fr from './locales/fr.json' with { type: 'json' }
import it from './locales/it.json' with { type: 'json' }
import es from './locales/es.json' with { type: 'json' }
import hu from './locales/hu.json' with { type: 'json' }

const packs = { en, fr, it, es, hu }
const pending = new Map()
const loaders = {
  de: () => import('./locales/de.js'),
  pt: () => import('./locales/pt.js'),
  nl: () => import('./locales/nl.js'),
  hr: () => import('./locales/hr.js'),
  bs: () => import('./locales/bs.js'),
  cnr: () => import('./locales/cnr.js'),
  sr: () => import('./locales/sr.js'),
  nb: () => import('./locales/nb.js'),
  nn: () => import('./locales/nn.js'),
  ro: () => import('./locales/ro.js'),
  ca: () => import('./locales/ca.js'),
  sv: () => import('./locales/sv.js'),
  da: () => import('./locales/da.js'),
  cs: () => import('./locales/cs.js'),
  sk: () => import('./locales/sk.js'),
  pl: () => import('./locales/pl.js'),
  sl: () => import('./locales/sl.js'),
  fi: () => import('./locales/fi.js'),
  et: () => import('./locales/et.js'),
  lv: () => import('./locales/lv.js'),
  lt: () => import('./locales/lt.js'),
  tr: () => import('./locales/tr.js'),
  ru: () => import('./locales/ru.js'),
  uk: () => import('./locales/uk.js'),
  be: () => import('./locales/be.js'),
  bg: () => import('./locales/bg.js'),
  mk: () => import('./locales/mk.js'),
  sq: () => import('./locales/sq.js'),
  el: () => import('./locales/el.js'),
  lb: () => import('./locales/lb.js'),
  is: () => import('./locales/is.js'),
  mt: () => import('./locales/mt.js'),
  ga: () => import('./locales/ga.js'),
  rm: () => import('./locales/rm.js'),
  la: () => import('./locales/la.js'),
  az: () => import('./locales/az.js'),
  kk: () => import('./locales/kk.js'),
  hy: () => import('./locales/hy.js'),
  ka: () => import('./locales/ka.js'),
}

export const isLanguageLoaded = language => Boolean(packs[resolveLanguage(language)])
export const getMessages = language => packs[resolveLanguage(language)] ?? packs.en

export function loadLanguage(language) {
  const code = resolveLanguage(language)
  if (packs[code]) return Promise.resolve(packs[code])
  if (!pending.has(code)) {
    const request = loaders[code]().then(module => {
      packs[code] = module.default
      return packs[code]
    }).finally(() => pending.delete(code))
    pending.set(code, request)
  }
  return pending.get(code)
}

// Keep the existing message-module API while reading from the shared language pack.
export function messageSection(section) {
  return Object.defineProperties({},
    Object.fromEntries(LANGUAGES.map(({ code }) => [code, { enumerable: true, get: () => getMessages(code)[section] }])))
}
