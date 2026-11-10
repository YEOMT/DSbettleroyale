// Presentation-only fields are excluded; identity, all numbers, timing, flags,
// caps and every other key remain part of the authority comparison.
const proseKeys=new Set(['concept','desc','description','basicSummary','skillSummary','skillLabel','skillDesc','label']);
export const retiredFor83=['emoji-048','emoji-065','emoji-073','emoji-076'];
export const reworkedFor83=['emoji-034','emoji-070'];
export function mechanics(value){return Array.isArray(value)?value.map(mechanics):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!proseKeys.has(key)).map(([key,v])=>[key,mechanics(v)])):value;}
export function rosterMechanics(content){return Object.fromEntries(content.roster.map(row=>[row.id,mechanics({...row,definition:content.reworkDefinitions[row.id]||null})]));}
export function sameMechanics(a,b){
 if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b)<=1e-10;
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();return ak.length===bk.length&&ak.every((k,i)=>k===bk[i]&&sameMechanics(a[k],b[k]));
}
export function parseManifest(source){const match=source.match(/export const manifest\s*=\s*([\s\S]*);\s*$/);if(!match)throw Error('BASE_MANIFEST_NOT_JSON');return JSON.parse(match[1]);}
// Narrow only this explicit 87 -> 83 text migration. Code references outside
// the bulk rules registry are retained even if their data is unchanged. This
// never changes Quick, combat, representative, network or load requirements.
export function reviewedMigrationScope(previous,current,explicitIds){
 const before=rosterMechanics(previous),after=rosterMechanics(current),removed=Object.keys(before).filter(id=>!after[id]).sort();
 if(previous.roster.length!==87||current.roster.length!==83||JSON.stringify(removed)!==JSON.stringify(retiredFor83)||Object.keys(after).some(id=>!before[id]))return null;
 const changed=Object.keys(after).filter(id=>!sameMechanics(after[id],before[id]));
 if(changed.some(id=>!reworkedFor83.includes(id)))return null;
 return {characters:[...new Set([...reworkedFor83,...explicitIds])].filter(id=>after[id]).sort(),preserved:81,changed,removed};
}
