# v35.5 — Overdrive & Combat Identity

상태: **구현 반영 / 인수 PARTIAL / Draft 검토 / NOT_DEPLOYED**. 30인 Pixi 고화질 시험은 기준·수정본 모두 과부하 보호로 실패했다. 전체 안정성·성능 동등 또는 전체 인수 성공을 선언하지 않는다.

## 기준과 보존

- 시작 때 PR25는 이미 MERGED(2026-11-17 10:20:59 UTC), main은 `a9167266146646f2717b055aceb7b3fad833ae99`였다. 사용자 조회 당시 dd331fd/OPEN과 달랐다. 제출 직전 원격 재조회도 a916726이다.
- 기존 cf93779 작업 트리가 깨끗함을 확인하고, 병합된 main에서 `codex/v35-5-overdrive-identity`를 만들었다. 기존 브랜치/작업을 초기화하지 않았다. 구현 최종 commit은 PR head로 확인한다.
- 406줄 상세 명세와 시작 지시문을 끝까지 읽었다. 명세 SHA256 `547787bd61da9bd79beff22b60bb7513aa92e35ff9639e13939f0f636bf68da1`.
-86 ID/등급/추첨, v35.4 결과·탈락자 스트림 중단·F/S 특별전·승자3.5초·장판1.10배, 모드/입력/복구/재경기,60Hz/20Hz 보존. root index.html, apps/server, ReleaseOps, AWS/Pages/Firebase/Secrets/서버 설정 변경 없음.
- Content hash `b9113f25bf2d75f91cbcf4762a760e8232a84cbcf5e4e011bf8a3492e5e8889c`; engine revision `v35.5-authority-1-overdrive`, package35.5.0. 최종 로컬 paired build `v33-d9598796bd77eff3`, sourceHash `d9598796bd77eff37a9c64b83a8aefb2b470c10672fd66a820b4c20869ac9d92`.

## 실제 변경

- `abilities/overdrive.js`가 기존 초기화/최종 오버라이드 뒤 승인11종만 확장한다. `combat/parry.js`는 기존 native/rework 반사 경로에서 원탄 소유권을 한 번 돌리고, 평타/실제 전방 물리/돌진 접촉은 한 번 즉시 반격한다. 기존 지연 반환과 중복되지 않는다.
- 사과는 첫 유효 종료에 시드8파편, 대상 생명별2회 예산. 크레파스는 네 색의 서버 피해/감속/기절/DOT와 공유 시전 상한. 도깨비는 기존3초 방어/가속 중 첫 유효 평타에만27f 기절. 청소·저격·폭발 수치는 [전후표](balance-before-after.md)에 기록했다.
- `growth.js`와 공통 basic/aim profile이 GIANT/RAPID/WIDE 수치·상한·각도를 함께 산출한다. 실제 입력의6틱 최소 간격을 가속 중에도 지킨다. III 확정 선택은 기존 FX로650ms 한 번만 보낸다.
- Canvas/Pixi 공통 도형으로 거대탄의 실제 반경 외곽, 네 색 형태, 접촉, 전기 섬광/부채꼴을 표시한다. 실제 SHOT/접촉에서만 짧은 발사·금속음을 요청한다. 기존 캐시/템플릿/타임라인을 재사용하며 새 텍스처·파티클 시스템은 없다.
- 원본86 projection 및 명시적 scalar allowlist, 새 실제 시전 goldens를 추가했다. 기존 goldens를 삭제하지 않았다. 신규 동작 때문에 달라지는 승인 leaf만 따로 고정하고, 나머지75종·비대상 증강을 그대로 비교한다.

## 실행 결과와 실제 시간

| 검사 | 상태 | 시간/범위 |
|---|---|---|
| Quick 공통 | PASS |251.064s, 당시381/381 +ReleaseOps7/boundary/content. 이후 마지막 좁은 변경은 아래 집중 검사/PR CI에서 확인 |
| 최종 v35.5 단위 | PASS |29/29,0.503s; 패링/8파편/색CC/도깨비/실제 증강/입력중복·6f/벽·상자·interest/폭발 |
| 실제86 parity 및 기존 반사 등 | PASS | 최종 runtime 묶음121 중120 PASS; 실패1은 아래 돌진 fixture였다. 그 항목 수정 뒤 최종 집중29 PASS |
| 생성물/경계/YAML | PASS | content86/hash 일치,141 모듈 경계 및 중복키 없는 workflow 파싱 |
| 최종 client/server build | PASS | Vite6.68s; 기존500kB chunk 경고 유지 |
|3화면 Canvas low | PASS |25.946s; 반사/사과/4색/저격3/III3/확정음/복원 무재생 |
|3화면 Pixi low | PASS |25.651s; 같은 검사 |
|3화면 Pixi high | PASS |25.935s; 최초7장면(최종 RAPID/WIDE 추가장면은 low/연속 balanced에서 확인) |
|20 Canvas low 같은 방5경기 | PASS |94.341s; 초기 인위적 III+III 스트레스 fixture. 정상5선택 비교와 구분 |
|20 Pixi balanced, 정상5선택,5경기 | PASS | 기준103.733s / 수정104.600s; solo→team-elim→capture→solo→capture |
|30 Pixi high,3브라우저 | FAIL | 기준52.901s / 수정54.041s; 각각 전투0.867s /0.400s에 SAFE_PAUSED |
|11종×Lv1/3/6×S/A/B/C/F | PASS(측정 실행) |165경우씩, 기준2.470s /수정2.572s; 실제피해/첫명중/처치 frame/객체 수. 밸런스 적정성 승인은 별도 |
| 물리 모바일/학교 Wi-Fi/1GB AWS | NOT_RUN | 현재 실기기/운영 부하 권한 없음 |
|600/1200초·전체 화질/86브라우저 Deep | NOT_RUN | 이번 범위에서 반복하지 않음 |

`PASS(측정 실행)`은 수치가 요구한 방향으로 모두 더 좋다는 뜻이 아니다. [165경우 전후 원자료](evidence/balance-probes.json)의 null killFrame은10초 안에 처치하지 못했다는 뜻이다. 고정 입력 대상의 전투 계측이며 실제 조준 명중률/승률로 일반화하지 않는다.

20인 모두 같은 신원/방을 유지했다. 실제 학생2화면의 이동·평타·스킬, 탈락20→6→5→3→2, 탈락자 새로고침, 점령전 퀴즈/리롤/부활 후 새 공격, 결과20행·재경기·world/입력/행동/렌더 정리를 확인했다. III 동시 성장 시험은 II+II에서 정확히20개 실제 선택을 수락하고20개 FX를 발생시켰다. 각 재경기 뒤 samples/sprites/textures/effects=0,RAF=null,이전 world 참조 내부 컨테이너=0이었다. 별도의20사과 동시 종료는160개 고유 파편,90틱 뒤 entities/events=0(26.288ms)을 확인했다.

## 성능: 개선으로 포장하지 않는 동일 조건 비교

Windows/Node24.22.1/Edge headless, 같은PC의 별도 서버 process + 호스트1/학생2 브라우저 + 나머지 실제 WS. v35.4 고정 원본을 별도 디렉터리에 빌드하고 동일 테스트 전용 fixture만 복사했다. 서버/브라우저 기기를 분리하지 못했다. 각20/30조건은 한 번씩 실행했으며 좋은 표본을 얻기 위한 재시도는 없다. 직접 GPU 타이머/VRAM은 NOT_RUN, draw는 브라우저 CPU elapsed이고 gap은 rAF 간격이다.

|20인 전체 생존 장면 | 서버 step p95 기준→수정 ms | snapshot p95 ms | WS MB/s | 호스트 draw p95 ms | 학생 draw p95 ms |
|---|---|---|---|---|---|
|1 개인전|2.57→2.63|7.04→7.41|14.26→13.88|7.9→11.1|11.4→13.9|
|2 팀 생존|2.97→2.82|7.07→6.52|14.69→14.03|6.6→9.4|9.3→11.3|
|3 점령|3.64→3.47|7.71→7.98|16.11→15.19|6.4→10.2|9.1→11.7|
|4 개인전|3.27→3.03|7.48→6.90|14.12→13.47|8.3→11.5|12.0→15.1|
|5 점령|4.03→4.10|8.24→7.63|14.94→15.32|6.8→10.6|8.8→11.4|

각 행2.5초 표본이며 WS는 UTF-8 JSON payload(프레이밍/TLS 제외). 호스트 gap p95 약16.8~16.9ms지만 draw 비용은 증가했다. 전체 생존 서버 CPU 사용률은 기준36.83~55.80%,수정43.71~54.92%; sampled RSS119.66~227.98MiB→127.81~201.46MiB. 단일 순차 실행의 공유 GPU/스케줄링/GC 영향을 분리하지 못했으며 **draw 증가 원인과 장기 RSS는 UNRESOLVED**다. 안정적 자원 정리와 장기 메모리 안정성은 다른 주장이다.

30인에서는 기준 step p95/max45.31/87.87ms, snapshot p95 41.60ms, event-loop max608.70ms; 수정 step p95 48.05ms, snapshot p95 35.31ms, event-loop max749.21ms였다. 둘 다 첫 실제 브라우저 공격 단계에서 보호가 먼저 작동해 버튼 PAUSED→30초 click timeout. 연결31개(교사 포함),대기열/전송버퍼0도 기록했다. 이는 장시간 누적 렉의 재현이나 원인 확정이 아니다. 보호값·화질·FPS·접속수를 낮추지 않았고 운영 서버에는 시험하지 않았다. [전체 window/max/GC/CPU/RSS/traffic/자원/실패 근거](evidence/performance.json).

## 실패 이력과 한계

- 초기14개 단위:10PASS/4FAIL. 사과 정의의 duration0가 퍼져 비행 전에 끝나는 실제 구현 오류를 수정했다. 증강 조합 기대값은 기존 가산 조합을 잘못 곱한 시험 오류였고 실제 규칙을 유지했다. 다음13/14 통과, 이후 수정 완료.
- 당시 신규31개 묶음30PASS/1FAIL: 이전 RAPID 기대값; 승인값으로만 수정.131개 묶음130PASS/1FAIL: WIDE 카드 문구 속성 순서; 기존 순서를 보존하도록 수정.
- Quick 첫 sandbox 실행 TIMEOUT300초, 정상 네트워크 권한 실행251.064초 PASS. 최초 로그만으로 sandbox 실패의 정확한 OS 원인은 확정하지 않는다.
- 첫 Chromium 실행 INFRA_FAILURE(브라우저 실행 파일 미설치). 설치된 Edge 사용. Crayon EVENT 배열 수신 순서 기대 FAIL은 ordinal 기준 검증으로 수정했다. 색 순서/각탄 검사 유지.
- 추가 Sweep fixture FAIL2회: 넓은 전방 경로를 벽이 막는 기존 정책과11f 준비 잠금을 무시했다. 첫 대상은 벽 앞에 두고, 별도 두 번째 시전은 잠금 종료 뒤에 수행했다. 실제 사거리335/폭300/벽 방어 그대로.
- 물리 dash fixture FAIL: 넓은 모아이의 몸보다 좁은50폭을 주어 기존 몸충돌이 먼저 막았다. 실제 몸폭을 사용해 같은 접촉 assertion 통과. cap fixture FAIL은 기존 profile cache를 바꾼 뒤 재사용한 시험 오류; 새 프로필 객체로 상한 확인.
- 개발 실행의 reload observer TIMEOUT, 추가장면의 reload 후 `m is not defined`는 테스트 문맥 복원 오류였다. 모듈을 다시 읽고 장면 관찰을 reload 전에 배치했다. 최종 배포 빌드 Canvas/Pixi 검사에 모든 원래 assertions와 새 III/발사준비 검사를 유지해 PASS. 브라우저 오류를 숨기지 않았다.
-30인 고화질 FAIL은 미해결이다. 재시도로 덮지 않았다. 기준 main CI44064002326의 기존 WebKit Target crashed와 isolated warning-fixture 실패도 이 변경이 해결했다고 주장하지 않는다. main candidate44066196876는 status job만 성공했고 candidate/staging은 SKIPPED였다(실제 jobs 재조회로 정정).
- [51항목](acceptance.md)은48 PASS/3 PARTIAL 범위를 구체적으로 기록한다. 실제 모바일,학교 네트워크,1GB 운영,장기 RSS 및 정밀 GPU 원인 분리는 미검증이다. 전체 완료/출시 가능 판정은 하지 않는다.

## 재현 명령과 PR

```powershell
node tools/ci/plan.mjs origin/main
npm run quick
npm run build
node --test tests/unit/overdrive355.test.mjs
node tests/combat/overdrive355-balance.mjs candidate
$env:CLASSROOM_BUNDLE='1'; $env:LOAD_BUILT='1'
$env:PLAYWRIGHT_CHANNEL='msedge' # Windows; CI uses bundled Chromium
node tests/combat/overdrive355-identity.mjs canvas low
node tests/combat/overdrive355-identity.mjs pixi low
$env:POLISH_PLAYERS='20'; $env:POLISH_ROUNDS='5'
node tests/combat/overdrive355-live.mjs candidate pixi balanced
$env:POLISH_PLAYERS='30'; $env:POLISH_ROUNDS='1'
node tests/combat/overdrive355-live.mjs candidate pixi high
```

새 focused workflow는 독립 identity/20인5경기/30인 job으로 구성했다. 기존 Quick/Targeted/선택 캐릭터/복구/터치 검사는 삭제하거나 완화하지 않았다. 최종 remote CI 상태/실제 SHA/PR URL은 PR 본문과 Actions에 기록하며 이 문서는 로컬 checkpoint다. Draft 유지 사유는30인 실패 및 Pixi 비용 증가의 미해결 원인이다.

후속 최소 조치: 격리 runner의 동일30인 결과와 런타임 렌더 구간 계측으로 공유 기기 경합과 실제 패치 비용을 분리한다. 사용자 승인 없이 운영 부하/메모리 덤프/재시작/배포를 실행하지 않는다.

화면 근거: [패링](evidence/pan-contact.png), [4색](evidence/crayon-colors.png), [GIANT III](evidence/giant-iii.png), [RAPID III](evidence/rapid-iii.png), [WIDE III](evidence/wide-iii.png). 정지 화면은 연속 플레이/성능 개선의 증거로 사용하지 않는다.

## PR26 첫 CI와 좁은 보정

첫 head `a8e69ac` / CI44078183046 / focused44078183240, v35.4 regression44078183048. [첫 실행 원자료와 후속 로컬 실패](evidence/ci-first.json). 첫 v35.5 CI30Pixi high는 **PASS47.573s**였고, 이전 Windows30양쪽FAIL을 대체하지 않는다. v35.4 focused4job/Quick/roster10/복구/continuous/대부분 캐릭터/Pixi touch도 PASS.

- Canvas20×5 **FAIL55.403s MATCH_CHANGED**: 테스트 IPC가 matchId를 바꾼 직후 ROOM_STATE를 기다리지 않고 START_QUIZ를 전송했다. 실제 host/두 학생의 scope와 UI match 수신을 기다린다. 검증/명령 epoch 기준 그대로.
- Pixi20×5 **FAIL218.358s winner timeout**: 4번째 경기 결과 수신에 이전 최대 wall offset이 남아 실제 serverTime보다 약5265ms 앞선 계산으로3500ms 화면을 건너뛰었다. 같은 증상을 단위로 재현하고 match 변경 때만 clock estimate를 재설정한다. 같은 승자 deadline의 단조 감소/늦은 패킷 차단은 유지. OS/브라우저 시계 차이 발생 자체의 원인은 미확정.
- Pixi identity **FAIL16.758s parry sound0**: 새 소리가 렌더 첫 프레임에 종속됐다. 기존 GameAudio의 확정 EVENT 중복 제거 경로에 현재 생명/복원/숨김 검사를 추가해 옮겼다. 단위에서 렌더 호출 없이 실패 재현→PASS. 표시 대기/그림 assertion을 삭제하지 않았다.
- 반사 사과 파편의 원 발사자 seq90이 수비자 seq2 모션을 막는 실제 오류를 재현했다. 2차 파편은 기존 summon metadata로 식별해 새로운 입력인 것처럼 재확정하지 않는다. 탄속/피해/수/반사 판정은 불변.
- Canvas/Pixi emoji092 raster FAIL은 승인된 원형→240° 패링 변경이었다. 그 단일 guard에 독립240° 원호/방향선 기대 그림을 적용하며, 실제 각도와 전체 PNG 동일성 및 다른 모든 원본 상태/엔티티 검사를 유지한다. Canvas 단일종 local PASS; Pixi 단일종 local PASS11.700s.
- 좁은 보정 관련64개 단위 **PASS1.378s**, content/hash86 불변, paired build PASS. 최종 Pixi high 3화면9장면 **PASS28.259s**([원자료](evidence/identity-pixi-high-final.json)).
- 관련20Pixi 재경기 로컬 재검사 **FAIL52.277s**, 전투0.700s SAFE_PAUSED로 첫 조작부터 차단되어 새 match-clock의5경기 브라우저 검증은 미완료. step p95/max29.28/110.84ms, snapshot p9535.99ms, event-loop max456.92ms, 송신 queue/buffer0. 이 실행도 보존하고 추가 반복하지 않았다.
- 기존 Canvas/WebKit touch는 **FAIL(Target crashed)**; Chromium portion PASS80.046s, 브라우저 crash 원인은 미확정. 종료 뒤 ECONNRESET과 구분한다. isolated-release는 **INFRA_FAILURE**: 정확한 base a916726 후보 artifact 부재. 후보/검사를 다른 SHA로 우회하지 않는다. required-checks FAIL/targeted SKIPPED가 이에 따라 남았다.

51항목의 현재 분류는 로컬 초기48PASS/3PARTIAL에서, 위5경기 재확인 미완료를 반영한 **46PASS/5PARTIAL**이다. 다음 commit의 remote 상태는 PR26에 별도로 갱신한다. 모든 필수 CI가 통과했다고 표시하지 않는다. 추가 검증 시도는 위 재현 실패 관련 경로에 한정했다.

### 두 번째 CI에서의 실제 런타임 검증

runtime `69a311bfad49bde34458e9254255902cf6ac3d9d`, focused44080973118: **Canvas20×5 PASS84.019s / Pixi20×5 PASS200.142s / Pixi30×1 PASS47.386s**. 같은 방/신원/3모드/탈락/부활/결과/재경기 검사를 전부 유지했다. v35.4 focused44080972466도4job PASS. 따라서 F02/F05를 이 실행 근거로 PASS로 갱신,51항목은 **48PASS/3PARTIAL**이다. 로컬20후속FAIL과 기존30양쪽FAIL은 그대로 남는다.

Pixi 개별 장면은 패링 PASS 후 사과 파편0/8 assertion **FAIL43.253s**. 추가한 실패 관측 자료에서는 세 화면 모두 같은 tick43의8파편을 이미 수신하고 있었다. 판정 당시55ms 고정 대기만 끝나고 WS 처리가 끝나지 않은 시험 경합이다. 테스트가 소유한 수동 시뮬레이션 시계에서 각 publish의 권위 tick 수신을 기다리도록 수정했다. 실시간 live 부하/프레임 기준은 변경하지 않았다. 첫 로컬 확인은 새로고침 뒤 테스트 모듈 `m` 참조 소실로 **FAIL28.063s**, observer 참조를 복원 경로와 함께 읽도록 보정했다. 최종 이 시험의 결과와 최종 필수 CI는 PR에 명시한다.

최종 로컬 Pixi high9장면은 수신 동기화/새로고침 보정 후 **PASS27.931s**, pageerrors0. 그 시점 런타임 sourceHash는 dbd37c…였으며, 아래 원래 시계 정책 복원 후 최종 값은 문서 상단 d9598796…이다.

### 최종 한계와 원래 시계 정책 보존

02d9cdd의 v35.5 live20Canvas5/Pixi5 및30Pixi는 PASS했으나 기존 v35.4 Pixi5경기에서 **승자 화면 TIMEOUT152.036s**가 다시 발생했다(44082141356, overload0). [실패 수신/시계 기록](evidence/winner-timeout.json). 두 번째 경기 수신 시 서버 time과 기존 offset 추정의 차이는 약8.8초였다. 이는 이전 match offset만의 원인임을 증명하지 않으며, 지연 수신/메인 스레드 정체와 시계 오차를 분리하지 못했다. 앞의 원인 설명은 가설로 정정한다. **효과가 검증되지 않은 match clock 초기화는 제거하고 원래 v35.4 연결·결과 deadline을 그대로 복원했다.** 늦은 prior-match 패킷 거절과 clock estimate 보존을 검사한다. F05는 다시 PARTIAL, 최종 체크리스트 **47PASS/4PARTIAL**. 현재 원인 미확정 화면 timeout을 해결했다고 보고하지 않는다.

동일 실행의 Pixi identity는 파편 확인 후 헤드슈터 확정음0/1로 FAIL했다. 각3틱 수신 대기가 실제400ms 준비를 인위적으로 늘려2200ms stale-sound 보호에 걸릴 수 있으므로, 수동 시계는 원래55ms cadence로 진행하고 **관측 전 마지막 snapshot 도착**만 기다리도록 수정했다. 확정 event의 관측 시간/대기음 만료값도 제한된 배열에 기록한다. 음향 보호 시간이나 assertion은 변경하지 않았다. 해당 수정 로컬 Pixi high9장면 **PASS28.198s**, pageerrors0. 최종 원래 clock 보존 후 관련64단위 **PASS1.365s**, client/server build **PASS7.02s(Vite)**. 최종 head CI의 실제 통과·실패는 PR26에 별도 표시한다.
