(() => {
  const KEY='dfch-account-settings-v2',A=window.DFCHArtifacts,keys=Object.keys(window.DFCHMaps),clone=x=>JSON.parse(JSON.stringify(x));
  const defaults=()=>({schema:2,owned:{[A.ids.glasses]:1},flags:[],allExplored:false,rates:{}});
  function validate(s) {
    if(s?.schema!==2||!s.owned||Array.isArray(s.owned)||typeof s.owned!=='object'||!Array.isArray(s.flags)||typeof s.allExplored!=='boolean'||!s.rates||Array.isArray(s.rates)||typeof s.rates!=='object')throw new Error('帳號設定格式錯誤');
    for(const [id,n] of Object.entries(s.owned))if(!/^\d+$/.test(id)||!Number.isSafeInteger(n)||n<0)throw new Error('神器持有量無效');
    for(const [key,n] of Object.entries(s.rates))if(!keys.includes(key)||!Number.isFinite(n)||n<0||n>100)throw new Error('探索率無效');
    if(s.flags.some(n=>!Number.isSafeInteger(n)||n<0))throw new Error('解鎖狀態無效');
    return s;
  }
  let state=defaults(),error=null;
  try {
    const raw=localStorage.getItem(KEY);
    if(raw)state=validate(JSON.parse(raw));
    else {
      // First v2 visit: preserve known ownership and exploration from v1 continuous records.
      const old=JSON.parse(localStorage.getItem('dfch-expedition-records-v1')||'null');
      const artifactIds=new Set(Object.values(window.DFCHMaps).flatMap(d=>d.rewardMasters.filter(r=>r.sourceTable==='ArtifactTable').map(r=>String(r.rewardId))));
      for(const [key,record] of Object.entries(old?.modes?.continuous??{})) {
        if(!keys.includes(key))continue;
        for(const [id,n] of Object.entries(record.latest?.saved?.owned??{}))if(artifactIds.has(id))state.owned[id]=Math.max(state.owned[id]??0,n);
        state.flags.push(...(record.latest?.saved?.flags??[]));state.rates[key]=record.latest?.completionRate??0;
      }
      state.flags=[...new Set(state.flags)];validate(state);
    }
  } catch(e){error=`無法讀取帳號設定：${e.message}。原存檔未覆寫。`;}
  const el=id=>document.getElementById(id);
  const status=()=>{el('accountSaveStatus').textContent=error??'設定自動保存 · 切換地圖共用神器';};
  function save(next,recover=false) {
    if(error&&!recover)throw new Error(error);
    validate(next);
    try{localStorage.setItem(KEY,JSON.stringify(next));state=next;error=null;}
    catch(e){error=`無法保存帳號設定：${e.message}`;status();throw new Error(error);}
    status();
  }
  function notify(){window.dispatchEvent(new Event('dfch-account-change'));}
  function setOwned(id,n) {const next=clone(state);next.owned[id]=n;save(next);notify();}
  function setRate(key,n) {const next=clone(state);next.rates[key]=n;save(next);notify();}
  const rate=key=>state.allExplored?100:state.rates[key]??0;
  function commit(result,key) {
    const next=clone(state);
    const known=new Set([...A.catalog,...Object.values(window.DFCHMaps).flatMap(d=>d.rewardMasters.filter(r=>r.sourceTable==='ArtifactTable'))].map(r=>String(r.rewardId)));
    for(const [id,n] of Object.entries(result.saved.owned))if(known.has(id))next.owned[id]=n;
    next.flags=[...new Set([...next.flags,...result.saved.flags])];if(!next.allExplored)next.rates[key]=result.completionRate;save(next);
  }
  function render() {
    for(const input of document.querySelectorAll('[data-account-artifact]')) {
      input.setCustomValidity('');
      const n=state.owned[input.dataset.accountArtifact]??0;
      if(input.type==='checkbox')input.checked=n>0;else input.value=String(n);
    }
    el('allMapsExplored').checked=state.allExplored;
    const effects=A.effects(state.owned),active=A.catalog.filter(r=>(state.owned[r.rewardId]??0)>0).length;
    el('accountActiveCount').textContent=`${active} / ${A.catalog.length} 項生效`;
    el('accountSummary').textContent=`探索：${state.allExplored?'全部地圖 100%':'各地圖分別設定'} · 首領持續率 +${effects.continuation} 個百分點 · 限定神器權重 ×${(1+effects.limited/100).toFixed(2)}`;
    status();
  }
  const descriptions={
    [A.ids.glasses]:'羈絆贈禮事件權重 +30%；與收集家相乘。',
    [A.ids.badge]:'首領持續掉落率 +1 個百分點。',
    [A.ids.telescope]:'每級探索事件權重 +10%；探索滿 100% 後不再作用。',
    [A.ids.compass]:'限定神器的抽選權重 ×1.5。',
    [A.ids.seed]:'首領獎勵池加入魂之果物與長壽的幻酒。',
    [A.ids.amber]:'遠征寶石數量 +30%。'
  };
  for(const master of A.catalog) {
    const card=document.createElement('label');card.className='account-artifact';
    const name=document.createElement('strong');name.textContent=master.name;
    const desc=document.createElement('small');desc.textContent=descriptions[master.rewardId];
    const copy=document.createElement('span');copy.className='artifact-copy';copy.append(name,desc);
    const input=document.createElement('input');input.dataset.accountArtifact=master.rewardId;
    input.type=master.maxLevel===1?'checkbox':'number';input.setAttribute('aria-label',master.name+'持有量');
    if(input.type==='number'){input.min=0;input.max=master.maxLevel;input.step=1;}
    if(master.rewardId===A.ids.glasses)input.id='affectionGlasses';
    input.addEventListener('change',()=>{
      try {const n=input.type==='checkbox'?Number(input.checked):Number(input.value);
        if(input.value.trim()===''||!Number.isInteger(n)||n<0||n>master.maxLevel)throw new Error(`請輸入 0–${master.maxLevel} 的整數持有量`);
        input.setCustomValidity('');setOwned(master.rewardId,n);render();
      }catch(e){input.setCustomValidity(e.message);input.reportValidity();}
    });
    card.append(copy,input);el('accountArtifacts').append(card);
  }
  el('allMapsExplored').addEventListener('change',()=>{try{const next=clone(state);next.allExplored=el('allMapsExplored').checked;save(next);render();notify();}catch{render();}});
  el('accountExport').addEventListener('click',()=>{
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.href=url;a.download='DFCH-v2-account.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  el('accountImport').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{if(file.size>5000000)throw new Error('設定檔超過 5 MB');const next=validate(JSON.parse(await file.text()));if(window.DFCHSimulationRunning)throw new Error('請先中止模擬再匯入設定');save(next,true);render();notify();}catch(e){el('accountSaveStatus').textContent=e.message;}finally{event.target.value='';}
  });
  window.DFCHAccount=Object.freeze({KEY,validate,snapshot:()=>clone(state),rate,setRate,setOwned,commit,render,
    assertValid(){if(error)throw new Error(error);for(const input of document.querySelectorAll('[data-account-artifact],#mapExplorationRate'))if(!input.checkValidity())throw new Error('請修正神器持有量或探索率');},
    lock(on){for(const input of document.querySelectorAll('#accountSettings input,#accountSettings button,#mapExplorationRate,#mapExplored100'))input.disabled=on;}
  });
  if(!error)try{save(state);}catch{}
  render();
})();
