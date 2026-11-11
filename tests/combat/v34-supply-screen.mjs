// Run inside the shared four-student solo browser fixture.
import assert from 'node:assert/strict';
import {stepWorld} from '../../packages/engine/src/index.js';

export async function verifyCombatSupply(h) {
    const w=h.room.world, g=w.game, pages=[h.host,h.student];
    const id=await h.student.evaluate(()=>auditApp.ui.room.self.id);
    const student=w.byId.get(id), rival=w.byId.get(h.clients[0].session.playerId);
    const publish=async()=>{
        h.publish();
        await Promise.all(pages.map(page=>page.waitForFunction(seq=>auditApp.timeline.lastSeq>=seq,h.room.snapshotSeq)));
    };
    await Promise.all(pages.map(page=>page.evaluate(()=>{
        const renderer=auditApp.renderer, original=renderer.glyph;
        window.drawnSupplies=new Set();
        window.restoreSupplyDrawing=()=>{renderer.glyph=original;};
        renderer.glyph=function(icon,x,y,r,key,...rest){
            if(key==='combat-supply'||key.startsWith('supply-buff-'))drawnSupplies.add(key);
            return original.call(this,icon,x,y,r,key,...rest);
        };
    })));
    try {
        g.soloSupplies.nextCombat=g.frame+1;stepWorld(w);
        const drop=g.combatSupply;
        assert.ok(drop&&!drop.landed);
        student.pos=new w.Vec2(drop.pos.x,drop.pos.y);
        student.vel=new w.Vec2(0,0);student.warpSeq=(student.warpSeq||0)+1;g.rebuildSpatialGrid();
        await publish();
        await Promise.all(pages.map(page=>page.waitForFunction(kind=>
            auditApp.renderer.escapeMini?.combat?.[3]===kind &&
            drawnSupplies.has('combat-supply') &&
            document.querySelector('.br-classroom-banner')?.textContent.includes('보급 접근'),drop.kind)));
        for(let n=0;n<179;n++)stepWorld(w);
        assert.equal(g.combatSupply,drop);assert.ok(!student.combatBuff,'warning cannot be collected');
        stepWorld(w);
        assert.equal(g.combatSupply,null);
        assert.equal(student.combatBuff?.kind,drop.kind);
        assert.equal(student.combatBuff.end-g.frame,600);
        // Put the connected peer in view for the public buff icon packet. No
        // extra simulation step is needed or allowed between claim and capture.
        assert.ok(rival);rival.pos=new w.Vec2(student.pos.x+20,student.pos.y);
        const peerState=h.clients[0].next('SNAPSHOT',s=>s.actors?.some(a=>a.id===id&&a.supply===drop.kind));
        await publish();await peerState;
        await Promise.all(pages.map(page=>page.waitForFunction(actorId=>
            !auditApp.renderer.escapeMini?.combat && drawnSupplies.has('supply-buff-'+actorId) &&
            document.querySelector('.br-classroom-banner')?.textContent.includes('획득'),id)));
        const hud=await h.student.locator('#br-battle-status').textContent();
        assert.match(hud,/10초/);
        return {kind:drop.kind,warningTicks:180,buffTicks:600,hostAndStudentDraw:true,peerSeesBuff:true,hud};
    }finally{
        await Promise.all(pages.map(page=>page.evaluate(()=>{window.restoreSupplyDrawing?.();delete window.restoreSupplyDrawing;delete window.drawnSupplies;})));
    }
}
