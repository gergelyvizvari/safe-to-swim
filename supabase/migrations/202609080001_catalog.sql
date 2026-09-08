begin;
create extension if not exists postgis with schema extensions;
create extension if not exists unaccent with schema extensions;
grant usage on schema extensions to service_role;

create table public.water_types (
  id text primary key,
  name text not null
);
insert into public.water_types values ('coastal', 'Sea'), ('lake', 'Lake');

create table public.water_bodies (
  id text primary key,
  name text not null,
  water_type text not null references public.water_types(id)
);

create table public.locations (
  id text primary key,
  name text not null,
  nation text not null,
  area text not null default '',
  water_type text not null references public.water_types(id),
  water_body_id text references public.water_bodies(id),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  position extensions.geography(Point, 4326) generated always as
    (extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography) stored,
  featured boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create index locations_position_idx on public.locations using gist(position);
create index locations_type_nation_idx on public.locations(water_type, nation) where active;

create table public.data_sources (
  id text primary key,
  name text not null,
  adapter text not null,
  url text not null check (url like 'https://%'),
  refresh_seconds integer not null check (refresh_seconds >= 60),
  stale_seconds integer not null check (stale_seconds >= refresh_seconds),
  enabled boolean not null default true
);

create table public.source_targets (
  id text primary key,
  source_id text not null references public.data_sources(id),
  external_id text not null,
  label text not null,
  coverage_type text not null check (coverage_type in ('site', 'station', 'basin', 'water_body', 'model_point')),
  config jsonb not null default '{}',
  unique(source_id, external_id)
);

create table public.location_sources (
  location_id text not null references public.locations(id),
  target_id text not null references public.source_targets(id),
  data_type text not null check (data_type in ('weather', 'marine', 'temperature', 'wind', 'storm', 'quality', 'annual_quality', 'windForecast', 'waveForecast', 'webcam')),
  priority integer not null default 100,
  enabled boolean not null default true,
  primary key(location_id, target_id, data_type)
);
create index location_sources_target_idx on public.location_sources(target_id);

create table public.annual_classifications (
  location_id text not null references public.locations(id),
  source_id text not null references public.data_sources(id),
  year integer not null check (year between 1900 and 2200),
  classification text not null check (classification in ('Excellent', 'Good', 'Sufficient', 'Poor', 'Unclassified', 'Closed', 'Satisfactory')),
  imported_at timestamptz not null default now(),
  primary key(location_id, source_id, year)
);

-- A shared source is collected once, independently of how many beaches use it.
create table public.source_state (
  source_id text primary key references public.data_sources(id),
  status text not null check (status in ('healthy', 'stale', 'unavailable')),
  checked_at timestamptz not null,
  succeeded_at timestamptz,
  published_at timestamptz,
  payload jsonb,
  check_kind text check (check_kind in ('observations', 'model_canary', 'link_reachability')),
  consecutive_failures integer not null default 0,
  next_check_at timestamptz not null default now(),
  lease_until timestamptz,
  error_code text
);

-- No anonymous writes or reads of raw provider payloads/configuration.
do $$ declare t text; begin
  foreach t in array array['water_types','water_bodies','locations','data_sources','source_targets','location_sources','annual_classifications','source_state'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

create function public.search_locations(
  query text default '', kind text default 'all', country text default '',
  page_offset integer default 0, page_size integer default 80,
  west double precision default null, south double precision default null,
  east double precision default null, north double precision default null,
  near_lat double precision default null, near_lon double precision default null,
  featured_only boolean default false
) returns jsonb language sql stable set search_path = public, extensions as $$
  with matches as (
    select l.*, case when near_lat is not null and near_lon is not null
      then st_distance(position, st_setsrid(st_makepoint(near_lon, near_lat),4326)::geography) else null end as distance
    from locations l
    where active and (kind = 'all' or water_type = kind)
      and (country = '' or nation = country)
      and (not featured_only or featured)
      and (query = '' or position(lower(unaccent(query)) in lower(unaccent(name || ' ' || area || ' ' || nation))) > 0)
      and (west is null or st_intersects(position, st_makeenvelope(west,south,east,north,4326)::geography))
  ), page as (
    select * from matches order by distance nulls last, featured desc, name, id
    limit least(greatest(page_size,1),500) offset greatest(page_offset,0)
  ) select jsonb_build_object('total',(select count(*) from matches), 'items',
      coalesce((select jsonb_agg(metadata || jsonb_build_object('id',id,'name',name,'nation',nation,'area',area,
        'latitude',latitude,'longitude',longitude,'waterType',water_type,'waterBodyId',water_body_id)) from page),'[]'::jsonb),
      'nations', (select jsonb_agg(nation order by nation) from (select distinct nation from locations where active) n))
$$;

create function public.claim_source_checks(batch_size integer default 8)
returns setof public.data_sources language plpgsql set search_path = public as $$
declare ids text[];
begin
  insert into source_state(source_id,status,checked_at,next_check_at)
    select id,'unavailable',now(),now() from data_sources where enabled
    on conflict do nothing;
  select array_agg(source_id) into ids from (
    select s.source_id from source_state s join data_sources d on d.id=s.source_id
    where d.enabled and s.next_check_at <= now() and (s.lease_until is null or s.lease_until < now())
    order by s.next_check_at limit least(batch_size,8) for update of s skip locked
  ) due;
  update source_state set lease_until=now()+interval '2 minutes' where source_id=any(ids);
  return query select * from data_sources where id=any(ids);
end $$;
revoke execute on function public.search_locations from public, anon, authenticated;
revoke execute on function public.claim_source_checks from public, anon, authenticated;
grant execute on function public.search_locations to service_role;
grant execute on function public.claim_source_checks to service_role;
commit;
