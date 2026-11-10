import {captureContains,captureClamp} from '../movement/capture-boundary.js';
// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brModeHpMultiplier = function brModeHpMultiplier(mode){return mode==='team-capture'?.85:mode==='team-respawn'?__brScope.BR_TEAM_KILL_RULES.hpMultiplier:1;};

__brScope.brRespawnMode = function brRespawnMode(mode){return mode==='team-respawn'||mode==='team-capture';};

__brScope.brCaptureMode = function brCaptureMode(){return __brScope.session?.roomMeta?.mode==='team-capture';};

__brScope.brCapturePointMultiplier = function brCapturePointMultiplier(index){return __brScope.BR_CAPTURE_RULES.pointMultipliers[index]||1;};

__brScope.brCapturePointRate = function brCapturePointRate(counts,index,fever){return __brScope.BRCapture.resolve(counts).rate*__brScope.brCapturePointMultiplier(index)*(fever?__brScope.BR_CAPTURE_RULES.feverMultiplier:1);};

__brScope.brArenaRect = function brArenaRect(g){if(!__brScope.brCaptureMode())return null;return g?.boundary?.kind==='rect'?g.boundary:__brScope.BRCapture.layout(__brScope.session?.roomMeta?.teamCount||2).boundary;};

__brScope.brArenaContains = function brArenaContains(g,pos,r=0){const b=__brScope.brArenaRect(g);return !b||captureContains(b,pos,r);};

__brScope.brArenaClamp = function brArenaClamp(g,pos,r=0){const b=__brScope.brArenaRect(g);if(!b)return pos;const p=captureClamp(b,pos,r,__brScope);return new __brScope.Vec2(p.x,p.y);};

__brScope.brArenaRay = function brArenaRay(g,from,dir,max,r=0){const b=__brScope.brArenaRect(g);if(!b)return max;const to={x:from.x+dir.x*max,y:from.y+dir.y*max},hit=__brScope.combatTraceWalls(from,to,r,b.blocks||[]);return hit?Math.max(0,max*hit.t-.01):max;};

__brScope.brCaptureFarmClear = function brCaptureFarmClear(g,pos,r=0){if(!g.capture)return true;return __brScope.brArenaContains(g,pos,r+20)&&!g.capture.map.points.some(z=>Math.hypot(pos.x-z.x,pos.y-z.y)<z.radius+r+70)&&!g.capture.map.bases.some(b=>Math.abs(pos.x-b.x)<b.rx+r+160&&Math.abs(pos.y-b.y)<b.ry+r+160);};

__brScope.brCaptureRandomPoint = function brCaptureRandomPoint(g,r=80,random=__brScope.rand){const b=__brScope.brArenaRect(g);return __brScope.brArenaClamp(g,new __brScope.Vec2(b.minX+r+random()*(b.maxX-b.minX-2*r),b.minY+r+random()*(b.maxY-b.minY-2*r)),r);};

__brScope.brCaptureSpawn = function brCaptureSpawn(g,p,placed=g.participants.filter(q=>q!==p&&q.alive)){
            const base=g.capture.map.bases[p.team-1];if(!base)return null;let best=null,bestScore=-Infinity;
            for(let row=-6;row<=6;row++)for(let col=-7;col<=7;col++){
                if(Math.abs(col*78)>base.rx-12||Math.abs(row*78)>base.ry-12)continue;
                const pos=new __brScope.Vec2(base.x+col*78,base.y+row*78);if(!__brScope.brArenaContains(g,pos,p.radius+4)||g.checkWallCollision(pos,p.radius+12))continue;
                let score=0,blocked=false;for(const q of placed){const d=pos.dist(q.pos);if(d<p.radius+q.radius+12){blocked=true;break;}if(q.team!==p.team)score+=Math.min(1600,d)*.05;}
                if(blocked)continue;
                for(const z of [...g.zones,...(g.rw?.entities||[])]){if(z.dead||!z.pos||!z.radius||(z.owner||z.ctx?.owner)?.team===p.team)continue;if(pos.dist(z.pos)<z.radius+p.radius+60)score-=2000;}
                for(const smoke of g.smokes)if(Math.hypot(pos.x-smoke.x,pos.y-smoke.y)<smoke.radius+p.radius)score-=120;
                score-=Math.hypot(col,row)*2;if(score>bestScore){bestScore=score;best=pos;}
            }return best;
        };

__brScope.brCaptureSetupMap = function brCaptureSetupMap(g){const map=__brScope.BRCapture.layout(__brScope.session?.roomMeta?.teamCount||2);g.boundary=map.boundary;g.capture=__brScope.BRCapture.create(map.count,Number(__brScope.session?.roomMeta?.matchSeconds||360),__brScope.brRingKey());
            g.mapRevision=map.revision;g.mapName='넓은 X자 점령 아레나';g.walls=map.walls.map(w=>Object.assign(Object.create(__brScope.Wall.prototype),w));
            g.smokes=map.smokes.map(([x,y,r],i)=>new __brScope.SmokeCover(x,y,r,i+1));__brScope.combatWallGridCache.delete(g.walls);g.combatCover=[];
        };

__brScope.brCaptureBoundaryHit = function brCaptureBoundaryHit(from,to,r=0){const b=__brScope.brArenaRect();if(!b)return null;let hit=null;const axes=[['x',b.minX+r,b.maxX-r],['y',b.minY+r,b.maxY-r]];
            for(const [axis,lo,hi] of axes){const d=to[axis]-from[axis];if(Math.abs(d)<1e-10)continue;const edge=d>0?hi:lo;if(d>0?to[axis]<=edge:to[axis]>=edge)continue;const t=Math.max(0,(edge-from[axis])/d);if(t>1||hit&&t>=hit.t)continue;hit={t,nx:axis==='x'?(d>0?-1:1):0,ny:axis==='y'?(d>0?-1:1):0,depth:0,boundary:true};}return hit;};
}
export const initializers=[
[244,__brScope=>{ __brScope.BR_CAPTURE_RULES=Object.freeze({version:4,mapRevision:'capture-x-1',seconds:[300,360],defaultSeconds:360,
            mapScale:1,openingMask:3,pointMultipliers:Object.freeze([1,1]),rates:Object.freeze([0,.24,.30,.36]),epsilon:1e-8,pointRadius:400,centerRadius:400,openingSeconds:0,feverSeconds:60,feverMultiplier:2,publishMs:200,staleMs:1800});;}],
[250,__brScope=>{ __brScope.BRCapture=__brScope.BRCapture=(()=>{
            const EPS=__brScope.BR_CAPTURE_RULES.epsilon,layouts=new Map(),id=p=>String(p.remoteId??p.id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
            function layout(count){count=clamp(Number(count)||2,2,4);if(layouts.has(count))return layouts.get(count);
                const boundary={kind:'rect',minX:-3000,maxX:3000,minY:-3000,maxY:3000,xArm:1600,revision:__brScope.BR_CAPTURE_RULES.mapRevision+'-'+count};
                const slots=[[-2250,-2250],[2250,-2250],[-2250,2250],[2250,2250]];
                const bases=(count===2?[slots[0],slots[3]]:slots.slice(0,count)).map(([x,y],i)=>({team:i+1,x,y,rx:480,ry:480}));
                const points=[[-550,0],[550,0]].map(([x,y],i)=>({id:'AB'[i],x,y,radius:__brScope.BR_CAPTURE_RULES.pointRadius}));
                const wall=(x,y,w,h,angle=0,terrain=false)=>{const ex=(Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*h)/2,ey=(Math.abs(Math.sin(angle))*w+Math.abs(Math.cos(angle))*h)/2;return {x,y,w,h,angle,kind:'wall',terrain,spinSpeed:0,minX:x-ex,maxX:x+ex,minY:y-ey,maxY:y+ey};};
                // Four ordinary rotated square walls clip the cardinal sides of
                // the outer rectangle. Their inner edges form broad X corridors.
                const blocks=[[4400,0],[-4400,0],[0,4400],[0,-4400]].map(([x,y])=>wall(x,y,5600/Math.SQRT2,5600/Math.SQRT2,Math.PI/4,true));
                boundary.blocks=blocks;
                const cover=[[-1050,-900],[1050,-900],[-1050,900],[1050,900]].map(([x,y])=>wall(x,y,260,60));
                const walls=[...blocks,...cover],smokes=[[-1650,-1900,160],[1650,-1900,160],[-1650,1900,160],[1650,1900,160]];
                const out={revision:boundary.revision,count,boundary,bases,points,walls,smokes};layouts.set(count,out);return out;
            }
            function inside(p,point){return (p.x-point.x)**2+(p.y-point.y)**2<=point.radius**2+EPS;}
            function resolve(counts){let n1=0,n2=0,team=0,ties=[];
                for(let i=1;i<counts.length;i++){const n=counts[i];if(n>n1){n2=n1;n1=n;team=i;ties=[i];}else if(n===n1&&n>0){n2=n1;ties.push(i);}else if(n>n2)n2=n;}
                if(!n1)return {state:'neutral',team:0,delta:0,rate:0,ties:[]};
                if(ties.length>1)return {state:'contested',team:0,delta:0,rate:0,ties};
                const delta=n1-n2;return {state:'scoring',team,delta,rate:__brScope.BR_CAPTURE_RULES.rates[Math.min(3,delta)],ties:[]};
            }
            function phase(active,seconds){return active+EPS>=seconds-__brScope.BR_CAPTURE_RULES.feverSeconds?'FEVER':'ALL_OBJECTIVES';}
            function setPhase(s){s.phase=phase(s.active,s.seconds);s.activeMask=3;s.fever=s.phase==='FEVER';s.multiplier=s.fever?__brScope.BR_CAPTURE_RULES.feverMultiplier:1;}
            function create(count,seconds,key){const map=layout(count);return {version:__brScope.BR_CAPTURE_RULES.version,key,map,count:map.count,seconds:__brScope.BR_CAPTURE_RULES.seconds.includes(seconds)?seconds:360,
                active:0,phase:'ALL_OBJECTIVES',activeMask:__brScope.BR_CAPTURE_RULES.openingMask,fever:false,multiplier:1,seq:0,frame:0,finalized:false,winners:[],reason:'',scores:Array(map.count+1).fill(0),rates:Array(map.count+1).fill(0),
                points:map.points.map((p,i)=>({...p,enabled:!!(__brScope.BR_CAPTURE_RULES.openingMask&(1<<i)),counts:Array(map.count+1).fill(0),members:[],state:__brScope.BR_CAPTURE_RULES.openingMask&(1<<i)?'neutral':'locked',team:0,rate:0,ties:[]})),records:new Map(),lastFrame:-1};}
            // Match totals belong to remoteId, independently of the replaceable life body.
            function record(s,p){const key=id(p);let r=s.records.get(key);if(!r){r={id:key,name:p.name||key,team:Number(p.team),session:String(p.sessionId||''),kills:0,deaths:0,assists:0,damageDealt:0,damageTaken:0,points:0,scoringSeconds:0,contestedSeconds:0,pointKills:0,pointAssists:0,heal:0,shield:0,quizCorrect:0,rerollCount:0,usedAbilities:[],lastDeathLife:null};s.records.set(key,r);}
                r.name=p.name||r.name;r.team=Number(p.team);r.session=String(p.sessionId||'');
                r.quizCorrect=Math.max(r.quizCorrect,Number(p.tkStats?.quizCorrect||0));r.rerollCount=Math.max(r.rerollCount,Number(p.tkStats?.rerollCount||0));
                if(p.alive&&p.ability?.id&&r.usedAbilities.at(-1)!==p.ability.id)r.usedAbilities.push(p.ability.id);
                return r;
            }
            function eligible(p,g){if(!p||p.id===999||p.isReworkTurret||p.isClone||p.cloneOwner||!p.alive||!(p.hp>0)||!p.team||p.spawnProtectionUntilFrame>g.frame)return false;
                const rec=__brScope.session?.players?.[p.remoteId];if(__brScope.session?.active&&__brScope.session?.role==='host'&&p.remoteId&&!rec)return false;return !rec||(!rec.revoked&&__brScope.session.playerConnected(rec)&&String(rec.sessionId||'')===String(p.sessionId||''));}
            function tally(s,players,g){setPhase(s);s.rates.fill(0);for(let i=0;i<s.points.length;i++){const z=s.points[i];z.enabled=!!(s.activeMask&(1<<i));z.counts.fill(0);z.members.length=0;}
                for(const p of players){if(p.id===999||p.isClone||p.cloneOwner||p.isReworkTurret)continue;record(s,p);if(!eligible(p,g)||p.team>s.count)continue;for(const z of s.points)if(z.enabled&&inside(p.pos,z)){z.counts[p.team]++;z.members.push(p);break;}}
                for(const [index,z] of s.points.entries()){if(!z.enabled){Object.assign(z,{state:'locked',team:0,delta:0,rate:0,ties:[]});continue;}Object.assign(z,resolve(z.counts));z.rate=__brScope.brCapturePointRate(z.counts,index,s.fever);if(z.team)s.rates[z.team]+=z.rate;}
            }
            function finish(s,reason){if(s.finalized)return;s.finalized=true;s.reason=reason;const best=Math.max(...s.scores.slice(1));s.winners=[];
                for(let t=1;t<=s.count;t++)if(Math.abs(s.scores[t]-best)<=EPS)s.winners.push(t);s.seq++;}
            function integrate(s,dt,players=null,g=null){if(s.finalized||!Number.isFinite(dt)||dt<=0)return 0;let remaining=dt,total=0;
                // Split an authority step at phase/time/100% boundaries. A render or packet never earns points.
                while(remaining>EPS&&!s.finalized){
                    if(players&&g)tally(s,players,g);else setPhase(s);
                    const boundary=s.active<__brScope.BR_CAPTURE_RULES.openingSeconds-EPS?__brScope.BR_CAPTURE_RULES.openingSeconds:s.active<s.seconds-__brScope.BR_CAPTURE_RULES.feverSeconds-EPS?s.seconds-__brScope.BR_CAPTURE_RULES.feverSeconds:s.seconds;
                    let use=Math.min(remaining,Math.max(0,boundary-s.active)),end='';
                    for(let t=1;t<=s.count;t++)if(s.rates[t]>0)use=Math.min(use,Math.max(0,(100-s.scores[t])/s.rates[t]));
                    const added=Array(s.count+1).fill(0);for(const z of s.points){if(z.enabled&&z.team&&z.rate){const members=z.members.filter(p=>p.team===z.team),d=z.rate*use;if(!members.length)continue;
                            // The team's actual increment is shared exactly, including FEVER and a clipped final step.
                            added[z.team]+=d;let rest=d;members.forEach((p,i)=>{const a=i===members.length-1?rest:d/members.length;rest-=a;const r=record(s,p);r.points+=a;r.scoringSeconds+=use;});}
                        else if(z.enabled&&z.state==='contested')for(const p of z.members)record(s,p).contestedSeconds+=use;
                    }
                    for(let t=1;t<=s.count;t++){s.scores[t]+=added[t];if(s.scores[t]>100&&s.scores[t]<100+EPS)s.scores[t]=100;}
                    s.active=Math.min(s.seconds,s.active+use);if(Math.abs(s.active-boundary)<EPS)s.active=boundary;
                    total+=use;remaining-=use;s.seq++;
                    if(s.scores.some((v,i)=>i&&v>=100-EPS))end='target';else if(s.active>=s.seconds-EPS)end='time';
                    if(end)finish(s,end);
                    const before=s.phase;setPhase(s);if(before!==s.phase&&players&&g)tally(s,players,g);
                    if(use<=EPS&&!end)break;
                }return total;
            }
            function tick(g){const s=g.capture;if(!s||s.finalized||g.paused||g.ringSuspended||g.isGameOver||s.lastFrame===g.frame)return 0;
                s.lastFrame=g.frame;s.frame=g.frame;const used=integrate(s,1/60,g.participants,g);s.hostAt=__brScope.now();
                if(s.finalized){g.isGameOver=true;g.matchEndedAt=g.frame;__brScope.session?.captureFinished?.(s);}return used;}
            function pointAt(s,pos){return s?.points.find(z=>z.enabled&&inside(pos,z));}
            function realBody(p){return p&&p.id!==999&&!p.isClone&&!p.cloneOwner&&!p.isReworkTurret;}
            function damage(g,attacker,victim,actual){const s=g?.capture;if(!s||s.finalized||!Number.isFinite(actual)||actual<=0||!realBody(victim))return;
                record(s,victim).damageTaken+=actual;
                if(!realBody(attacker)||attacker===victim||!attacker.team||attacker.team===victim.team)return;
                record(s,attacker).damageDealt+=actual;
                const entry={id:id(attacker),team:attacker.team,at:s.active,life:Number(attacker.lifeSeq||0),session:String(attacker.sessionId||'')};
                const remember=field=>{if(!victim[field]||victim[field].life!==Number(victim.lifeSeq||0))victim[field]={life:Number(victim.lifeSeq||0),entries:new Map()};
                    const history=victim[field].entries;history.set(entry.id,entry);for(const [k,h] of history)if(s.active-h.at>5||history.size>32)history.delete(k);};
                remember('_captureAssistDamage');
                if(pointAt(s,attacker.pos)||pointAt(s,victim.pos))remember('_captureDamage');
            }
            function death(g,victim){const s=g?.capture;if(!s||s.finalized||!realBody(victim))return;const r=record(s,victim),life=Number(victim.lifeSeq||0);if(r.lastDeathLife===life)return;r.lastDeathLife=life;r.deaths++;}
            function kill(g,attacker,victim){const s=g?.capture;if(!s||s.finalized||!realBody(attacker)||!realBody(victim)||attacker===victim||!attacker.team||attacker.team===victim.team)return;
                const key=s.key+':'+Number(victim.lifeSeq||0);if(victim._captureKill===key)return;victim._captureKill=key;
                record(s,attacker).kills++;
                const recent=field=>victim[field]?.life===Number(victim.lifeSeq||0)?[...victim[field].entries.values()].filter(x=>s.active-x.at>=0&&s.active-x.at<=5):[];
                const assist=(h,field)=>{if(h.id===id(attacker)||h.team!==attacker.team)return;const body=g.participants.find(p=>id(p)===h.id);
                    if(!realBody(body)||Number(body.lifeSeq||0)!==h.life||String(body.sessionId||'')!==h.session||body.team!==h.team)return;record(s,body)[field]++;};
                for(const h of recent('_captureAssistDamage'))assist(h,'assists');
                const pointHistory=recent('_captureDamage');if(pointHistory.length){record(s,attacker).pointKills++;for(const h of pointHistory)assist(h,'pointAssists');}
            }
            function support(g,source,target,amount,kind){const s=g?.capture;if(!s||s.finalized||!source||source===target||!source.team||source.team!==target.team||!Number.isFinite(amount)||amount<=0||source.id===999||target.id===999)return;record(s,source)[kind]+=amount;}
            function awards(s){const rows=[...s.records.values()];const top=value=>{const max=Math.max(0,...rows.map(value));return max>EPS?rows.filter(r=>Math.abs(value(r)-max)<=EPS).sort((a,b)=>a.id.localeCompare(b.id)).map(r=>r.id):[];};
                return [{key:'capture',label:'점령 MVP',ids:top(r=>r.points)},{key:'combat',label:'거점 전투왕',ids:top(r=>r.pointKills+r.pointAssists)},{key:'support',label:'팀 지원왕',ids:top(r=>r.heal+r.shield)}];}
            return {layout,inside,resolve,phase,setPhase,create,record,eligible,tally,integrate,tick,finish,damage,kill,death,support,awards,pointAt,id};
        })();;}]
];
