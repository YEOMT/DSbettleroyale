import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuleContext,createWorld,destroyWorld,stepWorld,applyCommand,getTeacherState} from '../../packages/engine/src/index.js';
import {stunFrames} from '../../packages/engine/src/progression/control-policy.js';
import {tiers357,melee357} from '../v35-7/approved.mjs';
import {display} from '../../packages/content/src/display.js';
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
function fixture(t,id,paths={}){
 const w=createWorld(undefined,{mode:'solo',mapIndex:0},'overdrive357',[
  {id:'owner',name:'Synthetic owner',abilityId:'emoji-'+id},{id:'target',name:'Synthetic target',abilityId:'emoji-137'}]);
 t.after(()=>destroyWorld(w));const g=w.game,R=w.BRRework,[p,q]=g.participants,v=(x,y=0)=>new w.Vec2(x,y);
 w.brFarm.dispose(g);g.finalPhaseTriggered=true;g.walls=[];g.zones=[];g.smokes=[];
 const place=(a,x,y=0)=>{a.pos=v(x,y);a.vel=v(0);a.combatPreviousX=x;a.combatPreviousY=y;a.combatPreviousWarp=a.warpSeq||0;};
 place(p,0);place(q,1400);for(const a of [p,q]){a.spawnProtectionUntilFrame=0;a.hp=a.maxHp=100000;a.cooldown=a.basicCooldown=0;}
 p.run.paths={...paths};w.brRecomputeRun(p);g.rebuildSpatialGrid();
 return {w,g,R,p,q,v,place,tick(n){for(let i=0;i<n;i++){g.frame++;w.timeMs+=1000/60;g.rebuildSpatialGrid();R.tick(g);}},
  cast(){assert.equal(w.brCastPlayerSkill(p,g,v(1),1),true,id+' cast');}};
}
test('all ten cumulative tiers, melee/ranged split, approved caps and legal five-choice builds',()=>{
 const w=createRuleContext();for(const id of ['emoji-025','emoji-137']){
  const a=w.EMOJI_DB.find(a=>a.id===id),c=w.brRunCapabilities(a),close=w.brBasicCombatProfile(a).close;
  for(const [path,[field,values]]of Object.entries(tiers357))for(let tier=1;tier<=3;tier++){
   const m=w.brRunModsForPaths({[path]:tier},c,a);near(m[field],close&&melee357[path]?melee357[path][tier-1]:values[tier-1]);
  }
 }
 const a=w.EMOJI_DB.find(a=>a.id==='emoji-025'),c=w.brRunCapabilities(a);
 const max=w.brRunModsForPaths(Object.fromEntries(Object.keys(w.BR_RUN_PATHS).map(k=>[k,3])),c,a);
 for(const [k,v]of Object.entries({basicDamage:3.5,basicKnockback:4,skillSize:2.5,skillControl:2.25,moveSpeed:2,signatureRange:2,signatureDuration:2,skillDamage:2.56,basicSpeed:3,basicCount:3,skillCount:3}))near(max[k],v);
 // Artificial over-cap input is separate from legal five-choice gameplay.
 w.BR_RUN_PATHS.amplify.tiers[2].skillDamage=99;
 near(w.brRunModsForPaths({amplify:3},c,a).skillDamage,2.75);
 w.BR_RUN_PATHS.amplify.tiers[2].skillDamage=2.5;
 for(const paths of [{quick:3,expansion:2},{heavy:3,rapid:2},{impact:3,wide:2},{signature_duration:3,quick:2},{regen:3,titan:2},{signature_range:3,swift:2}]){
  assert.equal(Object.values(paths).reduce((a,b)=>a+b),5);const m=w.brRunModsForPaths(paths,c,a);
  if(paths.quick===3)near(m.skillCooldown,.3);
 }
});
test('CONTROL shared policy: unselected caps exact; 1s stun 84/108/135f; long/special/zero exceptions',()=>{
 for(const base of [0,8,21,30,36,45,60,66,90,180,240])for(const cap of [undefined,base,base*1.3])for(const mult of [1,1.275,1.715]){
  assert.equal(stunFrames(base,mult,cap,0),base?Math.round(Math.min(cap??base*1.35,base*mult)):0);
 }
 assert.deepEqual([1.4,1.8,2.25].map(n=>stunFrames(60,n,78,1)),[84,108,135]);
 assert.equal(stunFrames(90,2.25,120,3),180);assert.equal(stunFrames(180,2.25,216,3),216);
 assert.equal(stunFrames(240,2.25,300,3),300);assert.equal(stunFrames(0,2.25,0,3),0);
});
for(const id of ['001','002','085','110','026','030','133','042','056','152'])test(`${id}: actual authority stun equals preview at every tier, once per cast/life`,t=>{
 for(let tier=0;tier<=3;tier++){
  const {w,g,R,p,q,v}=fixture(t,id,tier?{control:tier}:{}),s=R.defs[p.ability.id].skill,base=s.stunFrames??s.stun,c=R.context(p,g,v(1));
  assert.equal(R.applyStun(c,q,base,s.stunCap),true);assert.equal(q.stunned,w.brRunMeasured(p,p.run.mods).stunFrames);
  const expected=q.stunned;q.stunned--;assert.equal(R.applyStun(c,q,base,s.stunCap),false);assert.equal(q.stunned,expected-1);
  q.lifeSeq++;assert.equal(R.applyStun(c,q,base,s.stunCap),true);
  assert.equal(display.cards[p.ability.id].facts.skill.controlStunFrames[tier],expected);
 }
});
test('actual hammer contact, stun expiry/input unlock; old cast not upgraded; spotlight no-op cards excluded',t=>{
 const f=fixture(t,'042',{control:3}),{w,g,R,p,q,v,place}=f;place(q,100);g.rebuildSpatialGrid();f.cast();f.tick(20);
 assert.equal(q.stunned,135);assert.equal(R.inputLocks(q,g).move,true);
 for(let i=0;i<134;i++)stepWorld(w);assert.equal(q.stunned,1);stepWorld(w);assert.equal(q.stunned,0);assert.equal(R.inputLocks(q,g).move,false);
 const old=R.context(p,g,v(1));p.run.paths.control=1;w.brRecomputeRun(p);assert.equal(old.run.control,2.25);
 const j=fixture(t,'152',{control:1});assert.equal(j.w.brRunEffectiveNext(j.p,'control'),false);assert.match(j.w.brRunCard(j.p,'control',2).detail,/상한 유지/);
 const n=fixture(t,'112'),snap=n.w.brRunSkillSnapshot(n.p);n.p.run.paths.control=3;n.w.brRecomputeRun(n.p);
 n.R.nativeStun(n.q,26,n.p,snap);assert.equal(n.q.stunned,26,'unselected in-flight snapshot');
 n.q.stunned=0;const fresh=n.w.brRunSkillSnapshot(n.p);n.R.nativeStun(n.q,26,n.p,fresh);assert.equal(n.q.stunned,59);
 n.q.stunned=20;n.R.nativeStun(n.q,26,n.p,fresh);assert.equal(n.q.stunned,20,'native multicast snapshot hit ledger');
});
test('all 86 actual QUICK III cooldowns: 70% reduction, no changed windup/channel/recast timers',t=>{
 const r=createRuleContext();for(const a of r.EMOJI_DB){
  const rows=[];for(const tier of [0,3]){
   const f=fixture(t,a.id.slice(-3),tier?{quick:3}:{}),{w,R,p,g}=f;f.cast();
   const recast=R.state(p).recast,entity=R.world(g).entities.find(e=>e.kind==='channel'||e.kind==='schedule'||e.kind==='dash');
   const window=recast?recast.end-g.frame:null;if(recast)R.closeRecast(p,g,'fixture-end');
   rows.push({cooldown:p.cooldown,window,duration:entity?entity.end-entity.start:null,measured:w.brRunMeasured(p,p.run.mods).skillFrames});
   if(R.defs[a.id]||w.brGetPlayableSkillInfo(a))assert.equal(p.cooldown,rows.at(-1).measured,a.id+' actual preview');
  }
  near(rows[1].cooldown,rows[0].cooldown*.3,1);assert.equal(rows[1].window,rows[0].window,a.id+' recast window');assert.equal(rows[1].duration,rows[0].duration,a.id+' preparation/channel');
 }
});
for(const id of ['025','131','137','087','034','070'])for(const path of ['heavy','impact'])test(`${id} ${path}: real basic HP/impulse, no new stun or skill scaling`,t=>{
 const rows=[];for(let tier=0;tier<=3;tier++){
  const f=fixture(t,id,tier?{[path]:tier}:{}),{w,g,R,p,q,v,place}=f,close=w.brBasicCombatProfile(p.ability).close;
  place(q,close?145:220);g.rebuildSpatialGrid();const hp=q.hp;assert.equal(w.brBasicAttack(p,g,v(1)),true);
  for(let n=0;n<60&&q.hp===hp;n++)for(const s of [...g.projectiles])if(s.life>0)s.update(g);
  assert.ok(q.hp<hp,id+' actual basic contact');assert.equal(q.stunned,0);
  const impulse=R.state(q).impulse;assert.ok(impulse);rows.push({damage:hp-q.hp,push:Math.hypot(impulse.x,impulse.y)});
  const m=p.run.mods;assert.equal(m.skillDamage,1);assert.equal(m.skillControl,1);
  if(tier){const [field,values]=tiers357[path],factor=close?melee357[path][tier-1]:values[tier-1];
   near(rows[tier][path==='heavy'?'damage':'push']/rows[0][path==='heavy'?'damage':'push'],factor,1e-6);
   near(rows[tier][path==='heavy'?'push':'damage']/rows[0][path==='heavy'?'push':'damage'],path==='heavy'?1:[.95,1,1.055][tier-1],1e-6);
  }
 }
});
for(const id of ['139','025','056'])test(`${id}: SWIFT III real input movement doubles with unchanged stop/reversal`,t=>{
 const travelled=[];for(const tier of [0,3]){
  const {w,p}=fixture(t,id,tier?{swift:tier}:{});let start;
  for(let tick=1;tick<=90;tick++){applyCommand(w,{type:'INPUT',playerId:p.remoteId,lifeSeq:p.lifeSeq,seq:tick,clientTick:tick,move:{x:1,y:0},aim:{x:1,y:0}});stepWorld(w);if(tick===30)start=p.pos.x;}
  travelled.push(p.pos.x-start);const prior=p.pos.x;
  for(let tick=91;tick<=96;tick++){applyCommand(w,{type:'INPUT',playerId:p.remoteId,lifeSeq:p.lifeSeq,seq:tick,clientTick:tick,move:{x:-1,y:0},aim:{x:1,y:0}});stepWorld(w);}assert.ok(p.pos.x<prior);
 }near(travelled[1]/travelled[0],2);
});
for(const id of ['056','087','139'])test(`${id}: REGEN every tier exact delay/rate, damage reset and dead/end/boundary guards`,t=>{
 for(let tier=1;tier<=3;tier++){
  const {w,g,p,q,v}=fixture(t,id,{regen:tier});p.hp=p.maxHp*.5;p.run.lastDamageFrame=10;const hp=p.hp,delay=tiers357.regen[1][tier-1];
  g.frame=10+delay-1;w.brUpdateRunWorld(g);near(p.hp,hp);g.frame++;w.brUpdateRunWorld(g);near(p.hp-hp,p.maxHp*[.028,.045,.065][tier-1]/60);
  p.takeDamage(10,q,false,v(1),{scaled:true});assert.equal(p.run.lastDamageFrame,g.frame);const after=p.hp;g.frame++;w.brUpdateRunWorld(g);assert.equal(p.hp,after);
  p.run.lastDamageFrame=0;p.alive=false;g.frame+=delay;w.brUpdateRunWorld(g);assert.equal(p.hp,after);p.alive=true;
  g.isGameOver=true;w.brUpdateRunWorld(g);assert.equal(p.hp,after);g.isGameOver=false;p.pos=v(g.worldRadius+1000);w.brUpdateRunWorld(g);assert.equal(p.hp,after);
 }
});
test('legal choices preserve HP ratio, reject duplicates/life/stale offers and sixth choice',t=>{
 const {w,p}=fixture(t,'003');p.hp=p.maxHp*.37;p.run.level=6;p.run.pending=5;
 for(const id of ['quick','quick','quick','expansion','expansion']){
  const tier=(p.run.paths[id]||0)+1,offerId='legal-'+p.run.choices;p.run.offer={id:offerId,cards:[w.brRunCard(p,id,tier)]};
  assert.equal(w.brChooseRun(p,offerId,id),true);near(p.hp/p.maxHp,.37);assert.equal(w.brChooseRun(p,offerId,id),false);
 }assert.equal(p.run.choices,5);assert.deepEqual(p.run.paths,{quick:3,expansion:2});p.run.pending=1;p.run.offer={id:'six',cards:[w.brRunCard(p,'expansion',3)]};assert.equal(w.brChooseRun(p,'six','expansion'),false);
});
for(const id of ['007','003','137'])test(`${id}: AMPLIFY I/II/III actual first skill HP damage, basic budget untouched`,t=>{
 const damage=[];
 for(let tier=0;tier<=3;tier++){
  const f=fixture(t,id,tier?{amplify:tier}:{}),{w,g,p,q,place}=f;place(q,120);g.rebuildSpatialGrid();
  const taken=[],take=q.takeDamage;q.takeDamage=function(n,...args){const before=this.hp,result=take.call(this,n,...args);if(this.hp<before)taken.push(before-this.hp);return result;};
  f.cast();for(let i=0;i<100&&!taken.length;i++){f.tick(1);for(const shot of [...g.projectiles])if(shot.life>0)shot.update(g);}
  assert.ok(taken.length,id+' real skill hit');damage.push(taken[0]);assert.equal(p.run.mods.basicDamage,1);
  if(tier)near(damage[tier]/damage[0],tiers357.amplify[1][tier-1],1e-6);
 }
});
test('EXPANSION every tier: native/rework projectile, growing zone and rect actual geometry equals wire/guide',t=>{
 for(let tier=1;tier<=3;tier++){
  const scale=tiers357.expansion[1][tier-1];
  for(const id of ['003','094']){
   const f=fixture(t,id,{expansion:tier}),{w,g,R,p}=f;f.cast();f.tick(30);
   const shot=id==='003'?R.world(g).entities.find(e=>e.kind==='projectile'):g.projectiles[0];assert.ok(shot);
   near(shot.radius??shot.size,(id==='003'?27:10)*scale);
   if(id==='003'){const wire=R.wireEntities(g).find(e=>e.id===shot.id);near(wire.radius,shot.radius);near(w.brAimSpec(p.ability,'skill',p.radius,1,p.run.mods).width,shot.radius*2);}
  }
  const f=fixture(t,'014',{expansion:tier}),{w,g,R,p}=f;f.cast();const zone=R.world(g).entities.find(e=>e.kind==='poison');assert.ok(zone);near(zone.radius,160*scale);near(zone.maxRadius,380*scale);
  const guide=w.brAimSpec(p.ability,'skill',p.radius,1,p.run.mods);near(guide.radius,zone.radius);
  f.tick(90);near(zone.radius,380*scale);near(R.wireEntities(g).find(e=>e.id===zone.id).radius,zone.radius);
  const f2=fixture(t,'121',{expansion:tier}),{g:g2,q,place}=f2;place(q,160,150*scale+q.radius-2);g2.rebuildSpatialGrid();const hp=q.hp;f2.cast();f2.tick(11);assert.ok(q.hp<hp,'rect enlarged edge is a real hit');assert.equal(q.stunned,0);
 }
});
test('EXPANSION circle enlarged edge hits; fixed old radius misses, damage bonus only once',t=>{
 const rows=[];for(const tier of [0,3]){
  const f=fixture(t,'007',tier?{expansion:tier}:{}),{g,q,place}=f;place(q,550);g.rebuildSpatialGrid();const hp=q.hp;f.cast();f.tick(50);rows.push(hp-q.hp);
 }assert.equal(rows[0],0);assert.ok(rows[1]>0);
});
test('AFTERGLOW durations I/II/III and QUICK combination, turret/zone replacement and owner-life cleanup',t=>{
 for(let tier=1;tier<=3;tier++)for(const id of ['012','014']){
  const f=fixture(t,id,{signature_duration:tier}),{w,g,R,p}=f;assert.ok(w.brRunEligible(p,'signature_duration'));f.cast();
  const kind=id==='012'?'turret':'poison',entity=R.world(g).entities.find(e=>e.kind===kind),duration=Math.round((id==='012'?1440:300)*tiers357.signature_duration[1][tier-1]);assert.equal(entity.end-entity.start,duration);
  if(id==='014'){f.tick(duration-1);assert.equal(entity.dead,false);f.tick(1);assert.ok(!R.world(g).entities.includes(entity));}
  else{for(let i=0;i<4;i++){p.cooldown=0;f.cast();}assert.equal(R.world(g).entities.filter(e=>!e.dead&&e.kind===kind).length,3);}
  p.lifeSeq++;f.tick(1);assert.equal(R.world(g).entities.filter(e=>!e.dead&&e.ctx.owner===p).length,0);
 }
 const f=fixture(t,'014',{signature_duration:3,quick:2});f.cast();const entity=f.R.world(f.g).entities.find(e=>e.kind==='poison');assert.equal(entity.end-entity.start,600);assert.equal(f.p.cooldown,Math.round(1020*.582));
});
for(const id of ['004','027','142'])test(`${id}: LONG STEP I/II/III actual reachable distance, guide and unchanged basic range`,t=>{
 const rows=[];for(let tier=0;tier<=3;tier++){
  const f=fixture(t,id,tier?{signature_range:tier}:{}),{w,g,R,p,q,place}=f;assert.ok(w.brRunEligible(p,'signature_range'));place(q,2500);g.rebuildSpatialGrid();
  if(id==='142'){g.walls=[new w.Wall(1250,0,20,300,0)];g.rebuildSpatialGrid();}
  const start=p.pos.x;f.cast();const live=R.world(g).entities.find(e=>['dash','grapple'].includes(e.kind)),requested=live?.range;
  f.tick(140);rows.push({travel:p.pos.x-start,requested,guide:w.brAimSpec(p.ability,'skill',p.radius,1,p.run.mods).range});assert.equal(p.run.mods.basicRange,1);
  if(tier&&id!=='142')near(rows[tier].guide/rows[0].guide,tiers357.signature_range[1][tier-1]);
  if(id==='142'&&tier===3){assert.ok(rows[tier].travel>800);assert.ok(rows[tier].travel<1250-p.radius,'self grapple stops before wall');near(requested,1600);}
 }
 if(id!=='142')for(let tier=1;tier<=3;tier++)near(rows[tier].travel/rows[0].travel,tiers357.signature_range[1][tier-1],.015);
});
test('QUICK I/II native/rework actual cooldown, retained non-damage penalty and no skill damage on support',t=>{
 for(const id of ['023','092','027','137','142','014'])for(const tier of [1,2]){
  const f=fixture(t,id,{quick:tier}),{w,R,p,g}=f;f.cast();if(R.state(p).recast)R.closeRecast(p,g,'fixture-end');
  assert.equal(p.cooldown,w.brRunMeasured(p,p.run.mods).skillFrames);
  if(!p.run.capabilities.skill.damage){assert.equal(p.run.mods.skillDamage,1);assert.ok(p.run.mods.skillDuration<1||p.run.mods.skillRestore<1||!p.run.capabilities.skill.duration);}
 }
});
test('native dash preview is the real collision stun; non-attacking soap never grants stun',t=>{
 for(const id of ['031','040','128','054'])for(const tier of [0,3]){
  const f=fixture(t,id,tier&&id!=='054'?{control:tier}:{}),{w,g,p,q,place}=f;place(q,150);g.rebuildSpatialGrid();f.cast();let peak=0;
  for(let i=0;i<30;i++){stepWorld(w);peak=Math.max(peak,q.stunned);}
  const expected=w.brRunMeasured(p,p.run.mods).stunFrames;
  assert.ok(peak===expected||expected>0&&peak===expected-1,id+' per-step stun '+peak+'/'+expected);
  if(id==='054')assert.equal(expected,0);
 }
});
test('REGEN actual periodic damage resets quiet window; CONTROL scales existing push/pull without new stun',t=>{
 const f=fixture(t,'139',{regen:3}),{w,g,R,p,q,v}=f;p.hp=p.maxHp*.5;
 R.dot(R.context(q,g,v(-1)),p,{damage:1,duration:90,tickEvery:30,maxStacks:1});f.tick(30);assert.equal(p.run.lastDamageFrame,g.frame);
 const hp=p.hp;g.frame+=59;w.brUpdateRunWorld(g);assert.equal(p.hp,hp);g.frame++;w.brUpdateRunWorld(g);assert.ok(p.hp>hp);
 for(const id of ['010','121'])for(let tier=1;tier<=3;tier++){
  const b=fixture(t,id,{control:tier}),{w,g,R,p,q,v,place}=b,c=R.context(p,g,v(1));place(q,150);g.rebuildSpatialGrid();
  if(id==='121'){R.impulse(c,q,v(1),42);near(R.state(q).impulse.x,42*tiers357.control[1][tier-1]);}
  else{R.zone(c,{pos:v(0),radius:20,pullRadius:300,pull:1.1,damage:0,duration:30});const before=q.pos.x;b.tick(1);near(before-q.pos.x,1.1*tiers357.control[1][tier-1]);}
  assert.equal(q.stunned,0);
 }
});
