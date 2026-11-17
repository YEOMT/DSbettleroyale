import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
import * as candidate from '../../packages/engine/src/index.js';
const baseline=await import(pathToFileURL(path.resolve(process.argv[2],'packages/engine/src/index.js'))),started=performance.now(),rows=[];
function scenario(engine,id,{boost=false}={}){
 const w=engine.createWorld(undefined,{mode:'team-elim',mapIndex:0},'polish-authority',[{id:'a',name:'A',abilityId:id,team:1},{id:'b',name:'B',abilityId:'emoji-114',team:2},{id:'c',name:'C',abilityId:'emoji-113',team:2}]);
 try{const [a,b,c]=w.game.participants,g=w.game,hits=[],farms=[];w.brFarm.dispose(g);g.walls=[];g.smokes=[];g.finalPhaseTriggered=true;for(const [i,p]of [a,b,c].entries()){p.pos=new w.Vec2(i===2?-3000:i*120,0);p.vel=new w.Vec2(0,0);p.hp=p.maxHp=1e6;p.spawnProtectionUntilFrame=0;}
  if(boost){a.run.mods.skillDamage=1.3;a.run.mods.skillDuration=1.2;a.run.paths.wanggui=3;w.brRecomputeRun(a);a.combatBuff={kind:'attack',life:a.lifeSeq,end:6000};}
  const damage=b.takeDamage.bind(b);b.takeDamage=(amount,owner,reflected,dir,opts={})=>{const hp=b.hp,result=damage(amount,owner,reflected,dir,opts);if(owner===a)hits.push({tick:g.frame,amount,loss:hp-b.hp,periodic:!!opts.periodic,kind:opts.ctx?.actionKind||opts.attackKind||'',style:opts.style||'',stun:b.stunned});return result;};w.brFarm.area=(g,owner,pos,radius,amount,key)=>{if(owner===a)farms.push({tick:g.frame,radius,amount});};g.rebuildSpatialGrid();const cast=w.brCastPlayerSkill(a,g,new w.Vec2(1,0),1);assert.notEqual(cast,false,id+' actual cast');
  for(let t=1;t<=620;t++){
   const zone=g.rw?.entities.find(e=>!e.dead&&['fire','radiation','gravity','poison','thorns'].includes(e.kind))||g.rw?.entities.find(e=>!e.dead&&e.kind==='mushroom')||g.zones.find(e=>e.duration>0);
   if(zone){b.pos=new w.Vec2(zone.pos.x+1,zone.pos.y);b.vel=new w.Vec2(0,0);g.rebuildSpatialGrid();}
   if(['emoji-031','emoji-128'].includes(id))engine.applyCommand(w,{type:'INPUT',playerId:'a',lifeSeq:0,seq:t,clientTick:t,move:{x:.2,y:0},aim:{x:1,y:0}});
   engine.stepWorld(w);
  }
  return {hits,farms,actor:{x:a.pos.x,y:a.pos.y,cooldown:a.cooldown,hp:a.hp,uses:a.skillUsesLeft,level:a.run.level},targets:{x:b.pos.x,y:b.pos.y,stunned:b.stunned,slow:b.rw?.slow}};
 }finally{engine.destroyWorld(w);}
}
for(const id of ['emoji-000','emoji-007','emoji-010','emoji-014','emoji-122','emoji-144','emoji-031','emoji-128','emoji-025','emoji-042','emoji-034','emoji-019','emoji-003','emoji-131'])for(const boost of [false,true]){
 const before=scenario(baseline,id,{boost}),after=scenario(candidate,id,{boost}),eligible=!['emoji-025','emoji-042','emoji-034','emoji-019','emoji-003','emoji-131'].includes(id);assert.equal(after.hits.length,before.hits.length,id+' hit count');let ticks=0;
 for(let i=0;i<before.hits.length;i++){const a=after.hits[i],b=before.hits[i],mult=eligible&&b.periodic?1.1:1;if(mult>1)ticks++;assert.equal(a.tick,b.tick,id+' tick');assert.equal(a.periodic,b.periodic);assert.ok(Math.abs(a.amount-b.amount*mult)<1e-7,id+' damage input '+JSON.stringify([a,b]));assert.equal(a.stun,b.stun);}
 if(eligible)assert.ok(ticks>0,id+' residual ground actually hit');
 assert.deepEqual(after.actor,before.actor,id+' caster physics/cooldown');assert.deepEqual(after.targets,before.targets,id+' target control');assert.equal(after.farms.length,before.farms.length,id+' farm count');for(let i=0;i<before.farms.length;i++)for(const key of ['tick','radius','amount'])assert.ok(Math.abs(after.farms[i][key]-before.farms[i][key])<1e-9,id+' farm '+key);
 rows.push({id,boost,hits:after.hits.length,groundTicks:ticks,inputFirst:after.hits[0]?.amount,status:'PASS'});
}
fs.mkdirSync('artifacts/v35-4',{recursive:true});fs.writeFileSync('artifacts/v35-4/authority-compare.json',JSON.stringify({status:'PASS',ms:performance.now()-started,rows},null,2));console.log(JSON.stringify({status:'PASS',cases:rows.length,ms:performance.now()-started}));
