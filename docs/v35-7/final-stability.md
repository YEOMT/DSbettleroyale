# PR28 병합 전 안정화 — 724155c 기준

요청 기준 `724155cc3be55b2d46ad43606cda28b70deac8e8`, 원격 main
`9b2d45ff13d4ee0890179103ef66e6edb1bf174c`를 확인했다. PR28은 Draft로
유지한다. 승인된 10종 증강 수치, 콘텐츠 hash, 86종, 60Hz/20Hz, 서버 보호,
3500ms 승리 연출, 재접속/재경기 규칙은 변경하지 않는다.

## 원인 분리

### C07

게임 코드를 바꾸지 않은 계측 커밋 `16ef6abaceff81e88918236bd9e22e597ece56d5`,
[20/30인 A/B 실행](https://github.com/YEOMT/DSbettleroyale/actions/runs/44526161164):

| 20인 후보 4번째 경기 | 서버 결과 확정 이후 |
|---|---:|
| 결과 확정/RESULTS 전환 | 0ms |
| 호스트 WS 송신 요청 | 4ms |
| 소켓 쓰기 callback 완료, bufferedAmount=0 | 14ms |
| Chromium WS 계측 수신 | 5375.49ms |
| JS message 수신 | 5376ms |
| 결과 UI 처리 완료 | 5382ms |

3500ms가 이미 지났으므로 승리창을 재생하지 않은 결과 시계 동작은 정상이다.
서버 결과 계산이나 UI 자원 정리가 이 5초 지연을 만든 증거는 없다.
CDP 수신도 Blink의 관측 시각이며 OS 패킷 도착 시각이라고 주장하지 않는다.
별도 v35.5 검사에서도 수신 지연 6795ms, UI 처리 4ms를 관측했다.

브라우저의 지속적인 렌더 작업 사이에 socket/input task가 처리될 기회를
주도록 다음 rAF 예약을 단일 MessageChannel task로 넘긴다. 타이머/FPS cap,
화질 변경, 전송 빈도 변경, 데이터 삭제, 결과 만료시간 연장은 없다.
중단/재경기 시 예약을 취소하고 오래된 task는 다음 경기의 프레임을 재예약하지 못한다.
이 수정의 실제 CI 효과는 후속 같은 조건 실행으로 판정하며, 로컬 PASS로
Linux C07 해결을 대신 주장하지 않는다.

### 증강 몸체 표시와 CI 시간 제한

같은 계측 실행의 balanced 검사는 `amplify v35.6 body preserved`에서 FAIL.
공격 이벤트/몸체 entry는 세 화면 모두 생성됐지만 표시 표본은 1/0/1이었다.
당시 게임 draw 함수는 약 2~14ms였고 브라우저 전체 rendering task는
528~621ms였다. 짧은 모션이 이 사이에 표시되지 못한 실제 화면 누락이며,
공격이 서버에서 실행되지 않은 오류와 구분한다.

렌더 루프는 이전 rendering opportunity의 rAF timestamp 대신 snapshot/event와
같은 `performance.now()` 시계를 callback 실행 시 읽는다. 실제 모션의 강도,
유효시간, 판정은 그대로다. 오래된 프레임 시각 600ms를 주입한 동일 quick
장면은 수정 전 FAIL 16.592s → 수정 후 PASS 16.938s였다. 이는 시계 불일치의
재현 증거이며 실제 모바일/CI의 모든 GPU 지연을 재현했다는 뜻은 아니다.

계측 실행 low는 8분 job 취소(TIMEOUT), balanced는 assertion FAIL,
high는 PASS로 서로 구분한다. 새 Pixi job은 품질마다 독립 5경로씩 실행한다.
각 job의 기존 8분 제한은 유지한다. 세 품질 각각 10경로가 정확히 한 번씩
포함됨을 unit 검사한다. 모든 tier/guide/pose/contact/cleanup assertion은 남아 있다.
연속 플레이/CPU 시험은 이 fixture 분할과 독립이며 인원/라운드/화질을 유지한다.

### 다섯째 경기 CPU

| 같은 CI, 20인 5번째 경기 | v35.6 | v35.7 계측 전용 HEAD |
|---|---:|---:|
| CPU ms/s | 194.50 | 234.68 (+20.66%) |
| RSS MiB | 312.48 | 311.05 |
| snapshot p95 ms | 5.15 | 5.75 |
| 전체 WS 송신 MB/s (십진) | 14.04 | 16.47 (+17.35%) |
| 현재 확장 개체 | 19 | 2 |
| GC 횟수/총 경과 ms | 3 / 6.19 | 4 / 24.51 |
| CI 머신 CPU busy | 97.23% | 97.01% |

이전 168.59→249.14ms/s 증가 기록은 그대로 보존한다. 재계측에서도 증가가
있지만 크기와 개체 수 방향은 달랐다. 5회 모두 world dispose, actors/input/
action/entities=0을 확인했다. 서버 프로파일의 주요 비용은 writev, JSON,
send/Buffer 및 GC였고, 몸체 함수는 클라이언트에서 총 수 ms였다.
서버 프로파일은 브라우저 계측 명령을 기다리는 구간도 포함하는 통계 샘플이다.
2.5초 CPU 사용시간 창과 동일 길이의 정밀 함수별 CPU 합계로 해석하지 않는다.

실제 증강의 공격 주기/효과/전송량 증가 비용은 남아 있다. 공유 4CPU 러너의
높은 경합도 분리된 기기로 배제하지 못했다. 승인 수치를 깎거나 확인되지 않은
엔진 최적화를 추가하지 않는다. 성능은 PARTIAL이며 누수/애니메이션 단독 원인
또는 현장 성능 개선으로 단정하지 않는다.

## 실행 기록과 한계

- 계측 HEAD 필수 CI [44526161189](https://github.com/YEOMT/DSbettleroyale/actions/runs/44526161189): 13 PASS, 범위 제외 2 SKIP, required-checks PASS.
- v35.4 [44526161147](https://github.com/YEOMT/DSbettleroyale/actions/runs/44526161147): 4 PASS.
- v35.5 [44526161207](https://github.com/YEOMT/DSbettleroyale/actions/runs/44526161207): 4 PASS, Pixi20 C07 FAIL.
- v35.7 [44526161164](https://github.com/YEOMT/DSbettleroyale/actions/runs/44526161164): 13 PASS / 2 FAIL / 1 CANCELLED(TIMEOUT). 20인 baseline PASS 297.651s, 후보 PARTIAL 327.904s(C07; 5회 결과/재경기는 완료). 30인 baseline PASS 181.740s, 후보 PASS 208.748s. 성능은 PARTIAL.
- 최소 수정 후 Quick: 8+476=484 PASS, 251.160s. 콘텐츠/경계/YAML 검사 PASS.
- 필수 client/server build PASS(도구 전체 5.602s, Vite 4.34s). 기존 번들 크기 경고는 유지.
- stale-rAF quick 장면의 수정 전 FAIL/수정 후 PASS는 위에 별도로 기록했다.
- 로컬 수정 전 20인 5회 PASS 91.812s. 브라우저 CPU 6배 지연+소프트웨어 GL 주입 20인 1회 PASS 71.240s. 두 결과를 CI C07 PASS 또는 정상 성능으로 대신 쓰지 않는다.
- 같은 6배 지연 주입 수정 후 20인 1회 PASS 70.382s. 호스트 결과 처리 지연 149→61ms. 세 화면 frame-gap p95 250/250/250→246.7/276.7/233.9ms로 혼재하며 성능 개선 PASS로 해석하지 않는다.

최종 수정 HEAD의 필수 CI/v35.4/v35.5/v35.7 상태는
[PR28](https://github.com/YEOMT/DSbettleroyale/pull/28)에 실행 링크와 함께 갱신한다.
이 문서의 이전 실패를 새 성공으로 덮어쓰지 않는다. 원자료는 각 Actions
artifact와 로컬 `artifacts/v35-7/final-stability-*`, 익명화한 요약은
[evidence/final-stability-before.json](evidence/final-stability-before.json)에 있다.
실물 Samsung/iPhone/iPad, 별도 서버/브라우저 기기, 장시간 Deep, 운영 배포는
NOT_RUN. AWS/main/공식 Pages는 변경하지 않았다.

## 렌더 수정 006ffdc의 결과 및 최종 보완

- [필수 CI44529701388](https://github.com/YEOMT/DSbettleroyale/actions/runs/44529701388) 13PASS/2scopeSKIP, required-checks PASS.
- [v35.4 44529701268](https://github.com/YEOMT/DSbettleroyale/actions/runs/44529701268) 4PASS(Pixi5회147.103s), [v35.5 44529701248](https://github.com/YEOMT/DSbettleroyale/actions/runs/44529701248) 5PASS(Pixi20×5 229.256s). v35.5 마지막 개인전 결과 수신 6795→797ms.
- [focused44529701284](https://github.com/YEOMT/DSbettleroyale/actions/runs/44529701284) 18PASS/1FAIL/취소0. 모든 새 증강10경로×3품질×Canvas/Pixi PASS. Pixi20×5 기준223.432s/후보216.657s 양쪽PASS, 후보 개인전 결과 수신305/2159ms. Pixi30×3 기준185.844s/후보186.394s 양쪽PASS. 30인 호스트 결과 수신1735/9090/11380ms가 남았으므로 지연 전체 해결은 아니다.
- 다섯째20 CPU153.15→201.99ms/s, snapshot p952.11→2.43ms, host/student gap316.6/316.7→332.9/329.1ms. 30인 첫 CPU223.12→273.28ms/s. 성능은 계속 PARTIAL. [원자료 요약](evidence/final-stability-render-turn.json).

남은 legacy Pixi high FAIL31.365s는 같은 tick20의 swing/hit/swing이 한
학생에게 24743.0/25073.5/25409.5ms에 따로 도착해 두205/135ms 모션의
동시 표본이 없었던 것이다. 다른 두 화면에서는 세 이벤트가 한 번에 도착해
같은 assertion을 통과했다. 정지 fixture가 `stepWorld`를 직접 호출하면서
실제 `SimulationRunner`의 `Peer.beginBatch/endBatch`를 빠뜨린 원인을 확인했다.
두 identity fixture의 직접 step도 동일 EVENT_BATCH 경로로 감싼다. 커서,
이벤트 내용, snapshot 순서, exception 뒤 batch 정리 회귀를 추가했다.
검사 시간/모션 수명/단일 클릭/동시 표시 assertion은 그대로이며 가상 시계를
도입하거나 렌더 함수를 직접 호출해 표본을 만들지 않는다.

30인 메시지 지연에 대해서는 Scheduling API가 있는 브라우저에서 다음 rAF
예약 task를 `background` 우선순위로 제출해 대기 중인 socket/input task를
우선 처리한다. 지원하지 않는 브라우저는 MessageChannel로 돌아간다. 대기
타이머나 FPS cap은 없고 작업은 한 개로 제한되며 중단된 경기의 작업은 폐기한다.

최종 보완 로컬 검증: frame/fixture focused unit4PASS207ms, 필수 paired
buildPASS(Vite6.86s), 실제 Pixi high identity12장면PASS75.849s. 직전
EVENT_BATCH만 적용한 같은 suite는PASS44.341s였다. 실행 시간 증가는 그대로
남기며 이 fixture 시간을 실시간 FPS 성능으로 바꾸어 해석하지 않는다.
새 unit 작성 중 괄호 오류1FAIL은 즉시 수정 후 해당unit1PASS259ms;
다른7개PASS는 재실행하지 않았다. 최종 CI 및 동일 A/B 성능은 PR에서 확인한다.
