import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,getPrivateSelfState,getVisibleState,destroyWorld} from '../../packages/engine/src/index.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
import {AimAssist} from '../../apps/client/src/input/aim.js';
test('original weak aim selects visible target and server rejects stale life and excessive turn',()=>{
 const id=manifest.roster.find(a=>!a.basic.close&&a.basic.type!=='missile').id,w=createWorld(undefined,{},'aim',[{id:'a',name:'A',abilityId:id},{id:'b',name:'B',abilityId:'emoji-114'}]);
 try{const p=w.byId.get('a'),q=w.byId.get('b');p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(300*Math.cos(.4),300*Math.sin(.4));w.game.walls=[];w.game.smokes=[];w.game.farmBoxes=[];w.game.rebuildSpatialGrid();
 const timeline=new Timeline();timeline.walls=[];timeline.predicted=getPrivateSelfState(w,'a');timeline.samples=[{at:performance.now(),state:getVisibleState(w,'a')}];const assist=new AimAssist(timeline),result=assist.resolve('attack',{x:1,y:0},1,true);assert.equal(result.assist?.id,'p:b');assert.ok(result.aim.y>.1);
 const command={ax:result.aim.x,ay:result.aim.y,rax:1,ray:0,ap:1,assist:result.assist},validated=w.brValidateAimHelp(p,w.game,'attack',command);assert.ok(validated.y>.1);
 assert.equal(w.brValidateAimHelp(p,w.game,'attack',{...command,assist:{...result.assist,life:99}}).y,0);
 assert.equal(w.brValidateAimHelp(p,w.game,'attack',{...command,ax:-1,ay:0}).x,1);
 assist.enabled=false;assert.deepEqual(assist.resolve('attack',{x:1,y:0},1,true).aim,{x:1,y:0});
 assist.enabled=true;timeline.samples[0].state.actors=[timeline.predicted];assert.equal(assist.resolve('attack',{x:1,y:0},1,true).assist,undefined);
 }finally{destroyWorld(w);}
});
test('student camera interest respects portrait and landscape aspect while self remains present',()=>{
 const w=createWorld(undefined,{},'aspect',[{id:'a',name:'A',abilityId:'emoji-003'},{id:'b',name:'B',abilityId:'emoji-114'}]);try{w.byId.get('a').pos=new w.Vec2(0,0);w.byId.get('b').pos=new w.Vec2(850,0);w.game.smokes=[];assert.equal(getVisibleState(w,'a',{width:400,height:800}).actors.length,1);assert.equal(getVisibleState(w,'a',{width:800,height:400}).actors.length,2);}finally{destroyWorld(w);}
});
