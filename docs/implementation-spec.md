# DSbattleroyal v33 — WebSocket·모듈화·GitHub 자동 반영 구현 명세

작성일: 2026-11-02  
작업 대상: `YEOMT/DSbettleroyale`  
작업 브랜치: `codex/ws-migration-v33` 또는 충돌하지 않는 동명 계열 브랜치  
기준 게임: **v32.1 Student Smoothness**  
최종 목표: **기존 게임 전체를 보존한 서버 권위형 WebSocket 버전**

> 이 문서는 Codex의 실제 구현 지시다. 설계만 제시하거나 연결 데모·일부 캐릭터 시제품으로 끝내지 않는다. 최신 실제 소스를 읽고, 분리·구현·실행·회귀검사·commit·push·PR 생성까지 수행한다. 결제·유료 자원 생성·운영 main 강제 교체는 이 지시의 승인 범위에 포함하지 않는다.

---

## 0. 작업의 핵심 결정과 완료의 의미

### 0.1 확정 아키텍처

- 클라이언트: 기존 HTML/CSS/PixiJS 화면과 조작을 재사용한 모듈형 웹앱.
- 서버: **브라우저 없이 실행되는 Node.js 전투·방 관리 서버**.
- 실시간 연결: 브라우저 native WebSocket ↔ Node.js `ws`. 배포 시 WSS.
- 공통 코드: 기존 이동·충돌·캐릭터·스킬·증강·모드 로직을 추출한 공유 패키지.
- 판정의 단일 주인: 서버. 학생과 교사 화면은 서버에 연결하는 클라이언트.
- 교사 역할: 방 운영, 퀴즈/게임 시작·종료, 강제 퇴장, 전체맵 관전. 더 이상 브라우저가 전투 권위자가 아니다.
- 전투 시뮬레이션: 기존과 같은 **60Hz 고정 스텝**.
- 초기 학생 상태 전송 목표: **20Hz / 50ms**. 30Hz는 비교시험을 통과했을 때만 선택 설정으로 추가.
- 학생: 자기 입력 즉시 반응, 제한된 로컬 이동 예측, 상대·투사체의 연속 표시. 최종 적중·HP·스턴·점수는 서버 확정.
- 정적 화면 배포: 기존 GitHub Pages 주소 유지 가능한 빌드.
- 서버 배포 준비: Docker Compose + Caddy. 실제 호스팅·도메인·자격증명은 설정 주입.
- 저장소: 우선 **현재 저장소 하나 안에 client/server/shared를 나눈다**. 다른 게임 저장소는 수정하지 않는다.

### 0.2 하지 않을 것

- 새 게임으로 재작성, 캐릭터 축소, 모드 삭제, 임시 원형 캐릭터로 그래픽 대체.
- 6레벨·스킬 상향·왕귀·엄폐 환경의 임의 롤백 또는 추가 밸런스 변경.
- Firebase 호출을 WebSocket send로 치환하고 호스트 판정을 그대로 둔 상태를 최종 완료라고 보고.
- 전원 P2P, 결정론적 락스텝, 전체 전투 롤백, 새 물리 엔진 도입.
- 실시간 상태를 계속 Firebase에 기록하면서 WebSocket에서도 이중으로 승인.
- Node 서버 안에서 headless Chrome을 운영 게임 엔진으로 사용.
- 기존 거대 script를 `legacy.js` 하나로 옮기거나 문자열 eval로 실행하고 모듈화 완료라고 보고.
- 실측 없이 0ms·무렉·30명 무조건 60FPS 보장.

통신 중계 실험은 필요할 때 내부 비교용으로만 허용한다. 최종 산출물은 서버가 전투를 계산하는 버전이어야 한다. 별도 중계 버전을 필수로 만들면서 작업량을 불필요하게 늘리지 않는다.

### 0.3 자동화 승인 범위

허용: 기존 저장소 확인/clone, 작업 브랜치 생성, 파일 편집, 로컬 테스트, commit, 권한이 있을 때 branch push와 PR 생성, 테스트·빌드 workflow 작성.

기본적으로 금지: main 직접 push, force push, 히스토리 재작성, 브랜치 보호 해제, PR 자동 merge, 유료 서버·도메인 구매, 운영 Firebase 변경/삭제, 승인 없는 운영 서비스 재시작.

사용자가 PR을 승인·merge한 뒤, 미리 설정된 안전한 workflow가 빌드·배포하도록 구성한다. **GitHub에 소스가 올라간 것과 인터넷에서 게임 서버가 작동하는 것은 다른 상태**다.

---

## 1. 실제 기준본과 출처 고정

### 1.1 작성 시점에 확인한 기준

| 항목 | 확인값 |
|---|---|
| 저장소 | `YEOMT/DSbettleroyale` |
| main 커밋 | `1292f87528436e7182dcf066c6b9576d71c1cbed` |
| 루트 게임 파일 | `index.html` |
| 파일 크기 | 1,356,097 bytes |
| Git blob SHA-1 | `4e6845b4565170ee2c84e75c0eee5dcc4f98ceac` |
| 파일 SHA-256 | `a006aa596c5640ffe127774f271fce7afce81a4769525979fa453f9107ac5d36` |
| br-build | `v32.1-student-smoothness-2026-10-30` |
| 동일 보관 파일 | `DSbattleroyal_v32_1_Student_Smoothness.html` |
| PixiJS 기준 | `8.20.1` |

이 표는 실행 시점의 최신 커밋을 무조건 덮어쓰라는 지시가 아니다. 시작 시 `git status`, remote, branch, 최근 commit, 실제 build 표식과 해시를 확인한다. 저장소가 더 진행되어 있으면 변경을 조사하고 최신 사용자 작업을 보존한다. 서로 다른 코드가 있으면 `docs/baseline.md`에 차이와 선택 근거를 기록한다. 파일명만 보고 v32로 되돌리지 않는다.

### 1.2 기준본 보관

- 수정 전 원본을 `legacy/v32.1/index.html` 또는 `tests/baseline/v32.1.html`에 한 부 보관한다.
- `docs/baseline.md`에 커밋·해시·파일 크기·build ID·사용한 테스트 환경을 기록한다.
- 원본은 비교·복구용이며 신규 클라이언트나 서버가 원본 HTML을 런타임에 eval해서는 안 된다.
- 기존 파일에 공개 Firebase 클라이언트 설정이 있더라도 service-account 키·SSH 키·토큰으로 오인해 새 비밀값을 추가하지 않는다. 실제 비밀 여부는 검사한다.
- 운영 Firebase에 연결하지 않는 기존 함수 실행/브라우저 테스트 하네스를 만든다.

### 1.3 최근 실전 로그를 올바르게 사용

2026-11-02, v32.1, team-capture, 26명, 257.4초 경기의 제공된 학생 보고서:

- FPS 평균 59.7 / frame P95 18ms.
- 생존 수신 간격 평균 159.7ms / P95 318ms / 최대 1,255ms.
- 생존 입력 ACK RTT 중앙값 255ms / P95 445ms.
- accepted frame delta 기준 생존 source gap 평균 159.3ms / P95 200ms.
- 생존 arrival authority age 평균 145.6ms / P95 321ms.
- 상대 모델 보정 P95 111 world units, 자기 권위 보정 P95 14 world units.

해석 제한:
- accepted frame delta는 **수신되어 수용된 프레임끼리의 간격**이다. 호스트의 모든 생성 기록을 직접 관측한 값이 아니다.
- source gap과 arrival gap의 P95를 빼서 특정 네트워크 구간의 지연으로 쓰지 않는다.
- packet/shot age는 원본 데이터 나이 추정값이지 실제 표시 좌표 오차나 순수 편도 지연이 아니다.
- Hold 17.9%는 사망·관전과 정지 대상이 섞인 actor-ms 집계다. 전투 시간 17.9%가 멈췄다고 주장하지 않는다.
- FIRST DRAW→HIT에는 실제 비행·반응 시간이 들어간다. 전부 통신 지연이 아니다.
- 이번 패치의 효과는 동일 조건 비교와 새로운 실제 계측으로 검증한다.

---

## 2. 게임 보존 계약

**전투 규칙·콘텐츠·화면·입력은 원본 구현이 기준이다. 기존 주석이나 과거 문안보다 마지막 실제 적용 경로를 우선한다.** 동기화 권한 변경은 이번 작업의 의도된 변경이며, 이를 빌미로 게임 규칙을 바꾸지 않는다.

### 2.1 콘텐츠와 전투

- 활성 로스터 77종과 영구 ID, 삭제 ID, 이름 복원/리워크 순서, 원본 등급 추첨 확률.
- 최종 basic profile으로 판단한 근접/원거리 구분. 원본 `type`만으로 새로 분류하지 않는다.
- v29~v32에 누적된 HP·이속·평타·원거리 스킬 조정, B/C HP 보정, 박쥐 평타 보정.
- 최대 6레벨, 누적 XP 2/5/9/14/20, 총 5회 선택, 개별 증강 III 상한, 사망 XP 상한 6.
- 왕귀의 현재 실제 배율, S 제외, TITAN/HEAVY/AMPLIFY 상호배타.
- 77종 스킬, native/BRRework 공격체, 도트·유도·왕복·반사·포탑·빔·장판·돌진·납치·방어·회복.
- 스킬/일반공격 배율 1회 적용, 시전 snapshot, life/ability 경계, 상자 고정 파괴 규칙.
- 넉백과 실제 스턴을 분리하는 원칙, 현행 제어 상한, 타격·피격 확정 조건.

### 2.2 모드

- 개인전 `solo`.
- 팀 생존전 `team-elim` 및 기존 alias 처리. 개인전과 동일 HP 배율 1.0, 기존 분산 스폰·팀 구분.
- 팀 점령전 `team-capture`: 2~4팀, 300/360초 설정, HP 0.70, 맵 선형 비율 .88.
- 점령전 A/C 선활성, 120초 후 B 활성, B 득점 ×1.5, 마지막 60초 FEVER ×2.
- 팀별 동일 스폰/리스폰, 계속되는 부활 퀴즈·리롤, 경기 전체 누적 KDA/점령 기여/사용 이모지 기록.
- 기준 코드는 거점의 단독 최다 팀과 **인원 차(delta)**에 따라 득점률을 산출한다. 과거 설명만 보고 총인원 기반으로 바꾸지 않는다.
- 내부 `team-respawn`가 비노출 호환 경로이면 제거하지 말고 호환 유지·시험 여부를 기록한다. 새 정식 모드로 노출하지 않는다.

### 2.3 자기장·맵·성장 자원

- 일반 수축: 기본 .70 × solo 1.60 / team-elim 1.10.
- 긴급 압축은 별도 기존 계수(solo 1.50, 그 외 1.00), 진입 유예 300ms, 예고/압축 시간 보존.
- 고정 엄폐, 연막 은폐/공격·피격 노출, 측면 파밍 배치, 통로 폭, 픽업 크기·습득 조건 보존.
- 이동과 공격의 벽·상자 판정, 최대 캐릭터 크기, 팀 테두리.

### 2.4 학생·교사 경험

- 기존 모바일 조이스틱, 공격 탭의 이동 방향 우선, 수동 조준 우선, 약한 조준 보정.
- 이동하면서 증강 선택 가능한 멀티터치, PC 조작, 화면 회전/resize, 음소거·reduced-motion.
- 레벨 글자, 3단계 그래픽 품질, 도감, 호스트 전체맵·방번호·QR·점령 화살표·스코어·시상.
- 기존 문제 입력/TXT 가져오기 양식·내장 문제·정오답 동작·리롤 계산.
- 로비→퀴즈→이모지 선택/리롤→경기→시상→같은 멤버 재경기.
- 로비/퀴즈/리롤 BGM, 전반부→후반부→후반부 반복, 중복 재생 방지.
- 학생 설치 불필요, 기존 query `room`, `join`, `netdebug`를 호환한다.

### 2.5 자동 기준 추출

`npm run baseline:extract`로 기존 초기화·override가 끝난 **최종 유효 데이터**를 추출한다. 최소 결과:

- 77종 ID/이름/등급/기본 HP/몸 크기/이동속도/최종 평타 profile.
- 스킬 최종 정의, 증강 정의·상한·적격성, 모드·자기장·성장 설정.
- 실제 생성·공격 경로의 결과 fixture.

raw `EMOJI_DB`만 JSON으로 빼고 완료하지 않는다. 원본은 후속 등록/override가 많은 구조다. 콘텐츠 manifest에 stable hash를 생성하고 신규 서버·클라이언트가 같은 manifest를 사용하게 한다.

---

## 3. 저장소 구조와 개발 도구

초기 구조 예시. 파일 이름은 실제 책임에 맞게 조정 가능하지만 경계를 지킨다.

```text
DSbettleroyale/
  AGENTS.md
  README.md
  package.json
  package-lock.json
  .nvmrc
  .gitignore
  .env.example
  apps/
    client/
      index.html
      vite.config.*
      src/
        main.*
        ui/                 # 로비·퀴즈·draft·증강·결과
        input/              # 조이스틱·멀티터치·조준
        render/             # Pixi·Canvas fallback·카메라·글자
        audio/
        net/                # WSS·세션·시계·수신·resume
        presentation/       # 자기 예측·상대·투사체·이펙트
        state/
      public/
    server/
      src/
        main.*
        config.*
        http/               # health·version·관리 인증
        ws/                 # 연결·검증·송수신·backpressure
        rooms/              # 권위 상태 머신·멤버·명령
        simulation/         # 고정 tick runner
        snapshots/          # 학생 AOI·교사 전용 view
        storage/            # 비동기 기록·선택 Firebase 어댑터
        diagnostics/
  packages/
    engine/
      src/
        world/
        movement/
        collision/
        combat/
        abilities/
        progression/
        farm/
        modes/
        visibility/
        clock/
        rng/
        events/
    content/src/            # roster·augments·mode·quiz 기본 데이터
    protocol/src/           # schema·버전·codec·메시지 타입
    shared/src/             # Vec2·순수 수학·제한된 공통 util
  tests/
    baseline/
    unit/
    parity/
    integration/
    e2e/
    load/
    network/
  tools/
    baseline/
    load/
    release/
  deploy/
    Dockerfile
    compose.yml
    Caddyfile.example
    server.env.example
    README.md
  docs/
    baseline.md
    architecture.md
    parity-matrix.md
    protocol.md
    network-policy.md
    security.md
    operations.md
    progress.md
    acceptance.md
  .github/workflows/
    ci.yml
    release.yml
    rollback.yml
  legacy/v32.1/index.html
```

### 3.1 도구 선택

- **npm workspaces**와 루트 `npm ci`를 기본으로 한다. 불필요한 별도 패키지 관리자/대형 모노레포 도구는 추가하지 않는다.
- Node.js 24 LTS 계열의 지원되는 보안 패치를 선택하고 개발·CI·Docker 버전을 맞춘다. 실제 선택 버전/이미지 digest를 기록한다. `latest`를 무조건 따라가지 않는다.
- 기존 JS 엔진은 동작 보존을 위해 JS ES modules + JSDoc/checkJs로 먼저 추출해도 된다. 새 protocol/server 경계에는 TypeScript나 runtime schema를 사용한다.
- 전 파일 TypeScript 전환, React 도입, 새 렌더러로 변경을 이 작업에 섞지 않는다.
- 브라우저는 native WebSocket, Node는 `ws`. Socket.IO/폴링 자동 전환은 사용하지 않는다.
- PixiJS는 기준 8.20.1을 고정해 사용한다. 의존성 업그레이드와 네트워크 이전을 섞지 않는다.
- Vite는 빌드 도구로 사용하며 운영 서버로 `vite preview`를 사용하지 않는다.
- Vitest 또는 동급 단위 시험 + Playwright 실제 브라우저 + 실제 `ws` integration/load를 구성한다.
- lockfile 커밋. node_modules/dist/.env/키/실제 학생 데이터/실제 로그는 커밋하지 않는다.

### 3.2 공통 엔진 의존성 제한

`packages/engine`, `content`, `protocol`은 DOM, Canvas, Pixi, Audio, Firebase, WebSocket, 전역 `window.BRMP`를 import하지 않는다.

기존 `Participant` 생성자의 이모지 캔버스 생성, `GameWorld`의 렌더/오디오 호출 등을 제거하는 대신 typed/structured event sink로 전달한다. 타격 이펙트를 제거해서 전투 RNG 순서를 바꾸지 않는다.

전역 game/teamMode/seedState를 room-scoped context로 바꾼다. 방 A의 난수·시간·캐릭터가 방 B에 영향을 주면 실패다. 공통 mutable singleton으로 두 방을 격리했다고 주장하지 않는다.

---

## 4. 실행 단계 — 분석만 하고 종료하지 말 것

### M0. 인벤토리·기준 시험·Git 준비

1. 원격/로컬 상태·기준 해시·기존 변경 확인. 사용자 미커밋 작업 보존.
2. 명시 브랜치 생성/재사용, 원본 보관, content/규칙 manifest 추출.
3. 기존 앱 오프라인 실행과 주요 행동을 재현하는 fixture 구성.
4. 기능별 원본 함수→신규 모듈 대응표와 완료 체크리스트 작성.

### M1. 동일 게임 모듈화·헤드리스 엔진

- 먼저 원본 동작을 바꾸지 않고 코드 경계를 만든다.
- 엔진을 Node에서 실제로 import/create/step/export 가능하게 한다.
- 테스트 전용 브라우저/VM 원본과 신규 엔진에 같은 입력·시간·난수·배치를 제공한다.
- DOM stub에 핵심 동작을 숨겨 Node 시험만 통과시키지 않는다.
- 브라우저 공유 prediction code는 엔진의 최소 이동·벽 충돌 subset을 재사용한다.

### M2. 방·퀴즈·draft·WSS 연결

- 로컬 실제 HTTP+WebSocket 서버로 방 생성~경기 시작 전까지 완주.
- 연결/auth, roster/protocol 검증, 재연결, 명령 중복처리를 구현한다.
- 퀴즈 이후 기본 캐릭터가 항상 유효하게 배정되는 원칙을 보존한다.

### M3. 서버 권위 전투·3개 모드 전체

- 서버 runner가 이동/투사체/스킬/피해/성장/자기장/점령/시상을 실행.
- 교사 브라우저가 닫히거나 백그라운드여도 서버 전투는 멈추지 않는다.
- 호스트 전체맵 관전, 학생 AOI, 부활/퀴즈/리롤, 같은 방 재경기 구현.
- 이 단계가 끝나기 전 연결 데모를 완성본으로 표시하지 않는다.

### M4. 학생 연속성·진단·부하 검증

- 자기 예측/서버 ACK 재계산, 상대 표시 시간, native/RW 투사체 handoff/terminal을 검증.
- 2대 브라우저 E2E와 20/26/30개 실제 WS client load를 수행.
- 원본과 같은 그래픽·시나리오에서 비교. 네트워크 부하 시험과 렌더 성능 시험을 구분.

### M5. CI·배포 준비·GitHub 반영

- root 명령, 환경 예제, Docker/Caddy, CI/Pages/서버 배포와 rollback workflow.
- 검증 결과·미검증 항목·운영 전환 절차 작성.
- commit→push→PR 생성. 실제 remote commit/PR/Actions 상태를 확인해 보고.
- 서버 접근정보가 없어도 로컬 구현·시험·PR까지는 진행한다. 공개 서버 배포만 별도 미완료로 표시한다.

단계별 커밋을 남긴다. 하나의 PR에 순서가 분명한 커밋들을 모으는 것을 기본으로 한다. 작업 제한에 도달하면 `docs/progress.md`에 미완료 항목을 남기고 draft PR로 보존한다. 미완료를 완료라고 포장하지 않되 처음부터 M0만 하고 중단하지 않는다.

---

## 5. 서버 권위·전투 시간·공통 엔진

### 5.1 엔진 경계

의미상 다음과 동등한 API를 제공한다.

```ts
createWorld(content, modeConfig, seed, initialPlayers, eventSink)
applyCommand(world, verifiedCommand)
stepWorld(world, fixedDtMs) // 1000/60
getPrivateSelfState(world, playerId)
getVisibleState(world, playerId, interest)
getTeacherState(world)
exportResult(world)
destroyWorld(world)
```

- 시간·난수·ID generator·mode는 주입한다. 전투 규칙에서 직접 Date.now/성능 시계/DOM을 읽지 않는다.
- per-player draft/quiz RNG와 맵/전투 RNG의 원본 소비 순서를 구분·보존한다.
- cosmetic RNG는 authority RNG와 분리하고 서버에서 장식 난수를 돌리지 않는다.
- 실제 충돌·타격 순서, entity iteration 순서와 tie-breaker를 보존한다.
- 리워크 정의 등록 순서를 유지한다. closure가 옛 skill 객체를 캡처해 새로운 표만 바뀌는 회귀를 검사한다.
- 서버 효과는 typed events를 출력하며 client가 기존 painter/오디오로 표시한다.

### 5.2 60Hz runner

- 명목 타이머 호출 횟수가 아니라 monotonic elapsed+accumulator로 고정 스텝을 실행한다.
- 물리 dt는 늘리지 않는다. 1회 100ms 이동·충돌 처리로 작은 스텝을 대체하지 않는다.
- snapshot 20Hz는 물리60Hz와 별개. 학생 ACK나 교사 렌더 완료를 기다리지 않는다.
- 시뮬레이션 tick·자기장·점령·쿨타임·도트·제어 시간은 같은 방 시간 기준에 일치시킨다.
- 기존 정상 60Hz 실행과 결과가 일치해야 한다. 벽시계 지연 시 어떤 active-time 정책을 쓰는지 ADR로 명시한다.
- catch-up 작업은 한 event-loop turn에 최대 5 tick 정도로 제한하고 나머지는 yield한다. 이 제한을 이유로 전투 tick·명중·피해를 조용히 생략하지 않는다.
- 처리 부채가 예컨대 250ms를 지속 초과하면 overload 진단과 room-level 안전 일시정지/진입 제한을 적용한다. 자기장만 앞으로 진행시키지 않는다. 과부하 시나리오를 시험하고 UI에 상태를 알려준다.
- 정상 목표를 달성하지 못했으면 물리30Hz로 몰래 낮추거나 탄·적을 삭제하지 않는다.

### 5.3 서버 수용량

초기 운영 기본값은 active battle 1개, 참가 학생 최대30명, 운영/관전 제한 소수다. 다중 방 데이터 격리는 구현하지만, 소형 서버에서 여러 전투를 동시에 안정적으로 처리한다고 가정하지 않는다.

2개 방의 상태 격리 시험은 필요하다. 실제 동시 방 한도는 측정 후 env로 올린다. Redis·Kubernetes·마이크로서비스·방마다 worker는 첫 버전의 필수사항이 아니다.

---

## 6. 방·퀴즈·draft·부활의 단일 소유권

### 6.1 WS 방의 전체 상태는 서버가 소유

권위 phase:
`LOBBY → QUIZ → DRAFT → BATTLE → RESULTS → LOBBY(next match)`.

점령전 플레이어별 상태:
`ALIVE → DEAD_QUIZ → DRAFT/KEEP → SPAWN_PROTECTED → ALIVE`.

- room instance UUID, match UUID/round, player stable ID, lifeSeq, connectionEpoch을 분리한다.
- 6자리 방번호는 검색 편의용이다. 식별 충돌과 재사용에 대비해 내부 instance ID가 별도로 필요하다.
- 입장/재입장·동일 닉네임·새 탭·이미 퇴장된 세션을 구분한다.
- 교사 명령은 인증된 host role만 실행한다. 학생이 host flag를 붙여 요청해도 승인하지 않는다.
- 실제 방번호·QR·플레이어 목록·mode·graphics·team·quiz 설정 UI 유지.

### 6.2 퀴즈

- 기존 문제 가져오기 parser·정오답 피드백·잠금 시간·리롤 산출 규칙을 보존한다.
- 새 서버에는 검증된 문제 bank를 1회 등록하고, 전투 틱마다 읽거나 Firebase에 쓸 필요가 없게 한다.
- 제출은 questionId/attemptId/answer/requestId 기반. 점수·정답 수·리롤권은 서버가 계산한다.
- 학생이 보낸 score/finished를 무조건 믿어 권한을 부여하지 않는다.
- 서버가 이미 인정한 동일 응답의 재전송은 같은 결과를 반환하고 점수를 다시 더하지 않는다.
- phase 전환과 늦은 답변 race를 처리한다. 마감 후 과거 답변이 새 라운드 점수에 섞이지 않는다.
- 문제 업로드는 인증된 교사만, 크기/문항 수 상한, UTF-8/BOM·기존 한글/영어 형식 확인. 학생 닉네임·문제 문자열은 HTML로 그대로 삽입하지 않는다.

### 6.3 기본 배정 보장과 리롤

- quiz 단계를 마친 유효 참가자는 정답0개라도 기본 캐릭터1개를 받는다.
- `abilityId`가 영구 ID로 존재하고 모드별 선택 조건을 만족해야 한다.
- 리롤 요청은 {match, life, draftRevision, requestId}로 멱등 처리한다.
- 권리 차감과 새 배정은 서버의 하나의 직렬 처리에서 결정한다. 권리만 사라지거나 캐릭터가 비어 있는 중간 상태를 보내지 않는다.
- 응답 유실·새로고침에는 마지막 확정 카드와 실제 남은 리롤권을 복원한다.
- 중복 확정/리롤/게임시작 요청은 중복 적용하지 않는다.
- 배정할 수 없으면 해당 단계의 명확한 복구/오류 상태를 보내고 무한 '?' 선택 중에 두지 않는다. 단순 코드 버그를 무작위 캐릭터로 덮지 않는다.
- 로비·퀴즈·draft의 교사 강제퇴장 기능 유지.

### 6.4 동일 방 재경기

- 새 matchId/round를 원자적으로 발급.
- 이전 life의 HP, 사망/스턴/impulse, cooldown, run, offers, pending 선택, projectile, turret, field, hit ledger, input seq, scoreboard, ring/capture, client interpolation history 초기화.
- 닉네임·연결 identity 등 보존할 값은 기준본과 동일하게 유지.
- 이전 경기의 늦은 action/ACK/snapshot/이펙트는 새 경기에서 무시.
- 한 경기 안의 누적 KDA·점령 기여·사용 이모지와 재경기 초기화를 혼동하지 않는다.

---

## 7. Firebase의 역할 — 전투 핫패스에서 제거

### 새 WS 모드

Firebase 설정·접속이 없어도 로비부터 결과까지 실행 가능해야 한다. 최소 로컬 동작은 서버 내장 문제·호스트 TXT 업로드·메모리 방 상태로 완주한다.

- 이동, 스킬 요청, VIEW, run/farm, 자기장, 점령, 퀴즈 승인, 리롤, 증강 선택, 부활을 Firebase 완료 대기에 묶지 않는다.
- 기존 문제 bank·계정·경기 기록 저장이 필요하면 `storage` 어댑터로만 사용한다.
- 결과 저장은 match 종료 시 비동기, idempotent match key 사용. 실패해도 게임 결과·재경기를 막지 않는다.
- 개인정보가 담긴 결과를 공개 GitHub나 정적 assets에 올리지 않는다.
- 서버 로컬 결과 저장이 필요하면 제한된 JSON 기록 또는 경량 SQLite 하나를 볼륨에 보관하고 retention 설정을 둔다. 첫 구현에 새 외부 DB를 필수화하지 않는다.

### 기존 Firebase 버전

- 기존 운영 방/규칙을 변경하지 않는다.
- 비교용 원본은 별도 legacy 경로로 유지한다. 새 WS 방과 Firebase 방을 같은 room namespace로 혼합하지 않는다.
- 연결 실패 때 WS→Firebase로 조용히 전환하여 두 authority가 생기는 동작을 금지한다.
- Firebase 운영 permission rule을 약화하거나 개발 편의를 위해 공개 쓰기를 허용하지 않는다.

---

## 8. WebSocket protocol

### 8.1 최소 envelope

메시지 종류별로 필요한 필드만 wire에 담되 의미는 다음을 갖는다.

```ts
{
  type,
  protocolVersion,
  roomInstanceId,
  matchId,
  connectionEpoch,
  lifeSeq?,
  seq?,           // 입력/stream 해당 용도별 sequence
  requestId?,     // 재전송 멱등 요청
  serverTick?,
  payload
}
```

- schema, enum, 범위, 유한숫자, 문자열 길이 검증. unknown type은 안전하게 거부.
- 이름이 비슷한 seq라도 input seq, event seq, snapshot seq는 서로 독립.
- `protocolVersion`, contentHash, engine revision, buildId를 handshake에서 검증한다.
- wire version만 같고 게임 수치가 다르면 같은 방에서 싸우지 못하게 한다.
- 첫 버전은 작은 JSON/기존 compact array를 활용해도 된다. schema 상수로 인덱스 정의, encode/decode 왕복 시험 필수.
- binary를 새로 만들었다고 빠르다고 주장하지 않는다. 측정 전 premature binary/압축 도입 금지.

### 8.2 메시지 분류

| 분류 | 예시 | 의미 |
|---|---|---|
| 연결 | HELLO, WELCOME, AUTH, PING, PONG, RESUME | 버전·identity·시계·재연결 |
| 방 운영 | CREATE/JOIN/LEAVE, CONFIGURE, KICK, START/END/REMATCH | host/student 권한 검증 |
| 학습·배정 | QUIZ_ANSWER, DRAFT_REROLL, DRAFT_CONFIRM | 멱등 처리, 실제 승인 결과 |
| 성장·부활 | AUGMENT_CHOOSE, RESPAWN_KEEP/REROLL | offerId/life/revision 검증 |
| 입력 | INPUT_BATCH, ACTION | 정규화된 의도, 좌표·피해 아님 |
| 상태 | SELF_STATE, SNAPSHOT, FULL_STATE, PHASE | snapshot seq/tick 기준 수용 |
| 중요 사건 | SHOT_SPAWN/END, HIT, DEATH, LEVEL, RESULT | eventId/시전·발사 식별자 |
| 거절·복구 | COMMAND_RESULT, ERROR, VERSION_MISMATCH, RESYNC | 유한 retry와 명확한 UI |

스킬 입력이 held/edge 어떤 방식인지 기존 조작 계약을 보존한다. 중요한 이벤트 이름을 늘리는 것 자체가 목적은 아니며, 기존 event payload를 적절히 통합할 수 있다.

### 8.3 중요 이벤트와 최신 상태를 구분

- 최신 좌표 snapshot: 아직 `send()`하지 않은 과거 snapshot은 최신 1개로 대체 가능.
- action/처치/확정 결과/실제 shot lifecycle: 단순 snapshot coalescing과 함께 폐기하지 않는다.
- WS는 같은 연결의 순서 있는 전달을 제공하지만 재접속·앱 승인까지 exactly-once를 보장하지 않는다. requestId·eventId·ACK·state revision으로 보완한다.
- 모든 action을 매번 application ACK가 돌아올 때까지 막지 않는다. 멱등 처리 결과 ledger와 한정된 retransmit만 둔다.
- 접속별 수신 가능한 이벤트 로그를 bounded하게 유지. 초기안: 최대10초·최대2048개·최대1MiB 중 먼저 걸리는 한도. 초과하면 gap을 명시하고 FULL_STATE와 이벤트 cursor로 복구한다.
- view 밖 이펙트는 처음부터 수신자별 관련성을 판단해 제외할 수 있다. 그와 학생 자신의 사망·승인 결과 유실을 혼동하지 않는다.
- 재연결이 너무 오래된 경우 과거 이펙트를 모두 재생하지 않는다. 현재 실제 상태와 누적 기록을 복원하고 이미 끝난 공격을 다시 발동하지 않는다.

### 8.4 스냅샷

- 20Hz snapshot은 self-contained authoritative visible state를 기본으로 한다. 개체별 spawn/terminal 사건과 함께 사용한다.
- 큰 정적 맵/벽/문제 bank는 초기 또는 revision 변경 시에만 전송.
- delta 방식을 추가하면 기준 revision ACK와 full refresh가 필요하다. 누락된 baseline에 delta를 적용하지 않는다.
- player level 정수 외에 다른 학생의 비공개 증강 선택창·정답을 보내지 않는다.
- 교사는 별도 권한의 전체맵 snapshot. 학생에게 교사 stream이 유출되지 않게 한다.

---

## 9. 입력·자기 예측·권위 보정

### 9.1 입력 내용과 주기

- 학생은 normalized move/aim, aimPower, 버튼 상태·edge와 actionId, client input tick을 보낸다.
- 위치, HP, 공격력, hit target, cooldown 완료 여부를 클라이언트 확정값으로 받지 않는다.
- 표시 requestAnimationFrame과 분리된 60Hz 입력/예측 명령 모델을 둔다.
- 초기 network input 전송은 30Hz(고정 입력 명령2개씩 묶음) 수준. 방향 전환·버튼 edge는 작은 지연으로 우선 처리하되 rate-limit을 지킨다.
- 정지 상태에서도 적절한 zero-input heartbeat를 보내 sticky 이동/자동공격을 방지한다.
- 오래된 이동 명령 대기열을 끝없이 재생하지 않는다. action edge를 단순 최신 상태와 함께 지우지 않는다.
- 서버는 클라이언트가 많은 tick을 보냈다는 이유로 더 빨리 움직이거나 많은 공격을 하게 해서는 안 된다. 매 서버 물리 tick의 처리량과 실시간을 기준으로 제한한다.

### 9.2 서버 ACK가 설명해야 할 것

서버 snapshot의 자기 상태는 최소한 다음을 설명해야 한다.

- authoritative tick/position/velocity/control/impulse/collision relevant state.
- 어떤 입력 seq/clientTick까지 실제 적용했는지.
- dropped/replaced/expired된 입력의 판정 및 connection/life epoch.
- 처리한 action seq와 accepted/rejected 결과.

`lastReceivedSeq`를 `lastAppliedSeq`처럼 쓰지 않는다. 서버가 held input을 몇 tick 반복했는지와 client replay 경계가 일치해야 한다. 단순히 seq 하나만 추가하면 입력 재연산이 맞는다고 가정하지 않는다.

### 9.3 자기 이동 reconciliation

1. client가 입력 즉시 기존과 같은 이동/벽 충돌 함수를 실행.
2. 서버 확정 자기 상태 수신.
3. 확정된 입력 이전 history 제거.
4. 남은 적용 가능한 입력만 같은 fixed step으로 재계산.
5. corrected simulation state는 즉시 반영하되 작은 화면 offset만 짧게 완화.

- 자기 predicted simulation state와 렌더 offset을 분리. 이미 스무딩한 좌표를 다음 물리 입력으로 넣지 않는다.
- 세션/life/warp/teleport를 넘어서 history를 replay하지 않는다.
- 입력0·외력0·실제 접촉0에서 불확실한 상대 예측이 자신을 밀어내지 않도록 v32.1 원칙 유지.
- 실제 몸 충돌·끌어오기·넉백·벽 해결·자기장과 무관한 임의 idle 좌표 고정은 금지.
- 처음에는 상대 충돌을 보수적으로 예측한다. 다른 학생 전체를 로컬 권위로 재시뮬레이션하지 않는다.
- ACTION 재전송·자기 예측 replay에서 피해·탄 생성·효과음이 중복되면 실패.
- 모든 입력 정렬 방식은 latency/jitter fixture로 검증하고 network-policy.md에 구체적인 tick mapping을 기록한다.

### 9.4 끊긴 입력

입력 갱신이 250ms 이상 없는 경우를 초기 neutral timeout으로 시험한다. 실제 연결 상태와 client heartbeat 주기를 맞춰 검증 후 설정을 확정한다.

- 이동/held attack는 중립화.
- 새 스킬을 계속 재실행하지 않음.
- 실제 진행 중 DOT·넉백·자기장 피해는 계속 적용.
- 연결이 끊겼다고 무적·회복·부활하지 않는다.
- 재연결 후 옛 1초치 입력을 고속 재생하지 않는다.

---

## 10. 상대·투사체의 표시 시간과 Game Feel

### 10.1 시계

서버 monotonic clock·room simTick·client performance clock을 구분한다. app ping/pong으로 offset 추정·불확실성을 측정하고 부드럽게 갱신한다. 네트워크 RTT/2를 실제 편도 지연으로 확정하지 않는다.

- render time은 세션 정상 중 역행하지 않는다.
- 새 match/life/명시적 resync 때만 timeline reset.
- 기존 Firebase `presentationLead`, ring offset과 새 offset을 중복 합산하지 않는다.
- ring/capture/control expiration 모두 같은 권위 tick 의미를 사용한다.

### 10.2 상대 표시

- self는 즉시 예측, 상대는 `estimatedServerNow - presentationDelay`의 짧은 과거 타임라인을 재생.
- 20Hz 환경에서 50/75/100ms 등 후보를 같은 수신 trace로 비교하고 필요한 최소값을 선택. 이것은 **총 remote presentation delay**이며 기존 22~45ms 숫자를 기계적으로 이식하지 않는다.
- interpolation에 필요한 양쪽 샘플을 확보하는 비율, 급회전 오차, hold·snap 비율을 함께 측정.
- 1초 패킷 공백을 1초 buffer로 숨기지 않는다. 제한된 외삽→감속→hold는 필요하며 degraded 상태를 명확히 한다.
- 위치 보정은 ordinary motion/벽/강제이동/life 전환을 분리.
- server tick보다 늦게 보는 remote 시각을 이용해 local damage 판정을 하지 않는다.
- 이 작업에서 과거 판정을 재작성하는 lag compensation은 도입하지 않는다. 향후 별도 설계 대상으로 남긴다.

### 10.3 투사체 생성과 인계

- projectile ID는 최소 match/life/cast/action/ordinal과 연결되는 고유 ID.
- spawn에는 authoritative tick, origin, direction, speed, collision radius, type, range/lifetime, 필요한 path parameters.
- own preview와 authority shot은 actionId+ordinal로 인계한다. 가까운 위치만 보고 임의 탄을 매칭하지 않는다.
- 직선탄은 알려진 운동을 매 렌더 프레임 연속 계산.
- 유도·왕복·반사·포획탄은 실제 궤적 샘플/turn marker와 상태 갱신을 사용. 화면만 보기 좋게 임의 homing을 계산하지 않는다.
- client가 명중했다고 추정해 피해 확정하거나 적을 스턴시키지 않는다.
- shotEnd에는 원인, endpoint, serverTick, projectileId를 포함한다. wall/hit/range/return/death 등 구분.

**이벤트 표시 시점:** 지연된 remote 타임라인에서 아직 비행 중이어야 하는 탄을 네트워크 도착 즉시 앞쪽에서 없애지 않는다. terminal을 사건의 표시 시각과 연결하되, 늦게 도착했으면 확정 endpoint에서 즉시 정리한다. 죽은 탄을 다시 resurrect하거나 종료 위치 너머로 계속 표시하지 않는다.

자기 사망·스턴 등 실제 입력 허용 여부는 서버 확정을 즉시 따른다. 이펙트를 보여주려고 사망 판정/부활 퀴즈를 늦추지 않는다.

### 10.4 보이지 않았던 공격

- 한 snapshot 사이에 생성·명중·종료된 짧은 탄도 relevant lifecycle로 전달한다.
- 지나간 경로 흔적은 실제 path만 사용하고 현재 살아 있는 탄인 것처럼 표시하지 않는다.
- AOI 밖에서 들어오는 고속탄은 bounded lookahead로 포함한다. 보이지 않는 소유자의 위험탄까지 함께 숨기지 않는다.
- 실제 damage receipt의 contact/attacker/skill 정보를 우선하고 시각적으로 가까운 공격자를 추측하지 않는다.
- native/RW 두 경로를 같은 수준으로 시험한다.

### 10.5 그래픽·오디오

기존 품질·레벨 글자·이펙트·BGM 보존. 성능 비교 시 같은 quality·DPR·viewport를 사용한다. 렉 감소를 위해 핵심 공격 경계나 탄을 LOD로 삭제하지 않는다.

캐시·pool은 유지하고 physics event와 client decoration을 분리한다. client가 카메라·오디오 처리하느라 서버의 전투 결과를 변경하지 못한다.

---

## 11. AOI·은폐·스냅샷 비용

- 초기 학생 viewport 계산과 padding은 기존 기준을 유지한 뒤 실제 고속탄 누락을 검증한다.
- 맵·벽·연막 geometry는 static revision으로 1회 전송/갱신. 매 50ms 전체 재직렬화 금지.
- 자기 상태와 임박 위험 공격은 우선, 먼 장식은 낮은 우선. 모든 critical entity는 예산 제한으로 자르지 않는다.
- AOI에서 나감(`leaveScope`)과 실제 파괴(`destroy`)를 구분. 재진입 시 최신 full state로 복귀.
- 은폐 해제·다시 은폐 시 캐릭터뿐 아니라 level/name/glow/target marker도 함께 처리.
- 포탑·펫·12발 돌·다중 부메랑에 대해 entity별 ID/수명 보존.
- 교사 전체맵은 10~20Hz 후보를 비교하되 처음에는 학생과 같은20Hz를 시험할 수 있다. 서버 원본60Hz를 받은 척하지 않는다.
- 서버 전체 상태와 수신자별 필터링을 가능한 범위에서 재사용. 학생마다 physics를 다시 계산하지 않는다.
- 다른 방의 데이터, 숨은 플레이어 좌표, 비공개 quiz answer가 들어가지 않도록 payload 시험.

---

## 12. Backpressure·지연·연결 복구

### 12.1 송신 대기열

기본 WebSocket은 모든 전투 상태를 자동으로 최적화해 주지 않는다. application queue와 socket buffer를 구분한다.

- 수신자별 아직 send하지 않은 최신 snapshot 1개.
- 중요 사건/명령 결과는 별도 bounded queue와 cursor.
- `bufferedAmount` 및 대기 시간 관측. 한 명의 느린 학생은 그 연결에만 영향.
- 초기 warning 64KiB, hard 256KiB, 지속1초 같은 값으로 시험하되 payload 분포·학교 RTT에 맞게 조정하고 기록. 이 숫자를 무검증 고정 정답으로 쓰지 않는다.
- backpressure 중 오래된 unsent snapshot은 최신으로 교체. critical state는 current full state로 복구할 수 있게 설계.
- 이미 `send()`로 소켓에 들어간 프레임은 application이 선별 삭제할 수 없음을 전제로 한다.
- 응답이 느리다고 같은 메시지를 무한 재송신하거나 소켓을 여러 개 열지 않는다.
- 장기 과부하 연결은 상태 안내 후 재연결/재동기화로 정리. room 전체를 멈추지 않는다.
- `ws` send callback은 학생 수신 ACK가 아니다. 다음 snapshot을 callback/application ACK에 일대일로 묶지 않는다.
- `perMessageDeflate:false`로 시작. 압축은 별도 CPU/메모리/대역폭 시험이 통과할 때만 변경.

### 12.2 연결과 재접속

- ping/pong으로 half-open 감지. browser app ping/pong과 protocol ping의 목적을 구분.
- retry는 exponential backoff+jitter, 상한·최대 자동시간 제한. 26명이 동시에 탭 복귀해도 재접속 폭주 방지.
- 연결이 복구되면 RESUME token, match/life/connectionEpoch, 마지막 승인 cursor를 검증.
- 짧은 끊김 중 서버는 현재 게임을 계속 진행한다. HP·위치·선택권·KDA는 서버의 현재 상태로 복원.
- 같은 생명은 성장 유지, 죽었으면 퀴즈/관전으로, 새 match면 새 로비로 보낸다. 접속하자마자 옛 HP0 화면에 갇히지 않게 한다.
- resume token은 player identity를 증명한다. room number/name만 같다고 기존 학생을 탈취할 수 없어야 한다.
- 새 연결 승인 시 이전 socket은 superseded 처리. 이전 연결의 늦은 입력/ACK 무시.
- 학생 identity 보존 유예의 초기값은 60초 이상으로 설정 가능하게 하고, 진행 중 match 기록은 결과까지 유지한다. 점령전 점수 자격은 원본의 접속조건을 보존.
- 교사 탭 비활성/닫힘은 전투 pause 조건이 아니다. 교사는 resume로 운영권 복원. 연결 단절시 안내, 신규 admin 명령 차단.
- 모든 사람이 나간 방은 TTL 뒤 정리. 타이머·socket refs·entity·이벤트·퀴즈 bank 정리.

### 12.3 서버 프로세스 종료/장애

첫 버전에서 프로세스 crash를 넘어 모든 전투를 자동 복구한다고 주장하지 않는다. 해당 방이 사라졌으면 명확히 ‘경기 연결 종료/새 방 필요’를 표시하고 무한 reconnect를 멈춘다. 재시작 후 옛 토큰으로 새 방을 오염시키지 않는다.

운영 배포는 아래 drain 정책으로 정상 진행 중 경기를 보호한다. crash-resume 전체 checkpoint 복제는 별도 후속 작업이다.

---

## 13. 최소 보안·개인정보

- 운영 WSS/HTTPS 필수. localhost 개발만 WS 허용.
- 명시 Origin allowlist. GitHub Pages origin은 `https://yeomt.github.io`이며 repo path를 origin에 넣지 않는다. 개발 origin은 dev에서만.
- Origin만으로 인증했다고 보지 않는다. non-browser client도 가능하므로 host/student token 검증이 필요.
- 교사 방 생성은 server-side secret 또는 기존 검증 가능한 로그인으로 보호한다. 배포 env에서만 보관. 공개 JS/VITE 변수에 관리자 암호를 넣지 않는다.
- 교사 최초 인증 후 짧은 관리 세션과 방별 운영권 발급. 일반 학생은 QR/방번호+닉네임으로 참가하되 server-issued resume capability를 받는다.
- 토큰·비밀번호를 query string/QR/분석 로그에 넣지 않는다. HTTPS bootstrap 또는 TLS 수립 후 첫 auth message 사용, auth timeout.
- request당 max payload, 입력 command 수, action rate, room create/join rate, upload 크기·문항 수 상한.
- 학생26명이 하나의 학교 공인 IP를 쓸 수 있음을 고려해 IP rate limit을 과도하게 낮추지 않는다. 세션/연결 단위 검증을 병행.
- 위치·피해·속도·정답 수·level을 학생이 임의 설정하는 메시지 거부.
- 닉네임/문제 텍스트 XSS 방어. 실명/명단/답안은 최소 보관, 운영진단에는 익명 ID.
- `.env*`, SSH 개인키, service account, session secret, token은 GitHub/PR/아티팩트에서 제외. `.env.example`만 placeholder로 제공.
- Caddy 외 내부 node port는 공인 전체에 노출하지 않는 운영 구성을 제시.
- `/healthz`, 제한된 `/version` 외 자세한 방 목록·진단·drain endpoint는 인증/내부접근.
- supply-chain: lockfile, actions 고정 버전/가능하면 SHA pin, 실행 파일 다운로드 checksum 검증. 테스트 때문에 보안 검사를 비활성화하지 않는다.

---

## 14. 진단 보고서 — 단순 ping과 게임 반응을 분리

기존 `?netdebug=1` 링크를 유지한다. 다음 보고서를 한국어 UI에서 복사할 수 있게 한다.

### 서버 보고서

- build/content/protocol, mode, 인원·활성 방 수·실행시간·재접속 수.
- tick step CPU 평균/P95/P99, event-loop delay, catch-up 부채, overload/pause.
- snapshot 준비 CPU, 생성·enqueue·send gap, snapshot/event bytes, buffer high-watermark.
- 접속별 current outstanding bytes·unsent snapshot replace·resync·close 사유.
- input receive→apply, request validation/reject·중복처리, 중요한 사건 ledger.
- RSS/heap 추이, 최종 활성 timer/entity/room count.

### 학생 보고서

- 실제 renderer frame avg/P95/P99, viewport/DPR/quality, background 별도.
- transport app RTT, input send→server apply→received ACK, action→confirmed effect를 별도 표기.
- accepted serverTick delta와 actual arrival gap을 따로 표기. 수용/폐기/중복 packet 수.
- clock offset 추정·오차 범위, 실제 표시 타임라인 지연, source sample age.
- 일반 이동/강제 이동/사망·관전별 prediction/interpolation/hold 비율.
- 원래 정지한 상대와 ‘움직여야 하는데 hold’한 상황을 분리.
- 자기 correction을 이동/무입력·무외력/벽·접촉/impulse/warp별로 구분.
- native/RW 각각 spawn first draw, handoff success/reject, terminal, unmatched hit.
- match/life가 검증된 사망 원인; unknown은 숨기지 않는다.

제약:
- frame별 콘솔 출력·원격 DB 진단 쓰기 없음. bounded histograms/recent-window ring만.
- event ID·이름·방번호·token은 공개 보고서에서 제거/익명화.
- FIRST DRAW→HIT를 통신지연으로 표시하지 않는다.
- 평균 frameRate만으로 GPU/실기기 최적화를 완료했다고 주장하지 않는다.

---

## 15. 성능 검증 시나리오와 목표

### 15.1 동일 조건 비교

- 기존 v32.1과 신규 client는 같은 viewport, graphics preset, DPR, seed, content, 입력 시나리오를 사용.
- 원본 Firebase를 운영 DB에 무단 접속해 시험하지 않는다. 원본 fixture/stub replay는 명확히 구분.
- 새 서버 load test는 **실제 TCP/WebSocket 연결**을 사용한다. 함수에 직접 JSON을 넣는 시험으로 대체하지 않는다.
- 서버30 socket 통과와 브라우저30대 실기기 렌더 통과는 서로 다른 것.
- headless/SwiftShader 저FPS 자료를 실제 모바일 성능으로 일반화하지 않는다.

### 15.2 필수 조건

A. 2브라우저+실제 WS end-to-end: 로비·퀴즈·draft·전투·시상·재경기.
B. 20/26/30학생+교사1: 각10분, 분산/밀집·native/RW·많은 합법5선택 빌드.
C. idle0입력, 직선·급회전·지그재그·벽·몸 접촉·돌진·납치·스턴.
D. RTT40/100/250ms, 지터0/20/60ms 후보, 300/500/1500ms stall, 30초 background, socket 연결 단절/복귀.
E. 1명 slow receiver가 buffer를 채우는 경우와 동시 재접속26명.
F. 동일방 재경기5회·동시방2개 격리·장시간30분 메모리/참조 점검.
G. 300/360초 점령전, 2/3/4팀, A/C→B→FEVER→종료, 일반/팀 자기장 최종.

네트워크 지연 주입은 application message delay와 운영체제 네트워크 shaping을 구분한다. WS 위에서 메시지를 무작위 누락시킨 것을 TCP 실제 packet loss 시험이라고 부르지 않는다. 프록시/shaping 도구가 없으면 명시하고 가능한 지연·끊김 시험은 수행한다.

### 15.3 초기 성능 기준 — 보장이 아니라 합격 목표

| 항목 | 목표와 판정 범위 |
|---|---|
| 서버60Hz step CPU | 30명 정상 교전 P95 8ms 이하, P99 16.7ms 이내를 우선 목표. 측정 HW 명시 |
| snapshot20Hz 준비 | P95 5ms 이내 우선 목표. step과 같은 tick에 겹친 전체 시간도 별도로 검사 |
| generated snapshot gap | 정상 부하 P95 ≤75ms, P99 ≤100ms 목표 |
| controlled arrival gap | RTT40ms/지터10ms의 실제 WS 시험에서 P95 ≤100ms 목표 |
| 입력→로컬 표시 | 60FPS 기기에서 다음1~2 렌더 프레임 목표. 서버 ACK 기다리지 않음 |
| 무입력·무외력 위치 | 안정화 후 반복 왕복 흔들림 없음, 진단 idle 변위 ≤1 CSS px 목표 |
| 정상 직선 표시 | 서버 tick마다 불필요한 감속·재가속 없음. truth trajectory와 오차 비교 |
| client frame | 같은 실제 기기/그래픽으로 v32.1보다 악화하지 않고 P95 +2ms 이내 목표 |
| 느린 학생 격리 | 나머지 정상 학생의 송신 gap·FPS에 유의한 악화 없음 |
| 메모리 | 재경기 반복 시 retained room/entity/listener가 누적하지 않음 |

P95 하나만 통과해 최악1초 정체를 숨기지 않는다. max·초과비율·tail event와 원인을 같이 보고한다. 실제 서울 서버/학교 Wi-Fi/26대 기기 시험이 없으면 NETWORK_LAB_PASS와 CLASSROOM_UNVERIFIED를 구분한다.

운영 서버 용량이 정해지지 않았으면 ‘$5/$7 서버로30명 보장’이라고 쓰지 않는다. 메모리 제한1GiB 시험은 참고이며 vCPU credit·네트워크·실기기 검증을 대체하지 않는다.

---

## 16. GitHub commit·push·PR 작업 규칙

### 16.1 기존 remote 사용

- 목적 저장소는 `YEOMT/DSbettleroyale`다. 철자 `DSbattleroyal`과 repository `DSbettleroyale`를 혼동하지 않는다.
- 이미 local clone이 있으면 그것을 사용. remote URL·dirty 상태·현재 branch를 확인한다.
- 다른 게임의 remote나 임의 새 repository로 push하지 않는다.
- latest main을 확인하고 명시 작업 브랜치 생성. baseline이 달라졌으면 docs에 기록.
- 사용자 미커밋 파일에 reset --hard, clean -fd, stash 자동삭제를 하지 않는다.

### 16.2 자동 반영

구현·검증 단위로 commit을 만들고 승인된 repository의 작업 브랜치에 push한다. 이어서 GitHub CLI 또는 사용 가능한 GitHub 기능으로 PR을 생성한다.

PR 내용:
- 실제 기준 commit/build/hash.
- 단계별 변경 및 authority 이전 여부.
- 보존 manifest/77종/3모드/6레벨 결과.
- 실제 수행 명령, PASS/FAIL/BLOCKED, 성능 조건.
- legacy 복구와 production enable 절차.
- 공개 서버 배포 여부, 필요한 남은 설정.

PR 검증이 통과하지 않았거나 기능 미완성이면 draft로 유지. ‘몇 개 테스트 생략’ 상태로 ready를 표시하지 않는다. main은 사용자 merge 승인 전에는 변경하지 않는다.

### 16.3 권한이 없을 때

push/PR은 허용된 인증·네트워크 범위에서 실제 시도한다. 막히면 코드를 유실시키지 않고 local commits, `git bundle` 또는 `git format-patch`, 작업 파일과 명확한 상태를 남긴다.

- `BLOCKED_GIT_PUSH`: remote push 실패.
- `BLOCKED_PR`: push는 성공했지만 PR 생성권한/도구 부족.
- `BLOCKED_PRODUCTION_CONFIG`: 서버/도메인/secrets 미제공.

필수 자격증명이 없다고 로컬 엔진·WS·테스트 구현까지 중단하지 않는다. 실제로 없는 commit URL·PR URL·배포 URL을 만들어 보고하지 않는다.

---

## 17. CI와 배포 — 소스 업로드와 서비스 전환 분리

### 17.1 `ci.yml`

PR / 개발 branch push에서:
1. 지원 Node 고정 + `npm ci`.
2. type/lint, baseline parity, unit, protocol, 실제 WS integration.
3. build client/server, Playwright 최소 E2E.
4. 작은26명 load smoke와 resource leak 검사.
5. test report와 dist를 workflow artifact로 저장.

긴30분/모든망 프로필 시험은 수동 또는 release gate job으로 분리하되 실제 run 상태를 표시한다. PR용 test는 운영 secrets·실제 학생 DB에 접근하지 않는다. `pull_request_target`로 미신뢰 PR 코드를 비밀키와 함께 실행하지 않는다.

### 17.2 로컬 사용 명령

깨끗한 checkout에서 다음 의미의 root commands를 구현·문서화한다.

```bash
npm ci
npm run dev                 # local WS server + client 함께 실행
npm run build
npm run test:unit
npm run test:parity
npm run test:integration
npm run test:e2e
npm run test:load -- --players=26 --seconds=600
npm run verify              # 필수 빠른 검사 묶음
npm run start:server        # 빌드된 서버, dev runner 아님
```

명령을 README에 쓰기만 하지 말고 실제 script와 종료코드를 구현한다. 필요한 first-time Playwright browser install을 별도로 명시. Windows 사용자는 Node+npm만으로 개발 가능하고 Docker는 운영/선택 로컬 검증에 사용한다.

localhost 주소는 로컬이라고 표시한다. 휴대폰 LAN 테스트는 별도 명시 LAN 모드+허용 origin으로 켜고 public 배포와 혼동하지 않는다.

### 17.3 Docker/Caddy

- 멀티스테이지 server Docker build, non-root, runtime deps만 포함.
- 내부 server port, healthcheck, persistent volume, restart policy, 회전 로그, resource limits 예제.
- Caddy에서 HTTPS/WSS 종료. 인증서 저장 volume 유지.
- `/ws` upgrade 지원, 건강상태와 client API route 구분.
- WSS 호스트 값은 placeholder/env. 실제 DNS·TLS가 확인되지 않은 주소를 완성 URL로 제시하지 않는다.
- Caddy config reload만으로 진행 중 WS가 절대 보존된다고 가정하지 않는다. stream close 동작을 검증하고 운영 중 무분별한 reload를 피한다.

### 17.4 최초 운영 전환

현재 저장소가 root index.html 직접 Pages 게시일 수 있다. Vite 소스를 올리는 것만으로 운영 사이트가 작동하지 않으므로 전환 절차를 명시한다.

- 초기 작업 브랜치에서만 개발하고 기존 main/Pages는 보존.
- **최초 PR에서는 root `index.html`을 그대로 둔다.** 기존 Pages가 branch/root 게시인 상태에서 root를 삭제하면 새 workflow가 비활성화되어 있어도 기존 게시가 깨질 수 있다. 실제 Pages source를 Actions로 전환하고 dist 게시가 검증된 다음 별도 커밋에서 root의 옛 HTML을 제거한다. 원본 보관본만 남기고 신규 런타임은 모듈형 dist를 사용한다.
- `PRODUCTION_WS_ENABLED=false` 기본. 설정 미완료 시 release workflow가 기존 운영 사이트를 덮어쓰지 않는다. 빌드 artifact는 만든다.
- 운영 전환은 새 서버의 HTTPS/WSS·버전·로컬/실기기 검증 및 사용자 승인 뒤 enable.
- Pages의 publishing source를 GitHub Actions로 설정해야 하는 경우 실제 권한·설정 여부를 검사. 바꿀 수 없으면 사용자에게 딱 필요한 UI 설정을 명시.
- 기본 Vite Pages base: `/DSbettleroyale/`. 대소문자·하위 assets 경로·QR query를 실제 검사.
- 인증 없는 health와 version 조회가 성공해도 전투 운영검증이 끝났다고 보지 않는다.

### 17.5 이후 자동 배포

사용자가 PR을 merge하면 **CI 통과 후** 기존 설정된 release workflow가 다음을 수행한다.

1. 한 commit/content/protocol 조합의 client artifact와 server image 생성.
2. 서버 새 이미지 준비·기본 smoke 검사.
3. authenticated drain으로 새 방 생성·새 라운드의 LOBBY→QUIZ만 제한한다. 이미 시작한 QUIZ/DRAFT는 BATTLE까지 정상 진행시킨다.
4. QUIZ/DRAFT/BATTLE의 보호 대상 방이 모두 RESULTS까지 끝나기를 기다린다. 기본 최대10분, 초과시 배포를 취소/대기하고 drain을 안전 해제한다. 강제종료하지 않는다.
5. 보호 대상 방0과 진행 중 승인명령 정리를 원자적으로 확인 후 server 교체, health/version/실제 WSS handshake 검사.
6. 해당 server와 호환되는 client artifact를 Pages 배포.
7. 실제 page/asset build ID, WS handshake, 공개 URL 확인.

교사의 방 설정을 조용히 삭제하지 않는다. 살아 있는 lobby/session을 옮길 준비가 안 되었으면 일시적 재접속/새 방 필요를 명확히 알린다. 무중단 live battle migration을 구현하지 않았으면 무중단이라고 쓰지 않는다.

### 17.6 호환성과 복구

- 같은 release의 content/protocol fingerprint 사용.
- 오래 열린 client는 현재 경기 도중 강제 새로고침하지 않는다. incompatible 새 서버 접속 시 명확한 버전 갱신 안내.
- immutable assets와 이전 release 복구를 관리. 새로고침 전 옛 lazy chunk가 사라져 에러가 나지 않게 보존 정책 검사.
- 서버 health 실패 시 새 client를 배포하지 않는다. 먼저 검증된 이전 image로 복구.
- Pages 배포 실패/버전 불일치일 때도 이전 server/client 짝으로 복구 가능한 `rollback.yml`과 runbook 제공.
- rollback 중 active match를 강제종료하지 않는 같은 drain 규칙 적용. crash 긴급복구는 장애로 명시.
- `.github` production environment 승인/보호 기능과 최소 권한 secrets 사용.
- 미설정 secrets/host는 ‘성공 스킵’으로 배포완료 처리하지 말고 이유를 명확히 남긴다.

필수 운영 설정 목록의 예:
`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `KNOWN_HOSTS`, `PUBLIC_WSS_URL`, `PUBLIC_HTTP_API_URL`, `ALLOWED_ORIGINS`, server-side host auth secret, optional storage credentials.

배포키는 제한 권한으로 관리하고 known_hosts 검증을 끄지 않는다. 보안상 또는 네트워크상 SSH 자동배포가 불가능하면 image artifact와 수동 1회 설치 명령을 제공하되 실제 자동배포 여부는 구분한다.

---

## 18. 필수 인수 시험 70개

모든 항목에 실제 결과·시험 명령/파일·조건·미검증을 기록한다. 코드에 함수가 있다는 이유만으로 PASS로 표시하지 않는다.

### A. 기준·구조

A01. 기준 원본/원격 commit·blob·SHA-256·build 기록.
A02. active77종/영구ID/retiredID와 실제 최종 profile 추출.
A03. Node에서 DOM/Pixi/Firebase 없이 engine create/step 가능.
A04. 같은 seed·시간·입력에 원본/추출 engine의 규칙·피해 결과 비교.
A05. 전투 RNG와 장식 RNG·방별 RNG 격리.
A06. client/server/content/protocol 간 import 경계 검사.
A07. 깨끗한 clone에서 npm ci/build/dev/verify 성공.
A08. monolithic eval/iframe/headless production engine 없이 실제 책임 분리.

### B. 입장·학습·세션

B01. 교사 생성·QR·6자리 입장·닉네임·학생목록.
B02. 퀴즈TXT·내장문제·정오답/잠금/점수/리롤 규칙 유지.
B03. 점수0·탭복귀·통신재연결에도 유효 기본 캐릭터 배정.
B04. 중복/늦은 quiz answer로 점수 중복 증가 없음.
B05. reroll double tap/응답유실/중복요청의 차감·배정 일관성.
B06. 로비/퀴즈/draft의 교사 kick, 학생 운영명령 위조 차단.
B07. 동일 이름·다른 세션·다중 탭 접속 경계.
B08. 같은방 재경기5회, 과거 input/death/offer가 새 경기로 유입되지 않음.

### C. 게임 내용

C01. 77종 무증강 평타·스킬 실제 생성/사용/종료 parity.
C02. HP·이속·스킬 지정값·모드배율·평타 보존.
C03. Lv1→Lv6 누적XP20, 다섯선택·III상한·MAX pending.
C04. 왕귀S금지·배타·배율1회·상한·재계산 HP 비율.
C05. 킹모아이·농구왕 환급·좀비 회복·거인12발의 특수검사.
C06. 포탑3개·벽·유도·반사·왕복·장판·채널링 실제 처리.
C07. solo/team-elim 자기장 일반/압축/300ms유예/표시 일치.
C08. capture 2/3/4팀·A/C선활성·B1.5·FEVER2·100%/종료시간.
C09. 부활퀴즈3문제·리롤/keep·life초기화·스폰보호.
C10. 경기전체KDA/점령기여/사용이모지/시상·동점처리.
C11. 엄폐 통로·연막 공격/피격 노출·지원/은신 구분.
C12. 상자파괴/픽업/XP보충/사망드롭상한6·일반모드 팀스폰.

### D. 통신·표시

D01. 실WebSocket으로2브라우저 전체경기 완주.
D02. 서버만 physics 실행, 교사 탭닫힘/숨김이 전투를 정지시키지 않음.
D03. move/aim/button 입력 반응·멀티터치 증강 선택.
D04. lastApplied input seq/tick과 client replay의 실제 일치.
D05. 무입력·무외력 10초 정지와 불확실 상대접촉 흔들림 검사.
D06. 급회전·정지·벽·다중 접촉의 보정 오차 비교.
D07. own shot preview→authority handoff, 멀티발ordinal 고유.
D08. 한snapshot안에 끝난 탄의 spawn/hit/end·즉시사망 원인.
D09. native/RW 유도·왕복·반사·직선탄의 연속성·끝점·중복0.
D10. hidden actor의 level/name/glow가 남지 않고 위험탄은 필요한 경우 보임.
D11. AOI leave와 실제destroy를 구분하고 빠른 재진입 복구.
D12. clock offset 점프·duplicate/oldframe·pause/resume에서 시간역행/중복피해 없음.

### E. 혼잡·복구

E01.20/26/30학생+teacher 실제WS10분.
E02.26명 RTT40/100/250ms·지터0/20/60ms.
E03.300/500/1500ms stall 및 연속 회복.
E04.1명 느린수신·buffer포화가 타학생의 전투를 막지 않음.
E05.26명 동시reconnect, backoff·token·session 검증.
E06.30초 background 후 현재alive/dead/quiz/match 상태 정확 복원.
E07.명령 결과 응답유실 재전송 시 스킬·reroll·증강 중복 적용0.
E08.이벤트로그 만료 후 FULL_STATE 복구, 옛공격 재생0.
E09.동시방2개 RNG·프레임·학생·메모리 격리.
E10.재경기/방닫기 반복30분에서 메모리·timer·refs 누적 없음.

### F. UI·성능·보안

F01.Pixi/Canvas fallback과low/balanced/high 화면·핵심공격정보 유지.
F02.모바일세로/가로·PC·resize·reducedMotion·6레벨글자.
F03.BGM전환/반복·음소거·hit/hurt음 중복 없음.
F04.교사전체맵·방번호·점령화살표·랭킹·종료조작.
F05.서버tick/build/eventloop/RSS·clientFPS 진단 실제 수집.
F06.PING RTT·입력ACK·sourceage·positionalerror를 혼동하지 않는 보고서.
F07.권한위조/room탈취/토큰재사용/이전connection 입력 차단.
F08.oversize/NaN/Infinity/초과명령/잘못된ID/malformedJSON 처리.
F09.학교공유IP26명 정상사용은 허용하고 실제flood는 제한.
F10.Origin/CORS/TLS·secret/PII/log 노출 검사.

### G. Git·배포

G01.단계별commit·remote branch 실제push·PR URL 검증.
G02.PR CI가 실제tests/build 실행, 미실행PASS 없음.
G03.Pages repo base와assets/QR쿼리·netdebug 링크 검증.
G04.production 설정없을 때 기존main/Pages 보존.
G05.Docker nonroot·Caddy WSS 실제 로컬TLS 또는 지정스테이징 검증.
G06.drain 중 신규라운드차단·기존퀴즈/draft/경기완주·timeout강제종료 없음.
G07.server/client/content protocol일치와구버전안내.
G08.건강검사실패 시release중단·이전image/client짝rollback.
G09.서버재시작장애의명확한방만료·무한reconnect 없음.
G10.실제GitHub반영/공개배포/학교실기기검증 상태를 각각 구분해 최종보고.

---

## 19. 최종 제출과 상태 표기

### 반드시 제출

1. 실제 repository의 client/server/shared/content/protocol/infra/test 코드.
2. 로컬 실행 명령과 학생/교사 테스트 절차.
3. 기준 비교·규칙보존·70개 인수 결과와 실제 raw metrics 위치.
4. 수정 파일·모듈 대응표, 알려진 한계·실기기 미검증.
5. commit SHA, pushed branch, PR URL, Actions run URL/상태.
6. 운영 준비에 남은 설정을 ‘필수값/입력장소/검증명령’으로 정리.
7. 실제 배포했다면 HTTP/WSS/version의 확인된 주소와 build, 배포하지 않았으면 명확히 미배포.

### 상태는 분리

- `IMPLEMENTATION_COMPLETE`: 요구 전체 구현 및 로컬 실행 완료.
- `LOCAL_TESTS_PASS`: 기재한 실제 로컬시험만 통과.
- `REMOTE_PUSHED` / `PR_CREATED`: 실제 GitHub 확인.
- `PRODUCTION_READY_NOT_DEPLOYED`: 코드·인프라 준비, 서버 설정/승인 대기.
- `DEPLOYED_VERIFIED`: 실제 지정 서버와 Pages 배포 확인.
- `CLASSROOM_UNVERIFIED`: 20~30대 실제 수업시험 미실시.

예: 로컬30개socket 시험이 통과했어도 `CLASSROOM_UNVERIFIED`를 지우지 않는다. 서버가 아직 없다면 그 사실을 이유로 local/game 구현을 생략하지 않고, public deploy만 보류한다.

---

## 20. AGENTS.md에 남길 핵심 규칙

다음 내용을 저장소 실제 명령에 맞게 편집해 커밋한다.

```text
- Source of truth: docs/baseline.md와 현재 manifest. 과거 설명만으로 밸런스를 바꾸지 않는다.
- 서버만 게임 판정 권한. client는 입력·예측·표시를 담당한다.
- engine/content/protocol은 DOM/Pixi/Firebase/WS에 의존하지 않는다.
- 60Hz physics와 snapshot 주기를 혼동하지 않는다.
- 수정 전 해당 기능 parity test를 확인하고, regression fixture를 함께 작성한다.
- 인게임 숫자·모드·캐릭터·퀴즈 규칙은 명시 요청이 있을 때만 변경한다.
- 같은input 재전송·life/epoch·rematch·resume·latepacket을 기본 테스트한다.
- render/FX 변경으로 gameplay RNG/geometry/damage가 달라져서는 안 된다.
- 방별상태·socket큐·event ledger는 bounded하고 cleanup되어야 한다.
- npm run verify/build와 관련 테스트를 실행하고 실행한 것만 보고한다.
- 학생명/비밀번호/토큰/키/실제 수업로그는 저장소와PR에 올리지 않는다.
- branch commit/push/PR까지 수행하되 main force push·무승인merge는 하지 않는다.
- live battle을 임의로 종료하는 배포는 하지 않는다.
- 서버미설정은 배포만 BLOCKED. 가능한로컬구현과시험은 계속한다.
- docs/progress.md에 현재단계·통과명령·남은문제를 갱신한다.
```

---

## 21. 구현 시 참고할 공식 문서

아래 문서는 아키텍처 선택의 참고다. 기존 게임 동작을 교체하는 근거로 사용하지 않는다. 패키지/도구 버전은 구현 시 실제 설치 가능한 지원 버전으로 고정한다.

- OpenAI Codex / AGENTS.md: `https://developers.openai.com/codex/guides/agents-md`
- OpenAI Codex workflow: `https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex`
- ws 공식 구현·압축/heartbeat: `https://github.com/websockets/ws`
- WebSocket/역압: `https://developer.mozilla.org/en-US/docs/Web/API/WebSocket`
- bufferedAmount: `https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/bufferedAmount`
- GitHub Pages Actions: `https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages`
- GitHub 배포환경보호: `https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments`
- Vite Pages base: `https://vite.dev/guide/static-deploy.html`
- Caddy reverse_proxy/WebSocket: `https://caddyserver.com/docs/caddyfile/directives/reverse_proxy`
- Node performance diagnostics: `https://nodejs.org/api/perf_hooks.html`
- OWASP WebSocket 보안: `https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html`

---

## 최종 지시

게임을 그대로 보존한다. 단일 HTML을 책임별 실제 모듈로 바꾸고, 모든 실시간 경기 상태를 서버가 소유하도록 이전한다. 학생에게 빠르고 일정하게 정보를 전달하며 그 사이를 정확한 로컬 계산과 표시로 연결한다.

**설계 제안·통신 데모·일부 모드만으로 종료하지 않는다. 실제 코드·테스트·GitHub 작업 브랜치·PR까지 만든다. 운영 서버가 미개설이라면 로컬 완성/원격 반영과 공개 배포 미완료를 분리해 보고한다.**
