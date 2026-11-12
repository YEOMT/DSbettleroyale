import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,createRuleContext,stepWorld,destroyWorld,getTeacherState,getVisibleState} from '../../packages/engine/src/index.js';
import {ironActive,reflectedDirection,sniperCast,sniperChances,steerReturn} from '../../packages/engine/src/combat/reflection.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
import {aimGuide} from '../../apps/client/src/render/aim-guide.js';

function setup(t,ids){
 const w=createWorld(undefined,{mode:'team-elim',mapIndex:0},'evolution',ids.map((abilityId,i)=>({id:'p'+i,name:'Test '+i,abilityId,team:i?2:1})));
 t.after(()=>destroyWorld(w));const g=w.game,R=w.BRRework,v=(x,y=0)=>new w.Vec2(x,y),players=ids.map((_,i)=>w.byId.get('p'+i));
 g.finalPhaseTriggered=true;w.brFarm.dispose(g);g.walls=[];g.smokes=[];g.zones=[];
 function place(p,x,y=0){p.pos=v(x,y);p.vel=v(0);p.combatPreviousX=x;p.combatPreviousY=y;p.combatPreviousWarp=p.warpSeq||0;}
 players.forEach((p,i)=>{place(p,i*450);p.spawnProtectionUntilFrame=0;p.maxHp=p.hp=4000;p.cooldown=p.basicCooldown=0;});
 g.rebuildSpatialGrid();const tick=n=>{for(let i=0;i<n;i++)stepWorld(w);};
 return {w,g,R,v,players,tick,place,cast:(p,dir=v(-1))=>R.cast(p,g,dir,1)};
}
function launch(f,p,kind,extra={}){
 const {w,g,R,v}=f;
 if(kind==='native'){
  const q=new w.Projectile(p,p.pos,v(1),185,40,8,extra.homing?'missile':'bullet','#fff',0,null,{impactStyle:'ranged-basic',rangeRemaining:1500,...extra});g.projectiles.push(q);return q;
 }
 return R.projectile(R.context(p,g,v(1)),{dir:v(1),speed:185,range:1500,radius:8,damage:40,...extra});
}
for(const path of ['native','rework'])for(const defender of ['emoji-028','emoji-153']){
 test(path+' returns one live projectile to its original shooter, once, with snapshotted power '+defender,t=>{
  const f=setup(t,['emoji-052',defender]),{w,g,R,players:[a,b]}=f;
  a.run.paths.wanggui=3;w.brRecomputeRun(a);a.combatBuff={kind:'attack',life:a.lifeSeq,end:600};
  assert.ok(f.cast(b));const shot=launch(f,a,path,{pierce:true,homing:true}),before=b.hp,initial=a.hp;
  f.tick(4);assert.equal(shot.reflectedOnce,true);assert.equal(shot.owner,b);assert.equal(b.hp,before);
  b.combatBuff={kind:'attack',life:b.lifeSeq,end:600};a.combatBuff=null;
  f.tick(3);assert.ok(a.hp<initial);const amount=40*7.2*1.45*(path==='rework'?a.damageMult:1);
  assert.ok(Math.abs(initial-a.hp-amount)<.001,'actual reflected loss '+(initial-a.hp)+' expected '+amount);
  assert.ok(Math.abs(b.damageDealt-(initial-a.hp))<.001);
  assert.ok(!g.projectiles.concat(R.world(g).entities).some(e=>e!==shot&&e.reflectedOnce));
 });
}
test('front/back, earlier cover, friendly shots, second shield and nonprojectile damage',t=>{
 const f=setup(t,['emoji-028','emoji-153','emoji-028']),{w,R,g,players:[a,b,c],v}=f;
 f.place(c,1200,500);g.rebuildSpatialGrid();f.cast(a,v(1));f.cast(b);
 const e=launch(f,a,'rework');f.tick(6);assert.equal(e.reflectedOnce,true);assert.ok(a.hp<4000);assert.equal(e.ctx.owner,b);
 const before=a.hp;a.takeDamage(30,b,false,null,{rw:true,periodic:true});assert.equal(a.hp,before-30);
 f.place(a,1050);g.rebuildSpatialGrid();
 const back=R.projectile(R.context(a,g,v(-1)),{speed:160,dir:v(-1),range:1200,damage:40,radius:7});f.tick(6);assert.ok(!back.reflectedOnce);
 f.place(a,0);g.walls=[new w.Wall(150,0,30,180,0)];g.rebuildSpatialGrid();
 const wall=launch(f,a,'native');f.tick(4);assert.ok(!wall.reflectedOnce);
 g.walls=[];a.team=b.team;const friendly=launch(f,a,'rework');f.tick(5);assert.ok(!friendly.reflectedOnce);
 b.cooldown=0;f.cast(b);assert.equal(g.rw.mirrors.length,1);
 b.alive=false;R.cleanup(b,g,'death');assert.equal(g.rw.mirrors.length,0);
});
test('spotlight has one warning, no damage, ignores walls, respects teams, range, cancel and CONTROL cap',t=>{
 const f=setup(t,['emoji-152','emoji-114','emoji-114','emoji-114']),{w,g,R,players:[p,q,z,ally]}=f;
 f.place(q,425);f.place(z,580);f.place(ally,240);ally.team=p.team;g.walls=[new w.Wall(310,0,22,300,0)];g.rebuildSpatialGrid();
 for(const [control,expected] of [[1,180],[1.715,216]]){
  p.cooldown=0;p.run.mods.skillControl=control;q.stunned=0;assert.ok(f.cast(p));f.tick(35);assert.equal(q.stunned,0);
  assert.equal(getTeacherState(w).shots.filter(e=>e.kind==='spotlight').length,1);
  f.tick(1);assert.equal(q.stunned,expected);assert.equal(ally.stunned,0);assert.equal(z.stunned,0);assert.equal(q.hp,4000);
  assert.equal(getVisibleState(w,q.remoteId).self.rw.stunEnd,g.frame+expected);
  f.tick(expected);assert.equal(q.stunned,0);
 }
 p.cooldown=0;f.cast(p);p.stunned=12;f.tick(40);assert.equal(q.stunned,0);assert.equal(getTeacherState(w).shots.filter(e=>e.kind==='spotlight').length,0);
});
test('fixed-seed sniper rolls are per accepted whitelisted skill; scoped crit persists through a piercing native return',t=>{
 const r=createRuleContext();assert.deepEqual(sniperChances,{S:.6,A:.5,B:.4,C:.3,F:.3});
 for(const id of ['emoji-023','emoji-137','emoji-074']){
  const a=r.EMOJI_DB.find(x=>x.id===id);r.seedRandom('sniper-sample-'+id);let count=0;
  for(let i=0;i<12000;i++)if(sniperCast(r,a).critical)count++;
  assert.ok(Math.abs(count/12000-sniperChances[a.t])<.02);
 }
 assert.equal(sniperCast({rand:()=>assert.fail()},r.EMOJI_DB.find(x=>x.id==='emoji-132')),undefined);
 const f=setup(t,['emoji-137','emoji-028','emoji-114']),{w,g,players:[a,b,c],v}=f;
 f.place(a,0);f.place(b,600);f.place(c,310);g.rebuildSpatialGrid();f.cast(b);
 const fire=()=>{a.cooldown=0;return w.brCastPlayerSkill(a,g,v(1),1);};
 w.rand=()=>0;assert.notEqual(fire(),false);const q=g.projectiles[0];
 assert.equal(q.sniper.critical,true);assert.ok(q.pierce);const base=q.damage;
 f.tick(60);assert.equal(q.reflectedOnce,true);assert.ok(c.hp<4000);assert.ok(a.hp<4000);assert.equal(b.hp,4000);
 w.rand=()=>.99;fire();assert.equal(g.projectiles.at(-1).sniper.critical,false);assert.equal(base,2*g.projectiles.at(-1).damage);
});
test('melee and ranged augment cards agree with their own authoritative profiles; regen uses safe unhit frames',t=>{
 const f=setup(t,['emoji-025','emoji-137']),{w,players:[p,q]}=f;
 const expected={rapid:['basicSpeed',[1.55,2,2.5],[1.44,1.825,2.43]],heavy:['basicDamage',[1.6,2.05,2.65],[1.44,1.825,2.32]],impact:['basicKnockback',[1.75,2.4,3.1],[1.44,1.88,2.43]]};
 for(const [id,[key,close,ranged]] of Object.entries(expected))for(let tier=1;tier<=3;tier++)for(const [a,mul] of [[p,close[tier-1]],[q,ranged[tier-1]]]){
  const mods=w.brRunModsForPaths({[id]:tier},a.run.capabilities,a.ability);assert.equal(mods[key],mul);
  assert.ok(w.brRunCard(a,id,tier).effect.includes(w.brStatNumber(mul)));
 }
 p.run.paths={wide:3,swift:3,titan:3,regen:3};w.brRecomputeRun(p);assert.equal(p.run.mods.basicRange,2.2);assert.equal(p.run.mods.maxHp,2.25);assert.equal(p.run.mods.moveSpeed,1.65);
 p.hp=100;p.run.lastDamageFrame=f.g.frame;f.tick(119);assert.equal(p.hp,100);f.tick(60);
 assert.ok(Math.abs(p.hp-100-p.maxHp*.065)<.001);
 const ids=manifest.roster.map(a=>a.id);assert.equal(ids.length,86);assert.deepEqual(ids.slice(-2),['emoji-152','emoji-153']);
});

test('sword dash stops safely, deals no dash damage and starts exactly one orbit; stun cancels it',t=>{
 const f=setup(t,['emoji-006','emoji-114']),{g,w,R,v,players:[p,q]}=f;
 g.walls=[new w.Wall(210,0,25,280,0)];assert.ok(f.cast(p,v(1)));assert.equal(p.cooldown,1080);
 f.tick(12);assert.ok(p.pos.x>80&&p.pos.x<200-p.radius);assert.equal(q.hp,4000);
 const orbits=g.rw.entities.filter(e=>e.kind==='orbit');assert.equal(orbits.length,1);assert.equal(orbits[0].end-orbits[0].start,180);
 f.tick(180);assert.ok(!g.rw.entities.some(e=>e.kind==='orbit'));
 g.walls=[];f.place(p,0);f.place(q,900);g.rebuildSpatialGrid();p.cooldown=0;f.cast(p,v(1));f.tick(1);p.stunned=12;f.tick(16);
 assert.ok(!g.rw.entities.some(e=>e.kind==='orbit'));assert.equal(q.hp,4000);
 p.cooldown=0;f.place(p,0);g.rebuildSpatialGrid();f.cast(p,v(1));f.tick(10);assert.ok(Math.abs(p.pos.x-300)<.01);
});
test('nuclear punch applies a single 110-coefficient direct and one 26-coefficient wall impact',t=>{
 const f=setup(t,['emoji-025','emoji-114','emoji-114']),{w,g,v,players:[p,q,z]}=f;
 f.place(q,165,-80);f.place(z,175,80);g.walls=[new w.Wall(320,0,26,380,0)];g.rebuildSpatialGrid();
 const s=w.BRRework.defs[p.ability.id].skill;
 assert.deepEqual([s.damage,s.knockback,s.wallDamage,s.range,s.width,s.windupFrames,s.cooldownFrames],[110,70,26,165,104,12,600]);
 assert.ok(f.cast(p,v(1)));f.tick(11);assert.equal(q.hp,4000);f.tick(1);
 assert.ok(Math.abs(4000-q.hp-110*1.05*p.damageMult)<.001);assert.equal(z.hp,4000);
 const first=q.hp;f.tick(60);assert.ok(Math.abs(first-q.hp-26*p.damageMult)<.001);assert.equal(w.combatWallContact(q.pos.x,q.pos.y,q.radius,g.walls[0]),null);assert.ok(q.pos.x<g.walls[0].x);assert.equal(q.stunned,0);
 const final=q.hp;f.tick(25);assert.equal(q.hp,final);
});
test('rework sniper first-hit damage is doubled exactly once and a missed cast still consumes one roll',t=>{
 for(const id of ['emoji-023','emoji-074']){
  const f=setup(t,[id,'emoji-114']),{w,g,v,players:[p,q]}=f;const loss=[];
  for(const roll of [.99,0]){
   p.cooldown=0;q.hp=4000;f.place(q,320);g.rebuildSpatialGrid();
   let calls=0;const saved=w.rand;w.rand=()=>{calls++;return roll;};assert.ok(f.cast(p,v(1)));w.rand=saved;
   assert.equal(calls,1);f.tick(60);loss.push(4000-q.hp);
  }
  assert.ok(loss[0]>0);assert.ok(Math.abs(loss[1]-2*loss[0])<.001);
  p.cooldown=0;g.walls=[new w.Wall(170,0,25,280,0)];const before=q.hp;assert.ok(f.cast(p,v(1)));f.tick(60);
  assert.equal(q.hp,before);assert.ok(p.cooldown>0);
 }
});
test('reflected explosive body keeps its single detonation and life/round cleanup prevents stale credit',t=>{
 const f=setup(t,['emoji-000','emoji-028']),{w,g,R,v,players:[p,q]}=f;
 assert.ok(f.cast(q));assert.ok(f.cast(p,v(1)));f.tick(100);
 assert.equal(q.hp,4000);assert.ok(p.hp<4000);
 assert.equal(g.rw.entities.filter(e=>e.kind==='fire').length,1);
 q.cooldown=0;f.cast(q);const shot=launch(f,p,'native');f.tick(4);assert.equal(shot.reflectedOnce,true);
 const before=p.hp;q.lifeSeq++;f.tick(10);assert.equal(p.hp,before);assert.ok(!g.projectiles.includes(shot));
 R.clearWorld(g,'match');assert.equal(g.rw,null);
});

test('full F evolution, regen and supply stack in a test-only six-pick build; announcement survives duplicate choice and resets per match',t=>{
 const f=setup(t,['emoji-052','emoji-114']),{w,g,players:[p,q]}=f;
 p.hp=p.maxHp=400;p.run.paths={wanggui:2};w.brRecomputeRun(p);p.hp=p.maxHp*.5;
 Object.assign(p.run,{level:6,pending:1,choices:2,offer:{id:'awakening',cards:[{id:'wanggui',tier:3}]}});
 assert.equal(w.brChooseRun(p,'awakening','wanggui'),true);assert.equal(w.brChooseRun(p,'awakening','wanggui'),false);
 assert.equal(p.maxHp,1920);assert.equal(p.hp,960);
 assert.equal(g.classroomAnnouncements.events.filter(e=>e.kind==='awakening'&&e.playerId===p.remoteId).length,1);
 p.run.paths.regen=3;w.brRecomputeRun(p);const hp=p.hp;p.run.lastDamageFrame=-200;
 p.combatBuff={kind:'attack',life:p.lifeSeq,end:600};
 q.takeDamage(20,p,false,null,{basic:true});assert.ok(Math.abs(4000-q.hp-208.8)<.001);
 f.tick(60);assert.ok(Math.abs(p.hp-hp-p.maxHp*.065)<.001);
 const after=p.hp;p.pos=f.v(5000);p.run.lastDamageFrame=-200;w.brUpdateRunWorld(g);assert.equal(p.hp,after);
});
test('native and rework return retain the same network ID across different life sequences; an earlier crate intercepts',t=>{
 for(const kind of ['native','rework']){
  const f=setup(t,['emoji-137','emoji-028']),{w,g,players:[p,q]}=f;
  p.lifeSeq=4;q.lifeSeq=7;w.brInitRun(p);w.brInitRun(q);
  assert.ok(f.cast(q));const shot=launch(f,p,kind);
  f.tick(1);const before=getTeacherState(w).shots.find(s=>s.kind==='projectile');
  f.tick(2);const after=getTeacherState(w).shots.find(s=>s.kind==='projectile');
  assert.ok(shot.reflectedOnce);assert.equal(after.id,before.id);assert.equal(after.owner,q.remoteId);assert.equal(after.life,7);
  const already=q.hp;
  w.brFarm.init(g);const box=g.farmBoxes[0];p.pos=f.v(box.pos.x-180,box.pos.y);q.pos=f.v(box.pos.x+220,box.pos.y);g.rebuildSpatialGrid();
  const blocked=launch(f,p,kind);f.tick(4);assert.ok(!blocked.reflectedOnce);assert.equal(q.hp,already);
 }
});

test('a late first paint displays one recent critical cue; old cues do not reappear',()=>{
 function frame(receivedAt){
  const timeline=new Timeline(),actor={id:'a',x:0,y:0,radius:30,lifeSeq:2,alive:true};
  timeline.accept({snapshotSeq:1,serverTick:48,actors:[actor],shots:[]},500);
  timeline.event({type:'FX',eventId:'crit',serverTick:22,data:{kind:'impact',style:'sniper-critical',targetId:'a',x:0,y:0,geometry:{confirmed:true,displayMs:260,targetLife:2}}},receivedAt);
  return timeline;
 }
 const t=frame(100);assert.equal(t.frame(500).effects[0].firstVisibleAt,500);
 assert.equal(t.frame(700).effects[0].firstVisibleAt,500);assert.equal(t.frame(761).effects.length,0);
 assert.equal(frame(-3200).frame(500).effects.length,0);
});
test('wide III guide matches actual eight-direction reach and normal melee impulse grows with IMPACT',t=>{
 const f=setup(t,['emoji-025','emoji-114']),{w,g,v,R,players:[p,q]}=f;
 for(let i=0;i<8;i++){
  p.run.paths={wide:3};w.brRecomputeRun(p);const angle=i*Math.PI/4,dir=v(Math.cos(angle),Math.sin(angle));
  f.place(p,0);p.basicCooldown=0;const mods=p.run.mods,range=w.brAimSpec(p.ability,'attack',p.radius,1,mods).range;
  const spec=w.brAimSpec(p.ability,'attack',p.radius,1,mods);
  const guide=aimGuide({x:0,y:0,radius:p.radius,aimProfiles:{attack:{range,rangeMin:range,spec}}},'attack',{aim:dir,power:1},{worldRadius:g.worldRadius},w,[]);
  assert.equal(guide.shape,'cone');assert.ok(Math.abs(guide.range-range)<.001);
  f.place(q,dir.x*(range-5),dir.y*(range-5));g.rebuildSpatialGrid();q.hp=4000;w.brBasicAttack(p,g,dir);assert.ok(q.hp<4000);
  f.place(p,0);f.place(q,dir.x*(range+q.radius*2+100),dir.y*(range+q.radius*2+100));g.rebuildSpatialGrid();p.basicCooldown=0;q.hp=4000;
  w.brBasicAttack(p,g,dir);assert.equal(q.hp,4000);
 }
 const shifts=[];
 for(const tier of [0,3]){
  p.run.paths={impact:tier};w.brRecomputeRun(p);R.state(q).impulse=null;
  f.place(p,0);f.place(q,135);p.basicCooldown=0;q.hp=4000;g.rebuildSpatialGrid();
  w.brBasicAttack(p,g,v(1));const x=q.pos.x;f.tick(1);shifts.push(q.pos.x-x);
 }
 assert.ok(shifts[0]>0&&shifts[1]>2*shifts[0],JSON.stringify(shifts));
});

test('iron lasts through stun for precisely 300 frames and a mirror stops steering on loss of sight or life',t=>{
 const f=setup(t,['emoji-114','emoji-028']),{w,g,players:[source,defender],v}=f;
 assert.ok(f.cast(defender));defender.stunned=400;
 f.tick(299);assert.equal(ironActive(defender,g.frame),true);
 f.tick(1);assert.equal(ironActive(defender,g.frame),false);
 const origin=v(100),incoming=v(1),shot={owner:source,pos:origin};
 const reflected=reflectedDirection(w,g,shot,origin,incoming,defender,true);
 assert.ok(reflected.x<-.99);shot.owner=defender;
 f.place(source,100,400);
 const steered=steerReturn(g,shot,reflected);
 assert.ok(Math.abs(Math.acos(steered.x*reflected.x+steered.y*reflected.y)-.045)<1e-7);
 g.walls=[new w.Wall(100,180,150,25,0)];g.rebuildSpatialGrid();
 assert.equal(steerReturn(g,shot,steered),steered);assert.equal(shot.returnTarget,null);
 g.walls=[];g.rebuildSpatialGrid();shot.owner=source;
 reflectedDirection(w,g,shot,origin,incoming,defender,true);shot.owner=defender;source.lifeSeq++;
 assert.equal(steerReturn(g,shot,steered),steered);assert.equal(shot.returnTarget,null);
 source.alive=false;const deadShot={owner:source};
 const back=reflectedDirection(w,g,deadShot,origin,incoming,defender,true);
 assert.ok(Math.abs(back.x+1)<1e-9&&Math.abs(back.y)<1e-9);assert.equal(deadShot.returnTarget,undefined);
});
