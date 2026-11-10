// Generated from current authority runtime. Display text only; no client combat.
export const display={
  "rosterVersion": "emoji83-xmap-v33",
  "odds": "S 10% · A 20% · B 25% · C 30% · F 15%",
  "cards": {
    "emoji-000": {
      "basic": "작은 화염구 · 1발 · 작은 폭발",
      "skill": "느린 거대 화염구 1발 · 충돌/종점 폭발 79.8 · 2.5초 화염(0.5초마다 8.4, 최대 2곳) · 기절 없음 · 최대 조준 거리 940 · 대기 17초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "17초",
      "label": "용의 분노",
      "category": "원거리형",
      "concept": "큰 불덩이로 진입로를 막는 용 포격수",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 748,
          "intervalFrames": 47,
          "coefficient": 22.68
        },
        "skill": {
          "kind": "fireball",
          "aimRange": 940,
          "cooldownFrames": 1020,
          "cooldownJitter": false,
          "durationFrames": 150,
          "damageCoefficient": 79.8
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-001": {
      "basic": "번개 근접 타격",
      "skill": "0.3초 착지 예고 후 조준 지점 강림 · 반경 245 피해 72 · 1.5초 기절(강화 상한 2초) · 최대 조준 거리 700 · 대기 17초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "17초",
      "label": "천둥군주",
      "category": "암살자",
      "concept": "착지 지점을 골라 번개를 터뜨리는 기습자",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 162,
          "intervalFrames": 33,
          "coefficient": 33.067440000000005
        },
        "skill": {
          "kind": "thunder-landing",
          "aimRange": 700,
          "cooldownFrames": 1020,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 72
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-002": {
      "basic": "근접 포획 타격",
      "skill": "최장거리 포획탄 · 첫 적을 고정된 앞 지점으로 끌어옴 · 도착 후 0.6초 기절 · 벽 차단 · 최대 조준 거리 1320 · 대기 16.5초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "16.5초",
      "label": "우주 납치범",
      "category": "근접형",
      "concept": "정확한 납치로 적을 내 앞으로 옮긴다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 192.704,
          "intervalFrames": 30,
          "coefficient": 30.618000000000006
        },
        "skill": {
          "kind": "hook",
          "aimRange": 1320,
          "cooldownFrames": 990,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 52
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-003": {
      "basic": "빠른 마력탄 · 1발",
      "skill": "짧은 집중 후 같은 방향으로 14발 순차 연사 · 일반 탄 반경 24, 피해 계수 11.55 · 마지막 탄 반경 32, 피해 계수 17.85 · 발사 중 자동 재조준 없음 · 최대 조준 거리 1110 · 대기 20초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "20초",
      "label": "대마법사",
      "category": "원거리형",
      "concept": "같은 방향으로 순차 마력탄을 쏘아 길을 봉쇄한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 986,
          "intervalFrames": 29,
          "coefficient": 17.22
        },
        "skill": {
          "kind": "sequential-barrage",
          "aimRange": 1110,
          "cooldownFrames": 1200,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 11.55,
          "finalDamageCoefficient": 17.85
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-004": {
      "basic": "단도 근접 베기",
      "skill": "조준 지점으로 순간이동 · 착지 반경 135의 적 1명에게 68 · HP 35% 이하라면 추가 54(즉사 아님) · 최대 조준 거리 680 · 대기 15초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "15초",
      "label": "공허 암살자",
      "category": "암살자",
      "concept": "순간이동으로 약해진 적을 마무리한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 141.1,
          "intervalFrames": 39,
          "coefficient": 33.067440000000005
        },
        "skill": {
          "kind": "blink-finisher",
          "aimRange": 680,
          "cooldownFrames": 900,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 68
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-006": {
      "basic": "검 근접 베기",
      "skill": "3초 회전 검 · 동일 대상 0.4초 간격 피해 17 · 자연 종료 때 현재 방향 마지막 베기 60 · 기절 없음 · 최대 조준 거리 200 · 대기 18초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 지속",
      "cooldown": "18초",
      "label": "검성",
      "category": "근접형",
      "concept": "회전 검 사이로 파고드는 연속 참격 검사",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 157.13600000000002,
          "intervalFrames": 29,
          "coefficient": 30.618000000000006
        },
        "skill": {
          "kind": "orbit-finisher",
          "aimRange": 200,
          "cooldownFrames": 1080,
          "cooldownJitter": false,
          "durationFrames": 180,
          "damageCoefficient": 17
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-007": {
      "basic": "방사능 탄 · 1발",
      "skill": "0.6초 고정 원형 경고 후 방사능 폭발 86.1 · 2.5초 오염(0.5초마다 7.35) · 사망 폭발은 30, 생명당 1회 · 자기 중심 · 대기 19초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "19초",
      "label": "폴아웃",
      "category": "원거리형",
      "concept": "자신을 중심으로 위험 구역을 만드는 방사능 투사",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 36,
          "coefficient": 21
        },
        "skill": {
          "kind": "nuclear-pulse",
          "aimRange": 0,
          "cooldownFrames": 1140,
          "cooldownJitter": false,
          "durationFrames": 150,
          "damageCoefficient": 86.1
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-008": {
      "basic": "영혼탄 · 1발 · 유도",
      "skill": "2.5초 은신 이동 · 첫 일반 공격 시도만 피해 1.6배(빗나가도 소비) · 공격 시 실체화 · 벽 통과 유지, 무적 아님 · 자기 중심 · 대기 14초",
      "passive": "스킬 증강: 대기 단축 · 고유 지속",
      "cooldown": "14초",
      "label": "폴터가이스트",
      "category": "원거리형",
      "concept": "벽을 통과하며 기습 각도를 만드는 유령",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 38,
          "coefficient": 21
        },
        "skill": {
          "kind": "ghost-ambush",
          "aimRange": 0,
          "cooldownFrames": 840,
          "cooldownJitter": false,
          "durationFrames": 150,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-010": {
      "basic": "행성 탄 · 1발",
      "skill": "3.5초 중력장 1개 · 외곽 330 약한 흡입 / 내부 170 틱 피해 8.24 · 자연 종료 때 반경 225 붕괴 63.86 · 최대 조준 거리 700 · 대기 19초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 지속",
      "cooldown": "19초",
      "label": "블랙홀",
      "category": "설치형",
      "concept": "중력장을 놓아 적의 동선을 끌어 모은다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 33,
          "coefficient": 21
        },
        "skill": {
          "kind": "gravity-field",
          "aimRange": 700,
          "cooldownFrames": 1140,
          "cooldownJitter": false,
          "durationFrames": 210,
          "damageCoefficient": 8.24
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-012": {
      "basic": "지니 사격 · 1발",
      "skill": "HP 56 포탑 설치 · 동시 3개 / 각 24초 · 4번째는 가장 오래된 포탑 교체 · 4회마다 강화탄 · 최대 조준 거리 250 · 대기 7초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 고유 사거리 · 고유 지속",
      "cooldown": "7초",
      "label": "지니",
      "category": "설치형",
      "concept": "포탑 옆에서 전선을 만드는 설치 전문가",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 37,
          "coefficient": 21
        },
        "skill": {
          "kind": "turret",
          "aimRange": 250,
          "cooldownFrames": 420,
          "cooldownJitter": false,
          "durationFrames": 1440,
          "damageCoefficient": 15.45
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "swift",
          "titan",
          "regen",
          "signature_range",
          "signature_duration"
        ]
      }
    },
    "emoji-013": {
      "basic": "피의 근접 베기 · 실제 HP 피해의 20% 흡혈",
      "skill": "현재 HP 15% 비용(최소 HP 1) · 0.4초 준비 후 혈격 84 · 실제 HP 피해의 40% 회복, 시전당 최대 HP 25% 상한(회복 증강도 상한 유지) · 자기 중심 · 대기 16초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 회복·보호",
      "cooldown": "16초",
      "label": "블러드로드",
      "category": "근접형",
      "concept": "체력을 소모해 혈격을 터뜨리고 실제 피해로 회복한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 176.484992,
          "intervalFrames": 32,
          "coefficient": 27.862380000000005
        },
        "skill": {
          "kind": "blood-pulse",
          "aimRange": 0,
          "cooldownFrames": 960,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 84
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-014": {
      "basic": "독성 구체 · 1발",
      "skill": "5초 독구름 1개 · 2.5초간 반경 110→310 확장 · 현재 범위에서 0.5초마다 피해 10.3 · 기절 없음 · 최대 조준 거리 690 · 대기 17초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 고유 지속",
      "cooldown": "17초",
      "label": "역병군주",
      "category": "설치형",
      "concept": "퍼지는 독구름으로 공간을 빼앗는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 30,
          "coefficient": 21
        },
        "skill": {
          "kind": "growing-poison",
          "aimRange": 690,
          "cooldownFrames": 1020,
          "cooldownJitter": false,
          "durationFrames": 300,
          "damageCoefficient": 10.3
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-019": {
      "basic": "무거운 차체 근접 타격",
      "skill": "0.4초 출발 예고 후 80~1480 거리 선택(탭 220) 직선 관통 돌진 · 대상별 피해 92 한 번과 강한 밀침 · 벽에서 정지, 기절 없음 · 최대 조준 거리 1480 · 대기 20초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "20초",
      "label": "폭주기관차",
      "category": "근접형",
      "concept": "기차 몸체로 직선 돌진해 일렬의 적을 밀어낸다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 162.82688000000002,
          "intervalFrames": 36,
          "coefficient": 33.67980000000001
        },
        "skill": {
          "kind": "train-charge",
          "aimRange": 1480,
          "cooldownFrames": 1200,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 92
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-020": {
      "basic": "별 탄 · 1발",
      "skill": "자신 중심 별 6방향 파동을 0.35초 간격으로 2회 · 탄당 피해 25.2 · 개수 증강은 파동당 방향 수(최대 10) · 최대 조준 거리 780 · 대기 17초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "17초",
      "label": "초신성",
      "category": "원거리형",
      "concept": "별을 전방위로 뿌려 포위를 뚫는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 37,
          "coefficient": 21
        },
        "skill": {
          "kind": "radial-waves",
          "aimRange": 780,
          "cooldownFrames": 1020,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 25.2
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-022": {
      "basic": "요요 · 1발 · 왕복",
      "skill": "긴 요요 왕복 · 끝점 0.3초 체류 후 현재 위치로 복귀 · 나갈 때/돌아올 때 각각 피해 44.1 한 번 · 기절 없음 · 최대 조준 거리 1040 · 대기 16초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "16초",
      "label": "요요 마스터",
      "category": "원거리형",
      "concept": "나가는 길과 돌아오는 길을 모두 맞힌다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 704,
          "intervalFrames": 33,
          "coefficient": 13.817999999999998
        },
        "skill": {
          "kind": "yoyo",
          "aimRange": 1040,
          "cooldownFrames": 960,
          "cooldownJitter": false,
          "durationFrames": 240,
          "damageCoefficient": 44.1
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-037": {
      "basic": "구급차 근접 타격",
      "skill": "4초 자가 재생 · 0.5초마다 최대 HP 4%(총 32%) · 기절 중 신규 시전 불가, 승인된 재생은 지속 · 자기 중심 · 대기 16초",
      "passive": "스킬 증강: 대기 단축 · 회복·보호 · 고유 지속",
      "cooldown": "16초",
      "label": "구급차",
      "category": "근접형",
      "concept": "재생으로 버티며 다음 교전을 준비한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 128.6816,
          "intervalFrames": 33,
          "coefficient": 30.618000000000006
        },
        "skill": {
          "kind": "self-regeneration",
          "aimRange": 0,
          "cooldownFrames": 960,
          "cooldownJitter": false,
          "durationFrames": 240,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "restore",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-085": {
      "basic": "마안 탄 · 1발 · 유도",
      "skill": "큰 유도 마안 4발 · 탄당 피해 27.81 · 대상별 시전당 1회 0.75초 기절 · 회전 상한/벽/은신/사거리 적용 · 최대 조준 거리 1110 · 대기 18초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "18초",
      "label": "심연의 눈",
      "category": "원거리형",
      "concept": "눈알을 추적시켜 적의 발을 묶는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 986,
          "intervalFrames": 27,
          "coefficient": 23.1
        },
        "skill": {
          "kind": "homing-eyes",
          "aimRange": 1110,
          "cooldownFrames": 1080,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 27.81
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-098": {
      "basic": "천사 사격 · 1발",
      "skill": "반경 510 아군 최대 HP 28% 회복 · 기절/둔화/독/출혈/적대 표식 정화 · 피해 감소/쿨타임 환급 없음 · 자기 중심 · 대기 19초",
      "passive": "스킬 증강: 대기 단축 · 범위 · 회복·보호",
      "cooldown": "19초",
      "label": "성역술사",
      "category": "지원가",
      "concept": "아군이 모인 순간 성역으로 전열을 지킨다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 31,
          "coefficient": 21
        },
        "skill": {
          "kind": "sanctuary-cleanse",
          "aimRange": 0,
          "cooldownFrames": 1140,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "expansion",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-110": {
      "basic": "뿔 근접 타격",
      "skill": "빠른 직선 돌진 · 첫 적 실제 접촉점에서 정지 · 피해 75와 1초 기절 · 적중 시 1.5초 자기 피해 감소 24% · 최대 조준 거리 650 · 대기 16초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 회복·보호 · 고유 사거리",
      "cooldown": "16초",
      "label": "철갑 코뿔소",
      "category": "탱커",
      "concept": "몸통 돌진 뒤 철갑으로 버티는 탱커",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 162.34884608000002,
          "intervalFrames": 36,
          "coefficient": 30.618000000000006
        },
        "skill": {
          "kind": "rhino-charge",
          "aimRange": 650,
          "cooldownFrames": 960,
          "cooldownJitter": false,
          "durationFrames": 90,
          "damageCoefficient": 75
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "restore",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-131": {
      "basic": "가위 근접 베기",
      "skill": "같은 조준 방향으로 가위 5발 · 0.1초 간격 순차 발사 · 탄당 피해 26 · 기절/옛 근접 연격 없음 · 최대 조준 거리 900 · 대기 16초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "16초",
      "label": "가위 수호자",
      "category": "근접형",
      "concept": "근접 가위질과 같은 방향의 순차 가위 투척을 섞는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 143.19334400000002,
          "intervalFrames": 24,
          "coefficient": 25.71912
        },
        "skill": {
          "kind": "scissor-volley",
          "aimRange": 900,
          "cooldownFrames": 960,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 26
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-132": {
      "basic": "가느다란 공허탄 · 1발",
      "skill": "2.5초 지속 광선 · 0.1초마다 피해 계수 8.736 · 조준 회전 가능 · 이동/평타 잠금 · 벽 차단, 기절 없음 · 최대 조준 거리 1393.6 · 대기 20초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 고유 지속",
      "cooldown": "20초",
      "label": "공허 파괴자",
      "category": "원거리형",
      "concept": "제자리에 서서 방향을 돌리는 지속 광선으로 길을 막는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 1175,
          "intervalFrames": 47,
          "coefficient": 28.560000000000002
        },
        "skill": {
          "kind": "channel-beam",
          "aimRange": 1393.6,
          "cooldownFrames": 1200,
          "cooldownJitter": false,
          "durationFrames": 150,
          "damageCoefficient": 8.736
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-023": {
      "basic": "단발 저격탄 · 1발",
      "skill": "0.4초 조준 후 가늘고 긴 저격탄으로 탄도상 첫 적을 타격합니다. 벽에서 멈추며 기절시키지 않습니다. · 최대 조준 거리 1380 · 대기 12초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위",
      "cooldown": "12초",
      "label": "헤드슈터",
      "category": "원거리형",
      "concept": "멀리서 정확한 한 발을 노리는 저격수",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 1090,
          "intervalFrames": 44,
          "coefficient": 24.48
        },
        "skill": {
          "kind": "sniper",
          "aimRange": 1380,
          "cooldownFrames": 720,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 80.56
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-024": {
      "basic": "바람 근접 베기",
      "skill": "3.5초 동안 회오리 3개를 전개합니다. 시전 방향의 가까운 적을 당기며 짧게 경직시킵니다. · 최대 조준 거리 330 · 대기 14.25초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 지속",
      "cooldown": "14.25초",
      "label": "회오리 전개",
      "category": "근접형",
      "concept": "회오리 안으로 적을 당겨 붙잡는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 137.376,
          "intervalFrames": 36,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "native",
          "aimRange": 330,
          "cooldownFrames": 855,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-025": {
      "basic": "무거운 펀치",
      "skill": "전방 한 명에게 강한 펀치와 큰 밀침을 줍니다. 밀려난 적의 첫 벽 충돌에만 추가 피해가 적용됩니다. · 최대 조준 거리 165 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "10초",
      "label": "핵주먹",
      "category": "근접형",
      "concept": "한 방으로 적을 멀리 날리는 격투가",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 145.75423999999998,
          "intervalFrames": 49,
          "coefficient": 32.86332
        },
        "skill": {
          "kind": "front",
          "aimRange": 165,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 58
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-026": {
      "basic": "근접 얼음 주먹",
      "skill": "0.3초 준비 후 주변 적에게 피해와 1.1초 빙결을 줍니다. 적을 멀리 밀어내지 않습니다. · 자기 중심 · 대기 13초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "13초",
      "label": "아이스킹",
      "category": "탱커",
      "concept": "다가온 적을 주변 빙결로 멈추는 근접 투사",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 143.70552320000002,
          "intervalFrames": 44,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "freeze",
          "aimRange": 0,
          "cooldownFrames": 780,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 27
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-027": {
      "basic": "차체 근접 타격",
      "skill": "짧은 돌진 뒤 2초 안에 한 번 더 새 방향으로 돌진합니다. 두 번째 돌진 또는 창 만료 뒤 전체 대기시간이 시작됩니다. · 최대 조준 거리 370 · 대기 11초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "11초",
      "label": "로드킬",
      "category": "기동형",
      "concept": "두 번의 짧은 돌진을 각각 조준해 진입하고 이탈한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 143,
          "intervalFrames": 43,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "recast-dash",
          "aimRange": 370,
          "cooldownFrames": 660,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 25
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-028": {
      "basic": "갑옷 근접 타격",
      "skill": "2초 동안 받는 피해가 28% 줄고, 적의 직접 공격으로 실제 잃은 HP의 50%를 그 공격자에게 즉시 반환합니다. 지속·환경·반격 피해는 반환하지 않습니다. · 자기 중심 · 대기 11초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 고유 지속",
      "cooldown": "11초",
      "label": "아이언월",
      "category": "탱커",
      "concept": "상대 공격을 받아내며 반격 각도를 만든다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 152.538,
          "intervalFrames": 46,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "counter-immediate",
          "aimRange": 0,
          "cooldownFrames": 660,
          "cooldownJitter": false,
          "durationFrames": 120,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-029": {
      "basic": "근접 타격",
      "skill": "벽을 넘어 표시 지점으로 비행해 착지 충격을 줍니다. 공중 이동은 무적이 아니며 기절·포획되면 추가 타격 없이 정착합니다. · 최대 조준 거리 670 · 대기 11초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "11초",
      "label": "스카이 하이",
      "category": "기동형",
      "concept": "벽을 넘어 착지하며 압박하는 비행가",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 154.4,
          "intervalFrames": 40,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "leap",
          "aimRange": 670,
          "cooldownFrames": 660,
          "cooldownJitter": false,
          "durationFrames": 30,
          "damageCoefficient": 48
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-030": {
      "basic": "촉수 근접 타격",
      "skill": "세 갈래 촉수로 최대 3명의 적을 포획해 겹치지 않는 전방 위치로 당기고 도착 후 1초 기절시킵니다. 벽을 통과하지 않습니다. · 최대 조준 거리 780 · 대기 14초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "14초",
      "label": "크라켄",
      "category": "근접형",
      "concept": "촉수로 상대를 당겨 거리를 지운다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 152,
          "intervalFrames": 39,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "hook",
          "aimRange": 780,
          "cooldownFrames": 840,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 24
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-031": {
      "basic": "꼬리 근접 타격",
      "skill": "조준 방향으로 돌진하며 독 흔적을 남깁니다. 접촉한 적에게 피해와 짧은 밀침·기절을 줍니다. · 최대 조준 거리 641.52 · 대기 3.233초~3.967초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리",
      "cooldown": "3.233초~3.967초",
      "label": "독길 돌진",
      "category": "기동형",
      "concept": "적 옆을 스쳐 독길로 추격을 막는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 131.6,
          "intervalFrames": 38,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "POISON_TRAIL",
          "aimRange": 641.52,
          "cooldownFrames": 216,
          "cooldownJitter": true,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-033": {
      "basic": "전면 근접 타격",
      "skill": "느리고 넓은 전면으로 전진합니다. 첫 접촉만 피해를 주고 이후에는 진행 방향으로 밀어냅니다. 벽에 닿거나 최대 거리에서 멈춥니다. · 최대 조준 거리 530 · 대기 12초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 고유 사거리 · 고유 지속",
      "cooldown": "12초",
      "label": "불도저",
      "category": "탱커",
      "concept": "느린 전진으로 전방의 적을 밀어내는 공성 탱커",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 148.62400000000002,
          "intervalFrames": 44,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "plow",
          "aimRange": 530,
          "cooldownFrames": 720,
          "cooldownJitter": false,
          "durationFrames": 84,
          "damageCoefficient": 25
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen",
          "signature_range",
          "signature_duration"
        ]
      }
    },
    "emoji-034": {
      "basic": "볼링공 · 1발 · 벽 반사 2회",
      "skill": "반경 36의 큰 볼링공 한 개가 900 거리까지 직진하며 적마다 한 번 타격하고 진행 방향으로 밀어냅니다. 벽에 닿으면 사라지며 반사·기절은 없습니다. · 최대 조준 거리 900 · 대기 15.75초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "15.75초",
      "label": "스트라이크",
      "category": "원거리형",
      "concept": "직선으로 굴린 큰 공으로 일렬의 적을 밀어낸다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 792,
          "intervalFrames": 41,
          "coefficient": 20.88
        },
        "skill": {
          "kind": "bowling-strike",
          "aimRange": 900,
          "cooldownFrames": 945,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 21
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-035": {
      "basic": "빠른 근접 전기톱",
      "skill": "5초 동안 일반 공격 속도 +50%. 평타 적중 시 3초 출혈을 최대 3중첩 부여하며 0.5초마다 피해를 줍니다. 흡혈은 없습니다. · 자기 중심 · 대기 13초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 고유 지속",
      "cooldown": "13초",
      "label": "체인소맨",
      "category": "근접형",
      "concept": "근접 연타와 출혈로 붙은 적의 체력을 깎는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 137.21792,
          "intervalFrames": 38,
          "coefficient": 27.147960000000005
        },
        "skill": {
          "kind": "chainsaw",
          "aimRange": 0,
          "cooldownFrames": 780,
          "cooldownJitter": false,
          "durationFrames": 300,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-036": {
      "basic": "박쥐 탄 · 1발 · 유도",
      "skill": "일반 공격으로 마지막 적 한 명에게 4초 사냥 표식을 남깁니다. 스킬 박쥐 무리는 유효한 표식 대상을 우선 추적하며 벽·은신을 무시하지 않습니다. · 최대 조준 거리 910 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수",
      "cooldown": "10초",
      "label": "뱀파이어 떼",
      "category": "원거리형",
      "concept": "박쥐 무리로 움직이는 적을 추적한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 845,
          "intervalFrames": 34,
          "coefficient": 12.095999999999998
        },
        "skill": {
          "kind": "marked-homing",
          "aimRange": 910,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 19.57
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-063": {
      "basic": "작은 버거 산탄 · 3발",
      "skill": "굵은 산탄 5발을 한 번에 발사합니다. 가까울수록 여러 탄을 맞힐 수 있으며 같은 일제사격의 밀침은 대상당 한 번만 적용됩니다. · 최대 조준 거리 650 · 대기 9초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "9초",
      "label": "버거 캐논",
      "category": "원거리형",
      "concept": "가까운 적에게 두꺼운 산탄을 모아 맞힌다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 3,
          "range": 560,
          "intervalFrames": 47,
          "coefficient": 6.4799999999999995
        },
        "skill": {
          "kind": "shotgun",
          "aimRange": 650,
          "cooldownFrames": 540,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 18.9
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-066": {
      "basic": "부메랑 · 1발 · 왕복",
      "skill": "대형 부메랑 두 개를 V자로 던져 왕복 각각 한 번씩 타격합니다. 이동하여 두 복귀 경로를 겹칠 수 있습니다. · 최대 조준 거리 760 · 대기 11초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 고유 사거리",
      "cooldown": "11초",
      "label": "프로 부메랑",
      "category": "원거리형",
      "concept": "두 개의 부메랑 복귀 경로를 겹친다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 660,
          "intervalFrames": 41,
          "coefficient": 11.843999999999998
        },
        "skill": {
          "kind": "boomerang",
          "aimRange": 760,
          "cooldownFrames": 660,
          "cooldownJitter": false,
          "durationFrames": 150,
          "damageCoefficient": 26.25
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-087": {
      "basic": "화살 · 1발",
      "skill": "빠른 화살 한 발로 4초 표식을 남깁니다. 그 적에게 성공한 다음 일반 공격 3회가 강화되며 여러 탄도 한 공격당 한 번만 소비합니다. · 최대 조준 거리 1030 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위",
      "cooldown": "10초",
      "label": "사냥꾼",
      "category": "원거리형",
      "concept": "표식 화살 후 같은 적에게 일반 공격을 집중한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 915,
          "intervalFrames": 26,
          "coefficient": 14.76
        },
        "skill": {
          "kind": "hunter-mark",
          "aimRange": 1030,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 23.32
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-099": {
      "basic": "의무병 사격 · 1발",
      "skill": "전장 전체에서 HP 비율이 가장 낮은 다른 아군 한 명을 최대 HP의 22%만큼 치료하고 남은 기절을 줄입니다. 자신도 4% 회복하며, 다른 아군이 없으면 자신을 치료합니다. · 전장 전체 · 대기 4.217초~5.15초",
      "passive": "스킬 증강: 대기 단축 · 회복·보호",
      "cooldown": "4.217초~5.15초",
      "label": "집중 치료",
      "category": "지원가",
      "concept": "가장 위험한 아군 한 명을 살린다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 810,
          "intervalFrames": 40,
          "coefficient": 18
        },
        "skill": {
          "kind": "TEAM_MEDIC",
          "aimRange": 0,
          "cooldownFrames": 281,
          "cooldownJitter": true,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-101": {
      "basic": "마법 지팡이 사격 · 1발",
      "skill": "주변 아군에게 3초 동안 이동속도 +12%, 일반 공격·스킬 대기시간 진행 1.3배를 줍니다. 같은 팀 가속은 가장 강한 효과만 적용합니다. · 자기 중심 · 대기 13초",
      "passive": "스킬 증강: 대기 단축 · 범위 · 고유 지속",
      "cooldown": "13초",
      "label": "가속마도사",
      "category": "지원가",
      "concept": "팀의 공격 기회를 앞당기는 가속 지원가",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 810,
          "intervalFrames": 40,
          "coefficient": 18
        },
        "skill": {
          "kind": "team-haste",
          "aimRange": 0,
          "cooldownFrames": 780,
          "cooldownJitter": false,
          "durationFrames": 180,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "expansion",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-133": {
      "basic": "영혼 근접 검격",
      "skill": "0.4초 전방 직사각형 예고 후 돌진 베기를 하며 0.8초 기절시킵니다. 첫 적중에 보호막 42, 추가 대상마다 12를 얻고 최대 78까지 유지합니다. · 최대 조준 거리 560 · 대기 13초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 회복·보호 · 고유 사거리",
      "cooldown": "13초",
      "label": "영혼 검사",
      "category": "근접형",
      "concept": "베기를 맞혀 보호를 얻고 버틴다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 138.071552,
          "intervalFrames": 42,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "soul-dash",
          "aimRange": 560,
          "cooldownFrames": 780,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 46
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "restore",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-038": {
      "basic": "단도 근접 베기",
      "skill": "조준 지점으로 순간이동해 착지 근처 적 한 명을 타격합니다. HP 35% 이하인 적에게 추가 피해를 주며 즉사시키지는 않습니다. · 최대 조준 거리 520 · 대기 15초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "15초",
      "label": "그림자 기습",
      "category": "암살자",
      "concept": "순간이동 후 가까운 저체력 적에게 추가 피해를 준다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 118.68,
          "intervalFrames": 49,
          "coefficient": 27.519458400000005
        },
        "skill": {
          "kind": "teleport-assassin",
          "aimRange": 520,
          "cooldownFrames": 900,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-039": {
      "basic": "작은 폭탄 · 1발 · 작은 폭발",
      "skill": "목표 지점을 표시한 뒤 0.8초 포물선 비행 후 한 번 폭발합니다. 중심부 피해가 더 크며 폭발 지점과 적 사이의 벽은 피해를 막습니다. · 최대 조준 거리 777 · 대기 11초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "11초",
      "label": "다이너마이트",
      "category": "원거리형",
      "concept": "착지 지점을 예고한 폭탄으로 중앙 명중을 노린다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 616,
          "intervalFrames": 56,
          "coefficient": 16.200000000000003
        },
        "skill": {
          "kind": "lob",
          "aimRange": 777,
          "cooldownFrames": 660,
          "cooldownJitter": false,
          "durationFrames": 48,
          "damageCoefficient": 30.45
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-040": {
      "basic": "엄니 근접 타격 · 적중 시 짧은 피해 감소",
      "skill": "조준 방향으로 돌진하며 접촉한 적을 한 번 타격하고 밀치며 짧게 기절시킵니다. · 최대 조준 거리 492.48 · 대기 3.633초~4.433초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 제어",
      "cooldown": "3.633초~4.433초",
      "label": "멧돼지 돌진",
      "category": "탱커",
      "concept": "멧돼지 돌진으로 첫 교전을 연다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 136.882,
          "intervalFrames": 48,
          "coefficient": 25.480980000000006
        },
        "skill": {
          "kind": "BOAR_CHARGE",
          "aimRange": 492.47999999999996,
          "cooldownFrames": 242,
          "cooldownJitter": true,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-041": {
      "basic": "독침 · 1발 · 중독",
      "skill": "독침 5발을 부채꼴로 발사해 맞은 적을 중독시킵니다. · 최대 조준 거리 950 · 대기 16.5초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "16.5초",
      "label": "독침 산탄",
      "category": "원거리형",
      "concept": "독침을 연속 적중해 체력을 갉는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 836,
          "intervalFrames": 33,
          "coefficient": 12.299999999999999
        },
        "skill": {
          "kind": "native",
          "aimRange": 950,
          "cooldownFrames": 990,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-042": {
      "basic": "망치 근접 타격",
      "skill": "짧은 준비 후 전방 한 명에게 망치를 내려쳐 1초 기절시킵니다. 일반 공격에는 기절이 없고 적을 멀리 밀지 않습니다. · 최대 조준 거리 168 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "10초",
      "label": "뿅망치",
      "category": "탱커",
      "concept": "망치 한 방으로 앞의 적을 멈추는 제어 탱커",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 144.75445760000002,
          "intervalFrames": 53,
          "coefficient": 27.519458400000005
        },
        "skill": {
          "kind": "hammer",
          "aimRange": 168,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 28
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-043": {
      "basic": "로켓 근접 타격",
      "skill": "긴 사거리의 로켓 돌진으로 첫 적·벽·종점에서 멈추고 한 번만 폭발합니다. 출발과 접촉 자체에는 추가 피해가 없습니다. · 최대 조준 거리 1030 · 대기 12초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "12초",
      "label": "로켓 점프",
      "category": "기동형",
      "concept": "긴 돌진이 멈추는 지점에서 한 번 폭발한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 131.6,
          "intervalFrames": 41,
          "coefficient": 25.480980000000006
        },
        "skill": {
          "kind": "rocket-dash",
          "aimRange": 1030,
          "cooldownFrames": 720,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 43
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-044": {
      "basic": "보드 근접 타격",
      "skill": "돌진 경로에 최대 5개의 빙판을 남겨 적의 이동속도를 늦춥니다. 공격·스킬은 사용할 수 있고 여러 빙판의 감속을 곱하지 않습니다. · 최대 조준 거리 590 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "10초",
      "label": "스노우보더",
      "category": "기동형",
      "concept": "빙판을 가로질러 추격 속도를 늦춘다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 127.80000000000001,
          "intervalFrames": 41,
          "coefficient": 25.480980000000006
        },
        "skill": {
          "kind": "ice-dash",
          "aimRange": 590,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 17
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-045": {
      "basic": "테니스공 · 1발 · 벽 반사 2회",
      "skill": "스킬 테니스공이 첫 벽 반사 때만 45% 빨라집니다. 최대 3회 반사하며 전체 거리와 수명이 제한됩니다. 일반 공격에는 가속이 없습니다. · 최대 조준 거리 1120 · 대기 8초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "8초",
      "label": "테니스 챔피언",
      "category": "원거리형",
      "concept": "벽에서 한 번 빨라지는 공으로 반사 각도를 만든다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 739,
          "intervalFrames": 46,
          "coefficient": 15
        },
        "skill": {
          "kind": "bounce",
          "aimRange": 1120,
          "cooldownFrames": 480,
          "cooldownJitter": false,
          "durationFrames": 100,
          "damageCoefficient": 28.35
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-047": {
      "basic": "축구공 · 1발",
      "skill": "큰 축구공 한 발이 첫 적을 진행 방향으로 크게 밀어낸 뒤 사라집니다. 폭발·기절은 없습니다. · 최대 조준 거리 900 · 대기 9초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "9초",
      "label": "파워 슛",
      "category": "원거리형",
      "concept": "공 한 번으로 상대 위치를 크게 바꾼다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 722,
          "intervalFrames": 44,
          "coefficient": 17.4
        },
        "skill": {
          "kind": "power-shot",
          "aimRange": 900,
          "cooldownFrames": 540,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 31.5
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-070": {
      "basic": "다트 · 1발 · 관통 · 몸 중심 명중 피해 ×1.5",
      "skill": "5초 동안 일반 공격 속도가 30% 증가합니다. 추가 투사체 없이 이동하며 공격할 수 있습니다. 관통 다트 평타는 상대 몸 중심 35%를 지나는 궤적일 때 피해가 1.5배입니다. · 자기 중심 · 대기 16.5초",
      "passive": "스킬 증강: 대기 단축",
      "cooldown": "16.5초",
      "label": "집중 투척",
      "category": "원거리형",
      "concept": "관통 다트를 몸 중심에 맞히고 공속 버프로 연타한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 739,
          "intervalFrames": 43,
          "coefficient": 15
        },
        "skill": {
          "kind": "dart-haste",
          "aimRange": 0,
          "cooldownFrames": 990,
          "cooldownJitter": false,
          "durationFrames": 300,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-072": {
      "basic": "탄산컵 · 1발 · 작은 폭발",
      "skill": "한 개의 탄산 폭탄이 터지며 넓은 범위의 적을 바깥쪽으로 크게 밀어냅니다. 살상력보다 거리 확보에 집중합니다. · 최대 조준 거리 720 · 대기 9초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "9초",
      "label": "탄산 폭탄",
      "category": "원거리형",
      "concept": "넓은 탄산 폭발로 적을 밀어내 거리를 확보한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 616,
          "intervalFrames": 51,
          "coefficient": 16.200000000000003
        },
        "skill": {
          "kind": "soda-bomb",
          "aimRange": 720,
          "cooldownFrames": 540,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 19.95
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-089": {
      "basic": "직선 농구공 · 1발",
      "skill": "직선 공 1발 · 피해 계수 43.26. 적의 HP/보호막에 피해를 주면 무피해 반환 공이 돌아오고, 도착 시 남은 스킬 쿨타임이 한 번 50% 감소합니다. · 최대 조준 거리 820 · 대기 11초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수",
      "cooldown": "11초",
      "label": "리바운드 슛",
      "category": "원거리형",
      "concept": "농구공 적중 후 반환 공을 받아 스킬 대기를 줄인다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 739,
          "intervalFrames": 39,
          "coefficient": 15
        },
        "skill": {
          "kind": "basketball",
          "aimRange": 820,
          "cooldownFrames": 660,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": 43.26
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-102": {
      "basic": "수호 표식 사격 · 1발",
      "skill": "범위 안에서 HP 비율이 낮은 다른 아군 최대 2명에게 3.5초 흡수 보호막을 줍니다. 다른 아군이 없을 때만 자신을 보호합니다. · 자기 중심 · 대기 11초",
      "passive": "스킬 증강: 대기 단축 · 범위 · 회복·보호",
      "cooldown": "11초",
      "label": "보호술사",
      "category": "지원가",
      "concept": "위급한 아군에게 먼저 방어를 씌운다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 739,
          "intervalFrames": 44,
          "coefficient": 15
        },
        "skill": {
          "kind": "team-shield",
          "aimRange": 0,
          "cooldownFrames": 660,
          "cooldownJitter": false,
          "durationFrames": 210,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "expansion",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-112": {
      "basic": "등껍질 근접 타격 · 적중 시 짧은 피해 감소",
      "skill": "주변 적에게 피해·밀침·짧은 기절을 줍니다. 자신은 1.2초 동안 받는 피해가 20% 줄어듭니다. · 최대 조준 거리 210 · 대기 16.5초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 회복·보호",
      "cooldown": "16.5초",
      "label": "대지 진압",
      "category": "탱커",
      "concept": "공격 뒤 껍질로 버티는 수비 탱커",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 139.26663680000001,
          "intervalFrames": 44,
          "coefficient": 25.480980000000006
        },
        "skill": {
          "kind": "tank-stun",
          "aimRange": 210,
          "cooldownFrames": 990,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-137": {
      "basic": "정밀 탄 · 1발 · 관통",
      "skill": "빠른 관통탄 한 발로 일렬의 적을 타격합니다. 자동 유도나 폭발은 없습니다. · 최대 조준 거리 1070 · 대기 18초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "18초",
      "label": "정조준 관통 사격",
      "category": "원거리형",
      "concept": "빠른 관통 한 발을 맞히는 명사수",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 1006,
          "intervalFrames": 59,
          "coefficient": 20.400000000000002
        },
        "skill": {
          "kind": "native",
          "aimRange": 1070,
          "cooldownFrames": 1080,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-074": {
      "basic": "슬리퍼 · 2발",
      "skill": "빠르고 곧게 날아가는 슬리퍼 한 발을 발사합니다. 자동 추적·폭발·기절 없이 정확한 조준으로 승부합니다. · 최대 조준 거리 1100 · 대기 7초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위",
      "cooldown": "7초",
      "label": "슬리퍼 스나이퍼",
      "category": "원거리형",
      "concept": "긴 직선의 빠른 슬리퍼를 맞힌다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 2,
          "range": 874,
          "intervalFrames": 68,
          "coefficient": 8.16
        },
        "skill": {
          "kind": "precision",
          "aimRange": 1100,
          "cooldownFrames": 420,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 25.44
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-075": {
      "basic": "사과 · 1발 · 벽 반사 2회",
      "skill": "사과 한 발이 첫 벽 반사 뒤 조각 2개로 나뉩니다. 원본은 사라지고 조각은 다시 분열하지 않습니다. 적에게 바로 맞으면 원본 피해만 줍니다. · 최대 조준 거리 790 · 대기 8초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위",
      "cooldown": "8초",
      "label": "사과 투척",
      "category": "원거리형",
      "concept": "벽에 닿으면 두 조각으로 갈라지는 사과를 던진다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 651,
          "intervalFrames": 48,
          "coefficient": 12
        },
        "skill": {
          "kind": "split-bounce",
          "aimRange": 790,
          "cooldownFrames": 480,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 22.05
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-077": {
      "basic": "크루아상 · 1발 · 왕복",
      "skill": "크고 느린 크루아상 한 개가 왕복 각각 한 번 타격합니다. 끝에서 머무르지 않고 현재 자신의 위치로 돌아옵니다. · 최대 조준 거리 620 · 대기 8초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위",
      "cooldown": "8초",
      "label": "크루아상 부메랑",
      "category": "원거리형",
      "concept": "돌아오는 빵의 궤도로 두 번 노린다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 546,
          "intervalFrames": 45,
          "coefficient": 8.84352
        },
        "skill": {
          "kind": "boomerang",
          "aimRange": 620,
          "cooldownFrames": 480,
          "cooldownJitter": false,
          "durationFrames": 160,
          "damageCoefficient": 22.05
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-092": {
      "basic": "프라이팬 · 1발",
      "skill": "0.8초 패리 중 피해가 28% 줄고, 실제 잃은 HP를 공격자별로 기록했다가 종료 시 각 공격자에게 50%씩 한 번 반환합니다. 중단 시 반환하지 않습니다. · 자기 중심 · 대기 8초",
      "passive": "스킬 증강: 대기 단축 · 위력",
      "cooldown": "8초",
      "label": "팬테옹",
      "category": "원거리형",
      "concept": "프라이팬으로 거리를 두다 공격 순간 반격한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 642,
          "intervalFrames": 59,
          "coefficient": 13.919999999999998
        },
        "skill": {
          "kind": "counter-deferred",
          "aimRange": 0,
          "cooldownFrames": 480,
          "cooldownJitter": false,
          "durationFrames": 48,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-094": {
      "basic": "크레파스 · 1발",
      "skill": "크레파스 4발을 부채꼴로 발사합니다. 적중한 탄은 짧은 기절을 줍니다. · 최대 조준 거리 830 · 대기 17.25초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 개수 · 제어",
      "cooldown": "17.25초",
      "label": "크레파스 산탄",
      "category": "원거리형",
      "concept": "퍼지는 색연필로 정면을 채운다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 730,
          "intervalFrames": 37,
          "coefficient": 9.84
        },
        "skill": {
          "kind": "native",
          "aimRange": 830,
          "cooldownFrames": 1035,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "multicast",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-105": {
      "basic": "확성기 사격 · 1발",
      "skill": "주변 아군의 일반 공격 속도만 3초 동안 30% 올립니다. 회복과 스킬 대기시간·준비시간 가속은 없습니다. · 자기 중심 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 범위",
      "cooldown": "10초",
      "label": "응원단장",
      "category": "지원가",
      "concept": "주변 아군의 일반 공격 빈도를 높여 교전을 돕는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 651,
          "intervalFrames": 44,
          "coefficient": 12
        },
        "skill": {
          "kind": "team-basic-haste",
          "aimRange": 0,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 180,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-113": {
      "basic": "집게 근접 타격 · 적중 시 짧은 피해 감소",
      "skill": "스킬 사용 즉시 2.5초 흡수 보호막을 얻고 가까운 적을 가볍게 제압합니다. 스킬 적중 여부와 무관하게 보호막을 준비합니다. · 자기 중심 · 대기 9초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 회복·보호",
      "cooldown": "9초",
      "label": "게렌",
      "category": "탱커",
      "concept": "즉시 보호막을 준비하고 가까운 적을 제압한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 130.81568,
          "intervalFrames": 43,
          "coefficient": 22.249080000000006
        },
        "skill": {
          "kind": "guard-strike",
          "aimRange": 0,
          "cooldownFrames": 540,
          "cooldownJitter": false,
          "durationFrames": 150,
          "damageCoefficient": 15
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-121": {
      "basic": "근접 빗자루 쓸기",
      "skill": "전방 직사각형을 쓸어 맞은 적 모두를 조준 방향으로 밀어냅니다. 옆·뒤·벽 너머의 적은 맞지 않습니다. · 최대 조준 거리 235 · 대기 8초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "8초",
      "label": "청소반장",
      "category": "근접형",
      "concept": "빗자루로 전방의 적을 조준 방향으로 쓸어낸다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 146.09199999999998,
          "intervalFrames": 49,
          "coefficient": 22.249080000000006
        },
        "skill": {
          "kind": "directional-sweep",
          "aimRange": 235,
          "cooldownFrames": 480,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 14
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-122": {
      "basic": "통조림 · 1발 · 작은 폭발",
      "skill": "통조림이 깨지며 작은 폭발과 2초 가시 지대 하나를 남깁니다. 가시 지대는 소유자당 1개이며 기절시키지 않습니다. · 최대 조준 거리 975 · 대기 9초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위",
      "cooldown": "9초",
      "label": "통조림 투척",
      "category": "원거리형",
      "concept": "통조림 폭발과 짧은 가시 지대로 길을 막는다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 546,
          "intervalFrames": 63,
          "coefficient": 12.96
        },
        "skill": {
          "kind": "thorn-pot",
          "aimRange": 975,
          "cooldownFrames": 540,
          "cooldownJitter": false,
          "durationFrames": 120,
          "damageCoefficient": 11.55
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-126": {
      "basic": "압정 · 1발",
      "skill": "조준한 직선에 압정 함정 3개를 놓습니다. 0.3초 후 활성화되고 각각 한 번만 피해를 준 뒤 사라집니다. 최대 3개·수명 8초입니다. · 최대 조준 거리 630 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 위력",
      "cooldown": "10초",
      "label": "압정 난사",
      "category": "원거리형",
      "concept": "조준한 직선에 압정 함정을 놓아 진입을 견제한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 730,
          "intervalFrames": 35,
          "coefficient": 9.84
        },
        "skill": {
          "kind": "pin-traps",
          "aimRange": 630,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 480,
          "damageCoefficient": 15.75
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-127": {
      "basic": "스케이트 근접 타격",
      "skill": "짧은 직선 돌진으로 접촉한 적에게 한 번만 작은 피해와 밀침을 줍니다. 폭탄·종료 장판·재시전은 없습니다. · 최대 조준 거리 370 · 대기 7초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "7초",
      "label": "롤러스케이트",
      "category": "기동형",
      "concept": "짧은 직선 돌진으로 한 번 부딪히고 빠져나간다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 124,
          "intervalFrames": 43,
          "coefficient": 22.249080000000006
        },
        "skill": {
          "kind": "simple-dash",
          "aimRange": 370,
          "cooldownFrames": 420,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 17
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-128": {
      "basic": "촉수 근접 타격",
      "skill": "조준 방향으로 돌진하며 먹물 흔적을 남깁니다. 경로의 적에게 지속 피해와 짧은 감속을 주고 첫 접촉 적의 시야를 잠시 가립니다. · 최대 조준 거리 540 · 대기 3.083초~3.783초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "3.083초~3.783초",
      "label": "먹물길 돌진",
      "category": "기동형",
      "concept": "먹물길로 적에게 지속 피해와 짧은 감속을 준다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 124,
          "intervalFrames": 43,
          "coefficient": 22.249080000000006
        },
        "skill": {
          "kind": "INK_TRAIL",
          "aimRange": 540,
          "cooldownFrames": 206,
          "cooldownJitter": true,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-052": {
      "basic": "벽돌 탄 · 1발",
      "skill": "주변 적을 밀치고 짧게 기절시킵니다. 2초 동안 자신이 받는 피해가 35% 줄어듭니다. · 최대 조준 거리 165 · 대기 15초",
      "passive": "스킬 증강: 대기 단축 · 제어 · 회복·보호",
      "cooldown": "15초",
      "label": "철괴",
      "category": "원거리형",
      "concept": "위험할 때 몸을 굳히는 초보 요새",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 537,
          "intervalFrames": 54,
          "coefficient": 8
        },
        "skill": {
          "kind": "guard-pulse",
          "aimRange": 165,
          "cooldownFrames": 900,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "control",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-054": {
      "basic": "비누 근접 타격",
      "skill": "조준 방향으로 짧게 미끄러집니다. 이동 자체에는 피해·넉백·기절이 없습니다. · 최대 조준 거리 280 · 대기 13초",
      "passive": "스킬 증강: 대기 단축",
      "cooldown": "13초",
      "label": "비눗길",
      "category": "기동형",
      "concept": "조준한 방향으로 미끄러져 빠져나간다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 116.4,
          "intervalFrames": 55,
          "coefficient": 14.040000000000001
        },
        "skill": {
          "kind": "slip-dash",
          "aimRange": 280,
          "cooldownFrames": 780,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-056": {
      "basic": "비눗방울 · 1발 · 유도",
      "skill": "느리고 약하게 유도되는 큰 방울 · 피해 10.3 · 0.5초 기절. 평타도 약한 유도이며 기절 없음. · 최대 조준 거리 590 · 대기 7초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어",
      "cooldown": "7초",
      "label": "비눗방울 놀이",
      "category": "원거리형",
      "concept": "느린 방울로 상대의 이동을 견제한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 537,
          "intervalFrames": 56,
          "coefficient": 8
        },
        "skill": {
          "kind": "bubble",
          "aimRange": 590,
          "cooldownFrames": 420,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 10.3
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "control",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-114": {
      "basic": "모아이 근접 타격 · 적중 시 짧은 피해 감소",
      "skill": "전방 적 한 명을 강하게 밀치며 짧게 기절시킵니다. 자신은 1.2초 동안 받는 피해가 20% 줄어듭니다. · 최대 조준 거리 247.022 · 대기 13.25초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 제어 · 회복·보호 · 고유 지속",
      "cooldown": "13.25초",
      "label": "초중량 펀치",
      "category": "탱커",
      "concept": "짧은 타격 뒤 웅크려 버틴다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 157.02218240000002,
          "intervalFrames": 33,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "tank-punch",
          "aimRange": 247.02218240000002,
          "cooldownFrames": 795,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "control",
          "restore",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-139": {
      "basic": "느린 근접 강타",
      "skill": "4초 동안 0.5초마다 자신의 최대 HP 2.625% 재생(총 21%). 승인된 재생은 기절 중에도 지속되며 사망 시 끝납니다. · 자기 중심 · 대기 18초",
      "passive": "스킬 증강: 대기 단축 · 회복·보호 · 고유 지속",
      "cooldown": "18초",
      "label": "느린 재생",
      "category": "탱커",
      "concept": "느린 근접 강타와 자기 재생으로 버틴다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 157.02218240000002,
          "intervalFrames": 69,
          "coefficient": 44.87179487179486
        },
        "skill": {
          "kind": "zombie-regen",
          "aimRange": 0,
          "cooldownFrames": 1080,
          "cooldownJitter": false,
          "durationFrames": 240,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "restore",
          "swift",
          "titan",
          "regen",
          "signature_duration"
        ]
      }
    },
    "emoji-140": {
      "basic": "묵직한 근접 타격",
      "skill": "0.3초 준비 후 90도 부채꼴로 작은 돌 12발을 동시에 투척합니다. 탄당 피해 계수 11 · 사거리 1450 · 탄수는 항상 12발 · 관통/기절 없음. · 최대 조준 거리 1450 · 대기 16초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위",
      "cooldown": "16초",
      "label": "돌 무더기 투척",
      "category": "근접형",
      "concept": "근접 타격 뒤 넓은 부채꼴 돌 무더기로 견제한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 168.82688000000002,
          "intervalFrames": 39,
          "coefficient": 35.2107
        },
        "skill": {
          "kind": "rock-fan",
          "aimRange": 1450,
          "cooldownFrames": 960,
          "cooldownJitter": false,
          "durationFrames": null,
          "damageCoefficient": 11
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-141": {
      "basic": "짧은 카드 베기",
      "skill": "최대 400 안전 순간이동 · 1.2초 은신(실제 공격·스킬·피격 시 해제) · 최대 HP 25%의 5초 미끼 분신 1개 · 최대 조준 거리 400 · 대기 12초",
      "passive": "스킬 증강: 대기 단축 · 고유 사거리",
      "cooldown": "12초",
      "label": "조커",
      "category": "근접형",
      "concept": "짧은 은신 순간이동과 미끼 분신으로 공격을 흘린다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 159.568,
          "intervalFrames": 36,
          "coefficient": 30.618000000000006
        },
        "skill": {
          "kind": "decoy-blink",
          "aimRange": 400,
          "cooldownFrames": 720,
          "cooldownJitter": false,
          "durationFrames": 300,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-142": {
      "basic": "단발 탄 · 1발",
      "skill": "밧줄 800 · 첫 플레이어/벽/상자/포탑 표면까지 자신만 이동 · 피해·기절·넉백 없음 · 최대 조준 거리 800 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 고유 사거리",
      "cooldown": "10초",
      "label": "마운틴 팀",
      "category": "원거리형",
      "concept": "밧줄이 닿은 표면까지 자신이 이동해 거리를 바꾼다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 880,
          "intervalFrames": 31,
          "coefficient": 21
        },
        "skill": {
          "kind": "self-grapple",
          "aimRange": 800,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-143": {
      "basic": "검격",
      "skill": "최대 420 돌진 · 첫 적 피해 60 · 자신도 막히는 반경 260~360의 실제 5초 원형 벽 · 최대 조준 거리 420 · 대기 16초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 고유 사거리",
      "cooldown": "16초",
      "label": "킹 오브 데마시아",
      "category": "근접형",
      "concept": "돌진 뒤 자신도 넘을 수 없는 원형 벽으로 결투한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 159.568,
          "intervalFrames": 29,
          "coefficient": 30.618000000000006
        },
        "skill": {
          "kind": "duel-ring",
          "aimRange": 420,
          "cooldownFrames": 960,
          "cooldownJitter": false,
          "durationFrames": 300,
          "damageCoefficient": 60
        },
        "eligibleAugments": [
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "amplify",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-144": {
      "basic": "포자 단발 · 1발",
      "skill": "미발동 버섯은 설치자만 표시 · 최대 320 버섯 설치(HP 20, 0.5초 준비/20초 대기, 최대 3개) · 적 접촉 반경 95 피해 20 · 반경 90 독 3초간 4×6회(최대 2개) · 최대 조준 거리 320 · 대기 9초",
      "passive": "스킬 증강: 대기 단축 · 위력 · 범위 · 고유 사거리",
      "cooldown": "9초",
      "label": "버섯돌보미",
      "category": "원거리형",
      "concept": "남에게 보이지 않는 버섯 함정으로 진입로를 지킨다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 810,
          "intervalFrames": 36,
          "coefficient": 18
        },
        "skill": {
          "kind": "mushroom",
          "aimRange": 320,
          "cooldownFrames": 540,
          "cooldownJitter": false,
          "durationFrames": 180,
          "damageCoefficient": 20
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "amplify",
          "expansion",
          "swift",
          "titan",
          "regen",
          "signature_range"
        ]
      }
    },
    "emoji-145": {
      "basic": "짧은 깨물기",
      "skill": "정확히 5초 이동속도 ×1.20 · 평타 공격빈도 ×1.25(같은 효과 비누적) · 자기 중심 · 대기 12초",
      "passive": "스킬 증강: 대기 단축",
      "cooldown": "12초",
      "label": "부캉이",
      "category": "근접형",
      "concept": "이동과 평타를 함께 가속해 가까운 적을 추격한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 140.535776,
          "intervalFrames": 40,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "shark-haste",
          "aimRange": 0,
          "cooldownFrames": 720,
          "cooldownJitter": false,
          "durationFrames": 300,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-146": {
      "basic": "대나무 타격",
      "skill": "최대 HP 10% 즉시 회복 · 6초 안의 다음 실제 평타 행동 1회 피해 ×1.50(헛쳐도 소비) · 자기 중심 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 회복·보호",
      "cooldown": "10초",
      "label": "푸바오",
      "category": "근접형",
      "concept": "스스로 회복하고 다음 한 번의 평타를 강화한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 140.535776,
          "intervalFrames": 34,
          "coefficient": 28.576800000000002
        },
        "skill": {
          "kind": "panda-next-basic",
          "aimRange": 0,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 360,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-147": {
      "basic": "작은 에너지탄 · 1발",
      "skill": "최대 260 / 속도 26의 짧은 대시 · 벽·상자 앞 정지 · 공격 부작용 없음 · 최대 조준 거리 260 · 대기 7초",
      "passive": "스킬 증강: 대기 단축",
      "cooldown": "7초",
      "label": "외계인",
      "category": "원거리형",
      "concept": "공격 부작용 없는 짧은 대시로 위치를 바꾼다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 739,
          "intervalFrames": 45,
          "coefficient": 15
        },
        "skill": {
          "kind": "safe-dash",
          "aimRange": 260,
          "cooldownFrames": 420,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-148": {
      "basic": "방망이 타격",
      "skill": "정확히 3초 최대 HP 15% 실드 · 평타 공격빈도 ×1.20(같은 출처 갱신) · 자기 중심 · 대기 10초",
      "passive": "스킬 증강: 대기 단축 · 회복·보호",
      "cooldown": "10초",
      "label": "도깨비",
      "category": "근접형",
      "concept": "짧은 보호막과 평타 가속으로 교전을 버틴다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 124,
          "intervalFrames": 45,
          "coefficient": 22.249080000000006
        },
        "skill": {
          "kind": "goblin-shield",
          "aimRange": 0,
          "cooldownFrames": 600,
          "cooldownJitter": false,
          "durationFrames": 180,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "restore",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-149": {
      "basic": "짧은 들이밀기",
      "skill": "정확히 3초 이동속도 ×1.20 · 별도 접촉 피해 없음 · 자기 중심 · 대기 8초",
      "passive": "스킬 증강: 대기 단축",
      "cooldown": "8초",
      "label": "꿀꿀이",
      "category": "근접형",
      "concept": "잠시 이동을 가속해 접근하거나 빠져나간다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": true,
          "count": 1,
          "range": 116.4,
          "intervalFrames": 52,
          "coefficient": 16.511040000000005
        },
        "skill": {
          "kind": "pig-haste",
          "aimRange": 0,
          "cooldownFrames": 480,
          "cooldownJitter": false,
          "durationFrames": 180,
          "damageCoefficient": null
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "impact",
          "wide",
          "quick",
          "swift",
          "titan",
          "regen"
        ]
      }
    },
    "emoji-150": {
      "basic": "작은 단발 탄 · 1발",
      "skill": "최대 180 / 속도 22의 짧은 대시 · 벽·상자 앞 정지 · 공격 부작용 없음 · 최대 조준 거리 180 · 대기 9초",
      "passive": "스킬 증강: 대기 단축",
      "cooldown": "9초",
      "label": "찍찍이",
      "category": "원거리형",
      "concept": "짧은 대시와 작은 단발 탄으로 거리를 조절한다",
      "facts": {
        "level": 1,
        "damageUnits": "base coefficient before rank/run/defence modifiers",
        "basic": {
          "close": false,
          "count": 1,
          "range": 537,
          "intervalFrames": 51,
          "coefficient": 8
        },
        "skill": {
          "kind": "safe-dash",
          "aimRange": 180,
          "cooldownFrames": 540,
          "cooldownJitter": false,
          "durationFrames": 0,
          "damageCoefficient": 0
        },
        "eligibleAugments": [
          "wanggui",
          "rapid",
          "heavy",
          "multi",
          "giant",
          "impact",
          "quick",
          "swift",
          "titan",
          "regen"
        ]
      }
    }
  }
};
