# v35.7 OVERDRIVE II 검증 보고

기준: `9b2d45ff13d4ee0890179103ef66e6edb1bf174c` (v35.6, PR27 병합 확인). 작업 브랜치 `codex/v35-7-overdrive-ii`. 기존 작업 브랜치를 보존하고 최신 main에서 분기했다. 첨부 명세 전체는 [implementation-spec.md](implementation-spec.md)에 보관했다. SHA256 `500fa8c3d57f99ff438d3a813509daa9dcb9d7c55b3248518fa60cf53e967168`.

## 확정 수치

각 칸은 I / II / III의 누적값이다. 서로 다른 경로는 기존 증감 합산을 사용한다.

| 경로 | v35.6 | v35.7 |
|---|---|---|
| REGEN 무피격 대기(f) | 240 / 180 / 120 | 210 / 150 / 60 |
| EXPANSION 크기 | 1.33 / 1.66 / 2.045 | 1.45 / 1.85 / 2.50 |
| AFTERGLOW 지속 | 1.22 / 1.385 / 1.55 | 1.30 / 1.55 / 2.00 |
| LONG STEP 이동거리 | 1.165 / 1.308 / 1.462 | 1.25 / 1.45 / 2.00 |
| SWIFT 이동속도 | 1.25 / 1.43 / 1.65 | 1.25 / 1.43 / 2.00 |
| AMPLIFY 스킬 피해 | 1.44 / 1.825 / 2.32 | 1.44 / 1.825 / 2.50 |
| QUICK 남은 쿨타임 | .725 / .582 / .428 | .725 / .582 / .300 |
| CONTROL 제어 | 1.275 / 1.495 / 1.715 | 1.40 / 1.80 / 2.25 |
| IMPACT 원거리 / 근접 | 1.44 / 1.88 / 2.43 · 1.75 / 2.4 / 3.1 | 1.60 / 2.30 / 3.25 · 2.00 / 2.90 / 4.00 |
| HEAVY 원거리 / 근접 | 1.44 / 1.825 / 2.32 · 1.6 / 2.05 / 2.65 | 1.55 / 2.10 / 3.00 · 1.80 / 2.45 / 3.50 |

REGEN 회복률(.028/.045/.065), HP 보정, QUICK의 비피해 스킬 지속/회복 변환과 나머지 부가 보정은 그대로다. 다른 8개 증강과 86종 기본 능력·등급·확률·성장·모드 수치는 immutable v35.6 기준과 비교한다.

엔진 상한: basicDamage 3.50, basicKnockback 4.00, skillCooldown 하한 .300, skillSize 2.50, skillControl 2.25, moveSpeed 2.00, signatureRange 2.00, signatureDuration 2.00. **skillDamage 상한 2.75 및 다른 상한은 유지**한다.

## 실제 적용

- 서버 `control-policy.js`를 판정·카드 미리보기·도감이 공유한다. 시전 시 `controlTier`를 저장해 기존 비행탄을 소급 강화하지 않는다. native CONTROL 다발 접촉은 스냅샷을 약한 참조 키로 삼아 동일 시전/대상/생명 중복을 막는다.
- 60f 기절은 84/108/135f. 천둥군주 III는 180f. 마이클 잭슨은 180/216/216/216f이며 실효 향상이 없는 II/III 추천을 제외한다. [86종 적용표](control-audit.md), [수치 데이터](control-audit.json).
- QUICK III: 86종 실제 시전 및 재시전 종료 후 쿨타임을 측정했다. III는 기본의 30%(정수 프레임 반올림)이며 준비·채널·재시전 창을 바꾸지 않는다. I/II native/rework 및 비피해 변환도 별도 검사한다.
- 실제 기본 공격 HP 차감/물리 impulse로 HEAVY·IMPACT의 근접/원거리 차이를 검사한다. 기본 공격에 기절·스킬 피해·벽 추가 피해를 만들지 않는다.
- SWIFT 실제 INPUT 이동, REGEN 첫 회복 프레임/주기 피해 리셋, EXPANSION native/rework 투사체·원·사각형·성장 장판 접촉, AFTERGLOW 종료/교체/생명 정리, LONG STEP 벽 제한을 검사한다.
- Canvas/Pixi는 기존 서버 프로필과 geometry를 그대로 그린다. 렌더러·모션·이펙트·입력·통신 주기/과부하 보호는 변경하지 않았다.

## 실행 기록

| 검사 | 상태 | 근거 |
|---|---|---|
| npm ci | PASS | 43s, 70 packages, 취약점 0 |
| 새 집중 검사 + 86종 parity | PASS | focused-03 43/43, 1.559s |
| native 미리보기 parity 보완 | PASS | parity-05 3/3, .888s |
| QUICK I/II·native 돌진 실제 CC·DOT/당김 | PASS | focused-06 3/3, 1.085s |
| 로컬 Quick 첫 실행 | TIMEOUT + FAIL | 300초 종료. 종료 전 434 PASS, 이전 evolution 기대값 1 FAIL. 나머지는 완료 아님 |
| 승인값으로 evolution 기대값 갱신 후 | PASS | 해당 파일 17/17, 2.835s. 기존 검사 삭제 없음 |
| paired build | PASS | 최종 native 분류 수정 후 build-02 Vite 16.86s |
| GitHub Quick | PASS | releaseops 8 + unit/parity/integration 471, 본 검사 242.388s; Python ReleaseOps 31 |
| GitHub 필수 CI 44512744675 | PASS | Quick·Targeted·9개 combat·isolated-release·required-checks. 범위 밖 roster10/characters는 SKIPPED |
| 기존 v35.4 / v35.5 | PASS | 44512744778 4/4, 44512744784 5/5 |
| 새 10경로 UI/실제 서버/세 화면 | PASS / 일부 NOT_RUN | Canvas 3품질, Pixi balanced 전체10경로 PASS. Pixi low 기능 PASS 후 업로드 중 Job TIMEOUT; high는 앞선 기존 검사 실패로 NOT_RUN |

초기 실패를 보존한다: 집중 검사 초기의 인위적 all-III 스킬 피해 합산 기대값(실제 2.56), growing-zone 가이드 초기 반경/최대 반경 구분, 모아이 등급·비공격 비누 이동기의 native 미리보기 분류를 수정했다. 브라우저 초기 두 실행은 다음 증강 카드 자동 제시를 기다리는 관측 조건과 `aimProfiles.skill.spec` 대신 상위 객체를 읽은 fixture 오류였다. 세 번째는 `state.players` 대신 실제 `state.actors`를 읽어야 했던 관측 오류다. `artifacts/v35-7/attempts/`와 [local-checks.json](local-checks.json)에 최초 결과를 보존했다.

## 성능 비교 조건

`OVERDRIVE357=1`로 기존 recovery356 A/B 도구를 재사용한다. 정확한 v35.6 Git archive와 수정본의 배포용 클라이언트/서버를 같은 PC에서 순차 실행한다. 동일 seed·동일 인원·입력/공격·실제 브라우저 3화면(학생 2, 호스트 1)·동일 품질을 사용한다. `tests/v35-7/scenario.mjs`의 합법적 5회 선택(III+II) 12개 대표 빌드로 10경로를 모두 포함한다. 첫 학생의 마지막 선택은 실제 UI→WebSocket으로 처리한다.

20인 Canvas low/Pixi balanced 각각 같은 방 5경기(solo/team-elim/capture/solo/capture), 30인 Pixi high 3경기(solo/team-elim/capture). 첫 20인 개인전은 20→6→5→3→2 생존을 유지한다. 기존 결과·재접속·부활·재경기·렌더 자원 정리 assertion을 유지한다. 정지 접촉 fixture 영상/캡처는 성능 개선 근거로 쓰지 않는다.

서버 CPU 시간·step/snapshot p95·RSS/heap·전송량·전송 큐와 각 화면 draw/rAF 간격을 구분한다. 동일 PC의 서버/브라우저 자원 경합은 배제할 수 없다. 단일 A/B의 20% 초과 위험 신호는 PARTIAL이며 반복해 좋은 결과만 선택하지 않는다.

### 첫 A/B 결과 — 구현 커밋 926cc906

원자료: [GitHub 44512744856](https://github.com/YEOMT/DSbettleroyale/actions/runs/44512744856), [식별자를 제거한 비교·메모리·큐·정리 증거](evidence/comparison-first-attempt.json). GitHub runner는 논리 CPU 4개, Pixi는 SwiftShader 소프트웨어 WebGL이다. 짧은 기능/대표 부하 시험이며 장시간 또는 실기기 안정성 PASS가 아니다.

| 시나리오 | 기능 / A/B 성능 | 관측 |
|---|---|---|
| Canvas low 20×5 | PASS / PARTIAL | 양쪽 같은 방 5경기·9개 전투 창 완주. 일부 stage snapshot·CPU·draw 비용 >20% 증가 |
| Canvas low 30×1 | PASS / PASS(이 표본만) | 양쪽 30연결·개인전·결과·재경기 완주 |
| Pixi balanced 20×5 | 양쪽 FAIL / PARTIAL | 기준 4경기 뒤 5경기째 학생1 평타 카운터0, 후보 2경기 뒤 3경기째 학생2 평타 카운터0. 양쪽 skill1·alive·20연결·overload0. 6개 완성 창만 A/B |
| Pixi high 30×3 | 기준 FAIL, 후보 PASS / PARTIAL | 후보 개인전·팀전·점령전 3경기 PASS201.519s. 기준은 두 번째 END 응답 timeout105.836s; 완성된 2개 창만 비교, 점령전 A/B 누락 |
| 로컬 Windows 동일 3시나리오 | FAIL / NOT_RUN | 각 1회, 기준·후보 모두 시작 직후 SAFE_PAUSED. 유효 비교 창 0. 보호 완화·반복 재시도 없음 |

대표 전투 창 수치(기준 → 후보):

| 장면 | CPU ms/s | step p95 ms | snapshot p95 ms | RSS MiB | 전체 JSON MiB/s | host/student draw p95 ms | host/student gap p95 ms |
|---|---|---|---|---|---|---|---|
| Canvas20 첫 개인전 | 229.99→194.56 | 1.42→1.20 | 2.03→2.86 | 172.98→174.45 | 12.60→12.88 | 2.20/1.10→1.60/1.00 | 16.7/16.7→16.8/16.7 |
| Canvas20 세 번째 점령전 | 239.38→284.72 | 1.24→1.95 | 2.61→3.09 | 247.66→244.92 | 12.90→14.23 | 1.30/.90→1.40/1.10 | 16.7/16.7→16.8/16.7 |
| Canvas30 개인전 | 207.53→204.85 | 1.63→1.58 | 3.89→3.64 | 276.14→280.45 | 27.50→27.63 | 2.00/1.20→2.10/1.10 | 16.8/16.7→16.7/16.7 |
| Pixi20 첫 개인전 | 286.68→179.83 | 2.84→1.82 | 8.72→7.79 | 254.65→279.57 | 창별 JSON 참조 | 24.30/21.00→31.10/16.30 | 516.6/516.6→583.3/566.6 |
| Pixi30 개인전 | 210.71→215.10 | 2.55→3.04 | 7.38→7.14 | 329.19→327.96 | 23.84→26.35 | 25.40/26.00→24.20/23.30 | 316.7/316.7→333.3/366.7 |
| Pixi30 팀전 | 206.06→221.78 | 2.69→2.72 | 8.24→8.38 | 416.09→336.37 | 28.06→29.20 | 17.60/21.30→21.80/21.60 | 300/300→333.3/333.3 |

전송량은 **모든 접속자에 대한 비압축 JSON 합계**이며 인터넷/TLS 실효 대역폭이 아니다. Canvas20 네 번째 개인전 CPU는 180.32→234.62ms/s(+30.1%), host draw p95 1.60→2.90ms였다. 전투 영향이 커진 증강과 공유 runner 변동을 이 한 표본만으로 분리하지 못했으므로 성능 무악화로 판정하지 않는다. 단계별 최대값을 평균 p95로 바꿔 보고하지 않았다.

Canvas20 RSS는 첫 창 약173/174MiB에서 다섯째 약268/266MiB로 증가했다. 각 재경기에서 서버 world dispose/actor·입력·행동·개체 0, 클라이언트 samples/sprites/textures/effects/poses 0을 검사했다. 그래도 짧은 RSS 결과만으로 기존 장시간 보유 참조/메모리 위험이 해결됐다고 주장하지 않는다.

로컬은 20 Canvas 기준/후보 step p95 68.60/108.55ms, 20 Pixi 193.58/373.05ms, 30 Pixi 446.48/302.16ms였다. event-loop max는 0.70~4.91초, 전송 큐는 0이었다. 양쪽 모두 overload1 뒤 입력 대기가 종료됐다. 동일 PC 경합·환경 원인은 확정하지 않았으며 이 창의 CPU/RSS를 정상 전투 A/B로 사용하지 않는다.

### CI 실패·취소 분리

- 기존 `recovery356-identity pixi high`: 헤드슈터 실제 발사·종료·104.728 HP 명중은 확인됐으나 호스트의 160ms recoil pose 표본이 없었다. 두 학생은 recoil을 관측했다. 렌더 성능/표본 시점 원인은 미확정이며 **FAIL**을 유지한다. 기존 Game Feel을 변경하거나 assertion을 삭제하지 않았다.
- 새 `overdrive357-identity pixi low`: 기능10경로 PASS316.222s, 앞선 기존 suite PASS121.259s. 같은 Job의 8분 예산이 업로드 중 소진되어 GitHub 결론 **CANCELLED/TIMEOUT**. 완료된 기능과 Job 성공을 구별한다.
- 기존 pose suite와 새 tier suite를 독립 Job으로 분리했다. 각각 기존 8분 예산·모든 검사를 유지한다. 기존 실패가 새 high 증강 검사를 건너뛰게 하지 않는다. 재실행의 최종 HEAD 상태는 [Draft PR #28](https://github.com/YEOMT/DSbettleroyale/pull/28)에 기록한다.
- Pixi20의 실제 평타 카운터 미증가는 기준·후보 모두 발생했다. 기존 fixture는 클릭 뒤 700ms에 카운터를 검사하며, 이 환경의 rAF p95는 약300~583ms였다. 입력/복구/관측 중 어느 경로인지 충분한 증거가 없어 원인 미확정으로 남긴다. 대기시간 연장·실패 무시·추가 클릭으로 PASS를 만들지 않았다. 기준388.170s, 후보196.129s **FAIL** 기록을 유지한다.
- Job 분리 후 로컬 YAML 파싱/ReleaseOps 7항목 PASS. candidate-status 항목은 Windows 샌드박스가 Git Bash를 거부해 `INFRA_FAILURE`(0xC0000022); 동일 실패 항목만 정상 권한으로 재실행하여 PASS1.730s. 게임/배포 코드는 바꾸지 않았다.

## 남은 위험과 금지 범위

실물 Android/iOS·학교 Wi-Fi·AWS 1GB 환경은 NOT_RUN. 이전 v35.5/v35.6의 SAFE_PAUSED, 결과 수신 지연, SwiftShader 포화, retained reference 및 극한 부하 실패를 이번 패치가 해결했다고 주장하지 않는다. 600/1200초 Deep Audit는 이번 범위에서 NOT_RUN. 성능·CI 결과가 미완료면 전체 완료로 표시하지 않는다.

운영 AWS/Pages/Firebase, 교사 비밀번호, 서버 한도, Secrets, main은 변경하지 않았다(**NOT_DEPLOYED**). [Draft PR #28](https://github.com/YEOMT/DSbettleroyale/pull/28), 브랜치 `codex/v35-7-overdrive-ii`. 전체 인수 완료/성능 무악화/출시 준비 완료로 표시하지 않는다.

## 재현 명령

```sh
npm ci
node tools/ci/plan.mjs origin/main
npm run quick
npm run build
npm run test:targeted
node --test tests/unit/overdrive357.test.mjs tests/parity/overdrive357.test.mjs
CLASSROOM_BUNDLE=1 LOAD_BUILT=1 node tests/combat/overdrive357-identity.mjs pixi high
OVERDRIVE357=1 POLISH_PLAYERS=20 POLISH_ROUNDS=5 node tools/ci/recovery356-pair.mjs canvas low
OVERDRIVE357=1 POLISH_PLAYERS=20 POLISH_ROUNDS=5 node tools/ci/recovery356-pair.mjs pixi balanced
OVERDRIVE357=1 POLISH_PLAYERS=30 POLISH_ROUNDS=3 node tools/ci/recovery356-pair.mjs pixi high
```

Windows에서는 `$env:KEY='value'`로 설정하고, 이 PC의 npm은 `node .local-tools/package/bin/npm-cli.js`로 실행한다. `PLAYWRIGHT_CHANNEL=msedge`를 사용했다.
