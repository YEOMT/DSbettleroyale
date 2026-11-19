# v35.7 인수 40항목

PASS는 실행한 범위에 한한다. 실기기·성능·기능은 구분한다. 원본 실행 실패/중단은 보고서에 남긴다. 아래는 구현 커밋 926cc906의 실제 실행 근거다. 후속 CI 구조 수정의 최종 HEAD 상태는 PR #28에 함께 기록한다. 전체 인수 완료가 아니다.

| ID | 상태 | 실행 근거 / 남은 범위 |
|---|---|---|
| A01 | PASS | main9b2d45f, PR27 MERGED, 새 작업 브랜치, 운영 미변경 |
| A02 | PASS | immutable 86종·등급 확률·Lv6/5선택·왕귀 parity, 여섯째 선택 거절 |
| A03 | PASS | 10경로/8cap allowlist. 실제 기본 스탯·키트 diff 0 |
| A04 | PASS | 60/20·과부하·통신 형식·배포 설정 diff 0. CI 네트워크/격리검증 PASS. 엔진 버전/contentHash만 정상 갱신 |
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
| C01 | PARTIAL | Canvas 3품질·Pixi low/balanced 10경로 UI→WS→mods/chips/guide PASS. high는 기존 검사 실패로 첫 실행 NOT_RUN |
| C02 | PASS | 실제 brChooseRun HP .37비율 유지·중복/여섯째 선택 거절 |
| C03 | PASS | Canvas20 동일 방5경기, Pixi30 후보3경기, 사망/점령부활/증강·장판·렌더 자원 정리 PASS. 장시간 RSS 무누수 주장 아님 |
| C04 | PASS | Quick471·Targeted·기존 v35.4/5 및 팀/점령/벽·반사·패링 회귀 PASS |
| C05 | PASS | 직접/주기 피해 후 REGEN window 리셋, 죽음/경기 종료/경계 밖 제외 |
| C06 | PARTIAL | 실제 이동거리/벽 및 Canvas/Pixi 터치 CI PASS. 실물 기기 NOT_RUN |
| C07 | PARTIAL | 실제 고속 이동/반전 PASS. 저사양 실물·학교망 NOT_RUN |
| C08 | PASS | 기절135f 종료 후 입력 unlock, cast/target/life 중복 제어 없음 |
| C09 | PARTIAL | 실제 기본 피해·밀침·무기절 및 Canvas/Pixi balanced 몸체/벽/보호막 PASS. 기존 Pixi high 헤드슈터 몸체 관측 FAIL |
| C10 | PARTIAL | Canvas 3품질·Pixi low/balanced 새증강 기능 PASS. low Job 업로드 중 TIMEOUT, high 새검사 첫 실행 NOT_RUN; Job 분리 |
| C11 | PARTIAL | 필수 CI·v35.4/5 PASS. 기존 v35.6 high 몸체 관측 FAIL, Pixi30 기준 END 응답 FAIL 보존 |
| D01 | PASS | GitHub44512744675 Quick8+471, Python31, Targeted/build/content/isolated-release/required-checks PASS. 최초 로컬 TIMEOUT은 유지 |
| D02 | PARTIAL | Linux Canvas20×5 기능 양쪽PASS/9창. 일부 성능 >20% 증가. 로컬 양쪽SAFE_PAUSED FAIL |
| D03 | FAIL | Linux 기준4경기 뒤/후보2경기 뒤 평타 카운터0으로 중단. 6창 A/B는 PARTIAL, 5경기 완주 아님. 양쪽20연결·overload0 |
| D04 | PARTIAL | Linux 후보Pixi30 3모드 PASS, 기준2경기째 END 응답FAIL; 2창만 A/B. 로컬 양쪽FAIL |
| D05 | PARTIAL | 합법III+II 12빌드·전경로 unit/UI PASS, 후보20/30 실시간 전투PASS 범위 기록. 성능 무악화 미확정 |
| D06 | PASS | FPS/화질·인원·60/20·보호·발사정보 보존 |
| D07 | PASS | 최초 fixture/assertion/로컬 SAFE_PAUSED/CI FAIL 및 CANCELLED/TIMEOUT 별도 보존. 생략은 PASS 아님 |
| D08 | PASS | 전후 수치·86CC표·A/B 창별 CPU/RSS/heap/전송/렌더·정리·실패·실물NOT_RUN 증거 문서 |
| D09 | PASS | codex/v35-7-overdrive-ii commit/push, Draft PR https://github.com/YEOMT/DSbettleroyale/pull/28; NOT_DEPLOYED |
