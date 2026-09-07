# Safe to Swim

Coastal weather, marine forecasts and annual bathing-water classifications.

## European coverage

The checked-in catalogue combines the existing UK authority data with 14,268 EEA coastal bathing sites and 6,210 lake bathing sites in 29 countries from the 2025 classification season. Coastal and lake waters within the European/Atlantic-island extent (27–72° N, 32° W–45° E) are imported; rivers and overseas sites outside that extent are excluded.

Lake sites use weather forecasts and annual water classifications only. Marine API requests, tide panels and marine model maps are disabled. Lake temperature, waves, currents and algae conditions are unavailable; no favourable swim rating is inferred. The picker provides All / Sea / Lake filters.

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
