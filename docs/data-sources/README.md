# Daily source discovery

`registry.json` records stable catalogue IDs, source candidates, evidence, verification scope, status and next review date. `runs/` separates provider-level screening, verified live identities and actually integrated coverage. A `candidate` or `failed` record does not enable anything in the application.

## Selection and concurrency

Start from current origin/main and inspect other active worktrees/runs before selecting a batch. Work separately from uncommitted user changes. Choose 15 unreviewed sites (10–20 allowed), rotate countries using `nextCountry`, and group shared providers. Failed or deferred candidates are not due again before `nextReviewAt` unless new evidence becomes available. A provider failure can block several sites, but must not be reported as successful individual API verification. Do not alter a completed run's counts to count subsequent work.

Only report a site as integrated once its adapter is used in the application and matching, normalization, freshness, errors and affected UI are verified. Changes to dynamic observations must be fetched at runtime with appropriate caching, not replaced by daily static commits. Preserve the original timestamp and source; missing or stale data never implies safe bathing.

## 2026-09-08 outcome

15 sites screened: 10 Swedish sites at provider level, 5 English sites matched against a live official collection. **0 new integrations**. The Swedish request timed out; the English source is reachable and has linked sample/risk data, but safe timestamp semantics and sample payloads still require verification. No changes to runtime/UI or safety ratings were made. Next country: France. Failed/deferred records are due 2026-10-08, unless new evidence unlocks them earlier.

### Sweden — Havs- och vattenmyndigheten

- Documentation: https://www.havochvatten.se/data-kartor-och-rapporter/data-och-statistik/data-och-apier/api-badplatser-och-badvatten.html
- Developer bundle: https://www.havochvatten.se/download/18.45f2ffbc19c32b90d8ea5dd3/1771253338149/apispec-bathing-waters-public-2.3.0.0-hav-doc.zip
- API: `https://gw.havochvatten.se/external-public/bathing-waters/v2`
- Documented GET resources: `/bathing-waters`, `/bathing-waters/{id}`, `/bathing-waters/{id}/results`.
- Official OpenAPI v2.3.0 declares no authentication; developer guide documents 1,000 calls/minute. Respect rate limiting and back off on 429.
- Documented data: municipal bacterial samples, algae observations, advice against bathing and sampling coordinates. Updates are primarily seasonal. Coastal temperature forecasts may be available; these are model forecasts, not lake measurements. Exact observation units and freshness still require payload validation.
- Terms linked by the publisher: https://www.havochvatten.se/data-kartor-och-rapporter/data-och-statistik/om-oppna-data-och-statistik/om-oppna-data-pa-havs--och-vattenmyndigheten.html . Redistribution terms not yet fully reviewed; this audit has not verified production integration readiness.
- Actual probe on 2026-09-08: GET `/bathing-waters/SE0441290000000676`, curl exit 28 after 30 seconds without an HTTP response. Documentation ZIP downloaded successfully. Do not interpret this as authentication failure or global service downtime.
- Catalogue IDs remain candidates, not verified mappings. Notably `SE0110138000002104A` does not match the documented identifier pattern; never strip a suffix or choose a nearby waterbody to force a match. Some coordinate examples in the specification appear reversed; use actual payload verification, not copied examples.

### England — Environment Agency

- Official catalogue/API entry: https://environment.data.gov.uk/apiportal
- Live GET tested successfully: https://environment.data.gov.uk/doc/bathing-water.json?_pageSize=1000 (464 records).
- Five existing `ea-` catalogue IDs matched the returned `eubwidNotation` and sampling coordinates; evidence recorded in the registry. They are coastal bathing waters, not lake-station substitutions.
- Response includes latest annual assessment, latest sample assessment URL, and risk-prediction object. Latest risk is a prediction, not a bacterial measurement. No water temperature, wave or current observation was verified.
- `expiresAt` is returned without a UTC offset in the inspected records. Do not parse it using the server/browser's implicit timezone; resolve the provider's timestamp convention first. Store observed source strings unchanged in this audit.
- Latest sample links were discovered but their payloads have not yet been fetched/validated. Freshness, sample units and exact sample status semantics remain unverified.
- This read required no credentials. Rate limits and redistribution requirements must still be checked in the publisher's documentation before deployment of a new adapter. Do not treat existing static catalogue values as fresh warnings.

## 2026-09-12 outcome

15 new Spanish sites reviewed, plus completion of the preceding 15 Italian
shoreline records. **30 orientations integrated locally, 0 applied in production;
0 new dynamic adapters or verified live cameras.** The source evidence and
per-location IDs are in `runs/2026-09-12.json`. The registry also preserves the
pending France research from local commit `2f37035` so it is not repeated.

The OSM-derived bearings have source/version/method/date provenance and a public
ODbL dataset. Local catalogue and database API propagation are tested. Apply
`supabase/imports/20260912_shore-orientations.sql` only to the configured project
after the accompanying attribution UI is deployed. It fills missing metadata
only, checks location identity/coordinates/type, and is safe to rerun. Existing
orientations and their provenance survive the full catalogue import.

Arpae supplied 15 exact identities; general reuse terms are CC BY-NC-SA, so no
new production adapter is enabled. PlatgesCat supplied 253 beach records and
14 detailed beaches for 15 selected EEA points. Its historical and current-season
sample arrays differ: do not treat the latest historical row as a current sample.
The retained Barceloneta current-season sample is dated 31 August 2026, with
Europe/Madrid timezone metadata. Listing update times are not measurement times.
Meteocat's public offshore XML is reachable, but region forecasts are not local
beach observations; timezone and reuse validation remain.

Verification: `npm test`, `npm run lint`, `npm run build`,
`node scripts/verify-shore-orientations.mjs`. The standalone PostgreSQL regression
check is `node scripts/check-shore-import.mjs`, against an **empty disposable local**
`sts_shore_test` database on port 55439. It is never pointed at Supabase.

## 2026-09-13 outcome

15 Portuguese bathing-water identities verified against the official APA ArcGIS
collection, and 15 new OSM-derived orientations integrated locally (45 cumulative).
Production additions remain zero. The new SQL import is prepared, not applied.
No new adapter or live camera was enabled.

APA returns 761 beach/concession records; several share one bathing-water code.
The official sample-detail link returned 403, and was not retried for every beach.
The untimestamped water-status description is not a recent bacterial measurement.
IPMA's daily offshore forecast and warnings are reachable; spatial coverage and
reuse conditions still need resolution before enabling an adapter.

Three cameras are directly referenced by the corresponding APA records. Riviera
played beach video, but capture time and exact camera position remain unknown;
Cabana do Pescador and CDS reported playback errors. None is counted as a verified
live-camera integration. See `runs/2026-09-13.json` for per-location evidence and
review dates. Tests, lint, build and the new SQL's local PostgreSQL regression pass.

## 2026-09-15 outcome

Completed the unfinished 15-site Croatian selection: 14 exact official catalogue
identities, no new production coverage, dynamic adapters, orientations or live cameras.
The 2026 IZOR catalogue returns 1,168 records. Radisson Blu Resort is absent.
Detail access is intermittent (6 of 14 requests returned 403); several sites share
a profile ID, which must not be treated as a sample-station ID without validation.
Samples are dated August 31 or September 2, not current swimming clearance.

DHMZ offers a reusable XML source under Croatia’s Open Licence. The sea-temperature
XML contains today’s Split value, but station coordinates and timezone still need
verification. CAP warnings have explicit offsets; regional coverage remains to map.
Bačvice and the officially linked Žnjan construction camera both display Offline.
Overpass returned 406 for both request formats, leaving geometry retrieval blocked.

The production collector is advancing; storm publication is correctly stale.
SEPA’s existing weekly retry is due later today, not at this morning’s check.
96 tests, lint and build pass. See `runs/2026-09-15.json` for exact evidence,
identifiers, per-source limitations and October 15 review dates. No SQL was applied.

## 2026-09-16 outcome

15 Attica coastal sites reviewed; 15 new estimated orientations integrated locally
(60 cumulative), with a missing-only SQL import prepared. No new dynamic source
or verified live camera was enabled; production database additions remain zero.
Eight orientations use local weighted normals and seven use individually reviewed
beach chords around bays/headlands. Versioned OSM geometry permits reproduction.

The Greek bathing-water registry home page is accessible, but its search returned
503 and its map timed out. POSEIDON documentation and a real platforms request
confirm OAuth2 authorization is required (401). No credentials requested from the
provider. HNMS marine bulletins are a regional candidate, not a local safety signal.
Meteocam Anavyssos reports a playback error; WatermanVision has no stream connected.

Production API pagination, 15 details/observation identities and 15 weather/marine
model responses pass. The collector is advancing. EA and NRW weekly link checks
failed once, but direct reads now recover; SEPA has two recorded failures. These
are reachability checks, not fresh water-quality observations.

96 tests, lint, build, 60-bearing reproduction and local PostgreSQL import regression
pass. See `runs/2026-09-16.json` for evidence and October 16 re-review dates.

## 2026-09-17 outcome

15 Berlin lake sites reviewed; all 15 matched by exact EU ID in the official
WFS, then by shared official article ID to LAGeSo CSV station codes. **0 new
production integrations, 0 verified/integrated live cameras, 0 new orientations.**
This run rotates back to lakes; next country is the Netherlands.

The shared CSV returned 39 records with dated measurements and textual advice.
Selected samples are September 8–10, not current temperatures. A critical parser
case was found outside the selected batch: Grunewaldturm contains numeric zeros
while its accompanying note says sampling was impossible. Treating these as
measurements would be incorrect. Less-than values, case-sensitive advice columns,
per-site dates and day precision must survive normalization. Exact identities
do not erase sampling distance: two points differ by roughly 490/740 metres.

The DWD Atom feed is reachable and current, but regional CAP coverage and
cancellation semantics are not yet mapped. The Müggelsee operator camera reports
“Invalid player id”; no nearby camera from another lake was substituted.

The configured database and production catalogue/observation identities were
checked. Collection continues; weekly link-check failures remain unchanged.
111 tests, lint and build pass. No runtime, schema, assignments or schedule changed.
See `runs/2026-09-17.json` for exact source links, station identities, remaining
adapter requirements, source evidence and October 17 re-review dates.

## 2026-09-19 — Netherlands, 15 coastal sites

Completed the interrupted September 18 batch (not previously committed or counted).
[Run evidence](runs/2026-09-19.json): 15 exact Rijkswaterstaat bathing-water IDs,
15 reviewed OSM shoreline bearings, 15 valid per-site wind/wave model probes.
The local catalogue/API includes the bearings; the guarded transactional
`supabase/imports/20260919_shore-orientations.sql` remains **prepared, not applied**.
Production coverage added: **0**. No new schema or runtime adapter is required.

The RWS MapServer catalogue establishes identity, not current microbiology. The
new Waterdata API returned historical temperature series at the Hoek van Holland
river station; it is not assigned to the North Sea beach. July Zwemwater measures
are not current warnings. KNMI warning files remain an unbound candidate.

Camera search covered these same 15 sites: 11 candidate groups, **0 fully verified
live cameras, 0 integrated**. Royal's player showed the beach, but capture time and
exact bathing-site FOV remain unverified. Wassenaar's former source is now a
reserved domain. Other operator/tourism links remain candidates. Review dates
are October 19; no neighbouring camera was automatically substituted.

Validation: 111 tests, lint/build, all 75 shoreline bearings reproduced, actual
PostgreSQL idempotence/curated-value preservation checks, local browser wind
assessment. Four production lake/coastal pages and 15 details/observations checked.
Source collection advances; unchanged weekly failures are not new incidents.
Next country: Denmark.
