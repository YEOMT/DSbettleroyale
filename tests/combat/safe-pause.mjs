import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
const start=performance.now(),report={status:'FAIL',checks:[]},h=await auditHarness({players:1,renderer:'canvas',mode:'team-capture'});
const wait=async(name,fn)=>{for(let end=performance.now()+8000;performance.now()<end;){if(await fn())return;await delay(20);}throw Error('TIMEOUT '+name);};
const install=page=>page.evaluate(async()=>{window.m=await import('/src/main.js');window.seen=[];m.net.addEventListener('event',e=>{const d=e.detail.data;seen.push({type:e.detail.type,kind:d.actionKind||d.geometry?.kind,seq:d.actionSeq||d.geometry?.seq,owner:d.owner||d.sourceId});});});
try{
 const context=await h.browser.newContext({viewport:{width:1024,height:768},hasTouch:true});h.contexts.push(context);const other=await context.newPage();other.on('pageerror',e=>h.errors.push(e.message));
 await other.goto(h.url+'/?renderer=canvas&room='+h.room.code);await other.locator('#br-player-name').fill('Pause rival');await other.locator('#br-join-btn').click();await other.locator('#br-student-wait').waitFor();
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');h.room.students()[0].draft.abilityId='emoji-024';h.room.students()[1].draft.abilityId='emoji-114';await h.command('START_BATTLE');
 for(const page of [h.student,other,h.host]){await page.waitForFunction(async()=>!!(await import('/src/main.js')).timeline.samples.length);await install(page);}
 h.room.fixtureFrozen=true;const w=h.room.world,p=w.byId.get(h.room.students()[0].id),q=w.byId.get(h.room.students()[1].id);
 w.game.walls=[];w.game.smokes=[];w.brFarm.dispose(w.game);p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(200,0);p.cooldown=p.basicCooldown=0;p.stunned=q.stunned=0;p.spawnProtectionUntilFrame=q.spawnProtectionUntilFrame=0;q.hp=q.maxHp=100000;
 h.staticState();h.publish();await h.student.waitForFunction(()=>m.controls.enabled);
 await h.student.keyboard.down('d');await wait('prepause movement queue',()=>w.inputPending.size>0);h.room.pause();
 await h.student.waitForFunction(()=>m.net.paused&&m.timeline.paused&&!m.controls.enabled);await h.student.keyboard.up('d');
 const before=await h.student.evaluate(()=>({seq:m.controls.seq,actions:{...m.controls.actions}}));
 for(let i=0;i<8;i++){await h.student.keyboard.press('Space');await h.student.keyboard.press('q');}
 await delay(150);
 assert.deepEqual(await h.student.evaluate(()=>({seq:m.controls.seq,actions:{...m.controls.actions}})),before);
 assert.equal(w.inputPending.size,0);assert.equal(w.actionPending.size,0);assert.equal(await h.student.evaluate(()=>m.controls.keys.size+m.controls.gestures.size+m.timeline.history.length+m.timeline.previews.size),0);
 h.app.manager.changed(h.room);await delay(40);assert.equal(await h.student.evaluate(()=>m.controls.enabled),false);
 await h.student.reload();await install(h.student);await h.student.waitForFunction(()=>m.net.paused&&!m.net.restoring&&m.timeline.predicted);
 assert.equal(await h.student.evaluate(()=>m.controls.enabled),false);assert.equal(await h.student.evaluate(()=>m.ui.room.safePaused),true);
 const epoch=h.room.students()[0].epoch;await h.command('CONTINUE');h.room.fixtureFrozen=false;
 await h.student.waitForFunction(()=>!m.net.paused&&!m.net.restoring&&m.controls.enabled);assert.ok(h.room.students()[0].epoch>epoch);
 const x=p.pos.x;await h.student.keyboard.down('d');await wait('first movement',()=>p.pos.x>x+15);await h.student.keyboard.up('d');
 assert.equal(p.firedAttackSeq||0,0);assert.equal(p.firedSkillSeq||0,0);
 for(const [key,kind,field]of [['Space','attack','firedAttackSeq'],['q','skill','firedSkillSeq']]){await h.student.keyboard.press(key);await wait('real '+kind,()=>p[field]>0);const seq=p[field];for(const page of [h.student,other,h.host])await wait(kind+' visible to all',()=>page.evaluate(({id,kind,seq})=>seen.some(e=>e.owner===id&&e.kind===kind&&e.seq===seq),{id:p.remoteId,kind,seq}));}
 report.checks.push('paused keyboard/input/prediction neutral','ROOM_STATE cannot unlock','refresh RESUME preserves pause','CONTINUE restores epoch and floors','new move/attack/skill confirmed','attacker/opponent/host confirmed attack+skill events','no queued attack burst');
 // Actual CDP touch after recovery: joystick is reacquired, then canceled cleanly.
 const cdp=await h.student.context().newCDPSession(h.student);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:3});const box=await h.student.locator('#br-joystick').boundingBox(),y=p.pos.y;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:box.x+box.width/2,y:box.y+box.height/2+30}]});await wait('touch after continue',()=>p.pos.y>y+10);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await h.student.waitForFunction(()=>m.controls.pointer===null);
 await h.command('END');await h.command('REMATCH');await h.student.locator('#br-student-wait').waitFor();assert.equal(h.room.world,null);assert.equal(h.room.safePaused,false);assert.equal(h.errors.length,0);
 report.checks.push('CDP joystick works after recovery/cancel','END/rematch cleanup');report.status='PASS';
}catch(e){report.failure=e.message;throw e;}finally{report.ms=performance.now()-start;report.errors=h.errors;fs.mkdirSync('artifacts/runtime-performance',{recursive:true});fs.writeFileSync('artifacts/runtime-performance/pause-browser.json',JSON.stringify(report,null,2));console.log(report);await h.close();}
