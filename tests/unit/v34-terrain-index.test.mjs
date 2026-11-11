import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,destroyWorld} from '../../packages/engine/src/index.js';

test('X terrain occupies four index entries and preserves every tested swept contact',()=>{
 const actors=Array.from({length:20},(_,i)=>({id:'p'+i,name:'Test',abilityId:'emoji-034',team:i%2+1}));
 const world=createWorld(undefined,{mode:'team-capture',teamCount:2},'upgrade-fixed-1',actors);
 try {
  const walls=world.brHostBodyWalls(world.game),index=world.combatWallGrid(walls);
  const candidates=world.combatWallCandidates;
  for(let angle=0;angle<64;angle++){
   const a=2*Math.PI*angle/64,from={x:300*Math.cos(a),y:300*Math.sin(a)};
   const to={x:4400*Math.cos(a),y:4400*Math.sin(a)};
   for(const radius of [1,36,85]){
    const indexed=world.combatTraceWalls(from,to,radius,walls);
    world.combatWallCandidates=()=>walls;
    let exhaustive;
    try {exhaustive=world.combatTraceWalls(from,to,radius,walls);}
    finally {world.combatWallCandidates=candidates;}
    assert.equal(indexed?.wall,exhaustive?.wall);
    assert.equal(indexed?.t,exhaustive?.t);
   }
  }
  assert.equal(index.largeTerrain?.length,4,'one broadphase record per X side');
  assert.ok(index.grid.size<200,'small covers and crates alone occupy cell buckets');
 } finally {destroyWorld(world);}
});
