// Presentation classification only, never consulted by damage/control rules.
export const heavySkill=id=>({'emoji-025':'fist','emoji-042':'hammer','emoji-034':'bowling','emoji-019':'train'})[id]||'';
export function wallFeedback(g,p,q,contact){
 const c=q.ctx,profile=heavySkill(c.abilityId);
 if(!profile||c.actionKind!=='skill'||q.visualWallDone||!contact)return;
 // Collision normal comes from the existing sweep, not proximity to a wall.
 if(q.x*contact.nx+q.y*contact.ny>=-.15)return;
 q.visualWallDone=true;const dx=-contact.nx,dy=-contact.ny;
 g.emitStudentFx?.('impact',{x:p.pos.x+dx*p.radius,y:p.pos.y+dy*p.radius},{dx,dy,size:28,color:'#e2e8f0',
  style:'heavy-wall',sourceId:c.ownerId,targetId:p.remoteId,geometry:{confirmed:true,stage:'wall',profile,displayMs:150,
   lifeSeq:c.ownerLifeSeq,targetLife:p.lifeSeq,castId:c.castId}});
}
