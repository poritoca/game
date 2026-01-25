'use strict';
function drawCombinedSkillList() {
	const list = document.getElementById("combinedSkillList");
	if (!player || !player.mixedSkills || !list) return;

	list.innerHTML = "";

	function describeMixedEffectScaled(skill, eff) {
		if (!eff) return null;

		const type = Number(eff.type);
		const base = Number(eff.baseValue ?? eff.value ?? eff.amount ?? eff.ratio ?? 0);
		const scaledRaw = (typeof getScaledMixedSpecialEffectValue === "function") ?
			getScaledMixedSpecialEffectValue(skill, eff) :
			base;

		const scaled = Number(scaledRaw);

		const fmtPct = (v) => `${(Math.round(v * 10) / 10)}%`;
		const fmtMul = (v) => `${(Math.round(v * 1000) / 1000)}倍`;

		const isPct = (type >= 1 && type <= 3);
		const baseTxt = isPct ? fmtPct(base) : fmtMul(base);
		const scaledTxt = isPct ? fmtPct(scaled) : fmtMul(scaled);

		const showArrow = (isFinite(base) && isFinite(scaled) && Math.abs(base - scaled) > 1e-9);
		const suffix = showArrow ? `: ${baseTxt} → ${scaledTxt}` : `: ${baseTxt}`;

		switch (type) {
			case 1:
				return `敵残HP%ダメージ${suffix}`;
			case 2:
				return `復活HP%${suffix}`;
			case 3:
				return `毒/火傷吸収(即時回復)%${suffix}`;
			case 4:
				return `攻撃倍率(所持時)${suffix}`;
			case 5:
				return `防御倍率(所持時)${suffix}`;
			case 6:
				return `速度倍率(所持時)${suffix}`;
			case 7:
				return `最大HP倍率(所持時)${suffix}`;
			default:
				return `不明な効果 type=${type}${suffix}`;
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
		const effects = Array.isArray(skill.specialEffects) ?
			skill.specialEffects :
			(skill.specialEffectType != null ? [{ type: skill.specialEffectType, value: skill.specialEffectValue }] : []);

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
			recentQueue: [], // 直近の使用履歴（名前配列）
			lastName: null, // 直前に使ったスキル名
			lastStreak: 0 // 直前スキルの連続回数
		};
	}
	const state = actor._skillPickState;

	const usableSkills = (actor.skills || []).filter(skill => {
		if (!skill || typeof skill !== 'object') return false;
		const data = skillPool.find(s => s.name === skill.name);
		const isPassive = data?.category === 'passive';
		const isMixedCategory = data?.category === 'mixed';
		// 特殊スキルは通常スキルとしての効果が無い（特殊効果は戦闘開始時に別処理）ため、選択対象から除外
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
	const RECENT_LIMIT = 6; // 直近何回分を見るか
	const RECENT_PENALTY = 0.65; // 直近にあるほど重みが落ちる係数（1回なら /1.65）
	const STREAK_BASE = 0.35; // 連続使用は STREAK_BASE^(streak) を掛ける（1回連続=0.35, 2回連続=0.1225...）
	const MIN_WEIGHT = 0.02; // 0にしない下限（完全固定を防ぐため）

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
			toggle.textContent = isVisible ? '▶ 魔道具・スキル表示／非表示' : '▼ 魔道具・スキル表示／非表示';
		});
	}
	const eventSettingsToggleBtn = document.getElementById('eventSettingsToggle');
	const eventSettingsContentBox = document.getElementById('eventSettingsContent');

	if (eventSettingsToggleBtn && eventSettingsContentBox) {
		eventSettingsToggleBtn.addEventListener('click', () => {
			const isCurrentlyVisible = eventSettingsContentBox.style.display !== 'none';
			eventSettingsContentBox.style.display = isCurrentlyVisible ? 'none' : 'block';
			eventSettingsToggleBtn.textContent = isCurrentlyVisible ?
				'▶ イベント＆入手設定を表示／非表示' :
				'▼ イベント＆入手設定を表示／非表示';
		});
	}



	// === 魔メイクUIの構築 ===

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


	// 魔メイクボタンイベント登録
	const gachaBtn = document.getElementById('faceGachaBtn');
	if (gachaBtn) {
		gachaBtn.addEventListener('click', () => {

			window.__battleSetTimeout(() => {
				performFaceGacha(); // 1.5秒後に魔メイク処理を実行
			}, 100);
		});
	}

	// 初期表示更新（ロードや開始時）
	updateFaceUI?.();
	updatePlayerImage?.();
	update魔通貨Display?.();
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
	const power = 30; // 分布の鋭さ
	const max = 5; // 上限倍率
	return 1.0 + (max - 1.0) * Math.pow(1 - seed, power);
}

function onItemClick(item, index, event) {
	clearEventPopup();

	const name = `${item.color}${item.adjective}${item.noun}`;
	const popup = document.getElementById("eventPopup");
	const title = document.getElementById("eventPopupTitle");
	const container = document.getElementById("eventPopupOptions");

	title.innerHTML = `魔道具 <b>${name}</b> をどうする？`;

	// 現在の保護状況（上限は魔メイク効果で増える場合あり）
	const itemProtectLimit = (typeof window.getItemProtectLimit === 'function') ? window.getItemProtectLimit() : 3;
	const itemProtectedCount = (player && Array.isArray(player.itemMemory)) ? player.itemMemory.filter(it => it && it.protected).length : 0;
	const itemProtectInfo = document.createElement("div");
	itemProtectInfo.style.fontSize = "12px";
	itemProtectInfo.style.opacity = "0.9";
	itemProtectInfo.style.marginBottom = "10px";
	itemProtectInfo.innerHTML = `保護中：<b>${itemProtectedCount}</b> / ${itemProtectLimit}`;
	container.appendChild(itemProtectInfo);


	const protectBtn = document.createElement("button");
	protectBtn.textContent = item.protected ? "保護を外す" : "保護する";
	protectBtn.onclick = () => {
				// 現在の保護中魔道具数を数える
		const currentProtected = (player && Array.isArray(player.itemMemory)) ? player.itemMemory.filter(it => it && it.protected).length : 0;
		const limit = (typeof window.getItemProtectLimit === 'function') ? window.getItemProtectLimit() : 3;

		// これから保護を付ける場合のみ、上限チェック
		if (!item.protected && currentProtected >= limit) {
			const msg = `魔道具の保護は最大 ${limit} 個までです。`;
			if (typeof showAlertMessage === 'function') {
				showAlertMessage(msg);
			} else {
				alert(msg);
			}
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
			showCustomAlert("この魔道具は保護されています", 2000);
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

	const name = (skill && skill.name) ? skill.name : "特殊スキル";
	title.innerHTML = `特殊スキル <b>${name}</b> をどうする？`;

	// 現在の保護状況（上限は魔メイク効果で増える場合あり）
	const protectLimit = (typeof window.getSpecialSkillProtectLimit === 'function') ? window.getSpecialSkillProtectLimit() : 1;
	const protectedCount = (player && Array.isArray(player.mixedSkills)) ? player.mixedSkills.filter(s => s && s.isProtected).length : 0;

	const info = document.createElement("div");
	info.style.fontSize = "12px";
	info.style.opacity = "0.9";
	info.style.marginBottom = "10px";
	info.innerHTML = `保護中：<b>${protectedCount}</b> / ${protectLimit}`;
	container.appendChild(info);
// NOTE: 「効果詳細」メニューは廃止（特殊スキル一覧に常時表示へ）。

	const protectBtn = document.createElement("button");
	protectBtn.textContent = skill && skill.isProtected ? "保護を外す" : "保護する";
	protectBtn.onclick = () => {
		const limit = (typeof window.getSpecialSkillProtectLimit === 'function') ? window.getSpecialSkillProtectLimit() : 1;
		const protectedList = (player && Array.isArray(player.mixedSkills)) ? player.mixedSkills.filter(s => s && s.isProtected) : [];

		if (!skill) {
			clearEventPopup();
			try { updateMixedSkillProtectionUI && updateMixedSkillProtectionUI(); } catch (e) {}
			return;
		}

		// 解除
		if (skill.isProtected) {
			skill.isProtected = false;
			showCustomAlert("保護を解除しました", 1200);
			clearEventPopup();
			try { updateMixedSkillProtectionUI && updateMixedSkillProtectionUI(); } catch (e) {}
			return;
		}

		// 追加保護（上限チェック）
		if (protectedList.length >= limit) {
			// 上限1の場合は「移し替え」を許可（旧挙動互換）
			if (limit === 1 && protectedList[0] && protectedList[0] !== skill) {
				protectedList[0].isProtected = false;
			} else {
				showCustomAlert(`保護は${limit}つまでです`, 2000);
				return;
			}
		}

		skill.isProtected = true;
		showCustomAlert("保護しました", 1200);
		clearEventPopup();
		try { updateMixedSkillProtectionUI && updateMixedSkillProtectionUI(); } catch (e) {}
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


// --- 所持魔道具リストをUIに表示・更新する関数 ---

function updateFaceUI() {
	const listElem = document.getElementById('ownedFaceList');
	if (!listElem) return;

	// window.faceItemEquipped とローカル faceItemEquipped を同期（ロード直後などのズレ対策）
	try {
		if (typeof window.faceItemEquipped !== 'undefined') {
			faceItemEquipped = normalizeFacePath(window.faceItemEquipped);
		} else {
			window.faceItemEquipped = (typeof faceItemEquipped !== 'undefined') ? normalizeFacePath(faceItemEquipped) : null;
		}
	} catch (_e) {}

	listElem.innerHTML = ''; // 既存内容をクリア
	if (!Array.isArray(faceItemsOwned)) faceItemsOwned = [];

	// 1つ開いたら他は閉じる：どのパスを開いているか
	window.__magicMakeOpenDetailPath = window.__magicMakeOpenDetailPath || null;

	faceItemsOwned.forEach(itemPath => {
		// 100%: 必ずボーナスを用意
		const bonus = __ensureFaceBonus(itemPath);
		const rarity = bonus?.rarity || __getRarityFromFacePath(itemPath);

		const container = document.createElement('div');
		container.style.display = 'flex';
		container.style.flexDirection = 'column';
		container.style.gap = '6px';
		container.style.marginBottom = '10px';
		container.style.padding = '10px';
		container.style.borderRadius = '14px';
		container.style.border = '1px solid rgba(255,255,255,0.12)';
		container.style.background = 'rgba(0,0,0,0.18)';
		container.style.backdropFilter = 'blur(6px)';
		container.style.webkitBackdropFilter = 'blur(6px)';

		const top = document.createElement('div');
		top.style.display = 'flex';
		top.style.alignItems = 'center';
		top.style.gap = '10px';

		// 魔道具画像サムネイル
		const img = document.createElement('img');
		img.src = resolveAssetPath(itemPath);
		img.style.width = '52px';
		img.style.height = '52px';
		img.style.borderRadius = '12px';
		img.style.objectFit = 'cover';

		// 装備中なら枠を強調
		if (faceItemEquipped === itemPath) {
			img.style.border = '2px solid rgba(255,215,0,0.95)';
			img.style.boxShadow = '0 0 16px rgba(255,215,0,0.30)';
		} else {
			img.style.border = '1px solid rgba(255,255,255,0.18)';
			img.style.boxShadow = '0 0 12px rgba(0,0,0,0.35)';
		}
		top.appendChild(img);

		// 名前＋簡易ラベル
		const meta = document.createElement('div');
		meta.style.flex = '1';

		const nameLine = document.createElement('div');
		nameLine.style.fontWeight = '700';
		nameLine.style.letterSpacing = '0.3px';
		const shortName = itemPath.split('/').pop();
		nameLine.textContent = `${shortName} [${rarity}]`;
		meta.appendChild(nameLine);

		// --- ボーナスタグ表示（成長率 / ドロ率 / 保護数） ---
		const bonusWrap = document.createElement('div');
		bonusWrap.style.display = 'flex';
		bonusWrap.style.flexWrap = 'wrap';
		bonusWrap.style.gap = '4px';
		bonusWrap.style.marginTop = '4px';
		bonusWrap.style.fontSize = '12px';

		function addTag(text, bg) {
			const t = document.createElement('span');
			t.textContent = text;
			t.style.padding = '2px 6px';
			t.style.borderRadius = '6px';
			t.style.background = bg;
			t.style.color = '#000';
			t.style.fontWeight = 'bold';
			t.style.opacity = '0.9';
			bonusWrap.appendChild(t);
		}

		// 成長率（魔メイクは100%付与）
		if (bonus && bonus.growthRates) {
			addTag('成長率+', '#9be7ff'); // 水色
		}

		// ドロップ率（倍率が 1 を超える場合のみ）
		if (bonus && Number(bonus.dropRateMultiplier || 1) > 1) {
			addTag(`ドロ率×${Number(bonus.dropRateMultiplier).toFixed(3)}`, '#ffe28a'); // 金色
		}

		// 特殊スキル保護
		if (bonus && Number(bonus.protectSkillAdd || 0) > 0) {
			addTag(`スキ保+${bonus.protectSkillAdd}`, '#ffb3d9'); // ピンク
		}

		// アイテム保護
		if (bonus && Number(bonus.protectItemAdd || 0) > 0) {
			addTag(`アイ保+${bonus.protectItemAdd}`, '#baffc9'); // ミント
		}

		if (bonusWrap.children.length > 0) {
			meta.appendChild(bonusWrap);
		}
		top.appendChild(meta);

		container.appendChild(top);

		// ボタン列
		const btnRow = document.createElement('div');
		btnRow.style.display = 'flex';
		btnRow.style.gap = '8px';

		// 装備/解除ボタン
		const equipBtn = document.createElement('button');
		equipBtn.className = 'magicmake-btn';
		equipBtn.innerText = (faceItemEquipped === itemPath) ? '解除' : '装備';
		equipBtn.addEventListener('click', () => {
			if (faceItemEquipped === itemPath) {
				faceItemEquipped = null;
			try{ window.faceItemEquipped = faceItemEquipped; }catch(_e){}
				document.getElementById('faceItemDisplayImg')?.remove();
				document.getElementById('faceItemGlowBg')?.remove();
			} else {
				// 他の装備を解除（背景・画像を消去）
				document.getElementById('faceItemDisplayImg')?.remove();
				document.getElementById('faceItemGlowBg')?.remove();
				faceItemEquipped = normalizeFacePath(itemPath);
			try{ window.faceItemEquipped = faceItemEquipped; }catch(_e){}
			}
			updateFaceUI();
			updatePlayerImage();
		});
		btnRow.appendChild(equipBtn);

		// 詳細ボタン（アコーディオン）
		const detailBtn = document.createElement('button');
		detailBtn.className = 'magicmake-btn';
		detailBtn.innerText = (window.__magicMakeOpenDetailPath === itemPath) ? '詳細▲' : '詳細▼';
		detailBtn.addEventListener('click', () => {
			window.__magicMakeOpenDetailPath = (window.__magicMakeOpenDetailPath === itemPath) ? null : itemPath;
			updateFaceUI();
		});
		btnRow.appendChild(detailBtn);

		// 削除ボタン
		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'magicmake-btn danger';
		deleteBtn.innerText = '削除';
		deleteBtn.addEventListener('click', () => {
			const idx = faceItemsOwned.indexOf(itemPath);
			if (idx !== -1) faceItemsOwned.splice(idx, 1);
			if (faceItemEquipped === itemPath) {
				faceItemEquipped = null;
			try{ window.faceItemEquipped = faceItemEquipped; }catch(_e){}
				document.getElementById('faceItemDisplayImg')?.remove();
				document.getElementById('faceItemGlowBg')?.remove();
			}
			// bonus mapも削除
			if (window.faceItemBonusMap && window.faceItemBonusMap[itemPath]) delete window.faceItemBonusMap[itemPath];

			updateFaceUI();
			updatePlayerImage();
		});
		btnRow.appendChild(deleteBtn);

		container.appendChild(btnRow);

		// 詳細パネル
		const detailPanel = document.createElement('div');
		detailPanel.className = 'magicmake-detail';
		detailPanel.style.display = (window.__magicMakeOpenDetailPath === itemPath) ? 'block' : 'none';
		if (detailPanel.style.display === 'block') {
			const fn = (window && typeof window.renderMagicMakeDetails === 'function') ? window.renderMagicMakeDetails : null;
			if (!fn) {
				detailPanel.textContent = '詳細描画関数が見つかりません。';
			} else {
				fn(itemPath, detailPanel);
			}
		}
		container.appendChild(detailPanel);

		listElem.appendChild(container);
	});

	// 魔通貨数を更新（UIに反映）
	const coinElem = document.getElementById('faceCoinCount');
	if (coinElem) coinElem.innerText = faceCoins;

	const gachaBtn = document.getElementById('faceGachaBtn');
	if (gachaBtn) gachaBtn.disabled = faceCoins < FACE_GACHA_COST;
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
		case 'S':
			imgElement.classList.add('rarity-s');
			break;
		case 'A':
			imgElement.style.filter = 'drop-shadow(0 0 10px #FFD700)';
			break;
		case 'B':
			imgElement.style.filter = 'drop-shadow(0 0 8px #3399ff)';
			break;
		case 'C':
			imgElement.style.filter = 'drop-shadow(0 0 6px #33cc33)';
			break;
		case 'D':
			imgElement.style.filter = 'drop-shadow(0 0 4px #999999)';
			break;
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
// 右上固定：魔メイク（faceOverlay）の同期
//  - 装備/解除・ロード復元・初回ガチャ厳選などで状態が変わっても確実に反映
// ------------------------
window.syncFaceOverlay = window.syncFaceOverlay || function() {
	try {
		const el = document.getElementById('faceOverlay');
		if (!el) return;
		const path = (typeof window.faceItemEquipped !== 'undefined') ? window.faceItemEquipped : null;
		if (path) {
			try { el.src = path; } catch (_e) {}
			try { el.classList.remove('hidden'); } catch (_e) {}
			try { el.style.opacity = '1'; } catch (_e) {}
		} else {
			try { el.classList.add('hidden'); } catch (_e) {}
			try { el.removeAttribute('src'); } catch (_e) {}
			try { el.style.opacity = '0'; } catch (_e) {}
		}
	} catch (_e) {}
};

// 初期表示も反映（ロード直後に装備があるケース）
try {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			try { window.syncFaceOverlay && window.syncFaceOverlay(); } catch (_e) {}
		});
	} else {
		try { window.syncFaceOverlay && window.syncFaceOverlay(); } catch (_e) {}
	}
} catch (_e) {}

// ------------------------
// 画像更新関数（差し替え）
// ------------------------
function updatePlayerImage() {
	const canvas = document.getElementById('playerCanvas');
	ensureGlowBorderStyle();
	const bg = ensureFaceItemGlowBackground(canvas);
	startFaceItemGlowAnimation();

	// -------------------------
	// faceItemEquipped の参照ズレ対策
	//  - window.faceItemEquipped とローカル faceItemEquipped が別参照になると
	//    faceOverlay が表示されない（装備しているのに hidden/画像未反映）
	// -------------------------
	try {
		if (typeof window.faceItemEquipped !== 'undefined') {
			faceItemEquipped = normalizeFacePath(window.faceItemEquipped);
		} else {
			window.faceItemEquipped = (typeof faceItemEquipped !== 'undefined') ? normalizeFacePath(faceItemEquipped) : null;
		}
	} catch (_e) {}

	// =========================
	// Face overlay（右上固定の魔メイク表示）を同期
	//  - ガチャ/装備の状態更新時に hidden のままだと表示されないため
	// =========================
	try {
		if (typeof window.syncFaceOverlay === 'function') {
			window.syncFaceOverlay();
		}
	} catch (_e) {}

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
			// 既に魔メイク画像がある場合でも、下の素体(canvas)は表示しない。
			// （ここが 'block' だと、魔メイク画像(①)の下に素体画像(②)が重なって二重表示になる）
			canvas.style.display = 'none';
		}

		img.src = resolveAssetPath(faceItemEquipped);
		const rarity = faceItemEquipped.match(/[SABCD]/)?.[0];
		applyFaceItemEffects(img, rarity);
	} else {
		if (canvas) canvas.style.display = 'block';
		document.getElementById('faceItemDisplayImg')?.remove();
		document.getElementById('faceItemGlowBg')?.remove();
	}

	// 念のため最後にも同期（装備解除時のhidden反映）
	try {
		if (typeof window.syncFaceOverlay === 'function') {
			window.syncFaceOverlay();
		}
	} catch (_e) {}
}

// ------------------------
// スクロール時の非表示・復帰
// ------------------------
let scrollTimeout;
window.addEventListener('scroll', () => {
	document.getElementById('faceOverlay')?.classList.add('hidden');
	clearTimeout(scrollTimeout);
	scrollTimeout = window.__battleSetTimeout(() => {
		if (((typeof window.faceItemEquipped !== 'undefined') ? window.faceItemEquipped : faceItemEquipped)) {
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
	(function() {

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

	// フィルターが1つ以上有効な場合、合致しない魔道具はスキップ
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
	let message = `新魔道具入手！ ${itemName}（${newItem.skillName}）`;
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
// - HP割合差が小さいほど、レア寄りの魔道具を付与
// - 2%差以内で発生（tier: 1=〜2%, 2=〜1%, 3=〜0.5%）
// -------------------------
function grantClutchRewardItem(tier, absDiffRatio, log) {
	try {
		if (!player) return;
		if (!player.itemMemory) player.itemMemory = [];
		if (player.itemMemory.length >= 10) {
			if (log) log.push(`【クラッチ報酬】魔道具枠が満杯のため獲得できませんでした（最大10個）`);
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
				try { w = Number(weightFn(v)); } catch (e) { w = 0; }
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
		const nounData = pickWeighted(itemNouns, n => Math.pow(1 / Math.max(0.01, (n.dropRateMultiplier || 1)), exp));

		const adjective = pickItemAdjectiveWithNoun(nounData);
		if (!adjective) return;

		// フィルターが1つ以上有効な場合、合致しない魔道具はスキップ（既存仕様に合わせる）
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
		if (log) log.push(`【クラッチ報酬】${tierLabel}勝利（差${pct}%）のため、レア寄り魔道具を獲得！ ${itemName}（${newItem.skillName}）`);
	} catch (e) {
		if (log) log.push(`【クラッチ報酬】付与処理でエラー: ${e && e.message ? e.message : e}`);
	}
}



// ボス専用：モードに関係なく必ず魔道具を1つ与える（中程度以上のレアリティ）
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
			window.log.push(`【ボス報酬】魔道具：${itemName}（${newItem.skillName}）`);
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
		toggle.textContent = isOpen ? '▶ 魔メイクを表示' : '▼ 魔メイクを非表示';
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
			toggleBtn.textContent = (window.itemFilterMode === 'and') ?
				'各要素の条件を満たす' :
				'いずれかの条件を満たす';

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
		const boostedDropRate = Math.pow(adj.dropRate, 1 / streakBias); // レアほど上昇
		const effectiveDropRate = boostedDropRate * (noun.dropRateMultiplier || 1.0);
		if (Math.random() < effectiveDropRate) return adj;
	}
	return null;
}

// RPGシミュレーター メインロジック（日本語UI、スキル100種以上対応）
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


// --- 魔メイク機能用の定数・変数（ファイル先頭付近に追加） ---
// 魔通貨獲得確率 (勝利時)
const FACE_COIN_DROP_RATE = 0.5;
// 魔メイクに必要な魔通貨枚数
const FACE_GACHA_COST = 1000;
// ランクごとの出現確率 (合計1.00になるよう調整)

window.faceCoins = 10000;
window.faceItemsOwned = []; // 例: ['face/S/face1.png', ...]
window.faceItemEquipped = null; // 例: 'face/A/face3.png'
window.lastChosenSkillNames = []; // 戦闘ごとの抽選結果

// パス解決: app/ 配下の index.html から、ルート直下の face/・image/ を参照する
function resolveAssetPath(p) {
    if (!p) return p;
    const s = String(p);
    if (s.startsWith('../')) return s;
    if (s.startsWith('face/')) return '../' + s;
    if (s.startsWith('image/')) return '../' + s;
    return s;
}

function normalizeFacePath(p) {
    if (!p) return p;
    const s = String(p);
    // 旧セーブ互換: 'face/...' を '../face/...' に寄せる
    if (s.startsWith('face/')) return '../' + s;
    return s;
}

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
	return function() {
		h ^= h << 13;
		h ^= h >> 17;
		h ^= h << 5;
		return (h >>> 0) / 4294967296;
	};
};

// ゲーム内で表示する名前（敵の場合はランダムカナ名に変換）
// ゲーム内で表示する名前（敵の場合は名前プールから割当）
window.displayName = function(name) {
	if (typeof name !== 'string') return '？？？';
	if (name.startsWith('敵')) {
		try {
			if (typeof window.__assignEnemyDisplayName === 'function') {
				return window.__assignEnemyDisplayName(name);
			}
		} catch (_) {}
		// フォールバック（重い生成器が読み込まれていない/例外時）
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

	// 装備中の魔メイク成長率（未装備なら1）
	let mmMul = 1;
	try {
		const b = __getEquippedFaceBonus();
		if (b && b.growthRates && typeof b.growthRates[stat] === 'number') {
			mmMul = b.growthRates[stat];
		}
	} catch (e) { mmMul = 1; }

	const finalGrowth = Math.max(0, Math.floor(growthAmount * mmMul));

	if (!player.growthBonus) {
		player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
	}
	player.growthBonus[stat] += finalGrowth;
	player[stat] = player.baseStats[stat] + player.growthBonus[stat];

	const message = `成長: ${stat} +${finalGrowth}（倍率x${window.growthMultiplier} ×魔メイクx${Number(mmMul).toFixed(2)}）`;
	showCustomAlert(message, 2000);

	window.growthMultiplier = 1; // リセット
	window.growthSkipCount = 0;  // 連続スキップ回数もリセット
	isWaitingGrowth = false;
};
;

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
	"multi": "#ff4d4d", // 連撃系 → 赤
	"poison": "#9933cc", // 毒系 → 紫
	"burn": "#ff6600", // 火傷系 → オレンジ
	"lifesteal": "#66ccff", // 吸収系 → 水色
	"skillSeal": "#9999ff", // 封印系 → 薄い青
	"barrier": "#66ff66", // バリア系 → 緑
	"regen": "#66ff99", // 再生系 → 明るい緑
	"reflect": "#ffff66", // 反射系 → 黄色
	"evasion": "#ff99cc", // 回避系 → ピンク
	"buff": "#ffd700", // 強化系 → 金
	"debuff": "#cc66ff", // 弱体系 → 紫
	"heal": "#00ffcc", // 回復系 → シアン
	"damage": "#ff3333", // 通常攻撃 → 真っ赤
	"stun": "#ff99cc", // スタン → ピンク
	"buffExtension": "#00ccff", // バフ延長 → 水色
	"debuffExtension": "#cc66ff", // デバフ延長 → 紫
	"berserk": "#ff3333", // 狂戦士化 → 赤
	"passive": "gold", // パッシブは別扱い
	"others": "#cccccc" // その他 → 灰色
};

window.formatSkills = function(c) {
	// 防御的：skills が未初期化でも落とさない（初期化不備/ロード互換対策）
	const skillsArr = (c && Array.isArray(c.skills)) ? c.skills : [];
	const skillElements = skillsArr.map(s => {
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
window.updateStats = function() {
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

	if (((window.isBossBattle && window.bossFacePath) || (window.isGrowthBoss && window.growthBossFacePath)) && enemyImgEl) {
		// 強敵：魔メイクの画像を表示
		if (enemyCanvasEl) enemyCanvasEl.classList.add('hidden');
		enemyImgEl.src = (window.isBossBattle && window.bossFacePath) ? window.bossFacePath : window.growthBossFacePath;
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
window.startNewGame = function(name) {

	// window.isFirstBattle = true;
	// 自動保存は「はじめから」で必ずOFF
	window.autoSaveEnabled = false;
// 初回だけ「魔メイク無料引き直し（確定まで何度でも）」を許可（はじめから限定）
	try{
		if (typeof window.__resetFirstRerollForNewGame === 'function') {
			window.__resetFirstRerollForNewGame();
		} else {
			window.__firstRerollArmed = true;
			window.__firstRerollSelectionPhase = true;
			window.__firstRerollState = { eligible:true, locked:false, shown:false, lastPath:null, hasDrawn:false, __bouncedOnce:false };
			try{ if (typeof window.__showFirstRerollPanel === "function") window.__showFirstRerollPanel(true); }catch(_){}
		}
		window.__firstBattlePending = false;
	}catch(_){}
	try{ if (typeof window.__showFirstRerollPanel === "function") window.__showFirstRerollPanel(true); }catch(_){}
try { if (typeof setupToggleButtons === 'function') setupToggleButtons(); } catch (_) {}


	// ==========================
	// 制限時間（タイムアタック）設定：タイトルの選択を取り込む
	//  - 無制限以外が選ばれた時だけ開始（「限り」に注意）
	//  - 「はじめから」なので既存の挑戦状態は必ずリセット
	// ==========================
	try{
		const sel = document.getElementById('timeLimitSelect');
		const v = sel ? String(sel.value || 'unlimited') : 'unlimited';
		window.__timeLimitSelectedSec = (v !== 'unlimited' && Number(v) > 0) ? Number(v) : 0;
		if (typeof window.__clearTimeLimitRuntime === 'function') window.__clearTimeLimitRuntime(true);
	}catch(_){}

	//ガイド いるならtrueに
	window.isFirstBattle = false;
	const battleBtn = document.getElementById("startBattleBtn");
	if (battleBtn && battleBtn.classList.contains("hidden")) {
		if (typeof window.ensureBattleButtons === "function") window.ensureBattleButtons();
	}

	// テキストボックスから名前を取得（空ならデフォルト名を使用）
	const playerName = name || document.getElementById('inputStr').value || 'プレイヤー';
	document.getElementById('inputStr').value = playerName; // 入力欄に最終的な名前を反映
	// --- プレイヤー参照の分裂防止：はじめから時に必ず新規作成して window.player と player を統一 ---
	try {
		const tmpChar = (typeof window.makeCharacter === 'function') ? window.makeCharacter(playerName) : (typeof makeCharacter === 'function' ? makeCharacter(playerName) : null);
		if (tmpChar) {
			player = {
				...tmpChar,
				growthBonus: tmpChar.growthBonus || { attack: 0, defense: 0, speed: 0, maxHp: 0 },
				itemMemory: []
			};
			if (!player.skillMemory) player.skillMemory = {};
			if (!player.itemMemory) player.itemMemory = [];
			window.player = player;
		} else {
			if (!window.player) window.player = {};
			player = window.player;
			player.name = playerName;
			if (!player.skillMemory) player.skillMemory = {};
			if (!player.itemMemory) player.itemMemory = [];
			if (!player.growthBonus) player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
		}
	} catch (e) {
		try {
			if (!window.player) window.player = {};
			player = window.player;
			player.name = playerName;
			if (!player.skillMemory) player.skillMemory = {};
			if (!player.itemMemory) player.itemMemory = [];
			if (!player.growthBonus) player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
		} catch (_e) {}
	}


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

	// 強ボス関連のリセット
	try{
		window.battlesPlayed = 0;
		window.battleCount = 0;
		window.isStrongBossBattle = false;
		window.strongBossKillCount = 0;
		window.__endingShown = false;
		if (typeof window.updateStrongBossStarUI === 'function') window.updateStrongBossStarUI();
	}catch(e){}

	if (typeof window.maxStreak !== "undefined") {
		window.maxStreak = 0;
	}

	if ('isLoadedFromSave' in window) {
		window.isLoadedFromSave = false; // セーブデータからのロードではないことを明示
	}

	// タイトル画面をフェードアウトし、ゲーム画面をフェードイン
	const titleScreen = document.getElementById('titleScreen');
	const gameScreen = document.getElementById('gameScreen');
	titleScreen.classList.add('fade-out');
	window.__battleSetTimeout(() => {
		titleScreen.classList.add('hidden');
		gameScreen.classList.remove('hidden');
		gameScreen.classList.add('fade-in');
			try { window.__ensureBattleDockReady && window.__ensureBattleDockReady(); } catch (e) {}

		// ゲーム画面の初期設定
		statusLogged = false;
		if (!player) player = window.player || {};
		if (!player.itemMemory) player.itemMemory = [];
		document.getElementById('battleLog').classList.remove('hidden');
		document.getElementById('battleArea').classList.remove('hidden');
		document.getElementById('skillMemoryContainer').style.display = 'block';

		// ★「はじめから → ゲームを開始」後は、キャラクター情報と魔メイクUIを開いた状態にする
		try{
			if (typeof window.toggleTopFold === 'function') {
				window.toggleTopFold('char');
			} else {
				const ch = document.getElementById('charInfoFold');
				if (ch) ch.classList.remove('hidden');
			}
			const faceContent = document.getElementById('faceMemoryContent');
			const faceToggle = document.getElementById('faceMemoryToggle');
			if (faceContent) faceContent.style.display = 'block';
			if (faceToggle) faceToggle.textContent = '▼ 魔メイクを非表示';
		}catch(_){ }

		// ★ 戦闘回数選択の読み取りと初期化処理を追加
		const battleBtn = document.getElementById('startBattleBtn');
		if (battleBtn) battleBtn.disabled = false; // 次の戦闘ボタンを有効化
		(function() { var onceBtn = document.getElementById('startBattleOnceBtn'); if (onceBtn) onceBtn.disabled = false; })();
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


		// 初回の戦闘を開始（敵名プールを必要数ぶん事前生成：重い版）
		const __startFirstBattle = () => {
			updateStats();
			// 初回魔メイク厳選フェーズ中は自動で戦闘を始めない（確定ボタンで開始）
			if (window.__firstRerollSelectionPhase) {
				window.__firstBattlePending = true;
				try{ if (typeof window.__showFirstRerollPanel === 'function') window.__showFirstRerollPanel(true); }catch(_){ }
				updateFaceUI();
				return;
			}
			window.startBattle();
			updateFaceUI();
		};
		try {
			if (typeof window.__resetEnemyNamePool === 'function') window.__resetEnemyNamePool();
			if (typeof window.__initEnemyNamePool === 'function') {
				const desired = (window.targetBattles && Number.isFinite(window.targetBattles))
					? (Math.max(0, window.targetBattles) + 220)
					: 520; // unlimited等
				window.__enemyNamePoolInitPromise = window.__initEnemyNamePool(desired, { showOverlay: true });
					window.__enemyNamePoolInitPromise.then(()=>{ window.__enemyNamePoolReady = true; __startFirstBattle(); }).catch(()=>{ window.__enemyNamePoolReady = false; __startFirstBattle(); });
			} else {
				__startFirstBattle();
			}
		} catch (_) {
			__startFirstBattle();
		}

	}, 500);


	// ==========================
	// 制限時間（タイムアタック）開始：無制限以外のときだけタイマー表示＆カウント開始
	// ==========================
	try{
		const sec = Number(window.__timeLimitSelectedSec || 0);
		if (sec > 0 && typeof window.__startTimeLimitChallenge === 'function') {
			window.__startTimeLimitChallenge(sec);
		} else {
			// 無制限：UIだけ確実に非表示へ
			if (typeof window.__applyTimeLimitUI === 'function') window.__applyTimeLimitUI();
		}
	}catch(_){}
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

window.getSkillEffect = function(skill, user, target, log) {
	let totalDamage = 0;
	skill.uses = (skill.uses || 0) + 1;
	let skillData = skillPool.find(sk => sk.name === skill.name);
	// 特殊スキルは静的データがないため特別処理
	if (!skillData) {
		if (skill.isMixed) {
			skillData = { category: 'mixed' }; // ダミーのスキルデータでカテゴリーを指定
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

					let hitDmg = isCrit ?
						Math.floor(rawHitDmg) // クリティカル時、防御無視
						:
						Math.max(0, Math.floor(rawHitDmg - target.defense / 2));

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
							const endureRes = handleEndureLethal(target, log, 'hit');
							if (endureRes.didEndure) {
								prevented = endureRes.prevented;
								hitDmg -= prevented;
								totalDamage -= prevented;
							}
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
					const endureRes = handleEndureLethal(target, log, 'attack');
					if (endureRes.didEndure) {
						const prevented = endureRes.prevented;
						dmg -= prevented;
						totalDamage -= prevented;
					}
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
					const endureRes = handleEndureLethal(target, log, 'attack');
					if (endureRes.didEndure) {
						const prevented = endureRes.prevented;
						dmg -= prevented;
						totalDamage -= prevented;
					}
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
					const endureRes = handleEndureLethal(target, log, 'attack');
					if (endureRes.didEndure) {
						const prevented = endureRes.prevented;
						sumDamage -= prevented;
					}
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
					log.push(`${displayName(user.name)}の${skill.name}：しかし再利用できる魔道具がない！`);
					console.log("[ItemReuse] No usable item to activate");
				} else {
					const item = usableItems[Math.floor(Math.random() * usableItems.length)];
					log.push(`>>> 魔道具「${item.color}${item.adjective}${item.noun}」が${item.skillName}を発動！`);
					console.log(`[ItemReuse] Activating item: ${item.color}${item.adjective}${item.noun} -> ${item.skillName}`);
					const prevDamage = user.battleStats[item.skillName] || 0;
					const itemSkillDef = skillPool.find(sk => sk.name === item.skillName && sk.category !== 'passive');
					if (itemSkillDef) {
						getSkillEffect({ ...itemSkillDef, level: item.skillLevel || 1 }, player, target, log);
					}
					if (item.skillLevel < 3000 && Math.random() < 0.4) {
						item.skillLevel++;
						log.push(`>>> 魔道具の ${item.skillName} が Lv${item.skillLevel} に成長！`);
						drawItemMemoryList();
					}
					item.remainingUses--;
					const isWithinProtectedPeriod = window.protectItemUntil && window.battleCount <= window.protectItemUntil;
					if (!item.protected && !isWithinProtectedPeriod && Math.random() < item.breakChance) {
						log.push(`>>> 魔道具「${item.color}${item.adjective}${item.noun}」は壊れた！`);
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
			user.effects.push({ type: 'endure', remaining: duration, preventedDamage: 0, skillName: skill.name, endureCountThisTurn: 0, maxEndurePerTurn: 5 });
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
					const endureRes = handleEndureLethal(target, log, 'gap');
					if (endureRes.didEndure) {
						prevented = endureRes.prevented;
						dmg -= prevented;
						totalDamage -= prevented;
					}
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
			let preventedByEndureSelf = 0;
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
						preventedByEndureSelf = prevented;
						console.log(`[Endure] ${displayName(user.name)} survived sacrifice with 1 HP (prevented ${prevented})`);
						log.push(`${displayName(user.name)}はHP1で踏みとどまった！`);
					}
				}

			}

			// 反撃（復讐態勢）：自傷（HP消費）も「被ダメージ」として蓄積する
			// （耐久で踏みとどまった分は preventedByEndureSelf で差し引く）
			if (hpCost > 0) {
				const actualSelfDamage = Math.max(0, hpCost - preventedByEndureSelf);
				if (actualSelfDamage > 0) {
					addCounterAccum(user, actualSelfDamage, log, `${skill.name}(自傷)`);
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
					const endureRes = handleEndureLethal(target, log, 'attack');
					if (endureRes.didEndure) {
						const prevented = endureRes.prevented;
						dmg -= prevented;
						totalDamage -= prevented;
					}
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
					const endureRes = handleEndureLethal(target, log, 'attack');
					if (endureRes.didEndure) {
						const prevented = endureRes.prevented;
						dmg -= prevented;
						totalDamage -= prevented;
					}
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

	// 反撃（復讐態勢）：被ダメージの蓄積
	// このスキル発動で target が受けた合計ダメージを、counter 効果があれば蓄積する。
	// （耐久/バリア等で減った分は totalDamage 側で反映済みの想定）
	if (totalDamage > 0) {
		addCounterAccum(target, totalDamage, log, skill.name);
	}
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


function handleEndureLethal(character, log, sourceLabel) {
	const endureEff = character.effects && character.effects.find(e => e.type === 'endure');
	if (!endureEff || character.hp >= 1) return { didEndure: false, prevented: 0, removed: false };

	// 1ターン内の踏みとどまり回数を制限（効果の持続の話）
	if (endureEff.maxEndurePerTurn == null) endureEff.maxEndurePerTurn = 5;
	endureEff.endureCountThisTurn = endureEff.endureCountThisTurn || 0;

	if (endureEff.endureCountThisTurn >= endureEff.maxEndurePerTurn) {
		// 限界到達：効果を完全解除（この致死ダメージは防げない）
		character.effects = character.effects.filter(e => e !== endureEff);
		log.push(`${displayName(character.name)}の不死身の構えは限界を迎え、解除された…`);
		console.log(`[Endure] ${displayName(character.name)} removed after exceeding per-turn cap (${endureEff.maxEndurePerTurn}).`);
		return { didEndure: false, prevented: 0, removed: true };
	}

	endureEff.endureCountThisTurn += 1;

	const prevented = 1 - character.hp;
	character.hp = 1;
	endureEff.preventedDamage = (endureEff.preventedDamage || 0) + prevented;
	log.push(`${displayName(character.name)}はHP1で踏みとどまった！`);
	console.log(`[Endure] ${displayName(character.name)} endured with 1 HP (prevented ${prevented})${sourceLabel ? ' via ' + sourceLabel : ''} (${endureEff.endureCountThisTurn}/${endureEff.maxEndurePerTurn})`);
	return { didEndure: true, prevented, removed: false };
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

// -----------------------------
// 反撃（復讐態勢）用：被ダメージ蓄積
// -----------------------------
// counter 効果は「一定ターン受けたダメージのX%を蓄積し、効果終了時にまとめて反撃」
// という仕様だが、被ダメージ時に accumulated が増えないと、期限切れでも反撃が0のままになる。
// ここでは「ダメージが発生した瞬間」に必ず蓄積する。
function addCounterAccum(character, damage, log, sourceLabel) {
	try {
		const dmg = Math.floor(Number(damage) || 0);
		if (!character || dmg <= 0) return;
		if (!Array.isArray(character.effects) || character.effects.length === 0) return;

		// 複数付与もあり得るので、存在する counter を全て蓄積対象にする（上書き仕様にしたい場合はここを変更）
		for (const eff of character.effects) {
			if (!eff || eff.type !== 'counter') continue;
			const pct = Math.max(0, Math.min(1, Number(eff.percent ?? 0.5) || 0.5));
			const add = Math.floor(dmg * pct);
			if (add <= 0) continue;
			eff.accumulated = Math.floor((Number(eff.accumulated) || 0) + add);
			// ログは大量になりやすいので通常は出さない（デバッグ時のみ console）
			// console.log(`[Counter] ${displayName(character.name)} accumulated +${add} from ${sourceLabel || 'damage'} (total ${eff.accumulated})`);
		}
	} catch (e) {
		// counter 蓄積は補助機能なので、ここで落ちないように握りつぶす
		console.warn('[Counter] addCounterAccum error', e);
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
// 特殊スキル：戦闘開始時に特殊効果のみ自動付与（発動不要）
// - type 2: 復活（HP0になった瞬間に発動）
// - type 3: 毒/火傷の継続ダメージ吸収（DoTダメージ後に回復）
// ※特殊スキルの「内包スキル(baseSkills)」は発動しません（仕様）
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
				if (log) log.push(`${displayName(user.name)}は【復活】を得た（特殊:${ms.name} / 発動率${Math.round(procChance*100)}% / 復活${Math.round(reviveRatio*100)}%）`);
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
				if (log) log.push(`${displayName(user.name)}は【毒/火傷吸収】を得た（特殊:${ms.name} / 発動率${Math.round(procChance*100)}% / 吸収${Math.round(absorbRatio*100)}%）`);
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
// 特殊スキル：毎ターン開始時の「敵の残りHP%追加ダメージ」
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

	// 複数の特殊スキルがある時でも全てに発動チャンス
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
	procs.sort((a, b) => (_normRatio(b.reviveRatio, 0.35) - _normRatio(a.reviveRatio, 0.35)));
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
	procs.sort((a, b) => (_normRatio(b.absorbRatio, 0.25) - _normRatio(a.absorbRatio, 0.25)));
	const eff = procs[0];

	const ratio = Math.max(0.05, _normRatio(eff.absorbRatio, 0.25));
	const heal = Math.max(1, Math.floor(dotDamage * ratio));
	ch.hp = Math.min(ch.maxHp || ch.hp, ch.hp + heal);
	eff.used = true;

	if (log) log.push(`※${eff.source}の効果で${displayName(ch.name)}が毒/火傷ダメージを吸収して${heal}回復！（${Math.round(ratio*100)}%）`);
	return true;
}

