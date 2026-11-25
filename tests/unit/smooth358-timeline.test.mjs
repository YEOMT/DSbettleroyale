import test from 'node:test';
import assert from 'node:assert/strict';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
import {shotKey} from '../../apps/client/src/presentation/previews.js';

const actor=(id,x,lifeSeq=1,warpSeq=0)=>({id,x,y:0,lifeSeq,warpSeq,alive:true});
const shot=(seq=1)=>({id:'shot',owner:'peer',life:1,actionKind:'attack',actionSeq:seq,kind:'projectile',native:true,x:30,y:0,dx:5,dy:0,start:0,rangeRemaining:1000});
const snap=(seq,actors,shots=[])=>({snapshotSeq:seq,serverTick:seq*3,actors,shots});

test('cached snapshot sampling retains interpolation, warp boundaries and independent prior frames',()=>{
 const t=new Timeline();
 t.accept(snap(1,[actor('peer',0)],[shot()]),0);
 t.accept(snap(2,[actor('peer',30)],[{...shot(),x:45}]),50);
 const first=t.frame(100); // tick 4.5: halfway between snapshots
 assert.equal(first.actors[0].x,15);assert.equal(first.shots[0].x,37.5);
 t.accept(snap(3,[actor('peer',900,1,1)],[{...shot(),x:60}]),100);
 assert.equal(t.frame(150).actors.length,0,'a warp must not smear across its authority boundary');
 const warped=t.frame(175);assert.equal(warped.actors[0].x,900);
 assert.equal(first.actors[0].x,15);assert.equal(first.shots[0].x,37.5,'scratch lookup reuse must not mutate a previous render output');
});

test('preview handoff recognizes authority and terminal action identities without losing another ordinal',()=>{
 const t=new Timeline(),q=shot(),preview={...q,preview:true,bornAt:0,expires:1000};
 t.accept(snap(1,[actor('peer',0)],[q]),0);
 for(const ordinal of [0,1,2]){const p={...preview,ordinal};t.previews.set(shotKey(p),p);}
 t.event({type:'SHOT_END',serverTick:3,data:{...q,id:'ended',ordinal:1,x:50}},0);
 const view=t.frame(75);
 assert.equal(t.previews.size,1);assert.ok(t.previews.has(shotKey({...q,ordinal:2})));
 assert.equal(view.shots.filter(s=>s.preview).length,1);
 assert.equal(view.shots.filter(s=>s.preview)[0].ordinal,2);
});

test('effect life filtering uses the displayed actor and does not drop a contact for an absent actor',()=>{
 const t=new Timeline();t.accept(snap(1,[actor('peer',0,2)]),0);
 for(const [id,targetId,targetLife]of [['old','peer',1],['current','peer',2],['absent','offscreen',1]])
  t.event({type:'FX',eventId:id,serverTick:3,data:{kind:'hit',targetId,geometry:{targetLife,displayMs:210}}},0);
 assert.deepEqual(t.frame(75).effects.map(e=>e.id),['current','absent']);
});

test('five rematches keep lookup ownership bounded and idle self exact through duplicate and late snapshots',()=>{
 const t=new Timeline();
 for(let round=0;round<5;round++){
  for(let seq=1;seq<=180;seq++){
   const self=actor('self',125),actors=[self,...Array.from({length:29},(_,i)=>actor('peer'+i,seq*3+i))];
   const state={...snap(seq,actors,[{...shot(),id:'shot'+seq,x:seq*5}]),self};
   const now=seq*50;t.accept(state,now);assert.equal(t.accept(state,now+1),false);
   for(let f=0;f<3;f++){
    const view=t.frame(now+f*1000/60);assert.equal(view.actors.find(a=>a.id==='self').x,125);
    assert.ok(t.sampleIndexes.length<=3);assert.ok(t.samples.length<=40);
   }
  }
  t.reset();assert.equal(t.samples.length,0);assert.equal(t.sampleIndexes.length,0);
  assert.equal(t.frameActors.size+t.visibleShots.size+t.handedShots.size,0);
  assert.equal(t.frame(),null);
 }
});
