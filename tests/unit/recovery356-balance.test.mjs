import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuleContext,createWorld,destroyWorld,stepWorld,applyCommand,getVisibleState,getStaticState} from '../../packages/engine/src/index.js';
import {createMovementKernel,predictMovement} from '../../packages/engine/src/movement/prediction.js';
import {currentCard} from '../../tools/content/cards.mjs';

const near=(actual,expected,epsilon=1e-8)=>assert.ok(Math.abs(actual-expected)<epsilon,`${actual} != ${expected}`);
function setup(t,id,other='emoji-114'){
 const w=createWorld(undefined,{mode:'solo',mapIndex:0},'recovery356',[
  {id:'owner',name:'fixture owner',abilityId:'emoji-'+id},{id:'target',name:'fixture target',abilityId:other}]);
 t.after(()=>destroyWorld(w));
 const g=w.game,R=w.BRRework,[p,q]=g.participants,v=(x,y=0)=>new w.Vec2(x,y);
 w.brFarm.dispose(g);g.finalPhaseTriggered=true;g.walls=[];g.zones=[];g.smokes=[];
 const place=(a,x,y=0)=>{a.pos=v(x,y);a.vel=v(0);a.combatPreviousX=x;a.combatPreviousY=y;a.combatPreviousWarp=a.warpSeq||0;};
 place(p,0);place(q,1400);for(const a of [p,q]){a.spawnProtectionUntilFrame=0;a.hp=a.maxHp=10000;a.cooldown=a.basicCooldown=0;}
 g.rebuildSpatialGrid();
 return {w,g,R,p,q,v,place,tick(n){for(let i=0;i<n;i++){g.frame++;w.timeMs+=1000/60;g.rebuildSpatialGrid();R.tick(g);}},
  cast(){p.cooldown=0;assert.equal(w.brCastPlayerSkill(p,g,v(1),1),true);},shots:()=>R.world(g).entities.filter(e=>e.kind==='projectile'&&!e.dead)};
}
const approved=[
 ['003',514.2075,1.296,3.724,990],['007',500,1.4,4.344666666666666,1140],
 ['014',460,1.296,3.724,1020],['142',475,1.48,4.252716049382715,450],
 ['034',360,1.7967,4.838962275,720],['063',360,1.7967,4.838962275,540],
 ['087',340,1.7967,4.838962275,570],['139',450,1.37,3.2,1080],['056',240,1.7,4.578525,420]
];
test('nine final Lv1 neutral HP, actual walking, cooldown and generated card facts agree',()=>{
 const w=createRuleContext();assert.equal(w.EMOJI_DB.length,86);
 for(const [id,hp,speed,walk,cooldown]of approved){
  const a=w.EMOJI_DB.find(a=>a.id==='emoji-'+id),p=new w.Participant(1,'fixture',a,new w.Vec2(0,0));w.brInitRun(p);
  const drive=walk*(id==='139'?(1-.22*.92)/.78:1);
  near(p.maxHp,hp);near(p.speed,speed);near(w.brBaseWalkingSpeed(p),walk);near(w.brHumanMoveSpeed(p),drive);
  const card=currentCard(w,a);assert.equal(card.facts.skill.cooldownFrames,cooldown);near(card.facts.body.maxHp,hp);near(card.facts.body.baseWalkingSpeed,walk);near(card.facts.body.humanMoveSpeed,drive);
 }
 const s=id=>w.BRRework.defs['emoji-'+id].skill,aim=id=>w.brAimSpec(w.EMOJI_DB.find(a=>a.id==='emoji-'+id),'skill',40,1,{});
 assert.equal(aim('003').width,54);assert.equal(s('003').finalRadius,35);
 assert.equal(aim('087').width,24);assert.equal(aim('056').width,68);
 assert.equal(aim('063').range,720);near(aim('063').halfAngle,.275);
 assert.equal(s('007').zoneDamage,11.55);assert.equal(s('034').damage,21);
});

for(const id of ['007','142','139','056'])test(`${id}: authoritative movement increases on INPUT, not only its card stat`,t=>{
 const f=setup(t,id),{w,g,p,q,v}=f;q.pos=v(-1400,1200);g.rebuildSpatialGrid();
 const expected=approved.find(row=>row[0]===id)[3],prior={'007':4.0343333333333335,'142':3.724,'139':2.74582224,'056':4.039875}[id];
 let start;
 for(let tick=1;tick<=90;tick++){
  applyCommand(w,{type:'INPUT',playerId:p.remoteId,lifeSeq:p.lifeSeq,seq:tick,clientTick:tick,move:{x:1,y:0},aim:{x:1,y:0}});stepWorld(w);
  if(tick===30)start=p.pos.x;
 }
 // Preserve the existing .78 input response and .92 post-step velocity damping.
 const steady=.78/(1-.22*.92),actual=(p.pos.x-start)/60;
 near(actual,id==='139'?3.20:expected*steady,1e-6);assert.ok(actual>prior*steady);near(p.pos.y,0);
});

test('Zombie exact 3.20 steady travel shares the unchanged prediction response, stop, reverse and wall path',t=>{
 const f=setup(t,'139'),{w,g,p,q,v}=f;q.pos=v(-1400,1200);g.walls=[new w.Wall(450,0,40,500,0)];g.walls[0].spinSpeed=0;g.rebuildSpatialGrid();
 const kernel=createMovementKernel(),arena=getStaticState(w),walls=arena.walls.map(a=>({...a,pos:{x:a.x,y:a.y}}));let predicted=getVisibleState(w,p.remoteId).self;
 near(predicted.moveSpeed,3.2722051282051283);near(w.brBaseWalkingSpeed(p),3.20);assert.equal(p.speed,1.37);
 for(let tick=1;tick<=240;tick++){
  const move={x:tick<=150?1:tick<=175?0:tick<=210?-1:0,y:0},command={seq:tick,clientTick:tick,move,aim:{x:1,y:0}};
  predicted=predictMovement(kernel,predicted,command,walls,arena);
  applyCommand(w,{...command,type:'INPUT',playerId:p.remoteId,lifeSeq:p.lifeSeq});stepWorld(w);
  near(predicted.x,p.pos.x,1e-7);near(predicted.y,p.pos.y,1e-7);near(predicted.vx,p.vel.x,1e-7);near(predicted.vy,p.vel.y,1e-7);
 }
 assert.ok(p.pos.x<450-20-p.radius);assert.ok(Math.abs(p.vel.x)<1e-8);
});

test('Archmage keeps 14 fixed-direction launches, windup/interval/damage, with actual 27/35 radii',t=>{
 const f=setup(t,'003'),{g,R,p,v}=f,spawn=[],original=R.projectile;
 R.projectile=(c,o)=>{const e=original(c,o);spawn.push({tick:g.frame,e,dir:{...e.dir}});return e;};f.cast();
 assert.equal(p.cooldown,990);f.tick(9);assert.equal(spawn.length,0);f.tick(1);assert.equal(spawn.length,1);
 p.lastAimDir=v(0,1);f.tick(52);assert.equal(spawn.length,14);
 assert.deepEqual(spawn.map(x=>x.tick),Array.from({length:14},(_,i)=>10+4*i));
 for(const [i,{e,dir}]of spawn.entries()){
  assert.equal(e.radius,i===13?35:27);near(e.damage,i===13?17.85:11.55);near(e.speed,31.5);
  near(dir.x,1);near(dir.y,0);assert.ok(!e.homing);assert.equal(e.bounces,0);
 }
 f.tick(200);assert.equal(f.shots().length,0);
});

test('Fallout enlarges only the 150f radiation area; blast, DOT and once-per-life death damage stay fixed',t=>{
 const f=setup(t,'007'),{g,R,p,q}=f,areas=[],area=R.area;
 R.area=(...args)=>{areas.push({frame:g.frame,radius:args[2],damage:args[3]});return area(...args);};f.cast();f.tick(35);
 assert.equal(areas.length,0);f.tick(1);assert.deepEqual(areas,[{frame:36,radius:290,damage:86.1}]);
 const zone=R.world(g).entities.find(e=>e.kind==='radiation');assert.ok(zone);assert.equal(zone.radius,290);assert.equal(zone.damage,11.55);assert.equal(zone.end-zone.start,150);assert.equal(zone.tickEvery,30);
 f.place(q,zone.pos.x,zone.pos.y);q.rw.impulse=null;const hits=[],take=q.takeDamage;q.takeDamage=function(n,...args){hits.push({tick:g.frame,n});return take.call(this,n,...args);};
 f.tick(150);assert.deepEqual(hits.map(h=>h.tick),[66,96,126,156,186]);for(const hit of hits)near(hit.n,11.55*p.damageMult);
 assert.ok(!R.world(g).entities.includes(zone));
 const ctx=R.context(p,g,f.v(1)),death=R.defs[p.ability.id].onDeath;death(ctx);death(ctx);
 assert.deepEqual(areas.slice(1),[{frame:g.frame,radius:180,damage:30}]);
});

test('Plague expands 160 to 380 in exactly 90f and keeps 300f lifespan, 30f tick and damage',t=>{
 const f=setup(t,'014'),{g,R,p,q}=f;f.cast();const zone=R.world(g).entities.find(e=>e.kind==='poison');
 assert.equal(zone.radius,160);assert.equal(zone.maxRadius,380);assert.equal(zone.growFrames,90);assert.equal(zone.end-zone.start,300);near(zone.damage,15.862);
 f.place(q,zone.pos.x,zone.pos.y);const hits=[],take=q.takeDamage;q.takeDamage=function(n,...args){hits.push({tick:g.frame,n});return take.call(this,n,...args);};
 f.tick(45);near(zone.radius,270);f.tick(45);near(zone.radius,380);f.tick(209);assert.ok(R.world(g).entities.includes(zone));f.tick(1);
 assert.ok(!R.world(g).entities.includes(zone));assert.deepEqual(hits.map(h=>h.tick),[30,60,90,120,150,180,210,240,270,300]);for(const h of hits)near(h.n,15.862*p.damageMult);
});

test('Mountain uses faster real self-pull and 450f cooldown without damaging/moving its anchor',t=>{
 const f=setup(t,'142'),{g,R,p,q}=f;f.place(q,500);g.rebuildSpatialGrid();const hp=q.hp,skill=R.defs[p.ability.id].skill;
 assert.equal(skill.range,800);assert.equal(skill.speed,36);assert.equal(skill.pullSpeed,38);
 R.hit=()=>{throw Error('self-grapple must not enter attack path');};f.cast();assert.equal(p.cooldown,450);
 let step=0;for(let i=0;i<50;i++){const x=p.pos.x;f.tick(1);step=Math.max(step,p.pos.x-x);}
 near(step,38);assert.ok(p.pos.x>300);assert.ok(p.pos.x<q.pos.x-p.radius);near(q.pos.x,500);near(q.hp,hp);near(q.vel.mag(),0);assert.equal(q.stunned,0);assert.equal(R.inputLocks(p,g).move,false);
});

test('Bowling remains one straight penetrating projectile, one damage21/push per enemy, stopped by wall',t=>{
 const f=setup(t,'034'),{w,g,R,p,q}=f;f.place(q,160);g.walls=[new w.Wall(420,0,20,300,0)];g.rebuildSpatialGrid();
 const hits=[],take=q.takeDamage;q.takeDamage=function(n,...args){hits.push(n);return take.call(this,n,...args);};f.cast();assert.equal(p.cooldown,720);
 const [shot]=f.shots();assert.equal(f.shots().length,1);assert.equal(shot.damage,21);assert.equal(shot.radius,36);assert.equal(shot.knockback,42);assert.equal(shot.bounces,0);assert.equal(shot.pierce,true);
 f.tick(30);assert.equal(hits.length,1);near(hits[0],21*p.damageMult);assert.equal(q.stunned,0);assert.equal(f.shots().length,0);assert.ok(shot.pos.x<=410);
});

test('Burger actual five skill directions tighten to .125; 720 range and one push retain damage and basic',t=>{
 const f=setup(t,'063'),{g,R,p,q,w}=f;f.cast();const shots=f.shots();assert.equal(shots.length,5);
 for(const [i,e]of shots.entries()){near(Math.atan2(e.dir.y,e.dir.x),(i-2)*.125);near(e.range,720);near(e.speed,19.95);near(e.damage,18.9);}
 const pushes=[],hit=R.hit;R.hit=(c,t,d,o)=>{if(o?.knockback)pushes.push(o.knockback);return hit(c,t,d,o);};
 for(const e of shots)e.onHit(e.ctx,q,{valid:true});assert.deepEqual(pushes,[5]);
 const b=w.brBasicCombatProfile(p.ability);assert.equal(b.count,3);assert.equal(b.range,560);assert.equal(b.spread,.17);
 const guide=w.brAimSpec(p.ability,'skill',p.radius,1,p.run.mods);near(guide.halfAngle,.275);assert.equal(R.defs[p.ability.id].skill.countCap,9);
 // Preserve the existing global +3 multicast cap: this kit's metadata ceiling
 // is 9, but legal I/II/III choices produce 6/7/8 actual pellets, never 9.
 p.run.level=4;p.run.pending=3;
 for(let tier=1;tier<=3;tier++){
  const offerId='burger-multicast-'+tier;p.run.offer={id:offerId,cards:[w.brRunCard(p,'multicast',tier)]};
  assert.equal(w.brChooseRun(p,offerId,'multicast'),true);assert.equal(p.run.mods.skillCount,tier);
  const previous=new Set(f.shots());f.cast();const augmented=f.shots().filter(e=>!previous.has(e));
  assert.equal(augmented.length,5+tier);assert.ok(augmented.length<=9);
  for(const [i,e]of augmented.entries()){near(Math.atan2(e.dir.y,e.dir.x),(i-(augmented.length-1)/2)*.125);near(e.range,720);near(e.damage,18.9);near(e.ctx.run.damage,.95);}
 }
 near(w.brAimSpec(p.ability,'skill',p.radius,1,p.run.mods).halfAngle,.4625);
 const previous=new Set(f.shots());p.run.mods.skillCount=99;f.cast();
 assert.equal(f.shots().filter(e=>!previous.has(e)).length,8,'invalid extra count cannot bypass the preserved +3 runtime cap');
 w.brRecomputeRun(p);assert.equal(p.run.mods.skillCount,3);assert.equal(w.brBasicCombatProfile(p.ability).count,3);
});

test('Hunter real arrow uses 42/12, five-second three-charge mark consumed once per basic action',t=>{
 const f=setup(t,'087'),{g,R,p,q}=f;let markedAt;const original=R.mark;R.mark=(...args)=>{markedAt=g.frame;return original(...args);};f.place(q,180);g.rebuildSpatialGrid();f.cast();assert.equal(p.cooldown,570);
 const shot=f.shots()[0];assert.equal(shot.radius,12);assert.equal(shot.speed,42);near(shot.damage,23.32);f.tick(5);
 const mark=R.state(q).marks.find(m=>m.kind==='hunter');assert.ok(mark);assert.equal(mark.end,markedAt+300);assert.equal(mark.charges,3);assert.equal(mark.bonus,17);
 for(let i=0;i<3;i++){const snapshot=R.basicAttempt(p,g,f.v(1));const a=R.basicDamage(p,q,10,'basic'+i,snapshot),b=R.basicDamage(p,q,10,'same-basic'+i,snapshot);near(a,10+17*p.damageMult);near(b,10);assert.equal(mark.charges,2-i);}
 near(R.basicDamage(p,q,10,'next',R.basicAttempt(p,g,f.v(1))),10);
 f.cast();f.tick(5);q.lifeSeq++;f.tick(1);assert.equal(R.state(q).marks.length,0);
});

test('Hunter marking arrow and Bubble homing retain wall, visibility and life cleanup',t=>{
 for(const id of ['087','056']){
  const f=setup(t,id),{w,g,R,p,q}=f;f.place(q,340,30);g.walls=[new w.Wall(160,0,24,500,0)];g.rebuildSpatialGrid();const hp=q.hp;f.cast();f.tick(100);near(q.hp,hp);assert.equal(R.state(q).marks.length,0);assert.equal(f.shots().length,0);
  g.walls=[];f.place(q,500,50);q.invisible=true;f.cast();const shot=f.shots()[0];f.tick(10);near(shot.dir.y,0);assert.equal(shot.target??null,null);
  R.cleanup(p,g,'life');assert.equal(f.shots().length,0);
 }
});

test('Bubble actual skill turns .035 rad/frame at speed10/radius34; basic weak homing and CC cap stay intact',t=>{
 const f=setup(t,'056'),{g,R,p,q,w}=f;f.place(q,400,200);g.rebuildSpatialGrid();f.cast();assert.equal(p.cooldown,420);
 const shot=f.shots()[0];assert.equal(shot.speed,10);assert.equal(shot.radius,34);assert.equal(shot.turnRate,.035);assert.equal(shot.stun,30);assert.equal(shot.stunCap,42);near(shot.damage,10.3);
 f.tick(9);assert.ok(shot.dir.y>0);assert.ok(Math.atan2(shot.dir.y,shot.dir.x)<=9*.035+1e-8);
 const basic=w.brBasicCombatProfile(p.ability);assert.equal(basic.homingTurnRate,.025);assert.equal(basic.stun,0);
 f.tick(150);assert.equal(f.shots().length,0);
});
