/* Procedural light behind the glass. Completely independent of combat/save RNG.
   One low-resolution display surface, three cached glows, 20/12fps ceilings.
   No per-frame DOM work, blur filter, full-screen WebGL or gameplay listeners. */
(() => {
  'use strict';
  function init() {
    const host=document.getElementById('worldScenery');
    if(!host||document.getElementById('worldEther'))return;
    const TAU=Math.PI*2;
    const entropy=new Uint32Array(4);
    if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(entropy);
    else for(let i=0;i<4;i++)entropy[i]=(Math.random()*4294967296)>>>0;
    let state=entropy.reduce((a,b)=>(a^b)>>>0,0);
    const rand=()=>{state=(state+0x6D2B79F5)>>>0;let t=Math.imul(state^state>>>15,1|state);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};
    const range=(a,b)=>a+rand()*(b-a);
    const theme=['ivory-prism','obsidian-prism','obsidian-gold','obsidian-crimson'][Math.floor(rand()*4)];
    const ivory=theme==='ivory-prism',rainbow=theme.endsWith('prism');
    const base=theme==='obsidian-gold'?range(38,47):theme==='obsidian-crimson'?range(348,359):range(0,360);
    const drift=range(-.09,.09),hues=[base,base,base];
    // Most of the artwork is neutral. Color occupies only a short inlay (18%).
    const color=(i,a,l=65)=>`hsla(220,8%,${ivory?Math.min(96,l+18):Math.min(76,l+2)}%,${a})`;
    function inlay(b,x0,x1,center,alpha,body=false){
      const g=b.createLinearGradient(x0,0,x1,0);
      const neutral=body?(ivory?`rgba(239,241,245,${alpha})`:`rgba(4,6,11,${alpha})`):color(0,alpha,ivory?77:52);
      const lo=center-.09,hi=center+.09;
      g.addColorStop(0,neutral);g.addColorStop(lo,neutral);
      const accents=rainbow?[base,base+60,base+130,base+210,base+285]:[base-5,base,base+5];
      accents.forEach((h,i)=>g.addColorStop(lo+.02+(hi-lo-.04)*i/(accents.length-1),`hsla(${h},${rainbow?76:78}%,${rainbow?70:theme==='obsidian-gold'?62:56}%,${body?.55:.88})`));
      g.addColorStop(hi,neutral);g.addColorStop(1,neutral);return g;
    }
    // Mixed wavelengths and independent phase speeds produce a non-looping-looking
    // interference field. Geometry is generated once, not randomized every frame.
    const waves=Array.from({length:5},()=>({x:range(1.3,4.6),y:range(1,3.7),phase:range(0,TAU),speed:range(.07,.22)}));
    const bands=Array.from({length:3},(_,i)=>({
      y:(i+.5)/3+range(-.055,.055),phase:range(0,TAU),amplitude:range(.055,.16),frequency:range(.55,1.5),speed:range(.045,.11),width:range(.016,.030),color:i%3,slant:range(-.3,.3)
    }));
    const points=Array.from({length:12},(_,i)=>({x:range(-.1,1.1),y:range(-.08,1.08),phase:range(0,TAU),radius:range(.014,.07),speed:range(.025,.085),size:range(.6,1.5),color:i%3}));
    // A sparse nearest-neighbor graph makes a different drifting constellation.
    const edges=[];
    points.forEach((p,i)=>{
      const neighbors=points.map((q,j)=>({j,d:(q.x-p.x)**2+(q.y-p.y)**2})).filter(q=>q.j!==i).sort((a,b)=>a.d-b.d).slice(0,1);
      for(const q of neighbors)if(q.j>i&&q.d<.2)edges.push({a:i,b:q.j,phase:range(0,1),speed:range(.027,.064)});
    });
    const pools=Array.from({length:2},(_,i)=>({x:range(.05,.95),y:range(.1,.9),radius:range(.32,.58),phase:range(0,TAU),color:i}));
    const seals=Array.from({length:1},(_,i)=>({x:range(.05,.95),y:range(.08,.92),radius:range(.13,.3),lobes:Math.floor(range(3,8)),phase:range(0,TAU),speed:range(.008,.023),color:i}));
    const dust=Array.from({length:12},()=>({x:rand(),y:rand(),phase:range(0,TAU),speed:range(.003,.011),color:Math.floor(range(0,3))}));
    const xy=new Float32Array(points.length*2);
    let canvas=null,ctx=null,sprites=[],raf=0,timer=0,elapsed=0,last=0,width=0,height=0,disposed=false;
    let scene='',rate=20,slow=false,slowFrames=0;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const stats={seed:Array.from(entropy,n=>n.toString(16).padStart(8,'0')).join(''),theme,state:'waiting',scene:'',frames:0,buffers:0,pixels:0,fpsLimit:20,meanDrawMs:0,maxDrawMs:0,bands:bands.length,seals:seals.length,dust:dust.length,edges:edges.length,palette:hues.map(h=>Math.round((h+360)%360))};
    window.getWorldEffectsStatus=()=>({...stats,palette:[...stats.palette]});
    function allocate() {
      if(canvas)return;
      canvas=document.createElement('canvas');canvas.id='worldEther';canvas.setAttribute('aria-hidden','true');
      host.insertBefore(canvas,host.querySelector('.world-shade'));ctx=canvas.getContext('2d');
      if(!ctx){canvas.remove();canvas=null;stats.state='unsupported';return;}
      sprites=hues.map((h,i)=>{
        const c=document.createElement('canvas');c.width=c.height=128;const b=c.getContext('2d');
        const g=b.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,color(i,.46));g.addColorStop(.2,color(i,.28));g.addColorStop(.55,color(i,.09));g.addColorStop(1,color(i,0));b.fillStyle=g;b.fillRect(0,0,128,128);return c;
      });stats.buffers=4;size();
    }
    function size() {
      if(!canvas)return;
      const rect=host.getBoundingClientRect();
      // Physical buffer budget is independent of Retina devicePixelRatio.
      const scale=Math.min(.85,480/Math.max(1,rect.width),960/Math.max(1,rect.height),Math.sqrt(360000/Math.max(1,rect.width*rect.height)));
      width=Math.max(1,Math.floor(rect.width*scale));height=Math.max(1,Math.floor(rect.height*scale));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;stats.pixels=width*height;}
      if(!document.hidden)draw();
    }
    function currentScene() {
      const c=document.body.classList;
      return c.contains('scene-title')?'title':c.contains('scene-abyss')?'abyss':c.contains('scene-forge')?'forge':'arena';
    }
    function syncScene() {
      const next=currentScene();if(scene===next)return;
      scene=next;stats.scene=scene;rate=scene==='title'?20:12;stats.fpsLimit=slow?8:rate;
      // Keep the same seed and fluid clock across screens: the world continues.
      wake();
    }
    function draw() {
      if(!ctx||!width||!height)return;
      const start=performance.now(),b=ctx,w=width,h=height,m=Math.min(w,h),t=elapsed;
      const strength=scene==='title'?1:scene==='abyss'?.92:scene==='forge'?.78:.7;
      b.clearRect(0,0,w,h);b.globalCompositeOperation='source-over';
      // Local negative space travels with each sheet. Three nested soft strokes
      // suppress the photograph BEFORE the light is added, never the UI above it.
      b.lineCap='round';b.lineJoin='round';
      for(const p of bands){
        const thickness=h*p.width*(.8+.2*Math.sin(t*.09+p.phase));
        b.beginPath();
        for(let j=0;j<=48;j++){
          const u=j/48,y=(p.y+p.slant*(u-.5)+Math.sin(u*TAU*p.frequency+t*p.speed+p.phase)*p.amplitude+Math.sin(u*11-t*p.speed*.73+p.phase)*p.amplitude*.24)*h+thickness*.5*Math.sin(u*Math.PI);
          j?b.lineTo(u*w,y):b.moveTo(0,y);
        }
        for(const [padding,alpha] of [[34,.12],[21,.20],[10,.36]]){
          const shade=b.createLinearGradient(0,0,w,0);
          shade.addColorStop(0,'rgba(1,3,10,0)');shade.addColorStop(.15,`rgba(1,3,10,${alpha})`);shade.addColorStop(.85,`rgba(1,3,10,${alpha})`);shade.addColorStop(1,'rgba(1,3,10,0)');
          b.strokeStyle=shade;b.lineWidth=thickness+padding;b.stroke();
        }
      }
      // Rosette details sit inside a soft dark lens, with no full-screen dimmer.
      for(const p of seals){
        const x=(p.x+Math.sin(t*.023+p.phase)*.045)*w,y=(p.y+Math.cos(t*.017+p.phase)*.04)*h,r=m*p.radius*1.5;
        const shade=b.createRadialGradient(x,y,0,x,y,r);
        shade.addColorStop(0,'rgba(1,3,10,.40)');shade.addColorStop(.62,'rgba(1,3,10,.48)');shade.addColorStop(1,'rgba(1,3,10,0)');
        b.fillStyle=shade;b.fillRect(x-r,y-r,r*2,r*2);
      }
      b.globalCompositeOperation='lighter';
      // Volumetric pools slowly migrate behind panels, with no runtime blur cost.
      for(const p of pools){const r=m*p.radius*(1+.12*Math.sin(t*.11+p.phase));const x=(p.x+Math.sin(t*.037+p.phase)*.12)*w,y=(p.y+Math.cos(t*.029+p.phase)*.1)*h;b.globalAlpha=.15*strength;b.drawImage(sprites[p.color],x-r,y-r,r*2,r*2);}
      b.globalAlpha=1;
      // Iridescent sheets: two interfering wave scales, translucent body + seam.
      for(const p of bands){
        const line=u=>(p.y+p.slant*(u-.5)+Math.sin(u*TAU*p.frequency+t*p.speed+p.phase)*p.amplitude+Math.sin(u*11-t*p.speed*.73+p.phase)*p.amplitude*.24)*h;
        const thickness=h*p.width*(.8+.2*Math.sin(t*.09+p.phase));
        const center=.5+.23*Math.sin(t*.06+p.phase);b.globalCompositeOperation='source-over';b.fillStyle=inlay(b,0,w,center,(ivory?.42:.80)*strength,true);
        b.beginPath();for(let j=0;j<=48;j++){const u=j/48;j?b.lineTo(u*w,line(u)):b.moveTo(0,line(0));}
        for(let j=48;j>=0;j--){const u=j/48;b.lineTo(u*w,line(u)+thickness*Math.sin(u*Math.PI));}b.closePath();b.fill();
        b.globalCompositeOperation='lighter';b.strokeStyle=inlay(b,0,w,center,(ivory?.72:.24)*strength);b.lineWidth=1.1;b.beginPath();for(let j=0;j<=48;j++){const u=j/48;j?b.lineTo(u*w,line(u)):b.moveTo(0,line(0));}b.stroke();
        // Short bright threads travel along each sheet at independent speeds.
        const head=(t*p.speed*.19+p.phase/TAU)%1;
        b.strokeStyle=color(0,.40*strength,85);b.lineWidth=.8;b.beginPath();
        for(let j=0;j<=12;j++){const u=head+j*.005;if(u>1)break;const y=line(u)+thickness*.35*Math.sin(u*Math.PI);j?b.lineTo(u*w,y):b.moveTo(u*w,y);}b.stroke();
      }
      // Each graph vertex follows a bounded, layered vector field; no jitter.
      points.forEach((p,i)=>{let dx=0,dy=0;for(const q of waves){dx+=Math.sin(p.y*q.y*TAU+t*q.speed+p.phase+q.phase);dy+=Math.cos(p.x*q.x*TAU-t*q.speed+p.phase-q.phase);}xy[i*2]=(p.x+dx*p.radius*.22)*w;xy[i*2+1]=(p.y+dy*p.radius*.22)*h;});
      for(const e of edges){
        const ax=xy[e.a*2],ay=xy[e.a*2+1],bx=xy[e.b*2],by=xy[e.b*2+1],p=points[e.a];
        const cx=(ax+bx)/2+Math.sin(t*.1+e.phase*TAU)*m*.05,cy=(ay+by)/2+Math.cos(t*.07+e.phase*TAU)*m*.035;
        b.strokeStyle=color(p.color,.07*strength);b.lineWidth=.65;b.beginPath();b.moveTo(ax,ay);b.quadraticCurveTo(cx,cy,bx,by);b.stroke();
        const u=(t*e.speed+e.phase)%1,v=1-u,x=v*v*ax+2*v*u*cx+u*u*bx,y=v*v*ay+2*v*u*cy+u*u*by;
        b.globalAlpha=Math.sin(u*Math.PI)*.45*strength;b.drawImage(sprites[p.color],x-5,y-5,10,10);b.globalAlpha=1;
      }
      points.forEach((p,i)=>{const x=xy[i*2],y=xy[i*2+1],a=(.22+.08*Math.sin(t*.4+p.phase))*strength;b.fillStyle=color(p.color,a,82);b.fillRect(x,y,p.size,p.size);});
      // Interference rosettes: changing lobed contours, interrupted like old glass
      // engravings. The contours breathe on different periods, never flash.
      for(const p of seals){
        const x=(p.x+Math.sin(t*.023+p.phase)*.045)*w,y=(p.y+Math.cos(t*.017+p.phase)*.04)*h;
        for(let ring=0;ring<2;ring++){
          b.strokeStyle=inlay(b,x-m*p.radius*1.3,x+m*p.radius*1.3,.5+.18*Math.sin(p.phase+t*.04),(ivory?.38:.16)*strength);b.lineWidth=.95;b.beginPath();
          for(let j=0;j<=80;j++){const a=j/80*TAU,r=m*p.radius*(1+ring*.12)*(.83+.1*Math.sin(a*p.lobes+t*p.speed+p.phase)+.07*Math.sin(a*(p.lobes+1)-t*.027));const xx=x+Math.cos(a+t*p.speed)*r,yy=y+Math.sin(a+t*p.speed)*r*.74;if(j%20===0)b.moveTo(xx,yy);else b.lineTo(xx,yy);}b.stroke();
        }
        // Gentle, independently timed wave fronts emerging from each rosette.
        const u=(t*.026+p.phase/TAU)%1,a=Math.sin(u*Math.PI)**2*.09*strength;
        b.strokeStyle=color(p.color,a);b.lineWidth=1;b.beginPath();b.ellipse(x,y,m*(.04+p.radius*u*1.8),m*(.03+p.radius*u*1.2),drift,0,TAU);b.stroke();
      }
      for(const p of dust){const u=(p.y-t*p.speed%1+1)%1,x=(p.x+Math.sin(t*.07+p.phase)*.025)*w,y=u*h,alpha=Math.sin(u*Math.PI)**2*.27*strength;b.fillStyle=color(p.color,alpha,84);b.fillRect(x,y,.8,.8);}
      b.globalAlpha=1;b.globalCompositeOperation='source-over';
      const cost=performance.now()-start;stats.frames++;stats.meanDrawMs+= (cost-stats.meanDrawMs)/Math.min(stats.frames,60);stats.maxDrawMs=Math.max(stats.maxDrawMs,cost);
      if(cost>12&&++slowFrames>=8){slow=true;stats.fpsLimit=8;}
    }
    function cancel(){clearTimeout(timer);cancelAnimationFrame(raf);timer=raf=0;}
    function queue(){
      if(disposed||document.hidden||motion.matches||!canvas)return;
      // Wait between frames instead of running a 60Hz requestAnimationFrame loop.
      timer=setTimeout(()=>{timer=0;raf=requestAnimationFrame(frame);},1000/(slow?8:rate));
    }
    function frame(now){raf=0;if(disposed||document.hidden||motion.matches||!canvas)return;elapsed+=Math.min((now-last)/1000,.25);last=now;draw();queue();}
    function wake(){cancel();if(disposed||!canvas)return;stats.state=document.hidden?'paused':motion.matches?'static':'running';last=performance.now();if(!document.hidden){draw();queue();}}
    function release(){cancel();for(const c of [canvas,...sprites])if(c){c.width=c.height=1;c.remove();}canvas=ctx=null;sprites=[];stats.buffers=stats.pixels=0;stats.state='disposed';}
    const resize=window.ResizeObserver?new ResizeObserver(size):null;
    const scenes=new MutationObserver(syncScene);
    scenes.observe(document.body,{attributes:true,attributeFilter:['class']});
    if(resize)resize.observe(host);else window.addEventListener('resize',size,{passive:true});
    document.addEventListener('visibilitychange',wake);
    if(motion.addEventListener)motion.addEventListener('change',wake);else motion.addListener(wake);
    window.addEventListener('pagehide',()=>{disposed=true;resize?.disconnect();scenes.disconnect();release();});
    window.addEventListener('pageshow',()=>{if(!disposed)return;disposed=false;scenes.observe(document.body,{attributes:true,attributeFilter:['class']});resize?.observe(host);allocate();scene=currentScene();stats.scene=scene;rate=scene==='title'?20:12;stats.fpsLimit=slow?8:rate;wake();});
    scene=currentScene();stats.scene=scene;rate=scene==='title'?20:12;stats.fpsLimit=rate;allocate();wake();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
