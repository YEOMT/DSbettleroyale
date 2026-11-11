import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {v34Expected} from '../baseline/v34-authority.mjs';
import crypto from 'node:crypto';
import {manifest,contentHash} from '../../packages/content/src/manifest.js';
const retired=new Set(['emoji-048','emoji-065','emoji-073','emoji-076']),reworked=new Set(['emoji-034','emoji-070']);
const textKeys=new Set(['description','desc','concept','basicSummary','skillSummary','skillLabel','skillDesc','label']);
const mechanics=x=>Array.isArray(x)?x.map(mechanics):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>!textKeys.has(k)).map(([k,v])=>[k,mechanics(v)])):x;
// Same 1e-10 floating tolerance as engine parity; keys and non-numbers stay exact.
function parity(actual,expected,path){if(typeof expected==='number'){assert.ok(Math.abs(actual-expected)<=1e-10,path+': '+actual+' != '+expected);return;}if(expected&&typeof expected==='object'){assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),path);for(const key of Object.keys(expected))parity(actual[key],expected[key],path+'.'+key);return;}assert.equal(actual,expected,path);}
const archmage=skill=>Object.assign(skill,{width:48,finalRadius:32,description:'짧은 집중 후 같은 방향으로 반경 24의 14발 순차 연사(4프레임 간격) · 마지막 강화탄 반경 32 · 기본 피해 160 · 쿨타임 20초'});
test('preserved baseline is the exact upstream Git blob',()=>{
 const bytes=fs.readFileSync('legacy/v32.1/index.html');
 assert.equal(bytes.length,1356097);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'a006aa596c5640ffe127774f271fce7afce81a4769525979fa453f9107ac5d36');
});
test('current content retains every approved permanent ID and only approved base-stat changes',()=>{
 const reference=JSON.parse(fs.readFileSync('tests/baseline/content.json','utf8'));
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),contentHash);
 assert.equal(new Set(manifest.roster.map(a=>a.id)).size,84);
 assert.deepEqual(manifest.tierChances,reference.tierChances);
 for(const key of ['retired','augments','xp','maxLevel','maxChoices','pathMaxTier','deathXpCap','ring','respawn','questions'])assert.deepEqual(manifest[key],reference[key],key);
 assert.deepEqual(manifest.wanggui,{...reference.wanggui,F:[[2,2.25],[2.85,3.45],[3.60,4.85]]});
 assert.deepEqual(manifest.capture,{...reference.capture,version:4,mapRevision:'capture-x-1',mapScale:1,openingMask:3,pointMultipliers:[1,1],pointRadius:400,centerRadius:400,openingSeconds:0});
 for(const old of reference.roster.map(row=>v34Expected(row))){const current=manifest.roster.find(a=>a.id===old.id);if(retired.has(old.id)){assert.equal(current,undefined,old.id+' retired');continue;}assert.ok(current,old.id);
  for(const key of ['name','tier','emoji','radius','speed','damageMult','basic'])parity(current[key],old[key],old.id+' '+key);assert.deepEqual(current.timing,reworked.has(old.id)?{cooldown:old.id==='emoji-034'?945:990}:old.timing,old.id+' timing');
  assert.ok(Math.abs(current.maxHp-old.maxHp*(['B','C'].includes(old.tier)?1.06:1))<1e-9,old.id+' HP');
  parity(mechanics(current.ability),mechanics(old.ability),old.id+' raw ability mechanics');
  const skill=structuredClone(old.skill);if(old.id==='emoji-012')Object.assign(skill,{turretHp:56,durationFrames:1440,duration:1440,description:'HP 56 포탑 설치 · 동시 3개 / 각 24초 · 4번째는 가장 오래된 포탑 교체 · 4회마다 강화탄'});
  if(old.id==='emoji-003')archmage(skill);
  if(reworked.has(old.id)){assert.equal(current.skill.kind,old.id==='emoji-034'?'bowling-strike':'dart-haste');assert.equal(current.skill.cooldown,old.id==='emoji-034'?945:990);}else parity(mechanics(current.skill),mechanics(skill),old.id+' skill (only approved deltas/text may change)');
 }
 for(const [id,old]of Object.entries(reference.reworkDefinitions)){if(retired.has(id)){assert.equal(manifest.reworkDefinitions[id],undefined,id+' retired registration');continue;}const expected=v34Expected(reference.roster.find(row=>row.id===id),old).definition;if(id==='emoji-012')Object.assign(expected.skill,{turretHp:56,durationFrames:1440,duration:1440,description:'HP 56 포탑 설치 · 동시 3개 / 각 24초 · 4번째는 가장 오래된 포탑 교체 · 4회마다 강화탄'});if(id==='emoji-003')archmage(expected.skill);parity(mechanics(manifest.reworkDefinitions[id]),mechanics(expected),id+' rework definition mechanics');}
 const fixtures=JSON.parse(fs.readFileSync('tests/baseline/combat.json','utf8'));
 assert.deepEqual(fixtures.map(f=>f.id),reference.roster.map(a=>a.id));
 assert.ok(fixtures.every(f=>f.start.basic&&f.start.skill&&f.end.runtimeFaults===0));
});
