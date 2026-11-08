import {createRequire} from 'node:module';import path from 'node:path';import fs from 'node:fs';import {lifecycle} from './lifecycle.mjs';
import {warningRequested,validatePublicSmoke} from './resume-warning.mjs';
const {chromium}=createRequire(path.resolve(process.env.DEPLOY_RUNTIME||'package.json'))('playwright');
const url=process.env.SMOKE_URL,secret=process.env.SMOKE_HOST_SECRET,sha=process.env.RELEASE_SHA;
if(!url||!secret||!sha)throw Error('BLOCKED_CONFIGURATION');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
let report;
try{
 const allowed=warningRequested({requested:process.env.INITIAL_RESUME_WARNING==='true',releaseId:sha,candidateRunId:process.env.CANDIDATE_RUN_ID,target:process.env.TARGET,url});
 report=await lifecycle({browser,urls:[url,url,url],secret,buildId:sha,allowResumeWarning:allowed});validatePublicSmoke(report,{releaseId:sha,allowed});
 console.log(JSON.stringify({status:report.status,buildId:sha,ms:report.ms,controls:report.controls,warnings:report.warnings.map(({code,failedCheck,stage})=>({code,failedCheck,stage}))}));
}catch(error){report={status:'FAIL',buildId:sha,error:'PUBLIC_SMOKE_FAILED',...error.lifecycle};throw Error('PUBLIC_SMOKE_FAILED (see public-smoke.json)');
}finally{if(report){const file=process.env.SMOKE_REPORT||'artifacts/public-smoke.json';fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2));}await browser.close();}
