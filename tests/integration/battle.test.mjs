import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';
for(const mode of ['solo','team-elim','team-capture'])test(`real WebSocket ${mode}: server battle, host disconnect, results and rematch`,async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());
 let host=await(await connect(app)).host();const a=await(await connect(app)).join(host.room.code,'A'),b=await(await connect(app)).join(host.room.code,'B');
 await host.command('CONFIGURE',{mode});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await a.phase('DRAFT');await b.phase('DRAFT');
 assert.equal((await host.command('START_BATTLE')).accepted,true);await a.phase('BATTLE');const first=(await a.next('SNAPSHOT')).payload;assert.ok(first.self?.alive);assert.equal(first.actors.some(p=>'run'in p),false);
 const token=host.session.token;await host.close();const later=(await a.next('SNAPSHOT',s=>s.serverTick>first.serverTick+6)).payload;assert.ok(later.serverTick>first.serverTick);
 a.send('INPUT_BATCH',{commands:[{seq:1,clientTick:1,move:{x:1,y:0},aim:{x:1,y:0}}]});const ack=(await a.next('SNAPSHOT',s=>s.self.lastAppliedSeq===1)).payload;assert.ok(ack.self.inputAppliedAt>0);
 host=await connect(app);host.send('RESUME',{token,cursor:0},false);await host.next('SESSION');await host.next('FULL_STATE');
 assert.equal((await host.command('END')).accepted,true);await a.phase('RESULTS');assert.equal(a.room.result.players.length,2);
 const oldMatch=a.scope.matchId;assert.equal((await host.command('REMATCH')).accepted,true);await a.phase('LOBBY');assert.notEqual(a.scope.matchId,oldMatch);assert.equal(a.room.self.draft,null);
});
test('same-room five rematches keep identities and clear old combat; drain protects started quiz',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const host=await(await connect(app)).host(),a=await(await connect(app)).join(host.room.code,'A'),b=await(await connect(app)).join(host.room.code,'B');
 const matches=new Set();for(let round=0;round<5;round++){
  assert.equal((await host.command('START_QUIZ')).accepted,true);app.manager.draining=true;assert.equal(app.manager.protectedRooms(),1);
  assert.equal((await host.command('BEGIN_DRAFT')).accepted,true);assert.equal((await host.command('START_BATTLE')).accepted,true);await a.phase('BATTLE');matches.add(a.scope.matchId);
  assert.equal((await host.command('END')).accepted,true);assert.equal((await host.command('REMATCH')).accepted,true);await a.phase('LOBBY');
  assert.equal((await host.command('START_QUIZ')).reason,'SERVER_DRAINING');app.manager.draining=false;
 }
 assert.equal(matches.size,5);assert.equal(app.manager.rooms.get(host.room.code).students().length,2);assert.equal(app.manager.rooms.get(host.room.code).world,null);
});
