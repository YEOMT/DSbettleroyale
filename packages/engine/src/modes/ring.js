// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brRingContinuousRate = function brRingContinuousRate(mode){return __brScope.BR_RING_RULES.shrinkSpeed*(mode==='solo'?__brScope.BR_RING_RULES.soloMultiplier:mode==='team-elim'||mode==='team'?__brScope.BR_RING_RULES.teamElimMultiplier:1);};

__brScope.brRingCompressionRate = function brRingCompressionRate(mode){return __brScope.BR_RING_RULES.shrinkSpeed*(mode==='solo'?1.5:1);};

__brScope.brRingKey = function brRingKey(){return __brScope.matchId;};

__brScope.brRingCopy = function brRingCopy(p) {
            return {...p,nextPressure:p.nextPressure?{...p.nextPressure}:null,compression:p.compression?{...p.compression}:null};
        };

__brScope.brRingAdvance = function brRingAdvance(p,toTick) {
            // Integer reference integration preserves the original per-60-Hz shrink coefficients.
            // The copy used by the client cannot mutate the authoritative plan.
            const end=Math.max(p.tick,Math.floor(toTick));
            while(p.tick<end) {
                p.tick++;
                if(p.nextPressure&&p.tick>=p.nextPressure.tick){p.pressure=p.nextPressure.value;p.nextPressure=null;}
                if(p.tick>__brScope.BR_RING_RULES.startTick&&p.radius>p.minRadius) {
                    let shrink=.20+(p.pressure?.22:0);
                    if(p.radius<520)shrink+=.12;if(p.radius<300)shrink+=.18;
                    if(p.radius<160)shrink+=.28;if(p.radius<80)shrink+=.38;
                    p.radius=Math.max(p.minRadius,p.radius-shrink*(2/3*1.3)*(p.shrinkRate??__brScope.BR_RING_RULES.shrinkSpeed));
                }
                const c=p.compression;
                if(c&&p.tick>c.start&&p.tick<=c.end&&p.radius>c.floor)
                    p.radius=Math.max(p.minRadius,c.floor,p.radius-c.amount/(c.end-c.start));
                if(c&&p.tick>=c.end)p.compression=null;
                if(p.radius<=p.minRadius&&!p.nextPressure&&!p.compression){p.tick=end;break;}
            }
            return p;
        };

__brScope.brRingSample = function brRingSample(plan,timeMs) {
            const exact=Math.max(plan.tick,Number(timeMs)/__brScope.BR_RING_RULES.stepMs),tick=Math.floor(exact+1e-8);
            const p=__brScope.brRingAdvance(__brScope.brRingCopy(plan),tick),fraction=Math.max(0,Math.min(1,exact-tick));
            const radius=fraction>1e-8?p.radius+(__brScope.brRingAdvance(__brScope.brRingCopy(p),tick+1).radius-p.radius)*fraction:p.radius;
            let previewRadius=null,compressInMs=0,compressLeftMs=0;
            if(p.compression){const c=p.compression;previewRadius=__brScope.brRingAdvance(__brScope.brRingCopy(p),c.end).radius;
                compressInMs=Math.max(0,c.start*__brScope.BR_RING_RULES.stepMs-timeMs);compressLeftMs=Math.max(0,c.end*__brScope.BR_RING_RULES.stepMs-timeMs);}
            return {radius,cx:plan.cx,cy:plan.cy,time:timeMs,previewRadius,compressInMs,compressLeftMs,
                minRadius:plan.minRadius,pressure:p.pressure,startInMs:Math.max(0,__brScope.BR_RING_RULES.startTick*__brScope.BR_RING_RULES.stepMs-timeMs)};
        };

__brScope.brRingOutside = function brRingOutside(x,y,r) {
            if(!r||![x,y,r.cx,r.cy,r.radius].every(Number.isFinite))return false;
            // A collapsed ring has no safe point, even at its exact centre.
            return r.radius<=0||Math.hypot(x-r.cx,y-r.cy)>r.radius+1e-7;
        };

__brScope.brRingDamage = function brRingDamage(radius,depth,outsideFrames) {
            const pressure=Math.max(0,Math.min(1,(420-radius)/396));
            return (.28+pressure*.92+Math.min(1.08,Math.max(0,depth)/150))*(outsideFrames<18?.78:1);
        };

__brScope.brRingInitWorld = function brRingInitWorld(g,now=__brScope.now()) {
            if(g.capture){g.ring=null;g.ringGeometry=null;g.capture.hostAt=now;g.ringSuspended=!!false;return;}
            const fixed=!!__brScope.session?.isRespawnMode();
            const mode=__brScope.session?.roomMeta?.mode||(__brScope.teamMode>0?'team':'solo'),shrinkRate=__brScope.brRingContinuousRate(mode);
            const minRadius=fixed?g.worldRadius*__brScope.BR_TEAM_KILL_RULES.arenaScale:0;
            const initialRadius=fixed?minRadius:g.worldRadius;
            g.ring={key:__brScope.brRingKey(),revision:1,sequence:0,anchorPerf:now,anchorTime:0,running:true,clockEpoch:1,
                lastCombatFrame:g.lastCombatFrame||0,lastCombatTime:0,lastCompressionTick:-__brScope.BR_RING_RULES.repeatTicks,
                plan:{tick:0,mode,shrinkRate,radius:initialRadius,minRadius,cx:g.center.x,cy:g.center.y,pressure:false,nextPressure:null,compression:null}};
            g.ringGeometry=__brScope.brRingSample(g.ring.plan,0);g.mapRadius=g.ringGeometry.radius;
            if(__brScope.session?.role==='host'&&false){g.ringSuspended=true;__brScope.brRingPause(g,true,now);}
        };

__brScope.brRingHostTime = function brRingHostTime(g,now=__brScope.now()) {
            const s=g.ring;return s?s.anchorTime+(s.running?Math.max(0,now-s.anchorPerf):0):0;
        };

__brScope.brRingPause = function brRingPause(g,paused,now=__brScope.now()) {
            if(!g?.ring)return;
            const s=g.ring;if(s.running===!paused)return;
            s.anchorTime=__brScope.brRingHostTime(g,now);s.anchorPerf=now;s.running=!paused;s.clockEpoch++;s.revision++;
            g.ringGeometry=__brScope.brRingSample(s.plan,s.anchorTime);g.mapRadius=g.ringGeometry.radius;
        };

__brScope.brRingScheduleCompression = function brRingScheduleCompression(g,time=__brScope.brRingHostTime(g)) {
            const s=g.ring;if(!s||!s.running||s.plan.compression||s.plan.minRadius>0)return false;
            const tick=Math.floor(time/__brScope.BR_RING_RULES.stepMs);
            if(tick-s.lastCompressionTick<__brScope.BR_RING_RULES.repeatTicks||s.plan.radius<=0)return false;
            const start=tick+__brScope.BR_RING_RULES.noticeTicks,end=start+__brScope.BR_RING_RULES.compressTicks;
            const before=__brScope.brRingSample(s.plan,start*__brScope.BR_RING_RULES.stepMs).radius;
            const floor=Math.max(s.plan.minRadius,before<150?0:140);
            const amount=Math.min(Math.max(0,before-floor),(before<300?75:55)*2/3*1.3)*__brScope.brRingCompressionRate(s.plan.mode);
            if(amount<=0)return false;
            s.plan.compression={start,end,amount,floor};s.lastCompressionTick=tick;s.revision++;
            g.lastConvergenceTrigger=g.frame;
            g.announce('⚠️ 1.5초 후 위험구역 압축 · 주황 점선 확인',100);
            return true;
        };

__brScope.brRingHostUpdate = function brRingHostUpdate(g,now=__brScope.now()) {
            if(g.capture)return;
            if(!g.ring)__brScope.brRingInitWorld(g,now);
            __brScope.brRingPause(g,!!(g.paused||g.ringSuspended||g.isGameOver),now);
            const s=g.ring,time=__brScope.brRingHostTime(g,now);
            __brScope.brRingAdvance(s.plan,Math.floor(time/__brScope.BR_RING_RULES.stepMs+1e-8));
            if(s.running&&s.plan.minRadius===0){
                if(s.lastCombatFrame!==g.lastCombatFrame){s.lastCombatFrame=g.lastCombatFrame;s.lastCombatTime=time;}
                const pressure=time>20000&&time-s.lastCombatTime>12000;
                // Never rewrite an already-advertised transition; any following change is scheduled anew.
                if(!s.plan.nextPressure&&s.plan.pressure!==pressure){
                    s.plan.nextPressure={tick:s.plan.tick+__brScope.BR_RING_RULES.noticeTicks,value:pressure};s.revision++;
                }
                if(pressure)__brScope.brRingScheduleCompression(g,time);
            }
            g.ringGeometry=__brScope.brRingSample(s.plan,time);g.mapRadius=g.ringGeometry.radius;
            return g.ringGeometry;
        };

__brScope.brRingApplyDamage = function brRingApplyDamage(g,p) {
            if(g.capture)return;
            if(!p?.alive||p.id===999)return;
            const r=g.ringGeometry||{cx:g.center.x,cy:g.center.y,radius:g.mapRadius,time:g.frame*__brScope.BR_RING_RULES.stepMs};
            const outside=__brScope.brRingOutside(p.pos.x,p.pos.y,r);
            p.ringOutside=outside;
            if(!outside){p.outsideZoneFrames=0;p.ringEnteredAt=null;return;}
            if(p.ringEnteredAt==null)p.ringEnteredAt=r.time;
            p.outsideZoneFrames=Number(p.outsideZoneFrames||0)+1;
            // Real, globally fixed 300 ms entry notice, not the old misleading 0.78 damage multiplier.
            if(r.time-p.ringEnteredAt+1e-7<__brScope.BR_RING_RULES.entryGraceMs||g.ring&&!g.ring.running)return;
            const depth=Math.max(0,Math.hypot(p.pos.x-r.cx,p.pos.y-r.cy)-r.radius);
            const before=p.hp;
            p.takeDamage(__brScope.brRingDamage(r.radius,depth,Math.max(18,p.outsideZoneFrames)),null,false,null,{attackKind:'zone'});
            const dealt=Math.max(0,Math.min(Math.max(0,before),before-p.hp));
            if(dealt>0){p.ringDamageTotal=Number(p.ringDamageTotal||0)+dealt;
                p.ringLastHit={time:r.time,x:p.pos.x,y:p.pos.y,radius:r.radius,cx:r.cx,cy:r.cy,amount:dealt};
                __brScope.brCombatTrace('ring-hit',{frame:g.frame,matchKey:g.ring?.key,life:p.lifeSeq,id:p.remoteId,...p.ringLastHit});}
        };

__brScope.brCombatTrace = function brCombatTrace(type,data){__brScope.trace(type,data);};
}
export const initializers=[
[221,__brScope=>{ __brScope.BR_RING_RULES=Object.freeze({stepMs:1000/60,startTick:1200,noticeTicks:90,compressTicks:48,repeatTicks:600,
            entryGraceMs:300,maxExtrapolateMs:1200,staleMs:900,channelMs:100,shrinkSpeed:.70,soloMultiplier:1.6,teamElimMultiplier:1.1});;}]
];
