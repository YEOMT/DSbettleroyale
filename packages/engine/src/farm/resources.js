// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brCrateHalf = function brCrateHalf(box) {
            const h=Number(Array.isArray(box)?box[5]:box?.halfSize);
            return Number.isFinite(h)&&h>0?h:__brScope.BR_CRATE_HALF;
        };

__brScope.brCrateX = function brCrateX(box){return Number(Array.isArray(box)?box[1]:box.pos.x);};

__brScope.brCrateY = function brCrateY(box){return Number(Array.isArray(box)?box[2]:box.pos.y);};

__brScope.brBodyWalls = function brBodyWalls(walls,boxes,revision=0) {
            walls=walls||__brScope.BR_NO_BODY_WALLS;
            if(!boxes?.length)return walls;
            const old=__brScope.BR_BODY_WALL_CACHE.get(walls);
            if(old&&old.boxes===boxes&&old.revision===revision&&old.count===boxes.length&&old.wallCount===walls.length)return old.walls;
            const combined=walls.slice();
            for(const box of boxes){
                // Serialized HP is a rounded percentage and can be zero before death;
                // membership in the authoritative list is the serialized lifetime flag.
                if(!Array.isArray(box)&&!(box.hp>0))continue;
                const x=__brScope.brCrateX(box),y=__brScope.brCrateY(box),size=__brScope.brCrateHalf(box)*2;
                if(!Number.isFinite(x)||!Number.isFinite(y))continue;
                combined.push({x,y,w:size,h:size,angle:0,spinSpeed:0,kind:'farm',farmId:Array.isArray(box)?box[0]:box.id});
            }
            __brScope.BR_BODY_WALL_CACHE.set(walls,{boxes,revision,count:boxes.length,wallCount:walls.length,walls:combined});
            return combined;
        };

__brScope.brHostBodyWalls = function brHostBodyWalls(g){return __brScope.brBodyWalls(g?.walls,g?.farmBoxes,Number(g?.farmRevision||0));};

__brScope.brCrateCircleTouches = function brCrateCircleTouches(box,pos,radius) {
            if(!Number.isFinite(radius)||radius<0)return false;
            const h=__brScope.brCrateHalf(box),dx=Math.max(0,Math.abs(pos.x-__brScope.brCrateX(box))-h),dy=Math.max(0,Math.abs(pos.y-__brScope.brCrateY(box))-h);
            return dx*dx+dy*dy<=radius*radius+1e-8;
        };

__brScope.brCrateSweepTime = function brCrateSweepTime(box,from,to,radius=0) {
            if(!Number.isFinite(radius)||radius<0)return null;
            const h=__brScope.brCrateHalf(box),x=from.x-__brScope.brCrateX(box),y=from.y-__brScope.brCrateY(box),dx=to.x-from.x,dy=to.y-from.y;
            // Square Minkowski-summed with the projectile/dash circle. Merely enlarging
            // an AABB would falsely hit the four outside corner squares.
            let hit=__brScope.combatSegmentBoxTime(x,y,dx,dy,h+radius,h);
            const include=t=>{if(t!==null&&(hit===null||t<hit))hit=t;};
            include(__brScope.combatSegmentBoxTime(x,y,dx,dy,h,h+radius));
            if(radius>0)for(let sx=-1;sx<=1;sx+=2)for(let sy=-1;sy<=1;sy+=2)
                include(__brScope.combatSegmentCircleTime(x-sx*h,y-sy*h,dx,dy,radius));
            return hit;
        };

__brScope.brCrateBeamTouches = function brCrateBeamTouches(box,from,to,halfWidth=0) {
            if(!Number.isFinite(halfWidth)||halfWidth<0)return false;
            const dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy);
            if(len<=1e-9)return false;
            const ux=dx/len,uy=dy/len,h=__brScope.brCrateHalf(box),ex=__brScope.brCrateX(box)-(from.x+to.x)*.5,ey=__brScope.brCrateY(box)-(from.y+to.y)*.5;
            const ax=Math.abs(ux),ay=Math.abs(uy),l=len*.5,eps=1e-8;
            // SAT: finite flat-ended beam rectangle against the same square body.
            return Math.abs(ex)<=h+ax*l+ay*halfWidth+eps&&Math.abs(ey)<=h+ay*l+ax*halfWidth+eps&&
                Math.abs(ex*ux+ey*uy)<=l+h*(ax+ay)+eps&&Math.abs(-ex*uy+ey*ux)<=halfWidth+h*(ax+ay)+eps;
        };

__brScope.brCrateSectorTouches = function brCrateSectorTouches(box,origin,aim,range,halfAngle) {
            if(!Number.isFinite(range)||range<=0||!Number.isFinite(halfAngle))return false;
            const h=__brScope.brCrateHalf(box),x=__brScope.brCrateX(box)-origin.x,y=__brScope.brCrateY(box)-origin.y;
            if(Math.max(0,Math.abs(x)-h)**2+Math.max(0,Math.abs(y)-h)**2>range*range+1e-8)return false;
            const a=__brScope.brNormalizeAimVector(aim.x,aim.y),half=Math.max(0,Math.min(Math.PI,halfAngle)),cos=Math.cos(half),eps=1e-8;
            const inAngle=(px,py)=>{const d=Math.hypot(px,py);return d<=eps||(px*a.x+py*a.y)>=d*cos-eps;};
            const minX=x-h,maxX=x+h,minY=y-h,maxY=y+h,r2=range*range;
            if(minX<=0&&maxX>=0&&minY<=0&&maxY>=0)return true;
            // Corners inside the sector; radial edges through the square; circular arc
            // against square sides. This also covers arc-only intersections and tangency.
            for(let sx=-1;sx<=1;sx+=2)for(let sy=-1;sy<=1;sy+=2){const px=x+sx*h,py=y+sy*h;if(px*px+py*py<=r2+eps&&inAngle(px,py))return true;}
            for(let s=-1;s<=1;s+=2){const c=Math.cos(s*half),sn=Math.sin(s*half),vx=(a.x*c-a.y*sn)*range,vy=(a.x*sn+a.y*c)*range;
                if(__brScope.combatSegmentBoxTime(-x,-y,vx,vy,h,h)!==null)return true;}
            for(let s=-1;s<=1;s+=2){
                const px=x+s*h,yy=r2-px*px;
                if(yy>=-eps){const q=Math.sqrt(Math.max(0,yy));for(let t=-1;t<=1;t+=2){const py=t*q;if(py>=minY-eps&&py<=maxY+eps&&inAngle(px,py))return true;}}
                const py=y+s*h,xx=r2-py*py;
                if(xx>=-eps){const q=Math.sqrt(Math.max(0,xx));for(let t=-1;t<=1;t+=2){const px=t*q;if(px>=minX-eps&&px<=maxX+eps&&inAngle(px,py))return true;}}
            }
            return false;
        };

__brScope.SupplyDrop = class SupplyDrop {
            constructor(pos) {
                this.pos=new __brScope.Vec2(pos.x,pos.y); this.fallFrames=105; this.life=1350;
                this.claimed=false; this.landed=false; this.pulse=__brScope.rand()*Math.PI*2;
            }
            update(game) {
                if(this.claimed) return;
                this.pulse+=0.08;
                if(this.fallFrames>0) {
                    this.fallFrames--;
                    if(this.fallFrames<=0) {
                        this.landed=true;
                        __brScope.brFarm.changed(game);
                        game.spawnImpact(this.pos,90,'#67e8f9',1.0);
                    }
                    return;
                }
                this.life--;
                let picker=null,best=Infinity;
                for(const p of game.getNearbyParticipants(this.pos,game.farmPickupSearchRadius||150)) {
                    if(!p.alive || p.id===999 || (game.soloSupplies && (!p.remoteId || p.isClone || p.cloneOwner))) continue;
                    const d=p.pos.dist(this.pos);
                    const reach = game.soloSupplies ? 43 : 38;
                    if(d<p.radius+reach && d<best && (!game.soloSupplies || !game.checkWallBetween(p.pos, this.pos))){best=d;picker=p;}
                }
                if(picker) {
                    this.claimed=true;
                    __brScope.brFarm.changed(game);
                    const progression=picker.run&&__brScope.brProgression;
                    if(progression)progression.awardXP(picker,2,.28);
                    else {
                        picker.hp=Math.min(picker.maxHp,picker.hp+picker.maxHp*.25);
                        picker.cooldown=Math.max(0,Math.floor(picker.cooldown*.55));picker.stunned=Math.min(picker.stunned,5);
                    }
                    game.addText(picker.pos,progression?'SUPPLY +2 XP':'SUPPLY!','#67e8f9',40,30);
                    game.spawnImpact(picker.pos,125,'#67e8f9',1.4);
                }
            }
            
        };
}
export const initializers=[
[164,__brScope=>{ __brScope.BR_CRATE_HALF = 48;;}],
[168,__brScope=>{ __brScope.BR_BODY_WALL_CACHE=new WeakMap(),__brScope.BR_NO_BODY_WALLS=[];;}],
[177,__brScope=>{ __brScope.BR_COLLECTIBLE_RULES=Object.freeze({xpRadius:20,deathRadius:26,healRadius:28,pickupExtra:42});;}],
[179,__brScope=>{__brScope.brFarm = (() => {
            const HALF=__brScope.BR_CRATE_HALF, BOUND=HALF*Math.SQRT2, CELL=320, UNITS_TO_BREAK=1;
            const HEAL_FRACTION=.20,HEAL_INTERVAL=1200,HEAL_LIFETIME=2400;
            const XP_INTERVAL=1200,XP_WAVE_LIFETIME=2700,P=__brScope.ROSTER10_BALANCE;
            const key=(x,y)=>x+','+y;
            const real=p=>p&&p.id!==999&&!p.isClone&&!p.cloneOwner;
            const dirty=g=>{g.farmRevision=(g.farmRevision||0)+1;g._farmSnapshot=null;};
            // Count reservations as well as live crates: expiry and destruction
            // move the same slot into the queue, they do not release it twice.
            const reserved=(g,kind)=>(g.teamCrateQueue||[]).filter(q=>q.kind===kind).length;
            const occupied=(g,kind)=>g.farmBoxes.filter(b=>b.kind===kind).length+reserved(g,kind);
            function waveTarget(g,key,base,factor,cap=Infinity){
                const exact=base*factor+(g[key]||0),whole=Math.floor(exact+1e-9);
                g[key]=Math.max(0,Math.min(1-Number.EPSILON,exact-whole));
                return Math.min(cap,whole);
            }
            function addBox(g,box) {
                g.farmBoxes.push(box);
                const cell=key(Math.floor(box.pos.x/CELL),Math.floor(box.pos.y/CELL));
                if(!g.farmGrid.has(cell))g.farmGrid.set(cell,[]);
                g.farmGrid.get(cell).push(box);
            }
            function removeBox(g,box) {
                if(__brScope.session?.isRespawnMode()&&box.hp>=0&&g.teamCrateQueue&&g.teamCrateQueue.length<64)
                    g.teamCrateQueue.push({at:g.frame+__brScope.BR_TEAM_KILL_RULES.boxRespawnFrames,kind:box.kind||'xp',x:box.pos.x,y:box.pos.y});
                box.hp=0;g.farmFlash?.delete(box.id);
                const i=g.farmBoxes.indexOf(box);if(i>=0)g.farmBoxes.splice(i,1);
                const cell=key(Math.floor(box.pos.x/CELL),Math.floor(box.pos.y/CELL)),bucket=g.farmGrid.get(cell);
                if(bucket){const j=bucket.indexOf(box);if(j>=0)bucket.splice(j,1);if(!bucket.length)g.farmGrid.delete(cell);}
            }
            function init(g) {
                dispose(g);g.farmRevision=1;g.farmSeq=0;g.farmGrid=new Map();
                const players=g.participants.filter(real),density=[1.28,1.32,1.36,1.28,1.34][g.mapIndex]||1.30;
                const oldCount=Math.min(42,Math.max(8,Math.round(players.length*density)));
                const count=Math.min(P.initialCap,Math.round(oldCount*P.farmInitial));
                g.farmPickupSearchRadius=Math.max(100,...players.map(p=>p.radius+__brScope.BR_COLLECTIBLE_RULES.pickupExtra));
                // Separate random stream leaves map, character and combat RNG untouched.
                let seed=2166136261;
                const text=String(__brScope.session?.roomMeta?.seed||'farm')+'|'+String(__brScope.session?.roomMeta?.matchRound||0)+'|'+g.mapIndex;
                for(let i=0;i<text.length;i++){seed^=text.charCodeAt(i);seed=Math.imul(seed,16777619);}
                const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
                g.farmRandom=random;g.nextHealCrateFrame=HEAL_INTERVAL;g.healWave=0;g.healWaveCarry=0;
                let xpSeed=(seed^0x9e3779b9)>>>0;
                g.xpWaveRandom=()=>{xpSeed=(Math.imul(xpSeed,1664525)+1013904223)>>>0;return xpSeed/4294967296;};
                g.nextXpCrateFrame=g.frame+XP_INTERVAL;g.xpWave=0;g.xpWaveCarry=0;
                const combatRadius=__brScope.session?.isRespawnMode()?g.mapRadius:g.worldRadius;
                g.teamCrateQueue=[];g.teamCrateCap=count+P.respawnExtra;g.teamXpCrateCap=count;
                for(let i=0;i<count;i++){const sideWanted=__brScope.brSurvivalFarmSlot(g),side=sideWanted?__brScope.brSurvivalFarmPoint(g,combatRadius-140,BOUND,players):null;let used=false;for(let tries=0;tries<140;tries++) {
                    const near=players[i%Math.max(1,players.length)],angle=random()*Math.PI*2;
                    const distance=tries<24&&near?180+random()*220:Math.sqrt(random())*(combatRadius-240);
                    const pos=tries===0&&side?side:g.capture?__brScope.brCaptureRandomPoint(g,140,random):tries<24&&near?new __brScope.Vec2(near.pos.x+Math.cos(angle)*distance,near.pos.y+Math.sin(angle)*distance):new __brScope.Vec2(Math.cos(angle)*distance,Math.sin(angle)*distance);
                    if((g.capture?!__brScope.brCaptureFarmClear(g,pos,BOUND):pos.dist(g.center)>combatRadius-140)||(g.escapeBlocks?.(pos,BOUND)||g.checkWallCollision(pos,BOUND+28)||g.blocksCoverEntry?.(pos,BOUND)))continue;
                    if(g.farmBoxes.some(b=>b.pos.dist(pos)<BOUND*2+24)||players.some(p=>p.pos.dist(pos)<p.radius+BOUND+30))continue;
                    addBox(g,{id:++g.farmSeq,pos,halfSize:HALF,radius:BOUND,hp:UNITS_TO_BREAK,maxHp:UNITS_TO_BREAK,kind:'xp',born:g.frame,lastHits:new Map()});if(sideWanted){if(pos===side)g.sideFarm.placed++;else g.sideFarm.fallback++;used=true;}break;
                }if(sideWanted&&!used)g.sideFarm.fallback++;}
            }
            function dispose(g) {g.sideFarm=null;g.farmFlash=new Map();g.teamCrateQueue=[];g.teamCrateCap=0;g.teamXpCrateCap=0;g.farmBoxes=[];g.xpBundles=[];g.farmGrid=new Map();g._farmSnapshot=null;g.farmRevision=0;g.farmSeq=0;g.farmRandom=null;g.nextHealCrateFrame=0;g.healWave=0;g.healWaveCarry=0;g.xpWaveRandom=null;g.nextXpCrateFrame=0;g.xpWave=0;g.xpWaveCarry=0;}
            function spawn(g,pos,amount,source) {
                if(!g.xpBundles)return null;
                // Normal BR has at most ~57 drops. Repeated respawns also stay bounded:
                // merge one closest old pair at the cap, preserving XP and the new death position.
                if(g.xpBundles.length>=96) {
                    let first=-1,second=-1,best=Infinity;
                    for(let i=0;i<g.xpBundles.length;i++)for(let j=i+1;j<g.xpBundles.length;j++) {
                        const a=g.xpBundles[i],b=g.xpBundles[j];if(a.source!==b.source)continue;
                        const dx=a.pos.x-b.pos.x,dy=a.pos.y-b.pos.y,d=dx*dx+dy*dy;
                        if(d<best){best=d;first=i;second=j;}
                    }
                    if(first>=0){g.xpBundles[first].amount+=g.xpBundles[second].amount;g.xpBundles[first].born=Math.max(g.xpBundles[first].born,g.xpBundles[second].born);g.xpBundles.splice(second,1);}
                }
                if(g.capture)pos=__brScope.brArenaClamp(g,pos,20);
                const drop={id:++g.farmSeq,pos:new __brScope.Vec2(pos.x,pos.y),amount:source===2?HEAL_FRACTION:Math.max(1,Math.round(amount)),source:source||0,born:g.frame};
                g.xpBundles.push(drop);dirty(g);return drop;
            }
            function spawnHealthWave(g) {
                const alive=(g.activeParticipants||g.participants).filter(p=>p.alive&&real(p));
                const safeRadius=Math.min(g.worldRadius-190,g.mapRadius-170);
                if(alive.length<2||safeRadius<260)return 0;
                const random=g.farmRandom||__brScope.random,largeClass=alive.length>=24;
                const wanted=waveTarget(g,'healWaveCarry',largeClass&&g.healWave%2===0?3:2,P.farmHealWave);g.healWave++;
                let existing=occupied(g,'heal'),created=0;
                for(let i=0;i<wanted&&existing+created<P.healCap&&(!__brScope.session?.isRespawnMode()||g.farmBoxes.length+(g.teamCrateQueue?.length||0)<g.teamCrateCap);i++)for(let tries=0;tries<100;tries++) {
                    const angle=random()*Math.PI*2,minRadius=Math.min(220,safeRadius*.18);
                    const distance=minRadius+Math.sqrt(random())*Math.max(0,safeRadius-minRadius);
                    const pos=g.capture?__brScope.brCaptureRandomPoint(g,140,random):new __brScope.Vec2(Math.cos(angle)*distance,Math.sin(angle)*distance);
                    if(!__brScope.brCaptureFarmClear(g,pos,BOUND))continue;
                    if((g.escapeBlocks?.(pos,BOUND)||g.checkWallCollision(pos,BOUND+26)||g.blocksCoverEntry?.(pos,BOUND)))continue;
                    if(g.farmBoxes.some(b=>b.pos.dist(pos)<BOUND*2+28)||alive.some(p=>p.pos.dist(pos)<p.radius+BOUND+34))continue;
                    const hp=UNITS_TO_BREAK*1.3;
                    addBox(g,{id:++g.farmSeq,pos,halfSize:HALF,radius:BOUND,hp,maxHp:hp,kind:'heal',born:g.frame,lastHits:new Map()});created++;break;
                }
                if(created)dirty(g);return created;
            }
            function spawnXpWave(g) {
                const alive=(g.activeParticipants||g.participants).filter(p=>p.alive&&real(p));
                const safeRadius=Math.min(g.worldRadius-190,g.mapRadius-170);
                if(alive.length<2||safeRadius<260||!alive.some(p=>p.run&&p.run.level<__brScope.BR_RUN_MAX_LEVEL))return 0;
                const random=g.xpWaveRandom;if(!random)return 0;
                const cap=Math.min(P.xpCap,Math.max(12,Math.ceil(alive.length*1.6*P.farmXpWave)));
                const wanted=waveTarget(g,'xpWaveCarry',Math.min(8,Math.max(2,Math.ceil(alive.length/4))),P.farmXpWave,P.xpWaveCap);
                const existing=g.farmBoxes.filter(b=>b.kind==='xp').length;let created=0;
                for(let i=0;i<wanted&&existing+created<cap;i++){const sideWanted=__brScope.brSurvivalFarmSlot(g),side=sideWanted?__brScope.brSurvivalFarmPoint(g,safeRadius,BOUND,alive):null;let used=false;for(let tries=0;tries<100;tries++) {
                    const angle=random()*Math.PI*2,minRadius=Math.min(180,safeRadius*.15);
                    const distance=minRadius+Math.sqrt(random())*(safeRadius-minRadius);
                    const pos=tries===0&&side?side:g.capture?__brScope.brCaptureRandomPoint(g,140,random):new __brScope.Vec2(g.center.x+Math.cos(angle)*distance,g.center.y+Math.sin(angle)*distance);
                    if(!__brScope.brCaptureFarmClear(g,pos,BOUND))continue;
                    if((g.escapeBlocks?.(pos,BOUND)||g.checkWallCollision(pos,BOUND+26)||g.blocksCoverEntry?.(pos,BOUND)))continue;
                    if(g.farmBoxes.some(b=>b.pos.dist(pos)<BOUND*2+28)||alive.some(p=>p.pos.dist(pos)<p.radius+BOUND+34))continue;
                    addBox(g,{id:++g.farmSeq,pos,halfSize:HALF,radius:BOUND,hp:UNITS_TO_BREAK,maxHp:UNITS_TO_BREAK,
                        kind:'xp',born:g.frame,waveSpawn:true,lastHits:new Map()});created++;if(sideWanted){if(pos===side)g.sideFarm.placed++;else g.sideFarm.fallback++;used=true;}break;
                }if(sideWanted&&!used)g.sideFarm.fallback++;}
                g.xpWave++;if(created)dirty(g);return created;
            }
            function updateXpCrates(g) {
                let changed=false;
                if(g.frame%30===0)for(const box of g.farmBoxes.slice()) {
                    if(box.kind!=='xp')continue;
                    if((g.capture?!__brScope.brArenaContains(g,box.pos,BOUND):box.pos.dist(g.center)>g.mapRadius-BOUND)||(box.waveSpawn&&g.frame-box.born>=XP_WAVE_LIFETIME)) {
                        removeBox(g,box);changed=true;
                    }
                }
                if(changed)dirty(g);
                if(g.frame>=g.nextXpCrateFrame) {
                    // Skip missed waves instead of flooding the map after a stall or a restored frame.
                    g.nextXpCrateFrame=g.frame+XP_INTERVAL;spawnXpWave(g);
                }
            }
            function updateHealthCrates(g) {
                let changed=false;
                // Expiry/out-of-zone cleanup is presentation-paced; combat hits remain 60 Hz.
                if(g.frame%30===0)for(const box of g.farmBoxes.slice())if(box.kind==='heal'&&(g.frame-box.born>=HEAL_LIFETIME||(g.capture?!__brScope.brArenaContains(g,box.pos,70):box.pos.dist(g.center)>g.mapRadius-70))){removeBox(g,box);changed=true;}
                if(changed)dirty(g);
                if(g.frame>=g.nextHealCrateFrame){while(g.nextHealCrateFrame<=g.frame)g.nextHealCrateFrame+=HEAL_INTERVAL;spawnHealthWave(g);}
            }
            function death(g,p) {
                if(!real(p)||p._farmDropDeathSeq===p.eliminationSeq)return;
                p._farmDropDeathSeq=p.eliminationSeq;
                spawn(g,p.pos,Math.min(__brScope.BR_DEATH_XP_CAP,Math.max(1,Number(p.run?.level||1))+1),1);
            }
            function damage(g,box,owner,units,token) {
                if(!box||box.hp<=0||!real(owner)||!Number.isFinite(units)||units<=0)return false;
                token=token||'hit:'+g.frame;
                const id=(owner.remoteId||owner.id)+'|'+Number(owner.lifeSeq||0);
                let history=box.lastHits.get(id);if(!history){history={tokens:new Map()};box.lastHits.set(id,history);}
                if(history.tokens.has(token))return false;
                history.tokens.set(token,g.frame);
                if(history.tokens.size>32)for(const [prior,at] of history.tokens){if(g.frame-at>180||history.tokens.size>32)history.tokens.delete(prior);else break;}
                box.hp=Math.max(0,box.hp-units);dirty(g);
                (g.farmFlash||(g.farmFlash=new Map())).set(box.id,g.frame);
                if(box.hp<=1e-6) {
                    removeBox(g,box);
                    spawn(g,box.pos,box.kind==='heal'?HEAL_FRACTION:1,box.kind==='heal'?2:0);
                }
                g.emitStudentFx('impact',box.pos,{size:box.hp<=0?76:48,color:box.kind==='heal'?'#4ade80':'#fbbf24',style:box.hp<=0?'farm-break':'farm',sourceId:owner.remoteId||('player-'+owner.id),geometry:{crateId:box.id,action:token,hp:Math.round(box.hp/Math.max(.01,box.maxHp)*100),broken:box.hp<=0?1:0}});
                return true;
            }
            function brCrateExposed(g,from,box){
                const h=__brScope.brCrateHalf(box),x=__brScope.brCrateX(box),y=__brScope.brCrateY(box);
                const px=Math.max(x-h,Math.min(x+h,from.x)),py=Math.max(y-h,Math.min(y+h,from.y));
                return !g.checkWallBetween(from,{x:px,y:py});
            }
            function area(g,owner,pos,radius,units=.65,token) {
                if(!g.farmBoxes?.length||!real(owner))return;
                token=token||'area:'+g.frame;
                for(const box of g.farmBoxes.slice()) {
                    if(__brScope.brCrateCircleTouches(box,pos,radius)&&brCrateExposed(g,pos,box))damage(g,box,owner,units,token);
                }
            }
            function cone(g,owner,aim,range,halfAngle,units,token) {
                if(!g.farmBoxes?.length||!real(owner))return;
                for(const box of g.farmBoxes.slice()) {
                    if(__brScope.brCrateSectorTouches(box,owner.pos,aim,range,halfAngle)&&brCrateExposed(g,owner.pos,box))damage(g,box,owner,units,token);
                }
            }
            function line(g,owner,from,to,width,units,token,shape='capsule') {
                if(!g.farmBoxes?.length||!real(owner))return;
                for(const box of g.farmBoxes.slice()) {
                    const hit=shape==='beam'?__brScope.brCrateBeamTouches(box,from,to,width):__brScope.brCrateSweepTime(box,from,to,width)!==null;
                    if(hit&&brCrateExposed(g,from,box))damage(g,box,owner,units,token);
                }
            }
            function projectileContacts(g,shot,from,to,wall,contacts) {
                if(!g.farmBoxes?.length||!real(shot.owner))return;
                const r=HALF+shot.size;
                const minX=Math.floor((Math.min(from.x,to.x)-r)/CELL),maxX=Math.floor((Math.max(from.x,to.x)+r)/CELL);
                const minY=Math.floor((Math.min(from.y,to.y)-r)/CELL),maxY=Math.floor((Math.max(from.y,to.y)+r)/CELL);
                for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(const box of g.farmGrid.get(key(x,y))||[]) {
                    const last=shot._farmHitIds?.get(box.id);
                    if(box.hp<=0||(last!==undefined&&(shot.type!=='ORBIT'||g.frame-last<12)))continue;
                    const t=__brScope.brCrateSweepTime(box,from,to,shot.size);
                    if(t!==null&&(!wall||t<wall.t))contacts.push({farm:box,t});
                }
            }
            function projectileHit(g,shot,box) {
                if(box.hp<=0)return false;
                (shot._farmHitIds||(shot._farmHitIds=new Map())).set(box.id,g.frame);
                const token=shot.type==='ORBIT'?'orbit:'+g.frame:shot.farmToken||('shot:'+shot.inputKind+':'+shot.inputSeq+':'+(shot.farmBornFrame??g.frame));
                damage(g,box,shot.owner,shot.type==='ORBIT'?12/90:shot.farmDamage||.65,token);
                if(shot.playerSkillBlast){shot.detonatePlayerSkill(g);return true;}
                if(shot.explodeRadius>0) {
                    area(g,shot.owner,shot.pos,shot.explodeRadius,shot.farmDamage||.65,token);
                    g.spawnExplosion(shot.pos,shot.explodeRadius,shot.impactColor||shot.color);
                    g.applyAoE(shot.pos,shot.explodeRadius,shot.damage,shot.owner,Math.max(12,shot.baseKnockback??shot.knockback)*(shot.rangedPushFactor??1),{scaled:true,wangguiPower:shot.wangguiPower,style:'projectile-blast'});
                }
                if(shot.type!=='ORBIT'&&shot.type!=='BOOMERANG'&&!shot.pierce){shot.life=0;return true;}
                return false;
            }
            function updateTeamCrates(g) {
                if(g.frame%30!==0)return;
                const queue=g.teamCrateQueue||(g.teamCrateQueue=[]),random=g.farmRandom||__brScope.random;
                // Expired heal crates retain their reservation while respawning.
                // This uses the existing 30-tick queue cadence, not a new timer.
                let expired=false;
                for(const box of g.farmBoxes.slice())if(box.kind==='heal'&&g.frame-box.born>=HEAL_LIFETIME){removeBox(g,box);expired=true;}
                if(expired)dirty(g);
                if(g.frame>=g.nextHealCrateFrame){g.nextHealCrateFrame=g.frame+__brScope.BR_TEAM_KILL_RULES.boxRespawnFrames;
                    if(g.farmBoxes.length+queue.length<g.teamCrateCap)spawnHealthWave(g);}
                const radius=Math.max(150,g.mapRadius-170),alive=(g.activeParticipants||g.participants).filter(p=>p.alive&&real(p));
                for(let i=queue.length-1;i>=0;i--){const pending=queue[i];if(pending.at>g.frame)continue;
                    const kindCap=pending.kind==='heal'?P.healCap:g.teamXpCrateCap;
                    if(g.farmBoxes.length>=g.teamCrateCap||occupied(g,pending.kind)>kindCap){queue.splice(i,1);continue;}
                    let placed=false;
                    for(let tries=0;tries<80;tries++){
                        const angle=random()*Math.PI*2,distance=Math.sqrt(random())*radius,pos=g.capture?__brScope.brCaptureRandomPoint(g,140,random):new __brScope.Vec2(g.center.x+Math.cos(angle)*distance,g.center.y+Math.sin(angle)*distance);
                        if(!__brScope.brCaptureFarmClear(g,pos,BOUND))continue;
                        if(Math.hypot(pos.x-pending.x,pos.y-pending.y)<200||(g.escapeBlocks?.(pos,BOUND)||g.checkWallCollision(pos,BOUND+28)||g.blocksCoverEntry?.(pos,BOUND)))continue;
                        if(g.farmBoxes.some(b=>b.pos.dist(pos)<BOUND*2+28)||alive.some(p=>p.pos.dist(pos)<p.radius+BOUND+34))continue;
                        if(g.zones.some(z=>z.duration>0&&z.pos.dist(pos)<z.radius+BOUND))continue;
                        const hp=pending.kind==='heal'?UNITS_TO_BREAK*1.3:UNITS_TO_BREAK;
                        addBox(g,{id:++g.farmSeq,pos,halfSize:HALF,radius:BOUND,hp,maxHp:hp,kind:pending.kind,born:g.frame,lastHits:new Map()});
                        placed=true;dirty(g);break;
                    }
                    if(placed)queue.splice(i,1);else pending.at=g.frame+60;
                }
            }
            function update(g) {
                if(__brScope.session?.isRespawnMode())updateTeamCrates(g);else{updateHealthCrates(g);updateXpCrates(g);}
                if(!g.xpBundles?.length)return;
                g.farmPickupSearchRadius=Math.max(100,...g.participants.filter(p=>p.alive&&real(p)).map(p=>p.radius+__brScope.BR_COLLECTIBLE_RULES.pickupExtra));
                for(let i=g.xpBundles.length-1;i>=0;i--) {
                    const drop=g.xpBundles[i];if(g.frame-drop.born<12)continue;
                    if(g.frame-drop.born>5400&&(g.capture?!__brScope.brArenaContains(g,drop.pos):drop.pos.dist(g.center)>g.mapRadius+180)){g.xpBundles.splice(i,1);dirty(g);continue;}
                    let picker=null,best=Infinity;
                    for(const p of g.getNearbyParticipants(drop.pos,g.farmPickupSearchRadius||150)) {
                        if(!p.alive||!real(p))continue;
                        if(drop.source===2&&p.hp>=p.maxHp-.5)continue;
                        const dx=p.pos.x-drop.pos.x,dy=p.pos.y-drop.pos.y,d=dx*dx+dy*dy,r=p.radius+__brScope.BR_COLLECTIBLE_RULES.pickupExtra;
                        if(d<=r*r&&(d<best||(d===best&&p.id<picker.id))&&!g.checkWallBetween(p.pos,drop.pos)){picker=p;best=d;}
                    }
                    if(!picker)continue;
                    g.xpBundles.splice(i,1);dirty(g);
                    if(drop.source===2) {
                        const healed=Math.min(picker.maxHp-picker.hp,picker.maxHp*HEAL_FRACTION);
                        picker.hp=Math.min(picker.maxHp,picker.hp+picker.maxHp*HEAL_FRACTION);
                        g.addText(picker.pos,'HEAL +'+Math.round(healed),'#86efac',28,24);g.spawnImpact(picker.pos,74,'#4ade80',.8);
                    } else {
                        __brScope.brProgression?.awardXP(picker,drop.amount,drop.source===1?.10:.05);
                        g.addText(picker.pos,'+'+drop.amount+' XP','#67e8f9',24,22);
                    }
                }
            }
            function snapshot(g) {
                if(g._farmSnapshot)return g._farmSnapshot;
                const supply=g.supplyDrop&&!g.supplyDrop.claimed&&g.supplyDrop.life>0?g.supplyDrop:null;
                const snapshot={r:g.farmRevision||0,b:(g.farmBoxes||[]).map(b=>[b.id,b.pos.x,b.pos.y,Math.round(b.hp/Math.max(.01,b.maxHp||1)*100),b.kind||'xp',__brScope.brCrateHalf(b)]),x:(g.xpBundles||[]).map(d=>[d.id,Math.round(d.pos.x),Math.round(d.pos.y),d.amount,d.source]),s:supply?[Math.round(supply.pos.x),Math.round(supply.pos.y),supply.landed?1:0]:null};
                const combat = g.combatSupply;
                if (combat) snapshot.c = [Math.round(combat.pos.x), Math.round(combat.pos.y), combat.landed ? 1 : 0, combat.kind];
                return g._farmSnapshot = snapshot;
            }
            
            // Count complete attack intervals, including the first hit at time zero.
            // This keeps slow/heavy and rapid/multishot basics near 1–2 seconds alike.
            function basicUnits(frames){return 1/(Math.ceil(60/Math.max(1,Number(frames||45)))+1);}

            return {radius:BOUND,halfSize:HALF,init,dispose,spawn,death,damage,area,cone,line,projectileContacts,projectileHit,update,snapshot,basicUnits,changed:dirty};
        })();}]
];
