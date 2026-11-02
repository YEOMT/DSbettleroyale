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
