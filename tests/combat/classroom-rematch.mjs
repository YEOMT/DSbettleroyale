// Twenty persistent participants, three real browser surfaces, five same-room rounds.
// Short combat/setup geometry, not a classroom or long-load certification.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {lifetimeProbe} from './lifetime-probe.mjs';
const label=process.argv[2]||'after',before=label==='before',start=performance.now(),rows=[],closes=[];
const mixed=process.argv[3]==='mixed',h=await auditHarness({players:20,renderer:mixed?'pixi':'canvas',studentRenderer:'canvas',initScript:lifetimeProbe,serverProcess:true,mode:process.env.CLASSROOM_MODE||'solo'});
let inputTimer;
const stats=a=>{const s=a.slice().sort((a,b)=>a-b);return {n:s.length,p95:s[Math.floor(s.length*.95)]||0,max:s.at(-1)||0};};
try{
 for(const [i,c]of h.clients.entries()){
  c.ws.on('close',(code,reason)=>closes.push({synthetic:i,code,reason:String(reason)}));
  // These load peers consume every frame but need only the latest replaceable
  // state. Retaining 2,000 old snapshots per peer adds test-driver GC to server time.
  c.onMessage=m=>{if(['SNAPSHOT','PRIVATE_STATE'].includes(m.type))c.messages=c.messages.filter(x=>x.type!==m.type||x===m);};
 }
 const secondBot=h.clients.pop(),secondContext=await h.browser.newContext({viewport:{width:1100,height:760},hasTouch:true});await secondContext.addInitScript(lifetimeProbe);await secondContext.route(/dropbox/,r=>r.abort());
 await secondContext.addInitScript(token=>sessionStorage.setItem('dsbr-resume',token),secondBot.session.token);const second=await secondContext.newPage();second.on('pageerror',e=>h.errors.push(e.message));await second.goto(h.url+'/?renderer='+(mixed?'pixi':'canvas'));await second.locator('#br-student-wait').waitFor();await secondBot.close();
 const pages=[h.host,h.student,second],identity=await h.rpc('classroom-state');
 async function instrument(p){await p.evaluate(async()=>{window.m=await import('/src/main.js');window.measure={draw:[],gap:[],close:[],last:0};const draw=m.renderer.draw.bind(m.renderer);m.renderer.draw=(v,t)=>{const at=performance.now();draw(v,t);measure.draw.push(performance.now()-at);if(measure.last)measure.gap.push(t-measure.last);measure.last=t;};m.net.addEventListener('status',e=>{if(e.detail.connected===false)measure.close.push(e.detail);});});}
 for(const p of pages)await instrument(p);
 const axes=new Map();inputTimer=setInterval(()=>{if(h.clients[0]?.room?.phase!=='BATTLE')return;for(const c of h.clients){const seq=(axes.get(c)||0)+1;axes.set(c,seq);c.send('INPUT_BATCH',{commands:[{seq,clientTick:seq,move:{x:seq%20<10?.2:-.2,y:0},aim:{x:1,y:0}}]});}},100);
 const rounds=process.env.CLASSROOM_UPGRADE?3:5;for(let round=1;round<=rounds;round++){
  if(process.env.CLASSROOM_UPGRADE){const id=await h.rpc('classroom-benchmark',{round});await h.host.waitForFunction(id=>m.ui.room.matchId===id,id);}
  const initial=await h.rpc('classroom-state');assert.equal(initial.id,identity.id);assert.equal(initial.code,identity.code);assert.deepEqual(initial.identities,identity.identities);
  await h.command('START_QUIZ');await h.host.waitForFunction(()=>m.ui.room.phase==='QUIZ');await h.command('BEGIN_DRAFT');
  await h.rpc('classroom-prepare');await h.command('START_BATTLE');await h.rpc('classroom-place');axes.clear();
  for(const p of pages){await p.waitForFunction(()=>m.ui.room.phase==='BATTLE'&&m.timeline.predicted?.alive||m.ui.room.self.role==='host'&&m.renderer.enabled);await p.evaluate(()=>{measure.draw=[];measure.gap=[];measure.last=0;});}
  await delay(500);await h.rpc('classroom-run');
  for(const p of pages.slice(1)){
   await p.bringToFront();await p.keyboard.down('d');await delay(250);await p.keyboard.up('d');await p.locator('#br-attack').click();await delay(400);await p.locator('#br-skill').click();
  }
  await Promise.all(h.clients.map(async c=>{await c.next('SNAPSHOT',s=>s.self?.lifeSeq===0);assert.equal((await c.command('ACTION',{seq:1,kind:'attack',aim:{x:1,y:0},aimPower:1})).accepted,true);await delay(150);assert.equal((await c.command('ACTION',{seq:1,kind:'skill',aim:{x:1,y:0},aimPower:1})).accepted,true);}));
  if(round===3){await h.student.reload();await instrument(h.student);await h.student.waitForFunction(()=>m.controls.enabled&&m.timeline.predicted?.alive);await h.student.keyboard.down('d');await delay(250);await h.student.keyboard.up('d');}
  await delay(2200);
  const state=await h.rpc('classroom-state'),actions=state.actions;assert.ok(actions.every(p=>p.move>0&&p.attack>0&&p.skill>0),'every student actually moves/fires each round '+JSON.stringify(actions));
  const screens=await Promise.all(pages.map(p=>p.evaluate(()=>({draw:measure.draw,gap:measure.gap,close:measure.close,lifetime:window.lifetimeCounts?.(),heapBytes:performance.memory?.usedJSHeapSize??null,resources:{sprites:m.renderer.sprites.size,textures:m.renderer.textures.size,labels:m.renderer.labels.size,profiles:m.net.profiles.values.size,pending:m.net.pending.size},renderer:m.renderer.pixi?'pixi':'canvas'}))));
  const metrics=state.metrics,peers=state.peers;
  rows.push({round,serverMemory:metrics.memory,serverCpu:state.cpu,sentBytes:metrics.sentBytes,uptimeMs:metrics.uptimeMs,step:metrics.stepCpu,snapshot:metrics.snapshotCpu,screens:screens.map(s=>({...s,draw:stats(s.draw),gap:stats(s.gap)})),peers,actions,overloads:metrics.overloads,connected:state.connected,lastClose:state.lastClose});
  if(round===rounds&&(process.env.CLASSROOM_MODE||'solo')==='solo'){ // Exercise the normal engine finish rule, rather than END, once.
   await h.rpc('classroom-finish');
   await h.host.waitForFunction(()=>m.ui.room.phase==='RESULTS');
  }else await h.command('END');
  await h.student.locator('#br-results').waitFor();
  if(round===rounds-1)await h.rpc('classroom-disconnect');
  await h.command('REMATCH');for(const p of pages)await p.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&m.net.ws.readyState===1&&!m.net.restoring);
  const clean=await Promise.all(pages.map(p=>p.evaluate(()=>({sprites:m.renderer.sprites.size,textures:m.renderer.textures.size,labels:m.renderer.labels.size,samples:m.timeline.samples.length,pending:m.net.pending.size,profiles:m.net.profiles.values.size}))));rows.at(-1).lobby=clean;rows.at(-1).lifetime=await Promise.all(pages.map(p=>p.evaluate(()=>window.lifetimeCounts?.())));
  if(!before){for(const [i,c]of rows.at(-1).lifetime.entries()){assert.equal(c.intervals,rows[0].lifetime[i].intervals,'stable intervals');assert.equal(c.raf,rows[0].lifetime[i].raf,'single RAF chains');assert.equal(c.listeners,rows[0].lifetime[i].listeners,'stable window/document listeners');}for(const s of clean)assert.ok(Object.values(s).every(n=>n===0),'match resources released');const d=(await h.rpc('classroom-state')).disposed;assert.deepEqual(d,{disposed:true,callbacks:false,inputs:0,players:0,entities:0});}
  const cleanServer=await h.rpc('classroom-state');rows.at(-1).disposed=cleanServer.disposed;rows.at(-1).cleanPeers=cleanServer.peers;if(!before)for(const peer of cleanServer.peers)assert.deepEqual(peer,{queue:0,bytes:0,pending:false,profile:false});assert.equal(cleanServer.connected,20);assert.equal(cleanServer.metrics.overloads,0);console.log('round',round,'PASS');
 }
 assert.deepEqual(h.errors,[]);console.log('same room rounds PASS',rounds);
}catch(e){rows.push({status:'FAIL',error:e.message,server:await h.rpc('classroom-state')});throw e;}finally{clearInterval(inputTimer);fs.mkdirSync('artifacts/classroom',{recursive:true});fs.writeFileSync('artifacts/classroom/'+label+'-rematch.json',JSON.stringify({label,ms:performance.now()-start,rows,errors:h.errors,closes},null,2));await h.close();}
