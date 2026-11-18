// Exact mid-flight recovery fixture. Real WS/controls; manually stepped authority,
// not a continuous-play or network-latency performance measurement.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';
const started=performance.now(),dir='artifacts/v35-6/grapple-reconnect';fs.mkdirSync(dir,{recursive:true});
const report={status:'FAIL',rows:[],environment:{browser:process.env.PLAYWRIGHT_CHANNEL||'chromium',built:process.env.LOAD_BUILT==='1',physicalDevices:false},scope:'same member/life, actual WS reload during manually frozen grapple flight; Canvas low',unitReferences:['tests/unit/recovery356-balance.test.mjs: Mountain real self-pull/no anchor attack','tests/roster10/engine.test.mjs: first player/ally, wall, crate, turret, missed and removed anchor','tests/roster10/interaction.test.mjs: mushroom/heal-crate anchors and zero attack side effects']};
const h=await auditHarness({players:3,renderer:'canvas',quality:'low',mode:'solo',viewport:{width:1024,height:720},studentContext:{hasTouch:true}});
let evidence=()=>null;
try{
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');h.room.students().forEach((p,i)=>p.draft.abilityId=i===0?'emoji-142':'emoji-114');h.room.fixtureFrozen=true;await h.command('START_BATTLE');
 const w=h.room.world,g=w.game,R=w.BRRework,[p,q,r]=g.participants,v=(x,y=0)=>new w.Vec2(x,y),id=p.remoteId,life=p.lifeSeq;
 // A first wall anchor lies before the other player. Stationary test terrain is
 // explicit: native Wall's default random spin is not an axis-aligned fixture.
 g.walls=[Object.assign(new w.Wall(440,0,20,400,0),{spinSpeed:0})];g.smokes=[];w.brFarm.dispose(g);g.finalPhaseTriggered=true;
 p.pos=v(0);q.pos=v(650);r.pos=v(-700,500);for(const actor of [p,q,r]){actor.vel=v(0);actor.spawnProtectionUntilFrame=0;}g.rebuildSpatialGrid();h.staticState();
 const head=()=>R.world(g).entities.find(e=>!e.dead&&e.kind==='grapple'&&e.ctx.ownerId===id);
 evidence=()=>({tick:g.frame,life:p.lifeSeq,x:p.pos.x,y:p.pos.y,hp:p.hp,skill:p.firedSkillSeq,attack:p.firedAttackSeq,grapple:head()?{id:head().id,phase:head().phase,x:head().pos.x,y:head().pos.y,anchor:head().anchor}:null,targets:[q,r].map(a=>({x:a.pos.x,y:a.pos.y,hp:a.hp,stunned:a.stunned,vx:a.vel.x,vy:a.vel.y}))});
 const pages=[h.student,h.host];
 for(const page of pages)await page.evaluate(async()=>{window.m=await import('/src/main.js');window.grappleEvents=[];m.net.addEventListener('event',e=>{grappleEvents.push({type:e.detail.type,data:e.detail.data,tick:e.detail.serverTick});if(grappleEvents.length>100)grappleEvents.shift();});});
 let maxStep=0;
 async function ticks(count){for(let i=0;i<count;i++){const x=p.pos.x,y=p.pos.y;stepWorld(w);maxStep=Math.max(maxStep,Math.hypot(p.pos.x-x,p.pos.y-y));if(i%3!==2&&i!==count-1)continue;h.publish();await delay(55);await Promise.all(pages.map(page=>page.waitForFunction(t=>m.timeline.samples.at(-1)?.state.serverTick>=t,g.frame)));}}
 async function fire(kind){await h.student.waitForFunction(k=>m.controls.state(k).canFire,kind);await h.student.locator('#br-'+kind).click();for(let i=0;i<80&&!w.actionPending.get(id)?.length;i++)await delay(10);assert.ok(w.actionPending.get(id)?.length,'real browser command reaches authority');await ticks(1);}
 await ticks(3);const before=evidence(),epoch=await h.student.evaluate(()=>m.net.scope.connectionEpoch);await fire('skill');await ticks(3);
 assert.equal(head()?.phase,'flight');assert.ok(head().pos.x>0&&head().pos.x<425,'rope has actually travelled before reconnect');assert.equal(p.firedSkillSeq,1);assert.equal(p.pos.x,0);const entityId=head().id;
 report.beforeReconnect=evidence();report.rows.push({name:'actual skill input creates a live 800-range rope flight',status:'PASS'});
 await h.student.reload();await h.student.evaluate(async()=>{window.m=await import('/src/main.js');});
 await h.student.waitForFunction(({id,life,epoch})=>!m.net.restoring&&m.net.ws?.readyState===1&&m.controls.enabled&&m.net.session.playerId===id&&m.net.lifeSeq===life&&m.net.scope.connectionEpoch>epoch,{id,life,epoch});
 assert.equal(h.room.world,w);assert.equal(w.byId.get(id),p);assert.equal(p.lifeSeq,life);assert.equal(head()?.id,entityId);assert.equal(head()?.phase,'flight');
 await h.student.waitForFunction(id=>m.timeline.samples.at(-1)?.state.shots.some(e=>e.id===id&&e.kind==='grapple'),entityId);
 report.reconnect={sameMember:true,sameLife:life,epochBefore:epoch,epochAfter:await h.student.evaluate(()=>m.net.scope.connectionEpoch),authority:evidence()};
 report.rows.push({name:'same member and life resume the existing in-flight rope in FULL_STATE',status:'PASS'});
 await ticks(45);assert.equal(head(),undefined);assert.ok(p.pos.x>300);assert.ok(p.pos.x<=430-p.radius+.01);assert.ok(Math.abs(p.pos.y)<.01);assert.ok(maxStep<=38.01&&maxStep>=37.99);assert.equal(p.hp,before.hp);
 assert.deepEqual(evidence().targets,before.targets);assert.equal(R.inputLocks(p,g).move,false);assert.equal(R.inputLocks(p,g).attack,false);
 const hostEvents=await h.host.evaluate(()=>grappleEvents);assert.ok(!hostEvents.some(e=>e.type==='FX'&&e.data.kind==='hit'&&e.data.geometry?.confirmed));
 report.arrival={...evidence(),radius:p.radius,wallLeft:430,maxStep};report.rows.push({name:'first wall anchor stops self-pull safely; no target damage, stun or displacement',status:'PASS'});
 const x=p.pos.x,oldAttack=p.firedAttackSeq||0;await h.student.keyboard.down('a');await delay(80);await ticks(6);await h.student.keyboard.up('a');await delay(60);await ticks(2);assert.ok(p.pos.x<x-10,'restored keyboard movement changes authoritative position');
 await fire('attack');await ticks(3);assert.ok(p.firedAttackSeq>oldAttack);await h.host.waitForFunction(id=>grappleEvents.some(e=>e.type==='SHOT_SPAWN'&&e.data.owner===id&&e.data.actionKind==='attack'),id);
 report.recoveredInput={xBefore:x,xAfter:p.pos.x,attackBefore:oldAttack,attackAfter:p.firedAttackSeq};report.rows.push({name:'after restored arrival, real movement/basic input executes and host receives the shot',status:'PASS'});
 await h.command('END');for(const page of pages)await page.locator('#br-results').waitFor();await h.command('REMATCH');
 const poseMaps=['active','hurts','walls','contacts','fired','hurtLedger','wallLedger','contactLedger','outputs'];report.cleanup=[];
 for(const page of pages){await page.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&!m.net.restoring);const state=await page.evaluate(keys=>({poses:keys.map(k=>m.renderer.poses[k]?.size||0),samples:m.timeline.samples.length,sprites:m.renderer.sprites.size,textures:m.renderer.textures.size}),poseMaps);assert.deepEqual(state.poses,poseMaps.map(()=>0));assert.equal(state.samples,0);assert.equal(state.sprites,0);assert.equal(state.textures,0);report.cleanup.push(state);}
 assert.equal(w.disposed,true);assert.equal(w.byId.size,0);assert.equal(w.actionPending.size,0);assert.equal(w.inputPending.size,0);assert.equal(h.room.students().filter(p=>p.connected).length,3);assert.deepEqual(h.errors,[]);report.rows.push({name:'same-room rematch disposes grapple, queues and browser resources',status:'PASS'});report.status='PASS';
}catch(error){report.error=error.stack;report.authority=evidence();throw error;}
finally{report.ms=performance.now()-started;report.errors=h.errors;try{await h.close();}catch(error){report.teardownError=error.stack;report.status='FAIL';throw error;}finally{fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,ms:report.ms,rows:report.rows.length,dir}));}}
