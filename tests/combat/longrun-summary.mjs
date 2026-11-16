// Sanitized aggregate evidence; the fixture's private report stays untracked.
export function summarizeLongRun(r){
 const window=s=>({memory:s.memory,ledgerBytes:s.eventLedgerBytes,phase:s.phase,connected:s.connected,
  paused:s.paused,overloads:s.overloads,inputApply:s.inputApply,
  window:s.window});
 return {players:r.players,seconds:r.seconds,rounds:r.rounds,elapsedMs:r.elapsedMs,totalMs:r.totalMs,
  fixtureHash:r.fixtureHash,fixture:r.fixture,pass:r.pass,failure:r.failure?.split('\n')[0],
  errors:r.errors.length,expectedStale:r.expectedStale??null,receivedBytes:r.receivedBytes,snapshots:r.snapshots,ack:r.ack,rtt:r.rtt,
  samples:r.samples.map(s=>({elapsedMs:s.elapsedMs,round:s.round,pendingCommands:s.pendingCommands,...window(s.server)})),
  idle:(r.idle||[]).map(window),cleanup:r.cleanup,
  rematches:(r.rematchCleanup||[]).map(w=>({objects:w.objects,roster10:w.roster10,queueBytes:w.queueBytes,bufferBytes:w.bufferBytes,memory:w.memory})),
  final:r.server?window(r.server):null,
  percentileScope:'Server totals use latest 4096 observations; each telemetry window has its own scope. Windows are not averaged into whole-run percentiles.'};
}
