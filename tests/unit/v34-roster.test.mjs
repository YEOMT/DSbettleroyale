import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,destroyWorld,stepWorld,applyCommand} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';

const near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps,`${a} differs from ${b}`);
function fixture(id,mode='solo',players=2){
 const entries=[{id:'a',name:'A',abilityId:id},{id:'b',name:'B',abilityId:'emoji-114'}];
 for(let i=2;i<players;i++)entries.push({id:'extra'+i,name:'Extra',abilityId:'emoji-114'});
 const w=createWorld(undefined,{mode},'v34-roster',entries),g=w.game,[p,q]=g.participants;
 g.walls=[];g.smokes=[];w.brFarm.dispose(g);
 const v=(x,y)=>new w.Vec2(x,y);
 p.pos=v(0,0);q.pos=v(700,0);for(const a of [p,q]){a.vel=v(0,0);a.spawnProtectionUntilFrame=0;}
 q.hp=q.maxHp=10000;g.rebuildSpatialGrid();
 const R=w.BRRework;
 return {w,g,p,q,R,v,tick(n){for(let i=0;i<n;i++){g.frame++;w.timeMs=g.frame*1000/60;R.tick(g);}},cast:(dir=v(1,0))=>R.cast(p,g,dir),close:()=>destroyWorld(w)};
}
test('all five F characters use each final HP/attack multiplier once and preserve current health ratio',()=>{
 const expected=[[2,2.25],[2.85,3.45],[3.6,4.85]];
 const ids=manifest.roster.filter(a=>a.tier==='F').map(a=>a.id);
 assert.deepEqual(ids,['emoji-052','emoji-054','emoji-056','emoji-149','emoji-150']);
 for(const id of ids){const f=fixture(id),{w,p,q}=f;try{
  const base=p.maxHp;p.hp=base*.75;
  for(const [i,[hp,attack]] of expected.entries()){
   p.run.paths.wanggui=i+1;w.brRecomputeRun(p);
   near(p.maxHp,base*hp);near(p.hp/p.maxHp,.75);near(p.run.mods.wangguiPower,attack);
   const before=q.hp;q.takeDamage(10,p,false,null,{scaled:true,basic:true});near(before-q.hp,10*attack);
  }
  if(id==='emoji-052')assert.equal(p.maxHp,1440);
 }finally{f.close();}}
});
test('authoritative flat-world walk over 60 inputs increases only the four designated kit speeds',t=>{
 const samples=[['139',135.99662214817153,1.18],['028',238.2632804463429,1.27/1.14],['007',217.64434271540966,1.3/1.2],['132',224.27964906464763,1.38/1.296],['114',299.5322207959889,1]];
 const rows=[];
 for(const [suffix,before,ratio] of samples){const f=fixture('emoji-'+suffix),{w,p,q,g,v}=f;try{
  q.pos=v(0,1800);g.rebuildSpatialGrid();
  for(let i=1;i<=60;i++){applyCommand(w,{type:'INPUT',playerId:'a',seq:i,clientTick:i,lifeSeq:0,move:{x:1,y:0},aim:{x:1,y:0}});stepWorld(w);}
  near(p.pos.x,before*ratio);rows.push({id:p.ability.id,before,after:p.pos.x});
 }finally{f.close();}}t.diagnostic(JSON.stringify(rows));
});
test('Void beam resolves 25 hits of base coefficient 10, with the existing steering, wall and locks',t=>{
 const f=fixture('emoji-132'),{p,q,R,g,v}=f;try{
  const damageMult=p.damageMult;
  assert.equal(f.cast(),true);const beam=p.rw.channel;
  assert.deepEqual([beam.damage,beam.duration,beam.tickEvery,beam.turnRate,p.cooldown],[10,150,6,.038,1200]);
  assert.ok(R.inputLocks(p,g).move&&R.inputLocks(p,g).attack);assert.ok(R.steer(p,g,v(1,0),beam.ctx.castId));
  const losses=[];for(let i=1;i<=150;i++){const hp=q.hp;f.tick(1);if(q.hp<hp)losses.push(hp-q.hp);}
  assert.equal(losses.length,25);for(const damage of losses)near(damage,10*damageMult*beam.ctx.run.damage);
  t.diagnostic(JSON.stringify({coefficient:beam.damage,hits:losses.length,hpLoss:10000-q.hp}));
  f.tick(1);p.cooldown=0;g.walls=[new f.w.Wall(280,0,80,420,0)];const hp=q.hp;f.cast();f.tick(150);assert.equal(q.hp,hp);
 }finally{f.close();}
});
test('Alien returns once in its original life and window, and blocked returns consume the cooldown',()=>{
 for(const obstacle of ['none','ring','wall','body','expiry','stun','life']){
  const f=fixture('emoji-147'),{p,q,R,g,w,v}=f;try{
   assert.ok(f.cast());const id=p.rw.recast.ctx.castId;assert.equal(p.rw.recast.end,180);assert.equal(p.cooldown,0);
   assert.equal(R.recast(p,g,v(1,0),id),false,'dash still active');f.tick(14);near(p.pos.x,260);const warp=p.warpSeq||0;
   if(obstacle==='expiry'){f.tick(166);assert.equal(p.rw.recast,null);assert.equal(p.cooldown,420);continue;}
   if(obstacle==='stun'){p.stunned=12;f.tick(1);assert.equal(p.rw.recast,null);assert.equal(p.cooldown,420);continue;}
   if(obstacle==='life'){p.lifeSeq++;assert.equal(R.recast(p,g,v(1,0),id),false);continue;}
   if(obstacle==='ring')g.ringGeometry={cx:260,cy:0,radius:130};
   if(obstacle==='wall')g.walls=[new w.Wall(130,0,30,250,0)];
   if(obstacle==='body'){q.pos=v(0,0);g.rebuildSpatialGrid();}
   assert.equal(R.recast(p,g,v(0,1),'old-cast'),false);assert.ok(R.recast(p,g,v(0,1),id));
   near(p.pos.x,obstacle==='none'?0:260);assert.equal(p.warpSeq||0,warp+(obstacle==='none'?1:0));
   assert.equal(p.cooldown,420);assert.equal(R.recast(p,g,v(1,0),id),false);assert.equal(q.hp,10000);
  }finally{f.close();}
 }
});
test('Skate kick grants +45% to the first valid basic contact, same damage; a miss/timeout spends the charge',()=>{
 function sample(kick,miss=false,expire=false){
  const f=fixture('emoji-127'),{p,q,g,w,v}=f;try{
   if(kick){q.pos=v(0,1500);g.rebuildSpatialGrid();f.cast();f.tick(25);assert.ok(p.rw.buffs.some(b=>b.kind==='rollerKick'));}
   if(expire)f.tick(120);
   if(miss){w.brBasicAttack(p,g,v(1,0));p.basicCooldown=0;}
   q.pos=p.pos.add(v(95,0));q.vel=v(0,0);g.rebuildSpatialGrid();
   assert.ok(w.brBasicAttack(p,g,v(1,0)));return {push:q.rw.impulse.x,damage:10000-q.hp};
  }finally{f.close();}
 }
 const base=sample(false),charged=sample(true);near(charged.push,base.push*1.45);near(charged.damage,base.damage);
 assert.deepEqual(sample(true,true),base);assert.deepEqual(sample(true,false,true),base);
});
test('Scissors first plus two recasts, fixed deadline, per-volley aim/damage, no overlapping queues',()=>{
 for(const extra of [0,3]){
  const f=fixture('emoji-131'),{p,q,g,R,w,v}=f;try{
   const shots=[];q.pos=v(0,-1800);g.rebuildSpatialGrid();p.run.mods.skillCount=extra;
   const notify=w.entitySpawn;w.entitySpawn=(e,...args)=>{if(e.kind==='projectile')shots.push([e.damage,e.dir.x,e.dir.y]);notify?.(e,...args);};
   assert.ok(f.cast());let rec=p.rw.recast;const id=rec.ctx.castId;assert.deepEqual([rec.left,rec.end,p.cooldown],[2,180,0]);
   assert.equal(R.recast(p,g,v(0,1),id),false);f.tick(50);
   assert.equal(R.recast(p,g,v(0,1),id),true);assert.deepEqual([rec.left,rec.end,p.cooldown],[1,180,0]);
   assert.equal(R.recast(p,g,v(-1,0),id),false);f.tick(50);
   assert.ok(R.recast(p,g,v(-1,0),id));assert.equal(R.recast(p,g,v(1,0),id),false);assert.equal(p.cooldown,960);f.tick(50);
   assert.equal(shots.length,(5+extra)*3);
   for(const [i,s] of shots.entries()){const n=Math.floor(i/(5+extra));near(s[0],[26,15.6,11.7][n]);near(s[1],[1,0,-1][n]);near(s[2],[0,1,0][n]);}
  }finally{f.close();}
 }
 const f=fixture('emoji-131');try{f.cast();f.tick(179);assert.equal(f.p.cooldown,0);f.tick(1);assert.equal(f.p.cooldown,960);assert.equal(f.p.rw.recast,null);}finally{f.close();}
});
test('Traffic light uses fresh walking input at resolution, a visible 160° cone, no damage, and one strongest slow',()=>{
 for(const scenario of ['walking','stop','jitter','stale','behind','wall','ally','protected','blockedWalk']){
  const f=fixture('emoji-151','solo',4),{p,q,w,g,R,v}=f;try{
   q.pos=v(scenario==='behind'?-300:300,0);q.team=scenario==='ally'?1:0;p.team=1;g.rebuildSpatialGrid();
   if(scenario==='wall')g.walls=[new w.Wall(150,0,35,220,0)];
   assert.equal(w.brRunEligible(p,'control'),false,'fixed slow has no impulse or stun control upgrade');
   if(scenario==='blockedWalk')g.walls=[new w.Wall(q.pos.x+q.radius+24,0,40,500,0)];
   if(scenario==='protected')q.spawnProtectionUntilFrame=500;
   assert.ok(f.cast());const marker=R.wireEntities(g).find(e=>e.kind==='red-light-warning');
   assert.equal(marker.shape,'cone');near(marker.halfAngle,Math.PI*80/180);assert.equal(marker.length,780);assert.equal(marker.end,36);
   const before=q.hp;
   for(let i=1;i<=36;i++){
    const amount=scenario==='stop'&&i>28?0:scenario==='jitter'?.08:1;
    if(scenario!=='stale'||i<8)applyCommand(w,{type:'INPUT',playerId:'b',seq:i,clientTick:i,lifeSeq:0,move:scenario==='blockedWalk'?{x:1,y:0}:{x:0,y:amount},aim:{x:1,y:0}});
    stepWorld(w);if(i<36)near(R.moveRate(q),1);
    if(scenario==='blockedWalk'&&i===35){near(q.pos.x,q.combatPreviousX,.1);assert.ok(q.presentationDriveX>1);assert.ok(!g.checkWallBetween(p.pos,q.pos));}
   }
   const hit=scenario==='walking';near(R.moveRate(q),hit?.35:1);near(q.hp,before);assert.equal(p.cooldown,1020-36);
   if(hit){const effect=q.rw.buffs.find(b=>b.kind==='slow');assert.equal(effect.end,144);R.buff(effect.ctx,q,'slow',.6,30);near(R.moveRate(q),.35);f.tick(108);near(R.moveRate(q),1);}
  }finally{f.close();}
 }
});
test('actual homing trajectories keep their payload and turn less on the same escape and cover tracks',t=>{
 const rows=[];
 for(const [id,kind,oldRate,newRate] of [['036','skill',.055,.048],['085','skill',.052,.046],['085','attack',.045,.040]]){
  function tracks(rate){
   const result={straight:0,side:0,cover:0,maxTurn:0,damage:null,count:null};
   for(const track of ['straight','side','cover'])for(const lateral of [-215,-95,0,95,215]){
    const f=fixture('emoji-'+id),{p,q,g,w,R,v}=f;
    try{
     q.pos=v(390,lateral);g.rebuildSpatialGrid();
     if(track==='cover')g.walls=[new w.Wall(205,0,25,720,0)];
     if(kind==='attack')w.brBasicAttack(p,g,v(1,0));else f.cast();
     const shots=kind==='attack'?g.projectiles:g.rw.entities.filter(e=>e.kind==='projectile');
     assert.ok(shots.length>0);result.count=shots.length;result.damage=shots[0].damage;
     for(const shot of shots){
      const key=kind==='attack'?'homingTurnRate':'turnRate';near(shot[key],newRate);shot[key]=rate;
     }
     const angle=s=>Math.atan2((s.vel||s.dir).y,(s.vel||s.dir).x);
     for(let i=1;i<=70;i++){
      const before=shots.map(angle);
      q.pos=track==='side'?v(390,lateral+Math.sign(lateral||1)*i*5):v(390+i*3,lateral);
      q.combatPreviousX=q.pos.x;q.combatPreviousY=q.pos.y;g.rebuildSpatialGrid();f.tick(1);
      if(kind==='attack')for(const shot of shots)if(shot.life>0)shot.update(g);
      for(const [j,shot] of shots.entries()){const d=angle(shot)-before[j];result.maxTurn=Math.max(result.maxTurn,Math.abs(Math.atan2(Math.sin(d),Math.cos(d))));}
     }
     if(q.hp<q.maxHp)result[track]++;
    }finally{f.close();}
   }
   return result;
  }
  const before=tracks(oldRate),after=tracks(newRate);
  near(before.maxTurn,oldRate);near(after.maxTurn,newRate);assert.equal(after.count,before.count);near(after.damage,before.damage);
  assert.equal(after.cover,0);assert.equal(before.cover,0);assert.ok(after.straight>0);rows.push({id,kind,before,after});
 }
 t.diagnostic(JSON.stringify(rows));
});
