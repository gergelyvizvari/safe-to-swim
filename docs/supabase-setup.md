# Catalogue and source operations

Map queries return at most 500 locations in the visible bounds; when truncated, the
UI explicitly asks users to zoom or refine. Lists use 80-item pages.

The frontend now requests `/api/catalogue` (search, country/type filters, pagination,
viewport bounds, nearest location, and detail) instead of bundling the EU/UK catalogues.
Vite and Vercel use the same handlers. Without Supabase configuration the API reads
the checked-in catalogues **on the server**, allowing local development. With both
Supabase variables set, database errors fail visibly; they never silently switch to
an old catalogue. Static-only hosting is no longer supported.

## Setup

1. Select a dedicated Supabase project. Apply
   `supabase/migrations/202609080001_catalog.sql` using its SQL editor or a PostgreSQL connection.
2. Run `npm run data:import`. It writes `/tmp/safe-to-swim-catalogue.sql`.
   Apply this SQL through a PostgreSQL connection (`psql`, with the connection
   configured in the environment). The import is one transaction, keeps existing
   IDs, preserves curated source assignments on rerun, and does not delete sites.
3. Set **server-only** `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local`
   and the deployment environment. The latter accepts a Supabase secret key or
   legacy service-role key. Never use a `VITE_` prefix for secrets.
4. Set a long random `CRON_SECRET` in the server environment. Run one authenticated
   `GET /api/source-checks` to populate observations, then enable the schedule below.
5. Enable Supabase Cron and pg_net, store the deployment origin and the matching
   cron secret in Vault, and apply `supabase/schedule-source-checks.sql`.

All new tables have RLS enabled and no anon/authenticated privileges. Browser
requests go through bounded server endpoints. Raw payloads, source configs, and
health state are private to the service role. Existing unrelated tables are untouched.

## Relationships

`locations -> location_sources -> source_targets -> data_sources`

Water types are `coastal` and `lake`. Optional `water_bodies` group sites without
special UI branches. A target identifies a site, station, basin, water body, or
model point. A binding identifies the data type and priority. Station measurements
and water-body observations retain their coverage labels; they are not copied into
beach-specific forecasts. Verified NNGYK identities are seeded only where an exact
mapping already exists. No nearest-site sample substitutions are made.

Weather and marine forecasts still load from Open-Meteo. Official observations
use `/api/observations` and generic cards. The initial adapters handle the existing
HungaroMet and NNGYK pages. New providers need a server adapter and fixture tests,
then targets and bindings in the DB; the frontend does not test lake names.
External forecast maps remain official-source links rather than scraped forecasts.

## Source checks

The scheduled endpoint claims due sources with a database lease and row locking.
It fetches each shared observation source once, preserving independent failures.
Valid payloads and source publication times are stored separately from check times.
On failure the previous payload remains, but is explicitly marked stale by the API.
The response marks `attention` for stale sources or three consecutive failures.
The scheduler's HTTP responses and `source_state` are the operational inspection
points; an external notification destination has not been configured.

Checks distinguish three levels: parsed official observations, an Open-Meteo
canary request at one known coastal point, and HTML-link reachability for annual
catalogues and external forecast maps. Reachable links do not prove fresh data;
the model canary does not prove coverage at every site. Per-site Open-Meteo errors
remain handled by the browser refresh cycle. Annual data imports still require
review: run the generators, regenerate the import, review counts, then apply it.
Imports do not automatically retire missing sites: review removals and set `active=false`.

## Verification and rollback

Run `npm test`, `npm run lint`, and `npm run build`. Verify search, a lake, a coastal
site, country filters, pagination, and a map viewport. Check missing credentials,
invalid query parameters, unavailable sources, stale publications, and source identity.
For rollback, restore the earlier app deployment and unschedule the named cron job;
retain the new tables and data until rollback is confirmed. No destructive rollback
is required.

References: [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api),
[Supabase Cron](https://supabase.com/docs/guides/cron).
