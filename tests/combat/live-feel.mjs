// Three independent render surfaces, actual student key presses, uninterrupted 60/20 Hz authority.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
const renderer=process.argv[2]||'canvas',viewport={width:800,height:520},started=Date.now();
const h=await auditHarness({renderer,quality:'low',players:1,mode:'team-elim',viewport});
const checks=[];
try{
 const ctx=await h.browser.newContext({viewport});h.contexts.push(ctx);await ctx.route(/dropbox/,r=>r.abort());
 const rival=await ctx.newPage();rival.on('pageerror',e=>h.errors.push(e.message));
 await rival.goto(h.url+'/?renderer='+renderer+'&room='+h.room.code);await rival.locator('#br-player-name').fill('Target');await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();
 await h.battle();const pages=[h.student,rival,h.host],w=h.room.world,[a,b]=h.room.students().map(m=>w.byId.get(m.id));
 const steps=[],step=w.brMoveBasicStep;w.brMoveBasicStep=(pos,aim,distance,...rest)=>{
  const x=pos.x,y=pos.y,end=step(pos,aim,distance,...rest);steps.push({requested:distance,actual:Math.hypot(end.x-x,end.y-y)});return end;
 };
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];h.staticState();
 for(const page of pages){
  await page.evaluate(async()=>{
   window.m=await import('/src/main.js');const r=m.renderer,body=r.actorBody.bind(r),image=r.image.bind(r);
   const objects=()=>[...r.sprites.values(),...r.textures.values()];let previous=new Set(objects());window.objectCounts={created:0,removed:0};
   const draw=r.draw.bind(r);r.draw=(view,now)=>{draw(view,now);const next=new Set(objects());for(const o of next)if(!previous.has(o))objectCounts.created++;for(const o of previous)if(!next.has(o))objectCounts.removed++;previous=next;};
   window.bodyDraws=[];window.castEvents=[];window.poseSamples=[];let current=null;
   const accept=r.poses.accept.bind(r.poses);r.poses.accept=(e,actors,now)=>{accept(e,actors,now);if(['SHOT_SPAWN','FX'].includes(e.type))castEvents.push([e.type,e.data.kind,e.data.geometry?.seq,e.data.actionSeq,e.serverTick,[...r.poses.active.values()].map(s=>[s.family,s.tick,s.id])]);if(castEvents.length>32)castEvents.shift();};
   const sample=r.poses.sample.bind(r.poses);r.poses.sample=(a,z,t,n,rm,low)=>{const s=r.poses.active.get(a.id),out=sample(a,z,t,n,rm,low);if(s){poseSamples.push([s.family,a.lifeSeq,s.life,s.tick,t,Math.round(n-s.born),rm,!!out]);if(poseSamples.length>24)poseSamples.shift();}return out;};
   r.actorBody=(src,actor,...args)=>{current=actor;try{return body(src,actor,...args);}finally{current=null;}};
   r.image=(src,x,y,radius,key,angle,alpha,squash)=>{
    image(src,x,y,radius,key,angle,alpha,squash);
    if(!current||(!angle&&!squash))return;
    const pose=r.poses.active.get(current.id);
    if(pose&&!bodyDraws.some(row=>row.id===pose.id&&row.life===pose.life&&row.kind===pose.kind&&row.family===pose.family&&row.seq===pose.seq)){
     bodyDraws.push({id:pose.id,life:pose.life,kind:pose.kind,family:pose.family,seq:pose.seq,dx:x-current.x,dy:y-current.y,angle,squash});
    }
   };
  });
 }
 const toggle=h.host.locator('#br-focus-toggle');await toggle.click();assert.match(await toggle.textContent(),/전투 집중/);await toggle.click();assert.match(await toggle.textContent(),/전체 관전/);
 h.room.safePaused=false;await delay(500);
 for(const [abilityId,kind,family] of [['emoji-013','attack','slash'],['emoji-025','attack','heavy'],['emoji-023','skill','recoil'],['emoji-003','skill','burst'],['emoji-024','skill','orbit'],['emoji-010','skill','field']]){
  w.BRRework.clearWorld(w.game,'next-case');w.game.projectiles.length=0;w.game.zones.length=0;
  for(const [i,p] of [a,b].entries()){
   const id=p.remoteId,life=p.lifeSeq+1,team=p.team,ability=w.EMOJI_DB.find(q=>q.id===(i?'emoji-001':abilityId));
   const fresh=new w.Participant(i+1,'Actor '+i,ability,new w.Vec2(400+i*(kind==='attack'?95:260),220),team);
   Object.assign(p,fresh,{remoteId:id,sessionId:id,lifeSeq:life,team,alive:true,humanControlled:true,connected:true,abilityId:ability.id,abilityIndex:w.EMOJI_DB.indexOf(ability),spawnProtectionUntilFrame:0,applyPlayerInput:w.brApplyPlayerInput,basicCooldown:0,cooldown:0,aimProfileKey:null,rw:null});
   w.brInitRun(p);w.session.inputs[id]={};w.actionPending.delete(id);w.inputPending.delete(id);
  }
  const life=a.lifeSeq,tick=w.game.frame;h.publish();
  for(const page of pages)await page.waitForFunction(({id,life})=>m.timeline.samples.at(-1)?.state.actors.some(p=>p.id===id&&p.lifeSeq===life),{id:a.remoteId,life});
  const stepStart=steps.length,hp=b.hp;await h.student.keyboard.press(kind==='skill'?'q':'Space');
  const seq=await h.student.evaluate(k=>m.controls.actions[k],kind);
  for(const [role,page] of pages.entries()){
   try{
    await page.waitForFunction(({id,life,seq,family})=>bodyDraws.some(row=>row.id===id&&row.life===life&&row.seq===seq&&row.family===family),{id:a.remoteId,life,seq,family},{timeout:7000});
    if(kind==='attack')await page.waitForFunction(({id,life})=>bodyDraws.some(row=>row.id===id&&row.life===life&&row.family==='hit'),{id:b.remoteId,life:b.lifeSeq},{timeout:3500});
   }catch(error){
    throw Error(JSON.stringify({abilityId,kind,family,role,seq,life,step:w.game.frame-tick,fired:[a.firedAttackSeq,a.firedSkillSeq],draws:await page.evaluate(()=>({draws:bodyDraws.slice(-6),events:castEvents,samples:poseSamples})),events:w.game.studentFx.slice(-5).map(e=>[e.type,e.geometry?.kind,e.geometry?.seq]),fault:h.room.lastFault}),{cause:error});
   }
  }
  assert.equal(a[kind==='attack'?'firedAttackSeq':'firedSkillSeq'],seq);
  if(family==='recoil')assert.ok(w.game.frame-tick>=24,'sniper recoil must wait for the projectile, past its windup');
  if(kind==='attack'){assert.ok(b.hp<hp,'confirmed damage');const distance=w.brBasicStepDistance(a.ability,a.run.mods,w.brCooldownRate(a,'attack'));assert.equal(steps.length,stepStart+1);assert.ok(Math.abs(steps.at(-1).actual-distance)<.1,JSON.stringify({distance,observed:steps.at(-1)}));}
  checks.push({abilityId,family,seq,step:steps.length>stepStart?steps.at(-1):null,advancedTicks:w.game.frame-tick,screens:3});
 }
 await h.command('END');await h.command('REMATCH');await h.student.locator('#br-student-wait').waitFor();
 await h.command('START_QUIZ');await h.command('BEGIN_DRAFT');await h.command('START_BATTLE');await h.student.waitForFunction(()=>m.timeline.samples.at(-1)?.state.serverTick>3);
 await h.command('END');await h.command('REMATCH');await h.student.locator('#br-student-wait').waitFor();
 // Each socket independently receives the rematch. The first student's lobby
 // cannot establish that the rival and teacher have left the old battle yet.
 await Promise.all(pages.map(page=>page.waitForFunction(matchId=>m.ui.room?.matchId===matchId&&m.ui.room.phase==='LOBBY'&&!m.renderer.enabled,h.room.matchId)));
 const resources=await Promise.all(pages.map(page=>page.evaluate(()=>({...objectCounts,retained:m.renderer.sprites.size+m.renderer.textures.size,poses:m.renderer.poses.active.size}))));
 for(const row of resources){assert.equal(row.retained,0,JSON.stringify(resources));assert.equal(row.poses,0);}
 checks.push({afterTwoRematches:resources});
 assert.deepEqual(h.errors,[]);console.log(checks);
}finally{fs.mkdirSync('artifacts/combat',{recursive:true});fs.writeFileSync('artifacts/combat/feel-'+renderer+'.json',JSON.stringify({ms:Date.now()-started,checks},null,2));await h.close();}
