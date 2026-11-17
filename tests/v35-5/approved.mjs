import fs from 'node:fs';
// Reviewed scalar additions/updates/deletions, independent of current runtime.
// Frozen historical files stay intact; every other leaf is still compared.
export const approved355=JSON.parse(fs.readFileSync(new URL('./approved-deltas.json',import.meta.url)));
export function expected355(row){
 const result=structuredClone(row);
 for(const delta of approved355){
  const [id,...keys]=delta.path.split('.');if(id!==row.id)continue;
  if(keys[0]==='definition'&&!result.definition)continue;
  let node=result;for(const key of keys.slice(0,-1))node=node[key]??={};
  if(Object.hasOwn(delta,'after'))node[keys.at(-1)]=structuredClone(delta.after);else delete node[keys.at(-1)];
 }
 return result;
}
