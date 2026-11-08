import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import YAML from 'yaml';
import {checkResume,warningRequested,validatePublicSmoke,initialRelease,initialCandidateRun,resumeControls} from '../../tools/deploy/resume-warning.mjs';
import {requiredControls} from '../../tools/deploy/validation.mjs';
import {sent,browserInput,diagnostic,record,authority} from '../../tools/deploy/lifecycle-diagnostics.mjs';
const all=()=>Object.fromEntries(requiredControls.map(n=>[n,true]));
const timeout=check=>Object.assign(Error('timeout'),{code:'AUTHORITATIVE_STATE_TIMEOUT',check,stage:'ready'});
test('warning is explicit and bound to this exact initial candidate and public target',()=>{
 const o={requested:true,releaseId:initialRelease,candidateRunId:initialCandidateRun,target:'production',url:'https://yeomt.github.io/DSbettleroyale/'};
 assert.equal(warningRequested(o),true);assert.equal(warningRequested({...o,requested:false}),false);
 for(const p of [{releaseId:'a'.repeat(40)},{candidateRunId:'1'},{target:'staging'},{url:'https://elsewhere.example/'}])assert.throws(()=>warningRequested({...o,...p}));
});
test('only resumed control timeouts continue to mandatory results/rematch, without false PASS',async()=>{
 for(const failedCheck of resumeControls){
  const controls=all(),warnings=[];for(const n of resumeControls)delete controls[n];delete controls.results;delete controls.rematch;
  await checkResume({attempt:async()=>{throw timeout(failedCheck);},allowed:true,controls,warnings,diagnostics:async()=>[]});
  const report={status:'DEGRADED_RELEASE',buildId:initialRelease,controls,warnings};
  assert.throws(()=>validatePublicSmoke(report,{releaseId:initialRelease,allowed:true}),/REQUIRED_PUBLIC_CONTROL_FAILED/);
  controls.results=true;controls.rematch=true;assert.equal(controls[failedCheck],'WARNING');
  assert.equal(validatePublicSmoke(report,{releaseId:initialRelease,allowed:true}),'DEGRADED_RELEASE');
  assert.throws(()=>validatePublicSmoke(report,{releaseId:initialRelease,allowed:false}));
  for(const name of requiredControls.filter(n=>!resumeControls.includes(n)))assert.throws(()=>validatePublicSmoke({...report,controls:{...controls,[name]:false}},{releaseId:initialRelease,allowed:true}));
 }
});
test('normal mode, reconnect, identity, browser, overload and unrelated errors stay blocking',async()=>{
 for(const [allowed,error]of [[false,timeout('resumeMove')],[true,timeout('resume')],[true,timeout('move')],[true,Error('VERSION_MISMATCH')],[true,Error('OVERLOAD')],[true,Object.assign(Error('identity'),{code:'ERR_ASSERTION'})],[true,Error('TimeoutError')]]){
  const warnings=[];await assert.rejects(checkResume({attempt:async()=>{throw error;},allowed,controls:{},warnings,diagnostics:async()=>[]}),e=>e===error);assert.deepEqual(warnings,[]);
 }
 const report={status:'PASS',buildId:initialRelease,controls:all(),warnings:[]};assert.equal(validatePublicSmoke(report,{releaseId:initialRelease}),'PASS');
 assert.throws(()=>validatePublicSmoke({...report,controls:{...report.controls,resumeMove:'WARNING'}},{releaseId:initialRelease,allowed:true}));
});
test('bounded diagnostics exclude credentials, names, IDs and arbitrary page text',()=>{
 const secret='DO-NOT-RECORD';const s={started:Date.now(),trace:[],self:{id:secret,name:secret,x:1,y:2,alive:true,actions:{attack:3,skill:4,token:secret}},full:1,epoch:2,inputEpoch:0,inputBatches:0};
 sent(s,{type:'AUTH',payload:{secret}});sent(s,{type:'RESUME',payload:{token:secret}});
 sent(s,{type:'INPUT_BATCH',connectionEpoch:2,token:secret,payload:{commands:[{seq:4,clientTick:8,move:{x:1,y:0,token:secret},aim:{x:0,y:1},secret}]}});
 browserInput(s,{type:'keydown',key:secret,target:secret,token:secret});
 for(let n=0;n<200;n++)record(s,'authority',authority(s,'SNAPSHOT'));
 const out=diagnostic([s]);assert.equal(s.trace.length,120);assert.equal(s.inputBatches,1);assert.equal(s.inputEpoch,2);assert.equal(out[0].self.actions.attack,3);assert.doesNotMatch(JSON.stringify(out),new RegExp(secret));assert.equal(out[0].role,'teacher');
});
test('isolated verification remains strict and public diagnostics survive failed jobs',()=>{
 const w=YAML.parse(fs.readFileSync('.github/workflows/promote.yml','utf8'));
 assert.equal(w.on.workflow_dispatch.inputs.initial_resume_warning.default,false);
 assert.equal(w.jobs.isolated.env.INITIAL_RESUME_WARNING,undefined);
 assert.ok(w.jobs.deploy.steps.some(s=>s.if==='always()'&&s.with?.path?.includes('artifacts/public-smoke.json')));
 assert.doesNotMatch(fs.readFileSync('tools/deploy/isolated.mjs','utf8'),/allowResumeWarning/);
 const recovery=YAML.parse(fs.readFileSync('.github/workflows/recover.yml','utf8'));
 assert.match(recovery.jobs.recover.env.CONTROLLER_SHA,/github.sha/);
 assert.ok(recovery.jobs.recover.steps.some(s=>s.run==='node .release-controller/tools/deploy/remote.mjs upload-controller'));
 assert.ok(recovery.jobs.recover.steps.some(s=>s.run==='node .release-controller/tools/deploy/remote.mjs restore'));
});
