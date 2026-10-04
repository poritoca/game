const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const b=await webkit.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());await p.goto('http://127.0.0.1:8765');await p.waitForTimeout(700);await p.evaluate(()=>startNewGame('新遺産テスト'));await p.waitForTimeout(900);
await p.evaluate(()=>{window.__firstRerollSelectionPhase=false;window.__applyFirstFaceSelectingClass();window.allowGrowthEvent=false;window.allowSkillDeleteEvent=false;window.winnerGuessMiniGameEnabled=false;closeAllTopTabs();const s=Abyss.state();s.dust=10000;for(let i=0;i<18;i++)AbyssEngine.acquire(s,AbyssEngine.rollRelic(s,{tier:10,rarity:i%4}));});
assert.equal(await p.locator('#abyssOpen').evaluate(el=>el.parentElement.className),'top-fold-panel');
for(const mode of [false,true]){
 await p.evaluate(mode=>__setBattleDockEdgeFollowMode(mode),mode);await p.waitForTimeout(250);
 for(const kind of ['guide','char','log','memory','event','settings','abyss']){
  await p.evaluate(k=>toggleTopFold(k),kind);await p.waitForTimeout(80);
  assert.equal(await p.locator('#closeOpenTabBtn').isVisible(),true,kind+' close shown');
  await p.locator('#closeOpenTabBtn').click();await p.waitForTimeout(80);assert.equal(await p.locator('#closeOpenTabBtn').isVisible(),false,kind+' close hidden');
 }
}
await p.locator('#abyssOpen').click();assert.equal(await p.locator('#abyssPanel').isVisible(),true);assert.equal(await p.locator('#abyssPanel').getAttribute('role'),null);
await p.evaluate(()=>toggleTopFold('char'));assert.equal(await p.locator('#abyssPanel').isVisible(),false);await p.locator('#abyssOpen').click();assert.equal(await p.locator('#charInfoFold').isVisible(),false);
const overflow=[];
for(const width of [320,375,390,430,844]){await p.setViewportSize({width,height:844});for(const tab of ['relics','expedition','research','codex']){await p.locator('#abyssTabs [data-tab="'+tab+'"]').click();await p.waitForTimeout(50);
if(tab==='relics')await p.locator('.ab-loot').first().click();if(tab==='codex')await p.locator('#abyssBody summary').first().click();
const bad=await p.evaluate(()=>[...document.querySelectorAll('#abyssPanel button,#abyssPanel input,#abyssPanel select,#abyssPanel table,#closeOpenTabBtn')].filter(el=>el.getClientRects().length).filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+2||r.left< -2||el.scrollWidth>el.clientWidth+3||el.scrollHeight>el.clientHeight+3;}).map(el=>({text:el.textContent.slice(0,40),id:el.id,w:el.clientWidth,sw:el.scrollWidth,h:el.clientHeight,sh:el.scrollHeight})));if(bad.length)overflow.push({width,tab,bad});}}
console.log('overflow',JSON.stringify(overflow));assert.deepEqual(overflow,[]);
await p.setViewportSize({width:390,height:844});await p.locator('#abyssTabs [data-tab="relics"]').click();await p.locator('#abyssPanel').scrollIntoViewIfNeeded();await p.waitForTimeout(400);await p.screenshot({path:'tests/release02-relics.png'});
if(!await p.locator('[data-action="enhance"]').count())await p.locator('.ab-loot').first().click();await p.locator('[data-action="enhance"]').click();await p.locator('[data-action="reroll"]').first().click();await p.locator('[data-action="accept"]').click();
const before=await p.evaluate(()=>JSON.parse(JSON.stringify(player.abyss)));await p.locator('[data-action="save"]').click();await p.waitForFunction(()=>document.getElementById('abyssMessage').textContent.includes('保存しました'));await p.reload();await p.waitForTimeout(700);await p.evaluate(()=>loadProgressFromLocalStorage());await p.waitForTimeout(800);assert.deepEqual(await p.evaluate(()=>AbyssEngine.normalize(player.abyss)),await p.evaluate(x=>AbyssEngine.normalize(x),before));
await p.evaluate(()=>{closeAllTopTabs();window.__firstRerollSelectionPhase=false;window.allowGrowthEvent=false;window.winnerGuessMiniGameEnabled=false;});for(let i=0;i<25;i++)await p.evaluate(()=>{isWaitingGrowth=false;startBattle();});assert.equal(await p.evaluate(()=>window.__battleInProgress),false);assert.deepEqual(errors,[]);console.log('PASS native tabs / both dock modes / widths / upgrades / save / 25 battles');fs.writeFileSync('release02-browser.json',JSON.stringify({errors,overflow,widths:[320,375,390,430,844],passed:true}));await b.close();})();
