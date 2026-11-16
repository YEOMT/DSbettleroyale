// Private load-test instrumentation. Never installed by the production server.
import {monitorEventLoopDelay,PerformanceObserver} from 'node:perf_hooks';
import os from 'node:os';
import fs from 'node:fs';
import {Samples} from '../../apps/server/src/diagnostics/metrics.js';
function osMemory(){
 const read=path=>{try{return fs.readFileSync(path,'utf8').trim();}catch{return null;}};
 const value=path=>{const raw=read(path);return raw!==null&&/^\d+$/.test(raw)?Number(raw):raw;};
 return {scope:'server-process-host',cgroupCurrent:value('/sys/fs/cgroup/memory.current'),cgroupPeak:value('/sys/fs/cgroup/memory.peak'),cgroupEvents:read('/sys/fs/cgroup/memory.events'),psi:read('/proc/pressure/memory')};
}
export function ownership(app){
 const rooms=[...app.manager.rooms.values()],members=rooms.flatMap(r=>[...r.members.values()]),peers=[...app.peers];
 const games=rooms.map(r=>r.world?.game).filter(Boolean);
 return {rooms:rooms.length,members:members.length,tokens:app.manager.tokens.size,peers:peers.length,
  commandLedgers:members.reduce((n,p)=>n+p.ledger.size,0),commandLedgerCapPerMember:512,
  replayEntries:members.reduce((n,p)=>n+p.events.length,0),replayJsonBytes:members.reduce((n,p)=>n+p.eventBytes,0),replayMaxEntriesPerMember:2048,replayMaxJsonBytesPerMember:1048576,
  replayAgeMaxMs:Math.max(0,...members.map(p=>p.events.length?Date.now()-p.events[0].at:0)),
  queuedMessages:peers.reduce((n,p)=>n+p.queue.length,0),queueBytes:peers.reduce((n,p)=>n+p.queueBytes,0),profileStates:peers.filter(p=>p.profileState).length,
  inputPending:rooms.reduce((n,r)=>n+(r.world?.inputPending.size||0),0),actionPending:rooms.reduce((n,r)=>n+[...(r.world?.actionPending.values()||[])].reduce((m,a)=>m+a.length,0),0),
  spatialCells:games.reduce((n,g)=>n+g.spatialGrid.size,0),activeSpatialCells:games.reduce((n,g)=>n+g.activeSpatialBuckets.length,0),
  captureRecords:games.reduce((n,g)=>n+(g.capture?.records.size||0),0),farmBoxes:games.reduce((n,g)=>n+g.farmBoxes.length,0),farmFlash:games.reduce((n,g)=>n+(g.farmFlash?.size||0),0),
  attackContexts:games.reduce((n,g)=>n+(g.rw?.entities.length||0),0)};
}
export function loadTelemetry(app,{onOverload=()=>{},enabled=process.env.LOAD_DIAGNOSTICS!=='0'}={}){
 if(!enabled)return {sample:()=>({...context(),scope:'diagnostics-disabled; ownership-only samples; no private per-pump/send/GC instrumentation'}),close(){}};
 const loop=monitorEventLoopDelay({resolution:10});loop.enable();
 const machineCpu=()=>os.cpus().reduce((s,c)=>{for(const [k,v]of Object.entries(c.times)){s.total+=v;if(k==='idle')s.idle+=v;}return s;},{idle:0,total:0});
 let machine=machineCpu(),cpu=process.cpuUsage(),at=performance.now(),gc=new Samples(),step=new Samples(),snapshot=new Samples(),gap=new Samples(),send=new Samples(),pump=new Samples(),debt=new Samples();
 const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())gc.add(entry.duration);});observer.observe({entryTypes:['gc']});
 const stalls=[],overloads=[];const labels=new Map();let nextAlias=0,traffic={};let writes=new Samples(),writevs=new Samples(),sends=new Samples(),wireBytes=0,wireFrames=0;
 app.wss.on('connection',ws=>{const peer=[...app.peers].find(p=>p.socket===ws),send=ws.send.bind(ws);ws.send=(...args)=>{const at=performance.now();try{const bytes=Buffer.byteLength(args[0]);wireFrames++;wireBytes+=bytes;
   const prefix=typeof args[0]==='string'?args[0].slice(0,128):args[0].subarray(0,128).toString('utf8');
   const type=/^\{"type":"([A-Z_]+)"/.exec(prefix)?.[1]||'OTHER';
   const role=peer?.member?.role||'unbound';
   let alias=labels.get(ws);if(!alias){alias='peer-'+(++nextAlias);labels.set(ws,alias);}
   const key=alias+':'+type,row=traffic[key]??={role,alias,type,messages:0,jsonBytes:0,sizes:new Samples(128)};row.messages++;row.jsonBytes+=bytes;row.sizes.add(bytes);
   return send(...args);}finally{sends.add(performance.now()-at);}};
  ws.once('close',()=>labels.delete(ws));
  const transport=ws._socket;for(const [key,samples]of [['_write',()=>writes],['_writev',()=>writevs]]){const fn=transport[key].bind(transport);transport[key]=(...args)=>{const at=performance.now();try{return fn(...args);}finally{samples().add(performance.now()-at);}};}
 });
 function context(){const room=[...app.manager.rooms.values()][0],g=room?.world?.game,peers=[...app.peers];return {
  atMs:performance.now()-app.metrics.started,cpuUsageUs:process.cpuUsage(),debtMs:room?.debt||0,overloadSince:room?.overloadSince||0,
  phase:room?.phase,simTime:room?.world?.timeMs||0,alive:g?.participants.filter(p=>p.alive).length||0,participants:g?.participants.length||0,
  policy:g?.getHostBroadcastMode(),particleBudget:g?.getParticleBudget(),
  objects:Object.fromEntries(['projectiles','particles','zones','turrets','texts','swings','walls','smokes','signatures','rings'].map(k=>[k,g?.[k]?.length||0])),
  roster10:{retained:g?.rw?.entities.length||0,active:g?.rw?.entities.filter(e=>!e.dead).length||0,...Object.fromEntries(['decoy','grapple','mushroom','poison','ring-wall'].map(k=>[k,g?.rw?.entities.filter(e=>!e.dead&&e.kind===k).length||0])),wallSegments:g?.walls.filter(w=>w.dynamic).length||0,wallRevision:g?.dynamicObstacles?.revision||0},
  peers:peers.length,wireBytesWritten:peers.reduce((n,p)=>n+(p.socket._socket?.bytesWritten||0),0),bufferBytes:peers.reduce((n,p)=>n+p.socket.bufferedAmount,0),queueBytes:peers.reduce((n,p)=>n+p.queueBytes,0),
  ownership:ownership(app),pendingSnapshots:peers.filter(p=>p.pendingSnapshot).length,replacedSnapshots:app.metrics.replacedSnapshots,memory:process.memoryUsage()};}
 for(const [key,get] of [['stepCpu',()=>step],['snapshotCpu',()=>snapshot],['snapshotGap',()=>gap],['sendCpu',()=>send],['pumpCpu',()=>pump],['debtMs',()=>debt]]){
  const metric=app.metrics[key],add=metric.add.bind(metric);metric.add=value=>{add(value);get().add(value);if(value>(key==='snapshotGap'?125:key==='debtMs'?250:40)){stalls.push({kind:key,ms:value,...context()});if(stalls.length>120)stalls.shift();}};
 }
 let count=app.metrics.overloads;Object.defineProperty(app.metrics,'overloads',{get:()=>count,set:value=>{count=value;const row=context();overloads.push(row);if(overloads.length>100)overloads.shift();onOverload(row);}});
 return {sample(){const now=performance.now(),usage=process.cpuUsage(),elapsed=now-at,nextMachine=machineCpu();const distribution=s=>{const n=Math.min(s.count,s.values.length),v=Array.from(s.values.subarray(0,n)).sort((a,b)=>a-b);return {...s.report(),p50:v[Math.floor((n-1)*.5)]||0,sampleCount:n,scope:s.count>s.values.length?'latest-'+s.values.length+'-in-window':'entire-window'};};const result={...context(),windowStart:at-app.metrics.started,windowEnd:now-app.metrics.started,scope:'5s-server-window',osMemory:osMemory(),windowMs:elapsed,cpuMs:{user:(usage.user-cpu.user)/1000,system:(usage.system-cpu.system)/1000,total:((usage.user-cpu.user)+(usage.system-cpu.system))/1000},cpuPercent:100*((usage.user-cpu.user)+(usage.system-cpu.system))/(elapsed*1000),machine:{cpuBusyPercent:100*(1-(nextMachine.idle-machine.idle)/Math.max(1,nextMachine.total-machine.total)),freeBytes:os.freemem(),totalBytes:os.totalmem(),logicalCpus:os.cpus().length},eventLoop:{p95:loop.percentile(95)/1e6,p99:loop.percentile(99)/1e6,max:loop.max/1e6},gc:distribution(gc),step:distribution(step),snapshot:distribution(snapshot),gap:distribution(gap),send:distribution(send),pump:distribution(pump),debt:distribution(debt),transport:{writes:writes.report(),writevs:writevs.report(),sends:sends.report(),bytes:wireBytes,frames:wireFrames,traffic:Object.values(traffic).map(row=>({...row,bytesPerSecond:row.jsonBytes*1000/elapsed,sizes:distribution(row.sizes)})),definition:'UTF-8 uncompressed WebSocket JSON payload bytes counted once at ws.send; excludes framing, TCP, TLS'},stalls:stalls.splice(0),overloads:overloads.splice(0)};cpu=usage;machine=nextMachine;at=now;loop.reset();gc=new Samples();step=new Samples();snapshot=new Samples();gap=new Samples();send=new Samples();pump=new Samples();debt=new Samples();writes=new Samples();writevs=new Samples();sends=new Samples();wireBytes=wireFrames=0;traffic={};return result;},close(){loop.disable();observer.disconnect();}};
}
