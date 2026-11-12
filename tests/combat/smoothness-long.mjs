// Only aggregate synthetic load telemetry leaves the runner. The raw load
// report stays in the workspace, outside the uploaded comparison directory.
export function summarizeLong(report){
 const {players,seconds,rounds,elapsedMs,snapshots,receivedBytes,pass,errors,cleanup,ack,rtt,server}=report;
 const samples=report.samples.map(({elapsedMs:atMs,round,server:s,pendingCommands})=>{
  const w=s.window;
  return {atMs,round,rss:s.memory.rss,heap:s.memory.heapUsed,objects:w.objects,
   buffered:w.bufferBytes,queued:w.queueBytes,pendingSnapshots:w.pendingSnapshots,pendingCommands,
   replaced:s.replacedSnapshots,cpuMs:w.cpuMs.total,gc:w.gc,loop:w.eventLoop,
   step:w.step,snapshot:w.snapshot,send:w.send,pump:w.pump,debt:w.debt};
 });
 return {players,seconds,rounds,elapsedMs,snapshots,receivedBytes,pass,
  errors:errors.length,failure:report.failure?.split('\n')[0],cleanup,ack,rtt,
  overloads:server.overloads,inputApply:server.inputApply,step:server.stepCpu,snapshot:server.snapshotCpu,
  replacedSnapshots:server.replacedSnapshots,rematches:(report.rematchCleanup||[]).map(w=>({objects:w.objects,buffered:w.bufferBytes,queued:w.queueBytes})),samples};
}
