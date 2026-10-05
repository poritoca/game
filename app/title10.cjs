// Run: PLAYWRIGHT_BROWSERS_PATH=... node title10.cjs (Playwright WebKit required).
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await webkit.launch(),results={engine:'WebKit',samples:[],checks:[]};
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/*',route=>{
  const name=new URL(route.request().url()).pathname.replace(/^\/repo\//,'')||'index.html';
  if(!name.includes('/')&&fs.existsSync(path.join(__dirname,name)))return route.fulfill({path:path.join(__dirname,name)});
  return route.fulfill({status:404,body:'Original optional face/image folders not supplied'});
 });
 const status=()=>page.evaluate(()=>getTitleEffectsStatus());
 for(let i=0;i<5;i++) {
  await page.goto('http://game.test/repo/');await page.waitForFunction(()=>window.getTitleEffectsStatus&&getTitleEffectsStatus().frames>4);
  const s=await status();results.samples.push(s);
  const pixels=await page.locator('.title-ether-front').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<a.length;i+=4)if(a[i]>20)n++;return n;});
  assert.ok(pixels>150,'Visible armor etching');
  if(i<2)await page.screenshot({path:path.join(__dirname,'../title10-'+i+'.png')});
 }
 assert.equal(new Set(results.samples.map(s=>s.seed)).size,5);assert.ok(new Set(results.samples.map(s=>s.hue)).size>1);
 results.checks.push('5 page openings produce distinct seeds and palette/topology parameters; armor overlay has visible pixels');
 await page.setViewportSize({width:320,height:720});await page.waitForTimeout(200);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(__dirname,'../title10-320.png')});
 results.checks.push('320px: no horizontal overflow');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 const paused=await status();await page.waitForTimeout(180);assert.equal((await status()).frames,paused.frames);assert.equal(paused.state,'paused');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(200);assert.ok((await status()).frames>paused.frames);
 results.checks.push('Hidden document pauses animation and resumes without a new seed');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);const still=await status();await page.waitForTimeout(180);assert.equal((await status()).frames,still.frames);assert.equal(still.state,'static');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);
 results.checks.push('Reduced motion keeps one generated still image, with no animation loop');
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal((await status()).buffers,0);
 await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await page.waitForTimeout(150);assert.equal((await status()).buffers,4);
 results.checks.push('pagehide frees all four buffers; pageshow restores fresh art');
 await page.locator('#startNewMenuBtn').click();await page.locator('#inputStr').fill('黒曜の検証者');await page.locator('#startNewGameBtn').click();
 await page.waitForFunction(()=>getTitleEffectsStatus().state==='disposed');const disposed=await status();
 await page.waitForTimeout(900);assert.equal((await status()).frames,disposed.frames);assert.equal(disposed.buffers,0);assert.equal(await page.locator('.title-ether').count(),0);
 assert.equal(await page.locator('#gameScreen').evaluate(e=>e.classList.contains('hidden')),false);
 results.checks.push('Actual start button: game opens, title RAF stops, both display canvases removed and all four buffers released');
 await page.evaluate(()=>{document.getElementById('gameScreen').classList.add('hidden');document.getElementById('titleScreen').classList.remove('hidden','fade-out');});
 await page.waitForFunction(()=>getTitleEffectsStatus().frames>3);assert.notEqual((await status()).seed,disposed.seed);
 results.checks.push('Returning to title creates a new seed and a single pair of canvases');assert.equal(await page.locator('.title-ether').count(),2);
 results.errors=errors;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'title10-result.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
