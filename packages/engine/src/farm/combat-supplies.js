// All deadlines are authority frames. One random stream per match keeps supply
// placement independent of combat rolls and ordinary farm waves.
const kinds = ['attack', 'haste', 'guard'];
const warning = 180, groundLifetime = 720, buffLifetime = 600;
const clearance = 75, approach = 100;

export function initSoloSupplies(r, g) {
    if (r.session?.roomMeta?.mode !== 'solo') return;
    g.soloSupplies = {
        random: r.brHashRandom(r.session.roomMeta.seed + '|' + r.matchId + '|supplies'),
        nextCombat: 1500, lastKind: null
    };
}

function landingRing(r, g, frames) {
    if (!g.ring?.plan) return g.ringGeometry;
    const plan = r.brRingCopy(g.ring.plan);
    return r.brRingAdvance(plan, plan.tick + frames);
}

function validGround(g, pos, ring, radius) {
    return ring && Math.hypot(pos.x - ring.cx, pos.y - ring.cy) + radius <= ring.radius
        && !g.checkWallCollision(pos, radius) && !g.blocksCoverEntry?.(pos, radius)
        && !g.escapeBlocks?.(pos, radius);
}

function accessible(r, g, pos, ring) {
    if (!validGround(g, pos, ring, clearance)) return false;
    // A character-sized approach corridor, swept against the actual walls and
    // crates, keeps the pickup reachable even behind rounded/rotated cover.
    const walls = r.brHostBodyWalls(g);
    const end = new r.Vec2(0, 0);
    for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        end.x = pos.x + approach * Math.cos(angle);
        end.y = pos.y + approach * Math.sin(angle);
        if (validGround(g, end, ring, 45) && !r.combatTraceWalls(pos, end, 45, walls)) return true;
    }
    return false;
}

function chooseGround(r, g, fallFrames, isXp) {
    const ring = landingRing(r, g, fallFrames);
    if (!ring || ring.radius <= clearance) return null;
    const random = g.soloSupplies.random;
    const radius = Math.min(ring.radius - clearance, isXp ? 720 : g.worldRadius);
    const other = isXp ? g.combatSupply : g.supplyDrop;
    for (let attempt = 0; attempt < 48; attempt++) {
        const angle = random() * 2 * Math.PI, distance = Math.sqrt(random()) * radius;
        const pos = new r.Vec2(ring.cx + distance * Math.cos(angle), ring.cy + distance * Math.sin(angle));
        if (other && Math.hypot(pos.x - other.pos.x, pos.y - other.pos.y) < 160) continue;
        if (g.participants.some(p => p.alive && p.pos.dist(pos) < p.radius + clearance)) continue;
        if (accessible(r, g, pos, ring)) return pos;
    }
    return null;
}

function chooseKind(schedule) {
    const choices = schedule.lastKind ? kinds.filter(kind => kind !== schedule.lastKind) : kinds;
    return schedule.lastKind = choices[Math.floor(schedule.random() * choices.length)];
}

export function scheduleSoloSupplies(r, g) {
    const schedule = g.soloSupplies;
    if (g.aliveRealPlayers.length < 2) return;
    if (g.frame >= g.supplyDropSpawnFrame) {
        g.supplyDropSpawnFrame = g.frame + 4500;
        if (!g.supplyDrop) {
            const pos = chooseGround(r, g, 105, true);
            if (pos) {
                g.supplyDrop = new r.SupplyDrop(pos);
                r.brFarm.changed(g);
                g.announce('SUPPLY DROP', 90);
            }
        }
    }
    if (g.frame < schedule.nextCombat) return;
    schedule.nextCombat = g.frame + 1500;
    if (g.combatSupply) return;
    const pos = chooseGround(r, g, warning, false);
    if (!pos) return;
    const kind = chooseKind(schedule);
    g.combatSupply = {pos, kind, landAt: g.frame + warning, expires: g.frame + warning + groundLifetime, landed: false};
    r.brFarm.changed(g);
    g.announceClassroom?.('supply-incoming', {supply: kind});
}

export function activeSupply(player, tick) {
    const buff = player?.combatBuff;
    return buff && player.alive && player.lifeSeq === buff.life && tick < buff.end ? buff : null;
}

export function updateSoloSupplies(r, g) {
    const xp = g.supplyDrop;
    // A newly scheduled compression or a moving wall can invalidate the
    // announced landing. Cancel that wave instead of moving it without notice.
    if (xp && (xp.fallFrames === 1 || g.frame % 30 === 0)
        && !accessible(r, g, xp.pos, landingRing(r, g, Math.max(0, xp.fallFrames)))) {
        g.supplyDrop = null;
        r.brFarm.changed(g);
    }
    const drop = g.combatSupply;
    if (!drop) return;
    const remaining = drop.landAt - g.frame;
    if (g.frame >= drop.expires || ((remaining === 0 || g.frame % 30 === 0)
        && !accessible(r, g, drop.pos, landingRing(r, g, Math.max(0, remaining))))) {
        g.combatSupply = null;
        r.brFarm.changed(g);
        return;
    }
    if (remaining > 0) return;
    if (!drop.landed) {
        drop.landed = true;
        r.brFarm.changed(g);
    }
    let picker = null, best = Infinity;
    for (const p of g.getNearbyParticipants(drop.pos, Math.max(150, g.maxBodyRadius + 43))) {
        if (!p.alive || !p.remoteId || p.id === 999 || p.isClone || p.cloneOwner) continue;
        const distance = p.pos.dist(drop.pos);
        if (distance >= p.radius + 43 || distance > best || (distance === best && p.id >= picker.id)) continue;
        if (g.checkWallBetween(p.pos, drop.pos)) continue;
        best = distance;
        picker = p;
    }
    if (!picker) return;
    picker.combatBuff = {kind: drop.kind, end: g.frame + buffLifetime, life: picker.lifeSeq};
    g.combatSupply = null;
    r.brFarm.changed(g);
    g.announceClassroom?.('supply-claimed', {supply: drop.kind, playerId: picker.remoteId});
}

export function supplyDirectHit(attacker, target, reflected, ctx) {
    if (!attacker || attacker === target || !attacker.remoteId || attacker.id === 999 || attacker.isClone
        || attacker.cloneOwner || attacker.isReworkTurret || reflected || ctx?.reflected || ctx?.periodic
        || ctx?.visualPeriodic || ctx?.secondary || ctx?.entity?.actionKind === 'summon'
        || ctx?.actionKind === 'summon' || ctx?.attackKind === 'zone' || ctx?.supplyIndirect
        || ctx?.style === 'skill-zone-burst' || ctx?.style === 'mushroom-impact') return false;
    if (ctx?.rw && !ctx.basic && ctx.ctx?.abilityId === 'emoji-126') return false; // Ground pin trap.
    return !!(ctx?.basic || ctx?.actionKind === 'attack' || ctx?.actionKind === 'skill'
        || ctx?.rw || attacker._runSkillCast || attacker.currentImpactStyle);
}
