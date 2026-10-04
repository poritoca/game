/* Presentation-only adapters. Does not mutate player data, combat or save formats. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const text=(el,value)=>{if(el&&el.textContent!==String(value))el.textContent=String(value);};
  function init(){
    const game=$('gameScreen');if(!game)return;
    const header=document.createElement('header');header.className='journey-header';
    header.innerHTML='<div class="journey-heading"><div><small>PIXEL CHRONICLE</small><h1 id="journeyName">旅の記録</h1></div><span class="journey-mark" aria-hidden="true">✦</span></div><div class="journey-metrics"><div><span>いまの連勝</span><b id="journeyStreak">0</b></div><div><span>今回の最高</span><b id="journeyBest">0</b></div><div><span>残りの戦闘</span><b id="journeyRemaining">—</b></div></div>';
    game.prepend(header);
    // Fixed dialogs must not inherit a glass panel's containing block on Safari.
    if($('winnerSlotOverlay'))document.body.appendChild($('winnerSlotOverlay'));
    // Scenery lives in a fixed sibling behind the UI, never inside a filtered panel.
    const scenery=document.createElement('div');scenery.id='worldScenery';scenery.setAttribute('aria-hidden','true');
    scenery.innerHTML='<div class="world-scene arena-scene"></div><div class="world-scene forge-scene"></div><div class="world-scene abyss-scene"></div><div class="world-scene title-scene"></div><div class="world-shade"></div>';
    document.body.prepend(scenery);
    const scenePanels=['memoryContent','abyssPanel'];
    function syncScene(){
      const playing=!game.classList.contains('hidden');
      const open=id=>{const el=$(id);return el&&!el.classList.contains('hidden')&&!el.hidden;};
      const forge=playing&&open('memoryContent');
      document.body.classList.toggle('scene-abyss',playing&&open('abyssPanel'));
      document.body.classList.toggle('scene-forge',forge);
      document.body.classList.toggle('scene-title',!playing);
    }
    const sceneObserver=new MutationObserver(syncScene);
    [game,...scenePanels.map($)].filter(Boolean).forEach(el=>sceneObserver.observe(el,{attributes:true,attributeFilter:['class','hidden']}));
    syncScene();
    const nav=game.querySelector('.top-fold-panel');
    game.prepend(nav);
    nav.setAttribute('aria-label','ゲームのタブ');
    // Match scroll offsets to the actual wrapped tab height, including landscape/safe area.
    const syncNavHeight=()=>document.documentElement.style.setProperty('--tabs-height',Math.ceil(nav.getBoundingClientRect().height)+'px');
    new ResizeObserver(syncNavHeight).observe(nav);syncNavHeight();
    nav.addEventListener('click',e=>{
      const btn=e.target.closest('.top-fold-btn[data-kind]');if(!btn)return;
      requestAnimationFrame(()=>{
        const id={char:'charInfoFold',memory:'memoryContent',abyss:'abyssPanel',log:'quickGuideLog',guide:'quickGuideContent',event:'eventSettingsContent',settings:'settingsFold'}[btn.dataset.kind];
        const panel=$(id);
        if(panel&&!panel.classList.contains('hidden'))panel.scrollIntoView({block:'start',behavior:'auto'});
      });
    });
    // One consistent navigation order: character, gear, relics, history, help, automation, save.
    ['char','memory','abyss','log','guide','event','settings'].forEach(kind=>{const el=nav.querySelector('[data-kind="'+kind+'"]');if(el)nav.appendChild(el);});
    function syncHeader(){
      text($('journeyStreak'),window.currentStreak||0);text($('journeyBest'),window.sessionMaxStreak||0);
      const remaining=window.remainingBattles;text($('journeyRemaining'),remaining===Infinity?'∞':(Number.isFinite(remaining)?remaining:'—'));
      try{if(typeof player!=='undefined'&&player?.name)text($('journeyName'),player.name);}catch(_){}
    }
    const status=$('remainingBattlesDisplay');if(status)new MutationObserver(syncHeader).observe(status,{childList:true,characterData:true,subtree:true});
    new MutationObserver(syncHeader).observe(game,{attributes:true,attributeFilter:['class']});syncHeader();
    // Stat rows retain their IDs and live source text; never replace the combat display function.
    const labels={ATK:'攻撃',DEF:'防御',SPD:'速さ',HP:'体力'};
    function decorateStats(root){
      root.querySelectorAll(':scope > p').forEach(row=>{
        if(row.id==='maxHpStat'||row.querySelector('.stat-key'))return;
        const match=row.textContent.trim().match(/^(ATK|DEF|SPD|HP):\s*(.+)$/);
        if(!match)return;
        const key=document.createElement('span');key.className='stat-key';key.textContent=labels[match[1]]+' '+match[1];
        const val=document.createElement('span');val.className='stat-value';val.textContent=match[2];row.replaceChildren(key,val);
      });
    }
    ['playerStats','enemyStats'].forEach(id=>{const root=$(id);if(!root)return;let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorateStats(root);});}).observe(root,{childList:true,subtree:true});decorateStats(root);});
    // Put player portrait/stats before optional appearance and skill controls.
    const own=$('charInfoFold')?.querySelector('details');const stats=own?.querySelector('.status-area');if(stats)own.insertBefore(stats,own.querySelector('#faceMemoryUI'));
    // Optional battle charts and mini-game settings do not compete with the main battlefield.
    const radar=$('battleRadarWrap'),hp=$('hpChart');
    if(radar&&hp){const fold=document.createElement('details');fold.className='battle-extra';fold.innerHTML='<summary>体力の推移</summary>';fold.appendChild(hp);radar.after(fold);}
    const guess=$('winnerGuessToggleDock');if(guess){const fold=document.createElement('details');fold.className='battle-options';fold.innerHTML='<summary>勝者予想ミニゲーム</summary>';guess.before(fold);fold.appendChild(guess);}
    // Further help is explicit; never hide destructive exchange semantics behind a tooltip.
    const desc=document.querySelector('.skill-exchange-desc');if(desc)desc.textContent='未装備の通常スキル2つを完全に失い、未修得の1つを習得。失うスキルのLvも消去。';
    if($('ownedFaceList')&&$('firstRerollPanel'))$('ownedFaceList').after($('firstRerollPanel'));
    const nameInput=$('inputStr');nameInput?.setAttribute('aria-label','戦士の名前');
    $('battleCountSelect')?.setAttribute('aria-label','旅の長さ・戦闘回数');$('timeLimitSelect')?.setAttribute('aria-label','制限時間');$('battleCountSelectB')?.setAttribute('aria-label','再開後の戦闘回数');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
