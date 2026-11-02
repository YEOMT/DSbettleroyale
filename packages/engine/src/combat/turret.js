// Extracted from v32.1. Room-scoped bindings; see docs/source-map.json.
export function install(__brScope){
__brScope.Turret = class Turret {
            constructor(owner, pos) {
                this.runSkill=owner?._runSkillCast||(owner?.dashFrames>0?owner._runLastSkill:null)||__brScope.brRunSkillSnapshot(owner);
                this.owner = owner; this.pos = new __brScope.Vec2(pos.x,pos.y);
                this.isGolden = owner.ability.sub === 'GOLDEN_TURRET';
                this.life = Math.round((this.isGolden ? 430 : 400)*this.runSkill.duration);
                this.cooldown = 0; this.shotCount = 0;
            }
            update(game) {
                if(!this.owner.alive){this.life=0;return;}
                this.life--;
                if(this.cooldown > 0) this.cooldown--;
                else {
                    let target = game.findNearest(this.pos, this.owner);
                    const range = this.isGolden ? 500 : 350;
                    if(target && this.pos.dist(target.pos) < range && !game.checkWallBetween(this.pos, target.pos)) {
                        this.shotCount++;
                        this.cooldown = this.isGolden ? 34 : 45;
                        const lead = this.isGolden ? target.pos.add(target.vel.mult(5.5)) : target.pos;
                        let dir = lead.sub(this.pos).norm();
                        if(this.isGolden) {
                            const heavy = this.shotCount % 4 === 0;
                            game.projectiles.push(new __brScope.Projectile(
                                this.owner, this.pos, dir,
                                heavy ? 8.6 : 9.6,
                                (heavy ? 15 : 8.5) * this.owner.damageMult,
                                heavy ? 10 : 7,
                                'missile', '#fbbf24', heavy ? 48 : 0, null,
                                {trailColor:'#fde68a', impactColor:'#fbbf24', knockback:heavy?12:6, vfx:'star',runSkill:this.runSkill}
                            ));
                            if(heavy) game.addText(this.pos, '✨ GOLD SHOT!', '#fde047', 20, 20);
                        } else {
                            game.projectiles.push(new __brScope.Projectile(this.owner, this.pos, dir, 7, 6*this.owner.damageMult, 5, 'bullet', '#cbd5e1',0,null,{runSkill:this.runSkill}));
                        }
                    }
                }
            }
            
        };
}
export const initializers=[

];
