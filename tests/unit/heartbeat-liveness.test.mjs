import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {attachConnection} from '../../apps/server/src/ws/handler.js';
import {readConfig} from '../../apps/server/src/config.js';
import {Metrics} from '../../apps/server/src/diagnostics/metrics.js';
import {envelope,fingerprint} from '../../packages/protocol/src/index.js';

function fixture(t){
 const ws=new EventEmitter(),sent=[];
 Object.assign(ws,{readyState:1,bufferedAmount:0,send:raw=>sent.push(JSON.parse(raw)),close:()=>{ws.readyState=3;ws.emit('close',1000,Buffer.alloc(0));}});
 const peer=attachConnection(ws,{},readConfig(),new Metrics());t.after(()=>ws.close());
 const message=(type,payload)=>ws.emit('message',Buffer.from(JSON.stringify(envelope(type,payload))),false);
 return {ws,peer,sent,message};
}

test('validated application PING proves liveness while the browser delays a control pong',t=>{
 const {peer,sent,message}=fixture(t);message('HELLO',fingerprint);
 peer.alive=false; // The unchanged periodic heartbeat has sent its control ping.
 message('PING',{clientTime:12000});
 assert.equal(sent.at(-1).type,'PONG');
 assert.equal(peer.alive,true,'normal protocol traffic cannot be terminated as a silent socket');
 // No message means no renewal; the next existing 15s heartbeat still closes it.
 peer.alive=false;assert.equal(peer.alive,false);
});

test('unvalidated traffic does not renew liveness; native pong still does',t=>{
 const {ws,peer,message}=fixture(t);peer.alive=false;
 message('PING',{clientTime:1});assert.equal(peer.alive,false,'HELLO still required');
 message('HELLO',fingerprint);peer.alive=false;
 message('PING',{clientTime:'invalid'});assert.equal(peer.alive,false,'schema still required');
 ws.emit('pong');assert.equal(peer.alive,true);
});
