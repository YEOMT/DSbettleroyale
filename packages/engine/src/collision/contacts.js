// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brViewerBounds = function brViewerBounds(viewer,input){
            const raw=Number(input?.aspect),aspect=Number.isFinite(raw)&&raw>0?Math.max(.20,Math.min(5,raw)):1;
            // During initial join/rotation use a square envelope; never omit a screen corner.
            const hw=aspect>=1?__brScope.BR_VIEW_SPAN/2:__brScope.BR_VIEW_SPAN*aspect/2;
            const hh=aspect>=1?__brScope.BR_VIEW_SPAN/(2*aspect):__brScope.BR_VIEW_SPAN/2;
            return {x:viewer.pos.x,y:viewer.pos.y,hw:hw+__brScope.BR_VIEW_PAD,hh:hh+__brScope.BR_VIEW_PAD};
        };

__brScope.brIncomingLeadFrames = function brIncomingLeadFrames(bounds){return Math.max(9,Math.min(18,(Number(bounds?.snapshotGapMs||150)+100)/(1000/60)));};

__brScope.brViewContains = function brViewContains(b,x,y,pad=0){return Math.abs(x-b.x)<=b.hw+pad&&Math.abs(y-b.y)<=b.hh+pad;};

__brScope.brViewSegment = function brViewSegment(b,x,y,ex,ey,pad=0){
            return __brScope.combatSegmentBoxTime(x-b.x,y-b.y,ex-x,ey-y,b.hw+pad,b.hh+pad)!==null;
        };

__brScope.brRecordFlightPath = function brRecordFlightPath(q,frame,x,y,turn=0,force=false){
            const a=q._brPath||(q._brPath=[]),n=a.length;
            if(n&&a[n-4]===frame){a[n-3]=x;a[n-2]=y;a[n-1]=turn;return;}
            if(!force&&n&&frame-a[n-4]<3&&a[n-1]===turn)return;
            a.push(frame,Math.round(x*100)/100,Math.round(y*100)/100,turn);if(a.length>48)a.splice(0,a.length-48);
        };

__brScope.brBeginProjectileVisual = function brBeginProjectileVisual(g,q){
            if(q.type==='ORBIT')return;
            if(!q._brNetId)q._brNetId='q'+(++g.visualShotSeq);
            if(!q._brTrace){q._brTrace=[q.pos.x,q.pos.y];q._brBornFrame=g.frame;}
            if(q.type==='missile'||q.type==='BOOMERANG'||q.bounces>0||q._brTurn)__brScope.brRecordFlightPath(q,g.frame-1,q.pos.x,q.pos.y,Number(q._brTurn||0));
        };

__brScope.brEndProjectileVisual = function brEndProjectileVisual(g,q){
            if(!q._brTrace)return;
            if(q._brPath)__brScope.brRecordFlightPath(q,g.frame,q.pos.x,q.pos.y,Number(q._brTurn||0));
            const a=q._brTrace;
            if(a[a.length-2]!==q.pos.x||a[a.length-1]!==q.pos.y)a.push(q.pos.x,q.pos.y);
            if(a.length>40)a.splice(0,a.length-40); // <=20 exact per-tick vertices, not an extrapolated path.
            if(q.life>0||q._brTraceEnded)return;
            q._brTraceEnded=true;
            if(a.length>=4)g.retiredShots.push({id:q._brNetId,frame:g.frame,born:q._brBornFrame,points:a,
                size:q.size,color:q.trailColor||q.color||'#ffffff',source:q.owner?.remoteId||'',kind:q.inputKind||'',seq:Number(q.inputSeq||0),ordinal:Number(q.shotOrdinal||0),life:Number(q.visualLife||0)});
        };

__brScope.brDashWidth = function brDashWidth(radius){return Math.max(0,Number(radius)||0)*__brScope.BR_CONTACT.dashBody*2;};

__brScope.brLaserProfile = function brLaserProfile(ability,mods={}) {
            const sniper=ability?.sub==='SNIPE';
            return {range:sniper?__brScope.getRangedCombatProfile(ability,'skill').range:800,
                width:sniper?10:144*Math.max(.01,Number(mods.skillSize)||1),sniper};
        };

__brScope.brTraceBeam = function brTraceBeam(origin,aim,range,walls) {
            const dir=__brScope.brNormalizeAimVector(aim.x,aim.y),length=Math.max(0,Number(range)||0);
            const end=new __brScope.Vec2(origin.x+dir.x*length,origin.y+dir.y*length);
            const wall=__brScope.combatTraceWalls(origin,end,0,walls||[]);
            // A zero-radius trace does not report a stationary origin inside a wall.
            const inside=(walls||[]).some(w=>!!__brScope.combatWallContact(origin.x,origin.y,.001,w));
            const clipped=inside?0:wall?Math.max(0,length*wall.t):length;
            return {x:origin.x,y:origin.y,dx:dir.x,dy:dir.y,length:clipped,
                end:new __brScope.Vec2(origin.x+dir.x*clipped,origin.y+dir.y*clipped),blocked:inside||!!wall};
        };

__brScope.brBeamTouches = function brBeamTouches(origin,target,aim,range,width,radiusScale=__brScope.BR_CONTACT.beamTarget) {
            const dx=target.pos.x-origin.x,dy=target.pos.y-origin.y;
            const along=dx*aim.x+dy*aim.y,side=Math.abs(dx*aim.y-dy*aim.x);
            if(range<=0||along<0)return false;
            const r=Math.max(0,target.radius*radiusScale),ex=Math.max(0,along-range),ey=Math.max(0,side-width*.5);
            return ex*ex+ey*ey<=r*r;
        };

__brScope.brFirstBeamHit = function brFirstBeamHit(origin,aim,range,width,players,owner,walls) {
            const beam=__brScope.brTraceBeam(origin,aim,range,walls),dx=aim.x*beam.length,dy=aim.y*beam.length;
            let target=null,nearest=1;
            if(beam.length>0)for(const p of players||[]) {
                if(!p.alive||p===owner||p.id===999||(owner?.team&&p.team===owner.team)||!__brScope.brCanHostileTarget(p,owner))continue;
                // SNIPE is a narrow swept beam. Select the FIRST surface, not the nearest centre.
                const t=__brScope.combatSegmentCircleTime(origin.x-p.pos.x,origin.y-p.pos.y,dx,dy,p.radius+width*.5);
                if(t===null||t>nearest||(t===nearest&&target&&p.id>target.id))continue;
                if((p.pos.x-origin.x)*aim.x+(p.pos.y-origin.y)*aim.y<0)continue;
                if(__brScope.combatTraceWalls(origin,p.pos,0,walls||[]))continue;
                nearest=t;target=p;
            }
            return {target,beam,length:target?beam.length*nearest:beam.length};
        };

__brScope.brSectorTouches = function brSectorTouches(origin,target,aim,range,halfAngle,radiusScale=1) {
            const dx=target.pos.x-origin.x,dy=target.pos.y-origin.y,d2=dx*dx+dy*dy;
            const r=Math.max(0,Number(target.radius||0)*radiusScale),reach=range+r;
            if(d2>reach*reach)return false;
            if(d2<=r*r)return true;
            const dist=Math.sqrt(d2),dot=(dx*aim.x+dy*aim.y)/dist;
            if(dot>=Math.cos(halfAngle))return true;
            const side=dx*aim.y-dy*aim.x,angle=side>0?-halfAngle:halfAngle,c=Math.cos(angle),s=Math.sin(angle);
            const ex=aim.x*c-aim.y*s,ey=aim.x*s+aim.y*c,t=Math.max(0,Math.min(range,dx*ex+dy*ey));
            return (dx-ex*t)**2+(dy-ey*t)**2<=r*r;
        };

__brScope.brDashTouchTime = function brDashTouchTime(from,to,target,ownerRadius,moving=true) {
            const warped=Number(target.warpSeq||0)!==Number(target.combatPreviousWarp||0);
            const tx=moving&&!warped&&Number.isFinite(target.combatPreviousX)?target.combatPreviousX:target.pos.x;
            const ty=moving&&!warped&&Number.isFinite(target.combatPreviousY)?target.combatPreviousY:target.pos.y;
            const r=ownerRadius*__brScope.BR_CONTACT.dashBody+target.radius*__brScope.BR_CONTACT.dashTarget;
            const t=__brScope.combatSegmentCircleTime(from.x-tx,from.y-ty,(to.x-from.x)-(target.pos.x-tx),(to.y-from.y)-(target.pos.y-ty),r);
            return t===null?null:{t,x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,
                targetX:tx+(target.pos.x-tx)*t,targetY:ty+(target.pos.y-ty)*t};
        };

__brScope.brZoneGeometry = function brZoneGeometry(radius,type,sub) {
            const core=Math.max(0,Number(radius)||0),pull=type==='pull'?core*2:0;
            return {core,pull,burst:pull?(sub==='GRAVITY_WELL'?core*1.10:core):0};
        };

__brScope.brFeelBasicPushScale = function brFeelBasicPushScale(ability,profile) {
            // Explicit IDs prevent future roster/CC additions from silently gaining another multiplier.
            return profile?.close&&__brScope.BR_FEEL_MELEE_PUSH_IDS.has(ability?.id)?1.15:1;
        };

__brScope.brFeelRepeated = function brFeelRepeated(attacker,context,style='') {
            const c=context||{},s=String(c.projectileStyle||style||''),basic=!!c.basic||/^basic-|^ranged-basic/.test(s);
            if(c.periodic||c.visualPeriodic||/dot:|sustain/i.test(s))return true;
            const profile=basic&&attacker?.ability?__brScope.brProgressionCombat?.basicProfile(attacker?.ability,attacker?.run?.mods):null;
            if(basic)return /machine/.test(String(profile?.style||s))||Number(c.attackFrames||0)>0&&Number(c.attackFrames)<=28;
            const kind=__brScope.BRRework?.defs[c.ctx?.abilityId||attacker?.ability?.id]?.skill?.kind||'';
            return /sequential|barrage|laser|beam|chainsaw|radial-waves/.test(kind)||/combo|machine/.test(s);
        };

__brScope.brFeelImpact = function brFeelImpact(hpDamage,absorbed=0,attacker=null,context=null,style='') {
            const c=context||{},damage=Math.max(0,Number(hpDamage)||0)+Math.max(0,Number(absorbed)||0);
            const s=String(c.projectileStyle||style||c.style||''),basic=!!c.basic||/^basic-|^ranged-basic/.test(s);
            const periodic=!!(c.periodic||c.visualPeriodic)||/dot:|sustain/i.test(s);
            if(periodic)return 1;
            // Current unaugmented direct basic damage spans about 2.4–41.5. Skill hits extend above 60.
            let level=damage<12?1:damage<30?2:damage<62?3:4;
            if(__brScope.brFeelRepeated(attacker,c,s))return Math.min(2,level);
            const profile=basic&&attacker?.ability?__brScope.brProgressionCombat?.basicProfile(attacker.ability,attacker.run?.mods):null;
            const kind=basic?'':__brScope.BRRework?.defs[c.ctx?.abilityId||attacker?.ability?.id]?.skill?.kind||'';
            const heavy=/sniper|heavy|hammer|uppercut|power-shot/.test(String(profile?.style||s))||(!basic&&/front|hammer|precision/.test(kind));
            if(heavy&&damage>=18)level=Math.max(level,3);
            const explosive=Number(c.explodeRadius||0)>0||/blast|explosion|nuclear|fireball|dynamite|bomb/.test(kind+' '+s);
            if(explosive&&damage>=40)level=4;
            return Math.min(4,Math.max(1,level));
        };

__brScope.brFeelSwingMs = function brFeelSwingMs(ability,profile) {
            // Presentation only; the authoritative sector still resolves once at the original frame.
            return (ability?.id==='emoji-025'||ability?.id==='emoji-042'?10:profile?.style==='scissor'?7:9)*1000/60;
        };

__brScope.brFxCommand = function brFxCommand(owner,shape,extra={}) {
            return Object.assign({shape,kind:owner?.activeInputCommand?.kind||'',seq:Number(owner?.activeInputCommand?.seq||0),matchKey:__brScope.brRingKey(),lifeSeq:Number(owner?.lifeSeq||0),hostFrame:__brScope.game?.frame||0},extra);
        };

__brScope.brCoreFx = function brCoreFx(e){return ['laser','shot','swing','dash'].includes(e.type)||String(e.style||'').startsWith('farm')||!!e.geometry?.shape;};

__brScope.brTrimCombatFx = function brTrimCombatFx(events) {
            // Drop decoration first. Real attack geometry is never put under the 24-cosmetic budget.
            while(events.length>96){const i=events.findIndex(e=>!__brScope.brCoreFx(e));if(i<0)break;events.splice(i,1);}
            if(events.length>1024){if(__brScope.session)__brScope.session.visualHistoryDrops=Number(__brScope.session.visualHistoryDrops||0)+events.length-1024;events.splice(0,events.length-1024);}
        };
}
export const initializers=[
[89,__brScope=>{ __brScope.BR_VIEW_SPAN=1800, __brScope.BR_VIEW_PAD=200;;}],
[99,__brScope=>{ __brScope.BR_CONTACT = Object.freeze({dashBody:.82,dashTarget:.72,beamTarget:.55,skillConeTarget:.45});;}],
[109,__brScope=>{ __brScope.BR_FEEL_MELEE_PUSH_IDS=new Set(['emoji-004','emoji-006','emoji-013','emoji-037','emoji-131',
            'emoji-024','emoji-027','emoji-029','emoji-031','emoji-035','emoji-038','emoji-043','emoji-044',
            'emoji-048','emoji-127','emoji-128']);;}]
];
