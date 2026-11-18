# v35.6 CI / Pixi 후속 검증

기준 작업 HEAD는 `5a0fccbe67378a7aae15800fe68c7a68df64a6af`, 비교 v35.5는 PR26 병합 main `e328aad252e243428123e3d576ea8ffefcdb8604`다. 이 후속 작업은 게임 수치·렌더 품질·인원·보호 기준을 바꾸지 않는다.

## 격리 CI

기존 CI44386746600은 게임 관련19개 Job PASS였으나 isolated-release가 두 번 TIMEOUT했다. 최초 Ubuntu32.1MB 다운로드6분56초 뒤 정상 lifecycle PASS, observer-loss 실패주입 미완료. 단일 재시도는 다운로드9분11초(58.1kB/s)로 기능 검사 시작 전 중단. 후속 required-checks FAIL을 유지한다.

새 실행 환경은 저장소의 기존 `mcr.microsoft.com/playwright:v1.56.1-noble`에 포함된 Chromium/OS 라이브러리와 이미지 레이어를 재사용한다. 매번 apt/browser 설치를 하지 않는다. 후보 안의 Playwright 버전과 고정 이미지 버전을 대조한다. 브라우저 서버는 일회용 Actions runner의 `127.0.0.1`에서만 접근하며 host network로 기존 localhost Pages/게임 컨테이너에 연결한다. 두 검사는 기존 정확한 후보 SHA·이미지·Origin·버전·일반 조작·재접속·결과·재경기와 observer-loss WARNING 실패주입 assertion을 그대로 실행한다. 기존10분 제한·게임 컨테이너1GB/2CPU는 그대로다. 브라우저 컨테이너는 항상 정리한다. 운영 workflow/서버는 변경하지 않는다.

## 사전 고정 성능 비교

- A: v35.5, B: 정확한 기존 v35.6 HEAD, C: B의 서버·콘텐츠를 유지하고 두 몸체 렌더 파일만 A로 교체한 **진단용** 복사본. C는 배포/기능 승인 후보가 아니다.
- 각 시나리오를 같은 runner에서 **A B C C B A** 순서로 한 번 실행한다. 매번 새 서버·브라우저 프로세스. 전체 결과와 실패를 보존하고 좋은 결과가 나올 때까지 반복하지 않는다.
- 기존20인 Pixi balanced 동일방5경기와30인 Pixi high1경기, 가상 학생·호스트+학생2화면·입력/공격·실제 전송·재경기 assertion을 재사용한다.
- 문제 구간인20인 team-elim 및30인 창에 동일한1ms CPU sampling/512KiB 할당 sampling을 적용한다. 서버 CPU/RSS/GC/스냅샷/전송과 브라우저 pose/image/draw/heap을 구분한다. 모든 연속 측정이 끝난 재경기 후에만 별도 GC 후 생존 객체를 확인한다. 강제 GC 값을 정상 성능 값으로 사용하지 않는다.
- 세 변형 모두 같은 PC의 자원 경합은 존재한다. CI 소프트웨어 GPU 결과를 실기기 FPS로 표현하지 않는다. C는 새 몸체 경로의 인과 분리를 위한 것이며 이펙트 제거로 통과하는 수단이 아니다.

## 실행 기록

- 격리 브라우저 endpoint/기존 launch 경로·프로파일 opt-in 집중 단위3개 PASS197.5ms.
- 실제 Edge launchServer에 두 번 연결/페이지 생성/close 후 재연결 PASS. 두 격리 검사가 같은 서비스에 순서대로 연결할 수 있음을 확인했다.
- 로컬 새 계측 기동30인 Pixi high1회: **FAIL58.690초**, profiler 시작 전35step/8snapshot 구간에 overload1, 공격버튼 PAUSED. step p9538.921ms/max127.875ms, snapshot p9546.870ms. 30명 연결은 유지했고 브라우저 오류0. 이 실행은 계측 성공이나 성능 개선 근거가 아니다. 별도 브라우저 서비스 확인과 잠시 겹친 같은 PC 조건이며 원인은 확정하지 않는다. 원본은 `artifacts/v35-6/live-local-profile-pixi-high-solo-30-prepared-r1/report.json`에 보존한다.
- 로컬 Quick: ReleaseOps8 + 일반425 전부 PASS(일반254.233초). 필수 paired build PASS9.356초(Vite7.04초). 런타임 sourceHash `ea84952e7cf0361c307deb83e6e0a0b174de253a93e3715e965a71f54ef91024`가5a0fccbe와 동일하다.
- 필수 CI 및 사전 고정 A/B/C 비교는 제출 후 실행한다. 최종 결과는 이 문서 또는 PR27 본문에 기록하며, 아직 실행되지 않은 항목은 PASS가 아니다.

main 병합·AWS/Pages/Firebase·Secrets/서버 설정 변경 없음.
