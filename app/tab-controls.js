/* All top tabs share one visibility source; the same dock supports normal/follow modes. */
(function(){
  'use strict';
  const ids=['quickGuideContent','charInfoFold','quickGuideLog','memoryContent','eventSettingsContent','settingsFold','abyssPanel'];
  const kinds=['guide','char','log','memory','event','settings','abyss'];
  let scheduled=false;
  function isOpen(el){return !!el&&!el.classList.contains('hidden')&&!el.hidden;}
  window.closeAllTopTabs=function(){
    ids.forEach(id=>document.getElementById(id)?.classList.add('hidden'));
    window.Abyss?.onTabClose();window.__syncTopFoldButtons?.(null,false);sync();
  };
  function sync(){
    const game=document.getElementById('gameScreen');
    const active=ids.findIndex(id=>isOpen(document.getElementById(id)));
    const show=active>=0&&game&&!game.classList.contains('hidden');
    document.body.classList.toggle('abyss-tab-open',!!show&&active===6);
    const dock=document.querySelector('#battleOverlayDock .dockContent');
    if(dock){
      let btn=document.getElementById('closeOpenTabBtn');
      if(!btn){btn=document.createElement('button');btn.type='button';btn.id='closeOpenTabBtn';btn.dataset.edgeIcon='×';btn.dataset.edgeLabel='閉じる';btn.title='開いているタブを閉じる';btn.setAttribute('aria-label',btn.title);btn.textContent=btn.title;btn.addEventListener('pointerdown',e=>e.stopPropagation());btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.closeAllTopTabs();});dock.appendChild(btn);}
      if(btn.hidden===!!show)btn.hidden=!show;
    }
    document.querySelectorAll('.top-fold-btn[data-kind]').forEach(btn=>{const on=show&&btn.dataset.kind===kinds[active];if(btn.classList.contains('is-open')!==on)btn.classList.toggle('is-open',on);btn.setAttribute('aria-expanded',String(on));});
    if(!isOpen(document.getElementById('abyssPanel')))window.Abyss?.onTabClose();
  }
  window.syncCloseTabButtons=sync;
  function queue(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;sync();});}
  function init(){
    const observer=new MutationObserver(queue);
    ids.concat('gameScreen').forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:['class','hidden']});});
    // Dock creation is deferred in legacy startup. Body children only: no per-frame subtree scan.
    observer.observe(document.body,{childList:true});sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
