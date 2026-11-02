import {fingerprint,envelope} from '../../../../packages/protocol/src/index.js';
export class Connection extends EventTarget{
 constructor(url){super();this.url=url;this.scope={};this.pending=new Map();this.lifeSeq=0;this.cursor=0;this.token=sessionStorage.getItem('dsbr-resume');this.retry=0;this.stopped=false;this.clock={rtt:0,offset:0,uncertainty:0};}
 emit(type,data){this.dispatchEvent(new CustomEvent(type,{detail:data}));}
 async connect(){
  this.stopped=false;this.ws=new WebSocket(this.url);const ws=this.ws;
  await new Promise((resolve,reject)=>{ws.onopen=()=>{ws.send(JSON.stringify(envelope('HELLO',fingerprint)));resolve();};ws.onerror=()=>reject(Error('서버에 연결할 수 없습니다.'));});
  ws.onmessage=e=>this.receive(JSON.parse(e.data));
  ws.onclose=e=>{clearInterval(this.pingTimer);if(this.ws!==ws)return;this.emit('status',{connected:false,reason:e.reason});
   if([4002,4003,4004,4009,1000].includes(e.code)||this.stopped){this.stopped=true;if([4003,4004,1000].includes(e.code)){this.token=null;sessionStorage.removeItem('dsbr-resume');}this.emit('ended',e.reason);return;}
   this.retryStart??=performance.now();if(performance.now()-this.retryStart>60000){this.stopped=true;this.emit('ended','재연결 시간이 초과되었습니다. 다시 참가해 주세요.');return;}
   setTimeout(()=>{if(!this.stopped)this.connect().catch(()=>this.emit('status',{connected:false}));},Math.min(8000,400*2**this.retry++)*(.75+Math.random()*.5));
  };
  return new Promise(resolve=>this.addEventListener('welcome',()=>resolve(),{once:true}));
 }
 receive(m){
  if(m.type==='VERSION_MISMATCH'){this.stopped=true;this.emit('ended','게임 버전이 바뀌었습니다. 새로고침 후 참가하세요.');return;}
  if(m.type==='WELCOME'){this.emit('welcome',m.payload);this.retry=0;this.retryStart=null;this.emit('status',{connected:true});if(this.token)this.send('RESUME',{token:this.token,cursor:this.cursor},false);this.pingTimer=setInterval(()=>this.send('PING',{clientTime:performance.now()},false),2000);return;}
  if(m.roomInstanceId){if(this.scope.roomInstanceId&&m.roomInstanceId!==this.scope.roomInstanceId&&m.type!=='SESSION')return;
   if(this.scope.connectionEpoch&&m.connectionEpoch<this.scope.connectionEpoch)return;
   if(this.scope.matchId&&this.scope.matchId!==m.matchId&&!['ROOM_STATE','SESSION','FULL_STATE'].includes(m.type))return;
   if(this.scope.matchId!==m.matchId)this.emit('reset',{});this.scope={roomInstanceId:m.roomInstanceId,matchId:m.matchId,connectionEpoch:m.connectionEpoch};}
  if(m.eventSeq){if(m.eventSeq<=this.cursor)return;this.cursor=m.eventSeq;}
  if(m.type==='SESSION'){this.token=m.payload.token;this.session=m.payload;sessionStorage.setItem('dsbr-resume',this.token);}
  if(m.type==='SNAPSHOT'||m.type==='PRIVATE_STATE')this.lifeSeq=(m.payload.self||m.payload)?.lifeSeq??this.lifeSeq;
  if(m.type==='FULL_STATE'){this.cursor=m.payload.cursor;this.lifeSeq=m.payload.self?.lifeSeq||0;this.emit('reset',{});}
  if(m.type==='PONG'){const now=performance.now(),rtt=now-m.payload.clientTime,offset=m.payload.serverNow-(now-rtt/2);this.clock={rtt,offset:this.clock.rtt?this.clock.offset*.85+offset*.15:offset,uncertainty:rtt/2};}
  if(m.type==='COMMAND_RESULT'){const pending=this.pending.get(m.payload.requestId);if(pending){clearTimeout(pending.timer);this.pending.delete(m.payload.requestId);m.payload.accepted?pending.resolve(m.payload):pending.reject(Error(m.payload.reason||'요청을 처리하지 못했습니다.'));}}
  if(m.type==='AUTH_OK'){this.emit('auth',{});return;}
  this.emit(m.type.toLowerCase(),m.payload);
 }
 send(type,payload={},scoped=true,requestId){if(this.ws?.readyState!==WebSocket.OPEN)return false;this.ws.send(JSON.stringify(envelope(type,payload,{...(scoped?{...this.scope,lifeSeq:this.lifeSeq}:{}),...(requestId?{requestId}:{})})));return true;}
 command(type,payload={}){
  const id=crypto.randomUUID();return new Promise((resolve,reject)=>{
   const p={resolve,reject,retries:0};const attempt=()=>{if(p.retries++>=3){this.pending.delete(id);reject(Error('응답을 확인할 수 없습니다. 연결 복구 후 상태를 확인하세요.'));return;}this.send(type,payload,true,id);p.timer=setTimeout(attempt,1500);};this.pending.set(id,p);attempt();
  });
 }
 async authenticate(secret){this.send('AUTH',{secret},false);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('교사 인증을 확인해 주세요.')),5000);this.addEventListener('auth',()=>{clearTimeout(timer);resolve();},{once:true});});}
 leave(){this.send('LEAVE',{});this.stopped=true;this.token=null;sessionStorage.removeItem('dsbr-resume');this.ws?.close(1000,'LEFT');}
}
