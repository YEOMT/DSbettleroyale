// v35.5's explicit allowlist, after legacy tuning and the v35.4 ground delta.
// No replacement engine, roster IDs or input path.
export const crayonColors=Object.freeze(['#ef4444','#38bdf8','#fde047','#4ade80']);
export const crayonDamage=Object.freeze([1.6,.85,.8,.8]);
export const CRAYON=Object.freeze({colors:crayonColors,colorDamage:crayonDamage,slowMultiplier:.75,slowFrames:90,stunFrames:21,dotDamage:4,dotFrames:120,dotInterval:30});
export function crayonContact(S,shot,target){
 const c=shot.crayon?.ctx,R=S.BRRework;
 if(!c||!R.validContext(c)||!R.hostile(c,target)||!R.visible(c,target,shot.pos)||
    !target._lastDamageResult?.valid||!(target._lastDamageResult.hpDamage+target._lastDamageResult.shieldAbsorbed))return;
 const color=shot.crayon.color;
 if(color===1)R.buff(c,target,'slow',CRAYON.slowMultiplier,CRAYON.slowFrames);
 if(color===2)R.applyStun(c,target,CRAYON.stunFrames,CRAYON.stunFrames*(c.run.control??1));
 if(color===3)R.dot(c,target,{kind:'crayon-green',damage:CRAYON.dotDamage,duration:CRAYON.dotFrames,tickEvery:CRAYON.dotInterval,maxStacks:1});
 c.g.emitStudentFx?.('impact',shot.pos,{size:color===0?32:24,color:crayonColors[color],style:'crayon-'+color,sourceId:c.ownerId,
  geometry:{confirmed:true,castId:c.castId,lifeSeq:c.ownerLifeSeq,targetLife:target.lifeSeq,displayMs:200}});
}
export function applyOverdrive(S){
 const R=S.BRRework,skill=id=>R.defs['emoji-'+id].skill;
 const pan=R.defs['emoji-092'],a=S.EMOJI_DB.find(x=>x.id==='emoji-092');
 a.type=S.ABILITY_TYPES.MELEE;a.category='근접형';delete a._basicIdentity;
 pan.role=pan.category='근접형';pan.statType='PROJ';
 // Changing melee eligibility must not silently alter the body/movement budget.
 pan.stats={...pan.stats,finalBaseHp:268.7895/1.06,speed:1.5,radius:39.9,rangedMovement:true};
 pan.basic={close:true,rangeBonus:100,halfAngle:1.1,cooldownScale:1,damageScale:1,pushScale:.25,stun:0,reward:'',style:'slash'};
 Object.assign(pan.skill,{kind:'pan-parry',label:'깡! 받아치기',shape:'cone',duration:72,durationFrames:72,halfAngle:Math.PI*2/3,range:90,radius:90,reflectRatio:0,reflectRange:0,
  strength:'첫 정면 접촉의 실제 반사/즉시 반격',success:'1.2초 안의 정면 유효 접촉',failure:'뒤쪽·장판·폭발·기절에는 패링 불가',counterplay:'뒷면이나 패링 종료 뒤 공격',
  description:'전방 240°를 1.2초간 패링 · 받는 피해 28% 감소 · 첫 비행탄은 실제 반사, 첫 근접 접촉은 즉시 반격 · 성공/기절/강제 이동 시 종료'});
 R.handlers[a.id]=c=>{
  R.world(c.g).parryUntil=Math.max(R.world(c.g).parryUntil||0,c.g.frame+R.duration(c,72));
  R.buff(c,c.owner,'damageReduction',.28,72);
  R.buff(c,c.owner,'panParry',1,72,{halfAngle:pan.skill.halfAngle});
  R.entity(c,'guard',{shape:'cone',radius:90,range:90,halfAngle:pan.skill.halfAngle,color:'#cbd5e1',duration:R.duration(c,72),followOwner:true},(ctx,e)=>{
   if(!R.state(ctx.owner).buffs.some(b=>b.kind==='panParry'&&b.ctx.castId===ctx.castId&&b.end>ctx.g.frame)){R.end(e,'consumed');return;}
   e.pos=R.copy(ctx.owner.pos);
  });
 };
 const apple=skill('075');
 Object.assign(apple,{kind:'apple-fragments',bounces:0,fragmentCount:8,fragmentDamage:8,fragmentRadius:10.5,fragmentRange:250,fragmentSpeed:24,fragmentDuration:12,fragmentTargetCap:2,
  strength:'벽 없이도 첫 접촉에서 파편 생성',success:'직접 명중과 최대 두 파편 접촉',failure:'파편 짧은 사거리·벽 차단',counterplay:'분열 위치에서 거리 벌리기',
  description:'사과 1발의 첫 적/벽/상자 접촉 또는 사거리 끝에서 8방향 파편 · 파편 피해 8, 같은 폭발은 대상당 최대 2개 · 파편 재분열 없음'});
 R.handlers['emoji-075']=c=>R.projectile(c,{...apple,duration:Math.ceil(apple.range/apple.speed)+90,onEnd(ctx,e,reason){
  if(e.splitDone||!['hit','wall','range'].includes(reason)||!R.validContext(ctx))return;e.splitDone=true;
  const hits=new Map(),rotation=(S.rand()-.5)*Math.PI/8;
  ctx.g.emitStudentFx?.('impact',e.pos,{size:36,color:apple.color,style:'apple-split',sourceId:ctx.ownerId,geometry:{confirmed:true,castId:ctx.castId,effectId:e.id+':split',displayMs:240}});
  for(let i=0;i<8;i++)R.projectile(ctx,{pos:R.copy(e.pos),dir:new S.Vec2(Math.cos(rotation+i*Math.PI/4),Math.sin(rotation+i*Math.PI/4)),speed:apple.fragmentSpeed,range:apple.fragmentRange,radius:apple.fragmentRadius,damage:apple.fragmentDamage,knockback:apple.knockback,bounces:0,color:apple.color,displayEmoji:'',emoji:null,style:'apple-fragment',
   beforeHit:(_c,p)=>(hits.get(R.pid(p)+':'+R.life(p))||0)<2,
   onHit:(_c,p,result)=>{if(result.valid){const key=R.pid(p)+':'+R.life(p);hits.set(key,(hits.get(key)||0)+1);}}
  });
 }});
 const goblin=R.defs['emoji-148'],oldGoblin=R.handlers['emoji-148'];
 goblin.skill.firstBasicStun=27;goblin.skill.description+=' · 활성 중 첫 유효 평타 한 명에게 0.45초 기절';
 R.handlers['emoji-148']=c=>{oldGoblin(c);R.buff({...c,run:{...c.run,duration:1}},c.owner,'goblinFirst',1,180);};
 goblin.onBasicHit=(c,target,result)=>{
  if(!(result.hpDamage+(result.shieldAbsorbed??result.absorbed??0)>0))return;
  const state=R.state(c.owner),b=state.buffs.find(b=>b.kind==='goblinFirst'&&b.end>c.g.frame&&R.validContext(b.ctx));
  if(!b||!R.hostile(b.ctx,target))return;
  state.buffs.splice(state.buffs.indexOf(b),1);R.applyStun(b.ctx,target,27,27);
  c.g.emitStudentFx?.('impact',target.pos,{size:36,color:'#fde047',style:'goblin-first',sourceId:c.ownerId,geometry:{confirmed:true,effectId:b.ctx.castId+':first',lifeSeq:c.ownerLifeSeq,displayMs:220}});
 };
 Object.assign(skill('121'),{range:335,width:300,knockback:42});
 skill('023').speed=105;skill('074').speed=55;
 Object.assign(skill('039'),{radius:245,innerRadius:105,flightFrames:42,duration:42,durationFrames:42});
 Object.assign(skill('072'),{blastRadius:255,damage:22});
 Object.assign(skill('122'),{blastRadius:100,thornRadius:145});
}
