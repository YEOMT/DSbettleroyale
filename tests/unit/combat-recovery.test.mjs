import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,stepWorld,applyCommand,getPrivateSelfState,getTeacherState,destroyWorld} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {aimGuide} from '../../apps/client/src/render/aim-guide.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
const world=()=>createWorld(undefined,{},'combat-contract',[{id:'one',name:'One',abilityId:'emoji-024'},{id:'two',name:'Two',abilityId:'emoji-003'}]);
test('every roster attack and skill has finite aim geometry at three powers from actual authority profiles',()=>{
 const w=world(),p=w.byId.get('one');try{
  for(const row of manifest.roster){
   p.ability=w.EMOJI_DB.find(a=>a.id===row.id);p.aimProfileKey=null;
   const actor=getPrivateSelfState(w,p.remoteId);
   for(const kind of ['attack','skill'])for(const power of [.18,.59,1]){
    const g=aimGuide(actor,kind,{aim:{x:1,y:0},power},null),actual=w.brAimSpec(p.ability,kind,p.radius,power,p.run.mods);
    assert.ok(g&&Number.isFinite(g.range)&&Number.isFinite(g.x)&&Number.isFinite(g.y),row.id+' '+kind);
    assert.ok(['line','cone','rect','circle','circleDir','target','dash'].includes(g.shape),row.id+' unsupported shape '+g.shape);assert.equal(g.shape,actual.shape);assert.ok(Math.abs(g.range-actual.range)<.01,row.id+' '+kind+' '+power+' '+g.range+' != '+actual.range);
   }
  }
 }finally{destroyWorld(w);}
});
test('queued input and action floors survive discarded queues; old seq never fires twice',()=>{
 const w=world(),p=w.byId.get('one');try{
  const c={playerId:p.remoteId,lifeSeq:p.lifeSeq};
  applyCommand(w,{...c,type:'INPUT',seq:100000,clientTick:100001,move:{x:1,y:0},aim:{x:1,y:0}});
  const action={...c,type:'ACTION',kind:'attack',seq:1000,aim:{x:1,y:0}};
  assert.equal(applyCommand(w,action).accepted,true);assert.equal(applyCommand(w,action).reason,'OLD_ACTION');
  assert.deepEqual(getPrivateSelfState(w,p.remoteId,undefined,true).inputFloor,{move:100000,tick:100001,attack:1000,skill:0});
  assert.equal(p.lastAppliedSeq||0,0);
 }finally{destroyWorld(w);}
});
test('owner-bound dash, channel and victim capture release their own locks on interruption',()=>{
 const w=world(),[p,q]=w.game.participants,R=w.BRRework;
 try{
  const ctx=()=>R.context(p,w.game,new w.Vec2(1,0),1);
  const dash=R.dash(ctx(),{range:180,speed:15});assert.ok(R.inputLocks(p,w.game).move);
  R.end(dash,'wall');assert.equal(R.inputLocks(p,w.game).move,false);
  const beam=R.channel(ctx(),{range:200,duration:60,width:20});assert.ok(R.inputLocks(p,w.game).attack);
  p.stunned=3;stepWorld(w);assert.ok(R.inputLocks(p,w.game).move);assert.ok(beam.dead);
  for(let i=0;i<5;i++)stepWorld(w);assert.equal(R.inputLocks(p,w.game).skill,false);
  const grab=R.capture(ctx(),q,{range:300,pullSpeed:24});assert.ok(R.inputLocks(q,w.game).move);
  R.cleanup(p,w.game,'death');assert.ok(grab.dead);assert.equal(R.inputLocks(q,w.game).move,false);
 }finally{destroyWorld(w);}
});
test('orbit birth is stable across snapshots and leaving interest does not resurrect its spawn point',()=>{
 const w=world(),p=w.byId.get('one');try{
  p.cooldown=0;applyCommand(w,{type:'ACTION',kind:'skill',seq:1,lifeSeq:p.lifeSeq,playerId:p.remoteId,aim:{x:1,y:0}});
  const timeline=new Timeline();let first;
  for(let i=0;i<12;i++){stepWorld(w);const s=getTeacherState(w),q=s.shots.find(q=>q.type==='ORBIT');if(!q)continue;
   first??={start:q.start,id:q.id};assert.equal(q.start,first.start);assert.equal(q.id,first.id);
   timeline.accept({...s,snapshotSeq:i+1},i*17);
  }
  assert.ok(first);const shot=timeline.samples.at(-1).state.shots[0];timeline.event({type:'SHOT_SPAWN',serverTick:shot.start,data:shot});
  const latest=timeline.samples.at(-1).state;timeline.accept({...latest,serverTick:latest.serverTick+3,snapshotSeq:99,shots:[]},250);
  assert.ok(!timeline.frame(400).shots.some(q=>q.id===shot.id));
 }finally{destroyWorld(w);}
});
