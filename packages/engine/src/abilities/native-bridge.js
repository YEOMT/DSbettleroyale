// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){

}
export const initializers=[
[308,__brScope=>{(function bridgeNativeCombat(R){
    'use strict';
    R.damageResolver=function(c,target,amount,opts){
        target.takeDamage(amount,c.owner,!!opts.reflected,opts.direction||c.aim,{...opts,scaled:true,rw:true,ctx:c});
        const result=target._lastDamageResult||{valid:false,hpDamage:0,shieldAbsorbed:0,killed:false};
        return {...result,absorbed:result.shieldAbsorbed||0};
    };
    R.nativeStun=function(target,frames,source,snapshot){
        if(!source||!__brScope.game||!target?.alive||!__brScope.brCanHostileTarget(target,source)||frames<=0)return false;
        const c=source._rwCast||R.context(source,__brScope.game,source.lastAimDir,1);
        if(snapshot)c.run={...c.run,...snapshot};
        return R.applyStun(c,target,frames,Math.min(120,Math.max(frames,frames*1.35)));
    };
    R.nativeImpulse=function(target,source,dir,strength,g,snapshot,options={}){
        if(!source||!target?.alive||!__brScope.brCanHostileTarget(target,source)||!strength)return false;
        const c=R.context(source,g,source.lastAimDir,1);c.run.control=1;
        // Native projectile/skill builders already scale their force once.
        return R.impulse(c,target,dir,strength,options);
    };
    R.onDeath=function(p,g){
        const fn=R.defs[p.ability.id]?.onDeath;
        if(fn){const c=R.context(p,g,p.lastAimDir,1);c.allowPosthumous=true;fn(c);}
    };
    R.nativeHoming=function(shot,g){
        const owner=shot.owner;if(!owner)return;
        const range=Math.min(1000,Math.max(200,shot.life*shot.vel.mag())),forward=shot.vel.norm(),cos=Math.cos(shot.homingCone??1.22);
        const valid=function(p){if(!p||!p.alive||p===owner||!__brScope.brCanHostileTarget(p,owner)||(owner.team&&owner.team===p.team)||p.invisible)return false;
            const d=p.pos.sub(shot.pos),length=d.mag();return length<=range&&(length<.001||(d.x*forward.x+d.y*forward.y)/length>=cos)&&!g.checkWallBetween(shot.pos,p.pos)&&!g.isConcealedFrom(p,{id:owner.id,team:owner.team,pos:shot.pos});};
        if(!valid(shot.homingTarget)||Number(shot.homingTargetLife)!==Number(shot.homingTarget?.lifeSeq||0))shot.homingTarget=null;
        if(g.frame>=shot.nextHomingRefresh){let target=null,best=Infinity;for(const p of g.getNearbyParticipants(shot.pos,range+140)){if(!valid(p))continue;const d=p.pos.dist(shot.pos);if(d<best){best=d;target=p;}}
            shot.homingTarget=target;shot.homingTargetLife=Number(target?.lifeSeq||0);shot.nextHomingRefresh=g.frame+g.getHomingRefreshCadence()+Math.abs(owner.id||0)%3;}
        if(shot.homingTarget){const desired=shot.homingTarget.pos.sub(shot.pos),angle=Math.atan2(shot.vel.y,shot.vel.x),target=Math.atan2(desired.y,desired.x);let delta=(target-angle+Math.PI*3)%(Math.PI*2)-Math.PI;
            delta=Math.max(-shot.homingTurnRate,Math.min(shot.homingTurnRate,delta));shot.vel=new __brScope.Vec2(Math.cos(angle+delta),Math.sin(angle+delta)).mult(shot.vel.mag());}
    };
    R.nativeProjectileContacts=function(g,shot,from,to,wall,contacts){
        const candidates=R.projectileTurretHit(g,shot,from,to,wall,[]);
        for(const item of candidates)contacts.push({rwTurret:item.turret,t:item.t});
    };
    R.nativeProjectileTurretHit=function(g,shot,turret,pos){
        if(turret.dead||turret.hp<=0)return false;
        shot._rwTurretHits=shot._rwTurretHits||new Set();shot._rwTurretHits.add(turret.id);shot.pos=new __brScope.Vec2(pos.x,pos.y);
        if(shot.playerSkillBlast){shot.detonatePlayerSkill(g);return true;}
        if(shot.explodeRadius>0)R.nativeAreaTurrets(g,shot.owner,pos,shot.explodeRadius,shot.damage,{scaled:true,wangguiPower:shot.wangguiPower});
        else R.damageTurret(turret,shot.owner,shot.damage*__brScope.brWangguiPower(shot.owner,{wangguiPower:shot.wangguiPower}),g);
        g.emitStudentFx('hit',pos,{size:Math.max(28,shot.size*2),color:shot.color||'#fff',amount:shot.damage,sourceId:shot.owner.remoteId||'',style:'turret-hit'});
        if(!shot.pierce&&shot.type!=='ORBIT'&&shot.type!=='BOOMERANG'){shot.life=0;return true;}return false;
    };
    R.nativeMeleeTurrets=function(g,p,aim,range,halfAngle,damage,ctx={scaled:true},limit=Infinity){
        const c=R.context(p,g,aim,1);let count=0;
        for(const turret of R.turrets(g,p.pos,range+50)){
            if(turret.owner===p||p.team&&turret.team===p.team||!__brScope.brSectorTouches(p.pos,turret,aim,range,halfAngle,1)||g.checkWallBetween(p.pos,turret.pos))continue;
            const amount=ctx?.scaled===false?damage*(p._runSkillCast?.damage??1):damage;
            R.damageTurret(turret,p,amount*__brScope.brWangguiPower(p,ctx),g);g.emitStudentFx('hit',turret.pos,{size:45,color:'#fff',amount,sourceId:p.remoteId||'',style:'turret-melee'});
            if(++count>=limit)break;
        }return count;
    };
    R.nativeAreaTurrets=function(g,owner,pos,radius,damage,context){
        if(!owner||damage<=0)return;
        const amount=context?.scaled?damage:damage*(owner._runSkillCast?.damage??1);
        for(const turret of R.turrets(g,pos,radius+40))if(turret.pos.dist(pos)<=radius+turret.radius&&!g.checkWallBetween(pos,turret.pos))R.damageTurret(turret,owner,amount*__brScope.brWangguiPower(owner,context),g);
    };
    R.nativeLineTurrets=function(g,owner,from,to,width,damage,token){
        if(!owner||damage<=0)return;const delta=to.sub(from),length=delta.mag(),mid=from.add(to).mult(.5);
        for(const turret of R.turrets(g,mid,length*.5+width+40)){
            const t=__brScope.combatSegmentCircleTime(from.x-turret.pos.x,from.y-turret.pos.y,delta.x,delta.y,width*.5+turret.radius);
            if(t!==null&&!g.checkWallBetween(from,turret.pos))R.damageTurret(turret,owner,damage*(owner._runSkillCast?.damage??1)*__brScope.brWangguiPower(owner),g,token);
        }
    };
})(__brScope.BRRework);}]
];
