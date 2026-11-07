# Runtime performance fix — A/B/C

기준 main: `056f75e1d6e9d2d55b3477cd2d9789795f155853` (PR #8~#10 보존). PR #11은 병합된 것으로 가정하지 않았으며 필요한 계측 도구만 재사용했다. 최종 결과와 검증 증거는 아래에 기록한다. AWS·공식 Pages·Firebase 변경 및 main 병합은 수행하지 않는다.

## 구현 범위

- A: 개인 aimProfiles/visualProfiles만 신뢰 PROFILE_STATE + scoped revision으로 전송한다. 움직이는 20Hz snapshot은 revision 참조를 포함하며, 클라이언트는 서버 프로필을 복원한다. 최초/실제 값 변경/복구는 전체 프로필을 제공한다. 알 수 없는 revision은 입력을 보류하고 제한된 RESYNC로 복구한다.
- B: Pixi 바닥·격자·경계를 동적 Graphics에서 분리한다. 카메라 변환/셀 범위·맵·LOD 변경 시 갱신하며 기존 위험 표시·안개·벽·레이블 자원 처리를 유지한다. Canvas Path2D 실험은 시각 차이와 비용 무개선으로 제외하여 기존 Canvas 그리기를 보존했다.
- C: 권위 pause 상태에서 입력·공격 큐 및 미실행 명령을 중립화한다. 클라이언트 입력·반복·예측을 중지하며 재개/복구 완료 후 새 입력부터 동작한다. 기존 과부하 기준과 시뮬레이션 오류 정지 구분을 유지한다.

## 실행 기록

**A/B/C 코드 수정과 집중 검사는 완료했지만, 최종 장시간 시험은 FAIL이다. 현장 렉 해결 및 안정성 완료를 선언하지 않는다.** [전체 계측](evidence/runtime-performance/results.json), [그리기 계측·실패 이력](evidence/runtime-performance/floor.json).

| 검사 | 실제 결과 / 시간 |
|---|---|
| Quick | 232개(7+225) PASS, 도구17.357초 / 명령17.498초; 경계·87종 manifest PASS |
| client/server 배포 빌드 | PASS7.770초; buildId `v33-b37abee13184641a`, sourceHash `b37abee13184641abcbc5330c532f1fce5d08d6752ccf8f92f9e4e1eb28da7e6` |
| 프로필 집중 | unit4개0.254초 / 실제WS2개0.655초 / 기존 전송10개0.430초 PASS; 발견한 재시도 경로 보강 후 해당 검사0.145초 PASS |
| 배경 집중 | unit3개0.089초 / 번들 Renderer 비교48.430초 PASS; 15개 이미지 모든 픽셀 동일 |
| 정지 복구 | 실제WS7개1.632초 / Edge3화면7.786초 PASS |
| 배포 빌드75초×2 | 한 번씩 실행, 전체159.903초. 렌더 제외75.033초·브라우저 추가75.017초 실제 전투, 양쪽 과부하0 PASS |
| 최종605초 요청 | **FAIL1**, 실제 전투 학생429.017초/호스트429.133초에서 첫 과부하 후 즉시 중단. 도구437.855초/명령438.823초. 재시도0·자동CONTINUE0 |

프로필은 실제 TCP/WS의 동일240 snapshot+24 PRIVATE_STATE 상태를 비교했다. 모든 self264개 복원 값이 일치했다. 전체 송신=수신 **1,465,515→1,000,861B(-31.7%)**, 기존 수신기 JSON.parse 누적10.819→5.932ms, 반복 wall58.017→39.352ms였다. 최초/실제 변경/생명/강제복구 PROFILE_STATE5건을 포함한다. Quick에서 같은 회귀가 재실행된 값도 근거에 별도로 보존했으며 좋은 수치 선택을 위한 재시도는 하지 않았다.

정지300프레임에서 Pixi 바닥 재구성300→1, 격자1회. 학생 Pixi draw 평균5.068→4.286ms(p958.2→7.3), 호스트5.602→5.051ms(p959.4→8.0). 이동 호스트6.241→6.286ms는 **개선 없음**이다. 실제 draw 간격 p95는 약17ms이며 GPU 완료시간은 측정하지 않았다. 카메라·줌·뷰포트·6→5→3·점령전 경계와 reset 자원0을 검사했다. 준비 fixture 오류2회(INFRA_FAILURE7.533/9.385초)와 Canvas 실험FAIL17.822초를 보존했다. Canvas 변경 제외 후 픽셀 동일성을 확인했다.

배포용75초 비교는 PR #11의 정확한 main 기록을 재사용했다. 당시 렌더 제외75초PASS/브라우저 추가28.617초FAIL을 삭제하지 않았다. 후보와 입력 해시·요청 수·31개 실제 게임 연결은 동일하지만 실행 시점/초기 시뮬레이션 시각은 다르므로 교차 반복 실험이나 동일 엔진 상태 재생은 아니다. 양쪽이 진행 중인 첫20초를 별도로 제시한다:

| 첫20초 활성 구간 | main 전송/서버CPU | 후보 전송/서버CPU |
|---|---:|---:|
| 렌더 제외 |165,075,116B /8,562ms|153,532,916B /7,672ms|
| 브라우저 추가 |155,458,247B /8,922ms|166,049,367B /10,000ms|

따라서 전송/CPU가 실시간 모든 조건에서 감소했다고 주장하지 않는다. 정지한 baseline 전체와 완주한 후보 전체의 바이트를 비교해 절감률을 계산하지 않는다. 실제 신뢰 프로필 트래픽을 포함한 동일 상태 비교가 A의 절감 근거다. 짧은 배포 빌드와 마지막 장시간 시험 모두 같은 PC 조건이다.

605초 시험은 기존 `tabletLoad`의 실제 브라우저 autopilot/Vite fixture를 재사용했다(위 배포 빌드 시험과 구분). 60.029초에5명,360.165초에3명으로 전환했고,3명/broadcast 정책에서 과부하가 발생했다. 당시 파티클142,동적벽16,새 entity3,queue/buffer0. 마지막19.729초 구간 서버CPU4,891ms, step/snapshot/send 경과 max117.623/133.704/42.341ms, 이벤트루프max317.719ms. RSS는 첫표본111.3MB→마지막313.8MB였으며 메모리 누수라고 단정하지 않는다. 정지 직전 stall별 CPU/경과와 메모리·큐를 보존했다. 명확한 추가 코드 결함을 확인하지 못해 시험을 반복하지 않았다. 이번 긴 실행의 결과/재경기 단계는 **NOT_RUN**이며, 별도 정지 복구 집중 시험에서는 END/재경기를 PASS했다. 최종 room/token/peer는 모두0이었다.

복구 검사는 정지 직전 미실행 명령 취소·중복 요청·정지 입력 폭주·새로고침 RESUME·교사 CONTINUE·새 이동/평타/스킬의 실제 발동·공격자/상대/호스트 확인·CDP 조이스틱·사망/부활·END/재경기를 포함한다. 기존 장면 고정 fixture는 실제 safePaused와 구분해 전용 테스트 프로세스의 로컬 simulation controller를 사용한다. 공개 테스트 경로·판정 완화는 없다. 새 브라우저 검사는 기존 Canvas recovery CI에 한 번 연결했다. 최종 SHA의 필수 CI는 PR 본문에서 별도 확인한다.

## 실행 방법과 변경 파일

`node tools/ci/plan.mjs origin/main`, `node tools/ci/quick.mjs`, `node tools/build.mjs`; Windows Edge에서는 `$env:PLAYWRIGHT_CHANNEL='msedge'` 후 다음 명령을 사용한다.

- `node tools/load/initial-overload.mjs --seconds=75 --out=artifacts/runtime-performance/short`
- `node tests/combat/safe-pause.mjs`
- `node tests/combat/static-floor-browser.mjs`
- 최종1회: `node tools/load/tablet.mjs --players=30 --seconds=605 --mode=solo --roster=new --label=runtime-candidate --recoverOverload=false --stopOnOverload=true --out=artifacts/runtime-performance/long-605.json`

A의 중심은 서버 `ws/profile-state.js`, `peer.js`, `snapshot.js`와 클라이언트 `net/profile-cache.js`, `connection.js`; B는 `render/renderer.js`, `static-floor.js`; C는 서버 `rooms/pause.js`, `room.js`, `ws/handler.js`, `simulation/runner.js`와 클라이언트 `ui/app.js`, `presentation/timeline.js`다. 프로토콜 ENGINE_REVISION을 `v33-authority-2-profile-revisions`로 갱신하여 구 쌍을 거부한다. contentHash `fd780afb06e75dfb6dab229bc5fbc1a1ae5bfedf7cd6eff688dd41bdf3ce7e68`은 불변이다. 엔진·콘텐츠 수치·60Hz·20Hz·기존 과부하 기준은 유지했다.

## 판정 한계

같은 Windows PC에서 서버와 브라우저를 실행한다. 별도 물리 기기·Samsung Android·학교 Wi-Fi·운영 AWS는 NOT_RUN이다. 수정한 중복 작업과 정지 후 입력 처리의 검증은 현장 렉 전체의 해결을 의미하지 않는다. 87종/전체 화질 전수감사는 이번 범위가 아니다.
