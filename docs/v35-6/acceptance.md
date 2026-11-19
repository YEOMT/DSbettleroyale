# v35.6 인수 조건 40개 추적표

기준: [전체 구현 명세](implementation-spec.md) §4의 G01–G14 / B01–B18 / C01–C08. 기준 소스는 `e328aad252e243428123e3d576ea8ffefcdb8604`의 아카이브다. 아래 표는 **로컬 검사를 완료하고 GitHub CI를 제출하기 전의 기록**이며, 완료된 부분시험을 전체 기능·성능 PASS로 확대하지 않는다. 최종 담당자는 새 결과 파일을 확인한 항목만 갱신한다.

- `PASS`: 해당 행에 적힌 실행 범위의 assertion 통과. 실기기·수업 성능을 뜻하지 않는다.
- `PARTIAL`: 일부 근거는 통과했지만 요구 범위 일부 미검증, 실패 기록, 또는 명세 해석의 미해결 차이가 남는다.
- `NOT_RUN`: 해당 후보 검사를 아직 완료하지 않았거나 실행하지 않았다. `대기`는 시험 계획이지 성공 결과가 아니다.
- 개별 실행의 `FAIL`과 `PARTIAL`은 아래 실패 기록에 보존한다. 이후 통과하더라도 삭제하지 않는다.

## 실행 근거

| 근거 | 실행한 범위 / 결과 |
|---|---|
| E1 — `tests/unit/recovery356-feel.test.mjs` 및 기존 mobile-impact / controls-feel / camera-feel | 32/32 PASS, 3.394초. 같은 권위 tick의 중복 반응 병합 보정 후 변경 경로인 recovery356-feel 9/9 PASS, 1.514초. 실제 Pixi Sprite 행렬과 Canvas affine 계수 비교 포함. |
| E2 — `tests/unit/recovery356-balance.test.mjs` | 최종 15/15 PASS, 0.367초. 추가 Burger 증강8발 집중검사1/1 PASS, 0.215초. 최종 HP/보행 목표/CD/카드, 실제 INPUT 이동, 9종 실제 스킬·충돌·피해·표식·정리. |
| E3 — `tests/parity/recovery356.test.mjs`, `tests/v35-6/baseline.json`, 승인 delta 두 파일 | 수정 전 아카이브에서 생성한 불변 86종 기준. 9종의 콘텐츠75개·런타임50개 허용 경로, 나머지77종과 전역 규칙 비교 PASS. 좀비 실제 변위 보정 뒤 콘텐츠 허용 경로75개/런타임50개로 정합화했고 최종 Quick 결과 대기. 이전 golden을 현재 엔진으로 덮어쓰지 않음. |
| E4 — 기존 회귀 경로 | 초기92개 중90 PASS/2 FAIL → 해당 경로41/41 PASS 0.674초. 추가18/18 PASS 0.899초. Roster10 33개 중31 PASS/2 FAIL → 해당 경로33/33 PASS 0.517초. 이후 Quick 422개 중421 PASS/1 FAIL(248.046초), ReleaseOps8/8 PASS. 남은 `polish354.test.mjs`의 v35.4→v35.5 기대값에 승인 v35.6 delta만 추가하고 해당 파일17/17 PASS(1.973초). 초기 기대값 FAIL은 총5건이며 assertion 삭제·전체 Quick 반복 없이 필수 CI 최종 결과를 별도로 기다린다. |
| E5 — `tests/combat/recovery356-balance.mjs` | 고정seed 270조건씩 기준/후보 각각 PASS. 최종 기준29.676초/후보11.209초이며 실행시간차를 CPU 성능 개선으로 해석하지 않음. 1200tick×거리100/340/700×정지/이동×Lv1/Lv3/Lv6 무증강·대표 증강. 실제 명령·피해·CC·스킬 발동 기록. 실제 보행 추가18조건. 좀비 물리 변위 보정 전 후보29.592초 자료도 보존, 보정 뒤 후보만1회 재측정. [전후 수치](balance-before-after.md), [정밀 요약](evidence/balance-comparison.json). |
| E6 — `tests/combat/recovery356-identity.mjs` / `recovery356-grapple.mjs` | 실제 WS 세 화면 Canvas low/Edge12행22.315초, Pixi high/Chrome12행22.819초 PASS. 갈고리 비행 중 재접속5행15.990초 PASS. 초기 축정렬/회전벽·잘못 선택한 버프 fixture FAIL을 보존. 전체6품질 조합 CI 대기. |
| E7 — `tests/combat/recovery356-live.mjs`, `tools/ci/recovery356-pair.mjs` | 기준/후보 Canvas low20×5: PASS103.206/89.036초. Pixi high30: PASS37.775/28.324초. 함수 검사 PASS와 draw 일부 악화 PARTIAL 분리. [10장면 원자료 요약](evidence/local-performance.json). 최종 Linux4개 A/B Job은 CI 대기. |

## Game Feel — 14개

| ID | 명세 요구 | 상태 | 구현·실행 근거와 남은 범위 |
|---|---|---|---|
| G01 | 공격 pose 명료화, 입력 허용·발사 확정·서버 frame 불변 | PASS | E1 서버 actor/미확정 사건 불변, E2 실제 준비·발사 간격 보존. E6 Canvas low·Pixi high 세 화면 실제 공격과 E7 최종20인5경기/30인 단기 조작 통과. 승인된9종 CD·걷기 변경만 별도 적용. |
| G02 | 강타·빠른 베기·단발·연사·버프·저격의 구분 | PASS | E1 heavy205ms, slash105ms, quick85ms 및 recoil/burst/orbit/field/travel 구분. E6 대표 강타·단발·저격 실제 발사와 세 화면 몸체 관측. 도깨비 버프 자체를 공격으로 처리하지 않는다. |
| G03 | MISS 공격 자세만, HIT 확정 대상만 피격 | PASS | E1 명중 확정 geometry 및 target life 검사, 미확정/COMMAND_RESULT 무반응. E6 실제 Canvas low의 세 화면에서 MISS 상대에게 hurt 없음, 실제 HP 감소 대상에게 hurt 있음. |
| G04 | 공격·피격 envelope·축·복원 속도 구분 | PASS | E1 공격/피격 독립 채널, 서로 다른 envelope·방향축, 합성 상한·종료 검증. E6 실제 동시 공격·HP 피격에서 기존 공격 채널 보존. 수정 전에는 heavy가 hit로 덮이는 결함을 E1의 기준 재현으로 확인했다. |
| G05 | 실드 전량 흡수·실제 HP·반사 반응 구별 | PASS | E1 amount0/absorbed에는 HP hurt 없음, 실제 SHOT_TURN returned+life로 반사 반응. E6 Canvas low 실드 HP 불변/피격 자세 없음 및 기존 테두리 사건, 실제 권위 반사·원탄 방향 전환 관측. |
| G06 | DOT/연사 수십 타격의 bounded coalescing | PASS | E1 DOT는 전신 hurt를 만들지 않으며 30회 짧은 피격은 같은 envelope를 연장하지 않고 강도만 상한 내 병합. 400개 malformed/중복 입력에 채널96·발사 ledger192 상한 확인. 이것이 다자 프레임 성능 PASS를 의미하지는 않는다(G13). |
| G07 | 실제 wall contact만 1회 압축·반동, wall-near 제외 | PASS | 기존 `heavy-wall` 권위 접촉 법선 사건 재사용. E1 cast/life 중복·미확정·일반 impact·근접만으로는 생성하지 않음. E6 교정 후 실제 접촉1회, 근접 무접촉0회 관측. 초기 벽 fixture 실패는 아래에 보존. |
| G08 | 표시 오프셋이 위치·판정·넉백·피해에 무관 | PASS | E1 actor deep equality, 실제 impulse life/end guard, 회전≤0.10rad·이동 그림 오프셋≤2CSS px·벽≤4CSS px, low 오프셋0 검증. E6 벽 충돌 HP 불변. 실제 피해/좌표를 고치는 연출 코드는 추가하지 않음. |
| G09 | 방향 이동·보간·벽·거점·카메라 스케일과의 일관성 | PARTIAL | 방향축·zoom·LOD·동일 affine 단위검사와 로컬20인5경기(점령 포함)/30인 연속 플레이 통과. 주관적 명료성·실물 터치/카메라 조작감은 미검증. 정지 캡처만으로 개선을 주장하지 않는다. |
| G10 | 생명 변경·탈락/부활·리롤·재경기·재접속 pose 정리 | PASS | 생명/사망/부재 actor 단위검사, 실제 갈고리 비행 중 동일 학생 재접속, 20인5경기의 탈락·부활 퀴즈·리롤·복귀 입력·결과/재경기 통과. 최종 pose9맵·렌더 자원·서버 월드/큐 정리 확인. |
| G11 | Canvas/Pixi × host/student × low/balanced/high | PASS | 최종 런타임(sourceHash ea84952) Linux CI44384120024에서 Canvas/Pixi×low/balanced/high 6Job 모두 PASS. 실제 WS 공격자·상대·호스트의12행 및 Canvaslow 갈고리 재접속5행 통과. 실물 기기는C08 별도. |
| G12 | reduced-motion 존중, 새 고비용 필터·파티클 없음 | PASS | E1 reduced-motion 반환 중립 및 모든 채널 정리, 기존 텍스처/스프라이트 재사용 검증. 필터·셰이더·새 파티클 시스템 추가 없음. 동일 최종 게임 소스의 CI44384120024 여섯 identity 조합에서 reduced-motion 행도 실제 PASS. 초기 미도달 기록은 보존한다. |
| G13 | 학생/교사 render·draw·RAF·자원·server event bytes A/B | PARTIAL | 최종 Linux4개 A/B 함수 검사는 모두PASS. Canvas20/Pixi20/Pixi30 성능PARTIAL, Canvas30은PASS. 20Pixi team-elim CPU124.34→242.78ms/s, snapshot2.77→4.97ms;30PixiRSS305.88→372.52MiB. 다른개선/악화도 ci-performance.json 전20구간에보존. 단일실행으로패치인과/전체성능개선을확정하지않음. |
| G14 | 헤드슈터 실제 발사·잔상·명중 유지, 전용음 검사 제외 | PASS | E6 Canvas low 세 화면의 `emoji-023`: 실제 SHOT_END, transit 잔상, 상대 HP 감소와 recoil 관측. E4 v35.5 기존 전투 수치 유지. 전용 발사음1회는 사용자 제외 사항이며 기존 사운드를 맞추기 위해 변경하지 않음. Pixi 전체 가시성은 G11에서 별도 추적. |

## 전투 밸런스 — 18개

| ID | 명세 요구 | 상태 | 구현·실행 근거와 남은 범위 |
|---|---|---|---|
| B01 | 대마법사 최종 runtime/카드 변경 일치 | PASS | E2/E3: CD990tick(16.5초), 일반 반경27/마지막35, 카드·aim width54·실제 탄 동일. HP514.2075·보행 목표3.724 유지. |
| B02 | 폴아웃 최종 runtime/카드 변경 일치 | PASS | E2/E3/E5: HP459→500, 표시1.30→1.40, 보행 목표4.034333→4.344667, 실제60tick 이동235.7175→253.8496. 장판290. |
| B03 | 역병군주 최종 runtime/카드 변경 일치 | PASS | E2/E3: 시작160/최대380/성장90tick, HP460·CD1020tick 유지. 생성 카드와 실제 zone 확인. |
| B04 | 마운틴 팀 최종 runtime/카드 변경 일치 | PASS | E2/E3/E5: HP436.242→475, 실제 기준 표시1.296→1.48, 보행 목표3.724→4.252716, 실제60tick217.5854→248.4771, CD450tick·pull38. 명세의 약1.30 대신 기준 실제1.296 기록. |
| B05 | 볼링 챔피언 최종 runtime/카드 변경 일치 | PASS | E2/E3: HP320.173425→360, CD945→720tick. 스킬 피해21 유지. |
| B06 | 버거 캐논 최종 runtime/카드 변경 일치 | PASS | E2/E3: HP334.7267625→360, 스킬 거리650→720·탄간각0.145→0.125. 기본 산탄/피해/9초CD 유지. |
| B07 | 사냥꾼 최종 runtime/카드 변경 일치 | PASS | E2/E3: HP305.6200875→340, 실제 기준 반경10.4→12(명세 약10), 속도42, 표식300tick, CD570tick. |
| B08 | 좀비 최종 runtime/카드 변경 일치 | PASS | 표시1.18→1.37, `brBaseWalkingSpeed=3.20`, 기존 응답·감쇠를 보상하는 `brHumanMoveSpeed=3.2722051282051283`, 실제 정상 변위3.20/tick을 E5에서 구분해 측정. 좀비만 `walkDriveScale=1.0225641025641026`. HP450·69tick·재생21% 유지. 최종 생성 카드 정합성은 업데이트된 E2/Quick로 확인한다. |
| B09 | 비눗방울 놀이 최종 runtime/카드 변경 일치 | PASS | E2/E3/E5: HP187.5→240, 표시1.50→1.70, 보행 목표4.039875→4.578525, 실제60tick236.0413→267.5134, 스킬 속도10/반경34/turn0.035. |
| B10 | 나머지77종 전투 값·ID·등급 golden 불변 | PASS | E3 77종 전체 콘텐츠/런타임 정밀 비교, 86종 기본 평타·ID/이모지/등급·전역 성장/증강/모드 불변. 승인 delta의 before도 수정 전 불변 baseline과 검증. |
| B11 | 대마법사14발/4f/피해/고정 방향, 가이드 일치 | PASS | E2 및 E4 classroom-balance-aim: 준비10tick, 14발, 매4tick, 피해11.55/17.85, 속도31.5, 27/35 반경, 크기 증강1회, 유도 없음. 실탄 가장자리 hit/miss/벽·가이드/profile 검증. |
| B12 | 폴아웃 오염만 확대, 폭발·DOT·사망 폭발 유지 | PASS | E2: 최초36tick 폭발290/86.1, 오염290/11.55·150tick·30tick 간격 총5회, 사망180/30 한 생명1회. v35.4 장판1.10 중복 적용 없음. |
| B13 | 역병 생성160, 90f에380, 300f 유지 | PASS | E2: 생성160·45tick270·90tick380, 30tick마다 피해15.862·총10회, 300tick 종료. 단일 poison·개수/CC 관련 비대상 값은 E3 불변 비교. |
| B14 | 마운틴 첫 접촉·벽·시야·이동시간·거리·재접속 | PASS | 기존 단위검사의 첫 플레이어/아군/벽/상자/포탑/제거 앵커·거리·무공격 판정을 유지. 신규 실제 WS에서 x108 갈고리 비행 중 reload, 동일 member/life/entity 및 epoch1→2, 이동38/tick·첫 벽 안전도착·복귀후 키 이동/평타·host발사 수신·재경기 정리 PASS15.990초. 실물 네트워크는 미검증. |
| B15 | 볼링 피해21·대상당1회·벽 종료·CD720 | PASS | E2/E4 실제1발 직선 관통, 반경36·밀침42·피해21, 각 대상 hit1회·기절0·벽에서 종료, CD720·생성 카드 일치. 피해26은 적용하지 않음. |
| B16 | 버거5발/피해·각도·근거리/먼거리·추가발·넉백1회 | PASS | 실제 기본5발·각도.125·거리720·피해18.9·밀침1회 유지. 지원 증강 선택을 통한 MULTICAST I/II/III 실제6/7/8발, 비정상추가99도8발로 제한됨을 검사. 기술 countCap9와 전역추가탄상한3 때문에 실제최대8인 기존 규칙을 구분하며9발을 발사했다고 주장하지 않는다. |
| B17 | 사냥꾼5초 표식·3충전·평타당1회·벽/생명 정리 | PASS | E2 원탄42/12 실제 명중, 표식 생성 tick+300·충전3·bonus17, 동일 평타 중복 소비 없음·3회 뒤 무한 강화 없음. 벽·은신 대상 차단, life 변경 및 owner 정리 검증. |
| B18 | 좀비 실제3.20unit/tick, 비눗방울 왕귀·유도 경계 | PASS | 첫 구현의 base3.20은 최종 변위3.129388164…였음을 발견하고 자료를 보존했다. 좀비만 `walkDriveScale=(1−.22×.92)/.78`을 적용하여 base3.20/drive3.2722051282051283/실제3.20으로 수정. **전역 입력 응답.78·잔존.22·감쇠.92는 그대로**이며 E5 실제 INPUT의 tick60 변위는 기준2.685232381→후보3.1999999999999886, 60tick 총 이동160.432535→191.187964다. E2 비눗방울 유도0.035 상한·벽/은신/수명 정리·평타유도0.025/기절0 유지, E4 왕귀I/II/III 실제 HP/피해, E5 왕귀II/III 대표 조건 포함. |

## 수업·성능 — 8개

| ID | 명세 요구 | 상태 | 실행 근거와 남은 범위 |
|---|---|---|---|
| C01 | 일반/개인전·팀 생존·점령·F전·S전 | PASS | Quick 기존 실제 WS solo/team-elim/team-capture 및 같은방5회 회귀 통과. 후속polish35417개에서 normal/F/S 전환·팀 점령/부활 특별전 통과. E7 실제20인 연속5경기 일반모드 완주. |
| C02 | 20WS+실제 화면, 6→5→3→2→1·결과/재경기/부활 퀴즈 | PASS | 최종 Canvas low20명·호스트+학생2 화면5경기 PASS89.036초. 20→6→5→3→2→1,3.5초 승리창·결과,탈락 렌더중단·부활퀴즈/리롤·복귀조작·동일방재경기와연결20/자원정리 확인. |
| C03 | 30 Pixi high 단기·20 Pixi balanced5·Canvas low5 | PASS | CI44384120024 최종4개 A/B 모두함수PASS:20Canvaslow5경기,20Pixibalanced5경기,30Canvaslow단기,30Pixihigh단기. 모든연결/과부하0/측정끝점buffer0/결과/재경기·자원정리 확인. 기준30Pixi의일시buffer104224B/queue73290B는별도보존하며지속0을뜻하지않음. 성능개선은G13/C05별도PARTIAL. |
| C04 | 60Hz/20Hz와 짧은 snapshot 재생 보존 | PASS | 60Hz/목표20Hz·보호값 변경없음. 최종 로컬20/30명의 실제서버 step/snapshot/bytes 및 화면재생·버전·입력·연결 검사 통과. 20Hz 목표를 항상 달성하거나 지터가없다는 보장은 아니며 성능은G13/C05별도. |
| C05 | 저사양 학생 p95·교사 draw 악화 분리 | PARTIAL | 최종CI4개중3개는상대지표20%초과신호가있어performancePARTIAL.20Pixi CPU/snapshot·30PixiRSS 악화값을보존하며원인미확정. 로컬Intel IrisXe/Edge 및 LinuxSwiftShader 수치와실물저사양태블릿을구분. 그래픽/FPS/보호를낮추지않음. |
| C06 | 86종·6레벨/증강·Overdrive III·왕귀·F/S 추첨 | PASS | 86종/기존77종·전역golden 및왕귀/6레벨/증강, GIANT/RAPID/WIDE III단위회귀, 고정270조건, 최종20인5경기의 실제Lv6/III획득 사건·부활·리롤 통과. 전체86종 화면전수는 수행하지 않음. |
| C07 | 기존3.5초 승리 사건 늦은 도착 위험 보존 | PARTIAL | **알려진 위험 유지, 해결 주장 없음.** 기존 사건의 `startedAt→showResultsAt=3500ms`를 바꾸지 않는다. 늦게 수신되어 창이 이미 끝난 경우 `KNOWN_LATE_RESULT_C07`의 FAIL/PARTIAL과 수신/서버 시계 기록을 보존한다. timeout 연장·승리창 재생으로 숨기지 않는다. 기준 이번 일부 시험이 PASS여도 기존 실패 기록은 유효하다. |
| C08 | 실기기·학교 Wi-Fi·AWS1GB·600/1200초 Deep 구분 | NOT_RUN | 실물 iOS/Android, 학교 Wi-Fi, AWS1GB 실부하, 600/1200초 Deep 모두 이번 작업에서 실행하지 않음. 운영 서버 접근·덤프·재시작·배포도 하지 않음. 짧은 합성/로컬 브라우저 시험을 실제20~30명 수업 검증으로 표현하지 않는다. |

## 실패·부분 실행 보존

1. **수정 전 실제 결함 `FAIL_REPRODUCED`**: `artifacts/v35-6/feel-before.json`. 공격 중 서버 확정 HP 피격이 단일 active 항목을 hit로 덮었다. 독립 공격/피격/벽 채널로 수정하고 E1로 회귀 검사했다.
2. **최초270조건 A/B `PARTIAL`**: 기준28.412초/후보28.877초. 하네스가 tick마다2개 action을 넣어 정상1개 소비 큐에서 후속 skill을 굶겼고 undefined 발동 번호를 한 번으로 세었다. 게임 큐/보호를 바꾸지 않았다. 명령 교대·수락/빈 큐 assertion 추가 후 동일 조건 한 쌍을 재실행했다. `artifacts/v35-6/balance-*-initial-partial.json` 보존. 이후 B18 실제 변위 차이 수정 때문에 후보만1회 재측정했으며, 보정 전 후보·요약을 `balance-candidate-pre-walkfix.json` / `balance-comparison-pre-walkfix.json`으로 보존했다. 기준은 추가 반복하지 않았다.
3. **기존 기대값 FAIL5건**: 대마법사 탄 반경, PR18 볼링 digest와 승인 CD/HP, 마운틴 표시속도, Roster10 HP 및 v35.4 전체 로스터 기대값 중 실패한 assertion을 승인 delta 방식으로 정합화했다. 마지막 Quick 실패는 `polish354.test.mjs`가 `expected355`만 적용해 승인된 대마법사 차이를 거부한 경우이며 `expected356(expected355(...))`로 확장했다. 이전 golden과 모든 assertion은 그대로이고 E4의 실패 관련 파일만 재실행했다. Quick 전체를 다시 통과했다고 기록하지 않는다.
4. **Canvas identity 초기 FAIL 20.793초**: 벽 접촉 fixture에서 예상 벽측 좌표 assertion 실패. `artifacts/v35-6/identity-canvas-low-initial-fail.json` 보존. 단위·이후 부분 실행의 실제 접촉 PASS와 초기 실행 FAIL을 분리한다.
5. **Canvas identity 다음 FAIL 25.533초**: `emoji-148`의 순수 보호막 스킬에 공격 몸체 pose를 요구했다. 앞선9개 부분행은 통과했지만 전체는 FAIL이며, 설치/버프가 명중을 암시하지 않아야 한다는 명세에 맞춰 fixture 교정 중이다. 최종 재실행·다른 렌더러 결과 확인 전 전체 성공으로 집계하지 않는다.
6. **균형 결과의 한계**: 고정 +X 조준/실제 넉백 조건 합산 피해는 볼링−2.582%, 비눗방울−2.620%다. 결과를 숨기거나 유리한 표본까지 반복하지 않았다. 명중한 조건 수는 발별 명중률/학생 승률이 아니다. E5의 시간은 엔진 검사 실행시간이며 FPS 개선 근거가 아니다.

## CI 제출 시 남은 범위

- 최종 GitHub Quick/Targeted/required-checks와6개 표시조합·4개연속A/B Job 결과는 PR에 기록한다. 로컬 Quick 최초421/422 및 해당 실패 경로17/17 후속 통과를 전체 Quick 성공으로 덮지 않는다.
- local-performance.json은 sourceHash37d530c5의 전후10장면 원자료 요약이다. 불필요한 Canvas 변환 검토 결과와 최종 CI 계측을 구분한다.
- 기존 C07, 실기기/학교Wi-Fi/AWS1GB/600·1200초 미검증, 고정 봇 피해 감소와 초기 fixture 실패는 그대로 유지한다.

- 최종게임코드의QuickCI:8+422 전부PASS(일반236.663초),Python31PASS,buildPASS. 변경9종 Canvas/Pixi6샤드·터치·Canvas복구·Pixi로스터복구·Roster10·격리배포 시험도 통과. Pixi controls복구와 Targeted의 완료 상태는 아직 확인 중이다. 기존live-feel observer4Job은독립hurt채널을못찾아FAIL; 실제image/sample인수를그대로전달하고렌더된3채널을관측하도록수정,로컬11가족×3화면+재경기2회PASS30.801초. HIT/contact/타임아웃은유지하며최종필수CI는PR에기록한다.
