const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'faceManifest.json'),'utf8'));
const fixture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAQElEQVR4nGP88OEDAy0BE01NH7WAGMCCS8IiLIskg06smoZVfOgH0agFoxaMWjBqwagFoxaMWjBCLGAcbfwSAgDqHwjhpNwe6AAAAABJRU5ErkJggg==','base64');
(async()=>{
 const browser=await webkit.launch(),results=[];
 for(const scenario of ['root','nested','lowercase','invalidNested','emptyNested','missing','delayed']){
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[],images=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  let release;const gate=new Promise(resolve=>release=resolve);
  await p.route('**/*',async route=>{
   const url=new URL(route.request().url());const file=url.pathname.slice(1);
   if(/facemanifest\.json$/i.test(file)){
    if((scenario==='nested'&&file==='face/faceManifest.json')||(scenario==='lowercase'&&file==='facemanifest.json'))return route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)});
    if(file==='face/faceManifest.json'&&scenario==='invalidNested')return route.fulfill({contentType:'text/html',body:'<html>404</html>'});
    if(file==='face/faceManifest.json'&&scenario==='emptyNested')return route.fulfill({contentType:'application/json',body:JSON.stringify({S:[],A:[],B:[],C:[],D:[]})});
    if(file==='faceManifest.json'&&!['missing','lowercase'].includes(scenario)){
     if(scenario==='delayed')await gate;
     return route.continue(); // Actual uploaded manifest, served from the delivery directory.
    }
    return route.fulfill({status:404,body:'Not found'});
   }
   if(/^face\/[SABCD]\/.+\.PNG$/.test(file)||file==='image/warrior_base.png'){
    images.push(file);return route.fulfill({contentType:'image/png',body:fixture});
   }
   return route.continue();
  });
  await p.goto('http://127.0.0.1:8765',{waitUntil:'domcontentloaded'});
  if(scenario!=='delayed')await p.evaluate(()=>window.faceManifestReady);
  if(scenario==='missing'){
   assert.equal(await p.evaluate(()=>window.faceManifestReady),false);
   const result=await p.evaluate(async()=>{window.faceCoins=10000;await performFaceGacha();return {coins:faceCoins,busy:!!window.__faceGachaBusy}});assert.deepEqual(result,{coins:10000,busy:false});
  }else{
   await p.evaluate(()=>startNewGame('画像読込テスト'));await p.waitForTimeout(800);
   if(scenario==='delayed'){
    const coins=await p.evaluate(()=>faceCoins);
    await p.evaluate(()=>{window.__pendingGacha=performFaceGacha()});await p.waitForTimeout(100);
    assert.equal(await p.evaluate(()=>faceCoins),coins);release();await p.evaluate(()=>window.__pendingGacha);
   }else await p.locator('#faceGachaBtn').click();
   await p.waitForFunction(()=>!window.__faceGachaBusy&&window.faceItemsOwned.length>0);
   await p.locator('#firstRerollConfirmBtn').click();await p.waitForTimeout(400);
   const state=await p.evaluate(()=>({source:window.__faceManifestSource,counts:Object.fromEntries(Object.entries(IMAGE_LIST_BY_RANK).map(([r,list])=>[r,list.length])),face:faceItemEquipped,img:document.getElementById('faceOverlay').getAttribute('src'),loaded:document.getElementById('faceOverlay').complete&&document.getElementById('faceOverlay').naturalWidth>0}));
   assert.deepEqual(state.counts,{S:41,A:25,B:14,C:17,D:25});assert.match(state.face,/^face\/[SABCD]\/[SABCD]\d+\.PNG$/);assert.equal(state.img,state.face);assert.equal(state.loaded,true);
   assert.equal(state.source,scenario==='nested'?'face/faceManifest.json':scenario==='lowercase'?'facemanifest.json':'faceManifest.json');
   for(const rank of ['S','A','B','C','D']){
    const item=await p.evaluate(r=>{const rand=Math.random;try{Math.random=()=>.999999;return drawRandomFace(r)}finally{Math.random=rand}},rank);
    assert.equal(item.path,'face/'+rank+'/'+manifest[rank].at(-1));
   }
  }
  assert.deepEqual(errors,[]);results.push({scenario,passed:true});await p.close();
 }
 const result={passed:true,totalImages:122,cases:results,limitation:'Manifest is the supplied original; PNG responses use synthetic fixtures because actual image files were not supplied.'};
 fs.writeFileSync('manifest08-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
