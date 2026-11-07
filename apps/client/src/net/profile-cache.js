// Hydration creates new self rows. Old Timeline snapshots retain their exact
// immutable profile values after growth; no later revision overwrites them.
export class ProfileCache{
 constructor(){this.clear();}
 clear(){this.scope='';this.values=new Map();}
 use(scope){const key=JSON.stringify([scope.roomInstanceId,scope.matchId,scope.connectionEpoch]);if(this.scope!==key){this.clear();this.scope=key;}}
 key(self){return JSON.stringify([self.id,self.lifeSeq,self.profileRevision]);}
 accept(scope,p,playerId){
  this.use(scope);
  if(!p||p.id!==playerId||!Number.isSafeInteger(p.lifeSeq)||!Number.isSafeInteger(p.profileRevision)||p.profileRevision<1||!p.aimProfiles||!p.visualProfiles)return false;
  const key=this.key(p);if(!this.values.has(key))this.values.set(key,{aimProfiles:p.aimProfiles,visualProfiles:p.visualProfiles});
  while(this.values.size>32)this.values.delete(this.values.keys().next().value);
  return true;
 }
 hydrate(scope,self,playerId){
  if(!self)return self;this.use(scope);
  if(self.id!==playerId)return null;
  const profiles=this.values.get(this.key(self));
  return profiles?{...self,...profiles}:null;
 }
}
