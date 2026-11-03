import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {chromium} from 'playwright';
import {createGameServer} from '../../dist/server/main.js';
import WebSocket from 'ws';
const m=JSON.parse(fs.readFileSync('artifacts/candidate/manifest.json')),report=[],browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
try{for(const name of ['staging','production','pages']){
 const t=performance.now(),c=m.targets[name],dir=path.resolve('artifacts/candidate/'+name+(name==='pages'?'':'/client'));
 const app=await createGameServer({port:0,hostSecret:'test-host',adminSecret:'test-admin',origins:[]});
 const web=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let rel=url.pathname;if(!rel.startsWith(c.base)){res.writeHead(404);res.end();return;}rel=rel.slice(c.base.length)||'index.html';const f=path.resolve(dir,rel);if(!f.startsWith(dir+path.sep)||!fs.existsSync(f)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(f));});
 await new Promise(r=>web.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+web.address().port;app.config.origins.push(origin);
 const pages=[],contexts=[],errors=[],sockets=[];
 try{
  for(let i=0;i<3;i++){
   const ctx=await browser.newContext();contexts.push(ctx);
   await ctx.route(/dropbox/,r=>r.abort());
   // Local transport fixture: preserve and assert compiled public WSS target,
   // then send the unchanged HELLO/commands to this exact-build isolated server.
   await ctx.routeWebSocket('**',route=>{
    sockets.push(route.url());assert.equal(route.url(),c.ws);
    const ws=new WebSocket('ws://127.0.0.1:'+app.address.port+'/ws',{origin}),queued=[];
    route.onMessage(data=>{if(ws.readyState===WebSocket.OPEN)ws.send(data);else{assert.ok(queued.length<32);queued.push(data);}});
    route.onClose(()=>ws.close());ws.on('open',()=>{for(const data of queued)ws.send(data);queued.length=0;});ws.on('message',data=>route.send(data.toString()));ws.on('error',e=>errors.push(e.message));ws.on('close',(code,reason)=>route.close({code:code===1006?1011:code,reason:reason.toString()}));
   });
   const p=await ctx.newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+c.base);
  }
  const [host,a,b]=pages;await host.locator('#ws-host-secret').fill('test-host');await host.locator('#br-create-btn').click();await host.locator('#br-host-room').waitFor();
  const code=(await host.locator('#br-room-code').innerText()).trim();
  for(const [p,i]of [[a,1],[b,2]]){await p.locator('#br-join-code').fill(code);await p.locator('#br-player-name').fill('Variant '+i);await p.locator('#br-join-btn').click();await p.locator('#br-student-wait').waitFor();}
  const link=await host.locator('#br-join-link').inputValue();assert.ok(link.startsWith(origin+c.base));
  await host.locator('#br-start-quiz').click();await a.locator('#br-quiz').waitFor();await host.locator('#br-skip-to-draft').click();await a.locator('#br-draft').waitFor();await a.locator('#br-ready-btn').click();await b.locator('#br-ready-btn').click();await host.locator('#br-start-battle').click();await a.locator('#br-student-battle').waitFor();await a.locator('#br-attack').click();
  await host.locator('#br-force-end').click();await a.locator('#br-results').waitFor();await host.locator('#br-rematch-room').click();await a.locator('#br-student-wait').waitFor();
  assert.equal(sockets.length,3);assert.deepEqual(errors,[]);assert.ok((await host.locator('#release-info').textContent()).includes(m.releaseId.slice(0,12)));
  report.push({name,base:c.base,requestedWss:c.ws,buildId:m.releaseId,teacher:1,students:2,status:'PASS',ms:Math.round(performance.now()-t),scope:'built artifacts over isolated loopback; NOT public AWS/Pages'});
 }finally{for(const ctx of contexts)await ctx.close();await app.close();await new Promise(r=>web.close(r));}
}}finally{await browser.close();fs.writeFileSync('artifacts/variant-smoke.json',JSON.stringify(report,null,2));}
assert.equal(report.length,3);console.log(report);
