import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
export function shoreImportSql(records) {
  for (const row of records) {
    if (!row.locationId || ![row.latitude, row.longitude, row.seaBearing].every(Number.isFinite) || row.seaBearing < 0 || row.seaBearing >= 360) throw new Error('Invalid orientation')
  }
  const json = JSON.stringify(records).replaceAll("'", "''")
  return `begin;
-- Fill only missing orientations; preserve every unrelated metadata field.
-- A changed ID, coordinate or water type must be reviewed again.
with proposed as (select * from jsonb_to_recordset('${json}'::jsonb)
  as p("locationId" text, latitude double precision, longitude double precision, "seaBearing" double precision, "shoreOrientation" jsonb))
update public.locations l set metadata=l.metadata || jsonb_build_object('seaBearing',p."seaBearing",'shoreOrientation',p."shoreOrientation"),updated_at=now()
from proposed p where l.id=p."locationId" and l.active and l.water_type='coastal'
  and abs(l.latitude-p.latitude)<=0.00001 and abs(l.longitude-p.longitude)<=0.00001
  and (l.metadata->'seaBearing' is null or l.metadata->'seaBearing'='null'::jsonb);
commit;\n`
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = JSON.parse(await readFile(new URL('../public/data/shore-orientations.json', import.meta.url)))
  const path = process.argv[2] ?? '/tmp/safe-to-swim-shore-orientations.sql'
  await writeFile(path, shoreImportSql(data.locations))
  console.log(`Prepared ${data.locations.length} conditional updates: ${path}`)
}
