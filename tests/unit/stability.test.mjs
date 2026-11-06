import test from 'node:test';
import assert from 'node:assert/strict';
import {Peer} from '../../apps/server/src/ws/peer.js';
import {Metrics} from '../../apps/server/src/diagnostics/metrics.js';
import {presentationState} from '../../apps/server/src/ws/presentation-state.js';
import {createWorld,getTeacherState,getVisibleState,destroyWorld} from '../../packages/engine/src/index.js';
import {eventBatchMessages,MAX_EVENT_BATCH,MAX_EVENT_BATCH_BYTES} from '../../packages/protocol/src/server-events.js';
const config={bufferWarn:65536,bufferHard:262144,bufferTimeoutMs:1000};
function peerFixture(){const sent=[],frames=[],socket={readyState:1,bufferedAmount:0,send(x){const m=JSON.parse(x);frames.push(m);sent.push(...(eventBatchMessages(m)||[m]));},close(code,reason){this.readyState=3;this.closed={code,reason};}},transport={depth:0,corks:0,cork(){this.depth++;this.corks++;},uncork(){this.depth--;}};const metrics=new Metrics(),peer=new Peer(socket,config,metrics,transport);peer.member={cursor:0,events:[],eventBytes:0};return {sent,frames,socket,transport,metrics,peer};}
test('same-pump batching keeps reliable order, exact messages and only the latest snapshot',()=>{
 const {peer,sent,frames,transport,metrics}=peerFixture();peer.beginBatch();peer.send('EVENT',{n:1},{reliable:true});peer.send('EVENT',{n:2},{reliable:true});peer.snapshot(JSON.stringify({type:'SNAPSHOT',seq:1}));peer.snapshot(JSON.stringify({type:'SNAPSHOT',seq:2}));assert.equal(sent.length,0);peer.endBatch();assert.equal(frames.length,2);assert.equal(frames[0].type,'EVENT_BATCH');
 assert.deepEqual(sent.map(m=>m.type),['EVENT','EVENT','SNAPSHOT']);assert.deepEqual(sent.slice(0,2).map(m=>m.eventSeq),[1,2]);assert.equal(sent[2].seq,2);assert.equal(transport.corks,1);assert.equal(transport.depth,0);assert.equal(metrics.replacedSnapshots,1);assert.equal(peer.queueBytes,0);assert.equal(peer.pendingSnapshot,null);assert.deepEqual(peer.member.events.map(e=>JSON.parse(e.data)),sent.slice(0,2));
});
test('a blocked receiver cannot block another peer, lose reliable events or grow snapshots',()=>{
 const slow=peerFixture(),fast=peerFixture();slow.socket.bufferedAmount=config.bufferWarn;
 for(let n=0;n<300;n++){slow.peer.beginBatch();fast.peer.beginBatch();for(const p of [slow.peer,fast.peer]){p.send('EVENT',{n},{reliable:true});p.snapshot(JSON.stringify({type:'SNAPSHOT',n}));}slow.peer.endBatch();fast.peer.endBatch();}
 assert.equal(slow.sent.length,0);assert.equal(slow.peer.queue.length,300);assert.equal(slow.metrics.replacedSnapshots,299);assert.equal(fast.sent.length,600);assert.equal(fast.peer.queue.length,0);
 slow.socket.bufferedAmount=0;slow.peer.flush();assert.equal(slow.sent.length,301);assert.equal(slow.sent.at(-1).n,299);assert.deepEqual(slow.sent.slice(0,-1).map(x=>x.payload.n),Array.from({length:300},(_,i)=>i));assert.equal(slow.peer.queueBytes,0);
 slow.socket.bufferedAmount=config.bufferHard;slow.peer.highAt=Date.now()-1001;slow.peer.snapshot('{}');assert.deepEqual(slow.socket.closed,{code:4008,reason:'SLOW_RECEIVER_RESYNC'});assert.equal(slow.peer.pendingSnapshot,null);
});

test('event batches retain every cursor and stay below message and byte bounds',()=>{
 const {peer,sent,frames}=peerFixture();peer.beginBatch();
 for(let n=0;n<180;n++)peer.send('EVENT',{n,text:'한글🙂'.repeat(60)},{reliable:true});
 peer.send('COMMAND_RESULT',{accepted:true},{reliable:true});peer.send('EVENT',{n:180},{reliable:true});peer.endBatch();
 assert.equal(sent.length,182);assert.deepEqual(sent.map(x=>x.eventSeq),Array.from({length:182},(_,i)=>i+1));
 for(const m of frames.filter(m=>m.type==='EVENT_BATCH')){assert.ok(m.payload.messages.length<=MAX_EVENT_BATCH);assert.ok(Buffer.byteLength(JSON.stringify(m))<=MAX_EVENT_BATCH_BYTES);}
 assert.equal(sent[180].type,'COMMAND_RESULT');assert.equal(sent[181].payload.n,180);assert.equal(peer.queueBytes,0);
});

test('batched events use unchanged room/match/connection and duplicate-cursor guards',async()=>{
 const prior=globalThis.sessionStorage;globalThis.sessionStorage={getItem:()=>null};
 try{
  const {Connection}=await import('../../apps/client/src/net/connection.js'),c=new Connection('ws://fixture'),events=[];
  c.scope={roomInstanceId:'r',matchId:'m',connectionEpoch:2};c.cursor=10;c.addEventListener('event',e=>events.push(e.detail));
  const event=(eventSeq,scope={})=>({type:'EVENT',protocolVersion:33,...c.scope,...scope,eventSeq,payload:{n:eventSeq}});
  c.receive({type:'EVENT_BATCH',protocolVersion:33,payload:{messages:[event(11,{matchId:'old'}),event(12,{connectionEpoch:1}),event(10),event(11),event(12)]}});
  assert.deepEqual(events,[{n:11},{n:12}]);assert.equal(c.cursor,12);assert.equal(c.scope.matchId,'m');
  assert.throws(()=>eventBatchMessages({type:'EVENT_BATCH',protocolVersion:33,payload:{messages:[{type:'EVENT_BATCH',protocolVersion:33}]}}),/INVALID_EVENT_BATCH/);
 }finally{globalThis.sessionStorage=prior;}
});
test('retired bodies leave public snapshots after the fade; private death and owned attacks remain',()=>{
 const w=createWorld(undefined,{mode:'solo'},'stability',Array.from({length:30},(_,i)=>({id:'p'+i,name:'Synthetic '+i,abilityId:'emoji-003'})));
 try{
  const a=w.game.participants[0],b=w.game.participants[1];for(const p of w.game.participants.slice(5)){p.alive=false;p.hp=0;p.deathFrame=20;}
  w.game.frame=50;const first=getTeacherState(w);assert.equal(presentationState(w,first).actors.length,30);
  w.game.frame=81;const teacher=getTeacherState(w),view=presentationState(w,teacher);assert.equal(view.actors.length,5);assert.equal(teacher.actors.length,30);assert.equal(view.aliveCount,5);assert.equal(view.shots,teacher.shots);assert.equal(view.hostEffects,teacher.hostEffects);assert.equal(view.zones,teacher.zones);
  const dead=getVisibleState(w,'p29',undefined,view);assert.equal(dead.self.id,'p29');assert.equal(dead.self.alive,false);assert.ok(dead.self.run);
  a.alive=false;a.hp=0;a.deathFrame=81;b.alive=false;b.hp=0;b.deathFrame=null;assert.ok(presentationState(w,getTeacherState(w)).actors.some(p=>p.id==='p1'));
  w.game.frame=142;assert.equal(presentationState(w,getTeacherState(w)).actors.length,3);
  a.lifeSeq++;a.alive=true;a.hp=a.maxHp;a.deathFrame=null;assert.ok(presentationState(w,getTeacherState(w)).actors.some(p=>p.id==='p0'&&p.lifeSeq===1));
 }finally{destroyWorld(w);}
});
