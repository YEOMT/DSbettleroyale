// Synthetic browser diagnostics only; no production imports or message bodies.
export async function installDeliveryProbe(page){
 if(!page.deliveryWire){
 const wire=page.deliveryWire={rooms:[],frames:0,bytes:0};
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Performance.enable');const clockStart=Date.now(),metrics=await cdp.send('Performance.getMetrics'),clockEnd=Date.now();
 wire.clock={offset:(clockStart+clockEnd)/2-metrics.metrics.find(m=>m.name==='Timestamp').value*1000,uncertaintyMs:(clockEnd-clockStart)/2};
 cdp.on('Network.webSocketFrameReceived',e=>{
  wire.frames++;wire.bytes+=e.response.payloadData.length;
  if(!/^\{"type":"(ROOM_STATE|FULL_STATE)"/.test(e.response.payloadData))return;
  const m=JSON.parse(e.response.payloadData),r=m.payload.room||m.payload;
  wire.rooms.push({observedWall:Date.now(),networkAt:e.timestamp*1000,phase:r.phase,match:m.matchId,serverTime:r.serverTime,startedAt:r.resultPresentation?.startedAt,showResultsAt:r.resultPresentation?.showResultsAt});
  if(wire.rooms.length>100)wire.rooms.shift();
 });
 }
 await page.evaluate(()=>{
  if(window.deliveryObserved)return;
  const app=window.m||window.auditApp,r=app.renderer;
  const trace=window.deliveryObserved={events:[],longTasks:[],counts:{frame:0,draw:0,present:0},cpu:{frame:0,draw:0,present:0}};
  const record=(kind,row={})=>{trace.events.push({kind,at:performance.now(),wall:Date.now(),...row});if(trace.events.length>400)trace.events.shift();};
  for(const [owner,key,label]of [[r,'frame','frame'],[r,'draw','draw'],[r.app,'render','present']]){
   if(!owner)continue;const fn=owner[key];owner[key]=function(...args){const at=performance.now();record(label+'-start');try{return fn.apply(this,args);}finally{const ms=performance.now()-at;trace.counts[label]++;trace.cpu[label]+=ms;record(label+'-end',{ms});}};
  }
  const room=app.ui.renderRoom;app.ui.renderRoom=function(state,...args){record('room-start',{phase:state.phase,match:state.matchId,serverTime:state.serverTime});try{return room.call(this,state,...args);}finally{record('room-end',{phase:state.phase});if(state.phase==='RESULTS')requestAnimationFrame(()=>requestAnimationFrame(()=>record('results-paint',{victoryVisible:!!document.getElementById('br-victory')?.getClientRects().length,remaining:app.ui.resultFlow.clock.remaining()})));}};
  try{new PerformanceObserver(list=>{for(const e of list.getEntries())trace.longTasks.push({at:e.startTime,ms:e.duration});if(trace.longTasks.length>80)trace.longTasks.splice(0,trace.longTasks.length-80);}).observe({type:'longtask'});}catch{}
 });
}
