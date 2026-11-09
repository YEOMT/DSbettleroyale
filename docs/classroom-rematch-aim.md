# 수업 진행·동일 방 재경기·조준 통합 패치

기준 main: `b1916572f810de3df01d8d85b295392d6f98fbb5`. 작업 브랜치: `codex/classroom-rematch-aim`.
2026-11-09 제공된 ClassroomFlow/Rematch/Balance 명세와 RangedAim/Archmage 추가 명세를 함께 적용했다. 기존 교사 인증과 직전 정식 전환 기록을 보존했다. 이번 패치는 AWS/Pages/Firebase에 배포하지 않았다.

## 구현

| 요구 | 구현 / 보존 범위 | 집중 증거 |
|---|---|---|
| 시작 안내 | LOBBY의 서버 countdown ID/deadline, 5초 후 기존 initializeQuiz. 60초 퀴즈 시간 별도 보장. 기존 AudioContext·음량·음소거를 사용하는 교사 전용 짧은 음 | 실제 브라우저 5→1, 교사 음/학생 무음, 교사 새로고침, 음소거 시작 |
| 늦은 입장 | countdown 및 quizEndsAt 전 JOIN, 새 학생만 초기화/팀 배정. 기존 점수/문제/팀/시간 유지. deadline 이후와 DRAFT는 거부 | 실제 WS 경계·중복 시작·RESUME, 브라우저 countdown/quiz JOIN |
| 재경기 | 미송신 snapshot/queue/profile, 입력 floor/조준 참조, 퀴즈 pending/timer, 이전 world callback/엔티티 정리. 오래된 round/revision ROOM_STATE/FULL_STATE 거부, 이전 명령 재시도 취소. event cursor 단조 증가 유지 | 아래 동일 방 20명·5회, 지연 상태/응답 단위검사, team-respawn 2회 및 실제 부활 퀴즈/keep |
| 조커 | 최대 거리 **400**, 기존 안전 착지. 은신72틱/분신300틱/HP25%/1개/쿨타임720틱 유지 | PC·CDP 터치 최대 드래그의 가이드/실제 좌표 -400, Canvas/Pixi |
| 꿀꿀이 | 개인전 Lv1 무증강 **HP240**. 공유 F 기본값180은 그대로, 캐릭터별 override | 반복 재계산, 모드 보정, 부활/재경기 HP 비누적 |
| 버섯 | 미발동 trap은 설치자만. 적/아군/공개 호스트 SNAPSHOT/FULL_STATE/SHOT_SPAWN 차단. 내부 판정 객체 유지, 발동/파괴·독 공개 | 실제 WS owner/enemy/ally/host, Canvas/Pixi 3화면, 발동 후 poison |
| 약한 조준 | 단발 비유도 직진 평타 cone14°/max5°/gain0.36, 명시된 직진 투사체 스킬 12°/4°/0.36 | OFF/기존/수정, 정지·횡이동·선행 조준·교차 대상, 수동 상자·엄폐·life·stale 검증 |
| 대마법사 | 스킬 일반 반경**24**(width48), 마지막**32**. 증강 크기 1회 적용. 14발/상한22/4틱 간격/10틱 선딜/사거리1110/쿨타임1200 유지 | 실제14발 spawn/예측/가이드/3화면, 가장자리 hit/miss·벽 충돌, 시전 후 방향 고정 |

짧은 탭35°, 근접·precision·유도·레이저·훅·대시·지점·지원·반사·산탄 등의 기존 정책은 유지했다. 일반탄에 비행 중 추적을 추가하지 않았다. 대마법사의 현재 런타임 속도31.5, 피해계수11.55/마지막17.85는 기존 보정이 적용된 값이며 변경하지 않았다. 새 수치는 첫 적용 밸런스안이며 실기기 명중률 개선을 입증한 값은 아니다.

내용 manifest/hash/도감도 갱신했다. contentHash: `556deb6eec6f9be7e4123c5674777c872e21fff4d168e165b4f50d8f19280eec`. 기존77종 원본 parity의 대마법사 승인 차이만 명시적으로 처리했고 나머지 수치 단언을 유지했다. 신규10종에서도 위 승인 대상 외 콘텐츠 변경은 없다.

## 확인한 결함과 미확정 원인

- 수정 전 단위 재현: REMATCH 후 미송신 이전 snapshot/profile/queue가 남았으며, 늦은 ROOM_STATE가 최신 match를 이전 round로 되돌렸다. 수정 후 거부·정리 및 새 명령 정상 처리를 확인했다.
- 이전 world의 event/input callback 참조, 퀴즈 응답/타이머와 클라이언트 조준 참조를 경기 수명으로 제한했다. 사용 중인 연결·인증·전역 UI 인스턴스는 유지한다.
- 동일 설정을 재전송하는 시작 버튼이 수동 팀을 재편성하던 경로도 고쳤다. 실제 mode/teamCount 변경 때만 재편성한다.
- **학교에서 보고된 반복 경기 튕김의 단일 원인은 재현 확정하지 못했다.** 수정 전/후 비교에서 발생한 과부하를 이번 결함만의 결과라고 단정하지 않는다. 메모리 누수 전체 해결이나 현장 렉 완치로 보고하지 않는다.

## 동일 방 20명·5회 계측

로컬 Windows/Edge, 교사+학생2 실제 Canvas 화면 및 학생18 WS 수신/입력 도구. 같은 PC의 기존 부하검사 별도 서버 프로세스를 재사용했다. 다른 물리 기기와 분리한 시험은 아니다. 매 회 동일 방 코드/ID/20참가자/토큰을 확인했으며 이동·평타·스킬을 서버 카운터로 단언했다. 3회차 실제 새로고침, 4회차 RESULTS→LOBBY와 socket 단절 경합, 5회차 엔진의 실제 사망→결과 경로를 포함했다. 늦은 JOIN은 별도 실제 브라우저/WS 시나리오에서 검사했다.

| 실행/회차 | step p95 ms | snapshot CPU p95 ms | 화면 draw p95 ms (교사/학생1/학생2) | frame gap p95 ms (동일 순서) |
|---|---:|---:|---|---|
| 원본 1회차 | 14.18 | 35.76 | 5.5 / 2.8 / 3.2 | 30.3 / 29.4 / 29.6 |
| 수정 1회차 | 10.73 | 25.34 | 5.3 / 3.0 / 3.4 | 29.7 / 29.7 / 37.1 |
| 수정 3회차 | 8.01 | 25.50 | 4.4 / 2.8 / 2.2 | 71.1 / 64.9 / 70.1 |
| 수정 5회차 | 8.07 | 25.34 | 4.4 / 2.7 / 2.6 | 17.2 / 22.7 / 17.4 |

서버 수치는 bounded cumulative samples, 화면 수치는 해당 경기 구간이다. 3회차 새로고침을 포함한 frame gap 상승은 숨기지 않았다. 원본 비교는32.625초에 첫 경기 과부하1회로 **FAIL**, 3/5회차는 **NOT_RUN**. 수정본은78.908초에5회 **PASS**, 과부하0회. 워밍업·로컬 자원 경합·짧은 표본 차이가 있어 위 차이를 성능 개선율이나 장시간 안정성 보증으로 해석하지 않는다.

수정본 매 경기 로비에서 각 화면 sprites/textures/labels/timeline samples/profile/pending=0. 각 화면의 전역 interval5, RAF1, window/document listener27이 1/3/5회 모두 일정했다. 모든 peer queue/queueBytes/pending snapshot은 정리됐고20명 연결이 유지됐다. 폐기 world의 callback=false, inputs/players/entities=0. 원본은 폐기 world callback=true였다. 합성 학생을 두 번째 브라우저로 인계한4009/SUPERSEDED와 의도한1012/TEST_TRANSITION_RESUME는 정상 시험 이벤트다. RATE_LIMIT/INVALID_MESSAGES/SLOW_RECEIVER로 인한 탈락은 이 성공 실행에서 관측하지 않았다.

## 실행 기록 / 제한

- **PASS**: 새 수명 단위5개0.591초; 밸런스/조준 최초6개1.080초, 추가 횡이동/교차1개0.200초. 새 WS 통합3개20.978초. 원본 parity+집중 통합83개11.780초.
- **PASS**: 시작/음소거/늦은 입장 브라우저26.024초; 조커·대마법사 Canvas13.993초/Pixi13.829초; 조커·버섯·꿀꿀이3화면 Canvas18.956초/Pixi20.357초. 자동 tick을 쓰는 표시 시험은 연속 FPS 시험과 구분한다. life를 교체하는 fixture의 이전 입력은 LIFE_MISMATCH로 거부됐으며 검증을 해제하지 않았다.
- **PASS**: 필수 client/server 빌드1회(Vite6.93초; 전체 wall time은 별도 미계측), 동일 buildId `v33-da82a1fd4e1ce9d8`. root index.html 변경 없음. 이 로컬 buildId는 정식 배포 SHA가 아니다.
- **FAIL 보존**: 최초 Quick205.269초에서 기존235공통 단언 중233PASS/2FAIL(승인된 대마법사 크기와 원본 기대값). 승인 차이만 반영한 해당 parity/통합 재검사83PASS. 통과한 나머지 로컬 공통 검사는 반복하지 않았으며 최종 전체 Quick 상태는 PR CI가 확인한다.
- **FAIL 보존**: 최초 Targeted46.790초의3 E2E가 새5초 준비 시간과 기존5초 즉시 퀴즈 기대에서 실패. countdown 표시/종료 단언을 추가했으며 다른 기능 단언은 유지했다. 수정 후 Targeted **PASS155.862초**: 3모드 E2E54.644초, 대표 Canvas/Pixi, 오디오, 기존26명30초 부하(과부하0,16227 snapshots). 정확한 커밋의 전체 CI 결과는 PR 본문에 기록한다.
- **FAIL/INFRA_FAILURE 보존**: 초기 같은 프로세스 서버+가상 수신기+Vite/브라우저 실행의 과부하, 최초 sandbox Edge 시작 실패, 잘못된 fixture 좌표/종료 방향·쿨타임 기대 및 비동기 Playwright polling 오류는 원본 로그에 남겼다. 기존 분리 서버 도구와 최근 스냅샷만 보관하는 수신기로 시험 부담을 분리했다. 과부하 기준·게임 FPS·공격 정보를 바꿔 통과시키지 않았다.
- **NOT_RUN**: 이번 패치의 실제 Samsung/iPhone/iPad·학교 Wi-Fi, 605초/전체87종×화질 Deep Audit, 운영 AWS/공식 Pages 배포. 기존 극한 부하 실패와 실기기 미검증을 해소한 것으로 표시하지 않는다.

PR17 첫 CI42610600897은 Quick/빌드/Targeted, Pixi 신규10종, Pixi 재접속·조준, 터치(Canvas/Pixi 및 모바일 WebKit)가 PASS였고, 아래 시험 준비/기대값 문제로 전체 CI는 **FAIL**이었다. 동일 방5회와 countdown UI는 Canvas recovery 내부에서 이미 PASS했다. `all77.mjs` 호출은 기존 CI의 지정된5종만이며 전체 캐릭터 감사가 아니다.

- 기존 live-control/live-late가 같은 round 안에서 matchId만 바꿔 새 stale-state 검증에 거부됐다. 시험용 고정 seed 전환도 round/revision을 증가시키고 양쪽 화면의 새 scope 수신을 기다리도록 수정했다. 오래된 경기 거부 규칙은 유지했다.
- 연속 버섯 시험의 ‘상대·호스트도 미발동 버섯을 본다’는 이전 기대를 설치자만 공개로 바꿨다. 모두에게 독장판이 보이는 기존 단언은 유지했다.
- 빠른 fixture 캐릭터 교체 후 조준 시험이 실제100ms 중복 탭 방지 시간 전에 다음 스킬을 시도할 수 있었다. 입력 준비·life·쿨타임과 원래100ms 경과를 기다리며, 실패 시 실제 lastAction/life 상태를 기록한다. 게임 debounce/쿨타임을 해제하지 않았다.
- 해당 로컬 재검사만 수행: 조준 Canvas **PASS15.615초**, Pixi **PASS15.636초**; 연속 입력 Canvas **PASS13.613초**; 관전 전체/집중 최후반 **PASS30.596초**; 신규4종 연속 공격자·상대·호스트 **PASS22.015초**. 최종 커밋 CI 상태는 PR 본문에 별도 기록한다.

재현: `node tools/ci/plan.mjs origin/main`, `npm run quick`, `npm run build`, `npm run test:targeted`. 집중: `node tests/combat/classroom-rematch.mjs`, `node tests/combat/classroom-ui.mjs`, `node tests/combat/classroom-aim.mjs canvas` / `pixi`, `ROSTER10_IDS=141,144,149 node tests/roster10/flow.mjs canvas` / `pixi`. Windows 브라우저 실행은 `PLAYWRIGHT_CHANNEL=msedge`를 사용했다. raw 측정은 ignored artifacts/classroom 및 CI artifacts에 남긴다.

이후 후보는 사용자 PR 병합 후 기존 Paired candidate workflow로 생성한다. 배포 시 해당 후보의 정확한 buildId 쌍과 기존 승인·백업·drain/seal·복구 절차를 그대로 사용한다. 이번 브랜치를 기존 운영 주소에 적용했다고 보고하지 않는다.
