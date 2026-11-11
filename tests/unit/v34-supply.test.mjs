import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld, destroyWorld, stepWorld, getTeacherState, getVisibleState} from '../../packages/engine/src/index.js';
import {activeSupply, scheduleSoloSupplies, updateSoloSupplies} from '../../packages/engine/src/farm/combat-supplies.js';

function fixture(mode='solo', count=5, seed='supply-test'){
    return createWorld(undefined,{mode, mapIndex:0, matchId:'fixture:1'},seed,
        Array.from({length:count},(_,i)=>({id:'p'+i,name:'P'+i,team:mode==='solo'?0:1+(i%2),abilityId:i<2?'emoji-052':'emoji-034'})));
}
function advance(w, n){for(let i=0;i<n;i++)stepWorld(w);}
function near(actual, expected){assert.ok(Math.abs(actual-expected)<1e-8, actual+' vs '+expected);}

test('solo schedules use frames, one active per kind, deterministic non-repeating random kinds through the last two',()=>{
    function run(){
        const w=fixture(),g=w.game, kinds=[], first=g.supplyDropSpawnFrame;
        try{
            assert.ok(first>=1050&&first<=1750);
            let xp;
            if(first<1500){g.frame=first;scheduleSoloSupplies(w,g);xp=g.supplyDrop;}
            for(let i=1;i<=10;i++){
                // Simulate a drop left unclaimed to its real ground expiry.
                g.frame=1500*i; scheduleSoloSupplies(w,g);
                const drop=g.combatSupply; assert.ok(drop); kinds.push(drop.kind);
                assert.equal(drop.landAt,g.frame+180);
                assert.equal(drop.expires,drop.landAt+720);
                scheduleSoloSupplies(w,g); assert.equal(g.combatSupply,drop);
                if(i===1&&first>=1500){g.frame=first;scheduleSoloSupplies(w,g);xp=g.supplyDrop;}
                assert.ok(xp);
                assert.equal(g.supplyDrop,xp,'unclaimed XP slot stays singular');
                g.frame=drop.expires;updateSoloSupplies(w,g);assert.equal(g.combatSupply,null);
                if(i===1||i===2||i===3){g.participants.at(-i).alive=false;g.refreshAliveCache();}
            }
            assert.equal(g.aliveRealPlayers.length,2);
            assert.equal(new Set(kinds).size,3);
            assert.ok(kinds.slice(1).every((k,i)=>k!==kinds[i]));
            assert.ok(kinds.slice(3).some((k,i)=>k!==kinds[i]),'selection is not a fixed rotation');
            return kinds;
        }finally{destroyWorld(w);}
    }
    assert.deepEqual(run(),run());
    for(const mode of ['team-elim','team-capture','team-respawn']){
        const w=fixture(mode);assert.equal(w.game.soloSupplies,undefined);destroyWorld(w);
    }
});

test('landing ring prediction, new compression and obstructed approach reject unsafe drops',()=>{
    const w=fixture(),g=w.game;
    try{
        g.frame=1500;g.ring.plan={...g.ring.plan,tick:1500,radius:800,cx:210,cy:-110,minRadius:0,
            compression:{start:1500,end:1548,amount:500,floor:180}};
        const future=w.brRingAdvance(w.brRingCopy(g.ring.plan),1680);
        scheduleSoloSupplies(w,g);
        const drop=g.combatSupply;assert.ok(drop);
        assert.ok(Math.hypot(drop.pos.x-future.cx,drop.pos.y-future.cy)+75<=future.radius);
        assert.ok(!g.checkWallCollision(drop.pos,75));assert.ok(!g.escapeBlocks(drop.pos,75));
        g.frame=drop.landAt;g.ring.plan.radius=24;
        updateSoloSupplies(w,g);assert.equal(g.combatSupply,null,'invalidated warning cancels at landing');
        g.frame=g.soloSupplies.nextCombat;scheduleSoloSupplies(w,g);assert.equal(g.combatSupply,null);
        g.ring.plan.radius=800;g.ring.plan.compression=null;g.walls=[new w.Wall(210,-110,2000,2000,0)];
        g.frame=g.soloSupplies.nextCombat;scheduleSoloSupplies(w,g);assert.equal(g.combatSupply,null,'bounded search gives up inside blocked terrain');
    }finally{destroyWorld(w);}
});

test('real tick → 3 s warning → atomic pickup, restore snapshot, buff replacement/expiry, XP reward and teardown',()=>{
    const w=fixture(),g=w.game,[p,q]=g.participants,notices=[];
    try{
        g.announceClassroom=(kind,data)=>notices.push({kind,...data});
        g.supplyDropSpawnFrame=1;g.soloSupplies.nextCombat=1;advance(w,1);
        const xp=g.supplyDrop,drop=g.combatSupply;assert.ok(xp&&drop);
        const wire=getTeacherState(w).farm;assert.equal(wire.c[3],drop.kind);assert.equal(wire.c[2],0);assert.equal(wire.s[2],0);
        p.hp=p.maxHp*.5;p.pos=new w.Vec2(xp.pos.x,xp.pos.y);advance(w,105);
        assert.equal(g.supplyDrop,null);assert.equal(p.run.level,2);
        assert.equal(p.run.xp,2-w.BR_RUN_XP[1]);near(p.hp,p.maxHp*.78);
        for(const who of [p,q]){who.pos=new w.Vec2(drop.pos.x,drop.pos.y);who.vel=new w.Vec2(0,0);}
        g.rebuildSpatialGrid();
        g.frame=drop.landAt-1;updateSoloSupplies(w,g);assert.ok(!p.combatBuff&&!q.combatBuff);
        g.frame=drop.landAt;updateSoloSupplies(w,g);updateSoloSupplies(w,g);
        assert.equal(g.combatSupply,null);assert.equal(p.combatBuff.kind,drop.kind);assert.ok(!q.combatBuff);
        assert.equal(notices.filter(e=>e.kind==='supply-incoming').length,1);assert.equal(notices.filter(e=>e.kind==='supply-claimed').length,1);
        assert.equal(p.combatBuff.end-g.frame,600);
        const mine=getVisibleState(w,p.remoteId);assert.equal(mine.self.supplyEnd,p.combatBuff.end);
        assert.equal(getVisibleState(w,q.remoteId).actors.find(a=>a.id===p.remoteId)?.supply,drop.kind);
        const hidden=g.isConcealedFrom;g.isConcealedFrom=(actor,viewer)=>actor===p&&viewer===q;
        assert.ok(!getVisibleState(w,q.remoteId).actors.some(a=>a.id===p.remoteId));g.isConcealedFrom=hidden;
        g.combatSupply={...drop,kind:'guard',landed:true};updateSoloSupplies(w,g);
        assert.deepEqual(p.combatBuff,{kind:'guard',end:g.frame+600,life:p.lifeSeq});
        p.lifeSeq++;assert.equal(activeSupply(p,g.frame),null);p.lifeSeq--;
        assert.equal(activeSupply(p,g.frame+600),null);
        g.frame+=600;advance(w,1);assert.equal(p.combatBuff,null);
        assert.ok(!Object.hasOwn(getVisibleState(w,p.remoteId).self,'supply'));
    }finally{destroyWorld(w);}
    assert.equal(g.combatSupply,null);assert.equal(g.soloSupplies,null);
    const again=fixture();assert.equal(again.game.soloSupplies.nextCombat,1500);assert.ok(!again.game.combatSupply&&!again.byId.get('p0').combatBuff);destroyWorld(again);
});

test('F III direct damage/pickup defense and TTK; indirect hits and environmental damage retain their own paths',t=>{
    const w=fixture(),g=w.game,[p,q]=g.participants;
    try{
        for(const a of [p,q]){a.spawnProtectionUntilFrame=0;a.run.paths={wanggui:3};w.brRecomputeRun(a);}
        assert.equal(q.maxHp,1440);
        const buff=(a,kind)=>a.combatBuff={kind,end:g.frame+600,life:a.lifeSeq};
        const hit=(ctx,attacker=p,reflected=false)=>{q.hp=q.maxHp;q.takeDamage(20,attacker,reflected,null,ctx);return q.maxHp-q.hp;};
        const base=hit({basic:true});near(base,97);
        buff(p,'attack');near(hit({basic:true}),140.65);near(hit({rw:true}),140.65);
        buff(q,'guard');near(hit({basic:true}),84.39);
        q.teamGuardFrames=5;q.teamGuardStrength=.8;near(hit({basic:true}),140.65*.55);q.teamGuardFrames=0;
        for(const ctx of [{periodic:true},{basic:true,visualPeriodic:true},{actionKind:'summon'},{rw:true,entity:{actionKind:'summon'}},{actionKind:'skill',supplyIndirect:true},{rw:true,style:'mushroom-impact'},{rw:true,ctx:{abilityId:'emoji-126'}}])near(hit(ctx),base);
        near(hit({attackKind:'zone'},null),20);near(hit({},p,true),20);
        p.combatBuff=null;
        // Actual health transitions. Neutral Lv1 coefficient20, FIII on both participants,
        // One direct hit every 30 ticks. Keep attacking after the buff expires.
        function untilKo(guarded){
            q.hp=q.maxHp;q.alive=true;q.deathHandled=false;
            if(guarded)buff(q,'guard');else q.combatBuff=null;
            let hits=0;
            while(q.alive&&hits<40){q.takeDamage(20,p,false,null,{basic:true});hits++;g.frame+=30;}
            return {hits,seconds:(hits-1)*.5};
        }
        const baseline=untilKo(false),guard=untilKo(true);
        assert.deepEqual(baseline,{hits:15,seconds:7});
        assert.deepEqual(guard,{hits:23,seconds:11}); // Guard expires after the first twenty hits.
        t.diagnostic(JSON.stringify({baseHp:q.maxHp,neutralCoefficient:20,FIII:base,attack:140.65,attackGuard:84.39,baseline,guard}));
    }finally{destroyWorld(w);}
});

test('haste changes normal walking rate only, respects the supply cap, and never weakens faster established movement',()=>{
    const w=fixture(),p=w.byId.get('p0');try{
        const base=w.brHumanMoveSpeed(p);p.combatBuff={kind:'haste',end:600,life:0};near(w.brHumanMoveSpeed(p),base*1.45);
        p.playerMoveBoostFrames=60;near(w.brHumanMoveSpeed(p),base*2);
        p.run.mods.moveSpeed=2;near(w.brHumanMoveSpeed(p),base*2*1.48);
        p.playerDash={dir:new w.Vec2(1,0),speed:18,remaining:120};assert.equal(getVisibleState(w,p.remoteId).self.dash.speed,18);
    }finally{destroyWorld(w);}
});

test('F III Brick fired basic single-hit KO sample across five fresh Lv1 defenders',t=>{
    const w=fixture(),g=w.game,p=w.byId.get('p0'),rows=[];
    try{
        p.run.paths={wanggui:3};w.brRecomputeRun(p);
        p.combatBuff={kind:'attack',end:600,life:p.lifeSeq};
        w.brBasicAttack(p,g,new w.Vec2(1,0));
        const shot=g.projectiles.at(-1);
        assert.equal(shot.inputKind,'attack');
        for(const [i,id] of ['emoji-150','emoji-149','emoji-028','emoji-001','emoji-052'].entries()){
            const ability=w.EMOJI_DB.find(a=>a.id===id);
            const q=new w.Participant(100+i,'Target',ability,new w.Vec2(200,0));
            Object.assign(q,{remoteId:'target'+i,lifeSeq:0,spawnProtectionUntilFrame:0});
            w.brInitRun(q);shot.hit(g,q);
            rows.push({id,hp:q.maxHp,damage:q.maxHp-q.hp,ko:!q.alive});
            near(q.maxHp-q.hp,Math.min(q.maxHp,shot.damage*4.85*1.45*((ability.sub==='WEAK'||ability.sub==='PAPER_THIN')?3:1)));
        }
        t.diagnostic(JSON.stringify({sample:'one confirmed fired FIII Brick basic, attack supply active',shotDamage:shot.damage,oneHit:rows.filter(r=>r.ko).length,defenders:rows.length,rows}));
    }finally{destroyWorld(w);}
});
