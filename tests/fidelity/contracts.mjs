import assert from 'node:assert/strict';
import fs from 'node:fs';
import {openFidelity,delay} from './harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';
const h=await openFidelity({touch:true}),report={cards:[],stuns:[],renderRates:[],limits:'Two real browser contexts on one PC; FPS variants replay actual WS snapshots, not physical 120Hz devices.'};
fs.mkdirSync('artifacts/fidelity',{recursive:true});
try{
 const w=h.room.world,p=h.players[0],q=h.players[1];h.room.safePaused=true;w.game.walls=[];w.game.smokes=[];w.game.farmBoxes=[];p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(250,0);p.vel=q.vel=new w.Vec2(0,0);h.staticState();
 const candidates=[];for(const id of Object.keys(w.BR_RUN_PATHS))for(let tier=1;tier<=3;tier++)for(const grade of id==='wanggui'?['A','B','C','F']:[null]){
  let chosen;for(const a of w.EMOJI_DB){if(grade&&a.t!==grade)continue;const actor=new w.Participant(77,'candidate',a,new w.Vec2(0,0));actor.remoteId=p.remoteId;actor.lifeSeq=p.lifeSeq;w.brInitRun(actor);actor.run.paths=id==='wanggui'?{wanggui:tier-1}:{[id]:tier-1};w.brRecomputeRun(actor);if(w.brRunEffectiveNext(actor,id)){chosen={a,card:w.brRunCard(actor,id,tier)};break;}}
  if(chosen)candidates.push({id,tier,grade,...chosen});else report.cards.push({id,tier,grade,unavailable:true});
 }
 for(const [index,c]of candidates.entries()){
  const fill=Object.keys(w.BR_RUN_PATHS).filter(id=>id!==c.id).slice(0,2).map(id=>w.brRunCard(p,id,1));p.run.offer={id:'cards-'+index,level:Math.min(6,c.tier+1),cards:[c.card,...fill]};p.run.pending=1;p.run.revision++;w.game.frame+=3;h.publish();
  await h.pages[0].waitForFunction(id=>document.querySelector('#br-run-cards button')?.dataset.runOffer===id,p.run.offer.id);
  const rendered=await h.pages[0].locator('#br-run-cards button').first().evaluate(e=>({family:e.querySelector('.br-run-card-family')?.textContent,name:e.querySelector('.br-run-card-name')?.textContent,effects:[...e.querySelectorAll('.br-run-card-effect')].map(x=>x.textContent),detail:e.querySelector('.br-run-card-detail')?.textContent,overflow:e.scrollWidth>e.clientWidth+2}));
  assert.deepEqual(rendered.effects,c.card.effect.split(/\n|\s*·\s*/).filter(Boolean));assert.equal(rendered.detail,c.card.detail);assert.ok(rendered.family&&rendered.name.includes(c.card.name));assert.equal(rendered.overflow,false);report.cards.push({id:c.id,tier:c.tier,grade:c.grade,abilityId:c.a.id,pass:true,effect:c.card.effect,detail:c.card.detail});
 }
 await h.pages[0].screenshot({path:'artifacts/fidelity/augment-cards.png'});
 // MAX has five pending authoritative choices. Pointer selection must coexist with movement.
 const revision=p.run.revision;w.brInitRun(p);w.brAwardRunXP(p,20,0);p.run.revision=revision+1;h.publish();await h.pages[0].waitForFunction(id=>document.querySelector('#br-run-cards button')?.dataset.runOffer===id,p.run.offer.id);assert.equal(p.run.level,6);
 for(let i=0;i<5;i++){await h.pages[0].waitForFunction(()=>document.querySelector('#br-run-cards button:not(:disabled)'));const offer=p.run.offer.id;await h.pages[0].locator('#br-run-cards button').first().tap();await delay(80);if(p.run.choices!==i+1)console.log(JSON.stringify(await h.pages[0].evaluate(()=>({scope:fidelity.app.net.scope,life:fidelity.app.net.lifeSeq,state:fidelity.app.ui.augments.state,pending:fidelity.app.ui.augments.pending,status:document.getElementById('br-run-choice-status').textContent})),null,2));assert.equal(p.run.choices,i+1);assert.notEqual(p.run.offer?.id,offer);h.publish();await delay(60);}
 assert.equal(p.run.pending,0);assert.equal(p.run.choices,5);assert.equal(await h.pages[0].locator('#br-run-xp-text').textContent(),'MAX');assert.ok((await h.pages[0].locator('#br-run-owned').textContent()).length>0);report.fiveChoices=true;
 // Actual ten seconds of server ticks, with no attack and no injected stun.
 for(const page of h.pages)await page.evaluate(()=>{fidelity.status=[];fidelity.received=[];});h.room.safePaused=false;await delay(10000);h.room.safePaused=true;
 for(const page of h.pages)assert.equal(await page.evaluate(()=>fidelity.status.reduce((n,s)=>n+s.stars,0)),0);report.idleSeconds=10;
 for(const frames of [30,60]){
  p.vel=new w.Vec2(0,0);q.vel=new w.Vec2(0,0);p.stunned=0;p.spawnProtectionUntilFrame=0;q.spawnProtectionUntilFrame=0;const ctx=w.BRRework.context(q,w.game,new w.Vec2(-1,0),1);assert.equal(w.BRRework.applyStun(ctx,p,frames,frames),true);
  const start=w.game.frame,x=p.pos.x;h.publish();await delay(80);await h.pages[0].keyboard.down('d');
  const before=p.firedAttackSeq||0;await h.pages[0].evaluate(async()=>{const {net}=fidelity.app;await net.command('ACTION',{kind:'attack',seq:900,aim:{x:1,y:0}});});
  for(let tick=0;tick<frames+12;tick++){stepWorld(w);if(tick<frames-2)assert.equal(p.pos.x,x);if(tick%3===0){h.publish();await delay(5);}}
  await h.pages[0].keyboard.up('d');h.publish();await delay(120);assert.equal(p.firedAttackSeq||0,before);assert.equal(p.stunned,0);
  const display=await h.pages[0].evaluate(()=>fidelity.status.slice(-10).reduce((n,s)=>n+s.stars,0));assert.equal(display,0);report.stuns.push({frames,start,end:w.game.frame,blockedMovement:true,blockedAttack:true,clearedDisplay:true});
 }
 for(const page of h.pages){const rates=await page.evaluate(async()=>{const {Timeline}=await import('/src/presentation/timeline.js'),trace=fidelity.received,out=[];for(const fps of [30,60,120]){const t=new Timeline();t.setStatic(fidelity.app.timeline.static);let index=0,stars=0;const start=trace[0]?.serverTick||0,last=trace.at(-1)?.serverTick||start;for(let tick=start;tick<=last;tick+=60/fps){while(index<trace.length&&trace[index].serverTick<=tick){t.accept(trace[index],trace[index].serverTick*1000/60);index++;}const v=t.frame(tick*1000/60);if(v)for(const a of v.actors)if(a.rw?.stunEnd>0&&a.rw.stunEnd>(a.statusTick??v.renderTick)){if(!a.stunned)throw Error('fabricated stun');stars++;}}out.push({fps,activeActorFrames:stars});}return out;});report.renderRates.push(rates);}
 assert.deepEqual(h.errors,[]);fs.writeFileSync('artifacts/fidelity/contracts.json',JSON.stringify(report,null,2));console.log(JSON.stringify({cards:report.cards.length,displayed:report.cards.filter(c=>c.pass).length,idleSeconds:10,stuns:report.stuns,rates:report.renderRates}));
}finally{fs.writeFileSync('artifacts/fidelity/contracts-partial.json',JSON.stringify(report,null,2));await h.close();}
