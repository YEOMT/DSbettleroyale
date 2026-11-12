// Client/server payloads remain unchanged. Isolate the cost of projecting acquired cards.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const [reference,out='artifacts/v35-1/server-growth.json']=process.argv.slice(2);
const order=['A','B','B','A','B','A'];
const users=Array.from({length:30},(_,i)=>({id:'s'+i,name:'테스트'+i+'🙂',team:i%4+1,abilityId:['emoji-003','emoji-034','emoji-141'][i%3]}));
const growth={},growthRows=[];
for(const [k,dir] of [['A',reference],['B','.']]){
 const api=await import(pathToFileURL(path.resolve(dir,'packages/engine/src/index.js')));
 const world=api.createWorld(undefined,{mode:'solo'},'growth',users);
 for(const p of world.game.participants){
  world.brProgression.awardXP(p,20,0);
  while(p.run.offer)api.applyCommand(world,{type:'AUGMENT_CHOOSE',playerId:p.remoteId,lifeSeq:p.lifeSeq,offerId:p.run.offer.id,augmentId:p.run.offer.cards[0].id});
 }
 const prior=world.brRunCard;let calls=0;world.brRunCard=(...args)=>{calls++;return prior(...args);};
 growth[k]={run(n){calls=0;const start=performance.now();let chips=0;for(let i=0;i<n;i++)for(const p of world.game.participants)chips+=world.brRunSnapshot(p).chips.length;
  return {k,n,chips,builds:calls,elapsedMs:performance.now()-start};},close(){api.destroyWorld(world);}};
}
try{
 growth.A.run(40);growth.B.run(40);
 for(const k of order)growthRows.push(growth[k].run(200));
 assert.ok(growthRows.every(r=>r.chips===growthRows[0].chips));
}finally{growth.A.close();growth.B.close();}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify({node:process.version,platform:process.platform,players:users.length,order,growthRows},null,2)+'\n');
console.log(JSON.stringify(growthRows));
