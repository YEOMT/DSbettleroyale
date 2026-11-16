import test from 'node:test';import assert from 'node:assert/strict';
import {movementDirection} from '../../tools/deploy/lifecycle-direction.mjs';
import {createWorld,stepWorld,applyCommand,getPrivateSelfState,getStaticState,destroyWorld} from '../../packages/engine/src/index.js';
test('a legal wall can stop the old inward smoke input below12; a public open direction moves with the same authority',()=>{
 const measure=corrected=>{const w=createWorld(undefined,{},'lifecycle-wall',[{id:'a',abilityId:'emoji-114'},{id:'b',abilityId:'emoji-113'}]),p=w.byId.get('a');try{
  w.game.finalPhaseTriggered=true;w.brFarm.dispose(w.game);w.game.smokes=[];w.byId.get('b').pos=new w.Vec2(-2000,0);
  p.pos=new w.Vec2(1842.397,-1823.974);p.vel=new w.Vec2(0,0);w.game.walls=[new w.Wall(p.pos.x-p.radius-11,-1824,2,200,0)];w.game.rebuildSpatialGrid();
  const before=getPrivateSelfState(w,'a'),choice=movementDirection(before,{static:getStaticState(w)}),key=corrected?choice.key:'a';
  for(let n=1;n<=30;n++){applyCommand(w,{type:'INPUT',playerId:'a',lifeSeq:0,seq:n,clientTick:n,move:{x:key==='a'?-1:key==='d'?1:0,y:key==='w'?-1:key==='s'?1:0},aim:{x:1,y:0}});stepWorld(w);}
  return {distance:Math.hypot(p.pos.x-before.x,p.pos.y-before.y),choice};
 }finally{destroyWorld(w);}};
 const old=measure(false),fixed=measure(true);assert.ok(old.distance>0&&old.distance<=12,JSON.stringify(old));assert.equal(fixed.choice.preferred,'a');assert.equal(fixed.choice.key,'s');assert.ok(fixed.distance>12,JSON.stringify(fixed));
});
test('direction planning neither certifies movement nor ignores rotated walls, public boxes or live actors',()=>{
 const s={id:'a',x:100,y:0,radius:30},wall={x:55,y:0,w:2,h:300,angle:.1};
 assert.notEqual(movementDirection(s,{static:{walls:[wall]}}).key,'a');
 assert.notEqual(movementDirection(s,{farm:{b:[['b',55,0,100,0,15]]}}).key,'a');
 assert.notEqual(movementDirection(s,{actors:[{id:'b',x:40,y:0,radius:20,alive:true}]}).key,'a');
 assert.equal(movementDirection(s,{static:{walls:[{x:100,y:0,w:100,h:100}]}}).openPath,false);
 assert.equal(movementDirection(s,{}).key,'a');
});
