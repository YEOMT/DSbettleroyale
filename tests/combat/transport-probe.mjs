// Bounded, synthetic-fixture-only observations. No tokens, names or message bodies.
export function serverTransportProbe(app){
 const events=[];let serial=0;const detailed=process.env.POLISH_ACTION_TRACE==='1';
 const record=value=>{events.push({at:Date.now(),...value});if(events.length>(detailed?1600:400))events.shift();};
 const start=app.manager.startBattle;app.manager.startBattle=room=>{
  if(!room._deliveryFinish){room._deliveryFinish=true;const finish=room.finish;room.finish=function(...args){record({kind:'finish-start',match:room.matchId,tick:room.world?.game.frame});try{return finish.apply(this,args);}finally{record({kind:'finish-end',match:room.matchId,phase:room.phase,presentation:room.resultPresentation?{startedAt:room.resultPresentation.startedAt,showResultsAt:room.resultPresentation.showResultsAt}:null});}};}
  return start(room);
 };
 app.wss.on('connection',(ws,request)=>{
  const peer=[...app.peers].find(p=>p.socket===ws),connection=++serial;let lastInboundAt=0,lastInboundType='';
  const browser=!!request?.headers['user-agent'];
  const state=()=>({connection,role:peer?.member?.role,epoch:peer?.epoch,match:peer?.room?.matchId,phase:peer?.room?.phase,buffered:ws.bufferedAmount,queue:peer?.queueBytes,alive:peer?.alive,lastInboundAt,lastInboundType});
  record({kind:'open',...state()});
  ws.on('message',raw=>{lastInboundAt=Date.now();lastInboundType=/^\{"type":"([A-Z_]+)"/.exec(raw.subarray(0,80).toString())?.[1]||'OTHER';});
  const ping=ws.ping.bind(ws);ws.ping=(...args)=>{record({kind:'ping',...state()});return ping(...args);};
  for(const method of ['close','terminate']){const original=ws[method].bind(ws);ws[method]=(...args)=>{record({kind:method,code:args[0],reason:String(args[1]||''),...state(),...(detailed?{stack:new Error().stack.split('\n').slice(1,5),memory:process.memoryUsage(),step:app.metrics.stepCpu.report(),snapshot:app.metrics.snapshotCpu.report()}:{} )});return original(...args);};}
  ws.on('error',e=>record({kind:'socket-error',code:e.code,message:e.message,...state()}));
  if(detailed&&browser)ws.prependListener('message',raw=>{
   const type=/^\{"type":"([A-Z_]+)"/.exec(raw.subarray(0,80).toString())?.[1];
   if(!['ACTION','END','REMATCH'].includes(type))return;
   const m=JSON.parse(raw);record({kind:'received-command',...state(),type,requestId:m.requestId,commandEpoch:m.connectionEpoch,life:m.lifeSeq,action:m.payload.kind,seq:m.payload.seq});
  });
  ws.on('close',(code,reason)=>record({kind:'closed',code,reason:String(reason),...state()}));
  ws.on('pong',()=>record({kind:'pong',...state()}));
  const send=ws.send.bind(ws);ws.send=(raw,...args)=>{
   const prefix=typeof raw==='string'?raw.slice(0,40):raw.subarray(0,40).toString();
   if(/^\{"type":"(ROOM_STATE|FULL_STATE)"/.test(prefix)){
    const m=JSON.parse(raw),room=m.payload.room||m.payload;
    record({kind:'send-room',...state(),serverTime:room.serverTime,phase:room.phase,presentation:room.resultPresentation?{startedAt:room.resultPresentation.startedAt,showResultsAt:room.resultPresentation.showResultsAt}:null});
    if(room.phase==='RESULTS'){
     const callback=typeof args.at(-1)==='function'?args.pop():null;
     args.push(error=>{record({kind:'sent-room',...state(),serverTime:room.serverTime,error:error?.message});callback?.(error);});
    }
   }
   if(detailed&&browser&&/^\{"type":"COMMAND_RESULT"/.test(prefix)){const m=JSON.parse(raw);record({kind:'send-result',...state(),requestId:m.payload.requestId,type:m.payload.command,accepted:m.payload.accepted,reason:m.payload.reason});}
   return send(raw,...args);
  };
 });
 return ()=>events.slice();
}
export function browserTransportProbe(){
 const Native=window.WebSocket;let serial=0;
 window.transportObserved={events:[],messages:0,chars:0,lastAt:0};
 const record=value=>{const a=transportObserved.events;a.push({wall:Date.now(),at:performance.now(),...value});if(a.length>200)a.shift();};
 window.WebSocket=class extends Native{
  constructor(...args){super(...args);const connection=++serial;record({kind:'connecting',connection,endpoint:new URL(args[0]).host});
   this.addEventListener('open',()=>record({kind:'open',connection}));
   this.addEventListener('close',e=>record({kind:'close',connection,code:e.code,reason:e.reason}));
   this.addEventListener('message',e=>{
    transportObserved.messages++;transportObserved.chars+=typeof e.data==='string'?e.data.length:0;transportObserved.lastAt=Date.now();
    if(typeof e.data==='string'&&/^\{"type":"(ROOM_STATE|FULL_STATE)"/.test(e.data)){
     const m=JSON.parse(e.data),room=m.payload.room||m.payload;
     record({kind:'receive-room',connection,eventAt:e.timeStamp,epoch:m.connectionEpoch,match:m.matchId,phase:room.phase,serverTime:room.serverTime,startedAt:room.resultPresentation?.startedAt,showResultsAt:room.resultPresentation?.showResultsAt});
    }
   });
  }
 };
}
