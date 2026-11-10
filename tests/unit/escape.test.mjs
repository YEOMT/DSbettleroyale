import test from 'node:test';import assert from 'node:assert/strict';
import {createWorld,getStaticState,destroyWorld} from '../../packages/engine/src/index.js';
import {updateEscape} from '../../packages/engine/src/world/escape.js';
const make=(mapIndex=0,mode='solo')=>createWorld(undefined,{mapIndex,mode},'escape',Array.from({length:20},(_,i)=>({id:'p'+i,name:'P'+i,abilityId:'emoji-003',team:i%2+1})));
test('six safe nonoverlapping solo landmarks across all five maps and random; no team escape mechanics',()=>{
 for(const m of [-1,0,1,2,3,4]){const w=make(m),g=w.game,map=g.escapeMap,points=[map.portal.a,map.portal.b,...map.pads];assert.equal(points.length,6);for(const p of points){assert.ok(Math.hypot(p.x,p.y)>=g.worldRadius*.34&&Math.hypot(p.x,p.y)<=g.worldRadius*.66);assert.ok(!g.checkWallCollision(new w.Vec2(p.x,p.y),150));assert.ok(!g.farmBoxes.some(b=>Math.hypot(p.x-b.pos.x,p.y-b.pos.y)<150+b.radius));}destroyWorld(w);assert.equal(g.escape,null);}
 const capture=make(0,'team-capture');assert.equal(capture.game.escape,undefined);destroyWorld(capture);
});
test('atomic A to B only; open stays open after20s; ring/locked safeguards and spatial grid refresh',()=>{
 const w=make(),g=w.game,[p,q]=g.participants,[a,b]=[g.escapeMap.portal.a,g.escapeMap.portal.b],events=[];
 const rebuild=g.rebuildSpatialGrid.bind(g);let rebuilds=0;g.rebuildSpatialGrid=()=>{rebuilds++;return rebuild();};
 const put=(p,v)=>{p.pos=new w.Vec2(v.x,v.y);p.vel=new w.Vec2(0,0);p.spawnProtectionUntilFrame=0;};
 put(p,a);put(q,a);const hp=p.hp,cd=p.cooldown;updateEscape(w,e=>events.push(e));assert.equal(p.pos.x,b.x);assert.equal(q.pos.x,a.x);assert.equal(p.hp,hp);assert.equal(p.cooldown,cd);assert.equal(p.warpSeq,1);assert.equal(g.escape.nextReadyAt,1200);
 assert.equal(rebuilds,1,'only the successful warp rebuilds the collision grid');
 g.frame=1200;put(q,{x:0,y:0});updateEscape(w,e=>events.push(e));assert.equal(g.escape.nextReadyAt,0);assert.equal(p.pos.x,b.x);g.frame=1500;updateEscape(w,()=>{});assert.equal(g.escape.nextReadyAt,0);
 put(q,a);q.stunned=10;updateEscape(w,()=>{});assert.equal(q.pos.x,a.x);q.stunned=0;g.ringGeometry={cx:0,cy:0,radius:10};updateEscape(w,()=>{});assert.equal(g.escape.blocked,true);assert.equal(q.pos.x,a.x);
 assert.equal(rebuilds,1,'locked and unsafe exits do not rebuild the grid');
 g.ringGeometry={cx:0,cy:0,radius:g.worldRadius};updateEscape(w,()=>{});assert.equal(q.pos.x,b.x);assert.equal(getStaticState(w).escapeState.nextReadyAt,2700);assert.equal(events.length,2);assert.equal(rebuilds,2);destroyWorld(w);
});
test('native zones and rework hazards block the exit without consuming the portal clock',()=>{
 const w=make(),g=w.game,p=g.participants[0],{a,b}=g.escapeMap.portal;
 try{
  w.BRRework.world(g);
  p.spawnProtectionUntilFrame=0;p.pos=new w.Vec2(a.x,a.y);p.vel=new w.Vec2(0,0);
  const unchanged=()=>{assert.equal(g.escape.blocked,true);assert.equal(g.escape.nextReadyAt,0);assert.equal(p.pos.x,a.x);assert.equal(p.pos.y,a.y);assert.equal(p.warpSeq||0,0);};
  const zone={pos:new w.Vec2(b.x,b.y),radius:80};g.zones.push(zone);updateEscape(w,()=>{});unchanged();g.zones.splice(g.zones.indexOf(zone),1);
  for(const kind of ['zone','poison','fire','radiation','gravity']){
   const hazard={kind,pos:new w.Vec2(b.x,b.y),radius:80};g.rw.entities.push(hazard);updateEscape(w,()=>{});unchanged();g.rw.entities.splice(g.rw.entities.indexOf(hazard),1);
  }
  const expired={kind:'poison',pos:new w.Vec2(b.x,b.y),radius:80,dead:true};g.rw.entities.push(expired);
  updateEscape(w,()=>{});assert.equal(g.escape.blocked,false);assert.equal(p.pos.x,b.x);assert.equal(p.pos.y,b.y);assert.equal(g.escape.nextReadyAt,1200);assert.equal(p.warpSeq,1);
 }finally{destroyWorld(w);}
});
test('dead, clone, unbound and spawn-protected participants cannot activate portal or pads',()=>{
 const w=make(),g=w.game,p=g.participants[0],a=g.escapeMap.portal.a,pad=g.escapeMap.pads[0],remoteId=p.remoteId;
 try{
  for(const state of [{alive:false},{isClone:true},{remoteId:null},{spawnProtectionUntilFrame:10}]){
   Object.assign(p,{alive:true,isClone:false,remoteId,spawnProtectionUntilFrame:0,escapePadMask:0,escapeBoostUntil:0},state);
   for(const location of [a,pad]){
    p.pos=new w.Vec2(location.x,location.y);p.vel=new w.Vec2(0,0);updateEscape(w,()=>{});
    assert.equal(p.pos.x,location.x);assert.equal(p.pos.y,location.y);assert.equal(p.warpSeq||0,0);assert.equal(g.escape.nextReadyAt,0);assert.deepEqual(g.escape.pads,[0,0,0,0]);assert.equal(p.escapeBoostUntil,0);
   }
  }
  Object.assign(p,{alive:true,isClone:false,remoteId,spawnProtectionUntilFrame:0,escapePadMask:0});p.pos=new w.Vec2(a.x,a.y);updateEscape(w,()=>{});assert.equal(p.warpSeq,1,'normal live input is still admitted after the exclusion ends');
 }finally{destroyWorld(w);}
});
test('pad independent15s clocks,3s30% boost and entry edge, no stacking/life leaks',()=>{
 const w=make(),g=w.game,p=g.participants[0],pad=g.escapeMap.pads[0];p.spawnProtectionUntilFrame=0;const speed=w.brHumanMoveSpeed(p);p.pos=new w.Vec2(pad.x,pad.y);updateEscape(w,()=>{});assert.equal(p.escapeBoostUntil,180);assert.equal(g.escape.pads[0],900);assert.deepEqual(g.escape.pads.slice(1),[0,0,0]);assert.ok(Math.abs(w.brHumanMoveSpeed(p)-speed*1.3)<1e-8);
 g.frame=180;assert.equal(w.brHumanMoveSpeed(p),speed);g.frame=900;updateEscape(w,()=>{});assert.equal(p.escapeBoostUntil,180);assert.equal(g.escape.pads[0],0);p.pos.x+=150;updateEscape(w,()=>{});p.pos.x-=150;updateEscape(w,()=>{});assert.equal(p.escapeBoostUntil,1080);p.alive=false;updateEscape(w,()=>{});assert.equal(p.escapeBoostUntil,0);destroyWorld(w);
});
