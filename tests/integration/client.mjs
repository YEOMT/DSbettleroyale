import WebSocket from 'ws';
import {randomUUID} from 'node:crypto';
import {fingerprint,envelope} from '../../packages/protocol/src/index.js';
import {eventBatchMessages} from '../../packages/protocol/src/server-events.js';
export class TestClient{
 constructor(url,options={}){this.ws=new WebSocket(url,{origin:'http://localhost:5173',...options});this.messages=[];this.waiters=[];this.scope={};this.lifeSeq=0;
  this.ws.on('message',raw=>{this.receivedBytes=(this.receivedBytes||0)+raw.length;const parseAt=performance.now(),message=JSON.parse(raw);this.parseMs=(this.parseMs||0)+performance.now()-parseAt;this.parsedFrames=(this.parsedFrames||0)+1;for(const m of eventBatchMessages(message)||[message]){if(m.roomInstanceId)this.scope={roomInstanceId:m.roomInstanceId,matchId:m.matchId,connectionEpoch:m.connectionEpoch};if(m.type==='SESSION')this.session=m.payload;if(m.type==='ROOM_STATE'){this.room=m.payload;this.messages=this.messages.filter(old=>old.type!=='ROOM_STATE');}if(m.type==='SNAPSHOT'){this.snapshot=m.payload;this.lifeSeq=m.payload.self?.lifeSeq??this.lifeSeq;}if(m.type==='FULL_STATE')this.room=m.payload.room;
   const i=this.waiters.findIndex(w=>w.predicate(m));if(i>=0){const w=this.waiters.splice(i,1)[0];clearTimeout(w.timer);w.resolve(m);}else{this.messages.push(m);if(this.messages.length>2000)this.messages.shift();}this.onMessage?.(m);}});
 }
 async open(version=fingerprint){await new Promise((resolve,reject)=>{this.ws.once('open',resolve);this.ws.once('error',reject);});this.send('HELLO',version,false);await this.next('WELCOME');return this;}
 send(type,payload={},scoped=true,requestId){this.ws.send(JSON.stringify(envelope(type,payload,{...(scoped?this.scope:{}),...(scoped?{lifeSeq:this.lifeSeq}:{}),...(requestId?{requestId}:{})})));}
 next(type,predicate=()=>true,timeout=5000){const accept=m=>m.type===type&&predicate(m.payload,m);const i=this.messages.findIndex(accept);if(i>=0)return Promise.resolve(this.messages.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={predicate:accept,resolve};w.timer=setTimeout(()=>{this.waiters=this.waiters.filter(x=>x!==w);reject(Error('TIMEOUT '+type));},timeout);this.waiters.push(w);});}
 async command(type,payload={},requestId=randomUUID()){this.send(type,payload,true,requestId);const m=await this.next('COMMAND_RESULT',p=>p.requestId===requestId);return m.payload;}
 async host(){this.send('AUTH',{secret:'test-host'},false);await this.next('AUTH_OK');this.send('CREATE',{name:'Teacher'},false);await this.next('SESSION');await this.next('ROOM_STATE');return this;}
 async join(code,name){this.send('JOIN',{code,name},false);await this.next('SESSION');await this.next('ROOM_STATE');return this;}
 async phase(phase){if(this.room?.phase===phase)return this.room;return (await this.next('ROOM_STATE',r=>r.phase===phase)).payload;}
 async close(){if(this.ws.readyState>=2)return;await new Promise(resolve=>{this.ws.once('close',resolve);this.ws.close();});}
}
export async function connect(app,options){return new TestClient(`ws://127.0.0.1:${app.address.port}/ws`,options).open();}

