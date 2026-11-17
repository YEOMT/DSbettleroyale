// Bounded transport/CPU comparison, no browser rendering or classroom certification.
import fs from 'node:fs';import assert from 'node:assert/strict';import {fork} from 'node:child_process';import {connect} from '../integration/client.mjs';
const label=process.argv[2]||'candidate',baseline=label==='baseline',players=Number(process.argv[3]||20),rounds=Number(process.argv[4]||1),start=performance.now(),rows=[];
const child=fork('tools/load/server.mjs',[],{windowsHide:true});const port=await new Promise((res,rej)=>{child.once('message',m=>res(m.port));child.once('error',rej);});let request=0;const pending=new Map();child.on('message',m=>{const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error)):p.resolve(m.value);}});const rpc=(type,args={})=>new Promise((resolve,reject)=>{const id=++request,timer=setTimeout(()=>reject(Error('IPC_TIMEOUT '+type)),10000);pending.set(id,{resolve,reject,timer});child.send({type,id,...args});});
const app={address:{port}},host=await(await connect(app)).host(),clients=[],delay=ms=>new Promise(r=>setTimeout(r,ms));let timer,status='FAIL',error;
try{
 for(let i=0;i<players;i++)clients.push(await(await connect(app)).join(host.room.code,'Synthetic '+i));
 let seqs=new Map();timer=setInterval(()=>{for(const c of clients){if(c.room?.phase!=='BATTLE'||!c.snapshot?.self?.alive)continue;const seq=(seqs.get(c)||0)+1;seqs.set(c,seq);c.send('INPUT_BATCH',{commands:[{seq,clientTick:seq*6,move:{x:seq%20<10?.2:-.2,y:0},aim:{x:1,y:0}}]});if(seq%10===1)for(const kind of ['attack','skill'])c.command('ACTION',{seq,kind,aim:{x:1,y:0},aimPower:1}).catch(()=>{});c.messages=c.messages.filter(m=>!['SNAPSHOT','EVENT','EVENT_BATCH','PRIVATE_STATE'].includes(m.type));}},100);
 for(let round=0;round<rounds;round++){
  const rule=baseline?'normal':players===30?'s-only':['normal','f-only','s-only','s-only','normal'][round];await host.command('CONFIGURE',{graphicsPreset:'balanced',...(baseline?{}:{drawRule:rule})});await rpc('classroom-benchmark',{round:round+1});await host.phase('LOBBY');await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await rpc('polish-prepare',{sOnly:players===30});await host.command('START_BATTLE');await rpc('polish-place');seqs.clear();await rpc('classroom-run');await delay(400);
  const row={round:round+1,rule,stages:[]};rows.push(row);
  for(const alive of players===20&&round===0?[20,6,5,3,2]:[players]){
   if(alive<players)await rpc('polish-population',{alive});await delay(200);const a=await rpc('polish-state');await rpc('status');await delay(players===30?10000:1800);const b=await rpc('polish-state'),server=await rpc('status');assert.equal(b.connected,players);assert.equal(server.paused,false);assert.equal(server.phase,'BATTLE');assert.equal(server.overloads,0);
   const traffic=b.observations.map((v,i)=>({...v,combatBytes:v.combatBytes-a.observations[i].combatBytes,controlBytes:v.controlBytes-a.observations[i].controlBytes,views:v.views-a.observations[i].views,snapshots:v.snapshots-a.observations[i].snapshots,events:v.events-a.observations[i].events}));
   if(!baseline&&alive<players)for(const p of traffic.filter(p=>p.role==='student'&&!p.alive)){assert.equal(p.combatBytes,0);assert.equal(p.views,0);}
   row.stages.push({alive,server:server.window,traffic});
  }
  assert.ok((await rpc('polish-state')).actions[0].attack>0);await host.command('END');await host.phase('RESULTS');await host.command('REMATCH');await host.phase('LOBBY');row.clean=await rpc('polish-state');assert.equal(row.clean.connected,players);assert.equal(row.clean.disposed.actors,0);assert.equal(row.clean.disposed.entities,0);
 }
 status='PASS';
}catch(e){error=e.stack;rows.push({status:'FAIL',error,server:await rpc('status')});throw e;}
finally{clearInterval(timer);for(const c of [host,...clients])await c.close();await rpc('close');const dir='artifacts/v35-4';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/'+label+'-server-'+players+'-r'+rounds+'.json',JSON.stringify({status,label,players,rounds,ms:performance.now()-start,rendering:false,rows,error},null,2));console.log(JSON.stringify({status,ms:performance.now()-start}));}
