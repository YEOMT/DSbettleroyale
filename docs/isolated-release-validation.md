# Production-only AWS / isolated candidate verification

This deployment-tools patch preserves all game code, 87 characters, numbers, 60Hz/20Hz and overload protection. No new instance, lower memory threshold or additional long load run.

## Change

- Reuse sealed candidate `3adeec67aebb437bf2c035b4bc16451088ffadba`, successful Paired candidate run `42456069231`. Do not rebuild it or substitute latest.
- Replace co-located staging eligibility with an opt-in, exact-candidate GitHub Actions Docker receipt. Keep legacy staging mode for other installations. No SSH secrets on the isolated runner or PR CI.
- Live GitHub API checks bind the receipt to the same reviewed main promotion dispatch, attempt, successful isolated job, source candidate, manifest, image and fingerprint. Missing/partial/PR/local evidence blocks deployment.
- Preserve drain/seal, paired Pages publishing, actual previous image/Pages restoration, and explicit production/rollback dispatch. Back up private deployment configuration. Record PSI some/full independently and enforce the existing 512MiB available-RAM check again after image preparation.
- Reuse the same short browser control helper for isolated and public verification: teacher1/student2, lobby/quiz/draft, authoritative movement/basic/skill, same-player refresh and movement/basic/skill again, results/rematch/room close. No simulation or version/auth bypass.

## Executed local checks

| Check | Result | Actual duration |
|---|---|---|
| Quick, 234 assertions | PASS | 18.478s |
| Paired client/server build | PASS | Vite client phase 8.02s (not total wall time) |
| Targeted: browser E2E + representative Canvas/Pixi | PASS | 78.336s (37.544 + 21.259 + 19.533) |
| Focused deployment/trust policy, 9 tests | PASS | 0.366s |
| Python deployment/drain/rollback/memory, 16 tests | PASS | 0.302s |
| Sealed candidate, local server + actual browser controls | PASS | report 45.219s, browser 14.096s |
| Actual candidate Docker image locally | NOT_RUN | Linux Docker path is required in CI |
| Public selected-pair AWS/Pages controls | NOT_RUN | no production replacement yet |
| Classroom/physical tablets/605s/full roster | NOT_RUN | not a new cutover prerequisite |

Local fixture attempts 1–4 failed and are retained in ignored `artifacts/production-cutover/local-isolated-validation*.json`: truncated identical synthetic names (36.307/37.547s), routed-WebSocket observation (40.000s), and input attempted before the refreshed connection's first new-epoch INPUT_BATCH (20.755s). Fixed test setup/observation/readiness; no game change, weakened assertion or increased timeout. Attempt5 passed. The invalid-Origin probe's socket cleanup was then corrected; exact-head Docker CI verifies it. These results are short connection checks, not long-term stability claims. Prior stress failures and real-device gaps remain open.

CI run/PR/final commit are recorded in the PR body to avoid documentation-only CI loops. Production activation still requires this controller to be reviewed into main and the unchanged AWS memory preflight to pass. Neither a PR CI receipt nor a local PASS authorizes promotion.

## Live AWS readiness (2026-11-08)

Set repository `RELEASE_VALIDATION_MODE=github-actions` and server `validationMode=github-actions`; backed up the previous private config. `STAGING_ENABLED=false`, `PRODUCTION_WS_ENABLED=false` remain. No staging container, active protected room or drain; production health OK and build `0816f1caf796dda66e8a651c72b3356f800c1985` unchanged. Existing environment matches the backup; old image archive and actual Pages backup remain.

Two idle samples five seconds apart: MemAvailable510,087,168 →510,328,832 bytes (486.46→486.69MiB), below536,870,912 (512MiB) by25.31MiB at the second sample. PSI some/full avg10/60/300 all0, both total deltas0; system OOM counter0 and container OOMKilledfalse. This is an available-RAM guard failure, not evidence of current pressure or OOM. No further threshold relaxation, service termination, production replacement or Pages publication performed. Need reviewed main controller and at least the unchanged512MiB available at both preflight points; do not wait/retry until a favorable sample or claim isolated CI proves Lightsail capacity.
