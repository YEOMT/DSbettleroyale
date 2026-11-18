# v35.5 ability baseline

Final runtime at a916726; native null skill definitions use ability + player-input/Participant. Complete numeric records: tests/v35-5/baseline.json.

| ID | Type / actual basic | HP / radius | Basic frames / coefficient | Skill kind / cooldown |
|---|---|---|---|---|
| emoji-092 | PROJ / ranged | 268.789500 / 39.900 | 59 / 13.920000 | counter-deferred / 480 |
| emoji-075 | PROJ / ranged | 329.130000 / 38.000 | 48 / 12.000000 | split-bounce / 480 |
| emoji-094 | PROJ / ranged | 243.190500 / 36.100 | 37 / 9.840000 | native / 1035 |
| emoji-148 | MELEE / melee | 332.275020 / 38.000 | 45 / 22.249080 | goblin-shield / 600 |
| emoji-121 | PROJ / melee | 474.991365 / 43.092 | 49 / 22.249080 | directional-sweep / 480 |
| emoji-137 | PROJ / ranged | 257.818500 / 35.720 | 59 / 20.400000 | native / 1080 |
| emoji-023 | PROJ / ranged | 349.280100 / 45.600 | 44 / 24.480000 | sniper / 720 |
| emoji-074 | PROJ / ranged | 243.190500 / 36.100 | 68 / 8.160000 | precision / 420 |
| emoji-039 | PROJ / ranged | 353.510000 / 34.200 | 56 / 16.200000 | lob / 660 |
| emoji-072 | PROJ / ranged | 274.275000 / 38.000 | 51 / 16.200000 | soda-bomb / 540 |
| emoji-122 | PROJ / ranged | 292.560000 / 38.000 | 63 / 12.960000 | thorn-pot / 540 |

Runtime routes: registry.installRules sorts legacy/rework initializers then applyGroundDamage and applyRosterText. other-ranks registers reworks; native094/137 stay in player-input and Participant. R.register applies BR_V32_SKILL_FIELDS. Basic eligibility derives from final basic.close. profiles.brAimSpec and growth.brRunMeasured feed self profile revisions/cards. Projectile/reflection handle authority contact; rendering consumes wire identity and shot lifecycle. generate.mjs regenerates manifest/display/hash and roster text audit.

Baseline main CI44064002326 FAIL: isolated-release warning-injection lifecycle after resumeMove; ordinary isolated lifecycle passed against dd331fd candidate. Canvas WebKit target crashed during teardown, no conclusion of gameplay cause. Paired candidate44066196876 PASS. Public production /version buildId d6b4525bf22bfa000a09eb686dffc5736bc5a3b3/contentHash8f4cf38107b74bfd8c37e32f80016c48d8265bc5b883cdf4914b08d427f77bdb read-only; no deployment performed.

Known retained risks: v35.4 Pixi software-GPU stalls, winner application delay3357ms, one intermittent timeout, full-population CPU/p95 signals, prior long-run RSS unresolved, real devices unavailable.
