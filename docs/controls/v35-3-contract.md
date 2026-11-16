# v35.3 input and combat display contract

Baseline: main `5cba0f9bd6eba793d91fa16efd833a582456ee09`, including merged v35.2 PR #23. Source request: user-provided v35.3 Combat Feel & Controls specification (2026-11-16). The attachment is an implementation specification, not permission to merge or deploy.

## Inputs and states

- Move, attack and skill retain their own pointer IDs. Down changes pressed/knob/guide only; one valid up sends one intention. Cancel/lost capture clears only that uncommitted gesture. Up followed by lost capture does not send or cancel again.
- Blur, hidden, canvas fallback and viewport-coordinate changes neutralize old gestures. A new gesture is necessary after recovery. Text fields, editable content, IME and noncombat focused buttons do not become combat commands. Enter/Space on the focused attack/skill button requests that button's own action once; repeated keydown does not fire again. Existing keyboard-repeat prevention remains.
- `action-state.js` is a pure presentation/request gate shared by Controls and HUD. Network recovery, safe pause, death, stun, capture, skill locks, channel steering, recast and cooldown retain priority. The server still validates every command. No reservations or new loop are introduced.
- Normal 100ms guards remain. The actual minimum-distance alien dash can end at tick 5 (83.33ms). Only a confirmed `firedSkill >= last requested sequence`, unlocked recast can bypass that guard. A pending next request cannot use the previous confirmation.
- Sent (dotted edge), queued ACK (solid edge), executed (brief cyan edge), cancelled/rejected (brief dashed edge) are separate. Two feedback records at most, scoped to match/connection epoch/life/kind/sequence. Queued status expires after 2200ms, terminal feedback after 180ms; duplicate local feedback is limited to one per 400ms. Expiry is observed by the existing self-state HUD refresh and existing 100ms UI clock only while a bounded feedback record is live. No timer/loop is added or rescheduled. No combat text/notification stream.
- Authority `fired` may confirm an immediate non-windup action. Prepared actions wait for actual SHOT_SPAWN or confirmed resolution FX. ACK never implies a shot, contact or HP loss. Multi-shot ordinals cannot restart the same action feedback.

## Guides and private information

`aimProfiles`/`visualProfiles` remain authoritative, with existing profile revisions and augments. `AimAssist.preview` applies the identical assist query on temporary retention state and restores it; only an actual release updates retention. No angle/cone/gain/tap changes.

| Family | Existing source / display contract |
| --- | --- |
| Melee / straight / sniper | Authority spec cone or rectangle, width and range; logical actor origin |
| Field / placement / self CC | Real target centre or self radius, public collision policy |
| Swordsman | End of actual dash plus separate orbit radius |
| Mirror | Line length/thickness plus a small front-normal arrow |
| Grapple / dash | Public path and intended endpoint; no extra offensive effects |
| Alien return | Private current-cast origin, independent of new drag; public wall/body/arena and solo-ring obstruction only |
| Scissors recast | Existing new direction and volley lock; unchanged three activations |
| Channel | Existing channel ID/steering; releasing the steering gesture is not a fresh skill |

Only alien self state gains `recastTarget: {x,y}` while its recast exists. It is derived from the original authoritative closure origin, restored on reconnect, absent on public actors/other students and removed with the cast. Hidden actors/traps are never added to a guide query. Decorative body/camera offsets do not change raw aim, projectile origin, prediction or authority.

## Confirmed display and sound

Existing pose sizes/durations and effect retention budgets remain. Stable actual skill kinds repair stale classifications: archmage/scissors → burst, spotlight/traffic/mirror/iron reflection → field, safe dash → travel. The actual `safe-dash` entity kind is recognized alongside dash/leap. Snapshot-only travel can begin on the previous snapshot boundary tick and is deduplicated by life/action sequence. Old interest re-entry never restarts a pose.

Existing instant-resolution FX gains `geometry.kind/seq`; no extra event or gameplay callback is emitted. This lets nuclear punch's tick-13 resolution drive its heavy pose and sound after its 12-tick preparation. Sniper recoil/sound waits until its actual shot after 24 ticks. Prepared snapshot-only travel uses the existing pose snapshot traversal, not another message or polling loop.

HP loss retains hurt motion/flash and existing impact levels. Pure shield absorption retains a short two-arc contact and shield sound, without HP hurt motion or major camera impulse. Actual mirror reflection uses two rim arcs and a small chevron, with an owner-local shield sound through the existing rate limit. No new particles, global hit-stop, vibration API, large blur or announcement is introduced. Low quality retains these primitives. Reduced motion and muted/blocked sound remain valid configurations.

## Bounds, preservation and rollback

60Hz authority, 20Hz target snapshots, all86 content/hash and all combat numbers remain unchanged. Profile caches, floor caches, v35.2 tessellation, interpolation and reconnect/room/transport lifetime logic remain. No dependency upgrade. Extra wire bytes are limited to the two specified presentation metadata fields; comparison records quantify them.

Rollback the paired client/server patch through normal ReleaseOps only after approval. Input/HUD changes may be reverted together; guide plus private return field together; instant FX identity plus body/sound consumers together. Do not roll back to pre-v35.2 caches or mix release build IDs. This PR grants no deployment authority.
