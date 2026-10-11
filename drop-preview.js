(() => {
  let data=window.DFCHMapData;const rules=window.DFCHDropState;
  const controls=new Map();
  const root=document.getElementById('dropStateControls');
  const daily=document.getElementById('dailyDiamondCount');
  const flag=document.getElementById('stoneUnlocked');
  const mode=document.getElementById('dropPoolMode');
  let ratio=1;
  function buildControls() {
    root.replaceChildren();
    for(const master of data.rewardMasters.filter(m=>m.sourceTable==='ArtifactTable'&&!window.DFCHArtifacts?.catalog.some(a=>a.rewardId===m.rewardId))) {
      const label=document.createElement('label');label.className='field';
      const title=document.createElement('span');title.textContent=`${master.name}（最高 ${master.maxLevel}）`;
      const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.value=String(window.DFCHAccount?.snapshot().owned[master.rewardId]??0);input.dataset.reward=master.rewardId;
      input.setAttribute('aria-label',`${master.name}目前持有量`);input.addEventListener('input',()=>{if(input.value.trim()!==''&&Number.isSafeInteger(Number(input.value))&&Number(input.value)>=0)window.DFCHAccount?.setOwned(master.rewardId,Number(input.value));refresh();});label.append(title,input);root.append(label);
    }
  }
  buildControls();
  function refresh(nextRatio=ratio) {
    ratio=nextRatio;
    const hasStone=data.master.basicFlagUnlockSampleGroupIds.some(id=>id>0);
    flag.disabled=!hasStone;document.getElementById('stoneSearchAvailable').disabled=!hasStone||data.master.basicFlagUnlockConditions[0]===-1;
    const unlockFlag=data.flagUnlockSamples.find(r=>r.flagType>0)?.flagType;
    const accountFlags=window.DFCHAccount?.snapshot().flags??[];
    for(const [input,id] of [[flag,unlockFlag],[document.getElementById('stoneSearchAvailable'),data.master.basicFlagUnlockConditions[0]]]) {
      if(input.dataset.accountLocked==='true')input.checked=false;
      const unlocked=id>=0&&accountFlags.includes(id);
      input.dataset.accountLocked=String(unlocked);
      if(unlocked){input.checked=true;input.disabled=true;input.title='帳號已保存此解鎖狀態';}else input.title='';
    }
    const body=document.getElementById('dropStateRows');body.replaceChildren();
    const note=document.getElementById('dropStateSummary');
    if(!window.DFCHMaps[document.getElementById('mapSelect').value]) {note.textContent='此地圖尚未接入狀態權重預覽。';return;}
    try {
      if(daily.value.trim()==='' || [...root.querySelectorAll('input')].some(i=>i.value.trim()===''))throw new Error('請填妥持有量');
      const owned={...(window.DFCHAccount?.snapshot().owned??{}),...Object.fromEntries([...root.querySelectorAll('input')].map(i=>[i.dataset.reward,Number(i.value)]))};
      const state=rules.begin(data,saved());
      const effects=window.DFCHArtifacts?.effects(owned)??{},config={completionRate:window.DFCHAccount?.rate(data.master.key)??window.DFCHMapConfig?.completionRate??0,effects};
      const groups=mode.value==='basic'?[50]:(window.DFCHArtifacts?.bossGroups(data,effects)??data.master.bossDropSampleGroupIds);
      const result=rules.distribution(groups,state,data,ratio,config);
      note.textContent=`當日起始一般鑽石 ${state.daily}／${data.master.dailyDiamondLimit}：${state.limitReached?'已達上限':'未達上限'}。${state.limitReached && result.basic?'抽到一般鑽石後，改按其他基本群組的事件權重重抽；神級鑽石保留原抽選機會。':state.limitReached?'此池的一般鑽石權重歸零，神級鑽石保留。':'此輪跨過上限仍沿用起始判定；下一輪才重新檢查。'}`;
      for(const row of result.rows) {
        const tr=document.createElement('tr');
        const converted=rules.quantity(row,row.minValue,data,config),max=rules.quantity(row,row.maxValue>0?row.maxValue:row.minValue,data,config).quantity;
        const quantity=row.rewardId<0?'—':converted.quantity===max?converted.quantity.toLocaleString():`${converted.quantity.toLocaleString()}–${max.toLocaleString()}`;
        const name=(window.DFCHArtifacts?.masters(data)??data.rewardMasters).find(m=>m.rewardId===converted.rewardId)?.name ?? row.rewardName ?? '無物品';
        for(const text of [name,quantity,`${(row.probability*100).toFixed(6)}%`]) {const td=document.createElement('td');td.textContent=text;tr.append(td);}
        body.append(tr);
      }
      const candidates=rules.flagPool(data.flagUnlockSamples,state);
      document.getElementById('flagStateSummary').textContent=!hasStone?'此地圖沒有官方秘石搜尋事件。':`解鎖發現池：${candidates.map(r=>`${r.flagType===-1?'無收穫':data.master.key==='stage_atli'?'決戰魔王地點解鎖':data.master.key==='stage_labyrinth_1'?'巨大迷宮下層地點解鎖':'秘石發現'}權重 ${r.weight}`).join('；')}。${data.master.basicFlagUnlockConditions[0]===-1?'此事件不需要額外搜尋前置。':''} 這是事件已抽中後的候選權重。`;
    } catch(error) {note.textContent=`無法預覽：${error.message}`;document.getElementById('flagStateSummary').textContent='';}
  }
  [daily,flag,mode].forEach(el=>el.addEventListener('input',()=>refresh()));
  document.getElementById('mapSelect').addEventListener('change',()=>{
    controls.set(data.master.key,{daily:daily.value,flag:flag.checked,search:document.getElementById('stoneSearchAvailable').checked,owned:Object.fromEntries([...root.querySelectorAll('input')].map(i=>[i.dataset.reward,i.value]))});
    const selected=window.DFCHMaps[document.getElementById('mapSelect').value];
    if(selected){data=selected;buildControls();const saved=controls.get(data.master.key);daily.value=saved?.daily??'0';flag.checked=saved?.flag??false;document.getElementById('stoneSearchAvailable').checked=saved?.search??false;
      for(const input of root.querySelectorAll('input'))input.value=String(window.DFCHAccount?.snapshot().owned[input.dataset.reward]??saved?.owned[input.dataset.reward]??0);}
    refresh();
  });
  function saved() {
    const account=window.DFCHAccount?.snapshot()??{owned:{},flags:[]};
    const owned={...account.owned,...Object.fromEntries([...root.querySelectorAll('input')].map(i=>[i.dataset.reward,Number(i.value)]))};
    const flags=[...account.flags],prerequisite=data.master.basicFlagUnlockConditions[0];
    if(prerequisite>=0&&data.master.basicFlagUnlockSampleGroupIds[0]>0&&document.getElementById('stoneSearchAvailable').checked)flags.push(prerequisite);
    if(flag.checked){const row=data.flagUnlockSamples.find(r=>r.flagType>0);if(row)flags.push(row.flagType);}
    const previous=document.getElementById('simulationMode').value==='continuous'?window.DFCHRecordStore?.get('continuous',data.master.key):null;
    return {owned,flags:[...new Set(flags)],daily:previous?.latest.saved.daily??Number(daily.value)};
  }
  window.addEventListener('dfch-account-change',()=>{
    for(const input of root.querySelectorAll('input'))input.value=String(window.DFCHAccount.snapshot().owned[input.dataset.reward]??0);
    refresh();
  });
  document.getElementById('mapExplored100').addEventListener('change',()=>refresh());
  document.getElementById('simulationMode').addEventListener('change',()=>refresh());
  window.DFCHDropPreview=Object.freeze({refresh,saved});
  refresh();
})();
