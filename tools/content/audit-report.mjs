const cell=v=>String(v??'—').replaceAll('|','/').replaceAll('\n',' ');
export function rosterAudit(content,display){
 const counts={};for(const a of content.roster)counts[a.tier]=(counts[a.tier]||0)+1;
 const intro=`# 활성 ${content.roster.length}종 문구 대조 기록

생성: \`node tools/content/generate.mjs\`. 확인: \`node tools/content/generate.mjs --check\`, \`node --test tests/unit/roster83-text.test.mjs\`.

이번 패치의 문구 권위는 현재 엔진 정의 → world/roster-text.js의 문구 보정 → tools/content/cards.mjs → manifest/display 순서다. legacy/v32.1과 legacy-display는 역사 자료로 보존하며 현재 카드 생성에는 사용하지 않는다. 이름·이모지·영구 ID·등급은 유지하고, 삭제4종(048/065/073/076)은 아래 활성 목록에서 제외했다.

활성 ${content.roster.length}종 / ${Object.entries(counts).map(([k,n])=>k+' '+n).join(' · ')}. 등급 확률: ${display.odds}. 등급 내 후보 수가 변해도 등급 확률은 변하지 않는다.

대조 범위: 모든 활성 캐릭터의 최종 basicProfile, 최종 BRRework 정의와 native 실행 분기(Participant.usePlayerAbilityBase, brCastPlayableSkill), aimSpec, cooldown 및 brRunEligible을 대조했다. 재구성 카드와 프로필 수치/증강 자격 일치 및 누락 ID는 자동 단언한다. 실기기 플레이와 전수 시각 검사는 별도 실행 항목이다.

숫자는 Lv1·무증강 기준이다. 피해는 스킬의 기본 계수이며 최종 HP 차감에는 등급·피해 배율·방어·보호막이 적용된다. 복합 기술의 즉시/주기/마지막 피해는 설명과 생성 facts에 구분한다. 기존 native 돌진/치료의 대기시간 흔들림(0.9~1.1)은 범위로 표시한다. 전역 치료는 '자기 중심'으로 오표시하지 않는다. 사거리는 월드 단위의 최대 조준 거리이며 투사체의 출발 오프셋·몸체 범위와 구분한다.

## 고친 예시

| 대상 | 이전 | 현재 |
|---|---|---|
| 농구왕 | 원반을 돌아오게 해 두 번의 기회 | 농구공 적중 후 반환 공으로 남은 스킬 대기 한 번50% 환급 |
| 통조림 투척 | 깨지는 화분 | 통조림 폭발과 짧은 가시 지대 |
| 롤러스케이트 | 질주한 길에 폭탄을 남김 | 접촉 직선 돌진 후 2초 이내 첫 평타의 넉백 45% 증가 |
| 대마법사 | 여섯 발 요약 / 총 피해160 | 14발 순차 연사, 일반11.55/마지막17.85 계수 |
| 가위 수호자 | 첫 베기 뒤 두 번 추가 근접 연격 | 가위 5발씩 최초+재사용 2회, 재사용마다 방향 재설정 |
| 블러드로드 | 중복 흡혈 문구 / 저체력 연격 콘셉트 | 평타 HP피해20% 흡혈을 한 번 표기 / HP비용 혈격과 회복 |
| 볼링/다트 | 반사 스킬 / 세 갈래 다트 | 직선 관통 스트라이크 / 5초 자기 공속 버프와 평타 중앙 치명타 |

## 전체 활성 목록

각 행은 현재 생성 카드다. 스킬 강화 가능 여부는 아래 문구와 별도로 display.cards[id].facts.eligibleAugments에 전체 자격 ID를 보존한다.

| ID · 이름 · 등급 | 콘셉트 | 일반 공격 | 현재 스킬 · 사거리 · 대기 | 증강 |
|---|---|---|---|---|
`;
 return intro+content.roster.map(a=>{const c=display.cards[a.id];return '| '+[a.id+' '+a.emoji+' '+a.name+' '+a.tier,c.concept,c.basic,c.skill,c.passive].map(cell).join(' | ')+' |';}).join('\n')+'\n';
}
