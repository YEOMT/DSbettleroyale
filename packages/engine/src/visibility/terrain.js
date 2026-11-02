// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brSurvivalRandom = function brSurvivalRandom(key){let n=2166136261;for(const c of String(key)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};

__brScope.brSurvivalMaxRadius = function brSurvivalMaxRadius(){if(__brScope.brSurvivalRosterRadius==null)__brScope.brSurvivalRosterRadius=Math.max(...__brScope.EMOJI_DB.map((a,i)=>new __brScope.Participant(-1000-i,'',a,new __brScope.Vec2(0,0)).radius));return __brScope.brSurvivalRosterRadius;};

__brScope.brSurvivalGroups = function brSurvivalGroups(g){const w=g.combatCover||[],out=[];for(let i=0;i+2<w.length;i+=3){const x=(w[i+1].x+w[i+2].x)/2,y=(w[i+1].y+w[i+2].y)/2;out.push({x,y,dx:(x-w[i].x)/128,dy:(y-w[i].y)/128});}return out;};

__brScope.brSurvivalTerrain = function brSurvivalTerrain(g){
            const mode=__brScope.session?.roomMeta?.mode||'solo';if(!['solo','team-elim'].includes(mode)||g.survival?.version===31)return;
            const radius=__brScope.brSurvivalMaxRadius(),diameter=radius*2,gap=diameter+40,random=__brScope.brSurvivalRandom(String(__brScope.session?.roomMeta?.seed||'map')+'|survival31|'+g.mapIndex),limit=g.worldRadius;
            const stats=g.survival={version:31,priorGroups:(g.combatCover?.length||0)/3,requestedGroups:0,addedGroups:0,attempts:0,failedGroups:0,smokeRequested:2,smokeAdded:0,maxRadius:radius,passage:328,depth:254};
            const make=(cx,cy,a,key)=>[[0,-128,384,28],[-178,0,28,280],[178,0,28,280]].map(([x,y,w,h])=>{const xx=Math.round(cx+x*Math.cos(a)-y*Math.sin(a)),yy=Math.round(cy+x*Math.sin(a)+y*Math.cos(a));return Object.assign(Object.create(__brScope.Wall.prototype),{x:xx,y:yy,w,h,angle:a,kind:'wall',spinSpeed:0,coverGroup:key,minX:xx-w/2,maxX:xx+w/2,minY:yy-h/2,maxY:yy+h/2});});
            const clear=walls=>{for(const w of walls){if(g.participants.some(p=>p.id!==999&&__brScope.combatWallContact(p.pos.x,p.pos.y,p.radius+40,w)))return false;if(Math.hypot(w.x,w.y)+Math.hypot(w.w,w.h)/2>limit-170||Math.hypot(w.x,w.y)<700)return false;const n=Math.ceil(Math.max(w.w,w.h)/36);for(let i=0;i<=n;i++){const x=w.w>w.h?(i/n-.5)*w.w:0,y=w.h>=w.w?(i/n-.5)*w.h:0,p=new __brScope.Vec2(w.x+x*Math.cos(w.angle)-y*Math.sin(w.angle),w.y+x*Math.sin(w.angle)+y*Math.cos(w.angle));if(g.checkWallCollision(p,gap+Math.min(w.w,w.h)/2)||g.blocksCoverEntry(p,gap))return false;}}for(let i=0;i<walls.length;i+=3){const back=walls[i],cx=(walls[i+1].x+walls[i+2].x)/2,cy=(walls[i+1].y+walls[i+2].y)/2,dx=(cx-back.x)/128,dy=(cy-back.y)/128;for(let d=0;d<=600;d+=40)if(g.checkWallCollision(new __brScope.Vec2(cx+dx*d,cy+dy*d),radius+20))return false;}return true;};
            const wanted=Math.min(4,Math.max(3,stats.priorGroups+2)),need=wanted-stats.priorGroups;stats.requestedGroups=need;
            if(328>=gap&&254>=gap){const symmetric=![0,2].includes(g.mapIndex);for(let added=0;added<need;){const paired=need-added>=2;let found=false;for(let n=0;n<640;n++){stats.attempts++;const angle=random()*Math.PI*2,dist=limit*(n%2?.72:.45)+random()*limit*.08,x=Math.cos(angle)*dist,y=Math.sin(angle)*dist,a=Math.round((angle+Math.PI/2)*1e6)/1e6,pieces=make(x,y,a,'survival31-'+added),all=paired?[...pieces,...make(-x,-y,Math.round((a+Math.PI)*1e6)/1e6,'survival31-'+(added+1))]:pieces;
                    if(symmetric&&!paired)break;if(!clear(all))continue;g.walls.push(...all);g.combatCover.push(...all);__brScope.combatWallGridCache.delete(g.walls);added+=paired?2:1;stats.addedGroups=added;found=true;break;}if(!found)break;}}
            stats.failedGroups=need-stats.addedGroups;const groups=__brScope.brSurvivalGroups(g),radii=[118,150,182];
            for(let i=0;i<2;i++){for(let n=0;n<160;n++){const near=groups[(i+Math.floor(n/40))%Math.max(1,groups.length)],a=random()*Math.PI*2,r=radii[Math.floor(random()*3)],d=450+random()*350,p=near?new __brScope.Vec2(near.x+Math.cos(a)*d,near.y+Math.sin(a)*d):new __brScope.Vec2(Math.cos(a)*limit*(.4+random()*.4),Math.sin(a)*limit*(.4+random()*.4));if(p.mag()+r>limit-150||p.mag()<600||g.checkWallCollision(p,r*.7)||g.participants.some(q=>q.id!==999&&q.pos.dist(p)<q.radius+r+20)||g.smokes.some(s=>s.pos.dist(p)<s.radius+r+50))continue;g.smokes.push(new __brScope.SmokeCover(p.x,p.y,r,3100+g.mapIndex*10+i));stats.smokeAdded++;break;}}
            g.survivalRoutes=groups;g.survivalRandom=__brScope.brSurvivalRandom(String(__brScope.session?.roomMeta?.seed||'farm')+'|side31|'+g.mapIndex);g.mapRevision='survival31:'+g.mapIndex+':'+g.walls.length+':'+g.smokes.length;
            __brScope.combatWallGridCache.delete(g.walls);g._wallCollisionCandidates.length=0;g._wallTraceCandidates.length=0;
        };

__brScope.brSurvivalFarmSlot = function brSurvivalFarmSlot(g){if(!g.survivalRoutes?.length)return false;const n=g.sideFarm||(g.sideFarm={attempts:0,wanted:0,placed:0,fallback:0,index:0});n.attempts++;const selected=(n.index++%4)===3;if(selected)n.wanted++;return selected;};

__brScope.brSurvivalFarmPoint = function brSurvivalFarmPoint(g,maxRadius,padding,players){const groups=g.survivalRoutes,random=g.survivalRandom;if(!groups?.length||!random)return null;const body=__brScope.brSurvivalMaxRadius();for(let n=0;n<64;n++){const q=groups[Math.floor(random()*groups.length)],side=random()<.5?-1:1,lateral=side*(body*2+220+random()*220),along=-120+random()*600,p=new __brScope.Vec2(q.x-q.dy*lateral+q.dx*along,q.y+q.dx*lateral+q.dy*along);if(p.dist(g.center)>maxRadius-padding||g.checkWallCollision(p,padding+28)||g.blocksCoverEntry(p,padding)||g.smokes.some(s=>s.pos.dist(p)<s.radius*.7+padding)||g.farmBoxes.some(b=>b.pos.dist(p)<padding*2+28)||players.some(a=>a.alive&&a.pos.dist(p)<a.radius+padding+34))continue;return p;}return null;};

__brScope.brRevealSmoke = function brRevealSmoke(p,g,frames,reason){if(!p?.alive||p.id===999||!g)return;const life=Number(p.lifeSeq||0);if(p.smokeRevealLife!==life){p.smokeRevealEnd=0;p.smokeRevealLife=life;}p.smokeRevealEnd=Math.max(Number(p.smokeRevealEnd||0),g.frame+frames);if(reason==='attack'||p.smokeRevealReason!=='attack'||Number(p.smokeAttackEnd||0)<=g.frame)p.smokeRevealReason=reason;if(reason==='attack')p.smokeAttackEnd=g.frame+frames;};

__brScope.brSmokeRevealed = function brSmokeRevealed(p,frame){return Number(p.smokeRevealLife??p.lifeSeq??-1)===Number(p.lifeSeq||0)&&Number(p.smokeRevealEnd||0)>frame;};

__brScope.brSmokeAttack = function brSmokeAttack(c,continuing=false){if(!c?.owner?.alive||c.ownerLifeSeq!==Number(c.owner.lifeSeq||0)||c.actionKind==='summon')return;if(c.smokeAttackStarted&&!continuing)return;c.smokeAttackStarted=true;__brScope.brRevealSmoke(c.owner,c.g,60,'attack');};

__brScope.brStatNumber = function brStatNumber(n){return String(Math.round((Number(n)+Number.EPSILON)*100)/100);};

__brScope.brSmokeContains = function brSmokeContains(smoke,pos,padding=0) {
            if(!smoke||!pos)return false;
            const row=Array.isArray(smoke),x=Number(row?smoke[0]:smoke.x),y=Number(row?smoke[1]:smoke.y);
            const radius=Number(row?smoke[2]:smoke.radius),px=Number(pos.x),py=Number(pos.y);
            if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||!Number.isFinite(px)||!Number.isFinite(py)||radius<=0)return false;
            const r=Math.max(0,radius+padding),dx=px-x,dy=py-y;
            return dx*dx+dy*dy<=r*r;
        };

__brScope.brSmokeConcealed = function brSmokeConcealed(smokes,target,viewer,frame=__brScope.game?.frame||0) {
            if(!target||!viewer||target===viewer||target.alive===false)return false;
            if(target.team!==0&&target.team===viewer.team)return false;
            const dx=target.pos.x-viewer.pos.x,dy=target.pos.y-viewer.pos.y,d2=dx*dx+dy*dy;
            // Skill invisibility remains independent, including in shared smoke.
            if(target.invisible&&d2>__brScope.BR_SMOKE.skillReveal**2)return true;
            if(d2<=__brScope.BR_SMOKE.reveal**2||__brScope.brSmokeRevealed(target,frame))return false;
            let targetCovered=false;
            for(const smoke of smokes||[]) {
                if(!__brScope.brSmokeContains(smoke,target.pos))continue;
                targetCovered=true;
                // Any shared field reveals both occupants. Overlap order cannot change this.
                if(__brScope.brSmokeContains(smoke,viewer.pos))return false;
            }
            return targetCovered;
        };
}
export const initializers=[
[144,__brScope=>{ __brScope.brSurvivalRosterRadius=null;;}],
[154,__brScope=>{ __brScope.BR_SMOKE = Object.freeze({reveal:125, skillReveal:170});;}]
];
