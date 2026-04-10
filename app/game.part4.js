'use strict';
window.showGrowthAutoBar = function(message) {
	// 旧「左上バー（growthbar）」UIは廃止。
	// 自動成長の通知だけ、短い中央ポップアップで出す。
	const msg = message || '自動で成長を選択しました';
	if (typeof showCenteredPopup === 'function') {
		showCenteredPopup(`成長（自動）<br>${msg}`, 900);
	}
};;


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

window.eventTriggered = false; // イベント発生フラグを初期化

// ============================================================================
// スキル交換（2→1）
// - ボタン（魔通貨500枚）で手動実行できる
// - ランダムイベントとしても発生（確率は「スキル習得」より少し低い）
// - 特殊スキルは必ず除外
// - 削除対象は「いま所持しているスキル以外」からのみ
// ============================================================================

// 調整ポイント：最低メモリー数 / コスト / 乱数イベント倍率
window.__SKILL_EXCHANGE_MIN_MEMORY = window.__SKILL_EXCHANGE_MIN_MEMORY || 5;
window.__SKILL_EXCHANGE_COST = window.__SKILL_EXCHANGE_COST || 500;
window.__SKILL_EXCHANGE_RANDOM_RATE_MUL = window.__SKILL_EXCHANGE_RANDOM_RATE_MUL || 0.85;

// Resolve current player reference safely.
// In this project, `player` may exist as a script-scope variable (not attached to window).
function __getPlayerRef() {
	try {
		if (window.__activePlayerRef && typeof window.__activePlayerRef === 'object') return window.__activePlayerRef;
	} catch (e) {}
	try {
		// eslint-disable-next-line no-undef
		if (typeof player !== 'undefined' && player && typeof player === 'object') return player;
	} catch (e) {}
	try {
		if (window.player && typeof window.player === 'object') return window.player;
	} catch (e) {}
	return null;
}

function __isMixedSkillName(name) {
	try {
		const n = String(name || '');
		if (!n) return true;
		const p = __getPlayerRef();
		// player.mixedSkills に名前が存在する
		if (p && Array.isArray(p.mixedSkills)) {
			if (p.mixedSkills.some(ms => ms && ms.isMixed && ms.name === n)) return true;
		}
		// player.skills 側の isMixed フラグ
		if (p && Array.isArray(p.skills)) {
			const sk = p.skills.find(s => s && s.name === n);
			if (sk && sk.isMixed) return true;
		}
		// skillPool の category
		if (Array.isArray(window.skillPool)) {
			const def = window.skillPool.find(s => s && s.name === n);
			if (def && def.category === 'mixed') return true;
		}
	} catch (e) {}
	return false;
}

function __computeSkillGainChanceLikeAcquire() {
	try {
		// 既存の「新スキル習得」ロジックと同等（enemy.rarity と currentStreak を参照）
		const e = window.enemy;
		const streak = (typeof window.currentStreak === 'number') ? window.currentStreak : 0;
		const r = (e && typeof e.rarity === 'number') ? e.rarity : 0;
		const rarity = r * (0.02 + streak * 0.002);
		let skillGainChance = Math.min(1.0, 0.01 * rarity);
		if (window.specialMode === 'brutal') {
			skillGainChance = 0.005;
		}
		return Math.max(0, Math.min(1, skillGainChance));
	} catch (e) {
		return 0;
	}
}

function __pickRandomDistinct(arr, count) {
	const a = Array.isArray(arr) ? arr.slice() : [];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = a[i];
		a[i] = a[j];
		a[j] = tmp;
	}
	return a.slice(0, Math.max(0, count));
}

function __computeSkillExchangePools() {
	const p = __getPlayerRef();
	if (!p || !p.skillMemory || !p.skills) {
		return { ok: false, reason: 'プレイヤーデータが未初期化です' };
	}
	const minMem = Number(window.__SKILL_EXCHANGE_MIN_MEMORY || 5);
	const memoryNames = Object.keys(p.skillMemory || {}).filter(n => n && !__isMixedSkillName(n));
	if (memoryNames.length < minMem) {
		return { ok: false, reason: `通常スキルのメモリーが${minMem}個以上必要です` };
	}
	const ownedSet = new Set((p.skills || []).map(s => s && s.name).filter(Boolean));
	let removable = memoryNames.filter(n => !ownedSet.has(n));
	if (window.initialAndSlotSkills && Array.isArray(window.initialAndSlotSkills)) {
		removable = removable.filter(n => !window.initialAndSlotSkills.includes(n));
	}
	if (removable.length < 2) {
		return { ok: false, reason: '所持中以外の削除候補が2つ以上必要です' };
	}
	let unlearned = [];
	if (Array.isArray(window.skillPool)) {
		unlearned = window.skillPool
			.filter(s => s && s.name && !__isMixedSkillName(s.name))
			.map(s => s.name)
			.filter(n => !p.skillMemory[n]);
	}
	if (unlearned.length === 0) {
		return { ok: false, reason: '未修得の通常スキルがありません' };
	}
	return { ok: true, memoryNames, removable, unlearned };
}

function __applySkillExchange(toDelete, gainName) {
	const p = __getPlayerRef();
	if (!p || !p.skillMemory || !p.skills) return;
	// 2つを skillMemory から完全削除（Lvも初期化扱い）
	for (const n of (toDelete || [])) {
		try { delete p.skillMemory[n]; } catch (e) {}
	}
	// 新スキルを獲得（未修得扱い → Lv1）
	p.skillMemory[gainName] = 1;
	try {
		p.skills.push({ name: gainName, level: 1, uses: 0 });
	} catch (e) {}

	try {
		const def = (Array.isArray(window.skillPool) ? window.skillPool.find(s => s && s.name === gainName) : null);
		if (def && typeof window.onSkillAcquired === 'function') window.onSkillAcquired(def);
	} catch (e) {}

	try { if (typeof drawSkillMemoryList === 'function') drawSkillMemoryList(); } catch (e) {}
	try { syncSkillsUI && syncSkillsUI(); } catch (e) {}
	try { updateStats && updateStats(); } catch (e) {}
}

function __showSkillExchangeConfirmUI(opts) {
	const pools = __computeSkillExchangePools();
	if (!pools.ok) {
		try { showCustomAlert(pools.reason, 2200); } catch (e) {}
		return false;
	}

	// 事前に候補を決めて、選択後も同じ内容で処理する（途中で変わらないように）
	const toDelete = __pickRandomDistinct(pools.removable, 2);
	const gainName = pools.unlearned[Math.floor(Math.random() * pools.unlearned.length)];

	const isPaid = !!opts?.paid;
	const cost = Number(window.__SKILL_EXCHANGE_COST || 500);
	const title = isPaid ? 'スキル交換（2→1）' : 'スキル交換';
	const labelDo = isPaid ? `交換する（魔通貨${cost}枚）` : 'スキル 2 → 1 交換する';

	const descLines = [
		'',
`削除: ${toDelete.join(' / ')}` + '\n\n' +
`獲得: ${gainName} (Lv1)`
	];

	showEventOptions(title, [
		{ label: labelDo, value: 'do' },
		{ label: 'やめる', value: 'none' }
	], (choice) => {
		try {
			if (choice !== 'do') {
				try { showCustomAlert('今回はスキル交換しませんでした', 1800); } catch (e) {}
				return;
			}

			// 支払い（ボタン実行のみ）
			if (isPaid) {
				const coins = Number(window.faceCoins || 0);
				if (coins < cost) {
					try { showCustomAlert(`魔通貨が${cost}枚必要です（現在: ${coins}枚）`, 2400); } catch (e) {}
					return;
				}
				window.faceCoins = coins - cost;
				try { update魔通貨Display && update魔通貨Display(); } catch (e) {}
			}

			__applySkillExchange(toDelete, gainName);
			try { showCustomAlert(descLines.join('\n'), 3200); } catch (e) {}
		} finally {
			// ボタン/ランダムどちらでも、選択後は次の操作ができるようフラグを戻す
			try { window.eventTriggered = false; } catch (e) {}
			try { clearEventPopup(false); } catch (e) {}
		}
	});

	return true;
}

function __maybeTriggerSkillExchangeEventRandom() {
	// NOTE:
	// スキル2→1交換は、HPチャート下のボタン（openSkillExchange）からのみ発生させる。
	// ランダム発生はユーザー要望により無効化。
	return false;
	/*
	try {
		if (window.eventTriggered) return false;
		if (!window.allowSkillDeleteEvent) return false; // 「スキルイベント」トグルで一括ON/OFF

		const pools = __computeSkillExchangePools();
		if (!pools.ok) return false;

		const baseChance = __computeSkillGainChanceLikeAcquire();
		const mul = Number(window.__SKILL_EXCHANGE_RANDOM_RATE_MUL || 0.85);
		const exchangeChance = Math.max(0, Math.min(1, baseChance * mul));
		if (!(Math.random() < exchangeChance)) return false;

		window.eventTriggered = true;
		try { stopAutoBattle && stopAutoBattle(); } catch (e) {}
		return __showSkillExchangeConfirmUI({ paid: false });
	} catch (e) {
		return false;
	}
	*/
}

// ボタンからの手動実行（魔通貨消費）
window.openSkillExchange = function() {
	try {
		try { if (typeof window.__ensureActivePlayerRefOnce === 'function') window.__ensureActivePlayerRefOnce(); } catch (e) {}
		const p0 = __getPlayerRef();
		if (!p0 || !p0.skillMemory || !p0.skills) {
			try { showCustomAlert('ゲーム開始後に使用できます', 2200); } catch (e) {}
			try { window.eventTriggered = false; } catch (_) {}
			return;
		}
		// オートバトル中は誤爆しやすいので止める（手動押下は可能だが、UIの衝突を避ける）
		try { stopAutoBattle && stopAutoBattle(); } catch (e) {}
		// 他イベント表示中は二重起動しない
		if (window.eventTriggered) {
			try { showCustomAlert('イベント表示中です', 1500); } catch (e) {}
			return;
		}
		window.eventTriggered = true;
		const ok = __showSkillExchangeConfirmUI({ paid: true });
		if (!ok) window.eventTriggered = false;
	} catch (e) {
		try { window.eventTriggered = false; } catch (_) {}
	}
};

// 【バトル後にイベント発生を判定して処理する】
window.maybeTriggerEvent = function() {
	if (window.eventTriggered) return;
	if (!window.allowSkillDeleteEvent) return;

	// スキル交換イベントはランダム発生させない（ボタンからのみ）

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


function formatBattleItemSummaryHtml(holder, options = {}) {
	const items = (holder && Array.isArray(holder.itemMemory)) ? holder.itemMemory : [];
	const maxRows = Math.max(1, Number(options.maxRows || 0) || 0);
	const visibleItems = maxRows > 0 ? items.slice(0, maxRows) : items.slice();
	if (!visibleItems.length) {
		return `<div class="battle-item-summary empty">${options.emptyLabel || 'なし'}</div>`;
	}
	const rows = visibleItems.map(item => {
		const name = `${item.color || ''}${item.adjective || ''}${item.noun || ''}`;
		const protectedTag = item.protected ? '<span class="battle-item-tag is-protected">保護</span>' : '';
		return `<div class="battle-item-row"><span class="battle-item-name">${name}</span><span class="battle-item-meta">${item.skillName || '-'} Lv${Math.max(1, Number(item.skillLevel || 1) || 1)}</span>${protectedTag}</div>`;
	}).join('');
	const remain = (maxRows > 0 && items.length > visibleItems.length)
		? `<div class="battle-item-summary-more">ほか ${items.length - visibleItems.length} 個</div>`
		: '';
	return `<div class="battle-item-summary">${rows}${remain}</div>`;
}

function drawItemMemoryList() {
	const list = document.getElementById('itemMemoryList');
	if (!list) return;
	list.innerHTML = '';
	try { if (typeof window.updateProtectionLimitHints === 'function') window.updateProtectionLimitHints(); } catch (e) {}
	player.itemMemory.forEach((item, idx) => {
		const li = document.createElement('li');
		const name = `${item.color}${item.adjective}${item.noun}`;
		li.textContent = `${name}（${item.skillName}） Lv.${item.skillLevel}`;

		li.className = ""; // リセット

		if (item.protected) {
			li.classList.add("item-protected");
		}
		li.onclick = (e) => onItemClick(item, idx, e);
		list.appendChild(li);
	});
}

window.drawHPGraph = function() {
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
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
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
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
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
	let container = document.getElementById('customAlertContainer');
	// If missing for any reason, create it (more robust on different pages/states).
	if (!container) {
		try {
			container = document.createElement('div');
			container.id = 'customAlertContainer';
			document.body.appendChild(container);
		} catch (e) {
			container = null;
		}
	}

	if (container) {
		// Make container cover the visible viewport so we can place alerts at the center reliably.
		container.style.display = 'block';
		container.style.position = 'fixed';
		container.style.top = '0';
		container.style.left = '0';
		container.style.width = '100%';
		container.style.height = '100%';
		container.style.transform = 'none';
		// IMPORTANT: keep the container itself visually transparent.
		// (Some themes apply backdrop-filter/background to #customAlertContainer,
		//  and because this container covers the whole viewport it can blur/dim everything.)
		container.style.background = 'transparent';
		container.style.border = 'none';
		container.style.boxShadow = 'none';
		container.style.filter = 'none';
		container.style.backdropFilter = 'none';
		container.style.webkitBackdropFilter = 'none';
		container.style.pointerEvents = 'none';
		container.style.zIndex = '9999';
	}

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
	alert.style.position = 'fixed';
	// Place at visible viewport center (iPhone Safari friendly)
	try {
		const vv = window.visualViewport;
		if (vv && typeof vv.width === 'number' && typeof vv.height === 'number') {
			const cx = (vv.offsetLeft || 0) + (vv.width / 2);
			const cy = (vv.offsetTop || 0) + (vv.height / 2);
			alert.style.left = cx + 'px';
			alert.style.top = cy + 'px';
		} else {
			alert.style.left = '50%';
			alert.style.top = '50%';
		}
	} catch (e) {
		alert.style.left = '50%';
		alert.style.top = '50%';
	}
	alert.style.transform = 'translate(-50%, -50%)';
	alert.style.pointerEvents = 'auto';
	alert.style.minWidth = '200px';
	alert.style.maxWidth = '80vw';
	alert.style.textAlign = 'center';
	alert.style.zIndex = '10000';

	alert.innerHTML = message;

	if (container) {
		container.appendChild(alert);
	} else {
		try { document.body.appendChild(alert); } catch (e) {}
	}

	// フェードイン
	window.__uiSetTimeout(() => {
		alert.style.opacity = '1';
	}, 10);

	// フェードアウト＆削除
	window.__uiSetTimeout(() => {
		alert.style.opacity = '0';
		window.__uiSetTimeout(() => {
			try{
				if (alert.parentElement) {
					try {
						if (container && alert.parentElement === container) container.removeChild(alert);
						else alert.parentElement.removeChild(alert);
					} catch (e) {}
				}
				if (container && container.children.length === 0) {
					container.style.display = 'none';
				}
			}catch(e){}
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
window.populateItemElementList = function() {
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
		const uses = (typeof c.usesPerBattle === 'number' || c.usesPerBattle === Infinity) ?
			formatValue(c.usesPerBattle, 10, '回') :
			'（未定義）';
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

// =====================================================
// 遊び方：スキル効果/パラメータ一覧（skills.js から自動生成）
// =====================================================
(function() {
	// 既に定義済みなら二重定義しない（セーブデータロード等で再評価しても安全）
	if (window.populateSkillGuideLists) return;

	const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	} [c]));

	const catLabel = (cat) => {
		const map = {
			damage: '攻撃',
			multi: '連撃',
			lifesteal: '吸収',
			poison: '毒',
			burn: '火傷',
			heal: '回復',
			regen: '再生',
			buff: '強化',
			debuff: '弱体',
			barrier: 'バリア',
			endure: '不死',
			counter: '反撃',
			reflect: '反射',
			stun: 'スタン',
			evasion: '回避',
			skillSeal: '封印',
			steal: '奪取',
			bomb: '時限爆弾',
			maxHpDown: '最大HP減',
			sacrifice: '自傷',
			berserk: '狂化',
			block: '防御姿勢',
			gap: '格差',
			random: 'ランダム',
			passive: 'パッシブ',
			itemReuse: '魔道具再利用',
			purifyCounter: '浄化反撃'
		};
		return map[cat] || cat || '（不明）';
	};

	const mainParams = (sk) => {
		// よく使う/理解に効くパラメータだけを抽出（未定義は出さない）
		const keys = [
      'multiplier', 'power', 'amount', 'duration',
      'baseHits', 'extraHits', 'extraHitsTriggerLevel',
      'activationRate', 'criticalRateMax',
      'stunChance', 'evasionChance', 'sealChance', 'sealCount',
      'counterPercent', 'reflectPercent', 'stealRatio',
      'reduction', 'ignoreDefense', 'factor', 'stat'
    ];
		const out = [];
		for (const k of keys) {
			if (sk[k] === undefined) continue;
			out.push([k, sk[k]]);
		}
		// 補助: atkFactorBase/Max があるものはセットで表示
		if (sk.atkFactorBase !== undefined || sk.atkFactorMax !== undefined) {
			out.push(['atkFactor', `${sk.atkFactorBase ?? '—'}〜${sk.atkFactorMax ?? '—'}`]);
		}
		// targetStats 等は配列なので見やすく
		if (Array.isArray(sk.targetStats) && sk.targetStats.length) {
			out.push(['targetStats', sk.targetStats.join(',')]);
		}
		if (sk.priority !== undefined) out.push(['priority', sk.priority]);
		return out;
	};

	const effectSummary = (sk) => {
		const c = sk.category;
		if (c === 'damage') {
			const mul = sk.multiplier ?? sk.power ?? '—';
			const ig = sk.ignoreDefense ? `（防御無視 ${Math.round(sk.ignoreDefense*100)}%）` : '';
			return `ATK×${mul} を基準にダメージ${ig}`;
		}
		if (c === 'multi') {
			const base = sk.baseHits ?? 1;
			const extra = sk.extraHits ? ` +${sk.extraHits}（Lv${sk.extraHitsTriggerLevel ?? '?'}〜）` : '';
			return `攻撃を ${base}回${extra} 行う`;
		}
		if (c === 'lifesteal') {
			const ratio = sk.stealRatio ?? sk.factor ?? '—';
			return `与ダメージの一部（${ratio}）を回復`;
		}
		if (c === 'poison' || c === 'burn' || c === 'regen') {
			const p = (window.__activePlayerRef || window.player || (sk.power ?? sk.amount ?? sk.multiplier ?? '—'));
			const d = sk.duration ?? '—';
			const label = (c === 'regen') ? '回復' : '継続ダメージ';
			return `${d}ターン ${label}（基準値 ${p}）`;
		}
		if (c === 'heal') {
			const a = sk.amount ?? sk.power ?? sk.multiplier ?? '—';
			return `回復（基準値 ${a}）`;
		}
		if (c === 'buff' || c === 'debuff') {
			const stat = sk.stat || (Array.isArray(sk.targetStats) ? sk.targetStats.join(',') : '—');
			const mul = sk.multiplier ?? sk.factor ?? '—';
			const d = sk.duration ? `${sk.duration}T` : '';
			return `${stat} に倍率 ${mul} ${d}`.trim();
		}
		if (c === 'barrier') {
			const red = sk.reduction ?? '—';
			const d = sk.duration ? `${sk.duration}T` : '';
			return `被ダメ軽減 ${red} ${d}`.trim();
		}
		if (c === 'endure') {
			return '致死ダメージを耐える（クールダウンあり）';
		}
		if (c === 'stun') {
			const ch = sk.stunChance ?? '—';
			return `確率 ${ch} で行動不能`;
		}
		if (c === 'evasion') {
			const ch = sk.evasionChance ?? '—';
			const d = sk.duration ? `${sk.duration}T` : '';
			return `回避率 ${ch} ${d}`.trim();
		}
		if (c === 'skillSeal') {
			const ch = sk.sealChance ?? '—';
			const cnt = sk.sealCount ?? '—';
			return `確率 ${ch} でスキルを ${cnt}個 封印`;
		}
		if (c === 'counter') {
			const p = sk.counterPercent ?? '—';
			return `被ダメの ${p}% を反撃`;
		}
		if (c === 'reflect') {
			const p = sk.reflectPercent ?? '—';
			return `与えたダメージの ${p}% を反射`;
		}
		if (c === 'bomb') {
			const d = sk.duration ?? '—';
			const p = sk.power ?? sk.multiplier ?? '—';
			return `${d}T 後に追加ダメージ（基準値 ${p}）`;
		}
		return '（詳細はパラメータ一覧参照）';
	};

	window.populateSkillGuideLists = function() {
		const effectEl = document.getElementById('skillEffectList');
		const valueEl = document.getElementById('skillValueList');
		if (!effectEl && !valueEl) return;

		// skillPool が未ロード/未定義の可能性に備える
		if (!Array.isArray(skillPool)) {
			if (effectEl) effectEl.innerHTML = '<div class="subnote">※skills.js の読み込みに失敗しました。</div>';
			if (valueEl) valueEl.innerHTML = '<div class="subnote">※skills.js の読み込みに失敗しました。</div>';
			return;
		}

		const skillsSorted = skillPool.slice().sort((a, b) => {
			const ca = catLabel(a.category);
			const cb = catLabel(b.category);
			if (ca !== cb) return ca.localeCompare(cb, 'ja');
			return String(a.name || '').localeCompare(String(b.name || ''), 'ja');
		});

		if (effectEl) {
			let html = '<table class="guide-table"><thead><tr>' +
				'<th style="width: 26%;">スキル名</th>' +
				'<th style="width: 12%;">種別</th>' +
				'<th style="width: 34%;">説明</th>' +
				'<th>効果（概要）</th>' +
				'</tr></thead><tbody>';

			for (const sk of skillsSorted) {
				html += '<tr>' +
					`<td><b>${esc(sk.name)}</b></td>` +
					`<td>${esc(catLabel(sk.category))}</td>` +
					`<td>${esc(sk.description || '（説明未記載）')}</td>` +
					`<td>${esc(effectSummary(sk))}</td>` +
					'</tr>';
			}
			html += '</tbody></table>';
			effectEl.innerHTML = html;
		}

		if (valueEl) {
			let html = '<table class="guide-table"><thead><tr>' +
				'<th style="width: 26%;">スキル名</th>' +
				'<th style="width: 12%;">種別</th>' +
				'<th>主要パラメータ（skills.js）</th>' +
				'</tr></thead><tbody>';

			for (const sk of skillsSorted) {
				const params = mainParams(sk);
				const chips = params.length ?
					params.map(([k, v]) => `<span class="guide-kv"><b>${esc(k)}</b>: ${esc(v)}</span>`).join(' ') :
					'<span class="subnote">（主要パラメータなし）</span>';

				html += '<tr>' +
					`<td><b>${esc(sk.name)}</b></td>` +
					`<td>${esc(catLabel(sk.category))}</td>` +
					`<td>${chips}</td>` +
					'</tr>';
			}
			html += '</tbody></table>' +
				'<div class="subnote">※この一覧は「定義値（生データ）」です。戦闘中の実ダメージ等は、<b>ATK/DEF</b> や <b>スキルLv</b>、バリア/不死等の状態で変動します。</div>';
			valueEl.innerHTML = html;
		}
	};
})();

// =====================================================
// スキル交換ボタン（HPチャート下）
// =====================================================
window.addEventListener('DOMContentLoaded', () => {
	try {
		const btn = document.getElementById('skillExchangeBtn');
		if (!btn) return;
		if (btn.dataset && btn.dataset.bound === '1') return;
		if (btn.dataset) btn.dataset.bound = '1';

		btn.addEventListener('click', () => {
			try {
				if (typeof window.openSkillExchange === 'function') window.openSkillExchange();
			} catch (e) {}
		});

		const refresh = () => {
			try {
				const cost = Number(window.__SKILL_EXCHANGE_COST || 500);
				const coins = Number(window.faceCoins || 0);
				const p = __getPlayerRef();
				if (!p || !p.skillMemory || !p.skills) {
					btn.disabled = true;
					btn.textContent = `スキル交換（ゲーム開始後）`;
					return;
				}
				btn.disabled = (coins < cost);
				btn.textContent = `スキル交換（魔通貨${cost}枚）`;
			} catch (e) {}
		};

		refresh();
		window.__uiSetInterval && window.__uiSetInterval(refresh, 1000);
		// __uiSetInterval が無い環境でも動くよう保険
		if (!window.__uiSetInterval) setInterval(refresh, 1000);
	} catch (e) {}
});

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
	if (hpEl) hpEl.textContent = `HP: ${player.maxHp}`;

	const maxHpEl = document.getElementById('maxHpStat');
	if (maxHpEl) {
		maxHpEl.innerHTML = `<div class="enemy-item-section-title">所持魔道具</div>${formatBattleItemSummaryHtml(player, {
			emptyLabel: '所持魔道具: なし'
		})}`;
	}

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
      <p>HP: ${enemy.maxHp}</p>
      <div class="enemy-item-section">
        <div class="enemy-item-section-title">敵魔道具</div>
        ${formatBattleItemSummaryHtml(enemy, { emptyLabel: '戦闘用魔道具なし' })}
      </div>
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
	if (faceEl) faceEl.style.opacity = '0'; // ← 魔メイクも消す

	// タイマー解除
	clearTimeout(scoreTimeout);
	clearTimeout(skillTimeout);
	clearTimeout(itemTimeout);
	clearTimeout(faceTimeout); // ← 追加

	// -----------------------------------------------------
	// 最小化中は、skill/score/item の3つを自動復帰させない
	// （スクロール直後のタイマー復帰で一瞬表示されるのを防止）
	// ※ __isBattleDockMinimized が未定義でも動くよう localStorage を直読み
	// -----------------------------------------------------
	try {
		const k = (window.__battleDockMinKey || 'battleDockMinimized');
		const minimizedNow = (localStorage.getItem(k) === '1');
		if (minimizedNow) {
			try { if (typeof window.__hideBattleOverlays === 'function') window.__hideBattleOverlays(); } catch (_) {}
			return;
		}
	} catch (_e) {}

	// スコア：1秒後に再表示
	scoreTimeout = window.__battleSetTimeout(() => {
		try {
			const k = (window.__battleDockMinKey || 'battleDockMinimized');
			if (localStorage.getItem(k) === '1') { try { window.__hideBattleOverlays && window.__hideBattleOverlays(); } catch (_) {} return; }
		} catch (_e) {}
		if (battleEl) battleEl.style.opacity = '1';
		if (scoreEl) scoreEl.style.opacity = '1';
	}, 1500);

	// スキル：1.5秒後に再表示
	skillTimeout = window.__battleSetTimeout(() => {
		try {
			const k = (window.__battleDockMinKey || 'battleDockMinimized');
			if (localStorage.getItem(k) === '1') { try { window.__hideBattleOverlays && window.__hideBattleOverlays(); } catch (_) {} return; }
		} catch (_e) {}
		if (typeof updateSkillOverlay === 'function') updateSkillOverlay();
		if (skillEl) skillEl.style.opacity = '1';
	}, 1500);

	// 魔道具：1.5秒後に再表示
	itemTimeout = window.__battleSetTimeout(() => {
		try {
			const k = (window.__battleDockMinKey || 'battleDockMinimized');
			if (localStorage.getItem(k) === '1') { try { window.__hideBattleOverlays && window.__hideBattleOverlays(); } catch (_) {} return; }
		} catch (_e) {}
		updateItemOverlay();
		if (itemEl) itemEl.style.opacity = '1';
	}, 1500);

	// 魔メイク：1秒後に再表示（scoreOverlayと同時）
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

	window.__uiSetTimeout(() => {
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

window.maybeAutoLocalSave = function() {
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





window.__getFaceItemsOwnedForSave = window.__getFaceItemsOwnedForSave || function(){
	try{
		if (Array.isArray(window.faceItemsOwned)) return window.faceItemsOwned.slice();
	}catch(_e){}
	try{
		if (typeof faceItemsOwned !== 'undefined' && Array.isArray(faceItemsOwned)) return faceItemsOwned.slice();
	}catch(_e){}
	return [];
};

window.__getFaceItemEquippedForSave = window.__getFaceItemEquippedForSave || function(){
	try{
		if (typeof window.faceItemEquipped !== 'undefined') return window.faceItemEquipped ?? null;
	}catch(_e){}
	try{
		if (typeof faceItemEquipped !== 'undefined') return faceItemEquipped ?? null;
	}catch(_e){}
	return null;
};

window.__collectExtendedUiStateForSave = window.__collectExtendedUiStateForSave || function(){
	const out = {};
	try{ out.winnerGuessMiniGameEnabled = !!window.__winnerGuessMiniGameEnabled; }catch(_e){}
	try{ out.uiOpacityPercent = (typeof window.__getUIOpacityPercent === 'function') ? window.__getUIOpacityPercent() : Number(localStorage.getItem(window.__uiOpacityKey || 'rpg_ui_opacity_percent')); }catch(_e){}
	try{ out.battleDockPos = (typeof window.__readBattleDockPos === 'function') ? window.__readBattleDockPos() : null; }catch(_e){}
	try{ out.battleDockSide = localStorage.getItem(window.__battleDockSideKey || 'battleDockSide'); }catch(_e){}
	try{ out.battleDockMinimized = localStorage.getItem(window.__battleDockMinKey || 'battleDockMinimized'); }catch(_e){}
	try{ out.battleDockMiniFollow = localStorage.getItem(window.__battleDockMiniFollowKey || 'battleDockMiniFollow'); }catch(_e){}
	return out;
};

window.__persistExtendedUiStateToLocalStorage = window.__persistExtendedUiStateToLocalStorage || function(state){
	const s = state && typeof state === 'object' ? state : {};
	try{
		if (typeof s.winnerGuessMiniGameEnabled === 'boolean') {
			if (typeof window.__setWinnerGuessMiniGameEnabled === 'function') window.__setWinnerGuessMiniGameEnabled(!!s.winnerGuessMiniGameEnabled);
			else {
				window.__winnerGuessMiniGameEnabled = !!s.winnerGuessMiniGameEnabled;
				try{ localStorage.setItem('winnerGuessMiniGameEnabled', s.winnerGuessMiniGameEnabled ? '1' : '0'); }catch(_e){}
			}
		}
	}catch(_e){}
	try{
		if (Number.isFinite(Number(s.uiOpacityPercent))) {
			if (typeof window.__setUIOpacityPercent === 'function') window.__setUIOpacityPercent(Number(s.uiOpacityPercent));
			else localStorage.setItem(window.__uiOpacityKey || 'rpg_ui_opacity_percent', String(Math.max(0, Math.min(100, Math.round(Number(s.uiOpacityPercent))))));
		}
	}catch(_e){}
	try{
		if (s.battleDockPos && typeof s.battleDockPos.x === 'number' && typeof s.battleDockPos.y === 'number') {
			if (typeof window.__writeBattleDockPos === 'function') window.__writeBattleDockPos(s.battleDockPos);
			else localStorage.setItem(window.__battleDockPosKey || 'battleDockPosV1', JSON.stringify({ x: s.battleDockPos.x, y: s.battleDockPos.y }));
		}
	}catch(_e){}
	try{ if (s.battleDockSide != null) localStorage.setItem(window.__battleDockSideKey || 'battleDockSide', String(s.battleDockSide)); }catch(_e){}
	try{ if (s.battleDockMinimized != null) localStorage.setItem(window.__battleDockMinKey || 'battleDockMinimized', String(s.battleDockMinimized)); }catch(_e){}
	try{ if (s.battleDockMiniFollow != null) localStorage.setItem(window.__battleDockMiniFollowKey || 'battleDockMiniFollow', String(s.battleDockMiniFollow)); }catch(_e){}
};

window.__applyExtendedUiStateFromSave = window.__applyExtendedUiStateFromSave || function(state){
	const s = state && typeof state === 'object' ? state : {};
	try{ window.__persistExtendedUiStateToLocalStorage(s); }catch(_e){}
	try{ if (typeof window.__syncWinnerGuessToggleButton === 'function') window.__syncWinnerGuessToggleButton(); }catch(_e){}
	try{ if (typeof window.__applyGlobalUIOpacity === 'function') window.__applyGlobalUIOpacity(); }catch(_e){}
	try{
		const dock = document.getElementById('battleOverlayDock');
		if (dock && typeof window.__applyBattleDockSavedPos === 'function') window.__applyBattleDockSavedPos(dock);
	}catch(_e){}
	try{ if (typeof window.__refreshBattleControlDock === 'function') window.__refreshBattleControlDock(); }catch(_e){}
};

window.__restoreFaceItemsFromSave = window.__restoreFaceItemsFromSave || function(parsed){
	const savedOwned = Array.isArray(parsed && parsed.faceItemsOwned) ? parsed.faceItemsOwned.slice() : [];
	const savedEquipped = (parsed && Object.prototype.hasOwnProperty.call(parsed, 'faceItemEquipped')) ? (parsed.faceItemEquipped ?? null) : null;
	window.faceCoins = (parsed && parsed.faceCoins != null) ? parsed.faceCoins : 0;
	window.faceItemsOwned = savedOwned.slice();
	try{ faceItemsOwned = window.faceItemsOwned; }catch(_e){}
	window.faceItemEquipped = savedEquipped;
	try{ faceItemEquipped = savedEquipped; }catch(_e){}
	const __MM_ALGO_V = (typeof window.faceBonusAlgoVersion === 'number') ? window.faceBonusAlgoVersion : 0;
	const __MM_LOADED_V = Number((parsed && (parsed.faceItemBonusAlgoVersion ?? parsed.faceBonusAlgoVersion)) ?? 0) || 0;
	window.faceItemBonusAlgoVersion = __MM_LOADED_V;
	window.faceItemBonusMap = (parsed && parsed.faceItemBonusMap && typeof parsed.faceItemBonusMap === 'object') ? parsed.faceItemBonusMap : (window.faceItemBonusMap || {});
	if (__MM_ALGO_V && window.faceItemBonusAlgoVersion !== __MM_ALGO_V) {
		window.faceItemBonusMap = {};
		window.faceItemBonusAlgoVersion = __MM_ALGO_V;
	}
	try { (window.faceItemsOwned || []).forEach(function(p){ __ensureFaceBonus(p); }); } catch(_e) {}
	try {
		const coinElem = document.getElementById('faceCoinCount');
		if (coinElem) coinElem.innerText = window.faceCoins;
	} catch(_e){}
	try { if (typeof updateFaceUI === 'function') updateFaceUI(); } catch(_e){}
	try { if (typeof updatePlayerImage === 'function') updatePlayerImage(); } catch(_e){}
};


window.saveToLocalStorage = async function() {
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
		strongBossKillCount: Number.isFinite(window.strongBossKillCount) ? window.strongBossKillCount : 0,
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
		faceItemsOwned: (typeof window.__getFaceItemsOwnedForSave === 'function') ? window.__getFaceItemsOwnedForSave() : (window.faceItemsOwned || []),
		faceItemEquipped: (typeof window.__getFaceItemEquippedForSave === 'function') ? window.__getFaceItemEquippedForSave() : (window.faceItemEquipped || null),
		faceItemBonusAlgoVersion: (typeof window.faceItemBonusAlgoVersion === 'number') ? window.faceItemBonusAlgoVersion : ((typeof window.faceBonusAlgoVersion === 'number') ? window.faceBonusAlgoVersion : 0),
		faceItemBonusMap: window.faceItemBonusMap || {},
		// 制限時間（タイムアタック）状態
		timeLimitState: (typeof window.__serializeTimeLimitState === 'function') ? window.__serializeTimeLimitState() : null,
		extendedUiState: (typeof window.__collectExtendedUiStateForSave === 'function') ? window.__collectExtendedUiStateForSave() : null,
	};

	const raw = JSON.stringify(payload);
	const b64 = btoa(unescape(encodeURIComponent(raw)));
	const hash = await generateHash(b64);
	const code = `${b64}.${hash}`;

	localStorage.setItem('rpgLocalSave', code);
	try { localStorage.setItem('rpgLocalBaseMeta', JSON.stringify({ timestamp: Date.now() })); } catch (_) {}
	if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
	markLocalSaveClean(); // ← 状態を更新


	markAsSaved();
	updateLocalSaveButton();
	updateLocalSaveButton2();
	//	location.reload();
};

// =====================================================
// リザルト画面（「〜は敗北した」）用：ローカル保存→成功したらページをリロード
// ※ 設定内の「ローカルにセーブ」ボタン（id: localSaveBtn）の挙動は変えない
// =====================================================
window.saveToLocalStorageAndReloadFromFinalResults = async function() {
	const btn = document.getElementById('localSaveBtnFinal');
	if (btn) {
		btn.disabled = true;
		btn.dataset.__prevText = btn.textContent || '';
		btn.textContent = '保存中...';
	}
	let before = null;
	try { before = localStorage.getItem('rpgLocalSave'); } catch (_) { before = null; }

	let savedOk = false;
	let lastErr = null;

	try {
		if (typeof window.saveToLocalStorage !== 'function') {
			throw new Error('saveToLocalStorage is not defined');
		}
		await window.saveToLocalStorage();
		savedOk = true;
	} catch (e) {
		lastErr = e;

		// iOS Safari では「保存自体は成功したが UI 更新で例外」になることがあるため、
		// 保存キーが更新されていれば成功扱いにする。
		try {
			const after = localStorage.getItem('rpgLocalSave');
			if (after && after !== before) savedOk = true;
		} catch (_) {}
	}

	if (savedOk) {
		// 成功表示（描画のため少し待ってからリロード）
		if (btn) btn.textContent = '保存しました。リロードします…';
		try { await new Promise(r => setTimeout(r, 180)); } catch (_) {}
		try { location.reload(); } catch (_) {}
		return;
	}

	// ここに来たら保存失敗
	if (btn) {
		btn.disabled = false;
		btn.textContent = btn.dataset.__prevText || 'ローカルにセーブ（未保存）';
	}

	// エラー詳細をできるだけ表示
	let detail = '';
	try {
		if (lastErr) {
			const name = (lastErr && lastErr.name) ? String(lastErr.name) : 'Error';
			const msg = (lastErr && lastErr.message) ? String(lastErr.message) : '';
			detail = msg ? `
(${name}: ${msg})` : `
(${name})`;
		}
	} catch (_) {}

	try {
		if (typeof window.showCustomAlert === 'function') {
			window.showCustomAlert('ローカル保存に失敗しました。ブラウザの容量や権限をご確認ください。' + detail, 3400, '#3a1212', '#fff', true);
		} else {
			alert('ローカル保存に失敗しました。' + detail);
		}
	} catch (_) {}
};



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
	player.initialAndSlotSkills = window.initialAndSlotSkills || [];

	// ✅ 特殊スキル情報も保存（保護状態含む）
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

		// ✅ 魔メイク情報を明示的に保存
		faceCoins: window.faceCoins || 0,
		faceItemsOwned: (typeof window.__getFaceItemsOwnedForSave === 'function') ? window.__getFaceItemsOwnedForSave() : (window.faceItemsOwned || []),
		faceItemEquipped: (typeof window.__getFaceItemEquippedForSave === 'function') ? window.__getFaceItemEquippedForSave() : (window.faceItemEquipped || null),
		faceItemBonusMap: window.faceItemBonusMap || {},
		extendedUiState: (typeof window.__collectExtendedUiStateForSave === 'function') ? window.__collectExtendedUiStateForSave() : null,
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
		box.focus();
		box.select();
	}

	const charName = displayName(player.name).replace(/[\\/:*?"<>|]/g, '_');
	const now = new Date();
	const timestamp = now.toLocaleString('ja-JP', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
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

window.importSaveCode = async function(code = null) {
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
		currentStreak = Number.isFinite(Number(parsed.currentStreak)) ? Number(parsed.currentStreak) : 0;
		if (typeof parsed.sslot === 'number') sslot = parsed.sslot;
		if (parsed.targetBattles !== undefined) window.targetBattles = parsed.targetBattles;
		if (parsed.remainingBattles !== undefined) window.remainingBattles = parsed.remainingBattles;
		if (Number.isFinite(Number(parsed.strongBossKillCount))) window.strongBossKillCount = Number(parsed.strongBossKillCount);

		// ✅ 特殊スキル情報の復元（保護状態を正規化）
		player.mixedSkills = Array.isArray(parsed.mixedSkills) ?
			parsed.mixedSkills.map(s => {
				if (s.protected) s.isProtected = true;
				return s;
			}) : [];

		window.maxScores = parsed.maxScores || {};
		//try{ window.__keepGrowthBonusFromProgressSave = false; window.__forceResetGrowthBonusOnNextStart = true; }catch(_e){}
	player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };

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

		// ✅ 魔メイク情報の復元とUI更新
		if (typeof window.__restoreFaceItemsFromSave === 'function') window.__restoreFaceItemsFromSave(parsed);

		// ✅ 追加UI状態の復元
		try{ if (typeof window.__applyExtendedUiStateFromSave === 'function') window.__applyExtendedUiStateFromSave(parsed.extendedUiState || null); }catch(_e){}

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

		// ==========================
		// 制限時間（タイムアタック）状態の復元
		//  - ローカル保存対象
		//  - つづきから選択直後（import直後）から途中再開
		// ==========================
		try{
			if (typeof window.__restoreTimeLimitStateFromSave === 'function') {
				window.__restoreTimeLimitStateFromSave(parsed.timeLimitState || null);
			}
		}catch(_){}


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

			try{ if (typeof window.__restoreFaceItemsFromSave === 'function') window.__restoreFaceItemsFromSave(parsed); }catch(_e){}
			try{ if (typeof window.__applyExtendedUiStateFromSave === 'function') window.__applyExtendedUiStateFromSave(parsed.extendedUiState || null); }catch(_e){}
			window.__battleSetTimeout(() => {
				try{ if (typeof window.__restoreFaceItemsFromSave === 'function') window.__restoreFaceItemsFromSave(parsed); }catch(_e){}
				try{ if (typeof window.__applyExtendedUiStateFromSave === 'function') window.__applyExtendedUiStateFromSave(parsed.extendedUiState || null); }catch(_e){}
			}, 30);

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

			// ✅ 特殊スキルリストを再描画
			if (typeof drawCombinedSkillList === 'function') drawCombinedSkillList();

		}, 500);

	} catch (e) {
		alert('セーブデータの読み込みに失敗しました：' + e.message);
		console.error(e);
	}

	// ✅ スキルUI同期（スロットや記憶）
	if (typeof syncSkillsUI === 'function') syncSkillsUI();
};






window.loadFromLocalStorage = async function() {
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

	try{ window.__keepGrowthBonusFromProgressSave = false; window.__forceResetGrowthBonusOnNextStart = true; }catch(_e){}
	player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };

};


window.loadProgressFromLocalStorage = async function() {
	const primary = localStorage.getItem('rpgLocalProgressSave');
	const fallback = localStorage.getItem('rpgLocalSave');
	if (!primary && !fallback) { alert('進捗を含む保存データが見つかりません。'); return; }

	async function tryImport(code) {
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
			window.__loadingFromProgress = true; // ★進捗ルート
			await tryImport(primary);
			used = 'progress';
		}
	} catch (e1) {
		console.warn('progress import failed, trying fallback:', e1);
	}
	if (!used) {
		window.__loadingFromProgress = false; // ★通常ルート
		await tryImport(fallback);
		used = 'fallback';
	}
	// フラグは後片付け（ズレ防止にsetTimeoutで確実にクリア）
	window.__battleSetTimeout(() => { try { delete window.__loadingFromProgress; } catch (_) {} }, 0);

	try {
		const metaStr = localStorage.getItem('rpgLocalProgressMeta');
		if (metaStr) {
			const m = JSON.parse(metaStr);
			if (m.targetBattles != null) window.targetBattles = m.targetBattles;
			if (m.remainingBattles != null) window.remainingBattles = m.remainingBattles;
			if (m.currentStreak != null) window.currentStreak = m.currentStreak;
		}
	} catch (_) {}

	const title = document.getElementById('titleScreen');
	const game = document.getElementById('gameScreen');
	if (title && game) {
		title.classList.add('hidden');
		game.classList.remove('hidden');
	}
	if (typeof updateRemainingBattleDisplay === 'function') updateRemainingBattleDisplay();
	if (typeof updateStats === 'function') updateStats();
};

// ================ Debug Dump ================
window.dumpDebugSave = function() {
	try {
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
			rpgLocalSave: c1 ? (c1.slice(0, 80) + '... len=' + c1.length) : null,
			rpgLocalProgressSave: c2 ? (c2.slice(0, 80) + '... len=' + c2.length) : null,
			rpgLocalProgressMeta: meta,
			runtime: probe
		};
		const pretty = JSON.stringify(out, null, 2);
		let overlay = document.getElementById('debugDumpOverlay');
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.id = 'debugDumpOverlay';
			overlay.style.position = 'fixed';
			overlay.style.inset = '0';
			overlay.style.background = 'rgba(0,0,0,.7)';
			overlay.style.zIndex = '9999';
			overlay.style.display = 'flex';
			overlay.style.alignItems = 'center';
			overlay.style.justifyContent = 'center';
			const box = document.createElement('div');
			box.style.width = 'min(900px, 90vw)';
			box.style.height = 'min(70vh, 600px)';
			box.style.background = 'rgba(0,0,0,0.6)';
			box.style.border = '1px solid rgba(255,255,255,.25)';
			box.style.backdropFilter = 'blur(10px)';
			box.style.padding = '16px';
			box.style.borderRadius = '8px';
			const ta = document.createElement('textarea');
			ta.id = 'debugDumpText';
			ta.style.width = '100%';
			ta.style.height = 'calc(100% - 48px)';
			ta.style.color = '#fff';
			ta.style.background = 'rgba(255,255,255,.06)';
			ta.style.border = '1px solid rgba(255,255,255,.25)';
			ta.style.padding = '8px';
			const btn = document.createElement('button');
			btn.textContent = '閉じる';
			btn.onclick = () => overlay.remove();
			btn.style.marginTop = '8px';
			btn.style.padding = '8px 16px';
			box.appendChild(ta);
			box.appendChild(btn);
			overlay.appendChild(box);
			document.body.appendChild(overlay);
		}
		const ta = document.getElementById('debugDumpText');
		if (ta) {
			ta.value = pretty;
			ta.focus();
			ta.select();
		}
	} catch (e) {
		alert('デバッグ出力に失敗しました：' + e.message);
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
			} catch (_) { return 0; }
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
	} catch (e) {
		console.warn('refreshLoadButtonsHighlight failed:', e);
	}
};

// ======================================================
// 進捗セーブ／ロード（既存ローカルセーブ完全互換＋メタ保存）
// ======================================================
(function() {
	// 活性制御：バトル1回以上 & 残り戦闘数>0
	function refreshProgressSaveAvailability() {
		const btn = document.getElementById('localProgressSaveBtn');
		if (!btn) return;
		const battles = (window.battleCount || 0);
		const remain = (window.remainingBattles ?? 0);
		btn.disabled = !((battles > 0) && (remain > 0));
	}
	document.addEventListener('DOMContentLoaded', refreshProgressSaveAvailability);
	window.addEventListener('focus', refreshProgressSaveAvailability);
	setInterval(refreshProgressSaveAvailability, 1200);

	// 明示的な成功アラートを出すヘルパ
	function notify(msg) { try { alert(msg); } catch (_) {} }

	// 進捗セーブ
	window.saveProgressToLocalStorage = async function() {
		const battles = (window.battleCount || 0);
		const remain = (window.remainingBattles ?? 0);
		if (battles <= 0) { notify('バトルを1回以上行った後にセーブできます。'); return; }
		if (remain <= 0) { notify('残り戦闘数が0のため、進捗セーブはできません。'); return; }

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
			if (btn) {
				btn.classList.add('saved');
				btn.classList.remove('unsaved');
			}

			// 明示的に成功メッセージ（既存が沈黙でも確実に出す）
			notify('ローカルに進捗（含む）を保存しました。');
		} catch (e) {
			console.error(e);
			notify('セーブに失敗しました。');
		}
	};

	// 進捗ロード（フォールバックあり）
	window.loadProgressFromLocalStorage = async function() {
		const primary = localStorage.getItem('rpgLocalProgressSave');
		const fallback = localStorage.getItem('rpgLocalSave');
		if (!primary && !fallback) { notify('進捗を含む保存データが見つかりません。'); return; }

		async function tryImport(code) {
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
				window.__loadingFromProgress = true; // ★進捗ルート
				await tryImport(primary);
				used = 'progress';
			}
		} catch (e1) {
			console.warn('progress import failed, trying fallback:', e1);
		}
		if (!used) {
			window.__loadingFromProgress = false; // ★通常ルート
			await tryImport(fallback);
			used = 'fallback';
		}
		// フラグは後片付け（ズレ防止にsetTimeoutで確実にクリア）
		window.__battleSetTimeout(() => { try { delete window.__loadingFromProgress; } catch (_) {} }, 0);
	};

	// デバッグ出力
	if (typeof window.dumpDebugSave !== 'function') {
		window.dumpDebugSave = function() {
			try {
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
					rpgLocalSave: c1 ? (c1.slice(0, 80) + '... len=' + c1.length) : null,
					rpgLocalProgressSave: c2 ? (c2.slice(0, 80) + '... len=' + c2.length) : null,
					rpgLocalProgressMeta: meta,
					runtime: probe
				};
				const pretty = JSON.stringify(out, null, 2);
				let overlay = document.getElementById('debugDumpOverlay');
				if (!overlay) {
					overlay = document.createElement('div');
					overlay.id = 'debugDumpOverlay';
					overlay.style.position = 'fixed';
					overlay.style.inset = '0';
					overlay.style.background = 'rgba(0,0,0,.7)';
					overlay.style.zIndex = '9999';
					overlay.style.display = 'flex';
					overlay.style.alignItems = 'center';
					overlay.style.justifyContent = 'center';
					const box = document.createElement('div');
					box.style.width = 'min(900px, 90vw)';
					box.style.height = 'min(70vh, 600px)';
					box.style.background = 'rgba(0,0,0,0.6)';
					box.style.border = '1px solid rgba(255,255,255,.25)';
					box.style.backdropFilter = 'blur(10px)';
					box.style.padding = '16px';
					box.style.borderRadius = '8px';
					const ta = document.createElement('textarea');
					ta.id = 'debugDumpText';
					ta.style.width = '100%';
					ta.style.height = 'calc(100% - 48px)';
					ta.style.color = '#fff';
					ta.style.background = 'rgba(255,255,255,.06)';
					ta.style.border = '1px solid rgba(255,255,255,.25)';
					ta.style.padding = '8px';
					const btn = document.createElement('button');
					btn.textContent = '閉じる';
					btn.onclick = () => overlay.remove();
					btn.style.marginTop = '8px';
					btn.style.padding = '8px 16px';
					box.appendChild(ta);
					box.appendChild(btn);
					overlay.appendChild(box);
					document.body.appendChild(overlay);
				}
				const ta = document.getElementById('debugDumpText');
				if (ta) {
					ta.value = pretty;
					ta.focus();
					ta.select();
				}
			} catch (e) {
				alert('デバッグ出力に失敗しました：' + e.message);
				console.error(e);
			}
		};
	}
})();


// ======================================================
// Progress save/load (compat mirror, no format change)
// ======================================================
(function() {
	function notify(msg) { try { alert(msg); } catch (_) {} }

	function refreshProgressSaveAvailability() {
		const btn = document.getElementById('localProgressSaveBtn');
		if (!btn) return;
		const battles = (window.battleCount || 0);
		const remain = (window.remainingBattles ?? 0);
		btn.disabled = !((battles > 0) && (remain > 0));
	}
	document.addEventListener('DOMContentLoaded', refreshProgressSaveAvailability);
	window.addEventListener('focus', refreshProgressSaveAvailability);
	setInterval(refreshProgressSaveAvailability, 1200);

	window.localProgressSaveMirror = async function() {
		const battles = (window.battleCount || 0);
		const remain = (window.remainingBattles ?? 0);
		if (battles <= 0) { notify('バトルを1回以上行った後にセーブできます。'); return; }
		if (remain <= 0) { notify('残り戦闘数が0のため、進捗セーブはできません。'); return; }
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
		} catch (e) {
			console.error(e);
			notify('セーブに失敗しました。');
		}
	};

	window.loadProgressFromLocalStorageCompat = async function() {
		const primary = localStorage.getItem('rpgLocalProgressSave');
		const fallback = localStorage.getItem('rpgLocalSave');
		if (!primary && !fallback) { notify('進捗を含む保存データが見つかりません。'); return; }
		async function tryImport(code) {
			if (!code) throw new Error('no code');
			if (typeof importSaveCode !== 'function') throw new Error('importSaveCode missing');
			await importSaveCode(code);
		}
		try {
			try { await tryImport(primary); } catch (_e) { await tryImport(fallback); }
			try{ window.__keepGrowthBonusFromProgressSave = true; window.__forceResetGrowthBonusOnNextStart = false; }catch(_e){}
			try {
				const metaStr = localStorage.getItem('rpgLocalProgressMeta');
				if (metaStr) {
					const m = JSON.parse(metaStr);
					if (m.targetBattles != null) window.targetBattles = m.targetBattles;
					if (m.remainingBattles != null) window.remainingBattles = m.remainingBattles;
					if (m.battleCount != null) window.battleCount = m.battleCount;
					if (m.currentStreak != null) window.currentStreak = m.currentStreak;
				}
			} catch (_) {}
			const title = document.getElementById('titleScreen');
			const game = document.getElementById('gameScreen');
			if (title && game) {
				title.classList.add('hidden');
				game.classList.remove('hidden');
			}
			if (typeof updateRemainingBattleDisplay === 'function') updateRemainingBattleDisplay();
			if (typeof updateStats === 'function') updateStats();
			notify('ローカルからロード（進捗含む）を実行しました。');
		} catch (e) {
			console.error(e);
			notify('ローカル保存（進捗含む）の読み込みに失敗しました。');
		}
	};
})();


// ======================================================
// HARD SHIM: force progress save/load to be base-format
// and neuter any progress_v2 writers. (idempotent)
// ======================================================
(function() {
	if (window.__progressCompatShimInstalled) return;
	window.__progressCompatShimInstalled = true;

	function notify(msg) { try { alert(msg); } catch (_) {} }

	function snapshotMeta() {
		try {
			const meta = {
				remainingBattles: window.remainingBattles ?? null,
				targetBattles: window.targetBattles ?? null,
				battleCount: window.battleCount ?? null,
				currentStreak: window.currentStreak ?? 0,
				timestamp: Date.now()
			};
			localStorage.setItem('rpgLocalProgressMeta', JSON.stringify(meta));
			if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
		} catch (e) { console.warn('meta save failed', e); }
	}

	async function mirrorSaveCore() {
		const battles = (window.battleCount || 0);
		const remain = (window.remainingBattles ?? 0);
		if (battles <= 0) { notify('バトルを1回以上行った後にセーブできます。'); return; }
		if (remain <= 0) { notify('残り戦闘数が0のため、進捗セーブはできません。'); return; }

		if (typeof window.saveToLocalStorage === 'function') {
			try { await window.saveToLocalStorage(); } catch (e) { console.warn('base save failed', e); }
		}
		let base = localStorage.getItem('rpgLocalSave');
		if (!base) { notify('セーブコードの取得に失敗しました。'); return; }
		localStorage.setItem('rpgLocalProgressSave', base);
		snapshotMeta();
		if (typeof window.refreshLoadButtonsHighlight === 'function') window.refreshLoadButtonsHighlight();
	}

	window.localProgressSaveMirror = mirrorSaveCore;

	window.loadProgressFromLocalStorageCompat = async function() {
		const primary = localStorage.getItem('rpgLocalProgressSave');
		const fallback = localStorage.getItem('rpgLocalSave');
		if (!primary && !fallback) { notify('進捗を含む保存データが見つかりません。'); return; }
		async function tryImport(code) {
			if (!code) throw new Error('no code');
			if (typeof importSaveCode !== 'function') throw new Error('importSaveCode missing');
			await importSaveCode(code);
		}
		try {
			try { await tryImport(primary); } catch (_) { await tryImport(fallback); }
			try {
				const metaStr = localStorage.getItem('rpgLocalProgressMeta');
				if (metaStr) {
					const m = JSON.parse(metaStr);
					if (m.targetBattles != null) window.targetBattles = m.targetBattles;
					if (m.remainingBattles != null) window.remainingBattles = m.remainingBattles;
					if (m.battleCount != null) window.battleCount = m.battleCount;
					if (m.currentStreak != null) window.currentStreak = m.currentStreak;
				}
			} catch (_) {}
			const title = document.getElementById('titleScreen');
			const game = document.getElementById('gameScreen');
			if (title && game) {
				title.classList.add('hidden');
				game.classList.remove('hidden');
			}
			if (typeof updateRemainingBattleDisplay === 'function') updateRemainingBattleDisplay();
			if (typeof updateStats === 'function') updateStats();
			notify('ローカルからロード（進捗含む）を実行しました。');
		} catch (e) {
			console.error(e);
			notify('ローカル保存（進捗含む）の読み込みに失敗しました。');
		}
	};

	// Intercept localStorage writes to override progress_v2
	const __origSetItem = localStorage.setItem.bind(localStorage);
	localStorage.setItem = function(key, val) {
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
		} catch (e) {
			return __origSetItem(key, val);
		}
	};

	// After all scripts load, override legacy functions and attach fallback click handler
	window.addEventListener('load', function() {
		window.saveProgressToLocalStorage = mirrorSaveCore;
		window.loadProgressFromLocalStorage = window.loadProgressFromLocalStorageCompat;
		document.body.addEventListener('click', function(ev) {
			const t = ev.target;
			if (!t) return;
			const txt = (t.textContent || '').trim();
			if (txt.includes('ローカルセーブ') && txt.includes('進捗')) {
				window.__battleSetTimeout(function() { mirrorSaveCore(); }, 30);
			}
		}, true);
	});

	if (typeof window.dumpDebugSave !== 'function') {
		window.dumpDebugSave = function() {
			try {
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
					rpgLocalSave: c1 ? (c1.slice(0, 80) + '... len=' + c1.length) : null,
					rpgLocalProgressSave: c2 ? (c2.slice(0, 80) + '... len=' + c2.length) : null,
					rpgLocalProgressMeta: meta,
					runtime: probe
				};
				const pretty = JSON.stringify(out, null, 2);
				let overlay = document.getElementById('debugDumpOverlay');
				if (!overlay) {
					overlay = document.createElement('div');
					overlay.id = 'debugDumpOverlay';
					overlay.style.position = 'fixed';
					overlay.style.inset = '0';
					overlay.style.background = 'rgba(0,0,0,.7)';
					overlay.style.zIndex = '9999';
					overlay.style.display = 'flex';
					overlay.style.alignItems = 'center';
					overlay.style.justifyContent = 'center';
					const box = document.createElement('div');
					box.style.width = 'min(900px, 90vw)';
					box.style.height = 'min(70vh, 600px)';
					box.style.background = 'rgba(0,0,0,0.6)';
					box.style.border = '1px solid rgba(255,255,255,.25)';
					box.style.backdropFilter = 'blur(10px)';
					box.style.padding = '16px';
					box.style.borderRadius = '8px';
					const ta = document.createElement('textarea');
					ta.id = 'debugDumpText';
					ta.style.width = '100%';
					ta.style.height = 'calc(100% - 48px)';
					ta.style.color = '#fff';
					ta.style.background = 'rgba(255,255,255,.06)';
					ta.style.border = '1px solid rgba(255,255,255,.25)';
					ta.style.padding = '8px';
					const btn = document.createElement('button');
					btn.textContent = '閉じる';
					btn.onclick = () => overlay.remove();
					btn.style.marginTop = '8px';
					btn.style.padding = '8px 16px';
					box.appendChild(ta);
					box.appendChild(btn);
					overlay.appendChild(box);
					document.body.appendChild(overlay);
				}
				const ta = document.getElementById('debugDumpText');
				if (ta) {
					ta.value = pretty;
					ta.focus();
					ta.select();
				}
			} catch (e) {
				alert('デバッグ出力に失敗しました：' + e.message);
				console.error(e);
			}
		};
	}
})();


// 初期同期：タイトル表示時に最新データ側を強調
document.addEventListener('DOMContentLoaded', function() {
	/*_added_ready_refresh_*/
	if (typeof window.refreshLoadButtonsHighlight === 'function') {
		window.refreshLoadButtonsHighlight();
	}
});


// 初期同期：タイトル表示時に最新データ側を強調
document.addEventListener('DOMContentLoaded', function() {
	/*_added_ready_refresh_v2_*/
	if (typeof window.refreshLoadButtonsHighlight === 'function') {
		window.refreshLoadButtonsHighlight();
	}
});


;
(function() {
	function bindOnceButton() {
		var onceBtn = document.getElementById('startBattleOnceBtn');
		if (!onceBtn || onceBtn.__wired) return;
		onceBtn.__wired = true;
		onceBtn.addEventListener('click', function() {
			if (window.isAutoBattle) return; // Auto中は無効
			if (window.__onceBtnCooldown) return; // 連打防止
			window.__onceBtnCooldown = true;
			try {
				(window.startBattle || startBattle)();
			} finally {
				window.__battleSetTimeout(function() { window.__onceBtnCooldown = false; }, 400);
			}
		});
	}
	document.addEventListener('DOMContentLoaded', bindOnceButton);
	window.__battleSetTimeout(bindOnceButton, 0);
	window.__battleSetTimeout(bindOnceButton, 500);
})();


window.ensureBattleButtons = function() {
	var b1 = document.getElementById('startBattleBtn');
	var b2 = document.getElementById('startBattleOnceBtn');
  [b1, b2].forEach(function(b) {
		if (!b) return;
		b.classList.remove('hidden');
		b.style.display = '';
		b.disabled = false;
	});
};
document.addEventListener('DOMContentLoaded', window.ensureBattleButtons);


window.syncBattleButtonsMode = function() {
	var b1 = document.getElementById('startBattleBtn');
	var b2 = document.getElementById('startBattleOnceBtn');
	var brutal = (window.specialMode === 'brutal');
  [b1, b2].forEach(function(b) {
		if (!b) return;
		b.classList.remove('normal-mode', 'brutal-mode');
		b.classList.add(brutal ? 'brutal-mode' : 'normal-mode');
	});
};
document.addEventListener('DOMContentLoaded', window.syncBattleButtonsMode);
window.__battleSetTimeout(window.syncBattleButtonsMode, 0);


;
(function() {
	function after(fn, tail) { return function() { try { return fn.apply(this, arguments); } finally { try { tail(); } catch (e) {} } }; }
	if (typeof window.toggleSpecialMode === 'function') {
		window.toggleSpecialMode = after(window.toggleSpecialMode, window.syncBattleButtonsMode);
	}
	if (typeof window.updateSpecialModeButton === 'function') {
		window.updateSpecialModeButton = after(window.updateSpecialModeButton, window.syncBattleButtonsMode);
	}
})();


// === Selection guard refinements ===
(function() {
	function getPopup() { return document.getElementById('eventPopup'); }

	function hasOptions() {
		const p = getPopup();
		if (!p) return false;
		const opt = p.querySelector('#eventPopupOptions');
		if (!opt) return false;
		// buttons or clickable options count
		return opt.querySelectorAll('button, .option, .choice, .selectable').length > 0;
	}

	function markHasOptions() {
		const p = getPopup();
		if (!p) return;
		if (hasOptions()) p.classList.add('has-options');
		else p.classList.remove('has-options');
	}
	// If previous helpers exist, reuse their names
	window.__hasGrowthOptions = hasOptions;
	window.__markGrowthOptions = markHasOptions;

	// Upgrade keep-alive to only enforce when options really exist
	if (window.selectionKeepAliveUpgraded !== true && typeof window.selectionKeepAlive !== 'undefined') {
		window.selectionKeepAliveUpgraded = true;
		// Stop old interval, start upgraded one
		try { if (window.selectionKeepAlive) clearInterval(window.selectionKeepAlive); } catch (e) {}
		window.selectionKeepAlive = setInterval(function() {
			const p = getPopup();
			if (!p) return;
			markHasOptions();
			if (!window.isPopupSelecting || !hasOptions()) {
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
	if (!window.__decorate_clearEventPopup3 && typeof window.clearEventPopup === 'function') {
		window.__decorate_clearEventPopup3 = true;
		const prev = window.clearEventPopup;
		window.clearEventPopup = function(force) {
			// If there are no options anymore, allow close even without force
			if (window.isPopupSelecting && !force && !hasOptions()) {
				force = true;
			}
			try {
				return prev.apply(this, arguments);
			} finally {
				// If options are gone or force-close, release guards
				if (!hasOptions() || force === true) {
					window.isPopupSelecting = false;
					try {
						const p = getPopup();
						if (p) {
							p.classList.remove('selection-lock');
							p.classList.remove('has-options');
						}
					} catch (e) {}
					try {
						if (window.selectionObserver) {
							window.selectionObserver.disconnect();
							window.selectionObserver = null;
						}
					} catch (e) {}
				}
			}
		}
	}

	// Also decorate showEventOptions to flag 'has-options' quickly after render tick
	if (!window.__decorate_showEventOptions3 && typeof window.showEventOptions === 'function') {
		window.__decorate_showEventOptions3 = true;
		const base = window.showEventOptions;
		window.showEventOptions = function() {
			const ret = base.apply(this, arguments);
			window.isPopupSelecting = true;
			try{ (window.__battleSetTimeout||window.setTimeout)(markHasOptions, 0); }catch(e){}
			try{ (window.__battleSetTimeout||window.setTimeout)(markHasOptions, 100); }catch(e){} // after DOM fills
			return ret;
		}
	}
})();
// =====================================================

(function() {
	function callInit() { if (typeof window.init === 'function') window.init(); }
	if (document.readyState === 'loading') {
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

window.exportSaveAsTextFile = async function() {
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

window.__bindTextFileLoadUI = function() {
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

				// 非「中断」ロード扱い：growthBonus は必ずゼロに戻す
				try{ window.__keepGrowthBonusFromProgressSave = false; window.__forceResetGrowthBonusOnNextStart = true; }catch(_e){}
				try{ if (typeof window.__resetGrowthBonusToZero === 'function') window.__resetGrowthBonusToZero(); }catch(_e){}

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


// =====================================================
// Title Screen: "つづきから" -> compact load panel (animated swap)
// =====================================================
window.resetTitleLoadPanel = window.resetTitleLoadPanel || function() {
	try {
		const btn = document.getElementById('continueBtn');
		const panel = document.getElementById('loadPanel');
		if (btn) {
			btn.style.display = '';
			btn.classList.remove('is-swapping');
		}
		if (panel) {
			panel.classList.add('is-collapsed');
			panel.classList.remove('is-open');
			panel.setAttribute('aria-hidden', 'true');
		}
	} catch (e) {}
};

window.__initTitleContinuePanel = window.__initTitleContinuePanel || function() {
	try {
		const btn = document.getElementById('continueBtn');
		const panel = document.getElementById('loadPanel');
		const closeBtn = document.getElementById('loadPanelCloseBtn');
		if (!btn || !panel) return;

		if (btn.__bound) return;
		btn.__bound = true;

		const openPanel = () => {
			try {
				// If "はじめから" panel is open, close it when opening "つづきから".
				try{
					// If "はじめから" panel is open, close it when opening "つづきから"
					const newBtn = document.getElementById('startNewMenuBtn');
					const newPanel = document.getElementById('newPanel');
					if (newPanel){
						newPanel.classList.add('is-collapsed');
						newPanel.classList.remove('is-open');
						newPanel.setAttribute('aria-hidden', 'true');
					}
					// Restore the "はじめから" button if it was swapped out
					if (newBtn){
						newBtn.classList.remove('is-swapping');
						newBtn.style.display = '';
					}
				}catch(_){ }

				// swap animation: fade/blur out the single button, then reveal panel
				btn.classList.add('is-swapping');

				// Let CSS transition run, then hide the button & open panel
				const ms = 240;
				window.__uiSetTimeout(() => {
					try { btn.style.display = 'none'; } catch (_) {}
					panel.classList.remove('is-collapsed');
					panel.classList.add('is-open');
					panel.setAttribute('aria-hidden', 'false');
				}, ms);
			} catch (e) {}
		};

		btn.addEventListener('click', openPanel);


			// Close (×) returns to the single continue button
			if (closeBtn && !closeBtn.__bound) {
				closeBtn.__bound = true;
				closeBtn.addEventListener('click', (ev) => {
					try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
					try { window.resetTitleLoadPanel(); } catch (_) {}
				});
			}

			// Clicking backdrop closes panel (if click is outside inner)
			if (!panel.__boundBackdropClose) {
				panel.__boundBackdropClose = true;
				panel.addEventListener('click', (ev) => {
					try {
						const inner = panel.querySelector('.load-panel-inner');
						if (inner && inner.contains(ev.target)) return;
					} catch (_) {}
					try { window.resetTitleLoadPanel(); } catch (_) {}
				});
			}

			// ESC closes panel when open
			if (!window.__boundTitleContinueEsc) {
				window.__boundTitleContinueEsc = true;
				window.addEventListener('keydown', (ev) => {
					try {
						if (ev.key !== 'Escape') return;
						const p = document.getElementById('loadPanel');
						if (p && p.classList.contains('is-open')) window.resetTitleLoadPanel();
					} catch (_) {}
				});
			}

		// Default state: collapsed
		window.resetTitleLoadPanel();
	} catch (e) {}
};

// Bind on DOMContentLoaded (alongside existing title UI bindings)
window.addEventListener('DOMContentLoaded', () => {
	try {
		if (typeof window.__initTitleContinuePanel === 'function') window.__initTitleContinuePanel();
	} catch (e) {}
});


// =========================================================
// Time limit challenge (飲み会タイムアタック)
// - Title screen select (#timeLimitSelect): unlimited / 10/20/30/60 minutes
// - Only when non-unlimited: show timer row inside BattleDock (line break)
// - Persist in local save and resume on "つづきから" load
// =========================================================
(function(){
	try{
		// State
		if (!window.__timeLimitState) {
			window.__timeLimitState = {
				active: false,
				expired: false,
				totalSec: 0,
				endAt: null,   // epoch ms
			};
		}

		window.__formatTimeMMSS = window.__formatTimeMMSS || function(sec){
			try{
				sec = Math.max(0, Math.floor(Number(sec)||0));
				const m = Math.floor(sec / 60);
				const s = sec % 60;
				const mm = String(m).padStart(2,'0');
				const ss = String(s).padStart(2,'0');
				return `${mm}:${ss}`;
			}catch(_){
				return '00:00';
			}
		};

		window.__serializeTimeLimitState = window.__serializeTimeLimitState || function(){
			try{
				const st = window.__timeLimitState || {};
				const out = {
					active: !!st.active,
					expired: !!st.expired,
					totalSec: Number(st.totalSec || 0),
					endAt: (st.endAt == null ? null : Number(st.endAt))
				};
				// Sanity
				if (!Number.isFinite(out.totalSec) || out.totalSec < 0) out.totalSec = 0;
				if (out.endAt != null && !Number.isFinite(out.endAt)) out.endAt = null;
				return out;
			}catch(_){
				return null;
			}
		};

		window.__clearTimeLimitRuntime = window.__clearTimeLimitRuntime || function(silent){
			try{
				if (window.__timeLimitInterval) {
					clearInterval(window.__timeLimitInterval);
					window.__timeLimitInterval = null;
				}
			}catch(_){}
			try{
				window.__timeLimitState = {
					active: false,
					expired: false,
					totalSec: 0,
					endAt: null
				};
			}catch(_){}
			try{ window.__applyTimeLimitUI && window.__applyTimeLimitUI(); }catch(_){}
			if (!silent) {
				try{ if (typeof showSubtitle === 'function') showSubtitle('制限時間：無制限', 900); }catch(_){}
			}
		};

		window.__ensureTimeLimitDockRow = window.__ensureTimeLimitDockRow || function(){
			try{
				const dock = document.getElementById('battleOverlayDock');
				if (!dock) return null;

				const battleBtn = document.getElementById('startBattleBtn');
				let parent = null;

				// Prefer to insert right after the battle button (line break effect)
				if (battleBtn && battleBtn.parentElement) {
					parent = battleBtn.parentElement;
					// if the battleBtn isn't inside dock, fallback to dockContent
					if (!dock.contains(parent)) parent = null;
				}
				if (!parent) parent = dock.querySelector('.dockContent') || dock;

				let row = document.getElementById('battleTimeLimitRow');
				if (!row) {
					row = document.createElement('div');
					row.id = 'battleTimeLimitRow';
					row.className = 'dockTimerRow';

					// insert after battle button if possible
					if (battleBtn && battleBtn.parentElement && dock.contains(battleBtn.parentElement)) {
						const after = battleBtn.nextSibling;
						if (after) battleBtn.parentElement.insertBefore(row, after);
						else battleBtn.parentElement.appendChild(row);
					} else {
						parent.appendChild(row);
					}
				}
				return row;
			}catch(_){
				return null;
			}
		};

		window.__applyTimeLimitUI = window.__applyTimeLimitUI || function(){
			try{
				const st = window.__timeLimitState || {};
				const row = window.__ensureTimeLimitDockRow ? window.__ensureTimeLimitDockRow() : null;
				const battleBtn = document.getElementById('startBattleBtn');

				// When no dock yet, just update the battle button visibility
				if (st.expired) {
					if (battleBtn) {
						battleBtn.style.display = 'none';
						try{ battleBtn.classList.add('hidden'); }catch(_){}
					}
					if (row) {
						row.classList.add('is-active');
						row.innerHTML = `
							<button type="button" class="dockTimerExpiredBtn" id="timeLimitSummaryToggleBtn" aria-label="制限時間終了の結果を表示/非表示">
								⏰ 制限時間終了
							</button>
						`;
						try{
							const btn = row.querySelector('#timeLimitSummaryToggleBtn');
							if (btn && !btn.__boundTimeUpToggle) {
								btn.__boundTimeUpToggle = true;
								btn.addEventListener('click', () => {
									try{ window.__toggleTimeUpSummary && window.__toggleTimeUpSummary(); }catch(_ ){}
								});
							}
						}catch(_ ){}
					}
					return;
				}

				if (!st.active || !st.endAt || st.totalSec <= 0) {
					// Unlimited / inactive
					if (battleBtn) {
						battleBtn.style.display = '';
						try{ battleBtn.classList.remove('hidden'); }catch(_){}
					}
					if (row) {
						row.classList.remove('is-active');
						row.innerHTML = '';
					}
					return;
				}

				// Active
				if (battleBtn) {
					battleBtn.style.display = '';
					try{ battleBtn.classList.remove('hidden'); }catch(_){}
				}
				if (row) {
					row.classList.add('is-active');
					// Inner skeleton (timer + bar)
					row.innerHTML = `
						<span class="dockTimerLabel">⏳</span>
						<span id="battleTimeLimitTimer" class="dockTimerValue">00:00</span>
						<div class="dockTimerBar" aria-hidden="true">
							<div id="battleTimeLimitBarInner" class="dockTimerBarInner"></div>
						</div>
					`;
				}
			}catch(_){}
		};

		window.__onTimeLimitExpired = window.__onTimeLimitExpired || function(){
			try{
				if (window.__timeLimitInterval) {
					clearInterval(window.__timeLimitInterval);
					window.__timeLimitInterval = null;
				}
			}catch(_){}
			try{
				if (!window.__timeLimitState) window.__timeLimitState = {};
				window.__timeLimitState.active = false;
				window.__timeLimitState.expired = true;
			}catch(_){}
			try{ window.__applyTimeLimitUI && window.__applyTimeLimitUI(); }catch(_){}
			try{
				if (typeof showSubtitle === 'function') {
					showSubtitle('⏰ 制限時間終了', 1600);
				}
			}catch(_){}
		};

		window.__tickTimeLimit = window.__tickTimeLimit || function(){
			try{
				const st = window.__timeLimitState || {};
				if (!st.active || !st.endAt || st.totalSec <= 0) return;

				const msLeft = Number(st.endAt) - Date.now();
				const secLeft = Math.ceil(msLeft / 1000);

				if (secLeft <= 0) {
					window.__onTimeLimitExpired && window.__onTimeLimitExpired();
					return;
				}

				// Update UI
				const timerEl = document.getElementById('battleTimeLimitTimer');
				if (timerEl) timerEl.textContent = window.__formatTimeMMSS(secLeft);

				const inner = document.getElementById('battleTimeLimitBarInner');
				if (inner) {
					const ratio = Math.max(0, Math.min(1, secLeft / Math.max(1, st.totalSec)));
					inner.style.width = Math.round(ratio * 100) + '%';
				}
			}catch(_){}
		};

		window.__startTimeLimitChallenge = window.__startTimeLimitChallenge || function(totalSec){
			try{
				totalSec = Math.floor(Number(totalSec) || 0);
				if (!Number.isFinite(totalSec) || totalSec <= 0) {
					window.__clearTimeLimitRuntime && window.__clearTimeLimitRuntime(true);
					return;
				}

				// Ensure BattleDock exists (game screen only shows it)
				try{ window.__initBattleControlDock && window.__initBattleControlDock(); }catch(_){}
				try{ window.__refreshBattleControlDock && window.__refreshBattleControlDock(); }catch(_){}

				// Reset interval
				try{
					if (window.__timeLimitInterval) {
						clearInterval(window.__timeLimitInterval);
						window.__timeLimitInterval = null;
					}
				}catch(_){}

				window.__timeLimitState = {
					active: true,
					expired: false,
					totalSec: totalSec,
					endAt: Date.now() + totalSec * 1000
				};

				window.__applyTimeLimitUI && window.__applyTimeLimitUI();
				window.__tickTimeLimit && window.__tickTimeLimit();

				window.__timeLimitInterval = setInterval(() => {
					try{ window.__tickTimeLimit && window.__tickTimeLimit(); }catch(_){}
				}, 250);

				try{
					if (typeof showSubtitle === 'function') {
						const mm = Math.floor(totalSec/60);
						showSubtitle(`⏳ 制限時間：${mm}分`, 1200);
					}
				}catch(_){}

			}catch(e){
				console.warn('[TimeLimit] start failed', e);
			}
		};

		window.__restoreTimeLimitStateFromSave = window.__restoreTimeLimitStateFromSave || function(saved){
			try{
				if (!saved || typeof saved !== 'object') {
					window.__clearTimeLimitRuntime && window.__clearTimeLimitRuntime(true);
					return;
				}

				const totalSec = Math.floor(Number(saved.totalSec || 0));
				const endAt = (saved.endAt == null ? null : Number(saved.endAt));
				const expired = !!saved.expired;

				// If already expired in save, apply expired UI and block battles
				if (expired) {
					window.__timeLimitState = { active:false, expired:true, totalSec: totalSec || 0, endAt: endAt };
					try{ window.__initBattleControlDock && window.__initBattleControlDock(); }catch(_){}
					try{ window.__refreshBattleControlDock && window.__refreshBattleControlDock(); }catch(_){}
					window.__applyTimeLimitUI && window.__applyTimeLimitUI();
					return;
				}

				// Not active in save => treat as unlimited/inactive
				if (!saved.active || !endAt || !Number.isFinite(endAt) || totalSec <= 0) {
					window.__clearTimeLimitRuntime && window.__clearTimeLimitRuntime(true);
					return;
				}

				const secLeft = Math.ceil((endAt - Date.now()) / 1000);
				if (secLeft <= 0) {
					window.__timeLimitState = { active:false, expired:true, totalSec: totalSec, endAt: endAt };
					try{ window.__initBattleControlDock && window.__initBattleControlDock(); }catch(_){}
					try{ window.__refreshBattleControlDock && window.__refreshBattleControlDock(); }catch(_){}
					window.__applyTimeLimitUI && window.__applyTimeLimitUI();
					return;
				}

				// Resume with remaining time
				try{ window.__initBattleControlDock && window.__initBattleControlDock(); }catch(_){}
				try{ window.__refreshBattleControlDock && window.__refreshBattleControlDock(); }catch(_){}

				// Clear old interval
				try{
					if (window.__timeLimitInterval) {
						clearInterval(window.__timeLimitInterval);
						window.__timeLimitInterval = null;
					}
				}catch(_){}

				window.__timeLimitState = {
					active: true,
					expired: false,
					totalSec: totalSec,
					endAt: endAt
				};

				window.__applyTimeLimitUI && window.__applyTimeLimitUI();
				window.__tickTimeLimit && window.__tickTimeLimit();

				window.__timeLimitInterval = setInterval(() => {
					try{ window.__tickTimeLimit && window.__tickTimeLimit(); }catch(_){}
				}, 250);

			}catch(e){
				console.warn('[TimeLimit] restore failed', e);
			}
		};

		// Guard: If time is up, block battle start even if invoked indirectly
		try{
			if (!window.__timeLimitWrappedStartBattle && typeof window.startBattle === 'function') {
				window.__timeLimitWrappedStartBattle = true;
				const __origStartBattle = window.startBattle;
				window.startBattle = function(){
					try{
						if (window.__timeLimitState && window.__timeLimitState.expired) {
							try{ window.__applyTimeLimitUI && window.__applyTimeLimitUI(); }catch(_){}
							return;
						}
					}catch(_){}
					return __origStartBattle.apply(this, arguments);
				};
			}
		}catch(_){}

		// If dock refresh happens, re-apply (to ensure the row exists and stays aligned)
		try{
			if (!window.__timeLimitWrappedDockRefresh && typeof window.__refreshBattleControlDock === 'function') {
				window.__timeLimitWrappedDockRefresh = true;
				const __origRefresh = window.__refreshBattleControlDock;
				window.__refreshBattleControlDock = function(){
					const r = __origRefresh.apply(this, arguments);
					try{ window.__applyTimeLimitUI && window.__applyTimeLimitUI(); }catch(_){}
					return r;
				};
			}
		}catch(_){}

	}catch(e){
		console.warn('[TimeLimit] init failed', e);
	}
})();


// =====================================================
// Title Screen: "はじめから" -> New Game Panel (like "つづきから")
// =====================================================
window.resetTitleNewPanel = window.resetTitleNewPanel || function() {
  try {
    const btn = document.getElementById('startNewMenuBtn');
    const panel = document.getElementById('newPanel');
    const closeBtn = document.getElementById('newPanelCloseBtn');
    const continueBtn = document.getElementById('continueBtn');
    const loadPanel = document.getElementById('loadPanel');
    if (!btn || !panel) return;

    if (btn.__boundNewPanel) return;
    btn.__boundNewPanel = true;

    const openPanel = () => {
      try {
        // 初回限定：無料引き直しチケットを「はじめからパネルを開いた時点」で必ずアームする
        // （ガチャはタイトル画面内で行われるため、startNewGame() より前に有効化しておく）
        try{
          if (typeof window.__resetFirstRerollForNewGame === 'function') {
            window.__resetFirstRerollForNewGame();
          } else {
            window.__firstRerollArmed = true;
            window.__firstRerollState = { eligible:true, locked:false, shown:false, lastPath:null };
            try{
              const b = document.getElementById('firstRerollBtn');
              const n = document.getElementById('firstRerollNote');
              if (b) b.classList.add('hidden');
              if (n) n.classList.add('hidden');
            }catch(_e){}
          }
        }catch(_e){}

        // close continue panel if open
        if (typeof window.resetTitleLoadPanel === 'function') {
          try { window.resetTitleLoadPanel(); } catch(_) {}
        } else {
          try {
            if (loadPanel) { loadPanel.classList.add('is-collapsed'); loadPanel.classList.remove('is-open'); loadPanel.setAttribute('aria-hidden','true'); }
            if (continueBtn) continueBtn.style.display = '';
          } catch(_){}
        }

        btn.classList.add('is-swapping');
        const ms = 220;
        window.__uiSetTimeout(() => {
          try { btn.style.display = 'none'; } catch(_){}
          panel.classList.remove('is-collapsed');
          panel.classList.add('is-open');
          panel.setAttribute('aria-hidden', 'false');
        }, ms);
      } catch(_){}
    };

    const closePanel = () => {
      try {
        panel.classList.add('is-collapsed');
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        window.__uiSetTimeout(() => {
          try { btn.style.display = ''; } catch(_){}
          btn.classList.remove('is-swapping');
        }, 30);
      } catch(_){}
    };

    btn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    // If user taps outside inner panel, close it (optional, safe)
    panel.addEventListener('click', (e) => {
      if (e.target === panel) closePanel();
    });

  } catch (e) {
    console.warn('resetTitleNewPanel error', e);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  try { if (typeof window.resetTitleNewPanel === 'function') window.resetTitleNewPanel(); } catch(_){}
});

/* =========================================================
   TimeLimit (when expired) : Full-screen score summary (V1)
   - Shows which minute-mode was played, the scoreOverlay content,
     and sum of all maxScores, in a responsive table.
   ========================================================= */
(function(){
	try{
		if (window.__timeUpSummaryV1) return;
		window.__timeUpSummaryV1 = true;

		function fmtHuge(v){
			// Returns {disp, full}
			try{
				if (v == null) return {disp:'-', full:'-'};
				if (typeof v === 'bigint') {
					const full = v.toString();
					return {disp: full.length>24 ? (full.slice(0,12)+'…'+full.slice(-8)) : full, full: full};
				}
				if (typeof v === 'number') {
					if (!Number.isFinite(v)) return {disp: String(v), full: String(v)};
					const full = String(v);
					// If very large, use exponential for display but keep full in title
					let disp = '';
					if (Math.abs(v) >= 1e21) {
						disp = v.toExponential(6);
					} else {
						try{ disp = v.toLocaleString('ja-JP'); }catch(_){ disp = full; }
					}
					// Avoid layout break by shortening too-long display
					if (disp.length > 28) disp = disp.slice(0,14) + '…' + disp.slice(-10);
					return {disp: disp, full: full};
				}
				// string or others
				const s = String(v);
				return {disp: s.length>28 ? (s.slice(0,14)+'…'+s.slice(-10)) : s, full: s};
			}catch(_){
				return {disp: '-', full:'-'};
			}
		}

		function ensureOverlay(){
			let root = document.getElementById('timeUpSummaryOverlay');
			if (root) return root;

			root = document.createElement('div');
			root.id = 'timeUpSummaryOverlay';
			root.className = 'timeup-summary-overlay';
			root.innerHTML = `
				<div class="timeup-summary-backdrop" data-close="1"></div>
				<div class="timeup-summary-panel" role="dialog" aria-modal="true" aria-label="制限時間終了 結果">
					<div class="timeup-summary-head">
						<div class="timeup-summary-title">⏰ 制限時間終了 結果</div>
						<button class="timeup-summary-close" type="button" aria-label="閉じる" data-close="1">×</button>
					</div>
					<div class="timeup-summary-body">
						<div class="timeup-summary-hint">※数値が大きい場合は、スコア欄を横スクロールできます</div>
						<div class="timeup-summary-tablewrap">
							<table class="timeup-summary-table">
								<thead>
									<tr>
										<th class="col-label">項目</th>
										<th class="col-value">値</th>
									</tr>
								</thead>
								<tbody id="timeUpSummaryTbody"></tbody>
							</table>
						</div>
						<div class="timeup-summary-foot">
							<button class="timeup-summary-ok" type="button" data-close="1">OK</button>
						</div>
					</div>
				</div>
			`;
			document.body.appendChild(root);

			// close behavior
			root.addEventListener('click', (e) => {
				try{
					const t = e.target;
					if (!t) return;
					if (t && t.getAttribute && t.getAttribute('data-close') === '1') {
						window.__hideTimeUpSummary && window.__hideTimeUpSummary();
					}
				}catch(_){}
			});
			document.addEventListener('keydown', (e) => {
				try{
					if (!root.classList.contains('is-open')) return;
					if (e.key === 'Escape') window.__hideTimeUpSummary && window.__hideTimeUpSummary();
				}catch(_){}
			});
			return root;
		}

		window.__hideTimeUpSummary = window.__hideTimeUpSummary || function(){
			try{
				const root = document.getElementById('timeUpSummaryOverlay');
				if (!root) return;
				root.classList.remove('is-open');
			}catch(_){}
		};

		window.__showTimeUpSummary = window.__showTimeUpSummary || function(){
			try{
				const st = window.__timeLimitState || {};
				// Avoid showing multiple times
				if (st && st.__summaryShown) return;
				if (st) st.__summaryShown = true;

				// Stop autobattle if still running (safety)
				try{ if (typeof window.stopAutoBattle === 'function') window.stopAutoBattle(); }catch(_){}

				const root = ensureOverlay();
				const tbody = root.querySelector('#timeUpSummaryTbody');
				if (!tbody) return;

				const totalSec = Math.max(0, Math.floor(Number(st.totalSec || 0)));
				const mm = totalSec ? Math.max(1, Math.round(totalSec / 60)) : 0;
				const modeLabel = totalSec ? `${mm}分` : '（不明）';

				// ★途中強制算出：現在進行中の「戦闘回数モード」のスコアを計算して一覧に追加
				//  - 無制限（unlimited）は対象外
				let forced = null; // { target, score, replaced, prev }
				try{
					const validTargets = [100, 200, 500, 1000, 5000, 10000];
					const target = Number(window.targetBattles);
					if (validTargets.includes(target)) {
						const p = (typeof window.player === 'object' && window.player) ? window.player : ((typeof player === 'object' && player) ? player : null);
						const maxStreak = (typeof window.sessionMaxStreak === 'number') ? window.sessionMaxStreak :
							((typeof sessionMaxStreak === 'number') ? sessionMaxStreak :
								((typeof window.currentStreak === 'number') ? window.currentStreak : 0));
						let finalAtk = (p ? (Number(p.attack) || Number(p.atk) || 0) : 0);
						let finalDef = (p ? (Number(p.defense) || Number(p.def) || 0) : 0);
						let finalSpd = (p ? (Number(p.speed) || Number(p.spd) || 0) : 0);
						let finalHP  = (p ? (Number(p.maxHp) || Number(p.hp) || 0) : 0);
						try{ const es=(window.__timeLimitState&&window.__timeLimitState.expireSnapshot)||null; if(es){ if(!finalAtk) finalAtk=Number(es.attack||es.atk)||finalAtk; if(!finalDef) finalDef=Number(es.defense||es.def)||finalDef; if(!finalSpd) finalSpd=Number(es.speed||es.spd)||finalSpd; if(!finalHP) finalHP=Number(es.maxHp||es.hp)||finalHP; } }catch(_){ }

						// 所持魔道具の総レアリティ（ドロップ率の逆数の合計）
						let totalRarity = 0;
						try{
							if (p && p.itemMemory && p.itemMemory.length > 0 &&
								typeof itemAdjectives !== 'undefined' && typeof itemNouns !== 'undefined' && typeof itemColors !== 'undefined') {
								for (const item of (p.itemMemory || ((window.__timeLimitState&&window.__timeLimitState.expireSnapshot)?window.__timeLimitState.expireSnapshot._itemMemory:null) || [])) {
									const adjDef = itemAdjectives.find(a => a.word === item.adjective);
									const nounDef = itemNouns.find(n => n.word === item.noun);
									const colorDef = itemColors.find(c => c.word === item.color);
									let dropRate = 1;
									if (colorDef && colorDef.dropRateMultiplier) dropRate *= colorDef.dropRateMultiplier;
									if (adjDef && adjDef.dropRate) dropRate *= adjDef.dropRate;
									if (nounDef && nounDef.dropRateMultiplier) dropRate *= nounDef.dropRateMultiplier;
									if (dropRate < 1e-9) dropRate = 1e-9; // ゼロ除算防止
									totalRarity += (1 / dropRate);
								}
							}
						}catch(_){ totalRarity = 0; }

						const score = Math.round((finalAtk + finalDef + finalSpd + finalHP * 0.1 + totalRarity) * (maxStreak || 0));

						
						if (window.__timeUpDebug) try{ console.log('[TimeUpDBG_forced]', {target: target, finalAtk: finalAtk, finalDef: finalDef, finalSpd: finalSpd, finalHP: finalHP, maxStreak: maxStreak, totalRarity: totalRarity, score: score}); }catch(_){ }
// 最高スコア更新（無制限を除く）
						if (!window.maxScores) window.maxScores = {};
						const prev = (window.maxScores[target] != null) ? window.maxScores[target] : null;
						let replaced = false;
						if (prev === null || score > prev) {
							window.maxScores[target] = score;
							replaced = true;
							try{ if (typeof updateScoreOverlay === 'function') updateScoreOverlay(); }catch(_){}
						}
						forced = { target, score, replaced, prev };
					}
				}catch(_){}

				// Collect scores
				const entries = [100, 200, 500, 1000, 5000, 10000];
				let sum = 0;
				for (const n of entries) {
					const v = (window.maxScores && window.maxScores[n] != null) ? window.maxScores[n] : 0;
					if (typeof v === 'number' && Number.isFinite(v)) sum += v;
					// BigInt not expected here, but if someone changed it:
					if (typeof v === 'bigint') {
						try{ sum = (BigInt(sum) + v); }catch(_){}
					}
				}

				function row(label, valueHtml){
					const tr = document.createElement('tr');
					const tdL = document.createElement('td');
					tdL.className = 'cell-label';
					tdL.textContent = label;

					const tdV = document.createElement('td');
					tdV.className = 'cell-value';
					tdV.innerHTML = valueHtml;

					tr.appendChild(tdL);
					tr.appendChild(tdV);
					return tr;
				}

				tbody.innerHTML = '';
				tbody.appendChild(row('挑戦モード（制限時間）', `<div class="valueWrap"><span class="num" title="${modeLabel}">${modeLabel}</span></div>`));

				// 途中強制算出の行（無制限は出ない）
				if (forced && typeof forced.score !== 'undefined') {
					const fNow = fmtHuge(forced.score);
					const tag = forced.replaced ? '<span class="tinyNote">（最高更新）</span>' : '<span class="tinyNote">（最高未更新）</span>';
					tbody.appendChild(row(`${forced.target}戦 途中スコア`, `<div class="valueWrap"><span class="num" title="${String(fNow.full).replace(/"/g,'&quot;')}">${fNow.disp}</span>${tag}</div>`));
				}
for (const n of entries) {
					const raw = (window.maxScores && window.maxScores[n] != null) ? window.maxScores[n] : 0;
					const f = fmtHuge(raw);
					tbody.appendChild(row(`${n}戦 最高スコア`, `<div class="valueWrap"><span class="num" title="${String(f.full).replace(/"/g,'&quot;')}">${f.disp}</span></div>`));
				}

				const sumF = fmtHuge(sum);
				tbody.appendChild(row('すべて合計（上記スコアの合計）', `<div class="valueWrap sum"><span class="num" title="${String(sumF.full).replace(/"/g,'&quot;')}">${sumF.disp}</span></div>`));

				root.classList.add('is-open');

				// Focus OK for accessibility
				try{
					const ok = root.querySelector('.timeup-summary-ok');
					if (ok) ok.focus();
				}catch(_){}
			}catch(e){
				console.warn('[TimeUpSummary] failed', e);
			}
		};

		// Allow reopening/closing the summary overlay anytime.
		// - __showTimeUpSummary is "show once" (auto popup when time is up)
		// - __openTimeUpSummary bypasses the once-guard
		window.__openTimeUpSummary = window.__openTimeUpSummary || function(){
			try{
				const st = window.__timeLimitState || {};
				// bypass "show once" guard safely
				try{ if (st) st.__summaryShown = false; }catch(_){ }
				try{ window.__showTimeUpSummary && window.__showTimeUpSummary(); }catch(_){ }
				try{ if (st) st.__summaryShown = true; }catch(_){ }
			}catch(_){ }
		};

		window.__toggleTimeUpSummary = window.__toggleTimeUpSummary || function(){
			try{
				const root = document.getElementById('timeUpSummaryOverlay');
				if (root && root.classList.contains('is-open')) {
					try{ window.__hideTimeUpSummary && window.__hideTimeUpSummary(); }catch(_){ }
					return;
				}
				try{ window.__openTimeUpSummary && window.__openTimeUpSummary(); }catch(_){ }
			}catch(_){ }
		};

		// Hook: time-limit expires -> capture snapshot BEFORE original handler (it may reset player), then show summary.
		const __origExpire = window.__onTimeLimitExpired;
		window.__onTimeLimitExpired = function(){
			try{
				window.__timeLimitState = window.__timeLimitState || {};
				const pLive = (window.__activePlayerRef || (typeof player!=='undefined'?player:null) || window.player || null);
				const s = window.__timeLimitState.expireSnapshot = (window.__timeLimitState.expireSnapshot || {});

					// activeSnapFallback
					const as = window.__activePlayerSnap || null;
				if (pLive){
					s.attack = Number(pLive.attack || pLive.atk || 0) || 0;
					s.defense = Number(pLive.defense || pLive.def || 0) || 0;
					s.speed = Number(pLive.speed || pLive.spd || 0) || 0;
					s.maxHp = Number(pLive.maxHp || pLive.hp || 0) || 0;
					s.itemMemoryLen = (pLive.itemMemory && pLive.itemMemory.length) ? pLive.itemMemory.length : 0;
					// keep a reference for rarity calc if needed
					s._itemMemory = pLive.itemMemory || null;
				}
				try{

					try{
						if (as){
							if (!s.attack && as.attack) s.attack = Number(as.attack)||0;
							if (!s.defense && as.defense) s.defense = Number(as.defense)||0;
							if (!s.speed && as.speed) s.speed = Number(as.speed)||0;
							if (!s.maxHp && as.maxHp) s.maxHp = Number(as.maxHp)||0;
							if (!s.itemMemoryLen && as.itemMemoryLen) s.itemMemoryLen = as.itemMemoryLen;
							if (!s._itemMemory && as._itemMemory) s._itemMemory = as._itemMemory;
							if (!s.name && as.name) s.name = as.name;
						}
					}catch(_){}
					s.sessionMaxStreak = Math.max(Number(window.sessionMaxStreak)||0, Number((typeof sessionMaxStreak!=='undefined')?sessionMaxStreak:0)||0, Number(window.maxStreak)||0);
				}catch(_){}
				try{
					if (window.__timeUpDebug) console.log('[TimeUpDBG_expireSnapshot]', { usingActiveRef: !!window.__activePlayerRef, keys: pLive ? Object.keys(pLive).slice(0,40) : null, snap: s });
				}catch(_){}
			}catch(e){
				if (window.__timeUpDebug) try{ console.log('[TimeUpDBG_expireSnapshot_error]', String(e)); }catch(_){}
			}
			if (window.__timeUpDebug) try{ console.log('[TimeUpDBG_forced_enter]'); }catch(_){}
			try{ window.__showTimeUpSummary && window.__showTimeUpSummary(); }catch(e){ if (window.__timeUpDebug) try{ console.log('[TimeUpDBG_showSummary_error]', String(e)); }catch(_){ } }
			try{ if (typeof __origExpire === 'function') __origExpire(); }catch(_){}
		};

	}catch(e){
		console.warn('[TimeUpSummary] init failed', e);
	}
})();
