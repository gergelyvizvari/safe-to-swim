begin;
-- Apply only after the UiRaS adapter is deployed. No schema or privilege changes.
set local lock_timeout='5s';
do $$ begin
 if not exists (select 1 from locations where id='eea-FI181092003' and active and water_type='lake' and abs(latitude-60.27)<0.00001 and abs(longitude-24.8811)<0.00001) then raise exception 'Verified Vetokannas identity missing'; end if;
end $$;
insert into public.data_sources (id,name,adapter,url,refresh_seconds,stale_seconds) select r.id,r.name,r.adapter,r.url,r.refresh_seconds,r.stale_seconds from jsonb_populate_recordset(null::public.data_sources, '[{"id":"fvh-uiras","name":"Forum Virium Helsinki · UiRaS (CC BY 4.0)","adapter":"uiras_temperature","url":"https://bri3.fvh.io/opendata/uiras/uiras_latest.geojson","refresh_seconds":1800,"stale_seconds":10800}]'::jsonb) r on conflict do nothing;
insert into public.source_targets (id,source_id,external_id,label,coverage_type,config) select r.id,r.source_id,r.external_id,r.label,r.coverage_type,r.config from jsonb_populate_recordset(null::public.source_targets, '[{"id":"fvh-uiras:70B3D57050001BA6","source_id":"fvh-uiras","external_id":"70B3D57050001BA6","label":"Vetokannas","coverage_type":"station","config":{"locationId":"eea-FI181092003","sensorId":"70B3D57050001BA6","name":"Vetokannas","latitude":60.27026,"longitude":24.88056,"locationLatitude":60.27,"locationLongitude":24.8811,"serviceMapId":42505,"distanceMetres":42}}]'::jsonb) r on conflict do nothing;
insert into public.location_sources (location_id,target_id,data_type,priority,enabled) select r.location_id,r.target_id,r.data_type,r.priority,r.enabled from jsonb_populate_recordset(null::public.location_sources, '[{"location_id":"eea-FI181092003","target_id":"fvh-uiras:70B3D57050001BA6","data_type":"temperature","priority":100,"enabled":true}]'::jsonb) r on conflict do nothing;
commit;
