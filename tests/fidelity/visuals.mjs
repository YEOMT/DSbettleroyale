import assert from 'node:assert/strict';
import fs from 'node:fs';
import {openFidelity,delay} from './harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';
import {openBaseline} from '../../tools/baseline/browser.mjs';
const h=await openFidelity({renderer:process.env.FIDELITY_RENDERER||'canvas'}),report={renderer:process.env.FIDELITY_RENDERER||'canvas',cases:[]};
const cases=[['basic','emoji-000','attack',55],['slash','emoji-001','attack',45],['sniper','emoji-023','skill',100],['wizard','emoji-003','skill',150],['bubble','emoji-056','skill',180],['bats','emoji-036','skill',180],['boomerang','emoji-066','skill',180],['tennis','emoji-045','skill',180],['basketball','emoji-089','skill',200],['genie','emoji-012','skill',280],['void','emoji-132','skill',180],['dynamite','emoji-039','skill',150],['beast12','emoji-140','skill',170]];
fs.mkdirSync('artifacts/fidelity',{recursive:true});let comparison;
try{
 const w=h.room.world;h.room.safePaused=true;w.game.smokes=[];w.game.zones=[];
 let serverEvents=[];const sink=w.eventSink;w.eventSink=e=>{serverEvents.push(structuredClone(e));sink(e);};
 // Keep early short-lived shots as well as the latest return/terminal frames.
 // Software WebGL screenshots on CI can outlast a last-500-only ring buffer.
 for(const page of h.pages)await page.evaluate(()=>{const r=fidelity.app.renderer,draw=r.draw.bind(r);fidelity.draws=[];fidelity.events=[];fidelity.app.net.addEventListener('event',e=>fidelity.events.push(e.detail));r.draw=(v,n)=>{draw(v,n);fidelity.draws.push(structuredClone({tick:v.renderTick,self:v.self?.id,shots:v.shots,effects:v.effects,actors:v.actors}));if(fidelity.draws.length>500)fidelity.draws.splice(250,1);};});
 for(const [name,ability,kind,ticks]of cases){
  w.BRRework.clearWorld(w.game,'fixture');w.game.projectiles=[];w.game.zones=[];w.game.retiredShots=[];w.actionPending.clear();w.inputPending.clear();w.game.walls=[];
  // Clear the spatial index, cached wire rows and respawn queues as well as visible boxes.
  // These are empty combat fixtures; real crate collision is covered separately.
  w.brFarm.dispose(w.game);serverEvents=[];
  for(const page of h.pages)await page.evaluate(()=>{fidelity.app.controls.enabled=false;fidelity.app.controls.neutral();});await delay(40);
  for(const [i,p]of h.players.entries()){const id=p.remoteId,life=p.lifeSeq+1,team=p.team,a=w.EMOJI_DB.find(a=>a.id===ability),fresh=new w.Participant(i+1,'Fidelity'+i,a,new w.Vec2(i?300:0,i?(name==='tennis'?200:name==='basketball'?0:70):0),team);Object.assign(p,fresh,{remoteId:id,sessionId:id,lifeSeq:life,team,alive:true,connected:true,spawnProtectionUntilFrame:0,applyPlayerInput:w.brApplyPlayerInput,basicCooldown:0,cooldown:0,lastAimDir:new w.Vec2(1,0),abilityId:a.id,abilityIndex:w.EMOJI_DB.indexOf(a)});w.brInitRun(p);p.aimProfileKey=null;p.rw=null;w.session.inputs[id]={};}
  // Both tennis players have a clear lane to a real wall, away from aim-assist targets.
  if(name==='tennis')w.game.walls=[new w.Wall(-200,0,35,700,0),new w.Wall(500,0,35,700,0)];
  h.staticState();h.publish();for(const [i,page]of h.pages.entries())await page.waitForFunction(life=>fidelity.app.net.lifeSeq===life&&fidelity.app.timeline.predicted?.lifeSeq===life,h.players[i].lifeSeq);for(const page of h.pages)await page.evaluate(()=>{fidelity.app.controls.enabled=true;document.getElementById('br-toast').classList.remove('show');});
  for(const page of h.pages)await page.evaluate(()=>{fidelity.draws=[];fidelity.events=[];fidelity.app.timeline.spawns.clear();fidelity.app.timeline.terminals.clear();fidelity.app.timeline.effects=[];});
  for(const [i,page]of h.pages.entries()){await page.evaluate(({kind,i})=>{const c=fidelity.app.controls;c.lastFire={};c.fire(kind,{aim:{x:i?-1:1,y:0}});}, {kind,i});}
  for(let n=0;n<100&&h.players.some(p=>!w.actionPending.get(p.remoteId)?.length);n++)await delay(20);for(const p of h.players)assert.ok(w.actionPending.get(p.remoteId)?.length,name+' each player WS action queued');
  let saved=false;const serverTurns=new Map(),serverReturns=new Set();
  for(let tick=0;tick<ticks;tick++){
   // Keep a target alive so the visual lifetime/return can be observed; no damage formula is changed.
   for(const p of h.players){p.hp=p.maxHp;p.stunned=0;}
   stepWorld(w);for(const e of w.BRRework.world(w.game).entities){if(e.bounceCount)serverTurns.set(e.ctx.ownerId,Math.max(serverTurns.get(e.ctx.ownerId)||0,e.bounceCount));if(e.phase==='return')serverReturns.add(e.ctx.ownerId);}
   // Three 60 Hz physics ticks per 20 Hz snapshot. Let real browser animation frames run.
   if(tick%3===0){h.publish();await delay(50);}
   if(!saved&&tick>14){const v=await h.pages[0].evaluate(()=>fidelity.draws.findLast(v=>v.shots.some(q=>!q.preview)||v.effects.some(f=>f.kind==='swing')));if(v){for(const [i,page]of h.pages.entries())await page.screenshot({path:`artifacts/fidelity/${report.renderer}-${name}-student${i}.png`});saved=true;if(!comparison&&v.shots.some(q=>q.native&&!q.preview))comparison=v;}}
  }
  h.publish();await delay(100);
  const observed=[],result={name,ability,kind,server:{turns:[...serverTurns.values()],returnCount:serverReturns.size,ends:serverEvents.filter(e=>e.type==='SHOT_END').map(e=>({reason:e.data.reason,turn:e.data.turn,phase:e.data.phase}))},observed};report.cases.push(result);
  if(name==='tennis')for(const p of h.players)assert.ok(serverTurns.get(p.remoteId)>0,'server reflected each player shot before the display assertion');
  if(name==='basketball')assert.ok(serverReturns.size>0,'server entered basketball return before the display assertion');
  for(const page of h.pages){const data=await page.evaluate(()=>({events:fidelity.events,draws:fidelity.draws,feedback:!!(fidelity.app.renderer.session.hitConfirm||fidelity.app.renderer.session.damageFlash),foregroundOnTop:!fidelity.app.renderer.pixi||fidelity.app.renderer.world.children.at(-1)===fidelity.app.renderer.fg}));
   assert.ok(data.foregroundOnTop,'confirmed FX layer stays above emoji sprites');const draws=data.draws;assert.ok(draws.every(v=>v.actors.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y))),name+' finite displayed positions');const shots=draws.flatMap(d=>d.shots),effects=draws.flatMap(d=>d.effects),owners=new Set([...shots.map(q=>q.owner),...effects.map(f=>f.sourceId)]);
   for(const p of h.players)assert.ok(owners.has(p.remoteId),name+' own/opponent action actually rendered');
   for(const d of draws){const ids=d.shots.filter(q=>['projectile','hook','lob','bomb'].includes(q.kind)).map(q=>[q.owner,q.life,q.actionKind,q.actionSeq,q.ordinal].join(':'));assert.equal(new Set(ids).size,ids.length,name+' no duplicate preview/authority');}
   const fired=data.events.filter(e=>e.type==='SHOT_SPAWN'),unique=new Set(fired.filter(e=>e.data.owner===h.players[0].remoteId&&['projectile','lob'].includes(e.data.kind)).map(e=>e.data.ordinal));
   if(name==='basketball')assert.ok(shots.some(s=>s.phase==='return'),'harmless basketball return actually rendered');if(name==='tennis')for(const p of h.players)assert.ok(shots.some(s=>s.owner===p.remoteId&&s.turn>0),'own and opponent reflection actually rendered');if(name==='beast12')assert.equal(unique.size,12,'all twelve ordinals arrive');
   if(name==='basic'){const native=shots.find(s=>s.native&&!s.preview);assert.ok(native,'authoritative native shot retained among first/last 250 frames; events='+JSON.stringify(fired.map(e=>({owner:e.data.owner,kind:e.data.kind,native:e.data.native}))));assert.ok(native.style);assert.equal(native.emoji,null);assert.ok(Math.hypot(native.dx,native.dy)>1);}
   observed.push({frames:draws.length,renderedKinds:[...new Set(shots.map(s=>s.kind))],effectKinds:[...new Set(effects.map(f=>f.kind))],ordinals:[...unique],ownAndOpponent:true,noDuplicates:true,confirmedFeedback:data.feedback,turns:Math.max(0,...shots.map(s=>s.turn||0)),returnSeen:shots.some(s=>s.phase==='return'),shotCount:fired.length});
  }
  assert.ok(saved,name+' screenshot captured');console.log(report.renderer,name,'PASS');
 }
 assert.deepEqual(h.errors,[]);
 if(comparison&&report.renderer==='canvas'){
  const ref=await openBaseline();try{
   // Identical actual WS native projectile, pixel size, quality, angle and camera scale.
   const q=comparison.shots.find(q=>q.native&&!q.preview),input={...q,x:180,y:120};
   const legacy=await ref.page.evaluate(q=>{const c=document.createElement('canvas');c.width=360;c.height=240;const p=__baseline;const ctx=c.getContext('2d');p.brDrawProjectileGlyph(ctx,q.x,q.y,q.dx,q.dy,p.brStudentProjectileVisualSize(q.radius),q.emoji,q.trailColor||q.color,q.style,1,1,q.rotation||0,true,q.actionKind==='skill');return c.toDataURL();},input);
   const current=await h.pages[0].evaluate(async q=>{const {drawProjectile}=await import('/src/render/projectile.js');const c=document.createElement('canvas');c.width=360;c.height=240;const r=fidelity.app.renderer;drawProjectile({paint:r.paint,session:r.session,pixi:false,ctx:c.getContext('2d')},null,q,1);return c.toDataURL();},input);
   assert.equal(current,legacy,'actual WS native glyph equals offline v32.1 pixel raster');fs.writeFileSync('artifacts/fidelity/legacy-native.png',Buffer.from(legacy.split(',')[1],'base64'));fs.writeFileSync('artifacts/fidelity/ws-native.png',Buffer.from(current.split(',')[1],'base64'));report.matchedNativePixels=true;
  }finally{await ref.browser.close();}
 }
 fs.writeFileSync(`artifacts/fidelity/visuals-${report.renderer}.json`,JSON.stringify(report,null,2));
}finally{fs.writeFileSync(`artifacts/fidelity/visuals-${report.renderer}-partial.json`,JSON.stringify(report,null,2));await h.close();}
