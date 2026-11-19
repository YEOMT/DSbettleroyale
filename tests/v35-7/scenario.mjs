// Same legal five choices in baseline/candidate. No artificial III+III build.
export const builds357={
 'emoji-003':['quick','expansion'], 'emoji-025':['heavy','rapid'],
 'emoji-121':['impact','wide'], 'emoji-014':['signature_duration','quick'],
 'emoji-056':['regen','titan'], 'emoji-142':['signature_range','swift'],
 'emoji-042':['control','expansion'], 'emoji-007':['amplify','quick'],
 'emoji-139':['swift','regen'], 'emoji-039':['expansion','quick'],
 'emoji-137':['heavy','rapid'], 'emoji-012':['signature_duration','quick']
};
export const focus357=Object.keys(builds357);
export function prepare357(w,p,i){
 const [primary,secondary]=builds357[p.ability.id]||[];
 if(!primary||![primary,secondary].every(id=>w.brRunEligible(p,id)))throw Error('INVALID_357_BUILD '+p.ability.id);
 p.run.level=6;p.run.choices=0;p.run.pending=5;
 for(const id of [secondary,secondary,primary,primary]){
  p.run.offer={id:'357-'+i+'-'+p.run.choices,cards:[w.brRunCard(p,id,(p.run.paths[id]||0)+1)]};
  if(!w.brChooseRun(p,p.run.offer.id,id))throw Error('357_CHOICE_REJECTED '+p.ability.id+' '+id);
 }
 const others=Object.keys(w.BR_RUN_PATHS).filter(id=>id!==primary&&w.brRunEffectiveNext(p,id)).slice(0,2);
 p.run.offer={id:'357-final-'+i,level:6,cards:[primary,...others].map(id=>w.brRunCard(p,id,(p.run.paths[id]||0)+1))};
 if(p.run.offer.cards.length!==3)throw Error('357_OFFER_SIZE');
 p.run.revision++;
}
export function finish357(w){
 const rows=w.game.participants.map(p=>{
  const [primary]=builds357[p.ability.id];
  if(p.run.choices<5&&!w.brChooseRun(p,p.run.offer.id,primary))throw Error('357_FINAL_CHOICE_REJECTED');
  if(p.run.choices!==5||Object.values(p.run.paths).reduce((a,b)=>a+b)!==5)throw Error('357_ILLEGAL_BUILD');
  return {ability:p.ability.id,paths:{...p.run.paths},mods:{...p.run.mods},card:w.brRunCard(p,primary,3),choices:p.run.choices};
 });return {accepted:rows.length,fx:0,builds:rows};
}
