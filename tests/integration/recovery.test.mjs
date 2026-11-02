import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('real respawn quiz three answers, keep/reroll, spawn protection and duplicate augment',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const host=await(await connect(app)).host(),a=await(await connect(app)).join(host.room.code,'A'),b=await(await connect(app)).join(host.room.code,'B');
 await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await a.phase('BATTLE');
 const room=app.manager.rooms.get(host.room.code),w=room.world,p=w.byId.get(a.session.playerId);w.brProgression.awardXP(p,20,0);const offer=p.run.offer,payload={offerId:offer.id,augmentId:offer.cards[0].id};
 assert.equal((await a.command('AUGMENT_CHOOSE',payload,'grow-once')).accepted,true);assert.equal((await a.command('AUGMENT_CHOOSE',payload,'grow-once')).accepted,true);assert.equal(p.run.choices,1);
 for(const kind of ['keep','reroll']){
  p.alive=false;p.deathHandled=false;p.deathFrame=w.game.frame;const prior=p.lifeSeq;
  await a.next('SNAPSHOT',s=>s.self.lifeSeq>prior);const life=p.lifeSeq;assert.equal(life,prior+1);
  for(let i=0;i<3;i++){const q=p.tkQuiz.question,answer=q.answers.find(a=>a.correct);assert.equal((await a.command('RESPAWN',{kind:'answer',questionId:q.id,answerId:answer.id})).accepted,true);}
  assert.equal(p.tkQuiz.correct,3);assert.equal((await a.command('RESPAWN',{kind})).accepted,true);assert.equal(p.alive,true);assert.equal(p.run.level,1);assert.ok(p.spawnProtectionUntilFrame>w.game.frame);
 }
});
test('26 simultaneous reconnects restore authoritative state, expired event history is not replayed',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const host=await(await connect(app)).host(),clients=[];
 for(let i=0;i<26;i++)clients.push(await(await connect(app)).join(host.room.code,'Bot'+i));
 await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await clients[0].phase('BATTLE');const room=app.manager.rooms.get(host.room.code),tokens=clients.map(c=>c.session.token);
 await Promise.all(clients.map(c=>c.close()));for(const m of room.members.values()){m.events=[];m.eventBytes=0;}
 const resumed=await Promise.all(tokens.map(async token=>{const c=await connect(app);c.send('RESUME',{token,cursor:0},false);await c.next('SESSION');const full=(await c.next('FULL_STATE')).payload;assert.equal(full.room.phase,'BATTLE');assert.equal(full.eventGap,true);assert.ok(full.self);return c;}));
 assert.equal(room.students().filter(p=>p.connected).length,26);assert.equal(app.metrics.reconnects,26);assert.ok(resumed.every(c=>c.messages.filter(m=>m.type==='EVENT').every(m=>m.payload.serverTick>=room.world.game.frame-5)));
});
test('bounded slow receiver cannot hold another player tick; safe pause has explicit host continuation',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const host=await(await connect(app)).host(),a=await(await connect(app)).join(host.room.code,'A'),b=await(await connect(app)).join(host.room.code,'B');await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await b.phase('BATTLE');
 const room=app.manager.rooms.get(host.room.code),peer=room.members.get(a.session.playerId).peer;a.ws.pause();const first=room.world.game.frame;for(let i=0;i<150;i++)peer.send('LOAD_FIXTURE',{padding:'x'.repeat(65536)});await sleep(300);assert.ok(room.world.game.frame>first+5);assert.ok(peer.queueBytes<=1048576);a.ws.resume();
 room.safePaused=true;const frame=room.world.game.frame;await sleep(50);assert.equal(room.world.game.frame,frame);assert.equal((await host.command('CONTINUE')).accepted,true);await sleep(100);assert.ok(room.world.game.frame>frame);
});
