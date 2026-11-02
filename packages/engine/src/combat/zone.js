// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.Zone = class Zone {
            constructor(owner, pos, radius, damage, duration, color, type, opts={}) {
                this.runSkill=owner?._runSkillCast||(owner?.dashFrames>0?owner._runLastSkill:null)||__brScope.brRunSkillSnapshot(owner);
                if(!opts.scaledRadius)radius*=this.runSkill.size;
                damage*=this.runSkill.damage;duration=Math.round(duration*this.runSkill.duration);
                this.owner = owner;this.ownerLife=Number(owner?.lifeSeq||0);this.ownerAbilityId=owner?.ability?.id; this.pos = new __brScope.Vec2(pos.x, pos.y); this.radius = radius; this.damage = damage;
                this.duration = duration; this.maxDuration = duration; this.color = color; this.type = type;
                this.triggered = false;
                this.seed = ((owner?.id || 0) * 37 + Math.floor(pos.x*0.07) + Math.floor(pos.y*0.11)) % 997;
                this.baseRadius = radius;
                this.targetRadius = (owner?.ability?.sub === 'SPREADING_POISON') ? radius * 1.48 : radius;
                const sub = owner?.ability?.sub || '';
                if(type === 'pull' || sub === 'GRAVITY_WELL') this.pattern = 'gravity';
                else if(type === 'web' || sub === 'ICE_TRAIL') this.pattern = sub === 'ICE_TRAIL' ? 'ice' : 'web';
                else if(type === 'time_bomb') this.pattern = sub === 'BANANA_TRAIL' ? 'banana' : 'bomb';
                else if(['LAVA_POOL','DIVE_LAVA'].includes(sub)) this.pattern = 'lava';
                else if(sub === 'STINK') this.pattern = 'stink';
                else if(sub === 'SPREADING_POISON') this.pattern = 'plague';
                else if(sub === 'POISON_TRAIL') this.pattern = 'poison';
                else if(['THUNDER_DASH','LIGHTNING_DASH'].includes(sub)) this.pattern = 'electric';
                else if(sub === 'INK_TRAIL') this.pattern = 'ink';
                else this.pattern = 'hazard';
            }
            update(game) {
                if(this.owner&&(Number(this.owner.lifeSeq||0)!==this.ownerLife||this.owner.ability.id!==this.ownerAbilityId)){this.duration=0;return;}
                this.duration--;
                // 역병군주의 독구름은 여러 장판을 찍는 대신 한 구름이 서서히 퍼진다.
                if(this.owner?.ability?.sub === 'SPREADING_POISON' && this.radius < this.targetRadius) {
                    this.radius = Math.min(this.targetRadius, this.radius + 0.16*this.runSkill.size);
                }
                const tickRate = this.owner?.ability?.type === __brScope.ABILITY_TYPES.ZONE ? 12 : 15;
                if(this.duration % tickRate === 0) {
                    if((this.damage>0&&this.type!=='pull')||this.owner?.ability?.sub==='GRAVITY_WELL')__brScope.brFarm.area(game,this.owner,this.pos,this.radius,tickRate/90,'zone:'+game.frame);
                    __brScope.BRRework?.nativeAreaTurrets(game,this.owner,this.pos,this.radius,this.damage*(this.owner?.ability?.type===__brScope.ABILITY_TYPES.ZONE?(this.owner.ability.t==='S'?1.30:1.10):(this.owner?.ability?.t==='S'?1.24:1)),{scaled:true,wangguiPower:this.runSkill.wangguiPower,periodic:true});
                    const geometry=__brScope.brZoneGeometry(this.radius,this.type,this.owner?.ability?.sub);
                    const scanRadius = Math.max(geometry.core,geometry.pull) + 80;
                    for(const p of game.getNearbyParticipants(this.pos, scanRadius)) {
                        if (p === this.owner || !p.alive || (this.owner.team !== 0 && p.team === this.owner.team) || !__brScope.brCanHostileTarget(p,this.owner)) continue;
                        if(this.type === 'pull' && p.pos.dist(this.pos) < geometry.pull) {
                            const pullPower = this.owner?.ability?.sub === 'GRAVITY_WELL' ? 4.6 : 2;
                            p.vel = p.vel.add(this.pos.sub(p.pos).norm().mult(pullPower*this.runSkill.control));
                        }
                        if(p.pos.dist(this.pos) < this.radius) {
                            if(this.type === 'pull' && this.owner?.ability?.sub === 'GRAVITY_WELL') {
                                // v21.12: 블랙홀 중심부는 흡입만 하는 빈 장판이 아니라 지속 압축 피해를 준다.
                                p.takeDamage(4.2*(this.owner.damageMult||1)*this.runSkill.damage,this.owner,false,null,{scaled:true,wangguiPower:this.runSkill.wangguiPower,periodic:true,style:'dot:gravity'});
                                p.vel = p.vel.add(this.pos.sub(p.pos).norm().mult(1.25*this.runSkill.control));
                            }
                            if (this.type !== 'pull') {
                                // v17: 장판은 단일 피해는 얌전하지만, 여러 장판이 겹치면 위력이 빠르게 커진다.
                                // v21.5: 겹친 장판은 원래 피해만 합산되고 별도의 '중첩 보너스'는 제거.
                                // 전용 장판은 한 번에 하나만 유지하므로 접근 불가능한 장판 도배 메타를 방지한다.
                                const dedicated = this.owner?.ability?.type === __brScope.ABILITY_TYPES.ZONE;
                                const tier = this.owner?.ability?.t;
                                const zonePowerMult = dedicated ? (tier === 'S' ? 1.30 : 1.10) : (tier === 'S' ? 1.24 : 1.0);
                                p.takeDamage(this.damage*zonePowerMult,this.owner,false,null,{scaled:true,wangguiPower:this.runSkill.wangguiPower,periodic:true,style:'dot:zone'});
                            }
                            if(this.type === 'web') {
                                const freeze = this.pattern === 'ice' ? 16 : 10;
                                if(__brScope.BRRework)__brScope.BRRework.applySlow(p,.65,Math.max(18,freeze),this.owner);
                                if(this.pattern === 'ice') p.vel = p.vel.mult(Math.max(.35,1-.28*this.runSkill.control));
                            }
                            if(this.pattern === 'lava' && this.owner?.ability?.type === __brScope.ABILITY_TYPES.ZONE) p.vel = p.vel.mult(Math.max(.35,1-.16*this.runSkill.control));
                            if(['poison','plague','stink'].includes(this.pattern)) {
                                if(this.owner?.ability?.sub === 'POISON_TRAIL') p.vel = p.vel.mult(Math.max(.35,1-.12*this.runSkill.control));
                                else if(this.owner?.ability?.type === __brScope.ABILITY_TYPES.ZONE) p.vel = p.vel.mult(Math.max(.35,1-.10*this.runSkill.control));
                            }
                            if(this.pattern === 'ink') {
                                p.blindedFrames = Math.max(p.blindedFrames || 0, __brScope.brRunCC(58,this.runSkill.control));
                                p.vel = p.vel.mult(Math.max(.35,1-.18*this.runSkill.control));
                            }
                            if((this.pattern === 'bomb' || this.pattern === 'banana') && this.duration < this.maxDuration - 12 && p.pos.dist(this.pos) < this.radius * 1.15) {
                                this.triggered = true; this.duration = 0;
                            }
                            if(this.type === 'boom') p.vel = p.pos.sub(this.pos).norm().mult(15*this.runSkill.control);
                        }
                    }
                }
                if(this.type === 'pull' && this.duration <= 0) {
                    const isBlackHole = this.owner?.ability?.sub === 'GRAVITY_WELL';
                    const burstDamage = isBlackHole ? 42 : (this.owner?.ability?.t === 'S' ? 54 : 40);
                    const burstPush = isBlackHole ? 30 : (this.owner?.ability?.t === 'S' ? 24 : 20);
                    const burstRadius = __brScope.brZoneGeometry(this.radius,this.type,this.owner?.ability?.sub).burst;
                    game.spawnExplosion(this.pos, burstRadius, '#f0f',{geometry:__brScope.brFxCommand(this.owner,'circle',{part:'gravity-burst'}),sourceId:this.owner?.remoteId}); game.applyAoE(this.pos, burstRadius, burstDamage*this.runSkill.damage,this.owner,burstPush*this.runSkill.control,{scaled:true,wangguiPower:this.runSkill.wangguiPower,style:'skill-zone-burst'});
                }
                if(this.type === 'time_bomb' && this.duration <= 0) {
                    let burstDamage = 60, burstPush = 30, burstRadius = this.radius * 1.5;
                    if(this.owner?.ability?.sub === 'BOMB_TRAIL') { burstDamage = 34 * this.owner.damageMult; burstPush = 25; burstRadius = this.radius * 1.65; }
                    else if(this.owner?.ability?.sub === 'BANANA_TRAIL') { burstDamage = 28 * this.owner.damageMult; burstPush = 34; burstRadius = this.radius * 1.7; }
                    if(__brScope.TRAIL_DASH_SUBS.has(this.owner?.ability?.sub)&&!['S','A'].includes(this.owner?.ability?.t))burstDamage*=.75;
                    game.spawnExplosion(this.pos,burstRadius,this.pattern==='banana'?'#facc15':'#f97316',{sourceId:this.owner?.remoteId,geometry:__brScope.brFxCommand(this.owner,'circle',{part:'trail-burst'})});
                    game.applyAoE(this.pos, burstRadius, burstDamage*this.runSkill.damage,this.owner,burstPush*this.runSkill.control,{scaled:true,wangguiPower:this.runSkill.wangguiPower,style:'skill-zone-burst'});
                }
            }
            
        };
}
export const initializers=[

];
