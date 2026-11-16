# v35.2 Long-Run Stability & Smooth Rendering

## 기준과 경계

2026-11-16 확인한 main/주 비교 기준은 `d6b4525bf22bfa000a09eb686dffc5736bc5a3b3`(PR22 병합 v35.1)이다. 시작 작업본 `d8b7f6ffe926ea2c7f7eb3758e0de7ecbd1171d7`의 수정은 모두 이 main에 포함됐다. 작업 브랜치는 `codex/v35-2-longrun-smooth-rendering`이다. 공개 AWS `/version`과 공식 Pages `version.json` 읽기 결과 운영 client/server buildId도 모두 `d6b4525bf22bfa000a09eb686dffc5736bc5a3b3`였다. Pages sourceHash는 `50ecece7d5ee13bbe25daa79ea2658d1bddcaf205fa15749753f45989474b08b`였다. 운영 서버의 부하·덤프·SSH 설정·재시작·배포는 수행하지 않았다.

86종 `emoji86-v35`, contentHash `8f4cf38107b74bfd8c37e32f80016c48d8265bc5b883cdf4914b08d427f77bdb`가 유지된다. 콘텐츠 생성기 `--check`가 통과했다. 루트/workspace package 및 lock 메타데이터는 `35.2.0`, 화면 표시는 단일 루트 버전에서 `v35.2`를 읽는다. 의존성·프로토콜·전투 엔진·60Hz/20Hz·SHA 쌍 검증은 변경하지 않는다.

## 환경과 측정 정의

- 로컬: Windows, Node 24.22.1, Edge, 동일 PC의 서버/부하 생성기/브라우저. 소프트웨어 GPU 결과를 학교 태블릿 결과로 환산하지 않는다.
- 격리 CI: Ubuntu24.04, Node `.nvmrc`, Playwright1.56.1 컨테이너. 각 A/B는 같은 runner에서 고정 SHA를 별도 export해 실행한다. Node/dependencies/시험 스크립트가 같고 일부 짧은 케이스는 버전 실행 순서를 바꾼다.
- `tools/build.mjs`의 실제 서버 bundle과 Vite production build를 사용한다. 브라우저 계측은 시험 전용 Vite plugin이 기존 모듈 인스턴스 참조를 노출한다. 이 observer는 정식 빌드에 포함되지 않는다. 기존 기능 fixture 중 개발 실행은 별도 표시한다.
- T3: 30학생+교사 실제 소켓, 브라우저 0개, 각 버전 실제 600초. 기존 부하 도구의 공개 CONFIGURE 300초 설정을 양쪽에 동일하게 사용해 자연 Results→Rematch한다. 타이머를 강제 진행하거나 코드의 HP/시간/탄수/쿨타임을 바꾸지 않는다. 합성 draft/XP20/실제 증강 선택, 고정 match/성장 RNG와 30Hz 입력·공격 정책을 양쪽에 동일 적용한다. 연결 종료 후30초 유휴를 별도로 관측한다.
- 기본 서버 percentiles는 최근4,096개다. 새 telemetry는 각 창의 시작/끝/샘플 수를 기록한다. 창별 p95 평균을 전체 p95로 쓰지 않는다. RSS·heapTotal·heapUsed·external·arrayBuffers는 중복 포함 관계이므로 더하지 않는다.
- 전송량은 `ws.send`에서 한 번 센 UTF-8 JSON payload. 프레임/TCP/TLS를 제외한다. 호스트/학생별·유형별 bytes/s와 소켓 누적 bytesWritten을 구분한다.
- 렌더 측정은 rAF와 실제 draw 시작 간격, CPU prepare/submit을 분리한다. GPU 완료/실제 디스플레이 표시가 아니다. 픽셀 readback/스크린샷은 타이밍 구간 밖이다.

## 실행 기록

| 항목 | 상태 | 범위/시간 |
|---|---|---|
| 콘텐츠 생성 동등성 | PASS | 86종/동일 hash |
| 배포 bundle 로컬 smoke | PASS | 학생4,3초,300 snapshots; 교사/학생 실제 브라우저 입장 별도 확인 |
| 메모리 참조 진단 | PASS | 20학생,같은 방5회,별도 방 create/close,강제GC. 총시간 NOT_RECORDED |
| RTT80/150·순서 보존 지터 | PASS | 실제 WS 프록시의 application-level 지연 주입,10.19초. 재조작·중복·이전 epoch 포함 |
| 장판/기절/반사 중첩 | PASS | 22학생,16.06초. 초기 실패 이력 별도 보존 |
| 로컬 Quick | PASS | 333 공통 +7 ReleaseOps,238.617초 |
| 로컬 필수 client/server build | PASS | 첫 빌드8.05초; 학생 경계 수정 후 최종 runtime SHA 빌드4.633초 |
| 런타임 최종 CI | PASS | 43834713956, 13개 성공 / 범위 밖 2개 생략, Quick 333+7 / Python 31 / 빌드 2.96초 |
| Targeted | PASS | 238.051초: 3모드 E2E·대표 Canvas/Pixi·자원·26명 WS 30초 |
| 20인 A/B | PASS(기능) | 개인전/점령전 Canvas/Pixi, 각 3라운드; 성능은 아래 별도 |
| 20인 같은 방5회 재경기 | PASS | 55.627→54.838초; 매회 20명 연결, 세 화면의 이전 경기 자원 0 |
| 각 600초 30WS A/B | PASS | 43833594114; 두 버전 PASS. 아래 장시간 표 참조 |
| 20연결 최후반 보완 | FAIL / NOT_COMPLETED | 두 버전 Canvas/Pixi 총98.463초; 초기20인 overload1씩,6→5→3 미도달 |
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

## 실행 SHA와 재검사 경계

첫 비교43833594114의 PR head는 `d8f2141295173d56c8f8dfd65c363b3699b7b8a9`, 실제 checkout/buildId는 GitHub PR merge `a83540a8007fde85800a02a1b5ac85a886f9e7ca`다. 학생 경계의 픽셀 실패 뒤 최종 런타임 `7b723ae2a31e9eb5687dc9bdbe6cea2af0ec959d`으로 범위를 호스트에 한정했다. 첫 결과를 최종 학생 경계의 성공으로 대체하지 않는다.

최종 필수 CI43834713956은 PR merge `1b0bb58…`를 검사했다. 최종 수동 선택 비교43834740873(고정 장면)·43834755503(점령전Pixi)은 실제 branch HEAD `7b723ae2a31e9eb5687dc9bdbe6cea2af0ec959d`를 빌드했다. 서버/엔진은 두 런타임 사이에도 동일하여 600초는 다시 실행하지 않았다. 이후 보고서 커밋은 별도 최종 CI 링크로 구분한다.

이전43833594121은9개 작업 성공 / 3개 취소 / 범위 밖 2개 생략이며 집계는 취소된 의존성 때문에 FAIL이었다. 수정 push의 concurrency 취소로, 완료되지 않은 검사를 PASS로 세지 않는다. 첫 비교의 학생 픽셀 FAIL과 새 커밋 PASS를 모두 보존한다. [CI 원자료](../evidence/v35-2/ci-linux.json)

## 화면 성능: 고정 장면과 연속 조작 구분

Linux 4CPU / 약 16GiB, 소프트웨어 GPU, balanced / DPR1 / 844×640. 고정 집중 장면은 20인 실제 권위 데이터의 거점·반사·스포트라이트·독/투사체를 사용하며 한 화면만 그린다. 타이밍은 3×36 paint, readback은 구간 밖이다.

| 최종 고정 호스트 장면 | v35.1 | v35.2 |
|---|---:|---:|
| 동적 도형 indices | 49,404 | 45,876 |
| GPU buffer upload/paint | 1,268,820B | 1,198,260B |
| 3구간 draw간격 p95 | 215.8/191.1/152.7ms | 146.1/154.2/146.1ms |
| CPU submit p95 | 6.4/5.0/5.1ms | 4.3/4.7/5.4ms |
| CPU prepare p95 | 2.6/1.4/1.3ms | 3.0/3.5/3.1ms |

구간 p95 중앙값 191.1→146.1ms(−23.5%)는 **한 고정 장면**의 결과다. 전체 분포 p95·실물 기기 FPS·지속 교전 개선으로 확장하지 않는다. 거점 원 자체는 4,764→1,236 indices(−74.1%)지만 현재 장면의 나머지 경고/투사체 비용은 남는다. 준비시간 중앙값은 1.4→3.1ms로 검토선을 넘으며, 최종 submit과 전체 draw 간격과 함께 기록한다. 학생은 101,526→101,526 indices, 원래 경계와 픽셀 차이 0이다. 학생 draw 간격 p95는 436.1/441.7/437.6→434.8/445.0/442.4ms로 명확한 개선이 없다.

최종 연속 점령전 Pixi는 두 버전 3라운드 모두 기능 PASS / 과부하 0이다. 호스트 구간 p95는 483.3/333.3/300→433.2/333.3/300ms. 전체 서버 CPU 8010.56→6683.34ms, 실제 step 3690→3195, CPU/step 2.171→2.092ms다. CPU/step은 준비·IPC 등을 포함한 프로세스 CPU를 나눈 값이며 단계 CPU가 아니다. 최고 RSS 182.05→202.88MiB는 +20.83MiB / +11.4%로 검토선을 넘는다.

**미해결 긴 정지:** 수정본 학생 A의 3라운드 새로고침 후 11 draw / 10 gap 중 5,183.1ms gap과 1,366.1ms CPU draw가 있었다. 기준은 13 draw / 12 gap, p95 gap 283.4ms, CPU draw 최대 13ms였다. 전체 구간 중앙값으로 이 표본을 숨기지 않는다. 계측은 reload 반환 후 시작됐고 브라우저 navigation clock의 기준 창 12324→15924.7ms와 수정 창 1444→9675.3ms가 달라 총 재접속 지연의 동등 조건 측정이 아니다. 실제 긴 정지는 관측됐으나 서버와 3개 소프트웨어 GPU 화면의 경합·초기화·코드 영향은 분리되지 않았다. 원인은 UNRESOLVED다.

첫 비교의 개인전 Pixi에서도 학생 A 구간 p95 중앙값 300→383.3ms, CPU/step 2.041→2.566ms가 악화됐다. 이 경로의 학생/서버 런타임은 변경되지 않았지만 결과를 삭제하지 않는다. 단일 호스트 266.6→233.3ms, 단일 학생 233.3→200.1ms도 같은 물리 러너의 경합을 완전히 제거한 수치가 아니다. Canvas 개인전/점령전은 대표 p95 약 16.7~16.8ms였고 전체 기기 Canvas 강제 전환은 하지 않았다.

[전후원자료/첫실패/최종결과](../evidence/v35-2/render-linux.json) · [기준화면](../evidence/v35-2/render-v351-host.png) · [수정화면](../evidence/v35-2/render-v352-host.png)

## 서버 의미 동등성

30인 고정 시뮬레이션의 3회 교차 시험은 전체 payload SHA-256과 바이트가 일치했다. 개인전 188,253,770B, 점령전 205,751,608B다. CPU 중앙값은 개인전 817.918→844.468ms, 점령전 1117.002→1156.063ms였다. 서버 코드 최적화나 전송량 감소를 이 패치의 효과로 주장하지 않는다. 단계별 teacher/prepare/private/filter/encode는[원자료](../evidence/v35-2/server-linux.json)에있다.


## 30인 실제 WS 600초 메모리 A/B

두 버전은 실제 600.027 / 600.031초, 각각 2경기와 자연 재경기 1회를 완료했다. 오류·과부하 0회, 모든 5초 표본의 송신 buffer/queue/pendingSnapshot/replacedSnapshot 0, 최종 앱 종료 후 방/토큰/피어 0이었다. 소켓 종료 후 30초 유휴에서는 정상적인 재접속 유예 때문에 방/현재 월드/이력을 보유한다. 이 구간을 방 종료 누수로 세지 않는다. 별도 강제GC 진단의 CLOSE_ROOM/재생성 정리와 구분한다.

아래는 **2~3분→9~10분 구간 중앙값**, 단위 MiB다. 초기60초는 워밍업으로 별도 원자료에 남겼다.

| 메모리 | v35.1 | v35.2 서버 런타임 |
|---|---:|---:|
| RSS | 254.09→280.27 | 224.36→289.27 |
| heapUsed | 50.24→58.30 | 51.32→59.35 |
| heapTotal | 174.93→186.93 | 176.93→185.18 |
| external | 12.04→12.92 | 12.42→13.27 |
| arrayBuffers | 5.45→6.34 | 5.83→6.68 |
| 600초 구간 최고 RSS (유휴 제외) | 287.65 | 292.75 |

신뢰 재생 이력의 UTF-8 JSON 길이는 8.05→12.90MB / 8.06→12.47MB였다. 이 값은 V8 retained heap 크기가 아니며, 공유 문자열·인코딩 차이 때문에 두 배로 환산할 수도 없다. 명령 이력의 관측 최대치는15,365개이며 기존 상한은512개/member다. profile 상태는30개, 후반 spatial cell은약367개였다. 600초의 rework entity 표본 최대치는 기준23개/수정18개였다. 이는 native projectiles를 포함한 전체 공격 객체 수가 아니다. 확인한 소유자들은 유한하지만 RSS 증가 전체의 소유자는 입증하지 못했다.

수정본 마지막1분 RSS는288.31~289.55MiB였지만, 2~3분 대비64.91MiB 상승과 더 긴 시간의 안정화가 미확정이므로 명세4.4를 적용했다. **수정본만 1200초로 연장**한 실행43837308258도 완료했다. baseline600초나 나머지 매트릭스는 반복하지 않았다. 아래 결과에 따라 MEMORY_UNRESOLVED로 종료한다.

완전한 클라이언트 수신 합계는10,781,050,858→10,566,605,085B,스냅샷368,838→368,807개다. 학생 한 명의 수신량이나 AWS 청구량이 아니다. 캡처된 sender 창은601.150/601.192초로 초기준비를 포함하고 별도의 Rematch-status 창을 제외한다. 이 창의 호스트 payload는1.950→1.931MiB/s,학생 평균0.502→0.491MiB/s,최대0.693→0.684MiB/s였다. whole-run 수신합계와 정의가 다르다.

최근4096개 입력 적용 p95/p99는19.329/20.928→16.232/17.975ms,client-send→권위snapshot 확인은51.165/53.828→40.021/44.331ms다. 후자는20Hz 전달 간격을 포함하며 실제 화면표시 지연이 아니다. 마지막약3.9초 창의step p95는1.102→1.386ms,snapshot2.763→2.874ms,send0.462→0.444ms이며 이를600초 전체분포로 부르지 않는다.

진단 ON/OFF20초 각1회씩 순서를 바꾼 대조도PASS다. v35.1 OFF/ON CPU6330.940/6235.079ms,v35.2 5952.411/5973.753ms로 추가CPU는 변동과 분리되지 않았다. ON의 RSS 표본 최고치는 각각+4.62/+4.22MiB였다. 관측한 cgroup memory.events의oom/oom_kill은0,PSI some/full avg10/60/300은0.00이었다. 컨테이너 최고메모리1.61/1.79GB에는부하생성기·빌드·파일캐시가포함된다. 서버RSS와다르며1GB AWS 운영조건의통과증거가아니다.

[600초 창별 원자료·유형/peer별 전송·진단 ON/OFF](../evidence/v35-2/long-linux.json). 무한 누수 부재, 실기기30fps, 학교30명 무정지는 확인하지 않았다.


계측 한계도 보존한다. 완료된 장시간 산출물은 정상적인 LIFE/SCOPE/BATTLE 전환 거절의 합계 `expectedStale`를 내보내지 않아 해당 수치는 NOT_RECORDED다. 이를0으로 쓰지 않는다. 최종 요약기는 이후 실행에서 이 합계를 보존한다. 입력 누락/중복/오래된 epoch의 정확성 PASS는 별도 실제 RTT·4명 재접속·20인 조작 회귀의 범위이며, 장시간의 모든 입력 의도에 대한 개별 로그를 기록했다는 뜻이 아니다.

최종 코드 검토에서 자연 재경기 없는 장시간 실행이 PASS로 끝나지 않도록 `rounds>=2`와 재경기 정리 기록1개 이상을 비교 도구에 명시했다. 이미 실행한600초 원자료도 두 조건을 충족함을 별도로 확인했다. 선택 Canvas 집중 검사의 산출물 경로는 선택 renderer를 따르도록 보완했으며, 실제 실행한 Pixi 결과는 달라지지 않는다.


## 조건부 20분 연장 결과와 종료 판정

실행43837308258, 실제 build/source `7b723ae2a31e9eb5687dc9bdbe6cea2af0ec959d`. 실제1200.003초,30학생+교사 소켓,브라우저0개,4경기·자연 재경기3회를 완료했다. 오류/과부하0,최종 정리 후방/토큰/피어0이었다. 테스트를 좋은 수치가 나올 때까지 반복하지 않았다. 최고 RSS는314.22MiB,heapUsed는113.20MiB였다. 실제 읽은243개 cgroup 표본의oom/oom_kill은0,PSI some/full avg10은0.00이었다. 이 값은 해당 격리 러너의 관측이며 운영1GB 인증이 아니다.

| 구간 중앙값(MiB) | 2~3분 | 9~10분 | 14~15분 | 19~20분 |
|---|---:|---:|---:|---:|
| RSS | 219.72 | 308.42 | 310.66 | 313.73 |
| heapUsed | 47.02 | 55.15 | 51.31 | 53.14 |
| heapTotal | 175.30 | 185.30 | 179.93 | 177.80 |
| external | 11.00 | 11.67 | 11.66 | 12.44 |

heapUsed 구간 중앙값은10분 이후 지속 증가하지 않았다. 강제GC 없는 표본이므로 retained/live heap 측정과는 다르다. RSS는 같은 구간5.31MiB 더 높았으며, 이 값의 native/allocator 보유 소유자를 확정하지 못했다. 짧은 별도 GC 진단에서 이전 월드/참가자 회수가 가능하다는 증거와 합쳐도 무기한 누수 부재나1GB 운영 여유를 입증하지는 않는다. **MEMORY_UNRESOLVED**이며 명세4.4의 종료 조건에 따라 이 이후 장시간 시험을 더 실행하지 않았다. [20분 창별 원자료](../evidence/v35-2/long-extended-linux.json)

```text
FUNCTIONAL: PARTIAL (필수 CI·기존 회귀 PASS, 추가 20연결 최후반 시험 FAIL/미완료)
PERFORMANCE: UNRESOLVED (호스트 고정 장면 개선, 장시간 RSS 귀속·연속 화면 긴 정지 미확정)
DEVICE_VALIDATION: NOT_RUN
RELEASE: NOT_DEPLOYED
```

사용자 검토용 PR이며 전체 교실 렉 해결이나 정식 배포 준비 완료를 선언하지 않는다. 필요한 다음 조치는 반복적인 전수 부하가 아니라, 격리된 환경의 native allocation/retained-size 근거와 실제 학생 기기의 reload·draw 추적이다. 현재 운영에서 이를 무단 실행하지 않는다.

일반 `check-plan.json`의 Deep Audit/600s NOT_RUN은 일반 CI의 기본 선택 범위다. 이 문서의 별도 opt-in workflow 실행 번호가 실제600/1200초 수행 근거다. 사용자 병합 전이므로 v35.2 main CI와 새 Paired candidate의 release_id/candidate_run_id는 아직 없다. 과거 후보 번호를 대신 쓰지 않는다.

보고서 제출 SHA `942d098…`의 CI43841292911도13개 성공/범위 밖2개 생략으로 완료했다. Quick333+7(231.970초), Python31(0.061초), 빌드4.09초, Targeted 약401.7초가 통과했다. Targeted의26인30초 부하는16,200 snapshots/오류0이었다. E2E 도중 Vite `ECONNRESET` 로그2줄이 있었으며, 해당 모드와 전체 실행은 성공했다. 이 로그를 삭제하거나 전체 통신 로그가 무오류였다고 보고하지 않는다. 이후 최후반20인 보완 시험과 문서 범위 정정은 별도 제출 커밋이며 마지막 CI는 PR의 해당 SHA에서 확인한다.

## 최후반 20연결 보완 검사 — 실패 보존

기존 `live-late.mjs`의 기본6참가 검사는 유지하고, 명세5.1의20연결·15사망 관전 조건을 위한 선택 분기를 추가했다. 같은 Windows PC에서 두 버전의 배포 bundle을 고정해 Canvas/Pixi 각1회씩 실행했다. 20→6→5→3 생존자 전환, 사망한 실제 학생 화면의 권위 수신·draw,20연결 유지와 Results를 검사하도록 설계했다. 죽음은 fixture이며 자연 처치 시험이 아니다. 서버와 시험 드라이버는 같은 Node 프로세스, 두 브라우저도 같은 PC를 사용한다.

첫 시도는 Windows `--import` 경로 처리 오류로 브라우저 시작 전 INFRA_FAILURE였다. 경로 의존성을 제거하고 성공한 같은 빌드를 재사용한 실제4개 실행은 모두 초기20인 구간에서 과부하1회가 기록됐다. Canvas는 과부하0 assertion, Pixi는 새 권위 tick 수신 assertion에서 FAIL했다. **6→5→3 및 Results는 NOT_COMPLETED**다. 이것을 원래6참가 CI의 성공이나30WS 장시간 성공으로 대신하지 않는다. 두 버전 모두 실패했고 solo 런타임은 동일하므로 v35.2 회귀나 서버 단독 병목으로 확정하지 않는다. 성공할 때까지 반복하거나 보호 기준·assertion을 완화하지 않았다.

전체 기능 판정은 이 미완료 범위를 반영해 PARTIAL이다. 필수 CI와 앞선 재경기·조작·집중 교전의 PASS는 각각 유지하며, 전체 장시간·최후반 안정화 완료를 선언하지 않는다.

실행 시간은 v35.1 Canvas22.087초/Pixi27.161초, v35.2 Canvas21.891초/Pixi27.287초, 실제4개 비교 전체98.463초다(성공한 기존 쌍 빌드 재사용 시간 제외). 최후반 개선 수치로 해석할 수 없다. [실제 실패 원자료](../evidence/v35-2/late20-windows.json) · [실행 전 인프라 실패](../evidence/v35-2/late20-infra-attempt1.json).

```powershell
$env:PLAYWRIGHT_CHANNEL='msedge'
$env:LATE_SOFTWARE_GPU='1'
node tests/combat/late20-compare.mjs
```
