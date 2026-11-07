// Private connection-scoped metadata uses the reliable queue, never the
// replaceable snapshot slot. Engine profiles are immutable cached values.
export function privateProfileState(peer,self,{force=false}={}){
 if(!self)return self;
 const {aimProfiles,visualProfiles,...changing}=self;
 if(!aimProfiles||!visualProfiles)return changing;
 const scope=peer.scope(),key=JSON.stringify([scope.roomInstanceId,scope.matchId,scope.connectionEpoch,self.id,self.lifeSeq]);
 let state=peer.profileState;
 const scoped=state?.key===key;
 if(!scoped||state.aim!==aimProfiles||state.visual!==visualProfiles){
  const json=JSON.stringify({aimProfiles,visualProfiles});
  const changed=!scoped||state.json!==json;
  state={key,aim:aimProfiles,visual:visualProfiles,json,revision:(state?.revision||0)+(changed?1:0)};
  peer.profileState=state;force||=changed;
 }
 if(force)peer.send('PROFILE_STATE',{id:self.id,lifeSeq:self.lifeSeq,profileRevision:state.revision,aimProfiles,visualProfiles},{reliable:true});
 return {...changing,profileRevision:state.revision};
}
