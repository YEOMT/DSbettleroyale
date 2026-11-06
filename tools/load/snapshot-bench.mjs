// Deterministic snapshot subphase benchmark; no networking or rendering.
import fs from 'node:fs';
import {createWorld,getTeacherState,getVisibleState,stepWorld,destroyWorld,applyCommand} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {Samples} from '../../apps/server/src/diagnostics/metrics.js';
const label=process.argv[2]||'before',results=[];
const present=label==='before'?(_,teacher)=>teacher:(await import('../../apps/server/src/ws/presentation-state.js')).presentationState;
for(const [players,alive,mode]of [[30,30,'team-capture'],[30,6,'solo'],[30,5,'solo'],[30,3,'solo'],[5,5,'solo']]){
 const w=createWorld(undefined,{mode,teamCount:4},'snapshot-stability',Array.from({length:players},(_,i)=>({id:'synthetic-'+i,name:'Synthetic '+i,abilityId:manifest.roster[i%77].id,team:mode==='solo'?0:i%4+1})));
 for(const [i,p]of w.game.participants.entries()){
  w.brProgression.awardXP(p,20,0);while(p.run.offer)applyCommand(w,{type:'AUGMENT_CHOOSE',playerId:p.remoteId,lifeSeq:p.lifeSeq,offerId:p.run.offer.id,augmentId:p.run.offer.cards[0].id});
  p.alive=i<alive;if(!p.alive){p.hp=0;p.deathFrame=0;}
 }
 stepWorld(w);w.game.frame=120;const teacherMs=new Samples(),prepareMs=new Samples(),viewMs=new Samples(),encodeMs=new Samples();let bytes=0;
 for(let n=0;n<1200;n++){
  let at=performance.now();const teacher=present(w,getTeacherState(w));teacherMs.add(performance.now()-at);at=performance.now();const encode=snapshotEncoder(teacher,n,0);prepareMs.add(performance.now()-at);
  for(const p of w.game.participants){at=performance.now();const view=getVisibleState(w,p.remoteId,undefined,teacher);viewMs.add(performance.now()-at);at=performance.now();const encoded=encode(view,{roomInstanceId:'synthetic',matchId:'synthetic',connectionEpoch:1}),s=Buffer.isBuffer(encoded)?encoded:Buffer.from(encoded);encodeMs.add(performance.now()-at);if(n===1199)bytes+=s.length;}
 }
 results.push({players,alive,mode,teacherMs:teacherMs.report(),prepareMs:prepareMs.report(),viewPerStudentMs:viewMs.report(),encodePerStudentMs:encodeMs.report(),studentBytesPerSnapshot:bytes});destroyWorld(w);
}
fs.mkdirSync('artifacts/tablet-stability',{recursive:true});fs.writeFileSync('artifacts/tablet-stability/'+label+'-snapshot.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
