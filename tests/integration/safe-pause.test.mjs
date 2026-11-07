import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../../apps/server/src/main.js';
import {connect} from './client.mjs';
import {stepWorld} from '../../packages/engine/src/index.js';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
test('safe pause cancels only unexecuted commands, rejects spam without queues, restores fresh epoch movement and casts',async t=>{
 const app=await createGameServer({port:0,hostSecret:'test-host'});t.after(()=>app.close());
 const host=await(await connect(app)).host(),room=app.manager.rooms.get(host.room.code);let a=await(await connect(app)).join(room.code,'Synthetic pause');await(await connect(app)).join(room.code,'Synthetic rival');
 await host.command('CONFIGURE',{mode:'team-capture'});await host.command('START_QUIZ');await host.command('BEGIN_DRAFT');room.members.get(a.session.playerId).draft.abilityId='emoji-024';
 await host.command('START_BATTLE');await a.next('SNAPSHOT');app.simulation.suspend();
 const w=room.world,p=w.byId.get(a.session.playerId);w.game.walls=[];w.game.smokes=[];w.brFarm.dispose(w.game);p.pos=new w.Vec2(0,0);p.cooldown=p.basicCooldown=0;p.stunned=0;
 a.send('INPUT_BATCH',{commands:[{seq:101,clientTick:101,move:{x:1,y:0},aim:{x:1,y:0}}]});
 assert.equal((await a.command('ACTION',{kind:'attack',seq:101,aim:{x:1,y:0}})).accepted,true);
 assert.equal((await a.command('ACTION',{kind:'skill',seq:102,aim:{x:1,y:0}})).accepted,true);
 const fired={attack:p.firedAttackSeq||0,skill:p.firedSkillSeq||0};assert.equal(w.actionPending.get(p.remoteId).length,2);
 room.pause();const paused=(await a.next('FULL_STATE',s=>s.room.safePaused)).payload;
 assert.equal(paused.self.inputFloor.move,101);assert.equal(paused.self.actions.attack,101);assert.equal(paused.self.actions.skill,102);
 assert.equal(paused.self.actions.firedAttack,fired.attack);assert.equal(paused.self.actions.firedSkill,fired.skill);assert.equal(w.inputPending.size,0);assert.equal(w.actionPending.size,0);
 let privateCount=0;a.onMessage=m=>{if(m.type==='PRIVATE_STATE')privateCount++;};
 for(let i=0;i<40;i++){a.send('INPUT_BATCH',{commands:[{seq:200+i,clientTick:200+i,move:{x:1,y:0},aim:{x:1,y:0}}]});const r=await a.command('ACTION',{kind:'attack',seq:200+i,aim:{x:1,y:0}},'pause-'+i);assert.equal(r.reason,'SAFE_PAUSED');}
 a.send('ACTION',{kind:'attack',seq:200,aim:{x:1,y:0}},true,'pause-0');assert.equal((await a.next('COMMAND_RESULT',r=>r.requestId==='pause-0')).payload.reason,'SAFE_PAUSED');
 assert.equal(privateCount,0);assert.equal(w.inputPending.size,0);assert.equal(w.actionPending.size,0);assert.equal(room.members.get(p.remoteId).peer.errors,0);assert.equal(a.ws.readyState,1);
 const token=a.session.token;await a.close();a=await connect(app);a.send('RESUME',{token,cursor:0},false);const full=(await a.next('FULL_STATE')).payload;
 assert.equal(full.room.safePaused,true);assert.equal(full.self.inputFloor.attack,101);assert.equal(full.self.id,p.remoteId);const oldScope={...a.scope};
 assert.equal((await host.command('CONTINUE')).accepted,true);const restored=(await a.next('FULL_STATE',s=>!s.room.safePaused)).payload;
 assert.ok(a.scope.connectionEpoch>oldScope.connectionEpoch);assert.equal(restored.self.inputFloor.move,101);
 a.ws.send(JSON.stringify({type:'ACTION',protocolVersion:full.room.protocolVersion||33,payload:{kind:'attack',seq:999,aim:{x:1,y:0}},...oldScope,lifeSeq:p.lifeSeq,requestId:'old-paused-packet'}));
 assert.equal((await a.next('COMMAND_RESULT',r=>r.requestId==='old-paused-packet')).payload.reason,'SCOPE_MISMATCH');
 const start={x:p.pos.x,y:p.pos.y};for(let n=0;n<10;n++)stepWorld(w);assert.equal(p.pos.x,start.x);assert.equal(p.firedAttackSeq||0,fired.attack);
 a.send('INPUT_BATCH',{commands:[{seq:102,clientTick:102,move:{x:1,y:0},aim:{x:1,y:0}}]});await delay(5);stepWorld(w);assert.ok(p.pos.x>start.x);
 for(const [kind,seq]of [['attack',103],['skill',104]]){assert.equal((await a.command('ACTION',{kind,seq,aim:{x:1,y:0}})).accepted,true);stepWorld(w);assert.equal(p[kind==='attack'?'firedAttackSeq':'firedSkillSeq'],seq);}
 room.pause('FIXTURE_FAULT');await a.next('FULL_STATE',s=>s.room.simulationFault);assert.equal((await host.command('CONTINUE')).reason,'CANNOT_CONTINUE');
 await host.command('END');await host.command('REMATCH');assert.equal(room.safePaused,false);assert.equal(room.lastFault,null);assert.equal(room.world,null);
});
