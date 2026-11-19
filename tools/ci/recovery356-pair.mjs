// One baseline/candidate attempt per scenario, same runner and fixture. No retries.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const overdrive357=process.env.OVERDRIVE357==='1',version=overdrive357?'v35-7':'v35-6';
const root=process.cwd(),baseSha=overdrive357?'9b2d45ff13d4ee0890179103ef66e6edb1bf174c':'e328aad252e243428123e3d576ea8ffefcdb8604';
const renderer=process.argv[2]||'canvas',quality=process.argv[3]||'low';
const players=Number(process.env.POLISH_PLAYERS||20),rounds=Number(process.env.POLISH_ROUNDS||5);
const out=path.resolve('artifacts',version),base=path.join(out,'baseline-source');
fs.mkdirSync(out,{recursive:true});
const report={baseSha,renderer,quality,players,rounds,attempts:[],comparison:[],performanceStatus:'NOT_RUN',scope:'same runner, sequential production builds; synthetic peers + three real browsers; physical devices NOT_RUN'};
const name=label=>`live-${label}-${renderer}-${quality}-solo-${players}-prepared-r${rounds}`;
function run(label,cwd,args,env={}){
 const started=performance.now(),r=spawnSync(process.execPath,args,{cwd,env:{...process.env,...env},windowsHide:true,encoding:'utf8',maxBuffer:16e6,timeout:600000});
 fs.writeFileSync(path.join(out,`${label}-${renderer}-${quality}-${players}-r${rounds}.log`),(r.stdout||'')+'\n'+(r.stderr||''));
 const row={label,command:args.join(' '),ms:performance.now()-started,exit:r.status,status:r.error?.code==='ETIMEDOUT'?'TIMEOUT':r.error?'INFRA_FAILURE':r.status===0?'PASS':'FAIL'};report.attempts.push(row);console.log(JSON.stringify(row));return row;
}
try{
 // checkout's temporary HOME can differ from the Playwright container's HOME.
 // Trust only this checkout for this read-only archive command, never '*'.
 const marker=path.join(base,'.baseline-sha');
 if(fs.existsSync(marker)&&fs.readFileSync(marker,'utf8').trim()!==baseSha)throw Error('BASELINE_SHA_MISMATCH');
 if(!fs.existsSync(marker)){
  fs.mkdirSync(base,{recursive:true});const tar=path.join(out,'baseline.tar');
  execFileSync('git',['-c','safe.directory='+root,'archive','--format=tar','--output='+tar,baseSha],{windowsHide:true});
  execFileSync('tar',['-xf',tar,'-C',base],{windowsHide:true});
  fs.writeFileSync(marker,baseSha+'\n');
 }
 fs.copyFileSync('tests/combat/recovery356-live.mjs',base+'/tests/combat/recovery356-live.mjs');
 fs.copyFileSync('tests/combat/recovery356-browser-meter.mjs',base+'/tests/combat/recovery356-browser-meter.mjs');
 for(const file of ['tests/combat/recovery357-probe.mjs','tests/combat/transport-probe.mjs','tests/combat/delivery-probe.mjs','tests/combat/recovery356-profiler.mjs'])fs.copyFileSync(file,base+'/'+file);
 if(overdrive357){
  fs.mkdirSync(base+'/tests/v35-7',{recursive:true});
  for(const file of ['tests/v35-7/scenario.mjs','tests/combat/polish354-authority.mjs'])fs.copyFileSync(file,base+'/'+file);
 }
 const built=run('baseline-build',base,['tools/build.mjs']);
 if(built.status!=='PASS')throw Error('BASELINE_BUILD_FAILED');
 for(const [label,cwd]of [['baseline',base],['candidate',root]]){
  const result=run(label,cwd,['tests/combat/recovery356-live.mjs',label,renderer,quality],{CLASSROOM_BUNDLE:'1',LOAD_BUILT:'1',POLISH_ACTION_TRACE:overdrive357?'1':'0',POLISH_PLAYERS:String(players),POLISH_ROUNDS:String(rounds)});
  const dir=path.join(cwd,'artifacts',version,name(label));
  if(fs.existsSync(dir+'/report.json')){
   result.live=JSON.parse(fs.readFileSync(dir+'/report.json','utf8'));
   if(result.live.status==='PARTIAL')result.status='PARTIAL';
   if(label==='baseline')fs.cpSync(dir,path.join(out,name(label)),{recursive:true});
  }
 }
 const a=report.attempts.find(r=>r.label==='baseline')?.live,b=report.attempts.find(r=>r.label==='candidate')?.live;
 const metrics=s=>({stepP95:s.server.step.p95,snapshotP95:s.server.snapshot.p95,windowMs:s.server.windowMs,serverCpuMs:s.server.cpuMs.total,cpuMsPerSecond:s.server.cpuMs.total*1000/s.server.windowMs,rss:s.server.memory.rss,bytes:s.server.transport.bytes,bytesPerSecond:s.server.transport.bytes*1000/s.server.windowMs,hostDrawP95:s.screens[0].draw.p95,studentDrawP95:s.screens[1].draw.p95,studentGapP95:s.screens[1].gap.p95,hostGapP95:s.screens[0].gap.p95});
 for(const ar of a?.rows||[]){const br=b?.rows.find(r=>r.round===ar.round&&r.mode===ar.mode);if(!br)continue;
  for(const as of ar.stages){const bs=br.stages.find(s=>s.alive===as.alive);if(!bs)continue;const av=metrics(as),bv=metrics(bs);report.comparison.push({round:ar.round,mode:ar.mode,alive:as.alive,before:av,after:bv,ratios:Object.fromEntries(Object.keys(av).map(k=>[k,av[k]?bv[k]/av[k]:null]))});}
 }
 report.functionStatus=report.attempts.every(r=>r.status==='PASS')?'PASS':report.attempts.some(r=>['FAIL','TIMEOUT','INFRA_FAILURE'].includes(r.status))?'FAIL':'PARTIAL';
 // A single shared-runner sample is a risk signal, never a classroom guarantee.
 report.expectedComparisons=rounds+(players===20?4:0);
 report.performanceStatus=!report.comparison.length?'NOT_RUN':report.comparison.length!==report.expectedComparisons||report.comparison.some(r=>!Object.values(r.before).every(Number.isFinite)||!Object.values(r.after).every(Number.isFinite)||r.before.windowMs<=0||r.after.windowMs<=0||['bytesPerSecond','stepP95','snapshotP95','cpuMsPerSecond','rss','hostDrawP95','studentDrawP95','studentGapP95','hostGapP95'].some(k=>r.ratios[k]>1.20))?'PARTIAL':'PASS';
 if(report.functionStatus!=='PASS')process.exitCode=1;
}catch(error){report.error=error.stack;report.functionStatus=report.attempts.length?'FAIL':'INFRA_FAILURE';process.exitCode=1;}
finally{
 // Raw per-surface/transport traces live in adjacent reports; avoid duplicating MBs.
 for(const row of report.attempts)if(row.live){row.report=name(row.label)+'/report.json';row.liveStatus=row.live.status;row.liveMs=row.live.ms;delete row.live;}
 fs.writeFileSync(path.join(out,`pair-${renderer}-${quality}-${players}-r${rounds}.json`),JSON.stringify(report,null,2));
 console.log(JSON.stringify({functionStatus:report.functionStatus,performanceStatus:report.performanceStatus,comparisons:report.comparison.length}));
}
