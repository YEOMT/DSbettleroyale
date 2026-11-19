// Test-only IPC extension. The production server never imports this fixture.
import * as engine from '../../packages/engine/src/index.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {prepare357,finish357} from '../v35-7/scenario.mjs';
let observations=new Map(),previous;
export function polishFixture(app,m){
 const room=[...app.manager.rooms.values()][0],w=room?.world;
 if(m.type==='polish-prepare'){
  app.simulation.suspend();const ids=room.rules.EMOJI_DB.filter(a=>(room.config.drawRule==='f-only'?a.t==='F':room.config.drawRule==='s-only'?a.t==='S':true)&&!(room.config.mode==='solo'&&a.teamOnly));
  const focus=m.focus||['emoji-025','emoji-042','emoji-034','emoji-019','emoji-000','emoji-007','emoji-010','emoji-014','emoji-122','emoji-031','emoji-128','emoji-144'];
  const pool=m.sOnly?ids.filter(a=>a.t==='S'):room.config.drawRule&&room.config.drawRule!=='normal'?ids:focus.map(id=>ids.find(a=>a.id===id)).filter(Boolean);
  room.students().forEach((p,i)=>p.draft.abilityId=pool[i%pool.length].id);return true;
 }
 if(m.type==='polish-place'){
  previous=w;const g=w.game;g.finalPhaseTriggered=true;observations=new Map();
  for(const [i,p]of g.participants.entries()){p.pos=new w.Vec2((i%5)*180-360,Math.floor(i/5)*180-270);p.vel=new w.Vec2(0,0);p.hp=p.maxHp=100000;p.spawnProtectionUntilFrame=0;p.run.rng=w.brHashRandom('polish-'+i);}
  if(m.overdrive){for(const p of g.participants){p.run.paths={rapid:2,[w.brBasicCombatProfile(p.ability).close?'wide':'giant']:2};p.run.level=6;p.run.choices=4;p.run.pending=1;w.brRecomputeRun(p);p.hp=p.maxHp=100000;}}
  if(m.overdrive2)for(const [i,p]of g.participants.entries())prepare357(w,p,i);
  g.rebuildSpatialGrid();
  const bounds=w.brViewerBounds;w.brViewerBounds=(p,interest)=>{if(interest===w.session.inputs[p.remoteId])observations.get(p.remoteId).views++;return bounds(p,interest);};
  for(const member of room.members.values()){
   const row={role:member.role,alias:member.role==='host'?'host':'student-'+room.students().indexOf(member),combatBytes:0,controlBytes:0,snapshots:0,events:0,views:0};observations.set(member.id,row);
   const peer=member.peer;if(!peer||peer._polishObserved)continue;peer._polishObserved=true;const send=peer.socket.send.bind(peer.socket);peer.socket.send=(raw,...args)=>{const r=observations.get(member.id);if(r){const type=/^\{"type":"([A-Z_]+)"/.exec(String(raw))?.[1]||'';if(['EVENT','EVENT_BATCH','SNAPSHOT','PRIVATE_STATE','PROFILE_STATE','LEADERBOARD'].includes(type)){r.combatBytes+=Buffer.byteLength(raw);if(type==='SNAPSHOT'){r.snapshots++;if(member.role==='host')r.views++;}if(type==='EVENT'||type==='EVENT_BATCH')r.events++;}else r.controlBytes+=Buffer.byteLength(raw);}return send(raw,...args);};
  }
  room.static=engine.getStaticState(w);const teacher=engine.getTeacherState(w),encode=snapshotEncoder(teacher,++room.snapshotSeq,performance.now());
  for(const member of room.members.values())if(member.peer){member.peer.send('STATIC_STATE',room.static);const view=member.role==='host'?engine.getHostVisibleState(teacher):engine.getVisibleState(w,member.id,undefined,teacher);member.peer.snapshot(encode(view.self?{...view,self:member.peer.selfState(view.self)}:view,member.peer.scope()));}
  return true;
 }
 if(m.type==='polish-overdrive-growth'){
  let accepted=0,fx=0;const g=w.game,emit=g.emitStudentFx;g.emitStudentFx=function(...args){if(String(args[2]?.style).startsWith('overdrive-'))fx++;return emit.apply(g,args);};
  try{for(const [i,p]of g.participants.entries()){const path=i%2?(w.brBasicCombatProfile(p.ability).close?'wide':'giant'):'rapid';p.run.offer={id:'overdrive-'+i,cards:[w.brRunCard(p,path,3)]};if(w.brChooseRun(p,p.run.offer.id,path))accepted++;}}
  finally{g.emitStudentFx=emit;}return {accepted,fx};
 }
 if(m.type==='polish-overdrive2-growth')return finish357(w);
 if(m.type==='polish-population'){
  const g=w.game;for(const p of g.participants.slice(m.alive))if(p.alive){p.spawnProtectionUntilFrame=0;p.takeDamage(1e8,g.participants[0]);}return true;
 }
 if(m.type==='polish-state')return {resources:w?{shots:w.game.projectiles.length,entities:w.game.rw?.entities.length||0,fragments:w.game.rw?.entities.filter(e=>e.style==='apple-fragment').length||0,contexts:w.game.participants.reduce((n,p)=>n+(p.rw?.buffs.length||0)+(p.rw?.dots.length||0),0),rss:process.memoryUsage().rss,heap:process.memoryUsage().heapUsed}:null,phase:room.phase,round:room.round,resultPresentation:room.resultPresentation,serverTime:room.manager.now(),connected:room.students().filter(p=>p.connected).length,observations:[...observations].map(([id,row])=>({...row,alive:w?.byId.get(id)?.alive,queued:room.members.get(id).peer?.queue.length||0,replay:room.members.get(id).events.length})),actions:[...(w?.byId.values()||[])].map(p=>({alive:p.alive,x:p.pos.x,y:p.pos.y,life:p.lifeSeq,attack:p.firedAttackSeq||0,skill:p.firedSkillSeq||0})),disposed:!w&&previous?{world:previous.disposed,actors:previous.byId.size,inputs:previous.inputPending.size,actions:previous.actionPending.size,entities:previous.game.rw?.entities.length||0}:null};
 if(m.type==='polish-kill-student'){const p=w.game.participants[0];p.spawnProtectionUntilFrame=0;p.takeDamage(1e8,w.game.participants.find(q=>q.team!==p.team));return true;}
 if(m.type==='polish-quiz-answer'){const p=w.game.participants[0],q=p.tkQuiz.question;return q?.answers?.find(a=>a.correct)?.id||q?.correctId||q?.answer;}
 if(m.type==='polish-pause'){room.pause();return true;}
 throw Error('UNKNOWN_POLISH_FIXTURE');
}
