// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brWangguiValues = function brWangguiValues(a,tier){return __brScope.BR_WANGGUI[a?.t]?.[Number(tier)-1]||[1,1];};

__brScope.brWangguiAllowed = function brWangguiAllowed(a,paths){return !!__brScope.BR_WANGGUI[a?.t]&&!['titan','heavy','amplify'].some(id=>Number(paths?.[id])>0);};

__brScope.brRunTierText = function brRunTierText(id,d){const labels={basicSpeed:'공격속도',basicDamage:'일반 피해',basicCount:'일반 탄환',basicSize:'일반 탄환 크기',basicVelocity:'탄속',basicKnockback:'일반 넉백',basicRange:'근접 범위',skillCooldown:'스킬 쿨타임',skillDamage:'스킬 피해',skillSize:'스킬 범위·크기',skillCount:'스킬 탄환',skillControl:'제어 효과',skillRestore:'회복·보호량',moveSpeed:'이동속도',maxHp:'최대 HP',signatureRange:'고유 이동 거리',signatureDuration:'고유 지속 시간'};
            const out=[];for(const [k,v] of Object.entries(d)){if(k==='regenDelay')continue;if(k==='regenRate'){out.push(__brScope.brStatNumber(d.regenDelay/60)+'초 무피격 후 초당 HP '+__brScope.brStatNumber(v*100)+'%');continue;}if(k.endsWith('Count')){out.push(labels[k]+' +'+v);continue;}const pct=(v-1)*100;out.push(labels[k]+' '+(k==='skillCooldown'&&v<1?__brScope.brStatNumber((1-v)*100)+'% 감소':pct>0?'+'+__brScope.brStatNumber(pct)+'%':pct<0?__brScope.brStatNumber(-pct)+'% 감소':'기본 유지')+(v!==1?' (×'+__brScope.brStatNumber(v)+')':''));}return out.join(' · ');};

__brScope.brRunDefaultMods = function brRunDefaultMods(){return {wangguiHp:1,wangguiPower:1,basicSpeed:1,basicDamage:1,basicCount:0,basicSize:1,basicVelocity:1,basicKnockback:1,basicRange:1,skillCooldown:1,skillDamage:1,skillCount:0,skillSize:1,skillControl:1,skillRestore:1,skillDuration:1,moveSpeed:1,maxHp:1,regenRate:0,regenDelay:300,signatureRange:1,signatureDuration:1};};

__brScope.brRunMatchKey = function brRunMatchKey(){return __brScope.matchId;};

__brScope.brInitRun = function brInitRun(p){
            if(!p||p.id===999)return;
            var capabilities=__brScope.brProgressionCombat?__brScope.brProgressionCombat.capabilities(p.ability):{basic:{},skill:{},signature:{}};
            p.run={level:1,xp:0,paths:{},base:{maxHp:p.maxHp,speed:p.speed},mods:__brScope.brRunDefaultMods(),capabilities:capabilities,pending:0,offer:null,offerSeq:0,choices:0,revision:1,lastDamageFrame:0,matchKey:__brScope.brRunMatchKey(),lifeSeq:Number(p.lifeSeq||0)};
            p.run.rng=__brScope.brHashRandom(p.run.matchKey+'|build|'+String(p.remoteId??p.id));
        };

__brScope.brRunModsForPaths = function brRunModsForPaths(paths,capabilities,ability){
            var m=__brScope.brRunDefaultMods();
            Object.keys(paths||{}).forEach(function(id){var tier=Number(paths[id]||0),path=__brScope.BR_RUN_PATHS[id],d=path&&path.tiers[tier-1];if(!d)return;Object.keys(d).forEach(function(k){
                if(k==='regenDelay'){m[k]=d[k];return;}
                if(k==='regenRate'||k==='basicCount'||k==='skillCount'){m[k]+=d[k];return;}
                if(id==='quick'&&k==='skillDamage'&&!capabilities.skill?.damage){if(capabilities.skill?.duration)m.skillDuration+=d[k]-1;else if(capabilities.skill?.heal||capabilities.skill?.shield)m.skillRestore+=d[k]-1;return;}
                m[k]+=d[k]-1;
            });});
            var caps={"basicSpeed":[0.5,2.5],"basicDamage":[0.25,2.75],"basicSize":[1,2.1],"basicVelocity":[0.75,1.25],"basicKnockback":[1,2.43],"basicRange":[1,1.715],"skillCooldown":[0.428,1.6],"skillDamage":[0.25,2.75],"skillSize":[1,2.045],"skillControl":[1,1.715],"skillRestore":[0.75,1.935],"skillDuration":[0.75,1],"moveSpeed":[0.75,1.418],"maxHp":[0.7,1.825],"signatureRange":[1,1.462],"signatureDuration":[1,1.55]};
            Object.keys(caps).forEach(function(k){m[k]=__brScope.brClamp(m[k],caps[k][0],caps[k][1]);});m.basicCount=__brScope.brClamp(m.basicCount,0,3);m.skillCount=__brScope.brClamp(m.skillCount,0,3);
            if(__brScope.brWangguiAllowed(ability,paths)){const v=__brScope.brWangguiValues(ability,paths?.wanggui);m.wangguiHp=v[0];m.wangguiPower=v[1];}
            return m;
        };

__brScope.brRunEligible = function brRunEligible(p,id){
            var c=p.run.capabilities,b=c.basic||{},s=c.skill||{},sig=c.signature||{};
            if(!Object.prototype.hasOwnProperty.call(__brScope.BR_RUN_PATHS,id))return false;
            if(id==='wanggui')return __brScope.brWangguiAllowed(p.ability,p.run.paths);
            if(['titan','heavy','amplify'].includes(id)&&Number(p.run.paths.wanggui)>0)return false;
            if(id==='multi'||id==='giant')return !!b.projectile;
            if(id==='impact')return !!(b.knockback||b.melee);
            if(id==='wide')return !!b.melee;
            if(id==='amplify')return !!s.damage;
            if(id==='expansion')return s.expandable!==undefined?!!s.expandable:!!(s.projectile||s.area);
            if(id==='multicast')return s.multicast!==undefined?!!s.multicast:!!s.projectile;
            if(id==='control')return !!s.cc;
            if(id==='restore')return !!(s.heal||s.shield);
            if(id==='signature_range')return (p.ability.t==='S'||p.ability.t==='A')&&!!(sig.range||c.signatureRange);
            if(id==='signature_duration')return (p.ability.t==='S'||p.ability.t==='A')&&!!(sig.duration||c.signatureDuration);
            return true;
        };

__brScope.brRunEffectiveValues = function brRunEffectiveValues(p,mods){const out=__brScope.brRunMeasured(p,mods),c=p.run.capabilities,s=__brScope.brReworkDefinition(p.ability)?.skill;delete out.wangguiPower;
            if(!c.skill.damage)out.skillDamage=0;if(!c.skill.heal&&!c.skill.shield)out.skillRestore=0;if(!c.skill.duration&&!c.signature?.duration)out.skillDuration=0;
            if(s){const stun=Number(s.stunFrames??s.stun??0),push=Number(s.knockback??s.push??0),pull=Number(s.pull??0);out.skillControl=0;out.stunFrames=stun>0?Math.round(Math.min(Number(s.stunCap??stun*1.35),stun*Number(mods.skillControl||1))):0;out.skillImpulse=push*Number(mods.skillControl||1);out.skillPull=pull*Number(mods.skillControl||1);if(!c.skill.cc){out.stunFrames=out.skillImpulse=out.skillPull=0;}}
            else if(!c.skill.cc)out.skillControl=0;if(s?.shield>0&&!c.skill.heal)out.skillRestore=Math.min(out.maxHp*.60,s.shield*Number(mods.skillRestore||1));return out;};

__brScope.brRunEffectiveNext = function brRunEffectiveNext(p,id){const run=p.run,tier=Number(run.paths[id]||0)+1;if(tier>__brScope.BR_RUN_PATH_MAX_TIER||!__brScope.brRunEligible(p,id))return false;const next={...run.paths,[id]:tier},before=__brScope.brRunEffectiveValues(p,__brScope.brRunModsForPaths(run.paths,run.capabilities,p.ability)),after=__brScope.brRunEffectiveValues(p,__brScope.brRunModsForPaths(next,run.capabilities,p.ability));return Object.keys(before).some(k=>['basicFrames','skillFrames','regenDelay'].includes(k)?after[k]<before[k]-1e-7:after[k]>before[k]+1e-7);};

__brScope.brRunCard = function brRunCard(p,id,tier){
            var d=__brScope.BR_RUN_PATHS[id],effect=d.text[tier-1],capNote='';
            if(id==='control'||id==='multicast'){const oldMods=__brScope.brRunModsForPaths(p.run.paths,p.run.capabilities,p.ability),newMods=__brScope.brRunModsForPaths({...p.run.paths,[id]:tier},p.run.capabilities,p.ability),oldActual=__brScope.brRunEffectiveValues(p,oldMods),newActual=__brScope.brRunEffectiveValues(p,newMods);
            if(id==='control'&&newActual.stunFrames>0&&newActual.stunFrames===oldActual.stunFrames)capNote='기절시간 상한 유지 · ';
            if(id==='multicast'&&newActual.skillCount===oldActual.skillCount)capNote='탄수 상한 유지 · ';}
            if(id==='wanggui'){
                const v=__brScope.brWangguiValues(p.ability,tier),next=__brScope.brWangguiValues(p.ability,Number(tier)+1),pct=n=>__brScope.brStatNumber((n-1)*100);
                return {id,tier,name:'왕귀',icon:'👑',family:'BODY',effect:p.ability.t+'급 · 최대 HP +'+pct(v[0])+'% · 공격력 +'+pct(v[1])+'%',detail:'평타와 공격 스킬 모두 · '+(tier<3?'다음 단계: HP +'+pct(next[0])+'% · 공격력 +'+pct(next[1])+'%':'최종 단계')};
            }
            if(id==='quick'&&!p.run.capabilities.skill?.damage) {
                var stats=d.tiers[tier-1],cd=__brScope.brStatNumber(stats.skillCooldown*100),penalty=__brScope.brStatNumber(stats.skillDamage*100);
                effect='스킬 쿨다운 '+cd+'%';
                if(p.run.capabilities.skill?.duration)effect+=' · 효과 지속 '+penalty+'%';
                else if(p.run.capabilities.skill?.heal||p.run.capabilities.skill?.shield)effect+=' · 회복·보호량 '+penalty+'%';
            }
            if(id==='expansion'&&__brScope.TRAIL_DASH_SUBS.has(p.ability.sub))effect=effect.replace('스킬 범위·크기','남기는 장판 범위');
            if(id==='expansion'&&p.ability.type===__brScope.ABILITY_TYPES.ORBIT)effect=effect.replace('스킬 범위·크기','회전 무기 크기');
            return {id:id,tier:tier,name:d.name,icon:d.icon,family:d.family,effect:effect,detail:capNote+(d.signature?'고유 스킬 특화 · ':'')+(id==='restore'?'피해 감소 최대 45% · ':'')+'단계 누적값 · 증감 합산·상한 적용'};
        };

__brScope.brRunOffer = function brRunOffer(p){
            var run=p.run;if(!p.alive||!run||run.offer||run.pending<=0||run.choices>=__brScope.BR_RUN_MAX_CHOICES)return;
            var nextLevel=run.choices+2,candidates=[];
            Object.keys(__brScope.BR_RUN_PATHS).forEach(function(id){var tier=Number(run.paths[id]||0)+1;if(__brScope.brRunEffectiveNext(p,id))candidates.push({id:id,tier:tier,weight:tier>1?(nextLevel>=5?3.2:2.5):1});});
            var cards=[],families=[];
            for(var i=0;i<3&&candidates.length;i++){
                var weights=candidates.map(function(c){var family=__brScope.BR_RUN_PATHS[c.id].family;return c.weight*(i===2&&families[0]===families[1]&&family===families[0]?.45:1);});
                var total=weights.reduce(function(a,b){return a+b;},0),pick=run.rng()*total,index=weights.length-1;
                for(var j=0;j<weights.length;j++){pick-=weights[j];if(pick<0){index=j;break;}}
                var chosen=candidates.splice(index,1)[0];cards.push(__brScope.brRunCard(p,chosen.id,chosen.tier));families.push(__brScope.BR_RUN_PATHS[chosen.id].family);
            }
            run.offer={id:run.matchKey+':'+String(p.remoteId??p.id)+':'+(++run.offerSeq),level:nextLevel,cards:cards};
        };

__brScope.brRecomputeRun = function brRecomputeRun(p){
            var run=p.run;if(run.paths.wanggui&&!__brScope.brWangguiAllowed(p.ability,run.paths))delete run.paths.wanggui;var old=run.mods,m=__brScope.brRunModsForPaths(run.paths,run.capabilities,p.ability);
            var ratio=__brScope.brClamp(p.hp/Math.max(1,p.maxHp),0,1);
            // Preserve temporary combat buffs; replace only the old run multiplier.
            p.maxHp=p.maxHp/Math.max(.01,old.maxHp*(old.wangguiHp||1))*m.maxHp*m.wangguiHp;p.hp=p.alive?p.maxHp*ratio:0;
            run.mods=m;
        };

__brScope.brChooseRun = function brChooseRun(p,offerId,id){
            var run=p&&p.run;if(!p||!p.alive||!run||run.matchKey!==__brScope.brRunMatchKey()||run.pending<=0||run.choices>=__brScope.BR_RUN_MAX_CHOICES||run.choices>=run.level-1||!run.offer||run.offer.id!==offerId)return false;
            var card=run.offer.cards.find(function(c){return c.id===id;});if(!card||card.tier!==Number(run.paths[id]||0)+1||!__brScope.brRunEffectiveNext(p,id)||Number(run.lifeSeq)!==Number(p.lifeSeq||0))return false;
            run.paths[id]=card.tier;run.pending--;run.choices++;run.offer=null;__brScope.brRecomputeRun(p);__brScope.brRunOffer(p);run.revision++;return true;
        };

__brScope.brAwardRunXP = function brAwardRunXP(p,amount,healFraction){
            if(!p||!p.alive||p.id===999||!p.run||!Number.isFinite(amount)||amount<=0)return false;
            var run=p.run;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*__brScope.brClamp(Number(healFraction||0),0,.30));
            if(run.level<__brScope.BR_RUN_MAX_LEVEL){run.xp+=amount;while(run.level<__brScope.BR_RUN_MAX_LEVEL&&Number.isFinite(__brScope.BR_RUN_XP[run.level])&&__brScope.BR_RUN_XP[run.level]>0&&run.xp>=__brScope.BR_RUN_XP[run.level]){run.xp-=__brScope.BR_RUN_XP[run.level];run.level++;run.pending++;}}if(run.level>=__brScope.BR_RUN_MAX_LEVEL)run.xp=0;
            __brScope.brRunOffer(p);run.revision++;return true;
        };

__brScope.brRunSnapshot = function brRunSnapshot(p){
            var r=p.run;if(!r)return null;
            return {matchKey:r.matchKey,lifeSeq:Number(p.lifeSeq||0),level:r.level,xp:r.xp,required:r.level<__brScope.BR_RUN_MAX_LEVEL?__brScope.BR_RUN_XP[r.level]:0,paths:Object.assign({},r.paths),mods:Object.assign({},r.mods),revision:r.revision,pending:r.pending,offer:p.alive?r.offer:null,alive:!!p.alive,abilityId:p.ability.id,
                chips:Object.keys(r.paths).map(function(id){return __brScope.brRunCard(p,id,r.paths[id]);})};
        };

__brScope.brRunMeasured = function brRunMeasured(p,mods){
            var a=p.ability,b=__brScope.brRunBasicProfile(a,mods),skill=__brScope.brReworkDefinition(a)?.skill,aim=__brScope.brAimSpec(a,'skill',p.radius,1,mods);
            var basicDamage=__brScope.brTierValue(a.t,b.close?{S:27,A:24,B:21,C:18,F:13}:{S:21,A:18,B:15,C:12,F:8})*b.damageScale,
                cd=Number(skill?.cooldownFrames??skill?.cooldown??__brScope.brGetPlayableSkillInfo(a)?.cooldown??p.maxCooldown??600);
            return {basicFrames:__brScope.brBasicAttackFrames(a,mods),basicDamage:basicDamage*(__brScope.brClosePolish(a)?1.05:1)*Number(mods.wangguiPower||1),basicCount:b.close?1:b.count,basicSize:b.close?0:__brScope.brBasicShotSize(a,true,mods)*Number(mods.basicSize||1),basicVelocity:b.close?0:b.speed,
                basicRange:b.close?(p.radius+b.rangeBonus)*Number(mods.basicRange||1):b.range,
                basicKnockback:b.close?__brScope.brTierValue(a.t,{S:39,A:35,B:30,C:25,F:19})*b.pushScale:b.knockback,
                skillFrames:Math.round(cd*Number(mods.skillCooldown||1)*(p.cooldownRateMult||1)),
                wangguiPower:Number(mods.wangguiPower||1),skillDamage:Number(mods.skillDamage||1)*Number(mods.wangguiPower||1),skillControl:Number(mods.skillControl||1),skillRestore:Number(mods.skillRestore||1),
                skillImpulse:Number(skill?.knockback??skill?.push??0)*Number(mods.skillControl||1),skillPull:Number(skill?.pull||0)*Number(mods.skillControl||1),
                stunFrames:skill?Math.round(Math.min(Number(skill.stunCap??Number(skill.stunFrames??skill.stun??0)*1.35),Number(skill.stunFrames??skill.stun??0)*Number(mods.skillControl||1))):0,
                skillDuration:Math.max(.5,Number(mods.signatureDuration||1)+Number(mods.skillDuration||1)-1),
                skillCount:p.run.capabilities.skill?.multicast?(skill?
                    __brScope.brRunCount(Number(skill.count||1),mods.skillCount,Number(skill.countCap??skill.maxCount??24)):
                    __brScope.brRunCount(__brScope.getPlayerSignatureProjectileProfile(a).count,mods.skillCount)):0,
                skillRadius:Number(aim?.radius||aim?.impactRadius||aim?.width||0),
                skillRange:Number(aim?.range||0),maxHp:p.maxHp/Math.max(.01,Number(p.run.mods.maxHp||1)*Number(p.run.mods.wangguiHp||1))*Number(mods.maxHp||1)*Number(mods.wangguiHp||1),
                moveSpeed:__brScope.brBaseWalkingSpeed(p)*Number(mods.moveSpeed||1),regenRate:Number(mods.regenRate||0),regenDelay:Number(mods.regenDelay||300)};
        };

__brScope.brRunNoticeText = function brRunNoticeText(id,tier,before,after){
            var format=(n,k)=>k==='basicFrames'||k==='skillFrames'||k==='stunFrames'?(__brScope.brStatNumber(n/60)+'초'):
                k==='basicCount'||k==='skillCount'?String(n)+'발':
                k==='regenDelay'?(__brScope.brStatNumber(n/60)+'초'):
                k==='wangguiPower'||k==='regenRate'||k==='skillDamage'||k==='skillControl'||k==='skillRestore'||k==='skillDuration'?__brScope.brStatNumber(n*100)+'%':__brScope.brStatNumber(n);
            var fields={wanggui:[['maxHp','최대 HP'],['wangguiPower','공격 배율']],rapid:[['basicFrames','평타 간격'],['basicDamage','기본 위력']],heavy:[['basicDamage','기본 위력'],['basicFrames','평타 간격']],
                multi:[['basicCount','일반 탄환'],['basicDamage','탄당 기본 위력']],giant:[['basicSize','일반 탄환 크기'],['basicVelocity','탄속']],impact:[['basicKnockback','일반 넉백'],['basicDamage','기본 위력']],
                wide:[['basicRange','근접 범위'],['basicFrames','평타 간격']],quick:[['skillFrames','기본 스킬 쿨타임'],['skillDamage','스킬 기본 위력'],['skillDuration','효과 지속'],['skillRestore','회복·보호']],
                amplify:[['skillDamage','스킬 기본 위력'],['skillFrames','기본 스킬 쿨타임']],expansion:[['skillRadius','스킬 반경·폭'],['skillDamage','스킬 기본 위력']],
                multicast:[['skillCount','스킬 탄환'],['skillDamage','탄당 기본 위력']],control:[['stunFrames','기절 시간'],['skillImpulse','스킬 넉백'],['skillPull','스킬 당김'],['skillDamage','스킬 기본 위력']],
                restore:[['skillRestore','회복·보호 계수'],['skillFrames','기본 스킬 쿨타임']],swift:[['moveSpeed','기본 이동속도'],['maxHp','최대 HP']],
                titan:[['maxHp','최대 HP'],['moveSpeed','기본 이동속도']],regen:[['regenRate','초당 재생'],['maxHp','최대 HP'],['regenDelay','무피격 대기']],
                signature_range:[['skillRange','고유 사거리'],['skillFrames','기본 스킬 쿨타임']],signature_duration:[['skillDuration','고유 지속 계수'],['skillFrames','기본 스킬 쿨타임']]};
            var changed=(fields[id]||[]).filter(function(x){return Math.abs(Number(before[x[0]]||0)-Number(after[x[0]]||0))>1e-6;});
            // Keep the main gain visible, then prefer an actual penalty over a second gain.
            var penalty=changed.find(function(x){var k=x[0],a=Number(after[k]),b=Number(before[k]);return ['basicFrames','skillFrames','regenDelay'].includes(k)?a>b:a<b;});
            var chosen=(penalty&&changed[0]!==penalty?[changed[0],penalty]:changed.slice(0,2)).map(function(x){
                return x[1]+' '+format(before[x[0]],x[0])+' → '+format(after[x[0]],x[0]);
            });
            return (__brScope.BR_RUN_PATHS[id]?.name||id)+' '+['','I','II','III'][tier]+' 적용 · '+chosen.join(' · ');
        };

__brScope.brUpdateRunWorld = function brUpdateRunWorld(g){
            if(!g||g.isGameOver)return;
            for(var p of g.activeParticipants||g.participants){var r=p.run;if(!p.alive||!r)continue;
                var m=r.mods;if(m.regenRate>0&&g.frame-r.lastDamageFrame>=m.regenDelay&&p.hp<p.maxHp&&(g.capture?__brScope.brArenaContains(g,p.pos):p.pos.dist(g.center)<=g.mapRadius))p.hp=Math.min(p.maxHp,p.hp+p.maxHp*m.regenRate/60);
            }
        };
}
export const initializers=[
[1137,__brScope=>{ __brScope.BR_RUN_XP=[0,2,3,4,5,6];;}],
[1138,__brScope=>{ __brScope.BR_WANGGUI=Object.freeze({"A":[[1.165,1.165],[1.33,1.33],[1.495,1.495]],"B":[[1.275,1.275],[1.55,1.55],[1.77,1.77]],"C":[[1.385,1.44],[1.77,1.88],[2.1,2.32]],"F":[[1.66,1.88],[2.32,2.76],[2.76,3.64]]});;}],
[1141,__brScope=>{ __brScope.BR_RUN_PATHS={
            wanggui:{name:'왕귀',icon:'👑',family:'BODY',tiers:[{},{},{}],text:['왕귀 I','왕귀 II','왕귀 III']},
            rapid:{"name":"RAPID","icon":"⚡","family":"BASIC","tiers":[{"basicSpeed":1.44,"basicDamage":0.9},{"basicSpeed":1.825,"basicDamage":0.95},{"basicSpeed":2.43,"basicDamage":1.055}]},
            heavy:{"name":"HEAVY","icon":"💥","family":"BASIC","tiers":[{"basicDamage":1.44,"basicSpeed":0.9},{"basicDamage":1.825,"basicSpeed":0.95},{"basicDamage":2.32,"basicSpeed":1}]},
            multi:{"name":"MULTI","icon":"🔱","family":"BASIC","tiers":[{"basicCount":1,"basicDamage":0.95},{"basicCount":2,"basicDamage":0.95},{"basicCount":3,"basicDamage":0.95}]},
            giant:{"name":"GIANT","icon":"🔵","family":"BASIC","tiers":[{"basicSize":1.385,"basicVelocity":0.95},{"basicSize":1.715,"basicVelocity":1},{"basicSize":2.1,"basicVelocity":1.055}]},
            impact:{"name":"IMPACT","icon":"🥊","family":"BASIC","tiers":[{"basicKnockback":1.44,"basicDamage":0.95},{"basicKnockback":1.88,"basicDamage":1},{"basicKnockback":2.43,"basicDamage":1.055}]},
            wide:{"name":"WIDE STRIKE","icon":"⚔️","family":"BASIC","tiers":[{"basicRange":1.22,"basicSpeed":0.95},{"basicRange":1.44,"basicSpeed":1},{"basicRange":1.715,"basicSpeed":1.055}]},
            quick:{"name":"QUICK CAST","icon":"⏱️","family":"SKILL","tiers":[{"skillCooldown":0.725,"skillDamage":0.92},{"skillCooldown":0.582,"skillDamage":0.97},{"skillCooldown":0.428,"skillDamage":1}]},
            amplify:{"name":"AMPLIFY","icon":"🔥","family":"SKILL","tiers":[{"skillDamage":1.44,"skillCooldown":1.1},{"skillDamage":1.825,"skillCooldown":1.05},{"skillDamage":2.32,"skillCooldown":1}]},
            expansion:{"name":"EXPANSION","icon":"🌀","family":"SKILL","tiers":[{"skillSize":1.33,"skillDamage":0.95},{"skillSize":1.66,"skillDamage":1},{"skillSize":2.045,"skillDamage":1.055}]},
            multicast:{"name":"MULTICAST","icon":"☄️","family":"SKILL","tiers":[{"skillCount":1,"skillDamage":0.95},{"skillCount":2,"skillDamage":0.95},{"skillCount":3,"skillDamage":0.95}]},
            control:{"name":"CONTROL","icon":"❄️","family":"SKILL","tiers":[{"skillControl":1.275,"skillDamage":0.95},{"skillControl":1.495,"skillDamage":1},{"skillControl":1.715,"skillDamage":1.055}]},
            restore:{"name":"RESTORE","icon":"💚","family":"SKILL","tiers":[{"skillRestore":1.33,"skillCooldown":1.05},{"skillRestore":1.605,"skillCooldown":1},{"skillRestore":1.935,"skillCooldown":1}]},
            swift:{"name":"SWIFT","icon":"👟","family":"BODY","tiers":[{"moveSpeed":1.165,"maxHp":0.95},{"moveSpeed":1.286,"maxHp":1},{"moveSpeed":1.418,"maxHp":1.055}]},
            titan:{"name":"TITAN","icon":"🛡️","family":"BODY","tiers":[{"maxHp":1.33,"moveSpeed":0.95},{"maxHp":1.55,"moveSpeed":0.98},{"maxHp":1.825,"moveSpeed":1}]},
            regen:{"name":"REGEN","icon":"🌱","family":"BODY","tiers":[{"regenRate":0.0198,"regenDelay":270,"maxHp":0.95},{"regenRate":0.0286,"regenDelay":210,"maxHp":1},{"regenRate":0.0385,"regenDelay":150,"maxHp":1.055}]},
            signature_range:{"name":"LONG STEP","icon":"🪽","family":"SKILL","tiers":[{"signatureRange":1.165,"skillCooldown":1.05},{"signatureRange":1.308,"skillCooldown":1.02},{"signatureRange":1.462,"skillCooldown":1}],"signature":true},
            signature_duration:{"name":"AFTERGLOW","icon":"✨","family":"SKILL","tiers":[{"signatureDuration":1.22,"skillCooldown":1.08},{"signatureDuration":1.385,"skillCooldown":1.04},{"signatureDuration":1.55,"skillCooldown":1}],"signature":true}
        };;}],
[1143,__brScope=>{for(const [id,path] of Object.entries(__brScope.BR_RUN_PATHS))if(id!=='wanggui')path.text=path.tiers.map(d=>__brScope.brRunTierText(id,d));}],
[1160,__brScope=>{__brScope.brProgression={init:__brScope.brInitRun,awardXP:__brScope.brAwardRunXP,choose:__brScope.brChooseRun,update:__brScope.brUpdateRunWorld,snapshot:__brScope.brRunSnapshot,eligible:__brScope.brRunEligible,effectiveNext:__brScope.brRunEffectiveNext,measure:__brScope.brRunMeasured,notice:__brScope.brRunNoticeText,recompute:__brScope.brRecomputeRun,catalog:__brScope.BR_RUN_PATHS,defaultMods:__brScope.brRunDefaultMods};}]
];
