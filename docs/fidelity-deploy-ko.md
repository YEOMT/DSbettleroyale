# v33.1 승인 후 AWS 갱신 절차

현재 v33.2 이후 자동 배포·복구는 [ReleaseOps 안내](releaseops-ko.md)를 따른다. 아래는 이전 수동 배포 기록이며 새 workflow를 대신하지 않는다.

이 작업에서는 실행하지 않았다. 현재 AWS의 경로·Compose 프로젝트 이름·도메인은 확인하지 않았다. **기존 `.env`, 비밀값, Caddy 인증서/볼륨을 그대로 사용**한다. `.env.example`을 덮어쓰거나 키를 재생성하지 않는다. 승인된 PR의 정확한 40자리 SHA와 통과한 CI를 먼저 확인한다.

아래는 기존 Compose의 `game` 이미지가 client/server를 함께 제공하는 구성이다. GitHub Pages 등 별도 클라이언트 호스팅을 사용한다면 [paired release 절차](deployment.md)에 따라 동일 SHA 클라이언트까지 교체한 후에만 입장을 재개한다.

SSH 접속 후 경로와 프로젝트 이름을 **현재 서버 구성에 맞게** 지정한다. `docker compose ls`에서 실제 프로젝트 이름을 확인한다. `<...>`는 실제 값으로 바꾸며 명령을 그대로 실행하지 않는다.

```bash
set -euo pipefail
REPO_DIR='<기존 Git checkout 절대 경로>'
ENV_FILE='<기존 .env 절대 경로>'
COMPOSE_FILE='<기존 compose.yml 절대 경로>'
PROJECT='<현재 Compose 프로젝트 이름>'
RELEASE_SHA='<PR에서 승인한 정확한 40자리 SHA>'
PUBLIC_HOST='<현재 HTTPS 도메인>'
test -f "$ENV_FILE" && test -f "$COMPOSE_FILE"
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]
cd "$REPO_DIR"
git fetch origin codex/v33-fidelity-repair
git cat-file -e "$RELEASE_SHA^{commit}"
REVIEW_DIR="${REPO_DIR}-review-${RELEASE_SHA}"
git worktree add --detach "$REVIEW_DIR" "$RELEASE_SHA"
cd "$REVIEW_DIR"

# 같은 Docker 이미지 안에서 client/server를 같은 SHA로 빌드한다.
docker build -f deploy/Dockerfile \
  --build-arg BUILD_ID="$RELEASE_SHA" \
  --build-arg VITE_PUBLIC_WSS_URL="wss://$PUBLIC_HOST/ws" \
  -t "dsbr:$RELEASE_SHA" .
compose=(docker compose --project-name "$PROJECT" --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
OLD_CONTAINER=$("${compose[@]}" ps -q game)
PREVIOUS_IMAGE=$(docker inspect --format '{{.Config.Image}}' "$OLD_CONTAINER")
test -n "$PREVIOUS_IMAGE"
SERVER_IMAGE="dsbr:$RELEASE_SHA" "${compose[@]}" config --quiet

# 진행 중 quiz/draft/battle을 기다린다. 10분 timeout이면 교체하지 않고 해제한다.
docker run --rm --network host --env-file "$ENV_FILE" \
  -e DRAIN_TIMEOUT_MS=600000 \
  -v "$REVIEW_DIR/tools:/tools:ro" \
  "dsbr:$RELEASE_SHA" node /tools/deploy/drain.mjs

# DRAIN_SEALED 성공 후에만 교체. Caddy/DB/Firebase에는 쓰지 않는다.
SERVER_IMAGE="dsbr:$RELEASE_SHA" DRAIN_ON_START=true "${compose[@]}" up -d --no-deps game
"${compose[@]}" ps
curl --fail "https://$PUBLIC_HOST/healthz"
curl --fail "https://$PUBLIC_HOST/version"

# health, 정확한 build/content/engine/protocol 쌍, 실제 WSS HELLO 검사
docker run --rm --network host --env-file "$ENV_FILE" \
  -e PUBLIC_HTTP_API_URL="https://$PUBLIC_HOST" \
  -e PUBLIC_WSS_URL="wss://$PUBLIC_HOST/ws" -e CLIENT_ORIGIN="https://$PUBLIC_HOST" \
  -v "$REVIEW_DIR/tools/deploy/smoke.mjs:/app/smoke.mjs:ro" \
  "dsbr:$RELEASE_SHA" node /app/smoke.mjs

# 위 검사가 전부 통과한 뒤 입장 재개. 비밀값을 출력하지 않는다.
docker run --rm --network host --env-file "$ENV_FILE" "dsbr:$RELEASE_SHA" \
  node -e 'fetch("http://127.0.0.1:8080/admin/undrain",{method:"POST",headers:{Authorization:"Bearer "+process.env.ADMIN_SECRET}}).then(r=>{if(!r.ok)process.exit(1)})'
```

업데이트 뒤 실제 교사 1명·학생 2명으로 설명/스턴/투사체/부활/시상을 확인한다. `.env`의 기존 `SERVER_IMAGE`는 위 임시 override로 바뀌지 않는다. 검증이 끝난 뒤 운영 담당자가 **그 한 항목만** 승인 SHA로 영속화해야 다음 일반 Compose 실행에서 구 이미지로 돌아가지 않는다. 다른 설정과 비밀값은 유지한다.

교체 뒤 health/WSS 검사가 실패하면 입장을 열지 않고 이전 **client/server가 함께 든 이미지**로 복구한다. 이전 이미지를 삭제하지 않는다.

```bash
SERVER_IMAGE="$PREVIOUS_IMAGE" DRAIN_ON_START=false "${compose[@]}" up -d --no-deps game
curl --fail "https://$PUBLIC_HOST/version"
```

`PUBLIC_HOST`, `PUBLIC_WSS_URL`, `PUBLIC_HTTP_API_URL`, 정확한 `ALLOWED_ORIGINS`, 기존 `HOST_AUTH_SECRET`/`ADMIN_SECRET`, pinned `CADDY_IMAGE`, 기존 볼륨 및 CPU/RAM 한도를 유지한다. 8080은 기존처럼 localhost 전용으로 둔다. 새 포트/도메인/유료 자원은 이 패치에 필요하지 않다. 26/30인 장기 과부하 실패는 별도 해결·재시험이 필요하다.
