// Display-only descriptors from the unchanged v32.1 profiles. No client damage decisions.
export function visualProfiles(w,p){
 const a=p.ability,m=p.run.mods,color=w.BR_TIER_COLOR[a.t]||'#fff',b=w.brRunBasicProfile(a,m),spec=w.brAimSpec(a,'skill',p.radius,1,m),s=w.brReworkDefinition(a)?.skill;
 const attack={...b,radius:w.brBasicShotSize(a,true,m)*m.basicSize,color:a.pTrail||color,offset:.7,range:b.close?(p.radius+b.rangeBonus)*m.basicRange:b.range,step:w.brBasicStepDistance(a,m,1)};
 let skill={spec,color:s?.color||color,emoji:a.e,style:'skill',count:0,windup:Number(s?.windupFrames??s?.windup??0)};
 if(s&&['fireball','sequential-barrage','scissor-volley','sniper','shotgun','hunter-mark','power-shot','soda-bomb','heavy-book','precision','thorn-pot','bubble'].includes(s.kind))Object.assign(skill,{count:Math.min(s.countCap||1,(s.count||1)+Math.max(0,Math.min(3,m.skillCount))),interval:Number(s.intervalFrames??s.interval??0),spread:s.spread||0,speed:s.speed,radius:(s.kind==='fireball'?s.width/2:s.radius||s.width/2)*m.skillSize,finalRadius:s.finalRadius? s.finalRadius*m.skillSize:null,range:spec.range,offset:0});
 else if(!s&&w.brGetPlayableSkillInfo(a)?.key==='ranged-power'){const q=w.brRangedPowerProfile(a);Object.assign(skill,q,{count:w.brRunCount(1,m.skillCount),radius:q.size*m.skillSize,spread:.1,offset:.78});}
 else if(!s&&a.type===w.ABILITY_TYPES.PROJ&&a.sub!=='SNIPE'){const q=w.getPlayerSignatureProjectileProfile(a),count=w.brRunCount(q.count,m.skillCount);Object.assign(skill,q,{count,radius:q.size*(a.t==='S'?1.14:a.t==='A'?1.08:1)*m.skillSize,spread:a.sub==='NOVA'?Math.PI*2/count:q.spread||.1,radial:a.sub==='NOVA',range:spec.range,offset:0});}
 return {attack,skill,skillLabel:w.brGetPlayableSkillInfo(a)?.label||'스킬'};
}
