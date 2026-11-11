// Private IPC fixture instrumentation. Sample on the same schedule in each
// checkout; the production server never imports this module.
import {GCProfiler} from 'node:v8';
import {Samples} from '../../apps/server/src/diagnostics/metrics.js';

export function classroomMeter(app) {
 const gc = new GCProfiler(), snapshots = new Samples(), resident = new Samples();
 const startHeap = process.memoryUsage().heapUsed, observed = new WeakSet();
 const costs = {grids:0, gridBuckets:0, unchangedClampCopies:0, clamps:0};
 gc.start();
 const interval = setInterval(()=>resident.add(process.memoryUsage.rss()),250);
 interval.unref();
 function attach(world) {
  for (const peer of app.peers) {
   if (observed.has(peer)) continue;
   observed.add(peer);
   const snapshot = peer.snapshot.bind(peer);
   peer.snapshot = (data,...args)=>{snapshots.add(data.length);return snapshot(data,...args);};
  }
  if (!world || observed.has(world)) return;
  observed.add(world);
  const cache = world.combatWallGridCache, set = cache.set.bind(cache);
  cache.set = (key,value)=>{costs.grids++;costs.gridBuckets+=value.grid.size;return set(key,value);};
  const clamp = world.brArenaClamp;
  world.brArenaClamp = (g,pos,r)=>{
   const out=clamp(g,pos,r);costs.clamps++;
   if(out!==pos && out.x===pos.x && out.y===pos.y)costs.unchangedClampCopies++;
   return out;
  };
 }
 function finish() {
  clearInterval(interval);
  const endHeap=process.memoryUsage().heapUsed, records=gc.stop().statistics;
  let reclaimed=0, gcMicros=0;
  for(const record of records){
   reclaimed+=record.beforeGC.heapStatistics.usedHeapSize-record.afterGC.heapStatistics.usedHeapSize;
   gcMicros+=record.cost;
  }
  return {snapshots:snapshots.report(),resident:resident.report(),peakRssBytes:process.resourceUsage().maxRSS*1024,
   gcCount:records.length,gcMs:gcMicros/1000,estimatedHeapAllocationBytes:endHeap-startHeap+reclaimed,costs};
 }
 return {attach,finish};
}
