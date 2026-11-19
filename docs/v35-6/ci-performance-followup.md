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
- [필수 CI44417437231](https://github.com/YEOMT/DSbettleroyale/actions/runs/44417437231), HEAD `d2fc1cfd21ac723c41687b87bfa99bea8ec10ae8`: **21/21 Job PASS**, required-checks 포함. Quick8+425, Python31, build, Targeted, 변경9종 Canvas/Pixi, touch/recovery/continuous, Roster10, exact-baseline isolated-release 완료.
- isolated-release 전체201초, 준비22.471초(이전 apt만416/551초), 일반 isolated step62초, 실패주입 step77초/실제 lifecycle45.633초. 실패주입의 의도된 `DEGRADED_RELEASE`, resumeMove WARNING과 Results/Rematch/closed=true를 모두 검증했다. 정상 lifecycle의 실제 재접속 조작 PASS와 구분한다.

## 재계측 결과와 해석

[원본 실행44417437243](https://github.com/YEOMT/DSbettleroyale/actions/runs/44417437243), [전체 보존 수치](evidence/followup-performance.json). 이전 한 쌍의 극단 값은 삭제하지 않았다. 다음은 문제였던20인 team-elim/30인 solo 구간이며, 완료된 전투 측정 후 lifecycle이 실패한 표본도 제외하지 않았다.

|측정|A: v35.5|B: v35.6|C: B 서버 + 이전 몸체|
|---|---:|---:|---:|
|20인 서버 CPU ms/s|182.16|198.60 / 179.15|229.73 / 222.15|
|20인 서버 RSS MiB|279.13|290.77 / 283.43|286.37 / 281.55|
|20인 snapshot p95 ms|3.29|6.07 / 4.78|5.70 / 5.11|
|20인 WS JSON MB/s|13.01|15.71 / 13.87|16.03 / 15.14|
|30인 서버 CPU ms/s|338.60 / 343.19|333.98 / 335.81|344.60 / 343.72|
|30인 서버 RSS MiB|394.61 / 397.55|391.55 / 394.71|392.48 / 400.54|

**확인한 것:** CPU/RSS가 증가했던 대상은 서버 프로세스다. 이 프로파일에서 주요 서버 경로는 WebSocket `writev`, JSON 직렬화, 가시 상태 생성/송신과 GC였고, 새 브라우저 몸체 코드가 서버에서 실행되는 경로는 없다. 20인 이전의 CPU+95%와30인 RSS+22%는 이번 고정 순서 표본에서 재현되지 않았다. B와 C의 서버·콘텐츠 해시는 일치했고, 이전 몸체로 바꾼 C에서 서버 CPU/RSS가 줄지 않았다. 새 몸체가 해당 큰 증가의 주원인이라는 증거는 없다. 그렇다고 몸체가 모든 기기에서 무비용임을 뜻하지 않는다.

브라우저의20인 B 호스트 poseSample 합계는 구간당0.2~2.2ms(340호출), actorBody 합계1.3~3.4ms였다. 이 값들은 중첩 계측이므로 더해서 CPU 합계를 만들지 않는다. body 비용은 실제 draw/rAF 지연과 구분했다. CI는 SwiftShader와 머신 CPU busy약93% 조건이며20인 rAF p95약217~233ms,30인은약533~800ms다. 이 결과를 실물 학생 FPS로 주장하지 않는다.

**남아 있는 증가:** 20인 snapshot p95와 전송 바이트는 B/C 모두 A보다 높았다. 50~51회 snapshot 창의 SNAPSHOT 합계가 A29.25MB, B31.79~36.37MB, C34.38~37.03MB였다. 승인된 밸런스/실제 교전 상태가 다른 조건에서 관측한 직렬화·송신 부담이며, 증가분을 특정 캐릭터나 단일 필드 탓으로 확정할 근거는 없다. 효과 삭제/주기 감소로 맞추지 않았다.

**메모리 해석:** 모든 연속 측정이 끝난 뒤의 별도 GC에서30인 살아 있는 heap은 A18.53MiB/B18.26MiB/C18.52~18.62MiB로 내려갔지만 RSS는 약391~397MiB에 남았다. A/B/C 모두 V8 new-space가128MiB 예약 상태이고 live heap과 RSS가 다르다. 현재 표본의 큰 RSS는 살아 있는 게임 객체량과 일치하지 않는다.20인5경기 후 heap도 A20.84/B20.96~21.03/C20.71~20.88MiB였다. 단,20인 모두 WeakRef 기준world3/actor60,30인world1/actor30이 남았다. fixture의 `previous` 참조가 최소 한 world를 유지하지만 나머지 보유 원인/장시간 누수 부재는 이 검사로 확정하지 않는다. 기존 버전에도 같은 수가 남았다는 것만 확인했다.

## 실패·취소를 구분한 최종 판정

- **20인 진단 Job TIMEOUT:** 예정 A B C C B A 중 앞5개 표본을 완료했다. A/B/C/B는5경기 기능PASS, 두 번째C는4경기의 기존 `KNOWN_LATE_RESULT_C07`로PARTIAL. 마지막A 실행 중20분 Job 제한에 도달했으며 데이터가 완결되지 않아 대체/평균 보간하지 않았다. 완전한 역순 균형 표본은 아니다.
- **30인 진단 Job FAIL:** 6개 전투 측정창은 모두 수집했지만 첫A/B는 END 응답 확인 실패. 서버는RESULTS/30연결/과부하0이고 호스트는BATTLE 상태였으며, 서버의RESULTS 송신과 호스트 미수신을 확인했다. 이는 서버가 END를 실행하지 않은 실패와 구별되는 전달 지연이다. 공유 소프트웨어GPU에서의 실제 기능 관측 실패이며 순수 인프라 실패라고 단정하지 않는다. 나머지C/C/B/A는PASS. 실패한A/B의 수치를 숨기지 않는다.
- **명시적 취소:** 44417437166(v35.5),44417437168(v35.4),44417437164(v35.6)는 동일 runtime sourceHash의 기존 통과 부가 검사를 중복하지 않기 위해 취소했다. 실제FAIL/TIMEOUT 또는 새PASS로 집계하지 않는다.
- **실기기/학교Wi-Fi/AWS1GB/600·1200초 NOT_RUN. 성능 전체 PASS 아님.** 대규모 최적화나 임의 수치 변경을 추가하지 않았다.

진단 결과 보존을 위해 각 표본 직전/직후 checkpoint를 추가했다. 이후 수동 실행에서는20인의 동일6표본을 ABC/CBA 두 Job으로 나눠 각 Job 안에서 세 변형을 같은 runner로 비교한다. 기존20분 제한·각 표본5경기·모든 assertion을 유지하며,30인은 기존6표본 그대로다. 서로 다른 Job 수치를 같은 머신으로 혼동하면 안 된다. **이번 결과를 좋게 바꾸기 위한 재실행은 하지 않았다.** 자동 PR 반복 대신 manual-only로 두었다. 기존 A/B 도구에는 새 보조 파일 복사 누락만 보완했다. 이 보존/문서 후속 커밋의 최종 필수 CI 상태는 PR27에 별도로 기록한다.

main 병합·AWS/Pages/Firebase·Secrets/서버 설정 변경 없음.
