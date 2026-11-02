# Executed synthetic load evidence

13th Gen Intel(R) Core(TM) i5-1340P / win32 x64 / Node v24.22.1. Server and clients use separate processes on one shared development PC.

| Students + teacher | Duration | Result | Overload pauses | Step p95 ms | Step p99 ms | Snapshot gap p95 ms |
|---|---:|---|---:|---:|---:|---:|
| 20 + 1 | 600.0s | PASS | 0 | 8.37 | 13.78 | 70.84 |
| 26 + 1 | 600.0s | FAIL | 7 | 8.69 | 12.34 | 72.25 |
| 30 + 1 | 600.0s | FAIL | 39 | 14.41 | 21.62 | 118.12 |
| 26 + 1 | 30.0s | PASS | 0 | 8.81 | 11.88 | 63.79 |

All three ten-minute cohorts completed seven rounds and cleanup reported zero rooms, tokens and peers. The 26/30 cohorts required 7/39 explicit teacher CONTINUE recoveries: these are failures, not uninterrupted passes. The 20 cohort and final 26-player short check also exceed the 8ms step-p95 target. No 30-device production capacity claim.

Latest source follow-up removes unused 60Hz projectile serialization and reuses prepared actor state. Its 26-player 30-second smoke passed with zero overloads; the ten-minute matrix has not been repeated for that revision.

The network report records requested and actually measured latency separately. Real classroom Wi-Fi, device input-to-photon, audio listening and continuous 30-minute leak verification remain untested.
