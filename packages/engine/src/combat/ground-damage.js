// Explicit active residual-ground paths, after the v35 final overrides.
export const GROUND_DAMAGE=Object.freeze({multiplier:1.10,
 rework:Object.freeze({'emoji-000':['fire','zoneDamage'],'emoji-007':['radiation','zoneDamage'],'emoji-010':['gravity','damage'],'emoji-014':['poison','damage'],'emoji-122':['thorns','thornDamage'],'emoji-144':['poison','poisonDamage']}),
 native:Object.freeze(['emoji-031','emoji-128'])});
export function applyGroundDamage(scope){
 for(const [id,[,field]]of Object.entries(GROUND_DAMAGE.rework)){
  const skill=scope.BRRework.defs[id].skill;skill[field]*=GROUND_DAMAGE.multiplier;
 }
}
export const nativeGroundMultiplier=(id,type)=>type==='dmg'&&GROUND_DAMAGE.native.includes(id)?GROUND_DAMAGE.multiplier:1;
export const originalGroundFarmDamage=(id,kind,damage)=>GROUND_DAMAGE.rework[id]?.[0]===kind?damage/GROUND_DAMAGE.multiplier:damage;
