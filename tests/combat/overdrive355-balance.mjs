// Focused deterministic measurement, not a win-rate or long-run stability claim.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createWorld,createRuleContext,stepWorld,applyCommand,destroyWorld} from '../../packages/engine/src/index.js';
const label=process.argv[2]||'candidate',rules=createRuleContext(),start=performance.now(),rows=[];
const ids=['092','075','094','148','121','137','023','074','039','072','122'].map(n=>'emoji-'+n);
const opponents=['S','A','B','C','F'].map(t=>rules.EMOJI_DB.find(a=>a.t===t&&!a.teamOnly).id);
for(const id of ids)for(const level of [1,3,6])for(const opponent of opponents){
 const w=createWorld(undefined,{mode:'solo',mapIndex:0},'balance355-'+id+'-'+level+'-'+opponent,[{id:'p',name:'Synthetic',abilityId:id},{id:'q',name:'Target',abilityId:opponent}]);
 try{
  const g=w.game,p=w.byId.get('p'),q=w.byId.get('q'),v=(x,y=0)=>new w.Vec2(x,y);w.brFarm.dispose(g);g.finalPhaseTriggered=true;g.walls=[];g.zones=[];g.smokes=[];
  const close=w.brBasicCombatProfile(p.ability).close,path=close?'wide':'giant';p.run.level=level;
  p.run.paths=level===1?{}:level===3?{rapid:2}:{rapid:3,[path]:2};p.run.choices=level-1;w.brRecomputeRun(p);
  p.pos=v(0);q.pos=v(close?100:340);p.vel=q.vel=v(0);p.spawnProtectionUntilFrame=q.spawnProtectionUntilFrame=0;p.cooldown=p.basicCooldown=0;g.rebuildSpatialGrid();
  const hp=q.hp;let first=null,kill=null,hitEvents=0,spawns=0,peakShots=0,peakEntities=0,peakFragments=0;
  const damage=q.takeDamage;q.takeDamage=function(...args){const old=this.hp,result=damage.apply(this,args);if(this.hp<old){hitEvents++;first??=g.frame;}return result;};
  const spawn=w.entitySpawn;w.entitySpawn=e=>{spawns++;return spawn?.(e);};
  for(let tick=1;tick<=600&&p.alive&&q.alive;tick++){
   applyCommand(w,{type:'INPUT',playerId:'p',lifeSeq:p.lifeSeq,seq:tick,clientTick:tick,move:{x:0,y:0},aim:{x:1,y:0}});
   for(const kind of ['attack','skill'])applyCommand(w,{type:'ACTION',playerId:'p',lifeSeq:p.lifeSeq,seq:tick,kind,aim:{x:1,y:0},aimPower:1});
   stepWorld(w);peakShots=Math.max(peakShots,g.projectiles.length);peakEntities=Math.max(peakEntities,g.rw.entities.length);peakFragments=Math.max(peakFragments,g.rw.entities.filter(e=>e.style==='apple-fragment').length);if(!q.alive)kill=g.frame;
  }
  assert.ok(!p.runtimeFaults&&!q.runtimeFaults);assert.ok(Number.isFinite(q.hp));
  rows.push({id,level,opponent,tier:q.ability.t,targetHp:hp,damage:hp-q.hp,frames:g.frame,firstHitFrame:first,killFrame:kill,damagePerSecond:(hp-q.hp)/(g.frame/60),hitEvents,spawns,attackSequence:p.firedAttackSeq||0,skillSequence:p.firedSkillSeq||0,peakShots,peakEntities,peakFragments});
 }finally{destroyWorld(w);}
}
const dir='artifacts/v35-5';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/balance-'+label+'.json',JSON.stringify({label,rows,ms:performance.now()-start,scope:'165 deterministic 10s-max engine probes; legal 0/2/5 selections; stationary intentions, real knockback; no browser/real-classroom win-rate inference'},null,2));console.log(JSON.stringify({label,cases:rows.length,ms:performance.now()-start,status:'PASS'}));
