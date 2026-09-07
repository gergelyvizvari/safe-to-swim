# Safe to Swim

Coastal weather, marine forecasts and annual bathing-water classifications.

## European coverage

The checked-in catalogue combines the existing UK authority data with 14,268 EEA coastal bathing sites and 6,210 lake bathing sites in 29 countries from the 2025 classification season. Coastal and lake waters within the European/Atlantic-island extent (27–72° N, 32° W–45° E) are imported; rivers and overseas sites outside that extent are excluded.

Lake sites use weather forecasts and annual water classifications, with additional official observations for Balaton as described below. Marine API requests, tide panels and marine model maps are disabled. Outside the Balaton integration, lake temperature, waves, currents and algae conditions are unavailable; no favourable swim rating is inferred. The picker provides All / Sea / Lake filters.

This is a catalogue of reported bathing sites, not every beach or coastline in Europe. Countries absent from the EEA reporting dataset (for example Norway, Iceland and Türkiye) are not covered by this import. The map and country filters reflect the actual catalogue. Weather/marine availability depends on Open-Meteo coverage at each site. Unknown shoreline bearings, missing forecasts and missing short-term pollution predictions remain unknown. Annual EEA classifications are not live water-quality measurements.

EEA source: https://www.eea.europa.eu/en/analysis/maps-and-charts/state-of-bathing-waters-in-2025
Attribution: EEA; bathing-water data and coordinates supplied by reporting national authorities.

All forecast and tide times are displayed in the viewer's device time zone, shown above the conditions. Forecast requests retain Unix timestamps to avoid ambiguous time conversion.

## Development and refresh

- `npm run dev` starts Vite.
- `npm test`, `npm run lint`, `npm run build` verify the project.
- `npm run data:refresh` refreshes the existing UK catalogue.
- `npm run data:refresh:europe` refreshes the EEA catalogue. It pages through the official service, validates responses and replaces the generated file only after a complete download. Updating the classification season requires updating the endpoint and year in the generator together.

Both catalogues are bundled, so beach search does not depend on a live catalogue service. Forecasts still require network access.

## Balaton official observations

Balaton sites have a separate panel for NNGYK's latest water sample, HungaroMet water-temperature stations, measured wind/gusts, and the western/central/eastern basin storm signals. Official wind and wave forecast maps load on demand in their original Hungarian interface, including the provider's validity selector. The existing Open-Meteo forecast remains separate; station readings are not interpolated to beaches or copied into future forecast hours.

`GET /api/balaton?location=<catalogue ID>` runs as a Vercel Node function. Vite development and preview use the same handler. A plain static-file deployment cannot supply this API: use Vercel with the `api/` and `server/` directories included, or serve the handler on your own Node backend. No API key is required. Outbound HTTPS access to `www.nnk.gov.hu`, `www.met.hu` and `mobil.met.hu` is required.

Each provider request has a 10-second timeout and an independent 60-second in-process cache; concurrent requests share an in-flight fetch. Failed sources return `unavailable` without replacing other successful results. The browser refreshes every minute and offers manual refresh. API responses are `no-store`, and the service worker excludes `/api/` from offline caching. Source publication timestamps (HungaroMet) and sampling dates (NNGYK) remain distinct from retrieval time. Hungary-local timestamps are converted with Europe/Budapest DST rules. Wind older than 30 minutes, storm publications older than 2 hours, temperature publications older than 36 hours, and samples older than 30 days are explicitly labelled old. These are display freshness thresholds, not guarantees of safety or official validity periods. Old storm publications do not receive current-alert styling.

`server/balatonQualitySites.js` records 146 NNGYK site identities verified on 2026-09-07 against EEA coordinates (within 100 m, with a 30 m margin to the second candidate). Runtime matching requires the recorded official name and coordinates; it never substitutes a nearby beach's sample. Hotel Uni and Tihany Parkkert have no confirmed match. Changed/missing names or coordinates require rechecking the official map and updating this mapping. Annual EEA classifications are retained separately from individual samples. Missing or passing samples never imply safe swimming.

Sources:
- https://www.nnk.gov.hu/index.php/kozegeszsegugyi-laboratoriumi-foosztaly/terkepes-informaciok/furdovizminosegi-terkep
- https://mobil.met.hu/vizhomersekletek
- https://www.met.hu/idojaras/tavaink/balaton/mert_adatok/main.php
- https://www.met.hu/idojaras/tavaink/balaton/viharjelzes/main.php
- https://www.met.hu/idojaras/tavaink/balaton/medencek/
- https://www.met.hu/idojaras/tavaink/balaton/hullammagassag/

The parsers depend on these public pages' structure. Sanitized HTML fixture tests cover missing values, source schema changes, date handling, station identity and independent source outages. If a layout changes, the affected source fails closed and its official link remains available.
