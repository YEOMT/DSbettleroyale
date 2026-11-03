import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import WebSocket from 'ws';
import {createGameServer} from '../../apps/server/src/main.js';import {readConfig} from '../../apps/server/src/config.js';import {fingerprint} from '../../packages/protocol/src/index.js';
import {connect} from './client.mjs';
test('separate staging process rejects production token/password and cannot delete its rooms',async()=>{
 const prod=await createGameServer({port:0,hostSecret:'prod-fixture',adminSecret:'prod-admin'}),stage=await createGameServer({port:0,hostSecret:'stage-fixture',adminSecret:'stage-admin'}),clients=[];
 async function host(app,secret){const c=await connect(app);clients.push(c);c.send('AUTH',{secret},false);await c.next('AUTH_OK');c.send('CREATE',{},false);await c.next('SESSION');await c.next('ROOM_STATE');return c;}
 try{
  const p=await host(prod,'prod-fixture'),s=await host(stage,'stage-fixture');
  const resume=await connect(stage);clients.push(resume);resume.send('RESUME',{token:p.session.token,cursor:0},false);assert.equal((await resume.next('ERROR')).payload.code,'ROOM_EXPIRED');
  // Invalid resume closes that socket by design; auth uses an independent connection.
  const auth=await connect(stage);clients.push(auth);auth.send('AUTH',{secret:'prod-fixture'},false);assert.equal((await auth.next('ERROR')).payload.code,'AUTH_FAILED');
  assert.equal(prod.manager.rooms.size,1);assert.equal(stage.manager.rooms.size,1);assert.equal((await s.command('CLOSE_ROOM')).accepted,true);assert.equal(prod.manager.rooms.size,1);assert.equal(stage.manager.rooms.size,0);
 }finally{for(const c of clients)await c.close();await stage.close();await prod.close();}
});
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
