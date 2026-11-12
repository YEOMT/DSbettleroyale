import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const source=path.resolve(process.argv[2]||'.'),label=process.argv[3]||'v35';
const {createWorld,stepWorld,destroyWorld,applyCommand}=await import(pathToFileURL(path.join(source,'packages/engine/src/index.js')));
const current=label==='v35',counts=[],matches=[];
const roster=n=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Bench '+i,abilityId:['emoji-114','emoji-034','emoji-070','emoji-003'][i%4]}));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
for(let map=0;map<5;map++)for(const n of [15,20,25,30]){
 const w=createWorld(undefined,{mode:'solo',mapIndex:map},'map-check-'+map+'-'+n,roster(n)),g=w.game;
 try{
  const boxes=g.farmBoxes.filter(b=>b.kind==='xp'),points=[g.escapeMap.portal.a,g.escapeMap.portal.b,...g.escapeMap.pads];
  const nearest=g.participants.map(p=>Math.min(...boxes.filter(b=>!w.combatTraceWalls(p.pos,b.pos,p.radius,g.walls)).map(b=>distance(p.pos,b.pos))));
  assert.equal(g.worldRadius,current?3860:3360);assert.equal(w.BR_RING_RULES.startTick,1200);assert.equal(points.length,6);
  for(const box of boxes){assert.ok(!g.walls.some(wall=>w.combatWallContact(box.pos.x,box.pos.y,box.radius,wall)));assert.ok(points.every(q=>distance(q,box.pos)>box.radius+64));}
  for(const p of g.participants){
   assert.ok(!g.checkWallCollision(p.pos,p.radius));
   assert.ok(Array.from({length:12},(_,i)=>new w.Vec2(p.pos.x+Math.cos(i*Math.PI/6)*150,p.pos.y+Math.sin(i*Math.PI/6)*150)).some(to=>!w.combatTraceWalls(p.pos,to,p.radius,w.brHostBodyWalls(g))));
  }
  const outer=Math.max(...boxes.map(b=>distance(b.pos,g.center)/g.worldRadius));
  if(current){assert.ok(Math.max(...nearest)<650,'spawn farm route '+[map,n,Math.max(...nearest)]);assert.ok(outer>=.75);}
  counts.push({map,n,xp:boxes.length,outer,maxSpawnToXp:Math.round(Math.max(...nearest))});
 }finally{destroyWorld(w);}
}
// Same participants, maps, seeds and input policy for both builds. Idle rooms
// exercise the pressure and additional compression paths; moving rooms fight.
for(let map=0;map<5;map++)for(const active of [false,true]){
 const w=createWorld(undefined,{mode:'solo',mapIndex:map},'duration-'+map,roster(20)),g=w.game;
 let compression=0;
 try{
  for(let tick=1;tick<=40000&&!g.isGameOver;tick++){
   if(active&&tick%12===0){
    for(const p of g.participants){
     if(!p.alive)continue;
     let enemy,closest=Infinity;
     for(const q of g.participants){const d=distance(p.pos,q.pos);if(q!==p&&q.alive&&d<closest){closest=d;enemy=q;}}
     if(!enemy)continue;
     const aim={x:(enemy.pos.x-p.pos.x)/(closest||1),y:(enemy.pos.y-p.pos.y)/(closest||1)};
     const intent={playerId:p.remoteId,lifeSeq:p.lifeSeq,seq:tick,clientTick:tick,aim,aimPower:1};
     applyCommand(w,{...intent,type:'INPUT',move:aim});
     if(tick%36===0)applyCommand(w,{...intent,type:'ACTION',kind:tick%180===0?'skill':'attack'});
    }
   }
   stepWorld(w);if(g.ring.plan.compression)compression++;
  }
  assert.ok(g.isGameOver,'fixture must reach a real authoritative result');
  matches.push({map,active,seconds:g.frame/60,compressionTicks:compression});
 }finally{destroyWorld(w);}
}
const sorted=matches.map(x=>x.seconds).sort((a,b)=>a-b);
const result={label,counts,matches,median:(sorted[4]+sorted[5])/2,p90:sorted[8]};
fs.mkdirSync('artifacts/v35',{recursive:true});fs.writeFileSync('artifacts/v35/map-'+label+'.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({label,median:result.median,p90:result.p90,matches}));
