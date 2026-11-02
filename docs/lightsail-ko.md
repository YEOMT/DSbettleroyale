# Lightsail 서울 서버에서 v33 테스트 실행

사용자가 Lightsail 서버 생성과 Docker / Docker Compose 설치를 완료했다고 확인했다. 이 작업에서 서버에 접속하거나 컨테이너를 실행하지는 않았다. 아래 절차는 **별도 테스트 도메인에서 작업 브랜치를 실행**한다. 기존 main, GitHub Pages 및 Firebase 운영 버전은 바꾸지 않는다.

## 준비할 값

| 항목 | 설정 |
|---|---|
| 서버 주소 / SSH | 서울 Lightsail의 고정 공인 IP, 로그인 사용자, SSH 키를 본인 PC에서 사용 |
| 테스트 도메인 | 예: `v33.example.com`의 A 레코드를 서버 IP로 연결. 도메인을 실제 값으로 교체 |
| 네트워크 | Lightsail 및 OS 방화벽에서 TCP 80/443 허용. SSH 22는 관리 IP로 제한. 8080은 외부에 열지 않음 |
| 인증 | 서로 다른 무작위 `HOST_AUTH_SECRET`, `ADMIN_SECRET`; 각각 최소 24자 |
| 허용 출처 | `ALLOWED_ORIGINS=https://실제도메인` — 경로나 끝 `/` 없이 정확한 Origin |
| 서버 크기 | 현 Compose 한도는 game에 CPU 2개 / RAM 1 GiB. 실제 서버 자원과 빌드 여유 메모리를 확인. 26/30명 수용 보장 아님 |

AWS 방화벽 규칙은 [공식 포트 안내](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-firewall-rules-reference.html)와 [접근 IP 제한 안내](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-editing-firewall-rules.html)를 따른다. 도메인/SSH 키/비밀값은 저장소나 채팅에 올리지 않는다.

## 최초 테스트 실행

SSH로 서버에 접속한 후 아래 명령을 실행한다. **처음 실행할 빈 디렉터리**를 사용한다. Docker 명령을 실행할 권한이 있는 계정이 필요하다.

```bash
git clone --branch codex/ws-migration-v33 --single-branch \
  https://github.com/YEOMT/DSbettleroyale.git dsbr-v33
cd dsbr-v33
SHA=$(git rev-parse HEAD)
PUBLIC_HOST=v33.example.com  # 실제 테스트 도메인으로 변경

cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
```

`deploy/.env`를 편집해 다음 값을 설정한다. 서버의 `openssl rand -hex 32`로 각 비밀값을 따로 생성해서 파일에 넣는다. `.env`는 Git에서 제외된다. 교사 화면에는 `HOST_AUTH_SECRET`을 입력한다.

```dotenv
PUBLIC_HOST=v33.example.com
PUBLIC_WSS_URL=wss://v33.example.com/ws
PUBLIC_HTTP_API_URL=https://v33.example.com
ALLOWED_ORIGINS=https://v33.example.com
HOST_AUTH_SECRET=여기에_별도로_생성한_무작위_비밀값
ADMIN_SECRET=여기에_다른_무작위_비밀값
PRODUCTION_WS_ENABLED=false
MAX_ACTIVE_BATTLES=1
```

나머지 이미지 핀과 방 설정은 예제 값을 유지한다. `PRODUCTION_WS_ENABLED`는 GitHub 자동 공개 배포의 차단 장치다. 아래 수동 테스트 실행은 이 값을 바꾸지 않아도 된다. GitHub 저장소의 동명 Actions 변수도 `false`로 유지한다.

```bash
docker build -f deploy/Dockerfile \
  --build-arg BUILD_ID="$SHA" \
  --build-arg VITE_PUBLIC_WSS_URL="wss://$PUBLIC_HOST/ws" \
  -t "dsbr:$SHA" .
sed -i "s|^SERVER_IMAGE=.*|SERVER_IMAGE=dsbr:$SHA|" deploy/.env

docker compose --project-name dsbr-v33 --env-file deploy/.env \
  -f deploy/compose.yml config --quiet
docker compose --project-name dsbr-v33 --env-file deploy/.env \
  -f deploy/compose.yml up -d
docker compose --project-name dsbr-v33 --env-file deploy/.env \
  -f deploy/compose.yml ps
```

Caddy가 도메인의 HTTPS 인증서를 발급하고 `/ws`를 WebSocket 서버로 전달한다. 브라우저에서 `https://실제도메인/`을 연다. 클라이언트도 같은 이미지에서 제공되므로 GitHub Pages 설정을 변경할 필요가 없다. `/admin/*`는 공개 프록시에서 차단한다.

## 실행 확인

```bash
curl --fail "https://$PUBLIC_HOST/healthz"
curl --fail "https://$PUBLIC_HOST/version"

# 호스트에 Node 설치 없이 이미지 안의 Node/ws로 실제 WSS HELLO 검사
docker run --rm --network host --env-file deploy/.env \
  -e CLIENT_ORIGIN="https://$PUBLIC_HOST" \
  -v "$PWD/tools/deploy/smoke.mjs:/app/smoke.mjs:ro" \
  "dsbr:$SHA" node /app/smoke.mjs

docker compose --project-name dsbr-v33 --env-file deploy/.env \
  -f deploy/compose.yml logs --tail=100 game caddy
```

`/version`의 buildId가 `$SHA`와 같고 WSS 검사도 통과해야 한다. 교사 1명과 학생 2명으로 입장 → 퀴즈 → 배정 → 전투 → 시상 → 재경기를 직접 확인한다. 이후 실제 학교 기기·Wi-Fi로 부하와 조작을 검증한다. 현재 26/30명 10분 로컬 시험에서는 과부하 일시정지가 발생했으므로 수업용 운영 준비가 끝났다고 볼 수 없다.

## 업데이트와 운영 전환

경기 중 `docker compose up`, `restart`, `down`으로 교체하지 않는다. 방은 메모리에 있어 프로세스 교체 시 사라진다. 운영 업데이트는 [drain 및 이전 client/server 쌍 복구 절차](deployment.md)를 따른다. `install-release.sh`는 `/srv/dsbr`에 구성된 별도 배포 레이아웃을 전제로 하므로 이 최초 테스트 checkout에서 바로 실행하지 않는다.

GitHub에서 자동 배포하려면 나중에 `PUBLIC_WSS_URL`, `PUBLIC_HTTP_API_URL` 변수와 보호된 production 환경의 `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `KNOWN_HOSTS`를 설정해야 한다. 첫 운영 전환과 Pages 소스 변경은 별도 승인 작업이다. 이 PR은 자동 병합하지 않는다.
