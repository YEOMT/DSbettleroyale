// A room publishes only public IDs and kinds. Names are resolved from the roster.
const priorities = {
    awakening: 3, 'first-blood': 3, streak: 2, 'supply-incoming': 2, 'supply-claimed': 1,
    'final-three': 4, compression: 4
};

export function classroomPriority(event) {
    return event.kind === 'streak' && event.kills >= 7 ? 3 : priorities[event.kind] || 0;
}

// Keep the most important events if several deaths and a drop share one pump.
// Old events cannot crowd out later events once the 2s visual lifetime expires.
export function recordClassroomEvent(game, kind, fields = {}) {
    const previous = game.classroomAnnouncements;
    const event = {seq: (previous?.seq || 0) + 1, frame: game.frame, kind, ...fields};
    event.priority = classroomPriority(event);
    const events = (previous?.events || []).filter(item => event.frame - item.frame < 120);
    events.push(event);
    if (events.length > 3) {
        let lowest = 0;
        for (let i = 1; i < events.length; i++) {
            if (classroomPriority(events[i]) < classroomPriority(events[lowest])) lowest = i;
        }
        events.splice(lowest, 1);
    }
    // Immutable between events, shared by all views and the transport encoder.
    game.classroomAnnouncements = {seq: event.seq, events};
}

export function announcePlayerKill(game, attacker, victim) {
    if (!attacker?.remoteId || !victim?.remoteId || attacker === victim ||
        attacker.isClone || victim.isClone || attacker.isReworkTurret || victim.isReworkTurret ||
        (attacker.team && attacker.team === victim.team)) return;
    const cause = victim.lastDeathCause;
    if (victim.alive || !cause?.lethal || cause.life !== victim.lifeSeq ||
        cause.source !== attacker.remoteId || ['zone','environment','unknown'].includes(cause.kind)) return;
    if (victim.announcedDeathLife === victim.lifeSeq) return;
    victim.announcedDeathLife = victim.lifeSeq;
    if (!game.firstBloodDone) {
        game.firstBloodDone = true;
        recordClassroomEvent(game, 'first-blood', {playerId: attacker.remoteId});
    }
    const kills = attacker.kills;
    if (kills === 3 || kills === 5 || kills === 7 || kills === 10) {
        recordClassroomEvent(game, 'streak', {playerId: attacker.remoteId, kills});
    }
}
