// Paired, deterministic synthetic targets; these samples are not student win rates.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {recoveryIds,runtimeProfiles} from '../v35-6/profile.mjs';
const label=process.argv[2]||'candidate',root=path.resolve(process.argv[3]||'.');
const {createRuleContext,createWorld,stepWorld,applyCommand,destroyWorld}=await import(pathToFileURL(path.join(root,'packages/engine/src/index.js')));
const {contentHash}=await import(pathToFileURL(path.join(root,'packages/content/src/manifest.js')));
const started=performance.now(),rows=[],rules=createRuleContext(),profiles=runtimeProfiles(rules);
for(const id of recoveryIds)for(const level of [1,3,6])for(const build of level===1?['plain']:['plain','representative'])for(const distance of [100,340,700])for(const moving of [false,true]){
 const key=[id,level,build,distance,moving].join(':'),events=[];
 const w=createWorld(undefined,{mode:'solo',mapIndex:0},'recovery356:'+key,[{id:'p',name:'Synthetic',abilityId:id},{id:'q',name:'Target',abilityId:'emoji-114'}],e=>{if(e.type==='SHOT_SPAWN')events.push({tick:e.serverTick,kind:e.data.actionKind});});
 try{
  const g=w.game,p=w.byId.get('p'),q=w.byId.get('q'),v=(x,y=0)=>new w.Vec2(x,y);
  w.brFarm.dispose(g);g.finalPhaseTriggered=true;g.walls=[];g.smokes=[];g.zones=[];g.escape=null;
  p.run.level=level;p.run.paths={};p.run.choices=0;
  if(build==='representative'){
   const primary=id==='emoji-056'?'wanggui':'quick';p.run.paths[primary]=level===3?2:3;
   if(level===6)p.run.paths.rapid=2;p.run.choices=level-1;
  }w.brRecomputeRun(p);
  p.pos=v(0);q.pos=v(distance);p.vel=q.vel=v(0);p.spawnProtectionUntilFrame=q.spawnProtectionUntilFrame=0;p.cooldown=p.basicCooldown=0;
  // Durable synthetic target permits the full 20s cast schedule and real push/CC.
  // Its offence is disabled through ordinary neutral intentions, not engine guards.
  q.hp=q.maxHp=100000;g.rebuildSpatialGrid();
  const initial=q.hp,damages=[];let first=null,stunnedTicks=0,slowedTicks=0,peakShots=0,skillUses=0,attackUses=0,lastSkill=0,lastAttack=0;
  const take=q.takeDamage;q.takeDamage=function(...args){const hp=this.hp,result=take.apply(this,args);if(this.hp<hp){first??=g.frame;damages.push({tick:g.frame,amount:hp-this.hp,periodic:!!args[4]?.periodic});}return result;};
  for(let tick=1;tick<=1200;tick++){
   for(const [actor,move]of [[p,v(0)],[q,moving?v(0,tick%160<80?.5:-.5):v(0)]])applyCommand(w,{type:'INPUT',playerId:actor.remoteId,lifeSeq:actor.lifeSeq,seq:tick,clientTick:tick,move,aim:v(1)});
   // The engine consumes one action per tick. Alternating kinds keeps both
   // intentions exercised without filling its bounded queue or starving skill.
   const kind=tick%2?'attack':'skill';assert.equal(applyCommand(w,{type:'ACTION',playerId:'p',lifeSeq:p.lifeSeq,seq:tick,kind,aim:v(1),aimPower:1}).accepted,true,key+' action admission');
   stepWorld(w);
   const skillSeq=p.firedSkillSeq||0,attackSeq=p.firedAttackSeq||0;
   if(skillSeq!==lastSkill){lastSkill=skillSeq;skillUses++;}if(attackSeq!==lastAttack){lastAttack=attackSeq;attackUses++;}
   assert.equal(w.actionPending.get('p')?.length||0,0,key+' drained action queue');
   if(q.stunned>0)stunnedTicks++;if(w.BRRework.moveRate(q)<1)slowedTicks++;
   peakShots=Math.max(peakShots,g.projectiles.length+(g.rw?.entities.filter(e=>!e.dead).length||0));
  }
  assert.equal((p.runtimeFaults||0)+(q.runtimeFaults||0),0,key);assert.ok(Number.isFinite(q.hp),key);assert.equal(g.frame,1200,key);assert.ok(attackUses>0&&skillUses>0,key+' actual basic and skill casts');
  rows.push({id,level,build,distance,moving,paths:p.run.paths,frames:g.frame,firstHit:first,hit:first!==null,damage:initial-q.hp,
   periodicDamage:damages.filter(d=>d.periodic).reduce((n,d)=>n+d.amount,0),damageEvents:damages.length,stunnedTicks,slowedTicks,attackUses,skillUses,
   skillShots:events.filter(e=>e.kind==='skill').length,peakShots,remainingHp:q.hp,finalDistance:Math.hypot(q.pos.x-p.pos.x,q.pos.y-p.pos.y)});
 }finally{destroyWorld(w);}
}
const report={label,contentHash,profiles:Object.fromEntries(recoveryIds.map(id=>[id,profiles[id]])),rows,ms:performance.now()-started,
 scope:'270 seeded 20s authority probes: 9 IDs x three distances x stationary/strafe x Lv1 plain / Lv3,6 plain+legal representative. Fixed +X aim, actual push, no auto tracking. Durable synthetic target; not human win-rate or real-time performance.'};
fs.mkdirSync('artifacts/v35-6',{recursive:true});fs.writeFileSync('artifacts/v35-6/balance-'+label+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({label,cases:rows.length,ms:report.ms,status:'PASS'}));
