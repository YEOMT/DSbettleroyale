// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){

}
export const initializers=[
[309,__brScope=>{(function integrateReworkDefinitions(R){
    'use strict';
    const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
    const mod=(mods,key)=>Number.isFinite(Number(mods&&mods[key]))?Number(mods[key]):1;
    R.aimSpec=function(ability,kind,playerRadius,power,mods){
        const definition=R.defs[ability.id],s=definition.skill,caps=s.capabilities||s.caps||{};
        const size=mod(mods,'skillSize'),rangeScale=mod(mods,'signatureRange');
        let shape=s.shape||'line';
        if(shape==='self')shape='circle';
        if(shape==='rectangle')shape='rect';
        const spec={shape,label:s.label||ability.n,range:Math.max(0,finite(s.range))*rangeScale,width:Math.max(0,finite(s.width)||(['line','cone'].includes(shape)?finite(s.projectileRadius??s.radius)*2:0))*size,
            radius:Math.max(0,finite(s.radius))*size,impactRadius:Math.max(0,finite(s.impactRadius??s.explodeRadius??s.blastRadius??(s.kind==='fireball'?s.radius:0)))*size,
            halfAngle:Math.max(0,finite(s.halfAngle,.5)),rework:true,wallWarning:ability.id==='emoji-023'};
        if(s.shape==='self'){spec.scope='self';spec.range=0;if(!spec.radius)spec.radius=Math.max(24,finite(playerRadius,38));}
        if(shape==='circle'&&!spec.radius)spec.radius=spec.range||Math.max(24,finite(playerRadius,38));
        if(ability.id==='emoji-019'){spec.range=__brScope.brTrainDistance(power,rangeScale);spec.train=true;spec.dash=true;spec.speed=s.speed;spec.windup=s.windupFrames;}else if(__brScope.brSkillUsesAimDistance(s))spec.range*=__brScope.brSkillReachFraction(power);
        if(shape==='target'&&caps.dash)spec.teleport=s.kind!=='leap'&&s.kind!=='flight';
        if(shape==='dash'){spec.dash=true;spec.phases=!!s.airborne;}
        if(s.kind==='channel'||s.kind==='channel-beam'||s.kind==='continuous-laser'||s.beam){spec.beam=true;}
        if(s.spread&&finite(s.count,1)>1&&!['circle','target','rect','dash'].includes(shape)){
            const extra=caps.multicast?Math.min(3,Math.max(0,finite(mods?.skillCount))):0;
            const count=Math.min(finite(s.countCap??s.maxCount,99),finite(s.count,1)+extra);
            spec.shape='cone';spec.halfAngle=Math.abs(finite(s.spread))*(count-1)*.5+.025;
        }
        if(s.pullRadius)spec.pullRadius=finite(s.pullRadius)*size;
        if(s.burstRadius||s.collapseRadius)spec.burstRadius=finite(s.burstRadius??s.collapseRadius)*size;
        if(s.maxRadius)spec.maxRadius=finite(s.maxRadius)*size;
        return spec;
    };
    R.basicText=function(ability,mods,profile){
        const definition=R.defs[ability.id],basic=definition.basic||{};
        let text=basic.description||definition.basicSummary||'';
        if(!text)text=profile.close?'전방 근접 공격':ability.basicSummary||'일반 사격';
        const tags=[];
        if(!profile.close){
            tags.push(profile.count+'발');
            if(profile.type==='BOOMERANG')tags.push('왕복');
            if(profile.type==='missile')tags.push('유도');
            if(profile.pierce)tags.push('관통');
            if(profile.bounces)tags.push('벽 반사 '+profile.bounces+'회');
        }
        if(basic.lifesteal)tags.push('실제 HP 피해의 '+Math.round(basic.lifesteal*100)+'% 흡혈');
        return text+(tags.length?' · '+tags.join(' · '):'');
    };
    R.skillText=function(ability,mods){
        const definition=R.defs[ability.id],s=definition.skill,caps=s.capabilities||s.caps||{};
        const seconds=frames=>__brScope.brStatNumber(frames/60)+'초';
        let text=s.description||s.desc||definition.description||s.label||'고유 스킬';
        const changes=[],cd=finite(s.cooldownFrames??s.cooldown,600)*mod(mods,'skillCooldown');
        if(mod(mods,'skillCooldown')!==1)changes.push('대기 '+seconds(Math.round(cd)));
        if(caps.multicast&&finite(mods?.skillCount)>0){
            const count=Math.min(finite(s.countCap??s.maxCount,99),finite(s.count,1)+Math.min(3,Math.max(0,finite(mods.skillCount))));
            changes.push((s.pulses||s.waves?'파동당 ':'')+'현재 '+count+'발');
        }
        if(caps.damage&&s.kind!=='counter-immediate'&&(mod(mods,'skillDamage')!==1||mod(mods,'wangguiPower')!==1))changes.push('피해 '+__brScope.brStatNumber(mod(mods,'skillDamage')*mod(mods,'wangguiPower')*100)+'%');
        if(caps.expandable&&mod(mods,'skillSize')!==1)changes.push('크기 '+__brScope.brStatNumber(mod(mods,'skillSize')*100)+'%');
        if((caps.heal||caps.shield)&&mod(mods,'skillRestore')!==1)changes.push('회복·보호 '+__brScope.brStatNumber(mod(mods,'skillRestore')*100)+'%');
        const stun=finite(s.stunFrames??s.stun);
        if(stun>0&&mod(mods,'skillControl')!==1)changes.push('기절 '+seconds(Math.min(finite(s.stunCap,120),Math.round(stun*mod(mods,'skillControl')))));
        return text+(changes.length?' · 강화 적용: '+changes.join(' · '):'');
    };
})(__brScope.BRRework);}]
];
