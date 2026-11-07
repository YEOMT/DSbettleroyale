import test from 'node:test';import assert from 'node:assert/strict';
import {Peer} from '../../apps/server/src/ws/peer.js';
import {Metrics} from '../../apps/server/src/diagnostics/metrics.js';
import {ProfileCache} from '../../apps/client/src/net/profile-cache.js';
import {createWorld,getPrivateSelfState,applyCommand,destroyWorld} from '../../packages/engine/src/index.js';
function fixture(){const sent=[],socket={readyState:1,bufferedAmount:0,send:data=>sent.push(JSON.parse(data)),close(){this.readyState=3;}};const peer=new Peer(socket,{bufferWarn:65536,bufferHard:262144,bufferTimeoutMs:1000},new Metrics());peer.room={id:'room',matchId:'match'};peer.member={id:'p',epoch:1,cursor:0,events:[],eventBytes:0};return {peer,sent,socket};}
test('reliable revisions survive replaced snapshots and equal regenerated profiles do not retransmit',()=>{
 const {peer,sent,socket}=fixture(),self={id:'p',lifeSeq:0,aimProfiles:{attack:{range:600}},visualProfiles:{attack:{radius:12}}};socket.bufferedAmount=65536;
 const first=peer.selfState(self);assert.equal(first.profileRevision,1);assert.equal(first.aimProfiles,undefined);
 for(let i=0;i<200;i++){const row=peer.selfState({...self,aimProfiles:structuredClone(self.aimProfiles),visualProfiles:structuredClone(self.visualProfiles),x:i});assert.equal(row.profileRevision,1);peer.snapshot(JSON.stringify({type:'SNAPSHOT',payload:{self:row}}));}
 assert.equal(peer.queue.length,1);assert.equal(peer.member.events.length,1);socket.bufferedAmount=0;peer.flush();assert.deepEqual(sent.map(m=>m.type),['PROFILE_STATE','SNAPSHOT']);assert.equal(sent[1].payload.self.x,199);
 const newer={...self,aimProfiles:{attack:{range:700}}};assert.equal(peer.selfState(newer).profileRevision,2);assert.equal(sent.at(-1).type,'PROFILE_STATE');
 assert.equal(peer.selfState(newer,{force:true}).profileRevision,2);assert.equal(sent.filter(m=>m.type==='PROFILE_STATE').length,3);
 assert.equal(peer.selfState({...newer,lifeSeq:1}).profileRevision,3);peer.member.epoch++;assert.equal(peer.selfState({...newer,lifeSeq:1}).profileRevision,4);
 peer.room.matchId='next';assert.equal(peer.selfState({...newer,lifeSeq:1}).profileRevision,5);peer.close(1000,'done');assert.equal(peer.profileState,null);
});
test('growth, augment, radius, ability and life invalidation preserve exact authoritative profiles',()=>{
 const {peer,sent}=fixture(),w=createWorld(undefined,{mode:'solo'},'profile-regression',[{id:'p',name:'Synthetic',abilityId:'emoji-003'},{id:'q',name:'Other',abilityId:'emoji-141'}]);
 try{const p=w.byId.get('p'),cache=new ProfileCache();let prior,changed=0;
  const check=()=>{const exact=getPrivateSelfState(w,'p'),row=peer.selfState(exact);for(const m of sent.splice(0))cache.accept(m,m.payload,'p');const hydrated=cache.hydrate(peer.scope(),row,'p');assert.deepEqual(hydrated,{...exact,profileRevision:row.profileRevision});if(prior&&row.profileRevision!==prior.profileRevision)changed++;const old=prior;prior=hydrated;return old;};
  check();p.pos.x+=10;p.hp--;p.run.revision++;check();assert.equal(prior.profileRevision,1,'unrelated revision does not transmit equal profiles');
  p.radius+=2;const old=check();assert.notDeepEqual(old.aimProfiles,prior.aimProfiles);const saved=structuredClone(old);
  w.brProgression.awardXP(p,20,0);while(p.run.offer)applyCommand(w,{type:'AUGMENT_CHOOSE',playerId:'p',lifeSeq:p.lifeSeq,offerId:p.run.offer.id,augmentId:p.run.offer.cards[0].id});check();
  p.ability=w.byId.get('q').ability;check();p.lifeSeq++;check();assert.ok(changed>=3);assert.deepEqual(old,saved,'historical self keeps old profiles');
 }finally{destroyWorld(w);}
});
test('client cache rejects wrong scope/life/student and stays bounded without mutating historical references',()=>{
 const c=new ProfileCache(),scope={roomInstanceId:'r',matchId:'m',connectionEpoch:1};const profile=n=>({id:'p',lifeSeq:1,profileRevision:n,aimProfiles:{range:n},visualProfiles:{radius:n}});
 c.accept(scope,profile(1),'p');const old=c.hydrate(scope,profile(1),'p');for(let n=2;n<=100;n++)c.accept(scope,profile(n),'p');assert.equal(c.values.size,32);assert.equal(old.aimProfiles.range,1);
 assert.equal(c.hydrate(scope,{id:'p',lifeSeq:2,profileRevision:100},'p'),null);assert.equal(c.accept(scope,profile(101),'other'),false);
 for(const next of [{...scope,matchId:'new'},{...scope,connectionEpoch:2},{...scope,roomInstanceId:'other'}])assert.equal(c.hydrate(next,profile(100),'p'),null);
});
test('unknown profile revision requests bounded recovery, rejects actions, ignores stale scopes then restores',async()=>{
 const prior=globalThis.sessionStorage;globalThis.sessionStorage={getItem:()=>null,setItem(){}};
 try{const {Connection}=await import('../../apps/client/src/net/connection.js'),net=new Connection('ws://test'),sent=[],snapshots=[];net.send=(type,payload)=>sent.push({type,payload});net.scope={roomInstanceId:'r',matchId:'m',connectionEpoch:2};net.session={playerId:'p',role:'student'};net.addEventListener('snapshot',e=>snapshots.push(e.detail));
  let cancelled;net.pending.set('in-flight',{type:'ACTION',timer:setTimeout(()=>assert.fail('stale retry'),5000),reject:e=>cancelled=e.message});
  const self={id:'p',lifeSeq:1,profileRevision:9},snapshot={type:'SNAPSHOT',...net.scope,payload:{self,serverTick:1}};for(let i=0;i<100;i++)net.receive(snapshot);
  assert.equal(cancelled,'PROFILE_RECOVERY');assert.equal(net.pending.size,0);
  assert.equal(sent.length,1);assert.equal(sent[0].type,'RESYNC');assert.equal(snapshots.length,0);assert.equal(net.profilesReady,false);await assert.rejects(net.command('ACTION',{}),/PROFILE_RECOVERY/);
  const profile={type:'PROFILE_STATE',...net.scope,eventSeq:1,payload:{...self,aimProfiles:{range:600},visualProfiles:{radius:12}}};net.receive({...profile,connectionEpoch:1});net.receive(snapshot);assert.equal(snapshots.length,0);
  net.receive(profile);net.receive(snapshot);assert.equal(net.profilesReady,true);assert.equal(snapshots[0].self.aimProfiles.range,600);assert.equal(sent.length,1);
 }finally{globalThis.sessionStorage=prior;}
});
