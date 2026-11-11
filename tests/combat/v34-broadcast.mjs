import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';

const renderer=process.argv[2]||'canvas', baseline=process.argv.includes('--baseline');
const out='artifacts/v34/broadcast/'+(baseline?'before-':'after-')+renderer;
fs.mkdirSync(out,{recursive:true});
const started=performance.now(),report={renderer,baseline,cameras:[],banners:[]};
const h=await auditHarness({players:4,renderer,quality:'low',viewport:{width:1280,height:720},studentContext:{hasTouch:true,viewport:{width:390,height:844}}});
const sizes=[{width:1280,height:720},{width:1024,height:768},{width:390,height:844}];

async function cameraCase(mode,teams,size,music){
 await h.host.setViewportSize(size);
 await h.host.evaluate(show=>document.getElementById('br-music-controls').classList.toggle('br-hidden',!show),music);
 await h.host.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const w=h.room.world;
 if(mode==='capture'){assert.equal(w.game.capture.map.bases.length,teams);assert.equal(w.game.capture.points.length,2);}
 if(mode==='solo'){
  w.game.ringGeometry={...w.game.ringGeometry,cx:800,cy:120,radius:1400};
  w.game.participants.forEach((p,i)=>{p.pos=new w.Vec2(1500+i*32,210+i*24);p.vel=new w.Vec2(0,0);});
  w.game.rebuildSpatialGrid();
 }
 w.game.frame++;
 h.publish();
 await h.host.waitForFunction(seq=>auditApp.timeline.lastSeq>=seq,h.room.snapshotSeq);
 await h.host.waitForFunction(m=>auditApp.renderer.cameraPose?.mode===m,mode==='solo'?'overview':'capture');
 // Synchronise this single capture to the latest actual WS view, preserving
 // the normal renderer, camera and HUD layout for both backends.
 const data=await h.host.evaluate(({mode,teams})=>{
  const {renderer:r,timeline:t}=auditApp;
  r.camera.reset();r.draw(t.frame(performance.now()+100),performance.now());
  const p=r.cameraPose,world=t.static,b=world.boundary;
  const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const obstacles=[...document.querySelectorAll('#hud-overlay .hud-box,#br-capture-scoreboard,#br-music-controls,#br-host-live')].map(rect).filter(r=>r.width&&r.height);
  const upper=obstacles.filter(r=>(r.y+r.bottom)/2<innerHeight/2),lower=obstacles.filter(r=>(r.y+r.bottom)/2>=innerHeight/2);
  return {mode,teams,size:[innerWidth,innerHeight],music:!document.getElementById('br-music-controls').classList.contains('br-hidden'),
   backend:r.pixi?'pixi':'canvas',pose:p,upper:Math.max(0,...upper.map(r=>r.bottom)),lower:Math.min(innerHeight,...lower.map(r=>r.y)),
   boundary:b&&[b.minX,b.maxX,b.minY,b.maxY],insets:r.hostInsets()};
 },{mode,teams});
 report.cameras.push(data);assert.equal(data.backend,renderer);
 if(!baseline){
  const {pose,upper,lower}=data;
  if(mode==='solo'){assert.equal(pose.target.x,800);assert.equal(pose.target.y,120);}
  else{
   const [x0,x1,y0,y1]=data.boundary;
   assert.equal(pose.x,(x0+x1)/2);assert.equal(pose.y,(y0+y1)/2);
   assert.ok(pose.screenY+(y0-pose.y)*pose.zoom>=upper-1);
   assert.ok(pose.screenY+(y1-pose.y)*pose.zoom<=lower+1);
   assert.ok(pose.screenX+(x0-pose.x)*pose.zoom>=0&&pose.screenX+(x1-pose.x)*pose.zoom<=size.width);
  }
  assert.ok(Math.abs(pose.screenY-(data.insets.top+size.height-data.insets.bottom)/2)<.01);
 }
 await h.host.screenshot({path:out+'/'+mode+'-'+teams+'-'+size.width+'-'+(music?'music':'quiet')+'.png'});
}

async function checkBanner(page,label){
 const selector='.br-classroom-banner';
 await page.waitForFunction(label=>{const el=document.querySelector('.br-classroom-banner');return el&&!el.hidden&&el.textContent===label;},label);
 const value=await page.locator(selector).evaluate(el=>{
  const p=el.getBoundingClientRect(),overlaps=[];
  for(const node of document.querySelectorAll('#br-host-live,#br-music-controls,#br-capture-scoreboard,.br-battle-hud,#br-joystick,#br-attack,#br-skill,.br-escape-map')){
   const q=node.getBoundingClientRect();
   if(q.width&&q.height&&q.right>p.left&&q.left<p.right&&q.bottom>p.top&&q.top<p.bottom)overlaps.push(node.id||node.className);
  }
  return {text:el.textContent,height:p.height,overlaps,aria:el.getAttribute('aria-live'),queue:auditApp.ui.classroomBanner.pending.length};
 });
 report.banners.push(value);assert.equal(value.aria,'polite');assert.ok(value.height>=28&&value.height<=40);assert.deepEqual(value.overlaps,[]);assert.ok(value.queue<=3);
}

try{
 await h.battle();
 for(const size of sizes){await cameraCase('solo',0,size,true);await cameraCase('solo',0,size,false);}
 if(!baseline){
  const {verifyCombatSupply}=await import('./v34-supply-screen.mjs');
  report.supply=await verifyCombatSupply(h);
  const w=h.room.world,[a,b]=w.game.participants;
  b.hp=1;b.spawnProtectionUntilFrame=0;b.takeDamage(200,a,false,null,{basic:true,scaled:true});assert.equal(b.alive,false);
  h.publish();const label='FIRST BLOOD! · '+a.name;await Promise.all([checkBanner(h.host,label),checkBanner(h.student,label)]);
  await Promise.all([h.host.screenshot({path:out+'/host-first-blood.png'}),h.student.screenshot({path:out+'/student-first-blood.png'})]);
  await h.student.reload();await h.student.evaluate(async()=>{window.auditApp=await import('/src/main.js');});
  await h.student.waitForFunction(seq=>auditApp.ui.classroomBanner.cursor>=seq&&!auditApp.net.restoring,w.game.classroomAnnouncements.seq);
  assert.equal(await h.student.locator('.br-classroom-banner').isHidden(),true);
 }
 for(const [i,teams] of [2,3,4].entries()){
  await h.command('END');await h.command('REMATCH');h.room.fixtureFrozen=false;
  await h.command('CONFIGURE',{mode:'team-capture',teamCount:teams});await h.battle();
  if(!baseline)assert.equal(await h.student.evaluate(()=>auditApp.ui.classroomBanner.cursor),0);
  await cameraCase('capture',teams,sizes[i],true);await cameraCase('capture',teams,sizes[i],false);
 }
 assert.deepEqual(h.errors,[]);report.status='PASS';console.log('v34 broadcast',renderer,baseline?'baseline':'changed','PASS');
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{report.ms=performance.now()-started;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await h.close();}
