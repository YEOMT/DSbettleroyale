import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
const baseline=process.argv.includes('--baseline'),renderer=process.argv[2]||'canvas',started=performance.now();
const dir='artifacts/v35-3/'+(baseline?'baseline':'candidate')+'-'+renderer;fs.mkdirSync(dir,{recursive:true});
const report={baseline,renderer,device:'automated desktop browser; physical devices NOT_RUN',checks:{}};
const h=await auditHarness({players:2,renderer,mode:'team-elim',viewport:{width:844,height:640},studentContext:{hasTouch:true}});
try{
 await h.battle();const page=h.student;
 await page.evaluate(()=>{window.m=auditApp;window.requests=[];const command=m.net.command.bind(m.net);m.net.command=(type,payload)=>{if(type==='ACTION')requests.push({kind:payload.kind,seq:payload.seq,raw:payload.rawAim,at:performance.now()});return command(type,payload);};});
 // Public test fixture: a known kit, real authority/cooldowns and real pointer capture.
 const w=h.room.world,p=w.byId.get(h.room.students()[0].id),other=w.byId.get(h.room.students()[1].id);
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];other.pos=new w.Vec2(-600,-400);
 const ability=w.EMOJI_DB.find(a=>a.id==='emoji-003'),id=p.remoteId,life=p.lifeSeq+1,team=p.team;
 Object.assign(p,new w.Participant(1,'Controls',ability,new w.Vec2(0,0),team),{remoteId:id,sessionId:id,lifeSeq:life,team,humanControlled:true,connected:true,applyPlayerInput:w.brApplyPlayerInput,aimProfileKey:null,rw:null,spawnProtectionUntilFrame:0});w.brInitRun(p);h.staticState();h.publish();
 await page.waitForFunction(l=>m.timeline.predicted?.lifeSeq===l,life);h.room.fixtureFrozen=false;
 await page.evaluate(()=>{
  window.inputTimes=[];window.downs={};window.releases={};let frame=0;
  for(const type of ['pointerdown','pointerup','keydown'])addEventListener(type,e=>{const kind=e.target.closest?.('#br-attack')?'attack':e.target.closest?.('#br-skill')?'skill':e.type==='keydown'&&e.code==='Space'?'attack':null;if(!kind||!e.isTrusted)return;if(type==='pointerdown')downs[kind]={at:performance.now(),frame};else releases[kind]={at:performance.now(),kind};},true);
  const send=m.net.ws.send.bind(m.net.ws);m.net.ws.send=data=>{const message=JSON.parse(data);if(message.type==='ACTION'){const k=message.payload.kind,x=releases[k];if(x){inputTimes.push({kind:k,seq:message.payload.seq,releaseToSend:performance.now()-x.at});delete releases[k];}}return send(data);};
  const draw=m.renderer.draw.bind(m.renderer);m.renderer.draw=(v,n)=>{draw(v,n);frame++;for(const [kind,d]of Object.entries(downs))if(!d.draw&&document.getElementById('br-'+kind).classList.contains('aiming')){d.draw={ms:performance.now()-d.at,frames:frame-d.frame};}};
 });
 const native=await page.context().newCDPSession(page),touch=(type,touchPoints)=>native.send('Input.dispatchTouchEvent',{type,touchPoints});
 const center=async selector=>{const b=await page.locator(selector).boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};
 const stick=await center('#br-joystick'),attack=await center('#br-attack'),skill=await center('#br-skill');
 const move={id:1,x:stick.x+25,y:stick.y},a={id:2,...attack},b={id:3,...skill};
 await touch('touchStart',[move]);await touch('touchStart',[move,a,b]);await touch('touchMove',[move,{...a,x:a.x-30},{...b,y:b.y-30}]);
 await page.waitForFunction(()=>m.controls.gestures.get('attack')?.aim.x<-.9&&m.controls.gestures.get('skill')?.aim.y<-.9&&downs.attack.draw&&downs.skill.draw);
 const before=await page.evaluate(()=>requests.length);await touch('touchEnd',[{...a,x:a.x-30}]);
 assert.ok(await page.evaluate(()=>m.controls.pointer!==null&&!m.controls.gestures.has('attack')&&m.controls.gestures.has('skill')));
 await touch('touchEnd',[{...b,y:b.y-30}]);assert.ok(await page.evaluate(()=>m.controls.pointer!==null));
 await touch('touchEnd',[move]);await page.waitForFunction(()=>m.timeline.predicted.actions.firedAttack>=1&&m.timeline.predicted.actions.firedSkill>=1);
 report.checks.threePointers=await page.evaluate(n=>({commands:requests.slice(n).map(a=>({kind:a.kind,raw:a.raw})),pressed:downs,pointer:m.controls.pointer,gestures:m.controls.gestures.size}),before);
 assert.equal(report.checks.threePointers.commands.length,2);assert.ok(report.checks.threePointers.commands[0].raw.x<-.9);assert.ok(report.checks.threePointers.commands[1].raw.y<-.9);
 // Move release must leave both armed action pointers intact; cancelled pointers
 // followed by late up must never create a command. Native up also emits lost capture.
 await page.waitForFunction(()=>!m.timeline.predicted.rw?.locks?.skill&&!m.timeline.predicted.rw?.locks?.attack);
 const cancelledAt=await page.evaluate(()=>requests.length);await touch('touchStart',[move]);await touch('touchStart',[move,a,b]);await touch('touchEnd',[move]);
 assert.ok(await page.evaluate(()=>m.controls.pointer===null&&m.controls.gestures.size===2));
 const ids=await page.evaluate(()=>[...m.controls.gestures].map(([kind,g])=>[kind,g.id]));await touch('touchCancel',[]);
 await page.evaluate(ids=>{for(const [k,id]of ids)document.getElementById('br-'+k).dispatchEvent(new PointerEvent('pointerup',{pointerId:id,bubbles:true}));},ids);
 assert.equal(await page.evaluate(()=>requests.length),cancelledAt);
 report.checks.cancel={commands:0,gestures:await page.evaluate(()=>m.controls.gestures.size)};
 // Six legal basic attacks, one request each; no cooldown reset or input reservation.
 for(let n=0;n<6;n++){
  await page.waitForFunction(()=>{const s=m.timeline.predicted;return s?.alive&&s.basicCooldown<=0&&!s.stunned&&!s.rw?.locks.attack&&performance.now()-(m.controls.lastFire.attack||0)>110;});
  const seq=await page.evaluate(()=>m.controls.actions.attack);await page.locator('#br-attack').tap();await page.waitForFunction(seq=>m.timeline.predicted.actions.firedAttack>seq,seq);
 }
 report.checks.latency=await page.evaluate(()=>inputTimes);assert.equal(report.checks.latency.length,8);assert.ok(report.checks.latency.every(r=>r.releaseToSend>=0));
 report.checks.fired={attack:p.firedAttackSeq,skill:p.firedSkillSeq};
 const original=await page.evaluate(()=>structuredClone(m.timeline.predicted));
 report.checks.focus=await page.evaluate(async()=>{
  const e=document.createElement('div');e.contentEditable='true';document.body.append(e);e.focus();
  const before=requests.length;e.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));e.remove();
  const b=document.createElement('button');document.body.append(b);b.focus();b.dispatchEvent(new KeyboardEvent('keydown',{key:'q',code:'KeyQ',isComposing:true,bubbles:true}));b.remove();
  return {unexpectedCommands:requests.length-before};
 });
 // Real mouse pointer capture: changing the coordinate basis must cancel, not cast.
 const box=await page.locator('#br-attack').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 report.checks.pressed=await page.evaluate(()=>({aiming:document.getElementById('br-attack').classList.contains('aiming'),gestures:m.controls.gestures.size}));
 await page.setViewportSize({width:640,height:844});await delay(70);
 report.checks.rotation=await page.evaluate(()=>({gestures:m.controls.gestures.size,pointer:m.controls.pointer}));await page.mouse.up();
 report.checks.recovery=await page.evaluate(s=>{m.ui.clearCombatInputs();m.ui.self(s);return {enabled:m.controls.enabled,label:document.getElementById('br-attack-cd').textContent,state:document.getElementById('br-attack').dataset.actionState};},original);
 await page.screenshot({path:dir+'/recovery.png'});
 report.checks.aimPurity=await page.evaluate(s=>{
  m.timeline.predicted=s;const a=m.controls.assist;a.scope.BRMP.aimHelpHeld={attack:{id:'sentinel',at:5}};
  const before=JSON.stringify(a.scope.BRMP.aimHelpHeld);(a.preview||a.resolve).call(a,'attack',{x:-1,y:0},1,true);
  return {unchanged:JSON.stringify(a.scope.BRMP.aimHelpHeld)===before};
 },original);
 if(!baseline){assert.equal(report.checks.focus.unexpectedCommands,0);assert.equal(report.checks.pressed.aiming,true);assert.equal(report.checks.rotation.gestures,0);assert.notEqual(report.checks.recovery.label,'✓');assert.equal(report.checks.aimPurity.unchanged,true);}
 report.status=baseline?'BASELINE_OBSERVED':'PASS';assert.deepEqual(h.errors,[]);
}catch(e){report.status='FAIL';report.error=e.message;throw e;}
finally{report.ms=performance.now()-started;fs.writeFileSync(dir+'/controls.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await h.close();}
