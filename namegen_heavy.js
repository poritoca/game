/* =========================================================
   Heavy Enemy Name Generator (Kana-like)
   - Generates natural-ish Katakana names using mora-based rules.
   - Supports: small kana (ャュョァィゥェォ), long vowel mark (ー), ッ, ン.
   - Provides:
       window.__initEnemyNamePool(targetCount, opts)
       window.__takeEnemyName()
       window.__assignEnemyDisplayName(internalName)
       window.__resetEnemyNamePool()
   - Design goals:
       * Looks "name-like" (JP game-y)
       * Avoids obviously illegal sequences
       * Chunked generation with optional loading overlay + progress
   ========================================================= */
(function(){
  'use strict';

  // ---------------------------------------------------------
  // Global state
  // ---------------------------------------------------------
  const G = (typeof window !== 'undefined') ? window : globalThis;

  G.__enemyNamePool = G.__enemyNamePool || [];
  G.__enemyNameCursor = G.__enemyNameCursor || 0;
  // Use Map if available; fallback to plain object.
  G.__enemyNameMap = G.__enemyNameMap || (typeof Map !== 'undefined' ? new Map() : Object.create(null));

  // ---------------------------------------------------------
  // Utility: weighted choice
  // ---------------------------------------------------------
  function weightedPick(items){
    // items: [{v, w}]
    let total = 0;
    for (let i=0;i<items.length;i++) total += (items[i].w || 0);
    let r = Math.random() * total;
    for (let i=0;i<items.length;i++){
      r -= (items[i].w || 0);
      if (r <= 0) return items[i].v;
    }
    return items[items.length-1].v;
  }

  function randInt(n){
    return Math.floor(Math.random() * n);
  }

  // ---------------------------------------------------------
  // Mora tables
  // ---------------------------------------------------------
  const MORAS_CORE = [
    // V
    'ア','イ','ウ','エ','オ',
    // K
    'カ','キ','ク','ケ','コ',
    // S
    'サ','シ','ス','セ','ソ',
    // T
    'タ','チ','ツ','テ','ト',
    // N
    'ナ','ニ','ヌ','ネ','ノ',
    // H
    'ハ','ヒ','フ','ヘ','ホ',
    // M
    'マ','ミ','ム','メ','モ',
    // Y
    'ヤ','ユ','ヨ',
    // R
    'ラ','リ','ル','レ','ロ',
    // W (avoid overusing)
    'ワ','ヲ'
  ];

  const MORAS_DAKUON = [
    'ガ','ギ','グ','ゲ','ゴ',
    'ザ','ジ','ズ','ゼ','ゾ',
    'ダ','ヂ','ヅ','デ','ド',
    'バ','ビ','ブ','ベ','ボ',
    'パ','ピ','プ','ペ','ポ',
    'ヴ'
  ];

  // Palatalized (small ya/yu/yo)
  const MORAS_PAL = [
    'キャ','キュ','キョ',
    'シャ','シュ','ショ',
    'チャ','チュ','チョ',
    'ニャ','ニュ','ニョ',
    'ヒャ','ヒュ','ヒョ',
    'ミャ','ミュ','ミョ',
    'リャ','リュ','リョ',
    'ギャ','ギュ','ギョ',
    'ジャ','ジュ','ジョ',
    'ビャ','ビュ','ビョ',
    'ピャ','ピュ','ピョ'
  ];

  // Foreign-ish combos (small vowels)
  const MORAS_FOREIGN = [
    'ティ','ディ','トゥ','ドゥ',
    'ファ','フィ','フェ','フォ',
    'フャ','フュ','フョ',
    'ウィ','ウェ','ウォ',
    'ツァ','ツィ','ツェ','ツォ',
    'シェ','チェ','ジェ',
    'テュ','デュ',
    'ヴァ','ヴィ','ヴェ','ヴォ','ヴュ'
  ];

  // For sokuon (ッ) allowed following mora starts (roughly K/S/T/P + some foreign)
  function canFollowSokuon(mora){
    if (!mora) return false;
    const c = mora[0];
    // Includes: カ行 サ行 タ行 パ行 + フ/ファ系 + チャ/チュ/チョ etc.
    return (
      c === 'カ' || c === 'キ' || c === 'ク' || c === 'ケ' || c === 'コ' ||
      c === 'サ' || c === 'シ' || c === 'ス' || c === 'セ' || c === 'ソ' ||
      c === 'タ' || c === 'チ' || c === 'ツ' || c === 'テ' || c === 'ト' ||
      c === 'パ' || c === 'ピ' || c === 'プ' || c === 'ペ' || c === 'ポ' ||
      c === 'フ' || c === 'ファ' || c === 'フィ' || c === 'フェ' || c === 'フォ'
    );
  }

  // ---------------------------------------------------------
  // Vowel helpers (approx)
  // ---------------------------------------------------------
  const VOWEL_A = new Set(['ア','ァ','カ','ガ','サ','ザ','タ','ダ','ナ','ハ','バ','パ','マ','ヤ','ラ','ワ','ャ','ファ','ヴァ','ツァ','シャ','チャ','ジャ','キャ','ギャ','ニャ','ヒャ','ミャ','リャ','ビャ','ピャ','フャ']);
  const VOWEL_I = new Set(['イ','ィ','キ','ギ','シ','ジ','チ','ヂ','ニ','ヒ','ビ','ピ','ミ','リ','ウィ','ティ','ディ','ツィ','シェ','チェ','ジェ','キャ','ギャ','ニャ','ヒャ','ミャ','リャ','ビャ','ピャ','キュ','ギュ','シュ','ジュ','チュ','ニュ','ヒュ','ミュ','リュ','ビュ','ピュ']);
  const VOWEL_U = new Set(['ウ','ゥ','ク','グ','ス','ズ','ツ','ヅ','ヌ','フ','ブ','プ','ム','ユ','ル','ヴ','トゥ','ドゥ','ヴュ','キュ','ギュ','シュ','ジュ','チュ','ニュ','ヒュ','ミュ','リュ','ビュ','ピュ','フュ']);
  const VOWEL_E = new Set(['エ','ェ','ケ','ゲ','セ','ゼ','テ','デ','ネ','ヘ','ベ','ペ','メ','レ','ウェ','フェ','ヴェ','ツェ','シェ','チェ','ジェ']);
  const VOWEL_O = new Set(['オ','ォ','コ','ゴ','ソ','ゾ','ト','ド','ノ','ホ','ボ','ポ','モ','ヨ','ロ','ヲ','ウォ','フォ','ヴォ','ツォ','ショ','チョ','ジョ','キョ','ギョ','ニョ','ヒョ','ミョ','リョ','ビョ','ピョ','フョ']);

  function moraVowel(mora){
    if (!mora) return '';
    // Normalize: take whole mora string as key for combos
    if (VOWEL_A.has(mora)) return 'a';
    if (VOWEL_I.has(mora)) return 'i';
    if (VOWEL_U.has(mora)) return 'u';
    if (VOWEL_E.has(mora)) return 'e';
    if (VOWEL_O.has(mora)) return 'o';
    // Fallback by last char
    const last = mora[mora.length-1];
    if ('アァ'.includes(last)) return 'a';
    if ('イィ'.includes(last)) return 'i';
    if ('ウゥ'.includes(last)) return 'u';
    if ('エェ'.includes(last)) return 'e';
    if ('オォ'.includes(last)) return 'o';
    if ('ャ'.includes(last)) return 'a';
    if ('ュ'.includes(last)) return 'u';
    if ('ョ'.includes(last)) return 'o';
    return '';
  }

  function isStandaloneVowelMora(mora){
    return mora === 'ア' || mora === 'イ' || mora === 'ウ' || mora === 'エ' || mora === 'オ';
  }

  // ---------------------------------------------------------
  // Pick mora with style preferences
  // ---------------------------------------------------------
  function pickMora(pos, prevMora, stats){
    // pos: 0..(moraCount-1)
    // stats: {dakuCount, vowelRun}
    const isFirst = pos === 0;

    // Build candidates with weights
    const items = [];

    // Base core, but downweight weird starters
    for (let i=0;i<MORAS_CORE.length;i++){
      const m = MORAS_CORE[i];
      let w = 10;
      if (m === 'ヲ') w = 1;
      if (m === 'ワ') w = 2;
      // Standalone vowels are ok but not too common, especially not first-only.
      if (isStandaloneVowelMora(m)) w = isFirst ? 2 : 3;
      items.push({v:m, w});
    }

    // Add dakuten, but limit count
    if ((stats.dakuCount || 0) < 2){
      for (let i=0;i<MORAS_DAKUON.length;i++){
        const m = MORAS_DAKUON[i];
        let w = 4;
        if (m === 'ヂ' || m === 'ヅ') w = 1;
        if (m === 'ヴ') w = 1;
        items.push({v:m, w});
      }
    }

    // Palatalized: very name-y
    for (let i=0;i<MORAS_PAL.length;i++){
      items.push({v:MORAS_PAL[i], w: 6});
    }

    // Foreign-ish: spice, but rare
    for (let i=0;i<MORAS_FOREIGN.length;i++){
      items.push({v:MORAS_FOREIGN[i], w: 2});
    }

    // Constraints:
    // - First mora must not start with 'ン','ッ','ー' or small kana (handled elsewhere)
    // - Avoid too long vowel runs (same vowel 3+)
    // - Avoid repeating same mora 2x in a row too often
    let tries = 0;
    while (tries++ < 40){
      const m = weightedPick(items);

      // First mora restrictions
      if (isFirst){
        const firstChar = m[0];
        if (firstChar === 'ン' || firstChar === 'ッ' || firstChar === 'ー') continue;
        if ('ァィゥェォャュョ'.includes(firstChar)) continue;
      }

      // Avoid repeated mora
      if (prevMora && m === prevMora) {
        if (Math.random() < 0.85) continue;
      }

      // Vowel run check
      const v = moraVowel(m);
      if (prevMora){
        const pv = moraVowel(prevMora);
        if (pv && v && pv === v){
          if ((stats.vowelRun || 1) >= 2 && Math.random() < 0.95) continue;
        }
      }

      return m;
    }

    // Fallback: simple pick
    return MORAS_CORE[randInt(MORAS_CORE.length)];
  }

  // ---------------------------------------------------------
  // Compose a name (mora-based)
  // ---------------------------------------------------------
  function composeName(){
    // Mora count distribution (2..5)
    const moraCount = weightedPick([
      {v:2, w: 10},
      {v:3, w: 45},
      {v:4, w: 35},
      {v:5, w: 10}
    ]);

    const moras = [];
    const stats = { dakuCount: 0, vowelRun: 1 };

    for (let i=0;i<moraCount;i++){
      const prev = moras.length ? moras[moras.length-1] : '';
      const m = pickMora(i, prev, stats);
      moras.push(m);

      // update stats
      if ('ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポヴ'.includes(m[0])) stats.dakuCount++;
      const v = moraVowel(m);
      if (prev){
        const pv = moraVowel(prev);
        if (pv && v && pv === v) stats.vowelRun = Math.min(3, (stats.vowelRun || 1) + 1);
        else stats.vowelRun = 1;
      }

      // Optional sokuon insertion BEFORE some moras (not first)
      if (i > 0 && i < moraCount-1 && Math.random() < 0.12){
        const next = pickMora(i+1, m, stats);
        if (canFollowSokuon(next)) {
          moras.push('ッ');
          moras.push(next);
          i++; // consumed extra mora position
        }
      }

      // Optional long vowel mark after a mora (not last)
      if (i < moraCount-1 && Math.random() < 0.10){
        // Avoid 'ー' after standalone vowel too frequently
        if (!isStandaloneVowelMora(m) || Math.random() < 0.35) {
          moras.push('ー');
        }
      }
    }

    // Optional 'ン' near end (not first)
    if (moras.length >= 2 && Math.random() < 0.22){
      const tail = moras[moras.length-1];
      // don't place after sokuon or long vowel mark
      if (tail !== 'ッ' && tail !== 'ー') {
        // 70% end, 30% before end
        if (Math.random() < 0.70) moras.push('ン');
        else moras.splice(Math.max(1, moras.length-1), 0, 'ン');
      }
    }

    // Join
    return moras.join('');
  }

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------
  const BAD_HEAD = /^(ン|ッ|ー|[ァィゥェォャュョ])/;
  const BAD_TAIL = /(ッ|ー|[ァィゥェォャュョ])$/;

  function validateName(s){
    if (!s || typeof s !== 'string') return false;
    if (s.length < 2) return false;
    if (BAD_HEAD.test(s)) return false;
    if (BAD_TAIL.test(s)) return false;
    if (s.includes('ーー')) return false;
    if (s.includes('ッッ')) return false;
    // sokuon must be followed by valid start
    for (let i=0;i<s.length-1;i++){
      if (s[i] === 'ッ'){
        const next = s.slice(i+1, i+3); // could be 2-char mora
        const next1 = s[i+1];
        // use next1 as fallback
        if (!canFollowSokuon(next) && !canFollowSokuon(next1)) return false;
      }
    }
    // avoid too many standalone vowels
    let vowelOnly = true;
    for (let i=0;i<s.length;i++){
      const ch = s[i];
      if (!'アイウエオァィゥェォー'.includes(ch)) { vowelOnly = false; break; }
    }
    if (vowelOnly) return false;
    // avoid triple same char
    for (let i=0;i<s.length-2;i++){
      if (s[i] === s[i+1] && s[i+1] === s[i+2]) return false;
    }
    return true;
  }

  function generateOneName(){
    for (let t=0;t<120;t++){
      const s = composeName();
      if (validateName(s)) return s;
    }
    // last resort
    return 'カナ';
  }

  // ---------------------------------------------------------
  // Loading overlay UI (optional)
  // ---------------------------------------------------------
  function ensureOverlay(){
    if (typeof document === 'undefined') return null;
    let el = document.getElementById('enemyNameLoadingOverlay');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'enemyNameLoadingOverlay';
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = '99999';
    el.style.display = 'none';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.background = 'rgba(0,0,0,0.55)';
    el.style.backdropFilter = 'blur(10px) saturate(120%)';
    el.style.webkitBackdropFilter = 'blur(10px) saturate(120%)';

    const panel = document.createElement('div');
    panel.style.width = 'min(420px, 86vw)';
    panel.style.padding = '18px 16px';
    panel.style.borderRadius = '16px';
    panel.style.border = '1px solid rgba(255,255,255,0.14)';
    panel.style.background = 'rgba(18,18,22,0.72)';
    panel.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
    panel.style.color = 'rgba(255,255,255,0.92)';
    panel.style.fontFamily = 'system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

    const title = document.createElement('div');
    title.textContent = '名前生成中…';
    title.style.fontSize = '16px';
    title.style.fontWeight = '700';
    title.style.letterSpacing = '0.08em';
    title.style.marginBottom = '10px';

    const sub = document.createElement('div');
    sub.id = 'enemyNameLoadingSub';
    sub.textContent = '敵キャラクター名を準備しています';
    sub.style.fontSize = '12px';
    sub.style.opacity = '0.85';
    sub.style.marginBottom = '12px';

    const barWrap = document.createElement('div');
    barWrap.style.height = '10px';
    barWrap.style.borderRadius = '999px';
    barWrap.style.background = 'rgba(255,255,255,0.10)';
    barWrap.style.overflow = 'hidden';

    const bar = document.createElement('div');
    bar.id = 'enemyNameLoadingBar';
    bar.style.height = '100%';
    bar.style.width = '0%';
    bar.style.background = 'linear-gradient(90deg, rgba(140,220,255,0.95), rgba(255,210,120,0.95))';
    bar.style.boxShadow = '0 0 14px rgba(140,220,255,0.35)';

    barWrap.appendChild(bar);

    const pct = document.createElement('div');
    pct.id = 'enemyNameLoadingPct';
    pct.textContent = '0%';
    pct.style.marginTop = '10px';
    pct.style.fontSize = '12px';
    pct.style.opacity = '0.9';

    panel.appendChild(title);
    panel.appendChild(sub);
    panel.appendChild(barWrap);
    panel.appendChild(pct);
    el.appendChild(panel);
    document.body.appendChild(el);
    return el;
  }

  function showOverlay(){
    const el = ensureOverlay();
    if (!el) return;
    el.style.display = 'flex';
    updateOverlay(0, 1);
  }

  function hideOverlay(){
    if (typeof document === 'undefined') return;
    const el = document.getElementById('enemyNameLoadingOverlay');
    if (!el) return;
    el.style.display = 'none';
  }

  function updateOverlay(done, total){
    if (typeof document === 'undefined') return;
    const bar = document.getElementById('enemyNameLoadingBar');
    const pct = document.getElementById('enemyNameLoadingPct');
    if (!bar || !pct) return;
    const p = Math.max(0, Math.min(1, total ? (done / total) : 0));
    const per = Math.floor(p * 100);
    bar.style.width = per + '%';
    pct.textContent = per + '%  (' + done + '/' + total + ')';
  }

  // ---------------------------------------------------------
  // Pool APIs
  // ---------------------------------------------------------
  G.__resetEnemyNamePool = function(){
    G.__enemyNamePool = [];
    G.__enemyNameCursor = 0;
    if (G.__enemyNameMap){
      if (typeof G.__enemyNameMap.clear === 'function') G.__enemyNameMap.clear();
      else {
        // plain object
        for (const k in G.__enemyNameMap) { if (Object.prototype.hasOwnProperty.call(G.__enemyNameMap, k)) delete G.__enemyNameMap[k]; }
      }
    }
  };

  function poolRemaining(){
    return Math.max(0, (G.__enemyNamePool.length || 0) - (G.__enemyNameCursor || 0));
  }

  G.__takeEnemyName = function(){
    if (!Array.isArray(G.__enemyNamePool)) G.__enemyNamePool = [];
    if (typeof G.__enemyNameCursor !== 'number') G.__enemyNameCursor = 0;

    if (G.__enemyNameCursor >= G.__enemyNamePool.length){
      // Generate a small chunk synchronously as fallback to avoid undefined.
      const need = 120;
      const set = new Set(G.__enemyNamePool);
      for (let i=0;i<need;i++){
        let s = '';
        for (let t=0;t<60;t++){
          s = generateOneName();
          if (!set.has(s)) break;
        }
        set.add(s);
        G.__enemyNamePool.push(s);
      }
    }
    const s = G.__enemyNamePool[G.__enemyNameCursor];
    G.__enemyNameCursor++;
    return s || 'カナ';
  };

  G.__assignEnemyDisplayName = function(internalName){
    if (typeof internalName !== 'string') return '？？？';
    if (!internalName.startsWith('敵')) return internalName;

    const map = G.__enemyNameMap;
    if (map && typeof map.get === 'function'){
      const hit = map.get(internalName);
      if (hit) return hit;
      const nm = G.__takeEnemyName();
      map.set(internalName, nm);
      return nm;
    }
    // object fallback
    if (map && map[internalName]) return map[internalName];
    const nm = G.__takeEnemyName();
    if (map) map[internalName] = nm;
    return nm;
  };

  G.__initEnemyNamePool = function(targetCount, opts){
    opts = opts || {};
    const target = Math.max(0, Math.floor(Number(targetCount) || 0));
    if (!Array.isArray(G.__enemyNamePool)) G.__enemyNamePool = [];
    if (typeof G.__enemyNameCursor !== 'number') G.__enemyNameCursor = 0;

    const needTotal = Math.max(0, target - G.__enemyNamePool.length);
    if (needTotal <= 0) return Promise.resolve(true);

    const show = !!opts.showOverlay;
    const chunk = Math.max(10, Math.floor(opts.chunkSize || 60));
    const unique = (opts.unique !== false);
    const done0 = G.__enemyNamePool.length;

    let created = 0;
    const used = unique ? new Set(G.__enemyNamePool) : null;

    if (show) showOverlay();

    return new Promise((resolve) => {
      function step(){
        const start = Date.now();
        let local = 0;
        while (created < needTotal && local < chunk){
          let s = '';
          if (unique){
            for (let t=0;t<90;t++){
              s = generateOneName();
              if (!used.has(s)) break;
            }
            used.add(s);
          } else {
            s = generateOneName();
          }
          G.__enemyNamePool.push(s);
          created++;
          local++;
          // Time-slicing guard (avoid long frames)
          if ((Date.now() - start) > 12) break;
        }
        updateOverlay(done0 + created, done0 + needTotal);
        if (created >= needTotal){
          if (show) {
            updateOverlay(done0 + created, done0 + needTotal);
            setTimeout(() => { hideOverlay(); resolve(true); }, 120);
          } else {
            resolve(true);
          }
          return;
        }
        setTimeout(step, 0);
      }
      setTimeout(step, 0);
    });
  };

})();
