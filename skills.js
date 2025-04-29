
/*
{
  name: "ファイアボール",
  type: "damage",
  power: 100,
  activationRate: 0.7, // 70%発動
  priority: 5,         // 優先度5
},
*/



export const skillPool = [
  {
    "name": "連続攻撃",
    "category": "multi",
    "baseHits": 1,
    "extraHits": 1,
    "extraHitsTriggerLevel": 100,
    "description": "複数回攻撃を行う。Lv5以上で攻撃回数+1",
    "multiGrowthLevels": [
      100,
      500,
      999
    ],
    "multiGrowthFactor": 0.6
  },
  {
    "name": "二連撃",
    "category": "multi",
    "baseHits": 2,
    "description": "2回連続で攻撃を行う",
    "extraHits": 0,
    "multiGrowthLevels": [],
    "multiGrowthFactor": 1.0
  },
  {
    "name": "三連撃",
    "category": "multi",
    "baseHits": 1,
    "description": "3回連続で攻撃を行う",
    "extraHits": 1,
    "extraHitsTriggerLevel": 100,
    "multiGrowthLevels": [
      100,
      500,
      999
    ],
    "multiGrowthFactor": 0.6
  },
  {
    "name": "乱れ撃ち",
    "category": "multi",
    "baseHits": 2,
    "description": "無数の攻撃を繰り出す（実質3回攻撃）",
    "extraHits": 1,
    "extraHitsTriggerLevel": 50,
    "multiGrowthLevels": [
      50,
      250
    ],
    "multiGrowthFactor": 0.8
  },
  {
    "name": "乱舞",
    "category": "multi",
    "baseHits": 2,
    "description": "激しい連続攻撃を行う（4回攻撃）",
    "extraHits": 1,
    "extraHitsTriggerLevel": 200,
    "multiGrowthLevels": [
      200,
      999
    ],
    "multiGrowthFactor": 0.7
  },
  {
    "name": "五連撃",
    "category": "multi",
    "baseHits": 1,
    "description": "5回連続で攻撃を行う",
    "extraHits": 1,
    "extraHitsTriggerLevel": 100,
    "multiGrowthLevels": [
      100,
      500,
      999
    ],
    "multiGrowthFactor": 0.6
  },
  {
    "name": "百烈拳",
    "category": "multi",
    "baseHits": 1,
    "description": "猛烈な連打を浴びせる（5回攻撃）",
    "extraHits": 1,
    "extraHitsTriggerLevel": 10,
    "multiGrowthLevels": [
      10,
      50,
      200,
      500
    ],
    "multiGrowthFactor": 0.4
  },
  {
    "name": "連撃",
    "category": "multi",
    "baseHits": 1,
    "description": "素早く2連続で攻撃する",
    "extraHits": 1,
    "extraHitsTriggerLevel": 100,
    "multiGrowthLevels": [
      100,
      500,
      999
    ],
    "multiGrowthFactor": 0.6
  },
  {
    "name": "乱打",
    "category": "multi",
    "baseHits": 1,
    "description": "相手を乱れ撃つ（4回攻撃）",
    "extraHits": 1,
    "extraHitsTriggerLevel": 100,
    "multiGrowthLevels": [
      100,
      500,
      999
    ],
    "multiGrowthFactor": 0.6
  },
{
  "name": "毒撃",
  "category": "poison",
  "power": 30,  // ← 強化
  "duration": 2,
  "levelFactor": 0.01002,
  "growthRate": 3,
  "description": "相手を毒状態にする（短期だが強力な成長ダメージ）"
},
{
  "name": "猛毒撃",
  "category": "poison",
  "power": 30,  // ← 少し強化
  "duration": 4,
  "levelFactor": 0.01002,
  "growthRate": 1.5,
  "description": "強力な毒で相手を蝕む（成長ダメージ）"
},
{
  "name": "劇毒",
  "category": "poison",
  "power": 35,
  "duration": 6,
  "levelFactor": 0.01002,
  "growthRate": 1.5,
  "description": "致命的な毒で相手を蝕む（継続するほど強化）"
},
{
  "name": "毒霧",
  "category": "poison",
  "power": 28,  // ← 強化
  "duration": 3,
  "levelFactor": 0.01002,
  "growthRate": 1.5,
  "description": "毒の霧で相手を包み込む（毒状態付与）"
},
{
  "name": "毒牙",
  "category": "poison",
  "power": 26,  // ← 強化
  "duration": 3,
  "levelFactor": 0.01002,
  "growthRate": 2,
  "description": "猛毒の牙で噛みつき、毒状態にする"
},
{
  "name": "猛毒花",
  "category": "poison",
  "power": 30,
  "duration": 5,
  "levelFactor": 0.01002,
  "growthRate": 1.5,
  "description": "猛毒の花粉で相手を毒状態にする"
},
{
  "name": "致死毒",
  "category": "poison",
  "power": 45,
  "duration": 6,
  "levelFactor": 0.01002,
  "growthRate": 1.5,
  "description": "致死性の毒で相手を蝕む"
},
{
  "name": "瘴気",
  "category": "poison",
  "power": 40,
  "duration": 4,
  "levelFactor": 0.01002,
  "growthRate": 1.5,
  "description": "瘴気を放ち相手を毒状態にする"
},
{
  "name": "毒針",
  "category": "poison",
  "power": 25,  // ← 強化
  "duration": 2,
  "levelFactor": 0.01002,
  "growthRate": 3,
  "description": "毒の棘で刺し、相手を毒状態にする"
},
  {
    "name": "火傷",
    "category": "burn",
    "power": 105,
    "duration": 10,
    "levelFactor": 0.01002,
    "description": "相手を火傷状態にする（毎ターン少しダメージ）"
  },
  {
    "name": "大炎上",
    "category": "burn",
    "power": 120,
    "duration": 10,
    "levelFactor": 0.01002,
    "description": "激しい炎で相手を火傷状態にする"
  },
  {
    "name": "灼熱",
    "category": "burn",
    "power": 115,
    "duration": 8,
    "levelFactor": 0.01002,
    "description": "灼熱の炎で相手を火傷させる"
  },
  {
    "name": "業火",
    "category": "burn",
    "power": 125,
    "duration": 10,
    "levelFactor": 0.01002,
    "description": "業火で相手を焼き尽くす（火傷状態付与）"
  },
  {
    "name": "黒炎",
    "category": "burn",
    "power": 250,
    "duration": 6,
    "levelFactor": 0.01002,
    "description": "黒い炎で相手を火傷させる"
  },
  {
    "name": "煉獄炎",
    "category": "burn",
    "power": 145,
    "duration": 12,
    "levelFactor": 0.01002,
    "description": "煉獄の炎で相手を火傷状態にする"
  },
  {
    "name": "熱波",
    "category": "burn",
    "power": 315,
    "duration": 4,
    "levelFactor": 0.01002,
    "description": "熱波を浴びせ相手を火傷させる"
  },
  {
    "name": "吸収",
    "category": "lifesteal",
    "description": "与えたダメージの一部を吸収して回復する"
  },
  {
    "name": "強吸収",
    "category": "lifesteal",
    "description": "与ダメージの多くを吸収して回復する"
  },
  {
    "name": "生命吸収",
    "category": "lifesteal",
    "description": "相手の生命力を吸い取り、自身を回復する"
  },
  {
    "name": "血の契約",
    "category": "lifesteal",
    "description": "相手の血を啜り、自身のHPを回復する"
  },
  {
    "name": "吸血",
    "category": "lifesteal",
    "description": "相手の血を吸い、自身のHPを回復する"
  },
  {
    "name": "霊吸収",
    "category": "lifesteal",
    "description": "相手の魂を吸収し、自身のHPを回復する"
  },
  {
    "name": "闇吸収",
    "category": "lifesteal",
    "description": "闇の力で相手の生命を吸収する"
  },
  {
    "name": "封印",
    "category": "skillSeal",
    "sealCount": 1,
    "sealChance": 0.7,
    "duration": 5,
    "description": "相手の1スキルを5ターン封印する"
  },
  {
    "name": "沈黙",
    "category": "skillSeal",
    "sealCount": 2,
    "sealChance": 0.2,
    "duration": 10,
    "description": "相手の最大2スキルを低確率で10ターン封印する"
  },
  {
    "name": "呪縛",
    "category": "skillSeal",
    "sealCount": 10,
    "sealChance": 0.2,
    "duration": 2,
    "description": "相手の最大10スキルを低確率で2ターン封印する"
  },
  {
    "name": "封魂",
    "category": "skillSeal",
    "sealCount": 2,
    "sealChance": 0.4,
    "duration": 4,
    "description": "相手の最大2スキルを4ターン封印する"
  },
  {
    "name": "バリア",
    "category": "barrier",
    "reduction": 0.5,
    "duration": 3,
    "description": "一定ターン受けるダメージを半減する"
  },
  {
    "name": "強バリア",
    "category": "barrier",
    "reduction": 0.3,
    "duration": 3,
    "description": "強力なバリアで受けるダメージを大幅に軽減する"
  },
  {
    "name": "聖盾",
    "category": "barrier",
    "reduction": 0.5,
    "duration": 5,
    "description": "聖なる盾でダメージを軽減する"
  },
  {
    "name": "結界",
    "category": "barrier",
    "reduction": 0.6,
    "duration": 4,
    "description": "魔法の結界でダメージを軽減する"
  },
  {
    "name": "魔法障壁",
    "category": "barrier",
    "reduction": 0.5,
    "duration": 4,
    "description": "魔法の障壁を展開し、被ダメージを軽減する"
  },
  {
    "name": "プロテクト",
    "category": "barrier",
    "reduction": 0.4,
    "duration": 3,
    "description": "防護フィールドでダメージを軽減する"
  },
  {
    "name": "再生",
    "category": "regen",
    "amount": 12,
    "duration": 3,
    "levelFactor": 0.01503,
    "description": "一定ターン毎ターンHPが回復する"
  },
  {
    "name": "急速再生",
    "category": "regen",
    "amount": 21,
    "duration": 3,
    "levelFactor": 0.01503,
    "description": "急速にHPが再生する（毎ターン回復）"
  },
  {
    "name": "自然治癒",
    "category": "regen",
    "amount": 12,
    "duration": 5,
    "levelFactor": 0.01503,
    "description": "自然の力で徐々にHPが回復する"
  },
  {
    "name": "祝福",
    "category": "regen",
    "amount": 18,
    "duration": 4,
    "levelFactor": 0.01503,
    "description": "祝福の力で毎ターンHPが回復する"
  },
  {
    "name": "反射",
    "category": "reflect",
    "reflectPercent": 0.3,
    "duration": 3,
    "description": "一定ターン受けたダメージの一部を相手に反射する"
  },
  {
    "name": "強反射",
    "category": "reflect",
    "reflectPercent": 0.5,
    "duration": 3,
    "description": "強力な魔法でダメージを反射する"
  },
  {
    "name": "魔法反射",
    "category": "reflect",
    "reflectPercent": 0.4,
    "duration": 4,
    "description": "魔法障壁で受けたダメージを反射する"
  },
  {
    "name": "カウンター",
    "category": "reflect",
    "reflectPercent": 0.3,
    "duration": 4,
    "description": "カウンター状態になり、ダメージを反射する"
  },
  {
    "name": "ミラーシールド",
    "category": "reflect",
    "reflectPercent": 0.5,
    "duration": 4,
    "description": "鏡の盾でダメージを反射する"
  },
  {
    "name": "回避",
    "category": "evasion",
    "evasionChance": 0.4,
    "duration": 3,
    "description": "一定ターン攻撃を回避しやすくなる",
    "levelFactor": 5e-05
  },
  {
    "name": "高速回避",
    "category": "evasion",
    "evasionChance": 0.4,
    "duration": 3,
    "description": "身体能力を高め攻撃を回避しやすくする",
    "levelFactor": 5e-05
  },
  {
    "name": "影分身",
    "category": "evasion",
    "evasionChance": 0.4,
    "duration": 4,
    "description": "複数の分身で攻撃を回避する",
    "levelFactor": 5e-05
  },
  {
    "name": "見切り",
    "category": "evasion",
    "evasionChance": 0.4,
    "duration": 4,
    "description": "敵の攻撃を見切り、回避率が上昇する",
    "levelFactor": 5e-05
  },
  {
    "name": "蜃気楼",
    "category": "evasion",
    "evasionChance": 0.4,
    "duration": 3,
    "description": "蜃気楼を起こし攻撃を回避する",
    "levelFactor": 5e-05
  },
  {
    "name": "強化",
    "category": "buff",
    "targetStats": [
      "attack",
      "defense"
    ],
    "factor": 1.3,
    "duration": 3,
    "description": "一定ターン攻撃力・防御力を強化する"
  },
  {
    "name": "攻撃強化",
    "category": "buff",
    "targetStats": [
      "attack"
    ],
    "factor": 1.5,
    "duration": 3,
    "description": "一定ターン攻撃力を大きく強化する"
  },
  {
    "name": "防御強化",
    "category": "buff",
    "targetStats": [
      "defense"
    ],
    "factor": 1.5,
    "duration": 3,
    "description": "一定ターン防御力を大きく強化する"
  },
  {
    "name": "加速",
    "category": "buff",
    "targetStats": [
      "speed"
    ],
    "factor": 1.5,
    "duration": 5,
    "description": "一定ターン素早さを強化する"
  },
  {
    "name": "全能力強化",
    "category": "buff",
    "targetStats": [
      "attack",
      "defense",
      "speed"
    ],
    "factor": 1.2,
    "duration": 4,
    "description": "一定ターン攻撃・防御・素早さを強化する"
  },
  {
    "name": "鉄壁",
    "category": "buff",
    "targetStats": [
      "defense"
    ],
    "factor": 2.0,
    "duration": 2,
    "description": "短時間、防御力を大幅に強化する"
  },
  {
    "name": "狂戦士",
    "category": "berserk",
    "duration": 3,
    "description": "攻撃力を大幅上昇させるが防御力が低下（一定ターン）"
  },
  {
    "name": "弱体",
    "category": "debuff",
    "targetStats": [
      "attack",
      "defense"
    ],
    "factor": 0.7,
    "duration": 3,
    "description": "一定ターン敵の攻撃力・防御力を低下させる"
  },
  {
    "name": "攻撃低下",
    "category": "debuff",
    "targetStats": [
      "attack"
    ],
    "factor": 0.6,
    "duration": 3,
    "description": "一定ターン敵の攻撃力を大幅に低下させる"
  },
  {
    "name": "防御低下",
    "category": "debuff",
    "targetStats": [
      "defense"
    ],
    "factor": 0.6,
    "duration": 3,
    "description": "一定ターン敵の防御力を大幅に低下させる"
  },
  {
    "name": "鈍足",
    "category": "debuff",
    "targetStats": [
      "speed"
    ],
    "factor": 0.7,
    "duration": 3,
    "description": "一定ターン敵の素早さを低下させる"
  },
  {
    "name": "呪い",
    "category": "debuff",
    "targetStats": [
      "attack",
      "defense",
      "speed"
    ],
    "factor": 0.8,
    "duration": 4,
    "description": "一定ターン敵の攻撃・防御・素早さを低下させる"
  },
  {
    "name": "威圧",
    "category": "debuff",
    "targetStats": [
      "attack"
    ],
    "factor": 0.5,
    "duration": 2,
    "description": "圧倒的な威圧感で敵の攻撃力を下げる"
  },
  {
    "name": "病気",
    "category": "debuff",
    "targetStats": [
      "attack",
      "defense"
    ],
    "factor": 0.8,
    "duration": 4,
    "description": "病気をもたらし敵の攻撃・防御力を低下させる"
  },
  {
    "name": "太陽の恵み",
    "category": "buffExtension",
    "extendTurns": 2,
    "description": "自身の強化効果の持続時間を延長する"
  },
  {
    "name": "闇の呪詛",
    "category": "debuffExtension",
    "extendTurns": 2,
    "description": "相手の弱体効果の持続時間を延長する"
  },
  {
    "name": "時の祈り",
    "category": "buffExtension",
    "extendTurns": 3,
    "description": "時間を操り自身の強化効果を延長する"
  },
  {
    "name": "呪詛延長",
    "category": "debuffExtension",
    "extendTurns": 3,
    "description": "呪詛の効力を強め、敵の弱体効果を延長する"
  },
  {
    "name": "治癒",
    "category": "heal",
    "healRatio": 0.6,
    "levelFactor": 0.000501,
    "description": "自身のHPを回復する"
  },
  {
    "name": "大治癒",
    "category": "heal",
    "healRatio": 1.5,
    "levelFactor": 0.000501,
    "description": "自身のHPを大きく回復する"
  },
  {
    "name": "奇跡",
    "category": "heal",
    "healRatio": 3.0,
    "levelFactor": 0.0,
    "description": "奇跡を起こし自身のHPを全回復する"
  },
  {
    "name": "癒しの光",
    "category": "heal",
    "healRatio": 0.9,
    "levelFactor": 0.000501,
    "description": "癒しの光で自身のHPを回復する"
  },
  {
    "name": "癒し",
    "category": "heal",
    "healRatio": 0.75,
    "levelFactor": 0.000501,
    "description": "癒しの力で自身のHPを回復する"
  },
  {
    "name": "火炎",
    "category": "damage",
    "multiplier": 1.44,
    "ignoreDefense": 0.4,
    "description": "炎で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "ファイア",
    "category": "damage",
    "multiplier": 1.2,
    "ignoreDefense": 0.3,
    "description": "火の魔法で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "氷結",
    "category": "damage",
    "multiplier": 1.2,
    "ignoreDefense": 0.5,
    "description": "氷の魔法で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "吹雪",
    "category": "damage",
    "multiplier": 1.08,
    "ignoreDefense": 0.4,
    "description": "猛吹雪で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "雷撃",
    "category": "damage",
    "multiplier": 0.96,
    "ignoreDefense": 0.0,
    "description": "雷で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "落雷",
    "category": "damage",
    "multiplier": 1.32,
    "ignoreDefense": 0.2,
    "description": "雷を落として攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "岩石",
    "category": "damage",
    "multiplier": 1.56,
    "ignoreDefense": 0.5,
    "description": "岩石をぶつけて攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "地震",
    "category": "damage",
    "multiplier": 1.68,
    "ignoreDefense": 0.5,
    "description": "地震を発生させ攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "疾風",
    "category": "damage",
    "multiplier": 1.2,
    "ignoreDefense": 0.5,
    "description": "疾風で斬りつける",
    "levelFactor": 0.002004
  },
  {
    "name": "竜巻",
    "category": "damage",
    "multiplier": 1.32,
    "ignoreDefense": 0.4,
    "description": "竜巻を起こして攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "水流",
    "category": "damage",
    "multiplier": 1.2,
    "ignoreDefense": 0.4,
    "description": "水流をぶつけて攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "津波",
    "category": "damage",
    "multiplier": 1.44,
    "ignoreDefense": 0.4,
    "description": "大津波で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "聖光",
    "category": "damage",
    "multiplier": 1.32,
    "ignoreDefense": 0.3,
    "description": "聖なる光で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "ホーリー",
    "category": "damage",
    "multiplier": 1.56,
    "ignoreDefense": 0.2,
    "description": "聖なる魔法で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "闇術",
    "category": "damage",
    "multiplier": 1.56,
    "ignoreDefense": 0.5,
    "description": "闇の魔法で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "暗黒",
    "category": "damage",
    "multiplier": 1.68,
    "ignoreDefense": 0.4,
    "description": "暗黒の力で攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "メテオ",
    "category": "damage",
    "multiplier": 2.4,
    "ignoreDefense": 0.5,
    "description": "隕石を落とし大ダメージを与える",
    "levelFactor": 0.002004
  },
  {
    "name": "アルテマ",
    "category": "damage",
    "multiplier": 3.0,
    "ignoreDefense": 0.5,
    "description": "究極魔法で敵に大ダメージを与える",
    "levelFactor": 0.002004
  },
  {
    "name": "強打",
    "category": "damage",
    "multiplier": 1.8,
    "ignoreDefense": 0.5,
    "description": "渾身の一撃を叩き込む",
    "levelFactor": 0.002004
  },
  {
    "name": "貫通",
    "category": "damage",
    "multiplier": 1.2,
    "ignoreDefense": 0.0,
    "description": "相手の防御を無視して攻撃する",
    "levelFactor": 0.002004
  },
  {
    "name": "痺れ粉",
    "category": "skillSeal",
    "sealCount": 3,
    "sealChance": 0.5,
    "duration": 1,
    "description": "相手のスキルを3つまで、50%の確率で1ターン封印する。先行のみ効果あり"
  },
  {
    "name": "蔦縛り",
    "category": "stun",
    "duration": 2,
    "stunChance": 0.25,
    "priority": 5,         // 優先度5
    "description": "蔦で縛り付け、25%の確率で2ターン行動不能にする"
  },
  {
    "name": "静寂の守り",
    "category": "passive",
    "effect": "blockTurnEffects",
    "subtype": "poison_burn",
    "description": "毒・火傷系の継続スキルを戦闘開始時に封印する"
  },
  {
    "name": "無音の加護",
    "category": "passive",
    "effect": "blockTurnEffects",
    "subtype": "buff",
    "description": "バフ系の継続スキルを戦闘開始時に封印する"
  },
  {
    "name": "呪封の障壁",
    "category": "passive",
    "effect": "blockTurnEffects",
    "subtype": "debuff",
    "description": "デバフ系の継続スキルを戦闘開始時に封印する"
  },
  {
    "name": "再生拒絶",
    "category": "passive",
    "effect": "blockTurnEffects",
    "subtype": "regen",
    "description": "再生スキルを戦闘開始時に封印する"
  },
  {
    "name": "反射破り",
    "category": "passive",
    "effect": "blockTurnEffects",
    "subtype": "reflect",
    "description": "反射スキルを戦闘開始時に封印する"
  },
  {
    "name": "封印の守り",
    "category": "passive",
    "effect": "blockTurnEffects",
    "subtype": "stun",
    "description": "スタンスキルを戦闘開始時に封印する"
  }
];