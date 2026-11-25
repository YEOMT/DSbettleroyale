import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {Timeline as Candidate} from '../../apps/client/src/presentation/timeline.js';
// Run once from the repository root: node --expose-gc tools/performance/timeline358.mjs
// Fixed synthetic microbenchmark, not browser FPS or live network evidence.
const sourcePath='apps/client/src/presentation/timeline.js',baseSha='5585c8ca5f262d51e3732fb2115bab6e660fefd5';
const source=execFileSync('git',['show',baseSha+':'+sourcePath],{encoding:'utf8'}).replace(/from '([^']+)'/g,(_,p)=>`from '${pathToFileURL(path.resolve(path.dirname(sourcePath),p)).href}'`);
const {Timeline:Baseline}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function exercise(T,count,check=false){
 const t=new T();let checksum=0,views=check?[]:null;
 const start=performance.now();
 for(let f=0;f<count;f++){
  const now=f*1000/60;
  if(f%3===0){
   const tick=f+100,seq=f/3+1;
   const actors=Array.from({length:30},(_,i)=>({id:'p'+i,x:tick*3+i*10,y:i*15,lifeSeq:1,warpSeq:0,alive:true}));
   const shots=Array.from({length:200},(_,i)=>({id:'q'+i,owner:'p'+i%30,life:1,kind:'projectile',native:true,x:tick*5,y:i*8,dx:5,dy:0,start:0,rangeRemaining:10000,actionKind:'attack',actionSeq:i,ordinal:0}));
   t.accept({snapshotSeq:seq,serverTick:tick,actors,shots},now);
   // Synthetic concentrated workload, below existing effect/spawn caps.
   t.effects=[];
   for(let i=0;i<100;i++)t.event({type:'FX',serverTick:tick-5,eventId:'fx'+i,data:{kind:'swing',sourceId:'p'+i%30,targetId:'p'+(i+1)%30,geometry:{lifeSeq:1,targetLife:1,displayMs:200}}},now);
   for(let i=0;i<30;i++)t.event({type:'SHOT_SPAWN',serverTick:tick,eventId:'q'+i,data:shots[i]},now);
  }
  const view=t.frame(now);checksum+=view.actors[4].x+view.shots.length+view.effects.length;
  if(check)views.push(view);
 }
 return {ms:performance.now()-start,checksum,views,indexes:t.sampleIndexes?.length??null,samples:t.samples.length};
}
const a=exercise(Baseline,300,true),b=exercise(Candidate,300,true);assert.deepEqual(b.views,a.views);assert.equal(b.checksum,a.checksum);
exercise(Baseline,1200);exercise(Candidate,1200);
const trials=[];
for(let i=0;i<4;i++)for(const [label,T]of i%2?[['candidate',Candidate],['baseline',Baseline]]:[['baseline',Baseline],['candidate',Candidate]]){
 global.gc?.();const before=process.memoryUsage().heapUsed;const r=exercise(T,6000);global.gc?.();
 trials.push({trial:i,label,ms:r.ms,msPerFrame:r.ms/6000,checksum:r.checksum,retainedHeapDelta:process.memoryUsage().heapUsed-before,indexes:r.indexes,samples:r.samples});
}
const report={baseSha,fixture:'30 actors / 200 straight shots / 100 FX / 30 spawn entries; 20Hz snapshots / 60Hz frames; 6000 synthetic frames; output parity across initial300frames',environment:{node:process.version,platform:process.platform},trials};
fs.mkdirSync('artifacts/v35-8',{recursive:true});
fs.writeFileSync('artifacts/v35-8/timeline-bench.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
