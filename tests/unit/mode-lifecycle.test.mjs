import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,createRuleContext,stepWorld,destroyWorld,exportResult} from '../../packages/engine/src/index.js';
for(const teamCount of [2,3,4])for(const seconds of [300,360])test(`capture ${teamCount} teams ${seconds}s: full fixed-tick timeout and awards`,()=>{
 const players=Array.from({length:teamCount},(_,i)=>({id:'p'+i,name:'Bot'+i,team:i+1,abilityId:'emoji-114'})),w=createWorld(undefined,{mode:'team-capture',teamCount,matchSeconds:seconds},'capture-'+teamCount,players);
 for(let tick=0;tick<=seconds*60+2&&!w.finished;tick++)stepWorld(w);
 assert.equal(w.game.capture.finalized,true);assert.equal(w.game.capture.active,seconds);assert.equal(w.game.capture.activeMask,3);assert.equal(w.game.capture.phase,'FEVER');
 const result=exportResult(w);assert.equal(result.players.length,teamCount);assert.deepEqual(result.awards.map(a=>a.key),['capture','combat','support']);assert.equal(result.mode,'team-capture');assert.equal(result.duration,seconds);destroyWorld(w);
});
test('wanggui exclusion, S prohibition and idempotent HP ratio recomputation',()=>{
 const w=createWorld(undefined,{},'growth-ratio',[{id:'a',name:'A',abilityId:'emoji-114'},{id:'b',name:'B',abilityId:'emoji-113'}]),p=w.byId.get('a');p.hp=p.maxHp*.4;p.run.paths={wanggui:3};w.brRecomputeRun(p);const hp=p.hp,max=p.maxHp;
 for(let i=0;i<5;i++)w.brRecomputeRun(p);assert.equal(p.maxHp,max);assert.equal(p.hp,hp);assert.ok(Math.abs(p.hp/p.maxHp-.4)<1e-12);assert.equal(w.brWangguiAllowed(p.ability,{heavy:1}),false);assert.equal(w.brRunEligible(p,'heavy'),false);
 const s=w.EMOJI_DB.find(a=>a.t==='S');assert.equal(w.brWangguiAllowed(s,{wanggui:3}),false);destroyWorld(w);
});
test('survival result includes original winner, kills, damage and iron-wall awards',()=>{
 const w=createWorld(undefined,{},'awards',[{id:'a',name:'A',abilityId:'emoji-114'},{id:'b',name:'B',abilityId:'emoji-113'}]);const result=exportResult(w);assert.deepEqual(result.awards.map(a=>a.label),['WINNER','MOST KILLS','MOST DAMAGE','IRON WALL']);assert.equal(result.players.length,2);destroyWorld(w);
});


