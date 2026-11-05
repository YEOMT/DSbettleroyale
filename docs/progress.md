# Progress

## M0

- Latest main inspected: 1292f87528436e7182dcf066c6b9576d71c1cbed. No later user changes or local edits existed.
- Original Git bytes preserved in legacy/v32.1/index.html; root index.html unchanged.
- 793 top-level source units inventoried; 77 effective actor profiles, 60 registered reworks, native skill definitions, augments, rules and quiz data extracted after overrides.
- Real offline Edge harness executed all 77 basic/skill attacks and 180 simulation steps per character, with zero participant runtime faults.
- Node 24.22.1; npm 11.6.2 bootstrapped locally (not part of the repository). ws 8.22.1 / Vite 7.3.7 security patches pinned; Pixi stays 8.20.1. npm audit: zero known vulnerabilities.
- M1: 26 responsibility modules / 307 original source units extracted. Node create/step/export/destroy, 77-character attack parity, growth to level 6 with five choices, four mode paths (three public modes plus legacy compatibility), capture phase math, stale-input neutralization and two-room isolation implemented.
- Executed `node --test tests/unit/*.test.mjs tests/parity/*.test.mjs`: 88 passed, 0 failed. Detailed local output: artifacts/m1-tests.txt (not a classroom performance claim).
- Remaining M1 debt: separate cosmetic RNG consumption without changing original combat sequence; broader full-life and all-build parity. M2–M5 are in progress/unverified.

Production hosting credentials/domain were not provided; production is not deployed. No Firebase operations were performed.

## M2

- Real HTTP/ws room authority, strict protocol schemas, teacher authentication, zero-score draft, quiz scoring/locks, atomic reroll, bounded duplicate ledger, connection epochs and capability resume implemented.
- Executed five protocol/integration tests over real loopback TCP: all passed. Original engine/rule regression rerun: 90 passed. Initial Windows sandbox TCP attempt returned EACCES; the same suite passed with authorized local network execution.
- M2 browser UI wiring is pending M3/M4; no connection-only completion claim.

## M3

- Server owns 60 Hz combat with independent 20 Hz per-view snapshots, overload safe pause, short-shot lifecycle events, static arena and original full result/award builders.
- Modular client reuses original markup/CSS, emoji assets and battle painters; bundled Pixi 8.20.1 with Canvas fallback. Lobby, quiz TXT, QR, draft, reroll, growth offers, respawn quiz, three modes, results and rematch are wired.
- Executed: 90 unit/parity tests, 7 real-WebSocket integration tests and 3 Edge browser flow tests passed. Browser tests use three isolated contexts on one PC, not three devices; results were ended with the authorized teacher button.
- Inspected student capture screenshot. Remaining visual/continuity work and long load tests belong to M4. Public TLS, real mobile touch and classroom tests remain unverified.

## M4

- Added input replay boundaries, exact ordinary movement/wall prediction, life/warp reset, native/RW reliable terminals and short-shot trails, level texture styling, steering channels and explicit overload continuation.
- Added original 300/360-second capture timeout tests for 2/3/4 teams, growth/HP ratio/exclusion and awards checks. Unit/parity: 100 passed; real WS integration: 10 passed; Edge three-mode browser regression: 3 passed.
- Network lab: 26 connections, nine application-level RTT/jitter profiles and three stall durations passed. Raw diagnostics are in artifacts/network-lab.json. This is not OS packet loss or classroom Wi-Fi.
- Load development exposed a mixed-process benchmark bottleneck and a test-harness rematch race. Both failed reports are retained locally. Dedicated server process load matrix 20/26/30 × 600s is running; results are not yet PASS and will be recorded in the acceptance report.
- Remaining fidelity limitations (including legacy cosmetic RNG consumption, complete preview handoff and exhaustive all-build/forced-motion parity) remain explicit; no IMPLEMENTATION_COMPLETE claim yet.

## M5

- Added executable verify/boundary/build commands, CI with actual Node/WS/browser/load jobs, pinned Docker/Caddy configurations and guarded paired release/rollback workflows.
- Authenticated drain/seal and real timeout command passed: protected quiz/draft continue; timeout undrains; closing a room clears tokens/references.
- Actual local Caddy2.11.7 HTTPS/WSS test passed with a private test CA trusted only by the Node test subprocess; no Windows trust-store installation. Docker, public DNS/SSH/Pages deployment are unverified.
- Root index.html and remote main1292f875 remain unchanged. Production defaults disabled. Updated dev YAML parser to2.9.1 after audit finding; npm audit now reports0 vulnerabilities.
- Acceptance ledger lists all70 items individually. Implementation/visual fidelity and load performance gaps remain, so this work is a draft PR and does not claim IMPLEMENTATION_COMPLETE or PRODUCTION_READY.

## Final publication follow-up

- Restored release-to-cast and drag power, original weak aim assistance with server validation, viewport/aspect bounds and native/RW flight path interpolation. Removed unused per-tick projectile serialization and reused prepared public actor state.
- Executed latest `node tools/verify.mjs`: 116 passed, 0 failed, plus actual client/server build. Latest Edge E2E: 3 modes passed.
- Independent M5 clone: clean npm ci, verify/build and dev startup passed. Local Pages base/asset/query and Caddy HTTPS/WSS checks passed.
- Completed 20/26/30-player ten-minute cohorts. 20 functional PASS; 26/30 FAIL with 7/39 overload pauses. Final 26-player 30-second smoke PASS, 0 overloads. Step-p95 target remains unmet; see docs/metrics.
- GitHub write access restored. M0-M5 published with exact local/remote tree comparisons; Draft PR #1 created. No main push, force push, merge, Pages switch or Firebase write.
- User reports Lightsail Seoul and Docker/Compose ready. No AWS connection or public deployment performed. Settings and manual staging commands: docs/lightsail-ko.md.
- First remote CI run41462100837 passed npm ci,112 tests and build, then failed Playwright dependency installation on Ubuntu26.04. CI/release runner pinned to Ubuntu24.04; no browser test was reported as run in that failed job.
- Remote CI run41462916244 on source commit165e7b91425236a712fcdf0ab69031851d0dea64 completed SUCCESS: 116 tests, build, Chromium3-mode E2E and26-player20-second WS smoke (0 overloads; step p95 1.687ms; gap p95 53.313ms). This GitHub-runner smoke is not AWS or classroom capacity validation. Deployment shell syntax also passed bash -n.
- A later docs-only CI run41463518359 exposed an existing random-draft UI error: native characters intentionally have null rework skill records. Added explicit fallback to the original ability skill summary and an all77-description regression. Earlier successful CI remains historical evidence; the corrective commit is checked again by PR CI.

## v33.1 fidelity repair — stage 1

- Baseline main/deployed build: 352afbc4e91427812ad55432981a6ef79f778aa6. Root and legacy HTML remain unchanged.
- Actual two-browser WebSocket regression reproduced four failures before the fix: three empty effect/detail descriptions and six false stun stars. The same assertions pass after the fix.
- Restored original augment card hierarchy, exact effect/detail, selected stat-change notice, owned-chip detail and scoped pointer selection. Inactive stun/lock endpoints are zero; historical remote statuses use the historical snapshot and local status uses latest authority.
- Executed `PLAYWRIGHT_CHANNEL=msedge node tests/fidelity/contracts.mjs`: 63 possible cards (18 paths × I/II/III, Wanggui A/B/C/F) rendered with exact nonempty server text; five/MAX choices; ten real seconds without false self/opponent stun stars; 30/60-tick stun movement/attack blocking and display expiry. 30/60/120 FPS trace replay is simulated timing, not school hardware coverage.
- Executed `node tools/verify.mjs`: all 117 existing tests and client/server build passed. Broader visual, jitter/lifecycle and touch concurrency checks follow in the separate presentation commit. Existing load/acceptance limitations remain.

## v33.1 fidelity repair — presentation follow-up

- Added original native style/tail/rotation/skill emphasis, corrected RW glyph diameter and velocity contract, original-derived volley previews, authoritative per-ordinal handoff and cancellation, recorded-path terminal residuals and old-life effect rejection.
- Restored hit confirmation/hurt/squash, HP trail/name styling, cooldown/lock/shield information, original capture scoreboard classes/point information and result KDA/support fields. Fixed real-browser non-finite crate prediction coordinates.
- Executed: 123 verify tests and paired build; Edge 3-mode E2E; 63 actual WS augment cards and five choices; real 10-second idle and 30/60-tick stuns with separate input/display assertions; simulated FPS/jitter renderer replay; two-contact touch, duplicate/invalid choice, reconnect, respawn, results/rematch; Canvas and Pixi 13-case own/opponent visuals, reflection, basketball return and 12 titan ordinals. Native sample is pixel-identical to offline legacy; full-scene screenshots are visual comparison, not an equality claim.
- Evidence and original/new mapping: docs/fidelity-repair.md and docs/fidelity-evidence/. Existing 70-item counts and 26/30-player long-load failures are preserved. Real school hardware and full all-character visual equivalence remain unverified; remaining known display differences are listed explicitly.
- Manual existing-AWS paired update commands are in docs/fidelity-deploy-ko.md. No AWS deploy/restart, .env change, Firebase change, main push, force push or merge.

- Final Pixi inspection found shared Graphics primitives could be hidden by later emoji sprites. Confirmed hit/flash/KO effects now use a reusable foreground Graphics layer; a two-client assertion verifies it remains above sprites. Emoji sources use the original quality-specific cached raster. The 13-case Pixi suite and paired build passed again after this correction.
- Remote CI 41549507750 failed at the Pixi tennis display assertion after verify/build, E2E and Canvas fidelity passed; load smoke was skipped. Corrected visual fixture isolation (farm spatial index/cache/queues), clear reflection lanes for both players and actual 20 Hz snapshot pacing. Added separate server-reflection and own/opponent rendered-reflection assertions. Corrected Edge Canvas and Pixi 13-case suites both passed; no gameplay rule changed.

- Same-state original/WS HUD comparison exposed and fixed missing skill names/grade/reroll/map text, music-control overlap, objective arrow decoration/layout and the incorrect 60-second center-opening display. The actual rule remains 120 seconds. Reference now receives private growth/respawn state and asserts HUD text, capture timers and pooled arrow positions/directions against the offline original. The executed two-browser comparison passed; full-scene pixel equality remains unclaimed.

## v33.2 full fidelity audit

- Reconfirmed latest main `9619942fb55eb5a96c9d6fea69f76fc99d12bbf0`; preserved root/legacy HTML and combat/content/progression/mode numbers. Committed the original feature inventory before implementation on `codex/v33-2-full-fidelity-audit`.
- Restored original host bbox/easing/focus/capture camera, Canvas/Pixi host actors/native projectiles and Canvas host effects, student look-ahead/effect lifetimes/ring warnings, capture scene/HUD, role-specific original audio and source URLs, quiz clock/progress/feedback, lobby/draft/catalog/results/rankings. Added minimal private presentation metadata, server-authoritative deterministic draft recovery and scoped rematch ACK handling.
- Executed Windows Edge: verify 130 tests and paired build; 3-mode E2E; previous Canvas/Pixi fidelity suites; 9000 camera trace frames; 30 mode/backend/viewport layout cases; original DOM comparisons for 77 catalog/draft entries and 3 result modes; 15 rematches; 45/60/90-second real 20-WS quiz tests; 462 character/quality/backend rendering cases; 7 native host styles and host effect raster comparisons; actual original audio decoded playback and explicit injected-failure tests. Scope/limitations and raw evidence: `docs/fidelity-v33-2-evidence.md`.
- Completed actual WS 20-player 600-second test including one real Pixi student browser: 7 rounds, overload0, errors0, cleanup rooms/tokens/peers0; step p95 3.04ms, snapshot gap p95 62.62ms, browser frame p95 16.8ms, browser RTT p95 11.7ms. Recorded memory growth, aggregate bandwidth and projectile disappearance observations without treating them as visual/stability passes. School Wi-Fi/hardware, strict CPU target and previous 26/30-player long-load failures remain open.
- GitHub CLI authentication unavailable; published exact local trees through the authorized GitHub app to the work branch, with non-force expected-head checks. First remote CI41577063126 passed verify/E2E/Canvas fidelity, then failed the prior Pixi basic observation. Added actual lifeSeq/action barriers and retained early as well as late render frames; local 13-case Pixi rerun passed. No test count reduction.
- Public evidence strips cookies and signed media redirect paths. Local commands and manual AWS prerequisites are in `docs/fidelity-v33-2-runbook.md`. No AWS deployment/restart, main merge, .env/password/Firebase changes or paid resources.

- PR #3 opened at https://github.com/YEOMT/DSbettleroyale/pull/3. CI41579133485 repeated the Pixi basic failure despite retaining early frames. Downloaded artifacts showed first-client native rendering and both spawn events, but the second software-WebGL page missed the short lifetime while the fixture kept stepping. Added a snapshot-consumed render barrier for both actual pages after each manual publication and an explicit software-WebGL test option. Gameplay and assertions stay unchanged; performance remains measured separately by the real-time load harness.

- Local software-WebGL 13-case suite passed. Split CI into independent verify/E2E/load, fidelity, screen/quiz audit and per-renderer roster jobs so slow WebGL cannot prevent starting the other required checks. Each roster job retains all77 characters and all3 quality levels (231 each,462 total). YAML/coverage and script syntax checks passed; complete CI links are maintained on PR #3 rather than creating a self-triggering docs commit after every run.

## CI-only completion follow-up

- Confirmed final run41581493038: verify/fidelity/Canvas succeeded; Pixi roster and audit were cancelled at35 minutes, without a failing gameplay assertion. Pixi low completed; the combined camera audit reached Pixi1024 normal before cancellation.
- No game/runtime/content/deployment files changed. Pixi roster now has independent low/balanced/high jobs (77 each); Canvas keeps all231 cases. Camera is partitioned by renderer and viewport (6 jobs,9000 total trace frames), layout by renderer and mode (6 jobs,30 total viewport cases), and lobby/host-effects/surface/screens/quiz each have their own job. Every original assertion and local unfiltered default remains. Added partition completion counts and four CI coverage/selector/trigger tests.
- Feature branches now run CI only on pull_request; push is restricted to main. This removes duplicate work-branch push/PR runs. A final required-checks job rejects any failed/cancelled/skipped prerequisite. Artifact names include each partition; the audit runner creates its output directory for independent execution.
- Targeted local CI tests (4/4), script syntax and diff checks passed. The full mandatory jobs are executed on PR #3; their final links/results are recorded in the PR description. No new gameplay audit, feature work, main merge or AWS deployment.
# ReleaseOps / Fast CI follow-up

- Latest main confirmed: `206aaee4bca23d639769134bc86773fb3214ec1e`; existing v33.2 gameplay/content/protocol/legacy/root HTML preserved.
- Quick/targeted CI and manual Deep Audit separated; exact SHA artifact provenance, variant builds, staging isolation, approval-only paired promotion, retained-artifact rollback and interrupted-transaction recovery implemented in existing release paths.
- Actual local timings, infrastructure failures and targeted reruns: [releaseops-validation.md](releaseops-validation.md). One-time configuration and daily workflow: [releaseops-ko.md](releaseops-ko.md).
- AWS version read only: existing server reports `206aaee4...`. No AWS/Pages/Firebase mutation. New deployment path remains BLOCKED_CONFIGURATION until bootstrap, environment secrets and first-transition approval are supplied.


## Integrated combat recovery (2026-11-04)

Base 4a9ee7574a82af9f18f62de4e50a36de2d5142ae. B01–B10 causes, T01–T11 coverage, times, screenshots and before/after host trace: [combat-recovery.md](combat-recovery.md). ReleaseOps pairing retained. Public AWS only queried; no deployment. Physical-device late-game hitch remains unverified. See PR for exact-head CI results.

## Camera, attack feedback and smooth controls (2026-11-05)

PR #5 is present in base ef84ca5. Real mouse and release-direction failures reproduced; 30/60/120Hz correction, teacher framing, bounded confirmed sprite feedback, actual WS controls and renderer recovery exercised. Local Quick 10.86s, then 6 focused regressions for the CI movement edge fix, paired build 4.41s and healthy local version match. The focused team-elim E2E passed in 8.4s after preserving all three sessions with a smaller rival viewport. Each of the three renderers retained zero pose/sprite/texture entries after receiving the new lobby. Before/after replay and continuous-play measurements, failures and unverified devices are in [camera-feel-smooth-control.md](camera-feel-smooth-control.md). Final GitHub job timings are recorded on the work-branch PR. No public rollout.

## Mobile touch lock and combat impact (2026-11-05)

Base a5e0568 includes PR #5/#6. Battle-scoped native/Safari gesture policy, differentiated bounded melee/recoil/contact and action sound, and a reproduced private-HTTP request UUID failure are handled together. No engine/content/protocol/server/root/legacy change. Quick 159 checks 10.95s, subsequent LAN-specific8 checks0.37s, Targeted141.20s, Chromium native multi-touch77.66s, WebKit scoped tap/policy8.35s, continuous three-screen Canvas8.73s/Pixi11.26s and final paired build passed. Before/after real videos/metrics, initial test failures, exact scope and remaining configuration: [mobile-touch-impact.md](mobile-touch-impact.md). User reports improved feel on physical iPhone Chrome; individual device checklist remains unverified, physical Safari/iPad/Android NOT_RUN. Final exact-head full Quick/combat CI status is maintained in the PR. No public rollout, main merge or Firebase mutation.

- PR #7 first CI found a confirmed contact expiring before the first busy Pixi paint; a bounded display-only clock correction passed16 focused regressions and real Pixi3-screen replay. Mobile touch fixture now uses the existing fixed capture arena (79.90s local PASS). WebKit apt mirror download hit the10min limit; only Canvas recovery uses the matching official preinstalled Playwright image. Final exact-head results remain on PR #7.

- Run42039701647: Quick162/Python11, Targeted, Canvas recovery and both continuous jobs PASS; Pixi recovery FAIL on the fifth viewport movement assertion. Reproduced its failure condition at the capture boundary with valid native touch/server input. The fixture now moves inward and measures authority displacement while both fingers are still held, before the legitimate melee step. No game code/assertion/timeout removal. Physical iPhone Chrome feedback remains user-reported improvement only; final exact-head CI and related rerun time are recorded in PR #7.

- Run42042188021: Pixi recovery also PASS; Pixi continuous FAIL at ~383ms software-GPU frame spacing with recording. Forced SwiftShader locally reproduced a missing contact with recording; the same three surfaces and all assertions passed without recording in13.28s. Only Pixi CI video encoding is removed; Canvas CI and existing hardware Pixi videos remain. No runtime changes or longer effect deadlines. Final exact-head CI is recorded in PR #7.
