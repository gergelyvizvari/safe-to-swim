// Disposable local PostgreSQL only; create an empty sts_meteo_lt_test database first.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const sql = input => execFileSync('psql',['-X','-h','127.0.0.1','-p','55439','-d','sts_meteo_lt_test','-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'}).trim()
sql(`create table locations(id text primary key,active boolean,water_type text,latitude float8,longitude float8,metadata jsonb);
create table data_sources(id text primary key,name text,adapter text,url text,refresh_seconds int,stale_seconds int,enabled boolean default true);
create table source_targets(id text primary key,source_id text references data_sources,external_id text,label text,coverage_type text,config jsonb);
create table location_sources(location_id text references locations,target_id text references source_targets,data_type text,priority int,enabled boolean,primary key(location_id,target_id,data_type));
insert into locations values('eea-LT0032500101012',true,'coastal',55.92,21.049,'{"curated":true}');`)
const migration=readFileSync('supabase/imports/20261013_meteo-lt-palangos.sql','utf8')
const snapshot=()=>sql("select jsonb_build_object('locations',(select jsonb_agg(t) from locations t),'sources',(select jsonb_agg(t) from data_sources t),'targets',(select jsonb_agg(t) from source_targets t),'bindings',(select jsonb_agg(t) from location_sources t));")
sql(migration)
sql('update location_sources set priority=7,enabled=false; update data_sources set enabled=false;')
const before=snapshot();sql(migration);assert.equal(snapshot(),before)
for(const change of ["water_type='lake'",'longitude=22']) {
 sql(`update locations set ${change};`)
 assert.throws(()=>sql(migration),/Verified Palanga identity missing/)
 sql("update locations set water_type='coastal',longitude=21.049;")
}
sql("update source_targets set config=jsonb_set(config,'{waterBody}','\"Kuršių marios\"');")
assert.throws(()=>sql(migration),/Palanga source identity conflict/)
sql("update source_targets set config=jsonb_set(config,'{waterBody}','\"Baltijos jūra\"');")
assert.equal(snapshot(),before)
console.log('Meteo LT SQL: idempotence, manual settings, beach identity and source waterbody guards passed')
