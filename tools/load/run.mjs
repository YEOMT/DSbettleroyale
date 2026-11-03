import fs from 'node:fs';
import {loadBrowser} from './browser.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {fork} from 'node:child_process';
import {connect} from '../../tests/integration/client.mjs';
import {manifest} from '../../packages/content/src/manifest.js';
import {Samples} from '../../apps/server/src/diagnostics/metrics.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function runLoad({players=26,seconds=600,rematchSeconds=90,recoverOverload=false,browser=false,out=`artifacts/load-${players}-${seconds}.json`}={}){
 if(!Number.isInteger(players)||players<2||players>30||!Number.isFinite(seconds)||seconds<1)throw Error('INVALID_LOAD_OPTIONS');
 const child=fork(fileURLToPath(new URL('./server.mjs',import.meta.url)),[],{stdio:['ignore','inherit','inherit','ipc'],windowsHide:true,execArgv:[]});
 const port=await new Promise((resolve,reject)=>{child.once('message',m=>resolve(m.port));child.once('error',reject);});let rpcSeq=0;const rpcs=new Map();
 child.on('message',m=>{const p=rpcs.get(m.id);if(p){rpcs.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error)):p.resolve(m.value);}});
 const rpc=(type,args={})=>new Promise((resolve,reject)=>{const id=++rpcSeq,timer=setTimeout(()=>{rpcs.delete(id);reject(Error('IPC_TIMEOUT'));},10000);rpcs.set(id,{resolve,reject,timer});child.send({id,type,...args});});
 const app={address:{port}},host=await(await connect(app)).host(),clients=[];
 const report={scenario:'real loopback WebSocket; teacher + synthetic clients; not physical devices',players,seconds,started:new Date().toISOString(),fingerprint:host.session,fixture:'All roster characters rotate by round. Server fixture grants XP20; clients choose real offers. Respawn answers use fixture oracle. No invulnerability.',samples:[],rtt:new Samples(),ack:new Samples(),snapshots:0,receivedBytes:0,errors:[],expectedStale:0,rounds:0};
 delete report.fingerprint.token;delete report.fingerprint.playerId;
 let observer;let stopping=false,tick=0,roundStarted=performance.now(),roundBusy=false;
 const track=c=>{c.messages=[];c.onMessage=m=>{if(stopping)return;if(m.type==='SNAPSHOT'){report.snapshots++;const sent=c.sentInputs?.get(m.payload.self?.lastAppliedSeq);if(sent){report.ack.add(performance.now()-sent);c.sentInputs.delete(m.payload.self.lastAppliedSeq);}}if(m.type==='PONG')report.rtt.add(performance.now()-m.payload.clientTime);if(m.type==='ERROR'&&['LIFE_MISMATCH','SCOPE_MISMATCH','BATTLE_REQUIRED'].includes(m.payload.code)){report.expectedStale++;return;}if(m.type==='ERROR'||m.type==='OVERLOAD'){if(report.errors.length<100)report.errors.push(m.payload);}c.messages=c.messages.filter(x=>['SESSION','ROOM_STATE','COMMAND_RESULT'].includes(x.type));};};
 track(host);
 try{
  if(browser){observer=await loadBrowser(app,host.room.code,rpc);report.scenario='teacher + 19 synthetic students + one real browser student over loopback WS; not physical devices';}
  for(let i=0;i<players-(browser?1:0);i++){const c=await(await connect(app)).join(host.room.code,'Bot'+String(i+1).padStart(2,'0'));c.seq=0;c.action=0;c.sentInputs=new Map();track(c);clients.push(c);}
  async function begin(){
   if(host.room.phase==='RESULTS'){await host.command('REMATCH');await host.phase('LOBBY');}
   await host.command('CONFIGURE',{mode:'team-capture',teamCount:4,matchSeconds:300,quizText:'Load question | Correct | Wrong one | Wrong two | Wrong three'});
   await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');
   await rpc('fixture-draft',{round:report.rounds,players});for(const c of clients){c.seq=0;c.action=0;c.snapshot=null;c.lifeSeq=0;}
   const result=await host.command('START_BATTLE');if(!result.accepted)throw Error('START_BATTLE '+result.reason);await clients[0].phase('BATTLE');
   await rpc('fixture-growth');
   report.rounds++;roundStarted=performance.now();
  }
  await begin();const started=performance.now(),deadline=started+seconds*1000;let lastSample=started;
  while(performance.now()<deadline){
   const now=performance.now();tick++;
   if(host.room.phase==='RESULTS'){await begin();}
   if(now-roundStarted>rematchSeconds*1000){await host.command('END');await host.phase('RESULTS');await begin();}
   for(const [i,c]of clients.entries()){
    const s=c.snapshot?.self;if(!s||c.ws.readyState!==1)continue;
    c.lifeSeq=s.lifeSeq;
    const angle=tick*.025+i*2.399,move={x:Math.cos(angle),y:Math.sin(angle)},seq=++c.seq;c.sentInputs.set(seq,now);while(c.sentInputs.size>120)c.sentInputs.delete(c.sentInputs.keys().next().value);
    c.send('INPUT_BATCH',{commands:[{seq,clientTick:tick,move,aim:{x:-move.x,y:-move.y}}]});
    const command=(type,p)=>c.command(type,p).catch(e=>{if(!stopping&&report.errors.length<100)report.errors.push(e.message);});
    if(s.alive&&tick%10===i%10)command('ACTION',{kind:'attack',seq:++c.action,aim:{x:-move.x,y:-move.y}});
    if(s.alive&&tick%31===i%31)command('ACTION',{kind:'skill',seq:++c.action,aim:{x:-move.x,y:-move.y}});
    if(tick%15===i%15){
     if(s.run?.offer)command('AUGMENT_CHOOSE',{offerId:s.run.offer.id,augmentId:s.run.offer.cards[0].id});
     if(!s.alive&&s.respawn){const q=s.respawn;if(q.correct>=3)command('RESPAWN',{kind:report.rounds%2?'keep':'reroll'});else if(q.question){const a=q.question.answers.find(a=>a.text==='Correct');if(a)command('RESPAWN',{kind:'answer',questionId:q.question.id,answerId:a.id});}}
    }
    if(tick%60===i%60)c.send('PING',{clientTime:now},false);
   }
   if(now-lastSample>=5000){lastSample=now;const server=await rpc('status');report.samples.push({elapsedMs:now-started,round:report.rounds,server,browser:observer?await observer.sample():undefined,pendingCommands:clients.reduce((n,c)=>n+c.waiters.length,0)});if(server.fault)throw Error(server.fault);if(server.paused){if(recoverOverload){const result=await host.command('CONTINUE');if(!result.accepted)throw Error('CONTINUE_REJECTED');report.overloadRecoveries=(report.overloadRecoveries||0)+1;}else throw Error('SERVER_OVERLOAD_PAUSED');}}
   await delay(1000/30);
  }
  stopping=true;report.elapsedMs=performance.now()-started;report.server=await rpc('status');report.rtt=report.rtt.report();report.ack=report.ack.report();report.receivedBytes=[host,...clients].reduce((n,c)=>n+(c.receivedBytes||0),0);report.browser=observer?await observer.sample():undefined;report.pass=(!observer||!report.browser.errors.length)&&report.errors.length===0&&report.snapshots>players*seconds*10&&report.server.overloads===0;
 }catch(error){report.pass=false;report.failure=error.stack;report.server=await rpc('status');report.hostPhase=host.room?.phase;report.clientPhases=clients.map(c=>({phase:c.room?.phase,open:c.ws.readyState}));}finally{stopping=true;await observer?.close();await host.close();for(const c of clients)await c.close();report.cleanup=await rpc('close');report.ended=new Date().toISOString();fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify({file:out,players,seconds,pass:report.pass,rounds:report.rounds,snapshots:report.snapshots,failure:report.failure,errors:report.errors.slice(0,3),step:report.server?.stepCpu,gap:report.server?.snapshotGap}));return report;
}
if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url)){
 const opts=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));for(const k of ['players','seconds','rematchSeconds'])if(opts[k])opts[k]=Number(opts[k]);const result=await runLoad(opts);process.exitCode=result.pass?0:1;
}



