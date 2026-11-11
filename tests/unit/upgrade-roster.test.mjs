import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,createRuleContext,destroyWorld} from '../../packages/engine/src/index.js';
const retired=['emoji-048','emoji-065','emoji-073','emoji-076'];
function fixture(id='emoji-034'){
 const events=[],w=createWorld(undefined,{},'upgrade-roster',[{id:'a',name:'A',abilityId:id},{id:'b',name:'B',abilityId:'emoji-114'},{id:'c',name:'C',abilityId:'emoji-114'}],e=>events.push(e)),[p,q,z]=['a','b','c'].map(id=>w.byId.get(id));
 w.game.walls=[];w.game.smokes=[];w.brFarm.dispose(w.game);for(const [i,a]of [p,q,z].entries()){a.pos=new w.Vec2(i*240,0);a.vel=new w.Vec2(0,0);a.spawnProtectionUntilFrame=0;a.hp=a.maxHp=10000;a.combatPreviousX=a.pos.x;a.combatPreviousY=0;}w.game.rebuildSpatialGrid();
 return {w,p,q,z,events,tick(n){for(let i=0;i<n;i++){w.game.frame++;w.timeMs=w.game.frame*1000/60;w.BRRework.tick(w.game);}}};
}
test('84 active stable IDs, deleted skills cannot instantiate, rank chances stay fixed',()=>{
 const r=createRuleContext();assert.equal(r.EMOJI_DB.length,84);assert.equal(new Set(r.EMOJI_DB.map(a=>a.id)).size,84);assert.deepEqual(r.BR_TIER_CHANCES,[['S',.1],['A',.2],['B',.25],['C',.3],['F',.15]]);
 for(const id of retired){assert.ok(!r.EMOJI_DB.some(a=>a.id===id));assert.ok(!r.BRRework.defs[id]);assert.ok(!r.BR_V32_NATIVE_SKILLS.has(id));assert.ok(!r.BR_V32_SKILL_FIELDS[id]);assert.throws(()=>createWorld(undefined,{},'removed',[{id:'old',name:'Old',abilityId:id}]),/INVALID_ABILITY/);}
 for(const id of ['emoji-034','emoji-070'])assert.ok(!r.BR_V32_NATIVE_SKILLS.has(id));
});
test('Bowling is one straight 36-radius ball, unchanged basic, once-per-target direction and cooldown',()=>{
 const f=fixture(),{w,p,q,z}=f;try{
  const before=w.brProgressionCombat.basicProfile(p.ability);assert.equal(before.bounces,2);assert.equal(before.pierce,false);assert.equal(before.speed,14.976);assert.equal(before.range,792);
  assert.ok(w.BRRework.cast(p,w.game,new w.Vec2(1,0)));assert.equal(p.cooldown,945);const shots=w.game.rw.entities.filter(e=>e.kind==='projectile');assert.equal(shots.length,1);const s=shots[0];assert.deepEqual([s.radius,s.speed,s.range,s.damage,s.bounces,s.pierce],[36,22,900,21,0,true]);
  f.tick(30);assert.ok(q.hp<q.maxHp&&z.hp<z.maxHp);assert.equal(s.hits.size,2);const hp=[q.hp,z.hp];assert.ok(q.rw.impulse.x>0);assert.equal(q.rw.impulse.y,0);assert.equal(q.stunned,0);assert.equal(p.hp,p.maxHp);
  f.tick(20);assert.deepEqual([q.hp,z.hp],hp);assert.ok(s.dead);assert.equal(w.game.projectiles.length,0);
 }finally{destroyWorld(w);}
});
test('Bowling blocks at walls, excludes allies/protection, augments size once',()=>{
 const f=fixture(),{w,p,q,z}=f;try{
  p.team=1;q.team=1;z.spawnProtectionUntilFrame=1000;p.run.mods.skillSize=1.25;w.game.walls=[new w.Wall(650,0,40,400,0)];w.game.rebuildSpatialGrid();w.BRRework.cast(p,w.game,new w.Vec2(1,0));const s=w.game.rw.entities.find(e=>e.kind==='projectile');assert.equal(s.radius,45);f.tick(45);assert.equal(q.hp,q.maxHp);assert.equal(z.hp,z.maxHp);assert.equal(s.reason,'wall');assert.ok(s.pos.x<650);assert.equal(s.bounceCount,0);
 }finally{destroyWorld(w);}
});
function dart({offset=0,speed=20.7,moving=0,protectedTarget=false,invisible=false,skill=false}={}){
 const f=fixture('emoji-070'),{w,p,q,z}=f;z.pos=new w.Vec2(-1000,-1000);q.pos=new w.Vec2(240,offset);q.combatPreviousX=q.pos.x;q.combatPreviousY=offset-moving;q.spawnProtectionUntilFrame=protectedTarget?10000:0;q.invisible=invisible;w.game.rebuildSpatialGrid();
 w.brBasicAttack(p,w.game,new w.Vec2(1,0));const shot=w.game.projectiles[0];shot.vel=new w.Vec2(speed,0);if(skill){shot.inputKind='skill';shot.impactStyle='';}
 for(let i=0;i<30;i++){w.game.frame++;shot.update(w.game);}const loss=q.maxHp-q.hp,style=f.events.filter(e=>e.type==='FX'&&e.data?.kind==='hit').map(e=>e.data.style);destroyWorld(w);return {loss,style};
}
test('Dart central incoming trajectory multiplies one damage result by1.5; edge and skill unchanged',()=>{
 const center=dart(),edge=dart({offset:50}),fast=dart({speed:450}),bigEdge=dart({offset:60});assert.ok(edge.loss>0);assert.ok(Math.abs(center.loss-edge.loss*1.5)<1e-8);assert.equal(fast.loss,center.loss);assert.equal(bigEdge.loss,edge.loss);assert.ok(center.style.includes('dart-center'));assert.ok(!edge.style.includes('dart-center'));assert.ok(!dart({skill:true}).style.includes('dart-center'));
 assert.equal(dart({protectedTarget:true}).loss,0);assert.ok(!dart({invisible:true}).style.includes('dart-center'));
});
test('Dart moving-target relative sweep and piercing each target once use existing collision',()=>{
 assert.ok(dart({speed:450,moving:8}).style.includes('dart-center'));
 const f=fixture('emoji-070'),{w,p,q,z}=f;try{w.brBasicAttack(p,w.game,new w.Vec2(1,0));const s=w.game.projectiles[0];s.vel=new w.Vec2(500,0);w.game.frame++;s.update(w.game);assert.ok(q.hp<q.maxHp&&z.hp<z.maxHp);const hp=[q.hp,z.hp];s.pos=new w.Vec2(0,0);w.game.frame++;s.update(w.game);assert.deepEqual([q.hp,z.hp],hp);}finally{destroyWorld(w);}
});
test('Dart self haste is1.30 for300ticks without shots/locks, not stacked and cleared on new life',()=>{
 const f=fixture('emoji-070'),{w,p}=f;try{
  assert.ok(w.BRRework.cast(p,w.game,new w.Vec2(1,0)));assert.equal(p.cooldown,990);assert.equal(w.BRRework.cooldownRate(p,'attack'),1.3);assert.equal(w.BRRework.cooldownRate(p,'skill'),1);assert.ok(!w.BRRework.inputLocks(p,w.game).attack);assert.ok(!w.BRRework.inputLocks(p,w.game).move);assert.equal(w.game.rw.entities.filter(e=>e.kind==='projectile').length,0);assert.equal(w.game.projectiles.length,0);assert.equal(w.BRRework.cast(p,w.game,new w.Vec2(1,0)),false);assert.equal(p.rw.buffs.length,1);
  f.tick(299);assert.equal(w.BRRework.cooldownRate(p,'attack'),1.3);f.tick(1);assert.equal(w.BRRework.cooldownRate(p,'attack'),1);
  p.cooldown=0;w.BRRework.cast(p,w.game,new w.Vec2(1,0));p.lifeSeq++;assert.equal(w.BRRework.cooldownRate(p,'attack'),1);assert.equal(p.rw.buffs.length,0);
 }finally{destroyWorld(w);}
});
test('Dart fixed300tick sample measures centered/edge damage and unchanged base cadence',t=>{
 // Anchor the target each tick: knockback behavior is covered separately above.
 function sample(haste,offset){const f=fixture('emoji-070'),{w,p,q,z}=f;try{z.pos=new w.Vec2(-2000,-2000);q.pos=new w.Vec2(240,offset);q.combatPreviousX=240;q.combatPreviousY=offset;w.game.rebuildSpatialGrid();if(haste)w.BRRework.cast(p,w.game,new w.Vec2(1,0));let count=0;for(let i=0;i<350;i++){w.game.frame++;w.timeMs=w.game.frame*1000/60;w.BRRework.tick(w.game);q.pos=new w.Vec2(240,offset);q.vel=new w.Vec2(0,0);q.combatPreviousX=240;q.combatPreviousY=offset;if(q.rw)q.rw.impulse=null;w.game.rebuildSpatialGrid();p.basicCooldown=Math.max(0,p.basicCooldown-w.brCooldownRate(p,'attack'));if(i<300&&p.basicCooldown<=0){w.brBasicAttack(p,w.game,new w.Vec2(1,0));count++;}for(const s of w.game.projectiles)s.update(w.game);}return {count,damage:q.maxHp-q.hp,cadence:w.brBasicAttackFrames(p.ability)};}finally{destroyWorld(w);}}
 const edge=sample(false,50),center=sample(false,0),buffed=sample(true,0);t.diagnostic(JSON.stringify({windowTicks:300,drainTicks:50,edge,center,buffed}));assert.equal(center.count,edge.count);assert.ok(Math.abs(center.damage/edge.damage-1.5)<1e-8);assert.equal(buffed.cadence,center.cadence);assert.ok(buffed.count>center.count);assert.ok(buffed.count<=Math.ceil(center.count*1.3));assert.ok(Math.abs(buffed.damage/center.damage-buffed.count/center.count)<1e-8);
});
