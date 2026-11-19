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

## 실행 기록 (진행 중)

| 검사 | 상태 | 근거 |
|---|---|---|
| npm ci | PASS | 43s, 70 packages, 취약점 0 |
| 새 집중 검사 + 86종 parity | PASS | focused-03 43/43, 1.559s |
| native 미리보기 parity 보완 | PASS | parity-05 3/3, .888s |
| QUICK I/II·native 돌진 실제 CC·DOT/당김 | PASS | focused-06 3/3, 1.085s |
| 로컬 Quick 첫 실행 | TIMEOUT + FAIL | 300초 종료. 종료 전 434 PASS, 이전 evolution 기대값 1 FAIL. 나머지는 완료 아님 |
| 승인값으로 evolution 기대값 갱신 후 | PASS | 해당 파일 17/17, 2.835s. 기존 검사 삭제 없음 |
| paired build | PASS | 최종 native 분류 수정 후 build-02 Vite 16.86s |
| 실제 브라우저/성능/필수 CI | NOT_RUN/진행 중 | 완료 후 아래와 PR에 기록 |

초기 실패를 보존한다: 집중 검사 초기의 인위적 all-III 스킬 피해 합산 기대값(실제 2.56), growing-zone 가이드 초기 반경/최대 반경 구분, 모아이 등급·비공격 비누 이동기의 native 미리보기 분류를 수정했다. 브라우저 초기 두 실행은 다음 증강 카드 자동 제시를 기다리는 관측 조건과 `aimProfiles.skill.spec` 대신 상위 객체를 읽은 fixture 오류였다. `artifacts/v35-7/attempts/`에 실패 보고를 보존했다.

## 성능 비교 조건

`OVERDRIVE357=1`로 기존 recovery356 A/B 도구를 재사용한다. 정확한 v35.6 Git archive와 수정본의 배포용 클라이언트/서버를 같은 PC에서 순차 실행한다. 동일 seed·동일 인원·입력/공격·실제 브라우저 3화면(학생 2, 호스트 1)·동일 품질을 사용한다. `tests/v35-7/scenario.mjs`의 합법적 5회 선택(III+II) 12개 대표 빌드로 10경로를 모두 포함한다. 첫 학생의 마지막 선택은 실제 UI→WebSocket으로 처리한다.

20인 Canvas low/Pixi balanced 각각 같은 방 5경기(solo/team-elim/capture/solo/capture), 30인 Pixi high 3경기(solo/team-elim/capture). 첫 20인 개인전은 20→6→5→3→2 생존을 유지한다. 기존 결과·재접속·부활·재경기·렌더 자원 정리 assertion을 유지한다. 정지 접촉 fixture 영상/캡처는 성능 개선 근거로 쓰지 않는다.

서버 CPU 시간·step/snapshot p95·RSS/heap·전송량·전송 큐와 각 화면 draw/rAF 간격을 구분한다. 동일 PC의 서버/브라우저 자원 경합은 배제할 수 없다. 단일 A/B의 20% 초과 위험 신호는 PARTIAL이며 반복해 좋은 결과만 선택하지 않는다.

## 남은 위험과 금지 범위

실물 Android/iOS·학교 Wi-Fi·AWS 1GB 환경은 NOT_RUN. 이전 v35.5/v35.6의 SAFE_PAUSED, 결과 수신 지연, SwiftShader 포화, retained reference 및 극한 부하 실패를 이번 패치가 해결했다고 주장하지 않는다. 600/1200초 Deep Audit는 이번 범위에서 NOT_RUN. 성능·CI 결과가 미완료면 전체 완료로 표시하지 않는다.

운영 AWS/Pages/Firebase, 교사 비밀번호, 서버 한도, Secrets, main은 변경하지 않는다. 검토용 Draft PR만 제출한다.

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
