import {expected355} from '../v35-5/approved.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createWorld,createRuleContext,stepWorld,destroyWorld,getParticipation} from '../../packages/engine/src/index.js';
import {RoomManager} from '../../apps/server/src/rooms/room.js';
import {validParticipation,validResultPresentation} from '../../packages/protocol/src/participation.js';
import {GROUND_DAMAGE,nativeGroundMultiplier} from '../../packages/engine/src/combat/ground-damage.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {rosterMechanics,sameMechanics} from '../../tools/ci/roster-scope.mjs';
import {drawRuleText,abilityAllowed} from '../../packages/content/src/battle-rules.js';
import {effectTick,remainingEffect} from '../../apps/client/src/presentation/effect-status.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
import {Connection} from '../../apps/client/src/net/connection.js';
import {createPainters} from '../../apps/client/src/render/original-painters.js';
import {paintFixedCover} from '../../apps/client/src/render/original-scene.js';
import {drawRoster10Scene} from '../../apps/client/src/render/roster10-scene.js';
import {ResultFlow} from '../../apps/client/src/ui/result-flow.js';
function fixture(t,mode='solo',ids=['emoji-025','emoji-114','emoji-113'],rule='normal'){
 const w=createWorld(undefined,{mode,mapIndex:0,drawRule:rule},'polish',ids.map((abilityId,i)=>({id:'p'+i,name:'Test '+i,abilityId,team:mode==='solo'?0:i?2:1})));t.after(()=>destroyWorld(w));w.game.finalPhaseTriggered=true;w.brFarm.dispose(w.game);w.game.walls=[];w.game.zones=[];w.game.smokes=[];for(const [i,p]of w.game.participants.entries()){p.pos=new w.Vec2(i*120,0);p.vel=new w.Vec2(0,0);p.hp=p.maxHp=5000;p.spawnProtectionUntilFrame=0;}w.game.rebuildSpatialGrid();return w;
}
const tick=(w,n)=>{for(let i=0;i<n;i++)stepWorld(w);};
function roomFixture(t){let now=1000;const m=new RoomManager({maxRooms:4,maxPlayers:30,maxActiveBattles:4,roomTtlMs:100000},{now:()=>now});m.changed=()=>{};const r=m.create('Teacher');r.host.connected=true;const a=r.addMember('A'),b=r.addMember('B');m.startBattle=r=>{r.world=createWorld(undefined,{...r.config,matchId:r.matchId},r.matchId,r.students().map(p=>({id:p.id,name:p.name,team:p.team,abilityId:p.draft.abilityId})));};t.after(()=>{for(const r of m.rooms.values())if(r.world)destroyWorld(r.world);});return {m,r,a,b,setNow:n=>now=n,start(){r.command(r.host,'START_QUIZ',{});now+=5000;m.sweep();r.beginDraft();r.command(r.host,'START_BATTLE',{});}};}

test('B02/D01: final 86 authority definitions differ only at six approved ground coefficients',()=>{
 const before=JSON.parse(fs.readFileSync(new URL('../v35-4/baseline.json',import.meta.url))).mechanics,after=rosterMechanics(manifest);assert.equal(Object.keys(after).length,86);
 for(const [id,[,field]]of Object.entries(GROUND_DAMAGE.rework)){before[id].definition.skill[field]*=1.1;before[id].skill[field]*=1.1;}
 for(const id of Object.keys(before))assert.ok(sameMechanics(expected355({...before[id],id}),after[id]),id+' unapproved mechanics delta');
});
test('S01/S07/S09: rank-first normal RNG unchanged; special draws honor tier and teamOnly',()=>{
 const s=createRuleContext();for(const mode of ['solo','team-elim','team-capture','team-respawn'])for(const rule of ['normal','f-only','s-only']){
  let last=-1;for(let i=0;i<120;i++){const rand=s.brHashRandom(mode+i),index=s.brAbilityIndex(mode,last,null,rand,rule),a=s.EMOJI_DB[index];assert.ok(abilityAllowed(a,mode,rule));if(rule!=='normal')assert.equal(a.t,rule==='f-only'?'F':'S');else assert.equal(index,s.brAbilityIndex(mode,last,null,s.brHashRandom(mode+i)));last=index;}
 }
 assert.deepEqual(['normal','f-only','s-only'].map(drawRuleText),['일반 대전','F급 구렁텅이 대전','S급 천상계 대전']);
 assert.throws(()=>s.brAbilityIndex('solo',-1,null,()=>0,'bad'),/DRAW/);
 const old=s.EMOJI_DB;s.EMOJI_DB=[];assert.throws(()=>s.brAbilityIndex('solo',-1,null,()=>0,'f-only'));s.EMOJI_DB=[old.find(a=>a.t==='F')];assert.equal(s.brAbilityIndex('solo',0,null,()=>.2,'f-only'),0);
});
test('S02/S03/S05/S06/S07: room-local settings, corrupt recovery and five rematches normal→F→S→S→normal',t=>{
 const f=roomFixture(t),{r,m}=f,other=m.create('Other');
 for(const [round,rule]of ['normal','f-only','s-only','s-only','normal'].entries()){
  r.configure({drawRule:rule});r.command(r.host,'START_QUIZ',{});f.setNow(6000+round*10000);m.sweep();for(const p of r.students())p.quiz.score=9;r.beginDraft();
  for(const p of r.students()){assert.ok(r.validAssignment(p.draft.abilityId));r.command(p,'DRAFT_REROLL',{draftRevision:p.draft.revision});const old=structuredClone(p.draft);p.draft.abilityId=rule==='s-only'?'emoji-114':'invalid';r.command(p,'DRAFT_RECOVER',{});assert.equal(p.draft.abilityId,old.abilityId);assert.equal(p.draft.spent,old.spent);r.command(p,'DRAFT_CONFIRM',{draftRevision:p.draft.revision});}
  r.command(r.host,'START_BATTLE',{});assert.equal(r.world.session.roomMeta.drawRule,rule);r.finish();r.command(r.host,'REMATCH',{});assert.equal(r.config.drawRule,rule);assert.equal(r.world,null);f.setNow(11000+round*10000);
 }
 assert.equal(r.round,6);assert.equal(other.config.drawRule,'normal');assert.throws(()=>r.configure({drawRule:'bogus'}),/INVALID_DRAW_RULE/);
});
test('N03/R01: per-life summary uses actual lethal cause and existing simultaneous rank order',t=>{
 const w=fixture(t),a=w.byId.get('p0'),b=w.byId.get('p1'),c=w.byId.get('p2');b.takeDamage(99999,a);c.takeDamage(99999,a);tick(w,1);
 for(const p of [b,c]){const part=getParticipation(w,p.remoteId);assert.equal(part.state,'eliminated');assert.ok(validParticipation(part));assert.equal(part.summary.cause.source,a.remoteId);assert.equal(part.summary.rank,w.game.participants.slice().sort(w.compareSurvivalOrder).indexOf(p)+1);assert.equal(part.summary.lifeSeq,p.lifeSeq);assert.ok(!('x'in part.summary.cause));}
});
for(const mode of ['team-capture','team-respawn'])for(const rule of ['f-only','s-only'])test('N03/S04: respawn remains active subscription '+mode+' '+rule,t=>{
 const ability=manifest.roster.find(a=>a.tier===(rule==='f-only'?'F':'S')).id,w=fixture(t,mode,[ability,ability,ability],rule),p=w.byId.get('p0');p.takeDamage(99999,w.byId.get('p1'));tick(w,1);assert.equal(getParticipation(w,p.remoteId).state,'respawn');assert.ok(validParticipation(getParticipation(w,p.remoteId)));p.tkQuiz.correct=3;p.tkTokens=2;assert.ok(w.brRespawnPlayer(p,true));assert.equal(p.ability.t,rule==='f-only'?'F':'S');assert.equal(getParticipation(w,p.remoteId).state,'active');assert.ok(validParticipation(getParticipation(w,p.remoteId)));
});
test('V01/V02/V05/V06: natural solo results freeze once, protect drain, deadline gates rematch; forced END excluded',t=>{
 const f=roomFixture(t),{r,m}=f;let results=0;m.onResult=()=>results++;f.start();const [a,b]=r.world.game.participants;for(const p of [a,b])p.spawnProtectionUntilFrame=0;b.takeDamage(99999,a);tick(r.world,1);assert.ok(r.world.finished);r.finish({natural:true});assert.equal(r.phase,'RESULTS');assert.ok(validResultPresentation(r.resultPresentation,r.matchId));const frame=r.world.game.frame,rows=JSON.stringify(r.result);tick(r.world,30);r.finish({natural:true});assert.equal(r.world.game.frame,frame);assert.equal(JSON.stringify(r.result),rows);assert.equal(results,1);assert.equal(m.protectedRooms(),1);assert.throws(()=>r.command(r.host,'REMATCH',{}),/RESULT_PRESENTATION_ACTIVE/);f.setNow(r.resultPresentation.showResultsAt);assert.equal(m.protectedRooms(),0);r.command(r.host,'REMATCH',{});assert.equal(r.resultPresentation,null);f.start();r.finish();assert.equal(r.resultPresentation,null);
});
test('N04/N06: late old-life elimination cannot replace results; limited restore and action gating',async()=>{
 const prior=globalThis.sessionStorage;globalThis.sessionStorage={getItem:()=>null};try{const c=new Connection('ws://test');let closed='';c.ws={close:(_,reason)=>closed=reason};c.session={playerId:'a',role:'student'};
 const summary={id:'m:a:0',playerId:'a',lifeSeq:0,name:'A',abilityId:'emoji-114',emoji:'🐷',team:0,level:1,kills:0,deaths:1,rank:2,tick:7,cause:null},p={playerId:'a',lifeSeq:0,state:'eliminated',summary},scope={roomInstanceId:'r',matchId:'m',connectionEpoch:1};const room={matchId:'m',round:1,revision:2,phase:'BATTLE',self:{id:'a',role:'student',participation:p}};
 c.receive({type:'FULL_STATE',...scope,payload:{room,static:null,self:null,snapshot:null,cursor:1}});assert.equal(closed,'');assert.equal(c.combatSuspended,true);assert.equal(c.restoring,false);await assert.rejects(c.command('ACTION',{}),/PLAYER_ELIMINATED/);
 c.receive({type:'ROOM_STATE',...scope,payload:{...room,revision:3,phase:'RESULTS'}});c.receive({type:'PARTICIPATION_STATE',...scope,eventSeq:2,payload:p});assert.equal(c.combatSuspended,false);assert.equal(c.cursor,2);
 }finally{globalThis.sessionStorage=prior;}
});
test('E03/E06: effects stop at authority tick; a long wall-clock pause cannot expire or renew them',()=>{
 assert.equal(effectTick(900,100),100);assert.equal(remainingEffect(160,100).frames,60);assert.equal(remainingEffect(160,160).active,false);
 const t=new Timeline(),a={id:'a',alive:true,lifeSeq:0,x:0,y:0,rw:{sourceTick:100,stunEnd:160}};t.accept({snapshotSeq:1,serverTick:100,actors:[a],shots:[]},1000);t.paused=true;assert.equal(t.frame(100000).effectTick,100);assert.equal(t.frame(100000).actors[0].statusTick,100);t.accept({snapshotSeq:2,serverTick:160,actors:[{...a,rw:{sourceTick:160,stunEnd:0}}],shots:[]},100001);assert.equal(t.frame(100100).effectTick,160);
});
test('X01/H02: XP lid/lettering differs from bolted fixed cover; confirmed heavy contact uses four primitives',()=>{
 const paint=createPainters({}),calls=[],p=new Proxy({},{get:(_,k)=>(...a)=>calls.push([k,...a])});paint.brPaintCrate(p,['box',0,0,100,'xp',48]);assert.ok(calls.some(a=>a.includes('#f3b94e')));const cover=[];paintFixedCover(new Proxy({},{set(o,k,v){cover.push([k,v]);o[k]=v;return true;},get:(_,k)=>(...a)=>cover.push([k,...a])}),80,80);assert.ok(cover.some(a=>a.includes('#40566e')));assert.ok(!cover.some(a=>a.includes('#f3b94e')));calls.length=0;paint.brPaintAttack(p,['','hit',0,0,1,0,24,'#fff',20,0,'rw:front',0,4,{shape:'contact',heavy:'fist',confirmed:true}],1,1);assert.equal(calls.length,4);
});
test('H03: heavy wall feedback follows an actual wall hit once, without adding wall damage',t=>{
 const w=fixture(t),R=w.BRRework,g=w.game,a=w.byId.get('p0'),b=w.byId.get('p1'),events=[];w.emit=(type,data)=>events.push({type,data}); // engine event sink below is the canonical callback
 const old=g.emitStudentFx;g.emitStudentFx=(type,pos,data)=>{events.push({type,pos,data});old.call(g,type,pos,data);};
 const c=R.context(a,g,new w.Vec2(1,0));c.actionKind='skill';g.walls=[new w.Wall(220,0,20,400,0)];const hp=b.hp;R.impulse(c,b,new w.Vec2(1,0),42);tick(w,12);const impacts=events.filter(e=>e.data?.style==='heavy-wall');assert.equal(impacts.length,1);assert.equal(impacts[0].data.geometry.stage,'wall');assert.equal(b.hp,hp);tick(w,20);assert.equal(events.filter(e=>e.data?.style==='heavy-wall').length,1);
});
test('D02/D03/D06: native residual ground +10% once; zero-CC, non-ground and farm untouched',t=>{
 for(const id of ['emoji-031','emoji-128','emoji-114']){
 const w=fixture(t,'team-elim',[id,'emoji-114','emoji-113']),a=w.byId.get('p0'),b=w.byId.get('p1');let farm=0;w.brFarm.area=()=>farm++;const z=new w.Zone(a,b.pos,80,10,16,'#fff','dmg'),old=b.hp;z.update(w.game);const expected=10*z.runSkill.damage*nativeGroundMultiplier(id,'dmg');assert.ok(Math.abs(old-b.hp-expected)<1e-7,[id,old-b.hp,expected].join(':'));assert.equal(farm,1);assert.equal(nativeGroundMultiplier(id,'web'),1);
 }
});

test('E01/E06: mirror expiry uses confirmed progress even when displayFlight has extrapolated',()=>{
 const calls=[],p=new Proxy({},{get:(_,k)=>(...a)=>calls.push([k,...a])}),r={roster10Rings:new Map(),glyph(){}};
 const e={id:'mirror',kind:'mirror',x:0,y:0,dx:1,dy:0,length:100,width:10,start:10,end:100,displayFrame:105};
 drawRoster10Scene(r,p,{shots:[e],renderTick:105,effectTick:99},1);assert.equal(calls.length,2);assert.ok(calls[1].includes('#e0f2fe'));
 calls.length=0;drawRoster10Scene(r,p,{shots:[e],renderTick:105,effectTick:100},1);assert.equal(calls.length,0);
});

test('N02/R03/V05: team elimination keeps team running, records no fabricated personal rank',t=>{
 const w=fixture(t,'team-elim',['emoji-025','emoji-114','emoji-113']),[a,b,c]=w.game.participants;
 b.takeDamage(99999,a);tick(w,1);assert.equal(getParticipation(w,b.remoteId).state,'eliminated');assert.equal(b.deathSummary.rank,null);assert.ok(c.alive);assert.equal(w.finished,undefined);
 const f=roomFixture(t);f.r.configure({mode:'team-elim'});f.start();f.r.world.game.isGameOver=true;f.r.finish({natural:true});assert.equal(f.r.resultPresentation,null);
});

test('V03/V04: recovered deadline never restarts; duplicate/hidden/late winner does not replay fanfare',()=>{
 const originals={document:globalThis.document,sessionStorage:globalThis.sessionStorage},elements=new Map(),stored=new Map();
 class Element{constructor(){this.children=[];}append(...v){this.children.push(...v);for(const e of v)if(e?.id)elements.set(e.id,e);}replaceChildren(...v){this.children=[];this.append(...v);}}
 globalThis.document={hidden:false,getElementById:id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement:()=>new Element()};
 globalThis.sessionStorage={getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)};
 try{let sounded=0,shown='',rendered=0;const ui={net:{},audio:{victory(){sounded++;}},screen(id){shown=id;},results(){rendered++;}},f=new ResultFlow(ui),now=Date.now(),p={id:'m:result',startedAt:now,showResultsAt:now+3500,emoji:'🏆',winnerName:'<img onerror=x>'},room={matchId:'m',phase:'RESULTS',resultPresentation:p,serverTime:now,self:{role:'host'},config:{drawRule:'normal'},result:{resultId:p.id}};ui.room=room;
 f.accept(room);f.accept(room);assert.equal(sounded,1);assert.equal(shown,'br-victory');assert.ok(f.clock.remaining()<=3500);
 const recovery=new ResultFlow(ui);recovery.accept({...room,serverTime:now+2300});assert.ok(recovery.clock.remaining()<=1200);assert.equal(sounded,1);
 recovery.accept({...room,serverTime:now+3500});assert.equal(shown,'br-results');assert.equal(rendered,1);
 document.hidden=true;const hidden={...room,matchId:'h',resultPresentation:{...p,id:'h:result'}};f.accept(hidden);assert.equal(sounded,1);
 document.hidden=false;f.accept({...hidden,serverTime:now+4000});assert.equal(shown,'br-results');assert.equal(sounded,1);
 // The winner string is assigned as text; it is never parsed as markup.
 assert.ok(elements.get('br-victory').children.some(e=>e.textContent==='<img onerror=x>'));
 }finally{globalThis.document=originals.document;globalThis.sessionStorage=originals.sessionStorage;}
});
