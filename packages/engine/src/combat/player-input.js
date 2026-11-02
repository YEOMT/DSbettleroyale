// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brFindDirectionalTarget = function brFindDirectionalTarget(p,g,aim,spec,endpointOnly) {
            var best=null,bestScore=Infinity,range=Math.max(1,Number(spec.range||0));
            var endpoint=p.pos.add(aim.mult(range));
            var pool=g.aliveRealPlayers&&g.aliveRealPlayers.length?g.aliveRealPlayers:g.participants;
            for(var i=0;i<pool.length;i++) {
                var o=pool[i];
                if(!o.alive||o===p||o.id===999||(p.team&&o.team===p.team)||!__brScope.brCanHostileTarget(o,p))continue;
                if(g.isConcealedFrom&&g.isConcealedFrom(o,p))continue;
                var rel=o.pos.sub(p.pos),along=rel.x*aim.x+rel.y*aim.y;
                var side=Math.abs(rel.x*aim.y-rel.y*aim.x),score=Infinity;
                if(endpointOnly||spec.shape==='target') {
                    var endDist=o.pos.dist(endpoint),hitR=Math.max(34,Number(spec.radius||spec.impactRadius||54))+o.radius*.55;
                    if(endDist<=hitR)score=endDist;
                } else if(spec.shape==='cone') {
                    var d=rel.mag(),dot=d>0?along/d:1;
                    if(d<=range+o.radius&&dot>=Math.cos(Number(spec.halfAngle||Math.PI*.45)))score=d-dot*60;
                } else if(spec.shape==='circle') {
                    var circleDist=rel.mag();
                    if(circleDist<=Number(spec.radius||range)+o.radius)score=circleDist;
                } else {
                    var corridor=Math.max(28,Number(spec.width||56)*.5)+o.radius*.7;
                    if(along>=-o.radius&&along<=range+o.radius&&side<=corridor)score=along+side*1.8;
                }
                if(score<bestScore&&!g.checkWallBetween(p.pos,o.pos)){best=o;bestScore=score;}
            }
            return best;
        };

__brScope.brAimEndpoint = function brAimEndpoint(p,g,aim,range) {
            var point=p.pos.add(aim.mult(Math.max(0,range))),center=g.center||new __brScope.Vec2(0,0);
            var edge=Math.max(20,Number(g.worldRadius||__brScope.BR_WORLD_RADIUS)-p.radius-18),fromCenter=point.sub(center);
            if(__brScope.brArenaRect(g))point=__brScope.brArenaClamp(g,point,p.radius+18);else if(fromCenter.mag()>edge)point=center.add(fromCenter.norm().mult(edge));
            if(g.checkWallCollision&&g.checkWallCollision(point,p.radius)) {
                var found=false,safeDelta=point.sub(p.pos);
                for(var step=.90;step>=.15;step-=.15) {
                    var candidate=p.pos.add(safeDelta.mult(step));
                    if(!g.checkWallCollision(candidate,p.radius)){point=candidate;found=true;break;}
                }
                if(!found)point=new __brScope.Vec2(p.pos.x,p.pos.y);
            }
            return point;
        };

__brScope.brMakeAimTarget = function brMakeAimTarget(p,point,victim) {
            var fake={id:victim?victim.id:-100000-Number(p.id||0),name:'aim',pos:point,vel:new __brScope.Vec2(0,0),radius:victim?Number(victim.radius||30):30,
                hp:victim?Number(victim.hp||1):1,maxHp:victim?Number(victim.maxHp||1):1,alive:true,manualAim:true,stunned:0,team:victim?Number(victim.team||0):0,spawnProtectionUntilFrame:victim?Number(victim.spawnProtectionUntilFrame||0):0};
            if(victim) {
                ['pos','vel','stunned','hp','maxHp','alive'].forEach(function(key){
                    Object.defineProperty(fake,key,{configurable:true,enumerable:true,get:function(){return victim[key];},set:function(v){victim[key]=v;}});
                });
            }
            fake.takeDamage=function(amount,attacker){if(victim&&victim.alive)victim.takeDamage(amount,attacker,false,point.sub(p.pos));};
            return fake;
        };

__brScope.brPlayableEnemiesInCone = function brPlayableEnemiesInCone(p,g,aim,range,halfAngle,maxCount) {
            var minDot=Math.cos(halfAngle),found=[];
            g.getNearbyParticipants(p.pos,range+100).forEach(function(o){
                if(!o.alive||o===p||o.id===999||(p.team&&o.team===p.team)||!__brScope.brCanHostileTarget(o,p))return;
                var rel=o.pos.sub(p.pos),dist=rel.mag(),dot=dist>0?(rel.x*aim.x+rel.y*aim.y)/dist:1;
                if(__brScope.brSectorTouches(p.pos,o,aim,range,halfAngle,__brScope.BR_CONTACT.skillConeTarget)&&!g.checkWallBetween(p.pos,o.pos))found.push({o:o,dist:dist,dot:dot});
            });
            found.sort(function(a,b){return (b.dot-a.dot)*90+(a.dist-b.dist);});
            return found.slice(0,maxCount||found.length).map(function(x){return x.o;});
        };

__brScope.brApplyPlayableHit = function brApplyPlayableHit(p,g,target,damage,push,stun,dir,style,color) {
            if(!target||!target.alive||!__brScope.brCanHostileTarget(target,p))return false;
            var hitDir=dir&&dir.mag()>.01?dir.norm():target.pos.sub(p.pos).norm();if(hitDir.mag()<.01)hitDir=new __brScope.Vec2(1,0);
            var previousStyle=p.currentImpactStyle;p.currentImpactStyle=style;
            let dealt=0;try { dealt=target.takeDamage(damage,p,false,hitDir,{style,knockback:push*1.18}); } finally { p.currentImpactStyle=previousStyle||''; }
            if(!target._lastDamageResult?.valid)return false;if(!target.alive)return true;
            var skillPush=push===0?0:push*1.18;
            __brScope.BRRework.nativeImpulse(target,p,hitDir,skillPush,g);
            if(stun>0)__brScope.brApplyStun(target,stun,p);
            if(skillPush>=24)g.markLaunched(target,p,Math.min(44,18+Math.round(skillPush*.50)));
            // The damage resolver emitted the single host-confirmed contact, including shields.
            return true;
        };

__brScope.brStartPlayerDash = function brStartPlayerDash(p,aim,speed,range,damage,push,stun,style,color) {
            const hits=new Set(),direction=__brScope.brNormalizeAimVector(aim.x,aim.y),cast=p._runSkillCast||__brScope.brRunSkillSnapshot(p);
            const token='dash:'+(p.farmActionSeq=(p.farmActionSeq||0)+1),sourceId=p.remoteId||('player-'+p.id);
            const geometry=__brScope.brFxCommand(p,'capsule',{width:__brScope.brDashWidth(p.radius),token:sourceId+'|'+token,harmless:damage<=0});
            const dash={dir:direction,speed:Math.max(1,speed),remaining:Math.max(0,range),origin:new __brScope.Vec2(p.pos.x,p.pos.y),lastFxFrame:-9999,
                contact:function(g,from,to){
                    // Send only a travelled path. Cumulative path replaces its older event every four ticks.
                    if(g.frame-dash.lastFxFrame>=4||dash.remaining<=.001){
                        const delta=to.sub(dash.origin),length=delta.mag(),d=length>0?delta.norm():direction;
                        g.emitStudentFx('dash',dash.origin,{dx:d.x,dy:d.y,size:length,amount:geometry.width,color,style,sourceId,geometry});
                        dash.lastFxFrame=g.frame;
                    }
                    if(damage<=0)return;
                    return __brScope.brWithRunSkill(p,g,function(){
                        __brScope.brFarm.line(g,p,from,to,geometry.width*.5,.65,token);
                        __brScope.BRRework?.nativeLineTurrets(g,p,from,to,geometry.width,damage,token);
                        const segment=to.sub(from),middle=from.add(to).mult(.5),reach=segment.mag()*.5+p.radius+150+Number(g.maxParticipantStep||0);
                        const contacts=[];
                        for(const o of g.getNearbyParticipants(middle,reach)){
                            if(o===p||!o.alive||o.id===999||(p.team&&p.team===o.team)||!__brScope.brCanHostileTarget(o,p)||hits.has(o.id))continue;
                            const hit=__brScope.brDashTouchTime(from,to,o,p.radius,!!g.resolvingDashContacts);
                            if(!hit||g.checkWallBetween(new __brScope.Vec2(hit.x,hit.y),new __brScope.Vec2(hit.targetX,hit.targetY)))continue;
                            contacts.push({o,hit});
                        }
                        contacts.sort((a,b)=>a.hit.t-b.hit.t||a.o.id-b.o.id);
                        for(const {o} of contacts){
                            if(!p.alive)break;if(!o.alive)continue;
                            hits.add(o.id);if(!__brScope.brApplyPlayableHit(p,g,o,damage,push,stun,direction,style,color))continue;
                            if(p.alive&&o.alive&&style==='native-dash'&&__brScope.TRAIL_DASH_SUBS.has(p.dashType)&&!p.dashImpactDone){
                                p.dashImpactDone=true;p.dashTargetId=o.id;
                                if(p.dashType==='ICE_TRAIL')__brScope.brApplyStun(o,28,p);
                                else if(p.dashType==='BANANA_TRAIL')__brScope.brApplyStun(o,20,p);
                                else if(p.dashType==='INK_TRAIL')o.blindedFrames=Math.max(o.blindedFrames||0,__brScope.brRunCC(120,p._runSkillCast?.control));
                                if(['POISON_TRAIL','BOMB_TRAIL','INK_TRAIL'].includes(p.dashType))p.spawnTrailZone(g,o.pos,1,false);
                            }
                            if(p.alive&&p.ability.sub==='SOUL_CLEAVE'){__brScope.brApplyGuard(p,p,90,.25);}
                            o.bodyHitCooldown=Math.max(o.bodyHitCooldown||0,24);
                        }
                    },cast,false);
                }};
            p.playerDash=dash;p.vel=direction.mult(Math.min(dash.speed,dash.remaining));p.dashFrames=Math.ceil(dash.remaining/dash.speed);
        };

__brScope.brCastPlayableSkill = function brCastPlayableSkill(p,g,aim,power,info,spec) {
            if(__brScope.BRRework?.defs[p.ability.id])return __brScope.BRRework.cast(p,g,aim,power);
            if(!info||info.key==='native')return false;
            var tier=p.ability.t||'C',color=__brScope.BR_TIER_COLOR[tier]||'#fff',key=info.key;
            var sourceId=p.remoteId||('player-'+p.id),range=Number(spec.range||0),targets=[];
            p.attackCommitFrames=Math.max(p.attackCommitFrames,20);p.lastAimDir=aim;
            if(key.indexOf('guard-')===0) {
                __brScope.brApplyGuard(p,p,120,key==='guard-counter'?.28:.35);
                if(key==='guard-counter'){p.counterFrames=Math.round(120*(p._runSkillCast?.duration||1));p.counterCast=p._runSkillCast||__brScope.brRunSkillSnapshot(p);}
                if(key==='guard-pulse')g.getNearbyParticipants(p.pos,220).forEach(function(o){if(o!==p&&o.alive&&o.id!==999&&!(p.team&&p.team===o.team)&&__brScope.brCanHostileTarget(o,p)&&o.pos.dist(p.pos)<=165+o.radius*.3&&!g.checkWallBetween(p.pos,o.pos)){o.vel=o.vel.add(o.pos.sub(p.pos).norm().mult(22*(o.knockbackResist||1)));__brScope.brApplyStun(o,8,p);}});
                g.emitStudentFx('impact',p.pos,{size:Number(spec.radius),color:'#93c5fd',style:key,sourceId:sourceId});
            } else if(key==='slip-dash') {
                p.dashType='PLAYER_SLIP';__brScope.brStartPlayerDash(p,aim,28,range,0,0,0,'slip-dash','#bae6fd');

            } else if(key==='tank-charge') {
                var chargeSpeed=__brScope.brTierValue(tier,{S:40,A:37,B:34,C:31,F:27});
                p.dashType='PLAYER_TANK_CHARGE';
                __brScope.brStartPlayerDash(p,aim,chargeSpeed,range,__brScope.brTierValue(tier,{S:48,A:42,B:36,C:30,F:23}),__brScope.brTierValue(tier,{S:48,A:43,B:38,C:33,F:27}),__brScope.brTierValue(tier,{S:26,A:23,B:20,C:17,F:13}),'tank-charge',color);

            } else if(key==='tank-stun') {
                var slamRadius=Number(spec.radius||spec.range||190),slamDamage=__brScope.brTierValue(tier,{S:38,A:34,B:30,C:26,F:20});
                __brScope.BRRework?.nativeAreaTurrets(g,p,p.pos,slamRadius,slamDamage,null);
                g.emitStudentFx('explosion',p.pos,{dx:aim.x,dy:aim.y,size:slamRadius,color:color,style:'tank-stun',sourceId:sourceId});
                g.getNearbyParticipants(p.pos,slamRadius+80).forEach(function(o){
                    if(!o.alive||o===p||o.id===999||(p.team&&o.team===p.team)||o.pos.dist(p.pos)>slamRadius+o.radius*.3||g.checkWallBetween(p.pos,o.pos))return;
                    __brScope.brApplyPlayableHit(p,g,o,slamDamage,__brScope.brTierValue(tier,{S:35,A:31,B:27,C:23,F:18}),__brScope.brTierValue(tier,{S:34,A:30,B:26,C:22,F:17}),o.pos.sub(p.pos).norm(),'tank-stun',color);
                });
            } else if(key==='tank-punch'||key==='melee-uppercut') {
                targets=__brScope.brPlayableEnemiesInCone(p,g,aim,Number(spec.range||220),Number(spec.halfAngle||.65),1);
                if(!targets.length)__brScope.BRRework.nativeMeleeTurrets(g,p,aim,Number(spec.range||220),Number(spec.halfAngle||.65),__brScope.brTierValue(tier,key==='tank-punch'?{S:60,A:52,B:44,C:36,F:27}:{S:52,A:46,B:40,C:34,F:26}),{scaled:false},1);
                g.addSwingEffect(p,p.pos,aim,Number(spec.range||220),key==='tank-punch'?'punch':'hammer',Number(spec.halfAngle||.62));
                if(targets[0])__brScope.brApplyPlayableHit(p,g,targets[0],__brScope.brTierValue(tier,key==='tank-punch'?{S:60,A:52,B:44,C:36,F:27}:{S:52,A:46,B:40,C:34,F:26}),
                    __brScope.brTierValue(tier,key==='tank-punch'?{S:58,A:52,B:46,C:40,F:32}:{S:48,A:43,B:38,C:33,F:27}),
                    __brScope.brTierValue(tier,key==='tank-punch'?{S:15,A:13,B:11,C:9,F:7}:p.ability.sub==='HAMMER'?{S:38,A:35,B:31,C:27,F:22}:{S:24,A:21,B:18,C:16,F:12}),aim,key,color);
            } else if(key==='melee-lunge') {
                var lungeSpeed=__brScope.brTierValue(tier,{S:36,A:34,B:31,C:29,F:25});
                p.dashType='PLAYER_MELEE_LUNGE';
                __brScope.brStartPlayerDash(p,aim,lungeSpeed,range,__brScope.brTierValue(tier,{S:43,A:38,B:33,C:28,F:22}),__brScope.brTierValue(tier,{S:34,A:30,B:26,C:22,F:17}),__brScope.brTierValue(tier,{S:12,A:10,B:8,C:7,F:5}),'melee-lunge',color);

            } else if(key==='melee-combo'||key==='melee-drain') {
                targets=__brScope.brPlayableEnemiesInCone(p,g,aim,Number(spec.range||220),Number(spec.halfAngle||.86),3);
                g.addSwingEffect(p,p.pos,aim,Number(spec.range||220),'slash',Number(spec.halfAngle||.86));
                g.addSwingEffect(p,p.pos,aim,Number(spec.range||220)*.78,'slash',Number(spec.halfAngle||.86));
                targets=targets.filter(function(o,idx){return __brScope.brApplyPlayableHit(p,g,o,__brScope.brTierValue(tier,{S:48,A:43,B:38,C:33,F:26})*(idx?0.74:1),__brScope.brTierValue(tier,{S:30,A:27,B:24,C:20,F:16}),7,aim,'melee-combo',color);});
                if(p.alive&&p.ability.sub==='VAMPIRE_SLASH'&&targets.length){__brScope.brApplyHealing(p,__brScope.brTierValue(tier,{S:24,A:20,B:16,C:13,F:10}),p);if(p.frenzyFrames>0){p.comboTargetId=targets[0].id;p.comboHitsRemaining=2;p.comboTimer=6;p.comboKind='blood';p.comboCast=p._runSkillCast;p.comboTargetLife=Number(targets[0].lifeSeq||0);}}
                if(p.alive&&p.ability.sub==='SCISSOR_DASH'&&targets.length){p.comboTargetId=targets[0].id;p.comboHitsRemaining=2;p.comboTimer=4;p.comboKind='scissor';p.comboCast=p._runSkillCast;p.comboTargetLife=Number(targets[0].lifeSeq||0);}
            } else if(key==='ranged-sprint') {
                __brScope.brApplyTimedEffect(p,'playerMoveBoostFrames',240,p);p.vel=p.vel.add(aim.mult(5));
                g.emitStudentFx('impact',p.pos,{dx:aim.x,dy:aim.y,size:120,color:'#67e8f9',style:'move-boost',sourceId:sourceId});
            } else if(key==='ranged-overdrive') {
                __brScope.brApplyTimedEffect(p,'playerAttackHasteFrames',300,p);p.basicCooldown=0;
                g.emitStudentFx('impact',p.pos,{dx:aim.x,dy:aim.y,size:128,color:'#fbbf24',style:'attack-haste',sourceId:sourceId});
            } else if(key.indexOf('teleport-')===0) {
                var departure=new __brScope.Vec2(p.pos.x,p.pos.y),landing=__brScope.brAimEndpoint(p,g,aim,range),delta=landing.sub(departure),distance=delta.mag();
                var teleColor=key==='teleport-thunder'?'#fde047':key==='teleport-lava'?'#fb923c':'#c4b5fd';
                p.pos=landing;p.vel=new __brScope.Vec2(0,0);p.warpSeq=(p.warpSeq||0)+1;
                var landingRadius=Number(spec.radius||140),isAssassin=key==='teleport-assassin';
                var blinkDamage=__brScope.brTierValue(tier,{S:66,A:59,B:52,C:44,F:34});
                __brScope.BRRework?.nativeAreaTurrets(g,p,landing,landingRadius,blinkDamage,null);
                g.emitStudentFx('teleport',departure,{dx:distance?delta.x/distance:aim.x,dy:distance?delta.y/distance:aim.y,size:distance,
                    amount:landingRadius,color:teleColor,style:key,sourceId:sourceId});
                targets=g.getNearbyParticipants(landing,landingRadius+80).filter(function(o){
                    return o!==p&&o.alive&&o.id!==999&&!(p.team&&o.team===p.team)&&o.pos.dist(landing)<=landingRadius+o.radius*.3&&!g.checkWallBetween(landing,o.pos);
                }).sort(function(a,b){return a.pos.dist(landing)-b.pos.dist(landing);});
                if(isAssassin)targets=targets.slice(0,p.ability.sub==='VOID_ASSASSIN'?2:1);
                targets.forEach(function(o){
                    var execute=isAssassin&&o.hp/Math.max(1,o.maxHp)<=.35;
                    __brScope.brApplyPlayableHit(p,g,o,blinkDamage*(key==='teleport-thunder'?.90:key==='teleport-lava'?.82:1)+(execute?18:0),
                        isAssassin?30:key==='teleport-thunder'?42:37,isAssassin?14:18,o.pos.sub(landing),key,teleColor);
                });
                if(key==='teleport-lava')g.zones.push(new __brScope.Zone(p,new __brScope.Vec2(landing.x,landing.y),landingRadius,8,120,'rgba(255,100,20,0.5)','dmg',{scaledRadius:true}));
            } else if(key==='ranged-power') {
                var profile=__brScope.brRangedPowerProfile(p.ability),muzzle=p.radius*.78,count=__brScope.brRunCount(1,__brScope.brRunMod(p,'skillCount',0));
                for(var shotIndex=0;shotIndex<count;shotIndex++){
                var shotDir=aim.rotate((shotIndex-(count-1)*.5)*.10);
                var powerShot=new __brScope.Projectile(p,p.pos.add(shotDir.mult(muzzle)),shotDir,profile.speed,profile.damage,profile.size,'bullet',profile.color,profile.blast,null,
                    {knockback:profile.push,trailColor:profile.color,impactColor:profile.color,weaponStyle:profile.style,impactStyle:'ranged-power',
                     normalizedSkillStats:true,playerSkillBlast:true,rangeRemaining:Math.max(1,profile.range-muzzle)});
                powerShot.life=Math.max(12,Math.ceil((profile.range-muzzle)/profile.speed)+1);g.projectiles.push(powerShot);
                }
                g.emitStudentFx('muzzle',p.pos.add(aim.mult(muzzle)),{dx:aim.x,dy:aim.y,size:148,color:profile.color,style:profile.style,sourceId:sourceId});
            } else return false;
            var farmSkillToken='skill:'+(p.farmActionSeq=(p.farmActionSeq||0)+1);
            if(key==='tank-stun')__brScope.brFarm.area(g,p,p.pos,Number(spec.radius||spec.range||190),.65,farmSkillToken);
            else if(['tank-punch','melee-uppercut','melee-combo','melee-drain'].includes(key))__brScope.brFarm.cone(g,p,aim,Number(spec.range||220),Number(spec.halfAngle||.65),.65,farmSkillToken);
            else if(key.indexOf('teleport-')===0)__brScope.brFarm.area(g,p,p.pos,Number(spec.radius||140),.65,farmSkillToken);
            if(__brScope.isTankAbility(p.ability)&&key.indexOf('tank-')===0){__brScope.brApplyGuard(p,p,72,.20);}
            p.cooldown=Math.max(60,Math.round(info.cooldown));
            return true;
        };

__brScope.brCastPlayerSkill = function brCastPlayerSkill(p,g,aim,power) {
            if(__brScope.BRRework?.defs[p.ability.id])return __brScope.BRRework.cast(p,g,aim,power);
            const accepted=__brScope.brWithRunSkill(p,g,function(){return __brScope.brCastPlayerSkillBase(p,g,aim,power);});if(accepted!==false&&__brScope.brRunCapabilities(p.ability).skill.damage)__brScope.brRevealSmoke(p,g,60,'attack');return accepted;
        };

__brScope.brCastPlayerSkillBase = function brCastPlayerSkillBase(p,g,aim,power) {
            if(__brScope.BRRework?.defs[p.ability.id])return __brScope.BRRework.cast(p,g,aim,power);
            if(!p.alive)return false;
            p.abilityUses++;p.basicContactUntilFrame=-1;
            var spec=__brScope.brAimSpec(p.ability,'skill',p.radius,power,p.run?.mods||{}),point=__brScope.brAimEndpoint(p,g,aim,Number(spec.range||0));
            var playable=__brScope.brGetPlayableSkillInfo(p.ability);
            if(playable&&__brScope.brCastPlayableSkill(p,g,aim,power,playable,spec))return true;
            var selfCast=p.ability.type===__brScope.ABILITY_TYPES.BUFF||p.ability.type===__brScope.ABILITY_TYPES.AREA||p.ability.type===__brScope.ABILITY_TYPES.CLONE;
            var endpointOnly=p.ability.type===__brScope.ABILITY_TYPES.TELEPORT||p.ability.type===__brScope.ABILITY_TYPES.ZONE||p.ability.type===__brScope.ABILITY_TYPES.TURRET;
            var victim=selfCast?null:__brScope.brFindDirectionalTarget(p,g,aim,spec,endpointOnly);
            var victimPointTypes=[__brScope.ABILITY_TYPES.MELEE,__brScope.ABILITY_TYPES.ORBIT,__brScope.ABILITY_TYPES.PULL,__brScope.ABILITY_TYPES.LASER];
            var targetPoint=victim&&victimPointTypes.indexOf(p.ability.type)>=0?victim.pos:point;
            var actual=selfCast?p:(victim&&victimPointTypes.includes(p.ability.type)?victim:__brScope.brMakeAimTarget(p,targetPoint,victim));
            if(p.ability.sub==='GHOST_MOVE')actual=__brScope.brMakeAimTarget(p,p.pos.add(aim.mult(700)),null);
            if(p.ability.type===__brScope.ABILITY_TYPES.PROJ||p.ability.type===__brScope.ABILITY_TYPES.LASER)point=p.pos.add(aim.mult(Number(spec.range||0)));
            p.manualAimPoint=point;
            if(p.ability.type===__brScope.ABILITY_TYPES.DASH) {
                var speed=Math.max(1,Number(p.ability.dashSpeed||35));
                p.manualDashFrames=Math.max(5,Math.round(Number(spec.range||360)/speed));
            }
            try {
                p.usePlayerAbility(g,actual,aim,selfCast?0:actual.pos.dist(p.pos));
                // Laser farming and player hits share the clipped beam inside usePlayerAbilityBase.
                if(p.ability.type===__brScope.ABILITY_TYPES.DASH){
                    var tier=p.ability.t||'C';
                    var contact={THUNDER_DASH:[24,38,24],LIGHTNING_DASH:[19,33,19],CAR_RUSH:[21,36,21],BOAR_CHARGE:[17,31,17],KINETIC_CHARGE:[22,42,25]}[p.ability.sub];
                    __brScope.brStartPlayerDash(p,aim,Math.max(1,Number(p.ability.dashSpeed||35)),Number(spec.range||360),
                        contact?contact[0]*Math.min(1.25,Math.max(.9,p.damageMult)):__brScope.brTierValue(tier,{S:34,A:30,B:26,C:22,F:16}),
                        contact?contact[1]:__brScope.brTierValue(tier,{S:32,A:29,B:26,C:23,F:18}),contact?contact[2]:8,'native-dash',__brScope.BR_TIER_COLOR[tier]||'#fff');
                }
                if(playable&&playable.key==='native')p.cooldown=Math.max(60,playable.cooldown);
            } finally {
                p.manualAimPoint=null;p.manualDashFrames=0;
            }
            return true;
        };

__brScope.brClosePolish = function brClosePolish(ability) {return !!ability&&ability.id!=='emoji-054'&&__brScope.brProgressionCombat.basicProfile(ability).close===true;};

__brScope.brBaseWalkingSpeed = function brBaseWalkingSpeed(p) {
            if(p.ability.id==='emoji-139')return __brScope.BR_V29_ZOMBIE_WALK;
            return .7*Math.max(5.6,p.speed*4.05)*(p.ability.sub==='STONE'?.48:1)*(__brScope.brClosePolish(p.ability)?1.04:1)*(__brScope.brBasicCombatProfile(p.ability).close?1:.95);
        };

__brScope.brHumanMoveSpeed = function brHumanMoveSpeed(p) {
            return __brScope.brBaseWalkingSpeed(p)*(p.teamHasteFrames>0?1.12:1)*(p.playerChaseFrames>0?1.12:1)*(p.playerMoveBoostFrames>0?1.48:1)*__brScope.brRunMod(p,'moveSpeed')*(__brScope.BRRework?.moveRate(p)??1);
        };

__brScope.brApplyPlayerInput = function brApplyPlayerInput(p,g) {
            const R=__brScope.BRRework,raw=__brScope.session.inputs[p.remoteId]||{},life=Number(p.lifeSeq||0);
            const input=raw.matchKey===__brScope.brRingKey()&&raw.life===life&&String(raw.sessionId||'')===String(p.sessionId||'')?raw:{};
            const validLife=Number.isInteger(input.life)&&input.life===life&&input.matchKey===__brScope.brRingKey();
            const fresh=validLife&&__brScope.brNow()-Number(input._receivedAt||0)<250;
            const locks=R?.inputLocks(p,g)||{move:p.stunned>0,attack:p.stunned>0,skill:p.stunned>0,steerAllowed:false};
            p.lastInputSeq=Math.max(Number(p.lastInputSeq||0),Number(input.seq||0));
            let dx=fresh&&!locks.move?Number(input.dx||0):0,dy=fresh&&!locks.move?Number(input.dy||0):0;
            if(!Number.isFinite(dx)||!Number.isFinite(dy)){dx=0;dy=0;}
            let move=new __brScope.Vec2(dx,dy),moveAmount=__brScope.brClamp(move.mag(),0,1);if(move.mag()>1)move=move.norm();
            let receivedAim=false;
            if(fresh&&Number.isFinite(input.ax)&&Number.isFinite(input.ay)&&!locks.steerAllowed) {
                const ad=new __brScope.Vec2(Number(input.ax),Number(input.ay));if(ad.mag()>.05){p.lastAimDir=ad.norm();receivedAim=true;}
            }
            if(!receivedAim&&move.mag()>.05&&!locks.steerAllowed)p.lastAimDir=move.norm();
            if(p.basicCooldown>0)p.basicCooldown=Math.max(0,p.basicCooldown-__brScope.brCooldownRate(p,'attack'));
            if(p.cooldown>0)p.cooldown=Math.max(0,p.cooldown-__brScope.brCooldownRate(p,'skill'));
            const steering=input.steer,steerSeq=Number(input.steerSeq||0),steerWireSeq=Number(input.seq||0);
            if(steerWireSeq>Number(p.lastRemoteSteerWire||0)){
                p.lastRemoteSteerWire=steerWireSeq;
                if(fresh&&locks.steerAllowed&&steering?.kind==='steer'&&steering.seq===steerSeq&&steering.life===life&&typeof steering.castId==='string'&&Number.isFinite(steering.ax)&&Number.isFinite(steering.ay))
                    R.steer(p,g,__brScope.brNormalizeAimVector(steering.ax,steering.ay),steering.castId);
            }
            for(const kind of ['attack','skill']) {
                const isAttack=kind==='attack',seq=Number(input[kind+'Seq']||0),seenKey=isAttack?'lastRemoteAttack':'lastRemoteSkill';
                const pendingKey=isAttack?'pendingAttack':'pendingSkill',resolvedKey=isAttack?'resolvedAttackSeq':'resolvedSkillSeq';
                if(seq>Number(p[seenKey]||0)) {
                    p[seenKey]=seq;
                    const command=input[kind],valid=command&&command.seq===seq&&command.life===life&&['cast','recast'].includes(command.kind)&&typeof command.castId==='string';
                    const blocked=isAttack?locks.attack:locks.skill;
                    if(!fresh||!valid||blocked||(isAttack&&command.kind!=='cast')){__brScope.brCombatTrace('action-rejected',{frame:g.frame,life,kind,seq,reason:!fresh?'stale-life-match':!valid?'command':blocked?'locked':'kind'});p[resolvedKey]=seq;p[pendingKey]=null;}
                    else {const dir=__brScope.brValidateAimHelp(p,g,kind,command);
                        p[pendingKey]={seq,aim:dir.norm(),power:__brScope.brClamp(Number(command.ap??input.ap??1),.18,1),expires:g.frame+6,life,kind:command.kind,castId:command.castId,command};}
                }
                const pending=p[pendingKey];if(!pending)continue;
                if(!fresh||!p.alive||pending.life!==life||(isAttack?locks.attack:locks.skill)||g.frame>pending.expires||(!isAttack&&p.skillUsesLeft===0)) {
                    p[resolvedKey]=pending.seq;p[pendingKey]=null;continue;
                }
                if(pending.kind==='cast'&&(isAttack?p.basicCooldown:p.cooldown)>0)continue;
                if(pending.kind==='cast'&&pending.castId!==''){p[resolvedKey]=pending.seq;p[pendingKey]=null;continue;}
                pending.aim=__brScope.brValidateAimHelp(p,g,kind,pending.command).norm();
                const protection=p.spawnProtectionUntilFrame;if(__brScope.session.respawnMode)p.spawnProtectionUntilFrame=0;
                p.activeInputCommand={kind,seq:pending.seq,life,castId:pending.castId,distance:!isAttack&&p.ability.id==='emoji-019'&&Number.isFinite(pending.command?.distance)?__brScope.brTrainDistance(pending.power,__brScope.brRunMod(p,'signatureRange',1),pending.command.distance):undefined};
                try {
                    let accepted=true;
                    if(isAttack)accepted=__brScope.brBasicAttack(p,g,pending.aim)===true;
                    else if(pending.kind==='recast')accepted=!!R?.recast(p,g,pending.aim,pending.castId,pending.power);
                    else accepted=__brScope.brCastPlayerSkill(p,g,pending.aim,pending.power)!==false;
                    if(accepted){if(__brScope.session.respawnMode)p.spawnProtectionUntilFrame=0;p[isAttack?'firedAttackSeq':'firedSkillSeq']=pending.seq;
                        if(!isAttack)p.skillCooldownMax=Math.max(1,Number(p.cooldown||p.maxCooldown||1));}
                    else p.spawnProtectionUntilFrame=protection;
                    __brScope.brCombatTrace('action-resolved',{matchKey:__brScope.brRingKey(),frame:g.frame,life,id:p.ability.id,kind,seq:pending.seq,accepted});
                } finally {p.activeInputCommand=null;p[resolvedKey]=pending.seq;p[pendingKey]=null;}
            }
            const afterLocks=R?.inputLocks(p,g)||locks;p.presentationDriveX=0;p.presentationDriveY=0;p.presentationDriveKnown=1;
            if(!afterLocks.move&&p.stunned<=0&&p.dashFrames<=0&&!p.playerDash) {
                const moveSpeed=__brScope.brHumanMoveSpeed(p),desired=moveAmount>.05?move.norm().mult(moveSpeed*(.24+.76*moveAmount)):new __brScope.Vec2(0,0);
                const response=moveAmount>.05?.78:.48;p.presentationDriveX=desired.x;p.presentationDriveY=desired.y;
                p.vel=p.vel.mult(1-response).add(desired.mult(response));
            }
        };

__brScope.brMeleeTargetIntersectsCone = function brMeleeTargetIntersectsCone(origin,target,aim,range,halfAngle) {
            return __brScope.brSectorTouches(origin,target,aim,range,halfAngle,1);
        };

__brScope.brBasicAttack = function brBasicAttack(p,g,aim) {
            if(!p.alive||p.stunned>0||__brScope.BRRework?.inputLocks(p,g)?.attack)return false;
            __brScope.brRevealSmoke(p,g,60,'attack');
            var rwBasic=__brScope.BRRework?.basicAttempt(p,g,aim)||null;
            var rwAttackId=(p.remoteId||p.id)+':'+Number(p.lifeSeq||0)+':basic:'+((p.rwBasicSeq=(p.rwBasicSeq||0)+1));
            aim=aim&&aim.mag()>.05?aim.norm():new __brScope.Vec2(1,0);
            var mods=p.run?.mods||{},tier=p.ability.t,cd=__brScope.brBasicAttackFrames(p.ability,mods),profile=__brScope.brRunBasicProfile(p.ability,mods),color=p.ability.pTrail||__brScope.BR_TIER_COLOR[tier]||'#fff';
            var farmToken='basic:'+(p.farmActionSeq=(p.farmActionSeq||0)+1),farmUnits=__brScope.brFarm.basicUnits(cd);
            p.attackCommitFrames=Math.max(p.attackCommitFrames,10);
            if(profile.close) {
                var stepDistance=__brScope.brBasicStepDistance(p.ability,mods,__brScope.brCooldownRate(p,'attack'));
                var range=Math.max(p.radius,(p.radius+profile.rangeBonus)*Number(mods.basicRange||1)-stepDistance),damage=__brScope.brTierValue(tier,{S:27,A:24,B:21,C:18,F:13})*profile.damageScale*(__brScope.brClosePolish(p.ability)?1.05:1);
                p.basicContactUntilFrame=g.frame+10;
                if(stepDistance>0&&p.alive&&p.stunned<=0&&!p.playerDash&&p.dashFrames<=0&&p.launchedFrames<=0) {
                    var stepped=__brScope.brMoveBasicStep(p.pos,aim,stepDistance,p.radius,__brScope.brHostBodyWalls(g),g.worldRadius,g.center,p._combatMoveResult);
                    p.pos.x=stepped.x;p.pos.y=stepped.y;
                }
                var push=__brScope.brTierValue(tier,{S:39,A:35,B:30,C:25,F:19})*profile.pushScale,hit=false,totalDealt=0;
                g.addSwingEffect(p,p.pos,aim,range,profile.style,profile.halfAngle,__brScope.brFxCommand(p,'sector',{halfAngle:profile.halfAngle,basic:true,part:profile.style,displayMs:__brScope.brFeelSwingMs(p.ability,profile)}));
                __brScope.brFarm.cone(g,p,aim,range,profile.halfAngle,farmUnits,farmToken);
                __brScope.BRRework?.nativeMeleeTurrets(g,p,aim,range,profile.halfAngle,damage*p.damageMult*.72*__brScope.brCombatPower(p));
                // Broad phase must include the full target circle used by the exact cone test.
                for(var o of g.getNearbyParticipants(p.pos,range+Math.max(128,Number(g.maxBodyRadius||0)))) {
                    if(!o.alive||o===p||o.id===999||(p.team&&o.team===p.team)||!__brScope.brCanHostileTarget(o,p))continue;
                    if(!__brScope.brMeleeTargetIntersectsCone(p.pos,o,aim,range,profile.halfAngle)||g.checkWallBetween(p.pos,o.pos))continue;
                    var bodyContact=__brScope.isTankAbility(p.ability)&&o.pos.dist(p.pos)<=p.radius+o.radius+.5;
                    var hitPush=push+(bodyContact?3:0),hitStyle=bodyContact?'body-check':'basic-'+profile.style;
                    var before=o.hp,previous=p.currentImpactStyle;p.currentImpactStyle='basic-'+profile.style;
                    try{o.takeDamage(damage*p.damageMult*.72*__brScope.brCombatPower(p),p,false,aim,{basic:true,attackId:rwAttackId,basicSnapshot:rwBasic,attackFrames:cd,knockback:hitPush});}finally{p.currentImpactStyle=previous||'';}
                    const dealt=Math.max(0,before-o.hp);if(!o._lastDamageResult?.valid)continue;totalDealt+=dealt;
                    if(!o.alive){hit=true;continue;}__brScope.BRRework.nativeImpulse(o,p,aim,hitPush,g,null,{hardForce:false});
                    // Basic soft impulse never arms skill cancellation or a secondary collision attack.
                    // Basic attacks never create stun, including heavy melee hits.
                    hit=true;
                }
                if(hit&&p.alive) {
                    if(profile.reward==='drain'&&!__brScope.BRRework?.defs[p.ability.id])p.hp=Math.min(p.maxHp,p.hp+totalDealt*(p.frenzyFrames>0?.20:.12));
                    if(profile.reward==='guard')__brScope.brApplyGuard(p,p,40,.14,'basic',null);
                    if(profile.reward==='chase')p.playerChaseFrames=Math.max(p.playerChaseFrames,42);
                    g.spawnImpact(p.pos.add(aim.mult(range*.75)),range*.65,color,.65);
                }
            } else {
                var damage=__brScope.brTierValue(tier,{S:21,A:18,B:15,C:12,F:8})*profile.damageScale*p.damageMult*.72*__brScope.brCombatPower(p),size=__brScope.brBasicShotSize(p.ability,false,mods)*Number(mods.basicSize||1);
                for(var i=0;i<profile.count;i++) {
                    var dir=aim.rotate((i-(profile.count-1)/2)*profile.spread),shot=new __brScope.Projectile(p,p.pos.add(dir.mult(p.radius*.7)),dir,profile.speed,damage,size,profile.type,color,profile.explode,profile.emoji,
                        {basicSnapshot:rwBasic,basicAttackId:rwAttackId,homingTurnRate:profile.homingTurnRate,knockback:profile.knockback,trailColor:color,impactColor:color,weaponStyle:profile.style,impactStyle:'ranged-basic',basicDamageMultiplier:Number(mods.basicDamage||1)*__brScope.brCombatPower(p),pierce:profile.pierce,bounces:profile.bounces,status:profile.status,statusPower:profile.statusPower,spinRate:profile.spin,faceDir:profile.face,hitOncePerPass:true});
                    var outward=Math.max(8,Math.ceil(profile.range/profile.speed));shot.life=profile.type==='BOOMERANG'?outward+60:outward;shot.returnAfterLife=60;
                    shot.farmDamage=farmUnits;shot.farmToken=farmToken;
                    g.projectiles.push(shot);
                }
            }
            p.basicCooldown=cd;p.basicCooldownMax=cd;
            __brScope.brCombatTrace('basic-executed',{frame:g.frame,life:p.lifeSeq,seq:p.activeInputCommand?.seq,id:p.ability.id,profile:profile.close?'melee':'ranged',x:p.pos.x,y:p.pos.y,dx:aim.x,dy:aim.y});return true;
        };

__brScope.brAimHelpProfile = function brAimHelpProfile(a,kind,radius=38,power=1,mods={}) {
            const basic=__brScope.brRunBasicProfile(a,mods),def=__brScope.brReworkDefinition(a)?.skill,spec=__brScope.brAimSpec(a,kind,radius,power,mods);
            let name='none',reason='자가 광역·지원·지점·이동 스킬은 수동 유지';
            if(kind==='attack') {if(basic.type==='missile')reason='기존 유도 규칙 유지';else name=basic.close?'melee':'ranged';}
            else if(/homing/.test(def?.kind||''))reason='기존 유도 규칙 유지';
            else if(def?.kind==='pin-traps')reason='함정 지정 위치 유지';
            else if(!spec.dash&&!spec.teleport&&!def?.caps?.dash&&!def?.capabilities?.dash&&['line','cone','rect'].includes(spec.shape)) {
                name=/hook|sniper|precision|channel|laser/.test(def?.kind||'')||a.sub==='SNIPE'||a.sub==='AIMED_SHOT'||spec.beam?'precision':'skill';
            }
            return {name,reason:name==='none'?reason:'',...__brScope.BR_AIM_HELP[name],spec,basic,kind,
                range:Math.max(0,spec.range||0),width:kind==='attack'&&!basic.close?__brScope.brBasicShotSize(a,true,mods)*Number(mods.basicSize||1):Math.max(0,(spec.width||0)/2),
                slow:kind==='attack'?!basic.close&&basic.speed<13:!!def?.speed&&def.speed<13};
        };

__brScope.brAimHelpAngle = function brAimHelpAngle(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));};

__brScope.brAimHelpContext = function brAimHelpContext(kind,power,p,g){if(!p||!g)return null;const a=p.ability,mods=p.run?.mods||{},profile=__brScope.brAimHelpProfile(a,kind,p.radius,power,mods),bounds=__brScope.brViewerBounds(p,__brScope.session.inputs[p.remoteId]);bounds.hw-=__brScope.BR_VIEW_PAD;bounds.hh-=__brScope.BR_VIEW_PAD;return {host:true,self:p,g,a,origin:p.pos,radius:p.radius,profile,bounds,now:__brScope.now(),team:p.team,walls:g.walls,boxes:g.farmBoxes||[]};};

__brScope.brAimHelpCandidates = function brAimHelpCandidates(c,force=false) {
            const key=__brScope.brRingKey()+':'+Number(c.self.rw?.life??c.self.lifeSeq??0),cache=__brScope.session.aimHelpCache;
            if(!c.host&&!force&&cache?.key===key&&c.now-cache.at<__brScope.BR_AIM_HELP.searchMs)return cache.list;
            const list=[];
            if(c.host){for(const p of c.g.getNearbyParticipants(c.origin,c.profile.range+160))if(p!==c.self)list.push({id:'p:'+p.remoteId,life:Number(p.lifeSeq||0),ref:p,type:'player'});
                for(const t of __brScope.BRRework.turrets(c.g,c.origin,c.profile.range+80))list.push({id:'t:'+t.id,life:Number(t.ctx?.ownerLifeSeq||0),ref:t,type:'turret'});
            } else {
                __brScope.session.drawPlayers?.forEach((p,id)=>{if(id!==String(__brScope.session.playerId))list.push({id:'p:'+id,life:Number(p.rw?.life||0),ref:p,type:'player'});});
                for(const t of __brScope.session.latestView?.rw?.entities||[])if(t.kind==='turret')list.push({id:'t:'+t.id,life:Number(t.life||0),ref:t,type:'turret'});
            }
            if(c.profile.kind==='attack')for(const b of c.boxes)list.push({id:'c:'+String(c.host?b.id:b[0]),life:0,ref:b,type:'crate'});
            if(!c.host)__brScope.session.aimHelpCache={key,at:c.now,list};return list;
        };

__brScope.brAimHelpTarget = function brAimHelpTarget(c,entry) {
            const p=entry.ref;let x,y,r,vx=0,vy=0,box=null;
            if(entry.type==='player'){
                if(c.host){if(!p.alive||p.id===999||!__brScope.brCanHostileTarget(p,c.self)||c.g.isConcealedFrom(p,c.self)||entry.life!==Number(p.lifeSeq||0))return null;x=p.pos.x;y=p.pos.y;r=p.radius;vx=p.vel.x;vy=p.vel.y;}
                else {const id=entry.id.slice(2);if(__brScope.session.drawPlayers?.get(id)!==p||!p.row?.[7]||(c.team&&Number(p.row[8])===c.team)||(Number(p.row[23])&32)||c.now-p.last>__brScope.BR_AIM_HELP.freshMs||entry.life!==Number(p.rw?.life||0))return null;
                    x=p.x;y=p.y;r=Number(p.row[15]);vx=p.vx||0;vy=p.vy||0;}
            }else if(entry.type==='turret'){
                if(c.host){if(p.dead||p.hp<=0||p.owner===c.self||(c.team&&p.team===c.team)||c.g.isConcealedFrom(p,c.self))return null;x=p.pos.x;y=p.pos.y;r=p.radius;}
                else {if(!(p.hp>0)||!__brScope.session.latestView?.rw?.entities?.includes(p)||p.owner===String(__brScope.session.playerId)||(c.team&&p.team===c.team)||c.now-Number(__brScope.session.lastActorPacketAt||0)>__brScope.BR_AIM_HELP.freshMs)return null;x=p.x;y=p.y;r=p.radius;}
            } else {
                if(c.host){if(p.hp<=0||!c.boxes.includes(p))return null;x=p.pos.x;y=p.pos.y;r=p.halfSize;box=p;}
                else {if(p[3]<=0||!c.boxes.includes(p))return null;x=p[1];y=p[2];r=__brScope.brCrateHalf(p);box=p;}
            }
            if(!c.host&&__brScope.brSmokeConcealed(__brScope.session.latestView?.smokes||[],{pos:{x,y},team:entry.type==='crate'?0:Number(p.row?.[8]??p.team??0),invisible:!!(Number(p.row?.[23])&32),lifeSeq:p.rw?.life||0,smokeRevealLife:p.rw?.life||0,smokeRevealEnd:p.rw?.smokeRevealEnd||0}, {pos:c.origin,team:c.team},__brScope.session.latestView?.frame||0))return null;
            if(![x,y,r].every(Number.isFinite)||!__brScope.brViewContains(c.bounds,x,y,0))return null;
            const distance=Math.hypot(x-c.origin.x,y-c.origin.y);if(distance-r>c.profile.range)return null;
            return {...entry,x,y,r,box,vx,vy,distance,angle:Math.atan2(y-c.origin.y,x-c.origin.x)};
        };

__brScope.brAimHelpContact = function brAimHelpContact(c,t,angle) {
            const dir={x:Math.cos(angle),y:Math.sin(angle)},end={x:c.origin.x+dir.x*c.profile.range,y:c.origin.y+dir.y*c.profile.range},spec=c.profile.spec;
            if(c.profile.basic.close&&c.profile.kind==='attack'){
                if(t.box)return __brScope.brCrateSectorTouches(t.box,c.origin,dir,c.profile.range,spec.halfAngle||1.2)?Math.max(0,(t.distance-t.r)/Math.max(1,c.profile.range)):null;
                return __brScope.brSectorTouches(c.origin,{pos:{x:t.x,y:t.y},radius:t.r},dir,c.profile.range,spec.halfAngle||1.2,1)?Math.max(0,(t.distance-t.r)/Math.max(1,c.profile.range)):null;
            }
            if(t.box)return __brScope.brCrateSweepTime(t.box,c.origin,end,c.profile.width);
            return __brScope.combatSegmentCircleTime(c.origin.x-t.x,c.origin.y-t.y,end.x-c.origin.x,end.y-c.origin.y,t.r+c.profile.width);
        };

__brScope.brAimHelpClear = function brAimHelpClear(c,t,angle=t.angle) {
            const length=Math.min(c.profile.range,t.distance),dir={x:Math.cos(angle),y:Math.sin(angle)},to={x:c.origin.x+dir.x*length,y:c.origin.y+dir.y*length};
            const wall=__brScope.combatTraceWalls(c.origin,to,c.profile.basic.close&&c.profile.kind==='attack'?0:c.profile.width,c.walls);
            const hit=__brScope.brAimHelpContact(c,t,angle),limit=hit===null?Math.max(0,(t.distance-t.r)/Math.max(1,length)):Math.min(1,hit*c.profile.range/Math.max(1,length));
            if(wall&&wall.t<limit-.001)return false;
            for(const b of c.boxes){if((c.host?b.hp:b[3])<=0||b===t.box)continue;const time=__brScope.brCrateSweepTime(b,c.origin,to,c.profile.width);if(time!==null&&time<limit-.001)return false;}
            return true;
        };

__brScope.brValidateAimHelp = function brValidateAimHelp(p,g,kind,command) {
            const raw=__brScope.brNormalizeAimVector(command.rax??command.ax,command.ray??command.ay,p.lastAimDir?.x??1,p.lastAimDir?.y??0);
            if(!command.assist)return raw;
            const c=__brScope.brAimHelpContext(kind,__brScope.brClamp(Number(command.ap??1),.18,1),p,g),cfg=c?.profile,a=command.assist;
            if(!cfg||cfg.name==='none'||!['tap','drag'].includes(a.mode)||a.mode==='tap'&&kind!=='attack'||!Number.isFinite(command.ax)||!Number.isFinite(command.ay))return raw;
            const proposed=__brScope.brNormalizeAimVector(command.ax,command.ay),ra=Math.atan2(raw.y,raw.x),pa=Math.atan2(proposed.y,proposed.x),cap=(a.mode==='tap'?cfg.tap:cfg.max)*Math.PI/180;
            if(Math.abs(__brScope.brAimHelpAngle(pa,ra))>cap+.00001)return raw;
            const targets=__brScope.brAimHelpCandidates(c,true).map(e=>__brScope.brAimHelpTarget(c,e)).filter(Boolean),t=targets.find(t=>t.id===a.id&&t.life===a.life);
            if(!t||Math.abs(__brScope.brAimHelpAngle(t.angle,ra))>(a.mode==='tap'?cfg.tap:cfg.cone)*Math.PI/180||!__brScope.brAimHelpClear(c,t,pa)||!__brScope.brAimHelpClear(c,t))return raw;
            if(targets.some(other=>other.id!==t.id&&__brScope.brAimHelpContact(c,other,ra)!==null&&__brScope.brAimHelpClear(c,other,ra)))return raw;
            if(Math.abs(__brScope.brAimHelpAngle(t.angle,pa))>Math.abs(__brScope.brAimHelpAngle(t.angle,ra))+.001)return raw;
            return proposed; // Never acquire another target or apply correction twice.
        };
}
export const initializers=[

];
