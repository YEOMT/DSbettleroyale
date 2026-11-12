// Deterministic reception/render replay. Pass an exported source tree to
// measure its unchanged Timeline against the same ordered 20 Hz packet stream.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export function replay(Timeline, delays, fps=60) {
 const timeline=new Timeline(), duration=10000, actorSpeed=4, shotSpeed=12;
 const self={id:'student',x:0,y:0,lifeSeq:1,warpSeq:0,alive:true,lastAppliedSeq:0,lastAppliedClientTick:0};
 const packets=[];
 for(let i=0;i<=duration/50;i++){
  const tick=i*3,peer={...self,id:'peer',x:actorSpeed*tick};
  const shot={id:'flight',kind:'projectile',native:true,owner:'peer',x:shotSpeed*tick,y:0,dx:shotSpeed,dy:0};
  packets.push({at:Math.max(i*50+delays[i%delays.length],(packets.at(-1)?.at??-1)+1),
   state:{serverTick:tick,snapshotSeq:i+1,actors:[self,peer],self,shots:[shot]}});
 }
 const peerError=[],shotError=[],lag=[];let next=0,last,still=0,idleRange=0;
 for(let n=0;n<duration*fps/1000;n++){
  const now=n*1000/fps;
  while(next<packets.length&&packets[next].at<=now){const p=packets[next++];timeline.accept(p.state,p.at);}
  const view=timeline.frame(now);if(!view)continue;
  const peer=view.actors.find(a=>a.id==='peer'),shot=view.shots[0],student=view.actors.find(a=>a.id==='student');
  assert.ok(peer&&student&&shot);idleRange=Math.max(idleRange,Math.abs(student.x));
  if(last&&now>=1000){
   const step=peer.x-last.peer,idealTicks=60/fps;
   if(step<1e-5)still++;
   peerError.push(Math.abs(step-actorSpeed*idealTicks));
   shotError.push(Math.abs(shot.x-last.shot-shotSpeed*idealTicks));
   lag.push(now-view.renderTick*1000/60);
  }
  last={peer:peer.x,shot:shot.x};
 }
 function percentile(a,q){return +a.sort((x,y)=>x-y)[Math.ceil(a.length*q)-1].toFixed(3);}
 const quantiles=a=>[.5,.95,.99].map(p=>percentile(a,p));
 return {frames:peerError.length,fps,delays,peerStepErrorPx:quantiles(peerError),shotStepErrorPx:quantiles(shotError),
  authorityToDisplayMs:quantiles(lag),heldPeerFrames:still,idleRangePx:idleRange};
}

if(import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const moduleFile=path.resolve(process.argv[2]||'.','apps/client/src/presentation/timeline.js');
 const {Timeline}=await import(pathToFileURL(moduleFile));const rows=[];
 for(const delays of [[20],[15,40,5,35],[40,4,38,5,41,10]])for(const fps of [30,60,120])rows.push(replay(Timeline,delays,fps));
 const file=process.argv[3];if(file){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(rows,null,2)+'\n');}
 console.log(JSON.stringify(rows.filter(r=>r.fps===60)));
}
