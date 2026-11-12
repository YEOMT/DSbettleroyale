import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createGameServer} from '../../apps/server/src/main.js';
import {stepWorld} from '../../packages/engine/src/index.js';
import {connect} from './client.mjs';
import {freezeableFixture} from '../simulation-fixture.mjs';

test('20 simultaneous spotlights and 20 shooters against a mirror and iron body use bounded live WS entities', {timeout:60000},async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());
 const host=await(await connect(app)).host(),room=freezeableFixture(app,app.manager.rooms.get(host.room.code)),clients=[];
 for(let i=0;i<22;i++)clients.push(await(await connect(app)).join(room.code,'Bench '+i));
 const report=[];
 for(const scenario of ['spotlight','reflection']){
  await host.command('CONFIGURE',{mode:'team-elim'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');
  room.students().forEach((m,i)=>m.draft.abilityId=i<20?(scenario==='spotlight'?'emoji-152':'emoji-036'):(i===20?'emoji-153':'emoji-028'));
  room.fixtureFrozen=true;await host.command('START_BATTLE');await Promise.all(clients.map(c=>c.phase('BATTLE')));
  const w=room.world,g=w.game,actors=clients.map(c=>w.byId.get(c.session.playerId));
  w.brFarm.dispose(g);g.walls=[];g.smokes=[];g.finalPhaseTriggered=true;
  const peers=[...room.members.values()].map(m=>m.peer);
  for(const [i,p] of actors.entries()){
   p.team=i<20?1:2;p.spawnProtectionUntilFrame=0;p.cooldown=p.basicCooldown=0;p.maxHp=p.hp=20000;
   const x=i<20?-(300+(i%5)*45):150,y=scenario==='spotlight'?(i%3)*20:(i%2?600:-600)+(i<20?(i%5-2)*15:0);
   p.pos=new w.Vec2(x,y);p.vel=new w.Vec2(0,0);
  }
  g.rebuildSpatialGrid();
  async function ticks(n){
   for(let i=0;i<n;i++){
    for(const peer of peers)peer.beginBatch();
    try{stepWorld(w);}finally{for(const peer of peers)peer.endBatch();}
    if(i%3===2)await new Promise(resolve=>setImmediate(resolve));
   }
  }
  const cast=async(c,kind,seq,dx)=>{
   const result=await c.command('ACTION',{kind,seq,aim:{x:dx,y:0},aimPower:1});
   assert.equal(result.accepted,true,result.reason);
  };
  if(scenario==='spotlight'){
   await Promise.all(clients.slice(0,20).map(c=>cast(c,'skill',1,1)));await ticks(1);
   assert.equal(g.rw.entities.filter(e=>e.kind==='spotlight').length,20);
   // No overlaps among students during windup. Place both hostile targets
   // inside the existing warnings just before the authoritative resolution.
   await ticks(35);
   for(const p of actors.slice(20))p.pos=new w.Vec2(0,0);g.rebuildSpatialGrid();await ticks(1);
   for(const p of actors.slice(20)){assert.equal(p.hp,20000);assert.equal(p.stunned,180);}
   assert.equal(g.rw.entities.filter(e=>e.kind==='spotlight').length,0);
   report.push({scenario,casts:20,peakWarnings:20,stunned:2});
  }else{
   await Promise.all(clients.slice(20).map(c=>cast(c,'skill',1,-1)));await ticks(1);
   const turns=new Set(),notify=w.publishTurn;
   w.publishTurn=(q,native)=>{const id=native?q._brNetId:q.id;assert.ok(!turns.has(id),'one turn per projectile');turns.add(id);notify(q,native);};
   const cpu=process.cpuUsage(),bytes=app.metrics.sentBytes;
   await Promise.all(clients.slice(0,20).map(c=>cast(c,'attack',1,1)));await ticks(3);
   await Promise.all(clients.slice(0,20).map(c=>cast(c,'skill',1,1)));await ticks(115);
   assert.ok(turns.size>=10,'real native/homing fire reached both defenses');
   await host.next('EVENT',e=>e.type==='SHOT_TURN');
   const spent=process.cpuUsage(cpu);
   report.push({scenario,shooters:20,turns:turns.size,reliableBytes:app.metrics.sentBytes-bytes,cpuMs:(spent.user+spent.system)/1000});
  }
  assert.equal(room.students().filter(m=>m.connected).length,22);
  await host.command('END');await host.command('REMATCH');await Promise.all(clients.map(c=>c.phase('LOBBY')));
  assert.equal(room.world,null);assert.equal(app.metrics.overloads,0);
 }
 fs.mkdirSync('artifacts/v35',{recursive:true});fs.writeFileSync('artifacts/v35/ws-stress.json',JSON.stringify(report,null,2));
 for(const c of clients)await c.close();await host.close();t.diagnostic(JSON.stringify(report));
});
