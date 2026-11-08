# Progress

## Student tablet / late-game stability (2026-11-06, review candidate)

Started from latest main `0816f1c`, preserving merged PR #7. Cached static rendering, stopped repeated text/HUD writes, cleaned renderer resources and reduced server serialization/socket fan-out while preserving gameplay and exact build pairing. Candidate 30-connected / 6→5→3-alive combat: PASS, 622.45s total,606.40s actual simulation, overload0; identical main: FAIL, four overloads,519.72s simulation. Natural20/26/30 capture each605s and three rounds: PASS, errors0/overload0/cleanup0. Quick169 tests (12.56s), paired build (8.25s), Targeted (126.86s), jitter, actual blocked TCP/resume and live Pixi input/effects/touch regressions passed. Extended-health full-30 stress remains FAIL (one overload); Windows WebKit cadence is poor on both revisions, and physical Samsung Android is unavailable. No all-field-symptoms-resolved or production-ready claim. [tablet-stability.md](tablet-stability.md) and its aggregate evidence distinguish PASS/FAIL/NOT_RUN and exact times; GitHub CI is reported separately by PR checks. No deployment occurred.

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

- Run42044235776: Pixi continuous TIMEOUT after apt15.8MB/9m24s; same-head failed-jobs retry passed continuous98s. Recovery touch5sizes passed twice but representative5 reached the aggregate540s deadline twice (TIMEOUT). Split touch into an independent suite, retaining session/aim/representative and continuous checks. All6 combat matrix jobs use the matching preinstalled Playwright image; unchanged10min cap and mandatory gate. Related11 CI policy tests0.36s PASS. No new game change or Deep Audit; exact-head completion remains in PR #7.

- Run42048409760: both recovery/touch, Canvas continuous, Quick and Targeted PASS; Pixi continuous FAIL on a364ms first contact. CI now partitions attacker/opponent/host Pixi roles, each with three real clients and every existing assertion; other two roles use Canvas in that partition. All three Pixi roles are required and actual renderer asserted. Local default still uses three simultaneous Pixi screens. Forced-software role runs12.42/13.54/13.15s and policy11 tests0.36s PASS. No runtime changes; final8 combat/11 total CI jobs tracked in PR #7.

## Roster10, approved balance and host readability (2026-11-07, in progress)

- Base eb7c454f000223811fb17f99e2e22da01a220e81 includes merged PR #8. Work branch codex/roster10-balance-host. Full accepted specification: [roster10-spec.md](roster10-spec.md). No AWS/Pages/Firebase changes.
- Runtime registers all ten IDs 141–150; explicit frozen pre-patch median stats, bounded decoy/self-grapple/mushroom/poison/ring-wall, revisioned temporary obstacles and shared host display geometry are under focused validation. Current runtime manifest generation is separate from immutable legacy extraction.
- Executed: four content/real-WS tests PASS in 1.55s (all ten assignment/input/basic/skill/cooldown/resume/refire/rematch and original77 approved-only data differences). Balance ten tests PASS in 0.443s. Broader Quick, selected browser checks and long loads remain pending; implementation is not yet declared complete.
- Fresh main 30-connected short late-game baseline (45s, alive6→5 at15s→3 at30s) FAIL: three overloads; total68.84s. Raw artifacts/roster10/before-late.json. Keep this result alongside candidate, without selecting only favorable runs. PR #8 extreme30 stress failure remains unresolved; physical Samsung Android/classroom Wi-Fi NOT_RUN.
- User-confirmed Lightsail size: 2vCPU,1GB RAM,40GB SSD. Docker resource limits unknown; local Windows benchmark is not a measured AWS resource replica.

## Roster10 integrated submission validation (2026-11-07)

- All ten IDs141–150, approved balance and host readability are integrated in one work branch; PR #8 optimizations retained. Full requirement/status matrix and final values: [roster10-report.md](roster10-report.md), [roster10-engine.md](roster10-engine.md), [roster10-balance.md](roster10-balance.md).
- Quick204 total checks14.913s, Targeted147.393s, new Pixi10×3screens32.549s, focused Canvas persistent4×3screens16.096s, T08 1,008 fixed scenes98.72s and real moving Canvas4-case evidence executed. Video export-order failure was fixed and original13.6s recording recovered/validated; no unrelated gameplay rerun. Final selected CI policy7 tests0.292s PASS. Final paired-build and exact-head CI results are maintained in the PR body to avoid documentation-only CI loops.
- T10.A candidate same-condition late45 PASS versus main initial FAIL3; T10.B mixed20/605seconds PASS0overload/3rounds/2rematch cleanups; initial20 attempt FAIL1 retained. T10.C30connected/newpersistent/605seconds observation FAIL10overloads: only461.8seconds of actual simulation, mandatory600-second assertion failed. Final reference cleanup0. No stability-complete claim; submit for review with this unresolved performance limitation prominently recorded.
- Physical Samsung Android/classroom Wi-Fi NOT_RUN; prior PR8 extreme30 FAIL retained. User AWS2vCPU/1GB/40GB known, Docker quotas unknown. No AWS deployment, main merge, official Pages or Firebase changes. Local runtime sourceHash e84b2a93e0c73520d4d0b374ecbe864b97eee82d16a02e032217ff19e8235349; contentHash fd780afb06e75dfb6dab229bc5fbc1a1ae5bfedf7cd6eff688dd41bdf3ce7e68.

## Limited performance follow-up (2026-11-07, stopped at specified limit)

- Base main3c4d94d includes PR9. Preserve all ten characters, approved balance and host readability. Only runtime change: reuse immutable private aim/visual profile UTF-8 in snapshot.js; exact wire values/bytes and 60Hz/20Hz/overload policy unchanged.
- Short75 baseline FAIL (battle1 + rematch1 overload,94.016s); candidate PASS0 (92.969s), same30/new roster/three surfaces/balanced/profiled. Exact JSON/lifecycle/real WS3 checks PASS0.468s. Alternating same-state encode benchmark improves mean27–30%, not an end-to-end claim.
- Candidate605 requested once: FAIL1 overload at18.083s absolute/16.917s excluding setup. No CONTINUE; browser execution context lost and observation stopped at342.502s (additional measurement INFRA_FAILURE, cause unconfirmed). Actual5/3-alive continued battle and result/rematch NOT_RUN. Final room/token/peer cleanup0. Unconfirmed stall cause means no second long test under the accepted stop rule; verdict **additional correction needed**, not AWS candidate sign-off.
- Quick222 total PASS15.783s; new-roster26 capture30s PASS0overload/0errors (31.685s command wall); actual Pixi recovery/actions/three screens PASS27.861s. Existing CI retained; final SHA/checks/build pairing recorded in the follow-up PR. See [one-page report](performance-followup.md). Physical devices/AWS NOT_RUN; existing extreme30 failure remains open. No deploy or merge.

## Runtime performance A/B/C patch (2026-11-07)

- Based on current main056f75e; PR11 not assumed merged. Runtime changes: reliable scoped profile revisions, cached Pixi floor/grid/outline, authoritative pause cancellation and full-state/epoch recovery. Existing engine/content numbers,87 roster,60Hz/20Hz and overload thresholds unchanged; protocol engine revision rejects mismatched pairs.
- Same-state actual WS240snapshots+24private replies:1,465,515→1,000,861 bytes, includes5 reliable profile updates, all264 hydrated self rows equal. Pixi static300frames rebuild300→1;15exact pixel comparisons PASS. Canvas Path2D attempt FAIL and2fixture INFRA_FAILUREs preserved; Canvas runtime reverted to original drawing. Moving host draw had no improvement claim.
- Local Quick232 PASS17.357s; paired build7.770s. Source hash b37abee13184641abcbc5330c532f1fce5d08d6752ccf8f92f9e4e1eb28da7e6. Pause7WS PASS1.632s and actual3screen/refresh/resume/CONTINUE/move/attack/skill/touch/end/rematch PASS7.786s. Canvas recovery CI now includes this regression once.
- Candidate deploy-bundle75s pair PASS0overload, actual75.033/75.017s; same input hash31peers. PriorPR11 failure preserved. First20 active browser wire/CPU did not decrease; exact-state benchmark isolates actual profile saving. See report for both conditions, no paused-vs-active byte comparison.
- Final605 requested ONCE: FAIL1 overload at actual429.017–429.133s, after6→5→3. Immediately stopped without CONTINUE, total437.855s; no rerun. This long run results/rematch NOT_RUN; shutdown rooms/tokens/peers0. Same-PC cause remains unresolved; not a classroom stability sign-off. No AWS/Pages/Firebase/main changes.
- [Implementation, complete timings, failures and evidence](runtime-performance-fix.md). Final SHA and required GitHub CI recorded in PR body to avoid documentation-only CI loops. Physical Samsung/classroom/AWS and full87visual matrix NOT_RUN.

## Official Pages cutover preparation (2026-11-07)

- User approved production transition and explicitly accepted known intermittent overload risk. No new performance/classroom gate. Exact selected main1514ae3 / candidate42379534896 confirmed success; staging was skipped.
- Public preflight: actual AWS0816f1c oldpair,health200; Pages still original Firebase HTML SHA256a006aa...; exact Pages-Origin WSS welcomes existingpair and rejects newpair mismatch. Copied published HTML and verified its referenced assets using existing verify-pages. Remote Docker/config and complete Pages publishing source/settings backup remain NOT_RUN without access.
- Actual candidate download found1 sealed hidden example missing;629 present filechecksums passed. Recovered example from exact selected sourceSHA and verified sealedhash; no rebuild or checksum bypass. Future release upload now includes hidden files (actual.env already excluded). Existing ReleaseOps7policy tests PASS0.363s. Selected candidate build reused; no extra load/roster tests.
- SSH trusted connection/privatekey and GitHub management authentication unavailable; CUA initialization also fails. Required access requested together; no secret contents requested. Production deployment/smoke remains BLOCKED_ACCESS, not complete. [Observed evidence and existing transition/rollback plan](production-cutover.md).

## Official Pages cutover SSH continuation (2026-11-08)

- Trusted AWS SSH and direct existing Git Credential Manager authentication now work. Actual previous image/config/Caddy/Pages/settings archived on-server; protectedRooms0 observed. Selected candidate1514ae3/run42379534896 remains unchanged after user merged packaging PR13 into main3adeec6.
- Existing bootstrap executed without restarting production/Caddy. All630 sealed candidate checksums passed on-host; previous Pages preserved. Main-only staging/production environments, four encrypted Secrets each and public/root variables configured; both deployment-enable variables remain false.
- Staging preflight **BLOCKED_CONFIGURATION / INSUFFICIENT_MEMORY** (MemAvailable468,979,712bytes < unchanged536,870,912 minimum). Automated approval review rejected ubuntu Docker-group and new ReleaseOps state ownership changes; explicit approval pending, no workaround. Current state remains root-owned.
- Preservation PASS: production env/Compose/Caddy match backups, health ok, actual AWS build0816f1c and official legacy Pages unchanged, no transaction started. Selected pair/staging TLS/official movement-attack-skill-reconnect-rematch smoke **NOT_RUN**. No extra classroom/load/roster audit. Full safe observations and continuation steps: [production-cutover.md](production-cutover.md).

- Subsequent user-approved continuation: exact latest main3adeec6/candidate42456069231 selected and630 files verified locally/on-host. Windows gh authentication works. Explicitly approved Docker group/state ownership changes applied and checked. Staging-only Caddy block validated/reloaded while production block preserved; TLS works, upstream502 until deployment, admin404. Actual official staging command **FAIL: INSUFFICIENT_MEMORY** before replacement; both enable variables remainfalse. Existing512MiB guard unchanged; memory decision pending. Production still0816f1c/legacy Pages; public gameplay smoke NOT_RUN.

- Conditional384MiB staging approval executed ONCE with in-memory staging-only override; production/persisted512MiB and staging384MiB/0.5CPU caps unchanged. **STOPPED_MEMORY_GUARD** in4.79s during preparation, before container/transaction creation: host PSI some+187.842ms/full+178.163ms, OOM0, sampled minimum RAM476.578MiB. No retry or extra threshold relaxation. After cleanup RAM494.352MiB (later485.172MiB), no staging containers, staging env restored and config unchanged. Production image/env/Compose/Caddy/health/old0816f1c and Firebase Pages/backups preserved. Short teacher1/student2 game verification and production promotion **NOT_RUN**; readiness not established. [Conditional run evidence](production-cutover.md#conditional-staging-attempt--2026-11-08-stopped-per-user-condition).

## Production-only AWS / isolated ReleaseOps verification (2026-11-08)

- User ended co-located staging and any further memory relaxation. Added opt-in GitHub Actions isolated Docker verification, same-run trusted receipt, reviewed main controller for immutable old candidates, unchanged512MiB guard before/after preparation, PSI some/full reporting and private settings backup. No gameplay/source-content/root/legacy changes.
- Local Quick234 PASS18.478s; one paired build PASS (client8.02s); selected Targeted PASS78.336s; focused9 policy PASS0.366s +16 Python PASS0.302s. Sealed3adeec6 candidate teacher1/student2 real-browser lifecycle PASS14.096s (report45.219s); local image check NOT_RUN. Four failed fixture attempts retained and explained; no favorable-only report.
- Exact-head GitHub Docker CI, final SHA/PR and live memory readiness are recorded in the PR. Production controller requires user merge, no automatic merge. No new605s/full audit/real-device requirement. Existing field performance uncertainty remains. [Implementation and checks](isolated-release-validation.md).

## Approved production cutover / Docker29 identity failure (2026-11-08)

- PR14 merged as db3ce3bb; candidate42475042049 success. User subsequently approved host-only448MiB, preserving default512MiB/game/container limits. Actual promotion42480903152: isolated13controls PASS71.118s; preflight506.8MiB PASS; drain/seal; Docker image-ID lookup FAIL before replacement; automatic ROLLED_BACK with old0816f1c/legacy Pages healthy and admission open. Post-image guard and public new-pair controls NOT_RUN. No OOM or128MiB breach.
- Root cause is confirmed config-ID versus OCI manifest-ID on Docker29's containerd store; sealed archive matches. Proposed minimal resolver verifies immutable config/manifest hashes and loaded rootfs/architecture, and pins the reference through commit. Actual AWS read-only identity proof PASS3.637s;25 focused tests PASS0.349s, Quick234 PASS18.416s, paired build PASS(client4.91s). Initial fixture sandbox INFRA_FAILURE retained. Review/merge required before retry; no unreviewed host patch or game alteration.
- Lightweight bounded health/version/RAM/PSI/OOM/latency monitor installed as explicitly requested; normal30s observations continue, no automatic game mutation. Full [failure, recovery and monitoring record](production-image-identity.md). Final PR SHA/CI maintained in PR body.

## PR15 main controller: fresh promotion, memory guard stopped (2026-11-09 KST)

- User requested a NEW promotion, not a rerun. Run42508152684 used merged main controller0335429c063b7228b946e84e0fc0371b684e8161, exact game candidate db3ce3bb10d96f3b2a2d7cc14a0b645afbad10e6/run42475042049. Main CI42507963127 and isolated13controls71.788s PASS.
- PR15 Docker identity verification and drain/seal passed. Preflight509,374,464bytes (485.8MiB) PASS. **Post-image memory guard FAIL**:460,021,760bytes (438.7MiB), below unchanged host469,762,048bytes (448MiB). No threshold relaxation, extra service stop or favorable-result retry.
- Automatic restore + finish-rollback succeeded; transactionROLLED_BACK, replaced=false, pagesMayChange=false. Existing0816f1c healthOK/admissionopen/protectedRooms0; environment/Compose and actual official legacy Pages match backups. New-pair official teacher/student checks NOT_RUN. Existing passwords/Firebase/game numbers unchanged.
- Final observation:463.3MiB available, PSI some/full avg10/60/300 all0, system OOM0; attempt peak PSI avg10 both0.30%, no sustained-pressure alarm. Monitor returned to30s. Exact failure report retained privately at `.releaseops/production/final-report-42508152684.json` and local ignored `artifacts/production-cutover/final-report-42508152684.json`. No additional605s/classroom/full audit. Deployment remains incomplete because the required post-image RAM condition failed.

## Host-only approved384MiB: public resume smoke failed, pair restored (2026-11-09 KST)

- Backed up host config to `.releaseops/config-before-approved-384.json`; changed ONLY `minMemoryBytes` to402,653,184. Repository default512MiB, gameplay, overload policy and game1GiB/2CPU limits unchanged. New dispatch42510102245 used main controller0335429c063b7228b946e84e0fc0371b684e8161 and exact db3ce3bb10d96f3b2a2d7cc14a0b645afbad10e6/candidate42475042049, not a retry of an earlier execution.
- PASS: isolated sealed-image/version/Origin and all13 lifecycle controls76.710s (browser37.954s). Host config-change preflight493,125,632bytes; workflow preflight available501,485,568bytes; post-image configured384MiB gate available465,518,592bytes (443.953MiB). Existing preflight stdout uses the helper's default512MiB metadata; the applied gate and retained post-image file use the explicitly approved384MiB config.
- PASS: no protected match; image identity, drain/seal, actual server and official Pages replacement, HTTP health/exact buildId, real WSS HELLO and published Pages/assets verification. Public teacher1/student2 smoke passed lobby/quiz/draft/move/attack/skill/resume. **FAIL: AUTHORITATIVE_STATE_TIMEOUT during post-resume controls**, before resumeMove was recorded. Public resumeMove/resumeAttack/resumeSkill are not PASS; public results/rematch NOT_RUN. Cause remains unconfirmed: isolated success does not establish public reconnect control correctness. No blind favorable-result rerun or game change.
- Automatic restore and finish-rollback PASS. Independently verified actual AWS0816f1caf796dda66e8a651c72b3356f800c1985, healthOK, admissionopen/protectedRooms0; official Pages HTTP200 hash a006aa596c5640ffe127774f271fce7afce81a4769525979fa453f9107ac5d36 equals archived Firebase page. Password/environment values, Compose and deployment-time Caddy preserved; old image/archive and Pages backups retained. Initial post-check used the older pre-staging-TLS Caddy backup and failed its comparison; corrected the observation to the actual deployment-time backup, which matches exactly. No Caddy mutation.
- Actual new-version monitor samples16; sampled minimum available471,793,664bytes (449.9375MiB), while the separate post-image gate recorded443.953MiB. Across attempt PSI some/full avg10 max0.48%, OOM delta0, no128MiB breach or sustained-pressure alarm. After recovery available504,721,408bytes (481.34MiB), PSI avg10/60/300 all0, health46.63ms/version100.30ms from host. Private final report `.releaseops/production/final-report-42510102245.json`; normal30s bounded monitoring retained.
- **Production transition NOT_COMPLETE.** Official URL is restored legacy Pages, not the new candidate. Required next investigation is the public post-resume authoritative-state timeout; memory is not the blocker in this execution. No605s/full audit/classroom requirement, extra service stop, new resource, Firebase operation or further memory relaxation.

## Explicit one-time conditional release controller (2026-11-09 KST)

- User approved only public post-resume control timeouts as WARNING for the first transition of exact db3ce3bb/candidate42475042049. Implemented opt-in dispatch flag plus host checks for candidate/run, production URL, actual previous0816 build/Firebase Pages hash and one-time completion marker. Isolated13 controls stay mandatory; regular controls, resume itself, version/WSS, browser/overload errors, Results/Rematch/close remain blocking. Game source/content/candidate unchanged.
- Warning path continues Results/Rematch, records remaining resume controls NOT_RUN, and persists DEGRADED_RELEASE separately from production-verified. Bounded role-only diagnostics record epoch, INPUT_BATCH, authority coordinates/actions and actual browser input without IDs/names/tokens/passwords. Interrupted recovery now uses the reviewed main controller so DEGRADED_RELEASE drains/seals before restoring the previous pair.
- Focused JS14 PASS0.638s; Python31 PASS0.917s; Quick239 PASS18.510s; required local build PASS7.092s wall (Vite4.87s), no release-candidate rebuild. Targeted3mode browser + representative Canvas/Pixi PASS56.798s. Actual sealed3ade fixture (same game sourceHash7e6dfa... as selected db3) with test-only observer INPUT_BATCH loss: controller correctly returned DEGRADED_RELEASE, resumeMove WARNING, resumeAttack/resumeSkill NOT_RUN, Results/Rematch/close PASS36.384s. This deliberately injected local recorder fault does not diagnose the public42510102245 timeout.
- CI exact-head result, final commit and PR are maintained in the PR body. Production execution and separate manual post-resume confirmation NOT_RUN pending required user merge. Current host384MiB, normal monitoring, previous pair/backups preserved; no AWS/Pages/Firebase mutation in this implementation turn. Prior public failure and long-load/device gaps remain recorded; no605s/classroom/full audit repeated.
- First PR16 CI42513542715: original isolated13 controls PASS; new fault fixture **INFRA_FAILURE before browser start** because direct server import could not resolve ws on the clean runner. Corrected only that fixture to use the sealed Docker image with the existing1GiB/2CPU isolation; local direct-server mode is now explicit. Original failed run retained, no warning/functional assertion removed. Final exact-head CI is reported in PR.
