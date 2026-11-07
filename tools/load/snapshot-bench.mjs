// Deterministic snapshot subphase benchmark; no networking or rendering.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createWorld,getTeacherState,getVisibleState,stepWorld,destroyWorld,applyCommand} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {Samples} from '../../apps/server/src/diagnostics/metrics.js';
const label=process.argv[2]||'before',results=[];
const options=Object.fromEntries(process.argv.slice(3).map(s=>s.replace(/^--/,'').split('=')));
const iterations=Number(options.iterations||1200);
assert.ok(Number.isInteger(iterations)&&iterations>0,'positive iteration count required');
let reference;
if(options.compareRef){
 if(!/^[\w./~-]+$/.test(options.compareRef))throw Error('INVALID_REF');
 const source=execFileSync('git',['show',options.compareRef+':apps/server/src/ws/snapshot.js'],{encoding:'utf8'}).replace("'../../../../packages/protocol/src/index.js'",JSON.stringify(new URL('../../packages/protocol/src/index.js',import.meta.url).href));
 reference=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).snapshotEncoder;
}
const present=label==='before'?(_,teacher)=>teacher:(await import('../../apps/server/src/ws/presentation-state.js')).presentationState;
for(const [players,alive,mode]of (options.lateOnly==='true'?[[30,6,'solo'],[30,5,'solo'],[30,3,'solo']]:[[30,30,'team-capture'],[30,6,'solo'],[30,5,'solo'],[30,3,'solo'],[5,5,'solo']])){
 const roster=options.roster==='new'?['emoji-141','emoji-143','emoji-144','emoji-142','emoji-024','emoji-003']:manifest.roster.map(a=>a.id);
 const w=createWorld(undefined,{mode,teamCount:4},'snapshot-stability',Array.from({length:players},(_,i)=>({id:'synthetic-'+i,name:'Synthetic '+i,abilityId:roster[i%roster.length],team:mode==='solo'?0:i%4+1})));
 for(const [i,p]of w.game.participants.entries()){
  w.brProgression.awardXP(p,20,0);while(p.run.offer)applyCommand(w,{type:'AUGMENT_CHOOSE',playerId:p.remoteId,lifeSeq:p.lifeSeq,offerId:p.run.offer.id,augmentId:p.run.offer.cards[0].id});
  p.alive=i<alive;if(!p.alive){p.hp=0;p.deathFrame=0;}
 }
 stepWorld(w);w.game.frame=120;const teacherMs=new Samples(),prepareMs=new Samples(),viewMs=new Samples(),encodeMs=new Samples(),referenceMs=new Samples();let bytes=0;
 for(let n=0;n<iterations;n++){
  let at=performance.now();const teacher=present(w,getTeacherState(w));teacherMs.add(performance.now()-at);at=performance.now();const encode=snapshotEncoder(teacher,n,0);prepareMs.add(performance.now()-at);
  const baseline=reference?.(teacher,n,0);
  for(const p of w.game.participants){at=performance.now();const view=getVisibleState(w,p.remoteId,undefined,teacher);viewMs.add(performance.now()-at);const scope={roomInstanceId:'synthetic',matchId:'synthetic',connectionEpoch:1};let expected;
   const prior=()=>{const at=performance.now();expected=baseline(view,scope);referenceMs.add(performance.now()-at);};if(baseline&&n%2===0)prior();
   at=performance.now();const encoded=encode(view,scope),s=Buffer.isBuffer(encoded)?encoded:Buffer.from(encoded);encodeMs.add(performance.now()-at);if(n===iterations-1)bytes+=s.length;
   if(baseline&&n%2!==0)prior();if(baseline&&n===0){assert.deepEqual(JSON.parse(s),JSON.parse(expected));assert.equal(s.length,expected.length);}
  }
 }
 results.push({players,alive,mode,iterations,roster:options.roster||'original',compareRef:options.compareRef,teacherMs:teacherMs.report(),prepareMs:prepareMs.report(),viewPerStudentMs:viewMs.report(),encodePerStudentMs:encodeMs.report(),referencePerStudentMs:reference?referenceMs.report():undefined,studentBytesPerSnapshot:bytes});destroyWorld(w);
}
fs.mkdirSync('artifacts/tablet-stability',{recursive:true});fs.writeFileSync('artifacts/tablet-stability/'+label+'-snapshot.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
