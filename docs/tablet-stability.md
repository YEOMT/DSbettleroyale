# Student tablet / late-game stability

Base: `0816f1caf796dda66e8a651c72b3356f800c1985` (latest main, includes PR #7).
Work branch: `codex/tablet-late-stability`. No AWS, Pages or Firebase changes.

## Status

IN PROGRESS. The final late-game and natural capture measurements are running. Extended-health 30-player stress still reproduces overload and is not marked PASS. Field/AWS metrics are user-provided observations, not a measurement of this checkout. CPU burst credit alone cannot distinguish a blocked event loop, snapshot preparation, network delay or browser rendering.

## Measurement boundaries

- `tools/load/run.mjs`: existing real WebSocket capture load and natural combat/respawn/rematch; dedicated server process. Private load telemetry adds per-window CPU, event-loop delay, GC, debt, bounded stall records, queue sizes and object counts. An overload remains FAIL even when the harness resumes it to finish the observation window.
- `tools/load/tablet.mjs`: real WS student Pixi, student Canvas and host Pixi on one PC. Thirty participants remain connected; the dedicated late-game fixture begins with six alive, then selects five at 60s and three at 360s. Extended health/refill sustains a 600+ second fight without changing production rules. Attack/cooldown/physics/network/render paths remain live. The separate capture fixture extends all 30 players' health and is an extreme stress case, not natural capture deaths/respawns. This is not proof of physical tablet performance.
- `tools/load/snapshot-bench.mjs`: identical deterministic world and full six-level progression; state generation / recipient filtering / JSON encoding separately. Compares 30 participants with 6/5/3 alive and an initially five-player match.
- No production test endpoints or real classroom identifiers/logs. Raw artifacts and CPU profiles stay in ignored `artifacts/tablet-stability/`; publish aggregate measurements only.

## Executed / pending

- PASS: 30-player telemetry smoke, 8 seconds; no errors/overload, cleanup verified by the load harness.
- PASS: before-change natural 30-player capture, 605.02 seconds / 3 rounds, overload0; step p95 12.94ms, snapshot p95 35.14ms, gap p95 72.56ms, 11.24GB received across all clients; cleanup rooms/tokens/peers0. This synthetic loopback test is not a physical Wi-Fi bandwidth result.
- FAIL reproduced: before-change dense browser survival, 623.35 seconds including rematch; 13 overloads. 30 → 6 → 5 → 3 survivors observed, but pauses mean it is **not** a successful 600-second continuous combat run. At five alive, recorded overload debt661.6ms, particles42/170, queued bytes0. No evidence justifies lowering the particle cap.
- PASS: initially five-player before-change low/balanced/high browser matrix (58.38s). Dense capture matrix remains FAIL; qualities are restored after the teacher CONTINUE command so its room-state message cannot overwrite the requested test quality. Actual host automatic-quality behavior is recorded separately.
- MEASURED before / PASS candidate: 100 retired drop labels and one level source remained before; zero remained after. A lifetime fixture, not an FPS claim.
- PASS: three focused unit regressions for same-pump reliable order/latest snapshot, slow-receiver isolation/bounds and public corpse retirement with private self/life data retained (0.47s).
- FAIL candidate: initial batching/text cleanup did not eliminate dense capture overloads. Added bounded transport/CPU instrumentation to diagnose the remaining cost. No overload threshold or simulation rate was changed.
- PASS: final corrected 605-second browser late combat plus rematch (622.45s total), 30 connected / 6→5→3 alive, actual simulated time606.40s, overload0, errors0, cleanup rooms/tokens/peers0. Identical pristine-main baseline: FAIL (613.46s total), overload4, simulated time519.72s, so it failed the 600-second simulation assertion and did not reach its rematch step. At the first overload: 5 alive / 30 participants, particle74/170, queued/buffer bytes0, simulation debt2202.66ms. This is not proof that the user's AWS incidents had exactly the same cause.
- PASS: eight focused unit/integration regressions including actual blocked TCP, another student's movement, same student's resume/move/attack/skill, UTF-8 exactness/privacy, event-batch bounds and duplicate/old-scope rejection (0.97s).
- NOT_RUN: final 20/26/30 natural capture runs, jitter browser regression, Quick/Targeted/paired build, physical tablet/WebKit.

Physical environment: user identified Samsung Android, but cannot run a device test now. Exact model/browser remain unspecified. Physical results are NOT_RUN. The previous iPhone Chrome feedback concerned PR #7 and is not evidence for this patch.

## Runtime changes and limits

- Cache unchanged Pixi smoke geometry; keep the same background/grid/smoke/arena layer order, shapes and alpha. Dynamic attacks, hazards and aim guides remain live. Reuse host name glyph rasters across at most 2% font-size changes while preserving exact displayed size through scale. This can scale the text outline by up to 2%; it does not change emoji resolution or gameplay coordinates.
- Capture labels initialize constant text styles once. Identical HUD text/style/attributes are no longer repeatedly written, including values immediately overwritten by the action HUD. Updates still occur on each received state and the original timer.
- Destroy expired drop labels and own level textures through the renderer cache; clear actor/name/level/glow sprites and tracking when actors leave the view; destroy Pixi children and textures on Canvas fallback. Shared emoji/glow sources remain bounded caches.
- Retire public dead bodies after the 750ms fade plus a 250ms interpolation margin. Keep every participant, private self/respawn state, owned projectile, zone, event and full leaderboard. Death/life state is scoped to the world in a WeakMap.
- Batch sends within the existing simulation pump, without a timer. Consecutive reliable events use outbound `EVENT_BATCH` (maximum 64 events / 32KiB); each original envelope keeps its scope and cursor and passes through the existing client guards. Inbound command validation is unchanged. Reliable history remains individual messages; snapshots remain latest-only. Exact buildId pairing is required, as before.
- Serialize the common event payload once. Snapshot actor/shot/common JSON is UTF-8 encoded once per snapshot and copied into exact, recipient-specific JSON text messages. No coordinate rounding, compression or missing fields. Measure preparation **plus encoding and send**; the smaller new `stepCpu`/`snapshotCpu` alone is not an end-to-end improvement claim because synchronous flush time was included before and is now reported separately in `sendCpu`/`pumpCpu`. CPU percentages in paused windows also include the paused interval and cannot be compared as active-combat throughput.
- Add bounded server send/pump/debt metrics; private test instrumentation records GC, event-loop stalls, process CPU/memory, queue/buffer sizes and object counts at overload. No public diagnostic route or student data upload.

No engine/content/gameplay numbers, physics rate, snapshot rate, overload threshold, input policy, graphics profile, DPR, anti-aliasing or FPS target is changed. Timeline was measured but not rewritten: its desktop p95 was around 0.3ms and its histories were bounded. This does not establish mobile GPU or GC behavior.

## Rejected experiments / evidence limits

All experiment failures remain in ignored local artifacts. Standard permessage-deflate was tried both with and without event grouping: it reduced synchronous send cost but caused seconds of student command delay under this workload. It is disabled in the proposed code. UTF-8 and event grouping experiments are checked for exact JSON values, private scope, reliable order, duplicate/late guards and real TCP backpressure.

Early browser fixtures accidentally placed 30 participants on six repeated coordinates. Their failures are recorded as extreme overlapping-spawn stress, not used as an identical-condition improvement comparison. Corrected placement uses 30 distinct positions. The dedicated late-game fixture creates the requested six survivors immediately; the extra full-30 extended-health stress remains separately reported. Natural capture uses the existing load harness with normal HP, damage, deaths, respawn quiz, growth and rematch.

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
```

Use `PLAYWRIGHT_CHANNEL=msedge` with installed Edge on Windows; omit for installed Playwright Chromium. `tablet.mjs --engine=webkit` uses installed Playwright WebKit, not physical Android/iOS. Run performance cases serially; concurrent benchmarks distort server/browser attribution. `--dense=true` retains the extra overlapping-spawn extreme case. Tests use private IPC, never production HTTP or WS fixture routes.
