// Run only against the disposable local test database created for this check.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const sql = input => execFileSync('psql', ['-h','127.0.0.1','-p','55439','-d','sts_uiras_test','-v','ON_ERROR_STOP=1','-At'], { input, encoding: 'utf8' }).trim()
const migration = readFileSync('supabase/imports/20261009_uiras-vetokannas.sql','utf8')
const snapshot = () => sql("select jsonb_build_object('locations',(select jsonb_agg(t) from locations t),'sources',(select jsonb_agg(t) from data_sources t),'targets',(select jsonb_agg(t) from source_targets t),'bindings',(select jsonb_agg(t) from location_sources t));")
assert.equal(sql("select count(*) from locations where id='eea-FI181092003' and metadata->>'curated'='true';"),'1')
const before = snapshot()
sql(migration)
assert.equal(snapshot(),before,'Rerun must preserve full rows, manual enabled/priority and metadata')
assert.equal(sql('select count(*) from location_sources where not enabled and priority=7;'),'1')
sql("update locations set water_type='coastal';")
assert.throws(() => sql(migration),/Verified Vetokannas identity missing/)
sql("update locations set water_type='lake',longitude=25;")
assert.throws(() => sql(migration),/Verified Vetokannas identity missing/)
sql('update locations set longitude=24.8811;')
assert.equal(snapshot(),before)
console.log('UiRaS SQL: idempotence, curated values, water type and coordinates passed')
