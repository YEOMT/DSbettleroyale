// Preinstalled Chromium + OS libraries, on the disposable Actions runner only.
// Host networking preserves the existing loopback server/Pages/WebSocket tests.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {isolatedBrowserEndpoint} from '../deploy/isolated-browser.mjs';
const root=process.cwd(),dir=path.resolve(process.env.CANDIDATE_DIR||'artifacts/candidate');
const state=path.resolve('artifacts/isolated-browser.json');
const version='1.56.1',image=`mcr.microsoft.com/playwright:v${version}-noble`;
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:180000}).trim();
const mode=process.argv[2];
if(mode==='serve'){
 const req=createRequire(dir+'/ops/package.json');
 assert.equal(req('playwright/package.json').version,version,'candidate/browser version pairing');
 const server=await req('playwright').chromium.launchServer({headless:true,host:'127.0.0.1',port:0});
 fs.writeFileSync(state,JSON.stringify({image,version,endpoint:isolatedBrowserEndpoint(server.wsEndpoint())}));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await server.close();process.exit();});
}else if(mode==='start'){
 assert.equal(process.platform,'linux');assert.equal(process.env.GITHUB_ACTIONS,'true');
 const req=createRequire(dir+'/ops/package.json');assert.equal(req('playwright/package.json').version,version);
 const name='dsbr-ci-browser-'+process.env.GITHUB_RUN_ID+'-'+process.env.GITHUB_RUN_ATTEMPT;
 assert.match(name,/^dsbr-ci-browser-\d+-\d+$/);
 fs.mkdirSync(path.dirname(state),{recursive:true});if(fs.existsSync(state))fs.unlinkSync(state);
 const at=performance.now();
 // The image reuses registry/container layers; no apt mirror or browser install.
 docker('pull',image);
 docker('run','-d','--name',name,'--init','--network','host','--ipc','host',
  '--mount',`type=bind,source=${root},target=${root}`,'--workdir',root,
  '--env','CANDIDATE_DIR='+dir,'--entrypoint','node',image,'tools/ci/isolated-browser.mjs','serve');
 fs.writeFileSync('artifacts/isolated-browser-container.txt',name);
 for(let i=0;!fs.existsSync(state);i++){
  if(i===59)throw Error('ISOLATED_BROWSER_START_TIMEOUT');
  if(docker('inspect','--format','{{.State.Running}}',name)!=='true')throw Error('ISOLATED_BROWSER_EXITED: '+docker('logs',name));
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 const saved=JSON.parse(fs.readFileSync(state,'utf8'));isolatedBrowserEndpoint(saved.endpoint);
 fs.appendFileSync(process.env.GITHUB_ENV,'ISOLATED_BROWSER_WS='+saved.endpoint+'\n');
 console.log(JSON.stringify({image,version,preparationMs:performance.now()-at,transport:'runner-loopback; same exact candidate; no apt download'}));
}else if(mode==='stop'){
 if(fs.existsSync('artifacts/isolated-browser-container.txt')){
  const name=fs.readFileSync('artifacts/isolated-browser-container.txt','utf8');assert.match(name,/^dsbr-ci-browser-\d+-\d+$/);docker('rm','-f',name);
 }
}else throw Error('EXPECTED_start_serve_stop');
