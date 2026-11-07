// Cancel only intentions that have not executed. Existing projectiles, cast
// entities, cooldowns and fired acknowledgements remain authoritative.
export function cancelCombatInputs(world){
 if(!world)return;
 world.inputPending.clear();world.actionPending.clear();world.lastInputAt.clear();
 for(const p of world.byId.values()){
  world.session.inputs[p.remoteId]={};p.inputNeutral=true;
  for(const kind of ['Attack','Skill']){
   const resolved='resolved'+kind+'Seq';
   p[resolved]=Math.max(p[resolved]||0,p['received'+kind+'Seq']||0,p['lastRemote'+kind]||0,p['pending'+kind]?.seq||0);
   p['pending'+kind]=null;
  }
 }
}
