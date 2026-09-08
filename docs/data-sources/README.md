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
