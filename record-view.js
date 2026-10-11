(() => {
  const {el,table,number}=window.DFCHSimulationView;
  let data=window.DFCHMapData;const map=document.getElementById('recordMapSelect');
  let store;
  try{store=window.DFCHRecords.create(window.localStorage);}catch(e){store=window.DFCHRecords.create({getItem(){throw e;},setItem(){throw e;},removeItem(){throw e;}});}
  window.DFCHRecordStore=store;
  const mode=document.getElementById('recordMode'),root=document.getElementById('recordDashboard'),status=document.getElementById('recordStatus');
  function render(){
    data=window.DFCHMaps[map.value];
    root.replaceChildren();if(store.error){status.textContent=store.error;return;}
    const r=store.get(mode.value,data.master.key);status.textContent='每完成一輪自動存檔；只累積已結算的遠征。';
    if(!r){root.append(el('p','此類型尚無遠征紀錄。'));return;}
    const a=r.totals;root.append(el('h3',r.name));
    const daily=mode.value==='continuous'?r.latest.saved.daily:r.config?.saved?.daily??0;
    const cap=el('div');cap.className='diamond-cap-state';
    cap.append(el('strong',`${mode.value==='continuous'?'下一輪承接':'最近一批起始配置'}：一般鑽石 ${number(daily)}／${data.master.dailyDiamondLimit} · ${daily>=data.master.dailyDiamondLimit?'已達上限':'未達上限'}`));
    const progress=el('progress');progress.max=data.master.dailyDiamondLimit;progress.value=Math.min(daily,progress.max);progress.setAttribute('aria-label','一般鑽石上限進度');cap.append(progress);
    cap.append(el('p','高額神級鑽石不計入一般鑽石上限；歷史累積總量與上限判定分開。'));root.append(cap);
    root.append(table(['項目','累積紀錄'],[['遠征次數',number(a.completed)],['探索事件次數',number(['小幅探索','探索','深入探索'].reduce((sum,key)=>sum+(a.eventCounts[key]??0),0))],['抵達終點／耐力耗盡',`${number(a.goals)}／${number(a.exhausted)}`],['一般／神級鑽石',`${number(a.ordinaryDiamonds)}／${number(a.godDiamonds)}`],['鑽石合計',number(a.ordinaryDiamonds+a.godDiamonds)],['平均鑽石／輪',number((a.ordinaryDiamonds+a.godDiamonds)/a.completed)],['起始已達上限的輪數',number(a.capStartRuns)],['當輪跨過上限的輪數',number(a.capCrossRuns)],['結束時達上限的輪數',number(a.capEndRuns)],['遇到高額鑽石的輪數',number(a.highRuns)],['最近一輪探索率',`${number(r.latest.completionRate)}%`]]));
    root.append(table(['高額鑽石','抽中次數','累積量（包含於總量）'],[5000,7777,9999].map(n=>[number(n),number(a.highDiamonds[n]),number(n*a.highDiamonds[n])])));
    root.append(el('p',mode.value==='independent'?'每輪重新使用玩家設定；歷史鑽石及道具數量不影響下一輪上限。':`承接狀態：當日一般鑽石 ${number(r.latest.saved.daily)}／${data.master.dailyDiamondLimit}，${r.latest.saved.daily>=data.master.dailyDiamondLimit?'已達上限':'未達上限'}；探索率 ${number(r.latest.completionRate)}%。`));
    root.append(el('h3','累積取得道具'));
    root.append(table(['道具','累積取得','取得輪數'],Object.entries(a.quantities).filter(([id])=>Math.floor(Number(id)/1000000)!==102).map(([id,n])=>[(window.DFCHArtifacts?.masters(data)??data.rewardMasters).find(m=>m.rewardId===Number(id))?.name??'獎勵',number(n),number(a.rewardRuns[id])])));
    if(mode.value==='continuous')root.append(table(['神器','最近結算持有／最高'],data.rewardMasters.filter(m=>m.sourceTable==='ArtifactTable').map(m=>[m.name,`${number(r.latest.saved.owned[m.rewardId]??0)}／${m.maxLevel}`])));
    root.append(el('p',`最近完成種子 ${r.latest.seed}；最後儲存 ${new Date(r.updatedAt).toLocaleString('zh-TW')}。`));
  }
  map.addEventListener('change',render);
  mode.addEventListener('change',render);
  document.getElementById('exportRecords').addEventListener('click',()=>{try{const url=URL.createObjectURL(new Blob([store.export()],{type:'application/json'})),a=el('a');a.href=url;a.download='DFCH-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){status.textContent=`匯出失敗：${e.message}`;}});
  document.getElementById('importRecords').addEventListener('change',async e=>{if(window.DFCHSimulationRunning){status.textContent='請先中止模擬再匯入。';e.target.value='';return;}const file=e.target.files[0];if(!file)return;
    try{if(file.size>5000000)throw new Error('存檔超過 5 MB');const raw=await file.text();if(window.DFCHSimulationRunning)throw new Error('請先中止模擬');window.DFCHRecords.validate(JSON.parse(raw));if(!window.confirm('匯入將取代兩種類型的全部紀錄，是否繼續？'))return;store.import(raw);render();window.DFCHDropPreview?.refresh();status.textContent='存檔已匯入。';}catch(e){status.textContent=`匯入失敗：${e.message}；原紀錄保留。`;}finally{e.target.value='';}});
  for(const [id,all] of [['resetMapRecords',false],['resetAllRecords',true]])document.getElementById(id).addEventListener('click',()=>{if(window.DFCHSimulationRunning){status.textContent='請先中止模擬再重置。';return;}if(!window.confirm(all?'確定清除兩種類型的全部存檔？':'確定清除此面板所選地圖的紀錄？'))return;try{if(all)store.resetAll();else store.reset(mode.value,data.master.key);render();window.DFCHDropPreview?.refresh();}catch(e){status.textContent=`重置失敗：${e.message}`;}});
  document.getElementById('resetModeRecords').addEventListener('click',()=>{if(window.DFCHSimulationRunning){status.textContent='請先中止模擬再重置。';return;}const label=mode.value==='continuous'?'連續遠征':'獨立遠征';if(!window.confirm(`確定重置「${label}」全部地圖的統計與當日鑽石？帳號神器與探索設定保留。另一種類型將保留。`))return;try{store.resetMode(mode.value);render();window.DFCHDropPreview?.refresh();status.textContent=`已重置${label}全部地圖。`;}catch(e){status.textContent=`重置失敗：${e.message}`;}});
  document.getElementById('setRecordDaily').addEventListener('click',()=>{if(window.DFCHSimulationRunning){status.textContent='請先中止模擬再調整。';return;}try{const input=document.getElementById('recordDailyValue');if(input.value.trim()==='')throw new Error('請填入數量');store.setDaily('continuous',data.master.key,Number(input.value));render();status.textContent='已更新連續模式當日鑽石；歷史統計保留。';window.DFCHDropPreview?.refresh();}catch(e){status.textContent=e.message;}});
  render();window.DFCHRecordView=Object.freeze({render});
})();
