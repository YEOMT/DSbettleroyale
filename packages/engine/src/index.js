import {installRules} from './registry.js';
import {manifest,contentHash} from '../../content/src/manifest.js';
export {contentHash};
export const FIXED_DT_MS=1000/60;
export const ENGINE_REVISION='v33-authority-1';

export function createRuleContext({mode='solo',teamCount=2,matchSeconds=360,mapIndex=-1,seed='1',matchId='local:1',eventSink=()=>{},quizBank=manifest.questions}={}){
 const room={matchId,timeMs:0,idSequence:0,events:[],disposed:false,now(){return this.timeMs;},random:null,
  trace(type,data){eventSink({type:'TRACE',name:type,serverTick:this.game?.frame||0,data});},
  finish(winner,options){this.finished=true;this.finishOptions=options;},
  session:{active:true,role:'host',backend:'authority',inputs:{},players:{},roomCode:matchId,
   roomMeta:{mode:mode==='team'?'team-elim':mode,teamCount,matchSeconds,mapIndex,seed,matchRound:1,battleStartedAt:0,quizBank},
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
 room.eventSequence=0;
 const beginNative=room.brBeginProjectileVisual,endNative=room.brEndProjectileVisual;
 room.brBeginProjectileVisual=(g,p)=>{beginNative(g,p);if(!p._brNetId)p._brNetId='q'+(++g.visualShotSeq);if(!p._wsBorn){p._wsBorn=true;emit(room,'SHOT_SPAWN',nativeShot(room,p));}};
 room.brEndProjectileVisual=(g,p)=>{endNative(g,p);if(p.life<=0&&!p._wsEnded){p._wsEnded=true;emit(room,'SHOT_END',{...nativeShot(room,p),reason:p._endReason||'expired'});}};
 room.entitySpawn=e=>{if(['projectile','hook','lob','bomb','beam','turret','zone','orbit'].includes(e.kind))emit(room,'SHOT_SPAWN',reworkShot(e));};
 room.entityEnd=(e,reason)=>emit(room,'SHOT_END',{...reworkShot(e),reason});
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
function nativeShot(world,p){return {id:world.matchId+':'+p.ownerLife+':'+p.inputKind+':'+p.inputSeq+':'+p.shotOrdinal+':'+p._brNetId,
 owner:p.owner?.remoteId,life:p.ownerLife,actionKind:p.inputKind,actionSeq:p.inputSeq,ordinal:p.shotOrdinal,
 kind:'projectile',type:p.type,x:p.pos.x,y:p.pos.y,dx:p.vel?.x||0,dy:p.vel?.y||0,radius:p.size||8,
 emoji:p.emoji,color:p.color,remaining:p.life,rangeRemaining:p.rangeRemaining,turn:p._brTurn||0,curved:['BOOMERANG','ORBIT','missile'].includes(p.type)||!!p.wobble,start:p._brBornFrame??world.game.frame,team:p.owner?.team||0,path:p._brPath||[],native:true};}
function reworkShot(e){return {id:e.id,owner:e.ctx?.ownerId,life:e.ctx?.ownerLifeSeq,actionKind:e.actionKind||e.ctx?.actionKind,actionSeq:e.ctx?.actionSeq,ordinal:e.ordinal??0,
 kind:e.kind,x:e.pos?.x||0,y:e.pos?.y||0,dx:(e.dir?.x||0)*(e.speed||0),dy:(e.dir?.y||0)*(e.speed||0),radius:e.radius||8,range:e.range||0,
 start:e.start,end:e.end,team:e.ctx?.owner?.team||0,emoji:e.displayEmoji||e.emoji,color:e.color};}
function projectileStates(world){
 const g=world.game;
 const native=g.projectiles.filter(p=>p.life>0).map(p=>nativeShot(world,p));
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
    aspect:input.aspect??prior.aspect??1,matchKey:world.matchId,life:p.lifeSeq,sessionId:p.sessionId,_receivedAt:world.timeMs});
   p.lastAppliedSeq=input.seq;p.lastAppliedClientTick=input.clientTick;p.inputAppliedAt=world.game.frame+1;p.heldTicks=0;world.onInputApplied?.(input);
   if(input.steer){prior.steerSeq=input.seq;prior.steer={kind:'steer',seq:input.seq,life:p.lifeSeq,castId:input.steer.castId,ax:input.aim.x,ay:input.aim.y};}
   world.inputPending.delete(p.remoteId);
  }else p.heldTicks=(p.heldTicks||0)+1;
  if(world.timeMs-(world.lastInputAt.get(p.remoteId)??-Infinity)>=250){prior.dx=0;prior.dy=0;prior._receivedAt=-Infinity;p.inputNeutral=true;}else p.inputNeutral=false;
  const action=world.actionPending.get(p.remoteId)?.shift();
  if(action&&action.lifeSeq===p.lifeSeq&&p.alive){
   const kind=action.kind,seq=action.seq;
   prior.matchKey=world.matchId;prior.life=p.lifeSeq;prior.sessionId=p.sessionId;prior._receivedAt=world.timeMs;
   prior[kind+'Seq']=seq;prior[kind]={seq,life:p.lifeSeq,kind:action.castId?'recast':'cast',castId:action.castId||'',ax:action.aim.x,ay:action.aim.y,rax:action.rawAim?.x,ray:action.rawAim?.y,assist:action.assist,ap:action.aimPower??1};
  }
  world.session.inputs[p.remoteId]=prior;
 }
 world.game.update();
 if(world.game.participants.some(p=>p.runtimeFaults))throw Error('COMBAT_RUNTIME_FAULT');
 for(const p of world.game.participants){
  if(!p.alive&&!p.deathHandled){p.deathHandled=true;p.deaths=(p.deaths||0)+1;emit(world,'DEATH',{playerId:p.remoteId,lifeSeq:p.lifeSeq,cause:p.lastDeathCause});if(world.session.respawnMode){world.brTeamKillDeath(p);p.deathHandled=true;world.session.inputs[p.remoteId]={};world.inputPending.delete(p.remoteId);world.actionPending.delete(p.remoteId);}}
  if(p.alive)p.deathHandled=false;
 }
 if(world.game.capture?.finalized)world.finished=true;
 if(world.game.isGameOver)world.finished=true;
}
function actor(world,p){return {id:p.remoteId,name:p.name,abilityId:p.ability.id,emoji:p.ability.e,tier:p.ability.t,team:p.team,
 x:p.pos.x,y:p.pos.y,vx:p.vel.x,vy:p.vel.y,radius:p.radius,hp:Math.max(0,p.hp),maxHp:p.maxHp,alive:p.alive,level:p.run?.level||1,
 lifeSeq:p.lifeSeq,warpSeq:p.warpSeq||0,kills:p.kills||0,deaths:p.deaths||0,stunned:p.stunned||0,
 cooldown:p.cooldown,basicCooldown:p.basicCooldown||0,skillCooldownMax:p.skillCooldownMax||p.maxCooldown,basicCooldownMax:p.basicCooldownMax,
  moveSpeed:world.brHumanMoveSpeed(p),phaseWalls:p.ability.sub==='GHOST_MOVE'||p.ability.sub==='FLY_DASH'&&p.dashFrames>0,
  dash:p.playerDash?{dx:p.playerDash.dir.x,dy:p.playerDash.dir.y,speed:p.playerDash.speed,remaining:p.playerDash.remaining}:null,
  rw:world.BRRework.wirePlayer(p,world.game)};}
export function getPrivateSelfState(world,id,preparedActor){
 const p=world.byId.get(id);if(!p)return null;
 const aimKey=p.ability.id+':'+p.radius+':'+p.run?.revision;
 if(p.aimProfileKey!==aimKey){p.aimProfileKey=aimKey;p.aimProfiles={};for(const kind of ['attack','skill']){const full=world.brAimHelpProfile(p.ability,kind,p.radius,1,p.run?.mods||{}),short=world.brAimHelpProfile(p.ability,kind,p.radius,.18,p.run?.mods||{});p.aimProfiles[kind]={...full,rangeMin:short.range};}}
 return {...(preparedActor||actor(world,p)),run:world.brRunSnapshot(p),respawn:world.session.respawnMode?world.brTeamKillSelf(p):null,
  aimProfiles:p.aimProfiles,
  lastAppliedSeq:p.lastAppliedSeq||0,lastAppliedClientTick:p.lastAppliedClientTick||0,inputAppliedAt:p.inputAppliedAt||0,
  heldTicks:p.heldTicks||0,replacedInputSeq:p.replacedInputSeq||0,inputNeutral:!!p.inputNeutral,
  actions:{attack:p.resolvedAttackSeq||0,skill:p.resolvedSkillSeq||0,firedAttack:p.firedAttackSeq||0,firedSkill:p.firedSkillSeq||0}};
}
export function getStaticState(world){const g=world.game;return {revision:1,worldRadius:g.worldRadius,mapRadius:g.mapRadius,mapName:g.mapName,
 boundary:g.boundary||null,walls:g.walls.map(w=>({x:w.pos?.x??w.x,y:w.pos?.y??w.y,w:w.w??w.width,h:w.h??w.height,angle:w.angle||0,kind:w.kind||'wall'})),
 smokes:g.smokes.map(s=>({x:s.pos.x,y:s.pos.y,radius:s.radius})),captureMap:g.capture?.map||null};}
function state(world,players,shots){const g=world.game;return {serverTick:g.frame,simTime:world.timeMs,actors:players.map(p=>actor(world,p)),shots,aliveCount:g.participants.filter(p=>p.alive).length,
  movingWalls:g.walls.map((w,i)=>w.spinSpeed?[i,w.angle]:null).filter(Boolean),
 ring:g.ringGeometry,capture:g.capture?world.brCapturePacket(g):null,farm:world.brFarm.snapshot(g),
 zones:g.zones.map(z=>({x:z.pos.x,y:z.pos.y,radius:z.radius,type:z.type,color:z.color,duration:z.duration})),finished:!!world.finished};}
export function getTeacherState(world){return state(world,world.game.participants,projectileStates(world));}
export function getVisibleState(world,id,interest,prepared=getTeacherState(world)){
 const p=world.byId.get(id);if(!p)return null;
 const bounds=world.brViewerBounds(p,interest?{aspect:interest.width/interest.height}:world.session.inputs[id]);
 const visible=world.game.participants.filter(q=>q===p||(!world.game.isConcealedFrom(q,p)&&world.brViewContains(bounds,q.pos.x,q.pos.y,q.radius)));
 const shots=prepared.shots.filter(s=>world.brViewContains(bounds,s.x,s.y,Math.max(s.radius||20,s.range||s.length||0))||world.brViewSegment(bounds,s.x,s.y,s.x+(s.dx||0)*(s.native?1:s.speed||0)*12,s.y+(s.dy||0)*(s.native?1:s.speed||0)*12,s.radius||20));
 const ids=new Set(visible.map(p=>p.remoteId)),farm={...prepared.farm};
 for(const key of ['b','x'])if(Array.isArray(farm[key]))farm[key]=farm[key].filter(row=>world.brViewContains(bounds,row[1],row[2],120));
 return {...prepared,actors:prepared.actors.filter(p=>ids.has(p.id)),shots,farm,self:getPrivateSelfState(world,id,prepared.actors.find(a=>a.id===id))};
}
export function exportResult(world){
 return {...world.brBuildResults(),matchId:world.matchId};
}
export function destroyWorld(world){if(world.disposed)return;world.BRRework.clearWorld(world.game,'destroy');world.brFarm.dispose(world.game);world.game.participants.length=0;world.byId.clear();world.inputPending.clear();world.actionPending.clear();world.session.inputs={};world.session.players={};world.disposed=true;}
