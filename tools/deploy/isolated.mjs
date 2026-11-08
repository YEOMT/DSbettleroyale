import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {randomBytes} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {inspectBundle} from './validation.mjs';import {lifecycle} from './lifecycle.mjs';
const dir=path.resolve(process.env.CANDIDATE_DIR||'artifacts/candidate'),{manifest:m,manifestSha256}=inspectBundle(dir),req=createRequire(dir+'/ops/package.json'),{chromium}=req('playwright'),WebSocket=req('ws');
if(process.env.RELEASE_SHA&&m.releaseId!==process.env.RELEASE_SHA)throw Error('SELECTED_RELEASE_MISMATCH');
const local=process.env.LOCAL_ISOLATED_FIXTURE==='1',secret=randomBytes(24).toString('hex'),admin=randomBytes(24).toString('hex'),checks=[{name:'bundle',status:'PASS'}],started=Date.now();
const report={schema:1,kind:local?'local-isolated-fixture':'github-actions-isolated-docker',status:'FAIL',releaseId:m.releaseId,manifestSha256,imageId:m.images.production,fingerprint:m.fingerprint,repository:process.env.GITHUB_REPOSITORY,runId:process.env.GITHUB_RUN_ID,runAttempt:Number(process.env.GITHUB_RUN_ATTEMPT),toolsSha:process.env.GITHUB_SHA,candidateRunId:process.env.CANDIDATE_RUN_ID,checks};
const origins=[m.targets.production.http,new URL(m.targets.pages.http).origin],errors=[];let container,app,browser,base;
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:120000,env:{...process.env,HOST_AUTH_SECRET:secret,ADMIN_SECRET:admin,ALLOWED_ORIGINS:origins.join(',')}}).trim();
const web=http.createServer((request,response)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);}catch{response.writeHead(400).end();return;}
 const prefix=m.targets.pages.base,root=path.join(dir,'pages'),file=path.resolve(root,pathname.slice(prefix.length)||'index.html');
 if(!pathname.startsWith(prefix)||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
 response.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.html')?'text/html':'application/octet-stream');fs.createReadStream(file).pipe(response);
});
try{
 if(local){const {createGameServer}=await import(pathToFileURL(dir+'/production/server/main.js'));app=await createGameServer({port:0,hostSecret:secret,adminSecret:admin,origins,clientDir:dir+'/production/client'});base='http://127.0.0.1:'+app.address.port;checks.push({name:'image',status:'NOT_RUN'});
 }else{
  docker('load','-i',dir+'/production-image.tar');assert.equal(docker('image','inspect','--format','{{.Id}}',m.images.production),m.images.production);
  container=docker('run','-d','--read-only','--tmpfs','/tmp','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','1g','--cpus','2','-p','127.0.0.1::8080','-e','HOST_AUTH_SECRET','-e','ADMIN_SECRET','-e','ALLOWED_ORIGINS',m.images.production);
  const d=JSON.parse(docker('inspect',container))[0];assert.equal(d.Image,m.images.production);base='http://127.0.0.1:'+d.NetworkSettings.Ports['8080/tcp'][0].HostPort;checks.push({name:'image',status:'PASS'});
 }
 for(let i=0;;i++){try{assert.equal((await(await fetch(base+'/healthz')).json()).ok,true);break;}catch(e){if(i===29)throw e;await new Promise(r=>setTimeout(r,200));}}
 const version=await(await fetch(base+'/version')).json();for(const k of ['buildId','contentHash','engineRevision','protocolVersion'])assert.equal(version[k],m.fingerprint[k]);checks.push({name:'http-version',status:'PASS'});
 await new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('http:','ws:')+'/ws',{origin:'https://invalid.example'}),timer=setTimeout(()=>{ws.terminate();reject(Error('ORIGIN_CHECK_TIMEOUT'));},5000);ws.on('error',()=>{});ws.on('unexpected-response',(_req,res)=>{clearTimeout(timer);res.resume();ws.terminate();res.statusCode===403?resolve():reject(Error('ORIGIN_RESPONSE_'+res.statusCode));});ws.on('open',()=>{clearTimeout(timer);ws.close();reject(Error('INVALID_ORIGIN_ACCEPTED'));});});checks.push({name:'origins',status:'PASS'});
 await new Promise(r=>web.listen(0,'127.0.0.1',r));const pagesUrl='http://127.0.0.1:'+web.address().port+m.targets.pages.base;
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const result=await lifecycle({browser,urls:[base,pagesUrl,pagesUrl],secret,buildId:m.releaseId,configureContext:async(ctx,role,wire)=>{
  await ctx.routeWebSocket('**',route=>{
   assert.equal(route.url(),m.targets.production.ws);wire.open(route.url());
   const ws=new WebSocket(base.replace('http:','ws:')+'/ws',{origin:origins[role===0?0:1]}),queued=[];
   route.onMessage(data=>{wire.sent(JSON.parse(String(data)));if(ws.readyState===WebSocket.OPEN)ws.send(data);else{assert.ok(queued.length<32);queued.push(data);}});route.onClose(()=>ws.close());
   ws.on('open',()=>{for(const data of queued)ws.send(data);queued.length=0;});ws.on('message',data=>{wire(JSON.parse(data));route.send(data.toString());});ws.on('error',e=>errors.push(e.message));ws.on('close',(code,reason)=>route.close({code:code===1006?1011:code,reason:reason.toString()}));
  });return true;
 }});
 assert.deepEqual(errors,[]);report.controls=result.controls;report.browser=result;checks.push({name:'lifecycle-controls',status:'PASS'});report.status='PASS';
}catch(e){report.error=String(e.message).replaceAll(secret,'[redacted]').replaceAll(admin,'[redacted]');report.lifecycle=e.lifecycle;process.exitCode=1;
}finally{
 if(browser)await browser.close();if(app)await app.close();if(web.listening)await new Promise(r=>web.close(r));
 if(container){const d=JSON.parse(docker('inspect',container))[0];report.oomKilled=d.State.OOMKilled;docker('rm','-f',container);if(report.oomKilled){report.status='FAIL';process.exitCode=1;}}
 report.ms=Date.now()-started;fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync(process.env.VALIDATION_REPORT||'artifacts/isolated-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
