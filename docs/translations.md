# Interface languages

`src/languages.js` records the target catalogue of 44 country-level official
languages / written standards across Europe, including non-EU and transcontinental
countries. Regional-only languages are outside the requested scope. Catalan is
included for Andorra; Romansh for Switzerland; Latin for the Holy See. Norwegian
Bokmål and Nynorsk are separate choices. Countries sharing a language share a pack.

The EU-language baseline is the [EU's official language list](https://european-union.europa.eu/principles-countries-history/languages_en).
The geographic scope extends beyond EU membership, including the
[Council of Europe's member countries](https://www.coe.int/en/web/portal/members-states)
and Russia, Belarus, Kazakhstan and the Holy See.

## Current coverage

Complete packs cover all 44 languages / written standards in the catalogue. The active list is exported as
`LANGUAGES` from `src/languages.js`; the validator checks every active pack.
Each pack contains 552 translated strings, including safety and missing-data messages.

The original five translations retain their existing text. Additional translations
were written directly in this workspace, without an external translation service.
They have not received independent native-speaker review.
Names of bathing sites, providers and externally supplied warning texts retain
their original/verified source wording. Interface localization does not translate
external websites, map tiles or embedded forecasts.

## Adding a language

1. Create `src/locales/<code>.json` with the same structure as `en.json`.
   Translate every message and supply eight compass labels in N, NE, E, SE, S,
   SW, W, NW order. Keep brand/provider names and interpolation variables unchanged.
2. Add a `<code>.js` entry module that statically imports its JSON pack (see `de.js`).
   Add an explicit dynamic import to `src/languagePacks.js` and add the code to
   `availableLanguages` in `src/languages.js` only when the pack is complete.
3. Run `npm run check:translations`, `npm test`, `npm run lint`, and `npm run build`.
4. Check switching, reload persistence, narrow layouts, missing-data states and
   safety warnings in the browser. Native-language review is separate from
   structural validation; passing tests does not certify translation quality.

All UI message modules read from the same language pack. New packs load on demand;
the current language remains active while a new pack loads. A failed download
shows a retry action instead of switching to a partly translated UI. A saved
language is loaded before the app renders. Existing PWA caching can retain a pack
after it has been fetched, but an unvisited language needs a connection.

`loadLanguage(code)` must complete before rendering a newly added language.
Unknown or unsupported tags resolve to English. Wind defaults to mph in English and km/h in other languages; temperature defaults
to Celsius in every currently supported language. The Units dialog offers independent
wind (km/h, mph) and temperature (°C, °F) overrides. “Follow language” resumes the
language default. Explicit choices persist across reloads and language changes in
`safe-to-swim-units`; invalid or missing stored values use the language defaults.
Model inputs and risk thresholds remain in mph and Celsius. `localeFor` supplies date/number
formatting; browsers may fall back to their default locale for unsupported Intl
locales (for example Latin). Provider alerts accept the same active language catalogue as the UI.
