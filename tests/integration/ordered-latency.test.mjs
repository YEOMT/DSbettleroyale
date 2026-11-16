import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import fs from 'node:fs';
import {createGameServer} from '../../apps/server/src/main.js';
import {envelope} from '../../packages/protocol/src/index.js';
import {connect,TestClient} from './client.mjs';

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

// Test-only loopback TCP delay. Forward every byte, in order, in both directions;
// do not invent WebSocket packet loss/reordering or change production rate limits.
async function delayedTcp(port,delays){
 const sockets=new Set(),timers=new Set();let queuedBytes=0,peakBytes=0,forwarded=0;
 const server=net.createServer(down=>{
  const up=net.connect({host:'127.0.0.1',port});
  for(const s of [down,up]){sockets.add(s);s.on('error',()=>{});s.on('close',()=>sockets.delete(s));}
  function direction(from,to){
   let due=0,index=0;
   function later(fn,bytes=0){
    due=Math.max(performance.now()+delays[index++%delays.length],due+.01);
    queuedBytes+=bytes;peakBytes=Math.max(peakBytes,queuedBytes);
    const timer=setTimeout(()=>{timers.delete(timer);queuedBytes-=bytes;fn();},Math.max(0,due-performance.now()));timers.add(timer);
   }
   from.on('data',data=>later(()=>{if(!to.destroyed){to.write(data);forwarded+=data.length;}},data.length));
   from.on('end',()=>later(()=>{if(!to.destroyed)to.end();}));
  }
  direction(down,up);direction(up,down);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return {url:`ws://127.0.0.1:${server.address().port}/ws`,stats:()=>({peakQueuedBytes:peakBytes,forwardedBytes:forwarded,pendingChunks:timers.size}),
  async close(){for(const timer of timers)clearTimeout(timer);timers.clear();for(const s of sockets)s.destroy();await new Promise(resolve=>server.close(resolve));}};
}

test('ordered 80/150ms duplex latency and jitter retain move/action/epoch recovery', {timeout:30000},async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'}),proxies=[],clients=[],rows=[];
 t.after(async()=>{for(const proxy of proxies)await proxy.close();await app.close();});
 const host=await(await connect(app)).host(),watcher=await(await connect(app)).join(host.room.code,'Synthetic observer');
 const profiles=[{name:'rtt-80',delays:[40]},{name:'rtt-150',delays:[75]},{name:'ordered-jitter',delays:[40,75,45,60]}];
 for(const profile of profiles){
  const proxy=await delayedTcp(app.address.port,profile.delays);proxies.push(proxy);
  clients.push(await(await new TestClient(proxy.url).open()).join(host.room.code,'Synthetic '+profile.name));
 }
 const room=app.manager.rooms.get(host.room.code);
 await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');
 for(const member of room.students())member.draft.abilityId='emoji-003';
 await host.command('START_BATTLE');
 const w=room.world;
 // Geometry-only isolation of the connection paths: no damage/cooldown/stat edits.
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];
 room.students().forEach((m,i)=>{const p=w.byId.get(m.id);p.pos=new w.Vec2(i?(i-2)*600:0,i?500:0);p.vel=new w.Vec2(0,0);});w.game.rebuildSpatialGrid();
 await Promise.all(clients.map(async(c,index)=>{
  await c.next('SNAPSHOT');const rtt=[];
  for(let n=0;n<4;n++){
   const sent=performance.now();c.send('PING',{clientTime:sent},false);
   await c.next('PONG',p=>p.clientTime===sent);rtt.push(performance.now()-sent);
  }
  const samples=[],input=(seq,x)=>c.send('INPUT_BATCH',{commands:[{seq,clientTick:seq,move:{x,y:0},aim:{x:0,y:-1}}]});
  for(const [seq,x]of [[1,1],[2,0],[3,-1],[4,0]]){
   const before=w.byId.get(c.session.playerId).pos.x;input(seq,x);
   const snap=(await c.next('SNAPSHOT',s=>s.self.lastAppliedSeq===seq)).payload;
   if(x)assert.ok((snap.self.x-before)*x>0,'authority follows the fresh direction');
   samples.push({seq,axis:x,applied:snap.self.lastAppliedSeq});
  }
  await c.next('SNAPSHOT',s=>s.self.lastAppliedSeq===4&&Math.hypot(s.self.vx,s.self.vy)<.001);
  const actor=w.byId.get(c.session.playerId),stopped=actor.pos.x;await wait(170);assert.ok(Math.abs(actor.pos.x-stopped)<.01,'stop remains stopped after the existing velocity settles');
  const action={kind:'attack',seq:1,aim:{x:0,y:-1},aimPower:1};
  const accepted=await c.command('ACTION',action,'once');assert.equal(accepted.accepted,true);
  assert.equal((await c.command('ACTION',action,'once')).accepted,true,'idempotent reply');
  assert.equal((await c.command('ACTION',{...action,kind:'skill'},'skill-once')).accepted,true);
  await c.next('SNAPSHOT',s=>s.self.actions.firedAttack===1&&s.self.actions.firedSkill===1);
  await watcher.next('EVENT',e=>e.type==='SHOT_SPAWN'&&e.data.owner===actor.remoteId&&e.data.actionKind==='attack'&&e.data.actionSeq===1);
  assert.equal(actor.firedAttackSeq,1,'duplicate does not execute twice');
  const priorScope={...c.scope},token=c.session.token,id=c.session.playerId;
  await c.close();c=await new TestClient(proxies[index].url).open();clients[index]=c;
  c.send('RESUME',{token,cursor:0},false);const full=(await c.next('FULL_STATE')).payload;
  assert.equal(full.self.id,id);assert.ok(c.scope.connectionEpoch>priorScope.connectionEpoch);c.lifeSeq=full.self.lifeSeq;
  c.ws.send(JSON.stringify(envelope('ACTION',{...action,seq:2},{...priorScope,lifeSeq:c.lifeSeq,requestId:'old-epoch'})));
  assert.equal((await c.next('COMMAND_RESULT',p=>p.requestId==='old-epoch')).payload.reason,'SCOPE_MISMATCH');
  const floor=full.self.inputFloor;
  c.send('INPUT_BATCH',{commands:[{seq:floor.move+1,clientTick:floor.tick+1,move:{x:1,y:0},aim:{x:0,y:-1}}]});
  await c.next('SNAPSHOT',s=>s.self.lastAppliedSeq===floor.move+1&&s.self.x>full.self.x+1);
  assert.equal(actor.firedAttackSeq,1,'old connection action did not execute');
  assert.ok(Math.min(...rtt)>=2*Math.min(...profiles[index].delays)-5,'latency was actually injected');
  assert.ok(proxies[index].stats().peakQueuedBytes<1048576,'test relay is bounded during the sample');
  rows[index]={profile:profiles[index],rttMs:rtt,input:samples,attackExecutions:1,skillExecutions:1,duplicatesSuppressed:1,oldEpochRejected:true,resumedMove:true,transport:proxies[index].stats()};
 }));
 assert.equal(app.metrics.overloads,0);
 await host.command('END');await Promise.all(clients.map(c=>c.phase('RESULTS')));
 await host.command('REMATCH');await Promise.all(clients.map(c=>c.phase('LOBBY')));
 assert.equal(room.world,null);assert.equal(room.students().filter(m=>m.connected).length,4);
 fs.mkdirSync('artifacts/v35-2',{recursive:true});fs.writeFileSync('artifacts/v35-2/ordered-latency.json',JSON.stringify({status:'PASS',scope:'real WS over an ordered loopback TCP delay relay; no physical Wi-Fi',samples:rows},null,2));
 t.diagnostic(JSON.stringify(rows));
});
