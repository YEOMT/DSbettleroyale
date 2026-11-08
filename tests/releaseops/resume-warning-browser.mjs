// Fault-injected controller test only. Real sealed client/server; do not use against AWS.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {randomBytes} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {lifecycle} from '../../tools/deploy/lifecycle.mjs';import {validatePublicSmoke} from '../../tools/deploy/resume-warning.mjs';import {inspectBundle} from '../../tools/deploy/validation.mjs';
const dir=path.resolve(process.env.CANDIDATE_DIR||'artifacts/candidate'),{manifest:m}=inspectBundle(dir),req=createRequire(dir+'/ops/package.json'),{chromium}=req('playwright'),WebSocket=req('ws');
const secret=randomBytes(24).toString('hex'),admin=randomBytes(24).toString('hex'),origin=new URL(m.targets.pages.http).origin;
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',timeout:120000,env:{...process.env,HOST_AUTH_SECRET:secret,ADMIN_SECRET:admin,ALLOWED_ORIGINS:origin}}).trim();
let app,container,base,web,browser,report;const errors=[];
try{
 if(process.env.LOCAL_ISOLATED_FIXTURE==='1'){
  const {createGameServer}=await import(pathToFileURL(dir+'/production/server/main.js'));
  app=await createGameServer({port:0,hostSecret:secret,adminSecret:admin,origins:[origin]});base='http://127.0.0.1:'+app.address.port;
 }else{
  docker('load','-i',dir+'/production-image.tar');assert.equal(docker('image','inspect','--format','{{.Id}}',m.images.production),m.images.production);
  container=docker('run','-d','--read-only','--tmpfs','/tmp','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','1g','--cpus','2','-p','127.0.0.1::8080','-e','HOST_AUTH_SECRET','-e','ADMIN_SECRET','-e','ALLOWED_ORIGINS',m.images.production);
  const d=JSON.parse(docker('inspect',container))[0];assert.equal(d.Image,m.images.production);base='http://127.0.0.1:'+d.NetworkSettings.Ports['8080/tcp'][0].HostPort;
 }
 for(let i=0;;i++){try{assert.equal((await(await fetch(base+'/healthz')).json()).ok,true);break;}catch(e){if(i===29)throw e;await new Promise(r=>setTimeout(r,200));}}
const root=path.join(dir,'pages'),prefix=m.targets.pages.base;
web=http.createServer((request,response)=>{
 const pathname=new URL(request.url,'http://localhost').pathname,file=path.resolve(root,decodeURIComponent(pathname.slice(prefix.length))||'index.html');
 if(!pathname.startsWith(prefix)||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
 response.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');fs.createReadStream(file).pipe(response);
});
await new Promise(r=>web.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+web.address().port+prefix;
browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 report=await lifecycle({browser,urls:[url,url,url],secret,buildId:m.releaseId,allowResumeWarning:true,configureContext:async(ctx,role,wire)=>{
  let connections=0;
  await ctx.routeWebSocket('**',route=>{
   const connection=++connections;assert.equal(route.url(),m.targets.production.ws);wire.open(route.url());
   const ws=new WebSocket(base.replace('http:','ws:')+'/ws',{origin}),queue=[];
   route.onMessage(data=>{
    const message=JSON.parse(String(data));
    // Reproduce missing observer INPUT_BATCH evidence after reload, never alter game traffic.
    if(!(role===1&&connection>1&&message.type==='INPUT_BATCH'))wire.sent(message);
    if(ws.readyState===WebSocket.OPEN)ws.send(data);else{assert.ok(queue.length<32);queue.push(data);}
   });
   route.onClose(()=>ws.close());ws.on('open',()=>{for(const data of queue)ws.send(data);queue.length=0;});ws.on('message',data=>{wire(JSON.parse(String(data)));route.send(data.toString());});ws.on('error',()=>errors.push('SOCKET_ERROR'));ws.on('close',(code,reason)=>route.close({code:code===1006?1011:code,reason:reason.toString()}));
  });return true;
 }});
 assert.equal(validatePublicSmoke(report,{releaseId:m.releaseId,allowed:true}),'DEGRADED_RELEASE');assert.equal(report.controls.resumeMove,'WARNING');assert.equal(report.controls.results,true);assert.equal(report.controls.rematch,true);assert.equal(report.controls.closed,true);assert.deepEqual(errors,[]);
 assert.ok(report.warnings[0].diagnostics[1].epoch>report.warnings[0].diagnostics[1].inputEpoch);assert.doesNotMatch(JSON.stringify(report),new RegExp(secret));
 console.log(JSON.stringify({test:'PASS',observedStatus:report.status,controls:report.controls,ms:report.ms,fixture:'LOCAL_OBSERVER_INPUT_BATCH_LOSS; NOT public functionality failure or success'}));
}finally{
 if(browser)await browser.close();if(app)await app.close();if(web?.listening)await new Promise(r=>web.close(r));
 if(container){const d=JSON.parse(docker('inspect',container))[0];docker('rm','-f',container);assert.equal(d.State.OOMKilled,false);}
 if(report){fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/resume-warning-fixture.json',JSON.stringify({...report,fixture:'LOCAL_OBSERVER_INPUT_BATCH_LOSS'},null,2));}
}
