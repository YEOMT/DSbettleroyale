// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.GameWorld = class GameWorld {
            constructor(participants) {
                this.participants = participants;
                this.deadParticipants = [];
                this.eliminationCounter = 0;
                this.projectiles = []; this.particles = []; this.zones = []; this.turrets = []; this.texts = []; this.swings = []; this.walls = [];
                this.smokes = [];
                this.rings = [];
                this.signatureEffects = [];
                // 학생 화면에는 무거운 파티클 대신 짧은 선/호/피격 이벤트만 전송한다.
                this.studentFx = [];
                this.studentFxSeq = 0;this.visualShotSeq=0;this.retiredShots=[];
                this.pendingDashContacts=[];this.deferDashContacts=false;this.resolvingDashContacts=false;
                this.confetti = []; // ✨ 우승 꽃가루 배열
                
                // 20~30명이 서로 바로 마주치지 않도록 교실 대전 전장을 대폭 확장한다.
                this.worldRadius = __brScope.BR_WORLD_RADIUS; this.mapRadius = __brScope.BR_WORLD_RADIUS*(__brScope.session?.isRespawnMode()?__brScope.BR_TEAM_KILL_RULES.arenaScale:1); this.center = new __brScope.Vec2(0, 0);
                const requestedMap=__brScope.session?.active ? __brScope.session.roomMeta?.mapIndex : -1;
                this.mapIndex=Number.isInteger(requestedMap)&&requestedMap>=0&&requestedMap<5 ? requestedMap : Math.floor(__brScope.rand()*5);
                this.mapNames=['🌪️ 유동 폐허','➕ 십자로','🌫️ 연막 폐허','🏟️ 네 갈래 광장','📦 화물 기지'];
                this.mapName = this.mapNames[this.mapIndex];
                this.cam = new __brScope.Vec2(0,0); this.lookAt = new __brScope.Vec2(0,0); this.zoom = 0.5; 
                this.frame = 0; this.speed = 1; this.paused = false;
                
                this.shakeAmount = 0;
                this.cameraKick = new __brScope.Vec2(0,0);
                this.screenFlashAlpha = 0;
                this.screenFlashColor = '255,255,255';
                this.vignettePulse = 0;
                this.hitStopFrames = 0;
                this.lastCombatFrame = 0;
                this.lastConvergenceTrigger = -9999;
                this.announcement = '';
                this.announcementLife = 0;
                this.isGameOver = false; // ✨ 우승 확정 팡파레 상태 변수
                this.lastAliveGroups = undefined; // Top3 진입 감지용
                this.winner = null;
                this.resultShown = false;
                this.matchEndedAt = null;
                // v17 performance / paced battle state
                this.aliveRealPlayers = [];
                this.teamAliveCounts = new Map();
                this.spatialGrid = new Map();
                this.activeSpatialBuckets = [];
                this.spatialCellSize = 260;
                this.maxBodyRadius = 128;
                this.activeParticipants = [];
                this.bodyMovedParticipants = [];
                this._wallCollisionCandidates = [];
                this._wallTraceCandidates = [];
                this.firstBloodDone = false;
                this.eventFeed = [];
                this.eventCounter = 0;
                this.eventFocusPos = null;
                this.eventFocusFrames = 0;
                this.finalPhase = false;
                this.finalPhaseTriggered = false;
                this.finalPhaseStartedAt = null;
                this.lastBroadcastStage = '';
                this.supplyDrop = null;
                this.supplyDropSpawned = false;
                this.supplyDropSpawnFrame = Math.round(__brScope.randRange(1050,1750));

                if(__brScope.brCaptureMode())__brScope.brCaptureSetupMap(this);else{this.initMap();this.scaleArenaLayout();this.addCombatCover();}this.initParticipants();__brScope.brSurvivalTerrain(this);
                if(__brScope.session?.active&&__brScope.brProgression){
                    this.participants.forEach(p=>__brScope.brProgression.init(p));
                    if(__brScope.brFarm)__brScope.brFarm.init(this);
                }
                this.refreshAliveCache();
                this.maxBodyRadius=Math.max(38,...this.activeParticipants.map(p=>p.radius));
                this.rebuildSpatialGrid();
            }

            initMap() {
                const addWall=(x,y,w,h,angle=0,spin=null,kind='wall')=>{
                    const wall=new __brScope.Wall(x,y,w,h,angle,kind);
                    if(spin!==null) wall.spinSpeed=spin;
                    this.walls.push(wall); return wall;
                };
                const polarPoint=(minR,maxR)=>{
                    const a=__brScope.rand()*Math.PI*2,r=minR+(maxR-minR)*Math.sqrt(__brScope.rand());
                    return {x:Math.cos(a)*r,y:Math.sin(a)*r,a,r};
                };
                const addCrates=(count,minR,maxR)=>{
                    for(let i=0;i<count;i++) {
                        const p=polarPoint(minR,maxR),size=72+__brScope.rand()*54;
                        addWall(p.x,p.y,size,size*(.82+__brScope.rand()*.25),__brScope.rand()*Math.PI,0,'crate');
                    }
                };

                if(this.mapIndex===0) {
                    addWall(0,0,260,24,0,0);
                    for(let i=0;i<18;i++) {
                        const p=polarPoint(360,2380),w=180+__brScope.rand()*260,h=18+__brScope.rand()*12;
                        addWall(p.x,p.y,w,h,__brScope.rand()*Math.PI,(__brScope.rand()-.5)*.0045);
                    }
                    addCrates(8,520,2380);
                } else if(this.mapIndex===1) {
                    // 중앙은 넓게 열어 두고 외곽에 방사형 엄폐물을 배치한다.
                    addWall(0,-390,400,18,0,0); addWall(0,390,400,18,0,0);
                    addWall(-390,0,400,18,Math.PI/2,0); addWall(390,0,400,18,Math.PI/2,0);
                    for(const [x,y,a] of [[-720,-560,.3],[720,-560,-.3],[-720,560,-.3],[720,560,.3]]) addWall(x,y,190,16,a,0);
                    for(let i=0;i<12;i++) {
                        const a=i*Math.PI/6+(i%2?.16:-.12),d=i%2?1880:1200;
                        addWall(Math.cos(a)*d,Math.sin(a)*d,220+(i%3)*55,22,a+Math.PI/2,0,i%4===0?'rock':'wall');
                    }
                    addCrates(8,620,2400);
                } else if(this.mapIndex===2) {
                    // 연막 사이에 바위와 짧은 폐벽을 흩어 놓은 은폐 중심 맵.
                    for(let i=0;i<14;i++) {
                        const p=polarPoint(420,2400);
                        addWall(p.x,p.y,105+__brScope.rand()*125,58+__brScope.rand()*44,__brScope.rand()*Math.PI,0,'rock');
                    }
                    for(let i=0;i<8;i++) {
                        const p=polarPoint(500,2320);
                        addWall(p.x,p.y,145+__brScope.rand()*175,18+__brScope.rand()*10,__brScope.rand()*Math.PI,0,'wall');
                    }
                    addCrates(7,650,2380);
                } else if(this.mapIndex===3) {
                    // Four symmetric courts: a clear central cross and wide paths around every cover island.
                    // No closed wall loops, so movement, aim and escape remain readable on touch screens.
                    for(const sx of [-1,1]) for(const sy of [-1,1]) {
                        addWall(sx*690,sy*1080,700,34,0,0,'wall');
                        addWall(sx*1120,sy*620,620,34,Math.PI/2,0,'wall');
                        addWall(sx*470,sy*430,190,66,sx*sy*.35,0,'rock');
                        addWall(sx*1500,sy*1120,220,96,0,0,'rock');
                        addWall(sx*850,sy*1750,240,38,0,0,'wall');
                        addWall(sx*1730,sy*570,100,100,0,0,'crate');
                    }
                } else if(this.mapIndex===4) {
                    // Staggered cargo rows create distinct long lanes and short cover-to-cover crossings.
                    // Every container has at least two open exits; a broad central aisle stays unobstructed.
                    for(const y of [-1440,-720,0,720,1440]) {
                        const alternate=Math.abs(y/720)%2;
                        for(const sx of [-1,1]) {
                            addWall(sx*(alternate?1000:820),y,alternate?510:650,110,0,0,'crate');
                            addWall(sx*(alternate?1680:1570),y+190,150,100,0,0,'rock');
                        }
                    }
                    for(const sx of [-1,1]) {
                        addWall(sx*300,-410,150,42,Math.PI/2,0,'wall');
                        addWall(sx*300,410,150,42,Math.PI/2,0,'wall');
                    }
                }

                // 화면과 판정 반경이 같은 Small / Medium / Large 연막만 둔다.
                const smokeRadii=[118,150,182];
                const placeSmoke=(count,minR,maxR)=>{
                    for(let i=0;i<count;i++) {
                        let placed=false;
                        for(let tries=0;tries<70&&!placed;tries++) {
                            const p=polarPoint(minR,maxR);
                            const radius=smokeRadii[Math.floor(__brScope.rand()*smokeRadii.length)];
                            const pos=new __brScope.Vec2(p.x,p.y);
                            if(this.checkWallCollision(pos,radius*.32)) continue;
                            if(this.smokes.some(s=>s.pos.dist(pos)<s.radius+radius*.72)) continue;
                            this.smokes.push(new __brScope.SmokeCover(p.x,p.y,radius,i+this.mapIndex*53));
                            placed=true;
                        }
                    }
                };
                // 물리 엄폐를 소수만 보강해 추격을 끊되 이동 통로를 미로로 만들지 않는다.
                const coverPatterns=[
                    ['wall','rock','wall','crate','rock','wall'],
                    ['wall','rock','wall','rock','wall','rock'],
                    ['rock','wall','rock','wall','rock'],
                    ['wall','rock','wall','rock','wall','rock'],
                    ['crate','rock','crate','wall','crate','rock']
                ],coverPattern=coverPatterns[this.mapIndex];
                for(let i=0;i<coverPattern.length;i++) {
                    for(let tries=0;tries<50;tries++) {
                        const p=polarPoint(560,2400),kind=coverPattern[i];
                        const w=kind==='wall'?150+__brScope.rand()*70:82+__brScope.rand()*42,h=kind==='wall'?24+__brScope.rand()*10:70+__brScope.rand()*36;
                        const clearance=Math.hypot(w,h)*.62,pos=new __brScope.Vec2(p.x,p.y);
                        if(this.checkWallCollision(pos,clearance)) continue;
                        addWall(p.x,p.y,w,h,__brScope.rand()*Math.PI,0,kind);break;
                    }
                }
                // 연막은 내부의 적만 숨기는 고정 은폐 지대다. 바깥 시야를 차단하지 않는다.
                placeSmoke([8,9,10,8,7][this.mapIndex],480,2400);
                // Fixed cover keeps collision prediction identical on the host and every student.
                if(__brScope.session?.active) this.walls.forEach(w=>{w.spinSpeed=0;});
            }

            scaleArenaLayout() {
                // initMap builds the original design. Scale positions once, before spawning participants.
                // Clear its broad-phase index: it may already have been created while placing cover.
                const layoutScale=__brScope.BR_ARENA_SCALE*(__brScope.session?.isRespawnMode()?__brScope.BR_TEAM_KILL_RULES.arenaScale:1);
                for(const w of this.walls) {
                    w.x*=layoutScale;w.y*=layoutScale;
                    w.minX=w.x-w.w/2;w.maxX=w.x+w.w/2;w.minY=w.y-w.h/2;w.maxY=w.y+w.h/2;
                }
                for(const smoke of this.smokes){smoke.x*=layoutScale;smoke.y*=layoutScale;smoke.pos=new __brScope.Vec2(smoke.x,smoke.y);}
                __brScope.combatWallGridCache.delete(this.walls);
                this._wallCollisionCandidates.length=0;this._wallTraceCandidates.length=0;
            }

            addCombatCover() {
                // Final-coordinate, opposed pairs. Does not consume the combat/map RNG.
                // Existing three-segment groups; v31 validates the current roster clearance separately.
                const limit=(__brScope.session?.isRespawnMode()?this.worldRadius*__brScope.BR_TEAM_KILL_RULES.arenaScale:this.worldRadius),margin=112;
                const make=(cx,cy,turn,group)=>{
                    const angle=Math.round(turn*Math.PI/2*1e6)/1e6,cs=Math.cos(angle),sn=Math.sin(angle),out=[];
                    for(const [x,y,w,h] of [[0,-128,384,28],[-178,0,28,280],[178,0,28,280]]){
                        const xx=Math.round(cx+x*cs-y*sn),yy=Math.round(cy+x*sn+y*cs),ww=w,hh=h;
                        const wall=Object.assign(Object.create(__brScope.Wall.prototype),{x:xx,y:yy,w:ww,h:hh,angle,kind:'wall',spinSpeed:0,coverGroup:group,
                            minX:xx-ww/2,maxX:xx+ww/2,minY:yy-hh/2,maxY:yy+hh/2});out.push(wall);
                    }return out;
                };
                const clear=walls=>{
                    for(const w of walls){
                        if(Math.hypot(w.x,w.y)+Math.hypot(w.w,w.h)/2>limit-145)return false;
                        if(Math.hypot(w.x,w.y)-Math.hypot(w.w,w.h)/2<540)return false;
                        // Expanded samples cover the new wall, including end caps.
                        const n=Math.ceil(Math.max(w.w,w.h)/28);
                        for(let i=0;i<=n;i++){
                            const lx=w.w>w.h?(i/n-.5)*w.w:0,ly=w.h>=w.w?(i/n-.5)*w.h:0,x=w.x+lx*Math.cos(w.angle)-ly*Math.sin(w.angle),y=w.y+lx*Math.sin(w.angle)+ly*Math.cos(w.angle);
                            if(this.checkWallCollision(new __brScope.Vec2(x,y),margin+Math.min(w.w,w.h)/2)||this.blocksCoverEntry(new __brScope.Vec2(x,y),120))return false;
                        }
                    }
                    for(let i=0;i<walls.length;i+=3){const back=walls[i],x=(walls[i+1].x+walls[i+2].x)/2,y=(walls[i+1].y+walls[i+2].y)/2,dx=(x-back.x)/128,dy=(y-back.y)/128;
                        for(let d=0;d<=440;d+=28)if(this.checkWallCollision(new __brScope.Vec2(x+dx*d,y+dy*d),120))return false;
                    }return true;
                };
                this.combatCover=[];
                outer:for(const fraction of [.48,.58,.68,.78,.40,.84])for(let k=0;k<64;k++){
                    const a=(k+this.mapIndex*5)*Math.PI/32,cx=Math.round(Math.cos(a)*limit*fraction),cy=Math.round(Math.sin(a)*limit*fraction);
                    // Try inward and lateral openings; angles are serialized at six decimals.
                    const turn=Math.abs(cx)>Math.abs(cy)?(cx>0?1:3):(cy>0?2:0);
                    for(const offset of [0,.25,.5,.75,1,3,3.25,3.5,3.75]){const t=(turn+offset)%4,pair=[...make(cx,cy,t,'v16-a'),...make(-cx,-cy,(t+2)%4,'v16-b')];
                        if(clear(pair)){this.walls.push(...pair);this.combatCover=pair;break outer;}
                    }
                }
                if(!this.combatCover.length&&[0,2].includes(this.mapIndex)){
                    // Random rock/wall maps have no bilateral layout contract. If an
                    // opposed pair cannot fit, place each open structure independently.
                    for(let group=0;group<2;group++){
                        search:for(const fraction of [.58,.68,.48,.78,.40,.84])for(let k=0;k<96;k++){
                            const a=(k+group*48+this.mapIndex*5)*Math.PI/48,cx=Math.round(Math.cos(a)*limit*fraction),cy=Math.round(Math.sin(a)*limit*fraction);
                            const turn=Math.abs(cx)>Math.abs(cy)?(cx>0?1:3):(cy>0?2:0);
                            for(const offset of [0,.25,.5,.75,1,3,3.25,3.5,3.75]){const pieces=make(cx,cy,(turn+offset)%4,group?'v16-b':'v16-a');if(!clear(pieces))continue;
                                this.walls.push(...pieces);this.combatCover.push(...pieces);__brScope.combatWallGridCache.delete(this.walls);break search;}
                        }
                    }
                }
                this.mapRevision='combat-v16:'+this.mapIndex+':'+this.walls.length;
                __brScope.combatWallGridCache.delete(this.walls);this._wallCollisionCandidates.length=0;this._wallTraceCandidates.length=0;
            }

            blocksCoverEntry(pos,padding=0) {
                const walls=this.combatCover||[];
                for(let i=0;i<walls.length;i+=3){const back=walls[i],x=(walls[i+1].x+walls[i+2].x)/2,y=(walls[i+1].y+walls[i+2].y)/2,dx=(x-back.x)/128,dy=(y-back.y)/128;
                    const px=pos.x-x,py=pos.y-y,along=px*dx+py*dy,side=Math.abs(px*dy-py*dx);
                    if(along>=-110-padding&&along<=(this.survival?600+__brScope.brSurvivalMaxRadius():560)+padding&&side<=120+padding)return true;
                }return false;
            }

            recordElimination(participant) {
                if(!participant||participant.id===999||participant.eliminationSeq>0)return participant&&participant.eliminationSeq||0;
                participant.eliminationSeq=++this.eliminationCounter;
                if(participant.run){participant.run.offer=null;participant.run.revision++;}
                if(!__brScope.session?.isRespawnMode()) {
                    const total=this.realParticipantCount||(this.realParticipantCount=this.participants.filter(p=>p.id!==999).length);
                    participant.placement=Math.max(2,total-participant.eliminationSeq+1);
                }
                if(this.capture)__brScope.BRCapture.death(this,participant);
                this.deadParticipants.push(participant);
                __brScope.brFarm.death(this,participant);
                return participant.eliminationSeq;
            }

            findSafeMapPoint(minRadius=120*__brScope.BR_ARENA_SCALE,maxRadius=2200*__brScope.BR_ARENA_SCALE,clearance=80) {
                if(this.capture){for(let n=0;n<96;n++){const pos=__brScope.brCaptureRandomPoint(this,clearance);if(__brScope.brCaptureFarmClear(this,pos,clearance)&&!this.checkWallCollision(pos,clearance))return pos;}throw new Error('점령전 생성 위치를 찾지 못했습니다.');}
                const maxR=Math.max(minRadius+20,Math.min(maxRadius,this.mapRadius-90));
                for(let tries=0;tries<45;tries++) {
                    const th=__brScope.rand()*Math.PI*2;
                    const r=Math.sqrt(__brScope.rand())*(maxR-minRadius)+minRadius;
                    const pos=new __brScope.Vec2(Math.cos(th)*r,Math.sin(th)*r);
                    if(pos.dist(this.center)>this.mapRadius-clearance) continue;
                    if(this.checkWallCollision(pos,clearance)) continue;
                    return pos;
                }
                // 드문 실패 시에도 벽 안 중앙을 반환하지 않고 8방향 안전 지점을 다시 찾는다.
                for(let i=0;i<8;i++) {
                    const th=i*Math.PI/4;
                    const pos=new __brScope.Vec2(Math.cos(th)*Math.min(420,maxR),Math.sin(th)*Math.min(420,maxR));
                    if(!this.checkWallCollision(pos,clearance)) return pos;
                }
                for(let ring=0;ring<18;ring++)for(let i=0;i<72;i++){
                    const r=(ring+.5)/18*Math.max(1,this.mapRadius-clearance-35),a=i*Math.PI/36,pos=new __brScope.Vec2(Math.cos(a)*r,Math.sin(a)*r);
                    if(!this.checkWallCollision(pos,clearance))return pos;
                }
                throw new Error('No collision-free map spawn');
            }

            findSafePointNear(anchor, maxOffset=180, clearance=70, placed=[]) {
                const offsets=[0,45,80,115,150,maxOffset];
                const baseAngle=__brScope.rand()*Math.PI*2;
                for(const r of offsets) {
                    const tries=r===0?1:12;
                    for(let i=0;i<tries;i++) {
                        const a=baseAngle+i*Math.PI*2/Math.max(1,tries);
                        const pos=r===0 ? new __brScope.Vec2(anchor.x,anchor.y)
                            : anchor.add(new __brScope.Vec2(Math.cos(a)*r,Math.sin(a)*r));
                        if(this.capture?!__brScope.brArenaContains(this,pos,clearance+35):pos.dist(this.center)>this.mapRadius-clearance-35)continue;
                        if(this.checkWallCollision(pos,clearance)) continue;
                        if(placed.some(q=>q.pos.dist(pos)<q.radius+clearance+16)) continue;
                        return pos;
                    }
                }
                return null;
            }

            initParticipants() {
                if(this.capture){const used=[];for(const p of this.participants){if(p.id===999)continue;const pos=__brScope.brCaptureSpawn(this,p,used);if(!pos)throw new Error('기지 생성 공간이 부족합니다.');p.pos=pos;p.lastPos=new __brScope.Vec2(pos.x,pos.y);used.push(p);__brScope.BRCapture.record(this.capture,p);}return;}
                const placed=[];

                if(__brScope.session?.roomMeta?.mode==='team-elim') {
                    const valid=(pos,p)=>pos.dist(this.center)<=this.mapRadius-p.radius-45&&!this.checkWallCollision(pos,p.radius+28)&&
                        !this.smokes.some(z=>Math.hypot(pos.x-z.x,pos.y-z.y)<z.radius+p.radius+12)&&!placed.some(q=>q.pos.dist(pos)<q.radius+p.radius+160);
                    for(const p of this.participants){if(p.id===999)continue;let chosen=null;
                        for(let n=0;n<120;n++){const candidate=this.findSafeMapPoint(60,this.mapRadius-100,p.radius+28);if(valid(candidate,p)){chosen=candidate;break;}}
                        if(!chosen)for(let ring=1;ring<20&&!chosen;ring++)for(let j=0;j<96;j++){const a=j*Math.PI/48,r=ring/20*(this.mapRadius-p.radius-60),v=new __brScope.Vec2(Math.cos(a)*r,Math.sin(a)*r);if(valid(v,p)){chosen=v;break;}}
                        if(!chosen)throw new Error('팀 생존전의 안전한 시작 위치를 찾지 못했습니다.');
                        p.pos=chosen;p.lastPos=new __brScope.Vec2(chosen.x,chosen.y);placed.push(p);
                    }return;
                }
                if(__brScope.teamMode>0) {
                    // v22.0: 팀마다 하나의 시작 집결 지점을 갖고, 팀원은 그 주변에서 함께 시작한다.
                    const teams=[...new Set(this.participants.filter(p=>p.id!==999&&p.team>0).map(p=>p.team))].sort((a,b)=>a-b);
                    const anchorRadius=Math.min(1900*__brScope.BR_ARENA_SCALE,Math.max(1200*__brScope.BR_ARENA_SCALE,this.mapRadius*0.68));
                    const angleOffset=__brScope.rand()*Math.PI*2;
                    const anchors=new Map();

                    teams.forEach((team,idx)=>{
                        const angle=angleOffset+idx*Math.PI*2/Math.max(1,teams.length);
                        const preferred=this.center.add(new __brScope.Vec2(Math.cos(angle)*anchorRadius,Math.sin(angle)*anchorRadius));
                        const anchor=this.findSafePointNear(preferred,230,95,placed)
                            || this.findSafeMapPoint(850*__brScope.BR_ARENA_SCALE,2150*__brScope.BR_ARENA_SCALE,95);
                        anchors.set(team,anchor);
                    });

                    for(const team of teams) {
                        const members=this.participants.filter(p=>p.team===team&&p.id!==999);
                        const anchor=anchors.get(team);
                        const clusterRadius=Math.min(235,100+members.length*14);

                        members.forEach((p,i)=>{
                            let chosen=this.findSafePointNear(anchor,clusterRadius,p.radius+28,placed);
                            if(!chosen) {
                                const a=i*Math.PI*2/Math.max(1,members.length);
                                const fallback=anchor.add(new __brScope.Vec2(Math.cos(a)*Math.min(120,clusterRadius),Math.sin(a)*Math.min(120,clusterRadius)));
                                if((!__brScope.session?.isRespawnMode()||fallback.dist(this.center)<this.mapRadius-p.radius-35)&&!this.checkWallCollision(fallback,p.radius+24) &&
                                   !placed.some(q=>q.pos.dist(fallback)<q.radius+p.radius+28)) chosen=fallback;
                            }
                            p.pos=chosen || this.findSafeMapPoint(420*__brScope.BR_ARENA_SCALE,2100*__brScope.BR_ARENA_SCALE,p.radius+24);
                            p.lastPos=new __brScope.Vec2(p.pos.x,p.pos.y);
                            placed.push(p);
                        });
                    }

                    // 팀이 없는 특수 참가자가 있다면 마지막에 일반 배치.
                    this.participants.filter(p=>p.team===0).forEach(p=>{
                        p.pos=this.findSafeMapPoint(420*__brScope.BR_ARENA_SCALE,2250*__brScope.BR_ARENA_SCALE,p.radius+24);
                        p.lastPos=new __brScope.Vec2(p.pos.x,p.pos.y);
                        placed.push(p);
                    });
                    return;
                }

                this.participants.forEach((p,i)=>{
                    let chosen=null;
                    for(let tries=0;tries<36;tries++) {
                        const candidate=this.findSafeMapPoint(420*__brScope.BR_ARENA_SCALE,2350*__brScope.BR_ARENA_SCALE,p.radius+34);
                        if(!placed.some(q=>q.pos.dist(candidate)<q.radius+p.radius+38)){chosen=candidate;break;}
                    }
                    p.pos=chosen || this.findSafeMapPoint(360*__brScope.BR_ARENA_SCALE,2250*__brScope.BR_ARENA_SCALE,p.radius+20);
                    p.lastPos=new __brScope.Vec2(p.pos.x,p.pos.y);
                    placed.push(p);
                });
            }

            checkWallCollision(pos, radius) {
                const radiusSq=radius*radius;
                const candidates=__brScope.combatWallCandidates(__brScope.brHostBodyWalls(this),pos.x-radius,pos.y-radius,pos.x+radius,pos.y+radius,this._wallCollisionCandidates);
                for(let w of candidates) {
                    // Recompute trigonometry only when a wall actually changes. An AABB test
                    // rejects distant cover before the exact rotated-rectangle collision test.
                    if(w._collisionAngle!==w.angle || w._collisionW!==w.w || w._collisionH!==w.h) {
                        w._collisionAngle=w.angle; w._collisionW=w.w; w._collisionH=w.h;
                        w._collisionCos=Math.cos(w.angle); w._collisionSin=Math.sin(w.angle);
                        w._collisionHalfX=Math.abs(w._collisionCos)*w.w*.5+Math.abs(w._collisionSin)*w.h*.5;
                        w._collisionHalfY=Math.abs(w._collisionSin)*w.w*.5+Math.abs(w._collisionCos)*w.h*.5;
                    }
                    let relX=pos.x-w.x, relY=pos.y-w.y;
                    if(Math.abs(relX)>w._collisionHalfX+radius || Math.abs(relY)>w._collisionHalfY+radius) continue;
                    const ca=w._collisionCos, sa=-w._collisionSin;
                    let rotatedX=relX*ca-relY*sa, rotatedY=relX*sa+relY*ca;
                    let closestX=Math.max(-w.w/2,Math.min(rotatedX,w.w/2));
                    let closestY=Math.max(-w.h/2,Math.min(rotatedY,w.h/2));
                    let dX=rotatedX-closestX, dY=rotatedY-closestY, distanceSq=dX*dX+dY*dY;
                    if(distanceSq < radiusSq) {
                        const dist=Math.sqrt(distanceSq);
                        // v20: 벽 중심이 아니라 실제 접촉면의 법선을 반환하여 벽을 따라 미끄러질 수 있게 한다.
                        let nx=0, ny=0;
                        if(dist > 0.001) { nx=dX/dist; ny=dY/dist; }
                        else {
                            const dxFace = w.w/2 - Math.abs(rotatedX);
                            const dyFace = w.h/2 - Math.abs(rotatedY);
                            if(dxFace < dyFace) nx = rotatedX >= 0 ? 1 : -1;
                            else ny = rotatedY >= 0 ? 1 : -1;
                        }
                        const cw=w._collisionCos, sw=w._collisionSin;
                        const normal = new __brScope.Vec2(nx*cw - ny*sw, nx*sw + ny*cw).norm();
                        return {x:w.x, y:w.y, wall:w, normal};
                    }
                }
                return null;
            }

            checkWallBetween(p1, p2) {
                return !!__brScope.combatTraceWalls(p1,p2,8,this.walls,this._wallTraceCandidates);
            }

            getCoverTypeAt(pos) {
                if(this.smokes.some(s=>__brScope.brSmokeContains(s,pos))) return 'smoke';
                return '';
            }

            segmentDistanceToPoint(a,b,p) {
                const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y;
                const len2=vx*vx+vy*vy;
                const t=len2>0?Math.max(0,Math.min(1,(wx*vx+wy*vy)/len2)):0;
                const dx=a.x+vx*t-p.x,dy=a.y+vy*t-p.y;
                return Math.sqrt(dx*dx+dy*dy);
            }

            isConcealedFrom(target,viewer) {
                return __brScope.brSmokeConcealed(this.smokes,target,viewer);
            }

            raycast(origin,dir,maxDist,owner,width=0) {
                return __brScope.brFirstBeamHit(origin,__brScope.brNormalizeAimVector(dir.x,dir.y),maxDist,width,this.participants,owner,this.walls).target;
            }

            refreshAliveCache() {
                this.aliveRealPlayers.length=0;this.activeParticipants.length=0;
                for(const p of this.participants)if(p.alive){this.activeParticipants.push(p);if(p.id!==999)this.aliveRealPlayers.push(p);}
                this.teamAliveCounts.clear();
                for(const p of this.aliveRealPlayers) this.teamAliveCounts.set(p.team, (this.teamAliveCounts.get(p.team)||0)+1);
            }

            retireParticipantFromCombat(eliminated) {
                if(!eliminated)return;
                __brScope.BRRework?.cleanup(eliminated,this,'death');
                eliminated.vel=new __brScope.Vec2(0,0);eliminated.invisible=false;eliminated.attackCommitFrames=0;
                eliminated.comboTargetId=null;
                eliminated.pendingAttack=null;eliminated.pendingSkill=null;eliminated.playerDash=null;eliminated.dashFrames=0;eliminated.basicContactUntilFrame=-1;
                for(const p of this.participants) {
                    if(p===eliminated)continue;
                    if(p.comboTargetId===eliminated.id){p.comboTargetId=null;p.comboHitsRemaining=0;}
                }
                for(const projectile of this.projectiles)if(projectile.homingTarget===eliminated)projectile.homingTarget=null;
            }

            rebuildSpatialGrid() {
                for(const bucket of this.activeSpatialBuckets)bucket.length=0;
                this.activeSpatialBuckets.length=0;
                const cs = this.spatialCellSize;
                for(const p of this.activeParticipants) {
                    if(!p.alive) continue;
                    const key = __brScope.combatGridKey(Math.floor(p.pos.x/cs),Math.floor(p.pos.y/cs));
                    let bucket=this.spatialGrid.get(key);
                    if(!bucket){bucket=[];this.spatialGrid.set(key,bucket);}
                    if(bucket.length===0)this.activeSpatialBuckets.push(bucket);
                    bucket.push(p);
                }
            }

            getNearbyParticipants(pos, radius=350) {
                const cs = this.spatialCellSize;
                if(!this.spatialGrid.size) return this.activeParticipants.slice();
                const minX=Math.floor((pos.x-radius)/cs), maxX=Math.floor((pos.x+radius)/cs);
                const minY=Math.floor((pos.y-radius)/cs), maxY=Math.floor((pos.y+radius)/cs);
                const out=[];
                for(let x=minX;x<=maxX;x++) for(let y=minY;y<=maxY;y++) {
                    const bucket=this.spatialGrid.get(__brScope.combatGridKey(x,y));
                    if(bucket) out.push(...bucket);
                }
                return out;
            }

            pushCombatEvent(text, color='#fff', priority=1, pos=null) {
                this.eventFeed.unshift({text,color,life:170,maxLife:170,id:++this.eventCounter,priority});
                if(this.eventFeed.length>3) this.eventFeed.length=3;
            }

            registerKillEvent(attacker, victim) {
                if(!attacker || !victim) return;
                if(__brScope.session?.isRespawnMode()) {
                    if(__brScope.brTKRecordKill)__brScope.brTKRecordKill(attacker,victim,this);
                    return;
                }
                const now=this.frame;
                const rapid = now - attacker.lastKillFrame <= 360;
                attacker.rapidKillCount = rapid ? attacker.rapidKillCount + 1 : 1;
                attacker.lastKillFrame = now;
                attacker.killTimes.push(now);

                if(!this.firstBloodDone)this.firstBloodDone=true;
                this.pushCombatEvent(`⚔ ${attacker.name} eliminated ${victim.name}`,'#f8fafc',1,null);

            }

            markLaunched(target, attacker, frames=24, snapshot=null) {
                if(!target || !attacker || !__brScope.brCanHostileTarget(target,attacker)) return;
                target.launchedById = attacker.id;target.launchedOwnerLife=Number(attacker.lifeSeq||0);target.launchedPower=__brScope.brWangguiPower(attacker,snapshot);
                target.launchedFrames = Math.max(target.launchedFrames||0, frames);
            }

            handleWallCrash(p, impactSpeed) {
                if(!p.alive || p.wallCrashCooldown>0 || p.launchedFrames<=0 || impactSpeed<8) return;
                const attacker=this.participants.find(x=>x.id===p.launchedById && x.alive) || null;
                if(!__brScope.brCanHostileTarget(p,attacker))return;
                const dmg=Math.min(24, 4 + impactSpeed*0.72);
                p.wallCrashCooldown=24;
                // Collision feedback does not stun.
                this.spawnImpact(p.pos,78,'#f8fafc',1.3);
                this.addText(p.pos,'💥 WALL CRASH!','#f8fafc',24,29);
                if(!attacker||Number(attacker.lifeSeq||0)===Number(p.launchedOwnerLife||0))p.takeDamage(dmg,attacker,false,null,{wangguiPower:p.launchedPower??1});
            }

            resolveParticipantCollisions() {
                const alive=this.activeParticipants;
                this.bodyMovedParticipants.length=0;
                const contactCandidates=[];
                for(let pass=0;pass<4;pass++){
                let remaining=0;
                for(let i=0;i<alive.length;i++) {
                    const p1=alive[i];
                    if(!p1.alive)continue;
                    // Reuse the first padded broad phase within this 60Hz contact step.
                    const near=pass===0?this.getNearbyParticipants(p1.pos,p1.radius+this.maxBodyRadius+110):(contactCandidates[i]||[]);
                    for(const p2 of near) {
                        if(!p2.alive || p2===p1 || p2.id < p1.id) continue;
                        const delta=p1.pos.sub(p2.pos); let d=delta.mag();
                        const minD=p1.radius+p2.radius;
                        if(pass===0&&d<minD+this.maxBodyRadius+110)(contactCandidates[i]||(contactCandidates[i]=[])).push(p2);
                        if(d>=minD) continue;
                        const n=d<0.001?new __brScope.Vec2(p1.id<p2.id?1:-1,0):delta.mult(1/d);
                        if(d<0.001)d=0;
                        const overlap=minD-d;remaining=Math.max(remaining,overlap);
                        const m1=Math.max(1,p1.radius*p1.radius), m2=Math.max(1,p2.radius*p2.radius);
                        p1.pos=p1.pos.add(n.mult(overlap*(m2/(m1+m2))));
                        p2.pos=p2.pos.sub(n.mult(overlap*(m1/(m1+m2))));
                        // 평상시에는 약한 분리 속도만 주어 서로 계속 비비며 벽에 눌리는 현상을 줄인다.
                        if(pass===0&&(!__brScope.session?.isRespawnMode()||(__brScope.brCanHostileTarget(p1,p2)&&__brScope.brCanHostileTarget(p2,p1)))){
                            p1.vel=p1.vel.add(n.mult(0.18));p2.vel=p2.vel.sub(n.mult(0.18));
                        }
                        if(p1._bodyMovedFrame!==this.frame){p1._bodyMovedFrame=this.frame;this.bodyMovedParticipants.push(p1);}
                        if(p2._bodyMovedFrame!==this.frame){p2._bodyMovedFrame=this.frame;this.bodyMovedParticipants.push(p2);}

                        if(pass>0)continue; // No repeated body damage or collision impulses.
                        const enemy = p1.team===0 || p1.team!==p2.team;
                        if(!enemy||!__brScope.brCanHostileTarget(p1,p2)||!__brScope.brCanHostileTarget(p2,p1)) continue;
                        // Player dash damage already uses the swept movement segment, once per victim.
                        // Keep separation above, but never add another BODY CHECK for that same contact.
                        if(__brScope.BRRework?.defs[p1.ability.id]||__brScope.BRRework?.defs[p2.ability.id])continue;
                        if(p1.playerDash||p2.playerDash||p1.playerDashContactFrame===this.frame||p2.playerDashContactFrame===this.frame)continue;
                        const s1=p1.vel.mag(), s2=p2.vel.mag();
                        // A basic strike has already resolved its one damage hit. Its small
                        // forward step never grants an additional collision-damage window.
                        const p1Attacking = (p1.attackCommitFrames>0 || p1.dashFrames>0 || p1.comboHitsRemaining>0) &&
                            !(p1.humanControlled && this.frame<=Number(p1.basicContactUntilFrame??-1) && p1.dashFrames<=0);
                        const p2Attacking = (p2.attackCommitFrames>0 || p2.dashFrames>0 || p2.comboHitsRemaining>0) &&
                            !(p2.humanControlled && this.frame<=Number(p2.basicContactUntilFrame??-1) && p2.dashFrames<=0);
                        const p1SpecialCharge = p1.dashFrames>0 && (__brScope.IMPACT_CHARGE_SUBS.has(p1.ability.sub)||p1.dashType==='PLAYER_TANK_CHARGE');
                        const p2SpecialCharge = p2.dashFrames>0 && (__brScope.IMPACT_CHARGE_SUBS.has(p2.ability.sub)||p2.dashType==='PLAYER_TANK_CHARGE');
                        const p1Close = __brScope.isTankAbility(p1.ability) || p1.ability.type===__brScope.ABILITY_TYPES.MELEE || p1.ability.type===__brScope.ABILITY_TYPES.ORBIT || p1.ability.type===__brScope.ABILITY_TYPES.DASH || p1.dashType==='PLAYER_TANK_CHARGE' || p1.dashType==='PLAYER_MELEE_LUNGE';
                        const p2Close = __brScope.isTankAbility(p2.ability) || p2.ability.type===__brScope.ABILITY_TYPES.MELEE || p2.ability.type===__brScope.ABILITY_TYPES.ORBIT || p2.ability.type===__brScope.ABILITY_TYPES.DASH || p2.dashType==='PLAYER_TANK_CHARGE' || p2.dashType==='PLAYER_MELEE_LUNGE';
                        // 몸통 돌진은 이동 방향이 적을 향할 때만 피해를 준다. 옆면을
                        // 스친 원형 겹침이나 뒤로 밀려난 충돌은 분리 물리만 적용한다.
                        const p1BodyEligible = p1Attacking && p1Close && s1>7.2 &&
                            -(p1.vel.x*n.x+p1.vel.y*n.y)/s1>.55 &&
                            (p1.stunned<=0 && p1.launchedFrames<=0);
                        const p2BodyEligible = p2Attacking && p2Close && s2>7.2 &&
                            (p2.vel.x*n.x+p2.vel.y*n.y)/s2>.55 &&
                            (p2.stunned<=0 && p2.launchedFrames<=0);
                        const striker = p1BodyEligible && !p2BodyEligible ? p1
                            : p2BodyEligible && !p1BodyEligible ? p2
                            : p1SpecialCharge && !p2SpecialCharge ? p1
                            : p2SpecialCharge && !p1SpecialCharge ? p2
                            : (s1>=s2?p1:p2);
                        const target=striker===p1?p2:p1;
                        const strikerSpeed=striker.vel.mag();
                        const bodyEligible=striker===p1?p1BodyEligible:p2BodyEligible;

                        // 일반 고속 교차는 CLASH. 특수 돌진 4종은 아래 BODY CHECK 전용 판정을 우선한다.
                        if(s1>10 && s2>10 && (p1Attacking || p2Attacking) && !(p1SpecialCharge || p2SpecialCharge)
                            && p1.bodyHitCooldown<=0 && p2.bodyHitCooldown<=0) {
                            p1.bodyHitCooldown=p2.bodyHitCooldown=24;
                            p1.vel=p1.vel.add(n.mult(11*(p1.knockbackResist||1))); p2.vel=p2.vel.sub(n.mult(11*(p2.knockbackResist||1)));
                            // Collision feedback does not stun.
                            this.spawnImpact(p1.pos.add(p2.pos).mult(0.5),95,'#ffffff',1.35);
                        }
                        // 근접/돌진형의 몸통박치기. 속도가 높을수록 밀어내고 던진다.
                        else if(bodyEligible && striker.bodyHitCooldown<=0 && target.bodyHitCooldown<=0) {
                            striker.bodyHitCooldown=18; target.bodyHitCooldown=20;
                            const dir=target.pos.sub(striker.pos).norm();
                            const tierBonus={S:1.35,A:1.18,B:1.0,C:0.82,F:0.45}[striker.ability.t]||1;
                            const specialCharge = striker.dashFrames>0 && (__brScope.IMPACT_CHARGE_SUBS.has(striker.ability.sub)||striker.dashType==='PLAYER_TANK_CHARGE');

                            let dmg=Math.min(18, Math.max(3,(strikerSpeed-5)*0.72*tierBonus));
                            let force=Math.min(26,7+strikerSpeed*0.75*tierBonus);
                            if(__brScope.isTankAbility(striker.ability))force=Math.min(29,force+3);
                            let stun=0;
                            let impactColor='#fbbf24';
                            let impactLabel='💥 BODY CHECK!';

                            target.vel=target.vel.add(dir.mult(force * (target.knockbackResist || 1)));
                            if(stun>0) target.stunned=Math.max(target.stunned,stun);
                            if(force>=15) this.markLaunched(target,striker,22+Math.floor(force*0.42));
                            target.takeDamage(dmg,striker);
                            this.spawnImpact(target.pos,55+force*1.35,impactColor,specialCharge?1.35:1.0);
                            this.emitStudentFx('impact',target.pos,{
                                dx:dir.x,dy:dir.y,size:Math.min(190,64+force*2.2),color:impactColor,
                                amount:dmg,style:specialCharge?'dash-crash':'body-check'
                            });
                            if(specialCharge || force>20) this.addText(target.pos,impactLabel,'#fff7cc',specialCharge?25:18,specialCharge?27:23);
                        }
                        // 날아가던 캐릭터가 다른 적과 충돌하면 연쇄 충돌 피해.
                        const thrown = p1.launchedFrames>0 ? p1 : (p2.launchedFrames>0 ? p2 : null);
                        const hit = thrown===p1?p2:(thrown===p2?p1:null);
                        // Ignore only the basic strike's immediate recoil into its source;
                        // launching that victim into another opponent still works immediately.
                        const basicRecoil = thrown && hit && hit.id===thrown.launchedById && hit.humanControlled &&
                            this.frame<=Number(hit.basicContactUntilFrame??-1);
                        if(thrown && hit && !basicRecoil && thrown.vel.mag()>9 && thrown.bodyHitCooldown<=0 && hit.bodyHitCooldown<=0) {
                            const launcher=this.participants.find(x=>x.id===thrown.launchedById) || null;
                            if(!__brScope.brCanHostileTarget(hit,launcher))continue;
                            const chainDmg=Math.min(15,4+thrown.vel.mag()*0.55);
                            thrown.bodyHitCooldown=hit.bodyHitCooldown=22;
                            if(!launcher||Number(launcher.lifeSeq||0)===Number(thrown.launchedOwnerLife||0))hit.takeDamage(chainDmg,launcher,false,null,{wangguiPower:thrown.launchedPower??1});
                            hit.vel=hit.vel.add(thrown.vel.norm().mult(13 * (hit.knockbackResist || 1)));
                            // Collision feedback does not stun.
                            this.spawnImpact(hit.pos,70,'#fb7185',1.15);
                        }
                    }
                }
                // Separation can push a circle a few pixels into cover. Correct only the
                // participants that were actually separated, instead of rescanning every wall
                // for every student on every frame.
                for(const p of this.bodyMovedParticipants)if(p.humanControlled&&p.alive&&p.ability.sub!=='GHOST_MOVE'&&!(p.ability.sub==='FLY_DASH'&&p.dashFrames>0)) {
                    const corrected=__brScope.combatMoveCircle(p.pos,{x:0,y:0},p.radius,__brScope.brHostBodyWalls(this),false,p._combatMoveResult);
                    p.pos.x=corrected.x;p.pos.y=corrected.y;
                    const edge=(this.worldRadius||__brScope.BR_WORLD_RADIUS)-p.radius-4,dx=p.pos.x-this.center.x,dy=p.pos.y-this.center.y,d=Math.hypot(dx,dy);
                    if(this.capture){const q=__brScope.brArenaClamp(this,p.pos,p.radius+4);p.pos.x=q.x;p.pos.y=q.y;}else if(d>edge){p.pos.x=this.center.x+dx*edge/d;p.pos.y=this.center.y+dy*edge/d;}
                }
                if(remaining<.35)break;
                }
            }

            playSignature(p) {
                if(this.isOnlineHost()&&this.getHostBroadcastMode()!=='broadcast') return;
                if(!p?.alive || (this.aliveRealPlayers?.length || 99)>15) return;
                if(this.signatureEffects.length>18) this.signatureEffects.splice(0,this.signatureEffects.length-18);
                this.signatureEffects.push(new __brScope.SignatureEffect(p));
            }

            spawnSupplyDrop() {
                if(this.supplyDropSpawned) return;
                this.supplyDropSpawned=true;
                const maxR=Math.max(260,Math.min(720,this.mapRadius-130));
                const pos=this.findSafeMapPoint(100,maxR,90);
                this.supplyDrop=new __brScope.SupplyDrop(pos);
                __brScope.brFarm.changed(this);
                this.announce('SUPPLY DROP',90);
            }

            triggerDomainExpansion(alive) {
                if(__brScope.session?.isRespawnMode())return;
                if(this.finalPhaseTriggered||!alive||alive.length<2||alive.length>3) return;
                this.finalPhaseTriggered=true; this.finalPhase=true; this.finalPhaseStartedAt=this.frame;
                this.announce('🔥 FINAL 3 BURNING!',125);
                // 한 번만 보정한다. 한 프레임에 4→2명이 되더라도 최종전이 빠지지 않는다.
                alive.forEach((p,idx)=>{
                    p.hp=Math.min(p.maxHp,p.hp+p.maxHp*0.12);
                    p.speed*=1.10; // Final damage is applied once by the basic/cast snapshot contracts.
                    // v21.1: FINAL 3는 기술 회전이 확실히 빨라지도록 재사용 대기시간을 크게 단축.
                    p.cooldownRateMult=(p.cooldownRateMult||1)*0.70;
                    p.cooldown=Math.floor(p.cooldown*0.58); p.stunned=Math.min(p.stunned,8);
                    p.finalPhaseBoosted=true; p.vel=p.vel.mult(1.08);
                });
            }

            getPerformanceTier() {
                const n=this.aliveRealPlayers?.length||0;
                if(n>=30) return 3; // 30~40명: 초반 핵심 최적화
                if(n>=22) return 2;
                if(n>15) return 1;
                return 0;
            }

            isOnlineHost(){return true;}

            getHostBroadcastMode() {
                if(this.capture)return 'capture';
                const n=this.aliveRealPlayers?.length||0;
                if(n<=5)return 'broadcast';
                if(n<=12)return 'normal';
                return 'performance';
            }

            isVisualPerformanceMode() {
                if(this.isOnlineHost())return this.getHostBroadcastMode()==='performance';
                return this.getPerformanceTier()>0;
            }

            updateBroadcastStage(aliveCount) {
                if(__brScope.session?.isRespawnMode())return;
                let stage='';
                if(aliveCount===2)stage='FINAL 2';
                else if(aliveCount===3)stage='TOP 3';
                else if(aliveCount>3&&aliveCount<=5)stage='TOP 5';
                if(stage&&stage!==this.lastBroadcastStage){this.lastBroadcastStage=stage;this.announce(stage,105);}
            }

            isPerformanceMode() {
                // A host stays a lightweight simulation server even after only a few survive.
                return this.isOnlineHost() || this.getPerformanceTier()>0;
            }

            getCollisionCadence() { return 1; }

            getHomingRefreshCadence() {
                const n=this.aliveRealPlayers?.length||0;
                return n>=30?5:n>=22?4:n>15?3:2;
            }

            getProjectileTrailCadence() {
                const n=this.aliveRealPlayers?.length||0;
                return n>=30?10:n>=22?8:n>15?6:n>10?4:3;
            }

            getParticleBudget() {
                if(this.isOnlineHost()) {
                    const mode=this.getHostBroadcastMode();
                    return mode==='performance'?0:mode==='normal'?70:170;
                }
                const n=this.aliveRealPlayers?.length||0;
                return n>=30?12:n>=22?18:n>15?24:n>10?90:180;
            }

            hasParticleRoom(extra=1) {
                return this.particles.length + extra <= this.getParticleBudget();
            }

            getFxScale() {
                if(this.isOnlineHost()) {
                    const mode=this.getHostBroadcastMode();
                    return mode==='performance'?0:mode==='normal'?.45:1;
                }
                const n=this.aliveRealPlayers?.length || 0;
                // v22.2: '많이 만든 뒤 삭제'보다 처음부터 덜 생성한다.
                if(n>=30) return 0.12;
                if(n>=22) return 0.18;
                if(n>15) return 0.28;
                if(n>10) return 0.72;
                return 1.0;
            }

            announce(text, life=120) {
                this.announcement = text;
                this.announcementLife = life;
            }

            forceConvergence() {
                return __brScope.brRingScheduleCompression(this);
            }

            updateTransientEffects() {
                for(let i=this.texts.length-1; i>=0; i--) {
                    const t = this.texts[i];
                    t.pos.y -= t.rise || 1.15;
                    t.life--;
                    if(t.life <= 0) this.texts.splice(i,1);
                }
                for(let i=this.rings.length-1; i>=0; i--) {
                    this.rings[i].update();
                    if(this.rings[i].life <= 0) this.rings.splice(i,1);
                }
                for(let i=this.signatureEffects.length-1;i>=0;i--){
                    this.signatureEffects[i].update();
                    if(this.signatureEffects[i].life<=0||!this.signatureEffects[i].owner?.alive) this.signatureEffects.splice(i,1);
                }
                if(this.screenFlashAlpha > 0) this.screenFlashAlpha *= 0.82;
                if(this.screenFlashAlpha < 0.01) this.screenFlashAlpha = 0;
                if(this.vignettePulse > 0) this.vignettePulse *= 0.88;
                if(this.vignettePulse < 0.01) this.vignettePulse = 0;
                this.cameraKick = this.cameraKick.mult(0.72);
                if(this.announcementLife > 0) this.announcementLife--;
                if(this.eventFocusFrames>0) this.eventFocusFrames--; else this.eventFocusPos=null;
                for(let i=this.eventFeed.length-1;i>=0;i--) { this.eventFeed[i].life--; if(this.eventFeed[i].life<=0) this.eventFeed.splice(i,1); }
                if(this.retiredShots.length){
                    let expired=0;while(expired<this.retiredShots.length&&this.retiredShots[expired].frame<this.frame-54)expired++;
                    if(expired)this.retiredShots.splice(0,expired);
                    if(this.retiredShots.length>1024){this.visualHistoryDrops=(this.visualHistoryDrops||0)+this.retiredShots.length-1024;this.retiredShots.splice(0,this.retiredShots.length-1024);}
                }
                if(this.studentFx.length) {
                    const cutoff=this.frame-54;
                    let expired=0;while(expired<this.studentFx.length&&this.studentFx[expired].frame<cutoff)expired++;
                    if(expired)this.studentFx.splice(0,expired);
                    __brScope.brTrimCombatFx(this.studentFx);
                }
            }

            emitStudentFx(type,pos,data={}) {
                if(!pos || !__brScope.session?.active) return;
                const fx={
                    id:++this.studentFxSeq,type:String(type||'hit'),frame:this.frame,
                    x:Number(pos.x||0),y:Number(pos.y||0),
                    dx:Number(data.dx||0),dy:Number(data.dy||0),size:Number(data.size||0),
                    color:data.color||'#ffffff',amount:Number(data.amount||0),
                    targetId:data.targetId==null?'':String(data.targetId),style:data.style||'',
                    sourceId:data.sourceId==null?'':String(data.sourceId),impactLevel:Number(data.impactLevel||0),geometry:data.geometry||null
                };
                if(fx.type==='dash'&&fx.geometry?.token) {
                    const old=this.studentFx.findIndex(e=>e.type==='dash'&&e.geometry?.token===fx.geometry.token);
                    if(old>=0)this.studentFx.splice(old,1);
                }
                this.studentFx.push(fx);
                __brScope.brTrimCombatFx(this.studentFx);
            }

            punchScreen(damage, targetPos, attacker) {
                // 온라인 직접 플레이에서는 호스트 시뮬레이션을 멈추는 히트스톱을 사용하지 않는다.
                // 타격감은 각 학생 기기의 진동·사운드·플래시로 처리해 전체 물리 프레임을 보존한다.
                if(this.isPerformanceMode()||(__brScope.session?.active&&__brScope.session.role==='host'&&__brScope.session.backend==='authority')) return;
                // ✨ v14: 어지럼 방지. 화면 '이동'은 S급 공격이 실제 적중했을 때만.
                const isSImpact = !!(attacker && attacker !== null && attacker.ability && attacker.ability.t === 'S');
                this.vignettePulse = Math.max(this.vignettePulse, Math.min(0.42, damage/100));
                if(isSImpact) {
                    const strength = Math.min(18, 3 + damage * 0.22);
                    this.shakeAmount = Math.max(this.shakeAmount, strength);
                    if(attacker.pos) {
                        const dir = targetPos.sub(attacker.pos).norm();
                        this.cameraKick = this.cameraKick.add(dir.mult(Math.min(5.5, damage*0.08)));
                        if(this.cameraKick.mag() > 7) this.cameraKick = this.cameraKick.norm().mult(7);
                    }
                }
                if(damage >= 24) {
                    this.screenFlashAlpha = Math.max(this.screenFlashAlpha, Math.min(isSImpact ? 0.14 : 0.08, damage/420));
                    this.screenFlashColor = isSImpact ? '255,225,145' : '255,255,255';
                }
                if(damage >= 45) this.hitStopFrames = Math.max(this.hitStopFrames, isSImpact ? 2 : 1);
            }

            spawnImpact(pos, radius, color='#fff', strength=1) {
                if(this.isVisualPerformanceMode()) return;
                this.rings.push(new __brScope.ImpactRing(pos, Math.max(5, radius*0.2), radius, color, Math.round(12+strength*5), Math.round(4+strength*3)));
                if(strength > 1.15) this.rings.push(new __brScope.ImpactRing(pos, Math.max(3, radius*0.05), radius*0.68, '#ffffff', 10, 3));
            }

            update() {
                if(this.paused||this.ringSuspended) {if(this.ring)__brScope.brRingPause(this,true);return;}

                this.updateTransientEffects();

                // ✨ 큰 타격 순간 1~2프레임 정지하여 무게감 부여
                if(this.hitStopFrames > 0) {
                    if(__brScope.session?.active) this.hitStopFrames=0;
                    else { this.hitStopFrames--; return; }
                }

                // ✨ 우승 연출: 게임이 끝났을 땐 전투와 이동을 멈추고 꽃가루/이펙트만 재생
                if (this.isGameOver) {
                    __brScope.BRRework?.clearWorld(this,'match-end');
                    if (this.shakeAmount > 0) this.shakeAmount *= 0.85;
                    this.confetti.forEach(c => c.update());
                    for(let i = this.particles.length - 1; i >= 0; i--) {
                        this.particles[i].update();
                        if(this.particles[i].life <= 0) this.particles.splice(i, 1);
                    }
                    for(let i = this.swings.length - 1; i >= 0; i--) {
                        this.swings[i].update();
                        if(this.swings[i].life <= 0) this.swings.splice(i, 1);
                    }
                    return;
                }

                const simulationSteps=__brScope.session?.active ? 1 : this.speed;
                for(let s=0; s<simulationSteps; s++) {
                    this.frame++;
                    this.refreshAliveCache();
                    this.rebuildSpatialGrid();
                    __brScope.BRRework?.tick(this);
                    this.refreshAliveCache();this.rebuildSpatialGrid();
                    this.maxParticipantStep=0;this.pendingDashContacts.length=0;this.deferDashContacts=true;
                    for(const p of this.activeParticipants){p.combatPreviousX=p.pos.x;p.combatPreviousY=p.pos.y;p.combatPreviousWarp=Number(p.warpSeq||0);}
                    // Sample one common time for this tick, independent of host rendering rate.
                    __brScope.brRingHostUpdate(this);
                    
                    if (this.shakeAmount > 0) this.shakeAmount *= 0.85; // 프레임마다 진동 서서히 감소
                    if (this.shakeAmount < 0.5) this.shakeAmount = 0;

                    if(!this.supplyDropSpawned&&this.frame>=this.supplyDropSpawnFrame&&this.aliveRealPlayers.length>1) this.spawnSupplyDrop();

                    // 장식 애니메이션은 성능 모드에서 20fps만 갱신한다. 충돌/전투 판정과는 무관하다.
                    if(!this.isPerformanceMode()||this.frame%3===0) {
                        this.walls.forEach(w => w.update());
                        this.smokes.forEach(s => s.update());
                    }
                    
                    // v21.16: 한 플레이어의 입력/능력 런타임 오류가 경기 전체 requestAnimationFrame을 죽이지 않게 격리.
                    for(const p of this.activeParticipants) {
                        try {
                            p.update(this);
                        } catch(err) {
                            p.runtimeFaults=(p.runtimeFaults||0)+1;
                            if(this.frame-(p.lastRuntimeFaultFrame||-9999)>120) {
                                console.error(`[PLAYER UPDATE RECOVERY] ${p.name} / ${p.ability?.n||'unknown'}`,err);
                                p.lastRuntimeFaultFrame=this.frame;
                            }
                            p.dashFrames=0;p.playerDash=null;p.comboHitsRemaining=0;
                            p.pendingAttack=null;p.pendingSkill=null;p.vel=new __brScope.Vec2(0,0);
                        }
                    }
                    this.deferDashContacts=false;
                    for(const p of this.activeParticipants) {
                        if(!Number.isFinite(p.combatPreviousX)||Number(p.warpSeq||0)!==p.combatPreviousWarp){p.combatPreviousX=p.pos.x;p.combatPreviousY=p.pos.y;}
                        this.maxParticipantStep=Math.max(this.maxParticipantStep,Math.hypot(p.pos.x-p.combatPreviousX,p.pos.y-p.combatPreviousY));
                    }
                    this.rebuildSpatialGrid(); // Query the current cells after all players moved.
                    this.resolvingDashContacts=true;let dashRelocated=false;
                    try {
                        for(const step of this.pendingDashContacts){
                            const x=step.p.pos.x,y=step.p.pos.y;
                            step.p.resolvePlayerDashStep(this,step.dash,step.from,step.to);
                            if(step.p.pos.x!==x||step.p.pos.y!==y){
                                dashRelocated=true;this.maxParticipantStep=Math.max(this.maxParticipantStep,Math.hypot(step.p.pos.x-step.p.combatPreviousX,step.p.pos.y-step.p.combatPreviousY));
                            }
                        }
                    } finally {this.resolvingDashContacts=false;this.pendingDashContacts.length=0;}
                    if(dashRelocated)this.rebuildSpatialGrid(); // Only flight settlement changes positions here.
                    __brScope.brFarm.update(this);
                    if(this.supplyDrop) {
                        this.supplyDrop.update(this);
                        if(this.supplyDrop.claimed||this.supplyDrop.life<=0) {
                            this.supplyDrop=null;
                            __brScope.brFarm.changed(this);
                        }
                    }
                    for(let i = this.projectiles.length - 1; i >= 0; i--) {
                        const shot=this.projectiles[i];__brScope.brBeginProjectileVisual(this,shot);
                        shot.update(this);if(this.capture&&shot.type!=='ORBIT'&&!__brScope.brArenaContains(this,shot.pos)){shot.pos=__brScope.brArenaClamp(this,shot.pos);if(shot.type==='BOOMERANG'&&shot.life>60)shot.life=60;else shot.life=0;}__brScope.brEndProjectileVisual(this,shot);
                        if(shot.life <= 0) this.projectiles.splice(i, 1);
                    }
                    for(let i = this.zones.length - 1; i >= 0; i--) {
                        this.zones[i].update(this);
                        if(this.zones[i].duration <= 0) this.zones.splice(i, 1);
                    }
                    for(let i = this.turrets.length - 1; i >= 0; i--) {
                        this.turrets[i].update(this);
                        if(this.turrets[i].life <= 0) this.turrets.splice(i, 1);
                    }
                    for(let i = this.particles.length - 1; i >= 0; i--) {
                        this.particles[i].update();
                        if(this.particles[i].life <= 0) this.particles.splice(i, 1);
                    }
                    for(let i = this.swings.length - 1; i >= 0; i--) {
                        this.swings[i].update();
                        if(this.swings[i].life <= 0) this.swings.splice(i, 1);
                    }
                    
                    // Gameplay entities expire only by their own lifetime/hit rules. Performance
                    // budgets below apply solely to presentation, so no projectile or zone vanishes
                    // early during a crowded classroom fight.
                    const particleCap = this.getParticleBudget();
                    if(this.particles.length > particleCap) this.particles.splice(0, this.particles.length - particleCap);
                    const swingCap = this.aliveRealPlayers.length>=30 ? 26 : this.aliveRealPlayers.length>=22 ? 32 : this.isPerformanceMode() ? 38 : 80;
                    // Essential swings retain their short lifetime even at24/30players.
                    if(this.texts.length > 40) this.texts.splice(0, this.texts.length - 40);
                    if(this.rings.length > 45) this.rings.splice(0, this.rings.length - 45);
                    if(this.signatureEffects.length>20) this.signatureEffects.splice(0,this.signatureEffects.length-20);

                    // 플레이어 몸 충돌은 매 물리 프레임(60Hz) 처리한다.
                    const collisionCadence=this.getCollisionCadence();
                    if(collisionCadence===1 || this.frame % collisionCadence === 0) {
                        this.resolveParticipantCollisions();
                    }

                    // Final coordinates (including knockback/body separation) are the damage coordinates.
                    for(const participant of this.participants)__brScope.brRingApplyDamage(this,participant);
                    if(this.capture)__brScope.BRCapture.tick(this);
                    this.refreshAliveCache();
                    let alive = this.aliveRealPlayers;
                    if(__brScope.brProgression)__brScope.brProgression.update(this);
                    this.updateBroadcastStage(alive.length);
                    if(!__brScope.session?.active||this.frame%30===0) {
                        __brScope.updateHUD(alive.length, this.realParticipantCount || (this.realParticipantCount=this.participants.filter(p=>p.id!==999).length), this.frame);
                    }
                    
                    // ✨ 팡파레 연출: 그룹 수 계산
                    let aliveTeams = new Set(alive.map(p => p.team));
                    let currentAliveGroups = __brScope.teamMode > 0 ? aliveTeams.size : alive.length;

                    // v21: 실제 캐릭터 3명이 남는 순간 최후반전 '영역 전개' 발동.
                    if(!this.capture&&alive.length>=2&&alive.length<=3&&currentAliveGroups>1&&!this.finalPhaseTriggered) this.triggerDomainExpansion(alive);
                    this.lastAliveGroups=currentAliveGroups;
                    
                    // ✨ 우승자 확정 연출 (모달 띄우기 전 3초간의 세레모니)
                    if (currentAliveGroups <= 1 && this.participants.length > 0 && !this.isGameOver && !__brScope.session?.isRespawnMode()) { 
                        this.isGameOver = true;
                        __brScope.brRingPause(this,true);
                        const onlineClass=__brScope.session?.active&&__brScope.session.role==='host'&&__brScope.session.backend==='authority';
                        // 수업 모드에서는 마지막 장시간 연출을 생략하고 곧바로 결과로 넘어간다.
                        if(!onlineClass) for(let i=0; i<120; i++) this.confetti.push(new __brScope.ConfettiParticle(0/2, 0 + 50));
                        
                        let winner = alive[0] || this.participants.filter(p=>p.id!==999).sort(__brScope.compareSurvivalOrder)[0] || this.participants[0];
                        this.winner = winner;
                        this.matchEndedAt = this.frame;
                        if(winner) {
                            this.addText(winner.pos, "👑 WINNER!", "#ffd700");
                            this.announce(`WINNER · ${winner.ability?.e||''} ${winner.name} · KILL ${winner.kills||0}`,100);
                            // 우승자 주변으로 폭죽 느낌 파티클 발사
                            for(let i=0; i<(onlineClass?0:16); i++) {
                                let v = new __brScope.Vec2((__brScope.rand()-0.5)*40, (__brScope.rand()-0.5)*40);
                                this.particles.push(new __brScope.Particle(winner.pos, v, '#ffff00', 30+__brScope.rand()*20, 5+__brScope.rand()*5));
                            }
                        }
                        
                        __brScope.finish(winner);
                        return; 
                    }
                }
            }

            

            // 생존자가 많은 초반 호스트 화면. 판정에 필요한 오브젝트는 모두 유지하고
            // 장식 효과와 복잡한 캐릭터 드로잉만 줄인다.
            

            

            findNearest(pos, owner) {
                // Target selection for player-created turrets/homing projectiles only.
                // This helper never moves a character or activates a skill.
                let best=null,bestDistance=Infinity;
                for(const target of this.aliveRealPlayers) {
                    if(!target.alive||target===owner||(owner&&owner.team!==0&&target.team===owner.team))continue;
                    const distance=target.pos.dist(pos);
                    if(distance>=bestDistance||(target.invisible&&distance>170))continue;
                    if(owner&&this.isConcealedFrom(target,owner))continue;
                    if(this.checkWallBetween(pos,target.pos))continue;
                    best=target;bestDistance=distance;
                }
                return best;
            }

            applyAoE(pos, radius, dmg, owner, pushForce=5, damageContext=null) {
                if(dmg>0)__brScope.brFarm.area(this,owner,pos,radius,.65,'aoe:'+this.frame);
                __brScope.BRRework?.nativeAreaTurrets(this,owner,pos,radius,dmg,damageContext);
                // v22.2: 폭발/광역기도 Spatial Grid 주변 대상만 검사.
                for(const p of this.getNearbyParticipants(pos,radius+90)) {
                    if(p !== owner && p.alive && p.pos.dist(pos) < radius && (owner.team === 0 || p.team !== owner.team)) {
                        const dealt=p.takeDamage(dmg,owner,false,null,damageContext);if(!p._lastDamageResult?.valid||!p.alive)continue;
                        let push = p.pos.sub(pos).norm().mult(pushForce * (p.knockbackResist || 1));
                        p.vel = p.vel.add(push);
                    }
                }
            }
            spawnParticles(pos, count, color) {
                const scale = this.getFxScale();
                if(scale <= 0) return;
                const room=Math.max(0,this.getParticleBudget()-this.particles.length);
                if(room<=0) return;
                count = Math.min(room, Math.max(1, Math.ceil(count * scale)));
                for(let i=0; i<count; i++) {
                    let v = new __brScope.Vec2((__brScope.rand()-0.5)*10, (__brScope.rand()-0.5)*10);
                    this.particles.push(new __brScope.Particle(pos, v, color, 10+__brScope.rand()*10, 3+__brScope.rand()*3));
                }
            }
            spawnExplosion(pos, radius, color,meta={}) {
                this.emitStudentFx('explosion',pos,Object.assign({size:radius,color:color||'#ffffff'},meta));
                const scale = this.getFxScale();
                if(scale <= 0) return;
                const room=Math.max(0,this.getParticleBudget()-this.particles.length);
                const wanted=Math.max(2,Math.ceil(Math.min(22,8+Math.floor(radius/18))*scale));
                const count=Math.min(room,wanted);
                for(let i=0; i<count; i++) { 
                    let angle = __brScope.rand()*Math.PI*2; let spd = 3 + __brScope.rand()*Math.min(16, radius/8);
                    let v = new __brScope.Vec2(Math.cos(angle)*spd, Math.sin(angle)*spd);
                    this.particles.push(new __brScope.Particle(pos, v, color, 14+__brScope.rand()*12, Math.max(3, radius/(7+__brScope.rand()*5))));
                }
                this.spawnImpact(pos, Math.max(35, radius*0.9), color, Math.min(1.8, 0.8+radius/180));
                if(radius >= 80 && !this.isVisualPerformanceMode()) {
                    this.screenFlashAlpha = Math.max(this.screenFlashAlpha, Math.min(0.16, radius/900));
                    this.screenFlashColor = '255,245,220';
                }
            }
            
            drawLaser(from,to,color,width=6,meta={}){const delta=to.sub(from),length=delta.mag(),dir=length>0?delta.norm():new __brScope.Vec2(1,0);this.emitStudentFx('laser',from,{dx:dir.x,dy:dir.y,size:length,color:color||'#fff',amount:width,sourceId:meta.owner?.remoteId||'',geometry:__brScope.brFxCommand(meta.owner,'beam',{width,part:meta.part||'tether'})});}
            addSwingEffect(owner, pos, dir, size, style='slash',halfAngle=Math.PI*.48,geometry=null) {
                // 베기 궤적은 저비용 객체라 호스트에도 제한된 개수만 유지해 근접 교전을 읽을 수 있게 한다.
                const swing=new __brScope.SwingEffect(owner,pos,dir,size,style,halfAngle);
                swing.life=swing.maxLife=geometry?.basic?Math.max(6,Math.round(Number(geometry.displayMs||150)*60/1000)):/punch|hammer/.test(style)?16:12;swing.geometry=geometry||__brScope.brFxCommand(owner,'sector',{halfAngle});swing.geometry.displayMs=swing.maxLife*1000/60;this.swings.push(swing);
                const color=({S:'#fb4b63',A:'#fbbf24',B:'#60a5fa',C:'#4ade80',F:'#cbd5e1'})[owner?.ability?.t]||'#fff';
                this.emitStudentFx('swing',pos,{dx:dir.x,dy:dir.y,size,color,style,amount:halfAngle,sourceId:owner?.remoteId||('player-'+owner?.id),targetId:owner?.remoteId||('player-'+owner?.id),geometry:swing.geometry});
                const cap = this.isVisualPerformanceMode() ? 36 : 80;
                // Active cast geometry is essential; natural expiry limits this short list.
            }
            addText(pos, t, c, life=36, size=26) { if(!this.isVisualPerformanceMode()) this.texts.push({pos:new __brScope.Vec2(pos.x,pos.y), text:t, color:c, life, maxLife:life, size, rise:1.15}); }
        };
}
export const initializers=[

];
