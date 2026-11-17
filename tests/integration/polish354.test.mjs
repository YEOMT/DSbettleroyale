import test from 'node:test';import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';import {connect} from './client.mjs';import {stepWorld} from '../../packages/engine/src/index.js';
import {eventBatchMessages} from '../../packages/protocol/src/server-events.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('N01/N04/N05/N06/N07: twenty connected, 6→5→3→2→1, no new eliminated combat or replay bytes; restricted resume and results',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const host=await(await connect(app)).host(),clients=[];for(let i=0;i<20;i++)clients.push(await(await connect(app)).join(host.room.code,'Synthetic '+i));
 const room=app.manager.rooms.get(host.room.code);await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await clients[0].next('SNAPSHOT');
 const meters=new Map();for(const c of [host,...clients]){const m={combat:0,control:0,snapshots:0};meters.set(c,m);c.onMessage=e=>{const bytes=Buffer.byteLength(JSON.stringify(e));if(['SNAPSHOT','PRIVATE_STATE','PROFILE_STATE','EVENT','LEADERBOARD'].includes(e.type)){m.combat+=bytes;if(e.type==='SNAPSHOT')m.snapshots++;}else m.control+=bytes;};}
 const w=room.world,g=w.game;g.finalPhaseTriggered=true;for(const p of g.participants){p.hp=p.maxHp=99999;p.spawnProtectionUntilFrame=0;}
 let prior=20;for(const count of [6,5,3,2]){
  app.simulation.suspend();for(let i=count;i<prior;i++){const p=g.participants[i];p.takeDamage(999999,g.participants[0]);}stepWorld(w);app.simulation.resume();await delay(150);const a=clients[count],m=meters.get(a),before={...m},member=room.members.get(a.session.playerId),cursor=member.cursor;assert.equal(member.combatStopped,true);
  a.send('PING',{clientTime:performance.now()},false);await a.next('PONG');await delay(150);assert.equal(m.combat,before.combat,'no new dead combat '+count);assert.ok(m.control>before.control);assert.equal(member.cursor,cursor,'no combat ledger increment');assert.ok(meters.get(host).snapshots>0);assert.ok(meters.get(clients[0]).snapshots>0);assert.equal(room.students().filter(p=>p.connected).length,20);prior=count;
 }
 const dead=clients[5],member=room.members.get(dead.session.playerId),resume=await connect(app);resume.send('RESUME',{token:dead.session.token,cursor:0},false);await resume.next('SESSION');const full=(await resume.next('FULL_STATE')).payload;assert.equal(full.room.self.participation.state,'eliminated');assert.equal(full.self,null);assert.equal(full.static,null);assert.equal(full.snapshot,null);assert.ok(!resume.messages.some(m=>m.type==='PROFILE_STATE'));resume.lifeSeq=member.lifeSeq||0;
 for(let i=0;i<10;i++)assert.equal((await resume.command('ACTION',{kind:'attack',seq:i+1,aim:{x:1,y:0}})).reason,'PLAYER_ELIMINATED');assert.equal(resume.ws.readyState,1);
 app.simulation.suspend();g.participants[1].takeDamage(999999,g.participants[0]);stepWorld(w);app.simulation.resume();await host.phase('RESULTS');await resume.phase('RESULTS');assert.ok(host.room.resultPresentation);assert.equal(resume.room.result.players.length,20);assert.equal(resume.room.result.players[0].id,clients[0].session.playerId);
 assert.equal((await host.command('REMATCH')).reason,'RESULT_PRESENTATION_ACTIVE');await delay(3550);assert.equal((await host.command('REMATCH')).accepted,true);await resume.phase('LOBBY');assert.equal(room.students().filter(p=>p.connected).length,20);assert.equal(room.world,null);assert.equal(member.combatStopped,false);assert.equal(member.events.length,0);
});
