import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {currentExpected} from '../baseline/v34-authority.mjs';
import {manifest} from '../../packages/content/src/manifest.js';
import {rosterMechanics,sameMechanics,reviewedMigrationScope,parseManifest} from '../../tools/ci/roster-scope.mjs';
const baseline=JSON.parse(fs.readFileSync(new URL('../baseline/main-790fb11-roster.json',import.meta.url),'utf8'));
test('83 inherited kits retain their mechanical projection except the explicitly listed v34/v35 deltas',()=>{
 const actual=rosterMechanics(manifest);assert.equal(Object.keys(baseline.entries).length,81);
 assert.equal(baseline.sourceCommit,'790fb11a0618d6c706d1aee044379939940415af');
 // PR18 reworked these two kits after the 81-character fixture was recorded.
 const pr18={
  'emoji-034':'b36b9a448c7e5c3acb2788cfe176ea03fe45d820e572e3b1fcfb12a0a3b48110',
  'emoji-070':'efc3882f5dbafa3f26fd7965f9824ddf5e4edfa8379aa354a662fb454910d463'
 };
 for(const [id,digest] of Object.entries(pr18))assert.equal(createHash('sha256').update(JSON.stringify(actual[id])).digest('hex'),digest,id+' d28b2d8 mechanics');
 for(const [id,expected]of Object.entries(baseline.entries))assert.ok(sameMechanics(actual[id],currentExpected(expected)),id+' authority projection differs from approved main');
});
test('migration scope narrows only approved 87 to 83 changes and retains explicit code references',()=>{
 const historical=structuredClone(manifest);historical.roster=historical.roster.filter(row=>!['emoji-151','emoji-152','emoji-153'].includes(row.id));const previous=structuredClone(historical);previous.roster.push(...['048','065','073','076'].map(n=>({id:'emoji-'+n})));
 const scope=reviewedMigrationScope(previous,historical,['emoji-003','emoji-034','emoji-070','emoji-048']);
 assert.deepEqual(scope.characters,['emoji-003','emoji-034','emoji-070']);assert.equal(scope.preserved,81);
 const changed=structuredClone(historical);changed.roster.find(a=>a.id==='emoji-003').basic.range+=1;
 assert.equal(reviewedMigrationScope(previous,changed,[]),null,'unapproved numeric change disables narrowing');
 changed.roster.find(a=>a.id==='emoji-003').basic.range-=1;changed.roster.find(a=>a.id==='emoji-003').ability.sub='CHANGED';
 assert.equal(reviewedMigrationScope(previous,changed,[]),null,'non-numeric behavior change disables narrowing');
 assert.equal(reviewedMigrationScope(manifest,manifest,[]),null,'ordinary patches never use migration exception');
 assert.ok(!sameMechanics({damage:1},{damage:1.0001}));assert.ok(!sameMechanics({damage:1},{damage:1,flag:false}));
 assert.deepEqual(parseManifest('export const contentHash="abc";\nexport const manifest={"roster":[]};\n'),{roster:[]});
 assert.throws(()=>parseManifest('export const manifest=callFunction();'),SyntaxError);
});
