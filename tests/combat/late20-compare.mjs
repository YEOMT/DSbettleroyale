// Optional late-population gap only. Four short cases, no general/long matrix.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {execFileSync,spawnSync}from'node:child_process';
fs.mkdirSync('artifacts',{recursive:true});
const root=process.cwd(),reuse=process.env.LATE_SOURCE_ROOT,scratch=reuse?path.resolve(reuse):fs.mkdtempSync(path.resolve('artifacts','late20-sources-')),started=performance.now();
if(reuse&&(path.dirname(fs.realpathSync(scratch))!==fs.realpathSync('artifacts')||!path.basename(scratch).startsWith('late20-sources-')))throw Error('INVALID_LOCAL_EXPORT_PATH');
const versions=[{label:'v351',sha:'d6b4525bf22bfa000a09eb686dffc5736bc5a3b3'},{label:'v352',sha:'7b723ae2a31e9eb5687dc9bdbe6cea2af0ec959d'}];
const report={startedAt:new Date().toISOString(),scope:'short late-population fixture, server+testdriver+two browser surfaces share one physicalPC; not isolatedserver or hardwaremobileperformance',machine:{platform:process.platform,arch:process.arch,node:process.version,cpu:os.cpus()[0]?.model,logicalCpus:os.availableParallelism(),ram:os.totalmem()},versions:[]};
const out='artifacts/v35-2/late20-comparison.json';fs.mkdirSync(path.dirname(out),{recursive:true});
const write=()=>fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
const run=(cwd,args,env,timeout)=>{const at=performance.now(),p=spawnSync(process.execPath,args,{cwd,env:{...process.env,...env},stdio:'inherit',timeout,windowsHide:true});return{status:p.error?.code==='ETIMEDOUT'?'TIMEOUT':p.error?'INFRA_FAILURE':p.status===0?'PASS':'FAIL',elapsedMs:performance.now()-at,exitCode:p.status,error:p.error?.message};};
try{
 for(const v of versions){
  const dir=path.join(scratch,v.label);if(!reuse){fs.mkdirSync(dir);execFileSync('git',['archive','--format=tar','--output='+dir+'.tar',v.sha]);execFileSync('tar',['-xf',dir+'.tar','-C',dir]);}
  for(const file of ['tests/combat/live-late.mjs','tests/combat/bundled-harness.mjs','tests/fidelity-v33-2/harness.mjs','tests/integration/client.mjs'])fs.copyFileSync(path.join(root,file),path.join(dir,file));
  const env={BUILD_ID:v.sha,CLASSROOM_BUNDLE:'1',LOAD_BUILT:'1',LATE_PLAYERS:'20'};
  if(reuse&&JSON.parse(fs.readFileSync(path.join(dir,'dist/release.json'))).buildId!==v.sha)throw Error('REUSED_BUILD_ID_MISMATCH');
  const row={...v,build:reuse?{status:'PASS',reusedVerifiedBuild:true}:run(dir,['tools/build.mjs'],env,90000),cases:[]};report.versions.push(row);write();
  if(row.build.status!=='PASS'){process.exitCode=1;continue;}
  for(const renderer of ['canvas','pixi']){
   const args=[];
   args.push('tests/combat/live-late.mjs',v.label);
   const result=run(dir,args,{...env,LATE_RENDERER:renderer},120000),file=path.join(dir,'artifacts/combat/late20-'+v.label+'-'+renderer+'.json');
   const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;row.cases.push({renderer,...result,data});write();if(result.status!=='PASS')process.exitCode=1;
  }
 }
}finally{report.elapsedMs=performance.now()-started;report.endedAt=new Date().toISOString();write();}
