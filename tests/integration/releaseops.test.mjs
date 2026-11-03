import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import WebSocket from 'ws';
import {createGameServer} from '../../apps/server/src/main.js';import {readConfig} from '../../apps/server/src/config.js';import {fingerprint} from '../../packages/protocol/src/index.js';
test('real process config restart stays closed during interruption and opens only after committed admission',async()=>{
 const dir=fs.mkdtempSync(path.resolve('artifacts/restart-')),file=path.join(dir,'state');
 try{for(const value of ['closed','closed','open']){
  fs.writeFileSync(file,value);const cfg=readConfig({DRAIN_STATE_FILE:file}),app=await createGameServer({port:0,drainOnStart:cfg.drainOnStart});
  try{assert.equal(app.manager.draining,value!=='open');}finally{await app.close();}
 }}finally{fs.rmSync(dir,{recursive:true});}
});
test('actual WS rejects an old buildId; exact origin remains required',async()=>{
 const app=await createGameServer({port:0,origins:['http://release-test']});
 try{const message=await new Promise((resolve,reject)=>{const ws=new WebSocket('ws://127.0.0.1:'+app.address.port+'/ws',{origin:'http://release-test'});const timer=setTimeout(()=>{ws.terminate();reject(Error('TIMEOUT'));},3000);ws.on('error',reject);ws.on('open',()=>ws.send(JSON.stringify({type:'HELLO',protocolVersion:33,payload:{...fingerprint,buildId:'previous-client'}})));ws.on('message',raw=>{clearTimeout(timer);resolve(JSON.parse(raw));ws.close();});});assert.equal(message.type,'VERSION_MISMATCH');
 const status=await new Promise((resolve,reject)=>{const ws=new WebSocket('ws://127.0.0.1:'+app.address.port+'/ws',{origin:'https://unapproved.example'});ws.on('unexpected-response',(_req,res)=>{resolve(res.statusCode);ws.terminate();});ws.on('error',()=>{});setTimeout(()=>{ws.terminate();reject(Error('TIMEOUT'));},3000).unref();});assert.equal(status,403);
 }finally{await app.close();}
});
