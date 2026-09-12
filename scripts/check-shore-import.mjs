// Disposable local PostgreSQL only: create an empty sts_shore_test database first.
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { importSql } from './import-catalogue.mjs'
import { shoreImportSql } from './import-shore-orientations.mjs'
const sql = text => execFileSync('psql',['-X','-h','127.0.0.1','-p','55439','-d','sts_shore_test','-v','ON_ERROR_STOP=1','-At'],{input:text,encoding:'utf8'})
sql(`create table locations(id text primary key,name text,nation text,area text,latitude double precision,longitude double precision,water_type text,active boolean default true,metadata jsonb,updated_at timestamptz);
insert into locations values ('manual','Manual','Italy','',1,2,'coastal',true,'{"seaBearing":0,"shoreOrientation":{"reviewed":true},"nameRecord":{"name":"curated"}}',now()),('missing','Missing','Italy','',1,2,'coastal',true,'{"seaBearing":null,"custom":"keep"}',now()),('lake','Lake','Italy','',1,2,'lake',true,'{}',now()),('moved','Moved','Italy','',3,4,'coastal',true,'{}',now());`)
const row={id:'manual',name:'Manual',nation:'Italy',area:'',latitude:1,longitude:2,metadata:{seaBearing:null,nameRecord:{name:'generated'}}}
sql(importSql({locations:[row]}))
sql(importSql({locations:[{...row,metadata:{seaBearing:90,shoreOrientation:{reviewed:false}}}]}))
assert.deepEqual(JSON.parse(sql("select metadata from locations where id='manual'")),{seaBearing:0,shoreOrientation:{reviewed:true},nameRecord:{name:'curated'}})
const updates=['manual','missing','lake','moved'].map(locationId=>({locationId,latitude:1,longitude:2,seaBearing:35,shoreOrientation:{estimated:true}}))
sql(shoreImportSql(updates))
const before=sql('select jsonb_agg(to_jsonb(l) order by id) from locations l')
sql(shoreImportSql(updates))
assert.equal(sql('select jsonb_agg(to_jsonb(l) order by id) from locations l'),before)
const result=JSON.parse(sql("select metadata from locations where id='missing'"))
assert.deepEqual(result,{seaBearing:35,shoreOrientation:{estimated:true},custom:'keep'})
for (const id of ['lake','moved']) assert.deepEqual(JSON.parse(sql(`select metadata from locations where id='${id}'`)),{})
console.log('PostgreSQL: north-facing manual bearing/provenance/name preserved; missing-only fill, coordinate/type guards and rerun idempotence passed.')
