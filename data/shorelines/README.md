# Shoreline derivation

© OpenStreetMap contributors. The source snapshot and derived dataset
`public/data/shore-orientations.json` are distributed under the
[Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
[Source attribution](https://www.openstreetmap.org/copyright).

Snapshot: Overpass API, 2026-09-11T08:13:21Z; query:
`[out:json][timeout:25];way["natural"="coastline"](43.95,12.55,44.06,12.77);out meta geom;`

OSM coastlines place water on the right. `scripts/lib/shore-orientation.mjs`
clips directed segments within 60 metres of the nearest local coast point,
weights their right normals by length and rejects sharp turns or competing shores.
This approximates the high-water shoreline, not currents or surf-zone hazards.
Six complex sites use a map-reviewed local beach chord; source way versions and
vertex indices are stored in each record. Reproduce with
`node scripts/verify-shore-orientations.mjs`. Integer bearings do not imply
one-degree accuracy; no calibrated uncertainty is claimed.

Bindings require exact catalogue IDs, coastal water type and coordinates within
0.00001 degrees. Existing bearings are preserved. The DB remains authoritative;
the static overlay supplies only local development and reviewed imports.

2026-09-12 Spain snapshot query:
`[out:json][timeout:25];way["natural"="coastline"](41.25,1.99,41.41,2.23);out meta geom;`
Fifteen new orientations: fourteen local normals, one reviewed beach chord at
Remolar across a small indentation. The EEA coordinates sometimes sit just
landward of the OSM high-water line; water-side verification uses the directed
coastline convention and the north-up local plot, not the sample point's side.
