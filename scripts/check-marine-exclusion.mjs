// Disposable database used by check-shore-import.mjs; never production.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { importSql } from './import-catalogue.mjs'
const sql = text => execFileSync('psql',['-X','-h','127.0.0.1','-p','55439','-d','sts_shore_test','-v','ON_ERROR_STOP=1','-At'],{input:text,encoding:'utf8'})
const id='eea-LV00713000013', target=`open-meteo-marine:${id}`
sql(`create table location_sources(location_id text,target_id text,data_type text,enabled boolean,primary key(location_id,target_id,data_type));
insert into locations values ('${id}','Priedaine','Latvia','',56.9797,23.89476,'coastal',true,'{"marineModelSupported":true,"seaBearing":0,"custom":"keep"}',now());
insert into location_sources values ('${id}','${target}','marine',true),('${id}','weather','weather',true);`)
const patch=readFileSync(new URL('../supabase/imports/20261103_priedaine_marine_exclusion.sql',import.meta.url),'utf8')
sql(patch)
const before=sql(`select row_to_json(l) from locations l where id='${id}'`)
sql(patch)
assert.equal(sql(`select row_to_json(l) from locations l where id='${id}'`),before)
assert.equal(JSON.parse(before).metadata.custom,'keep')
const generated={id,name:'Priedaine',nation:'Latvia',area:'',latitude:56.9797,longitude:23.89476,metadata:{marineModelSupported:true,seaBearing:null}}
sql(importSql({locations:[generated],location_sources:[{location_id:id,target_id:target,data_type:'marine',enabled:true}]}))
const metadata=JSON.parse(sql(`select metadata from locations where id='${id}'`))
assert.equal(metadata.marineModelSupported,false)
assert.equal(metadata.marineExclusion.waterBody,'Lielupe river')
assert.equal(metadata.seaBearing,0)
assert.equal(sql(`select enabled from location_sources where target_id='${target}'`).trim(),'f')
assert.equal(sql("select enabled from location_sources where target_id='weather'").trim(),'t')
console.log('Marine exclusion survives reimport; weather/manual bearing retained; patch idempotent.')
