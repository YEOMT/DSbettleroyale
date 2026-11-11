import assert from 'node:assert/strict';
import test from 'node:test';
import {Connection} from '../../apps/client/src/net/connection.js';

function fixture(t){
 const prior=globalThis.sessionStorage;
 globalThis.sessionStorage={getItem:()=>null};
 t.after(()=>{globalThis.sessionStorage=prior;});
 t.mock.timers.enable({apis:['setTimeout']});
 const c=new Connection('ws://fixture'),sent=[];
 c.session={role:'host'};
 c.scope={roomInstanceId:'room',matchId:'match',connectionEpoch:3};
 c.ws={readyState:1,send:raw=>sent.push(JSON.parse(raw))};
 return {c,sent};
}

test('only the original scoped END ACK succeeds while the host drains older frames',async t=>{
 const {c,sent}=fixture(t),done=c.command('END');
 t.mock.timers.tick(1500);t.mock.timers.tick(1500);t.mock.timers.tick(1500);
 assert.equal(sent.length,3);
 const id=sent[0].requestId,probe=c.pending.get(id).endSentAt;
 assert.ok(sent.every(m=>m.requestId===id));
 c.receive({type:'PONG',...c.scope,payload:{clientTime:probe-1,serverNow:100}});
 const ack={type:'COMMAND_RESULT',...c.scope,payload:{requestId:id,command:'END',accepted:true}};
 c.receive({...ack,connectionEpoch:2});
 c.receive({...ack,matchId:'previous'});
 c.receive({...ack,payload:{...ack.payload,requestId:'another'}});
 assert.equal(c.pending.size,1);
 c.receive(ack);
 assert.equal((await done).accepted,true);
 assert.equal(c.pending.size,0);
});

test('a later ordered PONG exposes a missing host END ACK; silence is bounded too',async t=>{
 const {c,sent}=fixture(t);
 for(const response of ['pong','silence']){
  const failed=assert.rejects(c.command('END'),/응답을 확인/);
  t.mock.timers.tick(1500);t.mock.timers.tick(1500);
  const pending=c.pending.get(sent.at(-1).requestId);
  if(response==='pong')c.receive({type:'PONG',...c.scope,payload:{clientTime:pending.endSentAt+1,serverNow:100}});
  else t.mock.timers.tick(8000);
  await failed;
  assert.equal(c.pending.size,0);
 }
 assert.equal(sent.length,6);
});

test('student combat commands keep the original three attempts and failure deadline',async t=>{
 const {c,sent}=fixture(t);c.session.role='student';
 const failed=assert.rejects(c.command('ACTION',{kind:'attack'}),/응답을 확인/);
 for(let n=0;n<3;n++)t.mock.timers.tick(1500);
 await failed;
 assert.equal(sent.length,3);
 assert.equal(c.pending.size,0);
});
