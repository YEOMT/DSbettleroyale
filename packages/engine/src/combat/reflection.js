import {activeSupply} from '../farm/combat-supplies.js';

const sniperIds=new Set(['emoji-023','emoji-074','emoji-137']);
export const sniperChances=Object.freeze({S:.6,A:.5,B:.4,C:.3,F:.3});
export function sniperChance(ability){return sniperIds.has(ability.id)?sniperChances[ability.t]:0;}
export function sniperCast(S,ability){
    const chance=sniperChance(ability);
    if(chance)return {critical:S.rand()<chance,shown:false};
}
export function criticalContact(cast,g,target,owner){
    if(!cast?.critical||cast.shown||!target._lastDamageResult?.valid)return;
    if(!(target._lastDamageResult.hpDamage||target._lastDamageResult.shieldAbsorbed))return;
    cast.shown=true;
    g.emitStudentFx?.('impact',target.pos,{style:'sniper-critical',size:36,color:'#fde047',
        sourceId:owner.remoteId,targetId:target.remoteId,geometry:{confirmed:true,displayMs:260,targetLife:target.lifeSeq,lifeSeq:owner.lifeSeq}});
}

export function placeMirror(S,c,skill){
    const list=c.g.rw.mirrors??=[];
    const pos=c.owner.pos.add(c.aim.mult(skill.range));
    const surface={x:pos.x,y:pos.y,w:skill.width,h:skill.length,angle:Math.atan2(c.aim.y,c.aim.x)};
    const e=S.BRRework.entity(c,'mirror',{pos,dir:c.aim,width:skill.width,length:skill.length,radius:skill.length/2,
        duration:skill.durationFrames,color:'#dbeafe',maxPerOwner:1,cancelOnStun:false,onEnd(){
            const i=list.indexOf(surface);if(i>=0)list.splice(i,1);
            S.combatWallGridCache.delete(list);
        }});
    surface.entity=e;surface.single=[surface];list.push(surface);S.combatWallGridCache.delete(list);
}

export function ironActive(p,tick){
    return p?.ability?.id==='emoji-028'&&p.rw?.life===(p.lifeSeq||0)&&p.rw.buffs.some(b=>b.kind==='ironReflect'&&b.end>tick);
}

// Ordinary shots take the empty-list fast path. The index contains only live
// projectile barriers, separate from player movement and ordinary solid cover.
export function addMirrorContacts(S,g,shot,from,to,r,wall,contacts){
    const list=g.rw?.mirrors;
    if(!list?.length||shot.reflectedOnce)return;
    const scratch=shot.mirrorScratch??=[];
    const surfaces=S.combatWallCandidates(list,Math.min(from.x,to.x)-r,Math.min(from.y,to.y)-r,
        Math.max(from.x,to.x)+r,Math.max(from.y,to.y)+r,scratch);
    for(const surface of surfaces){
        const e=surface.entity,owner=e.ctx.owner,dir=e.dir;
        if(e.dead||e.end<=g.frame||!owner.alive||owner.lifeSeq!==e.ctx.ownerLifeSeq||
            owner===shot.owner||(owner.team&&owner.team===shot.owner.team))continue;
        if((to.x-from.x)*dir.x+(to.y-from.y)*dir.y>=0||
            (from.x-e.pos.x)*dir.x+(from.y-e.pos.y)*dir.y<0)continue;
        const hit=S.combatTraceWalls(from,to,r,surface.single);
        if(hit?.wall===surface&&(!wall||hit.t<wall.t))contacts.push({mirror:owner,t:hit.t});
    }
}

// Walls win equal times (filtered before insertion), then crates, mirrors,
// and actors. Explicit IDs break ties without depending on grid traversal.
function order(h){return h.farm?0:h.mirror?1:2;}
export function contactOrder(a,b){
    const tie=a.t-b.t||order(a)-order(b);
    if(tie)return tie;
    const left=(a.mirror||a.p||a.farm||a.rwTurret).id,right=(b.mirror||b.p||b.farm||b.rwTurret).id;
    if(typeof left==='number'&&typeof right==='number')return left-right;
    return String(left).localeCompare(String(right),'en');
}
function targetVisible(g,source,life,from,owner){
    return source?.alive&&source.connected!==false&&source.lifeSeq===life&&!source.invisible&&
        !g.isConcealedFrom?.(source,{pos:from,team:owner.team,id:owner.id})&&!g.checkWallBetween(from,source.pos);
}
export function reflectedDirection(S,g,shot,pos,velocity,defender,mirror){
    const source=shot.owner,life=source.lifeSeq,d=velocity.norm();
    const visible=targetVisible(g,source,life,pos,defender);
    let dir=visible?source.pos.sub(pos):d.mult(-1);
    if(dir.mag()<.001)dir=d.mult(-1);
    shot.reflectedOnce=true;
    if(mirror&&visible)shot.returnTarget={source,life};
    shot.returnSupply=shot.launchSupply??1;
    // Keep a bounded contact cue even when a whole classroom hits one surface.
    if(g.frame>=(defender.nextReflectionFx??0)){
        defender.nextReflectionFx=g.frame+5;
        g.emitStudentFx?.('impact',pos,{size:24,color:'#a5f3fc',style:'mirror-contact',sourceId:defender.remoteId});
    }
    return dir.norm();
}
export function steerReturn(g,shot,dir){
    const target=shot.returnTarget;
    if(!target)return dir;
    if(!targetVisible(g,target.source,target.life,shot.pos,shot.owner)){shot.returnTarget=null;return dir;}
    const delta=target.source.pos.sub(shot.pos),angle=Math.atan2(delta.y,delta.x)-Math.atan2(dir.y,dir.x);
    return dir.rotate(Math.max(-.045,Math.min(.045,Math.atan2(Math.sin(angle),Math.cos(angle)))));
}
export function launchSupply(owner,tick){return activeSupply(owner,tick)?.kind==='attack'?1.45:1;}
