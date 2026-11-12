import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRuleContext,createWorld,stepWorld,destroyWorld,getTeacherState} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
const retired=new Set(['emoji-048','emoji-065','emoji-073','emoji-076']),reworked=new Set(['emoji-034','emoji-070']);
const fixtures=JSON.parse(fs.readFileSync('tests/baseline/combat.json','utf8'));
function parity(actual,expected,path='root'){
 if(typeof expected==='number'){assert.ok(Math.abs(actual-expected)<=1e-10,`${path}: ${actual} != ${expected}`);return;}
 if(expected&&typeof expected==='object'){assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),path);for(const key of Object.keys(expected))parity(actual[key],expected[key],path+'.'+key);return;}
 assert.equal(actual,expected,path);
}
test('all active effective actor stats and final basic profiles match the real browser baseline',()=>{
 const r=createRuleContext();
 for(const a of manifest.roster){const ability=r.EMOJI_DB.find(b=>b.id===a.id),p=new r.Participant(1,'actor',ability,new r.Vec2(0,0));
  for(const key of ['maxHp','radius','speed','damageMult'])assert.equal(p[key],a[key],`${a.id} ${key}`);
  parity(JSON.parse(JSON.stringify(r.brProgressionCombat.basicProfile(ability))),a.basic,a.id);
 }
});
for(const expected of fixtures)test(`${retired.has(expected.id)?'approved retirement rejects historical ID':reworked.has(expected.id)?'approved rework replaces historical skill only':'legacy parity with only approved balance deltas normalized'}: ${expected.id}`,()=>{
 if(retired.has(expected.id)){assert.throws(()=>createWorld(undefined,{},'retired-fixture',[{id:'retired',name:'Retired',abilityId:expected.id}]),/INVALID_ABILITY/);return;}
 const r=createRuleContext({seed:'fixture',matchId:'fixture|1|1'});
 // Preserve every original combat fixture/assertion. The live defaults are
 // separately checked by roster10 balance tests, never by rewriting goldens.
 Object.assign(r.ROSTER10_BALANCE,{bcHp:1,rangedPush:1,farmInitial:1,farmXpWave:1,farmHealWave:1,initialCap:42,xpWaveCap:8,xpCap:48,healCap:6,respawnExtra:3,genieHp:70,genieTicks:1800});
 Object.assign(r.BRRework.defs['emoji-012'].skill,{turretHp:70,durationFrames:1800});
 // Only the approved collision-size delta is normalized for the immutable golden.
 // Actual 24/32 radii and unchanged damage/timing are asserted by classroom tests.
 Object.assign(r.BRRework.defs['emoji-003'].skill,{width:38,finalRadius:26});
 // Golden trajectories retain the legacy steering and beam coefficient. v34 live values have their own combat tests.
 r.BRRework.defs['emoji-132'].skill.damage=8.736;
 r.BRRework.defs['emoji-036'].skill.turnRate=.055;
 // Compare the historical trajectory at historical coefficients. The v35
 // authority tests separately exercise the live projectiles, impulse and HP.
 for(const [id,fields] of Object.entries({'emoji-000':{zoneDamage:8.4},'emoji-007':{zoneDamage:7.35},'emoji-010':{damage:8.24},'emoji-014':{damage:10.3},'emoji-025':{damage:58,knockback:30,wallDamage:14}}))Object.assign(r.BRRework.defs[id].skill,fields);
 r.seedRandom('parity|'+expected.id);r.teamMode=0;
 const a=r.EMOJI_DB.find(a=>a.id===expected.id),target=r.EMOJI_DB.find(a=>a.id==='emoji-114');
 const p=new r.Participant(1,'actor',a,new r.Vec2(0,0)),q=new r.Participant(2,'target',target,new r.Vec2(180,0));
 for(const [i,x]of [p,q].entries()){Object.assign(x,{remoteId:'p'+i,sessionId:'s'+i,abilityIndex:r.EMOJI_DB.indexOf(x.ability),lastAimDir:new r.Vec2(1,0),basicCooldown:0,skillUsesLeft:-1,maxSkillUses:-1,applyPlayerInput:()=>{}});}
 r.game=new r.GameWorld([p,q]);r.game.walls=[];r.game.smokes=[];r.game.supplyDropSpawnFrame=999999;
 p.pos=new r.Vec2(0,0);q.pos=new r.Vec2(180,0);r.game.rebuildSpatialGrid();r.brRingInitWorld(r.game,0);
 const basic=r.brBasicAttack(p,r.game,new r.Vec2(1,0));p.cooldown=0;const skill=r.brCastPlayerSkill(p,r.game,new r.Vec2(1,0),1);
 const start={basic:basic===true,skill:skill!==false,projectiles:r.game.projectiles.length,zones:r.game.zones.length,turrets:r.game.turrets.length,reworks:r.game.rw?.entities.map(e=>e.kind)||[]};
 for(let tick=1;tick<=180;tick++){r.timeMs=tick*1000/60;r.game.update();}
 const end={frame:r.game.frame,hp:p.hp,targetHp:q.hp,x:p.pos.x,y:p.pos.y,targetX:q.pos.x,targetY:q.pos.y,damage:p.damageDealt,alive:p.alive,projectiles:r.game.projectiles.length,zones:r.game.zones.length,reworks:r.game.rw?.entities.filter(e=>!e.dead).map(e=>e.kind)||[],runtimeFaults:(p.runtimeFaults||0)+(q.runtimeFaults||0)};
 if(expected.id==='emoji-006'||expected.id==='emoji-028'){
  assert.equal(start.skill,true);assert.equal(start.basic,true);assert.equal(end.runtimeFaults,0);assert.equal(end.frame,expected.end.frame);
  assert.deepEqual(start.reworks,expected.id==='emoji-006'?['dash']:[]);
  assert.equal(end.alive,true);assert.ok(end.hp>0);assert.ok(end.targetHp<=q.maxHp);
  assert.equal(end.projectiles,0);assert.equal(end.zones,0);
 }else if(reworked.has(expected.id)){
  assert.equal(start.basic,true);assert.equal(start.skill,true);assert.equal(end.runtimeFaults,0);
  const definition=r.BRRework.defs[expected.id].skill;
  if(expected.id==='emoji-034'){assert.deepEqual(start.reworks,['projectile']);assert.deepEqual([definition.radius,definition.speed,definition.range,definition.damage,definition.knockback,definition.bounces],[36,22,900,21,42,0]);assert.ok(end.targetHp<q.maxHp);}
  else{assert.deepEqual(start.reworks,['warning']);assert.deepEqual([definition.duration,definition.attackHaste,definition.cooldown],[300,1.3,990]);assert.equal(r.BRRework.cooldownRate(p,'attack'),1.3);}
 }else{parity(start,expected.start);parity(end,expected.end);}
});
test('two room simulations have isolated mutable registries, world state and RNG',()=>{
 const entries=[{id:'a',name:'A',abilityId:'emoji-003'},{id:'b',name:'B',abilityId:'emoji-114'}];
 const a=createWorld(undefined,{},'seed-a',entries),b=createWorld(undefined,{},'seed-b',entries),control=createWorld(undefined,{},'seed-a',entries);
 for(let i=0;i<120;i++){stepWorld(a);for(let j=0;j<3;j++)stepWorld(b);stepWorld(control);}
 assert.deepEqual(getTeacherState(a),getTeacherState(control));
 assert.notEqual(a.BRRework,b.BRRework);assert.notEqual(a.EMOJI_DB,b.EMOJI_DB);
 for(const w of [a,b,control])destroyWorld(w);
});
