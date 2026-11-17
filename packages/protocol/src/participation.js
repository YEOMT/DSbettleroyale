const object=p=>!!p&&typeof p==='object'&&!Array.isArray(p);
const keys=(p,allowed)=>object(p)&&Object.keys(p).every(k=>allowed.includes(k));
const string=(s,n=256)=>typeof s==='string'&&s.length<=n;
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function validParticipation(p){
 if(!keys(p,['playerId','lifeSeq','state','summary'])||!string(p.playerId,64)||!p.playerId||!integer(p.lifeSeq)||!['active','respawn','eliminated'].includes(p.state))return false;
 if(p.summary===null)return p.state==='active';const s=p.summary;
 return keys(s,['id','playerId','lifeSeq','name','abilityId','emoji','team','level','kills','deaths','rank','tick','cause'])&&string(s.id)&&s.playerId===p.playerId&&integer(s.lifeSeq)&&s.lifeSeq<=p.lifeSeq&&string(s.name,24)&&string(s.abilityId,64)&&string(s.emoji,24)&&['team','level','kills','deaths','tick'].every(k=>integer(s[k]))&&(s.rank===null||integer(s.rank)&&s.rank>0)&&
  (s.cause===null||keys(s.cause,['kind','source','sourceName','ability','skill'])&&['kind','source','sourceName','ability','skill'].every(k=>string(s.cause[k],64)));
}
export function validResultPresentation(p,matchId){return keys(p,['id','matchId','kind','winnerId','winnerName','abilityId','emoji','finalizedTick','startedAt','showResultsAt','durationMs'])&&p.matchId===matchId&&p.kind==='last-survivor'&&string(p.id)&&string(p.winnerId,64)&&string(p.winnerName,24)&&string(p.abilityId,64)&&string(p.emoji,24)&&integer(p.finalizedTick)&&Number.isFinite(p.startedAt)&&p.durationMs===3500&&p.showResultsAt-p.startedAt===3500;}
