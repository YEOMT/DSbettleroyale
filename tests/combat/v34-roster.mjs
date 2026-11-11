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
 await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();await h.battle();
 const w=h.room.world,g=w.game,members=h.room.students(),p=w.byId.get(members[0].id),q=w.byId.get(members.at(-1).id);
 assert.equal(members.length,20);const pages=[h.student,rival,h.host],v=(x=0,y=0)=>new w.Vec2(x,y);
 // Fixed fixture geometry isolates return collisions/cone timing from the map seed.
 w.brFarm.dispose(g);g.walls=[];g.smokes=[];h.staticState();
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
 let peakShots=0;
 async function ticks(n){
  for(let i=0;i<n;i++){stepWorld(w);peakShots=Math.max(peakShots,g.rw.entities.filter(e=>!e.dead&&e.kind==='projectile').length);
   if(i%3===2||i===n-1){h.publish();await delay(30);}
  }
 }
 async function setCase(id,all=false){
  w.BRRework.clearWorld(g,'fixture-case');g.projectiles=[];g.retiredShots=[];w.inputPending.clear();w.actionPending.clear();
  for(const [i,actor]of g.participants.entries()){
   const ability=w.EMOJI_DB.find(a=>a.id===(all||actor===p?id:'emoji-114')),remoteId=actor.remoteId,lifeSeq=actor.lifeSeq+1;
   const pos=actor===p?v():actor===q?v(260,0):v(1400*Math.cos(i*.32),1400*Math.sin(i*.32));
   Object.assign(actor,new w.Participant(i+1,'Fixture'+i,ability,pos,all?1:actor===q?2:1),
    {remoteId,sessionId:remoteId,lifeSeq,abilityId:ability.id,abilityIndex:w.EMOJI_DB.indexOf(ability),humanControlled:true,alive:true,connected:true,
     applyPlayerInput:w.brApplyPlayerInput,spawnProtectionUntilFrame:0,basicCooldown:0,cooldown:0,aimProfileKey:null,rw:null,lastAimDir:v(1,0)});
   w.brInitRun(actor);if(all)actor.run.mods.skillCount=3;w.session.inputs[remoteId]={};
  }
  g.rebuildSpatialGrid();h.publish();
  for(const [page,actor]of [[h.student,p],[rival,q]])await page.waitForFunction(l=>m.net.lifeSeq===l&&m.timeline.predicted?.lifeSeq===l&&m.net.profilesReady&&m.controls.enabled,actor.lifeSeq);
  for(const c of h.clients)await until(()=>c.lifeSeq===p.lifeSeq,'bot failed to receive new life');
 }
 async function fire(page,actor,aim={x:1,y:0}){
  await page.waitForFunction(()=>!m.net.restoring&&m.controls.enabled&&!m.timeline.predicted?.rw?.locks?.skill&&performance.now()-(m.controls.lastFire.skill??-Infinity)>=100);
  await page.evaluate(aim=>m.controls.fire('skill',{aim,power:1}),aim);
  await until(()=>w.actionPending.get(actor.remoteId)?.some(a=>a.kind==='skill'),'student skill did not reach authority');
 }
 await setCase('emoji-151');await rival.keyboard.down('d');await fire(h.student,p);await ticks(12);
 for(const page of pages)await page.waitForFunction(()=>observed.warning);
 await rival.screenshot({path:dir+'/red-light.png'});await ticks(30);await rival.keyboard.up('d');
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
 for(let wave=0;wave<3;wave++){
  const aim=[{x:1,y:0},{x:0,y:1},{x:-1,y:0}][wave];
  await Promise.all([fire(h.student,p,aim),fire(rival,q,aim),...h.clients.map(async c=>{
   const actor=w.byId.get(c.session.playerId),ack=await c.command('ACTION',{kind:'skill',seq:1000+wave,aim,aimPower:1,castId:actor.rw?.recast?.ctx.castId||''});assert.equal(ack.accepted,true);
  })]);await ticks(45);
  for(const actor of g.participants){assert.equal(actor.rw.recast?.left??0,2-wave);if(wave<2)assert.equal(actor.cooldown,0);else assert.ok(actor.cooldown>0);}
  const wanted='재사용 '+(2-wave)+'/2';
  await h.student.waitForFunction(s=>document.getElementById('br-skill-count').textContent===s,wanted);
 }
 assert.equal(shots,480);assert.equal(h.room.students().filter(m=>m.connected).length,20);
 const screens=await Promise.all(pages.map(page=>page.evaluate(()=>{
   const p95=a=>[...a].sort((u,v)=>u-v)[Math.floor(a.length*.95)];
   return {maxShots:observed.maxShots,frames:observed.drawMs.length,drawP95:p95(observed.drawMs),gapP95:p95(observed.frameGaps),renderer:m.renderer.pixi?'pixi':'canvas'};
 })));
 for(const s of screens){assert.equal(s.renderer,renderer);assert.ok(s.maxShots>=1);assert.ok(s.frames>2);}
 snapshotSizes.sort((a,b)=>a-b);const used=process.cpuUsage(cpu);
 report.scissors={participants:20,uses:3,count:8,shots,peakShots,screens,elapsedMs:performance.now()-begin,cpuMs:(used.user+used.system)/1000,
  processRssBefore:rss,processRssAfter:process.memoryUsage.rss(),sentBytes:h.app.metrics.sentBytes-bytes,snapshotP95:snapshotSizes[Math.floor(snapshotSizes.length*.95)],snapshots:snapshotSizes.length};
 await h.command('END');await h.command('REMATCH');for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&m.renderer.textures.size===0);
 assert.deepEqual(h.errors,[]);report.status='PASS';console.log('v34 roster',renderer,'PASS',JSON.stringify(report.scissors));
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{report.ms=performance.now()-started;fs.writeFileSync(dir+'/result.json',JSON.stringify(report,null,2));await h.close();}
