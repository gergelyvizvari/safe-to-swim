begin;
-- Fill only missing orientations; preserve every unrelated metadata field.
-- A changed ID, coordinate or water type must be reviewed again.
with proposed as (select * from jsonb_to_recordset('[{"locationId":"eea-LT0032520010720","latitude":55.9246,"longitude":21.0545,"seaBearing":290,"shoreOrientation":{"distanceMetres":20,"radiusMetres":60,"wayIds":[91927667],"nearestSegment":2,"nearestWayId":91927667,"shorePoint":{"latitude":55.92467976373116,"longitude":21.0542145768136},"method":"length-weighted-local-coastline-right-normal","precision":"estimated","source":"OpenStreetMap contributors","sourceUrl":"https://www.openstreetmap.org/copyright","license":"ODbL-1.0","checkedAt":"2026-11-03","reviewed":true,"estimated":true,"wayVersions":[{"id":91927667,"version":24}],"reviewNote":"Local southbound segment 2 and adjacent vertices reviewed: Baltic water lies west/northwest, land east. Catalogue point is 20 m landward; river mouth lies north. Derived from this local segment, not copied from Palanga pier. Official HI code matches; its monitoring point latitude55.9267 differs from catalogue55.9246 and is not substituted.","snapshotFile":"2026-10-13-osm.json"}}]'::jsonb)
  as p("locationId" text, latitude double precision, longitude double precision, "seaBearing" double precision, "shoreOrientation" jsonb))
update public.locations l set metadata=l.metadata || jsonb_build_object('seaBearing',p."seaBearing",'shoreOrientation',p."shoreOrientation"),updated_at=now()
from proposed p where l.id=p."locationId" and l.active and l.water_type='coastal'
  and abs(l.latitude-p.latitude)<=0.00001 and abs(l.longitude-p.longitude)<=0.00001
  and (l.metadata->'seaBearing' is null or l.metadata->'seaBearing'='null'::jsonb);
commit;
