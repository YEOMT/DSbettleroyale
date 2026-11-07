import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {fork} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium,webkit} from 'playwright';
import {connect} from '../../tests/integration/client.mjs';
import {installBrowserTelemetry} from './browser-telemetry.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function tabletLoad({players=30,seconds=605,mode='solo',label='before',engine='chromium',quality='balanced',matrix=false,dense=false,roster="original",transitionSeconds=null,recoverOverload=true,out=`artifacts/tablet-stability/${label}-${mode}-${players}.json`}={}){
 const started=performance.now(),report={label,players,seconds,mode,engine,quality,roster,started:new Date().toISOString(),fixture:'Private IPC: six representative characters, extended health/refill to sustain combat; real movement, attacks, cooldowns, damage, 60Hz physics and 20Hz WS. 30 connected participants enter the late-game fixture with 6 alive, then 5 and 3. Capture keeps all participants alive as a separate extreme stress case, not natural deaths/respawns. No production test routes. Three simultaneous browser surfaces on one PC; not three physical devices.',samples:[],errors:[]};
 report.fixtureHash=createHash('sha256').update(['tablet.mjs','server.mjs','telemetry.mjs','browser-telemetry.mjs'].map(f=>fs.readFileSync(new URL(f,import.meta.url),'utf8').replaceAll('\r\n','\n')).join('\n')).digest('hex');
 const profileDir=process.env.LOAD_CPU_PROFILE;if(profileDir)fs.mkdirSync(profileDir,{recursive:true});
 const child=fork(fileURLToPath(new URL('./server.mjs',import.meta.url)),[],{stdio:['ignore','inherit','inherit','ipc'],windowsHide:true,execArgv:profileDir?['--cpu-prof','--cpu-prof-interval=1000','--cpu-prof-dir='+path.resolve(profileDir)]:[]});
 const port=await new Promise((resolve,reject)=>{child.once('message',m=>resolve(m.port));child.once('error',reject);});let id=0;const pending=new Map();
 child.on('message',m=>{const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error)):p.resolve(m.value);}});
 const rpc=(type,args={})=>new Promise((resolve,reject)=>{const seq=++id,timer=setTimeout(()=>{pending.delete(seq);reject(Error('IPC_TIMEOUT '+type));},10000);pending.set(seq,{resolve,reject,timer});child.send({id:seq,type,...args});});
 const target='http://127.0.0.1:'+port,vite=await createServer({configFile:'apps/client/vite.config.js',server:{watch:null,hmr:false,port:0,proxy:{'/ws':{target:target.replace('http:','ws:'),ws:true},'/version':target,'/healthz':target}}});await vite.listen();
 const url='http://127.0.0.1:'+vite.httpServer.address().port;await rpc('fixture-origin',{origin:url});
 const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})}),pages=[],clients=[];
 const startAlive=mode==='solo'&&players>6?6:players;report.survivors=mode==='solo'&&players>6?[6,5,3]:[players];report.dense=!!dense;
 let code,host,tick=0,round=0,driveTimer,phaseStart,startSimTimes;
 recoverOverload=recoverOverload===true||recoverOverload==='true';report.recoverOverload=recoverOverload;report.transitions=[];report.roundStarts=[];
 async function page(role,renderer){const ctx=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:2,hasTouch:true});await ctx.route(/dropbox/,r=>r.abort());const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push({role,error:e.message}));await p.goto(url+'/?renderer='+renderer);await p.evaluate(async()=>{await(await import('/src/main.js')).renderer.ready;});
  if(role==='host'){await p.locator('#ws-host-secret').fill('test-host');await p.locator('#br-create-btn').click();await p.locator('#br-host-room').waitFor();code=(await p.locator('#br-room-code').textContent()).trim();}
  else{await p.locator('#br-join-code').fill(code);await p.locator('#br-player-name').fill(role);await p.locator('#br-join-btn').click();await p.locator('#br-student-wait').waitFor();}
  await p.evaluate(installBrowserTelemetry);pages.push({role,renderer,page:p});return p;}
 const command=(type,payload={})=>host.evaluate(async({type,payload})=>(await import('/src/main.js')).net.command(type,payload),{type,payload});
 async function begin(){
  await command('CONFIGURE',{mode,teamCount:4,matchSeconds:360,graphicsPreset:quality,quizText:'Synthetic | Correct | Wrong one | Wrong two | Wrong three'});
  await rpc('fixture-seed',{round:++round});
  // The private seed change sends ROOM_STATE asynchronously. Wait for each
  // browser to accept its new scope before issuing the next normal command.
  for(const p of pages)await p.page.waitForFunction(async match=>(await import('/src/main.js')).net.scope.matchId===match,'stability-fixture-'+round);
  await command('START_QUIZ');await command('BEGIN_DRAFT');await rpc('fixture-stability-draft',{roster});await command('START_BATTLE');
  await rpc('fixture-stability',{alive:startAlive,place:true,dense});for(const c of clients){c.seq=0;c.action=0;}
  for(const p of pages)await p.page.evaluate(dense=>{tabletProbe.dense=dense;},dense);
  for(const p of pages)await p.page.waitForFunction(async()=>{const a=await import('/src/main.js');return a.timeline.samples.length&&a.renderer.enabled;});
  startSimTimes={};for(const p of pages)startSimTimes[p.role]=await p.page.evaluate(async()=>(await import('/src/main.js')).timeline.samples.at(-1)?.state.simTime||0);
  report.roundStarts.push({round,simTime:startSimTimes});phaseStart=performance.now();
 }
 async function sample(stage){const server=await rpc('status'),surfaces={};for(const p of pages)surfaces[p.role]=await p.page.evaluate(()=>tabletProbe.sample());const row={elapsedSeconds:(performance.now()-phaseStart)/1000,stage,server,surfaces};report.samples.push(row);console.log(JSON.stringify({label,stage,elapsedSeconds:Math.round(row.elapsedSeconds),overloads:server.overloads,alive:server.window.alive,snapshotP95:server.window.snapshot.p95,frames:Object.fromEntries(Object.entries(surfaces).map(([k,v])=>[k,{p95:v.stats.frameGapMs?.p95,draw:v.stats.drawMs?.p95,labels:v.caches.labels,textBuilds:v.textBuilds}]))}));
  // Continue observing after a recorded failure; an overload can never pass.
  if(server.paused&&recoverOverload){await command('CONTINUE');report.overloadRecoveries=(report.overloadRecoveries||0)+1;}
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({...report,status:'RUNNING'},null,2)+'\n');return row;}
 try{
  host=await page('host','pixi');await page('studentPixi','pixi');await page('studentCanvas','canvas');
  for(let i=2;i<players;i++){const c=await(await connect({address:{port}})).join(code,'Synthetic '+i);c.seq=0;c.action=0;c.onMessage=m=>{c.messages=c.messages.filter(x=>['SESSION','ROOM_STATE','COMMAND_RESULT'].includes(x.type));if(m.type==='OVERLOAD')report.errors.push({overload:m.payload});};clients.push(c);}
  await begin();
  driveTimer=setInterval(()=>{tick++;for(const [i,c]of clients.entries()){
   const s=c.snapshot?.self;if(!s||c.ws.readyState!==1)continue;const radius=dense?180:Math.max(180,(c.snapshot.aliveCount||players)*20),angle=tick*.012+i,dx=Math.cos(angle)*radius-s.x,dy=Math.sin(angle)*radius-s.y,dist=Math.hypot(dx,dy)||1,target=c.snapshot.actors.find(p=>p.alive&&p.id!==s.id&&(!s.team||s.team!==p.team)),ax=(target?.x||0)-s.x,ay=(target?.y||0)-s.y,n=Math.hypot(ax,ay)||1,aim={x:ax/n,y:ay/n};
   c.send('INPUT_BATCH',{commands:[{seq:++c.seq,clientTick:tick,move:{x:dx/dist,y:dy/dist},aim}]});
   if(s.alive&&tick%10===i%10)c.command('ACTION',{kind:'attack',seq:++c.action,aim}).catch(e=>report.errors.push({client:e.message}));
   if(s.alive&&tick%60===i%60)c.command('ACTION',{kind:'skill',seq:++c.action,aim}).catch(e=>report.errors.push({client:e.message}));
  }},1000/30);
  if(matrix){
   for(const alive of (mode==='solo'?(players>6?[players,6,5,3]:[players]):[players])){
    await rpc('fixture-stability',{alive});for(const q of ['low','balanced','high']){for(const p of pages)await p.page.evaluate(value=>tabletProbe.quality(value),q);await delay(1500);await sample('warmup-'+alive+'-'+q);await delay(seconds*1000);await sample('matrix-'+alive+'-'+q);}
   }
  }else{
   let alive=startAlive,nextSample=5;
   while(performance.now()-phaseStart<seconds*1000){const elapsed=(performance.now()-phaseStart)/1000;
    if(mode==='solo'&&players>6){const transitions=transitionSeconds?String(transitionSeconds).split(',').map(Number):[60,360];const next=elapsed>=transitions[1]?3:elapsed>=transitions[0]?5:6;if(next!==alive){alive=next;await rpc('fixture-stability',{alive});report.transitions.push({elapsedSeconds:elapsed,alive});}}
    if(elapsed>=nextSample){await sample('continuous-'+alive);nextSample+=elapsed<20?5:30;}
    await delay(200);
   }
   const end=await sample('continuous-end');report.simulatedMs=Object.fromEntries(Object.entries(end.surfaces).map(([role,s])=>[role,s.simTime-startSimTimes[role]]));if(seconds>=600)for(const value of Object.values(report.simulatedMs))assert.ok(value>=600000,'must observe 600 seconds of simulated combat excluding setup, not a paused screen');
  }
  await command('END');for(const p of pages)await p.page.waitForFunction(async()=>(await import('/src/main.js')).ui.room?.phase==='RESULTS');report.resultsObserved=pages.map(p=>p.role);
  await command('REMATCH');await delay(300);const cleanup=await sample('lobby-cleanup');
  for(const [key,value]of Object.entries(cleanup.server.window.objects))assert.equal(value,0,'server cleanup '+key);
  for(const key of ['retained','active','wallSegments'])assert.equal(cleanup.server.window.roster10[key],0,'new entity cleanup '+key);
  for(const [role,s]of Object.entries(cleanup.surfaces)){
   for(const key of ['sprites','textures','labels','tracks','deaths','hpTrails','names','emoji','levels'])assert.equal(s.caches[key],0,role+' cleanup '+key);
   for(const [key,value]of Object.entries(s.timeline))assert.equal(value,0,role+' timeline cleanup '+key);
   for(const [key,value]of Object.entries(s.roster10))assert.equal(value,0,role+' new display cleanup '+key);
  }
  report.rematchCleanup='PASS';await begin();await delay(8000);await sample('rematch');await command('END');
  report.server=await rpc('status');assert.equal(report.server.overloads,0,'server overload');assert.equal(report.server.connected,players,'all participants remain connected');assert.deepEqual(report.errors,[]);for(const row of report.samples)for(const [role,s]of Object.entries(row.surfaces)){assert.equal(s.blocked,false,role+' render blocked');assert.equal(s.renderer,role==='studentCanvas'?'canvas':'pixi',role+' fallback');assert.equal(s.error,null,role+' renderer error');}
  if(!matrix&&seconds>=600&&mode==='solo'&&players>6)for(const alive of [6,5,3])assert.ok(report.samples.some(s=>s.server.window.alive===alive),'missing survivor transition '+alive);
  report.status='PASS';
 }catch(e){report.status='FAIL';report.failure=e.stack;report.server=await rpc('status');}
 finally{clearInterval(driveTimer);for(const p of pages)await p.page.evaluate(()=>tabletProbe.close()).catch(()=>{});await browser.close();for(const c of clients)await c.close();await vite.close();report.cleanup=await rpc('close');report.elapsedMs=performance.now()-started;fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify({out,status:report.status,elapsedMs:report.elapsedMs,failure:report.failure}));return report;
}
if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url)){
 const opts=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));for(const k of ['players','seconds'])if(opts[k])opts[k]=Number(opts[k]);const report=await tabletLoad(opts);process.exitCode=report.status==='PASS'?0:1;
}
