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

2026-09-13 Portugal snapshot query:
`[out:json][timeout:25];way["natural"="coastline"](38.56,-9.26,38.66,-9.18);out meta geom;`
Fifteen local beach normals reviewed in north-up plots. Atlantic water is on the
western/right side; northern groynes do not replace the nearby beach tangent.
All 15 records feed the existing catalogue overlay and detail/map API tests.
`supabase/imports/20260913_shore-orientations.sql` contains only today's 15
conditional updates; do not count the preceding 30 as newly processed.

2026-09-16 Greece snapshot: one OSM API map download,
`https://api.openstreetmap.org/api/0.6/map.json?bbox=23.900,37.649,24.029,37.740`.
Coastline ways only, reconstructed from their referenced nodes; way versions and
retrieval date retained. The map API does not supply an Overpass base timestamp.
Eight local normals and seven manually reviewed chords cover the 15 Attica sites.
Review each bay independently: Anavyssos faces southeast here; Mavro Lithari faces
northwest. Do not extrapolate a generic south/west direction along this coast.
The derived public dataset and source snapshot remain under ODbL. Apply the new
`supabase/imports/20260916_shore-orientations.sql` only to the configured database.

2026-09-18 Netherlands snapshot, reviewed and integrated locally September 19:
15 bounded OSM API map extracts; exact request URLs are retained in the snapshot.
Only coastline ways and their node-derived geometry are retained. Fifteen local
normals point into the North Sea (NW to W, WSW at curved Kennemerstrand).
Catalogue offsets as far as 102 m landward were reviewed against the same beach;
these are not offshore station bindings. Each record retains way versions,
retrieval time, method and review date. The database import remains prepared.

2026-09-22 Ireland: 14 reviewed orientations from bounded OSM API map extracts.
Eight local normals and six reviewed beach chords; directed vertices and way
versions retained. Rush sample points are about 189/199 m seaward of the mapped
high-water line. Dollymount is landward. Loughshinny uses its inner sandy cove,
not the pier. Balbriggan remains unresolved: Overpass 406, OSM 429 including one
retry after several minutes; no further retries or neighbouring bearing copied.
The transactional database import is prepared, not applied.
