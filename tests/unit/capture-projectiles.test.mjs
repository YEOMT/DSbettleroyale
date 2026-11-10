import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,destroyWorld} from '../../packages/engine/src/index.js';

function fixture(mode='team-capture'){
 const w=createWorld(undefined,{mode,teamCount:2},'capture-projectiles',[{id:'a',name:'A',abilityId:'emoji-022',team:1},{id:'b',name:'B',abilityId:'emoji-114',team:2}]);
 w.brFarm.dispose(w.game);const p=w.byId.get('a');for(const [i,q]of w.game.participants.entries()){q.pos=new w.Vec2(-2000+i*100,-2000);q.spawnProtectionUntilFrame=0;}w.game.rebuildSpatialGrid();
 return {w,g:w.game,p,shot(type,x,y,dx,dy,speed=350,opts={}){return new w.Projectile(p,new w.Vec2(x,y),new w.Vec2(dx,dy),speed,5,10,type,'#fff',0,null,{normalizedSkillStats:true,...opts});}};
}

for(const type of ['BOOMERANG','GHOST'])test(`${type} native travel respects all four X terrain sides`,()=>{
 const f=fixture(),{w,g}=f;try{
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const s=f.shot(type,1470*dx,1470*dy,dx,dy);s.update(g);
   assert.ok(w.brArenaContains(g,s.pos,s.size-.01),'contact remains in the playable X');
   assert.ok(Math.hypot(s.pos.x,s.pos.y)<1600);
   if(type==='BOOMERANG'){assert.equal(s.returning,true);assert.ok(s.life>0);assert.equal(s._brTurn,1,'reuse existing boundary return instead of a new bounce');}
   else assert.equal(s.life,0);
  }
 }finally{destroyWorld(w);}
});

for(const type of ['BOOMERANG','GHOST'])test(`${type} retains ordinary cover pass-through inside capture and solo`,()=>{
 for(const mode of ['team-capture','solo']){
  const f=fixture(mode),{w,g}=f;try{
   g.walls=[...(g.boundary?.blocks||[]),new w.Wall(600,0,40,300,0)];const s=f.shot(type,400,0,1,0,400);s.update(g);
   assert.equal(s.pos.x,800);assert.equal(s.pos.y,0);assert.equal(s.returning,false);assert.ok(s.life>0);
  }finally{destroyWorld(w);}
 }
});

test('native ORBIT remains an owner-centered contact weapon at X terrain',()=>{
 const f=fixture(),{w,g,p}=f;try{
  p.pos=new w.Vec2(1470,0);const s=f.shot('ORBIT',1470,0,1,0,0,{orbitDist:200,orbitAngle:0,orbitSpeed:.01,orbitLife:120});const life=s.life;s.update(g);
  assert.equal(s.life,life-1);assert.equal(s.returning,false);assert.ok(Math.abs(s.pos.x-(p.pos.x+Math.cos(.01)*200))<1e-9);assert.ok(Math.abs(s.pos.y-Math.sin(.01)*200)<1e-9);
 }finally{destroyWorld(w);}
});
