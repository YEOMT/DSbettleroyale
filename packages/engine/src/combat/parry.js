// A one-contact, life-scoped defense. It reuses the original projectile rather
// than manufacturing damage or another projectile on reflection.
export function parryActive(p,g){
 if(p?.ability?.id!=='emoji-092'||!p.alive||p.hp<=0||p.stunned>0||p.rw?.life!==p.lifeSeq||p.rw.force)return null;
 return p.rw.buffs.find(b=>b.kind==='panParry'&&b.end>g.frame&&b.ctx.ownerLifeSeq===p.lifeSeq&&b.ctx.matchKey===g.rw?.matchKey)||null;
}
function eligible(S,g,p,source,dx,dy){
 const b=parryActive(p,g),length=Math.hypot(dx,dy);
 if(!b||!source?.alive||source===p||!S.brCanHostileTarget(p,source)||!S.BRRework.hostile(b.ctx,source)||!S.BRRework.visible(b.ctx,source)||
    length<.00001||(dx*b.ctx.aim.x+dy*b.ctx.aim.y)/length<Math.cos(b.extra.halfAngle))return null;
 return b;
}
function consume(S,g,p,b,pos){
 p.rw.buffs=p.rw.buffs.filter(x=>x.ctx.castId!==b.ctx.castId);
 for(const e of g.rw.entities)if(e.kind==='guard'&&e.ctx.castId===b.ctx.castId)S.BRRework.end(e,'consumed');
 g.emitStudentFx?.('impact',pos,{size:44,color:'#e2e8f0',style:'pan-contact',sourceId:p.remoteId,
  dx:b.ctx.aim.x,dy:b.ctx.aim.y,geometry:{confirmed:true,kind:'skill',seq:b.ctx.actionSeq,castId:b.ctx.castId,effectId:b.ctx.castId+':parry',lifeSeq:p.lifeSeq,displayMs:260}});
}
export function parryProjectile(S,g,shot,p,velocity,pos){
 if(!p||shot.reflectedOnce)return false;
 const b=eligible(S,g,p,shot.owner,-velocity.x,-velocity.y);
 if(!b)return false;
 consume(S,g,p,b,pos||p.pos);return true;
}
export function parryMelee(S,g,p,attacker,hp,absorbed,context,reflected){
 if(!g||reflected||context?.periodic||context?.secondary||context?.visualPeriodic||context?.rangedProjectile||context?.ctx?.rangedProjectile||hp+absorbed<=0)return;
 const melee=context?.basic?S.brBasicCombatProfile(attacker?.ability||{}).close:context?.meleeContact===true;
 if(!melee)return;
 const b=eligible(S,g,p,attacker,attacker.pos.x-p.pos.x,attacker.pos.y-p.pos.y);
 if(!b)return;
 consume(S,g,p,b,context?.contact||p.pos);
 // Consume before recursion; final formula is not run/왕귀-scaled a second time.
 S.BRRework.hit(b.ctx,attacker,Math.min(55,20+.4*hp),{scaled:true,reflected:true,knockback:4,stun:0,style:'pan-counter'});
}
