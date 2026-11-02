// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brSupportRadius = function brSupportRadius(a) {return ({TEAM_SANCTUARY:390,TEAM_HASTE_A:370,TEAM_RALLY:340,TEAM_BUGLE:325,TEAM_BELL:320})[a.sub]??0;};

__brScope.brCombatPower = function brCombatPower(p) { return p?.finalPhaseBoosted ? 1.08 : 1; };

__brScope.brEffectCast = function brEffectCast(source) { return source?._runSkillCast || null; };

__brScope.brApplyHealing = function brApplyHealing(target,amount,source,cast=__brScope.brEffectCast(source)) {
            if(!target?.alive||!Number.isFinite(amount)||amount<=0)return 0;
            const gained=Math.max(0,Math.min(target.maxHp-target.hp,amount*(cast?.restore??1)));
            target.hp+=gained;__brScope.BRCapture.support(typeof __brScope.game==='undefined'?null:__brScope.game,source,target,gained,'heal');return gained;
        };

__brScope.brApplyStun = function brApplyStun(target,frames,source,cast=__brScope.brEffectCast(source)) {
            if(!target?.alive||!__brScope.brCanHostileTarget(target,source))return;
            if(__brScope.BRRework)return __brScope.BRRework.nativeStun(target,frames,source,cast);
            target.stunned=Math.max(Number(target.stunned||0),__brScope.brRunCC(frames,cast?.control??1));
        };

__brScope.brApplyTimedEffect = function brApplyTimedEffect(target,key,frames,source,cast=__brScope.brEffectCast(source)) {
            if(!target?.alive)return;
            if(['stunned','blindedFrames','poisonFrames'].includes(key)&&!__brScope.brCanHostileTarget(target,source))return;
            target[key]=Math.max(Number(target[key]||0),Math.round(frames*(cast?.duration??1)));
        };

__brScope.brRefreshGuard = function brRefreshGuard(p,tick=false) {
            const layers=p.guardLayers;if(!layers)return;
            let strength=0,remaining=0;
            for(let i=layers.length-1;i>=0;i--){const layer=layers[i];if(tick)layer.frames--;
                if(layer.frames<=0){layers.splice(i,1);continue;}
                if(layer.strength>strength){strength=layer.strength;remaining=layer.frames;}
                else if(layer.strength===strength)remaining=Math.max(remaining,layer.frames);
            }
            p.teamGuardStrength=strength;p.teamGuardFrames=remaining;
        };

__brScope.brApplyGuard = function brApplyGuard(target,source,frames,strength,kind='skill',cast=__brScope.brEffectCast(source)) {
            if(!target?.alive)return;
            const duration=Math.max(1,Math.round(frames*(cast?.duration??1))),power=Math.min(.45,Math.max(0,strength*(cast?.restore??1)));
            if(!target.guardLayers){target.guardLayers=[];if(target.teamGuardFrames>0&&target.teamGuardStrength>0)target.guardLayers.push({key:'existing',frames:target.teamGuardFrames,strength:target.teamGuardStrength});}
            const layers=target.guardLayers,key=String(source?.remoteId??source?.id??'self')+':'+kind;
            // Dominated layers can be discarded. A weaker long buff cannot extend a strong short buff.
            for(let i=layers.length-1;i>=0;i--){const old=layers[i];if(old.key!==key)continue;
                if(old.strength>=power&&old.frames>=duration){__brScope.brRefreshGuard(target);return;}
                if(old.strength<=power&&old.frames<=duration)layers.splice(i,1);
            }
            layers.push({key,frames:duration,strength:power});__brScope.brRefreshGuard(target);
        };

__brScope.brCooldownRate = function brCooldownRate(p,kind) {
            if(__brScope.BRRework)return __brScope.BRRework.cooldownRate(p,kind);
            const team=p?.teamHasteFrames>0?1+Math.max(1,Number(p.teamHasteBonus||1)):1;
            return kind==='attack'?Math.max(team,p?.playerAttackHasteFrames>0?3:1):team;
        };

__brScope.brRunMod = function brRunMod(p,key,fallback=1) { const v=p?.run?.mods?.[key];return Number.isFinite(v)?v:fallback; };

__brScope.brWangguiPower = function brWangguiPower(owner,context=null,reflected=false) {
            if(!owner||owner.id===999||reflected||context?.reflected)return 1;
            return Number(context?.wangguiPower??context?.ctx?.run?.wangguiPower??context?.basicSnapshot?.ctx?.run?.wangguiPower??owner._runSkillCast?.wangguiPower??__brScope.brRunMod(owner,'wangguiPower'))||1;
        };

__brScope.brRunSkillSnapshot = function brRunSkillSnapshot(p) { return {wangguiPower:__brScope.brRunMod(p,'wangguiPower'),damage:__brScope.brRunMod(p,'skillDamage')*__brScope.brCombatPower(p),size:__brScope.brRunMod(p,'skillSize'),control:__brScope.brRunMod(p,'skillControl'),restore:__brScope.brRunMod(p,'skillRestore'),duration:Math.max(.5,__brScope.brRunMod(p,'signatureDuration')+__brScope.brRunMod(p,'skillDuration')-1),cooldown:__brScope.brRunMod(p,'skillCooldown')}; };

__brScope.brRunCount = function brRunCount(base,extra,cap=12) { return base+Math.min(3,Math.max(0,Math.floor(extra||0)),Math.max(0,cap-base)); };

__brScope.brRunCC = function brRunCC(base,mult=1) { return mult===1?base:Math.max(base,Math.min(90,Math.round(base*mult))); };

__brScope.brWithRunSkill = function brWithRunSkill(p,g,fn,snapshot=null,finishCast=true) {
            if(p._runSkillCast)return fn();
            const cast=snapshot||__brScope.brRunSkillSnapshot(p);p._runSkillCast=cast;
            const before=cast.control!==1?(g.participants||[]).filter(q=>q.alive&&q!==p&&!(p.team&&q.team===p.team)).map(q=>({p:q,vx:q.vel.x,vy:q.vel.y})):null;
            try{return fn();}finally{
                p._runSkillCast=null;
                if(before)for(const old of before){const q=old.p;if(q.alive)q.vel=new __brScope.Vec2(old.vx+(q.vel.x-old.vx)*cast.control,old.vy+(q.vel.y-old.vy)*cast.control);}
                if(finishCast&&p.alive){p.cooldown=Math.max(1,Math.round(p.cooldown*cast.cooldown*(p.cooldownRateMult||1)));p.skillCooldownMax=p.cooldown;p._runLastSkill=cast;}
            }
        };

__brScope.brRecordDeathCause = function brRecordDeathCause(target,attacker,context,direction,reflected,damage,shield,impact,close){
            if(!__brScope.game)return;const c=context||{},cast=c.ctx||c.basicSnapshot?.ctx,e=c.entity,periodic=!!c.periodic;
            const known=attacker&&attacker!==target&&attacker.id!==999,abilityId=String(cast?.abilityId||attacker?.ability?.id||'');
            const def=__brScope.BRRework?.defs[abilityId],basic=!!c.basic||c.actionKind==='attack'||cast?.actionKind==='attack'||attacker?.activeInputCommand?.kind==='attack',skillVerified=c.actionKind==='skill'||cast?.actionKind==='skill'||cast?.actionKind==='summon'||!!attacker?._runSkillCast||attacker?.activeInputCommand?.kind==='skill';
            const kind=c.attackKind==='zone'?'zone':reflected?'reflection':periodic?'dot':c.explodeRadius>0?'explosion':e?.kind==='beam'?'beam':e?.kind==='hook'?'hook':e||c.projectileId?'projectile':close?'melee':c.attackKind==='environment'?'environment':known?'direct':'unknown';
            const verified=direction&&Number.isFinite(direction.x)&&Number.isFinite(direction.y)&&Math.hypot(direction.x,direction.y)>.001&&!['zone','dot','reflection','environment','unknown'].includes(kind),n=verified?Math.hypot(direction.x,direction.y):1;
            const point=c.contact&&[c.contact.x,c.contact.y].every(Number.isFinite)?c.contact:target.pos;
            const receipt={v:1,match:__brScope.brRingKey(),target:String(target.remoteId||('player-'+target.id)),life:Number(target.lifeSeq||0),id:(__brScope.game.deathReceiptSeq=(__brScope.game.deathReceiptSeq||0)+1),frame:__brScope.game.frame,kind,damage,shield,lethal:true,
                source:known?String(attacker.remoteId||('player-'+attacker.id)):'',ability:known?abilityId:'',skill:known?(basic?'기본 공격':String(skillVerified?(def?.skill?.label||attacker.ability?.n||'공격'):'공격')).slice(0,64):'',cast:String(cast?.castId||c.attackId||'').slice(0,160),shot:String(e?.id||c.projectileId||'').slice(0,160),ordinal:Number(e?.ordinal??c.ordinal??0),
                x:point.x,y:point.y,dx:verified?direction.x/n:0,dy:verified?direction.y/n:0,impact:Math.max(1,Math.min(4,impact||1))};
            target.lastDeathCause=receipt; // exactly one last cause per participant, retained across lives for results
        };
}
export const initializers=[

];
