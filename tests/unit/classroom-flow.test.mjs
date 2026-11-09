import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomManager} from '../../apps/server/src/rooms/room.js';
import {Peer} from '../../apps/server/src/ws/peer.js';
import {Metrics} from '../../apps/server/src/diagnostics/metrics.js';
import {Connection} from '../../apps/client/src/net/connection.js';
function roomFixture(){let now=1000;const manager=new RoomManager({maxRooms:2,maxPlayers:20,roomTtlMs:10000},{now:()=>now});manager.changed=()=>{};const room=manager.create('Teacher'),a=room.addMember('A'),b=room.addMember('B');room.host.connected=true;return {manager,room,a,b,at:n=>{now=n;}};}
test('rematch discards unsent old-match traffic/profiles and retains the connection cursor',()=>{
 const {room,a}=roomFixture(),socket={readyState:1,bufferedAmount:65536,send(){},close(){}};
 const peer=new Peer(socket,{bufferWarn:65536},new Metrics());Object.assign(peer,{room,member:a,epoch:1});a.peer=peer;
 peer.send('EVENT',{old:true},{reliable:true});peer.pendingSnapshot='old';peer.profileState={old:true};const cursor=a.cursor;
 room.phase='RESULTS';room.command(room.host,'REMATCH',{});
 assert.equal(peer.pendingSnapshot,null);assert.equal(peer.queueBytes,0);assert.equal(peer.queue.length,0);assert.equal(peer.profileState,null);assert.equal(a.cursor,cursor);assert.equal(a.events.length,0);
});
test('a late ROOM_STATE cannot roll back the accepted room round',()=>{
 const prior=globalThis.sessionStorage;globalThis.sessionStorage={getItem:()=>null};try{
 const c=new Connection('ws://test'),state=(matchId,round)=>({type:'ROOM_STATE',roomInstanceId:'room',matchId,connectionEpoch:1,payload:{matchId,round,phase:'LOBBY',revision:round}});
 c.receive(state('one',1));c.receive(state('two',2));c.receive(state('one',1));assert.equal(c.scope.matchId,'two');
 }finally{globalThis.sessionStorage=prior;}
});
test('countdown protects the room; late join shares a full quiz deadline without resetting others',()=>{
 const {manager,room,a,at}=roomFixture();room.command(room.host,'START_QUIZ',{});
 assert.equal(room.phase,'LOBBY');assert.equal(room.countdown.endsAt,6000);assert.equal(manager.protectedRooms(),1);assert.equal(room.publicState(a).self.quiz,null);
 assert.throws(()=>room.configure({quizSeconds:20}),/PHASE_MISMATCH/);assert.throws(()=>room.command(room.host,'START_QUIZ',{}),/PHASE_MISMATCH/);
 at(5999);const c=room.addMember('C');assert.equal(c.quiz,undefined);manager.sweep();assert.equal(room.phase,'LOBBY');
 at(6000);manager.sweep();assert.equal(room.phase,'QUIZ');assert.equal(room.quizEndsAt,66000);a.quiz.score=2;const q=a.quiz.current;
 at(65999);const d=room.addMember('D');assert.equal(d.quiz.score,0);assert.ok(room.publicState(d).self.quiz.question);assert.equal(a.quiz.current,q);assert.equal(a.quiz.score,2);assert.equal(room.quizEndsAt,66000);
 at(66000);assert.throws(()=>room.addMember('Too late'),/JOIN_QUIZ_CLOSED/);assert.equal(room.students().length,4);manager.sweep();assert.equal(room.phase,'DRAFT');assert.ok(d.draft.abilityId);
});
test('the start button resubmitting unchanged settings preserves manual teams',()=>{
 const {room,a,b}=roomFixture();room.configure({mode:'team-capture',teams:{[a.id]:2,[b.id]:1}});room.configure({...room.config});assert.equal(a.team,2);assert.equal(b.team,1);room.command(room.host,'START_QUIZ',{});assert.equal(a.team,2);assert.equal(b.team,1);
});
test('match transition cancels old command retries; late full state and reply cannot change the new scope',async()=>{
 const prior=globalThis.sessionStorage;globalThis.sessionStorage={getItem:()=>null};try{
  const c=new Connection('ws://test'),state=(matchId,round)=>({type:'ROOM_STATE',roomInstanceId:'r',matchId,connectionEpoch:2,payload:{matchId,round,phase:'LOBBY',revision:round}});
  c.ws={readyState:1,send(){}};c.receive(state('old',1));const old=c.command('QUIZ_ANSWER',{}),rejected=assert.rejects(old,/MATCH_CHANGED/);c.receive(state('new',2));await rejected;assert.equal(c.pending.size,0);
  const fresh=c.command('DRAFT_CONFIRM',{}),id=[...c.pending.keys()][0];
  c.receive({...state('old',1),type:'FULL_STATE',payload:{room:{round:1,revision:1}}});
  c.receive({...state('old',1),type:'COMMAND_RESULT',payload:{requestId:id,command:'DRAFT_CONFIRM',accepted:true}});assert.equal(c.pending.size,1);assert.equal(c.scope.matchId,'new');
  c.receive({...state('new',2),type:'COMMAND_RESULT',payload:{requestId:id,command:'DRAFT_CONFIRM',accepted:true}});await fresh;assert.equal(c.pending.size,0);
 }finally{globalThis.sessionStorage=prior;}
});
