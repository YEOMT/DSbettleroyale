import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {manifest,contentHash} from '../../packages/content/src/manifest.js';
test('preserved baseline is the exact upstream Git blob',()=>{
 const bytes=fs.readFileSync('legacy/v32.1/index.html');
 assert.equal(bytes.length,1356097);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'a006aa596c5640ffe127774f271fce7afce81a4769525979fa453f9107ac5d36');
});
test('effective manifest and actual reference attacks cover all 77 permanent IDs',()=>{
 const reference=JSON.parse(fs.readFileSync('tests/baseline/content.json','utf8'));
 assert.deepEqual(manifest,reference);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(reference)).digest('hex'),contentHash);
 assert.equal(new Set(manifest.roster.map(a=>a.id)).size,77);
 const fixtures=JSON.parse(fs.readFileSync('tests/baseline/combat.json','utf8'));
 assert.deepEqual(fixtures.map(f=>f.id),manifest.roster.map(a=>a.id));
 assert.ok(fixtures.every(f=>f.start.basic&&f.start.skill&&f.end.runtimeFaults===0));
});
