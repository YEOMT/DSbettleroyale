// Bounded, predeclared A B C C B A diagnostic; no retry or best-result selection.
// A=v35.5, B=exact submitted v35.6, C=same B engine/content with A's body renderer.
// C is a disposable counterfactual, never a release candidate or acceptance PASS.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=path.resolve('artifacts/v35-6/diagnostic');fs.mkdirSync(out,{recursive:true});
const baseSha='e328aad252e243428123e3d576ea8ffefcdb8604',headSha='5a0fccbe67378a7aae15800fe68c7a68df64a6af';
const players=Number(process.env.POLISH_PLAYERS||20),rounds=players===20?5:1,quality=players===20?'balanced':'high';assert.ok([20,30].includes(players));
const order=process.env.DIAGNOSTIC_ORDER||'ABCCBA';assert.ok(['ABCCBA','ABC','CBA'].includes(order));
const report={baseSha,headSha,players,rounds,quality,order:[...order],runs:[],
 definition:'Same machine, three live browser surfaces, same full participant/quality/rule/traffic scenario. Sequential fresh server+browser processes. C isolates only body rendering; no release weakening. CPU/RSS belong to server process; browser body/draw/heap separate. Profiling is identical across variants. No retry.'};
const checkpoint=()=>fs.writeFileSync(path.join(out,`diagnostic-${players}-${order}.json`),JSON.stringify(report,null,2));
const instrumentation=['tests/combat/recovery356-live.mjs','tests/combat/recovery357-probe.mjs','tests/combat/recovery356-profiler.mjs','tests/combat/recovery356-browser-meter.mjs','tools/load/server.mjs'];
function node(cwd,args,env,log){const start=performance.now();const r=spawnSync(process.execPath,args,{cwd,env:{...process.env,...env},windowsHide:true,encoding:'utf8',maxBuffer:20e6,timeout:600000});fs.writeFileSync(path.join(out,log),(r.stdout||'')+'\n'+(r.stderr||''));return {ms:performance.now()-start,exit:r.status,status:r.error?.code==='ETIMEDOUT'?'TIMEOUT':r.error?'INFRA_FAILURE':r.status===0?'PASS':'FAIL'};}
function extract(label,sha){
 const dir=path.join(out,'source-'+label),marker=dir+'/.source-sha';
 if(fs.existsSync(marker))assert.equal(fs.readFileSync(marker,'utf8'),sha);
 else{fs.mkdirSync(dir,{recursive:true});const tar=path.join(out,label+'.tar');execFileSync('git',['-c','safe.directory='+root,'archive','--format=tar','--output='+tar,sha]);execFileSync('tar',['-xf',tar,'-C',dir]);fs.writeFileSync(marker,sha);}
 for(const file of instrumentation)fs.copyFileSync(path.join(root,file),path.join(dir,file));return dir;
}
function digest(dir,folders){const hash=createHash('sha256');function walk(relative){for(const entry of fs.readdirSync(path.join(dir,relative)).sort()){const name=relative+'/'+entry,full=path.join(dir,name);if(fs.statSync(full).isDirectory())walk(name);else{hash.update(name);hash.update(fs.readFileSync(full,'utf8').replaceAll('\r\n','\n'));}}}for(const folder of folders)walk(folder);return hash.digest('hex');}
try{
 const dirs={A:extract('A',baseSha),B:extract('B',headSha),C:extract('C',headSha)};
 for(const file of ['apps/client/src/render/renderer.js','apps/client/src/render/attack-pose.js'])fs.copyFileSync(path.join(dirs.A,file),path.join(dirs.C,file));
 report.authorityHashes=Object.fromEntries(Object.entries(dirs).map(([label,dir])=>[label,digest(dir,['apps/server','packages'])]));
 assert.equal(report.authorityHashes.B,report.authorityHashes.C,'counterfactual may only change the client body renderer');
 report.builds=[];for(const label of ['A','B','C']){const r=node(dirs[label],['tools/build.mjs'],{},`${players}-${label}-build.log`);report.builds.push({label,...r});assert.equal(r.status,'PASS');}
 for(const [index,label]of report.order.entries()){
  const tag=`diag-${players}-${index}-${label}`;
  report.active={index,label,status:'RUNNING'};checkpoint();
  const result=node(dirs[label],['--expose-gc','tests/combat/recovery356-live.mjs',tag,'pixi',quality],{
   CLASSROOM_BUNDLE:'1',LOAD_BUILT:'1',RECOVERY356_PROFILE:'1',LOAD_MEMORY_DIAGNOSTIC:'1',POLISH_PLAYERS:String(players),POLISH_ROUNDS:String(rounds)
  },tag+'.log');
  const source=path.join(dirs[label],`artifacts/v35-6/live-${tag}-pixi-${quality}-solo-${players}-prepared-r${rounds}/report.json`);
  const row={index,label,...result};
  if(fs.existsSync(source)){
   const live=JSON.parse(fs.readFileSync(source,'utf8'));row.functionStatus=live.status;row.report=tag+'.json';
   fs.copyFileSync(source,path.join(out,row.report));
   row.windows=live.rows?.flatMap(r=>r.stages.map(s=>({round:r.round,mode:r.mode,alive:s.alive,
    cpuMsPerSecond:s.server.cpuMs.total*1000/s.server.windowMs,rssMiB:s.server.memory.rss/1048576,heapMiB:s.server.memory.heapUsed/1048576,
    steps:s.server.step.count,snapshots:s.server.snapshot.count,stepP95:s.server.step.p95,snapshotP95:s.server.snapshot.p95,
    bytesPerSecond:s.server.transport.bytes*1000/s.server.windowMs,gc:s.server.gc,machine:s.server.machine,
    replayBytes:s.server.ownership.replayJsonBytes,objects:s.server.objects,
    screens:s.screens.map(x=>({draw:x.draw,gap:x.gap,heap:x.heap,resources:x.resources})),profile:s.profile})));
   row.postRematchBeforeGC=live.postRematchBeforeGC;row.postRematchAfterGC=live.postRematchAfterGC;row.error=live.error;
  }
  report.runs.push(row);report.active=null;checkpoint();console.log(JSON.stringify({players,index,label,status:row.functionStatus||row.status,ms:row.ms}));
  // Preserve failures; continue only the predeclared other samples, never replace them.
 }
 report.functionStatus=report.runs.every(r=>r.status==='PASS'&&r.functionStatus==='PASS')?'PASS':'PARTIAL';
 if(report.functionStatus!=='PASS')process.exitCode=1;
}catch(error){report.error=error.stack;report.functionStatus='INFRA_FAILURE';process.exitCode=1;}
finally{checkpoint();console.log(JSON.stringify({functionStatus:report.functionStatus,players,runs:report.runs.length}));}
