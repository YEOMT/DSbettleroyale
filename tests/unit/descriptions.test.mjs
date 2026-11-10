import test from 'node:test';
import assert from 'node:assert/strict';
import {manifest} from '../../packages/content/src/manifest.js';
import {skillDescription} from '../../apps/client/src/ui/descriptions.js';
test('all83 draft descriptions render, including native characters with null rework skill',()=>{
 assert.equal(manifest.roster.length,83);assert.ok(manifest.roster.some(a=>a.skill===null));
 for(const a of manifest.roster){const description=skillDescription(a);assert.equal(typeof description,'string',a.id);assert.ok(description.trim().length>0,a.id);if(a.skill===null)assert.equal(description,a.ability.skillSummary,a.id);}
});
