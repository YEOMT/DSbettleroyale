# v35.4 구현·검증 보고

기준: main `dd331fd62dc8d023d02d45c50186d02b41624769` / v35.3 / 86종. 작업 브랜치 `codex/v35-4-polish-special-battles`. 이 보고는 개발 후보에 대한 기록이며 운영 배포 보고가 아니다. 루트 `index.html`, AWS, 공식 Pages, Firebase, ReleaseOps 안전 기준은 변경하지 않았다.

## 구현

- 영구 탈락 학생만 서버의 개인 뷰 생성·스냅샷 인코딩·전투 이벤트 번호 부여 전에 제외한다. 소켓/heartbeat/제어/결과/재경기는 유지한다. 이미 번호가 매겨진 신뢰 큐는 지우지 않는다. 제한 FULL_STATE와 클라이언트 입력·타임라인·실제 RAF·렌더 자원 정리를 연결했다. 부활 모드는 별도 경로다.
- 효과 종료는 마지막 서버 확정 tick을 넘지 않는다. 반사·보급·장판의 얇은 잔여 표시, 기절/포획 잠금, 기존 재사용 창을 사용한다. mirror의 displayFrame 외삽이 확정 만료보다 앞서던 표시 경로도 수정했다. 효과마다 timer를 추가하지 않았다.
- 핵주먹·망치·볼링·기관차의 확정 스킬 접촉에 4개 도형/160ms 표시, 실제 impulse가 있을 때만 작은 표시 기울기, 실제 벽 충돌 normal을 받은 경우만 3개 도형/150ms 표시를 제공한다. 물리/판정 수치는 바꾸지 않았다.
- 생명당 서버 사망 요약 하나를 보존한다. 학생 카드·호스트 상세표는 서버 원인과 기존 순위/최종 기록을 사용한다. 없는 통계는 열을 제외하거나 `—`로 표시한다. 기존 시상·팀 결과를 유지한다.
- 자연 종료 개인전의 정확히 마지막 1인에만 결과를 먼저 동결하고 3,500ms 정적 승자 화면을 표시한다. 호스트 팡파레는 경기당 한 번이며 음소거/숨김/차단을 존중한다. 기한 중 재경기와 drain을 보호하고, 복귀는 남은 시간만 표시한다.
- XP 상자는 금색 뚜껑·잠금장치·XP 표식, 고정 기둥은 청회색 면·볼트·기단으로 구분한다. 기존 정적 캐시·충돌 영역을 사용한다.
- 방별 일반 대전/F급 구렁텅이 대전/S급 천상계 대전을 추첨·리롤·배정 복구·확정·시작·부활에 적용한다. 일반 확률 10/20/25/30/15%, 비용/증강 조건은 그대로다.
- 적격 지면 잔류 피해 8경로만 1.10배다. [정확한 수치/제외 경로](zone-damage-audit.md)를 참조한다. 실제 시전 28개 비교에서 방어 전 반복 피해·타격 tick·직격·제어·파밍 입력을 비교했다. 콘텐츠 hash: `a7b6405df41d8dc241c96b25a9bf4a77661a668053e7d593eeb8a4e6d8122e46`.

## 실행 결과와 시간

| 검사 | 결과 | 실제 시간/범위 |
| --- | --- | --- |
| 최초 Quick | TIMEOUT/INFRA_FAILURE | 300.025s; sandbox loopback EACCES. 기능 PASS 아님 |
| 네트워크 허용 Quick | FAIL | 267.998s; 승인된 장판 수치를 아직 반영하지 않은 기존 기대값 4건. 삭제 없이 allowlist/이전 golden 비교 정규화만 갱신 |
| 해당 기대값 관련 재검사 | PASS | 106/106, 1.386s |
| v35.4 + 입력/HUD 단위검사 | PASS | 27/27, 1.201s |
| 20 실제 WS 연결·최후반·제한 RESUME·결과·재경기 | PASS | 10.975s |
| v35.3 대비 실제 시전 비교 | PASS | 28개, 1.979s; 기본/강화·광폭·왕귀 컨텍스트 |
| paired build | PASS | 최초 전체 14.07s; 이후 관련 표시 수정 빌드도 성공. 최종 SHA 빌드는 CI에서 확인 |
| 배포용 20인 Canvas/호스트+학생2·나머지 WS | PASS | 41.150s; 20→6→5→3→2→1, 결과/재경기 |
| 기준 v35.3 배포용 같은 시나리오 | INFRA_FAILURE(검사 UI) | 33.140s; 다섯 계측 구간과 RESULTS까지 도달. 구형 결과 DOM에 신규 table 선택자를 사용해 마지막 행수 assertion 실패. 측정값 보존, 통과로 바꾸지 않음 |
| 6인 Canvas low 같은 방 5회 | PASS | 80.152s; 일반→F→S→S→일반, 연결 유지·매회 자원 정리 |
| 6인 Pixi balanced | PASS | 26.656s; 탈락 RAF=0, 결과/재경기 |
| 배포용 6인 점령전 | PASS | 26.064s; 실제 퀴즈 3답→리롤→새 생명 이동/평타/스킬 |
| 배포용 승자 표시 중·이후 새로고침 | PASS | 36.652s; 남은 시간/늦은 결과 직행 |
| Canvas/Pixi 종료 시점 화면 | PASS | 12.378s/11.991s; 실제 서버 상태, 반사·세 보급·기절. 정지 장면 검사는 성능 증거로 사용하지 않음 |
| 서버만 20인/5회 | PASS | 후보47.333s; 기준1회16.569s, 동일 첫 라운드만 전후 비교 |
| 서버만 30인 S급 집중 | PASS | 후보16.633s/기준16.737s, 10s 실측창; 렌더/실기기 시험 아님 |
| 최종 Quick/Targeted/집중 CI | NOT_RUN | PR 제출 후 결과 갱신 |
| 실제 Android/iPhone/iPad·교실 Wi-Fi·600/1200s | NOT_RUN | 이번 실행으로 이전 미검증/장기 RSS 문제를 해결했다고 주장하지 않음 |

최초 개발 실행과 준비 프레임을 둔 개발 실행의 20인 다중 화면은 기준본·후보 모두 초기 SAFE_PAUSED가 발생했다. 배포용 빌드 가설을 한 번씩 비교했고 후보는 통과했다. 이전 실패를 삭제하지 않았으며 개발 실행 전체 원인이 확정된 것은 아니다. 첫 6인 시험의 disposed `rw.entities` 조회는 테스트 fixture 오류였고, 안전 접근으로 수정한 뒤 5회 시나리오를 수행했다.

## 전후 계측

Windows/Edge 같은 PC, 서버는 별도 프로세스. 실물 모바일 또는 서버/브라우저 별도 기기 시험이 아니다. 고정 match seed/캐릭터·입력 패턴·화면/화질을 사용했으나 실시간 스케줄링/샘플 수는 조금 다르다. 테스트 전용 높은 HP와 실제 lethal damage fixture로 인원을 제어한다. 게임 보호/60Hz/20Hz/공격 정보는 그대로다.

배포용 Canvas balanced, 약1.8s 창, 값은 v35.3 → 후보:

| 생존 | snapshot p95 ms | 호스트 draw p95 ms | 생존 학생 draw p95 ms | 탈락 학생 전투 bytes / 뷰수 |
| --- | --- | --- | --- | --- |
| 20 | 6.442 → 10.711 | 3.4 → 4.2 | 2.6 → 3.0 | 아직 생존 |
| 6 | 5.922 → 2.946 | 3.5 → 4.4 | 2.1 → 2.7 | 508339 /36 → 0 /0 |
| 5 | 5.231 → 2.393 | 6.7 → 7.7 | 1.4 → 1.9 | 311587 /37 → 0 /0 |
| 3 | 5.375 → 2.002 | 6.6 → 7.5 | 1.7 → 1.8 | 234768 /37 → 0 /0 |
| 2 | 5.730 → 1.409 | 4.2 → 5.3 | 1.4 → 1.7 | 152874 /36 → 0 /0 |

탈락 학생 후보는 전환/배출 뒤 snapshot·전투 이벤트·개인 뷰·RAF가 0이며, 제어/PONG과 결과/복귀는 유지된다. 호스트와 생존 학생은 계속 그린다. 3명 구간 서버 RSS 152.8→129.8MiB(단일 순간값), frame gap p95는 호스트16.9→16.9ms / 학생16.8→16.9ms다.

**조사 신호 / UNRESOLVED:** 전원 생존 시 CPU 609→1047ms/창과 snapshot p95, 여러 구간 draw p95가 10% 이상 높다. 별도 렌더 없는 30인에서는 CPU 6828→6704ms, 송신278.40→279.87MB로 거의 같지만 step p95 4.370→5.017ms, snapshot p95 9.267→10.843ms가 높다. 수정 경로를 대조했으며 추가 비용은 확정 상태 조회·짧은 상태 필드·가벼운 도형에 한정되지만, 이 단일 표본만으로 원인을 확정하거나 전체 성능 동등/향상을 선언하지 않는다. 동일 PC 자원 경합을 배제하지 못했다. 장기 RSS 안정성·20~30인 실물 교실 성능도 미확정이다.

서버 transport send/write, step/snapshot p50/p95/max, event-loop, CPU/RSS/heap, 역할별 bytes/뷰/큐, 화면 frame/draw/자원과 1/3/5회 정리는 [익명 합성 계측](evidence/local-results.json)에 있다. 큐와 이벤트 이력은 기존 한도 이내이며 로비 전환 뒤 world/actors/입력·행동 큐/renderer sprite·texture·timeline·RAF가 비워졌다. 모든 원시 로그는 무시되는 로컬 artifacts에도 남아 있다.

## 실행 방법

```powershell
node tools/ci/plan.mjs origin/main
npm run quick
npm run build
npm run test:targeted
node --test tests/unit/polish354.test.mjs tests/integration/polish354.test.mjs
node tests/combat/polish354-authority-compare.mjs artifacts/v35-4/baseline-source
$env:CLASSROOM_BUNDLE='1'; $env:LOAD_BUILT='1'
$env:POLISH_PLAYERS='20'; $env:POLISH_ROUNDS='5'
node tests/combat/polish354.mjs candidate canvas low
node tests/combat/polish354.mjs candidate pixi balanced
node tests/combat/polish354-server.mjs candidate 30 1
node tests/combat/polish354-feedback.mjs canvas
node tests/combat/polish354-feedback.mjs pixi
```

Windows 로컬에는 `PLAYWRIGHT_CHANNEL=msedge`를 사용했다. 마지막 feedback 명령은 source fixture 사용을 위해 LOAD_BUILT를 해제한다. CI는 기존 Quick/Targeted를 유지하고, 신규 집중 검사만 별도 작업으로 실행한다. baseline archive는 정확한 dd331fd 소스이며 계측 fixture만 복사했다. 원시 실패 결과는 최종 성공 결과와 별도 기록한다.

운영 배포/병합은 NOT_RUN 및 승인 범위 밖이다. PR의 필수 CI와 별도 집중 검사를 확인한 뒤 검토한다. 성능 조사 신호와 실기기/장기 위험은 다음 판단에서 그대로 고려해야 한다.
