import test from 'node:test';
import assert from 'node:assert/strict';
import {HostCamera} from '../../apps/client/src/render/camera.js';
import {StudentCamera,screenToWorld} from '../../apps/client/src/render/viewport.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
import {AttackPoses,poseFamily} from '../../apps/client/src/render/attack-pose.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {applyCommand,createWorld,destroyWorld,stepWorld,getStaticState,getVisibleState} from '../../packages/engine/src/index.js';

const map={worldRadius:2400},actor=(id,x,y)=>({id,x,y,alive:true,radius:32,lifeSeq:2,abilityId:'emoji-023'});
const close=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,a+' vs '+b);
test('confirmed fights switch only on sufficient advantage; dead and stale targets release',()=>{
 const camera=new HostCamera(),actors=[actor('a',-900,50),actor('b',-700,100),actor('c',750,0),actor('d',1000,0)];
 let tick=0;const draw=(frames,focus=true)=>{let p;for(let i=0;i<frames;i++)p=camera.update({actors,shots:[],renderTick:tick++},map,1366,768,focus,1000/60);return p;};
 const hit=(a,b,weight)=>camera.observe({type:'FX',data:{kind:'hit',sourceId:a,targetId:b,impactLevel:weight,geometry:{lifeSeq:2,targetLife:2}},serverTick:tick});
 assert.equal(draw(1).mode,'overview');hit('a','b',1);draw(15);assert.equal(camera.pair.key,'a/b');
 hit('c','d',4);draw(45);assert.equal(camera.pair.key,'a/b');draw(38);assert.equal(camera.pair.key,'c/d');
 actors[2].alive=false;draw(1);assert.notEqual(camera.pair?.key,'c/d');assert.equal(draw(130).mode,'overview');
 camera.reset();assert.equal(camera.contacts.size,0);assert.equal(camera.pair,null);
});
test('20 spread actors, 6 to 1, viewport rotation and clone removal fit the HUD safe area at 30/60/120Hz',()=>{
 const traces=[];
 for(const hz of [30,60,120]){
  const camera=new HostCamera(),actors=Array.from({length:20},(_,i)=>actor(String(i),(i%5-2)*820,(i%4-1.5)*650));
  actors.push({...actor('clone',1e6,1e6),clone:true});const rows=[];
  for(const [step,n] of [20,6,5,4,3,2,1].entries()){
   const [w,h]=step>=4?[844,390]:[1366,768];actors.slice(0,-1).forEach((a,i)=>a.alive=i<n);
   for(let j=0;j<hz;j++){
    const p=camera.update({actors},map,w,h,false,1000/hz);assert.ok(Number.isFinite(p.zoom)&&p.zoom>0);
    for(const a of actors.slice(0,n)){const x=(a.x-p.x)*p.zoom+p.screenX,y=(a.y-p.y)*p.zoom+p.screenY;assert.ok(x>=28&&x<=w-28&&y>=86&&y<=h-54);}
    if(j===hz-1)rows.push(p);
   }
  }traces.push(rows);
 }
 for(const trace of traces.slice(1))for(const [i,p] of trace.entries()){close(p.zoom,traces[0][i].zoom,.02);close(p.x,traces[0][i].x,1);close(p.y,traces[0][i].y,1);}
});
test('fixed server input and ACK replay are independent of display Hz including wall, stop, reversal and warp',()=>{
 const w=createWorld(undefined,{},'feel-motion',[{id:'a',abilityId:'emoji-025'},{id:'b',abilityId:'emoji-023'}]);
 try{
  const p=w.byId.get('a');p.pos=new w.Vec2(0,0);w.byId.get('b').pos=new w.Vec2(-500,400);w.brFarm.dispose(w.game);w.game.walls=[new w.Wall(150,0,60,400,0)];
  const t=[30,60,120].map(()=>new Timeline());for(const timeline of t)timeline.setStatic(getStaticState(w));
  for(let tick=1;tick<=180;tick++){
   const x=tick<45?1:tick<70?-1:0,c={type:'INPUT',move:{x,y:0},aim:{x:1,y:0},seq:tick,clientTick:tick,playerId:'a',lifeSeq:p.lifeSeq};
   if(tick===100){p.warpSeq++;p.pos=new w.Vec2(40,30);}
   for(const tl of t)tl.predict(c);applyCommand(w,c);stepWorld(w);
   const now=tick*1000/60;
   if(tick%3===0){const s={...getVisibleState(w,'a'),snapshotSeq:tick/3};for(const tl of t)tl.accept(s,now);}
   if(tick<3)continue;
   if(tick%2===0)t[0].frame(now);t[1].frame(now);t[2].frame(now-1000/120);t[2].frame(now);
   if(tick%6===0){const positions=t.map(tl=>tl.frame(now).actors.find(a=>a.id==='a').x);close(positions[0],positions[1]);close(positions[1],positions[2]);}
  }
  close(t[0].predicted.x,p.pos.x);close(p.vel.x,0);
 }finally{destroyWorld(w);}
 const rows=[];for(const hz of [30,60,120]){
  const t=new Timeline(),snap=(seq,x)=>({snapshotSeq:seq,serverTick:3*seq,actors:[],shots:[],self:{id:'a',alive:true,lifeSeq:1,x,y:0}});
  t.accept(snap(1,10),0);t.accept(snap(2,0),50);
  for(let i=1;i<=hz/10;i++)t.frame(50+1000*i/hz);
  const x=t.frame(150).actors[0].x;close(x,t.frame(150).actors[0].x);rows.push(x);
 }
 for(const x of rows)close(x,10*.8**6);
});
test('student lead follows display time without delaying the body or raw pointer; CSS/DPR independent',()=>{
 const a=actor('a',240,20),poses=[];
 for(const hz of [30,60,120]){
  const camera=new StudentCamera();for(const x of [1,-1,0])for(let i=0;i<hz/3;i++)camera.update(a,{x,y:0},844,390,1000/hz);
  poses.push(camera.update(a,{x:0,y:0},844,390,0));const warped=camera.update({...a,x:1100,warpSeq:1},{x:0,y:0},844,390,16);close(warped.x,1100);
 }
 for(const p of poses){close(p.x,poses[0].x);close(p.y,poses[0].y);assert.ok(Math.abs(p.x-a.x)<2);}
 const pose=poses[0],rect={left:19,top:30,width:422,height:195};
 const point=screenToWorld(19+211+42,30+97.5,rect,pose,844,390);close(point.x,pose.x+84/pose.zoom);close(point.y,pose.y);
});
test('display gates one sequence across ordinals, preserves authoritative origins and ends on life/death/reduced motion',()=>{
 for(const a of manifest.roster)for(const kind of ['attack','skill'])assert.equal(typeof poseFamily(a.id,kind),'string');
 const poses=new AttackPoses(),a=actor('a',40,80),event={type:'SHOT_SPAWN',serverTick:4,data:{id:'one',owner:'a',life:2,actionKind:'skill',actionSeq:4,dx:20,dy:0}};
 poses.accept(event,[a],100);const entry=poses.active.get('a');assert.equal(entry.family,'recoil');poses.accept({...event,serverTick:6,data:{...event.data,id:'two',ordinal:1}},[a],130);assert.equal(poses.active.get('a'),entry);
 const pose=poses.sample(a,1,5,116,false,false);assert.ok(pose.x<0&&pose.x>=-4);assert.equal(a.x,40);assert.equal(poses.sample(a,1,5,116,true,false),null);assert.equal(poses.sample({...a,lifeSeq:3},1,5,116,false,false),null);
 poses.accept({...event,type:'COMMAND_RESULT'},[a],116);assert.equal(poses.active.size,0);
});
