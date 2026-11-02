// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.Projectile = class Projectile {
            constructor(owner, pos, dir, speed, damage, size, type, color, explodeRadius=0, emoji=null, opts={}) {
                this.runSkill=opts.impactStyle==='ranged-basic'?null:(opts.runSkill||owner?._runSkillCast||(owner?.dashFrames>0?owner._runLastSkill:null)||__brScope.brRunSkillSnapshot(owner));
                this.dotDamageMult=this.runSkill?.damage||Number(opts.basicDamageMultiplier||1);
                if(this.runSkill){damage*=this.runSkill.damage;size*=this.runSkill.size;explodeRadius*=this.runSkill.size;}
                this.owner = owner;this.ownerLife=Number(owner?.lifeSeq||0);this.ownerAbilityId=owner?.ability?.id;this.homingTurnRate=Number(opts.homingTurnRate??.032);this.homingCone=Number(opts.homingCone??1.22);this.wangguiPower=Number(opts.basicSnapshot?.ctx?.run?.wangguiPower??this.runSkill?.wangguiPower??__brScope.brRunMod(owner,'wangguiPower'));this.basicSnapshot=opts.basicSnapshot||null;this.basicAttackId=opts.basicAttackId||null; this.pos = pos; this.vel = dir.mult(speed);
                this.farmBornFrame=__brScope.game?.frame||0;
                const action=owner?.activeInputCommand;
                this.inputKind=opts.attackKind||action?.kind||(opts.basicAttackId?'attack':'skill');this.inputSeq=Number(action?.seq||0);
                this.shotOrdinal=action?Number(action.shotOrdinal||0):0;if(action)action.shotOrdinal=this.shotOrdinal+1;
                this.visualLife=this.ownerLife;

                // v22.7: 상위랭크 원거리(PROJ) 화력 보강.
                // S는 체감될 정도, A는 소폭만 올리고 B/C/F는 그대로 유지.
                const rangedProjectileUser = owner?.ability?.type === __brScope.ABILITY_TYPES.PROJ && !opts.normalizedSkillStats;
                if(rangedProjectileUser && owner?.ability?.t === 'S') {
                    damage *= 1.10;
                    size *= 1.14;
                } else if(rangedProjectileUser && owner?.ability?.t === 'A') {
                    damage *= 1.06;
                    size *= 1.08;
                }

                this.damage = damage; this.size = size; this.type = type;
                this.color = color; this.explodeRadius = explodeRadius;
                this.emoji = this.inputKind==='attack'?null:type==='ORBIT'?emoji:(owner?.ability?.e||emoji||null);
                this.life = 120; this.returnAfterLife=90; this.hitOncePerPass=!!opts.hitOncePerPass; this.bounces = opts.bounces || ((type === 'BOUNCE_BALL') ? 3 : 0); this.returning = false; 
                
                this.pierce = opts.pierce || false;
                this.wobble = opts.wobble || false;
                this.spinRate = opts.spinRate || 0;
                this.faceDir = opts.faceDir || false;
                this.knockback = (opts.knockback ?? 3)*(this.runSkill?.control??1);
                this.vfx = opts.vfx || null;
                // ✨ v13: 투사체별 잔상/충돌색/상태효과
                this.trailColor = opts.trailColor || null;
                this.impactColor = opts.impactColor || color || '#fff';
                this.status = opts.status || null;
                this.statusPower = opts.statusPower || 0;
                this.weaponStyle = opts.weaponStyle || __brScope.getRangedWeaponStyle(owner?.ability||{});
                this.impactStyle = opts.impactStyle || '';
                this.playerSkillBlast=!!opts.playerSkillBlast;
                this.rangeRemaining=Number.isFinite(opts.rangeRemaining)?Math.max(0,opts.rangeRemaining):null;
                this.detonated=false;
                this.hitMemory = Object.create(null);
                this.spinAngle = 0;
                // v22.2: 유도탄이 매 프레임 전체 적을 다시 탐색하지 않도록 타깃을 잠시 캐시.
                this.homingTarget = null;
                this.nextHomingRefresh = 0;
                this._wallCandidates = [];
                this._shotStart = new __brScope.Vec2(0,0);this._shotEnd = new __brScope.Vec2(0,0);this._travel = new __brScope.Vec2(0,0);this._contacts=[];

                // ✨ 검성 투사체가 더 밖에서 돌도록 orbitDist를 옵션으로 받거나 기본값을 높임
                if(type === 'ORBIT') { 
                    this.orbitAngle = (opts.orbitAngle !== undefined) ? opts.orbitAngle : __brScope.rand() * Math.PI * 2;
                    this.orbitDist = opts.orbitDist || owner.radius + 35;
                    this.orbitSpeed = opts.orbitSpeed || 0.10;
                    // v20: 회전 무기는 상시 보호막이 아니라 일정 시간만 전개된다.
                    this.life = Math.round((opts.orbitLife || {S:270,A:220,B:185,C:155,F:125}[owner?.ability?.t] || 180)*(this.runSkill?.duration||1));
                    this.maxLife = this.life;
                }
                // 한 번의 탄막은 발사 섬광 이벤트 하나만 보내 실제 투사체를 놓치는 저주사율 화면도 방향을 읽게 한다.
                if(__brScope.game&&owner&&type!=='ORBIT'&&__brScope.game.frame-Number(owner.lastStudentShotFxFrame||-9999)>=2) {
                    __brScope.game.emitStudentFx('shot',pos,{
                        dx:dir.x,dy:dir.y,size:Math.min(260,Math.max(120,speed*12)),
                        color:opts.trailColor||color||'#ffffff',amount:size,style:this.weaponStyle||emoji||opts.vfx||'',sourceId:owner.remoteId||('player-'+owner.id)
                    });
                    owner.lastStudentShotFxFrame=__brScope.game.frame;
                }
            }
            update(game) {
                if(this.life<=0)return;
                if(this.owner&&(Number(this.owner.lifeSeq||0)!==this.ownerLife||this.owner.ability.id!==this.ownerAbilityId)){this.life=0;return;}
                const shotStart=this._shotStart;shotStart.x=this.pos.x;shotStart.y=this.pos.y;let wallContact=null;
                if(this.type === 'ORBIT') {
                    if(!this.owner.alive) { this.life = 0; return; }
                    this.life--;
                    if(this.life <= 0) return;
                    this.orbitAngle += this.orbitSpeed;
                    let offset = new __brScope.Vec2(Math.cos(this.orbitAngle), Math.sin(this.orbitAngle)).mult(this.orbitDist);
                    this.pos = this.owner.pos.add(offset);
                } else if (this.type === 'BOOMERANG') {
                    if (this.wobble) this.vel = this.vel.rotate((__brScope.rand() - 0.5) * 0.4);
                    if (this.spinRate) this.spinAngle += this.spinRate;

                    this.pos = this.pos.add(this.vel); this.life--;
                    if (!this.returning && this.life < this.returnAfterLife) {this.returning = true;this._brTurn=Number(this._brTurn||0)+1;if(this.hitOncePerPass)this.hitMemory=Object.create(null);}
                    if (this.returning) {
                        if (!this.owner.alive) { this.life = 0; return; }
                        let dirToOwner = this.owner.pos.sub(this.pos).norm();
                        this.vel = this.vel.add(dirToOwner.mult(1.5));
                        if (this.vel.mag() > 15) this.vel = this.vel.norm().mult(15);
                        if (this.pos.dist(this.owner.pos) < 20) this.life = 0;
                    }
                } else {
                    if (this.wobble) this.vel = this.vel.rotate((__brScope.rand() - 0.5) * 0.4);
                    if (this.spinRate) this.spinAngle += this.spinRate;

                    let travel=this.vel;
                    if(this.rangeRemaining!==null&&travel.mag()>this.rangeRemaining)travel=travel.norm().mult(this.rangeRemaining);
                    let nextPos = this.pos.add(travel);
                    if(this.type!=='GHOST')wallContact=__brScope.combatTraceWalls(this.pos,nextPos,this.size,game.walls,this._wallCandidates);
                    this.pos = nextPos;
                    this.life--;
                    if(this.rangeRemaining!==null)this.rangeRemaining=Math.max(0,this.rangeRemaining-travel.mag());
                    if(this.type === 'missile'&&__brScope.BRRework)__brScope.BRRework.nativeHoming(this,game);
                }
                // ✨ v13: 개성 있는 투사체 잔상. 너무 많이 쌓이지 않도록 간격을 둠.
                const trailEvery = game.getProjectileTrailCadence();
                if(game.getFxScale() > 0 && this.trailColor && this.type !== 'ORBIT' && this.life > 0 && this.life % trailEvery === 0 && game.hasParticleRoom(1)) {
                    const back = this.vel.mag() > 0 ? this.vel.norm().mult(-0.4) : new __brScope.Vec2(0,0);
                    // 시각효과 때문에 전투 RNG 흐름이 바뀌지 않도록 ID/life 기반의 작은 고정 지터 사용.
                    const phase=((this.owner?.id||0)*17 + this.life*13) % 11;
                    const jitter = new __brScope.Vec2((phase-5)*0.16, ((phase*7)%11-5)*0.16);
                    game.particles.push(new __brScope.Particle(new __brScope.Vec2(this.pos.x, this.pos.y), back.add(jitter), this.trailColor, 10, Math.max(2, this.size*0.22)));
                }

                // Test the travelled segment against moving targets, in impact order.
                // ORBIT remains a contact weapon and retains its existing repeat-hit interval.
                if(game.capture&&this.type!=='ORBIT'){const edge=__brScope.brCaptureBoundaryHit(shotStart,this.pos,this.size);if(edge&&(!wallContact||edge.t<wallContact.t))wallContact=edge;}
                const shotEnd=this._shotEnd;shotEnd.x=this.pos.x;shotEnd.y=this.pos.y;
                const travel=this._travel;travel.x=shotEnd.x-shotStart.x;travel.y=shotEnd.y-shotStart.y;
                const orbit=this.type==='ORBIT';
                const padding=this.size+150+Number(game.maxParticipantStep||0),cs=game.spatialCellSize;
                const minX=Math.floor((Math.min(shotStart.x,shotEnd.x)-padding)/cs),maxX=Math.floor((Math.max(shotStart.x,shotEnd.x)+padding)/cs);
                const minY=Math.floor((Math.min(shotStart.y,shotEnd.y)-padding)/cs),maxY=Math.floor((Math.max(shotStart.y,shotEnd.y)+padding)/cs),contacts=this._contacts;contacts.length=0;
                for(let gx=minX;gx<=maxX;gx++)for(let gy=minY;gy<=maxY;gy++) {
                    const bucket=game.spatialGrid.get(__brScope.combatGridKey(gx,gy));if(!bucket)continue;
                    for(const p of bucket) {
                        if(p===this.owner||!p.alive||(this.owner.team!==0&&p.team===this.owner.team)||!__brScope.brCanHostileTarget(p,this.owner))continue;
                        let t;
                        if(orbit)t=this.pos.dist(p.pos)<p.radius+this.size?0:null;
                        else {
                            const px=Number.isFinite(p.combatPreviousX)?p.combatPreviousX:p.pos.x,py=Number.isFinite(p.combatPreviousY)?p.combatPreviousY:p.pos.y;
                            t=__brScope.combatSegmentCircleTime(shotStart.x-px,shotStart.y-py,travel.x-(p.pos.x-px),travel.y-(p.pos.y-py),p.radius+this.size);
                        }
                        if(t===null||(wallContact&&t>=wallContact.t))continue;
                        const repeatDelay=orbit?(this.owner?.ability?.sub==='SWORD_ORBIT'?12:10):((this.pierce||this.type==='BOOMERANG')?10:0);
                        if(this.hitOncePerPass&&this.hitMemory[p.id]!=null)continue;
                        if(repeatDelay>0&&game.frame-(this.hitMemory[p.id]??-99999)<repeatDelay)continue;
                        contacts.push({p,t});
                    }
                }
                __brScope.brFarm.projectileContacts(game,this,shotStart,shotEnd,wallContact,contacts);
                __brScope.BRRework?.nativeProjectileContacts(game,this,shotStart,shotEnd,wallContact,contacts);
                contacts.sort((a,b)=>a.t-b.t||Number(a.p?.id??a.farm?.id??a.rwTurret?.id??0)-Number(b.p?.id??b.farm?.id??b.rwTurret?.id??0));
                for(const {p,t,farm,rwTurret} of contacts) {
                    if(rwTurret){if(__brScope.BRRework.nativeProjectileTurretHit(game,this,rwTurret,shotStart.add(travel.mult(t))))return;continue;}
                    if(farm) {
                        if(farm.hp<=0)continue;
                        this.pos=orbit?shotEnd:shotStart.add(travel.mult(t));
                        if(__brScope.brFarm.projectileHit(game,this,farm))return;
                        continue;
                    }
                    if(!p.alive)continue;
                    this.hitMemory[p.id]=game.frame;
                    this.pos=orbit?shotEnd:shotStart.add(travel.mult(t));
                    this.hit(game,p);
                    if(this.detonated||(this.type!=='ORBIT'&&this.type!=='BOOMERANG'&&!this.pierce))return;
                }
                this.pos=shotEnd;
                if(wallContact) {
                    this.pos=shotStart.add(travel.mult(wallContact.t));
                    if(wallContact.boundary&&this.type==='BOOMERANG'){this.returning=true;this.life=Math.min(this.life,this.returnAfterLife-1);this.vel=this.owner.pos.sub(this.pos).norm().mult(Math.max(1,this.vel.mag()));if(this.hitOncePerPass)this.hitMemory=Object.create(null);this._brTurn=Number(this._brTurn||0)+1;return;}
                    if(this.bounces>0&&!wallContact.boundary) {
                        const normal=new __brScope.Vec2(wallContact.nx,wallContact.ny),vn=this.vel.x*normal.x+this.vel.y*normal.y;
                        this.vel=this.vel.sub(normal.mult(2*vn));this.pos=this.pos.add(normal.mult(.01));this.bounces--;this._brTurn=Number(this._brTurn||0)+1;
                        __brScope.brRecordFlightPath(this,game.frame,this.pos.x,this.pos.y,this._brTurn,true);
                    } else {
                        if(this.playerSkillBlast){this.detonatePlayerSkill(game);return;}
                        this.life=0;game.spawnParticles(this.pos,3,'#fff');
                        if(this.explodeRadius>0){game.spawnExplosion(this.pos,this.explodeRadius,this.color);game.applyAoE(this.pos,this.explodeRadius,this.damage,this.owner,this.knockback,{scaled:true,wangguiPower:this.wangguiPower,style:'projectile-blast'});}
                        return;
                    }
                }
                if(this.playerSkillBlast&&(this.life<=0||this.rangeRemaining===0))this.detonatePlayerSkill(game);
            }
            detonatePlayerSkill(game,primaryTarget=null) {
                if(this.detonated)return;
                this.detonated=true;this.life=0;
                const radius=Math.max(50,this.explodeRadius),sourceId=this.owner?.remoteId||('player-'+this.owner?.id);
                __brScope.brFarm.area(game,this.owner,this.pos,radius,this.farmDamage||.65,this.farmToken||'blast:'+this.farmBornFrame);
                __brScope.BRRework?.nativeAreaTurrets(game,this.owner,this.pos,radius,this.damage,{scaled:true,wangguiPower:this.wangguiPower});
                game.emitStudentFx('explosion',this.pos,{size:radius,color:this.color,style:this.weaponStyle,sourceId,impactLevel:3});
                const previousStyle=this.owner?.currentImpactStyle;
                if(this.owner)this.owner.currentImpactStyle=this.impactStyle||'ranged-power';
                try {
                    for(const victim of game.getNearbyParticipants(this.pos,radius+80)) {
                        if(victim===this.owner||!victim.alive||victim.id===999||(this.owner.team&&victim.team===this.owner.team)||!__brScope.brCanHostileTarget(victim,this.owner))continue;
                        const distance=victim.pos.dist(this.pos);
                        if(victim!==primaryTarget&&(distance>radius+victim.radius*.35||game.checkWallBetween(this.pos,victim.pos)))continue;
                        const falloff=victim===primaryTarget?1:1-.35*Math.min(1,distance/radius);
                        victim.takeDamage(this.damage*falloff,this.owner,false,victim.pos.sub(this.pos),{scaled:true,wangguiPower:this.wangguiPower,style:this.impactStyle||'ranged-power',projectileStyle:this.weaponStyle,knockback:this.knockback,explodeRadius:radius,projectileId:this._brNetId||'',ordinal:this.shotOrdinal||0,actionKind:this.inputKind,contact:{x:victim.pos.x,y:victim.pos.y}});
                        const outward=victim.pos.sub(this.pos),dir=outward.mag()>.01?outward.norm():this.vel.norm();
                        const push=this.knockback*falloff;
                        __brScope.BRRework.nativeImpulse(victim,this.owner,dir,push,game,this.runSkill);
                        // Explosion recoil is physical displacement, never implicit stun.
                        if(push>=24)game.markLaunched(victim,this.owner,Math.min(35,Math.round(12+push*.35)),{wangguiPower:this.wangguiPower});
                    }
                } finally {if(this.owner)this.owner.currentImpactStyle=previousStyle||'';}
            }
            hit(game, target) {
                if(!__brScope.brCanHostileTarget(target,this.owner))return;
                if(this.playerSkillBlast){this.detonatePlayerSkill(game,target);return;}
                // ✨ v15: 궤도형은 hitMemory의 개별 재타격 쿨다운만 사용한다.
                // 과거의 global frame % 15 조건 때문에 실제로 닿아도 대부분 피해가 무효화되던 문제 수정.
                if(this.type !== 'ORBIT' && !this.pierce && this.type !== 'BOOMERANG') this.life = 0;

                game.spawnImpact(this.pos, Math.max(20, this.size * 1.7), this.impactColor, Math.min(1.8, 0.7 + this.damage/30));
                // Contact intensity comes from the actual result in takeDamage below.
                const dealDamage=(victim)=>{
                    const previousStyle=this.owner&&this.owner.currentImpactStyle;
                    if(this.owner&&this.impactStyle)this.owner.currentImpactStyle=this.impactStyle;
                    try { return victim.takeDamage(this.damage,this.owner,false,this.explodeRadius>0?victim.pos.sub(this.pos):(this.type==='ORBIT'?victim.pos.sub(this.owner.pos):this.vel),{scaled:true,wangguiPower:this.wangguiPower,basic:this.impactStyle==='ranged-basic',attackId:this.basicAttackId,basicSnapshot:this.basicSnapshot,contact:{x:this.pos.x,y:this.pos.y},projectileId:this._brNetId||'',actionKind:this.inputKind,ordinal:this.shotOrdinal||0,visualPeriodic:this.type==='ORBIT',projectileStyle:this.weaponStyle,knockback:this.knockback,explodeRadius:this.explodeRadius}); }
                    finally { if(this.owner)this.owner.currentImpactStyle=previousStyle||''; }
                };
                
                if(this.explodeRadius > 0) {
                    __brScope.BRRework?.nativeAreaTurrets(game,this.owner,this.pos,this.explodeRadius,this.damage,{scaled:true,wangguiPower:this.wangguiPower});
                    game.spawnExplosion(this.pos, this.explodeRadius, this.impactColor || this.color);
                    for(const p of game.getNearbyParticipants(this.pos,this.explodeRadius+70)) {
                        if(p===this.owner || !p.alive || p.id===999) continue;
                        if(this.owner.team!==0 && p.team===this.owner.team) continue;
                        if(p===target||p.pos.dist(this.pos) < this.explodeRadius) {
                            const dealt=dealDamage(p);if(!p.alive||!p._lastDamageResult?.valid)continue;
                            __brScope.BRRework.nativeImpulse(p,this.owner,p.pos.sub(this.pos).norm(),this.knockback,game,this.runSkill);
                            // No automatic stun on explosions.
                        }
                    }
                    if(this.owner?.ability?.sub==='SODA_BOMB') game.addText(this.pos,'🥤 POP!','#e0f2fe',18,18);
                } else {
                    const dealt=dealDamage(target);if(!target.alive||!target._lastDamageResult?.valid)return;
                    if(this.type === 'ICE_SHARD'&&this.impactStyle!=='ranged-basic')__brScope.brApplyStun(target,20,this.owner,this.runSkill);
                    if(this.status === 'stun'&&this.impactStyle!=='ranged-basic')__brScope.brApplyStun(target,this.statusPower??24,this.owner,this.runSkill);
                    if(this.status === 'poison' && this.owner && this.owner.alive) {
                        target.poisonFrames = Math.max(target.poisonFrames || 0, this.statusPower || 90);
                        target.poisonOwner = this.owner;target.poisonOwnerLife=this.ownerLife;target.poisonAbilityId=this.ownerAbilityId;
                        target.poisonDamageMult = this.dotDamageMult;target.poisonWangguiPower=this.wangguiPower;
                    }
                    if(this.status === 'pull' && this.owner && this.owner.alive) {
                        target.vel = target.vel.add(this.owner.pos.sub(target.pos).norm().mult((this.statusPower || 18) * (this.runSkill?.control||1) * (target.knockbackResist || 1)));
                    }
                    let impactDir = this.vel.mag() > 0 ? this.vel.norm() : null;
                    if(this.type === 'ORBIT' && this.owner) impactDir = target.pos.sub(this.owner.pos).norm();
                    if(!impactDir || impactDir.mag() === 0) impactDir = new __brScope.Vec2(1,0);
                    __brScope.BRRework.nativeImpulse(target,this.owner,impactDir,this.knockback,game,null);
                    if(this.type === 'ORBIT' && this.owner?.ability?.sub === 'SWORD_ORBIT') {
                        // Orbit hit feedback does not interrupt controls.
                        this.owner.vel = this.owner.vel.add(target.pos.sub(this.owner.pos).norm().mult(1.2));
                    }
                    game.spawnParticles(this.pos, this.type === 'ORBIT' ? 8 : 5, this.impactColor || this.color);
                }
            }
            
        };
}
export const initializers=[

];
