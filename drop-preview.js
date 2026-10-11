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
    for(const master of data.rewardMasters.filter(m=>m.sourceTable==='ArtifactTable')) {
      const label=document.createElement('label');label.className='field';
      const title=document.createElement('span');title.textContent=`${master.name}（最高 ${master.maxLevel}）`;
      const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.value='0';input.dataset.reward=master.rewardId;
      input.setAttribute('aria-label',`${master.name}目前持有量`);input.addEventListener('input',()=>refresh());label.append(title,input);root.append(label);
    }
  }
  buildControls();
  function refresh(nextRatio=ratio) {
    ratio=nextRatio;
    const hasStone=data.master.basicFlagUnlockSampleGroupIds.some(id=>id>0);
    flag.disabled=!hasStone;document.getElementById('stoneSearchAvailable').disabled=!hasStone||data.master.basicFlagUnlockConditions[0]===-1;
    const unlockFlag=data.flagUnlockSamples.find(r=>r.flagType>0)?.flagType;
    const body=document.getElementById('dropStateRows');body.replaceChildren();
    const note=document.getElementById('dropStateSummary');
    if(!window.DFCHMaps[document.getElementById('mapSelect').value]) {note.textContent='此地圖尚未接入狀態權重預覽。';return;}
    try {
      if(daily.value.trim()==='' || [...root.querySelectorAll('input')].some(i=>i.value.trim()===''))throw new Error('請填妥持有量');
      const owned=Object.fromEntries([...root.querySelectorAll('input')].map(i=>[i.dataset.reward,Number(i.value)]));
      const state=rules.begin(data,{daily:Number(daily.value),owned,flags:flag.checked&&unlockFlag?[unlockFlag]:[]});
      const groups=mode.value==='basic'?[50]:data.master.bossDropSampleGroupIds;
      const result=rules.distribution(groups,state,data,ratio);
      note.textContent=`當日起始一般鑽石 ${state.daily}／${data.master.dailyDiamondLimit}：${state.limitReached?'已達上限':'未達上限'}。${state.limitReached && result.basic?'抽到一般鑽石後，改按其他基本群組的事件權重重抽；神級鑽石保留原抽選機會。':state.limitReached?'此池的一般鑽石權重歸零，神級鑽石保留。':'此輪跨過上限仍沿用起始判定；下一輪才重新檢查。'}`;
      for(const row of result.rows) {
        const tr=document.createElement('tr');
        const quantity=row.maxValue>0?`${row.minValue}–${row.maxValue}`:`${row.minValue}`;
        const converted=window.DFCHExpeditionRules.convertDrop(row,row.minValue,data);
        const name=data.rewardMasters.find(m=>m.rewardId===converted.rewardId)?.name ?? row.rewardName ?? '無物品';
        for(const text of [name,quantity,`${(row.probability*100).toFixed(6)}%`]) {const td=document.createElement('td');td.textContent=text;tr.append(td);}
        body.append(tr);
      }
      const candidates=rules.flagPool(data.flagUnlockSamples,state);
      document.getElementById('flagStateSummary').textContent=!hasStone?'此地圖沒有官方秘石搜尋事件。':`解鎖發現池：${candidates.map(r=>`${r.flagType===-1?'無收穫':data.master.key==='stage_atli'?'決戰魔王地點解鎖':'秘石發現'}權重 ${r.weight}`).join('；')}。${data.master.basicFlagUnlockConditions[0]===-1?'此事件不需要額外搜尋前置。':''} 這是事件已抽中後的候選權重。`;
    } catch(error) {note.textContent=`無法預覽：${error.message}`;document.getElementById('flagStateSummary').textContent='';}
  }
  [daily,flag,mode].forEach(el=>el.addEventListener('input',()=>refresh()));
  document.getElementById('mapSelect').addEventListener('change',()=>{
    controls.set(data.master.key,{daily:daily.value,flag:flag.checked,search:document.getElementById('stoneSearchAvailable').checked,owned:Object.fromEntries([...root.querySelectorAll('input')].map(i=>[i.dataset.reward,i.value]))});
    const selected=window.DFCHMaps[document.getElementById('mapSelect').value];
    if(selected){data=selected;buildControls();const saved=controls.get(data.master.key);daily.value=saved?.daily??'0';flag.checked=saved?.flag??false;document.getElementById('stoneSearchAvailable').checked=saved?.search??false;
      for(const input of root.querySelectorAll('input'))input.value=saved?.owned[input.dataset.reward]??'0';}
    refresh();
  });
  window.DFCHDropPreview=Object.freeze({refresh});
  refresh();
})();
