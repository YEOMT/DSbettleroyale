import fs from 'node:fs';
import assert from 'node:assert/strict';
import {stepWorld} from '../../packages/engine/src/index.js';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
const renderer=process.argv[2]||'canvas',dir='artifacts/combat',started=Date.now(),report={renderer,checks:[]};
fs.mkdirSync(dir,{recursive:true});
const h=await auditHarness({players:1,renderer,quality:'low',mode:'team-elim'});
const wait=async(label,pred,ms=6500)=>{for(let end=Date.now()+ms;Date.now()<end;){if(await pred())return;await delay(30);}throw Error('TIMEOUT '+label);};
const app=p=>p.evaluate(async()=>{window.gameTest=await import('/src/main.js');});
const screens=[];
try{
 const attacker=h.student,ctx=await h.browser.newContext({viewport:{width:1366,height:768}});h.contexts.push(ctx);
 const rival=await ctx.newPage();rival.on('pageerror',e=>h.errors.push(e.message));
 await rival.goto(h.url+'/?renderer='+renderer+'&room='+h.room.code);await rival.locator('#br-player-name').fill('Rival');await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();
 await h.battle();const w=h.room.world,players=h.room.students().map(s=>w.byId.get(s.id)),[p,other]=players;
 w.game.walls=[];w.game.smokes=[];w.brFarm.dispose(w.game);w.game.zones=[];w.game.projectiles=[];
 for(const [i,actor]of players.entries()){
  const id=actor.remoteId,team=actor.team,life=actor.lifeSeq+1,a=w.EMOJI_DB.find(a=>a.id===(i?'emoji-001':'emoji-024'));
  const fresh=new w.Participant(i+1,'Fixture '+i,a,new w.Vec2(820+i*460,320),team);
  Object.assign(actor,fresh,{remoteId:id,sessionId:id,lifeSeq:life,team,alive:true,connected:true,humanControlled:true,abilityId:a.id,spawnProtectionUntilFrame:0,applyPlayerInput:w.brApplyPlayerInput,basicCooldown:0,cooldown:0});
  w.brInitRun(actor);actor.aimProfileKey=null;actor.rw=null;w.session.inputs[id]={};
 }
 h.staticState();h.publish();const pages=[attacker,rival,h.host];await Promise.all(pages.map(app));
 for(const page of pages)await page.waitForFunction(()=>gameTest.renderer.ctx||gameTest.renderer.pixi);
 await attacker.waitForFunction(life=>gameTest.net.lifeSeq===life,p.lifeSeq);
 const observe=page=>page.evaluate(()=>{const r=gameTest.renderer,draw=r.draw.bind(r);window.seenActions=[];r.draw=(v,t)=>{draw(v,t);for(const q of v.shots){if(!q.preview&&!seenActions.some(a=>a.id===q.id))seenActions.push({id:q.id,kind:q.actionKind,seq:q.actionSeq,owner:q.owner,type:q.type});}for(const fx of v.effects)if(fx.id&&!seenActions.some(a=>a.id===fx.id))seenActions.push({id:fx.id,kind:fx.geometry?.kind,seq:fx.geometry?.seq,owner:fx.sourceId,style:fx.kind});if(seenActions.length>400)seenActions.splice(0,200);};});
 await Promise.all(pages.map(observe));
 // Seed through the real wire while paused; retain the received-but-not-applied floor.
 await attacker.evaluate(()=>{gameTest.controls.seq=100000;gameTest.controls.clientTick=100000;gameTest.controls.actions={attack:1000,skill:1000};gameTest.controls.sendSample({x:0,y:0},true);});
 await attacker.keyboard.press('Space');await attacker.keyboard.press('q');
 await wait('high action queues',()=>w.actionPending.get(p.remoteId)?.length===2);
 h.room.safePaused=false;
 await wait('both real casts',()=>p.firedAttackSeq===1001&&p.firedSkillSeq===1001);
 const id=p.remoteId,oldEpoch=h.room.students()[0].epoch,identity={id,team:p.team,ability:p.ability.id,life:p.lifeSeq,level:p.run.level};
 await attacker.reload();await app(attacker);await attacker.locator('#br-student-battle').waitFor();
 await attacker.waitForFunction(()=>!gameTest.net.restoring&&gameTest.timeline.predicted?.alive&&gameTest.controls.seq>=100000);
 assert.equal(h.room.students()[0].epoch,oldEpoch+1);assert.deepEqual({id:p.remoteId,team:p.team,ability:p.ability.id,life:p.lifeSeq,level:p.run.level},identity);
 await observe(attacker);const x=p.pos.x;await attacker.keyboard.down('d');await wait('applied move after refresh',()=>p.pos.x>x+30&&p.lastAppliedSeq>100000);await attacker.keyboard.up('d');
 report.checks.push({id:'T04',playerRestored:true,applied:p.lastAppliedSeq,moved:p.pos.x-x});
 // A true transport interruption (not merely toggling an offline indicator).
 await attacker.evaluate(()=>{window.lateSocket=gameTest.net.ws;});
 const epoch=h.room.students()[0].epoch;
 const binding=h.room.students()[0];await attacker.context().setOffline(true);binding.peer.socket.terminate();await wait('socket closed',()=>!binding.connected);await attacker.context().setOffline(false);
 await wait('fresh binding',()=>binding.epoch===epoch+1);await attacker.waitForFunction(()=>!gameTest.net.restoring&&gameTest.timeline.predicted?.alive);
 const ignored=await attacker.evaluate(()=>{const n=gameTest.net,ws=n.ws;lateSocket.onmessage({data:JSON.stringify({type:'VERSION_MISMATCH',payload:{}})});lateSocket.onclose({code:1000,reason:'old'});return !n.stopped&&ws===n.ws&&ws.readyState===1;});assert.ok(ignored);
 await attacker.evaluate(()=>{gameTest.net.retryStart=performance.now()-61000;});binding.peer.socket.terminate();
 await attacker.getByRole('button',{name:'기존 경기로 다시 연결'}).click();await wait('manual recovery',()=>binding.epoch===epoch+2);await attacker.waitForFunction(()=>!gameTest.net.restoring&&gameTest.controls.enabled);
 const y=p.pos.y;await attacker.keyboard.down('s');await wait('fresh epoch movement',()=>p.pos.y>y+20);await attacker.keyboard.up('s');
 report.checks.push({id:'T05',epoch:binding.epoch,moved:p.pos.y-y});
 const touch=await attacker.context().newCDPSession(attacker);await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:3});
 const center=async sel=>{const b=await attacker.locator(sel).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};},stick=await center('#br-joystick'),act=await center('#br-attack');
 const event=(type,points)=>touch.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const move={id:1,x:stick.x+30,y:stick.y};
 await event('touchStart',[move]);await event('touchStart',[move,{id:2,...act}]);await event('touchMove',[move,{id:2,x:act.x+35,y:act.y}]);
 await attacker.keyboard.down('Space');await attacker.waitForFunction(()=>gameTest.controls.lastMove.x>.2);await attacker.keyboard.up('Space');
 const seqBeforeCancel=await attacker.evaluate(()=>gameTest.controls.actions.attack);await event('touchCancel',[]);
 assert.equal(await attacker.evaluate(()=>gameTest.controls.actions.attack),seqBeforeCancel);
 // Release only the action capture while the joystick pointer remains down.
 await event('touchStart',[move]);await event('touchStart',[move,{id:2,...act}]);
 await event('touchMove',[move,{id:2,x:act.x-35,y:act.y}]);
 await attacker.waitForFunction(()=>gameTest.controls.gestures.get('attack')?.aim.x<-.9&&gameTest.controls.lastMove.x>.2);
 await attacker.evaluate(()=>{const g=gameTest.controls.gestures.get('attack');document.getElementById('br-attack').releasePointerCapture(g.id);});
 await event('touchMove',[move,{id:2,x:act.x-40,y:act.y}]);await attacker.waitForFunction(()=>!gameTest.controls.gestures.size&&gameTest.controls.pointer!==null&&gameTest.controls.lastMove.x>.2);
 await event('touchEnd',[]);assert.equal(await attacker.evaluate(()=>gameTest.controls.actions.attack),seqBeforeCancel);
 for(let i=0;i<3;i++){await event('touchStart',[move]);await attacker.evaluate(()=>window.dispatchEvent(new Event('blur')));await event('touchEnd',[]);}
 await event('touchStart',[move]);await attacker.waitForFunction(()=>gameTest.controls.pointer!==null&&gameTest.controls.lastMove.x>.2);await event('touchEnd',[]);
 w.brProgression.awardXP(p,20,0);h.publish();await attacker.locator('#br-run-panel').waitFor();
 await attacker.locator('#br-run-later').click();await attacker.locator('#br-run-ready').click();const oldOffer=p.run.offer.id;await attacker.locator('#br-run-cards button').first().click();
 await wait('augment selection applies',()=>p.run.offer?.id!==oldOffer);if(await attacker.locator('#br-run-panel').isVisible())await attacker.locator('#br-run-later').click();await attacker.locator('#br-run-panel').waitFor({state:'hidden'});
 await attacker.evaluate(()=>{const input=document.createElement('input');document.body.append(input);input.focus();input.remove();});
 const lifecycle=await attacker.context().newCDPSession(attacker);await lifecycle.send('Page.setWebLifecycleState',{state:'frozen'});await delay(150);await lifecycle.send('Page.setWebLifecycleState',{state:'active'});
 const afterFocus=p.pos.x;await attacker.keyboard.down('d');await wait('movement after overlay',()=>p.pos.x>afterFocus+8);await attacker.keyboard.up('d');
 report.checks.push({id:'T01/T02',transport:'Chromium CDP multi-touch',ghostFires:0});
 await wait('legitimate cooldown',()=>p.cooldown<=0&&p.basicCooldown<=0,20000);
 // Place participants in a clear lane; the casts below must come from student UI.
 p.pos=new w.Vec2(960,340);other.pos=new w.Vec2(1070,340);h.publish();
 // Sample each short-lived cast on its own authoritative ticks. Otherwise three
 // software-rendered browser windows can miss the swing between two key presses.
 h.room.safePaused=true;
 const captureCast=async(key,kind,field)=>{
  const previous=p[field];await attacker.keyboard.press(key);
  await wait(kind+' queued',()=>w.actionPending.get(id)?.some(c=>c.kind===kind));
  for(let tick=0;tick<6&&p[field]===previous;tick++)stepWorld(w);
  assert.ok(p[field]>previous,kind+' must actually fire');h.publish();
 };
 await captureCast('Space','attack','firedAttackSeq');
 for(const [role,page] of pages.entries()){
  try {
   await page.waitForFunction(({id,seq})=>seenActions.some(a=>a.owner===id&&a.seq===seq&&a.kind==='attack'),{id,seq:p.firedAttackSeq});
  } catch(error) {
   const state=await page.evaluate(()=>({tick:gameTest.timeline.renderTick,renderBlocked:gameTest.renderer.renderBlocked,hidden:document.hidden,seen:seenActions.slice(-8)}));
   throw Error('Missing basic draw '+JSON.stringify({role,frame:w.game.frame,seq:p.firedAttackSeq,state}),{cause:error});
  }
 }
 await captureCast('q','skill','firedSkillSeq');
 for(const page of pages)await page.waitForFunction(({id,seq})=>seenActions.some(a=>a.owner===id&&a.seq===seq&&a.type==='ORBIT'),{id,seq:p.firedSkillSeq});
 for(const quality of ['low','balanced','high']){
 h.room.config.graphicsPreset=quality;h.app.manager.changed(h.room);
 for(const [i,page] of pages.entries()){
  await page.waitForFunction(q=>gameTest.renderer.session.roomMeta.graphicsPreset===q,quality);
  const result=await page.evaluate(({id,seq})=>{
   const {renderer:r,timeline}=gameTest,t=performance.now(),v=timeline.frame(t),orbits=v.shots.filter(q=>q.owner===id&&q.actionSeq===seq&&q.type==='ORBIT');
   if(!orbits.length)throw Error('MISSING_ORBIT');
   const c=document.createElement('canvas');c.width=r.canvas.width;c.height=r.canvas.height;const ctx=c.getContext('2d',{willReadFrequently:true});
   const read=view=>{r.draw(view,t);ctx.drawImage(r.canvas,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
   const off=read({...v,shots:v.shots.filter(q=>!orbits.includes(q))}),on=read(v);let changed=0;
   const z=r.cameraPose.zoom,scale=c.width/innerWidth;
   for(const q of orbits){const cx=(r.cameraPose.screenX+(q.x-r.cam.x)*z)*scale,cy=(r.cameraPose.screenY+(q.y-r.cam.y)*z)*scale,rad=Math.ceil(q.radius*z*scale*1.8);
    for(let y=Math.max(0,Math.floor(cy-rad));y<Math.min(c.height,cy+rad);y++)for(let x=Math.max(0,Math.floor(cx-rad));x<Math.min(c.width,cx+rad);x++){const n=4*(y*c.width+x);if(Math.abs(off[n]-on[n])+Math.abs(off[n+1]-on[n+1])+Math.abs(off[n+2]-on[n+2])>55)changed++;}
   }return {changed,orbits:orbits.length,pixi:!!r.pixi};
  },{id,seq:p.firedSkillSeq});assert.ok(result.changed>20,JSON.stringify(result));assert.equal(result.pixi,renderer==='pixi');screens.push({quality,...result});
  if(quality==='low')await page.screenshot({path:dir+'/'+renderer+'-'+['attacker','opponent','host'][i]+'.png'});
 }}
 h.room.safePaused=false;
 report.checks.push({id:'T06',fired:{attack:p.firedAttackSeq,skill:p.firedSkillSeq},screens});
 await wait('orbits expire',()=>!w.game.projectiles.some(q=>q.type==='ORBIT'),6500);
 for(const page of pages)await page.waitForFunction(()=>!gameTest.timeline.frame()?.shots.some(q=>q.type==='ORBIT'));
 await h.command('END');await h.command('REMATCH');await attacker.locator('#br-student-wait').waitFor();
 assert.deepEqual(h.errors,[]);report.checks.push({id:'T07/T09',expired:true,rematch:true});report.status='PASS';
}catch(error){
 const world=h.room.world;report.fail={message:error.message,phase:h.room.phase,paused:h.room.safePaused,fault:h.room.lastFault,actors:world?.game.participants.map(a=>({alive:a.alive,cooldown:a.cooldown,basic:a.basicCooldown,fault:a.lastRuntimeFault,frame:world.game.frame,runtimeFaults:a.runtimeFaults})),errors:h.errors};console.error(report.fail);throw error;
}finally{report.ms=Date.now()-started;fs.writeFileSync(dir+'/'+renderer+'.json',JSON.stringify(report,null,2));await h.close();}
