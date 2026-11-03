begin;
-- Health Inspectorate identifies this site as the Lielupe river bathing place.
-- Keep the imported category and history until river taxonomy is supported.
do $$ begin
  if not exists (select 1 from public.locations where id='eea-LV00713000013'
    and nation='Latvia' and latitude=56.9797 and longitude=23.89476) then
    raise exception 'Priedaine identity changed';
  end if;
end $$;
update public.location_sources set enabled=false
where location_id='eea-LV00713000013'
  and target_id='open-meteo-marine:eea-LV00713000013' and data_type='marine' and enabled;
update public.locations set metadata=metadata || jsonb_build_object(
  'marineModelSupported',false,
  'marineExclusion',jsonb_build_object('waterBody','Lielupe river','reviewedOn','2026-11-03',
    'source','https://www.vi.gov.lv/sites/vi/files/media_file/priedaines_lielupes_peldvietas-udens-apraksts_2023.pdf',
    'reason','River bathing site; offshore marine model is not representative.')),
  updated_at=now()
where id='eea-LV00713000013' and metadata->'marineModelSupported' is distinct from 'false'::jsonb;
commit;
