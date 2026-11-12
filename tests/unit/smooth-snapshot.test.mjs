import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {createWorld,destroyWorld} from '../../packages/engine/src/index.js';

test('visible row cache preserves order, scopes and partial, empty and new selections',()=>{
 const actors=[{id:'a',name:'🕴'},{id:'b',name:'숨김'},{id:'c',name:'テスト'}];
 const shots=[{id:7,kind:'mirror'},{id:9,kind:'mushroom'}];
 const teacher={actors,shots,farm:{b:[]}},encode=snapshotEncoder(teacher,13,21);
 for(const [subset,projectiles] of [[actors,shots],[[actors[2],actors[0]],[shots[0]]],[[],[]],[[actors[1],actors[0],actors[2]],[{id:'new',x:15}]]]){
  const view={...teacher,actors:subset,shots:projectiles};
  const m=JSON.parse(encode(view,{connectionEpoch:3}));
  assert.deepEqual(m.payload,{...view,snapshotSeq:13,serverNow:21});assert.equal(m.connectionEpoch,3);
 }
});

test('growth chip projection reuses stable descriptions and preserves independently mutable snapshots',t=>{
 const w=createWorld(undefined,{mode:'solo'},'chips',[{id:'a',name:'Synthetic',abilityId:'emoji-152'}]);
 t.after(()=>destroyWorld(w));
 const p=w.byId.get('a'),build=w.brRunCard;let count=0;
 w.brRunCard=(...args)=>{count++;return build(...args);};
 p.run.paths={control:1,swift:1};w.brRecomputeRun(p);
 const a=w.brRunSnapshot(p);assert.equal(count,2);a.chips[0].detail='modified';
 p.run.xp++;p.hp-=10;const b=w.brRunSnapshot(p);assert.equal(count,2);assert.equal(b.xp,a.xp+1);
 assert.deepEqual(b.chips,[build(p,'control',1),build(p,'swift',1)]);
 p.run.paths.control=2;w.brRecomputeRun(p);assert.deepEqual(w.brRunSnapshot(p).chips[0],build(p,'control',2));
 p.alive=false;p.lifeSeq++;assert.equal(w.brRunSnapshot(p).alive,false);assert.equal(w.brRunSnapshot(p).lifeSeq,p.lifeSeq);
 delete p.run.paths.swift;assert.equal(w.brRunSnapshot(p).chips.length,1);
});
