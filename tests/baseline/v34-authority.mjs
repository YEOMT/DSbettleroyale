// Explicit release deltas against the immutable legacy and main-790fb11 fixtures.
// Clone the historical expectations so every unlisted key stays checked.
const speeds={'emoji-139':[1,1.18],'emoji-028':[1.14,1.27],'emoji-007':[1.20,1.30],'emoji-132':[1.296,1.38]};
export function v34Expected(row, definition){
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
 return result;
}
