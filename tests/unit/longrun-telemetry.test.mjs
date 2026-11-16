import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {Metrics} from '../../apps/server/src/diagnostics/metrics.js';
import {loadTelemetry} from '../../tools/load/telemetry.mjs';

function fixture(){
 const metrics=new Metrics(),wss=new EventEmitter(),peers=new Set(),manager={rooms:new Map(),tokens:new Map()};
 const socket=new EventEmitter();Object.assign(socket,{send(){},bufferedAmount:0,_socket:{_write(){},_writev(){},bytesWritten:0}});
 const peer={socket,queue:[],queueBytes:0,member:{role:'student'}};peers.add(peer);
 return {app:{metrics,wss,peers,manager},socket};
}
test('long-run telemetry counts each UTF-8 WS payload once and labels bounded quantile windows',()=>{
 const {app,socket}=fixture(),telemetry=loadTelemetry(app);app.wss.emit('connection',socket);
 const data=JSON.stringify({type:'EVENT_BATCH',payload:{messages:[{text:'합성'}]}});
 for(let i=0;i<160;i++)socket.send(i%2?Buffer.from(data):data);
 for(let i=1;i<=3;i++)app.metrics.stepCpu.add(i);
 const sample=telemetry.sample();telemetry.close();
 assert.equal(sample.transport.frames,160);assert.equal(sample.transport.bytes,160*Buffer.byteLength(data));
 assert.equal(sample.transport.traffic.length,1);const row=sample.transport.traffic[0];
 assert.equal(row.role,'student');assert.equal(row.type,'EVENT_BATCH');assert.equal(row.sizes.sampleCount,128);
 assert.equal(row.sizes.scope,'latest-128-in-window');assert.equal(row.sizes.count,160);
 assert.equal(sample.step.p50,2);assert.equal(sample.step.sampleCount,3);assert.equal(sample.step.scope,'entire-window');
 assert.ok(sample.windowEnd>=sample.windowStart);assert.equal(app.metrics.stepCpu.report().count,3);
 assert.equal(sample.ownership.peers,1);
});
test('diagnostics off leaves send and native metrics untouched while exposing ownership',()=>{
 const {app,socket}=fixture(),originalSend=socket.send,originalAdd=app.metrics.stepCpu.add;
 const telemetry=loadTelemetry(app,{enabled:false});app.wss.emit('connection',socket);
 assert.equal(socket.send,originalSend);assert.equal(app.metrics.stepCpu.add,originalAdd);
 const sample=telemetry.sample();telemetry.close();assert.equal(sample.ownership.peers,1);
 assert.equal(sample.queueBytes,0);assert.equal(sample.roster10.retained,0);assert.ok(sample.memory.heapTotal>=sample.memory.heapUsed);
 assert.equal(sample.transport,undefined);
});
