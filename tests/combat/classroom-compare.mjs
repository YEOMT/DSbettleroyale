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
const evidence=path.join(artifacts,'v34-comparison');
fs.mkdirSync(evidence,{recursive:true});
const versions=[
 {label:'790fb11',sha:'790fb11a0618d6c706d1aee044379939940415af'},
 {label:'d28b2d8',sha:'d28b2d81692876cc353b75e85350c442b7948398'},
 {label:'v34',sha:execFileSync('git',[...gitArgs,'rev-parse','HEAD'],{encoding:'utf8'}).trim()}
];
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
  participants:last.connected,overloads:last.overloads,unsentAtSampling:last.screens.map(s=>s.unsentInputs),
  unsentAfterRematch:rows.map(r=>r.lobby?.reduce((sum,s)=>sum+s.unsentInputs,0)??null),
  errors:run.errors,...(run.rows.at(-1)?.error?{failedAssertion:run.rows.at(-1).error}:{})};
}
const results=[], machine={platform:process.platform,architecture:process.arch,node:process.version,
 logicalCpus:os.availableParallelism(),totalMemoryBytes:os.totalmem()};
try {
 for(const version of versions){
  const cwd=checkout(version);
  for(const mode of ['solo','team-capture']){
   const label='compare-'+version.label+'-'+mode;
   let status='PASS',failure;
   try{execFileSync(process.execPath,['tests/combat/classroom-rematch.mjs',label],{cwd,stdio:'inherit',
    env:{...process.env,CLASSROOM_UPGRADE:'1',CLASSROOM_METER:'1',CLASSROOM_MODE:mode},timeout:135000});}
   catch(e){
    failure=e.code||'SCENARIO_FAILED';
    status=e.code==='ETIMEDOUT'?'TIMEOUT':e.code?'INFRA_FAILURE':'FAIL';
    process.exitCode=1;
   }
   const file=path.join(cwd,'artifacts/classroom',label+'-rematch.json');
   const result=fs.existsSync(file)?summarize(JSON.parse(fs.readFileSync(file))):{};
   results.push({...version,mode,status,failure,machine,...result});
   fs.writeFileSync(path.join(evidence,'comparison.json'),JSON.stringify(results,null,2)+'\n');
   console.log(JSON.stringify(results.at(-1)));
  }
 }
} finally {
 // Remove only the immutable source exports created by this process.
 if(path.dirname(fs.realpathSync(scratch))===fs.realpathSync(artifacts) && path.basename(scratch).startsWith('comparison-sources-'))
  fs.rmSync(scratch,{recursive:true,force:true});
}
