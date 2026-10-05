// Comparison fixture: unpack release 11 into ../reference11/ before running.
const {webkit}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await webkit.launch(),results=[];
 for(const [label,root] of [['before',path.join(__dirname,'../reference11')],['after',__dirname]]){
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
  await p.addInitScript(()=>{crypto.getRandomValues=a=>{for(let i=0;i<a.length;i++)a[i]=[11235,23456,34567,45678][i%4];return a;};});
  await p.route('**/*',r=>{const n=new URL(r.request().url()).pathname.slice(1)||'index.html';return !n.includes('/')&&fs.existsSync(path.join(root,n))?r.fulfill({path:path.join(root,n)}):r.fulfill({status:404,body:''});});
  await p.goto('http://contrast.test/');await p.waitForFunction(()=>window.getWorldEffectsStatus?.().state==='static');await p.waitForTimeout(200);
  await p.screenshot({path:path.join(__dirname,'../contrast12-'+label+'.png')});
  const metrics=await p.locator('#worldEther').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let dark=0,light=0,clear=0,edgeEnergy=0;for(let i=0;i<d.length;i+=4){const hi=Math.max(d[i],d[i+1],d[i+2]);if(hi<35&&d[i+3]>70)dark++;if(hi*d[i+3]/255>30)light++;if(d[i+3]<10)clear++;if(i>=4&&i%(c.width*4)!==0){for(let k=0;k<3;k++)edgeEnergy+=Math.abs(d[i+k]*d[i+3]/255-d[i-4+k]*d[i-1]/255);}}return {dark,light,clear,edgeEnergy,total:d.length/4};});
  results.push({label,...metrics});await p.close();
 }
 assert.ok(results[1].dark>results[0].dark+1000,'Local dark zones introduced');
 assert.ok(results[1].edgeEnergy>results[0].edgeEnergy*1.3,'Stronger contour contrast, independent of broad haze');assert.ok(results[1].clear>results[1].total*.1,'Keeps unmasked scenery');
 fs.writeFileSync(path.join(__dirname,'contrast12-result.json'),JSON.stringify(results,null,2));console.log(results);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
