// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brTierValue = function brTierValue(tier,values) { return Number(values[tier]==null?values.C:values[tier]); };

__brScope.brRangedPowerProfile = function brRangedPowerProfile(ability) {
            var tier=ability.t||'C',style=__brScope.getRangedWeaponStyle(ability),scale=__brScope.brTierValue(tier,{S:1,A:.92,B:.84,C:.76,F:.65});
            var concept=style==='sniper'?'sniper':style==='bomber'?'bomber':style==='heavy'?'heavy':'plasma';
            var data={sniper:[1540,38,31,104,1.12,36,'폭발 저격'],bomber:[880,20,52,260,.93,56,'충격 폭탄'],heavy:[1120,27,44,206,1.04,47,'중력 포격'],plasma:[1180,30,37,170,1,40,'플라즈마 탄']}[concept];
            return {style:'skill-'+concept,concept:concept,label:data[6],range:Math.round(data[0]*scale),speed:data[1]*(.65+.35*scale),
                size:Math.round(data[2]*(.7+.3*scale)),blast:Math.round(data[3]*(.68+.32*scale)),
                damage:Math.round(__brScope.brTierValue(tier,{S:80,A:70,B:60,C:49,F:38})*data[4]),push:data[5]*(.65+.35*scale),
                color:ability.pTrail||__brScope.BR_TIER_COLOR[tier]||'#67e8f9'};
        };

__brScope.brGetPlayableSkillInfo = function brGetPlayableSkillInfo(ability) {
            var rework=__brScope.brReworkDefinition(ability),skill=rework&&rework.skill;
            if(skill)return {key:'rework',reworkKey:skill.key||skill.kind||ability.id,label:skill.label||ability.n,desc:skill.description||skill.desc||rework.description||'',cooldown:Number(skill.cooldownFrames??skill.cooldown??600)};
            if(!ability||__brScope.isTeamSupportAbility(ability))return null;
            var tier=ability.t||'C',type=ability.type,sub=ability.sub||'',extra=__brScope.brTierValue(tier,{S:0,A:45,B:90,C:135,F:180});
            function info(key,label,desc,cd){return {key:key,label:label,desc:desc,cooldown:cd+extra};}
            if((ability.combat&&ability.combat.skill==='counter')||sub==='REFLECT'||sub==='SPIKE_REFLECT')return info('guard-counter',sub==='REFLECT'||sub==='SPIKE_REFLECT'?'방패 반격':'프라이팬 반격','짧게 방어하며 받은 피해를 되돌림',720);
            if(sub==='SLIP')return info('slip-dash','비눗길','조준 방향으로 짧게 미끄러져 회피',600);
            if(sub==='STONE')return info('guard-pulse','철괴','주변을 밀어내고 잠시 피해를 줄임',720);
            if(sub==='SLOW_TANK')return info('guard-shell','등껍질 가드','2초간 피해를 줄여 버팀',660);
            if(type===__brScope.ABILITY_TYPES.PROJ||type===__brScope.ABILITY_TYPES.LASER||type===__brScope.ABILITY_TYPES.ORBIT)
                return info('native',ability.skillLabel||({SWORD_ORBIT:'검무 전개',GEAR_ORBIT:'톱니 전개',TORNADO_ORBIT:'회오리 전개',ROLLING_BLADE:'회전 바퀴',SNIPE:'정밀 저격',ARCANE_BARRAGE:'마력 탄막',NOVA:'별빛 난사',VOID_DESTRUCTION:'공허 광선'})[sub]||'고유 스킬',ability.skillDesc||ability.desc||'고유 능력을 사용',sub==='SNIPE'?1050-extra:sub==='AIMED_SHOT'?1080-extra:type===__brScope.ABILITY_TYPES.ORBIT?810:900);
            if(type===__brScope.ABILITY_TYPES.TELEPORT) {
                if(sub==='THUNDER')return info('teleport-thunder','낙뢰 강림','순간이동 후 착지 주변에 낙뢰',900);
                if(sub==='DIVE_LAVA')return info('teleport-lava','용암 강하','순간이동 후 착지 지점에 용암',960);
                return info('teleport-assassin','그림자 기습','순간이동 후 가장 가까운 적을 처형',810);
            }
            if(type===__brScope.ABILITY_TYPES.DASH)return null; // Native dash retains trail/contact mechanics.
            if(__brScope.isTankAbility(ability)&&type===__brScope.ABILITY_TYPES.MELEE&&!['HAMMER','HEAVY_PUNCH','VAMPIRE_SLASH','SCISSOR_DASH','SOUL_CLEAVE'].includes(sub)) {
                if(sub==='TANK_RHINO')return info('tank-charge','철벽 돌진','충돌로 진입한 뒤 짧게 방어',780);
                if(sub==='TANK_TURTLE'||sub==='TANK_CRAB')return info('tank-stun','대지 진압','주변을 밀어내고 짧게 방어',900);
                return info('tank-punch','초중량 펀치','전방 한 명을 멀리 날리고 짧게 방어',750);
            }
            if(type===__brScope.ABILITY_TYPES.MELEE) {
                if(sub==='HEAVY_PUNCH'||sub==='HAMMER')return info('melee-uppercut',sub==='HAMMER'?'망치 충격':'어퍼컷',sub==='HAMMER'?'전방 한 명을 확실하게 기절':'전방 한 명을 크게 밀어냄',750);
                if(sub==='VAMPIRE_SLASH')return info('melee-drain','피의 갈증','흡혈 베기 · 저체력 광란 중 연속 흡혈',810);
                if(sub==='SCISSOR_DASH')return info('melee-combo','연속 가위질','앞의 적을 베고 짧은 연속타로 압박',810);
                return info('melee-lunge',sub==='SOUL_CLEAVE'?'영혼 진입':'순간 진입',sub==='SOUL_CLEAVE'?'짧게 진입하고 적중하면 방어':'짧게 질주하며 진로의 적을 베기',690);
            }
            return null;
        };

__brScope.brSupportProfile = function brSupportProfile(a) {
            const radius=__brScope.brSupportRadius(a);return {global:radius===0,radius};
        };

__brScope.brOrbitDisplay = function brOrbitDisplay(a,radius,mods={}) {
            const sword=a.sub==='SWORD_ORBIT',wind=a.sub==='TORNADO_ORBIT';
            return {radius:radius+(sword?48:wind?44:50)+(sword?28:wind?29:30)*Number(mods.skillSize||1),range:sword?285:wind?330:260};
        };

__brScope.brBasicCombatProfile = function brBasicCombatProfile(ability) {
            var rework=__brScope.brReworkDefinition(ability);
            if(ability._basicIdentity&&ability._basicIdentityDefinition===rework)return ability._basicIdentity;
            var tier=ability.t||'C',sub=ability.sub||'',close=typeof rework?.basic?.close==='boolean'?rework.basic.close:([__brScope.ABILITY_TYPES.MELEE,__brScope.ABILITY_TYPES.ORBIT,__brScope.ABILITY_TYPES.DASH,__brScope.ABILITY_TYPES.TELEPORT,__brScope.ABILITY_TYPES.PULL].includes(ability.type)||((sub==='REFLECT'||sub==='SLOW_TANK')&&__brScope.isTankAbility(ability)));
            var base=__brScope.getRangedCombatProfile(ability,'basic'),p={close:close,rangeBonus:86,halfAngle:Math.acos(.05),cooldownScale:1,damageScale:1,pushScale:1,stun:0,reward:'',style:'slash'};
            if(close) {
                if(sub==='HEAVY_PUNCH'||sub==='TANK_GORILLA')Object.assign(p,{halfAngle:1.02,cooldownScale:1.15,damageScale:1.15,style:'punch'});
                else if(sub==='HAMMER')Object.assign(p,{rangeBonus:92,halfAngle:.96,cooldownScale:1.18,damageScale:1.08,pushScale:.8,stun:11,style:'hammer'});
                else if(__brScope.isTankAbility(ability)&&!['VAMPIRE_SLASH','SCISSOR_DASH','SOUL_CLEAVE'].includes(sub))Object.assign(p,{halfAngle:1.22,pushScale:.62,stun:5,reward:'guard',style:'punch'});
                else if(sub==='VAMPIRE_SLASH')Object.assign(p,{cooldownScale:.91,damageScale:.91,pushScale:.26,stun:3,reward:'drain'});
                else if(sub==='SCISSOR_DASH')Object.assign(p,{halfAngle:1.14,cooldownScale:.84,damageScale:.84,pushScale:.22,stun:3,reward:'chase',style:'scissor'});
                else if(sub==='SOUL_CLEAVE')Object.assign(p,{halfAngle:1.24,pushScale:.35,stun:4,reward:'guard',style:'soul'});
                else if(ability.type===__brScope.ABILITY_TYPES.TELEPORT)Object.assign(p,{halfAngle:.95,cooldownScale:1.08,damageScale:1.08,pushScale:.27,stun:3});
                else Object.assign(p,{pushScale:.40,stun:4,reward:ability.type===__brScope.ABILITY_TYPES.MELEE?'chase':''});
            } else {
                Object.assign(p,base,{emoji:__brScope.getIdentityProjectileEmoji(ability),type:'bullet',count:1,spread:0,pierce:false,bounces:0,explode:0,status:null,statusPower:0,spin:Number(ability.spinRate||0),face:!!ability.faceDir});
                if(ability.projType==='BOOMERANG'||sub==='BOOMERANG')Object.assign(p,{type:'BOOMERANG',style:'boomerang',damageScale:base.damageScale*.70});
                else if(ability.projType==='missile'||sub==='GHOST_MOVE')Object.assign(p,{type:'missile',style:'homing'});
                else if(Number(ability.pBounce||0)>0)Object.assign(p,{bounces:Math.min(2,Number(ability.pBounce)),pierce:!!ability.pierce,style:'bounce'});
                else if(ability.pierce||sub==='AIMED_SHOT')Object.assign(p,{pierce:true,style:'pierce'});
                else if(base.style==='bomber')Object.assign(p,{explode:Math.min(60,base.explodeRadius*.72),style:'bomber'});
                else if(Number(ability.pCount||0)>=2&&base.style!=='machine')Object.assign(p,{count:Math.min(3,Number(ability.pCount)),spread:.13,style:'spread'});
                if(sub==='STING'||ability.pStatus==='poison')Object.assign(p,{status:'poison',statusPower:54});
                // Split the existing damage budget over the spread; extra glyphs are real shots, not decorative particles.
                p.damageScale/=p.count;
            }
            if(rework?.basic)Object.assign(p,rework.basic);
            // All basic attacks retain impact feedback without hidden control locks.
            p.stun=0;
            if(p.close){p.damageScale*=1.08;p.pushScale*=1.20;p.pushScale*=__brScope.brFeelBasicPushScale(ability,p);}
            const closeBalance=__brScope.brCloseBalance(ability,p.close);if(closeBalance)p.damageScale*=closeBalance.damage;
            // Basic profile is never used by the three skill bats or the shared pDmg stat.
            if(ability.id==='emoji-036')p.damageScale*=.70;
            if(ability.id==='emoji-077')p.damageScale*=1.12;
            Object.defineProperty(ability,'_basicIdentityDefinition',{value:rework,configurable:true,writable:true});
            Object.defineProperty(ability,'_basicIdentity',{value:p,configurable:true,writable:true});return p;
        };

__brScope.brRunClientMods = function brRunClientMods(){return __brScope.session.selfRun&&__brScope.session.selfRun.mods||__brScope.brRunNeutralMods;};

__brScope.brRunBasicProfile = function brRunBasicProfile(ability,mods){
            var base=__brScope.brBasicCombatProfile(ability);if(!mods)return base;
            var cached=__brScope.brRunBasicCache.get(mods);if(cached&&cached.ability===ability&&cached.definition===__brScope.brReworkDefinition(ability))return cached.profile;
            var p=Object.assign({},base);
            p.damageScale*=Number(mods.basicDamage||1);
            if(p.close)p.pushScale*=Number(mods.basicKnockback||1);
            else{
                p.count=__brScope.brRunCount(p.count,mods.basicCount,6);
                if(p.count>base.count&&!p.spread)p.spread=.10;
                p.speed*=Number(mods.basicVelocity||1);p.knockback*=Number(mods.basicKnockback||1);
            }
            __brScope.brRunBasicCache.set(mods,{ability:ability,definition:__brScope.brReworkDefinition(ability),profile:p});return p;
        };

__brScope.brRunCapabilities = function brRunCapabilities(a){
            var rework=__brScope.brReworkDefinition(a),cached=__brScope.brRunCapabilityCache.get(a);
            if(cached&&cached.definition===rework)return cached.capabilities;
            if(rework?.skill){
                var profile=__brScope.brBasicCombatProfile(a),skill=rework.skill,declared=skill.capabilities||skill.caps||{};
                var sc=Object.assign({damage:false,projectile:false,multicast:false,expandable:false,area:false,cc:false,heal:false,shield:false,dash:false,summon:false,trap:false,duration:false,utility:false},declared);
                var range=!!(declared.signatureRange??rework.signature?.range??sc.dash),duration=!!(declared.signatureDuration??rework.signature?.duration??sc.duration);
                var result={basic:{melee:!!profile.close,projectile:!profile.close,knockback:profile.close?Number(profile.pushScale||0)>0:Number(profile.knockback||0)>0},skill:sc,signature:{range:range,duration:duration},signatureRange:range,signatureDuration:duration};
                __brScope.brRunCapabilityCache.set(a,{definition:rework,capabilities:result});return result;
            }
            var basic=__brScope.brBasicCombatProfile(a),info=__brScope.brGetPlayableSkillInfo(a),key=info&&info.key||'native',type=a.type,sub=a.sub||'';
            var projectile=key==='ranged-power'||(key==='native'&&type===__brScope.ABILITY_TYPES.PROJ&&sub!=='SNIPE');
            var area=key==='tank-stun'||key==='tank-punch'||key==='melee-uppercut'||key==='melee-combo'||key==='melee-drain'||key.indexOf('teleport-')===0||
                (key==='native'&&(type===__brScope.ABILITY_TYPES.ZONE||type===__brScope.ABILITY_TYPES.AREA||type===__brScope.ABILITY_TYPES.ORBIT||sub==='VOID_DESTRUCTION'||__brScope.TRAIL_DASH_SUBS.has(sub)));
            var dash=key==='slip-dash'||key==='tank-charge'||key==='melee-lunge'||key.indexOf('teleport-')===0||type===__brScope.ABILITY_TYPES.DASH;
            var heal=key==='melee-drain'||['REGEN','VOID_DESTRUCTION','MULTI_GRAB','TEAM_SANCTUARY','TEAM_MEDIC','TEAM_BLOOM','TEAM_GUARD','TEAM_TONIC','TEAM_RALLY','TEAM_CLOVER','TEAM_BANDAGE'].includes(sub);
            var shield=key.indexOf('guard-')===0||key.indexOf('tank-')===0||['SOUL_CLEAVE','KINETIC_CHARGE','TEAM_SANCTUARY','TEAM_GUARD','TEAM_BARRIER','TEAM_BELL'].includes(sub);
            var damage=projectile||area||key==='tank-charge'||key==='melee-lunge'||key==='guard-counter'||
                (key==='native'&&([__brScope.ABILITY_TYPES.PROJ,__brScope.ABILITY_TYPES.LASER,__brScope.ABILITY_TYPES.ORBIT,__brScope.ABILITY_TYPES.DASH,__brScope.ABILITY_TYPES.AREA,__brScope.ABILITY_TYPES.TURRET].includes(type)||['ABDUCT','MULTI_GRAB','GHOST_MOVE'].includes(sub)));
            var cc=damage||key==='guard-pulse'||type===__brScope.ABILITY_TYPES.PULL;
            if(key==='guard-counter')cc=false;
            var duration=type===__brScope.ABILITY_TYPES.ZONE||type===__brScope.ABILITY_TYPES.ORBIT||type===__brScope.ABILITY_TYPES.TURRET||sub==='GHOST_MOVE'||shield||['TEAM_HASTE_A','TEAM_BUGLE'].includes(sub)||key==='ranged-sprint'||key==='ranged-overdrive';
            var capabilities={basic:{melee:basic.close,projectile:!basic.close,knockback:basic.close||basic.knockback>0},
                skill:{damage:damage,projectile:projectile,multicast:projectile,expandable:projectile||area,area:area,cc:cc&&sub!=='TINY_FLAME',heal:heal,shield:shield,dash:dash,summon:type===__brScope.ABILITY_TYPES.TURRET||type===__brScope.ABILITY_TYPES.CLONE,trap:type===__brScope.ABILITY_TYPES.ZONE,duration:duration,utility:!damage},
                signature:{range:dash,duration:duration},signatureRange:dash,signatureDuration:duration};
            __brScope.brRunCapabilityCache.set(a,{definition:rework,capabilities:capabilities});return capabilities;
        };

__brScope.brBasicAttackFrames = function brBasicAttackFrames(ability,mods) {
            var override=__brScope.brReworkDefinition(ability)?.basic?.cooldownFrames;
            if(Number.isFinite(override)&&override>0)return Math.max(6,Math.round(override/Number((mods||{}).basicSpeed||1)));
            var cd=({S:34,A:38,B:43,C:48,F:56}[ability.t]||46)+Math.abs(__brScope.abilityTimingHash((ability.timingSeed||ability.n||'emoji')+'|basic'))%11-5;
            var close=[__brScope.ABILITY_TYPES.MELEE,__brScope.ABILITY_TYPES.ORBIT,__brScope.ABILITY_TYPES.DASH,__brScope.ABILITY_TYPES.TELEPORT,__brScope.ABILITY_TYPES.PULL].includes(ability.type);
            var base=Math.max(12,Math.round(cd*__brScope.brBasicCombatProfile(ability).cooldownScale));
            return Math.max(6,Math.round(base/Number((mods||{}).basicSpeed||1)));
        };

__brScope.brBasicShotSize = function brBasicShotSize(ability,rendered,mods={}) {
            var override=__brScope.brReworkDefinition(ability)?.basic?.size;
            var profile=__brScope.brRunBasicProfile(ability,mods);
            var style=__brScope.getRangedCombatProfile(ability,'basic').style;
            var size={S:13,A:12,B:11,C:10,F:8}[ability.t]*(style==='heavy'?1.18:style==='bomber'?1.28:style==='sniper'?.82:1);
            if(Number.isFinite(override)&&override>0)size=override;
            const rankScale=ability.type===__brScope.ABILITY_TYPES.PROJ?(ability.t==='S'?1.14:ability.t==='A'?1.08:1):1;
            const eligible=!profile.close&&profile.count===1&&profile.type==='bullet'&&!profile.pierce&&!profile.bounces&&!profile.explode&&size*rankScale<=11;
            if(eligible)size*=1.15;
            return size*(rendered?rankScale:1);
        };

__brScope.brBasicStepDistance = function brBasicStepDistance(ability,mods,haste) {
            // A short attack step, not a skill dash: no damage, velocity, CC or wall phasing.
            if(!__brScope.brBasicCombatProfile(ability).close||[__brScope.ABILITY_TYPES.ORBIT,__brScope.ABILITY_TYPES.PULL].includes(ability.type))return 0;
            var distance=__brScope.isTankAbility(ability)?8:__brScope.brAbilityCategory(ability)==='암살자'?16:12;
            // Rapid/haste builds keep their full attack rate without turning taps into a travel skill.
            return distance*Math.min(1,__brScope.brBasicAttackFrames(ability,mods)/(typeof haste==='number'?haste:haste?3:1)/24);
        };

__brScope.brMoveBasicStep = function brMoveBasicStep(pos,aim,distance,radius,walls,worldRadius,center,reuse) {
            var moved=__brScope.combatMoveCircle(pos,{x:aim.x*distance,y:aim.y*distance},radius,walls||[],true,reuse);
            var cx=Number(center&&center.x||0),cy=Number(center&&center.y||0),dx=moved.x-cx,dy=moved.y-cy,d=Math.hypot(dx,dy);
            var edge=Math.max(radius+8,Number(worldRadius||__brScope.BR_WORLD_RADIUS)-radius-4);
            if(__brScope.brArenaRect()){const q=__brScope.brArenaClamp(null,moved,radius+4);moved.x=q.x;moved.y=q.y;}else if(d>edge){moved.x=cx+dx*edge/d;moved.y=cy+dy*edge/d;}
            return moved;
        };

__brScope.brAimSpec = function brAimSpec(ability,kind,playerRadius,power,mods) {
            mods=mods||__brScope.brRunClientMods();
            if(kind==='skill'&&__brScope.brReworkDefinition(ability)&&__brScope.BRRework?.aimSpec)return __brScope.BRRework.aimSpec(ability,kind,playerRadius,power,mods);
            var spec=__brScope.brBaseAimSpec(ability,kind,playerRadius,power),caps=__brScope.brRunCapabilities(ability);
            if(kind==='attack'){
                if(caps.basic.melee){
                    spec.step=__brScope.brBasicStepDistance(ability,mods,false);
                    spec.range=Math.max(playerRadius,(spec.range*Number(mods.basicRange||1))-spec.step);
                }
                else{
                    var profile=__brScope.brRunBasicProfile(ability,mods);
                    spec.width=__brScope.brBasicShotSize(ability,true,mods)*2*Number(mods.basicSize||1);
                    spec.range=playerRadius*.7+Math.ceil(profile.range/profile.speed)*profile.speed;
                    if(profile.count>1){spec.shape='cone';spec.halfAngle=profile.spread*(profile.count-1)*.5+.025;}
                }
            }else{
                var size=Number(mods.skillSize||1);
                if(caps.skill.area||caps.skill.projectile){
                    if(spec.width)spec.width*=size;
                    if(spec.impactRadius)spec.impactRadius*=size;
                    if(spec.radius&&ability.type!==__brScope.ABILITY_TYPES.PROJ)spec.radius*=size;
                    if(['cone','circle'].includes(spec.shape)&&ability.type!==__brScope.ABILITY_TYPES.PROJ)spec.range*=size;
                }
                if(caps.signature.range)spec.range*=Number(mods.signatureRange||1);
                if(caps.skill.projectile&&ability.type===__brScope.ABILITY_TYPES.PROJ){
                    var signature=__brScope.getPlayerSignatureProjectileProfile(ability),count=__brScope.brRunCount(signature.count,mods.skillCount),spread=signature.spread||(count>1?.10:0);
                    if(ability.sub!=='NOVA'&&count>1){spec.shape='cone';spec.halfAngle=spread*(count-1)*.5+.025;}
                }
            }
            if(kind==='skill'&&(ability.type===__brScope.ABILITY_TYPES.LASER||ability.sub==='SNIPE')) {
                var beam=__brScope.brLaserProfile(ability,mods);spec.shape='line';spec.range=beam.range;spec.width=beam.width;spec.beam=true;
            }
            if(kind==='skill'&&spec.shape==='dash'&&ability.type!==__brScope.ABILITY_TYPES.TELEPORT) {
                spec.width=__brScope.brDashWidth(playerRadius);spec.impactRadius=ability.sub==='ROCKET_JUMP'?80:ability.sub==='FLY_DASH'?115:0;
                spec.controlRadius=ability.sub==='FLY_DASH'?125:0;spec.dash=true;spec.phases=ability.sub==='FLY_DASH';
            }
            if(kind==='skill'&&ability.type===__brScope.ABILITY_TYPES.ORBIT){const orbit=__brScope.brOrbitDisplay(ability,playerRadius,mods);spec.radius=orbit.radius;spec.range=orbit.range;}
            if(kind==='skill'&&ability.type===__brScope.ABILITY_TYPES.PROJ&&ability.sub!=='SNIPE'){
                const shot=__brScope.getPlayerSignatureProjectileProfile(ability);
                spec.width=shot.size*2*(ability.t==='S'?1.14:ability.t==='A'?1.08:1)*Number(mods.skillSize||1);
                if(shot.type==='BOOMERANG')spec.range=31*shot.speed; // Native outbound phase is 31 ticks, not the generic weapon range.
            }
            if(kind==='skill'&&ability.type===__brScope.ABILITY_TYPES.PROJ&&ability.sub!=='NOVA')spec.range*=__brScope.brSkillReachFraction(power);
            if(kind==='skill'&&ability.sub==='GRAVITY_WELL') {
                var geometry=__brScope.brZoneGeometry(spec.radius,'pull',ability.sub);spec.pullRadius=geometry.pull;spec.burstRadius=geometry.burst;
            }
            return spec;
        };

__brScope.brBaseAimSpec = function brBaseAimSpec(ability,kind,playerRadius,power) {
            ability=ability||{};playerRadius=Math.max(kind==='attack'?1:24,Number(playerRadius||38));
            power=__brScope.brClamp(Number(power||1),.18,1);
            var type=ability.type,tier=ability.t||'C',sub=ability.sub||'';
            var label=kind==='attack'?'일반 공격':(ability.n||'스킬');
            if(kind==='attack') {
                var close=__brScope.brBasicCombatProfile(ability).close;
                if(close){var melee=__brScope.brBasicCombatProfile(ability);return {shape:'cone',range:playerRadius+melee.rangeBonus,halfAngle:melee.halfAngle,width:playerRadius*.8,label:label};}
                var basicProfile=__brScope.brBasicCombatProfile(ability);
                if(basicProfile.count>1)return {shape:'cone',range:playerRadius*.7+Math.ceil(basicProfile.range/basicProfile.speed)*basicProfile.speed,halfAngle:basicProfile.spread*(basicProfile.count-1)*.5+.025,width:__brScope.brBasicShotSize(ability,true)*2,label:'일반 공격 · 산탄'};
                return {shape:'line',range:playerRadius*.7+Math.ceil(basicProfile.range/basicProfile.speed)*basicProfile.speed,width:__brScope.brBasicShotSize(ability,true)*2,label:label+' · '+({sniper:'저격',machine:'연사',bomber:'폭격',heavy:'중포',homing:'유도',boomerang:'왕복',standard:'사격'}[basicProfile.style]||'사격')};
            }
            var playable=__brScope.brGetPlayableSkillInfo(ability);
            if(playable) {
                label=playable.label;
                if(playable.key==='slip-dash')return {shape:'dash',range:280*(.4+.6*power),width:playerRadius*1.5,label:label};
                if(playable.key.indexOf('guard-')===0)return {shape:'circle',range:playable.key==='guard-pulse'?165:playerRadius+48,radius:playable.key==='guard-pulse'?165:playerRadius+48,label:label};
                if(playable.key==='tank-charge')return {shape:'dash',range:__brScope.brTierValue(tier,{S:620,A:570,B:520,C:470,F:400})*(.34+.66*power),width:playerRadius*1.9,impactRadius:playerRadius*1.45,label:label};
                if(playable.key==='tank-stun')return {shape:'circle',range:__brScope.brTierValue(tier,{S:245,A:228,B:210,C:192,F:170}),radius:__brScope.brTierValue(tier,{S:245,A:228,B:210,C:192,F:170}),label:label};
                if(playable.key==='tank-punch'||playable.key==='melee-uppercut')return {shape:'cone',range:playerRadius+__brScope.brTierValue(tier,{S:190,A:176,B:162,C:148,F:128}),halfAngle:.62,width:playerRadius*1.2,label:label};
                if(playable.key==='melee-lunge')return {shape:'dash',range:__brScope.brTierValue(tier,{S:500,A:460,B:420,C:380,F:330})*(.38+.62*power),width:playerRadius*1.5,impactRadius:playerRadius*1.1,label:label};
                if(playable.key==='melee-combo'||playable.key==='melee-drain')return {shape:'cone',range:playerRadius+__brScope.brTierValue(tier,{S:210,A:195,B:180,C:165,F:145}),halfAngle:.86,width:playerRadius*1.45,label:label};
                if(playable.key.indexOf('teleport-')===0) {
                    var blinkMax=sub==='DIVE_LAVA'?560:sub==='BACKSTAB'?520:650;
                    var blinkRadius=sub==='THUNDER'?220:sub==='DIVE_LAVA'?205:sub==='VOID_ASSASSIN'?180:140;
                    return {shape:'target',range:blinkMax*(.28+.72*power),radius:blinkRadius,impactRadius:blinkRadius,label:label,teleport:true};
                }
                if(playable.key==='ranged-power') {
                    var powerProfile=__brScope.brRangedPowerProfile(ability);
                    return {shape:'line',range:powerProfile.range,width:powerProfile.size*2,impactRadius:powerProfile.blast,label:label};
                }
                if(playable.key==='ranged-sprint'||playable.key==='ranged-overdrive')return {shape:'circle',range:135,radius:135,label:label};
            }
            if(type===__brScope.ABILITY_TYPES.MELEE) {
                return {shape:'dash',range:360*(.38+.62*power),width:playerRadius*1.55,impactRadius:{S:195,A:178,B:158,C:142,F:112}[tier]||142,label:label};
            }
            if(type===__brScope.ABILITY_TYPES.DASH) {
                var dashMax=__brScope.brClamp(Number(ability.dashSpeed||35)*Number(ability.dashDuration||18)*.72,360,900);
                return {shape:'dash',range:dashMax*(.32+.68*power),width:playerRadius*1.65,impactRadius:playerRadius*1.35,label:label};
            }
            if(type===__brScope.ABILITY_TYPES.TELEPORT) {
                var teleMax=sub==='DIVE_LAVA'?560:sub==='BACKSTAB'?520:650;
                return {shape:'dash',range:teleMax*(.28+.72*power),width:playerRadius*1.35,impactRadius:sub==='THUNDER'?190:sub==='VOID_ASSASSIN'?142:90,label:label};
            }
            if(type===__brScope.ABILITY_TYPES.ZONE) {
                var zoneR=sub==='GRAVITY_WELL'?178:sub==='LAVA_POOL'?158:sub==='STINK'?142:sub==='SPREADING_POISON'?112:118;
                return {shape:'target',range:700*(.22+.78*power),radius:zoneR,label:label};
            }
            if(type===__brScope.ABILITY_TYPES.TURRET) return {shape:'target',range:470*(.22+.78*power),radius:64,label:label};
            if(type===__brScope.ABILITY_TYPES.PULL)return sub==='MULTI_GRAB'?{shape:'cone',range:470,halfAngle:Math.PI/3,label:label}:{shape:'line',range:500,width:125,label:label};
            if(type===__brScope.ABILITY_TYPES.LASER) return {shape:'line',range:800,width:sub==='VOID_DESTRUCTION'?144:36,label:label};
            if(type===__brScope.ABILITY_TYPES.PROJ) {
                var profile=__brScope.getRangedCombatProfile(ability,'skill');
                if(sub==='NOVA')return {shape:'circle',range:profile.range,radius:profile.range,label:label};
                var signature=__brScope.getPlayerSignatureProjectileProfile(ability);
                if(signature.count>1&&sub!=='SNIPE')return {shape:'cone',range:profile.range,halfAngle:signature.spread*(signature.count-1)*.5+.025,label:label};
                return {shape:'line',range:profile.range,width:Math.max(44,Number(ability.pSize||12)*3.4),label:label+' · '+({sniper:'저격',machine:'연사',bomber:'폭격',heavy:'중포',homing:'유도',boomerang:'왕복',standard:'사격'}[profile.style]||'사격')};
            }
            if(type===__brScope.ABILITY_TYPES.AREA) {
                var areaR=sub==='NUKE_DEATH'?215:sub==='THUNDER'?195:210;
                return {shape:'circle',range:areaR,radius:areaR,label:label};
            }
            if(type===__brScope.ABILITY_TYPES.ORBIT) return {shape:'circleDir',range:340,radius:playerRadius+92,width:playerRadius*1.2,label:label};
            if(type===__brScope.ABILITY_TYPES.BUFF) {
                if(sub==='GHOST_MOVE')return {shape:'cone',range:9.2*120,halfAngle:.155,width:20,label:label};
                const support=__brScope.isTeamSupportAbility(ability)?__brScope.brSupportProfile(ability):null;
                const buffR=support&&!support.global?support.radius:playerRadius;
                return {shape:'circle',range:support&&!support.global?buffR:0,radius:buffR,label:label,scope:support?.global?'global':support?'nearby':'self'};
            }
            if(type===__brScope.ABILITY_TYPES.CLONE)return {shape:'circle',range:135,radius:135,label:label};
            return {shape:'circleDir',range:300,radius:150,width:playerRadius,label:label};
        };
}
export const initializers=[
[1064,__brScope=>{ __brScope.brRunNeutralMods=Object.freeze({}),__brScope.brRunCapabilityCache=new WeakMap();;}],
[1066,__brScope=>{ __brScope.brRunBasicCache=new WeakMap();;}],
[1069,__brScope=>{__brScope.brProgressionCombat={capabilities:__brScope.brRunCapabilities,count:__brScope.brRunCount,cc:__brScope.brRunCC,basicProfile:__brScope.brRunBasicProfile,skillSnapshot:__brScope.brRunSkillSnapshot};}]
];
