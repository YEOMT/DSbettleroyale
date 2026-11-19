import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRuleContext} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {mechanics,rosterMechanics} from '../../tools/ci/roster-scope.mjs';
import {runtimeProfiles} from '../v35-6/profile.mjs';
import {expectedPaths357,expectedRuntime357,tiers357} from '../v35-7/approved.mjs';
const base=JSON.parse(fs.readFileSync(new URL('../v35-7/baseline.json',import.meta.url)));
test('v35.7 allowlist: all 86 neutral authority kits, eligibility, non-target augments and global rules',()=>{
 const r=createRuleContext();assert.equal(base.base,'9b2d45ff13d4ee0890179103ef66e6edb1bf174c');
 assert.equal(manifest.roster.length,86);assert.deepEqual(rosterMechanics(manifest),base.mechanics);
 const runtime=runtimeProfiles(r);for(const [id,row]of Object.entries(base.runtime))assert.deepEqual(runtime[id],expectedRuntime357(row),id+' Lv1 actual authority');
 const globals=mechanics(Object.fromEntries(Object.entries(manifest).filter(([k])=>!['roster','reworkDefinitions','rosterVersion'].includes(k))));
 assert.deepEqual(globals,{...base.globals,augments:expectedPaths357(base.globals.augments,r.brRunTierText)});
 assert.deepEqual(r.BR_RUN_PATHS,expectedPaths357(base.augments,r.brRunTierText));
 assert.deepEqual(r.brRunDefaultMods(),base.defaultMods);assert.equal(Object.keys(tiers357).length,10);
});
