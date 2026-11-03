export function selectCharacters(roster,requested){
 if(!requested)return roster;
 const ids=[...new Set(requested.split(','))];
 if(ids.some(id=>!roster.some(a=>a.id===id)))throw Error('UNKNOWN_CHANGED_CHARACTER');
 return roster.filter(a=>ids.includes(a.id));
}
