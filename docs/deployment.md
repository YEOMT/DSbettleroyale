# Deployment state and runbook

Current ReleaseOps entry point: [releaseops-ko.md](releaseops-ko.md). The `/srv/dsbr` commands below are historical migration notes, not the current Lightsail layout or release workflow. Use the parameterized `install-release.sh` and one-time bootstrap; production now requires explicit promotion, and rollback restores both retained artifacts without rebuilding.

**Not deployed by this work.** The user reports that a Seoul Lightsail instance and Docker / Docker Compose are ready. No hostname or SSH connection has been supplied or used. See [the Korean Lightsail staging commands](lightsail-ko.md). Production automation is disabled unless repository variable `PRODUCTION_WS_ENABLED` is exactly `true`. Root main/Pages HTML stays unchanged in this PR. Docker/SSH/Pages release paths are supplied but must be validated on the designated host; they are not recorded as executed deployments.

## Required settings

| Value | Where to set it | Verification |
|---|---|---|
| `PRODUCTION_WS_ENABLED=false` initially | Repository Settings → Secrets and variables → Actions → Variables | Release summary must say NOT_DEPLOYED |
| `PUBLIC_WSS_URL`, `PUBLIC_HTTP_API_URL` | Repository Actions variables | `node tools/deploy/smoke.mjs` with paired `dist/release.json` |
| `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `KNOWN_HOSTS` | Protected `production` environment secrets | Restricted SSH account, exact known-host fingerprint; never disable host verification |
| `PUBLIC_HOST`, `ALLOWED_ORIGINS` | `/srv/dsbr/.env` on server | DNS points to host; only exact HTTPS origins are accepted |
| `HOST_AUTH_SECRET`, separate `ADMIN_SECRET` | Server `.env`, mode 600 | Random values >=24 characters; never put in Vite/Pages |
| `CADDY_IMAGE` | Server `.env` | Example pins official Caddy 2.11.7 digest queried from Docker Hub |
| `SERVER_IMAGE` | Server `.env` / release environment | `dsbr:<40-character verified commit>` |
| Pages publishing source = GitHub Actions | Repository Settings → Pages | User/administrator changes this only after staging verification and approval |
| Production / github-pages environment protection | Repository Settings → Environments | Require approved branch and reviewer for first production switch |

Node image is pinned to official `24.22.1-bookworm-slim` digest, queried from Docker Hub. Caddy's proxy handles WS upgrades; its stream-close delay does not prove a reload preserves all active sockets. Avoid Caddy reloads during matches. See [Caddy reverse_proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) and [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## One-time host installation

Install Docker Engine + Compose on a Linux host, arrange DNS and TCP 80/443, and create `/srv/dsbr` owned by the restricted deploy account. Copy `deploy/compose.yml`, `deploy/Caddyfile`, `deploy/install-release.sh` and `tools/deploy` to their corresponding paths under `/srv/dsbr`. Copy `deploy/.env.example` to `.env`, replace every placeholder, and set permissions to 600. The results volume is reserved; gameplay/student records are not automatically written there. Caddy certificate/config volumes persist. Logs rotate and should contain no tokens or student names. Example CPU/RAM limits are capacity test settings, not a 30-device hosting guarantee.

```sh
docker build -f deploy/Dockerfile --build-arg BUILD_ID=<commit-sha> --build-arg VITE_PUBLIC_WSS_URL=<wss-url> -t dsbr:<commit-sha> .
docker save -o server-image.tar dsbr:<commit-sha>
# Build Pages client from the SAME commit and PUBLIC_WSS_URL:
PAGES_BUILD=1 BUILD_ID=<commit-sha> VITE_PUBLIC_WSS_URL=<wss-url> npm run build
tar -cf client-assets.tar -C dist/client/assets .
```

Upload both tar files to `/srv/dsbr/incoming/<commit-sha>/`. Start Caddy once with the configured compose project. Run `bash /srv/dsbr/install-release.sh <commit-sha>` from that account. The script uses a localhost admin endpoint, drains existing protected rooms, stages the new image drained, checks version, and archives the actual Pages assets. Never publish the admin endpoints through Caddy.

## Drain, publication and rollback

CI must pass. A main CI completion builds one paired client/image; disabled production only makes artifacts. Enabled release requires the production environment and required secrets. START_QUIZ/new room creation stop during drain; already started QUIZ/DRAFT may reach BATTLE and RESULTS. Atomic `/admin/seal` requires zero protected rooms. The default timeout is 10 minutes; timeout cancels, undrains and does not replace/restart the running server. Forced termination is not part of deployment.

The new process starts drained. Public `/healthz`, `/version` and actual WSS HELLO must match `dist/release.json` before Pages is published. Pages base is `/DSbettleroyale/`. Old hashed assets are carried forward from the archive. Retain paired image/client artifacts for at least 30 days and the server asset archive for the oldest supported open session. Prune only during a maintenance window after deciding the supported-client age.

No in-memory lobby/live-match migration is implemented. Students/teachers receive maintenance/room-expiry information; lobby setup may require creating a new room after a server replacement. Active matches are protected by drain. A process crash remains an outage and loses its in-memory rooms.

If server staging/health fails, the install script restores the previous image only if replacement had begun. A drain timeout never recreates the old container. If public handshake or Pages fails after staging, the release stays failed and restores the previous server when available. Keep admission drained until the matching previous client is restored. Run **Paired rollback** with the previous verified 40-character commit SHA; this builds/publishes the previous pair using the same drain guard. Verify `/version`, actual WSS and Pages `version.json`/entry asset before admitting a class. This recovery route is not yet an executed staging exercise.

After HTTPS/WSS, original parity, real mobile/classroom validation and explicit user approval, enable production and switch Pages source to Actions. Only after successful dist publication may a separate PR remove root legacy HTML. No automated merge or direct main push is provided.
