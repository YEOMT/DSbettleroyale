# v33.1 Fidelity Repair

Baseline: deployed/main `352afbc4e91427812ad55432981a6ef79f778aa6`. Rechecked main before publication; no newer main changes. Original root `index.html` and `legacy/v32.1/index.html` are unchanged. This repair preserves the server authority, 60 Hz physics / 20 Hz snapshots, roster and numeric rules. No AWS or Firebase changes were made.

## Confirmed causes and changes

1. `AppUI.self` discarded server `effect/detail`. `ui/augments.js` now validates the seven-field card contract, displays original family/name/tier/effect/detail classes, and keeps all penalties/caps/grade-specific Wanggui text. Server `applyCommand` returns the original measured before/after notice; no client stat recalculation. Offer/match/life/revision guards, pointer cancellation, owned chips and MAX pending choices are connected.
2. `wirePlayer` serialized an inactive stun as the current frame. Combined with right-snapshot statuses and a delayed render frame this invented a perpetual stun. Inactive `stunEnd/lockEnd` are now zero. The remote actor uses left-snapshot discrete status until right time; the local actor uses latest authority and its source tick. Actual movement/attack/skill rules are unchanged.
3. Native projectile snapshots omitted style/rotation/trail metadata. Canvas now invokes original `brDrawProjectileGlyph`; Pixi uses the same geometry and cached raster sources. RW glyph callbacks passed a diameter that the wrapper treated as a radius; this doubled the drawn size. RW event velocity now matches snapshot unit-direction × speed exactly once.
4. Generic circles did not represent volley previews. Server-derived display profiles use the unchanged original basic/skill functions. Predictable rounds have owner/life/kind/seq/ordinal identity, windup and interval. Curved/target-dependent skills retain an opening cue until authority. Accepted rounds replace matching previews; rejected/cancelled inputs clear cues, including melee actions with no projectile. No client hit/damage decision was added.
5. Short-lived curved shots could become a straight birth-to-end chord. Presentation now samples recorded authoritative path segments. End effects are separate residuals, and unknown curved paths never invent a chord. Explicit terminals remove attack bodies. Effect life checks prevent old-life hit feedback after respawn.
6. Actual browser tests uncovered another migration error: farm collision rows were converted to `pos/width/height`, although the original movement kernel expects `x/y/w/h`. This could make predicted coordinates non-finite. The adapter and finite-coordinate regression are fixed without changing collision rules.
7. Full-scene comparison also exposed generic skill labels, omitted grade/reroll/map information, a music panel covering capture status, generic objective arrows, and a 60-second display countdown for the unchanged 120-second opening rule. The WS display profile now supplies the original skill label; the original HUD fields, music-panel visibility, pooled arrow DOM/layout, and capture countdown/score formatting are connected. Original and WS student HUD text and arrow coordinates/rotation are asserted equal for the same received scene.

## Original → connected implementation

| Original feature | Current connection / evidence | Remaining scope |
|---|---|---|
| `brRunCard`, `brRenderRunHud`, choice notice | growth → private WS → `AugmentUI`; 63 exact cards, five/MAX choices, owned details, duplicate/invalid request, two simultaneous Chromium touch contacts | Physical multi-touch school devices |
| `wirePlayer`, `brPaintReworkStatus` | explicit inactive ends; historical remote/current local status ticks; actual Canvas star draw calls observed | All possible combined status overlaps |
| shield/buff/slow/mark/lock/channel/recast/motion | existing absolute endpoints/active records retained; statuses use the same actor time; expired buffs filtered server-side; original status painter connected | Exhaustive simultaneous combinations not asserted |
| native `brDrawProjectileGlyph` | original Canvas path and matching Pixi cached shape/tail/ring/rotation; one actual-WS native sample is pixel-identical to offline original | Every native style/quality/angle is not pixel-compared |
| `brPaintReworkEntities` | actual server entities, corrected diameter, unit velocity, explicit path/phase/ordinal; Canvas and Pixi 13-case suites | Every character × augmentation × target geometry |
| local cast start / shot handoff | original derived basic and supported straight skill descriptors, per-round IDs/delay, rejection cleanup; curved skills wait for authority | Exact timing on real high RTT school devices; every forced-motion preview |
| melee/cast warnings/beam/zone/hit | original `brPaintAttack`, ground/status painters; fallback muzzle/impact/elimination primitives; real FX event consumption | Every legacy cosmetic particle/death dissolve is not restored or visually compared |
| hit confirm / hurt / critical strength | original `brRegisterHitFeedback`, hit profiles, directional hurt edge, squash/flash, centre hit/KO cross; no preview hit confirmations | All sounds/haptics/device reduced-motion combinations |
| HP / cooldown / skill lock / shield | original cached name label, own outline, HP damage trail, original skill name/grade/reroll/map fields, cooldown CSS angle/classes, shield text/channel/recast indicators | Exhaustive HUD screenshots for all 77 skills |
| movement / aim / cover | original movement kernel plus corrected crate adapter; gesture opening cue, server-visible actors, smoke/reveal labels, invisibility/boost flags | Complex dash/teleport immediate local motion parity remains broader than this repair |
| level / capture HUD / objectives | original level painter, scoreboard classes/countdown, point states/counts/bases; original objective arrow DOM/layout and actual received-state comparison | Some host observer layout still differs |
| results / KDA | server results → original table/team classes; assists, damage, capture/support/quiz/reroll fields | Complete legacy award decoration and all alternate result layouts remain partial |

## Executed evidence

The harness starts the **real server and two isolated student browser contexts**. Commands traverse actual WebSockets; snapshots use the production encoder and private/visible-state selectors. Only fixture setup and tick scheduling are controlled in Node. No production test endpoints were added. Exports from `main.js` let tests observe the actual UI/timeline/renderer.

- Before repair: `tests/fidelity/regression.mjs` failed all four assertions (three blank descriptions; six false stun stars). After repair: all four pass. Sanitized receipts: `fidelity-evidence/contract-before.json`, `contract-after.json`.
- `contracts.mjs`: all 63 possible cards (18 paths × I/II/III, with Wanggui A/B/C/F), original effect/detail equality and no horizontal overflow; five choices/MAX; actual duplicate/invalid approvals; held movement with two touch contacts; ten real seconds idle with zero self/opponent stun stars; 30/60-tick stun start and end in actual draw calls, separately blocked movement/attack/skill; reconnect, three-answer respawn, results and same-room rematch.
- Actual received snapshot traces are replayed through the renderer at simulated 30/60/120 FPS, with/without 0/30/80/10/50 ms delivery jitter. This is **not** physical monitor FPS or OS/network packet jitter.
- `visuals.mjs`: basic, slash, headshooter, grandwizard, bubble, bats, pro boomerang, tennis reflection, basketball return, genie turret, void beam, dynamite and beast titan. Both viewers see own/opponent action. Flying bodies have no duplicate preview/authority keys; reflection/return and all twelve titan ordinals are explicitly asserted. Target HP is replenished in these fixtures to observe entire flight lifetimes; this is separate from numerical combat parity.
- CI run 41549507750 passed verify/build, three-mode E2E and Canvas fidelity, then failed the Pixi tennis display assertion; load smoke did not run. The fixture had only cleared the visible crate array, leaving its spatial index/cache/respawn queues, and sent snapshots every 12 ms. It now clears the whole farm fixture, gives both tennis players clear wall lanes, and publishes every 50 ms. Server reflections/returns and each viewer's actual draw frames are asserted separately. Both corrected 13-case Edge renderer suites passed locally; the failed CI is retained as historical evidence, not reported as a pass.
- Canvas native glyph from actual WS data equals offline v32.1 PNG bytes at identical size/quality/velocity/rotation/zoom. `reference.mjs` also feeds the same received actors/map/growth/time/camera to the offline full original student renderer. The reference receives the actual private growth/respawn state as well. Student name/grade, HP/KILL/reroll, mode/map, participant counts, skill name, capture timers, growth visibility and objective-arrow text/coordinates/rotation are asserted equal. Paired scene images are for inspection; **full-scene pixel equality is not claimed**. The original reference blocks all network/Firebase requests.
- `node tools/verify.mjs`: 123 tests plus client/server build. `npm run test:e2e`: three modes through quiz/draft/battle/results/rematch. CI also runs both fidelity renderer paths and retains screenshots/logs as artifacts.

Run locally with Node from `.nvmrc`: `npm ci`, `npx playwright install chromium`, `npm run verify`, `npm run test:e2e`, `npm run test:fidelity`, `FIDELITY_RENDERER=pixi node tests/fidelity/visuals.mjs`. On this Windows PC tests used Edge via `$env:PLAYWRIGHT_CHANNEL='msedge'`. The local npm bootstrap was `node .local-tools/package/bin/npm-cli.js`; the bootstrap directory is ignored.

## Limits and deployment

The 70-item ledger remains PASS 28 / PARTIAL 39 / FAIL 1 / NOT_RUN 2. Added evidence does not imply all 77 visual combinations are proven. The table above identifies concrete remaining display differences and test limits. Physical school tablets/phones, classroom Wi-Fi, Android/iOS browser performance and a complete simultaneous-status matrix are untested.

Previous 600-second cohorts remain: 20 players functional pass; 26/30 players fail with 7/39 overload pauses. This repair did not rerun those long cohorts or claim they are fixed. No short smoke replaces them. There is no production-ready or complete visual-fidelity claim.

See [manual paired AWS update](fidelity-deploy-ko.md). No deployment, restart, `.env` rewrite, key rotation, new resources, main push or merge was performed. Review and CI must precede a separately authorized update.

## Inspection images

[Augment cards](fidelity-evidence/augment-cards.png) · [12-shot Canvas](fidelity-evidence/canvas-beast12-student0.png) · [Wizard Pixi](fidelity-evidence/pixi-wizard-student0.png) · [same-state original scene](fidelity-evidence/matched-v32-scene.png) · [same-state WS scene](fidelity-evidence/matched-ws-scene.png) · [original native sample](fidelity-evidence/legacy-native.png) · [WS native sample](fidelity-evidence/ws-native.png).
