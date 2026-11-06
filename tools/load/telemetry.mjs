// Private load-test instrumentation. Never installed by the production server.
import {monitorEventLoopDelay,PerformanceObserver} from 'node:perf_hooks';
import {Samples} from '../../apps/server/src/diagnostics/metrics.js';
export function loadTelemetry(app){
 const loop=monitorEventLoopDelay({resolution:10});loop.enable();
 let cpu=process.cpuUsage(),at=performance.now(),gc=new Samples(),step=new Samples(),snapshot=new Samples(),gap=new Samples();
 const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())gc.add(entry.duration);});observer.observe({entryTypes:['gc']});
 const stalls=[],overloads=[];let writes=new Samples(),writevs=new Samples(),sends=new Samples(),wireBytes=0,wireFrames=0;
 app.wss.on('connection',ws=>{const send=ws.send.bind(ws);ws.send=(...args)=>{const at=performance.now();try{wireFrames++;wireBytes+=Buffer.byteLength(args[0]);return send(...args);}finally{sends.add(performance.now()-at);}};
  const transport=ws._socket;for(const [key,samples]of [['_write',()=>writes],['_writev',()=>writevs]]){const fn=transport[key].bind(transport);transport[key]=(...args)=>{const at=performance.now();try{return fn(...args);}finally{samples().add(performance.now()-at);}};}
 });
 function context(){const room=[...app.manager.rooms.values()][0],g=room?.world?.game,peers=[...app.peers];return {
  atMs:performance.now()-app.metrics.started,debtMs:room?.debt||0,overloadSince:room?.overloadSince||0,
  phase:room?.phase,alive:g?.participants.filter(p=>p.alive).length||0,participants:g?.participants.length||0,
  policy:g?.getHostBroadcastMode(),particleBudget:g?.getParticleBudget(),
  objects:Object.fromEntries(['projectiles','particles','zones','turrets','texts','swings','walls','smokes','signatures','rings'].map(k=>[k,g?.[k]?.length||0])),
  peers:peers.length,wireBytesWritten:peers.reduce((n,p)=>n+(p.socket._socket?.bytesWritten||0),0),bufferBytes:peers.reduce((n,p)=>n+p.socket.bufferedAmount,0),queueBytes:peers.reduce((n,p)=>n+p.queueBytes,0),
  pendingSnapshots:peers.filter(p=>p.pendingSnapshot).length,replacedSnapshots:app.metrics.replacedSnapshots,memory:process.memoryUsage()};}
 for(const [key,get] of [['stepCpu',()=>step],['snapshotCpu',()=>snapshot],['snapshotGap',()=>gap]]){
  const metric=app.metrics[key],add=metric.add.bind(metric);metric.add=value=>{add(value);get().add(value);if((key==='snapshotGap'?value>125:value>40)){stalls.push({kind:key,ms:value,...context()});if(stalls.length>120)stalls.shift();}};
 }
 let count=app.metrics.overloads;Object.defineProperty(app.metrics,'overloads',{get:()=>count,set:value=>{count=value;overloads.push(context());if(overloads.length>100)overloads.shift();}});
 return {sample(){const now=performance.now(),usage=process.cpuUsage(),elapsed=now-at;const result={...context(),windowMs:elapsed,cpuPercent:100*((usage.user-cpu.user)+(usage.system-cpu.system))/(elapsed*1000),eventLoop:{p95:loop.percentile(95)/1e6,p99:loop.percentile(99)/1e6,max:loop.max/1e6},gc:gc.report(),step:step.report(),snapshot:snapshot.report(),gap:gap.report(),transport:{writes:writes.report(),writevs:writevs.report(),sends:sends.report(),bytes:wireBytes,frames:wireFrames},stalls:stalls.splice(0),overloads:overloads.splice(0)};cpu=usage;at=now;loop.reset();gc=new Samples();step=new Samples();snapshot=new Samples();gap=new Samples();writes=new Samples();writevs=new Samples();sends=new Samples();wireBytes=wireFrames=0;return result;},close(){loop.disable();observer.disconnect();}};
}
