// Private IPC diagnostic. No imports from production server/client entrypoints.
import {Session} from 'node:inspector';
import {getHeapSpaceStatistics} from 'node:v8';
let session;
const post=(method,params={})=>new Promise((resolve,reject)=>session.post(method,params,(error,value)=>error?reject(error):resolve(value)));
export async function recovery356Profile(type){
 if(process.env.RECOVERY356_PROFILE!=='1')throw Error('DIAGNOSTIC_ONLY');
 if(type==='diagnostic-356-start'){
  if(session)throw Error('PROFILE_ALREADY_ACTIVE');session=new Session();session.connect();
  await post('Profiler.enable');await post('Profiler.setSamplingInterval',{interval:1000});
  await post('HeapProfiler.enable');await post('HeapProfiler.startSampling',{samplingInterval:524288});
  await post('Profiler.start');return {memory:process.memoryUsage(),heapSpaces:getHeapSpaceStatistics()};
 }
 if(type==='diagnostic-356-stop'){
  if(!session)throw Error('PROFILE_NOT_ACTIVE');
  try{
   const {profile}=await post('Profiler.stop'),{profile:heap}=await post('HeapProfiler.stopSampling');
   const nodes=new Map(profile.nodes.map(n=>[n.id,n])),cost=new Map();
   for(let i=0;i<(profile.samples?.length||0);i++){
    const frame=nodes.get(profile.samples[i])?.callFrame;if(!frame)continue;
    const key=[frame.functionName,frame.url?.split(/[\\/]/).slice(-4).join('/'),frame.lineNumber].join('|');
    cost.set(key,(cost.get(key)||0)+(profile.timeDeltas?.[i]||0));
   }
   const allocations=new Map();
   function visit(node){const f=node.callFrame,key=[f.functionName,f.url?.split(/[\\/]/).slice(-4).join('/'),f.lineNumber].join('|');allocations.set(key,(allocations.get(key)||0)+node.selfSize);for(const child of node.children)visit(child);}
   visit(heap.head);
   return {memory:process.memoryUsage(),heapSpaces:getHeapSpaceStatistics(),profileDurationUs:profile.endTime-profile.startTime,
    cpuSamples:profile.samples?.length||0,cpuTop:[...cost].sort((a,b)=>b[1]-a[1]).slice(0,35),allocationTop:[...allocations].filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,25),
    definition:'1ms statistical CPU samples; 512KiB retained-allocation sampling; same instrumentation in A/B/C; not precise allocation totals'};
  }finally{session.disconnect();session=null;}
 }
 throw Error('UNKNOWN_DIAGNOSTIC_PROFILE');
}
