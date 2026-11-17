// Real WS/browser presentation, with a private authority fixture for exact contacts.
// This is deliberately separate from continuous-play/performance measurements.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',quality=process.argv[3]||'low',start=performance.now(),dir=`artifacts/v35-5/identity-${renderer}-${quality}`;fs.mkdirSync(dir,{recursive:true});
const h=await auditHarness({players:3,renderer,quality,mode:'solo',viewport:{width:1024,height:720},studentContext:{hasTouch:true}}),report={status:'FAIL',renderer,quality,rows:[],scope:'real WS; fixture-driven exact authority contacts, not continuous-play evidence'};
try{
 const bot=h.clients.shift(),context=await h.browser.newContext({viewport:{width:1024,height:720},hasTouch:true});h.contexts.push(context);await context.addInitScript(token=>sessionStorage.setItem('dsbr-resume',token),bot.session.token);await context.route(/dropbox/,r=>r.abort());const other=await context.newPage();other.on('pageerror',e=>h.errors.push(e.message));await other.goto(h.url+'/?renderer='+renderer);await other.locator('#br-student-wait').waitFor();await bot.close();
 const pages=[h.student,other,h.host];await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');h.room.students().forEach(p=>p.draft.abilityId='emoji-114');h.room.fixtureFrozen=true;await h.command('START_BATTLE');
 const w=h.room.world,g=w.game,R=w.BRRework,ps=g.participants,v=(x,y=0)=>new w.Vec2(x,y);
 for(const page of pages)await page.evaluate(async()=>{
  window.m=await import('/src/main.js');window.observed={events:[],frames:[],sounds:[]};
  m.net.addEventListener('event',e=>{observed.events.push(e.detail);if(observed.events.length>800)observed.events.shift();});
  const draw=m.renderer.draw.bind(m.renderer);m.renderer.draw=(view,t)=>{observed.frames.push({tick:view.renderTick,shots:view.shots.map(q=>({id:q.id,owner:q.owner,radius:q.radius,style:q.style,color:q.color,returned:q.returned,crit:q.crit,giant:q.giant})),fx:view.effects.map(f=>({style:f.style,kind:f.kind,terminal:f.terminal}))});if(observed.frames.length>160)observed.frames.shift();return draw(view,t);};
  const action=m.audio.action.bind(m.audio);m.audio.action=(...args)=>{observed.sounds.push(args[0]);return action(...args);};
 });
 async function ticks(n){for(let i=0;i<n;i++){stepWorld(w);if(i%3===2||i===n-1){h.publish();await delay(55);
  // This exact-contact fixture owns the simulation clock. Do not read an old
  // browser observation merely because a fixed 55ms sleep elapsed; ordered WS
  // receipt of this snapshot also proves receipt of its preceding shot events.
  // Real-time load/latency assertions live in overdrive355-live, unchanged.
  await Promise.all(pages.map(p=>p.waitForFunction(t=>(window.m||window.auditApp)?.timeline.samples.at(-1)?.state.serverTick>=t,g.frame)));
 }}}
 async function reset(id,op='emoji-114'){
  R.clearWorld(g,'identity355');g.projectiles=[];g.zones=[];g.smokes=[];g.walls=[];w.brFarm.dispose(g);g.finalPhaseTriggered=true;w.actionPending.clear();w.inputPending.clear();
  for(const [i,p]of ps.entries()){
   const ability=w.EMOJI_DB.find(a=>a.id===(i===0?id:op)),pid=p.remoteId,life=p.lifeSeq+1;
   Object.assign(p,new w.Participant(i+1,'Synthetic '+i,ability,v(i*400),0),{remoteId:pid,sessionId:pid,lifeSeq:life,abilityId:ability.id,humanControlled:true,connected:true,applyPlayerInput:w.brApplyPlayerInput,aimProfileKey:null,rw:null,cooldown:0,basicCooldown:0,spawnProtectionUntilFrame:0,hp:10000,maxHp:10000});w.brInitRun(p);w.session.inputs[pid]={};
  }
  g.rebuildSpatialGrid();h.staticState();await ticks(6);for(const page of pages){await page.waitForFunction(()=>m.timeline.samples.length>0);await page.evaluate(()=>{observed.events=[];observed.frames=[];observed.sounds=[];});}
 }
 async function fire(kind='skill'){
  await h.student.waitForFunction(k=>m.controls.state(k).canFire,kind);await h.student.locator('#br-'+kind).click();
  for(let i=0;i<80&&!w.actionPending.get(ps[0].remoteId)?.length;i++)await delay(10);assert.ok(w.actionPending.get(ps[0].remoteId)?.length,'browser action reached server');await ticks(1);
 }
 async function records(){return Promise.all(pages.map(p=>p.evaluate(()=>observed)));}
 await reset('emoji-092','emoji-137');await fire();assert.ok(ps[0].rw.buffs.some(b=>b.kind==='panParry'));
 const shot=new w.Projectile(ps[1],ps[1].pos,v(-1),65,36,9,'bullet','#fde047',0,null,{rangeRemaining:1070});g.projectiles.push(shot);await ticks(12);
 for(const page of pages)await page.waitForFunction(()=>observed.frames.some(f=>f.shots.some(q=>q.returned)||f.fx.some(q=>q.style==='pan-contact')),null,{timeout:5000});
 let rows=await records();assert.equal(rows[0].sounds.filter(s=>s==='parry').length,1);assert.equal(shot.reflectedOnce,true);for(const r of rows){assert.ok(r.events.some(e=>e.type==='SHOT_TURN'&&e.data.returned),'actual return received');assert.ok(r.frames.some(f=>f.shots.some(q=>q.returned)||f.fx.some(q=>q.style==='pan-contact')),'return/contact rendered');}await h.student.screenshot({path:dir+'/pan-contact.png'});report.rows.push({name:'parry original projectile / attacker-defender-host',status:'PASS',pages:rows.map(r=>({returns:r.events.filter(e=>e.type==='SHOT_TURN').length,frames:r.frames.length}))});
 await reset('emoji-075');await fire();await ticks(22);rows=await records();for(const r of rows)assert.equal(r.events.filter(e=>e.type==='SHOT_SPAWN'&&e.data.style==='apple-fragment').length,8);report.rows.push({name:'eight authoritative apple fragments / three screens',status:'PASS'});
 await reset('emoji-094');await fire();await ticks(9);rows=await records();for(const r of rows){const colors=r.events.filter(e=>e.type==='SHOT_SPAWN').sort((a,b)=>a.data.ordinal-b.data.ordinal).map(e=>e.data.style);assert.deepEqual(colors,['crayon-0','crayon-1','crayon-2','crayon-3']);assert.ok(r.frames.some(f=>f.shots.some(q=>q.style?.startsWith('crayon-'))));}await h.host.screenshot({path:dir+'/crayon-colors.png'});report.rows.push({name:'four colors / Canvas-Pixi shared shapes / three screens',status:'PASS'});
 for(const id of ['emoji-137','emoji-023','emoji-074']){
  await reset(id);await fire();if(id==='emoji-023'){const pending=await records();assert.equal(pending[0].sounds.filter(s=>s==='sniper').length,0);assert.ok(pending.every(r=>!r.events.some(e=>e.type==='SHOT_SPAWN')));}await ticks(42);rows=await records();assert.equal(rows[0].sounds.filter(s=>s==='sniper').length,1,id+' confirmed launch sound once');
  for(const r of rows)assert.ok(r.events.some(e=>e.type==='SHOT_SPAWN'&&e.data.crit!==undefined),id+' original projectile received');
  report.rows.push({name:id+' confirmed shot/sound/terminal',status:'PASS',pages:rows.map(r=>({shots:r.events.filter(e=>e.type==='SHOT_SPAWN').length,terminalDraws:r.frames.filter(f=>f.fx.some(e=>e.kind==='transit')).length}))});
 }
 for(const path of ['rapid','wide']){
  await reset(path==='wide'?'emoji-092':'emoji-137');const p=ps[0];p.run.paths={[path]:2};p.run.level=4;p.run.choices=2;p.run.pending=1;w.brRecomputeRun(p);p.run.offer={id:'identity-'+path,cards:[w.brRunCard(p,path,3)]};assert.ok(w.brChooseRun(p,p.run.offer.id,path));await ticks(6);rows=await records();
  for(const r of rows){assert.equal(r.events.filter(e=>e.type==='FX'&&e.data.style==='overdrive-'+path).length,1);assert.ok(r.frames.some(f=>f.fx.some(e=>e.style==='overdrive-'+path)));}await h.student.screenshot({path:dir+'/'+path+'-iii.png'});report.rows.push({name:path+' III confirmed once / three screens',status:'PASS'});
 }
 await reset('emoji-137');ps[0].run.paths={giant:2};ps[0].run.level=4;ps[0].run.choices=2;ps[0].run.pending=1;w.brRecomputeRun(ps[0]);ps[0].run.offer={id:'identity-tier3',cards:[w.brRunCard(ps[0],'giant',3)]};assert.ok(w.brChooseRun(ps[0],'identity-tier3','giant'));assert.equal(w.brChooseRun(ps[0],'identity-tier3','giant'),false);await ticks(6);await fire('attack');await ticks(4);rows=await records();
 for(const r of rows){assert.equal(r.events.filter(e=>e.type==='FX'&&e.data.style==='overdrive-giant').length,1);assert.ok(r.frames.some(f=>f.shots.some(q=>q.giant===3.4)));}await h.host.screenshot({path:dir+'/giant-iii.png'});
 await h.student.reload();await h.student.evaluate(async()=>{window.auditApp=await import('/src/main.js');});await h.student.waitForFunction(()=>window.auditApp&&!auditApp.net.restoring&&auditApp.controls.enabled);await ticks(9);assert.equal(await h.student.evaluate(()=>auditApp.timeline.effects.some(f=>f.style==='overdrive-giant')),false);report.rows.push({name:'GIANT III actual body/outline and one choice effect; resume no replay',status:'PASS'});
 await h.command('END');await h.command('REMATCH');await h.student.locator('#br-student-wait').waitFor();assert.deepEqual(h.errors,[]);report.status='PASS';
}catch(e){report.error=e.stack;report.observed=await Promise.all(h.browser.contexts().flatMap(c=>c.pages()).map(p=>p.evaluate(()=>({sounds:window.observed?.sounds,events:window.observed?.events.slice(-35),frames:window.observed?.frames.slice(-15),renderTick:window.m?.timeline.renderTick,life:window.m?.net.lifeSeq})).catch(()=>null)));for(const [i,p]of [h.host,h.student].entries())await p.screenshot({path:dir+'/failure-'+i+'.png'}).catch(()=>{});throw e;}
finally{report.ms=performance.now()-start;report.errors=h.errors;fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));await h.close();console.log(JSON.stringify(report));}
