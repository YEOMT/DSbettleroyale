# v35.8 Ultimate Smoothness

## 기준과 범위

2026-11-26 확인한 원격 main과 운영 `/version`의 buildId는 모두
`5585c8ca5f262d51e3732fb2115bab6e660fefd5`이다. PR #28은 병합됐다.
이 SHA의 실제 production build와 후보를 같은 조건에서 순차 비교한다.
운영에는 읽기 전용 `/version` 조회만 수행하며 부하·재시작·배포하지 않는다.
이전 Pixi low 벽 몸체 표본 FAIL과 CPU 증가 PARTIAL은 해결됐다고 간주하지 않는다.

86종·10종 증강·전투 수치·60Hz/20Hz·보호·해상도·음향·효과를 유지한다.
기존 입력/보간/렌더/서버 구조에서 확인한 중복 작업만 줄인다.
5회 재경기와 SOLO 20→6→5→3→2, 팀 킬전, 점령전, 증강 선택,
부활·결과·복구를 기존 production-build harness로 검증한다.
20인 balanced, 30인 high 각각 호스트1/학생2 실제 브라우저와 합성 학생을
사용한다. 타이밍/assertion/품질/인원은 유지하고 세 화면 p99를 추가한다.

## 상태

구현·검사 진행 중. 실제 완료 결과와 실패는 아래 및 Draft PR에 기록한다.
실물 Android/iOS·분리 기기·AWS 1GB 장시간 운용은 NOT_RUN이다.
공유 PC/CI에서 측정한 값은 실제 학급에서의 무렉 보장이 아니다.

## 수정 내용과 집중 근거

- Timeline: 반복 actor/shot/owner 인덱스를 최대 3개 snapshot으로 캐시하고,
  프리뷰가 없을 때 발사 인계 집계를 생략하며 FX life 검사를 인덱스로 조회한다.
  보간/예측/보정 시간과 좌표 계산은 그대로다. 중복/late/warp/idle/5회 reset
  회귀 검사와 기존판 첫 300프레임 전체 출력 deep parity를 확인했다.
- Pixi: 종료된 shot-/rw- Sprite를 최대 64개 detached reserve로 재사용한다.
  활성 수는 제한하지 않는다. transform/alpha/tint/texture/순서를 복원하고
  reset 및 Canvas fallback에서 모두 destroy한다. 브라우저 재경기 검사에도
  reserve=0 assertion을 추가했다. Canvas 그리기와 연출은 변경하지 않는다.
- 서버: 한 prepared snapshot 안에서 interest-filter가 공유하는 상자/XP
  튜플의 JSON을 1회 직렬화한다. 다음 snapshot에는 새 캐시를 만들며,
  송신 JSON 바이트·정보·순서·수신자 필터·epoch·20Hz를 유지한다.

보간 합성 작업(30actors/200shots/100FX/30spawns)은 네 번 교대 표본 모두
0.09077~0.09460→0.04101~0.04486ms/frame이었다. 전체 프레임 시간이 아니다.
실제 Pixi Sprite 12,000회 lifecycle은 생성 12,000→120, active peak120 동일,
30.439→24.532ms / processCPU94→62ms였다. GPU 연산은 포함하지 않는다.
원자료와 초기 검사 작성 오류는 evidence/timeline.json 및 render.json에 보존한다.

서버 전체 문자열 조립안은 30인 CPU2047→3172ms로 악화되어 폐기했다.
보급 튜플 캐시 prototype은 20인CPU453→438ms,30인781→703ms였지만
최종 sparse-array 보강 코드의 수치와 실시간 A/B는 별도 기록한다.

## 재현 명령

- `node tools/ci/plan.mjs origin/main`
- `npm run quick` / `npm run build` / `npm run test:targeted`
- `node --expose-gc tools/performance/timeline358.mjs`
- `node tests/v35-8/snapshot-benchmark.mjs`
- `SMOOTH358=1 OVERDRIVE357=1 POLISH_PLAYERS=20 POLISH_ROUNDS=5 node tools/ci/recovery356-pair.mjs pixi balanced`
- `SMOOTH358=1 OVERDRIVE357=1 POLISH_PLAYERS=30 POLISH_ROUNDS=5 node tools/ci/recovery356-pair.mjs pixi high`

위 환경변수 문법은 Linux CI 기준이다. Windows에서는 각 변수를 `$env:...`로
설정하고 로컬 브라우저는 `PLAYWRIGHT_CHANNEL=msedge`를 사용했다.

## 현재 실행 결과

- 로컬 Quick: 8+486=494 PASS, 총252.522s. 새 서버 unit은 Quick 시작 후
  추가되어 별도 관련6파일22PASS615.8ms로 검사했다. CI는 최종 전체 파일을 검사한다.
- 필수 paired build PASS(Vite5.10s); 빌드 sourceHash와 최종 apps/packages hash 일치.
- 최종 serializer 750회 인코딩 단일 A/B: 20인CPU469→422ms(-10.0%),
  경과460.42→422.11ms. 30인CPU797→797ms(동일), 경과778.78→820.72ms(+5.4%).
  전송 바이트는 양쪽 정확히 동일. 30인 속도 개선으로 보고하지 않는다.
- 실시간 20/30 A/B 및 Targeted/CI는 완료 후 아래 또는 PR에 실제 상태를 기록한다.
