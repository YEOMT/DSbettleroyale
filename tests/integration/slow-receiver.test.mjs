import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('real blocked TCP reader stays bounded; another student moves and the slow student resumes actions', {timeout:20000},async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());
 const host=await(await connect(app)).host(),room=app.manager.rooms.get(host.room.code),fast=await(await connect(app)).join(room.code,'Fast Synthetic');
 let slow=await(await connect(app)).join(room.code,'Slow Synthetic');
 await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');for(const m of room.students())m.draft.abilityId='emoji-003';await host.command('START_BATTLE');
 await slow.next('SNAPSHOT');await fast.next('SNAPSHOT');const firstTick=fast.snapshot.serverTick,token=slow.session.token,identity=slow.session.playerId,epoch=slow.scope.connectionEpoch,peer=room.members.get(identity).peer;
 // Test-only: pause the actual receiving TCP stream. Production limits remain
 // 64KiB warn / 256KiB hard / 1s timeout; no fake bufferedAmount override.
 slow.ws._socket.pause();const payload={synthetic:'한글🙂'.repeat(4096)},started=performance.now();let writes=0;
 const drive=setInterval(()=>{if(fast.ws.readyState===1)fast.send('INPUT_BATCH',{commands:[{seq:++writes,clientTick:writes,move:{x:1,y:0},aim:{x:1,y:0}}]});},30);
 try{
  while(peer.socket.readyState===1&&performance.now()-started<8000){peer.beginBatch();for(let i=0;i<8&&peer.socket.readyState===1;i++)peer.send('PROBE',payload);peer.endBatch();await delay(10);}
  assert.ok(app.metrics.bufferHighWatermark>=app.config.bufferWarn,'actual TCP backpressure reached');assert.ok(peer.socket.readyState>=2,'slow receiver closed without waiting on other peers');assert.equal(peer.queue.length,0);assert.equal(peer.pendingSnapshot,null);
  const healthy=await fast.next('SNAPSHOT',s=>s.serverTick>firstTick+30&&s.self.lastAppliedSeq>0);assert.ok(healthy.payload.self.alive);assert.equal(!!room.safePaused,false);assert.equal(app.metrics.overloads,0);
 }finally{clearInterval(drive);slow.ws.terminate();}
 slow=await connect(app);slow.send('RESUME',{token,cursor:0},false);const full=(await slow.next('FULL_STATE')).payload;
 assert.equal(full.self.id,identity);assert.ok(slow.scope.connectionEpoch>epoch);const floor=full.self.inputFloor;
 slow.send('INPUT_BATCH',{commands:[{seq:floor.move+1,clientTick:floor.tick+1,move:{x:-1,y:0},aim:{x:1,y:0}}]});
 assert.equal((await slow.command('ACTION',{kind:'attack',seq:floor.attack+1,aim:{x:1,y:0}})).accepted,true);
 assert.equal((await slow.command('ACTION',{kind:'skill',seq:floor.skill+1,aim:{x:1,y:0}})).accepted,true);
 const recovered=(await slow.next('SNAPSHOT',s=>s.self.lastAppliedSeq>=floor.move+1&&s.self.actions.firedAttack>=floor.attack+1&&s.self.actions.firedSkill>=floor.skill+1)).payload;
 assert.equal(recovered.self.id,identity);assert.equal(room.students().length,2);assert.ok(peer.member.eventBytes<=1048576);await slow.close();await fast.close();await host.close();
});
