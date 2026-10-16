/* DFCH Recruit V2.5.0 — independent read-only theoretical analytics and slim totals. */
(() => {
  'use strict';
  const D=window.DFCH_DATA,C=window.DFCHRecruitConfig,
    B=window.DFCHRecruitBonus,S=window.DFCHRecruitStatus,T=window.DFCHRecruitStats;
  const $=id=>document.getElementById(id);
  if(!D||!C||!B||!S||!T){$('statsNotice').textContent='統計資料載入失敗，請重新整理。';return;}
  const guides=new Map((window.DFCHHeroPreferences?.heroes||[]).map(x=>[x.index,x]));
  const names=['普通','稀有','老兵','天才'];
  const numbers=n=>(Number(n)||0).toLocaleString('zh-TW');
  const pct=(n,digits=3)=>{
    if(!Number.isFinite(n)||n<=0)return '0%';
    const a=n*100,step=10**(-digits);
    return a<step?'<'+step.toFixed(digits)+'%':a.toFixed(digits)+'%';
  };
  const el=(tag,cls,label)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(label!==undefined)e.textContent=String(label);return e;};
  const nameOf=id=>guides.get(id)?.name||D.heroRoster[String(id)]?.name||('英靈 '+id);
  function current(){
    let state={};
    try{state=JSON.parse(localStorage.getItem('dfch-recruit-v1-independent')||'null')||{};}catch(_){}
    return state;
  }
  const origin=current();
  const startPool=Number.isInteger(origin.pool)&&origin.pool>=0&&origin.pool<9?origin.pool:0;
  function poolList(){
    for(let i=0;i<9;i++){
      const option=el('option','',D.poolNames[C.keys[i]]||C.keys[i]);option.value=String(i);
      $('analysisPool').append(option);
      const scope=option.cloneNode(true);$('scopePool').append(scope);
    }
    $('analysisPool').value=String(startPool);
  }
  function activeTheory(){
    const state=current(),pool=Number($('analysisPool').value)||0;
    const seen=Array.isArray(state.seen)?state.seen:[];
    const six=C.six[pool].filter(id=>!seen.includes(id));
    const weights=B.getModifiedWeights(C.weights[pool],pool,six.length>0,
      !!state.bonusValkyrja,state.poolBonusOwned||{});
    const total=weights.reduce((a,b)=>a+b,0);
    const probs=weights.map(x=>total?x/total:0);
    return {state,pool,seen,six,probs,ability731:B.geniusBonus(state.maneLevel,state.emmaLevel)};
  }
  function statCard(label,value,sub){
    const card=el('div','stat-card');card.append(el('small','',label),el('strong','',value));
    if(sub)card.append(el('em','',sub));return card;
  }
  function rerenderHeroOptions(pool,chosen){
    const chooser=$('analysisHero');chooser.replaceChildren();
    const k=C.keys[pool],p=D.poolRarityRoster[k]||{};
    for(let star=3;star<=6;star++){
      const heroes=star===6?C.six[pool]:(p[String(star)]||[]);
      for(const id of heroes){
        const option=el('option','',star+'★ '+nameOf(id));
        option.value=star+':'+id;
        chooser.append(option);
      }
    }
    if(chosen&&Array.from(chooser.options).some(e=>e.value===chosen))chooser.value=chosen;
    else if(chooser.options.length)chooser.selectedIndex=0;
  }
  function renderTheory(resetHero=false){
    const v=activeTheory(),pool=v.pool;
    $('theoryRarities').replaceChildren();
    v.probs.forEach((p,i)=>$('theoryRarities').append(statCard((i+3)+' 星',pct(p,4))));
    const global=v.state.bonusValkyrja?'已持有':'未持有';
    const extra=B.poolArtifact(pool);
    const owned=!!(extra&&v.state.poolBonusOwned?.[String(pool)]);
    $('theorySettings').textContent='女武神的蜜酒：'+global+
      (extra?' · '+extra.name+'：'+(owned?'已持有':'未持有'):' · 本池無指定加成神器')+
      ' · 天才加成：+'+v.ability731+'%';
    const progress=v.state.progress?.[pool]||{count:0,round:0};
    const count=Number.isInteger(progress.count)?progress.count:0;
    const round=Number.isInteger(progress.round)?progress.round:0;
    const ceil=C.publicCeiling[pool];
    const forced=count===49?(ceil&&round+1>=ceil&&v.six.length?'第 50 抽首位保底六星':'第 50 抽首位保底至少五星'):
      '尚未到第 50 抽；下次進度 '+(count+1)+'/50';
    $('theoryPity').textContent='保底狀態：'+forced+
      '。上方與下表為普通候選基礎機率，不含保底與同輪六星限制。';
    const rows=$('theoryHeroes');rows.replaceChildren();
    const k=C.keys[pool],five=D.poolRarityRoster[k]?.['5']||[];
    for(const [star,ids] of [[5,five],[6,v.six]]){
      for(const id of ids){
        const row=el('tr');
        const n=ids.length?v.probs[star-3]/ids.length:0;
        row.append(el('td','',star+'★'),el('td','',nameOf(id)),el('td','',pct(n,5)));
        rows.append(row);
      }
    }
    if(!rows.children.length){
      const row=el('tr');const cell=el('td','', '本池沒有尚可抽取的五星／六星');
      cell.colSpan=3;row.append(cell);rows.append(row);
    }
    if(resetHero)rerenderHeroOptions(pool);
    renderSpeed();
  }
  function renderSpeed(){
    const [starText,idText]=($('analysisHero').value||'').split(':');
    const star=Number(starText),id=Number(idText),v=activeTheory();
    const data=S.speedProbabilities(id,star,v.ability731);
    if(!data){$('gRate').textContent='—';$('slowRate').textContent='—';return;}
    $('gRate').textContent=pct(data.g,5);
    $('slowRate').textContent=pct(data.zero,6);
    $('speedNote').textContent=(data.fixed?'固定六星模板':'依角色的常態速度初始等級與特殊類型加權')+
      ' · '+star+'★ '+nameOf(id)+
      (star<=4?' · 天才神器累計 +'+v.ability731+'%':' · 模板強制類型');
    const body=$('speedTypes');body.replaceChildren();
    for(const type of data.rows){
      if(type.chance<=0)continue;
      const row=el('tr');
      row.append(el('td','',type.name),el('td','',pct(type.chance,3)),
        el('td','',pct(type.g,5)),el('td','',pct(type.zero,6)));
      body.append(row);
    }
  }
  function renderObserved(){
    const source=T.read(),scope=Number($('scopePool').value);
    const indices=scope===-1?C.keys.map((_,i)=>i):[scope];
    const bucket=T.sum(source,indices);
    const side=$('countMode').value==='obtained'?'obtained':'candidates';
    const b=bucket[side],total=b.rarity.reduce((a,v)=>a+v,0);
    $('roundsTotal').textContent=numbers(bucket.rounds);
    $('observedLabel').textContent=side==='obtained'?'正式取得總數':'候選總數';
    $('observedTotal').textContent=numbers(total);
    $('observedG').textContent=numbers(b.g);
    $('observedSlow').textContent=numbers(b.slow);
    $('observedRarities').replaceChildren();
    b.rarity.forEach((v,i)=>$('observedRarities').append(statCard((i+3)+' 星',numbers(v),pct(total?v/total:0,2))));
    const types=$('humanScope').value==='types'?b.types:b.lowTypes;
    const typeTotal=types.reduce((a,v)=>a+v,0);
    $('observedTypes').replaceChildren();
    for(let i=0;i<4;i++){
      const row=el('tr');row.append(el('td','',names[i]),el('td','',numbers(types[i])),el('td','',pct(typeTotal?types[i]/typeTotal:0,3)));
      $('observedTypes').append(row);
    }
    $('observedHeroes').replaceChildren();
    const ranked=Object.entries(b.heroes).filter(([id,n])=>Number(n)>0)
      .sort((a,b)=>Number(b[1])-Number(a[1])||Number(a[0])-Number(b[0]));
    if(!ranked.length){
      const row=el('tr'),cell=el('td','','尚無五星／六星紀錄');cell.colSpan=2;row.append(cell);$('observedHeroes').append(row);
    }else for(const [id,n] of ranked){
      const row=el('tr');row.append(el('td','',nameOf(Number(id))),el('td','',numbers(n)));$('observedHeroes').append(row);
    }
  }
  poolList();
  rerenderHeroOptions(startPool);
  $('analysisPool').addEventListener('change',()=>renderTheory(true));
  $('analysisHero').addEventListener('change',renderSpeed);
  for(const id of ['scopePool','countMode','humanScope'])$(id).addEventListener('change',renderObserved);
  $('clearStats').addEventListener('click',()=>{
    if(!confirm('確定只清除第二頁的所有累積統計？第一頁最近50筆、保底及已取得六星完全不會更動。'))return;
    if(!T.clear()){$('statsNotice').textContent='無法清除，請檢查瀏覽器儲存權限。';return;}
    renderObserved();
    $('statsNotice').textContent='第二頁累積統計已清空；第一頁資料保留。';
  });
  window.addEventListener('storage',e=>{
    if(e.key===T.key)renderObserved();
    if(e.key==='dfch-recruit-v1-independent')renderTheory();
  });
  renderTheory();
  renderObserved();
})();