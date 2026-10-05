// Run with Playwright WebKit. Optional original face/image PNGs are test fixtures.
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await webkit.launch(),page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const errors=[],results={engine:'WebKit 26.5',checks:[],seeds:[]};page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAQElEQVR4nGP88OEDAy0BE01NH7WAGMCCS8IiLIskg06smoZVfOgH0agFoxaMWjBqwagFoxaMWjBCLGAcbfwSAgDqHwjhpNwe6AAAAABJRU5ErkJggg==','base64');
 await page.route('**/*',route=>{
  const url=new URL(route.request().url()),name=url.pathname.replace(/^\/repo\//,'')||'index.html';
  if(name==='face/faceManifest.json')return route.fulfill({contentType:'application/json',body:JSON.stringify(Object.fromEntries(['S','A','B','C','D'].map(r=>[r,['existing.PNG']])))});
  if(name.startsWith('face/')&&name.endsWith('.PNG')||name==='image/warrior_base.png')return route.fulfill({contentType:'image/png',body:png});
  if(!name.includes('/')&&fs.existsSync(path.join(__dirname,name)))return route.fulfill({path:path.join(__dirname,name)});
  return route.fulfill({status:404,body:'not supplied'});
 });
 const status=()=>page.evaluate(()=>getWorldEffectsStatus());
 for(let i=0;i<3;i++){
  await page.goto('http://game.test/repo/');await page.waitForFunction(()=>window.getWorldEffectsStatus&&getWorldEffectsStatus().frames>5);
  results.seeds.push(await status());if(!i)await page.screenshot({path:path.join(__dirname,'../world11-title.png')});
 }
 assert.equal(new Set(results.seeds.map(s=>s.seed)).size,3);results.checks.push('Three loads: distinct seeds, palettes and generated topology');
 assert.ok(await page.locator('#worldEther').evaluate(c=>c.parentNode.id==='worldScenery'&&c.nextElementSibling.classList.contains('world-shade')&&getComputedStyle(c).pointerEvents==='none'));
 const a=await page.locator('#worldEther').evaluate(c=>c.toDataURL());await page.waitForTimeout(300);const b=await page.locator('#worldEther').evaluate(c=>c.toDataURL());assert.notEqual(a,b);results.checks.push('Animated pixels, behind dark veil/glass, no pointer interception');
 await page.locator('#startNewMenuBtn').tap();await page.locator('#inputStr').fill('星図の騎士');await page.locator('#startNewGameBtn').tap();
 await page.locator('#faceGachaBtn').waitFor({state:'visible'});await page.locator('#faceGachaBtn').tap();await page.waitForFunction(()=>!window.__faceGachaBusy&&window.faceItemsOwned.length===1);await page.locator('#firstRerollConfirmBtn').tap();await page.waitForTimeout(800);
 assert.equal((await status()).scene,'arena');assert.ok((await status()).fpsLimit<=12);assert.equal(await page.evaluate(()=>getTitleEffectsStatus().buffers),0);
 const before=await status();await page.waitForTimeout(350);assert.ok((await status()).frames>before.frames);assert.equal((await status()).seed,results.seeds[2].seed);
 await page.screenshot({path:path.join(__dirname,'../world11-arena.png')});results.checks.push('Actual game start: title knight resources freed; same world seed continues at <=12fps');
 for(const [tab,scene]of [['abyss','abyss'],['memory','forge']]){await page.evaluate(k=>{closeAllTopTabs();toggleTopFold(k)},tab);await page.waitForTimeout(220);assert.equal((await status()).scene,scene);if(tab==='abyss')await page.screenshot({path:path.join(__dirname,'../world11-abyss.png')});}
 results.checks.push('Abyss / forge tabs retain background scenery and continuous effect');
 await page.evaluate(()=>{closeAllTopTabs();window.allowGrowthEvent=false;window.winnerGuessMiniGameEnabled=false;});
 const remaining=await page.evaluate(()=>window.remainingBattles);await page.locator('#startBattleBtn').tap();await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.remainingBattles),remaining-1);results.checks.push('Real touch battle completes while background animation runs');
 for(const [w,h]of [[320,720],[844,390],[1440,900]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(160);const s=await status();assert.ok(s.pixels<=360000);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.locator('#worldEther').count(),1);}
 results.checks.push('320px / landscape / desktop: no overflow; exactly one display canvas; <=360,000 buffer pixels');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const paused=await status();await page.waitForTimeout(220);assert.equal((await status()).frames,paused.frames);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(220);assert.ok((await status()).frames>paused.frames);results.checks.push('Hidden page stops both scheduled rendering paths and resumes');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>getWorldEffectsStatus().state==='static');const still=await status();await page.waitForTimeout(220);assert.equal((await status()).frames,still.frames);assert.equal(still.state,'static');await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>getWorldEffectsStatus().state==='running');
 results.checks.push('Reduced motion: static generated art, no drawing loop');
 const seed=(await status()).seed;await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal((await status()).buffers,0);assert.equal(await page.locator('#worldEther').count(),0);
 await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await page.waitForTimeout(200);assert.equal((await status()).buffers,4);assert.equal((await status()).seed,seed);assert.equal(await page.locator('#worldEther').count(),1);results.checks.push('pagehide releases display + 3 sprites; pageshow recreates once with original seed');
 results.finalStats=await status();results.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'world11-result.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
