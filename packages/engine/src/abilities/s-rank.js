// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){

}
export const initializers=[
[305,__brScope=>{(function registerSRework(R) {
    'use strict';
    const melee = (extra) => Object.assign({close:true,rangeBonus:86,halfAngle:1.18,cooldownScale:1,damageScale:1,pushScale:.28,stun:0,reward:'',style:'slash'},extra||{});
    const point = (p) => ({x:p.x,y:p.y});
    const caps = (extra) => Object.assign({damage:true,projectile:false,multicast:false,expandable:true,area:false,cc:false,heal:false,shield:false,dash:false,summon:false,trap:false,duration:false,utility:false,signatureRange:false,signatureDuration:false},extra||{});
    function register(id, name, role, basic, skill, handler, extra) {
        skill.key='rework-'+id;
        skill.label=skill.label||name;
        skill.cooldown=skill.cooldownFrames;
        skill.duration=skill.durationFrames||0;
        skill.windup=skill.windupFrames||0;
        skill.interval=skill.intervalFrames||0;
        skill.stun=skill.stunFrames||0;
        skill.caps=skill.capabilities;
        skill.units={time:'frames@60Hz',distance:'world units',width:'full width',speed:'world units/frame',damage:'base coefficient before rank/run modifiers'};
        skill.cancelPolicy=skill.cancelPolicy||'death/life change/match reset cancel; hard control cancels active windup, burst, dash, orbit, hook and channel';
        const def=Object.assign({referenceName:name,rank:'S',role,category:role,basic:basic||{},skill},extra||{});
        R.register(id,def,function(ctx){return handler(ctx,skill);});
    }
    function shots(ctx,skill,fire) {
        const count=R.count(ctx,skill.count,skill.countCap);
        const last=(count-1)*skill.intervalFrames+skill.windupFrames;
        R.lock(ctx,{attack:true,moveScale:.82},last+1);
        for(let i=0;i<count;i++)R.schedule(ctx,skill.windupFrames+i*skill.intervalFrames,function(){fire(i,count);},{cancelOnStun:true});
    }
    function impactExpiry(reason){return reason==='hit'||reason==='impact'||reason==='wall'||reason==='range'||reason==='expired';}

    register('emoji-000','용의 분노','원거리형',{}, {
        kind:'fireball',shape:'line',cooldownFrames:1020,range:940,width:68,radius:150,speed:10,damage:76,count:1,countCap:1,knockback:18,
        zoneDamage:8,zoneRadius:150,durationFrames:150,intervalFrames:30,maxPerOwner:2,
        description:'느린 거대 화염구 1발 · 충돌/종점 폭발 79.8 · 2.5초 화염(0.5초마다 8.4, 최대 2곳) · 기절 없음',
        capabilities:caps({projectile:true,area:true,duration:true,cc:true})
    },function(c,s){
        R.projectile(c,{speed:s.speed,range:s.range,radius:s.width/2,damage:0,knockback:0,stun:0,color:'#f97316',emoji:'🔥',
            onEnd:function(ctx,e,reason){if(!impactExpiry(reason)||e.reworkDetonated)return;e.reworkDetonated=true;
                R.area(ctx,e.pos,s.radius,s.damage,{knockback:s.knockback,stun:0,color:'#fb923c',style:'fire-impact'});
                R.zone(ctx,{pos:point(e.pos),radius:s.zoneRadius,damage:s.zoneDamage,duration:s.durationFrames,tickEvery:s.intervalFrames,maxPerOwner:2,kind:'fire',color:'#f97316'});
            }});
    });

    register('emoji-001','천둥군주','암살자',melee({halfAngle:.95,cooldownScale:1.08,damageScale:1.08}),{
        kind:'thunder-landing',shape:'target',cooldownFrames:1020,range:700,radius:245,damage:72,windupFrames:18,stunFrames:90,stunCap:120,knockback:5,
        description:'0.3초 착지 예고 후 조준 지점 강림 · 반경 245 피해 72 · 1.5초 기절(강화 상한 2초)',
        capabilities:caps({area:true,cc:true,dash:true,signatureRange:true})
    },function(c,s){
        const destination=R.safe(c.g,R.targetPoint(c,s.range),c.owner.radius,c.owner);
        R.marker(c,{pos:destination,shape:'circle',radius:s.radius,duration:s.windupFrames,color:'#facc15'});
        R.schedule(c,s.windupFrames,function(){R.teleport(c,destination);R.area(c,c.owner.pos,s.radius,s.damage,{stun:s.stunFrames,stunCap:s.stunCap,knockback:s.knockback,style:'thunder-landing',color:'#fde047'});},{cancelOnStun:true});
    });

    register('emoji-002','우주 납치범','근접형',melee({style:'capture',pushScale:.12}),{
        kind:'hook',shape:'line',cooldownFrames:990,range:1320,width:38,speed:38,damage:52,count:1,countCap:1,stunFrames:36,stunCap:48,
        description:'최장거리 포획탄 · 첫 적을 고정된 앞 지점으로 끌어옴 · 도착 후 0.6초 기절 · 벽 차단',
        capabilities:caps({projectile:true,cc:true,signatureRange:true})
    },function(c,s){R.hook(c,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,maxTargets:1,arrivalStun:s.stunFrames,stunCap:s.stunCap,color:'#67e8f9',emoji:'🛸'});},
    {statType:'MELEE',tankRole:false,basicSummary:'근접 포획 타격',stats:{maxHp:600,speed:2.0}});

    register('emoji-003','대마법사','원거리형',{}, {
        kind:'sequential-barrage',shape:'line',cooldownFrames:1200,range:1110,width:38,speed:30,damage:11,count:14,countCap:22,intervalFrames:4,windupFrames:10,finalDamage:17,finalRadius:26,knockback:1.5,
        description:'짧은 집중 후 같은 방향으로 14발 순차 연사(4프레임 간격) · 마지막 강화탄 · 기본 피해 160 · 쿨타임 20초',
        capabilities:caps({projectile:true,multicast:true,cc:true})
    },function(c,s){shots(c,s,function(i,count){R.projectile(c,{dir:c.aim,speed:s.speed,range:s.range,radius:i===count-1?s.finalRadius:s.width/2,damage:i===count-1?s.finalDamage:s.damage,knockback:s.knockback,stun:0,shotIndex:i,color:'#a78bfa',emoji:'🔮'});});});

    register('emoji-004','공허 암살자','암살자',melee({halfAngle:.95,cooldownScale:1.08,damageScale:1.08}),{
        kind:'blink-finisher',shape:'target',cooldownFrames:900,range:680,radius:135,damage:68,executeThreshold:.35,executeBonus:54,count:1,countCap:1,knockback:2,
        description:'조준 지점으로 순간이동 · 착지 반경 135의 적 1명에게 68 · HP 35% 이하라면 추가 54(즉사 아님)',
        capabilities:caps({area:true,dash:true,cc:true,signatureRange:true})
    },function(c,s){
        R.teleport(c,R.targetPoint(c,s.range));
        const enemies=R.enemies(c,c.owner.pos,s.radius).filter(function(target){return R.visible(c,target,c.owner.pos);}).sort(function(a,b){return Math.hypot(a.pos.x-c.owner.pos.x,a.pos.y-c.owner.pos.y)-Math.hypot(b.pos.x-c.owner.pos.x,b.pos.y-c.owner.pos.y)||String(a.id).localeCompare(String(b.id));});
        if(enemies.length){const target=enemies[0],bonus=target.hp/target.maxHp<=s.executeThreshold?s.executeBonus:0;R.hit(c,target,s.damage+bonus,{knockback:s.knockback,stun:0,style:'finisher'});}
    });

    register('emoji-006','검성','근접형',melee(),{
        kind:'orbit-finisher',shape:'circle',cooldownFrames:1080,range:200,radius:150,damage:17,durationFrames:180,intervalFrames:24,count:4,countCap:4,finisherDamage:60,finisherRange:260,finisherWidth:200,knockback:2,
        description:'3초 회전 검 · 동일 대상 0.4초 간격 피해 17 · 자연 종료 때 현재 방향 마지막 베기 60 · 기절 없음',
        capabilities:caps({area:true,duration:true,cc:true,signatureDuration:true})
    },function(c,s){R.orbit(c,{duration:s.durationFrames,radius:s.radius,damage:s.damage,tickEvery:s.intervalFrames,count:s.count,knockback:s.knockback,color:'#cbd5e1',
        onEnd:function(ctx,e,reason){if(reason!=='expired')return;const next=Object.assign({},ctx,{aim:ctx.owner.lastAimDir||ctx.aim});R.front(next,{range:s.finisherRange,width:s.finisherWidth,damage:s.finisherDamage,knockback:10,stun:0,color:'#f8fafc'});}});});

    register('emoji-007','폴아웃','원거리형',{}, {
        kind:'nuclear-pulse',shape:'circle',cooldownFrames:1140,radius:290,range:0,damage:82,windupFrames:36,knockback:17,
        zoneRadius:245,zoneDamage:7,durationFrames:150,intervalFrames:30,deathDamage:30,deathRadius:180,
        description:'0.6초 고정 원형 경고 후 방사능 폭발 86.1 · 2.5초 오염(0.5초마다 7.35) · 사망 폭발은 30, 생명당 1회',
        capabilities:caps({area:true,duration:true,cc:true})
    },function(c,s){
        const center=point(c.owner.pos);
        R.marker(c,{pos:center,shape:'circle',radius:s.radius,duration:s.windupFrames,color:'#a3e635'});
        R.schedule(c,s.windupFrames,function(){R.area(c,center,s.radius,s.damage,{knockback:s.knockback,stun:0,color:'#bef264'});R.zone(c,{pos:center,radius:s.zoneRadius,damage:s.zoneDamage,duration:s.durationFrames,tickEvery:s.intervalFrames,maxPerOwner:1,kind:'radiation',color:'#84cc16'});},{cancelOnStun:true});
    },{onDeath:function(c){if(c.owner._rwFalloutDeathLife===c.ownerLifeSeq)return;c.owner._rwFalloutDeathLife=c.ownerLifeSeq;c.allowPosthumous=true;R.area(c,c.owner.pos,180,30,{knockback:7,stun:0,color:'#a3e635',style:'death-pulse'});}});

    register('emoji-008','폴터가이스트','원거리형',{}, {
        kind:'ghost-ambush',shape:'self',cooldownFrames:840,range:0,damage:0,durationFrames:150,ambushMultiplier:1.6,ambushWindowFrames:360,
        description:'2.5초 은신 이동 · 첫 일반 공격 시도만 피해 1.6배(빗나가도 소비) · 공격 시 실체화 · 벽 통과 유지, 무적 아님',
        capabilities:caps({damage:false,expandable:false,duration:true,utility:true,signatureDuration:true})
    },function(c,s){R.buff(c,c.owner,'ghost',1,s.durationFrames);R.buff(c,c.owner,'ambush',s.ambushMultiplier,s.ambushWindowFrames);});

    register('emoji-010','블랙홀','설치형',{}, {
        kind:'gravity-field',shape:'target',cooldownFrames:1140,range:700,radius:170,pullRadius:330,collapseRadius:225,damage:8,collapseDamage:62,pull:1.1,durationFrames:210,intervalFrames:30,maxPerOwner:1,
        description:'3.5초 중력장 1개 · 외곽 330 약한 흡입 / 내부 170 틱 피해 8.24 · 자연 종료 때 반경 225 붕괴 63.86',
        capabilities:caps({area:true,duration:true,cc:true,trap:true,signatureDuration:true})
    },function(c,s){R.zone(c,{pos:R.targetPoint(c,s.range),radius:s.radius,pullRadius:s.pullRadius,collapseRadius:s.collapseRadius,damage:s.damage,duration:s.durationFrames,tickEvery:s.intervalFrames,pull:s.pull,maxPerOwner:1,kind:'gravity',color:'#8b5cf6',
        onEnd:function(ctx,e,reason){if(reason==='expired')R.area(ctx,e.pos,s.collapseRadius,s.collapseDamage,{stun:0,knockback:4,color:'#c4b5fd',style:'gravity-collapse'});}});});

    register('emoji-012','지니','설치형',{}, {
        kind:'turret',shape:'target',cooldownFrames:420,range:250,radius:31,damage:15,heavyDamage:27,turretRange:780,turretCooldownFrames:42,turretHp:__brScope.ROSTER10_BALANCE.genieHp,durationFrames:__brScope.ROSTER10_BALANCE.genieTicks,maxPerOwner:3,count:3,countCap:3,
        description:'HP 56 포탑 설치 · 동시 3개 / 각 24초 · 4번째는 가장 오래된 포탑 교체 · 4회마다 강화탄',
        capabilities:caps({expandable:false,summon:true,duration:true,signatureRange:true,signatureDuration:true})
    },function(c,s){R.turret(c,{pos:R.targetPoint(c,s.range),radius:s.radius,hp:s.turretHp,duration:s.durationFrames,maxPerOwner:3,range:s.turretRange,damage:s.damage,heavyDamage:s.heavyDamage,cooldown:s.turretCooldownFrames,color:'#fbbf24'});});

    register('emoji-013','블러드로드','근접형',melee({cooldownScale:.91,damageScale:.91,pushScale:.16,lifesteal:.20,style:'blood'}),{
        kind:'blood-pulse',shape:'circle',cooldownFrames:960,range:0,radius:260,damage:84,windupFrames:24,costCurrentHp:.15,lifesteal:.40,healCapMaxHp:.25,knockback:3,
        description:'현재 HP 15% 비용(최소 HP 1) · 0.4초 준비 후 혈격 84 · 실제 HP 피해의 40% 회복, 시전당 최대 HP 25% 상한(회복 증강도 상한 유지)',
        capabilities:caps({area:true,heal:true,cc:true})
    },function(c,s){
        c.owner.hp=Math.max(1,c.owner.hp*(1-s.costCurrentHp));
        R.marker(c,{shape:'circle',radius:s.radius,duration:s.windupFrames,followOwner:true,color:'#ef4444'});
        R.schedule(c,s.windupFrames,function(){
            let restored=0;
            R.area(c,c.owner.pos,s.radius,s.damage,{stun:0,knockback:s.knockback,color:'#f43f5e',style:'blood-pulse',onHit:function(ctx,target,result){
                if(target.isReworkTurret||target.reworkTurret||target.kind==='turret')return;
                const hpDamage=Number(result&&result.hpDamage||0);
                const restore=Math.max(.01,Number(ctx.run.restore??1));
                const raw=Math.min(Math.max(0,ctx.owner.maxHp*s.healCapMaxHp-restored)/restore,hpDamage*s.lifesteal);
                if(raw>0)restored+=R.heal(ctx,ctx.owner,raw);
            }});
        },{cancelOnStun:true});
    },{statType:'MELEE',tankRole:false,basicSummary:'피의 근접 베기 · 실제 HP 피해 20% 흡혈',stats:{maxHp:465,speed:2.1}});

    register('emoji-014','역병군주','설치형',{}, {
        kind:'growing-poison',shape:'target',cooldownFrames:1020,range:690,radius:110,maxRadius:310,growFrames:150,damage:10,durationFrames:300,intervalFrames:30,maxPerOwner:1,
        description:'5초 독구름 1개 · 2.5초간 반경 110→310 확장 · 현재 범위에서 0.5초마다 피해 10.3 · 기절 없음',
        capabilities:caps({area:true,duration:true,trap:true,signatureDuration:true})
    },function(c,s){R.zone(c,{pos:R.targetPoint(c,s.range),radius:s.radius,maxRadius:s.maxRadius,growFrames:s.growFrames,damage:s.damage,duration:s.durationFrames,tickEvery:s.intervalFrames,maxPerOwner:1,kind:'poison',color:'#65a30d'});});

    register('emoji-019','폭주기관차','근접형',melee({style:'punch',cooldownScale:1.12,damageScale:1.1,pushScale:.30}),{
        kind:'train-charge',shape:'rect',cooldownFrames:1200,range:1480,width:150,speed:36,damage:92,windupFrames:24,knockback:44,count:1,countCap:1,
        description:'0.4초 출발 예고 후 80~1480 거리 선택(탭 220) 직선 관통 돌진 · 대상별 피해 92 한 번과 강한 밀침 · 벽에서 정지, 기절 없음',
        capabilities:caps({area:true,dash:true,cc:true,signatureRange:true})
    },function(c,s){R.lock(c,{move:true,attack:true},s.windupFrames);R.marker(c,{shape:'rect',range:s.range,width:s.width,duration:s.windupFrames,color:'#f59e0b'});R.schedule(c,s.windupFrames,function(){R.dash(c,{range:s.range,speed:s.speed,width:s.width,damage:s.damage,knockback:s.knockback,stun:0,stopOnEnemy:false,color:'#f59e0b'});},{cancelOnStun:true});},
    {statType:'MELEE',tankRole:false,basicSummary:'무거운 차체 근접 타격',stats:{maxHp:620,speed:1.9}});

    register('emoji-020','초신성','원거리형',{}, {
        kind:'radial-waves',shape:'circle',cooldownFrames:1020,range:780,width:32,speed:19,damage:24,count:6,countCap:10,waves:2,intervalFrames:21,knockback:7,
        description:'자신 중심 별 6방향 파동을 0.35초 간격으로 2회 · 탄당 피해 25.2 · 개수 증강은 파동당 방향 수(최대 10)',
        capabilities:caps({projectile:true,multicast:true,area:true,cc:true})
    },function(c,s){
        const count=R.count(c,s.count,s.countCap),baseAngle=Math.atan2(c.aim.y,c.aim.x);
        for(let wave=0;wave<s.waves;wave++)R.schedule(c,wave*s.intervalFrames,function(){
            __brScope.brSmokeAttack(c,true);for(let i=0;i<count;i++){const angle=baseAngle+i*Math.PI*2/count+(wave?Math.PI/count:0);R.projectile(c,{pos:point(c.owner.pos),dir:{x:Math.cos(angle),y:Math.sin(angle)},range:s.range,speed:s.speed,radius:s.width/2,damage:s.damage,pierce:true,knockback:s.knockback,stun:0,shotIndex:wave*count+i,color:'#fde047',emoji:'🌟'});}
        },{cancelOnStun:true});
    });

    register('emoji-022','요요 마스터','원거리형',{}, {
        kind:'yoyo',shape:'line',cooldownFrames:960,range:1040,width:42,speed:27,damage:42,count:1,countCap:1,dwellFrames:18,durationFrames:240,knockback:5,
        description:'긴 요요 왕복 · 끝점 0.3초 체류 후 현재 위치로 복귀 · 나갈 때/돌아올 때 각각 피해 44.1 한 번 · 기절 없음',
        capabilities:caps({projectile:true,cc:true})
    },function(c,s){R.projectile(c,{range:s.range,speed:s.speed,radius:s.width/2,damage:s.damage,boomerang:true,dwell:s.dwellFrames,duration:s.durationFrames,knockback:s.knockback,stun:0,color:'#f472b6',emoji:'🪀'});});

    register('emoji-037','구급차','근접형',melee({style:'punch',pushScale:.22}),{
        kind:'self-regeneration',shape:'self',cooldownFrames:960,range:0,damage:0,durationFrames:240,intervalFrames:30,healFractionPerTick:.04,healFractionTotal:.32,
        description:'4초 자가 재생 · 0.5초마다 최대 HP 4%(총 32%) · 기절 중 신규 시전 불가, 승인된 재생은 지속',
        cancelPolicy:'death/life change/match reset cancel; an already approved regeneration continues during stun',
        capabilities:caps({damage:false,expandable:false,heal:true,duration:true,utility:true,signatureDuration:true})
    },function(c,s){R.buff(c,c.owner,'regen',c.owner.maxHp*s.healFractionPerTick,s.durationFrames);},
    {statType:'MELEE',tankRole:false,basicSummary:'구급차 근접 타격',stats:{maxHp:390,speed:2.15}});

    register('emoji-085','심연의 눈','원거리형',{close:false,type:'missile',speed:19,damageScale:1.10,count:1,stun:0,status:null,statusPower:0,homingTurnRate:.045}, {
        kind:'homing-eyes',shape:'line',cooldownFrames:1080,range:1110,width:48,speed:22,damage:27,count:4,countCap:6,spread:.10,turnRate:.052,homingCone:Math.cos(1.18),stunFrames:45,stunCap:60,knockback:2,
        description:'큰 유도 마안 4발 · 탄당 피해 27.81 · 대상별 시전당 1회 0.75초 기절 · 회전 상한/벽/은신/사거리 적용',
        capabilities:caps({projectile:true,multicast:true,cc:true})
    },function(c,s){const count=R.count(c,s.count,s.countCap),base=Math.atan2(c.aim.y,c.aim.x);for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*s.spread;R.projectile(c,{dir:{x:Math.cos(a),y:Math.sin(a)},speed:s.speed,range:s.range,radius:s.width/2,damage:s.damage,homing:true,homingCone:s.homingCone,turnRate:s.turnRate,stun:s.stunFrames,stunCap:s.stunCap,knockback:s.knockback,shotIndex:i,color:'#818cf8',emoji:'🧿'});}});

    register('emoji-098','성역술사','지원가',{}, {
        kind:'sanctuary-cleanse',shape:'circle',cooldownFrames:1140,range:0,radius:510,damage:0,healFraction:.28,cleanse:['stun','slow','poison','bleed','hostile-mark'],countCap:1,
        description:'반경 510 아군 최대 HP 28% 회복 · 기절/둔화/독/출혈/적대 표식 정화 · 피해 감소/쿨타임 환급 없음',
        capabilities:caps({damage:false,heal:true,area:true,utility:true})
    },function(c,s){R.marker(c,{shape:'circle',radius:s.radius,duration:24,color:'#86efac'});R.allies(c,c.owner.pos,s.radius).forEach(function(target){R.heal(c,target,target.maxHp*s.healFraction);R.cleanse(c,target);});},
    {teamOnly:true});

    register('emoji-110','철갑 코뿔소','탱커',melee({style:'punch',halfAngle:1.22,pushScale:.30}),{
        kind:'rhino-charge',shape:'rect',cooldownFrames:960,range:650,width:104,speed:39,damage:75,stunFrames:60,stunCap:78,knockback:8,defense:.24,durationFrames:90,
        description:'빠른 직선 돌진 · 첫 적 실제 접촉점에서 정지 · 피해 75와 1초 기절 · 적중 시 1.5초 자기 피해 감소 24%',
        capabilities:caps({dash:true,cc:true,duration:true,shield:true,signatureRange:true})
    },function(c,s){R.dash(c,{range:s.range,width:s.width,speed:s.speed,damage:s.damage,stun:s.stunFrames,stunCap:s.stunCap,knockback:s.knockback,stopOnEnemy:true,color:'#94a3b8',onHit:function(ctx){R.buff(ctx,ctx.owner,'defense',s.defense,s.durationFrames);}});},
    {statType:'MELEE',tankRole:true,basicSummary:'묵직한 뿔 근접 타격',stats:{maxHp:620,speed:1.85}});

    register('emoji-131','가위 수호자','근접형',melee({style:'scissor',halfAngle:1.14,cooldownScale:.84,damageScale:.84,pushScale:.18}),{
        kind:'scissor-volley',shape:'line',cooldownFrames:960,range:900,width:36,speed:29,damage:26,count:5,countCap:8,intervalFrames:6,windupFrames:0,knockback:1.2,
        description:'같은 조준 방향으로 가위 5발 · 0.1초 간격 순차 발사 · 탄당 피해 26 · 기절/옛 근접 연격 없음',
        capabilities:caps({projectile:true,multicast:true,cc:true})
    },function(c,s){shots(c,s,function(i){R.projectile(c,{dir:c.aim,speed:s.speed,range:s.range,radius:s.width/2,damage:s.damage,knockback:s.knockback,stun:0,shotIndex:i,color:'#fda4af',emoji:'✂️'});});},
    {statType:'MELEE',tankRole:false,basicSummary:'빠른 가위 근접 베기'});

    register('emoji-132','공허 파괴자','원거리형',{}, {
        kind:'channel-beam',shape:'line',cooldownFrames:1200,range:1340,width:116,damage:8.4,durationFrames:150,intervalFrames:6,turnRate:.038,count:1,countCap:1,knockback:0,stunFrames:0,
        description:'2.5초 굵은 지속 광선 · 0.1초마다 피해 8.736(전 틱 210) · 조준 회전 가능 · 이동/평타 잠금 · 벽 차단, 기절 없음',
        capabilities:caps({area:true,duration:true,signatureDuration:true})
    },function(c,s){R.channel(c,{duration:s.durationFrames,range:s.range,width:s.width,tickEvery:s.intervalFrames,damage:s.damage,turnRate:s.turnRate,knockback:0,stun:0,color:'#a78bfa'});});
})(__brScope.BRRework);}]
];
