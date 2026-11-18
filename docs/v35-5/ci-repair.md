# PR26 실패 CI 집중 보완 — 2026-11-18

대상 HEAD `89a721bf93fc36a1a196b888c27954bb62251182`, 정확한 기준 main `a9167266146646f2717b055aceb7b3fad833ae99`. v35.5 게임 소스와 기존 v35.4 수치·3.5초 승자 연출·과부하/연결 보호는 변경하지 않는다. 과거 실패는 [원래 보고서](report.md) 및 PR 본문에 보존한다.

## 1. 정확한 base 아티팩트

- 원인 확인: main CI `44064002326`의 Canvas WebKit Target crashed 및 격리 warning fixture의 Results UI 실패 때문에 `44066196876`의 candidate job이 **SKIPPED**였다. status job만 성공하면서 `ARTIFACT_READY`를 표시했다. 아티팩트 만료나 SHA 검색 오류가 아니었다.
- 통과한 main job은 재실행하지 않았다. 실패 두 job의 재실행에서 Canvas touch가 통과했다. 격리 검사는 apt 다운로드 약 7분 소요 후 기능 검사 자체는 PASS했지만 **기존 10분 job 제한에서 취소**됐다. 이 실행은 PASS로 계산하지 않는다.
- 다운로드 지연으로 취소된 격리 job만 다시 실행한 뒤 main `required-checks`까지 PASS. 정상 `workflow_run`이 정확한 a916726 후보 `44282808145`를 생성했다. artifact14417843912의 exact SHA/name/digest를 확인했고, PR CI44283797222의 isolated-release134733561547이 이 후보를 선택하여 PASS했다. warning fault-injection도 Results/Rematch/방 종료까지 PASS했으며 이는 실제 운영 WARNING이나 배포 결과가 아니다.
- workflow status를 최소 수정하여 candidate가 실패/생략됐을 때 `ARTIFACT_NOT_CREATED`와 실패 종료를 반환한다. 문서 전용 변경은 `NO_EXECUTABLE_CHANGE`; 실제 후보가 있을 때만 READY. 신뢰 검사·동일 SHA·아티팩트 검사는 유지한다.
- 저장소 설정 읽기 확인: `STAGING_ENABLED=false`, `RELEASE_VALIDATION_MODE=github-actions`. AWS 실행/Secrets 변경 없음.

## 2. 승리 화면과 30명 연결

테스트 전용으로 최대 400개 서버 transport 이벤트, 최대 200개 브라우저 수신 이벤트를 기록한다. 연결 번호·epoch·종료 코드/사유·큐/버퍼·서버 송신 시각·브라우저 wall/monotonic 시각·실제 visibility·renderer.reset 시간을 분리한다. 토큰·이름·전체 패킷 본문은 수집하지 않는다.

`9302121`의 Linux 진단 결과:

| 검사 | 결과 | 범위/한계 |
|---|---|---|
| v35.4 Pixi balanced 20명 5회 | PASS 152.902s | 원래 3,500ms 구간, 정상 결과 수신의 wall/offset 지연 일치. 2~5경기 수신→accept 약 1~3ms; 송신→수신 0.43~1.16s |
| v35.5 Pixi high 30명 | PASS 74.699s | 30/30, 과부하 0, 경기·결과·재경기; 의도된 bot→브라우저 SUPERSEDED 외 종료 없음, 브라우저 close 0 |
| Canvas/Pixi 개별 표현 | PASS / Pixi 89.326s | 헤드슈터 전용음 제외. 일부 화면 잔상 draw 0이 기록되어 아래의 수동 fixture 관측을 추가 보완; 이것을 해당 잔상 표시 PASS로 간주하지 않음 |
| Windows 같은 PC Pixi20 진단 | FAIL 74.852s | 과부하 1 / SAFE_PAUSED 후 버튼 disabled timeout. 승리 화면까지 도달하지 못함 |

과거 승리 화면의 8.8초 지연 및 29/30 당시 실제 종료 사유는 기존 artifact만으로 확정하지 못했다. 최신 진단 실행에서 재현되지 않았다는 사실만으로 게임 버그가 해결됐다고 선언하지 않는다. 게임 clock offset 초기화·기간 연장·연결 완화는 하지 않았다.

확인한 시험 순서 결함을 수정했다: (1) fixture match 변경을 브라우저가 수신한 뒤 다음 명령을 보낸다. (2) 승리 visibility 대기를 종료 요청 전에 시작한다. (3) 짧은 승리 구간 내 재접속 검사를 PNG 촬영보다 먼저 수행한다. 실제 화면 visible·복원 잔여시간·Results·같은 방 재경기 assertion은 그대로다.

## 3. 헤드슈터 요구 제외와 남은 표시 검증

사용자 승인으로 `emoji-023` 전용 발사음 정확히 1회 요구만 제외했다. 기존 runtime 사운드는 변경하지 않는다. BB/슬리퍼 음향 검사와 Head 준비 중 SHOT 없음·실제 SHOT_SPAWN/SHOT_END·서버 명중은 유지한다.

개별 접촉 시험은 수동 authority clock을 사용한다. 이전 fixture는 55ms마다 다음 틱으로 진행하며 느린 software WebGL이 그리기 전에 150ms 잔상 구간을 지나칠 수 있었다. 매 발행 snapshot의 수신과 실제 draw를 확인한 뒤 다음 수동 틱으로 진행한다. 세 화면 모두 짧은 잔상이 그려졌는지 명시적으로 검사한다. 이는 시험 clock 수정이며 실시간 20/30인 시험의 시간·FPS·화질·입력·인원에는 영향이 없다.

## 최종 검증

로컬 Quick 전체 PASS292.958s(396/396 + ReleaseOps8/8), boundary/content/hash/86 parity PASS, paired build PASS21.70s(Vite). 강화된 Pixi high 3화면9장면 PASS45.131s, 세 저격 각각 모든 화면에서 잔상 draw12~29회, 서버 명중/SHOT_END 확인. 런타임 sourceHash `d9598796bd77eff37a9c64b83a8aefb2b470c10672fd66a820b4c20869ac9d92`로 이전89a721bf와 동일하다.

최종 SHA, 후보 artifact, 집중 CI와 required-checks 결과는 PR에 완료 후 기록한다. 기능 PASS와 원인 미확정/실기기 NOT_RUN을 구분한다.

[진단 원자료 요약](evidence/ci-repair.json). 운영 배포·main 병합·Pages·Firebase·Secrets·서버 설정 변경 없음.


## 104b471에서의 재발 — 과거 PASS로 덮지 않음

`44283797040 / 134731078303`: Pixi high30 **FAIL55.286s, 29/30**. 이번 기록에서는 서버 heartbeat가 호스트(connection1)와 학생(connection32)에 대해 `alive=false`로 `terminate()`했고, 둘 다1006으로 종료한 것이 확인됐다. 종료 시 queue=0/buffered=0, overload=0, paused=false. 직전 성장 구간의 draw p95는12~22ms이지만 rAF gap은400~450ms였다. 브라우저는 당시에도 예전 stream을 계속 읽었고, 종료된 host가 아직 새 ROOM_STATE/close를 관측하지 못했다. 서버 과부하 또는 송신 queue 초과4008이라는 추정은 이 실행에 맞지 않는다.

공유 Chromium 프로세스에서 세 화면이 software WebGL을 경쟁하는 시험 조건을 조사한다. 같은 runner에서 화면별 Chromium 프로세스로 분리한다. 같은30연결, 실제 세화면, 같은 입력/공격/모드/화질/해상도/FPS정책/8초 live 측정/서버 보호를 유지한다. 이 비교로 실제 교실 기기의 문제가 해결됐다고 주장하지 않는다. Windows 동일PC의 분리 실행은 **FAIL75.972s / SAFE_PAUSED1**로 측정 전 중단되었으며 숨기지 않는다. Linux 비교는 다음 CI에 기록한다.

후처리 WebSocket1006이 원래29/30 assertion을 로그에서 가리지 않게 정리 오류를 별도 기록한다. 후처리만 실패한 실행도 여전히 FAIL이다. 후보의 정확한 SHA/artifact 생성은 복구됐으며 artifact14417843912(digest438f2abb…)가 실제 존재한다.


## 분리 비교 후 확인 사항

`ab5456e / 44285752003`: 30명 연결·live 측정은 유지했지만 END 이후 host heartbeat1006으로 **FAIL49.462s**. SwiftShader가 실제 renderer였고, 화면별 프로세스로 나눠도 rAF p95417/367/317ms, host 수신tick798 대 학생1056/1143으로 지연이 쌓였다. 서버 snapshot 평균50ms, queue/buffer0, overload0. 따라서 공유 GPU 프로세스 하나만의 문제라는 가설은 확정하지 못했고 프로세스 분리 코드는 철회했다.

다음 비교는 운영 Pages 빌드가 사용하는 `VITE_PUBLIC_WSS_URL` 설정을 통해 브라우저를 격리 authority endpoint에 직접 연결한다. 기존 테스트는 production build를 쓰면서도 모든 WS를 Vite preview 프록시(같은 테스트 프로세스에서28가상 학생과 Playwright 제어 실행)에 통과시켰다. 정적 파일/관측 bridge는 유지하며 추가 WS 프록시만 제거한다. 정확한 buildId/Origin/인증 검증은 유지하고 fixture는 endpoint 일치도 확인한다. 추가적으로 ping 송신/마지막 inbound 시각을 bounded 진단에 기록한다. 이 변경 로컬3화면 Pixi high identity는 PASS47.279s, 30명 Linux 결과는 PR에 기록한다.


## 직접 WS 비교와 부활 퀴즈 수신 순서

`6a6982a / 44286998175`: Pixi high30 **PASS48.513s**,30/30 연결·live·Results·재경기30 유지,예상치 못한 close0,overload0. 서버 step p951.817ms/snapshot p956.772ms/평균 gap50.003ms. 그러나 SwiftShader rAF p95300~317ms와 오래된 snapshot 수신이 남는다. 직접 WS 연결만으로 실제 렉의 근본 원인이 해결됐다고 주장하지 않는다.

같은 실행의 Pixi20×5는 **FAIL184.002s**,3경기 점령전 부활 퀴즈에서 서버는 다음 문제를 제공했지만 학생은 이전 문제를 표시하고 있었다. 고정350ms 대기 후 서로 다른 문제의 정답 ID를 조회한 시험 오류다. 정확한 보기 수신 및 정답 수1→2→3 반영을 기다리도록 수정했다. 기존3문제·리롤·부활 후 이동/평타/스킬 검사는 보존한다. v35.4 동일 경로도 같은 수정. 354집중 CI44286998274는4/4 PASS였다.

동일 HEAD의 공통 CI44286998325는 **FAIL**: 정확한 a916726 후보/이미지/버전/Origin은 통과했으나 격리 재접속 이동에서 AUTHORITATIVE_STATE_TIMEOUT(41.089s), Canvas touch WebKit에서는 두 번째 화면비의 tap 중 Target crashed(INFRA_FAILURE)가 발생했다. 재접속 epoch2, 초기 INPUT_BATCH1회 이후 이동 전송 미관측,OOM=false. 원인 미확정이며 경고로 치환하거나 통과로 기록하지 않는다. 최종 CI에서 동일 검증을 그대로 유지한다.
