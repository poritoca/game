'use strict';


window.__timeUpDebug = (typeof window.__timeUpDebug === 'boolean') ? window.__timeUpDebug : false;
// ===== TimeUp FIX: keep active player reference & snapshot (works even if player is reassigned) =====
window.__activePlayerRef = window.__activePlayerRef || null;
window.__activePlayerSnap = window.__activePlayerSnap || null;

window.__ensureActivePlayerRefOnce = window.__ensureActivePlayerRefOnce || function(){
  try{
    // prefer global variable `player` (script-scope), then window.player
    const p = (typeof player !== 'undefined' && player && typeof player === 'object') ? player :
              ((window.player && typeof window.player === 'object') ? window.player : null);
    if (!p) return;
    // Heuristic: real player has at least one of these
    const looksPlayer = (p.baseStats && p.growthBonus) || ('attack' in p) || ('defense' in p) || ('speed' in p) || ('maxHp' in p) || ('skills' in p) || ('skillMemory' in p);
    if (!looksPlayer) return;
    window.__activePlayerRef = p;
    // lightweight snapshot for time-up safety (numbers only)
    const num = (v)=>{ const n=Number(v); return (Number.isFinite(n)?n:0); };
    const snap = {};
    try{
      if (p.baseStats && p.growthBonus){
        snap.attack  = num(p.baseStats.attack)  + num(p.growthBonus.attack);
        snap.defense = num(p.baseStats.defense) + num(p.growthBonus.defense);
        snap.speed   = num(p.baseStats.speed)   + num(p.growthBonus.speed);
        snap.maxHp   = num(p.baseStats.maxHp)   + num(p.growthBonus.maxHp);
      }else{
        snap.attack  = num(p.attack || p.atk);
        snap.defense = num(p.defense || p.def);
        snap.speed   = num(p.speed || p.spd);
        snap.maxHp   = num(p.maxHp || p.hp);
      }
      snap.itemMemoryLen = (p.itemMemory && p.itemMemory.length) ? p.itemMemory.length : 0;
      snap._itemMemory = p.itemMemory || null;
      snap.name = p.name || null;
    }catch(_){}
    window.__activePlayerSnap = snap;
  }catch(_){}
};

window.__ensureActivePlayerRef = window.__ensureActivePlayerRef || function(){
  try{
    if (window.__activePlayerRefKeeperStarted) return;
    window.__activePlayerRefKeeperStarted = true;
    // run often; low cost
    setInterval(()=>{ try{ window.__ensureActivePlayerRefOnce(); }catch(_){} }, 500);
  }catch(_){}
};
try{ window.__ensureActivePlayerRef(); }catch(_){}
try{ window.__ensureActivePlayerRefOnce(); }catch(_){}
// =====================================================
// Fold helper (for inline onclick handlers)
// =====================================================
window.toggleFoldById = window.toggleFoldById || function(id){
	try{
		const el = document.getElementById(id);
		if(!el) return;
		el.classList.toggle('hidden');
	}catch(e){}
};
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

// =====================================================
// UI timer wrapper (NOT canceled by __cancelBattleVisuals)
//  - Use this for transient UI like coin toasts, subtitles, tooltips, mode banners.
// =====================================================
window.__uiSetTimeout = window.__uiSetTimeout || function __uiSetTimeout(fn, ms) {
	return setTimeout(fn, ms);
};
window.__uiClearTimeout = window.__uiClearTimeout || function __uiClearTimeout(id) {
	try { clearTimeout(id); } catch (e) {}
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
	// __cancelBattleVisualsSafetyPopups: safety net for lingering UI popups
	try {
		const c = document.getElementById('customAlertContainer');
		if (c && c.children && c.children.length) {
			// If something is stuck, allow next UI updates to recover.
			// (We don't forcibly clear here to avoid hiding important messages,
			//  but we do ensure it's clickable & not blocking.)
			c.style.pointerEvents = 'none';
		}
	} catch (e) {}
	try {
		const s = document.getElementById('subtitleOverlay');
		if (s && s.style && s.style.display !== 'none') {
			// Subtitles should never block interaction; ensure it's non-blocking.
			s.style.pointerEvents = 'none';
		}
	} catch (e) {}

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
	{ level: 999, bonus: 2 },
	{ level: 500, bonus: 1 },
	{ level: 0, bonus: 0 },
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





window.showAllGlobalVariables = function() {
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


window.updateScoreOverlay = function() {
	const overlay = document.getElementById('scoreOverlay');
	// Guard: never show overlays during long-press auto battle
	if ((typeof isAutoBattle !== 'undefined') && !!isAutoBattle) {
		try { overlay.style.display = 'none'; } catch(e){}
		return;
	}

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
	popup.style.transform = "translateX(-50%)"; // ← ← ← 修正ポイント
	popup.style.visibility = "visible";





	// clear previous auto-hide timer (so it never gets stuck)
	try {
		if (popup.__centeredPopupTimer) {
			window.__uiClearTimeout(popup.__centeredPopupTimer);
			popup.__centeredPopupTimer = null;
		}
	} catch (e) {}
	popup.__centeredPopupTimer = window.__uiSetTimeout(() => {
		popup.style.display = "none";
	}, duration);
};

window.updateSkillOverlay = function() {
	const el = document.getElementById('skillOverlay');
	// Guard: never show overlays during long-press auto battle
	if ((typeof isAutoBattle !== 'undefined') && !!isAutoBattle) {
		try { el.style.display = 'none'; } catch(e){}
		return;
	}

	if (!el || !player || !Array.isArray(player.skills)) return;

	const lines = player.skills.map(s => `${s.name} Lv${s.level}`);
	if (lines.length === 0) {
		el.style.display = 'none';
	} else {
		el.textContent = `所持スキル一覧\n` + lines.join('\n');
		el.style.display = 'block';
	}
};
window.updateItemOverlay = function() {
	const el = document.getElementById('itemOverlay');
	// Guard: never show overlays during long-press auto battle
	if ((typeof isAutoBattle !== 'undefined') && !!isAutoBattle) {
		try { el.style.display = 'none'; } catch(e){}
		return;
	}

	if (!el || !player || !Array.isArray(player.itemMemory)) return;

	const lines = player.itemMemory.map(i => {
		const name = `${i.color}${i.adjective}${i.noun}`;
		return i.protected ? `${name}（保護）` : name;
	});

	if (lines.length === 0) {
		el.style.display = 'none';
	} else {
		el.textContent = `所持魔道具一覧\n` + lines.join('\n');
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
			if (def.category === 'attack') li.style.background = '#ff4d4d'; // 濃赤
			if (def.category === 'support') li.style.background = '#33cc99'; // ミントグリーン
			if (def.category === 'special') li.style.background = '#3399ff'; // 明るめ青
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
		try{ delete popup.dataset.growthWasOpenBeforeDockMin; }catch(_e){}
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
		if (popup.__autoDismissTimer1) {
			clearTimeout(popup.__autoDismissTimer1);
			popup.__autoDismissTimer1 = null;
		}
		if (popup.__autoDismissTimer2) {
			clearTimeout(popup.__autoDismissTimer2);
			popup.__autoDismissTimer2 = null;
		}
	} catch (e) {}


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
				try{ if(popup && popup.classList && popup.classList.contains('growth-compact-ui')) return; }catch(_e){}
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

window.levelCapExemptSkills = []; // スキルレベル制限緩和対象

// 共通のクリーンアップ関数を作る

// Cancel any pending auto-dismiss timers attached to #eventPopup (used by confirmation/centered popups).
// Needed so that persistent UIs like 成長選択 don't get hidden by an older timer.
window.__cancelEventPopupTimers = function(popup){
	try{
		if(!popup) popup = document.getElementById('eventPopup');
		if(!popup) return;
		// centered popup timer
		try{
			if(popup.__centeredPopupTimer){
				window.__uiClearTimeout && window.__uiClearTimeout(popup.__centeredPopupTimer);
				clearTimeout(popup.__centeredPopupTimer);
				popup.__centeredPopupTimer = null;
			}
		}catch(_e){}
		// auto dismiss timers (confirmation popup)
		try{
			if(popup.__autoDismissTimer1){ clearTimeout(popup.__autoDismissTimer1); popup.__autoDismissTimer1=null; }
			if(popup.__autoDismissTimer2){ clearTimeout(popup.__autoDismissTimer2); popup.__autoDismissTimer2=null; }
		}catch(_e){}
		// any other timers named like __autoDismissTimer*
		try{
			Object.keys(popup).forEach(k=>{
				if(/^__autoDismissTimer/.test(k) && popup[k]){
					try{ clearTimeout(popup[k]); }catch(_){}
					popup[k]=null;
				}
			});
		}catch(_e){}
	}catch(_e){}
};
window.clearEventPopup = function(keepGrowthBar = false) {
	try{ window.__cancelEventPopupTimers && window.__cancelEventPopupTimers(document.getElementById('eventPopup')); }catch(_e){}
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


	// reset layout modes (growth-compact etc.)
	try{
		popup.classList.remove('growth-compact-ui');
		popup.classList.remove('growthbar-ui');
		popup.classList.remove('expanded');
		popup.classList.remove('selection-lock');
		popup.classList.remove('has-options');
		if (popup.dataset) {
			delete popup.dataset.uiMode;
		}
		// reset inline positioning/sizing
		popup.style.top = '';
		popup.style.left = '';
		popup.style.right = '';
		popup.style.bottom = '';
		popup.style.transform = '';
		popup.style.width = '';
		popup.style.maxWidth = '';
		popup.style.height = '';
		popup.style.maxHeight = '';
		popup.style.padding = '';
		popup.style.overflow = '';
	}catch(e){}

	// default: fully hide
	popup.style.display = 'none';
	popup.style.visibility = 'hidden';
};;

window.toggleQuickGuideLog = function() {
	const content = document.getElementById("quickGuideLog");
	content.classList.toggle("hidden");
};

	// 上部4パネル：排他開閉（同時に1つだけ開く）
	window.toggleTopFold = function(kind){
		try{
			const map = {
				guide: 'quickGuideContent',
				char: 'charInfoFold',
				log: 'quickGuideLog',
				memory: 'memoryContent',
				event: 'eventSettingsContent',
				settings: 'settingsFold'
			};
			const targetId = map[kind];
			if (!targetId) return;
			const ids = Object.values(map);
			const targetEl = document.getElementById(targetId);
			if (!targetEl) return;

			const willOpen = targetEl.classList.contains('hidden');
			// まず全て閉じる
			for (const id of ids) {
				const el = document.getElementById(id);
				if (el) el.classList.add('hidden');
			}
			// 押したものが「開く」意図の時だけ開く
			if (willOpen) {
				targetEl.classList.remove('hidden');
				// ガイドは開いたタイミングで動的生成も走らせる
				if (kind === 'guide') {
					try { window.populateItemElementList && window.populateItemElementList(); } catch (e) {}
					try { window.populateSkillGuideLists && window.populateSkillGuideLists(); } catch (e) {}
					try { window.populateQuickGuideDynamic && window.populateQuickGuideDynamic(); } catch (e) {}
				}
			}

			// ボタンの見た目（is-open）を同期
			try{
				const btns = document.querySelectorAll('.top-fold-btn[data-kind]');
				btns.forEach(btn => {
					const k = btn.getAttribute('data-kind');
					btn.classList.toggle('is-open', willOpen && k === kind);
				});
			} catch(_) {}
		}catch(e){}
	};

window.toggleQuickGuide = function() {
	const content = document.getElementById("quickGuideContent");
	if (!content) return;

	const willShow = content.classList.contains("hidden");
	content.classList.toggle("hidden");

	// 開いたタイミングで、一覧を（未生成なら）自動生成
	if (willShow) {
		try { window.populateItemElementList && window.populateItemElementList(); } catch (e) {}
		try { window.populateSkillGuideLists && window.populateSkillGuideLists(); } catch (e) {}
		try { window.populateQuickGuideDynamic && window.populateQuickGuideDynamic(); } catch (e) {}
	}
};

// ===== Quick Guide: dynamic values (Boss / Rates / Rarity filters) =====
window.populateQuickGuideDynamic = function() {
	const setText = (id, v) => {
		const el = document.getElementById(id);
		if (!el) return;
		el.textContent = (v === null || typeof v === 'undefined') ? '-' : String(v);
	};
	const setHTML = (id, html) => {
		const el = document.getElementById(id);
		if (!el) return;
		el.innerHTML = html || '-';
	};

	// Boss interval
	const interval = (typeof window.BOSS_BATTLE_INTERVAL === 'number') ? window.BOSS_BATTLE_INTERVAL : 50;
	setText('guideBossInterval', interval);
	setText('guideBossInterval2', interval);

	// Boss multipliers (normal vs brutal)
	const normalMin = (typeof window.BOSS_ENEMY_MIN_MULTIPLIER === 'number') ? window.BOSS_ENEMY_MIN_MULTIPLIER : 3;
	const normalMax = (typeof window.BOSS_ENEMY_MAX_MULTIPLIER === 'number') ? window.BOSS_ENEMY_MAX_MULTIPLIER : 10;
	const exp = (typeof window.BOSS_ENEMY_POWER_EXP === 'number') ? window.BOSS_ENEMY_POWER_EXP : 8;
	setText('guideBossMulNormal', `${normalMin}〜${normalMax}（偏り exp=${exp}）`);
	setText('guideBossMulBrutal', `1.2〜4.0（固定）`);

	// Boss face rarity rule (by streak)
	setHTML(
		'guideBossFaceRarityRule',
		`<code>D</code>（〜199） → <code>C</code>（200〜299） → <code>B</code>（300〜399） → <code>A</code>（400〜499） → <code>S</code>（500〜）`
	);

	// Boss extra stat bonus rates (implementation)
	const bossStatRateNormal = 0.75;
	const bossStatRateBrutal = 0.10;
	setText('guideBossStatRateNormal', `${(bossStatRateNormal * 100).toFixed(0)}%`);
	setText('guideBossStatRateBrutal', `${(bossStatRateBrutal * 100).toFixed(0)}%`);

	// Boss reward adjective filter (dropRate threshold)
	const threshold = 0.008;
	setText('guideBossAdjThreshold', threshold);

	try {
		const all = (typeof itemAdjectives !== 'undefined' && Array.isArray(itemAdjectives)) ? itemAdjectives : [];
		const allowed = all.filter(a => Number(a.dropRate || 1) <= threshold).map(a => a.word);
		const excluded = all.filter(a => Number(a.dropRate || 1) > threshold).map(a => a.word);

		const pill = (w) => `<span class="guide-pill">${String(w)}</span>`;
		setHTML('guideBossAdjAllowed', allowed.length ? allowed.map(pill).join('') : '（なし）');
		setHTML('guideBossAdjExcluded', excluded.length ? excluded.map(pill).join('') : '（なし）');
	} catch (e) {
		setHTML('guideBossAdjAllowed', '（取得失敗）');
		setHTML('guideBossAdjExcluded', '（取得失敗）');
	}

	// Skill gain chance (dynamic)
	const mode = (window.specialMode === 'brutal') ? '鬼畜（brutal）' : '通常（normal）';
	const streak = (typeof window.currentStreak === 'number') ? window.currentStreak : 0;
	const rNow = (typeof window.enemy === 'object' && window.enemy && typeof window.enemy.rarity === 'number') ?
		window.enemy.rarity :
		1;

	setText('guideModeNow', mode);
	setText('guideStreakNow', streak);
	setText('guideEnemyRarityNow', rNow);

	let chance = 0;
	let formula = '';
	if (window.specialMode === 'brutal') {
		chance = 0.02;
		formula = '鬼畜モード：skillGainChance = 0.002（固定）';
	} else {
		chance = Math.min(1.0, 0.01 * (rNow * (0.02 + streak * 0.002)));
		formula = '通常モード：min(1.0, 0.01 * (enemy.rarity * (0.02 + currentStreak * 0.002)))';
	}

	setText('guideSkillGainNow', `${(chance * 100).toFixed(3)}%`);
	setText('guideSkillGainFormula', formula);
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

window.skillDeleteUsesLeft = 3; // ゲーム開始時に3回

// UIボタンの処理
window.toggleSpecialMode = function() {
	const btn = document.getElementById('specialModeButton');
	const battleBtn = document.getElementById('startBattleBtn');

	if (window.specialMode === 'normal') {
		window.specialMode = 'brutal';
		btn.textContent = '鬼畜モード（魔道具入手可能）';
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
// Ensure BattleDock color updates immediately when mode is toggled
try{
	if (!window.__battleDockWrappedToggleSpecialMode && typeof window.toggleSpecialMode === 'function'){
		window.__battleDockWrappedToggleSpecialMode = true;
		const __origToggleSpecialMode = window.toggleSpecialMode;
		window.toggleSpecialMode = function(){
			const r = __origToggleSpecialMode.apply(this, arguments);
			try{ window.__refreshBattleControlDock && window.__refreshBattleControlDock(); }catch(_){}
			return r;
		};
	}
}catch(_){}


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


	// ---- 敗北/再構築時に「保護中の特殊スキル」を失わないよう保持 ----
	const preservedProtectedMixed = Array.isArray(player.mixedSkills) ?
		player.mixedSkills.filter(ms => ms && ms.isMixed && ms.isProtected) : [];
	// 初期化
	player.skills = [];
	// 特殊スキル配列を再構築（保護中のみ保持）
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

	// 固有スキルからの明示的な特殊スキル生成
	const mixCandidates = player.skills.filter(s => s.name !== uniqueSkillName);
	if (mixCandidates.length > 0) {
		const partner = mixCandidates[Math.floor(Math.random() * mixCandidates.length)];
		const combinedSkill = createMixedSkill(uniqueSkillObj, partner);
		if (combinedSkill && !hasSkill(combinedSkill.name)) {
			player.mixedSkills.push(combinedSkill);
			player.skills.push(combinedSkill);
		}
	}

	// 保護中の特殊スキルをスキル一覧へ復元（戦闘開始時の特殊効果ログ/発動のため）
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
// Battle Log settings (UI + persist)
//  - log speed slider (delay ms)
//  - log font size slider (px)
// ======================================================
// 表示間隔（ms）：小さいほど速い
window.__BATTLE_LOG_BASE_DELAY_MS = Number(window.__BATTLE_LOG_BASE_DELAY_MS || 20);

// 文字サイズ（px）
window.__BATTLE_LOG_FONT_PX = Number(window.__BATTLE_LOG_FONT_PX || 12);

function __loadBattleLogSpeedSettings() {
	// 互換維持のため関数名はそのまま（中身は設定全般）
	try {
		const ms = Number(localStorage.getItem('battleLogBaseDelayMs'));
		if (Number.isFinite(ms) && ms >= 1) window.__BATTLE_LOG_BASE_DELAY_MS = ms;
	} catch (_e) {}
	try {
		const px = Number(localStorage.getItem('battleLogFontPx'));
		if (Number.isFinite(px) && px >= 5) window.__BATTLE_LOG_FONT_PX = px;
	} catch (_e) {}
}

function __saveBattleLogSpeedSettings() {
	// 互換維持のため関数名はそのまま（中身は設定全般）
	try {
		localStorage.setItem('battleLogBaseDelayMs', String(window.__BATTLE_LOG_BASE_DELAY_MS));
		localStorage.setItem('battleLogFontPx', String(window.__BATTLE_LOG_FONT_PX));
		// 旧：加速度はUI削除につき破棄（残っていても無視される）
		try { localStorage.removeItem('battleLogAccelMode'); } catch (_e2) {}
	} catch (_e) {}
}

function __clamp(n, a, b) {
	n = Number(n);
	if (!Number.isFinite(n)) return a;
	return Math.max(a, Math.min(b, n));
}

function __getBattleLogDelayMs(lineIndex, totalLines) {
	// base: スライダーで設定した遅延
	const base = __clamp(window.__BATTLE_LOG_BASE_DELAY_MS, 1, 2000);
	return base;
}

function __applyBattleLogControlsUI() {
	const slider = document.getElementById('logSpeedSlider');
	const valueEl = document.getElementById('logSpeedValue');
	const fontSlider = document.getElementById('logFontSlider');
	const fontValueEl = document.getElementById('logFontValue');
	const logEl = document.getElementById('battleLog');
	const controls = document.getElementById('battleLogControls');
	if (!slider || !valueEl || !fontSlider || !fontValueEl || !logEl || !controls) return;


	// 戦闘経過トグルボタン（コントロール右）
	try {
		if (!document.getElementById('battleLogToggleBtn')) {
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
				} catch (e) {}
			});
			controls.appendChild(btn);
		}
	} catch (e) {}
	// 初期反映
	slider.value = String(__clamp(window.__BATTLE_LOG_BASE_DELAY_MS, Number(slider.min || 5), Number(slider.max || 200)));
	valueEl.textContent = `${slider.value}ms`;

	const applyFontPx = (px) => {
		const v = __clamp(px, Number(fontSlider.min || 10), Number(fontSlider.max || 18));
		window.__BATTLE_LOG_FONT_PX = v;
		try {
			// 基本のログ文字サイズ
			logEl.style.setProperty("font-size", `${v}px`, "important");
			// 追加：詳細UI（戦闘経過/ステータス）など、個別に font-size が固定されている要素を
			// CSS側で上書きできるように変数も設定する
			logEl.style.setProperty('--battlelog-font', `${v}px`);
			
			// 追加："戦闘経過" / "ステータス" を開いた中身が CSS の個別 font-size によって
			// #battleLog の font-size 変更に追従しないケースがあるため、既存DOMにも強制反映する。
			// （新しくpushされる要素はCSSの固定指定を削ってinheritさせるので、基本は自動追従）
			try {
				// Force-apply font-size to detail UIs (turn history/status)
				const sel = [
					"#battleLog .turn-block",
					"#battleLog .turn-block *",
					".turn-stats-header",
					".turn-stats-title",
					".turn-stats-arrow",
					".turn-stats-content",
					".turn-stats-row .side",
					".turn-stats-card .stat",
					".turn-stats-card .stat .k",
					".turn-stats-card .stat .v",
					".turn-stats-card .stat .delta",
					".turn-event-line",
					".turn-banner"
				].join(",");
				document.querySelectorAll(sel).forEach(el => {
					try { el.style.setProperty("font-size", `${v}px`, "important"); } catch(_e3) {}
				});
			} catch(_e) {}
			

		} catch (_e) {}
		fontValueEl.textContent = `${v}px`;
	};

	// 速度スライダー
	slider.addEventListener('input', () => {
		const v = __clamp(slider.value, Number(slider.min || 5), Number(slider.max || 200));
		window.__BATTLE_LOG_BASE_DELAY_MS = v;
		valueEl.textContent = `${v}ms`;
		__saveBattleLogSpeedSettings();
	});

	// 文字サイズスライダー
	fontSlider.addEventListener('input', () => {
		applyFontPx(fontSlider.value);
		__saveBattleLogSpeedSettings();
	});

	// 文字サイズ 初期反映（既存ログにも即時反映）
	fontSlider.value = String(__clamp(window.__BATTLE_LOG_FONT_PX, Number(fontSlider.min || 10), Number(fontSlider.max || 18)));
	applyFontPx(fontSlider.value);
}


// =====================================================
// Battle Controls: Floating Dock Overlay (left/right toggle)
// - Shows only on game screen (hidden on title)
// - Ensures initial render immediately after switching screens (no scroll needed)
// =====================================================
window.__battleDockSideKey = window.__battleDockSideKey || 'battleDockSide';
window.__battleDockMinKey = window.__battleDockMinKey || 'battleDockMinimized';
window.__battleDockMiniFollowKey = window.__battleDockMiniFollowKey || 'battleDockMiniFollow';


// Battle dock draggable position (x,y in viewport px)
window.__battleDockPosKey = window.__battleDockPosKey || 'battleDockPosV1';

window.__readBattleDockPos = window.__readBattleDockPos || function(){
	try{
		const raw = localStorage.getItem(window.__battleDockPosKey);
		if(!raw) return null;
		const obj = JSON.parse(raw);
		if(!obj || typeof obj.x!=='number' || typeof obj.y!=='number') return null;
		return { x: obj.x, y: obj.y };
	}catch(e){ return null; }
};

window.__writeBattleDockPos = window.__writeBattleDockPos || function(pos){
	try{
		if(!pos || typeof pos.x!=='number' || typeof pos.y!=='number') return;
		localStorage.setItem(window.__battleDockPosKey, JSON.stringify({ x: pos.x, y: pos.y }));
	}catch(e){}
};

window.__clampBattleDockToViewport = window.__clampBattleDockToViewport || function(x, y, w, h){
	const vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
	const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
	const nx = Math.min(Math.max(6, x), Math.max(6, vw - w - 6));
	const ny = Math.min(Math.max(6, y), Math.max(6, vh - h - 6));
	return { x: nx, y: ny };
};

window.__applyBattleDockSavedPos = window.__applyBattleDockSavedPos || function(dock){
	try{
		if(!dock) return;
		const pos = window.__readBattleDockPos();
		if(!pos) return;

		requestAnimationFrame(() => {
			try{
				const rect = dock.getBoundingClientRect();
				const clamped = window.__clampBattleDockToViewport(pos.x, pos.y, rect.width, rect.height);

				dock.style.setProperty('right','auto','important');
				dock.style.setProperty('left', clamped.x + 'px','important');
				dock.style.setProperty('top',  clamped.y + 'px','important');
				dock.style.setProperty('right','auto','important');
				dock.style.setProperty('bottom','auto','important');
				dock.style.setProperty('transform','none','important');
				try{ dock.classList.remove('dock-left'); dock.classList.remove('dock-right'); }catch(__){}
				dock.style.setProperty('transform','none','important');

				window.__writeBattleDockPos(clamped);
			}catch(e){}
		});
	}catch(e){}
};

window.__ensureBattleDockDraggable = window.__ensureBattleDockDraggable || function(dock){
	try{
		if(!dock) return;

		// Ensure touches can reach the handle
		try{
			if(!dock.style.zIndex) dock.style.zIndex = '10050';
		}catch(_e){}

		let handle = dock.querySelector('.dock-drag-handle');
		if(!handle){
			handle = document.createElement('div');
			handle.className = 'dock-drag-handle';
			handle.setAttribute('role','button');
			handle.setAttribute('aria-label','つまみ（ドラッグで移動）');
			handle.innerHTML = '<span class="handleDots">⋮</span><br><span class="handleText">つまみ</span>';
			dock.insertBefore(handle, dock.firstChild);
		}

		try{
			handle.style.pointerEvents = 'auto';
			handle.style.position = 'relative';
			handle.style.zIndex = '2';
		}catch(_e){}

		if(handle.__dockDragWired) return;
		handle.__dockDragWired = true;

		let dragging = false;
		let startX = 0, startY = 0;
		let baseLeft = 0, baseTop = 0;

		const getPoint = (ev) => {
			const t = (ev.touches && ev.touches[0]) ? ev.touches[0] : (ev.changedTouches && ev.changedTouches[0]) ? ev.changedTouches[0] : ev;
			return { x: t.clientX, y: t.clientY };
		};

		const onMove = (ev) => {
			if(!dragging) return;
			try{ ev.preventDefault(); }catch(_e){}
			const p = getPoint(ev);
			const dx = p.x - startX;
			const dy = p.y - startY;
			const nx = baseLeft + dx;
			const ny = baseTop + dy;

			dock.style.setProperty('right','auto','important');
			dock.style.setProperty('bottom','auto','important');
			dock.style.setProperty('transform','none','important');
			dock.style.setProperty('left', Math.round(nx) + 'px','important');
			dock.style.setProperty('top',  Math.round(ny) + 'px','important');
			dock.style.setProperty('transform','none','important');
		};

		const onEnd = (ev) => {
			if(!dragging) return;
			dragging = false;
			try{ ev.preventDefault(); }catch(_e){}

			handle.classList.remove('dragging');
			dock.classList.remove('dock-dragging');
			try{ document.body.classList.remove('battle-dock-dragging'); }catch(_e){}

			try{
				document.removeEventListener('mousemove', onMove, {passive:false});
				document.removeEventListener('mouseup', onEnd, {passive:false});
				document.removeEventListener('touchmove', onMove, {passive:false});
				document.removeEventListener('touchend', onEnd, {passive:false});
				document.removeEventListener('touchcancel', onEnd, {passive:false});
			}catch(_e){}

			// clamp and persist
			try{
				const rect = dock.getBoundingClientRect();
				const clamped = window.__clampBattleDockToViewport(rect.left, rect.top, rect.width, rect.height);
				dock.style.setProperty('left', clamped.x + 'px','important');
				dock.style.setProperty('top',  clamped.y + 'px','important');
				dock.style.setProperty('right','auto','important');
				dock.style.setProperty('bottom','auto','important');
				dock.style.setProperty('transform','none','important');
				try{ dock.classList.remove('dock-left'); dock.classList.remove('dock-right'); }catch(__){}
				// keep width locked to prevent occasional reflow after drag
				try{ dock.style.setProperty('width', Math.round(rect.width) + 'px','important'); }catch(__){}
				window.__writeBattleDockPos(clamped);
			}catch(_e){}
		};

		const onStart = (ev) => {
			try{ ev.preventDefault(); }catch(_e){}
			dragging = true;
			const p = getPoint(ev);
			startX = p.x;
			startY = p.y;

			const rect = dock.getBoundingClientRect();
			baseLeft = rect.left;
			baseTop = rect.top;

			// Normalize fixed positioning before drag to avoid stretching (left+right both set) and transform offsets
			try{
				dock.style.setProperty('right','auto','important');
				dock.style.setProperty('bottom','auto','important');
				dock.style.setProperty('transform','none','important');
				try{ dock.classList.remove('dock-left'); dock.classList.remove('dock-right'); }catch(__){}
				dock.style.setProperty('left', Math.round(rect.left) + 'px','important');
				dock.style.setProperty('top',  Math.round(rect.top)  + 'px','important');
				// Lock width during drag so the frame doesn't reflow while moving
				dock.style.setProperty('width', Math.round(rect.width) + 'px','important');
				// Keep height flexible
				dock.style.removeProperty('height');
			}catch(__){}

			handle.classList.add('dragging');
			dock.classList.add('dock-dragging');
			try{ document.body.classList.add('battle-dock-dragging'); }catch(_e){}

			// ensure current position is persisted format
			try{ window.__writeBattleDockPos({ x: rect.left, y: rect.top }); }catch(_e){}

			try{
				document.addEventListener('mousemove', onMove, {passive:false});
				document.addEventListener('mouseup', onEnd, {passive:false});
				document.addEventListener('touchmove', onMove, {passive:false});
				document.addEventListener('touchend', onEnd, {passive:false});
				document.addEventListener('touchcancel', onEnd, {passive:false});
			}catch(_e){}
		};

		handle.addEventListener('mousedown', onStart, {passive:false});
		handle.addEventListener('touchstart', onStart, {passive:false});

		// apply saved pos once on wire
		try{ window.__applyBattleDockSavedPos && window.__applyBattleDockSavedPos(dock); }catch(_e){}
	}catch(e){}
};



window.__setBattleDockSide = window.__setBattleDockSide || function(side) {
	try {
		const s = (side === 'right') ? 'right' : 'left';
		try { localStorage.setItem(window.__battleDockSideKey, s); } catch (_) {}
		window.__refreshBattleControlDock && window.__refreshBattleControlDock();
	} catch (e) {
		console.warn('[BattleDock] set side failed', e);
	}
};


window.__getBattleDockMode = window.__getBattleDockMode || function(){
	try{
		// Prefer the canonical flag used in this project
		if (window.specialMode === 'brutal') return 'brutal';
		if (window.specialMode === 'normal') return 'normal';
		// Fallbacks: infer from button class/text
		const b = document.getElementById('specialModeButton');
		if (b && b.classList && b.classList.contains('brutal-mode')) return 'brutal';
		return 'normal';
	}catch(_){
		return 'normal';
	}
};
// =====================================================
// Global UI opacity slider (Battle Dock)
// - Controls opacity for: battle dock buttons + handle label, Growth selection UI, score/skill/item overlays
// - Does NOT affect: hpChart / charts, the slider itself
// =====================================================
window.__uiOpacityKey = window.__uiOpacityKey || 'rpg_ui_opacity_percent';
window.__getUIOpacityPercent = window.__getUIOpacityPercent || function(){
	try{
		const v = Number(localStorage.getItem(window.__uiOpacityKey));
		if (Number.isFinite(v) && v >= 20 && v <= 100) return v;
	}catch(_){}
	return 100;
};
window.__setUIOpacityPercent = window.__setUIOpacityPercent || function(p){
	try{
		let v = Number(p);
		if (!Number.isFinite(v)) v = 100;
		v = Math.max(20, Math.min(100, Math.round(v)));
		try{ localStorage.setItem(window.__uiOpacityKey, String(v)); }catch(_){}
		try{ window.__applyGlobalUIOpacity && window.__applyGlobalUIOpacity(); }catch(_){}
		return v;
	}catch(_){
		return 100;
	}
};
window.__getUIOpacityAlpha = window.__getUIOpacityAlpha || function(){
	const p = window.__getUIOpacityPercent ? window.__getUIOpacityPercent() : 100;
	return Math.max(0.2, Math.min(1, p/100));
};

// Create/move the slider into battle dock (above mode button)
window.__ensureOpacityControlInBattleDock = window.__ensureOpacityControlInBattleDock || function(dock, content, modeBtn){
	try{
		if (!dock) dock = document.getElementById('battleOverlayDock');
		if (!dock) return null;
		if (!content) content = dock.querySelector('.dockContent') || dock;

		let wrap = document.getElementById('uiOpacityControl');
		if (!wrap){
			wrap = document.createElement('div');
			wrap.id = 'uiOpacityControl';
			wrap.className = 'ui-opacity-control';
			wrap.innerHTML = `
				<label id="uiOpacityLabel" for="uiOpacityRange">透過度(<span id="uiOpacityValue">100</span>%)</label>
				<input id="uiOpacityRange" type="range" min="20" max="100" step="5" value="100" />
			`;
		}

		// Move into dock
		if (!dock.contains(wrap)){
			try{ wrap.remove(); }catch(_){}
		}

		// Insert: inside content, just above mode button if possible
		try{
			const mb = modeBtn || document.getElementById('specialModeButton');
			if (mb && content && content.contains(mb)){
				content.insertBefore(wrap, mb);
			}else if (content){
				content.insertBefore(wrap, content.firstChild);
			}else{
				dock.appendChild(wrap);
			}
		}catch(_){
			try{ dock.appendChild(wrap); }catch(__){}
		}

		// Wire once
		try{
			const range = wrap.querySelector('#uiOpacityRange');
			const valueEl = wrap.querySelector('#uiOpacityValue');
			if (range && !range.__wiredUIOpacity){
				range.__wiredUIOpacity = true;
				const applyUI = () => {
					const v = window.__setUIOpacityPercent ? window.__setUIOpacityPercent(range.value) : Number(range.value);
					try{ if (valueEl) valueEl.textContent = String(v); }catch(_){}
				};
				range.addEventListener('input', applyUI, {passive:true});
				// init from saved
				const saved = window.__getUIOpacityPercent ? window.__getUIOpacityPercent() : 100;
				range.value = saved;
				try{ if (valueEl) valueEl.textContent = String(saved); }catch(_){}
			}
		}catch(_){}
		return wrap;
	}catch(_){
		return null;
	}
};

window.__applyGlobalUIOpacity = window.__applyGlobalUIOpacity || function(){
	try{
		const alpha = window.__getUIOpacityAlpha ? window.__getUIOpacityAlpha() : 1;

		// Battle dock: affect handle + main buttons/rows, but NOT the slider itself
		const dock = document.getElementById('battleOverlayDock');
		if (dock){
			const handle = dock.querySelector('.dock-drag-handle');
			if (handle) handle.style.opacity = String(alpha);

			

			// Background transparency: adjust dock frame WITHOUT fading text
			try{
				const base = Number(getComputedStyle(dock).getPropertyValue('--battleDockBgBase')) || 0.66;
				dock.style.setProperty('--battleDockBgAlpha', String(Math.max(0.06, Math.min(0.92, base * alpha))));
			}catch(_){
				try{ dock.style.setProperty('--battleDockBgAlpha', String(0.66 * alpha)); }catch(__){}
			}
const modeBtn = document.getElementById('specialModeButton');
			const battleBtn = document.getElementById('startBattleBtn');
			if (modeBtn && dock.contains(modeBtn)) modeBtn.style.opacity = String(alpha);
			if (battleBtn && dock.contains(battleBtn)) battleBtn.style.opacity = '1';
			const row = document.getElementById('battleTimeLimitRow');
			if (row && dock.contains(row)) row.style.opacity = String(alpha);

			const result = document.getElementById('battleDockResultWindow');
			if (result && dock.contains(result)) result.style.opacity = String(alpha);

			// Ensure the opacity control itself is always visible
			const ctrl = document.getElementById('uiOpacityControl');
			if (ctrl && dock.contains(ctrl)) ctrl.style.opacity = '1';
		}

		// Minimize controls (part of battle UI)
		const minBtn = document.getElementById('battleDockMinimizeBtn');
		if (minBtn) minBtn.style.opacity = String(alpha);
		const miniBar = document.getElementById('battleDockMiniBar');
		if (miniBar) miniBar.style.opacity = String(alpha);

		// Overlays
		const score = document.getElementById('scoreOverlay');
		if (score) score.style.opacity = String(alpha);
		const skill = document.getElementById('skillOverlay');
		if (skill) skill.style.opacity = String(alpha);
		const item = document.getElementById('itemOverlay');
		if (item) item.style.opacity = String(alpha);

		// Growth selection UI only (avoid affecting other event popups)
		const popup = document.getElementById('eventPopup');
		if (popup){
			const isGrowth = popup.classList.contains('growth-compact-ui') || popup.classList.contains('growthbar-ui') || popup.getAttribute('data-ui-mode') === 'growth';
			if (isGrowth) popup.style.opacity = String(alpha);
		}

		// Charts: intentionally NOT affected (hpChart etc) -> do nothing
	}catch(_){}
};


window.__setBattleDockMinimized = window.__setBattleDockMinimized || function(minimized) {
	try {
		const v = minimized ? '1' : '0';
		try { localStorage.setItem(window.__battleDockMinKey, v); } catch (_) {}
		if (!minimized) { try{ window.__battleDockScrollStartY = null; }catch(_){}} 
		window.__refreshBattleControlDock && window.__refreshBattleControlDock();
	} catch (e) {
		console.warn('[BattleDock] set minimized failed', e);
	}
};

// Mini bar follow mode: 'viewport' (fixed to visible screen bottom) or 'page' (absolute, follows page scroll)
window.__getBattleDockMiniFollow = window.__getBattleDockMiniFollow || function(){
	try{
		const v = localStorage.getItem(window.__battleDockMiniFollowKey);
		return (v === 'page') ? 'page' : 'viewport'; // default viewport
	}catch(_){ return 'viewport'; }
};
window.__setBattleDockMiniFollow = window.__setBattleDockMiniFollow || function(mode){
	try{
		const m = (mode === 'page') ? 'page' : 'viewport';
		try{ localStorage.setItem(window.__battleDockMiniFollowKey, m); }catch(_){}
		window.__refreshBattleControlDock && window.__refreshBattleControlDock();
		// ensure immediate follow update
		try{ window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow(true); }catch(_){}
	}catch(e){}
};

// Pulse effect for the mini bar when auto-minimized by scrolling
window.__battleDockPulseMiniBar = window.__battleDockPulseMiniBar || function(){
	try{
		const miniBar = document.getElementById('battleDockMiniBar');
		if(!miniBar) return;
		miniBar.classList.add('scroll-minimized');
		try{ void miniBar.offsetWidth; }catch(_){}
		setTimeout(()=>{ try{ miniBar.classList.remove('scroll-minimized'); }catch(_){} }, 650);
	}catch(_){}
};

// ---------------------------------------------------------
// Auto-minimize notice (tap to dismiss, auto-hide)
// - Centered in the current viewport (iPhone Safari safe)
// ---------------------------------------------------------
window.__showAutoMinimizeNotice = window.__showAutoMinimizeNotice || function(){
	try{
		// Rate-limit to avoid spam on continuous scroll
		const now = Date.now();
		const last = Number(window.__autoMinimizeNoticeLastAt || 0);
		if (now - last < 1200) return;
		window.__autoMinimizeNoticeLastAt = now;

		let toast = document.getElementById('autoMinimizeToast');
		if (!toast) {
			toast = document.createElement('div');
			toast.id = 'autoMinimizeToast';
			toast.setAttribute('role','status');
			toast.setAttribute('aria-live','polite');
			toast.innerHTML =
				'<div class="main">UIを最小化しました</div>' +
				'<span class="sub">下のバーをタップで復元できます（タップで閉じる）</span>';
			try{ document.body.appendChild(toast); }catch(_e){}
		}

		// show
		try{ toast.style.display = 'block'; }catch(_e){}
		try{ toast.classList.add('is-show'); }catch(_e){}

		// clear previous timers
		try{
			if (toast.__hideTimer) {
				if (typeof window.__uiClearTimeout === 'function') window.__uiClearTimeout(toast.__hideTimer);
				else clearTimeout(toast.__hideTimer);
			}
		}catch(_e){}

		const hide = () => {
			try{ toast.classList.remove('is-show'); }catch(_e){}
			try{ toast.style.display = 'none'; }catch(_e){}
			try{
				toast.removeEventListener('click', hide);
				toast.removeEventListener('touchstart', hide);
			}catch(_e){}
		};

		// tap-to-dismiss
		try{
			toast.addEventListener('click', hide, { once: true });
			toast.addEventListener('touchstart', hide, { once: true, passive: true });
		}catch(_e){}

		// auto-hide after 2s (UI timer wrapper; NOT canceled by battle visual cancels)
		const setT = (typeof window.__uiSetTimeout === 'function') ? window.__uiSetTimeout : setTimeout;
		toast.__hideTimer = setT(hide, 2000);
	}catch(_e){}
};



window.__initBattleControlDock = window.__initBattleControlDock || function() {
	try {
		if (document.getElementById('battleOverlayDock')) return;

		const dock = document.createElement('div');
		dock.id = 'battleOverlayDock';
		dock.classList.add('dock-left');

		// Make the dock draggable (like Growth selection UI)
		try{ window.__ensureBattleDockDraggable && window.__ensureBattleDockDraggable(dock); }catch(_e){}


		// ---------------------------------------------------------
		// Mini bar follow + auto-minimize on scroll
		// ---------------------------------------------------------
		window.__isBattleDockMinimized = window.__isBattleDockMinimized || function() {
			try { return (localStorage.getItem(window.__battleDockMinKey) === '1'); }
			catch (_) { return false; }
		};

		window.__updateBattleDockMiniBarFollow = window.__updateBattleDockMiniBarFollow || function(force) {
	try {
		const miniBar = document.getElementById('battleDockMiniBar');
		if (!miniBar) return;

		// Only reposition when visible (minimized state)
		const isVisible = (miniBar.style.display !== 'none' && miniBar.offsetParent !== null);
		if (!isVisible) return;

		const follow = (window.__getBattleDockMiniFollow ? window.__getBattleDockMiniFollow() : 'viewport');

		// viewport follow: rely on CSS position:fixed + bottom (best for iPhone Safari)
		if (follow === 'viewport') {
			miniBar.classList.add('follow-viewport');
			miniBar.classList.remove('follow-page');
			miniBar.style.top = '';
			return;
		}

		// page follow (legacy): compute absolute top so it sits at the visible screen bottom
		miniBar.classList.add('follow-page');
		miniBar.classList.remove('follow-viewport');

		const vv = window.visualViewport || null;
		const viewportH = vv ? vv.height : window.innerHeight;
		const offsetTop = vv ? vv.offsetTop : 0; // iOS address bar / keyboard
		const barH = miniBar.offsetHeight || 16;
		const bottomGap = 14;

		const top = (window.scrollY + offsetTop + viewportH - bottomGap - barH);
		miniBar.style.top = Math.max(0, Math.round(top)) + 'px';
	} catch (e) {
		console.warn('[BattleDock] mini bar follow failed', e);
	}
};;


// Minimize controls (bottom-center)
const minBtn = document.createElement('button');
minBtn.type = 'button';
minBtn.id = 'battleDockMinimizeBtn';
minBtn.textContent = '最小化';
minBtn.addEventListener('click', () => window.__setBattleDockMinimized(true));

const miniBar = document.createElement('button');
miniBar.type = 'button';
miniBar.id = 'battleDockMiniBar';
miniBar.setAttribute('aria-label', '最小化バー（クリックで復帰）');
miniBar.addEventListener('click', () => window.__setBattleDockMinimized(false));

		// Content area (actual buttons moved here)
		const content = document.createElement('div');
		content.className = 'dockContent';

		dock.appendChild(content);

		document.body.appendChild(dock);

		document.body.appendChild(minBtn);
		document.body.appendChild(miniBar);

		// Place opacity slider into dock now (above mode button)
		try{ window.__ensureOpacityControlInBattleDock && window.__ensureOpacityControlInBattleDock(dock, content, null); }catch(_e){}
		try{ window.__applyGlobalUIOpacity && window.__applyGlobalUIOpacity(); }catch(_e){}


		// Observe screen switch so the dock appears immediately on game screen
		const gameScreen = document.getElementById('gameScreen');
		if (gameScreen && !gameScreen.__battleDockObserved) {
			gameScreen.__battleDockObserved = true;
			const obs = new MutationObserver(() => {
				try { window.__refreshBattleControlDock && window.__refreshBattleControlDock(); } catch (_) {}
			});
			obs.observe(gameScreen, { attributes: true, attributeFilter: ['class', 'style'] });
		}

		// Also refresh on visibility changes for title screen
		const titleScreen = document.getElementById('titleScreen');
		if (titleScreen && !titleScreen.__battleDockObserved) {
			titleScreen.__battleDockObserved = true;
			const obs2 = new MutationObserver(() => {
				try { window.__refreshBattleControlDock && window.__refreshBattleControlDock(); } catch (_) {}
			});
			obs2.observe(titleScreen, { attributes: true, attributeFilter: ['class', 'style'] });
		}

	} catch (e) {
		console.warn('[BattleDock] init failed', e);
	}

		// Auto-minimize on any scroll/touch scroll (except while auto-battle is running)
		if (!window.__battleDockScrollAutoMinHooked) {
			window.__battleDockScrollAutoMinHooked = true;

			const tryAutoMinimize = (ev) => {
				try {
					// If user is dragging the growth popup (成長選択), never auto-minimize
					if (window.__growthPopupDragging) return;
					// If the gesture started on the growth popup, don't auto-minimize (iPhone drag/tap safety)
					try{
						const __t = ev && ev.target;
						if(__t && __t.closest){
							if(__t.closest('#eventPopup.growth-compact-ui')) return;
						}
					}catch(_e){}

					// Only on game screen
					const titleScreen = document.getElementById('titleScreen');
					const gameScreen = document.getElementById('gameScreen');
					const isTitleVisible = !!(titleScreen && !titleScreen.classList.contains('hidden'));
					const isGameVisible  = !!(gameScreen && !gameScreen.classList.contains('hidden'));
					if (isTitleVisible || !isGameVisible) return;

					// Guard: during long-press auto battle, never auto-minimize
					const autoRunning = (typeof isAutoBattle !== 'undefined') && !!isAutoBattle;
					if (autoRunning) return;

					// If already minimized, keep following the scroll
					if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
						window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
						return;
					}

					
// Otherwise: auto-minimize only after enough scrolling (less sensitive)
const threshold = Number(window.__battleDockAutoMinScrollThresholdPx || 90); // px
if (!window.__battleDockScrollStartY || !Number.isFinite(Number(window.__battleDockScrollStartY))) {
	window.__battleDockScrollStartY = window.scrollY || 0;
}
const dy = Math.abs((window.scrollY || 0) - Number(window.__battleDockScrollStartY || 0));
if (dy < threshold) {
	return;
}
// Enough scroll: minimize (scroll-triggered effect)
window.__setBattleDockMinimized && window.__setBattleDockMinimized(true);
					// Notify user (tap-to-dismiss, auto-hide) - centered in viewport
					window.__showAutoMinimizeNotice && window.__showAutoMinimizeNotice();
window.__battleDockPulseMiniBar && window.__battleDockPulseMiniBar();
window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
window.__battleDockScrollStartY = null;
				} catch (_) {}
			};

			window.addEventListener('touchstart', (ev)=>{ try{ if(!(window.__isBattleDockMinimized && window.__isBattleDockMinimized())) window.__battleDockScrollStartY = window.scrollY||0; }catch(_e){} }, { passive: true });
			window.addEventListener('scroll', tryAutoMinimize, { passive: true });
			window.addEventListener('touchmove', tryAutoMinimize, { passive: true });
			window.addEventListener('resize', () => window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow(), { passive: true });

			// visualViewport (iOS)
			if (window.visualViewport) {
				window.visualViewport.addEventListener('scroll', () => window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow(), { passive: true });
				window.visualViewport.addEventListener('resize', () => window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow(), { passive: true });
			}
		}
};

window.__refreshBattleControlDock = window.__refreshBattleControlDock || function() {
	try {
		const dock = document.getElementById('battleOverlayDock');
		if (!dock) return;

		const minBtn = document.getElementById('battleDockMinimizeBtn');
		const miniBar = document.getElementById('battleDockMiniBar');

		const titleScreen = document.getElementById('titleScreen');
		const gameScreen = document.getElementById('gameScreen');

		const isTitleVisible = !!(titleScreen && !titleScreen.classList.contains('hidden'));
		const isGameVisible  = !!(gameScreen && !gameScreen.classList.contains('hidden'));

		// Title screen: always hide
		if (isTitleVisible || !isGameVisible) {
			dock.style.display = 'none';
			if (minBtn) minBtn.style.display = 'none';
			if (miniBar) miniBar.style.display = 'none';
			return;
		}


// Apply minimized state (persisted)
let minimized = false;
try {
	minimized = (localStorage.getItem(window.__battleDockMinKey) === '1');
} catch (_) {}


		// Sync growth-compact event popup with dock minimized state (iPhone-friendly UX)
		try{
			const __gp = document.getElementById('eventPopup');
			if (__gp && __gp.classList && __gp.classList.contains('growth-compact-ui')) {
				const __isOpen = (__gp.style.display !== 'none');
				if (minimized) {
					if (__isOpen) {
						try{ __gp.dataset.growthWasOpenBeforeDockMin = '1'; }catch(_e){}
						__gp.style.display = 'none';
						__gp.style.visibility = 'hidden';
					}
				} else {
					try{
						if (__gp.dataset && __gp.dataset.growthWasOpenBeforeDockMin === '1') {
							__gp.style.display = 'block';
							__gp.style.visibility = 'visible';
							delete __gp.dataset.growthWasOpenBeforeDockMin;
						}
					}catch(_e){}
				}
			}
		}catch(e){}


		// Keep mode color binding in sync even while minimized
		const __bdMode = (window.__getBattleDockMode && window.__getBattleDockMode()) || 'normal';
		const __bdIsBrutal = (__bdMode === 'brutal');
		if (dock) {
			dock.classList.toggle('mode-normal', !__bdIsBrutal);
			dock.classList.toggle('mode-brutal', __bdIsBrutal);
		}
		if (minBtn) {
			minBtn.classList.toggle('mode-normal', !__bdIsBrutal);
			minBtn.classList.toggle('mode-brutal', __bdIsBrutal);
		}
		if (miniBar) {
			miniBar.classList.toggle('mode-normal', !__bdIsBrutal);
			miniBar.classList.toggle('mode-brutal', __bdIsBrutal);
		}

if (minimized) {
			try { window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow(); } catch (_) {}
	dock.style.display = 'none';
	if (minBtn) minBtn.style.display = 'none';
	if (miniBar) miniBar.style.display = 'block';
	return;
} else {
	if (miniBar) miniBar.style.display = 'none';
	if (minBtn) minBtn.style.display = 'block';
}

// Apply side (persisted)
		let side = 'left';
		try {
			side = localStorage.getItem(window.__battleDockSideKey) || 'left';
		} catch (_) {}
		side = (side === 'right') ? 'right' : 'left';

		dock.classList.toggle('dock-left', side === 'left');
		dock.classList.toggle('dock-right', side === 'right');
		// Apply mode color (normal / brutal)
		const mode = (window.__getBattleDockMode && window.__getBattleDockMode()) || 'normal';
		const isBrutal = (mode === 'brutal');
		dock.classList.toggle('mode-normal', !isBrutal);
		dock.classList.toggle('mode-brutal', isBrutal);
		if (miniBar) {
			miniBar.classList.toggle('mode-normal', !isBrutal);
			miniBar.classList.toggle('mode-brutal', isBrutal);
		}
		if (minBtn) {
			minBtn.classList.toggle('mode-normal', !isBrutal);
			minBtn.classList.toggle('mode-brutal', isBrutal);
		}


		// Toggle UI active state
		const btns = dock.querySelectorAll('.dockSideBtn');
		if (btns && btns.length >= 2) {
			btns[0].classList.toggle('is-active', side === 'left');
			btns[1].classList.toggle('is-active', side === 'right');
		}

		// Move buttons into dock (keep IDs/listeners intact)
		const content = dock.querySelector('.dockContent') || dock;
		const modeBtn = document.getElementById('specialModeButton');
		const battleBtn = document.getElementById('startBattleBtn');

		// Ensure opacity slider is inside the battle dock (above mode button)
		try{ window.__ensureOpacityControlInBattleDock && window.__ensureOpacityControlInBattleDock(dock, content, modeBtn); }catch(_e){}

		if (modeBtn && !dock.contains(modeBtn)) content.appendChild(modeBtn);
		if (battleBtn && !dock.contains(battleBtn)) content.appendChild(battleBtn);

		// Apply saved draggable position (if any)
		try{ window.__applyBattleDockSavedPos && window.__applyBattleDockSavedPos(dock); }catch(_e){}

		// Show now (no scroll required)
		dock.style.display = 'flex';
		// Force paint on iOS after screen switch
		requestAnimationFrame(() => {
			try { dock.style.opacity = '1'; } catch (_) {}
		});

		// Re-apply global opacity (handle/buttons/overlays) after DOM moves
		try{ window.__applyGlobalUIOpacity && window.__applyGlobalUIOpacity(); }catch(_e){}
	} catch (e) {
		console.warn('[BattleDock] refresh failed', e);
	}
};

// Safe bootstrap
window.__ensureBattleDockReady = window.__ensureBattleDockReady || function() {
	try {
		window.__initBattleControlDock && window.__initBattleControlDock();
		window.__refreshBattleControlDock && window.__refreshBattleControlDock();
		// extra refresh after a short delay (fade-in timing)
		(window.__battleSetTimeout || window.setTimeout)(() => {
			try { window.__refreshBattleControlDock && window.__refreshBattleControlDock(); } catch (_) {}
		}, 60);
		(window.__battleSetTimeout || window.setTimeout)(() => {
			try { window.__refreshBattleControlDock && window.__refreshBattleControlDock(); } catch (_) {}
		}, 260);
	} catch (e) {}
};


// ---------------------------------------------------------
// BattleDock: result window (used for defeat result etc.)
// - Always uses draggable BattleDock UI (no legacy centered popup)
// - Safe: never throws; will silently no-op if dock not ready
// ---------------------------------------------------------
window.__showBattleDockResultWindow = window.__showBattleDockResultWindow || function(messageHtml, options = {}) {
	try {
		// Ensure dock exists/visible
		try { window.__ensureBattleDockReady && window.__ensureBattleDockReady(); } catch (_e) {}
		const dock = document.getElementById('battleOverlayDock');
		if (!dock) return;

		// If dock is minimized, unminimize so the user can see the result
		try {
			if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
				window.__setBattleDockMinimized && window.__setBattleDockMinimized(false);
			}
		} catch (_e) {}
 
		let box = document.getElementById('battleDockResultWindow');
		if (!box) {
			box = document.createElement('div');
			box.id = 'battleDockResultWindow';
			box.setAttribute('role', 'status');
			box.className = 'battleDockResultWindow';
			// place above buttons
			const content = dock.querySelector('.dockContent') || dock;
			dock.insertBefore(box, content);
		}

		// Reset any previous fade/timers
		box.classList.remove('show');
		box.classList.remove('fade-out');
		box.style.opacity = '1';
		try {
			if (box.__timer1) { (window.__uiClearTimeout || window.clearTimeout)(box.__timer1); box.__timer1 = null; }
			if (box.__timer2) { (window.__uiClearTimeout || window.clearTimeout)(box.__timer2); box.__timer2 = null; }
		} catch (_e) {}

		box.innerHTML = messageHtml || '';

		// Show
		box.style.display = 'block';
		// Force reflow so transitions apply reliably
		try { void box.offsetWidth; } catch (_e) {}
		box.classList.add('show');

		// Auto-dismiss support (same option names as showConfirmationPopup)
		const autoDismissMs = Number(options.autoDismissMs || 0);
		const fadeOutMs = Number(options.fadeOutMs || 420);

		if (autoDismissMs > 0) {
			box.__timer1 = (window.__uiSetTimeout || window.setTimeout)(() => {
				try {
					box.classList.add('fade-out');
					box.__timer2 = (window.__uiSetTimeout || window.setTimeout)(() => {
						try {
							box.style.display = 'none';
							box.classList.remove('fade-out');
							box.classList.remove('show');
							box.style.opacity = '1';
						} catch (_e) {}
						try { if (typeof options.onDismiss === 'function') options.onDismiss(); } catch (_e) {}
					}, fadeOutMs);
				} catch (_e) {}
			}, autoDismissMs);
		}
	} catch (e) {
		// Keep as warn (user requested visibility for debugging)
		console.warn('[BattleDockResultWindow] failed', e);
	}
};

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
} catch (e) {}



const battleCountSelect = document.getElementById("battleCountSelect");
const battleCountSelectB = document.getElementById("battleCountSelectB");

// 同期関数
function syncBattleCount(from, to) {
  if (!from || !to) return;
  to.value = from.value;
}

// A → B
battleCountSelect.addEventListener("change", () => {
  syncBattleCount(battleCountSelect, battleCountSelectB);
});

// B → A
battleCountSelectB.addEventListener("change", () => {
  syncBattleCount(battleCountSelectB, battleCountSelect);
});

// 初期状態も同期（念のため）
syncBattleCount(battleCountSelect, battleCountSelectB);





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
window.allowItemInterrupt = true; // ← 新規追加



/********************************
 * データ構造と初期設定
 ********************************/

// プレイヤーオブジェクトに特殊スキルリストを追加（存在しない場合のみ初期化）


// 特殊スキル生成関数
// 内包階層を再帰的に計算
function getMixedSkillDepth(skill) {
	if (!skill.isMixed || !Array.isArray(skill.baseSkills)) return 1;
	return 1 + Math.max(...skill.baseSkills.map(getMixedSkillDepth));
}

// 特殊スキル名を生成
function generateSkillName(activationProb, effectValue, config, kanaPart) {
	const activationPrefixes = [...Array(40)].map((_, i) => {
		const list = ["白く", "淡く", "儚く", "静かに", "柔らかく", "ほのかに", "静穏な", "風のように", "水面のように", "さざ波のように",
                  "鈍く", "灰色の", "くすんだ", "ぼんやりと", "霧のように", "薄暮の", "幻のように", "深く", "ゆるやかに", "澄んだ",
                  "赤黒く", "光り輝く", "燃え上がる", "熱を帯びた", "紅蓮の", "揺らめく", "照らすように", "きらめく", "煌く", "きつく",
                  "刺すように", "鋭く", "ひらめく", "咆哮する", "激しく", "電撃の", "鼓動する", "天を裂く", "神速の", "超越せし"];
		return list[i] || "未知の";
	});

	const effectValuePrefixes = [...Array(40)].map((_, i) => {
		const list = ["ささやく", "照らす", "包み込む", "揺らす", "引き寄せる", "誘う", "癒す", "染み込む", "憑依する", "導く",
                  "支配する", "増幅する", "研ぎ澄ます", "貫く", "解き放つ", "覚醒させる", "爆発する", "焼き尽くす", "断ち切る", "消し去る",
                  "裂く", "砕く", "覚醒する", "解放する", "粉砕する", "叫ぶ", "轟かせる", "駆け抜ける", "高鳴る", "躍動する",
                  "躍らせる", "爆ぜる", "瞬く", "砲撃する", "宇宙を裂く", "世界を断つ", "深淵を覗く", "魂を燃やす", "全てを覆う", "運命を導く"];
		return list[i] || "未知の力";
	});

	// 既存の streakBoost は「名前の語選びの見た目」にのみ適用する
	const streakBoost = Math.min(1.0, (window.maxStreak || 0) / 100) * 0.1;

	// --- 星判定に使う“素の”正規化値（※streakBoostは足さない） ---
	const rawActivationPct = Math.max(0, Math.min(1, (activationProb - 0.1) / 0.7));
	const rawEffectPct = Math.max(0, Math.min(1, (effectValue - config.min) / (config.max - config.min)));

	// --- 見た目用（接頭辞インデックス）のみ微ブーストを許容 ---
	const visActivation = Math.max(0, Math.min(1, rawActivationPct + streakBoost));
	const visEffect = Math.max(0, Math.min(1, rawEffectPct + streakBoost));

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
	const starFromEffect = percentileToStars(rawEffectPct);
	const starCount = Math.min(starFromActivation, starFromEffect); // 厳しめ評価（従来踏襲）

	const rarityClass = {
		5: "skill-rank-s",
		4: "skill-rank-a",
		3: "skill-rank-b",
		2: "skill-rank-c",
		1: "skill-rank-d"
	} [starCount];

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
					case 1:
						effectText = `敵の残りHPの<span style="color:#ff9999;">${baseVal}%</span>分の追加ダメージ（Lv補正後: ${scaledVal.toFixed(1)}%）`;
						break;
					case 2:
						effectText = `戦闘不能時にHP<span style="color:#99ccff;">${baseVal}%</span>で自動復活（Lv補正後: ${scaledVal.toFixed(1)}%）`;
						break;
					case 3:
						effectText = `継続ダメージ時に<span style="color:#aaffaa;">${baseVal}%</span>即時回復（Lv補正後: ${scaledVal.toFixed(1)}%）`;
						break;
					case 4:
						effectText = `攻撃力 <span style="color:#ffaa88;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`;
						break;
					case 5:
						effectText = `防御力 <span style="color:#88ddff;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`;
						break;
					case 6:
						effectText = `素早さ <span style="color:#ffee88;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`;
						break;
					case 7:
						effectText = `最大HP <span style="color:#d4ff88;">${baseVal}倍</span>（所持時バフ / Lv補正後: ${scaledVal.toFixed(2)}倍）`;
						break;
					default:
						effectText = `不明な効果 type=${eff.type}`;
						break;
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
		expMin = 0.2, // 連勝MAX時の指数（小さいほど上側に寄る）
			luckyBase = 0.02, // 連勝0でも超上振れする確率
			luckyGain = 0.015, // 連勝で増える超上振れ確率
			luckyFloor = 0.92 // 超上振れ時の下限（0.92〜1.00で再抽選）
	} = opts;

	// ラッキー枠：常に >0%
	const luckyP = Math.max(0, Math.min(1, luckyBase + luckyGain * s));
	if (Math.random() < luckyP) {
		return luckyFloor + (1 - luckyFloor) * Math.random();
	}

	// ベース分布：expは 1→一様、0.2→強く上寄り
	const exp = 1 - (1 - expMin) * s;
	const u = Math.random(); // U(0,1)
	return Math.pow(u, exp); // exp<1 で上に寄る
}

// 区間[min,max]に線形マッピング（整数化オプション）
function biasedInRange(min, max, s, asInteger = false, opts = {}) {
	const x = biased01ByStreak(s, opts); // 0..1（上寄り）
	const v = min + (max - min) * x;
	return asInteger ? Math.floor(v) : v;
}


// スキル生成本体
// ==== 低レア基調＋連勝でじわ上げ＋薄い神引き ====
// 既存の createMixedSkill と置き換えてください
function createMixedSkill(skillA, skillB) {
	const maxDepth = 5;
	const includeMixedSkillChance = 0.3; // 特殊スキルを内包する確率

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
			expLow0 = 2.8, // s=0 での指数（強く低めに寄る）
				expLow1 = 1.2, // s=1 での指数（ほぼ一様に近づく）
				luckyBase = 0.004, // 連勝0でも神引きする確率
				luckyGain = 0.012, // 連勝で神引き率が伸びる
				luckyFloor = 0.85 // 神引き時の下限（0.85〜1.0）
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
		alert("これ以上複雑な特殊スキルは作成できません（階層制限あり）");
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
			expLow0: 2.8,
			expLow1: 1.3, // 低値寄りの強さ
			luckyBase: 0.004,
			luckyGain: 0.012,
			luckyFloor: 0.85
		})
	);

	// 効果値：タイプごとのレンジ内で“低め”基調、神引きで上に跳ねる
	let effectValue;
	if (effectType <= 3) {
		// 1:残HP%ダメ／2:復活HP%／3:DoT時の即時回復%（整数）
		const v = lowSkewInRange(config.min, config.max, s, true, {
			expLow0: 2.6,
			expLow1: 1.3,
			luckyBase: 0.003,
			luckyGain: 0.010,
			luckyFloor: 0.85
		});
		effectValue = Math.max(config.min, Math.min(config.max, v));
	} else {
		// 4〜7: ATK/DEF/SPD/HP 倍率（小数1桁）
		const v = lowSkewInRange(config.min, config.max, s, false, {
			expLow0: 2.6,
			expLow1: 1.3,
			luckyBase: 0.003,
			luckyGain: 0.010,
			luckyFloor: 0.85
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

	return skill.isMixed ?
		Math.random() < mixedRate :
		Math.random() < baseRate;
}
//********************************/

//function shouldInclude(skill) {
//  return true; // すべてのスキル（特殊スキル含む）を必ず採用
//}

/********************************
 * スキル取得時の特殊スキル生成処理
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
				player.skills.push(newSkill); // 特殊スキル生成失敗時のみ
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
			player.skills.push(newSkill); // 特殊スキル生成失敗時のみ
		}
	}


	updateSkillOverlay;


}

// ※既存のスキル取得処理の最後で onSkillAcquired(newSkill) が呼ばれるように組み込んでください。



/********************************
 * 特殊スキル：レベル補正ユーティリティ
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
 * 特殊スキルの発動処理
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
		skill.specialEffectActive = skill.specialEffects?.some(e => [2, 3].includes(e.type));

		// スキル効果発動
		if (skill.isMixed && Array.isArray(skill.baseSkills)) {
			for (const base of skill.baseSkills) {
				applySkillRecursive(base); // 再帰呼び出し
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
				log.push(`※ エラー: 特殊スキル効果適用中に例外が発生しました (${e && e.message ? e.message : e})`);
			}
		}
	}

	applySkillRecursive(mixedSkill);
}



/********************************
 * 特殊スキル：効果一覧ポップアップ
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
	title.textContent = "特殊スキル：レベル補正つき効果一覧";
	title.style.fontWeight = "700";
	title.style.marginBottom = "8px";

	const body = document.createElement("div");
	const skills = (window.player && Array.isArray(window.player.skills)) ? window.player.skills.filter(s => s && s.isMixed) : [];
	if (!skills.length) {
		body.textContent = "特殊スキルがありません。";
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

		// 特殊効果（特殊スキルのみ）
		if (skill.isMixed && Array.isArray(skill.specialEffects)) {
			for (const eff of skill.specialEffects) {
				switch (eff.type) {
					case 1:
						detailText += `${indent}▶ 特殊効果: 敵の残りHPの${eff.value}%分の追加ダメージ\n`;
						break;
					case 2:
						detailText += `${indent}▶ 特殊効果: 戦闘不能時にHP${eff.value}%で自動復活\n`;
						break;
					case 3:
						detailText += `${indent}▶ 特殊効果: 継続ダメージ時に${eff.value}%即時回復\n`;
						break;
					case 4:
						detailText += `${indent}▶ 特殊効果: 攻撃力 ${eff.value}倍（所持時バフ）\n`;
						break;
					case 5:
						detailText += `${indent}▶ 特殊効果: 防御力 ${eff.value}倍（所持時バフ）\n`;
						break;
					case 6:
						detailText += `${indent}▶ 特殊効果: 素早さ ${eff.value}倍（所持時バフ）\n`;
						break;
					case 7:
						detailText += `${indent}▶ 特殊効果: 最大HP ${eff.value}倍（所持時バフ）\n`;
						break;
					default:
						detailText += `${indent}▶ 特殊効果: 不明な効果 type=${eff.type}\n`;
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

	window.__uiSetTimeout(() => {
		if (popup.parentNode) {
			popup.style.opacity = "0";
			window.__uiSetTimeout(() => popup.remove(), 300);
		}
	}, 4000);
}

// 戦闘開始時に特殊スキル使用状態をリセットする関数（各戦闘の最初に呼び出す）
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
// （特殊スキルの特殊効果は戦闘ごとの効果のため、戦闘終了時や次の戦闘開始時にリセットします）




function update魔通貨Display() {
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
	ball.classList.add(rarity); // ← レアリティに応じたクラス追加！

	body.appendChild(knob);
	container.appendChild(body);
	container.appendChild(ball);
	document.body.appendChild(container);

	window.__battleSetTimeout(() => {
		container.remove();
	}, 2000);
}



// =====================================================
// 魔メイク（Face）: 成長率ボーナス/ドロップ倍率/保護数ボーナス
//  - faceItemsOwned は「画像パス文字列」のまま保持
//  - ボーナスは faceItemBonusMap[path] に保持し、セーブにも含める
// =====================================================
window.faceItemBonusMap = window.faceItemBonusMap || {}; // { [path]: { rarity, growthRates, dropRateMultiplier, protectSkillAdd, protectItemAdd } }

function __getRarityFromFacePath(path) {
	// expected: face/<RARITY>/<filename>
	try {
		const m = String(path || '').match(/face\/(S|A|B|C|D)\//);
		return (m && m[1]) ? m[1] : 'D';
	} catch (e) { return 'D'; }
}

function __randSigned(amount) {
	// amount: e.g. 0.05 => 1±0.05
	const sign = (Math.random() < 0.5) ? -1 : 1;
	return 1 + sign * (Math.random() * amount);
}

function __genGrowthRatesByRarity(rarity) {
	// レアほど「最低値」も「期待値」も高い、完全片側分布
	// すべて 1.000 以上を保証
	const cfg = {
		D: { min: 0.02, max: 0.1 },  // 1.02〜1.06
		C: { min: 0.08, max: 0.25 },  // 1.06〜1.12
		B: { min: 0.2, max: 0.4 },  // 1.10〜1.18
		A: { min: 0.3, max: 0.7 },  // 1.16〜1.70
		S: { min: 0.5, max: 0.99 },  // 1.24〜1.99
	}[rarity] || { min: 0.02, max: 0.06 };

	// 高めに寄るように軽くバイアス
	const roll = () => {
		const r = Math.pow(Math.random(), 0.85); // <1 で高め寄り
		return Number((1 + cfg.min + r * (cfg.max - cfg.min)).toFixed(3));
	};

	return {
		attack:  roll(),
		defense: roll(),
		speed:   roll(),
		maxHp:   roll(),
	};
}

function __maybeExtraDropMultiplier(rarity) {
	// 1.0〜1.5 未満、低い倍率がつきやすい（r^3で偏らせる）
	// ★全体的に付与確率アップ（D/Cも現実的に出る）
	const p = { D: 0.006, C: 0.015, B: 0.030, A: 0.060, S: 0.120 }[rarity] ?? 0.006;

	if (Math.random() >= p) return 1;

	const v = 1 + Math.pow(Math.random(), 3) * 0.49; // <= 1.49（低め寄りは維持）
	return Number(v.toFixed(3));
}

function __maybeProtectAdds(rarity) {
	// ★全体的に付与確率アップ（低ランク救済）
	// 例：Dでも0.8%→2.0%くらいで現実的に出る
	const baseP = { D: 0.020, C: 0.045, B: 0.080, A: 0.140, S: 0.220 }[rarity] ?? 0.020;

	const rollAdd = () => {
		if (Math.random() >= baseP) return 0;
		// +2 は「超稀」のまま。ただし少し出やすくしたいなら 0.12→0.15 など
		return (Math.random() < 0.12) ? 2 : 1;
	};

	return {
		protectSkillAdd: rollAdd(),
		protectItemAdd: rollAdd()
	};
}


function __ensureFaceBonus(path) {
	if (!path) return null;
	if (window.faceItemBonusMap && window.faceItemBonusMap[path]) return window.faceItemBonusMap[path];
	const rarity = __getRarityFromFacePath(path);
	const growthRates = __genGrowthRatesByRarity(rarity); // ★ 100% 付与
	const dropRateMultiplier = __maybeExtraDropMultiplier(rarity);
	const { protectSkillAdd, protectItemAdd } = __maybeProtectAdds(rarity);

	const obj = { rarity, growthRates, dropRateMultiplier, protectSkillAdd, protectItemAdd };
	window.faceItemBonusMap[path] = obj;
	return obj;
}

function __getEquippedFaceBonus() {
	if (!window.faceItemEquipped) return null;
	return __ensureFaceBonus(window.faceItemEquipped);
}


// ================================
// 保護枠（特殊スキル/アイテム）の上限計算
//  - デフォルトは「特殊スキル: 1」「魔道具: 3」
//  - 魔メイクの詳細効果（protectSkillAdd / protectItemAdd）が付与されていれば上限を増やす
// ================================
window.getSpecialSkillProtectLimit = function getSpecialSkillProtectLimit() {
	const base = 1;
	let add = 0;
	try {
		const bonus = (typeof __getEquippedFaceBonus === 'function') ? __getEquippedFaceBonus() : null;
		if (bonus && typeof bonus.protectSkillAdd === 'number') add = bonus.protectSkillAdd;
	} catch (e) {}
	const v = base + add;
	return (v >= 1) ? v : 1;
};

window.getItemProtectLimit = function getItemProtectLimit() {
	const base = 3;
	let add = 0;
	try {
		const bonus = (typeof __getEquippedFaceBonus === 'function') ? __getEquippedFaceBonus() : null;
		if (bonus && typeof bonus.protectItemAdd === 'number') add = bonus.protectItemAdd;
	} catch (e) {}
	const v = base + add;
	return (v >= 0) ? v : 0;
};

// 詳細描画（updateFaceUI から呼ばれる）
window.renderMagicMakeDetails = function renderMagicMakeDetails(path, panel) {
	try {
		if (!panel) return;
		panel.innerHTML = '';
		const bonus = __ensureFaceBonus(path);
		if (!bonus) { panel.textContent = 'この魔メイクには詳細効果がありません。'; return; }

		const wrap = document.createElement('div');
		wrap.className = 'magicmake-detail-wrap';

		const canvas = document.createElement('canvas');
		canvas.width = 92; canvas.height = 92;
		canvas.className = 'magicmake-radar';
		wrap.appendChild(canvas);

		const stats = document.createElement('div');
		stats.className = 'magicmake-detail-stats';

		const gr = bonus.growthRates || {};
		const rows = [
			['ATK', Number(gr.attack) || 1],
			['DEF', Number(gr.defense) || 1],
			['SPD', Number(gr.speed) || 1],
			['HP',  Number(gr.maxHp) || 1],
		];

		rows.forEach(([label, v]) => {
			const row = document.createElement('div');
			row.className = 'magicmake-detail-row ' + (v >= 1 ? 'up' : 'down');
			row.textContent = `${label} ×${v.toFixed(2)}`;
			stats.appendChild(row);
		});

		// drop bonus
		if (bonus.dropRateMultiplier && Number(bonus.dropRateMultiplier) > 1) {
			const sep = document.createElement('div');
			sep.className = 'magicmake-detail-sep';
			stats.appendChild(sep);

			const row = document.createElement('div');
			row.className = 'magicmake-detail-row up';
			row.textContent = `ドロップ率 ×${Number(bonus.dropRateMultiplier).toFixed(2)}`;
			stats.appendChild(row);
		}

		// protect bonuses
		if ((bonus.protectSkillAdd && bonus.protectSkillAdd > 0) || (bonus.protectItemAdd && bonus.protectItemAdd > 0)) {
			const sep = document.createElement('div');
			sep.className = 'magicmake-detail-sep';
			stats.appendChild(sep);

			if (bonus.protectSkillAdd > 0) {
				const row = document.createElement('div');
				row.className = 'magicmake-detail-row up';
				row.textContent = `特殊スキル保護 +${bonus.protectSkillAdd}`;
				stats.appendChild(row);
			}
			if (bonus.protectItemAdd > 0) {
				const row = document.createElement('div');
				row.className = 'magicmake-detail-row up';
				row.textContent = `アイテム保護 +${bonus.protectItemAdd}`;
				stats.appendChild(row);
			}
		}

		wrap.appendChild(stats);
		panel.appendChild(wrap);

		__drawMagicMakeRadar(canvas, rows.map(r => r[1]));
	} catch (e) {
		try { console.error(e); } catch(_) {}
		if (panel) panel.textContent = '詳細の描画に失敗しました。';
	}
};

function __drawMagicMakeRadar(canvas, values) {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const w = canvas.width, h = canvas.height;
	ctx.clearRect(0, 0, w, h);

	// === 表示スケール設定 ===
	const MIN = 0.5;   // 表示下限
	const MAX = 2.0;   // 表示上限
	const CENTER = 1.0;

	const clamp = (v) =>
		Math.max(MIN, Math.min(MAX, Number(v) || CENTER));

	const vals = (Array.isArray(values) ? values : [1, 1, 1, 1]).map(clamp);

	const cx = w / 2, cy = h / 2;
	const r = Math.min(w, h) * 0.40;

	// === ガイド円（1.0 を中心に見せる）===
	ctx.strokeStyle = 'rgba(255,255,255,0.12)';
	ctx.lineWidth = 1;

	[0.5, 1.0, 1.5, 2.0].forEach(v => {
		const rr = r * ((v - MIN) / (MAX - MIN));
		ctx.beginPath();
		ctx.arc(cx, cy, rr, 0, Math.PI * 2);
		ctx.stroke();
	});

	// === 軸 ===
	ctx.strokeStyle = 'rgba(255,255,255,0.10)';
	for (let i = 0; i < 4; i++) {
		const a = -Math.PI / 2 + i * (Math.PI / 2);
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(
			cx + Math.cos(a) * r,
			cy + Math.sin(a) * r
		);
		ctx.stroke();
	}

	// === ポリゴン ===
	ctx.strokeStyle = 'rgba(0,255,255,0.85)';
	ctx.fillStyle = 'rgba(0,255,255,0.22)';
	ctx.lineWidth = 1.4;

	ctx.beginPath();
	for (let i = 0; i < 4; i++) {
		const a = -Math.PI / 2 + i * (Math.PI / 2);
		const norm = (vals[i] - MIN) / (MAX - MIN);
		const rr = r * norm;
		const x = cx + Math.cos(a) * rr;
		const y = cy + Math.sin(a) * rr;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

function performFaceGacha() {
	if (faceCoins < FACE_GACHA_COST) {
		alert(`魔通貨が${FACE_GACHA_COST}枚必要です！現在の魔通貨：${faceCoins}`);
		return;
	}

	if (faceItemsOwned.length >= 100) {
		alert("所持魔メイクが上限に達しています。");
		return;
	}

	// 魔通貨消費
	faceCoins -= FACE_GACHA_COST;
	update魔通貨Display();

	// --- 動的に補正された確率でランク抽選 ---
	const baseProbs = {
	  S: 0.0012,  // +0.0002（ほぼ誤差レベルだが夢がある）
	  A: 0.0048,  // +0.0008
	  B: 0.055,   // +0.010
	  C: 0.06,    // +0.010
	  D: 0.879    // -0.021
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

	// 魔メイク演出
	showGachaAnimation(selectedRarity);

	window.__battleSetTimeout(() => {
		const result = drawRandomFace(selectedRarity);
		if (!result) {
			alert(`${selectedRarity}ランクの魔メイクが読み込めませんでした`);
			return;
		}

		const { path, name } = result;
		faceItemsOwned.push(path);
		__ensureFaceBonus(path);
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

	// clear previous timers to avoid stuck subtitle
	try {
		if (subtitleEl.__subtitleTimer1) {
			window.__uiClearTimeout(subtitleEl.__subtitleTimer1);
			subtitleEl.__subtitleTimer1 = null;
		}
		if (subtitleEl.__subtitleTimer2) {
			window.__uiClearTimeout(subtitleEl.__subtitleTimer2);
			subtitleEl.__subtitleTimer2 = null;
		}
	} catch (e) {}

	// フェードアウト（duration 後）
	window.__uiSetTimeout(() => {
		subtitleEl.style.opacity = '0';
		// 完全に消えた後に display を none に戻す
		window.__uiSetTimeout(() => {
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
	　

	itemBtn.onclick = () => {
		window.allowItemInterrupt = !window.allowItemInterrupt;
		updateButtonState(itemBtn, window.allowItemInterrupt, "魔道具入手: 進行を停止する", "魔道具入手: 進行を停止しない");
	};


	if (autoSaveBtn) {
		autoSaveBtn.onclick = () => {
			window.autoSaveEnabled = !window.autoSaveEnabled;
			updateButtonState(autoSaveBtn, window.autoSaveEnabled, "自動保存: ON（10戦ごと）", "自動保存: OFF（10戦ごと）");
		};
	}

	updateButtonState(growthBtn, window.allowGrowthEvent, "成長イベント: 発生", "成長イベント: 発生しない");

	updateButtonState(itemBtn, window.allowItemInterrupt, "魔道具入手: 進行を停止する", "魔道具入手: 進行を停止しない");
	if (autoSaveBtn) {
		updateButtonState(autoSaveBtn, window.autoSaveEnabled, "自動保存: ON（10戦ごと）", "自動保存: OFF（10戦ごと）");
	}
}

function cleanUpAllMixedSkills() {
	if (!player || !Array.isArray(player.mixedSkills)) return;

	// ✅ null や undefined を除去してから処理開始
	player.mixedSkills = player.mixedSkills.filter(skill => skill && typeof skill === 'object');

	// 保護されていない特殊スキルのみを削除対象にする
	const toRemove = player.mixedSkills.filter(skill => !skill.isProtected);

	// mixedSkills 配列から削除
	player.mixedSkills = player.mixedSkills.filter(skill => skill.isProtected);

	// player.skills 配列から、削除対象の特殊スキルを除去
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
	label.textContent = "特殊スキルを保護：";
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

	// ランダムに1つ残す特殊スキルを選択
	const skillToKeep = player.mixedSkills[Math.floor(Math.random() * player.mixedSkills.length)];

	// 特殊スキル以外を削除（player.mixedSkills）
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

