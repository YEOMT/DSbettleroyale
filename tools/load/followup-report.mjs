// Publish synthetic counters only; raw reports/profiles stay in ignored artifacts.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root='artifacts/performance-followup/';
const cases=['baseline75','candidate75','candidate605','candidate605-retry'];
const summary=cases.map(name=>{
 const file=root+name+'.json';if(!fs.existsSync(file))return {name,status:'NOT_RUN'};
 const raw=fs.readFileSync(file),a=JSON.parse(raw),end=a.samples.find(r=>r.stage==='continuous-end'),server=end?.server||a.server||a.samples.at(-1)?.server;
 const start=a.roundStarts?.[0]?.simTime,observedSim=server?.window?.simTime??a.samples.at(-1)?.surfaces.host.simTime;
 const actual=a.simulatedMs||(start&&Number.isFinite(observedSim)?Object.fromEntries(Object.entries(start).map(([role,value])=>[role,observedSim-value])):null);
 return {name,status:a.status,rawSha256:createHash('sha256').update(raw).digest('hex'),sourceHash:server?.sourceHash,fixtureHash:a.fixtureHash,seconds:a.seconds,elapsedMs:a.elapsedMs,simulatedMs:actual,observationCompleted:!!end,absoluteEndSimulationMs:end?.surfaces.host.simTime??observedSim,
  preparationExcluded:!!start||!!a.simulatedMs,overloadsAtEnd:server?.overloads,overloadsIncludingRematch:a.server?.overloads,continues:a.overloadRecoveries||0,step:server?.stepCpu,snapshot:server?.snapshotCpu,send:server?.sendCpu,pump:server?.pumpCpu,gap:server?.snapshotGap,debt:server?.debtMs,
  cleanup:a.cleanup,rematchCleanup:a.rematchCleanup||(end?'NOT_ASSERTED':'NOT_RUN'),resultsObserved:a.resultsObserved||[],failure:a.failure?.split('\n')[0],
  windows:a.samples.map(row=>{const w=row.server.window;return {seconds:row.elapsedSeconds,stage:row.stage,alive:w.alive,connected:row.server.connected,simTime:w.simTime,roster:w.roster10,objects:w.objects,step:w.step,snapshot:w.snapshot,send:w.send,pump:w.pump,debt:w.debt,eventLoop:w.eventLoop,gc:w.gc,transport:w.transport,processCpuPercent:w.cpuPercent,machine:w.machine,memory:w.memory,overloads:w.overloads,stalls:w.stalls,
   surfaces:Object.fromEntries(Object.entries(row.surfaces).map(([role,s])=>[role,{frame:s.stats.frameGapMs,draw:s.stats.drawMs,receive:s.stats.receiveMs,timelineMs:s.stats.timelineMs,sourceGap:s.stats.snapshotSourceGapMs,heap:s.heap,textBuilds:s.textBuilds,caches:s.caches,roster:s.roster10,timeline:s.timeline,simTime:s.simTime,renderer:s.renderer,quality:s.quality,resolution:s.resolution,error:s.error}]))};})};
});
const bench='artifacts/tablet-stability/followup-cache-snapshot.json';
const quick=JSON.parse(fs.readFileSync(root+'quick-results.json')),capture=JSON.parse(fs.readFileSync(root+'capture26.json')),recovery=JSON.parse(fs.readFileSync(root+'recovery-pixi.json'));
const report={base:'3c4d94d16d5eb0b5ff9bf655fcec94368ed091e0',environment:'Windows loopback; i5-1340P / 16 logical CPUs / 15.57 GiB. Three simultaneous 1024x768 DPR2 balanced Edge surfaces. Short pair CPU-profiled; long run unprofiled, no video. AWS/physical device NOT_RUN.',limits:'One candidate605 permitted; a second only after a demonstrated cause and correction. Never select only passing attempts.',priorPR9:{overloads:10,absoluteSimulationSeconds:461.8,status:'FAIL'},cases:summary,encodingBenchmark:fs.existsSync(bench)?JSON.parse(fs.readFileSync(bench)):null};
report.regressions={quick,capture:{pass:capture.pass,seconds:capture.seconds,players:capture.players,totalMs:capture.totalMs,elapsedMs:capture.elapsedMs,overloads:capture.server.overloads,step:capture.server.stepCpu,snapshot:capture.server.snapshotCpu,cleanup:capture.cleanup},recovery};
fs.mkdirSync('docs/evidence/performance-followup',{recursive:true});fs.writeFileSync('docs/evidence/performance-followup/results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(summary.map(({name,status,elapsedMs,overloadsAtEnd,overloadsIncludingRematch,simulatedMs,absoluteEndSimulationMs,rematchCleanup})=>({name,status,elapsedMs,overloadsAtEnd,overloadsIncludingRematch,simulatedMs,absoluteEndSimulationMs,rematchCleanup})),null,2));
