// Bounded synthetic-fixture observations only; never imported by the game.
export function browserActionProbe(){
 if(window.actionObserved)return;
 const app=window.m||window.auditApp,{net,controls,timeline}=app;
 const log=window.actionObserved={events:[],handler:{count:0,maxMs:0},longTasks:[]};
 const state=()=>{const p=timeline.predicted;return {epoch:net.scope.connectionEpoch,match:net.scope.matchId,life:net.lifeSeq,
  enabled:controls.enabled,restoring:net.restoring,connected:net.ws?.readyState,phase:net.phase,paused:timeline.paused,
  tick:timeline.samples.at(-1)?.state.serverTick,alive:p?.alive,stunned:p?.stunned,stunEnd:p?.rw?.stunEnd,
  attack:controls.state('attack').state,skill:controls.state('skill').state,actions:{...controls.actions},authority:p?.actions,
  gestures:[...controls.gestures.keys()],hidden:document.hidden};};
 const record=(kind,data={})=>{log.events.push({wall:Date.now(),at:performance.now(),kind,...data});if(log.events.length>384)log.events.shift();};
 const fire=controls.fire;controls.fire=function(kind,...args){record('fire-enter',{action:kind,state:state()});const r=fire.call(this,kind,...args);record('fire-return',{action:kind,state:state(),feedback:controls.feedback[kind]?.state});return r;};
 const command=net.command;net.command=function(type,payload){
  const tracked=['ACTION','END','REMATCH'].includes(type);if(tracked)record('command',{type,action:payload?.kind,seq:payload?.seq,state:state()});
  const result=command.call(this,type,payload);if(tracked)result.then(r=>record('ack',{type,action:payload?.kind,seq:payload?.seq,accepted:r.accepted,state:state()}),e=>record('reject',{type,action:payload?.kind,seq:payload?.seq,reason:e.message,state:state()}));return result;
 };
 let inputAt=0;const send=net.send;net.send=function(type,payload,...args){const ok=send.call(this,type,payload,...args);if(type==='INPUT_BATCH'&&performance.now()-inputAt>=200){inputAt=performance.now();const c=payload.commands.at(-1);record('input-send',{ok,seq:c?.seq,move:c?.move,epoch:net.scope.connectionEpoch,life:net.lifeSeq});}return ok;};
 const wsSend=WebSocket.prototype.send; // Native transport, including command retries.
 WebSocket.prototype.send=function(raw){
  if(typeof raw==='string'&&/^\{"type":"(ACTION|END|REMATCH)"/.test(raw)){const m=JSON.parse(raw);record('wire-send',{type:m.type,requestId:m.requestId,action:m.payload.kind,seq:m.payload.seq,epoch:m.connectionEpoch,life:m.lifeSeq,buffered:this.bufferedAmount});}
  return wsSend.call(this,raw);
 };
 let lastSelf='';const receive=net.receive;net.receive=function(m){const start=performance.now();try{return receive.call(this,m);}finally{
  const ms=performance.now()-start;log.handler.count++;log.handler.maxMs=Math.max(log.handler.maxMs,ms);
  if(m.type==='COMMAND_RESULT')record('wire-result',{requestId:m.payload.requestId,type:m.payload.command,accepted:m.payload.accepted,reason:m.payload.reason,epoch:m.connectionEpoch,handlerMs:ms});
  const p=m.type==='PRIVATE_STATE'?m.payload:m.payload?.self;
  if(p?.actions){const key=[m.matchId,m.connectionEpoch,p.lifeSeq,p.actions.attack,p.actions.skill,p.actions.firedAttack,p.actions.firedSkill].join(':');if(key!==lastSelf){lastSelf=key;record('authority-self',{type:m.type,actions:p.actions,epoch:m.connectionEpoch,life:p.lifeSeq,stunned:p.stunned,stunEnd:p.rw?.stunEnd,sourceTick:p.rw?.sourceTick,handlerMs:ms});}}
  if(['ROOM_STATE','FULL_STATE'].includes(m.type)){const room=m.payload.room||m.payload;record('room-received',{phase:room.phase,epoch:m.connectionEpoch,serverTime:room.serverTime,handlerMs:ms});}
 }};
 for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>{const id=e.target.closest?.('#br-attack,#br-skill')?.id;if(id){record('dom-'+type,{button:id,pointer:e.pointerId,pointerType:e.pointerType,trusted:e.isTrusted,state:state()});queueMicrotask(()=>record('dom-after-'+type,{button:id,state:state()}));}},true);
 for(const type of ['blur','focus','resize'])addEventListener(type,()=>record(type,{state:state()}));
 document.addEventListener('visibilitychange',()=>record('visibility',{state:state()}));
 net.addEventListener('status',e=>record('connection',{...e.detail,state:state()}));
 addEventListener('error',e=>record('error',{message:String(e.message).slice(0,200)}));
 addEventListener('unhandledrejection',e=>record('unhandledrejection',{message:String(e.reason?.message||e.reason).slice(0,200)}));
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())log.longTasks.push({at:e.startTime,ms:e.duration});if(log.longTasks.length>64)log.longTasks.splice(0,log.longTasks.length-64);}).observe({type:'longtask',buffered:false});}catch{/* Browser may not expose longtask. */}
 record('installed',{state:state()});
}

export function authorityActionProbe(world){
 world.actionObserved=[];
 const record=(kind,row)=>{world.actionObserved.push({at:Date.now(),tick:world.game.frame,kind,...row});if(world.actionObserved.length>256)world.actionObserved.shift();};
 const actors=world.game.participants;
 for(const [index,p]of actors.entries()){
  if(index!==0&&index!==actors.length-1)continue;
  const state=()=>({index,life:p.lifeSeq,alive:p.alive,stunned:p.stunned,stunEnd:p.rw?.stunEnd,
   cooldown:p.cooldown,basicCooldown:p.basicCooldown,locks:world.BRRework.inputLocks(p,world.game),
   received:[p.receivedAttackSeq||0,p.receivedSkillSeq||0],resolved:[p.resolvedAttackSeq||0,p.resolvedSkillSeq||0],fired:[p.firedAttackSeq||0,p.firedSkillSeq||0],
   pending:[p.pendingAttack?.seq,p.pendingSkill?.seq],queue:world.actionPending.get(p.remoteId)?.map(c=>({kind:c.kind,seq:c.seq,life:c.lifeSeq}))||[]});
  const apply=p.applyPlayerInput;p.applyPlayerInput=function(...args){
   const input=world.session.inputs[p.remoteId],active=(input?.attackSeq||0)>(p.resolvedAttackSeq||0)||(input?.skillSeq||0)>(p.resolvedSkillSeq||0);
   if(active)record('authority-before',state());
   try{return apply.apply(this,args);}finally{if(active)record('authority-after',state());}
  };
 }
}
