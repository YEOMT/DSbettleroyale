// Real WS/browser presentation, with a private authority fixture for exact contacts.
// This is deliberately separate from continuous-play/performance measurements.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {installDeliveryProbe} from './delivery-probe.mjs';
import {selectedScenes} from './overdrive357-scenes.mjs';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',quality=process.argv[3]||'low',start=performance.now(),dir=`artifacts/v35-7/identity-${renderer}-${quality}`;fs.mkdirSync(dir,{recursive:true});
const h=await auditHarness({players:3,renderer,quality,mode:'solo',viewport:{width:1024,height:720},studentContext:{hasTouch:true}}),report={status:'FAIL',renderer,quality,environment:{browser:process.env.PLAYWRIGHT_CHANNEL||'chromium',built:process.env.LOAD_BUILT==='1',physicalDevices:false},rows:[],scope:'real WS; fixture-driven exact authority contacts, not continuous-play evidence'};
let authorityEvidence=()=>null;
try{
 const bot=h.clients.shift(),context=await h.browser.newContext({viewport:{width:1024,height:720},hasTouch:true});h.contexts.push(context);await context.addInitScript(token=>sessionStorage.setItem('dsbr-resume',token),bot.session.token);await context.route(/dropbox/,r=>r.abort());const other=await context.newPage();other.on('pageerror',e=>h.errors.push(e.message));await other.goto(h.url+'/?renderer='+renderer);await other.locator('#br-student-wait').waitFor();await bot.close();
 const pages=[h.student,other,h.host];await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');h.room.students().forEach(p=>p.draft.abilityId='emoji-114');h.room.fixtureFrozen=true;await h.command('START_BATTLE');
 const w=h.room.world,g=w.game,R=w.BRRework,ps=g.participants,v=(x,y=0)=>new w.Vec2(x,y);
 authorityEvidence=()=>({tick:g.frame,actors:ps.map((p,i)=>({index:i,x:p.pos.x,y:p.pos.y,radius:p.radius,hp:p.hp,life:p.lifeSeq,impulse:p.rw?.impulse?{x:p.rw.impulse.x,y:p.rw.impulse.y,end:p.rw.impulse.end,wallDone:p.rw.impulse.wallDone,visualWallDone:p.rw.impulse.visualWallDone,castId:p.rw.impulse.ctx.castId}:null})),walls:g.walls.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,angle:b.angle,spinSpeed:b.spinSpeed}))});
 report.wallContacts=[];const emitFx=g.emitStudentFx;
 g.emitStudentFx=function(kind,pos,options){if(options?.style==='heavy-wall')report.wallContacts.push({kind,pos:{x:pos.x,y:pos.y},...options,authority:authorityEvidence()});return emitFx.apply(this,arguments);};
 for(const page of pages)await page.evaluate(async()=>{
  window.m=await import('/src/main.js');window.observed={events:[],frames:[],sounds:[],poses:[],accepted:[]};
  const accept=m.renderer.poses.accept.bind(m.renderer.poses);m.renderer.poses.accept=(event,actors,now)=>{accept(event,actors,now);const id=event.data?.owner||event.data?.sourceId;const entry=m.renderer.poses.active.get(id);if(entry){observed.accepted.push({id,event:event.type,tick:event.serverTick,at:now,entry:{...entry}});if(observed.accepted.length>100)observed.accepted.shift();}};
  m.net.addEventListener('event',e=>{observed.events.push({...e.detail,observedAt:performance.now(),pendingSound:m.controls.sounds.get('skill')||null});if(observed.events.length>800)observed.events.shift();});
  const draw=m.renderer.draw.bind(m.renderer);m.renderer.draw=(view,t)=>{observed.frames.push({tick:view.renderTick,sourceTick:m.timeline.samples.at(-1)?.state.serverTick,shots:view.shots.map(q=>({id:q.id,owner:q.owner,radius:q.radius,style:q.style,color:q.color,returned:q.returned,crit:q.crit,giant:q.giant})),fx:view.effects.map(f=>({style:f.style,kind:f.kind,terminal:f.terminal}))});if(observed.frames.length>160)observed.frames.shift();return draw(view,t);};
  const sample=m.renderer.poses.sample.bind(m.renderer.poses);m.renderer.poses.sample=(actor,zoom,...args)=>{
   const result=sample(actor,zoom,...args);
   if(result){observed.poses.push({id:actor.id,at:performance.now(),...result,xCss:result.x*zoom,yCss:result.y*zoom,attack:m.renderer.poses.active.get(actor.id)?.family,hurtKind:m.renderer.poses.hurts.get(actor.id)?.family});if(observed.poses.length>500)observed.poses.shift();}
   return result;
  };
  const action=m.audio.action.bind(m.audio);m.audio.action=(...args)=>{observed.sounds.push(args[0]);return action(...args);};
 });
 for(const page of pages)await installDeliveryProbe(page);
 async function ticks(n){
  for(let i=0;i<n;i++){
   stepWorld(w);if(i%3!==2&&i!==n-1)continue;
   h.publish();await delay(55);
   // This is a manually stepped contact fixture, not a real-time benchmark.
   // Do not advance its authority clock beyond an unobserved browser frame.
   // Otherwise software WebGL can receive a shot only after the fixture has
   // already stepped past its whole 150ms trail. Continuous tests stay live.
   await Promise.all(pages.map(p=>p.waitForFunction(t=>{
    const app=window.m||window.auditApp;
    return app?.timeline.samples.at(-1)?.state.serverTick>=t&&(!window.observed||observed.frames.some(f=>f.sourceTick>=t));
   },g.frame)));
  }
 }
 async function reset(id,op='emoji-114'){
  R.clearWorld(g,'identity357');g.projectiles=[];g.zones=[];g.smokes=[];g.walls=[];w.brFarm.dispose(g);g.finalPhaseTriggered=true;w.actionPending.clear();w.inputPending.clear();
  for(const [i,p]of ps.entries()){
   const ability=w.EMOJI_DB.find(a=>a.id===(i===0?id:op)),pid=p.remoteId,life=p.lifeSeq+1;
   Object.assign(p,new w.Participant(i+1,'Synthetic '+i,ability,v(i*400),0),{remoteId:pid,sessionId:pid,lifeSeq:life,abilityId:ability.id,humanControlled:true,connected:true,applyPlayerInput:w.brApplyPlayerInput,aimProfileKey:null,rw:null,cooldown:0,basicCooldown:0,spawnProtectionUntilFrame:0,hp:10000,maxHp:10000});w.brInitRun(p);w.session.inputs[pid]={};
  }
  g.rebuildSpatialGrid();h.staticState();await ticks(6);for(const page of pages){await page.waitForFunction(()=>m.timeline.samples.length>0);await page.evaluate(()=>{observed.events=[];observed.frames=[];observed.sounds=[];observed.poses=[];});}
 }
 async function fire(kind='skill'){
  await h.student.waitForFunction(k=>m.controls.state(k).canFire,kind);await h.student.locator('#br-'+kind).click();
  for(let i=0;i<80&&!w.actionPending.get(ps[0].remoteId)?.length;i++)await delay(10);assert.ok(w.actionPending.get(ps[0].remoteId)?.length,'browser action reached server');await ticks(1);
 }
 async function records(){return Promise.all(pages.map(p=>p.evaluate(()=>observed)));}
 async function checkPoses(name,predicate){
  const rows=await records();for(const row of rows)assert.ok(row.poses.some(predicate),name+' on attacker/opponent/host');
  for(const row of rows)for(const p of row.poses){assert.ok(Number.isFinite(p.x+p.y+p.rotation+p.squash));assert.ok(Math.abs(p.rotation)<=.4);}
  report.rows.push({name,status:'PASS',samples:rows.map(r=>r.poses.length)});return rows;
 }

 const scenes=selectedScenes(process.env.OVERDRIVE_GROUP,process.env.OVERDRIVE_PATHS);
 report.selected=scenes.map(s=>s[0]);
 for(const [path,id]of scenes){
  await reset('emoji-'+id,'emoji-137');const p=ps[0],q=ps[1];p.run.level=4;p.run.pending=3;
  for(let tier=1;tier<=3;tier++){
   const alternatives=Object.keys(w.BR_RUN_PATHS).filter(k=>k!==path&&w.brRunEffectiveNext(p,k)).slice(0,2);
   const card=w.brRunCard(p,path,tier);p.run.offer={id:'identity357-'+path+'-'+tier,level:tier+1,cards:[card,...alternatives.map(k=>w.brRunCard(p,k,(p.run.paths[k]||0)+1))]};p.run.revision++;h.publish();
   const button=h.student.locator('[data-run-path='+path+']');await button.waitFor();assert.ok((await button.textContent()).includes(card.name));await button.click();
   for(let i=0;i<80&&p.run.paths[path]!==tier;i++)await delay(10);assert.equal(p.run.paths[path],tier,'real AUGMENT_CHOOSE accepted');
   await ticks(3);await h.student.waitForFunction(({path,tier})=>m.timeline.predicted?.run?.paths[path]===tier,{path,tier});
   const rendered=await h.student.evaluate(()=>({mods:m.timeline.predicted.run.mods,chips:[...document.querySelectorAll('#br-run-owned .br-run-chip')].map(n=>n.title),aim:m.timeline.predicted.aimProfiles}));
   assert.deepEqual(rendered.mods,p.run.mods);assert.ok(rendered.chips.some(c=>c.includes(card.effect)));
  }
  q.pos=v(path==='control'||path==='impact'?100:450);q.combatPreviousX=q.pos.x;q.combatPreviousY=0;g.rebuildSpatialGrid();h.publish();
  const expected=w.brAimSpec(p.ability,'skill',p.radius,1,p.run.mods);await ticks(3);
  const aim=await h.student.evaluate(()=>m.timeline.predicted.aimProfiles.skill.spec);
  for(const key of ['width','radius','range'])if(Number.isFinite(expected[key]))assert.ok(Math.abs(aim[key]-expected[key])<1e-7,path+' '+key+' authority guide');
  const hp=q.hp;await fire(path==='heavy'||path==='impact'?'attack':'skill');await ticks(48);
  const data=await records();for(const r of data){assert.ok(r.frames.length>0);if(['heavy','impact','quick','control','expansion','amplify'].includes(path))assert.ok(r.poses.some(pose=>pose.id===p.remoteId&&pose.attack),path+' v35.6 body preserved');}
  if(path==='expansion')for(const r of data)assert.ok(r.frames.some(f=>f.shots.some(s=>Math.abs(s.radius-67.5)<1e-6)),'expanded real shot on attacker/opponent/host');
  if(path==='control'){assert.ok(q.hp<hp);assert.ok(q.stunned>80);for(const page of pages){const stun=await page.evaluate(id=>m.timeline.samples.at(-1).state.actors.find(p=>p.id===id)?.rw?.stunEnd,q.remoteId);assert.ok(stun>g.frame,'authoritative stun expiry on all surfaces');}}
  if(path==='heavy'||path==='impact')assert.ok(q.hp<hp,'confirmed augmented basic hit');
  if(['expansion','control','heavy'].includes(path))await h.student.screenshot({path:dir+'/'+path+'.png'});
  report.rows.push({path,id,status:'PASS',mods:{...p.run.mods},aim:expected,actualDamage:hp-q.hp,frames:data.map(r=>r.frames.length),poseSamples:data.map(r=>r.poses.length)});
 }
 await h.command('END');await h.command('REMATCH');for(const page of pages){await page.waitForFunction(()=>m.ui.room.phase==='LOBBY');assert.deepEqual(await page.evaluate(()=>['active','hurts','walls','contacts'].map(k=>m.renderer.poses[k].size)),[0,0,0,0]);}
 assert.deepEqual(h.errors,[]);report.status='PASS';
}catch(error){report.error=error.stack;report.authorityFailure=authorityEvidence();report.failureViews=await Promise.all(h.browser.contexts().flatMap(c=>c.pages()).map(async p=>({wire:p.deliveryWire,view:await p.evaluate(()=>({observed:window.observed,delivery:window.deliveryObserved,active:[...(window.m||window.auditApp).renderer.poses.active],now:performance.now()}))})));throw error;}
finally{report.ms=performance.now()-start;report.errors=h.errors;report.delivery=await Promise.all(h.browser.contexts().flatMap(c=>c.pages()).map(async p=>({wire:p.deliveryWire,view:await p.evaluate(()=>window.deliveryObserved)})));fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));await h.close();console.log(JSON.stringify({status:report.status,ms:report.ms,rows:report.rows.length,dir}));}
