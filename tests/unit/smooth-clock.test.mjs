import test from 'node:test';
import assert from 'node:assert/strict';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
import {replay} from '../combat/smooth-clock.mjs';

test('ordered network jitter cannot stall a constant-speed remote actor or straight shot',()=>{
 for(const fps of [30,60,120])for(const delays of [[20],[15,40,5,35],[40,4,38,5,41,10]]){
  const r=replay(Timeline,delays,fps);
  assert.equal(r.heldPeerFrames,0);
  assert.equal(r.idleRangePx,0);
  assert.ok(r.peerStepErrorPx[2]<1&&r.shotStepErrorPx[2]<2);
  assert.ok(r.authorityToDisplayMs[2]<106);
 }
});
test('a stalled tab holds bounded playback, reanchors on return, and resets across matches',()=>{
 const t=new Timeline(),snap=(seq,tick)=>({snapshotSeq:seq,serverTick:tick,actors:[],shots:[]});
 t.accept(snap(1,60),1000);t.frame(1040);
 t.accept(snap(2,63),1087);
 const hold=t.frame(2000).renderTick;assert.equal(hold,67.5);
 assert.equal(t.frame(6000).renderTick,hold);
 t.accept(snap(3,363),6050);assert.equal(t.frame(6050).renderTick,358.5);
 assert.equal(t.accept(snap(2,63),6060),false);
 t.reset();t.accept(snap(1,3),6200);assert.equal(t.frame(6200).renderTick,0);
});
