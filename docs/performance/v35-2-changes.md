# v35.2 변경 근거와 복구

## 렌더 경로

v35.1의 호스트 몸체 원 분할 최적화를 보존하며, 호스트 점령 거점 원에도 표시 픽셀 크기를 적용한다. 학생 경계는 원래 world-detail 도형을 그대로 사용한다. 위치·반경·선 두께·색·alpha·레이어 순서를 유지한다. Canvas는 기존 경로를 사용한다. Graphics 변환은 각 도형 뒤 복원하며 다음 도형의 경고/공격 좌표가 바뀌지 않는 회귀 검사를 추가했다. 일반 전투 painter 전체에 적용한 시제품은 집중 장면에서 픽셀 동등성 기준을 실패해 폐기했다(평균 채널 차이0.733/255,4,728/540,160픽셀의 채널 차이>16). 판정 기준을 완화하지 않았다. 거점 전용 수정만 남긴 집중 장면은20.605초에 통과했다. 첫 배포 bundle A/B에서 학생의 픽셀 차이1.207/255·4,784픽셀이 기준을 넘었다. 범위를 호스트로 좁혀 학생 원은 원래 path와 완전히 같도록 복구했고, 실 Pixi path 동등성 단위 검사와 별도 학생 화면0픽셀 차이를 확인했다. 최초 CI 실패를 보존하고 해당 렌더/점령전만 새 커밋으로 재검사해 통과했다. 고정 집중 장면 호스트 draw 간격의 구간 p95 중앙값은 191.1→146.1ms였으나, 연속 교전과 학생 성능에는 미해결 위험이 있다. 정확한 창과 샘플 수는 기준 보고서와 JSON에 기록했다.

개별 원복 대상은 `apps/client/src/render/capture-scene.js`, `capture-circle.js`의 이번 diff다. 기존 v35.1 `host-actors.js`, 보간 시계와 확정 피격 보완을 되돌리지 않는다.

## 메모리와 통신

현재 확인한 소유자는 `RoomManager.rooms → room.members → ledger/events`, 현재 world의 공간 cell/capture 기록, peer profile/queue다. 명령 이력512개/member, 신뢰 이력2048개 또는1MiB/member와10초 정책이 이미 있다. 강제GC 별도 진단에서 지난 경기 world/game/actor가 회수되어, 추측성 서버 캐시·풀링·큐 재설계는 적용하지 않았다. 장시간 증가의 확정 원인은 아직 없다.

`tools/load/telemetry.mjs`는 시험에서만 import되며, 5초 창별 소유 개수·메모리·유형/peer별 payload 크기·읽을 수 있는 OS 메모리 지표를 집계한다. size ring은128개/type, stalled context는 기존 상한을 유지한다. `LOAD_DIAGNOSTICS=0` 대조는 private timing/send/GC observer를 제거한다. `server.mjs`의 WeakRef/강제GC 진단은 명시적인 시험 환경변수와 비공개 IPC에서만 실행된다. 운영 게임 경로나 공개 진단 API에는 추가하지 않았다.

기존 `smooth-server.mjs`의 두 버전/3회 교차 비교는 prepare·private/filter·encode를 분리하고 전체 payload SHA-256까지 비교한다. 실행 결과 전체 payload가 일치했다. 서버 CPU 개선이나 메모리 누수 해결을 이 패치의 성과로 주장하지 않는다.

## 회귀 및 버전

기존 Quick/Targeted의 assertions는 보존한다. 추가한 실제 순서 보존 WS 프록시에서 명목 RTT 80/150ms와 가변 application-level 지연을 주입하고 실제 관측 RTT·입력·발사·복귀·중복 억제를 검사한다. 20개 spotlight/유도 반사와 중첩 장판 fixture를 보강했다. 브라우저에서는 세 화면의 실제 draw/rAF·같은 방1/3/5회 자원을 비교한다. 단일 화면 조건도 세 브라우저의 연결·입력·파싱은 유지하므로 물리 머신 경합을 배제한 시험은 아니다.

루트 `35.2.0`을 workspace/lock과 동기화하고 페이지가 `v35.2`를 표시한다. 의존성 버전과 콘텐츠 수치는 같으며 SHA buildId 검증을 보존한다. 버전 변경만 원복할 때는 package 메타데이터와 Vite 표시 식을 함께 되돌린다.

## 남은 판정

현재 자료의 범위·실패·미실행은 [기준 보고서](v35-2-baseline.md)에 기록한다. main 병합과 후보 생성은 사용자 병합 후 단계다. PR CI가 성공해도 병합 후 main CI/정확한 SHA의 candidate job 및 비만료 release artifact를 확인하기 전에는 새 release_id/candidate_run_id가 있다고 보고하지 않는다. 정식 배포는 별도 사용자 승인과 기존 ReleaseOps 쌍 검증/복구 절차가 필요하다.


## 최종 결과

실제 런타임 변경은 호스트 점령 거점의 도형 분할뿐이다. 경계의 월드 반경·색·선 두께·판정은 같고, 학생 도형은 원본 path와 같다. 고정 장면의 호스트 draw간격 구간p95 중앙값이23.5% 줄었으나, 연속 플레이의 모든 조건 개선은 확인하지 못했다.

30인600초 A/B와수정본1200초를 모두 완료했고,20인같은방5회·4명동시재접속·지연/느린수신자·Canvas/Pixi 필수회귀를 통과했다.20분에서도10분이후 JSheap은안정적이었지만 RSS귀속이미확정이라MEMORY_UNRESOLVED다. 같은PC의소프트웨어GPU 학생reload뒤5.183초정지도남아있다. 서버수정/주기재시작/강제GC/이력축소를근거없이적용하지않았다.

FUNCTIONAL은범위내PASS, PERFORMANCE는UNRESOLVED,실기기는NOT_RUN,정식배포는NOT_DEPLOYED다. 기존 게임 수치/통신/최신v35.1보간·복구는보존한다. 실제실행·실패·시간·원자료와각SHA는[비교보고서](v35-2-baseline.md)에있으며,보고서커밋의마지막CI는PR #23에서확인한다.
