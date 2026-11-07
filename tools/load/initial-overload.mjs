// Controlled A/B diagnosis using the unmodified dist client/server pair.
// Both cases retain 31 game sockets and the same generated intentions. Three
// extra read-only mirror sockets terminate here (not at the game server): Node
// drains them in A; actual production browser UIs drain/render them in B.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import WebSocket,{WebSocketServer} from 'ws';
import {chromium} from 'playwright';
import {TestClient} from '../../tests/integration/client.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,Math.max(0,ms)));
const options=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const seconds=Number(options.seconds||75),out=options.out||'artifacts/initial-overload';
assert.ok(seconds>=1&&seconds<=90,'short diagnosis only; never a 605-second run');
fs.mkdirSync(out,{recursive:true});
const release=JSON.parse(fs.readFileSync('dist/release.json')),sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.deepEqual(JSON.parse(fs.readFileSync('dist/client/version.json')),release);
const build={...release,serverSha256:sha('dist/server/main.js'),htmlSha256:sha('dist/client/index.html')};
const roles=['host','studentPixi','studentCanvas'];
const envelope=(type,payload)=>({type,protocolVersion:release.protocolVersion,payload});
const version=Object.fromEntries(['protocolVersion','contentHash','engineRevision','buildId'].map(k=>[k,release[k]]));

// Fixed intention stream, independent of renderer scheduling/snapshot arrival.
// 30Hz batches for all 30, two 60Hz movement samples per batch for the two
// browser-equivalent slots. Original synthetic action cadence for the other28;
// the first2 retain the old100ms attack/skill *attempt* cadence (server gates it).
// The world/roster/seed/HP/positions/survivor transition are the existing fixture.
function intentions(tick){
 const rows=[],alive=tick<1800?6:5;
 for(let i=0;i<30;i++){
  const angle=i*Math.PI*2/30,turn=tick<300?Math.PI+angle:Math.PI/2+angle+(tick-300)*.012;
  const move={x:Math.cos(turn),y:Math.sin(turn)},target=(i+1)%alive,targetAngle=target*Math.PI*2/30;
  const dx=Math.cos(targetAngle)-Math.cos(angle),dy=Math.sin(targetAngle)-Math.sin(angle),n=Math.hypot(dx,dy)||1,aim={x:dx/n,y:dy/n};
  const commands=i<2?[{seq:tick*2-1,clientTick:tick*2-1,move,aim,aspect:4/3},{seq:tick*2,clientTick:tick*2,move,aim,aspect:4/3}]:[{seq:tick,clientTick:tick,move,aim}];
  rows.push({i,type:'INPUT_BATCH',payload:{commands}});
  if(i<alive){if(i<2&&tick%3===0)rows.push({i,type:'ACTION',payload:{kind:(tick/3)%7?'attack':'skill',seq:tick,aim,aimPower:1}});
   if(i>=2&&tick%10===(i-2)%10)rows.push({i,type:'ACTION',payload:{kind:'attack',seq:tick,aim}});
   if(i>=2&&tick%60===(i-2)%60)rows.push({i,type:'ACTION',payload:{kind:'skill',seq:tick,aim}});}
  if(tick%60===i%60)rows.push({i,type:'PING',payload:{clientTime:tick*1000/30}});
 }
 return rows;
}

async function run(render){
 const label=render?'with-browser':'no-render',file=path.join(out,label+'.json');
 const report={label,build,seconds,environment:'Same Windows PC; server separate process, browser not a separate physical machine',condition:'31 real game WS sockets; equal deterministic intentions; same three read-only mirror streams drained by Node or built browser UIs',limitations:['Controlled initial fixture, not an exact replay of the previous browser-autopilot trajectory','Render case also includes real client parsing/UI/prediction and browser/relay scheduling; not an isolated GPU measurement','Not a long-duration or physical-classroom PASS'],samples:[],errors:[],browserEvents:[],inputCounts:{},started:new Date().toISOString()};
 const child=fork(fileURLToPath(new URL('./server.mjs',import.meta.url)),[],{windowsHide:true,stdio:['ignore','ignore','inherit','ipc'],env:{...process.env,LOAD_BUILT:'1',NODE_ENV:'production',HOST_AUTH_SECRET:randomBytes(24).toString('hex'),ADMIN_SECRET:randomBytes(24).toString('hex'),ALLOWED_ORIGINS:'https://diagnostic.invalid'}});
 const port=await new Promise((resolve,reject)=>{child.once('message',m=>resolve(m.port));child.once('error',reject);});
 let seq=0;const pending=new Map();child.on('message',m=>{const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error)):p.resolve(m.value);}});
 const rpc=(type,args={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('IPC_TIMEOUT '+type));},10000);pending.set(id,{resolve,reject,timer});child.send({id,type,...args});});
 const url='http://127.0.0.1:'+port,clients=[],mirrors=new Map(),saved=new Map(),lastTime=new Map(),mirrorCounts={};
 let host,browser,relay,started,initialSim,hash=createHash('sha256');
 const keep=new Set(['WELCOME','AUTH_OK','SESSION','ROOM_STATE','STATIC_STATE']);
 function mirror(role,raw){const ws=mirrors.get(role);if(ws?.readyState!==1)return;if(ws.bufferedAmount>8*1024*1024)throw Error('MIRROR_BACKLOG');ws.send(raw,{binary:false});mirrorCounts[role]=(mirrorCounts[role]||0)+Buffer.byteLength(raw);}
 async function peer(role){const c=new TestClient('ws://127.0.0.1:'+port+'/ws');
  if(role){saved.set(role,new Map());c.ws.on('message',raw=>{const m=JSON.parse(raw);if(keep.has(m.type))saved.get(role).set(m.type,raw.toString());if(m.type==='SNAPSHOT')lastTime.set(role,{value:m.payload.serverNow,at:performance.now()});if(!['WELCOME','AUTH_OK','SESSION','PONG'].includes(m.type))mirror(role,raw);});}
  c.onMessage=m=>{c.messages=c.messages.filter(x=>['SESSION','ROOM_STATE','WELCOME','AUTH_OK'].includes(x.type));if(m.type==='COMMAND_RESULT'){report.commandResults??={};const key=m.payload.accepted?'accepted':m.payload.reason||'rejected';report.commandResults[key]=(report.commandResults[key]||0)+1;}if(m.type==='ERROR')report.errors.push({source:'game',code:m.payload.code});};
  return c.open(version);
 }
 try{
  assert.deepEqual(await(await fetch(url+'/version')).json(),version);assert.equal((await(await fetch(url+'/healthz')).json()).ok,true);
  await rpc('fixture-origin',{origin:'http://localhost:5173'});await rpc('fixture-origin',{origin:url});
  host=await(await peer('host')).host();for(let i=0;i<30;i++)clients.push(await(await peer(i===0?'studentPixi':i===1?'studentCanvas':null)).join(host.room.code,'Synthetic '+i));
  relay=new WebSocketServer({host:'127.0.0.1',port:0});await new Promise(r=>relay.once('listening',r));const relayUrl='ws://127.0.0.1:'+relay.address().port;
  relay.on('connection',(ws,req)=>{const role=new URL(req.url,'http://local').pathname.slice(1);if(!roles.includes(role))return ws.close();
   ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='HELLO'){assert.deepEqual(m.payload,version);ws.send(saved.get(role).get('WELCOME'));}
    else if(m.type==='AUTH')ws.send(saved.get(role).get('AUTH_OK'));
    else if(m.type==='CREATE'||m.type==='JOIN'){ws.send(saved.get(role).get('SESSION'));ws.send(saved.get(role).get('ROOM_STATE'));mirrors.set(role,ws);}
    else if(m.type==='PING'){const stamp=lastTime.get(role);ws.send(JSON.stringify(envelope('PONG',{clientTime:m.payload.clientTime,serverNow:stamp?stamp.value+performance.now()-stamp.at:performance.now()})));}
    // UI neutral inputs never replace/add to the identical game driver.
   });
  });
  const surfaces=[];
  if(render){
   browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
   for(const role of roles){const ctx=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:2,hasTouch:true});
    await ctx.addInitScript(({relayUrl,role})=>{
     const Native=WebSocket,stats={receivedBytes:0,snapshots:0,simTime:0,drawCalls:0,canvasImages:0,frames:[],longTasks:[]};let last=0;
     window.WebSocket=class extends Native{constructor(url,protocols){super(new URL(url,location.href).pathname==='/ws'?relayUrl+'/'+role:url,protocols);this.addEventListener('message',e=>{stats.receivedBytes+=e.data.length;const m=JSON.parse(e.data);if(m.type==='SNAPSHOT'){stats.snapshots++;stats.simTime=m.payload.simTime;}if(m.type==='VERSION_MISMATCH')stats.versionMismatch=true;});}};
     for(const proto of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype])for(const key of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){const f=proto[key];if(f)proto[key]=function(...args){stats.drawCalls++;return f.apply(this,args);};}
     const image=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){stats.canvasImages++;return image.apply(this,args);};
     function frame(t){if(last){stats.frames.push(t-last);if(stats.frames.length>4096)stats.frames.shift();}last=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
     new PerformanceObserver(list=>{for(const e of list.getEntries()){stats.longTasks.push(e.duration);if(stats.longTasks.length>100)stats.longTasks.shift();}}).observe({type:'longtask',buffered:false});
     window.initialProbe=()=>({...stats,frames:stats.frames.slice(),heap:performance.memory?.usedJSHeapSize});
    },{relayUrl,role});
    const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push({role,message:e.message}));page.on('crash',()=>report.browserEvents.push({role,type:'crash',elapsedMs:started?performance.now()-started:null}));page.on('framenavigated',f=>{if(started&&f===page.mainFrame())report.browserEvents.push({role,type:'navigation',elapsedMs:performance.now()-started});});
    page.on('request',r=>{if(/\/@vite\/|\/src\//.test(r.url()))report.errors.push({source:'dev-request'});});await page.route(/dropbox/,r=>r.abort());
    await page.goto(url+'/?renderer='+(role==='studentCanvas'?'canvas':'pixi'));
    if(role==='host'){await page.locator('#ws-host-secret').fill('test-host');await page.locator('#br-create-btn').click();await page.locator('#br-host-room').waitFor();}
    else{await page.locator('#br-join-code').fill(host.room.code);await page.locator('#br-player-name').fill(role);await page.locator('#br-join-btn').click();await page.locator('#br-student-wait').waitFor();}
    surfaces.push({role,page});
   }
  }else for(const role of roles){const ws=new WebSocket(relayUrl+'/'+role);await new Promise(r=>ws.once('open',r));ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='WELCOME')ws.send(JSON.stringify(envelope(role==='host'?'CREATE':'JOIN',{})));});ws.send(JSON.stringify(envelope('HELLO',version)));}
  for(let n=0;mirrors.size!==3&&n<50;n++)await delay(20);assert.equal(mirrors.size,3);
  await host.command('CONFIGURE',{mode:'solo',teamCount:4,matchSeconds:360,graphicsPreset:'balanced',quizText:'Synthetic | Correct | Wrong one | Wrong two | Wrong three'});
  await rpc('fixture-seed',{round:1});await delay(100);await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await rpc('fixture-stability-draft',{roster:'new'});await host.command('START_BATTLE');await rpc('fixture-stability',{alive:6,place:true});
  for(const {role,page}of surfaces)await page.locator(role==='host'?'#game-screen':'#br-student-battle').waitFor({state:'visible'});
  const initial=await rpc('status');initialSim=initial.window.simTime;report.initial=initial;assert.equal(initial.connected,30);assert.equal(initial.window.peers,31);started=performance.now();
  let nextSample=1000,nextSurface=5000,transitioned=false,late=new Array();
  for(let tick=1;tick<=Math.floor(seconds*30);tick++){
   await delay(started+tick*1000/30-performance.now());const elapsed=performance.now()-started;late.push(Math.max(0,elapsed-tick*1000/30));
   if(tick===1800){await rpc('fixture-stability',{alive:5});transitioned=true;}
   const rows=intentions(tick);hash.update(JSON.stringify(rows));for(const {i,type,payload}of rows){report.inputCounts[type]=(report.inputCounts[type]||0)+1;clients[i].send(type,payload,type!=='PING',type==='ACTION'?'diagnostic-'+tick+'-'+i+'-'+payload.kind:undefined);}
   if(elapsed>=nextSample){const server=await rpc('status');report.samples.push({elapsedMs:elapsed,server});nextSample+=1000;}
   if(elapsed>=nextSurface&&render){for(const s of surfaces){report.samples.at(-1).surfaces??={};report.samples.at(-1).surfaces[s.role]=await s.page.evaluate(()=>initialProbe());}nextSurface+=5000;}
  }
  report.wallMs=performance.now()-started;report.server=await rpc('status');report.simulatedMs=report.server.window.simTime-initialSim;report.intentHash=hash.digest('hex');report.driverLatenessMs={max:Math.max(...late),p95:late.sort((a,b)=>a-b)[Math.floor(late.length*.95)]};report.transitioned=transitioned;report.mirrorBytes=mirrorCounts;
  report.receivedBytes=[host,...clients].reduce((n,c)=>n+c.receivedBytes,0);
  for(const {role,page}of surfaces){report.surfaces??={};report.surfaces[role]=await page.evaluate(()=>initialProbe());assert.ok(report.surfaces[role].snapshots>0);assert.ok(role==='studentCanvas'?report.surfaces[role].canvasImages>100:report.surfaces[role].drawCalls>100,role+' actual renderer');assert.ok(!report.surfaces[role].versionMismatch);await page.screenshot({path:path.join(out,label+'-'+role+'.png')});}
  report.status=report.server.overloads===0&&!report.server.fault&&report.server.connected===30&&report.simulatedMs>=(seconds-1)*1000&&report.errors.length===0&&report.browserEvents.length===0?'PASS':'FAIL';
 }catch(e){report.status='FAIL';report.failure=e.message;report.server=await rpc('status').catch(()=>null);if(initialSim!==undefined&&report.server)report.simulatedMs=report.server.window.simTime-initialSim;}
 finally{await browser?.close();for(const ws of mirrors.values())ws.terminate();await new Promise(r=>relay?relay.close(r):r());for(const c of clients)await c.close();await host?.close();report.cleanup=await rpc('close');fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify({label,status:report.status,overloads:report.server?.overloads,wallMs:report.wallMs,simulatedMs:report.simulatedMs,failure:report.failure}));return report;
}
const results=[];for(const mode of (options.mode==='no-render'?[false]:options.mode==='with-browser'?[true]:[false,true]))results.push(await run(mode));
if(results.length===2){assert.equal(results[0].intentHash,results[1].intentHash,'identical intended input/action trace');assert.deepEqual(results[0].inputCounts,results[1].inputCounts);}
process.exitCode=results.every(r=>r.status==='PASS')?0:1;
