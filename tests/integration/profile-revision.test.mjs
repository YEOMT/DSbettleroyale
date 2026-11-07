import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createGameServer} from '../../apps/server/src/main.js';
import {getTeacherState,getVisibleState,getPrivateSelfState,getStaticState} from '../../packages/engine/src/index.js';
import {snapshotEncoder} from '../../apps/server/src/ws/snapshot.js';
import {ProfileCache} from '../../apps/client/src/net/profile-cache.js';
import {connect} from './client.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('real WS same-state total wire and parsing includes reliable first/change/recovery profiles; hydrated values remain exact',async t=>{
 const start=performance.now(),app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());
 const host=await(await connect(app)).host(),a=await(await connect(app)).join(host.room.code,'Synthetic A'),b=await(await connect(app)).join(host.room.code,'Synthetic B');
 await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await a.next('SNAPSHOT');const room=app.manager.rooms.get(host.room.code);room.safePaused=true;await sleep(20);
 const p=room.world.byId.get(a.session.playerId),member=room.members.get(p.remoteId),peer=member.peer,views=[];
 for(let n=0;n<240;n++){if(n===80)p.radius+=2;if(n===120)p.ability=room.world.byId.get(b.session.playerId).ability;if(n===180)p.lifeSeq++;p.pos.x+=.1;const teacher=getTeacherState(room.world),view=getVisibleState(room.world,p.remoteId,undefined,teacher);views.push({teacher,view});}
 const results=[];
 for(const revised of [false,true]){
  peer.profileState=null;a.messages=[];const before={bytes:a.receivedBytes,server:app.metrics.sentBytes,parse:a.parseMs,frames:a.parsedFrames},kinds={},cache=new ProfileCache();let checked=0;
  a.onMessage=m=>{kinds[m.type]=(kinds[m.type]||0)+1;if(m.type==='PROFILE_STATE')cache.accept(m,m.payload,p.remoteId);const row=m.type==='SNAPSHOT'?m.payload.self:m.type==='PRIVATE_STATE'?m.payload:null;if(!row)return;
   const expected=views[row.probeIndex].view.self,actual=revised?cache.hydrate(m,row,p.remoteId):row;assert.ok(actual);const {profileRevision,probeIndex,...plain}=actual;assert.deepEqual(plain,expected);checked++;};
  const at=performance.now();for(let n=0;n<views.length;n++){
   const {teacher,view}=views[n],self={...view.self,probeIndex:n};peer.beginBatch();const row=revised?peer.selfState(self,{force:n===200}):self;
   if(n%10===0)peer.send('PRIVATE_STATE',row);peer.snapshot(snapshotEncoder(teacher,10000+n,123.4)({...view,self:row},peer.scope()));peer.endBatch();await a.next('SNAPSHOT',s=>s.snapshotSeq===10000+n);
  }
  const result={mode:revised?'revision':'baseline-full',snapshots:240,checked,elapsedMs:performance.now()-at,clientReceivedBytes:a.receivedBytes-before.bytes,serverSentBytes:app.metrics.sentBytes-before.server,clientParseMs:a.parseMs-before.parse,parsedFrames:a.parsedFrames-before.frames,kinds};
  assert.equal(checked,264);assert.equal(kinds.SNAPSHOT,240);assert.equal(kinds.PRIVATE_STATE,24);if(revised)assert.ok(kinds.PROFILE_STATE>=4&&kinds.PROFILE_STATE<=5,'initial, actual changes, life and explicit recovery only');results.push(result);a.onMessage=null;
 }
 assert.ok(results[1].clientReceivedBytes<results[0].clientReceivedBytes);assert.ok(results[1].serverSentBytes<results[0].serverSentBytes);
 fs.mkdirSync('artifacts/runtime-performance',{recursive:true});fs.writeFileSync('artifacts/runtime-performance/profile-wire.json',JSON.stringify({status:'PASS',method:'Real TCP WebSocket same 240 state pairs, 24 private responses, reliable profile initialization/value changes/life/recovery included. Parse time measured around existing receiver JSON.parse, not renderer cost. No stopped-vs-active byte comparison.',results,elapsedMs:performance.now()-start},null,2)+'\n');
});
test('real RESYNC and socket RESUME restore current profiles before FULL_STATE without repeated private responses',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());const host=await(await connect(app)).host();let a=await(await connect(app)).join(host.room.code,'Synthetic A');await(await connect(app)).join(host.room.code,'Synthetic B');
 await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');await host.command('START_BATTLE');await a.next('SNAPSHOT');const room=app.manager.rooms.get(host.room.code);room.safePaused=true;
 const token=a.session.token,id=a.session.playerId;let priorEpoch=a.scope.connectionEpoch;
 for(const restore of ['RESYNC','RESUME']){
  if(restore==='RESUME'){await a.close();a=await connect(app);a.send('RESUME',{token,cursor:0},false);}else{a.messages=[];a.send('RESYNC',{});}
  const profile=await a.next('PROFILE_STATE'),full=await a.next('FULL_STATE');assert.equal(full.payload.self.aimProfiles,undefined);assert.equal(full.payload.self.visualProfiles,undefined);assert.equal(profile.payload.profileRevision,full.payload.self.profileRevision);assert.equal(profile.payload.id,id);assert.ok(profile.eventSeq);assert.equal(profile.connectionEpoch,full.connectionEpoch);
  const cache=new ProfileCache();assert.ok(cache.accept(profile,profile.payload,id));const hydrated=cache.hydrate(full,full.payload.self,id),exact=getPrivateSelfState(room.world,id,undefined,true);const {profileRevision,...plain}=hydrated;assert.deepEqual(plain,exact);
  if(restore==='RESUME')assert.ok(a.scope.connectionEpoch>priorEpoch);
 }
});
