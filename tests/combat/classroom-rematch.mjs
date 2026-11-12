// Twenty persistent participants, three real browser surfaces, five same-room rounds.
// Short combat/setup geometry, not a classroom or long-load certification.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {lifetimeProbe} from './lifetime-probe.mjs';
const label=process.argv[2]||'after',before=label==='before',start=performance.now(),rows=[],closes=[];
const mixed=process.argv[3]==='mixed',backend=process.env.EVOLUTION_RENDERER||(mixed?'pixi':'canvas');
const h=await auditHarness({players:20,renderer:backend,studentRenderer:process.env.EVOLUTION_RENDERER||'canvas',...(process.env.EVOLUTION_RENDERER?{viewport:{width:844,height:640}}:{}),initScript:lifetimeProbe,serverProcess:true,mode:process.env.CLASSROOM_MODE||'solo'});
let inputTimer,measurement;
const stats=a=>{const s=a.slice().sort((a,b)=>a-b);const q=p=>s[Math.min(s.length-1,Math.floor(s.length*p))]||0;return {n:s.length,p50:q(.5),p95:q(.95),p99:q(.99),max:s.at(-1)||0,over50:s.filter(n=>n>=50).length,over100:s.filter(n=>n>=100).length,over200:s.filter(n=>n>=200).length};};
try{
 for(const [i,c]of h.clients.entries()){
  c.ws.on('close',(code,reason)=>closes.push({synthetic:i,code,reason:String(reason)}));
  // These load peers consume every frame but need only the latest replaceable
  // state. Retaining 2,000 old snapshots per peer adds test-driver GC to server time.
  c.onMessage=m=>{if(['SNAPSHOT','PRIVATE_STATE'].includes(m.type))c.messages=c.messages.filter(x=>x.type!==m.type||x===m);};
 }
 const secondBot=h.clients.pop(),secondContext=await h.browser.newContext({viewport:{width:1100,height:760},hasTouch:true});await secondContext.addInitScript(lifetimeProbe);await secondContext.route(/dropbox/,r=>r.abort());
 await secondContext.addInitScript(token=>sessionStorage.setItem('dsbr-resume',token),secondBot.session.token);const second=await secondContext.newPage();second.on('pageerror',e=>h.errors.push(e.message));await second.goto(h.url+'/?renderer='+backend);await second.locator('#br-student-wait').waitFor();await secondBot.close();
 const pages=[h.host,h.student,second],identity=await h.rpc('classroom-state');
 async function instrument(page){
  await page.evaluate(async detailed=>{
   window.m=await import('/src/main.js');
   window.measure={draw:[],gap:[],raf:[],lag:[],close:[],last:0};
   const sample=(list,value)=>{if(list.length>=4096)list.splice(0,512);list.push(value);};
   const draw=m.renderer.draw.bind(m.renderer);
   m.renderer.draw=(v,t)=>{
    const at=performance.now();draw(v,t);sample(measure.draw,performance.now()-at);
    if(measure.last)sample(measure.gap,t-measure.last);measure.last=t;
    if(detailed && m.timeline.samples.length)sample(measure.lag,m.timeline.samples.at(-1).state.serverTick-v.renderTick);
   };
   if(detailed){
    const frame=m.renderer.frame.bind(m.renderer);let last=0;
    m.renderer.frame=t=>{if(last)sample(measure.raf,t-last);last=t;return frame(t);};
   }
   m.net.addEventListener('status',e=>{if(e.detail.connected===false)measure.close.push(e.detail);});
  },process.env.CLASSROOM_SMOOTH_STATS==='1');
 }
 for(const p of pages)await instrument(p);
 const axes=new Map();inputTimer=setInterval(()=>{if(h.clients[0]?.room?.phase!=='BATTLE')return;for(const c of h.clients){const seq=(axes.get(c)||0)+1;axes.set(c,seq);c.send('INPUT_BATCH',{commands:[{seq,clientTick:seq,move:{x:seq%20<10?.2:-.2,y:0},aim:{x:1,y:0}}]});}},100);
 if(process.env.CLASSROOM_METER)await h.rpc('classroom-meter-start');
 const rounds=process.env.CLASSROOM_UPGRADE?3:5;for(let round=1;round<=rounds;round++){
  if(process.env.CLASSROOM_UPGRADE){const id=await h.rpc('classroom-benchmark',{round});await h.host.waitForFunction(id=>m.ui.room.matchId===id,id);}
  const initial=await h.rpc('classroom-state');assert.equal(initial.id,identity.id);assert.equal(initial.code,identity.code);assert.deepEqual(initial.identities,identity.identities);
  await h.command('START_QUIZ');await h.host.waitForFunction(()=>m.ui.room.phase==='QUIZ');await h.command('BEGIN_DRAFT');
  await h.rpc('classroom-prepare');await h.command('START_BATTLE');await h.rpc('classroom-place');axes.clear();
  let arena;
  if(process.env.CLASSROOM_EXPECT_ARENA==='1' && process.env.CLASSROOM_MODE==='solo'){
   arena=await h.rpc('classroom-arena');assert.equal(arena.map,Number(process.env.CLASSROOM_MAP||0));
   assert.equal(arena.radius,3860);assert.equal(arena.pads,4);assert.equal(arena.portal,true);
   assert.equal(arena.startTick,1200);assert.ok(arena.xp>=37,'actual starting XP boxes '+arena.xp);
  }
  for(const p of pages){await p.waitForFunction(()=>m.ui.room.phase==='BATTLE'&&m.timeline.predicted?.alive||m.ui.room.self.role==='host'&&m.renderer.enabled);await p.evaluate(()=>{measure.draw=[];measure.gap=[];measure.raf=[];measure.lag=[];measure.last=0;});}
  await delay(500);await h.rpc('classroom-run');
  for(const p of pages.slice(1)){
   await p.bringToFront();await p.keyboard.down('d');await delay(250);await p.keyboard.up('d');await p.locator('#br-attack').click();await delay(400);await p.locator('#br-skill').click();
  }
  await Promise.all(h.clients.map(async c=>{await c.next('SNAPSHOT',s=>s.self?.lifeSeq===0);assert.equal((await c.command('ACTION',{seq:1,kind:'attack',aim:{x:1,y:0},aimPower:1})).accepted,true);await delay(150);assert.equal((await c.command('ACTION',{seq:1,kind:'skill',aim:{x:1,y:0},aimPower:1})).accepted,true);}));
  if(round===3){await h.student.reload();await instrument(h.student);await h.student.waitForFunction(()=>m.controls.enabled&&m.timeline.predicted?.alive);await h.student.keyboard.down('d');await delay(250);await h.student.keyboard.up('d');}
  await delay(2200);
  const state=await h.rpc('classroom-state'),actions=state.actions;assert.ok(actions.every(p=>p.move>0&&p.attack>0&&p.skill>0),'every student actually moves/fires each round '+JSON.stringify(actions));
  const screens=await Promise.all(pages.map(p=>p.evaluate(()=>({draw:measure.draw,gap:measure.gap,raf:measure.raf,lag:measure.lag,timeline:m.timeline.metrics,close:measure.close,lifetime:window.lifetimeCounts?.(),heapBytes:performance.memory?.usedJSHeapSize??null,unsentInputs:m.controls.batch.length,resources:{sprites:m.renderer.sprites.size,textures:m.renderer.textures.size,labels:m.renderer.labels.size,profiles:m.net.profiles.values.size,pending:m.net.pending.size},renderer:m.renderer.pixi?'pixi':'canvas'}))));
  const metrics=state.metrics,peers=state.peers;
  rows.push({round,arena,inputApply:metrics.inputApply,snapshotGap:metrics.snapshotGap,replaced:metrics.replacedSnapshots,serverMemory:metrics.memory,serverCpu:state.cpu,sentBytes:metrics.sentBytes,uptimeMs:metrics.uptimeMs,step:metrics.stepCpu,snapshot:metrics.snapshotCpu,screens:screens.map(s=>({...s,draw:stats(s.draw),gap:stats(s.gap),raf:stats(s.raf),lagTicks:stats(s.lag),lag:undefined,timeline:{...s.timeline,arrivalGaps:stats(s.timeline.arrivalGaps),sourceGaps:stats(s.timeline.sourceGaps),corrections:stats(s.timeline.corrections)}})),peers,actions,overloads:metrics.overloads,connected:state.connected,lastClose:state.lastClose});
  if(round===rounds&&(process.env.CLASSROOM_MODE||'solo')==='solo'){ // Exercise the normal engine finish rule, rather than END, once.
   await h.rpc('classroom-finish');
   await h.host.waitForFunction(()=>m.ui.room.phase==='RESULTS');
  }else await h.command('END');
  await h.student.locator('#br-results').waitFor();
  if(round===rounds-1)await h.rpc('classroom-disconnect');
  await h.command('REMATCH');for(const p of pages)await p.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&m.net.ws.readyState===1&&!m.net.restoring);
  const clean=await Promise.all(pages.map(p=>p.evaluate(()=>({unsentInputs:m.controls.batch.length,sprites:m.renderer.sprites.size,textures:m.renderer.textures.size,labels:m.renderer.labels.size,samples:m.timeline.samples.length,pending:m.net.pending.size,profiles:m.net.profiles.values.size}))));rows.at(-1).lobby=clean;rows.at(-1).lifetime=await Promise.all(pages.map(p=>p.evaluate(()=>window.lifetimeCounts?.())));
  if(!before){for(const [i,c]of rows.at(-1).lifetime.entries()){assert.equal(c.intervals,rows[0].lifetime[i].intervals,'stable intervals');assert.equal(c.raf,rows[0].lifetime[i].raf,'single RAF chains');assert.equal(c.listeners,rows[0].lifetime[i].listeners,'stable window/document listeners');}for(const s of clean)assert.ok(Object.values(s).every(n=>n===0),'match resources released');const d=(await h.rpc('classroom-state')).disposed;assert.deepEqual(d,{disposed:true,callbacks:false,inputs:0,players:0,entities:0});}
  const cleanServer=await h.rpc('classroom-state');rows.at(-1).disposed=cleanServer.disposed;rows.at(-1).cleanPeers=cleanServer.peers;if(!before)for(const peer of cleanServer.peers)assert.deepEqual(peer,{queue:0,bytes:0,pending:false,profile:false});assert.equal(cleanServer.connected,20);assert.equal(cleanServer.metrics.overloads,0);console.log('round',round,'PASS');
 }
 if(process.env.CLASSROOM_METER)measurement=await h.rpc('classroom-meter-finish');
 assert.deepEqual(h.errors,[]);console.log('same room rounds PASS',rounds);
}catch(e){const server=await h.rpc('classroom-state');if(process.env.CLASSROOM_METER && !measurement)measurement=await h.rpc('classroom-meter-finish');rows.push({status:'FAIL',error:e.message,server,telemetry:(await h.rpc('status')).window});throw e;}finally{clearInterval(inputTimer);fs.mkdirSync('artifacts/classroom',{recursive:true});fs.writeFileSync('artifacts/classroom/'+label+'-rematch.json',JSON.stringify({label,ms:performance.now()-start,rows,measurement,errors:h.errors,closes},null,2));await h.close();}
