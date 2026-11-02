// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){

}
export const initializers=[
[307,__brScope=>{(function registerV29(R){
    delete R.defs['emoji-050'];delete R.handlers['emoji-050'];
    const caps=(extra)=>Object.assign({damage:false,projectile:false,multicast:false,expandable:false,area:false,cc:false,heal:false,shield:false,dash:false,summon:false,trap:false,duration:false,utility:false},extra);
    function add(id,basic,skill,handler,extra={}){
        skill.key='rework-'+id;skill.cooldown=skill.cooldownFrames;skill.capabilities=skill.caps;
        R.register(id,{basic,skill,...extra},c=>handler(c,skill));
    }
    add('emoji-089',{close:false,type:'bullet',count:1,spread:0,pierce:false,bounces:0,explode:0,status:null,statusPower:0,emoji:'🏀'},
        {label:'리바운드 슛',kind:'basketball',shape:'line',cooldownFrames:660,range:820,speed:19,radius:23,damage:42,count:1,countCap:4,
         caps:caps({damage:true,projectile:true,multicast:true,expandable:true}),
         description:'직선 공 1발 · 피해 계수 42. 적의 HP/보호막에 피해를 주면 무피해 반환 공이 돌아오고, 도착 시 남은 스킬 쿨타임이 한 번 50% 감소합니다.'},
        (c,s)=>{
            const n=R.count(c,s.count,s.countCap),angle=Math.atan2(c.aim.y,c.aim.x);
            const onHit=(ctx,target,result,shot)=>{
                if(target.isReworkTurret||ctx.reboundStarted||!(result.hpDamage>0||result.absorbed>0))return;
                ctx.reboundStarted=true;
                for(const e of R.world(ctx.g).entities)if(!e.dead&&e.visualOnlyReturn&&e.ctx.ownerId===ctx.ownerId)R.end(e,'replaced');
                const ball=R.entity(ctx,'projectile',{pos:shot.pos,dir:ctx.aim,speed:23,radius:R.sized(ctx,s.radius),range:s.range*2,duration:150,damage:0,
                    displayEmoji:'🏀',color:'#fb923c',visualOnlyReturn:true,boomerang:true,noFarm:true,cancelOnStun:false},(live,e)=>{
                    if(!R.validContext(live)||R.state(live.owner).lastCast?.castId!==live.castId){R.end(e,'obsolete');return;}
                    e.previousPos=R.copy(e.pos);const delta=live.owner.pos.sub(e.pos),d=delta.mag();
                    if(d<=Math.max(e.speed,live.owner.radius*.65)){
                        if(!live.reboundRefunded){live.reboundRefunded=true;live.owner.cooldown=Math.max(0,Number(live.owner.cooldown||0))*.5;
                            live.g.addText(live.owner.pos,'리바운드! 쿨타임 50% 감소','#fdba74',19,55);}
                        R.end(e,'returned');return;
                    }
                    e.dir=delta.mult(1/d);e.pos=e.pos.add(e.dir.mult(e.speed));
                });ball.phase='return';ball.distance=0;ball.previousPos=R.copy(ball.pos);
            };
            for(let i=0;i<n;i++){const a=angle+(i-(n-1)/2)*.10;R.projectile(c,{dir:{x:Math.cos(a),y:Math.sin(a)},range:s.range,speed:s.speed,radius:s.radius,damage:s.damage,displayEmoji:'🏀',color:'#fb923c',onHit});}
        },{name:'농구왕',rank:'B',role:'원거리형',basicSummary:'직선 공 1발 · 평타 환급 없음'});
    add('emoji-139',{close:true,rangeBonus:86,halfAngle:1.18,cooldownFrames:69,damageScale:42/(24*1.08*1.05*1.05*1.3*.72),pushScale:.30,stun:0,reward:'',style:'punch'},
        {label:'느린 재생',kind:'zombie-regen',shape:'self',cooldownFrames:1080,durationFrames:240,intervalFrames:30,regenFraction:.02625,
         caps:caps({heal:true,duration:true,signatureDuration:true}),description:'4초 동안 0.5초마다 자신의 최대 HP 2.625% 재생(총 21%). 승인된 재생은 기절 중에도 지속되며 사망 시 끝납니다.'},
        (c,s)=>R.buff(c,c.owner,'regen',c.owner.maxHp*s.regenFraction,s.durationFrames),
        {name:'좀비',rank:'A',role:'탱커',statType:'MELEE',tankRole:true,stats:{speed:1},basicSummary:'1.15초마다 근접 강타 · 무방어 대상 약 42 피해 · 기절 없음'});
    add('emoji-140',{close:true,rangeBonus:92,halfAngle:1.12,cooldownFrames:39,damageScale:1.15,pushScale:.32,stun:0,reward:'',style:'punch'},
        {label:'돌 무더기 투척',kind:'rock-fan',shape:'cone',cooldownFrames:960,windupFrames:18,range:1450,speed:24,radius:8,damage:11,count:12,countCap:12,maxCount:12,spread:Math.PI/22,halfAngle:Math.PI/4,
         caps:caps({damage:true,projectile:true,expandable:true}),description:'0.3초 준비 후 90도 부채꼴로 작은 돌 12발을 동시에 투척합니다. 탄당 피해 계수 11 · 사거리 1450 · 탄수는 항상 12발 · 관통/기절 없음.'},
        (c,s)=>{
            R.marker(c,{shape:'cone',range:s.range,width:16,duration:s.windupFrames,color:'#cbd5e1'});
            R.lock(c,{attack:true,skill:true,moveScale:.82,cancelOnStun:true},s.windupFrames+1);
            R.schedule(c,s.windupFrames,live=>{const base=Math.atan2(live.aim.y,live.aim.x);for(let i=0;i<12;i++){
                const a=base-Math.PI/4+i*Math.PI/22;
                R.projectile(live,{dir:{x:Math.cos(a),y:Math.sin(a)},range:s.range,speed:s.speed,radius:s.radius,damage:s.damage,displayEmoji:'',color:'#94a3b8',knockback:0,stun:0});
            }},{cancelOnStun:true});
        },{name:'짐승형 거인',rank:'S',role:'근접형',statType:'MELEE',tankRole:false,stats:{speed:1.6},basicSummary:'묵직한 근접 타격 · 기절 없음'});
})(__brScope.BRRework);}]
];
