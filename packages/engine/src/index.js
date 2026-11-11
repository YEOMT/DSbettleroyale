import {initEscape,updateEscape} from './world/escape.js';
import {activeSupply} from './farm/combat-supplies.js';
import {visualProfiles} from './presentation.js';
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
 initEscape(room);
 room.byId=new Map(players.map(p=>[p.remoteId,p]));
 room.inputPending=new Map();room.actionPending=new Map();room.lastInputAt=new Map();room.eventSink=eventSink;
 room.eventSequence=0;room.publishEscape=data=>emit(room,'ESCAPE_STATE',data);
 const beginNative=room.brBeginProjectileVisual,endNative=room.brEndProjectileVisual;
 room.brBeginProjectileVisual=(g,p)=>{beginNative(g,p);if(!p._brNetId)p._brNetId='q'+(++g.visualShotSeq);if(!p._wsBorn){p._brBornFrame??=g.frame;p._wsBorn=true;emit(room,'SHOT_SPAWN',nativeShot(room,p));}};
 room.brEndProjectileVisual=(g,p)=>{endNative(g,p);if(p.life<=0&&!p._wsEnded){p._wsEnded=true;emit(room,'SHOT_END',{...nativeShot(room,p),reason:p._endReason||'expired'});}};
 room.entitySpawn=e=>{if(['projectile','hook','lob','bomb','beam','turret','zone','orbit','decoy','grapple','mushroom','poison','ring-wall'].includes(e.kind))emit(room,'SHOT_SPAWN',reworkShot(e));};
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
  p.lastReceivedSeq=command.seq;p.lastReceivedClientTick=command.clientTick;world.inputPending.set(p.remoteId,command);world.lastInputAt.set(p.remoteId,world.timeMs);
  return {accepted:true};
 }
 if(command.type==='ACTION'){
  const list=world.actionPending.get(p.remoteId)||[];if(list.length>=8)return {accepted:false,reason:'ACTION_QUEUE_FULL'};
  const key=command.kind==='attack'?'receivedAttackSeq':'receivedSkillSeq';
  if(command.seq<=Math.max(p[key]||0,p[command.kind==='attack'?'lastRemoteAttack':'lastRemoteSkill']||0))return {accepted:false,reason:'OLD_ACTION'};
  p[key]=command.seq;list.push(command);world.actionPending.set(p.remoteId,list);return {accepted:true};
 }
 if(command.type==='AUGMENT_CHOOSE'){const before=world.brRunMeasured(p,p.run.mods),accepted=world.brChooseRun(p,command.offerId,command.augmentId);return {accepted,...(accepted?{notice:world.brRunNoticeText(command.augmentId,p.run.paths[command.augmentId],before,world.brRunMeasured(p,p.run.mods))}:{})};}
 if(command.type==='RESPAWN'){
  world.brTeamKillProcessInput(p,{sessionId:p.sessionId,tkRequest:{...command,matchKey:world.matchId,kind:command.kind,id:command.requestId}});
  return p.tkQuiz?.ack||{accepted:false};
 }
 return {accepted:false,reason:'UNKNOWN_COMMAND'};
}
function nativeShot(world,p){p._brNetId??="q"+(++world.game.visualShotSeq);p._brBornFrame??=p.farmBornFrame??world.game.frame;return {id:world.matchId+':'+p.ownerLife+':'+p.inputKind+':'+p.inputSeq+':'+p.shotOrdinal+':'+p._brNetId,
 owner:p.owner?.remoteId,life:p.ownerLife,actionKind:p.inputKind,actionSeq:p.inputSeq,ordinal:p.shotOrdinal,
 kind:'projectile',type:p.type,x:p.pos.x,y:p.pos.y,dx:p.vel?.x||0,dy:p.vel?.y||0,radius:p.size||8,
 vfx:p.vfx,ownerWarp:p.owner?.warpSeq||0,orbitAngle:p.orbitAngle,faceDir:!!p.faceDir,emoji:p.emoji,color:p.color,style:p.weaponStyle,trailColor:p.trailColor,rotation:p.spinRate?p.spinAngle:p.faceDir?Math.atan2(p.vel.y,p.vel.x):0,spin:p.spinRate,phase:p.returning?'return':'out',trace:p._brTrace||[],remaining:p.life,rangeRemaining:p.rangeRemaining,turn:p._brTurn||0,curved:['BOOMERANG','ORBIT','missile'].includes(p.type)||!!p.wobble,start:p._brBornFrame??world.game.frame,team:p.owner?.team||0,path:p._brPath||[],native:true};}
function reworkShot(e){return {id:e.id,owner:e.ctx?.ownerId,life:e.ctx?.ownerLifeSeq,actionKind:e.actionKind||e.ctx?.actionKind,actionSeq:e.ctx?.actionSeq,ordinal:e.ordinal??0,
 kind:e.kind,...(['decoy','grapple','mushroom','poison','ring-wall'].includes(e.kind)?{hp:e.hp??null,maxHp:e.maxHp??null,name:e.name||'',armAt:e.armFrames!=null?e.start+e.armFrames:null,fx:e.from?.x??null,fy:e.from?.y??null,tx:e.to?.x??null,ty:e.to?.y??null}:{}),x:e.pos?.x||0,y:e.pos?.y||0,dx:e.dir?.x||0,dy:e.dir?.y||0,speed:e.speed||0,radius:e.radius||8,range:e.range||0,
 path:e._brPath||[],curved:!!(e.homing||e.boomerang),turn:e.bounceCount||0,phase:e.phase||null,width:e.width||0,length:e.length??e.range??0,remaining:e.range!=null?Math.max(0,e.range-(e.distance||0)):0,style:'skill',start:e.start,end:e.end,team:e.ctx?.owner?.team||0,emoji:e.displayEmoji||e.emoji,color:e.color};}
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
 if(world.game.escape)updateEscape(world,world.publishEscape);
 if(world.game.participants.some(p=>p.runtimeFaults))throw Error('COMBAT_RUNTIME_FAULT');
 for(const p of world.game.participants){
  if(!p.alive&&!p.deathHandled){p.deathHandled=true;p.deaths=(p.deaths||0)+1;emit(world,'DEATH',{playerId:p.remoteId,lifeSeq:p.lifeSeq,cause:p.lastDeathCause});if(world.session.respawnMode){world.brTeamKillDeath(p);p.deathHandled=true;world.session.inputs[p.remoteId]={};world.inputPending.delete(p.remoteId);world.actionPending.delete(p.remoteId);}}
  if(p.alive)p.deathHandled=false;
 }
 if(world.game.capture?.finalized)world.finished=true;
 if(world.game.isGameOver)world.finished=true;
}
function actor(world,p){const row={id:p.remoteId,name:p.name,abilityId:p.ability.id,emoji:p.ability.e,tier:p.ability.t,team:p.team,humanControlled:!!p.humanControlled,clone:!!p.isClone,
 visual:{id:p.id,flashUntilFrame:p.flashUntilFrame||0,supportPulseFrames:p.supportPulseFrames||0,supportPulseKind:p.supportPulseKind||'',teamGuardFrames:p.teamGuardFrames||0,frenzyFrames:p.frenzyFrames||0},
 x:p.pos.x,y:p.pos.y,vx:p.vel.x,vy:p.vel.y,radius:p.radius,hp:Math.max(0,p.hp),maxHp:p.maxHp,alive:p.alive,level:p.run?.level||1,
 cover:world.game.getCoverTypeAt?.(p.pos)||'',flags:(p.playerMoveBoostFrames>0?8:0)|(p.playerAttackHasteFrames>0?16:0)|(p.invisible?32:0)|(p.finalPhaseBoosted?64:0),skillUsesLeft:p.skillUsesLeft??-1,lifeSeq:p.lifeSeq,warpSeq:p.warpSeq||0,kills:p.kills||0,deaths:p.deaths||0,stunned:p.stunned||0,
 cooldown:p.cooldown,basicCooldown:p.basicCooldown||0,skillCooldownMax:p.skillCooldownMax||p.maxCooldown,basicCooldownMax:p.basicCooldownMax,
  moveSpeed:world.brHumanMoveSpeed(p),phaseWalls:p.ability.sub==='GHOST_MOVE'||p.ability.sub==='FLY_DASH'&&p.dashFrames>0,
  dash:p.playerDash?{dx:p.playerDash.dir.x,dy:p.playerDash.dir.y,speed:p.playerDash.speed,remaining:p.playerDash.remaining}:null,
  rw:world.BRRework.wirePlayer(p,world.game)};
 if (p.combatBuff) {
  const buff = activeSupply(p, world.game.frame);
  if (buff) { row.supply=buff.kind; row.supplyEnd=buff.end; }
 }
 return row;}
export function getPrivateSelfState(world,id,preparedActor,restore=false){
 const p=world.byId.get(id);if(!p)return null;
 const aimKey=p.ability.id+':'+p.radius+':'+p.run?.revision;
 if(p.aimProfileKey!==aimKey){p.aimProfileKey=aimKey;p.visualProfiles=visualProfiles(world,p);p.aimProfiles={};for(const kind of ['attack','skill']){const full=world.brAimHelpProfile(p.ability,kind,p.radius,1,p.run?.mods||{}),short=world.brAimHelpProfile(p.ability,kind,p.radius,.18,p.run?.mods||{});p.aimProfiles[kind]={...full,rangeMin:short.range};}}
 return {...(preparedActor||actor(world,p)),capturePoints:world.game.capture?.records.get(String(p.remoteId||p.id))?.points??0,run:world.brRunSnapshot(p),respawn:world.session.respawnMode?world.brTeamKillSelf(p):null,
  aimProfiles:p.aimProfiles,visualProfiles:p.visualProfiles,
  ...(restore?{inputFloor:{move:Math.max(p.lastReceivedSeq||0,p.lastAppliedSeq||0),tick:Math.max(p.lastReceivedClientTick||0,p.lastAppliedClientTick||0),attack:Math.max(p.receivedAttackSeq||0,p.lastRemoteAttack||0,p.resolvedAttackSeq||0),skill:Math.max(p.receivedSkillSeq||0,p.lastRemoteSkill||0,p.resolvedSkillSeq||0)}}:{}),
  lastAppliedSeq:p.lastAppliedSeq||0,lastAppliedClientTick:p.lastAppliedClientTick||0,inputAppliedAt:p.inputAppliedAt||0,
  heldTicks:p.heldTicks||0,replacedInputSeq:p.replacedInputSeq||0,inputNeutral:!!p.inputNeutral,
  actions:{attack:p.resolvedAttackSeq||0,skill:p.resolvedSkillSeq||0,firedAttack:p.firedAttackSeq||0,firedSkill:p.firedSkillSeq||0}};
}
export function getStaticState(world){const g=world.game;return {revision:2,escapeMap:g.escapeMap||null,escapeState:g.escape?{...g.escape,pads:g.escape.pads.slice()}:null,center:{x:g.center?.x||0,y:g.center?.y||0},worldRadius:g.worldRadius,mapRadius:g.mapRadius,mapName:g.mapName,
 boundary:g.boundary||null,walls:g.walls.filter(w=>!w.dynamic).map(w=>({x:w.pos?.x??w.x,y:w.pos?.y??w.y,w:w.w??w.width,h:w.h??w.height,angle:w.angle||0,kind:w.kind||'wall',terrain:!!w.terrain})),
 smokes:g.smokes.map(s=>({x:s.pos.x,y:s.pos.y,radius:s.radius})),captureMap:g.capture?.map||null};}
function state(world,players,shots){const g=world.game;return {serverTick:g.frame,simTime:world.timeMs,actors:players.map(p=>actor(world,p)),shots,aliveCount:g.participants.filter(p=>p.alive).length,
  ...(g.classroomAnnouncements?{announcements:g.classroomAnnouncements}:{}),
  presentation:{finalPhase:!!g.finalPhase,gameOver:!!g.isGameOver,eventFocusFrames:g.eventFocusFrames||0,eventFocusPos:g.eventFocusPos?{x:g.eventFocusPos.x,y:g.eventFocusPos.y}:null,announcement:g.announcement||'',announcementLife:g.announcementLife||0,feed:(g.eventFeed||[]).slice(0,3).map(e=>({text:e.text,color:e.color,life:e.life}))},
  movingWalls:g.walls.map((w,i)=>w.spinSpeed?[i,w.angle]:null).filter(Boolean),...(g.dynamicObstacles?{dynamicWalls:world.BRRework.dynamicWalls(g)}:{}),
 ring:g.ringGeometry,capture:g.capture?world.brCapturePacket(g):null,farm:world.brFarm.snapshot(g),
 zones:g.zones.map(z=>({x:z.pos.x,y:z.pos.y,radius:z.radius,type:z.type,color:z.color,duration:z.duration,meta:{endFrame:g.frame+Math.max(0,z.duration),span:Math.max(1,z.maxDuration||z.duration),ownerId:z.owner?.remoteId||'',...(z.type==='pull'?{...world.brZoneGeometry(z.radius,z.type,z.owner?.ability?.sub),soon:z.duration<=36}:{})}})),finished:!!world.finished};}
// Internal shared frame includes private traps; only wire views filter them.
export function getHostVisibleState(prepared){return {...prepared,shots:prepared.shots.filter(s=>s.kind!=='mushroom')};}
export function getTeacherState(world){const g=world.game,pos=p=>({x:p.x,y:p.y});return {...state(world,g.participants,projectileStates(world)),turrets:g.turrets.filter(t=>t.life>0).map(t=>({x:t.pos.x,y:t.pos.y,golden:!!t.isGolden,emoji:t.owner?.ability?.e||''})),hostEffects:{
 particles:g.particles.map(q=>({pos:pos(q.pos),size:q.size,color:q.color,life:q.life,maxLife:q.maxLife})),
 rings:g.rings.map(q=>({pos:pos(q.pos),radius:q.radius,color:q.color,lineWidth:q.lineWidth,life:q.life,maxLife:q.maxLife})),
 signatures:g.signatureEffects.map(q=>({owner:{pos:pos(q.owner.pos),radius:q.owner.radius,alive:q.owner.alive},type:q.type,angle:q.angle,color:q.color,life:q.life,maxLife:q.maxLife})),
 texts:g.texts.map(q=>({pos:pos(q.pos),text:q.text,size:q.size,color:q.color,life:q.life,maxLife:q.maxLife})),
 screenFlashAlpha:g.screenFlashAlpha,screenFlashColor:g.screenFlashColor,vignettePulse:g.vignettePulse,shakeAmount:g.shakeAmount,cameraKick:pos(g.cameraKick)
 }};}
export function getVisibleState(world,id,interest,prepared=getTeacherState(world)){
 const p=world.byId.get(id);if(!p)return null;
 const bounds=world.brViewerBounds(p,interest?{aspect:interest.width/interest.height}:world.session.inputs[id]);
 const visible=world.game.participants.filter(q=>q===p||(!world.game.isConcealedFrom(q,p)&&world.brViewContains(bounds,q.pos.x,q.pos.y,q.radius)));
 const shots=prepared.shots.filter(s=>{
  if(s.kind==='mushroom'&&s.owner!==id)return false;
  if(s.kind==='decoy'&&s.owner!==id&&world.game.isConcealedFrom({id:s.id,pos:{x:s.x,y:s.y},team:s.team||0,alive:true,lifeSeq:s.life},p))return false;
  return world.brViewContains(bounds,s.x,s.y,Math.max(s.radius||20,s.range||s.length||0))||world.brViewSegment(bounds,s.x,s.y,s.x+(s.dx||0)*(s.native?1:s.speed||0)*12,s.y+(s.dy||0)*(s.native?1:s.speed||0)*12,s.radius||20);
 });
 const ids=new Set(visible.map(p=>p.remoteId)),farm={...prepared.farm};
 for(const key of ['b','x'])if(Array.isArray(farm[key]))farm[key]=farm[key].filter(row=>world.brViewContains(bounds,row[1],row[2],120));
 const {hostEffects,...publicState}=prepared;
 return {...publicState,turrets:(prepared.turrets||[]).filter(t=>world.brViewContains(bounds,t.x,t.y,32)),actors:prepared.actors.filter(p=>ids.has(p.id)),shots,farm,self:getPrivateSelfState(world,id,prepared.actors.find(a=>a.id===id))};
}
export function exportResult(world){
 return {...world.brBuildResults(),matchId:world.matchId};
}
export function destroyWorld(world){if(world.disposed)return;if(world.game.soloSupplies){for(const p of world.game.participants)p.combatBuff=null;world.game.soloSupplies=null;world.game.combatSupply=null;world.game.supplyDrop=null;}world.BRRework.clearWorld(world.game,'destroy');world.brFarm.dispose(world.game);world.game.participants.length=0;world.byId.clear();world.inputPending.clear();world.actionPending.clear();world.session.inputs={};world.session.players={};world.lastInputAt.clear();world.onInputApplied=null;world.eventSink=null;world.entitySpawn=null;world.entityEnd=null;world.events.length=0;for(const key of ['projectiles','zones','turrets','particles','rings','texts','signatureEffects'])if(Array.isArray(world.game[key]))world.game[key].length=0;world.publishEscape=null;world.game.classroomAnnouncements=null;world.game.escape=null;world.game.escapeMap=null;world.game.escapeBlocks=null;world.disposed=true;}
