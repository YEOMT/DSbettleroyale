import {envelope,PROTOCOL_VERSION} from '../../../../packages/protocol/src/index.js';
import {MAX_EVENT_BATCH,MAX_EVENT_BATCH_BYTES} from '../../../../packages/protocol/src/server-events.js';
import {privateProfileState} from './profile-state.js';
export class Peer{
 constructor(socket,config,metrics,transport){this.socket=socket;this.transport=transport;this.batchDepth=0;this.config=config;this.metrics=metrics;this.queue=[];this.queueBytes=0;this.pendingSnapshot=null;this.highAt=0;this.hello=false;this.tokens=180;this.refillAt=performance.now();this.errors=0;this.alive=true;}
 beginBatch(){this.batchDepth++;}
 endBatch(){if(this.batchDepth)this.batchDepth--;if(!this.batchDepth)this.flush();}
 scope(){return this.room?{roomInstanceId:this.room.id,matchId:this.room.matchId,connectionEpoch:this.member.epoch}:{};}
 selfState(self,options){return privateProfileState(this,self,options);}
 rate(){const now=performance.now();this.tokens=Math.min(180,this.tokens+(now-this.refillAt)*.09);this.refillAt=now;if(this.tokens<1)return false;this.tokens--;return true;}
 send(type,payload,{snapshot=false,reliable=false,payloadJson}={}){
  if(this.socket.readyState!==1)return;
  const message=envelope(type,payload,this.scope());
  if(reliable&&this.member)message.eventSeq=++this.member.cursor;
  const data=payloadJson===undefined?JSON.stringify(message):JSON.stringify({...message,payload:undefined}).slice(0,-1)+',"payload":'+payloadJson+'}';
  if(reliable&&this.member){const now=Date.now();this.member.events.push({seq:message.eventSeq,at:now,data});this.member.eventBytes+=Buffer.byteLength(data);this.trimEvents(now);}
  if(snapshot){if(this.pendingSnapshot)this.metrics.replacedSnapshots++;this.pendingSnapshot=data;}
  else {this.queue.push(data);this.queueBytes+=Buffer.byteLength(data);if(this.queue.length>2048||this.queueBytes>1048576){this.close(4008,'SLOW_RECEIVER_RESYNC');return;}}
  this.flush();
 }
 trimEvents(now=Date.now()){const p=this.member;if(!p)return;while(p.events.length&&(p.events.length>2048||p.eventBytes>1048576||now-p.events[0].at>10000)){const e=p.events.shift();p.eventBytes-=Buffer.byteLength(e.data);}}
 snapshot(data,announcementSeq=0){if(this.socket.readyState!==1)return;if(this.pendingSnapshot)this.metrics.replacedSnapshots++;this.pendingSnapshot=data;this.pendingAnnouncementSeq=announcementSeq;this.flush();}
 flush(){
  if(this.batchDepth)return;
  const ws=this.socket;if(ws.readyState!==1)return;const bytes=ws.bufferedAmount;this.metrics.bufferHighWatermark=Math.max(this.metrics.bufferHighWatermark,bytes);
  if(bytes>=this.config.bufferWarn){this.highAt||=Date.now();if(bytes>=this.config.bufferHard&&Date.now()-this.highAt>this.config.bufferTimeoutMs)this.close(4008,'SLOW_RECEIVER_RESYNC');return;}
  this.highAt=0;
  if(!this.queue.length&&!this.pendingSnapshot)return;
  // Coalesce writes made in this pump without waiting for another tick. Node's
  // public transport API is supplied by the upgrade request, not ws internals.
  this.transport?.cork();try{
   while(this.queue.length&&ws.bufferedAmount<this.config.bufferWarn){
    let raw=this.queue.shift(),bytes=Buffer.byteLength(raw);this.queueBytes-=bytes;
    // Consecutive events from this pump share one WS message. No timer, no
    // dropped event and no changed cursor; replay can still send single events.
    if(raw.startsWith('{"type":"EVENT",')){
     const messages=[raw];while(messages.length<MAX_EVENT_BATCH&&this.queue[0]?.startsWith('{"type":"EVENT",')){
      const next=this.queue[0],size=Buffer.byteLength(next);if(bytes+size+messages.length+128>MAX_EVENT_BATCH_BYTES)break;
      messages.push(this.queue.shift());bytes+=size;this.queueBytes-=size;
     }
     if(messages.length>1)raw='{"type":"EVENT_BATCH","protocolVersion":'+PROTOCOL_VERSION+',"payload":{"messages":['+messages.join(',')+']}}';
    }
    const data=Buffer.from(raw);ws.send(data,{binary:false,compress:false});this.metrics.sentBytes+=data.length;
   }
   if(!this.queue.length&&this.pendingSnapshot&&ws.bufferedAmount<this.config.bufferWarn){const data=Buffer.isBuffer(this.pendingSnapshot)?this.pendingSnapshot:Buffer.from(this.pendingSnapshot);this.pendingSnapshot=null;ws.send(data,{binary:false,compress:false});this.metrics.sentBytes+=data.length;this.deliveredAnnouncement=this.pendingAnnouncementSeq||0;}
  }finally{this.transport?.uncork();}
 }
 resetMatch(){this.pendingSnapshot=null;this.deliveredAnnouncement=this.pendingAnnouncementSeq=0;this.profileState=null;this.queue=[];this.queueBytes=0;if(this.socket.bufferedAmount<this.config.bufferWarn)this.highAt=0;}
 close(code,reason){if(this.socket.readyState<2)this.socket.close(code,reason);this.pendingSnapshot=null;this.profileState=null;this.queue=[];this.queueBytes=0;}
}
