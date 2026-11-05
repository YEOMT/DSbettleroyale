import test from 'node:test';
import assert from 'node:assert/strict';
import {AttackPoses,poseEnvelope} from '../../apps/client/src/render/attack-pose.js';
import {bindBattleTouch} from '../../apps/client/src/input/battle-touch.js';
import {requestId} from '../../apps/client/src/net/request-id.js';
const actor=(id,abilityId)=>({id,abilityId,alive:true,lifeSeq:2,radius:32,x:10,y:20});
test('HTTP LAN requests keep cryptographic UUIDv4 identities without changing secure-context IDs',()=>{
 assert.equal(requestId({randomUUID:()=> 'native-id'}),'native-id');
 const source={getRandomValues:a=>crypto.getRandomValues(a)},ids=new Set();
 for(let i=0;i<100;i++){const id=requestId(source);assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);ids.add(id);}
 assert.equal(ids.size,100);assert.throws(()=>requestId({}));
});
test('battle-local gesture cancellation leaves clicks/outside/hidden scene native and disposes',()=>{
 const root=new EventTarget();let hidden=false;root.classList={contains:()=>hidden};const dispose=bindBattleTouch(root);
 const send=(target,name)=>{const e=new Event(name,{cancelable:true});target.dispatchEvent(e);return e.defaultPrevented;};
 for(const type of ['gesturestart','gesturechange','gestureend','touchmove'])assert.ok(send(root,type));
 for(const type of ['click','pointerdown','pointercancel','touchstart','touchend'])assert.equal(send(root,type),false);
 assert.equal(send(new EventTarget(),'gesturestart'),false);hidden=true;assert.equal(send(root,'gesturestart'),false);
 hidden=false;dispose();assert.equal(send(root,'gesturestart'),false);
});
test('heavy stroke has thrust, compression and return; quick attacks keep a shorter crisp curve',()=>{
 assert.ok(poseEnvelope('heavy',.18).shift>.9);assert.ok(poseEnvelope('heavy',.3).shift>.5);
 assert.ok(poseEnvelope('heavy',.72).shift<0);assert.ok(poseEnvelope('heavy',.43).squash>.99);
 assert.ok(poseEnvelope('quick',.8).shift<.1);assert.deepEqual(poseEnvelope('heavy',1),{shift:0,squash:0});
});
test('low quality retains bounded recoil, ordinals cannot stack it, and actor coordinates remain exact',()=>{
 const a=actor('a','emoji-023'),b=actor('b','emoji-001'),before=structuredClone([a,b]);
 for(const low of [true,false]){
  const poses=new AttackPoses(),e={type:'SHOT_SPAWN',serverTick:10,data:{owner:'a',life:2,actionKind:'skill',actionSeq:3,dx:1,dy:0}};
  poses.accept(e,[a,b],100);const entry=poses.active.get('a');
  for(let ordinal=1;ordinal<40;ordinal++)poses.accept({...e,data:{...e.data,ordinal}},[a,b],101+ordinal);
  assert.equal(poses.active.get('a'),entry);
  const samples=[];for(let dt=0;dt<=180;dt+=8){const p=poses.sample(a,.45,10+dt*.06,100+dt,false,low);if(p){assert.ok(Math.hypot(p.x,p.y)*.45<=32*.45*.30+.0001);samples.push(Math.abs(p.x)*.45);}}
  assert.ok(Math.max(...samples)>3.5);assert.equal(poses.active.size,0);
 }
 assert.deepEqual([a,b],before);
});
test('only confirmed non-periodic contact compresses the melee source, bounded by life and expiry',()=>{
 const poses=new AttackPoses(),a=actor('a','emoji-025'),b=actor('b','emoji-001');
 const hit={type:'FX',serverTick:10,data:{kind:'hit',sourceId:'a',targetId:'b',style:'basic-hammer',dx:1,dy:0,impactLevel:4,geometry:{confirmed:true,shape:'contact',lifeSeq:2,targetLife:2}}};
 poses.accept({...hit,data:{...hit.data,geometry:{...hit.data.geometry,confirmed:false}}},[a,b],100);assert.equal(poses.contacts.size,0);
 poses.accept(hit,[a,b],100);assert.ok(poses.sample(a,1,11,140,false,true).squash>.1);
 assert.equal(poses.sample(a,1,11,140,true,true),null);
 assert.equal(poses.sample({...a,lifeSeq:3},1,11,140,false,true),null);assert.equal(poses.contacts.size,0);
 poses.accept({...hit,data:{...hit.data,geometry:{...hit.data.geometry,periodic:true}}},[a,b],150);assert.equal(poses.contacts.size,0);
 poses.accept(hit,[a,b],200);poses.sample(a,1,20,301,false,true);assert.equal(poses.contacts.size,0);poses.clear();assert.equal(poses.active.size,0);
});
