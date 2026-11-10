import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',start=performance.now(),h=await auditHarness({players:2,renderer,quality:'low',viewport:{width:844,height:390},studentContext:{hasTouch:true}}),report={renderer};
try{
 await h.battle();const w=h.room.world,p=w.byId.get(h.room.students()[0].id),a=w.game.escapeMap.portal.a,b=w.game.escapeMap.portal.b;
 for(const page of [h.student,h.host])await page.evaluate(async()=>{window.m=await import('/src/main.js');});
 p.pos=new w.Vec2(a.x,a.y);p.vel=new w.Vec2(0,0);p.spawnProtectionUntilFrame=0;const hp=p.hp,cd=p.cooldown;stepWorld(w);assert.equal(p.pos.x,b.x);assert.equal(p.hp,hp);assert.ok(p.cooldown<=cd);h.publish();
 for(const page of [h.student,h.host]){await page.waitForFunction(()=>m.timeline.escape?.nextReadyAt>0);await page.waitForFunction(()=>!!m.renderer.escapeMini);assert.equal(await page.evaluate(()=>!!m.renderer.pixi),renderer==='pixi');}
 await h.student.waitForFunction(x=>Math.abs(m.timeline.predicted.x-x)<1,b.x);await h.student.reload();await h.student.evaluate(async()=>{window.m=await import('/src/main.js');});await h.student.waitForFunction(()=>m.controls.enabled&&!m.net.restoring&&m.timeline.escape?.nextReadyAt>0);
 // Actual resumed UI input reaches normal authority; warp must not restore old A.
 const pos={x:p.pos.x,y:p.pos.y};await h.student.keyboard.down('d');await delay(100);for(let i=0;i<12;i++)stepWorld(w);await h.student.keyboard.up('d');assert.ok(p.pos.x>pos.x);h.publish();
 const pad=w.game.escapeMap.pads[0];p.pos=new w.Vec2(pad.x,pad.y);p.vel=new w.Vec2(0,0);stepWorld(w);h.publish();await h.student.waitForFunction(()=>m.timeline.escape?.pads[0]>0);assert.ok(p.escapeBoostUntil>w.game.frame);
 fs.mkdirSync('artifacts/upgrade',{recursive:true});await h.student.screenshot({path:'artifacts/upgrade/escape-'+renderer+'.png'});report.map=w.game.escapeMap;report.restoredMovement=p.lastAppliedSeq;report.status='PASS';
 await h.command('END');await h.command('REMATCH');await h.student.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&!m.timeline.escape&&!m.renderer.escapeMini);assert.deepEqual(h.errors,[]);console.log('escape',renderer,'PASS');
}catch(e){report.status='FAIL';report.error=e.message;throw e;}finally{fs.mkdirSync('artifacts/upgrade',{recursive:true});fs.writeFileSync('artifacts/upgrade/escape-'+renderer+'.json',JSON.stringify({...report,ms:performance.now()-start,errors:h.errors},null,2));await h.close();}
