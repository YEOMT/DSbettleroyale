import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';

const renderer=process.argv[2]||'canvas',out='artifacts/v35/screens-'+renderer;
fs.mkdirSync(out,{recursive:true});
const h=await auditHarness({players:1,renderer,quality:'low',viewport:{width:960,height:640}});
const report={renderer,cases:[]};
try{
 const ctx=await h.browser.newContext({viewport:{width:844,height:640},hasTouch:true});h.contexts.push(ctx);
 await ctx.route(/dropbox/,route=>route.abort());
 const rival=await ctx.newPage();rival.on('pageerror',e=>h.errors.push(e.message));
 await rival.goto(h.url+'/?room='+h.room.code+'&renderer='+renderer);
 await rival.locator('#br-player-name').fill('Peer');await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();
 const pages=[h.student,rival,h.host];
 for(const page of pages)await page.evaluate(async()=>{
  const m=window.m=await import('/src/main.js');window.seen={kinds:{},turns:[],critical:false,iron:false};
  const draw=m.renderer.draw.bind(m.renderer);
  m.renderer.draw=(view,now)=>{
   draw(view,now);
   for(const id of m.renderer.roster10Visible||[]){const s=view.shots.find(s=>s.id===id);if(s)seen.kinds[s.kind]=true;}
   seen.iron||=view.actors.some(a=>a.rw?.buffs?.some(b=>b.kind==='ironReflect'));
   seen.critical||=view.effects.some(f=>f.style==='sniper-critical');
  };
  m.net.addEventListener('event',e=>{if(e.detail.type==='SHOT_TURN')seen.turns.push(e.detail.data);});
 });
 let w,g,p,q;
 async function battle(ids){
  await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');
  h.room.students().forEach((member,i)=>member.draft.abilityId=ids[i]);h.room.fixtureFrozen=true;
  await h.command('START_BATTLE');
  w=h.room.world;g=w.game;[p,q]=h.room.students().map(m=>w.byId.get(m.id));
  g.finalPhaseTriggered=true;w.brFarm.dispose(g);g.walls=[];g.smokes=[];
  [p,q].forEach((a,i)=>{a.pos=new w.Vec2(i*440,0);a.vel=new w.Vec2(0,0);a.spawnProtectionUntilFrame=0;});
  g.rebuildSpatialGrid();h.staticState();h.publish();
  for(const page of pages)await page.waitForFunction(match=>m.ui.room.matchId===match&&m.ui.room.phase==='BATTLE'&&m.renderer.enabled,h.room.matchId);
  for(const page of pages.slice(0,2))await page.waitForFunction(()=>m.controls.enabled&&m.net.profilesReady&&m.timeline.predicted?.alive);
 }
 async function ticks(n){
  const peers=Array.from(h.room.members.values(),m=>m.peer);
  for(let i=0;i<n;i++){
   for(const peer of peers)peer.beginBatch();
   try{stepWorld(w);if(i%3===2||i===n-1)h.publish();}
   finally{for(const peer of peers)peer.endBatch();}
   if(i%3===2)await delay(50);
  }
 }
 async function skill(page,actor,dx){
  await page.evaluate(dx=>m.controls.fire('skill',{aim:{x:dx,y:0},power:1}),dx);
  const until=Date.now()+4000;
  while(!w.actionPending.get(actor.remoteId)?.some(x=>x.kind==='skill')){
   if(Date.now()>until)throw Error('missing real skill input '+actor.ability.id);
   await delay(10);
  }
 }
 async function finish(){
  await h.command('END');for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='RESULTS');
  await h.command('REMATCH');for(const page of pages)await page.waitForFunction(()=>m.ui.room.phase==='LOBBY'&&m.renderer.textures.size===0);
 }
 await battle(['emoji-023','emoji-153']);await skill(rival,q,-1);await ticks(8);
 for(const page of pages)await page.waitForFunction(()=>seen.kinds.mirror);
 await rival.screenshot({path:out+'/mirror.png'});
 const before=p.hp,defense=q.hp;await skill(h.student,p,1);
 const random=w.rand;try{w.rand=()=>0;await ticks(1);}finally{w.rand=random;}
 await ticks(45);
 assert.ok(p.hp<before);assert.equal(q.hp,defense);
 for(const page of pages){
  await page.waitForFunction(()=>seen.turns.length===1&&seen.turns[0].crit===true&&seen.critical);
  assert.equal(await page.evaluate(()=>m.renderer.pixi?'pixi':'canvas'),renderer);
 }
 report.cases.push({skill:'mirror',turns:1,screens:3,defenderLoss:defense-q.hp,shooterLoss:before-p.hp});
 await finish();await battle(['emoji-152','emoji-028']);
 g.walls=[new w.Wall(215,0,25,220,0)];h.staticState();
 await skill(rival,q,-1);await skill(h.student,p,1);await ticks(15);
 for(const page of pages)await page.waitForFunction(()=>seen.kinds.spotlight&&seen.iron);
 await h.host.screenshot({path:out+'/spotlight-host.png'});
 await h.student.screenshot({path:out+'/portal-spotlight-student.png'});
 await ticks(22);assert.ok(q.stunned>=178);
 await rival.reload();await rival.waitForFunction(async()=>{window.m=await import('/src/main.js');return !m.net.restoring&&m.timeline.predicted?.rw?.stunEnd>0;});
 await ticks(182);await rival.waitForFunction(()=>m.controls.enabled&&!m.timeline.predicted?.stunned);await finish();
 report.cases.push({skill:'spotlight',screens:3,behindCover:true,resumed:true});
 assert.deepEqual(h.errors,[]);report.status='PASS';console.log('evolution browser',renderer,report);
}catch(error){report.status='FAIL';report.error=error.stack;throw error;}
finally{fs.writeFileSync(out+'/result.json',JSON.stringify(report,null,2));await h.close();}
