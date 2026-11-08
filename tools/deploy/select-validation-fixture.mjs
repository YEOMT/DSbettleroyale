import fs from 'node:fs';import {github,trustedRun} from './trust.mjs';
// CI tests the deployment tools against the exact PR base candidate; never deploys it.
const sha=process.env.FIXTURE_SHA,repo=process.env.GITHUB_REPOSITORY;
if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('EXACT_FIXTURE_SHA_REQUIRED');
const runs=await github(`/repos/${repo}/actions/workflows/release.yml/runs?head_sha=${sha}&status=success&per_page=20`);
let selected;
for(const run of runs.workflow_runs){
 if(run.head_sha!==sha)continue;trustedRun(run,repo,sha,'.github/workflows/release.yml');
 const artifacts=await github(`/repos/${repo}/actions/runs/${run.id}/artifacts`);
 if(artifacts.artifacts.some(a=>a.name==='release-'+sha&&!a.expired)){selected=run;break;}
}
if(!selected)throw Error('INFRA_FAILURE: exact base candidate artifact unavailable; no substitute selected');
fs.appendFileSync(process.env.GITHUB_OUTPUT,`sha=${sha}\nrun=${selected.id}\n`);console.log(JSON.stringify({fixtureSha:sha,candidateRunId:selected.id,scope:'isolated CI fixture only; not production authorization'}));
