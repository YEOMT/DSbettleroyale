import {createWorld,stepWorld,getTeacherState,getVisibleState,getStaticState,FIXED_DT_MS} from '../../../../packages/engine/src/index.js';
export function attachSimulation(manager,metrics){
 let stopped=false,timer,last=performance.now();
 manager.startBattle=room=>{
  room.world=createWorld(undefined,{...room.config,matchId:room.matchId,quizBank:room.quizBank},room.matchId,room.students().map(p=>({id:p.id,name:p.name,abilityId:p.draft.abilityId,team:p.team,quizScore:p.quiz?.score||0,rerolls:p.draft.rerolls})),event=>sendEvent(room,event));
  room.debt=0;room.lastSnapshot=performance.now();room.snapshotSeq=0;room.overloadSince=0;room.static=getStaticState(room.world);
  for(const m of room.members.values())m.peer?.send('STATIC_STATE',room.static);
 };
 function sendEvent(room,event){
  if(event.type==='TRACE')return;
  const world=room.world;if(!world)return;
  for(const m of room.members.values()){
   if(!m.peer)continue;
   if(m.role!=='host'){
    const self=world.byId.get(m.id);if(!self)continue;
    if(event.type==='DEATH'&&event.data.playerId!==m.id)continue;
    if(event.type!=='DEATH'){
     const d=event.data,b=world.brViewerBounds(self,{});
     if(d.owner!==m.id&&d.sourceId!==m.id&&!world.brViewContains(b,d.x,d.y,Math.max(100,d.radius||d.size||0)))continue;
    }
   }
   m.peer.send('EVENT',event,{reliable:true});
  }
 }
 function pump(){
  if(stopped)return;const now=performance.now(),elapsed=now-last;last=now;let more=false;
  for(const room of manager.rooms.values()){
   if(room.phase!=='BATTLE'||!room.world)continue;
   if(room.safePaused)continue;
   room.debt+=elapsed;
   if(room.debt>250){room.overloadSince||=now;if(now-room.overloadSince>1000){room.safePaused=true;metrics.overloads++;for(const m of room.members.values())m.peer?.send('OVERLOAD',{paused:true,debtMs:room.debt});continue;}}else room.overloadSince=0;
   let count=0;
   while(room.debt+1e-8>=FIXED_DT_MS&&count<5){
    const start=performance.now();try{stepWorld(room.world);}catch(error){room.safePaused=true;room.lastFault=error.message;for(const m of room.members.values())m.peer?.send('ERROR',{code:'SIMULATION_PAUSED'});break;}
    metrics.stepCpu.add(performance.now()-start);room.debt-=FIXED_DT_MS;count++;
    if(room.world.finished){room.finish();manager.changed(room);break;}
   }
   if(room.debt>=FIXED_DT_MS)more=true;
   if(now-room.lastSnapshot>=50&&room.phase==='BATTLE'){
    metrics.snapshotGap.add(now-room.lastSnapshot);room.lastSnapshot=now;const start=performance.now(),teacher=getTeacherState(room.world);room.snapshotSeq++;
    for(const member of room.members.values()){
     if(!member.connected)continue;
     const view=member.role==='host'?teacher:getVisibleState(room.world,member.id);
     member.peer?.send('SNAPSHOT',{...view,snapshotSeq:room.snapshotSeq,serverNow:now},{snapshot:true});
    }
    metrics.snapshotCpu.add(performance.now()-start);
   }
  }
  timer=more?setImmediate(pump):setTimeout(pump,4);timer.unref();
 }
 timer=setTimeout(pump,4);timer.unref();
 return ()=>{stopped=true;clearTimeout(timer);clearImmediate(timer);};
}
