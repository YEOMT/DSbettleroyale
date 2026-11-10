// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.getRangedWeaponStyle = function getRangedWeaponStyle(ability={}) {
            const sub=ability.sub||'', name=String(ability.timingSeed||ability.n||''), count=Number(ability.pCount||1);
            if(__brScope.RANGED_SNIPER_SUBS.has(sub)||ability.type===__brScope.ABILITY_TYPES.LASER||/스나이퍼|저격|헤드슈터/.test(name)) return 'sniper';
            if(__brScope.RANGED_BOMBER_SUBS.has(sub)||Number(ability.pExplode||0)>=34||/폭격|폭탄|운석|다이너마이트/.test(name)) return 'bomber';
            if(__brScope.RANGED_MACHINE_SUBS.has(sub)||(count>=4&&!ability.pExplode)||/난사|연사|탄막/.test(name)) return 'machine';
            if(ability.projType==='missile') return 'homing';
            if(ability.projType==='BOOMERANG'||sub==='BOOMERANG') return 'boomerang';
            if(Number(ability.knockback||0)>=15||Number(ability.pSize||0)>=20||Number(ability.pDmg||0)>=24) return 'heavy';
            return 'standard';
        };

__brScope.getRangedCombatProfile = function getRangedCombatProfile(ability={},kind='skill') {
            const tier=ability.t||'C',style=__brScope.getRangedWeaponStyle(ability);
            const ranges={
                sniper:{S:1250,A:1160,B:1070,C:930,F:760},
                machine:{S:1120,A:1040,B:950,C:830,F:680},
                bomber:{S:850,A:790,B:700,C:620,F:520},
                heavy:{S:980,A:900,B:820,C:730,F:600},
                homing:{S:1050,A:960,B:880,C:780,F:650},
                boomerang:{S:800,A:750,B:690,C:620,F:520},
                standard:{S:1000,A:920,B:840,C:740,F:610}
            };
            const speeds={
                sniper:{S:32,A:29,B:25,C:21,F:16}, machine:{S:24,A:22,B:19,C:16,F:12},
                bomber:{S:14,A:13,B:11,C:9,F:7}, heavy:{S:18,A:16,B:14,C:12,F:9},
                homing:{S:17,A:15,B:13,C:11,F:8}, boomerang:{S:22,A:20,B:17,C:14,F:10},
                standard:{S:22,A:20,B:17,C:14,F:10}
            };
            const tierSpeed={S:1.08,A:1.04,B:1,C:.90,F:.78}[tier]||1;
            const raw=Number(ability.pSpeed||0),conceptSpeed=speeds[style][tier];
            let speed=raw>0?Math.max(conceptSpeed*.82,raw*tierSpeed):conceptSpeed;
            if(style==='bomber'&&raw>0) speed=conceptSpeed*.58+raw*tierSpeed*.42;
            if(kind==='basic') speed*=style==='sniper'?.96:style==='bomber'?.92:.90;
            let range=ranges[style][tier]*(kind==='basic'?(style==='sniper'?.94:.88):1);
            // Shared range/tempo budget; brBasicCombatProfile adds each character’s projectile identity.
            const count=1;
            const damageScale={sniper:1.36,machine:.82,bomber:1.08,heavy:1.16,homing:.96,boomerang:.94,standard:1}[style];
            const knockback={S:16,A:13,B:10,C:7,F:4}[tier]*(style==='bomber'?1.45:style==='heavy'?1.28:style==='sniper'?1.05:.72);
            const explodeRadius=style==='bomber'?({S:68,A:61,B:54,C:46,F:36}[tier]||46):0;
            const cooldownScale=style==='sniper'?1.28:style==='bomber'?1.24:style==='machine'?.74:style==='heavy'?1.14:1;
            return {style,range:Math.round(range),speed:Math.max(4,speed),count,damageScale,knockback,explodeRadius,cooldownScale};
        };

__brScope.getIdentityProjectileEmoji = function getIdentityProjectileEmoji(ability={}) {
            return ability.projEmoji||({GIANT_FIREBALL:'🔥',ARCANE_BARRAGE:'🔮',NOVA:'🌟',ICE_SHARD:'🧊',RAPID_BOW:'🏹',SNIPE:'🎯',GHOST_MOVE:'👻',STING:'🐝',CRACKER:'🧨',SODA_BOMB:'🥤',POWDER_BARRAGE:'💥',AIMED_SHOT:'📐',TOXIC_INJECTION:'💉',BOOMERANG:'🪃'})[ability.sub]||ability.e||'•';
        };

__brScope.getPlayerSignatureProjectileProfile = function getPlayerSignatureProjectileProfile(ability={}) {
            const sub=ability.sub||'',base=__brScope.getRangedCombatProfile(ability,'skill');
            const p={count:Math.min(6,Number(ability.pCount||1)),speed:Number(ability.pSpeed||10),damage:Number(ability.pDmg||15),size:Number(ability.pSize||8),
                type:ability.projType||'bullet',spread:.2,explode:Number(ability.pExplode||0),emoji:__brScope.getIdentityProjectileEmoji(ability),range:base.range,
                pierce:!!ability.pierce,bounces:Number(ability.pBounce||0),spin:Number(ability.spinRate||0),face:!!ability.faceDir,
                status:ability.pStatus||null,statusPower:Number(ability.pStatusPower||0),push:Number(ability.knockback||3),style:base.style};
            if(sub==='GIANT_FIREBALL')Object.assign(p,{count:3,speed:9,damage:30,size:30,type:'bullet',explode:80});
            else if(sub==='ARCANE_BARRAGE')Object.assign(p,{count:6,speed:13.2,damage:8.8,size:9,spread:.085,push:2.5});
            else if(sub==='NOVA')Object.assign(p,{count:6,speed:12,damage:18,size:15,spread:Math.PI/3,pierce:true,spin:.2});
            else if(sub==='ICE_SHARD')Object.assign(p,{count:3,type:'ICE_SHARD',face:true});
            else if(sub==='RAPID_BOW')p.count=3;
            else if(sub==='CRACKER')Object.assign(p,{count:2,speed:11.5,damage:14,size:13,explode:48,spread:.13,push:11});
            else if(sub==='STING')Object.assign(p,{count:5,speed:17,damage:7.2,size:6,spread:.15,push:1.5,status:'poison',statusPower:96});
            else if(sub==='SODA_BOMB')Object.assign(p,{count:3,speed:13,damage:10.5,size:17,explode:62,spread:.14,push:18});
            else if(sub==='POWDER_BARRAGE')Object.assign(p,{count:5,speed:15,damage:10,size:12,explode:44,spread:.15,push:12});
            else if(sub==='AIMED_SHOT')Object.assign(p,{count:1,speed:32,damage:34,size:9,spread:0,pierce:true,face:true,push:14});
            else if(sub==='TOXIC_INJECTION')Object.assign(p,{count:2,speed:18,damage:11,size:12,spread:.09,status:'poison',statusPower:150,push:5,face:true});
            else if(sub==='BOOMERANG')p.type='BOOMERANG';
            // Four low-rank skills keep their damage budget and gain a readable
            // signature. These changes apply only to the skill, never the basic.
            if(ability.id==='emoji-094')Object.assign(p,{status:'stun',statusPower:10});
            else if(ability.id==='emoji-096')Object.assign(p,{status:'stun',statusPower:12});
            else if(ability.id==='emoji-056')Object.assign(p,{status:'stun',statusPower:24});
            else if(ability.id==='emoji-126')p.spread=.055;
            if(base.style==='sniper'||base.style==='machine')p.speed=Math.max(p.speed,base.speed);
            else if(base.style==='bomber')p.speed=Math.min(p.speed,base.speed);
            else if(!['NOVA','ICE_SHARD','RAPID_BOW','TOXIC_INJECTION'].includes(sub))p.speed=base.speed;
            if(['bomber','heavy','sniper'].includes(base.style))p.push=Math.max(p.push,base.knockback);
            if(__brScope.BR_V32_NATIVE_SKILLS.has(ability.id))Object.assign(p,__brScope.BR_V32_SKILL_FIELDS[ability.id]);
            return p;
        };

__brScope.getSkillCooldownMultiplier = function getSkillCooldownMultiplier(ability={}) {
            const tierMult={S:1.72,A:1.58,B:1.43,C:1.30,F:1.18}[ability.t]||1.38;
            const style=__brScope.getRangedWeaponStyle(ability);
            let concept=style==='bomber'?1.10:style==='machine'?1.07:style==='sniper'?1.06:1;
            if(ability.type===__brScope.ABILITY_TYPES.TELEPORT||ability.type===__brScope.ABILITY_TYPES.DASH) concept*=1.07;
            if(ability.type===__brScope.ABILITY_TYPES.AREA||ability.type===__brScope.ABILITY_TYPES.ZONE) concept*=1.06;
            return tierMult*concept;
        };

__brScope.isTrailDashAbility = function isTrailDashAbility(ability) {
            return !!ability && ability.type === __brScope.ABILITY_TYPES.DASH && __brScope.TRAIL_DASH_SUBS.has(ability.sub);
        };

__brScope.brCanHostileTarget = function brCanHostileTarget(target,source) {
            if(!target||target.alive===false||target===source)return false;
            if(Number(target.spawnProtectionUntilFrame||0)>Number(__brScope.game?.frame||0))return false;
            return !(source&&source.team>0&&Number(source.team)===Number(target.team));
        };

__brScope.brReworkDefinition = function brReworkDefinition(ability){return ability&&__brScope.BR_REWORK_DEFS&&__brScope.BR_REWORK_DEFS[ability.id]||null;};

__brScope.brCharacterStatType = function brCharacterStatType(ability){return __brScope.brReworkDefinition(ability)?.statType||ability?.type;};

__brScope.brAbilityCategory = function brAbilityCategory(ability){var d=__brScope.brReworkDefinition(ability);return d?.category||d?.role||ability?.category||'기타';};

__brScope.isTeamSupportAbility = function isTeamSupportAbility(ability) {
            return !!ability && ability.teamOnly === true && __brScope.TEAM_SUPPORT_SUBS.has(ability.sub);
        };

__brScope.isTankAbility = function isTankAbility(ability) { const d=__brScope.brReworkDefinition(ability);return !!ability && (d&&typeof d.tankRole==='boolean'?d.tankRole:ability.tankRole===true); };

__brScope.brValidRunLevel = function brValidRunLevel(value){return Number.isInteger(value)&&value>=1&&value<=__brScope.BR_RUN_MAX_LEVEL?value:0;};

__brScope.isEliteRangedAbility = function isEliteRangedAbility(ability) {
            const rangedTypes = new Set([
                __brScope.ABILITY_TYPES.PROJ, __brScope.ABILITY_TYPES.LASER, __brScope.ABILITY_TYPES.ZONE,
                __brScope.ABILITY_TYPES.TURRET, __brScope.ABILITY_TYPES.PULL
            ]);
            return (ability.t === 'S' || ability.t === 'A')
                && (rangedTypes.has(__brScope.brCharacterStatType(ability)) || (ability.sub === 'GHOST_MOVE'&&__brScope.brReworkDefinition(ability)?.basic?.close!==true));
        };

__brScope.isSmallRangedEliteAbility = function isSmallRangedEliteAbility(ability) {
            return __brScope.isEliteRangedAbility(ability) && (ability.sizeMult || 1.0) <= 1.35;
        };

__brScope.abilityTimingHash = function abilityTimingHash(name='') {
            let h = 2166136261 >>> 0;
            for(const ch of name) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
            return h >>> 0;
        };

__brScope.getAbilityTiming = function getAbilityTiming(ability) {
            const rework=__brScope.brReworkDefinition(ability);
            if(rework?.skill){const frames=Number(rework.skill.cooldownFrames??rework.skill.cooldown);if(Number.isFinite(frames)&&frames>0)return {cooldown:frames};}
            const type = ability.type;
            const tier = ability.t;
            const key = ability.sub || ability.timingSeed || ability.n;
            const h = __brScope.abilityTimingHash((ability.timingSeed||ability.n) + ':' + key);
            const v = (h % 1000) / 1000;

            const baseCd = {
                MELEE:92, ORBIT:360, PROJ:132, DASH:138, TELEPORT:165,
                PULL:180, AREA:185, BUFF:190, ZONE:195, TURRET:215, LASER:155, CLONE:210
            }[type] || 145;
            const tierCdMult = {S:1.00, A:1.00, B:1.06, C:1.10, F:1.18}[tier] || 1.0;

            let timing = {
                cooldown: Math.round(baseCd * tierCdMult * (0.88 + v * 0.28))
            };

            const overrides = {
                GIANT_FIREBALL:{cooldown:155},
                THUNDER:{cooldown:148},
                ABDUCT:{cooldown:205},
                ARCANE_BARRAGE:{cooldown:145},
                VOID_ASSASSIN:{cooldown:158},
                LAVA_POOL:{cooldown:170},
                SWORD_ORBIT:{cooldown:390},
                NUKE_DEATH:{cooldown:158},
                GHOST_MOVE:{cooldown:205},
                STINK:{cooldown:150},
                GRAVITY_WELL:{cooldown:195},
                THUNDER_DASH:{cooldown:132},
                LIGHTNING_DASH:{cooldown:142},
                CAR_RUSH:{cooldown:150},
                BOAR_CHARGE:{cooldown:158},
                GOLDEN_TURRET:{cooldown:205},
                VAMPIRE_SLASH:{cooldown:100},
                SPREADING_POISON:{cooldown:140},
                EXPLOSIVE_DASH:{cooldown:160},
                DIVE_LAVA:{cooldown:220},
                TURRET_TRAIL:{cooldown:255},
                NOVA:{cooldown:175},
                GEAR_ORBIT:{cooldown:410},
                TORNADO_ORBIT:{cooldown:365},
                BOOMERANG:{cooldown:105},
                HEAVY_PUNCH:{cooldown:175},
                HAMMER:{cooldown:240},
                REGEN:{cooldown:185},
                BACKSTAB:{cooldown:135},
                FLY_DASH:{cooldown:150},
                MULTI_GRAB:{cooldown:165},
                POISON_TRAIL:{cooldown:128},
                ICE_TRAIL:{cooldown:145},
                BANANA_TRAIL:{cooldown:158},
                BOMB_TRAIL:{cooldown:168},
                INK_TRAIL:{cooldown:148},
                TEAM_SANCTUARY:{cooldown:215},
                TEAM_MEDIC:{cooldown:178},
                TEAM_BLOOM:{cooldown:188},
                TEAM_HASTE_A:{cooldown:185},
                TEAM_GUARD:{cooldown:188},
                TEAM_TONIC:{cooldown:190},
                TEAM_BARRIER:{cooldown:192},
                TEAM_RALLY:{cooldown:165},
                TEAM_CLOVER:{cooldown:185},
                TEAM_BUGLE:{cooldown:175},
                TEAM_BELL:{cooldown:180},
                TEAM_BANDAGE:{cooldown:235},
                SCISSOR_DASH:{cooldown:150},
                VOID_DESTRUCTION:{cooldown:205},
                SOUL_CLEAVE:{cooldown:165},
                ROLLING_BLADE:{cooldown:290},
                POWDER_BARRAGE:{cooldown:155},
                KINETIC_CHARGE:{cooldown:170},
                AIMED_SHOT:{cooldown:180},
                TOXIC_INJECTION:{cooldown:175}
            };
            if(overrides[key]) timing = {...timing, ...overrides[key]};
            // 기존 DB에 명시된 customCooldown도 존중하되, 고유 타이밍 override가 있으면 override가 우선한다.
            if(ability.customCooldown && !overrides[key]) timing.cooldown = ability.customCooldown;
            timing.cooldown = Math.round(timing.cooldown * __brScope.getSkillCooldownMultiplier(ability));
            return timing;
        };

__brScope.updateHUD = function updateHUD(){};

__brScope.compareSurvivalOrder = function compareSurvivalOrder(a,b) {
            if(!!a.alive!==!!b.alive)return a.alive?-1:1;
            if(a.alive&&b.alive)return Number(b.survivalFrames||0)-Number(a.survivalFrames||0)||String(a.remoteId??a.id).localeCompare(String(b.remoteId??b.id));
            const aSeq=Number(a.eliminationSeq||0),bSeq=Number(b.eliminationSeq||0);
            if(aSeq!==bSeq)return bSeq-aSeq;
            const ad=Number(a.deathFrame??a.survivalFrames??0),bd=Number(b.deathFrame??b.survivalFrames??0);
            return bd-ad||String(a.remoteId??a.id).localeCompare(String(b.remoteId??b.id));
        };

__brScope.brSkillReachFraction = function brSkillReachFraction(power){return .18+.82*Math.max(.18,Math.min(1,Number(power??1)||1));};

__brScope.brSkillUsesAimDistance = function brSkillUsesAimDistance(skill){
            if(!skill)return false;
            const caps=skill.capabilities||skill.caps||{};
            return skill.shape==='target'||skill.shape==='dash'||(skill.shape==='rect'&&!!caps.dash)||
                (['line','cone'].includes(skill.shape)&&(!!caps.projectile||skill.kind==='pin-traps'||['hook','channel','channel-beam','continuous-laser'].includes(skill.kind)));
        };

__brScope.brCloseBalance = function brCloseBalance(a,close){return close&&a.id!=='emoji-054'?__brScope.BR_CLOSE_BALANCE[a.t]||null:null;};

__brScope.brCloseBaseHp = function brCloseBaseHp(a,hp){const b=__brScope.brCloseBalance(a,__brScope.brProgressionCombat?.basicProfile(a)?.close);return b&&hp<b.cap?Math.min(b.cap,hp*b.hp):hp;};

__brScope.brTrainDistance = function brTrainDistance(power=1,rangeScale=1,request){
            const max=__brScope.BR_TRAIN_DISTANCE.max*Math.max(0,Number(rangeScale)||1);
            return Number.isFinite(request)?Math.max(80,Math.min(max,request)):80+(max-80)*Math.max(0,Math.min(1,(Number(power)-.18)/.82));
        };

__brScope.brClipTrainTravel = function brClipTrainTravel(from,dir,range,radius,worldRadius,center,walls){
            if(__brScope.brArenaRect()){const distance=__brScope.brArenaRay(null,from,dir,range,radius+4),m=__brScope.combatMoveCircle(from,{x:dir.x*distance,y:dir.y*distance},radius,walls||[],true);return {x:m.x,y:m.y,range:Math.min(distance,Math.hypot(m.x-from.x,m.y-from.y)),reason:m.hit?'wall':distance<range?'boundary':null};}
            const cx=Number(center?.x||0),cy=Number(center?.y||0),x=from.x-cx,y=from.y-cy;
            const edge=Math.max(1,worldRadius-radius-4),dot=x*dir.x+y*dir.y,disc=dot*dot+edge*edge-x*x-y*y;
            const boundary=disc>=0?Math.max(0,-dot+Math.sqrt(disc)):0,distance=Math.max(0,Math.min(range,boundary));
            const moved=__brScope.combatMoveCircle(from,{x:dir.x*distance,y:dir.y*distance},radius,walls||[],true);
            return {x:moved.x,y:moved.y,range:Math.max(0,Math.min(distance,Math.hypot(moved.x-from.x,moved.y-from.y))),reason:moved.hit?'wall':boundary<range?'boundary':null};
        };
}
export const initializers=[
[20,__brScope=>{ __brScope.ABILITY_TYPES = {
            MELEE: 'MELEE', PROJ: 'PROJ', LASER: 'LASER', AREA: 'AREA', ZONE: 'ZONE', 
            DASH: 'DASH', PULL: 'PULL', TURRET: 'TURRET', CLONE: 'CLONE', BUFF: 'BUFF', 
            TELEPORT: 'TELEPORT', ORBIT: 'ORBIT'
        };;}],
[21,__brScope=>{ __brScope.TRAIL_DASH_SUBS = new Set(['POISON_TRAIL','ICE_TRAIL','BOMB_TRAIL','INK_TRAIL','BANANA_TRAIL']);;}],
[22,__brScope=>{ __brScope.IMPACT_CHARGE_SUBS = new Set(['THUNDER_DASH','LIGHTNING_DASH','CAR_RUSH','BOAR_CHARGE','KINETIC_CHARGE']);;}],
[23,__brScope=>{ __brScope.DIRECT_ASSAULT_DASH_SUBS = new Set([
            'THUNDER_DASH','LIGHTNING_DASH','CAR_RUSH','BOAR_CHARGE',
            'BULLDOZER_DASH','EXPLOSIVE_DASH','FLY_DASH','KINETIC_CHARGE'
        ]);;}],
[24,__brScope=>{ __brScope.ASSASSIN_TELEPORT_SUBS = new Set(['BACKSTAB','VOID_ASSASSIN','THUNDER']);;}],
[25,__brScope=>{ __brScope.RANGED_SNIPER_SUBS = new Set(['SNIPE','AIMED_SHOT','VOID_DESTRUCTION']);;}],
[26,__brScope=>{ __brScope.RANGED_MACHINE_SUBS = new Set(['ARCANE_BARRAGE','STING','RAPID_BOW']);;}],
[27,__brScope=>{ __brScope.RANGED_BOMBER_SUBS = new Set(['GIANT_FIREBALL','CRACKER','SODA_BOMB','POWDER_BARRAGE']);;}],
[31,__brScope=>{ __brScope.BR_V32_SKILL_FIELDS=Object.freeze({"emoji-000":{"damage":79.8,"zoneDamage":8.4,"speed":10.8},"emoji-003":{"damage":11.55,"speed":31.5,"finalDamage":17.85},"emoji-007":{"damage":86.1,"zoneDamage":7.35},"emoji-010":{"damage":8.24,"collapseDamage":63.86},"emoji-012":{"damage":15.45,"heavyDamage":27.81},"emoji-014":{"damage":10.3},"emoji-020":{"damage":25.2,"speed":19.95},"emoji-022":{"damage":44.1,"width":43.68},"emoji-085":{"damage":27.81},"emoji-132":{"damage":8.736,"range":1393.6},"emoji-023":{"damage":80.56,"radius":7.28,"width":14.56},"emoji-036":{"damage":19.57},"emoji-063":{"damage":18.9,"speed":19.95},"emoji-066":{"damage":26.25,"radius":24.96},"emoji-087":{"damage":23.32,"radius":10.4},"emoji-039":{"damage":30.45,"centerDamage":49.35,"range":777.0},"emoji-041":{"damage":7.56,"speed":19.95},"emoji-045":{"damage":28.35,"radius":15.6},"emoji-047":{"damage":31.5,"speed":24.15},"emoji-072":{"damage":19.95,"speed":16.2},"emoji-089":{"damage":43.26},"emoji-137":{"damage":36.04,"size":9.36},"emoji-074":{"damage":25.44,"radius":13.52},"emoji-075":{"damage":22.05,"radius":20.8,"fragmentDamage":13.65,"fragmentRadius":11.44},"emoji-077":{"damage":22.05,"radius":28.08},"emoji-094":{"damage":3.15,"speed":16.8},"emoji-122":{"damage":11.55,"thornDamage":3.99,"speed":16.2},"emoji-126":{"damage":15.75,"range":630.0},"emoji-056":{"damage":10.3}});;}],
[32,__brScope=>{ __brScope.BR_V32_NATIVE_SKILLS=new Set(["emoji-041", "emoji-137", "emoji-094"]);;}],
[33,__brScope=>{ __brScope.BR_RUN_MAX_LEVEL=6, __brScope.BR_RUN_MAX_CHOICES=__brScope.BR_RUN_MAX_LEVEL-1, __brScope.BR_RUN_PATH_MAX_TIER=3, __brScope.BR_DEATH_XP_CAP=6;;}],
[37,__brScope=>{ __brScope.BR_ROSTER_VERSION='emoji77-v29-wanggui';;}],
[39,__brScope=>{ __brScope.BR_TEAM_KILL_RULES = __brScope.BR_TEAM_KILL_RULES = Object.freeze({
            hpMultiplier:.50, arenaScale:.60, protectionFrames:108,
            boxRespawnFrames:2100, tokenCap:2, quizNeeded:3, wrongLockMs:1200
        });;}],
[46,__brScope=>{ __brScope.BR_ARENA_SCALE = 1.2;;}],
[47,__brScope=>{ __brScope.BR_WORLD_RADIUS = 2800 * __brScope.BR_ARENA_SCALE;;}],
[48,__brScope=>{ __brScope.EMOJI_DB = [
            {"t":"S","e":"🐲","n":"용리온","type":"PROJ","desc":"큰 불덩이로 진입로를 막는 용 포격수","sub":"GIANT_FIREBALL","sizeMult":2.8,"id":"emoji-000","legacyIndex":0,"timingSeed":"용의 분노","category":"원거리형","concept":"큰 불덩이로 진입로를 막는 용 포격수","basicSummary":"작은 폭발 화염구","skillSummary":"세 갈래 거대 화염구 폭발"},
            {"t":"S","e":"⚡","n":"번개넨","type":"TELEPORT","desc":"착지 지점을 골라 번개를 터뜨리는 기습자","sub":"THUNDER","sizeMult":2,"id":"emoji-001","legacyIndex":1,"timingSeed":"천둥군주","category":"암살자","concept":"착지 지점을 골라 번개를 터뜨리는 기습자","basicSummary":"번개 근접 타격","skillSummary":"조준 지점 순간이동과 낙뢰"},
            {"t":"S","e":"🛸","n":"블리츠UFO","type":"PULL","desc":"정확한 납치로 적을 내 앞으로 옮긴다","sub":"ABDUCT","sizeMult":2.5,"id":"emoji-002","legacyIndex":2,"timingSeed":"우주 납치범","category":"근접형","concept":"정확한 납치로 적을 내 앞으로 옮긴다","basicSummary":"전방 근접 타격","skillSummary":"빔에 맞은 적 납치와 짧은 기절"},
            {"t":"S","e":"🧙‍♂️","n":"라이즈업","type":"PROJ","desc":"마력탄 탄막으로 좁은 길을 봉쇄한다","sub":"ARCANE_BARRAGE","sizeMult":1.85,"pTrail":"#c084fc","pImpact":"#e879f9","id":"emoji-003","legacyIndex":3,"timingSeed":"대마법사","category":"원거리형","concept":"마력탄 탄막으로 좁은 길을 봉쇄한다","basicSummary":"빠른 마력탄","skillSummary":"여섯 발의 좁은 마력 탄막"},
            {"t":"S","e":"🥷","n":"닌자딘","type":"TELEPORT","desc":"순간이동으로 약해진 적을 마무리한다","sub":"VOID_ASSASSIN","sizeMult":1.45,"id":"emoji-004","legacyIndex":4,"timingSeed":"공허 암살자","category":"암살자","concept":"순간이동으로 약해진 적을 마무리한다","basicSummary":"빠른 단도 베기","skillSummary":"착지 범위 암살과 저체력 추가 피해"},
            {"t":"S","e":"⚔️","n":"마스터검","type":"ORBIT","desc":"회전 검 사이로 파고드는 연속 참격 검사","sub":"SWORD_ORBIT","sizeMult":1.8,"id":"emoji-006","legacyIndex":6,"timingSeed":"검성","category":"근접형","concept":"회전 검 사이로 파고드는 연속 참격 검사","basicSummary":"짧은 검격","skillSummary":"회전 검 전개와 가까운 적 연격"},
            {"t":"S","e":"☢️","n":"핵직스","type":"AREA","desc":"자신을 중심으로 위험 구역을 만드는 방사능 투사","sub":"NUKE_DEATH","sizeMult":1.8,"id":"emoji-007","legacyIndex":7,"timingSeed":"폴아웃","category":"원거리형","concept":"자신을 중심으로 위험 구역을 만드는 방사능 투사","basicSummary":"방사능 탄","skillSummary":"주변 충격파와 짧은 오염 지대"},
            {"t":"S","e":"👻","n":"유령샤","type":"BUFF","desc":"벽을 통과하며 기습 각도를 만드는 유령","sub":"GHOST_MOVE","sizeMult":1.5,"id":"emoji-008","legacyIndex":8,"timingSeed":"폴터가이스트","category":"원거리형","concept":"벽을 통과하며 기습 각도를 만드는 유령","basicSummary":"유도 영혼탄","skillSummary":"짧은 은신과 영혼탄 발사"},
            {"t":"S","e":"🪐","n":"블랙가스","type":"ZONE","desc":"중력장을 놓아 적의 동선을 끌어 모은다","sub":"GRAVITY_WELL","sizeMult":2.6,"id":"emoji-010","legacyIndex":10,"timingSeed":"블랙홀","category":"설치형","concept":"중력장을 놓아 적의 동선을 끌어 모은다","basicSummary":"행성 탄","skillSummary":"조준 지점의 중력장과 마지막 폭발"},
            {"t":"S","e":"🧞","n":"지니머딩","type":"TURRET","desc":"포탑 옆에서 전선을 만드는 설치 전문가","sub":"GOLDEN_TURRET","sizeMult":2,"id":"emoji-012","legacyIndex":12,"timingSeed":"지니","category":"설치형","concept":"포탑 옆에서 전선을 만드는 설치 전문가","basicSummary":"지니 사격","skillSummary":"한 개의 황금 포탑 설치"},
            {"t":"S","e":"🩸","n":"블라드링","type":"MELEE","desc":"붙어서 피를 빼앗고 위기에서 연격한다","sub":"VAMPIRE_SLASH","sizeMult":2.12,"tankRole":true,"legacyTank":true,"id":"emoji-013","legacyIndex":13,"timingSeed":"블러드로드","category":"탱커","concept":"붙어서 피를 빼앗고 위기에서 연격한다","basicSummary":"흡혈하는 피의 베기","skillSummary":"흡혈 베기와 저체력 연격"},
            {"t":"S","e":"🦠","n":"신지독","type":"ZONE","desc":"퍼지는 독구름으로 공간을 빼앗는다","sub":"SPREADING_POISON","sizeMult":1.8,"id":"emoji-014","legacyIndex":14,"timingSeed":"역병군주","category":"설치형","concept":"퍼지는 독구름으로 공간을 빼앗는다","basicSummary":"독성 구체","skillSummary":"천천히 커지는 독 장판 한 개"},
            {"t":"S","e":"🚂","n":"레일사이온","type":"PROJ","desc":"거대한 기차로 일렬의 적을 관통한다","projEmoji":"🚂","pSize":45,"pSpeed":18,"pDmg":35,"pBounce":3,"pierce":true,"faceDir":true,"sizeMult":1.8,"customCooldown":210,"id":"emoji-019","legacyIndex":19,"timingSeed":"폭주기관차","category":"원거리형","concept":"거대한 기차로 일렬의 적을 관통한다","basicSummary":"반사·관통 기차","skillSummary":"벽을 튕기며 관통하는 기차"},
            {"t":"S","e":"🌟","n":"스타럭스","type":"PROJ","desc":"별을 전방위로 뿌려 포위를 뚫는다","sub":"NOVA","sizeMult":1.5,"customCooldown":150,"id":"emoji-020","legacyIndex":20,"timingSeed":"초신성","category":"원거리형","concept":"별을 전방위로 뿌려 포위를 뚫는다","basicSummary":"별 탄","skillSummary":"여섯 방향의 관통 별"},
            {"t":"S","e":"🪀","n":"요요리","type":"PROJ","desc":"나가는 길과 돌아오는 길을 모두 맞힌다","sub":"BOOMERANG","projEmoji":"🪀","pSize":18,"pSpeed":25,"pDmg":15,"spinRate":0.5,"knockback":25,"sizeMult":1.1,"id":"emoji-022","legacyIndex":22,"timingSeed":"요요 마스터","category":"원거리형","concept":"나가는 길과 돌아오는 길을 모두 맞힌다","basicSummary":"왕복 요요","skillSummary":"빠른 요요로 밀어내기"},
            {"t":"S","e":"🚑","n":"문도카","type":"BUFF","desc":"재생으로 버티며 다음 교전을 준비한다","sub":"REGEN","sizeMult":1,"id":"emoji-037","legacyIndex":37,"timingSeed":"힐링 팩터","category":"원거리형","concept":"재생으로 버티며 다음 교전을 준비한다","basicSummary":"구급차 투척","skillSummary":"즉시 자가 회복과 기절 완화"},
            {"t":"S","e":"🧿","n":"눈코즈","type":"PROJ","desc":"눈알을 추적시켜 적의 발을 묶는다","projEmoji":"🧿","projType":"missile","pCount":4,"pSize":17,"pSpeed":12,"pDmg":16,"pStatus":"stun","pStatusPower":20,"spinRate":0.22,"pTrail":"#818cf8","pImpact":"#ddd6fe","sizeMult":1.35,"customCooldown":165,"id":"emoji-085","legacyIndex":85,"timingSeed":"심연의 눈","category":"원거리형","concept":"눈알을 추적시켜 적의 발을 묶는다","basicSummary":"마안 유도탄","skillSummary":"짧은 경직을 주는 유도 마안"},
            {"t":"S","e":"👼","n":"엔젤카","type":"BUFF","desc":"아군이 모인 순간 성역으로 전열을 지킨다","sub":"TEAM_SANCTUARY","sizeMult":1.15,"teamOnly":true,"id":"emoji-098","legacyIndex":98,"timingSeed":"성역술사","category":"지원가","concept":"아군이 모인 순간 성역으로 전열을 지킨다","basicSummary":"천사 사격","skillSummary":"주변 아군 회복과 짧은 수호"},
            {"t":"S","e":"🦏","n":"코뿔파이트","type":"MELEE","desc":"몸통 돌진 뒤 철갑으로 버티는 탱커","sub":"TANK_RHINO","sizeMult":1.72,"tankRole":true,"id":"emoji-110","legacyIndex":110,"timingSeed":"철갑 코뿔소","category":"탱커","concept":"몸통 돌진 뒤 철갑으로 버티는 탱커","basicSummary":"묵직한 뿔 타격","skillSummary":"충돌 진입과 짧은 방어"},
            {"t":"S","e":"✂️","n":"가위웬","type":"MELEE","desc":"붙은 상대에게 연속 가위질을 퍼붓는다","sub":"SCISSOR_DASH","sizeMult":1.34,"id":"emoji-131","legacyIndex":131,"timingSeed":"가위 수호자","category":"근접형","concept":"붙은 상대에게 연속 가위질을 퍼붓는다","basicSummary":"빠른 가위 베기 · 적중 후 짧은 추격 가속","skillSummary":"첫 베기 뒤 두 번의 추가 가위질"},
            {"t":"S","e":"🌌","n":"공허빔","type":"LASER","desc":"일직선 광선으로 관통하고 체력을 회수한다","sub":"VOID_DESTRUCTION","sizeMult":1.52,"id":"emoji-132","legacyIndex":132,"timingSeed":"공허 파괴자","category":"원거리형","concept":"일직선 광선으로 관통하고 체력을 회수한다","basicSummary":"가느다란 공허탄","skillSummary":"넓은 관통 광선과 적중 회복"},
            {"t":"A","e":"🔫","n":"케이틀빵","type":"PROJ","desc":"멀리서 정확한 한 발을 노리는 저격수","sub":"SNIPE","sizeMult":1.2,"id":"emoji-023","legacyIndex":23,"timingSeed":"헤드슈터","category":"원거리형","concept":"멀리서 정확한 한 발을 노리는 저격수","basicSummary":"빠른 단발 저격탄","skillSummary":"길고 정밀한 단일 저격"},
            {"t":"A","e":"🌪️","n":"윈드오","type":"ORBIT","desc":"회오리 안으로 적을 당겨 붙잡는다","sub":"TORNADO_ORBIT","sizeMult":1.3,"id":"emoji-024","legacyIndex":24,"timingSeed":"윈드워커","category":"근접형","concept":"회오리 안으로 적을 당겨 붙잡는다","basicSummary":"바람 근접 베기","skillSummary":"회전 회오리와 가까운 적 끌기"},
            {"t":"A","e":"🥊","n":"펀치셋","type":"MELEE","desc":"한 방으로 적을 멀리 날리는 격투가","sub":"HEAVY_PUNCH","sizeMult":1.4,"id":"emoji-025","legacyIndex":25,"timingSeed":"핵주먹","category":"근접형","concept":"한 방으로 적을 멀리 날리는 격투가","basicSummary":"짧고 무거운 펀치","skillSummary":"어퍼컷과 강한 밀침"},
            {"t":"A","e":"❄️","n":"얼음쉬","type":"PROJ","desc":"얼음 부채꼴로 이동 경로를 좁힌다","sub":"ICE_SHARD","sizeMult":1.3,"id":"emoji-026","legacyIndex":26,"timingSeed":"아이스킹","category":"원거리형","concept":"얼음 부채꼴로 이동 경로를 좁힌다","basicSummary":"얼음 조각","skillSummary":"세 갈래 얼음 송곳과 짧은 빙결"},
            {"t":"A","e":"🏎️","n":"드리프트","type":"DASH","desc":"긴 직선 주행으로 진입과 이탈을 고른다","sub":"CAR_RUSH","sizeMult":1.5,"dashSpeed":46,"dashDuration":19,"id":"emoji-027","legacyIndex":27,"timingSeed":"로드킬","category":"기동형","concept":"긴 직선 주행으로 진입과 이탈을 고른다","basicSummary":"차체 근접 타격","skillSummary":"조준한 방향의 고속 돌진"},
            {"t":"A","e":"🛡️","n":"브라움벽","type":"BUFF","desc":"상대 공격을 받아내며 반격 각도를 만든다","sub":"REFLECT","sizeMult":1.7,"tankRole":true,"legacyTank":true,"id":"emoji-028","legacyIndex":28,"timingSeed":"아이언월","category":"탱커","concept":"상대 공격을 받아내며 반격 각도를 만든다","basicSummary":"방패 근접 타격","skillSummary":"2초간 방어하며 피해 반격"},
            {"t":"A","e":"🦅","n":"퀸글","type":"DASH","desc":"벽을 넘어 착지하며 압박하는 비행가","sub":"FLY_DASH","sizeMult":1.8,"dashSpeed":38,"dashDuration":22,"id":"emoji-029","legacyIndex":29,"timingSeed":"스카이 하이","category":"기동형","concept":"벽을 넘어 착지하며 압박하는 비행가","basicSummary":"날개 근접 타격","skillSummary":"비행 이동과 착지 충격"},
            {"t":"A","e":"🦑","n":"촉수크랭","type":"PULL","desc":"촉수로 상대를 당겨 거리를 지운다","sub":"MULTI_GRAB","sizeMult":1.5,"id":"emoji-030","legacyIndex":30,"timingSeed":"크라켄","category":"근접형","concept":"촉수로 상대를 당겨 거리를 지운다","basicSummary":"촉수 근접 타격","skillSummary":"전방의 최대 세 명을 끌어당겨 기절"},
            {"t":"A","e":"🦨","n":"스컹지드","type":"DASH","desc":"적 옆을 스쳐 독길로 추격을 막는다","sub":"POISON_TRAIL","sizeMult":1.2,"dashSpeed":33,"dashDuration":27,"id":"emoji-031","legacyIndex":31,"timingSeed":"스컹크 대쉬","category":"기동형","concept":"적 옆을 스쳐 독길로 추격을 막는다","basicSummary":"꼬리 근접 타격","skillSummary":"돌진 경로의 독 흔적"},
            {"t":"A","e":"🚜","n":"불도사이온","type":"DASH","desc":"돌진으로 전열을 밀어내는 공성 탱커","sub":"BULLDOZER_DASH","sizeMult":1.6,"dashSpeed":20,"dashDuration":30,"tankRole":true,"legacyTank":true,"id":"emoji-033","legacyIndex":33,"timingSeed":"불도저","category":"탱커","concept":"돌진으로 전열을 밀어내는 공성 탱커","basicSummary":"무거운 차체 타격","skillSummary":"바위와 충격을 남기는 직선 돌진"},
            {"t":"A","e":"🎳","n":"리코볼","type":"PROJ","desc":"벽을 계산해 돌아오는 볼링공을 맞힌다","projEmoji":"🎳","pSize":22,"pSpeed":16,"pDmg":20,"pBounce":5,"spinRate":0.15,"sizeMult":1.1,"id":"emoji-034","legacyIndex":34,"timingSeed":"볼링 챔피언","category":"원거리형","concept":"벽을 계산해 돌아오는 볼링공을 맞힌다","basicSummary":"벽에 튕기는 볼링공","skillSummary":"여러 번 튕기는 큰 볼링공"},
            {"t":"A","e":"🪚","n":"톱니언","type":"PROJ","desc":"관통하는 톱으로 뒤쪽 적까지 긁는다","projEmoji":"🪚","pSize":20,"pSpeed":14,"pDmg":18,"pierce":true,"spinRate":0.3,"sizeMult":1.2,"id":"emoji-035","legacyIndex":35,"timingSeed":"전기톱 투척","category":"원거리형","concept":"관통하는 톱으로 뒤쪽 적까지 긁는다","basicSummary":"관통 톱날","skillSummary":"회전 전기톱 관통"},
            {"t":"A","e":"🦇","n":"박쥐모트","type":"PROJ","desc":"박쥐 무리로 움직이는 적을 추적한다","projType":"missile","projEmoji":"🦇","pCount":3,"pSize":15,"pSpeed":10,"pDmg":15,"faceDir":true,"sizeMult":1.1,"id":"emoji-036","legacyIndex":36,"timingSeed":"뱀파이어 떼","category":"원거리형","concept":"박쥐 무리로 움직이는 적을 추적한다","basicSummary":"박쥐 유도탄","skillSummary":"세 마리의 유도 박쥐"},
            {"t":"A","e":"🍔","n":"버거그브","type":"PROJ","desc":"가까운 적에게 두꺼운 산탄을 모아 맞힌다","projEmoji":"🍔","pCount":3,"pSize":20,"pSpeed":15,"pDmg":19,"knockback":16,"spinRate":0.18,"pTrail":"#f59e0b","pImpact":"#fde68a","sizeMult":1.15,"id":"emoji-063","legacyIndex":63,"timingSeed":"버거 캐논","category":"원거리형","concept":"가까운 적에게 두꺼운 산탄을 모아 맞힌다","basicSummary":"넓게 퍼지는 버거 탄","skillSummary":"세 개의 버거 집중 포격"},
            {"t":"A","e":"🪃","n":"부메시비","type":"PROJ","desc":"두 개의 부메랑 복귀 경로를 겹친다","projEmoji":"🪃","projType":"BOOMERANG","pCount":2,"pSize":18,"pSpeed":18,"pDmg":15,"spinRate":0.45,"knockback":10,"pTrail":"#c084fc","pImpact":"#e9d5ff","sizeMult":1.1,"id":"emoji-066","legacyIndex":66,"timingSeed":"프로 부메랑","category":"원거리형","concept":"두 개의 부메랑 복귀 경로를 겹친다","basicSummary":"왕복 부메랑","skillSummary":"두 개의 대형 왕복 부메랑"},
            {"t":"A","e":"🏹","n":"활조","type":"PROJ","desc":"빠른 화살을 좁게 모아 쏜다","projEmoji":"🏹","pCount":4,"pSize":13,"pSpeed":22,"pDmg":10,"faceDir":true,"pTrail":"#fbbf24","pImpact":"#fef3c7","sizeMult":1.05,"customCooldown":120,"id":"emoji-087","legacyIndex":87,"timingSeed":"사냥꾼","category":"원거리형","concept":"빠른 화살을 좁게 모아 쏜다","basicSummary":"빠른 화살","skillSummary":"좁은 부채꼴 화살 묶음"},
            {"t":"A","e":"🧑‍⚕️","n":"메딕카","type":"BUFF","desc":"가장 위험한 아군 한 명을 살린다","sub":"TEAM_MEDIC","sizeMult":1.05,"teamOnly":true,"id":"emoji-099","legacyIndex":99,"timingSeed":"전투 의무병","category":"지원가","concept":"가장 위험한 아군 한 명을 살린다","basicSummary":"의무병 사격","skillSummary":"저체력 아군 집중 회복"},
            {"t":"A","e":"🪄","n":"룰루팡","type":"BUFF","desc":"팀의 공격 기회를 앞당기는 가속 지원가","sub":"TEAM_HASTE_A","sizeMult":0.98,"teamOnly":true,"id":"emoji-101","legacyIndex":101,"timingSeed":"가속마도사","category":"지원가","concept":"팀의 공격 기회를 앞당기는 가속 지원가","basicSummary":"마법 지팡이 사격","skillSummary":"주변 아군의 공격·스킬 준비 가속"},
            {"t":"A","e":"🗡️","n":"영혼쉔","type":"MELEE","desc":"베기를 맞혀 보호를 얻고 버틴다","sub":"SOUL_CLEAVE","sizeMult":1.22,"id":"emoji-133","legacyIndex":133,"timingSeed":"영혼 검사","category":"근접형","concept":"베기를 맞혀 보호를 얻고 버틴다","basicSummary":"적중 시 짧게 보호받는 영혼 검격","skillSummary":"진입 베기와 적중 보호"},
            {"t":"B","e":"🔪","n":"탈론칼","type":"TELEPORT","desc":"짧게 사라져 약한 적을 처형한다","sub":"BACKSTAB","sizeMult":0.86,"id":"emoji-038","legacyIndex":38,"timingSeed":"암살자","category":"암살자","concept":"짧게 사라져 약한 적을 처형한다","basicSummary":"단도 근접 베기","skillSummary":"순간이동 기습과 마무리 피해"},
            {"t":"B","e":"🧨","n":"다이너쾅","type":"PROJ","desc":"쌍 폭탄으로 좁은 틈을 터뜨린다","sub":"CRACKER","sizeMult":0.9,"id":"emoji-039","legacyIndex":39,"timingSeed":"다이너마이트","category":"원거리형","concept":"쌍 폭탄으로 좁은 틈을 터뜨린다","basicSummary":"작은 폭탄","skillSummary":"나란히 던지는 두 다이너마이트"},
            {"t":"B","e":"🐗","n":"멧라이더","type":"DASH","desc":"멧돼지 돌진으로 첫 교전을 연다","sub":"BOAR_CHARGE","sizeMult":1.3,"dashSpeed":36,"dashDuration":19,"tankRole":true,"legacyTank":true,"id":"emoji-040","legacyIndex":40,"timingSeed":"성난 멧돼지","category":"탱커","concept":"멧돼지 돌진으로 첫 교전을 연다","basicSummary":"엄니 타격","skillSummary":"직선 충돌과 짧은 기절"},
            {"t":"B","e":"🐝","n":"벌티모","type":"PROJ","desc":"독침을 연속 적중해 체력을 갉는다","sub":"STING","sizeMult":0.6,"id":"emoji-041","legacyIndex":41,"timingSeed":"킬러비","category":"원거리형","concept":"독침을 연속 적중해 체력을 갉는다","basicSummary":"독침 사격","skillSummary":"좁은 독침 연사"},
            {"t":"B","e":"🔨","n":"뽀망치","type":"MELEE","desc":"망치 한 방으로 앞의 적을 멈추는 제어 탱커","sub":"HAMMER","sizeMult":1.2,"tankRole":true,"legacyTank":true,"id":"emoji-042","legacyIndex":42,"timingSeed":"뿅망치","category":"탱커","concept":"망치 한 방으로 앞의 적을 멈추는 제어 탱커","basicSummary":"짧은 기절을 주는 망치 타격","skillSummary":"전방 한 명을 강하게 밀치고 기절"},
            {"t":"B","e":"🚀","n":"점프타나","type":"DASH","desc":"출발과 착지의 폭발로 거리를 바꾼다","sub":"ROCKET_JUMP","sizeMult":1.2,"dashSpeed":30,"dashDuration":15,"id":"emoji-043","legacyIndex":43,"timingSeed":"로켓 점프","category":"기동형","concept":"출발과 착지의 폭발로 거리를 바꾼다","basicSummary":"로켓 근접 타격","skillSummary":"로켓 도약과 폭발"},
            {"t":"B","e":"🏂","n":"스노우누","type":"DASH","desc":"빙판을 가로질러 추격 속도를 늦춘다","sub":"ICE_TRAIL","sizeMult":1.1,"dashSpeed":31,"dashDuration":27,"id":"emoji-044","legacyIndex":44,"timingSeed":"스노우보더","category":"기동형","concept":"빙판을 가로질러 추격 속도를 늦춘다","basicSummary":"보드 근접 타격","skillSummary":"미끄러지는 빙판 경로"},
            {"t":"B","e":"🎾","n":"테니스코","type":"PROJ","desc":"두 개의 튀는 공으로 각도를 넓힌다","projEmoji":"🎾","pCount":2,"pSize":12,"pSpeed":18,"pDmg":12,"pBounce":3,"spinRate":0.2,"sizeMult":1,"id":"emoji-045","legacyIndex":45,"timingSeed":"테니스 챔피언","category":"원거리형","concept":"두 개의 튀는 공으로 각도를 넓힌다","basicSummary":"튕기는 테니스공","skillSummary":"두 공의 반사 사격"},
            {"t":"B","e":"⚽","n":"골리신","type":"PROJ","desc":"공 한 번으로 상대 위치를 크게 바꾼다","projEmoji":"⚽","pSize":18,"pSpeed":15,"pDmg":12,"knockback":15,"spinRate":0.2,"sizeMult":1,"id":"emoji-047","legacyIndex":47,"timingSeed":"파워 슛","category":"원거리형","concept":"공 한 번으로 상대 위치를 크게 바꾼다","basicSummary":"축구공 슛","skillSummary":"강한 밀침의 파워 슛"},
            {"t":"B","e":"🎯","n":"다트넨","type":"PROJ","desc":"작고 빠른 관통탄을 정확히 모아 맞힌다","projEmoji":"🎯","pCount":3,"pSize":11,"pSpeed":23,"pDmg":10,"pierce":true,"faceDir":true,"pTrail":"#f43f5e","pImpact":"#fecdd3","sizeMult":0.95,"id":"emoji-070","legacyIndex":70,"timingSeed":"다트 챔피언","category":"원거리형","concept":"작고 빠른 관통탄을 정확히 모아 맞힌다","basicSummary":"빠른 관통 다트","skillSummary":"세 갈래 관통 다트"},
            {"t":"B","e":"🥤","n":"탄산직스","type":"PROJ","desc":"탄산 폭발로 상대 간격을 벌린다","sub":"SODA_BOMB","projEmoji":"🥤","pCount":3,"pSize":17,"pSpeed":13,"pDmg":10.5,"pExplode":62,"knockback":18,"spinRate":0.2,"pTrail":"#38bdf8","pImpact":"#e0f2fe","sizeMult":1,"id":"emoji-072","legacyIndex":72,"timingSeed":"탄산 폭탄","category":"원거리형","concept":"탄산 폭발로 상대 간격을 벌린다","basicSummary":"탄산컵 투척","skillSummary":"세 컵 폭발과 밀침"},
            {"t":"B","e":"🥏","n":"프리스비르","type":"PROJ","desc":"원반을 돌아오게 해 두 번의 기회를 만든다","projEmoji":"🥏","projType":"BOOMERANG","pCount":2,"pSize":15,"pSpeed":17,"pDmg":7,"knockback":8,"spinRate":0.5,"pTrail":"#22c55e","pImpact":"#dcfce7","sizeMult":1,"customCooldown":145,"id":"emoji-089","legacyIndex":89,"timingSeed":"프리스비 마스터","category":"원거리형","concept":"원반을 돌아오게 해 두 번의 기회를 만든다","basicSummary":"왕복 원반","skillSummary":"두 개의 프리스비 왕복"},
            {"t":"B","e":"🔰","n":"가드오","type":"BUFF","desc":"위급한 아군에게 먼저 방어를 씌운다","sub":"TEAM_GUARD","sizeMult":1,"teamOnly":true,"id":"emoji-102","legacyIndex":102,"timingSeed":"보호술사","category":"지원가","concept":"위급한 아군에게 먼저 방어를 씌운다","basicSummary":"수호 표식 사격","skillSummary":"저체력 아군들에게 피해 감소"},
            {"t":"B","e":"🐢","n":"람북스","type":"MELEE","desc":"공격 뒤 껍질로 버티는 수비 탱커","sub":"TANK_TURTLE","sizeMult":1.2,"tankRole":true,"id":"emoji-112","legacyIndex":112,"timingSeed":"철갑 거북","category":"탱커","concept":"공격 뒤 껍질로 버티는 수비 탱커","basicSummary":"등껍질 타격","skillSummary":"주변 제압과 짧은 보호"},
            {"t":"B","e":"🔭","n":"진조준","type":"PROJ","desc":"빠른 관통 한 발을 맞히는 명사수","sub":"AIMED_SHOT","projEmoji":"•","pSize":9,"pSpeed":26,"pDmg":27,"pierce":true,"faceDir":true,"knockback":14,"pTrail":"#fde68a","pImpact":"#fff7cc","sizeMult":0.94,"id":"emoji-137","legacyIndex":137,"timingSeed":"BB 스나이퍼","category":"원거리형","concept":"빠른 관통 한 발을 맞히는 명사수","basicSummary":"정밀 단발 탄","skillSummary":"정조준 관통 사격"},
            {"t":"C","e":"🥿","n":"슬리퍼린","type":"PROJ","desc":"긴 직선의 빠른 슬리퍼를 맞힌다","projEmoji":"🥿","pCount":2,"pSize":14,"pSpeed":20,"pDmg":8,"faceDir":true,"pTrail":"#fb7185","pImpact":"#ffe4e6","sizeMult":0.95,"id":"emoji-074","legacyIndex":74,"timingSeed":"슬리퍼 스나이퍼","category":"원거리형","concept":"긴 직선의 빠른 슬리퍼를 맞힌다","basicSummary":"빠른 두 장의 슬리퍼","skillSummary":"두 장의 정밀 슬리퍼"},
            {"t":"C","e":"🍎","n":"사과리코","type":"PROJ","desc":"벽에 튀는 사과로 쉬운 반사를 배운다","projEmoji":"🍎","pCount":2,"pSize":14,"pSpeed":14,"pDmg":8,"pBounce":3,"spinRate":0.25,"pTrail":"#ef4444","pImpact":"#fee2e2","sizeMult":1,"id":"emoji-075","legacyIndex":75,"timingSeed":"사과 투척","category":"원거리형","concept":"벽에 튀는 사과로 쉬운 반사를 배운다","basicSummary":"튕기는 사과","skillSummary":"두 사과의 반사 사격"},
            {"t":"C","e":"🥐","n":"빵메랑","type":"PROJ","desc":"돌아오는 빵의 궤도로 두 번 노린다","projEmoji":"🥐","projType":"BOOMERANG","pSize":15,"pSpeed":15,"pDmg":8,"spinRate":0.5,"pTrail":"#fbbf24","pImpact":"#fef3c7","sizeMult":1,"id":"emoji-077","legacyIndex":77,"timingSeed":"크루아상 부메랑","category":"원거리형","concept":"돌아오는 빵의 궤도로 두 번 노린다","basicSummary":"왕복 크루아상","skillSummary":"크루아상 왕복 투척"},
            {"t":"C","e":"🍳","n":"팬테옹","type":"PROJ","desc":"프라이팬으로 거리를 두다 공격 순간 반격한다","projEmoji":"🍳","pSize":19,"pSpeed":12,"pDmg":6,"knockback":19,"spinRate":0.3,"pTrail":"#94a3b8","pImpact":"#e2e8f0","sizeMult":1.05,"customCooldown":145,"id":"emoji-092","legacyIndex":92,"timingSeed":"프라이팬 투척","category":"원거리형","concept":"프라이팬으로 거리를 두다 공격 순간 반격한다","basicSummary":"프라이팬 투척","skillSummary":"2초간 방어하며 받은 피해 반격","combat":{"skill":"counter"}},
            {"t":"C","e":"🖍️","n":"크레콜트","type":"PROJ","desc":"퍼지는 색연필로 정면을 채운다","projEmoji":"🖍️","pCount":4,"pSize":10,"pSpeed":16,"pDmg":3,"spinRate":0.45,"pTrail":"#f472b6","pImpact":"#fbcfe8","sizeMult":0.95,"customCooldown":115,"id":"emoji-094","legacyIndex":94,"timingSeed":"크레파스 난사","category":"원거리형","concept":"퍼지는 색연필로 정면을 채운다","basicSummary":"크레파스 사격","skillSummary":"네 갈래 크레파스와 짧은 경직"},
            {"t":"C","e":"📣","n":"응원세라","type":"BUFF","desc":"다 같이 다시 싸울 기회를 만든다","sub":"TEAM_RALLY","sizeMult":0.95,"teamOnly":true,"id":"emoji-105","legacyIndex":105,"timingSeed":"응원단장","category":"지원가","concept":"다 같이 다시 싸울 기회를 만든다","basicSummary":"확성기 사격","skillSummary":"주변 아군 소량 회복과 기술 준비 단축"},
            {"t":"C","e":"🦀","n":"게렌","type":"MELEE","desc":"집게 적중 뒤 갑옷으로 버틴다","sub":"TANK_CRAB","sizeMult":1.05,"tankRole":true,"id":"emoji-113","legacyIndex":113,"timingSeed":"갑옷 게","category":"탱커","concept":"집게 적중 뒤 갑옷으로 버틴다","basicSummary":"집게 타격","skillSummary":"주변 제압과 짧은 보호"},
            {"t":"C","e":"🧹","n":"빗자루신","type":"PROJ","desc":"관통 빗자루로 뒤쪽 적까지 밀친다","projEmoji":"🧹","pCount":2,"pSize":17,"pSpeed":15,"pDmg":5.5,"pierce":true,"knockback":10,"faceDir":true,"pTrail":"#c4b5fd","pImpact":"#ede9fe","sizeMult":1.05,"customCooldown":138,"id":"emoji-121","legacyIndex":121,"timingSeed":"빗자루 기사","category":"원거리형","concept":"관통 빗자루로 뒤쪽 적까지 밀친다","basicSummary":"관통 빗자루","skillSummary":"두 빗자루의 관통 사격"},
            {"t":"C","e":"🪴","n":"화분이라","type":"PROJ","desc":"깨지는 화분으로 좁은 길을 막는다","projEmoji":"🪴","pCount":2,"pSize":17,"pSpeed":12,"pDmg":5,"pExplode":48,"knockback":8,"spinRate":0.18,"pTrail":"#86efac","pImpact":"#dcfce7","sizeMult":1,"customCooldown":145,"id":"emoji-122","legacyIndex":122,"timingSeed":"화분 투척","category":"원거리형","concept":"깨지는 화분으로 좁은 길을 막는다","basicSummary":"화분 투척","skillSummary":"두 화분의 작은 폭발"},
            {"t":"C","e":"📌","n":"압정티모","type":"PROJ","desc":"작고 빠른 압정을 좁게 모아 맞힌다","projEmoji":"📌","pCount":6,"pSize":8,"pSpeed":20,"pDmg":2.5,"faceDir":true,"pTrail":"#f87171","pImpact":"#fee2e2","sizeMult":0.9,"customCooldown":108,"id":"emoji-126","legacyIndex":126,"timingSeed":"압정 난사","category":"원거리형","concept":"작고 빠른 압정을 좁게 모아 맞힌다","basicSummary":"빠른 압정","skillSummary":"좁은 압정 연사"},
            {"t":"C","e":"🛼","n":"롤러붐","type":"DASH","desc":"질주한 길에 폭탄을 남긴다","sub":"BOMB_TRAIL","sizeMult":1,"dashSpeed":29,"dashDuration":30,"id":"emoji-127","legacyIndex":127,"timingSeed":"롤러스케이트","category":"기동형","concept":"질주한 길에 폭탄을 남긴다","basicSummary":"롤러 근접 타격","skillSummary":"짧은 이동과 제한된 근접 감지 폭탄"},
            {"t":"C","e":"🐙","n":"잉크랭","type":"DASH","desc":"먹물길로 적에게 지속 피해와 짧은 감속을 준다","sub":"INK_TRAIL","sizeMult":1,"dashSpeed":30,"dashDuration":25,"id":"emoji-128","legacyIndex":128,"timingSeed":"먹물 대쉬","category":"기동형","concept":"먹물길로 적에게 지속 피해와 짧은 감속을 준다","basicSummary":"촉수 근접 타격","skillSummary":"이동 경로의 먹물 흔적"},
            {"t":"F","e":"🐌","n":"달팽람","type":"BUFF","desc":"느리게 버티며 방어 타이밍을 배운다","sub":"SLOW_TANK","sizeMult":0.7,"tankRole":true,"legacyTank":true,"id":"emoji-050","legacyIndex":50,"timingSeed":"민달팽이","category":"탱커","concept":"느리게 버티며 방어 타이밍을 배운다","basicSummary":"느린 근접 타격","skillSummary":"짧은 등껍질 방어"},
            {"t":"F","e":"🧱","n":"벽돌리오","type":"BUFF","desc":"위험할 때 몸을 굳히는 초보 요새","sub":"STONE","sizeMult":0.8,"id":"emoji-052","legacyIndex":52,"timingSeed":"벽돌","category":"원거리형","concept":"위험할 때 몸을 굳히는 초보 요새","basicSummary":"벽돌 투척","skillSummary":"주변을 밀어내고 2초간 방어"},
            {"t":"F","e":"🧼","n":"비누누","type":"DASH","desc":"조준한 방향으로 미끄러져 빠져나간다","sub":"SLIP","sizeMult":0.8,"id":"emoji-054","legacyIndex":54,"timingSeed":"비누","category":"기동형","concept":"조준한 방향으로 미끄러져 빠져나간다","basicSummary":"비누 근접 타격","skillSummary":"짧은 수동 미끄러짐"},
            {"t":"F","e":"🫧","n":"버블나미","type":"PROJ","desc":"느린 방울로 상대의 이동을 견제한다","projEmoji":"🫧","pSize":15,"pSpeed":4,"pDmg":3,"wobble":true,"sizeMult":1,"id":"emoji-056","legacyIndex":56,"timingSeed":"비눗방울 놀이","category":"원거리형","concept":"느린 방울로 상대의 이동을 견제한다","basicSummary":"비눗방울 사격","skillSummary":"흔들리는 큰 방울과 짧은 기절"},
            {"t":"F","e":"🍬","n":"캔디콜트","type":"PROJ","desc":"사탕을 퍼뜨려 가까운 적을 견제한다","projEmoji":"🍬","pCount":3,"pSize":8,"pSpeed":11,"pDmg":2,"wobble":true,"pTrail":"#fb7185","pImpact":"#ffe4e6","sizeMult":0.85,"customCooldown":165,"id":"emoji-096","legacyIndex":96,"timingSeed":"사탕총","category":"원거리형","concept":"사탕을 퍼뜨려 가까운 적을 견제한다","basicSummary":"세 갈래 사탕 사격","skillSummary":"흔들리는 사탕 세 개와 짧은 경직"},
            {"t":"F","e":"🦔","n":"가시람","type":"MELEE","desc":"짧은 타격 뒤 웅크려 버틴다","sub":"TANK_HEDGEHOG","sizeMult":0.9,"tankRole":true,"id":"emoji-114","legacyIndex":114,"timingSeed":"초보 가시탱커","category":"탱커","concept":"짧은 타격 뒤 웅크려 버틴다","basicSummary":"가시 근접 타격","skillSummary":"근접 강타와 짧은 웅크리기"}
        ];;}],
[49,__brScope=>{ __brScope.BR_DISPLAY_NAMES = Object.freeze({
            // S Rank
            'emoji-000':'용의 분노','emoji-001':'천둥군주','emoji-002':'우주 납치범','emoji-003':'대마법사',
            'emoji-004':'공허 암살자','emoji-006':'검성','emoji-007':'폴아웃','emoji-008':'폴터가이스트',
            'emoji-010':'블랙홀','emoji-011':'뇌신','emoji-012':'지니','emoji-013':'블러드로드',
            'emoji-014':'역병군주','emoji-019':'폭주기관차','emoji-020':'초신성','emoji-022':'요요 마스터',
            'emoji-037':'구급차','emoji-085':'심연의 눈','emoji-098':'성역술사','emoji-110':'철갑 코뿔소',
            'emoji-131':'가위 수호자','emoji-132':'공허 파괴자',
            // A Rank
            'emoji-023':'헤드슈터','emoji-024':'윈드워커','emoji-025':'핵주먹','emoji-026':'아이스킹',
            'emoji-027':'로드킬','emoji-028':'아이언월','emoji-029':'스카이 하이','emoji-030':'크라켄',
            'emoji-031':'스컹크 대쉬','emoji-033':'불도저','emoji-034':'볼링 챔피언','emoji-035':'체인소맨',
            'emoji-036':'뱀파이어 떼','emoji-063':'버거 캐논','emoji-066':'프로 부메랑',
            'emoji-087':'사냥꾼','emoji-099':'전투 의무병','emoji-101':'가속마도사','emoji-133':'영혼 검사',
            // B Rank
            'emoji-038':'암살자','emoji-039':'다이너마이트','emoji-040':'멧라이더','emoji-041':'킬러비',
            'emoji-042':'뿅망치','emoji-043':'로켓 점프','emoji-044':'스노우보더','emoji-045':'테니스 챔피언',
            'emoji-047':'파워 슛','emoji-070':'다트 챔피언','emoji-072':'탄산 폭탄',
            'emoji-089':'프리스비 마스터','emoji-102':'보호술사','emoji-103':'약제사','emoji-112':'람북스',
            'emoji-137':'BB 스나이퍼','emoji-138':'적색 의무단',
            // C Rank
            'emoji-074':'슬리퍼 스나이퍼','emoji-075':'사과 투척',
            'emoji-077':'크루아상 부메랑','emoji-092':'팬테옹','emoji-094':'크레파스 난사','emoji-105':'응원단장',
            'emoji-107':'전투악사','emoji-108':'수호종','emoji-113':'게렌','emoji-119':'빵터진 시민',
            'emoji-121':'청소반장','emoji-122':'화분 투척','emoji-126':'압정 난사','emoji-127':'롤러스케이트',
            'emoji-128':'먹물 대쉬',
            // F Rank
            'emoji-050':'민달팽이','emoji-052':'벽돌','emoji-054':'비누','emoji-056':'비눗방울 놀이',
            'emoji-057':'초보 부메랑','emoji-082':'땅콩 투척','emoji-096':'사탕총','emoji-109':'초보 구급병',
            'emoji-114':'아기 고슴도치'
        });;}],
[50,__brScope=>{__brScope.EMOJI_DB.forEach(function(ability){if(__brScope.BR_DISPLAY_NAMES[ability.id])ability.n=__brScope.BR_DISPLAY_NAMES[ability.id];});}],
[51,__brScope=>{ __brScope.BR_V28_ROSTER_METADATA=Object.freeze(__brScope.EMOJI_DB.map(a=>Object.freeze({id:a.id,t:a.t,n:a.n,e:a.e})));;}],
[52,__brScope=>{for(let i=__brScope.EMOJI_DB.length-1;i>=0;i--)if(['emoji-050','emoji-096'].includes(__brScope.EMOJI_DB[i].id))__brScope.EMOJI_DB.splice(i,1);}],
[53,__brScope=>{ __brScope.brV29Edit=(id,values)=>Object.assign(__brScope.EMOJI_DB.find(a=>a.id===id),values);;}],
[54,__brScope=>{__brScope.brV29Edit('emoji-114',{t:'A',e:'🗿',n:'킹 모아이',sizeMult:1.6,basicSummary:'모아이 근접 타격',skillSummary:'전방 강타와 짧은 방어'});}],
[55,__brScope=>{__brScope.brV29Edit('emoji-089',{e:'⛹️',n:'농구왕',projEmoji:'🏀',projType:'bullet',pCount:1,spinRate:0,desc:'강한 한 발을 맞히고 돌아온 공으로 쿨타임을 줄입니다.',basicSummary:'직선 공 1발',skillSummary:'리바운드 슛 · 반환 도착 시 남은 쿨타임 50% 감소'});}],
[56,__brScope=>{__brScope.brV29Edit('emoji-122',{e:'🥫',n:'통조림 투척',projEmoji:'🥫',desc:'통조림을 던져 작은 폭발과 2초 피해 지대 하나를 남깁니다.',basicSummary:'통조림 투척',skillSummary:'975 거리 투척 · 작은 폭발과 2초 피해 지대'});}],
[57,__brScope=>{__brScope.brV29Edit('emoji-052',{skillLabel:'철괴'});}],
[58,__brScope=>{__brScope.EMOJI_DB.push(
            {id:'emoji-139',t:'A',e:'🧟',n:'좀비',type:'MELEE',sub:'ZOMBIE_REGEN',sizeMult:1.6,tankRole:true,category:'탱커',timingSeed:'좀비',desc:'느린 강타와 4초 자가 재생',basicSummary:'1.15초 간격의 무거운 근접 타격',skillSummary:'4초 동안 최대 HP 21% 재생'},
            {id:'emoji-140',t:'S',e:'🦍',requestedEmoji:'🫈',n:'짐승형 거인',type:'MELEE',sub:'BEAST_ROCKS',sizeMult:1.8,category:'근접형',timingSeed:'짐승형 거인',desc:'큰 몸집의 근접 전사 · 준비 후 작은 돌 12발 투척',basicSummary:'묵직한 근접 타격',skillSummary:'돌 무더기 투척 · 90도 12발'}
        );}],
[59,__brScope=>{ __brScope.BR_V29_FINAL_HP=Object.freeze({'emoji-052':400,'emoji-054':180,'emoji-114':450,'emoji-122':240,'emoji-139':450,'emoji-140':560});;}],
[60,__brScope=>{ __brScope.BR_V29_ZOMBIE_WALK=2.326968;;}],
[68,__brScope=>{ __brScope.TEAM_SUPPORT_SUBS = new Set(__brScope.EMOJI_DB.filter(a=>a.teamOnly).map(a=>a.sub));;}],
[213,__brScope=>{ __brScope.game = null;;}],
[215,__brScope=>{ __brScope.teamMode = 0;;}],
[295,__brScope=>{ __brScope.BR_CLOSE_BALANCE=Object.freeze({A:{hp:1.05,cap:500,damage:1.05},B:{hp:1.08,cap:500,damage:1.07},C:{hp:1.10,cap:430,damage:1.09},F:{hp:1.12,cap:380,damage:1.12}});;}],
[298,__brScope=>{ __brScope.BR_BASE_HP_OVERRIDES_BY_ID=Object.freeze({
            'emoji-041':250,'emoji-039':290,'emoji-045':290,'emoji-047':290,'emoji-075':270,
            'emoji-077':270,'emoji-126':255,'emoji-096':245,'emoji-052':240,'emoji-050':300,'emoji-010':500,
            'emoji-000':540,'emoji-014':460,'emoji-012':450,'emoji-025':480,'emoji-133':450,'emoji-110':560
        });;}],
[299,__brScope=>{ __brScope.BR_TRAIN_DISTANCE=Object.freeze({min:80,tap:220,max:1480,deadZone:10});;}],
[303,__brScope=>{ __brScope.BR_MELEE_SKILL_TUNING=Object.freeze({
            'emoji-025':Object.freeze({damage:1.05,push:1.15}),
            'emoji-026':Object.freeze({damage:1.05,push:1}),
            'emoji-042':Object.freeze({damage:1.05,push:1.20}),
            'emoji-113':Object.freeze({damage:1.05,push:1.20}),
            'emoji-121':Object.freeze({damage:1.05,push:1.15})
        });;}]
];
