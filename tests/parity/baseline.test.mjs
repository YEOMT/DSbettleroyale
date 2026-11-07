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
test('current content retains every original permanent ID and only approved base-stat changes',()=>{
 const reference=JSON.parse(fs.readFileSync('tests/baseline/content.json','utf8'));
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),contentHash);
 assert.equal(new Set(manifest.roster.map(a=>a.id)).size,87);
 assert.deepEqual(manifest.tierChances,reference.tierChances);
 for(const key of ['retired','augments','wanggui','xp','maxLevel','maxChoices','pathMaxTier','deathXpCap','ring','capture','respawn','questions'])assert.deepEqual(manifest[key],reference[key],key);
 for(const old of reference.roster){const current=manifest.roster.find(a=>a.id===old.id);assert.ok(current,old.id);
  for(const key of ['name','tier','emoji','radius','speed','damageMult','basic','timing'])assert.deepEqual(current[key],old[key],old.id+' '+key);
  assert.ok(Math.abs(current.maxHp-old.maxHp*(['B','C'].includes(old.tier)?1.06:1))<1e-9,old.id+' HP');
  assert.deepEqual(current.ability,old.ability,old.id+' raw ability');
  const skill=structuredClone(old.skill);if(old.id==='emoji-012')Object.assign(skill,{turretHp:56,durationFrames:1440,duration:1440,description:'HP 56 포탑 설치 · 동시 3개 / 각 24초 · 4번째는 가장 오래된 포탑 교체 · 4회마다 강화탄'});
  assert.deepEqual(current.skill,skill,old.id+' skill (only Genie HP/lifetime may change)');
 }
 for(const [id,old]of Object.entries(reference.reworkDefinitions)){const expected=structuredClone(old);if(id==='emoji-012')Object.assign(expected.skill,{turretHp:56,durationFrames:1440,duration:1440,description:'HP 56 포탑 설치 · 동시 3개 / 각 24초 · 4번째는 가장 오래된 포탑 교체 · 4회마다 강화탄'});assert.deepEqual(manifest.reworkDefinitions[id],expected,id+' rework definition');}
 const fixtures=JSON.parse(fs.readFileSync('tests/baseline/combat.json','utf8'));
 assert.deepEqual(fixtures.map(f=>f.id),reference.roster.map(a=>a.id));
 assert.ok(fixtures.every(f=>f.start.basic&&f.start.skill&&f.end.runtimeFaults===0));
});
