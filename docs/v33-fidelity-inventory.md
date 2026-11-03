# v33.2 원본 fidelity inventory

기준 main: `9619942fb55eb5a96c9d6fea69f76fc99d12bbf0`. 원본 blob `4e6845b4565170ee2c84e75c0eee5dcc4f98ceac`, SHA-256 `a006aa596c5640ffe127774f271fce7afce81a4769525979fa453f9107ac5d36`; root/legacy Git bytes 일치. 기존 source-map(307 units), v33.1 문서·증거 및 70개 인수 기록을 확인했다.

**I0: 구현 전 감사 목록.** PARTIAL은 v33.1의 좁은 증거이며 v33.2 전수 동등 판정이 아니다. FAIL은 확인된 소스/표시 차이 또는 기존 실행 실패. UNVERIFIED는 직접 확인하지 않음. BY_DESIGN은 요청된 서버 권위 인증 차이만 해당한다. 기능 삭제를 의도된 차이로 분류하지 않는다. 각 수정 뒤 이 표의 상태/증거를 갱신한다. 원본 함수명은 마지막 실행 정의와 콜 사이트를 추가 추적한다.

## 접속/방

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| A01 | 홈·학생 우선 카드·교사 생성 | brInit / #br-home / .br-home-layout | ui/app.js, index.html | UNVERIFIED | 홈 캡처 4 해상도 | I0 / 미실행 |
| A02 | 교사 인증 | brCreateRoom / #br-create-btn | net/connection.js, ui/app.js | BY_DESIGN | 서버 비밀번호 인증; 원본 Firebase 호스트 권한 대체, WS 명세 요구 | I0 / 미실행 |
| A03 | 6자리 방·QR·초대 링크·닉네임 | brRenderHost / #br-room-code,#br-qr,#br-join-code | ui/app.js | UNVERIFIED | QR URL 디코드→학생 입장 | I0 / 미실행 |
| A04 | 출결·팀·점수·준비·퇴장 | brRenderHost / #br-host-roster | ui/app.js | PARTIAL | 로비/퀴즈/배정에서 표시 및 kick | I0 / 미실행 |
| A05 | 재접속·중복 탭·방 만료 | brWatchRoom / brReturnHome | net/connection.js | PARTIAL | 연결 끊기/복구와 HOME/종료 메시지 | I0 / 미실행 |
| A06 | 단계 표시·교사 설명·학생 대기 | brRenderHost,brRenderStudentWait / #br-host-stages | ui/app.js | FAIL | 현재 단계 active/설명/학생 대기 누락 대조 | I0 / 미실행 |

## 설정

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| B01 | 모드별 팀/지도/시간 가시성 | brModeControls / #br-mode,#br-tk-lobby-rules | ui/app.js | FAIL | 3모드 전환 시 필드 표시·설명 | I0 / 미실행 |
| B02 | 지도 5개·무작위·점령 전용 지도 | brReadSettings / #br-map | rooms/room.js, ui/app.js | UNVERIFIED | 선택→실제 mapName | I0 / 미실행 |
| B03 | low/balanced/high 품질 | brGraphicsProfile / #br-graphics-preset | render/renderer.js | PARTIAL | DPR/품질별 Canvas·Pixi 캡처 | I0 / 미실행 |
| B04 | TXT 업로드·형식 오류·프리뷰·기본문제 | brRenderQuizImport,brValidateQuestionText / #br-quiz-preview | ui/app.js, rooms/room.js | FAIL | 파일 선택·잘못된 행·54문제 복귀 | I0 / 미실행 |
| B05 | 설정 기본값·모드 규칙 설명 | brReadSettings / #br-host-settings | ui/app.js | UNVERIFIED | 원본 값/선택 상태 비교 | I0 / 미실행 |

## 퀴즈

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| Q01 | 학생 숫자/원형 진행률 | brUpdateQuizClock / #br-quiz-timer span / --br-progress | ui/app.js | FAIL | 45/60/90초 실제 WS: span 보존/색/진행률 | I0 / 미실행 |
| Q02 | 교사 시계 가시성 | brUpdateHostQuizClock / #br-host-clock | ui/app.js | FAIL | QUIZ에서 숨김 해제, 다른 단계 숨김 | I0 / 미실행 |
| Q03 | 서버 마감·자동 DRAFT | quizEndsAt / RoomManager.sweep | rooms/room.js | UNVERIFIED | 20학생×45/60/90초 실제 경과 | I0 / 미실행 |
| Q04 | 재접속·숨김/복귀·재렌더 타이머 | brNow,brUpdateQuizClock | net/clock.js, ui/app.js | UNVERIFIED | 새 마감 생성/시간 연장 없음 | I0 / 미실행 |
| Q05 | 정답·오답·잠금·보기 피드백 | brAnswerQuiz / .br-choice | ui/app.js, rooms/quiz.js | PARTIAL | 정오답 색/문구/1.5초 잠금 실제 클릭 | I0 / 미실행 |
| Q06 | 점수·리롤·진행·교사 정답수 | brRenderHost,brRenderQuiz / #br-quiz-score | ui/app.js | UNVERIFIED | 3정답 리롤·교사 실시간 목록 | I0 / 미실행 |

## 배정

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| D01 | 카드 등급/이름/설명/스킬/색 | brRenderDraft / .br-draft-card | ui/app.js | PARTIAL | 77 카드의 텍스트와 대표 캡처 | I0 / 미실행 |
| D02 | 리롤·확정·대기·확률·스테이지 | brRenderDraft / #br-reroll-btn,#br-ready-btn | ui/app.js | PARTIAL | 리롤 중복/확정 후 비활성/전환 | I0 / 미실행 |
| D03 | 카드 뒤집기·리롤 연출 | brRenderDraft / .rolling | ui/app.js | UNVERIFIED | 원본 애니메이션 타이밍 대조 | I0 / 미실행 |

## 관전

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| H01 | 생존자 bbox 자동 중심/줌 | GameWorld.draw,brPixiHostFrame | render/renderer.js | FAIL | 20→10→4→2→1 위치/줌 trace | I0 / 미실행 |
| H02 | 일반/브로드캐스트/성능 정책 | getHostBroadcastMode,brPixiHostFrame | render/renderer.js | FAIL | 인원별 모드·padding·scale/ease | I0 / 미실행 |
| H03 | 학생 집중 토글/타깃 | BRMP.focusPlayer / #br-focus-toggle | ui/app.js, render/renderer.js | FAIL | 최고킬 대신 첫 human 대상; 1.12 배율 | I0 / 미실행 |
| H04 | 점령전 HUD 예약 viewport | brCaptureViewPort / .br-capture-host | render/renderer.js | FAIL | 16:9/4:3 전체 경계·상단126/하단48/좌우24 | I0 / 미실행 |
| H05 | 점령전 집중 토글 무효 | brCaptureMode / #br-focus-toggle | ui/app.js | FAIL | 숨김+직접 handler 호출 시 무효 | I0 / 미실행 |
| H06 | 이벤트 포커스·최종2·종료 easing | GameWorld.focusPoint/focusTimer,brPixiHostFrame | engine presentation / camera | UNVERIFIED | 서버 표시 전용 메타데이터 필요 여부 조사 | I0 / 미실행 |
| H07 | 관전 HUD·모드·시간·생존자 | updateHUD / #hud-overlay,#hud-mode-title | ui/app.js, render/renderer.js | FAIL | 교사에게 학생 HUD가 대신 보이는지 | I0 / 미실행 |
| H08 | 킬피드·실시간 순위·팀점수 | brTKRenderLive,brTKRenderBoard,host kill feed | ui/app.js | FAIL | 실제 처치 이벤트→feed/순위 | I0 / 미실행 |
| H09 | 방번호·종료·랭킹 팝업·겹침 | brHostLive / #br-host-live,#br-tk-leaderboard | ui/app.js, original.css | UNVERIFIED | 1366/1920/1024x768 영역 검사 | I0 / 미실행 |
| H10 | Canvas/Pixi 및 DPR 동일 정책 | GameWorld.draw,brPixiHostFrame | render/renderer.js | UNVERIFIED | 각 백엔드 실제 draw 중심/줌 비교 | I0 / 미실행 |

## 학생 HUD/조작

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| S01 | HP/이름/등급/지도/리롤/인원 | brUpdateStudentHud | ui/battle.js | PARTIAL | v33.1 reference 유지 | I0 / 미실행 |
| S02 | 평타·스킬 쿨타임/잠금/채널/재시전 | brUpdateStudentHud / --br-cd-angle | ui/battle.js, input/controls.js | PARTIAL | 서버 승인 상태/시각/입력 각각 측정 | I0 / 미실행 |
| S03 | 레벨/XP/5선택/왕귀/증강 카드 | brRenderRunHud,brRunCard | ui/augments.js | PARTIAL | 기존 63카드/MAX/이동터치 회귀 유지 | I0 / 미실행 |
| S04 | 조이스틱·릴리즈 발사·drag power | brBindControls / .br-control | input/controls.js | PARTIAL | 키보드/마우스/2접점 가상 touch | I0 / 미실행 |
| S05 | 조준 보정·공격 예고·키 바인딩 | brResolveAimHelp,brDrawAim | input/aim.js, controls.js, renderer.js | PARTIAL | 수동 우선/취소/단발/방향 표시 | I0 / 미실행 |
| S06 | 기절·버프·보호막·표식 | wirePlayer,brPaintReworkStatus | presentation/timeline.js, renderer.js | PARTIAL | 무스턴10초/30·60tick 및 상태 겹침 | I0 / 미실행 |
| S07 | 자기장 경고·방향·압축/노출 | brZoneHUD,brDrawStudentFrame | ui/battle.js, renderer.js | UNVERIFIED | 경계 안/밖/수축/연막 노출 화면 | I0 / 미실행 |
| S08 | 사망/부활 퀴즈/보호/선택 | brTeamKillSelf,brTKRenderSelf | ui/app.js | PARTIAL | 3정답 keep/reroll 실제 브라우저 | I0 / 미실행 |
| S09 | 점령 HUD/거점/화살표/기여 | brCaptureHUD,brCaptureObjectiveArrows | ui/battle.js, render/objectives.js | PARTIAL | 원본 좌표/방향/120초 회귀 | I0 / 미실행 |
| S10 | 복귀·연결지연·화면 흔들림 선호 | brStreamHud,brRenderPlayPrefs | net/connection.js, renderer.js | UNVERIFIED | 숨김30초/리사이즈/설정 지속 | I0 / 미실행 |

## 전투 표현

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| V01 | native 스타일/꼬리/회전/크기 | brDrawProjectileGlyph | render/projectile.js | PARTIAL | 기존 실제 WS native 픽셀 비교 | I0 / 미실행 |
| V02 | RW 스킬 60종/native 17종 | brPaintReworkEntities / final definitions | render/original-painters.js | UNVERIFIED | 77종×3품질×2backend 표시 호출/캡처 | I0 / 미실행 |
| V03 | 예상탄→권위탄 ordinal/종료 | brReworkLocalStart,brShortShot | presentation/previews.js,timeline.js | PARTIAL | 기존 12발/중복0/거절 회귀 | I0 / 미실행 |
| V04 | 반사/유도/왕복/관통/빔/포탑 | brRecordFlightPath,brPaintReworkEntities | presentation/flight.js, renderer.js | PARTIAL | 기존13사례 자기·상대 유지 | I0 / 미실행 |
| V05 | 근접/텔레그래프/장판/연막 | brPaintAttack,brPaintGround,brPaintSmoke | render/original-painters.js | PARTIAL | 최종 실제 출력/품질별 비교 | I0 / 미실행 |
| V06 | 명중/피격/치명/KO/방향 경고 | brRegisterHitFeedback,brDrawHitConfirm | renderer.js, audio/audio.js | PARTIAL | 확정FX만 반영; HUD 피격 edge 누락 조사 | I0 / 미실행 |
| V07 | 사망 소멸/입자/잔상/캐릭터 개성 | brDrawStudentFrame,Participant.draw | renderer.js | UNVERIFIED | 단순원 대체/사망 삭제/특수눈광선 등 조사 | I0 / 미실행 |
| V08 | 벽/바닥/상자/드롭/레벨 그림 | Wall.draw,brCaptureCanvasPoints,brPaintCrate | renderer.js | UNVERIFIED | 회전벽·그리드·pickup·높이/색 비교 | I0 / 미실행 |
| V09 | 캐시/풀/LOD/맵 정리 | brGraphicsProfile,brPixiHostReset | renderer.js | UNVERIFIED | 5회 재경기 및 10분 계측 | I0 / 미실행 |

## 음향

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| M01 | 역할별 기본 음악/볼륨/저장 | brMusicPref,brMusicPrimeHost | audio/audio.js | FAIL | 원본 host/student 기본값과 버튼 | I0 / 미실행 |
| M02 | ready/start/final·반복/페이드 | brMusicSync,brMusicPlay,brMusicFade | audio/audio.js | FAIL | 실제 원본 URL로 재생/전환/ended | I0 / 미실행 |
| M03 | 제스처·autoplay reject·재시도 | brMusicAttempt,brMusicToggle | audio/audio.js | FAIL | NotAllowedError와 파일 실패 분리 | I0 / 미실행 |
| M04 | URL/MIME/redirect/CORS/로드 오류 | brMusicMedia / #br-music-status | audio/audio.js | FAIL | 외부 원본 MP3 실제 응답/decoded/playback | I0 / 미실행 |
| M05 | 숨김·복귀·일시정지·재경기 | brMusicCatchUp,brMusicSetPause | audio/audio.js | FAIL | 30초 숨김 후 같은 경기 offset; 새경기 초기화 | I0 / 미실행 |
| M06 | hit/hurt/KO 효과음·중복/음소거 | brPlaySfx,brRegisterHitFeedback | audio/audio.js | FAIL | 원본 oscillator envelope/발생조건/선호 저장 | I0 / 미실행 |
| M07 | 실제 학교 스피커/브라우저 정책 | 원본 오디오 출력 | 실기기 | UNVERIFIED | 현장 20학생 시험; 자동 trace와 구분 | I0 / 미실행 |

## 결과/수명

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| R01 | 원본 우승 카드/등급/장식 | brRenderResults / #br-result-winner | ui/app.js | FAIL | 3모드 원본 결과 카드 비교 | I0 / 미실행 |
| R02 | 개인/팀/MVP/지원·시상 | brTKRenderResults,brCaptureResults | ui/battle.js, app.js | FAIL | 아이콘/실제 값/공동수상/설명 | I0 / 미실행 |
| R03 | 순위·사용 이모지·KDA·퀴즈 | brTKRenderBoard / #br-ranking | ui/battle.js | PARTIAL | 실제 server 결과값과 원본 표 | I0 / 미실행 |
| R04 | 같은방5회 재경기·닫기·홈 | brResetBattle,brReturnHome | ui/app.js, renderer.js, audio.js | UNVERIFIED | 옛 카메라/스턴/증강/입력/음악 누적0 | I0 / 미실행 |

## 화면/성능

| ID | 원본 기능 | 원본 함수 / DOM / CSS | v33 대상 | 상태 | 재현방법 | 수정 커밋 / 테스트 ID |
|---|---|---|---|---|---|---|
| P01 | 1920x1080/1366x768/1024x768 | 원본 CSS media rules | ui/original.css, overrides.css | UNVERIFIED | 동일 WS/원본 단계별 캡처·DOM영역 | I0 / 미실행 |
| P02 | 모바일 세로/가로·DPR·터치 | 원본 CSS safe-area/control geometry | ui/overrides.css, renderer.js | UNVERIFIED | 390x844/844x390 가상기기; 실기기는 별도 | I0 / 미실행 |
| P03 | 20명 실제WS 600초 계측 | 60Hz/20Hz 원본 규칙 | tools/load, browser metrics | UNVERIFIED | step/frame/RTT/gap/보정/메모리 분리 | I0 / 미실행 |
| P04 | 학교 동일Wi-Fi 교사1+20 실기기 | 현장 수업 | 운영 변경 없음 | UNVERIFIED | 현장 결과 없음; 자동시험으로 대체 불가 | I0 / 미실행 |
| P05 | 26/30명 장기 과부하 | 기존600초 결과 | docs/metrics | FAIL | 기존 7/39 pause 실패 보존; 이번 수정으로 해결 주장 금지 | I0 / 미실행 |

