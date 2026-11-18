// Bounded, synthetic-fixture-only observations. No tokens, names or message bodies.
export function serverTransportProbe(app){
 const events=[];let serial=0;
 const record=value=>{events.push({at:Date.now(),...value});if(events.length>400)events.shift();};
 app.wss.on('connection',ws=>{
  const peer=[...app.peers].find(p=>p.socket===ws),connection=++serial;
  const state=()=>({connection,role:peer?.member?.role,epoch:peer?.member?.epoch,match:peer?.room?.matchId,phase:peer?.room?.phase,buffered:ws.bufferedAmount,queue:peer?.queueBytes,alive:peer?.alive});
  record({kind:'open',...state()});
  for(const method of ['close','terminate']){const original=ws[method].bind(ws);ws[method]=(...args)=>{record({kind:method,code:args[0],reason:String(args[1]||''),...state()});return original(...args);};}
  ws.on('close',(code,reason)=>record({kind:'closed',code,reason:String(reason),...state()}));
  ws.on('pong',()=>record({kind:'pong',...state()}));
  const send=ws.send.bind(ws);ws.send=(raw,...args)=>{
   const prefix=typeof raw==='string'?raw.slice(0,40):raw.subarray(0,40).toString();
   if(/^\{"type":"(ROOM_STATE|FULL_STATE)"/.test(prefix)){
    const m=JSON.parse(raw),room=m.payload.room||m.payload;
    record({kind:'send-room',...state(),serverTime:room.serverTime,phase:room.phase,presentation:room.resultPresentation?{startedAt:room.resultPresentation.startedAt,showResultsAt:room.resultPresentation.showResultsAt}:null});
   }
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
  constructor(...args){super(...args);const connection=++serial;record({kind:'connecting',connection});
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
