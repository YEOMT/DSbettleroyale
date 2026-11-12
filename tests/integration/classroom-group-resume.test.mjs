import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';

test('four students resume together in a live 20-player match, move, refire and rematch', {timeout:30000},async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});
 const host=await(await connect(app)).host(),room=app.manager.rooms.get(host.room.code),students=[];
 t.after(async()=>{await Promise.all([host,...students].map(c=>c.close()));await app.close();});
 for(let i=0;i<20;i++)students.push(await(await connect(app)).join(room.code,'Synthetic '+i));
 await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');
 for(const member of room.students())member.draft.abilityId='emoji-003';
 await host.command('START_BATTLE');
 const w=room.world,returning=students.slice(0,4),watcher=students[4],startTick=(await watcher.next('SNAPSHOT')).payload.serverTick;
 // Keep the five observed actors within each other's real interest region.
 for(const [i,c]of students.slice(0,5).entries()){
  const p=w.byId.get(c.session.playerId);p.pos=new w.Vec2((i%3)*130,(i<3?0:160));p.vel=new w.Vec2(0,0);
 }
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];w.game.rebuildSpatialGrid();
 const move=(c,seq,tick,x)=>c.send('INPUT_BATCH',{commands:[{seq,clientTick:tick,move:{x,y:0},aim:{x:1,y:0}}]});
 await Promise.all(returning.map(async c=>{
  move(c,10,10,0);await c.next('SNAPSHOT',s=>s.self.lastAppliedSeq===10);
 }));
 const roomId=room.id,match=room.matchId,actorIds=returning.map(c=>c.session.playerId);
 await Promise.all(returning.map(c=>c.close()));
 const resumed=await Promise.all(returning.map(async(c,i)=>{
  const fresh=await connect(app);students[i]=fresh;
  fresh.send('RESUME',{token:c.session.token,cursor:0},false);
  const full=(await fresh.next('FULL_STATE')).payload;
  assert.equal(full.self.id,actorIds[i]);assert.equal(fresh.scope.matchId,match);
  assert.ok(fresh.scope.connectionEpoch>c.scope.connectionEpoch);
  assert.equal(full.self.inputFloor.move,10);fresh.lifeSeq=full.self.lifeSeq;
  return {fresh,self:full.self};
 }));
 await Promise.all(resumed.map(async({fresh,self})=>{
  const floor=self.inputFloor;move(fresh,floor.move+1,floor.tick+1,1);
  for(const kind of ['attack','skill']){
   const result=await fresh.command('ACTION',{kind,seq:floor[kind]+1,aim:{x:1,y:0},aimPower:1});
   assert.equal(result.accepted,true,result.reason);
  }
  await fresh.next('SNAPSHOT',s=>s.self.id===self.id&&s.self.x>self.x+1&&s.self.lastAppliedSeq===floor.move+1&&
   s.self.actions.firedAttack===floor.attack+1&&s.self.actions.firedSkill===floor.skill+1);
  for(const screen of [host,watcher])for(const kind of ['attack','skill']){
   await screen.next('EVENT',e=>e.type==='SHOT_SPAWN'&&e.data.kind==='projectile'&&e.data.owner===self.id&&
    e.data.actionKind===kind&&e.data.actionSeq===floor[kind]+1);
  }
 }));
 assert.ok(watcher.snapshot.serverTick>startTick);assert.equal(room.students().filter(p=>p.connected).length,20);
 assert.equal(app.metrics.overloads,0);assert.equal((await host.command('END')).accepted,true);
 await Promise.all(students.map(c=>c.phase('RESULTS')));
 assert.equal((await host.command('REMATCH')).accepted,true);await Promise.all(students.map(c=>c.phase('LOBBY')));
 assert.equal(room.id,roomId);assert.notEqual(room.matchId,match);assert.equal(room.world,null);
 assert.deepEqual(students.slice(0,4).map(c=>c.session.playerId),actorIds);
});
