const overdrive357=process.env.OVERDRIVE357==='1';
const focus357=overdrive357?(await import('../v35-7/scenario.mjs')).focus357:null;
// v35.6 same-room A/B reuses the v35.5 live harness and all lifecycle assertions.
// Same room, identities, transport, results, resource and recovery assertions.
import {browserTransportProbe} from './transport-probe.mjs';
import {browserActionProbe} from './recovery357-probe.mjs';
import {installDeliveryProbe} from './delivery-probe.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';import {lifetimeProbe} from './lifetime-probe.mjs';
import {installBodyMeter,bodyMeterBoundary} from './recovery356-browser-meter.mjs';
const label=process.argv[2]||'candidate',baseline=false /* v35.4 already requires identical lifecycle assertions */,renderer=process.argv[3]||'canvas',quality=process.argv[4]||'balanced',players=Number(process.env.POLISH_PLAYERS||20),mode=process.env.POLISH_MODE||'solo',rounds=Number(process.env.POLISH_ROUNDS||1),started=performance.now();
const dir=(process.env.SMOOTH358==='1'?'artifacts/v35-8/live-':overdrive357?'artifacts/v35-7/live-':'artifacts/v35-6/live-')+label+'-'+renderer+'-'+quality+'-'+mode+'-'+players+'-prepared-r'+rounds+(process.env.POLISH_RUN_TAG||'');fs.mkdirSync(dir,{recursive:true});const report={label,renderer,quality,players,mode,rounds,rows:[],environment:{platform:process.platform,browser:process.env.PLAYWRIGHT_CHANNEL||'chromium',built:process.env.LOAD_BUILT==='1',sameMachine:true,physicalDevices:false,browserProcesses:1,transport:'direct-authority-endpoint'}};
process.env.POLISH_DIAGNOSTICS='1';
const traceActions=process.env.POLISH_ACTION_TRACE==='1';
const h=await auditHarness({players,renderer,quality,mode,viewport:{width:844,height:640},studentContext:{hasTouch:true},initScript:lifetimeProbe,serverProcess:true});let timer,attackLoad=false;
const stats=a=>{a=a.slice().sort((a,b)=>a-b);return {n:a.length,p50:a[Math.floor((a.length-1)*.5)]||0,p95:a[Math.floor((a.length-1)*.95)]||0,p99:a[Math.floor((a.length-1)*.99)]||0,max:a.at(-1)||0,over100:a.filter(x=>x>100).length,over200:a.filter(x=>x>200).length};};
try{
 const bot=h.clients.pop(),context=await h.browser.newContext({viewport:{width:390,height:844},hasTouch:true});await context.addInitScript(lifetimeProbe);await context.addInitScript(browserTransportProbe);await context.addInitScript(token=>sessionStorage.setItem('dsbr-resume',token),bot.session.token);await context.route(/dropbox/,r=>r.abort());const dead=await context.newPage();dead.on('pageerror',e=>h.errors.push(e.message));await dead.goto(h.url+'/?renderer='+renderer);await dead.locator('#br-student-wait').waitFor();await bot.close();const pages=[h.host,h.student,dead];
 async function observe(page){await page.evaluate(async()=>{window.m=await import('/src/main.js');window.probe={draw:[],gap:[],frames:0,last:0};if(!m.renderer.resetObserved){m.renderer.resetObserved=[];const reset=m.renderer.reset.bind(m.renderer);m.renderer.reset=(...args)=>{const at=performance.now();try{return reset(...args);}finally{m.renderer.resetObserved.push({wall:Date.now(),at,ms:performance.now()-at});if(m.renderer.resetObserved.length>30)m.renderer.resetObserved.shift();}};const target=document.getElementById('br-victory');m.ui.resultFlow.visibilityObserved=[];new MutationObserver(()=>{m.ui.resultFlow.visibilityObserved.push({wall:Date.now(),at:performance.now(),visible:!!target.getClientRects().length&&!target.classList.contains('br-hidden'),remaining:m.ui.resultFlow.clock.remaining()});if(m.ui.resultFlow.visibilityObserved.length>40)m.ui.resultFlow.visibilityObserved.shift();}).observe(target,{attributes:true,attributeFilter:['class']});}if(!m.ui.resultFlow.polishObserved){const flow=m.ui.resultFlow,accept=flow.accept.bind(flow);flow.polishObserved=[];flow.accept=room=>{const at=performance.now();accept(room);flow.polishObserved.push({wall:Date.now(),match:room.matchId,serverTime:room.serverTime,offset:m.net.serverWallOffset,at,presentation:room.resultPresentation,remaining:flow.clock.remaining(),visible:!document.getElementById('br-victory').classList.contains('br-hidden')});if(flow.polishObserved.length>20)flow.polishObserved.shift();};}if(!m.audio.polishObserved){m.audio.polishObserved=true;m.audio.victoryRequests=0;const victory=m.audio.victory.bind(m.audio);m.audio.victory=()=>{m.audio.victoryRequests++;return victory();};}const draw=m.renderer.draw.bind(m.renderer),frame=m.renderer.frame.bind(m.renderer);m.renderer.draw=(v,t)=>{const at=performance.now();draw(v,t);probe.draw.push(performance.now()-at);if(probe.last)probe.gap.push(t-probe.last);probe.last=t;if(probe.draw.length>2000)probe.draw.shift();if(probe.gap.length>2000)probe.gap.shift();};m.renderer.frame=t=>{probe.frames++;return frame(t);};});if(traceActions){await page.evaluate(browserActionProbe);await installDeliveryProbe(page);}}
 for(const p of pages)await observe(p);
 if(process.env.RECOVERY356_PROFILE==='1')for(const p of pages)await installBodyMeter(p);
 async function screens(){return Promise.all(pages.map(p=>p.evaluate(()=>({draw:probe.draw,gap:probe.gap,frames:probe.frames,enabled:m.renderer.enabled,raf:m.renderer.raf??null,connected:m.net.ws?.readyState===1,phase:m.ui.room.phase,eliminated:!!m.net.combatSuspended,resources:{pooledSprites:m.renderer.transientSprites?.size||0,sprites:m.renderer.sprites.size,textures:m.renderer.textures.size,labels:m.renderer.labels.size,samples:m.timeline.samples.length,effects:m.timeline.effects.length,inputs:m.timeline.history.length,pending:m.net.pending.size,poses:['active','hurts','walls','contacts','fired','hurtLedger','wallLedger','contactLedger','outputs'].reduce((n,k)=>n+(m.renderer.poses[k]?.size||0),0)},lifetime:lifetimeCounts(),heap:performance.memory?.usedJSHeapSize??null,backend:m.renderer.pixi?'pixi':'canvas',graphicsRenderer:(()=>{const gl=m.renderer.app?.renderer?.gl,ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;})(),renderError:m.renderer.lastRenderError||null,transport:window.transportObserved,delivery:window.deliveryObserved,resets:m.renderer.resetObserved,visibility:m.ui.resultFlow?.visibilityObserved,lastSnapshot:{tick:m.timeline.samples.at(-1)?.state.serverTick,at:m.timeline.samples.at(-1)?.at}}))));}
 const seqs=new Map();timer=setInterval(()=>{for(const c of h.clients){if(c.room?.phase!=='BATTLE'||!c.snapshot?.self?.alive)continue;const seq=(seqs.get(c)||0)+1;seqs.set(c,seq);c.send('INPUT_BATCH',{commands:[{seq,clientTick:seq*6,move:{x:seq%20<10?.2:-.2,y:0},aim:{x:1,y:0}}]});if(attackLoad&&seq%10===1)for(const kind of ['attack','skill'])c.command('ACTION',{seq,kind,aim:{x:1,y:0},aimPower:1}).catch(()=>{});c.messages=c.messages.filter(m=>!['SNAPSHOT','EVENT','EVENT_BATCH','PRIVATE_STATE'].includes(m.type));}},100);
 for(let round=0;round<rounds;round++){
  // One trusted click per action must test an actionable life, not race random
  // hostile CC. The diagnostic run proved the old fixture sent into real stun
  // (server accepted the command, then correctly resolved it without firing).
  // Keep every peer/input/snapshot active; start the unchanged hostile attack
  // cadence after this one-shot check, before ALL live/performance windows.
  // No retry, queued input, immunity, extra wait, or relaxed counter assertion.
  attackLoad=false;
  const mode=['solo','team-elim','team-capture','solo','team-capture'][round%5],rule='normal';await h.command('CONFIGURE',{...(baseline?{}:{drawRule:rule}),mode,graphicsPreset:quality});const matchId=await h.rpc('classroom-benchmark',{round:round+1});for(const p of pages)await p.waitForFunction(id=>m.net.scope.matchId===id&&m.ui.room.matchId===id,matchId);await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');await h.rpc('polish-prepare',{focus:overdrive357?focus357:['emoji-003','emoji-007','emoji-014','emoji-142','emoji-034','emoji-063','emoji-087','emoji-139','emoji-056','emoji-025','emoji-042','emoji-023']});await h.command('START_BATTLE');await h.rpc('polish-place',{overdrive:!overdrive357,overdrive2:overdrive357});seqs.clear();
  // Match/classroom fixture warmup: first authoritative frame loads static art
  // with the simulation explicitly suspended, separate from live measurements.
  for(const p of pages)await p.waitForFunction(()=>m.renderer.enabled&&m.timeline.samples.length>0&&probe.frames>=3);
  await h.rpc('classroom-run');
  let growth357;
  if(overdrive357){
   await h.student.locator('[data-run-path=quick]').click();
   await h.student.waitForFunction(()=>m.timeline.predicted?.run?.paths.quick===3&&!m.timeline.predicted.run.offer);
   growth357=await h.rpc('polish-overdrive2-growth');
   for(const page of pages.slice(1))await page.waitForFunction(()=>!m.timeline.predicted?.run?.offer);
  }
  for(const p of pages.slice(1)){await p.bringToFront();await p.keyboard.down('d');await delay(250);await p.keyboard.up('d');await p.locator('#br-attack').click();await delay(200);await p.locator('#br-skill').click();}
  await delay(700);const act=await h.rpc('polish-state');if(traceActions){report.inputObservations??=[];report.inputObservations.push({round:round+1,at:Date.now(),actions:[act.actions[0],act.actions.at(-1)],authority:await h.rpc('polish-action-trace'),browsers:await Promise.all(pages.map(p=>p.evaluate(()=>window.actionObserved)))});}assert.ok(act.actions[0].attack>0&&act.actions[0].skill>0,'live browser attack and skill fired');assert.ok(act.actions.at(-1).attack>0&&act.actions.at(-1).skill>0,'second browser attack and skill fired');
  attackLoad=true;
  const row={round:round+1,mode,rule,stages:[],inputCheck:{attackLoadStartedAt:Date.now(),actions:[act.actions[0],act.actions.at(-1)],waitMs:700,clicksPerAction:1}};report.rows.push(row);console.log('round '+(round+1)+' '+mode);
  for(const p of pages)await p.evaluate(()=>{probe.draw=[];probe.gap=[];probe.frames=0;probe.last=0;});await h.rpc('status');row.growth=overdrive357?growth357:await h.rpc('polish-overdrive-growth');assert.equal(row.growth.accepted,players);assert.equal(row.growth.fx,overdrive357?0:players);await delay(900);row.growth.server=(await h.rpc('status')).window;row.growth.screens=(await screens()).map(s=>({draw:stats(s.draw),gap:stats(s.gap)}));
  for(const alive of (mode==='solo'&&round===0&&players<=20?(players===20?[20,6,5,3,2]:[players,3,2]):[players])){
   if(alive<players)await h.rpc('polish-population',{alive});await delay(250);
   if(!baseline&&alive<players)await dead.locator('#br-eliminated').waitFor();
   const profiled=process.env.RECOVERY356_PROFILE==='1'&&(players===30||mode==='team-elim')||process.env.RECOVERY357_PROFILE==='1'&&players===20&&round===4;
   const profileBefore=profiled?await h.rpc('diagnostic-356-start'):null;
   if(profiled)await bodyMeterBoundary(pages,true);
   for(const p of pages)await p.evaluate(()=>{probe.draw=[];probe.gap=[];probe.frames=0;probe.last=0;});const before=await h.rpc('polish-state');await h.rpc('status');await delay(players===30?8000:2500);const after=await h.rpc('polish-state'),server=await h.rpc('status'),views=await screens();
   const profile=profiled?{before:profileBefore,server:await h.rpc('diagnostic-356-stop'),body:await bodyMeterBoundary(pages)}:undefined;
   row.connectionObservation={at:Date.now(),connected:after.connected,transport:server.transport,screens:views.map(s=>s.transport),views:views.map(s=>({...s,draw:stats(s.draw),gap:stats(s.gap)}))};assert.equal(after.connected,players);assert.equal(server.paused,false,'SAFE_PAUSED');assert.equal(server.phase,'BATTLE');assert.equal(server.overloads,0);
   const traffic=after.observations.map((v,i)=>({...v,combatBytes:v.combatBytes-before.observations[i].combatBytes,controlBytes:v.controlBytes-before.observations[i].controlBytes,views:v.views-before.observations[i].views,snapshots:v.snapshots-before.observations[i].snapshots,events:v.events-before.observations[i].events}));
   if(!baseline&&alive<players){for(const v of traffic.filter(v=>v.role==='student'&&!v.alive)){assert.equal(v.combatBytes,0);assert.equal(v.views,0);assert.equal(v.snapshots,0);}assert.equal(views[2].frames,0);assert.equal(views[2].raf,null);assert.equal(views[2].resources.samples,0);}
   for(const s of views.slice(0,2)){assert.ok(s.draw.length>0);assert.ok(s.connected);assert.equal(s.renderError,null);assert.equal(s.backend,renderer);}
   row.stages.push({alive,resources:after.resources,server:server.window,traffic,profile,screens:views.map(s=>({...s,draw:stats(s.draw),gap:stats(s.gap)}))});
   if(!baseline&&alive===3){await dead.screenshot({path:dir+'/eliminated-mobile.png'});await h.host.screenshot({path:dir+'/host.png'});await h.student.screenshot({path:dir+'/student.png'});}
  }
  if(!baseline&&mode==='team-capture'){
   const life=await h.student.evaluate(()=>m.net.lifeSeq);await h.rpc('polish-kill-student');await h.student.waitForFunction(()=>m.timeline.predicted?.respawn?.question);assert.equal(await h.student.evaluate(()=>m.net.combatSuspended),false);
   row.respawnQuestions=[];
   for(let i=0;i<3;i++){
    const answer=await h.rpc('polish-quiz-answer');
    // A fixed 350ms sleep can observe the previous question while the server
    // has already advanced it. Wait for this exact authoritative option.
    await h.student.waitForFunction(id=>m.timeline.predicted?.respawn?.question?.answers.some(a=>a.id===id)&&!m.ui.respawnPending,answer);
    const text=await h.student.evaluate(id=>m.timeline.predicted.respawn.question.answers.find(a=>a.id===id).text,answer);
    await h.student.locator('#br-tk-options button').filter({hasText:text}).click();
    await h.student.waitForFunction(n=>m.timeline.predicted?.respawn?.correct===n&&!m.ui.respawnPending,i+1);
    row.respawnQuestions.push(await h.student.evaluate(()=>({correct:m.timeline.predicted.respawn.correct,question:m.timeline.predicted.respawn.question?.id,at:performance.now()})));
   }
   await h.student.locator('#br-tk-reroll').click();await h.student.waitForFunction(l=>m.timeline.predicted?.alive&&m.net.lifeSeq>l,life);await h.student.keyboard.down('d');await delay(200);await h.student.keyboard.up('d');await h.student.locator('#br-attack').click();await h.student.locator('#br-skill').click();await delay(300);const revived=(await h.rpc('polish-state')).actions[0];assert.ok(revived.attack>act.actions[0].attack&&revived.skill>act.actions[0].skill,'revived life actually fires');row.respawn='PASS';
  }
  if(mode==='solo'&&players<=20){
   if(!baseline&&round===0){await dead.reload();await dead.locator('#br-eliminated').waitFor();await observe(dead);await delay(700);assert.equal(await dead.evaluate(()=>probe.frames),0);}
   // Arm the real visibility observation before the fixture can finish the match.
   // Keep the existing deadline/assertion; no replay of an already expired winner.
   const winnerVisible=baseline?null:h.host.locator('#br-victory').waitFor();winnerVisible?.catch(()=>{});
   row.finishRequestedAt=Date.now();await h.rpc('polish-population',{alive:1});row.finishRpcAt=Date.now();await h.host.waitForFunction(()=>m.ui.room.phase==='RESULTS');
   if(!baseline){
    // C07 is a separately retained known failure, not permission to extend the
    // real 3.5s window. Complete the other same-room rounds after recording it.
    let visible=true;
    try{await winnerVisible;row.winnerCheck={status:'PASS'};}
    catch(error){
     const seen=await h.host.evaluate(()=>{const last=m.ui.resultFlow.polishObserved.at(-1);return {last,received:transportObserved.events.find(e=>e.kind==='receive-room'&&e.phase==='RESULTS'&&e.match===last?.match&&e.startedAt===last?.presentation?.startedAt&&e.showResultsAt===last?.presentation?.showResultsAt)};});
     if(error.name!=='TimeoutError'||!seen.last?.presentation||seen.last.presentation.showResultsAt-seen.last.presentation.startedAt!==3500||!seen.received||seen.received.wall<seen.last.presentation.showResultsAt)throw error;
     row.winnerCheck={status:'FAIL',code:'KNOWN_LATE_RESULT_C07',error:error.message,...seen};visible=false;
    }
    assert.equal(await h.host.evaluate(()=>m.renderer.enabled),false);
    if(visible&&round===0){await dead.reload();await dead.locator('#br-victory').waitFor();await observe(dead);const remaining=await dead.evaluate(()=>m.ui.resultFlow.clock.remaining());assert.ok(remaining>0&&remaining<3500);row.recoveredWinnerRemainingMs=remaining;}
    if(visible)await h.host.screenshot({path:dir+'/winner.png'});
   }
  }else await h.command('END');
  for(const p of pages)await p.locator('#br-results').waitFor();row.presentationTrace=await h.host.evaluate(()=>m.ui.resultFlow?.polishObserved);row.results=baseline?await h.host.evaluate(()=>m.ui.room.result.players.length):await h.host.locator('#br-ranking tbody tr').count();assert.equal(row.results,players);
  if(!baseline){if(round===0&&mode==='solo'){await dead.reload();await dead.locator('#br-results').waitFor();await observe(dead);assert.equal(await dead.evaluate(()=>m.ui.resultFlow.presentationId),'');row.lateRecovery='PASS';}await dead.screenshot({path:dir+'/result-mobile.png'});assert.equal(await dead.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await h.host.screenshot({path:dir+'/result-host.png'});}
  await h.command('REMATCH');for(const p of pages)await p.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&m.net.ws.readyState===1&&!m.net.restoring);
  row.clean=await screens();row.serverClean=await h.rpc('polish-state');assert.equal(row.serverClean.connected,players);if(!baseline){assert.ok(row.serverClean.disposed.world);assert.equal(row.serverClean.disposed.actors,0);for(const s of row.clean){assert.equal(s.resources.samples,0);assert.equal(s.resources.sprites,0);assert.equal(s.resources.pooledSprites,0);assert.equal(s.resources.textures,0);assert.equal(s.resources.effects,0);assert.equal(s.raf,null);assert.equal(s.resources.poses,0);}}
 }
 if(process.env.RECOVERY356_PROFILE==='1'){
  // End-of-run, after every live measurement. Never collect during a performance window.
  report.postRematchBeforeGC=(await h.rpc('status')).window;
  report.postRematchAfterGC=await h.rpc('fixture-memory-collect');
 }
 assert.deepEqual(h.errors,[]);report.status=report.rows.some(r=>r.winnerCheck?.status==='FAIL')?'PARTIAL':'PASS';if(report.status==='PARTIAL')process.exitCode=1;
}catch(error){report.status='FAIL';report.error=error.stack;report.state=await h.rpc('polish-state');report.telemetry=await h.rpc('status');report.presentationTrace=await h.host.evaluate(()=>({resets:m.renderer.resetObserved,visibility:m.ui.resultFlow?.visibilityObserved,transport:window.transportObserved,observed:m.ui.resultFlow?.polishObserved,phase:m.ui.room.phase,remaining:m.ui.resultFlow?.clock.remaining(),now:performance.now(),offset:m.net.serverWallOffset}));for(const [i,p]of [h.host,h.student].entries())await p.screenshot({path:dir+'/failure-'+i+'.png'}).catch(()=>{});throw error;}
finally{
 clearInterval(timer);report.ms=performance.now()-started;report.errors=h.errors;const teardownAt=performance.now();
 if(traceActions)report.finalTransport=(await h.rpc('status').catch(()=>({}))).transport;
 if(traceActions)report.finalActionTrace={wire:h.browser.contexts().flatMap(c=>c.pages()).map(p=>p.deliveryWire),authority:await h.rpc('polish-action-trace').catch(()=>[]),browsers:await Promise.all(h.browser.contexts().flatMap(c=>c.pages()).map(p=>p.evaluate(()=>window.actionObserved).catch(()=>null))),delivery:await Promise.all(h.browser.contexts().flatMap(c=>c.pages()).map(p=>p.evaluate(()=>window.deliveryObserved).catch(()=>null)))};
 try{await h.close();}catch(error){
  report.teardownError=error.stack;
  // Preserve the original failed assertion. A cleanup-only failure still fails.
  if(report.status!=='FAIL'){report.status='FAIL';throw error;}
 }finally{report.teardownMs=performance.now()-teardownAt;fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,ms:report.ms,dir,error:report.error?.split('\n')[0],teardownError:report.teardownError?.split('\n')[0]}));}
}
