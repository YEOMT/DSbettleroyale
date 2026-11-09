import test from 'node:test';import assert from 'node:assert/strict';
import {createWorld,createRuleContext,getTeacherState,getHostVisibleState,getVisibleState,getPrivateSelfState,destroyWorld} from '../../packages/engine/src/index.js';
import {Timeline} from '../../apps/client/src/presentation/timeline.js';import {AimAssist} from '../../apps/client/src/input/aim.js';
import {aimGuide} from '../../apps/client/src/render/aim-guide.js';
function fixture(id='emoji-003'){
 const events=[],w=createWorld(undefined,{},'classroom-rules',[{id:'a',name:'A',abilityId:id},{id:'b',name:'B',abilityId:'emoji-114'},{id:'c',name:'C',abilityId:'emoji-114'}],e=>events.push(e)),p=w.byId.get('a'),q=w.byId.get('b');
 w.game.walls=[];w.game.smokes=[];w.brFarm.dispose(w.game);p.pos=new w.Vec2(0,0);q.pos=new w.Vec2(2000,0);w.byId.get('c').pos=new w.Vec2(-2000,0);w.game.rebuildSpatialGrid();
 return {w,p,q,events,R:w.BRRework,tick(n){for(let i=0;i<n;i++){w.game.frame++;w.timeMs=w.game.frame*1000/60;w.BRRework.tick(w.game);}}};
}
test('only pig gets HP240, joker guide and actual maximum400, durations/cooldowns unchanged',()=>{
 const pig=fixture('emoji-149');assert.equal(pig.p.maxHp,240);for(let i=0;i<5;i++)pig.w.brRecomputeRun(pig.p);assert.equal(pig.p.maxHp,240);destroyWorld(pig.w);
 const f=fixture('emoji-141'),{w,p:j,R}=f;try{const s=getPrivateSelfState(w,'a'),t=new Timeline(),guide=aimGuide(s,'skill',{aim:{x:1,y:0},power:1},{worldRadius:3200},t.kernel,[],[]);assert.equal(guide.x,400);assert.equal(R.cast(j,w.game,new w.Vec2(1,0),1),true);assert.equal(j.pos.x,400);assert.equal(j.cooldown,720);assert.equal(j.rw.jokerStealth.end,72);const decoy=w.game.rw.entities.find(e=>e.kind==='decoy');assert.equal(decoy.end,300);assert.equal(decoy.hp,j.maxHp*.25);}finally{destroyWorld(w);}
});
test('mushroom stays authoritative and owner-visible, hidden to allies/enemies/host, public poison after trigger',()=>{
 const f=fixture('emoji-144'),{w,p,q,R}=f;try{
 p.team=1;w.byId.get('c').team=1;q.team=2;R.cast(p,w.game,new w.Vec2(1,0),1);const trap=w.game.rw.entities.find(e=>e.kind==='mushroom');assert.ok(trap);q.pos=new w.Vec2(400,0);w.byId.get('c').pos=new w.Vec2(380,0);w.game.rebuildSpatialGrid();
 const frame=getTeacherState(w);assert.ok(frame.shots.some(s=>s.id===trap.id));assert.ok(getVisibleState(w,'a',undefined,frame).shots.some(s=>s.id===trap.id));for(const id of ['b','c'])assert.ok(!getVisibleState(w,id,undefined,frame).shots.some(s=>s.id===trap.id));assert.ok(!getHostVisibleState(frame).shots.some(s=>s.id===trap.id));
 const context=w.brAimHelpContext('attack',1,q,w.game),entry={ref:trap,id:'t:'+trap.id,life:0,type:'turret'};assert.equal(w.brAimHelpTarget(context,entry),null);
 q.pos=new w.Vec2(trap.pos.x,trap.pos.y);w.game.rebuildSpatialGrid();f.tick(30);assert.equal(trap.dead,true);assert.ok(getHostVisibleState(getTeacherState(w)).shots.some(s=>s.kind==='poison'));for(const id of ['a','b','c'])assert.ok(getVisibleState(w,id).shots.some(s=>s.kind==='poison'));
 }finally{destroyWorld(w);}
});
test('straight bullet opt-in shares client/server limits; excluded attacks and tap retain original policy',()=>{
 const r=createRuleContext(),by=id=>r.EMOJI_DB.find(a=>a.id===id),profile=(id,kind)=>r.brAimHelpProfile(by(id),kind);
 assert.equal(profile('emoji-144','attack').max,5);assert.equal(profile('emoji-144','attack').cone,14);assert.equal(profile('emoji-144','attack').gain,.36);assert.equal(profile('emoji-144','attack').tap,35);
 assert.equal(profile('emoji-003','skill').max,4);assert.equal(profile('emoji-003','skill').cone,12);assert.equal(profile('emoji-003','skill').gain,.36);
 assert.equal(profile('emoji-056','skill').max,3,'existing weak homing bubble unchanged');for(const id of ['emoji-023','emoji-137'])assert.equal(profile(id,'attack').max,4,'sniper basic unchanged');
 for(const a of r.EMOJI_DB)for(const kind of ['attack','skill']){const p=r.brAimHelpProfile(a,kind);if(p.name==='melee'||p.name==='precision')assert.equal(p.max,r.BR_AIM_HELP[p.name].max);if(p.basic.type==='missile'&&kind==='attack')assert.equal(p.name,'none');}
 for(const id of ['emoji-141','emoji-142','emoji-144','emoji-147','emoji-150'])assert.equal(profile(id,'skill').name,'none');
});
test('archmage actual24/32 projectile edge hits, misses and wall radius use identical geometry',()=>{
 for(const radius of [24,32])for(const scenario of ['hit','miss','wall']){
  const f=fixture(),{w,p,q,R}=f;try{
   const ctx=R.context(p,w.game,new w.Vec2(1,0),1);q.pos=new w.Vec2(200,q.radius+radius+(scenario==='hit'?-.1:.1));w.game.rebuildSpatialGrid();
   if(scenario==='wall')w.game.walls=[new w.Wall(120,radius+5-.1,20,10,0,'wall')];
   const hp=q.hp,e=R.projectile(ctx,{radius,speed:31.5,range:1110,damage:11.55,knockback:0});f.tick(8);
   assert.equal(q.hp<hp,scenario==='hit',radius+' '+scenario);if(scenario==='wall'){assert.equal(e.dead,true);assert.ok(e.pos.x<140);}
  }finally{destroyWorld(w);}
 }
});
test('aim OFF/old/new geometry comparison, manual crate priority, stale life and barrier changes',()=>{
 const f=fixture('emoji-144'),{w,p,q}=f;try{
 const t=new Timeline(),assist=new AimAssist(t),theta=13*Math.PI/180;
 q.pos=new w.Vec2(400*Math.cos(theta),400*Math.sin(theta));w.game.rebuildSpatialGrid();t.predicted=getPrivateSelfState(w,'a');t.walls=[];t.samples=[{at:performance.now(),state:getVisibleState(w,'a')}];
 const raw={x:1,y:0};assist.enabled=false;assert.deepEqual(assist.resolve('attack',raw).aim,raw);assist.enabled=true;
 const next=assist.resolve('attack',raw);assert.equal(next.assist?.id,'p:b');assert.ok(Math.atan2(next.aim.y,next.aim.x)<=5*Math.PI/180);const profile=t.predicted.aimProfiles.attack;
 t.predicted={...t.predicted,aimProfiles:{...t.predicted.aimProfiles,attack:{...profile,cone:12,max:4,gain:.3}}};assert.equal(assist.resolve('attack',raw).assist,undefined);t.predicted.aimProfiles.attack=profile;
 const cmd={ax:next.aim.x,ay:next.aim.y,rax:1,ray:0,ap:1,assist:next.assist};assert.deepEqual({...w.brValidateAimHelp(p,w.game,'attack',cmd)},next.aim);assert.equal(w.brValidateAimHelp(p,w.game,'attack',{...cmd,assist:{...cmd.assist,life:99}}).y,0);
 w.game.walls=[new w.Wall(300,40,30,400,0,'wall')];assert.equal(w.brValidateAimHelp(p,w.game,'attack',cmd).y,0);w.game.walls=[];assert.ok(w.brValidateAimHelp(p,w.game,'attack',cmd).y>0);
 t.samples[0].state.farm.b=[['manual',300,0,10,10,48]];assert.equal(assist.resolve('attack',raw).assist,undefined);t.samples[0].state.farm.b=[];t.samples[0].at-=500;assert.equal(assist.resolve('attack',raw).assist,undefined);
 }finally{destroyWorld(w);}
});
test('archmage casts14 fixed-direction rounds at24/32 with single size multiplier and unchanged timing/damage',()=>{
 for(const scale of [1,1.25]){const f=fixture(),{w,p,R,events}=f;try{
 p.run.mods.skillSize=scale;const definition=R.defs[p.ability.id].skill;assert.equal(definition.width,48);assert.equal(definition.finalRadius,32);
 const profile=getPrivateSelfState(w,'a').visualProfiles.skill;assert.equal(profile.radius,24*scale);assert.equal(profile.finalRadius,32*scale);
 assert.equal(R.cast(p,w.game,new w.Vec2(1,0),1),true);assert.equal(p.cooldown,1200);p.lastAimDir=new w.Vec2(0,1);f.tick(66);
 const shots=events.filter(e=>e.type==='SHOT_SPAWN'&&e.data.kind==='projectile');assert.equal(shots.length,14);assert.deepEqual(shots.map(e=>e.serverTick),Array.from({length:14},(_,i)=>10+i*4));assert.deepEqual(shots.map(e=>e.data.radius),Array.from({length:14},(_,i)=>(i===13?32:24)*scale));assert.ok(shots.every(e=>e.data.dx===1&&e.data.dy===0));assert.equal(definition.speed,31.5);assert.equal(definition.damage,11.55);assert.equal(definition.finalDamage,17.85);
 }finally{destroyWorld(w);}}
});
test('moving targets, manual lead and crossing targets retain the original intent safeguards',()=>{
 const r=createRuleContext(),ability=r.EMOJI_DB.find(a=>{const p=r.brAimHelpProfile(a,'attack');return p.max===5&&p.slow&&p.range>400;});assert.ok(ability);
 const f=fixture(ability.id),{w,p,q}=f;try{
  const t=new Timeline(),assist=new AimAssist(t),other=w.byId.get('c'),raw={x:1,y:0};t.predicted=getPrivateSelfState(w,'a');t.walls=[];
  const at=(actor,deg,vy=0)=>{const a=deg*Math.PI/180;actor.pos=new w.Vec2(600*Math.cos(a),600*Math.sin(a));actor.vel=new w.Vec2(0,vy);};
  const sync=()=>{w.game.rebuildSpatialGrid();t.samples=[{at:performance.now(),state:getVisibleState(w,'a')}];};
  const next=t.predicted.aimProfiles.attack,old={...next,cone:12,max:4,gain:.30};at(q,11);sync();
  const turns=[];for(const profile of [old,next]){t.predicted.aimProfiles.attack=profile;turns.push(assist.resolve('attack',raw).aim.y);}assert.ok(turns[1]>turns[0]&&turns[0]>0,JSON.stringify({turns}));
  at(q,11,2);sync();for(const profile of [old,next]){t.predicted.aimProfiles.attack=profile;assert.equal(assist.resolve('attack',raw).assist,undefined);const lead={x:Math.cos(.35),y:Math.sin(.35)};assert.deepEqual(assist.resolve('attack',lead).aim,lead);}
  t.predicted.aimProfiles.attack=next;at(q,11);at(other,-11.3);sync();assert.equal(assist.resolve('attack',raw).assist.id,'p:b');at(q,11.25);at(other,-11);sync();assert.equal(assist.resolve('attack',raw).assist.id,'p:b','brief target retention');
  const manual={x:Math.cos(-.3),y:Math.sin(-.3)},changed=assist.resolve('attack',manual);assert.ok(Math.abs(Math.atan2(changed.aim.y,changed.aim.x)+.3)<5*Math.PI/180,'new manual direction wins');
  t.samples[0].state.actors=[];assert.equal(assist.resolve('attack',raw).assist,undefined);assert.equal(assist.scope.BRMP.aimHelpHeld.attack,undefined);
 }finally{destroyWorld(w);}
});
