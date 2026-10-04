/* Existing face/ and image/ folders may be beside the page or one level above it. */
(function(){
 'use strict';
 const initial=location.pathname.includes('/app/')?'../':'';
 const roots={face:initial,image:initial};
 const successful=new Map(),attempts=new WeakMap();
 const canonical=p=>String(p||'').replace(/^(?:\.\.\/|\.\/|\/)+/,'');
 function resolve(p){
  if(!p)return p;
  const raw=String(p);if(/^(?:data:|blob:|https?:)/.test(raw))return raw;
  const key=canonical(raw),kind=key.startsWith('face/')?'face':key.startsWith('image/')?'image':null;
  return kind?(successful.get(key)??(roots[kind]+key)):raw;
 }
 function identify(img){
  try{
   const url=new URL(img.getAttribute('src'),document.baseURI);if(url.origin!==location.origin)return null;
   for(const kind of ['face','image'])for(const prefix of ['', '../']){
    const dir=new URL(prefix+kind+'/',document.baseURI);
    if(url.pathname.startsWith(dir.pathname))return {key:kind+'/'+url.pathname.slice(dir.pathname.length),prefix,url:url.href};
   }
  }catch(_){}return null;
 }
 // Retry only the alternate location of the same original image; never substitute generated art.
 document.addEventListener('error',e=>{
  const img=e.target;if(!(img instanceof HTMLImageElement))return;
  const asset=identify(img);if(!asset)return;
  let record=attempts.get(img);
  if(!record||record.key!==asset.key){record={key:asset.key,urls:new Set()};attempts.set(img,record);}
  record.urls.add(asset.url);
  const alternate=(asset.prefix===''?'../':'')+asset.key;
  if(record.urls.has(new URL(alternate,document.baseURI).href))return;
  record.urls.add(new URL(alternate,document.baseURI).href);img.src=alternate;
 },true);
 document.addEventListener('load',e=>{
  const img=e.target;if(!(img instanceof HTMLImageElement)||!img.naturalWidth)return;
  const asset=identify(img);if(!asset)return;
  successful.set(asset.key,asset.prefix+asset.key);attempts.delete(img);
 },true);
 window.GameAssets={resolve,canonical,roots,
  manifestCandidates(){const ordered=initial?['../','']:['','../'];return [...ordered.flatMap(p=>[p+'face/faceManifest.json',p+'face/facemanifest.json']), 'faceManifest.json','facemanifest.json'];},
  useManifest(url){if(url.startsWith('../face/'))roots.face='../';else if(url.startsWith('face/'))roots.face='';},
  imageCandidates(name){const preferred=resolve('image/'+name);return [...new Set([preferred,'image/'+name,'../image/'+name])];}
 };
})();
