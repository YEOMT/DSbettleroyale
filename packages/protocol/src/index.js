import {contentHash} from '../../content/src/manifest.js';
export const PROTOCOL_VERSION=33;
export const ENGINE_REVISION='v33-authority-1';
export const BUILD_ID=typeof __DSBR_BUILD_ID__==='string'?__DSBR_BUILD_ID__:'v33.0.0-dev';
export const fingerprint={protocolVersion:PROTOCOL_VERSION,contentHash,engineRevision:ENGINE_REVISION,buildId:BUILD_ID};
export const PHASES=['LOBBY','QUIZ','DRAFT','BATTLE','RESULTS'];
export const PUBLIC_MODES=['solo','team-elim','team-capture'];
export class ProtocolError extends Error{constructor(code){super(code);this.code=code;}}
const bad=()=>{throw new ProtocolError('INVALID_MESSAGE');};
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const str=(v,max=128)=>typeof v==='string'&&v.length>0&&v.length<=max;
const num=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
const int=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const vec=v=>obj(v)&&Object.keys(v).every(k=>['x','y'].includes(k))&&num(v.x,-1,1)&&num(v.y,-1,1);
const validators={
 HELLO:p=>p.protocolVersion===PROTOCOL_VERSION&&str(p.contentHash,64)&&str(p.engineRevision)&&str(p.buildId),
 AUTH:p=>str(p.secret,256),CREATE:p=>p.name===undefined||str(p.name,30),
 JOIN:p=>/^\d{6}$/.test(p.code)&&str(p.name,24),RESUME:p=>str(p.token,128)&&(!p.cursor||int(p.cursor)),
 PING:p=>num(p.clientTime,0,1e16),CONFIGURE:p=>obj(p),KICK:p=>str(p.playerId,64),
 START_QUIZ:p=>Object.keys(p).length===0,BEGIN_DRAFT:p=>Object.keys(p).length===0,
 START_BATTLE:p=>Object.keys(p).length===0,END:p=>Object.keys(p).length===0,REMATCH:p=>Object.keys(p).length===0,
 CONTINUE:p=>Object.keys(p).length===0,CLOSE_ROOM:p=>Object.keys(p).length===0,LEAVE:p=>Object.keys(p).length===0,RESYNC:p=>Object.keys(p).length===0,
 QUIZ_ANSWER:p=>str(p.questionId)&&str(p.attemptId)&&str(p.answerId),
 DRAFT_RECOVER:p=>p.playerId===undefined||str(p.playerId,64),DRAFT_REROLL:p=>int(p.draftRevision),DRAFT_CONFIRM:p=>int(p.draftRevision),
 AUGMENT_CHOOSE:p=>str(p.offerId,256)&&str(p.augmentId,40),
 RESPAWN:p=>['answer','keep','reroll'].includes(p.kind)&&(p.kind!=='answer'||str(p.questionId)&&str(p.answerId)),
 ACTION:p=>['attack','skill'].includes(p.kind)&&int(p.seq,1)&&vec(p.aim)&&num(p.aimPower??1,.18,1)&&(p.rawAim===undefined||vec(p.rawAim))&&(p.assist===undefined||obj(p.assist)&&Object.keys(p.assist).every(k=>['mode','id','life'].includes(k))&&['tap','drag'].includes(p.assist.mode)&&str(p.assist.id,256)&&int(p.assist.life))&&(p.castId===undefined||typeof p.castId==='string'&&p.castId.length<=256),
 INPUT_BATCH:p=>Array.isArray(p.commands)&&p.commands.length>0&&p.commands.length<=4&&p.commands.every(c=>obj(c)&&Object.keys(c).every(k=>['seq','clientTick','move','aim','aimPower','steer','aspect'].includes(k))&&(c.steer===undefined||obj(c.steer)&&Object.keys(c.steer).length===1&&str(c.steer.castId,256))&&int(c.seq,1)&&int(c.clientTick)&&(c.aspect===undefined||num(c.aspect,.2,5))&&vec(c.move)&&vec(c.aim)&&num(c.aimPower??1,.18,1))
};
const keys={HELLO:['protocolVersion','contentHash','engineRevision','buildId'],AUTH:['secret'],CREATE:['name'],JOIN:['code','name'],RESUME:['token','cursor'],PING:['clientTime'],CONFIGURE:['mode','teamCount','matchSeconds','quizSeconds','rerollEvery','graphicsPreset','quizText','teams','mapIndex'],KICK:['playerId'],QUIZ_ANSWER:['questionId','attemptId','answerId'],DRAFT_RECOVER:['playerId'],DRAFT_REROLL:['draftRevision'],DRAFT_CONFIRM:['draftRevision'],AUGMENT_CHOOSE:['offerId','augmentId'],RESPAWN:['kind','questionId','answerId'],ACTION:['kind','seq','aim','aimPower','castId','rawAim','assist'],INPUT_BATCH:['commands']};
export function decodeClient(raw){
 if(typeof raw!=='string'||raw.length>262144)bad();let m;try{m=JSON.parse(raw);}catch{bad();}
 if(!obj(m)||!str(m.type,32)||!validators[m.type]||!obj(m.payload)||m.protocolVersion!==PROTOCOL_VERSION)bad();
 if(Object.keys(m).some(k=>!['type','protocolVersion','roomInstanceId','matchId','connectionEpoch','lifeSeq','requestId','payload'].includes(k)))bad();
 if(Object.keys(m.payload).some(k=>!(keys[m.type]||[]).includes(k)))bad();
 if(m.requestId!==undefined&&(!str(m.requestId,128)||!/^[\w:.-]+$/.test(m.requestId)))bad();
 for(const k of ['roomInstanceId','matchId'])if(m[k]!==undefined&&!str(m[k],128))bad();
 for(const k of ['connectionEpoch','lifeSeq'])if(m[k]!==undefined&&!int(m[k]))bad();
 if(!validators[m.type](m.payload))bad();return m;
}
export function matchesFingerprint(p){return Object.keys(fingerprint).every(k=>p[k]===fingerprint[k]);}
export function encode(message){return JSON.stringify(message);}
export function envelope(type,payload,scope={}){return {type,protocolVersion:PROTOCOL_VERSION,...scope,payload};}

