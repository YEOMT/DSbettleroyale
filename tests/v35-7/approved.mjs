// Explicit spec allowlist. Historical fixtures remain immutable.
export const tiers357={
 regen:['regenDelay',[210,150,60]],expansion:['skillSize',[1.45,1.85,2.5]],
 signature_duration:['signatureDuration',[1.3,1.55,2]],signature_range:['signatureRange',[1.25,1.45,2]],
 swift:['moveSpeed',[1.25,1.43,2]],amplify:['skillDamage',[1.44,1.825,2.5]],
 quick:['skillCooldown',[.725,.582,.3]],control:['skillControl',[1.4,1.8,2.25]],
 impact:['basicKnockback',[1.6,2.3,3.25]],heavy:['basicDamage',[1.55,2.1,3]]
};
export const melee357={impact:[2,2.9,4],heavy:[1.8,2.45,3.5]};
export function expectedPaths357(paths,format){
 const result=structuredClone(paths);
 for(const [id,[key,values]]of Object.entries(tiers357)){
  result[id].tiers.forEach((t,i)=>t[key]=values[i]);
  if(melee357[id])result[id].meleeTiers.forEach((t,i)=>t[key]=melee357[id][i]);
  result[id].text=result[id].tiers.map(t=>format(id,t));
 }return result;
}
// These native casts already stun in v35.6. Only their formerly absent preview
// is corrected; no unaugmented combat stat changes.
export const nativePreview357={'emoji-031':8,'emoji-040':17,'emoji-128':8,'emoji-024':12,'emoji-038':14,'emoji-112':26,'emoji-094':21,'emoji-052':8,'emoji-114':13};
export function expectedRuntime357(row){const result=structuredClone(row);if(nativePreview357[row.id])result.measured.stunFrames=nativePreview357[row.id];return result;}

