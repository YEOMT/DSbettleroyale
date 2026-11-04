import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',dir='artifacts/combat',start=Date.now(),report=[];
fs.mkdirSync(dir,{recursive:true});
const h=await auditHarness({players:2,renderer,mode:'team-elim',quality:'low'});
try{
 await h.battle();const page=h.student,w=h.room.world,p=w.byId.get(h.room.students()[0].id),op=w.byId.get(h.room.students()[1].id);
 await page.evaluate(async()=>{window.gameTest=await import('/src/main.js');});
 w.brFarm.dispose(w.game);w.game.smokes=[];op.pos=new w.Vec2(-400,-350);
 const cases=[['emoji-001',.18,'open'],['emoji-001',.59,'open'],['emoji-001',1,'boundary'],['emoji-010',.59,'wall'],['emoji-019',1,'wall'],['emoji-029',.59,'open']];
 for(const [i,[id,power,field]] of cases.entries()){
  w.BRRework.clearWorld(w.game,'fixture');w.game.projectiles=[];w.game.walls=[];w.session.inputs[p.remoteId]={};w.inputPending.clear();w.actionPending.clear();
  const ability=w.EMOJI_DB.find(a=>a.id===id),x=field==='boundary'?w.game.worldRadius-180:0;
  const fresh=new w.Participant(1,'Aim',ability,new w.Vec2(x,0),p.team),life=p.lifeSeq+1,remoteId=p.remoteId;
  Object.assign(p,fresh,{remoteId,sessionId:remoteId,lifeSeq:life,abilityId:id,alive:true,connected:true,humanControlled:true,applyPlayerInput:w.brApplyPlayerInput,spawnProtectionUntilFrame:0,cooldown:0,basicCooldown:0});w.brInitRun(p);p.aimProfileKey=null;
  const radius=w.brAimSpec(ability,'skill',p.radius,power,p.run.mods).range;
  if(field==='wall')w.game.walls=[new w.Wall(id==='emoji-019'?250:radius,0,70,320,0)];
  await page.setViewportSize(i%2?{width:844,height:390}:{width:390,height:844});h.staticState();h.publish();
  await page.waitForFunction(l=>gameTest.timeline.predicted?.lifeSeq===l,life);
  for(const kind of ['attack','skill']){
   const button=page.locator('#br-'+kind),box=await button.boundingBox(),extent=Math.max(box.width,box.height),sx=box.x+box.width/2,sy=box.y+box.height/2;
   // Drag left when necessary to remain inside mobile viewport; target fixture faces +x.
   await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx+extent*.92*power,sy);
   await page.waitForFunction(()=>!!gameTest.renderer.aimGuide);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const guide=await page.evaluate(()=>({...gameTest.renderer.aimGuide,power:[...gameTest.controls.gestures.values()][0].power}));
   if(kind==='attack'){
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
    await page.waitForFunction(()=>!gameTest.renderer.aimGuide);continue;
   }
   if(i===1)await page.screenshot({path:dir+'/aim-'+renderer+'.png'});
   await page.mouse.up();
   for(let n=0;n<100&&!w.actionPending.get(remoteId)?.length;n++)await delay(10);
   assert.ok(w.actionPending.get(remoteId)?.length);stepWorld(w);
   const es=w.BRRework.world(w.game).entities,entity=es.find(e=>['marker','zone','gravity','leap','dash','warning'].includes(e.kind));
   assert.ok(entity,id+' produced target entity, got '+es.map(e=>e.kind));
   let dest=entity.to|| (entity.kind==='dash'?{x:p.pos.x+entity.dir.x*(entity.range-entity.distance),y:p.pos.y+entity.dir.y*(entity.range-entity.distance)}:entity.pos);
   if(id==='emoji-019'){
    let motion;for(let frame=0;frame<100;frame++){stepWorld(w);motion??=p.rw?.dash;if(motion?.dead)break;}
    assert.ok(motion?.dead,'charge completed after its real windup');dest=p.pos;
   }
   const error=Math.hypot(dest.x-guide.x,dest.y-guide.y);
   assert.ok(error<2,id+' '+field+' endpoint mismatch '+JSON.stringify({dest,guide,error}));
   report.push({id,power:guide.power,field,shape:guide.shape,error});h.publish();await page.waitForFunction(()=>!gameTest.renderer.aimGuide);
  }
 }
 if(renderer==='pixi'){
  await page.evaluate(()=>{const gl=gameTest.renderer.app.renderer.gl,ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('WEBGL_LOSS_UNAVAILABLE');ext.loseContext();});
  await page.waitForFunction(()=>gameTest.renderer.ctx&&!gameTest.renderer.pixi&&gameTest.renderer.canvas.isConnected);
  report.push({contextLoss:'Canvas restored on same connected session'});
 }
 // Exercise the actual replacement canvas on the Pixi path and the original
 // one on Canvas. Deliberately CSS-scale and offset it independently of its backing store.
 {
  const ability=w.EMOJI_DB.find(a=>a.id==='emoji-001'),id=p.remoteId,life=p.lifeSeq+1,team=p.team;
  w.BRRework.clearWorld(w.game,'cursor');w.game.walls=[];w.game.projectiles=[];w.session.inputs[id]={};w.actionPending.clear();
  Object.assign(p,new w.Participant(1,'Cursor',ability,new w.Vec2(0,0),team),{remoteId:id,sessionId:id,lifeSeq:life,abilityId:ability.id,team,humanControlled:true,connected:true,applyPlayerInput:w.brApplyPlayerInput,aimProfileKey:null,rw:null,basicCooldown:0,cooldown:0});
  w.brInitRun(p);h.staticState();h.publish();await page.waitForFunction(l=>gameTest.timeline.predicted?.lifeSeq===l,life);
  const pointer=await page.evaluate(()=>{
   const r=gameTest.renderer;r.canvas.style.cssText+=';position:absolute!important;left:11px!important;top:8px!important;width:92vw!important;height:90vh!important';
   const b=r.canvas.getBoundingClientRect();for(const fx of [.63,.61,.56])for(const fy of [.46,.54]){
    const x=Math.floor(b.left+fx*b.width),y=Math.floor(b.top+fy*b.height);if(document.elementFromPoint(x,y)===r.canvas)return {x,y};
   }throw Error('Cursor target covered');
  });
  await page.mouse.move(pointer.x,pointer.y);await page.waitForFunction(()=>!!gameTest.renderer.aimGuide);
  const guide=await page.evaluate(({x,y})=>{
   const r=gameTest.renderer,t=gameTest.timeline.predicted,pose=r.cameraPose,b=r.canvas.getBoundingClientRect();
   const world={x:pose.x+((x-b.left)*innerWidth/b.width-pose.screenX)/pose.zoom,y:pose.y+((y-b.top)*innerHeight/b.height-pose.screenY)/pose.zoom};
   r.session.studentShake={until:performance.now()+500,duration:500,strength:6,seed:1};
   return {g:r.aimGuide,world,origin:{x:t.x,y:t.y}};
  },pointer);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.ok(await page.evaluate(()=>gameTest.renderer.cam.x===gameTest.renderer.cameraPose.x));
  await page.keyboard.press('q');
  for(let n=0;n<100&&!w.actionPending.get(id)?.length;n++)await delay(10);
  const queued=w.actionPending.get(id)?.[0];assert.ok(queued);const dx=guide.world.x-guide.origin.x,dy=guide.world.y-guide.origin.y;
  assert.ok(Math.abs(queued.rawAim.x-dx/Math.hypot(dx,dy))<.002);
  stepWorld(w);const entity=w.BRRework.world(w.game).entities.find(e=>e.kind==='warning');
  assert.ok(entity,'thunder landing warning');const dest=entity.to||entity.pos,error=Math.hypot(dest.x-guide.g.x,dest.y-guide.g.y);assert.ok(error<2,'cursor endpoint '+error);
  const touch=await page.context().newCDPSession(page);await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  const stick=await page.locator('#br-joystick').boundingBox(),point={id:1,x:stick.x+stick.width*.8,y:stick.y+stick.height*.5};
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await page.waitForFunction(()=>gameTest.controls.pointer!==null&&gameTest.controls.lastMove.x>.2);
  await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await page.waitForFunction(()=>gameTest.controls.pointer===null&&gameTest.controls.lastMove.x===0);
  report.push({mouseAfterFallback:renderer==='pixi',cursorEndpointError:error,touchCancelled:true});h.publish();
 }
 await page.evaluate(()=>{const r=gameTest.renderer,draw=r.draw;r.draw=function(...args){this.draw=draw;throw Error('FIXTURE_CANVAS_DRAW');};});
 await page.getByRole('button',{name:'경기 화면 복원'}).click();
 await page.waitForFunction(()=>gameTest.renderer.enabled&&!gameTest.renderer.renderBlocked&&gameTest.timeline.samples.length>0);
 report.push({renderFault:'resynced in same battle'});
 // Inject a simulation failure on the isolated room only: a teacher can
 // distinguish this from a dropped socket and end the still-connected match.
 w.game.update=()=>{throw Error('FIXTURE_SIMULATION_FAULT');};h.room.safePaused=false;
 await h.host.getByRole('button',{name:'결과로 종료'}).click();await page.locator('#br-results').waitFor();
 await h.host.locator('#br-rematch-room').click();await page.locator('#br-student-wait').waitFor();
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');await h.command('START_BATTLE');await page.locator('#br-student-battle').waitFor();
 await page.waitForFunction(()=>gameTest.timeline.samples.at(-1)?.state.serverTick>3);
 assert.equal(h.room.safePaused,false);assert.equal(h.room.lastFault,null);
 report.push({simulationFault:'host ended faulty match, next match received advancing ticks'});assert.deepEqual(h.errors,[]);
}finally{fs.writeFileSync(dir+'/aim-'+renderer+'.json',JSON.stringify({ms:Date.now()-start,report},null,2));await h.close();}
