import fs from 'node:fs';import {inspectBundle,validateReceipt} from './validation.mjs';import {github} from './trust.mjs';
const repo=process.env.GITHUB_REPOSITORY,runId=process.env.GITHUB_RUN_ID,attempt=process.env.GITHUB_RUN_ATTEMPT,candidate=process.env.CANDIDATE_RUN_ID;
if(!/^\d+$/.test(runId||'')||!/^\d+$/.test(attempt||'')||!/^\d+$/.test(candidate||''))throw Error('EXACT_RUN_REQUIRED');
const receipt=JSON.parse(fs.readFileSync('artifacts/isolated-validation.json'));
const [run,candidateRun,jobs]=await Promise.all([github(`/repos/${repo}/actions/runs/${runId}`),github(`/repos/${repo}/actions/runs/${candidate}`),github(`/repos/${repo}/actions/runs/${runId}/attempts/${attempt}/jobs?per_page=100`)]);
validateReceipt(receipt,{...inspectBundle('artifacts/candidate'),repo,candidateRun,run,jobs:jobs.jobs,runId,toolsSha:process.env.CONTROLLER_SHA});
// Only the privileged promotion job writes this transport marker, after live API checks.
fs.writeFileSync('artifacts/verified-validation.json',JSON.stringify({...receipt,verifiedWorkflow:'.github/workflows/promote.yml',verifiedAt:new Date().toISOString()},null,2));
console.log('Exact candidate and successful isolated job verified:',receipt.releaseId,runId);
