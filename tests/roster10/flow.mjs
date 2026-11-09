// Three actual WS screens, reused for all new characters. Manual authority ticks
// provide deterministic visibility barriers; long real-time load is separate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditHarness,delay} from '../fidelity-v33-2/harness.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';
const renderer=process.argv[2]||'canvas',started=performance.now(),rows=[];
const selected=process.env.ROSTER10_IDS?process.env.ROSTER10_IDS.split(',').map(Number):Array.from({length:10},(_,i)=>141+i);
if(selected.some(x=>!Number.isInteger(x)||x<141||x>150))throw Error('INVALID_NEW_ID');
if(!['canvas','pixi'].includes(renderer))throw Error('INVALID_RENDERER');
const h=await auditHarness({players:1,mode:'team-capture',renderer,quality:'balanced',viewport:{width:1024,height:768}});
fs.mkdirSync('artifacts/roster10',{recursive:true});
try{
 const ctx=await h.browser.newContext({viewport:{width:1024,height:768}});h.contexts.push(ctx);await ctx.route(/dropbox/,r=>r.abort());
 const rival=await ctx.newPage();rival.on('pageerror',e=>h.errors.push(e.message));await rival.goto(h.url+'/?room='+h.room.code+'&renderer='+renderer);await rival.locator('#br-player-name').fill('Synthetic opponent');await rival.locator('#br-join-btn').click();await rival.locator('#br-student-wait').waitFor();
 await h.battle();const pages=[h.student,rival,h.host],roles=['attacker','opponent','host'],w=h.room.world,[a,b]=h.room.students().map(m=>w.byId.get(m.id));
 w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];h.staticState();
 for(const page of pages)await page.evaluate(async()=>{window.m=await import('/src/main.js');m.controls.enabled=false;m.renderer.enabled=false;window.drawn=[];window.received=[];m.net.addEventListener('event',e=>{received.push(e.detail);if(received.length>400)received.shift();});});
 async function paint(){h.publish();const tick=w.game.frame;for(const page of pages){await page.waitForFunction(t=>m.timeline.samples.at(-1)?.state.serverTick>=t,tick);await page.evaluate(()=>{const v=m.timeline.frame();m.renderer.draw(v,performance.now());drawn.push({tick:v.renderTick,actors:v.actors.map(a=>a.id),shots:v.shots.map(s=>({id:s.id,kind:s.kind})),visible:[...(m.renderer.roster10Visible||[])],walls:v.dynamicWalls?.revision||0,pixi:!!m.renderer.pixi});if(drawn.length>200)drawn.shift();});}}
 async function step(n){for(let i=0;i<n;i++){stepWorld(w);if(i<12||i%6===0||i===n-1){await paint();await delay(20);}}}
 for(const number of selected){
  const id='emoji-'+number;w.BRRework.clearWorld(w.game,'roster-case');w.game.projectiles=[];w.game.retiredShots=[];w.game.zones=[];w.actionPending.clear();w.inputPending.clear();
  for(const [i,p]of [a,b].entries()){const ability=w.EMOJI_DB.find(q=>q.id===(i?'emoji-114':id)),remoteId=p.remoteId,life=p.lifeSeq+1,team=i+1;
   const fresh=new w.Participant(i+1,'Actor '+i,ability,new w.Vec2(i?200:0,0),team);Object.assign(p,fresh,{remoteId,sessionId:remoteId,lifeSeq:life,team,alive:true,humanControlled:true,connected:true,abilityId:ability.id,abilityIndex:w.EMOJI_DB.indexOf(ability),spawnProtectionUntilFrame:0,applyPlayerInput:w.brApplyPlayerInput,basicCooldown:0,cooldown:0,aimProfileKey:null,rw:null});w.brInitRun(p);w.session.inputs[remoteId]={};}
  b.hp=b.maxHp=100000;b.pos.x=a.radius+b.radius+4;await paint();for(const page of pages)await page.evaluate(()=>{drawn=[];received=[];});
  const send=kind=>h.student.evaluate(async kind=>m.net.command('ACTION',{kind,seq:++m.controls.actions[kind],aim:{x:1,y:0},aimPower:1}),kind);
  assert.equal((await send('attack')).accepted,true);await step(30);assert.ok(b.hp<b.maxHp,id+' actual basic damage');
  const basic=await Promise.all(pages.map(p=>p.evaluate(()=>({drawn:structuredClone(drawn),events:received.filter(e=>['SHOT_SPAWN','FX'].includes(e.type)).length}))));
  for(const [i,data]of basic.entries()){assert.ok(data.events>0,id+' '+roles[i]+' basic events');assert.ok(data.drawn.some(f=>f.actors.includes(a.remoteId)),id+' actor rendered');assert.ok(data.drawn.every(f=>f.pixi===(renderer==='pixi')),roles[i]+' actual backend');}
  // Start each skill from an unobstructed common geometry; no skill lock or
  // cooldown is removed after the actual skill command.
  a.pos=new w.Vec2(0,0);b.pos=new w.Vec2(200,0);a.vel=new w.Vec2(0,0);b.vel=new w.Vec2(0,0);a.stunned=0;await paint();
  assert.equal((await send('skill')).accepted,true);await step(60);assert.ok(a.firedSkillSeq>0,id+' skill fired');assert.ok(a.cooldown>0,id+' cooldown');
  if(number===144){const trap=w.game.rw.entities.find(e=>!e.dead&&e.kind==='mushroom');assert.ok(trap);b.pos=new w.Vec2(trap.pos.x,trap.pos.y);await step(12);}
  const expected=({141:'decoy',142:'grapple',143:'ring-wall',144:'mushroom'})[number];
  const screens=await Promise.all(pages.map(p=>p.evaluate(()=>({frames:drawn.length,visible:[...new Set(drawn.flatMap(f=>f.visible))],shots:[...new Set(drawn.flatMap(f=>f.shots.map(s=>s.kind)))],walls:Math.max(...drawn.map(f=>f.walls)),effects:received.filter(e=>e.type==='FX').length}))));
  rows.push({id,basic:basic.map(x=>({events:x.events,frames:x.drawn.length})),screens,skill:a.firedSkillSeq,authority:{received:a.receivedSkillSeq,resolved:a.resolvedSkillSeq,cooldown:a.cooldown,entities:w.game.rw.entities.map(e=>({kind:e.kind,end:e.end})),tick:w.game.frame},status:'CHECKING'});
  if(expected)for(const [i,s]of screens.entries()){assert.equal(s.shots.includes(expected),number!==144||i===0,id+' '+roles[i]+' snapshot visibility '+expected+' '+JSON.stringify(rows.at(-1)));if(number===144&&i!==0)assert.ok(!s.shots.includes('mushroom'),'untriggered trap hidden');assert.ok(s.visible.length>0,id+' '+roles[i]+' persistent entity painted');}
  if(number===144)for(const s of screens)assert.ok(s.shots.includes('poison'),'confirmed mushroom trigger painted poison');
  for(const [i,page]of pages.entries())if(number<=144)await page.screenshot({path:`artifacts/roster10/${renderer}-${id}-${roles[i]}.png`});
  rows.at(-1).status='PASS';
  console.log('PASS',renderer,id,'attacker/opponent/host');
 }
 await h.command('END');await h.command('REMATCH');for(const page of pages){await page.waitForFunction(()=>m.ui.room.phase==='LOBBY');assert.deepEqual(await page.evaluate(()=>[m.renderer.roster10Rings?.size||0,m.renderer.roster10Visible?.size||0,m.renderer.sprites.size]),[0,0,0]);}
 assert.deepEqual(h.errors,[]);console.log('roster10 three-screen',renderer,'PASS',rows.length);
}finally{fs.writeFileSync(`artifacts/roster10/flow-${renderer}${process.env.ROSTER10_IDS?'-'+selected.join('-'):''}.json`,JSON.stringify({ms:performance.now()-started,renderer,selected,scope:'Selected new characters, normal WS actions and actual renderer draws on attacker/opponent/host; accelerated ticks, not continuous performance.',rows,errors:h.errors},null,2));await h.close();}
