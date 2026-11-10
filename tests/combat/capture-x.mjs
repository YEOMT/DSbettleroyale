import assert from 'node:assert/strict';import fs from 'node:fs';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',start=performance.now(),h=await auditHarness({players:2,renderer,mode:'team-capture',quality:'low',viewport:{width:1100,height:760}}),out='artifacts/upgrade/capture-'+renderer;fs.mkdirSync(out,{recursive:true});const report={renderer,steps:[]};
try{
 const ctx=await h.browser.newContext({viewport:{width:390,height:844},hasTouch:true});h.contexts.push(ctx);await ctx.route(/dropbox/,r=>r.abort());const rival=await ctx.newPage();rival.on('pageerror',e=>h.errors.push(e.message));await rival.goto(h.url+'/?room='+h.room.code+'&renderer='+renderer);await rival.locator('#br-player-name').fill('Mobile');await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();
 const members=h.room.students();await h.command('CONFIGURE',{teamCount:3,teams:{[members[0].id]:1,[members[1].id]:1,[members[2].id]:2}});await h.battle();
 const pages=[h.host,h.student,rival],w=h.room.world;for(const p of pages)await p.evaluate(async()=>{window.m=await import('/src/main.js');});
 const point=w.game.capture.points[0];for(const p of w.game.participants){p.pos=new w.Vec2(point.x,point.y);p.spawnProtectionUntilFrame=0;p.vel=new w.Vec2(0,0);}w.game.rebuildSpatialGrid();
 for(let i=0;i<145;i++){stepWorld(w);if(i%12===0){h.publish();await delay(30);}}
 for(const [i,p]of pages.entries()){
  if(i===1&&process.env.CAPTURE_ASSERT_DELAY_MS)await delay(Number(process.env.CAPTURE_ASSERT_DELAY_MS));
  // The simulation is intentionally frozen. Slow CI screenshots must not
  // turn the next student's live-HUD check into the 1.5s stale-HUD check.
  // Send through the real WebSocket path and await this exact snapshot.
  const expectedSeq=h.room.snapshotSeq+1;h.publish();await p.waitForFunction(seq=>m.timeline.lastSeq>=seq,expectedSeq);
  await p.waitForFunction(()=>m.ui.lastCapture?.z[0][2][0]===2&&m.ui.lastCapture?.z[0][2][1]===1);
  const data=await p.evaluate(()=>({backend:m.renderer.pixi?'pixi':'canvas',captureAgeMs:performance.now()-(m.renderer.session.captureReceivedAt||0),packet:m.ui.lastCapture?.z,receivedSeq:m.timeline.lastSeq,hud:document.getElementById('br-capture-scoreboard').innerText,points:m.timeline.static.captureMap.points.map(p=>[p.id,p.radius]),terrain:m.timeline.static.walls.filter(w=>w.terrain).length,wallPixels:[...m.renderer.wallImages.values()].reduce((n,c)=>n+c.width*c.height,0),maxTexture:Math.max(0,...[...m.renderer.wallImages.values()].map(c=>Math.max(c.width,c.height))),size:{width:innerWidth,scroll:document.documentElement.scrollWidth},hudBottom:document.getElementById('br-capture-scoreboard').getBoundingClientRect().bottom,battleTop:document.querySelector('.br-battle-hud').getBoundingClientRect().top,mini:!!document.querySelector('.br-capture-map'),resources:[m.renderer.sprites.size,m.renderer.textures.size,m.renderer.labels.size]}));
  report.steps.push({role:i,...data});
  assert.ok(data.captureAgeMs<1500,'live capture HUD is checked after a fresh authoritative snapshot');
  assert.equal(data.backend,renderer);assert.deepEqual(data.points,[['A',400],['B',400]]);assert.equal(data.terrain,4);assert.ok(data.hud.includes('BLUE 2 · RED 1 · GREEN 0'));assert.ok(data.hud.includes('BLUE 우세·득점 중'));assert.ok(!data.hud.includes('×1.5'));assert.ok(data.maxTexture<1024,'terrain never makes giant raster textures');assert.ok(data.size.scroll<=data.size.width,'mobile HUD does not widen viewport');if(i>0){assert.ok(data.battleTop>=data.hudBottom,'capture cards must not overlap player HP HUD');assert.ok(data.mini,'student X minimap');}await p.screenshot({path:out+'/'+i+'.png'});
 }
 await h.command('END');await h.command('REMATCH');for(const p of pages){await p.waitForFunction(()=>m.ui.room.phase==='LOBBY');assert.deepEqual(await p.evaluate(()=>[m.renderer.wallImages.size,m.renderer.textures.size,m.renderer.staticFloor.terrainPath===null]),[0,0,true]);}
 assert.deepEqual(h.errors,[]);report.status='PASS';console.log('capture X',renderer,'PASS');
}catch(e){report.status='FAIL';report.error=e.stack;throw e;}finally{report.ms=performance.now()-start;fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await h.close();}
