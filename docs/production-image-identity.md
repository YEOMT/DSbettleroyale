# Approved 448MiB cutover attempt and Docker identity repair

## Actual deployment result, 2026-11-08

Production promotion [42480903152](https://github.com/YEOMT/DSbettleroyale/actions/runs/42480903152) selected exactly `db3ce3bb10d96f3b2a2d7cc14a0b645afbad10e6`, candidate run `42475042049`. **FAILED before server/Pages replacement; automatic recovery completed, ROLLED_BACK.** Actual AWS remains `0816f1caf796dda66e8a651c72b3356f800c1985`; official Pages remains the archived Firebase HTML. No Firebase data/password change.

User explicitly approved this host's `minMemoryBytes=469762048` (448MiB). Repository default remains512MiB. The actual image/Compose/environment/Caddy/Pages backups were verified; no active match or staging container. Approved multipathd service/socket temporary stop remains, with their enabled settings preserved; no additional essential service stopped.

- PASS: exact candidate isolated Docker/Origin/version + teacher1/student2 controls13,71.118s (browser27.695s). This is not long-term/classroom stability verification.
- PASS: production memory preflight recorded531,423,232bytes (506.8MiB), above448MiB; drain/seal completed with no protected match.
- FAIL: `docker load` succeeded, but `docker image inspect sha256:4c818eea...` failed on AWS Docker29.9.2 before replacement.
- NOT_RUN: post-image memory guard (identity failure occurred first), selected-pair public controls, official new Pages verification. Existing long-load failures/device gaps remain; no605s/full roster rerun.
- PASS: existing server container/image retained, admission reopened, health200, previous environment/Compose/Pages preserved. `replaced=false`, `pagesMayChange=false`.

Archive checksum `ca8e9f8b5741c3d1a5d0b894692701a7d4ff8f262fe3fc1c7fa7397b3afac05b` equals the immutable manifest. Runner config ID is `sha256:4c818eeaf95739ca6ef8507c9c667ce19f248300b959376bca93325071894784`; AWS's containerd image store exposes OCI manifest ID `sha256:c5234f9b19159bdad9b9c2c0fe6a48a8a4750d4c59d482c53bab1f2fb67ee06a`. The saved OCI manifest refers to exactly that config and the same layers. See [Docker containerd storage](https://docs.docker.com/engine/storage/containerd/) and [Moby's manifest-based inspect ID](https://github.com/moby/moby/blob/master/daemon/containerd/image_inspect.go).

## Minimal repair

Keep the original direct image-ID lookup. Only if it fails, read the already sealed archive and verify config/OCI manifest SHA256, metadata size, unique config-to-manifest mapping, then compare Docker's loaded immutable manifest ID, OS, architecture and rootfs layers. Pin that immutable reference through stage and commit; reject any change between phases. No mutable tag substitution, manifest rewrite, Docker restart/storage migration, image rebuild, version bypass, game change or memory relaxation.

The exact AWS archive and loaded image passed this proposed resolver in3.637s, read-only. No container started or deployment reapplied. Local25 deployment/recovery/identity tests PASS0.349s, Quick234 PASS18.416s, paired build PASS (Vite phase4.91s). First new fixture run was INFRA_FAILURE due sandbox temporary-folder access; fixtures now use workspace artifacts, as existing tests do. CI exact-head results are in the PR body. This repair must be reviewed into main before another approved dispatch of the **same db3ce3bb candidate**, with the unchanged448MiB checks before and after image preparation.

## Lightweight observation installed on this host

`dsbr-health-monitor.service` runs as ubuntu with48MiB/5% caps (game limits untouched). It reads local/public `/healthz` and `/version`, response time, MemAvailable, PSI some/full separately, system/container OOM and image/container status. No student or secret data.5-second deployment samples, now30-second normal samples. Two bounded2MiB history files and latest/alarm JSON reside under `.releaseops/monitor`; alerts also enter journal. This observer does not automatically mutate deployment or replace the game.

Deployment observation: minimum RAM499,281,920bytes (476.2MiB), OOM delta0, max PSI some/full avg10 both0.74%, no sustained-pressure or health-failure signal. These are observed host metrics, not proof of classroom stability. Alert conditions: RAM<128MiB, OOM increase, health failure3samples, or PSI some avg10>=5% / full>=1% for3samples. No128MiB breach occurred.

```bash
systemctl status dsbr-health-monitor.service
cat ~/dsbr-v33/.releaseops/monitor/latest.json
journalctl -u dsbr-health-monitor.service -n 30 --no-pager
```

Public exposure of these files/admin endpoints was not added. Before a later deployment, set `deploymentActive` in the private monitor/control.json to true, and return it to false after completion/recovery. This is a monitoring interval only, not a gate override. Normal patch flow remains PR/CI → user merge → candidate → explicit promotion dispatch. First-transition recovery uses the failed transaction's exact SHA in **중단된 배포 복구**, never a fabricated production-verified old release.
