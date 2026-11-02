# 이모지 클래스 배틀 v33 · WebSocket migration

기존 77종 게임을 서버 권위형으로 분리한 작업 브랜치입니다. 원본 `index.html`과 `legacy/v32.1/index.html`을 보존합니다. 이 PR은 기존 main/Pages/Firebase를 전환하지 않습니다. 상세 검증 범위와 미완료 사항은 [인수표](docs/acceptance.md), [진행 기록](docs/progress.md)을 확인하세요.

## 로컬 실행

Node **24.22.1**과 npm을 설치한 뒤 저장소 루트에서 실행합니다. Windows에서는 Docker 없이 개발할 수 있습니다.

```sh
npm ci
npm run dev
```

**로컬 주소:** http://127.0.0.1:5173. 교사 비밀번호 기본값은 `local-teacher`입니다. 교사 창에서 방을 만들고, 별도 브라우저 프로필/시크릿 창 두 개에서 6자리 방번호와 서로 다른 닉네임으로 참가합니다. 퀴즈→배정→준비→전투→교사 경기 종료→결과→같은 방 재경기를 확인할 수 있습니다. 학생은 WASD/방향키, Space 공격, E/Shift 스킬 또는 화면 조이스틱·버튼을 사용합니다. 교사 비밀번호는 서버 환경변수 `HOST_AUTH_SECRET`으로 바꿉니다.

```sh
npm run verify
npm run build
npm run start:server
```

빌드 서버의 **로컬 주소:** http://127.0.0.1:8080. `start:server`는 Vite preview가 아닌 실제 HTTP/WebSocket 서버입니다. `?renderer=canvas`는 Canvas 경로, `?netdebug=1`은 계측 화면입니다. 새로고침 재접속은 탭의 `sessionStorage`에 저장한 토큰으로 복원되며, 서버 프로세스가 종료되어 방이 사라지면 방 만료를 안내합니다.

## 시험

```sh
npm run test:unit
npm run test:parity
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run test:load -- --players=26 --seconds=600
node tools/network/run.mjs
```

Windows에서 설치된 Edge를 이용하려면 PowerShell에서 `$env:PLAYWRIGHT_CHANNEL='msedge'`를 먼저 설정합니다. CI는 Chromium을 설치합니다. `verify`는 경계 검사, unit/parity/실제 loopback WS 시험, 양쪽 build를 실행하고 실패 시 0이 아닌 종료코드를 반환합니다. 브라우저·장시간 부하·공개 배포는 별도 시험입니다. `tools/load/matrix.mjs`는 20/26/30명 각 600초를 실행합니다. 시험 봇은 서버 fixture로 XP20을 받고 실제 제안된 카드를 선택하며, 퀴즈 답은 전용 시험 문제의 정답으로 풉니다. 실제 교실 기기 성능을 측정하지 않습니다.

## 휴대폰 LAN 시험

공개 배포가 아닙니다. 서버 PC의 방화벽/동일 Wi-Fi 환경을 확인하고 다음 환경값을 명시합니다.

```powershell
$env:ALLOW_LAN='true'
$env:HOST='0.0.0.0'
$env:LAN_HOST='0.0.0.0'
$env:HOST_AUTH_SECRET='choose-a-private-test-password'
$env:ALLOWED_ORIGINS='http://192.168.0.10:5173'
npm run dev
```

`192.168.0.10`을 해당 PC의 LAN 주소로 바꿉니다. 휴대폰은 그 주소의 `:5173`으로 접속합니다. localhost QR은 다른 기기에서 PC를 가리키지 않습니다. 서버를 종료한 뒤 환경변수를 원래대로 복원하세요. HTTPS 공개 운영은 [배포 안내](docs/deployment.md)를 따릅니다.

## 구조

| 경로 | 역할 |
|---|---|
| `apps/client` | 원본 화면·Pixi/Canvas·입력·표시 보간·오디오 |
| `apps/server` | 인증·방·퀴즈·draft·60Hz runner·20Hz snapshot·복구 |
| `packages/engine` | 26개 책임 모듈, 원본 77종 전투·성장·모드 |
| `packages/content` | 최종 override 이후 manifest·영구 ID |
| `packages/protocol` | 엄격한 메시지 스키마·버전 fingerprint |
| `tests` | 원본 fixture·규칙·통신·브라우저 회귀검사 |
| `tools/load`, `tools/network` | 실제 TCP/WS 부하·지연 시험 |
| `deploy`, `.github/workflows` | Docker/Caddy·CI·drain·paired release/rollback |

원본 함수와 새 모듈의 대응은 [source-map.json](docs/source-map.json)에 있습니다. 공개 배포 자격증명이 없으므로 현재 공개 v33 주소는 없습니다. 유료 자원과 운영 Firebase를 생성·변경하지 않았습니다.

Lightsail 서울 서버 테스트 실행: [설정 및 명령어](docs/lightsail-ko.md). 현재 배포 상태와 검증 한계는 [70개 인수 기록](docs/acceptance.md), [실측 부하 결과](docs/metrics/README.md)를 참조하세요.
