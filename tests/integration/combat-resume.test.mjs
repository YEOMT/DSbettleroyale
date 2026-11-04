import test from 'node:test';import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';import {connect} from './client.mjs';
test('ten real socket replacements retain dead/stunned authority and the same respawn quiz',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());
 const host=await(await connect(app)).host(),room=app.manager.rooms.get(host.room.code);
 let a=await(await connect(app)).join(room.code,'A');await(await connect(app)).join(room.code,'B');
 await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await a.phase('BATTLE');
 const p=room.world.byId.get(a.session.playerId),id=p.remoteId,token=a.session.token;
 p.stunned=45;room.safePaused=true;
 for(let i=0;i<10;i++){
  await a.close();a=await connect(app);a.send('RESUME',{token,cursor:0},false);
  const full=(await a.next('FULL_STATE')).payload;assert.equal(full.self.id,id);assert.equal(full.self.stunned,p.stunned);assert.equal(full.self.alive,p.alive);assert.equal(full.self.hp,Math.max(0,p.hp));assert.equal(full.self.lifeSeq,p.lifeSeq);assert.equal(room.students().length,2);
  if(i===0){p.alive=false;p.deathHandled=false;p.deathFrame=room.world.game.frame;room.safePaused=false;await a.next('SNAPSHOT',s=>!s.self.alive&&s.self.respawn?.question);room.safePaused=true;}
 }
 assert.ok(p.tkQuiz?.question);await a.close();
 const fresh=await createGameServer({port:0,hostSecret:'test-host'});try{
  const unknown=await connect(fresh);unknown.send('RESUME',{token,cursor:0},false);
  assert.equal((await unknown.next('ERROR')).payload.code,'ROOM_EXPIRED');assert.equal(fresh.manager.rooms.size,0);
 }finally{await fresh.close();}
});
