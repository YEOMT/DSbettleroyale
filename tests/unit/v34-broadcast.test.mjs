import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,destroyWorld,getTeacherState,getVisibleState} from '../../packages/engine/src/index.js';
import {ClassroomBanner,announcementText} from '../../apps/client/src/ui/classroom-banner.js';
import {HostCamera} from '../../apps/client/src/render/camera.js';
import {Peer} from '../../apps/server/src/ws/peer.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {classroomName} from '../../packages/protocol/src/player-name.js';

const players=Array.from({length:12},(_,i)=>({id:'actor'+i,name:'학생 '+i,abilityId:'emoji-114',team:i===0?1:2}));
function makeWorld(mode) {
 const w=createWorld(undefined,{mode,teamCount:2},'announcer-test',players.map(p=>({...p,team:mode==='solo'?0:p.team})));
 for(const p of w.game.participants)p.spawnProtectionUntilFrame=0;
 return w;
}
function defeat(p,by){p.hp=1;p.takeDamage(200,by,false,null,by?{basic:true,scaled:true}:{attackKind:'environment',scaled:true});assert.equal(p.alive,false);}

for(const mode of ['solo','team-respawn','team-capture'])test(mode+' actual deaths announce only first blood and cumulative 3/5/7/10',()=>{
 const w=makeWorld(mode),[a,...victims]=w.game.participants,seen=[];let cursor=0;
 try{
  for(let i=0;i<10;i++){
   w.game.frame+=121;defeat(victims[i],a);
   for(const event of w.game.classroomAnnouncements?.events||[])if(event.seq>cursor){seen.push([event.kind,event.kills]);cursor=event.seq;}
   w.game.registerKillEvent(a,victims[i]);assert.equal(w.game.classroomAnnouncements.seq,cursor);
   if(i===4&&mode==='team-respawn'){
    const life=a.lifeSeq;defeat(a,victims.at(-1));w.brTeamKillDeath(a);
    a.tkQuiz.correct=w.brTeamKillRules().quizNeeded;
    assert.equal(w.brRespawnPlayer(a,false),true);assert.equal(a.lifeSeq,life+1);assert.equal(a.kills,5);
   }
  }
  assert.equal(a.kills,10);assert.deepEqual(seen,[['first-blood',undefined],['streak',3],['streak',5],['streak',7],['streak',10]]);
  assert.ok(w.game.eventFeed.length);const teacher=getTeacherState(w),student=getVisibleState(w,victims[0].remoteId,undefined,teacher);
  assert.deepEqual(teacher.announcements,student.announcements);assert.ok(!('x' in teacher.announcements.events[0]));
 }finally{destroyWorld(w);assert.equal(w.game.classroomAnnouncements,null);}
});

test('self, friendly, environment, training body, clone and duplicate callbacks cannot claim first blood',()=>{
 const w=makeWorld('solo'),[a,b,c,d,e,f]=w.game.participants;
 try{
  defeat(b,null);w.game.registerKillEvent(a,b);
  w.game.registerKillEvent(a,a);a.team=c.team=1;w.game.registerKillEvent(a,c);
  d.remoteId='';w.game.registerKillEvent(a,d);e.isClone=true;w.game.registerKillEvent(a,e);
  assert.equal(w.game.firstBloodDone,false);defeat(f,a);assert.equal(w.game.classroomAnnouncements.seq,1);
 }finally{destroyWorld(w);}
});

test('two valid deaths in one authority frame produce a single deterministic first blood',()=>{
 const w=makeWorld('solo'),[a,b,c,d]=w.game.participants;
 try{defeat(b,a);defeat(d,c);assert.equal(a.kills,1);assert.equal(c.kills,1);
  assert.deepEqual(w.game.classroomAnnouncements.events.map(e=>[e.kind,e.playerId]),[['first-blood',a.remoteId]]);
 }finally{destroyWorld(w);}
});

test('shared announcement block survives snapshot replacement; idle delivery carries no announcement bytes',t=>{
 const w=makeWorld('solo'),out=[];
 try{
  w.game.announceClassroom('supply-incoming',{supply:'haste'});const teacher=getTeacherState(w),encode=snapshotEncoder(teacher,2,0);
  const ws={readyState:1,bufferedAmount:20,send(data){out.push(JSON.parse(data));}},peer=new Peer(ws,{bufferWarn:10,bufferHard:100},{bufferHighWatermark:0,replacedSnapshots:0,sentBytes:0});
  const queue=()=>peer.snapshot(encode(teacher,{},peer.deliveredAnnouncement),teacher.announcements.seq);
  queue();queue();assert.equal(out.length,0);assert.equal(peer.metrics.replacedSnapshots,1);ws.bufferedAmount=0;peer.flush();
  assert.equal(out[0].payload.announcements.events[0].kind,'supply-incoming');queue();assert.ok(!('announcements' in out[1].payload));
  const once=encode(teacher,{},0).length-encode(teacher,{},teacher.announcements.seq).length;
  t.diagnostic('supply-incoming announcement bytes per receiver: first '+once+', unchanged snapshots 0');
  peer.resetMatch();assert.equal(peer.deliveredAnnouncement,0);
 }finally{destroyWorld(w);}
});

test('10-event burst has bounded priority queue, ignores repeats, full recovery floor and capture notice suppress old kills',()=>{
 const w=makeWorld('solo'),node={},heard=[],banner=new ClassroomBanner(node,()=>heard.push('sound'),()=>true);
 try{
  for(let i=0;i<10;i++){w.game.announceClassroom('supply-claimed',{supply:'guard',playerId:'actor0'});banner.accept(w.game.classroomAnnouncements,0,players,i,false);}
  assert.equal(banner.pending.length,3);assert.equal(w.game.classroomAnnouncements.events.length,3);
  w.game.announceClassroom('final-three');banner.accept(w.game.classroomAnnouncements,0,players,10,false);assert.match(node.textContent,/FINAL 3/);
  w.game.announceClassroom('supply-claimed',{supply:'attack',playerId:'actor0'});banner.accept(w.game.classroomAnnouncements,0,players,15,false);assert.match(node.textContent,/FINAL 3/);assert.equal(heard.length,1);
  banner.advance(50,true);assert.equal(node.hidden,true);const last=banner.cursor;banner.reset(last);banner.accept(w.game.classroomAnnouncements,0,players,2110,false);assert.equal(node.hidden,true);
  banner.reset();assert.equal(banner.cursor,0);assert.equal(banner.pending.length,0);
  assert.equal(classroomName(' <가\u202e림> '),'가림');assert.equal(announcementText({kind:'first-blood',playerId:'x'},[{id:'x',name:'<가림>'}]),'FIRST BLOOD! · 가림');
 }finally{destroyWorld(w);}
});

test('overview uses ring/terrain centre and HUD-safe viewport for three aspect ratios',()=>{
 const view={actors:[{id:'1',alive:true,x:1500,y:200,radius:40},{id:'2',alive:true,x:1600,y:300,radius:40}],ring:{cx:800,cy:120,radius:1400}};
 const map={worldRadius:3200,center:{x:-200,y:10},boundary:{minX:-2600,maxX:3400,minY:-3150,maxY:2850}};
 for(const [w,h] of [[1366,768],[1024,768],[390,844]]){
  const insets={top:158,bottom:72,left:10,right:16},c=new HostCamera();
  let p=c.update(view,map,w,h,false,16,insets);assert.deepEqual([p.x,p.y],[800,120]);
  for(const a of view.actors){assert.ok(p.screenX+(a.x-p.x)*p.zoom<w-16);assert.ok(p.screenY+(a.y-p.y)*p.zoom<h-72);}
  p=c.update({...view,capture:{}},map,w,h,false,16,insets);assert.deepEqual([p.x,p.y],[400,-150]);assert.deepEqual([p.screenX,p.screenY],[(w+10-16)/2,(h+158-72)/2]);
  for(const x of [map.boundary.minX,map.boundary.maxX])for(const y of [map.boundary.minY,map.boundary.maxY]){
   const sx=p.screenX+(x-p.x)*p.zoom,sy=p.screenY+(y-p.y)*p.zoom;
   assert.ok(sx>=10+24-1e-8&&sx<=w-16-24+1e-8&&sy>=158-1e-8&&sy<=h-72+1e-8);
  }
 }
});

test('banner fade respects the motion setting and cancels a replaced animation',()=>{
 let animations=0,cancelled=0,allow=true;
 const node={animate(_frames,options){animations++;assert.equal(options.duration,2000);return {cancel(){cancelled++;}};}};
 const banner=new ClassroomBanner(node,()=>{},()=>true,()=>allow);
 const message=(seq,kind,priority)=>({seq,events:[{seq,frame:10,kind,priority}]});
 banner.accept(message(1,'first-blood',3),10,players,0,false);
 banner.accept(message(2,'compression',4),10,players,100,false);
 assert.equal(animations,2);assert.equal(cancelled,1);banner.reset(2);allow=false;
 banner.accept(message(3,'compression',4),10,players,200,false);
 assert.equal(animations,2);assert.equal(cancelled,2);
});
