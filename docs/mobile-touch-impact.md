# Mobile touch lock / combat impact polish

기준 main `a5e05684e39034cad3ae6371c299fa1c9207793b` (PR #5/#6 포함).
작업 브랜치 `codex/mobile-touch-impact`. 정확한 최종 SHA와 GitHub CI 결과는 PR 본문에 기록한다.

## 구현

- `ui/overrides.css`, `input/battle-touch.js`, `ui/app.js`: 학생 전투 루트 및 모든 자식의 touch-action/overscroll 정책을 통일했다. 전투 밖에 떠 있던 연결 복구 배너도 전투 중에는 루트에 넣는다. Safari gesturestart/change/end와 touchmove의 취소 가능한 기본 동작만 해당 루트에서 차단한다. window/document 전역 preventDefault, touchstart/touchend 취소, viewport 확대 제한은 없다. 숨겨진 전투 화면은 차단하지 않는다. 기존 포인터 캡처·다중 포인터 소유권·취소 복구 로직은 유지한다.
- `render/renderer.js`: VisualViewport resize에도 실제 캔버스 크기를 갱신한다. 좌표 계산은 기존의 현재 DOM rect와 논리 카메라 경로를 사용한다. 몸체의 짧은 음수 squash(늘어남)도 표시한다.
- `render/attack-pose.js`: 강한 근접은 190ms 내 전진 → 압축 → 작은 반발 → 복원으로 분리했다. 베기는 135ms, 빠른 연타는 85ms. 저격·중량 기술은 실제 SHOT_SPAWN 이후 최대 8 CSSpx/160ms 반동이며 보이는 몸체 반경의 30%로 제한한다. 한 life/actionSeq의 연발 ordinal은 한 번만 반동을 시작한다. 평범한 원거리 공격과 회오리·장판의 몸체 변위는 일괄 증폭하지 않았다. 확정된 비주기 근접 명중만 공격자 접촉 압축을 주고, 피격 몸체는 서버 impactLevel을 사용한다. 낮은 품질에서도 같은 핵심 몸체 표시, reduced-motion에서는 장식 동작 억제, bounded map/재경기 정리 유지.
- `render/original-painters.js`: 기존 확정 contact 지점에서 베기/발톱의 날카로운 선, 근접의 짧은 방향성 호, 강한 원거리의 가는 입사선으로 구분한다. 사건당 한 primitive 추가이며 새 파티클·텍스트·블러·프레임 정지는 없다. 위험 범위와 투사체 출발점은 그대로다. 기존 최대 등급 명중의 제한된 화면 충격과 조준 중 억제를 유지한다.
- `input/controls.js`, `audio/*`: 발사 시점 확인과 기존 음성 수 제한을 유지하면서 빠른 근접/보통/중량 행동음의 길이·음높이·강도를 구분한다. 저격은 실제 발사 전에는 소리·반동이 나지 않는다. 확정 명중·피격의 기존 4단계 음향은 유지한다.
- `net/request-id.js`, `net/connection.js`: 실제 Wi-Fi HTTP 시험에서 crypto.randomUUID가 없어 명령이 실패하는 오류를 재현했다. HTTPS는 기존 randomUUID를 그대로 쓰고, HTTP LAN은 getRandomValues로 같은 UUIDv4 식별자를 만든다. 서버 인증·중복 요청·life/connection epoch·입력 검증은 변경하지 않았다. 안전한 난수가 없으면 약한 난수로 대체하지 않는다.

engine/content/protocol/server, root index.html 및 legacy 파일은 변경하지 않았다. 공격력·실제 이동·판정·피해·쿨타임·넉백·사거리·성장 수치는 그대로다. 물리 60Hz/스냅샷 20Hz 유지.

## 실행 증거와 시간

| 검사 | 결과 | 로컬 시간/범위 |
|---|---|---|
| Quick | PASS | 10.95s, JS 159개 및 경계 검사. 이후 LAN 수정은 관련 8개 0.37s; 최종 커밋 전체 Quick는 CI에서 확인 |
| CI 분할 정책 | PASS | 4개, 0.28s |
| Targeted | PASS | 141.20s, 3모드 E2E 29.80s / Canvas 대표 26.36s / Pixi 대표 32.64s / 배치 9.85s / 음향 9.97s / 26명30초 부하 32.58s |
| Chromium Canvas 다중 터치 | PASS | 77.66s, CDP 네이티브 터치 자동화와 서버 동작 확인. 390×844, 844×390, 1024×768, 768×1024, 768×930 |
| WebKit 모바일 크기 | PASS(제한 명시) | 8.35s, 위 5크기 native tap, scoped gesture 취소, 결과·재경기·도감 스크롤. WebKit 자동화 API는 native 두 손가락 pinch를 제공하지 않아 해당 부분 NOT_RUN |
| 연속 3화면, Canvas 전/후 | PASS | 9.01s / 8.73s. 실제 touch tap, 서버 60/20Hz 계속 진행. 근접2/저격/연발/회오리/장판6종, 실제 painter contact/피격, 두 번 재경기 |
| 연속 3화면, Pixi | PASS | 11.26s, 같은6종·확정명중·실제 bodies·재경기 정리 |
| 최종 쌍 빌드 | PASS | 약8.3s(산출물 확인 포함), `v33-1de9a94ae00af46d` |
| 기존 recovery/조준/카메라/최후반/터치 | CI | 기존 assertion을 유지하고 renderer×recovery/continuous/touch의6개 combat job에서 실행. 최종 결과는 PR에 기재 |

Chromium 네이티브 터치 자동화에서 전투 중 pinch/빠른 탭/이동+공격+스킬/취소·재획득 후 viewport scale=1, scroll/offset=0. 전투 종료·재경기 후 도감 scrollTop=150, 확대 scale=5를 확인했다. 같은 브라우저에서 확대가 작동하는 양성 대조까지 확인한 결과다. 물리 기기 인증을 대체하지 않는다.

WebAudio 실제 oscillator 초기 주파수(빠른/보통/강한 근접/강한 기술) 270/190/130/155Hz 및 4개 voice 종료를 확인했다. 실전 화면에서도 근접2/3, 저격3, 보통 기술2 등 발사 가중치와 확정 hit1~4 호출을 기록했다. 물리 스피커에서의 음질·음량 평가는 별도다.

## 전후 계측과 영상

동일800×520, low, Edge Canvas, 독립 공격자·상대·호스트의 실제 연속 서버 전투다. 같은 6종·동작·근접 거리로 촬영했다. 계측 및 영상은 `artifacts/combat/feel-canvas-{before,after}.json`, `artifacts/mobile-impact/{before,after}/{attacker,opponent,host}.webm`에 있다. CI는 세 화면을 모두 검증하고, 변경 후 Canvas 공격자 영상과 두 renderer의3화면 raw metrics를 artifact로 보존한다. Pixi 영상은 하드웨어 가속 로컬 실행의 `artifacts/mobile-impact/pixi-single-video/attacker.webm`에 있다. 소프트웨어 GPU의 readback/인코딩이 검사 자체를 방해하지 않게 CI Pixi에서는 녹화하지 않는다. 녹화는 무음이다.

| 항목 | 전 | 후 |
|---|---:|---:|
| 공격자 강한 근접 최대 몸체 변위(CSSpx) | 1.39 | 7.86 |
| 공격자 저격 반동 최대 변위(CSSpx) | 1.22 | 5.04 |
| 공격자 베기 변위(CSSpx) | 1.03 | 4.31 |
| 공격자 draw p95(ms) | 1.3 | 1.2 |
| 상대 draw p95(ms) | 1.3 | 1.3 |
| 호스트 draw p95(ms) | 1.6 | 1.4 |
| 세 화면 RAF p95(ms) | 16.9 | 16.9 |
| 서버 근접 전진(두 사례 각각) | 12 | 12 |

한 짧은 표본으로 모든 모바일 기기의 FPS 개선을 주장하지 않는다. 같은 CPU의 다른 로컬 검사/임시 방이 일부 시간에 존재했다. 변경 후 실제 연속 플레이, 제한된 프레임 비용, 표시 크기 차이를 확인한 결과다. 공격 수치 비교와 정지 화면만으로 조작감 보존을 판단하지 않았다.

## 최종 CI에서 발견한 추가 경로

첫 CI42035136743에서 Pixi 연속 명중 표시가 FAIL이었다. 이벤트 tick323이 도착했을 때 첫 표시 tick358이 되어 170ms contact가 그려지기 전에 만료됐다. `Timeline`은 최근240ms 내 도착/최대45tick 지연의 확정 비주기 hit에 한해서 표시 시계를 한 번만 보정한다. 원래 사건 tick·좌표, windup/위험 신호/공격 판정은 바꾸지 않는다. 중복 표시 시계 재설정·life 변경·오래된 이벤트 재생·정지 중 영구 잔상을 막는 회귀를 포함한16개 검사0.26s와 실제 Pixi3화면 재검사가 PASS다. 영상/원래 전후 표는 이 작은 추가 수정 전 계측이며, 마지막 CI 영상에는 추가 수정도 포함한다.

같은 실행의 Pixi 모바일 검사는 긴 소프트웨어 GPU 시나리오에서 입력 대기가 끝나지 않아 TIMEOUT이었다. 정상 경기 종료와 입력 대기가 충돌할 수 있는 축소 경기장 대신 기존 점령전의 고정 경기장을 사용하고, 실패 로그에 phase/alive/renderError를 추가했다. 쿨타임·서버 시계·기존 assertion을 그대로 유지한 로컬 Pixi 다중 터치 재검사는79.90s PASS였다.

Canvas recovery는 WebKit의 Ubuntu Azure apt 미러 다운로드가 약40KB/s 수준으로 진행돼10분 job 제한에 TIMEOUT됐고 검사는 시작하지 못했다. 해당 job만 lockfile의 Playwright1.56.1과 같은 공식 `mcr.microsoft.com/playwright:v1.56.1-noble` 사전 설치 이미지로 실행한다. 검사를 생략하거나 timeout 기준을 늘리지 않는다. 최종 정확한 커밋의 전체 결과는 PR에 기록한다.

두 번째 CI의 Pixi 연속 검사는 세 화면 동시 녹화 중 호스트 프레임 간격이 약384ms로 늘어나 피격 몸체의 제한된 유효 시간을 넘겨 FAIL이었다. 짧은 연출을 오래 재생하거나 assertion을 완화하지 않고, CI 녹화는 공격자 한 화면으로 제한했다. 상대·호스트의 실제 body/contact painter·재경기 assertion과 viewport는 모두 유지했다.

세 번째 CI에서는 첫 표시가350ms 지연됐을 때 짧은 회오리 몸체(100ms)가 기존 `duration+240ms` 한도를10ms 넘겨 표시되지 않았다. 첫 표시 대기 한도를 종류와 무관하게500ms로 통일하고 서버 사건이750ms보다 오래됐으면 표시하지 않는다. 실제 애니메이션은 원래80~190ms 길이 그대로이고, 한 번 그린 뒤 wall time으로 끝난다. 지연된 첫 eligible tick/old event/life를 재현한 회귀 포함17개0.23s PASS. 이는 입력 지연·추가 관성·공격 수치 변경이 아니다. 최종 쌍 빌드는 위 새 buildId를 사용한다.

CI42039701647은 Quick162개/Python11개, Targeted, Canvas recovery, Canvas/Pixi continuous가 PASS였지만 Pixi recovery의 다섯 번째 viewport 이동 확인은 FAIL이었다. 경기장 경계에서 같은 실패 조건을 로컬 재현했다: 시작/종료 x=3122.2, 이동 입력 x=.765, 서버 입력50개 적용, 살아 있는 상태에서 바깥 방향으로 더 이동할 수 없었다. 당시 CI 로그에는 좌표가 없어 그 실행의 경계 도달 여부를 직접 확정하지는 않는다. 터치 fixture만 중앙 방향으로 이동하게 바꾸고, 두 손가락을 모두 누른 동안 서버 이동을 확인한 뒤 공격을 놓는다. 기존의 공격 후 검사에서는 정상 근접 전진이 이동 반대 방향으로 발생할 수도 있었다. 입력·쿨타임·물리·timeout·확대/조준/취소·재경기 assertion은 유지하며, 각 viewport의 시작/종료 좌표·방향·서버 적용 순번을 artifact에 추가했다. 게임 코드는 변경하지 않았다. 해당 Pixi5크기 재검사79.43s PASS; 각 동시 조작 중 실제 이동24.15~33.50, 양방향 입력/공격/스킬/취소/배율/결과·재경기 확인.

추가 CI42042188021은 Pixi recovery도 PASS였지만 Pixi continuous의 저격 반동 첫 표시가 FAIL이었다. RAF p95 약383ms, 이벤트 tick2036→첫 eligible tick2100으로 서버 사건이750ms보다 오래되어 의도한 stale 제한에 걸렸다. 연출/사건 유효 시간을 더 늘리지 않았다. 로컬에 SwiftShader를 강제하고 같은800×520/low/3화면/공격자 녹화를 실행하자 접촉 표시 누락을 재현했다(FAIL). 독립 브라우저3개는 첫 동작의 서버 tick이 진행하지 않아 FAIL로 처리하고 변경을 채택하지 않았다. 같은3화면에서 녹화만 제외한 소프트웨어 GPU 검사13.28s는6종·확정 contact/피격·서버 전진12·두 번 재경기 모두 PASS였다. 따라서 `tests/combat/run.mjs`의 Pixi CI 영상 인코딩만 제외한다. 화면/서버 진행/판정/timeout/assertion은 그대로이며, Canvas CI 영상과 로컬 Pixi 영상은 유지한다. 최종 정확한 커밋 상태는 PR을 따른다.

CI42044235776 attempt1은 Quick/Targeted/Canvas PASS, Pixi2개 TIMEOUT이었다. continuous는 apt15.8MB 다운로드9분24초(27.9kB/s) 후 job10분 제한에 걸렸다. 같은 커밋의 실패 job만 재실행한 attempt2에서 continuous는98s PASS였지만 recovery는 터치5크기198.30s PASS 후 마지막 대표5종 balanced 검사가 다시 합산540초 제한에 걸렸다. 기능 assertion 실패가 아닌 반복된 합산 시간 제한이므로, 터치를 독립 job으로 옮겨 renderer×3suite=6개로 나눴다. recovery의 세션/조준/대표5종, continuous의 연속 플레이, touch의5크기/Canvas WebKit을 모두 유지하며 필수 gate는6개 전체를 요구한다. combat jobs는 기존 검증된 동일 Playwright1.56.1 공식 이미지로 통일해 apt 지연을 제거했다. 게임 코드/timeout/판정 변경 없음. 분할·gate·lockfile 이미지 버전 관련11개 검사0.36s PASS. 전체77종 Deep Audit를 새로 실행한 것이 아니다.

## 실기기와 한계

동일 Wi-Fi의 임시 PC 서버/독립 방을 제공했고, 사용자가 **iPhone Chrome**으로 입장해 **“많이 개선됨”**이라고 회신했다. 이는 사용자 보고에 의한 체감 개선이다. 정확한 모델/OS, 확대·멀티터치·회전·새로고침 항목별 결과는 제공되지 않았으므로 개별 실기기 PASS로 표시하지 않는다. iPhone Safari, iPad Safari, Android Chrome 실물 검사는 **NOT_RUN**. 운영체제의 가장자리·홈·접근성 시스템 제스처 전체 차단을 보장하지 않는다.

전체77×품질 렌더/전체 Deep Audit/600초 부하/학교 현장30대는 **NOT_RUN**. 과거 장시간 부하 한계를 해결했다고 선언하지 않는다.

초기 시험 실패 기록: sandbox Edge 실행과 FFmpeg 미설치는 INFRA_FAILURE로 구분했다. 영상 저장을 browser.close 이후 요청한 시험 오류, 존재하지 않는 aimGuide.kind 조회, 초기 undefined fired 카운터 비교, CDP 해제 대상 포인터 착오, 쿨타임 대기 중 조이스틱을 계속 눌러 경기장을 벗어난 fixture는 각각 수정 후 해당 검사만 재실행했다. CDP synthesizePinchGesture는 허용된 대조 페이지에서도 확대되지 않아 이 방식을 증거로 쓰지 않고, 실제 touchStart/Move/End와50ms 간격으로 양성 대조를 통과시켰다. 게임의 쿨타임/입력 검증/판정을 완화하지 않았다.

## 실행과 정식 전환 준비

```sh
npm ci
node tools/ci/plan.mjs origin/main
npm run quick
npm run build
npm run test:targeted
node tests/combat/run.mjs canvas recovery
node tests/combat/run.mjs pixi recovery
node tests/combat/run.mjs canvas touch
node tests/combat/run.mjs pixi touch
node tests/combat/run.mjs canvas continuous
node tests/combat/run.mjs pixi continuous
npm run dev
```

로컬 브라우저는 Playwright Chromium/WebKit/FFmpeg 설치가 필요하다. Windows에서는 PLAYWRIGHT_CHANNEL=msedge를 사용할 수 있다. 기본 dev 주소 http://127.0.0.1:5173, 교사 비밀번호 HOST_AUTH_SECRET(루프백 기본 local-teacher). 임시 Wi-Fi 방은 공개 배포가 아니며 영구 테스트 주소가 아니다.

이번 PR은 게시 준비용 코드이며 **정식 Pages 전환 승인이 아니다**. AWS/Pages/Firebase 변경 없음. 현행 ReleaseOps의 정확한 buildId 쌍 배포/드레인·seal/검증 후 입장 재개/보존 artifact 복구를 유지했다. [releaseops-ko.md](releaseops-ko.md)의 bootstrap, staging Caddy/DNS/TLS, environment secrets/known-host, 정확한 Pages Origin, 현재 Pages 백업, staging 실제 smoke 설정 완료 여부는 이번에 확인하지 않았다. staging 후보 검증 후 명시적 workflow_dispatch 승인으로 정확한 release_id/candidate_run_id를 지정해야 한다. 최초 Pages source 전환 및 PRODUCTION_WS_ENABLED 활성화는 사용자 승인 뒤에 한다. latest 대체·자동 main 병합·자동 운영 배포는 없다.
