import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRuleContext} from '../../packages/engine/src/index.js';

const began=performance.now(),baseline=JSON.parse(fs.readFileSync('tests/baseline/content.json','utf8'));
const evidence={baseline:'tests/baseline/content.json (immutable v32.1 effective content)',hp:[],initialCrates:[],waves:{},displacement:[],genie:{},tests:{}};
after(()=>{
 if(!process.env.DSBR_BALANCE_EVIDENCE)return;
 evidence.elapsedMs=performance.now()-began;
 fs.mkdirSync(path.dirname(process.env.DSBR_BALANCE_EVIDENCE),{recursive:true});
 fs.writeFileSync(process.env.DSBR_BALANCE_EVIDENCE,JSON.stringify(evidence,null,2)+'\n');
});
const close=(a,b,label='')=>assert.ok(Math.abs(a-b)<1e-8,`${label}: ${a} != ${b}`);
function fixture(count=8,mode='solo'){
 const r=createRuleContext({seed:'balance-fixture',mode,mapIndex:0});
 const ability=r.EMOJI_DB.find(a=>a.id==='emoji-114');
 const players=Array.from({length:count},(_,i)=>{
  const p=new r.Participant(i+1,'balance-'+i,ability,new r.Vec2(0,0));
  Object.assign(p,{remoteId:'p'+i,sessionId:'p'+i,lastAimDir:new r.Vec2(1,0),applyPlayerInput:()=>{}});return p;
 });
 r.game=new r.GameWorld(players);const g=r.game;
 Object.assign(g,{walls:[],smokes:[],center:new r.Vec2(0,0),worldRadius:3200,mapRadius:3200,mapIndex:0});
 for(let i=0;i<players.length;i++)players[i].pos=new r.Vec2(Math.cos(i/count*Math.PI*2)*1000,Math.sin(i/count*Math.PI*2)*1000);
 g.rebuildSpatialGrid();r.brFarm.init(g);return {r,g,players};
}
function clearCrates(g){g.farmBoxes=[];g.farmGrid.clear();g.teamCrateQueue=[];g.xpBundles=[];}
function advanceFarm(r,g,frame){g.frame=frame;r.brFarm.update(g);}

test('all active B/C actors receive exactly one final pre-mode +6%; other stats/grades unchanged',()=>{
 const r=createRuleContext(),old=createRuleContext();old.ROSTER10_BALANCE.bcHp=1;
 for(const ability of r.EMOJI_DB){
  const a=new r.Participant(1,'after',ability,new r.Vec2(0,0));
  const b=new old.Participant(1,'before',old.EMOJI_DB.find(x=>x.id===ability.id),new old.Vec2(0,0));
  close(a.maxHp,b.maxHp*(['B','C'].includes(ability.t)?1.06:1),ability.id);assert.equal(a.hp,a.maxHp);
  const frozen=baseline.roster.find(x=>x.id===ability.id);if(frozen)close(b.maxHp,frozen.maxHp,ability.id+' immutable baseline');
  evidence.hp.push({id:ability.id,name:ability.n,tier:ability.t,before:b.maxHp,after:a.maxHp,factor:['B','C'].includes(ability.t)?1.06:1,source:frozen?'immutable legacy':'frozen new-roster role median'});
  for(const key of ['radius','speed','damageMult','knockbackResist'])assert.equal(a[key],b[key],ability.id+' '+key);
  const again=new r.Participant(1,'new life',ability,new r.Vec2(0,0));assert.equal(again.maxHp,a.maxHp);
 }
 for(const mode of ['solo','team','team-capture','team-respawn']){
  const x=createRuleContext({mode}),ability=x.EMOJI_DB.find(a=>a.t==='B'),p=new x.Participant(1,'mode',ability,new x.Vec2(0,0));
  const solo=new r.Participant(1,'solo',r.EMOJI_DB.find(a=>a.id===ability.id),new r.Vec2(0,0));
  close(p.maxHp,solo.maxHp*x.brModeHpMultiplier(x.session.roomMeta.mode));
 }
});

test('initial XP targets use old final count ×1.10 and cap46; farm RNG stays separate',()=>{
 for(const count of [5,8,20,30,40]){
  const {r,g}=fixture(count),before=Math.min(42,Math.max(8,Math.round(count*1.28)));
  assert.equal(g.farmBoxes.length,Math.min(46,Math.round(before*1.10)));
  assert.equal(g.teamCrateCap,Math.min(46,Math.round(before*1.10))+4);
  evidence.initialCrates.push({players:count,before,after:g.farmBoxes.length,totalRespawnCap:g.teamCrateCap});
  r.seedRandom('untouched-combat');const expected=r.rand();r.seedRandom('untouched-combat');r.brFarm.init(g);assert.equal(r.rand(),expected);
  for(const box of g.farmBoxes){assert.equal(box.hp,1);assert.equal(box.maxHp,1);assert.equal(box.kind,'xp');}
 }
});

test('independent deterministic wave carry yields +10% XP / +15% heal without missed-wave bursts',()=>{
 const {r,g}=fixture(8);clearCrates(g);
 advanceFarm(r,g,1199);assert.equal(g.farmBoxes.length,0);
 let xp=0,heal=0;
 for(let wave=1;wave<=10;wave++){
  clearCrates(g);advanceFarm(r,g,wave*1200);
  xp+=g.farmBoxes.filter(x=>x.kind==='xp').length;heal+=g.farmBoxes.filter(x=>x.kind==='heal').length;
  assert.ok(g.xpWaveCarry>=0&&g.xpWaveCarry<1);assert.ok(g.healWaveCarry>=0&&g.healWaveCarry<1);
 }
 assert.equal(xp,22);assert.equal(heal,23);close(g.xpWaveCarry,0);close(g.healWaveCarry,0);
 evidence.waves={players:8,waves:10,intervalTicks:1200,xp:{before:20,after:xp,carry:g.xpWaveCarry},heal:{before:20,after:heal,carry:g.healWaveCarry},xpWaveCap:9,xpCap:53,healCap:7,adaptiveXpCap:'min(53,max(12,ceil(alive*1.6*1.10)))'};
 clearCrates(g);advanceFarm(r,g,120000);assert.ok(g.farmBoxes.filter(x=>x.kind==='xp').length<=3);
 assert.ok(g.farmBoxes.filter(x=>x.kind==='heal').length<=3);
 // Failed placement never stores a backlog; only the fractional part survives.
 const collision=g.checkWallCollision;g.checkWallCollision=()=>true;clearCrates(g);
 for(let n=1;n<=12;n++)advanceFarm(r,g,120000+n*1200);
 assert.equal(g.farmBoxes.length,0);g.checkWallCollision=collision;
 advanceFarm(r,g,135600);assert.ok(g.farmBoxes.length<=6);
 r.brFarm.init(g);assert.equal(g.xpWaveCarry,0);assert.equal(g.healWaveCarry,0);
});

test('XP/health bounds, max-level suppression and shrinking late arena remain active',()=>{
 const {r,g,players}=fixture(30);clearCrates(g);let largest=0;
 for(let wave=1;wave<=10;wave++){clearCrates(g);advanceFarm(r,g,wave*1200);largest=Math.max(largest,g.farmBoxes.filter(x=>x.kind==='xp').length);}
 assert.equal(largest,9);
 for(let wave=11;wave<=30;wave++){advanceFarm(r,g,wave*1200);assert.ok(g.farmBoxes.filter(x=>x.kind==='xp').length<=53);assert.ok(g.farmBoxes.filter(x=>x.kind==='heal').length<=7);}
 clearCrates(g);for(const p of players)p.run.level=r.BR_RUN_MAX_LEVEL;advanceFarm(r,g,37200);assert.equal(g.farmBoxes.filter(x=>x.kind==='xp').length,0);
 clearCrates(g);g.worldRadius=g.mapRadius=400;advanceFarm(r,g,38400);assert.equal(g.farmBoxes.length,0);
});

test('respawn XP leaves four heal slots; destroyed and expired heal reservations cannot overfill',()=>{
 const {r,g,players}=fixture(20,'team-respawn'),initial=g.farmBoxes.length;
 for(let wave=1;wave<=6;wave++)advanceFarm(r,g,wave*1200);
 assert.equal(g.teamXpCrateCap,initial);assert.equal(g.teamCrateCap,initial+4);
 assert.equal(g.farmBoxes.filter(x=>x.kind==='heal').length+g.teamCrateQueue.filter(x=>x.kind==='heal').length,4);
 for(const box of g.farmBoxes.filter(x=>x.kind==='heal'))r.brFarm.damage(g,box,players[0],2,'destroy-'+box.id);
 const total=()=>g.farmBoxes.length+g.teamCrateQueue.length;
 assert.equal(total(),g.teamCrateCap);
 for(let n=1;n<=200;n++){
  advanceFarm(r,g,7200+n*30);
  assert.ok(total()<=g.teamCrateCap);assert.ok(g.teamCrateQueue.length<=64);
  assert.ok(g.farmBoxes.filter(x=>x.kind==='heal').length+g.teamCrateQueue.filter(x=>x.kind==='heal').length<=7);
  assert.ok(g.farmBoxes.filter(x=>x.kind==='xp').length+g.teamCrateQueue.filter(x=>x.kind==='xp').length<=initial);
 }
 assert.equal(total(),g.teamCrateCap);
});

function knockbackFixture(factor=0.88){
 const f=fixture(2);f.r.ROSTER10_BALANCE.rangedPush=factor;clearCrates(f.g);
 const [owner,target]=f.players;owner.pos=new f.r.Vec2(0,0);target.pos=new f.r.Vec2(100,0);target.knockbackResist=1;
 owner.damageMult=1;f.g.rebuildSpatialGrid();return {...f,owner,target};
}
test('native ranged direct/blast/turret forces apply .88 once; orbit, pull, zero stay intact',()=>{
 for(const options of [{},{explode:160},{playerSkillBlast:true,explode:160},{type:'ORBIT',expected:1},{status:'pull',expected:1},{knockback:0}]){
  const {r,g,owner,target}=knockbackFixture(),strength=options.knockback??10,expected=strength*(options.expected??.88);
  const shot=new r.Projectile(owner,new r.Vec2(60,0),new r.Vec2(1,0),12,5,8,options.type||'BULLET','#fff',options.explode||0,null,{...options,knockback:strength,normalizedSkillStats:true});
  close(shot.knockback,expected);shot.hit(g,target);
  close(target.rw?.impulse?.x||0,expected);assert.equal(target.stunned,0);
 }
 // Crate blast has an old 12-force floor: it is reduced after the floor, once.
 const {r,g,owner,target}=knockbackFixture(),box={id:999,pos:new r.Vec2(60,0),halfSize:48,radius:68,hp:1,maxHp:1,kind:'xp',born:0,lastHits:new Map()};
 g.farmBoxes.push(box);const shot=new r.Projectile(owner,new r.Vec2(60,0),new r.Vec2(1,0),12,5,8,'BULLET','#fff',160,null,{knockback:3,normalizedSkillStats:true});
 r.brFarm.projectileHit(g,shot,box);close(target.vel.x,12*.88);
});

test('rework projectile and lob descendant blasts scale once; melee/orbit/hook contexts do not',()=>{
 for(const kind of ['projectile','lob','orbit','hook','dash','bomb','zone']){
  const {r,g,owner,target}=knockbackFixture(),R=r.BRRework,c=R.context(owner,g,new r.Vec2(1,0));
  const e=R.entity(c,kind,{duration:30});R.hit(e.ctx,target,1,{knockback:10,direction:new r.Vec2(1,0)});
  close(target.rw.impulse.x,['projectile','lob'].includes(kind)?8.8:10,kind);
 }
 // Real projectile onEnd -> area must retain ranged provenance and never mutate
 // its raw force. Reusing it for a piercing/multihit projectile cannot compound .88.
 const {r,g,owner,target}=knockbackFixture(),R=r.BRRework,c=R.context(owner,g,new r.Vec2(1,0));
 const e=R.projectile(c,{pos:new r.Vec2(100,0),damage:0,range:300,knockback:10,onEnd:(ctx,shot)=>R.area(ctx,shot.pos,180,1,{knockback:10})});
 target.pos=new r.Vec2(130,0);g.rebuildSpatialGrid();R.end(e,'hit');close(target.rw.impulse.x,8.8);assert.equal(e.knockback,10);
 target.rw.impulse=null;R.hit(e.ctx,target,1,{knockback:10,direction:new r.Vec2(1,0)});close(target.rw.impulse.x,8.8);
});

test('native and rework measured first-step displacement is .88 with unchanged damage/stun',()=>{
 for(const rework of [false,true]){
  const outputs=[];
  for(const factor of [1,.88]){
   const {r,g,owner,target}=knockbackFixture(factor),hp=target.hp,start=target.pos.x;
   if(rework){const R=r.BRRework,c=R.context(owner,g,new r.Vec2(1,0)),shot=R.projectile(c,{damage:1,knockback:14,stun:24});R.hit(shot.ctx,target,1,{knockback:14,stun:24,direction:new r.Vec2(1,0)});R.end(shot,'fixture');}
   else new r.Projectile(owner,new r.Vec2(60,0),new r.Vec2(1,0),12,1,8,'BULLET','#fff',0,null,{knockback:14,status:'stun',statusPower:24,normalizedSkillStats:true}).hit(g,target);
   const hard=target.rw.impulse.hard,stunned=target.stunned;g.frame++;r.BRRework.tick(g);
   outputs.push({displacement:target.pos.x-start,damage:hp-target.hp,stunned,hard});
  }
  close(outputs[1].displacement,outputs[0].displacement*.88);assert.equal(outputs[0].damage,outputs[1].damage);assert.equal(outputs[0].stunned,outputs[1].stunned);assert.equal(outputs[0].hard,outputs[1].hard);
  evidence.displacement.push({path:rework?'rework traveling projectile':'native projectile',before:outputs[0],after:outputs[1],factor:outputs[1].displacement/outputs[0].displacement});
 }
});

test('Genie HP56 / 1440 ticks with three-slot replacement and existing duration multiplier',()=>{
 const {r,g}=fixture(2),R=r.BRRework,ability=r.EMOJI_DB.find(x=>x.id==='emoji-012'),owner=new r.Participant(33,'genie',ability,new r.Vec2(-600,0));
 Object.assign(owner,{remoteId:'genie',lastAimDir:new r.Vec2(1,0)});g.participants.push(owner);g.rebuildSpatialGrid();
 const s=R.defs[ability.id].skill;
 assert.equal(s.turretHp,56);assert.equal(s.durationFrames,1440);assert.equal(s.cooldownFrames,420);assert.equal(s.range,250);assert.equal(s.turretRange,780);assert.equal(s.damage,15.45);assert.equal(s.heavyDamage,27.81);assert.equal(s.turretCooldownFrames,42);
 evidence.genie={before:{hp:70,lifeTicks:1800},after:{hp:s.turretHp,lifeTicks:s.durationFrames},preserved:{cooldownTicks:s.cooldownFrames,installRange:s.range,attackRange:s.turretRange,damage:s.damage,heavyDamage:s.heavyDamage,shotIntervalTicks:s.turretCooldownFrames,maxOwned:3}};
 for(let i=0;i<4;i++){owner.cooldown=0;R.cast(owner,g,new r.Vec2(1,0));}
 let live=g.rw.entities.filter(e=>e.kind==='turret'&&!e.dead);assert.equal(live.length,3);assert.equal(g.rw.entities.filter(e=>e.kind==='turret'&&e.reason==='replaced').length,1);
 for(const t of live){assert.equal(t.hp,56);assert.equal(t.maxHp,56);assert.equal(t.duration,1440);}
 const c=R.context(owner,g,new r.Vec2(1,0));c.run.duration=1.25;
 const enhanced=R.turret(c,{hp:s.turretHp,duration:s.durationFrames});assert.equal(enhanced.duration,1800);assert.equal(enhanced.hp,56);
 const other=R.turret(c,{});assert.equal(other.hp,138);assert.equal(other.duration,2250);
});

test('native turret and Genie turret actually emit ranged shots with one force reduction',()=>{
 const {r,g,owner,target}=knockbackFixture();
 owner.ability={...owner.ability,sub:'GOLDEN_TURRET'};
 const turret=new r.Turret(owner,new r.Vec2(0,0));turret.update(g);
 const native=g.projectiles.at(-1);assert.ok(native);close(native.knockback,6*.88);native.hit(g,target);close(target.rw.impulse.x,6*.88);
 const ability=r.EMOJI_DB.find(x=>x.id==='emoji-012'),genie=new r.Participant(33,'genie',ability,new r.Vec2(-300,0));
 Object.assign(genie,{remoteId:'genie',lastAimDir:new r.Vec2(1,0)});g.participants.push(genie);g.rebuildSpatialGrid();
 r.BRRework.cast(genie,g,new r.Vec2(1,0));
 const installed=g.rw.entities.find(e=>e.kind==='turret');g.frame=42;r.BRRework.tick(g);
 const shot=g.rw.entities.find(e=>e.kind==='projectile'&&e.ctx.owner===genie);assert.ok(shot);assert.equal(shot.actionKind,'summon');assert.equal(shot.knockback,1);assert.equal(shot.ctx.rangedProjectile,true);
 target.rw.impulse=null;r.BRRework.hit(shot.ctx,target,shot.damage,{knockback:shot.knockback,direction:new r.Vec2(1,0)});close(target.rw.impulse.x,.88);
 assert.equal(installed.cooldown,42);assert.equal(installed.shots,1);
});
