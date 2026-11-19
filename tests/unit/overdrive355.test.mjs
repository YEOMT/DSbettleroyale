import {expectedPaths357} from '../v35-7/approved.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWorld,createRuleContext,stepWorld,destroyWorld,getTeacherState,getVisibleState,applyCommand} from '../../packages/engine/src/index.js';
import {parryActive,parryProjectile} from '../../packages/engine/src/combat/parry.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {rosterMechanics,sameMechanics} from '../../tools/ci/roster-scope.mjs';
import {approved355,expected355} from '../v35-5/approved.mjs';
import {expected356} from '../v35-6/approved.mjs';
import {giantOutline,overdriveEffect,overdriveShot} from '../../apps/client/src/render/overdrive-feedback.js';
import {GameAudio} from '../../apps/client/src/audio/audio.js';
import {AttackPoses} from '../../apps/client/src/render/attack-pose.js';
import {Connection} from '../../apps/client/src/net/connection.js';
const base=JSON.parse(fs.readFileSync(new URL('../v35-5/baseline.json',import.meta.url)));

test('confirmed parry/goblin audio is independent of render scheduling, once per current life',()=>{
 const prior=globalThis.document;globalThis.document={hidden:false};
 try{
  const sounds=[],audio=Object.assign(Object.create(GameAudio.prototype),{effects:true,seen:new Set(),session:{},controller:{sfx(){}},action:(...args)=>sounds.push(args)});
  const event=(id,style='pan-contact',life=2)=>({eventId:id,type:'FX',data:{kind:'impact',sourceId:'self',style,geometry:{confirmed:true,lifeSeq:life}}});
  audio.effect(event('pan'),'self',2);audio.effect(event('pan'),'self',2);assert.equal(sounds.length,1);
  audio.effect(event('goblin','goblin-first'),'self',2);assert.equal(sounds.length,2);
  audio.effect(event('old','pan-contact',1),'self',2);audio.effect(event('other'),'someone',2);audio.effect(event('restore'),'self',null);
  const preview=event('preview');preview.data.geometry.confirmed=false;audio.effect(preview,'self',2);assert.equal(sounds.length,2);
  document.hidden=true;audio.effect(event('hidden'),'self',2);document.hidden=false;audio.effect(event('hidden'),'self',2);assert.equal(sounds.length,2);
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
});

test('rematch preserves v35.4 clock estimate and rejects late prior-match packets',t=>{
 const prior=globalThis.sessionStorage;globalThis.sessionStorage={getItem:()=>null};t.mock.method(performance,'now',()=>10000);
 try{
  const c=new Connection('ws://fixture');c.scope={roomInstanceId:'room',matchId:'old',connectionEpoch:1};c.round=1;c.roomRevision=4;c.serverWallOffset=105000;
  const room=(match,round,time)=>({type:'ROOM_STATE',roomInstanceId:'room',matchId:match,connectionEpoch:1,payload:{phase:'LOBBY',matchId:match,round,revision:1,serverTime:time}});
  c.receive(room('new',2,110000));assert.equal(c.serverWallOffset,105000);assert.equal(c.scope.matchId,'new');
  c.receive(room('old',1,120000));assert.equal(c.serverWallOffset,105000);assert.equal(c.scope.matchId,'new');
 }finally{if(prior===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=prior;}
});

test('reflected apple fragments cannot advance the defender input-pose sequence',t=>{
 const f=setup(t,['emoji-075','emoji-092']),{w,g,R,v,ps:[source,defender]}=f;
 f.place(defender,220);g.rebuildSpatialGrid();defender.activeInputCommand={kind:'skill',seq:1};f.cast(defender,v(-1));defender.activeInputCommand=null;
 source.activeInputCommand={kind:'skill',seq:90};f.cast(source);source.activeInputCommand=null;
 const root=R.world(g).entities.find(e=>e.kind==='projectile');f.tick(12);assert.ok(root.reflectedOnce);R.end(root,'range');
 const shots=getTeacherState(w).shots.filter(q=>q.style==='apple-fragment');assert.equal(shots.length,8);
 const poses=new AttackPoses(),actors=getTeacherState(w).actors;for(const q of shots)poses.accept({type:'SHOT_SPAWN',serverTick:g.frame,data:q},actors,0);
 assert.equal(poses.fired.has(defender.remoteId+'/skill'),false);
 poses.accept({type:'FX',serverTick:g.frame+1,data:{kind:'swing',sourceId:defender.remoteId,geometry:{confirmed:true,kind:'skill',seq:2,lifeSeq:defender.lifeSeq}}},actors,1);
 assert.equal(poses.active.get(defender.remoteId).seq,2);
});
function setup(t,ids=['emoji-092','emoji-114','emoji-137'],mode='solo'){
 const w=createWorld(undefined,{mode,mapIndex:0},'overdrive355',ids.map((abilityId,i)=>({id:'p'+i,name:'Test '+i,abilityId,team:mode==='solo'?0:i?2:1})));t.after(()=>destroyWorld(w));
 const g=w.game,R=w.BRRework,v=(x,y=0)=>new w.Vec2(x,y),ps=ids.map((_,i)=>w.byId.get('p'+i));
 w.brFarm.dispose(g);g.finalPhaseTriggered=true;g.walls=[];g.zones=[];g.smokes=[];
 const place=(p,x,y=0)=>{p.pos=v(x,y);p.vel=v(0);p.combatPreviousX=x;p.combatPreviousY=y;p.combatPreviousWarp=p.warpSeq||0;};
 ps.forEach((p,i)=>{place(p,i*500);p.spawnProtectionUntilFrame=0;p.hp=p.maxHp=10000;p.cooldown=p.basicCooldown=0;});g.rebuildSpatialGrid();
 return {w,g,R,v,ps,place,tick(n){for(let i=0;i<n;i++)stepWorld(w);},cast(p,dir=v(1)){p.cooldown=0;return w.brCastPlayerSkill(p,g,dir,1);}};
}
test('B01/D: Pan melee eligibility changes without altering HP, radius or walking speed',()=>{
 const w=createRuleContext(),a=w.EMOJI_DB.find(a=>a.id==='emoji-092'),p=new w.Participant('p','P',a,new w.Vec2(0,0)),old=base.runtime[a.id];
 assert.equal(a.type,'MELEE');assert.equal(w.brBasicCombatProfile(a).close,true);assert.equal(w.brBasicCombatProfile(a).stun,0);w.brInitRun(p);assert.equal(w.brRunEligible(p,'wide'),true);assert.equal(w.brRunEligible(p,'rapid'),true);assert.equal(w.brRunEligible(p,'giant'),false);assert.equal(w.brRunEligible(p,'multi'),false);
 assert.ok(Math.abs(p.maxHp-old.hp)<1e-8);assert.equal(p.radius,old.radius);assert.equal(p.speed,old.speed);assert.ok(Math.abs(w.brBaseWalkingSpeed(p)-old.measured.moveSpeed)<1e-8);
});
for(const native of [true,false])test('B02/B05/B08: first frontal original shot reflects once on '+(native?'native':'rework'),t=>{
 const f=setup(t),{w,g,R,v,ps:[p,a]}=f;f.place(a,250);g.rebuildSpatialGrid();f.cast(p);assert.ok(parryActive(p,g));
 const shot=native?new w.Projectile(a,a.pos,v(-1),100,40,8,'bullet','#fff',0,null,{impactStyle:'ranged-basic',rangeRemaining:1000}):R.projectile(R.context(a,g,v(-1)),{speed:100,range:1000,radius:8,damage:40});
 if(native)g.projectiles.push(shot);const hp=p.hp;f.tick(3);assert.equal(shot.reflectedOnce,true);assert.equal(shot.owner,p);assert.equal(p.hp,hp);assert.equal(parryActive(p,g),null);assert.ok(!p.rw.buffs.some(b=>b.kind==='counterDeferred'||b.kind==='damageReduction'));
 const state=getTeacherState(w),student=getVisibleState(w,p.remoteId);assert.ok(state.shots.some(q=>q.returned)||shot.life===0||shot.dead);assert.ok(student);f.tick(4);assert.ok(a.hp<10000);
});
test('B03/B04: shield contact counters once, actual HP formula, no delayed return',t=>{
 const f=setup(t),{w,g,R,v,ps:[p,a,b]}=f;f.place(a,100);f.place(b,100,40);g.rebuildSpatialGrid();f.cast(p);
 R.shield(R.context(p,g,v(1)),p,100,120);const snap=R.basicAttempt(a,g,v(-1));a.takeDamage(0,p);p.takeDamage(30,a,false,v(-1),{basic:true,basicSnapshot:snap});
 assert.equal(p.hp,10000);assert.equal(a.hp,9980);assert.equal(parryActive(p,g),null);const before=b.hp;p.takeDamage(30,b,false,v(-1),{basic:true});assert.equal(b.hp,before);f.tick(90);assert.equal(a.hp,9980);
 f.cast(p);p.rw.shields=[];const old=p.hp,ah=a.hp;p.takeDamage(50,a,false,v(-1),{basic:true});assert.ok(p.hp<old);assert.ok(Math.abs(ah-a.hp-Math.min(55,20+.4*(old-p.hp)))<1e-7);
});
test('B06/B07: back, wall, periodic, invalid contacts never consume; stun/life/end expire',t=>{
 const f=setup(t),{w,g,R,v,ps:[p,a]}=f;f.place(a,-100);g.rebuildSpatialGrid();f.cast(p);p.takeDamage(10,a,false,null,{basic:true});assert.ok(parryActive(p,g));
 f.place(a,100);g.rebuildSpatialGrid();p.takeDamage(10,a,false,null,{periodic:true});assert.ok(parryActive(p,g));
 g.walls=[new w.Wall(50,0,10,160,0)];p.takeDamage(10,a,false,null,{basic:true});assert.ok(parryActive(p,g));g.walls=[];
 p.stunned=1;R.cancelAction(p,g,'stun');assert.equal(parryActive(p,g),null);p.stunned=0;f.cast(p);f.tick(72);assert.equal(parryActive(p,g),null);f.cast(p);R.cleanup(p,g,'life');assert.equal(parryActive(p,g),null);
});
for(const reason of ['range','wall','actor','crate'])test('C01/C02: Apple one set of 8 radial shards at '+reason,t=>{
 const f=setup(t,['emoji-075','emoji-114']),{w,g,R,v,ps:[p,q]}=f;
 if(reason==='actor')f.place(q,140);else f.place(q,1500);
 if(reason==='wall')g.walls=[new w.Wall(160,0,20,300,0)];
 if(reason==='crate'){ // Existing farm sweep result, without changing its collision algorithm.
  const original=w.brFarm.projectileContacts;w.brFarm.projectileContacts=(game,shot,from,to,wall,out)=>{if(shot.ctx&&shot.style!=='apple-fragment')out.push({farm:{id:'test-crate',hp:10},t:.5});else original(game,shot,from,to,wall,out);};w.brFarm.damage=()=>{};
 }
 g.rebuildSpatialGrid();f.cast(p);let shards=[];
 for(let i=0;i<60;i++){f.tick(1);shards=R.world(g).entities.filter(e=>e.style==='apple-fragment');if(shards.length)break;}
 assert.equal(shards.length,8);assert.equal(new Set(shards.map(e=>Math.atan2(e.dir.y,e.dir.x).toFixed(5))).size,8);
 for(const e of shards){assert.equal(e.radius,10.5);assert.equal(e.speed,24);assert.equal(e.range,250);assert.equal(e.damage,8);assert.equal(e.bounces,0);assert.ok(!e.onEnd);}
 f.tick(80);assert.equal(R.world(g).entities.filter(e=>e.style==='apple-fragment').length,0);
});
test('C02: Apple target-life cap rejects third fragment before damage',t=>{
 const f=setup(t,['emoji-075','emoji-114']),{g,R,v,ps:[p,q]}=f;f.cast(p);const root=R.world(g).entities.find(e=>e.kind==='projectile');R.end(root,'range');const shards=R.world(g).entities.filter(e=>e.style==='apple-fragment');
 for(let i=0;i<2;i++){assert.equal(shards[i].beforeHit(shards[i].ctx,q),true);shards[i].onHit(shards[i].ctx,q,{valid:true});}assert.equal(shards[2].beforeHit(shards[2].ctx,q),false);q.lifeSeq++;assert.equal(shards[2].beforeHit(shards[2].ctx,q),true);
});
test('C04-C07: native four colors retain D, only yellow stuns; green 4x4, no double scaling',t=>{
 const f=setup(t,['emoji-094','emoji-114']),{w,g,R,v,ps:[p,q]}=f;const D=w.getPlayerSignatureProjectileProfile(p.ability).damage*p.damageMult;
 f.cast(p);const shots=g.projectiles.slice();assert.equal(shots.length,4);assert.deepEqual(shots.map(e=>e.damage),[1.6,.85,.8,.8].map(k=>D*k));
 assert.deepEqual(shots.map(e=>e.weaponStyle),['crayon-0','crayon-1','crayon-2','crayon-3']);assert.ok(shots.every(e=>e.status===null));
 for(const [i,e]of shots.entries()){e.pos=q.pos;e.hit(g,q);if(i!==2&&i<2)assert.equal(q.stunned,0);}
 assert.equal(q.stunned,21);const slow=q.rw.buffs.find(b=>b.kind==='slow');assert.equal(slow.value,.75);assert.equal(slow.end-g.frame,90);
 assert.equal(q.rw.dots.length,1);assert.equal(q.rw.dots[0].stacks,1);g.projectiles=[];q.rw.impulse=null;const hp=q.hp;f.tick(120);assert.ok(Math.abs(hp-q.hp-16*p.damageMult)<1e-7);
});
test('C08: Goblin keeps shield/haste and spends only first successful basic on one target',t=>{
 const f=setup(t,['emoji-148','emoji-114','emoji-114']),{g,R,v,ps:[p,a,b]}=f;f.cast(p);assert.equal(p.rw.shields[0].amount,1500);assert.equal(R.cooldownRate(p,'attack'),1.2);
 const snap=R.basicAttempt(p,g,v(1));R.basicHit(p,a,{valid:false},snap);assert.ok(p.rw.buffs.some(b=>b.kind==='goblinFirst'));
 R.basicHit(p,a,{valid:true,hpDamage:10},snap);assert.equal(a.stunned,27);R.basicHit(p,b,{valid:true,hpDamage:10},snap);assert.equal(b.stunned,0);assert.ok(!p.rw.buffs.some(b=>b.kind==='goblinFirst'));assert.equal(p.rw.shields.length,1);
});
test('C09/E07-E09: exact sweep, blast and native/rework speed values',()=>{
 const w=createRuleContext(),s=id=>w.BRRework.defs['emoji-'+id].skill;
 assert.deepEqual([s('121').range,s('121').width,s('121').knockback,s('121').damage,s('121').windupFrames,s('121').cooldownFrames],[335,300,42,14,10,480]);
 assert.deepEqual([s('039').radius,s('039').innerRadius,s('039').flightFrames,s('039').damage],[245,105,42,30.45]);
 assert.deepEqual([s('072').blastRadius,s('072').damage,s('072').knockback],[255,22,25]);assert.deepEqual([s('122').blastRadius,s('122').thornRadius,s('122').thornDamage],[100,145,4.389]);
 assert.deepEqual([w.getPlayerSignatureProjectileProfile(w.EMOJI_DB.find(a=>a.id==='emoji-137')).speed,s('023').speed,s('074').speed],[65,105,55]);
});
test('D01-D07: tier multipliers replace previous tier, preserve damage and widen actual profile',t=>{
 const f=setup(t,['emoji-137','emoji-092']),{w,ps:[p,m]}=f;
 for(let tier=1;tier<=3;tier++){
  p.run.paths={giant:tier,rapid:tier};w.brRecomputeRun(p);m.run.paths={wide:tier,rapid:tier};w.brRecomputeRun(m);
  assert.equal(p.run.mods.basicSize,[1.8,2.6,3.4][tier-1]);assert.equal(p.run.mods.basicSpeed,[1.6,2.15,2.75][tier-1]);assert.ok(Math.abs(m.run.mods.basicSpeed-Math.min(3,[1.7,2.3,3][tier-1]+[.95,1,1.055][tier-1]-1))<1e-9);assert.equal(m.run.mods.basicRange,[1.6,2.25,3][tier-1]);assert.equal(p.run.mods.basicDamage,[.9,.95,1.055][tier-1]);
  const profile=w.brRunBasicProfile(m.ability,m.run.mods),guide=w.brAimSpec(m.ability,'attack',m.radius,1,m.run.mods);assert.equal(profile.halfAngle,guide.halfAngle);assert.ok(Math.abs(profile.halfAngle-(1.1+[6,12,20][tier-1]*Math.PI/180))<1e-7);
 }
});
test('A01-A06/D10: all 86 immutable baseline projections change only reviewed leaves; modes/other augments unchanged',()=>{
 const actual=rosterMechanics(manifest);assert.equal(Object.keys(actual).length,86);assert.equal(new Set(approved355.map(d=>d.path.split('.')[0])).size,11);
 for(const [id,row]of Object.entries(base.mechanics))assert.ok(sameMechanics(actual[id],expected356(expected355({...row,id}))),id);
 const w=createRuleContext();for(const [id,path]of Object.entries(expectedPaths357(base.paths,w.brRunTierText)))if(!['rapid','giant','wide'].includes(id))assert.deepEqual(w.BR_RUN_PATHS[id],path,id);
 assert.equal(manifest.roster.find(a=>a.id==='emoji-094').skill.projectile.damage,3.15);assert.equal(manifest.roster.find(a=>a.id==='emoji-137').skill.projectile.speed,65);
});
test('D04-D06: accepted inputs with stacked haste respect a six-tick floor and no extra shot on duplicate',t=>{
 const f=setup(t,['emoji-070','emoji-114']),{w,g,R,v,ps:[p]}=f;p.run.paths.rapid=3;w.brRecomputeRun(p);const c=R.context(p,g,v(1));R.buff(c,p,'basicHaste',3,300);const times=[];let last=0;
 for(let tick=1;tick<=90;tick++){
  applyCommand(w,{type:'INPUT',playerId:p.remoteId,lifeSeq:p.lifeSeq,seq:tick,clientTick:tick,move:{x:0,y:0},aim:{x:1,y:0}});
  const action={type:'ACTION',playerId:p.remoteId,lifeSeq:p.lifeSeq,seq:tick,kind:'attack',aim:{x:1,y:0},aimPower:1};applyCommand(w,action);applyCommand(w,action);f.tick(1);
  if(p.firedAttackSeq!==last){times.push(g.frame);last=p.firedAttackSeq;}
 }
 assert.ok(times.length>=10);assert.ok(times.slice(1).every((t,i)=>t-times[i]>=6),JSON.stringify(times));
});
test('D02/C06/B08: low-cost shared geometry uses authority radius and color-independent forms',()=>{
 const calls=[],p=new Proxy({},{get:(_,k)=>(...args)=>calls.push([k,...args])});giantOutline(p,{x:2,y:3,radius:34,giant:3.4,actionKind:'attack'},.5);assert.equal(calls[0][3],34);calls.length=0;
 for(let i=0;i<4;i++){overdriveShot(p,{x:0,y:0,dx:16.8,dy:0,radius:10,style:'crayon-'+i,color:'#fff'},1);assert.equal(calls.filter(c=>c[0]==='line').length,i+2);calls.length=0;}
 assert.ok(overdriveEffect(p,['','impact',0,0,1,0,44,'#fff',0,0,'pan-contact',0,0,{confirmed:true}],1,1));assert.ok(calls.length<=5);
});
test('B02/B05/B07: ±119/121 degrees, 71/72 ticks, second return and invalid visibility',t=>{
 const f=setup(t),{w,g,R,v,ps:[p,q]}=f;
 for(const [degrees,at,expected]of [[119,71,true],[121,71,false],[-119,71,true],[-121,71,false],[0,72,false]]){
  R.cleanup(p,g);const angle=degrees*Math.PI/180;f.place(q,Math.cos(angle)*300,Math.sin(angle)*300);g.rebuildSpatialGrid();f.cast(p);g.frame+=at;
  assert.equal(parryProjectile(w,g,{owner:q},p,v(-Math.cos(angle),-Math.sin(angle)),p.pos),expected,[degrees,at].join('/'));
 }
 g.frame++;f.place(q,300);f.cast(p);assert.equal(parryProjectile(w,g,{owner:q,reflectedOnce:true},p,v(-1)),false);q.invisible=true;assert.equal(parryProjectile(w,g,{owner:q},p,v(-1)),false);q.invisible=false;q.team=p.team=1;assert.equal(parryProjectile(w,g,{owner:q},p,v(-1)),false);
 R.cleanup(p,g);assert.equal(parryActive(p,g),null);
});
test('C03: twenty simultaneous apple terminations create 160 unique bounded fragments and clean every reference',t=>{
 const f=setup(t,Array(20).fill('emoji-075')),{w,g,R,ps}=f;
 for(const [i,p]of ps.entries())f.place(p,(i%5)*600,Math.floor(i/5)*600);g.rebuildSpatialGrid();
 for(const p of ps)f.cast(p);const roots=R.world(g).entities.filter(e=>e.kind==='projectile');assert.equal(roots.length,20);
 const at=performance.now();for(const e of roots)R.end(e,'range');const fragments=R.world(g).entities.filter(e=>!e.dead&&e.style==='apple-fragment');assert.equal(fragments.length,160);assert.equal(new Set(fragments.map(e=>e.id)).size,160);
 for(const e of roots)R.end(e,'range');assert.equal(R.world(g).entities.filter(e=>!e.dead).length,160);f.tick(90);assert.equal(R.world(g).entities.length,0);assert.equal(R.world(g).events.length,0);
 assert.ok(ps.every(p=>!p.runtimeFaults));console.log(JSON.stringify({scenario:'apple-20x8',resolutionAnd90TicksMs:performance.now()-at,peakFragments:160,remaining:0}));
});
test('C04-C06: each isolated color, multicast shared stun budget, DOT expiry, ordinary basic has no color status',t=>{
 const f=setup(t,['emoji-094','emoji-114']),{w,g,R,ps:[p,q]}=f;p.run.paths.multicast=3;w.brRecomputeRun(p);f.cast(p);const shots=g.projectiles.slice();assert.equal(shots.length,7);
 for(let i=0;i<4;i++){q.stunned=0;shots[i].pos=q.pos;shots[i].hit(g,q);assert.equal(q.stunned,i===2?21:0);}
 q.stunned=11;shots[6].pos=q.pos;shots[6].hit(g,q);assert.equal(q.stunned,11,'second yellow cannot renew stun');assert.equal(q.rw.dots.length,1);shots[3].hit(g,q);assert.equal(q.rw.dots[0].stacks,1);
 const end=q.rw.dots[0].end;g.projectiles=[];f.tick(end-g.frame+1);assert.equal(q.rw.dots.length,0);assert.ok(!q.rw.buffs.some(b=>b.kind==='slow'));
 w.brBasicAttack(p,g,f.v(1));assert.ok(g.projectiles.length>0);assert.ok(g.projectiles.every(e=>e.crayon===undefined&&e.status===null));
});
test('C09/C10/D07: rectangular sweep and widened melee reject rear and covered targets',t=>{
 const f=setup(t,['emoji-121','emoji-114','emoji-114','emoji-114']),{w,g,R,v,ps:[p,front,rear,covered]}=f;
 f.place(front,80,100);f.place(rear,-180);f.place(covered,300,-120);g.walls=[new w.Wall(180,-120,20,80,0)];g.rebuildSpatialGrid();f.cast(p);f.tick(10);
 assert.ok(front.hp<10000);assert.equal(rear.hp,10000);assert.equal(covered.hp,10000);assert.ok(front.rw.impulse.x>0);assert.equal(front.rw.impulse.y,0);assert.equal(front.stunned,0);assert.equal(front.rw.impulse.wallDamage,0);
 f.tick(1);g.walls=[];f.place(front,330,100);front.rw.impulse=null;g.rebuildSpatialGrid();const hp=front.hp;assert.ok(f.cast(p),'windup lock expired before second cast');f.tick(10);assert.ok(front.hp<hp,'open rectangle reaches 330');
 const pan=setup(t,['emoji-092','emoji-114','emoji-114']);pan.ps[0].run.paths.wide=3;pan.w.brRecomputeRun(pan.ps[0]);pan.place(pan.ps[1],300,80);pan.place(pan.ps[2],-150);pan.g.rebuildSpatialGrid();pan.w.brBasicAttack(pan.ps[0],pan.g,pan.v(1));assert.ok(pan.ps[1].hp<10000);assert.equal(pan.ps[2].hp,10000);assert.equal(pan.g.projectiles.length,0);
});
test('D01/D03: GIANT III body, guide and actual shot radius match, wall prevents large-body penetration',t=>{
 const f=setup(t,['emoji-137','emoji-114']),{w,g,v,ps:[p,q]}=f;p.run.paths.giant=3;w.brRecomputeRun(p);w.brBasicAttack(p,g,v(1));const shot=g.projectiles[0],profile=w.brAimSpec(p.ability,'attack',p.radius,1,p.run.mods);assert.equal(shot.size*2,profile.width);assert.equal(getTeacherState(w).shots[0].giant,3.4);
 f.place(q,180);g.walls=[new w.Wall(100,0,10,300,0)];g.rebuildSpatialGrid();f.tick(30);assert.equal(q.hp,10000);assert.equal(shot.life,0);
});
test('D08: all three III effects fire only on accepted choice; no duplicate/recompute/death replay',t=>{
 for(const path of ['giant','rapid','wide']){
  const f=setup(t,[path==='wide'?'emoji-092':'emoji-137','emoji-114']),{w,g,ps:[p]}=f,events=[];const emit=g.emitStudentFx;g.emitStudentFx=(...args)=>{events.push(args);return emit.apply(g,args);};
  p.run.paths={[path]:2};p.run.level=4;p.run.choices=2;p.run.pending=1;w.brRecomputeRun(p);p.run.offer={id:'choice-'+path,cards:[w.brRunCard(p,path,3)]};
  assert.ok(w.brChooseRun(p,'choice-'+path,path));assert.equal(w.brChooseRun(p,'choice-'+path,path),false);w.brRecomputeRun(p);w.brRunSnapshot(p);w.BRRework.cleanup(p,g,'life');p.lifeSeq++;w.brRunSnapshot(p);
  const fx=events.filter(e=>e[2]?.style==='overdrive-'+path);assert.equal(fx.length,1);assert.equal(fx[0][2].geometry.displayMs,650);
 }
});


test('B05/B07: real body dash contacts parry once; boomerang and periodic orbit do not reflect',t=>{
 const f=setup(t),{w,g,R,v,ps:[p,a]}=f;f.place(a,180);g.rebuildSpatialGrid();f.cast(p);const hp=a.hp;
 R.dash(R.context(a,g,v(-1)),{range:300,speed:40,width:a.radius*2,damage:20,knockback:0,stun:0});f.tick(4);assert.ok(a.hp<hp);assert.equal(parryActive(p,g),null);
 R.cleanup(a,g);f.place(a,200);f.place(p,0);g.rebuildSpatialGrid();f.cast(p);
 const q=new w.Projectile(a,a.pos,v(-1),60,20,10,'BOOMERANG','#fff',0,null,{rangeRemaining:500});g.projectiles.push(q);f.tick(4);assert.ok(!q.reflectedOnce);assert.ok(parryActive(p,g));
 p.takeDamage(20,a,false,null,{meleeContact:true,visualPeriodic:true});assert.ok(parryActive(p,g));
 p.rw.force={};assert.equal(parryActive(p,g),null);R.cancelAction(p,g,'capture');assert.ok(!p.rw.buffs.some(b=>b.kind==='panParry'));
});

test('D08: RAPID III is one short electrical zigzag; WIDE is an arc, GIANT a ring',()=>{
 const calls=[],p=new Proxy({},{get:(_,k)=>(...args)=>calls.push(k)});
 for(const [path,kind,count]of [['rapid','line',6],['wide','arc',1],['giant','circle',2]]){calls.length=0;assert.ok(overdriveEffect(p,['','impact',0,0,1,0,70,'#fff',0,0,'overdrive-'+path,0,0,{confirmed:true}],1,1));assert.equal(calls.filter(k=>k===kind).length,count);}
});

test('D03/D06: expanded shot survives viewport edge and uses its actual radius for crate sweep; angle cap is 110 degrees',t=>{
 const f=setup(t,['emoji-137','emoji-092']),{w,g,v,ps:[p,m]}=f;p.run.paths={giant:3};w.brRecomputeRun(p);w.brBasicAttack(p,g,v(1));const shot=g.projectiles[0],b=w.brViewerBounds(p);
 shot.pos=v(b.x+b.hw+shot.size*.5);shot.vel=v(1);const visible=getVisibleState(w,p.remoteId);assert.ok(visible.shots.some(s=>s.id===getTeacherState(w).shots[0].id));
 const box={pos:v(120,60),halfSize:30};assert.notEqual(w.brCrateSweepTime(box,v(0),v(240),shot.size),null);assert.equal(w.brCrateSweepTime(box,v(0),v(240),shot.size/3.4),null);
 m.run.paths={wide:3};w.brRecomputeRun(m);w.BRRework.defs[m.ability.id].basic.halfAngle=2;assert.equal(w.brRunBasicProfile({...m.ability},{...m.run.mods}).halfAngle,110*Math.PI/180);
});


for(const [id,radius]of [['emoji-039',245],['emoji-072',255],['emoji-122',100]])test('E06-E09: '+id+' exact expanded blast contact, warning/FX and cover, no second end',t=>{
 const f=setup(t,[id,'emoji-114','emoji-114','emoji-114']),{w,g,R,v,ps:[p,inside,outside,covered]}=f;
 const events=[],emit=g.emitStudentFx;g.emitStudentFx=(...a)=>{events.push(a);return emit.apply(g,a);};f.cast(p);const e=R.world(g).entities.find(e=>['lob','projectile'].includes(e.kind)),center=e.targetPos||v(600);
 f.place(inside,center.x+radius+inside.radius-1,center.y);f.place(outside,center.x-radius-outside.radius-4,center.y);f.place(covered,center.x,center.y+radius*.8);
 g.walls=[new w.Wall(center.x,center.y+radius*.4,120,12,0)];g.rebuildSpatialGrid();
 if(id==='emoji-039')assert.equal(R.world(g).entities.find(e=>e.kind==='warning').radius,radius);else e.pos=center;
 R.end(e,id==='emoji-039'?'expired':'range');assert.ok(inside.hp<10000);assert.equal(outside.hp,10000);assert.equal(covered.hp,10000);const hp=inside.hp;
 R.end(e,'range');assert.equal(inside.hp,hp);assert.equal(events.filter(a=>a[0]==='explosion'&&a[2].size===radius).length,1);
 if(id==='emoji-122'){const z=R.world(g).entities.find(e=>e.kind==='thorns');assert.equal(z.radius,145);assert.equal(z.damage,4.389);assert.equal(z.duration,120);}
});
