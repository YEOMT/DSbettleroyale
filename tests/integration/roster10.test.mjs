import test from 'node:test';
import {freezeableFixture} from '../simulation-fixture.mjs';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';
import {createRuleContext,stepWorld,getPrivateSelfState} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
const ids=Array.from({length:10},(_,i)=>'emoji-'+(141+i));
const yieldTurn=()=>new Promise(r=>setImmediate(r));
test('all ten new IDs use rank-first assignment in every public mode without changing rank odds',()=>{
 const r=createRuleContext(),boundaries=[['S',.05],['A',.2],['B',.4],['C',.7],['F',.95]];
 for(const mode of ['solo','team-elim','team-capture'])for(const [rank,p]of boundaries){const pool=r.EMOJI_DB.filter(a=>a.t===rank&&!(mode==='solo'&&a.teamOnly));
  for(const [j,a]of pool.entries()){let draws=0;const ix=r.brAbilityIndex(mode,-1,null,()=>draws++? (j+.5)/pool.length:p);assert.equal(r.EMOJI_DB[ix].id,a.id);assert.equal(draws,2);}
 }
 assert.equal(manifest.roster.length,84);for(const id of ids)assert.ok(manifest.roster.some(a=>a.id===id));
 assert.deepEqual(r.BR_TIER_CHANCES,[['S',.1],['A',.2],['B',.25],['C',.3],['F',.15]]);
});
test('all ten: actual WS assignment/input/actions/cooldown/resume/refire/rematch preserve identity', {timeout:90000},async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());
 const host=await(await connect(app)).host(),room=freezeableFixture(app,app.manager.rooms.get(host.room.code));let a=await(await connect(app)).join(room.code,'Synthetic new actor');const rival=await(await connect(app)).join(room.code,'Synthetic target');
 for(const id of ids){
  await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');room.members.get(a.session.playerId).draft.abilityId=id;room.members.get(rival.session.playerId).draft.abilityId='emoji-114';
  room.fixtureFrozen=false;await host.command('START_BATTLE');await a.phase('BATTLE');await a.next('SNAPSHOT');room.fixtureFrozen=true;
  const w=room.world,p=w.byId.get(a.session.playerId),q=w.byId.get(rival.session.playerId);w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(240,0);p.team=1;q.team=2;p.spawnProtectionUntilFrame=q.spawnProtectionUntilFrame=0;q.hp=q.maxHp=100000;p.cooldown=p.basicCooldown=0;
  assert.equal(p.ability.id,id);const initialX=p.pos.x;
  a.send('INPUT_BATCH',{commands:[{seq:100000,clientTick:100000,move:{x:1,y:0},aim:{x:1,y:0}}]});await yieldTurn();await new Promise(r=>setTimeout(r,5));
  for(let i=0;i<10;i++)stepWorld(w);assert.ok(p.pos.x>initialX,id+' move');
  assert.equal((await a.command('ACTION',{kind:'attack',seq:100001,aim:{x:1,y:0}})).accepted,true);stepWorld(w);assert.equal(p.firedAttackSeq,100001,id+' basic');
  assert.equal((await a.command('ACTION',{kind:'skill',seq:100002,aim:{x:1,y:0},aimPower:1})).accepted,true);stepWorld(w);assert.equal(p.firedSkillSeq,100002,id+' skill');if(id==='emoji-147'){assert.equal(p.cooldown,0);assert.equal(p.rw.recast.left,1);}else assert.ok(p.cooldown>0,id+' cooldown');
  const cursor=100002,identity=p.remoteId,token=a.session.token,epoch=a.scope.connectionEpoch,entities=w.game.rw?.entities.filter(e=>!e.dead).map(e=>({id:e.id,end:e.end}))||[];
  await a.close();a=await connect(app);a.send('RESUME',{token,cursor:0},false);const full=(await a.next('FULL_STATE')).payload;assert.equal(full.self.id,identity);assert.ok(a.scope.connectionEpoch>epoch);assert.equal(room.students().length,2);assert.equal(full.self.abilityId,id);
  assert.deepEqual(w.game.rw?.entities.filter(e=>!e.dead).map(e=>({id:e.id,end:e.end}))||[],entities,id+' resume does not recast/extend');
  if(id==='emoji-147'){
   const rec=full.self.rw.recast,warp=p.warpSeq||0;assert.equal(rec.end,p.rw.recast.end);
   for(let i=0;i<14;i++)stepWorld(w);
   assert.equal((await a.command('ACTION',{kind:'skill',seq:100003,castId:rec.id,aim:{x:1,y:0}})).accepted,true);
   stepWorld(w);assert.equal(p.firedSkillSeq,100003);assert.equal(p.warpSeq,warp+1);assert.equal(p.cooldown,420);
  }
  a.send('INPUT_BATCH',{commands:[{seq:100003,clientTick:100003,move:{x:0,y:1},aim:{x:1,y:0}}]});await new Promise(r=>setTimeout(r,5));
  for(let i=0;i<1200;i++){stepWorld(w);if(i%30===0)await yieldTurn();}
  p.stunned=0;assert.ok(p.cooldown<=0,id+' cooldown expires');assert.equal((await a.command('ACTION',{kind:'attack',seq:100004,aim:{x:1,y:0}})).accepted,true);stepWorld(w);assert.equal(p.firedAttackSeq,100004,id+' resumed attack');
  assert.equal((await a.command('ACTION',{kind:'skill',seq:100005,aim:{x:1,y:0}})).accepted,true);stepWorld(w);assert.equal(p.firedSkillSeq,100005,id+' resumed skill');assert.equal(p.lastAppliedSeq,100003,id+' resumed input');assert.equal(p.runtimeFaults||0,0);
  const self=getPrivateSelfState(w,identity);assert.equal(self.id,identity);await host.command('END');await host.command('REMATCH');await a.phase('LOBBY');assert.equal(room.world,null);assert.equal(room.students().length,2);
 }
 await a.close();await rival.close();await host.close();
});
