import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,destroyWorld,getTeacherState,stepWorld} from '../../packages/engine/src/index.js';

const near=(actual,expected,label='')=>assert.ok(Math.abs(actual-expected)<1e-8,`${label}: ${actual} != ${expected}`);
function fixture(abilityId='emoji-141',mode='solo',attackerAbility='emoji-013'){
 const w=createWorld(undefined,{mode},'roster10-interactions',[
  {id:'owner',name:'owner',abilityId,team:mode==='solo'?0:1},
  {id:'attacker',name:'attacker',abilityId:attackerAbility,team:mode==='solo'?0:2},
  {id:'other',name:'other',abilityId:'emoji-114',team:mode==='solo'?0:1}
 ]),g=w.game,R=w.BRRework,[p,q,a]=g.participants;
 g.walls=[];g.smokes=[];g.zones=[];w.brFarm.dispose(g);
 for(const [actor,x,y]of [[p,0,0],[q,-220,0],[a,1500,1000]])place(w,actor,x,y);
 g.rebuildSpatialGrid();return {w,g,R,p,q,a};
}
function place(w,p,x,y){p.pos=new w.Vec2(x,y);p.vel=new w.Vec2(0,0);p.combatPreviousX=x;p.combatPreviousY=y;p.combatPreviousWarp=Number(p.warpSeq||0);p.spawnProtectionUntilFrame=0;p.lastAimDir=new w.Vec2(1,0);}
function tickRework(f){f.g.frame++;f.g.rebuildSpatialGrid();f.R.tick(f.g);}
function makeTarget(f,kind){
 const {w,g,R,p}=f;if(kind==='mushroom')place(w,p,-320,0);
 assert.equal(R.cast(p,g,new w.Vec2(1,0),1),true);
 const target=g.rw.entities.find(e=>e.kind===kind&&!e.dead);assert.ok(target);
 // Expose a real player behind the decoy/trap, proving the projectile was
 // absorbed by the entity rather than rejected because its owner was invisible.
 p.invisible=false;place(w,p,430,0);g.rebuildSpatialGrid();return target;
}
function scoring(p){return {hp:p.hp,kills:p.kills,damage:p.damageDealt,xp:p.run.xp,level:p.run.level};}

for(const kind of ['decoy','mushroom'])test(`${kind} absorbs a real native projectile and is destroyed without player kill/XP/lifesteal`,()=>{
 const f=fixture(kind==='decoy'?'emoji-141':'emoji-144'),{w,g,R,p,q}=f,target=makeTarget(f,kind);
 q.hp=q.maxHp*.4;const before=scoring(q),playerHp=p.hp,alive=getTeacherState(w).aliveCount;
 // Pass the real basic snapshot with the Blood Lord's existing lifesteal profile.
 const snap=R.basicAttempt(q,g,new w.Vec2(1,0)),shot=new w.Projectile(q,new w.Vec2(-180,0),new w.Vec2(1,0),650,target.hp+10,8,'BULLET','#fff',0,null,
  {knockback:0,impactStyle:'ranged-basic',basicSnapshot:snap,basicAttackId:snap.id,normalizedSkillStats:true});
 shot.update(g);
 assert.equal(target.dead,true);assert.equal(target.reason,'destroyed');assert.equal(shot.life,0);near(p.hp,playerHp);
 assert.deepEqual(scoring(q),before);assert.equal(getTeacherState(w).aliveCount,alive);assert.equal(g.participants.length,3);assert.equal(g.xpBundles.length,0);
 assert.equal(g.rw.entities.filter(e=>!e.dead&&e.kind==='poison').length,0);
 destroyWorld(w);
});

for(const kind of ['decoy','mushroom'])test(`${kind} accepts actual native melee basics without player rewards or Blood Lord lifesteal`,()=>{
 const f=fixture(kind==='decoy'?'emoji-141':'emoji-144'),{w,g,p,q}=f,target=makeTarget(f,kind);
 q.hp=q.maxHp*.4;place(w,q,-145,0);g.rebuildSpatialGrid();const before=scoring(q),playerHp=p.hp,initialTargetHp=target.hp;
 let attempts=0;
 while(!target.dead&&attempts<10){q.basicCooldown=0;assert.equal(w.brBasicAttack(q,g,new w.Vec2(1,0)),true);g.frame+=60;attempts++;}
 assert.ok(target.hp<initialTargetHp);assert.equal(target.dead,true);assert.equal(target.reason,'destroyed');near(p.hp,playerHp);
 assert.deepEqual(scoring(q),before);assert.equal(g.participants.length,3);assert.equal(g.xpBundles.length,0);
 assert.equal(g.rw.entities.filter(e=>!e.dead&&e.kind==='poison').length,0);
 destroyWorld(w);
});

function ringFixture(){
 const f=fixture('emoji-143'),{w,g,R,p,q}=f;place(w,q,430,0);place(w,p,0,0);g.rebuildSpatialGrid();
 const ring=R.roster10.ring(R.context(p,g,new w.Vec2(1,0)),null);assert.ok(ring);return {...f,ring};
}
for(const options of [{label:'normal'},{label:'piercing',pierce:true},{label:'bouncing',bounces:1}])test(`closed ring stops actual ${options.label} native projectile and removal restores the path`,()=>{
 const f=ringFixture(),{w,g,R,p,q,ring}=f,hp=q.hp;
 const shoot=()=>new w.Projectile(p,new w.Vec2(0,0),new w.Vec2(1,0),600,5,8,'BULLET','#fff',0,null,{...options,knockback:0,normalizedSkillStats:true});
 const shot=shoot();shot.update(g);near(q.hp,hp);assert.ok(shot.pos.x<260);
 if(options.bounces){assert.ok(shot.life>0);assert.ok(shot.vel.x<0);assert.equal(shot.bounces,0);}else assert.equal(shot.life,0);
 R.end(ring,'fixture-expired');assert.equal(g.walls.length,0);const through=shoot();through.update(g);assert.ok(q.hp<hp);destroyWorld(w);
});

test('closed ring clips an actual old rework beam and removal restores damage and displayed beam length',()=>{
 const f=ringFixture(),{w,g,R,p,q,ring}=f,hp=q.hp,c=R.context(p,g,new w.Vec2(1,0));
 const beam=R.channel(c,{range:700,width:40,damage:5,tickEvery:1,duration:30});
 tickRework(f);near(q.hp,hp);assert.ok(beam.length<260);assert.ok(beam.to.x<260);
 R.end(ring,'fixture-expired');tickRework(f);assert.ok(q.hp<hp);near(beam.length,700);destroyWorld(w);
});

for(const kind of ['mushroom','heal-crate'])test(`self grapple anchors ${kind} with actual head/pull movement and zero attack side effects`,()=>{
 const f=fixture('emoji-142','solo','emoji-144'),{w,g,R,p,q}=f;let anchor;
 if(kind==='mushroom'){
  place(w,q,0,0);assert.equal(R.cast(q,g,new w.Vec2(1,0),1),true);anchor=g.rw.entities.find(e=>e.kind==='mushroom');
 }else{
  anchor={id:'heal-anchor',pos:new w.Vec2(320,0),halfSize:48,radius:48*Math.SQRT2,hp:1.3,maxHp:1.3,kind:'heal'};
  g.farmBoxes.push(anchor);g.farmRevision++;
 }
 place(w,q,1200,0);g.rebuildSpatialGrid();const hp=anchor.hp,playerHp=q.hp,oldScore=scoring(p),oldHit=R.hit;let hits=0;
 R.hit=(...args)=>{hits++;return oldHit(...args);};assert.equal(R.cast(p,g,new w.Vec2(1,0),1),true);
 for(let tick=0;tick<65;tick++)tickRework(f);
 assert.ok(p.pos.x>150&&p.pos.x<320-p.radius);near(q.pos.x,1200);near(q.hp,playerHp);near(anchor.hp,hp);
 assert.equal(hits,0);assert.deepEqual(scoring(p),oldScore);assert.equal(R.inputLocks(p,g).move,false);assert.ok(!g.rw.entities.some(e=>!e.dead&&e.kind==='grapple'));
 destroyWorld(w);
});

test('crossing rings retain each collider after independent removal and actually block native shots',()=>{
 const f=fixture('emoji-143','solo','emoji-143'),{w,g,R,p,q,a}=f;
 place(w,p,0,0);place(w,q,400,0);place(w,a,800,0);g.rebuildSpatialGrid();
 const first=R.roster10.ring(R.context(p,g,new w.Vec2(1,0)),null);assert.ok(first);
 place(w,p,-500,0);const second=R.roster10.ring(R.context(q,g,new w.Vec2(1,0)),null);assert.ok(second);
 place(w,q,1200,0);g.rebuildSpatialGrid();assert.equal(g.walls.length,32);const hp=a.hp;
 const shoot=()=>{const shot=new w.Projectile(p,new w.Vec2(-500,0),new w.Vec2(1,0),1600,5,6,'BULLET','#fff',0,null,{knockback:0,normalizedSkillStats:true});shot.update(g);return shot;};
 const both=shoot();assert.equal(both.life,0);assert.ok(both.pos.x<0);near(a.hp,hp);
 R.end(first,'fixture-expired');assert.equal(g.walls.length,16);assert.ok(g.walls.every(wall=>wall.ringId===second.id));
 const remaining=shoot();assert.equal(remaining.life,0);assert.ok(remaining.pos.x>0&&remaining.pos.x<400);near(a.hp,hp);
 R.end(second,'fixture-expired');assert.equal(g.walls.length,0);shoot();assert.ok(a.hp<hp);assert.equal(R.dynamicWalls(g).rings.length,0);destroyWorld(w);
});

for(const mode of ['team-respawn','team-capture'])test(`all ten new actors keep exact stats through actual death/KEEP/reroll in ${mode}`,()=>{
 for(let number=141;number<=150;number++){
  const f=fixture('emoji-'+number,mode),{w,g,R,p,q}=f,baseline={hp:p.maxHp,speed:p.speed,radius:p.radius},identity=p;
  // Existing growth must be discarded at death, while the one-time B/C base
  // policy and the mode multiplier remain. The same Participant object survives.
  p.run.paths.titan=1;w.brRecomputeRun(p);assert.ok(p.maxHp>baseline.hp);
  R.buff(R.context(p,g,p.lastAimDir),p,'moveHaste',1.2,300);
  p.takeDamage(p.hp+10000,q,false,null,{scaled:true});stepWorld(w);assert.equal(p.alive,false);assert.equal(p.lifeSeq,1);
  near(p.maxHp,baseline.hp);near(p.speed,baseline.speed);near(p.radius,baseline.radius);assert.equal(p.run.level,1);
  assert.ok(!p.rw?.buffs?.length);assert.equal(g.rw.entities.some(e=>!e.dead&&e.ctx.owner===p),false);
  p.tkQuiz.correct=w.brTeamKillRules().quizNeeded;assert.equal(w.brRespawnPlayer(p,false),true);assert.equal(p,identity);near(p.hp,baseline.hp);stepWorld(w);
  // Select each real new definition at the existing RNG seam; execute the real
  // reroll/respawn function rather than reimplementing reset behavior in the test.
  const choose=w.brAbilityIndex;try{
   for(const id of ['emoji-147','emoji-148','emoji-'+number]){
    p.spawnProtectionUntilFrame=0;p.takeDamage(p.hp+10000,q,false,null,{scaled:true});stepWorld(w);assert.equal(p.alive,false);
    p.tkQuiz.correct=w.brTeamKillRules().quizNeeded;p.tkTokens=1;w.brAbilityIndex=()=>w.EMOJI_DB.findIndex(a=>a.id===id);
    assert.equal(w.brRespawnPlayer(p,true),true);assert.equal(p.ability.id,id);assert.equal(p.tkTokens,0);assert.equal(p,identity);
    const fresh=new w.Participant(99,'reference',w.EMOJI_DB.find(a=>a.id===id),new w.Vec2(0,0),p.team);
    near(p.maxHp,fresh.maxHp);near(p.hp,fresh.maxHp);near(p.speed,fresh.speed);near(p.radius,fresh.radius);assert.equal(p.run.base.maxHp,fresh.maxHp);assert.equal(p.run.level,1);stepWorld(w);
   }
  }finally{w.brAbilityIndex=choose;destroyWorld(w);}
 }
});
