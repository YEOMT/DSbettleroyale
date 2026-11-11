// Reproduce the host's slow incoming task queue without delaying the server or
// changing ACKs, the retry clock, socket order, or the real browser command.
import assert from 'node:assert/strict';
import {auditHarness} from '../fidelity-v33-2/harness.mjs';

const h=await auditHarness({players:2,renderer:'canvas'});
try{
 await h.battle();
 const peer=h.room.host.peer,requests=[];
 peer.socket.on('message',raw=>{
  const m=JSON.parse(raw);
  if(m.type==='END')requests.push(m.requestId);
 });
 const result=await h.host.evaluate(async()=>{
  const {net,ui}=window.auditApp,ws=net.ws,deliver=ws.onmessage,queue=[];
  const started=performance.now();let delivered=false;
  ws.onmessage=e=>queue.push(e);
  const drained=new Promise(resolve=>setTimeout(()=>{
   ws.onmessage=deliver;
   for(const event of queue)deliver.call(ws,event);
   delivered=true;
   resolve();
  },5500));
  let ack,error;
  try{ack=await net.command('END');}catch(e){error=e.message;}
  const settledMs=performance.now()-started,settledAfterDelivery=delivered;
  await drained;
  return {ack:ack?.accepted,error,settledMs,settledAfterDelivery,phase:ui.room.phase,queued:queue.length,pending:net.pending.size};
 });
 assert.equal(h.room.phase,'RESULTS');
 assert.equal(requests.length,3,'the final retry used the real transport');
 assert.equal(new Set(requests).size,1,'all retries used the original request ID');
 assert.equal(result.phase,'RESULTS','browser received the authoritative result');
 assert.equal(result.ack,true,JSON.stringify(result));
 assert.equal(result.pending,0);
 assert.equal(result.settledAfterDelivery,true,'an ACK must reach the browser before END succeeds');
 await h.command('REMATCH');
 await h.student.waitForFunction(()=>auditApp.ui.room.phase==='LOBBY');
 assert.equal(h.room.phase,'LOBBY');
 console.log('delayed host END and same-room REMATCH PASS',JSON.stringify(result));
}finally{await h.close();}
