import {envelope} from '../../../../packages/protocol/src/index.js';
export class Peer{
 constructor(socket,config,metrics){this.socket=socket;this.config=config;this.metrics=metrics;this.queue=[];this.queueBytes=0;this.pendingSnapshot=null;this.highAt=0;this.hello=false;this.tokens=180;this.refillAt=performance.now();this.errors=0;this.alive=true;}
 scope(){return this.room?{roomInstanceId:this.room.id,matchId:this.room.matchId,connectionEpoch:this.member.epoch}:{};}
 rate(){const now=performance.now();this.tokens=Math.min(180,this.tokens+(now-this.refillAt)*.09);this.refillAt=now;if(this.tokens<1)return false;this.tokens--;return true;}
 send(type,payload,{snapshot=false,reliable=false}={}){
  if(this.socket.readyState!==1)return;
  const message=envelope(type,payload,this.scope());
  if(reliable&&this.member){message.eventSeq=++this.member.cursor;const data=JSON.stringify(message),now=Date.now();this.member.events.push({seq:message.eventSeq,at:now,data});this.member.eventBytes+=Buffer.byteLength(data);this.trimEvents(now);}
  const data=JSON.stringify(message);
  if(snapshot){if(this.pendingSnapshot)this.metrics.replacedSnapshots++;this.pendingSnapshot=data;}
  else {this.queue.push(data);this.queueBytes+=Buffer.byteLength(data);if(this.queue.length>2048||this.queueBytes>1048576){this.close(4008,'SLOW_RECEIVER_RESYNC');return;}}
  this.flush();
 }
 trimEvents(now=Date.now()){const p=this.member;if(!p)return;while(p.events.length&&(p.events.length>2048||p.eventBytes>1048576||now-p.events[0].at>10000)){const e=p.events.shift();p.eventBytes-=Buffer.byteLength(e.data);}}
 snapshot(data){if(this.socket.readyState!==1)return;if(this.pendingSnapshot)this.metrics.replacedSnapshots++;this.pendingSnapshot=data;this.flush();}
 flush(){
  const ws=this.socket;if(ws.readyState!==1)return;const bytes=ws.bufferedAmount;this.metrics.bufferHighWatermark=Math.max(this.metrics.bufferHighWatermark,bytes);
  if(bytes>=this.config.bufferWarn){this.highAt||=Date.now();if(bytes>=this.config.bufferHard&&Date.now()-this.highAt>this.config.bufferTimeoutMs)this.close(4008,'SLOW_RECEIVER_RESYNC');return;}
  this.highAt=0;
  while(this.queue.length&&ws.bufferedAmount<this.config.bufferWarn){const data=this.queue.shift();this.queueBytes-=Buffer.byteLength(data);ws.send(data);this.metrics.sentBytes+=Buffer.byteLength(data);}
  if(!this.queue.length&&this.pendingSnapshot&&ws.bufferedAmount<this.config.bufferWarn){const data=this.pendingSnapshot;this.pendingSnapshot=null;ws.send(data);this.metrics.sentBytes+=Buffer.byteLength(data);}
 }
 close(code,reason){if(this.socket.readyState<2)this.socket.close(code,reason);this.pendingSnapshot=null;this.queue=[];this.queueBytes=0;}
}
