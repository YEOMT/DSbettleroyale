import test from 'node:test';
import assert from 'node:assert/strict';
import {batchFixture} from '../simulation-fixture.mjs';
import {Peer} from '../../apps/server/src/ws/peer.js';
import {eventBatchMessages} from '../../packages/protocol/src/server-events.js';

test('manual contact fixture uses the production atomic event batch, preserving cursor and next snapshot',()=>{
 const frames=[],socket={readyState:1,bufferedAmount:0,send:data=>frames.push(JSON.parse(data))};
 const peer=new Peer(socket,{bufferWarn:65536},{bufferHighWatermark:0,sentBytes:0});
 peer.member={epoch:3,cursor:0,events:[],eventBytes:0};peer.room={id:'fixture',matchId:'same-life'};
 const room={members:new Map([['live',{connected:true,peer}],['offline',{connected:false,peer:{beginBatch(){throw Error('offline peer');}}}]])};
 const emit=()=>{for(const kind of ['swing','hit','swing'])peer.send('EVENT',{serverTick:20,data:{kind}},{reliable:true});};
 batchFixture(room,()=>{emit();assert.equal(frames.length,0);peer.snapshot(JSON.stringify({type:'SNAPSHOT',payload:{serverTick:20}}));});
 assert.equal(frames.length,2);assert.equal(frames[0].type,'EVENT_BATCH');assert.equal(frames[1].type,'SNAPSHOT');
 const messages=eventBatchMessages(frames[0]);assert.deepEqual(messages.map(m=>m.payload.data.kind),['swing','hit','swing']);
 assert.deepEqual(messages.map(m=>m.eventSeq),[1,2,3]);assert.ok(messages.every(m=>m.connectionEpoch===3&&m.matchId==='same-life'));
 assert.equal(peer.member.events.length,3);assert.equal(peer.queueBytes,0);assert.equal(peer.batchDepth,0);
 assert.throws(()=>batchFixture(room,()=>{emit();throw Error('fixture failure');}),/fixture failure/);
 assert.equal(peer.batchDepth,0);assert.equal(peer.queue.length,0);assert.deepEqual(eventBatchMessages(frames[2]).map(m=>m.eventSeq),[4,5,6]);
});
