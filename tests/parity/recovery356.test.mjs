import {expectedPaths357,expectedRuntime357} from '../v35-7/approved.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRuleContext} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {rosterMechanics,sameMechanics,mechanics} from '../../tools/ci/roster-scope.mjs';
import {runtimeProfiles,recoveryIds} from '../v35-6/profile.mjs';
import {approved356,runtime356,expected356} from '../v35-6/approved.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../v35-6/baseline.json',import.meta.url)));
test('v35.6 exactly nine reviewed IDs; every other leaf of all86 and global rules preserved',()=>{
 assert.equal(base.base,'e328aad252e243428123e3d576ea8ffefcdb8604');
 const actual=rosterMechanics(manifest),runtime=runtimeProfiles(createRuleContext());
 assert.deepEqual(Object.keys(actual),Object.keys(base.mechanics));assert.equal(Object.keys(actual).length,86);
 assert.deepEqual([...new Set(approved356.map(d=>d.path.split('.')[0]))].sort(),recoveryIds.slice().sort());
 let unchanged=0;
 for(const [id,row]of Object.entries(base.mechanics)){
  assert.ok(sameMechanics(actual[id],expected356({...row,id})),id+' approved content leaves');
  assert.ok(sameMechanics(runtime[id],expectedRuntime357(expected356(base.runtime[id],runtime356))),id+' actual Lv1 authority profile');
  if(!recoveryIds.includes(id)){unchanged++;assert.ok(sameMechanics(actual[id],row));assert.ok(sameMechanics(runtime[id],expectedRuntime357(base.runtime[id])));}
 }assert.equal(unchanged,77);
 const globals=mechanics(Object.fromEntries(Object.entries(manifest).filter(([key])=>!['roster','reworkDefinitions','rosterVersion'].includes(key))));
 assert.deepEqual(globals,{...base.globals,augments:expectedPaths357(base.globals.augments,createRuleContext().brRunTierText)},'augment/wanggui/mode/tier/6level/global protection constants');
});
test('v35.6 reviewed deltas refer to the frozen old values, not arbitrary current leaves',()=>{
 for(const [scope,changes]of [['mechanics',approved356],['runtime',runtime356]])for(const d of changes){
  let value=base[scope];for(const key of d.path.split('.'))value=value?.[key];
  assert.deepEqual(value,d.before,d.path+' old value');assert.notDeepEqual(d.after,d.before,d.path+' actual change');
 }
 const after=rosterMechanics(manifest);
 for(const id of recoveryIds){assert.equal(after[id].tier,base.mechanics[id].tier);assert.equal(after[id].emoji,base.mechanics[id].emoji);assert.deepEqual(after[id].basic,base.mechanics[id].basic,id+' basic unchanged');}
 assert.equal(after['emoji-034'].skill.damage,21);assert.equal(after['emoji-007'].skill.zoneDamage,base.mechanics['emoji-007'].skill.zoneDamage);
 assert.deepEqual(after['emoji-007'].skill.damage,86.1);assert.equal(after['emoji-007'].skill.radius,290);
});
