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


document.addEventListener('DOMContentLoaded', () => {
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
  document.getElementById('skillSimulCount').addEventListener('change', e => {
    skillSimulCount = parseInt(e.target.value);
  });
});

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

window.chooseGrowth = function(stat) {
  const growthAmount = Math.floor(enemy[stat] * 0.08); // 成長量8%
  if (!player.growthBonus) {
    player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
  }
  player.growthBonus[stat] += growthAmount;
  player[stat] = player.baseStats[stat] + player.growthBonus[stat];

  // 戦闘ログにも書き込み
  const logEl = document.getElementById('battleLog');
  logEl.textContent += `\n成長: ${stat} が 敵の${stat}の8%（+${growthAmount}) 上昇\n`;

  document.getElementById('growthSelect').style.display = 'none';
  isWaitingGrowth = false; // バトル再開許可
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
  return `${displayName(c.name)}: ATK ${c.attack}, DEF ${c.defense}, SPD ${c.speed}, HP ${c.hp}/${c.maxHp}`;
};

// スキル一覧表示用HTML生成（ホバーで説明）
window.formatSkills = function(c) {
  return 'スキル: ' + c.skills.map(s => {
    const found = skillPool.find(sk => sk.name === s.name);
    var desc = '';
    if (found) {
      desc = found.description;
    }
    return `<span title='${desc}'>${s.name} Lv${s.level}</span>`;
  }).join(', ');
};

// ステータス表示の更新
window.updateStats = function() {
  const pHtml = `<div>${formatStats(player)}</div><div>${formatSkills(player)}</div>`;
  const eHtml = `<div>${formatStats(enemy)}</div><div>${formatSkills(enemy)}</div>`;
  document.getElementById('playerStats').innerHTML = pHtml;
  document.getElementById('enemyStats').innerHTML = eHtml;
  drawCharacterImage(displayName(player.name), 'playerImg');
  drawCharacterImage(displayName(enemy.name), 'enemyImg');

};

// 「はじめから」スタート（タイトル画面非表示、ゲーム画面表示）
window.startNewGame = function() {
  statusLogged = false;
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById("battleArea").classList.add("hidden");
    currentStreak = 0;
	  // スキルメモリの表示を有効化
	document.getElementById("skillMemoryContainer").style.display = "block";
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
  switch (skillData.category) {
    case 'multi': {
      let dmg = Math.max(0, user.attack - target.defense / 2);
      const barrierEff = target.effects.find(e => e.type === 'barrier');
      if (barrierEff) {
        dmg = Math.max(0, Math.floor(dmg * (1 - barrierEff.reduction)));
      }
      const baseHits = skillData.baseHits || 1;
      let hits = baseHits;
      if (skillData.extraHits && skill.level >= (skillData.extraHitsTriggerLevel || 9999)) {
        hits += skillData.extraHits;
      }
      for (let i = 0; i < hits; i++) {
        // ダメージ算出（バリア軽減後）
        target.hp -= dmg;
        totalDamage += dmg;
        log.push(`${displayName(user.name)}の${skill.name}：${dmg}ダメージ (${i + 1}回目)`);
      }
      break;
    }
    case 'poison': {
      const dmg = skillData.power + skill.level * skillData.levelFactor;
      target.effects.push({ type: '毒', damage: Math.floor(dmg), remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}に毒 ${dmg.toFixed(1)}×${skillData.duration}ターン`);
      break;
    }
    case 'burn': {
      const dmg = skillData.power + skill.level * skillData.levelFactor;
      target.effects.push({ type: '火傷', damage: Math.floor(dmg), remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}に火傷 ${dmg.toFixed(1)}×${skillData.duration}ターン`);
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
      target.effects.push({ type: 'seal', remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}は${skillData.duration}ターンスキル封印状態`);
      break;
    }
    case 'barrier': {
      user.effects.push({ type: 'barrier', reduction: skillData.reduction, remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターンダメージ軽減バリア展開`);
      break;
    }
    case 'regen': {
      const healPerTurn = Math.floor(skillData.amount + skillData.levelFactor * skill.level);
      user.effects.push({ type: 'regen', heal: healPerTurn, remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターン毎ターン${healPerTurn}HP回復`);
      break;
    }
    case 'reflect': {
      user.effects.push({ type: 'reflect', percent: skillData.reflectPercent, remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターンダメージ反射状態`);
      break;
    }
    case 'evasion': {
      user.effects.push({ type: 'evasion', chance: skillData.evasionChance, remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターン回避率上昇`);
      break;
    }
    case 'buff': {
      // 複数ステータスの強化にも対応
      skillData.targetStats.forEach(stat => {
        // 同じステータスに既存の強化効果がある場合は上書き（まず解除）
        const existing = user.effects.find(e => e.type === 'buff' && e.stat === stat);
        if (existing) {
          user[stat] = existing.original;
          user.effects = user.effects.filter(e => e !== existing);
        }
        const original = user[stat];
        user[stat] = Math.floor(user[stat] * skillData.factor);
        user.effects.push({ type: 'buff', stat: stat, original: original, remaining: skillData.duration });
      });
      log.push(`${displayName(user.name)}の${skill.name}：${skillData.duration}ターン能力強化`);
      break;
    }
    case 'debuff': {
      skillData.targetStats.forEach(stat => {
        const existing = target.effects.find(e => e.type === 'debuff' && e.stat === stat);
        if (existing) {
          target[stat] = existing.original;
          target.effects = target.effects.filter(e => e !== existing);
        }
        const original = target[stat];
        target[stat] = Math.floor(target[stat] * skillData.factor);
        target.effects.push({ type: 'debuff', stat: stat, original: original, remaining: skillData.duration });
      });
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}の能力低下（${skillData.duration}ターン）`);
      break;
    }
    case 'buffExtension': {
      let extended = false;
      user.effects.forEach(e => {
        if (e.type === 'buff' || e.type === 'berserk') {
          e.remaining += skillData.extendTurns;
          extended = true;
        }
      });
      if (extended) {
        log.push(`${displayName(user.name)}の${skill.name}：強化効果延長+${skillData.extendTurns}ターン`);
      } else {
        log.push(`${displayName(user.name)}の${skill.name}：効果なし`);
      }
      break;
    }
    case 'debuffExtension': {
      let extended = false;
      target.effects.forEach(e => {
        if (e.type === 'debuff') {
          e.remaining += skillData.extendTurns;
          extended = true;
        }
      });
      if (extended) {
        log.push(`${displayName(user.name)}の${skill.name}：弱体効果延長+${skillData.extendTurns}ターン`);
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
      target.effects.push({ type: 'stun', remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：${displayName(target.name)}を${skillData.duration}ターン行動不能にした`);
      break;
    }
    case 'berserk': {
      // 攻撃大幅アップ＆防御大幅ダウン効果
      const origAtk = user.attack;
      const origDef = user.defense;
      user.attack = Math.floor(user.attack * 2.0);
      user.defense = Math.floor(user.defense * 0.5);
      user.effects.push({ type: 'berserk', originalAttack: origAtk, originalDefense: origDef, remaining: skillData.duration });
      log.push(`${displayName(user.name)}の${skill.name}：攻撃力大幅上昇、防御力大幅減少（${skillData.duration}ターン）`);
      break;
    }
    default: {
      // 対応しないスキルカテゴリの場合（何もしない）
      break;
    }
  }
  // ダメージ実績を記録
  user.battleStats[skill.name] = (user.battleStats[skill.name] || 0) + totalDamage;
};

// バトル開始処理（1戦ごと）
window.startBattle = function() {
  document.getElementById("battleArea").classList.remove("hidden");
	drawSkillMemoryList();
  const name = document.getElementById('inputStr').value || 'あなた';
  if (!player || (!isLoadedFromSave && displayName(player.name) !== name)) {
    const tmpChar = makeCharacter(name);
    player = {
      ...tmpChar,
      growthBonus: tmpChar.growthBonus || { attack: 0, defense: 0, speed: 0, maxHp: 0 }
    };
		drawSkillMemoryList();
  try {
  } catch (e) {
  }
    try {
    } catch (e) {
    }
  }
  enemy = makeCharacter('敵' + Math.random());
	

  enemy.skills.forEach(skill => {
  // ★修正ポイント：倍率を1にする！
  const rarityBase = Math.floor(enemy.rarity * 1);  // ★ここ！
  let randomBoost = 0;
  
  if (currentStreak >= 10) {
    randomBoost = Math.floor(Math.pow(Math.random(), 8) * 300);
  }
  
  const finalLevel = Math.min(999, rarityBase + randomBoost);
  skill.level = Math.max(1, finalLevel);
});

//alert('[A001] [A396] enemy生成: ' + JSON.stringify(enemy?.baseStats));
  // 連勝数に応じた敵の強化
	
	//alert('計算前のenemyattackの値は: ' +enemy.attack);
	//alert('計算前のcurrentの値は: ' +currentStreak);
	
	
  if (currentStreak > 0) {
    const factor = Math.pow(1.1, currentStreak);
		
		//alert('計算中のfactorの値は: ' +factor);
		
    enemy.attack = Math.floor(getEffectiveStat(enemy, 'attack') * factor);
    enemy.defense = Math.floor(getEffectiveStat(enemy, 'defense') * factor);
    enemy.speed = Math.floor(getEffectiveStat(enemy, 'speed') * factor);
    enemy.maxHp = Math.floor(enemy.maxHp * factor);
    enemy.hp = enemy.maxHp;
  }
	
	//alert('計算後のenemyattackの値は: ' +enemy.attack);
	
  // 前回の効果をクリア
  player.effects = [];
  enemy.effects = [];
  updateStats();
  const log = [];
	
	[player, enemy].forEach(c => {
  if (!c.skills) return;
  c.skills.forEach(sk => {
    sk.sealed = false; // 封印解除
   });
  });
	
  applyPassiveSkills(player, enemy, log);
  applyPassiveSkills(enemy, player, log);
  let streakBonus = 1 + currentStreak * 0.02;
  
	//alert('現在のstreakBonusの値は: ' + streakBonus);
	
	const adjustedRarity = (enemy.rarity * streakBonus).toFixed(2);
  log.push(`敵のステータス倍率（Rarity）: ${adjustedRarity}倍（基礎 ${enemy.rarity.toFixed(2)} × 連勝補正 ${streakBonus.toFixed(2)}）`);
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
    recordHP();

  // バフ・デバフを戦闘後にリセット
  if (player._originalStats) {
    player.attack = player._originalStats.attack;
    player.defense = player._originalStats.defense;
    player.speed = player._originalStats.speed;
    player.maxHp = player._originalStats.maxHp;
   // if (player.hp > player.maxHp) player.hp = player.maxHp;
  }
    // 継続効果の処理（毒・火傷・再生など）
    [player, enemy].forEach(ch => {
      // 各効果を処理
      for (let eff of ch.effects) {
        if (eff.remaining > 0) {
          if (eff.type === '毒' || eff.type === '火傷') {
            ch.hp -= eff.damage;
            log.push(`${displayName(ch.name)}は${eff.type}で${eff.damage}ダメージ`);
            ch.battleStats[eff.type] = (ch.battleStats[eff.type] || 0) + eff.damage;
          } else if (eff.type === 'regen') {
            const heal = Math.min(ch.maxHp - ch.hp, eff.heal);
            ch.hp += heal;
            if (heal > 0) log.push(`${displayName(ch.name)}は再生効果で${heal}HP回復`);
          }
          // ターン経過させる
          eff.remaining--;
        }
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
      const useSkill = !sealed && Math.random() < 0.5 && actor.skills.length > 0;
      if (useSkill) {
        // スキルを複数同時発動（skillSimulCount分）
        
const mySkillCount = player.skills.length;
const enemySkillCount = enemy.skills.length;
let effectiveCount = skillSimulCount;

if (mySkillCount < skillSimulCount && enemySkillCount < skillSimulCount) {
  effectiveCount = Math.max(mySkillCount, enemySkillCount);
}

const chosenSkills = actor.skills.length >= effectiveCount
  ? actor.skills.sort(() => 0.5 - Math.random()).slice(0, effectiveCount)
  : getExpandedSkills(actor.skills, effectiveCount);

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
    turn++;
  }
  const playerWon = player.hp > 0 && (enemy.hp <= 0 || player.hp > enemy.hp);
  recordHP();

  // 戦闘後に baseStats + growthBonus に再初期化
  if (player.baseStats && player.growthBonus) {
    player.attack = player.baseStats.attack + player.growthBonus.attack;
    player.defense = player.baseStats.defense + player.growthBonus.defense;
    player.speed = player.baseStats.speed + player.growthBonus.speed;
    player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
    player.hp = player.maxHp;
  }
  streakBonus = 1 + currentStreak * 0.01;
  const effectiveRarity = enemy.rarity * streakBonus;

  if (playerWon && Math.random() < effectiveRarity * 0.03) {
  isWaitingGrowth = true;
  document.getElementById('growthSelect').style.display = 'block';
} else if (playerWon) {
  const logEl = document.getElementById('battleLog');
  logEl.textContent += `\n今回は成長なし（確率 ${(effectiveRarity * 0.03 * 100).toFixed(2)}%）\n`;
}

  player.tempEffects = { attackMod: 1.0, defenseMod: 1.0, speedMod: 1.0 };

  // バフ・デバフを戦闘後にリセット
  if (player._originalStats) {
    player.attack = player._originalStats.attack;
    player.defense = player._originalStats.defense;
    player.speed = player._originalStats.speed;
    player.maxHp = player._originalStats.maxHp;
  //  if (player.hp > player.maxHp) player.hp = player.maxHp;
  }
  if (playerWon) {
    currentStreak++;
		
		showCustomAlert(`\n勝利：${displayName(enemy.name)}に勝利\n現在連勝数：${currentStreak}`,2000);
		
    log.push(`\n勝者：${displayName(player.name)}\n連勝数：${currentStreak}`);
    // 戦闘終了時に残る強化・弱体を解除
    player.effects.forEach(eff => {
      if (eff.type === 'buff') player[eff.stat] = eff.original;
      if (eff.type === 'debuff') player[eff.stat] = eff.original;
      if (eff.type === 'berserk') { player.attack = eff.originalAttack; player.defense = eff.originalDefense; }
    });
    player.effects = [];
		
    // スキル熟練度チェック（5回使用でLvアップ）
    player.skills.forEach(sk => {
      if (sk.uses >= 5 && sk.level < 999) {
        sk.level++;
        sk.uses = 0;
        player.skillMemory[sk.name] = sk.level;
        log.push(`スキル熟練: ${sk.name} が Lv${sk.level} にアップ！`);
				drawSkillMemoryList();
      }
      else {
      }
    });
    // 新スキル習得のチャンス
    // 敵のRarityに応じたスキル取得確率
    const rarity = enemy.rarity * (1 + currentStreak * 0.01);
    const skillGainChance = Math.min(1.0, 0.1 * rarity);
    log.push(`\n新スキル獲得率（最大10%×Rarity）: ${(skillGainChance * 100).toFixed(1)}%`);
    if (Math.random() < skillGainChance) {
      const owned = new Set(player.skills.map(s => s.name));
      const enemyOwned = enemy.skills.filter(s => !owned.has(s.name));
      if (enemyOwned.length > 0) {
        const newSkill = enemyOwned[Math.floor(Math.random() * enemyOwned.length)];
        const savedLv = player.skillMemory[newSkill.name] || 1;
        player.skills.push({ name: newSkill.name, level: savedLv, uses: 0 });
        log.push(`新スキル習得: ${newSkill.name} (Lv${savedLv}) を習得！`);
				if (!document.getElementById("skillMemoryList").classList.contains("hidden")) {
          drawSkillMemoryList();
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
    drawSkillMemoryList();}
  } else {

		stopAutoBattle()
		
		showCustomAlert(`\n敗北：${displayName(enemy.name)}に敗北\n最終連勝数：${currentStreak}`,4000, "#ff4d4d", "#fff");
		
		currentStreak = 0;
		streakBonus = 1;
    log.push(`\n敗北：${displayName(enemy.name)}に敗北\n連勝数：0`);
		
		if (player.baseStats && player.growthBonus) {
      player.attack = player.baseStats.attack + player.growthBonus.attack;
      player.defense = player.baseStats.defense + player.growthBonus.defense;
      player.speed = player.baseStats.speed + player.growthBonus.speed;
      player.maxHp = player.baseStats.maxHp + player.growthBonus.maxHp;
      player.hp = player.maxHp;
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
  // 最終HP表示
//  log.push(`\n${displayName(player.name)} 残HP: ${player.hp}/${player.maxHp}`);
  log.push(`${displayName(enemy.name)} 残HP: ${enemy.hp}/${enemy.maxHp}`);
  // ダメージ内訳表示
  log.push(`\n${displayName(player.name)} のダメージ内訳`);
  for (let key in player.battleStats) {
    log.push(`${key}：${player.battleStats[key]}`);
  }
	
  if (player.hp > player.maxHp) player.hp = player.maxHp;

  log.push(`
現在の連勝数: ${currentStreak}`);
  const maxStreak = parseInt(localStorage.getItem('maxStreak') || '0');
  if (currentStreak > maxStreak) {
    localStorage.setItem('maxStreak', currentStreak);
  }
  log.push(`最大連勝数: ${Math.max(currentStreak, maxStreak)}`);

  document.getElementById('battleLog').textContent = log.join('\n');
  drawHPGraph();
  updateStats();
	drawSkillMemoryList();
  try {
  } catch (error) {
  }
};



// セーブデータの署名用SHA-256ハッシュ生成
async function generateHash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// セーブデータをコード化してコピー（base64 + SHA-256）
window.exportSaveCode = async function() {
  if (!player) return;
  const payload = { player, currentStreak, sslot, skillMemoryOrder:Object.entries(player.skillMemory), rebirthCount: parseInt(localStorage.getItem('rebirthCount') || '0') };
  const raw = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(raw)));
  const hash = await generateHash(b64);
  const code = b64 + '.' + hash;
  const box = document.getElementById('saveCodeBox');
  box.value = code;
  try {
    await navigator.clipboard.writeText(code);
  } catch (e) {
    box.focus();
    box.select();
  }
  // テキストファイルとして保存
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rpg_save.txt';
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
    try { raw = decodeURIComponent(escape(atob(b64))); } catch (e) { throw new Error('デコード失敗'); }
    const parsed = JSON.parse(raw);
    player = parsed.player;
    if (!player.growthBonus) {
      player.growthBonus = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
    }
    currentStreak = parsed.currentStreak || 0;
    localStorage.setItem('rebirthCount', (parsed.rebirthCount || 0) + 1);
    enemy = makeCharacter('敵' + Math.random());
//alert('[A005] [A732] enemy生成: ' + JSON.stringify(enemy?.baseStats));
    updateStats();
    document.getElementById('titleScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById("battleArea").classList.add("hidden");
    // 連勝数・転生回数表示更新（必要なら）
    if (document.getElementById('currentStreakDisplay')) {
      document.getElementById('currentStreakDisplay').textContent = '連勝数：' + currentStreak;
    }
    if (document.getElementById('rebirthCountDisplay')) {
      document.getElementById('rebirthCountDisplay').textContent = '転生回数：' + (localStorage.getItem('rebirthCount') || 0);
    }
  } catch (e) {
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
      currentStreak = parsed.currentStreak || 0;
      enemy = makeCharacter('敵' + Math.random());
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
  const rand = seededRandom(name);
  const multiplier = getRarityMultiplierFromRand(rand);

  const skills = [];
  const used = new Set();
  while (skills.length < 3) {
    const s = skillPool[Math.floor(rand() * skillPool.length)];
    if (!used.has(s.name)) {
      used.add(s.name);
      skills.push({ name: s.name, level: 1, uses: 0 });
    }
  }

  const baseStats = {
    attack: Math.floor((80 + Math.floor(rand() * 40)) * multiplier),
    defense: Math.floor((40 + Math.floor(rand() * 30)) * multiplier),
    speed: Math.floor((30 + Math.floor(rand() * 20)) * multiplier),
    maxHp: Math.floor(300 * multiplier)
  };

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

function drawSkillMemoryList() {
  const list = document.getElementById("skillMemoryList");
  if (!list || !player || !player.skillMemory) return;
  list.innerHTML = "";

  Object.entries(player.skillMemory).forEach(([name, level]) => {
    const li = document.createElement("li");
    li.textContent = `${name} Lv${level}`;
    li.setAttribute("data-name", name);
    li.setAttribute("data-level", level);
    li.setAttribute("draggable", "true");

    // パッシブスキルならクラスを付ける
    const skillDef = skillPool.find(s => s.name === name);
    if (skillDef && skillDef.category === "passive") {
      li.classList.add("passive");
    }

    // ドラッグ開始
    li.ondragstart = e => {
      e.dataTransfer.setData("text/plain", name);
    };

    // ドラッグ中に上に乗ったとき
    li.ondragover = e => {
      e.preventDefault();
      li.style.border = "2px dashed #888";
    };

    // ドラッグが離れたとき
    li.ondragleave = () => {
      li.style.border = "";
    };

    // ドロップ時の並び替え処理
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

window.drawHPGraph = function () {
	if (isAutoBattle) return; // ← 長押し中は描画スキップ
  const canvas = document.getElementById('hpChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxTurns = hpHistory.length || 1;
  const stepX = canvas.width / (maxTurns - 1);

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
  hpShineOffset += 2;
  if (hpShineOffset > canvas.width) hpShineOffset = -100;

  const shineGrad = ctx.createLinearGradient(hpShineOffset, 0, hpShineOffset + 100, 0);
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
  ctx.save();
  ctx.translate(5, canvas.height / 2 + 20);
  ctx.rotate(-Math.PI / 2);
  ctx.restore();

  // 次フレームへ再描画
  requestAnimationFrame(window.drawHPGraph);
};

function showCustomAlert(message, duration = 2000, bgColor = '#222', textColor = '#fff') {
  const alertBox = document.getElementById("customAlert");
  alertBox.textContent = message;
  alertBox.style.display = "block";
  alertBox.style.opacity = 1;
  alertBox.style.backgroundColor = bgColor;
  alertBox.style.color = textColor;

  setTimeout(() => {
    alertBox.style.opacity = 0;
    setTimeout(() => {
      alertBox.style.display = "none";
    }, 500);
  }, duration);
}


function applyPassiveSkills(unit, opponent, log) {
  if (!unit.skills) return;

  unit.skills.forEach(skill => {
    const skillDef = skillPool.find(s => s.name === skill.name);
    if (!skillDef || skillDef.category !== "passive") return;

    //log.push(`[DEBUG005] パッシブスキル認識: ${skill.name} ／ 効果: ${skillDef.effect}`);

    if (skillDef.effect === "blockTurnEffects") {
      if (!opponent.skills) return;

      const subtype = skillDef.subtype;  // サブタイプによる分類を取得

      opponent.skills.forEach(os => {
        const def = skillPool.find(k => k.name === os.name);
        if (!def || def.duration < 2) return;

        let typeMatch = false;
        if (!subtype) {
          typeMatch = true; // subtype指定がなければ全て封印
        } else if (subtype === "poison_burn") {
          typeMatch = def.category === "poison" || def.category === "burn";
        } else {
          typeMatch = def.category === subtype;
        }

        if (typeMatch) {
          os.sealed = true;
         // log.push(`相手スキル「${os.name}」を封印しました（カテゴリ: ${def.category}）`);
        }
      });

      log.push(`${displayName(unit.name)}のパッシブスキル「${skill.name}」が発動！`);

      opponent.skills.forEach(os => {
        if (os.sealed) {
          log.push(`スキル「${os.name}」は封印状態です`);
        }
      });
    }
  });
}