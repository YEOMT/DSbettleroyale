import test from 'node:test';import assert from 'node:assert/strict';
import {actionState} from '../../apps/client/src/input/action-state.js';
import {Controls} from '../../apps/client/src/input/controls.js';
import {AimAssist} from '../../apps/client/src/input/aim.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';
import {aimGuide} from '../../apps/client/src/render/aim-guide.js';
import {AttackPoses,poseFamily} from '../../apps/client/src/render/attack-pose.js';
import {manifest} from '../../packages/content/src/manifest.js';
import {createWorld,createRuleContext,getPrivateSelfState,getVisibleState,getTeacherState,applyCommand,stepWorld,destroyWorld} from '../../packages/engine/src/index.js';
const ready={id:'a',alive:true,lifeSeq:0,basicCooldown:0,cooldown:0,rw:{locks:{}}};
function fixture(id){const events=[],w=createWorld(undefined,{},'controls353',[{id:'a',abilityId:id},{id:'b',abilityId:'emoji-114'}],e=>events.push(e)),p=w.byId.get('a'),q=w.byId.get('b');w.brFarm.dispose(w.game);w.game.walls=[];w.game.smokes=[];p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(800,300);p.spawnProtectionUntilFrame=q.spawnProtectionUntilFrame=0;w.game.rebuildSpatialGrid();return {w,p,q,events};}
function cast(f,kind='skill',seq=1){return applyCommand(f.w,{type:'ACTION',playerId:'a',lifeSeq:f.p.lifeSeq,kind,seq,aim:{x:1,y:0},aimPower:1,castId:f.p.rw?.recast?.ctx.castId||''});}
test('shared button/request states preserve hard locks, aimable cooldown, channel steering and recast priority',()=>{
 const cases=[['READY',ready,{}],['COOLDOWN',{...ready,cooldown:2},{}],['STUNNED',{...ready,stunned:1},{}],['LOCKED',{...ready,rw:{locks:{skill:true}}},{}],['RECOVERY',ready,{restoring:true}],['RECOVERY',ready,{profilesReady:false}],['PAUSED',ready,{enabled:false,paused:true}],['DEAD',{...ready,alive:false},{}],['CAPTURED',{...ready,rw:{capture:{}}},{}],['CHANNEL',{...ready,rw:{channel:{},locks:{skill:true,steerAllowed:true}}},{}],['RECAST',{...ready,cooldown:100,rw:{recast:{}}},{}],['STUNNED',{...ready,stunned:1,rw:{recast:{}}},{}],['REQUEST_GUARD',ready,{now:1099,lastFire:1000}]];
 for(const [expected,self,opts]of cases){const s=actionState(self,'skill',opts);assert.equal(s.state,expected);assert.equal(s.canFire,['READY','RECAST'].includes(expected));assert.equal(s.canAim,['READY','RECAST','COOLDOWN','REQUEST_GUARD','CHANNEL'].includes(expected));}
 assert.equal(actionState(ready,'attack',{now:1100,lastFire:1000}).canFire,true);
});
test('all 86 current authority profiles provide finite guides at both power ends and augmented size/range; legal fastest basic interval stays above the unchanged guard',()=>{
 assert.equal(manifest.roster.length,86);const rules=createRuleContext();let fastest=Infinity;
 for(const a of manifest.roster){const f=fixture(a.id),{w,p}=f;try{
  for(const modified of [false,true]){
   if(modified){p.run.mods.skillRange=1.3;p.run.mods.skillSize=1.25;p.run.mods.basicSpeed=2.5;p.aimProfileKey=null;}
   const s=getPrivateSelfState(w,'a');for(const kind of ['attack','skill'])for(const power of [.18,1]){
    const g=aimGuide(s,kind,{aim:{x:1,y:0},power},{worldRadius:4000},new Timeline().kernel,[],[]);
    assert.ok(g,a.id+' '+kind);for(const key of ['x','y','range'])assert.ok(Number.isFinite(g[key]),a.id+' '+key);
    assert.ok(g.range>=0);assert.equal(actionState(s,kind).state,'READY');assert.ok(poseFamily(a.id,kind));
   }
  }
  // Only this kit's actual self haste can stack with the strongest team haste.
  const kit=manifest.reworkDefinitions[a.id]?.skill||{},own=['chainsaw','dart-haste'].includes(kit.kind)?kit.attackHaste||1:kit.attackRate||1;
  const frames=rules.brBasicAttackFrames(p.ability,{...p.run.mods,basicSpeed:2.5});fastest=Math.min(fastest,Math.ceil(frames/Math.min(3,own*1.3))*1000/60);
 }finally{destroyWorld(w);}}
 assert.ok(fastest>=100,'a valid faster action requires revisiting the local guard: '+fastest);
});
test('preview uses the exact assist without mutating retention; the actual release still acquires it and stale/hidden targets do not',()=>{
 const {w,p,q}=fixture('emoji-144');try{
  const t=new Timeline(),a=new AimAssist(t);q.pos=new w.Vec2(400*Math.cos(13*Math.PI/180),400*Math.sin(13*Math.PI/180));w.game.rebuildSpatialGrid();t.predicted=getPrivateSelfState(w,'a');t.walls=[];t.samples=[{at:performance.now(),state:getVisibleState(w,'a')}];
  a.scope.BRMP.aimHelpHeld={skill:{id:'preserved',at:1}};const held=a.scope.BRMP.aimHelpHeld,before=structuredClone(held),raw={x:1,y:0};
  const guide=a.preview('attack',raw);assert.equal(guide.assist.id,'p:b');assert.equal(a.scope.BRMP.aimHelpHeld,held);assert.deepEqual(held,before);assert.deepEqual(a.resolve('attack',raw),guide);assert.equal(held.attack.id,'p:b');
  t.samples[0].state.actors=[];assert.equal(a.preview('attack',raw).assist,undefined);assert.equal(held.attack.id,'p:b');t.samples[0].at-=500;assert.deepEqual(a.preview('attack',raw),{aim:raw,rawAim:raw});
 }finally{destroyWorld(w);}
});
test('private alien return point survives snapshot recovery, matches authority and never appears on public actors',()=>{
 const f=fixture('emoji-147'),{w,p}=f;try{
  cast(f);for(let n=0;n<16;n++)stepWorld(w);const s=getPrivateSelfState(w,'a');assert.deepEqual(s.recastTarget,{x:0,y:0});assert.ok(s.x>100);assert.ok(s.rw.recast);
  assert.ok(getTeacherState(w).actors.every(a=>!('recastTarget'in a)));assert.equal(getPrivateSelfState(w,'b').recastTarget,undefined);
  const guide=aimGuide(s,'skill',{aim:{x:0,y:1},power:.18},{worldRadius:w.game.worldRadius},new Timeline().kernel,[],[]);assert.equal(guide.returning,true);assert.equal(guide.x,0);assert.equal(guide.y,0);
  cast(f,'skill',2);stepWorld(w);assert.equal(p.pos.x,guide.x);assert.equal(p.pos.y,guide.y);assert.equal(getPrivateSelfState(w,'a').recastTarget,undefined);
 }finally{destroyWorld(w);}
 const s={...ready,x:200,y:0,radius:30,aimProfiles:{skill:{spec:{shape:'target'}}},recastTarget:{x:0,y:0},rw:{recast:{}}},kernel=new Timeline().kernel,map={worldRadius:3200};
 const g=visible=>aimGuide(s,'skill',{aim:{x:1,y:0},power:1},map,kernel,[],visible);
 assert.equal(g([]).blocked,false);assert.equal(g([{id:'b',alive:true,x:100,y:0,radius:30}]).blocked,true);
 assert.equal(aimGuide(s,'skill',{aim:{x:1,y:0},power:1},map,kernel,[],[],[],{cx:200,cy:0,radius:90}).blocked,true);
});
test('real nuclear punch and sniper wait for actual windup; multi-projectile ordinals do not restart a pose',()=>{
 for(const [id,delay]of [['emoji-025',12],['emoji-023',24]]){
  const f=fixture(id),{w,events}=f,poses=new AttackPoses();try{cast(f);let processed=0;
   for(let n=1;n<=delay+2;n++){stepWorld(w);for(const e of events.slice(processed))poses.accept(e,getTeacherState(w).actors,n*1000/60);processed=events.length;if(n<=delay)assert.equal(poses.active.has('a'),false);}
   const pose=poses.active.get('a');assert.ok(pose);assert.equal(pose.seq,1);assert.equal(pose.kind,'skill');assert.equal(pose.family,id==='emoji-025'?'heavy':'recoil');
  }finally{destroyWorld(w);}
 }
 for(const [id,family]of [['emoji-003','burst'],['emoji-131','burst'],['emoji-152','field'],['emoji-153','field'],['emoji-147','travel']])assert.equal(poseFamily(id,'skill'),family);
});
test('pure shield absorbs have contact but no HP hurt pose; miss/duplicate/life/reduced motion stay bounded',()=>{
 const p=new AttackPoses(),actors=[{...ready,abilityId:'emoji-025',radius:32},{...ready,id:'b',abilityId:'emoji-114',radius:32}];
 const hit={type:'FX',serverTick:10,data:{kind:'hit',sourceId:'a',targetId:'b',amount:0,style:'punch',geometry:{confirmed:true,lifeSeq:0,targetLife:0,absorbed:20}}};
 p.accept(hit,actors,100);assert.ok(p.contacts.has('a'));assert.equal(p.active.has('b'),false);assert.equal(p.sample(actors[0],1,11,140,true,false),null);
 p.accept({...hit,data:{...hit.data,amount:5}},actors,100);assert.equal(p.active.get('b').family,'hit');assert.equal(p.sample({...actors[1],lifeSeq:1},1,11,140,false,false),null);
 p.clear();p.accept({type:'COMMAND_RESULT',data:{},serverTick:10},actors,100);assert.equal(p.active.size,0);
});
test('request receipt cannot overwrite execution or a new request, stale epochs cannot flash, and prepared audio waits for confirmed FX',async t=>{
 t.mock.method(performance,'now',()=>1000);const previous=globalThis.document;globalThis.document={hidden:false};
 try{
  const self={...ready,abilityId:'emoji-025',visualProfiles:{skill:{windup:12}},aimProfiles:{skill:{range:165,rangeMin:165}}};let accept,reject;const sent=[],sounds=[];
  const c=Object.assign(Object.create(Controls.prototype),{enabled:true,net:{scope:{connectionEpoch:2,matchId:3},lifeSeq:0,ws:{readyState:1},command:(type,payload)=>{sent.push(payload);return new Promise((yes,no)=>{accept=yes;reject=no;});}},timeline:{predicted:self,preview(){},cancelPreview(){}},lastFire:{},feedback:{},sounds:new Map(),actions:{attack:0,skill:0},gestures:new Map(),move:{x:0,y:0},keys:new Set(),lastDirection:{x:1,y:0},aim:{x:1,y:0},assist:{resolve:(_k,aim)=>({aim,rawAim:aim})},audio:{action:(...a)=>sounds.push(a)}});
  c.fire('skill');assert.equal(c.feedbackState('skill'),'sent');c.confirmSounds({...self,actions:{skill:1,firedSkill:1}});assert.equal(sounds.length,0);
  const e={type:'FX',data:{kind:'swing',sourceId:'a',geometry:{confirmed:true,kind:'skill',seq:1,lifeSeq:0}}};c.confirmShot(e);assert.equal(c.feedbackState('skill'),'executed');assert.equal(sounds.length,1);accept({accepted:true});await Promise.resolve();assert.equal(c.feedbackState('skill'),'executed');
  c.confirmShot(e);assert.equal(sounds.length,1);assert.equal(sent.length,1);c.fire('skill');assert.equal(sent.length,1,'no queued retry during guard');
  c.net.scope.connectionEpoch++;assert.equal(c.feedbackState('skill'),'');c.confirmShot(e);assert.equal(c.feedbackState('skill'),'');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('minimum-range alien can return at five actual ticks; only authority-confirmed recast bypasses 100ms, never an outstanding request',()=>{
 const f=fixture('emoji-147'),{w,p}=f;try{
  applyCommand(w,{type:'ACTION',playerId:'a',lifeSeq:0,kind:'skill',seq:1,aim:{x:1,y:0},aimPower:.18});for(let n=0;n<5;n++)stepWorld(w);
  const self=getPrivateSelfState(w,'a');assert.equal(self.rw.locks.skill,false);assert.ok(self.rw.recast);assert.equal(self.actions.firedSkill,1);
  assert.equal(actionState(self,'skill',{now:1000+5*1000/60,lastFire:1000,actionSeq:1}).canFire,true);
  assert.equal(actionState(self,'skill',{now:1000+5*1000/60,lastFire:1000,actionSeq:2}).canFire,false);
  assert.equal(actionState({...self,rw:{...self.rw,locks:{skill:true}}},'skill',{now:1084,lastFire:1000,actionSeq:1}).canFire,false);
  cast(f,'skill',2);stepWorld(w);assert.equal(p.pos.x,0);assert.equal(p.firedSkillSeq,2);
 }finally{destroyWorld(w);}
});

test('a dash created on the previous snapshot boundary is shown once, not lost or replayed on re-entry',()=>{
 const p=new AttackPoses(),actor={...ready,abilityId:'emoji-147',radius:32},shot={id:'dash',kind:'safe-dash',start:30,owner:'a',life:0,actionKind:'skill',actionSeq:1,dx:1,dy:0},calls=[];
 p.snapshot({serverTick:33,actors:[actor],shots:[shot]},30,100,e=>calls.push(e));const entry=p.active.get('a');assert.equal(entry.family,'travel');assert.equal(calls.length,1);
 p.snapshot({serverTick:36,actors:[actor],shots:[shot]},33,150,e=>calls.push(e));assert.equal(p.active.get('a'),entry);assert.equal(calls.length,1);
 p.clear();p.snapshot({serverTick:42,actors:[actor],shots:[shot]},39,250);assert.equal(p.active.size,0,'old interest re-entry cannot restart');
});
