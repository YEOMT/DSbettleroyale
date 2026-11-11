// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
import {activeSupply, supplyDirectHit} from '../farm/combat-supplies.js';
export function install(__brScope){
// Explicit room-scoped deltas let frozen parity fixtures neutralize only the
// approved balance changes without replacing their original combat assertions.
__brScope.ROSTER10_BALANCE={bcHp:1.06,rangedPush:.88,farmInitial:1.10,farmXpWave:1.10,farmHealWave:1.15,initialCap:46,xpWaveCap:9,xpCap:53,healCap:7,respawnExtra:4,genieHp:56,genieTicks:1440};
__brScope.Participant = class Participant {
            constructor(id, name, ability, pos, team=0) {
                const rwDef=__brScope.BR_REWORK_DEFS?.[ability.id],statType=rwDef?.statType||ability.type;
                this.id = id; this.name = name; this.ability = ability; this.pos = pos;
                this.team = team;
                
                const tierMult = {S:1.70, A:1.55, B:1.50, C:1.40, F:1.25}[ability.t]; // v20.3: B/C 체력 유지 + 소형 원거리 S/A 별도 생존 보정
                this.radius = 38 * (ability.sizeMult || 1.0); 
                this.maxHp = 150 * tierMult * (ability.sizeMult || 1.0); this.hp = this.maxHp;
                
                this.damageMult = {S:1.0, A:1.3, B:2.2, C:2.5, F:1.25}[ability.t]; // v20: F급은 공격보다 생존 특화
                this.knockbackResist = 1.0;
                
                let baseSpeed = 1.5;
                if(statType === __brScope.ABILITY_TYPES.DASH) baseSpeed += 0.5;
                if(ability.sizeMult > 1.3) baseSpeed -= 0.3;
                if(ability.sizeMult < 0.9) baseSpeed += 0.3;
                this.speed = Math.max(0.5, baseSpeed);

                // v21.1: S/A 원거리 전체를 소폭 보강하고, 소형 원거리는 추가 생존/기동 보정.
                this.rangedElite = __brScope.isEliteRangedAbility(ability);
                this.eliteSkirmisher = __brScope.isSmallRangedEliteAbility(ability);
                if(this.rangedElite) {
                    this.maxHp *= ability.t === 'S' ? 1.09 : 1.07;
                    this.speed *= ability.t === 'S' ? 1.08 : 1.06;
                }
                if(this.eliteSkirmisher) {
                    this.maxHp *= ability.t === 'S' ? 1.20 : 1.17;
                    this.speed *= ability.t === 'S' ? 1.16 : 1.13;
                }
                this.hp = this.maxHp;

                this.vel = new __brScope.Vec2(0,0); this._combatMoveResult={x:0,y:0,vx:0,vy:0,hit:null,_wallCandidates:[]}; this.alive = true; this.cooldown = 0; this.abilityTiming = __brScope.getAbilityTiming(ability); this.maxCooldown = this.abilityTiming.cooldown; 
                this.stunned = 0; this.humanControlled = true; this.applyPlayerInput = null;
                
                this.dashFrames = 0; this.dashType = null;
                this.dashImpactDone = false; this.dashTargetId = null; this.blindedFrames = 0;
                this.flashFrames = 0; this.flashUntilFrame=0;this.lastDamageImpactLevel=0;this.lastDamageVisualFrame=-9999; // Physics-frame visual clock

                if (statType === __brScope.ABILITY_TYPES.MELEE) {
                    // v21.5: 장판 메타에서 접근 자체가 리스크가 된 근접형을 한 단계 더 단단하고 빠르게.
                    // v21.8: A~C 직접 근접만 소폭 추가 체력 상향.
                    // 회오리/허리케인 계열(ORBIT)은 여기 포함되지 않는다.
                    const meleeHpMult = ability.t === 'S' ? 1.34
                        : ability.t === 'A' ? 1.54
                        : ability.t === 'B' ? 1.55
                        : ability.t === 'C' ? 1.50
                        : 1.43;
                    this.maxHp *= meleeHpMult;
                    this.hp = this.maxHp;
                    this.speed *= 1.20;
                    this.radius *= 1.08;
                }
                if(__brScope.isTankAbility(ability)) {
                    if(ability.legacyTank) {
                        // 기존 공격 정체성은 유지하되, 생존력과 넉백 저항을 올리고 화력/기동성을 조금 교환.
                        const tankHp={S:1.03,A:1.08,B:1.10,C:1.16,F:1.22}[ability.t]||1.08;
                        const tankDmg={S:0.97,A:0.96,B:0.95,C:0.94,F:0.92}[ability.t]||0.95;
                        this.maxHp*=tankHp;
                        this.damageMult*=tankDmg;
                        this.speed*=ability.t==='F'?0.90:0.95;
                        this.radius*=1.03;
                        this.knockbackResist=ability.t==='F'?0.72:0.76;
                    } else {
                        const tankHp={S:1.08,A:1.08,B:1.10,C:1.10,F:1.06}[ability.t]||1.08;
                        this.maxHp*=tankHp;
                        this.speed*=ability.t==='F'?0.94:0.90;
                        this.radius*=1.04;
                        this.knockbackResist=ability.t==='F'?0.76:0.68;
                    }
                    this.hp=this.maxHp;
                }

                // 장판형은 후반까지 자리를 잡고 중첩을 만들 수 있도록 약간 더 단단하게.
                if (statType === __brScope.ABILITY_TYPES.ZONE) {
                    this.maxHp *= ability.t === 'S' ? 1.22 : 1.15;
                    this.hp = this.maxHp;
                }
                this.trailDasher = __brScope.isTrailDashAbility(ability);
                if(this.trailDasher) {
                    const hpBuff = ability.t === 'A' ? 1.12 : ability.t === 'B' ? 1.15 : 1.18;
                    this.maxHp *= hpBuff; this.speed *= ability.t === 'A' ? 1.08 : 1.10; this.hp = this.maxHp;
                }
                if(ability.sub === 'FLY_DASH') {
                    this.maxHp *= 1.10; this.hp = this.maxHp; this.speed *= 1.10;
                }
                // v21.10: 직접 적진에 몸을 넣는 돌진형/암살자형은 체력 소폭 상향.
                if(__brScope.DIRECT_ASSAULT_DASH_SUBS.has(ability.sub)) {
                    this.maxHp *= 1.06;
                    this.hp = this.maxHp;
                }
                if(__brScope.ASSASSIN_TELEPORT_SUBS.has(ability.sub)) {
                    // v21.13: 암살자는 진입 후 빠져나오는 체급/기동력이 핵심.
                    this.maxHp *= 1.11;
                    this.speed *= ability.sub === 'BACKSTAB' ? 1.18 : 1.14;
                    // v22.3: B 암살자는 작은 체형을 유지하면서 후반 생존용 체급만 추가 보강.
                    if(ability.sub === 'BACKSTAB') this.maxHp *= 1.08;
                    this.hp = this.maxHp;
                }

                if ((ability.t === 'S' || ability.t === 'A' || ability.t === 'B') &&
                    (statType === __brScope.ABILITY_TYPES.MELEE || statType === __brScope.ABILITY_TYPES.ORBIT)) {
                    const closeHp = statType === __brScope.ABILITY_TYPES.MELEE
                        ? (ability.t === 'S' ? 1.12 : ability.t === 'A' ? 1.15 : ability.t === 'B' ? 1.12 : 1.10)
                        : (ability.t === 'S' ? 1.08 : ability.t === 'A' ? 1.10 : 1.08);
                    this.maxHp *= closeHp;
                    // v21.9: 직접 근접은 티어 공통으로 체력 +5%.
                    // 검성/기계공학자 같은 공격형 ORBIT는 +3%, 윈드워커(회오리)는 제외.
                    if(statType === __brScope.ABILITY_TYPES.MELEE) {
                        // v21.13: 직접 근접 전체를 소폭 더 단단하게.
                        this.maxHp *= 1.09;
                        // 큰 체급만 후반에 남는 현상을 줄이기 위해 작은/중소형 근접을 추가 보정.
                        if((ability.sizeMult || 1) <= 1.05) this.maxHp *= 1.06;
                        else if((ability.sizeMult || 1) <= 1.35) this.maxHp *= 1.03;
                    }
                    else if(statType === __brScope.ABILITY_TYPES.ORBIT && ability.sub !== 'TORNADO_ORBIT') this.maxHp *= 1.04;
                    if(ability.sub === 'REFLECT') this.maxHp *= 1.04;
                    this.speed *= statType === __brScope.ABILITY_TYPES.MELEE ? 1.14 : 1.08;
                    this.radius *= 1.04;
                    this.hp = this.maxHp;
                }
                // v22.3: 블러드로드는 흡혈/광란이 있으므로 공통 근접 체력 보정을 전부 받은 뒤 최종 체급을 소폭 낮춘다.
                if(ability.sub === 'VAMPIRE_SLASH') {
                    this.maxHp *= 0.94;
                    this.hp = this.maxHp;
                }
                // Classroom SOLO polish: only the explicit melee/assassin roles gain a small
                // base-stat floor. Damage, attack cadence, range and skill values stay intact.
                if((rwDef?.role||ability.category) === '근접형') {
                    this.maxHp *= 1.05; this.speed *= 1.03; this.hp = this.maxHp;
                } else if((rwDef?.role||ability.category) === '암살자') {
                    this.maxHp *= 1.05; this.speed *= 1.04; this.hp = this.maxHp;
                }
                // 여러 근접·탱커 체력 배율이 누적되어 초반 체급이 지나치게 높던 S/A만 조정.
                // 낮은 등급 탱커와 일반 근접 캐릭터의 기본 체력은 유지한다.
                if(__brScope.isTankAbility(ability)&&(ability.t==='S'||ability.t==='A')) {
                    this.maxHp=Math.min(this.maxHp*.82,ability.t==='S'?620:440);
                    this.hp=this.maxHp;
                }
                
                if(rwDef?.stats){const st=rwDef.stats;if(Number.isFinite(st.maxHp))this.maxHp=st.maxHp;if(Number.isFinite(st.speed))this.speed=st.speed;if(Number.isFinite(st.radius))this.radius=st.radius;this.maxHp*=Number(st.hpMultiplier??1);this.speed*=Number(st.speedMultiplier??1);this.damageMult*=Number(st.damageMultiplier??1);if(st.knockbackResist!=null)this.knockbackResist=st.knockbackResist;}
                // Run HP augments multiply this already adjusted base exactly once.
                if(Object.prototype.hasOwnProperty.call(__brScope.BR_BASE_HP_OVERRIDES_BY_ID,ability.id))this.maxHp=__brScope.BR_BASE_HP_OVERRIDES_BY_ID[ability.id];
                this.maxHp=__brScope.brCloseBaseHp(ability,this.maxHp);
                if(__brScope.BR_V29_FINAL_HP[ability.id]!=null)this.maxHp=__brScope.BR_V29_FINAL_HP[ability.id];
                if(ability.t==='B'||ability.t==='C')this.maxHp*=1.15; // v30: final base HP, once before mode/run multipliers
                // New entries freeze the final pre-mode median after old role modifiers.
                if(Number.isFinite(rwDef?.stats?.finalBaseHp))this.maxHp=rwDef.stats.finalBaseHp;
                if(ability.t==='B'||ability.t==='C')this.maxHp*=__brScope.ROSTER10_BALANCE.bcHp;
                if(ability.finalBaseSpeed)this.speed=ability.finalBaseSpeed;
                if(ability.id==='emoji-114')this.speed=1.5827; // median existing A tank walk; native tank-punch retained
                this.modeHpMultiplier=__brScope.brModeHpMultiplier(__brScope.session?.roomMeta?.mode);
                this.maxHp*=this.modeHpMultiplier;this.hp=this.maxHp;
                this.spawnProtectionUntilFrame=0;
                this.kills = 0;
                this.deathFrame = null;
                this.eliminationSeq = 0;
                this.placement = null;
                this.deathVisualUntilFrame = null;
                this.deathVisualUntilAt = null;
                this.killTimes = [];
                this.rapidKillCount = 0;
                this.lastKillFrame = -99999;
                this.bodyHitCooldown = 0;
                this.basicContactUntilFrame = -1;
                this.wallCrashCooldown = 0;
                this.launchedFrames = 0;
                this.launchedById = null;
                this.damageDealt = 0;
                this.damageTaken = 0;
                this.abilityUses = 0;
                this.survivalFrames = 0;
                this.invisible = false; this.ghostTimer = 0;
                // 플레이어의 상태·피격 및 자기장 노출 시간
                this.lastPos = new __brScope.Vec2(pos.x, pos.y);
                this.outsideZoneFrames = 0;
                this.runtimeFaults = 0;
                this.lastRuntimeFaultFrame = -9999;
                this.poisonFrames = 0;
                this.poisonOwner = null;
                this.teamGuardFrames = 0;
                this.teamGuardStrength = 0;
                this.teamHasteFrames = 0;
                this.teamHasteBonus = 0;
                // 학생 직접 조작 전용 기동/연사 버프. 스킬 횟수 대신 쿨타임으로 반복 사용한다.
                this.playerMoveBoostFrames = 0;
                this.playerChaseFrames = 0;
                this.playerAttackHasteFrames = 0;
                this.supportPulseFrames = 0;
                this.supportPulseKind = null;
                // ✨ v15: 근접/궤도 연속공격 상태
                this.comboHitsRemaining = 0;
                this.comboTimer = 0;
                this.comboTargetId = null;
                this.comboKind = null;
                // v20: 실제 공격을 시도하는 짧은 시간에만 충돌 공격 판정 허용.
                // 쿨타임 중 평범한 접촉은 서로 밀려날 뿐 피해를 주지 않는다.
                this.attackCommitFrames = 0;
                // 블러드로드 전용 1회성 광란 상태
                this.frenzyUsed = false;
                this.frenzyFrames = 0;
                this.cooldownRateMult = 1.0;
                this.finalPhaseBoosted = false;
                this.counterFrames=0;this.counterCast=null;this.guardLayers=[];this.lifeSeq=0;

                // Repeated short lives reuse the same bitmap, keeping the Pixi texture
                // cache bounded by the roster instead of allocating a texture per death.
                
            }

            spawnTrailZone(game, pos, scale=1, finisher=false) {
                const sub=this.ability.sub;
                if(!__brScope.TRAIL_DASH_SUBS.has(sub)) return;
                let radius=50, damage=4*this.damageMult, duration=130, color='#64748b', type='dmg';
                if(sub==='POISON_TRAIL') { radius=58; damage=6.3*this.damageMult; duration=170; color='#15803d'; }
                else if(sub==='ICE_TRAIL') { radius=60; damage=4.7*this.damageMult; duration=145; color='#22d3ee'; type='web'; }
                else if(sub==='BOMB_TRAIL') { radius=43; damage=10*this.damageMult; duration=72; color='#57534e'; type='time_bomb'; }
                else if(sub==='INK_TRAIL') { radius=66; damage=5.4*this.damageMult; duration=185; color='#171717'; }
                else if(sub==='BANANA_TRAIL') { radius=46; damage=9*this.damageMult; duration=98; color='#eab308'; type='time_bomb'; }
                if(finisher) { radius*=1.22; duration=Math.round(duration*1.14); damage*=1.12; } else radius*=scale;
                if(this.ability.t!=='S'&&this.ability.t!=='A') {
                    radius*=.88;duration=Math.round(duration*.78);damage*=.78;
                }
                game.zones.push(new __brScope.Zone(this,new __brScope.Vec2(pos.x,pos.y),radius,damage,duration,color,type));
                // B/C 돌진형은 장판 지속 피해와 동시 렌더링 부담이 겹치므로 활성 개수를 제한한다.
                const ownTrailZones = game.zones.filter(z=>z.owner===this && __brScope.TRAIL_DASH_SUBS.has(z.owner?.ability?.sub));
                const maxTrailZones=this.ability.t==='S'||this.ability.t==='A'?5:3;
                if(ownTrailZones.length > maxTrailZones) {
                    const oldest = ownTrailZones[0];
                    const idx = game.zones.indexOf(oldest);
                    if(idx >= 0) game.zones.splice(idx,1);
                }
            }

            finishTrailDash(game) {
                if(!__brScope.TRAIL_DASH_SUBS.has(this.dashType)) return;
                this.spawnTrailZone(game,this.pos,1.0,true);
                this.dashTargetId=null;
            }

            finishDashImpact(game) {
                if(!this.alive)return;
                const cast=this._runLastSkill||__brScope.brRunSkillSnapshot(this);
                if(this.dashType==='ROCKET_JUMP') {
                    game.spawnExplosion(this.pos,80,'#ffaa00',{sourceId:this.remoteId,geometry:__brScope.brFxCommand(this,'circle',{part:'dash-landing'})});
                    game.applyAoE(this.pos,80,20*this.damageMult*cast.damage,this,15*cast.control,{wangguiPower:cast.wangguiPower});
                } else if(this.dashType==='FLY_DASH') {
                    game.addText(this.pos,'🦅 SKY CRASH!','#e0f2fe',28,26);
                    game.spawnExplosion(this.pos,115,'#7dd3fc',{sourceId:this.remoteId,geometry:__brScope.brFxCommand(this,'circle',{part:'dash-landing',controlRadius:125})});
                    game.applyAoE(this.pos,115,28*this.damageMult*cast.damage,this,22*cast.control,{wangguiPower:cast.wangguiPower});
                    for(const p of game.getNearbyParticipants(this.pos,125)) {
                        if(p!==this&&p.alive&&p.id!==999&&(this.team===0||p.team!==this.team)&&__brScope.brCanHostileTarget(p,this)&&p.pos.dist(this.pos)<=125&&!game.checkWallBetween(this.pos,p.pos))p.stunned=Math.max(p.stunned,__brScope.brRunCC(12,cast.control));
                    }
                    this.vel=this.vel.mult(.42);
                }
            }

            resolvePlayerDashStep(game,dash,from,to) {
                if(!this.alive)return;
                dash.contact(game,from,to);
                if(!this.alive)return;
                if(dash.remaining<=.001&&this.playerDash===dash) {
                    this.playerDash=null;this.dashFrames=0;this.vel=new __brScope.Vec2(0,0);
                    if(this.dashType==='FLY_DASH') {
                        const landed=__brScope.combatMoveCircle(this.pos,this.vel,this.radius,__brScope.brHostBodyWalls(game),false,this._combatMoveResult);
                        this.pos.x=landed.x;this.pos.y=landed.y;
                    }
                    this.finishDashImpact(game);
                    if(__brScope.TRAIL_DASH_SUBS.has(this.dashType))__brScope.brWithRunSkill(this,game,()=>this.finishTrailDash(game),this._runLastSkill,false);
                }
            }

            rollAbilityCooldown(mult=1) {
                const jitter = 0.90 + __brScope.rand()*0.20;
                return Math.max(12, Math.round(this.abilityTiming.cooldown * mult * jitter));
            }
            setAbilityCooldown(mult=1) { this.cooldown = this.rollAbilityCooldown(mult); }

            update(game) {
                if(!this.alive) return;
                this.survivalFrames++;
                if(this.bodyHitCooldown > 0) this.bodyHitCooldown--;
                if(this.wallCrashCooldown > 0) this.wallCrashCooldown--;
                if(this.attackCommitFrames > 0) this.attackCommitFrames--;
                if(this.launchedFrames > 0) { this.launchedFrames--; if(this.launchedFrames <= 0) this.launchedById = null; }
                if(this.stunned > 0) { this.stunned--; }
                if(this.blindedFrames > 0) this.blindedFrames--;
                if(this.supportPulseFrames > 0) {
                    this.supportPulseFrames--;
                    if(this.supportPulseFrames <= 0) this.supportPulseKind = null;
                }
                __brScope.brRefreshGuard(this,true);
                if(this.counterFrames>0&&--this.counterFrames<=0)this.counterCast=null;
                if(this.teamHasteFrames > 0) {
                    this.teamHasteFrames--;
                    if(this.teamHasteFrames <= 0) this.teamHasteBonus = 0;
                }
                if(this.playerMoveBoostFrames > 0) this.playerMoveBoostFrames--;
                if(this.playerChaseFrames > 0) this.playerChaseFrames--;
                if(this.playerAttackHasteFrames > 0) this.playerAttackHasteFrames--;
                if(this.poisonFrames>0&&this.poisonOwner&&(Number(this.poisonOwner.lifeSeq||0)!==Number(this.poisonOwnerLife||0)||this.poisonAbilityId&&this.poisonOwner.ability.id!==this.poisonAbilityId)){this.poisonFrames=0;this.poisonOwner=null;}
                if(this.poisonFrames > 0) {
                    this.poisonFrames--;
                    if(this.poisonFrames % 18 === 0 && this.poisonOwner?.alive) {
                        this.takeDamage(2.2*(this.poisonDamageMult||1),this.poisonOwner,false,null,{scaled:true,wangguiPower:this.poisonWangguiPower??1,periodic:true,style:'dot:poison'});
                        if(!game.isVisualPerformanceMode()) game.addText(this.pos, '☠', '#a3e635', 12, 15);
                    }
                    if(this.poisonFrames <= 0) this.poisonOwner = null;
                }
                if(!this.alive)return; // A lethal DOT cannot be followed by movement or a new attack.
                if (!__brScope.BRRework?.defs[this.ability.id] && this.ability.sub === 'REGEN' && this.hp < this.maxHp && game.frame % 60 === 0) {
                    this.hp = Math.min(this.hp + (4.2 * this.damageMult * __brScope.brCombatPower(this)), this.maxHp); game.addText(this.pos, "✚", "#0f0");
                }
                if (this.ability.sub === 'GHOST_MOVE') {
                    if(this.ghostTimer>0)this.ghostTimer--;this.invisible=this.ghostTimer>0;
                }
                if(!__brScope.BRRework?.defs[this.ability.id]&&this.ability.sub === 'VAMPIRE_SLASH') {
                    if(!this.frenzyUsed && this.hp / Math.max(1,this.maxHp) <= 0.30) {
                        this.frenzyUsed = true;
                        this.frenzyFrames = 420; // 약 7초, 경기당 1회
                        this.cooldown = Math.min(this.cooldown, 24);
                        game.addText(this.pos, '🩸 BLOOD FRENZY!', '#ff4d6d', 42, 34);
                    }
                    if(this.frenzyFrames > 0) this.frenzyFrames--;
                }
                if(this.comboTimer > 0) this.comboTimer--;

                // 캐릭터의 의사 결정은 연결된 플레이어 입력만 사용한다.

                if(this.comboHitsRemaining > 0 && this.comboTimer <= 0 && this.stunned <= 0) this.processMeleeCombo(game);

                // ✨ 새로운 동적 돌진 이펙트 처리
                if(this.playerDash&&this.stunned>0){this.playerDash=null;this.dashFrames=0;}
                let explosiveDashPulse=false;
                if (this.dashFrames > 0) {
                    const cast=this._runLastSkill||__brScope.brRunSkillSnapshot(this);
                    if(!this.playerDash)this.dashFrames=0;
                    explosiveDashPulse=this.dashType==='EXPLOSIVE_DASH'&&this.dashFrames%4===0;
                    if (this.dashType === 'POISON_TRAIL' && this.dashFrames % 5 === 0) this.spawnTrailZone(game,this.pos);
                    if (this.dashType === 'ICE_TRAIL' && this.dashFrames % 8 === 0) this.spawnTrailZone(game,this.pos);
                    if (this.dashType === 'BOMB_TRAIL' && this.dashFrames % 10 === 0) this.spawnTrailZone(game,this.pos);
                    if (this.dashType === 'INK_TRAIL' && this.dashFrames % 8 === 0) this.spawnTrailZone(game,this.pos);
                    if (this.dashType === 'BANANA_TRAIL' && this.dashFrames % 9 === 0) this.spawnTrailZone(game,this.pos);
                    if(this.dashType === 'THUNDER_DASH' && this.dashFrames % 6 === 0 && !game.isVisualPerformanceMode()) {
                        game.spawnImpact(this.pos,38,'#fde047',0.35);
                    }
                    if (this.dashType === 'BULLDOZER_DASH' && this.dashFrames % 5 === 0) {
                        let dir = new __brScope.Vec2(__brScope.rand()-0.5, __brScope.rand()-0.5).norm();
                        game.projectiles.push(new __brScope.Projectile(this, this.pos, dir, 8, 15*this.damageMult, 12, 'bullet', '#888', 0, '🪨'));
                        // Rocks and swept body contact carry the damage; no invisible radial hit.
                    }
                }

                // 학생 입력은 위치 적분보다 먼저 반영한다. 한 물리 프레임 늦게 출발하던 체감 지연을 제거한다.
                if(this.applyPlayerInput)this.applyPlayerInput(this,game);

                if(__brScope.BRRework?.ownsMovement(this,game))return;
                const playerDashStep=this.playerDash&&this.playerDash.remaining>0?this.playerDash:null;
                const dashStart=playerDashStep?new __brScope.Vec2(this.pos.x,this.pos.y):null;
                if(playerDashStep)this.vel=playerDashStep.dir.mult(Math.min(playerDashStep.speed,playerDashStep.remaining));
                let nextPos = this.pos.add(this.vel);
                if (isNaN(nextPos.x) || isNaN(nextPos.y)) { this.vel = new __brScope.Vec2(0,0); return; }

                const phasesWalls=this.ability.sub==='GHOST_MOVE'||(this.ability.sub==='FLY_DASH'&&this.dashFrames>0);
                const moved=__brScope.combatMoveCircle(this.pos,this.vel,this.radius,phasesWalls?(game.boundary?.blocks||[]):__brScope.brHostBodyWalls(game),!!playerDashStep,this._combatMoveResult);
                const wallHit=moved.hit;
                if(wallHit&&!playerDashStep)game.handleWallCrash(this,this.vel.mag());
                this.pos.x=moved.x;this.pos.y=moved.y;this.vel.x=this.alive?moved.vx:0;this.vel.y=this.alive?moved.vy:0;
                if(wallHit&&playerDashStep)playerDashStep.remaining=0;

                if(!this.alive)return;
                if(explosiveDashPulse){
                    const cast=this._runLastSkill||__brScope.brRunSkillSnapshot(this);
                    game.spawnExplosion(this.pos,60,'#ff4400');
                    game.applyAoE(this.pos,60,15*this.damageMult*cast.damage,this,10*cast.control,{wangguiPower:cast.wangguiPower});
                }
                // Clamp at the arena edge BEFORE capturing the authoritative travelled segment.
                {
                    const edge=(game.worldRadius||__brScope.BR_WORLD_RADIUS)-this.radius-4,delta=this.pos.sub(game.center),distance=delta.mag();
                    if(__brScope.brArenaRect(game)){const q=__brScope.brArenaClamp(game,this.pos,this.radius+4);if(q.x!==this.pos.x){this.vel.x=0;if(playerDashStep)playerDashStep.remaining=0;}if(q.y!==this.pos.y){this.vel.y=0;if(playerDashStep)playerDashStep.remaining=0;}this.pos=q;}else if(distance>edge) {
                        const normal=delta.mult(1/distance);this.pos=game.center.add(normal.mult(edge));
                        const outward=this.vel.x*normal.x+this.vel.y*normal.y;if(outward>0)this.vel=this.vel.sub(normal.mult(outward));
                        if(playerDashStep)playerDashStep.remaining=0;
                    }
                }
                if(playerDashStep) {
                    playerDashStep.remaining=Math.max(0,playerDashStep.remaining-this.pos.dist(dashStart));
                    this.playerDashContactFrame=game.frame;
                    this.dashFrames=Math.ceil(playerDashStep.remaining/playerDashStep.speed);
                    const to=new __brScope.Vec2(this.pos.x,this.pos.y);
                    if(game.deferDashContacts)game.pendingDashContacts.push({p:this,dash:playerDashStep,from:dashStart,to});
                    else this.resolvePlayerDashStep(game,playerDashStep,dashStart,to);
                    if(!this.alive)return;
                }
                if(!playerDashStep)this.vel=this.vel.mult(.92);
                // Ring damage runs once after all movement, dash settlement and body collisions.
                // The snapshot and damage therefore refer to the same final position.

            }

            processMeleeCombo(game) {
                return __brScope.brWithRunSkill(this,game,()=>this.processMeleeComboBase(game),this.comboCast||this._runLastSkill,false);
            }
            processMeleeComboBase(game) {
                let target = game.participants.find(p => p.id === this.comboTargetId && p.alive);
                if(!target || !__brScope.brCanHostileTarget(target,this) || (this.comboTargetLife!=null&&this.comboTargetLife!==Number(target.lifeSeq||0)) || (this.team !== 0 && target.team === this.team)) {
                    this.comboHitsRemaining = 0; this.comboKind = null; return;
                }
                const maxRange=(this.comboKind==='blade'?270:this.comboKind==='scissor'?255:235)*(this.comboKind==='blade'?1:(this._runSkillCast?.size||1));
                const dist = this.pos.dist(target.pos);
                if(dist > maxRange || game.checkWallBetween(this.pos, target.pos)) {
                    // 적이 벗어나면 연속타만 취소한다. 플레이어를 자동 추격시키지 않는다.
                    this.comboHitsRemaining = 0; this.comboKind = null; return;
                }

                const dir = target.pos.sub(this.pos).norm();
                const finalHit = this.comboHitsRemaining === 1;
                let dmg = 18, push = finalHit ? 18 : 7, stun = finalHit ? 8 : 2;
                let color = '#ffffff', style = 'slash', size = 105;

                if(this.comboKind === 'blood') {
                    dmg = finalHit ? 25 : 19; push = finalHit ? 28 : 9; stun = finalHit ? 13 : 3;
                    color = '#fb7185'; style = 'throw'; size = 132;
                } else if(this.comboKind === 'blade') {
                    dmg = finalHit ? 20 : 15; push = finalHit ? 21 : 8; stun = finalHit ? 7 : 2;
                    color = '#ff334f'; style = 'slash'; size = 128;
                } else if(this.comboKind === 'basic') {
                    dmg = finalHit ? 22 : 17; push = finalHit ? 17 : 8; stun = finalHit ? 5 : 1;
                    color = '#4ade80'; size = 94;
                } else if(this.comboKind === 'scissor') {
                    dmg = finalHit ? 24 : 15; push = finalHit ? 25 : 6; stun = finalHit ? 10 : 2;
                    color = '#67e8f9'; style = 'scissor'; size = finalHit ? 142 : 112;
                }

                game.addSwingEffect(this,this.pos,dir,dist,style,.18,__brScope.brFxCommand(this,'target-strike',{targetX:target.pos.x,targetY:target.pos.y,targetRadius:target.radius,part:'combo'}));
                game.spawnImpact(target.pos, size*0.62, color, finalHit ? 1.35 : 0.9);
                const beforeHp = target.hp;
                target.takeDamage(dmg, this);
                const dealt = Math.max(0, beforeHp - target.hp);
                if(dealt>0&&target.alive){
                    target.vel=target.vel.add(dir.mult(push));
                    if(push>=24)game.markLaunched(target,this,Math.min(30,10+Math.floor(push*.6)));
                    if(this.comboKind!=='basic'&&!__brScope.BRRework?.defs[this.ability.id])__brScope.brApplyStun(target,stun,this);
                }
                this.vel = this.vel.add(dir.mult(4));

                if(this.alive && this.comboKind === 'blood' && dealt > 0) {
                    const heal = Math.min(this.maxHp - this.hp, dealt * 0.52);
                    if(heal > 0)__brScope.brApplyHealing(this,dealt*.52,this);
                }
                if(finalHit) game.addText(target.pos, this.comboKind === 'blade' ? '⚔️ FINISH!' : this.comboKind === 'scissor' ? '✂️ FINAL SNIP!' : '💥 COMBO!', color, 22, 28);

                this.comboHitsRemaining--;
                this.comboTimer = this.comboKind === 'scissor' ? 3 : this.comboKind === 'blade' ? 4 : this.comboKind === 'blood' ? 4 : 5;
                if(this.comboHitsRemaining <= 0) this.comboKind = null;
            }

            usePlayerAbility(game, target, dir, dist) {
                if(__brScope.BRRework?.defs[this.ability.id])return __brScope.BRRework.cast(this,game,dir,1);
                return __brScope.brWithRunSkill(this,game,()=>this.usePlayerAbilityBase(game,target,dir,dist));
            }
            usePlayerAbilityBase(game, target, dir, dist) {
                if(__brScope.BRRework?.defs[this.ability.id])return __brScope.BRRework.cast(this,game,dir,1);
                if(target&&target!==this&&!__brScope.brCanHostileTarget(target,this))return;
                game.playSignature(this);
                // v20: 이 짧은 구간에만 몸통박치기/CLASH가 '공격'으로 인정된다.
                const commitByType = {
                    [__brScope.ABILITY_TYPES.MELEE]:22, [__brScope.ABILITY_TYPES.ORBIT]:21, [__brScope.ABILITY_TYPES.DASH]:34,
                    [__brScope.ABILITY_TYPES.TELEPORT]:22, [__brScope.ABILITY_TYPES.PULL]:18, [__brScope.ABILITY_TYPES.AREA]:16,
                    [__brScope.ABILITY_TYPES.PROJ]:12, [__brScope.ABILITY_TYPES.ZONE]:10, [__brScope.ABILITY_TYPES.TURRET]:8,
                    [__brScope.ABILITY_TYPES.BUFF]:8, [__brScope.ABILITY_TYPES.LASER]:12
                };
                this.attackCommitFrames = Math.max(this.attackCommitFrames, commitByType[this.ability.type] || 12);
                // 플레이어 스킬의 기존 재사용 대기시간 계산을 유지한다.
                this.setAbilityCooldown();
                const sub = this.ability.sub;
                const manualPoint = this.manualAimPoint || null;
                const manualRange = manualPoint ? manualPoint.dist(this.pos) : 0;
                const aimDir=__brScope.brNormalizeAimVector(dir?.x,dir?.y,this.lastAimDir?.x,this.lastAimDir?.y);

                if(this.ability.type===__brScope.ABILITY_TYPES.PROJ) {
                    if(sub==='SNIPE') {
                        // 저격수는 여러 줄을 흩뿌리지 않고, 긴 단일 탄도로 강한 한 발을 꽂는다.
                        const profile=__brScope.brLaserProfile(this.ability,this.run?.mods||{}),sniperRange=manualRange||profile.range;
                        const trace=__brScope.brFirstBeamHit(this.pos,aimDir,sniperRange,profile.width,game.participants,this,game.walls);
                        const visibleEnd=this.pos.add(aimDir.mult(trace.length));
                        game.drawLaser(this.pos,visibleEnd,'#67e8f9',profile.width,{owner:this,part:'snipe'});
                        __brScope.brFarm.line(game,this,this.pos,visibleEnd,profile.width*.5,.65,'snipe:'+game.frame,'beam');
                        const hit=trace.target;
                        if(hit) {
                            const dealt=hit.takeDamage(55*this.damageMult,this);
                            if(dealt>0&&hit.alive){hit.vel=hit.vel.add(aimDir.mult(18*(hit.knockbackResist||1)));game.markLaunched(hit,this,20);}
                        }
                        return;
                    }
                    // Player projectile data is the single source of truth for both preview and hits.
                    const signature=__brScope.getPlayerSignatureProjectileProfile(this.ability);
                    let pCount=__brScope.brRunCount(signature.count,__brScope.brRunMod(this,'skillCount',0)),spread=signature.spread;
                    if(pCount>signature.count&&spread===0)spread=.10;
                    if(sub==='NOVA')spread=Math.PI*2/pCount;
                    const opts={bounces:signature.bounces,pierce:signature.pierce,wobble:!!this.ability.wobble,
                        spinRate:signature.spin,faceDir:signature.face,knockback:signature.push,
                        trailColor:this.ability.pTrail||null,impactColor:this.ability.pImpact||'#fff',
                        status:signature.status,statusPower:signature.statusPower,weaponStyle:signature.style,hitOncePerPass:signature.type==='BOOMERANG',
                        ...(__brScope.BR_V32_NATIVE_SKILLS.has(this.ability.id)&&signature.type!=='BOOMERANG'?{rangeRemaining:manualRange||signature.range}:{})};
                    const colors={ARCANE_BARRAGE:['#c084fc','#e879f9'],NOVA:['#fde68a',null],CRACKER:['#fb923c','#f97316'],
                        STING:['#bef264','#84cc16'],SODA_BOMB:['#38bdf8','#e0f2fe'],POWDER_BARRAGE:['#fb7185','#fecdd3'],
                        AIMED_SHOT:['#fde68a','#fff7cc'],TOXIC_INJECTION:['#fb7185','#fecaca']}[sub];
                    if(colors){opts.trailColor=colors[0];if(colors[1])opts.impactColor=colors[1];}
                    if(sub==='NOVA')opts.vfx='star';
                    if(sub==='ICE_SHARD')opts.vfx='ice';
                    // AIMED_SHOT is a real projectile; its normal shot event supplies the direction cue.
                    const startAngle=sub==='NOVA'?0:-spread*(pCount-1)/2;
                    for(let i=0;i<pCount;i++) {
                        const shotDir=aimDir.rotate(startAngle+i*spread);
                        const shot=new __brScope.Projectile(this,this.pos,shotDir,signature.speed,signature.damage*this.damageMult,
                            signature.size,signature.type,this.ability.pImpact||'#ff0',signature.explode,signature.emoji,opts);
                        if(signature.type!=='BOOMERANG')shot.life=Math.max(8,Math.ceil((manualRange||signature.range)/Math.max(1,signature.speed)));
                        else shot.returnAfterLife=Math.max(1,shot.life-Math.ceil((manualRange||31*signature.speed)/Math.max(1,signature.speed))+1);
                        game.projectiles.push(shot);
                    }
                    return;
                }

                switch(this.ability.type) {
                    case __brScope.ABILITY_TYPES.BUFF: {
                        game.spawnParticles(this.pos, 8, '#fff');
                        if(sub === 'REGEN') {
                            __brScope.brApplyHealing(this,this.maxHp * 0.13,this);
                            this.stunned = Math.min(this.stunned, 4);
                            game.addText(this.pos, '🚑 SECOND WIND!', '#86efac', 30, 26);
                            game.spawnImpact(this.pos, 78, '#4ade80', 0.75);
                        }
                        if(__brScope.TEAM_SUPPORT_SUBS.has(sub) && __brScope.teamMode>0 && this.team>0) {
                            const allies=game.aliveRealPlayers.filter(p=>p.alive&&p.id!==999&&p.team===this.team);
                            const otherAllies=allies.filter(a=>a!==this);
                            const lowest=[...(otherAllies.length?otherAllies:allies)].sort((a,b)=>(a.hp/Math.max(1,a.maxHp))-(b.hp/Math.max(1,b.maxHp)))[0]||this;

                            if(sub==='TEAM_SANCTUARY') {
                                this.supportPulseFrames=82; this.supportPulseKind='SANCTUARY';
                                let affected=0;
                                for(const ally of allies) {
                                    if(ally.pos.dist(this.pos)>__brScope.brSupportRadius(this.ability)) continue;
                                    __brScope.brApplyHealing(ally,ally.maxHp*0.12,this);
                                    ally.cooldown=Math.max(0,Math.floor(ally.cooldown*0.72));
                                    ally.stunned=Math.min(ally.stunned,4);
                                    __brScope.brApplyGuard(ally,this,150,0.18);
                                    affected++;
                                    if(!game.isVisualPerformanceMode()) game.spawnImpact(ally.pos,62,'#fef3c7',0.45);
                                }
                                game.addText(this.pos,`👼 SANCTUARY ×${affected}`,'#fef3c7',34,28);
                                game.rings.push(new __brScope.ImpactRing(this.pos,42,250,'#fde68a',34,5));
                            }
                            else if(sub==='TEAM_MEDIC') {
                                this.supportPulseFrames=72; this.supportPulseKind='MEDIC';
                                if(lowest) {
                                    const actualMedicHeal=__brScope.brApplyHealing(lowest,lowest.maxHp*0.22,this);
                                    lowest.stunned=Math.min(lowest.stunned,3);
                                    __brScope.brApplyHealing(this,this.maxHp*0.04,this);
                                    if(actualMedicHeal>0){game.addText(lowest.pos,'HEAL +'+Math.round(actualMedicHeal),'#86efac',30,25);
                                    game.rings.push(new __brScope.ImpactRing(lowest.pos,30,105,'#4ade80',26,4));
                                    game.spawnImpact(lowest.pos,82,'#4ade80',0.75);
                                    const healVisual=__brScope.BRRework.context(this,game,this.lastAimDir);
                                    __brScope.BRRework.confirmedSkillFx(healVisual,lowest.pos,'heal',Math.max(40,lowest.radius*1.4),{shape:'heal'},'#86efac');}
                                }
                            }
                            else if(sub==='TEAM_BLOOM') {
                                this.supportPulseFrames=70; this.supportPulseKind='BLOOM';
                                const targets=[...otherAllies]
                                    .sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))
                                    .slice(0,2);
                                for(const ally of targets) {
                                    __brScope.brApplyHealing(ally,ally.maxHp*0.12,this);
                                    if(!game.isVisualPerformanceMode()) game.spawnImpact(ally.pos,58,'#86efac',0.40);
                                }
                                game.addText(this.pos,`🪷 BLOOM ×${targets.length}`,'#bbf7d0',29,25);
                                game.rings.push(new __brScope.ImpactRing(this.pos,30,145,'#86efac',26,3));
                            }
                            else if(sub==='TEAM_HASTE_A') {
                                this.supportPulseFrames=72; this.supportPulseKind='HASTE';
                                let affected=0;
                                for(const ally of allies) {
                                    if(ally.pos.dist(this.pos)>__brScope.brSupportRadius(this.ability)) continue;
                                    __brScope.brApplyTimedEffect(ally,'teamHasteFrames',175,this);
                                    ally.teamHasteBonus=Math.max(ally.teamHasteBonus,1);
                                    affected++;
                                }
                                game.addText(this.pos,`🪄 HASTE ×${affected}`,'#c4b5fd',29,25);
                                game.rings.push(new __brScope.ImpactRing(this.pos,34,175,'#a78bfa',28,4));
                            }
                            else if(sub==='TEAM_GUARD') {
                                this.supportPulseFrames=78; this.supportPulseKind='GUARD';
                                const targets=[...allies]
                                    .sort((a,b)=>(a.hp/Math.max(1,a.maxHp))-(b.hp/Math.max(1,b.maxHp)))
                                    .slice(0,Math.min(3,allies.length));
                                for(const ally of targets) {
                                    __brScope.brApplyGuard(ally,this,190,0.24);
                                    __brScope.brApplyHealing(ally,ally.maxHp*0.02,this);
                                    if(!game.isVisualPerformanceMode()) game.spawnImpact(ally.pos,68,'#93c5fd',0.55);
                                }
                                game.addText(this.pos,'🔰 GUARD!','#bfdbfe',30,27);
                                game.rings.push(new __brScope.ImpactRing(this.pos,36,180,'#93c5fd',30,4));
                            }
                            else if(sub==='TEAM_TONIC') {
                                this.supportPulseFrames=66; this.supportPulseKind='TONIC';
                                const targets=[...otherAllies]
                                    .sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))
                                    .slice(0,2);
                                for(const ally of targets) {
                                    __brScope.brApplyHealing(ally,ally.maxHp*0.08,this);
                                }
                                game.addText(this.pos,`🧴 TONIC ×${targets.length}`,'#86efac',27,24);
                                game.rings.push(new __brScope.ImpactRing(this.pos,28,125,'#4ade80',24,3));
                            }
                            else if(sub==='TEAM_BARRIER') {
                                this.supportPulseFrames=72; this.supportPulseKind='GUARD';
                                const targets=[...allies]
                                    .sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))
                                    .slice(0,Math.min(3,allies.length));
                                for(const ally of targets) {
                                    __brScope.brApplyGuard(ally,this,165,0.16);
                                }
                                game.addText(this.pos,'🪬 BARRIER!','#bfdbfe',28,25);
                                game.rings.push(new __brScope.ImpactRing(this.pos,32,165,'#93c5fd',26,3));
                            }
                            else if(sub==='TEAM_RALLY') {
                                this.supportPulseFrames=70; this.supportPulseKind='RALLY';
                                let affected=0;
                                for(const ally of allies) {
                                    if(ally.pos.dist(this.pos)>__brScope.brSupportRadius(this.ability)) continue;
                                    __brScope.brApplyHealing(ally,ally.maxHp*0.03,this);
                                    ally.cooldown=Math.max(0,Math.floor(ally.cooldown*0.68));
                                    affected++;
                                }
                                game.addText(this.pos,`📣 RALLY ×${affected}`,'#fde68a',30,26);
                                game.rings.push(new __brScope.ImpactRing(this.pos,32,160,'#facc15',28,4));
                                game.spawnImpact(this.pos,92,'#facc15',0.60);
                            }
                            else if(sub==='TEAM_CLOVER') {
                                this.supportPulseFrames=60; this.supportPulseKind='MEDIC';
                                if(lowest && lowest!==this) {
                                    __brScope.brApplyHealing(lowest,lowest.maxHp*0.07,this);
                                    game.addText(lowest.pos,'🍀 +7%','#bbf7d0',24,22);
                                    game.rings.push(new __brScope.ImpactRing(lowest.pos,22,68,'#86efac',20,3));
                                }
                            }
                            else if(sub==='TEAM_BUGLE') {
                                this.supportPulseFrames=64; this.supportPulseKind='HASTE';
                                let affected=0;
                                for(const ally of allies) {
                                    if(ally.pos.dist(this.pos)>__brScope.brSupportRadius(this.ability)) continue;
                                    __brScope.brApplyTimedEffect(ally,'teamHasteFrames',120,this);
                                    ally.teamHasteBonus=Math.max(ally.teamHasteBonus,1);
                                    affected++;
                                }
                                game.addText(this.pos,`🎺 TEMPO ×${affected}`,'#fde68a',27,24);
                                game.rings.push(new __brScope.ImpactRing(this.pos,28,145,'#facc15',24,3));
                            }
                            else if(sub==='TEAM_BELL') {
                                this.supportPulseFrames=64; this.supportPulseKind='GUARD';
                                let affected=0;
                                for(const ally of allies) {
                                    if(ally.pos.dist(this.pos)>__brScope.brSupportRadius(this.ability)) continue;
                                    __brScope.brApplyGuard(ally,this,125,0.10);
                                    affected++;
                                }
                                game.addText(this.pos,`🛎️ GUARD ×${affected}`,'#bfdbfe',27,24);
                                game.rings.push(new __brScope.ImpactRing(this.pos,28,145,'#93c5fd',24,3));
                            }
                            else if(sub==='TEAM_BANDAGE') {
                                this.supportPulseFrames=62; this.supportPulseKind='BANDAGE';
                                if(lowest && lowest!==this) {
                                    __brScope.brApplyHealing(lowest,lowest.maxHp*0.07,this);
                                    game.addText(lowest.pos,'🩹 AID +7%','#bbf7d0',26,23);
                                    game.rings.push(new __brScope.ImpactRing(lowest.pos,24,75,'#86efac',22,3));
                                    if(!game.isVisualPerformanceMode()) game.spawnImpact(lowest.pos,50,'#86efac',0.35);
                                } else {
                                    __brScope.brApplyHealing(this,this.maxHp*0.03,this);
                                }
                            }
                        }
                        if (sub === 'GHOST_MOVE') {
                            __brScope.brApplyTimedEffect(this,'ghostTimer',125,this);this.invisible=true;
                            game.addText(this.pos, "👻 PHASE!", "#c4b5fd", 28, 25);
                            if(target && target !== this && target.alive) {
                                const ghostDir = target.pos.sub(this.pos).norm();
                                for(const a of [-0.13, 0, 0.13]) {
                                    const shotDir = ghostDir.rotate(a);
                                    game.projectiles.push(new __brScope.Projectile(
                                        this, this.pos.add(shotDir.mult(this.radius*0.45)), shotDir,
                                        9.2, 13 * this.damageMult, 10, 'missile', '#a855f7', 0, null,
                                        {trailColor:'#c4b5fd', impactColor:'#a855f7', knockback:5}
                                    ));
                                }
                                game.addText(target.pos, "👻 SOUL BOLT!", "#d8b4fe", 20, 22);
                            }
                        }
                        break;
                    }
                    
                    case __brScope.ABILITY_TYPES.ORBIT: {
                        // ✨ v15: 검성/윈드워커/기계공학자는 첫 시전부터 완전 무장 + 이후 능동 돌격기를 사용
                        game.projectiles=game.projectiles.filter(p=>!(p.owner===this&&p.type==='ORBIT'));
                        const existing=[];
                        let desiredCount = 3;
                        let orbitDist = this.radius + 46;
                        let pSize = 25;
                        let pDmg = 15 * this.damageMult;
                        let vfx = null, emoji = null, impactColor = '#67e8f9';
                        let knockback = 12, orbitSpeed = 0.105;

                        if(sub === 'SWORD_ORBIT') {
                            desiredCount = 4; orbitDist = this.radius + 48; pSize = 28; pDmg = 16;
                            vfx = 'slash'; impactColor = '#ff334f'; knockback = 13; orbitSpeed = 0.115;
                        } else if(sub === 'GEAR_ORBIT') {
                            desiredCount = 3; orbitDist = this.radius + 50; pSize = 30; pDmg = 19;
                            emoji = '⚙️'; impactColor = '#fbbf24'; knockback = 20; orbitSpeed = 0.115;
                        } else if(sub === 'TORNADO_ORBIT') {
                            desiredCount = 3; orbitDist = this.radius + 44; pSize = 29; pDmg = 15 * this.damageMult;
                            emoji = '🌪️'; impactColor = '#93c5fd'; knockback = 15; orbitSpeed = 0.11;
                        } else if(sub === 'ROLLING_BLADE') {
                            desiredCount = 3; orbitDist = this.radius + 52; pSize = 25; pDmg = 16 * this.damageMult;
                            emoji = '🛞'; impactColor = '#f472b6'; knockback = 18; orbitSpeed = 0.14;
                        }

                        // v20: 랭크가 높을수록 오래 유지되지만 영구적으로 돌지는 않는다.
                        // S 약 4~4.5초, A 약 3.5초, 이하 티어는 더 짧게 전개된다.
                        let orbitLife = {S:255,A:210,B:175,C:145,F:115}[this.ability.t] || 170;
                        if(sub === 'SWORD_ORBIT') orbitLife = 235;       // 검성은 긴급너프 유지
                        else if(sub === 'GEAR_ORBIT') orbitLife = 265;
                        else if(sub === 'TORNADO_ORBIT') orbitLife = 210;
                        else if(sub === 'ROLLING_BLADE') orbitLife = 230;

                        // 첫 시전에서 필요한 개수를 모두 전개. 수명이 끝나면 다음 쿨타임까지 빈틈이 생긴다.
                        for(let i=existing.length; i<desiredCount; i++) {
                            game.projectiles.push(new __brScope.Projectile(
                                this, this.pos, new __brScope.Vec2(0,0), 0, pDmg, pSize, 'ORBIT', impactColor, 0, emoji,
                                {orbitDist, vfx, spinRate:0.3, knockback, impactColor, orbitSpeed, orbitLife, orbitAngle:(Math.PI*2*i/desiredCount)}
                            ));
                        }

                        if(target && target.alive) {
                            const rushDir = aimDir;
                            // 무장 후부터는 시전할 때마다 각 캐릭터다운 능동 근접기
                            if(sub === 'SWORD_ORBIT') {
                                this.vel = this.vel.add(rushDir.mult(15));
                                if(dist < 285) {
                                    game.addSwingEffect(this,this.pos,rushDir,dist,'slash',.18,__brScope.brFxCommand(this,'target-strike',{targetX:target.pos.x,targetY:target.pos.y,targetRadius:target.radius,part:'orbit-strike'}));
                                    game.spawnImpact(target.pos, 95, '#ff334f', 1.4);
                                    const dealt=target.takeDamage(20,this);
                                    if(dealt>0&&target.alive){
                                        target.vel=target.vel.add(rushDir.mult(17));__brScope.brApplyStun(target,5,this);
                                        if(this.alive){this.comboHitsRemaining=2;this.comboTimer=5;this.comboTargetId=target.id;this.comboKind='blade';this.comboCast=this._runSkillCast;this.comboTargetLife=Number(target.lifeSeq||0);game.addText(this.pos,'COMBO!','#ff9aa9',24,30);}
                                    }
                                }
                                // v20: ORBIT 고유 쿨타임은 usePlayerAbility 시작에서 이미 설정됨.
                            } else if(sub === 'GEAR_ORBIT') {
                                this.vel = this.vel.add(rushDir.mult(15));
                                if(dist < 260) {
                                    game.spawnImpact(target.pos, 105, '#fbbf24', 1.4);
                                    target.takeDamage(25, this);
                                    target.vel = target.vel.add(rushDir.mult(32));
                                    __brScope.brApplyStun(target,14,this);
                                    game.addText(target.pos, '⚙️ RAM!', '#fde68a', 22, 28);
                                }
                                // v20: ORBIT 고유 쿨타임 유지.
                            } else if(sub === 'TORNADO_ORBIT') {
                                if(dist < 330) {
                                    const pullDir = this.pos.sub(target.pos).norm();
                                    target.vel = target.vel.add(pullDir.mult(24));
                                    __brScope.brApplyStun(target,8,this);
                                    game.spawnImpact(target.pos, 90, '#93c5fd', 1.2);
                                    game.addText(target.pos, '🌪️ PULL!', '#bfdbfe', 20, 27);
                                } else this.vel = this.vel.add(rushDir.mult(11));
                                // v20: ORBIT 고유 쿨타임 유지.
                            } else if(sub === 'ROLLING_BLADE') {
                                this.vel = this.vel.add(rushDir.mult(14));
                                if(dist < 285) {
                                    game.addSwingEffect(this,this.pos,rushDir,dist,'slash',.18,__brScope.brFxCommand(this,'target-strike',{targetX:target.pos.x,targetY:target.pos.y,targetRadius:target.radius,part:'orbit-strike'}));
                                    target.takeDamage(22*this.damageMult,this);
                                    target.vel = target.vel.add(rushDir.mult(24));
                                    __brScope.brApplyStun(target,8,this);
                                    game.addText(target.pos,'🛞 ROLLING BLADE!','#f9a8d4',22,24);
                                }
                            } else {
                                this.vel = this.vel.add(rushDir.mult(10));
                                // v20: ORBIT 고유 쿨타임 유지.
                            }
                        }
                        break;
                    }
                    
                    case __brScope.ABILITY_TYPES.ZONE: {
                        let color = (sub==='LAVA_POOL') ? 'rgba(255,0,0,0.5)' : 'rgba(0,255,0,0.5)';
                        let zoneType = (sub==='WEB_TRAP' || sub==='WEB_FIELD') ? 'web' : 'dmg';
                        if (sub === 'STINK') { zoneType = 'dmg'; color = '#78350f'; }
                        if (sub === 'GRAVITY_WELL') { zoneType = 'pull'; color = '#800080'; }
                        if (sub === 'TIME_BOMB') { zoneType = 'time_bomb'; color = '#555'; }
                        if (sub === 'TINY_FLAME') color = '#ffa500';
                        if (sub === 'SPREADING_POISON') color = '#2f855a';

                        const zoneCenter=manualPoint ? new __brScope.Vec2(manualPoint.x,manualPoint.y) : new __brScope.Vec2(this.pos.x,this.pos.y);
                        let zoneRadius = 112, zoneDamage = 5.0 * this.damageMult, zoneDuration = 260;
                        if(sub === 'LAVA_POOL') { zoneRadius = 158; zoneDamage = 6.6 * this.damageMult; zoneDuration = 335; }
                        else if(sub === 'STINK') { zoneRadius = 142; zoneDamage = 5.8 * this.damageMult; zoneDuration = 360; }
                        else if(sub === 'SPREADING_POISON') {
                            zoneRadius = 112;
                            zoneDamage = 5.4 * this.damageMult;
                            zoneDuration = 410;
                        }
                        else if(sub === 'GRAVITY_WELL') { zoneRadius = 178; zoneDamage = 0; zoneDuration = 238; }

                        // v21.5: 장판 전용 직업은 '한 번에 한 장판'만 유지한다.
                        // 재시전 시 이전 장판을 지우고 새 위치로 옮겨, 도배/중첩과 렉을 동시에 해결.
                        for(let i=game.zones.length-1;i>=0;i--) {
                            const z=game.zones[i];
                            if(z.owner===this && this.ability.type===__brScope.ABILITY_TYPES.ZONE) game.zones.splice(i,1);
                        }
                        game.zones.push(new __brScope.Zone(this, zoneCenter, zoneRadius, zoneDamage, zoneDuration, color, zoneType));
                        break;
                    }
                    case __brScope.ABILITY_TYPES.TURRET: {
                        let turretPos=manualPoint?new __brScope.Vec2(manualPoint.x,manualPoint.y):this.pos;
                        for(let i=game.turrets.length-1;i>=0;i--)if(game.turrets[i].owner===this)game.turrets.splice(i,1);
                        game.turrets.push(new __brScope.Turret(this,turretPos));
                        break;
                    }
                    case __brScope.ABILITY_TYPES.LASER: {
                        if(sub==='VOID_DESTRUCTION') {
                            const profile=__brScope.brLaserProfile(this.ability,this.run?.mods||{});
                            const beam=__brScope.brTraceBeam(this.pos,aimDir,Math.max(260,manualRange||profile.range),game.walls);
                            const beamRange=beam.length;
                            game.drawLaser(this.pos,beam.end,'#a78bfa',profile.width,{owner:this,part:'void-beam'});
                            __brScope.brFarm.line(game,this,this.pos,beam.end,profile.width*.5,.65,'laser:'+game.frame,'beam');
                            let totalDealt=0,hitCount=0;
                            for(const victim of game.getNearbyParticipants(this.pos,beamRange+120)) {
                                if(!victim.alive||victim===this||victim.id===999||(this.team!==0&&victim.team===this.team)) continue;
                                if(!__brScope.brBeamTouches(this.pos,victim,aimDir,beamRange,profile.width))continue;
                                if(game.checkWallBetween(this.pos,victim.pos)) continue;
                                const before=victim.hp;
                                victim.takeDamage(34*this.damageMult,this);
                                const dealt=Math.max(0,before-victim.hp);totalDealt+=dealt;if(dealt<=0)continue;hitCount++;if(!victim.alive)continue;
                                __brScope.brApplyStun(victim,9,this);
                                victim.vel=victim.vel.add(aimDir.mult(16*(victim.knockbackResist||1)));
                            }
                            if(this.alive&&totalDealt>0)__brScope.brApplyHealing(this,totalDealt*.18,this);
                            game.addText(this.pos,hitCount?'🌌 VOID BREAK ×'+hitCount:'🌌 VOID LASER','#c4b5fd',27,25);
                        } else {
                            game.drawLaser(this.pos, target.pos, '#f0f');
                            target.takeDamage(20 * this.damageMult, this);
                        }
                        break;
                    }
                    case __brScope.ABILITY_TYPES.PULL: {
                        if(sub === 'ABDUCT') {
                            const trace=__brScope.brFirstBeamHit(this.pos,aimDir,manualRange||500,125,
                                game.participants.filter(p=>!game.isConcealedFrom(p,this)),this,game.walls);
                            game.drawLaser(this.pos,this.pos.add(aimDir.mult(trace.length)),'#67e8f9',125,{owner:this,part:'abduct'});
                            const victim=trace.target;
                            if(victim){
                                victim.pos=this.pos.add(aimDir.mult(60));victim.warpSeq=Number(victim.warpSeq||0)+1;
                                const dealt=victim.takeDamage(40*this.damageMult,this);
                                if(victim.alive&&dealt>0){__brScope.brApplyStun(victim,30,this);victim.vel=aimDir.mult(20);}
                            }
                        } else if (sub === 'MULTI_GRAB') {
                            const candidates=game.getNearbyParticipants(this.pos,470+150)
                                .filter(p=>p.alive&&p!==this&&p.id!==999&&(this.team===0||p.team!==this.team)&&__brScope.brCanHostileTarget(p,this)&&
                                    __brScope.brSectorTouches(this.pos,p,aimDir,470,Math.PI/3)&&!game.checkWallBetween(this.pos,p.pos)&&!game.isConcealedFrom(p,this))
                                .sort((a,b)=>a.pos.dist(this.pos)-b.pos.dist(this.pos)||a.id-b.id).slice(0,3);
                            const grabs=candidates;
                            grabs.forEach((victim,idx)=>{
                                const pullDir = this.pos.sub(victim.pos).norm();
                                game.drawLaser(this.pos,victim.pos,idx===0?'#67e8f9':'#a5f3fc');
                                victim.takeDamage(16*this.damageMult,this);
                                victim.vel = pullDir.mult(24 + idx*2);
                                __brScope.brApplyStun(victim,34,this);
                                game.addText(victim.pos,'🦑 GRAB!','#67e8f9',20,20);
                            });
                            if(this.alive && grabs.length>=2) {
                                game.spawnImpact(this.pos,105,'#22d3ee',0.85);
                                __brScope.brApplyHealing(this,this.maxHp*0.025*grabs.length,this);
                            }
                        } else {
                            target.vel = target.pos.sub(this.pos).norm().mult(-25);
                            __brScope.brApplyStun(target,40,this);
                        }
                        break;
                    }
                    case __brScope.ABILITY_TYPES.DASH: {
                        this.dashImpactDone=false;this.dashTargetId=null;
                        const dashDir=aimDir;
                        this.vel = dashDir.mult(this.ability.dashSpeed || 35);
                        // Actual swept movement emits the dash path; no full-distance phantom trail.

                        if (sub === 'THUNDER_DASH') {
                            game.addText(this.pos,'🌩️ THUNDER CHARGE!','#fef08a',24,23);
                            if(!game.isVisualPerformanceMode()) game.spawnImpact(this.pos,72,'#fde047',0.70);
                        }
                        if (sub === 'ROCKET_JUMP') {
                            game.spawnExplosion(this.pos,80,'#ffaa00',{sourceId:this.remoteId,geometry:__brScope.brFxCommand(this,'circle',{part:'dash-launch'})});
                            game.applyAoE(this.pos, 80, 20 * this.damageMult, this, 15);
                        }
                        if(sub==='KINETIC_CHARGE') {
                            __brScope.brApplyGuard(this,this,72,0.18);
                            game.addText(this.pos,'🪓 KINETIC CHARGE!','#e2e8f0',27,24);
                        }

                        this.setAbilityCooldown();
                        this.dashFrames = this.manualDashFrames
                            ? this.manualDashFrames
                            : (this.ability.dashDuration || 15);
                        this.dashType = sub;
                        break;
                    }
                    
                    case __brScope.ABILITY_TYPES.AREA: {
                        let range = 175, damage = 32 * this.damageMult, push = 20, color = '#ff0';
                        if(sub === 'THUNDER') {
                            range = 195; damage = 36 * this.damageMult; push = 22; color = '#fde047';
                        } else if(sub === 'NUKE_DEATH') {
                            range = 215; damage = 38 * this.damageMult; push = 30; color = '#84cc16';
                            game.addText(this.pos, '☢️ RADIATION PULSE!', '#bef264', 30, 28);
                            game.zones.push(new __brScope.Zone(this, this.pos, 145, 4.8*this.damageMult, 175, '#65a30d', 'dmg'));
                        } else if(sub === 'FREEZE_STOMP') {
                            range = 210; color = '#67e8f9';
                        }
                        range*=__brScope.brRunMod(this,'skillSize');
                        game.spawnExplosion(this.pos, range, color);
                        game.applyAoE(this.pos, range, damage, this, push);
                        if(sub === 'THUNDER') {
                            for(const p of game.getNearbyParticipants(this.pos, range+20)) {
                                if(p!==this && p.alive && (this.team===0 || p.team!==this.team) && p.pos.dist(this.pos)<range) __brScope.brApplyStun(p,10,this);
                            }
                        }
                        break;
                    }
                }
            }

            takeDamage(amt, attacker, reflected=false, contactDirection=null, damageContext=null) {
                this._lastDamageResult={valid:false,shieldAbsorbed:0,hpDamage:0,killed:false};
                if(!this.alive||!Number.isFinite(amt)||amt<0||!__brScope.brCanHostileTarget(this,attacker))return 0;
                if(damageContext?.basic&&__brScope.BRRework)amt=__brScope.BRRework.basicDamage(attacker,this,amt,damageContext.attackId,damageContext.basicSnapshot);
                this._lastDamageResult.valid=true;
                if(!reflected&&!damageContext?.scaled&&attacker?._runSkillCast)amt*=attacker._runSkillCast.damage;
                if(attacker!==this)amt*=__brScope.brWangguiPower(attacker,damageContext,reflected);
                // Ghost movement grants concealment, never random damage immunity.
                
                if (this.ability.sub === 'WEAK' || this.ability.sub === 'PAPER_THIN') amt *= 3;
                const guard=this.teamGuardFrames>0?Number(this.teamGuardStrength||0):0;
                let reduction=Math.max(guard,__brScope.BRRework?.damageReduction(this)||0);
                if ((attacker?.combatBuff || this.combatBuff) && supplyDirectHit(attacker, this, reflected, damageContext)) {
                    const tick = __brScope.game?.frame || 0;
                    if (activeSupply(attacker, tick)?.kind === 'attack') amt *= 1.45;
                    if (activeSupply(this, tick)?.kind === 'guard') reduction = Math.max(reduction, .4);
                }
                amt*=Math.max(.55,1-reduction);
                const absorbed=__brScope.BRRework?__brScope.BRRework.absorb(this,amt):0;
                const actualDamage = Math.max(0, Math.min(this.hp, amt-absorbed));
                this._lastDamageResult.shieldAbsorbed=absorbed;this._lastDamageResult.hpDamage=actualDamage;
                if(actualDamage+absorbed>0&&attacker&&attacker!==this&&attacker.id!==999&&(!this.team||attacker.team!==this.team))__brScope.brRevealSmoke(this,__brScope.game,36,'hit');
                const counter= !reflected && !damageContext?.periodic && !damageContext?.rw && this.counterFrames>0 && attacker?.alive && attacker!==this && attacker.id!==999
                    ? {attacker,damage:actualDamage*.5*(this.counterCast?.damage||1)} : null;
                if(actualDamage>0&&this.run)this.run.lastDamageFrame=__brScope.game?__brScope.game.frame:this.survivalFrames;

                // Actual lost HP plus absorbed shield energy determines display weight, never combat power.
                const impactStyle=String(damageContext?.style||attacker?.currentImpactStyle||((attacker?.ability?.type||'hit')+':'+(attacker?.ability?.sub||'')));
                const impactLevel=__brScope.brFeelImpact(actualDamage,absorbed,attacker,damageContext,impactStyle);
                const feedbackDamage=actualDamage+absorbed;
                const closeImpact=!!(damageContext?.basic?__brScope.brProgressionCombat?.basicProfile(attacker?.ability,attacker?.run?.mods)?.close:
                    /tank|melee|dash|teleport|punch|smash|uppercut|combo|lunge|front|sweep|hammer/i.test(impactStyle)||
                    ['front','hammer','directional-sweep','guard-strike'].includes(__brScope.BRRework?.defs[damageContext?.ctx?.abilityId]?.skill?.kind));
                // Hit flash/confirmation is independent of physical force and control.
                this.damageTaken += actualDamage;
                if (attacker && attacker !== this && attacker.id !== 999) attacker.damageDealt += actualDamage;
                this.hp = Math.max(0,this.hp-actualDamage);
                if(this.hp===0&&actualDamage>0&&this.alive)__brScope.brRecordDeathCause(this,attacker,damageContext,contactDirection,reflected,actualDamage,absorbed,impactLevel,closeImpact);
                __brScope.BRCapture.damage(__brScope.game,attacker,this,actualDamage);
                if(__brScope.BRRework)__brScope.BRRework.onHpDamage(this,attacker,actualDamage,{...(damageContext||{}),reflected});

                // v23: 참고 파일처럼 피격 자체를 하나의 짧은 이벤트로 보낸다.
                // 독/다단히트가 몰려도 3프레임에 한 번만 보내 네트워크와 렌더 부하를 제한한다.
                if(__brScope.game && attacker && attacker!==this && (actualDamage+absorbed)>0 &&
                   __brScope.game.frame-Number(this.lastStudentHitFxFrame??-9999)>=(damageContext?.periodic||damageContext?.visualPeriodic?9:__brScope.brFeelRepeated(attacker,damageContext,impactStyle)?4:0)) {
                    const hitDir=contactDirection&&contactDirection.mag()>.001?contactDirection.norm():this.pos.sub(attacker.pos||this.pos).norm();
                    const ctx=damageContext?.ctx||damageContext?.basicSnapshot?.ctx,entity=damageContext?.entity;
                    const periodic=!!(damageContext?.periodic||damageContext?.visualPeriodic);
                    const feel=periodic?'sustain':impactLevel>=3?'heavy':closeImpact?'melee':'ranged';
                    const point=damageContext?.contact||{x:this.pos.x-hitDir.x*this.radius*.72,y:this.pos.y-hitDir.y*this.radius*.72};
                    __brScope.game.emitStudentFx('hit',point,{
                        dx:hitDir.x,dy:hitDir.y,
                        size:Math.min(closeImpact?112:78,Math.max(closeImpact?30:18,feedbackDamage*(closeImpact?1.9:1.45))),
                        amount:actualDamage,
                        color:({S:'#fb4b63',A:'#fbbf24',B:'#60a5fa',C:'#4ade80',F:'#cbd5e1'})[attacker.ability?.t]||'#ffffff',
                        targetId:this.remoteId||('player-'+this.id),style:impactStyle,
                        sourceId:attacker.remoteId||('player-'+attacker.id),impactLevel,
                        geometry:{shape:'contact',confirmed:true,matchKey:__brScope.brRingKey(),lifeSeq:Number(ctx?.ownerLifeSeq??attacker.lifeSeq??0),targetLife:Number(this.lifeSeq||0),hostFrame:__brScope.game.frame,
                            castId:ctx?.castId||damageContext?.attackId||'',projectileId:entity?.id||damageContext?.projectileId||'',ordinal:Number(entity?.ordinal??damageContext?.ordinal??0),
                            absorbed:Math.round(absorbed*100)/100,periodic,feel,displayMs:periodic?110:impactLevel>=3?210:170}
                    });
                    this.lastStudentHitFxFrame=__brScope.game.frame;this.lastDamageImpactLevel=impactLevel;this.lastDamageVisualFrame=__brScope.game.frame;
                }
                
                // ✨ v13: 타격 발생 자체가 전투 템포 시스템을 깨움
                this.flashUntilFrame=Number(__brScope.game?.frame||0)+(damageContext?.periodic?2:Math.min(7,3+Math.floor(amt/18)));
                if(__brScope.game) {
                    if(attacker && attacker !== this) __brScope.game.lastCombatFrame = __brScope.game.frame;
                    if(!damageContext?.periodic)__brScope.game.punchScreen(amt, this.pos, attacker);
                    if(!damageContext?.periodic&&actualDamage >= 18) __brScope.game.addText(this.pos, `-${Math.round(actualDamage)}`, actualDamage >= 35 ? '#fde047' : '#ffffff', actualDamage >= 35 ? 30 : 22, 28);
                    const hitFxScale = __brScope.game.getFxScale();
                    const hitParticleCount = damageContext?.periodic||hitFxScale <= 0 ? 0 : Math.max(2, Math.ceil(Math.min(18, Math.floor(amt/5 + 2)) * hitFxScale));
                    for(let i=0; i<hitParticleCount; i++) {
                        let phase=(__brScope.game.frame*17+this.id*13+i*7)%31;let v=new __brScope.Vec2((phase/31-.5)*22,(((phase*11)%31)/31-.5)*22);
                        __brScope.game.particles.push(new __brScope.Particle(this.pos, v, '#ffffff', 8+phase%8, 2+phase%4));
                        __brScope.game.particles.push(new __brScope.Particle(this.pos, v.mult(0.75), actualDamage>0?'#ef4444':'#67e8f9', 9+phase%8, 3+phase%4));
                    }
                }
                
                if(this.hp <= 0 && this.alive) {
                    this.alive = false;this.combatBuff=null;this._lastDamageResult.killed=true;
                    if(__brScope.BRRework)__brScope.BRRework.onDeath(this,__brScope.game);
                    this.deathFrame = __brScope.game ? __brScope.game.frame : this.survivalFrames;
                    this.deathVisualUntilFrame = this.deathFrame + 45;
                    this.deathVisualUntilAt = __brScope.now() + 750;
                    if (this.id !== 999 && __brScope.game) __brScope.game.recordElimination(this);
                    if(attacker && attacker !== this && attacker.id !== 999) {
                        if(!__brScope.session?.isRespawnMode())attacker.kills++;
                        __brScope.game.registerKillEvent(attacker, this);
                    }
                    __brScope.game.addText(this.pos, "ELIMINATED", "#ff4d4d", 34, 34);
                    __brScope.game.spawnExplosion(this.pos, 70, '#ff3b30');
                    if(__brScope.game) {
                        __brScope.game.retireParticipantFromCombat(this);
                        __brScope.game.emitStudentFx('elimination',this.pos,{size:Math.max(70,this.radius*2.2),color:'#ff4d4d',targetId:this.remoteId||('player-'+this.id),sourceId:attacker&&attacker!==this&&attacker.id!==999?(attacker.remoteId||('player-'+attacker.id)):'',style:'eliminated'});
                        if(!__brScope.game.isVisualPerformanceMode()) {
                            __brScope.game.screenFlashAlpha = Math.max(__brScope.game.screenFlashAlpha, 0.28);
                            __brScope.game.screenFlashColor = '255,70,70';
                        }
                        __brScope.game.spawnImpact(this.pos, 90, '#ff4d4d', 1.5);
                    }
                    
                    if(!__brScope.BRRework?.defs[this.ability.id]&&this.ability.sub === 'NUKE_DEATH') {
                        __brScope.game.addText(this.pos, '☢️ FALLOUT!', '#d9f99d', 50, 36);
                        __brScope.game.spawnExplosion(this.pos, 320, '#a3e635');
                        __brScope.game.applyAoE(this.pos, 320, 105, this, 62);
                        __brScope.game.zones.push(new __brScope.Zone(this, this.pos, 205, 7.2, 240, '#65a30d', 'dmg'));
                    }
                }
                if(damageContext?.basic&&__brScope.BRRework)__brScope.BRRework.basicHit(attacker,this,this._lastDamageResult,damageContext.basicSnapshot);
                if(counter?.attacker.alive&&counter.damage>0){
                    counter.attacker.takeDamage(counter.damage,this,true,null,{scaled:true,style:'guard-counter'});
                    if(__brScope.game)__brScope.game.drawLaser(this.pos,counter.attacker.pos,'#93c5fd',4,{owner:this,part:'counter-confirm'});
                }
                return actualDamage;
            }
        };
}
export const initializers=[

];
