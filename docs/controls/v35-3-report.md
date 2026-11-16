# v35.3 Combat Feel & Controls — validation report

[PR24](https://github.com/YEOMT/DSbettleroyale/pull/24), branch `codex/v35-3-combat-feel-controls`. Baseline main `5cba0f9bd6eba793d91fa16efd833a582456ee09` includes merged v35.2 PR23. Measured runtime commits: `9cf5cd1d0e62fa36a9ad16afbe74f5b86fcccf4f`, `819aa47dc539720c1009f6e6f91ff17461c67f6f`, `3a4e2c5788907f1c5335cbf461bf407cbd6d1eea`. The final follow-up in the PR additionally fixes the reproduced HUD snapshot-consistency exception below; it does not change loops, draws, messages or authority. The exact submitted SHA and final-head CI are recorded in PR24. The attachment is a development specification, not deployment permission.

## Result boundaries

```text
FUNCTIONAL: PASS for the executed focused/regression cases; earlier failed executions retained below
COMBAT_INVARIANTS: UNCHANGED in fixed-seed comparison and current parity checks
CONTROL_FEEDBACK: IMPROVED — focus/IME, recovery labels, return point, windup and shield/reflect identity
PERFORMANCE: UNRESOLVED — local overload and software-GPU stalls remain
DEVICE_VALIDATION: NOT_RUN
RELEASE: NOT_DEPLOYED
```

No physical Android/iPhone/iPad was available. Chromium native touch injection and desktop WebKit are separate evidence, not device certification. No main merge, AWS load/restart/deploy, Pages or Firebase change occurred. Main CI and a new paired candidate require the user's merge and are NOT_RUN for this PR. No old candidate ID is offered.

## Changes and cost

| Baseline behavior | Minimal change / same-input result | Cost and limit |
| --- | --- | --- |
| Editable/IME and ordinary focused-button keys entered combat | Ignore those keys; focused attack/skill Enter/Space still requests its own action once | One application-lifetime focus listener; existing repeat suppression, no reservation |
| Resize could retain an old-coordinate gesture; disabled controls showed cooldown/READY | Neutralize gestures on viewport basis changes; share Controls/HUD state priorities | Existing recovery and100ms clock; HUD refresh only while bounded feedback lives |
| ACK and execution were not separately visible | Separate sent/queued/executed/rejected/cancelled edges by kind/sequence/life/match/epoch | At most2records; pending2200ms, terminal180ms, local repeat400ms. No new timer/text/retry |
| Minimum-power alien finishes dash at tick5 before100ms guard | Only server-confirmed, unlocked recast bypasses guard; pending next sequence cannot borrow confirmation | Actual83.33ms test; all other guard/cooldown values unchanged |
| Render preview acquired assist retention | Query the same policy on temporary held state, restoring it before actual release | Small guide-only copy; no angle/gain/tap change |
| Return guide followed new drag instead of cast origin | Existing origin closure supplies owner-private `{x,y}`; guide applies public collision/arena and solo ring | Never on public actors/other students; restored on resume, removed with cast |
| Prepared instant FX lacked action identity; `safe-dash` did not trigger travel pose | Existing confirmed FX gains kind/seq; body/sound wait for actual resolution. Snapshot travel recognizes actual kind and boundary tick once | No new events, projectiles or gameplay callbacks; original pose sizes/durations |
| Shield absorption looked like HP injury; reflection lacked distinct contact | Two-arc absorption without HP hurt/major impulse; actual reflection rim/chevron and owner-local rate-limited shield sound | Four small primitives, existing retention/audio limits; no particles/blur/hit-stop |

All86 fastest-basic tests include maximal speed and real self/team haste; normal100ms guard remains. A fast fixture life replacement exposed the previous life's request guard/feedback: life change now clears guard, feedback and pending sounds together. Old ACK/life/epoch cannot renew feedback. Existing v35.2 profile/floor/render caches, interpolation, room/transport cleanup and60Hz/20Hz remain. Workspace/lock versions are35.3.0 without dependency changes. Content86 hash remains `8f4cf38107b74bfd8c37e32f80016c48d8265bc5b883cdf4914b08d427f77bdb`; root `index.html` is unchanged.

## T01–T09 evidence

| ID | Executed check | Result / measured time |
| --- | --- | --- |
| T01 |86kits ×120fixed ticks, identical seed/intentions; every command/state/event versus v35.2 excluding only documented presentation fields | PASS2.614s; extra metadata956bytes over this fixture, not classroom bytes/second |
| T02/T03 |Real3-pointer move+attack+skill, independent release, cancel→late-up, native up→lost capture, repeat/focus/IME, rotation/recovery | Final local Canvas PASS30.016s,8native sends; baseline observed34.970s. Real cooldowns, no resets |
| T03 |Lock priorities, confirmed5-tick recast, ACK/execution order, stale scope, duplicate prepared sound, atomic recast HUD state |Final10focused units PASS0.797s; earlier combined mobile-impact/camera-feel22PASS0.650s |
| T04 |All86 normal/modified profiles, privacy/body/wall/ring; actual dash→return, DPR2, reload/resume, mute/reduced-motion | Canvas PASS13.210s / Pixi PASS17.505s. Final HUD follow-up Canvas PASS14.587s. Actual authority return equals shown endpoint despite new upward drag |
| T05 |Existing6families plus nuclear skill/swordsman/scissors/alien/mirror across attacker/opponent/host | Added Pixi5cases PASS26.246s; existing families pass both CI renderers. Canvas alien/mirror focused cases pass after classification repair |
| T06 |Actual mirror/iron reflection, sniper critical, shield absorption on3screens; miss/no-ACK-hit/life/replay; actual12/24-tick windups | Canvas/Pixi PASS. Shield HP loss0, no hurt state, contact drawn. Screen script did not save elapsed time; no duration invented |
| T07 |20students+teacher,3real screens, normal/6→5→3/concentrated fixtures; paired production builds, identical generator | Canvas A/B PASS both modes; corrected Pixi A/B also completes both modes. Performance remains UNRESOLVED; initial failures below. Not20physical tablets |
| T08 |Same20identities/room,5short rounds, real move/basic/skill, round3reload, transition reconnect, per-round resources/input cleanup | Canvas A/B PASS60.736→60.016s; cleanup0, constant intervals/RAF/listeners,20connected,0overload. Existing separate Quick test passes4simultaneous resumptions with move/basic/skill and host observation |
| T09 |Ordered real TCP relay80/150ms targets/jitter, stop/reversal, duplicate/old-epoch rejection, resume, blocked/muted audio/reduced-motion | PASS; actual fixed RTT91.95–94.00ms /154.27–156.40ms (4samples each), not presumed Wi-Fi RTT |

Capture rounds use explicit fixture END; final solo uses the real finish rule after fixture eliminations. No new room or server restart hides rematch state. Counts1/3/5 and cleanup are retained. Four-player resumption is a separate integration, not four browser reloads inside the five-round fixture.

## Input and screen comparison

Final local Edge observers are identical on baseline and final runtime; negative focus probes wait for actual cooldown completion:

| Observation | v35.2 | v35.3 |
| --- | --- | --- |
| Native move+attack+skill/release/cancel |PASS |PASS |
| Ordinary button Enter |1unintended combat command +1click |0combat commands +1click |
| Editable Enter + composing Q |2unintended requests |0requests |
| Focused attack Enter twice (repeat) |1request |1request |
| Release-handler→WS, n=8 |p50 0.4ms / max1.1ms |p50 0.5ms / max1.4ms |
| Pressed first draw |next draw |next draw |
| Disabled button label |old cooldown |RECOVERY / 연결 |

These timings start inside the event handler, not physical touch/server impact. They do not prove faster hardware response. Linux n=8 tails also overlapped/worsened: Canvas max1.2→1.5ms; Pixi max3.4→4.6ms. The improvement is correct ownership/feedback, not a claimed latency reduction.

Rotation was timing-dependent in baseline: Linux Canvas retained1gesture, candidate0. The final local baseline lost its gesture during subsequent state changes, so it is not an invariant baseline failure. The fresh-target unit, rather than the browser probe alone, proves preview/release selection and retained state. Recovery images in `../evidence/v35-3/runner-43860225486/` illustrate label differences; the randomly assigned opponent/map is not controlled visual-parity evidence. The private-return screenshot comes from actual restored server data. Motion assertions use continuous event/draw observations, not still scenes.

## Short performance comparison

[43860225486](https://github.com/YEOMT/DSbettleroyale/actions/runs/43860225486) compares production pairs5cba0f9/819aa47 sequentially per Linux4-vCPU/~16GiB job. Server and3browsers share a runner; CPU/GPU contention is not excluded. The final3a4e2c5 runtime changes only focused-key dispatch; steady combat/render paths equal819aa47.

| Canvas case | Duration before→after | Server CPU to last battle | Peak server RSS | Sent total to last battle | Host draw-gap p95 |
| --- | --- | --- | --- | --- | --- |
| Solo3rounds |43.715→43.648s |5101→5038ms |214.00→224.34MiB |224.79→224.13MiB |16.7–16.8→16.8ms |
| Capture3rounds |40.806→40.652s |3897→3606ms |234.58→225.29MiB |230.12→230.09MiB |16.7–16.8→16.7–16.8ms |
| Capture5rematches |60.736→60.016s |7829→7632ms |244.29→244.39MiB |317.83→316.76MiB |16.7–16.8→16.7–16.8ms |

Student gaps p95 were16.7–16.8ms. Rematch step p95 rose4.064→4.784ms and snapshot p95 rose6.527→6.753ms despite lower cumulative CPU; do not select only favorable metrics. Solo RSS increased~10.3MiB, capture decreased. No long-term memory improvement/regression attribution is established.

First Pixi solo failed on both versions at6alive (`20 !== 6`); baseline capture failed likewise, candidate capture finished3rounds. Server telemetry had6alive, overload0, empty queues and event-loop p95~12–13ms, while the screen observation still used20alive. The fixture now bounds/records receipt latency separately before the same1.8s measurement window; all assertions remain. The capture candidate that did finish still had host gap p95~383–550ms and a student reload-window p95~3567ms on shared software WebGL. That is not a performance PASS.

Only the two failed Pixi comparisons were checked again in [43861846438](https://github.com/YEOMT/DSbettleroyale/actions/runs/43861846438), using identical corrected observers on both versions. All four version/mode executions PASS3rounds,20connected,0overloads and zero final retained match resources. First failures remain in `runner-43860225486/`; confirmation data is in `runner-43861846438/`.

| Pixi case | Duration before→after | CPU to last battle | Peak RSS | Host gap p95 normal /3alive /concentrated before→after |
| --- | --- | --- | --- | --- |
| Solo |105.090→106.988s |9037→8787ms |218.41→235.41MiB |333.4/316.7/366.7→400.0/316.7/383.3ms |
| Capture |109.282→107.167s |8477→9218ms |276.89→269.09MiB |416.8/266.7/399.9→333.3/266.7/383.4ms |

Receipt observed by automation for the first20→6transition reaches2.18→2.75s in solo and2.35→3.11s in capture. It includes browser scheduling/polling, not pure network RTT. This establishes why a fixed1.8s observation can still see the old population; the bounded receipt check does not certify fast delivery. Later transitions are~0.30–0.66s. Capture retains the original automatic balanced30FPS policy on both versions; solo60FPS policy is unchanged, but neither reaches that rate on the shared software GPU. Student reload-window p95 remains1.17–1.73s. Capture cumulative CPU rose8.7%; solo RSS rose17MiB. The mixed single-run differences do not identify a new bottleneck or justify a no-regression claim.

Local Windows solo Canvas55.33→55.09s PASS (hostgap~16.8–16.9ms, peakRSS165.85→172.52MiB). Local **capture Pixi baseline60.63s PASS / candidate31.22s FAIL**, first-round overload1; candidate step p9519.79ms, snapshot CPU p9529.23ms, hostgap max383.4ms. Server/browsers plus other desktop work shared the PC; neither infrastructure nor new runtime is established as its cause. A favorable cloud result cannot erase this failure.

## Failure ledger and CI

- Initial unit fixtures omitted recast ID / ignored manual-ray priority; fixtures corrected, authority assertions retained.
- Cancel probe ran inside the legitimate archmage volley lock: await its actual end, retain both pointer assertions.
- Alien motion failed because actual `safe-dash` was not recognized; fixed that classification, plus prior-snapshot-boundary dedup. Old-life guard cleanup fixes the independently reproduced guide fixture lock.
- Appended shield observer was lost by a preceding intentional reload: reinstall it on the new document and retain all3paint/HP assertions. Both renderers pass.
- Final unit reproduced an intermediate v35.3 HUD ordering bug: a new recast decision read an old null recast's `end` before AppUI.self refreshed. The same real engine states produced `TypeError` (1FAIL0.251s). All button decisions/counts/times now read the same life-matched snapshot. Final10units PASS0.797s and the related actual return/resume Canvas test PASS14.587s. This is a newly introduced intermediate issue repaired before submission, not claimed as a v35.2 bug.
- [43857270459](https://github.com/YEOMT/DSbettleroyale/actions/runs/43857270459):15executed required jobs PASS,1scope skip.
- [43860219994](https://github.com/YEOMT/DSbettleroyale/actions/runs/43860219994): Quick/build,Targeted,other combat/roster PASS. Canvas-touch failed after controls353 and Chromium touch passed: Linux WebKit crashed at the fifth resize, then teardown reported `Target crashed`. INFRA_FAILURE/native-page crash, cause unconfirmed; this execution is not PASS.
- Runtime3a4e2c5 required [43861804510](https://github.com/YEOMT/DSbettleroyale/actions/runs/43861804510):15executed jobs PASS,1scope skip, including WebKit. Final HUD-follow-up/head Checks are linked from PR24; earlier-head success is not presented as its result.
- Final game runtime `b1b4204aa645195165b2ab723c3a423a0f6adbbe`, [43863788988](https://github.com/YEOMT/DSbettleroyale/actions/runs/43863788988): Quick343+7 PASS224.803s, Python31, paired build, Targeted and all Canvas/Pixi combat/roster PASS. Overall gate FAIL because isolated-release runs the **old5cba0f9 candidate**, which timed out on resumed movement after10.577units (strictly>12required); input epoch2 and repeated real INPUT_BATCH are present, OOM false. No new-game input failure is proved; original geometry was not recorded, so its exact blockage cause remains unconfirmed.
- A deterministic real-engine wall reproduces the probe's blind inward path stopping below12. The ReleaseOps smoke observer now chooses a40unit clear cardinal path using existing public walls/boxes/actors, retaining the same keyboard input, distance>12, identity check,8s deadline, strict error behavior and later action/Results/Rematch assertions. It does not reroute player inputs or change production configuration. No warning is enabled. Focused direction/strict-warning7tests PASS0.256s (one initial test fixture began overlapped; corrected to a separate blocking actor). Latest controller/head CI is recorded on PR24. This minimal test-intention correction is the only follow-up after the game runtime was frozen.

Local Quick243.875s PASS (340common+7ReleaseOps at that earlier revision); later focused tests and final CI are separate. Required build/content/Targeted follow the existing scope planner. No lowered assertion, unconditional retry, new paid infrastructure or relaxed gameplay protection.

## Limits and reproduction

No transport/server lifetime/render-cache architecture or perpetual loop was added. No new retained-object growth is established; same-room counters clear and stay bounded. The30-player600/1200s matrix is NOT_RUN for this display/input patch, not PASS by inheritance. Existing v35.2 RSS ownership uncertainty, shared-GPU reload stalls and initial-overload failures remain open. Physical touch, hardware GPU/audio and school Wi-Fi are NOT_RUN.

Commands: `node tools/ci/plan.mjs origin/main`; `npm run quick`; `npm run build`; `npm run test:targeted`; `node tests/combat/authority-controls353.mjs <export-of-5cba0f9>`; `node --test tests/unit/controls-feel.test.mjs`; `node tests/combat/controls353.mjs canvas`; `node tests/combat/guide353.mjs pixi`; `COMBAT_CONTROLS353=1 node tests/combat/live-feel.mjs pixi`; `COMBAT_CONTROLS353=1 node tests/combat/evolution-browser.mjs pixi`; `CONTROLS_COMPARE=1 node tests/combat/longrun-compare.mjs <solo|team-capture|rematch|controls> <canvas|pixi>`.

Windows uses PowerShell `$env:NAME='value'` and installed Edge (`PLAYWRIGHT_CHANNEL=msedge`). CI uses pinned Playwright1.56.1/Node24.22.1. Comparisons export the baseline and exact HEAD runtime; only test observers are shared. Do not repeat passed suites without a relevant edit/failure.

[Contracts and grouped rollback](v35-3-contract.md) · [Anonymous machine evidence](../evidence/v35-3/). Revert related input/HUD, private-guide, and confirmed-event producer/consumer groups together while keeping v35.2. Actual deployment/rollback requires explicit approval and exact client/server pairing.
