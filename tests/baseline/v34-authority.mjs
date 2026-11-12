// Explicit release deltas against the immutable legacy and main-790fb11 fixtures.
// Clone the historical expectations so every unlisted key stays checked.
const speeds={'emoji-139':[1,1.18],'emoji-028':[1.14,1.27],'emoji-007':[1.20,1.30],'emoji-132':[1.296,1.38]};
export function currentExpected(row, definition){
 const result=structuredClone(row),id=result.id, pair=speeds[id];
 if(definition)result.definition=structuredClone(definition);
 if(pair){
  result.speed=pair[1];
  result.ability.finalBaseSpeed=pair[1];
  if(id!=='emoji-139')result.ability.walkFloorRatio=pair[1]/pair[0];
 }
 for(const s of [result.skill,result.definition?.skill]){
  if(!s)continue;
  if(id==='emoji-132')s.damage=10;
  if(id==='emoji-036')s.turnRate=.048;
  if(id==='emoji-085')s.turnRate=.046;
  if(id==='emoji-127')Object.assign(s,{kickWindow:120,kickPush:1.45});
  if(id==='emoji-147')Object.assign(s,{extraUses:1,recastWindow:180});
  if(id==='emoji-131')Object.assign(s,{extraUses:2,recastWindow:180,recastDamage:[.60,.45]});
 }
 if(id==='emoji-085'){
  result.basic.homingTurnRate=.040;
  if(result.definition)result.definition.basic.homingTurnRate=.040;
 }
 const v35speeds={'emoji-006':[1.33488,1.48],'emoji-020':[1.296,1.55]};
 if(v35speeds[id]){
  const [old,current]=v35speeds[id];result.speed=result.ability.finalBaseSpeed=current;result.ability.walkFloorRatio=current/old;
 }
 if(id==='emoji-002'){result.speed=2.08;if(result.definition)result.definition.stats.speed=2.08;}
 const changes={'emoji-000':{zoneDamage:12.6},'emoji-002':{cooldown:840,cooldownFrames:840,width:46},
  'emoji-004':{cooldown:810,cooldownFrames:810},'emoji-006':{range:300,dashRange:300},
  'emoji-007':{zoneDamage:10.5},'emoji-010':{damage:10.815},'emoji-014':{damage:14.42},'emoji-025':{damage:110,knockback:70,wallDamage:26}};
 for(const skill of [result.skill,result.definition?.skill]){
  if(!skill)continue;
  if(changes[id])Object.assign(skill,changes[id]);
  if(id==='emoji-028'){
   Object.assign(skill,{kind:'iron-reflect',shape:'self',duration:300,durationFrames:300,radius:0,strength:'적 비행탄 반사',success:'탄이 몸에 닿을 때 방어',failure:'다른 피해에는 방어 효과 없음',counterplay:'근접·광선·장판으로 공격'});
   for(const k of ['damageReduction','reflectRatio','reflectRange'])delete skill[k];
   for(const cap of [skill.capabilities,skill.caps])Object.assign(cap,{damage:false,duration:false});
  }
 }
 if(changes[id]?.cooldown)result.timing.cooldown=changes[id].cooldown;
 return result;
}
