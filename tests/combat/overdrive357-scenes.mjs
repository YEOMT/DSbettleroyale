export const scenes=[['regen','139'],['expansion','003'],['signature_duration','014'],['signature_range','142'],['swift','056'],['amplify','007'],['quick','023'],['control','042'],['impact','025'],['heavy','137']];
// Independent jobs retain every tier, pose, guide, contact and cleanup check.
export const sceneGroups={first:scenes.slice(0,5),second:scenes.slice(5),all:scenes};
export function selectedScenes(group='all',paths){
 if(!Object.hasOwn(sceneGroups,group))throw Error('UNKNOWN_IDENTITY_GROUP');
 const rows=sceneGroups[group],selected=paths?.split(',')||rows.map(s=>s[0]);
 if(!selected.length||selected.some(p=>!rows.some(s=>s[0]===p)))throw Error('UNKNOWN_IDENTITY_PATH');
 return rows.filter(s=>selected.includes(s[0]));
}
