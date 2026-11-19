import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,applyCommand,stepWorld,destroyWorld} from '../../packages/engine/src/index.js';
import {authorityActionProbe} from '../combat/recovery357-probe.mjs';

test('accepted command is not a fired action: real stun resolves without replay after unlock',t=>{
 const w=createWorld(undefined,{},'action-observation',[{id:'a',abilityId:'emoji-007'},{id:'b',abilityId:'emoji-114'}],()=>{});
 t.after(()=>destroyWorld(w));w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];
 const p=w.byId.get('a'),q=w.byId.get('b');p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(800,300);
 p.spawnProtectionUntilFrame=q.spawnProtectionUntilFrame=0;w.game.rebuildSpatialGrid();authorityActionProbe(w);
 p.stunned=12;
 for(const kind of ['attack','skill'])assert.equal(applyCommand(w,{type:'ACTION',playerId:'a',lifeSeq:p.lifeSeq,kind,seq:1,aim:{x:1,y:0},aimPower:1}).accepted,true);
 for(let i=0;i<3;i++)stepWorld(w);
 assert.equal(p.resolvedAttackSeq,1);assert.equal(p.resolvedSkillSeq,1);
 assert.equal(p.firedAttackSeq||0,0);assert.equal(p.firedSkillSeq||0,0);
 assert.ok(w.actionObserved.some(e=>e.kind==='authority-before'&&e.locks.attack&&e.stunned>0));
 for(let i=0;i<20;i++)stepWorld(w);
 assert.equal(p.stunned,0);assert.equal(p.firedAttackSeq||0,0);assert.equal(p.firedSkillSeq||0,0);
 // A new intention after real unlock is a separate action, never an automatic
 // retry of the rejected one. The browser scenario sends only its initial click.
 for(const kind of ['attack','skill'])assert.equal(applyCommand(w,{type:'ACTION',playerId:'a',lifeSeq:p.lifeSeq,kind,seq:2,aim:{x:1,y:0},aimPower:1}).accepted,true);
 for(let i=0;i<3;i++)stepWorld(w);
 assert.equal(p.firedAttackSeq,2);assert.equal(p.firedSkillSeq,2);
});
