// Executed inside the isolated reference page. This is a test adapter, never a production engine.
export function captureCombatFixtures() {
  const b=window.__baseline, output=[];
  BRMP.active=true;BRMP.role='host';BRMP.backend='firebase';BRMP.finishMatch=()=>{};
  BRMP.roomCode='fixture';BRMP.roomMeta={mode:'solo',seed:'fixture',matchRound:1,battleStartedAt:1};
  let now=0;Object.defineProperty(performance,'now',{value:()=>now,configurable:true});
  for(const a of EMOJI_DB){
    seedRandom('parity|'+a.id);teamMode=0;now=0;
    const p=new Participant(1,'actor',a,new Vec2(0,0));
    const targetAbility=EMOJI_DB.find(a=>a.id==='emoji-114');
    const q=new Participant(2,'target',targetAbility,new Vec2(180,0));
    for(const [i,x] of [p,q].entries()){
      x.remoteId='p'+i;x.sessionId='s'+i;x.abilityIndex=EMOJI_DB.indexOf(x.ability);
      x.lastAimDir=new Vec2(1,0);x.basicCooldown=0;x.skillUsesLeft=-1;x.maxSkillUses=-1;
      x.applyPlayerInput=()=>{};
    }
    game=new GameWorld([p,q]);game.walls=[];game.smokes=[];game.supplyDropSpawnFrame=999999;
    p.pos=new Vec2(0,0);q.pos=new Vec2(180,0);game.rebuildSpatialGrid();brRingInitWorld(game,0);
    const basic=b.brBasicAttack(p,game,new Vec2(1,0));
    p.cooldown=0;const skill=b.brCastPlayerSkill(p,game,new Vec2(1,0),1);
    const start={basic:basic===true,skill:skill!==false,projectiles:game.projectiles.length,zones:game.zones.length,turrets:game.turrets.length,reworks:game.rw?.entities.map(e=>e.kind)||[]};
    for(let tick=1;tick<=180;tick++){now=tick*1000/60;game.update();}
    output.push({id:a.id,start,end:{frame:game.frame,hp:p.hp,targetHp:q.hp,x:p.pos.x,y:p.pos.y,targetX:q.pos.x,targetY:q.pos.y,damage:p.damageDealt,alive:p.alive,projectiles:game.projectiles.length,zones:game.zones.length,reworks:game.rw?.entities.filter(e=>!e.dead).map(e=>e.kind)||[],runtimeFaults:(p.runtimeFaults||0)+(q.runtimeFaults||0)}});
  }
  game=null;return output;
}
