# Country catalogue audit — 9 September 2026

Read-only audit of the current workspace and configured database. No database or implementation changes were made during this audit. Counts describe catalogue records, including featured UK entries, rather than deduplicated physical beaches.

## Scope and method

Compared all 22,289 raw records from the configured EEA 2025 layer against the local catalogue and active database records, by official identifier and water type. All 20,478 records accepted by the current European extent and Coastal/Lake rules match both catalogues. This checks the importer against its source, not the completeness or correctness of all national reporting to EEA.

Also downloaded the four configured UK sources: England 464, Wales 114, Scotland 90, Northern Ireland 33 source records. Read all 21,110 active database records. Independently checked official profiles for exceptional water types. Source responses were fetched on the audit date; EEA data describes the 2025 season.

## Confirmed findings

1. **Wales: two missing database lakes.** Llanishen Reservoir (`nrw-ukl2201-36040`) and Llyn Padarn (`nrw-ukl1200-39975`) are LakeBathingWater in NRW. They are now in the generated local catalogue after the preceding import fix, but were not included in the England-only database backfill. Insert their locations, source targets, bindings and annual classifications.
2. **Northern Ireland: one excluded inland site.** Rea’s Wood (`daera-30203`), at Lough Neagh, is Type=Inland, Status=Confirmed, Activity=Active in DAERA. The importer explicitly accepts only Type=Coastal, so this record is missing in both catalogues. Confirm the inland type as lake using its official profile. Do not generalize every future Inland record to lake without evidence. Its current provider indicator is NoBathing: do not treat that as a 2025 annual classification; annual quality and current advice need separate handling.
3. **Scotland: Luss Bay is misclassified.** `sepa-125079` is a freshwater bay of Loch Lomond according to its SEPA profile. Both local and database catalogues classify it coastal. Locally it also has marineModelSupported=true. The SEPA point feed has no water-type attribute and the curated inland-ID list includes Dores and Loch Morlich but omits Luss Bay. Correct the type and disable any inappropriate marine source binding. Scotland should have three lake sites in this source.
4. **Wales: Marine Lake regression in the preceding edit.** `nrw-ukl1302-40550` remains lake in the database, but the refreshed local catalogue now resolves it to coastal because source waterType takes priority over the curated exception. Denbighshire Council identifies this as a saltwater lake. Preserve the reviewed exception, including disabling marine-model support. This regression was introduced by the preceding England fix, not by this read-only audit.
5. **Database reimports do not repair types.** The locations conflict-update clause in `scripts/import-catalogue.mjs` does not update water_type. Existing source bindings are also preserved. A generated-source fix alone will not repair Luss Bay in the database; use a targeted, reviewed update that also handles the marine binding.

## Wider coverage gaps

The importers exclude Transitional waters (estuarine/brackish categories) entirely: 374 EEA records across 11 countries, plus 53 English and 3 Welsh source records. Examples include Exmouth and Poole Harbour locations. These are excluded by import rules, not missing source data; some featured aliases can still be present. Do not automatically map this category to lake. Supporting it needs an explicit product/model decision and suitable marine-data handling.

EEA transitional exclusions by country: Croatia 40; France 54; Germany 15; Ireland 5; Italy 68; Latvia 14; Netherlands 10; Poland 41; Portugal 28; Romania 1; Spain 98.

River exclusion is documented project scope. The single excluded French Lake record is Lac Bois Diable, French Guiana (5.17673, -52.65708), outside the documented European/Atlantic extent. The source also includes 219 French coastal records outside that extent. Cyprus and Malta have no Lake records in this EEA layer; this does not establish that no lakes exist there. Countries absent from the configured reporting source are a coverage limit, not a water-type filter result.

## Country counts at audit time

The three local/database discrepancies listed above are intentionally preserved in this snapshot. Scotland and Northern Ireland have matching but incorrect/incomplete counts; equality alone is not sufficient validation.

| Country / UK nation | Local coastal | Local lake | DB coastal | DB lake | EEA transitional excluded |
|---|---:|---:|---:|---:|---:|
| England | 379 | 18 | 379 | 18 | 0 |
| Wales | 109 | 2 | 108 | 1 | 0 |
| Scotland | 91 | 2 | 91 | 2 | 0 |
| Northern Ireland | 33 | 0 | 33 | 0 | 0 |
| Albania | 113 | 6 | 113 | 6 | 0 |
| Austria | 0 | 254 | 0 | 254 | 0 |
| Belgium | 41 | 77 | 41 | 77 | 0 |
| Bulgaria | 92 | 4 | 92 | 4 | 0 |
| Croatia | 957 | 34 | 957 | 34 | 40 |
| Cyprus | 123 | 0 | 123 | 0 | 0 |
| Czechia | 0 | 62 | 0 | 62 | 0 |
| Denmark | 917 | 123 | 917 | 123 | 0 |
| Estonia | 30 | 30 | 30 | 30 | 0 |
| Finland | 78 | 211 | 78 | 211 | 0 |
| France | 1816 | 844 | 1816 | 844 | 54 |
| Germany | 346 | 1893 | 346 | 1893 | 15 |
| Greece | 1733 | 1 | 1733 | 1 | 0 |
| Hungary | 0 | 247 | 0 | 247 | 0 |
| Ireland | 138 | 10 | 138 | 10 | 5 |
| Italy | 4782 | 673 | 4782 | 673 | 68 |
| Latvia | 19 | 16 | 19 | 16 | 14 |
| Lithuania | 16 | 80 | 16 | 80 | 0 |
| Luxembourg | 0 | 17 | 0 | 17 | 0 |
| Malta | 87 | 0 | 87 | 0 | 0 |
| Netherlands | 82 | 587 | 82 | 587 | 10 |
| Poland | 149 | 489 | 149 | 489 | 41 |
| Portugal | 487 | 49 | 487 | 49 | 28 |
| Romania | 48 | 1 | 48 | 1 | 1 |
| Slovakia | 0 | 40 | 0 | 40 | 0 |
| Slovenia | 21 | 8 | 21 | 8 | 0 |
| Spain | 1925 | 109 | 1925 | 109 | 98 |
| Sweden | 268 | 210 | 268 | 210 | 0 |
| Switzerland | 0 | 135 | 0 | 135 | 0 |

## Sources

- [EEA configured 2025 layer](https://water.discomap.eea.europa.eu/arcgis/rest/services/BathingWater/BathingWater_Dyna_WM_2025/MapServer/14)
- [Environment Agency England catalogue](https://environment.data.gov.uk/doc/bathing-water.json?_pageSize=1000)
- [NRW catalogue](https://environment.data.gov.uk/wales/bathing-waters/doc/bathing-water.json?_view=bathing-water&_pageSize=1000&_lang=en%2Ccy%2Cnone)
- [SEPA point layer](https://map.sepa.org.uk/server/rest/services/Open/Environmental_Monitoring/MapServer/1)
- [SEPA Luss Bay profile](https://bathingwaters.sepa.org.uk/profiles/profile?location=125079)
- [DAERA monitoring layer](https://services-eu1.arcgis.com/kswen6BYexuc1SUk/arcgis/rest/services/Bathing_Water_Monitoring_Points_Public_View_PRD/FeatureServer/0)
- [DAERA Rea’s Wood and bathing-water results](https://www.daera-ni.gov.uk/news/muir-announces-results-northern-irelands-bathing-waters)
- [Denbighshire Council: Marine Lake](https://www.denbighshire.gov.uk/en/leisure-and-tourism/beaches-and-lakes/marine-lake/marine-lake.aspx)

## Applied repair — 9 September 2026

The subsequent user-authorized repair was applied to the configured database using
`scripts/repair-audited-lakes.mjs --apply`. This section supersedes the open status
of findings 1–4 above; the original table remains the pre-repair audit snapshot.

- Inserted Llanishen Reservoir, Llyn Padarn and Rea’s Wood, with weather and annual-quality source targets/bindings and annual classifications.
- Changed Luss Bay to `lake`, set metadata marine support to false, and disabled its enabled marine binding.
- Preserved Marine Lake as `lake` in the database and restored the curated exception's precedence in the local catalogue.
- Updated the UK generator to retain the explicitly verified Rea’s Wood lake record. Its annual classification is **Poor, 2025**, independently verified against the DAERA annual-results announcement; the feed's current `NoBathing` indicator is not imported as an annual classification.
- The repair preserves curated metadata and pre-existing source assignments apart from the explicitly invalid marine binding. New sites are activated only after their source graph is inserted. The script defaults to read-only inspection, stores a before-image backup on apply, and can resume incomplete insertions.

Verified through the same server catalogue functions and database RPC used by the
API: **Wales 3 lakes, Scotland 3 lakes, Northern Ireland 1 lake**. All five audited
sites return `waterType=lake`, `marineModelSupported=false`, weather and annual
quality sources, and no enabled marine source. Rea’s Wood returns Poor for 2025.
All 90 tests, lint and production build passed.

The general catalogue import still preserves existing database water types and
curated bindings by design. Reclassification is performed by the targeted repair,
not a broad import that could overwrite reviewed assignments.

Transitional-water support remains outside this lake repair: it requires a new
category and compatible application/model behavior. No transitional or river
records were relabelled as lakes. Live DAERA advisory ingestion is not added by
this catalogue correction.
