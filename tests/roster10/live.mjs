// Short moving-combat evidence, not a tablet/FPS or 600-second load verdict.
// Authority advances only through the normal real-time 60 Hz runner/20 Hz WS pump.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';

const out='artifacts/roster10/live',started=performance.now(),report={status:'RUNNING',renderer:'canvas',configuredHz:{simulation:60,snapshots:20},physicalMobile:'NOT_RUN',rows:[]};
fs.mkdirSync(out,{recursive:true});
process.env.COMBAT_VIDEO_DIR??=path.join(out,'video');
let h,video;
const wait=async(label,predicate,timeout=2500)=>{const end=performance.now()+timeout;while(performance.now()<end){if(await predicate())return;await delay(20);}throw Error('TIMEOUT '+label);};
try{
 h=await auditHarness({players:1,mode:'team-capture',renderer:'canvas',quality:'balanced',viewport:{width:1024,height:768}});video=h.student.video();assert.ok(video,'attacker video enabled');
 const context=await h.browser.newContext({viewport:{width:1024,height:768}});h.contexts.push(context);await context.route(/dropbox/,r=>r.abort());
 const rival=await context.newPage();rival.on('pageerror',e=>h.errors.push(e.message));await rival.goto(h.url+'/?room='+h.room.code+'&renderer=canvas');await rival.locator('#br-player-name').fill('Synthetic live rival');await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();
 await h.battle();const pages=[h.student,rival,h.host],roles=['attacker','opponent','host'],w=h.room.world,[a,b]=h.room.students().map(m=>w.byId.get(m.id));
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];h.staticState();
 for(const page of pages)await page.evaluate(async()=>{
  window.m=await import('/src/main.js');window.liveFrames=[];window.liveEvents=[];
  const r=m.renderer,draw=r.draw.bind(r);
  r.draw=(view,now)=>{draw(view,now);const kinds=new Map(view.shots.map(s=>[s.id,s.kind]));for(const ring of view.dynamicWalls?.rings||[])kinds.set(ring.id,'ring-wall');
   liveFrames.push({at:now,tick:view.renderTick,pixi:!!r.pixi,blocked:!!r.renderBlocked,actors:view.actors.map(a=>({id:a.id,x:a.x,y:a.y})),visible:[...(r.roster10Visible||[])].map(id=>({id,kind:kinds.get(id)})),shots:view.shots.map(s=>({id:s.id,kind:s.kind,owner:s.owner,seq:s.actionSeq}))});if(liveFrames.length>240)liveFrames.shift();
  };
  m.net.addEventListener('event',e=>{liveEvents.push({type:e.detail.type,tick:e.detail.serverTick,kind:e.detail.data?.kind,owner:e.detail.data?.owner,source:e.detail.data?.sourceId});if(liveEvents.length>300)liveEvents.shift();});
 });
 for(const number of [141,142,143,144]){
  const id='emoji-'+number,expected={141:'decoy',142:'grapple',143:'ring-wall',144:'mushroom'}[number];
  await h.student.keyboard.up('s');await rival.keyboard.up('a');
  // Same private Participant fixture as flow.mjs. Replace content/life only
  // between cases; all movement, casts, cooldowns and lifetimes below are real.
  w.BRRework.clearWorld(w.game,'live-case');w.game.projectiles=[];w.game.retiredShots=[];w.game.zones=[];w.actionPending.clear();w.inputPending.clear();
  for(const [i,p]of [a,b].entries()){
   const ability=w.EMOJI_DB.find(q=>q.id===(i?'emoji-114':id)),remoteId=p.remoteId,life=p.lifeSeq+1,team=i+1;
   const fresh=new w.Participant(i+1,'Live '+i,ability,new w.Vec2(i?(number===144?400:450):0,0),team);
   Object.assign(p,fresh,{remoteId,sessionId:remoteId,lifeSeq:life,team,alive:true,humanControlled:true,connected:true,abilityId:ability.id,abilityIndex:w.EMOJI_DB.indexOf(ability),spawnProtectionUntilFrame:0,applyPlayerInput:w.brApplyPlayerInput,basicCooldown:0,cooldown:0,aimProfileKey:null,rw:null});w.brInitRun(p);w.session.inputs[remoteId]={};
  }
  b.hp=b.maxHp=100000;w.game.rebuildSpatialGrid();h.publish();
  await h.student.waitForFunction(({id,life})=>m.timeline.predicted?.abilityId===id&&m.net.lifeSeq===life&&m.controls.enabled&&m.renderer.enabled&&!m.net.restoring,{id,life:a.lifeSeq});
  for(const page of pages)await page.evaluate(()=>{liveFrames=[];liveEvents=[];});
  if(number===141)h.room.safePaused=false; // Harness setup pause ends once; never pause a case.
  assert.equal(h.room.safePaused,false);const tick=w.game.frame,snapshot=h.room.snapshotSeq,at=performance.now(),start={x:a.pos.x,y:a.pos.y,applied:a.lastAppliedSeq||0};
  const fire=kind=>h.student.evaluate(kind=>{const before=m.controls.actions[kind];m.controls.fire(kind,{aim:{x:1,y:0},power:1,tap:false});return {before,seq:m.controls.actions[kind],life:m.net.lifeSeq};},kind);
  await h.student.keyboard.down('s');
  const basic=await fire('attack');assert.equal(basic.seq,basic.before+1,id+' controls basic fire');await wait(id+' actual basic',()=>a.firedAttackSeq===basic.seq);
  const skill=await fire('skill');assert.equal(skill.seq,skill.before+1,id+' controls skill fire');await wait(id+' actual skill',()=>a.firedSkillSeq===skill.seq);
  if(number===144)await rival.keyboard.down('a'); // Walk into the armed trap through real INPUT, never teleport its victim.
  await wait(id+' live persistent draw',()=>h.student.evaluate(kind=>liveFrames.some(f=>f.visible.some(v=>v.kind===kind)),expected));
  // Capture while the short grapple is still relevant; the complete movement
  // remains in the attacker's continuously recorded video even after it expires.
  await Promise.all([rival,h.host].map((page,i)=>page.screenshot({path:`${out}/${id}-${roles[i+1]}.png`})));
  const remaining=2000-(performance.now()-at);if(remaining>0)await delay(remaining);
  await h.student.keyboard.up('s');await rival.keyboard.up('a');
  const screens=await Promise.all(pages.map(page=>page.evaluate(owner=>{
   const points=liveFrames.flatMap(f=>f.actors.filter(a=>a.id===owner)),ticks=[...new Set(liveFrames.map(f=>f.tick))];
   return {frames:liveFrames.length,ticks:ticks.length,firstTick:ticks[0],lastTick:ticks.at(-1),canvas:liveFrames.every(f=>!f.pixi&&!f.blocked),visibleKinds:[...new Set(liveFrames.flatMap(f=>f.visible.map(e=>e.kind)))],visibleIds:[...new Set(liveFrames.flatMap(f=>f.visible.map(e=>e.id)))],actorPositions:[...new Set(points.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)))].length,events:liveEvents.length};
  },a.remoteId)));
  const elapsed=performance.now()-at,row={id,expected,ms:elapsed,ticks:w.game.frame-tick,snapshots:h.room.snapshotSeq-snapshot,basic:{sent:basic.seq,fired:a.firedAttackSeq},skill:{sent:skill.seq,fired:a.firedSkillSeq,cooldown:a.cooldown},move:{from:start,to:{x:a.pos.x,y:a.pos.y,applied:a.lastAppliedSeq}},screens,paused:h.room.safePaused,status:'CHECKING'};report.rows.push(row);
  assert.equal(h.room.safePaused,false,id+' runner must stay active');assert.ok(row.ticks>=60,id+' actual server ticks advanced');assert.ok(row.snapshots>=10,id+' actual WS snapshots advanced');assert.ok(a.lastAppliedSeq>start.applied,id+' movement input applied');assert.ok(Math.hypot(a.pos.x-start.x,a.pos.y-start.y)>5,id+' actual movement');assert.ok(a.cooldown>0,id+' skill cooldown retained');
  for(const [i,s]of screens.entries()){assert.ok(s.canvas,id+' '+roles[i]+' actual Canvas');assert.ok(s.frames>=4&&s.ticks>=3,id+' '+roles[i]+' successive real frames');assert.ok(s.visibleKinds.includes(expected),id+' '+roles[i]+' visible '+expected);if(number===144)assert.ok(s.visibleKinds.includes('poison'),roles[i]+' mushroom armed and triggered live');}
  row.status='PASS';console.log('PASS live',id,row.ticks,'ticks',row.snapshots,'snapshots');
 }
 await h.command('END');await h.command('REMATCH');for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='LOBBY');assert.deepEqual(h.errors,[]);report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{
 if(h){report.errors=h.errors;report.metrics=h.app.metrics.report(h.app.manager);await h.close();}
 if(video){try{const saved=path.resolve(out,'attacker-live.webm');await video.saveAs(saved);report.video=saved;}catch(error){report.status='FAIL';report.videoError=error.message;process.exitCode=1;}}
 report.ms=performance.now()-started;report.scope='Four short unpaused Canvas combats on actual attacker/opponent/host WS screens; normal controls.fire and keyboard movement, no manual step/draw. Video is moving-combat evidence, not a long-load or physical-device verdict.';
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,ms:report.ms,video:report.video}));
}
