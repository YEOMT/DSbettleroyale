// Two pinned versions, identical test observers, real production server builds.
// Long-run reports never upload tokens, room codes, raw snapshots or heap dumps.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {summarizeLongRun} from './longrun-summary.mjs';
const root=process.cwd(),git=['-c','safe.directory='+fs.realpathSync(root)];
const [mode='solo',backend='canvas']=process.argv.slice(2);
const controls=process.env.CONTROLS_COMPARE==='1';
if(controls&&!['solo','team-capture','rematch','controls'].includes(mode))throw Error('CONTROLS_COMPARISON_IS_SHORT_ONLY');
const base=controls?'5cba0f9bd6eba793d91fa16efd833a582456ee09':'d6b4525bf22bfa000a09eb686dffc5736bc5a3b3';
const head=execFileSync('git',[...git,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const versions=controls?[{label:'v35.2',sha:base},{label:'v35.3',sha:head}]:mode==='load30-extended'?[{label:'v35.2',sha:head}]:[{label:'v35.1',sha:base},{label:'v35.2',sha:head}];
if(mode==='solo'&&backend==='pixi'||mode==='team-capture'&&backend==='canvas')versions.reverse();
const output=path.resolve(controls?'artifacts/v35-3-comparison':'artifacts/v35-2-comparison',mode+'-'+backend);fs.mkdirSync(output,{recursive:true});
const scratch=fs.mkdtempSync(path.resolve('artifacts','longrun-sources-'));
const rows=[],machine={platform:process.platform,arch:process.arch,node:process.version,logicalCpus:os.availableParallelism(),ram:os.totalmem(),sharedMachine:true};
function run(cwd,args,env,timeout=300000){
 const start=performance.now(),r=spawnSync(process.execPath,args,{cwd,env:{...process.env,...env},stdio:'inherit',timeout,windowsHide:true});
 const status=r.error?.code==='ETIMEDOUT'?'TIMEOUT':r.error?'INFRA_FAILURE':r.status===0?'PASS':'FAIL';
 return {status,ms:performance.now()-start,error:r.error?.message,exit:r.status};
}
function save(){fs.writeFileSync(path.join(output,'comparison.json'),JSON.stringify({machine,mode,backend,rows},null,2)+'\n');}
try {
 for(const version of versions){
  const cwd=path.join(scratch,version.label);fs.mkdirSync(cwd);
  execFileSync('git',[...git,'archive','--format=tar','-o',cwd+'.tar',version.sha]);execFileSync('tar',['-xf',cwd+'.tar','-C',cwd]);
  // Test code only: the measured app/engine/content always comes from its SHA.
  for(const dir of ['tests/combat','tools/load'])fs.cpSync(path.join(root,dir),path.join(cwd,dir),{recursive:true});
  for(const f of ['tests/fidelity-v33-2/harness.mjs','tests/integration/client.mjs'])fs.copyFileSync(path.join(root,f),path.join(cwd,f));
  const env={BUILD_ID:version.sha,CLASSROOM_FIXED_SEED:'1',LOAD_BUILT:'1',CLASSROOM_BUNDLE:'1'};
  const build=run(cwd,['tools/build.mjs'],env);assert.equal(build.status,'PASS','paired deployment build');
  const row={...version,build,results:[]};rows.push(row);save();
  if(controls&&mode==='controls'){
   const result=run(cwd,['tests/combat/controls353.mjs',backend,...(version.label==='v35.2'?['--baseline']:[])],env,120000);
   const dir=path.join(cwd,'artifacts/v35-3',(version.label==='v35.2'?'baseline':'candidate')+'-'+backend);
   if(fs.existsSync(dir))fs.cpSync(dir,path.join(output,version.label),{recursive:true});
   row.results.push(result);
  }else if(mode==='load30'||mode==='load30-extended'){
   for(const diagnostic of (mode==='load30-extended'?[]:version.label==='v35.1'?['0','1']:['1','0'])){
    const file=path.join(cwd,'artifacts/diagnostics-'+diagnostic+'.json');
    const check=run(cwd,['tools/load/run.mjs','--players=30','--seconds=20','--out='+file],{...env,LOAD_DIAGNOSTICS:diagnostic},90000);
    row.results.push({kind:'diagnostic-overhead',enabled:diagnostic==='1',...check,data:fs.existsSync(file)?summarizeLongRun(JSON.parse(fs.readFileSync(file))):null});save();
   }
   const raw=path.join(cwd,'artifacts/long-private.json');
   const result=run(cwd,['tools/load/run.mjs','--players=30','--seconds='+(mode==='load30-extended'?1200:600),'--naturalRematch=true','--idleSeconds=30','--out='+raw],env,mode==='load30-extended'?1290000:690000);
   const data=fs.existsSync(raw)?summarizeLongRun(JSON.parse(fs.readFileSync(raw))):null;
   // A timed socket run alone cannot certify the required natural lifecycle.
   if(result.status==='PASS'&&(!data?.pass||data.rounds<2||data.rematches.length<1)){result.status='FAIL';result.error='NATURAL_RESULTS_REMATCH_NOT_VERIFIED';}
   row.results.push({kind:mode==='load30-extended'?'1200-second':'600-second',...result,data});
  }else if(['solo','team-capture','rematch','solo-host','solo-student'].includes(mode)){
   const label=version.label+'-'+mode;
   const result=run(cwd,['tests/combat/classroom-rematch.mjs',label],{...env,CLASSROOM_UPGRADE:'1',...(controls&&mode!=='rematch'?{CLASSROOM_CONTROLS353:'1'}:{}),CLASSROOM_ROUNDS:mode==='rematch'?'5':'3',CLASSROOM_METER:'1',CLASSROOM_MODE:mode==='rematch'?'team-capture':mode.startsWith('solo-')?'solo':mode,CLASSROOM_ACTIVE_SCREEN:mode==='solo-host'?'host':mode==='solo-student'?'student':'all',CLASSROOM_SMOOTH_STATS:'1',CLASSROOM_EXPECT_ARENA:'1',EVOLUTION_RENDERER:backend},420000);
   const raw=path.join(cwd,'artifacts/classroom',label+'-rematch.json');
   const report=fs.existsSync(raw)?JSON.parse(fs.readFileSync(raw)):null;
   // The private failure record contains participant credentials hashed for
   // identity checks. Keep only aggregate timing/resources and error strings.
   const data=report?{ms:report.ms,measurement:report.measurement,errors:report.errors,
    rounds:report.rows.filter(r=>r.round).map(({peers,actions,lastClose,...r})=>r),
    failure:report.rows.find(r=>r.status==='FAIL')?.error}:null;
   row.results.push({...result,data});
  }else if(mode==='render-cost'){
   for(const role of ['host','student']){
    const label=version.label.replaceAll('.','-');
    const result=run(cwd,['tests/combat/longrun-render-cost.mjs',label,'team-capture',role,'concentrated'],env,180000);
    const dir=path.join(cwd,'artifacts/v35-2/render');
    if(fs.existsSync(dir))fs.cpSync(dir,path.join(output,version.label),{recursive:true});
    row.results.push({role,...result});save();
   }
  }else if(mode==='focused'){
   for(const args of [['tests/combat/v34-roster.mjs','pixi'],['tests/combat/evolution-browser.mjs',backend],['tests/combat/resource-lifetime.mjs','v35-2']]){
    const result=run(cwd,args,{...env,CLASSROOM_BUNDLE:'0',LOAD_BUILT:'0'},300000);row.results.push({command:args.join(' '),...result});
    for(const f of ['artifacts/v34/roster-pixi/result.json','artifacts/v35/screens-'+backend+'/result.json','artifacts/tablet-stability/v35-2-resources.json']){if(fs.existsSync(path.join(cwd,f))){const data=JSON.parse(fs.readFileSync(path.join(cwd,f)));const clean={status:data.status,ms:data.ms,scissors:data.scissors,cases:data.cases,resources:data.resources};fs.writeFileSync(path.join(output,version.label+'-'+f.split('/').at(-2)+'.json'),JSON.stringify(clean,null,2));}}
   }
  }else throw Error('UNRECOGNIZED_CASE');
  if(row.results.some(r=>r.status!=='PASS'))process.exitCode=1;save();
 }
 if(!controls&&['solo','team-capture'].includes(mode)&&backend==='canvas'){
  const result=run(root,['--expose-gc','tests/combat/smooth-server.mjs',path.join(scratch,'v35.1'),path.join(scratch,'v35.2'),path.join(output,'server-stages.json'),mode],{LONGRUN_AB:'1'},120000);
  if(result.status!=='PASS')process.exitCode=1;
  fs.writeFileSync(path.join(output,'server-stage-status.json'),JSON.stringify(result,null,2));
 }
}finally{
 save();
 if(path.dirname(fs.realpathSync(scratch))===fs.realpathSync('artifacts')&&path.basename(scratch).startsWith('longrun-sources-'))fs.rmSync(scratch,{recursive:true,force:true});
}
