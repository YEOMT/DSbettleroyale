# PR #9 성능 후속 검증 (2026-11-07)

기준 main `3c4d94d16d5eb0b5ff9bf655fcec94368ed091e0`, 브랜치 `codex/performance-followup-limited`. 신규 10종·밸런스·호스트 표시와 PR #8 통신 최적화를 보존한다. AWS·Pages·Firebase 배포나 main 병합은 하지 않는다.

## 확인과 최소 변경

- **확인:** 30명/5명 생존 스냅샷 600회 분리 측정에서 개인 상태 인코딩 347ms / 전체 656ms. 조준·공격 표시 프로필은 엔진에서 능력·반경·성장 revision 변경 때만 교체하지만 이전 송신기는 매 스냅샷 다시 인코딩했다. `apps/server/src/ws/snapshot.js`만 수정해 두 프로필의 UTF-8을 WeakMap으로 재사용한다. 필드·값·전송 바이트 수·20Hz·60Hz·과부하 기준을 유지한다. 게임/콘텐츠/화면 코드는 변경하지 않았다.
- **효과 범위:** 동일 상태의 기존·후보 인코더를 번갈아 측정한 30명/6·5·3 생존 비교에서 수신자당 인코딩 평균 0.03094→0.02159 / 0.02788→0.02005 / 0.06698→0.04880ms(약27~30% 감소). JSON 값·개인별 범위·바이트 수 일치를 단언했다. 이는 전체 렉 해결 증명이 아니다.
- **미확정:** 75초 기준 시험은 첫 경기 과부하1회, 재경기1회. 첫 정지 때 신규 객체는 독장판1개/장벽0개, 호스트 textBuilds0이며 송신 버퍼 적체가 없었다. CPU 프로파일의 writev/JSON 비용과 여러 함수의 긴 샘플 간격은 관측됐으나, 모든 순간 정지를 특정 함수·신규 캐릭터·PC 경합 탓으로 확정하지 않았다.
- **도구:** 기존 `tablet.mjs`에 준비 시간 제외 실제 전투 시간, CONTINUE 비사용 옵션, 결과 화면·재경기 객체 정리 단언을 추가했다. `telemetry.mjs`에 기존 send/pump/debt의 구간 값과 PC CPU/가용 RAM만 보강했다. 기존 `snapshot-bench.mjs`의 선택 비교를 재사용한다. 세 화면·공격 빈도·캐릭터·화질·수명·수량을 줄이지 않았다.

## 실행 기록

| 검사 | 상태 | 실제 시간 |
|---|---|---:|
| 기존 main 75초, 30연결/6→5→3 + 재경기 | FAIL, 과부하1+1 | 94.016초 |
| 후보 같은75초 + 결과/재경기 | PASS, 과부하0·객체 정리0 | 92.969초 |
| JSON/성장·죽음·새 world·개인 scope/실제 UTF-8 WS | PASS 3개 | 0.468초 |
| 후보605초 요청(1회) | **FAIL: 과부하1, 실제 전투16.917초**, 이후 계측 문맥 소실로 중단 | 342.502초 |
| Quick 공통 | PASS (215 + ReleaseOps7) | 15.783초 |
| 신규 포함26인 점령30초 | PASS, 과부하0·오류0·종료 참조0 | 31.685초 |
| 실제 Pixi 재접속→이동·평타·스킬/세 화면 | PASS | 27.861초 |
| 추가 장시간 / 전수 시각·화질 매트릭스 | NOT_RUN, 종료 조건 적용 | — |
| 필수 GitHub CI / 최종 쌍 빌드 | 최종 SHA의 PR Checks/본문에 기록 | — |

첫 단기 기준의 simulation 값은 준비를 포함한 절대값이므로 후보의 준비 제외 값과 동일 정의로 비교하지 않는다. 두 단기 실행은 CPU 프로파일을 사용했고, 장시간 실행은 녹화·CPU 프로파일 없이 직전605초와 같은 조건으로 실행한다. 시험 중 다른 부하검사는 병행하지 않는다. 장시간 실패 시 해당 구간만 조사하며 원인이 확인·수정된 경우에만 1회 추가한다. 원인 미확정 또는 추가 실패 시 차단 항목을 남기고 종료한다.

**최종 판정: 추가 수정 필요.** 605초 요청 실행은 전투 절대시간18.083초(준비 제외16.917초)에 과부하로 멈췄고 CONTINUE는0회다. 342.502초 시점 `Execution context was destroyed`로 계측까지 중단됐다(계측 INFRA_FAILURE 동반, 근본 원인 미확정). 5/3인 상태에서의 실제 지속 전투·600초 완주·해당 실행의 결과→재경기는 NOT_RUN/미충족이다. 과부하10→1을 개선으로 비교할 수 없다. 실패 구간에서는 send max332.30ms, pump max433.67ms, step max127.11ms, snapshot max135.00ms, event-loop max465.31ms, debt810.77ms가 함께 기록됐다. 새 객체3개/벽16조각, 버퍼·queue0, 구간GC max1.89ms, PC 가용RAM3.03GiB·전체CPU29.6%였으므로 객체 누적·GC·전송 적체·전체CPU 포화 어느 하나로 확정하지 않았다. 이후 정지 중에도 브라우저 끊김과 서버 이벤트루프 지연이 나타났으나 PC 경합을 단독 원인으로 입증하지 못했다. 명세대로 두 번째 장시간 시험을 시행하지 않고 미해결 차단 항목으로 종료한다.

단기 전후 snapshot p95/max13.05/254.96→8.55/42.08ms, send max648.74→21.80ms였으나 서버RSS peak230.04→266.80MiB로 증가했다. 후보 단기 준비 제외75.18~75.33초 전투·결과·재경기와 렌더/타임라인/새 객체 정리0은 통과했다. 장시간에서는 최종 서버 room/token/peer0 정리만 확인했으며 실제 재경기나 장시간 누수 부재를 주장하지 않는다. 메모리·객체·실제 프레임 구간은 [원시 실패를 포함한 수치 근거](evidence/performance-followup/results.json)에 있다.

기존 극한30인 점령전 FAIL, 실물 Samsung Android·학교 Wi-Fi·AWS 및 실제2vCPU/1GB Docker 제한 NOT_RUN을 유지한다. **20명 이상 현장 렉 해결 완료 또는 소규모 AWS 테스트 후보 승인으로 보고하지 않는다.** CI 성공도 이 장시간 실패를 덮지 않는다. 실행: `node tools/ci/plan.mjs origin/main`, `node tools/ci/quick.mjs`, `node tools/load/tablet.mjs --players=30 --seconds=605 --roster=new --recoverOverload=false`, `node tools/load/run.mjs --players=26 --seconds=30 --roster=new`, `node tests/combat/session.mjs pixi` (`PLAYWRIGHT_CHANNEL=msedge`).
