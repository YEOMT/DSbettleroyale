import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,createRuleContext,stepWorld,getTeacherState,applyCommand,destroyWorld} from '../../packages/engine/src/index.js';
const players=[{id:'a',name:'A',abilityId:'emoji-114',team:1},{id:'b',name:'B',abilityId:'emoji-113',team:2}];
test('level 6, XP 20, five actual offers, III cap and mutually exclusive growth',()=>{
 const w=createWorld(undefined,{},'growth',players),p=w.byId.get('a');w.brProgression.awardXP(p,20,0);
 assert.equal(p.run.level,6);assert.equal(p.run.pending,5);
 for(let i=0;i<5;i++){const offer=p.run.offer;assert.ok(offer?.cards.length);assert.ok(w.brChooseRun(p,offer.id,offer.cards[0].id));}
 assert.equal(p.run.choices,5);assert.equal(p.run.pending,0);assert.equal(p.run.offer,null);assert.ok(Object.values(p.run.paths).every(v=>v<=3));
 const r=createRuleContext();assert.equal(r.brWangguiAllowed(r.EMOJI_DB.find(a=>a.t==='S')),false);
 destroyWorld(w);
});
for(const mode of ['solo','team-elim','team-capture','team-respawn'])test(`headless mode ${mode} creates and advances`,()=>{
 const w=createWorld(undefined,{mode,teamCount:2},'mode',players);for(let i=0;i<61;i++)stepWorld(w);
 assert.equal(w.game.frame,61);assert.equal(getTeacherState(w).actors.length,2);
 assert.equal(w.byId.get('a').modeHpMultiplier,mode==='team-capture'?.7:mode==='team-respawn'?.5:1);
 destroyWorld(w);
});
test('capture uses population difference, middle multiplier, fever, 120-second activation',()=>{
 const w=createRuleContext({mode:'team-capture'}),c=w.BRCapture.create(4,300,'test');
 assert.equal(c.activeMask,5);assert.equal(w.brCapturePointRate([0,4,3,0,0],0,false),w.brCapturePointRate([0,1,0,0,0],0,false));
 assert.equal(w.brCapturePointRate([0,1,0],1,true),w.brCapturePointRate([0,1,0],0,false)*3);
 w.BRCapture.integrate(c,120);assert.equal(c.activeMask,7);w.BRCapture.integrate(c,120);assert.equal(c.phase,'FEVER');
 w.BRCapture.integrate(c,60);assert.equal(c.finalized,true);assert.deepEqual(c.winners,[1,2,3,4]);
});
test('stale input becomes neutral and cannot accelerate ticks',()=>{
 const w=createWorld(undefined,{},'input',players),p=w.byId.get('a');
 for(let seq=1;seq<=100;seq++)applyCommand(w,{type:'INPUT',playerId:'a',lifeSeq:0,seq,clientTick:seq,move:{x:1,y:0},aim:{x:1,y:0}});
 stepWorld(w);assert.equal(w.game.frame,1);assert.equal(p.lastAppliedSeq,100);assert.equal(p.replacedInputSeq,99);
 for(let i=0;i<20;i++)stepWorld(w);assert.equal(p.inputNeutral,true);destroyWorld(w);
});
