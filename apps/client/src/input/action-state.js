// Presentation/request gating only. Authority still validates every intention.
export function actionState(self,kind,{enabled=true,restoring=false,connected=true,profilesReady=true,paused=false,now=0,lastFire=-Infinity,actionSeq=0}={}){
 const frames=Math.max(0,Number(kind==='attack'?self?.basicCooldown:self?.cooldown)||0);
 const max=Math.max(1,Number(kind==='attack'?self?.basicCooldownMax:self?.skillCooldownMax)||1);
 const rw=self?.rw,channel=kind==='skill'&&!!rw?.channel&&!!rw?.locks?.steerAllowed;
 let state='READY';
 if(!enabled||restoring||!connected||!profilesReady)state=paused?'PAUSED':'RECOVERY';
 else if(!self?.alive)state='DEAD';
 else if(self.stunned>0)state='STUNNED';
 else if(rw?.capture)state='CAPTURED';
 else if(channel)state='CHANNEL';
 else if(rw?.locks?.[kind])state='LOCKED';
 else if(kind==='skill'&&rw?.recast)state='RECAST';
 else if(frames>0)state='COOLDOWN';
 const confirmedRecast=state==='RECAST'&&actionSeq>0&&(self.actions?.firedSkill||0)>=actionSeq;
 if(['READY','RECAST'].includes(state)&&now-lastFire<100&&!confirmedRecast)state='REQUEST_GUARD';
 return {state,frames,max,canFire:state==='READY'||state==='RECAST',canAim:['READY','RECAST','COOLDOWN','REQUEST_GUARD','CHANNEL'].includes(state),channel:state==='CHANNEL'};
}
