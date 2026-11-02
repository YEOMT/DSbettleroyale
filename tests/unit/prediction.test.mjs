import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,stepWorld,applyCommand,getPrivateSelfState,getStaticState,destroyWorld} from '../../packages/engine/src/index.js';
import {createMovementKernel,predictMovement} from '../../packages/engine/src/movement/prediction.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
const players=[{id:'a',name:'A',abilityId:'emoji-114'},{id:'b',name:'B',abilityId:'emoji-113'}];
test('ordinary movement, stop and wall use the original movement kernel, no idle drift over ten seconds',()=>{
 const w=createWorld(undefined,{},'prediction',players),p=w.byId.get('a'),q=w.byId.get('b'),kernel=createMovementKernel();
 w.game.finalPhaseTriggered=true;w.game.walls=[new w.Wall(200,0,20,800,0)];w.game.walls[0].spinSpeed=0;w.game.farmBoxes=[];w.game.xpBundles=[];w.game.smokes=[];p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(-1800,0);w.game.rebuildSpatialGrid();
 let pred=getPrivateSelfState(w,'a');const arena=getStaticState(w),walls=arena.walls.map(v=>({...v,pos:{x:v.x,y:v.y}}));
 for(let tick=1;tick<=840;tick++){const move=tick<90?{x:1,y:0}:tick<150?{x:-1,y:0}:tick<240?{x:0,y:1}:{x:0,y:0},c={seq:tick,clientTick:tick,move,aim:{x:1,y:0}};pred=predictMovement(kernel,pred,c,walls,arena);applyCommand(w,{...c,type:'INPUT',playerId:'a',lifeSeq:0});stepWorld(w);assert.ok(Math.hypot(pred.x-p.pos.x,pred.y-p.pos.y)<1e-8,'movement parity tick '+tick+' pred '+JSON.stringify([pred.x,pred.y,pred.vx,pred.vy])+' authority '+JSON.stringify([p.pos.x,p.pos.y,p.vel.x,p.vel.y,w.brHumanMoveSpeed(p),p.finalPhaseBoosted]));}
 const before={x:p.pos.x,y:p.pos.y};for(let i=0;i<600;i++)stepWorld(w);assert.ok(Math.hypot(before.x-p.pos.x,before.y-p.pos.y)<1e-8);destroyWorld(w);
});
test('timeline rejects duplicates, does not smooth across teleport/life, and retains short-shot terminals',()=>{
 const t=new Timeline();t.setStatic({worldRadius:5000,walls:[]});const self={id:'a',x:0,y:0,vx:0,vy:0,alive:true,moveSpeed:4,radius:30,lifeSeq:0,warpSeq:0,lastAppliedSeq:0,lastAppliedClientTick:0};
 const s={snapshotSeq:1,serverTick:3,actors:[self],self,shots:[]};assert.equal(t.accept(s,100),true);assert.equal(t.accept(s,120),false);t.predict({seq:1,clientTick:1,move:{x:1,y:0}});
 t.accept({...s,snapshotSeq:2,serverTick:6,self:{...self,x:1000,warpSeq:1}},150);assert.deepEqual(t.offset,{x:0,y:0});assert.equal(t.history.length,0);assert.equal(t.predicted.x,1000);
 t.event({type:'SHOT_SPAWN',serverTick:6,data:{id:'short',x:20,y:0,native:true}});t.event({type:'SHOT_END',serverTick:7,data:{id:'short',x:40,y:0,reason:'hit'}});
 t.accept({...s,snapshotSeq:3,serverTick:12,self:{...self,x:1000,warpSeq:1}},200);const view=t.frame(200);assert.ok(view.effects.some(s=>s.terminal==='short'&&s.kind==='transit'));assert.ok(!view.shots.some(s=>s.id==='short'));assert.equal(t.terminals.get('short').reason,'hit');
 const old=t.renderTick;t.frame(199);assert.ok(t.renderTick>=old);
});



