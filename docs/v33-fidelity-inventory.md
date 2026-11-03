# v33.2 원본 fidelity inventory

기준 main: `9619942fb55eb5a96c9d6fea69f76fc99d12bbf0`. 원본 blob `4e6845b4565170ee2c84e75c0eee5dcc4f98ceac`, SHA-256 `a006aa596c5640ffe127774f271fce7afce81a4769525979fa453f9107ac5d36`; root/legacy Git bytes 일치. 기존 source-map(307 units), v33.1 문서·증거 및 70개 인수 기록을 확인했다.

**I0는 커밋 `32d4a69`에 보존한 구현 전 감사 목록이다. 아래는 실행 증거를 연결한 v33.2 감사 결과다.** PARTIAL은 v33.1의 좁은 증거이며 v33.2 전수 동등 판정이 아니다. FAIL은 확인된 소스/표시 차이 또는 기존 실행 실패. UNVERIFIED는 직접 확인하지 않음. BY_DESIGN은 요청된 서버 권위 인증 차이만 해당한다. 기능 삭제를 의도된 차이로 분류하지 않는다. 상태는 해당 행의 시험 범위에만 적용한다. 전체 화면의 픽셀 동등이나 학교 실기기 검증을 뜻하지 않는다. 원본 함수명은 마지막 실행 정의와 콜 사이트를 추가 추적한다.

## 접속/방

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| A01 | 홈·학생 우선 카드·교사 생성 | brInit / #br-home / .br-home-layout | ui/app.js, index.html | PARTIAL | 홈 캡처 4 해상도 | v33.2 / L: 홈 4해상도 캡처, 비밀번호 입력 추가는 A02 |
| A02 | 교사 인증 | brCreateRoom / #br-create-btn | net/connection.js, ui/app.js | BY_DESIGN | 서버 비밀번호 인증; 원본 Firebase 호스트 권한 대체, WS 명세 요구 | v33.2 / T1/L: 요청된 서버 권위 교사 인증; 원본 Firebase 권한 대체 |
| A03 | 6자리 방·QR·초대 링크·닉네임 | brRenderHost / #br-room-code,#br-qr,#br-join-code | ui/app.js | PARTIAL | QR URL 디코드→학생 입장 | v33.2 / L: 6자리 초대 URL/QR canvas; 실제 카메라 스캔 UNVERIFIED |
| A04 | 출결·팀·점수·준비·퇴장 | brRenderHost / #br-host-roster | ui/app.js | DIFF_FIXED | 로비/퀴즈/배정에서 표시 및 kick | v33.2 / L/T1: 20명 목록·10:10 팀·교환·복구; kick/resume 실제 WS |
| A05 | 재접속·중복 탭·방 만료 | brWatchRoom / brReturnHome | net/connection.js | PARTIAL | 연결 끊기/복구와 HOME/종료 메시지 | v33.2 / T1/T2/Q: 재접속·epoch·중복탭; 현장 장기 단절 미검증 |
| A06 | 단계 표시·교사 설명·학생 대기 | brRenderHost,brRenderStudentWait / #br-host-stages | ui/app.js | DIFF_FIXED | 현재 단계 active/설명/학생 대기 누락 대조 | v33.2 / L/Q/D: 원본 stage/설명/참가완료 표시 |

## 설정

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| B01 | 모드별 팀/지도/시간 가시성 | brModeControls / #br-mode,#br-tk-lobby-rules | ui/app.js | DIFF_FIXED | 3모드 전환 시 필드 표시·설명 | v33.2 / L: 3모드 실제 선택 및 disabled/rules |
| B02 | 지도 5개·무작위·점령 전용 지도 | brReadSettings / #br-map | rooms/room.js, ui/app.js | PARTIAL | 선택→실제 mapName | v33.2 / T1: map parity; C/H: 실제 점령/생존 map, 모든 지도×화면 전수는 미검증 |
| B03 | low/balanced/high 품질 | brGraphicsProfile / #br-graphics-preset | render/renderer.js | PARTIAL | DPR/품질별 Canvas·Pixi 캡처 | v33.2 / V: 3품질×2backend; H: 관전 high/balanced; 실제 고DPR 기기 미검증 |
| B04 | TXT 업로드·형식 오류·프리뷰·기본문제 | brRenderQuizImport,brValidateQuestionText / #br-quiz-preview | ui/app.js, rooms/room.js | DIFF_FIXED | 파일 선택·잘못된 행·54문제 복귀 | v33.2 / L: 잘못된 행 프리뷰+유효 행 적용+54문제 복귀; 기존 WS 200KB 제한 유지 |
| B05 | 설정 기본값·모드 규칙 설명 | brReadSettings / #br-host-settings | ui/app.js | DIFF_FIXED | 원본 값/선택 상태 비교 | v33.2 / L: 모드별 설정/규칙, 서버 config 반영 |

## 퀴즈

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| Q01 | 학생 숫자/원형 진행률 | brUpdateQuizClock / #br-quiz-timer span / --br-progress | ui/app.js | DIFF_FIXED | 45/60/90초 실제 WS: span 보존/색/진행률 | v33.2 / Q: 45/60/90 span·원형 진행률 |
| Q02 | 교사 시계 가시성 | brUpdateHostQuizClock / #br-host-clock | ui/app.js | DIFF_FIXED | QUIZ에서 숨김 해제, 다른 단계 숨김 | v33.2 / Q: 실제 교사 clock 가시성/단계 숨김 |
| Q03 | 서버 마감·자동 DRAFT | quizEndsAt / RoomManager.sweep | rooms/room.js | PASS | 20학생×45/60/90초 실제 경과 | v33.2 / Q: 교사+20 WS 실제 제한시간→DRAFT |
| Q04 | 재접속·숨김/복귀·재렌더 타이머 | brNow,brUpdateQuizClock | net/clock.js, ui/app.js | DIFF_FIXED | 새 마감 생성/시간 연장 없음 | v33.2 / Q/T1: 같은 마감 재접속·숨김/복귀, 재렌더 연장 방지 |
| Q05 | 정답·오답·잠금·보기 피드백 | brAnswerQuiz / .br-choice | ui/app.js, rooms/quiz.js | DIFF_FIXED | 정오답 색/문구/1.5초 잠금 실제 클릭 | v33.2 / Q: wrong 1.5초/correct 320ms 실제 응답 뒤 색/잠금 |
| Q06 | 점수·리롤·진행·교사 정답수 | brRenderHost,brRenderQuiz / #br-quiz-score | ui/app.js | PARTIAL | 3정답 리롤·교사 실시간 목록 | v33.2 / Q/T1: 정답·점수·리롤 규칙; 전체 퀴즈 시각 조합 미검증 |

## 배정

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| D01 | 카드 등급/이름/설명/스킬/색 | brRenderDraft / .br-draft-card | ui/app.js | DIFF_FIXED | 77 카드의 텍스트와 대표 캡처 | v33.2 / D: 77 카드/77 도감 원본 DOM 정확 비교 |
| D02 | 리롤·확정·대기·확률·스테이지 | brRenderDraft / #br-reroll-btn,#br-ready-btn | ui/app.js | DIFF_FIXED | 리롤 중복/확정 후 비활성/전환 | v33.2 / L/D/T1: 학생·교사 배정 복구/리롤/확정·확률·대기 |
| D03 | 카드 뒤집기·리롤 연출 | brRenderDraft / .rolling | ui/app.js | PASS | 원본 애니메이션 타이밍 대조 | v33.2 / D: 마지막 brRenderDraft 실행 정의에 rolling 적용 없음; 오래된 CSS만으로 효과가 있었다고 판단하지 않음 |

## 관전

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| H01 | 생존자 bbox 자동 중심/줌 | GameWorld.draw,brPixiHostFrame | render/renderer.js | DIFF_FIXED | 20→10→4→2→1 위치/줌 trace | v33.2 / C: 9000 frame camera trace; 20→10→4→2→1 |
| H02 | 일반/브로드캐스트/성능 정책 | getHostBroadcastMode,brPixiHostFrame | render/renderer.js | DIFF_FIXED | 인원별 모드·padding·scale/ease | v33.2 / C: auto/normal/broadcast; 원본 Canvas hidden zoom 차이는 evidence 참조 |
| H03 | 학생 집중 토글/타깃 | BRMP.focusPlayer / #br-focus-toggle | ui/app.js, render/renderer.js | DIFF_FIXED | 최고킬 대신 첫 human 대상; 1.12 배율 | v33.2 / C/T1: 첫 human target, 1.12 easing |
| H04 | 점령전 HUD 예약 viewport | brCaptureViewPort / .br-capture-host | render/renderer.js | DIFF_FIXED | 16:9/4:3 전체 경계·상단126/하단48/좌우24 | v33.2 / C/H: 실제 점령 map bounds + HUD 여백 |
| H05 | 점령전 집중 토글 무효 | brCaptureMode / #br-focus-toggle | ui/app.js | DIFF_FIXED | 숨김+직접 handler 호출 시 무효 | v33.2 / C/H: capture focus 무효/숨김 |
| H06 | 이벤트 포커스·최종2·종료 easing | GameWorld.focusPoint/focusTimer,brPixiHostFrame | engine presentation / camera | PARTIAL | 서버 표시 전용 메타데이터 필요 여부 조사 | v33.2 / T1: final/end/event 주입 분기; 원본 eventFocusPos 양수 writer 미발견 |
| H07 | 관전 HUD·모드·시간·생존자 | updateHUD / #hud-overlay,#hud-mode-title | ui/app.js, render/renderer.js | DIFF_FIXED | 교사에게 학생 HUD가 대신 보이는지 | v33.2 / H: 실제 교사 HUD, 학생 HUD 분리 |
| H08 | 킬피드·실시간 순위·팀점수 | brTKRenderLive,brTKRenderBoard,host kill feed | ui/app.js | PARTIAL | 실제 처치 이벤트→feed/순위 | v33.2 / T1/H/R: 원본 board/feed 연결; 모든 연속처치 시각 조합 미검증 |
| H09 | 방번호·종료·랭킹 팝업·겹침 | brHostLive / #br-host-live,#br-tk-leaderboard | ui/app.js, original.css | DIFF_FIXED | 1366/1920/1024x768 영역 검사 | v33.2 / H: 5viewport bounds, capture 점수/music 겹침 제거, rank popup |
| H10 | Canvas/Pixi 및 DPR 동일 정책 | GameWorld.draw,brPixiHostFrame | render/renderer.js | DIFF_FIXED | 각 백엔드 실제 draw 중심/줌 비교 | v33.2 / C/H: 실제 Canvas/Pixi 공통 camera; 원본의 서로 다른 actor/HP 경로 유지 |

## 학생 HUD/조작

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| S01 | HP/이름/등급/지도/리롤/인원 | brUpdateStudentHud | ui/battle.js | DIFF_FIXED | v33.1 reference 유지 | v33.2 / T2: 동일 WS self state 원본 HUD 비교 |
| S02 | 평타·스킬 쿨타임/잠금/채널/재시전 | brUpdateStudentHud / --br-cd-angle | ui/battle.js, input/controls.js | PARTIAL | 서버 승인 상태/시각/입력 각각 측정 | v33.2 / T2/V: 잠금·채널·재시전·실제 입력; 모든 스킬 전체 지속시간은 미검증 |
| S03 | 레벨/XP/5선택/왕귀/증강 카드 | brRenderRunHud,brRunCard | ui/augments.js | PASS | 기존 63카드/MAX/이동터치 회귀 유지 | v33.2 / T2: 63 카드·5선택/MAX·effect/detail·왕귀 |
| S04 | 조이스틱·릴리즈 발사·drag power | brBindControls / .br-control | input/controls.js | PARTIAL | 키보드/마우스/2접점 가상 touch | v33.2 / T2: mouse/keyboard/가상 2접점; 실제 모바일 터치 UNVERIFIED |
| S05 | 조준 보정·공격 예고·키 바인딩 | brResolveAimHelp,brDrawAim | input/aim.js, controls.js, renderer.js | PARTIAL | 수동 우선/취소/단발/방향 표시 | v33.2 / T1/T2/V: 보정/취소/단발·예고; 모든 수동입력 경로 미검증 |
| S06 | 기절·버프·보호막·표식 | wirePlayer,brPaintReworkStatus | presentation/timeline.js, renderer.js | PASS | 무스턴10초/30·60tick 및 상태 겹침 | v33.2 / T2/V: idle10초, 30/60tick stun, 30/60/120 simulated FPS |
| S07 | 자기장 경고·방향·압축/노출 | brZoneHUD,brDrawStudentFrame | ui/battle.js, renderer.js | PARTIAL | 경계 안/밖/수축/연막 노출 화면 | v33.2 / H/T2: 원본 ring HUD/경계/방향/화면 경고 연결; 모든 수축단계 브라우저 전수 미검증 |
| S08 | 사망/부활 퀴즈/보호/선택 | brTeamKillSelf,brTKRenderSelf | ui/app.js | PARTIAL | 3정답 keep/reroll 실제 브라우저 | v33.2 / T1/T2: 실제 respawn 3정답·keep/reroll; 모든 사망원인 화면 전수 미검증 |
| S09 | 점령 HUD/거점/화살표/기여 | brCaptureHUD,brCaptureObjectiveArrows | ui/battle.js, render/objectives.js | DIFF_FIXED | 원본 좌표/방향/120초 회귀 | v33.2 / T2/H: 원본 HUD/화살표/120초/내 기여/연결 확인 문구 |
| S10 | 복귀·연결지연·화면 흔들림 선호 | brStreamHud,brRenderPlayPrefs | net/connection.js, renderer.js | PARTIAL | 숨김30초/리사이즈/설정 지속 | v33.2 / Q/M/T2: 숨김/복귀·선호 저장; 실제 OS 강제종료/저전력 복귀 미검증 |

## 전투 표현

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| V01 | native 스타일/꼬리/회전/크기 | brDrawProjectileGlyph | render/projectile.js | DIFF_FIXED | 기존 실제 WS native 픽셀 비교 | v33.2 / T2: 학생 native raster; H: 관전 전용 projectile 원본 draw 복원 |
| V02 | RW 스킬 60종/native 17종 | brPaintReworkEntities / final definitions | render/original-painters.js | PARTIAL | 77종×3품질×2backend 표시 호출/캡처 | v33.2 / V: 77×3×2=462 WS 공격/스킬·RW/status raster; 전체 씬/긴 스킬 전과정 pixel parity 아님 |
| V03 | 예상탄→권위탄 ordinal/종료 | brReworkLocalStart,brShortShot | presentation/previews.js,timeline.js | PASS | 기존 12발/중복0/거절 회귀 | v33.2 / T2: 12 ordinal·중복0·거절·terminal path |
| V04 | 반사/유도/왕복/관통/빔/포탑 | brRecordFlightPath,brPaintReworkEntities | presentation/flight.js, renderer.js | PASS | 기존13사례 자기·상대 유지 | v33.2 / T2: Canvas/Pixi 13 own/opponent cases, 반사/왕복/유도/빔/포탑 |
| V05 | 근접/텔레그래프/장판/연막 | brPaintAttack,brPaintGround,brPaintSmoke | render/original-painters.js | PARTIAL | 최종 실제 출력/품질별 비교 | v33.2 / V/T2: 원본 painter 실제 호출·장판 meta; 모든 중첩 조합 미검증 |
| V06 | 명중/피격/치명/KO/방향 경고 | brRegisterHitFeedback,brDrawHitConfirm | renderer.js, audio/audio.js | PARTIAL | 확정FX만 반영; HUD 피격 edge 누락 조사 | v33.2 / T2/V: confirmed hit/KO/원본 Canvas damage text; 실제 체감 음향은 M07 |
| V07 | 사망 소멸/입자/잔상/캐릭터 개성 | brDrawStudentFrame,Participant.draw | renderer.js | PARTIAL | 단순원 대체/사망 삭제/특수눈광선 등 조사 | v33.2 / F/H/V: host particle/ring/signature actual WS raster·death750·잔상·원본 Canvas actor 루프; 전체 late-game 장면 pixel parity 미검증 |
| V08 | 벽/바닥/상자/드롭/레벨 그림 | Wall.draw,brCaptureCanvasPoints,brPaintCrate | renderer.js | DIFF_FIXED | 회전벽·그리드·pickup·높이/색 비교 | v33.2 / H/T2: 실제 벽/연막/점령 labels·farm·level 화면 대조 |
| V09 | 캐시/풀/LOD/맵 정리 | brGraphicsProfile,brPixiHostReset | renderer.js | PARTIAL | 5회 재경기 및 10분 계측 | v33.2 / R/P: 15 rematches 및 600초 계측; 학교 메모리/장시간 수업 미검증 |

## 음향

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| M01 | 역할별 기본 음악/볼륨/저장 | brMusicPref,brMusicPrimeHost | audio/audio.js | DIFF_FIXED | 원본 host/student 기본값과 버튼 | v33.2 / M: 원본 host ON25/student OFF15·저장 |
| M02 | ready/start/final·반복/페이드 | brMusicSync,brMusicPlay,brMusicFade | audio/audio.js | DIFF_FIXED | 실제 원본 URL로 재생/전환/ended | v33.2 / M: 실제 ready/start/final decoded playback·ended·fade |
| M03 | 제스처·autoplay reject·재시도 | brMusicAttempt,brMusicToggle | audio/audio.js | PARTIAL | NotAllowedError와 파일 실패 분리 | v33.2 / M: Edge 실제 playback 및 주입 NotAllowedError/retry; Safari/Firefox 정책 UNVERIFIED |
| M04 | URL/MIME/redirect/CORS/로드 오류 | brMusicMedia / #br-music-status | audio/audio.js | PASS | 외부 원본 MP3 실제 응답/decoded/playback | v33.2 / M: 실제 원본 URL redirect/MIME/playtime 및 주입503 오류 UI; hardware 청취 아님 |
| M05 | 숨김·복귀·일시정지·재경기 | brMusicCatchUp,brMusicSetPause | audio/audio.js | DIFF_FIXED | 30초 숨김 후 같은 경기 offset; 새경기 초기화 | v33.2 / M: battle hidden/return·pause·results/rematch reset |
| M06 | hit/hurt/KO 효과음·중복/음소거 | brPlaySfx,brRegisterHitFeedback | audio/audio.js | PARTIAL | 원본 oscillator envelope/발생조건/선호 저장 | v33.2 / T2/M: 원본 oscillator/feedback throttle 연결; 모든 audible SFX 청취 전수 미검증 |
| M07 | 실제 학교 스피커/브라우저 정책 | 원본 오디오 출력 | 실기기 | UNVERIFIED | 현장 20학생 시험; 자동 trace와 구분 | v33.2 / FIELD: 실제 학교 스피커/학생20 실기기 결과 없음 |

## 결과/수명

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| R01 | 원본 우승 카드/등급/장식 | brRenderResults / #br-result-winner | ui/app.js | DIFF_FIXED | 3모드 원본 결과 카드 비교 | v33.2 / R: 3모드 실제 서버 결과→원본 DOM 비교+4viewport |
| R02 | 개인/팀/MVP/지원·시상 | brTKRenderResults,brCaptureResults | ui/battle.js, app.js | DIFF_FIXED | 아이콘/실제 값/공동수상/설명 | v33.2 / R: 팀/MVP/지원/공동수상 원본 DOM |
| R03 | 순위·사용 이모지·KDA·퀴즈 | brTKRenderBoard / #br-ranking | ui/battle.js | DIFF_FIXED | 실제 server 결과값과 원본 표 | v33.2 / R: 이름·history emoji·KDA·기여·퀴즈 정확 DOM |
| R04 | 같은방5회 재경기·닫기·홈 | brResetBattle,brReturnHome | ui/app.js, renderer.js, audio.js | DIFF_FIXED | 옛 카메라/스턴/증강/입력/음악 누적0 | v33.2 / R/T1: 모드별 5회 총15 rematches·잔류 상태0; close/leave WS |

## 화면/성능

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| P01 | 1920x1080/1366x768/1024x768 | 원본 CSS media rules | ui/original.css, overrides.css | PARTIAL | 동일 WS/원본 단계별 캡처·DOM영역 | v33.2 / H/C/R/D/L: 1920/1366/1024 actual screenshots; 실제 프로젝터 미검증 |
| P02 | 모바일 세로/가로·DPR·터치 | 원본 CSS safe-area/control geometry | ui/overrides.css, renderer.js | PARTIAL | 390x844/844x390 가상기기; 실기기는 별도 | v33.2 / H/R/D/L/T2: 390x844/844x390·가상 touch; 실제 iOS/Android 미검증 |
| P03 | 20명 실제WS 600초 계측 | 60Hz/20Hz 원본 규칙 | tools/load, browser metrics | PARTIAL | step/frame/RTT/gap/보정/메모리 분리 | v33.2 / P: 600초 기능PASS,7라운드/overload0/cleanup0,step p95 3.04ms/frame16.8ms/RTT11.7ms; 엄격 CPU 목표·송신량·메모리 장기 안정성·투사체 끊김 판정은 별도 |
| P04 | 학교 동일Wi-Fi 교사1+20 실기기 | 현장 수업 | 운영 변경 없음 | UNVERIFIED | 현장 결과 없음; 자동시험으로 대체 불가 | v33.2 / FIELD: 동일 학교 Wi-Fi 교사1+학생20 미실행 |
| P05 | 26/30명 장기 과부하 | 기존600초 결과 | docs/metrics | FAIL | 기존 7/39 pause 실패 보존; 이번 수정으로 해결 주장 금지 | v33.2 / 기존26/30명600초의7/39 pause 보존. v33.2로 해결 주장 없음 |


## 실행 증거 범위

수정 코드는 이 PR의 v33.2 implementation commit에 있다. 정확한 commit/build hash 및 테스트 ID별 로그는 [검증 기록](fidelity-v33-2-evidence.md)에 연결한다. 원본 함수의 존재, 추출 성공, 피해 수치 통과만으로 화면 동등 판정을 하지 않았다. 원본의 마지막 덮어쓰기와 실제 렌더 콜 사이트를 확인하고, 학생/교사 WS 수신 데이터로 실행한 브라우저 증거와 정적 비교를 구분했다.
