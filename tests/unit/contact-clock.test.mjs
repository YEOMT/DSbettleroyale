import test from 'node:test';
import assert from 'node:assert/strict';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';

// Opponent Pixi first-draw trace from GitHub Actions job 131261970192:
// event tick 73, then frames at 72.834 / 85.696 / 92.119, aged 116 / 249 / 366ms.
const hit={type:'FX',eventId:'hit',serverTick:73,data:{kind:'hit',sourceId:'a',targetId:'b',
 geometry:{confirmed:true,lifeSeq:2,targetLife:2,displayMs:210}}};
function frame(t,seq,serverTick,renderTick,now,life=2){
 const actors=['a','b'].map(id=>({id,alive:true,x:0,y:0,lifeSeq:life}));
 t.accept({snapshotSeq:seq,serverTick,actors,shots:[]},now-(renderTick-serverTick+4.5)/.06);
 return t.frame(now);
}
test('confirmed contact observed just before its eligible tick survives a busy Pixi draw',()=>{
 const t=new Timeline();t.event(hit,0);
 assert.equal(frame(t,1,75,72.834,116).effects.length,0);
 const fx=frame(t,2,90,85.696,249).effects[0];
 assert.ok(fx,'missing first eligible contact');assert.equal(fx.tick,73);
 assert.equal(frame(t,3,96,92.119,366).effects.length,0,'original wall lifetime elapsed');
});
test('missing, stale, other-life and periodic contacts cannot acquire another display window',()=>{
 for(const type of ['never buffered','stale authority','late frame','different life','periodic']){
  const t=new Timeline();
  t.event(type==='periodic'?{...hit,data:{...hit.data,geometry:{...hit.data.geometry,periodic:true}}}:hit,0);
  if(type!=='never buffered')frame(t,1,75,72.834,116);
  const now=type==='late frame'?900:249;
  const tick=type==='stale authority'?132:95;
  assert.equal(frame(t,2,tick,tick-4.5,now,type==='different life'?3:2).effects.length,0,type);
 }
});
