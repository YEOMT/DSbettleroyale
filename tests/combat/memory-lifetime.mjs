// Synthetic reference diagnostic only: forced GC is excluded from timed A/B loads.
import fs from 'node:fs';
import path from 'node:path';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {connect} from '../integration/client.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const out=process.argv[2]||'artifacts/v35-2/memory-lifetime.json';
const child=fork(fileURLToPath(new URL('../../tools/load/server.mjs',import.meta.url)),[],{windowsHide:true,execArgv:['--expose-gc'],env:{...process.env,LOAD_MEMORY_DIAGNOSTIC:'1'},stdio:['ignore','inherit','inherit','ipc']});
const port=await new Promise((resolve,reject)=>{child.once('message',m=>resolve(m.port));child.once('error',reject);});
let seq=0;const pending=new Map();child.on('message',m=>{const row=pending.get(m.id);if(row){pending.delete(m.id);clearTimeout(row.timer);m.error?row.reject(Error(m.error)):row.resolve(m.value);}});
const rpc=(type,args={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>reject(Error('IPC_TIMEOUT '+type)),10000);pending.set(id,{resolve,reject,timer});child.send({id,type,...args});});
const startedAt=performance.now(),clients=[],app={address:{port}},report={scope:'synthetic retained-reference diagnostic; server process isolated; forced GC outside timed comparisons',node:process.version,samples:[],rounds:5};
let host;
function bounded(c){c.onMessage=()=>{c.messages=c.messages.filter(x=>['SESSION','ROOM_STATE','COMMAND_RESULT'].includes(x.type));};return c;}
const sample=async phase=>report.samples.push({phase,...await rpc('fixture-memory-collect')});
try{
 host=bounded(await(await connect(app)).host());
 for(let i=0;i<20;i++)clients.push(bounded(await(await connect(app)).join(host.room.code,'Synthetic '+i)));
 const roomId=host.room.id;await sample('lobby-initial');
 for(let round=1;round<=5;round++){
  await host.command('CONFIGURE',{mode:'team-capture',teamCount:4});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');
  await rpc('fixture-draft',{round,players:20,roster:'original'});
  await host.command('START_BATTLE');await clients[0].phase('BATTLE');
  for(const c of clients){const snap=(await c.next('SNAPSHOT')).payload;c.lifeSeq=snap.self.lifeSeq;c.send('INPUT_BATCH',{commands:[{seq:1,clientTick:1,move:{x:1,y:0},aim:{x:1,y:0}}]});}
  await Promise.all(clients.flatMap(c=>['attack','skill'].map(kind=>c.command('ACTION',{kind,seq:1,aim:{x:1,y:0}}))));
  await delay(2000);await sample('battle-'+round);
  assert.equal((await host.command('END')).accepted,true);await Promise.all(clients.map(c=>c.phase('RESULTS')));await sample('results-'+round);
  assert.equal((await host.command('REMATCH')).accepted,true);await Promise.all(clients.map(c=>c.phase('LOBBY')));assert.equal(host.room.id,roomId);
  await sample('lobby-'+round);const s=report.samples.at(-1);assert.equal(s.liveWorlds,0);assert.equal(s.liveGames,0);assert.equal(s.liveActors,0);assert.equal(s.ownership.profileStates,0);assert.equal(s.ownership.inputPending,0);assert.equal(s.ownership.actionPending,0);
 }
 await host.command('CLOSE_ROOM');await delay(100);await sample('room-closed');assert.equal(report.samples.at(-1).ownership.rooms,0);assert.equal(report.samples.at(-1).ownership.tokens,0);
 // Control: reconstruct a different room, then close it without changing server process.
 host=bounded(await(await connect(app)).host());await sample('recreated-room');await host.command('CLOSE_ROOM');await delay(100);await sample('recreated-room-closed');
 await delay(2000);await sample('idle-after-close');report.pass=true;
}catch(e){report.pass=false;report.failure=e.stack;process.exitCode=1;}
finally{await Promise.all([host,...clients].filter(Boolean).map(c=>c.close()));report.cleanup=await rpc('close');report.elapsedMs=performance.now()-startedAt;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,pass:report.pass,failure:report.failure,samples:report.samples.map(s=>({phase:s.phase,heapUsed:s.memory.heapUsed,rss:s.memory.rss,worlds:s.liveWorlds,actors:s.liveActors}))}));
