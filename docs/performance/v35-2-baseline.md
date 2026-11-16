# v35.2 Long-Run Stability & Smooth Rendering

## 기준과 경계

2026-11-16 확인한 main/주 비교 기준은 `d6b4525bf22bfa000a09eb686dffc5736bc5a3b3`(PR22 병합 v35.1)이다. 시작 작업본 `d8b7f6ffe926ea2c7f7eb3758e0de7ecbd1171d7`의 수정은 모두 이 main에 포함됐다. 작업 브랜치는 `codex/v35-2-longrun-smooth-rendering`이다. 공개 `/version` 읽기 결과 운영 buildId도 `d6b4525bf22bfa000a09eb686dffc5736bc5a3b3`였다. 운영 서버의 부하·덤프·SSH 설정·재시작·배포는 수행하지 않았다.

86종 `emoji86-v35`, contentHash `8f4cf38107b74bfd8c37e32f80016c48d8265bc5b883cdf4914b08d427f77bdb`가 유지된다. 콘텐츠 생성기 `--check`가 통과했다. 루트/workspace package 및 lock 메타데이터는 `35.2.0`, 화면 표시는 단일 루트 버전에서 `v35.2`를 읽는다. 의존성·프로토콜·전투 엔진·60Hz/20Hz·SHA 쌍 검증은 변경하지 않는다.

## 환경과 측정 정의

- 로컬: Windows, Node 24.22.1, Edge, 동일 PC의 서버/부하 생성기/브라우저. 소프트웨어 GPU 결과를 학교 태블릿 결과로 환산하지 않는다.
- 격리 CI: Ubuntu24.04, Node `.nvmrc`, Playwright1.56.1 컨테이너. 각 A/B는 같은 runner에서 고정 SHA를 별도 export해 실행한다. Node/dependencies/시험 스크립트가 같고 일부 짧은 케이스는 버전 실행 순서를 바꾼다.
- `tools/build.mjs`의 실제 서버 bundle과 Vite production build를 사용한다. 브라우저 계측은 시험 전용 Vite plugin이 기존 모듈 인스턴스 참조를 노출한다. 이 observer는 정식 빌드에 포함되지 않는다. 기존 기능 fixture 중 개발 실행은 별도 표시한다.
- T3: 30학생+교사 실제 소켓, 브라우저 0개, 각 버전 실제 600초. 기존 300초 점령 규칙으로 Results→Rematch하며 HP/시간/탄수/쿨타임을 늘리지 않는다. 합성 draft/XP20/실제 증강 선택, 고정 match/성장 RNG와 30Hz 입력·공격 정책을 양쪽에 동일 적용한다. 연결 종료 후30초 유휴를 별도로 관측한다.
- 기본 서버 percentiles는 최근4,096개다. 새 telemetry는 각 창의 시작/끝/샘플 수를 기록한다. 창별 p95 평균을 전체 p95로 쓰지 않는다. RSS·heapTotal·heapUsed·external·arrayBuffers는 중복 포함 관계이므로 더하지 않는다.
- 전송량은 `ws.send`에서 한 번 센 UTF-8 JSON payload. 프레임/TCP/TLS를 제외한다. 호스트/학생별·유형별 bytes/s와 소켓 누적 bytesWritten을 구분한다.
- 렌더 측정은 rAF와 실제 draw 시작 간격, CPU prepare/submit을 분리한다. GPU 완료/실제 디스플레이 표시가 아니다. 픽셀 readback/스크린샷은 타이밍 구간 밖이다.

## 실행 기록

| 항목 | 상태 | 범위/시간 |
|---|---|---|
| 콘텐츠 생성 동등성 | PASS | 86종/동일 hash |
| 배포 bundle 로컬 smoke | PASS | 학생4,3초,300 snapshots; 교사/학생 실제 브라우저 입장 별도 확인 |
| 메모리 참조 진단 | PASS | 20학생,같은 방5회,별도 방 create/close,강제GC. 총시간 NOT_RECORDED |
| RTT80/150·순서 보존 지터 | PASS | 실제 WS 프록시,10.19초. 재조작·중복·이전 epoch 포함 |
| 장판/기절/반사 중첩 | PASS | 22학생,16.06초. 초기 실패 이력 별도 보존 |
| 최종 Quick/Targeted/브라우저 CI | NOT_RUN | 최종 커밋 이후 결과로 갱신 |
| 20인 A/B·각600초·5회 재경기 | NOT_RUN | 준비된 선택 비교 workflow에서 실행 |
| 실제 Android/iPhone/학교 Wi-Fi | NOT_RUN | 현재 접근 가능한 실기기 없음 |
| 운영 배포/운영 부하 | NOT_RUN | 승인 범위 밖 |

메모리 강제GC 진단은 정상 타이밍 시험과 분리했다. 매 재경기 이전 world/game/20 actor WeakRef가 해제됐다. 로비1→5 heapUsed 15.63→15.03MiB, 방 종료·유휴 후14.38MiB였다. RSS는137.85MiB에 남았다. 이 결과는 이전 경기 객체 회수가 가능하다는 증거이며, 장시간 메모리 안정성이나 무기한 누수 부재를 뜻하지 않는다. [원자료](../evidence/v35-2/memory-lifetime-windows.json)

초기 시험 준비 오류도 보존한다. `--input-type=module -e`의 옵션이 fork에 전달된 bundle smoke는 INFRA_FAILURE였으며 동일 내용을 `.mjs`로 실행해 통과했다. 지연 프록시/집중 교전의 fixture 초기 실패는 [기록](../evidence/v35-2/regression-windows.json)에 포함한다. 통과한 실행으로 이전 실패를 지우지 않는다.

## 재현 명령

```sh
node tools/ci/plan.mjs origin/main
node tools/ci/quick.mjs
node tools/build.mjs
node tools/ci/targeted.mjs
node tests/combat/memory-lifetime.mjs
node tests/combat/longrun-compare.mjs solo canvas
node tests/combat/longrun-compare.mjs team-capture pixi
node tests/combat/longrun-compare.mjs load30 sockets
node tests/combat/longrun-compare.mjs rematch canvas
node tests/combat/longrun-compare.mjs render-cost pixi
```

마지막 명령들은 준비된 재현 경로이며, 위 실행 표에 PASS가 기록되기 전에는 실행 완료를 의미하지 않는다. 전체86종/모든품질 전수 검사는 NOT_RUN이다.

## 실기기 후속 체크리스트

버전·기종·브라우저·Wi-Fi 기록 → 한 경기(교사+학생) → 포탈/반사/평타·스킬 → 재접속 후 이동·평타·스킬 → 같은 방 재경기 → 끊김 발생 시각 기록. 현재 결과는 NOT_RUN이다.
