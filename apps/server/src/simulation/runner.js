import {createWorld,stepWorld,getTeacherState,getHostVisibleState,getVisibleState,getStaticState,FIXED_DT_MS} from '../../../../packages/engine/src/index.js';
import {snapshotEncoder} from '../ws/snapshot.js';
import {presentationState} from '../ws/presentation-state.js';
export function attachSimulation(manager,metrics){
 let stopped=false,suspended=false,timer,last=performance.now();
 manager.startBattle=room=>{
  room.world=createWorld(undefined,{...room.config,matchId:room.matchId,quizBank:room.quizBank},room.matchId,room.students().map(p=>({id:p.id,name:p.name,abilityId:p.draft.abilityId,team:p.team,quizScore:p.quiz?.score||0,rerolls:p.draft.rerolls})),event=>sendEvent(room,event));
  room.world.onInputApplied=input=>{if(Number.isFinite(input.receivedAt))metrics.inputApply.add(performance.now()-input.receivedAt);};
  room.debt=0;room.lastSnapshot=performance.now();room.nextSnapshot=room.lastSnapshot+50;room.snapshotSeq=0;room.overloadSince=0;room.static=getStaticState(room.world);
  for(const m of room.members.values())m.peer?.send('STATIC_STATE',room.static);
 };
 function sendEvent(room,event){
  if(event.type==='TRACE')return;
  const world=room.world;if(!world)return;
  const payloadJson=JSON.stringify(event);
  for(const m of room.members.values()){
   if(!m.peer)continue;
   if(event.data.kind==='mushroom'&&event.type==='SHOT_SPAWN'&&event.data.owner!==m.id)continue;
   if(event.data.kind==='mushroom'&&event.type==='SHOT_END'&&!['trigger','destroyed'].includes(event.data.reason)&&event.data.owner!==m.id)continue;
   if(m.role!=='host'){
    const self=world.byId.get(m.id);if(!self)continue;
    if(event.type==='DEATH'&&event.data.playerId!==m.id)continue;
    if(event.type!=='DEATH'){
     const d=event.data,b=world.brViewerBounds(self,{});
     if(d.kind==='decoy'&&d.owner!==m.id&&world.game.isConcealedFrom({id:d.id,pos:{x:d.x,y:d.y},team:d.team||0,alive:true,lifeSeq:d.life},self))continue;
     if(d.owner!==m.id&&d.sourceId!==m.id&&!world.brViewContains(b,d.x,d.y,Math.max(100,d.radius||d.size||0)))continue;
    }
   }
   m.peer.send('EVENT',event,{reliable:true,payloadJson});
  }
 }
 function pump(){
  if(stopped||suspended)return;const now=performance.now(),elapsed=now-last;last=now;let more=false;
  for(const room of manager.rooms.values()){
   if(room.phase!=='BATTLE'||!room.world)continue;
   if(room.safePaused)continue;
   room.debt+=elapsed;
   if(room.debt>250){room.overloadSince||=now;if(now-room.overloadSince>1000){metrics.overloads++;room.pause();continue;}}else room.overloadSince=0;
   const pumpStart=performance.now(),peers=[];for(const m of room.members.values())if(m.connected&&m.peer){peers.push(m.peer);m.peer.beginBatch();}
   try{
   let count=0;
   while(room.debt+1e-8>=FIXED_DT_MS&&count<5){
    const start=performance.now();try{stepWorld(room.world);}catch(error){room.pause(error.message);break;}
    metrics.stepCpu.add(performance.now()-start);room.debt-=FIXED_DT_MS;count++;
    if(room.world.finished){room.finish();manager.changed(room);break;}
   }
   if(room.debt>=FIXED_DT_MS)more=true;
   if(now>=room.nextSnapshot&&room.phase==='BATTLE'){
    do{room.nextSnapshot+=50;}while(room.nextSnapshot<=now);
    metrics.snapshotGap.add(now-room.lastSnapshot);room.lastSnapshot=now;const start=performance.now(),teacher=getTeacherState(room.world);room.snapshotSeq++;
    const publicTeacher=presentationState(room.world,teacher),encode=snapshotEncoder(publicTeacher,room.snapshotSeq,now);
    for(const member of room.members.values()){
     if(!member.connected)continue;
     const view=member.role==='host'?getHostVisibleState(publicTeacher):getVisibleState(room.world,member.id,undefined,publicTeacher);
     if(member.peer)member.peer.snapshot(encode(view.self?{...view,self:member.peer.selfState(view.self)}:view,member.peer.scope()));
    }
    metrics.snapshotCpu.add(performance.now()-start);
    if(now-(room.lastBoard||0)>=500){room.lastBoard=now;const board=room.world.session.respawnMode?room.world.brTKBuildBoard(false):{players:teacher.actors.map(a=>({id:a.id,name:a.name,team:a.team,kills:a.kills,deaths:a.deaths,rank:0})),teams:[]};for(const m of room.members.values())m.peer?.send('LEADERBOARD',board);}
   }
   }finally{const sendStart=performance.now();for(const peer of peers)peer.endBatch();metrics.sendCpu.add(performance.now()-sendStart);metrics.pumpCpu.add(performance.now()-pumpStart);metrics.debtMs.add(room.debt);}
  }
  timer=more?setImmediate(pump):setTimeout(pump,4);timer.unref();
 }
 timer=setTimeout(pump,4);timer.unref();
 const suspend=()=>{suspended=true;clearTimeout(timer);clearImmediate(timer);};
 return {suspend,resume(){if(stopped||!suspended)return;suspended=false;last=performance.now();timer=setTimeout(pump,4);timer.unref();},stop(){stopped=true;suspend();}};
}
