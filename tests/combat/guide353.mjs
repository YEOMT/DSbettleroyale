import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',dir='artifacts/v35-3/guides-'+renderer,started=performance.now(),report={renderer,cases:[]};fs.mkdirSync(dir,{recursive:true});
const h=await auditHarness({players:2,renderer,mode:'solo',viewport:{width:844,height:640},studentContext:{hasTouch:true,deviceScaleFactor:2}}),page=h.student;
try{
 await h.battle();const w=h.room.world,p=w.byId.get(h.room.students()[0].id),op=w.byId.get(h.room.students()[1].id);w.brFarm.dispose(w.game);w.game.smokes=[];w.game.finalPhaseTriggered=true;op.pos=new w.Vec2(-800,600);
 const init=()=>page.evaluate(async()=>{window.m=await import('/src/main.js');});await init();
 async function ticks(n){for(let i=0;i<n;i++){stepWorld(w);if(i%3===2||i===n-1){h.publish();await delay(50);}}}
 async function request(){const el=page.locator('#br-skill');await page.waitForFunction(()=>m.controls.state('skill').canFire);await el.click();for(let i=0;i<100&&!w.actionPending.get(p.remoteId)?.length;i++)await delay(10);assert.ok(w.actionPending.get(p.remoteId)?.length,'real action reached authority');}
 for(const scenario of ['open','wall','resume','quiet']){
  if(scenario==='quiet'){await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{m.renderer.session.reducedMotion=true;m.renderer.session.soundMuted=true;m.audio.effects=false;});}
  const id=p.remoteId,life=p.lifeSeq+1,ability=w.EMOJI_DB.find(a=>a.id==='emoji-147');w.BRRework.clearWorld(w.game,'guide353');w.game.walls=[];w.game.projectiles=[];w.session.inputs[id]={};w.actionPending.clear();w.inputPending.clear();
  Object.assign(p,new w.Participant(1,'Return',ability,new w.Vec2(0,0),0),{remoteId:id,sessionId:id,lifeSeq:life,abilityId:ability.id,alive:true,connected:true,humanControlled:true,applyPlayerInput:w.brApplyPlayerInput,aimProfileKey:null,rw:null,cooldown:0,basicCooldown:0,spawnProtectionUntilFrame:0});w.brInitRun(p);w.game.rebuildSpatialGrid();h.staticState();h.publish();await page.waitForFunction(l=>m.timeline.predicted?.lifeSeq===l,life);
  await request();await ticks(14);const afterDash={x:p.pos.x,y:p.pos.y};assert.ok(afterDash.x>100);await page.waitForFunction(()=>m.timeline.predicted?.recastTarget?.x===0);
  if(scenario==='wall'){w.game.walls=[new w.Wall(130,0,25,260,0)];h.staticState();h.publish();await delay(100);}
  if(scenario==='resume'){await page.reload();await init();await page.waitForFunction(()=>!m.net.restoring&&m.controls.enabled&&m.timeline.predicted?.recastTarget?.x===0);}
  const b=await page.locator('#br-skill').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2-45);
  await page.waitForFunction(()=>m.renderer.aimGuide?.returning);const guide=await page.evaluate(()=>({...m.renderer.aimGuide}));
  assert.equal(guide.blocked,scenario==='wall');assert.equal(guide.x,scenario==='wall'?afterDash.x:0);assert.equal(guide.y,0);
  if(scenario==='resume')await page.screenshot({path:dir+'/private-return-after-resume.png'});
  await page.mouse.up();for(let i=0;i<100&&!w.actionPending.get(id)?.length;i++)await delay(10);assert.ok(w.actionPending.get(id)?.length);await ticks(2);
  assert.equal(p.pos.x,guide.x);assert.equal(p.pos.y,guide.y);assert.equal(p.rw.recast,null);
  console.log('guide',scenario,'PASS');report.cases.push({scenario,afterDash,guide:{x:guide.x,y:guide.y,blocked:guide.blocked},authoritative:{x:p.pos.x,y:p.pos.y},reconnected:scenario==='resume'});
 }
 // Reduced motion / mute preserve the already-verified authority guide and input.
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{m.renderer.session.reducedMotion=true;m.renderer.session.soundMuted=true;m.audio.effects=false;});
 await h.command('END');await h.command('REMATCH');await page.waitForFunction(()=>m.ui.room.phase==='LOBBY');assert.deepEqual(h.errors,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.error=e.message;throw e;}finally{report.ms=performance.now()-started;fs.writeFileSync(dir+'/result.json',JSON.stringify(report,null,2));await h.close();console.log(report);}
