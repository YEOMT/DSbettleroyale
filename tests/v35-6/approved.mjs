import fs from 'node:fs';
// Reviewed v35.6 spec leaves only. This does not rewrite a historical fixture.
export const approved356=JSON.parse(fs.readFileSync(new URL('./approved-deltas.json',import.meta.url)));
export const runtime356=JSON.parse(fs.readFileSync(new URL('./approved-runtime-deltas.json',import.meta.url)));
export function expected356(row,deltas=approved356){
 const result=structuredClone(row);
 for(const delta of deltas){
  const [id,...keys]=delta.path.split('.');if(id!==row.id)continue;
  if(keys[0]==='definition'&&!result.definition)continue;
  let node=result;for(const key of keys.slice(0,-1))node=node[key]??={};
  node[keys.at(-1)]=structuredClone(delta.after);
 }return result;
}
export function prior356(row){
 const result=structuredClone(row);
 for(const delta of approved356){
  const [id,...keys]=delta.path.split('.');if(id!==row.id)continue;
  let node=result;for(const key of keys.slice(0,-1))node=node?.[key];if(!node)continue;
  if(Object.hasOwn(delta,'before'))node[keys.at(-1)]=structuredClone(delta.before);else delete node[keys.at(-1)];
 }return result;
}
export function normalize356Legacy(r){
 // Restore only the newly approved leaves for immutable historical trajectories.
 // Live final values/real casts are checked separately, never normalized to PASS.
 for(const delta of approved356){
  const [id,type,...keys]=delta.path.split('.');
  const node=type==='definition'?r.BRRework.defs[id]:type==='ability'?r.EMOJI_DB.find(a=>a.id===id):null;
  if(!node)continue;let parent=node;
  for(const key of keys.slice(0,-1)){parent=parent?.[key];if(!parent)break;}
  if(!parent)continue;
  if(Object.hasOwn(delta,'before'))parent[keys.at(-1)]=structuredClone(delta.before);else delete parent[keys.at(-1)];
 }
 r.BR_V29_ZOMBIE_WALK=2.74582224;
}
