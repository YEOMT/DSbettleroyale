# v35.5 balance before / after

Base a916726 (v35.4), solo Lv1 without augments. Coefficients are before target defense; recorded body/derived profiles are final runtime values. See [exact values](evidence/balance-runtime.json) and the frozen [86-roster baseline](../../tests/v35-5/baseline.json).

| ID / character | HP before → after | walking speed before → after | basic frames before → after | basic coefficient before → after | skill frames before → after |
|---|---|---|---|---|---|
| emoji-092 팬테옹 | 268.7895 → 268.7895 | 4.039875 → 4.039875 | 59 → 52 | 13.92 → 22.24908 | 480 → 480 |
| emoji-075 사과 투척 | 329.13 → 329.13 | 4.039875 → 4.039875 | 48 → 48 | 12 → 12 | 480 → 480 |
| emoji-094 크레파스 난사 | 243.1905 → 243.1905 | 4.039875 → 4.039875 | 37 → 37 | 9.84 → 9.84 | 1035 → 1035 |
| emoji-148 도깨비 | 332.27502 → 332.27502 | 6.48648 → 6.48648 | 45 → 45 | 22.24908 → 22.24908 | 600 → 600 |
| emoji-121 청소반장 | 474.991365 → 474.991365 | 5.466334 → 5.466334 | 49 → 49 | 22.24908 → 22.24908 | 480 → 480 |
| emoji-137 BB 스나이퍼 | 257.8185 → 257.8185 | 4.039875 → 4.039875 | 59 → 59 | 20.4 → 20.4 | 1080 → 1080 |
| emoji-023 헤드슈터 | 349.2801 → 349.2801 | 4.838962 → 4.838962 | 44 → 44 | 24.48 → 24.48 | 720 → 720 |
| emoji-074 슬리퍼 스나이퍼 | 243.1905 → 243.1905 | 4.039875 → 4.039875 | 68 → 68 | 8.16 → 8.16 | 420 → 420 |
| emoji-039 다이너마이트 | 353.51 → 353.51 | 4.039875 → 4.039875 | 56 → 56 | 16.2 → 16.2 | 660 → 660 |
| emoji-072 탄산 폭탄 | 274.275 → 274.275 | 4.039875 → 4.039875 | 51 → 51 | 16.2 → 16.2 | 540 → 540 |
| emoji-122 통조림 투척 | 292.56 → 292.56 | 4.039875 → 4.039875 | 63 → 63 | 12.96 → 12.96 | 540 → 540 |

## Approved skill and growth deltas

| Path | Before | Final v35.5 |
|---|---|---|
| Pan | ranged basic; 48f deferred counter | actual melee; rangeBonus100, half-angle1.1rad, no basic stun; 72f ±120° one-contact parry, 28% reduction, CD480f; original shot return or `min(55,20+.4*HP loss)` melee counter, force4 |
| Apple | one wall bounce, two shards | first enemy/crate/wall/range termination; one set of8, seeded360°, coefficient8/radius10.5/speed24/range250, max2 per target-life; original22.05/19/790/20.8/CD480 unchanged |
| Crayon | four native stun shots, D=3.15 before player/run multipliers | red1.6D; blue.85D + .75 movement90f; yellow.8D +21f once/cast/target; green.8D +4 damage each30f ×4, max1 refreshed stack. Extra colors cycle, ordinary basic unaffected |
| Goblin | 180f 15%HP shield + ×1.20 attack rate | same plus first valid hostile basic grants27f stun once; no miss/crate proc, CD600 unchanged |
| Sweep | range235,width210,push27 | range335,width300,push42; damage14,windup10f,CD480f unchanged |
| BB / Head / Slipper | skill velocity32 /90 /38 |65 /105 /55; coefficients36.04 /80.56 /25.44; crit40 /50 /30%; CD1080 /720 /420f; Head preparation24f unchanged |
| Dynamite | outer205/inner92/flight48f |245/105/42f; coefficient30.45/center49.35,CD660f unchanged |
| Soda | blast220,coefficient19.95 |255,22; push25,CD540f unchanged |
| Can | blast78/thorn122 |100/145; direct11,thorn4.389 every30f,120f,one zone,CD540f unchanged (v35.4 ×1.10 NOT applied again) |
| GIANT |1.385/1.715/2.10 |1.80/2.60/3.40 actual basic radius, same cap; original velocity.95/1/1.055 unchanged |
| RAPID ranged |1.44/1.825/2.43 |1.60/2.15/2.75 |
| RAPID melee |1.55/2/2.5 |1.70/2.30/3.00; both retain damage.90/.95/1.055; actual6-tick floor under stacked haste |
| WIDE |1.35/1.75/2.2 |1.60/2.25/3.00 distance; +6/12/20° half-angle capped110°; original attack-rate.95/1/1.055 unchanged |

Different paths retain the original additive deviations-from-one combination. For example, legal RAPID III + GIANT II gives ranged attack rate2.75 and radius2.60, with the existing damage1.055. III+III is impossible with the normal five-choice budget; artificial MAX unit cases are explicitly separate. Live20 runs use exactly five choices (II+II then one III). Measured cadence is rounded to server frames and clamped at6f, not an automatic-fire feature.

[165 probes per version](evidence/balance-probes.json): identical seed/input,11 changed kits × Lv1/3/6 × one S/A/B/C/F opponent, up to600 engine ticks (10s) each. Real damage, first-hit frame, kill frame (null=no kill), event count and object samples are retained. Targets do not attack and knockback remains active: this is a reproducible mechanics probe, not a classroom win-rate or aiming-accuracy estimate. Pan's return is covered separately with incoming native/rework shots, shield and physical dash contacts. All86 immutable mechanics projections are checked against individually pinned approved leaves; the other75 kits and other growth paths remain unchanged.
