import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';

test('farm tuple encoding preserves selected rows, order, UTF-8, fields and private scopes',()=>{
 const boxes=[[7,0,1.234567891,70,'한글🙂"\\',48],[9,2000,-2,10,'heal',32]],xp=[[11,3,4,1,'source']];
 const farm={r:4,b:boxes,x:xp,s:[1,2,0],c:[3,4,1,'haste'],future:{value:1},omitted:undefined};
 const teacher={serverTick:7,actors:[],shots:[],farm},encode=snapshotEncoder(teacher,3,10);
 for(const [b,x] of [[boxes,xp],[[boxes[1]],[]],[[],xp],[[boxes[1],boxes[0]],xp]]){
  const view={...teacher,farm:{...farm,b,x},self:{id:'synthetic',private:'scope'}},scope={connectionEpoch:2,matchId:'one'};
  const encoded=encode(view,scope);
  const expected={type:'SNAPSHOT',protocolVersion:33,...scope,payload:{serverTick:7,snapshotSeq:3,serverNow:10,actors:[],shots:[],farm:view.farm,self:view.self}};
  assert.equal(encoded.toString(),JSON.stringify(expected),'exact bytes, including filtered/empty/reordered selections');
 }
});

test('shared farm tuples serialize once per snapshot and changes never reuse a previous frame',()=>{
 let calls=0;const row=[1,10,20,100,'xp',48];Object.defineProperty(row,'toJSON',{value(){calls++;return Array.from(this);}});
 const teacher={actors:[],shots:[],farm:{r:1,b:[row],x:[]}};
 for(let snapshot=0;snapshot<5;snapshot++){
  row[3]=100-snapshot;teacher.farm.r=snapshot;
  const encode=snapshotEncoder(teacher,snapshot,50*snapshot),before=calls;
  for(let student=0;student<30;student++){
   const view={...teacher,farm:{...teacher.farm,b:[row]},self:{id:'synthetic-'+student,lifeSeq:snapshot}};
   const message=JSON.parse(encode(view,{matchId:'round-'+snapshot,connectionEpoch:snapshot+1}));
   assert.equal(message.payload.farm.b[0][3],100-snapshot);assert.equal(message.payload.farm.r,snapshot);
   assert.equal(message.payload.self.lifeSeq,snapshot);assert.equal(message.connectionEpoch,snapshot+1);
  }
  assert.equal(calls-before,1,'one serialization instead of 30 repeated tuples');
 }
});

test('farm fallback values follow JSON omission, null and sparse-array semantics',()=>{
 const farm={r:NaN,b:[,null,undefined,[1,Infinity,NaN,'"\\🙂']],x:[],empty:null,absent:undefined,extra:{v:null}};
 const teacher={actors:[],shots:[],farm},raw=snapshotEncoder(teacher,1,0)(teacher,{});
 assert.equal(raw.toString(),JSON.stringify({type:'SNAPSHOT',protocolVersion:33,payload:{snapshotSeq:1,serverNow:0,actors:[],shots:[],farm}}));
});
