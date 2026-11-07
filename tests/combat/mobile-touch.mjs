// Native Chromium multi-touch/zoom arbitration and WebKit touch taps/DOM policy.
// Device-sized desktop engines are not physical Android/iPhone/iPad certification.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
const renderer=process.argv[2]||'canvas',browserEngine=process.argv[3]||'chromium',start=Date.now();
// The full resize/cooldown sequence can outlast the shrinking solo/team arena
// on software GPUs. Use the existing fixed capture arena, with real clocks and
// cooldowns, so a normal ring elimination cannot masquerade as an input fault.
const checks=[],h=await auditHarness({players:2,renderer,quality:'low',mode:'team-capture',browserEngine,
 viewport:{width:800,height:520},studentContext:{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2}});
const page=h.student;
const metric=()=>page.evaluate(()=>({scale:visualViewport.scale,x:scrollX,y:scrollY,vx:visualViewport.offsetLeft,vy:visualViewport.offsetTop}));
const center=async sel=>{const r=await page.locator(sel).boundingBox();assert.ok(r,sel);return {x:r.x+r.width/2,y:r.y+r.height/2};};
const ready=kind=>page.waitForFunction(kind=>{const s=m.timeline.predicted;return m.controls.enabled&&s?.alive&&!s.stunned&&!s.rw?.locks?.[kind]&&(kind==='skill'?s.cooldown:s.basicCooldown)<=0&&performance.now()-(m.controls.lastFire[kind]||0)>110;},kind);
let native=null;
try{
 await page.evaluate(async()=>{window.m=await import('/src/main.js');});
 const lobby=await page.evaluate(()=>({touch:getComputedStyle(document.querySelector('#br-student-wait')).touchAction,meta:document.querySelector('meta[name=viewport]').content}));
 assert.notEqual(lobby.touch,'none');assert.doesNotMatch(lobby.meta,/user-scalable\s*=\s*no|maximum-scale/);
 await h.battle();const w=h.room.world,p=w.byId.get(h.room.students()[0].id),other=w.byId.get(h.room.students()[1].id);
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];other.pos=new w.Vec2(-600,-300);
 const ability=w.EMOJI_DB.find(a=>a.id==='emoji-001'),id=p.remoteId,life=p.lifeSeq+1,team=p.team;
 Object.assign(p,new w.Participant(1,'Touch',ability,new w.Vec2(0,0),team),{remoteId:id,sessionId:id,lifeSeq:life,abilityId:ability.id,team,humanControlled:true,connected:true,applyPlayerInput:w.brApplyPlayerInput,aimProfileKey:null,rw:null,spawnProtectionUntilFrame:0});w.brInitRun(p);h.staticState();h.publish();
 await page.waitForFunction(l=>m.timeline.predicted?.lifeSeq===l,life);h.room.fixtureFrozen=false;
 await page.evaluate(()=>{window.sentActions=[];const send=m.net.command.bind(m.net);m.net.command=(kind,p)=>{if(kind==='ACTION')sentActions.push(p);return send(kind,p);};});
 if(browserEngine==='chromium')native=await page.context().newCDPSession(page);
 const touch=(type,points)=>native.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1024,height:768},{width:768,height:1024},{width:768,height:930}]){
  await page.setViewportSize(viewport);await page.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height,viewport);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const before=await metric();let motion=null;
  const policy=await page.evaluate(()=>{
   const root=document.querySelector('#br-student-battle'),bad=[root,...root.querySelectorAll('*')].filter(e=>getComputedStyle(e).touchAction!=='none').map(e=>e.id||e.tagName);
   const canceled={};for(const name of ['gesturestart','gesturechange','gestureend','touchmove']){const e=new Event(name,{bubbles:true,cancelable:true});root.dispatchEvent(e);canceled[name]=e.defaultPrevented;}
   const outside=new Event('gesturestart',{bubbles:true,cancelable:true});document.body.dispatchEvent(outside);
   return {bad,canceled,outside:outside.defaultPrevented};
  });
  assert.deepEqual(policy.bad,[]);assert.ok(Object.values(policy.canceled).every(Boolean));assert.equal(policy.outside,false);
  if(native){
   // Pinch on the canvas and HUD (not only the controls), including fast double taps.
   for(const cy of [viewport.height*.45,24]){
    const cx=viewport.width*.5;
    await touch('touchStart',[{id:1,x:cx-12,y:cy},{id:2,x:cx+12,y:cy}]);
    for(let n=1;n<=5;n++){await touch('touchMove',[{id:1,x:cx-12-n*13,y:cy},{id:2,x:cx+12+n*13,y:cy}]);await delay(50);}
    await touch('touchEnd',[]);
    for(let n=0;n<4;n++)await page.touchscreen.tap(cx,cy);
   }
   await ready('attack');await ready('skill');const stick=await center('#br-joystick'),attack=await center('#br-attack'),x=p.pos.x;
   // Repeated rightward holds can reach the fixed arena boundary on slow GPUs.
   // Move toward the centre; keep native input, actual physics and cooldowns.
   const direction=x>0?-1:1,moving={id:1,x:stick.x+28*direction,y:stick.y},aim={id:2,...attack};
   await touch('touchStart',[moving]);await page.waitForFunction(sign=>m.controls.lastMove?.x*sign>.3,direction);
   await touch('touchStart',[moving,aim]);await touch('touchMove',[moving,{...aim,x:aim.x-36}]);
   await page.waitForFunction(()=>m.controls.gestures.get('attack')?.aim.x<-.9&&m.renderer.aimGuide?.dx<-.9);
   const guide=await page.evaluate(()=>({dx:m.renderer.aimGuide.dx,dy:m.renderer.aimGuide.dy}));
   // Check displacement while both fingers are still held, before the attack's
   // legitimate melee step can move the actor in the opposite direction.
   for(let n=0;n<100&&(p.pos.x-x)*direction<=0;n++)await delay(20);
   motion={from:x,to:p.pos.x,direction,applied:p.lastAppliedSeq};
   assert.ok((motion.to-motion.from)*direction>0,'authority moved while action pointer held: '+JSON.stringify(motion));
   assert.ok(await page.evaluate(()=>m.controls.pointer!==null&&m.controls.gestures.has('attack')));
   const fired=p.firedAttackSeq||0;await touch('touchEnd',[{...aim,x:aim.x-36}]);
   await page.waitForFunction(()=>m.controls.pointer!==null&&!m.controls.gestures.has('attack'),null,{timeout:2000});
   await page.waitForFunction(seq=>m.timeline.predicted?.actions.firedAttack>seq,fired);
   assert.ok((await page.evaluate(()=>sentActions.at(-1).rawAim.x))<-.9);
   assert.ok(guide.dx<-.9&&Math.abs(guide.dy)<.01);assert.ok(await page.evaluate(()=>m.controls.pointer!==null));
   // The second pointer can aim a skill while the joystick remains captured.
   await ready('skill');const skill=await center('#br-skill'),skillPoint={id:2,...skill};
   await touch('touchStart',[moving,skillPoint]);await touch('touchMove',[moving,{...skillPoint,y:skillPoint.y-34}]);
   await page.waitForFunction(()=>m.controls.gestures.get('skill')?.aim.y<-.9);
   const seq=p.firedSkillSeq||0;await touch('touchEnd',[{...skillPoint,y:skillPoint.y-34}]);await page.waitForFunction(seq=>m.timeline.predicted?.actions.firedSkill>seq,seq);
   assert.ok((await page.evaluate(()=>sentActions.at(-1).rawAim.y))<-.9);
   await touch('touchCancel',[]);await page.waitForFunction(()=>m.controls.pointer===null&&m.controls.gestures.size===0);
   // Cancel an armed attack, then reacquire both controls. No cancellation fire.
   const actions=await page.evaluate(()=>m.controls.actions.attack);
   await touch('touchStart',[moving]);await touch('touchStart',[moving,aim]);await touch('touchCancel',[]);
   assert.equal(await page.evaluate(()=>m.controls.actions.attack),actions);
   await touch('touchStart',[moving]);await page.waitForFunction(sign=>m.controls.lastMove?.x*sign>.3,direction);await touch('touchEnd',[]);
   await ready('attack');await page.locator('#br-attack').tap();await page.waitForFunction(seq=>m.timeline.predicted?.actions.firedAttack>seq,actions);
  }else{
   // WebKit's public Playwright touch API supports native taps, not two fingers.
   // Safari GestureEvent checks above test cancellation plumbing only.
   await ready('attack');const seq=p.firedAttackSeq||0;await page.locator('#br-attack').tap();await page.waitForFunction(seq=>m.timeline.predicted?.actions.firedAttack>seq,seq);
  }
  await delay(150);const after=await metric();assert.deepEqual(after,before);
  checks.push({viewport,policy,scale:after,nativeMultiTouch:!!native,motion});console.log('viewport PASS',viewport,motion);
 }
 await h.command('END');await page.locator('#br-results').waitFor();await h.command('REMATCH');await page.locator('#br-student-wait').waitFor();
 const restored=await page.evaluate(()=>{const root=document.getElementById('br-student-battle'),e=new Event('gesturestart',{bubbles:true,cancelable:true});root.dispatchEvent(e);return {blocked:e.defaultPrevented,body:getComputedStyle(document.body).overflow,touch:getComputedStyle(document.getElementById('br-student-wait')).touchAction};});
 assert.equal(restored.blocked,false);assert.notEqual(restored.touch,'none');assert.equal(restored.body,'auto');
 await page.evaluate(()=>m.ui.encyclopedia());const body=page.locator('.br-encyclopedia-body');await body.waitFor();
 const scrolling=await body.evaluate(el=>{el.scrollTop=150;return {top:el.scrollTop,touch:getComputedStyle(el).touchAction};});
 assert.ok(scrolling.top>0);assert.notEqual(scrolling.touch,'none');
 if(native){await touch('touchStart',[{id:1,x:360,y:400},{id:2,x:400,y:400}]);for(let n=1;n<=6;n++){await touch('touchMove',[{id:1,x:360-n*22,y:400},{id:2,x:400+n*22,y:400}]);await delay(50);}await touch('touchEnd',[]);await page.waitForFunction(()=>visualViewport.scale>1.1);scrolling.zoom=(await metric()).scale;}
 checks.push({rematch:restored,encyclopedia:scrolling});assert.deepEqual(h.errors,[]);
 console.log(JSON.stringify({browserEngine,renderer,status:'PASS',ms:Date.now()-start}));
}catch(error){console.error(error.message,await page.evaluate(()=>({phase:m.ui.room?.phase,alive:m.timeline.predicted?.alive,renderError:m.renderer.lastRenderError,actions:m.timeline.predicted?.actions,request:m.controls.lastAction,gestures:m.controls.gestures.size,pointer:m.controls.pointer,sent:sentActions})).catch(()=>null));throw error;}finally{fs.mkdirSync('artifacts/combat',{recursive:true});fs.writeFileSync(`artifacts/combat/touch-${browserEngine}-${renderer}.json`,JSON.stringify({ms:Date.now()-start,checks,physicalDevices:'NOT_RUN',webkitNativePinch:browserEngine==='webkit'?'NOT_RUN':'N/A'},null,2));await h.close();}
