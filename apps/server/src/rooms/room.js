import {randomUUID,randomBytes,randomInt} from 'node:crypto';
import {createRuleContext,exportResult,destroyWorld,applyCommand} from '../../../../packages/engine/src/index.js';
import {manifest} from '../../../../packages/content/src/manifest.js';
import {initializeQuiz,publicQuiz,answer} from './quiz.js';
import {cancelCombatInputs} from './pause.js';
const fail=code=>{throw Error(code);};
export class Room{
 constructor(manager,code,hostName){
  this.manager=manager;this.code=code;this.id=randomUUID();this.round=1;this.matchId=randomUUID();this.phase='LOBBY';this.revision=1;this.safePaused=false;this.lastFault=null;
  this.config={mode:'solo',teamCount:2,matchSeconds:360,quizSeconds:60,rerollEvery:3,mapIndex:-1,graphicsPreset:'balanced'};
  this.rules=createRuleContext({matchId:this.matchId});this.quizBank=manifest.questions;this.members=new Map();this.world=null;this.lastOccupied=manager.now();
  this.host=this.addMember(hostName||'선생님','host');
 }
 addMember(name,role='student'){
  if(role==='student'&&this.students().length>=this.manager.config.maxPlayers)fail('ROOM_FULL');
  if(role==='student'&&this.phase!=='LOBBY')fail('JOIN_LOBBY_ONLY');
  name=String(name).normalize('NFC').trim();if(!name||name.length>24||/[\u0000-\u001f]/.test(name))fail('INVALID_NAME');
  if([...this.members.values()].some(p=>!p.revoked&&p.name===name))fail('NAME_IN_USE');
  const p={id:randomUUID(),token:randomBytes(32).toString('base64url'),name,role,epoch:0,connected:false,revoked:false,team:0,joinedAt:this.manager.now(),ledger:new Map(),events:[],eventBytes:0,cursor:0};
  this.members.set(p.id,p);this.manager.tokens.set(p.token,{room:this,member:p});this.balanceLobbyTeams();this.revision++;return p;
 }
 students(){return [...this.members.values()].filter(p=>p.role==='student'&&!p.revoked);}
 balanceLobbyTeams(){if(this.phase!=='LOBBY'||this.config.mode!=='team-capture')return;const teams=this.rules.brTKBalancedTeams(this.students().map(p=>({...p,_id:p.id})),this.config.teamCount);for(const p of this.students())p.team=teams[p.id];}
 configure(p){
  if(this.phase!=='LOBBY')fail('PHASE_MISMATCH');const next={...this.config};
  if(p.mode!==undefined){const mode=p.mode==='team'?'team-elim':p.mode;if(!['solo','team-elim','team-capture','team-respawn'].includes(mode))fail('INVALID_MODE');next.mode=mode;}
  for(const [key,min,max]of [['teamCount',2,4],['quizSeconds',10,600],['rerollEvery',1,100]])if(p[key]!==undefined){if(!Number.isInteger(p[key])||p[key]<min||p[key]>max)fail('INVALID_CONFIG');next[key]=p[key];}
  if(p.matchSeconds!==undefined){if(![300,360].includes(p.matchSeconds))fail('INVALID_CONFIG');next.matchSeconds=p.matchSeconds;}
  if(p.mapIndex!==undefined){if(!Number.isInteger(p.mapIndex)||p.mapIndex< -1||p.mapIndex>4)fail('INVALID_CONFIG');next.mapIndex=p.mapIndex;}
  if(p.graphicsPreset!==undefined){if(!['low','balanced','high'].includes(p.graphicsPreset))fail('INVALID_CONFIG');next.graphicsPreset=p.graphicsPreset;}
  let bank=this.quizBank;
  if(p.quizText!==undefined){if(typeof p.quizText!=='string'||p.quizText.length>200000)fail('QUIZ_TOO_LARGE');const parsed=this.rules.brValidateQuestionText(p.quizText);if(parsed.errors.length||!parsed.questions.length)fail('INVALID_QUIZ:'+JSON.stringify(parsed.errors.slice(0,3)));if(parsed.questions.some(q=>q.some(s=>s.length>1000)))fail('QUIZ_TEXT_TOO_LONG');bank=parsed.questions;}
  if(p.teams!==undefined){if(!p.teams||typeof p.teams!=='object'||Array.isArray(p.teams))fail('INVALID_TEAMS');for(const [id,team]of Object.entries(p.teams))if(!this.members.has(id)||!Number.isInteger(team)||team<1||team>next.teamCount)fail('INVALID_TEAMS');}
  this.config=next;this.quizBank=bank;if(p.teams)for(const [id,team]of Object.entries(p.teams))this.members.get(id).team=team;
  this.balanceLobbyTeams();this.revision++;
 }
 beginDraft(){
  if(this.phase!=='QUIZ')fail('PHASE_MISMATCH');
  for(const p of this.students()){
   const index=this.rules.brAbilityIndex(this.config.mode,-1,null,this.rules.brHashRandom(this.matchId+'|'+p.id+'|initial'));
   if(!this.rules.EMOJI_DB[index]?.id)fail('DRAFT_ASSIGNMENT_FAILED');
   p.draft={abilityId:this.rules.EMOJI_DB[index].id,revision:1,spent:0,rerolls:Math.min(['team-capture','team-respawn'].includes(this.config.mode)?2:1000,Math.floor((p.quiz?.score||0)/this.config.rerollEvery)),ready:false};
  }
  this.phase='DRAFT';this.revision++;
 }
 command(member,type,p,requestId){
  const host=['CONFIGURE','KICK','START_QUIZ','BEGIN_DRAFT','START_BATTLE','END','REMATCH','CONTINUE','CLOSE_ROOM'];
  if(host.includes(type)&&member.role!=='host')fail('HOST_REQUIRED');
  switch(type){
   case 'CONFIGURE':this.configure(p);break;
   case 'KICK':{
    if(!['LOBBY','QUIZ','DRAFT'].includes(this.phase))fail('PHASE_MISMATCH');const target=this.members.get(p.playerId);if(!target||target.role==='host')fail('INVALID_PLAYER');
    target.revoked=true;this.manager.tokens.delete(target.token);target.peer?.close(4003,'KICKED');this.revision++;break;
   }
   case 'START_QUIZ':{
    if(this.phase!=='LOBBY')fail('PHASE_MISMATCH');if(this.manager.draining)fail('SERVER_DRAINING');if(this.students().length<2)fail('NEED_TWO_PLAYERS');
    const teams=this.rules.brTKBalancedTeams(this.students().map(p=>({...p,_id:p.id})),this.config.teamCount);
    for(const p of this.students()){p.team=this.config.mode==='solo'?0:teams[p.id];initializeQuiz(this,p);}
    this.quizEndsAt=this.manager.now()+this.config.quizSeconds*1000;this.phase='QUIZ';this.revision++;break;
   }
   case 'BEGIN_DRAFT':this.beginDraft();break;
   case 'QUIZ_ANSWER':if(this.phase!=='QUIZ'||member.role!=='student')fail('PHASE_MISMATCH');return answer(this,member,p,this.manager.now());
   case 'DRAFT_RECOVER':{
    if(this.phase!=='DRAFT')fail('PHASE_MISMATCH');const target=this.members.get(p.playerId||member.id);if(!target||target.role!=='student'||target.revoked)fail('INVALID_PLAYER');if(target!==member&&member.role!=='host')fail('HOST_REQUIRED');
    // A refresh never rerolls a valid assignment. Rebuild only corrupted/missing data
    // from the same deterministic original draw stream, retaining spent credits.
    if(!this.rules.EMOJI_DB.some(a=>a.id===target.draft?.abilityId)){const spent=target.draft?.spent||0;let index=this.rules.brAbilityIndex(this.config.mode,-1,null,this.rules.brHashRandom(this.matchId+'|'+target.id+'|initial'));
     for(let i=1;i<=spent;i++)index=this.rules.brAbilityIndex(this.config.mode,index,null,this.rules.brHashRandom(this.matchId+'|'+target.id+'|reroll|'+i));
     const credits=Math.min(['team-capture','team-respawn'].includes(this.config.mode)?2:1000,Math.floor((target.quiz?.score||0)/this.config.rerollEvery));
     target.draft={abilityId:this.rules.EMOJI_DB[index].id,spent,rerolls:Math.max(0,credits-spent),revision:(target.draft?.revision||0)+1,ready:!!target.draft?.ready};}
    target.peer?.send('ROOM_STATE',this.publicState(target));break;
   }
   case 'DRAFT_REROLL':{
    const d=member.draft;if(this.phase!=='DRAFT'||!d||d.ready)fail('PHASE_MISMATCH');if(p.draftRevision!==d.revision)fail('DRAFT_REVISION');if(d.rerolls<=0)fail('NO_REROLLS');
    const old=this.rules.EMOJI_DB.findIndex(a=>a.id===d.abilityId),index=this.rules.brAbilityIndex(this.config.mode,old,null,this.rules.brHashRandom(this.matchId+'|'+member.id+'|reroll|'+(d.spent+1)));
    const id=this.rules.EMOJI_DB[index]?.id;if(!id)fail('DRAFT_ASSIGNMENT_FAILED');member.draft={...d,abilityId:id,rerolls:d.rerolls-1,spent:d.spent+1,revision:d.revision+1};break;
   }
   case 'DRAFT_CONFIRM':if(this.phase!=='DRAFT'||!member.draft||p.draftRevision!==member.draft.revision)fail('DRAFT_REVISION');member.draft.ready=true;member.draft.revision++;break;
   case 'START_BATTLE':if(this.phase!=='DRAFT')fail('PHASE_MISMATCH');if(this.manager.activeBattles()>=this.manager.config.maxActiveBattles)fail('BATTLE_CAPACITY');this.manager.startBattle(this);this.battleStartedAt=this.manager.now();this.phase='BATTLE';this.revision++;break;
   case 'END':if(this.phase!=='BATTLE')fail('PHASE_MISMATCH');this.finish();break;
   case 'CONTINUE':if(this.phase!=='BATTLE'||!this.safePaused||this.lastFault)fail('CANNOT_CONTINUE');
    cancelCombatInputs(this.world);this.safePaused=false;this.debt=0;this.overloadSince=0;this.revision++;
    // A fresh connection epoch also rejects pre-pause packets still in flight.
    // FULL_STATE restores sequence floors/life/profiles before input is enabled.
    for(const m of this.members.values())if(m.peer){m.epoch++;m.peer.epoch=m.epoch;m.peer.restore?.();m.peer.send('OVERLOAD',{paused:false});}break;
   case 'CLOSE_ROOM':if(this.phase==='BATTLE')fail('END_BATTLE_FIRST');queueMicrotask(()=>this.manager.remove(this));break;
   case 'REMATCH':{
    if(this.phase!=='RESULTS')fail('PHASE_MISMATCH');if(this.world)destroyWorld(this.world);this.world=null;this.result=null;this.static=null;this.safePaused=false;this.lastFault=null;this.debt=0;this.overloadSince=0;this.lastBoard=0;this.battleStartedAt=0;this.matchId=randomUUID();this.round++;this.phase='LOBBY';this.revision++;
    for(const m of this.members.values()){m.quiz=null;m.draft=null;m.ledger.clear();m.events=[];m.eventBytes=0;}break;
   }
   case 'AUGMENT_CHOOSE':case 'RESPAWN':if(this.phase!=='BATTLE')fail('PHASE_MISMATCH');return applyCommand(this.world,{...p,type,playerId:member.id,lifeSeq:this.world.byId.get(member.id)?.lifeSeq,requestId});
   default:fail('UNKNOWN_COMMAND');
  }
  return {accepted:true};
 }
 finish(){if(this.phase!=='BATTLE')return;this.result=exportResult(this.world);this.world.finished=true;this.phase='RESULTS';this.revision++;this.manager.onResult?.(this.matchId,this.result);}
 pause(fault=null){
  if(this.safePaused)return;this.safePaused=true;this.lastFault=fault;this.revision++;cancelCombatInputs(this.world);
  for(const m of this.members.values())if(m.peer){m.peer.pendingSnapshot=null;m.peer.send('OVERLOAD',{paused:true,debtMs:this.debt,fault:!!fault},{reliable:true});m.peer.restore?.();}
  if(fault)for(const m of this.members.values())m.peer?.send('ERROR',{code:'SIMULATION_PAUSED'});
  this.manager.changed(this);
 }
 publicState(member){return {safePaused:this.phase==='BATTLE'&&!!this.safePaused,simulationFault:this.phase==='BATTLE'&&!!this.lastFault,id:this.id,code:this.code,matchId:this.matchId,round:this.round,phase:this.phase,revision:this.revision,config:this.config,
  serverTime:this.manager.now(),quizEndsAt:this.quizEndsAt||0,battleStartedAt:this.battleStartedAt||0,
  quizRemainingMs:Math.max(0,(this.quizEndsAt||0)-this.manager.now()),
  players:this.students().map(p=>({id:p.id,name:p.name,team:p.team,connected:p.connected,ready:!!p.draft?.ready,score:p.quiz?.score||0,...(member.role==='host'?{draft:p.draft||null}:{})})),
  self:{id:member.id,name:member.name,role:member.role,team:member.team,draft:member.draft||null,quiz:member.role==='student'&&this.phase==='QUIZ'?publicQuiz(member,this.manager.now()):null},
  result:this.phase==='RESULTS'?this.result:null};}
}
export class RoomManager{
 constructor(config,{now=()=>Date.now()}={}){this.config=config;this.now=now;this.rooms=new Map();this.tokens=new Map();this.draining=!!config.drainOnStart;this.startBattle=()=>fail('ENGINE_NOT_ATTACHED');}
 create(name){if(this.draining)fail('SERVER_DRAINING');if(this.rooms.size>=this.config.maxRooms)fail('ROOM_CAPACITY');let code;do{code=String(randomInt(100000,1000000));}while(this.rooms.has(code));const room=new Room(this,code,name);this.rooms.set(code,room);return room;}
 activeBattles(){return [...this.rooms.values()].filter(r=>r.phase==='BATTLE').length;}
 protectedRooms(){return [...this.rooms.values()].filter(r=>['QUIZ','DRAFT','BATTLE'].includes(r.phase)).length;}
 remove(room){if(room.world)destroyWorld(room.world);room.world=null;for(const p of room.members.values()){p.revoked=true;this.tokens.delete(p.token);p.peer?.close(4004,'ROOM_EXPIRED');p.ledger.clear();p.events=[];p.peer=null;}room.members.clear();this.rooms.delete(room.code);}
 sweep(){for(const [code,r]of this.rooms){if([...r.members.values()].some(p=>p.connected))r.lastOccupied=this.now();else if(this.now()-r.lastOccupied>this.config.roomTtlMs){if(r.world)destroyWorld(r.world);for(const p of r.members.values())this.tokens.delete(p.token);r.members.clear();this.rooms.delete(code);continue;}if(r.phase==='QUIZ'&&this.now()>=r.quizEndsAt){r.beginDraft();this.changed?.(r);}}}
 close(){for(const r of this.rooms.values()){for(const p of r.members.values())p.peer?.close(1001,'SERVER_SHUTDOWN');if(r.world)destroyWorld(r.world);}this.rooms.clear();this.tokens.clear();}
}
