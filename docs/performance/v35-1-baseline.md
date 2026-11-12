# v35.1 수업 환경 성능 비교

기준 v34는 `9a29a23a8eb62095308501109e8e15c610379959`, 병합된 v35는 `f3549883674a2c456fdc1fd7e3fb18dc8c46cce3`이다. 작업 시작 시 공개 AWS `/version`은 v34 SHA를 반환했다. v35 main에서 격리 후보의 Results 고장 주입과 Pixi 포탈 복귀 이동 검사가 실패했다. 이어진 후보 작업은 건너뛰었고 release 아티팩트는 0개였다. [기준 main CI](https://github.com/YEOMT/DSbettleroyale/actions/runs/43229052897) · [후보 실행](https://github.com/YEOMT/DSbettleroyale/actions/runs/43231231415)

## 비교 조건

동일한 Linux 작업 내 세 버전을 각각 체크아웃한다. 20명과 호스트, 학생 브라우저 두 개에서 같은 시드·맵·입력 절차로 3라운드 진행한다. 개인전과 점령전, Canvas와 소프트웨어 Pixi를 별도로 비교하며 네 경우의 절반에서는 버전 실행 순서를 뒤집는다. 30인 소켓 부하와 동일 입력의 서버 단독 교차 측정을 분리했다. 공유 러너의 브라우저·서버 자원 경합, 실시간 입력 간격 및 GC 차이는 남는다.

`node tests/combat/classroom-compare.mjs v35.1 solo pixi`가 세 버전의 비교를 실행한다. `solo canvas`는 추가로 나머지 4개 개인전 맵을 각 3회, `team-capture canvas`는 서버 단독 교차 시험, `scissors pixi`는 480발, `load30 sockets`는 세 버전의 40초와 작업본의 600초 실제 연결을 검사한다. 컨테이너와 잠금 파일은 기존 Evolution comparison과 같다. 공개 산출물에는 합성 참가자의 집계만 담는다.

하드웨어 태블릿 FPS, 실제 수업 Wi-Fi, AWS 1GB에서의 v35.1 성능은 미검증이다.
