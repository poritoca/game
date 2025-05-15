
// スキルレベルに応じてターン数ボーナスを決める設定
const levelTurnBonusSettings = [
  { level: 9999, bonus: 9 },
  { level: 7999, bonus: 8 },
  { level: 5999, bonus: 7 },
  { level: 3999, bonus: 6 },
  { level: 2999, bonus: 5 },
  { level: 1999, bonus: 4 },
  { level: 1499, bonus: 3 },	
  { level: 999,  bonus: 2 },
  { level: 500,  bonus: 1 },
  { level: 0,    bonus: 0 },
];

window.showConfirmationPopup = function(messageHtml, onConfirm) {
  const popup = document.getElementById("eventPopup");
  const title = document.getElementById("eventPopupTitle");
  const optionsEl = document.getElementById("eventPopupOptions");

  // ★ ここを textContent → innerHTML に変更
  title.innerHTML = messageHtml;
  optionsEl.innerHTML = "";

  const okBtn = document.createElement("button");
  okBtn.textContent = "了解";
  okBtn.style.padding = "8px 16px";
  okBtn.onclick = () => {
    popup.style.display = "none";
    if (typeof onConfirm === "function") onConfirm();
  };

  optionsEl.appendChild(okBtn);
  popup.style.display = "block";
};

// 共通のクリーンアップ関数を作る
window.clearEventPopup = function() {
    const popup = document.getElementById('eventPopup');
    const optionsEl = document.getElementById('eventPopupOptions');
    const selectContainer = document.getElementById('eventPopupSelectContainer');
    const selectEl = document.getElementById('eventPopupSelect');
    const selectBtn = document.getElementById('eventPopupSelectBtn');

    optionsEl.innerHTML = '';  // ボタン類消去
    selectEl.innerHTML = '';   // セレクト項目消去
    selectContainer.style.display = 'none';
    popup.style.display = 'none';

    // ボタンの onclick 解除（念のため）
    selectBtn.onclick = null;
};


window.toggleQuickGuideLog = function () {
  const content = document.getElementById("quickGuideLog");
  content.classList.toggle("hidden");
};

window.toggleQuickGuide = function () {
  const content = document.getElementById("quickGuideContent");
  content.classList.toggle("hidden");
};

// スキル発動可否を個別に判定し、優先度順に決める関数
window.offensiveSkillCategories = ['damage', 'multi', 'poison', 'burn', 'lifesteal'];

// 特殊敵出現率制御
window.specialMode = 'normal'; // normal or brutal


const itemColors = [
  { word: '赤い', usesPerBattle: 1 },
  { word: '青い', usesPerBattle: 2 },
  { word: '緑の', usesPerBattle: 2 },
  { word: '黄の', usesPerBattle: 2 },
  { word: '黒い', usesPerBattle: 1 },
  { word: '白い', usesPerBattle: 3 },
  { word: '銀色の', usesPerBattle: 3 },
  { word: '金色の', usesPerBattle: 4 },
  { word: '紫の', usesPerBattle: 2 },
  { word: '橙の', usesPerBattle: 2 },
  { word: '藍色の', usesPerBattle: 2 },
  { word: '透明な', usesPerBattle: Infinity },
  { word: '虹色の', usesPerBattle: Infinity }
];

const itemNouns = [
  { word: '壷', breakChance: 0.06, dropRateMultiplier: 0.4 },
  { word: '札', breakChance: 0.05, dropRateMultiplier: 0.45 },
  { word: '結晶', breakChance: 0.003, dropRateMultiplier: 0.6 },
  { word: '石', breakChance: 0.03, dropRateMultiplier: 0.65 },
  { word: '鉱石', breakChance: 0.04, dropRateMultiplier: 0.55 },
  { word: '歯車', breakChance: 0.05, dropRateMultiplier: 0.5 },
  { word: '羽根', breakChance: 0.07, dropRateMultiplier: 0.35 },
  { word: '巻物', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '鏡', breakChance: 0.02, dropRateMultiplier: 0.68 },
  { word: '炎', breakChance: 0.06, dropRateMultiplier: 0.3 },
  { word: '氷塊', breakChance: 0.05, dropRateMultiplier: 0.38 },
  { word: '枝', breakChance: 0.06, dropRateMultiplier: 0.4 },
  { word: '勾玉', breakChance: 0.001, dropRateMultiplier: 0.2 },
  { word: '仮面', breakChance: 0.04, dropRateMultiplier: 0.5 },
  { word: '珠', breakChance: 0.002, dropRateMultiplier: 0.8 },
  { word: '箱', breakChance: 0.04, dropRateMultiplier: 0.6 },
  { word: '盾', breakChance: 0, dropRateMultiplier: 0.08 },
  { word: '剣', breakChance: 0, dropRateMultiplier: 0.07 },
  { word: '書', breakChance: 0.06, dropRateMultiplier: 0.4 },
  { word: '砂時計', breakChance: 0.07, dropRateMultiplier: 0.35 },
  { word: '宝石', breakChance: 0.0002, dropRateMultiplier: 0.1 },
  { word: '瓶', breakChance: 0.06, dropRateMultiplier: 0.38 },
  { word: '種', breakChance: 0.02, dropRateMultiplier: 0.7 },
  { word: '薬草', breakChance: 0.07, dropRateMultiplier: 0.3 },
  { word: '鉄片', breakChance: 0.05, dropRateMultiplier: 0.45 },
  { word: '骨', breakChance: 0.05, dropRateMultiplier: 0.4 },
  { word: '音叉', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '面', breakChance: 0.02, dropRateMultiplier: 0.75 },
  { word: '鏡石', breakChance: 0.007, dropRateMultiplier: 0.2 },
  { word: '符', breakChance: 0.03, dropRateMultiplier: 0.65 },
  { word: '灯', breakChance: 0.05, dropRateMultiplier: 0.5 },
  { word: '鐘', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '骨片', breakChance: 0.04, dropRateMultiplier: 0.55 },
  { word: '巻貝', breakChance: 0.06, dropRateMultiplier: 0.25 },
  { word: '球', breakChance: 0.008, dropRateMultiplier: 0.15 },
  { word: '珠玉', breakChance: 0, dropRateMultiplier: 0.05 },
  { word: '護符', breakChance: 0.03, dropRateMultiplier: 0.68 },
  { word: '錫杖', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '光球', breakChance: 0, dropRateMultiplier: 0.16 }
];

const itemAdjectives = [
  { word: '煤けた', activationRate: 0.1, dropRate: 0.025 },
  { word: '冷たい', activationRate: 0.25, dropRate: 0.01 },
  { word: '重い', activationRate: 0.2, dropRate: 0.008 },
  { word: '鋭い', activationRate: 0.35, dropRate: 0.006 },
  { word: '輝く', activationRate: 0.38, dropRate: 0.003 },
  { word: '神秘的な', activationRate: 0.42, dropRate: 0.0025 },
  { word: '伝説の', activationRate: 0.6, dropRate: 0.002 },
  { word: '超越した', activationRate: 0.8, dropRate: 0.001 },
  { word: '神の', activationRate: 1.0, dropRate: 0.0001 }
];


window.getSpecialChance = function() {
    return window.specialMode === 'brutal' ? 1.0 : 0.03;
};

window.skillDeleteUsesLeft = 3;  // ゲーム開始時に3回

// UIボタンの処理
window.toggleSpecialMode = function() {
    const btn = document.getElementById('specialModeButton');

    if (window.specialMode === 'normal') {
        window.specialMode = 'brutal';
        btn.textContent = '鬼畜モード';
        btn.classList.remove('normal-mode');
        btn.classList.add('brutal-mode');
    } else {
        window.specialMode = 'normal';
        btn.textContent = '通常モード';
        btn.classList.remove('brutal-mode');
        btn.classList.add('normal-mode');
    }
};

const skillDeleteButton = document.getElementById('skillDeleteButton');

function updateSkillDeleteButton() {
    skillDeleteButton.textContent = `スキル削除 (残り${window.skillDeleteUsesLeft}回)`;
    if (window.skillDeleteUsesLeft > 0) {
        skillDeleteButton.style.backgroundColor = 'blue';
        skillDeleteButton.disabled = false;
    } else {
        skillDeleteButton.style.backgroundColor = 'gray';
        skillDeleteButton.disabled = true;
    }
}

skillDeleteButton.addEventListener('click', () => {
    if (window.skillDeleteUsesLeft > 0) {
        showWhiteSkillSelector(selectedName => {
					  if (!selectedName) {
        showCustomAlert("キャンセルしました！", 2000);
        return;  // null のときは何もしない
    }

            deleteSkillByName(selectedName);
            updateStats();
            window.skillDeleteUsesLeft--;
            updateSkillDeleteButton();
            showCustomAlert(`${selectedName} を削除しました！`, 3000);
						// アラートを出した後、念のため container をクリーンアップ
            const container = document.getElementById('customAlertContainer');
            if (container.children.length === 0) {
              container.innerHTML = '';
            }
        });
    }
});

updateSkillDeleteButton();

function hasOffensiveSkill(char) {
    return char.skills.some(sk => {
        const data = skillPool.find(s => s.name === sk.name);
        return window.offensiveSkillCategories.includes(data?.category);
    });
}

function decideSkillsToUse(actor, maxActivations) {
    if (!actor.usedSkillNames) actor.usedSkillNames = new Set();

    const usableSkills = actor.skills.filter(skill => {
        const data = skillPool.find(s => s.name === skill.name);
        const isPassive = data?.category === 'passive';
        return !skill.sealed && !isPassive;
    });

    let availableSkills = usableSkills;

    // 鬼畜モードなら未使用スキルのみ対象、一巡したらリセット
    if (window.specialMode === 'brutal') {
        availableSkills = usableSkills.filter(skill => !actor.usedSkillNames.has(skill.name));
        if (availableSkills.length === 0) {
            actor.usedSkillNames.clear();
            availableSkills = [...usableSkills];
        }
    }

    const skillSelectionBias = 2.0;
    const skillNamesInMemoryOrder = Object.keys(actor.skillMemory || {});

    // プレイヤーが1つでも攻撃スキルを所持しているか
    const hasAnyOffensive = availableSkills.some(sk => {
        const data = skillPool.find(s => s.name === sk.name);
        return window.offensiveSkillCategories.includes(data?.category);
    });

    let finalSkills = [];
    let selectedNames = [];

    // 再抽選は最大5回まで（攻撃スキルがある場合のみ）
    const maxRetries = hasAnyOffensive ? 5 : 1;

    for (let retry = 0; retry < maxRetries; retry++) {
        const weightedSkills = [];
        availableSkills.forEach(skill => {
            const index = skillNamesInMemoryOrder.indexOf(skill.name);
            const position = index >= 0 ? index : skillNamesInMemoryOrder.length;
            const weight = Math.pow(skillNamesInMemoryOrder.length - position, skillSelectionBias);
            const count = Math.ceil(weight);
            for (let i = 0; i < count; i++) weightedSkills.push(skill);
        });

        const shuffled = [...weightedSkills].sort(() => Math.random() - 0.5);
        const uniqueCandidates = Array.from(new Set(shuffled));

        finalSkills = [];
        selectedNames = [];

        for (const sk of uniqueCandidates) {
            const skillData = skillPool.find(s => s.name === sk.name);
            const activationRate = skillData?.activationRate ?? 1.0;
            if (Math.random() < activationRate) {
                finalSkills.push(sk);
                selectedNames.push(sk.name);
                if (finalSkills.length >= maxActivations) break;
            }
        }

        // 選ばれた中に攻撃スキルがあるかチェック
        const hasOffense = finalSkills.some(sk => {
            const data = skillPool.find(s => s.name === sk.name);
            return window.offensiveSkillCategories.includes(data?.category);
        });

        // 攻撃スキルがあれば確定、または最大リトライに達したら終了
        if (!hasAnyOffensive || hasOffense || retry === maxRetries - 1) break;
    }

    // 鬼畜モードなら使ったスキルを記録
    if (window.specialMode === 'brutal') {
        for (const sk of finalSkills) {
            actor.usedSkillNames.add(sk.name);
        }
    }

    if (actor === player) {
        window.lastChosenSkillNames = selectedNames.filter(name => {
            const def = skillPool.find(s => s.name === name);
            return def?.category !== 'passive';
        });
        window.lastOffensiveSkills = finalSkills
            .filter(sk => {
                const data = skillPool.find(s => s.name === sk.name);
                return window.offensiveSkillCategories.includes(data?.category);
            })
            .map(sk => sk.name);
    }

    finalSkills.sort((a, b) => {
        const aData = skillPool.find(s => s.name === a.name);
        const bData = skillPool.find(s => s.name === b.name);
        const ap = aData?.priority ?? -1;
        const bp = bData?.priority ?? -1;
        if (bp !== ap) return bp - ap;
        return (b.speed || 0) - (a.speed || 0);
    });

    return finalSkills;
}


// 設定に基づいてターン数ボーナスを返す関数
function getLevelTurnBonus(level) {
  for (const setting of levelTurnBonusSettings) {
    if (level >= setting.level) {
      return setting.bonus;
    }
  }
  return 0;
}


let statusLogged = false;
window.startBattle = undefined;
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("startNewGameBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const name = document.getElementById("inputStr").value || "プレイヤー";
      startNewGame(name);
    });
  } else {
    //alert("[A010] startBattle 終了");
    //alert("[A010] startBattle 終了");
  }
});





function applySafeAttack(attacker, defender, log) {
  const baseDmg = attacker.attack - defender.defense;
  const dmg = Math.max(1, Math.floor(isNaN(baseDmg) ? 1 : baseDmg));
  defender.hp -= dmg;
  return;
}

function updateSealedSkills(character) {
  character.skills.forEach(skill => {
    if (skill.sealed) {
      skill.sealRemaining--;
      if (skill.sealRemaining <= 0) {
        skill.sealed = false;
        delete skill.sealRemaining;
      }
    }
  });
}

function getExpandedSkills(skills, neededCount) {
  const result = [];
  const shuffled = [...skills].sort(() => 0.5 - Math.random());
  for (let i = 0; i < neededCount; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

function getEffectiveStat(char, stat) {
  let growthValue = 0;
  if (char.growthBonus && (stat in char.growthBonus)) {
    growthValue = char.growthBonus[stat];
  }

  let mod = 1.0;
  if (char.tempEffects && typeof char.tempEffects[stat + 'Mod'] === 'number') {
    mod = char.tempEffects[stat + 'Mod'];
  }

  if (!char.baseStats || typeof char.baseStats[stat] !== 'number') {
    //alert(`[ERROR] getEffectiveStat: baseStats.${stat} is invalid: ` + JSON.stringify(char.baseStats));
    return 0;
  }

  return (char.baseStats[stat] + growthValue) * mod;
}

function seededHash(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getRarityMultiplierFromRand(randFunc) {
  const seed = Math.max(0.000000001, randFunc());
  const power = 30;      // 分布の鋭さ
  const max = 5;         // 上限倍率
  return 1.0 + (max - 1.0) * Math.pow(1 - seed, power);
}

function maybeGainItemMemory() {
	
	
    if (window.specialMode !== 'brutal') return;
    if (!player || !player.skills || player.skills.length === 0) return;
    if (player.itemMemory.length >= 3) return;

    function pickItemAdjective() {
        const shuffled = [...itemAdjectives].sort(() => Math.random() - 0.5);
        for (const adj of shuffled) {
            if (Math.random() < adj.dropRate) return adj;
        }
        return null;
    }

function pickItemAdjectiveWithNoun(noun) {
  const streakBias = Math.pow((currentStreak / 100) + 1, 0.6);
  const shuffled = [...itemAdjectives].sort(() => Math.random() - 0.5);
  for (const adj of shuffled) {
    const boostedDropRate = Math.pow(adj.dropRate, 1 / streakBias);  // レアほど上昇
    const effectiveDropRate = boostedDropRate * (noun.dropRateMultiplier || 1.0);
    if (Math.random() < effectiveDropRate) return adj;
  }
  return null;
}



const allSkills = skillPool.filter(s => s.category !== 'passive');
const skill = allSkills[Math.floor(Math.random() * allSkills.length)];

const colorData = itemColors[Math.floor(Math.random() * itemColors.length)];
const nounData = itemNouns[Math.floor(Math.random() * itemNouns.length)];
const adjective = pickItemAdjectiveWithNoun(nounData);
if (!adjective) return;

// dropRate → glow を計算（変数がすべて揃ったあと）
const dropRate =
  (colorData.dropRateMultiplier || 1) *
  (adjective.dropRateMultiplier || 1) *
  (nounData.dropRateMultiplier || 1);
const glow = Math.min(1 / Math.max(dropRate, 0.01), 5);

const newItem = {
  color: colorData.word,
  adjective: adjective.word,
  noun: nounData.word,
  skillName: skill.name,
  activationRate: adjective.activationRate,
  usesPerBattle: colorData.usesPerBattle,
  breakChance: nounData.breakChance,
  remainingUses: colorData.usesPerBattle,
  skillLevel: 1,
  glow: glow.toFixed(2) // 保存形式を固定小数点
};

player.itemMemory.push(newItem);
drawItemMemoryList();

showCustomAlert(
  `新アイテム入手！ ${newItem.color}${newItem.adjective}${newItem.noun}（${newItem.skillName}）`,
  8000,
  "#ffa",
  "#000"
);
drawItemMemoryList();
}

// RPGシミュレーター メインロジック（日本語UI、スキル100種以上対応）
import { skillPool } from './skills.js';
import { drawCharacterImage } from './drawCharacter.js';

let player = null;
let enemy = null;
let currentStreak = 0;
let streakBonus = 1;
let skillSimulCount = 2;
let hpHistory = [];
let sslot = 0;
let isLoadedFromSave = false;
let isAutoBattle = false; // ← 長押し中を表すフラグ
window.lastChosenSkillNames = [];  // 戦闘ごとの抽選結果



// ユーティリティ: オブジェクトをBase64文字列にエンコード
window.encodeBase64 = obj => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
// ユーティリティ: Base64文字列をオブジェクトにデコード
window.decodeBase64 = str => JSON.parse(decodeURIComponent(escape(atob(str))));

// 名前表示のためのシード付きランダム生成（敵用の仮名）
window.seededRandom = function(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return function () {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
};

// ゲーム内で表示する名前（敵の場合はランダムカナ名に変換）
window.displayName = function(name) {
  if (typeof name !== 'string') return '？？？';

  if (name.startsWith('敵')) {
    const kana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロヤユヨワン';
    let seed = 0;
    for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i);
    const rand = window.seededRandom(String(seed));
    const len = 3 + Math.floor(rand() * 2);
    let result = '';
    for (let i = 0; i < len; i++) result += kana[Math.floor(rand() * kana.length)];
    return result;
  }
  return name;
};

let isWaitingGrowth = false;

// 追加：成長ボーナス倍率
window.growthMultiplier = 1;

// 成長選択時
window.chooseGrowth = function(stat) {
	
  const baseAmount = Math.floor(enemy[stat] * 0.08);
  const growthAmount = baseAmount * window.growthMultiplier;
  if (!player.growthBonus) {
    player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
  }
  player.growthBonus[stat] += growthAmount;
  player[stat] = player.baseStats[stat] + player.growthBonus[stat];

  const message = `成長: ${stat} +${growthAmount}（倍率x${window.growthMultiplier}）`;
  showCustomAlert(message, 2000);  // ← 追加：カスタムアラート表示

  const logEl = document.getElementById('battleLog');
  logEl.textContent += `\n成長: ${stat} が 敵の${stat}の8%（+${growthAmount}, ボーナス倍率x${window.growthMultiplier}）上昇\n`;

  window.growthMultiplier = 1;  // リセット
  isWaitingGrowth = false;
};

window.skipGrowth = function() {
  window.growthMultiplier = Math.min(window.growthMultiplier * 2, 256);
  const logEl = document.getElementById('battleLog');
  logEl.textContent += `\n今回は成長をスキップ。次回成長値は倍率x${window.growthMultiplier}になります（最大256倍）。\n`;

  showCustomAlert(`今回は成長をスキップ。次回倍率x${window.growthMultiplier}`, 2000);  // ← 追加

  isWaitingGrowth = false;
};


// キャラクターオブジェクト生成（初期ステータスとランダム3スキル）

// HP推移を記録（割合）
window.recordHP = function() {
  hpHistory.push([
  Math.max(0, Math.min(1, player.hp / player.maxHp)),
  Math.max(0, Math.min(1, enemy.hp / enemy.maxHp))
  ]);
};

// ステータス表示用文字列生成
window.formatStats = function(c) {
   const isPlayer = (c === player);
  const maxStreak = parseInt(localStorage.getItem('maxStreak') || '0');
  const safeHp = Math.max(0, c.hp);

  return `
    <div class="name-and-streak">
      <div class="player-name"><strong>${displayName(c.name)}</strong></div>
      ${isPlayer ? `
				
      ` : ``}
    </div>
    <ul style="padding-left: 20px;">
      <li>ATK: ${c.attack}</li>
      <li>DEF: ${c.defense}</li>
      <li>SPD: ${c.speed}</li>
      <li>HP: ${safeHp} / ${c.maxHp}</li>
    </ul>
  `;
};

// スキル一覧表示用HTML生成（ホバーで説明）

const categoryColors = {
  "multi": "#ff4d4d",        // 連撃系 → 赤
  "poison": "#9933cc",       // 毒系 → 紫
  "burn": "#ff6600",         // 火傷系 → オレンジ
  "lifesteal": "#66ccff",    // 吸収系 → 水色
  "skillSeal": "#9999ff",    // 封印系 → 薄い青
  "barrier": "#66ff66",      // バリア系 → 緑
  "regen": "#66ff99",        // 再生系 → 明るい緑
  "reflect": "#ffff66",      // 反射系 → 黄色
  "evasion": "#ff99cc",      // 回避系 → ピンク
  "buff": "#ffd700",         // 強化系 → 金
  "debuff": "#cc66ff",       // 弱体系 → 紫
  "heal": "#00ffcc",         // 回復系 → シアン
  "damage": "#ff3333",       // 通常攻撃 → 真っ赤
  "stun": "#ff99cc",         // スタン → ピンク
  "buffExtension": "#00ccff",// バフ延長 → 水色
  "debuffExtension": "#cc66ff", // デバフ延長 → 紫
  "berserk": "#ff3333",      // 狂戦士化 → 赤
  "passive": "gold",         // パッシブは別扱い
  "others": "#cccccc"        // その他 → 灰色
};

window.formatSkills = function(c) {
  const skillElements = c.skills.map(s => {
    const skillName = (typeof s === 'string') ? s : s.name;
    const found = skillPool.find(sk => sk.name === skillName);
    var desc = found?.description || '';
    var category = found?.category || 'others';

    // 色と優先順位を決める
    let color = 'white'; // デフォルト
    let priority = 2;

    if (window.initialAndSlotSkills && window.initialAndSlotSkills.includes(skillName)) {
      color = 'white';
      priority = 0;
    } else if (category === 'passive') {
      color = 'gold';
      priority = 1;
    } else {
      color = categoryColors[category] || 'white';
    }

    return {
      html: `<span title='${desc}' style='color:${color}'>${skillName} Lv${s.level || 1}</span>`,
      priority: priority
    };
  });

  skillElements.sort((a, b) => a.priority - b.priority);

  return `
    <div><strong>スキル</strong></div>
    <ul style="padding-left: 20px;">
      ${skillElements.map(e => `<li>${e.html}</li>`).join('')}
    </ul>
  `;
};

// ステータス表示の更新
window.updateStats = function() {
  if (isAutoBattle) return;  // オートバトル中は描画スキップ

  if (!player || !enemy) return;  // 安全確認：nullなら中断

  if (player.hp > player.maxHp) player.hp = player.maxHp;
  if (enemy.hp > enemy.maxHp) enemy.hp = enemy.maxHp;

  if (player.hp < 0) player.hp = 0;
  if (enemy.hp < 0) enemy.hp = 0;

  const pHtml = `<div>${formatStats(player)}</div><div>${formatSkills(player)}</div>`;
  const eHtml = `<div>${formatStats(enemy)}</div><div>${formatSkills(enemy)}</div>`;
  document.getElementById('playerStats').innerHTML = pHtml;
  document.getElementById('enemyStats').innerHTML = eHtml;

  // 修正ポイント：
  drawCharacterImage(displayName(player.name), 'playerCanvas');
  drawCharacterImage(displayName(enemy.name), 'enemyCanvas');
};
// 「はじめから」スタート（タイトル画面非表示、ゲーム画面表示）
window.startNewGame = function() {
  const title = document.getElementById('titleScreen');
  const game = document.getElementById('gameScreen');

  // フェードアウト → 非表示 → ゲーム画面表示
  title.classList.add('fade-out');
  setTimeout(() => {
    title.classList.add('hidden');
    game.classList.remove('hidden');
    game.classList.add('fade-in');

    // 通常初期化処理
    statusLogged = false;
		
		if (!player) {
  player = {};
}
if (!player.itemMemory) {
  player.itemMemory = [];
}
    document.getElementById('battleLog').classList.remove('hidden');
    document.getElementById("battleArea").classList.add("hidden");
    currentStreak = 0;
    document.getElementById("skillMemoryContainer").style.display = "block";
		window.isFirstBattle = true;
		startBattle();
  }, 500); // アニメーション時間と一致
};

// 対戦モード選択画面表示
window.showBattleMode = function() {
  document.getElementById('vsMode').classList.remove('hidden');
};

// 2人対戦モード開始（キャラ2体生成して直接バトル画面へ）
window.startVsMode = function() {
  const n1 = document.getElementById('vsName1').value || 'VS1';
  const n2 = document.getElementById('vsName2').value || 'VS2';
  const tmpChar = makeCharacter(n1);
  player = {
    ...tmpChar,
  growthBonus: tmpChar.growthBonus || { attack: 0, defense: 0, speed: 0, maxHp: 0 }
};
try {
} catch (e) {
}
enemy = makeCharacter(n2);
//alert("[A008] enemy 初期ステータス = " + JSON.stringify(enemy.baseStats));
//alert("[A008] enemy 初期ステータス = " + JSON.stringify(enemy.baseStats));
document.getElementById('titleScreen').classList.add('hidden');
document.getElementById('gameScreen').classList.remove('hidden');
document.getElementById("battleArea").classList.add("hidden");
updateStats();
};

// スキル効果を適用（カテゴリ別に処理）

window.getSkillEffect = function(skill, user, target, log) {
  if (skill.sealed) {
    log.push(`${displayName(user.name)}のスキル「${skill.name}」は封印されているため発動できない`);
    return;
  }
  let statusLogged = false;
  let totalDamage = 0;
  skill.uses = (skill.uses || 0) + 1;
  const skillData = skillPool.find(sk => sk.name === skill.name);
  if (!skillData) return;
	
	skill.level = (typeof skill.level === 'number' && !isNaN(skill.level)) ? skill.level : 1;
	
  switch (skillData.category) {
case 'multi': {
    let baseDmg = Math.max(0, user.attack);
    const baseHits = skillData.baseHits || 1;
    let hits = baseHits;
    if (skillData.extraHits && skill.level >= (skillData.extraHitsTriggerLevel || 9999)) {
        hits += skillData.extraHits;
    }

    const growthBonus = skillData.multiGrowthFactor || 0;
    const growthPower = 1 + (skill.level / 1000) * growthBonus;
    let totalDmg = baseDmg * (1 + hits * 0.2) * growthPower;

    const barrierEff = target.effects.find(e => e.type === 'barrier');
    if (barrierEff) {
        totalDmg = Math.max(0, Math.floor(totalDmg * (1 - barrierEff.reduction)));
    }

    const splitBaseDmg = Math.floor(totalDmg / hits);
    let remaining = totalDmg - splitBaseDmg * hits;

    const baseAccuracy = Math.max(0.5, 0.95 - (hits - 1) * 0.05);

    const critMax = skillData.criticalRateMax || 0; // 例：0.3（最大30%）
    const critRate = critMax * (1 - Math.exp(-skill.level / 600));

    for (let i = 0; i < hits; i++) {
        if (Math.random() < baseAccuracy) {
            const randFactor = 0.7 + Math.random() * 0.6;
            let rawHitDmg = splitBaseDmg * randFactor;

            const isCrit = Math.random() < critRate;

            let hitDmg = isCrit
                ? Math.floor(rawHitDmg) // クリティカル時、防御無視
                : Math.max(0, Math.floor(rawHitDmg - target.defense / 2));

            if (remaining > 0) {
                hitDmg += 1;
                remaining -= 1;
            }

            target.hp -= hitDmg;
            totalDamage += hitDmg;

            const critText = isCrit ? '（クリティカル！）' : '';
            log.push(`${displayName(user.name)}の${skill.name}：${hitDmg}ダメージ ${critText} (${i + 1}回目)`);
        } else {
            log.push(`${displayName(user.name)}の${skill.name}：攻撃を外した (${i + 1}回目)`);
        }
    }
    break;
}
case 'poison': {
  const base = skillData.power + skill.level * skillData.levelFactor;

  const atkFactor = (skillData.atkFactorBase || 0) + 
    ((skillData.atkFactorMax || 0) - (skillData.atkFactorBase || 0)) * (skill.level / 999);

  const atkBonus = user.attack * atkFactor;
  const firstTurnDmg = base + atkBonus;

  const growthRate = skillData.growthRate || 1.0;
  const duration = skillData.duration;
  const damagePerTurn = [];

  let dmg = firstTurnDmg;
  for (let t = 0; t < duration; t++) {
    damagePerTurn.push(Math.floor(dmg));
    dmg *= growthRate;
  }

  target.effects.push({
    type: '毒',
    damageSequence: damagePerTurn,
    turnIndex: 0,
    remaining: duration
  });

  log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}に毒（ATK補正あり、初期${Math.floor(firstTurnDmg)}×${duration}ターン）`);
  break;
}
case 'burn': {
  const base = skillData.power + skill.level * skillData.levelFactor;

  const atkFactor = (skillData.atkFactorBase || 0) + 
    ((skillData.atkFactorMax || 0) - (skillData.atkFactorBase || 0)) * (skill.level / 999);

  const atkBonus = user.attack * atkFactor;
  const dmg = Math.floor(base + atkBonus);

  target.effects.push({ type: '火傷', damage: dmg, remaining: skillData.duration });

  log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}に火傷（${dmg}×${skillData.duration}ターン）`);
  break;
}
    case 'lifesteal': {
      let dmg = Math.max(0, user.attack - target.defense / 2);
      const barrierEff = target.effects.find(e => e.type === 'barrier');
      if (barrierEff) {
        dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
      }
      target.hp -= dmg;
      totalDamage += dmg;
      const heal = Math.floor(dmg * (0.2 + 0.001 * skill.level));
      user.hp = Math.min(user.maxHp, user.hp + heal);
      log.push(`${displayName(user.name)}の${skill.name}：${dmg}ダメージ & ${heal}回復`);
      break;
    }
case 'skillSeal':
case 'seal': {
  const candidates = target.skills.filter(sk => !sk.sealed);
  const shuffled = candidates.sort(() => 0.5 - Math.random());

  const sealCount = Math.min(skillData.sealCount ?? 99, shuffled.length);
  const sealChance = skillData.sealChance ?? 1.0;
  const sealDuration = skillData.duration ?? 1;

  let sealed = 0;
  for (let i = 0; i < sealCount; i++) {
    if (Math.random() < sealChance) {
      shuffled[i].sealed = true;
      shuffled[i].sealRemaining = sealDuration;
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}のスキル「${shuffled[i].name}」を${sealDuration}ターン封印！`);
      sealed++;
    }
  }
  if (sealed === 0) {
    log.push(`${displayName(user.name)}の${skill.name}：しかし封印に失敗した！`);
  }
  break;
    }
    case 'barrier': {
      user.effects.push({ type: 'barrier', reduction: skillData.reduction, remaining: (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1) });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターンダメージ軽減バリア展開`);
      break;
    }
case 'regen': {
  const baseHeal = skillData.amount + skillData.levelFactor * skill.level;
  const atkFactor = skillData.atkFactor || 0; // skills.jsに記載（例: 0.02）
  const atkBonus = user.attack * atkFactor;
  const healPerTurn = Math.floor(baseHeal + atkBonus);

  user.effects.push({ type: 'regen', heal: healPerTurn, atkFactor: atkFactor, remaining: skillData.duration });

  log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターン毎ターン${healPerTurn}HP回復（ATK補正含む）`);
  break;
}
    case 'reflect': {
      user.effects.push({ type: 'reflect', percent: skillData.reflectPercent, remaining: (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1) });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターンダメージ反射状態`);
      break;
    }
    case 'evasion': {
      user.effects.push({ type: 'evasion', chance: skillData.evasionChance, remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターン回避率上昇`);
      break;
    }
case 'buff': {
  const bonusTurns = getLevelTurnBonus(skill.level || 1);
  const duration = (skillData.duration || 1) + bonusTurns;
  const baseFactor = skillData.factor || 1.5;
  const factor = baseFactor + (skill.level || 1) * 0.0005; // レベルに応じて上昇

  skillData.targetStats.forEach(stat => {
    const existing = user.effects.find(e => e.type === 'buff' && e.stat === stat);
    if (existing) {
      user[stat] = existing.original;
      user.effects = user.effects.filter(e => e !== existing);
    }
    const original = user[stat];
    user[stat] = Math.floor(user[stat] * factor);
    user.effects.push({ type: 'buff', stat: stat, original: original, remaining: duration });
  });
  log.push(`${displayName(user.name)}の${skill.name}：${duration}ターン ${factor.toFixed(2)}倍 強化！`);
  break;
}
case 'debuff': {
  const bonusTurns = getLevelTurnBonus(skill.level || 1);
  const duration = (skillData.duration || 1) + bonusTurns;
  const baseFactor = skillData.factor || 0.5;
  const factor = Math.max(0.1, baseFactor - (skill.level || 1) * 0.0003); // 下限を0.1に制限

  skillData.targetStats.forEach(stat => {
    const existing = user.effects.find(e => e.type === 'debuff' && e.stat === stat);
    if (existing) {
      user[stat] = existing.original;
      user.effects = user.effects.filter(e => e !== existing);
    }
    const original = user[stat];
    user[stat] = Math.floor(user[stat] * factor);
    user.effects.push({ type: 'debuff', stat: stat, original: original, remaining: duration });
  });
  log.push(`${displayName(user.name)}の${skill.name}：${duration}ターン ${factor.toFixed(2)}倍 弱体！`);
  break;
}
case 'buffExtension': {
  const bonusTurns = getLevelTurnBonus(skill.level || 1);
  const extendTurns = (skillData.extendTurns || 1) + bonusTurns;
  let extended = false;
  user.effects.forEach(e => {
    if (e.type === 'buff' || e.type === 'berserk') {
      e.remaining += extendTurns;
      extended = true;
    }
  });
  if (extended) {
    log.push(`${displayName(user.name)}の${skill.name}：強化効果延長+${extendTurns}ターン`);
  } else {
    log.push(`${displayName(user.name)}の${skill.name}：効果なし`);
  }
  break;
}
case 'debuffExtension': {
  const bonusTurns = getLevelTurnBonus(skill.level || 1);
  const extendTurns = (skillData.extendTurns || 1) + bonusTurns;
  let extended = false;
  user.effects.forEach(e => {
    if (e.type === 'debuff') {
      e.remaining += extendTurns;
      extended = true;
    }
  });
  if (extended) {
    log.push(`${displayName(user.name)}の${skill.name}：弱体効果延長+${extendTurns}ターン`);
  } else {
    log.push(`${displayName(user.name)}の${skill.name}：効果なし`);
  }
  break;
}
    case 'heal': {
      const healAmount = Math.floor(user.maxHp * (skillData.healRatio + skillData.levelFactor * skill.level));
      user.hp = Math.min(user.maxHp, user.hp + healAmount);
      log.push(`${displayName(user.name)}の${skill.name}：${healAmount}HP回復`);
      break;
    }
    case 'damage': {
      const effectiveDef = target.defense * (1 - skillData.ignoreDefense);
      let dmg = Math.max(0, Math.floor(user.attack * skillData.multiplier - effectiveDef / 2));
      const barrierEff = target.effects.find(e => e.type === 'barrier');
      if (barrierEff) {
        dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
      }
      target.hp -= dmg;
      totalDamage += dmg;
      log.push(`${displayName(user.name)}の${skill.name}：${dmg}ダメージ`);
      break;
    }
case 'stun': {
  const stunChance = skillData.stunChance ?? 1.0; // デフォルトは100%
  if (Math.random() < stunChance) {
    target.effects.push({ type: 'stun', remaining: (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1) });
    log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}を${skillData.duration}ターン行動不能にした`);
  } else {
    log.push(`${displayName(user.name)}の${skill.name}：しかし行動不能にできなかった`);
  }
  break;

    }
case 'berserk': {
  const bonusTurns = getLevelTurnBonus(skill.level || 1);
  const duration = (skillData.duration || 1) + bonusTurns;

  const attackFactor = 2.0 + (skill.level || 1) * 0.0005;
  const defenseFactor = Math.max(0.1, 0.5 - (skill.level || 1) * 0.0002);

  // 既存のbuff/debuffと同じ方式で、元の値を保存
  const originalAttack = user.attack;
  const originalDefense = user.defense;

  user.attack = Math.floor(user.attack * attackFactor);
  user.defense = Math.floor(user.defense * defenseFactor);

  user.effects.push({ type: 'buff', stat: 'attack', original: originalAttack, remaining: duration });
  user.effects.push({ type: 'debuff', stat: 'defense', original: originalDefense, remaining: duration });

  log.push(`${displayName(user.name)}の${skill.name}：${duration}ターン 攻撃${attackFactor.toFixed(2)}倍 / 防御${defenseFactor.toFixed(2)}倍`);
  break;
}
}
  // ダメージ実績を記録
  user.battleStats[skill.name] = (user.battleStats[skill.name] || 0) + totalDamage;
};

// バトル開始処理（1戦ごと）
window.startBattle = function() {
  
	  if (window.specialMode === 'brutal') {
    skillSimulCount = 1; // 鬼畜モードでは強制的に1に固定
}
	

document.getElementById("battleArea").classList.remove("hidden");
  document.getElementById("battleLog").classList.remove("hidden");
	

if (player.itemMemory) {
  player.itemMemory.forEach(item => {
    item.remainingUses = (item.usesPerBattle === Infinity) ? Infinity : item.usesPerBattle;
  });
}
	drawSkillMemoryList();
  drawItemMemoryList();
	
  window.eventTriggered = false;
  
  const customAlertVisible = document.getElementById('eventPopup').style.display === 'block';
	
  if (customAlertVisible && isWaitingGrowth) {
    alert('ステータス上昇を選んでください！');
    return;
  }

  const name = document.getElementById('inputStr').value || 'あなた';
  if (!player || (!isLoadedFromSave && displayName(player.name) !== name)) {
    const tmpChar = makeCharacter(name);
    player = {
      ...tmpChar,
    growthBonus: tmpChar.growthBonus || { attack: 0, defense: 0, speed: 0, maxHp: 0 },
		itemMemory: []
  };
  
	if (!player.itemMemory) {
    player.itemMemory = [];
}
	
  try {
  } catch (e) {
  }}

  // 初期スキル＋sslotスキルをリスト化
  {
    const entries = Object.entries(player.skillMemory);
    const firstThree = entries.slice(0, 3);
    const lastX = (sslot > 0) ? entries.slice(-sslot) : []; // ★ここで条件分岐！

// ★修正後（passive を除外）
window.initialAndSlotSkills = [
  ...firstThree.map(e => e[0]).filter(name => {
    const def = skillPool.find(s => s.name === name);
    return def?.category !== 'passive';
  }),
  ...lastX.map(e => e[0]).filter(name => {
    const def = skillPool.find(s => s.name === name);
    return def?.category !== 'passive';
  })
];
  }
drawSkillMemoryList();
drawItemMemoryList();
  player.effects = [];

// 敵を生成（攻撃スキルが必ず1つ以上あるようにする）
do {
    enemy = makeCharacter('敵' + Math.random());
} while (!hasOffensiveSkill(enemy));

// 元の名前から安全なカタカナ部分を抽出
const originalKanaName = displayName(enemy.name).replace(/[^アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン]/g, '');

const specialSkillThreshold = 999;
const maxSpecialSkillLevel = 3000;
const statMultiplierMin = 0.8;
const statMultiplierMax = 1.2;
const specialChance = window.getSpecialChance();

let hasSpecialSkill = false;
let specialSkillName = '';

// スキルレベル調整＆特殊スキル判定
enemy.skills.forEach(skill => {
    if (!hasSpecialSkill && Math.random() < specialChance) {
        // 特殊スキル枠（1つだけ高い特別スキル）
        const randHigh = Math.random();
        const specialLevel = specialSkillThreshold + Math.floor(
            (maxSpecialSkillLevel - specialSkillThreshold) * Math.pow(randHigh, 5)
        );
        skill.level = specialLevel;
        specialSkillName = skill.name;
        hasSpecialSkill = true;
    } else {
        // その他スキル：連勝数に応じてスキルレベルの上限を調整
const streakFactor = currentStreak / 100;
const growthPower = 0.6;
const maxPossibleLevel = Math.floor(1000 + 2000 * Math.pow(streakFactor, growthPower));

        const rand = Math.random();
        const level = 1 + Math.floor((maxPossibleLevel - 1) * Math.pow(rand, 3));  // 高レベルほど低確率
        skill.level = level;
    }
});

// 名前修正
if (hasSpecialSkill) {
    enemy.name = `${specialSkillName}${originalKanaName}`;
} else {
    enemy.name = originalKanaName;
}

// ステータス調整
if (hasSpecialSkill) {
    const atk = Math.floor(player.attack * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
    const def = Math.floor(player.defense * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
    const spd = Math.floor(player.speed * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
    const hpMax = Math.floor(player.maxHp * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));

    // baseStatsも更新（getEffectiveStat参照用）
    enemy.baseStats.attack = atk;
    enemy.baseStats.defense = def;
    enemy.baseStats.speed = spd;
    enemy.baseStats.maxHp = hpMax;

    enemy.attack = atk;
    enemy.defense = def;
    enemy.speed = spd;
    enemy.maxHp = hpMax;
    enemy.hp = hpMax;

} else {
    if (currentStreak > 0) {
        const factor = Math.pow(1.1, currentStreak);
        enemy.attack = Math.floor(getEffectiveStat(enemy, 'attack') * factor);
        enemy.defense = Math.floor(getEffectiveStat(enemy, 'defense') * factor);
        enemy.speed = Math.floor(getEffectiveStat(enemy, 'speed') * factor);
        enemy.maxHp = Math.floor(enemy.maxHp * factor);
        enemy.hp = enemy.maxHp;
    }
}
	



  // 前回の効果をクリア
  player.effects = [];
  enemy.effects = [];
  updateStats();
	
	
	  // 戦闘後に baseStats + growthBonus に再初期化
  if (player.baseStats && player.growthBonus) {
    player.attack = player.baseStats.attack + player.growthBonus.attack;
    player.defense = player.baseStats.defense + player.growthBonus.defense;
    player.speed = player.baseStats.speed + player.growthBonus.speed;
    player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
    player.hp = player.maxHp;
  }
	
  const log = [];

  applyPassiveSeals(player, enemy, log);	
	
const factor = Math.pow(1.1, currentStreak);
if (window.specialMode === 'brutal') {
    log.push(`[鬼畜モード挑戦中（勝利時連勝数5増加）]`);
} else {
    log.push(`敵のステータス倍率: ${(enemy.rarity * factor).toFixed(2)}倍（基礎倍率 ${enemy.rarity.toFixed(2)} × 1.10^${currentStreak}）`);
}
  let turn = 1;
  const MAX_TURNS = 30;
  hpHistory = [];
  //player.hp = player.maxHp;
  enemy.hp = enemy.maxHp;
  player.battleStats = {};
  enemy.battleStats = {};
  // ターン制バトル開始
	
  while (turn <= MAX_TURNS && player.hp > 0 && enemy.hp > 0) {
    log.push(`\n-- ${turn}ターン --`);
		
	  if (turn === 1) {
     applyPassiveSeals(player, enemy, log);
     }
		updateSealedSkills(player);
    updateSealedSkills(enemy);
		
    recordHP();

		
    // 継続効果の処理（毒・火傷・再生など）
    [player, enemy].forEach(ch => {
// 各効果を処理
for (let eff of ch.effects) {
  if (eff.remaining > 0) {
    if (eff.type === '毒') {
      let dmg = eff.damage;

      // 成長型毒（growthRateあり）の場合
      if (eff.damageSequence) {
        dmg = eff.damageSequence[eff.turnIndex] || eff.damageSequence.at(-1);
        eff.turnIndex++;
      }

      ch.hp -= dmg;
      log.push(`${displayName(ch.name)}は毒で${dmg}ダメージ`);
      ch.battleStats['毒'] = (ch.battleStats['毒'] || 0) + dmg;

    } else if (eff.type === '火傷') {
      ch.hp -= eff.damage;
      log.push(`${displayName(ch.name)}は火傷で${eff.damage}ダメージ`);
      ch.battleStats['火傷'] = (ch.battleStats['火傷'] || 0) + eff.damage;

    } else if (eff.type === 'regen') {
      const heal = Math.min(ch.maxHp - ch.hp, eff.heal);
      ch.hp += heal;
      if (heal > 0) log.push(`${displayName(ch.name)}は再生効果で${heal}HP回復`);
    }
		
    // ターン経過
    eff.remaining--;
if (window.isFirstBattle) {
  showConfirmationPopup(
    `<div style="text-align:center">
      <img src="ghost.png" alt="Wizard" style="width:100px; height:auto; margin-bottom: 10px;"><br>
      作ったキャラクターが戦闘をしたよ。戦闘ログを確認してみよう。
    </div>`,
    () => {
      window.isFirstBattle = false;
    }
  );
}}
  }
      // 効果残りターンが0になったものを除去＆ステータス戻す
      ch.effects = ch.effects.filter(eff => {
        if (eff.remaining <= 0) {
          if (eff.type === 'buff') {
            ch[eff.stat] = eff.original;
          } else if (eff.type === 'debuff') {
            ch[eff.stat] = eff.original;
          } else if (eff.type === 'berserk') {
            ch.attack = eff.originalAttack;
            ch.defense = eff.originalDefense;
          }
          return false;
        }
        return true;
      });
    });
    // 行動順決定（SPDの高い順）
    const order = [player, enemy].sort((a, b) => b.speed - a.speed);
    for (const actor of order) {
      var target = enemy;
      if (actor === player) target = enemy;
      else target = player;
      if (actor.hp <= 0) continue;
      // 麻痺（行動不能）の確認
      if (actor.effects.some(e => e.type === 'stun')) {
        log.push(`${displayName(actor.name)}は麻痺して動けない！`);
        continue;
      }
      const sealed = actor.effects.some(e => e.type === 'seal');
      let useSkill = !sealed && actor.skills.length > 0;
			let chosenSkills = [];
      if (useSkill) {
        // スキルを複数同時発動（skillSimulCount分）

        useSkill = !sealed && actor.skills.length > 0;
        if (useSkill) {
          chosenSkills = decideSkillsToUse(actor, skillSimulCount);

          // chosenSkills を順番に使う処理
        }

        for (const sk of chosenSkills) {
          // 回避判定
          const evasionEff = target.effects.find(e => e.type === 'evasion');
          if (evasionEff && Math.random() < evasionEff.chance) {
            log.push(`${displayName(target.name)}は${sk.name}を回避した！`);
            continue;
          }
          getSkillEffect(sk, actor, target, log);
          // ダメージ反射判定
          const reflectEff = target.effects.find(e => e.type === 'reflect');
          if (reflectEff) {
            const reflectDmg = Math.floor((actor.battleStats[sk.name] || 0) * reflectEff.percent);
            if (reflectDmg > 0) {
              actor.hp -= reflectDmg;
              log.push(`${displayName(target.name)}の反射：${displayName(actor.name)}に${reflectDmg}ダメージ`);
              target.battleStats['反射'] = (target.battleStats['反射'] || 0) + reflectDmg;
            }
          }
        }
				
				
				// プレイヤーのアイテムメモリー発動
// プレイヤーのアイテムメモリー発動（1ターンに1度のみ）
let triggeredItemsThisTurn = new Set();

for (let i = player.itemMemory.length - 1; i >= 0; i--) {
  const item = player.itemMemory[i];

  if (item.remainingUses <= 0) continue;
  if (Math.random() >= item.activationRate) continue;

  const skill = skillPool.find(sk => sk.name === item.skillName && sk.category !== 'passive');
  if (!skill) continue;

  log.push(`>>> アイテム「${item.color}${item.adjective}${item.noun}」が ${item.skillName} を発動！`);

  // スキル名をユニーク化（競合防止）
  const skillClone = {
    ...skill,
    level: item.skillLevel || 1,
    name: `${item.skillName}_${item.color}_${item.noun}_${i}`
  };

  getSkillEffect(skillClone, player, enemy, log);

  if (item.skillLevel < 3000 && Math.random() < 0.5) {
    item.skillLevel++;
    log.push(`>>> アイテムの ${item.skillName} が Lv${item.skillLevel} に成長！`);
    drawItemMemoryList();
  }

  if (item.remainingUses !== Infinity) {
    item.remainingUses--;
  }

  if (Math.random() < item.breakChance) {
    log.push(`>>> アイテム「${item.color}${item.adjective}${item.noun}」は壊れた！`);
    player.itemMemory.splice(i, 1);
    drawItemMemoryList();
  }
}
				
      } else {
        // 通常攻撃
        // 回避判定
        const evasionEff = target.effects.find(e => e.type === 'evasion');
        if (evasionEff && Math.random() < evasionEff.chance) {
          log.push(`${displayName(target.name)}は攻撃を回避した！`);
        } else {
          // バリアダメージ軽減適用
          let dmg = Math.max(0, (actor.attack - target.defense / 2)*0.5);
          const barrierEff = target.effects.find(e => e.type === 'barrier');
          if (barrierEff) {
            dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
          }
          target.hp -= dmg;
          log.push(`${displayName(actor.name)}の通常攻撃：${dmg}ダメージ`);
          actor.battleStats['通常攻撃'] = (actor.battleStats['通常攻撃'] || 0) + dmg;
          // ダメージ反射判定
          const reflectEff = target.effects.find(e => e.type === 'reflect');
          if (reflectEff) {
            const reflectDmg = Math.floor(dmg * reflectEff.percent);
            if (reflectDmg > 0) {
              actor.hp -= reflectDmg;
              log.push(`${displayName(target.name)}の反射：${displayName(actor.name)}に${reflectDmg}ダメージ`);
              target.battleStats['反射'] = (target.battleStats['反射'] || 0) + reflectDmg;
            }
          }
        }
      }
    }
		
		
const safeRatio = (hp, maxHp) => {
  if (maxHp <= 0) return 0;
  const raw = hp / maxHp;
  return Math.max(0, Math.min(1, raw));
};

const playerRatio = Math.ceil(safeRatio(player.hp, player.maxHp) * 10);
const enemyRatio = Math.ceil(safeRatio(enemy.hp, enemy.maxHp) * 10);

const bar = (filled, total = 10) => {
  const safeFilled = Math.max(0, Math.min(total, filled));
  const filledPart = "■".repeat(safeFilled);
  const emptyPart = "□".repeat(total - safeFilled);
  return filledPart + emptyPart;
};

log.push(`自:[${bar(playerRatio)}] ${Math.ceil(safeRatio(player.hp, player.maxHp) * 100)}%`);
log.push(`敵:[${bar(enemyRatio)}] ${Math.ceil(safeRatio(enemy.hp, enemy.maxHp) * 100)}%`);
		
    turn++;
  }
  const playerWon = player.hp > 0 && (enemy.hp <= 0 || player.hp > enemy.hp);
  recordHP();


  streakBonus = 1 + currentStreak * 0.01;
  const effectiveRarity = enemy.rarity * streakBonus;
	
let baseRate = 0.1;
if (window.specialMode === 'brutal') {
    baseRate = 0.00003; // 鬼畜モードでは基礎確率を低下
}
const streakFactor = Math.pow(0.06, currentStreak / 100);
const rawFinalRate = baseRate * streakFactor;
const minGuaranteedRate = 0.005;
const finalRate = Math.max(rawFinalRate, minGuaranteedRate);

if (playerWon && Math.random() < finalRate && !window.isFirstBattle) {

showEventOptions("成長選択", [
  { label: "攻撃を上げる", value: 'attack' },
  { label: "防御を上げる", value: 'defense' },
  { label: "速度を上げる", value: 'speed' },
  { label: "HPを上げる", value: 'maxHp' },
  { label: `今回は選ばない（次回成長値x${Math.min(window.growthMultiplier * 2, 256)}）`, value: 'skip' }
], (chosen) => {
  if (chosen === 'skip') {
    window.skipGrowth();
  } else {
    window.chooseGrowth(chosen);
  }

  const logEl = document.getElementById('battleLog');
  logEl.textContent += `\n（連勝数が上がるほど、成長確率は低下します）\n`;
});
  } else if (playerWon) {
    const logEl = document.getElementById('battleLog');
    logEl.textContent += `\n今回は成長なし（確率 ${(effectiveRarity * 0.03 * 100).toFixed(2)}%）\n`;
  }

  player.tempEffects = { attackMod: 1.0, defenseMod: 1.0, speedMod: 1.0 };

  if (playerWon) {
    if (window.specialMode === 'brutal') {
        currentStreak += 5;
				
				maybeGainItemMemory();
				
    } else {
        currentStreak += 1;
    }

  let victoryMessage = `勝利：${displayName(enemy.name)}に勝利<br>現在連勝数：${currentStreak}`;
  if (window.growthMultiplier !== 1) {
    victoryMessage += `<br>現在の成長倍率：x${window.growthMultiplier}`;
  }

showCustomAlert(victoryMessage, 800);

    log.push(`\n勝者：${displayName(player.name)}\n連勝数：${currentStreak}`);
		saveBattleLog(log);
		
    // 戦闘終了時に残る強化・弱体を解除
    player.effects.forEach(eff => {
      if (eff.type === 'buff') player[eff.stat] = eff.original;
      if (eff.type === 'debuff') player[eff.stat] = eff.original;
    if (eff.type === 'berserk') { player.attack = eff.originalAttack; player.defense = eff.originalDefense; }
  });
  player.effects = [];

  // スキル熟練度チェック（5回使用でLvアップ）
// スキル熟練度チェック（5回使用でLvアップ）
player.skills.forEach(sk => {
    const isBeyondCap = sk.level >= 999;

    // レベル999未満なら20%アップ、それ以上なら低確率（例: 1/2500）
    const levelUpChance = isBeyondCap ? 1 / 2500 : 0.2;

    if (Math.random() < levelUpChance) {
        sk.level++;
        player.skillMemory[sk.name] = sk.level;

        log.push(`スキル熟練: ${sk.name} が Lv${sk.level} にアップ！`);
				
drawSkillMemoryList();
drawItemMemoryList();

    }
});

  // 新スキル習得のチャンス
  // 敵のRarityに応じたスキル取得確率
const rarity = enemy.rarity * (1 + currentStreak * 0.01);
let skillGainChance = Math.min(1.0, 0.02 * rarity);
if (window.specialMode === 'brutal') {
    skillGainChance = 0.1;  // 鬼畜モードで2倍にする
}
  log.push(`\n新スキル獲得率（最大5%×Rarity）: ${(skillGainChance * 100).toFixed(1)}%`);
if (Math.random() < skillGainChance) {
    const owned = new Set(player.skills.map(s => s.name));
    const enemyOwned = enemy.skills.filter(s => !owned.has(s.name));
    if (enemyOwned.length > 0) {
        const newSkill = enemyOwned[Math.floor(Math.random() * enemyOwned.length)];
        const savedLv = player.skillMemory[newSkill.name] || 1;
        player.skills.push({ name: newSkill.name, level: savedLv, uses: 0 });
        log.push(`新スキル習得: ${newSkill.name} (Lv${savedLv}) を習得！`);
        showCustomAlert(`新スキル習得: ${newSkill.name} (Lv${savedLv}) を習得！`, 1000, "#a8ffb0", "#000");
        if (!document.getElementById("skillMemoryList").classList.contains("hidden")) {
drawSkillMemoryList();
drawItemMemoryList();
        }
    }
}

  // Rarity倍率ベースで変数を増やす（超低確率）
  const chance = enemy.rarity / 100000;
  if (Math.random() < chance) {
    if (sslot < 8) {
      sslot = (sslot || 0) + 1;
      log.push(`[超低確率]] このキャラのスキルスロットが永久増加！（スキルが先頭からスキルスロット分残ります）現在: ${sslot + 3}`);
      alert(`[超低確率]] このキャラのスキルスロットが永久増加！（スキルが先頭からスキルスロット分残ります）現在: ${sslot + 3}`);
    }
drawSkillMemoryList();
drawItemMemoryList();

}
} else {

  //stopAutoBattle()

let resetMessage = '';
if (window.growthMultiplier !== 1) {
  resetMessage = `<br>成長倍率リセット：→ x1`;
}

showCustomAlert(`敗北：${displayName(enemy.name)}に敗北<br>最終連勝数：${currentStreak}${resetMessage}`, 800, "#ff4d4d", "#fff");

  window.growthMultiplier = 1;
  currentStreak = 0;
	window.skillDeleteUsesLeft = 3;
updateSkillDeleteButton();  // ボタン表示もリセット
  streakBonus = 1;
  log.push(`\n敗北：${displayName(enemy.name)}に敗北\n連勝数：0`);
  saveBattleLog(log);
if (player.baseStats && player.growthBonus) {
  player.attack = player.baseStats.attack + player.growthBonus.attack;
  player.defense = player.baseStats.defense + player.growthBonus.defense;
  player.speed = player.baseStats.speed + player.growthBonus.speed;
  player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;

  // HPは勝利時のみ最大に回復。敗北時は回復しない
  if (playerWon) {
    player.hp = player.maxHp;
  } else {
    player.hp = Math.max(0, player.hp); // 敗北後の残りHPがマイナスなら0に
  }
}

  // スキル記憶更新（最高Lv保持）
  for (const sk of player.skills) {
    player.skillMemory[sk.name] = Math.max(sk.level, player.skillMemory[sk.name] || 1);
  }
  // 初期スキル3つ + 4番目から sslot 個（レベルは引継ぎ）
  const entries = Object.entries(player.skillMemory);
  const firstThree = entries.slice(0, 3);
  const nextX = entries.slice(3, 3 + sslot);

  const unique = new Map();
  for (const [name, level] of [...firstThree, ...nextX]) {
    if (!unique.has(name)) {
      unique.set(name, level);
    }
  }

  const initSkills = Array.from(unique.entries()).map(([name, level]) => ({
    name,
    level,
    uses: 0
  }));
  player.skills = initSkills;
}

document.getElementById('startBattleBtn').addEventListener('click', window.startBattle);

// 最終HP表示
//  log.push(`\n${displayName(player.name)} 残HP: ${player.hp}/${player.maxHp}`);
log.push(`${displayName(enemy.name)} 残HP: ${enemy.hp}/${enemy.maxHp}`);
// ダメージ内訳表示
log.push(`\n${displayName(player.name)} のダメージ内訳`);
for (let key in player.battleStats) {
  log.push(`${key}：${player.battleStats[key]}`);
}

//if (player.hp > player.maxHp) player.hp = player.maxHp;

log.push(`
現在の連勝数: ${currentStreak}`);
const maxStreak = parseInt(localStorage.getItem('maxStreak') || '0');
if (currentStreak > maxStreak) {
  localStorage.setItem('maxStreak', currentStreak);
}
log.push(`最大連勝数: ${Math.max(currentStreak, maxStreak)}`);

maybeTriggerEvent();

document.getElementById('battleLog').textContent = log.join('\n');
drawHPGraph();
updateStats();
drawSkillMemoryList();
drawItemMemoryList();
try {
} catch (error) {
}
};


document.addEventListener('DOMContentLoaded', () => {
	
	const downloadBtn = document.getElementById('downloadLogsBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      window.downloadBattleLogs();
    });
  }

  const startBtn = document.getElementById("startNewGameBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const name = document.getElementById("inputStr").value || "プレイヤー";
      startNewGame(name);
    });
  }

  document.getElementById('loadGameBtn').addEventListener('click', window.loadGame);
  //document.getElementById('showBattleModeBtn').addEventListener('click', window.showBattleMode);
  document.getElementById('startVsModeBtn').addEventListener('click', window.startVsMode);
  document.getElementById('startBattleBtn').addEventListener('click', window.startBattle);

  // スマホ・PC 両対応の連打処理
  const battleBtn = document.getElementById('startBattleBtn');
  let battleInterval;

  function startAutoBattle() {
    isAutoBattle = true;  // ← 長押し中にセット
    if (!battleInterval) {
      battleInterval = setInterval(() => {
        if (isWaitingGrowth) return;
        window.startBattle();
      }, 150); // 連打間隔（ミリ秒）調整可
    }
  }

  function stopAutoBattle() {
    isAutoBattle = false; // ← 長押し終了
    clearInterval(battleInterval);
    battleInterval = null;
		updateStats();  // ボタンを離したときに最新情報を描画
  }
  window.stopAutoBattle = stopAutoBattle;

  // PC向け
  battleBtn.addEventListener("mousedown", startAutoBattle);
  battleBtn.addEventListener("mouseup", stopAutoBattle);
  battleBtn.addEventListener("mouseleave", stopAutoBattle);

  // スマホ向け
  battleBtn.addEventListener("touchstart", startAutoBattle);
  battleBtn.addEventListener("touchend", stopAutoBattle);
  battleBtn.addEventListener("touchcancel", stopAutoBattle);

  document.getElementById('saveCodeBtn').addEventListener('click', window.exportSaveCode);
  //document.getElementById('endGameBtn').addEventListener('click', window.endGame);
document.getElementById('skillSimulCountSelect').addEventListener('change', e => {
  skillSimulCount = parseInt(e.target.value);
});
});




// セーブデータの署名用SHA-256ハッシュ生成
async function generateHash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// セーブデータをコード化してコピー 保存（base64 + SHA-256）
window.exportSaveCode = async function() {
  if (!player) return;
	
	if (player.baseStats && player.growthBonus) {
    player.attack = player.baseStats.attack + player.growthBonus.attack;
    player.defense = player.baseStats.defense + player.growthBonus.defense;
    player.speed = player.baseStats.speed + player.growthBonus.speed;
    player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
    player.hp = player.maxHp;
  }
  const payload = {
    player, currentStreak, sslot,
    growthMultiplier: window.growthMultiplier, // ← 追加
    skillMemoryOrder: Object.entries(player.skillMemory),
		itemMemory: player.itemMemory || [],
    rebirthCount: parseInt(localStorage.getItem('rebirthCount') || '0')
  };
  const raw = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(raw)));
  const hash = await generateHash(b64);
  const code = b64 + '.' + hash;
  const box = document.getElementById('saveCodeBox');
  box.value = code;

  try {
    await navigator.clipboard.writeText(code);
  } catch (e) {
    box.focus(); box.select();
  }

  // ファイル名にキャラ名＋日時を使用
  const charName = displayName(player.name).replace(/[\\/:*?"<>|]/g, '_');
  const now = new Date();
  const timestamp = now.toLocaleString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).replace(/[^\d]/g, '');
  const filename = `${charName}_${timestamp}.txt`;

  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};



// セーブコードの読み込み（入力値から復元）
window.importSaveCode = async function() {
  document.getElementById("skillMemoryList").classList.remove("hidden");
  const input = document.getElementById('saveData').value.trim();

  try {
    const parts = input.split('.');
    if (parts.length !== 2) throw new Error('形式が不正です');
    const [b64, hash] = parts;
    const computed = await generateHash(b64);
    if (computed !== hash) throw new Error('署名不一致');

    let raw = '';
    try {
      raw = decodeURIComponent(escape(atob(b64)));
    } catch (e) {
      throw new Error('デコード失敗');
    }

    const parsed = JSON.parse(raw);
    player = parsed.player;
		
		

    if (!player.growthBonus) {
        player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
    }

		if (!player.itemMemory) {
    player.itemMemory = [];
}
		
    player.itemMemory = parsed.itemMemory || [];

    window.growthMultiplier = parsed.growthMultiplier || 1; // ← 追加

    currentStreak = parsed.currentStreak || 0;
    localStorage.setItem('rebirthCount', (parsed.rebirthCount || 0) + 1);
// 敵を生成（攻撃スキルが必ず1つ以上あるようにする）
do {
    enemy = makeCharacter('敵' + Math.random());
} while (!hasOffensiveSkill(enemy));
    updateStats();

    // タイトル画面をアニメーションで非表示 → ゲーム画面表示
    const title = document.getElementById('titleScreen');
    const game = document.getElementById('gameScreen');
    title.classList.add('fade-out');

    setTimeout(() => {
      title.classList.add('hidden');
      game.classList.remove('hidden');
      game.classList.add('fade-in');
      document.getElementById("battleArea").classList.add("hidden");

      // 表示更新
const streakDisplay = document.getElementById('currentStreakDisplay');
if (streakDisplay) {
  const baseBoost = 1.02;
  const boostMultiplier = Math.pow(baseBoost, currentStreak);
  streakDisplay.textContent = `連勝数：${currentStreak} （補正倍率：約${boostMultiplier.toFixed(2)}倍）`;
}

      const rebirthDisplay = document.getElementById('rebirthCountDisplay');
      if (rebirthDisplay) rebirthDisplay.textContent = '転生回数：' + (localStorage.getItem('rebirthCount') || 0);
			startBattle();
    }, 500);

  } catch (e) {
    // エラー時はアラート（必要に応じて変更可能）
    alert('セーブデータの読み込みに失敗しました：' + e.message);
  }
};

// 「つづきから」ボタン処理（セーブデータ入力から復元）
window.loadGame = async function() {
  // ファイル入力がある場合は読み込む
  isLoadedFromSave = true;
  document.getElementById("skillMemoryList").classList.remove("hidden");
  document.getElementById("skillMemoryContainer").style.display = "block";
  drawSkillMemoryList();
  const fileInput = document.getElementById('saveFileInput');
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async function(e) {
      const content = e.target.result.trim();
      document.getElementById('saveData').value = content;
      await window.importSaveCode();
    };
    reader.readAsText(file);
    return;
  }
  const input = document.getElementById('saveData').value.trim();
  if (!input) {
    return;
  }
  if (input.includes('.')) {
    // 新形式コードの場合
    await window.importSaveCode();
  } else {
    // 旧形式データの場合
    try {
      const parsed = window.decodeBase64(input);
      player = parsed.player;
      if (!player.growthBonus) {
        player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
      }
			
			player.itemMemory = player.itemMemory || [];
			drawItemMemoryList();
			
      currentStreak = parsed.currentStreak || 0;
// 敵を生成（攻撃スキルが必ず1つ以上あるようにする）
do {
    enemy = makeCharacter('敵' + Math.random());
} while (!hasOffensiveSkill(enemy));
      //alert('[A006] [A778] enemy生成: ' + JSON.stringify(enemy?.baseStats));
      updateStats();
      //document.getElementById('titleScreen').classList.add('hidden');
      document.getElementById('gameScreen').classList.remove('hidden');
      document.getElementById("battleArea").classList.add("hidden");
    } catch (e) {
    }
  }
};

// ゲーム終了処理（タイトル画面に戻る）
//window.endGame = function() {
  //  currentStreak = 0;
  //  player = null;
  //  enemy = null;
  //document.getElementById('gameScreen').classList.add('hidden');
  // document.getElementById('titleScreen').classList.remove('hidden');
  //document.getElementById("skillMemoryList").classList.add('hidden');
  //document.getElementById("skillMemoryContainer").classList.add('hidden');
  //};

  document.addEventListener("DOMContentLoaded", function() {
    const btn = document.getElementById("startBattleBtn");
    if (btn) {
      btn.addEventListener("click", function () {
      });
    } else {
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("startNewGameBtn");
    if (btn) {
      btn.addEventListener("click", window.startNewGame);
    } else {
    }
  });
window.makeCharacter = function(name) {
    
	  if (player) {
    player.usedSkillNames = new Set();
}
    if (enemy) {
    enemy.usedSkillNames = new Set();
}
	  const rand = seededRandom(name);
    const multiplier = getRarityMultiplierFromRand(rand);

    const baseStats = {
        attack: Math.floor((80 + Math.floor(rand() * 40)) * multiplier),
        defense: Math.floor((40 + Math.floor(rand() * 30)) * multiplier),
        speed: Math.floor((30 + Math.floor(rand() * 20)) * multiplier),
        maxHp: Math.floor(300 * multiplier)
    };

    let skillCount = 3; // 通常は3個

    if (window.specialMode === 'brutal') {
        // 鬼畜モード時、スキル数を3～8個に（多いほど低確率）
        const probabilities = [0.4, 0.3, 0.15, 0.08, 0.04, 0.02]; // 4,5,6,7,8個の確率
        const randomValue = Math.random();
        let cumulative = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (randomValue < cumulative) {
                skillCount = 4 + i;
                break;
            }
        }
    }

    const skills = [];
    const used = new Set();
    const shuffledPool = [...skillPool].sort(() => 0.5 - Math.random());

    for (let i = 0; i < skillCount && i < shuffledPool.length; i++) {
        const s = shuffledPool[i];
        if (!used.has(s.name)) {
            used.add(s.name);
            skills.push({ name: s.name, level: 1, uses: 0 });
        }
    }

    const memory = {};
    for (let sk of skills) memory[sk.name] = sk.level;

    return {
        name,
        baseStats,
        attack: baseStats.attack,
        defense: baseStats.defense,
        speed: baseStats.speed,
        hp: baseStats.maxHp,
        maxHp: baseStats.maxHp,
        rarity: multiplier,
        skills,
        battleStats: {},
        effects: [],
        skillMemory: memory
    };
};

  // ここからイベント関連
	

  // 【選択肢イベントポップアップを表示する】
window.showEventOptions = function(title, options, onSelect) {
	  clearEventPopup();
    const popup = document.getElementById('eventPopup');
    const titleEl = document.getElementById('eventPopupTitle');
    const optionsEl = document.getElementById('eventPopupOptions');

    titleEl.textContent = title;
    optionsEl.innerHTML = '';

		

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.label;
        btn.onclick = () => {
            popup.style.display = 'none';
            onSelect(opt.value);
        };
        optionsEl.appendChild(btn);
    });

    popup.style.display = 'block';
};

  // 【白スキルを選んで削除するポップアップ】
window.showWhiteSkillSelector = function(callback) {
	  clearEventPopup();
    const popup = document.getElementById('eventPopup');
    const titleEl = document.getElementById('eventPopupTitle');
    const optionsEl = document.getElementById('eventPopupOptions');
    const selectContainer = document.getElementById('eventPopupSelectContainer');
    const selectEl = document.getElementById('eventPopupSelect');
    const selectBtn = document.getElementById('eventPopupSelectBtn');

    optionsEl.innerHTML = '';
    selectEl.innerHTML = '';

    const whiteSkills = player.skills.filter(s => {
        const found = skillPool.find(sk => sk.name === s.name);
        if (!found) return false;
        if (window.initialAndSlotSkills && window.initialAndSlotSkills.includes(s.name)) return false;
        if (found.category === 'passive') return false;
        return true;
    });

    if (whiteSkills.length === 0) {
        popup.style.display = 'none';
        showCustomAlert("削除できる白スキルがありません！");
        return;
    }

    whiteSkills.forEach(s => {
        const option = document.createElement('option');
        option.value = s.name;
        option.textContent = `${s.name} Lv${s.level}`;
        selectEl.appendChild(option);
    });

    selectBtn.onclick = () => {
        const selectedName = selectEl.value;
        popup.style.display = 'none';
        callback(selectedName);
    };

    titleEl.textContent = "消す白スキルを選んでください";
    selectContainer.style.display = 'block';

    popup.style.display = 'block';
};
// 【指定したスキル名を削除する】
window.deleteSkillByName = function(skillName) {
    player.skills = player.skills.filter(s => s.name !== skillName);
};

// 【白スキルからランダムに最大3個削除する】
window.deleteRandomWhiteSkills = function(count) {
    const whiteSkills = player.skills.filter(s => {
        const found = skillPool.find(sk => sk.name === s.name);
        if (!found) return false;
        if (window.initialAndSlotSkills && window.initialAndSlotSkills.includes(s.name)) return false;
        if (found.category === 'passive') return false;
        return true;
    });

    const shuffled = whiteSkills.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    selected.forEach(s => {
        deleteSkillByName(s.name);
    });

    return selected.map(s => s.name);
};

window.eventTriggered = false;  // イベント発生フラグを初期化

// 【バトル後にイベント発生を判定して処理する】
window.maybeTriggerEvent = function() {
    if (window.eventTriggered) return;  // すでにイベントが発生していたらスキップ
		    if (window.specialMode === 'brutal') return; 

    const whiteSkills = player.skills.filter(s => {
        const found = skillPool.find(sk => sk.name === s.name);
        if (!found) return false;
        if (window.initialAndSlotSkills && window.initialAndSlotSkills.includes(s.name)) return false;
        if (found.category === 'passive') return false;
        return true;
    });

    if (whiteSkills.length < 3) {
        return; // 白スキルが3個未満なら何も起こさない
    }

    const chance = 0.1; // 10%の確率
    if (Math.random() < chance) {
        window.eventTriggered = true;  // イベント発生を記録
        stopAutoBattle();

        showEventOptions("スキル（初期・パッシブ以外）を削除する？", [
            { label: "スキルから選んで削除", value: "select" },
            { label: "ランダムに3個削除", value: "random" },
            { label: "何もしない", value: "none" }
        ], (choice) => {
            if (choice === "select") {
                showWhiteSkillSelector(selectedName => {
                    
								    if (!selectedName) {
        showCustomAlert("キャンセルしました！", 2000);
        return;  // null のときは何もしない
    }
	deleteSkillByName(selectedName);
                    updateStats();
                    showCustomAlert(`${selectedName} を削除しました！`, 3000);
                });
            } else if (choice === "random") {
                const deleted = deleteRandomWhiteSkills(3);
                updateStats();
                showCustomAlert(`${deleted.join(", ")} を削除しました！`, 3000);
            } else if (choice === "none") {
                showCustomAlert("今回はスキルを削除しませんでした！", 3000);
            }
        });
    }
};

function drawSkillMemoryList() {
  //if (isAutoBattle) return;
  const list = document.getElementById("skillMemoryList");
  if (!list || !player || !player.skillMemory) return;
  list.innerHTML = "";

  const categoryColors = {
    "multi": "#ff4d4d", "poison": "#9933cc", "burn": "#ff6600", "lifesteal": "#66ccff",
    "skillSeal": "#9999ff", "barrier": "#66ff66", "regen": "#66ff99", "reflect": "#ffff66",
    "evasion": "#ff99cc", "buff": "#ffd700", "debuff": "#cc66ff", "heal": "#00ffcc",
    "damage": "#ff3333", "stun": "#ff99cc", "buffExtension": "#00ccff",
    "debuffExtension": "#cc66ff", "berserk": "#ff3333", "passive": "gold", "others": "#cccccc"
  };

  const ownedSkillNames = player.skills.map(sk => sk.name);
  const memoryEntries = Object.entries(player.skillMemory);

  const owned = [];
  const others = [];
  for (const entry of memoryEntries) {
    if (ownedSkillNames.includes(entry[0])) {
      owned.push(entry);
    } else {
      others.push(entry);
    }
  }

  const sortedEntries = [...owned, ...others];

  sortedEntries.forEach(([name, level]) => {
    const li = document.createElement("li");
    const skillDef = skillPool.find(s => s.name === name);
    const category = skillDef?.category || "others";
    const desc = skillDef?.description || "";

    let color = "white";
    if (window.initialAndSlotSkills && window.initialAndSlotSkills.includes(name)) {
      color = "deepskyblue";
    } else if (category === "passive") {
      color = "gold";
    } else {
      color = categoryColors[category] || "white";
    }

    li.innerHTML = `<span style="color:${color}" title="${desc}">${name} Lv${level}</span>`;
    li.setAttribute("data-name", name);
    li.setAttribute("data-level", level);
    li.setAttribute("draggable", "true");

    const isOwnedPassive = player.skills.some(s => s.name === name && category === "passive");
    if (isOwnedPassive) {
      li.classList.add("passive-skill");
    } else if (window.lastChosenSkillNames?.includes(name)) {
      li.classList.add("chosen-skill");
    }

    if (ownedSkillNames.includes(name)) {
      li.classList.add("owned-skill"); // ← 覚えているスキルには背景強調クラス
    }

    li.ondragstart = e => {
      e.dataTransfer.setData("text/plain", name);
    };
    li.ondragover = e => {
      e.preventDefault();
      li.style.border = "2px dashed #888";
    };
    li.ondragleave = () => {
      li.style.border = "";
    };
    li.ondrop = e => {
      e.preventDefault();
      const draggedName = e.dataTransfer.getData("text/plain");
      const items = Array.from(list.children);
      const draggedIndex = items.findIndex(i => i.getAttribute("data-name") === draggedName);
      const targetIndex = items.indexOf(li);

      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        const dragged = items[draggedIndex];
        list.removeChild(dragged);
        if (targetIndex < list.children.length) {
          list.insertBefore(dragged, list.children[targetIndex]);
        } else {
          list.appendChild(dragged);
        }
        updateSkillMemoryOrder();
      }
      li.style.border = "";
    };

    list.appendChild(li);
  });
}

function updateSkillMemoryOrder() {
  const lis = document.querySelectorAll("#skillMemoryList li");
  const newMemory = {};
  lis.forEach(li => {
    const name = li.getAttribute("data-name");
    const level = parseInt(li.getAttribute("data-level"));
    newMemory[name] = level;
  });
  player.skillMemory = newMemory;
}

let hpShineOffset = 0; // アニメーション用オフセット

function drawItemMemoryList() {
    if (!player || !player.itemMemory) return; // ← この行を追加して安全にする

    let draggedIndex = null;
    const list = document.getElementById('itemMemoryList');
    list.innerHTML = '';

    player.itemMemory.forEach((item, index) => {
        const li = document.createElement('li');
if (item.glow) {
  const glowPower = Math.min(item.glow, 5);
  const glowAlpha = Math.min(glowPower / 2.5, 1);  // 最大1.0

  // グロー色
  let glowColor = `rgba(255, 255, 100, ${glowAlpha})`;
  if (glowPower >= 4.5) glowColor = `rgba(255, 100, 255, 1)`; // 最上位：ピンク系に
  else if (glowPower >= 3.5) glowColor = `rgba(0, 255, 255, ${glowAlpha})`; // 高位：水色
  else if (glowPower >= 2.5) glowColor = `rgba(255, 255, 0, ${glowAlpha})`; // 中位：黄

  // box-shadow
  const shadowSize = glowPower * 8;
  li.style.boxShadow = `0 0 ${shadowSize}px ${glowColor}`;

  // border強調（中位以上）
  if (glowPower >= 2.5) {
    li.style.border = `2px solid ${glowColor}`;
    li.style.borderRadius = '6px';
  }

  // 最上位：点滅アニメーション
  if (glowPower >= 4.5) {
    li.style.animation = 'glowFlash 1s infinite alternate';
  }
}
        li.textContent = `${item.color}${item.adjective}${item.noun} (${item.skillName} Lv${item.skillLevel || 1})`;
        li.title = `発動率 ${Math.floor(item.activationRate * 100)}%`;
        li.draggable = true;

        li.addEventListener('dragstart', () => {
            draggedIndex = index;
        });
        li.addEventListener('dragover', e => e.preventDefault());
        li.addEventListener('drop', () => {
            if (draggedIndex === null || draggedIndex === index) return;
            const temp = player.itemMemory[draggedIndex];
            player.itemMemory[draggedIndex] = player.itemMemory[index];
            player.itemMemory[index] = temp;
            drawItemMemoryList();
            draggedIndex = null;
        });

        li.addEventListener('click', () => {
            if (confirm(`${item.color}${item.adjective}${item.noun} を削除しますか？`)) {
                player.itemMemory.splice(index, 1);
                drawItemMemoryList();
            }
        });

        list.appendChild(li);
    });
}

window.drawHPGraph = function () {
  if (isAutoBattle) return;
	const canvas = document.getElementById('hpChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!hpHistory || hpHistory.length < 2) return; // データ不足なら描画しない

  const maxTurns = hpHistory.length;
  const stepX = canvas.width / Math.max(1, (maxTurns - 1));

  // グリッド線
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  for (let i = 0; i < maxTurns; i++) {
    const x = stepX * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // === プレイヤーの塗り（青） ===
  const gradBlue = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradBlue.addColorStop(0, 'rgba(0, 0, 255, 0.4)');
  gradBlue.addColorStop(1, 'rgba(0, 0, 255, 0)');
  ctx.beginPath();
  hpHistory.forEach(([p], i) => {
    const x = stepX * i;
    const y = canvas.height * (1 - p);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.lineTo(stepX * (maxTurns - 1), canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fillStyle = gradBlue;
  ctx.fill();

  // === 敵の塗り（赤） ===
  const gradRed = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradRed.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
  gradRed.addColorStop(1, 'rgba(255, 0, 0, 0)');
  ctx.beginPath();
  hpHistory.forEach(([, e], i) => {
    const x = stepX * i;
    const y = canvas.height * (1 - e);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.lineTo(stepX * (maxTurns - 1), canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fillStyle = gradRed;
  ctx.fill();

  // === アニメーションする光沢 ===
  window.hpShineOffset ??= -100;
  window.hpShineOffset += 2;
  if (window.hpShineOffset > canvas.width) window.hpShineOffset = -100;

  const shineGrad = ctx.createLinearGradient(window.hpShineOffset, 0, window.hpShineOffset + 100, 0);
  shineGrad.addColorStop(0, 'rgba(255,255,255,0)');
  shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // === グロー付き折れ線（プレイヤー） ===
  ctx.shadowColor = 'rgba(0, 0, 255, 0.6)';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 2;
  ctx.beginPath();
  hpHistory.forEach(([p], i) => {
    const x = stepX * i;
    const y = canvas.height * (1 - p);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // === グロー付き折れ線（敵） ===
  ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = 'red';
  ctx.beginPath();
  hpHistory.forEach(([, e], i) => {
    const x = stepX * i;
    const y = canvas.height * (1 - e);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // グロー効果を解除
  ctx.shadowBlur = 0;

  // ラベル
  ctx.fillStyle = 'black';
  ctx.font = '12px sans-serif';
  ctx.fillText('体力変化（自分:青 敵:赤）', 10, 15);
  ctx.fillText("ターン数", canvas.width / 2 - 20, canvas.height - 5);
};

// 修正版 showCustomAlert 関数
window.showCustomAlert = function(message, duration = 3000, background = "#222", color = "#fff") {
    const container = document.getElementById('customAlertContainer');
    const alert = document.createElement('div');

    alert.style.background = background;
    alert.style.color = color;
    alert.style.padding = '12px 20px';
    alert.style.border = '2px solid #fff';
    alert.style.borderRadius = '8px';
    alert.style.fontSize = '12px';
    alert.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s';
    alert.style.position = 'absolute';
    alert.style.top = '0';
    alert.style.left = '50%';
    alert.style.transform = 'translateX(-50%)';
    alert.style.pointerEvents = 'auto';
    alert.style.minWidth = '200px';
    alert.style.maxWidth = '80vw';
    alert.style.textAlign = 'center';
    alert.style.zIndex = '10000';

    alert.innerHTML = message;

    container.appendChild(alert);

    // フェードイン
    setTimeout(() => {
        alert.style.opacity = '1';
    }, 10);

    // フェードアウト＆削除
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
            if (alert.parentElement) {
                container.removeChild(alert);
            }
            // もし container が完全に空なら innerHTML をクリア
            if (container.children.length === 0) {
                container.innerHTML = '';
            }
        }, 300);
    }, duration);
};

// 全戦闘ログ保存用
window.allBattleLogs = [];

// 戦闘後、ログを保存する処理（startBattleの最後に追加するイメージ）
function saveBattleLog(log) {
  window.allBattleLogs.push(log.join('\n'));

  // 100戦を超えたら古いものから削除
  if (window.allBattleLogs.length > 100) {
    window.allBattleLogs.shift();
  }
}

// テキストファイル出力用
window.downloadBattleLogs = function() {
  const separator = '\n\n=============== 戦闘ログ区切り ===============\n\n';
  const text = window.allBattleLogs.join(separator);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const filename = `100_battle_logs_${yyyy}${mm}${dd}_${hh}${min}.txt`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// パッシブスキルによる封印処理
function applyPassiveSeals(attacker, defender, log = []) {
  attacker.skills.forEach(passive => {
    const passiveDef = skillPool.find(s => s.name === passive.name);
    if (!passiveDef || passiveDef.category !== "passive" || passiveDef.effect !== "blockTurnEffects") {
      return;
    }

    const subtype = passiveDef.subtype;
    const finalSealTurns = Math.floor(passive.level / 333) + 1;
    let sealedAny = false;

    defender.skills.forEach(os => {
      const def = skillPool.find(s => s.name === os.name);
      if (!def) return;

      let typeMatch = false;

      // --- ここが修正部分 ---
      if (Array.isArray(subtype)) {
        typeMatch = subtype.includes(def.category);
      } else if (subtype === "poison_burn") {
        typeMatch = def.category === "poison" || def.category === "burn";
      } else {
        typeMatch = def.category === subtype;
      }

      if (typeMatch) {
        os.sealed = true;
        os.sealRemaining = finalSealTurns + 1;
        sealedAny = true;
      }
    });

    if (sealedAny) {
      log.push(`${displayName(attacker.name)}のパッシブスキル「${passive.name}」が発動！（${finalSealTurns}ターン封印）`);
    }
  });
}