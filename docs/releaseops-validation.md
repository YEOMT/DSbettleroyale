# ReleaseOps 표적 검증 기록

대상: `codex/releaseops-fast-ci`, v33.2 main `206aaee4bca23d639769134bc86773fb3214ec1e` 기반 변경. 실제 최종 커밋/CI 링크는 PR에 기록한다. 이 파일의 로컬 시험은 수정 중인 작업 트리 시험이며 기존 main 자체가 새 자동화를 포함한다고 주장하지 않는다.

| 검사 | 실행 결과/시간 | 범위 |
|---|---|---|
| 변경 분류·출처·workflow·admission·캐릭터 선택기 | PASS, 약 1.5초(추가 케이스 포함 최종 CI 별도) | 문서/CSS가 deep을 선택하지 않음, executable UI/통신/lockfile은 high, wrong SHA/event/repo 거부 |
| 공통 정적/unit/parity/integration 최초 실행 | 21.81초, 122개 PASS / WS 12개 INFRA_FAILURE | Windows sandbox `connect EACCES`; PASS로 표시하지 않음 |
| WS 12개만 권한 허용 환경에서 재실행 | 12/12 PASS, 8.85초 | 이미 통과한 unit/parity는 반복하지 않음 |
| 추가 WS 버전/Origin 거부·admission 재시작 | 2/2 PASS, 1.15초 | 잘못된 buildId/Origin 참가 거부, 닫힌 상태 두 번 재시작→완료 후 열림 |
| Python 배포 transaction fixture | 11개 PASS, 0.87초 기준 | timeout 전 컨테이너 불변, Pages 실패 후 쌍 복구, 복구 검증 실패 차단, 중단 감지, 승인 SHA 고정, 설정·checksum, 정상 영속화 |
| 3모드 실제 브라우저 E2E | 3/3 PASS, 114.60초 | 교사1+학생2, 퀴즈→배정→전투→결과→재경기 |
| Canvas 대표 렌더 | PASS, 71.98초 | 기존 기본투사체/근접/마법사 스킬 판정 그대로 |
| Pixi 대표 렌더 | PASS, 74.18초 | 같은 3종; 전수 77종 검사 아님 |
| 26 WS, 30초 부하 | PASS, 35.70초(기동/정리 포함) | 14,525 snapshots, 오류0; 실제 26대/600초 안정성 아님 |
| 위 선택된 targeted 총 실행 | PASS, 296.46초 | 깊은 시각/장기 부하 제외 |
| 기본 client/server build | PASS, Vite 17.02초 | server 1회 빌드 후 변형에서 재사용 |
| direct production/staging/Pages client 변형 | PASS, Vite 각각 25.57/22.59/16.20초 | 각각 다른 base/WSS/환경 표시, 같은 buildId |
| 세 변형 교사1+학생2 lifecycle | PASS, staging 16.22초 / direct 12.45초 / Pages 12.25초 | 실제 빌드된 HTML/JS와 격리 WS 연결. 컴파일된 WSS 목적지를 먼저 assert하고 로컬로 전달. 공개 배포 검증 아님 |
| 캐릭터 선택기 실제 브라우저 | Canvas/Pixi 각각 선택한 `emoji-001` PASS | balanced 품질, 기존 공격/스킬/표시 판정 유지. 전체 77종으로 표기하지 않음. 종료 시 Vite ECONNRESET 로그는 서버/브라우저 정리 중 발생했으며 테스트 exit 0 |
| 변형 smoke 최초 시도 | FAIL(테스트 어댑터 오류), 수정 후 위 PASS | 설치된 Playwright connectToServer는 URL 변경 인수를 지원하지 않음. 어댑터만 수정, 재빌드/기존 통과 suite 재실행 없음 |

Python 최초 실행도 sandbox 임시 디렉터리 권한 오류(INFRA_FAILURE)였다. fixture 임시 디렉터리를 허용된 작업 폴더로 옮긴 뒤 실행했다. 서버/게임 판정 오류로 숨기지 않는다.

로컬 변형 manifest는 `sourceDirty:true`, `LOCAL_FIXTURE_NOT_DEPLOYABLE`로 표시한다. seal/host는 이를 거부한다. GitHub main 후보는 깨끗한 정확한 SHA의 CI 산출물만 수용한다.

NOT_RUN: 공개 staging 배포, production/Pages 게시·롤백, 실제 Docker/Compose/Caddy/SSH 전환, BuildKit 캐시 속도, 브라우저 캐시 복원 이득, 실제 AWS 재시작. PC에 Docker/SSH 인증이 없으며 이번 요청은 운영 변경을 금지했다. 이 경로는 workflow와 mock/실제 로컬 WS로 검증했고 외부 실행 성공으로 표기하지 않는다.

NOT_RUN(의도한 제외): roster 전체 462 시각 조합, 카메라 9000프레임, 화면 전체30조합, 퀴즈 45/60/90초 실시간, 600초 부하, 실기기·음원 청취. 기존 Deep Audit 항목/판정은 유지했다. 기존 26/30명 장기 과부하 실패는 해결되지 않았다.

공개 AWS `/version` 읽기 결과는 `206aaee4bca23d639769134bc86773fb3214ec1e`와 일치했다. 이는 사용자가 갱신한 기존 배포이며 이번 ReleaseOps로 배포한 결과가 아니다. 새 staging 주소는 bootstrap/Secrets/프록시 설정 전 **BLOCKED_CONFIGURATION**이다.
