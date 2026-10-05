/* Title-only procedural ether. No gameplay state, saved data, or external assets. */
(() => {
  'use strict';
  const title = document.getElementById('titleScreen');
  const stage = document.getElementById('titleImage');
  const portrait = stage && stage.querySelector('img');
  if (!title || !portrait) return;
  const TAU = Math.PI * 2;
  let engine = null, suspended = false;
  const report = { state: 'waiting', seed: '', frames: 0, buffers: 0, hue: 0, flames: 0, crystals: 0 };
  // Small scalar-only diagnostics: never holds canvas buffers after disposal.
  window.getTitleEffectsStatus = () => ({ ...report });
  function visible() {
    return !suspended && !title.classList.contains('hidden') && !title.classList.contains('fade-out') && title.style.display !== 'none';
  }
  function create() {
    const entropy = new Uint32Array(4);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(entropy);
    else for (let i = 0; i < 4; i++) entropy[i] = (Math.random() * 4294967296) >>> 0;
    let state = entropy.reduce((a, b) => (a ^ b) >>> 0, 0);
    const random = () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let x = Math.imul(state ^ state >>> 15, 1 | state);
      x ^= x + Math.imul(x ^ x >>> 7, 61 | x);
      return ((x ^ x >>> 14) >>> 0) / 4294967296;
    };
    const range = (a, b) => a + random() * (b - a);
    const hue = range(0, 360), harmony = range(45, 165), twist = range(-1, 1);
    const color = (offset, alpha, light = 66) => `hsla(${(hue + offset) % 360},90%,${light}%,${alpha})`;
    const canvas = (className, width, height) => {
      const c = document.createElement('canvas');
      c.width = width; c.height = height;
      if (className) { c.className = className; c.setAttribute('aria-hidden', 'true'); stage.appendChild(c); }
      return c;
    };
    let back = canvas('title-ether title-ether-back', 1, 1);
    let front = canvas('title-ether title-ether-front', 1, 1);
    let etching = canvas('', 600, Math.round(600 * 1199 / 1312));
    let tint = canvas('', etching.width, etching.height);
    const flames = Array.from({ length: 13 + Math.floor(range(0, 9)) }, () => ({
      x: range(52, 304), y: range(298, 355), height: range(125, 290), width: range(8, 30),
      phase: range(0, TAU), wave: range(8, 29), frequency: range(1.4, 3.4), speed: range(.2, .55), hue: range(-28, harmony)
    }));
    const crystals = Array.from({ length: 12 + Math.floor(range(0, 15)) }, () => ({
      x: range(30, 332), y: range(55, 337), size: range(9, 39), lean: range(-.9, .9), phase: range(0, TAU), hue: range(0, harmony)
    }));
    const motes = Array.from({ length: 54 }, () => ({ x: range(25, 335), y: range(35, 355), speed: range(3, 14), phase: range(0, TAU), size: range(.45, 1.6) }));
    const orbit = { radius: range(98, 136), facets: Math.floor(range(7, 13)), phase: range(0, TAU), tilt: range(-.3, .3) };
    // Generate new branching filigree in original portrait coordinates, then clip
    // to the actual sword, shield, breastplate and metal greaves (not the cloak).
    let e = etching.getContext('2d');
    e.scale(600 / 1312, 600 / 1312);
    const regions = [
      [[700,455],[826,369],[874,501],[902,601],[834,782],[747,624]],
      [[98,1110],[318,704],[348,704],[331,744]],
      [[500,339],[581,305],[640,402],[524,456]],
      [[521,96],[583,43],[636,86],[649,139],[613,196],[558,169]],
      [[674,225],[728,195],[784,253],[787,297],[699,282]],
      [[655,733],[700,706],[745,795],[717,863],[672,819]],
      [[461,782],[503,834],[530,965],[474,972],[438,864]]
    ];
    for (const points of regions) {
      e.save(); e.beginPath(); points.forEach(([x,y],i) => i ? e.lineTo(x,y) : e.moveTo(x,y)); e.closePath(); e.clip();
      const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const cx = (x0+x1)/2, cy = (y0+y1)/2;
      e.strokeStyle = 'rgba(255,255,255,.78)'; e.lineWidth = 2;
      // Asymmetric branching veins: each region gets its own generative topology.
      for (let j=0; j<12; j++) {
        let x=range(x0,x1), y=range(y0,y1); e.beginPath(); e.moveTo(x,y);
        for (let k=0;k<7;k++) {
          const nx=x+range(-35,35), ny=y+range(12,39); e.lineTo(nx,ny);
          if (random()>.52) { e.moveTo(nx,ny); e.lineTo(nx+range(-32,32),ny-range(10,30)); e.moveTo(nx,ny); }
          x=nx; y=ny;
        }
        e.stroke();
      }
      // Nested angular sigil, with a different symmetry on every armor region.
      const n=Math.floor(range(3,8)), radius=Math.min(x1-x0,y1-y0)*range(.24,.4), angle=range(0,TAU);
      for(let ring=0;ring<3;ring++) {
        e.beginPath(); for(let j=0;j<=n;j++) {const a=j/n*TAU+angle;const r=radius*(1-ring*.24);const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r; j?e.lineTo(x,y):e.moveTo(x,y);} e.stroke();
      }
      for(let j=0;j<8;j++) {const x=range(x0,x1), y=range(y0,y1);e.fillStyle='rgba(255,255,255,.6)';e.fillRect(x,y,3,3);}
      e.restore();
    }
    // Respect transparent edge pixels of the original PNG.
    e.setTransform(1,0,0,1,0,0); e.globalCompositeOperation='destination-in';
    e.drawImage(portrait,0,0,etching.width,etching.height); e=null;
    Object.assign(report,{state:'running', seed:Array.from(entropy,x=>x.toString(16).padStart(8,'0')).join(''), frames:0, buffers:4, hue:Math.round(hue), flames:flames.length, crystals:crystals.length});
    let width=0,height=0,ratio=1,raf=0,last=0,elapsed=0,dead=false,inView=true;
    let interval=1000/30, expensive=0;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    function size() {
      if(dead) return;
      const rect=stage.getBoundingClientRect(); width=rect.width;height=rect.height;
      ratio=Math.min(devicePixelRatio||1,1.5);
      for(const c of [back,front]) {c.width=Math.max(1,Math.round(width*ratio));c.height=Math.max(1,Math.round(height*ratio));}
      draw(elapsed);
    }
    function draw(time) {
      if(dead||!width||!height) return;
      const b=back.getContext('2d'), f=front.getContext('2d');
      b.setTransform(back.width/360,0,0,back.height/390,0,0); b.clearRect(0,0,360,390);
      const aura=b.createRadialGradient(180,205,8,180,205,173);
      aura.addColorStop(0,color(harmony,.13));aura.addColorStop(.55,color(0,.1));aura.addColorStop(1,color(0,0));
      b.fillStyle=aura;b.fillRect(0,0,360,390);b.globalCompositeOperation='lighter';
      // Flow ribbons have two interfering waves; layered cores resemble hot glass.
      for(const p of flames) {
        const center=(u)=>p.x+Math.sin(u*p.frequency*TAU+p.phase-time*p.speed)*p.wave*u+Math.sin(u*11+time*.4+p.phase)*9*u+twist*u*u*30;
        for(let layer=0;layer<2;layer++) {
          const gradient=b.createLinearGradient(0,p.y,0,p.y-p.height);
          gradient.addColorStop(0,color(p.hue,0));gradient.addColorStop(.35,color(p.hue,layer?.12:.055));gradient.addColorStop(.82,color(p.hue+20,layer?.32:.14));gradient.addColorStop(1,color(p.hue,0));
          b.fillStyle=gradient;b.beginPath();
          const band=p.width*(layer?.3:1);
          for(let i=0;i<=56;i++){const u=i/56,x=center(u)-band*Math.sin(u*Math.PI)*(1-u*.65);i?b.lineTo(x,p.y-u*p.height):b.moveTo(x,p.y);}
          for(let i=56;i>=0;i--){const u=i/56;b.lineTo(center(u)+band*Math.sin(u*Math.PI)*(1-u*.65),p.y-u*p.height);} b.closePath();b.fill();
        }
      }
      // Faceted ice shards drift out of phase; interior seams catch another hue.
      for(const p of crystals) {
        const y=p.y+Math.sin(time*.35+p.phase)*6, glow=.45+.2*Math.sin(time*.6+p.phase);
        b.save();b.translate(p.x,y);b.rotate(p.lean+Math.sin(time*.2+p.phase)*.06);
        const g=b.createLinearGradient(-p.size*.25,0,p.size*.25,0);g.addColorStop(0,color(p.hue,.02));g.addColorStop(.49,color(p.hue,glow*.28));g.addColorStop(.51,color(p.hue+35,.04));g.addColorStop(1,color(p.hue,.16));
        b.fillStyle=g;b.strokeStyle=color(p.hue,glow*.5);b.lineWidth=.55;
        b.beginPath();b.moveTo(0,-p.size);b.lineTo(p.size*.26,0);b.lineTo(0,p.size*.6);b.lineTo(-p.size*.26,0);b.closePath();b.fill();b.stroke();
        b.beginPath();b.moveTo(0,-p.size);b.lineTo(0,p.size*.6);b.moveTo(-p.size*.26,0);b.lineTo(p.size*.26,0);b.stroke();b.restore();
      }
      // Broken astrolabe and generated rune ticks, behind the silhouette.
      b.save();b.translate(180,194);b.rotate(orbit.tilt);
      for(let ring=0;ring<3;ring++) {
        const r=orbit.radius+ring*7;b.strokeStyle=color(ring*harmony/2,.15-ring*.025);b.lineWidth=.7;
        for(let j=0;j<orbit.facets;j++){const a=TAU*j/orbit.facets+orbit.phase+time*.018*(ring%2?-1:1);b.beginPath();b.arc(0,0,r,a,a+TAU/orbit.facets*.7);b.stroke();
          b.save();b.rotate(a);b.beginPath();b.moveTo(r-3,0);b.lineTo(r+4,0);b.lineTo(r+7,3);b.stroke();b.restore();}
      } b.restore();
      for(const p of motes) {
        const y=355-((p.y+time*p.speed)%320),x=p.x+Math.sin(time*.3+p.phase)*9;
        const alpha=Math.sin((355-y)/320*Math.PI)*(.3+.2*Math.sin(time+p.phase));
        b.fillStyle=color(p.phase*12,alpha,83);b.fillRect(x,y,p.size,p.size);
      }
      b.globalCompositeOperation='source-over';
      // Color moving through the etched glass, restricted to the armor mask.
      const t=tint.getContext('2d');t.clearRect(0,0,tint.width,tint.height);t.globalCompositeOperation='source-over';t.drawImage(etching,0,0);
      t.globalCompositeOperation='source-in';
      const shift=Math.sin(time*.19)*48,g=t.createLinearGradient(0,0,tint.width,tint.height);
      g.addColorStop(0,color(shift,1,78));g.addColorStop(.35,color(harmony+shift,.9,65));g.addColorStop(.65,color(shift+25,1,79));g.addColorStop(1,color(harmony-shift,1,68));
      t.fillStyle=g;t.fillRect(0,0,tint.width,tint.height);
      f.setTransform(ratio,0,0,ratio,0,0);f.clearRect(0,0,width,height);
      const scale=Math.min(width/1312,height/1199),w=1312*scale,h=1199*scale,x=(width-w)/2,y=(height-h)/2;
      f.globalAlpha=.5+Math.sin(time*.65)*.14;f.shadowColor=color(shift,.7);f.shadowBlur=5*ratio;f.drawImage(tint,x,y,w,h);
      f.shadowBlur=0;f.globalAlpha=.65;f.drawImage(tint,x,y,w,h);f.globalAlpha=1;
      report.frames++;
    }
    function tick(now) {
      raf=0;if(dead||document.hidden||!inView||motion.matches)return;
      if(now-last>=interval) {
        elapsed+=Math.min((now-last)/1000,.08);last=now;
        const before=performance.now();draw(elapsed);
        // Slow hardware automatically drops to 20fps; nothing runs in gameplay.
        if(performance.now()-before>15&&++expensive>12)interval=50;
      }
      raf=requestAnimationFrame(tick);
    }
    function wake() {
      cancelAnimationFrame(raf);raf=0;if(dead)return;
      const active=!document.hidden&&inView;
      report.state=active?(motion.matches?'static':'running'):'paused';last=performance.now();
      if(active) {draw(elapsed);if(!motion.matches)raf=requestAnimationFrame(tick);}
    }
    const resize=new ResizeObserver(size);resize.observe(stage);
    const intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;wake();});intersection.observe(stage);
    document.addEventListener('visibilitychange',wake);motion.addEventListener('change',wake);
    size();wake();
    return { destroy() {
      if(dead)return;dead=true;cancelAnimationFrame(raf);raf=0;
      resize.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',wake);motion.removeEventListener('change',wake);
      for(const c of [back,front,etching,tint]){c.width=1;c.height=1;c.remove();}
      back=front=etching=tint=null;flames.length=crystals.length=motes.length=0;
      report.state='disposed';report.buffers=0;
    }};
  }
  function sync() {
    if(!visible()){if(engine){engine.destroy();engine=null;}return;}
    if(!engine&&portrait.complete&&portrait.naturalWidth){
      // Canvas is an enhancement: the original knight and start controls always work.
      if(!window.ResizeObserver||!window.IntersectionObserver)return;
      engine=create();
    }
  }
  // A single passive title observer also supports returning to title without reload.
  const observer=new MutationObserver(sync);observer.observe(title,{attributes:true,attributeFilter:['class','style']});
  portrait.addEventListener('load',sync);
  window.addEventListener('pagehide',()=>{suspended=true;sync();});
  window.addEventListener('pageshow',()=>{suspended=false;sync();});
  sync();
})();
