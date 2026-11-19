// Real WS/browser presentation, with a private authority fixture for exact contacts.
// This is deliberately separate from continuous-play/performance measurements.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {batchFixture} from '../simulation-fixture.mjs';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',quality=process.argv[3]||'low',start=performance.now(),dir=`artifacts/v35-6/identity-${renderer}-${quality}`;fs.mkdirSync(dir,{recursive:true});
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
  window.m=await import('/src/main.js');window.observed={events:[],frames:[],sounds:[],poses:[]};
  m.net.addEventListener('event',e=>{observed.events.push({...e.detail,observedAt:performance.now(),pendingSound:m.controls.sounds.get('skill')||null});if(observed.events.length>800)observed.events.shift();});
  const draw=m.renderer.draw.bind(m.renderer);m.renderer.draw=(view,t)=>{observed.frames.push({tick:view.renderTick,sourceTick:m.timeline.samples.at(-1)?.state.serverTick,shots:view.shots.map(q=>({id:q.id,owner:q.owner,radius:q.radius,style:q.style,color:q.color,returned:q.returned,crit:q.crit,giant:q.giant})),fx:view.effects.map(f=>({style:f.style,kind:f.kind,terminal:f.terminal}))});if(observed.frames.length>160)observed.frames.shift();return draw(view,t);};
  const sample=m.renderer.poses.sample.bind(m.renderer.poses);m.renderer.poses.sample=(actor,zoom,...args)=>{
   const result=sample(actor,zoom,...args);
   if(result){observed.poses.push({id:actor.id,at:performance.now(),...result,xCss:result.x*zoom,yCss:result.y*zoom,attack:m.renderer.poses.active.get(actor.id)?.family,hurtKind:m.renderer.poses.hurts.get(actor.id)?.family});if(observed.poses.length>500)observed.poses.shift();}
   return result;
  };
  const action=m.audio.action.bind(m.audio);m.audio.action=(...args)=>{observed.sounds.push(args[0]);return action(...args);};
 });
 async function ticks(n){
  for(let i=0;i<n;i++){
   batchFixture(h.room,()=>stepWorld(w));if(i%3!==2&&i!==n-1)continue;
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
  R.clearWorld(g,'identity356');g.projectiles=[];g.zones=[];g.smokes=[];g.walls=[];w.brFarm.dispose(g);g.finalPhaseTriggered=true;w.actionPending.clear();w.inputPending.clear();
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
 await reset('emoji-025');await fire('attack');await ticks(6);
 await checkPoses('heavy MISS: attack body without victim hurt',p=>p.id===ps[0].remoteId&&p.attack==='heavy');
 assert.equal((await records()).some(r=>r.poses.some(p=>p.id===ps[1].remoteId&&p.hurt>0)),false);
 // Two real input commands share an authority tick; confirmed incoming HP loss
 // must not erase the target's simultaneously executing attack body channel.
 await reset('emoji-025','emoji-042');ps[1].pos=v(100);g.rebuildSpatialGrid();h.publish();
 await other.locator('#br-attack').click();await fire('attack');await ticks(6);
 assert.ok(ps[1].hp<10000);await checkPoses('confirmed HP hit with preserved own attack',p=>p.id===ps[1].remoteId&&p.hurt>0&&!!p.attack);
 await h.student.screenshot({path:dir+'/attack-hurt.png'});
 // Native Wall defaults to a random spin. This fixture asserts an axis-aligned
 // boundary at x=210, so its private wall must explicitly remain stationary.
 await reset('emoji-025');ps[0].pos=v(-200);ps[1].pos=v(100);g.walls=[Object.assign(new w.Wall(220,0,20,400,0),{spinSpeed:0})];g.rebuildSpatialGrid();h.staticState();await ticks(3);
 report.wallBefore=authorityEvidence();const wallHp=ps[1].hp,c=R.context(ps[0],g,v(1));c.actionKind='skill';assert.equal(R.impulse(c,ps[1],v(1),42),true);report.wallImpulse=authorityEvidence();await ticks(12);report.wallAfter=authorityEvidence();
 assert.equal(ps[1].hp,wallHp);assert.ok(ps[1].pos.x<=210-ps[1].radius+.01);
 let rows=await checkPoses('actual wall normal: one bounded body rebound',p=>p.id===ps[1].remoteId&&p.wall>0);
 for(const r of rows)assert.equal(r.events.filter(e=>e.type==='FX'&&e.data.style==='heavy-wall').length,1);
 await h.host.screenshot({path:dir+'/wall-contact.png'});await ticks(18);
 for(const r of await records())assert.equal(r.events.filter(e=>e.type==='FX'&&e.data.style==='heavy-wall').length,1);
 await reset('emoji-025');ps[0].pos=v(-200);ps[1].pos=v(210-ps[1].radius-5);g.walls=[Object.assign(new w.Wall(220,0,20,400,0),{spinSpeed:0})];g.rebuildSpatialGrid();h.staticState();await ticks(15);
 for(const r of await records())assert.ok(!r.events.some(e=>e.data.style==='heavy-wall')&&!r.poses.some(p=>p.wall>0));
 report.rows.push({name:'wall proximity without actual impulse/contact has no rebound',status:'PASS'});
 await reset('emoji-001');const shieldContext=R.context(ps[0],g,v(1));R.shield(shieldContext,ps[1],100,180);const shieldHp=ps[1].hp;
 R.hit(shieldContext,ps[1],10,{knockback:0,direction:v(1)});await ticks(9);assert.equal(ps[1].hp,shieldHp);
 for(const r of await records()){assert.ok(r.events.some(e=>e.type==='FX'&&e.data.geometry?.absorbed>0));assert.ok(!r.poses.some(p=>p.id===ps[1].remoteId&&p.hurt>0));}
 report.rows.push({name:'full shield absorption: rim preserved, no HP hurt body',status:'PASS'});
 await reset('emoji-092','emoji-137');await fire();const shot=new w.Projectile(ps[1],ps[1].pos,v(-1),65,36,9,'bullet','#fde047',0,null,{rangeRemaining:1070});g.projectiles.push(shot);await ticks(12);
 assert.equal(shot.reflectedOnce,true);await checkPoses('actual authority reflection: return body and original shot turn',p=>p.id===ps[0].remoteId&&p.reflection>0);
 for(const r of await records())assert.ok(r.events.some(e=>e.type==='SHOT_TURN'&&e.data.returned));
 for(const id of ['emoji-094','emoji-023','emoji-025','emoji-148']){
  // Goblin's skill grants a shield/buff; its actual club attack owns the pose.
  await reset(id);await fire(['emoji-025','emoji-148'].includes(id)?'attack':'skill');await ticks(id==='emoji-023'?42:12);
  const data=await records();for(const r of data)assert.ok(r.poses.some(p=>p.id===ps[0].remoteId&&p.attack),id+' actual body on three views');
  if(id==='emoji-023'){assert.ok(ps[1].hp<10000);for(const r of data){assert.ok(r.events.some(e=>e.type==='SHOT_END'));assert.ok(r.frames.some(f=>f.fx.some(e=>e.kind==='transit')));}}
  report.rows.push({name:id+' distinct actual attack/skill body',status:'PASS',specialSound:id==='emoji-023'?'EXCLUDED_BY_USER':'N/A'});
 }
 await reset('emoji-001');for(const page of pages)await page.evaluate(()=>m.renderer.session.reducedMotion=true);
 R.hit(R.context(ps[0],g,v(1)),ps[1],15,{knockback:0,direction:v(1)});await fire('attack');await ticks(12);
 for(const r of await records())assert.equal(r.poses.length,0);report.rows.push({name:'reduced-motion: no affine body deformation',status:'PASS'});
 for(const page of pages)await page.evaluate(()=>m.renderer.session.reducedMotion=false);
 await h.student.reload();await h.student.evaluate(async()=>{window.m=await import('/src/main.js');});await h.student.waitForFunction(()=>!m.net.restoring&&m.controls.enabled);await ticks(12);
 assert.deepEqual(await h.student.evaluate(()=>['active','hurts','walls'].map(k=>m.renderer.poses[k].size)),[0,0,0]);
 await h.command('END');await h.command('REMATCH');for(const page of pages){await page.waitForFunction(()=>m.ui.room.phase==='LOBBY');assert.deepEqual(await page.evaluate(()=>['active','hurts','walls','contacts'].map(k=>m.renderer.poses[k].size)),[0,0,0,0]);}
 assert.deepEqual(h.errors,[]);report.rows.push({name:'reconnect/rematch clears attack, hurt and wall lifetimes',status:'PASS'});report.status='PASS';
}catch(error){report.error=error.stack;report.authorityFailure=authorityEvidence();report.observed=await Promise.all(h.browser.contexts().flatMap(c=>c.pages()).map(p=>p.evaluate(()=>({poses:window.observed?.poses.slice(-25),events:window.observed?.events.slice(-15)})).catch(()=>null)));throw error;}
finally{report.ms=performance.now()-start;report.errors=h.errors;fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));await h.close();console.log(JSON.stringify({status:report.status,ms:report.ms,rows:report.rows.length,dir}));}
