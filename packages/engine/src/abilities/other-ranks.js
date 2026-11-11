// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){

}
export const initializers=[
[306,__brScope=>{(function registerOtherReworkedCharacters(R) {
    'use strict';
    if(!R)throw new Error('BRRework engine must load before character definitions');
    const allCaps={damage:false,projectile:false,multicast:false,expandable:false,area:false,cc:false,heal:false,shield:false,dash:false,summon:false,trap:false,duration:false,utility:false};
    const frames=n=>Math.round(n*60);
    const copy=p=>new __brScope.Vec2(p.x,p.y);
    const rotate=(v,a)=>new __brScope.Vec2(v.x*Math.cos(a)-v.y*Math.sin(a),v.x*Math.sin(a)+v.y*Math.cos(a));
    function add(id,name,rank,role,basic,skill,handler,extra={}) {
        skill=Object.assign({label:name,kind:'projectile',shape:'line',cooldown:frames(8),windup:0,duration:0,interval:0,count:1,countCap:1,damage:0,knockback:0,stun:0,stunCap:0,range:0,width:0,radius:0,cancelOnStun:true,ownerDeath:'cancel',wallPolicy:'blocked',targetBudget:1},skill);
        skill.caps=Object.assign({},allCaps,skill.caps||{});skill.capabilities=skill.caps;
        for(const [a,b] of [['cooldownFrames','cooldown'],['windupFrames','windup'],['durationFrames','duration'],['intervalFrames','interval'],['stunFrames','stun']])skill[a]=skill[b];
        const def=Object.assign({name,rank,role,category:role,basic:Object.assign({stun:0},basic||{}),skill,stats:{},basicSummary:extra.basicSummary||''},extra);
        R.register(id,def,ctx=>handler(ctx,skill,def));return def;
    }
    const melee=(style='slash',extra={})=>Object.assign({close:true,rangeBonus:86,halfAngle:1.12,cooldownScale:1,damageScale:1,pushScale:.32,stun:0,reward:'',style},extra);
    const projectileCaps={damage:true,projectile:true,expandable:true};
    const dashCaps={damage:true,dash:true,expandable:true,cc:true,signatureRange:true};
    const aoeCaps={damage:true,area:true,expandable:true};
    function telegraph(ctx,s,shape=s.shape,pos) {
        if(s.windup>0)R.marker(ctx,{pos:pos?copy(pos):copy(ctx.owner.pos),shape:shape==='target'?'circle':shape==='dash'?'rect':shape,radius:s.radius,range:s.range,width:s.width,duration:s.windup,color:s.color||'#fbbf24'});
    }
    function prepared(ctx,s,fn,shape,pos) {telegraph(ctx,s,shape,pos);if(s.windup>0)R.lock(ctx,{move:true,attack:true,skill:true,cancelOnStun:true},s.windup+1);if(s.windup>0)R.schedule(ctx,s.windup,fn,{cancelOnStun:true});else fn(ctx);}
    function shot(ctx,s,extra={}) {return R.projectile(ctx,Object.assign({speed:s.speed,range:s.range,radius:s.radius,damage:s.damage,knockback:s.knockback,stun:s.stun,stunCap:s.stunCap,color:s.color,emoji:s.emoji},extra));}
    function liveCount(ctx,s) {return R.count(ctx,s.count,s.countCap);}
    function safePoint(ctx,pos,radius) {return R.safe(ctx.g,pos,radius,ctx.owner);}
    function groundPoint(ctx,pos,radius) {if(__brScope.brArenaRect(ctx.g)){const p=__brScope.brArenaClamp(ctx.g,pos,radius+4),m=__brScope.combatMoveCircle(p,{x:0,y:0},radius,ctx.g.walls,false);return __brScope.brArenaClamp(ctx.g,new __brScope.Vec2(m.x,m.y),radius+4);}const moved=__brScope.combatMoveCircle(pos,new __brScope.Vec2(0,0),radius,ctx.g.walls,false),point=new __brScope.Vec2(moved.x,moved.y),center=ctx.g.center||new __brScope.Vec2(0,0),delta=point.sub(center),edge=Math.max(10,(ctx.g.worldRadius||__brScope.BR_WORLD_RADIUS)-radius-4),n=delta.mag();return n>edge?center.add(delta.mult(edge/n)):point;}
    function buffRing(ctx,s,color) {R.marker(ctx,{pos:copy(ctx.owner.pos),shape:'circle',radius:s.radius||ctx.owner.radius*1.7,duration:24,color:color||s.color});}
    // One straight, piercing strike; existing projectile hit ledger guarantees one hit per life.
    add('emoji-034','볼링 챔피언','A','원거리형',{},
        {label:'스트라이크',kind:'bowling-strike',shape:'line',cooldown:945,range:900,width:72,radius:36,speed:22,damage:21,knockback:42,count:1,countCap:1,bounces:0,pierce:true,color:'#c4b5fd',emoji:'🎳',caps:{...projectileCaps,cc:true},
         description:'반경 36의 큰 볼링공 한 개가 900 거리까지 직진하며 적마다 한 번 타격하고 진행 방향으로 밀어냅니다. 벽에 닿으면 사라지며 반사·기절은 없습니다.',strength:'일렬의 적을 관통하는 밀침',success:'여러 적이 늘어선 방향 조준',failure:'벽에 막히는 고정 직선',counterplay:'측면 회피와 엄폐'},
        (ctx,s)=>shot(ctx,s,{pierce:true,bounces:0}));
    add('emoji-070','다트 챔피언','B','원거리형',{},
        {label:'집중 투척',kind:'dart-haste',shape:'circle',cooldown:990,duration:300,radius:0,attackHaste:1.3,color:'#fb7185',caps:{duration:true,utility:true},
         description:'5초 동안 일반 공격 속도가 30% 증가합니다. 추가 투사체 없이 이동하며 공격할 수 있습니다. 관통 다트 평타는 상대 몸 중심 35%를 지나는 궤적일 때 피해가 1.5배입니다.',strength:'정확한 평타를 빠르게 반복',success:'중앙을 겨눈 다트 적중',failure:'스킬 자체 피해 없음',counterplay:'측면 이동으로 중앙 조준 회피'},
        (ctx,s)=>{R.buff(ctx,ctx.owner,'basicHaste',s.attackHaste,s.duration);buffRing(ctx,s);});
    // A01: thin, first-contact sniper. The marker and final direction share ctx.aim.
    add('emoji-023','헤드슈터','A','원거리형',{},
        {kind:'sniper',shape:'line',cooldown:frames(12),windup:24,range:1380,width:14,radius:7,speed:90,damage:76,knockback:2,color:'#fbbf24',emoji:'•',caps:projectileCaps,
         description:'0.4초 조준 후 가늘고 긴 저격탄으로 탄도상 첫 적을 타격합니다. 벽에서 멈추며 기절시키지 않습니다.',strength:'긴 사거리의 단발 화력',success:'예고 뒤에도 탄도에 남은 적 적중',failure:'방향 고정과 긴 재사용 대기',counterplay:'예고선 옆으로 이동하거나 벽 엄폐'},
        (ctx,s)=>prepared(ctx,s,c=>shot(c,s),'line'));
    // A02: one front target and one optional wall collision; no generic stun.
    add('emoji-025','핵주먹','A','근접형',melee('punch',{halfAngle:1.02,cooldownScale:1.15,damageScale:1.15}),
        {kind:'front',shape:'rect',cooldown:frames(10),windup:12,range:165,width:104,damage:58,knockback:30,wallDamage:14,wallWindow:90,color:'#fb923c',caps:{damage:true,area:true,expandable:true,cc:true},
         description:'전방 한 명에게 강한 펀치와 큰 밀침을 줍니다. 밀려난 적의 첫 벽 충돌에만 추가 피해가 적용됩니다.',strength:'방향성 강한 밀침',success:'가까운 전방 적을 벽 쪽으로 가격',failure:'짧은 사거리',counterplay:'측면 회피와 거리 유지'},
        (ctx,s)=>prepared(ctx,s,c=>R.front(c,{range:s.range,width:s.width,damage:s.damage,maxTargets:1,knockback:s.knockback,stun:0,wallDamage:s.wallDamage}),'rect'));
    // A03: role/basic changed independently from the radial skill.
    add('emoji-026','아이스킹','A','탱커',melee('punch',{pushScale:.18,cooldownScale:1.08}),
        {kind:'freeze',shape:'circle',cooldown:frames(13),windup:18,radius:225,damage:27,stun:66,stunCap:84,knockback:0,color:'#7dd3fc',caps:{...aoeCaps,cc:true},
         description:'0.3초 준비 후 주변 적에게 피해와 1.1초 빙결을 줍니다. 적을 멀리 밀어내지 않습니다.',strength:'자기 주변 확실한 제어',success:'적이 접근한 뒤 빙결',failure:'원거리 피해 수단 부족',counterplay:'빙결 범위 밖에서 견제'},
        (ctx,s)=>prepared(ctx,s,c=>R.area(c,copy(c.owner.pos),s.radius,s.damage,{stun:s.stun,stunCap:s.stunCap,knockback:0}),'circle'),
        {statType:'MELEE',tankRole:true,basicSummary:'근접 얼음 주먹 · 자동 기절 없음',stats:{hpMultiplier:.98,speedMultiplier:.96,knockbackResist:.68}});
    // A04: exactly two accepted casts; cooldown starts after second/expiry.
    add('emoji-027','로드킬','A','기동형',melee('punch',{pushScale:.25}),
        {kind:'recast-dash',shape:'dash',cooldown:frames(11),range:370,width:76,speed:25,damage:25,knockback:6,recastWindow:120,recastCount:2,color:'#fb7185',caps:dashCaps,
         description:'짧은 돌진 뒤 2초 안에 한 번 더 새 방향으로 돌진합니다. 두 번째 돌진 또는 창 만료 뒤 전체 대기시간이 시작됩니다.',strength:'두 방향 진입과 이탈',success:'첫 돌진으로 접근하고 재조준',failure:'두 번 사용 뒤 긴 공백',counterplay:'첫 돌진을 보고 두 번째 방향 예측'},
        (ctx,s)=>{const first=R.dash(ctx,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,knockback:s.knockback,stun:0});R.openRecast(ctx,{duration:s.recastWindow+first.duration,cooldownFrames:s.cooldown,handler:c=>R.dash(c,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,knockback:s.knockback,stun:0})});});
    // A05: HP-derived immediate reflection cannot reflect reflection or periodic damage.
    add('emoji-028','아이언월','A','탱커',melee('punch',{pushScale:.25,cooldownScale:1.08}),
        {kind:'counter-immediate',shape:'circle',cooldown:frames(11),duration:120,radius:100,damageReduction:.28,reflectRatio:.50,reflectRange:1600,color:'#93c5fd',caps:{damage:true,duration:true,utility:true},
         description:'2초 동안 받는 피해가 28% 줄고, 적의 직접 공격으로 실제 잃은 HP의 50%를 그 공격자에게 즉시 반환합니다. 지속·환경·반격 피해는 반환하지 않습니다.',strength:'집중 공격에 강한 지속 방어',success:'직접 공격 타이밍에 자세 유지',failure:'피해 없이 끝나면 반격 없음',counterplay:'방어가 끝날 때 공격'},
        (ctx,s)=>{R.buff(ctx,ctx.owner,'damageReduction',s.damageReduction,s.duration);R.buff(ctx,ctx.owner,'counterImmediate',s.reflectRatio,s.duration,{range:s.reflectRange});buffRing(ctx,s);});
    // A06: airborne flight over walls with only landing damage.
    add('emoji-029','스카이 하이','A','기동형',melee('slash',{pushScale:.3}),
        {kind:'leap',shape:'target',cooldown:frames(11),range:670,radius:150,duration:30,damage:48,knockback:7,color:'#bae6fd',wallPolicy:'airborne-safe-landing',caps:{...aoeCaps,dash:true,cc:true,signatureRange:true},
         description:'벽을 넘어 표시 지점으로 비행해 착지 충격을 줍니다. 공중 이동은 무적이 아니며 기절·포획되면 추가 타격 없이 정착합니다.',strength:'벽을 넘는 진입',success:'적의 퇴로에 착지',failure:'착지까지 시간이 필요',counterplay:'착지 표시 회피 또는 공중 제어'},
        (ctx,s)=>{const pos=safePoint(ctx,R.targetPoint(ctx,s.range),ctx.owner.radius),capture=!!__brScope.brArenaRect(ctx.g),marker={pos,shape:'circle',radius:s.radius,duration:s.duration,color:s.color};if(!capture)R.marker(ctx,marker);const leap=R.leap(ctx,{pos,duration:s.duration,damage:s.damage,radius:s.radius,knockback:s.knockback});if(capture)R.marker(ctx,{...marker,pos:leap.to});});
    // A07: three swept tentacles, once per target, shared safe hook core.
    add('emoji-030','크라켄','A','근접형',melee('slash',{rangeBonus:95}),
        {kind:'hook',shape:'cone',cooldown:frames(14),range:780,width:34,radius:17,speed:36,damage:24,maxTargets:3,halfAngle:.28,stun:60,stunCap:78,color:'#c084fc',caps:{damage:true,projectile:true,expandable:true,cc:true,signatureRange:true},
         description:'세 갈래 촉수로 최대 3명의 적을 포획해 겹치지 않는 전방 위치로 당기고 도착 후 1초 기절시킵니다. 벽을 통과하지 않습니다.',strength:'여러 적의 위치를 함께 바꿈',success:'전방에 모인 적에게 촉수 적중',failure:'긴 대기시간과 벽 차폐',counterplay:'촉수 사이 이동과 엄폐'},
        (ctx,s)=>R.hook(ctx,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,maxTargets:s.maxTargets,arrivalStun:s.stun,stunCap:s.stunCap,spread:s.halfAngle}));
    // A08: slow, broad plow. Only first contact deals damage; continued contact pushes.
    add('emoji-033','불도저','A','탱커',melee('punch',{pushScale:.45,cooldownScale:1.13}),
        {kind:'plow',shape:'dash',cooldown:frames(12),range:530,width:165,speed:7,damage:25,knockback:6,maintainPush:4,pushInterval:6,duration:84,color:'#fbbf24',caps:{...dashCaps,duration:true},
         description:'느리고 넓은 전면으로 전진합니다. 첫 접촉만 피해를 주고 이후에는 진행 방향으로 밀어냅니다. 벽에 닿거나 최대 거리에서 멈춥니다.',strength:'넓은 전선을 꾸준히 밀기',success:'정면 접촉 유지',failure:'느린 이동과 고정 방향',counterplay:'측면으로 빠져나오기'},
        (ctx,s)=>{const dash=R.dash(ctx,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,knockback:s.knockback,stun:0});R.entity(ctx,'plow-pressure',{pos:copy(ctx.owner.pos),duration:dash.duration,cancelOnStun:true,hidden:true},(c,e)=>{if(dash.dead){R.end(e,'completed');return;}e.pos=copy(c.owner.pos);if(e.age%s.pushInterval===0)R.front(c,{range:c.owner.radius+48,width:s.width,damage:0,maxTargets:30,knockback:s.maintainPush,stun:0,direction:c.aim});});},
        {tankRole:true,stats:{speedMultiplier:.98,knockbackResist:.62}});
    // A09: self haste plus per-source bleeding; no lifesteal.
    add('emoji-035','체인소맨','A','근접형',melee('slash',{cooldownScale:.95,damageScale:.95,pushScale:.12}),
        {kind:'chainsaw',shape:'circle',cooldown:frames(13),duration:300,radius:90,attackHaste:1.5,bleedDamage:4,bleedDuration:180,bleedInterval:30,bleedStacks:3,color:'#f87171',caps:{damage:true,duration:true,utility:true},
         description:'5초 동안 일반 공격 속도 +50%. 평타 적중 시 3초 출혈을 최대 3중첩 부여하며 0.5초마다 피해를 줍니다. 흡혈은 없습니다.',strength:'짧은 시간 연속 근접전',success:'가속 중 평타를 반복 적중',failure:'접근하지 못하면 버프 낭비',counterplay:'가속 시간 동안 거리 벌리기'},
        (ctx,s)=>{R.buff(ctx,ctx.owner,'basicHaste',s.attackHaste,s.duration);R.buff(ctx,ctx.owner,'chainsaw',1,s.duration,{dot:{kind:'bleed',damage:s.bleedDamage,duration:s.bleedDuration,tickEvery:s.bleedInterval,maxStacks:s.bleedStacks}});buffRing(ctx,s);},
        {statType:'MELEE',basicSummary:'빠른 근접 전기톱 · 밀침 작음',stats:{hpMultiplier:.64,speedMultiplier:1.04}});
    // A10: ordinary hits mark one visible enemy per caster; bats prefer that life.
    add('emoji-036','뱀파이어 떼','A','원거리형',{},
        {kind:'marked-homing',shape:'cone',cooldown:frames(10),range:910,radius:16,speed:18,damage:19,count:3,countCap:8,spread:.12,turnRate:.048,markDuration:240,knockback:1,color:'#c084fc',emoji:'🦇',caps:{...projectileCaps,multicast:true},
         description:'일반 공격으로 마지막 적 한 명에게 4초 사냥 표식을 남깁니다. 스킬 박쥐 무리는 유효한 표식 대상을 우선 추적하며 벽·은신을 무시하지 않습니다.',strength:'표식 후 집중 사격',success:'평타 표식 후 박쥐 적중',failure:'벽이나 은신에 표적 상실',counterplay:'엄폐로 표식 추적 끊기'},
        (ctx,s)=>{const count=liveCount(ctx,s);for(let i=0;i<count;i++)shot(ctx,s,{dir:rotate(ctx.aim,(i-(count-1)/2)*s.spread),homing:true,turnRate:s.turnRate,preferredMark:'hunt'});},
        {onBasicHit:(ctx,target,result)=>{if(result.valid&&target.id!==999)R.mark(ctx,target,{kind:'hunt',duration:240,charges:1,bonus:0});}});
    // A11: base shotgun budget is divided over five pellets; augment pellets add damage.
    add('emoji-063','버거 캐논','A','원거리형',{close:false,count:3,range:560,spread:.17,damageScale:.36,knockback:3},
        {kind:'shotgun',shape:'cone',cooldown:frames(9),range:650,radius:24,speed:19,damage:18,count:5,countCap:9,spread:.145,halfAngle:.34,knockback:5,knockbackOnce:true,color:'#f59e0b',emoji:'🍔',caps:{...projectileCaps,multicast:true,cc:true},
         description:'굵은 산탄 5발을 한 번에 발사합니다. 가까울수록 여러 탄을 맞힐 수 있으며 같은 일제사격의 밀침은 대상당 한 번만 적용됩니다.',strength:'근접 거리 산탄 집중',success:'가까운 적에게 여러 탄 적중',failure:'짧은 사거리와 탄 퍼짐',counterplay:'거리를 벌려 일부 탄만 맞기'},
        (ctx,s)=>{const n=liveCount(ctx,s),pushed=new Set();for(let i=0;i<n;i++)shot(ctx,s,{dir:rotate(ctx.aim,(i-(n-1)/2)*s.spread),knockback:0,onHit:(c,t,res)=>{const key=String(t.id)+':'+Number(t.lifeSeq||0);if(res.valid&&!pushed.has(key)){pushed.add(key);R.hit(c,t,0,{knockback:s.knockback,direction:c.aim});}}});},
        {basicSummary:'짧은 사거리의 작은 버거 산탄 3발'});
    // A12: each projectile owns separate outbound and return hit sets.
    add('emoji-066','프로 부메랑','A','원거리형',{},
        {kind:'boomerang',shape:'cone',cooldown:frames(11),range:760,radius:24,speed:20,returnSpeed:24,damage:25,count:2,countCap:5,spread:.48,dwell:0,duration:150,knockback:2,color:'#d8b4fe',emoji:'🪃',caps:{...projectileCaps,multicast:true,signatureRange:true},
         description:'대형 부메랑 두 개를 V자로 던져 왕복 각각 한 번씩 타격합니다. 이동하여 두 복귀 경로를 겹칠 수 있습니다.',strength:'왕복 경로를 겹치는 화력',success:'이동으로 돌아오는 궤적 조정',failure:'즉시 폭딜보다 경로 설계 필요',counterplay:'왕복 경로에서 비켜서기'},
        (ctx,s)=>{const n=liveCount(ctx,s);for(let i=0;i<n;i++)shot(ctx,s,{dir:rotate(ctx.aim,(i-(n-1)/2)*s.spread),boomerang:true,dwell:0,returnSpeed:s.returnSpeed,duration:s.duration});});
    // A13: one fast marking arrow; reward belongs to next three valid basic attempts.
    add('emoji-087','사냥꾼','A','원거리형',{},
        {kind:'hunter-mark',shape:'line',cooldown:frames(10),range:1030,radius:10,speed:36,damage:22,knockback:1,markDuration:240,markCharges:3,markBonus:17,color:'#fbbf24',emoji:'➶',caps:projectileCaps,
         description:'빠른 화살 한 발로 4초 표식을 남깁니다. 그 적에게 성공한 다음 일반 공격 3회가 강화되며 여러 탄도 한 공격당 한 번만 소비합니다.',strength:'후속 평타 세 번의 보상',success:'표식 후 같은 대상에게 집중',failure:'스킬 첫 피해는 낮음',counterplay:'4초 동안 엄폐하거나 거리 이탈'},
        (ctx,s)=>shot(ctx,s,{onHit:(c,t,res)=>{if(res.valid)R.mark(c,t,{kind:'hunter',duration:s.markDuration,charges:s.markCharges,bonus:s.markBonus});}}));
    // A14: cooldown PROGRESS rate, not repeated remaining-time refunds.
    add('emoji-101','가속마도사','A','지원가',{},
        {kind:'team-haste',shape:'circle',cooldown:frames(13),radius:420,duration:180,moveHaste:1.12,attackHaste:1.3,skillHaste:1.3,color:'#c4b5fd',caps:{area:true,expandable:true,duration:true,utility:true},
         description:'주변 아군에게 3초 동안 이동속도 +12%, 일반 공격·스킬 대기시간 진행 1.3배를 줍니다. 같은 팀 가속은 가장 강한 효과만 적용합니다.',strength:'팀의 다음 공격 기회를 앞당김',success:'아군이 모인 교전 직전 사용',failure:'즉시 회복과 제어 없음',counterplay:'가속 효과가 끝날 때 재교전'},
        (ctx,s)=>{for(const a of R.allies(ctx,ctx.owner.pos,s.radius)){R.buff(ctx,a,'moveHaste',s.moveHaste,s.duration);R.buff(ctx,a,'teamBasicHaste',s.attackHaste,s.duration);R.buff(ctx,a,'teamSkillHaste',s.skillHaste,s.duration);}buffRing(ctx,s);},
        {teamOnly:true});
    // A15: forward rectangle telegraph -> swept slash, real shield only on valid hits.
    add('emoji-133','영혼 검사','A','근접형',melee('soul',{pushScale:.2,reward:''}),
        {kind:'soul-dash',shape:'rect',cooldown:frames(13),windup:24,range:560,width:130,speed:31,damage:46,stun:48,stunCap:66,knockback:2,shield:42,shieldPerExtra:12,shieldCap:78,shieldDuration:180,color:'#a5f3fc',caps:{...dashCaps,area:true,shield:true},
         description:'0.4초 전방 직사각형 예고 후 돌진 베기를 하며 0.8초 기절시킵니다. 첫 적중에 보호막 42, 추가 대상마다 12를 얻고 최대 78까지 유지합니다.',strength:'적중을 방어로 전환',success:'준비 뒤 직선 경로 적중',failure:'빗나가면 보호막 없음',counterplay:'예고 직사각형 옆으로 회피'},
        (ctx,s)=>prepared(ctx,s,c=>{let hits=0;R.dash(c,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,stun:s.stun,stunCap:s.stunCap,knockback:s.knockback,onHit:(cc,t,res)=>{if(res.valid&&t.id!==999){hits++;R.shield(cc,cc.owner,Math.min(s.shieldCap,s.shield+(hits-1)*s.shieldPerExtra),s.shieldDuration);}}});},'rect'),
        {basicSummary:'근접 영혼 검격 · 스킬 적중 시 별도 흡수 보호막'});
    // B01: lower-rank short-range hook, no arrival stun.
    add('emoji-039','다이너마이트','B','원거리형',{},
        {kind:'lob',shape:'target',cooldown:frames(11),range:740,radius:205,innerRadius:92,damage:29,centerDamage:47,flightFrames:48,duration:48,knockback:8,color:'#f97316',emoji:'🧨',caps:{...aoeCaps,cc:true,signatureRange:true},
         description:'목표 지점을 표시한 뒤 0.8초 포물선 비행 후 한 번 폭발합니다. 중심부 피해가 더 크며 폭발 지점과 적 사이의 벽은 피해를 막습니다.',strength:'넓은 지점 폭격',success:'느린 착탄을 예측해 조준',failure:'피할 수 있는 긴 비행 시간',counterplay:'경고 원에서 이탈하거나 벽 뒤로 이동'},
        (ctx,s)=>{const start=copy(ctx.owner.pos),end=groundPoint(ctx,R.targetPoint(ctx,s.range),18);R.marker(ctx,{pos:end,shape:'circle',radius:s.radius,duration:s.flightFrames,color:s.color});R.entity(ctx,'lob',{pos:start,targetPos:end,endPos:end,radius:18,height:0,damage:0,cancelOnStun:false,duration:s.flightFrames,color:s.color,emoji:s.emoji,onEnd:(c,e,why)=>{if(why!=='expired')return;R.area(c,end,s.radius,t=>end.dist(t.pos)<=R.sized(c,s.innerRadius)?s.centerDamage:s.damage,{knockback:s.knockback,visual:false});R.confirmedBlast(c,end,s.radius,s.innerRadius,e.id,s.color);}},(c,e)=>{const t=Math.min(1,e.age/s.flightFrames);e.pos=new __brScope.Vec2(start.x+(end.x-start.x)*t,start.y+(end.y-start.y)*t);e.height=Math.sin(t*Math.PI)*125;});});
    // B03: exactly one target after preparation, stays close.
    add('emoji-042','뿅망치','B','탱커',melee('hammer',{rangeBonus:92,halfAngle:.96,cooldownScale:1.18,damageScale:1.08,pushScale:.2}),
        {kind:'hammer',shape:'rect',cooldown:frames(10),windup:16,range:168,width:115,damage:28,stun:60,stunCap:78,knockback:1,color:'#fde68a',caps:{damage:true,area:true,expandable:true,cc:true},
         description:'짧은 준비 후 전방 한 명에게 망치를 내려쳐 1초 기절시킵니다. 일반 공격에는 기절이 없고 적을 멀리 밀지 않습니다.',strength:'가까운 한 명을 확실히 제어',success:'준비가 끝날 때 전방 적 유지',failure:'대상 한 명과 짧은 사거리',counterplay:'측면 이동과 사거리 이탈'},
        (ctx,s)=>prepared(ctx,s,c=>R.front(c,{range:s.range,width:s.width,damage:s.damage,maxTargets:1,stun:s.stun,stunCap:s.stunCap,knockback:s.knockback}),'rect'));
    // B04: explosion-only dash; no startup or contact damage.
    add('emoji-043','로켓 점프','B','기동형',melee('punch',{pushScale:.28}),
        {kind:'rocket-dash',shape:'dash',cooldown:frames(12),range:1030,width:72,speed:14,radius:175,damage:43,knockback:11,color:'#fb923c',caps:{...dashCaps,area:true},
         description:'긴 사거리의 로켓 돌진으로 첫 적·벽·종점에서 멈추고 한 번만 폭발합니다. 출발과 접촉 자체에는 추가 피해가 없습니다.',strength:'긴 진입 거리와 착탄 폭발',success:'실제 종료 위치에 적 모으기',failure:'느리고 방향이 고정된 돌진',counterplay:'돌진 옆으로 피하거나 벽으로 막기'},
        (ctx,s)=>R.dash(ctx,{range:s.range,speed:s.speed,width:s.width,damage:0,knockback:0,stun:0,stopOnEnemy:true,onEnd:(c,e,reason)=>{if(['expired','hit','wall','range'].includes(reason))R.area(c,copy(c.owner.pos),s.radius,s.damage,{knockback:s.knockback});}}));
    // B05: bounded slow-only trail. Movement remains possible; no repeated stuns.
    add('emoji-044','스노우보더','B','기동형',melee('punch',{pushScale:.25}),
        {kind:'ice-dash',shape:'dash',cooldown:frames(10),range:590,width:66,speed:23,damage:17,knockback:3,trailRadius:73,trailDuration:150,trailInterval:6,trailCap:5,slow:.68,slowDuration:18,color:'#7dd3fc',caps:{...dashCaps,duration:true,trap:true},
         description:'돌진 경로에 최대 5개의 빙판을 남겨 적의 이동속도를 늦춥니다. 공격·스킬은 사용할 수 있고 여러 빙판의 감속을 곱하지 않습니다.',strength:'이탈 경로를 느리게 만들기',success:'추격자의 진행선에 빙판 남기기',failure:'기절과 큰 피해 없음',counterplay:'빙판 옆으로 돌아가기'},
        (ctx,s)=>{const dash=R.dash(ctx,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,knockback:s.knockback,stun:0});R.entity(ctx,'ice-trail-emitter',{pos:copy(ctx.owner.pos),duration:dash.duration+2,hidden:true},(c,e)=>{if(dash.dead){R.end(e,'completed');return;}if(e.age%s.trailInterval===0)R.zone(c,{pos:copy(c.owner.pos),kind:'ice-trail',radius:s.trailRadius,damage:0,duration:s.trailDuration,tickEvery:6,slow:s.slow,slowDuration:s.slowDuration,maxPerOwner:s.trailCap,color:s.color});});});
    // B06: first bounce accelerates exactly once; no basic-attack acceleration.
    add('emoji-045','테니스 챔피언','B','원거리형',{},
        {kind:'bounce',shape:'line',cooldown:frames(8),range:1120,radius:15,speed:21,damage:27,count:1,countCap:4,bounces:3,bounceSpeedBonus:1.45,duration:100,knockback:4,color:'#bef264',emoji:'🎾',caps:{...projectileCaps,multicast:true,cc:true},
         description:'스킬 테니스공이 첫 벽 반사 때만 45% 빨라집니다. 최대 3회 반사하며 전체 거리와 수명이 제한됩니다. 일반 공격에는 가속이 없습니다.',strength:'벽 각도를 이용한 빠른 사격',success:'첫 반사 경로를 예측',failure:'벽이 없으면 가속 없음',counterplay:'반사각을 피하고 열린 곳에서 교전'},
        (ctx,s)=>{const n=liveCount(ctx,s);for(let i=0;i<n;i++)shot(ctx,s,{dir:rotate(ctx.aim,(i-(n-1)/2)*.08),bounces:s.bounces,duration:s.duration,onBounce:(c,e)=>{if(!e.tennisAccelerated){e.tennisAccelerated=true;e.speed*=s.bounceSpeedBonus;}}});});
    // B07: one big ball, one directional knockback, no blast.
    add('emoji-047','파워 슛','B','원거리형',{knockback:4},
        {kind:'power-shot',shape:'line',cooldown:frames(9),range:900,radius:32,speed:23,damage:30,knockback:27,color:'#f8fafc',emoji:'⚽',caps:{...projectileCaps,cc:true},
         description:'큰 축구공 한 발이 첫 적을 진행 방향으로 크게 밀어낸 뒤 사라집니다. 폭발·기절은 없습니다.',strength:'한 명의 위치를 크게 바꿈',success:'방향을 잡고 공 한 발 적중',failure:'비관통 단발',counterplay:'공 옆으로 회피 또는 엄폐'},
        (ctx,s)=>shot(ctx,s));
    // B08: impact/explosion are one damage route.
    add('emoji-072','탄산 폭탄','B','원거리형',{},
        {kind:'soda-bomb',shape:'line',cooldown:frames(9),range:720,radius:22,speed:15,damage:19,blastRadius:220,knockback:25,color:'#67e8f9',emoji:'🥤',caps:{...projectileCaps,area:true,cc:true},
         description:'한 개의 탄산 폭탄이 터지며 넓은 범위의 적을 바깥쪽으로 크게 밀어냅니다. 살상력보다 거리 확보에 집중합니다.',strength:'넓은 범위의 거리 확보',success:'적이 가까이 모인 곳에 폭발',failure:'낮은 폭발 피해',counterplay:'폭발 반경 이탈'},
        (ctx,s)=>shot(ctx,s,{damage:0,knockback:0,onEnd:(c,e,why)=>{if(['hit','wall','range','expired'].includes(why))R.area(c,copy(e.pos),s.blastRadius,s.damage,{knockback:s.knockback});}}));
    // B09: real shields on up to two low-HP allies, self only if no other ally.
    add('emoji-102','보호술사','B','지원가',{},
        {kind:'team-shield',shape:'circle',cooldown:frames(11),radius:370,duration:210,shield:76,maxTargets:2,color:'#93c5fd',caps:{area:true,expandable:true,shield:true,duration:true,utility:true},
         description:'범위 안에서 HP 비율이 낮은 다른 아군 최대 2명에게 3.5초 흡수 보호막을 줍니다. 다른 아군이 없을 때만 자신을 보호합니다.',strength:'위험한 아군 우선 보호',success:'피격 직전 아군 가까이 사용',failure:'즉시 회복과 피해 감소 없음',counterplay:'보호막 만료 뒤 재공격'},
        (ctx,s)=>{let allies=R.allies(ctx,ctx.owner.pos,s.radius).filter(p=>p!==ctx.owner);if(!allies.length)allies=[ctx.owner];allies.sort((a,b)=>a.hp/Math.max(1,a.maxHp)-b.hp/Math.max(1,b.maxHp)||String(a.id).localeCompare(String(b.id)));for(const a of allies.slice(0,s.maxTargets))R.shield(ctx,a,s.shield,s.duration);buffRing(ctx,s);},
        {teamOnly:true});
    // C01-C04: simple projectiles with distinct trajectories; no hidden stun.
    add('emoji-074','슬리퍼 스나이퍼','C','원거리형',{},
        {kind:'precision',shape:'line',cooldown:frames(7),range:1100,radius:13,speed:38,damage:24,knockback:4,color:'#fda4af',emoji:'🥿',caps:projectileCaps,
         description:'빠르고 곧게 날아가는 슬리퍼 한 발을 발사합니다. 자동 추적·폭발·기절 없이 정확한 조준으로 승부합니다.',strength:'빠른 정밀 단발',success:'긴 직선 조준 적중',failure:'추적과 폭발 없음',counterplay:'엄폐와 방향 전환'},
        (ctx,s)=>shot(ctx,s));
    add('emoji-075','사과 투척','C','원거리형',{},
        {kind:'split-bounce',shape:'line',cooldown:frames(8),range:790,radius:20,speed:19,damage:21,bounces:1,fragmentCount:2,fragmentDamage:13,fragmentRadius:11,fragmentRange:400,fragmentSpeed:23,fragmentDuration:30,splitAngle:.28,knockback:3,color:'#f87171',emoji:'🍎',caps:projectileCaps,
         description:'사과 한 발이 첫 벽 반사 뒤 조각 2개로 나뉩니다. 원본은 사라지고 조각은 다시 분열하지 않습니다. 적에게 바로 맞으면 원본 피해만 줍니다.',strength:'벽 뒤 반사 각도에서 분열',success:'벽을 이용해 두 조각 적중',failure:'분열 조건과 짧은 조각 사거리',counterplay:'벽에서 떨어져 싸우기'},
        (ctx,s)=>shot(ctx,s,{bounces:1,onBounce:(c,e)=>{if(e.splitDone)return false;e.splitDone=true;for(const sign of [-1,1])R.projectile(c,{pos:copy(e.pos),dir:rotate(e.dir,sign*s.splitAngle),speed:s.fragmentSpeed,range:s.fragmentRange,radius:s.fragmentRadius,damage:s.fragmentDamage,knockback:s.knockback,duration:s.fragmentDuration,bounces:0,color:s.color,emoji:'🍎'});return false;}}));
    add('emoji-077','크루아상 부메랑','C','원거리형',{},
        {kind:'boomerang',shape:'line',cooldown:frames(8),range:620,radius:27,speed:12,returnSpeed:15,damage:21,duration:160,dwell:0,knockback:2,color:'#fbbf24',emoji:'🥐',caps:{...projectileCaps,signatureRange:true},
         description:'크고 느린 크루아상 한 개가 왕복 각각 한 번 타격합니다. 끝에서 머무르지 않고 현재 자신의 위치로 돌아옵니다.',strength:'넓고 읽기 쉬운 왕복 경로',success:'나가는 길과 돌아오는 길 적중',failure:'느린 탄속',counterplay:'복귀 경로 피하기'},
        (ctx,s)=>shot(ctx,s,{boomerang:true,dwell:0,returnSpeed:s.returnSpeed,duration:s.duration}));
    // C05: delayed attacker-indexed parry. No incoming damage -> no outgoing counter.
    add('emoji-092','팬테옹','C','원거리형',{},
        {kind:'counter-deferred',shape:'circle',cooldown:frames(8),duration:48,radius:90,damageReduction:.28,reflectRatio:.50,reflectRange:1400,color:'#cbd5e1',caps:{damage:true,duration:true,utility:true},
         description:'0.8초 패리 중 피해가 28% 줄고, 실제 잃은 HP를 공격자별로 기록했다가 종료 시 각 공격자에게 50%씩 한 번 반환합니다. 중단 시 반환하지 않습니다.',strength:'짧은 타이밍의 되받아치기',success:'직접 공격 순간 패리',failure:'무피해·중단 시 반환 없음',counterplay:'패리 종료 뒤 공격'},
        (ctx,s)=>{R.buff(ctx,ctx.owner,'damageReduction',s.damageReduction,s.duration);R.buff(ctx,ctx.owner,'counterDeferred',s.reflectRatio,s.duration,{range:s.reflectRange,cancelOnStun:true});buffRing(ctx,s);});
    // C06: team basic haste only. Shared family with the A support's basic haste.
    add('emoji-105','응원단장','C','지원가',{},
        {kind:'team-basic-haste',shape:'circle',cooldown:frames(10),radius:390,duration:180,attackHaste:1.3,color:'#fde68a',caps:{area:true,expandable:true,duration:true,utility:true},
         description:'주변 아군의 일반 공격 속도만 3초 동안 30% 올립니다. 회복과 스킬 대기시간·준비시간 가속은 없습니다.',strength:'팀 일반 공격 집중 강화',success:'평타 교전 직전 아군에게 사용',failure:'스킬과 회복 지원 없음',counterplay:'버프 중 평타 사거리 이탈'},
        (ctx,s)=>{for(const a of R.allies(ctx,ctx.owner.pos,s.radius))R.buff(ctx,a,'teamBasicHaste',s.attackHaste,s.duration);buffRing(ctx,s);},
        {teamOnly:true});
    // C07: preparation shield is unconditional, unlike Soul Swordsman's hit shield.
    add('emoji-113','게렌','C','탱커',melee('punch',{pushScale:.45,reward:'guard'}),
        {kind:'guard-strike',shape:'circle',cooldown:frames(9),radius:150,damage:15,knockback:6,shield:66,shieldDuration:150,duration:150,color:'#93c5fd',caps:{...aoeCaps,cc:true,shield:true,duration:true},
         description:'스킬 사용 즉시 2.5초 흡수 보호막을 얻고 가까운 적을 가볍게 제압합니다. 스킬 적중 여부와 무관하게 보호막을 준비합니다.',strength:'공격 전에 방어 준비',success:'접근 직전 보호막 사용',failure:'짧은 범위와 낮은 피해',counterplay:'보호막이 끝날 때 집중 공격'},
        (ctx,s)=>{R.shield(ctx,ctx.owner,s.shield,s.shieldDuration);R.area(ctx,copy(ctx.owner.pos),s.radius,s.damage,{knockback:s.knockback,stun:0});},
        {basicSummary:'근접 집게 타격 · 평타의 짧은 고유 방어는 별도 출처로 유지'});
    // C08: a true forward rectangle and one shared sweep direction.
    add('emoji-121','청소반장','C','근접형',melee('slash',{rangeBonus:103,halfAngle:1.05,pushScale:.28}),
        {kind:'directional-sweep',shape:'rect',cooldown:frames(8),windup:10,range:235,width:210,damage:14,knockback:27,color:'#c4b5fd',caps:{damage:true,area:true,expandable:true,cc:true},
         description:'전방 직사각형을 쓸어 맞은 적 모두를 조준 방향으로 밀어냅니다. 옆·뒤·벽 너머의 적은 맞지 않습니다.',strength:'전방 다수의 방향성 밀침',success:'보호할 아군 앞에서 쓸기',failure:'옆과 뒤는 무방비',counterplay:'측면 진입 또는 범위 밖 공격'},
        (ctx,s)=>prepared(ctx,s,c=>R.front(c,{range:s.range,width:s.width,damage:s.damage,maxTargets:30,knockback:s.knockback,direction:c.aim,stun:0}),'rect'),
        {statType:'MELEE',basicSummary:'근접 빗자루 쓸기 · 투사체 일반 공격 없음',stats:{hpMultiplier:1.02}});
    // C09: direct impact represented by a single small blast; then one thorn zone.
    add('emoji-122','통조림 투척','C','원거리형',{},
        {kind:'thorn-pot',shape:'line',cooldown:frames(9),range:975,radius:22,speed:15,damage:11,blastRadius:78,thornRadius:122,thornDamage:3.8,thornInterval:30,duration:120,zoneCap:1,knockback:2,color:'#86efac',emoji:'🥫',caps:{...projectileCaps,area:true,trap:true,duration:true},
         description:'통조림이 깨지며 작은 폭발과 2초 가시 지대 하나를 남깁니다. 가시 지대는 소유자당 1개이며 기절시키지 않습니다.',strength:'짧은 길목 압박',success:'좁은 이동 경로에 통조림 깨기',failure:'낮은 즉시 피해',counterplay:'가시 지대 밖으로 이동'},
        (ctx,s)=>shot(ctx,s,{damage:0,knockback:0,onEnd:(c,e,why)=>{if(!['hit','wall','range','expired'].includes(why))return;R.area(c,copy(e.pos),s.blastRadius,s.damage,{knockback:s.knockback});R.zone(c,{pos:copy(e.pos),kind:'thorns',radius:s.thornRadius,damage:s.thornDamage,duration:s.duration,tickEvery:s.thornInterval,maxPerOwner:s.zoneCap,color:s.color});}}));
    // C10: three visible, armed, one-trigger traps, never auto-detonating on replacement.
    add('emoji-126','압정 난사','C','원거리형',{},
        {kind:'pin-traps',shape:'line',cooldown:frames(10),range:600,radius:25,damage:15,count:3,countCap:3,duration:480,armFrames:18,trapCap:3,color:'#fda4af',emoji:'📌',caps:{damage:true,trap:true,duration:true,utility:true,signatureRange:true},
         description:'조준한 직선에 압정 함정 3개를 놓습니다. 0.3초 후 활성화되고 각각 한 번만 피해를 준 뒤 사라집니다. 최대 3개·수명 8초입니다.',strength:'적의 진입 경로에 준비',success:'적이 지나는 선에 함정 설치',failure:'설치 지연과 제한된 개수',counterplay:'보이는 함정을 우회'},
        (ctx,s)=>{for(let i=1;i<=s.count;i++){const own=R.world(ctx.g).entities.filter(e=>!e.dead&&e.kind==='pin-trap'&&e.ctx.ownerId===ctx.ownerId);while(own.length>=s.trapCap)R.end(own.shift(),'replaced');const raw=ctx.owner.pos.add(ctx.aim.mult(R.ranged(ctx,s.range)*ctx.aimRangeFactor*i/(s.count+1))),pos=groundPoint(ctx,raw,R.sized(ctx,s.radius));R.entity(ctx,'pin-trap',{pos,radius:R.sized(ctx,s.radius),damage:s.damage,duration:R.duration(ctx,s.duration),armFrames:s.armFrames,maxPerOwner:s.trapCap,cancelOnStun:false,trap:true,color:s.color,emoji:s.emoji},(c,e)=>{if(e.age<s.armFrames)return;for(const t of R.enemies(c,e.pos,e.radius+85)){if(e.pos.dist(t.pos)>e.radius+Number(t.radius||0))continue;if(c.g.checkWallBetween(e.pos,t.pos))continue;const hit=R.hit(c,t,s.damage,{knockback:0,stun:0});if(hit.valid){R.end(e,'hit');break;}}});}});
    // C11: the simplest short dash, nothing is spawned behind it.
    add('emoji-127','롤러스케이트','C','기동형',melee('punch',{pushScale:.25}),
        {kind:'simple-dash',shape:'dash',cooldown:frames(7),range:370,width:64,speed:23,damage:17,knockback:5,kickWindow:120,kickPush:1.45,color:'#f9a8d4',caps:dashCaps,
         description:'직선 돌진으로 접촉한 적에게 작은 피해와 밀침을 줍니다. 돌진 종료 후 2초 안에 시도한 다음 평타는 첫 유효 대상의 넉백이 45% 증가합니다. 빗나가도 사용됩니다.',strength:'간단한 진입과 이탈',success:'필요한 방향으로 짧게 이동',failure:'추가 피해 수단 없음',counterplay:'벽과 측면 회피'},
        (ctx,s)=>R.dash(ctx,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,knockback:s.knockback,stun:0,
            onEnd(c,e,reason){if(['range','wall','hit','expired'].includes(reason)&&R.validContext(c))
                R.buff({...c,run:{...c.run,duration:1}},c.owner,'rollerKick',s.kickPush,s.kickWindow);}
        }));
    // F: clear, modest identities rather than disguised high-rank effects.
    add('emoji-050','민달팽이','F','탱커',melee('punch',{cooldownScale:1.14,damageScale:.9,pushScale:.2}),
        {kind:'shell',shape:'circle',cooldown:frames(8),duration:150,radius:65,damageReduction:.32,color:'#a3e635',caps:{duration:true,utility:true},
         description:'2.5초 동안 등껍질로 받는 피해를 32% 줄입니다. 흡수 보호막·회복·공격·기절 효과는 없습니다.',strength:'단순한 방어 타이밍',success:'집중 공격 전에 등껍질 사용',failure:'낮은 기동과 공격 보상 없음',counterplay:'등껍질이 끝난 뒤 공격'},
        (ctx,s)=>{R.buff(ctx,ctx.owner,'damageReduction',s.damageReduction,s.duration);buffRing(ctx,s);});
    add('emoji-056','비눗방울 놀이','F','원거리형',{type:'missile',homingTurnRate:.025},
        {kind:'bubble',shape:'line',cooldown:frames(7),range:590,radius:30,speed:7,damage:10,stun:30,stunCap:42,knockback:0,color:'#a5f3fc',emoji:'🫧',caps:{...projectileCaps,cc:true},
         description:'느리고 약하게 유도되는 큰 방울 · 피해 10.3 · 0.5초 기절. 평타도 약한 유도이며 기절 없음.',strength:'맞혔을 때 확실한 짧은 제어',success:'느린 방울을 이동 경로에 맞히기',failure:'쉽게 피할 수 있는 속도',counterplay:'방울 옆으로 움직이기'},
        (ctx,s)=>shot(ctx,s,{homing:true,turnRate:.025,homingCone:Math.cos(1.22)}));
})(__brScope.BRRework);}]
];
