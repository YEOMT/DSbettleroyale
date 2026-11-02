// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.brWirePlayer = function brWirePlayer(p) {
            var respawn=p.respawnAtFrame?Math.max(0,(p.respawnAtFrame-__brScope.game.frame)/60):0;
            return [
                p.remoteId||('player-'+p.id),p.name,Number(p.abilityIndex||0),
                Math.round(p.pos.x*10)/10,Math.round(p.pos.y*10)/10,
                Math.max(0,Math.round(p.hp)),Math.round(p.maxHp),p.alive?1:0,Number(p.team||0),
                Number(p.kills||0),Number(p.deaths||0),Math.max(0,Math.round(p.basicCooldown||0)),
                Math.max(0,Math.round(p.cooldown||0)),Number(p.skillUsesLeft||0),
                Math.round(respawn*10)/10,Number(p.radius),p.humanControlled?1:0,
                __brScope.game&&__brScope.game.getCoverTypeAt?__brScope.game.getCoverTypeAt(p.pos):'',
                Math.round(Number(p.vel&&p.vel.x||0)*100)/100,Math.round(Number(p.vel&&p.vel.y||0)*100)/100,
                Math.max(1,Math.round(Number(p.basicCooldownMax||1))),Math.max(1,Math.round(Number(p.skillCooldownMax||p.maxCooldown||1))),
                __brScope.brHumanMoveSpeed(p),
                (p.stunned>0?1:0)|(p.dashFrames>0?2:0)|(p.playerMoveBoostFrames>0?8:0)|(p.playerAttackHasteFrames>0?16:0)|(p.invisible?32:0)|(p.finalPhaseBoosted?64:0),
                Number(p.lastInputSeq||0),Math.max(0,Number(p.stunned||0)),Math.max(0,Number(p.dashFrames||0)),Number(p.warpSeq||0),
                Number(p.resolvedAttackSeq||0),Number(p.resolvedSkillSeq||0),Number(p.firedAttackSeq||0),Number(p.firedSkillSeq||0),p.ability.id
            ];
        };
}
export const initializers=[

];
