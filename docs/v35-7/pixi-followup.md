# PR28 Pixi 집중 실패 수정

요청 기준 `e4354d734503de49f9d3b6601733672055a660b5`. 정확한 A/B 기준은 v35.6 `9b2d45ff13d4ee0890179103ef66e6edb1bf174c`이며 기준 게임 소스에 수정본을 섞지 않는다. 진단 HEAD `388f9739ba51e985c84ec97a50b0ce2937e45bda`, 실행 [44518862169](https://github.com/YEOMT/DSbettleroyale/actions/runs/44518862169). 원래 실패는 아래 수정으로 소급해서 PASS로 바꾸지 않는다.

## 20인: 실제 기절을 발사 성공으로 기대한 시험 순서 오류

버튼 DOM → Controls.fire → ACTION 생성/실제 WebSocket 송신 → 서버 수신/COMMAND_RESULT → 엔진 resolved/fired → 권위 상태를 계측했다. 네트워크 수락은 실제 발사 완료와 다르다.

| 기록 | v35.6 기준 | v35.7 후보 |
|---|---|---|
| 실패 | 5경기째 두 번째 학생 attack0/skill0 | 1경기째 두 번째 학생 attack0/skill1 |
| 평타 wire send → 서버 수신 | 1795089463307→3310 (3ms) | 1795089494688→4690 (2ms) |
| 엔진 판정 시각 | 1795089463318 | 1795089494702 |
| 실제 기절 잔여 | 11프레임 | 79프레임 |
| engine received/resolved/fired | 1/1/0 | 1/1/0 |
| 클릭 때 학생 snapshot tick / 실제 판정 tick | 490 / 691 | 584 / 718 |
| 스킬 | 화면에서도 STUNNED, 명령 생성 안 됨 | 정상 수신·실행 |

ACK 지연·중복 전송은 관측했지만 같은 requestId의 중복 실행은 없었다. 700ms를 늘려도 거부된 평타는 발사되지 않는다. 단순 카운터 관측 지연이나 v35.7 증강 회귀로 단정하지 않는다. 실제 서버 기절과 몇 초 늦은 소프트웨어 GPU 브라우저 표시가 충돌했다. 원시 발췌: [pixi-input-diagnostic.json](evidence/pixi-input-diagnostic.json).

수정은 시험 준비 순서에 한정한다. 같은 방에서 모든 학생을 연결하고 INPUT_BATCH·스냅샷을 유지한 채 두 실제 학생의 **평타/스킬 각각 한 번**을 먼저 확인한다. 기존 700ms와 fired>0 assertion을 유지하고, 그 뒤 봇 평타·스킬 1초 주기를 활성화한다. 모든 전투/성능 측정 구간, 생존자 감소, 부활, 결과, 재경기에는 기존 공격 부하가 그대로 적용된다. 기절 제거·면역·재클릭·입력 예약·타임아웃 연장 없음. 기준과 후보에 같은 시험을 적용한다. 초기 비측정 구간의 순서가 달라졌으므로 이전 실행의 총 소요시간을 게임 속도 개선으로 해석하지 않는다.

엔진 회귀 검사에서 실제 기절 중 command accepted=true지만 resolved만 증가하고 fired=0인 것을 재현했다. 기절 종료 뒤에도 자동 재실행되지 않으며 새 유효 의도만 실행됨을 검사한다.

## 30인: heartbeat 오판과 느린 수신자 보호를 구분

요청 기준 실행의 호스트는 서버 RESULTS 이후에도 화면 BATTLE이었다. 1795088131584의 정상 PING, 1795088134574의 END 수신 뒤 1795088134774 heartbeat가 terminate했다. 마지막 명령 200ms 뒤였으며 큐/버퍼0, overload0, event-loop max43.909ms였다. 결과 생성 실패가 아니라 호스트 수신 지연과 생존 판정 오류다.

추가 진단에서도 기준판 호스트는 정상 PING 2163ms/1247ms 뒤에 terminate→1006했다. 스택은 main의 기존 15초 heartbeat다. 후보는 별도로 1,048,999B 송신 큐에서 `4008 SLOW_RECEIVER_RESYNC`가 발생했다. 이 보호를 없애거나 한도를 올리지 않는다. 양쪽 browser pageerror는 없었고 서버 30명 연결은 유지됐으나 host 복구/입력 assertion에서 실패했다. [pixi-transport-diagnostic.json](evidence/pixi-transport-diagnostic.json)에 종료/큐/메모리/event-loop/CPU/서버·호스트 phase를 보존한다.

최소 런타임 수정: HELLO와 schema·rate 검증을 통과한 기존 애플리케이션 PING도 `peer.alive=true`로 인정한다. native pong, 15초 주기, 무응답 종료, 인증 기한, 송신 큐·메모리·과부하 한도는 그대로다. RED 검사(정상 PING 후 alive=false) 1FAIL/1PASS → 수정 후 heartbeat·END 전달 5PASS175ms. 기절 의미 검사 포함 3PASS215ms. 게임 수치·클라이언트 렌더링·86종·60Hz/20Hz 수정 없음.

## 실행 기록과 해석 범위

- 진단 20인: 기준 FAIL200.785s(4경기 완료), 후보 FAIL32.583s(0경기 완료). 정확한 시간은 JSON의 ms가 우선한다.
- 진단 30인: 기준 FAIL326.167s(2경기 완료), 후보 FAIL249.008s(2경기 완료). 첫 개인전 CPU296.5→360.0ms/s, RSS406.2→350.1MiB, snapshot p9512.3→13.1ms, host/student gap566.7/583.3→649.9/783.4ms. 성능 무악화 PASS 아님.
- 같은 진단 HEAD 필수 CI [44518862190](https://github.com/YEOMT/DSbettleroyale/actions/runs/44518862190) 13PASS/2scopeSKIP, required-checks PASS. v35.4 네 Job/v35.5 다섯 Job PASS. 추가 자동 실행된 Pixi high tier identity는 `amplify v35.6 body preserved` 표본 FAIL360.168s. 기존 e435 해당 PASS와 이 FAIL을 모두 보존하며 unrelated game-feel 코드를 바꾸지 않는다.
- 수정본 필수 빌드 PASS(Vite6.61s). 로컬 Quick ReleaseOps8+일반474 PASS(일반256.048s). 수정 후 같은 20×5/30×3 A/B 및 필수 CI의 최종 결과·아티팩트는 [Draft PR28](https://github.com/YEOMT/DSbettleroyale/pull/28)에 각 HEAD/run별로 기록한다. 실행 전 결과를 PASS로 간주하지 않는다.
- 성능 비교는 같은 runner의 기준→후보 단회, 같은 품질/참가자/세 화면/공격 빈도이며 CPU/RSS/snapshot p95/frame gap 악화도 그대로 보고한다. SwiftShader 세 화면과 서버가 같은 runner를 공유하므로 물리 GPU·실물 기기·교실 성능은 NOT_RUN. 느린 수신 큐와 결과 표시 지연이 전부 해결됐다고 추정하지 않는다.

main 병합, AWS/Pages/Firebase 배포, Secrets·서버 설정 변경 없음.
