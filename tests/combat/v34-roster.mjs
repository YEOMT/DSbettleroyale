import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';

const renderer=process.argv[2]||'canvas',dir='artifacts/v34/roster-'+renderer,started=performance.now();
fs.mkdirSync(dir,{recursive:true});
const report={renderer,status:'RUNNING'},h=await auditHarness({players:19,renderer,quality:'low',viewport:{width:844,height:640}});
const until=async(condition,label)=>{const deadline=performance.now()+5000;while(!condition()){if(performance.now()>deadline)throw Error(label);await delay(15);}};
try{
 const context=await h.browser.newContext({hasTouch:true,viewport:{width:390,height:844}});h.contexts.push(context);
 await context.route(/dropbox/,r=>r.abort());const rival=await context.newPage();rival.on('pageerror',e=>h.errors.push(e.message));
 await rival.goto(h.url+'/?room='+h.room.code+'&renderer='+renderer);await rival.locator('#br-player-name').fill('Rival');
 await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();
 const members=h.room.students();let w,g,p,q;
 assert.equal(members.length,20);const pages=[h.student,rival,h.host],v=(x=0,y=0)=>new w.Vec2(x,y);
 // Fixed fixture geometry isolates return collisions/cone timing from the map seed.
 for(const c of h.clients)c.onMessage=m=>{if(m.type==='SNAPSHOT')c.messages=c.messages.filter(row=>row.type!=='SNAPSHOT'||row===m);};
 async function observe(page){await page.evaluate(async()=>{
  window.m=await import('/src/main.js');window.observed={warning:false,maxShots:0,drawMs:[],frameGaps:[],last:0};
  const draw=m.renderer.draw.bind(m.renderer);
  m.renderer.draw=(view,now)=>{const begin=performance.now();draw(view,now);const o=observed;
   o.warning||=view.shots.some(s=>s.kind==='red-light-warning'&&m.renderer.roster10Visible?.has(s.id));
   o.maxShots=Math.max(o.maxShots,view.shots.filter(s=>s.kind==='projectile').length);
   if(o.drawMs.length<600)o.drawMs.push(performance.now()-begin);if(o.last&&o.frameGaps.length<600)o.frameGaps.push(now-o.last);o.last=now;
  };
 });}
 for(const page of pages)await observe(page);
 let peakShots=0,lastPublish=0;
 async function ticks(n,onLastSnapshot){
  const peers=[...h.room.members.values()].filter(m=>m.connected).map(m=>m.peer);
  for(let i=0;i<n;i++){
   const publish=i%3===2||i===n-1;
   if(publish){const wait=lastPublish+50-performance.now();if(wait>0)await delay(wait);}
   // The normal 60 Hz pump batches simultaneous reliable events, sends the
   // replaceable snapshot at 20 Hz, then releases the batch. Manual physics
   // must preserve this transport behavior during a synchronized 20-caster volley.
   for(const peer of peers)peer.beginBatch();
   try{
    stepWorld(w);peakShots=Math.max(peakShots,g.rw.entities.filter(e=>!e.dead&&e.kind==='projectile').length);
    if(publish){h.publish();lastPublish=performance.now();}
   }finally{for(const peer of peers)peer.endBatch();}
   if(i===n-1)onLastSnapshot?.();
   if(i<n-1)await delay(1000/60);
  }
 }
 async function setCase(id,all=false){
  if(h.room.phase==='BATTLE'){
   await h.command('END');await h.command('REMATCH');
   for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&!m.renderer.enabled);
  }
  await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');
  // Select content at the existing draft fixture seam, so each real match
  // begins with its own life, profiles and input scope for the same 20 users.
  for(const member of members)member.draft.abilityId=all||member===members[0]?id:'emoji-114';
  h.room.fixtureFrozen=true;await h.command('START_BATTLE');
  w=h.room.world;g=w.game;p=w.byId.get(members[0].id);q=w.byId.get(members.at(-1).id);
  w.brFarm.dispose(g);g.walls=[];g.smokes=[];
  for(const [i,actor]of g.participants.entries()){
   assert.equal(actor.ability.id,all||actor===p?id:'emoji-114');
   actor.pos=actor===p?v():actor===q?v(260,0):v(1400*Math.cos(i*.32),1400*Math.sin(i*.32));
   actor.vel=v();actor.team=all?1:actor===q?2:1;actor.spawnProtectionUntilFrame=0;
   if(all)actor.run.mods.skillCount=3;
  }
  g.rebuildSpatialGrid();h.staticState();
  for(const page of pages)await page.waitForFunction(match=>m.ui.room?.phase==='BATTLE'&&m.ui.room.matchId===match,h.room.matchId);
  h.publish();
  for(const [page,actor]of [[h.student,p],[rival,q]])await page.waitForFunction(({id,life})=>m.timeline.predicted?.abilityId===id&&m.net.lifeSeq===life&&m.timeline.predicted?.lifeSeq===life&&m.net.profilesReady&&m.controls.enabled,{id:actor.ability.id,life:actor.lifeSeq});
  for(const c of h.clients)await until(()=>c.scope.matchId===h.room.matchId&&c.snapshot?.self?.abilityId===w.byId.get(c.session.playerId).ability.id,'bot failed to receive current match');
 }
 async function fire(page,actor,aim={x:1,y:0}){
  await page.waitForFunction(()=>!m.net.restoring&&m.controls.enabled&&!m.timeline.predicted?.rw?.locks?.skill&&performance.now()-(m.controls.lastFire.skill??-Infinity)>=100);
  await page.evaluate(aim=>m.controls.fire('skill',{aim,power:1}),aim);
  await until(()=>w.actionPending.get(actor.remoteId)?.some(a=>a.kind==='skill'),'student skill did not reach authority');
 }
 await setCase('emoji-151');await fire(h.student,p);await ticks(12);
 const scheduled=g.rw.entities.find(e=>e.kind==='scheduled'&&e.ctx.abilityId==='emoji-151');
 assert.ok(scheduled,'authority scheduled red-light resolution');
 const resolveWarning=scheduled.tick;
 scheduled.tick=(ctx,e)=>{
  if(e.age===36){
   const input=w.session.inputs[q.remoteId],drive=Math.hypot(q.presentationDriveX,q.presentationDriveY);
   report.signalResolution={frame:g.frame,castStart:ctx.startedFrame,appliedSeq:q.lastAppliedSeq,appliedTick:q.inputAppliedAt,
    move:[input?.dx,input?.dy],ageMs:Number.isFinite(input?._receivedAt)?w.brNow()-input._receivedAt:null,lifeMatches:input?.life===q.lifeSeq,
    sessionMatches:input?.sessionId===q.sessionId,matchMatches:input?.matchKey===w.matchId,actor:[p.pos.x,p.pos.y],target:[q.pos.x,q.pos.y],
    prior:[q.combatPreviousX,q.combatPreviousY],forwardStep:drive?((q.pos.x-q.combatPreviousX)*q.presentationDriveX+(q.pos.y-q.combatPreviousY)*q.presentationDriveY)/drive:0,
    warpMatches:(q.warpSeq||0)===q.combatPreviousWarp,hostile:w.BRRework.hostile(ctx,q),visible:w.BRRework.visible(ctx,q,p.pos),
    inCone:w.brSectorTouches(p.pos,q,ctx.aim,780,80*Math.PI/180,w.BR_CONTACT.skillConeTarget),locks:w.BRRework.inputLocks(q,g),drive};
  }
  return resolveWarning(ctx,e);
 };
 for(const page of pages)await page.waitForFunction(()=>observed.warning);
 await rival.screenshot({path:dir+'/red-light.png'});
 // The authority clock is manual, while the physical key and WS input sampler
 // use the browser clock. Advance each snapshot interval only after receiving
 // the next held-key sample. The actual move, lifetime and hit stay authoritative.
 await rival.bringToFront();await rival.keyboard.down('d');
 for(let i=0;i<10;i++){
  const previous=q.lastAppliedSeq||0;
  await until(()=>{
   const input=w.inputPending.get(q.remoteId);
   return input?.seq>previous&&input.lifeSeq===q.lifeSeq&&input.move.x>.9;
  },'no fresh walking input from the real rival browser before signal tick '+(g.frame+1));
  await ticks(3);
 }
 await rival.keyboard.up('d');
 assert.ok(report.signalResolution.forwardStep>.1&&report.signalResolution.ageMs!==null&&report.signalResolution.ageMs<250,'rival was walking on fresh input at the resolution tick');
 assert.ok(q.rw.trafficSlowUntil>g.frame);await rival.waitForFunction(()=>m.timeline.predicted.rw.slow===.35);
 report.signal={renderedBy:3,slow:q.rw.buffs.find(b=>b.kind==='slow').value,remaining:q.rw.trafficSlowUntil-g.frame};
 await setCase('emoji-147');const origin={x:p.pos.x,y:p.pos.y};await fire(h.student,p);await ticks(15);
 const cast=p.rw.recast.ctx.castId,deadline=p.rw.recast.end,oldEpoch=await h.student.evaluate(()=>m.net.scope.connectionEpoch);
 await h.student.reload();await observe(h.student);await h.student.waitForFunction(id=>m.net.profilesReady&&m.controls.enabled&&!m.net.restoring&&m.timeline.predicted?.rw.recast?.id===id,cast);
 assert.equal(p.rw.recast.end,deadline);assert.ok(await h.student.evaluate(()=>m.net.scope.connectionEpoch)>oldEpoch);
 await fire(h.student,p);await ticks(1);assert.equal(p.rw.recast,null);assert.ok(Math.hypot(p.pos.x-origin.x,p.pos.y-origin.y)<.01);assert.equal(p.cooldown,420);
 report.alien={restoredRecast:true,warp:p.warpSeq,cooldown:p.cooldown};
 await setCase('emoji-131',true);peakShots=0;let shots=0;
 const spawn=w.entitySpawn;w.entitySpawn=(e,...rest)=>{if(e.kind==='projectile')shots++;spawn?.(e,...rest);};
 const snapshotSizes=[];for(const member of h.room.members.values()){const peer=member.peer,send=peer.snapshot.bind(peer);peer.snapshot=(data,...args)=>{snapshotSizes.push(data.length);return send(data,...args);};}
 for(const page of pages)await page.evaluate(()=>Object.assign(observed,{maxShots:0,drawMs:[],frameGaps:[],last:0}));
 const cpu=process.cpuUsage(),rss=process.memoryUsage.rss(),bytes=h.app.metrics.sentBytes,begin=performance.now();
 const hostMember=[...h.room.members.values()].find(m=>m.role==='host'),hostPeer=hostMember.peer;
 const serverTrace=report.hostCommands={frames:{EVENT:0,EVENT_BATCH:0,SNAPSHOT:0},commands:[],steps:[],closes:[]};
 function transportState(){
  return {ms:Math.round(performance.now()-begin),phase:h.room.phase,epoch:hostMember.epoch,
   ready:hostMember.peer?.socket.readyState??null,buffered:hostPeer.socket.bufferedAmount,
   queued:hostPeer.queueBytes,pendingSnapshot:!!hostPeer.pendingSnapshot,snapshotSeq:h.room.snapshotSeq,
   replaced:h.app.metrics.replacedSnapshots,highWater:h.app.metrics.bufferHighWatermark,rss:process.memoryUsage.rss()};
 }
 hostPeer.socket.on('close',(code,reason)=>serverTrace.closes.push({code,reason:String(reason),...transportState()}));
 hostPeer.socket.prependListener('message',data=>{
  const m=JSON.parse(data);if(m.type==='END'||m.type==='REMATCH')serverTrace.commands.push({direction:'received',type:m.type,...transportState()});
 });
 const sendHost=hostPeer.socket.send.bind(hostPeer.socket);
 hostPeer.socket.send=(data,...args)=>{
  const type=String(data.subarray(0,48)).match(/^\{"type":"([A-Z_]+)"/)?.[1];
  if(Object.hasOwn(serverTrace.frames,type))serverTrace.frames[type]++;
  if(type==='COMMAND_RESULT'){
   const m=JSON.parse(data);if(['END','REMATCH'].includes(m.payload.command))serverTrace.commands.push({direction:'sent',type:m.payload.command,accepted:m.payload.accepted,...transportState()});
  }
  return sendHost(data,...args);
 };
 await h.host.evaluate(()=>{
  window.controlAck=[];m.net.addEventListener('command_result',e=>{if(['END','REMATCH'].includes(e.detail.command))
   controlAck.push({type:e.detail.command,accepted:e.detail.accepted,phase:m.ui.room.phase,seq:m.timeline.lastSeq,epoch:m.net.scope.connectionEpoch});});
 });
 async function hostPhaseCommand(type){
  serverTrace.steps.push({at:'issue '+type,...transportState()});
  try{const ack=await h.command(type);assert.equal(ack.accepted,true);return ack;}
  finally{
   serverTrace.steps.push({at:'after '+type,...transportState()});
   serverTrace.client=await h.host.evaluate(()=>({ack:controlAck,phase:m.ui.room?.phase,seq:m.timeline.lastSeq,
    ready:m.net.ws?.readyState,restoring:m.net.restoring,epoch:m.net.scope.connectionEpoch,pending:m.net.pending.size}));
  }
 }
 let endAck,burstEnd;
 for(let wave=0;wave<3;wave++){
  const aim=[{x:1,y:0},{x:0,y:1},{x:-1,y:0}][wave];
  await Promise.all([fire(h.student,p,aim),fire(rival,q,aim),...h.clients.map(async c=>{
   const actor=w.byId.get(c.session.playerId),ack=await c.command('ACTION',{kind:'skill',seq:1000+wave,aim,aimPower:1,castId:actor.rw?.recast?.ctx.castId||''});assert.equal(ack.accepted,true);
  })]);
  if(wave===2){
   await ticks(3);
   await h.student.waitForFunction(()=>document.getElementById('br-skill-count').textContent==='재사용 0/2');
   await ticks(42,()=>{
    burstEnd=performance.now();
    // Issue END immediately after the last live snapshot, including when the
    // host has queued frames. Never wait for its buffer or rendered frame first.
    endAck=hostPhaseCommand('END');endAck.catch(()=>{});
   });
  }else await ticks(45);
  for(const actor of g.participants){assert.equal(actor.rw.recast?.left??0,2-wave);if(wave<2)assert.equal(actor.cooldown,0);else assert.ok(actor.cooldown>0);}
  const wanted='재사용 '+(2-wave)+'/2';
  if(wave<2)await h.student.waitForFunction(s=>document.getElementById('br-skill-count').textContent===s,wanted);
 }
 assert.equal(shots,480);assert.equal(h.room.students().filter(m=>m.connected).length,20);
 const screens=await Promise.all(pages.map(page=>page.evaluate(()=>{
   const p95=a=>[...a].sort((u,v)=>u-v)[Math.floor(a.length*.95)];
   return {maxShots:observed.maxShots,frames:observed.drawMs.length,drawP95:p95(observed.drawMs),gapP95:p95(observed.frameGaps),renderer:m.renderer.pixi?'pixi':'canvas'};
 })));
 for(const s of screens){assert.equal(s.renderer,renderer);assert.ok(s.maxShots>=1);assert.ok(s.frames>2);}
 snapshotSizes.sort((a,b)=>a-b);const used=process.cpuUsage(cpu);
 report.scissors={participants:20,uses:3,count:8,shots,peakShots,screens,elapsedMs:burstEnd-begin,cpuMs:(used.user+used.system)/1000,
  processRssBefore:rss,processRssAfter:process.memoryUsage.rss(),sentBytes:h.app.metrics.sentBytes-bytes,snapshotP95:snapshotSizes[Math.floor(snapshotSizes.length*.95)],snapshots:snapshotSizes.length};
 await endAck;
 for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='RESULTS');
 await until(()=>h.clients.every(c=>c.room?.phase==='RESULTS'),'all virtual students received Results');
 assert.equal(h.room.phase,'RESULTS');
 await hostPhaseCommand('REMATCH');
 for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&m.renderer.textures.size===0);
 await until(()=>h.clients.every(c=>c.room?.phase==='LOBBY'&&c.scope.matchId===h.room.matchId),'all virtual students received Rematch');
 assert.equal(h.room.world,null);assert.equal(h.room.students().filter(m=>m.connected).length,20);
 assert.deepEqual(h.errors,[]);report.status='PASS';console.log('v34 roster',renderer,'PASS',JSON.stringify(report.scissors));
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{report.ms=performance.now()-started;fs.writeFileSync(dir+'/result.json',JSON.stringify(report,null,2));await h.close();}
