// Keep the small-patch path in targeted.mjs. Larger sets retain exactly the
// same balanced Canvas/Pixi real-browser checks, with their own runner budget.
export function characterShards(ids){
 if(ids.length<=4)return [];
 const shards=[];
 for(const renderer of ['canvas','pixi'])for(let i=0;i<ids.length;i+=4){
  const group=ids.slice(i,i+4);shards.push({key:renderer+'-'+i/4,renderer,ids:group.join(',')});
 }
 return shards;
}
export function verifyCharacterShard(shard,report){
 const expected=shard.ids.split(','),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(!same(report.renderers,[shard.renderer])||!same(report.qualities,['balanced'])||
    !same([...report.characters].sort(),[...expected].sort())||report.expectedCases!==expected.length||
    !same(report.cases.map(row=>row.id).sort(),[...expected].sort())||
    !report.cases.every(row=>row.renderer===shard.renderer&&row.quality==='balanced'&&row.status==='PASS'&&
      row.finitePositions&&row.rwStatusRaster==='PASS'&&row.frames>=12&&same(row.actions,['attack','skill'])))
  throw Error('INCOMPLETE_CHARACTER_SHARD '+shard.key);
 return {command:'tests/fidelity-v33-2/all77.mjs '+shard.renderer+' balanced',characters:expected,ms:report.ms,status:'PASS'};
}
