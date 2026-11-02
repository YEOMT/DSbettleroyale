# Progress

## M0

- Latest main inspected: 1292f87528436e7182dcf066c6b9576d71c1cbed. No later user changes or local edits existed.
- Original Git bytes preserved in legacy/v32.1/index.html; root index.html unchanged.
- 793 top-level source units inventoried; 77 effective actor profiles, 60 registered reworks, native skill definitions, augments, rules and quiz data extracted after overrides.
- Real offline Edge harness executed all 77 basic/skill attacks and 180 simulation steps per character, with zero participant runtime faults.
- Node 24.22.1; npm 11.6.2 bootstrapped locally (not part of the repository). ws 8.22.1 / Vite 7.3.7 security patches pinned; Pixi stays 8.20.1. npm audit: zero known vulnerabilities.
- M1: 26 responsibility modules / 301 original source units extracted. Node create/step/export/destroy, 77-character attack parity, growth to level 6 with five choices, four mode paths (three public modes plus legacy compatibility), capture phase math, stale-input neutralization and two-room isolation implemented.
- Executed `node --test tests/unit/*.test.mjs tests/parity/*.test.mjs`: 88 passed, 0 failed. Detailed local output: artifacts/m1-tests.txt (not a classroom performance claim).
- Remaining M1 debt: separate cosmetic RNG consumption without changing original combat sequence; broader full-life and all-build parity. M2–M5 are in progress/unverified.

Production hosting credentials/domain were not provided; production is not deployed. No Firebase operations were performed.

## M2

- Real HTTP/ws room authority, strict protocol schemas, teacher authentication, zero-score draft, quiz scoring/locks, atomic reroll, bounded duplicate ledger, connection epochs and capability resume implemented.
- Executed five protocol/integration tests over real loopback TCP: all passed. Original engine/rule regression rerun: 90 passed. Initial Windows sandbox TCP attempt returned EACCES; the same suite passed with authorized local network execution.
- M2 browser UI wiring is pending M3/M4; no connection-only completion claim.
