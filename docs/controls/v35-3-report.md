# v35.3 validation report — in progress

Base main `5cba0f9bd6eba793d91fa16efd833a582456ee09` includes PR23 / v35.2. First implementation `9cf5cd1d0e62fa36a9ad16afbe74f5b86fcccf4f`; final revision and completed targeted comparison will be recorded before ready-for-review. [PR24](https://github.com/YEOMT/DSbettleroyale/pull/24).

## Current evidence

- Quick: PASS, 243.875s; content86 hash `8f4cf38107b74bfd8c37e32f80016c48d8265bc5b883cdf4914b08d427f77bdb` unchanged. Focused unit22 PASS after travel/recast changes. First PR CI43857270459: all15 executed jobs PASS, one scope-skipped job.
- T01: 86 kits ×120 fixed ticks, every command result/state/event equals v35.2 after removing only private return point and confirmed rw FX action identity. 2.614s; total added metadata956 bytes across this specific fixture, not an average classroom bandwidth estimate.
- T02/T03: real Chromium pointer capture with move+attack+skill, independent releases, cancel→late up, keyboard repeat, button focus, editable/IME, viewport change and connection lock. Canvas17.067s PASS. Initial eight sends: release-handler→WS0.4–2.7ms, pressed on next draw. Updated before/after input sample pending.
- T04: Canvas13.210s / Pixi17.505s PASS: actual return origin after outbound dash, publicly blocked return, resume→new return action, mute/reduced-motion. Screenshot after actual server restoration is included. All86 normal/modified profiles have finite guides; privacy and public collision tests pass.
- T05/T06: existing six-family live screen assertions retained. Added nuclear skill/swordsman/scissors/safe-dash/mirror observations on attacker/opponent/host; targeted Pixi26.246s PASS. A real engine `safe-dash` kind was missing from the old pose receiver. Canvas real shield/critical/reflection observation PASS: all three surfaces draw the contact, defender HP loss0, no pure-shield hurt state. The initial appended observer failure is retained below.
- T07 local: 20 actual student connections + host, three actual browser surfaces, normal/6→5→3/concentrated fixtures; physics/cooldowns unchanged. Solo Canvas before55.33s / after55.09s PASS. Host draw-gap p95~16.8–16.9ms; server peak RSS165.85→172.52MiB. No general latency or memory resolution claim.
- T07 local capture Pixi: baseline60.63s PASS; candidate31.22s FAIL, first round overload1. No protection threshold was changed. Candidate step p95 19.79ms, snapshot CPU p95 29.23ms; host draw max383.4ms. One PC runs the server and all browsers plus other desktop work; cause is not established. Separate GitHub runner short comparisons are pending, and the local failure remains recorded.
- T08/T09: first required CI passed same-room five rounds, four simultaneous resumed students in a20-player match, real ordered80/150ms RTT relay, mobile-touch and audio fixtures. Extended resource/input records and isolated comparison pending.

## Failures and corrections retained

The first three-pointer cancel fixture ran while the real archmage volley lock was active: wait for its actual unlock, keep both pointer assertions. The expanded alien screen case exposed actual `safe-dash` versus `dash` classification; boundary-tick reception is also covered without old-interest replay. Fast fixture life replacement exposed the previous life's local guard/feedback: clear those records on life change. The appended shield test initially lost its observer after the preceding intentional reload: reinstall the observer on the new document, retaining all draw assertions. None of these failed runs are relabelled PASS.

## Scope and limits

No server transport/queue lifetime, render cache, simulation rate, quality preset, target FPS, gameplay balance or protection threshold changes. The existing100ms UI timer refreshes buttons only while at most two feedback records are live; no timer or animation loop is added. No new resource-growth signal justifies another600s matrix in this controls patch. Existing v35.2 RSS attribution, shared-GPU reload stall and prior late-population overload failures remain unresolved.

DEVICE_VALIDATION: NOT_RUN (physical Android/iPhone unavailable). RELEASE: NOT_DEPLOYED. No AWS/Firebase/Pages/main change. A main CI/candidate can only be verified after the user's merge; no old release ID is offered for this PR.

Commands: `node tools/ci/plan.mjs origin/main`; `node tools/ci/quick.mjs`; `node tools/build.mjs`; `node tests/combat/authority-controls353.mjs <export-of-5cba0f9>`; `node --test tests/unit/controls-feel.test.mjs`; `node tests/combat/controls353.mjs canvas`; `node tests/combat/guide353.mjs pixi`; `COMBAT_CONTROLS353=1 node tests/combat/live-feel.mjs pixi`; `CONTROLS_COMPARE=1 node tests/combat/longrun-compare.mjs <solo|team-capture|rematch|controls> <canvas|pixi>`. Use PowerShell `$env:NAME='value'` for environment assignments on Windows.

[Display/input contracts and rollback](v35-3-contract.md) · [Machine-readable evidence](../evidence/v35-3/).
