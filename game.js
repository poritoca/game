
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

window.updateScoreOverlay = function () {
  const overlay = document.getElementById('scoreOverlay');
  if (!overlay || !window.maxScores) return;

  let html = '';
  let found = false;
  const entries = [100, 200, 500, 1000, 5000, 10000];

  for (const num of entries) {
    const score = window.maxScores[num];
    if (typeof score === 'number' && score > 0) {
      if (!found) {
        html = '最高スコア一覧\n';
        found = true;
      }
      html += `${num}戦: ${score}\n`;
    }
  }

  overlay.textContent = html.trim();

  // 確実に表示/非表示を切り替え（!important的に強制）
  if (found) {
    overlay.style.setProperty('display', 'block', 'important');
  } else {
    overlay.style.setProperty('display', 'none', 'important');
  }
};

window.updateSkillOverlay = function () {
  const el = document.getElementById('skillOverlay');
  if (!el || !player || !Array.isArray(player.skills)) return;

  const lines = player.skills.map(s => `${s.name} Lv${s.level}`);
  if (lines.length === 0) {
    el.style.display = 'none';
  } else {
    el.textContent = `所持スキル一覧\n` + lines.join('\n');
    el.style.display = 'block';
  }
};
window.updateItemOverlay = function () {
  const el = document.getElementById('itemOverlay');
  if (!el || !player || !Array.isArray(player.itemMemory)) return;

  const lines = player.itemMemory.map(i => {
    const name = `${i.color}${i.adjective}${i.noun}`;
    return i.protected ? `${name}（保護）` : name;
  });

  if (lines.length === 0) {
    el.style.display = 'none';
  } else {
    el.textContent = `所持アイテム一覧\n` + lines.join('\n');
    el.style.display = 'block';
  }
};
window.renderUniqueSkillList = function(candidates, chosenSkillName) {
  const toggleBtn = document.getElementById('toggleUniqueSkills');
  const listEl = document.getElementById('uniqueSkillList');
  if (!toggleBtn || !listEl) return;

  // 初回のみクリックイベントを設定
  if (!toggleBtn.hasInit) {
    toggleBtn.addEventListener('click', () => {
      const shown = listEl.style.display !== 'none';
      listEl.style.display = shown ? 'none' : 'block';
      toggleBtn.textContent = (shown ? '▼' : '▲') + ' 固有スキル候補' + (shown ? 'を表示' : 'を隠す');
    });
    toggleBtn.hasInit = true;
  }

  listEl.innerHTML = '';

candidates.forEach(name => {
  const li = document.createElement('li');
  li.textContent = `➤ ${name}`; // オシャレな矢印を追加

  // スタイル：白文字＋太字＋揃ったサイズ
  li.style.fontWeight = 'bold';
  li.style.fontSize = '14px';
  li.style.color = '#fff';

  // カテゴリ別に背景色を分ける（任意）
  const def = window.skillPool?.find(sk => sk.name === name);
  if (def) {
    if (def.category === 'attack') li.style.background = '#ff4d4d';   // 濃赤
    if (def.category === 'support') li.style.background = '#33cc99';  // ミントグリーン
    if (def.category === 'special') li.style.background = '#3399ff';  // 明るめ青
    li.style.padding = '4px 8px';
    li.style.borderRadius = '6px';
    li.style.marginBottom = '5px';
    li.style.display = 'inline-block';
  }

  listEl.appendChild(li);
});
};

window.generateAndRenderUniqueSkillsByName = function(player) {
  if (!player || !player.name || !Array.isArray(skillPool)) return;

  // 名前からシード生成
  let seed = Array.from(player.name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  // 全スキルから3つ選ぶ
  const allSkillNames = skillPool.map(s => s.name);
  const uniqueCandidates = new Set();

  while (uniqueCandidates.size < 3) {
    seed = (seed * 9301 + 49297) % 233280;
    const idx = seed % allSkillNames.length;
    uniqueCandidates.add(allSkillNames[idx]);
  }

  const candidateSkills = Array.from(uniqueCandidates);
  const selectedSkill = candidateSkills[0];

  // ここでレベルキャップ緩和スキルをセット
  window.levelCapExemptSkills = candidateSkills;

  // 表示用にも保存
  window.candidateUniqueSkills = candidateSkills;
  window.uniqueSkillName = selectedSkill;

  // ステータス画面に反映
  renderUniqueSkillList(candidateSkills, selectedSkill);

};

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

window.isFirstBattle = false;

window.levelCapExemptSkills = [];  // スキルレベル制限緩和対象

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
  { word: '結晶', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '石', breakChance: 0.03, dropRateMultiplier: 0.65 },
  { word: '鉱石', breakChance: 0.04, dropRateMultiplier: 0.55 },
  { word: '歯車', breakChance: 0.05, dropRateMultiplier: 0.5 },
  { word: '羽根', breakChance: 0.07, dropRateMultiplier: 0.35 },
  { word: '巻物', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '鏡', breakChance: 0.02, dropRateMultiplier: 0.68 },
  { word: '炎', breakChance: 0.06, dropRateMultiplier: 0.3 },
  { word: '氷塊', breakChance: 0.05, dropRateMultiplier: 0.38 },
  { word: '枝', breakChance: 0.06, dropRateMultiplier: 0.4 },
  { word: '勾玉', breakChance: 0.00001, dropRateMultiplier: 0.2 },
  { word: '仮面', breakChance: 0.04, dropRateMultiplier: 0.5 },
  { word: '珠', breakChance: 0.02, dropRateMultiplier: 0.8 },
  { word: '箱', breakChance: 0.04, dropRateMultiplier: 0.6 },
  { word: '盾', breakChance: 0.000005, dropRateMultiplier: 0.18 },
  { word: '剣', breakChance: 0.000008, dropRateMultiplier: 0.18 },
  { word: '書', breakChance: 0.06, dropRateMultiplier: 0.4 },
  { word: '砂時計', breakChance: 0.07, dropRateMultiplier: 0.35 },
  { word: '宝石', breakChance: 0.0002, dropRateMultiplier: 0.24 },
  { word: '瓶', breakChance: 0.06, dropRateMultiplier: 0.38 },
  { word: '種', breakChance: 0.02, dropRateMultiplier: 0.7 },
  { word: '薬草', breakChance: 0.07, dropRateMultiplier: 0.3 },
  { word: '鉄片', breakChance: 0.05, dropRateMultiplier: 0.45 },
  { word: '骨', breakChance: 0.05, dropRateMultiplier: 0.4 },
  { word: '音叉', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '面', breakChance: 0.02, dropRateMultiplier: 0.75 },
  { word: '鏡石', breakChance: 0.0003, dropRateMultiplier: 0.2 },
  { word: '符', breakChance: 0.03, dropRateMultiplier: 0.65 },
  { word: '灯', breakChance: 0.05, dropRateMultiplier: 0.5 },
  { word: '鐘', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '骨片', breakChance: 0.04, dropRateMultiplier: 0.55 },
  { word: '巻貝', breakChance: 0.06, dropRateMultiplier: 0.25 },
  { word: '球', breakChance: 0.008, dropRateMultiplier: 0.15 },
  { word: '珠玉', breakChance: 0, dropRateMultiplier: 0.05 },
  { word: '護符', breakChance: 0.03, dropRateMultiplier: 0.68 },
  { word: '錫杖', breakChance: 0.03, dropRateMultiplier: 0.6 },
  { word: '光球', breakChance: 0.0000001, dropRateMultiplier: 0.16 }
];

const itemAdjectives = [
  { word: '煤けた', activationRate: 0.1, dropRate: 0.025 },
  { word: '冷たい', activationRate: 0.25, dropRate: 0.01 },
  { word: '重い', activationRate: 0.2, dropRate: 0.008 },
  { word: '鋭い', activationRate: 0.35, dropRate: 0.0016 },
  { word: '輝く', activationRate: 0.38, dropRate: 0.0008 },
  { word: '神秘的な', activationRate: 0.42, dropRate: 0.0005 },
  { word: '伝説の', activationRate: 0.6, dropRate: 0.0002 },
  { word: '超越した', activationRate: 0.8, dropRate: 0.0001 },
  { word: '神の', activationRate: 1.0, dropRate: 0.00001 }
];

window.getSpecialChance = function() {
    return window.specialMode === 'brutal' ? 1.0 : 0.03;
};

window.skillDeleteUsesLeft = 3;  // ゲーム開始時に3回

// UIボタンの処理
window.toggleSpecialMode = function() {
const btn = document.getElementById('specialModeButton');
const battleBtn = document.getElementById('startBattleBtn');

if (window.specialMode === 'normal') {
  window.specialMode = 'brutal';
  btn.textContent = '鬼畜モード（アイテム入手可能性あり）';
  btn.classList.remove('normal-mode');
  btn.classList.add('brutal-mode');
  battleBtn.classList.remove('normal-mode');
  battleBtn.classList.add('brutal-mode');
} else {
  window.specialMode = 'normal';
  btn.textContent = '通常モード';
  btn.classList.remove('brutal-mode');
  btn.classList.add('normal-mode');
  battleBtn.classList.remove('brutal-mode');
  battleBtn.classList.add('normal-mode');
}
};

const skillDeleteButton = document.getElementById('skillDeleteButton');

function rebuildPlayerSkillsFromMemory(player, sslot = 0) {
  // 再構築するスキル枠数（基本3枠 + 追加スロット）
  const totalSlots = 3 + sslot;

  // 1. プレイヤー名に基づく固有スキル候補3つを導出し、その中から1つ選択
  const nameSeed = Array.from(player.name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const allSkillNames = skillPool.map(s => s.name);
  const uniqueCandidates = new Set();
  let seed = nameSeed;
  while (uniqueCandidates.size < 3) {
    seed = (seed * 9301 + 49297) % 233280;
    const idx = seed % allSkillNames.length;
    uniqueCandidates.add(allSkillNames[idx]);
  }
  const candidates = Array.from(uniqueCandidates);
  const uniqueSkillName = candidates[Math.floor(Math.random() * candidates.length)];

  // 2. スキルメモリーから攻撃スキルを1つ選出（固有スキルと重複しない）
  const entries = Object.entries(player.skillMemory);
  const isOffensiveSkill = name => {
    const def = skillPool.find(s => s.name === name);
    return def && window.offensiveSkillCategories.includes(def.category);
  };

  let attackSkillName = null;
  for (const [name] of entries) {
    if (name === uniqueSkillName) continue;
    if (isOffensiveSkill(name)) {
      attackSkillName = name;
      break;
    }
  }

  // 攻撃スキルがなければ、固有スキル以外の1つ目を採用
  if (!attackSkillName) {
    for (const [name] of entries) {
      if (name !== uniqueSkillName) {
        attackSkillName = name;
        break;
      }
    }
  }

  // それでもなければ、固有スキルで代用
  if (!attackSkillName) {
    attackSkillName = uniqueSkillName;
  }

  // 3. 新スキル配列を構築（重複なし）
  const newSkills = [];
  const uniqueLevel = player.skillMemory[uniqueSkillName] || 1;
  newSkills.push({ name: uniqueSkillName, level: uniqueLevel, uses: 0 });

  if (attackSkillName !== uniqueSkillName) {
    const attackLevel = player.skillMemory[attackSkillName] || 1;
    newSkills.push({ name: attackSkillName, level: attackLevel, uses: 0 });
  }

  for (const [name, level] of entries) {
    if (newSkills.length >= totalSlots) break;
    if (name === uniqueSkillName || name === attackSkillName) continue;
    newSkills.push({ name, level, uses: 0 });
  }

  player.skills = newSkills;
}

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
            updatePlayerDisplay(player);
            updateEnemyDisplay(enemy);

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

window.allowGrowthEvent = true;
window.allowSkillDeleteEvent = true;
window.allowItemInterrupt = true;  // ← 新規追加

function showSubtitle(message, duration = 2000) {
  const subtitleEl = document.getElementById('subtitleOverlay');
  if (!subtitleEl) return;

  subtitleEl.innerHTML = message;
  subtitleEl.style.display = 'block';
  subtitleEl.style.opacity = '1';
  subtitleEl.style.transition = 'opacity 0.5s ease'; // 先に設定！

  // フェードアウト（duration 後）
  setTimeout(() => {
    subtitleEl.style.opacity = '0';
    // 完全に消えた後に display を none に戻す
    setTimeout(() => {
      subtitleEl.style.display = 'none';
    }, 500); // フェード時間と一致
  }, duration);
}

function setupToggleButtons() {
  const growthBtn = document.getElementById('toggleGrowthEvents');
  const skillDelBtn = document.getElementById('toggleSkillDeleteEvents');
  const itemBtn = document.getElementById('toggleItemInterrupt');

  function updateButtonState(btn, state, labelOn, labelOff) {
    btn.classList.remove("on", "off");
    btn.classList.add(state ? "on" : "off");
    btn.textContent = state ? labelOn : labelOff;
  }

  growthBtn.onclick = () => {
    window.allowGrowthEvent = !window.allowGrowthEvent;
    updateButtonState(growthBtn, window.allowGrowthEvent, "成長イベント: 発生", "成長イベント: 発生しない");
  };

  skillDelBtn.onclick = () => {
    window.allowSkillDeleteEvent = !window.allowSkillDeleteEvent;
    updateButtonState(skillDelBtn, window.allowSkillDeleteEvent, "スキル削除イベント: 発生", "スキル削除イベント: 発生しない");
  };

  itemBtn.onclick = () => {
    window.allowItemInterrupt = !window.allowItemInterrupt;
    updateButtonState(itemBtn, window.allowItemInterrupt, "アイテム入手: 停止する", "アイテム入手: 停止しない");
  };

  updateButtonState(growthBtn, window.allowGrowthEvent, "成長イベント: 発生", "成長イベント: 発生しない");
  updateButtonState(skillDelBtn, window.allowSkillDeleteEvent, "スキルイベント: 発生", "スキルイベント: 発生しない");
  updateButtonState(itemBtn, window.allowItemInterrupt, "アイテム入手: 停止する", "アイテム入手: 停止しない");
}

document.addEventListener('DOMContentLoaded', setupToggleButtons);

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

function onItemClick(item, index) {
  // まずポップアップを完全に初期化
  clearEventPopup();

  const name = `${item.color}${item.adjective}${item.noun}`;
  const popup = document.getElementById("eventPopup");
  const title = document.getElementById("eventPopupTitle");
  const container = document.getElementById("eventPopupOptions");

  title.innerHTML = `アイテム <b>${name}</b> をどうする？`;

  // 保護 / 保護を外すボタン
  const protectBtn = document.createElement("button");
  protectBtn.textContent = item.protected ? "保護を外す" : "保護する";
  protectBtn.onclick = () => {
    if (!item.protected && player.itemMemory.some(it => it.protected)) {
      showCustomAlert("保護は1つまでです", 2000);
      return;
    }
    item.protected = !item.protected;
    clearEventPopup(); // ボタン動作後にも片付け
    drawItemMemoryList();
  };
  container.appendChild(protectBtn);

  // 削除ボタン（保護中は不可）
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "削除する";
  deleteBtn.onclick = () => {
    if (item.protected) {
      showCustomAlert("このアイテムは保護されています", 2000);
      return;
    }
    player.itemMemory.splice(index, 1);
    clearEventPopup();
    drawItemMemoryList();
  };
  container.appendChild(deleteBtn);

  // キャンセルボタン
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "キャンセル";
  cancelBtn.onclick = () => {
    showCustomAlert("キャンセルしました", 1500);
    clearEventPopup(); // ←キャンセル時にも完全に片付け
  };
  container.appendChild(cancelBtn);

  popup.style.display = "block";
}

function maybeGainItemMemory() {
  if (window.specialMode !== 'brutal') return;
  if (!player || !player.skills || player.skills.length === 0) return;
  if (player.itemMemory.length >= 3) return;

  const allSkills = skillPool.filter(s => s.category !== 'passive');
  const skill = allSkills[Math.floor(Math.random() * allSkills.length)];
  const colorData = itemColors[Math.floor(Math.random() * itemColors.length)];
  const nounData = itemNouns[Math.floor(Math.random() * itemNouns.length)];
  const adjective = pickItemAdjectiveWithNoun(nounData);
  if (!adjective) return;

  // フィルターが1つ以上有効な場合、合致しないアイテムはスキップ
  const anyFiltersEnabled = document.querySelectorAll('.itemFilterCB:checked').length > 0;
  const isItemFilteredOut = !shouldPauseForItem(colorData.word, adjective.word, nounData.word);
  if (anyFiltersEnabled && isItemFilteredOut) return;

  const dropRate = (colorData.dropRateMultiplier || 1) * (adjective.dropRate || 1) * (nounData.dropRateMultiplier || 1);
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
    protected: false,
    glow: glow.toFixed(2)
  };

  player.itemMemory.push(newItem);
  drawItemMemoryList();
const itemName = `${newItem.color}${newItem.adjective}${newItem.noun}`;
let message = `新アイテム入手！ ${itemName}（${newItem.skillName}）`;
updateItemOverlay();

const anyFiltersSet = document.querySelectorAll('.itemFilterCB:checked').length > 0;
const shouldPause = (
  shouldPauseForItem(newItem.color, newItem.adjective, newItem.noun) ||
  (!anyFiltersSet && window.allowItemInterrupt)
);

if (shouldPause) {
  let message = `>>> フィルター条件により停止！`;
  if (!window.battleCount) window.battleCount = 0;
  window.protectItemUntil = window.battleCount + 10;

  setTimeout(() => {
    if (typeof stopAutoBattle === 'function') stopAutoBattle();
    isAutoBattle = false;
  }, 500);

  showSubtitle(message, 4000); // ← showCustomAlert を showSubtitle に変更
}

showCustomAlert(message, 4000, "#ffa", "#000");
}

function setupItemFilters() {
  const colorBox = document.getElementById('filterColorOptions');
  const adjBox = document.getElementById('filterAdjectiveOptions');
  const nounBox = document.getElementById('filterNounOptions');

  const createCheckbox = (value, type) => {
    const label = document.createElement('label');
    label.style.display = 'inline-block';
    label.style.marginRight = '8px';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = value;
    cb.dataset.type = type;
    cb.style.transform = 'scale(0.8)';
    cb.classList.add('itemFilterCB');

    label.appendChild(cb);
    label.appendChild(document.createTextNode(value));
    return label;
  };

  itemColors.forEach(obj => colorBox.appendChild(createCheckbox(obj.word, 'color')));
  itemAdjectives.forEach(obj => adjBox.appendChild(createCheckbox(obj.word, 'adj')));
  itemNouns.forEach(obj => nounBox.appendChild(createCheckbox(obj.word, 'noun')));
}
document.addEventListener('DOMContentLoaded', setupItemFilters);

// フィルターモード: 'and' or 'or'
window.itemFilterMode = 'and';

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('filterModeToggleBtn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      window.itemFilterMode = (window.itemFilterMode === 'and') ? 'or' : 'and';
      toggleBtn.textContent = (window.itemFilterMode === 'and')
        ? '各要素の条件を満たす'
        : 'いずれかの条件を満たす';

      toggleBtn.classList.toggle('and', window.itemFilterMode === 'and');
      toggleBtn.classList.toggle('or', window.itemFilterMode === 'or');
    };

    // 初期状態を設定
    toggleBtn.classList.add('and');
  }
});

function shouldPauseForItem(color, adj, noun) {
  const checked = type => Array.from(document.querySelectorAll(`.itemFilterCB[data-type="${type}"]:checked`)).map(cb => cb.value);
  const colors = checked('color');
  const adjs = checked('adj');
  const nouns = checked('noun');

  if (window.itemFilterMode === 'and') {
    // 各カテゴリにチェックがある場合は、それぞれのカテゴリで一致が必要
    const colorMatch = colors.length === 0 || colors.includes(color);
    const adjMatch = adjs.length === 0 || adjs.includes(adj);
    const nounMatch = nouns.length === 0 || nouns.includes(noun);
    return colorMatch && adjMatch && nounMatch;
  } else {
    // どれか1つでも一致すればOK
    return colors.includes(color) || adjs.includes(adj) || nouns.includes(noun);
  }
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

// RPGシミュレーター メインロジック（日本語UI、スキル100種以上対応）
import { skillPool } from './skills.js';
import { drawCharacterImage } from './drawCharacter.js';

let player = null;
let enemy = null;
let currentStreak = 0;
let sessionMaxStreak = 0;
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

    if (category === 'passive') {
      color = 'gold';
      priority = 1;
    } else {
      color = categoryColors[category] || 'white';
    }

    return {
html: `<span title='${desc}' style="
  color: ${color};
  background: linear-gradient(135deg, rgba(30,30,30,0.95), rgba(10,10,10,0.95));
  padding: 5px 10px;
  margin: 4px;
  border-radius: 8px;
  border: 1px solid ${color};
  display: inline-block;
  font-weight: bold;
  font-size: 13px;
  text-shadow: 0 0 4px ${color}, 0 0 2px #000;
  box-shadow: 0 0 8px rgba(0,0,0,0.6);
">
  ${skillName} Lv${s.level || 1}
</span>`,
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
window.updateStats = function () {
  if (isAutoBattle || !player || !enemy) return;

  player.hp = Math.min(player.hp, player.maxHp);
  enemy.hp = Math.min(enemy.hp, enemy.maxHp);
  player.hp = Math.max(player.hp, 0);
  enemy.hp = Math.max(enemy.hp, 0);

  // プレイヤー表示
  const pStats = formatStats(player);
  const pSkills = formatSkills(player);
  document.getElementById('playerStats').innerHTML = pStats + pSkills;

  // 敵表示
  const eStats = formatStats(enemy);
  const eSkills = formatSkills(enemy);
  document.getElementById('enemyStats').innerHTML = eStats + eSkills;

  // キャラ画像描画
  drawCharacterImage(displayName(player.name), 'playerCanvas');
  drawCharacterImage(displayName(enemy.name), 'enemyCanvas');

  const isPlayer = true;
if (isPlayer) {
  generateAndRenderUniqueSkillsByName(player);
}

};
// 「はじめから」スタート（タイトル画面非表示、ゲーム画面表示）
window.startNewGame = function() {

    // テキストボックスから名前を取得（空ならデフォルト名を使用）
    const playerName = name || document.getElementById('inputStr').value || 'プレイヤー';
    document.getElementById('inputStr').value = playerName;  // 入力欄に最終的な名前を反映

    // 新規ゲーム用に各種ステータスをリセット
if (player) {
  player.skills = [];
	rebuildPlayerSkillsFromMemory(player, typeof sslot === 'number' ? sslot : 0);
  player.effects = [];
  player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
}

if (typeof currentStreak !== "undefined") {
  currentStreak = 0;
}
if (typeof sessionMaxStreak !== "undefined") {
  sessionMaxStreak = 0;
}
if (typeof window.maxStreak !== "undefined") {
  window.maxStreak = 0;
}

// 新しくプレイヤーを作る場合は、上書きする意図があればこのままでOK
window.player = {};            // 新しいプレイヤーオブジェクトを準備
    window.player.itemMemory = [];      // 所持アイテムの記録を初期化
    window.player.effects = [];         // 一時的な効果をリセット
    if ('isLoadedFromSave' in window) {
        window.isLoadedFromSave = false;  // セーブデータからのロードではないことを明示
    }

    // タイトル画面をフェードアウトし、ゲーム画面をフェードイン
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen  = document.getElementById('gameScreen');
    titleScreen.classList.add('fade-out');
    setTimeout(() => {
        titleScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('fade-in');

        // ゲーム画面の初期設定
        statusLogged = false;
        if (!player) player = {};
        if (!player.itemMemory) player.itemMemory = [];
        document.getElementById('battleLog').classList.remove('hidden');
        document.getElementById('battleArea').classList.add('hidden');
        document.getElementById('skillMemoryContainer').style.display = 'block';

        // ★ 戦闘回数選択の読み取りと初期化処理を追加
        const battleBtn = document.getElementById('startBattleBtn');
        if (battleBtn) battleBtn.disabled = false;  // 次の戦闘ボタンを有効化
        const selectEl = document.getElementById('battleCountSelect');
        if (selectEl) {
            const selectedVal = selectEl.value;
            if (selectedVal === "unlimited") {
                // 無制限モードの場合
                window.targetBattles = null;
                window.remainingBattles = null;
                document.getElementById('remainingBattlesDisplay').style.display = 'none';
            } else {
                // 選択された回数を数値に変換して設定
                const countVal = parseInt(selectedVal, 10);
                window.targetBattles = countVal;
                window.remainingBattles = countVal;
                const remainDisplay = document.getElementById('remainingBattlesDisplay');
                if (remainDisplay) {
                    // 画面右上に残り戦闘回数を表示
                    remainDisplay.textContent = `残り戦闘数：${window.remainingBattles}回`;
                    remainDisplay.style.display = 'block';
                }
            }
        }
        // ★ 初期化処理ここまで

        // 初回の戦闘を開始

        updateStats();

        window.startBattle();
    }, 500);
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
updatePlayerDisplay(player);
updateEnemyDisplay(enemy);

};

// スキル効果を適用（カテゴリ別に処理）

window.getSkillEffect = function(skill, user, target, log) {
  if (skill.sealed) {
    log.push(`${displayName(user.name)}のスキル「${skill.name}」は封印されているため発動できない`);
    return;
  }

if (user !== player) {
  let failChance = 0;

  if (currentStreak <= 10) {
    failChance = 0.8;
  } else if (currentStreak <= 30) {
    failChance = 0.55;
  } else if (currentStreak <= 50) {
    failChance = 0.4;
  } else if (currentStreak <= 100) {
    failChance = 0.2;
  } else {
    failChance = 0; // 100連勝を超えたら失敗しない
  }

  if (Math.random() < failChance) {
    log.push(`${displayName(user.name)}のスキル「${skill.name}」は発動失敗した！`);
    return; // 発動処理を中止
  }
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

if (user === player && skill.level < 9999) {
  // 成長確率をスキルレベルに応じて調整
  const baseChance = 0.1; // 最大20%
  const levelFactor = skill.level < 1000 ? 1 : 1000 / skill.level;
  const growChance = baseChance * levelFactor;

  if (Math.random() < growChance) {
    skill.level++;
    log.push(`${displayName(user.name)}のスキル「${skill.name}」が Lv${skill.level} に成長！`);

    if (player.skillMemory && player.skillMemory[skill.name] !== undefined) {
      player.skillMemory[skill.name] = Math.max(skill.level, player.skillMemory[skill.name]);
    }

    // スキルメモリー画面が表示されていれば即時更新
    const skillListVisible = document.getElementById("skillMemoryList");
    if (skillListVisible && !skillListVisible.classList.contains("hidden")) {
      drawSkillMemoryList();
    }
  }
}
  // ダメージ実績を記録
  user.battleStats[skill.name] = (user.battleStats[skill.name] || 0) + totalDamage;
};

function restoreMissingItemUses() {
  if (!player || !player.itemMemory) return;

  for (const item of player.itemMemory) {
    // 色から usesPerBattle を補完
    if (item.usesPerBattle == null) {
      const colorDef = itemColors.find(c => c.word === item.color);
      if (colorDef) {
        item.usesPerBattle = colorDef.usesPerBattle;
      } else {
        console.warn("[警告] 未知の色: " + item.color);
        item.usesPerBattle = 1; // デフォルト値（あくまで安全措置）
      }
    }

    // remainingUses も補完
    if (item.remainingUses == null || item.remainingUses <= 0) {
      item.remainingUses = item.usesPerBattle;
    }
  }
}

// バトル開始処理（1戦ごと）
window.startBattle = function() {

    if (window.specialMode === 'brutal') {
    skillSimulCount = 1; // 鬼畜モードでは強制的に1に固定
}

restoreMissingItemUses();
if (player.itemMemory) {
  player.itemMemory.forEach(item => {
    item.remainingUses = item.usesPerBattle;
  });
}
if (!window.battleCount) window.battleCount = 0;
window.battleCount++;

document.getElementById("battleArea").classList.remove("hidden");
  document.getElementById("battleLog").classList.remove("hidden");

  if (player.itemMemory) {
  player.itemMemory.forEach(item => {
    item.remainingUses = item.usesPerBattle;
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

      window.isFirstBattle = true;

    const tmpChar = makeCharacter(name);
    player = {
      ...tmpChar,
    growthBonus: tmpChar.growthBonus || { attack: 0, defense: 0, speed: 0, maxHp: 0 },
    itemMemory: []
  };

// isFirstBattle かつ 初期スキル情報が未設定のときだけ代入

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
const maxSpecialSkillLevel = 5000;
const statMultiplierMin = 0.8;
const statMultiplierMax = 1.4;
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
// ステータス調整（共通ベースをまず作る）
if (hasSpecialSkill) {
    enemy.name = `${specialSkillName}${originalKanaName}`;
} else {
    enemy.name = originalKanaName;
}

const atk = Math.floor(player.attack * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
const def = Math.floor(player.defense * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
const spd = Math.floor(player.speed * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
const hpMax = Math.floor(player.maxHp * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));

enemy.baseStats.attack = atk;
enemy.baseStats.defense = def;
enemy.baseStats.speed = spd;
enemy.baseStats.maxHp = hpMax;

// まずはそのまま入れておき、あとで補正をかける
enemy.attack = atk;
enemy.defense = def;
enemy.speed = spd;
enemy.maxHp = hpMax;
enemy.hp = hpMax;

// 補正処理（鬼畜モード or 通常モード）
if (window.specialMode === 'brutal') {
    const brutalBonus = 1 + currentStreak * 0.005;  // 1.005, 1.01, ...
    enemy.attack = Math.floor(enemy.attack * brutalBonus);
    enemy.defense = Math.floor(enemy.defense * brutalBonus);
    enemy.speed = Math.floor(enemy.speed * brutalBonus);
    enemy.maxHp = Math.floor(enemy.maxHp * brutalBonus);
    enemy.hp = enemy.maxHp;
} else if (currentStreak > 0) {
    const factor = Math.pow(1.005, currentStreak);
    enemy.attack = Math.floor(enemy.attack * factor);
    enemy.defense = Math.floor(enemy.defense * factor);
    enemy.speed = Math.floor(enemy.speed * factor);
    enemy.maxHp = Math.floor(enemy.maxHp * factor);
    enemy.hp = enemy.maxHp;
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
    log.push(`[鬼畜モード挑戦中]`);
} else {
    log.push(`敵のステータス倍率: ${(enemy.rarity * factor).toFixed(2)}倍（基礎倍率 ${enemy.rarity.toFixed(2)} × 1.005^${currentStreak}）`);
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
  const itemKey = `${item.color}-${item.adjective}-${item.noun}`;

  // このターンで既に発動済みならスキップ
  if (triggeredItemsThisTurn.has(itemKey)) continue;

  if (item.remainingUses <= 0) continue;
  if (Math.random() >= item.activationRate) continue;

  const skill = skillPool.find(sk => sk.name === item.skillName && sk.category !== 'passive');
  if (skill) {
    log.push(`>>> アイテム「${item.color}${item.adjective}${item.noun}」が ${item.skillName} を発動！`);

getSkillEffect({ ...skill, level: item.skillLevel || 1 }, player, enemy, log);

if (item.skillLevel < 3000 && Math.random() < 0.4) {
  item.skillLevel++;
  log.push(`>>> アイテムの ${item.skillName} が Lv${item.skillLevel} に成長！`);
  drawItemMemoryList();
}

    item.remainingUses--;
    triggeredItemsThisTurn.add(itemKey);

const isWithinProtectedPeriod =
  window.protectItemUntil && window.battleCount <= window.protectItemUntil;

if (!item.protected && !isWithinProtectedPeriod && Math.random() < item.breakChance) {
  log.push(`>>> アイテム「${item.color}${item.adjective}${item.noun}」は壊れた！`);
  player.itemMemory.splice(i, 1);
  drawItemMemoryList();
}
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

if (!window.isFirstBattle &&
playerWon &&
window.allowGrowthEvent &&
Math.random() < finalRate) {

  isWaitingGrowth = true;

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
    if (currentStreak > sessionMaxStreak) {
    sessionMaxStreak = currentStreak;
}
    if (window.specialMode === 'brutal') {
        currentStreak += 1;

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

player.skills.forEach(sk => {
  const isExempt = window.levelCapExemptSkills.includes(sk.name);
  let levelUpChance = 0.2;  // 通常の確率

  if (sk.level >= 5000) {
    levelUpChance = 1 / 5000;  // Lv5000以上は超低確率
  } else if (sk.level >= 999 && !isExempt) {
    levelUpChance = 1 / 2500;  // 制限ありスキルは低確率
  }

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
    skillGainChance = 0.02;  // 鬼畜モードで変更する
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

    // スキル記憶を更新（各スキルの最高Lvを保持）
    for (const sk of player.skills) {
      player.skillMemory[sk.name] = Math.max(sk.level, player.skillMemory[sk.name] || 1);
    }

rebuildPlayerSkillsFromMemory(player, typeof sslot === 'number' ? sslot : 0);



showSubtitle(
  `敗北：${displayName(enemy.name)}に敗北<br>最終連勝数：${currentStreak}${resetMessage}<br><span style="font-size:12px;">※スキルは記憶に基づいて再構成されます</span>`,
  2500
);
updateSkillOverlay();
drawSkillMemoryList();
}

document.getElementById('startBattleBtn').addEventListener('click', window.startBattle);

// 最終HP表示
//  log.push(`\n${displayName(player.name)} 残HP: ${player.hp}/${player.maxHp}`);
log.push(`${displayName(enemy.name)} 残HP: ${enemy.hp}/${enemy.maxHp}`);
// ダメージ内訳表示
//log.push(`\n${displayName(player.name)} のダメージ内訳`);
//for (let key in player.battleStats) {
 // log.push(`${key}：${player.battleStats[key]}`);}

//if (player.hp > player.maxHp) player.hp = player.maxHp;

// 現在の連勝数をログに追加
log.push(`現在の連勝数: ${currentStreak}`);
// 最大連勝数（セッション内）をログに追加
log.push(`最大連勝数: ${sessionMaxStreak}`);

const maxStreak = parseInt(localStorage.getItem('maxStreak') || '0');
if (currentStreak > maxStreak) {
  localStorage.setItem('maxStreak', currentStreak);
}

maybeTriggerEvent();

document.getElementById('battleLog').textContent = log.join('\n');
drawHPGraph();
updateStats();

window.returnToTitleScreen = function () {
  // 画面の各部品を取得
  const gameScreen = document.getElementById('gameScreen');
  const titleScreen = document.getElementById('titleScreen');
  const finalResults = document.getElementById('finalResults');
  const battleArea = document.getElementById('battleArea');
  const remainDisplay = document.getElementById('remainingBattlesDisplay');
  const streakDisplay = document.getElementById('currentStreakDisplay');

  // 表示切り替え
  if (gameScreen) gameScreen.classList.add('hidden');
  if (titleScreen) titleScreen.classList.remove('hidden');
  if (finalResults) finalResults.style.display = 'none';
  if (battleArea) battleArea.classList.add('hidden');
  if (remainDisplay) remainDisplay.style.display = 'none';
  if (streakDisplay) streakDisplay.textContent = '';

  document.getElementById('loadGameBtn')?.classList.add('hidden');
document.getElementById('loadSection')?.classList.add('hidden');
document.getElementById('inputStr')?.classList.add('hidden');
document.querySelector('.playerNameHint')?.classList.add('hidden');

  // ゲーム内変数を初期化（window を通して安全に）
window.returnToTitleScreen = function () {
    // ...（既存のタイトル画面表示切替処理）...
    if ('player' in window) window.player = null;
    if ('enemy' in window) window.enemy = null;
    if ('currentStreak' in window) window.currentStreak = 0;
    if ('sessionMaxStreak' in window) window.sessionMaxStreak = 0;
    if ('remainingBattles' in window) window.remainingBattles = null;
    if ('targetBattles' in window) window.targetBattles = null;
    if ('initialAndSlotSkills' in window) window.initialAndSlotSkills = [];
    if ('isLoadedFromSave' in window) window.isLoadedFromSave = false;  // セーブフラグリセット
};
};
// （勝敗処理・ログ更新・updateStats()等の直後）
try {
  // ★追加: 戦闘回数のカウントダウンと結果表示
  if (window.remainingBattles != null) {
    window.remainingBattles--;
    const remainDisplay = document.getElementById('remainingBattlesDisplay');
    if (window.remainingBattles > 0) {
      // 残り回数がある場合：表示を更新
      if (remainDisplay) {
        remainDisplay.textContent = `残り戦闘数：${window.remainingBattles}回`;
      }
    } else if (window.remainingBattles <= 0) {
      // 戦闘回数が0になった場合：結果を集計して表示
      window.remainingBattles = 0;
      if (remainDisplay) {
        remainDisplay.style.display = 'none';
      }
      // 最大連勝数・最終ステータスを取得
      const maxStreak = window.maxStreak || 0;
      const finalAtk = player.attack || 0;
      const finalDef = player.defense || 0;
      const finalSpd = player.speed || 0;
      const finalHP = player.maxHp || 0;
      // 所持アイテムの総レアリティを計算（ドロップ率の逆数の合計）
      let totalRarity = 0;
      if (player.itemMemory && player.itemMemory.length > 0) {
        for (const item of player.itemMemory) {
          const adjDef = itemAdjectives.find(a => a.word === item.adjective);
          const nounDef = itemNouns.find(n => n.word === item.noun);
          const colorDef = itemColors.find(c => c.word === item.color);
          let dropRate = 1;
          if (colorDef && colorDef.dropRateMultiplier) dropRate *= colorDef.dropRateMultiplier;
          if (adjDef && adjDef.dropRate) dropRate *= adjDef.dropRate;
          if (nounDef && nounDef.dropRateMultiplier) dropRate *= nounDef.dropRateMultiplier;
          if (dropRate < 1e-9) dropRate = 1e-9;  // ゼロ除算防止
          totalRarity += (1 / dropRate);
        }
      }
      // 合計スコアを算出（攻撃力・防御力・素早さ・最大HP・総レアリティの合計）
const totalScore = Math.round(
  (finalAtk + finalDef + finalSpd + finalHP *0.1 + totalRarity)*sessionMaxStreak
);
      // レアリティ合計は小数点2桁まで表示（整数の場合は整数表示）
      let rarityStr = (Math.round(totalRarity * 100) / 100).toFixed(2);
      if (rarityStr.endsWith('.00')) {
        rarityStr = parseInt(rarityStr, 10).toString();
      }
      // 結果表示ボックスに内容を挿入して表示
      const finalResEl = document.getElementById('finalResults');

if (finalResEl) {
  const maxStreak = sessionMaxStreak || 0;
finalResEl.innerHTML = `
  <div class="final-death-title">${displayName(player.name)} は息絶えた…</div>

  <div class="final-stats">
    <p>設定戦闘回数: ${window.targetBattles || "未設定"}</p>
    <p>最大連勝数: ${sessionMaxStreak}</p>
    <p>最終ステータス：<br>
       攻撃力: ${finalAtk}<br>
       防御力: ${finalDef}<br>
       素早さ: ${finalSpd}<br>
       最大HP: ${finalHP}</p>
    <p>アイテム総レアリティ: ${rarityStr}</p>
  </div>

  <div class="final-score-value">合計スコア: ${totalScore}</div>
  <button id="backToTitleButton" style="
  margin-top: 30px;
  padding: 10px 20px;
  font-size: 1em;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  background: linear-gradient(to right, #333, #666);
  color: #fff;
  box-shadow: 0 0 10px rgba(255,255,255,0.2);
  cursor: pointer;
">
  タイトルに戻る
</button>
`;
// スコア記録（無制限を除く）
const validTargets = [100, 200, 500, 1000, 5000, 10000];
const target = Number(window.targetBattles);
if (validTargets.includes(target)) {
  if (!window.maxScores) window.maxScores = {};
  const prev = window.maxScores[target] ?? null;
  if (prev === null || totalScore > prev) {
    window.maxScores[target] = totalScore;
    if (typeof updateScoreOverlay === 'function') updateScoreOverlay();
  }
}

document.getElementById('backToTitleButton').onclick = function () {

  returnToTitleScreen();
};
finalResEl.style.display = 'block';
}
      // 自動戦闘を停止し、戦闘ボタンを無効化
      if (typeof stopAutoBattle === 'function') stopAutoBattle();
      const battleBtn = document.getElementById('startBattleBtn');
      if (battleBtn) battleBtn.disabled = true;
    }
  }
  // ★追加ここまで
} catch (e) {
  // （エラーハンドリング）
}

drawSkillMemoryList();
drawItemMemoryList();
try {
} catch (error) {
}
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof updateScoreOverlay === 'function') {
    updateScoreOverlay();
  }

  const returnBtn = document.getElementById('returnToTitleBtnInGame');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      if (confirm("本当にタイトルに戻りますか？\n（現在の進行状況は保存されていない場合失われます）")) {
        if (typeof returnToTitleScreen === 'function') returnToTitleScreen();
      }
    });
  }

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
      }, 100); // 連打間隔（ミリ秒）調整可
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

window.buildItemFilterStates = function () {
  const state = { color: {}, adj: {}, noun: {} };
  ['color', 'adj', 'noun'].forEach(type => {
    const checkboxes = document.querySelectorAll(`.itemFilterCB[data-type="${type}"]`);
    checkboxes.forEach(cb => {
      state[type][cb.value] = cb.checked;
    });
  });
  return state;
};

// セーブデータの署名用SHA-256ハッシュ生成
async function generateHash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// セーブデータをコード化してコピー保存（base64 + SHA-256）
window.exportSaveCode = async function() {
  if (!player) return;

  // 成長ステータスを最新化
  if (player.baseStats && player.growthBonus) {
    player.attack = player.baseStats.attack + player.growthBonus.attack;
    player.defense = player.baseStats.defense + player.growthBonus.defense;
    player.speed = player.baseStats.speed + player.growthBonus.speed;
    player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
    player.hp = player.maxHp;
  }

  window.itemFilterStates = buildItemFilterStates();

  // 初期スキル情報を保存対象に反映
  player.initialAndSlotSkills = window.initialAndSlotSkills || [];

  const payload = {
    player,
    currentStreak,
    sslot,
    growthMultiplier: window.growthMultiplier,
    skillMemoryOrder: Object.entries(player.skillMemory),
    itemMemory: player.itemMemory || [],
    rebirthCount: parseInt(localStorage.getItem('rebirthCount') || '0'),
    levelCapExemptSkills: window.levelCapExemptSkills || [],
    specialMode: window.specialMode || 'normal',
    allowGrowthEvent: window.allowGrowthEvent || false,
    allowSkillDeleteEvent: window.allowSkillDeleteEvent || false,
    allowItemInterrupt: window.allowItemInterrupt || false,
    itemFilterMode: window.itemFilterMode || 'and',
    itemFilterStates: window.itemFilterStates || {},

    // ★追加：戦闘回数の保存
    remainingBattles: window.remainingBattles ?? null,
    targetBattles: window.targetBattles ?? null,
    maxScores: window.maxScores || {},

};

  const raw = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(raw)));
  const hash = await generateHash(b64);
  const code = `${b64}.${hash}`;

  // コピー＆表示
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

window.importSaveCode = async function () {
  document.getElementById("skillMemoryList").classList.remove("hidden");
  const input = document.getElementById('saveData').value.trim();

  try {
    // セーブコードの署名確認
    const parts = input.split('.');
    if (parts.length !== 2) throw new Error('形式が不正です');
    const [b64, hash] = parts;
    const computed = await generateHash(b64);
    if (computed !== hash) throw new Error('署名不一致');

    // デコードとパース
    let raw = '';
    try {
      raw = decodeURIComponent(escape(atob(b64)));
    } catch (e) {
      throw new Error('デコード失敗');
    }

    const parsed = JSON.parse(raw);
    player = parsed.player;
    window.maxScores = parsed.maxScores || {};
    // 成長ボーナスがない場合は初期化
    if (!player.growthBonus) {
      player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
    }

    // アイテムメモリ
    player.itemMemory = parsed.itemMemory || [];

    // 初期スキル
    window.initialAndSlotSkills = parsed.initialAndSlotSkills || [];

    // スキルレベル制限緩和対象
    window.levelCapExemptSkills = parsed.levelCapExemptSkills || [];

    // その他ステータス
    window.growthMultiplier = parsed.growthMultiplier || 1;
    currentStreak = parsed.currentStreak || 0;

    // ★ 追加: 戦闘回数・残り回数の復元
    window.remainingBattles = parsed.remainingBattles ?? null;
    window.targetBattles = parsed.targetBattles ?? null;

    const remainDisplay = document.getElementById('remainingBattlesDisplay');
    if (window.remainingBattles != null && remainDisplay) {
      remainDisplay.textContent = `残り戦闘数：${window.remainingBattles}回`;
      remainDisplay.style.display = 'block';
    } else if (remainDisplay) {
      remainDisplay.style.display = 'none';
    }

    // 転生カウント
    const rebirth = (parsed.rebirthCount || 0) + 1;
    localStorage.setItem('rebirthCount', rebirth);

    // --- 新規追加設定の復元 ---
    window.specialMode = parsed.specialMode || 'normal';
    window.allowGrowthEvent = parsed.allowGrowthEvent ?? true;
    window.allowSkillDeleteEvent = parsed.allowSkillDeleteEvent ?? true;
    window.allowItemInterrupt = parsed.allowItemInterrupt ?? true;
    window.itemFilterMode = parsed.itemFilterMode || 'and';
    window.itemFilterStates = parsed.itemFilterStates || {};

    // --- UI初期化 ---
    if (typeof setupItemFilters === 'function') setupItemFilters();
    if (typeof setupToggleButtons === 'function') setupToggleButtons();
    if (typeof applyItemFilterUIState === 'function') applyItemFilterUIState();

    // 敵を生成（攻撃スキルありを保証）
    do {
      enemy = makeCharacter('敵' + Math.random());
    } while (!hasOffensiveSkill(enemy));

    // ステータス表示更新
    updateStats();

    // 表示の同期
    if (typeof setupToggleButtons === 'function') setupToggleButtons();
    if (typeof updateSpecialModeButton === 'function') updateSpecialModeButton();
    if (typeof updateItemFilterModeButton === 'function') updateItemFilterModeButton();
    if (typeof applyItemFilterUIState === 'function') applyItemFilterUIState();

    // タイトル → ゲーム画面へ切り替え
    const title = document.getElementById('titleScreen');
    const game = document.getElementById('gameScreen');
    title.classList.add('fade-out');

    setTimeout(() => {
      title.classList.add('hidden');
      game.classList.remove('hidden');
      game.classList.add('fade-in');
      document.getElementById("battleArea").classList.add("hidden");

      // 連勝表示
      const streakDisplay = document.getElementById('currentStreakDisplay');
      if (streakDisplay) {
        const baseBoost = 1.02;
        const boostMultiplier = Math.pow(baseBoost, currentStreak);
        streakDisplay.textContent = `連勝数：${currentStreak} （補正倍率：約${boostMultiplier.toFixed(2)}倍）`;
      }

      // 転生回数表示
      const rebirthDisplay = document.getElementById('rebirthCountDisplay');
      if (rebirthDisplay) {
        rebirthDisplay.textContent = '転生回数：' + rebirth;
      }
      if (typeof updateScoreOverlay === 'function') updateScoreOverlay();
      startBattle();
    }, 500);

  } catch (e) {
    alert('セーブデータの読み込みに失敗しました：' + e.message);
  }
};

window.setupToggleButtons = function () {
  const modeBtn = document.getElementById('kichikuToggle');
  if (modeBtn) {
    modeBtn.textContent = window.specialMode === 'brutal' ? '鬼畜モード中' : '通常モード中';
  }

  // 3つのイベントトグルボタン（id: skillDeleteToggle など）
  const toggleConfigs = [
    { id: 'skillDeleteToggle', flag: 'allowSkillDeleteEvent', label: 'スキル削除' },
    { id: 'growthToggle', flag: 'allowGrowthEvent', label: '成長イベント' },
    { id: 'itemInterruptToggle', flag: 'allowItemInterrupt', label: '入手停止' }
  ];

  toggleConfigs.forEach(cfg => {
    const btn = document.getElementById(cfg.id);
    if (btn) {
      const active = window[cfg.flag] ?? true;
      btn.textContent = `${cfg.label}：${active ? 'ON' : 'OFF'}`;
    }
  });
};

window.applyItemFilterUIState = function () {
  ['color', 'adj', 'noun'].forEach(type => {
    const checkboxes = document.querySelectorAll(`.itemFilterCB[data-type="${type}"]`);
    checkboxes.forEach(cb => {
      if (window.itemFilterStates?.[type]?.hasOwnProperty(cb.value)) {
        cb.checked = window.itemFilterStates[type][cb.value];
      }
    });
  });
};

window.updateSpecialModeButton = function () {
  const btn = document.getElementById('specialModeButton');
  const battleBtn = document.getElementById('startBattleBtn');

  if (window.specialMode === 'brutal') {
    btn.textContent = '鬼畜モード（アイテム入手可能性あり）';
    btn.classList.remove('normal-mode');
    btn.classList.add('brutal-mode');
    battleBtn.classList.remove('normal-mode');
    battleBtn.classList.add('brutal-mode');
  } else {
    btn.textContent = '通常モード';
    btn.classList.remove('brutal-mode');
    btn.classList.add('normal-mode');
    battleBtn.classList.remove('brutal-mode');
    battleBtn.classList.add('normal-mode');
  }
};

window.updateItemFilterModeButton = function () {
  const toggleBtn = document.getElementById('filterModeToggleBtn');
  if (!toggleBtn) return;

  toggleBtn.textContent = (window.itemFilterMode === 'and')
    ? '各要素の条件を満たす'
    : 'いずれかの条件を満たす';

  toggleBtn.classList.toggle('and', window.itemFilterMode === 'and');
  toggleBtn.classList.toggle('or', window.itemFilterMode === 'or');
};

// 「つづきから」ボタン処理（セーブデータ入力から復元）
window.loadGame = async function() {
  // ファイル入力がある場合は読み込む
  isLoadedFromSave = true;
  window.isFirstBattle = false;

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
    populateItemElementList();
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

window.clearEventPopup = function () {
  const popup = document.getElementById('eventPopup');
  const title = document.getElementById('eventPopupTitle');
  const optionsEl = document.getElementById('eventPopupOptions');
  const selectContainer = document.getElementById('eventPopupSelectContainer');
  const selectEl = document.getElementById('eventPopupSelect');

  if (popup) popup.style.display = 'none';
  if (title) title.textContent = '';
  if (optionsEl) optionsEl.innerHTML = '';
  if (selectEl) selectEl.innerHTML = '';
  if (selectContainer) selectContainer.style.display = 'none';
};

  // 【選択肢イベントポップアップを表示する】
window.showEventOptions = function(title, options, onSelect) {
  clearEventPopup(); // ← 前回のゴミをすべて除去

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
      clearEventPopup();  // ← 念のため、選択後にも片付け
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

const whiteSkills = player.skills.slice(); // 所持スキル全てをそのままコピー

if (whiteSkills.length === 0) {
    popup.style.display = 'none';
    showCustomAlert("削除できる白スキルがありません！");
    return;
}

// 既存の選択肢をクリア
selectEl.innerHTML = '';

whiteSkills.forEach(s => {
    const option = document.createElement('option');
    option.value = s.name;
    option.textContent = `${s.name} Lv${s.level}`;
    selectEl.appendChild(option);
});

// 「やめる」ボタンがまだ追加されていなければ追加する
if (!document.getElementById('cancelDeleteSkillBtn')) {
  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'cancelDeleteSkillBtn';
  cancelBtn.textContent = 'やめる';

  // 決定ボタンと同じクラスとスタイルに統一
  cancelBtn.className = 'event-popup-button'; // ← ボタン共通クラス

  cancelBtn.onclick = () => {
    popup.style.display = 'none';
  };

  // ボタン配置（決定ボタンの横に）
  const btnContainer = document.getElementById('eventPopupSelectContainer');
  if (btnContainer) {
    btnContainer.appendChild(cancelBtn);
  }
}

// 決定ボタン
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
  if (window.eventTriggered) return;
  if (!window.allowSkillDeleteEvent) return;

  const whiteSkills = player.skills.filter(s => {
    const found = skillPool.find(sk => sk.name === s.name);
    if (!found) return false;
    if (window.initialAndSlotSkills && window.initialAndSlotSkills.includes(s.name)) return false;
    if (found.category === 'passive') return false;
    return true;
  });

  if (whiteSkills.length < 6) return;

  const chance = 0.1;
  if (Math.random() < chance) {
    window.eventTriggered = true;
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
            return;
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
  const list = document.getElementById('itemMemoryList');
  list.innerHTML = '';
  player.itemMemory.forEach((item, idx) => {
    const li = document.createElement('li');
    const name = `${item.color}${item.adjective}${item.noun}`;
    li.textContent = `${name}（${item.skillName}） Lv.${item.skillLevel}`;

  li.className = "";  // リセット

  if (item.protected) {
    li.classList.add("item-protected");
  }
    li.onclick = () => onItemClick(item, idx);
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
// 引数：
//  message     : 表示するHTML文字列
//  duration    : 表示時間（ミリ秒）デフォルト 3000
//  background  : 背景色（例 "#222"）
//  color       : 文字色（例 "#fff"）
//  forceClear  : true にすると他のアラートを即座に消してから表示（デフォルト false）

window.showCustomAlert = function(message, duration = 3000, background = "#222", color = "#fff", forceClear = false) {
    const container = document.getElementById('customAlertContainer');

    // ★ forceClear = true の場合、すでに表示中のアラートをすべて削除
    if (forceClear && container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    const alert = document.createElement('div');

    // スタイル設定
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
            if (container.children.length === 0) {
                container.innerHTML = '';
            }
        }, 300); // フェードアウト待機時間
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
window.populateItemElementList = function () {
  const container = document.getElementById('itemElementList');
  if (!container) return;

  const formatValue = (val, digits = 10, suffix = '') => {
    if (val === Infinity) return '∞' + suffix;
    if (typeof val !== 'number') return '（未定義）';
    return parseFloat(val.toFixed(digits)) + suffix;
  };

  let html = '<ul style="font-size: 13px;">';

  html += '<li><strong>色（使用回数）</strong><ul>';
  itemColors.forEach(c => {
    const uses = (typeof c.usesPerBattle === 'number' || c.usesPerBattle === Infinity)
      ? formatValue(c.usesPerBattle, 10, '回')
      : '（未定義）';
    html += `<li>${c.word}：${uses}</li>`;
  });
  html += '</ul></li>';

  html += '<li><strong>修飾語（発動率）</strong><ul>';
  itemAdjectives.forEach(a => {
    html += `<li>${a.word}：${formatValue(a.activationRate * 100, 6, '%')}</li>`;
  });
  html += '</ul></li>';

  html += '<li><strong>名詞（破損確率）</strong><ul>';
  itemNouns.forEach(n => {
    html += `<li>${n.word}：${formatValue(n.breakChance * 100, 6, '%')}</li>`;
  });
  html += '</ul></li>';

  html += '</ul>';

  container.innerHTML = html;
};

function updatePlayerDisplay(player) {
  const nameEl = document.getElementById('playerName');
  if (nameEl) nameEl.textContent = player.name;

  const atkEl = document.getElementById('atkStat');
  if (atkEl) atkEl.textContent = `ATK: ${player.attack}`;

  const defEl = document.getElementById('defStat');
  if (defEl) defEl.textContent = `DEF: ${player.defense}`;

  const spdEl = document.getElementById('spdStat');
  if (spdEl) spdEl.textContent = `SPD: ${player.speed}`;

  const hpEl = document.getElementById('hpStat');
  if (hpEl) hpEl.textContent = `HP: ${player.hp}`;

  const maxHpEl = document.getElementById('maxHpStat');
  if (maxHpEl) maxHpEl.textContent = `MAX HP: ${player.maxHp}`;

  // キャラクター画像
  const imgCanvas = document.getElementById('playerImage');
  if (imgCanvas) drawCharacterImage(player.characterId, 'playerImage');

  // 所持スキル表示
  const skillList = document.getElementById('playerSkillList');
  if (skillList) {
    skillList.innerHTML = '';
    player.skillMemory.forEach(s => {
      const li = document.createElement('li');
      li.textContent = `${s.name} (Lv${s.level})`;
      skillList.appendChild(li);
    });
  }

  // 初期スキル表示
  const initialSkillList = document.getElementById('playerInitialSkillList');
  if (initialSkillList) {
    initialSkillList.innerHTML = '';
    player.initialSkills.forEach(skillName => {
      const li = document.createElement('li');
      li.textContent = skillName;
      initialSkillList.appendChild(li);
    });
  }
}

function updateEnemyDisplay(enemy) {
  const nameEl = document.getElementById('enemyName');
  if (nameEl) nameEl.textContent = enemy.name;

  const enemyStats = document.getElementById('enemyStats');
  if (enemyStats) {
    enemyStats.innerHTML = `
      <p>ATK: ${enemy.attack}</p>
      <p>DEF: ${enemy.defense}</p>
      <p>SPD: ${enemy.speed}</p>
      <p>HP: ${enemy.hp}</p>
      <p>MAX HP: ${enemy.maxHp}</p>
    `;
  }

  const imgCanvas = document.getElementById('enemyImage');
  if (imgCanvas) drawCharacterImage(enemy.characterId, 'enemyImage');

  const enemySkillList = document.getElementById('enemySkillList');
  if (enemySkillList) {
    enemySkillList.innerHTML = '';
    enemy.skills.forEach(skillName => {
      const li = document.createElement('li');
      li.textContent = skillName;
      enemySkillList.appendChild(li);
    });
  }
}

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

let scoreTimeout;
let skillTimeout;
let itemTimeout;

window.addEventListener('scroll', () => {
  const battleEl = document.getElementById('remainingBattlesDisplay');
  const scoreEl = document.getElementById('scoreOverlay');
  const skillEl = document.getElementById('skillOverlay');
	const itemEl = document.getElementById('itemOverlay');


  // フェードアウト（スクロール中）
  if (battleEl) battleEl.style.opacity = '0';
  if (scoreEl) scoreEl.style.opacity = '0';
  if (skillEl) skillEl.style.opacity = '0';
	if (itemEl) itemEl.style.opacity = '0';


  // タイマー解除
  clearTimeout(scoreTimeout);
  clearTimeout(skillTimeout);
  clearTimeout(itemTimeout);

  // スコア：500ms後に再表示
  scoreTimeout = setTimeout(() => {
    if (battleEl) battleEl.style.opacity = '1';
    if (scoreEl) scoreEl.style.opacity = '1';
  }, 1000);

  // スキル一覧：2秒後に再表示（内容更新付き）
  skillTimeout = setTimeout(() => {
    if (typeof updateSkillOverlay === 'function') updateSkillOverlay();
    if (skillEl) skillEl.style.opacity = '1';
  }, 1500);
	
	  itemTimeout = setTimeout(() => {
    updateItemOverlay();
    if (itemEl) itemEl.style.opacity = '1';
  }, 1500);
});