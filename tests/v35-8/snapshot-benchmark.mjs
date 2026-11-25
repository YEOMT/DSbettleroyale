// One comparison, fixed production baseline; no server/network/browser load.
// This measures serialization of prepared live-engine views, not live gameplay.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {snapshotEncoder as candidate} from '../../apps/server/src/ws/snapshot.js';
import {createWorld,destroyWorld,getTeacherState,getVisibleState,getHostVisibleState} from '../../packages/engine/src/index.js';
import {focus357,prepare357,finish357} from '../v35-7/scenario.mjs';
const baseSha='5585c8ca5f262d51e3732fb2115bab6e660fefd5';
const source=execFileSync('git',['show',baseSha+':apps/server/src/ws/snapshot.js'],{encoding:'utf8',windowsHide:true}).replace("'../../../../packages/protocol/src/index.js'",JSON.stringify(pathToFileURL(path.resolve('packages/protocol/src/index.js')).href));
const {snapshotEncoder:baseline}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const report={baseSha,iterations:750,warmups:1,scope:'one sequential synthetic prepared-snapshot encoding pair; no physics, WS or browser cost; no forced GC',rows:[]};
for(const players of [20,30]){
 const world=createWorld(undefined,{mode:'team-capture',teamCount:2},'bench358',Array.from({length:players},(_,i)=>({id:'synthetic-'+i,name:'Synthetic '+i,abilityId:focus357[i%focus357.length],team:i%2+1})));
 try{
  world.game.participants.forEach((p,i)=>{prepare357(world,p,i);p.pos.x=i%5*35;p.pos.y=Math.floor(i/5)*35;});finish357(world);
  const teacher=getTeacherState(world),views=[getHostVisibleState(teacher),...world.game.participants.map(p=>getVisibleState(world,p.remoteId,undefined,teacher))];
  for(const view of views)if(view.self){delete view.self.aimProfiles;delete view.self.visualProfiles;view.self.profileRevision=1;}
  const scope={roomInstanceId:'synthetic-room',matchId:'bench358',connectionEpoch:1};
  for(const v of views)assert.deepEqual(candidate(teacher,1,123)(v,scope),baseline(teacher,1,123)(v,scope));
  const measure=fn=>{let bytes=0;const wall=performance.now(),cpu=process.cpuUsage();for(let n=0;n<report.iterations;n++){const enc=fn(teacher,n,123+n);for(const v of views)bytes+=enc(v,scope).length;}const used=process.cpuUsage(cpu);return {wallMs:performance.now()-wall,cpuMs:(used.user+used.system)/1000,bytes};};
  measure(baseline);measure(candidate);
  const before=measure(baseline),after=measure(candidate);assert.equal(after.bytes,before.bytes);
  const row={players,actorCount:teacher.actors.length,shots:teacher.shots.length,boxes:teacher.farm.b.length,views:views.length,before,after};report.rows.push(row);console.log(JSON.stringify(row));
 }finally{destroyWorld(world);}
}
fs.mkdirSync('artifacts/v35-8',{recursive:true});fs.writeFileSync('artifacts/v35-8/snapshot-benchmark.json',JSON.stringify(report,null,2));
