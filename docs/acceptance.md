# 70-item acceptance record

This is an evidence ledger, not a claim that all requirements are complete. **PARTIAL** means some implemented behavior is tested but the full item is not. **FAIL** records an executed check that failed. **NOT_RUN/PENDING** are not passes. The PR remains draft while implementation/fidelity/performance gaps remain. No IMPLEMENTATION_COMPLETE or public-deployment claim.

PASS: 28 · PARTIAL: 39 · FAIL: 1 · NOT_RUN: 2

v33.1 evidence supplement: [Fidelity Repair](fidelity-repair.md). Counts stay unchanged; new actual-browser evidence narrows selected PARTIAL items without proving their entire scope.

Commands: `npm run verify`, `npm run test:e2e`, `node tools/network/run.mjs`, `npm run test:load -- --players=26 --seconds=600`, `node tools/deploy/local-tls.mjs`. Raw local logs are in ignored `artifacts/`; shareable sanitized evidence is retained in `docs/metrics/`.

| ID | Status | Requirement | Executed evidence / limit |
|---|---|---|---|
| A01 | PASS | 기준 원본/원격 commit·blob·SHA-256·build 기록. | docs/baseline.md; remote main rechecked unchanged; raw Git bytes/SHA recorded. |
| A02 | PASS | active77종/영구ID/retiredID와 실제 최종 profile 추출. | tests/baseline/content.json and manifest: final 77 profiles, permanent and retired IDs. |
| A03 | PASS | Node에서 DOM/Pixi/Firebase 없이 engine create/step 가능. | Node engine create/step tests; tools/check-boundaries.mjs. |
| A04 | PASS | 같은 seed·시간·입력에 원본/추출 engine의 규칙·피해 결과 비교. | tests/parity/engine.test.mjs: 77 actual basic+skill, 180 ticks; tolerance 1e-10. Longer/all-build comparisons are separate. |
| A05 | PARTIAL | 전투 RNG와 장식 RNG·방별 RNG 격리. | Two-room RNG isolation passed. Original cosmetic RNG draw consumption remains coupled to combat for parity. |
| A06 | PASS | client/server/content/protocol 간 import 경계 검사. | AST import/runtime boundary check executed by verify. |
| A07 | PASS | 깨끗한 clone에서 npm ci/build/dev/verify 성공. | Independent local Git clone of M5: npm ci, verify (including build), and actual dev client/server proxy startup passed. This was a local clone before GitHub write access was restored; PR CI separately tests remote checkout. |
| A08 | PASS | monolithic eval/iframe/headless production engine 없이 실제 책임 분리. | 26 ordinary production modules / 307 extracted source units; no eval/iframe/browser production engine. |
| B01 | PASS | 교사 생성·QR·6자리 입장·닉네임·학생목록. | Three-mode Edge E2E: teacher auth, room number, student names/list and generated QR canvas. |
| B02 | PARTIAL | 퀴즈TXT·내장문제·정오답/잠금/점수/리롤 규칙 유지. | Quiz parser/default54/custom bank, correct/wrong locks and scoring tested over WS; browser TXT file-picker path not separately exercised. |
| B03 | PARTIAL | 점수0·탭복귀·통신재연결에도 유효 기본 캐릭터 배정. | Zero-score default and session resume tested; 30-second browser background return not exercised. |
| B04 | PASS | 중복/늦은 quiz answer로 점수 중복 증가 없음. | session integration rejects stale/duplicate quiz scoring. |
| B05 | PASS | reroll double tap/응답유실/중복요청의 차감·배정 일관성. | same requestId reuses exact draft result and one debit; stale revision rejected. |
| B06 | PARTIAL | 로비/퀴즈/draft의 교사 kick, 학생 운영명령 위조 차단. | Host-only command rejection and lobby kick/token revocation tested; every kick phase not independently exercised. |
| B07 | PASS | 동일 이름·다른 세션·다중 탭 접속 경계. | Duplicate nickname, token resume and previous-connection supersession tests. |
| B08 | PARTIAL | 같은방 재경기5회, 과거 input/death/offer가 새 경기로 유입되지 않음. | Five rematches and unique match IDs/reset world tested; every old death/offer transport permutation not exercised. |
| C01 | PARTIAL | 77종 무증강 평타·스킬 실제 생성/사용/종료 parity. | All77 basic/skill fixtures execute for180 ticks; exhaustive terminal lifetime and every later status effect not covered. |
| C02 | PASS | HP·이속·스킬 지정값·모드배율·평타 보존. | All77 HP/radius/speed/basic profiles and mode HP multipliers match extracted baseline. |
| C03 | PASS | Lv1→Lv6 누적XP20, 다섯선택·III상한·MAX pending. | XP20 to level6, five actual offers/choices, tier<=III and MAX/pending tested. |
| C04 | PARTIAL | 왕귀S금지·배타·배율1회·상한·재계산 HP 비율. | Wanggui S prohibition/exclusion and repeated HP-ratio recomputation tested; all modifier cap combinations not enumerated. |
| C05 | PARTIAL | 킹모아이·농구왕 환급·좀비 회복·거인12발의 특수검사. | Four named actors are in the77 fixture; special refund/healing/12-shot edge-case assertions not complete. |
| C06 | PARTIAL | 포탑3개·벽·유도·반사·왕복·장판·채널링 실제 처리. | Original native/RW implementation retained and exercised; turret-three, every reflection/return/channel edge not exhaustively checked. |
| C07 | PARTIAL | solo/team-elim 자기장 일반/압축/300ms유예/표시 일치. | Original ring code retained; ordinary/pressure/compression/300ms display parity not all independently asserted. |
| C08 | PARTIAL | capture 2/3/4팀·A/C선활성·B1.5·FEVER2·100%/종료시간. | 2/3/4 teams ×300/360s full fixed-tick timeout and awards; A/C,B1.5,FEVER2 rules tested. Separate100% finish fixture incomplete. |
| C09 | PASS | 부활퀴즈3문제·리롤/keep·life초기화·스폰보호. | Actual WS three-answer respawn, keep/reroll, life/run reset and protection tested. |
| C10 | PARTIAL | 경기전체KDA/점령기여/사용이모지/시상·동점처리. | Original result/award builders wired; award labels/full capture time tested. Whole-match assist/contribution/tie permutations need broader tests. |
| C11 | PARTIAL | 엄폐 통로·연막 공격/피격 노출·지원/은신 구분. | Original concealment/cover mechanics used; dedicated support-versus-hidden visual regression incomplete. |
| C12 | PARTIAL | 상자파괴/픽업/XP보충/사망드롭상한6·일반모드 팀스폰. | Original farm/spawn logic retained; separate crate/pickup/drop-cap6 regressions not complete. |
| D01 | PASS | 실WebSocket으로2브라우저 전체경기 완주. | Edge: teacher +2 isolated student contexts, all3 public modes, quiz/draft/battle/results/rematch. Teacher ends the short browser battle. |
| D02 | PASS | 서버만 physics 실행, 교사 탭닫힘/숨김이 전투를 정지시키지 않음. | Real host socket disconnect leaves server ticks advancing; physics runs only on server. |
| D03 | PARTIAL | move/aim/button 입력 반응·멀티터치 증강 선택. | Restored original release-to-cast, drag power, Q/Space key edges, weak aim toggle and server revalidation. Three browser modes passed; Chromium two-contact movement+augment touch passes in v33.1; physical school-device touch remains unverified. |
| D04 | PARTIAL | lastApplied input seq/tick과 client replay의 실제 일치. | Applied ACK and ordinary replay kernel checked; jitter/held-input alignment is not exhaustively proven. |
| D05 | PARTIAL | 무입력·무외력 10초 정지와 불확실 상대접촉 흔들림 검사. | 600 idle ticks show zero drift without external forces; uncertain body-contact scenarios incomplete. |
| D06 | PARTIAL | 급회전·정지·벽·다중 접촉의 보정 오차 비교. | 840-tick straight/turn/stop/wall parity passed; multi-body/forced-motion correction comparison incomplete. |
| D07 | PARTIAL | own shot preview→authority handoff, 멀티발ordinal 고유. | v33.1 replaces the marker with original-derived volley previews, windup/interval, per-ordinal authority handoff and rejection cancellation. Canvas/Pixi representative suite asserts no duplicated flying bodies. Physical latency and every skill combination remain unverified. |
| D08 | PARTIAL | 한snapshot안에 끝난 탄의 spawn/hit/end·즉시사망 원인. | Reliable spawn/end and synthetic short-shot timeline terminal test; actual native/RW same-snapshot lethal receipt suite incomplete. |
| D09 | PARTIAL | native/RW 유도·왕복·반사·직선탄의 연속성·끝점·중복0. | Added authoritative native/RW path interpolation, turn-corner and bounded remaining-range unit tests. All curved weapon/path/endpoint browser cases are not exhaustively tested. |
| D10 | PARTIAL | hidden actor의 level/name/glow가 남지 않고 위험탄은 필요한 경우 보임. | Concealed actors filtered before snapshot and level tracks reset; dedicated hidden-actor browser capture not run. |
| D11 | PARTIAL | AOI leave와 실제destroy를 구분하고 빠른 재진입 복구. | Snapshot absence does not create a terminal; re-entry uses current state. High-speed AOI roundtrip fixture incomplete. |
| D12 | PARTIAL | clock offset 점프·duplicate/oldframe·pause/resume에서 시간역행/중복피해 없음. | Duplicate/old snapshot, life/warp and monotonic timeline tests passed; clock offset jump/pause matrix incomplete. |
| E01 | FAIL | 20/26/30학생+teacher 실제WS10분. | 20/26/30 students+teacher each completed 600s and seven rounds. 20 passed functionally; 26/30 paused 7/39 times and required CONTINUE, so fail. All cleanup counters zero. Final follow-up 26-player 30s smoke passed; not a replacement for 600s. See docs/metrics. |
| E02 | PARTIAL | 26명 RTT40/100/250ms·지터0/20/60ms. | 26 actual WS connections completed all nine nominal added RTT40/100/250 x jitter0/20/60 proxy profiles. Measured app RTT includes additional host scheduling and differs from nominal targets; both are recorded. Not an OS-shaped exact-RTT test. |
| E03 | PASS | 300/500/1500ms stall 및 연속 회복. | Application-message stalls300/500/1500ms recover and continue advancing; raw network trace retained. |
| E04 | PARTIAL | 1명 느린수신·buffer포화가 타학생의 전투를 막지 않음. | A paused receiver with synthetic queued payload pressure did not stop another actor tick; full comparative gap/FPS workload not run. |
| E05 | PARTIAL | 26명 동시reconnect, backoff·token·session 검증. | 26 simultaneous token reconnects/FULL_STATE passed; browser backoff distribution not measured. |
| E06 | NOT_RUN | 30초 background 후 현재alive/dead/quiz/match 상태 정확 복원. | 30-second real browser background/alive/dead/quiz/match matrix not executed. |
| E07 | PARTIAL | 명령 결과 응답유실 재전송 시 스킬·reroll·증강 중복 적용0. | Duplicate reroll/augment request IDs checked; deliberate response loss for every skill/recast not exhaustively tested. |
| E08 | PASS | 이벤트로그 만료 후 FULL_STATE 복구, 옛공격 재생0. | Expired event ledger gives FULL_STATE/current cursor, without replaying old attacks. |
| E09 | PARTIAL | 동시방2개 RNG·프레임·학생·메모리 격리. | Two-room engine state/RNG/frame isolation passed; concurrent2-room transport/memory soak not run. |
| E10 | NOT_RUN | 재경기/방닫기 반복30분에서 메모리·timer·refs 누적 없음. | Continuous30-minute same-process create/rematch/close leak proof not completed; per-load cleanup counters recorded. |
| F01 | PARTIAL | Pixi/Canvas fallback과low/balanced/high 화면·핵심공격정보 유지. | Pixi E2E passed. Canvas path implemented; quality/fallback capture matrix still pending. |
| F02 | PARTIAL | 모바일세로/가로·PC·resize·reducedMotion·6레벨글자. | Original six-level texture painter and reduced-motion support wired; real mobile portrait/landscape/resize unverified. |
| F03 | PARTIAL | BGM전환/반복·음소거·hit/hurt음 중복 없음. | Original BGM URLs/phase looping and hit/hurt dedupe wired; actual audio playback/transition listening unverified. |
| F04 | PARTIAL | 교사전체맵·방번호·점령화살표·랭킹·종료조작. | Teacher whole-map/room/end verified in browser; focus/leaderboard/arrows wired but not all visual cases asserted. |
| F05 | PASS | 서버tick/build/eventloop/RSS·clientFPS 진단 실제 수집. | Server step/snapshot/eventloop/RSS and browser frame-time collections are real bounded measurements. |
| F06 | PASS | PING RTT·입력ACK·sourceage·positionalerror를 혼동하지 않는 보고서. | Reports separate RTT, server apply delay, accepted/arrival gaps, source tick and world-unit corrections; no one-way/input-to-photon claim. |
| F07 | PASS | 권한위조/room탈취/토큰재사용/이전connection 입력 차단. | Host-only mutations, room/match/life/connection scope, token revocation and supersession tested. |
| F08 | PARTIAL | oversize/NaN/Infinity/초과명령/잘못된ID/malformedJSON 처리. | Malformed/unknown authority fields, numeric schemas and payload limits implemented/tested; every extreme fuzz/ID/rate permutation not run. |
| F09 | PARTIAL | 학교공유IP26명 정상사용은 허용하고 실제flood는 제한. | 26 clients from one loopback IP accepted; per-connection token bucket exists. Sustained hostile flood versus healthy traffic not benchmarked. |
| F10 | PARTIAL | Origin/CORS/TLS·secret/PII/log 노출 검사. | Exact Origin/CORS and local trusted Caddy HTTPS/WSS tested; public DNS/TLS and deployment secret configuration absent. |
| G01 | PASS | 단계별commit·remote branch 실제push·PR URL 검증. | M0-M5 published to codex/ws-migration-v33 through connected GitHub Git-data API; each remote Git tree equals the corresponding local tree. Draft PR https://github.com/YEOMT/DSbettleroyale/pull/1. Follow-up commits preserve original local history. |
| G02 | PASS | PR CI가 실제tests/build 실행, 미실행PASS 없음. | Actual GitHub CI run41462916244 succeeded on source commit165e7b91425236a712fcdf0ab69031851d0dea64: npm ci,116 tests,client/server build,Chromium3-mode E2E,26-player20s WS smoke. https://github.com/YEOMT/DSbettleroyale/actions/runs/41462916244 . Initial Ubuntu26.04 install failure is retained; runner is pinned24.04. |
| G03 | PASS | Pages repo base와assets/QR쿼리·netdebug 링크 검증. | Actual built /DSbettleroyale/ base, entry assets, room query and netdebug browser check passed (artifacts/m5-pages-check.txt). Existing public Pages was not changed. |
| G04 | PASS | production 설정없을 때 기존main/Pages 보존. | Root index.html unchanged; production defaultfalse; main SHA unchanged; no Firebase writes. |
| G05 | PARTIAL | Docker nonroot·Caddy WSS 실제 로컬TLS 또는 지정스테이징 검증. | Actual local Caddy trusted HTTPS/WSS passed. User reports Seoul Lightsail and Docker/Compose installed; no SSH or AWS Docker execution was performed by this work. |
| G06 | PASS | drain 중 신규라운드차단·기존퀴즈/draft/경기완주·timeout강제종료 없음. | Authenticated drain/seal and CLI timeout test: quiz continues to battle/results; timeout undrains without terminating. |
| G07 | PASS | server/client/content protocol일치와구버전안내. | Build/content/protocol exact WSS HELLO checked through local TLS; incompatible handshake rejected. |
| G08 | PARTIAL | 건강검사실패 시release중단·이전image/client짝rollback. | Paired guarded release/rollback scripts and runbook supplied; real Docker/SSH/Pages failure rollback not executed. |
| G09 | PARTIAL | 서버재시작장애의명확한방만료·무한reconnect 없음. | Unknown/revoked token ends resume; client retry bounded60s. Full process-crash browser exercise not run. |
| G10 | PASS | 실제GitHub반영/공개배포/학교실기기검증 상태를 각각 구분해 최종보고. | PR #1 and branch publication recorded separately from executed local tests, unexecuted AWS/public deployment and unverified classroom devices. docs/lightsail-ko.md contains settings and commands; final handoff supplies actual head SHA. |
