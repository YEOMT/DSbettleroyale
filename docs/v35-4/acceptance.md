# v35.4 인수 항목 추적

PASS는 아래 기재한 실행 범위만 뜻한다. NOT_RUN/UNRESOLVED를 포함한 행을 전체 인수 성공으로 해석하지 않는다. 기능과 성능 개선·실물 검증을 분리한다. CI 대기 항목은 최종 결과 후 갱신한다.

| ID | 요구 | 실행 범위 / 제한 |
| --- | --- | --- |
| B01 | 기준 확인 | 원격 main·작업 트리·기존 PR 확인. dd331fd, 깨끗한 시작. |
| B02 | 86종/생성물 | 86항 전체 mechanics golden; 6개 등록 계수만 승인 차이, native 2경로는 runtime 비교. |
| B03 | 일반전 동등성 | 28 실제 시전 전후 비교의 비대상 직격/강타/가위/대마법사 및 기존 parity. |
| N01 | 개인전 영구 탈락 | 20연결 실제 사망, 학생 bytes/views/RAF=0, 살아 있는 학생·호스트 계속 수신. |
| N02 | 팀 생존전 탈락 | team-elim 권위 단위검사; 팀 진행·개인 순위 null. 해당 모드 브라우저는 NOT_RUN. |
| N03 | 부활 모드 사망 | 6인 점령전 실제 퀴즈·재추첨·부활 후 이동/평타/스킬 PASS. 20인 브라우저는 CI 확인 대기. |
| N04 | 탈락자 새로고침 | 실제 학생 새로고침 제한 FULL_STATE, 0 RAF. 살아 있는 참가자 연결 유지. |
| N05 | 전송 필터 | 20 WS+역할별 송신계측: FX/이벤트/개인 뷰 생성 중단, 이미 전송된 분은 제외. |
| N06 | 신뢰 cursor/큐 | cursor 증가 중단·PONG/늦은 ACTION 거절·RESULTS/REMATCH·스코프 검사. |
| N07 | 20연결 최후반 | 배포용 20인 Canvas 호스트+학생2+17 WS 연결 유지, 6→5→3→2→1+결과. |
| N08 | watchdog | 탈락 새로고침 후 실제 제어 연결 유지, 제한 복원은 snapshot을 요구하지 않음. 장기 탈락 대기는 NOT_RUN. |
| E01 | 반사 상태 만료 | 기존 실제 반사/300tick 단위검사, Canvas/Pixi 서버 상태 표시 직전/직후 검사. |
| E02 | 보급 버프 종료 | 세 보급 상태의 서버 tick 종료와 Canvas/Pixi HUD 검사. |
| E03 | 기절/포획 | 권위 stunEnd, 공통 action-state와 HUD 동일; 실제 Canvas/Pixi 잠금 해소. |
| E04 | 가위 재사용 | 기존 v35.3 가위 3회/재사용·쿨타임 회귀 유지. 최종 CI에서 재확인. |
| E05 | 외계인 귀환 | 기존 외계인 private 원점·조기 귀환·기존 입력/UI 회귀 PASS. |
| E06 | pause/연장/중첩 | 벽시계가 진행해도 tick299/end300 표시 유지; tick301 종료. effect별 timer 없음. 모든 연장 조합 브라우저는 NOT_RUN. |
| E07 | 숨김/시야 재진입 | 기존 visibility/old-life/interest 재진입 회귀 유지. 이번 모든 장판 시야 재진입 시각 행렬은 NOT_RUN. |
| H01 | 강타 미스/ACK | 기존 확정접촉/ACK/미스·중복·reduced-motion 단위검사 유지. |
| H02 | 실제 접촉/밀림 | 서버 실제 heavy 스킬 분류 및 4도형; 28시전 물리/제어 불변. 모든 강타 접촉 영상 정밀 비교는 NOT_RUN. |
| H03 | 벽 충돌 | 실제 충돌 normal, 한 impulse당1회, 추가 피해 0 검사. |
| H04 | 실드/반사/무적 | 기존 실드 흡수/반사/무적 경로와 HP hurt 분리 검사. 실제 브라우저 반사 상태 포함. |
| H05 | 다수 강타 | 기존 bounded contact/pose/reduced-motion 검사, 30인 S급 서버 부하. 30인 다중 강타 오디오·렌더는 NOT_RUN. |
| R01 | 직접 원인/귀속 | takeDamage 서버 lastDeathCause에서 생명당 요약, 사후 기록과 최종 기록 분리. |
| R02 | 자기장/반사/지속/벽 | 실제 wall cause 분류 추가, 기존 dot/reflection/ring 기록 보존. 모든 원인별 UI 스크린샷은 NOT_RUN. |
| R03 | 동시 사망/팀 모드 | 동일 틱 두 사망의 기존 comparator 순위 및 팀 순위 null. |
| R04 | 학생/교사 결과 | 기존 시상 아래 서버 상세표, 없으면 —/열 제외. 20명 학생/호스트 결과 실제 화면. |
| R05 | 이름/긴 텍스트 | textContent만 사용하는 새 UI, 마크업 문자열 단위검사; 390px 실제 모바일 레이아웃 overflow 없음. |
| V01 | 자연 최후 1인 | 자연 마지막1인만, 정확3500ms, 실제 학생·호스트 정적 승자/결과. |
| V02 | 동결 이후 피해 | 결과 이후 stepWorld30회에도 tick/결과/통계 동일. |
| V03 | 조기/늦은 복구 | 서버 기한 중 실제 학생 reload 남은 시간만, 기한 후 reload 결과 직행. |
| V04 | 팡파레 | 경기당1회/숨김/늦은/중복 복원 단위검사, 기존 audio gating. 실기기 실제 청음 NOT_RUN. |
| V05 | 강제 END/무승자/팀승리 | 강제END·team 결과는 presentation null. 정확1인 조건으로 무승자 제외. |
| V06 | 결과 중 REMATCH | 기한 전 REMATCH 명시 거절, 기한 후 같은 연결로 성공; drain 보호. |
| X01 | Canvas/Pixi 상자/기둥 | 공통 벡터 painter/고정 terrain 캐시, Canvas/Pixi/low 화면과 4도형 단위검사. |
| X02 | 정적 캐시/물리 | 기존 정적 바닥/벽 캐시 계약, 28시전 farm 입력 불변; geometry 수치 변경 없음. |
| S01 | 일반/F/S 최초 추첨 | 4모드×3규칙×120 추첨/RNG, 정확한 세 이름. |
| S02 | 모든 리롤/복구 | spent 유지한 결정적 recover/revision, 정상·특별전 리롤. |
| S03 | 확정/시작 검증 | DRAFT_CONFIRM/START_BATTLE 허용 pool 검증, 기존 host/revision 검증 유지. |
| S04 | 부활 재추첨 | capture/respawn 각 F/S 실제 부활 재추첨 권위검사. |
| S05 | 새로고침/재경기 | 같은 방5회 룰 유지/새 match; 실제 reload/REMATCH. |
| S06 | 일반전으로 변경 | 일반→F→S→S→일반5회 및 일반 RNG 동등성. |
| S07 | 여러 방/팀 제약 | 동일 manager 다른 방 normal 유지·teamOnly 필터; 세 규칙 동시 전투 성능은 NOT_RUN. |
| S08 | 증강 | 기존 왕귀 자격/증강 엔진 불변, 86 mechanics allowlist 및 기존 F/S 증강 회귀. |
| S09 | 후보 0/1 | 후보0 명시 오류, 후보1 단일 결과; 무한 재시도 없음. |
| D01 | 적격 반복 피해 | 8경로×기본/강화 실제방어전 반복피해 정확1.10, native/register 별도. |
| D02 | 비대상 피해 | 직격·최종폭발·가위·대마법사·강타 실제 비교, 다른86수치 불변; 모든 비대상킬 조합 전수는 NOT_RUN. |
| D03 | 시간·범위·제어 | 28시전 hit tick/수/target control/위치·cooldown 동일. |
| D04 | 강화/광폭/왕귀 | 강화·광폭·왕귀 컨텍스트; 중복 복원 배율 없음. 모든 증강 조합 전수는 NOT_RUN. |
| D05 | 실드/반올림/귀속 | 기존 실드/피해/귀속 단위검사 및 실제 takeDamage 경로. 모든 신규1.10 반올림 경계값은 NOT_RUN. |
| D06 | 비플레이어 경로 | 28시전 farm count/radius/damage 동일; 기존 native turret 정책 보존. |
| D07 | 문구/콘텐츠 | 8경로 문구/manifest/display/hash 생성·check, 전체86 mechanics 검사. |
| L01 | 같은 방 5회 | 20 서버5회 및6 Canvas5회 자원/연결; 20 Canvas/Pixi5회는 CI 확인 대기. |
| L02 | 지연/단절/숨김/resize | 기존 controls/recovery/continuous/touch CI 유지, 이번 winner/dead reload 실제 검사. 모바일 실물 NOT_RUN. |
| P01 | 역할별 전후 비교 | 역할별 A/B 실측 완료. 탈락 개선 확정, 전원 생존 CPU/draw/p95 악화 표본은 UNRESOLVED. |
| P02 | 30연결 단기 집중 | 동일30 S급10초 실측창 PASS, CPU/byte/queue 비교; 렌더 없음. |
| P03 | 제한 보고 | 개발 실행 SAFE_PAUSED·fixture 실패·실물/장기 미실행·조사 신호 모두 별도 기록. |
