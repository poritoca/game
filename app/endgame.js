/* 深淵の遺産 v1 — player.abyss にのみ保存。基礎能力・既存アイテムを変更しない。 */
(function (root) {
  'use strict';
  const STATS = ['attack', 'defense', 'speed', 'maxHp'];
  const LABELS = {attack:'攻撃', defense:'防御', speed:'速度', maxHp:'HP', salvage:'素材'};
  const SLOTS = ['刃', '護符', '核'];
  const RARITIES = ['魔法', '希少', '伝説', '神話'];
  const SETS = [
    {name:'焔王', icon:'◆', two:'攻撃 +25%', three:'攻撃 +35%・HP +15%', a:{attack:.25}, b:{attack:.35,maxHp:.15}},
    {name:'不落', icon:'⬡', two:'防御 +30%', three:'防御 +30%・HP +35%', a:{defense:.30}, b:{defense:.30,maxHp:.35}},
    {name:'雷駆', icon:'ϟ', two:'速度 +25%', three:'速度 +30%・攻撃 +20%', a:{speed:.25}, b:{speed:.30,attack:.20}},
    {name:'星詠', icon:'✧', two:'全能力 +10%', three:'全能力 +15%・素材 +20%', a:{attack:.1,defense:.1,speed:.1,maxHp:.1}, b:{attack:.15,defense:.15,speed:.15,maxHp:.15,salvage:.2}}
  ];
  // 12系統。旧品は原型(type=0)で性能を維持する。
  const TYPES = [
    {name:'原型',names:['刃','護符','核'],stats:['attack','maxHp','defense'],affinity:null,main:1,sub:1},
    {name:'猛攻',names:['大剣','戦旗','牙石'],stats:['attack','attack','attack'],affinity:'attack',main:1.1,sub:.9},
    {name:'堅守',names:['盾剣','城壁符','鉄心'],stats:['defense','defense','defense'],affinity:'defense',main:1.1,sub:.9},
    {name:'疾風',names:['双刃','風羽','瞬晶'],stats:['speed','speed','speed'],affinity:'speed',main:1.1,sub:.9},
    {name:'生命',names:['命剣','生命環','血晶'],stats:['maxHp','maxHp','maxHp'],affinity:'maxHp',main:1.1,sub:.9},
    {name:'探宝',names:['探鉱斧','羅針盤','宝珠'],stats:['attack','speed','defense'],affinity:'salvage',main:.9,sub:1.15},
    {name:'破城',names:['戦鎚','軍印','破砕石'],stats:['attack','defense','attack'],affinity:'defense',main:1.05,sub:.95},
    {name:'追撃',names:['刺剣','疾走環','雷針'],stats:['speed','attack','speed'],affinity:'attack',main:.95,sub:1.05},
    {name:'再生',names:['翠刃','聖杯','芽晶'],stats:['maxHp','defense','maxHp'],affinity:'maxHp',main:.95,sub:1.05},
    {name:'守護',names:['護身刀','守護輪','結界石'],stats:['defense','maxHp','defense'],affinity:'speed',main:1,sub:1},
    {name:'精密',names:['細剣','照準鏡','星針'],stats:['attack','speed','attack'],affinity:'speed',main:.9,sub:1.15},
    {name:'秘術',names:['儀式刀','秘典','霊珠'],stats:['defense','maxHp','speed'],affinity:'attack',main:.9,sub:1.15}
  ];
  const CODEX_TOTAL=SETS.length*SLOTS.length*RARITIES.length*TYPES.length;
  const typeOf=r=>TYPES[r.type||0]||TYPES[0];
  const relicName=r=>`${SETS[r.set].name}の${typeOf(r).names[r.slot]}`;
  const codexKey=r=>`${r.set}-${r.slot}-${r.rarity}-${r.type||0}`;
  const REGIONS = [
    {name:'熔火の回廊', set:0, stat:'attack', text:'敵の攻撃 +20% / 焔王が60%で出現'},
    {name:'黒曜の城塞', set:1, stat:'defense', text:'敵の防御 +25% / 不落が60%で出現'},
    {name:'雷鳴の尖塔', set:2, stat:'speed', text:'敵の速度 +20% / 雷駆が60%で出現'},
    {name:'星屑の霊廟', set:3, stat:'maxHp', text:'敵のHP +25% / 星詠が60%で出現'}
  ];
  const int = (v, d=0, max=1e12) => Number.isFinite(Number(v)) ? Math.max(0,Math.min(max,Math.floor(Number(v)))) : d;
  const safe = v => Math.max(1, Math.min(1e150, Number.isFinite(v) ? Math.floor(v) : 1e150));
  const empty = () => ({version:2, dry:0, clearDry:0, dust:0, xp:0, wins:0, battles:0, bosses:0, drops:0, pity:0, mythPity:0,
    serial:0, unlocked:1, best:0, clears:0, selectedTier:1, region:0, focus:-1, run:null,
    relics:[], equipped:[null,null,null], codex:[], research:{attack:0,defense:0,speed:0,maxHp:0},
    claimed:[], recent:[], autoSalvage:-1, filter:-1, sort:'new', starter:false});
  function normalize(raw) {
    const s = Object.assign(empty(), raw && typeof raw==='object' ? raw : {});
    for (const k of ['dry','clearDry','dust','xp','wins','battles','bosses','drops','pity','mythPity','serial','clears']) s[k]=int(s[k]);
    s.version=2; s.unlocked=Math.max(1,int(s.unlocked,1,9999)); s.best=int(s.best,0,9999);
    s.selectedTier=Math.max(1,Math.min(s.unlocked,int(s.selectedTier,1))); s.region=int(s.region,0,3);
    s.focus=[-1,0,1,2].includes(s.focus)?s.focus:-1;
    s.autoSalvage=[-1,0,1].includes(s.autoSalvage)?s.autoSalvage:-1;
    s.filter=[-1,0,1,2].includes(s.filter)?s.filter:-1; s.sort=['new','power'].includes(s.sort)?s.sort:'new';
    s.research=Object.fromEntries(STATS.map(k=>[k,int(s.research && s.research[k],0,10000)]));
    const ids=new Set();
    s.relics=(Array.isArray(s.relics)?s.relics:[]).filter(r=>r && typeof r==='object' && Number.isInteger(r.id) && r.id>0 && !ids.has(r.id) && ids.add(r.id)).slice(0,120).map(r=>({
      id:r.id, type:int(r.type,0,11), seen:r.seen!==false, slot:int(r.slot,0,2), set:int(r.set,0,3), rarity:int(r.rarity,0,3), level:Math.max(1,int(r.level,1,9999)),
      quality:Math.max(50,int(r.quality,50,100)), enhance:int(r.enhance,0,20), rerolls:int(r.rerolls), locked:!!r.locked,
      affixes:(Array.isArray(r.affixes)?r.affixes:[]).filter(a=>a && typeof a==='object').slice(0,3).map(a=>({stat:STATS.includes(a.stat)||a.stat==='salvage'?a.stat:'attack',roll:Math.max(40,int(a.roll,40,100))}))
    }));
    s.serial=Math.max(s.serial,...s.relics.map(r=>r.id));
    s.equipped=SLOTS.map((_,i)=>{const id=Array.isArray(s.equipped)?s.equipped[i]:null;return s.relics.some(r=>r.id===id&&r.slot===i)?id:null;});
    s.codex=[...new Set((Array.isArray(s.codex)?s.codex:[]).map(k=>typeof k==='string'&&/^\d-\d-\d$/.test(k)?k+'-0':k).filter(k=>typeof k==='string'&&/^\d-\d-\d-\d{1,2}$/.test(k)&&k.split('-').every((n,i)=>+n<([4,3,4,12][i]))))];
    s.claimed=[...new Set((Array.isArray(s.claimed)?s.claimed:[]).filter(k=>typeof k==='string'))].slice(0,200);
    s.recent=(Array.isArray(s.recent)?s.recent:[]).filter(k=>typeof k==='string').slice(0,8);
    s.starter=!!s.starter;
    if(s.run && typeof s.run==='object') s.run={tier:Math.max(1,Math.min(s.unlocked,int(s.run.tier,1))),region:int(s.run.region,0,3),wins:int(s.run.wins,0,4),losses:int(s.run.losses,0,2)};
    else s.run=null;
    return s;
  }
  const level = s => 1 + Math.floor(Math.sqrt(s.xp/40));
  const note = (s,t) => { s.recent.unshift(t); s.recent.length=Math.min(8,s.recent.length); };
  const value = r => Math.floor((8 + r.rarity*12 + Math.sqrt(r.level)*4)*(1+r.enhance*.08));
  const mainStat = r => typeOf(r).stats[r.slot];
  const mainValue = r => (.10 + r.rarity*.055)*(1+Math.sqrt(r.level)/8)*(r.quality/100)*(1+r.enhance*.05)*typeOf(r).main;
  const affixValue = (r,a) => (.04+r.rarity*.025)*(1+Math.sqrt(r.level)/16)*a.roll/100*typeOf(r).sub;
  const power = r => mainValue(r)+r.affixes.reduce((n,a)=>n+affixValue(r,a),0);
  const researchCost = (s,k) => Math.floor(35*Math.pow(1+s.research[k],1.4));
  const enhanceCost = r => Math.floor((22+r.rarity*15+Math.sqrt(r.level)*5)*Math.pow(1+r.enhance,1.45));
  const rerollCost = r => Math.floor((20+r.rarity*12+Math.sqrt(r.level)*3)*(1+Math.min(r.rerolls,20)*.15));
  function modifiers(s, equipped=s.equipped) {
    const out={attack:0,defense:0,speed:0,maxHp:0,salvage:0,sets:[0,0,0,0]};
    const perm=Math.min(1.5,(level(s)-1)*.004)+Math.min(48,s.codex.length)*.002+Math.max(0,s.codex.length-48)*.0002;
    for(const k of STATS) out[k]=perm+Math.sqrt(s.research[k])*.035;
    for(const id of equipped) {
      const r=s.relics.find(r=>r.id===id); if(!r) continue;
      out[mainStat(r)]+=mainValue(r); out.sets[r.set]++;
      for(const a of r.affixes) out[a.stat]+=affixValue(r,a);
    }
    out.sets.forEach((count,i)=>{if(count>=2)for(const [k,v] of Object.entries(SETS[i].a))out[k]+=v;if(count>=3)for(const [k,v] of Object.entries(SETS[i].b))out[k]+=v;});
    return out;
  }
  function rollRelic(s, opts={}, rng=Math.random) {
    let rarity=0; const roll=rng();
    // 昇格確定：伝説以上は12個以内、神話は60個以内。外れの連続を制限。
    const mythChance=.015+Math.min(.035,(opts.tier||0)*.001);
    if(s.mythPity>=59 || roll<mythChance) rarity=3;
    else if(s.pity>=11 || roll<.16+Math.min(.14,(opts.tier||0)*.004)) rarity=2;
    else if(roll<.52) rarity=1;
    if(opts.guardian) rarity=Math.max(1,rarity);
    if(opts.rarity!=null)rarity=opts.rarity;
    s.pity=rarity>=2?0:s.pity+1; s.mythPity=rarity===3?0:s.mythPity+1;
    let set, slot;
    if (opts.region!=null) {
      const target=REGIONS[opts.region].set, others=[0,1,2,3].filter(n=>n!==target);
      set=rng()<.6 ? target : others[Math.floor(rng()*others.length)];
    } else set=Math.floor(rng()*4);
    if (s.focus>=0) {
      const others=[0,1,2].filter(n=>n!==s.focus);
      slot=rng()<.7 ? s.focus : others[Math.floor(rng()*others.length)];
    } else slot=Math.floor(rng()*3);
    const ilvl=Math.max(1,Math.min(9999,1+(opts.tier||0)*5+Math.floor(Math.min(s.best,500)/2)+Math.floor(rng()*6)));
    const type=Math.floor(rng()*TYPES.length);
    const keys=['attack','defense','speed','maxHp','salvage']; const affixes=[];
    for(let i=0;i<Math.min(3,rarity+1);i++){const idx=i===0&&TYPES[type].affinity?keys.indexOf(TYPES[type].affinity):Math.floor(rng()*keys.length);affixes.push({stat:keys.splice(idx,1)[0],roll:40+Math.floor(rng()*61)});}
    s.drops++; return {id:++s.serial,type,seen:false,slot,set,rarity,level:ilvl,quality:50+Math.floor(rng()*51),affixes,enhance:0,rerolls:0,locked:false};
  }
  function acquire(s,r) {
    s.latest=r.id;
    const key=codexKey(r); const fresh=!s.codex.includes(key);
    if(fresh){s.codex.push(key);s.dust+=20+r.rarity*10;}
    // 初発見と伝説以上は自動分解しない。満杯でも新規ドロップ分の素材と図鑑登録を保持。
    if(s.relics.length>=120 || (!fresh && r.rarity<=s.autoSalvage)){
      s.dust+=value(r);note(s,`${relicName(r)} → 素材 +${value(r)}${fresh?'・初発見登録':''}`);
    } else {
      s.relics.push(r);
      note(s,`${fresh?'初発見！ ':''}${RARITIES[r.rarity]} ${relicName(r)} / ILv${r.level}`);
    }
    return r;
  }
  const missions = [
    ...[10,50,200,1000,5000,20000].map((n,i)=>({id:'wins'+n,name:`累計${n.toLocaleString()}勝`,key:'wins',goal:n,reward:80*Math.pow(3,i)})),
    ...[1,5,10,25,50,100,250,500,1000].map((n,i)=>({id:'depth'+n,name:`深度${n}踏破`,key:'best',goal:n,reward:120*Math.pow(2,i)})),
    ...[6,12,24,36,48,96,192,384,576].map((n,i)=>({id:'codex'+n,name:`図鑑${n}種`,key:'codex',goal:n,reward:150*(i+1)*(i+1)}))
  ];
  function finish(s, won, boss, rng=Math.random) {
    s.battles++;
    if(!won){s.xp+=3;s.dust+=2;if(s.run){s.run.losses++;if(s.run.losses>=3){note(s,'遠征終了：3敗。遺物・素材はすべて保持。');s.run=null;return {ended:true};}}return {};}
    s.wins++; if(boss)s.bosses++;
    const run=s.run; const tier=run?run.tier:0; const mods=modifiers(s);
    const gain=Math.floor((6+Math.sqrt(tier)*3+(boss?8:0))*(1+mods.salvage));
    s.dust+=gain;s.xp+=12+Math.floor(Math.sqrt(tier)*4)+(boss?12:0);
    s.dry++;
    const clear=run&&run.wins===4;
    // 最大1個/勝利。初踏破は確定、再踏破は25%（4踏破以内に保証）。
    const firstClear=clear&&tier>s.best;
    if(clear)s.clearDry++;
    const drop=firstClear || (clear&&(s.clearDry>=4||rng()<.25)) || s.dry>=20 || rng()<(boss?.20:.06);
    if(drop){acquire(s,rollRelic(s,{tier,region:run?run.region:null,guardian:!!clear},rng));s.dry=0;if(clear)s.clearDry=0;}
    if(run){run.wins++;if(run.wins>=5){
      const first=tier>s.best; s.best=Math.max(s.best,tier);s.unlocked=Math.max(s.unlocked,Math.min(9999,tier+1));s.clears++;
      const bonus=Math.floor(30+Math.sqrt(tier)*15)*(first?2:1);s.dust+=bonus;s.xp+=50+tier*2;

      note(s,`深度${tier}踏破！ ${first?'初踏破 / ':''}素材 +${bonus}${drop?'・希少以上獲得':''}`);
      s.run=null;s.selectedTier=s.unlocked;return {cleared:true,ended:true};
    }}
    return {};
  }
  root.AbyssEngine={TYPES,CODEX_TOTAL,typeOf,relicName,codexKey,STATS,LABELS,SLOTS,RARITIES,SETS,REGIONS,empty,normalize,level,value,mainStat,mainValue,affixValue,power,researchCost,enhanceCost,rerollCost,modifiers,rollRelic,acquire,finish,missions,safe};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.AbyssEngine;
  if(typeof document==='undefined')return;

  const E=root.AbyssEngine;
  let activePlayer=null, panel=null, tab='relics', page=0, selected=null, pending=null, lastFocus=null, saveBusy=false;
  const esc = v => String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number(v).toLocaleString('ja-JP',{maximumFractionDigits:0});
  const pct = v => (v*100).toFixed(1)+'%';
  function state() {
    const p=typeof player!=='undefined'?player:null;
    if(!p)return null;
    if(p!==activePlayer){p.abyss=normalize(p.abyss);activePlayer=p;pending=null;selected=null;page=0;}
    if(!p.abyss.starter){
      const s=p.abyss;s.starter=true;
      // 一度だけの導入報酬。旧セーブも同じ条件。
      const r={id:++s.serial,type:0,seen:false,slot:0,set:0,rarity:0,level:1,quality:70,affixes:[{stat:'maxHp',roll:60}],enhance:0,rerolls:0,locked:false};
      acquire(s,r);s.equipped[0]=r.id;note(s,'遺産の記録を開始。最初の遺物を装備しました。');
    }
    return p.abyss;
  }
  function mark(){if(typeof markLocalSaveDirty==='function')markLocalSaveDirty();updateSummary();}
  function updateSummary(){
    const s=state(),el=document.getElementById('abyssOpen');if(!s||!el)return;
    const count=s.relics.filter(r=>r.seen===false).length;
    const text='深淵';
    el.dataset.newCount=count?String(count):'';el.setAttribute('aria-label','深淵の遺産'+(count?'・未確認 '+count+' 個':''));
    if(el.textContent!==text)el.textContent=text;
  }
  function busy(){return !!root.__battleInProgress || !!root.__winnerGuessMiniGameActive;}
  function notify(t){const el=document.getElementById('abyssMessage');if(el)el.textContent=t;}
  function stop(){if(typeof root.stopAutoBattle==='function')root.stopAutoBattle();try{isAutoBattle=false;}catch(_){} }
  function button(action,text,extra='',disabled=false){return `<button type="button" data-action="${action}" ${extra} ${disabled?'disabled':''}>${text}</button>`;}
  function meter(value,max){return `<progress value="${value}" max="${max}" aria-label="進行 ${value} / ${max}"></progress>`;}
  function preview(s,r){const ids=s.equipped.slice();ids[r.slot]=r.id;const now=modifiers(s),next=modifiers(s,ids);return STATS.map(k=>{const diff=(1+next[k])/(1+now[k])-1;return `<span class="${diff>0?'ab-up':diff<0?'ab-down':''}">${LABELS[k]} ${diff>=0?'+':''}${pct(diff)}</span>`;}).join(' · ');}
  function name(r){return relicName(r);}
  function detail(s,r){
    return `<article class="ab-card ab-rarity-${r.rarity}"><span class="ab-eyebrow">${RARITIES[r.rarity]} · ILv ${r.level} · 品質 ${r.quality}/100</span><h3>${SETS[r.set].icon} ${name(r)} +${r.enhance}</h3>
      <p class="ab-mainstat">${LABELS[mainStat(r)]} +${pct(mainValue(r))}</p>
      <ul>${r.affixes.map((a,i)=>`<li>${LABELS[a.stat]} +${pct(affixValue(r,a))} <small>性能 ${a.roll}/100</small> ${button('reroll','この特性を再抽選',`data-id="${r.id}" data-affix="${i}"`,s.dust<rerollCost(r))}</li>`).join('')}</ul>
      <p class="ab-muted">再抽選：素材 ${num(rerollCost(r))}。旧・新を比較して選べます（費用は抽選時に消費）。</p>
      <p>装備変更後の戦闘能力の変化<br>${preview(s,r)}</p>
      <div class="ab-actions">${button('equip',s.equipped[r.slot]===r.id?'装備中・外す':'装備する',`data-id="${r.id}"`)}${button('lock',r.locked?'保護を解除':'保護する',`data-id="${r.id}"`)}
      ${button('enhance',r.enhance>=20?'強化上限 +20':`確定強化 +${r.enhance+1} / 素材 ${num(enhanceCost(r))}`,`data-id="${r.id}"`,r.enhance>=20||s.dust<enhanceCost(r))}
      ${button('salvage',`分解 / 素材 +${value(r)}`,`data-id="${r.id}"`,r.locked||s.equipped.includes(r.id))}</div>
      <p class="ab-muted">2セット：${SETS[r.set].two} / 3セット：${SETS[r.set].three}（2セット効果に加算）</p></article>`;
  }
  function rating(r){return Math.round((mainValue(r)+r.affixes.reduce((n,a)=>n+affixValue(r,a)*(a.stat==='salvage'?.35:1),0))*1000);}
  function lootCard(s,r){
    const current=s.relics.find(x=>x.id===s.equipped[r.slot]);
    const delta=current?rating(r)-rating(current):rating(r);
    const bar=Math.min(100,100*Math.log1p(rating(r))/Math.log(5001));
    return `<button class="ab-loot ab-rarity-${r.rarity}${r.seen===false?' ab-new':''}" data-action="inspect" data-id="${r.id}" aria-expanded="${selected===r.id}">
      <span class="ab-loot-head"><span>${RARITIES[r.rarity]} · ${SLOTS[r.slot]}</span><span>${s.equipped.includes(r.id)?'◆ 装備':r.seen===false?'NEW':''}${r.locked?' · 保護':''}</span></span>
      <strong>${name(r)}${r.enhance?' +'+r.enhance:''}</strong>
      <span class="ab-powerline"><b>${num(rating(r))}<small> 性能</small></b><span class="${delta>=0?'ab-up':'ab-down'}">${s.equipped.includes(r.id)?'装備中':(delta>=0?'▲ +':'▼ ')+num(delta)}</span></span>
      <span class="ab-powertrack" role="meter" aria-label="性能目安" aria-valuemin="0" aria-valuemax="5000" aria-valuenow="${Math.min(5000,rating(r))}"><span style="width:${bar}%"></span></span>
      <span class="ab-loot-foot">${LABELS[mainStat(r)]} +${pct(mainValue(r))}<span>品質 ${r.quality} · Lv${r.level}</span></span></button>`;
  }
  function render(){
    const s=state();if(!s||!panel)return;updateSummary();
    const mods=modifiers(s),lvl=level(s);
    document.getElementById('abyssStats').innerHTML=`<span>素材 <b>${num(s.dust)}</b></span><span>継承 <b>Lv${lvl}</b></span><span>発見 <b>${s.codex.length}/${CODEX_TOTAL}</b></span>`;
    document.getElementById('abyssTabs').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
    let html='';
    if(tab==='relics'){
      let list=s.relics.filter(r=>s.filter<0||r.slot===s.filter).sort(s.sort==='power'?(a,b)=>rating(b)-rating(a):(a,b)=>b.id-a.id);
      page=Math.min(page,Math.max(0,Math.ceil(list.length/12)-1));
      html=`<div class="ab-equipment">${SLOTS.map((n,i)=>{const r=s.relics.find(r=>r.id===s.equipped[i]);return button('inspect',`${n}<br><b>${r?name(r):'未装備'}</b>`,r?`data-id="${r.id}"`:'',!r);}).join('')}</div>
      <div class="ab-setchips">${mods.sets.map((n,i)=>`<span class="${n>=2?'active':''}">${SETS[i].name} ${n}/3</span>`).join('')}</div>
      <div class="ab-controls"><label>所持 ${s.relics.length}/120<select id="abFilter"><option value="-1">全部位</option>${SLOTS.map((n,i)=>`<option value="${i}" ${s.filter===i?'selected':''}>${n}</option>`).join('')}</select></label><label>並び順<select id="abSort"><option value="new" ${s.sort==='new'?'selected':''}>新しい順</option><option value="power" ${s.sort==='power'?'selected':''}>性能の高い順</option></select></label></div>
      <div class="ab-lootlist">${list.slice(page*12,page*12+12).map(r=>lootCard(s,r)+(selected===r.id?detail(s,r):'')).join('')||'<p class="ab-empty">まだ遺物がありません。戦闘や初踏破で探しましょう。</p>'}</div>
      <div class="ab-actions">${button('prev','前へ','',page===0)}<span>${page+1}/${Math.max(1,Math.ceil(list.length/12))}</span>${button('next','次へ','',(page+1)*12>=list.length)}</div>
      <details class="ab-card"><summary>絞り込み・分解</summary><label>狙う部位（70%）<select id="abFocus"><option value="-1">指定なし</option>${SLOTS.map((n,i)=>`<option value="${i}" ${s.focus===i?'selected':''}>${n}</option>`).join('')}</select></label>
      <label>自動分解<select id="abAuto"><option value="-1">しない</option><option value="0" ${s.autoSalvage===0?'selected':''}>発見済みの魔法</option><option value="1" ${s.autoSalvage===1?'selected':''}>発見済みの希少以下</option></select></label>${button('bulk','未装備・未保護の魔法を分解')}<p class="ab-muted">初発見・伝説以上は自動分解対象外。満杯時は新規入手品を図鑑登録後に素材化します。</p></details>
      <details class="ab-card"><summary>性能とセット効果</summary><p>性能は能力補正量の目安。素材特性は35%の重みで計算。矢印は同部位の装備との性能差です。バーは固定基準で伸び、5000で満タンになります。</p><p>異なる能力やセットとの相性は別です。タップした詳細の能力増減で最終比較できます。</p>${SETS.map(set=>`<p>${set.name}：2個 ${set.two} / 3個 ${set.three}</p>`).join('')}</details>`;
    }else if(tab==='expedition'){
      const run=s.run,tier=run?run.tier:s.selectedTier;
      html=`<div class="ab-hero"><h3>深度 ${tier} <small>${run?'遠征中':'挑戦準備'}</small></h3><p>${run?`${run.wins}/5勝 · ${run.losses}/3敗`:'5勝で踏破 · 3敗で帰還'}</p>${meter(run?run.wins:0,5)}<p>${run?REGIONS[run.region].name:'初踏破で遺物を必ず獲得'}</p></div>
      <div class="ab-controls"><label>深度（最大${s.unlocked}）<input id="abTier" type="number" inputmode="numeric" min="1" max="${s.unlocked}" value="${s.selectedTier}" ${run?'disabled':''}></label><label>領域<select id="abRegion" ${run?'disabled':''}>${REGIONS.map((r,i)=>`<option value="${i}" ${s.region===i?'selected':''}>${r.name}</option>`).join('')}</select></label></div>
      <div class="ab-actions">${run?button('retreat','帰還する'):button('begin','遠征を開始')}${button('close','閉じて戦闘へ')}</div>
      <details class="ab-card"><summary>報酬・難易度</summary><p>通常勝利6%、ボス勝利20%。20勝連続で拾えなければ確定。初踏破は確定、再踏破は25%の追加抽選と4踏破以内の保証。1戦で最大1個。</p><p>伝説以上まで最大${12-s.pity}個、神話まで最大${60-s.mythPity}個。敗北でも獲得済みの品を保持します。</p><p>${REGIONS[s.region].text}。敵能力 ×${Math.pow(1.15,Math.min(1000,tier)).toExponential(2)}、守護者はさらに×1.6。既存の連勝補正も有効。</p></details>
      <details class="ab-card"><summary>最近の発見</summary><ul>${s.recent.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></details>`;
    }else if(tab==='research'){
      html=`<div class="ab-grid">${STATS.map(k=>`<article class="ab-card"><h3>${LABELS[k]} Lv${num(s.research[k])}</h3><p>+${pct(Math.sqrt(s.research[k])*.035)}</p>${button('research',`研究 · ${num(researchCost(s,k))}素材`,`data-stat="${k}"`,s.dust<researchCost(s,k)||s.research[k]>=10000)}</article>`).join('')}</div>
      <details class="ab-card"><summary>達成報酬</summary><div class="ab-grid">${missions.map(m=>{const progress=m.key==='codex'?s.codex.length:s[m.key],done=s.claimed.includes(m.id);return `<article class="ab-card"><b>${m.name}</b>${meter(Math.min(progress,m.goal),m.goal)}${button('claim',done?'受取済み':`${num(m.reward)}素材を受取`,`data-mission="${m.id}"`,done||progress<m.goal)}</article>`;}).join('')}</div></details>
      <details class="ab-card"><summary>戦闘補正・継承</summary><p>${STATS.map(k=>`${LABELS[k]} +${pct(mods[k])}`).join(' / ')}</p><p>継承Lv${lvl} · 次まで経験値 ${num(40*lvl*lvl-s.xp)}。研究補正は3.5% × √Lv。</p></details>`;
    }else{
      html=`<p class="ab-muted">144の形状 × 4レアリティ。集めた記録は分解しても残ります。</p>${SETS.map((set,i)=>`<details class="ab-card"><summary>${set.icon} ${set.name} <b>${s.codex.filter(k=>k.startsWith(i+'-')).length}/144</b></summary>${TYPES.map((type,t)=>`<h4>${type.name}</h4><table><thead><tr><th>形状</th>${RARITIES.map(r=>`<th>${r}</th>`).join('')}</tr></thead><tbody>${SLOTS.map((n,j)=>`<tr><th>${type.names[j]}</th>${RARITIES.map((_,k)=>`<td aria-label="${type.names[j]} ${RARITIES[k]} ${s.codex.includes(`${i}-${j}-${k}-${t}`)?'発見済み':'未発見'}">${s.codex.includes(`${i}-${j}-${k}-${t}`)?'◆':'－'}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('')}</details>`).join('')}`;
    }
    if(pending){html=`<div class="ab-choice" role="alert"><h3>特性を選ぶ</h3><p>元：${LABELS[pending.old.stat]} ${pending.old.roll}/100<br>新：${LABELS[pending.next.stat]} ${pending.next.roll}/100</p><div class="ab-actions">${button('keep','元を残す')}${button('accept','新しくする')}</div></div>`+html;}
    document.getElementById('abyssBody').innerHTML=html;
  }
  function open(){
    if(!state())return;
    if(panel.classList.contains('hidden'))root.toggleTopFold('abyss');
  }
  function close(){pending=null;panel.classList.add('hidden');root.__syncTopFoldButtons(null,false);root.syncCloseTabButtons?.();}
  async function save(){
    if(saveBusy||busy())return;saveBusy=true;notify('保存中…');
    try{
      // 通常/進捗の両方に同じスナップショットを保存。ロード時の別状態混在を防ぐ。
      await root.saveToLocalStorage();
      const code=localStorage.getItem('rpgLocalSave');if(!code)throw Error('save missing');
      localStorage.setItem('rpgLocalProgressSave',code);
      localStorage.setItem('rpgLocalProgressMeta',JSON.stringify({remainingBattles:root.remainingBattles??null,targetBattles:root.targetBattles??null,battleCount:root.battleCount??0,currentStreak:root.currentStreak??0,timestamp:Date.now()}));
      notify('遺産とゲーム進捗を保存しました。');
    }catch(e){notify('保存できませんでした。設定からセーブデータを書き出してください。');console.error('Abyss save failed',e);}
    finally{saveBusy=false;}
  }
  function act(ev){
    const b=ev.target.closest('[data-action]');if(!b||b.disabled)return;
    const action=b.dataset.action,s=state();if(!s)return;
    if(action==='close'){close();return;}
    if(action==='save'){save();return;}
    if(action==='tab'){tab=b.dataset.tab;render();return;}
    if(busy()||saveBusy){notify('処理完了までお待ちください。');return;}
    if(pending&&!['keep','accept'].includes(action)){notify('先に再抽選の結果を選んでください。');return;}
    const r=s.relics.find(r=>r.id===Number(b.dataset.id));
    if(action==='begin'){
      if(s.run)return;
      s.selectedTier=Math.max(1,Math.min(s.unlocked,int(document.getElementById('abTier').value,1)));
      s.region=int(document.getElementById('abRegion').value,0,3);
      s.run={tier:s.selectedTier,region:s.region,wins:0,losses:0};note(s,`深度${s.run.tier} / ${REGIONS[s.region].name}へ出発。`);
    }else if(action==='retreat'){s.run=null;note(s,'遠征から帰還。獲得した遺物・素材は保持。');}
    else if(action==='inspect'&&r){
      selected=selected===r.id?null:r.id;r.seen=true;
      if(s.filter>=0&&s.filter!==r.slot)s.filter=-1;
      const ordered=s.relics.filter(x=>s.filter<0||x.slot===s.filter).sort(s.sort==='power'?(a,b)=>rating(b)-rating(a):(a,b)=>b.id-a.id);
      page=Math.max(0,Math.floor(ordered.findIndex(x=>x.id===r.id)/12));
    }
    else if(action==='equip'&&r)s.equipped[r.slot]=s.equipped[r.slot]===r.id?null:r.id;
    else if(action==='lock'&&r)r.locked=!r.locked;
    else if(action==='enhance'&&r&&r.enhance<20&&s.dust>=enhanceCost(r)){s.dust-=enhanceCost(r);r.enhance++;}
    else if(action==='salvage'&&r&&!r.locked&&!s.equipped.includes(r.id)){
      if(!root.confirm(`${name(r)}（${RARITIES[r.rarity]}）を分解して素材${value(r)}にしますか？`))return;
      s.dust+=value(r);s.relics=s.relics.filter(v=>v.id!==r.id);selected=null;
    }else if(action==='bulk'){
      const targets=s.relics.filter(r=>r.rarity===0&&!r.locked&&!s.equipped.includes(r.id));const gain=targets.reduce((n,r)=>n+value(r),0);
      if(!targets.length){notify('分解対象がありません。');return;}
      if(!root.confirm(`魔法遺物${targets.length}個を分解し、素材${gain}を獲得しますか？`))return;
      s.dust+=gain;const ids=new Set(targets.map(r=>r.id));s.relics=s.relics.filter(r=>!ids.has(r.id));
    }else if(action==='reroll'&&r&&s.dust>=rerollCost(r)){
      const index=int(b.dataset.affix);if(!r.affixes[index])return;
      const pool=[...STATS,'salvage'].filter(k=>!r.affixes.some((a,i)=>i!==index&&a.stat===k));
      s.dust-=rerollCost(r);r.rerolls++;
      pending={id:r.id,index,old:{...r.affixes[index]},next:{stat:pool[Math.floor(Math.random()*pool.length)],roll:40+Math.floor(Math.random()*61)}};
    }else if(action==='keep')pending=null;
    else if(action==='accept'&&pending){const target=s.relics.find(r=>r.id===pending.id);if(target)target.affixes[pending.index]=pending.next;pending=null;}
    else if(action==='research'&&STATS.includes(b.dataset.stat)){
      const k=b.dataset.stat,cost=researchCost(s,k);if(s.dust<cost||s.research[k]>=10000)return;s.dust-=cost;s.research[k]++;
    }else if(action==='claim'){
      const m=missions.find(m=>m.id===b.dataset.mission);if(!m||s.claimed.includes(m.id)||(m.key==='codex'?s.codex.length:s[m.key])<m.goal)return;s.dust+=m.reward;s.claimed.push(m.id);
    }else if(action==='prev')page=Math.max(0,page-1);else if(action==='next')page++;
    mark();render();notify('変更はセーブに含まれます。終了前に保存してください。');
  }
  function mount(){
    const host=document.getElementById('gameScreen');if(!host)return;
    const nav=host.querySelector('.top-fold-panel');
    const trigger=document.createElement('button');trigger.id='abyssOpen';trigger.className='top-fold-btn';trigger.dataset.kind='abyss';trigger.type='button';trigger.textContent='深淵';trigger.addEventListener('click',()=>root.toggleTopFold('abyss'));nav.appendChild(trigger);
    panel=document.createElement('section');panel.id='abyssPanel';panel.className='hidden';panel.setAttribute('aria-labelledby','abyssTitle');
    panel.innerHTML='<div class="ab-shell"><header><div><span class="ab-eyebrow">収集・厳選</span><h2 id="abyssTitle">深淵の遺産</h2></div><button id="abyssClose" type="button" data-action="close" aria-label="遺産を閉じて戦闘へ戻る">閉じる</button></header><div id="abyssStats"></div><nav id="abyssTabs" aria-label="遺産メニュー"><button data-action="tab" data-tab="expedition">遠征</button><button data-action="tab" data-tab="relics">遺物</button><button data-action="tab" data-tab="research">研究</button><button data-action="tab" data-tab="codex">図鑑</button></nav><div id="abyssBody"></div><footer><button data-action="save" type="button">遺産と進捗を保存</button><p id="abyssMessage" role="status" aria-live="polite">再開するときは「つづきから → 中断」。</p></footer></div>';
    nav.after(panel);panel.addEventListener('click',act);
    panel.addEventListener('change',ev=>{
      const s=state();if(!s||busy()||saveBusy)return;
      const id=ev.target.id,v=Number(ev.target.value);
      if(id==='abFilter'){s.filter=[-1,0,1,2].includes(v)?v:-1;page=0;}
      else if(id==='abSort')s.sort=ev.target.value;
      else if(id==='abFocus')s.focus=[-1,0,1,2].includes(v)?v:-1;
      else if(id==='abAuto')s.autoSalvage=[-1,0,1].includes(v)?v:-1;
      else if(id==='abRegion'&&!s.run)s.region=int(v,0,3);
      else if(id==='abTier'&&!s.run)s.selectedTier=Math.max(1,Math.min(s.unlocked,int(v,1)));
      mark();render();
    });
    panel.addEventListener('keydown',ev=>{
      if(ev.key==='Escape'){ev.preventDefault();close();}

    });
  }
  let combat=null;
  root.Abyss={state,open,render,updateSummary,
    onTabOpen(){stop();if(busy())return false;render();return true;},
    onTabClose(){pending=null;},
    blocksBattle:()=>!!(panel&&!panel.classList.contains('hidden'))||saveBusy,
    prepare(p,e,log){
      const s=state();if(!s)return;const mods=modifiers(s);
      combat={player:p,battleId:root.battleId,base:Object.fromEntries(STATS.map(k=>[k,p[k]])),settled:false};
      for(const k of STATS)p[k]=safe(p[k]*(1+mods[k]));p.hp=p.maxHp;
      if(s.run){const run=s.run,reg=REGIONS[run.region],guardian=run.wins===4,mult=Math.pow(1.15,Math.min(1000,run.tier))*(guardian?1.6:1);
        for(const k of STATS)e[k]=safe(e[k]*mult*(k===reg.stat?(['defense','maxHp'].includes(k)?1.25:1.20):1));e.hp=e.maxHp;
        log.push(`【深淵】深度${run.tier} ${REGIONS[run.region].name} / ${run.wins+1}戦目${guardian?'・守護者':''} / 追加倍率 x${mult.toFixed(2)}`);
      }
      log.push(`【遺産】${STATS.map(k=>`${LABELS[k]} +${pct(mods[k])}`).join(' / ')}`);
    },
    restore(p){
      if(!combat||combat.player!==p)return;
      // 戦闘限定倍率を基礎成長へ混入させない。勝敗は呼び出し前に確定済み。
      const ratio=Math.max(0,Math.min(1,p.hp/Math.max(1,p.maxHp)));
      for(const k of STATS)p[k]=combat.base[k];p.hp=Math.floor(p.maxHp*ratio);
    },
    finish(won,boss,log){
      if(!combat||combat.settled||combat.battleId!==root.battleId)return;combat.settled=true;
      const s=state();if(!s)return;const before=s.drops,oldLv=level(s),result=finish(s,won,boss);
      if(s.drops>before){
        log.push(`【遺産の戦利品】${s.recent[0]}`);
        const item=s.relics.find(r=>r.id===s.latest);
        if(item){
          let toast=document.getElementById('abyssLootToast');if(!toast){toast=document.createElement('button');toast.id='abyssLootToast';toast.type='button';document.body.appendChild(toast);}
          toast.onclick=()=>{toast.hidden=true;tab='relics';selected=item.id;s.filter=-1;s.sort='new';page=0;item.seen=true;mark();open();};
          toast.className='ab-rarity-'+item.rarity;toast.innerHTML='<small>'+RARITIES[item.rarity]+' 発見</small><strong>'+esc(name(item))+'</strong><span>性能 '+num(rating(item))+' · タップで確認</span>';toast.hidden=false;
          clearTimeout(root.__abyssLootTimer);root.__abyssLootTimer=setTimeout(()=>{toast.hidden=true;},4500);
        }
      }
      if(level(s)>oldLv)log.push(`【継承】Lv${oldLv} → Lv${level(s)}`);
      if(result.ended){stop();log.push(`【深淵】${s.recent[0]}`);if(typeof showCustomAlert==='function')showCustomAlert(esc(s.recent[0])+'<br>「深淵の遺産」で戦利品を確認・保存できます。',3500);}
      mark();
    },
    refresh(){state();updateSummary();},
    cancel(){if(combat&&!combat.settled)this.restore(combat.player);combat=null;}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof window!=='undefined'?window:globalThis);
