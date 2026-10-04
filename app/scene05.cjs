const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await webkit.launch();
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765');await page.waitForTimeout(700);
 await page.locator('#titleImage img').evaluate(img=>img.decode());
 await page.screenshot({path:'tests/scene05-title.png'});
 assert.ok(await page.locator('#titleImage img').getAttribute('src').then(s=>s.endsWith('obsidian-knight.png')));
 await page.evaluate(()=>startNewGame('黒曜の騎士'));await page.waitForTimeout(900);
 await page.evaluate(()=>{window.__firstRerollSelectionPhase=false;window.__applyFirstFaceSelectingClass();window.allowGrowthEvent=false;window.winnerGuessMiniGameEnabled=false;closeAllTopTabs();});
 for(const tab of ['memory','abyss','char']){
  await page.evaluate(k=>{closeAllTopTabs();toggleTopFold(k)},tab);await page.waitForTimeout(450);
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('scene-forge')),tab==='memory');
 }
 await page.evaluate(()=>{closeAllTopTabs();toggleTopFold('abyss');const s=Abyss.state();for(let i=0;i<4;i++)AbyssEngine.acquire(s,AbyssEngine.rollRelic(s,{tier:10,rarity:i}));closeAllTopTabs();toggleTopFold('abyss');});
 await page.locator('#abyssPanel').scrollIntoViewIfNeeded();await page.waitForTimeout(450);
 await page.screenshot({path:'tests/scene05-forge.png'});
 await page.evaluate(()=>{closeAllTopTabs();window.scrollTo(0,0)});await page.waitForTimeout(450);
 await page.screenshot({path:'tests/scene05-arena.png'});
 assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('scene-forge')),false);
 // Isolate gesture dispatch from random battle interruptions; real battles are covered by redesign03.
 await page.evaluate(()=>{window.__testBattleCalls=0;window.startBattle=()=>window.__testBattleCalls++;});
 const btn=page.locator('#startBattleBtn');await btn.scrollIntoViewIfNeeded();
 assert.deepEqual(await btn.evaluate(el=>({select:getComputedStyle(el).webkitUserSelect,action:getComputedStyle(el).touchAction})),{select:'none',action:'none'});
 assert.equal(await btn.evaluate(el=>['contextmenu','selectstart','dragstart'].every(type=>!el.dispatchEvent(new Event(type,{cancelable:true,bubbles:true})))),true);
 await btn.tap();await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__testBattleCalls),1,'single touch tap starts one battle');
 let box=await btn.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(650);
 const during=await page.evaluate(()=>window.__testBattleCalls);assert.ok(during>=3,'hold repeats');
 await page.mouse.up();const released=await page.evaluate(()=>window.__testBattleCalls);await page.waitForTimeout(750);
 assert.equal(await page.evaluate(()=>window.__testBattleCalls),released,'release stops without extra click');
 await btn.tap();await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__testBattleCalls),released+1,'tap still works after hold');
 await btn.dispatchEvent('pointerdown',{pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true});await page.waitForTimeout(420);
 await btn.dispatchEvent('pointercancel',{pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true});
 const cancelled=await page.evaluate(()=>window.__testBattleCalls);await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>window.__testBattleCalls),cancelled);
 await btn.dispatchEvent('pointerdown',{pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true});await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(450);
 assert.equal(await page.evaluate(()=>window.__testBattleCalls),cancelled,'blur cancels pending hold');
 assert.deepEqual(errors,[]);
 const result={passed:true,engine:'WebKit',sceneSwitch:true,titlePNG:true,tap:true,hold:true,release:true,cancel:true,blur:true,nativeSelectionPrevented:true,errors,limitation:'Native iPhone Safari loupe must be checked on a physical device.'};
 fs.writeFileSync('scene05-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
