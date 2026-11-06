// A corpse is already invisible after its 750ms display fade. Keep another
// 250ms of snapshot/interpolation margin, then retire only that public body.
// The participant, private self/respawn data and all owned attacks stay alive.
const retired=new WeakMap();
export function presentationState(world,teacher){
 let deaths=retired.get(world);if(!deaths){deaths=new Map();retired.set(world,deaths);}
 const frame=world.game.frame,keep=new Set();
 for(const p of world.game.participants){
  const id=p.remoteId;if(!id)continue;
  if(p.alive){deaths.delete(id);keep.add(id);continue;}
  let entry=deaths.get(id);if(!entry||entry.life!==p.lifeSeq){entry={life:p.lifeSeq,until:(Number.isFinite(p.deathFrame)?p.deathFrame:frame)+60};deaths.set(id,entry);}
  if(frame<=entry.until)keep.add(id);
 }
 for(const id of deaths.keys())if(!world.byId.has(id))deaths.delete(id);
 return {...teacher,actors:teacher.actors.filter(a=>!a.id||keep.has(a.id))};
}
