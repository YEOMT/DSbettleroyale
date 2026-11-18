// v35.6's nine approved final values, after legacy/rework/ground/Overdrive tuning.
// Existing handlers retain their damage, counts, collision and lifecycle rules.
export function applyRecovery356(S){
 const R=S.BRRework,def=id=>R.defs['emoji-'+id],ability=id=>S.EMOJI_DB.find(a=>a.id==='emoji-'+id);
 const cooldown=(id,ticks)=>Object.assign(def(id).skill,{cooldown:ticks,cooldownFrames:ticks});
 for(const [id,hp]of [['007',500],['142',475],['034',360],['063',360],['087',340],['056',240]])
  def(id).stats={...def(id).stats,finalBaseHp:hp};
 // Raising a stat below the walking floor must also raise its existing floor
 // proportion; otherwise Fallout/Mountain would display a buff but walk slowly.
 for(const [id,speed,floorRatio]of [['007',1.40,1.40/1.20],['142',1.48,1.48/1.296],['056',1.70,1]])
  Object.assign(ability(id),{finalBaseSpeed:speed,...(floorRatio!==1?{walkFloorRatio:floorRatio}:{})});
 // Zombie's approved 3.20 is actual steady travel, not the pre-filter drive.
 // Compensate only this kit for the existing .78 response/.92 velocity decay;
 // prediction receives the same drive via snapshot.moveSpeed, with no filter change.
 Object.assign(ability('139'),{finalBaseSpeed:1.37,walkDriveScale:(1-.22*.92)/.78});
 cooldown('003',990);Object.assign(def('003').skill,{width:54,finalRadius:35});
 def('007').skill.zoneRadius=290;
 Object.assign(def('014').skill,{radius:160,maxRadius:380,growFrames:90});
 cooldown('142',450);def('142').skill.pullSpeed=38;
 cooldown('034',720); // Damage21, radius36, push42 and one-contact piercing remain unchanged.
 Object.assign(def('063').skill,{range:720,spread:.125});
 cooldown('087',570);Object.assign(def('087').skill,{radius:12,speed:42,markDuration:300});
 Object.assign(def('056').skill,{radius:34,speed:10,turnRate:.035});
}
