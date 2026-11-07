import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {createWorld,getTeacherState,getVisibleState,applyCommand,destroyWorld} from '../../packages/engine/src/index.js';

test('profile reuse keeps live movement, private scope, growth, death and new-world snapshots exact',()=>{
 for(const mode of ['solo','team-capture'])for(const abilityId of ['emoji-141','emoji-142','emoji-143','emoji-144']){
  for(let round=0;round<2;round++){
   const w=createWorld(undefined,{mode,teamCount:2},'profile-'+round,[{id:'a',name:'한글🙂',abilityId,team:1},{id:'b',name:'Other',abilityId:'emoji-003',team:2}]);
   try{
    const p=w.byId.get('a');let prior;
    for(let n=0;n<6;n++){
     if(n===2){w.brProgression.awardXP(p,20,0);while(p.run.offer)applyCommand(w,{type:'AUGMENT_CHOOSE',playerId:'a',lifeSeq:p.lifeSeq,offerId:p.run.offer.id,augmentId:p.run.offer.cards[0].id});}
     if(n===3){p.alive=false;p.hp=0;}if(n===4){p.lifeSeq++;p.alive=true;p.hp=p.maxHp;}
     p.pos.x+=7;p.lastAppliedSeq=n;
     const teacher=getTeacherState(w),encode=snapshotEncoder(teacher,n,100+n),view=getVisibleState(w,'a',undefined,teacher),scope={roomInstanceId:'room-'+round,matchId:w.matchId,connectionEpoch:n+1};
     const actual=JSON.parse(encode(view,scope));assert.deepEqual(actual.payload,{...view,snapshotSeq:n,serverNow:100+n});assert.equal(actual.connectionEpoch,n+1);assert.equal(actual.payload.self.id,'a');assert.equal(actual.payload.self.lastAppliedSeq,n);
     if(n===1)assert.strictEqual(view.self.aimProfiles,prior);if(n===2)assert.notStrictEqual(view.self.aimProfiles,prior);prior=view.self.aimProfiles;
     const other=getVisibleState(w,'b',undefined,teacher);assert.deepEqual(JSON.parse(encode(other,{...scope,connectionEpoch:99})).payload,{...other,snapshotSeq:n,serverNow:100+n});
     assert.deepEqual(JSON.parse(encode(teacher,scope)).payload,{...teacher,snapshotSeq:n,serverNow:100+n});
    }
   }finally{destroyWorld(w);}
  }
 }
});
