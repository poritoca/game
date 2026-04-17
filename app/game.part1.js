window.__escapeHtml = window.__escapeHtml || function(v){
  try{
    return String(v == null ? '' : v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }catch(_e){ return ''; }
};
window.__plainSkillDisplay = window.__plainSkillDisplay || function(skill){
  try{
    if(!skill) return '';
    const name = (typeof skill === 'string') ? skill : (skill.name || '');
    const lvl = Math.max(1, Number(skill.level || 1) || 1);
    const itemLv = Number(skill.itemLevel || skill.skillLevel || 0) || 0;
    return itemLv > 0 ? `${name} Lv${lvl} ItemLv${itemLv}` : `${name} Lv${lvl}`;
  }catch(_e){ return (skill && skill.name) ? String(skill.name) : String(skill || ''); }
};
window.__formatSkillDisplay = window.__formatSkillDisplay || function(skill){
  try{
    if(!skill) return '';
    const name = (typeof skill === 'string') ? skill : (skill.name || '');
    const lvl = Math.max(1, Number(skill.level || 1) || 1);
    const itemLv = Number(skill.itemLevel || skill.skillLevel || 0) || 0;
    const visual = Math.max(1, Math.min(7,
      lvl >= 9000 ? 7 :
      lvl >= 7000 ? 6 :
      lvl >= 5000 ? 5 :
      lvl >= 3000 ? 4 :
      lvl >= 1200 ? 3 :
      lvl >= 300 ? 2 : 1
    ));
    const safeName = window.__escapeHtml ? window.__escapeHtml(name) : String(name);
    return `<span class="battle-skill lv${visual}" data-visual="${visual}" data-level="${lvl}"><span class="battle-skill-name">${safeName}</span><span class="battle-skill-meta"><span class="battle-skill-lv">Lv${lvl}</span>${itemLv > 0 ? `<span class="battle-skill-itemlv">ItemLv${itemLv}</span>` : ''}</span></span>`;
  }catch(_e){
    try{ return window.__escapeHtml ? window.__escapeHtml(skill && skill.name ? skill.name : skill) : String(skill && skill.name ? skill.name : skill || ''); }catch(_){ return ''; }
  }
};
window.__battleDigestSafeName = window.__battleDigestSafeName || function(v){
  try{ return String(v == null ? '' : v).trim(); }catch(_e){ return ''; }
};
window.__battleDigestDisplayName = window.__battleDigestDisplayName || function(v){
  try{
    const safe = window.__battleDigestSafeName || function(x){ return String(x == null ? '' : x).trim(); };
    return (typeof displayName === 'function') ? safe(displayName(v || '')) : safe(v);
  }catch(_e){
    try{ return String(v == null ? '' : v).trim(); }catch(_){ return ''; }
  }
};
window.__battleDigestCollectSideNames = window.__battleDigestCollectSideNames || function(side){
  try{
    const safe = window.__battleDigestSafeName || function(x){ return String(x == null ? '' : x).trim(); };
    const dn = window.__battleDigestDisplayName || safe;
    const isPlayer = side === 'player';
    const aliases = isPlayer ? ['プレイヤー','自分','YOU','Player','主人公'] : ['敵','エネミー','ENEMY','相手'];
    const names = aliases.slice();
    const chars = [];
    try{ if (typeof player !== 'undefined' && player) chars.push({ side:'player', ref:player }); }catch(_e){}
    try{ if (window.player) chars.push({ side:'player', ref:window.player }); }catch(_e){}
    try{ if (typeof enemy !== 'undefined' && enemy) chars.push({ side:'enemy', ref:enemy }); }catch(_e){}
    try{ if (window.enemy) chars.push({ side:'enemy', ref:window.enemy }); }catch(_e){}
    chars.forEach(function(entry){
      try{
        if (!entry || entry.side !== side || !entry.ref) return;
        const nm = safe(entry.ref.name);
        const disp = dn(entry.ref.name);
        if (nm) names.push(nm);
        if (disp) names.push(disp);
      }catch(_e){}
    });
    return Array.from(new Set(names.map(safe).filter(Boolean))).sort(function(a,b){ return b.length - a.length; });
  }catch(_e){ return []; }
};
window.__battleDigestResolveActorSide = window.__battleDigestResolveActorSide || function(actorName){
  try{
    const safe = window.__battleDigestSafeName || function(x){ return String(x == null ? '' : x).trim(); };
    const actor = safe(actorName);
    if (!actor) return null;
    const playerNames = (typeof window.__battleDigestCollectSideNames === 'function') ? window.__battleDigestCollectSideNames('player') : [];
    const enemyNames = (typeof window.__battleDigestCollectSideNames === 'function') ? window.__battleDigestCollectSideNames('enemy') : [];
    if (playerNames.some(function(n){ return n && actor === n; })) return 'player';
    if (enemyNames.some(function(n){ return n && actor === n; })) return 'enemy';
    const pLong = playerNames.find(function(n){ return n && (actor.indexOf(n) >= 0 || n.indexOf(actor) >= 0); });
    const eLong = enemyNames.find(function(n){ return n && (actor.indexOf(n) >= 0 || n.indexOf(actor) >= 0); });
    if (pLong && !eLong) return 'player';
    if (eLong && !pLong) return 'enemy';
    if (/^(プレイヤー|自分|YOU|Player|主人公)/i.test(actor)) return 'player';
    if (/^(敵|エネミー|ENEMY|相手)/i.test(actor)) return 'enemy';
    return null;
  }catch(_e){ return null; }
};
window.__battleDigestRememberActorSide = window.__battleDigestRememberActorSide || function(side, actorName){
  try{
    if (side !== 'player' && side !== 'enemy') return side || null;
    window.__battleDigestLastActorSide = side;
    window.__battleDigestLastActorName = String(actorName == null ? '' : actorName);
    window.__battleDigestLastActorAt = Date.now();
    return side;
  }catch(_e){ return side || null; }
};
window.__battleDigestRememberItemOwner = window.__battleDigestRememberItemOwner || function(itemName, owner, skillName){
  try{
    const safe = window.__battleDigestSafeName || function(x){ return String(x == null ? '' : x).trim(); };
    const item = safe(itemName);
    if (!item) return null;
    const side = (typeof window.__battleGetCharacterSide === 'function') ? window.__battleGetCharacterSide(owner) : null;
    if (side !== 'player' && side !== 'enemy') return null;
    const skill = safe(skillName);
    const store = window.__battleDigestItemOwnerMap || (window.__battleDigestItemOwnerMap = {});
    const payload = { side:side, actorName:safe(owner && owner.name), displayName:(typeof window.__battleDigestDisplayName === 'function') ? window.__battleDigestDisplayName(owner && owner.name) : safe(owner && owner.name), skillName:skill, ts:Date.now() };
    store[item] = payload;
    if (skill) store[item + '::' + skill] = payload;
    window.__battleDigestRememberActorSide(side, payload.displayName || payload.actorName || item);
    return side;
  }catch(_e){ return null; }
};
window.__battleDigestResolveItemOwnerSide = window.__battleDigestResolveItemOwnerSide || function(itemName, skillName){
  try{
    const safe = window.__battleDigestSafeName || function(x){ return String(x == null ? '' : x).trim(); };
    const item = safe(itemName);
    const skill = safe(skillName);
    if (!item) return null;
    const store = window.__battleDigestItemOwnerMap || null;
    if (store){
      const hit = (skill && store[item + '::' + skill]) || store[item];
      if (hit && (hit.side === 'player' || hit.side === 'enemy')) return hit.side;
    }
    const buckets = [
      { side:'player', holder:(typeof player !== 'undefined' && player) ? player : window.player },
      { side:'enemy', holder:(typeof enemy !== 'undefined' && enemy) ? enemy : window.enemy }
    ];
    for (const bucket of buckets){
      const holder = bucket && bucket.holder;
      if (!holder || !Array.isArray(holder.itemMemory)) continue;
      const found = holder.itemMemory.find(function(it){
        if (!it || typeof it !== 'object') return false;
        const nm = safe((it.color||'') + (it.adjective||'') + (it.noun||''));
        if (nm !== item) return false;
        if (!skill) return true;
        return safe(it.skillName) === skill;
      });
      if (found) return bucket.side;
    }
    return window.__battleDigestLastActorSide || null;
  }catch(_e){ return null; }
};

window.__battleDigestKnownNames = window.__battleDigestKnownNames || function(kind){
  try{
    const safe = window.__battleDigestSafeName || function(v){ return String(v == null ? '' : v).trim(); };
    const out = [];
    const push = function(v){
      const n = safe(v);
      if (n) out.push(n);
    };
    if (kind === 'actor') {
      try{ (typeof window.__battleDigestCollectSideNames === 'function' ? window.__battleDigestCollectSideNames('player') : []).forEach(push); }catch(_e){}
      try{ (typeof window.__battleDigestCollectSideNames === 'function' ? window.__battleDigestCollectSideNames('enemy') : []).forEach(push); }catch(_e){}
    } else {
      try{
        if (typeof skillPool !== 'undefined' && Array.isArray(skillPool)) {
          skillPool.forEach(function(sk){ if (sk && sk.name) push(sk.name); });
        }
      }catch(_e){}
      const buckets = [];
      try{ if (typeof player !== 'undefined' && player) buckets.push(player); }catch(_e){}
      try{ if (window.player) buckets.push(window.player); }catch(_e){}
      try{ if (typeof enemy !== 'undefined' && enemy) buckets.push(enemy); }catch(_e){}
      try{ if (window.enemy) buckets.push(window.enemy); }catch(_e){}
      buckets.forEach(function(ch){
        try{
          if (ch && Array.isArray(ch.skills)) ch.skills.forEach(function(sk){ if (sk && sk.name) push(sk.name); });
          if (ch && Array.isArray(ch.itemMemory)) ch.itemMemory.forEach(function(it){
            if (!it || typeof it !== 'object') return;
            push(it.skillName);
            push(it.name);
            push((it.color||'') + (it.adjective||'') + (it.noun||''));
          });
        }catch(_e){}
      });
    }
    return Array.from(new Set(out.filter(Boolean))).sort(function(a,b){ return b.length - a.length; });
  }catch(_e){ return []; }
};
window.__battleDigestSanitizeSkillName = window.__battleDigestSanitizeSkillName || function(rawSkillName){
  try{
    const safe = window.__battleDigestSafeName || function(v){ return String(v == null ? '' : v).trim(); };
    let skillName = safe(rawSkillName);
    if (!skillName) return '';
    const known = (typeof window.__battleDigestKnownNames === 'function') ? window.__battleDigestKnownNames('skill') : [];
    if (known.includes(skillName)) return skillName;
    if (skillName.indexOf('の') >= 0) {
      for (const name of known) {
        if (!name) continue;
        if (skillName === name) return name;
        if (skillName.endsWith('の' + name)) return name;
        if (skillName.endsWith(name)) return name;
      }
      const segs = skillName.split('の').map(safe).filter(Boolean);
      for (let i = segs.length - 1; i >= 0; i--) {
        if (known.includes(segs[i])) return segs[i];
      }
      skillName = segs[segs.length - 1] || skillName;
    }
    return skillName;
  }catch(_e){
    try{ return String(rawSkillName == null ? '' : rawSkillName).trim(); }catch(_){ return ''; }
  }
};
window.__battleDigestParseSkillUsageLine = window.__battleDigestParseSkillUsageLine || function(rawLine){
  try{
    const safe = window.__battleDigestSafeName || function(v){ return String(v == null ? '' : v).trim(); };
    const line = safe(rawLine);
    const colonAt = line.indexOf('：');
    if (!line || colonAt < 0 || line.indexOf('の') < 0) return null;
    const head = safe(line.slice(0, colonAt));
    const detail = safe(line.slice(colonAt + 1));
    let actorName = '';
    let skillName = '';
    const actorNames = (typeof window.__battleDigestKnownNames === 'function') ? window.__battleDigestKnownNames('actor') : [];
    for (const name of actorNames) {
      if (!name) continue;
      const prefix = name + 'の';
      if (head.indexOf(prefix) === 0) {
        actorName = name;
        skillName = safe(head.slice(prefix.length));
        break;
      }
    }
    if (!actorName) {
      const splitAt = head.lastIndexOf('の');
      if (splitAt <= 0) return null;
      actorName = safe(head.slice(0, splitAt));
      skillName = safe(head.slice(splitAt + 1));
    }
    skillName = (typeof window.__battleDigestSanitizeSkillName === 'function') ? window.__battleDigestSanitizeSkillName(skillName) : skillName;
    if (!actorName || !skillName) return null;
    return { actorName:actorName, skillName:skillName, detail:detail };
  }catch(_e){ return null; }
};
window.__battleDigestParseItemUsageLine = window.__battleDigestParseItemUsageLine || function(rawLine){
  try{
    const safe = window.__battleDigestSafeName || function(v){ return String(v == null ? '' : v).trim(); };
    const line = safe(rawLine);
    if (!/^>>>\s*/.test(line) || line.indexOf('を発動') < 0) return null;
    const body = safe(line.replace(/^>>>\s*/, ''));
    const actorNames = (typeof window.__battleDigestKnownNames === 'function') ? window.__battleDigestKnownNames('actor') : [];
    for (const name of actorNames) {
      if (!name) continue;
      let rest = null;
      if (body.indexOf(name + 'の魔道具') === 0) rest = safe(body.slice((name + 'の魔道具').length));
      else if (body.indexOf(name + 'のアイテム') === 0) rest = safe(body.slice((name + 'のアイテム').length));
      if (rest == null) continue;
      let itemName = '';
      let skillName = '';
      let m = rest.match(/^[「"]?(.+?)[」"]?が\s*(.+?)\s*を発動/);
      if (m) {
        itemName = safe(m[1]);
        skillName = safe(m[2]).replace(/\s+Lv\s*\d+$/i, '');
      }
      if (itemName) {
        skillName = (typeof window.__battleDigestSanitizeSkillName === 'function') ? window.__battleDigestSanitizeSkillName(skillName) : skillName;
        return { actorName:name, itemName:itemName, skillName:skillName };
      }
    }
    let m = body.match(/^(?:魔道具|アイテム)[「"]?(.+?)[」"]?が\s*(.+?)\s*を発動/);
    if (m) {
      return { actorName:'', itemName:safe(m[1]), skillName:(typeof window.__battleDigestSanitizeSkillName === 'function') ? window.__battleDigestSanitizeSkillName(safe(m[2]).replace(/\s+Lv\s*\d+$/i, '')) : safe(m[2]) };
    }
    return null;
  }catch(_e){ return null; }
};
window.__lookupBattleSkillMeta = window.__lookupBattleSkillMeta || function(actorName, skillName, detail){
  try{
    const safe = window.__battleDigestSafeName || function(v){ return String(v == null ? '' : v).trim(); };
    const actor = safe(actorName);
    const skill = safe(skillName);
    const detailText = safe(detail);
    let side = (typeof window.__battleDigestResolveActorSide === 'function') ? window.__battleDigestResolveActorSide(actor) : null;
    if (!side && /^>>>\s*魔道具/.test(actor)) {
      side = (typeof window.__battleDigestResolveItemOwnerSide === 'function') ? window.__battleDigestResolveItemOwnerSide(skill, detailText) : null;
    }
    if (side) {
      try{ window.__battleDigestRememberActorSide(side, actor); }catch(_e){}
    }
    const ch = side === 'player'
      ? ((typeof player !== 'undefined' && player) ? player : window.player)
      : side === 'enemy'
        ? ((typeof enemy !== 'undefined' && enemy) ? enemy : window.enemy)
        : null;
    let level = 1, itemLevel = 0, kind = 'SKILL';
    if (ch && Array.isArray(ch.skills)){
      const sk = ch.skills.find(function(s){ return s && safe(s.name) === skill; });
      if (sk){
        level = Math.max(1, Number(sk.level || 1) || 1);
        itemLevel = Number(sk.itemLevel || sk.skillLevel || 0) || 0;
      }
    }
    if (ch && Array.isArray(ch.itemMemory)){
      const item = ch.itemMemory.find(function(it){ return it && (safe(it.skillName) === skill || safe(it.name) === skill || safe((it.color||'')+(it.adjective||'')+(it.noun||'')) === skill); });
      if (item){
        kind = 'ITEM';
        level = Math.max(1, Number(item.skillLevel || item.level || level || 1) || 1);
        itemLevel = Math.max(itemLevel, Number(item.skillLevel || 0) || 0);
      }
    }
    const lvm = detailText.match(/(?:^|\s)Lv\s*([0-9]+)/i);
    if (lvm) level = Math.max(1, Number(lvm[1]) || level || 1);
    const itemm = detailText.match(/ItemLv\s*([0-9]+)/i);
    if (itemm) itemLevel = Math.max(itemLevel, Number(itemm[1]) || 0);
    return { side: side, level: level, itemLevel: itemLevel, kind: kind };
  }catch(_e){ return { side:null, level:1, itemLevel:0, kind:'SKILL' }; }
};


'use strict';

// ===== GrowthBonus reset helper (used for non-progress loads) =====
window.__resetGrowthBonusToZero = window.__resetGrowthBonusToZero || function(){
  try{
    const zero = { attack: 0, defense: 0, speed: 0, maxHp: 0 };
    if (typeof player === 'object' && player) player.growthBonus = { ...zero };
    if (typeof window.player === 'object' && window.player) window.player.growthBonus = { ...zero };
  }catch(_e){}
};




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

	// =========================================================
	// 強ボス（ランダム遭遇・星UI・エンディング）設定
	// =========================================================
	window.STRONG_BOSS_ENABLED = (typeof window.STRONG_BOSS_ENABLED === 'boolean') ? window.STRONG_BOSS_ENABLED : true;
	window.STRONG_BOSS_MIN_BATTLES = Number.isFinite(window.STRONG_BOSS_MIN_BATTLES) ? window.STRONG_BOSS_MIN_BATTLES : 400;
	window.STRONG_BOSS_RATE = Number.isFinite(window.STRONG_BOSS_RATE) ? window.STRONG_BOSS_RATE : 0.001; // 0.1%
	// 強ボスの敵スキルレベル（デバッグで調整可能）
	window.STRONG_BOSS_SKILL_LEVEL_MIN = Number.isFinite(window.STRONG_BOSS_SKILL_LEVEL_MIN) ? window.STRONG_BOSS_SKILL_LEVEL_MIN : 5000;
	window.STRONG_BOSS_SKILL_LEVEL_MAX = Number.isFinite(window.STRONG_BOSS_SKILL_LEVEL_MAX) ? window.STRONG_BOSS_SKILL_LEVEL_MAX : 9999;

	window.STRONG_BOSS_MUL_BASE = Number.isFinite(window.STRONG_BOSS_MUL_BASE) ? window.STRONG_BOSS_MUL_BASE : 11;
	window.STRONG_BOSS_MUL_PER_BATTLE = Number.isFinite(window.STRONG_BOSS_MUL_PER_BATTLE) ? window.STRONG_BOSS_MUL_PER_BATTLE : 0.05;
	window.STRONG_BOSS_MUL_CAP = Number.isFinite(window.STRONG_BOSS_MUL_CAP) ? window.STRONG_BOSS_MUL_CAP : 50;
	window.STRONG_BOSS_SKILL_COUNT = Number.isFinite(window.STRONG_BOSS_SKILL_COUNT) ? window.STRONG_BOSS_SKILL_COUNT : 8;
	window.STRONG_BOSS_RARITY = Number.isFinite(window.STRONG_BOSS_RARITY) ? window.STRONG_BOSS_RARITY : 2.0;

	// 撃破数（セーブ/ロードで復元）
	if (!Number.isFinite(window.strongBossKillCount)) window.strongBossKillCount = 0;



	
	// =====================================================
	// 成長倍率連動「成長ボス（疑似ボス）」設定
	//  - 通常モードのみ。50戦ごとのボスとは別枠で出現。
	//  - 成長倍率（window.growthMultiplier）が高いほど
	//      出現率↑ / 強さ↑ / 画像レア度↑
	// =====================================================
	if (typeof window.GROWTH_BOSS_ENABLED !== "boolean") {
		window.GROWTH_BOSS_ENABLED = true;
	}

	// 出現率カーブ（成長倍率gmに対してログで伸びる）
	// 例: gm=1 -> base、gm=GROWTH_BOSS_RATE_LOG_SCALE(既定100) -> だいたい cap に近づく
	if (typeof window.GROWTH_BOSS_RATE_BASE !== "number") window.GROWTH_BOSS_RATE_BASE = 0.012; // 1.2%（全体的に控えめ）
	if (typeof window.GROWTH_BOSS_RATE_LOG_SCALE !== "number") window.GROWTH_BOSS_RATE_LOG_SCALE = 140; // 140倍付近で「まあまあ」になる基準（出にくく）
	if (typeof window.GROWTH_BOSS_RATE_LOG_POW !== "number") window.GROWTH_BOSS_RATE_LOG_POW = 1.25; // 低倍率域をさらに控えめに
	if (typeof window.GROWTH_BOSS_RATE_CAP !== "number") window.GROWTH_BOSS_RATE_CAP = 0.28; // 最大28%（全体的に下げる）

	// 強さスケール（“50戦ボス補正倍率”に対して掛けるスケール）
	// 低倍率時: 少し弱め（<1） / 高倍率時: 数倍（>1）
	if (typeof window.GROWTH_BOSS_STRENGTH_MIN_SCALE !== "number") window.GROWTH_BOSS_STRENGTH_MIN_SCALE = 0.85;
	if (typeof window.GROWTH_BOSS_STRENGTH_MAX_SCALE !== "number") window.GROWTH_BOSS_STRENGTH_MAX_SCALE = 3.0;
	if (typeof window.GROWTH_BOSS_STRENGTH_LOG_DIV !== "number") window.GROWTH_BOSS_STRENGTH_LOG_DIV = 100; // 100倍付近で伸びきる基準
	if (typeof window.GROWTH_BOSS_STRENGTH_SMOOTH_POW !== "number") window.GROWTH_BOSS_STRENGTH_SMOOTH_POW = 1.0;

	// 成長ボス勝利ボーナス（魔通貨）
	if (typeof window.GROWTH_BOSS_COIN_BASE !== "number") window.GROWTH_BOSS_COIN_BASE = 15;
	if (typeof window.GROWTH_BOSS_COIN_PER_SCALE !== "number") window.GROWTH_BOSS_COIN_PER_SCALE = 20; // scaleが上がるほど増える
	if (typeof window.GROWTH_BOSS_COIN_CAP !== "number") window.GROWTH_BOSS_COIN_CAP = 300;

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

	// Guard: when the battle dock is minimized, never auto-show overlays
	try {
		if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
			try { overlay.style.display = 'none'; } catch(e){}
			return;
		}
	} catch(_e) {}

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

window.__runCenteredPopupCloseHook = window.__runCenteredPopupCloseHook || function(popup) {
	try {
		const cb = popup && popup.__centeredPopupOnClose;
		if (popup) popup.__centeredPopupOnClose = null;
		if (typeof cb === 'function') cb();
	} catch (_e) {}
};

window.showCenteredPopup = function(message, duration = 3000, options) {
	const popup = document.getElementById("eventPopup");
	const title = document.getElementById("eventPopupTitle");
	const optionsEl = document.getElementById("eventPopupOptions");

	if (!popup || !title || !optionsEl) return;

	const opts = (options && typeof options === 'object') ? options : {};
	title.innerHTML = message;
	optionsEl.innerHTML = "";
	popup.__centeredPopupOnClose = (typeof opts.onClose === 'function') ? opts.onClose : null;

	popup.style.display = "block";
	popup.style.visibility = "hidden";

	const scrollTop = window.scrollY || document.documentElement.scrollTop;
	const popupHeight = popup.offsetHeight;
	popup.style.top = `${scrollTop + window.innerHeight / 2 - popupHeight / 2}px`;
	popup.style.left = "50%";
	popup.style.transform = "translateX(-50%)";
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
		try { window.__runCenteredPopupCloseHook && window.__runCenteredPopupCloseHook(popup); } catch (_e) {}
	}, duration);
};

window.updateSkillOverlay = function() {
	const el = document.getElementById('skillOverlay');
	// Guard: never show overlays during long-press auto battle
	if ((typeof isAutoBattle !== 'undefined') && !!isAutoBattle) {
		try { el.style.display = 'none'; } catch(e){}
		return;
	}

	// Guard: when the battle dock is minimized, never auto-show overlays
	try {
		if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
			try { el.style.display = 'none'; } catch(e){}
			return;
		}
	} catch(_e) {}

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

	// Guard: when the battle dock is minimized, never auto-show overlays
	try {
		if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
			try { el.style.display = 'none'; } catch(e){}
			return;
		}
	} catch(_e) {}

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

// Hide overlays (skill/score/item) forcefully (used when battle dock is minimized)
window.__hideBattleOverlays = window.__hideBattleOverlays || function() {
	try {
		const ids = ['skillOverlay','scoreOverlay','itemOverlay'];
		for (const id of ids) {
			const el = document.getElementById(id);
			if (!el) continue;
			el.style.setProperty('display', 'none', 'important');
		}
	} catch (_) {}
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
	try { window.__runCenteredPopupCloseHook && window.__runCenteredPopupCloseHook(popup); } catch (_e) {}
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

// toggleTopFold は「開いていたら閉じる」挙動のため、強制オープン用を用意
window.ensureTopFoldOpen = function(kind){
	try{
		const map = {
			log:   { el: document.getElementById('logArea'),    btn: document.getElementById('topFoldBtnLog') },
			items: { el: document.getElementById('itemsArea'),  btn: document.getElementById('topFoldBtnItems') },
			skills:{ el: document.getElementById('skillsArea'), btn: document.getElementById('topFoldBtnSkills') },
			settings:{ el: document.getElementById('settingsArea'), btn: document.getElementById('topFoldBtnSettings') }
		};
		const t = map[kind];
		if(!t || !t.el) return;

		Object.keys(map).forEach(k=>{
			const it = map[k];
			if(!it || !it.el) return;
			it.el.classList.add('hidden');
			if(it.btn) it.btn.classList.remove('active');
		});

		t.el.classList.remove('hidden');
		if(t.btn) t.btn.classList.add('active');
	}catch(e){}
};


// 強ボス 星UI / クリア条件（動的に変更できるように定数化）
try{
	if(!Number.isFinite(window.STRONG_BOSS_STAR_MAX)) window.STRONG_BOSS_STAR_MAX = 100;
	if(!Number.isFinite(window.STRONG_BOSS_ENDING_KILLS)) window.STRONG_BOSS_ENDING_KILLS = 5;
}catch(_e){}

// 強ボス撃破数 星UI（10個ごとに色が変わる）
window.updateStrongBossStarUI = function(){
	try{
		const box = document.getElementById('bossKillStars');
		const inner = document.getElementById('bossKillStarsInner');
		if(!box || !inner) return;

		let c = Number(window.strongBossKillCount || 0);
		if(!Number.isFinite(c)) c = 0;
		const starMax = Number.isFinite(window.STRONG_BOSS_STAR_MAX) ? window.STRONG_BOSS_STAR_MAX : 100;
		c = Math.max(0, Math.min(starMax, Math.floor(c)));

		if(c <= 0){
			box.classList.add('hidden');
			inner.innerHTML = '';
			return;
		}

		box.classList.remove('hidden');
		let html = '';
		for(let i=0;i<c;i++){
			const tier = Math.min(9, Math.floor(i / 10));
			html += '<span class="boss-star tier' + tier + '" aria-hidden="true">★</span>';
		}
		inner.innerHTML = html;
	}catch(e){}
};

// エンディング演出（強ボス5体撃破）
window.triggerEndingSequence = function(){
	try{
		if(document.getElementById('endingOverlay')) return;
		if(window.__endingShown) return;
		window.__endingShown = true;

		const overlay = document.createElement('div');
		overlay.id = 'endingOverlay';

		const inner = document.createElement('div');
		inner.className = 'ending-inner';

		const title = document.createElement('div');
		title.className = 'ending-title';
		title.textContent = 'Thank you for playing';

		const sub = document.createElement('div');
		sub.className = 'ending-sub';
		sub.textContent = '（タップで閉じる）';

		inner.appendChild(title);
		inner.appendChild(sub);
		overlay.appendChild(inner);

		const openedAt = Date.now();
		overlay.addEventListener('click', ()=>{
			try{
				if(Date.now() - openedAt < 1200) return; // 最低1秒は表示
				overlay.remove();
			}catch(e){}
		});

		document.body.appendChild(overlay);
	}catch(e){}
};

// DOMロード時に星UIを同期
document.addEventListener('DOMContentLoaded', ()=>{
	try{
		if(!Number.isFinite(window.strongBossKillCount)) window.strongBossKillCount = 0;
		if(typeof window.updateStrongBossStarUI === 'function') window.updateStrongBossStarUI();
	}catch(e){}
});



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
		chance = 0.005;
		formula = '鬼畜モード：skillGainChance = 0.005（固定）';
	} else {
		chance = Math.min(1.0, 0.01 * (rNow * (0.02 + streak * 0.002)));
		formula = '通常モード：min(1.0, 0.01 * (enemy.rarity * (0.02 + currentStreak * 0.002)))';
	}

	setText('guideSkillGainNow', `${(chance * 100).toFixed(3)}%`);
	setText('guideSkillGainFormula', formula);

	// =====================================================
	// Growth Multiplier / Growth Boss / Strong Boss (dynamic guide)
	// =====================================================
	const gm = Number(window.growthMultiplier || 1);
	setText('guideGrowthMultiplier', (Number.isFinite(gm) ? gm.toFixed(2) : '1.00'));

	// --- Growth Boss ---
	const gbEnabled = !!window.GROWTH_BOSS_ENABLED;
	setText('guideGrowthBossEnabled', gbEnabled ? 'ON' : 'OFF');

	// 出現率（現在の成長倍率での推定値も表示）
	try{
		const logScale = Number(window.GROWTH_BOSS_RATE_LOG_SCALE || 140);
		const xRaw = (gm > 1 && logScale > 1) ? (Math.log(gm) / Math.log(logScale)) : 0;
		const x = Math.max(0, Math.min(1, xRaw));
		const base = Number(window.GROWTH_BOSS_RATE_BASE || 0.012);
		const cap = Number(window.GROWTH_BOSS_RATE_CAP || 0.28);
		const pow = Number(window.GROWTH_BOSS_RATE_LOG_POW || 1.25);
		const p = Math.max(0, Math.min(cap, base + (cap - base) * Math.pow(x, pow)));
		setText('guideGrowthBossRate', `base=${(base*100).toFixed(2)}% / cap=${(cap*100).toFixed(1)}% / 現在≈${(p*100).toFixed(2)}%（logScale=${logScale}, pow=${pow}）`);
	}catch(_e){
		setText('guideGrowthBossRate', '-');
	}

	// 強さスケール
	try{
		const div = Number(window.GROWTH_BOSS_STRENGTH_LOG_DIV || (window.GROWTH_BOSS_RATE_LOG_SCALE || 140));
		const sxRaw = (gm > 1 && div > 1) ? (Math.log(gm) / Math.log(div)) : 0;
		const sx = Math.max(0, Math.min(1, sxRaw));
		const sMin = Number(window.GROWTH_BOSS_STRENGTH_MIN_SCALE || 1);
		const sMax = Number(window.GROWTH_BOSS_STRENGTH_MAX_SCALE || 2);
		const spow = Number(window.GROWTH_BOSS_STRENGTH_SMOOTH_POW || 1.0);
		const scale = sMin + (sMax - sMin) * Math.pow(sx, spow);
		setText('guideGrowthBossStrength', `min=${sMin} / max=${sMax} / 現在≈${scale.toFixed(3)}（logDiv=${div}, pow=${spow}）`);
	}catch(_e){
		setText('guideGrowthBossStrength', '-');
	}

	// 画像レア度ルール（実装の目安をそのまま表示）
	setHTML('guideGrowthBossRarityRule', `<code>D</code> → <code>C</code> → <code>B</code> → <code>A</code> → <code>S</code>（強さスケールに応じて引き上げ）`);

	// --- Strong Boss ---
	const sbEnabled = !!window.STRONG_BOSS_ENABLED;
	setText('guideStrongBossEnabled', sbEnabled ? 'ON' : 'OFF');
	const sbMin = Number(window.STRONG_BOSS_MIN_BATTLES || 400);
	const sbRate = Number(window.STRONG_BOSS_RATE || 0.001);
	setText('guideStrongBossMinBattles', sbMin);
	setText('guideStrongBossRate', `${(sbRate*100).toFixed(3)}%（約1/${(sbRate>0?Math.round(1/sbRate):'-')}）`);

	const sbLvMin = Number(window.STRONG_BOSS_SKILL_LEVEL_MIN || 5000);
	const sbLvMax = Number(window.STRONG_BOSS_SKILL_LEVEL_MAX || 9999);
	setText('guideStrongBossSkillLv', `${sbLvMin}〜${sbLvMax}`);

	const sbSkillCount = Number(window.STRONG_BOSS_SKILL_COUNT || 8);
	setText('guideStrongBossSkillCount', sbSkillCount);

	const starMax = Number.isFinite(window.STRONG_BOSS_STAR_MAX) ? window.STRONG_BOSS_STAR_MAX : 100;
	const c = Math.max(0, Math.min(starMax, Math.floor(Number(window.strongBossKillCount || 0))));
	setText('guideStrongBossStars', `${c}/${starMax}`);

	const clearKills = Number.isFinite(window.STRONG_BOSS_ENDING_KILLS) ? window.STRONG_BOSS_ENDING_KILLS : 5;
	setText('guideStrongBossClearKills', clearKills);
	setText('guideStrongBossClearKills2', clearKills);

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


// 戦闘経過トグルボタン（既定の開閉：状態が分かるようバッジ表示 / 下段ドックに移動）
const __refreshBattleLogToggleBtn = (btn) => {
	if (!btn) return;
	const isOpen = !!window.__battleLogDetailDefaultOpen;
	try { btn.dataset.state = isOpen ? 'open' : 'closed'; } catch (_e) {}
	try { btn.classList.toggle('is-open', isOpen); btn.classList.toggle('is-closed', !isOpen); } catch (_e) {}
	const title = isOpen ? '戦闘経過：既定=開（タップで切替）' : '戦闘経過：既定=閉（タップで切替）';
	btn.title = title;
	try { btn.setAttribute('aria-label', title); } catch (_e) {}
	// アイコン + 状態バッジ（開/閉）
	btn.innerHTML = `<span class="bl-ic" aria-hidden="true">📜</span><span class="bl-mini-state" aria-hidden="true">${isOpen ? '開' : '閉'}</span>`;
};

const __getOrCreateBattleLogToggleBtn = () => {
	let btn = document.getElementById('battleLogToggleBtn');
	if (!btn) {
		btn = document.createElement('button');
		btn.type = 'button';
		btn.id = 'battleLogToggleBtn';
		btn.className = 'battle-log-toggle bl-icon-btn bl-stateful';
		controls.appendChild(btn); // 一旦ここへ（後でtoolsRowへ移動）
		btn.addEventListener('click', () => {
			window.__battleLogDetailDefaultOpen = !window.__battleLogDetailDefaultOpen;
			__refreshBattleLogToggleBtn(btn);
			try {
				localStorage.setItem('battleLogDetailDefaultOpen', window.__battleLogDetailDefaultOpen ? 'open' : 'closed');
			} catch (_e) {}
		});
	}
	__refreshBattleLogToggleBtn(btn);
	return btn;
};

let __battleLogToggleBtnRef = null;
try { __battleLogToggleBtnRef = __getOrCreateBattleLogToggleBtn(); } catch (_e) {}

	// 追加：ログ操作ツール（全開/全閉 + 上/下スクロール）※文字サイズバーの下
	try {
		if (!document.getElementById('battleLogToolsRow')) {
			const toolsRow = document.createElement('div');
			toolsRow.id = 'battleLogToolsRow';
			toolsRow.className = 'battle-log-tools-row';

			// 戦闘経過：既定の開閉トグル（状態表示つき）を下段ドックへ
			try {
				const tbtn = __battleLogToggleBtnRef || document.getElementById('battleLogToggleBtn');
				if (tbtn) toolsRow.appendChild(tbtn);
			} catch (_e) {}


			const btnAll = document.createElement('button');
			btnAll.type = 'button';
			btnAll.id = 'battleLogExpandAllBtn';
			btnAll.className = 'battle-log-tool-btn bl-icon-btn';
			btnAll.textContent = '📂';
			try { btnAll.title = '表示済みログを全て開く'; btnAll.setAttribute('aria-label', btnAll.title); } catch (_e) {}

			const btnTop = document.createElement('button');
			btnTop.type = 'button';
			btnTop.id = 'battleLogScrollTopBtn';
			btnTop.className = 'battle-log-tool-btn bl-icon-btn';
			btnTop.textContent = '⤒';
			try { btnTop.title = 'ログの一番上へ'; btnTop.setAttribute('aria-label', btnTop.title); } catch (_e) {}

			const btnBottom = document.createElement('button');
			btnBottom.type = 'button';
			btnBottom.id = 'battleLogScrollBottomBtn';
			btnBottom.className = 'battle-log-tool-btn bl-icon-btn';
			btnBottom.textContent = '⤓';
			try { btnBottom.title = 'ログの一番下へ'; btnBottom.setAttribute('aria-label', btnBottom.title); } catch (_e) {}

			const getSections = () => {
				try {
					return Array.from(logEl.querySelectorAll('.turn-events-content, .turn-status-content'));
				} catch (_e) {
					return [];
				}
			};

			const setOpen = (contentEl) => {
				if (!contentEl) return;
				try {
					contentEl.style.maxHeight = 'none';
					contentEl.style.overflow = 'hidden';
					contentEl.setAttribute('aria-hidden', 'false');

					const headerEl = contentEl.previousElementSibling;
					if (headerEl && headerEl.classList) {
						headerEl.classList.add('open');
						const arrowEl = headerEl.querySelector('.turn-stats-arrow');
						if (arrowEl) arrowEl.textContent = '▼';
					}
				} catch (_e) {}
			};

			const setClose = (contentEl) => {
				if (!contentEl) return;
				try {
					contentEl.style.maxHeight = '0px';
					contentEl.style.overflow = 'hidden';
					contentEl.setAttribute('aria-hidden', 'true');

					const headerEl = contentEl.previousElementSibling;
					if (headerEl && headerEl.classList) {
						headerEl.classList.remove('open');
						const arrowEl = headerEl.querySelector('.turn-stats-arrow');
						if (arrowEl) arrowEl.textContent = '▶';
					}
				} catch (_e) {}
			};

			btnAll.addEventListener('click', () => {
				const sections = getSections();
				if (!sections.length) return;

				// どれか1つでも閉じていれば → 全部開く / 全部開いていれば → 全部閉じる
				const anyClosed = sections.some(el => {
					try {
						const aria = el.getAttribute('aria-hidden');
						return (aria === 'true') || (el.style.maxHeight === '0px') || (!el.style.maxHeight);
					} catch (_e) {
						return true;
					}
				});

				if (anyClosed) {
					sections.forEach(setOpen);
					btnAll.textContent = '📁';
						try { btnAll.title = '表示済みログを全て閉じる'; btnAll.setAttribute('aria-label', btnAll.title); } catch (_e) {}
				} else {
					sections.forEach(setClose);
					btnAll.textContent = '📂';
			try { btnAll.title = '表示済みログを全て開く'; btnAll.setAttribute('aria-label', btnAll.title); } catch (_e) {}
				}
			});

			btnTop.addEventListener('click', () => {
				try { logEl.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_e) { try { logEl.scrollTop = 0; } catch (_e2) {} }
			});

			btnBottom.addEventListener('click', () => {
				try { logEl.scrollTo({ top: logEl.scrollHeight, behavior: 'smooth' }); } catch (_e) { try { logEl.scrollTop = logEl.scrollHeight; } catch (_e2) {} }
			});

			toolsRow.appendChild(btnAll);
			toolsRow.appendChild(btnTop);
			toolsRow.appendChild(btnBottom);

				const btnMini = document.createElement('button');
				btnMini.type = 'button';
				btnMini.id = 'battleLogUltraMiniToggleBtn';
				btnMini.className = 'battle-log-tool-btn bl-icon-btn bl-ultramini-toggle';
				btnMini.textContent = '▁';
				try { btnMini.title = 'ログ操作部を超縮小'; btnMini.setAttribute('aria-label', btnMini.title); } catch (_e) {}
				toolsRow.appendChild(btnMini);
			controls.appendChild(toolsRow);
		}
	} catch (e) {}

		// 追加：ログ操作部の『超縮小』トグル（バー状態で省スペース）
		try {
			const ULTRA_KEY = 'battleLogUltraMini';
			const barId = 'battleLogUltraMiniBar';
			const btnId = 'battleLogUltraMiniToggleBtn';

			const ensureBar = () => {
				let bar = document.getElementById(barId);
				if (!bar) {
					bar = document.createElement('div');
					bar.id = barId;
					bar.className = 'battle-log-ultramini-bar';
					bar.innerHTML = '<span class="battle-log-ultramini-hint">タップで戻す</span>';
					controls.appendChild(bar);
				}
				return bar;
			};

			const setMini = (isMini) => {
				try { controls.classList.toggle('is-ultramini', !!isMini); } catch (_e) {}
				try { localStorage.setItem(ULTRA_KEY, isMini ? '1' : '0'); } catch (_e) {}
			};

			const barEl = ensureBar();
			let btnMini = document.getElementById(btnId);
			if (!btnMini) {
				// 旧版互換：toolsRowだけある場合にもボタンを追加
				const toolsRow = document.getElementById('battleLogToolsRow');
				if (toolsRow) {
					btnMini = document.createElement('button');
					btnMini.type = 'button';
					btnMini.id = btnId;
					btnMini.className = 'battle-log-tool-btn bl-icon-btn bl-ultramini-toggle';
					btnMini.textContent = '▁';
					try { btnMini.title = 'ログ操作部を超縮小'; btnMini.setAttribute('aria-label', btnMini.title); } catch (_e) {}
					toolsRow.appendChild(btnMini);
				}
			}

			if (btnMini && !btnMini.dataset.boundUltraMini) {
				btnMini.dataset.boundUltraMini = '1';
				btnMini.addEventListener('click', (ev) => {
					ev.stopPropagation();
					const next = !controls.classList.contains('is-ultramini');
					setMini(next);
				});
			}

			if (barEl && !barEl.dataset.boundUltraMini) {
				barEl.dataset.boundUltraMini = '1';
				barEl.addEventListener('click', (ev) => {
					ev.stopPropagation();
					setMini(false);
				});
			}

			let initMini = false;
			try { initMini = localStorage.getItem(ULTRA_KEY) === '1'; } catch (_e) {}
			setMini(initMini);
		} catch (_e) {}

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
				// Do NOT lock width permanently (it breaks the 0%<->non-0% compact/expand behavior).
				// Instead, keep it briefly to avoid immediate jitter, then release.
				try{
					dock.style.setProperty('width', Math.round(rect.width) + 'px','important');
					if (dock.__unlockWidthTimer) (window.__uiClearTimeout||clearTimeout)(dock.__unlockWidthTimer);
					dock.__unlockWidthTimer = (window.__uiSetTimeout||setTimeout)(() => {
						try{ dock.style.removeProperty('width'); }catch(_e){}
					}, 220);
				}catch(_e){}
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
		if (Number.isFinite(v) && v >= 0 && v <= 100) return v;
	}catch(_){}
	return 100;
};
window.__setUIOpacityPercent = window.__setUIOpacityPercent || function(p){
	try{
		let v = Number(p);
		if (!Number.isFinite(v)) v = 100;
		v = Math.max(0, Math.min(100, Math.round(v)));
		try{ localStorage.setItem(window.__uiOpacityKey, String(v)); }catch(_){}
		try{ window.__applyGlobalUIOpacity && window.__applyGlobalUIOpacity(); }catch(_){}
		return v;
	}catch(_){
		return 100;
	}
};
window.__getUIOpacityAlpha = window.__getUIOpacityAlpha || function(){
	const p = window.__getUIOpacityPercent ? window.__getUIOpacityPercent() : 100;
	return Math.max(0, Math.min(1, p/100));
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
				<button id="uiOpacityToggleBtn" type="button" class="ui-opacity-toggle" aria-label="透過度切替（20%刻み）">
					<span id="uiOpacityLabel">透過</span>
					<span class="uiOpacityValueWrap"><span id="uiOpacityValue">100</span><span class="uiOpacityPct">%</span></span>
				</button>
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
			const btn = wrap.querySelector('#uiOpacityToggleBtn');
			const valueEl = wrap.querySelector('#uiOpacityValue');
			if (btn && !btn.__wiredUIOpacity){
				btn.__wiredUIOpacity = true;

				const STEPS = [100, 80, 60, 40, 20, 0]; // 20%刻み（タップで減らしていく）
				const nearestStep = (p) => {
					let v = Number(p);
					if (!Number.isFinite(v)) v = 100;
					let best = STEPS[0], bestD = 1e9;
					for (const s of STEPS){
						const d = Math.abs(s - v);
						if (d < bestD){ bestD = d; best = s; }
					}
					return best;
				};

				const applyText = (p) => {
					try{ if (valueEl) valueEl.textContent = String(p); }catch(_e){}
					try{
						btn.dataset.opacity = String(p);
						try{ btn.style.setProperty('--uiOpacityP', String(Math.max(0, Math.min(1, Number(p)/100)))); }catch(_e){}
						btn.title = `透過度: ${p}%（タップで切替）`;
						btn.setAttribute('aria-label', `透過度 ${p}%（タップで切替）`);
					}catch(_e){}
				};

				const cycle = () => {
					const cur = nearestStep(window.__getUIOpacityPercent ? window.__getUIOpacityPercent() : 100);
					let idx = STEPS.indexOf(cur);
					if (idx < 0) idx = 0;
					const next = (idx + 1) >= STEPS.length ? STEPS[0] : STEPS[idx + 1];
					try{ window.__setUIOpacityPercent && window.__setUIOpacityPercent(next); }catch(_e){}
					applyText(next);
				};

				btn.addEventListener('click', (ev) => {
					try{ ev.preventDefault(); ev.stopPropagation(); }catch(_e){}
					cycle();
				}, {passive:false});

				// init from saved
				const saved = window.__getUIOpacityPercent ? window.__getUIOpacityPercent() : 100;
				const initV = nearestStep(saved);
				try{ window.__setUIOpacityPercent && window.__setUIOpacityPercent(initV); }catch(_e){}
				applyText(initV);
			}
		}catch(_e){}
		return wrap;
	}catch(_){
		return null;
	}
};

window.__applyGlobalUIOpacity = window.__applyGlobalUIOpacity || function(){
	try{
		const alpha = window.__getUIOpacityAlpha ? window.__getUIOpacityAlpha() : 1;
		const pe = (alpha <= 0.001) ? 'none' : '';


		// Battle dock: affect handle + main buttons/rows, but NOT the slider itself
		const dock = document.getElementById('battleOverlayDock');
				if (dock){
			// Background transparency: fade dock surface
			try{
				const base = Number(getComputedStyle(dock).getPropertyValue('--battleDockBgBase')) || 0.66;
				dock.style.setProperty('--battleDockBgAlpha', String(Math.max(0, Math.min(0.92, base * alpha))));
			}catch(_){
				try{ dock.style.setProperty('--battleDockBgAlpha', String(Math.max(0, 0.66 * alpha))); }catch(__){}
			}

			// Fade the dock frame (border + shadow)
			try{
				const borderBase = 0.14;
				dock.style.borderColor = `rgba(255,255,255,${borderBase * alpha})`;
				const shadowBase = 0.36;
				dock.style.boxShadow = `0 12px 34px rgba(0,0,0,${shadowBase * alpha})`;
			}catch(_){}

			// When opacity is 0%, make the dock itself compact (only Battle + slider remain)
			const p = window.__getUIOpacityPercent ? window.__getUIOpacityPercent() : Math.round(alpha * 100);
			const isZero = (p <= 0 || alpha <= 0.001);
			// Release any width lock so CSS compact/expand can work reliably
			try{ dock.style.removeProperty('width'); }catch(_e){}
			try{ dock.classList.toggle('dock-opacity-zero', !!isZero); }catch(_){}

			// If we are leaving 0% compact mode, make sure any previously locked width is released
			// so the dock can expand back to its normal layout.
			try{
				if (!isZero){
					try{ dock.style.removeProperty('width'); }catch(_e){}
					// After layout expands, clamp back into viewport (prevents "expanded UI" going offscreen)
					const __clampLater = () => {
						try{
							const r = dock.getBoundingClientRect();
							const c = window.__clampBattleDockToViewport ? window.__clampBattleDockToViewport(r.left, r.top, r.width, r.height) : {x:r.left,y:r.top};
							dock.style.setProperty('left', Math.round(c.x) + 'px','important');
							dock.style.setProperty('top',  Math.round(c.y) + 'px','important');
							dock.style.setProperty('right','auto','important');
							dock.style.setProperty('bottom','auto','important');
							dock.style.setProperty('transform','none','important');
							try{ window.__writeBattleDockPos && window.__writeBattleDockPos({x:c.x,y:c.y}); }catch(_e){}
						}catch(_e){}
					};
					(window.requestAnimationFrame||function(f){return setTimeout(f,0)})(() => {
						(window.requestAnimationFrame||function(f){return setTimeout(f,0)})(__clampLater);
					});
				}
			}catch(_e){}

			const battleBtn = document.getElementById('startBattleBtn');
			const ctrl = document.getElementById('uiOpacityControl');

			const shouldSkip = (el) => {
				try{
					// Drag handle should NEVER be faded (always keep opaque)
					try{ if (el.classList && el.classList.contains('dock-drag-handle')) return true; }catch(_){ }
					try{ if (el.closest && el.closest('.dock-drag-handle')) return true; }catch(_){ }

					if (!el) return true;

					// Keep Battle button fully visible (and avoid fading any ancestor containers)
					if (battleBtn){
						if (el === battleBtn || el.closest('#startBattleBtn')) return true;
						if (typeof el.contains === 'function' && el.contains(battleBtn)) return true;
					}

					// Opacity control: keep the range input visible (label/value should fade),
					// and avoid fading any ancestor containers that would multiply opacity.
					if (ctrl){
						if (el === ctrl || el.closest('#uiOpacityControl')) {
							if (el.id === 'uiOpacityRange' || el.id === 'uiOpacityToggleBtn') return true;
							if (el.tagName === 'INPUT' && el.getAttribute('type') === 'range') return true;
							if (el === ctrl) return true;
							return false;
						}
						if (typeof el.contains === 'function' && el.contains(ctrl)) return true;
					}
				}catch(_){}
				return false;
			};

			// Fade EVERYTHING inside the battle dock except Battle button + slider input
			try{
				const nodes = dock.querySelectorAll('*');
				nodes.forEach((el) => {
					if (shouldSkip(el)) return;
					el.style.opacity = String(isZero ? 0 : alpha);
					el.style.pointerEvents = pe;
				});
			}catch(_){}

			// Ensure Battle button and slider input are always clickable/visible
			try{
				if (battleBtn && dock.contains(battleBtn)){
					battleBtn.style.opacity = '1';
					battleBtn.style.pointerEvents = '';
				}
			}catch(_){}

			try{
				if (ctrl && dock.contains(ctrl)){
					ctrl.style.opacity = '1';
					ctrl.style.pointerEvents = '';
					const range = ctrl.querySelector('#uiOpacityRange'); const btn = ctrl.querySelector('#uiOpacityToggleBtn');
					if (range){
						range.style.opacity = '1';
						range.style.pointerEvents = '';
					}
					const lbl = ctrl.querySelector('#uiOpacityLabel') || ctrl.querySelector('label');
					if (lbl){
						lbl.style.opacity = String(isZero ? 0 : alpha);
						lbl.style.pointerEvents = pe;
					}
					const val = ctrl.querySelector('#uiOpacityValue');
					if (val){
						val.style.opacity = String(isZero ? 0 : alpha);
						val.style.pointerEvents = pe;
					}
				}
			}catch(_){}
		}

		// Drag handle (つまみ): keep visible/clickable even at 0% (user may need it to move the dock)
		try{
			const handle = dock.querySelector('.dock-drag-handle');
			if (handle){
				handle.style.opacity = '1';
				handle.style.pointerEvents = '';
			}
		}catch(_){ }

		// Minimize controls (part of battle UI)
		const minBtn = document.getElementById('battleDockMinimizeBtn');
		if (minBtn) { minBtn.style.opacity = String(alpha); minBtn.style.pointerEvents = pe; }
		const miniBar = document.getElementById('battleDockMiniBar');
		// Mini bar must always remain visible/clickable so the user can restore the dock even at 0%.
		if (miniBar) { miniBar.style.opacity = '1'; miniBar.style.pointerEvents = ''; }

		// Overlays
		const score = document.getElementById('scoreOverlay');
		if (score) { score.style.opacity = String(alpha); score.style.pointerEvents = pe; }
		const skill = document.getElementById('skillOverlay');
		if (skill) { skill.style.opacity = String(alpha); skill.style.pointerEvents = pe; }
		const item = document.getElementById('itemOverlay');
		if (item) { item.style.opacity = String(alpha); item.style.pointerEvents = pe; }

		// Growth selection UI only (avoid affecting other event popups)
		const popup = document.getElementById('eventPopup');
		if (popup){
			const isGrowth = popup.classList.contains('growth-compact-ui') || popup.classList.contains('growthbar-ui') || popup.getAttribute('data-ui-mode') === 'growth';
			if (isGrowth) { popup.style.opacity = String(alpha); popup.style.pointerEvents = pe; }
		}

		// Charts: intentionally NOT affected (hpChart etc) -> do nothing
	}catch(_){}
};


window.__commitBattleDockMinimized = window.__commitBattleDockMinimized || function(minimized) {
	try {
		const v = minimized ? '1' : '0';
		try { localStorage.setItem(window.__battleDockMinKey, v); } catch (_) {}
		if (!minimized) { try{ window.__battleDockScrollStartY = null; }catch(_){} }
		window.__refreshBattleControlDock && window.__refreshBattleControlDock();		// When minimized, immediately hide overlays (they must not auto-show while minimized)
		try { if (minimized) window.__hideBattleOverlays && window.__hideBattleOverlays(); } catch (_) {}

		try {
			if (minimized) {
				window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
			} else {
				window.__clearBattleDockAutoRestoreTimer && window.__clearBattleDockAutoRestoreTimer();
			}
		} catch(_e) {}

		// When restored from minimized state, show overlays again (one-shot refresh)
		try {
			if (!minimized) {
				(window.__uiSetTimeout || window.setTimeout)(() => {
					try { window.__restoreBattleOverlaysAfterMinimize && window.__restoreBattleOverlaysAfterMinimize(); } catch(_e) {}
				}, 0);
			}
		} catch(_e) {}

	} catch (e) {
		console.warn('[BattleDock] set minimized failed', e);
	}
};

window.__setBattleDockMinimized = window.__setBattleDockMinimized || function(minimized) {
	try {
		const wantMin = !!minimized;
		let currentMin = false;
		try { currentMin = (localStorage.getItem(window.__battleDockMinKey) === '1'); } catch (_) {}

		if (wantMin === currentMin && !window.__battleDockHideAnimating) {
			if (!wantMin) {
				try { window.__playBattleDockShowTransition && window.__playBattleDockShowTransition(); } catch (_) {}
			}
			return;
		}

		if (wantMin) {
			if (window.__battleDockHideAnimating) return;
			window.__battleDockHideAnimating = true;
			try { window.__hideBattleOverlays && window.__hideBattleOverlays(); } catch (_) {}
			window.__playBattleDockHideTransition && window.__playBattleDockHideTransition(() => {
				try {
					window.__battleDockHideAnimating = false;
					window.__commitBattleDockMinimized && window.__commitBattleDockMinimized(true);
					try { window.__battleDockPulseMiniBar && window.__battleDockPulseMiniBar(); } catch (_) {}
				} catch (_e) {}
			});
			return;
		}

		window.__battleDockHideAnimating = false;
		window.__commitBattleDockMinimized && window.__commitBattleDockMinimized(false);
		try { window.__playBattleDockShowTransition && window.__playBattleDockShowTransition(); } catch (_) {}
	} catch (e) {
		console.warn('[BattleDock] set minimized failed', e);
	}
};

// Restore overlays (skill/score/item) after the battle dock has been restored from minimized state.
// - Clears the forced display:none!important set by __hideBattleOverlays
// - Then calls the overlay update functions once so they re-render.
window.__restoreBattleOverlaysAfterMinimize = window.__restoreBattleOverlaysAfterMinimize || function() {
	try {
		if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) return;
		// Restore overlays + the top-right battle status (remaining battles / streak),
		// because scroll fade-out may have left the streak counter invisible while minimized.
		const ids = ['skillOverlay','scoreOverlay','itemOverlay','remainingBattlesDisplay'];
		for (const id of ids) {
			const el = document.getElementById(id);
			if (!el) continue;
			try { el.style.removeProperty('display'); } catch(_e) {}
			// If scroll handler previously faded it out, bring it back.
			try { el.style.opacity = '1'; } catch(_e) {}
		}
		try { if (typeof window.updateSkillOverlay === 'function') window.updateSkillOverlay(); } catch(_e) {}
		try { if (typeof window.updateScoreOverlay === 'function') window.updateScoreOverlay(); } catch(_e) {}
		try { if (typeof window.updateItemOverlay === 'function') window.updateItemOverlay(); } catch(_e) {}
		// Refresh the streak / remaining-battles text and ensure it's visible when the user restores.
		try { if (typeof window.updateRemainingBattleDisplay === 'function') window.updateRemainingBattleDisplay(); } catch(_e) {}
	} catch(_e) {}
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
		miniBar.classList.remove('scroll-minimized','cinematic-awaken','cinematic-hide-bar');
		try{ void miniBar.offsetWidth; }catch(_){}
		miniBar.classList.add('scroll-minimized');
		(window.__uiSetTimeout || window.setTimeout)(()=>{ try{ miniBar.classList.remove('scroll-minimized'); }catch(_){} }, 760);
	}catch(_){}
};

window.__clearBattleDockCinematicTimers = window.__clearBattleDockCinematicTimers || function(){
	try{
		if (window.__battleDockHideAnimTimer) {
			(window.__uiClearTimeout || window.clearTimeout)(window.__battleDockHideAnimTimer);
			window.__battleDockHideAnimTimer = null;
		}
		if (window.__battleDockShowAnimTimer) {
			(window.__uiClearTimeout || window.clearTimeout)(window.__battleDockShowAnimTimer);
			window.__battleDockShowAnimTimer = null;
		}
	}catch(_e){}
};

window.__playBattleDockHideTransition = window.__playBattleDockHideTransition || function(onDone){
	try{
		window.__clearBattleDockCinematicTimers && window.__clearBattleDockCinematicTimers();
		const dock = document.getElementById('battleOverlayDock');
		const miniBar = document.getElementById('battleDockMiniBar');
		if (!dock || dock.style.display === 'none') {
			if (typeof onDone === 'function') onDone();
			return;
		}
		dock.classList.remove('cinematic-show');
		miniBar && miniBar.classList.remove('cinematic-awaken');
		try { void dock.offsetWidth; } catch (_e) {}
		dock.classList.add('cinematic-hide');
		if (miniBar) {
			miniBar.classList.remove('cinematic-hide-bar');
			try { void miniBar.offsetWidth; } catch (_e) {}
			miniBar.classList.add('cinematic-hide-bar');
		}
		window.__battleDockHideAnimTimer = (window.__uiSetTimeout || window.setTimeout)(() => {
			try {
				window.__battleDockHideAnimTimer = null;
				dock.classList.remove('cinematic-hide');
				if (miniBar) miniBar.classList.remove('cinematic-hide-bar');
				if (typeof onDone === 'function') onDone();
			} catch(_e) {}
		}, 190);
	}catch(_e){
		try{ if (typeof onDone === 'function') onDone(); }catch(_){}
	}
};

window.__playBattleDockShowTransition = window.__playBattleDockShowTransition || function(){
	try{
		window.__clearBattleDockCinematicTimers && window.__clearBattleDockCinematicTimers();
		const dock = document.getElementById('battleOverlayDock');
		const miniBar = document.getElementById('battleDockMiniBar');
		if (dock) {
			dock.classList.remove('cinematic-hide','cinematic-show');
			try { void dock.offsetWidth; } catch (_e) {}
			dock.classList.add('cinematic-show');
		}
		if (miniBar) {
			miniBar.classList.remove('scroll-minimized','cinematic-hide-bar','cinematic-awaken');
			try { void miniBar.offsetWidth; } catch (_e) {}
			miniBar.classList.add('cinematic-awaken');
		}
		window.__battleDockShowAnimTimer = (window.__uiSetTimeout || window.setTimeout)(() => {
			try {
				window.__battleDockShowAnimTimer = null;
				if (dock) dock.classList.remove('cinematic-show');
				if (miniBar) miniBar.classList.remove('cinematic-awaken');
			} catch(_e) {}
		}, 680);
	}catch(_e){}
};

// ---------------------------------------------------------

// ---------------------------------------------------------
// Auto-minimize notice toast (tap to dismiss, auto hide)
// - IMPORTANT: viewport-centered (not page-centered)
// ---------------------------------------------------------
window.__hideAutoMinimizeNotice = window.__hideAutoMinimizeNotice || function(immediate){
	try{
		const el = document.getElementById('autoMinimizeToast');
		if (!el) return;
		// Clear timers
		try{
			if (el.__tHide) { (window.__uiClearTimeout || window.clearTimeout)(el.__tHide); el.__tHide = null; }
			if (el.__tFade) { (window.__uiClearTimeout || window.clearTimeout)(el.__tFade); el.__tFade = null; }
		} catch (_e) {}

		if (immediate) {
			el.classList.remove('is-show');
			el.classList.add('is-hidden');
			el.style.display = 'none';
			return;
		}

		// fade out
		el.classList.remove('is-show');
		el.classList.add('is-hidden');
		el.__tFade = (window.__uiSetTimeout || window.setTimeout)(() => {
			try { el.style.display = 'none'; } catch (_e) {}
		}, 220);
	} catch (_e) {}
};

window.__showAutoMinimizeNotice = window.__showAutoMinimizeNotice || function(){
	try{
		// 自動最小化時の文言表示は行わない。既存トーストが残っていれば即時で閉じる。
		window.__hideAutoMinimizeNotice && window.__hideAutoMinimizeNotice(true);
	}catch(_e){}
};

window.__battleDockAutoRestoreDelayMs = window.__battleDockAutoRestoreDelayMs || 820;
window.__clearBattleDockAutoRestoreTimer = window.__clearBattleDockAutoRestoreTimer || function(){
	try{
		if (window.__battleDockAutoRestoreTimer) {
			(window.__uiClearTimeout || window.clearTimeout)(window.__battleDockAutoRestoreTimer);
			window.__battleDockAutoRestoreTimer = null;
		}
	}catch(_e){}
};
window.__scheduleBattleDockAutoRestore = window.__scheduleBattleDockAutoRestore || function(){
	try{
		window.__clearBattleDockAutoRestoreTimer && window.__clearBattleDockAutoRestoreTimer();
		window.__battleDockAutoRestoreTimer = (window.__uiSetTimeout || window.setTimeout)(() => {
			try{
				window.__battleDockAutoRestoreTimer = null;
				if (!(window.__isBattleDockMinimized && window.__isBattleDockMinimized())) return;
				window.__setBattleDockMinimized && window.__setBattleDockMinimized(false);
			}catch(_restoreErr){}
		}, Number(window.__battleDockAutoRestoreDelayMs || 2500));
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

		// Ensure GrowthDock UI (minimize-to-dock) is present
		try{ window.__ensureGrowthDockUI && window.__ensureGrowthDockUI(); }catch(_e){}
		try{ window.__updateGrowthDockUI && window.__updateGrowthDockUI(); }catch(_e){}


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

					
// Otherwise: auto-minimize only after a smaller amount of scrolling
const threshold = Number(window.__battleDockAutoMinScrollThresholdPx || 72); // px
if (!window.__battleDockScrollStartY || !Number.isFinite(Number(window.__battleDockScrollStartY))) {
	window.__battleDockScrollStartY = window.scrollY || 0;
}
const dy = Math.abs((window.scrollY || 0) - Number(window.__battleDockScrollStartY || 0));
if (dy < threshold) {
	return;
}
// Enough scroll: minimize (scroll-triggered effect)
	window.__setBattleDockMinimized && window.__setBattleDockMinimized(true);
	window.__showAutoMinimizeNotice && window.__showAutoMinimizeNotice();
window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
window.__battleDockScrollStartY = null;
				} catch (_) {}
			};

			window.addEventListener('touchstart', (ev)=>{
				try{
					if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
						window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
					} else {
						window.__battleDockScrollStartY = window.scrollY || 0;
					}
				}catch(_e){}
			}, { passive: true });
			window.addEventListener('scroll', (ev) => {
				try {
					if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
						window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
						window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
						return;
					}
				}catch(_e){}
				tryAutoMinimize(ev);
			}, { passive: true });
			window.addEventListener('touchmove', (ev) => {
				try {
					if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
						window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
						window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
						return;
					}
				}catch(_e){}
				tryAutoMinimize(ev);
			}, { passive: true });
			window.addEventListener('resize', () => {
				window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
				if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
					window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
				}
			}, { passive: true });

			// visualViewport (iOS)
			if (window.visualViewport) {
				window.visualViewport.addEventListener('scroll', () => {
					window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
					if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
						window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
					}
				}, { passive: true });
				window.visualViewport.addEventListener('resize', () => {
					window.__updateBattleDockMiniBarFollow && window.__updateBattleDockMiniBarFollow();
					if (window.__isBattleDockMinimized && window.__isBattleDockMinimized()) {
						window.__scheduleBattleDockAutoRestore && window.__scheduleBattleDockAutoRestore();
					}
				}, { passive: true });
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

// If minimized, force-hide overlays so they never pop up due to other triggers
try { if (minimized) window.__hideBattleOverlays && window.__hideBattleOverlays(); } catch(_e) {}


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

		// keep GrowthDock area stable across dock refreshes
		try{ window.__ensureGrowthDockUI && window.__ensureGrowthDockUI(); }catch(_e){}
		try{ window.__updateGrowthDockUI && window.__updateGrowthDockUI(); }catch(_e){}
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

window.__isMixedSkillPopupPauseActive = window.__isMixedSkillPopupPauseActive || function() {
	try {
		return !!(window.__mixedSkillPopupPauseUntil && Date.now() < window.__mixedSkillPopupPauseUntil);
	} catch (_e) {
		return false;
	}
};
window.__releaseMixedSkillPopupPause = window.__releaseMixedSkillPopupPause || function(token) {
	try {
		if (token != null && window.__mixedSkillPopupPauseToken != null && token !== window.__mixedSkillPopupPauseToken) return;
		window.__mixedSkillPopupPauseUntil = 0;
		window.__mixedSkillPopupPauseToken = null;
	} catch (_e) {}
};
window.__armMixedSkillPopupPause = window.__armMixedSkillPopupPause || function(durationMs) {
	const dur = Math.max(0, Number(durationMs || 0) || 0);
	const token = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
	try {
		window.__mixedSkillPopupPauseToken = token;
		window.__mixedSkillPopupPauseUntil = Date.now() + dur;
	} catch (_e) {}
	try {
		if (typeof window.__suppressNextBattleClickOnce === 'function') window.__suppressNextBattleClickOnce(dur + 1200);
	} catch (_e) {}
	try {
		if ((typeof isAutoBattle !== 'undefined') && !!isAutoBattle) {
			if (typeof window.stopAutoBattle === 'function') window.stopAutoBattle();
			try { isAutoBattle = false; } catch (_e2) {}
		}
	} catch (_e) {}
	return token;
};

window.showMixedSkillSummaryPopup = function(skill) {
	const starCount = typeof skill.starRating === 'string' ? (skill.starRating.match(/★/g) || []).length : 0;
	if (starCount < 4) return;

	window.withmix = true;
	const pauseToken = window.__armMixedSkillPopupPause ? window.__armMixedSkillPopupPause(1200) : null;
	try{
		if (typeof window.__notifyBattleSpecialSkillReward === 'function') {
			window.__notifyBattleSpecialSkillReward(skill);
		}
	}finally{
		try { if (typeof window.__releaseMixedSkillPopupPause === 'function') window.__releaseMixedSkillPopupPause(pauseToken); } catch (_e) {}
	}
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

function __describeMixedSpecialEffect(skill, eff) {
	const lvNum = Math.max(1, Number((skill && skill.level) || 1) || 1);
	const lvScale = (typeof getMixedSkillLevelScale === "function") ? getMixedSkillLevelScale(lvNum) : 1;
	const baseVal = Number(eff && (eff.baseValue ?? eff.value ?? eff.amount ?? eff.ratio ?? 0));
	const scaledVal = (typeof getScaledMixedSpecialEffectValue === "function")
		? getScaledMixedSpecialEffectValue(skill, Object.assign({}, eff || {}, { baseValue: baseVal, value: baseVal }))
		: baseVal;
	const bonusPct = Math.round((lvScale - 1) * 1000) / 10;
	const fmtPct = (v) => `${Number(v).toFixed(Number(v) % 1 === 0 ? 0 : 1)}%`;
	const fmtMul = (v) => `${Number(v).toFixed(Number(v) % 1 === 0 ? 2 : 3)}倍`;
	const type = Number(eff && eff.type);
	let label = `type=${type}`;
	let valueLine = `基礎値 ${baseVal}`;
	if (type === 1) {
		label = '敵残HP割合ダメージ';
		valueLine = `基礎値 ${fmtPct(baseVal)} → Lv補正後 ${fmtPct(scaledVal)}`;
	} else if (type === 2) {
		label = '自動復活';
		valueLine = `基礎値 ${fmtPct(baseVal)} → Lv補正後 ${fmtPct(scaledVal)}`;
	} else if (type === 3) {
		label = '継続ダメージ吸収';
		valueLine = `基礎値 ${fmtPct(baseVal)} → Lv補正後 ${fmtPct(scaledVal)}`;
	} else if (type === 4) {
		label = '攻撃力バフ';
		valueLine = `基礎値 ${fmtMul(baseVal)} → Lv補正後 ${fmtMul(scaledVal)}`;
	} else if (type === 5) {
		label = '防御力バフ';
		valueLine = `基礎値 ${fmtMul(baseVal)} → Lv補正後 ${fmtMul(scaledVal)}`;
	} else if (type === 6) {
		label = '素早さバフ';
		valueLine = `基礎値 ${fmtMul(baseVal)} → Lv補正後 ${fmtMul(scaledVal)}`;
	} else if (type === 7) {
		label = '最大HPバフ';
		valueLine = `基礎値 ${fmtMul(baseVal)} → Lv補正後 ${fmtMul(scaledVal)}`;
	}
	return { label, valueLine, lvScale, bonusPct };
}

function __buildMixedSkillDetailPayload(mixedSkill) {
	const skill = mixedSkill || {};
	const name = skill.name || '(不明)';
	const level = skill.level ?? '?';
	const star = skill.starRating || '';
	const rank = skill.rarityClass?.replace('skill-rank-', '').toUpperCase() || '-';
	const prob = skill.activationProb ? Math.floor(skill.activationProb * 100) : 0;
	const lvNum = Math.max(1, Number(level || 1) || 1);
	const lvScale = (typeof getMixedSkillLevelScale === 'function') ? getMixedSkillLevelScale(lvNum) : 1;
	const lvBonusPct = Math.round((lvScale - 1) * 1000) / 10;
	const effects = Array.isArray(skill.specialEffects) ? skill.specialEffects : [];
	const headLine = [`Lv${level}`, `発動率 ${prob}%`, `レベル補正 ×${lvScale.toFixed(3)}（+${lvBonusPct}%）`].join(' ｜ ');
	const effectHtml = effects.length
		? effects.map((eff, idx) => {
			const meta = __describeMixedSpecialEffect(skill, eff || {});
			return `<div class="battle-drop-detail-line"><span class="battle-drop-detail-bullet">${idx + 1}.</span><span class="battle-drop-detail-text"><b>${meta.label}</b><br>${meta.valueLine}<br>スキルLv補正倍率 ×${meta.lvScale.toFixed(3)}（+${meta.bonusPct}%）</span></div>`;
		}).join('')
		: '<div class="battle-drop-detail-line"><span class="battle-drop-detail-text">特殊効果はありません。</span></div>';
	const protectedHtml = skill.isProtected ? '<div class="battle-drop-popup-sub">🔒 保護中</div>' : '';
	return {
		title: name,
		html:
			`<div class="battle-drop-popup-sub">【${star} / RANK: ${rank}】</div>` +
			protectedHtml +
			`<div class="battle-drop-detail-head">${headLine}</div>` +
			`<div class="battle-drop-detail-section-title">特殊効果</div>` +
			`<div class="battle-drop-detail-section">${effectHtml}</div>`,
		duration: 12000
	};
}

window.__buildMixedSkillDetailPayload = window.__buildMixedSkillDetailPayload || __buildMixedSkillDetailPayload;

function showSpecialEffectDetail(mixedSkill, event) {
	try {
		const payload = __buildMixedSkillDetailPayload(mixedSkill);
		if (typeof window.__openBattleHtmlDetail === 'function') {
			window.__openBattleHtmlDetail(payload);
			return;
		}
		if (typeof showCenteredPopup === 'function') {
			showCenteredPopup(`<div class="battle-drop-popup"><div class="battle-drop-popup-title">${payload.title}</div><div class="battle-drop-popup-body">${payload.html}</div></div>`, payload.duration || 12000);
			return;
		}
	} catch (_e) {}

	const existingPopup = document.getElementById("effect-popup");
	if (existingPopup) existingPopup.remove();
	const popup = document.createElement("div");
	popup.id = "effect-popup";
	popup.className = "effect-popup";
	const payload = __buildMixedSkillDetailPayload(mixedSkill);
	popup.innerHTML = `<div class="battle-drop-popup"><div class="battle-drop-popup-title">${payload.title}</div><div class="battle-drop-popup-body">${payload.html}</div></div>`;
	popup.style.position = "absolute";
	popup.style.left = `10px`;
	popup.style.top = `${(event?.pageY || 0) + 10}px`;
	popup.style.padding = "12px 16px";
	popup.style.background = "rgba(0, 0, 0, 0.82)";
	popup.style.color = "#fff";
	popup.style.border = "1px solid rgba(255, 255, 255, 0.22)";
	popup.style.borderRadius = "10px";
	popup.style.fontSize = "14px";
	popup.style.overflowWrap = "break-word";
	popup.style.backdropFilter = "blur(6px)";
	popup.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.5)";
	popup.style.zIndex = "9999";
	popup.style.opacity = "0";
	popup.style.transition = "opacity 0.3s ease";
	popup.style.minWidth = "420px";
	popup.style.maxWidth = "800px";
	popup.style.width = "fit-content";
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
	// 高速化：連打で多重表示しない
	try{ const prev = document.getElementById('gachaAnimation'); if (prev) prev.remove(); }catch(_){ }

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

	// 0.6s以内に終了（演出は残しつつ即次へ）
	window.__battleSetTimeout(() => {
		try{ container.remove(); }catch(_){ }
	}, 650);
}

// =====================================================
// 魔メイク画像「ズバーン」演出（高ランクほど豪華）
//  - 画面中央に半透明で大きく表示（縦横比維持、最大80%）
//  - 既存の進行を邪魔しない（pointer-events:none）
// =====================================================
function showFaceRevealAnimation(facePath, rarity, mode) {
	// mode: 'gacha' | 'boss' （省略時は gacha）
	const isStrong = (mode === 'strong') || (mode === 'boss' && !!window.isStrongBossBattle);
	const m = isStrong ? 'strong' : ((mode === 'boss') ? 'boss' : ((mode === 'growth' || mode === 'growthBoss') ? 'growth' : 'gacha'));
	const r = String(rarity || 'D').toUpperCase();

	// 多重表示防止
	try {
		const prev = document.getElementById('faceRevealOverlay');
		if (prev) prev.remove();
	} catch(_){}

	try {
		const overlay = document.createElement('div');
		overlay.id = 'faceRevealOverlay';
		overlay.className = `face-reveal-overlay reveal-${m} rarity-${r}`;
		if(isStrong) overlay.classList.add('strong-boss');

		// theme / aura / particles / image
		const theme = document.createElement('div');
		theme.className = 'face-reveal-theme';
		overlay.appendChild(theme);

		const aura = document.createElement('div');
		aura.className = 'face-reveal-aura';
		overlay.appendChild(aura);

		const particles = document.createElement('div');
		particles.className = 'face-reveal-particles';
		overlay.appendChild(particles);

		const img = document.createElement('img');
		img.className = 'face-reveal-img';
		img.alt = '魔メイク';
		img.src = (typeof resolveAssetPath === 'function') ? resolveAssetPath(facePath) : String((window.__assetPrefix || '') + String(facePath || ''));
		overlay.appendChild(img);

		// レア度で粒数・強さを調整（派手さが分かるように）
		const countByR = { D: 10, C: 14, B: 18, A: 26, S: 36 };
		let n = (countByR[r] != null) ? countByR[r] : 12;
		if(isStrong) n = Math.max(n, 42);

		for (let i = 0; i < n; i++) {
			const sp = document.createElement('span');
			sp.className = ((m === 'boss') || (m === 'strong')) ? 'p ember' : ((m === 'growth') ? 'p toxic' : 'p sparkle');
			// ばらけ具合：中央寄り〜全体。端は少し減らす
			const x = 10 + Math.random() * 80;
			const y = 12 + Math.random() * 76;
			const size = (m === 'boss') ? (2 + Math.random() * 4) : ((m === 'growth') ? (2 + Math.random() * 5) : (2 + Math.random() * 5));
			const dur = (m === 'boss') ? (520 + Math.random() * 420) : ((m === 'growth') ? (540 + Math.random() * 480) : (560 + Math.random() * 520));
			const delay = Math.random() * 180;
			const drift = (m === 'boss') ? (10 + Math.random() * 22) : ((m === 'growth') ? (9 + Math.random() * 22) : (8 + Math.random() * 20));
			sp.style.left = x.toFixed(2) + '%';
			sp.style.top  = y.toFixed(2) + '%';
			sp.style.setProperty('--pSize', size.toFixed(2) + 'px');
			sp.style.setProperty('--pDur', dur.toFixed(0) + 'ms');
			sp.style.setProperty('--pDelay', delay.toFixed(0) + 'ms');
			sp.style.setProperty('--pDrift', drift.toFixed(2) + 'px');
			particles.appendChild(sp);
		}

		document.body.appendChild(overlay);

		// iOS Safari 対策：画像読込に依存せず rAF で確実に開始
		const startAnim = () => {
			try { overlay.classList.add('loaded'); } catch(_){}
		};
		try { requestAnimationFrame(() => requestAnimationFrame(startAnim)); }
		catch(_){ try { startAnim(); } catch(__){} }

		// 保持時間（iPhone Safari でも「一瞬」にならないよう少し長め）
		const holdMs = (m === 'boss') ? 1350 : 1500;
		const exitMs = 650;

		const _set = (typeof window.__uiSetTimeout === 'function') ? window.__uiSetTimeout : setTimeout;

		_set(() => {
			try { overlay.classList.add('exit'); } catch(_){}
		}, holdMs);

		_set(() => {
			try { overlay.remove(); } catch(_){}
		}, holdMs + exitMs + 60);
	} catch(_){}
}







// =====================================================
// 魔メイク（Face）: 成長率ボーナス/ドロップ倍率/保護数ボーナス
//  - faceItemsOwned は「画像パス文字列」のまま保持
//  - ボーナスは faceItemBonusMap[path] に保持し、セーブにも含める
// =====================================================
window.faceItemBonusMap = window.faceItemBonusMap || {}; // { [path]: { rarity, growthRates, dropRateMultiplier, protectSkillAdd, protectItemAdd } }
// 魔メイク効果（成長率）アルゴリズムのバージョン
// 旧セーブの faceItemBonusMap をそのまま使うと倍率が固定されるため、更新時は作り直す
window.faceBonusAlgoVersion = 2;
window.faceItemBonusAlgoVersion = (typeof window.faceItemBonusAlgoVersion === 'number') ? window.faceItemBonusAlgoVersion : window.faceBonusAlgoVersion;
if (window.faceItemBonusAlgoVersion !== window.faceBonusAlgoVersion) {
	window.faceItemBonusMap = {};
	window.faceItemBonusAlgoVersion = window.faceBonusAlgoVersion;
}


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



// ================================
// MagicMake (face gacha) ranges for UI/logic (single source of truth)
//  - growth multipliers: [min..max]
//  - protect add bonus: values[] (e.g., [1,2]) with optional weights[]
//    ※ここを変えると「生成」と「表示（レーダーチャート/バッジ）」が同時に追従する
// ================================
window.__MAGICMAKE_GACHA_CONFIG = window.__MAGICMAKE_GACHA_CONFIG || {
	growth: { min: 0.50, max: 2.00 },
	protectAdd: {
		basePByRarity: { D: 0.020, C: 0.045, B: 0.080, A: 0.140, S: 0.220 },
		values: [1, 2],
		weights: [0.88, 0.12]
	}
};

window.getMagicMakeGrowthRange = window.getMagicMakeGrowthRange || function getMagicMakeGrowthRange(){
	try{
		const cfg = (window.__MAGICMAKE_GACHA_CONFIG && window.__MAGICMAKE_GACHA_CONFIG.growth) ? window.__MAGICMAKE_GACHA_CONFIG.growth : null;
		let min = cfg ? Number(cfg.min) : 0.5;
		let max = cfg ? Number(cfg.max) : 2.0;
		if (!Number.isFinite(min)) min = 0.5;
		if (!Number.isFinite(max)) max = 2.0;
		if (min === max) { min = 0.5; max = 2.0; }
		if (min > max) { const t = min; min = max; max = t; }
		return { min, max };
	}catch(e){
		return { min: 0.5, max: 2.0 };
	}
};

window.getMagicMakeProtectAddRange = window.getMagicMakeProtectAddRange || function getMagicMakeProtectAddRange(){
	try{
		const cfg = (window.__MAGICMAKE_GACHA_CONFIG && window.__MAGICMAKE_GACHA_CONFIG.protectAdd) ? window.__MAGICMAKE_GACHA_CONFIG.protectAdd : null;
		const values = (cfg && Array.isArray(cfg.values)) ? cfg.values.map(v => Number(v)).filter(v => Number.isFinite(v)) : [1, 2];
		const pos = values.length ? values : [1, 2];
		let positiveMin = Math.min(...pos);
		let positiveMax = Math.max(...pos);
		if (!Number.isFinite(positiveMin)) positiveMin = 1;
		if (!Number.isFinite(positiveMax)) positiveMax = 2;
		if (positiveMin > positiveMax) { const t = positiveMin; positiveMin = positiveMax; positiveMax = t; }
		return { noneValue: 0, positiveMin, positiveMax };
	}catch(e){
		return { noneValue: 0, positiveMin: 1, positiveMax: 2 };
	}
};
function __genGrowthRatesByRarity(rarity) {
	// 魔メイク成長率（ATK/DEF/SPD/HP）
	//  - 各ステータスの倍率は 0.50〜2.00 の間で大きくバラつく
	//  - レアほど「平均値」は高いが、同じ魔メイク内で 2.0 も 0.5 も起こり得る
	//  - 4ステ合計（平均）はレアごとの mean に寄るように、最後に軽く正規化する
	const cfg = ({
		D: { mean: 0.95, sigma: 0.55, spikeP: 0.14, spikeBand: 0.10 },
		C: { mean: 1.00, sigma: 0.52, spikeP: 0.14, spikeBand: 0.10 },
		B: { mean: 1.07, sigma: 0.50, spikeP: 0.14, spikeBand: 0.10 },
		A: { mean: 1.15, sigma: 0.48, spikeP: 0.14, spikeBand: 0.10 },
		S: { mean: 1.25, sigma: 0.46, spikeP: 0.14, spikeBand: 0.10 },
	})[rarity] || { mean: 1.00, sigma: 0.52, spikeP: 0.14, spikeBand: 0.10 };
	const range = (typeof window.getMagicMakeGrowthRange === 'function') ? window.getMagicMakeGrowthRange() : { min: 0.50, max: 2.00 };
	const MIN = Number(range.min);
	const MAX = Number(range.max);

	const clamp = (v) => {
		v = Number(v);
		if (!Number.isFinite(v)) return 1.0;
		return Math.max(MIN, Math.min(MAX, v));
	};

	// 標準正規乱数（Box-Muller）
	const randn = () => {
		let u = 0, v = 0;
		while (u === 0) u = Math.random();
		while (v === 0) v = Math.random();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	};

	// ログ正規分布で倍率を生成（両側に広く散る）
	const rollBase = () => {
		const v = Math.exp(Math.log(cfg.mean) + cfg.sigma * randn());
		return clamp(v);
	};

	// たまに 0.5 付近 / 2.0 付近を強制して「尖り」を作る
	const rollSpiky = () => {
		let v = rollBase();
		if (Math.random() < cfg.spikeP) {
			if (Math.random() < 0.5) {
				v = MIN + Math.random() * cfg.spikeBand;
			} else {
				v = MAX - Math.random() * cfg.spikeBand;
			}
		}
		return clamp(v);
	};

	// まず独立に4つ生成
	const raw = {
		attack: rollSpiky(),
		defense: rollSpiky(),
		speed: rollSpiky(),
		maxHp: rollSpiky(),
	};

	// 4ステ平均が cfg.mean 付近になるようにスケール（バラつきは残す）
	const avg = (raw.attack + raw.defense + raw.speed + raw.maxHp) / 4;
	const scale = (avg > 0) ? (cfg.mean / avg) : 1;

	return {
		attack:  Number(clamp(raw.attack  * scale).toFixed(3)),
		defense: Number(clamp(raw.defense * scale).toFixed(3)),
		speed:   Number(clamp(raw.speed   * scale).toFixed(3)),
		maxHp:   Number(clamp(raw.maxHp   * scale).toFixed(3)),
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
	// ★付与確率＆付与値テーブル（設定は window.__MAGICMAKE_GACHA_CONFIG に集約）
	const cfg = (window.__MAGICMAKE_GACHA_CONFIG && window.__MAGICMAKE_GACHA_CONFIG.protectAdd) ? window.__MAGICMAKE_GACHA_CONFIG.protectAdd : null;

	const basePByRarity = (cfg && cfg.basePByRarity) ? cfg.basePByRarity : { D: 0.020, C: 0.045, B: 0.080, A: 0.140, S: 0.220 };
	const baseP = Number(basePByRarity[rarity]);
	const p = Number.isFinite(baseP) ? baseP : 0.020;

	const values = (cfg && Array.isArray(cfg.values)) ? cfg.values.map(v => Number(v)).filter(v => Number.isFinite(v)) : [1, 2];
	const weights = (cfg && Array.isArray(cfg.weights) && cfg.weights.length === values.length)
		? cfg.weights.map(w => Number(w)).map(w => (Number.isFinite(w) ? w : 0))
		: null;

	const pickWeighted = (vals, wts) => {
		if (!vals || !vals.length) return 1;
		if (!wts) {
			// weights 無指定時：均等
			return vals[Math.floor(Math.random() * vals.length)];
		}
		let sum = 0;
		for (let i = 0; i < wts.length; i++) sum += Math.max(0, wts[i]);
		if (!(sum > 0)) return vals[Math.floor(Math.random() * vals.length)];
		let r = Math.random() * sum;
		for (let i = 0; i < vals.length; i++) {
			r -= Math.max(0, wts[i]);
			if (r <= 0) return vals[i];
		}
		return vals[vals.length - 1];
	};

	const rollAdd = () => {
		if (Math.random() >= p) return 0;
		return pickWeighted(values, weights);
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

function __normalizeFaceBonusPathCandidates(path) {
	if (!path) return [];
	const raw = String(path);
	const set = new Set();
	const push = (v) => {
		if (!v) return;
		const s = String(v);
		if (s) set.add(s);
	};
	push(raw);
	try { if (typeof normalizeFacePath === 'function') push(normalizeFacePath(raw)); } catch (e) {}
	const stripped = raw.replace(/^\.\.\//, '').replace(/^\//, '');
	push(stripped);
	if (stripped.startsWith('face/')) {
		push(stripped);
		push('../' + stripped);
	}
	return Array.from(set);
}

function __getEquippedFaceBonus() {
	let equipped = null;
	try {
		equipped = window.faceItemEquipped || (typeof faceItemEquipped !== 'undefined' ? faceItemEquipped : null) || null;
	} catch (e) {
		equipped = window.faceItemEquipped || null;
	}
	if (!equipped) return null;

	const candidates = __normalizeFaceBonusPathCandidates(equipped);
	for (const key of candidates) {
		try {
			if (window.faceItemBonusMap && window.faceItemBonusMap[key]) return window.faceItemBonusMap[key];
		} catch (e) {}
	}
	for (const key of candidates) {
		try {
			const bonus = __ensureFaceBonus(key);
			if (bonus) return bonus;
		} catch (e) {}
	}
	return null;
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
		if (bonus && typeof bonus.protectItemAdd === 'number') add = Number(bonus.protectItemAdd) || 0;
	} catch (e) {}
	const v = base + add;
	return (v >= 0) ? v : 0;
};

window.updateProtectionLimitHints = window.updateProtectionLimitHints || function updateProtectionLimitHints() {
	try {
		const itemNote = document.getElementById('itemProtectLimitNote');
		if (itemNote) {
			const limit = (typeof window.getItemProtectLimit === 'function') ? window.getItemProtectLimit() : 3;
			itemNote.textContent = `※選択で${limit}つまで保護 / 解除可能`;
		}
		const skillNote = document.getElementById('mixedSkillProtectLimitNote');
		if (skillNote) {
			const limit = (typeof window.getSpecialSkillProtectLimit === 'function') ? window.getSpecialSkillProtectLimit() : 1;
			skillNote.textContent = `※選択で${limit}つまで保護 / 解除可能`;
		}
	} catch (e) {}
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


// protect bonuses（数値レンジは設定から動的取得）
if ((bonus.protectSkillAdd && bonus.protectSkillAdd > 0) || (bonus.protectItemAdd && bonus.protectItemAdd > 0)) {
	const sep = document.createElement('div');
	sep.className = 'magicmake-detail-sep';
	stats.appendChild(sep);

	const badgeRow = document.createElement('div');
	badgeRow.className = 'magicmake-protect-badges';

	const range = (typeof window.getMagicMakeProtectAddRange === 'function') ? window.getMagicMakeProtectAddRange() : { noneValue: 0, positiveMin: 1, positiveMax: 2 };
	const minP = Number(range.positiveMin);
	const maxP = Number(range.positiveMax);

	const makeBadge = (kind, value) => {
		const b = document.createElement('div');
		b.className = 'magicmake-protect-badge ' + kind;

		// 表示が崩れないよう、長い数値でも入る短い表記に
		const label = (kind === 'skill') ? '特殊' : '道具';
		b.textContent = `${label} +${value}`;

		// 範囲が広い設定になっても違和感が出ないよう、tooltip でレンジを補足
		if (Number.isFinite(minP) && Number.isFinite(maxP) && minP !== maxP) {
			b.title = `このボーナスの取りうる範囲：+${minP}〜+${maxP}`;
		}
		return b;
	};

	if (bonus.protectSkillAdd > 0) badgeRow.appendChild(makeBadge('skill', bonus.protectSkillAdd));
	if (bonus.protectItemAdd > 0) badgeRow.appendChild(makeBadge('item', bonus.protectItemAdd));

	stats.appendChild(badgeRow);
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

	// === 表示スケール設定（ガチャの取りうる最小/最大を動的に反映）===
	const range = (typeof window.getMagicMakeGrowthRange === 'function') ? window.getMagicMakeGrowthRange() : { min: 0.50, max: 2.00 };
	const MIN = Number(range.min);
	const MAX = Number(range.max);
	const CENTER = 1.0;

	const safeMin = Number.isFinite(MIN) ? MIN : 0.50;
	const safeMax = Number.isFinite(MAX) ? MAX : 2.00;
	const minV = Math.min(safeMin, safeMax);
	const maxV = Math.max(safeMin, safeMax);
	const span = (maxV - minV) || 1;

	const clamp = (v) => {
		v = Number(v);
		if (!Number.isFinite(v)) return CENTER;
		return Math.max(minV, Math.min(maxV, v));
	};

	const vals = (Array.isArray(values) ? values : [1, 1, 1, 1]).map(clamp);

	const cx = w / 2, cy = h / 2;

	// outer は「表示しきれるエリアぎりぎり」、inner は「最小値の輪」が見えるよう少し確保
	const outerR = Math.min(w, h) * 0.44;
	const innerR = outerR * 0.20;

	const mapR = (v) => {
		const norm = (clamp(v) - minV) / span; // 0..1
		return innerR + norm * (outerR - innerR);
	};

	// === ガイド円：内側=MIN、外側=MAX（＋中間/1.0 が範囲内なら表示）===
	ctx.strokeStyle = 'rgba(255,255,255,0.12)';
	ctx.lineWidth = 1;

	const ticks = [];
	ticks.push(minV);

	const mid = minV + span * 0.5;
	const q1 = minV + span * 0.25;
	const q3 = minV + span * 0.75;

	// 最低限「内/中/外」で綺麗に見えるように
	ticks.push(q1, mid, q3);
	ticks.push(maxV);

	// 1.0 が範囲内なら、"基準" として少し強調して入れる（重複は避ける）
	if (CENTER >= minV && CENTER <= maxV) ticks.push(CENTER);

	// 重複除去＆ソート
	const uniq = Array.from(new Set(ticks.map(v => Number(v).toFixed(4)))).map(s => Number(s)).sort((a, b) => a - b);

	for (const v of uniq) {
		const rr = mapR(v);
		ctx.beginPath();
		ctx.arc(cx, cy, rr, 0, Math.PI * 2);
		// 1.0 は少し濃く
		if (Math.abs(v - CENTER) < 0.0006) ctx.strokeStyle = 'rgba(255,255,255,0.20)';
		else ctx.strokeStyle = 'rgba(255,255,255,0.12)';
		ctx.stroke();
	}

	// === 軸 ===
	ctx.strokeStyle = 'rgba(255,255,255,0.10)';
	for (let i = 0; i < 4; i++) {
		const a = -Math.PI / 2 + i * (Math.PI / 2);
		ctx.beginPath();
		ctx.moveTo(cx, cy);
		ctx.lineTo(
			cx + Math.cos(a) * outerR,
			cy + Math.sin(a) * outerR
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
		const rr = mapR(vals[i]);
		const x = cx + Math.cos(a) * rr;
		const y = cy + Math.sin(a) * rr;
		if (i === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

// =====================================================
// Battle Radar Chart (Player vs Enemy) - log scale, light (animated + glass gradient)
//  - Draws once per battle start (and on resize if visible)
//  - Uses min/max from all 8 values (P/E × 4 stats)
//  - Animates fast between previous and next radar for readability
// =====================================================
(function(){
	if (window.__battleRadarChartInstalled) return;
	window.__battleRadarChartInstalled = true;

	const AXES = [
		{ key: 'maxHp',  label: 'HP' },
		{ key: 'attack', label: '攻' },
		{ key: 'defense',label: '防' },
		{ key: 'speed', label: '速' },
	];

	const PLAYER_RGB = [80, 170, 255];
	const ENEMY_RGB  = [255, 90, 120];

	function num(v){
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	}
	function clamp01(x){ return x < 0 ? 0 : (x > 1 ? 1 : x); }
	function lerp(a,b,t){ return a + (b - a) * t; }
	function easeOutCubic(t){ t = clamp01(t); return 1 - Math.pow(1 - t, 3); }

	function log10(v){
		const x = Math.max(1e-9, Number(v) || 0);
		return Math.log(x) / Math.LN10;
	}
	function pow10(x){
		// 10^x without slow Math.pow(10,x) loops
		return Math.exp(x * Math.LN10);
	}

	function pickStats(obj){
		if (!obj) return null;

		// Prefer "battle-use" / direct stats first, then fallbacks.
		// Enemy often has multiplied final stats on the root object (enemy.attack etc),
		// while baseStats may remain as the pre-multiplier values.
		const sources = [];
		// 1) root (direct)
		sources.push(obj);
		// 2) battleStats
		if (obj.battleStats && typeof obj.battleStats === 'object') sources.push(obj.battleStats);
		// 3) stats
		if (obj.stats && typeof obj.stats === 'object') sources.push(obj.stats);
		// 4) baseStats
		if (obj.baseStats && typeof obj.baseStats === 'object') sources.push(obj.baseStats);

		function extract(src){
			if (!src || typeof src !== 'object') return null;
			const maxHp  = num(src.maxHp  ?? src.hpMax ?? src.maxHP ?? src.max_hp);
			const attack = num(src.attack ?? src.atk   ?? src.ATK);
			const defense= num(src.defense?? src.def   ?? src.DEF);
			const speed  = num(src.speed  ?? src.spd   ?? src.SPD ?? src.agi ?? src.AGI);

			// Must be positive for log scale
			if (!(maxHp > 0) || !(attack > 0) || !(defense > 0) || !(speed > 0)) return null;
			return { maxHp, attack, defense, speed };
		}

		for (const s of sources){
			const out = extract(s);
			if (out) return out;
		}
		return null;
		}

	function resizeCanvasToCSS(canvas){
		const rect = canvas.getBoundingClientRect();
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const w = Math.max(10, Math.floor(rect.width * dpr));
		const h = Math.max(10, Math.floor(rect.height * dpr));
		if (canvas.width !== w || canvas.height !== h){
			canvas.width = w;
			canvas.height = h;
		}
		return dpr;
	}

	function rgba(rgb, a){
		return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
	}

	function applyMeaningfulWrapGradient(wrap, pStats, eStats){
		// "Meaningful" gradient: stronger side gets a little more presence.
		// We compute advantage by averaging log-ratios (multiplicative gap-friendly).
		let acc = 0;
		for (const a of AXES){
			const pv = Math.max(1e-9, pStats[a.key]);
			const ev = Math.max(1e-9, eStats[a.key]);
			acc += (log10(pv) - log10(ev));
		}
		const adv = acc / AXES.length; // ~[-?, +?]
		// Map to 0..1 where 1 = player strong, 0 = enemy strong
		const m = clamp01(0.5 + adv * 0.22); // tunable
		// Alphas (keep subtle)
		const pA = lerp(0.10, 0.18, m);
		const eA = lerp(0.18, 0.10, m);

		try{
			wrap.style.setProperty('--pA', String(pA.toFixed(3)));
			wrap.style.setProperty('--eA', String(eA.toFixed(3)));
			wrap.style.setProperty('--adv', String(m.toFixed(3)));
		}catch(_){}
	}

	function drawRadar(canvas, pStats, eStats, opts){
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = resizeCanvasToCSS(canvas);
		const w = canvas.width, h = canvas.height;
		ctx.clearRect(0, 0, w, h);

		const cx = w / 2;
		const cy = h / 2 + 2 * dpr;
		const radius = Math.min(w, h) * 0.345;
		const inner = radius * 0.18;

		// min/max among all 8 values
		const allVals = [];
		for (const a of AXES){
			allVals.push(Math.max(1e-9, pStats[a.key]));
			allVals.push(Math.max(1e-9, eStats[a.key]));
		}
		let minV = Math.min.apply(null, allVals);
		let maxV = Math.max.apply(null, allVals);
		if (!Number.isFinite(minV) || !Number.isFinite(maxV)) return;

		const lmin = log10(minV);
		const lmax = log10(maxV);
		const span = Math.max(1e-9, lmax - lmin);

		function norm(v){
			const lv = log10(Math.max(1e-9, v));
			return (lv - lmin) / span;
		}
		function axisAngle(i){
			return (-Math.PI / 2) + i * (Math.PI * 2 / AXES.length);
		}

		// soft vignette background (very light)
		{
			const g = ctx.createRadialGradient(cx, cy, inner * 0.2, cx, cy, radius * 1.18);
			g.addColorStop(0.00, 'rgba(255,255,255,0.06)');
			g.addColorStop(0.55, 'rgba(0,0,0,0.00)');
			g.addColorStop(1.00, 'rgba(0,0,0,0.18)');
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
			ctx.fill();
		}

		// grid rings
		ctx.lineWidth = 1 * dpr;
		ctx.strokeStyle = 'rgba(255,255,255,0.13)';
		const rings = 4;
		for (let r = 1; r <= rings; r++){
			const rr = inner + (radius - inner) * (r / rings);
			ctx.beginPath();
			for (let i = 0; i < AXES.length; i++){
				const ang = axisAngle(i);
				const x = cx + Math.cos(ang) * rr;
				const y = cy + Math.sin(ang) * rr;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.closePath();
			ctx.stroke();
		}

		// axis lines
		ctx.strokeStyle = 'rgba(255,255,255,0.12)';
		for (let i = 0; i < AXES.length; i++){
			const ang = axisAngle(i);
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
			ctx.stroke();
		}

		// labels (crisp + subtle shadow)
		ctx.save();
		ctx.fillStyle = 'rgba(255,255,255,0.88)';
		ctx.font = `${Math.max(10, Math.round(11 * dpr))}px system-ui, -apple-system, sans-serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.shadowColor = 'rgba(0,0,0,0.45)';
		ctx.shadowBlur = 3 * dpr;
		ctx.shadowOffsetY = 1 * dpr;
		for (let i = 0; i < AXES.length; i++){
			const ang = axisAngle(i);
			const lx = cx + Math.cos(ang) * (radius + 16 * dpr);
			const ly = cy + Math.sin(ang) * (radius + 14 * dpr);
			ctx.fillText(AXES[i].label, lx, ly);
		}
		ctx.restore();

		function polygon(stats, rgb, alphaEdge){
			ctx.beginPath();
			for (let i = 0; i < AXES.length; i++){
				const a = AXES[i];
				const ang = axisAngle(i);
				const t = norm(stats[a.key]);
				const rr = inner + (radius - inner) * t;
				const x = cx + Math.cos(ang) * rr;
				const y = cy + Math.sin(ang) * rr;
				if (i === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}
			ctx.closePath();

			// meaningful gradient: center is calmer, edge gets stronger (shows "reach" on the axis)
			const g = ctx.createRadialGradient(cx, cy, inner * 0.25, cx, cy, radius * 1.05);
			g.addColorStop(0.00, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(0.06, alphaEdge * 0.30)})`);
			g.addColorStop(0.65, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.max(0.08, alphaEdge * 0.55)})`);
			g.addColorStop(1.00, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alphaEdge})`);

			ctx.fillStyle = g;
			ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(0.95, alphaEdge + 0.55)})`;
			ctx.lineWidth = 2 * dpr;
			ctx.fill();
			ctx.stroke();

			// subtle vertex dots for readability
			ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(0.95, alphaEdge + 0.65)})`;
			for (let i = 0; i < AXES.length; i++){
				const a = AXES[i];
				const ang = axisAngle(i);
				const t = norm(stats[a.key]);
				const rr = inner + (radius - inner) * t;
				const x = cx + Math.cos(ang) * rr;
				const y = cy + Math.sin(ang) * rr;
				ctx.beginPath();
				ctx.arc(x, y, 2.2 * dpr, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		// enemy first (back), then player (front)
		polygon(eStats, ENEMY_RGB, 0.18);
		polygon(pStats, PLAYER_RGB, 0.20);

		// optional tiny note (kept very subtle)
		if (opts && opts.note){
			ctx.fillStyle = 'rgba(255,255,255,0.40)';
			ctx.font = `${Math.max(9, Math.round(10 * dpr))}px system-ui, -apple-system, sans-serif`;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'top';
			ctx.fillText('log', w - 8 * dpr, 6 * dpr);
		}
	}

	function interpStatsLog(a, b, t){
		const o = {};
		for (const ax of AXES){
			const k = ax.key;
			const la = log10(Math.max(1e-9, a[k]));
			const lb = log10(Math.max(1e-9, b[k]));
			o[k] = pow10(lerp(la, lb, t));
		}
		return o;
	}

	// Animation state (single running anim, very short)
	let __animRAF = 0;
	let __animToken = 0;

	
	// =========================================================
	// レーダーチャート左右のキャラ表示（ミニ立ち絵）＋バトル簡易アニメ
	// =========================================================
	window.__updateBattleRadarSideSprites = function(opts){
		try{
			opts = opts || {};
			const pImg = document.getElementById('battleRadarPlayerSprite');
			const eImg = document.getElementById('battleRadarEnemySprite');
			const pCv = document.getElementById('battleRadarPlayerCanvasSprite');
			const eCv = document.getElementById('battleRadarEnemyCanvasSprite');
			const stage = document.getElementById('battleRadarStage');
			if (!stage) return;

			window.__battleRadarSpriteCache = window.__battleRadarSpriteCache || {
				player: { kind: '', sig: '' },
				enemy:  { kind: '', sig: '' }
			};

			const hideEl = (el)=>{ try{ if (el) el.classList.add('hidden'); }catch(_){ } };
			const showEl = (el)=>{ try{ if (el) el.classList.remove('hidden'); }catch(_){ } };
			const setSrcIfChanged = (el, src)=>{
				try{
					if (!el) return;
					const next = String(src || '');
					if (el.getAttribute('src') !== next) el.setAttribute('src', next);
				}catch(_){}
			};
			const drawCanvasIfChanged = (slotKey, canvasId, sig, nameText)=>{
				try{
					const cache = window.__battleRadarSpriteCache[slotKey] || (window.__battleRadarSpriteCache[slotKey] = { kind: '', sig: '' });
					if (cache.kind === 'canvas' && cache.sig === sig && !opts.forceRefresh) return;
					if (typeof drawCharacterImage === 'function') drawCharacterImage(nameText, canvasId);
					cache.kind = 'canvas';
					cache.sig = sig;
				}catch(_){}
			};
			const rememberImg = (slotKey, sig)=>{
				try{
					const cache = window.__battleRadarSpriteCache[slotKey] || (window.__battleRadarSpriteCache[slotKey] = { kind: '', sig: '' });
					cache.kind = 'img';
					cache.sig = sig;
				}catch(_){}
			};
			const hideAll = ()=>{
				hideEl(pImg); hideEl(eImg); hideEl(pCv); hideEl(eCv);
			};

			if (opts.hide){ hideAll(); return; }
			try{
				if (window.__winnerGuessMiniGameActive && !opts.allowDuringWinnerGuess){
					hideAll();
					return;
				}
			}catch(_e){}

			const resolve = (p)=>{
				try{
					if (!p) return p;
					let q = p;
					try{ if (typeof normalizeFacePath === 'function') q = normalizeFacePath(q); }catch(_){}
					try{ if (typeof resolveAssetPath === 'function') q = resolveAssetPath(q); }catch(_){}
					return q;
				}catch(_){ return p; }
			};

			const shouldHideEnemyForAuto = ()=>{
				try{
					if (opts && opts.showEnemy) return false;
					if (window.__battleRevealEnemySpriteOnce) return false;
					if ((typeof isAutoBattle !== 'undefined') && !!isAutoBattle) return true;
					if (window.__battleStartedAsAuto && window.__battleInProgress) return true;
				}catch(_){}
				return false;
			};

			// ---- player ----
			let showPlayerFace = false;
			let playerFaceSrc = null;
			try{
				const eq = (window && window.faceItemEquipped) ? window.faceItemEquipped : null;
				if (eq){
					showPlayerFace = true;
					playerFaceSrc = resolve(eq);
				}
			}catch(_){}

			if (showPlayerFace && pImg){
				setSrcIfChanged(pImg, playerFaceSrc || '');
				rememberImg('player', String(playerFaceSrc || ''));
				showEl(pImg);
				hideEl(pCv);
			}else{
				try{
					const pObj = (window && window.player) ? window.player : (typeof player !== 'undefined' ? player : null);
					let nm = (pObj && pObj.name) ? pObj.name : '';
					try{ if (typeof displayName === 'function') nm = displayName(nm); }catch(_){}
					if (pCv) drawCanvasIfChanged('player', 'battleRadarPlayerCanvasSprite', 'name:' + String(nm || ''), nm);
					showEl(pCv);
				}catch(_){}
				hideEl(pImg);
			}

			// ---- enemy ----
			if (shouldHideEnemyForAuto()){
				hideEl(eImg);
				hideEl(eCv);
				return;
			}

			let showEnemyFace = false;
			let enemyFaceSrc = null;
			try{
				const hasBossFace = (window && window.isBossBattle && window.bossFacePath) ? window.bossFacePath : null;
				const hasGrowthBossFace = (window && window.isGrowthBoss && window.growthBossFacePath) ? window.growthBossFacePath : null;
				if (hasBossFace || hasGrowthBossFace){
					showEnemyFace = true;
					enemyFaceSrc = resolve(hasBossFace || hasGrowthBossFace);
				}
			}catch(_){}

			if (showEnemyFace && eImg){
				setSrcIfChanged(eImg, enemyFaceSrc || '');
				rememberImg('enemy', String(enemyFaceSrc || ''));
				showEl(eImg);
				hideEl(eCv);
			}else{
				try{
					const eObj = (window && window.enemy) ? window.enemy : (typeof enemy !== 'undefined' ? enemy : null);
					let nm = (eObj && eObj.name) ? eObj.name : '';
					try{ if (typeof displayName === 'function') nm = displayName(nm); }catch(_){}
					if (eCv) drawCanvasIfChanged('enemy', 'battleRadarEnemyCanvasSprite', 'name:' + String(nm || ''), nm);
					showEl(eCv);
				}catch(_){}
				hideEl(eImg);
			}
		}catch(_e){}
	};

	
window.__battleRadarSpritesStartBattleAnim = function(){
		try{
			// refresh + show
			try{ window.__updateBattleRadarSideSprites({}); }catch(_){}
			const pImg = document.getElementById('battleRadarPlayerSprite');
			const eImg = document.getElementById('battleRadarEnemySprite');
			const pCv = document.getElementById('battleRadarPlayerCanvasSprite');
			const eCv = document.getElementById('battleRadarEnemyCanvasSprite');
			const stage = document.getElementById('battleRadarStage');
			if (!stage) return;

			const pick = (img, cv)=>{
				try{
					if (img && !img.classList.contains('hidden')) return img;
					if (cv && !cv.classList.contains('hidden')) return cv;
					// fallback preference
					return img || cv || null;
				}catch(_){ return img || cv || null; }
			};

			const pEl = pick(pImg, pCv);
			const eEl = pick(eImg, eCv);
			if (!pEl) return;
			if (!eEl && !autoActive) return;

			// cancel previous animations
			try{
				[pEl, eEl].filter(Boolean).forEach(el=>{
					try{
						if (el.getAnimations){
							el.getAnimations().forEach(a=>{ try{ a.cancel(); }catch(_){ } });
						}
					}catch(_){}
					el.style.transform = '';
					el.style.opacity = '';
				});
			}catch(_){}

			const token = (window.__battleRadarSpriteAnimToken||0) + 1;
			window.__battleRadarSpriteAnimToken = token;

			const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
			const jumpOnce = (el, delayMs)=>{
				try{
					// keep base translateY(-50%) for sprites
					const base = (el.classList && el.classList.contains('battle-radar-sprite-canvas')) ? 'translateY(-50%)' : 'translateY(-50%)';
					return el.animate(
						[
							{ transform: base + ' translateY(0px) scale(1)' },
							{ transform: base + ' translateY(-10px) scale(1.06)' },
							{ transform: base + ' translateY(0px) scale(1)' }
						],
						{ duration: 180, easing: 'cubic-bezier(0.2,0.9,0.2,1)', delay: delayMs||0, fill: 'forwards' }
					);
				}catch(_){ return null; }
			};

			// ピョコン回数
			const jumps = autoActive ? 3 : 10;
			
			const gap = 110;
			const one = 180;
			
			const total = one * jumps + gap * (jumps - 1);
			window.__battleRadarSpritePreAnimEndsAt = now + total;
			
			for(let i = 0; i < jumps; i++){
			    const t = i * (one + gap);
			    jumpOnce(pEl, t);
			    if (!autoActive && eEl) jumpOnce(eEl, t);
			}

			return token;
		}catch(_e){}
	};

	window.__battleRadarSpritesFinishBattleAnim = function(playerWon){
		try{
			const pImg = document.getElementById('battleRadarPlayerSprite');
			const eImg = document.getElementById('battleRadarEnemySprite');
			const pCv = document.getElementById('battleRadarPlayerCanvasSprite');
			const eCv = document.getElementById('battleRadarEnemyCanvasSprite');
			const stage = document.getElementById('battleRadarStage');
			if (!stage) return;

			const pick = (img, cv)=>{
				try{
					if (img && !img.classList.contains('hidden')) return img;
					if (cv && !cv.classList.contains('hidden')) return cv;
					return img || cv || null;
				}catch(_){ return img || cv || null; }
			};

			const pEl = pick(pImg, pCv);
			const eEl = pick(eImg, eCv);
			if (!pEl) return;
			if (!eEl && !autoActive) return;

			const token = window.__battleRadarSpriteAnimToken || 0;

			const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
			const endsAt = (typeof window.__battleRadarSpritePreAnimEndsAt === 'number') ? window.__battleRadarSpritePreAnimEndsAt : now;

			const isLargeBossFace = !!(window.isBossBattle || window.isGrowthBoss || window.isStrongBossBattle);
			const resultReadyDelay = Math.max(0, endsAt - now) + (isLargeBossFace ? 1480 : 1180);
			const delay = resultReadyDelay + (isLargeBossFace ? 860 : 640); // WIN/LOSE を見せる余韻を確保してから敗者をゆっくり消す
			window.__battleRadarResultReadyAt = Math.max(Number(window.__battleRadarResultReadyAt || 0) || 0, now + resultReadyDelay);
			window.__battleRadarLoserFadeStartsAt = Math.max(Number(window.__battleRadarLoserFadeStartsAt || 0) || 0, now + delay);

			const loserIsPlayer = !playerWon;
			const loserEl = loserIsPlayer ? pEl : eEl;

			// start -> top corner within the stage
			const rectStage = stage.getBoundingClientRect();
			const rectLoser = loserEl.getBoundingClientRect();

			const startX = (rectLoser.left + rectLoser.width/2) - (rectStage.left + rectStage.width/2);
			const startY = (rectLoser.top + rectLoser.height/2) - (rectStage.top + rectStage.height/2);

			// target: left-top for player loser, right-top for enemy loser
			const targetX = (loserIsPlayer ? (-rectStage.width/2 + 28) : (rectStage.width/2 - 28));
			const targetY = (-rectStage.height/2 + 18);

			// delta in stage-centered coordinates
			const dx = targetX - startX;
			const dy = targetY - startY;

			try{
				// cancel existing
				if (loserEl.getAnimations){
					loserEl.getAnimations().forEach(a=>{ try{ a.cancel(); }catch(_){ } });
				}
			}catch(_){}

			try{
				loserEl.animate(
					[
						{ transform: 'translateY(-50%) translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1, offset:0 },
						{ transform: 'translateY(-50%) translate('+(dx*0.12).toFixed(1)+'px,'+(dy*0.12-2).toFixed(1)+'px) rotate(18deg) scale(1.0)', opacity: 1, offset:0.18 },
						{ transform: 'translateY(-50%) translate('+(dx*0.34).toFixed(1)+'px,'+(dy*0.34-8).toFixed(1)+'px) rotate(92deg) scale(0.985)', opacity: 0.98, offset:0.48 },
						{ transform: 'translateY(-50%) translate('+(dx*0.64).toFixed(1)+'px,'+(dy*0.64-18).toFixed(1)+'px) rotate(210deg) scale(0.95)', opacity: 0.72, offset:0.82 },
						{ transform: 'translateY(-50%) translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) rotate(420deg) scale(0.88)', opacity: 0.0, offset:1 }
					],
					{ duration: isLargeBossFace ? 1760 : 1560, easing: 'cubic-bezier(0.16,0.84,0.2,1)', delay, fill: 'forwards' }
				);
			}catch(_){}

		}catch(_e){}
	};

window.drawBattleRadarChart = function(playerLike, enemyLike){
		try{
			const wrap = document.getElementById('battleRadarWrap');
			const canvas = document.getElementById('battleRadarChart');
			if (!wrap || !canvas) return;

			const p = pickStats(playerLike);
			const e = pickStats(enemyLike);

			// During first reroll selection, keep this hidden (CSS also hides, but be safe).
			try{
				if (window.__firstRerollSelectionPhase){
					wrap.classList.add('hidden');
					return;
				}
			}catch(_){}

			if (!p || !e){
				// Keep the container visible and show a small note instead of hiding completely
				try{
					wrap.classList.remove('hidden');
					try{ if (typeof window.__updateBattleRadarSideSprites === 'function') window.__updateBattleRadarSideSprites({hide:true}); }catch(_e){}
					requestAnimationFrame(() => {
						try { drawRadar(canvas, null, null, { note:true }); } catch (_e) {}
					});
				}catch(_e){}
				return;
			}

			// Ensure visible
			try{ wrap.classList.remove('hidden'); }catch(_){}
			// Update side sprites (player/enemy) when radar is drawn
			try{ if (typeof window.__updateBattleRadarSideSprites === 'function') window.__updateBattleRadarSideSprites({}); }catch(_e){}

			// ---- Smooth morph between previous battle and current battle ----
			// We keep a single running animation and, if a new battle starts while it's animating
			// (e.g., long-press auto battles), we start the next morph from the *current displayed*
			// shape to avoid snapping.
			const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
			const ease = (t)=>{ t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); }; // smoothstep

			if (!window.__battleRadarAnimState) window.__battleRadarAnimState = null;

			let startP = null, startE = null;

			const st = window.__battleRadarAnimState;
			if (st && st.fromP && st.toP && (now < st.start + st.dur)){
				const raw = (now - st.start) / st.dur;
				const et = ease(raw);
				startP = interpStatsLog(st.fromP, st.toP, et);
				startE = interpStatsLog(st.fromE, st.toE, et);
			}else{
				// Fall back to last completed snapshot
				startP = window.__battleRadarLastP || null;
				startE = window.__battleRadarLastE || null;
			}

			// If we have no previous snapshot yet, just draw immediately and store as last.
			if (!startP || !startE){
				window.__battleRadarLastP = p;
				window.__battleRadarLastE = e;
				window.__battleRadarLast = { p, e };
				window.__battleRadarAnimState = null;
				requestAnimationFrame(() => {
					try { drawRadar(canvas, p, e, { note:false }); } catch (_e) {}
				});
				return;
			}

			// Cancel previous RAF
			try{
				if (st && st.raf) cancelAnimationFrame(st.raf);
			}catch(_){}

			// Prepare new animation
			const dur = 460; // ms (slower than before, but still snappy on iPhone)
			const token = (st && st.token ? st.token+1 : 1);

			const anim = {
				fromP: startP, fromE: startE,
				toP: p,      toE: e,
				start: now,
				dur,
				token,
				raf: 0
			};
			window.__battleRadarAnimState = anim;

			const step = ()=>{
				try{
					const cur = window.__battleRadarAnimState;
					if (!cur || cur.token !== token) return;
					const t = ( (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now() ) - cur.start;
					const raw = (cur.dur <= 0) ? 1 : (t / cur.dur);
					const et = ease(raw);
					const ip = interpStatsLog(cur.fromP, cur.toP, et);
					const ie = interpStatsLog(cur.fromE, cur.toE, et);
					try { drawRadar(canvas, ip, ie, { note:false }); } catch (_e) {}
					if (raw >= 1){
						// Finish and store last snapshot for next battle
						window.__battleRadarLastP = cur.toP;
						window.__battleRadarLastE = cur.toE;
						window.__battleRadarLast = { p: cur.toP, e: cur.toE };
						window.__battleRadarAnimState = null;
						return;
					}
					cur.raf = requestAnimationFrame(step);
				}catch(_e){}
			};
			anim.raf = requestAnimationFrame(step);
		}catch(_e){}
	};

	// Ensure the radar container is visible with a placeholder (even before the first battle).
	try{
		document.addEventListener('DOMContentLoaded', () => {
			const wrap = document.getElementById('battleRadarWrap');
			const noteEl = document.getElementById('battleRadarNote');
			if (wrap){
				wrap.classList.remove('hidden');
			}
			if (noteEl){
				noteEl.textContent = noteEl.textContent || '戦闘開始で表示されます';
				noteEl.style.display = 'block';
			}
		});
	}catch(_e){}


	// redraw on resize (only if we have last data)
	let t = null;
	window.addEventListener('resize', function(){
		try{
			if (t) clearTimeout(t);
			t = setTimeout(function(){
				try{
					const last = window.__battleRadarLast;
					if (!last) return;
					const canvas = document.getElementById('battleRadarChart');
					const wrap = document.getElementById('battleRadarWrap');
					if (!canvas || !wrap || wrap.classList.contains('hidden')) return;
					drawRadar(canvas, last.p, last.e, { note:false });
				}catch(_e){}
			}, 120);
		}catch(_e){}
	}, { passive: true });

})();
;


function performFaceGacha() {
	// 高速連打でも処理が多重に走らないようガード
	if (window.__faceGachaBusy) return;

	if (faceCoins < FACE_GACHA_COST) {
		alert(`魔通貨が${FACE_GACHA_COST}枚必要です！現在の魔通貨：${faceCoins}`);
		return;
	}

	if (faceItemsOwned.length >= 100) {
		alert("所持魔メイクが上限に達しています。");
		return;
	}

	window.__faceGachaBusy = true;
	try{
		const btn = document.getElementById('faceGachaBtn');
		if (btn) btn.disabled = true;
	}catch(_){ }

	// 魔通貨消費
	faceCoins -= FACE_GACHA_COST;
	update魔通貨Display();


// --- 動的に補正された確率でランク抽選 ---
const baseProbs = {
  S: 0.0013,
  A: 0.0052,
  B: 0.0580,
  C: 0.0800,  // ← Cを増やす
  D: 0.8555   // ← Dを減らす
};

const streak = window.currentStreak || 0;
const bonusFactor = Math.min(1 + streak * 0.05, 2.0); // 最大2倍まで補正
const t = bonusFactor - 1; // 0〜1想定（連勝が増えるほど大きい）

// 連勝で「高レアほど上がる／低レアほど下がる」をS→Dでなだらかに。
let adjustedProbs = {
  S: baseProbs.S * (1 + t * 1.00),
  A: baseProbs.A * (1 + t * 0.90),
  B: baseProbs.B * (1 + t * 0.60),
  C: baseProbs.C * (1 - t * 0.60),
  D: baseProbs.D * (1 - t * 0.60)
};

// 念のため負の値を防ぐ
for (const k in adjustedProbs) adjustedProbs[k] = Math.max(0.0000001, adjustedProbs[k]);

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
			window.__faceGachaBusy = false;
			try{ if (typeof update魔通貨Display === 'function') update魔通貨Display(); }catch(_){ }
			return;
		}

		const { path, name } = result;

// ガチャ結果の「ズバーン」表示（進行を邪魔しない軽量演出）
try{
	if (typeof showFaceRevealAnimation === 'function') showFaceRevealAnimation(path, selectedRarity, 'gacha');
}catch(_){}

faceItemsOwned.push(path);
__ensureFaceBonus(path);

// 直後に詳細を自動展開（初回厳選/通常どちらでも、レーダー等が見える）
try{ window.__magicMakeOpenDetailPath = path; }catch(_){}

updateFaceUI();
	
		try{ if (typeof window.__maybeShowFirstReroll === 'function') window.__maybeShowFirstReroll(path); }catch(_e){}

		// すぐ次のガチャが引けるように解放
		window.__faceGachaBusy = false;
		try{ if (typeof update魔通貨Display === 'function') update魔通貨Display(); }catch(_){ }
		try{
			const btn = document.getElementById('faceGachaBtn');
			if (btn) btn.disabled = (faceCoins < FACE_GACHA_COST);
		}catch(_){ }
	}, 240);
}

// =====================================================
// First reroll (初回だけ：確定するまで同じガチャボタンで無料引き直し可)
//  - 「はじめから」開始後、初回の魔メイクは「確定」するまで何度でも引き直しOK（実質コストは1回分）
//  - 1戦でも開始（確定で開始）したら終了
//  - UI: ガチャボタン自体が「引き直し（無料）」モードに変化する
// =====================================================
(function(){
	try{
		if (window.__firstRerollPatchV2) return;
		window.__firstRerollPatchV2 = true;


		// 初回厳選中は、キャラクター情報の未読み込み部分を隠す（CSSで制御）
		window.__applyFirstFaceSelectingClass = function(){
			try{
				const on = !!window.__firstRerollSelectionPhase;
				document.body.classList.toggle('first-face-selecting', on);
				const note = document.getElementById('firstFaceSelectingNote');
				if (note){ note.classList.toggle('hidden', !on); }
			}catch(_){}
		};


		const getPanel   = () => document.getElementById('firstRerollPanel');
		const getGacha   = () => document.getElementById('faceGachaBtn');
		const getConfirm = () => document.getElementById('firstRerollConfirmBtn');

		function safeText(el, s){
			try{ if (el) el.textContent = String(s); }catch(_){}
		}

		function setGachaModeUI(){
			try{
				const st = window.__firstRerollState;
				const g = getGacha();
				if (!g) return;

				// default label
				if (!st || !st.eligible || st.locked || !window.__firstRerollSelectionPhase) {
					g.classList.remove('gacha-reroll-mode');
					g.classList.remove('is-bouncy');
					if (g.dataset && g.dataset.__origLabel) safeText(g, g.dataset.__origLabel);
					return;
				}

				// store original label once
				try{
					if (g.dataset && !g.dataset.__origLabel) g.dataset.__origLabel = g.textContent || 'ガチャ';
				}catch(_){}

				g.classList.add('gacha-reroll-mode');
				// まだ1回も引いてない → 通常の「ガチャ」
				if (!st.hasDrawn) {
					safeText(g, 'ガチャ（初回厳選）');
				} else {
					safeText(g, '引き直す（無料）');
					// attention: first time after draw
					try{
						if (!st.__bouncedOnce) {
							st.__bouncedOnce = true;
							g.classList.add('is-bouncy');
							setTimeout(()=>{ try{ g.classList.remove('is-bouncy'); }catch(_){} }, 9500);
						}
					}catch(_){}
				}
			}catch(_){}
		}

		function updateConfirmState(){
			try{
				const c = getConfirm();
				if (!c) return;
				const owned = Array.isArray(window.faceItemsOwned) ? window.faceItemsOwned.length : 0;
				c.disabled = !(owned > 0);
			}catch(_){}
		}

		function showPanel(attention){
			try{
				const panel = getPanel();
				if (panel) {
					panel.classList.remove('hidden');
					if (attention) {
						panel.classList.add('is-attention');
						setTimeout(()=>{ try{ panel.classList.remove('is-attention'); }catch(_){ } }, 12000);
					}
				}
			}catch(_){}
			try{ setGachaModeUI(); }catch(_){}
			try{ updateConfirmState(); }catch(_){}
		}

		function hideUI(){
			try{
				const panel = getPanel();
				if (panel) { panel.classList.add('hidden'); panel.classList.remove('is-attention'); }
			}catch(_){}
			try{ setGachaModeUI(); }catch(_){}
			try{
				const c = getConfirm();
				if (c) c.disabled = true;
			}catch(_){}
		}

		// 1戦でも開始したら、初回引き直しチケットは終了
		window.__lockFirstRerollTicket = function(){
			try{
				const st = window.__firstRerollState;
				if (!st) return;
				st.locked = true;
				st.eligible = false;
				window.__firstRerollArmed = false;
				window.__firstRerollSelectionPhase = false;
				try{ if (typeof window.__applyFirstFaceSelectingClass === 'function') window.__applyFirstFaceSelectingClass(); }catch(_){}
				try{ if (typeof window.__applyFirstFaceSelectingClass === 'function') window.__applyFirstFaceSelectingClass(); }catch(_){}
				st.lastPath = null;
				hideUI();
			}catch(_){}
		};

		// startNewGame から呼べるように公開
		window.__showFirstRerollPanel = function(attention){ try{ showPanel(!!attention); }catch(_){ } };
		window.__updateFirstRerollConfirmState = function(){ try{ updateConfirmState(); }catch(_){ } };

		// 初回限定チケットの状態
		window.__firstRerollState = window.__firstRerollState || {
			eligible: false,
			locked: false,
			shown: false,
			lastPath: null,
			hasDrawn: false,
			__bouncedOnce: false
		};

		window.__resetFirstRerollForNewGame = function(){
			try{
				window.__firstRerollArmed = true;
				window.__firstRerollSelectionPhase = true;
				try{ if (typeof window.__applyFirstFaceSelectingClass === 'function') window.__applyFirstFaceSelectingClass(); }catch(_){}
				try{ if (typeof window.__applyFirstFaceSelectingClass === 'function') window.__applyFirstFaceSelectingClass(); }catch(_){}

				const st = window.__firstRerollState || (window.__firstRerollState = {});
				st.eligible = true;
				st.locked = false;
				st.shown = false;
				st.lastPath = null;
				st.hasDrawn = false;
				st.__bouncedOnce = false;

				hideUI();
				// パネルは最初から出しておく（確定はガチャ後に有効化）
				try{ showPanel(true); }catch(_){}
			}catch(_){}
		};

		function refundCost(){
			try{
				const cost = (typeof FACE_GACHA_COST === 'number' && Number.isFinite(FACE_GACHA_COST)) ? FACE_GACHA_COST : 1000;
				window.faceCoins = (typeof window.faceCoins === 'number' ? window.faceCoins : 0) + cost;
				if (typeof update魔通貨Display === 'function') update魔通貨Display();
			}catch(_){}
		}

		function removeFace(path){
			try{
				if (!path) return;

				const removeAll = (arr) => {
					try{
						if (!Array.isArray(arr)) return;
						for (let i = arr.length - 1; i >= 0; i--) {
							if (arr[i] === path) arr.splice(i, 1);
						}
					}catch(_){}
				};

				// 重要：ゲーム内の参照が window.faceItemsOwned と faceItemsOwned の両方に分かれている場合があるため、
				// 両方から確実に削除する。
				removeAll(window.faceItemsOwned);
				try{ if (typeof faceItemsOwned !== 'undefined') removeAll(faceItemsOwned); }catch(_){}

				try{ if (window.equippedFaceItem === path) window.equippedFaceItem = null; }catch(_){}
				try{ if (window.faceItemBonusMap && window.faceItemBonusMap[path]) delete window.faceItemBonusMap[path]; }catch(_){}
			}catch(_){}
		}

		window.__doFirstReroll = function(){
			try{
				const st = window.__firstRerollState;
				if (!st || !st.eligible || st.locked) return;

				const path = st.lastPath;
				if (!path) return;

				removeFace(path);
				refundCost();

				// Refresh UI
				try{ if (typeof updateFaceUI === 'function') updateFaceUI(); }catch(_){}
				try{ if (typeof updateStats === 'function') updateStats(); }catch(_){}

				// clear lastPath so double click won't delete twice
				st.lastPath = null;

				try{
					if (typeof showCustomAlert === 'function') {
						//showCustomAlert('✨ 無料引き直し！直前の魔メイクを取り消しました。もう一度ガチャできます（確定するまで何度でもOK）', 2400);
					}
				}catch(_){}
			}catch(_){}
		};

		window.__confirmFirstRerollAndStart = function(){
			try{
				const owned = Array.isArray(window.faceItemsOwned) ? window.faceItemsOwned.length : 0;
				if (!(owned > 0)) {
					try{ if (typeof showCustomAlert === 'function') showCustomAlert('先に魔メイクをガチャしてください', 2200); }catch(_){}
					return;
				}

				// end selection phase + lock ticket
				window.__firstRerollSelectionPhase = false;
				try{ if (typeof window.__applyFirstFaceSelectingClass === 'function') window.__applyFirstFaceSelectingClass(); }catch(_){}
				try{ if (typeof window.__lockFirstRerollTicket === 'function') window.__lockFirstRerollTicket(); }catch(_){}
				try{ hideUI(); }catch(_){}

				const safeStart = () => {
					// 確定した魔メイクを、最初の戦闘開始前に自動装備
					try{
						const st = window.__firstRerollState;
						let path = (st && st.lastPath) ? st.lastPath : null;
						if (!path && Array.isArray(window.faceItemsOwned) && window.faceItemsOwned.length > 0) {
							path = window.faceItemsOwned[window.faceItemsOwned.length - 1];
						}
						if (path) {
							try{ if (typeof window.__ensureFaceBonus === 'function') window.__ensureFaceBonus(path); }catch(_){}
							try{ window.faceItemEquipped = path; }catch(_){}
							try{ window.equippedFaceItem = path; }catch(_){}
							try{ if (typeof updateFaceUI === 'function') updateFaceUI(); }catch(_){}
							try{ if (typeof updatePlayerImage === 'function') updatePlayerImage(); }catch(_){}
							try{ if (typeof window.syncFaceOverlay === 'function') window.syncFaceOverlay(); }catch(_){}
						}
					}catch(_){}
					try{ if (typeof updateStats === 'function') updateStats(); }catch(_){}
					// 最初のバトル直前のみ、戦闘ログを自動で開く（startBattle側で実行）
					try{ window.__openBattleLogOnNextBattle = true; }catch(_){}
					try{ if (typeof window.startBattle === 'function') window.startBattle(); }catch(_){}
					try{ if (typeof updateFaceUI === 'function') updateFaceUI(); }catch(_){}
				};

				try{
					if (window.__enemyNamePoolInitPromise && typeof window.__enemyNamePoolInitPromise.then === 'function') {
						window.__enemyNamePoolInitPromise.then(()=>{ safeStart(); });
					} else {
						safeStart();
					}
				}catch(_){
					safeStart();
				}
			}catch(_){}
		};

		window.__maybeShowFirstReroll = function(lastPath){
			try{
				const st = window.__firstRerollState || (window.__firstRerollState = { eligible:false, locked:false, shown:false, lastPath:null, hasDrawn:false, __bouncedOnce:false });
				if (st.locked) return;

				// armedなら復旧
				if (!st.eligible && window.__firstRerollArmed) st.eligible = true;
				if (!st.eligible) return;

				if (!lastPath) return;

				st.lastPath = lastPath;
				st.hasDrawn = true;
				window.__firstRerollSelectionPhase = true;
				try{ if (typeof window.__applyFirstFaceSelectingClass === 'function') window.__applyFirstFaceSelectingClass(); }catch(_){}

				showPanel(!st.shown);
				st.shown = true;
				updateConfirmState();
				setGachaModeUI();
			}catch(_){}
		};

		// ガチャボタンを「引き直し（無料）」に変えるため、clickをcaptureでフック
		function installGachaCapture(){
			try{
				if (window.__firstRerollGachaCaptureInstalled) return;
				const g = getGacha();
				if (!g) return;
				window.__firstRerollGachaCaptureInstalled = true;

				g.addEventListener('click', function(){
					try{
						const st = window.__firstRerollState;
						if (!st || !st.eligible || st.locked) return;
						if (!window.__firstRerollSelectionPhase) return;

						// 1回目は通常のガチャ（削除/返金しない）
						if (!st.hasDrawn) {
							// UI反映だけ
							setTimeout(()=>{ try{ setGachaModeUI(); }catch(_){ } }, 0);
							return;
						}

						// 2回目以降：直前の結果を消して返金 → 通常のガチャ処理に流す（=実質無料引き直し）
						if (st.lastPath) {
							try{ window.__doFirstReroll(); }catch(_){}
						}
					}catch(_){}
				}, true);

				// 初期UI
				try{ setGachaModeUI(); }catch(_){}
			}catch(_){}
		}

		// confirm button binding
		function installConfirm(){
			try{
				if (window.__firstRerollConfirmBound) return;
				const c = getConfirm();
				if (!c) return;
				window.__firstRerollConfirmBound = true;
				c.addEventListener('click', (e)=>{ e.preventDefault(); window.__confirmFirstRerollAndStart(); });
			}catch(_){}
		}

		// install on DOM ready
		const boot = () => { try{ installGachaCapture(); }catch(_){ } try{ installConfirm(); }catch(_){ } };
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
		else boot();

	}catch(_e){}
})();;



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

// =====================================================
// Battle ticker / reward board (v22 base safe patch)
// =====================================================
(function(){
  if (window.__battleTickerV22FixInstalled) return;
  window.__battleTickerV22FixInstalled = true;

  const DISPLAY_MS = 2200;
  const FINAL_DELAY_MS = 1350;
  const TYPEWRITER_BASE_MS = 105;
  const TYPEWRITER_PUNCT_MS = 150;
  const TYPEWRITER_MIN_TOTAL_MS = 900;
  const TYPEWRITER_MAX_TOTAL_MS = 2400;

  function _num(v){ const n = Number(v); return Number.isFinite(n) ? n : 0; }
  function _safeName(v){ return String(v == null ? '' : v).trim(); }
  function _dispName(v){
    try{ return (typeof displayName === 'function') ? String(displayName(v || '') || '').trim() : _safeName(v); }catch(_){ return _safeName(v); }
  }
  function _playerNames(){
    const list = ['プレイヤー','自分','YOU','Player','主人公'];
    try{ if (typeof player !== 'undefined' && player && player.name) list.push(player.name); }catch(_){}
    try{ if (window.player && window.player.name) list.push(window.player.name); }catch(_){}
    try{ if (typeof player !== 'undefined' && player && player.name) list.push(_dispName(player.name)); }catch(_){}
    try{ if (window.player && window.player.name) list.push(_dispName(window.player.name)); }catch(_){}
    return Array.from(new Set(list.map(_safeName).filter(Boolean)));
  }
  function _enemyNames(){
    const list = ['敵','エネミー','ENEMY','相手'];
    try{ if (typeof enemy !== 'undefined' && enemy && enemy.name) list.push(enemy.name); }catch(_){}
    try{ if (window.enemy && window.enemy.name) list.push(window.enemy.name); }catch(_){}
    try{ if (typeof enemy !== 'undefined' && enemy && enemy.name) list.push(_dispName(enemy.name)); }catch(_){}
    try{ if (window.enemy && window.enemy.name) list.push(_dispName(window.enemy.name)); }catch(_){}
    return Array.from(new Set(list.map(_safeName).filter(Boolean)));
  }
  function _sideFromName(name){
    try{
      if (typeof window.__battleDigestResolveActorSide === 'function') {
        const resolved = window.__battleDigestResolveActorSide(name);
        if (resolved) return resolved;
      }
    }catch(_e){}
    const n = _safeName(name);
    if (!n) return null;
    if (_playerNames().some(v => v && (n === v || n.includes(v) || v.includes(n)))) return 'player';
    if (_enemyNames().some(v => v && (n === v || n.includes(v) || v.includes(n)))) return 'enemy';
    if (/^(プレイヤー|自分|YOU|Player|主人公)/i.test(n)) return 'player';
    if (/^(敵|エネミー|ENEMY|相手)/i.test(n)) return 'enemy';
    return null;
  }
  function _formatTickerLabel(txt){
    let s = _safeName(txt);
    if (!s) return 'READY';
    if (/<span\b/i.test(s)) return s;
    s = s.replace(/\s*\/\s*/g, '/');
    if (/^(WIN|LOSE)$/i.test(s)) return s;
    s = s.replace(/\s+Lv\s*([0-9]+)/i, '<span class="battle-skill-inline-meta">Lv$1</span>');
    s = s.replace(/\s+ItemLv\s*([0-9]+)/i, '<span class="battle-skill-inline-meta">ItemLv$1</span>');
    if (s.indexOf('<br>') < 0 && s.length >= 22 && !/^(WIN|LOSE)$/i.test(s)){
      const parts = s.split('/');
      if (parts.length > 1) s = parts[0] + '<br>' + parts.slice(1).join('/');
    }
    return s;
  }
  function _clearTypewriter(el){
    try{
      if (!el) return;
      if (el.__typeTimer){ try{ clearTimeout(el.__typeTimer); }catch(_){ } }
      el.__typeTimer = 0;
      el.__typeToken = (el.__typeToken || 0) + 1;
      el.classList.remove('is-typewriting');
      const textEl = el.querySelector('.battle-ticker-text');
      if (textEl) textEl.classList.remove('is-typewriting');
    }catch(_){ }
  }
  function _shouldTypewrite(opt){
    try{
      const o = opt || {};
      if (o.finalState) return true;
      if (o.isReady || o.isReward) return false;
      if (!window.__battleStartedAsAuto) return true;
      return !!window.__battleRevealEnemySpriteOnce;
    }catch(_){ return true; }
  }
  function _typewriterSpeedFor(text){
    try{
      const s = String(text == null ? '' : text);
      const len = s.replace(/\s+/g,'').length;
      if (len >= 24) return 92;
      if (len >= 16) return 100;
      return TYPEWRITER_BASE_MS;
    }catch(_){ return TYPEWRITER_BASE_MS; }
  }
  function _estimateHoldMs(label, opt){
    try{
      const o = opt || {};
      if (o.finalState) return 2200;
      if (o.isReady) return 10;
      let plain = String(label == null ? '' : label)
        .replace(/<br\s*\/?/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      let hold = DISPLAY_MS;
      if (plain){
        const chars = plain.replace(/\s+/g,'').length;
        hold += Math.min(1200, chars * 42);
      }
      if (_shouldTypewrite(o)){
        const speed = _typewriterSpeedFor(plain);
        const chars = Math.max(1, plain.length);
        hold = Math.max(hold, Math.min(TYPEWRITER_MAX_TOTAL_MS, Math.max(TYPEWRITER_MIN_TOTAL_MS, chars * speed + 520)));
      }
      if (o.tier === 'high') hold += 180;
      if (o.tier === 'mythic') hold += 320;
      return hold;
    }catch(_){ return DISPLAY_MS; }
  }
  function _runTypewriter(el, opt){
    try{
      if (!el) return;
      _clearTypewriter(el);
      const textEl = el.querySelector('.battle-ticker-text');
      if (!textEl) return;
      if (!_shouldTypewrite(opt)) return;
      const skillNameEl = textEl.querySelector('.battle-skill-name');
      if (!skillNameEl) return;
      const full = String(skillNameEl.textContent || '');
      if (!full || full.length <= 1) return;
      const token = (el.__typeToken || 0) + 1;
      el.__typeToken = token;
      el.classList.add('is-typewriting');
      textEl.classList.add('is-typewriting');
      skillNameEl.textContent = '';
      let idx = 0;
      const speed = _typewriterSpeedFor(full);
      const step = function(){
        try{
          if ((el.__typeToken || 0) !== token) return;
          idx += 1;
          skillNameEl.textContent = full.slice(0, idx);
          if (idx >= full.length){
            el.__typeTimer = 0;
            el.classList.remove('is-typewriting');
            textEl.classList.remove('is-typewriting');
            return;
          }
          const ch = full.charAt(idx - 1);
          const wait = /[\s・、。,.!！?？]/.test(ch) ? TYPEWRITER_PUNCT_MS : speed;
          el.__typeTimer = (window.__uiSetTimeout || window.setTimeout)(step, wait);
        }catch(_){ }
      };
      el.__typeTimer = (window.__uiSetTimeout || window.setTimeout)(step, Math.max(70, Math.round(speed * 0.9)));
    }catch(_){ }
  }
  function _ensureState(){
    const st = window.__battleDigestState || (window.__battleDigestState = {});
    if (!st.queues) st.queues = { player:{queue:[],current:null,timer:0,loopIndex:0}, enemy:{queue:[],current:null,timer:0,loopIndex:0} };
    if (!st.queues.player.loopIndex && st.queues.player.loopIndex !== 0) st.queues.player.loopIndex = 0;
    if (!st.queues.enemy.loopIndex && st.queues.enemy.loopIndex !== 0) st.queues.enemy.loopIndex = 0;
    if (!st.usage) st.usage = { player:{}, enemy:{} };
    if (!st.loopLists) st.loopLists = { player:[], enemy:[] };
    if (!Array.isArray(st.itemRewards)) st.itemRewards = [];
    if (typeof st.finalLocked !== 'boolean') st.finalLocked = false;
    return st;
  }
  function _ensureLayer(){
    try{
      const stage = document.getElementById('battleRadarStage');
      if (!stage) return null;
      let layer = document.getElementById('battleDigestLayer');
      if (!layer){
        layer = document.createElement('div');
        layer.id = 'battleDigestLayer';
        layer.className = 'battle-digest-layer';
        stage.appendChild(layer);
      }
      return layer;
    }catch(_){ return null; }
  }
  function _isTickerSuppressed(){
    try{
      // AutoBattle中でも電光掲示板の通常表示を一切省略しない。
      // 軽量化は別レイヤーで行い、掲示板の状態機械には干渉させない。
      return false;
    }catch(_){ return false; }
  }
  function _applyTickerVisibility(){
    try{
      const hidden = _isTickerSuppressed();
      const layer = document.getElementById('battleDigestLayer');
      if (layer) layer.classList.toggle('is-auto-minimal', !!hidden);
      ['battleTickerPlayer','battleTickerEnemy'].forEach(function(id){
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle('is-suppressed', !!hidden);
      });
    }catch(_){ }
  }
  function _clearDigestTimers(prev){
    try{
      const st = prev || window.__battleDigestState;
      if (!st) return;
      try{
        st.replayLoopActive = true;
      ['player','enemy'].forEach(function(side){
          const q = st.queues && st.queues[side];
          if (q && q.timer){ try{ clearTimeout(q.timer); }catch(_){ } q.timer = 0; }
        });
      }catch(_){ }
      try{ if (st.finalTimer){ clearTimeout(st.finalTimer); st.finalTimer = 0; } }catch(_){ }
      try{
        ['battleTickerPlayer','battleTickerEnemy'].forEach(function(id){
          const el = document.getElementById(id);
          if (el) _clearTypewriter(el);
        });
      }catch(_){ }
    }catch(_){ }
  }
  function _escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function _ensureRewardDetailState(){
    const store = window.__battleRewardDetailStore || (window.__battleRewardDetailStore = {});
    if (!window.__battleRewardDetailSeq) window.__battleRewardDetailSeq = 0;
    return store;
  }
  function _registerRewardDetail(payload){
    try{
      const store = _ensureRewardDetailState();
      const id = 'reward_' + (++window.__battleRewardDetailSeq);
      store[id] = Object.assign({ title:'詳細', html:'', duration:9000 }, payload || {});
      return id;
    }catch(_){ return ''; }
  }
  function _getRewardDetailPayload(detailRef){
    try{
      if (!detailRef) return null;
      if (typeof detailRef === 'object' && detailRef.html != null) {
        return Object.assign({ title:'詳細', html:'', duration:9000 }, detailRef || {});
      }
      const raw = String(detailRef || '');
      if (/^%7B/i.test(raw) || /^\{/.test(raw)) {
        try{
          const decoded = /^%7B/i.test(raw) ? decodeURIComponent(raw) : raw;
          const parsed = JSON.parse(decoded);
          if (parsed && typeof parsed === 'object') {
            return Object.assign({ title:'詳細', html:'', duration:9000 }, parsed);
          }
        }catch(_jsonErr){}
      }
      const store = _ensureRewardDetailState();
      return store && raw ? store[raw] : null;
    }catch(_){ return null; }
  }
  function _encodeRewardDetailPayload(payload){
    try{
      if (!payload) return '';
      return encodeURIComponent(JSON.stringify({
        title: String(payload.title || '詳細'),
        html: String(payload.html || ''),
        duration: Math.max(4500, Number(payload.duration || 9000) || 9000)
      }));
    }catch(_){ return ''; }
  }
  function _openRewardDetail(detailRef){
    try{
      const payload = _getRewardDetailPayload(detailRef);
      if (!payload) return;

      const overlayId = 'battleRewardDetailOverlay';
      const old = document.getElementById(overlayId);
      if (old && old.parentNode) old.parentNode.removeChild(old);

      const overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.className = 'battle-reward-detail-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.zIndex = '10050';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.pointerEvents = 'auto';
      overlay.innerHTML = '' +
        '<div class="battle-reward-detail-backdrop" data-close="1" style="position:absolute;inset:0;background:rgba(0,0,0,.58);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);"></div>' +
        '<div class="battle-reward-detail-card" style="position:relative;z-index:1;width:min(92vw,560px);max-height:min(82vh,720px);overflow:auto;padding:16px 14px 14px;border-radius:16px;border:1px solid rgba(120,180,255,.28);background:linear-gradient(180deg, rgba(10,16,28,.98), rgba(7,11,20,.96));box-shadow:0 18px 48px rgba(0,0,0,.55),0 0 24px rgba(90,150,255,.12);">' +
          '<button type="button" class="battle-reward-detail-close" aria-label="閉じる" style="position:absolute;top:8px;right:8px;width:32px;height:32px;padding:0;margin:0;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-size:18px;line-height:1;">×</button>' +
          '<div class="battle-drop-popup" style="max-width:none;">' +
            '<div class="battle-drop-popup-title">' + _escapeHtml(payload.title || '詳細') + '</div>' +
            '<div class="battle-drop-popup-body">' + String(payload.html || '') + '</div>' +
          '</div>' +
        '</div>';

      const closeOverlay = function(){
        try{
          if (overlay.__timer){ window.__uiClearTimeout ? window.__uiClearTimeout(overlay.__timer) : clearTimeout(overlay.__timer); }
        }catch(_e){}
        try{
          document.removeEventListener('keydown', onKeydown, true);
        }catch(_e){}
        try{
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }catch(_e){}
      };
      const onKeydown = function(ev){
        try{
          if (ev && ev.key === 'Escape'){
            ev.preventDefault();
            closeOverlay();
          }
        }catch(_e){}
      };

      overlay.addEventListener('click', function(ev){
        try{
          const t = ev && ev.target;
          if (!t) return;
          if ((t.closest && t.closest('.battle-reward-detail-close')) || (t.dataset && t.dataset.close === '1')) {
            ev.preventDefault();
            ev.stopPropagation();
            closeOverlay();
          }
        }catch(_e){}
      }, true);

      try{
        document.body.appendChild(overlay);
        document.addEventListener('keydown', onKeydown, true);
        const duration = Math.max(4500, Number(payload.duration || 9000) || 9000);
        overlay.__timer = window.__uiSetTimeout ? window.__uiSetTimeout(closeOverlay, duration) : setTimeout(closeOverlay, duration);
      }catch(_e){
        try{
          if (typeof window.showCenteredPopup === 'function') {
            const html = '<div class="battle-drop-popup"><div class="battle-drop-popup-title">' + _escapeHtml(payload.title || '詳細') + '</div><div class="battle-drop-popup-body">' + String(payload.html || '') + '</div></div>';
            window.showCenteredPopup(html, Math.max(3200, Number(payload.duration || 9000) || 9000));
          }
        }catch(__e){}
      }
    }catch(_){ }
  }
  function _renderRewardSummaryHtml(entries){
    try{
      const list = Array.isArray(entries) ? entries.filter(Boolean) : [];
      if (!list.length) return '';
      const rows = list.slice(-4).map(function(entry){
        const type = String(entry.type || 'item').toLowerCase();
        const chip = type === 'mixed-skill' ? 'MIX' : (type === 'skill' ? 'SKL' : 'DROP');
        const cls = type === 'mixed-skill' ? ' is-mixed-skill' : (entry.detailId ? ' is-detail' : '');
        const label = _escapeHtml(entry.summary || entry.label || '報酬あり');
        const count = (Number(entry.count || 0) > 1) ? '<span class="battle-drop-mult">×' + Math.floor(Number(entry.count)) + '</span>' : '';
        const payload = entry.detailId ? _getRewardDetailPayload(entry.detailId) : null;
        const payloadAttr = payload ? ' data-detail-payload="' + _escapeHtml(_encodeRewardDetailPayload(payload)) + '"' : '';
        const detail = entry.detailId ? '<button type="button" class="battle-drop-detail-btn" data-detail-id="' + _escapeHtml(entry.detailId) + '"' + payloadAttr + ' onclick="try{window.__openBattleRewardDetailFromInline&&window.__openBattleRewardDetailFromInline(this);}catch(_e){};return false;" onpointerup="try{window.__openBattleRewardDetailFromInline&&window.__openBattleRewardDetailFromInline(this);}catch(_e){}" ontouchend="try{window.__openBattleRewardDetailFromInline&&window.__openBattleRewardDetailFromInline(this);}catch(_e){}">詳細</button>' : '';
        return '<div class="battle-drop-entry' + cls + '"><span class="battle-drop-chip">' + chip + '</span><span class="battle-drop-entry-label">' + label + count + '</span>' + detail + '</div>';
      }).join('');
      return '<div class="battle-drop-list">' + rows + '</div>';
    }catch(_){ return ''; }
  }
  function _ensureTickerBoards(){
    try{
      const layer = _ensureLayer();
      if (!layer) return null;
      const make = (side)=>{
        const id = side === 'enemy' ? 'battleTickerEnemy' : 'battleTickerPlayer';
        let el = document.getElementById(id);
        if (el){
          try{
            el.removeAttribute('title');
            el.style.cursor = 'default';
            el.style.pointerEvents = 'none';
          }catch(_e){}
          return el;
        }
        el = document.createElement('div');
        el.id = id;
        el.className = 'battle-led-ticker ' + side;
        el.setAttribute('data-battle-ticker-side', side);
        el.style.cursor = 'default';
        el.style.pointerEvents = 'none';
        el.innerHTML = '<div class="battle-led-grid"></div><div class="battle-led-inner"><span class="battle-ticker-kind">'+(side==='enemy'?'ENEMY':'YOU')+'</span><span class="battle-ticker-text" data-tier="none">READY</span><span class="battle-ticker-count"></span></div>';
        layer.appendChild(el);
        return el;
      };
      _ensureReplayLoopButton(layer);
      return { player: make('player'), enemy: make('enemy') };
    }catch(_){ return null; }
  }

  function _ensureReplayLoopButton(layer){
    try{
      const host = layer || _ensureLayer();
      if (!host) return null;
      let btn = document.getElementById('battleTickerReplayLoopBtn');
      if (!btn){
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'battleTickerReplayLoopBtn';
        btn.className = 'battle-ticker-replay-btn';
        btn.setAttribute('aria-label', '掲示板ループ再生');
        btn.innerHTML = '<span class="battle-ticker-replay-btn-screen"><span class="battle-ticker-replay-btn-label">LOOP</span><span class="battle-ticker-replay-btn-sub">SKILL</span></span><span class="battle-ticker-replay-btn-knob" aria-hidden="true"></span>';
        const handler = function(ev){
          try{
            if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
            if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
            const ok = (typeof window.__battleDigestReplayFromClick === 'function') ? window.__battleDigestReplayFromClick() : false;
            btn.classList.remove('is-error');
            btn.classList.add('is-active');
            try{ if (btn.__flashTimer) clearTimeout(btn.__flashTimer); }catch(_t){}
            btn.__flashTimer = setTimeout(function(){ try{ btn.classList.remove('is-active'); }catch(_e){} }, ok ? 520 : 760);
            if (!ok) btn.classList.add('is-error');
          }catch(_e){}
          return false;
        };
        btn.onclick = handler;
        btn.addEventListener('pointerup', handler, true);
        btn.addEventListener('touchend', handler, { capture:true, passive:false });
      }
      try{ host.appendChild(btn); }catch(_e){}
      return btn;
    }catch(_){ return null; }
  }

  function _ensureRewardBoard(){
    try{
      const layer = _ensureLayer();
      if (!layer) return null;
      let el = document.getElementById('battleRewardBoard');
      if (!el){
        el = document.createElement('div');
        el.id = 'battleRewardBoard';
        el.className = 'battle-radar-reward-board';
        el.style.pointerEvents = 'auto';
        el.innerHTML = '<div class="battle-drop-title"></div><div class="battle-drop-body"></div>';
        layer.appendChild(el);
      }
      try{ el.style.pointerEvents = 'auto'; }catch(_e){}
      return el;
    }catch(_){ return null; }
  }
  function _setRewardBoardNotice(title, body, isItem, opt){
    try{
      const rb = _ensureRewardBoard();
      if (!rb) return;
      const tt = rb.querySelector('.battle-drop-title');
      const bd = rb.querySelector('.battle-drop-body');
      const o = (opt && typeof opt === 'object') ? opt : {};
      if (tt) tt.textContent = String(title || '');
      if (bd){
        if (o.html) bd.innerHTML = String(o.html || '');
        else bd.textContent = String(body || '');
      }
      rb.classList.remove('is-item','show','is-compact','is-bit');
      if (isItem) rb.classList.add('is-item');
      if (o.compact !== false) rb.classList.add('is-compact');
      if (o.bit !== false) rb.classList.add('is-bit');
      if (title || body || o.html) rb.classList.add('show');
    }catch(_){ }
  }
  function _setBoard(side, kind, text, count, opt){
    try{
      _ensureTickerBoards();
      _applyTickerVisibility();
      if (_isTickerSuppressed() && !(opt && opt.finalState) && !window.__winnerGuessMiniGameActive) return;
      const id = side === 'enemy' ? 'battleTickerEnemy' : 'battleTickerPlayer';
      const el = document.getElementById(id);
      if (!el) return;
      const kindEl = el.querySelector('.battle-ticker-kind');
      const textEl = el.querySelector('.battle-ticker-text');
      const countEl = el.querySelector('.battle-ticker-count');
      const o = opt || {};
      _clearTypewriter(el);
      if (kindEl) kindEl.textContent = String(kind || (side === 'enemy' ? 'ENEMY' : 'YOU'));
      if (textEl){
        textEl.innerHTML = _formatTickerLabel(text);
        textEl.setAttribute('data-tier', String(o.tier || 'normal'));
      }
      if (countEl) countEl.textContent = (count && Number(count) > 1) ? ('×' + Math.floor(Number(count))) : '';
      el.classList.remove('is-ready','is-final-win','is-final-lose','is-reward','is-flash');
      if (o.isReady) el.classList.add('is-ready');
      if (o.finalState === 'win') el.classList.add('is-final-win');
      if (o.finalState === 'lose') el.classList.add('is-final-lose');
      if (o.isReward) el.classList.add('is-reward');
      _runTypewriter(el, o);
      void el.offsetWidth;
      el.classList.add('is-flash');
      (window.__uiSetTimeout || window.setTimeout)(function(){ try{ el.classList.remove('is-flash'); }catch(_){ } }, Math.max(480, Number(o.flashMs || 760) || 760));
    }catch(_){ }
  }
  function _clearQueueTimer(side){
    try{
      const st = _ensureState();
      const qs = st.queues[side];
      if (qs && qs.timer){ try{ clearTimeout(qs.timer); }catch(_){} qs.timer = 0; }
    }catch(_){ }
  }
  function _stopWinnerGuessLoops(){
    try{
      const st = _ensureState();
      ['player','enemy'].forEach(function(side){
        const qs = st.queues && st.queues[side];
        if (!qs) return;
        _clearQueueTimer(side);
        qs.loopIndex = 0;
      });
    }catch(_){ }
  }
  function _drain(side){
    try{
      const st = _ensureState();
      const qs = st.queues[side];
      if (!qs || (st.finalLocked && !st.replayLoopActive)) return;
      if (_isTickerSuppressed() && !window.__winnerGuessMiniGameActive){
        _clearQueueTimer(side);
        qs.current = null;
        qs.queue = [];
        return;
      }
      _clearQueueTimer(side);
      if (!qs.current) qs.current = qs.queue.shift() || null;
      if (!qs.current && (window.__winnerGuessMiniGameActive || st.replayLoopActive)){
        const list = (st.loopLists && st.loopLists[side]) || [];
        if (list.length){
          const idx = Math.max(0, Number(qs.loopIndex || 0) || 0) % list.length;
          const src = list[idx];
          qs.loopIndex = (idx + 1) % list.length;
          qs.current = Object.assign({}, src, { holdMs: Math.max(Number(src.holdMs || 0) || 0, 1400) });
        }
      }
      const item = qs.current;
      if (!item) return;
      _setBoard(side, item.kind, item.label, item.count, { tier:item.tier, flashMs:item.holdMs || DISPLAY_MS });
      qs.timer = (window.__uiSetTimeout || window.setTimeout)(function(){
        try{
          const st2 = _ensureState();
          if (st2.finalLocked && !st2.replayLoopActive) return;
          const q2 = st2.queues[side];
          if (!q2 || q2.current !== item) return;
          q2.current = null;
          _drain(side);
        }catch(_){ }
      }, item.holdMs || DISPLAY_MS);
    }catch(_){ }
  }
  function _enqueue(side, kind, label, count, tier, key){
    try{
      const st = _ensureState();
      if (st.finalLocked || !side || !label) return;
      if (_isTickerSuppressed() && !window.__winnerGuessMiniGameActive){
        const qsSilent = st.queues && st.queues[side];
        if (qsSilent){ _clearQueueTimer(side); qsSilent.current = null; qsSilent.queue = []; }
        return;
      }
      const qs = st.queues[side];
      if (!qs) return;
      const entryOpt = { tier:tier || 'normal' };
      const entry = { kind, label, count: Math.max(1, _num(count) || 1), tier:tier || 'normal', key:key || (kind+'::'+label), holdMs:_estimateHoldMs(label, entryOpt) };
      const loopList = st.loopLists && st.loopLists[side];
      if (Array.isArray(loopList)){
        const loopIdx = loopList.findIndex(function(it){ return it && it.key === entry.key; });
        if (loopIdx >= 0) loopList[loopIdx] = Object.assign({}, loopList[loopIdx], entry);
        else loopList.push(Object.assign({}, entry));
        if (loopList.length > 12) st.loopLists[side] = loopList.slice(-12);
        _snapshotReplayLists();
      }
      if (qs.current && qs.current.key === entry.key){
        qs.current.count = entry.count;
        qs.current.holdMs = Math.max(Number(qs.current.holdMs || 0) || 0, Number(entry.holdMs || DISPLAY_MS) || DISPLAY_MS);
        _setBoard(side, qs.current.kind, qs.current.label, qs.current.count, { tier:qs.current.tier, flashMs:720 });
        return;
      }
      const tail = qs.queue.length ? qs.queue[qs.queue.length-1] : null;
      if (tail && tail.key === entry.key){ tail.count = entry.count; tail.label = entry.label; tail.tier = entry.tier; tail.holdMs = entry.holdMs; return; }
      qs.queue.push(entry);
      if (qs.queue.length > 6) qs.queue = qs.queue.slice(-6);
      if (!qs.current) _drain(side);
    }catch(_){ }
  }

  function _cloneReplayLists(src){
    try{
      const out = { player:[], enemy:[] };
      ['player','enemy'].forEach(function(side){
        const list = src && src[side];
        if (Array.isArray(list)) out[side] = list.map(function(it){ return Object.assign({}, it); });
      });
      return out;
    }catch(_){ return { player:[], enemy:[] }; }
  }
  function _snapshotReplayLists(){
    try{
      const st = _ensureState();
      if (!st) return;
      st.replaySnapshot = _cloneReplayLists(st.loopLists || { player:[], enemy:[] });
    }catch(_){ }
  }
  function _hasReplayLists(lists){
    try{
      return ['player','enemy'].some(function(side){
        const list = lists && lists[side];
        return Array.isArray(list) && list.length > 0;
      });
    }catch(_){ return false; }
  }
  function _startReplayLoopFromLoopLists(){
    try{
      const st = _ensureState();
      if (!st) return false;
      let started = false;
      ['player','enemy'].forEach(function(side){
        const list = st.loopLists && st.loopLists[side];
        const qs = st.queues && st.queues[side];
        if (!qs) return;
        _clearQueueTimer(side);
        qs.current = null;
        qs.queue = Array.isArray(list) ? list.map(function(it){ return Object.assign({}, it); }) : [];
        qs.loopIndex = 0;
        if (qs.queue.length){
          started = true;
          _drain(side);
        }else{
          _setBoard(side, side === 'enemy' ? 'ENEMY' : 'YOU', 'READY', 0, { isReady:true, tier:'none', flashMs:10 });
        }
      });
      _applyTickerVisibility();
      return started;
    }catch(_){ return false; }
  }
  function _replayUsageBoards(){
    try{
      const st = _ensureState();
      if (!st) return;
      ['player','enemy'].forEach(function(side){
        const bucket = st.usage && st.usage[side] ? st.usage[side] : null;
        if (!bucket) return;
        const entries = Object.keys(bucket).map(function(key){
          const it = bucket[key] || {};
          const kind = String(it.kind || (/ITEM/.test(key) ? 'ITEM' : 'SKILL'));
          const label = String(it.label || key.split('::').slice(1).join(' / ') || (side === 'enemy' ? 'ENEMY' : 'YOU'));
          const count = Math.max(1, Number(it.count || 1) || 1);
          const tier = (kind === 'ITEM') ? 'high' : ((/Lv(\d{4,})/.test(label)) ? 'mythic' : 'normal');
          return { key:key, kind:kind, label:label, count:count, tier:tier, holdMs:_entryHoldMs(label, count) };
        }).filter(Boolean).sort(function(a,b){ return (b.count - a.count) || String(a.label).localeCompare(String(b.label), 'ja'); });
        st.loopLists[side] = entries.slice(0, 6).map(function(it){ return Object.assign({}, it); });
        const qs = st.queues && st.queues[side];
        if (!qs) return;
        _clearQueueTimer(side);
        qs.queue = st.loopLists[side].map(function(it){ return Object.assign({}, it); });
        qs.current = null;
        qs.loopIndex = 0;
        if (qs.queue.length) _drain(side);
        else _setBoard(side, side === 'enemy' ? 'ENEMY' : 'YOU', 'READY', 0, { isReady:true, tier:'none', flashMs:10 });
      });
      _applyTickerVisibility();
      _snapshotReplayLists();
    }catch(_){ }
  }
  window.__battleDigestForceShowTickers = function(){
    try{
      window.__battleTickerForceShow = true;
      _replayUsageBoards();
    }catch(_){ }
  };

  function _buildReplayEntriesFromBattleLog(){
    try{
      const st = _ensureState();
      if (!st) return false;
      const lines = Array.isArray(window.log) ? window.log.slice() : [];
      if (!lines.length) return false;
      st.usage = { player:{}, enemy:{} };
      const addUsage = function(side, kind, name, meta){
        try{
          if (!side || !name) return;
          const level = Math.max(1, Number(meta && meta.level || 1) || 1);
          const itemLevel = Math.max(0, Number(meta && meta.itemLevel || 0) || 0);
          const label = (typeof window.__formatSkillDisplay === 'function')
            ? window.__formatSkillDisplay({ name:name, level:level, itemLevel:itemLevel })
            : String(name);
          const key = String(kind || 'SKILL') + '::' + String(name);
          if (!st.usage[side][key]) st.usage[side][key] = { kind:String(kind || 'SKILL'), label:label, count:0 };
          st.usage[side][key].count += 1;
          st.usage[side][key].label = label;
        }catch(_e){}
      };
      lines.forEach(function(rawLine){
        try{
          const line = _safeName(rawLine);
          if (!line) return;
          let parsedSkill = (typeof window.__battleDigestParseSkillUsageLine === 'function') ? window.__battleDigestParseSkillUsageLine(line) : null;
          if (parsedSkill){
            const actorName = _safeName(parsedSkill.actorName);
            const skillName = _safeName(parsedSkill.skillName);
            const detail = _safeName(parsedSkill.detail);
            const side = _sideFromName(actorName);
            if (!side || !skillName) return;
            const meta = (typeof window.__lookupBattleSkillMeta === 'function')
              ? window.__lookupBattleSkillMeta(actorName, skillName, detail)
              : { level:1, itemLevel:0, kind:(/魔道具|アイテム/.test(skillName) || /魔道具|アイテム/.test(detail)) ? 'ITEM' : 'SKILL' };
            addUsage(side, meta.kind || 'SKILL', skillName, meta || {});
            return;
          }
          let parsedItem = (typeof window.__battleDigestParseItemUsageLine === 'function') ? window.__battleDigestParseItemUsageLine(line) : null;
          if (parsedItem && parsedItem.itemName){
            const actorName = _safeName(parsedItem.actorName);
            const item = _safeName(parsedItem.itemName);
            const skill = _safeName(parsedItem.skillName);
            const side = (actorName && _sideFromName(actorName))
              || ((typeof window.__battleDigestResolveItemOwnerSide === 'function') ? window.__battleDigestResolveItemOwnerSide(item, skill) : null)
              || (window.__battleDigestLastActorSide || 'enemy');
            try{ if (actorName && typeof window.__battleDigestRememberActorSide === 'function') window.__battleDigestRememberActorSide(side, actorName); }catch(_e){}
            addUsage(side, 'ITEM', item, { level:1, itemLevel:0 });
            return;
          }
          m = line.match(/^(.*?)(?:魔道具|アイテム)(.+?)(?:発動|使用|獲得|入手)/);
          if (m){
            const side = _sideFromName(m[1]) || window.__battleDigestLastActorSide || 'player';
            const item = _safeName(m[2]);
            if (!item) return;
            addUsage(side, 'ITEM', item, { level:1, itemLevel:0 });
          }
        }catch(_lineErr){}
      });
      return ['player','enemy'].some(function(side){
        try{ return !!(st.usage && st.usage[side] && Object.keys(st.usage[side]).length); }catch(_e){ return false; }
      });
    }catch(_){ return false; }
  }

  window.__battleDigestReplayFromClick = function(){
    try{
      const st = _ensureState();
      if (!st) return false;
      let hasUsage = ['player','enemy'].some(function(side){
        try{
          const bucket = st.usage && st.usage[side] ? st.usage[side] : null;
          return !!(bucket && Object.keys(bucket).length);
        }catch(_e){ return false; }
      }) || ['player','enemy'].some(function(side){
        try{
          const list = st.loopLists && st.loopLists[side];
          return Array.isArray(list) && list.length > 0;
        }catch(_e){ return false; }
      }) || _hasReplayLists(st.replaySnapshot);
      if (!hasUsage) hasUsage = _buildReplayEntriesFromBattleLog();
      if (!hasUsage && _hasReplayLists(st.replaySnapshot)){
        st.loopLists = _cloneReplayLists(st.replaySnapshot);
        hasUsage = true;
      }
      if (!hasUsage) return false;
      if (!_hasReplayLists(st.loopLists) && _hasReplayLists(st.replaySnapshot)){
        st.loopLists = _cloneReplayLists(st.replaySnapshot);
      }
      window.__battleTickerForceShow = true;
      st.finalLocked = false;
      st.replayLoopActive = true;
      try{ if (st.finalTimer){ clearTimeout(st.finalTimer); st.finalTimer = 0; } }catch(_e){}
      ['player','enemy'].forEach(function(side){
        try{
          _clearQueueTimer(side);
          const el = document.getElementById(side === 'enemy' ? 'battleTickerEnemy' : 'battleTickerPlayer');
          if (el) el.classList.remove('is-final-win','is-final-lose','is-ready','is-flash');
          const qs = st.queues && st.queues[side];
          if (qs){ qs.current = null; qs.queue = []; qs.loopIndex = 0; }
        }catch(_e){}
      });
      if (!_hasReplayLists(st.loopLists)) _replayUsageBoards();
      const started = _startReplayLoopFromLoopLists();
      if (!started && _buildReplayEntriesFromBattleLog()){
        _replayUsageBoards();
        return _startReplayLoopFromLoopLists();
      }
      return started;
    }catch(_){ return false; }
  };

  function _rewardSummary(){
    const st = _ensureState();
    if (st.itemRewards && st.itemRewards.length){
      return { title:'DROP', body:'', html:_renderRewardSummaryHtml(st.itemRewards), isGet:true };
    }
    try{
      const lines = Array.isArray(window.log) ? window.log.join('\n') : '';
      if (/(ボス報酬|クラッチ報酬|魔道具：|獲得！|入手！)/.test(lines)) return { title:'DROP', body:'通常/ボス報酬あり', isGet:true };
    }catch(_){ }
    return { title:'DROP NONE', body:'通常/ボス報酬なし', isGet:false };
  }

  window.__battleDigestReset = function(battleId){
    try{
      window.__battleTickerForceShow = false;
      _clearDigestTimers(window.__battleDigestState);
      const st = window.__battleDigestState = { battleId:Number(battleId || window.battleId || 0) || 0, itemRewards:[], usage:{player:{},enemy:{}}, loopLists:{player:[],enemy:[]}, replaySnapshot:{player:[],enemy:[]}, queues:{player:{queue:[],current:null,timer:0,loopIndex:0},enemy:{queue:[],current:null,timer:0,loopIndex:0}}, finalLocked:false, replayLoopActive:false, finalTimer:0 };
      window.__battleDigestItemOwnerMap = {};
      window.__battleDigestLastActorSide = null;
      window.__battleDigestLastActorName = '';
      window.__battleDigestLastActorAt = 0;
      window.__battleRadarResultReadyAt = 0;
      window.__battleRadarLoserFadeStartsAt = 0;
      const layer = _ensureLayer();
      if (layer) layer.innerHTML = '';
      _ensureTickerBoards();
      _ensureRewardBoard();
      _applyTickerVisibility();
      if (!_isTickerSuppressed() || window.__winnerGuessMiniGameActive){
        _setBoard('player','YOU','READY',0,{ isReady:true, tier:'none', flashMs:10 });
        _setBoard('enemy','ENEMY','READY',0,{ isReady:true, tier:'none', flashMs:10 });
      }
      const rb = document.getElementById('battleRewardBoard');
      if (rb) rb.classList.remove('show','is-item');
    }catch(_){ }
  };

  window.__setBattleRewardBoardNotice = _setRewardBoardNotice;

  window.__notifyBattleItemReward = function(info){
    try{
      const st = _ensureState();
      const itemName = _safeName(info && (info.itemName || info.label));
      const skillName = _safeName(info && info.skillName);
      const lv = Number(info && (info.level ?? info.skillLevel));
      let label = itemName || 'ITEM';
      if (skillName) label += '/' + skillName;
      if (Number.isFinite(lv) && lv > 0) label += ' Lv' + Math.floor(lv);
      st.itemRewards.push({ type:'item', label, summary:label, itemName, skillName, level:Number.isFinite(lv) ? Math.floor(lv) : null, count:1 });
      if (st.itemRewards.length > 8) st.itemRewards = st.itemRewards.slice(-8);
    }catch(_){ }
  };

  window.__notifyBattleSpecialSkillReward = function(skill){
    try{
      if (!skill) return;
      const st = _ensureState();
      const star = _safeName(skill.starRating || '');
      const rank = _safeName((skill.rarityClass || '').replace('skill-rank-','').toUpperCase() || '-');
      const lv = Math.max(1, Number(skill.level || 1) || 1);
      const prob = Math.max(0, Math.floor(Number(skill.activationProb || 0) * 100) || 0);
      const title = '高ランク特殊スキル入手';
      const summary = (skill.name || '特殊スキル') + ' Lv' + lv;
      const html = '<div class="battle-drop-detail-head">【' + _escapeHtml(star) + ' / RANK: ' + _escapeHtml(rank) + '】</div>' +
        '<div class="battle-drop-detail-main">' + _escapeHtml(skill.name || '特殊スキル') + '（Lv' + lv + '｜発動率: ' + prob + '%）</div>' +
        '<div class="battle-drop-detail-desc">詳細は、所持スキル一覧からも確認できます。</div>';
      const detailId = _registerRewardDetail({ title:title, html:html, duration:10000 });
      st.itemRewards.push({ type:'mixed-skill', label:summary, summary:'特殊スキル ' + summary, detailId, count:1 });
      if (st.itemRewards.length > 8) st.itemRewards = st.itemRewards.slice(-8);
      _setRewardBoardNotice('DROP', '', true, { html:_renderRewardSummaryHtml(st.itemRewards), compact:true, bit:true });
    }catch(_){ }
  };

  window.__battleDigestLogPush = function(rawLine){
    try{
      const line = _safeName(rawLine);
      if (!line) return;
      const st = _ensureState();
      if (st.finalLocked) return;
      const suppressed = _isTickerSuppressed() && !window.__winnerGuessMiniGameActive;

      let parsedSkill = (typeof window.__battleDigestParseSkillUsageLine === 'function') ? window.__battleDigestParseSkillUsageLine(line) : null;
      if (parsedSkill){
        const actorName = _safeName(parsedSkill.actorName);
        const skillName = _safeName(parsedSkill.skillName);
        const detail = _safeName(parsedSkill.detail);
        const side = _sideFromName(actorName);
        if (side && skillName){
          const meta = (typeof window.__lookupBattleSkillMeta === 'function')
            ? window.__lookupBattleSkillMeta(actorName, skillName, detail)
            : { level:1, itemLevel:0, kind:(/魔道具|アイテム/.test(skillName) || /魔道具|アイテム/.test(detail)) ? 'ITEM' : 'SKILL' };
          const kind = meta.kind || ((/魔道具|アイテム/.test(skillName) || /魔道具|アイテム/.test(detail)) ? 'ITEM' : 'SKILL');
          const label = (typeof window.__formatSkillDisplay === 'function')
            ? window.__formatSkillDisplay({ name: skillName, level: meta.level || 1, itemLevel: meta.itemLevel || 0 })
            : skillName;
          const key = kind + '::' + skillName;
          if (!st.usage[side][key]) st.usage[side][key] = { kind, label, count:0 };
          st.usage[side][key].count += 1;
          st.usage[side][key].label = label;
          if (!suppressed || window.__battleTickerForceShow) {
            _enqueue(side, kind, label, st.usage[side][key].count, (kind === 'ITEM' || (meta.itemLevel||0) > 0) ? 'high' : ((meta.level||1) >= 5000 ? 'mythic' : 'normal'), key);
          }
        }
        return;
      }

      let parsedItem = (typeof window.__battleDigestParseItemUsageLine === 'function') ? window.__battleDigestParseItemUsageLine(line) : null;
      if (parsedItem && parsedItem.itemName){
        const actorName = _safeName(parsedItem.actorName);
        const item = _safeName(parsedItem.itemName);
        const skill = _safeName(parsedItem.skillName);
        const side = (actorName && _sideFromName(actorName))
          || ((typeof window.__battleDigestResolveItemOwnerSide === 'function') ? window.__battleDigestResolveItemOwnerSide(item, skill) : null)
          || window.__battleDigestLastActorSide
          || 'enemy';
        const key = 'ITEM::' + item + '::' + skill;
        if (!st.usage[side][key]) st.usage[side][key] = { kind:'ITEM', label:item + '/' + skill, count:0 };
        st.usage[side][key].count += 1;
        try{ if (actorName && typeof window.__battleDigestRememberActorSide === 'function') window.__battleDigestRememberActorSide(side, actorName); }catch(_e){}
        if (!suppressed || window.__battleTickerForceShow) {
          _enqueue(side, 'ITEM', st.usage[side][key].label, st.usage[side][key].count, 'high', key);
        }
        return;
      }

      m = line.match(/^(.*?)(?:魔道具|アイテム)(.+?)(?:発動|使用|獲得|入手)/);
      if (m){
        const side = _sideFromName(m[1]) || 'player';
        const item = _safeName(m[2]);
        if (!item) return;
        const key = 'ITEM::' + item;
        if (!st.usage[side][key]) st.usage[side][key] = { kind:'ITEM', label:item, count:0 };
        st.usage[side][key].count += 1;
        if (!suppressed || window.__battleTickerForceShow) {
          _enqueue(side, 'ITEM', item, st.usage[side][key].count, 'high', key);
        }
      }
    }catch(_){ }
  };

  window.__instrumentBattleLogArray = function(arr){
    try{
      if (!arr || typeof arr.push !== 'function' || arr.__battleDigestInstrumented) return arr;
      const origPush = arr.push.bind(arr);
      arr.push = function(){
        const items = Array.prototype.slice.call(arguments);
        for (const it of items){ try{ window.__battleDigestLogPush(it); }catch(_){ } }
        return origPush.apply(arr, items);
      };
      arr.__battleDigestInstrumented = true;
      return arr;
    }catch(_){ return arr; }
  };

  window.__openBattleRewardDetail = function(detailRef){
    try{ _openRewardDetail(detailRef); }catch(_){ }
  };

  window.__openBattleRewardDetailFromInline = function(btnOrPayload){
    try{
      if (!btnOrPayload) return;
      if (typeof btnOrPayload === 'string') {
        _openRewardDetail(btnOrPayload);
        return;
      }
      const btn = btnOrPayload && btnOrPayload.nodeType === 1 ? btnOrPayload : null;
      const payload = btn && btn.getAttribute ? (btn.getAttribute('data-detail-payload') || '') : '';
      const detailId = btn && btn.getAttribute ? (btn.getAttribute('data-detail-id') || '') : '';
      _openRewardDetail(payload || detailId);
    }catch(_){ }
  };

  window.__openBattleHtmlDetail = function(payload){
    try{
      if (!payload) return;
      const detailId = _registerRewardDetail(payload);
      if (!detailId) return;
      _openRewardDetail(detailId);
    }catch(_){ }
  };

  window.__finalizeBattleDigest = function(result){
    try{
      const st = _ensureState();
      if (st.finalLocked) return;
      try{
        const hasLoopBeforeFinal = _hasReplayLists(st.loopLists);
        if (!hasLoopBeforeFinal) _buildReplayEntriesFromBattleLog();
        _snapshotReplayLists();
      }catch(_snapErr){}
      st.finalLocked = true;
      st.replayLoopActive = false;
      _stopWinnerGuessLoops();
      ['player','enemy'].forEach(_clearQueueTimer);
      if (st.finalTimer){ try{ clearTimeout(st.finalTimer); }catch(_){} st.finalTimer = 0; }
      _applyTickerVisibility();
      const playerWon = !!(result && result.playerWon);
      const tickerSuppressed = _isTickerSuppressed() && !window.__winnerGuessMiniGameActive;
      const pendingMs = tickerSuppressed ? 0 : Math.max(0,
        Number(st.queues && st.queues.player && st.queues.player.current && st.queues.player.current.holdMs || 0) || 0,
        Number(st.queues && st.queues.enemy && st.queues.enemy.current && st.queues.enemy.current.holdMs || 0) || 0
      );
      const RESULT_SETTLE_MS = tickerSuppressed ? 0 : 700;
      const nowTs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const radarReadyAt = Number(window.__battleRadarResultReadyAt || 0) || 0;
      const radarExtraWaitMs = tickerSuppressed ? 0 : Math.max(0, Math.round(radarReadyAt - nowTs));
      st.finalTimer = (window.__uiSetTimeout || window.setTimeout)(function(){
        try{
          if (!tickerSuppressed){
            _setBoard('player', 'RESULT', playerWon ? 'WIN' : 'LOSE', 0, { finalState: playerWon ? 'win' : 'lose', flashMs: 1800 });
            _setBoard('enemy', 'RESULT', playerWon ? 'LOSE' : 'WIN', 0, { finalState: playerWon ? 'lose' : 'win', flashMs: 1800 });
          }
          const rb = _ensureRewardBoard();
          const summary = _rewardSummary();
          if (rb){
            const tt = rb.querySelector('.battle-drop-title');
            const bd = rb.querySelector('.battle-drop-body');
            if (tt) tt.textContent = summary.title;
            if (bd){
              if (summary.html) bd.innerHTML = summary.html;
              else bd.textContent = summary.body;
            }
            rb.classList.remove('is-item','show','is-compact','is-bit');
            if (summary.isGet) rb.classList.add('is-item');
            rb.classList.add('show','is-compact','is-bit');
          }
        }catch(_){ }
      }, (tickerSuppressed ? 0 : FINAL_DELAY_MS) + Math.min(7000, Math.round(pendingMs * 0.22)) + RESULT_SETTLE_MS + radarExtraWaitMs);
    }catch(_){ }
  };
})();

/* battle ticker direct tap replay removed: use dedicated loop button instead */

window.addEventListener('click', function(ev){
  try{
    const btn = ev && ev.target && ev.target.closest ? ev.target.closest('.battle-drop-detail-btn[data-detail-id]') : null;
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (typeof window.__openBattleRewardDetailFromInline === 'function') {
      window.__openBattleRewardDetailFromInline(btn);
    } else if (typeof window.__openBattleRewardDetail === 'function') {
      window.__openBattleRewardDetail((btn.getAttribute('data-detail-payload') || btn.getAttribute('data-detail-id') || ''));
    }
  }catch(_){ }
}, true);

/* winner guess result visual effect */
window.showWinnerGuessEffect = function(isCorrect){
  try{
    const el = document.getElementById('winnerGuessEffect');
    if (!el) return;

    const isIPhone = /iPhone/i.test((navigator && navigator.userAgent) || '');
    const vv = (window.visualViewport && typeof window.visualViewport.height === 'number') ? window.visualViewport : null;
    const viewportH = vv ? vv.height : window.innerHeight;
    const viewportW = vv ? vv.width : window.innerWidth;
    const topPx = Math.max(56, Math.round(viewportH * (isIPhone ? 0.22 : 0.18)));
    const leftPx = Math.round((vv ? vv.offsetLeft : 0) + (viewportW / 2));

    el.className = '';
    el.textContent = isCorrect ? '的中！' : 'ハズレ…';
    el.setAttribute('aria-hidden', 'false');
    el.style.left = leftPx + 'px';
    el.style.top = topPx + 'px';
    el.style.position = 'fixed';
    el.style.transform = 'translate(-50%, 0)';
    el.style.zIndex = '2147483646';
    if (isIPhone) {
      el.style.maxWidth = 'calc(100vw - 28px)';
    } else {
      el.style.maxWidth = 'min(92vw, 540px)';
    }

    void el.offsetWidth;
    el.classList.add('show');
    el.classList.add(isCorrect ? 'correct' : 'wrong');

    try { if (el.__hideTimer) clearTimeout(el.__hideTimer); } catch(_e) {}
    el.__hideTimer = setTimeout(function(){
      try{
        el.classList.remove('show', 'correct', 'wrong');
        el.setAttribute('aria-hidden', 'true');
      }catch(_e){}
    }, 1850);
  }catch(e){}
};

/* optional event hook */
window.addEventListener("winnerGuessResult",function(e){
  try{
    if(e && typeof e.detail?.correct!=="undefined"){
      window.showWinnerGuessEffect(!!e.detail.correct);
    }
  }catch(_){ }
});
