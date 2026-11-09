// Short geometry/display checks on real WS screens. Not a continuous FPS benchmark.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',started=performance.now(),report=[],h=await auditHarness({players:1,renderer,studentContext:{hasTouch:true},viewport:{width:1024,height:768}});
fs.mkdirSync('artifacts/classroom',{recursive:true});
const transitions=[],command=h.room.command.bind(h.room);h.room.command=(member,type,...args)=>{transitions.push({type,phase:h.room.phase,countdown:!!h.room.countdown});return command(member,type,...args);};
try{
 const context=await h.browser.newContext({viewport:{width:1024,height:768}});h.contexts.push(context);await context.route(/dropbox/,r=>r.abort());const rival=await context.newPage();rival.on('pageerror',e=>h.errors.push(e.message));await rival.goto(h.url+'/?room='+h.room.code+'&renderer='+renderer);await rival.locator('#br-player-name').fill('Aim opponent');await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();await h.battle();
 const pages=[h.student,rival,h.host],w=h.room.world,[p,q]=h.room.students().map(m=>w.byId.get(m.id));w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];q.pos=new w.Vec2(300,350);q.vel=new w.Vec2(0,0);h.staticState();
 for(const page of pages)await page.evaluate(async()=>{window.m=await import('/src/main.js');window.drawnRadii=[];window.spawned=[];const draw=m.renderer.draw.bind(m.renderer);m.renderer.draw=(v,t)=>{draw(v,t);for(const s of v.shots)if(!s.preview&&s.actionKind==='skill'&&s.kind==='projectile'&&!drawnRadii.includes(s.radius))drawnRadii.push(s.radius);};m.net.addEventListener('event',e=>{if(e.detail.type==='SHOT_SPAWN')spawned.push(e.detail.data);});});
 async function reset(id){
  w.BRRework.clearWorld(w.game,'case');w.game.projectiles=[];w.game.retiredShots=[];w.actionPending.clear();w.inputPending.clear();const ability=w.EMOJI_DB.find(a=>a.id===id),remoteId=p.remoteId,life=p.lifeSeq+1;
  Object.assign(p,new w.Participant(1,'Aim actor',ability,new w.Vec2(0,0),0),{remoteId,sessionId:remoteId,lifeSeq:life,abilityId:id,alive:true,connected:true,humanControlled:true,applyPlayerInput:w.brApplyPlayerInput,aimProfileKey:null,rw:null,cooldown:0,basicCooldown:0,spawnProtectionUntilFrame:0});w.brInitRun(p);p.vel=new w.Vec2(0,0);w.session.inputs[remoteId]={};w.game.rebuildSpatialGrid();h.publish();await h.student.waitForFunction(l=>m.timeline.predicted?.lifeSeq===l,life);
 }
 async function press(touch){
  const box=await h.student.locator('#br-skill').boundingBox(),start={x:box.x+box.width/2,y:box.y+box.height/2},end={x:start.x-box.width,y:start.y};let release;
  if(touch){const cdp=await h.student.context().newCDPSession(h.student);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...start}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,...end}]});release=async()=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();};}
  else{await h.student.mouse.move(start.x,start.y);await h.student.mouse.down();await h.student.mouse.move(end.x,end.y);release=()=>h.student.mouse.up();}
  await h.student.waitForFunction(()=>m.controls.gestures.get('skill')?.power===1&&m.renderer.aimGuide?.dx<-.99);const guide=await h.student.evaluate(()=>({...m.renderer.aimGuide}));await release();
  for(let n=0;n<100&&!w.actionPending.get(p.remoteId)?.length;n++)await delay(10);assert.ok(w.actionPending.get(p.remoteId)?.length,'real action queued');return guide;
 }
 for(const touch of [false,true]){await reset('emoji-141');const guide=await press(touch);stepWorld(w);assert.ok(Math.abs(guide.x+400)<.01);assert.ok(Math.hypot(p.pos.x-guide.x,p.pos.y-guide.y)<1);assert.equal(p.cooldown,720);report.push({joker:touch?'CDP touch':'PC drag',guideRange:guide.range,actualX:p.pos.x});h.publish();}
 await reset('emoji-003');const guide=await press(false);assert.equal(guide.width,48);
 const preview=await h.student.evaluate(()=>[...m.timeline.previews.values()].filter(s=>s.actionKind==='skill').map(s=>s.radius));assert.deepEqual(preview,[...Array(13).fill(24),32]);
 for(let i=0;i<70;i++){stepWorld(w);if(i%2===0||i===69){h.publish();await delay(35);}}
 for(const [role,page]of pages.entries()){
  await page.waitForFunction(()=>drawnRadii.includes(24)&&drawnRadii.includes(32));const geometry=await page.evaluate(()=>({radii:drawnRadii,shots:spawned.filter(s=>s.kind==='projectile'&&s.actionKind==='skill').map(s=>s.radius),pixi:!!m.renderer.pixi}));assert.equal(geometry.pixi,renderer==='pixi');assert.deepEqual(geometry.shots,[...Array(13).fill(24),32]);report.push({role,...geometry});
  await page.screenshot({path:'artifacts/classroom/archmage-'+renderer+'-'+role+'.png'});
 }
 await h.command('END');await h.command('REMATCH');for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&m.timeline.previews.size===0&&m.renderer.textures.size===0);assert.deepEqual(h.errors,[]);console.log('classroom aim',renderer,'PASS');
}finally{fs.mkdirSync('artifacts/classroom',{recursive:true});fs.writeFileSync('artifacts/classroom/aim-'+renderer+'.json',JSON.stringify({ms:performance.now()-started,report,transitions,phase:h.room.phase,errors:h.errors},null,2));await h.close();}
