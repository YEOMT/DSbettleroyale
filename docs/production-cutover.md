# Official Pages cutover — 2026-11-07

User approved the first official v33 transition, accepting intermittent overload risk. No additional classroom/605-second/all-character test is a prerequisite. Prior failures and physical-device limitations remain in the runtime performance report.

## Selected pair and current observation

- Selected release: `1514ae3b357d34b110a79109fad6426593e0b1ed`; successful Paired candidate run `42379534896`, artifact `13577131989`.
- Manifest: Pages base `/DSbettleroyale/`, HTTP `https://15-165-114-145.sslip.io`, WSS `wss://15-165-114-145.sslip.io/ws`; engine revision `v33-authority-2-profile-revisions`, content hash `fd780afb06e75dfb6dab229bc5fbc1a1ae5bfedf7cd6eff688dd41bdf3ce7e68`.
- Actual AWS `/healthz`200, `/version` buildId `0816f1caf796dda66e8a651c72b3356f800c1985` (old77 content/revision). Matching old HELLO succeeds with both AWS and exact Pages Origin. New pair HELLO correctly returns VERSION_MISMATCH. A first diagnostic HELLO mistakenly included sourceHash and was rejected by schema; corrected four-field probe is recorded separately.
- Actual official Pages returns the legacy Firebase HTML,1356097 bytes,SHA256 `a006aa596c5640ffe127774f271fce7afce81a4769525979fa453f9107ac5d36`. Fetched HTML is preserved locally at `artifacts/production-cutover/pages-current/index.html`; its referenced scripts are external CDN files. Existing verify-pages check passes against the fetched copy. This does NOT claim that the remote complete publishing tree/settings or AWS image/settings have been backed up.
- Most recent public pages-build-deployment run is41003234921, source1292f87528436e7182dcf066c6b9576d71c1cbed. Its artifact is no longer listed; current Pages publishing settings still require authenticated inspection.
- Candidate staging job was SKIPPED. Production promotion must use existing staging verification and drain/seal gates; do not pretend ARTIFACT_READY means deployed.

## Packaging repair

The selected candidate ZIP omits `ops/deploy/.env.example`, which is included in its sealed manifest. All629 present files match their checksums. Recovered that ONE public example from `git show 1514ae3b357d34b110a79109fad6426593e0b1ed:deploy/.env.example`; its SHA256 exactly matches the sealed `a47958eb5908a022a2d1eaa97749d3e6da6075f1375ff2f45c1e0d03970a4604`. The locally prepared candidate now contains the exact630 sealed files. No game rebuild, manifest/checksum relaxation or selected release substitution.

For future candidates, `.github/workflows/release.yml` explicitly includes hidden files in the existing release artifact upload. `candidate.mjs` already excludes actual `.env`; no secrets are added. [Official upload-artifact input documentation](https://github.com/actions/upload-artifact#inputs) describes the hidden-file default. Local existing ReleaseOps policy7tests PASS0.363s; no gameplay/performance audit was rerun. Existing candidate build/variant checks are reused. Final patch CI is recorded in its PR.

## Access still required — NOT deployed

This PC has no usable SSH key/agent/verified known_hosts. Strict SSH refused the unknown host key; it was not bypassed. Git Credential Manager lists YEOMT but noninteractive credential lookup fails. GitHub connector can manage work branches/PRs but has no Pages/Secrets/dispatch actions. Both browser and native Computer Use failed initialization (`failed to write kernel assets`, OS error3), so existing signed-in web sessions cannot be used here.

User action requested once: establish trusted SSH access and provide only the username/alias/local key-file path; log in via `git credential-manager github login --username YEOMT`. Never send private keys/passwords/tokens in chat or commit them. With that access, inspect existing `.releaseops`, actual Docker image/env/Caddy and Pages source before changing anything. Do not overwrite an existing bootstrap.

## Existing transition and recovery path

Reuse [releaseops-ko.md](releaseops-ko.md). One-time settings, if missing: staging/production environments with `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `KNOWN_HOSTS`; actual absolute `DEPLOY_STATE_DIR`; the existing public and staging URLs. Verify exact Origin `https://yeomt.github.io` without a project-path suffix; preserve other existing origins/passwords. Stage the selected pair and retain the verified staging receipt. Existing success run did NOT perform that step.

Back up actual running image/config and complete current Pages publishing files/settings before source changes. Keep active matches protected; drain wait/seal, apply paired image with admission closed, version/WSS checks, publish Pages assets, verify pair, open admission and short teacher/student smoke. Supplement the existing short smoke with actual movement/basic/skill/reconnect/rematch confirmation; NOT_RUN until access/deployment.

For this initial legacy transition failure, use existing transaction restore/Pages restore/finish-rollback (or **중단된 배포 복구**, target production and the failed new releaseId) to restore the recorded old image+Pages. Do not select the old pre-ReleaseOps AWS SHA in ordinary rollback and pretend it has a production-verified manifest. Later, **이전 정식 버전으로 복구** uses an exact previously verified releaseId. Preserve original Pages source/branch/path for an intentional publishing-source restoration.

Future updates remain PR/CI→user merge→Paired candidate/staging→explicit **정식 반영** dispatch (`release_id`, `candidate_run_id`). No automatic production deployment. AWS/Pages/Firebase and main have not been changed by this preparation.
