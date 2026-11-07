import test from 'node:test';
import assert from 'node:assert/strict';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
test('revisioned wall cache retains old destroyed-crate exclusion and invalidates on new farm snapshot',()=>{
 const t=new Timeline();t.setStatic({walls:[{x:0,y:100,w:20,h:100}]});
 const state={farm:{b:[['alive',100,0,3,3,48],['destroyed',200,0,0,3,48]]}};
 const walls=t.collisionWalls(state);assert.equal(walls.length,2);assert.equal(walls[1].x,100);assert.equal(t.collisionWalls(state),walls);
 const next={farm:{b:state.farm.b.map(b=>[...b.slice(0,3),0,...b.slice(4)])}};assert.equal(t.collisionWalls(next).length,1);assert.notEqual(t.collisionWalls(next),walls);
});
