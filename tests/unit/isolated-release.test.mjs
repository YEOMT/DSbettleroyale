import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import YAML from 'yaml';
import {validateReceipt,requiredChecks,requiredControls} from '../../tools/deploy/validation.mjs';
function fixture(){
 const sha='a'.repeat(40),tools='b'.repeat(40),repo='owner/repo',fingerprint={buildId:sha,contentHash:'content',engineRevision:'engine',protocolVersion:33};
 const manifest={releaseId:sha,images:{production:'sha256:image'},fingerprint},candidateRun={id:10,status:'completed',conclusion:'success',repository:{full_name:repo},head_repository:{full_name:repo},head_branch:'main',head_sha:sha,path:'.github/workflows/release.yml',event:'workflow_run'},run={id:20,run_attempt:2,status:'in_progress',repository:{full_name:repo},head_repository:{full_name:repo},head_branch:'main',head_sha:tools,path:'.github/workflows/promote.yml',event:'workflow_dispatch'};
 const receipt={schema:1,kind:'github-actions-isolated-docker',status:'PASS',repository:repo,releaseId:sha,manifestSha256:'digest',imageId:manifest.images.production,fingerprint,runId:'20',runAttempt:2,toolsSha:tools,candidateRunId:'10',oomKilled:false,checks:requiredChecks.map(name=>({name,status:'PASS'})),controls:Object.fromEntries(requiredControls.map(name=>[name,true]))};
 return {receipt,options:{manifest,manifestSha256:'digest',repo,candidateRun,run,jobs:[{name:'isolated',conclusion:'success'}],runId:'20',toolsSha:tools}};
}
test('isolated receipt is bound to exact candidate, image, manifest, attempt and reviewed dispatch',()=>{
 const {receipt,options}=fixture();assert.equal(validateReceipt(receipt,options),true);
 for(const patch of [{releaseId:'c'.repeat(40)},{manifestSha256:'changed'},{imageId:'other'},{runId:'21'},{runAttempt:1},{candidateRunId:'11'},{toolsSha:'c'.repeat(40)},{kind:'local-isolated-fixture'},{status:'FAIL'},{oomKilled:true},{controls:{...receipt.controls,resumeAttack:false}},{checks:receipt.checks.filter(x=>x.name!=='image')}])assert.throws(()=>validateReceipt({...receipt,...patch},options));
 for(const patch of [{event:'pull_request'},{path:'.github/workflows/ci.yml'},{head_branch:'feature'},{head_sha:'c'.repeat(40)},{repository:{full_name:'attacker/repo'}},{status:'completed'}])assert.throws(()=>validateReceipt(receipt,{...options,run:{...options.run,...patch}}));
 for(const conclusion of ['skipped','failure','cancelled'])assert.throws(()=>validateReceipt(receipt,{...options,jobs:[{name:'isolated',conclusion}]}));
 assert.throws(()=>validateReceipt(receipt,{...options,candidateRun:{...options.candidateRun,head_sha:'c'.repeat(40)}}));
});
test('isolated runner has no deployment secrets and is required before privilege or publishing',()=>{
 const p=YAML.parse(fs.readFileSync('.github/workflows/promote.yml','utf8')),c=YAML.parse(fs.readFileSync('.github/workflows/ci.yml','utf8'));
 assert.equal(p.jobs.deploy.needs,'isolated');assert.equal(p.jobs.isolated.environment,undefined);assert.doesNotMatch(JSON.stringify(p.jobs.isolated),/secrets\./);assert.equal(p.jobs.isolated.permissions.actions,'read');
 const steps=p.jobs.deploy.steps;assert.ok(steps.findIndex(s=>s.run?.includes('verify-validation.mjs'))<steps.findIndex(s=>s.run?.endsWith('remote.mjs stage')));assert.ok(steps.some(s=>s.run?.endsWith('remote.mjs record-validation')));
 assert.ok(c.jobs['required-checks'].needs.includes('isolated-release'));assert.doesNotMatch(JSON.stringify(c.jobs['isolated-release']),/secrets\./);
 assert.equal(p.on.pull_request,undefined);assert.ok(p.on.workflow_dispatch);
});
