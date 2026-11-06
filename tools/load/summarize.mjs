// Publish aggregate synthetic measurements only, never sessions or classroom logs.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir='artifacts/tablet-stability';
const names=process.argv.slice(2);
const summaries=names.map(name=>{
 if(path.basename(name)!==name)throw Error('Expected artifact basename');
 const raw=fs.readFileSync(path.join(dir,name)),r=JSON.parse(raw);
 const base={artifact:name,sha256:createHash('sha256').update(raw).digest('hex')};
 if(Array.isArray(r))return {...base,status:'PASS',kind:'snapshot-subphase',note:'Benchmark execution; exact JSON and privacy are asserted by unit/integration tests, not by a timing threshold.',results:r};
 const pickServer=s=>s&&Object.fromEntries(['stepCpu','snapshotCpu','sendCpu','pumpCpu','snapshotGap','inputApply','debtMs','sentBytes','overloads','replacedSnapshots','bufferHighWatermark','eventLedgerBytes','connected','memory'].filter(k=>s[k]!==undefined).map(k=>[k,s[k]]));
 const pickBrowser=b=>b&&{renderer:b.renderer,heap:b.heap,caches:b.caches,frames:b.frames,shotFrames:b.shotFrames,rtt:b.rtt,errors:b.errors,diagnostics:Object.fromEntries(['frameMs','appRttMs','acceptedTickGapMs','arrivalGapMs','selfCorrectionWorldUnits','holdFrames','viewport','DPR','quality'].map(k=>[k,b.diagnostics[k]]))};
 const selected=new Set(),samples=r.samples||[];
 const elapsed=s=>s.elapsedSeconds??s.elapsedMs/1000;
 for(const target of [5,80,180,360,380,600]){
  const eligible=samples.filter(s=>!s.stage||s.stage.startsWith('continuous'));
  if(eligible.length&&target<=elapsed(eligible.at(-1))+15)selected.add(eligible.reduce((a,b)=>Math.abs(elapsed(a)-target)<Math.abs(elapsed(b)-target)?a:b));
 }
 for(const s of samples)if(/^(lobby|rematch|matrix|continuous-end)/.test(s.stage||''))selected.add(s);
 const windows=[...selected].sort((a,b)=>samples.indexOf(a)-samples.indexOf(b)).map(s=>({seconds:elapsed(s),stage:s.stage,round:s.round,
  server:{overloads:s.server?.overloads,replacedSnapshots:s.server?.replacedSnapshots,window:s.server?.window&&Object.fromEntries(['windowMs','cpuPercent','debtMs','memory','alive','participants','policy','particleBudget','objects','peers','bufferBytes','queueBytes','pendingSnapshots','eventLoop','gc','step','snapshot','gap','transport'].map(k=>[k,s.server.window[k]]))},browser:pickBrowser(s.browser),
  surfaces:s.surfaces&&Object.fromEntries(Object.entries(s.surfaces).map(([role,v])=>[role,{stats:v.stats,heap:v.heap,caches:v.caches,timeline:v.timeline,quality:v.quality,profile:v.profile,resolution:v.resolution,backing:v.backing,antialias:v.antialias,gpuTimerAvailable:v.gpuTimerAvailable,captureAutoBalanced:v.captureAutoBalanced,captureHostFPS:v.captureHostFPS,mutations:v.mutations,textBuilds:v.textBuilds,simTime:v.simTime,rtt:v.net.rtt,pendingCommands:v.net.pending}]))}));
 const overloadWindows=samples.filter(s=>s.server?.window?.overloads?.length).map(s=>({seconds:elapsed(s),cpuPercent:s.server.window.cpuPercent,eventLoop:s.server.window.eventLoop,gc:s.server.window.gc,incidents:s.server.window.overloads}));
 return {...base,status:r.status??(r.pass===true?'PASS':r.pass===false?'FAIL':'MEASURED'),elapsedMs:r.elapsedMs??r.ms,sourceHash:r.server?.sourceHash??samples[0]?.server?.sourceHash,players:r.players,seconds:r.seconds,mode:r.mode,engine:r.engine,fixture:r.fixture,errorCount:r.errors?.length,failure:r.failure?.split('\n')[0],rounds:r.rounds,snapshots:r.snapshots,receivedBytes:r.receivedBytes,server:pickServer(r.server??samples.at(-1)?.server),combatEndServer:pickServer(samples.find(s=>s.stage==='continuous-end')?.server),browser:pickBrowser(r.browser),cleanup:r.cleanup,resources:r.resources,overloadWindows,windows};
});
console.log(JSON.stringify({schema:1,note:'Synthetic local evidence. Physical Samsung Android and AWS were not measured. Initial windows can include lobby/first paint; CPU 100% means one logical core. Raw artifacts are ignored local files.',summaries},null,2));
