// Fault-injected controller test only. Real sealed client/server; do not use against AWS.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {randomBytes} from 'node:crypto';
import {lifecycle} from '../../tools/deploy/lifecycle.mjs';import {validatePublicSmoke} from '../../tools/deploy/resume-warning.mjs';import {inspectBundle} from '../../tools/deploy/validation.mjs';
const dir=path.resolve(process.env.CANDIDATE_DIR||'artifacts/candidate'),{manifest:m}=inspectBundle(dir),req=createRequire(dir+'/ops/package.json'),{chromium}=req('playwright'),WebSocket=req('ws');
const {createGameServer}=await import(pathToFileURL(dir+'/production/server/main.js'));
const secret=randomBytes(24).toString('hex'),origin=new URL(m.targets.pages.http).origin,app=await createGameServer({port:0,hostSecret:secret,adminSecret:randomBytes(24).toString('hex'),origins:[origin]});
const root=path.join(dir,'pages'),prefix=m.targets.pages.base;
const web=http.createServer((request,response)=>{
 const pathname=new URL(request.url,'http://localhost').pathname,file=path.resolve(root,decodeURIComponent(pathname.slice(prefix.length))||'index.html');
 if(!pathname.startsWith(prefix)||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
 response.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');fs.createReadStream(file).pipe(response);
});
await new Promise(r=>web.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+web.address().port+prefix;
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})}),errors=[];let report;
try{
 report=await lifecycle({browser,urls:[url,url,url],secret,buildId:m.releaseId,allowResumeWarning:true,configureContext:async(ctx,role,wire)=>{
  let connections=0;
  await ctx.routeWebSocket('**',route=>{
   const connection=++connections;assert.equal(route.url(),m.targets.production.ws);wire.open(route.url());
   const ws=new WebSocket('ws://127.0.0.1:'+app.address.port+'/ws',{origin}),queue=[];
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
 await browser.close();await app.close();await new Promise(r=>web.close(r));
 if(report){fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/resume-warning-fixture.json',JSON.stringify({...report,fixture:'LOCAL_OBSERVER_INPUT_BATCH_LOSS'},null,2));}
}
