# 83종 · 단방향 포탈 · X자 점령전 패치

기준 main: `790fb11a0618d6c706d1aee044379939940415af` (PR #17 포함). 시작 시 공개 AWS `/version`도 같은 SHA임을 읽기 전용으로 확인했다. 작업 브랜치는 `codex/xmap-escape-roster`이며 이번 작업은 검토용 PR이다. AWS·공식 Pages·Firebase·main에는 반영하지 않았다.

**기능 집중 검사·3라운드 반복·빌드 PASS 기록이 있으며, 성능 비악화 충족은 확인하지 못했다. 마지막 점령 경계 보완 후 빌드와 Targeted는 PASS다. 제출 커밋의 GitHub CI 상태는 PR Checks에서 별도로 확인한다.** 최종 비교에도 CPU/RSS 등의 악화가 남아 있으므로 전체 요구사항 완료 또는 성능 불변 PASS로 보고하지 않는다. 좋은 결과를 고르기 위한 추가 반복은 하지 않았다.

## 구현과 요구사항별 근거

| 요구 | 실제 구현 / 최종 값 | 주요 경로 | 검사 및 상태 |
|---|---|---|---|
| 솔로 A→B 1쌍 | A/B 두 지점, 진입 반경64, 공유1200틱=20초. 서버 순서의 첫 유효 학생만 이동. B 역이동 없음 | `packages/engine/src/world/escape.js`, `index.js` | `tests/unit/escape.test.mjs`, 실제 WS Canvas/Pixi 집중 시험 PASS. 마지막 할당 절감 후 필수 재검사는 최종 기록 참조 |
| 안전·복구·수명 | 유한한 결정적 배치, 중간 지대·퇴로·엄폐·벽/상자/초기 스폰 회피. 현재 자기장·정적 장애물·위험 장판으로 B 차단. 이동 잠금·사망·분신·부활 보호 제외. 속도0/warpSeq 증가, 복구 시 최신 전체 상태, 월드 종료 때 정리 | 위 경로, `farm/resources.js`, `timeline.js`, server `simulation/runner.js` | 5맵/랜덤, 동시 진입·재사용·기절·자기장·발판·상태 정리 단언. 브라우저 재접속 뒤 이동 Canvas46 / Pixi38 월드 단위 관측. 위험 장판 종류/공간 캐시 검토 후 보완 |
| 발판4개 | 각 반경58, 개별900틱=15초 잠금,180틱=3초 이동속도×1.30. 외부 진입만 발동, 중첩 없음. 다른 팀 모드에 미적용 | `escape.js`, `combat/player-input.js` | 단위 접촉·만료·재진입·사망 정리 검사와 브라우저 상태 표시 검사. 공격 속도·HP 변경 없음 |
| 포탈/발판 표시 | 기존 Canvas/Pixi painter·텍스트 캐시, 단순 미니맵. 정적 좌표와 상태 전환 이벤트만 전달. 남은 시간은 서버 틱으로 계산 | `apps/client/src/render/escape-scene.js`, `renderer.js`, `ui/overrides.css` | Canvas10.650초 / Pixi11.315초 PASS, 오류0. 새 오디오·상시 파티클 없음 |
| 실제 X 지형 | 외곽±3000, 네 변의 회전 사각 벽4개로 실제 통로 형성. 정적 엄폐4개, 기존 충돌/경계 재사용. 학생 예측도 같은 경계 사용 | `modes/capture.js`, `movement/capture-boundary.js`, `movement/prediction.js`, `render/static-floor.js` | 2/3/4팀 스폰, 실제 막힌 영역·벽 통과 기술의 경계·안전한 좌표/랜덤 상자 후보·3팀 안전 경로/첫 진입 비교 단언 |
| 팀 배치 | 기본 팔 끝 좌표(±2250,±2250). 2팀 TL/BR, 3팀 TL/TR/BL(오른쪽 아래 비움), 4팀 전부 | `modes/capture.js` | 3팀 최근접 거리와 안전 경로 길이 대칭, 같은 캐릭터 실제 이동의 첫 진입 차이≤2틱, 엄폐량 동일 단언. 가상4번째 팀 추가 없음 |
| 점령 규칙/HP | A(-550,0), B(550,0), 반경400, 시작부터 둘 다 활성, 배율[1,1], 마스크3. 점령전 HP .70→.85만 변경. `capture-x-1`, 규칙version4 | `modes/capture.js`, content manifest | 고유 최다 팀 득점/동수 정지, 점수·기여 합계·마지막60초 피버×2 단언. 솔로/팀 킬 HP와 기존 승리/정산 경로 유지 |
| 점령 HUD/공지 | 양 거점 인원·팀·우세/경합 텍스트. 우세2초 유지, 같은 유형/거점10초, 공지 간6초,4초 표시. 양 거점 우세/승리 임박/역전/피버 안내 | `ui/capture-notice.js`, `ui/battle.js`, `render/capture-scene.js`, `render/objectives.js` | 저사양 Canvas12.843초 / Pixi12.761초 PASS. 교사·학생·390px 터치 뷰포트 3화면, BLUE2:RED1 득점·같은 패킷 일치·HUD 겹침 없음·미니맵·재경기 자원 정리 |
| 볼링034 | 스킬 공1개, 반경36/속도22/거리900/피해 계수21/넉백42/반사0/관통/대상 생명당1회/벽 종료. 쿨타임945틱=15.75초. 기존 평타 유지 | `abilities/other-ranks.js`, `world/rules.js` | 대상별1회·직선 넉백·아군/보호 제외·벽·범위 증강 검사. 실제 브라우저 HP 차감27.3=21×기존 A급1.3. 넉백은 기존 원거리 배율.88을 적용하면36.96이며 대상 저항/제어 증강을 추가 적용 |
| 다트070 | 평타 상대 중심35% 이내의 유효 궤적이면 피해×1.5. 스킬은 자기 평타 빈도×1.30,300틱=5초,990틱=16.5초 대기. 별도 스킬탄/이동 잠금 없음 | `combat/projectile.js`, `abilities/other-ranks.js`, `world/rules.js` | 중앙/편심/고속/움직이는 대상/관통/아군·보호·은신 제외·스킬 제외·단일 피해 경로·300틱 만료/새 생명 정리 단언. 300틱 고정 샘플은 공격 횟수/피해 비율을 확인하는 작은 표본이며 실제 승률 검증이 아님 |
| 두 리워크 실제 표시 | 공격자·상대·호스트가 같은 서버 공과 확정 명중/중앙 적중 효과를 수신 | `tests/combat/upgrade-roster.mjs` | Canvas13.855초 / Pixi14.374초 PASS, 각 3화면, 페이지 오류0, 결과/재경기·텍스처 정리. 저사양·터치 가능 뷰포트이며 실물 모바일은 아님 |
| 4종 삭제/83종 | 048/065/073/076 활성 목록·등록·native override 제거, 옛 ID 생성 명시적 거부. 나머지 영구ID 보존. S/A/B/C/F 확률10/20/25/30/15% | `world/rules.js`, `abilities/other-ranks.js`, `abilities/roster10.js`, 생성 content | 정확한83/모든 생성 참조/등급 확률/삭제ID 거부 검사. 불변 legacy와 과거 실패 기록은 역사 자료로 유지 |
| 83종 문구 | 실제 final profile→문구 보정→generator→manifest/display. 기본 공격/스킬/사거리/대기/증강 자격 대조. 기존 이름·이모지 유지 | `world/roster-text.js`, `tools/content/cards.mjs`, `generate.mjs`, `audit-report.mjs` | [83종 전체 대조와 전후 예시](roster83-text-audit.md). 문구+범위5검사 PASS0.231초. main의 유지81종 모든 비문구 값/ID/타이밍/기능 플래그 보존 단언, 부동소수점 허용오차1e-10 |
| 동일 방 반복 | 같은 방·토큰·20참가자·3실제 Canvas 브라우저(교사1/학생2)·18가상 입력. 라운드마다 이동/평타/스킬, 새로고침, 전환 끊김, Results/Rematch, 서버/클라이언트 정리 | `tests/combat/classroom-rematch.mjs`, `classroom-authority.mjs` | 마지막 할당 절감 후 솔로39.6518초/점령40.5276초, 각3라운드 기능 PASS/20접속/과부하0. 성능 비악화 PASS는 아님. 실물20기기/교실 Wi-Fi 검증으로 표시하지 않음 |

문구 정리로 수정된 대표 사례는 농구왕의 원반→농구공, 통조림의 화분→통조림, 롤러스케이트의 폭탄→단일 접촉 돌진, 대마법사 여섯 발/총160→14발·실제 계수11.55/17.85이다. 농구공 계수도 예전42 대신 최종 override43.26으로 생성한다. 지원 기술의 기존 raw native 분류 때문에 국소 보호막을 전역으로 잘못 표기하던 경우도 구분했다. 생성기의 피해 계수와 최종 HP 차감은 같은 단위가 아니다.

다트300틱 공격 구간(+50틱 도착 대기)의 고정 표본: 편심7발/166.32, 중앙7발/249.48, 공속 버프 중앙9발/320.76 피해. 평타 기준 간격43틱은 유지되며 중앙 배율1.5가 일치한다. 버프 중앙/편심 피해 비율1.92857은 이산 발사 횟수의 결과이고, 이론상 빈도×중앙 배율1.95 또는 실제 교실 DPS/승률과 동일하다고 주장하지 않는다. 이 작은 표본 집중 검사208ms 및 앞선 리워크6검사275ms PASS 기록을 보존한다.

## 첫 고정맵 성능 비교와 발견된 비용

아래 값은 `artifacts/upgrade/performance.json`의 **할당 절감 전** 비교다. 파일의 `phase: final`/`upgrade-final-*` 이름은 이 첫 비교 실행의 라벨이며, 현재 최종 성능 PASS를 뜻하지 않는다. 같은 Windows PC에서 별도 서버 프로세스와 브라우저/부하 드라이버를 사용했다. 비교 실행의 교사1/학생2 화면은 모두 Canvas다. Pixi는 별도 기능 집중 시험에서 검증했으며 이 성능 표본에 포함하지 않는다. 서로 다른 기기·AWS 2vCPU/1GB 환경은 아니므로 자원 경합을 배제하지 않는다. Vite 시험 환경, 고정 map0/매치 seed/034·070·003·141 혼합, 실제 지형을 유지한3라운드다. 관측 구간은 약40초이며 600초 또는 장시간 경기 시험이 아니다.

| 지표(3라운드 마지막 관측) | 솔로 main | 솔로 첫 변경본 | 점령 main | 점령 첫 변경본 |
|---|---:|---:|---:|---:|
| 실행 초 |39.767|40.441|40.768|41.025|
| step 경과시간 p95 ms |5.021|7.568|6.399|5.485|
| snapshot 경과시간 p95 ms |10.067|12.641|10.762|9.359|
| 실제 프로세스 CPU user ms |6531|6812|6671|6937|
| 실제 프로세스 CPU system ms |1687|1656|1734|1953|
| 송신 bytes |211,782,451|205,725,237|223,035,638|215,405,132|
| 송신 KiB/s |5307.8|5055.4|5425.9|5207.7|
| 서버 RSS MiB |124.7|157.8|121.5|184.7|
| 서버 heap MiB |40.6|41.7|34.3|42.3|
| 교사/학생1/학생2 Canvas draw p95 ms |4.4/1.9/2.2|4.4/2.9/2.5|3.7/2.0/2.3|3.4/2.0/2.3|
| 3화면 frame gap p95 ms |16.9/16.9/16.9|16.9/16.8/16.9|16.9/16.9/16.9|16.9/16.9/16.9|
| 과부하 / 접속 학생 |0/20|0/20|0/20|0/20|

실제 CPU user+system 합계는 솔로 약+3.0%, 점령 약+5.8%였다. 솔로 step/snapshot p95와 두 모드 RSS 증가가 있으므로 **첫 비교는 성능 불변 PASS가 아니다**. 프레임 간격 유지와 전송량 감소만으로 이 차이를 상쇄했다고 판단하지 않는다. 경과시간 p95는 실제 CPU 사용시간과 구분해서 기록했다.

확인한 불필요한 새 할당 경로만 줄였다: 접촉하지 않은 학생은 `inputLocks` 객체 생성을 건너뛰고, 위험 종류 Set을 모듈 상수로 옮겼으며, 매 스텝 발행 callback을 재생성하지 않는다. 포탈 좌표 배열과 작은 미니맵도 상태 revision/지도상의 실제 픽셀 이동이 바뀔 때 재사용한다. 이는 실제 할당 절감이며, 위 p95/RSS 차이의 확정 원인을 찾아 해결했다는 뜻은 아니다. 판정60Hz·전송20Hz·과부하 기준·FPS·공격 정보는 그대로다. X 지형은 큰 벽 텍스처를 생성하지 않고 기존 정적 바닥 경로에 그린다. Pixi 집중 시험의 최대 벽 텍스처 변은268px였다.

### 강제 GC 보조 진단

`artifacts/upgrade/memory-before.json`, `memory-after.json`은 짧은 엔진 월드3회 생성/폐기 뒤 강제 GC를 포함한 보조 진단이다. 라운드3의 시작 대비 잔류 heap 차이는 솔로 main4,184,256bytes / 변경4,086,384bytes, 점령 main−574,408bytes / 변경612,472bytes였다. 이는 작은 잔류 heap 표본이며 **장시간 무누수 증명도 아니고, 앞선 RSS 증가 원인 설명도 아니다**. V8 예약 메모리/네이티브 메모리/동일 PC 경합을 확정 원인으로 단정하지 않는다.

### 마지막 할당 절감 후 비교

`artifacts/classroom/upgrade-optimized-solo-rematch.json`, `upgrade-optimized-capture-rematch.json`은 각3라운드 기능 PASS,20접속 유지, 과부하0, 브라우저 오류0이다. 솔로39.6518초, 점령40.5276초가 실제 전체 실행시간이다. 아래 요약 p95는 원본 메트릭을 소수 첫째 자리로 반올림한 값이다.

| 지표 | 솔로 main | 솔로 마지막 수정본 | 점령 main | 점령 마지막 수정본 |
|---|---:|---:|---:|---:|
| step 경과시간 p95 ms |5.021|5.6|6.399|5.6|
| snapshot 경과시간 p95 ms |10.067|10.3|10.762|12.3|
| 실제 CPU user/system ms |6531/1687|7296/1921|6671/1734|6984/1937|
| 송신 bytes |211,782,451|200,687,737|223,035,638|217,410,820|
| 송신 KiB/s |5307.8|5028.5|5425.9|5321.9|
| 서버 RSS MiB |124.7|120.5|121.5|168.9|
| 서버 heap MiB |40.6|34.9|34.3|58.8|
| 교사/학생1/학생2 Canvas draw p95 ms |4.4/1.9/2.2|4.3/2.3/2.2|3.7/2.0/2.3|2.9/2.2/2.0|
| 3화면 frame gap p95 ms |16.9/16.9/16.9|16.8/16.9/16.8|16.9/16.9/16.9|16.9/16.9/16.9|

**판정: 짧은 반복 기능 검사는 PASS, 성능 비악화 요구는 충족 확인 불가.** main 대비 CPU user+system 합계는 솔로8218→9217ms(약+12.2%), 점령8405→8921ms(약+6.1%). 솔로 RSS는 낮아졌지만 점령 RSS121.5→168.9MiB 및 heap34.3→58.8MiB, snapshot p95 약+14.3%가 남았다. 첫 변경본 대비 나아진 수치만 골라 PASS로 바꾸지 않는다. 동일 PC 자원 경합·샘플 변동·메모리 할당 특성 중 어느 부분이 차이를 설명하는지 확정하지 못했다. 병목 원인과 장시간 누적 여부는 미확정이며 추가 개선의 근거로 남긴다. 이번 짧은 비교를 유리한 결과가 나올 때까지 반복하거나 605초 시험으로 확대하지 않았다.

비교 원자료 요약은 [upgrade-performance.json](evidence/upgrade-performance.json)에 보존했다. 코드 검토에서 점령 경계 clamp의 추가 임시 객체와 큰 지형 벽의 broadphase 셀 비용을 확인했으나, 위 차이의 원인이라고 입증하지 못했다. 다음 조치는 동일 경계 연산의 할당 프로파일과 재경기 후 보존 힙을 분리 측정하고, 실제 비중이 확인될 때만 clamp 결과 재사용/큰 지형 벽 인덱스 재사용을 적용하는 것이다. 현재 브라우저의 지형은 정적 벡터로 캐시되며 서버 RSS 증가의 직접 원인으로 제시하지 않는다.

## 실행 기록과 한계

| 상태 | 실행 | 실제 시간 / 범위 |
|---|---|---|
| PASS(이전 수정 지점) | Quick 공통264검사 |200.36초. 마지막 문구/할당 절감 수정 전 실행이며 최종 HEAD CI로 대체 표기하지 않음 |
| PASS(이전 수정 지점) | 최초 paired build |Vite9.36초. 아래 최종 빌드와 구분 |
| PASS | 83종 문구·main81종 수치 보존·선택 범위 집중5검사 |0.231초. 설명 source와 생성물 일치, 원본81종 전체 기계적 projection 비교 |
| PASS | 솔로 환경 Canvas / Pixi |10.650 /11.315초, 실제 서버 상태·화면·복귀 이동 |
| PASS | 점령 X Canvas / Pixi |12.843 /12.761초,3화면 및 모바일 크기/low |
| PASS | 볼링·다트 Canvas / Pixi |13.855 /14.374초,3화면 발사/확정 명중·재경기 정리 |
| PASS(한정된 초기 fixture) | main5라운드 솔로 / 점령 |63.811 /59.737초. 처음 fixture가 벽·연막·상자를 비웠으므로 새 맵 성능 근거로 쓰지 않았다. 실제 지형 보존 고정맵3라운드 비교로 보완 |
| INFRA_FAILURE(오염된 비교) | `upgrade-after-map-solo` |66.310초. 라운드1/2 완료, 라운드3 새로고침30초 timeout. 실행 도중 content 재생성으로 Vite 클라이언트 fingerprint와 이미 실행 중인 서버가 달라진 조건. 전체 시험 PASS 아님; 이 결과는 성능 비교에서 제외하되 보존 |
| PASS(기능만) | 지형 보존 main/첫 변경본3라운드 |위 성능표 시간.20접속 유지, 과부하0, 라운드별 입력·공격/스킬·Results/Rematch·정리. 첫 성능 비악화 판정은 보류 |
| PASS | 할당 절감 후 최종 집중 unit23검사 |369.5262ms. 변경 기능·문구·범위 회귀 |
| FAIL→PASS | 점령 X native 투사체 경계 집중5검사 |수정 전201.7ms 중2FAIL/3PASS: BOOMERANG/GHOST가 X 지형을 통과. 점령 지형에만 기존 벽 추적을 적용하여226.5ms에5PASS. 네 변/솔로·점령 일반 엄폐/ORBIT 보존. 부메랑은 복귀, 유령탄은 종료 |
| PASS | content:check / 최종 paired build |생성 hash `87c44dcd8a38dbcd0fe0d5721327ef31131f6879446839e7af9ba0fdda57280b`, 경계 보완 후 Vite11.11초 |
| PASS(기능만) | 마지막 수정본 솔로/점령3라운드 |39.6518/40.5276초, 모두 Canvas3화면/20접속/과부하0/오류0. 성능 비악화 PASS 아님 |
| INFRA_FAILURE | Targeted 첫 실행 |2.7초. 기존 다른 앱이5173포트를 사용하여 시험 서버 시작 실패. 기존 프로세스 유지 |
| INFRA_FAILURE | Targeted 두 번째 실행 |2.4초. 별도 포트용 로컬 임시 설정의 작업 경로 오류. 기능 단언 실행 전 실패 |
| INFRA_FAILURE | Targeted 별도 포트 첫 실행 |34.615초. 임시 포트의 정확한 Origin 미지정으로 WSS403, 방 생성3검사 실패. 로컬 시험 설정 오류이며 성공으로 표시하지 않음.15187 Origin 설정 후 최종 실행 통과 |
| PASS | X 지형 도약 / 가이드 / 실제 착지 |집중1검사0.2465초. 합법 양 끝 사이 막힌 영역 관통 금지, 외곽 및 일반 엄폐 넘기 유지. 스킬 수치·metadata 변경 없음 |
| PASS | 최종 로컬 Targeted |198.094초:3모드 E2E, 대표 Canvas/Pixi, 선택034/070/127/128 balanced Canvas/Pixi, layout, resource-lifetime,26명30초 부하. 전체83종 전수 아님 |
| FAIL→PASS | 마지막 도약 수정의 기존 순서 회귀 |개인전029의 warning/leap 생성 순서 비교 FAIL0.174초. 개인전 원래 순서 복구 후 원본 parity+점령 경계2검사 PASS0.2198초. content:check PASS. 위 로컬 Targeted/빌드는 이 순서 보완 전이며 최종 HEAD 빌드·회귀는 CI에서 수행 |
| PR Checks 참조 | 제출 HEAD GitHub CI |이 문서 작성 시 실행 전. 실행되지 않은 CI를 PASS로 표시하지 않으며 최종 SHA/실행 URL/결과는 PR 본문에 기록 |
| NOT_RUN | 새605초 부하, 전83종×전체 화질 시각 matrix, 실물 Samsung/iPhone/iPad, 실제 교실20기기 |이번 변경 범위에서 요구하지 않은 전수/장시간 시험을 새로 실행하지 않음. 기존 극후반 호스트 지연·과거 극한부하 FAIL·실기기 미검증은 보존 |
| NOT_RUN | AWS/정식 Pages/Firebase 배포·main 병합 |이번 권한 밖. PR 검토/사용자 병합 후 기존 paired candidate와 승인 배포 절차 사용 |

Quick의 기존 전체 공통 단언은 유지했다. `tools/ci/plan.mjs`는 이번87→83 문구 변경에만 이전 manifest의 81종 기계적 동일성을 확인한 뒤 bulk registry의 문구/삭제 참조를 캐릭터 전수 브라우저 검사로 확대하지 않는다. 두 리워크034/070과 bulk registry 밖 코드가 직접 참조한127/128은 선택 검사에 남고, 전투·네트워크·대표 화면·부하 검사는 그대로다. 유지81종 중 다른 숫자/기능 필드가 달라지면 이 범위 축소는 적용되지 않는다.

로컬 Targeted 재개는15187/18087 별도 포트의 임시 설정을 사용하며 원본 기능 단언과 저장소 CI 설정을 바꾸지 않았다. 이 실행 결과는 위 최종 Targeted 행과 [실행 결과](evidence/upgrade-targeted.json)에 기록했다.

재현 명령(로컬 artifact 경로는 Git에 포함되지 않을 수 있음):

```powershell
node tools/ci/plan.mjs 790fb11
npm run content:check
node --test tests/unit/escape.test.mjs tests/unit/capture-x.test.mjs tests/unit/upgrade-roster.test.mjs tests/unit/roster83-text.test.mjs tests/unit/roster83-scope.test.mjs
npm run quick
npm run build
npm run test:targeted
node tests/combat/escape.mjs canvas
node tests/combat/escape.mjs pixi
node tests/combat/capture-x.mjs canvas
node tests/combat/capture-x.mjs pixi
node tests/combat/upgrade-roster.mjs canvas
node tests/combat/upgrade-roster.mjs pixi
$env:CLASSROOM_UPGRADE='1'
$env:CLASSROOM_MODE='solo'
node tests/combat/classroom-rematch.mjs upgrade-optimized-solo
$env:CLASSROOM_MODE='team-capture'
node tests/combat/classroom-rematch.mjs upgrade-optimized-capture
```

최종 SHA / PR / 정확한 HEAD CI는 제출 PR의 HEAD 및 Checks 링크에 기록한다. 이미 통과한 무관한 검사를 문서 갱신만을 이유로 반복하지 않는다. 공식 주소에 이번 패치가 적용됐다고 보고하지 않는다.
