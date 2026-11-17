// One bounded receipt per life. No positions, hidden traps or private builds.
export function captureDeathSummary(world,p){
 const c=p.lastDeathCause,source=c?.source?world.byId.get(c.source):null;
 p.deathSummary={id:world.matchId+':'+p.remoteId+':'+p.lifeSeq,playerId:p.remoteId,lifeSeq:p.lifeSeq,
  name:p.name,abilityId:p.ability.id,emoji:p.ability.e,team:p.team,level:p.run?.level||1,kills:p.kills||0,deaths:p.deaths||0,
  rank:world.session.roomMeta.mode==='solo'?world.game.participants.filter(q=>q.id!==999).sort(world.compareSurvivalOrder).indexOf(p)+1:null,tick:world.game.frame,
  cause:c?{kind:c.kind,source:c.source||'',sourceName:source?.name||'',ability:c.ability||'',skill:c.skill||''}:null};
 return p.deathSummary;
}
export function isPermanentlyEliminated(world,id){const p=world?.byId.get(id);return !!p&&!p.alive&&!world.session.respawnMode;}
export function getParticipation(world,id){
 const p=world?.byId.get(id);if(!p)return null;
 return {playerId:id,lifeSeq:p.lifeSeq,state:p.alive?'active':world.session.respawnMode?'respawn':'eliminated',summary:p.deathSummary||null};
}
