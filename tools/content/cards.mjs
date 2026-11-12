import {sniperChance} from '../../packages/engine/src/combat/reflection.js';
// Build player-facing prose from the same final profiles used by the authority.
// Facts are neutral Lv1 values; damage coefficients precede defence/run modifiers.
const number=n=>String(Math.round(Number(n)*1000)/1000),seconds=n=>number(n/60)+'초';
const skillPaths=['quick','amplify','expansion','multicast','control','restore','signature_range','signature_duration'];
const pathLabels={quick:'대기 단축',amplify:'위력',expansion:'범위',multicast:'개수',control:'제어',restore:'회복·보호',signature_range:'고유 사거리',signature_duration:'고유 지속'};
export function currentCard(r,a){
 const d=r.BRRework.defs[a.id],p=new r.Participant(1,a.n,a,new r.Vec2(0,0));r.brInitRun(p);
 const b=r.brProgressionCombat.basicProfile(a),s=d?.skill,playable=r.brGetPlayableSkillInfo(a),m=r.brRunMeasured(p,p.run.mods),tags=[];
 if(!b.close){tags.push(b.count+'발');if(b.type==='BOOMERANG')tags.push('왕복');if(b.type==='missile')tags.push('유도');if(b.pierce)tags.push('관통');if(b.bounces)tags.push('벽 반사 '+b.bounces+'회');if(b.explode)tags.push('작은 폭발');if(b.status==='poison')tags.push('중독');}
 if(b.lifesteal)tags.push('실제 HP 피해의 '+number(b.lifesteal*100)+'% 흡혈');
 if(b.reward==='guard')tags.push('적중 시 짧은 피해 감소');
 if(a.id==='emoji-070')tags.push('몸 중심 명중 피해 ×1.5');
 const eligible=Object.keys(r.brProgression.catalog).filter(id=>r.brProgression.eligible(p,id));
 const skillAugments=skillPaths.filter(id=>eligible.includes(id));
 const baseCooldown=s?.cooldownFrames??s?.cooldown??playable?.cooldown??p.maxCooldown;
 // Native trail dash / global medic retain their actual existing 0.9~1.1 jitter.
 const cooldown=playable||s?seconds(baseCooldown):seconds(Math.round(baseCooldown*.9))+'~'+seconds(Math.round(baseCooldown*1.1));
 const text=s?.description||a.skillDesc;if(!text||/고유 스킬/.test(text))throw Error('MISSING_CURRENT_SKILL_TEXT '+a.id);
 const facts={level:1,damageUnits:'base coefficient before rank/run/defence modifiers',basic:{close:b.close,count:b.close?1:b.count,range:m.basicRange,intervalFrames:m.basicFrames,coefficient:m.basicDamage},skill:{kind:s?.kind||playable?.key||a.sub,aimRange:m.skillRange,cooldownFrames:baseCooldown,cooldownJitter:!(playable||s),durationFrames:s?.durationFrames??s?.duration??null,damageCoefficient:s?.damage??null,...(s?.finalDamage!=null?{finalDamageCoefficient:s.finalDamage}:{})},eligibleAugments:eligible};
 if(sniperChance(a))Object.assign(facts.skill,{criticalChance:sniperChance(a),criticalDamage:2});
 if(s?.kind==='mirror')Object.assign(facts.skill,{length:s.length,width:s.width,frontOnly:true});
 if(s?.kind==='spotlight')Object.assign(facts.skill,{radius:s.radius,windupFrames:s.windupFrames,stunFrames:s.stunFrames,stunCap:s.stunCap});
 const reach=m.skillRange>0?'최대 조준 거리 '+number(m.skillRange):!s&&a.teamOnly&&r.brSupportProfile(a).global?'전장 전체':'자기 중심';
 return {basic:a.basicSummary+(tags.length?' · '+tags.join(' · '):''),skill:text+' · '+reach+' · 대기 '+cooldown,
  passive:'스킬 증강: '+(skillAugments.map(k=>pathLabels[k]).join(' · ')||'별도 강화 없음'),cooldown,label:s?.label||a.skillLabel||a.n,category:d?.category||d?.role||a.category||'기타',concept:a.concept,facts};
}
