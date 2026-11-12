import {placeMirror} from '../combat/reflection.js';
// New roster only: explicit frozen pre-patch medians, existing 60 Hz entity lifecycle.
export function install(){}
export const ROSTER10_BASES=Object.freeze({
 S_melee:{finalBaseHp:550.66312,speed:1.6454239999999998,radius:73.56800000000001},
 S_ranged:{finalBaseHp:436.242,speed:1.296,radius:57.379999999999995},
 A_melee:{finalBaseHp:401.41675041804007,speed:1.7850000000000001,radius:54.535776},
 A_ranged:{finalBaseHp:320.173425,speed:1.7967,radius:41.800000000000004},
 B_ranged:{finalBaseHp:258.75,speed:1.5,radius:38},C_melee:{finalBaseHp:313.467,speed:2.2,radius:38},
 F_melee:{finalBaseHp:180,speed:2.3,radius:30.400000000000002},F_ranged:{finalBaseHp:293.75,speed:1.65,radius:34.2}
});
export const initializers=[[310,S=>{
 const R=S.BRRework,V=(x=0,y=0)=>new S.Vec2(x,y),copy=R.copy,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const fixed=c=>({...c,run:{...c.run,duration:1}}),now=g=>g.frame;
 const caps=extra=>({damage:false,projectile:false,multicast:false,expandable:false,area:false,cc:false,heal:false,shield:false,dash:false,summon:false,trap:false,duration:false,utility:true,signatureRange:false,signatureDuration:false,...extra});
 const entries=[
  [141,'🤡','조커','S',true,'짧은 카드 베기','#c084fc'],[142,'🤠','마운틴 팀','S',false,'단발 탄','#e7bd84'],
  [143,'👑','킹 오브 데마시아','S',true,'검격','#facc15'],[144,'🍄','버섯돌보미','A',false,'포자 단발','#86efac'],
  [145,'🦈','부캉이','A',true,'짧은 깨물기','#7dd3fc'],[146,'🐼','푸바오','A',true,'대나무 타격','#bef264'],
  [147,'👽','외계인','B',false,'작은 에너지탄','#a3e635'],[148,'👹','도깨비','C',true,'방망이 타격','#fb7185'],
  [149,'🐖','꿀꿀이','F',true,'짧은 들이밀기','#f9a8d4'],[150,'🐭','찍찍이','F',false,'작은 단발 탄','#cbd5e1'],
  [151,'🚦','신호등','B',false,'직선 신호탄','#f87171'],
  [152,'🕴','마이클 잭슨','S',false,'단발 스타 탄','#fde68a'],
  [153,'🪞','미러링','A',false,'단발 은빛 탄','#cbd5e1']
 ];
 function register(number,skill,handler){
  const [,emoji,name,tier,close,basicText,color]=entries.find(x=>x[0]===number),id='emoji-'+number;
  if(S.EMOJI_DB.some(a=>a.id===id)||R.defs[id])throw Error('ROSTER_ID_COLLISION:'+id);
  const basic={close,description:basicText,style:close?'slash':'standard',...(close?{rangeBonus:86,halfAngle:1.18,cooldownScale:1,damageScale:1,pushScale:.28,stun:0,reward:''}:{type:'bullet',count:1,spread:0,pierce:false,bounces:0,explode:0,status:null,statusPower:0})};
  skill={...skill,key:'rework-'+id,label:skill.label||name,cooldown:skill.cooldownFrames,duration:skill.durationFrames||0,windup:skill.windupFrames||0,interval:skill.intervalFrames||0,stun:0,units:{time:'frames@60Hz',distance:'world units',width:'full width',speed:'world units/frame',damage:'base coefficient before rank/run modifiers'}};
  skill.caps=skill.capabilities;skill.cancelPolicy='owner death/life change/match reset remove; movement cancels on stun or forced movement';
  const ability={id,legacyIndex:number,timingSeed:'roster10-'+number,t:tier,e:emoji,n:name,type:close?'MELEE':'PROJ',sub:'ROSTER10_'+number,sizeMult:1,category:close?'근접형':'원거리형',desc:skill.description,concept:skill.description,basicSummary:basicText,skillSummary:skill.description,pTrail:color,projEmoji:emoji};
  S.EMOJI_DB.push(ability);R.register(id,{referenceName:name,rank:tier,role:ability.category,category:ability.category,statType:ability.type,tankRole:false,basic,skill,stats:{...ROSTER10_BASES[tier+'_'+(close?'melee':'ranged')],...(number===149?{finalBaseHp:240}:number===152?{finalBaseHp:375,speed:1.65}:number===153?{finalBaseHp:340,speed:1.60}:{})}},c=>handler(fixed(c),skill));
 }
 function removeStealth(p){if(!p.rw?.jokerStealth)return;p.rw.jokerStealth=null;p.invisible=false;}
 function targetable(c,kind,opts,tick){const e=R.entity(c,kind,{...opts,maxHp:opts.hp,cancelOnStun:false},tick);Object.assign(e,{alive:true,isReworkTurret:true,owner:c.owner,team:c.owner.team,remoteId:e.id,lifeSeq:0});R.world(c.g).turretFrame=-1;return e;}
 function clampArena(g,p,r){if(g.boundary)return S.brArenaClamp(g,p,r+4);const d=dist(p,g.center),max=g.worldRadius-r-4;return d>max?V(g.center.x+(p.x-g.center.x)*max/d,g.center.y+(p.y-g.center.y)*max/d):p;}
 function moveBody(c,from,to,r){const g=c.g,hit=S.combatTraceWalls(from,to,r,S.brHostBodyWalls(g),[]),t=hit?Math.max(0,hit.t-.0001):1;return clampArena(g,V(from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t),r);}
 function forced(c){const s=R.state(c.owner);return !!s.force||!!s.impulse?.hard;}
 function firstBody(c,from,to,r,all=true){let hit=null;const span=dist(from,to),mid=V((from.x+to.x)/2,(from.y+to.y)/2);for(const p of c.g.getNearbyParticipants(mid,span/2+r+(c.g.maxBodyRadius||160)+10)){
   if(p===c.owner||!p.alive||p.id===999||!all&&!R.hostile(c,p))continue;
   const t=S.combatSegmentCircleTime(from.x-p.pos.x,from.y-p.pos.y,to.x-from.x,to.y-from.y,r+p.radius+1);
   if(t!==null&&(!hit||t<hit.t||t===hit.t&&String(p.id)<String(hit.target.id)))hit={t,target:p};
  }return hit;}
 function placement(c,range,r,body=false){const from=c.owner.pos,to=from.add(c.aim.mult(R.ranged(c,range)*(c.aimRangeFactor??1))),hit=body?firstBody(c,from,to,r+4):null;return moveBody(c,from,hit?from.add(to.sub(from).mult(Math.max(0,hit.t-.0001))):to,r);}
 // Never enters hit/onHit/farm/reflection: shared by alien, mouse and self-grapple.
 function travel(c,{range,speed,onStop,kind='dash',to=null,anchorValid=null}){
  const p=c.owner,s=R.state(p),start=copy(p.pos),dir=to?R.norm(to.sub(start)):copy(c.aim),length=to?dist(start,to):R.ranged(c,range)*(c.aimRangeFactor??1);
  let e;e=R.entity(c,kind,{pos:start,dir,speed,range:length,distance:0,duration:Math.ceil(length/speed)+3,cancelOnStun:true,from:start,to:to||start.add(dir.mult(length)),onEnd(ctx,q,reason){p.vel=V();if(onStop&&['range','wall','body'].includes(reason))onStop(ctx,q,q.hitTarget);}},(ctx,q)=>{
   if(forced(ctx)||anchorValid&&!anchorValid()){R.end(q,'forced');return;}
   const from=copy(p.pos),remaining=Math.max(0,q.range-q.distance),want=from.add(q.dir.mult(Math.min(q.speed,remaining))),body=firstBody(ctx,from,want,p.radius),limit=body?V(from.x+(want.x-from.x)*Math.max(0,body.t-.0001),from.y+(want.y-from.y)*Math.max(0,body.t-.0001)):want;
   const dest=moveBody(ctx,from,limit,p.radius),moved=dist(from,dest),wall=dist(dest,limit)>.01;p.pos=dest;p.vel=dest.sub(from);q.pos=copy(dest);q.distance+=moved;s.motionFrame=now(c.g);R.world(c.g).spatialDirty=true;
   if(wall)R.end(q,'wall');else if(body){q.hitTarget=body.target;R.end(q,'body');}else if(q.distance>=q.range-.01||moved<.001)R.end(q,'range');
  });s.dash=e;return e;
 }
 function wallRevision(g){const d=g.dynamicObstacles||(g.dynamicObstacles={revision:0,rings:new Map(),wire:null});d.revision++;d.wire=null;S.combatWallGridCache.delete(g.walls);S.BR_BODY_WALL_CACHE.delete(g.walls);if(g._wallCollisionCandidates)g._wallCollisionCandidates.length=0;if(g._wallTraceCandidates)g._wallTraceCandidates.length=0;return d;}
 function removeRing(g,id){const d=g.dynamicObstacles;if(!d?.rings.has(id))return;d.rings.delete(id);for(let i=g.walls.length-1;i>=0;i--)if(g.walls[i].ringId===id)g.walls.splice(i,1);wallRevision(g);}
 function ring(c,target){
  const g=c.g,p=c.owner,center=target?V((p.pos.x+target.pos.x)/2,(p.pos.y+target.pos.y)/2):copy(p.pos),bodies=target?[p,target]:[p];
  const radius=Math.max(260,...bodies.map(q=>dist(q.pos,center)+q.radius+24));
  if(radius>360||g.boundary&&!S.brArenaContains(g,center,radius+24)||!g.boundary&&dist(center,g.center)+radius+24>g.worldRadius)return null;
  const pieces=[],count=16,half=Math.PI/count;for(let i=0;i<count;i++){const angle=i*Math.PI*2/count;pieces.push({x:center.x+Math.cos(angle)*radius,y:center.y+Math.sin(angle)*radius,w:2*radius*Math.tan(half)+4,h:24,angle:angle+Math.PI/2,spinSpeed:0,kind:'temporary',dynamic:true,update(){}});}
  // Atomically separate only overlapping bodies, preserving their original inside/outside side.
  const shifts=[];for(const q of g.participants){if(!q.alive||q.id===999||!pieces.some(w=>S.combatWallContact(q.pos.x,q.pos.y,q.radius,w)))continue;const d=dist(q.pos,center),dir=d>0?q.pos.sub(center).mult(1/d):V(1,0),inside=d<radius;
   const safeRadius=inside?radius*Math.cos(half)-12-q.radius-2:radius/Math.cos(half)+12+q.radius+2,dest=center.add(dir.mult(safeRadius));
   if(safeRadius<0||dist(dest,q.pos)>q.radius*2+38||dist(clampArena(g,dest,q.radius),dest)>.01||S.combatTraceWalls(q.pos,dest,q.radius,S.brHostBodyWalls(g),[])||pieces.some(w=>S.combatWallContact(dest.x,dest.y,q.radius,w))||g.participants.some(o=>o!==q&&o.alive&&dist(o.pos,dest)<o.radius+q.radius))return null;
   shifts.push([q,dest]);
  }
  const destinations=new Map(shifts);for(const [q,dest]of shifts)for(const other of g.participants){if(other===q||!other.alive||other.id===999)continue;if(dist(dest,destinations.get(other)||other.pos)<q.radius+other.radius)return null;}
  // Existing terrain may intersect a ring, but all 16 closed pieces are installed or none.
  for(const [q,pos]of shifts){q.pos=pos;q.vel=V();}
  const e=R.entity(c,'ring-wall',{pos:center,radius,duration:300,maxPerOwner:1,cancelOnStun:false,color:'#facc15',onEnd:(_,q)=>removeRing(g,q.id)});
  for(let i=0;i<pieces.length;i++)Object.assign(pieces[i],{id:e.id+':wall:'+i,ringId:e.id,owner:c.ownerId,life:c.ownerLifeSeq,end:e.end});
  g.walls.push(...pieces);const d=wallRevision(g);d.rings.set(e.id,e);R.world(g).spatialDirty=true;return e;
 }
 R.dynamicWalls=g=>{const d=g.dynamicObstacles;if(!d)return {revision:0,walls:[],rings:[]};if(!d.wire)d.wire={revision:d.revision,walls:g.walls.filter(w=>w.dynamic).map(({id,x,y,w,h,angle,owner,life,end})=>({id,x,y,w,h,angle,owner,life,end})),rings:[...d.rings.values()].map(e=>({id:e.id,x:e.pos.x,y:e.pos.y,radius:e.radius,start:e.start,end:e.end,owner:e.ctx.ownerId,life:e.ctx.ownerLifeSeq}))};return d.wire;};
 R.roster10={travel,ring};
 register(141,{kind:'decoy-blink',shape:'target',cooldownFrames:720,range:400,durationFrames:300,stealthFrames:72,maxPerOwner:1,description:'최대 400 안전 순간이동 · 1.2초 은신(실제 공격·스킬·피격 시 해제) · 최대 HP 25%의 5초 미끼 분신 1개',capabilities:caps({dash:true,signatureRange:true})},(c,s)=>{
  const p=c.owner,from=copy(p.pos),to=placement(c,s.range,p.radius,true);R.teleport(c,to,{prevalidated:true,concealArrival:true});const st=R.state(p);st.jokerStealth={end:now(c.g)+72,life:c.ownerLifeSeq};p.invisible=true;
  targetable(c,'decoy',{pos:from,radius:p.radius,hp:p.maxHp*.25,duration:300,maxPerOwner:1,emoji:p.ability.e,name:p.name,color:'#c084fc'},(ctx,e)=>{const input=S.session.inputs[ctx.ownerId],dx=Number(input?.dx||0),dy=Number(input?.dy||0),length=Math.hypot(dx,dy);if(length>.05&&!R.inputLocks(p,c.g).move){const amount=Math.min(1,length),speed=S.brHumanMoveSpeed(p)*(.24+.76*amount),to=e.pos.add(V(dx/length*speed,dy/length*speed));e.pos=moveBody(ctx,e.pos,to,e.radius);}R.world(c.g).turretFrame=-1;});
 });
 register(142,{kind:'self-grapple',shape:'line',cooldownFrames:600,range:800,width:10,speed:36,pullSpeed:32,damage:0,maxPerOwner:1,description:'밧줄 800 · 첫 플레이어/벽/상자/포탑 표면까지 자신만 이동 · 피해·기절·넉백 없음',capabilities:caps({dash:true,signatureRange:true})},(c,s)=>{
  const p=c.owner,range=R.ranged(c,s.range),head=R.entity(c,'grapple',{pos:p.pos,dir:c.aim,speed:s.speed,range,distance:0,duration:Math.ceil(range/s.speed)+3,maxPerOwner:1,phase:'flight',width:6,radius:5,color:'#e7bd84',from:copy(p.pos),to:copy(p.pos)},(ctx,e)=>{
   if(forced(ctx)){R.end(e,'forced');return;}e.from=copy(p.pos);
   const from=copy(e.pos),to=from.add(e.dir.mult(Math.min(e.speed,e.range-e.distance))),wall=S.combatTraceWalls(from,to,5,S.brHostBodyWalls(c.g),[]);let contact=wall?{t:wall.t,wall:wall.wall,boundary:wall.boundary}:null;
   const body=firstBody(ctx,from,to,5);if(body&&(!contact||body.t<contact.t))contact=body;
   for(const t of R.turrets(c.g,from,dist(from,to)+160)){if(!['turret','mushroom'].includes(t.kind))continue;const at=S.combatSegmentCircleTime(from.x-t.pos.x,from.y-t.pos.y,to.x-from.x,to.y-from.y,5+t.radius);if(at!==null&&(!contact||at<contact.t))contact={t:at,target:t};}
   e.pos=contact?V(from.x+(to.x-from.x)*contact.t,from.y+(to.y-from.y)*contact.t):to;e.to=copy(e.pos);e.distance+=dist(from,e.pos);
   if(contact){const anchor=copy(e.pos),unit=R.norm(anchor.sub(p.pos)),destination=p.pos.add(unit.mult(Math.max(0,dist(anchor,p.pos)-p.radius+4))),wallRef=contact.wall,target=contact.target,farmId=wallRef?.farmId;
    const valid=()=>target?target.alive!==false&&!target.dead&&target.hp>0:farmId?c.g.farmBoxes.some(b=>b.id===farmId&&b.hp>0):wallRef?c.g.walls.includes(wallRef):!!contact.boundary;
    R.end(e,'anchor');const pull=travel(ctx,{to:destination,speed:s.pullSpeed,kind:'grapple',anchorValid:valid});pull.phase='pull';pull.from=copy(p.pos);pull.anchor=anchor;pull.to=anchor;pull.width=6;pull.radius=5;pull.color='#e7bd84';const tick=pull.tick;pull.tick=(cc,q)=>{tick(cc,q);q.from=copy(p.pos);q.pos=copy(anchor);q.to=copy(anchor);};
   }else if(e.distance>=e.range-.01)R.end(e,'range');
  });return head;
 });
 register(143,{kind:'duel-ring',shape:'dash',cooldownFrames:960,range:420,speed:24,damage:60,radius:260,width:24,durationFrames:300,maxPerOwner:1,description:'최대 420 돌진 · 첫 적 피해 60 · 자신도 막히는 반경 260~360의 실제 5초 원형 벽',capabilities:caps({damage:true,dash:true,signatureRange:true})},(c,s)=>{
  for(const e of R.world(c.g).entities)if(e.kind==='ring-wall'&&e.ctx.ownerId===c.ownerId)R.end(e,'replaced');
  travel(c,{range:s.range,speed:s.speed,onStop(ctx,e,target){const enemy=target&&R.hostile(ctx,target)?target:null;if(enemy)R.hit(ctx,enemy,s.damage,{knockback:0,stun:0,direction:e.dir});ring(ctx,enemy);}});
 });
 function poison(c,pos,s){return R.entity(c,'poison',{pos,radius:R.sized(c,90),duration:180,maxPerOwner:2,cancelOnStun:false,color:'#86efac'},(ctx,e)=>{
  if(e.age===0||e.age%30!==0)return;const ledger=R.world(c.g);if(ledger.poisonTick!==now(c.g)){ledger.poisonTick=now(c.g);ledger.poisonHits=new Map();}
  // Only the greatest damage source for this owner/target/tick resolves, independent of entity order.
  for(const p of R.enemies(ctx,e.pos,90)){if(c.g.checkWallBetween(e.pos,p.pos))continue;const key=ctx.ownerId+':'+ctx.ownerLifeSeq+':'+R.pid(p)+':'+R.life(p);if(ledger.poisonHits.has(key))continue;
   let best=e;for(const other of ledger.entities)if(!other.dead&&other.kind==='poison'&&other.ctx.ownerId===ctx.ownerId&&other.ctx.ownerLifeSeq===ctx.ownerLifeSeq&&(now(c.g)-other.start)%30===0&&now(c.g)>other.start&&dist(other.pos,p.pos)<=other.radius+p.radius&&!c.g.checkWallBetween(other.pos,p.pos)&&other.ctx.damageMult*other.ctx.run.damage>best.ctx.damageMult*best.ctx.run.damage)best=other;
   ledger.poisonHits.set(key,true);R.hit(best.ctx,p,4,{periodic:true,knockback:0,stun:0,direction:V()});
  }
 });}
 register(144,{kind:'mushroom',shape:'target',cooldownFrames:540,range:320,radius:95,damage:20,poisonDamage:4,poisonRadius:90,durationFrames:180,intervalFrames:30,armFrames:30,waitFrames:1200,maxPerOwner:3,hp:20,description:'미발동 버섯은 설치자만 표시 · 최대 320 버섯 설치(HP 20, 0.5초 준비/20초 대기, 최대 3개) · 적 접촉 반경 95 피해 20 · 반경 90 독 3초간 4×6회(최대 2개)',capabilities:caps({damage:true,expandable:true,area:true,trap:true,signatureRange:true})},(c,s)=>{
  const pos=placement(c,s.range,26);targetable(c,'mushroom',{pos,radius:26,hp:20,armFrames:30,duration:1230,maxPerOwner:3,emoji:'🍄',color:'#86efac'},(ctx,e)=>{
   if(e.age<30)return;const reach=26+(c.g.maxBodyRadius||160)+(c.g.maxParticipantStep||0),candidates=c.g.getNearbyParticipants(e.pos,reach);
   for(const p of candidates){if(!R.hostile(ctx,p)||p.isClone||p.isReworkTurret)continue;const from=Number(p.combatPreviousWarp||0)===Number(p.warpSeq||0)&&Number.isFinite(p.combatPreviousX)?V(p.combatPreviousX,p.combatPreviousY):p.pos;
    if(S.combatSegmentCircleTime(from.x-e.pos.x,from.y-e.pos.y,p.pos.x-from.x,p.pos.y-from.y,26+p.radius)===null||c.g.checkWallBetween(e.pos,p.pos))continue;
    R.end(e,'trigger');R.area(ctx,e.pos,95,20,{knockback:0,stun:0,color:'#86efac',style:'mushroom-impact'});poison(ctx,e.pos,s);break;
   }
  });
 });
 register(145,{kind:'shark-haste',shape:'self',cooldownFrames:720,durationFrames:300,moveRate:1.2,attackRate:1.25,description:'정확히 5초 이동속도 ×1.20 · 평타 공격빈도 ×1.25(같은 효과 비누적)',capabilities:caps({})},c=>{R.buff(c,c.owner,'moveHaste',1.2,300);R.buff(c,c.owner,'basicHaste',1.25,300);});
 register(146,{kind:'panda-next-basic',shape:'self',cooldownFrames:600,durationFrames:360,healRatio:.1,basicMultiplier:1.5,description:'최대 HP 10% 즉시 회복 · 6초 안의 다음 실제 평타 행동 1회 피해 ×1.50(헛쳐도 소비)',capabilities:caps({heal:true})},c=>{R.heal(c,c.owner,c.owner.maxHp*.1);R.buff(c,c.owner,'pandaNextBasic',1.5,360);});
 register(147,{kind:'safe-dash',shape:'dash',cooldownFrames:420,range:260,speed:26,damage:0,extraUses:1,recastWindow:180,
  description:'최대 260 대시 후 첫 시전부터 3초 안에 한 번 더 사용해 출발 위치로 귀환합니다. 귀환 경로 또는 도착점이 막히면 제자리에 머뭅니다. 귀환 시도 또는 시간 만료 후 대기 7초.',
  capabilities:caps({dash:true,signatureRange:true})},(c,s)=>{
  const origin=copy(c.owner.pos);
  travel(c,s);
  R.openRecast(c,{duration:s.recastWindow,cooldownFrames:s.cooldownFrames,handler:ctx=>{
   const {g,owner}=ctx,r=owner.radius,ring=g.ringGeometry;
   if(S.session.roomMeta.mode==='solo'&&ring&&Math.hypot(origin.x-ring.cx,origin.y-ring.cy)+r>ring.radius)return;
   if(dist(clampArena(g,origin,r),origin)>.01||S.brHostBodyWalls(g).some(wall=>S.combatWallContact(origin.x,origin.y,r,wall)))return;
   if(S.combatTraceWalls(owner.pos,origin,r,S.brHostBodyWalls(g))||firstBody(ctx,owner.pos,origin,r))return;
   R.teleport(ctx,origin,{prevalidated:true});
  }});
 });
 register(148,{kind:'goblin-shield',shape:'self',cooldownFrames:600,durationFrames:180,shieldRatio:.15,attackRate:1.2,description:'정확히 3초 최대 HP 15% 실드 · 평타 공격빈도 ×1.20(같은 출처 갱신)',capabilities:caps({shield:true})},c=>{R.shield(c,c.owner,c.owner.maxHp*.15,180);R.buff(c,c.owner,'basicHaste',1.2,180);});
 register(149,{kind:'pig-haste',shape:'self',cooldownFrames:480,durationFrames:180,moveRate:1.2,description:'정확히 3초 이동속도 ×1.20 · 별도 접촉 피해 없음',capabilities:caps({})},c=>R.buff(c,c.owner,'moveHaste',1.2,180));
 register(150,{kind:'safe-dash',shape:'dash',cooldownFrames:540,range:180,speed:22,damage:0,description:'최대 180 / 속도 22의 짧은 대시 · 벽·상자 앞 정지 · 공격 부작용 없음',capabilities:caps({dash:true,signatureRange:true})},(c,s)=>travel(c,s));
 register(151,{label:'빨간불!',kind:'red-light',shape:'cone',range:780,halfAngle:80*Math.PI/180,
  windupFrames:36,durationFrames:108,slowRate:.35,deadzone:.12,cooldownFrames:1020,damage:0,
  description:'전방 160°·거리 780을 0.6초 예고합니다. 빨간불이 켜지는 순간 걷고 있는 적의 걸음 속도를 1.8초 동안 65% 낮춥니다. 멈추거나 벽 뒤로 피할 수 있습니다.',
  capabilities:caps({})},(c,s)=>{
  const origin=copy(c.owner.pos);
  R.entity(c,'red-light-warning',{pos:origin,shape:'cone',halfAngle:s.halfAngle,range:s.range,duration:s.windupFrames,color:'#f87171'});
  R.schedule(c,s.windupFrames,ctx=>{
   for(const target of R.enemies(ctx,origin,s.range)){
    if(target.isClone||!target.remoteId||!R.visible(ctx,target,origin))continue;
    if(!S.brSectorTouches(origin,target,ctx.aim,s.range,s.halfAngle,S.BR_CONTACT.skillConeTarget))continue;
    const input=S.session.inputs[target.remoteId];
    if(!input||input.life!==target.lifeSeq||input.matchKey!==S.brRingKey()||input.sessionId!==target.sessionId||S.brNow()-input._receivedAt>=250)continue;
    if(Math.hypot(input.dx,input.dy)<=s.deadzone||R.inputLocks(target,ctx.g).move||target.playerDash||target.dashFrames>0)continue;
    // Rework effects resolve before this tick's physics. Use the last completed
    // displacement along the voluntary drive, excluding teleports and wall jitter.
    const driveX=target.presentationDriveX||0,driveY=target.presentationDriveY||0,length=Math.hypot(driveX,driveY);
    const dx=target.pos.x-target.combatPreviousX,dy=target.pos.y-target.combatPreviousY;
    if(length<.1||!Number.isFinite(dx+dy)||Number(target.warpSeq||0)!==target.combatPreviousWarp||(dx*driveX+dy*driveY)/length<=.1)continue;
    const effect=R.buff(ctx,target,'slow',s.slowRate,s.durationFrames);
    R.state(target).trafficSlowUntil=effect.end;
   }
  });
 });
 const basicAttempt=R.basicAttempt;R.basicAttempt=(p,g,aim)=>{const result=basicAttempt(p,g,aim),s=R.state(p);removeStealth(p);if(p.ability.id==='emoji-127'){const kick=s.buffs.find(b=>b.kind==='rollerKick'&&b.end>now(g));if(kick){result.kickPush=kick.value;s.buffs.splice(s.buffs.indexOf(kick),1);}}const charge=s.buffs.find(b=>b.kind==='pandaNextBasic'&&b.end>now(g));if(charge){result.mult*=charge.value;s.buffs=s.buffs.filter(b=>b.kind!=='pandaNextBasic');}return result;};
 const onHpDamage=R.onHpDamage;R.onHpDamage=(p,attacker,actual,...args)=>{if(actual>0||p._lastDamageResult?.shieldAbsorbed>0)removeStealth(p);return onHpDamage(p,attacker,actual,...args);};
 const cast=R.cast;R.cast=(p,...args)=>{const prior=R.state(p).jokerStealth,result=cast(p,...args);if(result&&prior&&R.state(p).jokerStealth===prior)removeStealth(p);return result;};
 const tick=R.tick;R.tick=g=>{tick(g);for(const p of g.participants){const s=p.rw;if(s?.jokerStealth&&(s.jokerStealth.end<=now(g)||s.jokerStealth.life!==R.life(p)||!p.alive))removeStealth(p);}};
 const cleanup=R.cleanup;R.cleanup=(p,g,reason)=>{removeStealth(p);return cleanup(p,g,reason);};
 const wirePlayer=R.wirePlayer;R.wirePlayer=(p,g)=>{const row=wirePlayer(p,g);if(['emoji-145','emoji-149'].includes(p.ability.id)&&R.state(p).buffs.some(b=>b.kind==='moveHaste'&&b.ctx.owner===p&&b.end>now(g)))row.roster10Move=true;return row;};
 const aimSpec=R.aimSpec;R.aimSpec=(ability,kind,radius,...args)=>{const spec=aimSpec(ability,kind,radius,...args);if(['emoji-141','emoji-143','emoji-144','emoji-147','emoji-150'].includes(ability.id)){spec.clipPath=true;spec.collisionRadius=ability.id==='emoji-144'?26:radius;spec.clipBodies=ability.id!=='emoji-144';spec.bodyPadding=ability.id==='emoji-141'?5:1;}if(ability.id==='emoji-142')spec.clipRope=true;return spec;};
 register(152,{label:'스포트라이트',kind:'spotlight',shape:'circle',radius:550,windupFrames:36,stunFrames:180,stunCap:216,cooldownFrames:1440,
  description:'0.6초 예고 후 자신 중심 반경 550 안의 모든 생존 적을 벽 너머에도 3초 기절시킵니다. 직접 피해 없음 · 제어 강화 상한 3.6초.',
  capabilities:caps({area:true,cc:true})},(c,s)=>{
  R.entity(c,'spotlight',{pos:c.owner.pos,radius:s.radius,duration:s.windupFrames,color:'#fde68a'},(ctx,e)=>{
   e.pos.x=c.owner.pos.x;e.pos.y=c.owner.pos.y;
   if(e.age!==s.windupFrames)return;
   for(const target of c.g.getNearbyParticipants(c.owner.pos,s.radius)){
    if(target.isClone||target.isReworkTurret||!R.hostile(c,target)||dist(c.owner.pos,target.pos)>s.radius)continue;
    const before=target.stunned||0;
    if(R.applyStun(c,target,s.stunFrames,s.stunCap)&&target.stunned>before)R.state(target).spotlightStart=c.g.frame;
   }
  });
 });
 register(153,{label:'반사',kind:'mirror',shape:'line',range:130,width:24,length:560,durationFrames:300,cooldownFrames:1320,
  description:'전방 130에 길이 560의 일자 장막을 5초 설치합니다. 앞면에 닿는 적의 비행탄을 한 번 되돌리고 원 발사자를 약하게 추적합니다. 이동·근접·광선·장판은 통과합니다.',
  capabilities:caps({})},(c,s)=>placeMirror(S,c,s));
 const movementUpdates = [
  ['emoji-020',1.296,1.55],['emoji-006',1.33488,1.48],
  ['emoji-139',1.00,1.18], ['emoji-028',1.14,1.27],
  ['emoji-007',1.20,1.30], ['emoji-132',1.296,1.38]
 ];
 for (const [id,oldSpeed,newSpeed] of movementUpdates) {
  const ability=S.EMOJI_DB.find(a=>a.id===id);
  ability.finalBaseSpeed=newSpeed;
  if(id!=='emoji-139')ability.walkFloorRatio=newSpeed/oldSpeed;
 }
 S.BR_ROSTER_VERSION='emoji86-v35';
}]];
