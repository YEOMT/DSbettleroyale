# v35.4 implementation contract

Baseline: `dd331fd62dc8d023d02d45c50186d02b41624769` (main, merged PR24 / v35.3). The worktree was clean; no open PR or existing v35.4 branch was found. User attachment: `DSbettleroyale_v35.4_Implementation_Spec_2026-11-17.md`. This authorizes implementation and a review PR, not merge or deployment.

| Requirement | Existing behavior / minimal extension | Preserved boundary | Checks |
| --- | --- | --- | --- |
| U01 | Dead students still receive combat views/events and render. Add an authoritative permanent-elimination subscription boundary before view generation/reliable numbering; retain sockets and control flow. | Respawn modes, posthumous attacks, host/live views, cursors, epochs | N01–N08, L01–L02, P01 |
| U02 | Recast/lock state exists; effect lifetimes need readable, simulation-clock-bound indicators. Extend existing HUD/painter. | No independent effect timers or gameplay changes; no visibility-loss expiry | E01–E07 |
| U03 | Confirmed hit metadata exists; distinguish heavy contact and actual wall impact using existing physics events. | No extra damage/knockback, no guessed impact or global shake | H01–H05 |
| U04 | Last lethal receipt and match results exist. Capture one per-life summary and display student/host views. | Existing attribution/rank/awards, escaped names, no invented statistics | R01–R05 |
| U05 | RESULTS currently displays immediately. Add a 3500ms authority deadline after natural solo result freeze. | No extra combat ticks; forced/team/no-survivor results unchanged; drain protected during presentation | V01–V06 |
| U06 | XP crates and fixed cover need different silhouettes/marks. Reuse bounded static art. | Geometry, farming, XP and supply values unchanged | X01–X02 |
| U07 | Existing rank-first draw is normal-only. Add room-local normal/f-only/s-only to the common candidate path and every draft/respawn validation. | Normal RNG/chances, costs, augments, 86 IDs, no hidden mode exposure | S01–S09 |
| U08 | Audit active residual ground damage paths before applying 1.10 exactly once. | Direct/final explosions, attached DoT, farming, timing/control unchanged | D01–D07, B02–B03 |

All items begin as NOT_RUN, not assumed implemented. Tests will retain failure evidence. Required scope plan, Quick, paired build and selected Targeted are followed by bounded 20-connected/5-rematch and 30-connected focused comparisons. No automatic 600/1200-second matrix, dependency upgrade, AWS access or production change. Prior software-GPU stalls, local overload and unresolved RSS ownership remain prior risks.
