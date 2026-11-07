import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const started=Date.now(),limit=process.env.CI?540000:300000,results=[];
const plan=fs.existsSync('artifacts/check-plan.json')?JSON.parse(fs.readFileSync('artifacts/check-plan.json')):{common:true};
function run(args){const start=Date.now(),r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:32e6,windowsHide:true,timeout:Math.max(1,limit-(start-started))});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');results.push({command:args.join(' '),ms:Date.now()-start,status:r.error?.code==='ETIMEDOUT'?'TIMEOUT':r.error||/connect EACCES|spawn EPERM/.test((r.stdout||'')+(r.stderr||''))?'INFRA_FAILURE':r.status===0?'PASS':'FAIL'});if(r.status!==0)throw Error(results.at(-1).status);}
try{
 run(['--test','tests/unit/releaseops.test.mjs']);
 if(plan.common){run(['tools/check-boundaries.mjs']);run(['tools/content/generate.mjs','--check']);const tests=['unit','parity','integration','roster10'].flatMap(d=>fs.readdirSync('tests/'+d).filter(f=>f.endsWith('.test.mjs')&&!(d==='unit'&&f==='releaseops.test.mjs')).map(f=>`tests/${d}/${f}`));run(['--test','--test-concurrency=1',...tests]);}
}finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/quick-results.json',JSON.stringify({ms:Date.now()-started,results,build:'separate',deep:'NOT_RUN'},null,2));}
