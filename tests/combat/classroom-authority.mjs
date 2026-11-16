// Private IPC fixture for the existing isolated load server; never an HTTP/WS route.
import {createHash} from 'node:crypto';
import * as engine from '../../packages/engine/src/index.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {classroomMeter} from './classroom-meter.mjs';
let previousWorld,meter;
export function classroomFixture(app,m){
 const room=[...app.manager.rooms.values()][0],w=room?.world;
 if(m.type==='classroom-meter-start'){meter=classroomMeter(app);meter.attach();return true;}
 if(m.type==='classroom-meter-finish'){const result=meter.finish();meter=null;return result;}
 if(m.type==='classroom-benchmark'){room.matchId='upgrade-fixed-'+m.round;room.round++;room.revision++;room.config.mapIndex=Number(process.env.CLASSROOM_MAP||0);app.manager.changed(room);return room.matchId;}
 if(m.type==='classroom-prepare'){
  app.simulation.suspend();
  room.students().forEach((p,i)=>p.draft.abilityId=(process.env.CLASSROOM_CONTROLS353?['emoji-003','emoji-131','emoji-028','emoji-153']:process.env.CLASSROOM_UPGRADE?['emoji-003','emoji-034','emoji-070','emoji-141']:['emoji-003','emoji-141','emoji-149','emoji-144'])[i%4]);return true;
 }
 if(m.type==='classroom-place'){
  previousWorld=w;meter?.attach(w);if(!process.env.CLASSROOM_UPGRADE){w.game.walls=[];w.game.smokes=[];w.game.farmBoxes=[];}
  [...w.byId.values()].forEach((p,i)=>{const spacing=process.env.CLASSROOM_CONTROLS353&&m.round===3?130:330;p.pos=new w.Vec2((i%5)*spacing-2*spacing,Math.floor(i/5)*spacing-1.5*spacing);p.vel=new w.Vec2(0,0);});w.game.rebuildSpatialGrid();
  room.static=engine.getStaticState(w);const teacher=engine.getTeacherState(w),encode=snapshotEncoder(teacher,++room.snapshotSeq,performance.now());
  for(const p of room.members.values())if(p.peer){p.peer.send('STATIC_STATE',room.static);const view=p.role==='host'?(engine.getHostVisibleState?.(teacher)||teacher):engine.getVisibleState(w,p.id,undefined,teacher);p.peer.snapshot(encode(view.self?{...view,self:p.peer.selfState(view.self)}:view,p.peer.scope()));}return true;
 }
 if(m.type==='classroom-arena'){
  const g=w.game;
  return {map:g.mapIndex,radius:g.worldRadius,xp:g.farmBoxes.filter(b=>b.kind==='xp').length,
   portal:!!g.escapeMap?.portal,pads:g.escapeMap?.pads.length,startTick:w.BR_RING_RULES.startTick};
 }
 if(m.type==='classroom-population'){if(![6,5,3].includes(m.alive))throw Error('INVALID_POPULATION');for(const p of [...w.byId.values()].slice(m.alive)){p.alive=false;p.hp=0;}return {alive:w.game.participants.filter(p=>p.alive).length,connected:room.students().filter(p=>p.connected).length};}
 if(m.type==='classroom-run'){app.simulation.resume();return true;}
 if(m.type==='classroom-disconnect'){room.students()[0].peer.socket.close(1012,'TEST_TRANSITION_RESUME');return true;}
 if(m.type==='classroom-finish'){for(const p of [...w.byId.values()].slice(1))p.takeDamage(100000,w.byId.values().next().value,false,new w.Vec2(1,0));return true;}
 if(m.type==='classroom-state')return {
  id:room.id,code:room.code,round:room.round,phase:room.phase,paused:room.safePaused,fault:room.lastFault,
  identities:room.students().map(p=>[p.id,createHash('sha256').update(p.token).digest('hex')]),
  connected:room.students().filter(p=>p.connected).length,
  actions:[...(w?.byId.values()||[])].map(p=>({move:p.lastAppliedSeq,attack:p.firedAttackSeq,skill:p.firedSkillSeq})),
  peers:room.students().map(p=>({queue:p.peer?.queue.length,bytes:p.peer?.queueBytes,pending:!!p.peer?.pendingSnapshot,profile:!!p.peer?.profileState})),
  disposed:!w&&previousWorld?{disposed:previousWorld.disposed,callbacks:!!(previousWorld.eventSink||previousWorld.onInputApplied),inputs:previousWorld.lastInputAt.size,players:previousWorld.byId.size,entities:previousWorld.game.rw?.entities?.length||0}:null,
  cpu:process.cpuUsage(),metrics:app.metrics.report(app.manager),lastClose:app.metrics.lastClose
 };
 throw Error('UNKNOWN_CLASSROOM_FIXTURE');
}
