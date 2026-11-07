import {fingerprint,envelope} from '../../../../packages/protocol/src/index.js';
import {requestId} from './request-id.js';
import {eventBatchMessages} from '../../../../packages/protocol/src/server-events.js';
import {ProfileCache} from './profile-cache.js';
export class Connection extends EventTarget{
 constructor(url){super();this.url=url;this.scope={};this.pending=new Map();this.profiles=new ProfileCache();this.profilesReady=true;this.profileRecoveryAt=-Infinity;this.lifeSeq=0;this.cursor=0;this.token=sessionStorage.getItem('dsbr-resume');this.retry=0;this.stopped=false;this.clock={rtt:0,offset:0,uncertainty:0};}
 emit(type,data){this.dispatchEvent(new CustomEvent(type,{detail:data}));}
 combatPause(paused){this.paused=!!paused;if(paused)for(const [id,p]of this.pending)if(p.type==='ACTION'){clearTimeout(p.timer);this.pending.delete(id);p.reject(Error('SAFE_PAUSED'));}}
 profileReady(ready){if(!ready)for(const [id,p]of this.pending)if(p.type==='ACTION'){clearTimeout(p.timer);this.pending.delete(id);p.reject(Error('PROFILE_RECOVERY'));}if(this.profilesReady!==ready){this.profilesReady=ready;this.emit('profile_status',{ready});}}
 missingProfile(){this.profileReady(false);const now=performance.now();if(now-this.profileRecoveryAt>=2000){this.profileRecoveryAt=now;this.send('RESYNC',{});}}
 reconnect(){this.retryStart=null;this.retry=0;return this.connect();}
 async connect(){
  if(this.connecting)return this.connecting;if(this.ws?.readyState===WebSocket.OPEN)return;clearTimeout(this.retryTimer);
  this.stopped=false;this.ws=new WebSocket(this.url);const ws=this.ws;
  let resolveConnect,rejectConnect;this.connecting=new Promise((resolve,reject)=>{resolveConnect=resolve;rejectConnect=reject;});
  const timeout=setTimeout(()=>{rejectConnect(Error('서버 연결 시간이 초과되었습니다.'));ws.close();},8000);
  ws.onopen=()=>ws.send(JSON.stringify(envelope('HELLO',fingerprint)));
  ws.onmessage=e=>{if(this.ws!==ws)return;const m=JSON.parse(e.data);this.receive(m);if((m.type==='FULL_STATE'||m.type==='WELCOME')&&!this.restoring){clearTimeout(timeout);resolveConnect();this.connecting=null;}};
  ws.onerror=()=>rejectConnect(Error('서버에 연결할 수 없습니다.'));
  ws.onclose=e=>{if(this.ws!==ws)return;clearInterval(this.pingTimer);this.restoring=!!this.token;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('연결이 끊겼습니다.'));}this.pending.clear();this.emit('status',{connected:false,reason:e.reason});
   clearTimeout(timeout);rejectConnect(Error('연결이 종료되었습니다.'));this.connecting=null;
   if([4002,4003,4004,4009].includes(e.code)||this.stopped){this.stopped=true;if([4002,4003,4004,4009].includes(e.code)||e.reason==='LEFT'){this.token=null;sessionStorage.removeItem('dsbr-resume');}this.emit('ended',e.reason);return;}
   this.retryStart??=performance.now();if(performance.now()-this.retryStart>60000){this.stopped=true;this.emit('ended','재연결 시간이 초과되었습니다. 다시 참가해 주세요.');return;}
   clearTimeout(this.retryTimer);this.retryTimer=setTimeout(()=>{if(!this.stopped)this.connect().catch(()=>this.emit('status',{connected:false}));},Math.min(8000,400*2**this.retry++)*(.75+Math.random()*.5));
  };
  return this.connecting;
 }
 receive(m){
  const batch=eventBatchMessages(m);if(batch){for(const event of batch)this.receive(event);return;}
  if(m.type==='VERSION_MISMATCH'){this.stopped=true;this.emit('ended','게임 버전이 바뀌었습니다. 새로고침 후 참가하세요.');return;}
  if(m.type==='WELCOME'){this.emit('welcome',m.payload);this.restoring=!!this.token;if(!this.restoring){this.retry=0;this.retryStart=null;this.emit('status',{connected:true});}if(this.token)this.send('RESUME',{token:this.token,cursor:this.cursor},false);this.pingTimer=setInterval(()=>this.send('PING',{clientTime:performance.now()},false),2000);return;}
  if(m.roomInstanceId){if(this.scope.roomInstanceId&&m.roomInstanceId!==this.scope.roomInstanceId&&m.type!=='SESSION')return;
   if(this.scope.connectionEpoch&&m.connectionEpoch<this.scope.connectionEpoch)return;
   // REMATCH's successful reply carries the new match scope. Accept only the
   // reply to our own outstanding transition; unrelated late replies stay rejected.
   const pendingTransition=m.type==='COMMAND_RESULT'&&m.payload?.accepted&&m.payload.command==='REMATCH'&&this.pending.get(m.payload.requestId);
   const rematchAck=pendingTransition&&pendingTransition.type==='REMATCH'&&pendingTransition.matchId===this.scope.matchId;
   if(this.scope.matchId&&this.scope.matchId!==m.matchId&&!['ROOM_STATE','SESSION','FULL_STATE'].includes(m.type)&&!rematchAck)return;
   if(this.scope.matchId!==m.matchId)this.emit('reset',{});this.scope={roomInstanceId:m.roomInstanceId,matchId:m.matchId,connectionEpoch:m.connectionEpoch};}
  if(m.eventSeq){if(m.eventSeq<=this.cursor)return;this.cursor=m.eventSeq;}
  if(m.type==='SESSION'){this.profiles.clear();this.profileRecoveryAt=-Infinity;this.profileReady(m.payload.role==='host');this.token=m.payload.token;this.session=m.payload;sessionStorage.setItem('dsbr-resume',this.token);}
  if(m.type==='OVERLOAD'&&m.payload.paused)this.combatPause(true);
  if(m.type==='ERROR'&&m.payload.code==='SIMULATION_PAUSED')this.combatPause(true);
  if(m.type==='ROOM_STATE'&&(m.payload.safePaused||m.payload.simulationFault||m.payload.phase!=='BATTLE'))this.combatPause(m.payload.safePaused||m.payload.simulationFault);
  if(m.type==='FULL_STATE')this.combatPause(m.payload.room?.safePaused||m.payload.room?.simulationFault);
  if(m.type==='PROFILE_STATE'){if(!this.profiles.accept(this.scope,m.payload,this.session?.playerId))this.missingProfile();return;}
  if(['SNAPSHOT','PRIVATE_STATE','FULL_STATE'].includes(m.type)){
   const self=m.type==='PRIVATE_STATE'?m.payload:m.payload.self;
   if(self){const hydrated=this.profiles.hydrate(this.scope,self,this.session?.playerId);if(!hydrated){this.missingProfile();return;}
    m={...m,payload:m.type==='PRIVATE_STATE'?hydrated:{...m.payload,self:hydrated}};this.profileReady(true);}
  }
  if(m.type==='SNAPSHOT'||m.type==='PRIVATE_STATE')this.lifeSeq=(m.payload.self||m.payload)?.lifeSeq??this.lifeSeq;
  if(m.type==='FULL_STATE'){const full=m.payload;
   if(!full.room?.self||full.room.self.id!==this.session?.playerId||full.room.phase==='BATTLE'&&(!full.static||!full.snapshot||full.room.self.role==='student'&&(!full.self?.inputFloor||full.self.id!==this.session.playerId))){
    this.restoring=true;this.ws?.close(4007,'INCOMPLETE_RECOVERY_STATE');return;
   }
   this.cursor=m.payload.cursor;this.lifeSeq=m.payload.self?.lifeSeq||0;this.emit('reset',{});}
  if(m.type==='PONG'){const now=performance.now(),rtt=now-m.payload.clientTime,offset=m.payload.serverNow-(now-rtt/2);this.clock={rtt,offset:this.clock.rtt?this.clock.offset*.85+offset*.15:offset,uncertainty:rtt/2};}
  if(m.type==='COMMAND_RESULT'){const pending=this.pending.get(m.payload.requestId);if(pending){clearTimeout(pending.timer);this.pending.delete(m.payload.requestId);m.payload.accepted?pending.resolve(m.payload):pending.reject(Error(m.payload.reason||'요청을 처리하지 못했습니다.'));}}
  if(m.type==='AUTH_OK'){this.emit('auth',{});return;}
  this.emit(m.type.toLowerCase(),m.payload);if(m.type==='FULL_STATE'){this.restoring=false;this.retry=0;this.retryStart=null;this.emit('status',{connected:true});}
 }
 send(type,payload={},scoped=true,requestId){if((this.paused||this.profilesReady===false)&&['INPUT_BATCH','ACTION'].includes(type))return false;if(this.ws?.readyState!==WebSocket.OPEN)return false;this.ws.send(JSON.stringify(envelope(type,payload,{...(scoped?{...this.scope,lifeSeq:this.lifeSeq}:{}),...(requestId?{requestId}:{})})));return true;}
 command(type,payload={}){
  if(type==='ACTION'&&this.paused)return Promise.reject(Error('SAFE_PAUSED'));
  if(type==='ACTION'&&this.profilesReady===false)return Promise.reject(Error('PROFILE_RECOVERY'));
  if(this.restoring)return Promise.reject(Error('경기 상태를 복원하는 중입니다.'));
  const id=requestId(),scope={...this.scope,lifeSeq:this.lifeSeq};return new Promise((resolve,reject)=>{
   const p={resolve,reject,retries:0,type,matchId:scope.matchId};const attempt=()=>{if(p.retries++>=3||scope.connectionEpoch!==this.scope.connectionEpoch||scope.matchId!==this.scope.matchId||scope.lifeSeq!==this.lifeSeq){this.pending.delete(id);reject(Error('응답을 확인할 수 없습니다. 현재 상태를 확인하세요.'));return;}if(this.ws?.readyState===1)this.ws.send(JSON.stringify(envelope(type,payload,{...scope,connectionEpoch:this.scope.connectionEpoch,requestId:id})));p.timer=setTimeout(attempt,1500);};this.pending.set(id,p);attempt();
  });
 }
 async authenticate(secret){this.send('AUTH',{secret},false);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('교사 인증을 확인해 주세요.')),5000);this.addEventListener('auth',()=>{clearTimeout(timer);resolve();},{once:true});});}
 leave(){this.send('LEAVE',{});this.stopped=true;this.token=null;sessionStorage.removeItem('dsbr-resume');this.ws?.close(1000,'LEFT');}
}
