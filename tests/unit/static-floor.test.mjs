import test from 'node:test';
import assert from 'node:assert/strict';
import {StaticFloor} from '../../apps/client/src/render/static-floor.js';
function fixture(){
 const graphics=()=>({calls:[],clear(){this.calls=[];return this;}});
 const r={pixi:true,base:graphics(),grid:graphics(),mapOutline:graphics(),paint:{brCombatPainter:g=>Object.fromEntries(['rect','circle','line'].map(kind=>[kind,(...args)=>g.calls.push({kind,args})]))}};
 return {r,cache:new StaticFloor(),map:{worldRadius:2400},cam:{x:17,y:31}};
}
test('hundreds of static or subpixel frames retain floor/grid/outline geometry',()=>{
 const {r,cache,map,cam}=fixture();
 for(let frame=0;frame<600;frame++){cache.floor(r,map,false);cache.grid(r,{x:cam.x+frame/10000,y:cam.y},1024,768,.6,160);}
 assert.deepEqual(cache.stats,{floorBuilds:1,gridBuilds:1,outlineBuilds:0});
 assert.equal(r.base.calls[0].kind,'circle');assert.deepEqual(r.base.calls[0].args,[0,0,2400,'#17233a',1]);
 for(const {args} of r.grid.calls){assert.equal(args[4],'#6b8bb8');assert.equal(args[5],.15);assert.equal(args[6],1);}
});
test('coverage expands at cell/zoom/viewport changes; LOD spacing and floor policy invalidate independently',()=>{
 const {r,cache,map,cam}=fixture();cache.floor(r,map,false);cache.grid(r,cam,1024,768,.6,160);
 const first=r.grid.calls;cache.grid(r,{x:cam.x+320,y:cam.y},1024,768,.6,160);assert.notStrictEqual(r.grid.calls,first);
 cache.grid(r,cam,1536,1024,.3,400);const lines=r.grid.calls,vertical=lines.filter(q=>q.args[0]===q.args[2]);
 assert.ok(vertical[0].args[0]<=cam.x-1536/.3/2);assert.ok(vertical.at(-1).args[0]>=cam.x+1536/.3/2-400);
 assert.ok(vertical.every(q=>q.args[0]%400===0));assert.equal(cache.stats.floorBuilds,1);
 cache.floor(r,map,true);assert.equal(cache.stats.floorBuilds,2);assert.equal(r.base.calls[0].args[3],'#1e293b');
 map.worldRadius=3000;cache.floor(r,map,true);assert.equal(r.base.calls[0].args[2],3000);
});
test('capture boundary, hidden Canvas-style grid and rematch invalidation keep only current geometry',()=>{
 const {r,cache,map,cam}=fixture();map.boundary={minX:-3000,minY:-1600,maxX:3000,maxY:1600};
 for(let i=0;i<300;i++){cache.floor(r,map,true);cache.grid(r,cam,1024,768,.4,240);cache.outline(r,map,true);}
 assert.deepEqual(cache.stats,{floorBuilds:1,gridBuilds:1,outlineBuilds:1});assert.equal(r.mapOutline.calls[0].args.at(-1),12);
 cache.grid(r,cam,1024,768,.4,240,false);assert.equal(r.grid.visible,false);cache.outline(r,map,false);assert.equal(r.mapOutline.visible,false);
 cache.reset();assert.equal(cache.floorPath,null);assert.equal(cache.verticalPath,null);assert.equal(cache.outlinePath,null);
 cache.floor(r,map,true);cache.grid(r,cam,1024,768,.4,240);cache.outline(r,map,true);
 assert.deepEqual(cache.stats,{floorBuilds:2,gridBuilds:2,outlineBuilds:2});assert.equal(r.grid.visible,true);assert.equal(r.mapOutline.visible,true);
});
