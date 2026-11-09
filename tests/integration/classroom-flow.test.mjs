import test from 'node:test';import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';import {connect} from './client.mjs';
test('real WS countdown and quiz late joins preserve teams, scores and resume; exact deadline closes admission',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const h=await(await connect(app)).host(),a=await(await connect(app)).join(h.room.code,'A'),b=await(await connect(app)).join(h.room.code,'B'),r=app.manager.rooms.get(h.room.code);
 await h.command('CONFIGURE',{mode:'team-capture',teams:{[a.session.playerId]:2,[b.session.playerId]:1},quizSeconds:10});
 h.send('START_QUIZ',{},true,'start-once');assert.equal((await h.next('COMMAND_RESULT',p=>p.requestId==='start-once')).payload.accepted,true);await a.next('ROOM_STATE',p=>!!p.countdown);const end=r.countdown.endsAt;
 h.send('START_QUIZ',{},true,'start-once');assert.equal((await h.next('COMMAND_RESULT',p=>p.requestId==='start-once')).payload.accepted,true);assert.equal(r.countdown.endsAt,end);assert.equal(app.manager.protectedRooms(),1);
 const c=await(await connect(app)).join(h.room.code,'C');assert.equal(c.room.self.quiz,null);assert.equal(c.room.countdown.endsAt,end);assert.equal(r.members.get(a.session.playerId).team,2);assert.equal(r.members.get(b.session.playerId).team,1);
 const restored=await connect(app);restored.send('RESUME',{token:a.session.token},false);await restored.next('FULL_STATE');assert.equal(restored.room.countdown.endsAt,end);
 await c.phase('QUIZ');assert.equal(r.quizEndsAt,end+10000);const member=r.members.get(c.session.playerId),question=member.quiz.current;member.quiz.score=2;
 const late=await(await connect(app)).join(h.room.code,'Late');assert.ok(late.room.self.quiz.question);assert.equal(member.quiz.current,question);assert.equal(member.quiz.score,2);assert.equal(late.room.quizEndsAt,r.quizEndsAt);
 // Delayed sweep fixture: deadline gate must use the clock even with QUIZ phase.
 r.quizEndsAt=Date.now();const blocked=await connect(app);blocked.send('JOIN',{code:r.code,name:'Too late'},false);assert.equal((await blocked.next('ERROR')).payload.code,'JOIN_QUIZ_CLOSED');await h.command('BEGIN_DRAFT');assert.ok(r.members.get(late.session.playerId).draft);
});
test('team respawn then same-room rematch keeps pig base HP and clears the old life',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const h=await(await connect(app)).host(),a=await(await connect(app)).join(h.room.code,'A'),b=await(await connect(app)).join(h.room.code,'B'),r=app.manager.rooms.get(h.room.code);await h.command('CONFIGURE',{mode:'team-respawn'});
 const values=[];
 for(let round=0;round<2;round++){
  await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');r.members.get(a.session.playerId).draft.abilityId='emoji-149';await h.command('START_BATTLE');const w=r.world,p=w.byId.get(a.session.playerId);values.push(p.maxHp);assert.equal(p.maxHp,240*w.brModeHpMultiplier('team-respawn'));
  if(round===0){const prior=p.lifeSeq;p.spawnProtectionUntilFrame=0;p.takeDamage(100000,w.byId.get(b.session.playerId),false,new w.Vec2(1,0));assert.equal(p.alive,false);await a.next('SNAPSHOT',s=>s.self.lifeSeq>prior);for(let i=0;i<3;i++){const q=p.tkQuiz.question;assert.equal((await a.command('RESPAWN',{kind:'answer',questionId:q.id,answerId:q.answers.find(a=>a.correct).id})).accepted,true);}assert.equal((await a.command('RESPAWN',{kind:'keep'})).accepted,true);assert.equal(p.maxHp,values[0]);}
  await h.command('END');await h.command('REMATCH');assert.equal(r.world,null);assert.equal(w.byId.size,0);assert.equal(w.eventSink,null);assert.equal(r.students().length,2);
 }
 assert.equal(values[0],values[1]);
});
test('mushroom spawn/restore packets hide private traps from host/enemy/ally; trigger remains public',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const h=await(await connect(app)).host(),owner=await(await connect(app)).join(h.room.code,'Owner'),enemy=await(await connect(app)).join(h.room.code,'Enemy'),ally=await(await connect(app)).join(h.room.code,'Ally');
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');const r=app.manager.rooms.get(h.room.code);r.students()[0].draft.abilityId='emoji-144';await h.command('START_BATTLE');app.simulation.suspend();const w=r.world,p=w.byId.get(owner.session.playerId),q=w.byId.get(enemy.session.playerId),a=w.byId.get(ally.session.playerId);w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(600,0);a.pos=new w.Vec2(500,0);p.team=a.team=1;q.team=2;w.game.rebuildSpatialGrid();
 const start=h.messages.length;w.BRRework.cast(p,w.game,new w.Vec2(1,0),1);const trap=w.game.rw.entities.find(e=>e.kind==='mushroom');assert.ok(trap);
 for(const c of [h,owner,enemy,ally]){c.send('RESYNC');const full=(await c.next('FULL_STATE')).payload;assert.equal(full.snapshot.shots.some(s=>s.id===trap.id),c===owner);assert.ok(full.room.self);}
 for(const c of [h,enemy,ally])assert.ok(!c.messages.some(m=>m.type==='EVENT'&&m.payload.type==='SHOT_SPAWN'&&m.payload.data.id===trap.id));assert.ok(owner.messages.some(m=>m.type==='EVENT'&&m.payload.type==='SHOT_SPAWN'&&m.payload.data.id===trap.id));
 q.pos=new w.Vec2(trap.pos.x,trap.pos.y);w.game.rebuildSpatialGrid();for(let i=0;i<30;i++){w.game.frame++;w.BRRework.tick(w.game);}assert.equal(trap.dead,true);
 for(const c of [h,owner,enemy,ally]){c.send('RESYNC');const full=(await c.next('FULL_STATE')).payload;assert.ok(full.snapshot.shots.some(s=>s.kind==='poison'));await c.next('EVENT',e=>e.type==='SHOT_END'&&e.data.id===trap.id&&e.data.reason==='trigger');}
 assert.ok(h.messages.length>=start);await h.command('END');await h.command('REMATCH');assert.equal(r.world,null);for(const m of r.members.values()){assert.equal(m.peer.profileState,null);assert.equal(m.peer.pendingSnapshot,null);}assert.equal(app.metrics.overloads,0);
});
