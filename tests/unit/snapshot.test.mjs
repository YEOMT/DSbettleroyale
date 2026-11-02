import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
test('prepared snapshot serialization preserves exact JSON values and recipient privacy',()=>{
 const teacher={serverTick:8,simTime:133.333,actors:[{id:'a',name:'Quote"\\\n',x:1.23456789},{id:'hidden',name:'Secret',x:99}],shots:[{id:'s',x:3}],farm:{b:[[1,2,3]],x:[]},capture:null},view={...teacher,actors:[teacher.actors[0]],shots:[],self:{id:'a',hp:20,run:{offer:{id:'private'}}}},scope={roomInstanceId:'room',matchId:'match',connectionEpoch:2};
 const result=JSON.parse(snapshotEncoder(teacher,7,100)(view,scope));assert.deepEqual(result.payload,{...view,snapshotSeq:7,serverNow:100});assert.equal(result.matchId,'match');assert.equal(result.payload.actors.some(a=>a.id==='hidden'),false);
});
