import {createHash,timingSafeEqual} from 'node:crypto';
import {decodeClient,fingerprint,matchesFingerprint} from '../../../../packages/protocol/src/index.js';
import {applyCommand,getStaticState,getPrivateSelfState,getTeacherState,getVisibleState} from '../../../../packages/engine/src/index.js';
import {Peer} from './peer.js';
import {presentationState} from './presentation-state.js';
const digest=s=>createHash('sha256').update(s).digest();
export const secretMatches=(a,b)=>typeof a==='string'&&timingSafeEqual(digest(a),digest(b));
const fail=code=>{throw Error(code);};
export function attachConnection(socket,manager,config,metrics,transport){
 const peer=new Peer(socket,config,metrics,transport);
 const authTimer=setTimeout(()=>{if(!peer.member)peer.close(4001,'AUTH_TIMEOUT');},config.authTimeoutMs);authTimer.unref();
 socket.on('pong',()=>peer.alive=true);
 socket.on('error',()=>{});
 function restore(room,member,eventGap){
  const world=room.world,self=world?getPrivateSelfState(world,member.id,undefined,true):null;
  let snapshot=null;
  if(world&&room.phase==='BATTLE'){
   const teacher=presentationState(world,getTeacherState(world));
   const view=member.role==='host'?teacher:getVisibleState(world,member.id,undefined,teacher);
   const {self:privateRow,...publicView}=view;
   snapshot={...publicView,snapshotSeq:++room.snapshotSeq,serverNow:performance.now()};
  }
  peer.send('FULL_STATE',{room:room.publicState(member),static:world?getStaticState(world):null,self,snapshot,cursor:member.cursor,eventGap});
 }
 function bind(room,member,resume=false,cursor=0){
  if(member.revoked)fail('SESSION_REVOKED');if(peer.member)fail('ALREADY_BOUND');
  if(member.peer&&member.peer!==peer)member.peer.close(4009,'SUPERSEDED');
  member.epoch++;member.connected=true;member.peer=peer;peer.room=room;peer.member=member;peer.epoch=member.epoch;clearTimeout(authTimer);
  if(room.world){const p=room.world.byId.get(member.id);if(p){p.connected=true;room.world.session.players[member.id].connected=true;room.world.session.inputs[member.id]={};room.world.inputPending.delete(member.id);room.world.actionPending.delete(member.id);p.pendingAttack=null;p.pendingSkill=null;}}
  peer.send('SESSION',{token:member.token,playerId:member.id,role:member.role,...fingerprint});
  if(resume){metrics.reconnects++;peer.trimEvents();restore(room,member,!member.events.length||cursor<member.events[0].seq-1);}
  manager.changed(room);
 }
 socket.on('message',(buffer,isBinary)=>{
  let message;
  try{
   if(isBinary)fail('JSON_REQUIRED');if(!peer.rate()){peer.close(4008,'RATE_LIMIT');return;}
   message=decodeClient(buffer.toString('utf8'));const p=message.payload;
   if(message.type==='HELLO'){if(peer.hello)fail('ALREADY_HELLO');if(!matchesFingerprint(p)){peer.send('VERSION_MISMATCH',{expected:fingerprint});peer.close(4002,'VERSION_MISMATCH');return;}peer.hello=true;peer.send('WELCOME',fingerprint);return;}
   if(!peer.hello)fail('HELLO_REQUIRED');
   if(message.type==='PING'){peer.send('PONG',{clientTime:p.clientTime,serverNow:performance.now()});return;}
   if(message.type==='AUTH'){if(!secretMatches(p.secret,config.hostSecret))fail('AUTH_FAILED');peer.hostAuthUntil=Date.now()+300000;peer.send('AUTH_OK',{});return;}
   if(message.type==='CREATE'){if(!(peer.hostAuthUntil>Date.now()))fail('HOST_AUTH_REQUIRED');const r=manager.create(p.name);bind(r,r.host);return;}
   if(message.type==='JOIN'){const r=manager.rooms.get(p.code);if(!r)fail('ROOM_NOT_FOUND');bind(r,r.addMember(p.name));return;}
   if(message.type==='RESUME'){const binding=manager.tokens.get(p.token);if(!binding)fail('ROOM_EXPIRED');bind(binding.room,binding.member,true,p.cursor||0);return;}
   const {room,member}=peer;if(!room||!member)fail('SESSION_REQUIRED');
   if(member.peer!==peer||peer.epoch!==member.epoch)fail('SUPERSEDED');
   if(message.roomInstanceId!==room.id||message.matchId!==room.matchId||message.connectionEpoch!==member.epoch)fail('SCOPE_MISMATCH');
   if(['INPUT_BATCH','ACTION','AUGMENT_CHOOSE','RESPAWN'].includes(message.type)){
    const actor=room.world?.byId.get(member.id);if(room.phase!=='BATTLE'||member.role!=='student'||!actor)fail('BATTLE_REQUIRED');if(message.lifeSeq!==actor.lifeSeq)fail('LIFE_MISMATCH');
   }
   if(message.type==='INPUT_BATCH'){
    for(const c of p.commands)applyCommand(room.world,{...c,type:'INPUT',playerId:member.id,lifeSeq:message.lifeSeq,receivedAt:performance.now()});return;
   }
   if(message.type==='RESYNC'){restore(room,member,true);return;}
   if(message.type==='LEAVE'){member.revoked=true;manager.tokens.delete(member.token);peer.close(1000,'LEFT');return;}
   if(!message.requestId)fail('REQUEST_ID_REQUIRED');
   const key=room.matchId+'|'+message.requestId,signature=JSON.stringify({type:message.type,life:message.lifeSeq,payload:p}),old=member.ledger.get(key);
   if(old){if(old.signature!==signature)fail('REQUEST_ID_REUSED');metrics.duplicates++;peer.send('COMMAND_RESULT',old.result);return;}
   let result;
   try{result=message.type==='ACTION'?applyCommand(room.world,{...p,type:'ACTION',playerId:member.id,lifeSeq:message.lifeSeq}):room.command(member,message.type,p,message.requestId);}
   catch(error){result={accepted:false,reason:error.message};}
   result={...result,requestId:message.requestId,command:message.type};member.ledger.set(key,{signature,result});while(member.ledger.size>512)member.ledger.delete(member.ledger.keys().next().value);
   peer.send('COMMAND_RESULT',result,{reliable:true});
   if(!['ACTION','AUGMENT_CHOOSE','RESPAWN'].includes(message.type))manager.changed(room);else peer.send('PRIVATE_STATE',getPrivateSelfState(room.world,member.id));
  }catch(error){metrics.rejected++;if(message?.requestId)peer.send('COMMAND_RESULT',{requestId:message.requestId,accepted:false,reason:error.message});else peer.send('ERROR',{code:error.message});if(['ROOM_EXPIRED','SESSION_REVOKED'].includes(error.message))peer.close(4004,error.message);else if(!['LIFE_MISMATCH','SCOPE_MISMATCH','BATTLE_REQUIRED'].includes(error.message)&&++peer.errors>=8)peer.close(4007,'INVALID_MESSAGES');}
 });
 socket.on('close',()=>{clearTimeout(authTimer);metrics.closed++;const p=peer.member;if(p?.peer===peer){p.connected=false;p.disconnectedAt=Date.now();p.peer=null;if(peer.room.world?.session.players[p.id])peer.room.world.session.players[p.id].connected=false;manager.changed(peer.room);}peer.queue=[];peer.pendingSnapshot=null;});
 return peer;
}
