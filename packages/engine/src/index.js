import {installRules} from './registry.js';
import {manifest,contentHash} from '../../content/src/manifest.js';
export {contentHash};
export const FIXED_DT_MS=1000/60;
export const ENGINE_REVISION='v33-authority-1';

export function createRuleContext({mode='solo',teamCount=2,matchSeconds=360,seed='1',matchId='local:1',eventSink=()=>{},quizBank=manifest.questions}={}){
 const room={matchId,timeMs:0,idSequence:0,events:[],disposed:false,now(){return this.timeMs;},random:null,
  trace(type,data){eventSink({type:'TRACE',name:type,serverTick:this.game?.frame||0,data});},
  finish(winner,options){this.finished=true;this.finishOptions=options;},
  session:{active:true,role:'host',backend:'authority',inputs:{},players:{},roomCode:matchId,
   roomMeta:{mode:mode==='team'?'team-elim':mode,teamCount,matchSeconds,seed,matchRound:1,battleStartedAt:0,quizBank},
   isRespawnMode(){return ['team-capture','team-respawn'].includes(this.roomMeta.mode);},
   playerConnected:p=>p?.connected!==false}};
 installRules(room);
 room.random=room.brHashRandom(seed+'|draft');
 room.session.respawnMode=room.session.isRespawnMode();
 room.teamMode=mode==='solo'?0:teamCount;
 room.seedRandom(seed+'|combat');
 room.session.finishMatch=(winner,options)=>room.finish(winner,options);
 room.session.onParticipantDeath=p=>room.brTeamKillDeath(p);
 room.session.recordKill=(a,p,g)=>room.brTKRecordKill(a,p,g);
 return room;
}
export function createWorld(content=manifest,config={},seed='1',initialPlayers=[],eventSink=()=>{}){
 if(content!==manifest&&JSON.stringify(content)!==JSON.stringify(manifest))throw Error('CONTENT_MISMATCH');
 const room=createRuleContext({...config,seed,eventSink});
 const players=initialPlayers.map((entry,i)=>{
  const index=room.EMOJI_DB.findIndex(a=>a.id===entry.abilityId);if(index<0)throw Error('INVALID_ABILITY');
  const p=new room.Participant(i+1,entry.name,room.EMOJI_DB[index],new room.Vec2(0,0),entry.team||0);
  Object.assign(p,{remoteId:entry.id,sessionId:entry.id,abilityIndex:index,abilityId:entry.abilityId,rosterVersion:room.BR_ROSTER_VERSION,
   connected:true,lastAimDir:new room.Vec2(1,0),basicCooldown:0,skillUsesLeft:-1,maxSkillUses:-1,
   basicCooldownMax:room.brBasicAttackFrames(p.ability),lifeSeq:0});
  p.applyPlayerInput=room.brApplyPlayerInput;
  if(room.session.respawnMode)room.brTeamKillInit(p,entry);
  room.session.players[p.remoteId]={connected:true,team:p.team,sessionId:p.sessionId};
  return p;
 });
 room.game=new room.GameWorld(players);
 room.brRingInitWorld(room.game,0);
 room.byId=new Map(players.map(p=>[p.remoteId,p]));
 room.inputPending=new Map();room.actionPending=new Map();room.lastInputAt=new Map();room.eventSink=eventSink;
 room.shotIds=new Map();room.eventSequence=0;
 const originalFx=room.game.emitStudentFx.bind(room.game);
 room.game.emitStudentFx=(type,pos,data={})=>{originalFx(type,pos,data);emit(room,'FX',{kind:type,x:pos.x,y:pos.y,...data});};
 return room;
}
function emit(world,type,data){world.eventSink({type,eventId:world.matchId+':'+(++world.eventSequence),serverTick:world.game.frame,data});}
export function applyCommand(world,command){
 const p=world.byId.get(command.playerId);if(!p||command.lifeSeq!==p.lifeSeq)return {accepted:false,reason:'LIFE_MISMATCH'};
 if(command.type==='INPUT'){
  if(command.seq<=(p.lastReceivedSeq||0))return {accepted:false,reason:'OLD_INPUT'};
  if(world.inputPending.has(p.remoteId))p.replacedInputSeq=world.inputPending.get(p.remoteId).seq;
  p.lastReceivedSeq=command.seq;world.inputPending.set(p.remoteId,command);world.lastInputAt.set(p.remoteId,world.timeMs);
  return {accepted:true};
 }
 if(command.type==='ACTION'){
  const list=world.actionPending.get(p.remoteId)||[];if(list.length>=8)return {accepted:false,reason:'ACTION_QUEUE_FULL'};
  list.push(command);world.actionPending.set(p.remoteId,list);return {accepted:true};
 }
 if(command.type==='AUGMENT_CHOOSE')return {accepted:world.brChooseRun(p,command.offerId,command.augmentId)};
 if(command.type==='RESPAWN'){
  world.brTeamKillProcessInput(p,{sessionId:p.sessionId,tkRequest:{...command,matchKey:world.matchId,kind:command.kind,id:command.requestId}});
  return p.tkQuiz?.ack||{accepted:false};
 }
 return {accepted:false,reason:'UNKNOWN_COMMAND'};
}
function projectileStates(world){
 const g=world.game;
 const native=g.projectiles.filter(p=>p.life>0).map(p=>({id:p.visualShotId||'native:'+p.farmBornFrame+':'+p.owner?.remoteId+':'+p.visualShotOrdinal,
  owner:p.owner?.remoteId,life:p.owner?.lifeSeq||0,actionSeq:p.actionSeq||p.visualActionSeq||0,ordinal:p.ordinal||p.visualShotOrdinal||0,
  kind:'projectile',type:p.type,x:p.pos.x,y:p.pos.y,dx:p.vel?.x||0,dy:p.vel?.y||0,radius:p.radius||p.size||8,
  emoji:p.emoji||p.projEmoji||p.owner?.ability?.e,remaining:p.life,team:p.owner?.team||0,path:p.flightPath||[],native:true}));
 return native.concat(world.BRRework.wireEntities(g));
}
export function stepWorld(world,dt=FIXED_DT_MS){
 if(world.disposed)throw Error('WORLD_DESTROYED');if(Math.abs(dt-FIXED_DT_MS)>1e-8)throw Error('FIXED_STEP_REQUIRED');
 if(world.finished||world.game.paused)return;
 world.timeMs+=dt;
 for(const p of world.game.participants){
  const input=world.inputPending.get(p.remoteId),prior=world.session.inputs[p.remoteId]||{};
  if(input){
   Object.assign(prior,{dx:input.move.x,dy:input.move.y,ax:input.aim.x,ay:input.aim.y,ap:input.aimPower??1,seq:input.seq,clientTick:input.clientTick,
    matchKey:world.matchId,life:p.lifeSeq,sessionId:p.sessionId,_receivedAt:world.timeMs});
   p.lastAppliedSeq=input.seq;p.lastAppliedClientTick=input.clientTick;p.inputAppliedAt=world.game.frame+1;p.heldTicks=0;
   world.inputPending.delete(p.remoteId);
  }else p.heldTicks=(p.heldTicks||0)+1;
  if(world.timeMs-(world.lastInputAt.get(p.remoteId)??-Infinity)>=250){prior.dx=0;prior.dy=0;prior._receivedAt=-Infinity;p.inputNeutral=true;}else p.inputNeutral=false;
  const action=world.actionPending.get(p.remoteId)?.shift();
  if(action&&action.lifeSeq===p.lifeSeq&&p.alive){
   const kind=action.kind,seq=action.seq;
   prior.matchKey=world.matchId;prior.life=p.lifeSeq;prior.sessionId=p.sessionId;prior._receivedAt=world.timeMs;
   prior[kind+'Seq']=seq;prior[kind]={seq,life:p.lifeSeq,kind:action.castId?'recast':'cast',castId:action.castId||'',ax:action.aim.x,ay:action.aim.y,ap:action.aimPower??1};
  }
  world.session.inputs[p.remoteId]=prior;
 }
 world.game.update();
 if(world.game.participants.some(p=>p.runtimeFaults))throw Error('COMBAT_RUNTIME_FAULT');
 for(const p of world.game.participants){
  if(!p.alive&&!p.deathHandled){p.deathHandled=true;emit(world,'DEATH',{playerId:p.remoteId,lifeSeq:p.lifeSeq,cause:p.lastDeathCause});if(world.session.respawnMode)world.brTeamKillDeath(p);}
  if(p.alive)p.deathHandled=false;
 }
 const shots=projectileStates(world),next=new Map();
 for(const shot of shots){next.set(shot.id,shot);if(!world.shotIds.has(shot.id))emit(world,'SHOT_SPAWN',shot);}
 for(const [id,shot]of world.shotIds)if(!next.has(id))emit(world,'SHOT_END',{...shot,id,reason:'terminal'});
 world.shotIds=next;
 if(world.game.capture?.finalized)world.finished=true;
 if(world.game.isGameOver)world.finished=true;
}
function actor(world,p){return {id:p.remoteId,name:p.name,abilityId:p.ability.id,emoji:p.ability.e,tier:p.ability.t,team:p.team,
 x:p.pos.x,y:p.pos.y,vx:p.vel.x,vy:p.vel.y,radius:p.radius,hp:Math.max(0,p.hp),maxHp:p.maxHp,alive:p.alive,level:p.run?.level||1,
 lifeSeq:p.lifeSeq,warpSeq:p.warpSeq||0,kills:p.kills||0,deaths:p.deaths||0,stunned:p.stunned||0,
 cooldown:p.cooldown,basicCooldown:p.basicCooldown||0,skillCooldownMax:p.skillCooldownMax||p.maxCooldown,basicCooldownMax:p.basicCooldownMax,
 moveSpeed:world.brHumanMoveSpeed(p),rw:world.BRRework.wirePlayer(p,world.game),row:world.brWirePlayer(p)};}
export function getPrivateSelfState(world,id){
 const p=world.byId.get(id);if(!p)return null;
 return {...actor(world,p),run:world.brRunSnapshot(p),respawn:world.session.respawnMode?world.brTeamKillSelf(p):null,
  lastAppliedSeq:p.lastAppliedSeq||0,lastAppliedClientTick:p.lastAppliedClientTick||0,inputAppliedAt:p.inputAppliedAt||0,
  heldTicks:p.heldTicks||0,replacedInputSeq:p.replacedInputSeq||0,inputNeutral:!!p.inputNeutral,
  actions:{attack:p.resolvedAttackSeq||0,skill:p.resolvedSkillSeq||0,firedAttack:p.firedAttackSeq||0,firedSkill:p.firedSkillSeq||0}};
}
export function getStaticState(world){const g=world.game;return {revision:1,worldRadius:g.worldRadius,mapRadius:g.mapRadius,mapName:g.mapName,
 boundary:g.boundary||null,walls:g.walls.map(w=>({x:w.pos?.x??w.x,y:w.pos?.y??w.y,w:w.w??w.width,h:w.h??w.height,angle:w.angle||0,kind:w.kind||'wall'})),
 smokes:g.smokes.map(s=>({x:s.pos.x,y:s.pos.y,radius:s.radius})),captureMap:g.capture?.map||null};}
function state(world,players,shots){const g=world.game;return {serverTick:g.frame,simTime:world.timeMs,actors:players.map(p=>actor(world,p)),shots,
 ring:g.ringGeometry,capture:g.capture?world.brCapturePacket(g):null,farm:world.brFarm.snapshot(g),
 zones:g.zones.map(z=>({x:z.pos.x,y:z.pos.y,radius:z.radius,type:z.type,color:z.color,duration:z.duration})),finished:!!world.finished};}
export function getTeacherState(world){return state(world,world.game.participants,projectileStates(world));}
export function getVisibleState(world,id,interest={width:1280,height:720}){
 const p=world.byId.get(id);if(!p)return null;
 const bounds=world.brViewerBounds(p,{vw:interest.width,vh:interest.height});
 const visible=world.game.participants.filter(q=>q===p||(!world.game.isConcealedFrom(q,p)&&world.brViewContains(bounds,q.pos.x,q.pos.y,q.radius)));
 const shots=projectileStates(world).filter(s=>world.brViewContains(bounds,s.x,s.y,Math.max(s.radius||20,s.range||0))+0||world.brViewSegment(bounds,s.x,s.y,s.x+(s.dx||0)*12,s.y+(s.dy||0)*12,s.radius||20));
 return {...state(world,visible,shots),self:getPrivateSelfState(world,id)};
}
export function exportResult(world){
 if(world.game.capture)return world.brCaptureResults();
 const players=world.game.participants.slice().sort(world.compareSurvivalOrder).map((p,i)=>({...actor(world,p),rank:i+1,damage:Math.round(p.damageDealt),damageTaken:Math.round(p.damageTaken)}));
 return {matchId:world.matchId,mode:world.session.roomMeta.mode,duration:world.game.frame/60,players,winner:players[0]?.id,
  awards:[{label:'최다 처치',ids:players.filter(p=>p.kills===Math.max(...players.map(p=>p.kills))).map(p=>p.id)}]};
}
export function destroyWorld(world){if(world.disposed)return;world.BRRework.clearWorld(world.game,'destroy');world.brFarm.dispose(world.game);world.game.participants.length=0;world.byId.clear();world.inputPending.clear();world.actionPending.clear();world.shotIds.clear();world.session.inputs={};world.session.players={};world.disposed=true;}
