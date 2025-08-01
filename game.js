
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



window.showAllGlobalVariables = function () {
  document.getElementById("debugPopup")?.remove(); // 前回のを削除

  const popup = document.createElement("div");
  popup.id = "debugPopup";
  popup.style.position = "fixed";
  popup.style.top = "10%";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.maxHeight = "60vh";
  popup.style.overflow = "auto";
  popup.style.background = "#222";
  popup.style.color = "#fff";
  popup.style.padding = "12px 16px";
  popup.style.zIndex = "9999";
  popup.style.border = "2px solid #fff";
  popup.style.borderRadius = "8px";
  popup.style.boxShadow = "0 0 10px #fff";
  popup.style.maxWidth = "80vw";
  popup.style.fontSize = "14px";

  const title = document.createElement("h3");
  title.textContent = "変数一覧（デバッグ用）";
  title.style.marginTop = "0";
  popup.appendChild(title);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "閉じる";
  closeBtn.style.margin = "10px 0";
  closeBtn.onclick = () => popup.remove();
  popup.appendChild(closeBtn);

  const keys = Object.keys(window).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  keys.forEach(key => {
    try {
      const value = window[key];
      const container = document.createElement("div");
      container.style.marginBottom = "6px";

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null ||
        value === undefined
      ) {
        container.innerHTML = `<strong>${key}</strong>: ${JSON.stringify(value)}`;
      } else if (Array.isArray(value)) {
        const details = document.createElement("pre");
        details.style.display = "none";
        details.style.marginLeft = "1em";
        details.style.whiteSpace = "pre-wrap";
        details.textContent = value.map((v, i) => `${i}: ${JSON.stringify(v)}`).join("\n");

        const clickable = document.createElement("div");
        clickable.innerHTML = `<strong style="color:#4cf">${key}</strong>: [Array(${value.length})]`;
        clickable.style.cursor = "pointer";
        clickable.onclick = () => {
          details.style.display = details.style.display === "none" ? "block" : "none";
        };

        container.appendChild(clickable);
        container.appendChild(details);
      } else if (typeof value === "object") {
        const entries = Object.entries(value);
        const details = document.createElement("pre");
        details.style.display = "none";
        details.style.marginLeft = "1em";
        details.style.whiteSpace = "pre-wrap";
        details.textContent = entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n");

        const clickable = document.createElement("div");
        clickable.innerHTML = `<strong style="color:#4cf">${key}</strong>: [Object]`;
        clickable.style.cursor = "pointer";
        clickable.onclick = () => {
          details.style.display = details.style.display === "none" ? "block" : "none";
        };

        container.appendChild(clickable);
        container.appendChild(details);
      } else {
        container.innerHTML = `<strong>${key}</strong>: [function or unknown type]`;
      }

      popup.appendChild(container);
    } catch (e) {
      // 無視
    }
  });

  document.body.appendChild(popup);
};


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

window.showCenteredPopup = function(message, duration = 1200) {
  const popup = document.getElementById("eventPopup");
  const title = document.getElementById("eventPopupTitle");
  const optionsEl = document.getElementById("eventPopupOptions");

  if (!popup || !title || !optionsEl) return;

  title.innerHTML = message;
  optionsEl.innerHTML = "";

  popup.style.display = "block";
  popup.style.visibility = "hidden";

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const popupHeight = popup.offsetHeight;
  popup.style.top = `${scrollTop + window.innerHeight / 2 - popupHeight / 2}px`;
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";  // ← ← ← 修正ポイント
  popup.style.visibility = "visible";

  setTimeout(() => {
    popup.style.display = "none";
  }, duration);
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
    toggleBtn.textContent = (shown ? '▶' : '▼') + ' 固有スキル候補' + (shown ? 'を表示' : 'を隠す');
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

  // 内容を設定
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

  // 一時的に表示してサイズ取得
  popup.style.display = "block";
  popup.style.visibility = "hidden";

  // ✅ 横幅を広めに設定
//  popup.style.width = "min(90vw, 400px)";

  // 中央に配置（スクロール対応）
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const popupHeight = popup.offsetHeight;
  popup.style.top = `${scrollTop + window.innerHeight / 2 - popupHeight / 2}px`;
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";

  // 表示
  popup.style.visibility = "visible";
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
  const totalSlots = 3 + sslot;

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

  if (!attackSkillName) {
    for (const [name] of entries) {
      if (name !== uniqueSkillName) {
        attackSkillName = name;
        break;
      }
    }
  }

  if (!attackSkillName) {
    attackSkillName = uniqueSkillName;
  }

  const newSkills = [];
  const usedNames = new Set();

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

  // 初期化
  player.skills = [];
  if (!player.mixedSkills) player.mixedSkills = [];

  // 固有スキル先に追加
  const uniqueSkillObj = { name: uniqueSkillName, level: uniqueLevel, uses: 0, isUnique: true };
  player.skills.push(uniqueSkillObj);

  for (const sk of newSkills) {
    if (sk.name === uniqueSkillName) continue;
    const fullSkill = { ...sk, isUnique: false };
    onSkillAcquired(fullSkill);
  }

  // 固有スキルからの明示的な混合スキル生成
  const mixCandidates = player.skills.filter(s => s.name !== uniqueSkillName);
  if (mixCandidates.length > 0) {
    const partner = mixCandidates[Math.floor(Math.random() * mixCandidates.length)];
    const combinedSkill = createMixedSkill(uniqueSkillObj, partner);
    player.mixedSkills.push(combinedSkill);
      player.skills.push(combinedSkill); 
		 // ← 追加：メモリにも表示されるように
  }

  if (typeof drawSkillMemoryList === 'function') drawSkillMemoryList();
  if (typeof drawCombinedSkillList === 'function') drawCombinedSkillList();
}


// グローバル
let battleLogTimerId = null;
let isBattleLogRunning = false;

function displayBattleLogWithoutAsync(log) {
  if (isBattleLogRunning && battleLogTimerId !== null) {
    clearTimeout(battleLogTimerId);
    battleLogTimerId = null;
  }

  const battleLogEl = document.getElementById('battleLog');
  battleLogEl.innerHTML = '';

  // HTMLタグの混入防止：一度DOMで解釈してテキスト化
  const cleanLog = log.map(line => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = line;
    return tempDiv.textContent || '';
  });

  let i = 0;
  isBattleLogRunning = true;

  function showNextLine() {
    if (i >= cleanLog.length) {
      isBattleLogRunning = false;
      battleLogTimerId = null;
      drawHPGraph();
      updateStats();
      return;
    }

    const lineText = cleanLog[i].trim();
    const div = document.createElement('div');

    // ─ ターン区切り ─
    if (/^[-–]{2,}\s*\d+ターン\s*[-–]{2,}$/.test(lineText)) {
      div.textContent = lineText;
      div.classList.add('turn-banner');
    }

    // ─ 勝敗行 ─
    else if (lineText.includes('勝者')) {
      div.textContent = lineText;
      div.classList.add('battle-result', 'win');
    }
    else if (lineText.includes('敗北')) {
      div.textContent = lineText;
      div.classList.add('battle-result', 'lose');
    }

    // ─ 通常ログ行 ─
    else {
      // HP％を含む場合（色付き）
      if (lineText.match(/\d+%/)) {
        const matches = [...lineText.matchAll(/(\d+)%/g)];
        let lastIndex = 0;

        for (const match of matches) {
          const hp = parseInt(match[1], 10);
          const start = match.index;
          const end = start + match[0].length;

          // 前のプレーンテキストを追加
          if (start > lastIndex) {
            const text = lineText.slice(lastIndex, start);
            div.appendChild(document.createTextNode(text));
          }

          // 色付きのパーセント表示
          const hue = Math.floor((hp / 100) * 120);
          const span = document.createElement('span');
          span.textContent = `${hp}%`;
          span.style.color = `hsl(${hue}, 100%, 45%)`;
          span.style.fontWeight = 'bold';
          div.appendChild(span);

          lastIndex = end;
        }

        // 残りのテキストを追加
        if (lastIndex < lineText.length) {
          div.appendChild(document.createTextNode(lineText.slice(lastIndex)));
        }
      } else {
        // 通常行（%なし）
        div.textContent = lineText;
      }
    }

    // 追加＆スクロール
    battleLogEl.appendChild(div);

    requestAnimationFrame(() => {
      battleLogEl.scrollTo({
        top: battleLogEl.scrollHeight,
        behavior: 'smooth'
      });
    });

    i++;
    battleLogTimerId = setTimeout(showNextLine, 20);
  }

  showNextLine();
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



/********************************
 * データ構造と初期設定
 ********************************/

// プレイヤーオブジェクトに混合スキルリストを追加（存在しない場合のみ初期化）


// 混合スキル生成関数
// 内包階層を再帰的に計算
function getMixedSkillDepth(skill) {
  if (!skill.isMixed || !Array.isArray(skill.baseSkills)) return 1;
  return 1 + Math.max(...skill.baseSkills.map(getMixedSkillDepth));
}

// 混合スキル名を生成
function generateSkillName(activationProb, effectValue, config, kanaPart) {
  const activationPrefixes = [...Array(40)].map((_, i) => {
    const list = ["白く","淡く","儚く","静かに","柔らかく","ほのかに","静穏な","風のように","水面のように","さざ波のように",
                  "鈍く","灰色の","くすんだ","ぼんやりと","霧のように","薄暮の","幻のように","深く","ゆるやかに","澄んだ",
                  "赤黒く","光り輝く","燃え上がる","熱を帯びた","紅蓮の","揺らめく","照らすように","きらめく","煌く","きつく",
                  "刺すように","鋭く","ひらめく","咆哮する","激しく","電撃の","鼓動する","天を裂く","神速の","超越せし"];
    return list[i] || "未知の";
  });

  const effectValuePrefixes = [...Array(40)].map((_, i) => {
    const list = ["ささやく","照らす","包み込む","揺らす","引き寄せる","誘う","癒す","染み込む","憑依する","導く",
                  "支配する","増幅する","研ぎ澄ます","貫く","解き放つ","覚醒させる","爆発する","焼き尽くす","断ち切る","消し去る",
                  "裂く","砕く","覚醒する","解放する","粉砕する","叫ぶ","轟かせる","駆け抜ける","高鳴る","躍動する",
                  "躍らせる","爆ぜる","瞬く","砲撃する","宇宙を裂く","世界を断つ","深淵を覗く","魂を燃やす","全てを覆う","運命を導く"];
    return list[i] || "未知の力";
  });

  // ✅ 最大連勝数による補正（最大 +10%）
  const streakBoost = Math.min(1.0, (window.maxStreak || 0) / 100) * 0.1;

  // ✅ 発動率 0.1〜0.8 → 正規化：0〜1
  const normalizedActivation = Math.max(0, Math.min(1, (activationProb - 0.1) / 0.7));
  const activationPercent = Math.max(0, Math.min(1, normalizedActivation + streakBoost));

  // ✅ 効果値 min〜max → 正規化：0〜1
  const normalizedEffect = Math.max(0, Math.min(1, (effectValue - config.min) / (config.max - config.min)));
  const effectPercent = Math.max(0, Math.min(1, normalizedEffect + streakBoost));

  // ✅ 接頭語インデックス（見た目のランダム性のため逆分布に加工）
  const reversedActivation = 1 - normalizedActivation;
  const reversedEffect = 1 - normalizedEffect;

  const activationPrefixIndex = Math.floor(Math.min(1, Math.pow(reversedActivation, 2.5) + streakBoost) * 39.999);
  const effectPrefixIndex = Math.floor(Math.min(1, Math.pow(reversedEffect, 2.5) + streakBoost) * 39.999);

  const prefix1 = activationPrefixes[activationPrefixIndex];
  const prefix2 = effectValuePrefixes[effectPrefixIndex];
  const fullName = `${prefix1}×${prefix2}${kanaPart}`;

  // ✅ 星の評価（両方の正規化された元の値が高いときのみ★5）
  function percentileToStars(p) {
    if (p >= 0.90) return 5;
    if (p >= 0.75) return 4;
    if (p >= 0.50) return 3;
    if (p >= 0.25) return 2;
    return 1;
  }

  const starFromActivation = percentileToStars(activationPercent);
  const starFromEffect = percentileToStars(effectPercent);
  const starCount = Math.min(starFromActivation, starFromEffect); // 厳しめ評価

  const rarityClass = {
    5: "skill-rank-s",
    4: "skill-rank-a",
    3: "skill-rank-b",
    2: "skill-rank-c",
    1: "skill-rank-d"
  }[starCount];

  return {
    fullName,
    rarityClass,
    starRating: "★".repeat(starCount) + "☆".repeat(5 - starCount)
  };
}

window.showMixedSkillSummaryPopup = function(skill) {
  // 星の数が4未満ならスキップ
  const starCount = typeof skill.starRating === 'string' ? (skill.starRating.match(/★/g) || []).length : 0;
  if (starCount < 4) return;

  // フラグを立てる
  window.withmix = true;

  let html = "";

  function buildSkillDetail(skill, depth = 0) {
    const indent = "&nbsp;&nbsp;&nbsp;&nbsp;".repeat(depth); // インデント（スペース）

    if (depth === 0 && skill.isProtected) {
      html += `<div style="color: gold;">🔒【保護中のスキル】</div>`;
    }

    const name = skill.name || "(不明)";
    const level = skill.level ?? "?";

    if (depth === 0) {
      const star = skill.starRating || "";
      const rank = skill.rarityClass?.replace("skill-rank-", "").toUpperCase() || "-";
      const prob = skill.activationProb ? Math.floor(skill.activationProb * 100) : 0;
      html += `<div style="font-size: 13px; font-weight: bold; color: #ffddaa;">【${star} / RANK: ${rank}】</div>`;
      html += `<div style="color: #ffffff;">${name}（Lv${level}｜発動率: ${prob}%）</div>`;
    } else {
      html += `<div style="color: #cccccc;">${indent}${name}（Lv${level}）</div>`;
    }

    if (skill.isMixed && Array.isArray(skill.specialEffects)) {
      for (const eff of skill.specialEffects) {
        const prefix = `${indent}▶ 特殊効果: `;
        let effectText = "";
        switch (eff.type) {
          case 1: effectText = `敵の残りHPの<span style="color:#ff9999;">${eff.value}%</span>分の追加ダメージ`; break;
          case 2: effectText = `戦闘不能時にHP<span style="color:#99ccff;">${eff.value}%</span>で自動復活`; break;
          case 3: effectText = `継続ダメージ時に<span style="color:#aaffaa;">${eff.value}%</span>即時回復`; break;
          case 4: effectText = `攻撃力 <span style="color:#ffaa88;">${eff.value}倍</span>（所持時バフ）`; break;
          case 5: effectText = `防御力 <span style="color:#88ddff;">${eff.value}倍</span>（所持時バフ）`; break;
          case 6: effectText = `素早さ <span style="color:#ffee88;">${eff.value}倍</span>（所持時バフ）`; break;
          case 7: effectText = `最大HP <span style="color:#d4ff88;">${eff.value}倍</span>（所持時バフ）`; break;
          default: effectText = `不明な効果 type=${eff.type}`; break;
        }
        html += `<div style="color: #dddddd;">${prefix}${effectText}</div>`;
      }
    }

    if (Array.isArray(skill.baseSkills) && skill.baseSkills.length > 0) {
      html += `<div style="color: #999999;">${indent}▼ 構成スキル:</div>`;
      for (const base of skill.baseSkills) {
        buildSkillDetail(base, depth + 1);
      }
    }
  }

  buildSkillDetail(skill);

  showCenteredPopup(
    `<div style="font-size: 12px; line-height: 1.6; font-family: 'Segoe UI', sans-serif;">
      ${html}
    </div>`,
    6000
  );
};



// スキル生成本体
function createMixedSkill(skillA, skillB) {
  const maxDepth = 5;
  const includeMixedSkillChance = 0.3; // ← 混合スキルを内包する確率（変更可）

  // ✅ 所持上限（最大3スキルまで）
  if (player && Array.isArray(player.mixedSkills) && player.mixedSkills.length >= 3) {
    return null;
  }

  function getMixedSkillDepth(skill) {
    if (!skill || !skill.isMixed || !Array.isArray(skill.baseSkills)) return 1;
    return 1 + Math.max(...skill.baseSkills.map(getMixedSkillDepth));
  }

  function isValidNestedMixedSkill(skill) {
    return skill && skill.isMixed && Array.isArray(skill.specialEffects) && skill.specialEffects.length > 0;
  }

  function flattenIfTooDeepOrInvalid(skill, currentDepth = 1) {
    if (skill && skill.isMixed && Array.isArray(skill.baseSkills)) {
      const thisDepth = getMixedSkillDepth(skill);
      const isTooDeep = currentDepth + thisDepth > maxDepth;
      const isInvalid = !isValidNestedMixedSkill(skill);
      const shouldFlatten = isTooDeep || isInvalid;
      const shouldInclude = Math.random() < includeMixedSkillChance;

      if (shouldFlatten || !shouldInclude) {
        return skill.baseSkills
          .filter(s => s && typeof s === 'object') // ✅ null防止
          .flatMap(s => flattenIfTooDeepOrInvalid(s, currentDepth));
      } else {
        return [skill];
      }
    }
    return [skill];
  }

  const depthA = getMixedSkillDepth(skillA);
  const depthB = getMixedSkillDepth(skillB);
  const newDepth = Math.max(depthA, depthB) + 1;
  if (newDepth > maxDepth) {
    alert("これ以上複雑な混合スキルは作成できません（階層制限あり）");
    return null;
  }

  let baseSkills = [
    ...flattenIfTooDeepOrInvalid(skillA),
    ...flattenIfTooDeepOrInvalid(skillB)
  ].filter(s => s && typeof s === 'object'); // ✅ null除去

  // 欠落情報補完
  for (const skill of baseSkills) {
    if (!skill || typeof skill !== 'object') continue;
    if (skill.baseSkills && Array.isArray(skill.baseSkills)) {
      skill.isMixed = true;
    }
    if (!skill.specialEffects && skill.specialEffectType != null) {
      skill.specialEffects = [{ type: skill.specialEffectType, value: skill.specialEffectValue }];
    }
  }

  // 無効混合スキルの除去
  baseSkills = baseSkills.filter(s =>
    s && !(s.isMixed && (!s.specialEffects || s.specialEffects.length === 0))
  );

  if (baseSkills.length === 0) baseSkills.push(skillA);

  // 並べ替え（混合スキルを先に）
  baseSkills.sort((a, b) => (b.isMixed ? 1 : 0) - (a.isMixed ? 1 : 0));

  // 有効な混合スキルの内包チェック
  const includedMixed = baseSkills.filter(s =>
    s && s.isMixed && Array.isArray(s.specialEffects) && s.specialEffects.length > 0
  );
  if (includedMixed.length > 0) {
    showCenteredPopup(`🌀 混合スキルの特殊効果が継承されました！<br>
<span style="font-size: 10px; color: #ffcc99;">
※特殊効果の書かれていない混合スキルは特殊効果無効です
</span>`);
    window.withmix = true;
  }

  // スキル生成
  const totalLevel = baseSkills.reduce((sum, s) => sum + (s.level || 1), 0);
  const averageLevel = Math.max(1, Math.round(totalLevel / baseSkills.length));
  const kanaChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
  const nameLength = Math.floor(Math.random() * 3) + 2;
  const kanaPart = Array.from({ length: nameLength }, () =>
    kanaChars[Math.floor(Math.random() * kanaChars.length)]
  ).join("");

  const activationProb = Math.random() * (0.8 - 0.1) + 0.1;
  const effectType = Math.ceil(Math.random() * 7);

  const effectValueTable = {
    1: { min: 10, max: 30, rareScale: 2 },
    2: { min: 10, max: 100, rareScale: 4 },
    3: { min: 50, max: 90, rareScale: 2 },
    4: { min: 2.0, max: 5.0, rareScale: 3 },
    5: { min: 2.0, max: 5.0, rareScale: 3 },
    6: { min: 2.0, max: 5.0, rareScale: 3 },
    7: { min: 2.0, max: 5.0, rareScale: 3 }
  };
  const config = effectValueTable[effectType];

  let effectValue;
  if (effectType <= 3) {
    effectValue = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  } else {
    const t = Math.pow(Math.random(), config.rareScale);
    effectValue = Math.round((config.min + (config.max - config.min) * t) * 10) / 10;
  }

  const { fullName, rarityClass, starRating } = generateSkillName(
    activationProb, effectValue, config, kanaPart
  );

  // 最終チェックで無効スキル除去＋null除去
  baseSkills = baseSkills.filter(s =>
    s && !(s.isMixed && (!s.specialEffects || s.specialEffects.length === 0))
  );

  // 再ソート
  baseSkills.sort((a, b) => (b.isMixed ? 1 : 0) - (a.isMixed ? 1 : 0));

  const newMixed = {
    name: fullName,
    isMixed: true,
    baseSkills,
    level: averageLevel,
    activationProb,
    specialEffectType: effectType,
    specialEffectValue: effectValue,
    specialEffects: [{
      type: effectType,
      value: effectValue
    }],
    rarityClass,
    starRating
  };

  if (typeof showMixedSkillSummaryPopup === 'function') {
    showMixedSkillSummaryPopup(newMixed);
  }

  return newMixed;
}
///********************************
function shouldInclude(skill) {
  const depth = getMixedSkillDepth(skill);
  const baseRate = 0.95; // 通常スキルはほぼ採用される
  const mixedRate = 0.05 ** depth; // 深さに応じて急激に低下

  return skill.isMixed
    ? Math.random() < mixedRate
    : Math.random() < baseRate;
}
//********************************/

//function shouldInclude(skill) {
//  return true; // すべてのスキル（混合スキル含む）を必ず採用
//}

/********************************
 * スキル取得時の混合スキル生成処理
 ********************************/

// スキル取得イベント時に呼ばれる関数（固有スキル取得時に混合スキルを生成）
function onSkillAcquired(newSkill) {
  if (!player.mixedSkills) {
    player.mixedSkills = [];
  }

  const canMix = player.skills.length > 0;

  // 固有スキル処理
  if (newSkill.isUnique) {
    if (Math.random() < 0.05 && canMix) {
			alert("生成されます")
      const partnerSkill = player.skills[Math.floor(Math.random() * player.skills.length)];
      const mixedSkill = createMixedSkill(newSkill, partnerSkill);

      player.skills.push(mixedSkill);
      player.mixedSkills.push(mixedSkill);
    } else {
      player.skills.push(newSkill); // 混合スキル生成失敗時のみ
    }

    return;
  }

  // 通常スキル処理
  if (Math.random() < 0.1 && canMix) {
    const partnerSkill = player.skills[Math.floor(Math.random() * player.skills.length)];
    const mixedSkill = createMixedSkill(newSkill, partnerSkill);

    player.skills.push(mixedSkill);
    player.mixedSkills.push(mixedSkill);
    drawCombinedSkillList();
  } else {
    player.skills.push(newSkill); // 混合スキル生成失敗時のみ
  }
}

// ※既存のスキル取得処理の最後で onSkillAcquired(newSkill) が呼ばれるように組み込んでください。


/********************************
 * 混合スキルの発動処理
 ********************************/
function useMixedSkill(mixedSkill, user, target, log) {
  if (!mixedSkill || !user || !target || !log) return;

  if (mixedSkill.usedInBattle) {
    log.push(`※ ${mixedSkill.name} はこの戦闘で既に使用されています`);
    return;
  }

  mixedSkill.usedInBattle = true;
  if (mixedSkill.buttonElement) {
    mixedSkill.buttonElement.disabled = true;
    mixedSkill.buttonElement.classList.add("used");
  }

  const prob = mixedSkill.activationProb || 0;
  if (Math.random() >= prob) {
    log.push(`※ ${mixedSkill.name} は発動に失敗した！`);
    return;
  }

  log.push(`★ ${mixedSkill.name} を発動！（成功率 ${Math.floor(prob * 100)}%）`);

  // --- 特殊効果処理マップ ---
  const specialEffectHandlers = {
    1: (value) => {
      if (target.hp > 0) {
        const dmg = Math.floor(target.hp * (value / 100));
        target.hp -= dmg;
        log.push(`▶ 特殊効果: 敵に追加ダメージ ${dmg}（残りHPの${value}%）を与えた`);
      }
    },
    2: (value, skill) => {
      skill.reviveUsed = false;
      log.push(`▶ 特殊効果: 戦闘不能時に HP${value}% で復活する効果を付与（戦闘中1回）`);
    },
    3: (value) => {
      log.push(`▶ 特殊効果: 継続ダメージを受けた際に ${value}% 即時回復`);
    },
    4: (value) => {
      log.push(`▶ 特殊効果（発動時は無効）: 攻撃力 ${value}倍バフ（所持時に適用）`);
    },
    5: (value) => {
      log.push(`▶ 特殊効果（発動時は無効）: 防御力 ${value}倍バフ（所持時に適用）`);
    },
    6: (value) => {
      log.push(`▶ 特殊効果（発動時は無効）: 素早さ ${value}倍バフ（所持時に適用）`);
    },
    7: (value) => {
      log.push(`▶ 特殊効果（発動時は無効）: 最大HP ${value}倍バフ（所持時に適用）`);
    }
  };

  // --- 特殊効果を初期化（必要に応じて） ---
  function ensureSpecialEffects(skill) {
    if (!skill.specialEffects && skill.specialEffectType != null) {
      skill.specialEffects = [{
        type: skill.specialEffectType,
        value: skill.specialEffectValue
      }];
    }
  }

  // --- 特殊効果とスキル効果を再帰的に適用 ---
  function applySkillRecursive(skill) {
    if (!skill || target.hp <= 0) return;

    ensureSpecialEffects(skill);

    // 特殊効果発動
    if (Array.isArray(skill.specialEffects)) {
      for (const effect of skill.specialEffects) {
        const handler = specialEffectHandlers[effect.type];
        if (typeof handler === "function") {
          handler(effect.value, skill);
        }
      }
    }

    // 持続効果の有効フラグ
    skill.specialEffectActive = skill.specialEffects?.some(e =>
      [2, 3].includes(e.type)
    );

    // スキル効果発動
    if (skill.isMixed && Array.isArray(skill.baseSkills)) {
      for (const base of skill.baseSkills) {
        applySkillRecursive(base);  // 再帰呼び出し
      }
    } else {
      getSkillEffect(skill, user, target, log);
    }
  }

  applySkillRecursive(mixedSkill);
}



function showSpecialEffectDetail(mixedSkill, event) {
  const existingPopup = document.getElementById("effect-popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.id = "effect-popup";
  popup.className = "effect-popup";

  let detailText = "";

  function buildSkillDetail(skill, depth = 0) {
    const indent = "　".repeat(depth); // 全角スペース

    // 🔍 デバッグ出力：スキル構造確認
   // console.log(`\n[DEBUG] Depth ${depth}`);
    //console.log("Skill Name:", skill.name);
    //console.log("isMixed:", skill.isMixed);
    //console.log("specialEffects:", skill.specialEffects);
    //console.log("baseSkills:", skill.baseSkills);

    if (depth === 0 && skill.isProtected) {
      detailText += `🔒 【保護中のスキル】\n`;
    }

    const name = skill.name || "(不明)";
    const level = skill.level ?? "?";

    // 最上位のみRANK表示
    if (depth === 0) {
      const star = skill.starRating || "";
      const rank = skill.rarityClass?.replace("skill-rank-", "").toUpperCase() || "-";
      const prob = skill.activationProb ? Math.floor(skill.activationProb * 100) : 0;
      detailText += `【${star} / RANK: ${rank}】\n`;
      detailText += `${name}（Lv${level}｜発動率: ${prob}%）\n`;
    } else {
      detailText += `${indent}${name}（Lv${level}）\n`;
    }

    // 特殊効果（混合スキルのみ）
    if (skill.isMixed && Array.isArray(skill.specialEffects)) {
      for (const eff of skill.specialEffects) {
        switch (eff.type) {
          case 1: detailText += `${indent}▶ 特殊効果: 敵の残りHPの${eff.value}%分の追加ダメージ\n`; break;
          case 2: detailText += `${indent}▶ 特殊効果: 戦闘不能時にHP${eff.value}%で自動復活\n`; break;
          case 3: detailText += `${indent}▶ 特殊効果: 継続ダメージ時に${eff.value}%即時回復\n`; break;
          case 4: detailText += `${indent}▶ 特殊効果: 攻撃力 ${eff.value}倍（所持時バフ）\n`; break;
          case 5: detailText += `${indent}▶ 特殊効果: 防御力 ${eff.value}倍（所持時バフ）\n`; break;
          case 6: detailText += `${indent}▶ 特殊効果: 素早さ ${eff.value}倍（所持時バフ）\n`; break;
          case 7: detailText += `${indent}▶ 特殊効果: 最大HP ${eff.value}倍（所持時バフ）\n`; break;
          default: detailText += `${indent}▶ 特殊効果: 不明な効果 type=${eff.type}\n`;
        }
      }
    }

    // 構成スキル
    if (Array.isArray(skill.baseSkills) && skill.baseSkills.length > 0) {
      detailText += `${indent}▼ 構成スキル:\n`;
      for (const base of skill.baseSkills) {
        buildSkillDetail(base, depth + 1);
      }
    }
  }

  buildSkillDetail(mixedSkill);

  popup.textContent = detailText;

  // --- スタイル設定 ---
  popup.style.position = "absolute";
  popup.style.left = `10px`;
  popup.style.top = `${(event?.pageY || 0) + 10}px`;
  popup.style.padding = "12px 16px";
  popup.style.background = "rgba(0, 0, 0, 0.6)";
  popup.style.color = "#fff";
  popup.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  popup.style.borderRadius = "8px";
  popup.style.fontSize = "14px";
  popup.style.whiteSpace = "pre-line";
  popup.style.overflowWrap = "break-word";
  popup.style.backdropFilter = "blur(6px)";
  popup.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.5)";
  popup.style.zIndex = "9999";
  popup.style.opacity = "0";
  popup.style.transition = "opacity 0.3s ease";
  popup.style.minWidth = "420px";
  popup.style.maxWidth = "800px";
  popup.style.width = "fit-content";

  if (mixedSkill.isProtected) {
    popup.style.border = "2px solid gold";
    popup.style.boxShadow = "0 0 12px gold";
  }

  popup.onclick = () => popup.remove();
  document.body.appendChild(popup);
  requestAnimationFrame(() => popup.style.opacity = "1");

  setTimeout(() => {
    if (popup.parentNode) {
      popup.style.opacity = "0";
      setTimeout(() => popup.remove(), 300);
    }
  }, 4000);
}

// 戦闘開始時に混合スキル使用状態をリセットする関数（各戦闘の最初に呼び出す）
function resetMixedSkillUsage() {
  if (!player || !Array.isArray(player.mixedSkills)) return;

  for (const mSkill of player.mixedSkills) {
    if (!mSkill || typeof mSkill !== 'object') continue;

    mSkill.usedInBattle = false;
    mSkill.used = false;
    mSkill.specialEffectActive = false;
    mSkill.reviveUsed = false;

    if (mSkill.buttonElement) {
      mSkill.buttonElement.disabled = false;
      mSkill.buttonElement.classList.remove("used");
    }
  }

  // ★ ステータスバフのリセット
  player.tempEffects = {};
}

// ※戦闘開始処理の中で resetMixedSkillUsage() を呼び出し、前の戦闘からの使用済みフラグや特殊効果をクリアしてください。
// （混合スキルの特殊効果は戦闘ごとの効果のため、戦闘終了時や次の戦闘開始時にリセットします）




function updateFaceCoinDisplay() {
  const coinElem = document.getElementById('faceCoinCount');
  if (coinElem) coinElem.textContent = faceCoins;

  const gachaBtn = document.getElementById('faceGachaBtn');
  if (gachaBtn) gachaBtn.disabled = (faceCoins < FACE_GACHA_COST);
}

function drawRandomFace(rarity) {
  const pool = IMAGE_LIST_BY_RANK?.[rarity] || [];
  if (pool.length === 0) return null;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return {
    path: `face/${rarity}/${selected}`,
    name: selected
  };
}

function showGachaAnimation(rarity) {
  const container = document.createElement('div');
  container.id = 'gachaAnimation';

  const body = document.createElement('div');
  body.className = 'gacha-body';

  const knob = document.createElement('div');
  knob.className = 'gacha-knob';

  const ball = document.createElement('div');
  ball.className = 'gacha-ball';
  ball.classList.add(rarity);  // ← レアリティに応じたクラス追加！

  body.appendChild(knob);
  container.appendChild(body);
  container.appendChild(ball);
  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 2000);
}


function performFaceGacha() {
  if (faceCoins < FACE_GACHA_COST) {
    alert(`コインが${FACE_GACHA_COST}枚必要です！現在のコイン：${faceCoins}`);
    return;
  }

  if (faceItemsOwned.length >= 100) {
    alert("所持フェイスアイテムが上限に達しています。");
    return;
  }

  // コイン消費
  faceCoins -= FACE_GACHA_COST;
  updateFaceCoinDisplay();

  // --- 動的に補正された確率でランク抽選 ---
  const baseProbs = {
    S: 0.001,
    A: 0.004,
    B: 0.045,
    C: 0.05,
    D: 0.90
  };

  const streak = window.currentStreak || 0;
  const bonusFactor = Math.min(1 + streak * 0.05, 2.0); // 最大2倍まで補正

  let adjustedProbs = {
    S: baseProbs.S * bonusFactor,
    A: baseProbs.A * bonusFactor,
    B: baseProbs.B * (1 + (bonusFactor - 1) * 0.5),
    C: baseProbs.C * (1 - (bonusFactor - 1) * 0.3),
    D: baseProbs.D * (1 - (bonusFactor - 1) * 0.7)
  };

  // 再正規化
  const total = Object.values(adjustedProbs).reduce((a, b) => a + b, 0);
  for (const key in adjustedProbs) {
    adjustedProbs[key] /= total;
  }

  // 抽選処理
  let rand = Math.random();
  let cumProb = 0;
  let selectedRarity = 'D';
  for (const r of ['S', 'A', 'B', 'C', 'D']) {
    cumProb += adjustedProbs[r];
    if (rand < cumProb) {
      selectedRarity = r;
      break;
    }
  }

  // ガチャ演出
  showGachaAnimation(selectedRarity);

  setTimeout(() => {
    const result = drawRandomFace(selectedRarity);
    if (!result) {
      alert(`${selectedRarity}ランクのフェイスアイテムが読み込めませんでした`);
      return;
    }

    const { path, name } = result;
    faceItemsOwned.push(path);
    updateFaceUI();
  }, 1400);
}


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

function cleanUpAllMixedSkills() {
  if (!player || !Array.isArray(player.mixedSkills)) return;

  // ✅ null や undefined を除去してから処理開始
  player.mixedSkills = player.mixedSkills.filter(skill => skill && typeof skill === 'object');

  // 保護されていない混合スキルのみを削除対象にする
  const toRemove = player.mixedSkills.filter(skill => !skill.isProtected);

  // mixedSkills 配列から削除
  player.mixedSkills = player.mixedSkills.filter(skill => skill.isProtected);

  // player.skills 配列から、削除対象の混合スキルを除去
  player.skills = player.skills.filter(skill => {
    if (!skill || !skill.isMixed) return true;
    return !toRemove.some(s => s && s.name === skill.name);
  });

  // skillMemory からも削除（名前一致で）
  if (player.skillMemory) {
    for (const s of toRemove) {
      if (s?.name && player.skillMemory[s.name]) {
        delete player.skillMemory[s.name];
      }
    }
  }

  // ✅ 念のため残った mixedSkills も null 除去（保護対象含め）
  player.mixedSkills = player.mixedSkills.filter(skill => skill && typeof skill === 'object');

  // UI再描画
  if (typeof syncSkillsUI === "function") {
    syncSkillsUI();
  } else {
    if (typeof drawCombinedSkillList === "function") drawCombinedSkillList();
    if (typeof drawSkillMemoryList === "function") drawSkillMemoryList();
    if (typeof drawSkillList === "function") drawSkillList();
  }
}

function createMixedSkillProtectionUI(containerId = "protect-skill-ui") {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 初期化
  container.innerHTML = "";

  const label = document.createElement("label");
  label.textContent = "混合スキルを保護：";
  container.appendChild(label);

  const select = document.createElement("select");
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- スキルを選択 --";
  select.appendChild(defaultOption);

  for (const skill of player.mixedSkills || []) {
    const option = document.createElement("option");
    option.value = skill.name;
    option.textContent = skill.name + (skill.isProtected ? "（保護中）" : "");
    select.appendChild(option);
  }

  container.appendChild(select);

  // 保護切り替えボタン
  const button = document.createElement("button");
  button.textContent = "保護/解除";
  button.onclick = () => {
    const name = select.value;
    const target = player.mixedSkills.find(s => s.name === name);
    if (target) {
      target.isProtected = !target.isProtected;
      alert(`${target.name} を${target.isProtected ? "保護しました" : "解除しました"}`);
      createMixedSkillProtectionUI(containerId); // UI 再描画
      if (typeof drawCombinedSkillList === "function") drawCombinedSkillList();
    }
  };
  container.appendChild(button);
}

// うまく1つを残せないため保留
function cleanUpMixedSkillsExceptOne() {
  if (!player || !Array.isArray(player.mixedSkills) || player.mixedSkills.length === 0) return;

  // ランダムに1つ残す混合スキルを選択
  const skillToKeep = player.mixedSkills[Math.floor(Math.random() * player.mixedSkills.length)];

  // 混合スキル以外を削除（player.mixedSkills）
  const toRemove = player.mixedSkills.filter(s => s !== skillToKeep);
  player.mixedSkills = [skillToKeep];

  // skills から isMixed 且つ削除対象のものを除外
  player.skills = player.skills.filter(s => !s.isMixed || s === skillToKeep);

  // skillMemory からも除去
  if (player.skillMemory) {
    for (const s of toRemove) {
      if (s.name && player.skillMemory[s.name]) {
        delete player.skillMemory[s.name];
      }
    }
  }

  // UI を再描画
  if (typeof drawCombinedSkillList === "function") drawCombinedSkillList();

}

function drawCombinedSkillList() {
  const list = document.getElementById("combinedSkillList");
  if (!player || !player.mixedSkills || !list) return;

  list.innerHTML = "";

  player.mixedSkills.forEach(skill => {
    const li = document.createElement("li");
    li.className = "skill-entry";

    const activation = skill.activationRate ?? skill.activationProb ?? 0;
    const activationPercent = Math.round(activation * 100);

    li.textContent = `${skill.starRating || ""} ${skill.name}（Lv: ${skill.level}｜発動率: ${activationPercent}%）`;

    if (skill.rarityClass) {
      li.classList.add(skill.rarityClass);
    }

    if (skill.isProtected) {
      li.textContent += "【保護】";
      li.style.textShadow = "0 0 5px gold";
    }

    // --- クリックイベント ---
    li.onclick = (event) => {
      const alreadyProtected = player.mixedSkills.find(s => s.isProtected);
      const isDoubleClick = (window.lastSelectedSkill === skill);
      window.lastSelectedSkill = skill;

      // 常に効果説明は表示
      if (typeof showSpecialEffectDetail === "function") {
        showSpecialEffectDetail(skill, event);
      }

      // 1回目のクリックは説明表示のみ
      if (!isDoubleClick) return;

      // --- 保護解除 ---
      if (skill.isProtected) {
        const confirmed = confirm(`${skill.name} の保護を解除しますか？`);
        if (confirmed) {
          skill.isProtected = false;
          window.lastSelectedSkill = null;
          drawCombinedSkillList();
        }
        return;
      }

      // --- 保護移し替え ---
      if (alreadyProtected && alreadyProtected !== skill) {
        const confirmed = confirm(
          `既に「${alreadyProtected.name}」が保護されています。\nその保護を解除して「${skill.name}」を保護しますか？`
        );
        if (confirmed) {
          alreadyProtected.isProtected = false;
          skill.isProtected = true;
          window.lastSelectedSkill = null;
          drawCombinedSkillList();
        }
        return;
      }

      // --- 新規保護 ---
      const confirmed = confirm(`${skill.name} を保護しますか？`);
      if (confirmed) {
        skill.isProtected = true;
        window.lastSelectedSkill = null;
        drawCombinedSkillList();
      }
    };

    list.appendChild(li);
  });
}

function syncSkillsUI() {
  if (typeof drawSkillMemoryList === "function") drawSkillMemoryList();
  if (typeof drawCombinedSkillList === "function") drawCombinedSkillList();
  if (typeof drawItemMemoryList === "function") drawItemMemoryList();
  if (typeof createMixedSkillProtectionUI === "function") {
    createMixedSkillProtectionUI();
  }
}

document.addEventListener('DOMContentLoaded', setupToggleButtons);

function hasOffensiveSkill(char) {
    return char.skills.some(sk => {
        const data = skillPool.find(s => s.name === sk.name);
        return window.offensiveSkillCategories.includes(data?.category);
    });
}

function clearPassiveStatBuffs(player) {
  const stats = ['attack', 'defense', 'speed', 'maxHp'];
  for (const stat of stats) {
    const base = player.baseStats?.[stat] || 0;
    const growth = player.growthBonus?.[stat] || 0;
    player[stat] = base + growth;
  }
  player.hp = Math.min(player.hp, player.maxHp);
}



function decideSkillsToUse(actor, maxActivations) {
    if (!actor.usedSkillNames) actor.usedSkillNames = new Set();

		const usableSkills = actor.skills.filter(skill => {
		    const data = skillPool.find(s => s.name === skill.name);
		    const isPassive = data?.category === 'passive';
		
		    // 発動済みの混合スキルは除外
		    if (skill.isMixed && skill.usedInBattle) return false;
		
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
  // 新規スタートボタンのイベント登録
	
	updateLocalSaveButton();




(function injectBattleStatusCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .battle-status-display {
      position: fixed;
      top: 10px;
      right: 10px;
      font-size: 12px;
      color: #f0f0f0;
      background: rgba(30, 30, 30, 0.6);
      backdrop-filter: blur(6px);
      padding: 10px 16px;
      border-left: 4px solid #4caf50;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      z-index: 1000;
      white-space: pre-wrap;
      line-height: 1.5;
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      max-width: 280px;
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fade-in {
      animation: fadeInUp 0.6s ease-out;
    }
  `;
  document.head.appendChild(style);
})();

const toggle = document.getElementById('memoryToggle');
const content = document.getElementById('memoryContent');

if (toggle && content) {
    toggle.addEventListener('click', () => {
      const isVisible = content.style.display !== 'none';
      content.style.display = isVisible ? 'none' : 'block';
      toggle.textContent = isVisible ? '▶ アイテム・スキル表示／非表示' : '▼ アイテム・スキル表示／非表示';
    });
}
  const eventSettingsToggleBtn = document.getElementById('eventSettingsToggle');
  const eventSettingsContentBox = document.getElementById('eventSettingsContent');

  if (eventSettingsToggleBtn && eventSettingsContentBox) {
    eventSettingsToggleBtn.addEventListener('click', () => {
      const isCurrentlyVisible = eventSettingsContentBox.style.display !== 'none';
      eventSettingsContentBox.style.display = isCurrentlyVisible ? 'none' : 'block';
      eventSettingsToggleBtn.textContent = isCurrentlyVisible
        ? '▶ イベント＆入手設定を表示／非表示'
        : '▼ イベント＆入手設定を表示／非表示';
    });
  }



  // === フェイスアイテムUIの構築 ===
	
(function injectBattleStatusCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .battle-status-display {
      position: fixed;
      top: 10px;
      right: 10px;
      font-size: 12px;
      color: #f0f0f0;
      background: rgba(30, 30, 30, 0.6);
      backdrop-filter: blur(6px);
      padding: 10px 16px;
      border-left: 4px solid #4caf50;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      z-index: 1000;
      white-space: pre-wrap;
      line-height: 1.5;
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      max-width: 280px;
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fade-in {
      animation: fadeInUp 0.6s ease-out;
    }
  `;
  document.head.appendChild(style);
})();

	
// ガチャボタンイベント登録
const gachaBtn = document.getElementById('faceGachaBtn');
if (gachaBtn) {
  gachaBtn.addEventListener('click', () => {

    setTimeout(() => {
      performFaceGacha(); // 1.5秒後にガチャ処理を実行
    }, 100);
  });
}

  // 初期表示更新（ロードや開始時）
  updateFaceUI?.();
  updatePlayerImage?.();
  updateFaceCoinDisplay?.();
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

  if (!char.baseStats || typeof char.baseStats[stat] !== 'number') return 0;

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

function onItemClick(item, index, event) {
  clearEventPopup();

  const name = `${item.color}${item.adjective}${item.noun}`;
  const popup = document.getElementById("eventPopup");
  const title = document.getElementById("eventPopupTitle");
  const container = document.getElementById("eventPopupOptions");

  title.innerHTML = `アイテム <b>${name}</b> をどうする？`;

  const protectBtn = document.createElement("button");
  protectBtn.textContent = item.protected ? "保護を外す" : "保護する";
  protectBtn.onclick = () => {
    if (!item.protected && player.itemMemory.some(it => it.protected)) {
      showCustomAlert("保護は1つまでです", 2000);
      return;
    }
    item.protected = !item.protected;
    clearEventPopup();
    drawItemMemoryList();
  };
  container.appendChild(protectBtn);

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

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "キャンセル";
  cancelBtn.onclick = () => {
    showCustomAlert("キャンセルしました", 1500);
    clearEventPopup();
  };
  container.appendChild(cancelBtn);

	// クリック位置のY座標に合わせる
	const y = event.clientY + window.scrollY;
	
	// Xは常に中央に（画面幅の50%）
	popup.style.position = "absolute";
	popup.style.top = `${y}px`;
	popup.style.left = "50%";
	popup.style.transform = "translateX(-50%)";
	popup.style.display = "block";
}

// --- 所持アイテムリストをUIに表示・更新する関数 ---
function updateFaceUI() {
  const listElem = document.getElementById('ownedFaceList');
  listElem.innerHTML = ''; // 既存内容をクリア

  faceItemsOwned.forEach(itemPath => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.marginBottom = '8px';

    // アイテム画像サムネイル
    const img = document.createElement('img');
    img.src = itemPath;
    img.style.width = '50px';
    img.style.height = '50px';
    img.style.marginRight = '10px';
    // 装備中なら枠を強調
    if (faceItemEquipped === itemPath) {
      img.style.border = '2px solid gold';
    } else {
      img.style.border = '2px solid transparent';
    }
    container.appendChild(img);

    // 装備/解除ボタン
    const equipBtn = document.createElement('button');
    equipBtn.innerText = (faceItemEquipped === itemPath) ? '解除' : '装備';
    equipBtn.style.marginRight = '5px';
    equipBtn.addEventListener('click', () => {
	  if (faceItemEquipped === itemPath) {
	    faceItemEquipped = null;
	  } else {
	    // 他の装備を解除（背景・画像を消去）
	    document.getElementById('faceItemDisplayImg')?.remove();
	    document.getElementById('faceItemGlowBg')?.remove();
	    
	    faceItemEquipped = itemPath;
	  }
  
	  updateFaceUI();
	  updatePlayerImage();

    });
    container.appendChild(equipBtn);

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = '削除';
    deleteBtn.addEventListener('click', () => {
      // 所持リストから削除
      const idx = faceItemsOwned.indexOf(itemPath);
      if (idx !== -1) {
        faceItemsOwned.splice(idx, 1);
      }
      // 装備中のアイテムだったら解除
      if (faceItemEquipped === itemPath) {
        faceItemEquipped = null;
      }
      updateFaceUI();
      updatePlayerImage();
    });
    container.appendChild(deleteBtn);

    listElem.appendChild(container);
		
		  // コイン数を更新（UIに反映）
  const coinElem = document.getElementById('faceCoinCount');
  if (coinElem) {
    coinElem.innerText = faceCoins;
  }
	
const gachaBtn = document.getElementById('faceGachaBtn');
if (gachaBtn) {
  gachaBtn.disabled = faceCoins < FACE_GACHA_COST;
}
	
  });
}



// ------------------------
// 定数：ステンドグラスの形状
// ------------------------
const stainedGlassStyles = [
  { clipPath: "polygon(0% 0%, 90% 10%, 80% 100%, 10% 90%)" },
  { clipPath: "polygon(10% 10%, 95% 5%, 85% 95%, 5% 85%)" },
  { clipPath: "polygon(5% 0%, 95% 15%, 85% 100%, 10% 85%)" },
  { clipPath: "polygon(0% 30%, 100% 0%, 90% 100%, 10% 90%)" },
  { clipPath: "polygon(10% 10%, 100% 30%, 70% 100%, 0% 80%)" }
];

// ------------------------
// スタイル追加（1度だけ）
// ------------------------
function ensureGlowBorderStyle() {
  if (!document.getElementById('glowBorderStyle')) {
    const style = document.createElement('style');
    style.id = 'glowBorderStyle';
    style.textContent = `
      @keyframes glowBorder {
        0% {
          box-shadow: 0 0 10px white, 0 0 5px rgba(255,255,255,0.6);
          border-color: white;
        }
        50% {
          box-shadow:
            0 0 20px white,
            0 0 40px rgba(255, 0, 255, 0.5),
            0 0 60px rgba(0, 255, 255, 0.5),
            0 0 30px rgba(255, 255, 0, 0.4);
          border-image: linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet) 1;
          border-color: transparent;
        }
        100% {
          box-shadow: 0 0 10px white, 0 0 5px rgba(255,255,255,0.6);
          border-color: white;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// ------------------------
// 背景エフェクトの生成
// ------------------------
function ensureFaceItemGlowBackground(canvas) {
  const displayBottom = '100px';
  const displayRight = '30px';

  let bg = document.getElementById('faceItemGlowBg');
  if (!bg) {
    bg = document.createElement('div');
    bg.id = 'faceItemGlowBg';
    Object.assign(bg.style, {
      position: 'absolute',
      bottom: displayBottom,
      right: displayRight,
      width: '120px',
      height: '120px',
      pointerEvents: 'none',
      zIndex: '9998',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.05)',
      filter: 'brightness(1.2) saturate(1.8)',
      mixBlendMode: 'normal',
      border: '2px solid white',
      borderRadius: '8px',
      animation: 'glowBorder 5s ease-in-out infinite'
    });
    if (canvas?.parentNode) canvas.parentNode.insertBefore(bg, canvas.nextSibling);
  }
  return bg;
}

// ------------------------
// レアリティによる画像エフェクト
// ------------------------
function applyFaceItemEffects(imgElement, rarity) {
  imgElement.className = '';
  imgElement.style.filter = 'none';
  switch (rarity) {
    case 'S': imgElement.classList.add('rarity-s'); break;
    case 'A': imgElement.style.filter = 'drop-shadow(0 0 10px #FFD700)'; break;
    case 'B': imgElement.style.filter = 'drop-shadow(0 0 8px #3399ff)'; break;
    case 'C': imgElement.style.filter = 'drop-shadow(0 0 6px #33cc33)'; break;
    case 'D': imgElement.style.filter = 'drop-shadow(0 0 4px #999999)'; break;
  }
  Object.assign(imgElement.style, {
    border: '1px solid transparent',
    borderImage: 'linear-gradient(45deg, #d4af37, #b8860b, #f9d71c) 1',
    boxShadow: '0 0 16px rgba(255, 215, 0, 0.5), 0 0 8px rgba(255, 215, 0, 0.3) inset'
  });
}

// ------------------------
// 背景アニメーション開始
// ------------------------
function startFaceItemGlowAnimation() {
  if (!window.faceItemGlowInterval) {
    window.faceItemGlowInterval = setInterval(() => {
      const bg = document.getElementById('faceItemGlowBg');
      if (!bg) return;
      const style = stainedGlassStyles[Math.floor(Math.random() * stainedGlassStyles.length)];
      bg.style.clipPath = style.clipPath;
      bg.style.transition = 'clip-path 1.2s ease-in-out';
    }, 2000);
  }
}

// ------------------------
// 画像更新関数（差し替え）
// ------------------------
function updatePlayerImage() {
  const canvas = document.getElementById('playerCanvas');
  ensureGlowBorderStyle();
  const bg = ensureFaceItemGlowBackground(canvas);
  startFaceItemGlowAnimation();

  if (faceItemEquipped) {
    canvas.style.display = 'none';
    let img = document.getElementById('faceItemDisplayImg');
    if (!img) {
      img = document.createElement('img');
      img.id = 'faceItemDisplayImg';
      Object.assign(img.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center',
        pointerEvents: 'none',
        background: 'transparent',
        borderRadius: '2px',
        zIndex: '9999'
      });
      bg.appendChild(img);
    } else {
      canvas.style.display = 'block';
    }

    img.src = faceItemEquipped;
    const rarity = faceItemEquipped.match(/[SABCD]/)?.[0];
    applyFaceItemEffects(img, rarity);
  } else {
    if (canvas) canvas.style.display = 'block';
    document.getElementById('faceItemDisplayImg')?.remove();
    document.getElementById('faceItemGlowBg')?.remove();
  }
}

// ------------------------
// スクロール時の非表示・復帰
// ------------------------
let scrollTimeout;
window.addEventListener('scroll', () => {
  document.getElementById('faceOverlay')?.classList.add('hidden');
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (faceItemEquipped) {
      document.getElementById('faceOverlay')?.classList.remove('hidden');
    }
  }, 300);
});

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

  // ★ 一度中身をクリアしてから追加
  if (colorBox) colorBox.innerHTML = '';
  if (adjBox) adjBox.innerHTML = '';
  if (nounBox) nounBox.innerHTML = '';

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
	
	  const toggle = document.getElementById('faceMemoryToggle');
    const content = document.getElementById('faceMemoryContent');

    toggle.addEventListener('click', () => {
      const isOpen = content.style.display === 'block';
      content.style.display = isOpen ? 'none' : 'block';
      toggle.textContent = isOpen ? '▶ フェイスメモリーを表示' : '▼ フェイスメモリーを非表示';
    });
	
	const deathChar = document.getElementById('deathChar');
  if (!deathChar) return;

  function animateDeathChar() {
    deathChar.classList.add('shake-and-grow');

    // 3秒後にアニメーションを除去
    setTimeout(() => {
      deathChar.classList.remove('shake-and-grow');
    }, 3000);

    // 10〜13秒おきに再発動
    setTimeout(animateDeathChar, 5000 + Math.random() * 3000);
  }

  // 初回のアニメーションは2秒後に開始
  setTimeout(animateDeathChar, 2000);
	
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
window.currentStreak = 0;
window.sessionMaxStreak = 0;
let streakBonus = 1;
let skillSimulCount = 2;
let hpHistory = [];
let sslot = 0;
let isLoadedFromSave = false;
let isAutoBattle = false; // ← 長押し中を表すフラグ


// --- フェイスアイテム機能用の定数・変数（ファイル先頭付近に追加） ---
// フェイスコイン獲得確率 (勝利時)
const FACE_COIN_DROP_RATE = 0.5;
// ガチャに必要なコイン枚数
const FACE_GACHA_COST = 1000;
// ランクごとの出現確率 (合計1.00になるよう調整)

window.faceCoins = 1000;
window.faceItemsOwned = [];       // 例: ['face/S/face1.png', ...]
window.faceItemEquipped = null;   // 例: 'face/A/face3.png'
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

 // const logEl = document.getElementById('battleLog');
//  logEl.textContent += `\n成長: ${stat} が 敵の${stat}の8%（+${growthAmount}, ボーナス倍率x${window.growthMultiplier}）上昇\n`;

  window.growthMultiplier = 1;  // リセット
  isWaitingGrowth = false;
};

window.skipGrowth = function() {
  window.growthMultiplier = Math.min(window.growthMultiplier * 2, 256);
//  const logEl = document.getElementById('battleLog');
//  logEl.textContent += `\n今回は成長をスキップ。次回成長値は倍率x${window.growthMultiplier}になります（最大256倍）。\n`;

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
	
	 // window.isFirstBattle = true;
	 //ガイド いるならtrueに
	  window.isFirstBattle = false;
		const battleBtn = document.getElementById("startBattleBtn");
		if (battleBtn && battleBtn.classList.contains("hidden")) {
		  battleBtn.classList.remove("hidden");
		}

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
updateRemainingBattleDisplay();
            }
        }
        // ★ 初期化処理ここまで

        // 初回の戦闘を開始

        updateStats();

        window.startBattle();
				
				updateFaceUI();
				
    }, 500);
};

// 対戦モード選択画面表示
window.showBattleMode = function() {
  document.getElementById('vsMode').classList.remove('hidden');
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
    if (window.barrierUsesLeft > 0) {
      window.barrierUsesLeft--;
      log.push(`${displayName(player.name)}は、不思議な結界に守られている！（残り${window.barrierUsesLeft}回）`);
      log.push(`${displayName(user.name)}のスキル「${skill.name}」は発動失敗した！`);
      return; // 発動処理を中止
    }
  }
}

  let statusLogged = false;
  let totalDamage = 0;
    skill.uses = (skill.uses || 0) + 1;
    let skillData = skillPool.find(sk => sk.name === skill.name);
    // 混合スキルは静的データがないため特別処理
    if (!skillData) {
        if (skill.isMixed) {
            skillData = { category: 'mixed' };  // ダミーのスキルデータでカテゴリーを指定
        } else {
            return log;
        }
    }
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
      syncSkillsUI();
    }
  }
}
  // ダメージ実績を記録
    user.battleStats[skill.name] = (user.battleStats[skill.name] || 0) + totalDamage;
    return log;
};
function checkReviveOnDeath(character, log) {
  if (character.hp > 0 || !character.mixedSkills) return false;

  // 使用可能な復活効果をすべて抽出
  const availableRevives = [];

  for (const mSkill of character.mixedSkills) {
    const effects = mSkill.specialEffects || [];

    for (const eff of effects) {
      if (eff.type === 2 && !eff.used && mSkill.usedInBattle) {
        availableRevives.push({ skill: mSkill, effect: eff });
      }
    }
  }

  // 使用可能なものがない場合
  if (availableRevives.length === 0) return false;

  // 効果値が最も高いものを使用
  const best = availableRevives.reduce((a, b) =>
    a.effect.value > b.effect.value ? a : b
  );

  const { skill: bestSkill, effect: reviveEffect } = best;
  const reviveHP = Math.floor(character.maxHp * (reviveEffect.value / 100));
  character.hp = Math.max(reviveHP, 1);
  reviveEffect.used = true;

  // 継続効果フラグ更新（type 3）
  bestSkill.specialEffectActive = bestSkill.specialEffects?.some(
    e => e.type === 3 && !e.used
  );

  // 残りの未使用復活数を数える
  const remaining = availableRevives.filter(r => r !== best).length;

  if (log && typeof log.push === "function") {
    log.push(`※ ${displayName(bestSkill.name)}の効果で${displayName(character.name)}が復活！（HP${reviveEffect.value}%、残り${remaining}）`);
  }

  return true;
}


function handlePoisonBurnDamage(character, damage, log) {
  if (damage <= 0 || !character.mixedSkills) return;

  let totalHealPercent = 0;

  // 使用中のスキルの即時回復効果（type 3）を集計
  for (const mSkill of character.mixedSkills) {
    if (!mSkill.usedInBattle || !Array.isArray(mSkill.specialEffects)) continue;

    for (const effect of mSkill.specialEffects) {
      if (effect.type === 3 && !effect.used) {
        totalHealPercent += effect.value;
      }
    }
  }

  // 合計回復率から回復量を算出
  if (totalHealPercent > 0) {
    const healAmount = Math.floor(damage * (totalHealPercent / 100));
    if (healAmount > 0) {
      character.hp = Math.min(character.maxHp, character.hp + healAmount);
      if (log && typeof log.push === "function") {
        log.push(`※ 継続ダメージ ${damage} に対し、混合スキルの効果で ${healAmount} HP 即時回復（合計 ${totalHealPercent}%）`);
      }
    }
  }
}





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

window.applyPassiveStatBuffsFromSkills = function(player, log = window.log) {
  const statTypeMap = {
    4: 'attack',
    5: 'defense',
    6: 'speed',
    7: 'maxHp'
  };

  player.tempEffects = {}; // リセット

  function applyBuffsRecursively(skill) {
    if (!skill || typeof skill !== 'object') return; // ← null/undefined 対策

    const type = skill.specialEffectType;
    const value = skill.specialEffectValue;

    if ([4, 5, 6, 7].includes(type)) {
      const stat = statTypeMap[type];

      const base = (player.baseStats && typeof player.baseStats[stat] === 'number') ? player.baseStats[stat] : 0;
      const growth = (player.growthBonus && typeof player.growthBonus[stat] === 'number') ? player.growthBonus[stat] : 0;
      const prevMultiplier = player.tempEffects[stat + 'Mod'] || 1;
      const before = (base + growth) * prevMultiplier;

      const newMultiplier = prevMultiplier * value;
      player.tempEffects[stat + 'Mod'] = newMultiplier;

      const after = (base + growth) * newMultiplier;

      if (log && Array.isArray(log)) {
        log.push(`◎ ${skill.name} により ${stat} が ${value} 倍に増加`);
        log.push(`${stat.toUpperCase()}：${Math.floor(before)} → ${Math.floor(after)}`);
      }

      if (stat === 'maxHp') {
        player.maxHp = Math.floor(after);
        player.hp = player.maxHp;
      }
    }

    if (Array.isArray(skill.baseSkills)) {
      for (const child of skill.baseSkills) {
        applyBuffsRecursively(child);
      }
    }
  }

  for (const skill of player.mixedSkills || []) {
    applyBuffsRecursively(skill);
  }
};

// バトル開始処理（1戦ごと）
window.startBattle = function() {
		//戦闘ログはここに入れる
	window.log = [];

    if (window.specialMode === 'brutal') {
    skillSimulCount = 1; // 鬼畜モードでは強制的に1に固定
		}

window.barrierUsesLeft = 5;

resetMixedSkillUsage();

if (player.baseStats && player.growthBonus) {
  player.attack = player.baseStats.attack + player.growthBonus.attack;
  player.defense = player.baseStats.defense + player.growthBonus.defense;
  player.speed = player.baseStats.speed + player.growthBonus.speed;
  player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
  player.hp = player.maxHp;

  // ★ ここに追加！
	window.applyPassiveStatBuffsFromSkills(player, log);
}


// 戦闘開始時の混合スキル状態リセット
for (const mSkill of player.mixedSkills || []) {
  if (!mSkill || typeof mSkill !== 'object') continue;

  mSkill.usedInBattle = false;
  mSkill.specialEffectActive = false;

  // 各特殊効果の使用フラグをリセット
  if (Array.isArray(mSkill.specialEffects)) {
    mSkill.specialEffects.forEach(effect => {
      if (effect && effect.type === 2) {
        effect.used = false;
      }
    });
  }
}

markLocalSaveDirty();

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
syncSkillsUI();

  window.eventTriggered = false;

  const customAlertVisible = document.getElementById('eventPopup').style.display === 'block';

if (isWaitingGrowth) {
  isWaitingGrowth = false;

  // 連勝率の計算
  const streakRatio = Math.min(window.currentStreak / window.sessionMaxStreak, 1.0);

  // skipの重み（低いほどskipが優先される）
  // streakRatioが0なら weight=10、1なら weight=1（高いほど選ばれにくく）
  const skipWeight = 1 + 9 * streakRatio; // 1〜10
  const normalWeight = 1;

  const growthOptions = [
    { label: "攻撃を上げる", value: 'attack', weight: normalWeight },
    { label: "防御を上げる", value: 'defense', weight: normalWeight },
    { label: "速度を上げる", value: 'speed', weight: normalWeight },
    { label: "HPを上げる", value: 'maxHp', weight: normalWeight },
    {
      label: `今回は選ばない（次回成長値x${Math.min(window.growthMultiplier * 2, 256)}）`,
      value: 'skip',
      weight: skipWeight
    }
  ];

  // 重み付きランダム選択
  const totalWeight = growthOptions.reduce((sum, opt) => sum + opt.weight, 0);
  let rand = Math.random() * totalWeight;
  let selected = growthOptions.find(opt => {
    if (rand < opt.weight) return true;
    rand -= opt.weight;
    return false;
  });

  const selectedValue = selected.value;

  // ✅ 成長処理
  if (selectedValue === 'skip') {
    window.skipGrowth(); // 成長倍率だけを増やす
  } else {
    window.chooseGrowth(selectedValue); // ステータス成長処理
  }

  clearEventPopup();

  const popup = document.getElementById("eventPopup");
  const title = document.getElementById("eventPopupTitle");
  const optionsEl = document.getElementById("eventPopupOptions");

  title.innerHTML = `オートバトル中のため「${selected.label}」を自動選択しました`;
  optionsEl.innerHTML = "";

  popup.style.display = "block";
  popup.style.visibility = "visible";

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const popupHeight = popup.offsetHeight;
  popup.style.top = `${scrollTop + window.innerHeight / 2 - popupHeight / 2}px`;
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";

  setTimeout(() => {
    popup.style.display = "none";
  }, 1000);
}
 


	


// 元のコード
// const name = document.getElementById('inputStr').value || 'あなた';

// 修正版: player.name が既にあるならそのまま、なければ入力欄の値またはデフォルト
	const name = player?.name || document.getElementById('inputStr').value || 'あなた';
  if (!player || (!isLoadedFromSave && displayName(player.name) !== name)) {

   //   window.isFirstBattle = true;

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

syncSkillsUI();
  player.effects = [];

// 敵を生成（攻撃スキルが必ず1つ以上あるようにする）
do {
    enemy = makeCharacter('敵' + Math.random());
} while (!hasOffensiveSkill(enemy));

// 元の名前から安全なカタカナ部分を抽出
const originalKanaName = displayName(enemy.name).replace(/[^アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン]/g, '');

const specialSkillThreshold = 999;
const maxSpecialSkillLevel = 5000;
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
        const level = 1 + Math.floor((maxPossibleLevel - 1) * Math.pow(rand, 3));
        skill.level = level;
    }
});

// 名前修正
enemy.name = hasSpecialSkill ? `${specialSkillName}${originalKanaName}` : originalKanaName;

// ステータス生成処理
let atk, def, spd, hpMax;

if (window.specialMode === 'brutal') {
    // 鬼畜モード：プレイヤーのステータスを基準に0.8〜1.4倍で作成
    const statMultiplierMin = 0.8;
    const statMultiplierMax = 1.4;

    atk = Math.floor(player.attack * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
    def = Math.floor(player.defense * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
    spd = Math.floor(player.speed * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
    hpMax = Math.floor(player.maxHp * (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin)));
} else {
    // 通常モード：makeCharacter() で生成された baseStats を使用
    atk = enemy.baseStats.attack;
    def = enemy.baseStats.defense;
    spd = enemy.baseStats.speed;
    hpMax = enemy.baseStats.maxHp;
}

// ステータスに反映
enemy.baseStats.attack = atk;
enemy.baseStats.defense = def;
enemy.baseStats.speed = spd;
enemy.baseStats.maxHp = hpMax;

enemy.attack = atk;
enemy.defense = def;
enemy.speed = spd;
enemy.maxHp = hpMax;
enemy.hp = hpMax;

// モードごとの連勝補正
if (window.specialMode === 'brutal') {
    const brutalBonus = 1 + (currentStreak + 1) * 0.005;
    const multiplier = enemy.rarity * brutalBonus;

    enemy.attack  = Math.floor(enemy.attack  * multiplier);
    enemy.defense = Math.floor(enemy.defense * multiplier);
    enemy.speed   = Math.floor(enemy.speed   * multiplier);
    enemy.maxHp   = Math.floor(enemy.maxHp   * multiplier);
    enemy.hp = enemy.maxHp;
} else {
    const factor = Math.pow(1.05, currentStreak + 1);  // ←修正
    const multiplier = enemy.rarity * factor;

    enemy.attack  = Math.floor(enemy.attack  * multiplier);
    enemy.defense = Math.floor(enemy.defense * multiplier);
    enemy.speed   = Math.floor(enemy.speed   * multiplier);
    enemy.maxHp   = Math.floor(enemy.maxHp   * multiplier);
    enemy.hp = enemy.maxHp;

}

  // 前回の効果をクリア
  player.effects = [];
  enemy.effects = [];
  updateStats();

  applyPassiveSeals(player, enemy, log);

const factor = Math.pow(1.05, currentStreak);
if (window.specialMode === 'brutal') {
    log.push(`[鬼畜モード挑戦中]`);
} else {
    log.push(`敵のステータス倍率: ${(enemy.rarity * factor).toFixed(2)}倍（基礎倍率 ${enemy.rarity.toFixed(2)} × 1.05^${currentStreak}）`);
}
  let turn = 1;
  const MAX_TURNS = 30;
  hpHistory = [];
  player.hp = player.maxHp;
  enemy.hp = enemy.maxHp;
  player.battleStats = {};
  enemy.battleStats = {};
	recordHP();
	

  // ターン制バトル開始

  while (turn <= MAX_TURNS && player.hp > 0 && enemy.hp > 0) {
    log.push(`\n-- ${turn}ターン --`);

    if (turn === 1) {
     applyPassiveSeals(player, enemy, log);
     }
    updateSealedSkills(player);
    updateSealedSkills(enemy);

		if (player.mixedSkills && player.mixedSkills.length > 0) {
		  const msg = player.mixedSkills.map((ms, i) => 
		    `混合スキル${i + 1}「${ms.name}」: 発動率 ${Math.round(ms.activationProb * 100)}%`
		  ).join('\n');
	//	  console.log(msg);
		} else {
	//	  console.log("混合スキルはまだ取得していません。");
		}
	//	console.log(player.skills);

		
		player.mixedSkills?.forEach(mixedSkill => {
		  if (!mixedSkill.used && Math.random() < mixedSkill.activationProb) {
		    useMixedSkill(mixedSkill,player,enemy, log);  // ← 発動
		    mixedSkill.used = true;
		  }
		});
		


		// 継続効果の処理（毒・火傷・再生など）
		[player, enemy].forEach(ch => {
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
		
		        handlePoisonBurnDamage(ch, dmg, log); // ← 即時回復
		
		      } else if (eff.type === '火傷') {
		        ch.hp -= eff.damage;
		        log.push(`${displayName(ch.name)}は火傷で${eff.damage}ダメージ`);
		        ch.battleStats['火傷'] = (ch.battleStats['火傷'] || 0) + eff.damage;
		
		        handlePoisonBurnDamage(ch, eff.damage, log); // ← 即時回復
		
		      } else if (eff.type === 'regen') {
		        const heal = Math.min(ch.maxHp - ch.hp, eff.heal);
		        ch.hp += heal;
		        if (heal > 0) {
		          log.push(`${displayName(ch.name)}は再生効果で${heal}HP回復`);
		        }}


    // ターン経過
    eff.remaining--;
		
		
function hasAnyHighScore() {
  if (!window.maxScores) return false;

  return Object.values(window.maxScores).some(score =>
    typeof score === 'number' && score > 0
  );
}

if (window.isFirstBattle && !hasAnyHighScore()) {
  showConfirmationPopup(
`<div style="text-align:center">
  <img src="ghost.png" alt="Wizard" style="width:180px; height:auto; margin-bottom: 10px;"><br>
	ようこそ！<br>
  さっそくだけど、作ったキャラクターが戦闘をしたよ。<br>
  戦闘ログを確認してみよう。<br><br>
  最初はフェイスコインを使ってガチャを引いたり、<br>
  鬼畜モードで何かアイテムを入手して<br>保護するのがおすすめ！<br><br>
  詳しくは一番上の「遊び方」を見てね。
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

if (player.hp <= 0) {
  const revived = checkReviveOnDeath(player, window.log);
  if (!revived) {
    window.log.push(`${displayName(player.name)}は力尽きた……`);
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


  recordHP();
    turn++;
  }
		
	
	
	
  const playerWon = player.hp > 0 && (enemy.hp <= 0 || player.hp > enemy.hp);
 // recordHP();

  streakBonus = 1 + currentStreak * 0.01;
  const effectiveRarity = enemy.rarity * streakBonus;

let baseRate = 0.1;
if (window.specialMode === 'brutal') {
    baseRate = 0.00003;
}

// 緩やかな減少（下限0.2倍まで）
const streakFactor = Math.max(1 - currentStreak * 0.005, 0.2);
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

 //   const logEl = document.getElementById('battleLog');
 //   logEl.textContent += `\n（連勝数が上がるほど、成長確率は低下します）\n`;
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
syncSkillsUI();
  }
});

// --- startBattle関数（または勝利判定部分）の中に追記 ---
// （例）勝利時報酬処理の直後に以下を追加
// 最高スコアの合計を取得
let totalScore = 0;
if (window.maxScores && typeof window.maxScores === 'object') {
  for (const score of Object.values(window.maxScores)) {
    if (typeof score === 'number' && score > 0) {
      totalScore += score;
    }
  }
}

// ドロップ確率チェック
if (Math.random() < FACE_COIN_DROP_RATE) {
  // スコアが高いほど平均コイン数が増える（最大10枚）
  const averageCoins = Math.min(10, 1 + (totalScore / 400000) * 2); // 40万で約3枚
  const coinGain = Math.max(1, Math.floor(Math.random() * averageCoins) + 1); // 1〜averageCoinsの乱数

  faceCoins += coinGain;

  const coinElem = document.getElementById('faceCoinCount');
  if (coinElem) coinElem.innerText = faceCoins;

  // 任意：デバッグログ
  // console.log(`フェイスコイン +${coinGain}（合計: ${faceCoins}） totalScore=${totalScore}`);
}

updateFaceUI();


  // 新スキル習得のチャンス
  // 敵のRarityに応じたスキル取得確率
const rarity = enemy.rarity * (0.2 + currentStreak * 0.01);
let skillGainChance = Math.min(1.0, 0.01 * rarity);
if (window.specialMode === 'brutal') {
    skillGainChance = 0.02;  // 鬼畜モードで変更する
}
 // log.push(`\n新スキル獲得率（最大5%×Rarity）: ${(skillGainChance * 100).toFixed(1)}%`);
if (Math.random() < skillGainChance) {
    const owned = new Set(player.skills.map(s => s.name));
    const enemyOwned = enemy.skills.filter(s => !owned.has(s.name));
    if (enemyOwned.length > 0) {
        const newSkill = enemyOwned[Math.floor(Math.random() * enemyOwned.length)];
        const savedLv = player.skillMemory[newSkill.name] || 1;
        player.skills.push({ name: newSkill.name, level: savedLv, uses: 0 });
				
				
				onSkillAcquired(newSkill)
				
        log.push(`新スキル習得: ${newSkill.name} (Lv${savedLv}) を習得！`);
        showCustomAlert(`新スキル習得: ${newSkill.name} (Lv${savedLv}) を習得！`, 1000, "#a8ffb0", "#000");
        if (!document.getElementById("skillMemoryList").classList.contains("hidden")) {
syncSkillsUI();
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
syncSkillsUI();

}

	// --- 超低確率で FaceCoin 入手イベント ---
	const coinChance = enemy.rarity / 1000;
	if (Math.random() < coinChance) {
	  const coinGain = Math.floor(Math.random() * 200); // 最大500
	  window.faceCoins = (window.faceCoins || 0) + coinGain;
	

	  showCenteredPopup(`[低確率] FaceCoinを${coinGain}枚獲得！（累計：${window.faceCoins}枚）`);
	
	  const coinElem = document.getElementById('faceCoinCount');
	  if (coinElem) coinElem.innerText = window.faceCoins;
	}

} else {

  //stopAutoBattle()

let resetMessage = '';
if (window.growthMultiplier !== 1) {
  resetMessage = `<br>成長倍率リセット：→ x1`;
}

  window.growthMultiplier = 1;

  window.skillDeleteUsesLeft = 3;
updateSkillDeleteButton();  // ボタン表示もリセット
  streakBonus = 1;
	
	cleanUpAllMixedSkills();
	
  log.push(`\n敗北：${displayName(enemy.name)}に敗北\n連勝数：0`);
  saveBattleLog(log);


	



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
syncSkillsUI();
currentStreak = 0;
}

document.getElementById('startBattleBtn').addEventListener('click', window.startBattle);

// 最終HP表示
log.push(`\n${displayName(player.name)} 残HP: ${player.hp}/${player.maxHp}`);
log.push(`${displayName(enemy.name)} 残HP: ${enemy.hp}/${enemy.maxHp}`);

// 戦闘終了時に残る強化・弱体を解除

player.effects.forEach(eff => {
  if (eff.type === 'buff') player[eff.stat] = eff.original;
  if (eff.type === 'debuff') player[eff.stat] = eff.original;
if (eff.type === 'berserk') { player.attack = eff.originalAttack; player.defense = eff.originalDefense; }
});
player.effects = [];
clearPassiveStatBuffs(player);

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

displayBattleLogWithoutAsync(log);

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
updateRemainingBattleDisplay();
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
finalResEl.innerHTML = `<div class="final-death-title">${displayName(player.name)} は息絶えた…</div>

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

<div style="
  margin-top: 30px;
  padding: 10px;
  font-size: 0.95em;
  color: #ccc;
  font-style: italic;
">
  今後、合計スコアによりフェイスコインボーナスがあります。<br>
  <span style="color: #ffcc00; font-weight: bold;">必ずセーブボタンから保存</span>をしてください。<br>
  その後、セーブデータから再開したい場合は画面一番下からタイトルに戻って、セーブデータファイルを選択後、つづきからを選んでください。

  <br><br>

  <button id="localSaveBtn" onclick="window.saveToLocalStorage()" style="
    margin-top: 10px;
    padding: 8px 16px;
    background: linear-gradient(to right, #222, #555);
    color: #ffaaaa;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  ">ローカルにセーブ（未保存）</button>

  <br>

  <button onclick="window.exportSaveCode()" style="
    margin-top: 10px;
    padding: 8px 16px;
    background: linear-gradient(to right, #444, #777);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
		
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

finalResEl.style.display = 'block';


window.targetBattles = null;
window.remainingBattles = null;
document.getElementById('remainingBattlesDisplay').style.display = 'none';


finalResEl.onclick = () => {
  finalResEl.style.display = 'none';
	battleBtn.classList.add("hidden");
	
	

								
								
};
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

syncSkillsUI();

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
location.reload();
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

  //document.getElementById('loadGameBtn').addEventListener('click', window.loadGame);
  //document.getElementById('showBattleModeBtn').addEventListener('click', window.showBattleMode);
  //document.getElementById('startVsModeBtn').addEventListener('click', window.startVsMode);
  document.getElementById('startBattleBtn').addEventListener('click', window.startBattle);

  // スマホ・PC 両対応の連打処理
  const battleBtn = document.getElementById('startBattleBtn');
  let battleInterval;

  function startAutoBattle() {
    isAutoBattle = true;  // ← 長押し中にセット
    if (!battleInterval) {
      battleInterval = setInterval(() => {
//        if (isWaitingGrowth) return;
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

  //document.getElementById('saveCodeBtn').addEventListener('click', window.exportSaveCode);
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
  isLoadedFromSave = true;
  window.isFirstBattle = false;

  document.getElementById("skillMemoryList").classList.remove("hidden");
  document.getElementById("skillMemoryContainer").style.display = "block";

	syncSkillsUI();

  const fileInput = document.getElementById('saveFileInput');
  const input = document.getElementById('saveData').value.trim();

  const hasFile = fileInput && fileInput.files.length > 0;
  const hasText = input.length > 0;

  if (!hasFile && !hasText) {
    alert('セーブデータが入力されていません。');
		location.reload();
    return;
  }

  // === 新形式（ファイルまたはピリオド入りの文字列） ===
  if (hasFile) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async function(e) {
      const content = e.target.result.trim();
      document.getElementById('saveData').value = content;
      await window.importSaveCode();
      updateRemainingBattleDisplay();  // ★表示更新
    };
    reader.readAsText(file);
    return;
  }

  if (input.includes('.')) {
    await window.importSaveCode();
    updateRemainingBattleDisplay();  // ★表示更新
    return;
  }

  // === 旧形式データ ===
  try {
    const parsed = window.decodeBase64(input);
    player = parsed.player;
    if (!player.growthBonus) {
      player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
    }
    player.itemMemory = player.itemMemory || [];
    drawItemMemoryList();

    currentStreak = parsed.currentStreak || 0;

    do {
      enemy = makeCharacter('敵' + Math.random());
    } while (!hasOffensiveSkill(enemy));

    updateStats();
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById("battleArea").classList.add("hidden");

      // ★表示更新

  } catch (e) {
    console.error('旧形式データの読み込み失敗:', e);
    alert('旧形式のセーブデータが読み込めませんでした。');
  }
	updateRemainingBattleDisplay();
};

function updateRemainingBattleDisplay() {
  const remainDisplay = document.getElementById('remainingBattlesDisplay');
  const selectEl = document.getElementById('battleCountSelect');

  // 初期値設定（未定義なら）
  if (typeof window.currentStreak !== 'number') window.currentStreak = 0;
  if (typeof window.sessionMaxStreak !== 'number') window.sessionMaxStreak = 0;

  // 未設定なら select から取得
  if ((typeof window.targetBattles !== "number") && selectEl) {
    const selectedVal = selectEl.value;
    window.targetBattles = selectedVal === "unlimited" ? null : parseInt(selectedVal, 10);
  }

  // ステータス反映
  if (typeof window.targetBattles === "number") {
    if (window.remainingBattles == null || window.remainingBattles <= 0) {
      window.remainingBattles = window.targetBattles;
    }

    if (remainDisplay) {
      remainDisplay.textContent = `残り戦闘数：${window.remainingBattles}回\n現在の連勝数：${window.currentStreak}\n現在挑戦中の最大連勝数：${window.sessionMaxStreak}`;
      remainDisplay.style.display = 'block';

      // アニメーション再適用
      remainDisplay.classList.remove('fade-in');
      void remainDisplay.offsetWidth;
      remainDisplay.classList.add('fade-in');
    }
  } else {
    // 無制限モード
    window.remainingBattles = null;
    if (remainDisplay) {
      remainDisplay.style.display = 'none';
    }
  }
}

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
  clearEventPopup(); // 前回の内容をクリア

  const popup = document.getElementById('eventPopup');
  const titleEl = document.getElementById('eventPopupTitle');
  const optionsEl = document.getElementById('eventPopupOptions');

  titleEl.textContent = title;

  // 安全なクリア方法に変更
  while (optionsEl.firstChild) {
    optionsEl.removeChild(optionsEl.firstChild);
  }

  // ボタン生成
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;
    btn.onclick = () => {
      popup.style.display = 'none';
      clearEventPopup();
      onSelect(opt.value);
    };
    optionsEl.appendChild(btn);
  });

  // 表示設定
  popup.style.display = 'block';
  popup.style.visibility = 'hidden';

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const popupHeight = popup.offsetHeight;

  popup.style.position = 'absolute';
  popup.style.top = `${scrollTop - popupHeight / 2}px`;
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, 50%)';
  popup.style.visibility = 'visible';
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
    showCustomAlert("削除できるスキルがありません！");
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

titleEl.textContent = "消すスキルを選んでください";
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
  const list = document.getElementById("skillMemoryList");
  if (!list || !player || !player.skillMemory) return;

  // 1. 一旦非表示にして再描画（ちらつき防止＆DOM安定化）
  list.style.display = "none";
  list.innerHTML = "";

  const categoryColors = {
    multi: "#ff4d4d", poison: "#9933cc", burn: "#ff6600", lifesteal: "#66ccff",
    skillSeal: "#9999ff", barrier: "#66ff66", regen: "#66ff99", reflect: "#ffff66",
    evasion: "#ff99cc", buff: "#ffd700", debuff: "#cc66ff", heal: "#00ffcc",
    damage: "#ff3333", stun: "#ff99cc", buffExtension: "#00ccff",
    debuffExtension: "#cc66ff", berserk: "#ff3333", passive: "gold", others: "#cccccc"
  };

  const ownedSkillNames = player.skills.map(sk => sk.name);
  const memoryEntries = Object.entries(player.skillMemory);

  const isOwned = name => ownedSkillNames.includes(name);
  const sortedEntries = memoryEntries.sort((a, b) => {
    const aOwned = isOwned(a[0]) ? 0 : 1;
    const bOwned = isOwned(b[0]) ? 0 : 1;
    return aOwned - bOwned;
  });

  for (const [name, level] of sortedEntries) {
    const li = document.createElement("li");
    const skillDef = skillPool.find(s => s.name === name);
    const category = skillDef?.category || "others";
    const desc = skillDef?.description || "";
    const isPassive = category === "passive";

    // 色の決定
    let color = "white";
    if (window.initialAndSlotSkills?.includes(name)) {
      color = "deepskyblue";
    } else if (isPassive) {
      color = "gold";
    } else {
      color = categoryColors[category] || "white";
    }

    li.innerHTML = `<span style="color:${color}" title="${desc}">${name} Lv${level}</span>`;
    li.setAttribute("data-name", name);
    li.setAttribute("data-level", level);
    li.setAttribute("draggable", "true");

    // クラス付与
    if (isPassive && ownedSkillNames.includes(name)) {
      li.classList.add("passive-skill");
    } else if (window.lastChosenSkillNames?.includes(name)) {
      li.classList.add("chosen-skill");
    } else if (ownedSkillNames.includes(name)) {
      li.classList.add("owned-skill");
    }

    // --- Drag & Drop 設定 ---
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
        list.insertBefore(dragged, list.children[targetIndex]);
        updateSkillMemoryOrder();
      }
      li.style.border = "";
    };

    list.appendChild(li);
  }

  // --- DOM安定後に表示再開（ちらつき防止＆再描画のタイミング調整） ---
  requestAnimationFrame(() => {
    list.style.display = "";
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
	li.onclick = (e) => onItemClick(item, idx, e);
    list.appendChild(li);
  });
}

window.drawHPGraph = function () {
//  if (isAutoBattle) return;
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
								container.style.display = 'none';
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
let faceTimeout;

window.addEventListener('scroll', () => {
	
		updateLocalSaveButton();
		
  const battleEl = document.getElementById('remainingBattlesDisplay');
  const scoreEl = document.getElementById('scoreOverlay');
  const skillEl = document.getElementById('skillOverlay');
  const itemEl = document.getElementById('itemOverlay');
  const faceEl = document.getElementById('faceOverlay');
  if (faceItemEquipped && faceEl) {
    faceEl.src = faceItemEquipped;
  }

  // フェードアウト（スクロール中）
  if (battleEl) battleEl.style.opacity = '0';
  if (scoreEl) scoreEl.style.opacity = '0';
  if (skillEl) skillEl.style.opacity = '0';
  if (itemEl) itemEl.style.opacity = '0';
  if (faceEl) faceEl.style.opacity = '0'; // ← フェイスも消す

  // タイマー解除
  clearTimeout(scoreTimeout);
  clearTimeout(skillTimeout);
  clearTimeout(itemTimeout);
  clearTimeout(faceTimeout); // ← 追加

  // スコア：1秒後に再表示
  scoreTimeout = setTimeout(() => {
    if (battleEl) battleEl.style.opacity = '1';
    if (scoreEl) scoreEl.style.opacity = '1';
  }, 1500);

  // スキル：1.5秒後に再表示
  skillTimeout = setTimeout(() => {
    if (typeof updateSkillOverlay === 'function') updateSkillOverlay();
    if (skillEl) skillEl.style.opacity = '1';
  }, 1500);

  // アイテム：1.5秒後に再表示
  itemTimeout = setTimeout(() => {
    updateItemOverlay();
    if (itemEl) itemEl.style.opacity = '1';
  }, 1500);

  // フェイス：1秒後に再表示（scoreOverlayと同時）
  faceTimeout = setTimeout(() => {
    if (faceItemEquipped && faceEl) {
      faceEl.style.opacity = '1';
    }
  }, 1500);
});


document.getElementById("battleCountSelect").addEventListener("change", (e) => {
  const value = e.target.value;
  const overlay = document.getElementById("battleEffectOverlay");
  if (!overlay) return;

  let effectHTML = "";

  switch (value) {
    case "100":
      effectHTML = `<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);
        font-size:3em;font-weight:bold;color:#00ffff;text-shadow:0 0 10px #0ff;">
        100戦<br>モード！
      </div>`;
      break;
    case "1000":
      effectHTML = `<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);
        font-size:3em;font-weight:bold;color:#ffcc00;text-shadow:0 0 10px #ff0;">
        1000戦<br>モード！
      </div>`;
      break;
    case "unlimited":
      effectHTML = `<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);
        font-size:3em;font-weight:bold;color:#ff00ff;text-shadow:0 0 20px #f0f;">
        無制限<br>モード！
      </div>`;
      break;
    default:
      effectHTML = `<div style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);
        font-size:2.5em;font-weight:bold;color:#00ff00;text-shadow:0 0 10px #0f0;">
        ${value}戦<br>モード！
      </div>`;
  }

  overlay.innerHTML = effectHTML;
  overlay.style.display = "block";
  overlay.style.background = "rgba(0,0,0,0.5)";

  setTimeout(() => {
    overlay.style.display = "none";
    overlay.innerHTML = "";
  }, 2000);
});


window.isLocalSaveDirty = true; 

function markLocalSaveDirty() {
  isLocalSaveDirty = true;
  updateLocalSaveButton();
}

function markLocalSaveClean() {
  isLocalSaveDirty = false;
  updateLocalSaveButton();
}

function updateLocalSaveButton() {
  const btn = document.getElementById('localSaveBtn');
  if (!btn) return;

  if (isLocalSaveDirty) {
    btn.textContent = 'ローカルにセーブ（未保存）';
    btn.classList.remove('saved');
    btn.classList.add('unsaved');
  } else {
    btn.textContent = 'ローカルにセーブ（保存済）';
    btn.classList.remove('unsaved');
    btn.classList.add('saved');
  }
}


window.saveToLocalStorage = async function () {
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
    remainingBattles: window.remainingBattles ?? null,
    targetBattles: window.targetBattles ?? null,
    maxScores: window.maxScores || {},
		mixedSkills: player.mixedSkills || [],
    faceCoins: window.faceCoins || 0,
    faceItemsOwned: window.faceItemsOwned || [],
    faceItemEquipped: window.faceItemEquipped || null,
  };

  const raw = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(raw)));
  const hash = await generateHash(b64);
  const code = `${b64}.${hash}`;

  localStorage.setItem('rpgLocalSave', code);
	
	markLocalSaveClean();  // ← 状態を更新
	
	alert(
	  'ローカルにセーブしました。\n\n' +
	  '※このセーブデータはブラウザ内に保存されています。\n' +
	  '「履歴の削除」や「サイトデータの消去」で消える可能性があります。'
		//\n\n' +
	//  '大切なデータはテキスト形式でも保存しておくことをおすすめします。'
	);
	markAsSaved();
	updateLocalSaveButton();
//	location.reload();
};


window.exportSaveCode = async function () {
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
  player.initialAndSlotSkills = window.initialAndSlotSkills || [];

  // ✅ 混合スキル情報も保存（保護状態含む）
  player.mixedSkills = player.mixedSkills || [];

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
    remainingBattles: window.remainingBattles ?? null,
    targetBattles: window.targetBattles ?? null,
    maxScores: window.maxScores || {},
		
		    // ✅ フェイスアイテム情報を明示的に保存
    faceCoins: window.faceCoins || 0,
    faceItemsOwned: window.faceItemsOwned || [],
    faceItemEquipped: window.faceItemEquipped || null,
  };

  const raw = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(raw)));
  const hash = await generateHash(b64);
  const code = `${b64}.${hash}`;

  const box = document.getElementById('saveCodeBox');
  box.value = code;
  try {
    await navigator.clipboard.writeText(code);
  } catch (e) {
    box.focus(); box.select();
  }

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

window.importSaveCode = async function (code = null) {
  document.getElementById("skillMemoryList").classList.remove("hidden");

  const input = code ?? document.getElementById('saveData').value.trim();

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

    // ✅ 混合スキル情報の復元（保護状態を正規化）
    player.mixedSkills = Array.isArray(parsed.mixedSkills)
      ? parsed.mixedSkills.map(s => {
          if (s.protected) s.isProtected = true;
          return s;
        })
      : [];

    window.maxScores = parsed.maxScores || {};
    player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };

    player.itemMemory = parsed.itemMemory || [];
    window.initialAndSlotSkills = parsed.initialAndSlotSkills || [];
    window.levelCapExemptSkills = parsed.levelCapExemptSkills || [];
    window.growthMultiplier = parsed.growthMultiplier || 1;

    const rebirth = (parsed.rebirthCount || 0) + 1;
    localStorage.setItem('rebirthCount', rebirth);

    // ✅ フェイスアイテム情報の復元とUI更新
    window.faceCoins = parsed.faceCoins ?? 0;
    window.faceItemsOwned = Array.isArray(parsed.faceItemsOwned) ? parsed.faceItemsOwned : [];
    window.faceItemEquipped = parsed.faceItemEquipped ?? null;

    const coinElem = document.getElementById('faceCoinCount');
    if (coinElem) coinElem.innerText = window.faceCoins;
    if (typeof updateFaceUI === 'function') updateFaceUI();
    if (typeof updatePlayerImage === 'function') updatePlayerImage();

    // --- その他設定の復元 ---
    window.specialMode = parsed.specialMode || 'normal';
    window.allowGrowthEvent = parsed.allowGrowthEvent ?? true;
    window.allowSkillDeleteEvent = parsed.allowSkillDeleteEvent ?? true;
    window.allowItemInterrupt = parsed.allowItemInterrupt ?? true;
    window.itemFilterMode = parsed.itemFilterMode || 'and';
    window.itemFilterStates = parsed.itemFilterStates || {};

    if (typeof setupItemFilters === 'function') setupItemFilters();
    if (typeof setupToggleButtons === 'function') setupToggleButtons();
    if (typeof applyItemFilterUIState === 'function') applyItemFilterUIState();

    do {
      enemy = makeCharacter('敵' + Math.random());
    } while (!hasOffensiveSkill(enemy));

    updateStats();
    if (typeof updateSpecialModeButton === 'function') updateSpecialModeButton();
    if (typeof updateItemFilterModeButton === 'function') updateItemFilterModeButton();

    const title = document.getElementById('titleScreen');
    const game = document.getElementById('gameScreen');
    title.classList.add('fade-out');

    setTimeout(() => {
      title.classList.add('hidden');
      game.classList.remove('hidden');
      game.classList.add('fade-in');
      document.getElementById("battleArea").classList.add("hidden");

      const streakDisplay = document.getElementById('currentStreakDisplay');
      if (streakDisplay) {
        const baseBoost = 1.02;
        const boostMultiplier = Math.pow(baseBoost, currentStreak);
        streakDisplay.textContent = `連勝数：${currentStreak} （補正倍率：約${boostMultiplier.toFixed(2)}倍）`;
      }

      const rebirthDisplay = document.getElementById('rebirthCountDisplay');
      if (rebirthDisplay) {
        rebirthDisplay.textContent = '転生回数：' + rebirth;
      }

      if (typeof updateScoreOverlay === 'function') updateScoreOverlay();
      startBattle();

      // ✅ 混合スキルリストを再描画
      if (typeof drawCombinedSkillList === 'function') drawCombinedSkillList();

    }, 500);

  } catch (e) {
    alert('セーブデータの読み込みに失敗しました：' + e.message);
    console.error(e);
  }

  // ✅ スキルUI同期（スロットや記憶）
  if (typeof syncSkillsUI === 'function') syncSkillsUI();
};






window.loadFromLocalStorage = async function () {
  const code = localStorage.getItem('rpgLocalSave');
  if (!code) {
    alert("保存データがありません。");
    return;
  }

  try {
    await importSaveCode(code);
    alert("ローカル保存データを読み込みました。");
		updateRemainingBattleDisplay();
  } catch (e) {
    alert("ローカル保存データの読み込みに失敗しました。");
    console.error(e);
  }
};

