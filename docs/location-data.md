# Weather warnings, cameras and names

## Weather warnings

The first live adapter covers Hungary. `/api/weather-alerts?location=ID&language=hu` resolves the location server-side, matches its coordinates to Eurostat/GISCO NUTS 2024 regions, and reads the official MeteoAlarm Hungary Atom feed and linked CAP documents. Hungary's legacy HU10 warning region maps to HU11 and HU12. Coverage is regional, not a prediction that lightning is present at an individual beach. Lake storm lights remain a separate observation.

Source: https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-hungary
Attribution: HungaroMet / EUMETNET–MeteoAlarm, CC BY 4.0 equivalent feed terms. Geography: Eurostat/GISCO, NUTS 2024, 1M.

Feeds and CAP documents are revalidated every five minutes. Non-public/test/cancelled messages are excluded. Onset and expiry are checked separately. An old feed (over two hours), request failure, or malformed timestamps cannot report a verified clear situation. The browser polls every five minutes and marks old results stale after ten minutes. Expired alerts disappear without waiting for a new response. Active thunderstorm or orange/red warnings prevent a favourable assessment; future warnings apply only to their forecast interval. Other countries are explicitly unsupported by this adapter and do not receive a misleading all-clear panel.

The endpoint needs no additional credentials. Refresh regional geometry with `node scripts/generate-hungary-warning-regions.mjs`. Changing the source or geography requires rechecking region/time tests. Provider text falls back to English if the requested language is absent and retains its source language attribute.

## Cameras

`src/balatonWebcams.generated.js` stores 49 Időkép camera listing URLs with provider-published coordinates and verification dates. `node scripts/generate-balaton-webcams.mjs` refreshes the registry. Existing UK cameras are retained. Balaton cameras are scoped to Balaton sites and all nearby results are sorted by distance within 20 km. Proximity does not mean the image shows the selected beach.

Only the provider page is linked. The app neither republishes camera imagery nor claims every listed camera is currently online. Existing Brighton embedded streams still require a click. A missing camera is a compact message. The selector lists alternative nearby cameras and distances.

Source: https://www.idokep.hu/webkamera/tag/balaton

## Names

Records in `src/hungarianLocationNames.generated.js` are keyed by official bathing-water identifier. Each contains:

```json
{
  "nativeLanguage": "hu",
  "names": {
    "hu": {
      "name": "Balatonfüred, Esterházy Strand",
      "sourceUrl": "https://www.nnk.gov.hu/…",
      "verifiedOn": "2026-09-09"
    }
  },
  "aliases": []
}
```

Additional languages use the same structure, e.g. `en`, `fr`, or `en-gb`. Only entries with name, source URL and verification date are display candidates. The order is exact locale → language → native language → source name. Search includes every language and aliases. The original `location.name` is unchanged, preserving official identity checks and imported identifiers. Unmatched older Hungarian records retain the previous attested-word spelling fallback; this is not a verified full-name translation.

The catalogue import persists these records in `locations.metadata.nameRecord`, using the existing JSONB column; no schema migration is necessary. Existing database name records are preserved on subsequent imports. Database records take precedence over the bundled records. This implementation includes 147 verified Hungarian records and does not invent translated proper names. `node scripts/generate-hungarian-location-names.mjs` refreshes the source records. Add curated variants to database `nameRecord` rather than editing generated output. Prepare an import with `npm run data:import`; applying its SQL to an external database is a separate deployment step.
