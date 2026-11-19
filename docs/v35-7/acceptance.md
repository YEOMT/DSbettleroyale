# v35.7 인수 40항목

PASS는 실행한 범위에 한한다. 실기기·성능·기능은 구분한다. 원본 실행 실패/중단은 보고서에 남긴다. 아래는 진행 중 상태이며 최종 CI와 A/B 완료 후 갱신한다.

| ID | 상태 | 실행 근거 / 남은 범위 |
|---|---|---|
| A01 | PASS | main9b2d45f, PR27 MERGED, 새 작업 브랜치, 운영 미변경 |
| A02 | PASS | immutable 86종·등급 확률·Lv6/5선택·왕귀 parity, 여섯째 선택 거절 |
| A03 | PASS | 10경로/8cap allowlist. 실제 기본 스탯·키트 diff 0 |
| A04 | PARTIAL | 60/20·보호 설정 diff 0. 필수 네트워크 회귀 CI 대기 |
| A05 | PASS | 생성 manifest/display/도감 갱신, content:check, paired build |
| A06 | PASS | tests/v35-7/baseline.json exact9b2d45f, 승인값 명시 비교 |
| B01 | PASS | REGEN I/II/III 첫 회복 프레임/회복량/실제 DOT 리셋 |
| B02 | PASS | EXPANSION native/rework 탄·원·사각형·성장 장판 실제 크기/접촉/guide |
| B03 | PASS | AFTERGLOW 실제 zone/turret 종료시각·생명 정리·교체 상한 |
| B04 | PASS | LONG STEP 암살자/로드킬/마운틴 실제 이동·벽·guide |
| B05 | PASS | SWIFT 실제 INPUT 이동/반전, III=2배 |
| B06 | PASS | AMPLIFY 3종 실제 스킬 첫 HP 피해, 기본 피해 불변 |
| B07 | PASS | QUICK III 86종 실제 쿨타임, I/II native/rework, 비피해 변환 |
| B08 | PASS | CONTROL 10개 rework 실제 기절/미리보기, native 접촉/만료·중복 |
| B09 | PASS | IMPACT 근접/원거리 실제 기본 impulse, 스킬 계수·기절 불변 |
| B10 | PASS | HEAVY 근접/원거리 실제 기본 HP 피해, impulse 불변 |
| B11 | PASS | 6종 모든 tier 기본 공격의 피해/밀침 단일 적용 |
| B12 | PASS | 86종 CC 적용표, spotlight216f, 기본60f→135f, target/life ledger |
| B13 | PASS | QUICK 재시전 창/준비·채널 보존, AFTERGLOW owner cap/정리 |
| B14 | PASS | 합법 III+II/전역 상한, spotlight 무효 카드 제외, HP 비율 |
| C01 | PARTIAL | Canvas low 10경로 UI 선택·실시간 모드·칩·guide 확인. 전체 품질 CI 대기 |
| C02 | PASS | 실제 brChooseRun HP .37비율 유지·중복/여섯째 선택 거절 |
| C03 | PARTIAL | unit 생명 종료/교체 정리 PASS, 같은 방5경기 진행 중 |
| C04 | PARTIAL | 기존 팀/점령/벽·반사/패링 회귀 CI 대기 |
| C05 | PASS | 직접/주기 피해 후 REGEN window 리셋, 죽음/경기 종료/경계 밖 제외 |
| C06 | PARTIAL | 실제 이동거리/벽 PASS, 터치 조준 CI 대기. 실물 기기 NOT_RUN |
| C07 | PARTIAL | 실제 고속 이동/반전 PASS. 저사양 실물·학교망 NOT_RUN |
| C08 | PASS | 기절135f 종료 후 입력 unlock, cast/target/life 중복 제어 없음 |
| C09 | PARTIAL | 실제 기본 피해·밀침·무기절 PASS. 기존 벽·보호막·몸체 CI 대기 |
| C10 | PARTIAL | Canvas/Pixi low/balanced/high identity CI 대기 |
| C11 | PARTIAL | v35.4/5/6·재접속/부활/과부하 필수 CI 대기 |
| D01 | PARTIAL | npm ci/build PASS, 로컬 Quick TIMEOUT/이전값 FAIL 보존·해당17PASS. 최종 CI 대기 |
| D02 | NOT_RUN | Canvas low20×5 A/B 진행 중 |
| D03 | NOT_RUN | Pixi balanced20×5 A/B 대기 |
| D04 | NOT_RUN | Pixi high30/solo·team·capture A/B 대기 |
| D05 | PARTIAL | 합법5선택12대표 빌드·전경로 unit PASS, 실시간 부하 대기 |
| D06 | PASS | FPS/화질·인원·60/20·보호·발사정보 보존 |
| D07 | PASS | 최초 Quick/fixture 실패 원본 보존, TIMEOUT과 assertion FAIL 분리 |
| D08 | PARTIAL | before/after·86CC표·실행/위험 문서, 성능/CI 수치 대기 |
| D09 | NOT_RUN | 작업 브랜치 commit/push/Draft PR 예정 |
