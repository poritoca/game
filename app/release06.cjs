const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await webkit.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[],failed=[],dialogs=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url())});p.on('dialog',d=>{dialogs.push(d.message());d.accept()});
 await p.goto('http://127.0.0.1:8765');await p.waitForTimeout(500);
 assert.equal(await p.locator('.title-tagline').count(),0);
 assert.equal(await p.locator('body').evaluate(el=>el.classList.contains('scene-title')),true);
 assert.ok(await p.locator('.title-scene').evaluate(el=>getComputedStyle(el).backgroundImage.includes('title-blue-flame.png')));
 await p.screenshot({path:'tests/release06-title.png'});
 await p.locator('#startNewMenuBtn').tap();await p.locator('#inputStr').fill('青炎の騎士');await p.locator('#startNewGameBtn').tap();
 await p.locator('#faceGachaBtn').waitFor({state:'visible'});await p.waitForTimeout(700);
 for(let i=0;i<2;i++){
  await p.locator('#faceGachaBtn').tap();await p.waitForTimeout(500);await p.waitForFunction(()=>!window.__faceGachaBusy&&window.faceItemsOwned.length===1);
  assert.equal(await p.locator('#faceRevealOverlay').count(),0);assert.equal(await p.locator('#gachaAnimation:visible').count(),0);
 }
 const before=await p.evaluate(()=>({remaining:window.remainingBattles,face:window.faceItemsOwned.at(-1),bonus:JSON.stringify(window.faceItemBonusMap[window.faceItemsOwned.at(-1)])}));
 await p.locator('#firstRerollConfirmBtn').tap();await p.waitForTimeout(1200);
 assert.equal(await p.evaluate(()=>window.__firstRerollSelectionPhase),false);
 assert.equal(await p.evaluate(()=>window.remainingBattles),before.remaining,'no surprise first battle');
 assert.equal(await p.evaluate(()=>window.faceItemEquipped),before.face);
 assert.equal(await p.evaluate(()=>JSON.stringify(window.faceItemBonusMap[window.faceItemEquipped])),before.bonus);
 assert.equal(await p.locator('#charInfoFold').isVisible(),false);
 assert.equal(await p.locator('#eventPopup:visible,#faceRevealOverlay:visible,#gachaAnimation:visible,#winnerSlotOverlay:visible,#battleRewardDetailOverlay:visible').count(),0);
 assert.equal(await p.locator('#faceOverlay').evaluate(el=>el.complete&&el.naturalWidth>0),true,'legacy save key resolves to root SVG');
 await p.screenshot({path:'tests/release06-ready.png'});
 for(const mode of [false,true]){
  await p.evaluate(v=>__setBattleDockEdgeFollowMode(v),mode);
  for(const width of [320,390,844]){
   await p.setViewportSize({width,height:width===844?390:844});
   await p.evaluate(()=>{closeAllTopTabs();toggleTopFold('guide');document.querySelector('.guide-reference').open=true;window.scrollTo(0,1000)});await p.waitForTimeout(250);
   const nav=await p.locator('.top-fold-panel').boundingBox();assert.ok(Math.abs(nav.y)<2,'sticky tabs '+mode+' '+width+' y='+nav.y);
   const buttons=await p.locator('.top-fold-btn').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {id:el.id,l:r.left,r:r.right,h:el.clientHeight,sh:el.scrollHeight,w:el.clientWidth,sw:el.scrollWidth}}));
   assert.ok(buttons.every(x=>x.l>=0&&x.r<=width+1&&x.sh<=x.h+3&&x.sw<=x.w+3),'tabs fit '+JSON.stringify(buttons));
   await p.locator('#abyssOpen').tap();await p.waitForTimeout(400);
   assert.equal(await p.locator('#abyssPanel').isVisible(),true);assert.equal(await p.locator('body').evaluate(el=>el.classList.contains('scene-abyss')),true);
   await p.locator('#closeOpenTabBtn').tap();assert.equal(await p.locator('#abyssPanel').isVisible(),false);
  }
 }
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{closeAllTopTabs();toggleTopFold('abyss')});await p.locator('#abyssPanel').scrollIntoViewIfNeeded();await p.waitForTimeout(450);await p.screenshot({path:'tests/release06-vault.png'});
 await p.evaluate(()=>{closeAllTopTabs();toggleTopFold('memory')});await p.waitForTimeout(100);assert.equal(await p.locator('body').evaluate(el=>el.classList.contains('scene-forge')),true);
 await p.evaluate(()=>{closeAllTopTabs();window.allowGrowthEvent=false;window.winnerGuessMiniGameEnabled=false});
 await p.locator('#startBattleBtn').tap();await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>window.remainingBattles),before.remaining-1);
 await p.evaluate(async()=>{await saveProgressToLocalStorage()});
 await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>loadProgressFromLocalStorage());await p.waitForTimeout(800);
 assert.equal(await p.evaluate(()=>window.faceItemEquipped),before.face,'saved legacy face key retained');
 assert.equal(await p.evaluate(()=>JSON.stringify(window.faceItemBonusMap[window.faceItemEquipped])),before.bonus,'saved bonuses unchanged');
 assert.equal(await p.locator('#faceOverlay').evaluate(el=>el.complete&&el.naturalWidth>0),true);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const result={passed:true,initialRerollNoOverlay:true,confirmationNoAutoBattle:true,equippedBonusPreserved:true,saveReload:true,flatAssetRequests:true,stickyTabs:{modes:2,widths:[320,390,844]},scenes:true,realTapBattle:true,errors,failed};
 fs.writeFileSync('tests/release06-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
