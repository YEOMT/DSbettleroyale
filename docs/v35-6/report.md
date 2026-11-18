# v35.6 Combat Feel & Balance Recovery

검토용 [Draft PR #27](https://github.com/YEOMT/DSbettleroyale/pull/27). 구현 커밋: `4f259416c2ebc82976f7f15d35cb4fa8719eef33`.

## 기준과 범위

기준 main은 `e328aad252e243428123e3d576ea8ffefcdb8604`다. 시작 시 PR #26은 MERGED였으며 main CI `44298847350`과 Paired candidate `44300657766`은 SUCCESS였다. 기존 작업 브랜치를 보존하고 `codex/v35-6-combat-recovery`에서 구현했다. 사용자 검토용 Draft PR이며 main 병합, AWS/Pages/Firebase 배포, Secrets와 서버 설정 변경은 하지 않는다.

전체 [구현 명세](implementation-spec.md)를 읽고 적용했다. [40개 인수 항목](acceptance.md), [9종의 정확한 전후 수치](balance-before-after.md), [고정 조건 전투 자료](evidence/balance-comparison.json)를 구분해 기록한다. 모든 항목이나 실교실 성능이 통과했다고 주장하지 않는다.

## 구현

- 기존 `AttackPoses`의 단일 상태를 공격·실제 HP 피격·권위 벽 접촉 채널로 분리했다. 공격 도중 피격이 공격 자세를 지우던 현상을 수정했다. cast/life/tick 중복을 병합하고 각 채널·ledger를 제한하며 재경기 시 정리한다.
- 강타는 205ms/+20% 몸체 변형, 빠른 베기는 105ms, 실제 피격은 강도별 80/105/135/160ms다. 벽은 기존 `heavy-wall`의 접촉 법선으로만 175ms·최대 4CSS px의 그림 반동을 한 번 적용한다. 실제 impulse만 2CSS px·0.10rad 이내로 표현하고 low에서는 impulse 위치 오프셋을 생략한다.
- Canvas/Pixi에 같은 방향성 affine 계수를 적용하고 기존 이모지 bitmap·sprite·texture를 재사용한다. 보호막 테두리와 반사는 유지하고 주기적 장판 피해로 전신이 반복 떨리지 않게 한다. reduced-motion, host LOD, 실제 발사 시점과 기존 투사체 출발점은 보존한다.
- 승인된 9종의 최종 런타임 값만 마지막 override에서 변경했다. 좀비는 기존 입력 감쇠를 보존한 채 해당 캐릭터의 구동값만 보정하여 실제 정상 보행 3.20 world/tick을 맞췄다. 240tick 이동·정지·반전·벽 충돌에서 권위와 예측이 일치한다.
- 생성 도감·manifest·content hash를 갱신했다. 기존 77종, 기본 평타, 볼링 피해21, 폴아웃 폭발86.1/반복11.55, 전역 규칙·6레벨·증강·왕귀·모드·60Hz/20Hz는 별도 불변 기준으로 비교한다.

런타임 변경 경로는 `apps/client/src/render/{attack-pose,renderer}.js`, `packages/engine/src/{registry,abilities/recovery356,abilities/other-ranks,combat/player-input,world/rules,world/roster-text}.js`다. 콘텐츠 생성기·버전·생성물과 승인 수치에 해당하는 기존 시험 기대값도 함께 갱신했다. 과거 golden은 현재 엔진으로 다시 쓰지 않았다.

## 검사와 성능 자료

로컬 Quick 249.901초: ReleaseOps8/8 PASS, 일반422개 중421 PASS/1 FAIL. 실패는 이전 v35.4 수치 기대값이었으며 승인 delta만 추가한 해당 파일17/17을1.973초에 통과했다. Quick 전체는 반복하지 않고 필수 CI에서 다시 실행한다. 최종9종 단위15/15 PASS0.367초, 추가 실제 MULTICAST6/7/8발 집중1/1 PASS0.215초. 성능은 한 PC에서 서버와 세 실제 브라우저 화면, 나머지 가상 참가자의 실제 입력/공격/수신을 함께 실행한 비교다. 지속 교전을 위해 시험 전용 고HP·Lv6/III 증강 배치를 사용하며, 실제 학생의 전술·승률 모델은 아니다. 다른 기기로 분리하지 않았으므로 CPU/GPU 자원 경합을 배제하지 않는다. 정지 권위 fixture 화면 시험은 연속 플레이 성능 근거로 사용하지 않는다.

- 단위/파리티: 실제 스킬·명중·피해·CC·카드·실제 보행과 변경 허용 목록을 검사한다.
- 실제 WS 표시: Canvas low/Edge 12행 PASS 22.315초, Pixi high/Chrome 12행 PASS 22.819초. 공격자·상대·호스트에서 MISS/HIT, 공격+피격 합성, 벽 접촉/근접, 전량 보호막, 실제 반사, 헤드슈터 발사/잔상/명중, reduced-motion, 복구와 재경기 정리를 검사한다. 헤드슈터 전용 발사음 1회는 앞선 사용자 지시에 따라 EXCLUDED다.
- 실시간 비교: 20인 Canvas low·Pixi balanced 각각 같은 방 5경기, 30인 Canvas low·Pixi high 단기를 독립 job에서 기준/후보 한 쌍씩 실행한다. 20→6→5→3→2→1, 결과, 부활 퀴즈·리롤·복귀 조작과 모든 렌더 상태 정리를 유지한다.
- 각 비교는 server step/snapshot p95, 프로세스 CPU ms/s, RSS, bytes/s, 학생/호스트 draw·rAF 간격 p95를 기록한다. 함수 검사 PASS와 성능 PARTIAL을 별도 표기하며 누락·비정상 계측을 PASS로 만들지 않는다.

최종 paired build PASS(빌드+content check 명령8.607초, Vite6.54초). sourceHash `ea84952e7cf0361c307deb83e6e0a0b174de253a93e3715e965a71f54ef91024`, contentHash `eb9d3d3f9599ab6a5b04ebbf0669a9c96f73625e3ac9bbec66da83545afeec37`다.

[로컬 전후10장면](evidence/local-performance.json)은 sourceHash37d530c5의 실측이다. 각 행은 같은 조건의 이전→후보 값이며 단일 표본이다. 최종 CI에서 네 독립 A/B를 수행한다.

| 장면 | CPU ms/s | RSS MiB | step / snapshot p95 ms | host / student draw p95 ms | 전송 MB/s | student rAF p95 ms |
|---|---:|---:|---|---|---:|---:|
| Canvas low20,1경기 | 467.96→248.62 | 163.66→136.68 | 3.18/7.83→2.62/5.47 | 3.6/2.7→4.0/2.6 | 13.55→13.60 | 16.8→16.8 |
| Canvas low20,3경기 점령 | 531.53→260.88 | 236.00→171.46 | 3.92/7.81→3.11/8.00 | 3.0/2.2→3.9/3.2 | 15.59→16.13 | 16.8→16.9 |
| Pixi high30 | 366.93→366.38 | 270.99→269.09 | 4.48/8.98→3.07/6.03 | 12.9/12.1→10.0/10.9 | 26.40→27.18 | 16.9→16.9 |

20인5경기 함수 검사 PASS89.036초,30인 Pixi 단기 PASS28.324초. 모든 참가자 연결과 과부하0, 결과·재경기·자원 정리를 확인했다. 서버 CPU 수치 하락을 이 표시 패치의 효과로 단정하지 않는다. Canvas 일부 draw 증가로 로컬 성능은 **PARTIAL**이며, rAF 간격 유지만으로 입력 지연 개선이나 무회귀를 보장하지 않는다.

Canvas 증가를 검토하며 최종 코드에는 중립/축정렬 bitmap의 불필요한 행렬 계산·native transform만 생략했다. 같은 Edge 페이지20,000draw×5교차배치에서 축정렬 제출 비용 중앙값50.5→45.5ms(-9.9%), 중립46.9→45.3ms, 대각49.2→51.2ms로 변동이 있었고 실제RGBA 차이는 모두0이었다. [마이크로벤치](evidence/image-fastpath-benchmark.json)는 GPU 완료시간/전체 프레임 시험이 아니다. 강화된 동등성 단위9/9 PASS1.533초. 위10장면 실시간 표는 이 마지막 fastpath 전이며, **최종 코드는 CI A/B 결과로 별도 판정**한다. 좋은 결과를 얻기 위해 로컬 전체를 반복하지 않았다.

## 실패와 한계

버거의 기술 countCap은9지만 전역 증강 추가탄 상한3 때문에 현재 실제 최대는5+3=8발이다. 기본5발·합법 증강6/7/8발·비정상추가99도8발을 확인했으며 상한을 변경하지 않았다.

초기 고정 조건 전투 하네스는 한 tick에 두 명령을 계속 넣어 스킬을 굶겼다(PARTIAL). 정상 큐 소비에 맞춰 번갈아 제출하고 같은 조건 한 쌍을 재측정했다. 좀비 실제 속도 보정 뒤 후보 자료만 다시 갱신했다. 이전 실행은 `artifacts/v35-6/`에 보존한다. 볼링·비눗방울의 일부 고정 봇 합산 피해 감소도 수치 조정이나 성공 요약으로 숨기지 않는다.

화면 fixture의 초기 FAIL은 겹친 참가자/회전 가능한 벽에 고정 벽 경계식을 사용한 문제와 도깨비 보호막 스킬에 공격 자세를 요구한 문제였다. 고정 벽과 실제 평타를 명시했으며 위치·피격·이벤트 assertion은 유지했다. 승인된 수치를 반영하지 않은 기존 기대값 FAIL, 초기 좀비 예측 fixture의 회전 벽 FAIL도 보존한다.

Pixi 정지 fixture 캡처에는 `LIFE_MISMATCH` 토스트가 관측됐다. 실제 연결을 둔 채 lifeSeq를 수동 교체한 fixture의 오래된 입력 거부로 추정하지만 독립 추적은 하지 않았으므로 원인 미확정으로 기록한다. 이후 실제 공격·피격과 복구 assertion은 통과했다. 기본 Chromium 미설치로 브라우저 기동 전 중단된 INFRA_FAILURE도 별도 기록했다.

기존 C07 위험인 3.5초 승리 이벤트의 늦은 수신은 별도 미해결 사항이다. 현재 match/presentation의 **최초** 수신이 기한 뒤라는 증거가 있을 때에만 알려진 실패로 분류하고, 전체 실행은 PARTIAL/비영(非零) 종료로 기록한다. 제때 수신 후 UI 실패는 일반 FAIL이다. 기존 v35.4/v35.5 검사와 타임아웃을 완화하지 않았다.

실물 iOS/Android, 학교 Wi-Fi, AWS 1GB, 600/1200초 Deep는 NOT_RUN이다. 짧은 비교나 고정 봇 피해량을 실교실 장시간 안정성·승률로 표현하지 않는다. 운영 서버와 기존 백업은 변경하지 않는다.

## 재현

```sh
npm ci
node tools/ci/plan.mjs e328aad252e243428123e3d576ea8ffefcdb8604
npm run quick
npm run build
CLASSROOM_BUNDLE=1 LOAD_BUILT=1 node tests/combat/recovery356-identity.mjs canvas low
POLISH_PLAYERS=20 POLISH_ROUNDS=5 node tools/ci/recovery356-pair.mjs canvas low
POLISH_PLAYERS=30 POLISH_ROUNDS=1 node tools/ci/recovery356-pair.mjs pixi high
```

Windows에서는 동일 환경변수를 PowerShell `$env:NAME='value'`로 지정하고 설치된 Edge를 사용하려면 `PLAYWRIGHT_CHANNEL=msedge`를 지정한다. CI는 Chromium/SwiftShader를 사용한다. 별도 workflow는 여섯 renderer/quality 표시 조합과 네 개 성능 비교를 격리해 실행한다. 운영 배포 권한은 사용하지 않는다.

## GitHub 실행 제출 기록

최초 PR 생성 뒤 Actions 실행과 PR merge ref가 생성되지 않았다. Actions enabled/기존 workflows active, base 대비 ahead1/behind0을 읽기 전용 확인했고 Draft 유지 상태로 reopen 이벤트를 한 번 제출했다. 아직 실행되지 않은 GitHub 검사는 NOT_RUN이며, 이후 결과는 PR 본문에 갱신한다. 게임 코드/배포 설정 변경으로 이 상태를 우회하지 않는다.
