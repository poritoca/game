// =====================================================
// Global battle-visual timer wrapper (defined at file start)
//  - We globally replaced setTimeout -> window.__battleSetTimeout in this file.
// =====================================================
window.__battleInProgress = window.__battleInProgress || false;
window.__battleVisualTracking = window.__battleVisualTracking || false;
window.__battleVisualTimers = window.__battleVisualTimers || [];

window.__battleSetTimeout = window.__battleSetTimeout || function __battleSetTimeout(fn, ms) {
  const id = setTimeout(fn, ms);
  if (window.__battleVisualTracking) {
    window.__battleVisualTimers.push(id);
  }
  return id;
};

window.__cancelBattleVisuals = window.__cancelBattleVisuals || function __cancelBattleVisuals() {
  try {
    if (Array.isArray(window.__battleVisualTimers)) {
      for (const id of window.__battleVisualTimers) {
        try { clearTimeout(id); } catch (_) {}
      }
      window.__battleVisualTimers.length = 0;
    }
    const subtitleEl = document.getElementById('subtitleOverlay');
    if (subtitleEl) {
      subtitleEl.style.opacity = '0';
      subtitleEl.style.display = 'none';
    }
    const alertContainer = document.getElementById('customAlertContainer');
    if (alertContainer) {
      alertContainer.innerHTML = '';
      alertContainer.style.display = 'none';
    }
    const overlay = document.getElementById('battleEffectOverlay');
    if (overlay) overlay.innerHTML = '';
  } catch (_) {}
};


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
// ==========================
//  ボス戦・ステータス成長関連の設定
//  ※ここを書き換えることでバランス調整が可能です
// ==========================
if (typeof window !== "undefined") {
  // 何戦ごとにボス戦にするか
  if (typeof window.BOSS_BATTLE_INTERVAL !== "number") {
    window.BOSS_BATTLE_INTERVAL = 50; // デフォルト: 50戦ごと
  }

  // ボス敵の強さ倍率（敵の基礎倍率にさらに掛け算される）
  if (typeof window.BOSS_ENEMY_MIN_MULTIPLIER !== "number") {
    window.BOSS_ENEMY_MIN_MULTIPLIER = 3; // 最低倍率
  }
  if (typeof window.BOSS_ENEMY_MAX_MULTIPLIER !== "number") {
    window.BOSS_ENEMY_MAX_MULTIPLIER = 10; // 最高倍率
  }
  if (typeof window.BOSS_ENEMY_POWER_EXP !== "number") {
    window.BOSS_ENEMY_POWER_EXP = 8; // 分布の偏り（大きいほど低倍率寄り）
  }

  // ボス勝利時のステータス上昇倍率の範囲
  if (typeof window.BOSS_STAT_MIN_MULTIPLIER !== "number") {
    window.BOSS_STAT_MIN_MULTIPLIER = 1.5; // ステータス強化の最低倍率
  }
  if (typeof window.BOSS_STAT_MAX_MULTIPLIER !== "number") {
    window.BOSS_STAT_MAX_MULTIPLIER = 10.0; // ステータス強化の最高倍率
  }
  // 最高倍率が出る超レア確率（デフォルト: 約1/10000）
  if (typeof window.BOSS_STAT_TOP_PROB !== "number") {
    window.BOSS_STAT_TOP_PROB = 1 / 10000;
  }
  // 低倍率寄りにするための指数（大きいほど低倍率寄り）
  if (typeof window.BOSS_STAT_POWER_EXP !== "number") {
    window.BOSS_STAT_POWER_EXP = 4;
  }
}





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

window.showCenteredPopup = function(message, duration = 3000) {
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
  


  window.__battleSetTimeout(() => {
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

window.showConfirmationPopup = function(messageHtml, onConfirm, options = {}) {
  const popup = document.getElementById("eventPopup");
  const title = document.getElementById("eventPopupTitle");
  const optionsEl = document.getElementById("eventPopupOptions");

  // --- reset popup layout modes (growthbar-ui etc.) so defeat window doesn't inherit wide layout ---
  try {
    popup.classList.remove('growthbar-ui');
    popup.classList.remove('expanded');
    popup.classList.remove('selection-lock');
    popup.classList.remove('has-options');
    if (popup.dataset) {
      delete popup.dataset.uiMode;
    }
    // Clear any inline sizing that may have been set by other modes
    popup.style.width = '';
    popup.style.maxWidth = '';
    popup.style.height = '';
    popup.style.maxHeight = '';
    popup.style.padding = '';
    popup.style.overflow = '';
  } catch (e) {}

  // 内容を設定
  title.innerHTML = messageHtml;
  optionsEl.innerHTML = "";


  // options
  const autoDismissMs = Number(options.autoDismissMs || 0);
  const fadeOutMs = Number(options.fadeOutMs || 520);
  const hideOk = !!options.hideOk;

  // reset fade state
  popup.classList.remove('auto-fade');
  popup.classList.remove('auto-fade-out');
  popup.style.opacity = '1';
  // --- clear previous auto-dismiss timers (so it works every time) ---
  try {
    if (popup.__autoDismissTimer1) { clearTimeout(popup.__autoDismissTimer1); popup.__autoDismissTimer1 = null; }
    if (popup.__autoDismissTimer2) { clearTimeout(popup.__autoDismissTimer2); popup.__autoDismissTimer2 = null; }
  } catch(e) {}


  if (!hideOk) {
    const okBtn = document.createElement("button");
    okBtn.textContent = "了解";
    okBtn.style.padding = "8px 16px";
    okBtn.onclick = () => {
      // fade-out then hide
      popup.classList.add('auto-fade');
      popup.classList.add('auto-fade-out');
      const _t = window.setTimeout;
      popup.__autoDismissTimer2 = _t(() => {
        popup.style.display = "none";
        popup.classList.remove('auto-fade-out');
        popup.classList.remove('auto-fade');
        popup.style.opacity = '1';
        if (typeof onConfirm === "function") onConfirm();
      }, fadeOutMs);
    };
    optionsEl.appendChild(okBtn);
  }
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
  // auto dismiss (e.g., defeat window)
  if (autoDismissMs > 0) {
    const _t = window.setTimeout;
    popup.__autoDismissTimer1 = _t(() => {
      // start fade-out
      popup.classList.add('auto-fade');
      popup.classList.add('auto-fade-out');
      popup.__autoDismissTimer2 = _t(() => {
        popup.style.display = "none";
        popup.classList.remove('auto-fade-out');
        popup.classList.remove('auto-fade');
        popup.style.opacity = '1';
        if (typeof onConfirm === "function") onConfirm();
      }, fadeOutMs);
    }, autoDismissMs);
  }

};

window.isFirstBattle = false;

window.levelCapExemptSkills = [];  // スキルレベル制限緩和対象

// 共通のクリーンアップ関数を作る
window.clearEventPopup = function(keepGrowthBar = false) {
  const popup = document.getElementById('eventPopup');
  const title = document.getElementById('eventPopupTitle');
  const optionsEl = document.getElementById('eventPopupOptions');
  const selectContainer = document.getElementById('eventPopupSelectContainer');
  const selectEl = document.getElementById('eventPopupSelect');
  const selectBtn = document.getElementById('eventPopupSelectBtn');

  // content clear
  if (title) title.textContent = '';
  if (optionsEl) optionsEl.innerHTML = '';
  if (selectEl) selectEl.innerHTML = '';
  if (selectBtn) selectBtn.onclick = null;
  if (selectContainer) selectContainer.style.display = 'none';

  if (!popup) return;

  // NOTE: 旧UIの「左上バー（growthbar-ui）」は廃止。
  // keepGrowthBar は互換のため残すが、常に完全に閉じる。

  // default: fully hide
  popup.style.display = 'none';
  popup.style.visibility = 'hidden';
};;

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
  { word: '壷', breakChance: 0.16, dropRateMultiplier: 0.4 },
  { word: '札', breakChance: 0.09, dropRateMultiplier: 0.45 },
  { word: '結晶', breakChance: 0.08, dropRateMultiplier: 0.6 },
  { word: '石', breakChance: 0.07, dropRateMultiplier: 0.65 },
  { word: '鉱石', breakChance: 0.11, dropRateMultiplier: 0.55 },
  { word: '歯車', breakChance: 0.16, dropRateMultiplier: 0.5 },
  { word: '羽根', breakChance: 0.2, dropRateMultiplier: 0.35 },
  { word: '巻物', breakChance: 0.3, dropRateMultiplier: 0.6 },
  { word: '鏡', breakChance: 0.13, dropRateMultiplier: 0.68 },
  { word: '炎', breakChance: 0.4, dropRateMultiplier: 0.3 },
  { word: '氷塊', breakChance: 0.1, dropRateMultiplier: 0.38 },
  { word: '枝', breakChance: 0.6, dropRateMultiplier: 0.4 },
  { word: '勾玉', breakChance: 0.01, dropRateMultiplier: 0.2 },
  { word: '仮面', breakChance: 0.14, dropRateMultiplier: 0.5 },
  { word: '珠', breakChance: 0.1, dropRateMultiplier: 0.8 },
  { word: '箱', breakChance: 0.25, dropRateMultiplier: 0.6 },
  { word: '盾', breakChance: 0.01, dropRateMultiplier: 0.18 },
  { word: '剣', breakChance: 0.02, dropRateMultiplier: 0.18 },
  { word: '書', breakChance: 0.22, dropRateMultiplier: 0.4 },
  { word: '砂時計', breakChance: 0.17, dropRateMultiplier: 0.35 },
  { word: '宝石', breakChance: 0.02, dropRateMultiplier: 0.24 },
  { word: '瓶', breakChance: 0.36, dropRateMultiplier: 0.38 },
  { word: '種', breakChance: 0.4, dropRateMultiplier: 0.7 },
  { word: '薬草', breakChance: 0.42, dropRateMultiplier: 0.3 },
  { word: '鉄片', breakChance: 0.05, dropRateMultiplier: 0.45 },
  { word: '骨', breakChance: 0.15, dropRateMultiplier: 0.4 },
  { word: '音叉', breakChance: 0.3, dropRateMultiplier: 0.6 },
  { word: '面', breakChance: 0.24, dropRateMultiplier: 0.75 },
  { word: '鏡石', breakChance: 0.04, dropRateMultiplier: 0.2 },
  { word: '符', breakChance: 0.16, dropRateMultiplier: 0.65 },
  { word: '灯', breakChance: 0.26, dropRateMultiplier: 0.5 },
  { word: '鐘', breakChance: 0.45, dropRateMultiplier: 0.6 },
  { word: '骨片', breakChance: 0.8, dropRateMultiplier: 0.55 },
  { word: '巻貝', breakChance: 0.06, dropRateMultiplier: 0.25 },
  { word: '球', breakChance: 0.08, dropRateMultiplier: 0.15 },
  { word: '珠玉', breakChance: 0, dropRateMultiplier: 0.05 },
  { word: '護符', breakChance: 0.23, dropRateMultiplier: 0.68 },
  { word: '錫杖', breakChance: 0.33, dropRateMultiplier: 0.6 },
  { word: '光球', breakChance: 0, dropRateMultiplier: 0.16 }
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
  btn.textContent = '鬼畜モード（アイテム入手可能）';
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

function hasSkill(name) {
  return player.skills.some(s => s.name === name);
}

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
  usedNames.add(uniqueSkillName);

  if (attackSkillName !== uniqueSkillName) {
    const attackLevel = player.skillMemory[attackSkillName] || 1;
    newSkills.push({ name: attackSkillName, level: attackLevel, uses: 0 });
    usedNames.add(attackSkillName);
  }

  for (const [name, level] of entries) {
    if (newSkills.length >= totalSlots) break;
    if (usedNames.has(name)) continue;
    newSkills.push({ name, level, uses: 0 });
    usedNames.add(name);
  }

  
  // ---- 敗北/再構築時に「保護中の混合スキル」を失わないよう保持 ----
  const preservedProtectedMixed = Array.isArray(player.mixedSkills)
    ? player.mixedSkills.filter(ms => ms && ms.isMixed && ms.isProtected)
    : [];
// 初期化
  player.skills = [];
  // 混合スキル配列を再構築（保護中のみ保持）
  player.mixedSkills = preservedProtectedMixed.slice();


  // 固有スキル先に追加（重複防止）
  const uniqueSkillObj = { name: uniqueSkillName, level: uniqueLevel, uses: 0, isUnique: true };
  if (!hasSkill(uniqueSkillObj.name)) {
    player.skills.push(uniqueSkillObj);
  }

  for (const sk of newSkills) {
    if (sk.name === uniqueSkillName) continue;
    const fullSkill = { ...sk, isUnique: false };
    if (!hasSkill(fullSkill.name)) {
      onSkillAcquired(fullSkill);
    }
  }

  // 固有スキルからの明示的な混合スキル生成
  const mixCandidates = player.skills.filter(s => s.name !== uniqueSkillName);
  if (mixCandidates.length > 0) {
    const partner = mixCandidates[Math.floor(Math.random() * mixCandidates.length)];
    const combinedSkill = createMixedSkill(uniqueSkillObj, partner);
    if (combinedSkill && !hasSkill(combinedSkill.name)) {
      player.mixedSkills.push(combinedSkill);
      player.skills.push(combinedSkill);
    }
  }

  // 保護中の混合スキルをスキル一覧へ復元（戦闘開始時の特殊効果ログ/発動のため）
  if (Array.isArray(player.mixedSkills) && player.mixedSkills.length > 0) {
    for (const ms of player.mixedSkills) {
      if (ms && ms.isMixed && ms.isProtected && !hasSkill(ms.name)) {
        player.skills.push(ms);
      }
    }
  }


  if (typeof drawSkillMemoryList === 'function') drawSkillMemoryList();
  if (typeof drawCombinedSkillList === 'function') drawCombinedSkillList();
}




// ======================================================
// Battle Log speed / acceleration settings (UI + persist)
// ======================================================
// 表示間隔（ms）：小さいほど速い
window.__BATTLE_LOG_BASE_DELAY_MS = Number(window.__BATTLE_LOG_BASE_DELAY_MS || 20);

// 加速度モード：0=OFF, 1=弱, 2=強
window.__BATTLE_LOG_ACCEL_MODE = Number.isFinite(Number(window.__BATTLE_LOG_ACCEL_MODE))
  ? Number(window.__BATTLE_LOG_ACCEL_MODE) : 1;

function __loadBattleLogSpeedSettings(){
  try{
    const ms = Number(localStorage.getItem('battleLogBaseDelayMs'));
    if (Number.isFinite(ms) && ms >= 1) window.__BATTLE_LOG_BASE_DELAY_MS = ms;
    const am = Number(localStorage.getItem('battleLogAccelMode'));
    if (Number.isFinite(am) && am >= 0) window.__BATTLE_LOG_ACCEL_MODE = am;
  }catch(_e){}
}

function __saveBattleLogSpeedSettings(){
  try{
    localStorage.setItem('battleLogBaseDelayMs', String(window.__BATTLE_LOG_BASE_DELAY_MS));
    localStorage.setItem('battleLogAccelMode', String(window.__BATTLE_LOG_ACCEL_MODE));
  }catch(_e){}
}

function __clamp(n, a, b){
  n = Number(n);
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
}

function __getBattleLogDelayMs(lineIndex, totalLines){
  // base: スライダーで設定した遅延
  const base = __clamp(window.__BATTLE_LOG_BASE_DELAY_MS, 1, 2000);

  // 加速度：ログが進むにつれて少しずつ速くなる（読みやすさ維持のため下限あり）
  const mode = __clamp(window.__BATTLE_LOG_ACCEL_MODE, 0, 2);

  // 体感チューニング（3段階）
  // - OFF: 常に base
  // - 弱 : 進行度に応じて最大 ~2.0倍速（遅延は半分程度まで）
  // - 強 : 進行度に応じて最大 ~3.5倍速（遅延は約1/3程度まで）
  if (mode <= 0) return base;

  const t = (totalLines > 1) ? (lineIndex / Math.max(1, totalLines - 1)) : 1; // 0..1
  const maxSpeed = (mode === 1) ? 2.0 : 3.5;      // 速度倍率
  const curveK   = (mode === 1) ? 1.2 : 1.8;      // 立ち上がり
  const speedMul = 1.0 + (maxSpeed - 1.0) * Math.pow(t, curveK);

  const minDelay = (mode === 1) ? 8 : 5;
  return Math.max(minDelay, Math.floor(base / speedMul));
}

function __applyBattleLogControlsUI(){
  const slider = document.getElementById('logSpeedSlider');
  const valueEl = document.getElementById('logSpeedValue');
  const b0 = document.getElementById('logAccelBtn0');
  const b1 = document.getElementById('logAccelBtn1');
  const b2 = document.getElementById('logAccelBtn2');
  if (!slider || !valueEl || !b0 || !b1 || !b2) return;

  
  // 戦闘経過トグルボタン（加速度ボタン右）
  try {
    const container = (b0 && b0.parentElement) ? b0.parentElement : null;
    if (container && !document.getElementById('battleLogToggleBtn')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'battleLogToggleBtn';
      btn.className = 'battle-log-toggle';
      const refreshLabel = () => {
        btn.textContent = window.__battleLogDetailDefaultOpen ? '📜 戦闘経過：開' : '📜 戦闘経過：閉';
      };
      refreshLabel();
      btn.addEventListener('click', () => {
        window.__battleLogDetailDefaultOpen = !window.__battleLogDetailDefaultOpen;
        refreshLabel();
        try {
          localStorage.setItem('battleLogDetailDefaultOpen', window.__battleLogDetailDefaultOpen ? 'open' : 'closed');
        } catch(e) {}
      });
      container.appendChild(btn);
    }
  } catch(e) {}
// 初期反映
  slider.value = String(__clamp(window.__BATTLE_LOG_BASE_DELAY_MS, Number(slider.min||5), Number(slider.max||200)));
  valueEl.textContent = `${slider.value}ms`;

  const setActive = () => {
    const m = __clamp(window.__BATTLE_LOG_ACCEL_MODE, 0, 2);
    b0.classList.toggle('active', m === 0);
    b1.classList.toggle('active', m === 1);
    b2.classList.toggle('active', m === 2);
  };
  setActive();

  // 速度スライダー
  slider.addEventListener('input', () => {
    const v = __clamp(slider.value, Number(slider.min||5), Number(slider.max||200));
    window.__BATTLE_LOG_BASE_DELAY_MS = v;
    valueEl.textContent = `${v}ms`;
    __saveBattleLogSpeedSettings();
  });

  // 加速度ボタン
  b0.addEventListener('click', () => { window.__BATTLE_LOG_ACCEL_MODE = 0; setActive(); __saveBattleLogSpeedSettings(); });
  b1.addEventListener('click', () => { window.__BATTLE_LOG_ACCEL_MODE = 1; setActive(); __saveBattleLogSpeedSettings(); });
  b2.addEventListener('click', () => { window.__BATTLE_LOG_ACCEL_MODE = 2; setActive(); __saveBattleLogSpeedSettings(); });

  // モバイルでの誤タップ対策（必要最低限）
  [b0,b1,b2].forEach(btn=>{
    btn.addEventListener('touchstart', (e)=>{ try{ e.stopPropagation(); }catch(_e){} }, {passive:true});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  __loadBattleLogSpeedSettings();
  __applyBattleLogControlsUI();
});

// グローバル
let battleLogTimerId = null;
let isBattleLogRunning = false;

// ===== 戦闘経過（ターン詳細）の初期開閉トグル（設定保存） =====
window.__battleLogDetailDefaultOpen = true;
try {
  const saved = localStorage.getItem('battleLogDetailDefaultOpen');
  if (saved === 'closed') window.__battleLogDetailDefaultOpen = false;
} catch(e) {}


function displayBattleLogWithoutAsync(log) {
  if (isBattleLogRunning && battleLogTimerId !== null) {
    clearTimeout(battleLogTimerId);
    battleLogTimerId = null;
  }

  const battleLogEl = document.getElementById('battleLog');
  battleLogEl.innerHTML = '';

  // HTMLタグの混入防止：一度DOMで解釈してテキスト化
  const cleanLog = (Array.isArray(log) ? log : []).map(line => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = String(line ?? '');
    return tempDiv.textContent || '';
  });

  let i = 0;
  isBattleLogRunning = true;

  // 直近ターンの「終了時HP」を保持（HP増減の算出用）
  let __prevEndHpP = null;
  let __prevEndHpE = null;

  // 直近ターンの「優劣バー（HP割合）」を保持（前ターンのうっすら重ね表示用）
  let __prevAdvShares = null;

  // 現在のターンブロック
  let __currentTurn = null;

  const __isHpBarLine = (t) => {
    // 例: 自:[■■■■] 98% / 敵:[■■■■] 99%
    return (/^(自|敵)\s*:\s*\[/.test(t) || /^(自|敵)\s*:\s*\[.*\]\s*\d+%/.test(t));
  };

  const __fmtDelta = (d) => {
    const n = Number(d);
    if (!Number.isFinite(n)) return '±0';
    if (n > 0) return `+${Math.floor(n)}`;
    if (n < 0) return `${Math.floor(n)}`;
    return '±0';
  };


  // HP増減の大きさ（最大HP比）に応じてフォントサイズを決める
  const __calcDeltaFontSizePx = (delta, maxHp, basePx = 10, maxPx = 20) => {
    const d = Math.abs(Number(delta) || 0);
    const m = Math.max(1, Number(maxHp) || 1);
    const ratio = Math.min(1, d / m); // 0〜1に丸める
    const px = basePx + (maxPx - basePx) * ratio;
    return Math.max(basePx, Math.min(maxPx, px));
  };
  const __toggleOpenClose = (headerEl, arrowEl, contentEl) => {
    if (!contentEl) return;
    const isClosed = (contentEl.style.maxHeight === '0px' || !contentEl.style.maxHeight);
    if (isClosed) {
      contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
      contentEl.setAttribute('aria-hidden', 'false');
      if (arrowEl) arrowEl.textContent = '▼';
      if (headerEl) headerEl.classList.add('open');
    } else {
      contentEl.style.maxHeight = '0px';
      contentEl.setAttribute('aria-hidden', 'true');
      if (arrowEl) arrowEl.textContent = '▶';
      if (headerEl) headerEl.classList.remove('open');
    }
  };

  const __createTurnBlock = (turnText) => {
    const block = document.createElement('div');
    block.classList.add('turn-block');

    const title = document.createElement('div');
    title.classList.add('turn-banner');
    title.textContent = turnText;
    block.appendChild(title);

    const hpLine = document.createElement('div');
    hpLine.classList.add('turn-hp-delta');
    hpLine.textContent = 'HP変化：計算中...';
    block.appendChild(hpLine);


    // 100%積み上げ：残りHP割合による「優劣バー」（前ターンを薄く重ねる）
    const advBar = document.createElement('div');
    advBar.classList.add('turn-advbar');
    advBar.setAttribute('role', 'img');
    advBar.setAttribute('aria-label', '残りHP割合バー');

    const advLayerCurrent = document.createElement('div');
    advLayerCurrent.classList.add('turn-advbar-layer', 'is-current');

    const advCurP = document.createElement('div');
    advCurP.classList.add('turn-advbar-seg', 'is-player');
    advLayerCurrent.appendChild(advCurP);

    const advCurE = document.createElement('div');
    advCurE.classList.add('turn-advbar-seg', 'is-enemy');
    advLayerCurrent.appendChild(advCurE);

    const advLayerPrev = document.createElement('div');
    advLayerPrev.classList.add('turn-advbar-layer', 'is-prev', 'is-hidden');

    const advPrevP = document.createElement('div');
    advPrevP.classList.add('turn-advbar-seg', 'is-player');
    advLayerPrev.appendChild(advPrevP);

    const advPrevE = document.createElement('div');
    advPrevE.classList.add('turn-advbar-seg', 'is-enemy');
    advLayerPrev.appendChild(advPrevE);

    advBar.appendChild(advLayerCurrent);
    advBar.appendChild(advLayerPrev);
    block.appendChild(advBar);


    // 出来事トグル（ステータスボタンに似せる）
    const evHeader = document.createElement('div');
    evHeader.classList.add('turn-stats-header', 'turn-events-header');
    const evArrow = document.createElement('span');
    evArrow.classList.add('turn-stats-arrow');
    evArrow.textContent = '▶';
    evHeader.appendChild(evArrow);
    const evTitle = document.createElement('span');
    evTitle.classList.add('turn-stats-title');
    evTitle.textContent = ' 戦闘経過（タップで開閉）';
    evHeader.appendChild(evTitle);
    block.appendChild(evHeader);

    const evContent = document.createElement('div');
    evContent.classList.add('turn-stats-content', 'turn-events-content');
    evContent.style.maxHeight = '0px';
    evContent.style.overflow = 'hidden';
    evContent.setAttribute('aria-hidden', 'true');
    
    // 初期状態（設定により開いた状態で開始）
    if (window.__battleLogDetailDefaultOpen) {
      evContent.style.maxHeight = 'none';
      evContent.setAttribute('aria-hidden', 'false');
      evArrow.textContent = '▼';
      evHeader.classList.add('open');
    }
block.appendChild(evContent);

    evHeader.addEventListener('click', () => __toggleOpenClose(evHeader, evArrow, evContent));

    // ステータストグル（既存スタイル流用）
    const stHeader = document.createElement('div');
    stHeader.classList.add('turn-stats-header', 'turn-status-header');
    const stArrow = document.createElement('span');
    stArrow.classList.add('turn-stats-arrow');
    stArrow.textContent = '▶';
    stHeader.appendChild(stArrow);
    const stTitle = document.createElement('span');
    stTitle.classList.add('turn-stats-title');
    stTitle.textContent = ' ステータス（タップで開閉）';
    stHeader.appendChild(stTitle);
    block.appendChild(stHeader);

    const stContent = document.createElement('div');
    stContent.classList.add('turn-stats-content', 'turn-status-content');
    stContent.style.maxHeight = '0px';
    stContent.style.overflow = 'hidden';
    stContent.setAttribute('aria-hidden', 'true');
    block.appendChild(stContent);

    stHeader.addEventListener('click', () => __toggleOpenClose(stHeader, stArrow, stContent));

    return { block, hpLine, advBar, advCurP, advCurE, advLayerPrev, advPrevP, advPrevE, evContent, stContent, stHeader, stArrow, evHeader, evArrow };
  };

  const __appendPlainLine = (lineText) => {
    const div = document.createElement('div');
    div.textContent = lineText;
    battleLogEl.appendChild(div);
  };

  const __renderTurnStatsInto = (containerEl, lineText) => {
    // containerEl は「中身だけ」を追加する（ヘッダはターン側にある）
    if (!containerEl) return null;

    // __TURN_STATS__|P,hp,max,dMax,atk,dAtk,def,dDef,spd,dSpd|E,...
    const parts = lineText.split('|').slice(1);

    const parseSide = (seg) => {
      const vals = String(seg || '').split(',');
      const n = (v) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : 0);
      return {
        side: vals[0] || '?',
        hp: n(vals[1]),
        max: n(vals[2]),
        dMax: n(vals[3]),
        atk: n(vals[4]),
        dAtk: n(vals[5]),
        def: n(vals[6]),
        dDef: n(vals[7]),
        spd: n(vals[8]),
        dSpd: n(vals[9]),
      };
    };

    const makeDelta = (v) => {
      const n = Math.floor(Number(v || 0));
      if (!n) return '';
      return (n > 0) ? `+${n}` : `${n}`;
    };

    const p = parseSide(parts[0] || '');
    const e = parseSide(parts[1] || '');

    const row = document.createElement('div');
    row.classList.add('turn-stats-row');

    const mkSideCard = (label, data) => {
      const cardWrap = document.createElement('div');
      cardWrap.classList.add('turn-stats-card');
      const mkLine = (key, valueText, deltaVal) => {
        const line = document.createElement('div');
        line.classList.add('stat');
        line.setAttribute('data-key', key);

        const k = document.createElement('span');
        k.classList.add('k');
        k.textContent = (key === 'hp') ? 'HP' : key.toUpperCase();
        line.appendChild(k);

        const v = document.createElement('span');
        v.classList.add('v');
        v.textContent = valueText;
        line.appendChild(v);

        const d = document.createElement('span');
        d.classList.add('delta');
        const ds = makeDelta(deltaVal);
        d.textContent = ds ? `(${ds})` : '';
        if (ds) {
          if (String(ds).startsWith('+')) d.classList.add('pos');
          else d.classList.add('neg');
        }
        line.appendChild(d);

        cardWrap.appendChild(line);
      };

      mkLine('hp', `${data.hp}/${data.max}`, 0);
      mkLine('atk', String(data.atk), data.dAtk);
      mkLine('def', String(data.def), data.dDef);
      mkLine('spd', String(data.spd), data.dSpd);
      mkLine('max', String(data.max), data.dMax);

      return cardWrap;
    };

    // 左ラベル
    const sideCol = document.createElement('div');
    sideCol.classList.add('side');
    sideCol.textContent = 'P';
    row.appendChild(sideCol);
    row.appendChild(mkSideCard('P', p));

    const sideCol2 = document.createElement('div');
    sideCol2.classList.add('side');
    sideCol2.textContent = 'E';
    row.appendChild(sideCol2);
    row.appendChild(mkSideCard('E', e));

    // 既存の中身をリセットして差し替え（ターン内の最後の状態だけ見ればOK）
    containerEl.innerHTML = '';
    containerEl.appendChild(row);

    return { p, e };
  };

  function showNextLine() {
    if (i >= cleanLog.length) {
      isBattleLogRunning = false;
      battleLogTimerId = null;
      drawHPGraph();
      updateStats();
      return;
    }

    const lineTextRaw = cleanLog[i];
    const lineText = String(lineTextRaw ?? '').trim();

    // 空行はスキップ
    if (!lineText) {
      i++;
      battleLogTimerId = window.__battleSetTimeout(showNextLine, __getBattleLogDelayMs(i, cleanLog.length));
      return;
    }

    // ターン区切り：新しいターンブロックを作る
    if (/^[-–]{2,}\s*\d+ターン\s*[-–]{2,}$/.test(lineText)) {
      __currentTurn = __createTurnBlock(lineText);
      battleLogEl.appendChild(__currentTurn.block);

      requestAnimationFrame(() => {
        battleLogEl.scrollTo({ top: battleLogEl.scrollHeight, behavior: 'smooth' });
      });

      i++;
      battleLogTimerId = window.__battleSetTimeout(showNextLine, __getBattleLogDelayMs(i, cleanLog.length));
      return;
    }

    // __TURN_STATS__：ステータス更新＋HP増減の算出＋（HPバー等は非表示）
    if (lineText.startsWith('__TURN_STATS__')) {
      if (__currentTurn) {
        const parsed = __renderTurnStatsInto(__currentTurn.stContent, lineText);
        if (parsed && parsed.p && parsed.e) {
          // 直前ターン終了HPが無い場合、戦闘開始時は満タン前提（max）
          const startHpP = (__prevEndHpP === null) ? parsed.p.max : __prevEndHpP;
          const startHpE = (__prevEndHpE === null) ? parsed.e.max : __prevEndHpE;

          const dP = parsed.p.hp - startHpP;
          const dE = parsed.e.hp - startHpE;

          {
          const sizeP = __calcDeltaFontSizePx(dP, parsed.p.max, 10, 20);
          const sizeE = __calcDeltaFontSizePx(dE, parsed.e.max, 10, 20);

          const clsP = (dP < 0) ? 'hpdelta-neg-player' : (dP > 0 ? 'hpdelta-pos' : 'hpdelta-zero');
          const clsE = (dE < 0) ? 'hpdelta-neg-enemy' : (dE > 0 ? 'hpdelta-pos' : 'hpdelta-zero');

          __currentTurn.hpLine.innerHTML =
            `HP増減：自 <span class="hpdelta ${clsP}" style="font-size:${sizeP.toFixed(1)}px">${__fmtDelta(dP)}</span>` +
            `（${startHpP}→${parsed.p.hp}） / 敵 <span class="hpdelta ${clsE}" style="font-size:${sizeE.toFixed(1)}px">${__fmtDelta(dE)}</span>` +
            `（${startHpE}→${parsed.e.hp}）`;
        }

          // ---- 優劣バー（100%積み上げ）更新：残りHP割合ベース ----
          try {
            const pRem = Math.max(0, Number(parsed.p.hp) || 0) / Math.max(1, Number(parsed.p.max) || 1);
            const eRem = Math.max(0, Number(parsed.e.hp) || 0) / Math.max(1, Number(parsed.e.max) || 1);
            const sum = pRem + eRem;
            const pShare = (sum > 0) ? (pRem / sum) : 0.5;
            const eShare = (sum > 0) ? (eRem / sum) : 0.5;

            const pPct = Math.max(0, Math.min(100, pRem * 100));
            const ePct = Math.max(0, Math.min(100, eRem * 100));

            if (__currentTurn.advCurP && __currentTurn.advCurE) {
              __currentTurn.advCurP.style.width = `${(pShare * 100).toFixed(2)}%`;
              __currentTurn.advCurE.style.width = `${(eShare * 100).toFixed(2)}%`;
            }

            if (__currentTurn.advBar) {
              __currentTurn.advBar.title = `残りHP：自 ${pPct.toFixed(1)}% / 敵 ${ePct.toFixed(1)}%`;
              __currentTurn.advBar.setAttribute('aria-label', `残りHP：自 ${pPct.toFixed(1)}% / 敵 ${ePct.toFixed(1)}%`);
            }

            // 前ターンをうっすら重ねる（2ターン目以降）
            if (__prevAdvShares && __currentTurn.advLayerPrev && __currentTurn.advPrevP && __currentTurn.advPrevE) {
              __currentTurn.advPrevP.style.width = `${(__prevAdvShares.pShare * 100).toFixed(2)}%`;
              __currentTurn.advPrevE.style.width = `${(__prevAdvShares.eShare * 100).toFixed(2)}%`;
              __currentTurn.advLayerPrev.classList.remove('is-hidden');
            } else if (__currentTurn.advLayerPrev) {
              __currentTurn.advLayerPrev.classList.add('is-hidden');
            }

            __prevAdvShares = { pShare, eShare, pPct, ePct };
          } catch (_e) {}


          __prevEndHpP = parsed.p.hp;
          __prevEndHpE = parsed.e.hp;

          // ステータスが入ったら、開いた時に高さが合うように閉状態維持
          __currentTurn.stContent.style.maxHeight = '0px';
          __currentTurn.stContent.setAttribute('aria-hidden', 'true');
          __currentTurn.stArrow.textContent = '▶';
          __currentTurn.stHeader.classList.remove('open');
        }
      }
      i++;
      battleLogTimerId = window.__battleSetTimeout(showNextLine, __getBattleLogDelayMs(i, cleanLog.length));
      return;
    }

    // HPバー等は「HP増減まとめ」で置き換えるので非表示
    if (__isHpBarLine(lineText)) {
      i++;
      battleLogTimerId = window.__battleSetTimeout(showNextLine, __getBattleLogDelayMs(i, cleanLog.length));
      return;
    }

    // ターン中の出来事
    if (__currentTurn) {
      const evLine = document.createElement('div');
      evLine.classList.add('turn-event-line');
      evLine.textContent = lineText;
      __currentTurn.evContent.appendChild(evLine);
    } else {
      // ターン開始前（倍率/開始時効果など）は従来通り直書き
      __appendPlainLine(lineText);
    }

    requestAnimationFrame(() => {
      battleLogEl.scrollTo({ top: battleLogEl.scrollHeight, behavior: 'smooth' });
    });

    i++;
    battleLogTimerId = window.__battleSetTimeout(showNextLine, __getBattleLogDelayMs(i, cleanLog.length));
  }

  showNextLine();
}



/********************************
 * 戦闘ログ：ターン終了ステータス表示（CSS装飾用）
 * - ログには安全なマーカー文字列を入れ、描画側でDOM生成する
 ********************************/
function ensureBattleBaseSnapshot(ch) {
  if (!ch) return;
  ch.__battleBaseSnapshot = {
    maxHp: Number(ch.maxHp || 0),
    attack: Number(ch.attack || 0),
    defense: Number(ch.defense || 0),
    speed: Number(ch.speed || 0)
  };
}

function buildTurnEndStatsLine(player, enemy) {
  const snapP = player && player.__battleBaseSnapshot ? player.__battleBaseSnapshot : null;
  const snapE = enemy && enemy.__battleBaseSnapshot ? enemy.__battleBaseSnapshot : null;

  const p = {
    hp: Math.max(0, Math.floor(Number(player?.hp ?? 0))),
    max: Math.max(0, Math.floor(Number(player?.maxHp ?? 0))),
    atk: Math.max(0, Math.floor(Number(player?.attack ?? 0))),
    def: Math.max(0, Math.floor(Number(player?.defense ?? 0))),
    spd: Math.max(0, Math.floor(Number(player?.speed ?? 0))),
    dMax: snapP ? Math.floor(Number(player.maxHp || 0) - Number(snapP.maxHp || 0)) : 0,
    dAtk: snapP ? Math.floor(Number(player.attack || 0) - Number(snapP.attack || 0)) : 0,
    dDef: snapP ? Math.floor(Number(player.defense || 0) - Number(snapP.defense || 0)) : 0,
    dSpd: snapP ? Math.floor(Number(player.speed || 0) - Number(snapP.speed || 0)) : 0,
  };

  const e = {
    hp: Math.max(0, Math.floor(Number(enemy?.hp ?? 0))),
    max: Math.max(0, Math.floor(Number(enemy?.maxHp ?? 0))),
    atk: Math.max(0, Math.floor(Number(enemy?.attack ?? 0))),
    def: Math.max(0, Math.floor(Number(enemy?.defense ?? 0))),
    spd: Math.max(0, Math.floor(Number(enemy?.speed ?? 0))),
    dMax: snapE ? Math.floor(Number(enemy.maxHp || 0) - Number(snapE.maxHp || 0)) : 0,
    dAtk: snapE ? Math.floor(Number(enemy.attack || 0) - Number(snapE.attack || 0)) : 0,
    dDef: snapE ? Math.floor(Number(enemy.defense || 0) - Number(snapE.defense || 0)) : 0,
    dSpd: snapE ? Math.floor(Number(enemy.speed || 0) - Number(snapE.speed || 0)) : 0,
  };

  // __TURN_STATS__|P,hp,max,dMax,atk,dAtk,def,dDef,spd,dSpd|E,...
  return `__TURN_STATS__|P,${p.hp},${p.max},${p.dMax},${p.atk},${p.dAtk},${p.def},${p.dDef},${p.spd},${p.dSpd}` +
         `|E,${e.hp},${e.max},${e.dMax},${e.atk},${e.dAtk},${e.def},${e.dDef},${e.spd},${e.dSpd}`;
}

function pushTurnEndStatsLog(log, player, enemy) {
  if (!Array.isArray(log)) return;
  try {
    log.push(buildTurnEndStatsLine(player, enemy));
  } catch (e) {
    // ログ生成の失敗で戦闘自体が止まらないようにする
  }
}











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

  // 既存の streakBoost は「名前の語選びの見た目」にのみ適用する
  const streakBoost = Math.min(1.0, (window.maxStreak || 0) / 100) * 0.1;

  // --- 星判定に使う“素の”正規化値（※streakBoostは足さない） ---
  const rawActivationPct = Math.max(0, Math.min(1, (activationProb - 0.1) / 0.7));
  const rawEffectPct = Math.max(0, Math.min(1, (effectValue - config.min) / (config.max - config.min)));

  // --- 見た目用（接頭辞インデックス）のみ微ブーストを許容 ---
  const visActivation = Math.max(0, Math.min(1, rawActivationPct + streakBoost));
  const visEffect     = Math.max(0, Math.min(1, rawEffectPct + streakBoost));

  // 接頭辞選択は従来通りの“先頭寄り”ロジック（見た目の分布だけ変える）
  const reversedActivation = 1 - visActivation;
  const reversedEffect = 1 - visEffect;

  const activationPrefixIndex = Math.floor(Math.min(1, Math.pow(reversedActivation, 2.5)) * 39.999);
  const effectPrefixIndex = Math.floor(Math.min(1, Math.pow(reversedEffect, 2.5)) * 39.999);

  const prefix1 = activationPrefixes[activationPrefixIndex];
  const prefix2 = effectValuePrefixes[effectPrefixIndex];
  const fullName = `${prefix1}×${prefix2}${kanaPart}`;

  // ★しきい値を素の分布で評価（0.90/0.75/0.50/0.25）
  function percentileToStars(p) {
    if (p >= 0.90) return 5;
    if (p >= 0.75) return 4;
    if (p >= 0.50) return 3;
    if (p >= 0.25) return 2;
    return 1;
  }
  const starFromActivation = percentileToStars(rawActivationPct);
  const starFromEffect     = percentileToStars(rawEffectPct);
  const starCount = Math.min(starFromActivation, starFromEffect); // 厳しめ評価（従来踏襲）

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
      const lvNum = Math.max(1, Number(level || 1) || 1);
      const lvScale = getMixedSkillLevelScale(lvNum);
      const lvBonusPct = Math.round((lvScale - 1) * 1000) / 10; // 0.1%刻み
      html += `<div style="color: #ffffff;">${name}（Lv${level}｜発動率: ${prob}%｜レベル補正: ×${lvScale.toFixed(3)}（+${lvBonusPct}%））</div>`;
    } else {
      html += `<div style="color: #cccccc;">${indent}${name}（Lv${level}）</div>`;
    }
    if (skill.isMixed && Array.isArray(skill.specialEffects)) {
      for (const eff of skill.specialEffects) {
        const prefix = `${indent}▶ 特殊効果: `;
        const baseVal = Number(eff.baseValue ?? eff.value ?? eff.amount ?? eff.ratio ?? 0);
        const scaledVal = getScaledMixedSpecialEffectValue(skill, { ...eff, baseValue: baseVal, value: baseVal });
        let effectText = "";
        switch (Number(eff.type)) {
          case 1: effectText = `敵の残りHPの<span style="color:#ff9999;">${baseVal}%</span>分の追加ダメージ（Lv補正後: ${scaledVal.toFixed(1)}%）`; break;
          case 2: effectText = `戦闘不能時にHP<span style="color:#99ccff;">${baseVal}%</span>で自動復活（Lv補正後: ${scaledVal.toFixed(1)}%）`; break;
          case 3: effectText = `継続ダメージ時に<span style="color:#aaffaa;">${baseVal}%</span>即時回復（Lv補正後: ${scaledVal.toFixed(1)}%）`; break;
          case 4: effectText = `攻撃力 <span style="color:#ffaa88;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`; break;
          case 5: effectText = `防御力 <span style="color:#88ddff;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`; break;
          case 6: effectText = `素早さ <span style="color:#ffee88;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`; break;
          case 7: effectText = `最大HP <span style="color:#d4ff88;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`; break;
          default: effectText = `不明な効果 type=${eff.type}`; break;
        }
        html += `<div style="color: #dddddd;">${prefix}${effectText}</div>`;
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

// ==== 連勝バイアス用ユーティリティ（追加） ====

// どの“連勝”を効かせるか：現在・セッション最大・保存最大の最大値を採用
function getEffectiveStreak() {
  const a = window.currentStreak || 0;
  const b = window.sessionMaxStreak || 0;
  const c = parseInt(localStorage.getItem('maxStreak') || '0', 10);
  return Math.max(a, b, c);
}

// 0〜1の連勝スコアに正規化（capで頭打ち）
function getStreakScore(capWins = 100) {
  const s = getEffectiveStreak() / capWins;
  return Math.max(0, Math.min(1, s));
}

// 0〜1一様乱数を“上に”寄せる（連勝が増えるほど上振れ）＋ラッキー枠で超上振れ
function biased01ByStreak(s, opts = {}) {
  const {
    expMin = 0.2,      // 連勝MAX時の指数（小さいほど上側に寄る）
    luckyBase = 0.02,  // 連勝0でも超上振れする確率
    luckyGain = 0.015, // 連勝で増える超上振れ確率
    luckyFloor = 0.92  // 超上振れ時の下限（0.92〜1.00で再抽選）
  } = opts;

  // ラッキー枠：常に >0%
  const luckyP = Math.max(0, Math.min(1, luckyBase + luckyGain * s));
  if (Math.random() < luckyP) {
    return luckyFloor + (1 - luckyFloor) * Math.random();
  }

  // ベース分布：expは 1→一様、0.2→強く上寄り
  const exp = 1 - (1 - expMin) * s;
  const u = Math.random();               // U(0,1)
  return Math.pow(u, exp);               // exp<1 で上に寄る
}

// 区間[min,max]に線形マッピング（整数化オプション）
function biasedInRange(min, max, s, asInteger = false, opts = {}) {
  const x = biased01ByStreak(s, opts);   // 0..1（上寄り）
  const v = min + (max - min) * x;
  return asInteger ? Math.floor(v) : v;
}


// スキル生成本体
// ==== 低レア基調＋連勝でじわ上げ＋薄い神引き ====
// 既存の createMixedSkill と置き換えてください
function createMixedSkill(skillA, skillB) {
  const maxDepth = 5;
  const includeMixedSkillChance = 0.3; // 混合スキルを内包する確率

  // 所持上限（既存踏襲）
  if (player && Array.isArray(player.mixedSkills) && player.mixedSkills.length >= 2) {
    return null;
  }

  // --- 互換ユーティリティ（ローカル定義） ---
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
          .filter(s => s && typeof s === 'object')
          .flatMap(s => flattenIfTooDeepOrInvalid(s, currentDepth));
      } else {
        return [skill];
      }
    }
    return [skill];
  }

  // --- 連勝バイアス（低レア基調版） ---
  function getEffectiveStreak() {
    const a = window.currentStreak || 0;
    const b = window.sessionMaxStreak || 0;
    const c = parseInt(localStorage.getItem('maxStreak') || '0', 10);
    return Math.max(a, b, c);
  }
  function getStreakScore(capWins = 100) {
    const s = getEffectiveStreak() / capWins;
    return Math.max(0, Math.min(1, s));
  }
  // 「低めに偏る」分布：u^expLow（expLow>1で0側に寄る）＋薄い神引き
  function lowSkew01ByStreak(s, opts = {}) {
    const {
      expLow0 = 2.8,   // s=0 での指数（強く低めに寄る）
      expLow1 = 1.2,   // s=1 での指数（ほぼ一様に近づく）
      luckyBase = 0.004, // 連勝0でも神引きする確率
      luckyGain = 0.012, // 連勝で神引き率が伸びる
      luckyFloor = 0.85  // 神引き時の下限（0.85〜1.0）
    } = opts;
    const luckyP = Math.max(0, Math.min(1, luckyBase + luckyGain * s));
    if (Math.random() < luckyP) {
      return luckyFloor + (1 - luckyFloor) * Math.random(); // 0.85〜1の上振れ
    }
    const expLow = expLow0 - (expLow0 - expLow1) * s; // s=0→2.8 / s=1→1.2
    const u = Math.random();
    return Math.pow(u, expLow); // 0側（低値）に寄る
  }
  function lowSkewInRange(min, max, s, asInteger = false, opts = {}) {
    const x = lowSkew01ByStreak(s, opts); // 0..1（低値寄り＋レアな上振れ）
    const v = min + (max - min) * x;
    return asInteger ? Math.floor(v) : v;
  }

  // --- 深さ制約 ---
  const depthA = getMixedSkillDepth(skillA);
  const depthB = getMixedSkillDepth(skillB);
  const newDepth = Math.max(depthA, depthB) + 1;
  if (newDepth > maxDepth) {
    alert("これ以上複雑な混合スキルは作成できません（階層制限あり）");
    return null;
  }

  // --- ベーススキル構築（安全化） ---
  let baseSkills = [
    ...flattenIfTooDeepOrInvalid(skillA),
    ...flattenIfTooDeepOrInvalid(skillB)
  ].filter(s => s && typeof s === 'object');

  for (const skill of baseSkills) {
    if (!skill || typeof skill !== 'object') continue;
    if (skill.baseSkills && Array.isArray(skill.baseSkills)) skill.isMixed = true;
    if (!skill.specialEffects && skill.specialEffectType != null) {
      skill.specialEffects = [{ type: skill.specialEffectType, value: skill.specialEffectValue }];
    }
  }
  baseSkills = baseSkills.filter(s => !(s && s.isMixed && (!s.specialEffects || s.specialEffects.length === 0)));
  if (baseSkills.length === 0) baseSkills.push(skillA);
  baseSkills.sort((a, b) => (b.isMixed ? 1 : 0) - (a.isMixed ? 1 : 0));

  const includedMixed = baseSkills.filter(s => s && s.isMixed && Array.isArray(s.specialEffects) && s.specialEffects.length > 0);
  if (includedMixed.length > 0) {
    showCenteredPopup(`🌀 混合スキルの特殊効果が継承されました！<br>
<span style="font-size: 10px; color: #ffcc99;">※特殊効果の書かれていない混合スキルは特殊効果無効です</span>`);
    window.withmix = true;
  }

  // --- レベル・名前準備 ---
  const totalLevel = baseSkills.reduce((sum, s) => sum + (s.level || 1), 0);
  const averageLevel = Math.max(1, Math.round(totalLevel / baseSkills.length));

  const kanaChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
  const nameLength = Math.floor(Math.random() * 3) + 2;
  const kanaPart = Array.from({ length: nameLength }, () =>
    kanaChars[Math.floor(Math.random() * kanaChars.length)]
  ).join("");

  // --- 効果タイプ抽選（既存互換） ---
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

  // === ココが新しい“逆分布” ===
  const s = getStreakScore(100); // 100連勝で頭打ち

  // 発動率：原作の0.1〜0.8を意識しつつ、デフォは低値寄り
  // 上限は連勝で少し伸びる（0.65→0.80）、下限は0.05まで許容
  const probMin = 0.05;
  const probMaxBase = 0.65;
  const probMax = probMaxBase + 0.15 * s; // s=0:0.65 / s=1:0.80
  const activationProb = Math.min(0.90,
    lowSkewInRange(probMin, probMax, s, false, {
      expLow0: 2.8, expLow1: 1.3, // 低値寄りの強さ
      luckyBase: 0.004, luckyGain: 0.012, luckyFloor: 0.85
    })
  );

  // 効果値：タイプごとのレンジ内で“低め”基調、神引きで上に跳ねる
  let effectValue;
  if (effectType <= 3) {
    // 1:残HP%ダメ／2:復活HP%／3:DoT時の即時回復%（整数）
    const v = lowSkewInRange(config.min, config.max, s, true, {
      expLow0: 2.6, expLow1: 1.3,
      luckyBase: 0.003, luckyGain: 0.010, luckyFloor: 0.85
    });
    effectValue = Math.max(config.min, Math.min(config.max, v));
  } else {
    // 4〜7: ATK/DEF/SPD/HP 倍率（小数1桁）
    const v = lowSkewInRange(config.min, config.max, s, false, {
      expLow0: 2.6, expLow1: 1.3,
      luckyBase: 0.003, luckyGain: 0.010, luckyFloor: 0.85
    });
    effectValue = Math.round(Math.max(config.min, Math.min(config.max, v)) * 10) / 10;
  }

  // --- 名前＆★ランク（既存の generateSkillName を使用） ---
  const { fullName, rarityClass, starRating } = generateSkillName(
    activationProb, effectValue, config, kanaPart
  );

  // --- 最終オブジェクト ---
  baseSkills = baseSkills.filter(s =>
    s && !(s.isMixed && (!s.specialEffects || s.specialEffects.length === 0))
  );
  baseSkills.sort((a, b) => (b.isMixed ? 1 : 0) - (a.isMixed ? 1 : 0));

  const newMixed = {
    name: fullName,
    isMixed: true,
    baseSkills,
    level: averageLevel,
    activationProb,
    specialEffectType: effectType,
    specialEffectValue: effectValue,
    specialEffects: [{ type: effectType, value: effectValue }],
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


function onSkillAcquired(newSkill) {
  if (!player.mixedSkills) {
    player.mixedSkills = [];
  }

  const canMix = player.skills.length > 0;

  // 固有スキル処理
  if (newSkill.isUnique) {
    if (Math.random() < 0.05 && canMix) {
      alert("生成されます");
      const partnerSkill = player.skills[Math.floor(Math.random() * player.skills.length)];
      const mixedSkill = createMixedSkill(newSkill, partnerSkill);

      if (mixedSkill && !hasSkill(mixedSkill.name)) {
        player.skills.push(mixedSkill);
        player.mixedSkills.push(mixedSkill);
      }
    } else {
      if (!hasSkill(newSkill.name)) {
        player.skills.push(newSkill); // 混合スキル生成失敗時のみ
      }
    }

    return;
  }

  // 通常スキル処理
  if (Math.random() < 0.1 && canMix) {
    const partnerSkill = player.skills[Math.floor(Math.random() * player.skills.length)];
    const mixedSkill = createMixedSkill(newSkill, partnerSkill);

    if (mixedSkill && !hasSkill(mixedSkill.name)) {
      player.skills.push(mixedSkill);
      player.mixedSkills.push(mixedSkill);
      drawCombinedSkillList();
    }
  } else {
    if (!hasSkill(newSkill.name)) {
      player.skills.push(newSkill); // 混合スキル生成失敗時のみ
    }
  }
	
	
	updateSkillOverlay;

	
}

// ※既存のスキル取得処理の最後で onSkillAcquired(newSkill) が呼ばれるように組み込んでください。



/********************************
 * 混合スキル：レベル補正ユーティリティ
 * - 「ほんの少しずつ伸びる」ため、対数で緩やかに増加（最大+15%）
 ********************************/
function getMixedSkillLevelScale(level) {
  const lv = Math.max(1, Number(level || 1) || 1);
  // Lv1=1.00, Lv10≈1.02, Lv100≈1.04, Lv1000≈1.06 ... 最大1.15
  const scale = 1.0 + Math.min(0.15, 0.02 * Math.log10(lv));
  return scale;
}

function getScaledMixedSpecialEffectValue(skill, effect) {
  if (!effect) return 0;
  const type = Number(effect.type);
  const base = Number(effect.baseValue ?? effect.value ?? effect.amount ?? effect.ratio ?? 0);
  const scale = getMixedSkillLevelScale(skill && skill.level);
  if (!isFinite(base)) return base;

  // 4-7（倍率系）は「1からの差分」だけを伸ばす
  if (type >= 4 && type <= 7) {
    return 1 + (base - 1) * scale;
  }
  // 1-3（%系）はそのまま伸ばす
  return base * scale;
}

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
    // 旧形式（specialEffectType/Value）→ 新形式（specialEffects[]）へ
    if (!skill.specialEffects && skill.specialEffectType != null) {
      skill.specialEffects = [{
        type: skill.specialEffectType,
        value: skill.specialEffectValue,
        baseValue: skill.specialEffectValue
      }];
    }
    // baseValue を必ず保持（スキルレベル補正の基準にする）
    if (Array.isArray(skill.specialEffects)) {
      for (const eff of skill.specialEffects) {
        if (!eff) continue;
        if (typeof eff.baseValue === 'undefined') {
          const v = (typeof eff.value !== 'undefined') ? eff.value : (eff.amount ?? eff.ratio ?? 0);
          eff.baseValue = v;
        }
      }
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

  // SPECIAL_ONLY: 内包スキル(baseSkills)は発動しない（仕様）
// ただし「特殊効果そのもの」は必ず実行する（return で潰さない）
if (typeof handler === "function") {
  const scaled = getScaledMixedSpecialEffectValue(skill, effect);
  handler(scaled, skill, effect);
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
      try {
        if (typeof window.getSkillEffect === "function") {
          window.getSkillEffect(skill, user, target, log);
        } else if (typeof getSkillEffect === "function") {
          getSkillEffect(skill, user, target, log);
        } else {
          log.push("※ エラー: getSkillEffect が見つからないため、効果を適用できません");
        }
      } catch (e) {
        console.error("[MixedSkill] getSkillEffect failed:", e);
        log.push(`※ エラー: 混合スキル効果適用中に例外が発生しました (${e && e.message ? e.message : e})`);
      }
    }
  }

  applySkillRecursive(mixedSkill);
}



/********************************
 * 混合スキル：効果一覧ポップアップ
 ********************************/
window.showMixedSkillEffectListPopup = function() {
  const popupId = "mixed-effect-list-popup";
  const existing = document.getElementById(popupId);
  if (existing) existing.remove();

  const wrap = document.createElement("div");
  wrap.id = popupId;
  wrap.style.position = "fixed";
  wrap.style.left = "50%";
  wrap.style.top = "50%";
  wrap.style.transform = "translate(-50%, -50%)";
  wrap.style.maxWidth = "92vw";
  wrap.style.width = "520px";
  wrap.style.maxHeight = "80vh";
  wrap.style.overflow = "auto";
  wrap.style.background = "#222";
  wrap.style.color = "#fff";
  wrap.style.border = "2px solid #fff";
  wrap.style.borderRadius = "10px";
  wrap.style.padding = "14px 16px";
  wrap.style.zIndex = "10020";
  wrap.style.whiteSpace = "pre-wrap";
  wrap.style.boxShadow = "0 6px 20px rgba(0,0,0,0.6)";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "閉じる";
  closeBtn.style.position = "sticky";
  closeBtn.style.top = "0";
  closeBtn.style.float = "right";
  closeBtn.style.marginLeft = "12px";
  closeBtn.style.padding = "6px 10px";
  closeBtn.style.border = "1px solid #fff";
  closeBtn.style.background = "#333";
  closeBtn.style.color = "#fff";
  closeBtn.style.borderRadius = "8px";
  closeBtn.addEventListener("click", () => wrap.remove());

  const title = document.createElement("div");
  title.textContent = "混合スキル：レベル補正つき効果一覧";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";

  const body = document.createElement("div");
  const skills = (window.player && Array.isArray(window.player.skills)) ? window.player.skills.filter(s => s && s.isMixed) : [];
  if (!skills.length) {
    body.textContent = "混合スキルがありません。";
  } else {
    let t = "";
    for (const ms of skills) {
      const lv = Math.max(1, Number(ms.level || 1) || 1);
      const scale = getMixedSkillLevelScale(lv);
      const p = Math.round(_normProb(ms.activationProb, 0.35) * 100);
      t += `■ ${ms.name}  (Lv${lv} / 発動率${p}% / レベル補正×${scale.toFixed(3)})\n`;

      const effs = Array.isArray(ms.specialEffects) ? ms.specialEffects : (ms.specialEffectType != null ? [{ type: ms.specialEffectType, value: ms.specialEffectValue, baseValue: ms.specialEffectValue }] : []);
      if (!effs.length) {
        t += "  - 特殊効果なし\n\n";
        continue;
      }
      for (const eff of effs) {
        if (!eff) continue;
        const type = Number(eff.type);
        const base = Number(eff.baseValue ?? eff.value ?? 0);
        const scaled = getScaledMixedSpecialEffectValue(ms, eff);

        const fmtPct = (v) => `${(Math.round(v * 10) / 10)}%`;
        const fmtMul = (v) => `${(Math.round(v * 1000) / 1000)}倍`;

        if (type === 1) t += `  - 敵残HP%ダメージ: ${fmtPct(base)} → ${fmtPct(scaled)}\n`;
        else if (type === 2) t += `  - 復活HP%: ${fmtPct(base)} → ${fmtPct(scaled)}\n`;
        else if (type === 3) t += `  - 毒/火傷吸収(即時回復)%: ${fmtPct(base)} → ${fmtPct(scaled)}\n`;
        else if (type === 4) t += `  - 攻撃倍率(所持時): ${fmtMul(base)} → ${fmtMul(scaled)}\n`;
        else if (type === 5) t += `  - 防御倍率(所持時): ${fmtMul(base)} → ${fmtMul(scaled)}\n`;
        else if (type === 6) t += `  - 速度倍率(所持時): ${fmtMul(base)} → ${fmtMul(scaled)}\n`;
        else if (type === 7) t += `  - 最大HP倍率(所持時): ${fmtMul(base)} → ${fmtMul(scaled)}\n`;
        else t += `  - type${type}: ${base} → ${scaled}\n`;
      }
      t += "\n";
    }
    body.textContent = t.trim();
  }

  wrap.appendChild(closeBtn);
  wrap.appendChild(title);
  wrap.appendChild(body);
  document.body.appendChild(wrap);
};
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

  window.__battleSetTimeout(() => {
    if (popup.parentNode) {
      popup.style.opacity = "0";
      window.__battleSetTimeout(() => popup.remove(), 300);
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

  window.__battleSetTimeout(() => {
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

  window.__battleSetTimeout(() => {
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
  window.__battleSetTimeout(() => {
    subtitleEl.style.opacity = '0';
    // 完全に消えた後に display を none に戻す
    window.__battleSetTimeout(() => {
      subtitleEl.style.display = 'none';
    }, 500); // フェード時間と一致
  }, duration);
}

function setupToggleButtons() {
  const growthBtn = document.getElementById('toggleGrowthEvents');
  const skillDelBtn = document.getElementById('toggleSkillDeleteEvents');
  const itemBtn = document.getElementById('toggleItemInterrupt');
  const autoSaveBtn = document.getElementById('toggleAutoSave');

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


if (autoSaveBtn) {
  autoSaveBtn.onclick = () => {
    window.autoSaveEnabled = !window.autoSaveEnabled;
    updateButtonState(autoSaveBtn, window.autoSaveEnabled, "自動保存: ON（10戦ごと）", "自動保存: OFF（10戦ごと）");
  };
}

  updateButtonState(growthBtn, window.allowGrowthEvent, "成長イベント: 発生", "成長イベント: 発生しない");
  updateButtonState(skillDelBtn, window.allowSkillDeleteEvent, "スキルイベント: 発生", "スキルイベント: 発生しない");
  updateButtonState(itemBtn, window.allowItemInterrupt, "アイテム入手: 停止する", "アイテム入手: 停止しない");
  if (autoSaveBtn) {
    updateButtonState(autoSaveBtn, window.autoSaveEnabled, "自動保存: ON（10戦ごと）", "自動保存: OFF（10戦ごと）");
  }
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
  function describeMixedEffectScaled(skill, eff) {
    if (!eff) return null;

    const type = Number(eff.type);
    const base = Number(eff.baseValue ?? eff.value ?? eff.amount ?? eff.ratio ?? 0);
    const scaledRaw = (typeof getScaledMixedSpecialEffectValue === "function")
      ? getScaledMixedSpecialEffectValue(skill, eff)
      : base;

    const scaled = Number(scaledRaw);

    const fmtPct = (v) => `${(Math.round(v * 10) / 10)}%`;
    const fmtMul = (v) => `${(Math.round(v * 1000) / 1000)}倍`;

    const isPct = (type >= 1 && type <= 3);
    const baseTxt = isPct ? fmtPct(base) : fmtMul(base);
    const scaledTxt = isPct ? fmtPct(scaled) : fmtMul(scaled);

    const showArrow = (isFinite(base) && isFinite(scaled) && Math.abs(base - scaled) > 1e-9);
    const suffix = showArrow ? `: ${baseTxt} → ${scaledTxt}` : `: ${baseTxt}`;

    switch (type) {
      case 1: return `敵残HP%ダメージ${suffix}`;
      case 2: return `復活HP%${suffix}`;
      case 3: return `毒/火傷吸収(即時回復)%${suffix}`;
      case 4: return `攻撃倍率(所持時)${suffix}`;
      case 5: return `防御倍率(所持時)${suffix}`;
      case 6: return `速度倍率(所持時)${suffix}`;
      case 7: return `最大HP倍率(所持時)${suffix}`;
      default: return `不明な効果 type=${type}${suffix}`;
    }
  }


  player.mixedSkills.forEach(skill => {
    const li = document.createElement("li");
    li.className = "skill-entry mixed-skill-entry";

    const activation = skill.activationRate ?? skill.activationProb ?? 0;
    const activationPercent = Math.round(activation * 100);

    // --- タイトル行 ---
    const titleLine = document.createElement('div');
    titleLine.className = 'mixed-skill-title';
    const lv = Math.max(1, Number(skill.level || 1) || 1);
    const scale = (typeof getMixedSkillLevelScale === "function") ? getMixedSkillLevelScale(lv) : 1;
    titleLine.textContent = `${skill.starRating || ""} ${skill.name}（Lv: ${lv}｜発動率: ${activationPercent}%｜補正×${Number(scale).toFixed(3)}）`;

    if (skill.isProtected) {
      titleLine.textContent += "【保護】";
      li.classList.add("skill-protected");
    }
    li.appendChild(titleLine);

    // --- 特殊効果（常時表示）---
    const effects = Array.isArray(skill.specialEffects)
      ? skill.specialEffects
      : (skill.specialEffectType != null ? [{ type: skill.specialEffectType, value: skill.specialEffectValue }] : []);

    if (effects.length > 0) {
      const box = document.createElement('div');
      box.className = 'mixed-skill-effects';
      effects.forEach(eff => {
        const line = describeMixedEffectScaled(skill, eff);
        if (!line) return;
        const div = document.createElement('div');
        div.className = 'mixed-skill-effect-line';
        div.textContent = `▶ ${line}`;
        box.appendChild(div);
      });
      li.appendChild(box);
    }

    if (skill.rarityClass) {
      li.classList.add(skill.rarityClass);
    }

    // --- クリックイベント ---
    li.onclick = (event) => {
      // タップで保護UI（eventPopup）を開く
      onMixedSkillClick(skill, event);
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
  // ★ 通常スキル選出：ランダム＋「同じスキル連打ほど選ばれにくい」補正
  // - maxActivations(=skillSimulCount) が 1 のとき、従来の「先頭が通りやすい」偏りを避ける
  // - 直近ターンに使ったスキルほど重みを下げ、連続使用は指数的に下げる（ただし0にはしない）
  if (!actor) return [];
  if (!actor.usedSkillNames) actor.usedSkillNames = new Set();

  // 選出状態（キャラごとに保持）
  if (!actor._skillPickState || typeof actor._skillPickState !== 'object') {
    actor._skillPickState = {
      recentQueue: [],   // 直近の使用履歴（名前配列）
      lastName: null,    // 直前に使ったスキル名
      lastStreak: 0      // 直前スキルの連続回数
    };
  }
  const state = actor._skillPickState;

  const usableSkills = (actor.skills || []).filter(skill => {
    if (!skill || typeof skill !== 'object') return false;
    const data = skillPool.find(s => s.name === skill.name);
    const isPassive = data?.category === 'passive';
    const isMixedCategory = data?.category === 'mixed';
    // 混合スキルは通常スキルとしての効果が無い（特殊効果は戦闘開始時に別処理）ため、選択対象から除外
    if (skill.isMixed) return false;
    return !skill.sealed && !isPassive && !isMixedCategory;
  });

  // 通常スキルが1つも無い場合はスキル発動なし
  if (!usableSkills || usableSkills.length === 0) return [];

  let availableSkills = usableSkills;


  // usedSkillNames が Set でない場合（セーブ/復元等で配列化するケース）に備えて必ず Set に正規化
  if (!(actor.usedSkillNames instanceof Set)) {
    if (Array.isArray(actor.usedSkillNames)) {
      actor.usedSkillNames = new Set(actor.usedSkillNames);
    } else if (actor.usedSkillNames && typeof actor.usedSkillNames === 'object') {
      actor.usedSkillNames = new Set(Object.keys(actor.usedSkillNames));
    } else {
      actor.usedSkillNames = new Set();
    }
  }
  // 鬼畜モード：未使用スキルのみ対象、一巡したらリセット（従来仕様維持）
  if (window.specialMode === 'brutal') {
    availableSkills = usableSkills.filter(skill => !actor.usedSkillNames.has(skill.name));
    if (availableSkills.length === 0) {
      actor.usedSkillNames.clear();
      availableSkills = [...usableSkills];
    }
  }

  // プレイヤーが1つでも攻撃スキルを所持しているか
  const hasAnyOffensive = availableSkills.some(sk => {
    const data = skillPool.find(s => s.name === sk.name);
    return window.offensiveSkillCategories.includes(data?.category);
  });

  // --- 重み計算（連打ペナルティ） ---
  const RECENT_LIMIT = 6;                 // 直近何回分を見るか
  const RECENT_PENALTY = 0.65;            // 直近にあるほど重みが落ちる係数（1回なら /1.65）
  const STREAK_BASE = 0.35;               // 連続使用は STREAK_BASE^(streak) を掛ける（1回連続=0.35, 2回連続=0.1225...）
  const MIN_WEIGHT = 0.02;                // 0にしない下限（完全固定を防ぐため）

  function countInRecent(name) {
    if (!name) return 0;
    let c = 0;
    for (let i = 0; i < state.recentQueue.length; i++) {
      if (state.recentQueue[i] === name) c++;
    }
    return c;
  }

  function baseActivationRate(skill) {
    const d = skillPool.find(s => s.name === skill.name);
    const r = d?.activationRate ?? 1.0;
    return Math.max(0, Math.min(1, Number(r)));
  }

  function weightForSkill(skill, alreadyChosenNames) {
    const name = skill?.name;
    if (!name) return 0;

    // 同ターン内での重複選出は避ける（複数回発動時に極端に同じのが並ぶのを防ぐ）
    if (alreadyChosenNames && alreadyChosenNames.has(name)) return 0;

    let w = 1.0;

    // 直近使用回数が多いほど下げる（/ (1 + RECENT_PENALTY * count)）
    const recentCount = countInRecent(name);
    w = w / (1 + RECENT_PENALTY * recentCount);

    // 連続使用はさらに指数で下げる
    if (state.lastName && name === state.lastName && state.lastStreak > 0) {
      w = w * Math.pow(STREAK_BASE, state.lastStreak);
    }

    // 最低保証（0にしない）
    if (w < MIN_WEIGHT) w = MIN_WEIGHT;

    return w;
  }

  function weightedPick(skills, alreadyChosenNames) {
    let total = 0;
    const weights = [];
    for (const sk of skills) {
      const w = weightForSkill(sk, alreadyChosenNames);
      weights.push(w);
      total += w;
    }
    if (total <= 0) return null;

    let r = Math.random() * total;
    for (let i = 0; i < skills.length; i++) {
      r -= weights[i];
      if (r <= 0) return skills[i];
    }
    return skills[skills.length - 1] || null;
  }

  function recordUsed(name) {
    if (!name) return;
    if (state.lastName === name) {
      state.lastStreak = (state.lastStreak || 0) + 1;
    } else {
      state.lastName = name;
      state.lastStreak = 1;
    }
    state.recentQueue.push(name);
    if (state.recentQueue.length > RECENT_LIMIT) {
      state.recentQueue.splice(0, state.recentQueue.length - RECENT_LIMIT);
    }
  }

  let finalSkills = [];
  let selectedNames = [];

  // 「攻撃スキルが含まれるまで」リトライ（最大10回）は踏襲
  const maxRetries = hasAnyOffensive ? 10 : 1;

  for (let retry = 0; retry < maxRetries; retry++) {
    finalSkills = [];
    selectedNames = [];
    const chosenNameSet = new Set();

    // スキル候補（毎リトライで新しい配列）
    let candidatePool = [...availableSkills];

    // maxActivations 回まで抽選（発動失敗が続いた場合は早期終了）
    for (let slot = 0; slot < maxActivations; slot++) {
      if (!candidatePool.length) break;

      // 発動失敗を織り込むため「抽選→発動率判定」を複数回試す
      let picked = null;
      const triedThisSlot = new Set();
      for (let attempt = 0; attempt < 30; attempt++) {
        picked = weightedPick(candidatePool, chosenNameSet);
        if (!picked) break;

        // 同スロットで同じ候補を延々引かない保険
        if (triedThisSlot.has(picked.name)) {
          // 一旦この候補をプールから外して再抽選
          candidatePool = candidatePool.filter(s => s.name !== picked.name);
          continue;
        }
        triedThisSlot.add(picked.name);

        const actRate = baseActivationRate(picked);
        if (Math.random() < actRate) {
          // 成功：採用
          finalSkills.push(picked);
          selectedNames.push(picked.name);
          chosenNameSet.add(picked.name);
          break;
        } else {
          // 失敗：このスロットでは当たりにくくするため候補から一旦外す（次slotでは復帰）
          candidatePool = candidatePool.filter(s => s.name !== picked.name);
          picked = null;
          continue;
        }
      }

      // 1つも引けなかったら、このターンの追加発動は打ち切り
      if (!picked) break;
    }

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

  // 使用履歴（連打抑制）の更新：このターンで実際に選ばれた分だけ記録
  for (const sk of finalSkills) {
    recordUsed(sk?.name);
  }

  // プレイヤー向けの表示/解析用の記録（従来仕様踏襲）
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

  // 優先度順に並び替え（従来仕様踏襲）
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
	updateLocalSaveButton2();




(function injectBattleStatusCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .battle-status-display {
      position: fixed;
      top: 10px;
      right: 10px;
      font-size: 10px;
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

    window.__battleSetTimeout(() => {
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
	  // 現在の保護中アイテム数を数える
	  const protectedCount = player.itemMemory.filter(it => it.protected).length;
	
	  // まだ保護されていないアイテムを新たに保護しようとしていて、
	  // すでに3つ保護済みなら拒否する
	  if (!item.protected && protectedCount >= 3) {
	    showCustomAlert("保護は3つまでです", 2000);
	    return;
	  }
	
	  // トグルして再描画
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
	popup.style.visibility = "visible";
	popup.style.display = "block";
}

function onMixedSkillClick(skill, event) {
  clearEventPopup();

  const popup = document.getElementById("eventPopup");
  const title = document.getElementById("eventPopupTitle");
  const container = document.getElementById("eventPopupOptions");
  if (!popup || !title || !container) return;

  const name = (skill && skill.name) ? skill.name : "混合スキル";
  title.innerHTML = `混合スキル <b>${name}</b> をどうする？`;

  // 現在の保護状況（混合は1つだけ保護）
  const alreadyProtected = (player && player.mixedSkills) ? player.mixedSkills.find(s => s.isProtected) : null;
  const protectedCount = alreadyProtected ? 1 : 0;

  const info = document.createElement("div");
  info.style.fontSize = "12px";
  info.style.opacity = "0.9";
  info.style.marginBottom = "10px";
  info.innerHTML = `保護中：<b>${protectedCount}</b> / 1`;
  container.appendChild(info);
  // NOTE: 「効果詳細」メニューは廃止（混合スキル一覧に常時表示へ）。

  const protectBtn = document.createElement("button");
  protectBtn.textContent = skill && skill.isProtected ? "保護を外す" : "保護する";
  protectBtn.onclick = () => {
    const currentProtected = (player && player.mixedSkills) ? player.mixedSkills.find(s => s.isProtected) : null;

    // 解除
    if (skill && skill.isProtected) {
      skill.isProtected = false;
      clearEventPopup();
      if (typeof drawCombinedSkillList === "function") drawCombinedSkillList();
      return;
    }

    // 新規保護（上限1）: すでに保護があるなら移し替え
    if (currentProtected && currentProtected !== skill) {
      currentProtected.isProtected = false;
    }
    if (skill) skill.isProtected = true;

    clearEventPopup();
    if (typeof drawCombinedSkillList === "function") drawCombinedSkillList();
  };
  container.appendChild(protectBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "キャンセル";
  cancelBtn.onclick = () => {
    if (typeof showCustomAlert === "function") showCustomAlert("キャンセルしました", 1500);
    clearEventPopup();
  };
  container.appendChild(cancelBtn);

  // 位置と表示（visibility も戻す）
  const y = ((event && typeof event.clientY === "number") ? event.clientY : (window.innerHeight * 0.3)) + window.scrollY;
  popup.style.position = "absolute";
  popup.style.top = `${y}px`;
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.visibility = "visible";
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
  scrollTimeout = window.__battleSetTimeout(() => {
    if (faceItemEquipped) {
      document.getElementById('faceOverlay')?.classList.remove('hidden');
    }
  }, 300);
});

function maybeGainItemMemory() {
  if (window.specialMode !== 'brutal') return;
  if (!player || !player.skills || player.skills.length === 0) return;
  if (player.itemMemory.length >= 10) return;


// === Pre-drop probability gate (configurable, preserves default behavior) ===
// You can tune these at runtime:
//   window.baseDropRate = 1.0;              // base probability (default 1.0 -> same as before)
//   window.brutalDropRateMult = 1.0;       // multiplier when specialMode==='brutal'
//   window.manualDropRateMult = 1.0;       // multiplier for manual battles (!isAutoBattle)
(function(){
	
	window.manualDropRateMult = 3;
  const base = (typeof window.baseDropRate === 'number') ? window.baseDropRate : 1.0;
  let preDropRate = base;
  if (window.specialMode === 'brutal') {
    const m = (typeof window.brutalDropRateMult === 'number') ? window.brutalDropRateMult : 1.0;
    preDropRate *= m;
  }
  if (typeof isAutoBattle !== 'undefined' && !isAutoBattle) {
    const m = (typeof window.manualDropRateMult === 'number') ? window.manualDropRateMult : 1.0;
    preDropRate *= m;
  }
  preDropRate = Math.max(0, Math.min(1, preDropRate));
  if (Math.random() >= preDropRate) { return; }
})();

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

  window.__battleSetTimeout(() => {
    if (typeof stopAutoBattle === 'function') stopAutoBattle();
    isAutoBattle = false;
  }, 500);

  showSubtitle(message, 4000); // ← showCustomAlert を showSubtitle に変更
}

showCustomAlert(message, 4000, "#ffa", "#000");
}

// -------------------------
// 15ターン僅差勝利報酬（クラッチ報酬）
// - HP割合差が小さいほど、レア寄りのアイテムを付与
// - 2%差以内で発生（tier: 1=〜2%, 2=〜1%, 3=〜0.5%）
// -------------------------
function grantClutchRewardItem(tier, absDiffRatio, log) {
  try {
    if (!player) return;
    if (!player.itemMemory) player.itemMemory = [];
    if (player.itemMemory.length >= 10) {
      if (log) log.push(`【クラッチ報酬】アイテム枠が満杯のため獲得できませんでした（最大10個）`);
      return;
    }
    if (!Array.isArray(skillPool) || skillPool.length === 0) return;
    if (!Array.isArray(itemColors) || itemColors.length === 0) return;
    if (!Array.isArray(itemNouns) || itemNouns.length === 0) return;

    // tierに応じて「レア寄り」へバイアス（重み指数）
    const exp = Math.max(1, Math.min(4, (tier || 1) + 1)); // 2〜5

    const pickWeighted = (arr, weightFn) => {
      let total = 0;
      const weights = arr.map(v => {
        let w = 0;
        try { w = Number(weightFn(v)); } catch(e) { w = 0; }
        if (!isFinite(w) || w <= 0) w = 0.000001;
        total += w;
        return w;
      });
      let r = Math.random() * total;
      for (let i = 0; i < arr.length; i++) {
        r -= weights[i];
        if (r <= 0) return arr[i];
      }
      return arr[arr.length - 1];
    };

    const allSkills = skillPool.filter(s => s && s.category !== 'passive');
    const skill = allSkills[Math.floor(Math.random() * allSkills.length)];

    // dropRateMultiplier / dropRate が小さいほどレア扱いなので、1/x を重みにする
    const colorData = pickWeighted(itemColors, c => Math.pow(1 / Math.max(0.01, (c.dropRateMultiplier || 1)), exp));
    const nounData  = pickWeighted(itemNouns,  n => Math.pow(1 / Math.max(0.01, (n.dropRateMultiplier || 1)), exp));

    const adjective = pickItemAdjectiveWithNoun(nounData);
    if (!adjective) return;

    // フィルターが1つ以上有効な場合、合致しないアイテムはスキップ（既存仕様に合わせる）
    const anyFiltersEnabled = document.querySelectorAll('.itemFilterCB:checked').length > 0;
    const isItemFilteredOut = !shouldPauseForItem(colorData.word, adjective.word, nounData.word);
    if (anyFiltersEnabled && isItemFilteredOut) {
      if (log) log.push(`【クラッチ報酬】フィルター条件に合致しなかったためスキップしました`);
      return;
    }

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
    updateItemOverlay();

    const itemName = `${newItem.color}${newItem.adjective}${newItem.noun}`;
    const pct = (Math.max(0, absDiffRatio) * 100).toFixed(2);
    const tierLabel = (tier >= 3) ? '超僅差' : (tier === 2) ? '僅差' : '接戦';
    if (log) log.push(`【クラッチ報酬】${tierLabel}勝利（差${pct}%）のため、レア寄りアイテムを獲得！ ${itemName}（${newItem.skillName}）`);
  } catch (e) {
    if (log) log.push(`【クラッチ報酬】付与処理でエラー: ${e && e.message ? e.message : e}`);
  }
}



// ボス専用：モードに関係なく必ずアイテムを1つ与える（中程度以上のレアリティ）
function grantBossRewardItem() {
  try {
    if (!player || !player.skills || player.skills.length === 0) return;
    if (!Array.isArray(player.itemMemory)) player.itemMemory = [];
    if (player.itemMemory.length >= 10) return;

    // 攻撃系スキルから1つ選ぶ（なければ全スキルから）
    let candidates = Array.isArray(skillPool) ? skillPool.filter(s => s.category !== 'passive') : [];
    if (candidates.length === 0 && Array.isArray(skillPool)) {
      candidates = skillPool.slice();
    }
    if (candidates.length === 0) return;
    const skill = candidates[Math.floor(Math.random() * candidates.length)];

    const colorData = itemColors[Math.floor(Math.random() * itemColors.length)];
    const nounData = itemNouns[Math.floor(Math.random() * itemNouns.length)];

    // 「中程度以上」：ドロップ率の低い（=レア寄り）の形容詞から選ぶ
    let goodAdjs = itemAdjectives.filter(a => a.dropRate <= 0.008);
    if (goodAdjs.length === 0) goodAdjs = itemAdjectives.slice();
    const adjective = goodAdjs[Math.floor(Math.random() * goodAdjs.length)];

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
    if (typeof drawItemMemoryList === 'function') drawItemMemoryList();
    if (typeof updateItemOverlay === 'function') updateItemOverlay();

    const itemName = `${newItem.color}${newItem.adjective}${newItem.noun}`;
    const msg = `ボスからの戦利品！<br>${itemName}（${newItem.skillName}）`;
    if (typeof showCustomAlert === 'function') {
      showCustomAlert(msg, 4000);
    }
    if (Array.isArray(window.log)) {
      window.log.push(`【ボス報酬】アイテム：${itemName}（${newItem.skillName}）`);
    }
  } catch (e) {
    console.warn('grantBossRewardItem failed', e);
  }
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
    window.__battleSetTimeout(() => {
      deathChar.classList.remove('shake-and-grow');
    }, 3000);

    // 10〜13秒おきに再発動
    window.__battleSetTimeout(animateDeathChar, 5000 + Math.random() * 3000);
  }

  // 初回のアニメーションは2秒後に開始
  window.__battleSetTimeout(animateDeathChar, 2000);
	
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
window.growthSkipCount = 0;

// 成長スキップ時の倍率カーブ（インフレ防止）
// skipCount: 連続で「今回は選ばない」を選んだ回数
// 三角数カーブ: 1 + n(n+1)/2 （上限256）
window.calcGrowthMultiplierBySkipCount = function(skipCount) {
  const n = Math.max(0, Math.floor(skipCount || 0));
  const raw = 1 + (n * (n + 1)) / 2;
  return Math.min(256, Math.floor(raw));
};
window.getNextGrowthMultiplier = function() {
  const nextCount = (window.growthSkipCount || 0) + 1;
  return window.calcGrowthMultiplierBySkipCount(nextCount);
};

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
  window.growthSkipCount = 0;  // 連続スキップ回数もリセット
  isWaitingGrowth = false;
};

window.skipGrowth = function() {
  window.growthSkipCount = (window.growthSkipCount || 0) + 1;
  window.growthMultiplier = window.calcGrowthMultiplierBySkipCount(window.growthSkipCount);

  showCustomAlert(`今回は成長をスキップ。次回倍率x${window.growthMultiplier}`, 2000);

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

  const enemyCanvasEl = document.getElementById('enemyCanvas');
  const enemyImgEl = document.getElementById('enemyImg');

  if (window.isBossBattle && window.bossFacePath && enemyImgEl) {
    // 強敵：フェイスガチャの画像を表示
    if (enemyCanvasEl) enemyCanvasEl.classList.add('hidden');
    enemyImgEl.src = window.bossFacePath;
    enemyImgEl.classList.remove('hidden');
  } else {
    // 通常：キャンバスに描画
    if (enemyImgEl) enemyImgEl.classList.add('hidden');
    if (enemyCanvasEl) enemyCanvasEl.classList.remove('hidden');
    drawCharacterImage(displayName(enemy.name), 'enemyCanvas');
  }

  const isPlayer = true;
if (isPlayer) {
  generateAndRenderUniqueSkillsByName(player);
}

};
// 「はじめから」スタート（タイトル画面非表示、ゲーム画面表示）
window.startNewGame = function() {
	
	 // window.isFirstBattle = true;
	// 自動保存は「はじめから」で必ずOFF
	window.autoSaveEnabled = false;
	try { if (typeof setupToggleButtons === 'function') setupToggleButtons(); } catch (_) {}

	 //ガイド いるならtrueに
	  window.isFirstBattle = false;
		const battleBtn = document.getElementById("startBattleBtn");
		if (battleBtn && battleBtn.classList.contains("hidden")) {
		  if (typeof window.ensureBattleButtons==="function") window.ensureBattleButtons();
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
    window.__battleSetTimeout(() => {
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
        (function(){var onceBtn=document.getElementById('startBattleOnceBtn'); if(onceBtn) onceBtn.disabled=false;})();
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
                const countValRaw = parseInt(selectedVal, 10);
                const countVal = (Number.isFinite(countValRaw) && countValRaw > 0) ? countValRaw : 20;
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


// Endure（不死身の構え）のクールダウン用ヘルパー
// 2回連続で成功し、3回目は失敗（以後このサイクルを繰り返す）
function checkEndureAllowed(target) {
  if (!target) return false;
  if (!target._endureCycle) {
    target._endureCycle = { count: 0 };
  }
  target._endureCycle.count++;
  const isFailTurn = (target._endureCycle.count % 5 === 0);
  return !isFailTurn;
}

window.getSkillEffect = function (skill, user, target, log) {
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

      const critMax = skillData.criticalRateMax || 0;
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

          // エンデュア効果判定：致死ダメージをHP1で耐える
          const endureEff = target.effects.find(e => e.type === 'endure');
          let prevented = 0;
                    if (endureEff && target.hp < 1) {
            const ok = checkEndureAllowed(target);
            if (!ok) {
              log.push(`${displayName(target.name)}は不死身の構えの連続使用に失敗した！`);
              console.log(`[Endure] ${displayName(target.name)} failed due to cooldown (every 3rd use).`);
            } else {
            prevented = 1 - target.hp;
            target.hp = 1;
            endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
            hitDmg -= prevented;
            totalDamage -= prevented;
            console.log(`[Endure] ${displayName(target.name)} endured a hit with 1 HP (prevented ${prevented})`);
                      }
          }


          const critText = isCrit ? '（クリティカル！）' : '';
          log.push(`${displayName(user.name)}の${skill.name}：${hitDmg}ダメージ ${critText} (${i + 1}回目)`);
          if (endureEff && prevented > 0) {
            log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
          }
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
      // エンデュア判定（ターゲット）
      const endureEff = target.effects.find(e => e.type === 'endure');
            if (endureEff && target.hp < 1) {
        const ok = checkEndureAllowed(target);
        if (!ok) {
          log.push(`${displayName(target.name)}は不死身の構えの連続使用に失敗した！`);
          console.log(`[Endure] ${displayName(target.name)} failed due to cooldown (every 3rd use).`);
        } else {
        const prevented = 1 - target.hp;
        target.hp = 1;
        endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
        dmg -= prevented;
        totalDamage -= prevented;
        console.log(`[Endure] ${displayName(target.name)} survived with 1 HP (prevented ${prevented})`);
        log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
              }
      }

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
      const atkFactor = skillData.atkFactor || 0;
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
      const factor = baseFactor + (skill.level || 1) * 0.0005;
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
      // debuff（skills.js の category:"debuff"）は「発動者」ではなく常に「相手（target）」へ付与する
      const bonusTurns = getLevelTurnBonus(skill.level || 1);
      const duration = (skillData.duration || 1) + bonusTurns;
      const baseFactor = skillData.factor || 0.5;
      const factor = Math.max(0.1, baseFactor - (skill.level || 1) * 0.0003);

      // 念のため：effects 配列が無い個体が来ても落ちないようにする（既存仕様を壊さない安全策）
      if (!Array.isArray(target.effects)) target.effects = [];
      if (!Array.isArray(user.effects)) user.effects = [];

      skillData.targetStats.forEach(stat => {
        // 既存の同種デバフがある場合は、一旦元の値へ戻してから上書き（既存仕様踏襲）
        const existing = target.effects.find(e => e.type === 'debuff' && e.stat === stat);
        if (existing) {
          target[stat] = existing.original;
          target.effects = target.effects.filter(e => e !== existing);
        }

        const original = target[stat];
        target[stat] = Math.floor(target[stat] * factor);
        target.effects.push({ type: 'debuff', stat: stat, original: original, remaining: duration });
      });

      // ログ形式は変更しない（既存の見た目維持）
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
      const effectiveDef = target.defense * (1 - (skillData.ignoreDefense || 0));
      let dmg = Math.max(0, Math.floor(user.attack * skillData.multiplier - effectiveDef / 2));
      const barrierEff = target.effects.find(e => e.type === 'barrier');
      if (barrierEff) {
        dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
      }
      target.hp -= dmg;
      totalDamage += dmg;
      // エンデュア判定（ターゲット）
      const endureEff = target.effects.find(e => e.type === 'endure');
            if (endureEff && target.hp < 1) {
        const ok = checkEndureAllowed(target);
        if (!ok) {
          log.push(`${displayName(target.name)}は不死身の構えの連続使用に失敗した！`);
          console.log(`[Endure] ${displayName(target.name)} failed due to cooldown (every 3rd use).`);
        } else {
        const prevented = 1 - target.hp;
        target.hp = 1;
        endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
        dmg -= prevented;
        totalDamage -= prevented;
        console.log(`[Endure] ${displayName(target.name)} survived attack with 1 HP (prevented ${prevented})`);
        log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
              }
      }

      log.push(`${displayName(user.name)}の${skill.name}：${dmg}ダメージ`);
      break;
    }

    case 'stun': {
      const stunChance = skillData.stunChance ?? 1.0;
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
      const originalAttack = user.attack;
      const originalDefense = user.defense;
      user.attack = Math.floor(user.attack * attackFactor);
      user.defense = Math.floor(user.defense * defenseFactor);
      user.effects.push({ type: 'buff', stat: 'attack', original: originalAttack, remaining: duration });
      user.effects.push({ type: 'debuff', stat: 'defense', original: originalDefense, remaining: duration });
      log.push(`${displayName(user.name)}の${skill.name}：${duration}ターン 攻撃${attackFactor.toFixed(2)}倍 / 防御${defenseFactor.toFixed(2)}倍`);
      break;
    }

    // --- 新規スキルカテゴリの処理を追加 ---

    case 'counter': {
      const duration = (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1);
      user.effects.push({ type: 'counter', percent: skillData.counterPercent || 0.5, remaining: duration, accumulated: 0, skillName: skill.name });
      console.log(`[Counter] ${displayName(user.name)} activated ${skill.name} (duration ${duration}, ${Math.floor((skillData.counterPercent || 0.5) * 100)}% damage stored)`);
      log.push(`${displayName(user.name)}の${skill.name}：カウンター態勢！`);
      break;
    }

    case 'purifyCounter': {
      let sumDamage = 0;
      const effectsToRemove = ['毒', '火傷'];
      for (const eff of [...user.effects]) {
        if (effectsToRemove.includes(eff.type)) {
          if (eff.type === '毒') {
            // 残り毒ダメージを合計
            if (eff.damageSequence) {
              const idx = eff.turnIndex || 0;
              const remainingSeq = eff.damageSequence.slice(idx);
              sumDamage += remainingSeq.reduce((a, b) => a + b, 0);
            } else if (typeof eff.damage === 'number' && eff.remaining) {
              sumDamage += eff.damage * eff.remaining;
            }
          } else if (eff.type === '火傷') {
            if (typeof eff.damage === 'number' && eff.remaining) {
              sumDamage += eff.damage * eff.remaining;
            }
          }
          user.effects = user.effects.filter(e => e !== eff);
        }
      }
      sumDamage = Math.floor(sumDamage);
      if (sumDamage <= 0) {
        log.push(`${displayName(user.name)}の${skill.name}：効果なし`);
        break;
      }
      target.hp -= sumDamage;
      totalDamage += sumDamage;
      // エンデュア判定（ターゲット）
      const endureEff = target.effects.find(e => e.type === 'endure');
            if (endureEff && target.hp < 1) {
        const ok = checkEndureAllowed(target);
        if (!ok) {
          log.push(`${displayName(target.name)}は不死身の構えの連続使用に失敗した！`);
          console.log(`[Endure] ${displayName(target.name)} failed due to cooldown (every 3rd use).`);
        } else {
        const prevented = 1 - target.hp;
        target.hp = 1;
        endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
        sumDamage -= prevented;
        totalDamage -= prevented;
        console.log(`[Endure] ${displayName(target.name)} survived purify-counter with 1 HP (prevented ${prevented})`);
        log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
              }
      }

      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}に${sumDamage}ダメージ（浄化反撃）`);
      break;
    }

    case 'itemReuse': {
      const chance = skillData.activationRate ?? 1.0;
      if (Math.random() < chance) {
        const usableItems = player.itemMemory.filter(item => item.remainingUses > 0);
        if (usableItems.length === 0) {
          log.push(`${displayName(user.name)}の${skill.name}：しかし再利用できるアイテムがない！`);
          console.log("[ItemReuse] No usable item to activate");
        } else {
          const item = usableItems[Math.floor(Math.random() * usableItems.length)];
          log.push(`>>> アイテム「${item.color}${item.adjective}${item.noun}」が${item.skillName}を発動！`);
          console.log(`[ItemReuse] Activating item: ${item.color}${item.adjective}${item.noun} -> ${item.skillName}`);
          const prevDamage = user.battleStats[item.skillName] || 0;
          const itemSkillDef = skillPool.find(sk => sk.name === item.skillName && sk.category !== 'passive');
          if (itemSkillDef) {
            getSkillEffect({ ...itemSkillDef, level: item.skillLevel || 1 }, player, target, log);
          }
          if (item.skillLevel < 3000 && Math.random() < 0.4) {
            item.skillLevel++;
            log.push(`>>> アイテムの ${item.skillName} が Lv${item.skillLevel} に成長！`);
            drawItemMemoryList();
          }
          item.remainingUses--;
          const isWithinProtectedPeriod = window.protectItemUntil && window.battleCount <= window.protectItemUntil;
          if (!item.protected && !isWithinProtectedPeriod && Math.random() < item.breakChance) {
            log.push(`>>> アイテム「${item.color}${item.adjective}${item.noun}」は壊れた！`);
            player.itemMemory.splice(player.itemMemory.indexOf(item), 1);
            drawItemMemoryList();
          }
          const newDamage = user.battleStats[item.skillName] || 0;
          const itemDamage = newDamage - prevDamage;
          totalDamage += itemDamage;
        }
      } else {
        log.push(`${displayName(user.name)}の${skill.name}：しかし効果は発動しなかった`);
        console.log("[ItemReuse] Reuse attempt failed");
      }
      break;
    }

    case 'endure': {
      const duration = (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1);
      user.effects.push({ type: 'endure', remaining: duration, preventedDamage: 0, skillName: skill.name });
      console.log(`[Endure] ${displayName(user.name)} activated ${skill.name} (duration ${duration})`);
      log.push(`${displayName(user.name)}の${skill.name}：HP1で耐える耐久態勢！`);
      break;
    }

    case 'gap': {
      const userTotal = Math.max(1, user.attack + user.defense + user.speed);
      const targetTotal = Math.max(1, target.attack + target.defense + target.speed);
      const favorDominant = skillData.favor === 'dominant';
      let ratio = favorDominant ? (userTotal / targetTotal) : (targetTotal / userTotal);
      const minRatio = skillData.minRatio || 0.1;
      const maxRatio = skillData.maxRatio || 3.0;
      ratio = Math.max(minRatio, Math.min(maxRatio, ratio));
      const effectiveDef = target.defense * (1 - (skillData.ignoreDefense || 0));
      let dmg = Math.max(0, Math.floor(user.attack * (skillData.baseMultiplier || 1) * ratio - effectiveDef / 2));
      const barrierEff = target.effects.find(e => e.type === 'barrier');
      if (barrierEff) {
        dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
      }
      target.hp -= dmg;
      totalDamage += dmg;
      const endureEff = target.effects.find(e => e.type === 'endure');
            if (endureEff && target.hp < 1) {
        const ok = checkEndureAllowed(target);
        if (!ok) {
          log.push(`${displayName(target.name)}は不死身の構えの連続使用に失敗した！`);
          console.log(`[Endure] ${displayName(target.name)} failed due to cooldown (every 3rd use).`);
        } else {
        const prevented = 1 - target.hp;
        target.hp = 1;
        endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
        dmg -= prevented;
        totalDamage -= prevented;
        console.log(`[Endure] ${displayName(target.name)} survived gap attack with 1 HP (prevented ${prevented})`);
        log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
              }
      }

      log.push(`${displayName(user.name)}の${skill.name}：${dmg}ダメージ`);
      break;
    }

    case 'maxHpDown': {
      const ratio = skillData.hpRatio || 0;
      let reduceAmount = Math.floor(target.maxHp * ratio);
      if (ratio > 0 && reduceAmount < 1) reduceAmount = 1;
      reduceAmount = Math.min(reduceAmount, target.maxHp - 1);
      if (reduceAmount <= 0) {
        log.push(`${displayName(user.name)}の${skill.name}：効果なし`);
        break;
      }
      target.maxHp -= reduceAmount;
      if (target.hp > target.maxHp) {
        const lostHP = target.hp - target.maxHp;
        target.hp = target.maxHp;
        console.log(`[MaxHpDown] ${displayName(target.name)} maxHP -${reduceAmount}, current HP reduced by ${lostHP}`);
      }
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}の最大HPを${reduceAmount}削り取った`);
      break;
    }

    case 'sacrifice': {
      const hpCostRatio = skillData.hpCost || 0;
      const hpCost = Math.floor(user.maxHp * hpCostRatio);
      let recoilDamage = hpCost;
      if (hpCost > 0) {
        user.hp -= hpCost;
        console.log(`[Sacrifice] ${displayName(user.name)} lost ${hpCost} HP by using ${skill.name}`);
        const endureEffUser = user.effects.find(e => e.type === 'endure');
                if (endureEffUser && user.hp < 1) {
          const ok = checkEndureAllowed(user);
          if (!ok) {
            log.push(`${displayName(user.name)}は不死身の構えの連続使用に失敗した！`);
            console.log(`[Endure] ${displayName(user.name)} failed due to cooldown (every 3rd use).`);
          } else {
          const prevented = 1 - user.hp;
          user.hp = 1;
          endureEffUser.preventedDamage = (endureEffUser.preventedDamage || 0) + prevented;
          recoilDamage -= prevented;
          console.log(`[Endure] ${displayName(user.name)} survived sacrifice with 1 HP (prevented ${prevented})`);
          log.push(`${displayName(user.name)}はHP1で踏みとどまった！`);
                  }
        }

      }
      const effectiveDef = target.defense * (1 - (skillData.ignoreDefense || 0));
      let dmg = Math.max(0, Math.floor(user.attack * (skillData.multiplier || 1) - effectiveDef / 2));
      const barrierEff = target.effects.find(e => e.type === 'barrier');
      if (barrierEff) {
        dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
      }
      target.hp -= dmg;
      totalDamage += dmg;
      const endureEffTarget = target.effects.find(e => e.type === 'endure');
            if (endureEffTarget && target.hp < 1) {
        const ok = checkEndureAllowed(target);
        if (!ok) {
          log.push(`${displayName(target.name)}は不死身の構えの連続使用に失敗した！`);
          console.log(`[Endure] ${displayName(target.name)} failed due to cooldown (every 3rd use).`);
        } else {
        const prevented = 1 - target.hp;
        target.hp = 1;
        endureEffTarget.preventedDamage = (endureEffTarget.preventedDamage || 0) + prevented;
        dmg -= prevented;
        totalDamage -= prevented;
        console.log(`[Endure] ${displayName(target.name)} survived sacrifice attack with 1 HP (prevented ${prevented})`);
        log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
              }
      }

      log.push(`${displayName(user.name)}の${skill.name}：${dmg}ダメージ & 自身も${recoilDamage}ダメージ`);
      break;
    }

    case 'random': {
      const minMul = skillData.minMultiplier ?? 0;
      const maxMul = skillData.maxMultiplier ?? 1;
      const randFactor = minMul + Math.random() * (maxMul - minMul);
      const effectiveDef = target.defense * (1 - (skillData.ignoreDefense || 0));
      let dmg = Math.max(0, Math.floor(user.attack * randFactor - effectiveDef / 2));
      const barrierEff = target.effects.find(e => e.type === 'barrier');
      if (barrierEff) {
        dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
      }
      target.hp -= dmg;
      totalDamage += dmg;
      const endureEff = target.effects.find(e => e.type === 'endure');
            if (endureEff && target.hp < 1) {
        const ok = checkEndureAllowed(target);
        if (!ok) {
          log.push(`${displayName(target.name)}は不死身の構えの連続使用に失敗した！`);
          console.log(`[Endure] ${displayName(target.name)} failed due to cooldown (every 3rd use).`);
        } else {
        const prevented = 1 - target.hp;
        target.hp = 1;
        endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
        dmg -= prevented;
        totalDamage -= prevented;
        console.log(`[Endure] ${displayName(target.name)} survived random attack with 1 HP (prevented ${prevented})`);
        log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
              }
      }

      log.push(`${displayName(user.name)}の${skill.name}：${dmg}ダメージ`);
      break;
    }

    case 'steal': {
      const stat = skillData.stat || 'attack';
      const duration = (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1);
      // 元のステータス保存と既存効果解除
      const existingBuff = user.effects.find(e => e.type === 'buff' && e.stat === stat);
      if (existingBuff) {
        user[stat] = existingBuff.original;
        user.effects = user.effects.filter(e => e !== existingBuff);
      }
      const existingDebuff = target.effects.find(e => e.type === 'debuff' && e.stat === stat);
      if (existingDebuff) {
        target[stat] = existingDebuff.original;
        target.effects = target.effects.filter(e => e !== existingDebuff);
      }
      const stealRatio = skillData.stealRatio || 0;
      const enemyStatValue = target[stat];
      const stealPoints = Math.max(0, Math.floor(enemyStatValue * stealRatio));
      if (stealPoints <= 0) {
        log.push(`${displayName(user.name)}の${skill.name}：効果なし`);
        break;
      }
      const userOriginal = user[stat];
      const enemyOriginal = target[stat];
      target[stat] = Math.max(0, target[stat] - stealPoints);
      user[stat] = user[stat] + stealPoints;
      user.effects.push({ type: 'buff', stat: stat, original: userOriginal, remaining: duration });
      target.effects.push({ type: 'debuff', stat: stat, original: enemyOriginal, remaining: duration });
      const statJP = stat === 'attack' ? '攻撃力' : stat === 'defense' ? '防御力' : stat === 'speed' ? '素早さ' : stat;
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}の${statJP}を${stealPoints}奪い取った（${duration}ターン）`);
      break;
    }

    case 'block': {
      const duration = (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1);
      user.effects.push({ type: 'block', remaining: duration });
      console.log(`[Block] ${displayName(user.name)} is in block stance for ${duration} turn(s)`);
      log.push(`${displayName(user.name)}の${skill.name}：守りの構え！`);
      break;
    }

    case 'bomb': {
      const duration = (skillData.duration || 1) + getLevelTurnBonus(skill.level || 1);
      const effectiveDef = target.defense * (1 - (skillData.ignoreDefense || 0));
      const baseAtk = user.attack * (skillData.multiplier || 1);
      const bombDmg = Math.max(0, Math.floor(baseAtk - effectiveDef / 2));
      target.effects.push({ type: '爆弾', damage: bombDmg, remaining: duration });
      console.log(`[Bomb] ${displayName(target.name)} has a bomb (爆弾) set for ${duration} turn(s) with ${bombDmg} damage`);
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}に爆弾を設置した（${duration}ターン後爆発）`);
      break;
    }

    // ...
    // （パッシブスキル等その他のケースは変更なし）
    // ...
  }

  if (user === player && skill.level < 9999) {
    // 成長確率をスキルレベルに応じて調整
    const baseChance = 0.1;
    const levelFactor = skill.level < 1000 ? 1 : 1000 / skill.level;
    const growChance = baseChance * levelFactor;
    if (Math.random() < growChance) {
      skill.level++;
      log.push(`${displayName(user.name)}のスキル「${skill.name}」が Lv${skill.level} に成長！`);
      if (player.skillMemory && player.skillMemory[skill.name] !== undefined) {
        player.skillMemory[skill.name] = Math.max(skill.level, player.skillMemory[skill.name]);
      }
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
  // 方針B：混合開始時効果は revive_mixed_start で処理するため、旧mixedSkills系の復活は無効化
  if (window && window._policyBMixedStart) return false;
  if (character.hp > 0 || !character.mixedSkills) return false;

  // 使用可能な復活効果をすべて抽出
  const availableRevives = [];

  for (const mSkill of character.mixedSkills) {
    const effects = mSkill.specialEffects || [];

    for (const eff of effects) {
      if (eff.type === 2 && !eff.used) {
        const p = _normProb(mSkill.activationProb, 0.35);
        if (Math.random() <= p) { availableRevives.push({ skill: mSkill, effect: eff }); }
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
    if (!Array.isArray(mSkill.specialEffects)) continue;
    for (const effect of mSkill.specialEffects) {
      if (effect.type === 3) {
        const battleId = window.battleId || 0;
        // 1戦につき1回だけ（battleIdで管理）
        if (effect._usedBattleId === battleId) continue;

        const p = _normProb(mSkill.activationProb, 0.35);
        if (Math.random() <= p) {
          const healPct = getScaledMixedSpecialEffectValue(mSkill, effect);
          totalHealPercent += healPct;
          effect._usedBattleId = battleId;
        }
      }
    }
  }
  // 合計回復率から回復量を算出
  if (totalHealPercent > 0) {
    const healAmount = Math.floor(character.maxHp * (totalHealPercent / 100));
    character.hp = Math.min(character.maxHp, character.hp + healAmount);
    if (log && typeof log.push === "function" && healAmount > 0) {
      log.push(`※ ${displayName(character.name)}は即時回復効果で${healAmount}HP回復`);
    }
  }
  return;
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

  // この戦闘で「開始時ステータス倍率（混合）」を適用したソースを記録（重複ログ/二重判定防止）
  player._mixedStartStatBuffAppliedSources = [];

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
      } else {
        // attack/defense/speed も実値へ反映（ログだけ出て反映されない問題の修正）
        player[stat] = Math.floor(after);
      }

      // mixed start 側の二重判定を避けるため、適用済みを記録
      try {
        player._mixedStartStatBuffAppliedSources.push({ source: skill.name, stat });
      } catch (_) {}
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

// ===============================
// 混合スキル：戦闘開始時に特殊効果のみ自動付与（発動不要）
// - type 2: 復活（HP0になった瞬間に発動）
// - type 3: 毒/火傷の継続ダメージ吸収（DoTダメージ後に回復）
// ※混合スキルの「内包スキル(baseSkills)」は発動しません（仕様）
// ===============================
function _normProb(p, fallback = 0.35) {
  let n = Number(p);
  if (!isFinite(n)) return fallback;
  // 0〜1 の想定だが、%指定（例: 35）も受け付ける
  if (n > 1) n = n / 100;
  return Math.max(0, Math.min(1, n));
}

function _normRatio(v, fallback = 0.35) {
  let n = Number(v);
  if (!isFinite(n)) n = fallback;
  // %指定（例: 46）も受け付ける
  if (n > 1) n = n / 100;
  return Math.max(0.0, Math.min(1.0, n));
}



function applyMixedSpecialEffectsAtBattleStart(user, opponent, log) {
  if (!user || !Array.isArray(user.skills)) return;

  const battleId = window.battleId || 0;

  // 前の戦闘の混合開始時効果は必ず掃除（ログ不整合防止）
  user.effects = user.effects || [];
  // 解除＆原状復帰が必要なものは resetMixedStartAfterBattle 側で戻すので、ここでは混合開始時のeffectだけ掃除
  user.effects = user.effects.filter(e => !(e && (e.type === 'revive_mixed_start' || e.type === 'dotAbsorb_mixed_start' || e.type === 'mixedStatBuff_mixed_start')));

  // 1戦につき1回だけ（battleIdでガード）。勝敗/中断で取りこぼしがあっても次戦で必ず出すため、battleId基準にする
  if (user._mixedStartLastBattleId === battleId) return;
  user._mixedStartLastBattleId = battleId;

  const mixedList = user.skills.filter(s => s && s.isMixed);
  if (!mixedList.length) return;

  for (const ms of mixedList) {
    const effs = Array.isArray(ms.specialEffects) ? ms.specialEffects : [];
    if (!effs.length) continue;

    const lv = Math.max(1, Number(ms.level || 1) || 1);
    const scale = getMixedSkillLevelScale(lv); // 緩やかなレベル補正
    const procChance = _normProb(ms.activationProb, 0.35);

    for (const e0 of effs) {
      if (!e0) continue;
      const type = Number(e0.type);
      const baseVal = Number(e0.value ?? e0.amount ?? e0.ratio ?? 0);
      const v = isFinite(baseVal) ? baseVal * scale : baseVal;


// type 1: 敵の残りHP%の追加ダメージ
// ※仕様変更：戦闘開始時ではなく「毎ターン開始時」に判定・適用する（継続ダメージより前）
// （処理本体は applyMixedHpPercentDamageAtTurnStart() に移動）

      // type 2: 復活（HP割合）
      if (type === 2) {
        const reviveRatio = Math.max(0.05, _normRatio(v, 0.35));
        user.effects.push({
          type: 'revive_mixed_start',
          source: ms.name,
          battleId,
          reviveRatio,
          procChance,
          used: false
        });
        if (log) log.push(`${displayName(user.name)}は【復活】を得た（混合:${ms.name} / 発動率${Math.round(procChance*100)}% / 復活${Math.round(reviveRatio*100)}%）`);
      }

      // type 3: 毒/火傷吸収（DoTダメージの一部を回復）
      if (type === 3) {
        const absorbRatio = Math.max(0.05, _normRatio(v, 0.25));
        user.effects.push({
          type: 'dotAbsorb_mixed_start',
          source: ms.name,
          battleId,
          absorbRatio,
          procChance,
          used: false
        });
        if (log) log.push(`${displayName(user.name)}は【毒/火傷吸収】を得た（混合:${ms.name} / 発動率${Math.round(procChance*100)}% / 吸収${Math.round(absorbRatio*100)}%）`);
      }

      // type 4-7: ステータス倍率バフ（所持時に適用）→ 発動率でオン/オフ（1戦につき1回判定）
      // 4:攻撃 5:防御 6:素早さ 7:最大HP
      if (type >= 4 && type <= 7) {
        const statKey = (type === 4 ? 'attack' : type === 5 ? 'defense' : type === 6 ? 'speed' : 'maxHp');
        const mult = Math.max(1.0, Number(v || 1.0));
        // applyPassiveStatBuffsFromSkills() で同一ソースの倍率を既に適用済みなら、ここでは二重判定しない
        if (Array.isArray(user._mixedStartStatBuffAppliedSources)) {
          const already = user._mixedStartStatBuffAppliedSources.some(x => x && x.source === ms.name && x.stat === statKey);
          if (already) {
            continue;
          }
        }
        const ok = (Math.random() <= procChance);
        if (ok) {
          const original = user[statKey];
          user[statKey] = Math.floor((user[statKey] || 0) * mult);
          user.effects.push({
            type: 'mixedStatBuff_mixed_start',
            source: ms.name,
            battleId,
            stat: statKey,
            mult,
            original
          });
          if (statKey === 'maxHp') {
            // maxHpを増やしたら現在HPも上限に合わせて補正
            user.hp = Math.min(user[statKey], user.hp || user[statKey]);
          }
          if (log) log.push(`※${ms.name}の効果で${displayName(user.name)}の${statKey}が${mult.toFixed(2)}倍になった（発動率${Math.round(procChance*100)}%）`);
        } else {
          if (log) log.push(`※${ms.name}の${statKey}倍率効果は発動しなかった（発動率${Math.round(procChance*100)}%）`);
        }
      }
    }
  }
}


// ===============================
// 混合スキル：毎ターン開始時の「敵の残りHP%追加ダメージ」
// - 仕様変更：戦闘開始時ではなく、各ターン開始時に毎回チャンス判定
// - 継続ダメージ（毒/火傷など）の処理より前に実行する
// - 基準は「相手の現在HP（残りHP）」
// ===============================
function applyMixedHpPercentDamageAtTurnStart(user, opponent, log, turn) {
  if (!user || !Array.isArray(user.skills)) return;
  if (!opponent || !isFinite(Number(opponent.hp)) || Number(opponent.hp) <= 0) return;

  // mixedSkills は user.skills 内に入っている想定（isMixed=true）
  for (const ms of user.skills) {
    if (!ms || !ms.isMixed) continue;

    const effs = Array.isArray(ms.specialEffects) ? ms.specialEffects : [];
    if (effs.length === 0) continue;

    const lv = Number(ms.level || 1);
    const scale = getMixedSkillLevelScale(lv); // 緩やかなレベル補正（既存関数）
    const procChance = _normProb(ms.activationProb, 0.35);

    for (const e0 of effs) {
      if (!e0) continue;
      const type = Number(e0.type);
      if (type !== 1) continue;

      const baseVal = Number(e0.value ?? e0.amount ?? e0.ratio ?? 0);
      const v = isFinite(baseVal) ? baseVal * scale : baseVal;

      const ratio = Math.max(0.01, _normRatio(v, 0.2));
      const ok = (Math.random() <= procChance);

      if (!ok) continue;

      const before = Math.max(0, Math.floor(Number(opponent.hp)));
      if (before <= 0) continue;

      const dmg = Math.max(1, Math.floor(before * ratio));
      opponent.hp = Math.max(0, before - dmg);

      if (log) {
        log.push(
          `※${ms.name}の効果で${displayName(opponent.name)}に残りHPの${Math.round(ratio * 100)}%（${dmg}）の追加ダメージ！` +
          `（発動率${Math.round(procChance * 100)}%）`
        );
      }
    }
  }
}
function resetMixedStartAfterBattle(ch) {
  if (!ch) return;

  // 混合開始時ステータス倍率バフを原状復帰
  if (Array.isArray(ch.effects)) {
    const buffs = ch.effects.filter(e => e && e.type === 'mixedStatBuff_mixed_start');
    for (const b of buffs) {
      if (b.stat && typeof b.original !== 'undefined') {
        ch[b.stat] = b.original;
      }
    }
    ch.effects = ch.effects.filter(e => !(e && (e.type === 'revive_mixed_start' || e.type === 'dotAbsorb_mixed_start' || e.type === 'mixedStatBuff_mixed_start')));
  }

  // 次戦で必ず開始ログを出すため、battleIdガードを解除
  ch._mixedStartLastBattleId = null;
}






function tryReviveOnDeath(ch, log) {
  if (!ch || ch.hp > 0) return false;
  if (!Array.isArray(ch.effects)) return false;

  const battleId = window.battleId || 0;

  const candidates = ch.effects.filter(e => e && e.type === 'revive_mixed_start' && !e.used && (e.battleId === battleId));
  if (!candidates.length) return false;

  // 複数の混合スキルがある時でも全てに発動チャンス
  const procs = [];
  for (const eff of candidates) {
    const proc = _normProb(eff.procChance, 1.0);
    if (Math.random() <= proc) procs.push(eff);
  }
  if (!procs.length) {
    if (log) {
      const names = candidates.map(e => e.source).join(' / ');
      log.push(`※復活は発動しなかった（候補:${names}）`);
    }
    return false;
  }

  // 複数成功時は復活割合が高いものを採用
  procs.sort((a,b) => (_normRatio(b.reviveRatio,0.35) - _normRatio(a.reviveRatio,0.35)));
  const eff = procs[0];

  const ratio = Math.max(0.05, _normRatio(eff.reviveRatio, 0.35));

  // maxHp が壊れている（undefined/NaN/<=0）ケースがあると、
  // 復活後のHP%表示や後続処理が NaN になって戦闘ログやUIが止まるため、ここで必ず補正する
  let maxHp = Number(ch.maxHp);
  if (!isFinite(maxHp) || maxHp <= 0) {
    maxHp = Number(ch.baseStats && ch.baseStats.maxHp);
    if (!isFinite(maxHp) || maxHp <= 0) maxHp = Number(ch.baseStats && ch.baseStats.hp);
    if (!isFinite(maxHp) || maxHp <= 0) maxHp = Number(ch.hp);
    if (!isFinite(maxHp) || maxHp <= 0) maxHp = 1;
    ch.maxHp = maxHp;
  }

  const newHp = Math.max(1, Math.floor(maxHp * ratio));
  ch.hp = newHp;
  eff.used = true;

  if (log) log.push(`※${eff.source}の効果で${displayName(ch.name)}が復活！（HP${Math.round(ratio*100)}%）`);
  return true;
}



function applyDotAbsorb(ch, dotDamage, log) {
  if (!ch || dotDamage <= 0) return false;
  if (!Array.isArray(ch.effects)) return false;

  const battleId = window.battleId || 0;
  const candidates = ch.effects.filter(e => e && e.type === 'dotAbsorb_mixed_start' && !e.used && (e.battleId === battleId));
  if (!candidates.length) return false;

  // 全候補に発動チャンス
  const procs = [];
  for (const eff of candidates) {
    const proc = _normProb(eff.procChance, 1.0);
    if (Math.random() <= proc) procs.push(eff);
  }
  if (!procs.length) return false;

  // 複数成功時は吸収割合が高いものを採用（1回のDoTにつき1つ）
  procs.sort((a,b) => (_normRatio(b.absorbRatio,0.25) - _normRatio(a.absorbRatio,0.25)));
  const eff = procs[0];

  const ratio = Math.max(0.05, _normRatio(eff.absorbRatio, 0.25));
  const heal = Math.max(1, Math.floor(dotDamage * ratio));
  ch.hp = Math.min(ch.maxHp || ch.hp, ch.hp + heal);
  eff.used = true;

  if (log) log.push(`※${eff.source}の効果で${displayName(ch.name)}が毒/火傷ダメージを吸収して${heal}回復！（${Math.round(ratio*100)}%）`);
  return true;
}



window.startBattle = function() {
// 既に戦闘処理中なら二重起動しない（AutoBattleのバックログ防止）
if (window.__battleInProgress) return;
window.__battleInProgress = true;

// 次の戦闘が始まったら、前回の「表示/エフェクト/遅延処理」を完全停止
if (typeof window.__cancelBattleVisuals === 'function') {
  window.__cancelBattleVisuals();
}

// この戦闘中に発生する「見た目用タイマー」を追跡する
window.__battleVisualTracking = true;
  window.battleId = (window.battleId || 0) + 1;

		//戦闘ログはここに入れる
	window.log = [];

    // 方針B：混合スキル開始時効果（revive_mixed_start / dotAbsorb_mixed_start）を使用
    window._policyBMixedStart = true;

    if (window.specialMode === 'brutal') {
    skillSimulCount = 1; // 鬼畜モードでは強制的に1に固定
		}

window.barrierUsesLeft = 5;

resetMixedSkillUsage();

// --- 20戦ごとの強敵フラグ＆フェイス画像選択用カウンタ ---
if (typeof window.battlesPlayed !== 'number') window.battlesPlayed = 0;
window.battlesPlayed += 1;
// battleCount（進捗セーブ用）も戦闘ごとに同期
window.battleCount = window.battlesPlayed;
window.isBossBattle = false;
window.bossFacePath = null;

if (window.battlesPlayed % window.BOSS_BATTLE_INTERVAL === 0) {
  window.isBossBattle = true;
  // 連勝数に応じてレアリティを決定（最低条件のみ固定）
  const streak = typeof window.currentStreak === 'number' ? window.currentStreak : 0;
  let rarity = 'D';
  if (streak >= 500) {
    rarity = 'S';
  } else if (streak >= 400) {
    rarity = 'A';
  } else if (streak >= 300) {
    rarity = 'B';
  } else if (streak >= 200) {
    rarity = 'C';
  }
  try {
    if (typeof drawRandomFace === 'function') {
      const faceInfo = drawRandomFace(rarity);
      if (faceInfo && faceInfo.path) {
        window.bossFacePath = faceInfo.path;
      }
    }
  } catch (e) {
    console.warn('boss face selection failed', e);
  }
}

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

if (isAutoBattle && isWaitingGrowth) {
  isWaitingGrowth = false;

  // 連勝率の計算
  const streakRatio = Math.min(window.currentStreak / window.sessionMaxStreak, 1.0);

  // skipの重み（低いほどskipが優先される）
  // streakRatioが0なら weight=10、1なら weight=1（高いほど選ばれにくく）
	const skipWeight = 1 + 9 * (1 - streakRatio);
  const normalWeight = 1;

  const growthOptions = [
    { label: "攻撃を上げる", value: 'attack', weight: normalWeight },
    { label: "防御を上げる", value: 'defense', weight: normalWeight },
    { label: "速度を上げる", value: 'speed', weight: normalWeight },
    { label: "HPを上げる", value: 'maxHp', weight: normalWeight },
    {
      label: `今回は選ばない（次回成長値x${window.getNextGrowthMultiplier()}）`,
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

  // UI: show growth bar briefly even on auto-pick
  window.showGrowthAutoBar && window.showGrowthAutoBar(`選択: ${selected.label}`);


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

  window.__battleSetTimeout(() => {
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




// 混合スキルの戦闘開始時特殊効果を付与（必ずログを出す）
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

// ===== 敵ステータス生成 → 倍率適用 → ログ出力（完全版） =====

// --- 1) ステータス生成処理 ---
let atk, def, spd, hpMax;

if (window.specialMode === 'brutal') {
  // 鬼畜モード：プレイヤー基準のランダム帯（強化版 1.2〜1.8倍）
  // ※重要：混合スキルの「所持しているだけで常時発動するステータスUP（type4-7）」で
  //   プレイヤーの attack/defense/speed/maxHp が戦闘開始時に上書きされるため、
  //   鬼畜モードの敵生成は「混合スキルによるステータスアップ前」の値（= baseStats + growthBonus）を基準にする。
  const statMultiplierMin = 1.2;
  const statMultiplierMax = 1.8;
  const randInRange = () => (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin));

  const pAtkBase = ((player.baseStats && typeof player.baseStats.attack === 'number') ? player.baseStats.attack : (player.attack || 0))
                 + ((player.growthBonus && typeof player.growthBonus.attack === 'number') ? player.growthBonus.attack : 0);
  const pDefBase = ((player.baseStats && typeof player.baseStats.defense === 'number') ? player.baseStats.defense : (player.defense || 0))
                 + ((player.growthBonus && typeof player.growthBonus.defense === 'number') ? player.growthBonus.defense : 0);
  const pSpdBase = ((player.baseStats && typeof player.baseStats.speed === 'number') ? player.baseStats.speed : (player.speed || 0))
                 + ((player.growthBonus && typeof player.growthBonus.speed === 'number') ? player.growthBonus.speed : 0);
  const pHpBase  = ((player.baseStats && typeof player.baseStats.maxHp === 'number') ? player.baseStats.maxHp : (player.maxHp || player.hp || 0))
                 + ((player.growthBonus && typeof player.growthBonus.maxHp === 'number') ? player.growthBonus.maxHp : 0);

  atk   = Math.floor(pAtkBase * randInRange());
  def   = Math.floor(pDefBase * randInRange());
  spd   = Math.floor(pSpdBase * randInRange());
  hpMax = Math.floor(pHpBase  * randInRange());
} else {
  // 通常モード：makeCharacter() の baseStats を使用
  atk   = enemy.baseStats.attack;
  def   = enemy.baseStats.defense;
  spd   = enemy.baseStats.speed;
  hpMax = enemy.baseStats.maxHp;
}

// baseStats と現在値を同期
enemy.baseStats.attack = atk;
enemy.baseStats.defense = def;
enemy.baseStats.speed   = spd;
enemy.baseStats.maxHp   = hpMax;

enemy.attack = atk;
enemy.defense = def;
enemy.speed = spd;
enemy.maxHp = hpMax;
enemy.hp = hpMax;

// --- 2) 連勝補正・モード補正（通常と同じ指数に統一） ---
const streakIndex   = currentStreak + 1;
const growthFactor  = Math.pow(1.05, streakIndex);  // 指数補正
const rarityFactor  = enemy.rarity;                 // レアリティ倍率
const modeFactor    = growthFactor;                 // 鬼畜も通常と同じ指数

// 総合倍率 = レアリティ × 成長倍率
let enemyMultiplier = rarityFactor * modeFactor;

// ボス戦の場合は、ボス専用の追加倍率を掛ける
if (window.isBossBattle) {
  // 通常モードは従来どおり（デフォルト 3〜10）
  // 鬼畜モードは 1.2〜4 に固定
  const isBrutal = (window.specialMode === 'brutal');

  const minMul = isBrutal
    ? 1.2
    : ((typeof window.BOSS_ENEMY_MIN_MULTIPLIER === 'number') ? window.BOSS_ENEMY_MIN_MULTIPLIER : 1.5);

  const maxMul = isBrutal
    ? 4.0
    : ((typeof window.BOSS_ENEMY_MAX_MULTIPLIER === 'number') ? window.BOSS_ENEMY_MAX_MULTIPLIER : 4.0);

  const exp = (typeof window.BOSS_ENEMY_POWER_EXP === 'number') ? window.BOSS_ENEMY_POWER_EXP : 5;

  const r = Math.random() ** exp;
  const bossMul = minMul + r * (maxMul - minMul);

  enemyMultiplier *= bossMul;
  log.push(`【ボス補正】敵倍率 x${bossMul.toFixed(3)}（範囲 ${minMul}〜${maxMul}）`);
}
// --- 3) 敵の最終値に倍率適用 ---
['attack','defense','speed','maxHp'].forEach(stat => {
  enemy[stat] = Math.floor(enemy[stat] * enemyMultiplier);
});
enemy.hp = enemy.maxHp;

// --- 4) ログ出力（内訳を詳細に表示） ---
log.push(
  `${window.specialMode === 'brutal' ? '[鬼畜モード挑戦中] ' : ''}` +
  `敵のステータス倍率: ${enemyMultiplier.toFixed(3)}倍\n` +
  `  ├ 基礎ステータス: ${atk}/${def}/${spd}/${hpMax}\n` +
  `  ├ レアリティ倍率: ${rarityFactor.toFixed(3)}\n` +
  `  └ 成長倍率(指数): 1.05^${streakIndex} = ${growthFactor.toFixed(3)}`
);

// --- 混合スキル：戦闘開始時の特殊効果（残りHP%ダメージ/復活/吸収/バフ） ---
// ※敵の最終ステータス（倍率適用後）を確定してから実行する（HP%ダメージの基準ズレ防止）
applyMixedSpecialEffectsAtBattleStart(player, enemy, log);
applyMixedSpecialEffectsAtBattleStart(enemy, player, log);

				 
// --- 5) 後処理 ---
// ※混合スキル開始時効果(revive/dotAbsorb等)を保持するため、ここでは effects を全消去しない
updateStats();

  // =========================================================
  // 短期決着（5ターン以内）になった戦闘は「無かったこと」にして仕切り直す
  //  - 5ターン以内に決着したら、その戦闘結果/進行を採用せずリトライ
  //  - 敵味方の最大HPを倍率で増やして再戦（10倍 → 20倍 → 30倍 ...）
  //  - 5ターン以上（※ここでは「6ターン目に入る＝turnsElapsed>=6」）続くまで繰り返す
  //    ※ユーザー要望の「5ターン以内」と「5ターン以上」の境界が衝突するため、
  //      “5ターン以内はやり直し” を優先し、6ターン目に入るまでを条件にしています。
  // =========================================================
  const __EARLY_END_TURNS = 5;        // ここ以下で決着したらやり直し
  // 仕切り直し時のHP倍率（加速度的に増える）
  // 例: 10, 20, 32, 46, 63 ...（差分が 1.2倍ずつ増えるイメージ）
  const __RETRY_HP_FIRST  = 10;       // 1回目の仕切り直し倍率
  const __RETRY_HP_SECOND = 20;       // 2回目の仕切り直し倍率
  const __RETRY_HP_GROWTH = 1.2;      // 3回目以降：差分の増加率
  const __RETRY_LIMIT     = 50;       // 念のため無限ループ防止

  function __calcRetryHpMultiplier(retryIndex){
    // retryIndex: 0=通常、1=1回目の仕切り直し...
    const idx = Math.max(0, Math.floor(Number(retryIndex || 0)));
    if (idx <= 0) return 1;

    // 1回目/2回目は固定
    if (idx === 1) return __RETRY_HP_FIRST;
    if (idx === 2) return __RETRY_HP_SECOND;

    // 3回目以降は「差分」を加速度的に増やす
    let prev = __RETRY_HP_FIRST;   // 10
    let curr = __RETRY_HP_SECOND;  // 20
    for (let i = 3; i <= idx; i++) {
      const diff = Math.max(1, curr - prev);
      const nextDiff = Math.max(1, Math.round(diff * __RETRY_HP_GROWTH));
      const next = curr + nextDiff;
      prev = curr;
      curr = next;
    }
    return curr;
  }

  // 戦闘開始直前の状態（混合スキル開始時効果等の適用後）を“基準”として保存
  // これに戻してから倍率を掛け直すことで、短期決着の戦闘を完全に無効化する。
  let __battleRetryBasePlayer, __battleRetryBaseEnemy;

  // JSON.stringify は Infinity / -Infinity / NaN を null にしてしまい、
  // 仕切り直し後に「アイテムの使用回数(usesPerBattle/remainingUses)」などが壊れて
  // 発動しなくなる原因になります。特殊な数値を保護してクローンします。
  function __battleRetryCloneSafe(obj){
    try{
      const json = JSON.stringify(obj, function(_k, v){
        if (typeof v === 'number') {
          if (Number.isNaN(v)) return "__NUM_NAN__";
          if (v === Infinity) return "__NUM_INF__";
          if (v === -Infinity) return "__NUM_NEGINF__";
        }
        return v;
      });
      return JSON.parse(json, function(_k, v){
        if (v === "__NUM_NAN__") return NaN;
        if (v === "__NUM_INF__") return Infinity;
        if (v === "__NUM_NEGINF__") return -Infinity;
        return v;
      });
    } catch(_e){
      return null;
    }
  }

  try {
    __battleRetryBasePlayer = __battleRetryCloneSafe(player);
    __battleRetryBaseEnemy  = __battleRetryCloneSafe(enemy);
  } catch (_e) {
    // JSON化できない最悪ケースは「やり直し無効」に倒して戦闘継続
    __battleRetryBasePlayer = null;
    __battleRetryBaseEnemy  = null;
  }

  function __battleRetryRestore(dst, src){
    if (!dst || !src) return;
    try {
      for (const k in dst) {
        if (Object.prototype.hasOwnProperty.call(dst, k)) delete dst[k];
      }
      for (const k in src) {
        if (Object.prototype.hasOwnProperty.call(src, k)) dst[k] = src[k];
      }
    } catch (_e) {
      // 失敗しても戦闘継続（ここでクラッシュさせない）
    }
  }

  // ===== ターン10以降：最大HPの減衰（戦闘開始時最大HPの5%ずつ） =====
  // 仕様：
  // - 10〜30ターン目の「毎ターン開始時」に発動
  // - 減少量は「戦闘開始時の最大HP」の 5%（小数は切り捨て）
  // - 最大HP/現在HPともに 0 未満にならない（現在HPは最大HPを超えないようクランプ）
  const __MAXHP_DECAY_START_TURN = 10;
  const __MAXHP_DECAY_RATE = 0.05;

  function applyMaxHpDecayAtTurnStart(ch, baseMaxHp, logArr, turnNum){
    if (turnNum < __MAXHP_DECAY_START_TURN) return;

    // baseMaxHp が 0 以下のときは減少しようがない
    if (!Number.isFinite(baseMaxHp) || baseMaxHp <= 0) return;

    const dec = Math.floor(baseMaxHp * __MAXHP_DECAY_RATE);
    if (dec <= 0) return;

    const beforeMax = Number.isFinite(ch.maxHp) ? ch.maxHp : 0;
    const afterMax  = Math.max(0, beforeMax - dec);

    if (afterMax !== beforeMax) {
      ch.maxHp = afterMax;

      // 現在HPも整合（UI/ログのHP%がズレないようにする）
      if (!Number.isFinite(ch.hp)) ch.hp = 0;
      if (ch.hp > ch.maxHp) ch.hp = ch.maxHp;
      if (ch.hp < 0) ch.hp = 0;

      // ログ（HP%の扱いを壊さないよう、ここでは「最大HP」の増減だけ表示）
      try {
        logArr.push(`${displayName(ch.name)}の最大HPが${dec}減少（${beforeMax}→${afterMax}）`);
      } catch(_e) {
        // displayName未定義などの最悪ケースでも戦闘継続
        logArr.push(`${(ch && ch.name) ? ch.name : '対象'}の最大HPが${dec}減少（${beforeMax}→${afterMax}）`);
      }
    }
  }

  // -------------------------
  // 仕切り直しループ本体
  // -------------------------
  let __retryIndex = 0; // 0=通常、1=10倍、2=20倍...
  let __battleStartMaxHp_player = 0;
  let __battleStartMaxHp_enemy  = 0;

  while (true) {
    // 基準状態に戻してから、倍率を適用して“新しい戦闘開始状態”を作る
    if (__retryIndex > 0 && __battleRetryBasePlayer && __battleRetryBaseEnemy) {
      __battleRetryRestore(player, __battleRetryBasePlayer);
      __battleRetryRestore(enemy,  __battleRetryBaseEnemy);
      updateStats();
    }

    const __hpMult = __calcRetryHpMultiplier(__retryIndex);

    // この周回（この試合）で追加されたログの開始位置（仕切り直し時に丸ごと消すため）
    const __attemptLogStart = log.length;

    // 戦闘開始時ログ（倍率が1以外のときのみ）
    // ※仕切り直し周回のときは、この行も含めて後でまとめて削除され、ダイジェストに置き換わる
    if (__hpMult !== 1) {
      log.push(`【短期決着補正】HP倍率 x${__hpMult}（リトライ#${__retryIndex}）`);
    }

// この戦闘の最大HPを倍率で調整（他ステは触らない）
    // ※maxHpが小数にならないよう切り捨て、0未満にならないようガード
    if (Number.isFinite(player.maxHp)) player.maxHp = Math.max(0, Math.floor(player.maxHp * __hpMult));
    if (Number.isFinite(enemy.maxHp))  enemy.maxHp  = Math.max(0, Math.floor(enemy.maxHp  * __hpMult));

    let turn = 1;
    const __MAX_TURNS = 15;
    hpHistory = [];
    player.hp = player.maxHp;
    enemy.hp = enemy.maxHp;
    player.battleStats = {};
    enemy.battleStats = {};

    // 戦闘中のバフ差分表示用：この戦闘の基準ステータスを記録
    ensureBattleBaseSnapshot(player);
    ensureBattleBaseSnapshot(enemy);

    // この試合の「戦闘開始時最大HP」（最大HP減衰の基準）
    __battleStartMaxHp_player = player.maxHp;
    __battleStartMaxHp_enemy  = enemy.maxHp;

    recordHP();

    // ターン制バトル開始
    while (turn <= __MAX_TURNS && player.hp > 0 && enemy.hp > 0) {
      log.push(`\n-- ${turn}ターン --`);

      if (turn === 1) {
        applyPassiveSeals(player, enemy, log);
      }
      updateSealedSkills(player);
      updateSealedSkills(enemy);

      // 最大HP減衰（10ターン目以降、ターン開始時に適用）
      // ※この後の「残りHP%ダメージ」や継続ダメージ等の計算で、HP%が
      // 正しくなるよう先に最大HPを更新する
      applyMaxHpDecayAtTurnStart(player, __battleStartMaxHp_player, log, turn);
      applyMaxHpDecayAtTurnStart(enemy,  __battleStartMaxHp_enemy,  log, turn);
      updateStats();

      // 混合スキル：毎ターン開始時（継続ダメージより前）に残りHP%追加ダメージ判定
      applyMixedHpPercentDamageAtTurnStart(player, enemy, log, turn);
      applyMixedHpPercentDamageAtTurnStart(enemy, player, log, turn);

      // 継続効果の処理（毒・火傷・再生など）
      [player, enemy].forEach(ch => {
        for (let eff of ch.effects) {
        if (eff.remaining > 0) {
          // 爆弾（タイムボム）だけは「設置から○ターン後に爆発」を必ず保証するため、
          // ここで残りターンを減算し、0になった瞬間に爆発させる。
          // ※毒/火傷など既存の継続仕様は変更しない（バランス崩壊防止）。
          if (eff.type === '爆弾') {
            eff.remaining -= 1;

            if (eff.remaining <= 0) {
              // 爆発ダメージ（バリア軽減や踏みとどまりは通常攻撃と同様に扱う）
              let bombDamage = Math.max(0, Math.floor(eff.damage || 0));
              const barrierEff = ch.effects.find(e => e.type === 'barrier');
              if (barrierEff) {
                bombDamage = Math.max(0, Math.floor(bombDamage * (1 - barrierEff.reduction)));
              }

              if (bombDamage > 0) {
                ch.hp -= bombDamage;
                log.push(`${displayName(ch.name)}に仕掛けられた爆弾が爆発！${bombDamage}ダメージ`);
                ch.battleStats['爆弾'] = (ch.battleStats['爆弾'] || 0) + bombDamage;
              } else {
                log.push(`${displayName(ch.name)}に仕掛けられた爆弾が爆発！しかしダメージはない`);
              }

              // エンデュア効果：爆発で死亡をHP1で踏みとどまる
              const endureEff = ch.effects.find(e => e.type === 'endure');
              if (endureEff && ch.hp < 1) {
                const prevented = 1 - ch.hp;
                ch.hp = 1;
                endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
                log.push(`${displayName(ch.name)}はHP1で踏みとどまった！`);
                console.log(`[Endure] ${displayName(ch.name)} survived bomb with 1 HP (prevented ${prevented})`);
              }
            }

            // 爆弾はこのターンの他の継続処理（毒/火傷等）とは別枠なのでここで次へ
            continue;
          }

          if (eff.type === '毒') {
            let dmg = eff.damage;
            // 成長型毒の場合、ダメージシーケンスから取得
            if (eff.damageSequence) {
              dmg = eff.damageSequence[eff.turnIndex] || eff.damageSequence.at(-1);
              eff.turnIndex++;
            }
            ch.hp -= dmg;
            log.push(`${displayName(ch.name)}は毒で${dmg}ダメージ`);
            ch.battleStats['毒'] = (ch.battleStats['毒'] || 0) + dmg;
            handlePoisonBurnDamage(ch, dmg, log);
            // エンデュア効果：毒で死亡をHP1で踏みとどまる
            const endureEff = ch.effects.find(e => e.type === 'endure');
            if (endureEff && ch.hp < 1) {
              const prevented = 1 - ch.hp;
              ch.hp = 1;
              endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
              log.push(`${displayName(ch.name)}はHP1で踏みとどまった！`);
              console.log(`[Endure] ${displayName(ch.name)} survived poison with 1 HP (prevented ${prevented})`);
            }
          } else if (eff.type === '火傷') {
            ch.hp -= eff.damage;
            log.push(`${displayName(ch.name)}は火傷で${eff.damage}ダメージ`);
            ch.battleStats['火傷'] = (ch.battleStats['火傷'] || 0) + eff.damage;
            handlePoisonBurnDamage(ch, eff.damage, log);
            const endureEff = ch.effects.find(e => e.type === 'endure');
            if (endureEff && ch.hp < 1) {
              const prevented = 1 - ch.hp;
              ch.hp = 1;
              endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
              log.push(`${displayName(ch.name)}はHP1で踏みとどまった！`);
              console.log(`[Endure] ${displayName(ch.name)} survived burn with 1 HP (prevented ${prevented})`);
            }
          } else if (eff.type === 'regen') {
            const heal = Math.min(ch.maxHp - ch.hp, eff.heal);
            ch.hp += heal;
            if (heal > 0) {
              log.push(`${displayName(ch.name)}は再生効果で${heal}HP回復`);
            }
          }
        }
        // ターン経過
        eff.remaining--;
      }
      // 残りターンが0になった効果の除去（ステータス戻し含む）
      ch.effects = ch.effects.filter(eff => {
        if (eff.remaining <= 0) {
          if (eff.type === 'buff') {
            ch[eff.stat] = eff.original;
          } else if (eff.type === 'debuff') {
            ch[eff.stat] = eff.original;
          } else if (eff.type === 'berserk') {
            ch.attack = eff.originalAttack;
            ch.defense = eff.originalDefense;
          } else if (eff.type === 'counter') {
            const opponent = (ch === player ? enemy : player);
            const counterDamage = eff.accumulated || 0;
            if (counterDamage > 0 && opponent.hp > 0) {
              opponent.hp = Math.max(0, opponent.hp - counterDamage);
              log.push(`${displayName(ch.name)}の${eff.skillName}：${displayName(opponent.name)}に${counterDamage}ダメージ（反撃）`);
              ch.battleStats[eff.skillName] = (ch.battleStats[eff.skillName] || 0) + counterDamage;
              console.log(`[Counter] ${displayName(ch.name)}'s ${eff.skillName} dealt ${counterDamage} damage on expiration`);
            }
          }
          return false;
        }
        return true;
      });
    });

    // 行動順決定（SPDの高い順）

    const order = [player, enemy].sort((a, b) => b.speed - a.speed);
    for (const actor of order) {
      let target = (actor === player ? enemy : player);
      if (actor.hp <= 0) continue;
      // 麻痺による行動不能
      if (actor.effects.some(e => e.type === 'stun')) {
        log.push(`${displayName(actor.name)}は麻痺して動けない！`);
        continue;
      }
      const sealed = actor.effects.some(e => e.type === 'seal');
      let useSkill = !sealed && actor.skills.length > 0;
      let chosenSkills = [];
      if (useSkill) {
        useSkill = !sealed && actor.skills.length > 0;
        if (useSkill) {
          chosenSkills = decideSkillsToUse(actor, skillSimulCount);
        
        
        // 混合スキルは通常スキルとして無意味なので、通常スキルが引けない場合はスキル発動なし
        if (!chosenSkills || chosenSkills.length === 0) {
          log.push(`${displayName(actor.name)}は適切な通常スキルを選べなかったため、スキル発動なしでターンを終える`);
          continue;
        }
if (!chosenSkills || chosenSkills.length === 0) {
          log.push(`${displayName(actor.name)}は通常スキルを引けず、何もしなかった……`);
        }
}
        for (const sk of chosenSkills) {
          // 回避判定
          const evasionEff = target.effects.find(e => e.type === 'evasion');
          if (evasionEff && Math.random() < evasionEff.chance) {
            log.push(`${displayName(target.name)}は${sk.name}を回避した！`);
            continue;
          }
          // ブロック判定
          const blockEff = target.effects.find(e => e.type === 'block');
          if (blockEff) {
            log.push(`${displayName(target.name)}は${sk.name}を防いだ！`);
            target.effects = target.effects.filter(e => e !== blockEff);
            console.log(`[Block] ${displayName(target.name)} blocked skill ${sk.name}`);
            continue;
          }
          if (sk && sk.isMixed) {
            useMixedSkill(sk, actor, target, log);
          } else {
            getSkillEffect(sk, actor, target, log);
          }
          // ダメージ反射判定
          const reflectEff = target.effects.find(e => e.type === 'reflect');
          if (reflectEff) {
            let reflectDmg = Math.floor((actor.battleStats[sk.name] || 0) * reflectEff.percent);
            if (reflectDmg > 0) {
              actor.hp -= reflectDmg;
              const endureEff = actor.effects.find(e => e.type === 'endure');
              if (endureEff && actor.hp < 1) {
                const prevented = 1 - actor.hp;
                actor.hp = 1;
                endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
                reflectDmg -= prevented;
                console.log(`[Endure] ${displayName(actor.name)} endured reflect with 1 HP (prevented ${prevented})`);
              }
              if (reflectDmg > 0) {
                log.push(`${displayName(target.name)}の反射：${displayName(actor.name)}に${reflectDmg}ダメージ`);
                target.battleStats['反射'] = (target.battleStats['反射'] || 0) + reflectDmg;
              } else {
                log.push(`${displayName(target.name)}の反射：しかし${displayName(actor.name)}はHP1で踏みとどまった！`);
              }
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
          // ブロック判定
          const blockEff = target.effects.find(e => e.type === 'block');
          if (blockEff) {
            log.push(`${displayName(target.name)}は攻撃を防いだ！`);
            target.effects = target.effects.filter(e => e !== blockEff);
            console.log(`[Block] ${displayName(target.name)} blocked the attack`);
          } else {
            // ダメージ計算
            let dmg = Math.max(0, (actor.attack - target.defense / 2) * 0.5);
            const barrierEff = target.effects.find(e => e.type === 'barrier');
            if (barrierEff) {
              dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
            } else {
              dmg = Math.floor(dmg);
            }
            target.hp -= dmg;
            // エンデュア判定（ターゲット）
            const endureEff = target.effects.find(e => e.type === 'endure');
            if (endureEff && target.hp < 1) {
              const prevented = 1 - target.hp;
              target.hp = 1;
              endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
              dmg -= prevented;
              console.log(`[Endure] ${displayName(target.name)} survived normal attack with 1 HP (prevented ${prevented})`);
              log.push(`${displayName(target.name)}はHP1で踏みとどまった！`);
            }
            log.push(`${displayName(actor.name)}の通常攻撃：${dmg}ダメージ`);
            actor.battleStats['通常攻撃'] = (actor.battleStats['通常攻撃'] || 0) + dmg;
            // ダメージ反射判定
            const reflectEff = target.effects.find(e => e.type === 'reflect');
            if (reflectEff) {
              let reflectDmg = Math.floor(dmg * reflectEff.percent);
              if (reflectDmg > 0) {
                actor.hp -= reflectDmg;
                const endureEffActor = actor.effects.find(e => e.type === 'endure');
                if (endureEffActor && actor.hp < 1) {
                  const prevented = 1 - actor.hp;
                  actor.hp = 1;
                  endureEffActor.preventedDamage = (endureEffActor.preventedDamage || 0) + prevented;
                  reflectDmg -= prevented;
                  console.log(`[Endure] ${displayName(actor.name)} endured reflected damage with 1 HP (prevented ${prevented})`);
                }
                if (reflectDmg > 0) {
                  log.push(`${displayName(target.name)}の反射：${displayName(actor.name)}に${reflectDmg}ダメージ`);
                  target.battleStats['反射'] = (target.battleStats['反射'] || 0) + reflectDmg;
                } else {
                  log.push(`${displayName(target.name)}の反射：しかし${displayName(actor.name)}はHP1で踏みとどまった！`);
                }
              }
            }
          }
        }
      }
    }

    // プレイヤー死亡時の処理（復活判定）
if (player.hp <= 0) {
  // ① 混合開始時効果（revive_mixed_start）
  const revivedMixedStart = tryReviveOnDeath(player, window.log);

  // ② 旧方式（互換：混合スキルの specialEffects 直読み等）
  const revivedLegacy = revivedMixedStart ? true : checkReviveOnDeath(player, window.log);

  if (!revivedLegacy) {
    // 戦闘終了：混合開始時効果をリセット
    resetMixedStartAfterBattle(player);
    resetMixedStartAfterBattle(enemy);

    window.log.push(`${displayName(player.name)}は力尽きた……`);
  }
}

// 各ターン終了時の反撃処理（耐久スキル）
    [player, enemy].forEach(ch => {
      const endureEff = ch.effects.find(e => e.type === 'endure');
      if (endureEff) {
        const opponent = (ch === player ? enemy : player);
        const counterDamage = endureEff.preventedDamage || 0;
        if (counterDamage > 0 && opponent.hp > 0) {
          opponent.hp = Math.max(0, opponent.hp - counterDamage);
          log.push(`${displayName(ch.name)}の${endureEff.skillName}反撃：${displayName(opponent.name)}に${counterDamage}ダメージ！`);
          console.log(`[Endure] ${displayName(ch.name)} counterattacked for ${counterDamage} damage`);
        }
        endureEff.preventedDamage = 0;
      }
    });

    // 現在HP割合表示
    const safeRatio = (hp, maxHp) => {
      const h = Number(hp);
      const m = Number(maxHp);
      if (!isFinite(h) || h <= 0) return 0;
      if (!isFinite(m) || m <= 0) return 0;
      const raw = h / m;
      if (!isFinite(raw)) return 0;
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

    // ターン終了：コンパクトなステータス一覧（CSS装飾）
    pushTurnEndStatsLog(log, player, enemy);

    recordHP();
    turn++;
  }



    // -------------------------
    // 短期決着チェック（5ターン以内に決着したらやり直し）
    // -------------------------
    const __turnsElapsed = Math.max(0, (typeof turn === 'number' ? (turn - 1) : 0));
    const __endedByHp = (player.hp <= 0 || enemy.hp <= 0);

    if (__endedByHp && __turnsElapsed <= __EARLY_END_TURNS && __battleRetryBasePlayer && __battleRetryBaseEnemy) {
      // リトライ上限を超える場合は、この結果を採用（＝ログは消さない）
      if ((__retryIndex + 1) > __RETRY_LIMIT) {
        log.push(`【短期決着補正】リトライ回数が上限（${__RETRY_LIMIT}回）に達したため、この結果を採用します。`);
        break;
      }

      // -------------------------
      // ★ ダイジェスト化：この周回で追加したログを丸ごと消して、1行だけに置き換える
      // -------------------------
      try {
        const __winnerText =
          (player.hp <= 0 && enemy.hp <= 0) ? '相打ち' :
          (player.hp <= 0) ? 'プレイヤー敗北' :
          (enemy.hp <= 0) ? 'プレイヤー勝利' : '未決着';

        // 次の周回の倍率（今回が #n なら、次は #n+1 の倍率）
        const __nextRetryIndex = __retryIndex + 1;
        const __nextHpMult = __calcRetryHpMultiplier(__nextRetryIndex);

        // この周回で追加されたログを削除
        if (typeof __attemptLogStart === 'number' && __attemptLogStart >= 0 && __attemptLogStart <= log.length) {
          log.splice(__attemptLogStart, log.length - __attemptLogStart);
        }

        // ダイジェスト1行を追加（この行だけが残る）
        log.push(`【短期決着ダイジェスト】#${__nextRetryIndex}：${__turnsElapsed}ターンで${__winnerText} → 無効化（次戦HP倍率 x${__nextHpMult}）`);
      } catch (_e) {
        // 万一ダイジェスト生成に失敗しても、リトライ自体は継続（ログは残す）
        log.push(`【短期決着ダイジェスト】${__turnsElapsed}ターン以内に決着 → 無効化（次戦へ）`);
      }

      // 次の周回へ（基準状態に戻して、HP倍率を上げて再戦）
      __retryIndex += 1;
      continue;
    }

    // この結果を採用してループ終了
    break;
  }

  // -------------------------
// 15ターン終了時の勝敗（両者生存なら残りHP割合で判定）
// -------------------------
let __endedByTurnLimit = false;
let __hpRatioPlayer = null;
let __hpRatioEnemy = null;
let __hpRatioDiff = null;

if (player.hp > 0 && enemy.hp > 0 && typeof __MAX_TURNS === 'number' && turn > __MAX_TURNS) {
  __endedByTurnLimit = true;
  const pMax = Math.max(1, (player.maxHp || player.hp || 1));
  const eMax = Math.max(1, (enemy.maxHp  || enemy.hp  || 1));
  __hpRatioPlayer = Math.max(0, player.hp) / pMax;
  __hpRatioEnemy  = Math.max(0, enemy.hp) / eMax;
  __hpRatioDiff   = __hpRatioPlayer - __hpRatioEnemy;

  const pPct = (__hpRatioPlayer * 100).toFixed(1);
  const ePct = (__hpRatioEnemy  * 100).toFixed(1);
  const diffPct = (Math.abs(__hpRatioDiff) * 100).toFixed(2);
  const sign = (__hpRatioDiff >= 0) ? '+' : '-';
  const verdict = (__hpRatioDiff >= 0) ? '勝利' : '敗北';

  log.push(`
【${__MAX_TURNS}ターン終了：HP割合判定】自HP ${pPct}% / 敵HP ${ePct}%（差 ${sign}${diffPct}%）→ ${verdict}`);
}

const playerWon = player.hp > 0 && (
  enemy.hp <= 0 ||
  (!__endedByTurnLimit && player.hp > enemy.hp) ||
  (__endedByTurnLimit && __hpRatioDiff >= 0)
);

// -------------------------
// クラッチ報酬：HP割合差が小さい「僅差勝利」ほどレア寄りアイテムを付与
// - 2%差以内のみ
// - 0.5%以内: tier3 / 1%以内: tier2 / 2%以内: tier1
// -------------------------
if (playerWon && __endedByTurnLimit && typeof __hpRatioDiff === 'number') {
  const absDiff = Math.abs(__hpRatioDiff);
  if (absDiff <= 0.02) {
    let tier = 1;
    if (absDiff <= 0.005) tier = 3;
    else if (absDiff <= 0.01) tier = 2;

    if (typeof grantClutchRewardItem === 'function') {
      grantClutchRewardItem(tier, absDiff, log);
    }
  }
}


  // 戦闘終了：混合開始時効果を必ずリセット（次戦の開始ログ欠落防止）
  resetMixedStartAfterBattle(player);
  resetMixedStartAfterBattle(enemy);
 

  // 戦闘終了：混合開始時効果＆一時ステータスを必ずリセット
  resetMixedStartAfterBattle(player);
  resetMixedStartAfterBattle(enemy);
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

// --- Manual boost: Normal mode only (isAutoBattle === false) ---
let adjustedFinalRate = finalRate;
if (window.specialMode === 'normal') {
  adjustedFinalRate = Math.min(1, finalRate * 8);
}



if (!window.isFirstBattle &&
playerWon &&
window.allowGrowthEvent &&
Math.random() < adjustedFinalRate) {

  isWaitingGrowth = true;

  showEventOptions("成長選択", [
    { label: "攻撃を上げる", value: 'attack' },
    { label: "防御を上げる", value: 'defense' },
    { label: "速度を上げる", value: 'speed' },
    { label: "HPを上げる", value: 'maxHp' },
    { label: `今回は選ばない（次回成長値x${window.getNextGrowthMultiplier()}）`, value: 'skip' }
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

    // ★ 20戦ごとのボス勝利時：アイテム or ステータス成長
    if (window.isBossBattle) {
      const bossRoll = Math.random(); // 0〜1
			const bossStatRate = (window.specialMode === 'brutal') ? 0.1 : 0.75;
			
			if (bossRoll < bossStatRate) {

        // ---- 10%：ステータス成長ボーナス ----
        currentStreak += 1;

        const statKeys = ['attack', 'defense', 'speed', 'maxHp'];
        let numStats = Math.floor(Math.random() * 4) + 1; // 1〜4個

        // 重複なしでランダム選択
        const pool = statKeys.slice();
        const chosenStats = [];
        while (pool.length > 0 && chosenStats.length < numStats) {
          const idx = Math.floor(Math.random() * pool.length);
          chosenStats.push(pool.splice(idx, 1)[0]);
        }

        // baseStats / growthBonus が無い場合のフォールバック
        if (!player.baseStats) {
          player.baseStats = {
            attack: player.attack || 0,
            defense: player.defense || 0,
            speed: player.speed || 0,
            maxHp: player.maxHp || player.hp || 0
          };
        }
        if (!player.growthBonus) {
          player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
        }

        // 低倍率寄り、たまに超高倍率（10倍は約1/10000）
        function getBossStatMultiplierByBase(baseValue) {
          // ボス勝利時の「成長倍率」を、元ステータスの大きさに応じて急激に抑える
          // 例（目安）:
          //  - base=1万    -> 約1.20倍
          //  - base=1000万 -> 約1.03倍
          //  - base=1億    -> 約1.01倍
          //
          // ※超インフレ防止のため、従来の 1.5〜10倍抽選は廃止し、
          //   「元が大きいほど伸びにくい」倍率に変更しています。

          const x = Math.max(1, Number(baseValue || 1));
          const lg = Math.log10(x);

          let target;
          if (lg <= 4) {
            target = 1.20;
          } else if (lg <= 7) {
            const t = (lg - 4) / 3; // 0..1
            target = 1.20 + (1.03 - 1.20) * t;
          } else if (lg <= 8) {
            const t = (lg - 7) / 1; // 0..1
            target = 1.03 + (1.01 - 1.03) * t;
          } else {
            target = 1.01 - 0.003 * (lg - 8);
            target = Math.max(1.001, target);
          }

          // ほんの少しだけランダム性（±15%）を付与（体感の揺らぎ用）
          const add = Math.max(0, target - 1);
          const jitter = 0.85 + Math.random() * 0.30; // 0.85..1.15
          const m = 1 + add * jitter;

          return Math.max(1.001, m);
        }

        const messages = [];
        chosenStats.forEach(stat => {
          const baseVal = (player.baseStats[stat] || 0) + (player.growthBonus[stat] || 0);
          const mult = getBossStatMultiplierByBase(baseVal);
          const boosted = Math.floor(baseVal * mult);
          const diff = boosted - baseVal;
          if (diff <= 0) return;

          player.growthBonus[stat] = (player.growthBonus[stat] || 0) + diff;

          if (stat === 'maxHp') {
            player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
            player.hp = player.maxHp;
          } else {
            player[stat] = player.baseStats[stat] + player.growthBonus[stat];
          }

          let jpName = '';
          if (stat === 'attack') jpName = '攻撃';
          else if (stat === 'defense') jpName = '防御';
          else if (stat === 'speed') jpName = '素早さ';
          else if (stat === 'maxHp') jpName = '最大HP';

          messages.push(`${jpName} が x${mult.toFixed(2)}（+${diff}）`);
        });

        if (messages.length > 0) {
          const popupMsg = 'ボスの加護！<br>' + messages.join('<br>');
          showCustomAlert(popupMsg, 4000);
          log.push('【ボス報酬】' + messages.join(' / '));
        }
      } else {
        // ---- 90%：ボス専用の確定アイテム報酬（モードに関係なく1個以上） ----
        currentStreak += 1;
        if (typeof grantBossRewardItem === 'function') {
          grantBossRewardItem();
        }
        // 鬼畜モード時だけ、従来のドロップ抽選も追加で行う
        if (window.specialMode === 'brutal') {
          maybeGainItemMemory();
          if (!isAutoBattle) {
            maybeGainItemMemory();
            if (Math.random() < 0.5) maybeGainItemMemory();
          }
        }
      }
    } else {
      // 通常戦闘時の勝利処理（従来どおり）
      if (window.specialMode === 'brutal') {
        currentStreak += 1;

        maybeGainItemMemory();

        // --- Manual bonus in brutal mode: extra drops ---
        if (!isAutoBattle) {
          maybeGainItemMemory();
          if (Math.random() < 0.5) maybeGainItemMemory();
        }
      } else {
        currentStreak += 1;
      }
    }

    let victoryMessage = `勝利：${displayName(enemy.name)}に勝利<br>現在連勝数：${currentStreak}`;
    if (window.growthMultiplier && window.growthMultiplier !== 1) {
      victoryMessage += `<br>現在の成長倍率：x${window.growthMultiplier}`;
    }

    showCustomAlert(victoryMessage, 800);

    log.push(`\n勝者：${displayName(player.name)}\n連勝数：${currentStreak}`);
    saveBattleLog(log);
    // 単発バトル回数ボーナス（処理は一旦無効化／後で再調整）


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
// ドロップ確率チェック（鬼畜モード限定）
if (window.specialMode === 'brutal' && Math.random() < FACE_COIN_DROP_RATE) {
  // スコアが高いほど平均コイン数が増える（最大10枚）
  const averageCoins = Math.min(10, 1 + (totalScore / 400000) * 2);
  const coinGain = Math.max(1, Math.floor(Math.random() * averageCoins) + 1);

  faceCoins += coinGain;

  const coinElem = document.getElementById('faceCoinCount');
  if (coinElem) coinElem.innerText = faceCoins;
}

updateFaceUI();


  // 新スキル習得のチャンス
  // 敵のRarityに応じたスキル取得確率
const rarity = enemy.rarity * (0.02 + currentStreak * 0.002);
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
  window.growthSkipCount = 0;

  window.skillDeleteUsesLeft = 3;

  streakBonus = 1;
	
	cleanUpAllMixedSkills();
	
  log.push(`\n敗北：${displayName(enemy.name)}に敗北\n連勝数：0`);
  saveBattleLog(log);


	



    // スキル記憶を更新（各スキルの最高Lvを保持）
    for (const sk of player.skills) {
      player.skillMemory[sk.name] = Math.max(sk.level, player.skillMemory[sk.name] || 1);
    }

rebuildPlayerSkillsFromMemory(player, typeof sslot === 'number' ? sslot : 0);

//stopAutoBattle();


// --- 敗北後のランダム成長（連勝数 × 敵倍率の切り上げ）---
const multiplierInt = Math.max(1, Math.ceil(enemyMultiplier)); // 切り上げ整数（最低1）
const growthTotal = Math.max(1, currentStreak * multiplierInt); // 連勝数×倍率（最低1）

const stats = ["attack", "defense", "speed", "maxHp"];
const labels = { attack: "攻撃", defense: "防御", speed: "素早さ", maxHp: "最大HP" };
const chosen = stats[Math.floor(Math.random() * stats.length)];

// growthBonus 初期化
if (!player.growthBonus) {
  player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
}

// 成長反映
player.growthBonus[chosen] += growthTotal;

// 表示用の“成長説明”を組み立て（サブタイトルに埋め込む）
const growthMsg =
  `<br><span style="font-size:12px;color:#a8ffb0">` +
  `<br>${labels[chosen]} +${growthTotal}` +
  `<br>(連勝 ${currentStreak} × 敵倍率切り上げ ${multiplierInt})</span>`;

// ステータス再計算（敗北時はHPを満タンにしない仕様は維持）
if (player.baseStats && player.growthBonus) {
  player.attack  = player.baseStats.attack  + player.growthBonus.attack;
  player.defense = player.baseStats.defense + player.growthBonus.defense;
  player.speed   = player.baseStats.speed   + player.growthBonus.speed;
  player.maxHp   = player.baseStats.maxHp   + player.growthBonus.maxHp;
}
if (typeof updateStats === "function") updateStats();

showConfirmationPopup(
  `敗北：${displayName(enemy.name)}に敗北<br>` +
  `最終連勝数：${currentStreak}<br>
	敵倍率: ${enemyMultiplier.toFixed(3)}
	
	${resetMessage}` +
  `${growthMsg}` + // ← ここで成長説明を表示
  `<br><span style="font-size:12px;">※スキルは記憶に基づいて<br>再構成されます</span>`
  , null, { autoDismissMs: 200, fadeOutMs: 160, hideOk: true }
);
				
//showSubtitle(
//  `敗北：${displayName(enemy.name)}に敗北<br>最終連勝数：${currentStreak}${resetMessage}<br><span style="font-size:12px;">※スキルは記憶に基づいて再構成されます</span>`,
//  2500
//);
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

  // ★変更: 設定戦闘回数で決着がつかない場合は「残りHP割合」で勝敗を判定
  //   - 同率はプレイヤー勝ち
  const pMax = Math.max(1, (player && (player.maxHp || player.hp)) || 1);
  const eMax = Math.max(1, (enemy && (enemy.maxHp || enemy.hp)) || 1);
  const pRatio = Math.max(0, Math.min(1, (player && (player.hp ?? 0)) / pMax));
  const eRatio = Math.max(0, Math.min(1, (enemy && (enemy.hp ?? 0)) / eMax));
  const playerWinsByRatio = (pRatio >= eRatio);

  const finalOutcomeTitle = playerWinsByRatio
    ? `${displayName(player.name)} の勝利！（残りHP割合 ${Math.round(pRatio*100)}% vs ${Math.round(eRatio*100)}%）`
    : `${displayName(player.name)} は敗北…（残りHP割合 ${Math.round(pRatio*100)}% vs ${Math.round(eRatio*100)}%）`;

  finalResEl.innerHTML = `<div class="final-death-title">${finalOutcomeTitle}</div>

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
      (function(){var onceBtn=document.getElementById('startBattleOnceBtn'); if(onceBtn) onceBtn.disabled=true;})();
    }
  }

  // ★自動保存（10戦ごと）
  try { if (typeof window.maybeAutoLocalSave === 'function') window.maybeAutoLocalSave(); } catch (_) {}

  // 20戦ごとにオートバトルを停止
  try {
    if (typeof window.battlesPlayed === 'number' &&
        window.battlesPlayed > 0 &&
        window.battlesPlayed % window.BOSS_BATTLE_INTERVAL === 0 &&
        typeof stopAutoBattle === 'function') {
      stopAutoBattle();
    }
  } catch (e2) {
    console.warn('auto battle stop (20-battle chunk) failed', e2);
  }
  // ★追加ここまで
} catch (e) {
  // （エラーハンドリング）
}

syncSkillsUI();

try {
} catch (error) {
}

// --- 戦闘処理終了：次の戦闘に備えてフラグを戻す ---
window.__battleVisualTracking = false;
window.__battleInProgress = false;
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

  const mixedListBtn = document.getElementById('mixedEffectListBtn');
  if (mixedListBtn) {
    mixedListBtn.addEventListener('click', () => {
      if (typeof window.showMixedSkillEffectListPopup === 'function') {
        window.showMixedSkillEffectListPopup();
      }
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
    if (battleInterval) return;

    const tick = () => {
      if (!isAutoBattle) { battleInterval = null; return; }

      // 「前回の戦闘が終わる前に次を予約し続ける」ことが重くなる主因なので、
      // ここで必ず “前回が終わってから次” にする（バックログを作らない）
      if (window.__battleInProgress) {
        battleInterval = window.__battleSetTimeout(tick, 50);
        return;
      }

      // 成長選択待ち中は通常は止めるが、AutoBattle中は自動選択させるため回す
      if (isWaitingGrowth) {
        // startBattle 冒頭の「isAutoBattle && isWaitingGrowth」分岐で自動成長が走る
        window.startBattle();
        battleInterval = window.__battleSetTimeout(tick, 100);
        return;
      }

      window.startBattle();
      battleInterval = window.__battleSetTimeout(tick, 100); // 連打間隔（ミリ秒）調整可
    };

    battleInterval = window.__battleSetTimeout(tick, 0);
  }

  function stopAutoBattle() {
    isAutoBattle = false; // ← 長押し終了
    try { clearTimeout(battleInterval); } catch (_) {}
    battleInterval = null;
    updateStats();  // ボタンを離したときに最新情報を描画
  }
  window.stopAutoBattle = stopAutoBattle;


  // ---- AutoBattle 長押し判定（fix A / v4）----
  // 要望:
  //  - 長押ししている間は絶対に止まらない（成長も自動で選ぶ）
  //  - 指を離したら止まる（=「離すと止まる」）
  //  - 通常タップ誤爆を防ぐため、長押し成立(300ms)で開始
  const AUTO_BATTLE_HOLD_MS = 300;
  let __autoBattleHoldTimer = null;
  let __autoBattleHoldStarted = false;

  function onAutoBattleHoldStart(e) {
    // 画面スクロール等で長押しが潰れないように抑止（特にiOS）
    try { if (e && e.cancelable) e.preventDefault(); } catch (_) {}
    __autoBattleHoldStarted = false;
    clearTimeout(__autoBattleHoldTimer);
    __autoBattleHoldTimer = window.__battleSetTimeout(() => {
      __autoBattleHoldStarted = true;
      startAutoBattle(); // 長押し成立で開始
    }, AUTO_BATTLE_HOLD_MS);
  }

  function onAutoBattleHoldEnd(e) {
    try { if (e && e.cancelable) e.preventDefault(); } catch (_) {}
    clearTimeout(__autoBattleHoldTimer);
    // 長押しが成立して AutoBattle が開始していた場合だけ停止（=離すと止まる）
    if (__autoBattleHoldStarted) {
      stopAutoBattle();
    }
    __autoBattleHoldStarted = false;
  }

  // 可能なら Pointer Events を優先（iOS/Safariでも近年は動作）
  if (window.PointerEvent) {
    battleBtn.addEventListener("pointerdown", onAutoBattleHoldStart, { passive: false });
    battleBtn.addEventListener("pointerup", onAutoBattleHoldEnd, { passive: false });
    battleBtn.addEventListener("pointercancel", onAutoBattleHoldEnd, { passive: false });
    battleBtn.addEventListener("pointerleave", onAutoBattleHoldEnd, { passive: false });
  } else {
    // PC向け
    battleBtn.addEventListener("mousedown", onAutoBattleHoldStart);
    battleBtn.addEventListener("mouseup", onAutoBattleHoldEnd);
    battleBtn.addEventListener("mouseleave", onAutoBattleHoldEnd);

    // スマホ向け
    battleBtn.addEventListener("touchstart", onAutoBattleHoldStart, { passive: false });
    battleBtn.addEventListener("touchend", onAutoBattleHoldEnd, { passive: false });
    battleBtn.addEventListener("touchcancel", onAutoBattleHoldEnd, { passive: false });
  }

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
    btn.textContent = '鬼畜モード（アイテム入手可能）';
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
	
	  window.targetBattles =
	    selectedVal === "unlimited"
	      ? null
	      : (parseInt(selectedVal, 10) || 0);
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

window.__clearEventPopupLegacy = function () {
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
  // 前回の内容をクリア（旧「左上バーUI」は廃止したため、常に通常ポップアップで表示）
  clearEventPopup(false);

  const popup = document.getElementById('eventPopup');
  const titleEl = document.getElementById('eventPopupTitle');
  const optionsEl = document.getElementById('eventPopupOptions');

  if (!popup || !titleEl || !optionsEl) return;

  // 常に通常ポップアップ（中央）
  popup.dataset.uiMode = 'default';
  popup.classList.remove('growthbar-ui');
  popup.classList.remove('expanded');
  popup.style.display = 'block';
  popup.style.visibility = 'visible';
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';

  titleEl.textContent = title;

  // options clear
  while (optionsEl.firstChild) optionsEl.removeChild(optionsEl.firstChild);

  // ボタン生成
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;

    btn.onclick = () => {
      try {
        if (typeof onSelect === 'function') onSelect(opt.value);
      } finally {
        clearEventPopup(false);
      }
    };

    optionsEl.appendChild(btn);
  });

  // 位置は fixed 中央で統一（スクロールの影響を受けない）
};

// --- Growth bar: auto-pick visual (expand briefly, then collapse) ---
window.showGrowthAutoBar = function(message) {
  // 旧「左上バー（growthbar）」UIは廃止。
  // 自動成長の通知だけ、短い中央ポップアップで出す。
  const msg = message || '自動で成長を選択しました';
  if (typeof showCenteredPopup === 'function') {
    showCenteredPopup(`成長（自動）<br>${msg}`, 900);
  }
};
;


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

  // 再描画（ちらつき防止）
  list.style.display = "none";
  list.innerHTML = "";

  const ownedSkillNames = player.skills.map(sk => sk.name);
  const memoryEntries = Object.entries(player.skillMemory); // ← ここは“格納順”をそのまま使う

  // 黒白テキストのみのシンプルなリスト、ドラッグ不可
  for (const [name, level] of memoryEntries) {
    const li = document.createElement("li");
    li.textContent = name; // ★ 色もLv表示もなし（白黒・名前のみ）
    li.setAttribute("data-name", name);
    li.setAttribute("data-level", level);
    li.setAttribute("draggable", "false");

    // 既存のドラッグ関連イベントは一切付けない
    // タップで選択（最大3つ）
    li.onclick = () => handleSkillSelect(name);

    // 所持中の視覚ヒント（白黒のまま、太字程度）
    if (ownedSkillNames.includes(name)) {
      li.style.fontWeight = "bold";
    }

    list.appendChild(li);
  }

  // 選択中の番号バッジを再描画
  updateSkillSelectionBadges();

  requestAnimationFrame(() => {
    list.style.display = "";
  });
}

// === スキルメモリー：タップ選択で上位移動（1→2→3） ===
window.skillSelectQueue = window.skillSelectQueue || [];

function handleSkillSelect(name) {
  // 既に選択済みならトグルで解除
  const idx = window.skillSelectQueue.indexOf(name);
  if (idx !== -1) {
    window.skillSelectQueue.splice(idx, 1);
  } else {
    if (window.skillSelectQueue.length >= 3) {
      if (typeof showCustomAlert === "function") showCustomAlert("選べるのは3つまで", 1200);
      return;
    }
    window.skillSelectQueue.push(name);
  }
  updateSkillSelectionBadges();

  if (window.skillSelectQueue.length === 3) {
    reorderSkillMemoryBySelection();
  }
}

function updateSkillSelectionBadges() {
  const lis = document.querySelectorAll("#skillMemoryList li");
  lis.forEach(li => {
    const name = li.getAttribute("data-name");
    const order = window.skillSelectQueue.indexOf(name);
    if (order >= 0) {
      li.classList.add("selected");
      // 表示は「1. スキル名」のように番号＋ドット
      li.textContent = (order + 1) + ". " + name;
    } else {
      li.classList.remove("selected");
      li.textContent = name;
    }
  });
}

function reorderSkillMemoryBySelection() {
  const names = window.skillSelectQueue.slice(0, 3);
  const entries = Object.entries(player.skillMemory);

  // 選択された3つを先頭、それ以外を後ろへ（元の相対順は維持）
  const rest = entries.filter(([n]) => !names.includes(n));
  const newMemory = {};
  names.forEach(n => { newMemory[n] = player.skillMemory[n]; });
  rest.forEach(([n, l]) => { newMemory[n] = l; });

  player.skillMemory = newMemory;

  // クリアして再描画
  window.skillSelectQueue.length = 0;
  drawSkillMemoryList();

  if (typeof showCustomAlert === "function") {
    showCustomAlert("選んだ3つを上へ移動しました", 1400);
  }
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
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
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
	gradBlue.addColorStop(0, 'rgba(80, 160, 255, 0.35)');
	gradBlue.addColorStop(1, 'rgba(80, 160, 255, 0.05)');
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
	gradRed.addColorStop(0, 'rgba(255, 120, 120, 0.35)');
	gradRed.addColorStop(1, 'rgba(255, 120, 120, 0.05)');
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
  shineGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

	// === グロー付き折れ線（プレイヤー） ===
	ctx.shadowColor = 'rgba(100, 180, 255, 0.6)';
	ctx.shadowBlur = 4;
	ctx.strokeStyle = 'rgba(100, 180, 255, 1)';
	ctx.lineWidth = 2;
	
	// === グロー付き折れ線（敵） ===
	ctx.shadowColor = 'rgba(255, 120, 120, 0.6)';
	ctx.shadowBlur = 4;
	ctx.strokeStyle = 'rgba(255, 120, 120, 1)';
	ctx.lineWidth = 2;

  // グロー効果を解除
  ctx.shadowBlur = 0;

  // ラベル
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
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
    window.__battleSetTimeout(() => {
        alert.style.opacity = '1';
    }, 10);

    // フェードアウト＆削除
    window.__battleSetTimeout(() => {
        alert.style.opacity = '0';
        window.__battleSetTimeout(() => {
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
  if (window.allBattleLogs.length > 20) {
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
		updateLocalSaveButton2();
		
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
  scoreTimeout = window.__battleSetTimeout(() => {
    if (battleEl) battleEl.style.opacity = '1';
    if (scoreEl) scoreEl.style.opacity = '1';
  }, 1500);

  // スキル：1.5秒後に再表示
  skillTimeout = window.__battleSetTimeout(() => {
    if (typeof updateSkillOverlay === 'function') updateSkillOverlay();
    if (skillEl) skillEl.style.opacity = '1';
  }, 1500);

  // アイテム：1.5秒後に再表示
  itemTimeout = window.__battleSetTimeout(() => {
    updateItemOverlay();
    if (itemEl) itemEl.style.opacity = '1';
  }, 1500);

  // フェイス：1秒後に再表示（scoreOverlayと同時）
  faceTimeout = window.__battleSetTimeout(() => {
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

  window.__battleSetTimeout(() => {
    overlay.style.display = "none";
    overlay.innerHTML = "";
  }, 2000);
});


// ==========================
// 自動保存（10戦ごとにローカル保存）
//  - 「はじめから」で必ずOFFに戻す（startNewGame内でリセット）
//  - ON中はオートバトル（長押し）でも10戦ごとに保存
// ==========================
if (typeof window.autoSaveEnabled !== 'boolean') window.autoSaveEnabled = false;

window.maybeAutoLocalSave = function () {
  try {
    if (!window.autoSaveEnabled) return;
    const n = Number(window.battlesPlayed || 0);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n % 10 !== 0) return;

    if (typeof window.saveToLocalStorage === 'function') {
      Promise.resolve(window.saveToLocalStorage()).then(() => {
        try {
          if (typeof showSubtitle === 'function') {
            showSubtitle(`💾 自動保存：${n}戦ごとにローカル保存しました`, 1400);
          }
        } catch (_) {}
      }).catch((e) => {
        console.warn('auto local save failed', e);
      });
    }
  } catch (e) {
    console.warn('maybeAutoLocalSave error', e);
  }
};

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
    btn.textContent = 'ローカルにセーブ:ステータス除く';
    btn.classList.remove('saved');
    btn.classList.add('unsaved');
  } else {
    btn.textContent = 'ローカルにセーブ:ステータス除く（保存済）';
    btn.classList.remove('unsaved');
    btn.classList.add('saved');
  }
}

function updateLocalSaveButton2() {
  const btn = document.getElementById('localProgressSaveMirror');
  if (!btn) return;

  if (isLocalSaveDirty) {
    btn.textContent = 'ローカルにセーブ:戦闘数進捗含む（未保存）';
    btn.classList.remove('saved');
    btn.classList.add('unsaved');
  } else {
    btn.textContent = 'ローカルにセーブ:戦闘数進捗含む（保存済）';
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
    growthSkipCount: window.growthSkipCount || 0,
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
      try { localStorage.setItem('rpgLocalBaseMeta', JSON.stringify({ timestamp: Date.now() })); } catch(_) {}
      if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
markLocalSaveClean();  // ← 状態を更新
	
	
	markAsSaved();
	updateLocalSaveButton();
	updateLocalSaveButton2();
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
    growthSkipCount: window.growthSkipCount || 0,
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
    //player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };

    player.itemMemory = parsed.itemMemory || [];
    window.initialAndSlotSkills = parsed.initialAndSlotSkills || [];
    window.levelCapExemptSkills = parsed.levelCapExemptSkills || [];
        window.growthMultiplier = parsed.growthMultiplier || 1;
    // 成長スキップ回数（未保存の旧データなら倍率からざっくり推定）
    if (typeof parsed.growthSkipCount === 'number') {
      window.growthSkipCount = Math.max(0, Math.floor(parsed.growthSkipCount));
    } else {
      const targetMul = window.growthMultiplier;
      let n = 0;
      while (n < 999 && window.calcGrowthMultiplierBySkipCount(n) < targetMul) n++;
      window.growthSkipCount = n;
    }

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

    window.__battleSetTimeout(() => {
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
	
	player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
	
};


window.loadProgressFromLocalStorage = async function () {
  const primary = localStorage.getItem('rpgLocalProgressSave');
  const fallback = localStorage.getItem('rpgLocalSave');
  if (!primary && !fallback) { alert('進捗を含む保存データが見つかりません。'); return; }

  async function tryImport(code){
    if (!code) throw new Error('no code');
    if (typeof importSaveCode !== 'function') throw new Error('importSaveCode missing');
    await importSaveCode(code);
  }

// 既存
// try {
//   await tryImport(primary);
// } catch(e1){
//   console.warn('progress import failed, trying fallback:', e1);
//   try {
//     await tryImport(fallback);
//   } catch(e2){ ... }
// }

// 変更後（フラグを立て分ける）
let used = null;
try {
  if (primary) {
    window.__loadingFromProgress = true;   // ★進捗ルート
    await tryImport(primary);
    used = 'progress';
  }
} catch (e1) {
  console.warn('progress import failed, trying fallback:', e1);
}
if (!used) {
  window.__loadingFromProgress = false;    // ★通常ルート
  await tryImport(fallback);
  used = 'fallback';
}
// フラグは後片付け（ズレ防止にsetTimeoutで確実にクリア）
window.__battleSetTimeout(() => { try { delete window.__loadingFromProgress; } catch(_){} }, 0);

  try {
    const metaStr = localStorage.getItem('rpgLocalProgressMeta');
    if (metaStr) {
      const m = JSON.parse(metaStr);
      if (m.targetBattles != null)   window.targetBattles = m.targetBattles;
      if (m.remainingBattles != null) window.remainingBattles = m.remainingBattles;
      if (m.currentStreak != null)    window.currentStreak = m.currentStreak;
    }
  } catch(_) {}

  const title = document.getElementById('titleScreen');
  const game  = document.getElementById('gameScreen');
  if (title && game) { title.classList.add('hidden'); game.classList.remove('hidden'); }
  if (typeof updateRemainingBattleDisplay === 'function') updateRemainingBattleDisplay();
  if (typeof updateStats === 'function') updateStats();
};

// ================ Debug Dump ================
window.dumpDebugSave = function(){
  try{
    const c1 = localStorage.getItem('rpgLocalSave');
    const c2 = localStorage.getItem('rpgLocalProgressSave');
    const meta = localStorage.getItem('rpgLocalProgressMeta');
    const probe = {
      now: new Date().toISOString(),
      targetBattles: window.targetBattles ?? null,
      remainingBattles: window.remainingBattles ?? null,
      battleCount: window.battleCount ?? null,
      currentStreak: window.currentStreak ?? null,
      hasPlayer: !!window.player,
      playerKeys: window.player ? Object.keys(window.player).slice(0, 50) : [],
      typeof_player: typeof window.player,
      typeof_importSaveCode: typeof window.importSaveCode,
      typeof_saveToLocalStorage: typeof window.saveToLocalStorage
    };
    const out = {
      rpgLocalSave: c1 ? (c1.slice(0,80)+'... len='+c1.length) : null,
      rpgLocalProgressSave: c2 ? (c2.slice(0,80)+'... len='+c2.length) : null,
      rpgLocalProgressMeta: meta,
      runtime: probe
    };
    const pretty = JSON.stringify(out, null, 2);
    let overlay = document.getElementById('debugDumpOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'debugDumpOverlay';
      overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.background='rgba(0,0,0,.7)';
      overlay.style.zIndex='9999'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
      const box = document.createElement('div');
      box.style.width='min(900px, 90vw)'; box.style.height='min(70vh, 600px)';
      box.style.background='rgba(0,0,0,0.6)'; box.style.border='1px solid rgba(255,255,255,.25)';
      box.style.backdropFilter='blur(10px)'; box.style.padding='16px'; box.style.borderRadius='8px';
      const ta = document.createElement('textarea');
      ta.id='debugDumpText'; ta.style.width='100%'; ta.style.height='calc(100% - 48px)'; ta.style.color='#fff'; ta.style.background='rgba(255,255,255,.06)';
      ta.style.border='1px solid rgba(255,255,255,.25)'; ta.style.padding='8px';
      const btn = document.createElement('button');
      btn.textContent='閉じる'; btn.onclick=()=>overlay.remove();
      btn.style.marginTop='8px';
      btn.style.padding='8px 16px';
      box.appendChild(ta); box.appendChild(btn);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }
    const ta = document.getElementById('debugDumpText');
    if (ta) { ta.value = pretty; ta.focus(); ta.select(); }
  }catch(e){
    alert('デバッグ出力に失敗しました：'+e.message);
    console.error(e);
  }
};



// === タイトルの「ロード」ボタン強調（最新データ側のみ光らせる） ===
window.refreshLoadButtonsHighlight = function() {
  try {
    const baseBtn = document.getElementById('loadLocalBtn');
    const progBtn = document.getElementById('loadLocalProgressBtn');
    if (!baseBtn || !progBtn) return;

    const getTs = (k) => {
      try {
        const s = localStorage.getItem(k);
        if (!s) return 0;
        const m = JSON.parse(s);
        return Number(m.timestamp) || 0;
      } catch(_) { return 0; }
    };

    // 既存のメタ構造：
    //  - 通常セーブ側:  rpgLocalBaseMeta { timestamp }
    //  - 進捗セーブ側: rpgLocalProgressMeta { timestamp, battleCount 等 }
    let tsBase = getTs('rpgLocalBaseMeta');
    let tsProg = getTs('rpgLocalProgressMeta');

    // メタが無くてもセーブ本体があるかどうかは見る（古い環境との互換）
    const hasBase = !!localStorage.getItem('rpgLocalSave');
    const hasProg = !!localStorage.getItem('rpgLocalProgressSave');

    // メタが無い場合は存在だけで「ごく古い値」として扱う（= 1）
    if (hasBase && tsBase === 0) tsBase = 1;
    if (hasProg && tsProg === 0) tsProg = 1;

    // 初期化：両方オフ
    baseBtn.classList.remove('highlight');
    progBtn.classList.remove('highlight');

    if (!hasBase && !hasProg) return; // 何も無ければ何もしない

    // 新しさで決定（同時刻なら通常セーブを優先）
    if (tsBase >= tsProg) {
      if (hasBase) baseBtn.classList.add('highlight');
    } else {
      if (hasProg) progBtn.classList.add('highlight');
    }
  } catch(e){
    console.warn('refreshLoadButtonsHighlight failed:', e);
  }
};

// ======================================================
// 進捗セーブ／ロード（既存ローカルセーブ完全互換＋メタ保存）
// ======================================================
(function () {
  // 活性制御：バトル1回以上 & 残り戦闘数>0
  function refreshProgressSaveAvailability() {
    const btn = document.getElementById('localProgressSaveBtn');
    if (!btn) return;
    const battles = (window.battleCount || 0);
    const remain  = (window.remainingBattles ?? 0);
    btn.disabled = !((battles > 0) && (remain > 0));
  }
  document.addEventListener('DOMContentLoaded', refreshProgressSaveAvailability);
  window.addEventListener('focus', refreshProgressSaveAvailability);
  setInterval(refreshProgressSaveAvailability, 1200);

  // 明示的な成功アラートを出すヘルパ
  function notify(msg){ try{ alert(msg); }catch(_){} }

  // 進捗セーブ
  window.saveProgressToLocalStorage = async function () {
    const battles = (window.battleCount || 0);
    const remain  = (window.remainingBattles ?? 0);
    if (battles <= 0) { notify('バトルを1回以上行った後にセーブできます。'); return; }
    if (remain <= 0)  { notify('残り戦闘数が0のため、進捗セーブはできません。'); return; }

    try {
      if (typeof saveToLocalStorage === 'function') {
        await saveToLocalStorage(); // 既存の正規セーブ
      }
      const baseCode = localStorage.getItem('rpgLocalSave');
      if (!baseCode) { notify('セーブコードの取得に失敗しました。'); return; }

      // 形式は一切変更せず、そのまま複製
      localStorage.setItem('rpgLocalProgressSave', baseCode);

      // 進捗メタ（JSON）
      const meta = {
        remainingBattles: window.remainingBattles ?? null,
        targetBattles: window.targetBattles ?? null,
        battleCount: window.battleCount ?? null,
        currentStreak: window.currentStreak ?? 0,
        timestamp: Date.now()
      };
      localStorage.setItem('rpgLocalProgressMeta', JSON.stringify(meta));

      if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
const btn = document.getElementById('localProgressSaveBtn');
      if (btn) { btn.classList.add('saved'); btn.classList.remove('unsaved'); }

      // 明示的に成功メッセージ（既存が沈黙でも確実に出す）
      notify('ローカルに進捗（含む）を保存しました。');
    } catch (e) {
      console.error(e);
      notify('セーブに失敗しました。');
    }
  };

  // 進捗ロード（フォールバックあり）
  window.loadProgressFromLocalStorage = async function () {
    const primary = localStorage.getItem('rpgLocalProgressSave');
    const fallback = localStorage.getItem('rpgLocalSave');
    if (!primary && !fallback) { notify('進捗を含む保存データが見つかりません。'); return; }

    async function tryImport(code){
      if (!code) throw new Error('no code');
      if (typeof importSaveCode !== 'function') throw new Error('importSaveCode missing');
      await importSaveCode(code);
    }

// 既存
// try {
//   await tryImport(primary);
// } catch(e1){
//   console.warn('progress import failed, trying fallback:', e1);
//   try {
//     await tryImport(fallback);
//   } catch(e2){ ... }
// }

// 変更後（フラグを立て分ける）
let used = null;
try {
  if (primary) {
    window.__loadingFromProgress = true;   // ★進捗ルート
    await tryImport(primary);
    used = 'progress';
  }
} catch (e1) {
  console.warn('progress import failed, trying fallback:', e1);
}
if (!used) {
  window.__loadingFromProgress = false;    // ★通常ルート
  await tryImport(fallback);
  used = 'fallback';
}
// フラグは後片付け（ズレ防止にsetTimeoutで確実にクリア）
window.__battleSetTimeout(() => { try { delete window.__loadingFromProgress; } catch(_){} }, 0);
  };

  // デバッグ出力
  if (typeof window.dumpDebugSave !== 'function') {
    window.dumpDebugSave = function(){
      try{
        const c1 = localStorage.getItem('rpgLocalSave');
        const c2 = localStorage.getItem('rpgLocalProgressSave');
        const meta = localStorage.getItem('rpgLocalProgressMeta');
        const probe = {
          now: new Date().toISOString(),
          targetBattles: window.targetBattles ?? null,
          remainingBattles: window.remainingBattles ?? null,
          battleCount: window.battleCount ?? null,
          currentStreak: window.currentStreak ?? null,
          hasPlayer: !!window.player,
          playerKeys: window.player ? Object.keys(window.player).slice(0, 50) : [],
          typeof_player: typeof window.player,
          typeof_importSaveCode: typeof window.importSaveCode,
          typeof_saveToLocalStorage: typeof window.saveToLocalStorage
        };
        const out = {
          rpgLocalSave: c1 ? (c1.slice(0,80)+'... len='+c1.length) : null,
          rpgLocalProgressSave: c2 ? (c2.slice(0,80)+'... len='+c2.length) : null,
          rpgLocalProgressMeta: meta,
          runtime: probe
        };
        const pretty = JSON.stringify(out, null, 2);
        let overlay = document.getElementById('debugDumpOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'debugDumpOverlay';
          overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.background='rgba(0,0,0,.7)';
          overlay.style.zIndex='9999'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
          const box = document.createElement('div');
          box.style.width='min(900px, 90vw)'; box.style.height='min(70vh, 600px)';
          box.style.background='rgba(0,0,0,0.6)'; box.style.border='1px solid rgba(255,255,255,.25)';
          box.style.backdropFilter='blur(10px)'; box.style.padding='16px'; box.style.borderRadius='8px';
          const ta = document.createElement('textarea');
          ta.id='debugDumpText'; ta.style.width='100%'; ta.style.height='calc(100% - 48px)'; ta.style.color='#fff'; ta.style.background='rgba(255,255,255,.06)';
          ta.style.border='1px solid rgba(255,255,255,.25)'; ta.style.padding='8px';
          const btn = document.createElement('button');
          btn.textContent='閉じる'; btn.onclick=()=>overlay.remove();
          btn.style.marginTop='8px';
          btn.style.padding='8px 16px';
          box.appendChild(ta); box.appendChild(btn);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }
        const ta = document.getElementById('debugDumpText');
        if (ta) { ta.value = pretty; ta.focus(); ta.select(); }
      }catch(e){
        alert('デバッグ出力に失敗しました：'+e.message);
        console.error(e);
      }
    };
  }
})();


// ======================================================
// Progress save/load (compat mirror, no format change)
// ======================================================
(function(){
  function notify(msg){ try{ alert(msg); }catch(_){} }
  function refreshProgressSaveAvailability(){
    const btn = document.getElementById('localProgressSaveBtn');
    if (!btn) return;
    const battles = (window.battleCount || 0);
    const remain  = (window.remainingBattles ?? 0);
    btn.disabled = !((battles > 0) && (remain > 0));
  }
  document.addEventListener('DOMContentLoaded', refreshProgressSaveAvailability);
  window.addEventListener('focus', refreshProgressSaveAvailability);
  setInterval(refreshProgressSaveAvailability, 1200);

  window.localProgressSaveMirror = async function(){
    const battles = (window.battleCount || 0);
    const remain  = (window.remainingBattles ?? 0);
    if (battles <= 0) { notify('バトルを1回以上行った後にセーブできます。'); return; }
    if (remain <= 0)  { notify('残り戦闘数が0のため、進捗セーブはできません。'); return; }
    try {
      if (typeof saveToLocalStorage === 'function') { await saveToLocalStorage(); }
      const baseCode = localStorage.getItem('rpgLocalSave');
      if (!baseCode) { notify('セーブコードの取得に失敗しました。'); return; }
      localStorage.setItem('rpgLocalProgressSave', baseCode);
      const meta = {
        remainingBattles: window.remainingBattles ?? null,
        targetBattles: window.targetBattles ?? null,
        battleCount: window.battleCount ?? null,
        currentStreak: window.currentStreak ?? 0,
        timestamp: Date.now()

      };
      localStorage.setItem('rpgLocalProgressMeta', JSON.stringify(meta));
      if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
   //   notify('ローカルに進捗（含む）を保存しました。');
      refreshProgressSaveAvailability();
    } catch(e){ console.error(e); notify('セーブに失敗しました。'); }
  };

  window.loadProgressFromLocalStorageCompat = async function(){
    const primary = localStorage.getItem('rpgLocalProgressSave');
    const fallback = localStorage.getItem('rpgLocalSave');
    if (!primary && !fallback) { notify('進捗を含む保存データが見つかりません。'); return; }
    async function tryImport(code){
      if (!code) throw new Error('no code');
      if (typeof importSaveCode !== 'function') throw new Error('importSaveCode missing');
      await importSaveCode(code);
    }
    try {
      try { await tryImport(primary); } catch(_e){ await tryImport(fallback); }
      try {
        const metaStr = localStorage.getItem('rpgLocalProgressMeta');
        if (metaStr) {
          const m = JSON.parse(metaStr);
          if (m.targetBattles != null)   window.targetBattles = m.targetBattles;
          if (m.remainingBattles != null) window.remainingBattles = m.remainingBattles;
          if (m.battleCount != null)      window.battleCount = m.battleCount;
          if (m.currentStreak != null)    window.currentStreak = m.currentStreak;
        }
      } catch(_){}
      const title = document.getElementById('titleScreen');
      const game  = document.getElementById('gameScreen');
      if (title && game) { title.classList.add('hidden'); game.classList.remove('hidden'); }
      if (typeof updateRemainingBattleDisplay === 'function') updateRemainingBattleDisplay();
      if (typeof updateStats === 'function') updateStats();
      notify('ローカルからロード（進捗含む）を実行しました。');
    } catch(e){ console.error(e); notify('ローカル保存（進捗含む）の読み込みに失敗しました。'); }
  };
})();


// ======================================================
// HARD SHIM: force progress save/load to be base-format
// and neuter any progress_v2 writers. (idempotent)
// ======================================================
(function(){
  if (window.__progressCompatShimInstalled) return;
  window.__progressCompatShimInstalled = true;

  function notify(msg){ try { alert(msg); } catch(_) {} }
  function snapshotMeta(){
    try{
      const meta = {
        remainingBattles: window.remainingBattles ?? null,
        targetBattles: window.targetBattles ?? null,
        battleCount: window.battleCount ?? null,
        currentStreak: window.currentStreak ?? 0,
        timestamp: Date.now()
      };
      localStorage.setItem('rpgLocalProgressMeta', JSON.stringify(meta));
    if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
}catch(e){ console.warn('meta save failed', e); }
  }

  async function mirrorSaveCore(){
    const battles = (window.battleCount || 0);
    const remain  = (window.remainingBattles ?? 0);
    if (battles <= 0) { notify('バトルを1回以上行った後にセーブできます。'); return; }
    if (remain <= 0)  { notify('残り戦闘数が0のため、進捗セーブはできません。'); return; }

    if (typeof window.saveToLocalStorage === 'function') {
      try { await window.saveToLocalStorage(); } catch(e){ console.warn('base save failed', e); }
    }
    let base = localStorage.getItem('rpgLocalSave');
    if (!base) { notify('セーブコードの取得に失敗しました。'); return; }
    localStorage.setItem('rpgLocalProgressSave', base);
    snapshotMeta();
    if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
  }

  window.localProgressSaveMirror = mirrorSaveCore;

  window.loadProgressFromLocalStorageCompat = async function(){
    const primary = localStorage.getItem('rpgLocalProgressSave');
    const fallback = localStorage.getItem('rpgLocalSave');
    if (!primary && !fallback) { notify('進捗を含む保存データが見つかりません。'); return; }
    async function tryImport(code){
      if (!code) throw new Error('no code');
      if (typeof importSaveCode !== 'function') throw new Error('importSaveCode missing');
      await importSaveCode(code);
    }
    try {
      try { await tryImport(primary); } catch(_){ await tryImport(fallback); }
      try {
        const metaStr = localStorage.getItem('rpgLocalProgressMeta');
        if (metaStr) {
          const m = JSON.parse(metaStr);
          if (m.targetBattles != null)   window.targetBattles = m.targetBattles;
          if (m.remainingBattles != null) window.remainingBattles = m.remainingBattles;
          if (m.battleCount != null)      window.battleCount = m.battleCount;
          if (m.currentStreak != null)    window.currentStreak = m.currentStreak;
        }
      } catch(_){}
      const title = document.getElementById('titleScreen');
      const game  = document.getElementById('gameScreen');
      if (title && game) { title.classList.add('hidden'); game.classList.remove('hidden'); }
      if (typeof updateRemainingBattleDisplay === 'function') updateRemainingBattleDisplay();
      if (typeof updateStats === 'function') updateStats();
      notify('ローカルからロード（進捗含む）を実行しました。');
    } catch(e){
      console.error(e);
      notify('ローカル保存（進捗含む）の読み込みに失敗しました。');
    }
  };

  // Intercept localStorage writes to override progress_v2
  const __origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, val){
    try {
      if (key === 'rpgLocalProgressSave' && typeof val === 'string' && val.indexOf('"version":"progress_v2"') !== -1) {
        const base = localStorage.getItem('rpgLocalSave');
        if (base) { val = base; }
      }
      const res = __origSetItem(key, val);
      if (key === 'rpgLocalSave') {
        snapshotMeta();
    if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
      }
      return res;
    } catch(e) {
      return __origSetItem(key, val);
    }
  };

  // After all scripts load, override legacy functions and attach fallback click handler
  window.addEventListener('load', function(){
    window.saveProgressToLocalStorage = mirrorSaveCore;
    window.loadProgressFromLocalStorage = window.loadProgressFromLocalStorageCompat;
    document.body.addEventListener('click', function(ev){
      const t = ev.target; if (!t) return;
      const txt = (t.textContent || '').trim();
      if (txt.includes('ローカルセーブ') && txt.includes('進捗')) {
        window.__battleSetTimeout(function(){ mirrorSaveCore(); }, 30);
      }
    }, true);
  });

  if (typeof window.dumpDebugSave !== 'function') {
    window.dumpDebugSave = function(){
      try{
        const c1 = localStorage.getItem('rpgLocalSave');
        const c2 = localStorage.getItem('rpgLocalProgressSave');
        const meta = localStorage.getItem('rpgLocalProgressMeta');
        const probe = {
          now: new Date().toISOString(),
          targetBattles: window.targetBattles ?? null,
          remainingBattles: window.remainingBattles ?? null,
          battleCount: window.battleCount ?? null,
          currentStreak: window.currentStreak ?? null,
          hasPlayer: !!window.player,
          playerKeys: window.player ? Object.keys(window.player).slice(0, 50) : [],
          typeof_player: typeof window.player,
          typeof_importSaveCode: typeof window.importSaveCode,
          typeof_saveToLocalStorage: typeof window.saveToLocalStorage
        };
        const out = {
          rpgLocalSave: c1 ? (c1.slice(0,80)+'... len='+c1.length) : null,
          rpgLocalProgressSave: c2 ? (c2.slice(0,80)+'... len='+c2.length) : null,
          rpgLocalProgressMeta: meta,
          runtime: probe
        };
        const pretty = JSON.stringify(out, null, 2);
        let overlay = document.getElementById('debugDumpOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'debugDumpOverlay';
          overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.background='rgba(0,0,0,.7)';
          overlay.style.zIndex='9999'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
          const box = document.createElement('div');
          box.style.width='min(900px, 90vw)'; box.style.height='min(70vh, 600px)';
          box.style.background='rgba(0,0,0,0.6)'; box.style.border='1px solid rgba(255,255,255,.25)';
          box.style.backdropFilter='blur(10px)'; box.style.padding='16px'; box.style.borderRadius='8px';
          const ta = document.createElement('textarea');
          ta.id='debugDumpText'; ta.style.width='100%'; ta.style.height='calc(100% - 48px)'; ta.style.color='#fff'; ta.style.background='rgba(255,255,255,.06)';
          ta.style.border='1px solid rgba(255,255,255,.25)'; ta.style.padding='8px';
          const btn = document.createElement('button');
          btn.textContent='閉じる'; btn.onclick=()=>overlay.remove();
          btn.style.marginTop='8px'; btn.style.padding='8px 16px';
          box.appendChild(ta); box.appendChild(btn);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }
        const ta = document.getElementById('debugDumpText');
        if (ta) { ta.value = pretty; ta.focus(); ta.select(); }
      }catch(e){
        alert('デバッグ出力に失敗しました：'+e.message);
        console.error(e);
      }
    };
  }
})();


// 初期同期：タイトル表示時に最新データ側を強調
document.addEventListener('DOMContentLoaded', function(){ /*_added_ready_refresh_*/
  if (typeof window.refreshLoadButtonsHighlight === 'function') {
    window.refreshLoadButtonsHighlight();
  }
});


// 初期同期：タイトル表示時に最新データ側を強調
document.addEventListener('DOMContentLoaded', function(){ /*_added_ready_refresh_v2_*/
  if (typeof window.refreshLoadButtonsHighlight === 'function') {
    window.refreshLoadButtonsHighlight();
  }
});


;(function(){
  function bindOnceButton(){
    var onceBtn = document.getElementById('startBattleOnceBtn');
    if (!onceBtn || onceBtn.__wired) return;
    onceBtn.__wired = true;
    onceBtn.addEventListener('click', function(){
      if (window.isAutoBattle) return;         // Auto中は無効
      if (window.__onceBtnCooldown) return;    // 連打防止
      window.__onceBtnCooldown = true;
      try { (window.startBattle || startBattle)(); } finally {
        window.__battleSetTimeout(function(){ window.__onceBtnCooldown = false; }, 400);
      }
    });
  }
  document.addEventListener('DOMContentLoaded', bindOnceButton);
  window.__battleSetTimeout(bindOnceButton, 0);
  window.__battleSetTimeout(bindOnceButton, 500);
})();


window.ensureBattleButtons = function(){
  var b1=document.getElementById('startBattleBtn');
  var b2=document.getElementById('startBattleOnceBtn');
  [b1,b2].forEach(function(b){
    if(!b) return;
    b.classList.remove('hidden');
    b.style.display='';
    b.disabled=false;
  });
};
document.addEventListener('DOMContentLoaded', window.ensureBattleButtons);


window.syncBattleButtonsMode = function(){
  var b1=document.getElementById('startBattleBtn');
  var b2=document.getElementById('startBattleOnceBtn');
  var brutal = (window.specialMode === 'brutal');
  [b1,b2].forEach(function(b){
    if(!b) return;
    b.classList.remove('normal-mode','brutal-mode');
    b.classList.add(brutal ? 'brutal-mode' : 'normal-mode');
  });
};
document.addEventListener('DOMContentLoaded', window.syncBattleButtonsMode);
window.__battleSetTimeout(window.syncBattleButtonsMode, 0);


;(function(){
  function after(fn, tail){ return function(){ try{ return fn.apply(this, arguments); } finally { try{ tail(); }catch(e){} } }; }
  if (typeof window.toggleSpecialMode === 'function') {
    window.toggleSpecialMode = after(window.toggleSpecialMode, window.syncBattleButtonsMode);
  }
  if (typeof window.updateSpecialModeButton === 'function') {
    window.updateSpecialModeButton = after(window.updateSpecialModeButton, window.syncBattleButtonsMode);
  }
})();


// === Selection guard refinements ===
(function(){
  function getPopup(){ return document.getElementById('eventPopup'); }
  function hasOptions(){
    const p = getPopup();
    if (!p) return false;
    const opt = p.querySelector('#eventPopupOptions');
    if (!opt) return false;
    // buttons or clickable options count
    return opt.querySelectorAll('button, .option, .choice, .selectable').length > 0;
  }
  function markHasOptions(){
    const p = getPopup();
    if (!p) return;
    if (hasOptions()) p.classList.add('has-options');
    else p.classList.remove('has-options');
  }
  // If previous helpers exist, reuse their names
  window.__hasGrowthOptions = hasOptions;
  window.__markGrowthOptions = markHasOptions;

  // Upgrade keep-alive to only enforce when options really exist
  if (window.selectionKeepAliveUpgraded !== true && typeof window.selectionKeepAlive !== 'undefined'){
    window.selectionKeepAliveUpgraded = true;
    // Stop old interval, start upgraded one
    try { if (window.selectionKeepAlive) clearInterval(window.selectionKeepAlive); } catch(e){}
    window.selectionKeepAlive = setInterval(function(){
      const p = getPopup();
      if (!p) return;
      markHasOptions();
      if (!window.isPopupSelecting || !hasOptions()){
        // auto-release if selection flag stuck but options gone
        if (window.isPopupSelecting && !hasOptions()) window.isPopupSelecting = false;
        // don't enforce display; let UI be interactive
        return;
      }
      // Only now enforce visibility
      if (p.style && p.style.display === 'none') p.style.display = 'block';
      p.classList.add('selection-lock');
    }, 250);
  }

  // Wrap clearEventPopup again to allow closing when options are gone
  if (!window.__decorate_clearEventPopup3 && typeof window.clearEventPopup === 'function'){
    window.__decorate_clearEventPopup3 = true;
    const prev = window.clearEventPopup;
    window.clearEventPopup = function(force){
      // If there are no options anymore, allow close even without force
      if (window.isPopupSelecting && !force && !hasOptions()){
        force = true;
      }
      try {
        return prev.apply(this, arguments);
      } finally {
        // If options are gone or force-close, release guards
        if (!hasOptions() || force === true){
          window.isPopupSelecting = false;
          try { 
            const p = getPopup(); 
            if (p){ p.classList.remove('selection-lock'); p.classList.remove('has-options'); }
          } catch(e){}
          try { if (window.selectionObserver) { window.selectionObserver.disconnect(); window.selectionObserver = null; } } catch(e){}
        }
      }
    }
  }

  // Also decorate showEventOptions to flag 'has-options' quickly after render tick
  if (!window.__decorate_showEventOptions3 && typeof window.showEventOptions === 'function'){
    window.__decorate_showEventOptions3 = true;
    const base = window.showEventOptions;
    window.showEventOptions = function(){
      const ret = base.apply(this, arguments);
      window.isPopupSelecting = true;
      window.__battleSetTimeout(markHasOptions, 0);
      window.__battleSetTimeout(markHasOptions, 100);   // after DOM fills
      return ret;
    }
  }
})();
// =====================================================

(function(){
  function callInit(){ if (typeof window.init === 'function') window.init(); }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', callInit);
  } else {
    callInit();
  }
  window.__battleSetTimeout(callInit, 0);
  window.__battleSetTimeout(callInit, 600);
})();
// ======================================================
// 単発バトル：二重カウント完全防止（Proxy＋クリックトークン）+ 黒ガラス風トースト
// ======================================================
;


// ===============================
// テキストセーブ出力 / テキストからロード
// ===============================

window.exportSaveAsTextFile = async function () {
  try {
    if (!player) {
      alert('セーブできるデータがありません（ゲームを開始してから実行してください）。');
      return;
    }
    if (typeof window.exportSaveCode === 'function') {
      await window.exportSaveCode();
      try {
        if (typeof showSubtitle === 'function') {
          showSubtitle('📄 セーブデータをテキスト出力しました', 1400);
        }
      } catch (_) {}
    } else {
      alert('エクスポート関数が見つかりません。');
    }
  } catch (e) {
    console.error(e);
    alert('テキスト出力に失敗しました：' + (e && e.message ? e.message : e));
  }
};

window.__bindTextFileLoadUI = function () {
  try {
    const btn = document.getElementById('loadFromTextBtn');
    const input = document.getElementById('loadTextFileInput');
    if (!btn || !input) return;

    if (btn.__bound) return;
    btn.__bound = true;

    btn.addEventListener('click', () => {
      try { input.click(); } catch (_) {}
    });

    input.addEventListener('change', async () => {
      try {
        const file = input.files && input.files[0] ? input.files[0] : null;
        if (!file) return;

        const text = (await file.text()).trim();
        if (!text) {
          alert('ファイルの内容が空です。');
          return;
        }

        if (typeof window.importSaveCode !== 'function') {
          alert('インポート関数が見つかりません。');
          return;
        }

        await window.importSaveCode(text);

      } catch (e) {
        console.error(e);
        alert('テキストからのロードに失敗しました：' + (e && e.message ? e.message : e));
      } finally {
        // 同じファイルを連続で選べるようにクリア
        try { input.value = ''; } catch (_) {}
      }
    });
  } catch (e) {
    console.warn('bindTextFileLoadUI error', e);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.__bindTextFileLoadUI === 'function') window.__bindTextFileLoadUI();
});
