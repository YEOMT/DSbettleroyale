# Residual ground damage audit (U08)

Baseline `dd331fd` uses final v35 overrides, not the earlier native/legacy values. One multiplication of eligible combat input by 1.10. Implementation: `combat/ground-damage.js`, called after final registration. Native combat inputs are multiplied at the tick; rework coefficients at registration. No modifier on restoration or general `periodic` damage.

| ID / character | Active path | Base coefficient before → after | Unchanged portions |
| --- | --- | --- | --- |
| 000 용의 분노 | s-rank fireball → R.zone fire | zoneDamage 12.6 → 13.86 | impact79.8,5ticks/150frames, radius150 |
| 007 폴아웃 | nuclear-pulse → R.zone radiation | zoneDamage10.5 → 11.55 | initial86.1/death30,5ticks/150frames |
| 010 블랙홀 | gravity-field → R.zone gravity | damage10.815 → 11.8965 | collapse63.86,7ticks/210frames,pull/radii |
| 014 역병군주 | growing-poison → R.zone poison | damage14.42 → 15.862 | growth110→310,10ticks/300frames |
| 122 통조림 투척 | thorn-pot → R.zone thorns | thornDamage3.99 → 4.389 | blast11.55,4ticks/120frames,radius122 |
| 144 버섯돌보미 | trap trigger → custom poison entity | poisonDamage4 → 4.4 | trigger20,6ticks/180frames,radius90, owner/tick max rule, players-only policy |
| 031 스컹크 대쉬 | native spawnTrailZone → Zone dmg | 6.3×owner.damageMult×run.damage → ×1.10 | finisher1.12,15tick cadence,170/194frames,5zone cap |
| 128 먹물 대쉬 | native spawnTrailZone → Zone dmg | 5.4×.78×owner.damageMult×run.damage → ×1.10 | finisher1.12,15tick cadence,144/165frames,3zone cap, blind/slow |

Native ticks retain their existing power ordering and turret target policy. R.zone keeps the original coefficient separately for `brFarm.area`; farm durability/XP are unchanged. Mushroom remains player-targeted; no turret target is added. Body-attached poison/bleed, void channel, rotating swords, flying projectiles, direct and final explosions, bombs/mines, zero-damage ice trails, spotlight/traffic, reflection and ring/environment damage are excluded. Unreachable legacy zone definitions are not rewritten.

Verification to be recorded under D01–D07: actual cast/tick inputs, defence/shields, enhanced contexts, lifespan/tick count, direct/final exclusions, native turrets, farming and 86-entry allowlist. This path inventory is not itself a PASS.
