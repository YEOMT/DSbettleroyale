// Test-only authority projection. Capture baselines from an immutable checkout,
// never from the candidate's generated manifest or UI labels alone.
import {mechanics,rosterMechanics} from '../../tools/ci/roster-scope.mjs';
export const recoveryIds=['003','007','014','142','034','063','087','139','056'].map(n=>'emoji-'+n);
export function runtimeProfiles(r){
 return Object.fromEntries(r.EMOJI_DB.map(a=>{
  const p=new r.Participant('profile','Synthetic',a,new r.Vec2(0,0));r.brInitRun(p);
  return [a.id,mechanics({id:a.id,tier:a.t,emoji:a.e,name:a.n,hp:p.maxHp,radius:p.radius,speed:p.speed,damageMult:p.damageMult,
   walk:r.brBaseWalkingSpeed(p),humanMove:r.brHumanMoveSpeed(p),basic:r.brBasicCombatProfile(a),skill:r.brGetPlayableSkillInfo(a),
   measured:r.brRunMeasured(p,p.run.mods),aim:r.brAimSpec(a,'skill',p.radius,1,p.run.mods),capabilities:p.run.capabilities,
   eligible:Object.keys(r.BR_RUN_PATHS).filter(id=>r.brRunEligible(p,id))})];
 }));
}
export function baselineProjection(r,manifest,contentHash){
 return {base:'e328aad252e243428123e3d576ea8ffefcdb8604',version:'35.5.0',contentHash,
  mechanics:rosterMechanics(manifest),runtime:runtimeProfiles(r),
  globals:mechanics(Object.fromEntries(Object.entries(manifest).filter(([key])=>!['roster','reworkDefinitions','rosterVersion'].includes(key))))};
}
