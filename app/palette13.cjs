const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const names=['ivory-prism','obsidian-prism','obsidian-gold','obsidian-crimson'],seeds={};
 for(let n=1;Object.keys(seeds).length<4;n++){let s=(n+0x6D2B79F5)>>>0,t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);const k=Math.floor(((t^t>>>14)>>>0)/4294967296*4);if(!seeds[k])seeds[k]=n;}
 const browser=await webkit.launch(),results=[];
 for(let i=0;i<4;i++){
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(n=>{crypto.getRandomValues=a=>{a.fill(0);a[0]=n;return a;};},seeds[i]);
  await p.route('**/*',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html';return !n.includes('/')&&fs.existsSync(path.join(__dirname,n))?r.fulfill({path:path.join(__dirname,n)}):r.fulfill({status:404,body:''});});
  await p.goto('http://palette.test/');await p.waitForFunction(()=>window.getWorldEffectsStatus?.().state==='static');
  await p.evaluate(()=>{startNewGame('装飾の検証');});await p.waitForFunction(()=>!document.getElementById('gameScreen').classList.contains('hidden'));await p.evaluate(()=>{closeAllTopTabs();scrollTo(0,0)});await p.waitForTimeout(350);
  const s=await p.evaluate(()=>getWorldEffectsStatus());assert.equal(s.theme,names[i]);assert.equal(s.bands,3);assert.equal(s.seals,1);assert.equal(s.dust,12);
  const pixels=await p.locator('#worldEther').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let visible=0,colored=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<40)continue;visible++;if(Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])>35)colored++;}return {visible,colored,accentFraction:colored/visible};});
  assert.ok(pixels.accentFraction>.0001&&pixels.accentFraction<.25,'Color should be a limited accent');assert.deepEqual(errors,[]);
  await p.screenshot({path:path.join(__dirname,'../palette13-'+names[i]+'.png')});results.push({theme:s.theme,seed:seeds[i],...pixels});await p.close();
 }
 fs.writeFileSync(path.join(__dirname,'palette13-result.json'),JSON.stringify(results,null,2));console.log(results);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
