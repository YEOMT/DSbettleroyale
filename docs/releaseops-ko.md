# v33.2 ReleaseOps 사용법

현재 공개 전환 상태와 실제 설정 이력은 [production-cutover.md](production-cutover.md), 격리 검증 변경은 [isolated-release-validation.md](isolated-release-validation.md)를 확인한다. 26/30명 600초 과부하 실패와 실기기 미검증 기록은 그대로다.

## 1GB 서버: Actions 격리 검증 모드

이 서버에서는 운영과 staging을 동시에 실행하지 않는다. 아래의 기존 staging 설치 안내는 별도 여유 자원이 있는 환경용이며, 이 서버에는 `RELEASE_VALIDATION_MODE=github-actions`, `STAGING_ENABLED=false`를 사용한다. 서버 `.releaseops/config.json`의 `validationMode`도 `github-actions`로 설정한다. `minMemoryBytes=536870912`는 유지한다. 검증 모드는 기본값이 staging이며, 알 수 없는 값이나 증거 누락은 차단한다.

정식 반영은 계속 명시적인 `workflow_dispatch` 승인으로만 시작한다. 선택한 후보 SHA/run의 기존 산출물을 별도 Actions runner에 내려받아 checksum, 실제 production Docker 이미지, 버전 네 필드, 정확한 Origin 허용/거부, 교사1·학생2의 조작·재접속·재경기를 검사한다. 이 runner에는 SSH/배포 secrets가 없다. 원래 AWS WSS 대상 주소를 확인한 뒤 격리 컨테이너에 동일 프로토콜/Origin을 전달하므로, 공개 DNS/TLS 연결 확인은 뒤의 정식 공개 smoke에서 별도로 수행한다.

privileged job은 GitHub API로 **동일 main workflow_dispatch/run/attempt의 isolated job 성공**, 후보 실행 출처, manifest hash, image ID, buildId 쌍과 모든 필수 결과를 다시 확인한다. 로컬 결과나 PR CI 결과는 정식 반영 증거로 사용할 수 없다. 검증된 receipt만 SSH로 서버에 기록한다. 선택한 후보는 재빌드하거나 수정하지 않으며, 검토된 dispatch main의 배포 제어 도구만 별도 SHA 경로로 보관해 실행한다.

배포 전 실제 이미지·환경·Compose·Caddy·Pages를 보존하고 기존 drain/seal/복구 절차를 따른다. 기존 512MiB MemAvailable 조건을 준비 전과 이미지 load 후 다시 검사하며 PSI `some`/`full`, OOM 카운트를 별도로 기록한다. 기준 미달이면 기존 서버를 보존하고 중단한다. 격리 검증 성공은 이 자원 조건을 면제하지 않는다. staging 메모리/CPU 제한이나 게임 과부하 기준을 변경하지 않는다.

ReleaseOps PR의 `isolated-release` CI는 정확한 PR base SHA의 보존된 후보로 Docker 경로를 검사한다. 해당 artifact가 없거나 만료되면 `INFRA_FAILURE`로 차단하며 임의의 latest를 대신 사용하지 않는다. 최초 Firebase→v33 전환 중 실패/중단은 **중단된 배포 복구**에 실패한 전환 SHA를 지정한다. 아직 정식 검증 기록이 없는 구 AWS SHA로 일반 롤백을 요청하지 않는다.

## 일상 흐름

1. 패치 PR → `CI / quick`, 선택된 `targeted`, `required-checks` 확인 → 사용자가 Merge.
2. 정확한 main 병합본 CI가 성공하면 `Paired candidate`가 해당 SHA의 산출물을 만들고, 설정된 경우 staging만 갱신한다. Merge는 운영 교체를 실행하지 않는다.
3. Actions **정식 반영**에서 `release_id`(40자리 SHA), `candidate_run_id`(성공한 후보 실행 번호)를 입력해 실행한다. `github-actions` 모드에서는 앞 절의 격리 검증이 필수이며, 기본 staging 모드에서는 같은 후보의 staging 검증을 요구한다. 이것이 명시적 승인이다. production environment의 reviewer를 설정했다면 그 승인도 필요하다. 계정에 reviewer 기능이 없다면 권한 있는 사용자의 dispatch가 승인 경계다.
4. **이전 정식 버전으로 복구**에서 이전 정상 SHA를 입력한다. 서버에 보존한 이미지/Pages/배포 도구를 내려받아 사용하며 과거 npm 설치·빌드를 하지 않는다. 보존 artifact가 삭제/손상됐으면 실패로 차단한다. 자동으로 latest나 재빌드로 대체하지 않는다.
5. SSH/runner 종료로 작업이 중단됐으면 **중단된 배포 복구**에서 그 작업의 SHA와 환경을 지정한다. 서버에 남은 transaction과 이전 Pages를 이용해 복구한다. 잠금이 남아 있으면 새 릴리스를 억지로 적용하지 않는다.

승인 중 staging이 더 새 후보로 바뀌면 이전 후보 승격은 `SUPERSEDED_OR_UNVERIFIED_STAGING`으로 차단한다. 다시 선택한 후보를 확인한다. 일반 롤백은 이 검사 대신 `production-verified.json` 기록을 요구한다.

## 한 번만 설정

기존 서버는 `~/dsbr-v33`, Compose `dsbr-v33`, `deploy/compose.yml`, `deploy/.env`, localhost 8080이다. 실제 파일이 다르면 bootstrap 출력 config를 검토해 고친다. `/srv/dsbr`로 옮기지 않는다.

수업/진행 경기가 없는 시간에, 이 PR이 병합된 checkout에서 한 번 실행한다:

```bash
python3 tools/deploy/bootstrap.py "$HOME/dsbr-v33" https://staging.15-165-114-145.sslip.io
```

이 스크립트는 **기존 컨테이너나 Caddy를 재시작하지 않는다**. 현재 `/version`, 실제 이미지 ID, `.env` 이미지 일치 여부, startup drain 값을 기록하고 이전 이미지를 저장한다. 기존 교사·관리자 비밀번호는 그대로 둔다. 새 `.releaseops/`에는 권한 600의 설정/상태, 별도 staging 비밀값, CPU 0.5/RAM 384MiB/방 2개 제한을 생성한다. staging 교사 비밀번호는 서버의 `.releaseops/staging/.env`에서 본인만 확인한다. 채팅/저장소로 복사하지 않는다.

검토 후 한 번 수행할 설정:

| 위치 | 설정 |
|---|---|
| DNS/TLS | 계획한 staging 호스트가 같은 Lightsail IP를 가리키는지 확인. 기본 제안 주소는 아직 공개 검증된 주소가 아니다. 별도 origin이므로 저장소/재접속 토큰/QR도 운영과 분리된다. |
| Caddy | `.releaseops/Caddy.staging.fragment`를 기존 `deploy/Caddyfile`에 추가하고 설정을 검증한 뒤 경기 없는 시간에 한 번 reload. 기존 운영 블록/인증서/볼륨은 유지. staging은 별도 Docker network alias `dsbr-staging:8080`, host loopback 포트 8081. `/admin/*`는 양쪽 모두 차단. 이후 배포는 Caddy를 건드리지 않는다. |
| 서버 자원 | 기본 여유 RAM 512MiB/디스크 2GiB 필요. 운영 경기 중 staging 배포는 DEFERRED. 이미지 빌드는 GitHub runner에서만 수행. 부족하면 staging을 차단하고 운영을 덮어쓰지 않는다. |
| Actions environments | `staging`, `production` 생성. 가능하면 production reviewer와 main branch 제한 설정. 환경 승인 기능 지원 여부는 이번 작업에서 미확인. |
| 두 environment Secrets | `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `KNOWN_HOSTS`. SSH known-host 지문을 직접 확인한다. Docker 제어 권한은 사실상 호스트 관리자 권한이므로 전용 배포 계정/접근 IP 제한을 사용한다. PR에는 이 secrets가 전달되지 않는다. |
| Variables | `DEPLOY_STATE_DIR=/home/ubuntu/dsbr-v33/.releaseops` (실제 절대 경로), `PUBLIC_HTTP_API_URL=https://15-165-114-145.sslip.io`, `STAGING_HTTP_URL=https://staging.15-165-114-145.sslip.io`, 준비 후 `STAGING_ENABLED=true`. production은 별도 승인 전까지 `PRODUCTION_WS_ENABLED=false`. |
| 최초 Pages 전환 | 기존 공개 Pages 전체 파일을 `.releaseops/pages-current/`에 보존하고 기존 게시 source/branch/path를 별도 기록한다. root `index.html`은 이 PR에서 변경하지 않는다. 실제 게시본이 root와 같은지 확인 없이 복구본으로 간주하지 않는다. |
| Origin | 운영 `.env`의 기존 Origin을 유지하면서 정확한 `https://yeomt.github.io`를 추가한다. `/DSbettleroyale/` 경로를 Origin에 넣거나 `*`로 풀지 않는다. staging에는 staging Origin만 둔다. |
| 최초 활성화 | TLS/WSS, staging 실제 교사/학생 smoke, Pages 변형 시험을 확인하고 사용자 승인을 받은 뒤 Pages source를 GitHub Actions로 설정하고 `PRODUCTION_WS_ENABLED=true`. **변수 하나만 켜는 것으로 초기 설정을 대체하지 않는다.** |

위 설정 완료 전 workflow 요약의 `ARTIFACT_READY`는 빌드만 된 상태다. `DEPLOYED_VERIFIED`는 공개 HTTP/version/WSS, Pages(운영), 교사1+학생2 headless smoke까지 성공한 경우다. 외부 음원 청취·학교 30대 검증은 포함하지 않는다.

## 안전성과 복구

배포는 사전 점검/실제 이전 이미지 기록 → 입장 제한 → 최대 10분 경기 종료 대기 → seal → 새 이미지 적용(입장 차단) → 네 필드 버전/WSS 검사 → Pages 게시/실제 asset 확인 → 설정 영속화/startup drain 정리 → 입장 재개 → 짧은 공개 교사/학생 smoke 순서다. 대기실은 메모리 상태이므로 교체 후 다시 만들 수 있다. 진행 경기 강제 종료나 `compose down`은 사용하지 않는다.

이미지와 checksum/소스 tree/타깃별 공개 설정/검사 시간은 불변 manifest로 보존한다. 실제 이전 정상 릴리스와 단계는 서버 `transaction.json`, `receipt-<SHA>.json`에 기록한다. 재시작 admission 파일은 실패 중 닫혀 있고 완료 후 열린다. `SERVER_IMAGE`, `DRAIN_ON_START`만 원자적으로 갱신한다. 초기 v33.2 이미지에는 파일 admission 기능이 없으므로 복구 시 `DRAIN_ON_START=true`로 시작하고 쌍 검증 후 false로 재생성한다.

서버 적용 전 실패는 기존 컨테이너를 재생성하지 않는다. 적용 후 실패는 이전 이미지와 이전 Pages 전체를 복구한다. 불일치하면 `ROLLBACK_FAILED`로 차단을 유지한다. 최초 Firebase Pages → AWS 전환 실패는 저장한 기존 Pages 파일과 기존 AWS 이미지를 함께 복구하는 경로다. 성공 후 AWS 릴리스 사이의 일반 롤백과 다르다. 게시 source 설정 자체를 예전 branch 방식으로 되돌리려면 처음 기록한 설정을 사용자가 복원한다. Firebase 데이터/설정은 자동화가 변경하지 않는다.

운영/테스트/복구 workflow는 공통 concurrency로 직렬화하고 호스트에서는 `flock`과 영속 transaction으로 중간 중단까지 감지한다. 최근 정상 릴리스 3개 이상/30일 보존을 목표로 **자동 삭제하지 않는다**. archive 기본 상한 20GiB와 여유 공간 미달 시 차단한다. 현재/직전/복구 필요 파일을 지우는 자동 prune은 없다. 정리는 유지보수 시간에 보존 기간과 정상 릴리스 수를 확인한 뒤 별도 승인으로 수행한다.

## 빠른 검사 정책

```bash
node tools/ci/plan.mjs origin/main
npm run quick
npm run build
npm run test:targeted
```

`artifacts/check-plan.json`에 범위·위험도·NOT_RUN을 남긴다. 문서만이면 정책 검사, CSS면 공통+대표 렌더+해당 모바일/데스크톱 화면 검사다. 실행 JS는 UI 폴더라도 고위험으로 분류한다. 공용 통신/엔진은 전체 빠른 integration/parity와 26연결 30초 검사를 추가한다. diff의 명시적 캐릭터 ID는 해당 ID의 두 renderer balanced 검사를 추가한다. 캐릭터 ID를 추론할 수 없는 공용 렌더 변경은 대표 근접/투사체/스킬과 화면 경계를 검사하며 넓은 정밀 검사는 필요할 때 Deep Audit에서 명시적으로 선택한다.

quick 실행 상한은 로컬 5분/CI job 10분, targeted CI job 10분이다. 캐시 없는 실행/브라우저 설치 시간과 GitHub 큐/승인/경기 종료 대기는 별도다. 동일 source/검사 조건에서 통과한 suite를 무관한 문서 변경 때문에 로컬에서 반복하지 않는다. CI는 정확한 새 커밋에 필요한 검사를 실행하며 이전 HEAD 결과를 새 main PASS로 사칭하지 않는다.

전수 roster 462조합, 카메라 9000프레임, layout 30조합 등은 삭제하지 않았고 **Deep Audit**에서 suite별로 실행한다. 평소에는 선택되지 않은 깊은 검사를 NOT_RUN으로 기록한다. 기존 수치/parity의 빠른 77종 데이터 검사는 계속 공통 검사에 남는다.

공식 참고: [Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Actions 승인/배포](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments), [Docker BuildKit 캐시](https://docs.docker.com/build/ci/github-actions/cache/).
