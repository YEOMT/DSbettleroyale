import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,createRuleContext,stepWorld,destroyWorld,getStaticState,getPrivateSelfState,applyCommand as routeApply} from '../../packages/engine/src/index.js';
import {createMovementKernel,predictMovement} from '../../packages/engine/src/movement/prediction.js';
import {captureNotice} from '../../apps/client/src/ui/capture-notice.js';
import {aimGuide} from '../../apps/client/src/render/aim-guide.js';
const students=n=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Player'+i,abilityId:'emoji-114',team:i+1}));
for(const n of [2,3,4])test(`X map ${n} teams: slots, safe spawns, real solid sides and symmetric nearest approaches`,()=>{
 const w=createWorld(undefined,{mode:'team-capture',teamCount:n},'x-'+n,students(n));try{
 const g=w.game,c=g.capture,map=c.map;assert.equal(c.points.length,2);assert.equal(c.activeMask,3);assert.deepEqual(c.points.map(z=>[z.id,z.radius,z.enabled]),[['A',400,true],['B',400,true]]);
 const corners=map.bases.map(b=>[Math.sign(b.x),Math.sign(b.y)]);assert.deepEqual(corners,n===2?[[-1,-1],[1,1]]:n===3?[[-1,-1],[1,-1],[-1,1]]:[[-1,-1],[1,-1],[-1,1],[1,1]]);
 assert.equal(map.walls.filter(x=>x.terrain).length,4);assert.equal(map.walls.length,8);assert.ok(Math.hypot(map.points[0].x-map.points[1].x,map.points[0].y-map.points[1].y)>800);
 const nearest=map.bases.map(b=>Math.min(...map.points.map(z=>Math.hypot(b.x-z.x,b.y-z.y))));assert.ok(Math.max(...nearest)-Math.min(...nearest)<1e-7);
 for(const p of g.participants){assert.ok(w.brArenaContains(g,p.pos,p.radius));assert.ok(!g.checkWallCollision(p.pos,p.radius));assert.equal(p.modeHpMultiplier,.85);}
 for(const [x,y]of [[2800,0],[-2800,0],[0,2800],[0,-2800]]){assert.equal(w.brArenaContains(g,{x,y},30),false);assert.ok(g.checkWallCollision(new w.Vec2(x,y),30));const q=w.brArenaClamp(g,{x,y},30);assert.ok(w.brArenaContains(g,q,30));assert.ok(!g.checkWallCollision(q,29.99));}
 for(const [x,y]of [[0,0],[-2250,-2250],[2250,-2250],[-2250,2250],[2250,2250]])assert.ok(w.brArenaContains(g,{x,y},60));
 const ray=w.brArenaRay(g,new w.Vec2(0,0),new w.Vec2(1,0),3000,50);assert.ok(ray<1600&&ray>1500);assert.ok(w.brArenaContains(g,{x:ray,y:0},50));
 // Box-generation candidates and clamp remain bounded; no retry loop.
 for(let i=0;i<100;i++)assert.ok(w.brArenaContains(g,w.brCaptureRandomPoint(g,80),80));
 const arena=getStaticState(w),kernel=createMovementKernel(),state={x:1450,y:0,vx:0,vy:0,moveSpeed:900,radius:50,alive:true,phaseWalls:true,rw:{}};
 const predicted=predictMovement(kernel,state,{move:{x:1,y:0}},arena.walls,arena);assert.ok(w.brArenaContains(g,predicted,54));assert.ok(predicted.x<1600);
 for(const p of g.participants){p.pos=new w.Vec2(map.points[0].x,map.points[0].y);p.spawnProtectionUntilFrame=0;}w.BRCapture.tally(c,g.participants,g);assert.equal(c.points[0].state,'contested');assert.equal(c.points[0].rate,0);
 }finally{destroyWorld(w);}
});
test('capture unique lead scores with enemy present; fever keeps two equal points and totals',()=>{
 const w=createWorld(undefined,{mode:'team-capture',teamCount:2},'points',[...students(2),{id:'p2',name:'C',abilityId:'emoji-114',team:1}]);try{const c=w.game.capture;
 for(const p of w.game.participants){p.spawnProtectionUntilFrame=0;p.pos=new w.Vec2(c.points[0].x,0);}w.BRCapture.tally(c,w.game.participants,w.game);assert.deepEqual(c.points[0].counts,[0,2,1]);assert.equal(c.points[0].team,1);assert.equal(c.points[0].rate,.24);
 w.BRCapture.integrate(c,1,w.game.participants,w.game);assert.ok(Math.abs(c.scores[1]-.24)<1e-9);assert.ok(Math.abs([...c.records.values()].reduce((n,r)=>n+r.points,0)-.24)<1e-9);
 c.active=299.99;w.BRCapture.integrate(c,.02,w.game.participants,w.game);assert.equal(c.phase,'FEVER');assert.equal(c.activeMask,3);assert.equal(c.points[0].rate,.48);assert.equal(w.brCapturePointRate([0,2,1],1,true),.48);
 }finally{destroyWorld(w);}
});
test('capture notices require stable lead, bound cadence, fever and match reset',()=>{
 const s={},packet=(a,z,more={})=>({k:'one',q:a*10+1,a,run:true,ph:'ALL_OBJECTIVES',s:[10,5],z,...more}),z=[['scoring',1,[2,1]],['neutral',0,[0,0]]];
 assert.equal(captureNotice(s,packet(0,z)),'');assert.equal(captureNotice(s,packet(1.9,z)),'');assert.match(captureNotice(s,packet(2,z)),/^A · BLUE/);
 assert.equal(captureNotice(s,packet(6,z)),'');const both=[z[0],z[0]];captureNotice(s,packet(7,both));assert.match(captureNotice(s,packet(9,both)),/동시 우세/);
 captureNotice(s,packet(10,both,{ph:'FEVER'}));assert.match(captureNotice(s,packet(15,both,{ph:'FEVER'})),/피버/);
 assert.equal(captureNotice(s,packet(0,z,{k:'two'})),'');assert.equal(s.points.length,2);assert.ok(Object.keys(s.cooldowns).length===0);
});

test('capture airborne leap clips solid X terrain and outer edge, with matching guide and landing marker; cover remains jumpable',()=>{
 for(const fixture of [
  {name:'X wedge',x:1700,y:-300,dx:0,dy:1,clip:true},
  {name:'outer edge',x:2800,y:2800,dx:1,dy:0,clip:true},
  {name:'ordinary cover',x:1050,y:600,dx:0,dy:1,clip:false}
 ]){
  const w=createWorld(undefined,{mode:'team-capture',teamCount:2},'leap-'+fixture.name,[{...students(2)[0],abilityId:'emoji-029'},students(2)[1]]);
  try{
   const g=w.game,p=g.participants[0];w.brFarm.dispose(g);p.pos=new w.Vec2(fixture.x,fixture.y);p.vel=new w.Vec2(0,0);p.spawnProtectionUntilFrame=0;p.cooldown=0;g.rebuildSpatialGrid();
   assert.ok(w.brArenaContains(g,p.pos,p.radius+4),fixture.name+' starts in arena');
   const aim={x:fixture.dx,y:fixture.dy},map=getStaticState(w),actor=getPrivateSelfState(w,p.remoteId),guide=aimGuide(actor,'skill',{aim,power:1},map,createMovementKernel(),map.walls);
   assert.equal(w.BRRework.cast(p,g,new w.Vec2(aim.x,aim.y),1),true);
   const leap=p.rw.dash,marker=g.rw.entities.find(e=>e.kind==='warning'&&e.ctx.abilityId==='emoji-029');
   assert.ok(leap&&marker);assert.ok(Math.hypot(guide.x-leap.to.x,guide.y-leap.to.y)<.01,fixture.name+' guide matches authoritative landing');assert.deepEqual([marker.pos.x,marker.pos.y],[leap.to.x,leap.to.y]);
   const distance=p.pos.dist(leap.to);if(fixture.clip)assert.ok(distance<670);else assert.ok(Math.abs(distance-670)<.01);
   let crossedCover=false;
   for(let i=0;i<31;i++){stepWorld(w);assert.ok(w.brArenaContains(g,p.pos,p.radius),fixture.name+' remains inside terrain on tick '+i);if(g.checkWallCollision(p.pos,p.radius))crossedCover=true;}
   assert.ok(p.pos.dist(leap.to)<.01);assert.equal(crossedCover,!fixture.clip,fixture.name+' only ordinary cover is jumpable');
  }finally{destroyWorld(w);}
 }
});


test('3-team fixed slots have matching safe route lengths, cover and real first-entry ticks',()=>{
 const results=[];
 for(let team=1;team<=3;team++){
  const w=createWorld(undefined,{mode:'team-capture',teamCount:3},'route',students(3));try{
   w.brFarm.dispose(w.game);const g=w.game,p=g.participants[team-1],start=g.capture.map.bases[team-1],goal=g.capture.map.points[team===2?1:0],radius=p.radius+8;
   p.pos=new w.Vec2(start.x,start.y);p.vel=new w.Vec2(0,0);p.spawnProtectionUntilFrame=0;
   const key=(x,y)=>x+','+y,open=[{x:start.x,y:start.y,d:0,parent:null}],cost=new Map([[key(start.x,start.y),0]]);let found;
   for(let tries=0;open.length&&tries<10000;tries++){
    open.sort((a,b)=>(a.d+Math.max(0,Math.hypot(a.x-goal.x,a.y-goal.y)-goal.radius))-(b.d+Math.max(0,Math.hypot(b.x-goal.x,b.y-goal.y)-goal.radius)));const here=open.shift();if(here.d!==cost.get(key(here.x,here.y)))continue;if(Math.hypot(here.x-goal.x,here.y-goal.y)<goal.radius-20){found=here;break;}
    for(const dx of [-50,0,50])for(const dy of [-50,0,50]){if(!dx&&!dy)continue;const to={x:here.x+dx,y:here.y+dy},d=here.d+Math.hypot(dx,dy),k=key(to.x,to.y);if(d>=(cost.get(k)??Infinity)||!w.brArenaContains(g,to,radius)||w.combatTraceWalls(here,to,radius,g.walls))continue;cost.set(k,d);open.push({...to,d,parent:here});}
   }
   assert.ok(found,'bounded safe route exists');const route=[];for(let q=found;q;q=q.parent)route.unshift(q);let at=1,ticks=0;
   while(p.pos.dist(new w.Vec2(goal.x,goal.y))>goal.radius&&ticks<1200){while(at<route.length-1&&p.pos.dist(route[at])<25)at++;const dest=route[at],dx=dest.x-p.pos.x,dy=dest.y-p.pos.y,n=Math.hypot(dx,dy)||1;const seq=++ticks;w._routeInput={type:'INPUT',playerId:p.remoteId,lifeSeq:p.lifeSeq,seq,clientTick:seq,move:{x:dx/n,y:dy/n},aim:{x:1,y:0}};
    // Public engine entry is used, retaining 60Hz response and wall collision.
    routeApply(w,w._routeInput);stepWorld(w);
   }
   assert.ok(ticks<1200,'normal movement enters point');results.push({team,route:found.d,ticks,cover:g.capture.map.walls.filter(q=>!q.terrain&&Math.hypot(q.x-start.x,q.y-start.y)<2200).length});
  }finally{destroyWorld(w);}
 }
 assert.ok(Math.max(...results.map(r=>r.route))-Math.min(...results.map(r=>r.route))<1e-7);assert.ok(Math.max(...results.map(r=>r.ticks))-Math.min(...results.map(r=>r.ticks))<=2);assert.equal(new Set(results.map(r=>r.cover)).size,1);console.log('capture3 route',JSON.stringify(results));
});
