// Explicit three-version performance comparison. Each version runs the same
// test instrumentation, lockfile dependencies, browser and sequential workload.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const root=process.cwd(), artifacts=path.join(root,'artifacts');
// The Actions container and checkout have different OS owners. Trust only
// this resolved workspace for these Git commands, without a global setting.
const gitArgs=['-c','safe.directory='+fs.realpathSync(root)];
fs.mkdirSync(artifacts,{recursive:true});
const scratch=fs.mkdtempSync(path.join(artifacts,'comparison-sources-'));
// The existing opt-in Evolution workflow can select the classroom stability suite.
const family=process.argv[2],mode=process.argv[3],backend=process.argv[4];
const prBody=process.env.GITHUB_EVENT_NAME==='pull_request' && process.env.GITHUB_EVENT_PATH
 ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH)).pull_request?.body : '';
const stability=family==='v35.1'||(family==='v35'&&prBody?.includes('[classroom-smoothness]'));
const evolution=stability||family==='v35';
const stress=evolution&&['scissors','load30'].includes(mode);
if(evolution&&!stress&&(!['solo','team-capture'].includes(mode)||!['canvas','pixi'].includes(backend)))throw Error('INVALID_COMPARISON_CASE');
const evidence=path.join(artifacts,evolution?'v35-comparison':'v34-comparison');
fs.mkdirSync(evidence,{recursive:true});
const head=execFileSync('git',[...gitArgs,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const v34='9a29a23a8eb62095308501109e8e15c610379959';
const v35='f3549883674a2c456fdc1fd7e3fb18dc8c46cce3';
const versions=stability?[{label:'v34',sha:v34},{label:'v35',sha:v35},{label:'v35.1',sha:head}]:evolution?[{label:'v34',sha:'9a29a23a8eb62095308501109e8e15c610379959'},{label:'v35',sha:head}]:[
 {label:'790fb11',sha:'790fb11a0618d6c706d1aee044379939940415af'},
 {label:'d28b2d8',sha:'d28b2d81692876cc353b75e85350c442b7948398'},
 {label:'v34',sha:head}
];
// Reverse half of the browser cases so the candidate is not always measured
// after both baselines. Each individual comparison stays on one runner.
if(stability && !stress && ((mode==='solo')===(backend==='pixi')))versions.reverse();
function checkout(version){
 const exists=spawnSync('git',[...gitArgs,'cat-file','-e',version.sha+'^{commit}'],{stdio:'ignore'}).status===0;
 if(!exists)execFileSync('git',[...gitArgs,'fetch','--no-tags','--depth=1','origin',version.sha],{stdio:'inherit'});
 assert.equal(execFileSync('git',[...gitArgs,'rev-parse',version.sha+'^{commit}'],{encoding:'utf8'}).trim(),version.sha);
 const dir=path.join(scratch,version.label),archive=dir+'.tar';
 fs.mkdirSync(dir);
 execFileSync('git',[...gitArgs,'archive','--format=tar','-o',archive,version.sha]);
 execFileSync('tar',['-xf',archive,'-C',dir]);
 for(const file of ['classroom-rematch.mjs','classroom-authority.mjs','classroom-meter.mjs']){
  fs.copyFileSync(path.join(root,'tests/combat',file),path.join(dir,'tests/combat',file));
 }
 if(stability)for(const file of ['tools/load/run.mjs','tools/load/server.mjs'])fs.copyFileSync(path.join(root,file),path.join(dir,file));
 return dir;
}
const n=value=>Math.round(value*100)/100;
function summarize(run){
 const rows=run.rows.filter(row=>row.round),last=rows.at(-1),meter=run.measurement;
 if(!last||!meter)return {rows:rows.length,error:run.rows.at(-1)?.error};
 return {rounds:rows.length,wallSeconds:n(run.ms/1000),cpuMs:(last.serverCpu.user+last.serverCpu.system)/1000,
  stepP95Ms:n(last.step.p95),snapshotP95Ms:n(last.snapshot.p95),inputApplyP95Ms:n(last.inputApply.p95),
  snapshotHz:n(1000/last.snapshotGap.mean),snapshotGapP95Ms:n(last.snapshotGap.p95),wireKiBps:n(last.sentBytes*1000/last.uptimeMs/1024),
  snapshotBytesMean:n(meter.snapshots.mean),snapshotBytesP95:meter.snapshots.p95,wireBytes:last.sentBytes,
  roundEndRssMiB:rows.map(row=>n(row.serverMemory.rss/2**20)),roundEndHeapMiB:rows.map(row=>n(row.serverMemory.heapUsed/2**20)),
  rssMeanMiB:n(meter.resident.mean/2**20),peakRssMiB:n(meter.peakRssBytes/2**20),
  estimatedHeapAllocationMiB:n(meter.estimatedHeapAllocationBytes/2**20),gcMs:n(meter.gcMs),gcCount:meter.gcCount,
  geometry:meter.costs,frameGapP95Ms:last.screens.map(s=>n(s.gap.p95)),drawP95Ms:last.screens.map(s=>n(s.draw.p95)),
  arenas:rows.filter(r=>r.arena).map(r=>r.arena),screensByRound:rows.map(r=>r.screens.map(s=>({gap:s.gap,draw:s.draw,raf:s.raf,lagTicks:s.lagTicks,timeline:s.timeline,resources:s.resources}))),
  participants:last.connected,overloads:last.overloads,unsentAtSampling:last.screens.map(s=>s.unsentInputs),
  unsentAfterRematch:rows.map(r=>r.lobby?.reduce((sum,s)=>sum+s.unsentInputs,0)??null),
  errors:run.errors,...(run.rows.at(-1)?.error?{failedAssertion:run.rows.at(-1).error}:{})};
}
function classroomCase(cwd,env,label,timeout=240000){
 const file=path.join(cwd,'artifacts/classroom',label+'-rematch.json');
 const child=spawnSync(process.execPath,['tests/combat/classroom-rematch.mjs',label],{cwd,env:{...process.env,...env},stdio:'inherit',timeout});
 const report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
 const status=child.error?.code==='ETIMEDOUT'?'TIMEOUT':child.error?'INFRA_FAILURE':child.status===0?'PASS':'FAIL';
 if(status!=='PASS')process.exitCode=1;
 return {status,failure:status==='PASS'?undefined:child.error?.code||'SCENARIO_FAILED',...(report?summarize(report):{})};
}
const results=[], machine={platform:process.platform,architecture:process.arch,node:process.version,
 logicalCpus:os.availableParallelism(),totalMemoryBytes:os.totalmem()};
try {
 for(const version of versions){
  const cwd=checkout(version);
  if(stress){
   const scissors=mode==='scissors',file=scissors?'artifacts/v34/roster-pixi/result.json':'artifacts/load-30-40.json';
   const args=scissors?['tests/combat/v34-roster.mjs','pixi']:['tools/load/run.mjs','--players=30','--seconds=40'];
   const run=spawnSync(process.execPath,args,{cwd,stdio:'inherit',env:{...process.env,...(stability?{CLASSROOM_FIXED_SEED:'1'}:{})},timeout:240000});
   const status=run.error?.code==='ETIMEDOUT'?'TIMEOUT':run.error?'INFRA_FAILURE':run.status===0?'PASS':'FAIL';
   if(status!=='PASS')process.exitCode=1;
   const report=fs.existsSync(path.join(cwd,file))?JSON.parse(fs.readFileSync(path.join(cwd,file))):{};
   const cpu=report.server?.window?.cpuUsageUs;
   const values=scissors?{scissors:report.scissors,host:report.hostCommands?.steps,phase:report.hostCommands?.client?.phase}:
    {players:report.players,snapshots:report.snapshots,bytes:report.receivedBytes,elapsedMs:report.elapsedMs,step:report.server?.stepCpu,snapshot:report.server?.snapshotCpu,
     cpuMs:cpu?(cpu.user+cpu.system)/1000:undefined,inputApply:report.server?.inputApply,ackP95Ms:report.ack?.p95,
     wireKiBps:report.elapsedMs?n(report.receivedBytes*1000/report.elapsedMs/1024):undefined,rss:report.samples?.map(s=>s.server?.memory?.rss).filter(Number.isFinite),errors:report.errors,overloads:report.server?.overloads,cleanup:report.cleanup};
   results.push({...version,mode,machine,status,...values,failure:report.failure||report.error||run.error?.message});
   fs.writeFileSync(path.join(evidence,'comparison.json'),JSON.stringify(results,null,2)+'\n');
   continue;
  }
  for(const scenario of (evolution?[mode]:['solo','team-capture'])){
   const label='compare-'+version.label+'-'+scenario;
   const options={CLASSROOM_UPGRADE:'1',CLASSROOM_METER:'1',CLASSROOM_MODE:scenario,
    CLASSROOM_SMOOTH_STATS:stability?'1':'0',CLASSROOM_EXPECT_ARENA:stability&&version.label==='v35.1'?'1':'0',
    ...(evolution?{EVOLUTION_RENDERER:backend}:{})};
   const result=classroomCase(cwd,options,label,evolution?240000:135000);
   results.push({...version,mode:scenario,renderer:evolution?backend:'canvas',machine,...result});
   fs.writeFileSync(path.join(evidence,'comparison.json'),JSON.stringify(results,null,2)+'\n');
   console.log(JSON.stringify(results.at(-1)));
  }
 }
 if(stability && mode==='load30') {
  const {runLoad}=await import('../../tools/load/run.mjs');
  const {summarizeLong}=await import('./smoothness-long.mjs');
  process.env.CLASSROOM_FIXED_SEED='1';
  const long=await runLoad({players:30,seconds:600,rematchSeconds:300,out:'artifacts/smoothness-long-local.json'});
  fs.writeFileSync(path.join(evidence,'long-30.json'),JSON.stringify(summarizeLong(long),null,2));
  assert.ok(long.pass,'30-player 600-second socket test');
 }
 if(stability && !stress && backend==='canvas'){
  execFileSync(process.execPath,['--expose-gc','tests/combat/smooth-server.mjs',
   path.join(scratch,'v34'),path.join(scratch,'v35'),path.join(scratch,'v35.1'),
   path.join(evidence,'server-'+mode+'.json'),mode],{cwd:root,stdio:'inherit',timeout:120000});
 }
 if(stability && mode==='solo' && backend==='canvas'){
  const extra=[];
  for(let map=1;map<5;map++){
   const result=classroomCase(path.join(scratch,'v35.1'),{CLASSROOM_UPGRADE:'1',CLASSROOM_METER:'1',CLASSROOM_MODE:'solo',CLASSROOM_MAP:String(map),CLASSROOM_SMOOTH_STATS:'1',CLASSROOM_EXPECT_ARENA:'1',EVOLUTION_RENDERER:'canvas'},'solo-map-'+map);
   extra.push({map,...result});fs.writeFileSync(path.join(evidence,'solo-maps.json'),JSON.stringify(extra,null,2));
  }
 }
 if(stress&&mode==='load30')execFileSync(process.execPath,['--expose-gc','tests/combat/classroom-server-crossover.mjs',path.join(scratch,'v34'),'v35'],{cwd:root,stdio:'inherit',timeout:120000});
} finally {
 // Remove only the immutable source exports created by this process.
 if(path.dirname(fs.realpathSync(scratch))===fs.realpathSync(artifacts) && path.basename(scratch).startsWith('comparison-sources-'))
  fs.rmSync(scratch,{recursive:true,force:true});
}
