# v35.5 — 51 acceptance records

PASS means only the stated automated scope. PARTIAL retains a missing subcase or unresolved performance risk. No physical-device, classroom or long-run stability PASS is inferred. Remote CI is reported independently on the PR.

| ID | Requirement | Status | Executed evidence / limit |
|---|---|---|---|
| A01 | 기준 `main` 및 v35.4 PR #25 상태 확인/보존, 적용 전·후 SHA 기록 | PASS | PR25 MERGED; origin/main a916726 rechecked before commit; preserved clean prior branch. |
| A02 | 활성 86종 영구 ID·등급·기존 특별전 F/S·추첨 확률 불변 | PASS | 86 ID/tier allowlist and original mode/draw rules in Quick; no roster removal/addition. |
| A03 | 일반전·개인전·팀전·점령전의 규칙과 HP/점수·레벨·퀴즈·부활 기본 회귀 통과 | PASS | Quick mode/progression/classroom suites; same-room three-mode live run. |
| A04 | 예외로 허용된 ID/증강만 전투 수치 변경: 86종 최종 profile allowlist 비교 | PASS | Frozen86 projection plus exact scalar before/after allowlist; original goldens retained. |
| A05 | 생성 도감/manifest/display/콘텐츠 hash 최신 실행 동작 정합; `content:check` 통과 | PASS | content:check + paired build; hash b9113f25…8889c. |
| A06 | 서버 60Hz·목표 snapshot 20Hz·기존 백프레셔 및 과부하 보호 보존 | PASS | Quick snapshot/slow-receiver/safe-pause; 60/20 scheduling unchanged.30 load FAIL separately. |
| B01 | 원거리 기본탄 없음; 근접 평타 실제 적중/각도/넉백·WIDE/RAPID 자격 통과 | PASS | Real close profile; HP/speed/radius pinned; WIDE/RAPID eligible, GIANT/MULTI ineligible. |
| B02 | 1.2초 72f / 전방±120° 경계: 0.01초 전·후, ±119°/±121° 테스트 | PASS | Native/rework swept return; ±119/121°,71/72ticks. |
| B03 | 정상 정면 근접 첫 적중 1회 실제 반격; 같은 틱 2명 공격해도 1회 | PASS | Shield contact and two same-tick attacks consume once. |
| B04 | 투사체 1회 반사: 원탄 이동·방향·소유권 변경·원 발사자 피격 가능 | PASS | Same original shot/owner/power; real returned contact plus three browser receipts. |
| B05 | 이미 반사된 탄, 부메랑/장판/레이저/지뢰·도트·폭발 등 비적격 대상 반사 안 함 | PASS | Back/wall/friendly/invisible/reflected/periodic/boomerang rejection; physical dash path. |
| B06 | 반사 성공 시 실제 원 피격 한 번 처리, 가짜 병렬 탄/이중 피해 없음 | PASS | No old deferred buff or fake duplicate shot; native/rework damage regression. |
| B07 | 스턴·죽음·새 생명·복구·재경기 후 예약/남은 패링·반격 0 | PASS | Stun/force/life/expiry cleanup, live disposal across5matches. |
| B08 | 공격자/상대/호스트 Canvas/Pixi의 ‘깡!’ 및 실제 반사 선로 일치 | PASS | Canvas low/Pixi low/high3screens; confirmed source sound once; no human listening/physical device claim. |
| B09 | 아이언월/미러링의 독립 반사·미러링 충돌 우선순위 기존 검사 통과 | PASS | Existing native/rework Iron/Mirror authoritative return tests pass; transport profiles preserved. |
| C01 | 사과 첫 적·벽·상자·거리 도달에서 각 정확히 1회 파열, 벽 반사 불필요 | PASS | Enemy,wall,range and injected valid crate-contact termination each exactly8; actual collision geometry separately checked. |
| C02 | 사과 8파편 각 방향·거리·수명·벽 차단/단일 대상2파편 상한 통과 | PASS | Seeded8directions/radius/speed/range, target-life cap2 before damage; cleanup90ticks. |
| C03 | 사과 다수(20명) 동시 파열에서도 ID 충돌·객체 잔존·중복 피해 없음 | PASS | 20simultaneous terminations=160unique shards; no second end; entities/events zero after90ticks. |
| C04 | 크레파스 4색 순서·각각 고피해/감속/기절/DOT; 빨강·파랑·초록이 기절 유발하지 않음 | PASS | Native final D3.15×player multiplier, four exact coefficients; no common stun. |
| C05 | 크레파스 blue 감속1.5초/yellow기절0.35초/green DOT 4틱 정상 종료, 한 시전 중첩상한 | PASS | Blue90f/.75, yellow21f once, green4ticks/one stack; expiry. |
| C06 | 크레파스 추가탄 증강도 4색 보존 및 기존 원거리 평타에 속성 누수 없음 | PASS | 7shot multicast cyclic colors/shared control budget; ordinary basics have no color status. |
| C07 | 도깨비 3초 실드/공속 유지, 첫 *유효 적* 평타에만 27f 기절, 헛손질 비소비 | PASS | Original15% shield/1.20×180f; invalid hit does not consume. |
| C08 | 도깨비 RAPID/공격 다중 적중/부활에서 기절권 한 번만 소비 | PASS | First valid basic only, same-cast multiple targets; life cleanup. RAPID6f floor separately. |
| C09 | 청소 335×300 실제 직사각형 전방 판정, 뒤/측면/벽 너머 미타격 | PASS | Actual335×300 front rectangle and cover/rear exclusion. |
| C10 | 청소 넉백42 실제 조준 방향·벽 충돌/저항 정책 보존, 피해14·CD8초 동일 | PASS | Direction/42coefficient/no added stun or wall damage; legacy resistance path. |
| D01 | GIANT I/II/III 1.8/2.6/3.4 실제 단일 적용(서버 반경/적중/가이드/UI) | PASS | I/II/III real modifiers/caps, actual body radius and guide diameter, shared cards. |
| D02 | GIANT 크기·테두리 Pixi/Canvas/low 호스트·학생 동등; 바깥 발광은 비판정 | PASS | Three-role Canvas/Pixi low and Pixi high; authority radius rim uses shared primitive. |
| D03 | GIANT III 와벽/상자/근접 시야 culling·swept/interest 경계 오류 없음 | PASS | GIANTIII real wall stop, crate sweep radius and viewport edge inclusion. Representative boundary scope, not all maps. |
| D04 | RAPID 원거리 I/II/III 1.6/2.15/2.75, 근접 1.7/2.3/3.0 실제 cooldown | PASS | Exact tier modifiers/effective cadence plus real accepted action floor checks. |
| D05 | RAPID 기존 피해 보정 유지, 6f 하한과 다른 가속 버프 충돌·중복 공격 없음 | PASS | Original.90/.95/1.055; stacked3×haste still>=6ticks; duplicate action one shot. |
| D06 | WIDE I/II/III 1.6/2.25/3.0 실제 거리; +6/12/20° 및 반각110° cap | PASS | Ranges/angles and110° cap; original per-kit base angle preserved. |
| D07 | WIDE 실제 부채꼴과 조준 가이드 일치, 벽 뒤·후방 타격 없음 | PASS | Shared authority guide; actual front/rear/wall tests. |
| D08 | 3종 모두 III 확정 순간 한 번 FX, ACK/재접속/복구/재경기 때 중복 재생 없음 | PASS | All3 accepted once; duplicate choice no effect; GIANT actual reload no replay; live5match disposal. |
| D09 | III FX 20명 동시 성장에서 CPU/GPU/WS 고주파 부담 유의미 증가 없음 | PARTIAL | 20accepted choices/20FX, bounded650ms; CPU/WS/draw measured. Pixi draw regression signal remains. |
| D10 | EXPANSION/왕귀/HEAVY 등 비대상 기존 값·자격 unchanged | PASS | All other paths pinned byte-for-byte mechanics; original eligibility preserved. |
| E01 | BB 스킬 속도65, A 헤드슈터105, C 슬리퍼55 실제 권위 이동·관통/충돌 통과 | PASS | 65/105/55 final real shot paths; legacy swept/piercing, real3screen casts. |
| E02 | 저격 기존 피해·치명타40/50/30%·사거리·CD·조준 준비 불변 | PASS | Pinned cooldown/damage/windup; existing actual crit RNG/damage tests retained. |
| E03 | 실 SHOT_SPAWN에서만 발사음/섬광; ACK·준비 중 가짜 발사 없음 | PASS | Head windup no sound/SHOT; each confirmed sniper shot exactly1 sound. |
| E04 | 비행 잔상 실제 서버 궤적·충돌 위치, 20Hz 간격 사이 노출·종료 정확 | PASS | Server turn/end segments;9f/150ms thin residual; three-screen terminal frames recorded. |
| E05 | 저격 3종 공격자·상대·호스트 Pixi/Canvas/저화질에서 시각 차별화 | PASS | Canvas/Pixi low/high, attacker/opponent/host. Source glyph identity retained. |
| E06 | 다이너마이트 245/105/42f, 피해·벽 차폐/쿨타임 보존 | PASS | 245/105/42f in actual definition/golden cast; other values pinned. |
| E07 | 탄산 폭탄 blast255/피해≈22, 기존 방사 넉백 유지·이중 폭발 없음 | PASS | 255/22/push25; existing single end/area path retained and golden verified. |
| E08 | 통조림 폭발100/장판145, **v35.4 장판 틱 1.10배를 재적용하지 않음** | PASS | 100/145/thorn4.389/120f; v35.4 actual28cast regression in Quick. |
| E09 | 광역 화면 경고와 실제 server hit radius 및 벽 차폐 일치 | PASS | Three actual onEnd blasts hit expanded edge, reject outside/covered targets; emitted size matches radius, duplicate end inert. |
| F01 | 20명 실제 WS 3모드, 적격 조작·타격·성장·결과·재경기 정상 | PASS | 20WS three modes +2student/host browsers, actions/IIIchoice/results/rematch; Canvas94.341s/Pixi104.600s. |
| F02 | 20명 같은 방 5회 반복/학생 새로고침/부활 후 미송신 상태·이벤트·효과 잔존 0 | PARTIAL | Same20 identities five rounds, eliminated refresh, capture quiz/respawn/new actions, resources cleared. Final follow-up CI pending after clock/lifecycle correction; latest local20 stopped on overload. |
| F03 | 저격 집중·사과 8파편·GIANT III·RAPID III 다수의 동시 최대 shot/event/RSS 수치 기록 | PARTIAL | 160shards isolated peak and live sampled objects/RSS/traffic;30Pixi high failed before measured window. |
| F04 | 서버 step/snapshot/송수신·호스트/학생 FPS p95 비교, 악화/FAIL/NOT_RUN 숨김 금지 | PARTIAL | Same-PC A/B recorded honestly;20draw regression signal;30bothSAFE_PAUSED. No direct GPU timer or1GB target measurement. |
| F05 | 기존 v35.4 탈락자 전투 수신/렌더 중단·승자 3.5초·특별전·장판 조정 회귀 통과 | PARTIAL | Quick354contracts/ground/special rules +live winner/eliminated/respawn; focused remote CI pending at commit. Final follow-up CI pending after clock/lifecycle correction; latest local20 stopped on overload. |
| F06 | commit/push·PR·변경 allowlist·전후 성능/밸런스 표·실패 포함 결과 문서 제출 | PASS | Work branch/PR with source, allowlist, balance, screenshots, failure records. CI result will be linked on PR. |
| F07 | 운영 반영·main 병합 없이 실제 상태 `NOT_DEPLOYED` 표시 | PASS | NOT_DEPLOYED. No merge,AWS,Pages,Secrets,service orcapacity change. |

Counts after first CI and narrow fixes:46 PASS,5 PARTIAL; the required30-player live load separately FAILS. Overall release acceptance is **PARTIAL / DRAFT**, not ALL_PASS. No item was removed.

Evidence: [runtime/failure report](report.md), [balance](balance-before-after.md), [performance JSON](evidence/performance.json), [Canvas](evidence/identity-canvas-low.json), [Pixi low](evidence/identity-pixi-low.json), [Pixi high](evidence/identity-pixi-high.json).
