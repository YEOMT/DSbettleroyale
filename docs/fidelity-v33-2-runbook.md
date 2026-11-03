# v33.2 로컬 실행 및 승인 후 AWS 참고

작업 브랜치는 `codex/v33-2-full-fidelity-audit`이다. 이 작업에서는 AWS 배포/재시작, main 병합, `.env`/암호 변경을 수행하지 않았다. 실행 결과와 제한은 [검증 기록](fidelity-v33-2-evidence.md)에 있다.

## 새 로컬 checkout

기존 작업 폴더를 덮어쓰지 않는 새 경로에서 Node 24.22.1 및 npm을 사용한다.

```bash
git clone --branch codex/v33-2-full-fidelity-audit https://github.com/YEOMT/DSbettleroyale.git dsbr-v33-2-review
cd dsbr-v33-2-review
npm ci
npm run verify
npx playwright install chromium
npm run test:e2e
npm run test:fidelity
npm run test:fidelity-audit
node tests/fidelity-v33-2/audio.mjs
node tools/load/run.mjs --players=20 --seconds=600 --browser=true --recoverOverload=true --out=artifacts/load-20-600.json
npm run dev
```

브라우저에서 `http://127.0.0.1:5173`을 연다. 개발 서버의 교사 비밀번호는 loopback 개발 전용 `local-teacher`다. 운영 비밀번호를 입력하거나 `.env`를 복사할 필요가 없다. 음악은 원본 외부 URL을 사용하므로 인터넷 접속과 사용자 클릭이 필요하다. 나머지 원본 비교 하네스는 외부 Firebase 요청을 차단한다.

브라우저 시험은 순서대로 실행한다. 여러 하네스를 동시에 실행하면 5173 포트가 충돌하고 부하 측정도 왜곡된다. 600초 시험은 실제 학생 브라우저 1개와 합성 WS 학생 19개를 사용하며 실제 학교 20대 시험을 대체하지 않는다. `recoverOverload`는 측정을 끝까지 수집하는 옵션이며 overload 발생을 PASS로 바꾸지 않는다.

이 작업 PC에서는 npm이 PATH에 없어 `node .local-tools/package/bin/npm-cli.js run verify` 등으로 실행했다. `.local-tools`는 저장소에 포함되지 않으므로 새 checkout에서는 정상 설치한 npm을 사용한다. 설치된 Edge를 사용하려면 PowerShell에서 먼저 `$env:PLAYWRIGHT_CHANNEL='msedge'`를 지정한다. Linux Chromium 기본 실행에서는 지정하지 않는다.

## AWS에서 필요한 기존 설정

현재 서버 checkout 경로, Compose 프로젝트/파일, 기존 env 파일 위치, HTTPS 도메인, 기존 이미지 SHA를 운영 담당자가 확인해야 한다. 새 유료 자원이나 Firebase 변경은 필요하지 않다.

- client/server를 같은 승인 SHA로 한 Docker 이미지에 빌드한다.
- `PUBLIC_HOST`, `PUBLIC_WSS_URL`, `PUBLIC_HTTP_API_URL`, 정확한 `ALLOWED_ORIGINS` 및 기존 인증 비밀값을 유지한다.
- 기존 Caddy 이미지/인증서/볼륨, 결과 볼륨, CPU/RAM 제한과 localhost 8080 연결을 유지한다.
- 학교 브라우저에서 원본 Dropbox 음원의 리다이렉트와 audio/mpeg 응답이 허용되는지 확인한다.
- 교사1+학생20 동일 Wi-Fi, 실제 모바일 터치/스피커/프로젝터 검증은 아직 필요하다. 기존 26/30명 장기 overload 실패도 해결 판정하지 않았다.

승인 후 사용할 수 있는 **소스 확인 및 이미지 빌드만 하는 명령**은 다음과 같다. `<...>` 값은 현재 서버 구성 및 PR에서 확인한 최종 SHA로 채운다. 이 명령을 이번 작업에서 AWS에 실행하지 않았다.

```bash
set -euo pipefail
REPO_DIR='<기존 checkout 절대 경로>'
RELEASE_SHA='<승인한 정확한 40자리 커밋 SHA>'
PUBLIC_HOST='<기존 HTTPS 도메인>'
cd "$REPO_DIR"
git fetch origin codex/v33-2-full-fidelity-audit
git cat-file -e "$RELEASE_SHA^{commit}"
REVIEW_DIR="${REPO_DIR}-review-${RELEASE_SHA}"
git worktree add --detach "$REVIEW_DIR" "$RELEASE_SHA"
cd "$REVIEW_DIR"
docker build -f deploy/Dockerfile \
  --build-arg BUILD_ID="$RELEASE_SHA" \
  --build-arg VITE_PUBLIC_WSS_URL="wss://$PUBLIC_HOST/ws" \
  -t "dsbr:$RELEASE_SHA" .
```

실제 교체는 별도 승인 후 [기존 drain/seal → paired 교체 → health/WSS smoke → undrain/rollback 절차](fidelity-deploy-ko.md)를 따른다. 해당 이전 문서의 fetch 브랜치 `codex/v33-fidelity-repair`를 이번 `codex/v33-2-full-fidelity-audit`로 바꾸고 승인된 이번 SHA를 사용해야 한다. 현재 수업 중 컨테이너에는 이 PR 생성만으로 어떤 변경도 발생하지 않는다.
