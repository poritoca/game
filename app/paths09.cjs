const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(root,'faceManifest.json'),'utf8'));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAQElEQVR4nGP88OEDAy0BE01NH7WAGMCCS8IiLIskg06smoZVfOgH0agFoxaMWjBqwagFoxaMWjBCLGAcbfwSAgDqHwjhpNwe6AAAAABJRU5ErkJggg==','base64');
(async()=>{
 const browser=await webkit.launch(),results=[];
 for(const config of [
  {name:'siblings',page:'/repo/',face:'/repo/',image:'/repo/',manifest:'/repo/face/'},
  {name:'original-app-parent',page:'/repo/app/',face:'/repo/',image:'/repo/',manifest:'/repo/face/'},
  {name:'app-local',page:'/repo/app/',face:'/repo/app/',image:'/repo/app/',manifest:'/repo/app/face/'},
  {name:'root-manifest-parent-images',page:'/repo/play/',face:'/repo/',image:'/repo/',manifest:'/repo/play/'},
  {name:'split-folders',page:'/repo/play/',face:'/repo/',image:'/repo/play/',manifest:'/repo/face/'}
 ]){
  console.log('Checking',config.name);
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
  let missingRequests=0;
  await p.route('**/*',route=>{
   const file=new URL(route.request().url()).pathname;
   if(file===config.manifest+'faceManifest.json')return route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)});
   if(/facemanifest\.json$/i.test(file))return route.fulfill({status:404,body:'not here'});
   if(file.startsWith(config.face+'face/')&&/\.PNG$/.test(file))return route.fulfill({contentType:'image/png',body:png});
   if(file===config.image+'image/warrior_base.png')return route.fulfill({contentType:'image/png',body:png});
   if(file.includes('/face/')||file.includes('/image/')){missingRequests++;return route.fulfill({status:404,body:'not here'});}
   const name=file===config.page?'index.html':file.slice(config.page.length);
   if(file.startsWith(config.page)&&!name.includes('/')&&fs.existsSync(path.join(root,name)))return route.fulfill({path:path.join(root,name)});
   return route.fulfill({status:404,body:'unknown'});
  });
  await p.goto('http://game.test'+config.page);await p.evaluate(()=>window.faceManifestReady);
  await p.evaluate(()=>startNewGame('画像配置検証'));await p.waitForTimeout(800);
  await p.locator('#faceGachaBtn').click();await p.waitForFunction(()=>!window.__faceGachaBusy&&window.faceItemsOwned.length>0);await p.locator('#firstRerollConfirmBtn').click();
  await p.waitForFunction(()=>{const img=document.getElementById('faceOverlay');return img.complete&&img.naturalWidth>0});
  const equipped=await p.evaluate(()=>({key:faceItemEquipped,src:document.getElementById('faceOverlay').src,bonus:JSON.stringify(faceItemBonusMap[faceItemEquipped])}));
  assert.equal(new URL(equipped.src).pathname,config.face+equipped.key);
  await p.evaluate(()=>drawCharacterImage('描画確認','playerCanvas'));
  // Ordinary enemy/player canvas uses the existing warrior base, also in split layouts.
  await p.waitForFunction(()=>{const c=document.getElementById('playerCanvas');return c&&[...c.getContext('2d').getImageData(0,0,c.width,c.height).data].some((v,i)=>i%4===3&&v>0)});
  await p.evaluate(()=>{enemy=makeCharacter('検証敵');window.enemy=enemy;window.isBossBattle=true;window.bossFacePath='face/S/S1.PNG';updateStats();});
  await p.waitForFunction(()=>{const img=document.getElementById('enemyImg');return img.complete&&img.naturalWidth>0});
  assert.equal(new URL(await p.locator('#enemyImg').getAttribute('src'),'http://game.test'+config.page).pathname,config.face+'face/S/S1.PNG');
  // Existing save keys (including ../) must still reach the original file without changing bonus keys.
  await p.evaluate(()=>{const key='../face/A/A1.PNG';window.faceItemBonusMap[key]={rarity:'A',growthRates:{attack:1.8},dropRateMultiplier:1.2};window.faceItemEquipped=key;syncFaceOverlay()});
  await p.waitForFunction(()=>{const img=document.getElementById('faceOverlay');return img.complete&&img.naturalWidth>0});
  assert.equal(new URL(await p.locator('#faceOverlay').getAttribute('src'),'http://game.test'+config.page).pathname,config.face+'face/A/A1.PNG');
  assert.equal(await p.evaluate(()=>faceItemBonusMap['../face/A/A1.PNG'].growthRates.attack),1.8);
  // Two missing locations cannot create an unbounded error retry loop.
  await p.evaluate(()=>{const i=document.createElement('img');i.id='missingProbe';i.src='face/S/missing.png';document.body.append(i)});await p.waitForTimeout(150);const count=missingRequests;await p.waitForTimeout(250);assert.equal(missingRequests,count);
  assert.deepEqual(errors,[]);results.push({name:config.name,passed:true});await p.close();
 }
 const result={passed:true,layouts:results,checks:['gacha','equipped face','ordinary character canvas','boss image','legacy save key and bonus','bounded missing-file retry'],limitation:'Actual user PNG files were not supplied; a small synthetic PNG was served at the original image URLs.'};fs.writeFileSync('paths09-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
