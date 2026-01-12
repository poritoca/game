'use strict';
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

	// 方針B：特殊スキル開始時効果（revive_mixed_start / dotAbsorb_mixed_start）を使用
	window._policyBMixedStart = true;

	if (window.specialMode === 'brutal') {
		skillSimulCount = 1; // 鬼畜モードでは強制的に1に固定
	}

	window.barrierUsesLeft = 5;

	resetMixedSkillUsage();

	// --- 20戦ごとの強敵フラグ＆魔メイク画像選択用カウンタ ---
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


	// 戦闘開始時の特殊スキル状態リセット
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
				label: `次回成長x${window.getNextGrowthMultiplier()}`,
				value: 'skip',
				weight: skipWeight
    }
  ];

		// 重み付きランダム選択（安全版：weight=0 / NaN でも落ちない）
		const safeGrowthOptions = growthOptions.map(opt => {
			const w = Math.max(0, Number(opt.weight) || 0);
			return { ...opt, weight: w };
		});
		const totalWeight = safeGrowthOptions.reduce((sum, opt) => sum + opt.weight, 0);
		let selected = null;
		if (totalWeight > 0) {
			let rand = Math.random() * totalWeight;
			selected = safeGrowthOptions.find(opt => {
				if (rand < opt.weight) return true;
				rand -= opt.weight;
				return false;
			}) || safeGrowthOptions[safeGrowthOptions.length - 1];
		} else {
			// 全weightが0の場合：skip以外を優先して1つ選ぶ（なければ先頭）
			selected = safeGrowthOptions.find(opt => opt && opt.value && opt.value !== 'skip') || safeGrowthOptions[0];
		}
		if (!selected) {
			selected = { label: '（自動選択）', value: 'skip', weight: 0 };
		}

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

		try {} catch (e) {}
	}

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




	// 特殊スキルの戦闘開始時特殊効果を付与（必ずログを出す）
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
		// ※重要：特殊スキルの「所持しているだけで常時発動するステータスUP（type4-7）」で
		//   プレイヤーの attack/defense/speed/maxHp が戦闘開始時に上書きされるため、
		//   鬼畜モードの敵生成は「特殊スキルによるステータスアップ前」の値（= baseStats + growthBonus）を基準にする。
		const statMultiplierMin = 1.2;
		const statMultiplierMax = 1.8;
		const randInRange = () => (statMultiplierMin + Math.random() * (statMultiplierMax - statMultiplierMin));

		const pAtkBase = ((player.baseStats && typeof player.baseStats.attack === 'number') ? player.baseStats.attack : (player.attack || 0)) +
			((player.growthBonus && typeof player.growthBonus.attack === 'number') ? player.growthBonus.attack : 0);
		const pDefBase = ((player.baseStats && typeof player.baseStats.defense === 'number') ? player.baseStats.defense : (player.defense || 0)) +
			((player.growthBonus && typeof player.growthBonus.defense === 'number') ? player.growthBonus.defense : 0);
		const pSpdBase = ((player.baseStats && typeof player.baseStats.speed === 'number') ? player.baseStats.speed : (player.speed || 0)) +
			((player.growthBonus && typeof player.growthBonus.speed === 'number') ? player.growthBonus.speed : 0);
		const pHpBase = ((player.baseStats && typeof player.baseStats.maxHp === 'number') ? player.baseStats.maxHp : (player.maxHp || player.hp || 0)) +
			((player.growthBonus && typeof player.growthBonus.maxHp === 'number') ? player.growthBonus.maxHp : 0);

		atk = Math.floor(pAtkBase * randInRange());
		def = Math.floor(pDefBase * randInRange());
		spd = Math.floor(pSpdBase * randInRange());
		hpMax = Math.floor(pHpBase * randInRange());
	} else {
		// 通常モード：makeCharacter() の baseStats を使用
		atk = enemy.baseStats.attack;
		def = enemy.baseStats.defense;
		spd = enemy.baseStats.speed;
		hpMax = enemy.baseStats.maxHp;
	}

	// baseStats と現在値を同期
	enemy.baseStats.attack = atk;
	enemy.baseStats.defense = def;
	enemy.baseStats.speed = spd;
	enemy.baseStats.maxHp = hpMax;

	enemy.attack = atk;
	enemy.defense = def;
	enemy.speed = spd;
	enemy.maxHp = hpMax;
	enemy.hp = hpMax;

	// --- 2) 連勝補正・モード補正（通常と同じ指数に統一） ---
	const streakIndex = currentStreak + 1;
	const growthFactor = Math.pow(1.1, streakIndex); // 指数補正
	const rarityFactor = enemy.rarity; // レアリティ倍率
	const modeFactor = growthFactor; // 鬼畜も通常と同じ指数

	// 総合倍率 = レアリティ × 成長倍率
	let enemyMultiplier = rarityFactor * modeFactor;

	// ボス戦の場合は、ボス専用の追加倍率を掛ける
	if (window.isBossBattle) {
		// 通常モードは従来どおり（デフォルト 3〜10）
		// 鬼畜モードは 1.2〜4 に固定
		const isBrutal = (window.specialMode === 'brutal');

		const minMul = isBrutal ?
			1.2 :
			((typeof window.BOSS_ENEMY_MIN_MULTIPLIER === 'number') ? window.BOSS_ENEMY_MIN_MULTIPLIER : 1.5);

		const maxMul = isBrutal ?
			4.0 :
			((typeof window.BOSS_ENEMY_MAX_MULTIPLIER === 'number') ? window.BOSS_ENEMY_MAX_MULTIPLIER : 4.0);

		const exp = (typeof window.BOSS_ENEMY_POWER_EXP === 'number') ? window.BOSS_ENEMY_POWER_EXP : 5;

		const r = Math.random() ** exp;
		const bossMul = minMul + r * (maxMul - minMul);

		enemyMultiplier *= bossMul;
		log.push(`【ボス補正】敵倍率 x${bossMul.toFixed(3)}（範囲 ${minMul}〜${maxMul}）`);
	}
	// --- 3) 敵の最終値に倍率適用 ---
['attack', 'defense', 'speed', 'maxHp'].forEach(stat => {
		enemy[stat] = Math.floor(enemy[stat] * enemyMultiplier);
	});
	enemy.hp = enemy.maxHp;

	// --- 4) ログ出力（内訳を詳細に表示） ---
	log.push(
		`${window.specialMode === 'brutal' ? '[鬼畜モード挑戦中] ' : ''}` +
		`敵のステータス倍率: ${enemyMultiplier.toFixed(3)}倍\n` +
		`  ├ 基礎ステータス: ${atk}/${def}/${spd}/${hpMax}\n` +
		`  ├ レアリティ倍率: ${rarityFactor.toFixed(3)}\n` +
		`  └ 成長倍率(指数): 1.1^${streakIndex} = ${growthFactor.toFixed(3)}`
	);

	// --- 特殊スキル：戦闘開始時の特殊効果（残りHP%ダメージ/復活/吸収/バフ） ---
	// ※敵の最終ステータス（倍率適用後）を確定してから実行する（HP%ダメージの基準ズレ防止）
	applyMixedSpecialEffectsAtBattleStart(player, enemy, log);
	applyMixedSpecialEffectsAtBattleStart(enemy, player, log);


	// --- 5) 後処理 ---
	// ※特殊スキル開始時効果(revive/dotAbsorb等)を保持するため、ここでは effects を全消去しない
	updateStats();

	// =========================================================
	// 短期決着（5ターン以内）になった戦闘は「無かったこと」にして仕切り直す
	//  - 5ターン以内に決着したら、その戦闘結果/進行を採用せずリトライ
	//  - 敵味方の最大HPを倍率で増やして再戦（10倍 → 20倍 → 30倍 ...）
	//  - 5ターン以上（※ここでは「6ターン目に入る＝turnsElapsed>=6」）続くまで繰り返す
	//    ※ユーザー要望の「5ターン以内」と「5ターン以上」の境界が衝突するため、
	//      “5ターン以内はやり直し” を優先し、6ターン目に入るまでを条件にしています。
	// =========================================================
	const __EARLY_END_TURNS = 5; // ここ以下で決着したらやり直し
	// 仕切り直し時のHP倍率（加速度的に増える）
	// 例: 10, 20, 32, 46, 63 ...（差分が 1.2倍ずつ増えるイメージ）
	const __RETRY_HP_FIRST = 10; // 1回目の仕切り直し倍率
	const __RETRY_HP_SECOND = 20; // 2回目の仕切り直し倍率
	const __RETRY_HP_GROWTH = 1.2; // 3回目以降：差分の増加率
	const __RETRY_LIMIT = 5; // 念のため無限ループ防止

	function __calcRetryHpMultiplier(retryIndex) {
		// retryIndex: 0=通常、1=1回目の仕切り直し...
		const idx = Math.max(0, Math.floor(Number(retryIndex || 0)));
		if (idx <= 0) return 1;

		// 1回目/2回目は固定
		if (idx === 1) return __RETRY_HP_FIRST;
		if (idx === 2) return __RETRY_HP_SECOND;

		// 3回目以降は「差分」を加速度的に増やす
		let prev = __RETRY_HP_FIRST; // 10
		let curr = __RETRY_HP_SECOND; // 20
		for (let i = 3; i <= idx; i++) {
			const diff = Math.max(1, curr - prev);
			const nextDiff = Math.max(1, Math.round(diff * __RETRY_HP_GROWTH));
			const next = curr + nextDiff;
			prev = curr;
			curr = next;
		}
		return curr;
	}

	// 戦闘開始直前の状態（特殊スキル開始時効果等の適用後）を“基準”として保存
	// これに戻してから倍率を掛け直すことで、短期決着の戦闘を完全に無効化する。
	let __battleRetryBasePlayer, __battleRetryBaseEnemy;

	// JSON.stringify は Infinity / -Infinity / NaN を null にしてしまい、
	// 仕切り直し後に「魔道具の使用回数(usesPerBattle/remainingUses)」などが壊れて
	// 発動しなくなる原因になります。特殊な数値を保護してクローンします。
	function __battleRetryCloneSafe(obj) {
		try {
			const json = JSON.stringify(obj, function(_k, v) {
				if (typeof v === 'number') {
					if (Number.isNaN(v)) return "__NUM_NAN__";
					if (v === Infinity) return "__NUM_INF__";
					if (v === -Infinity) return "__NUM_NEGINF__";
				}
				return v;
			});
			return JSON.parse(json, function(_k, v) {
				if (v === "__NUM_NAN__") return NaN;
				if (v === "__NUM_INF__") return Infinity;
				if (v === "__NUM_NEGINF__") return -Infinity;
				return v;
			});
		} catch (_e) {
			return null;
		}
	}

	try {
		__battleRetryBasePlayer = __battleRetryCloneSafe(player);
		__battleRetryBaseEnemy = __battleRetryCloneSafe(enemy);
	} catch (_e) {
		// JSON化できない最悪ケースは「やり直し無効」に倒して戦闘継続
		__battleRetryBasePlayer = null;
		__battleRetryBaseEnemy = null;
	}

	function __battleRetryRestore(dst, src) {
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

	function applyMaxHpDecayAtTurnStart(ch, baseMaxHp, logArr, turnNum) {
		if (turnNum < __MAXHP_DECAY_START_TURN) return;

		// baseMaxHp が 0 以下のときは減少しようがない
		if (!Number.isFinite(baseMaxHp) || baseMaxHp <= 0) return;

		const dec = Math.floor(baseMaxHp * __MAXHP_DECAY_RATE);
		if (dec <= 0) return;

		const beforeMax = Number.isFinite(ch.maxHp) ? ch.maxHp : 0;
		const afterMax = Math.max(0, beforeMax - dec);

		if (afterMax !== beforeMax) {
			ch.maxHp = afterMax;

			// 現在HPも整合（UI/ログのHP%がズレないようにする）
			if (!Number.isFinite(ch.hp)) ch.hp = 0;
			if (ch.hp > ch.maxHp) ch.hp = ch.maxHp;
			if (ch.hp < 0) ch.hp = 0;

			// ログ（HP%の扱いを壊さないよう、ここでは「最大HP」の増減だけ表示）
			try {
				logArr.push(`${displayName(ch.name)}の最大HPが${dec}減少（${beforeMax}→${afterMax}）`);
			} catch (_e) {
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
	let __battleStartMaxHp_enemy = 0;

	while (true) {
		// 基準状態に戻してから、倍率を適用して“新しい戦闘開始状態”を作る
		if (__retryIndex > 0 && __battleRetryBasePlayer && __battleRetryBaseEnemy) {
			__battleRetryRestore(player, __battleRetryBasePlayer);
			__battleRetryRestore(enemy, __battleRetryBaseEnemy);
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
		if (Number.isFinite(enemy.maxHp)) enemy.maxHp = Math.max(0, Math.floor(enemy.maxHp * __hpMult));

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
		__battleStartMaxHp_enemy = enemy.maxHp;

		recordHP();

		// ターン制バトル開始
		while (turn <= __MAX_TURNS && player.hp > 0 && enemy.hp > 0) {
			log.push(`\n-- ${turn}ターン --`);

			if (turn === 1) {
				applyPassiveSeals(player, enemy, log);
			}
			updateSealedSkills(player);
			updateSealedSkills(enemy);

			// 不死身の構え：ターン開始時に「このターンの踏みとどまり回数」をリセット
      [player, enemy].forEach(ch => {
				(ch.effects || []).forEach(eff => {
					if (eff.type === 'endure') eff.endureCountThisTurn = 0;
				});
			});

			// 最大HP減衰（10ターン目以降、ターン開始時に適用）
			// ※この後の「残りHP%ダメージ」や継続ダメージ等の計算で、HP%が
			// 正しくなるよう先に最大HPを更新する
			applyMaxHpDecayAtTurnStart(player, __battleStartMaxHp_player, log, turn);
			applyMaxHpDecayAtTurnStart(enemy, __battleStartMaxHp_enemy, log, turn);
			updateStats();

			// 特殊スキル：毎ターン開始時（継続ダメージより前）に残りHP%追加ダメージ判定
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
									// 反撃（復讐態勢）：継続/環境ダメージも被ダメージとして蓄積
									addCounterAccum(ch, bombDamage, log, '爆弾');
								} else {
									log.push(`${displayName(ch.name)}に仕掛けられた爆弾が爆発！しかしダメージはない`);
								}

								// エンデュア効果：爆発で死亡をHP1で踏みとどまる
								handleEndureLethal(ch, log, 'bomb');
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
							// 反撃（復讐態勢）：毒ダメージを蓄積
							addCounterAccum(ch, dmg, log, '毒');
							handlePoisonBurnDamage(ch, dmg, log);
							// エンデュア効果：毒で死亡をHP1で踏みとどまる
							handleEndureLethal(ch, log, 'poison');
						} else if (eff.type === '火傷') {
							ch.hp -= eff.damage;
							log.push(`${displayName(ch.name)}は火傷で${eff.damage}ダメージ`);
							ch.battleStats['火傷'] = (ch.battleStats['火傷'] || 0) + eff.damage;
							// 反撃（復讐態勢）：火傷ダメージを蓄積
							addCounterAccum(ch, eff.damage, log, '火傷');
							handlePoisonBurnDamage(ch, eff.damage, log);
							handleEndureLethal(ch, log, 'burn');
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


						// 特殊スキルは通常スキルとして無意味なので、通常スキルが引けない場合はスキル発動なし
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
								const endureRes = handleEndureLethal(actor, log, 'reflect');
								if (endureRes.didEndure) {
									reflectDmg -= endureRes.prevented;
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
					// プレイヤーの魔道具メモリー発動（1ターンに1度のみ）
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
							log.push(`>>> 魔道具「${item.color}${item.adjective}${item.noun}」が ${item.skillName} を発動！`);

							getSkillEffect({ ...skill, level: item.skillLevel || 1 }, player, enemy, log);

							if (item.skillLevel < 3000 && Math.random() < 0.4) {
								item.skillLevel++;
								log.push(`>>> 魔道具の ${item.skillName} が Lv${item.skillLevel} に成長！`);
								drawItemMemoryList();
							}

							item.remainingUses--;
							triggeredItemsThisTurn.add(itemKey);

							const isWithinProtectedPeriod =
								window.protectItemUntil && window.battleCount <= window.protectItemUntil;

							if (!item.protected && !isWithinProtectedPeriod && Math.random() < item.breakChance) {
								log.push(`>>> 魔道具「${item.color}${item.adjective}${item.noun}」は壊れた！`);
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
							const endureRes = handleEndureLethal(target, log, 'normal');
							if (endureRes.didEndure) {
								dmg -= endureRes.prevented;
							}
							log.push(`${displayName(actor.name)}の通常攻撃：${dmg}ダメージ`);
							actor.battleStats['通常攻撃'] = (actor.battleStats['通常攻撃'] || 0) + dmg;
							// ダメージ反射判定
							const reflectEff = target.effects.find(e => e.type === 'reflect');
							if (reflectEff) {
								let reflectDmg = Math.floor(dmg * reflectEff.percent);
								if (reflectDmg > 0) {
									actor.hp -= reflectDmg;
									const endureResActor = handleEndureLethal(actor, log, 'reflect');
									if (endureResActor.didEndure) {
										reflectDmg -= endureResActor.prevented;
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

				// ② 旧方式（互換：特殊スキルの specialEffects 直読み等）
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
		const __playerDefeated = (player.hp <= 0);

		// 仕様変更：5ターン以内に「プレイヤーが倒れた」場合のみ、短期決着ダイジェスト→仕切り直し
		//          5ターン以内に勝利した場合は、そのままこの戦闘結果を採用して終了する
		if (__playerDefeated && __turnsElapsed <= __EARLY_END_TURNS && __battleRetryBasePlayer && __battleRetryBaseEnemy) {
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
				log.push(`【短期敗北ダイジェスト】#${__nextRetryIndex}：${__turnsElapsed}ターンで${__winnerText} → 無効化（次戦HP倍率 x${__nextHpMult}）`);
			} catch (_e) {
				// 万一ダイジェスト生成に失敗しても、リトライ自体は継続（ログは残す）
				log.push(`【短期敗北ダイジェスト】${__turnsElapsed}ターン以内に決着 → 無効化（次戦へ）`);
			}

			// 次の周回へ（基準状態に戻して、HP倍率を上げて再戦）
			__retryIndex += 1;
			continue;
		}

		// この結果を採用してループ終了
		break;
	}

	// -------------------------
	// 15ターン終了時の勝敗（両者生存なら「優劣バー(青/赤の長さ)」で判定）
	//  - 優劣バーは「残りHP割合(pRem/eRem) を合計で正規化」した 100%積み上げ
	//  - 同率はプレイヤー勝ち
	// -------------------------
	let __endedByTurnLimit = false;
	let __hpRatioPlayer = null;   // 自HP/自MAX
	let __hpRatioEnemy = null;    // 敵HP/敵MAX
	let __hpSharePlayer = null;   // 優劣バーの青(自)の長さ(0..1)
	let __hpShareEnemy = null;    // 優劣バーの赤(敵)の長さ(0..1)
	let __hpShareDiff = null;     // (青-赤)

	if (player.hp > 0 && enemy.hp > 0 && typeof __MAX_TURNS === 'number' && turn > __MAX_TURNS) {
		__endedByTurnLimit = true;

		const pMax = Math.max(1, (player.maxHp || player.hp || 1));
		const eMax = Math.max(1, (enemy.maxHp || enemy.hp || 1));

		// 残りHP割合（ツールチップ/表示用）
		__hpRatioPlayer = Math.max(0, player.hp) / pMax;
		__hpRatioEnemy  = Math.max(0, enemy.hp) / eMax;

		// 優劣バー(100%積み上げ)のロジックと同一：pRem/eRem を合計で正規化
		const pRem = Math.max(0, __hpRatioPlayer);
		const eRem = Math.max(0, __hpRatioEnemy);
		const sum = pRem + eRem;

		__hpSharePlayer = (sum > 0) ? (pRem / sum) : 0.5;
		__hpShareEnemy  = (sum > 0) ? (eRem / sum) : 0.5;
		__hpShareDiff   = __hpSharePlayer - __hpShareEnemy;

		const pPct = (__hpRatioPlayer * 100).toFixed(1);
		const ePct = (__hpRatioEnemy * 100).toFixed(1);

		const pBar = (__hpSharePlayer * 100).toFixed(2);
		const eBar = (__hpShareEnemy * 100).toFixed(2);
		const diffBar = (Math.abs(__hpShareDiff) * 100).toFixed(2);
		const sign = (__hpShareDiff >= 0) ? '+' : '-';
		const verdict = (__hpShareDiff >= 0) ? '勝利' : '敗北';

		log.push(`\n【${__MAX_TURNS}ターン終了：優劣バー判定】青(自) ${pBar}% / 赤(敵) ${eBar}%（差 ${sign}${diffBar}%）→ ${verdict}\n（参考：自HP ${pPct}% / 敵HP ${ePct}%）`);
	}

	const playerWon = player.hp > 0 && (
		enemy.hp <= 0 ||
		(!__endedByTurnLimit && player.hp > enemy.hp) ||
		(__endedByTurnLimit && __hpShareDiff >= 0)
	);

	// -------------------------
	// -------------------------
	// クラッチ報酬：優劣バー差が小さい「僅差勝利」ほどレア寄り魔道具を付与
	// - 2%差以内のみ（バー長差）
	// - 0.5%以内: tier3 / 1%以内: tier2 / 2%以内: tier1
	// -------------------------
	if (playerWon && __endedByTurnLimit && typeof __hpShareDiff === 'number') {
		const absDiff = Math.abs(__hpShareDiff);
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
			{ label: `次回成長x${window.getNextGrowthMultiplier()}`, value: 'skip' }
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

		// ★ 20戦ごとのボス勝利時：魔道具 or ステータス成長
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
				// ---- 90%：ボス専用の確定魔道具報酬（モードに関係なく1個以上） ----
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

		try{
			window.__showBattleDockResultWindow && window.__showBattleDockResultWindow(victoryMessage, { autoDismissMs: 1200, fadeOutMs: 400 });
		}catch(_e){
			try{ showCustomAlert(victoryMessage, 1200); }catch(_e2){}
		}

		log.push(`\n勝者：${displayName(player.name)}\n連勝数：${currentStreak}`);
		saveBattleLog(log);
		// 単発バトル回数ボーナス（処理は一旦無効化／後で再調整）


		player.skills.forEach(sk => {
			const isExempt = window.levelCapExemptSkills.includes(sk.name);
			let levelUpChance = 0.2; // 通常の確率

			if (sk.level >= 5000) {
				levelUpChance = 1 / 5000; // Lv5000以上は超低確率
			} else if (sk.level >= 999 && !isExempt) {
				levelUpChance = 1 / 2500; // 制限ありスキルは低確率
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
			// スコアが高いほど平均魔通貨数が増える（最大10枚）
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
			skillGainChance = 0.02; // 鬼畜モードで変更する
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

		// --- 超低確率で 魔通貨 入手イベント ---
		const coinChance = enemy.rarity / 1000;
		if (Math.random() < coinChance) {
			const coinGain = Math.floor(Math.random() * 200); // 最大500
			window.faceCoins = (window.faceCoins || 0) + coinGain;


			showCenteredPopup(`[低確率] 魔通貨を${coinGain}枚獲得！（累計：${window.faceCoins}枚）`);

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
			player.attack = player.baseStats.attack + player.growthBonus.attack;
			player.defense = player.baseStats.defense + player.growthBonus.defense;
			player.speed = player.baseStats.speed + player.growthBonus.speed;
			player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
		}
		if (typeof updateStats === "function") updateStats();

		try {
			window.__showBattleDockResultWindow && window.__showBattleDockResultWindow(
				`敗北：${displayName(enemy.name)}に敗北<br>` +
				`最終連勝数：${currentStreak}<br>
	敵倍率: ${enemyMultiplier.toFixed(3)}
	
	${resetMessage}` +
				`${growthMsg}` +
				`<br><span style="font-size:12px;">※スキルは記憶に基づいて<br>再構成されます</span>`,
				{ autoDismissMs: 1500, fadeOutMs: 400 }
			);
		} catch (e) {
			try { console.warn('[BattleDockResultWindow] failed', e); } catch (_e) {}
		}

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
		if (eff.type === 'berserk') {
			player.attack = eff.originalAttack;
			player.defense = eff.originalDefense;
		}
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


	window.returnToTitleScreen = function() {
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
		try { window.resetTitleLoadPanel && window.resetTitleLoadPanel(); } catch (_e) {}
		try { window.resetTitleStartPanel && window.resetTitleStartPanel(); } catch (_e) {}
		if (finalResults) finalResults.style.display = 'none';
		if (battleArea) battleArea.classList.add('hidden');
		if (remainDisplay) remainDisplay.style.display = 'none';
		if (streakDisplay) streakDisplay.textContent = '';

		document.getElementById('loadGameBtn')?.classList.add('hidden');
		document.getElementById('loadSection')?.classList.add('hidden');

		// ゲーム内変数を初期化（window を通して安全に）
		window.returnToTitleScreen = function() {
			// ...（既存のタイトル画面表示切替処理）...
			if ('player' in window) window.player = null;
			if ('enemy' in window) window.enemy = null;
			if ('currentStreak' in window) window.currentStreak = 0;
			if ('sessionMaxStreak' in window) window.sessionMaxStreak = 0;
			if ('remainingBattles' in window) window.remainingBattles = null;
			if ('targetBattles' in window) window.targetBattles = null;
			if ('initialAndSlotSkills' in window) window.initialAndSlotSkills = [];
			if ('isLoadedFromSave' in window) window.isLoadedFromSave = false; // セーブフラグリセット
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
				// 所持魔道具の総レアリティを計算（ドロップ率の逆数の合計）
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
						if (dropRate < 1e-9) dropRate = 1e-9; // ゼロ除算防止
						totalRarity += (1 / dropRate);
					}
				}
				// 合計スコアを算出（攻撃力・防御力・素早さ・最大HP・総レアリティの合計）
				const totalScore = Math.round(
					(finalAtk + finalDef + finalSpd + finalHP * 0.1 + totalRarity) * sessionMaxStreak
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

					const finalOutcomeTitle = playerWinsByRatio ?
						`${displayName(player.name)} の勝利！（残りHP割合 ${Math.round(pRatio*100)}% vs ${Math.round(eRatio*100)}%）` :
						`${displayName(player.name)} は敗北…（残りHP割合 ${Math.round(pRatio*100)}% vs ${Math.round(eRatio*100)}%）`;

					finalResEl.innerHTML = `<div class="final-death-title">${finalOutcomeTitle}</div>

<div class="final-stats">
  <p>設定戦闘回数: ${window.targetBattles || "未設定"}</p>
  <p>最大連勝数: ${sessionMaxStreak}</p>
  <p>最終ステータス：<br>
     攻撃力: ${finalAtk}<br>
     防御力: ${finalDef}<br>
     素早さ: ${finalSpd}<br>
     最大HP: ${finalHP}</p>
  <p>魔道具総レアリティ: ${rarityStr}</p>
</div>

<div class="final-score-value">合計スコア: ${totalScore}</div>

<div style="
  margin-top: 30px;
  padding: 10px;
  font-size: 0.95em;
  color: #ccc;
  font-style: italic;
">
  今後、合計スコアにより魔通貨ボーナスがあります。<br>
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
				(function() { var onceBtn = document.getElementById('startBattleOnceBtn'); if (onceBtn) onceBtn.disabled = true; })();
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

	try {} catch (error) {}

	// --- 戦闘処理終了：次の戦闘に備えてフラグを戻す ---
	window.__battleVisualTracking = false;
	window.__battleInProgress = false;
};

document.addEventListener('DOMContentLoaded', () => {
	if (typeof updateScoreOverlay === 'function') {
		updateScoreOverlay();
	}

	try { window.__ensureBattleDockReady && window.__ensureBattleDockReady(); } catch (e) {}

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

	// ---- Title screen: New Game start button binding (robust) ----
// Some versions use #startNewGameConfirmBtn, others use #startNewGameBtn ("開始する").
// Bind whichever exists (and both if present) so the title screen always starts.
(function bindStartNewGameButtons(){
	try{
		const handler = () => {
			try{
				const name = document.getElementById("inputStr")?.value || "プレイヤー";
				if (typeof startNewGame === 'function') startNewGame(name);
				else if (typeof window.startNewGame === 'function') window.startNewGame(name);
			}catch(_){}
		};

		const confirmBtn = document.getElementById("startNewGameConfirmBtn");
		if (confirmBtn && !confirmBtn.__boundStartNewGame) {
			confirmBtn.__boundStartNewGame = true;
			confirmBtn.addEventListener("click", handler);
		}

		const startBtn = document.getElementById("startNewGameBtn");
		if (startBtn && !startBtn.__boundStartNewGame) {
			startBtn.__boundStartNewGame = true;
			startBtn.addEventListener("click", handler);
		}
	}catch(e){}
})();

	//document.getElementById('loadGameBtn').addEventListener('click', window.loadGame);
	//document.getElementById('showBattleModeBtn').addEventListener('click', window.showBattleMode);
	//document.getElementById('startVsModeBtn').addEventListener('click', window.startVsMode);
	document.getElementById('startBattleBtn').addEventListener('click', window.startBattle);

	// スマホ・PC 両対応の連打処理
	const battleBtn = document.getElementById('startBattleBtn');
	let battleInterval;

	function startAutoBattle() {
		isAutoBattle = true; // ← 長押し中にセット
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
		updateStats(); // ボタンを離したときに最新情報を描画
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

window.buildItemFilterStates = function() {
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








window.setupToggleButtons = function() {
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

window.applyItemFilterUIState = function() {
  ['color', 'adj', 'noun'].forEach(type => {
		const checkboxes = document.querySelectorAll(`.itemFilterCB[data-type="${type}"]`);
		checkboxes.forEach(cb => {
			if (window.itemFilterStates?.[type]?.hasOwnProperty(cb.value)) {
				cb.checked = window.itemFilterStates[type][cb.value];
			}
		});
	});
};

window.updateSpecialModeButton = function() {
	const btn = document.getElementById('specialModeButton');
	const battleBtn = document.getElementById('startBattleBtn');

	if (window.specialMode === 'brutal') {
		btn.textContent = '鬼畜モード（魔道具入手可能）';
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

window.updateItemFilterModeButton = function() {
	const toggleBtn = document.getElementById('filterModeToggleBtn');
	if (!toggleBtn) return;

	toggleBtn.textContent = (window.itemFilterMode === 'and') ?
		'各要素の条件を満たす' :
		'いずれかの条件を満たす';

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
			updateRemainingBattleDisplay(); // ★表示更新
		};
		reader.readAsText(file);
		return;
	}

	if (input.includes('.')) {
		await window.importSaveCode();
		updateRemainingBattleDisplay(); // ★表示更新
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
			selectedVal === "unlimited" ?
			null :
			(parseInt(selectedVal, 10) || 0);
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
		btn.addEventListener("click", function() {});
	} else {}
});

window.addEventListener("DOMContentLoaded", () => {
	populateItemElementList();
	const btn = document.getElementById("startNewGameBtn");
	if (btn) {
		// startNewGameBtn is now used to open the Start Panel (see game.part4.js)
		// Actual start is handled by #startNewGameConfirmBtn
		
	} else {}
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

window.__clearEventPopupLegacy = function() {
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


// =========================================================
// Growth selection (成長選択) compact UI: draggable + position persist
// =========================================================
window.__GROWTH_POPUP_POS_KEY = window.__GROWTH_POPUP_POS_KEY || 'growthPopupPosV1';

window.__readGrowthPopupPos = function(){
	try{
		const raw = localStorage.getItem(window.__GROWTH_POPUP_POS_KEY);
		if(!raw) return null;
		const obj = JSON.parse(raw);
		if(!obj || typeof obj.x!=='number' || typeof obj.y!=='number') return null;
		return { x: obj.x, y: obj.y };
	}catch(e){ return null; }
};

window.__writeGrowthPopupPos = function(pos){
	try{
		if(!pos || typeof pos.x!=='number' || typeof pos.y!=='number') return;
		localStorage.setItem(window.__GROWTH_POPUP_POS_KEY, JSON.stringify({ x: pos.x, y: pos.y }));
	}catch(e){}
};

window.__clampToViewport = function(x, y, w, h){
	const vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
	const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
	const nx = Math.min(Math.max(6, x), Math.max(6, vw - w - 6));
	const ny = Math.min(Math.max(6, y), Math.max(6, vh - h - 6));
	return { x: nx, y: ny };
};

window.__applyGrowthPopupSavedPos = function(popup){
	try{
		if(!popup) return;
		const pos = window.__readGrowthPopupPos();
		if(!pos) return;

		requestAnimationFrame(() => {
			try{
				const rect = popup.getBoundingClientRect();
				const clamped = window.__clampToViewport(pos.x, pos.y, rect.width, rect.height);

				popup.style.setProperty('right','auto','important');
popup.style.setProperty('left', clamped.x + 'px','important');
popup.style.setProperty('top',  clamped.y + 'px','important');
popup.style.setProperty('transform','none','important');

				window.__writeGrowthPopupPos(clamped);
			}catch(e){}
		});
	}catch(e){}
};

window.__ensureGrowthPopupDraggable = function(popup){
	try{
		if(!popup) return;

		// Ensure the popup is always above other UI (iPhone: prevents "grip can't be touched" by overlays)
		try{
			if(!popup.style.zIndex) popup.style.zIndex = '99999';
		}catch(_e){}

		let handle = popup.querySelector('.growth-drag-handle');
		if(!handle){
			handle = document.createElement('div');
			handle.className = 'growth-drag-handle';
			handle.setAttribute('role','button');
			handle.setAttribute('aria-label','ドラッグして移動');
			handle.innerHTML = '<span class="grip" aria-hidden="true"></span>';
			popup.insertBefore(handle, popup.firstChild);
		}

		// Make sure touches actually reach the handle
		try{
			handle.style.pointerEvents = 'auto';
			handle.style.position = 'relative';
			handle.style.zIndex = '100000';
		}catch(_e){}

		if(handle.__dragBound) return;
		handle.__dragBound = true;

		let dragging = false;
		let startX = 0, startY = 0;
		let baseLeft = 0, baseTop = 0;

		const getXY = (ev) => {
			if(ev && ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
			if(ev && ev.changedTouches && ev.changedTouches[0]) return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
			return { x: (ev && ev.clientX!=null) ? ev.clientX : 0, y: (ev && ev.clientY!=null) ? ev.clientY : 0 };
		};

		// Block page scroll while dragging (iOS Safari needs non-passive + preventDefault)
		const blockScroll = (ev) => {
			if(!window.__growthPopupDragging) return;
			try{ ev.preventDefault(); }catch(_e){}
			try{ ev.stopPropagation(); }catch(_e){}
		};

		const onMove = (ev) => {
			if(!dragging) return;
			try{ ev.preventDefault(); }catch(_e){}
			try{ ev.stopPropagation(); }catch(_e){}

			const p = getXY(ev);
			const dx = p.x - startX;
			const dy = p.y - startY;
			try{ if(Math.abs(dx)+Math.abs(dy) > 2){ popup.classList.add('growth-drag-moving'); } }catch(_e){}

			const rect = popup.getBoundingClientRect();
			const target = window.__clampToViewport(baseLeft + dx, baseTop + dy, rect.width, rect.height);

			popup.style.setProperty('right','auto','important');
popup.style.setProperty('left', target.x + 'px','important');
popup.style.setProperty('top',  target.y + 'px','important');
popup.style.setProperty('transform','none','important');
		};

		const endDrag = (ev) => {
			if(!dragging) return;
			dragging = false;
			window.__growthPopupDragging = false;

			handle.classList.remove('dragging');
			popup.classList.remove('growth-dragging');
			try{ popup.classList.remove('growth-drag-moving'); }catch(_e){}

			try{ if(ev && ev.pointerId!=null && handle.releasePointerCapture) handle.releasePointerCapture(ev.pointerId); }catch(_e){}
			try{
				const rect = popup.getBoundingClientRect();
				window.__writeGrowthPopupPos({ x: rect.left, y: rect.top });
			}catch(_e){}

			// Remove listeners (capture flag must match)
			document.removeEventListener('pointermove', onMove, { capture:true });
			document.removeEventListener('pointerup', endDrag, { capture:true });

			document.removeEventListener('touchmove', onMove, { capture:true });
			window.removeEventListener('touchmove', onMove, { capture:true });
			window.removeEventListener('pointermove', onMove, { capture:true });
			document.removeEventListener('touchend', endDrag, { capture:true });
			document.removeEventListener('touchcancel', endDrag, { capture:true });

			document.removeEventListener('mousemove', onMove, { capture:true });
			document.removeEventListener('mouseup', endDrag, { capture:true });

			// Restore scrolling
			document.removeEventListener('touchmove', blockScroll, { capture:true });
			document.removeEventListener('wheel', blockScroll, { capture:true });
		};

		const startDrag = (ev) => {
			// If the compact UI isn't active, don't drag
			if(!popup.classList.contains('growth-compact-ui')) return;

			// Visual debugging: show "grabbing" state immediately
			handle.classList.add('dragging');
			popup.classList.add('growth-dragging');

			// Important: stop the "dock auto-minimize on scroll" & other handlers
			try{ if(ev && typeof ev.stopPropagation==='function') ev.stopPropagation(); }catch(_e){}
			try{ if(ev && typeof ev.stopImmediatePropagation==='function') ev.stopImmediatePropagation(); }catch(_e){}
			try{ ev.preventDefault(); }catch(_e){}

			dragging = true;
			window.__growthPopupDragging = true;

			// Capture pointer so moves keep coming even if finger leaves the handle
			try{ if(ev && ev.pointerId!=null && handle.setPointerCapture) handle.setPointerCapture(ev.pointerId); }catch(_e){}

			const p = getXY(ev);
			const rect = popup.getBoundingClientRect();

			startX = p.x;
			startY = p.y;
			baseLeft = rect.left;
			baseTop  = rect.top;

			// Freeze current position into left/top (use !important to override any CSS !important rules)
			popup.style.setProperty('right','auto','important');
			popup.style.setProperty('left', rect.left + 'px','important');
			popup.style.setProperty('top',  rect.top  + 'px','important');
			popup.style.setProperty('transform','none','important');

			// Add listeners in CAPTURE phase so we win against other global handlers
			document.addEventListener('pointermove', onMove, { passive:false, capture:true });
			document.addEventListener('pointerup', endDrag, { passive:true, capture:true });

			document.addEventListener('touchmove', onMove, { passive:false, capture:true });
			window.addEventListener('touchmove', onMove, { passive:false, capture:true });
			window.addEventListener('pointermove', onMove, { passive:false, capture:true });
			document.addEventListener('touchend', endDrag, { passive:true, capture:true });
			document.addEventListener('touchcancel', endDrag, { passive:true, capture:true });

			document.addEventListener('mousemove', onMove, { passive:false, capture:true });
			document.addEventListener('mouseup', endDrag, { passive:true, capture:true });

			// Strong scroll suppression while dragging
			document.addEventListener('touchmove', blockScroll, { passive:false, capture:true });
			document.addEventListener('wheel', blockScroll, { passive:false, capture:true });
		};

		// Bind with capture so the grip reliably receives events even if some parent listens first
		handle.addEventListener('pointerdown', startDrag, { passive:false, capture:true });
		handle.addEventListener('touchstart', startDrag, { passive:false, capture:true });
		handle.addEventListener('mousedown', startDrag, { passive:false, capture:true });

	}catch(e){}
};
// 【選択肢イベントポップアップを表示する】
window.showEventOptions = function(title, options, onSelect) {
	// 前回の内容をクリア（旧「左上バーUI」は廃止したため、常に eventPopup を使用）
	clearEventPopup(false);
	try{ window.__cancelEventPopupTimers && window.__cancelEventPopupTimers(document.getElementById('eventPopup')); }catch(_e){}

	const popup = document.getElementById('eventPopup');
	const titleEl = document.getElementById('eventPopupTitle');
	const optionsEl = document.getElementById('eventPopupOptions');

	if (!popup || !titleEl || !optionsEl) return;

	// --- UI mode switch ---
	const isGrowthCompact = (String(title || '') === '成長選択');

	// reset layout-related classes/styles to avoid inheriting other modes
	try {
		popup.classList.remove('growthbar-ui');
		popup.classList.remove('expanded');
		popup.classList.remove('selection-lock');
		popup.classList.remove('has-options');
		popup.classList.remove('growth-compact-ui');
		if (popup.dataset) popup.dataset.uiMode = 'default';
		// reset positioning that other modes may set
		popup.style.width = '';
		popup.style.maxWidth = '';
		popup.style.height = '';
		popup.style.maxHeight = '';
		popup.style.padding = '';
		popup.style.overflow = '';
		popup.style.right = '';
		popup.style.bottom = '';
	} catch (e) {}

	popup.style.display = 'block';
	popup.style.visibility = 'visible';
	popup.style.position = 'fixed';

	if (isGrowthCompact) {
		// ✅ Compact growth selector: right-middle dock
		if (popup.dataset) popup.dataset.uiMode = 'growth-compact';
		popup.classList.add('growth-compact-ui');

		popup.style.top = '50%';
		popup.style.left = 'auto';
		popup.style.right = '12px';
		popup.style.transform = 'translateY(-50%)';

		// draggable + persistent position
		try{ window.__ensureGrowthPopupDraggable(popup); }catch(e){}
		try{ window.__applyGrowthPopupSavedPos(popup); }catch(e){}
	} else {
		// default: centered
		popup.style.top = '50%';
		popup.style.left = '50%';
		popup.style.transform = 'translate(-50%, -50%)';
	}

	// title
	titleEl.textContent = title;

	// options clear
	while (optionsEl.firstChild) optionsEl.removeChild(optionsEl.firstChild);

	// --- icon helper (growth compact only) ---
	function growthIconFor(opt) {
		const label = String(opt && opt.label ? opt.label : '');
		const value = String(opt && opt.value ? opt.value : '');
		// label-based
		if (label.includes('攻') || label.toLowerCase().includes('atk')) return '⚔️';
		if (label.includes('防') || label.toLowerCase().includes('def')) return '🛡️';
		if (label.includes('速') || label.toLowerCase().includes('spd')) return '💨';
		if (label.includes('体') || label.toLowerCase().includes('hp')) return '❤️';
		if (label.includes('魔') || label.toLowerCase().includes('mp')) return '🔮';
		if (label.includes('何') || label.includes('上げない') || label.includes('スキップ') || label.includes('見送')) return '⏭️';
		// value-based fallback
		if (value.includes('atk') || value.includes('attack')) return '⚔️';
		if (value.includes('def')) return '🛡️';
		if (value.includes('spd') || value.includes('speed')) return '💨';
		if (value.includes('hp')) return '❤️';
		if (value.includes('mp')) return '🔮';
		if (value.includes('skip') || value.includes('none')) return '⏭️';
		return '✨';
	}

	// ボタン生成
	options.forEach(opt => {
		const btn = document.createElement('button');

		if (isGrowthCompact) {
			btn.className = 'event-opt-icon';
			const icon = growthIconFor(opt);

			const fullLabel = String(opt.label || '').trim();
			const isSkip = (String(opt.value || '') === 'skip') || fullLabel.includes('次回成長x') || fullLabel.includes('次回成長×');

			if (isSkip) {
				// Keep multiplier text readable: make this button span 2 columns with a single-line label.
				btn.classList.add('event-opt-skip');

				// Extract "x1.23" part if present
				let multPart = '';
				const m = fullLabel.match(/次回成長[×x]\s*([0-9.]+)/);
				if (m && m[1]) multPart = 'x' + m[1];

				const text = multPart ? `次回成長 ${multPart}` : fullLabel;
				btn.innerHTML = `<span class="icon">${icon}</span><span class="skip-text">${text}</span>`;
				btn.setAttribute('title', fullLabel);
			} else {
				// label short
				let shortLabel = fullLabel
					.replace(/(を|に|へ).*/g, '')  // "攻撃を上げる" -> "攻撃"
					.replace(/上げる|増やす|強化|成長/g, '')
					.trim();
				if (!shortLabel) shortLabel = fullLabel;

				btn.innerHTML = `<span class="icon">${icon}</span><span class="label">${shortLabel}</span>`;
				btn.setAttribute('title', fullLabel);
			}
		} else {
			btn.textContent = opt.label;
		}

		btn.onclick = () => {
			try{
				if (btn && btn.disabled) return;
				if (isGrowthCompact) {
					// Growth selection: keep panel open, grey-out buttons after selection
					if (typeof onSelect === 'function') onSelect(opt.value);
					try{
						const all = optionsEl.querySelectorAll('button');
						all.forEach(b => {
							b.disabled = true;
							b.classList.add('event-opt-disabled');
						});
					}catch(e){}
					try{
						popup.style.display = 'block';
						popup.style.visibility = 'visible';
					}catch(e){}
					return;
				}
				if (typeof onSelect === 'function') onSelect(opt.value);
			} finally {
				clearEventPopup(false);
			}
		};

		optionsEl.appendChild(btn);
	});

// --- FIX: ensure popup is recognized as having options immediately (prevents CSS auto-hide) ---
try{
	popup.classList.add('has-options');
	window.isPopupSelecting = true;
	// re-assert visible in next ticks (in case other guards race)
	(window.__battleSetTimeout || window.setTimeout)(() => {
		try{
			popup.style.display = 'block';
			popup.style.visibility = 'visible';
			popup.classList.add('has-options');
		}catch(_e){}
	}, 0);
	(window.__battleSetTimeout || window.setTimeout)(() => {
		try{
			popup.style.display = 'block';
			popup.style.visibility = 'visible';
			popup.classList.add('has-options');
		}catch(_e){}
	}, 80);
}catch(_e){}

};


// --- Growth bar: auto-pick visual (expand briefly, then collapse) ---
