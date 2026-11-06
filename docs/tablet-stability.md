# Student tablet / late-game stability

Base: `0816f1caf796dda66e8a651c72b3356f800c1985` (latest main, includes PR #7).
Work branch: `codex/tablet-late-stability`. No AWS, Pages or Firebase changes.

## Status

Implemented and locally checked, with explicit unresolved limits below; **not a physical-classroom or production sign-off**. The identical-condition late-game fixture and normal20/26/30-player capture pass. Extended-health full-30 stress still overloads; Windows WebKit has poor frame cadence. GitHub CI results are shown by the PR checks, separately from these manual measurements. Field/AWS metrics are user-provided observations, not a measurement of this checkout. CPU burst credit alone cannot distinguish a blocked event loop, snapshot preparation, network delay or browser rendering.

## Measurement boundaries

- `tools/load/run.mjs`: existing real WebSocket capture load and natural combat/respawn/rematch; dedicated server process. Private load telemetry adds per-window CPU, event-loop delay, GC, debt, bounded stall records, queue sizes and object counts. An overload remains FAIL even when the harness resumes it to finish the observation window.
- `tools/load/tablet.mjs`: real WS student Pixi, student Canvas and host Pixi on one PC. Thirty participants remain connected; the dedicated late-game fixture begins with six alive, then selects five at 60s and three at 360s. Extended health/refill sustains a 600+ second fight without changing production rules. Attack/cooldown/physics/network/render paths remain live. The separate capture fixture extends all 30 players' health and is an extreme stress case, not natural capture deaths/respawns. This is not proof of physical tablet performance.
- `tools/load/snapshot-bench.mjs`: identical deterministic world and full six-level progression; state generation / recipient filtering / JSON encoding separately. Compares 30 participants with 6/5/3 alive and an initially five-player match.
- No production test endpoints or real classroom identifiers/logs. Raw artifacts and CPU profiles stay in ignored `artifacts/tablet-stability/`; publish aggregate measurements only.

## Executed checks

| Check | Result | Actual duration / evidence |
|---|---|---|
| Quick common checks | PASS | 12.56s; 169 unit/parity/integration tests plus module/YAML boundaries |
| Paired client/server build | PASS | 8.25s; unchanged root legacy page |
| Targeted | PASS | 126.86s; three modes lobby→results→rematch, Canvas/Pixi representative visuals, responsive layout, renderer resource lifetime,26-player30s load |
| 30 connected / 6→5→3 alive, three surfaces | PASS | 622.45s including setup/rematch;606.40s actual simulation, overload0/errors0, cleanup0/0/0 |
| Pristine main, same late-game fixture | FAIL | 613.46s; four overloads,519.72s simulated, failed600s assertion; rematch NOT_RUN |
| Natural capture20 / 26 / 30 | PASS | Each605s combat observation, three rounds; wall607.87 / 605.30 / 605.32s; overload0/errors0, cleanup0/0/0 in all three |
| Initially five players, low/balanced/high | PASS | Before58.38s / after58.22s fixture elapsed; no overload, cleanup verified |
| Extra full-30 extended-health capture matrix | FAIL | Before60.63s / after60.55s fixture elapsed; overload6→1, no threshold relaxation |
| Snapshot subphase benchmark | PASS execution | 23.13s before /20.75s after; numerical results below, exact JSON/privacy checked by Quick |
|26-client network jitter and stalls | PASS |35.47s; nine RTT/jitter profiles and300/500/1500ms FIFO stalls over real TCP/WS; not OS packet loss |
| Actual blocked TCP receiver + resume | PASS | Included in Quick; another student moves; the same slow student resumes movement and actually fires attack/skill |
| Browser recovery Pixi | PASS |27.54s; reload/socket replacement, same identity, movement/actions, low/balanced/high orbit visibility on three screens, expiry/rematch |
| Live Pixi input with snapshot jitter | PASS |8.14s; every movement edge applied, no idle drift, attack/skill fired, errors0/overload0 |
| Live Pixi attack/impact on three screens | PASS |11.89s; slash/heavy/recoil/burst/orbit/field, two rematches, retained effects/poses/contacts0 |
| Chromium Pixi mobile viewports | PASS |79.91s; five sizes, native CDP multitouch, viewport scale, cancellation/recovery, rotation/resize and rematch |
| Windows WebKit Canvas input policy | PASS |10.99s; five sizes and handler/lifecycle regressions; native WebKit pinch NOT_RUN |
| Windows WebKit three-surface20s combat | PASS functionality only |38.61s wall; poor frame cadence, **not** a smoothness PASS; details below |
| Samsung Android / physical mobile WebKit / classroom Wi-Fi / AWS | NOT_RUN | No accessible physical device now; no production changes |

No final required local suite ended in TIMEOUT or INFRA_FAILURE. A first WebKit attempt failed with `SCOPE_MISMATCH` (9.07s): the private seed fixture changed matchId and immediately sent the next command before the browser received ROOM_STATE. The harness now waits for each browser's actual new scope; the failed artifact is retained and only that test was rerun. No version/scope guard or runtime code was changed for this fix. Passed600s cases were not repeated for the test-only synchronization change.

The20-player natural capture case includes one actual student Pixi browser (1366×768,DPR1), ending at frame p95 16.9ms;26/30 use synthetic WS students. Snapshot counts were241861/326511/374853, gap p95 62.53/62.75/62.63ms. Final30-player snapshot CPU p95/max12.40/29.08ms and whole-pump p95/max22.16/57.43ms. These loopback measurements are not school-network bandwidth estimates. The CI planner's default `notRun:600s-load` means it does not select that long suite automatically; the explicit manual runs above did execute.

The lifetime fixture found100 retained drop labels and one unreleased level source before, versus zero after; all owned renderer counts return to zero. Its final execution is included in Targeted (6.05s process wall,0.82s fixture). Eight focused unit/integration regressions also passed earlier (0.97s); the final common suite retains them.

Physical environment: user identified Samsung Android, but cannot run a device test now. Exact model/browser remain unspecified. Physical results are NOT_RUN. The previous iPhone Chrome feedback concerned PR #7 and is not evidence for this patch.

## Identical-condition late-game comparison

Pristine main runtime hash `f37428a21c195e20e677d00ab707f055fb404bbd84f64e2316f62a5cd5fdc798`; proposed runtime hash `40ee818b757a755b398f1182081f94123bb8d4d779deb4eb3f5fd98da4929ec3`. The same fixture, seed, PC and three browser surfaces were run serially. Overload pauses cause later simulation times/trajectories to diverge; this is a reproducible system comparison, not an isolated GPU benchmark or identical frame-by-frame replay. The table's server metrics end at `continuous-end`, before the separate rematch; whole-run elapsed time includes setup/cleanup/rematch as indicated.

| Measure | Pristine main | Proposed code |
|---|---:|---:|
| Outcome / overloads | FAIL / 4 | PASS / 0 |
| Actual simulated combat at the end | 519.72s | 606.40s |
| Whole run including setup/teardown | 613.46s | 622.45s, including rematch |
| Snapshot gap p95 / max | 82.63 / 29197ms | 62.15 / 145.21ms |
| Logical text bytes sent, all peers | 11.26GB | 4.48GB |
| At 80s, five alive: host/student Pixi draw p95 | 17.8 / 16.5ms | 9.7 / 8.3ms |
| At 80s: host/student/Canvas frame p95 | 33.3 / 33.3 / 33.3ms | 16.8 / 16.8 / 16.8ms |
| At 350s, five alive: host/student Pixi draw p95 | 13.7 / 15.7ms | 4.6 / 6.3ms |
| At 590s, three alive: host/student Pixi draw p95 | 13.9 / 14.8ms | 4.9 / 5.7ms |
| At 590s: host/student/Canvas frame p95 | 33.4 / 33.4 / 33.4ms | 16.9 / 16.9 / 16.9ms |
| At 590s: retained host/student labels | 16 / 10 | 5 / 2 |

The transition is still `normal` / particle cap70 at six alive, `broadcast` / cap170 at five and three. At the first baseline overload, five of 30 participants remained alive, particles74/170, buffered/queued/pending snapshot bytes0, simulation debt2202.66ms and event-loop max1330.64ms in the enclosing observation window. GC max was6.29ms in that window. This local incident does not support blaming GPU work, a full particle cap, a slow receiver or GC alone. Sampling found synchronous socket writes and snapshot/event fan-out expensive; the browser separately repeated static geometry and text raster work. The user's AWS incidents remain unconfirmed.

In the approximately30-second active window ending at80s (no pause in either run), server CPU was71.52% → 38.35% of one logical core; transport writev calls44702 → 25935, WS frames44702 → 29960, text bytes647.57MB → 234.70MB. The sample combines all proposed changes and is not a per-change attribution. Student DOM mutations in that window were11253 → 3506; Timeline p95 0.30 → 0.20ms with no Timeline implementation change. Actual balanced resolution stayed1.5 with antialiasing enabled. Student GPU p95 2.76 → 2.25ms in that window; other windows vary, so this does not establish a mobile GPU improvement.

After-change selected student Pixi heap samples were42.3MiB at5s,94.1MiB at170s,108.0MiB at350s and88.4MiB at590s. The heap cycles rather than growing monotonically; these samples are not a heap-retention proof. At590s, textures52 / sprites55 / labels2 / tracks3; lobby reset returns owned renderer counts to0. The explicit 100-drop lifetime regression proves that the previously retained labels and level texture sources are released.

All p95/p99 values use the existing bounded ring (last4096 observations; per-window probes reset between samples). Counts/means/maxima accumulate across each probe window or entire server run as appropriate. Paused baseline windows must not be read as smooth continuous gameplay. The three browser surfaces share one PC/browser process, so their simultaneous frame stalls are not independent physical-device measurements. Snapshot arrival intervals and ping RTT include browser scheduling and loopback delivery, not measured school Wi-Fi latency.

Both identical-condition long runs recorded replacedSnapshots0; the field count8204 was not reproduced here. The separate actual blocked-TCP test exercises receiver isolation, bounded queues, forced resync and resumed actions. It does not establish why the user's classroom accumulated replacements.

## Short quality and serialization measurements

Initially five players, three live browser surfaces, 12s per quality plus warmup/rematch: baseline58.38s and proposed58.22s fixture elapsed. Both PASS, no overload. The 30-connected / five-alive case above has more recipients than this initially-five case; it still performs more server fan-out work, while both final fixtures keep frame p95 near16.9ms.

| Quality | Student Pixi draw p95 before → after | Host Pixi draw p95 before → after | Student Canvas draw p95 before → after |
|---|---:|---:|---:|
| low | 8.7 → 4.9ms | 8.5 → 4.8ms | 1.5 → 1.3ms |
| balanced | 11.3 → 7.3ms | 10.5 → 6.5ms | 1.6 → 1.8ms |
| high | 19.4 → 8.2ms | 18.5 → 7.4ms | 3.4 → 2.1ms |

High-quality frame p95 was33.6ms → 16.9ms for the two Pixi surfaces. Canvas balanced draw did not improve; no across-the-board GPU claim is made.

The extra full-30 extended-health capture matrix remains **FAIL**, overload6 → 1 (60.63s → 60.55s fixture elapsed). In its12s low/balanced/high student windows, text texture builds fell7812/8100/7128 → 13/17/12. This directly verifies removal of repeated constant text-style invalidation. Pauses and the existing host automatic balanced fallback differ between these failed runs, so their frame rates are not a successful continuous-play comparison. All30 attackers surviving with extended HP is a separate capacity limit; the normal20/26/30 capture tests use actual damage, deaths, respawns and rematches.

Deterministic snapshot benchmark:1200 snapshots per case, real six-level progression, identical JSON values, UTF-8 conversion included on **both** revisions, no sockets/rendering. Mean is teacher + preparation + all recipient view/encode means, not a sum of p95 values. Benchmark wall time was23.13s before / 20.75s after.

| Participants / alive | Mean total student snapshot work before → after | Student bytes per snapshot before → after |
|---|---:|---:|
| 30 / 30 capture | 1.912 → 1.646ms | 393973 → 393973 |
| 30 / 6 survival | 4.896 → 3.294ms | 310156 → 187747 |
| 30 / 5 survival | 5.671 → 4.558ms | 310292 → 183765 |
| 30 / 3 survival | 5.424 → 4.393ms | 310609 → 173987 |
| 5 / 5 survival | 0.821 → 0.798ms | 32757 → 32757 |

Earlier exploratory snapshot timings omitted UTF-8 conversion on the string implementation and are superseded by `*-snapshot-fair.json`; they are not used for a CPU improvement claim.

## Unresolved limits / non-passing items

- **FAIL:** full-30 extended-health capture still triggers one startup overload on this PC. No overload guard, attack information, event or assertion was removed. It is an extra stress fixture, distinct from the three passing natural capture runs, but remains an open capacity limit.
- **WebKit performance is not accepted:** Windows Playwright WebKit functional combat/rematch/cleanup passes on both pristine main (37.32s fixture) and proposed code (37.72s). At20s, host/student Pixi/student Canvas frame p95 is201/266/244ms before versus181/257/233ms after. GPU timers and JS heap measurement are unavailable there. The poor cadence also exists on main, and its cause was not isolated; do not label it a fixed mobile WebKit problem or a proven infrastructure-only issue.
- **NOT_RUN:** physical Samsung Android (model/browser not supplied, user unavailable), physical iOS/iPadOS WebKit, native WebKit pinch, actual classroom Wi-Fi, AWS reproduction/public deployment. Short quality matrices do not replace ten-minute low/high device runs. Previous PR #7's iPhone Chrome feedback is not evidence for this patch.
- Rare stalls remain in the passing desktop late-game run: step max112.67ms, snapshot max116.51ms, send max126.66ms, pump max129.06ms. The overload count is zero, but zero stutter is not claimed. The p95 improvement and bounded cleanup do not prove zero memory leaks for every character/device.

This is a review candidate, not an assertion that every field symptom is resolved. The runtime source hash stayed unchanged after the passing600s tests; subsequent edits only synchronized the private WebKit seed fixture and published evidence. Production, Pages and Firebase were not accessed or changed.

Aggregate evidence with raw-artifact SHA-256 is in [evidence/tablet-stability](evidence/tablet-stability/). `regression-checks.json` records actual command times and the retained failed first WebKit attempt. Status on a benchmark artifact means its correctness/cleanup assertions passed, not a physical-device FPS certification. The original raw synthetic reports remain ignored local artifacts; no student records, live credentials or classroom logs are committed.

## Runtime changes and limits

- Main changed paths: `apps/client/src/render/{renderer,capture-scene,host-actors,original-scene}.js`, `apps/client/src/ui/{app,battle,dom-write}.js`; `apps/server/src/simulation/runner.js`, `apps/server/src/ws/{peer,snapshot,presentation-state,handler}.js`, `apps/server/src/diagnostics/metrics.js`; `packages/protocol/src/server-events.js` and `apps/client/src/net/connection.js`. `main.js` only passes the public upgrade socket transport to Peer. Tests and `tools/load/*` contain the private fixtures/instrumentation.
- Cache unchanged Pixi smoke geometry; keep the same background/grid/smoke/arena layer order, shapes and alpha. Dynamic attacks, hazards and aim guides remain live. Reuse host name glyph rasters across at most 2% font-size changes while preserving exact displayed size through scale. This can scale the text outline by up to 2%; it does not change emoji resolution or gameplay coordinates.
- Capture labels initialize constant text styles once. Identical HUD text/style/attributes are no longer repeatedly written, including values immediately overwritten by the action HUD. Updates still occur on each received state and the original timer.
- Destroy expired drop labels and own level textures through the renderer cache; clear actor/name/level/glow sprites and tracking when actors leave the view; destroy Pixi children and textures on Canvas fallback. Shared emoji/glow sources remain bounded caches.
- Retire public dead bodies after the 750ms fade plus a 250ms interpolation margin. Keep every participant, private self/respawn state, owned projectile, zone, event and full leaderboard. Death/life state is scoped to the world in a WeakMap.
- Batch sends within the existing simulation pump, without a timer. Consecutive reliable events use outbound `EVENT_BATCH` (maximum 64 events / 32KiB); each original envelope keeps its scope and cursor and passes through the existing client guards. Inbound command validation is unchanged. Reliable history remains individual messages; snapshots remain latest-only. Exact buildId pairing is required, as before.
- Serialize the common event payload once. Snapshot actor/shot/common JSON is UTF-8 encoded once per snapshot and copied into exact, recipient-specific JSON text messages. No coordinate rounding, compression or missing fields. Measure preparation **plus encoding and send**; the smaller new `stepCpu`/`snapshotCpu` alone is not an end-to-end improvement claim because synchronous flush time was included before and is now reported separately in `sendCpu`/`pumpCpu`. CPU percentages in paused windows also include the paused interval and cannot be compared as active-combat throughput.
- Add bounded server send/pump/debt metrics; private test instrumentation records GC, event-loop stalls, process CPU/memory, queue/buffer sizes and object counts at overload. No public diagnostic route or student data upload.

No engine/content/gameplay numbers, physics rate, snapshot rate, overload threshold, input policy, graphics profile, DPR, anti-aliasing or FPS target is changed. Timeline was measured but not rewritten: its desktop p95 was around 0.3ms and its histories were bounded. This does not establish mobile GPU or GC behavior.

The quality matrix changes the profile after initialization, as the existing UI does: requested low/balanced/high uses DPR1/1.5/2 and emoji source128/256/512. The already-created WebGL context keeps antialiasing enabled even when the requested low profile says false. Actual context attributes are recorded; the low results are not a no-antialiasing GPU measurement. No unmeasured mobile graphics downgrade is applied.

## Rejected experiments / evidence limits

All experiment failures remain in ignored local artifacts. Standard permessage-deflate was tried both with and without event grouping: it reduced synchronous send cost but caused seconds of student command delay under this workload. It is disabled in the proposed code. UTF-8 and event grouping experiments are checked for exact JSON values, private scope, reliable order, duplicate/late guards and real TCP backpressure.

Early browser fixtures accidentally placed 30 participants on six repeated coordinates. Their failures are recorded as extreme overlapping-spawn stress, not used as an identical-condition improvement comparison. Corrected placement uses 30 distinct positions. The dedicated late-game fixture creates the requested six survivors immediately; the extra full-30 extended-health stress remains separately reported. Natural capture uses the existing load harness with normal HP, damage, deaths, respawn quiz, growth and rematch.

Exploratory records retained locally:8s telemetry smoke PASS; initial natural30-player605.02s capture PASS (different instrumented hash, excluded from the exact baseline comparison); overlapping-spawn survival623.35s FAIL/13 overloads; intermediate batching/compression probes FAIL. Final conclusions use the pristine-main and proposed runtime hashes listed above, not those incompatible earlier fixtures.

Local machine: Windows, Node 24.22.1, Intel i5-1340P (16 logical processors), 15.57GiB RAM, installed Edge; three simultaneous 1024×768 touch-capable browser contexts at deviceScaleFactor 2. Actual renderer resolution/profile/GPU timer availability are recorded per window. Host capture's existing automatic balanced mode is reported, not suppressed or mislabeled as fixed high quality.

## Commands

```sh
node tools/ci/plan.mjs origin/main
npm run quick
npm run build
npm run test:targeted
node tools/load/tablet.mjs --players=30 --mode=solo --seconds=605 --label=after-late
node tools/load/tablet.mjs --players=5 --mode=solo --seconds=12 --matrix=true --label=after-five
node tools/load/run.mjs --players=20 --seconds=605 --rematchSeconds=360
node tools/load/run.mjs --players=26 --seconds=605 --rematchSeconds=360
node tools/load/run.mjs --players=30 --seconds=605 --rematchSeconds=360
node tools/network/run.mjs
node tests/combat/session.mjs pixi
node tests/combat/live-control.mjs pixi
node tests/combat/live-feel.mjs pixi
node tests/combat/mobile-touch.mjs pixi
node tests/combat/mobile-touch.mjs canvas webkit
node tools/load/tablet.mjs --players=5 --seconds=20 --engine=webkit
```

Use `PLAYWRIGHT_CHANNEL=msedge` with installed Edge on Windows; omit for installed Playwright Chromium. `tablet.mjs --engine=webkit` uses installed Playwright WebKit, not physical Android/iOS. Run performance cases serially; concurrent benchmarks distort server/browser attribution. `--dense=true` retains the extra overlapping-spawn extreme case. Tests use private IPC, never production HTTP or WS fixture routes.
