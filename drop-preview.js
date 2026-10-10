(() => {
  const data=window.DFCHMapData, rules=window.DFCHDropState;
  const root=document.getElementById('dropStateControls');
  const daily=document.getElementById('dailyDiamondCount');
  const flag=document.getElementById('stoneUnlocked');
  const mode=document.getElementById('dropPoolMode');
  let ratio=1;
  const masters=data.rewardMasters.filter(m=>m.sourceTable==='ArtifactTable');
  for(const master of masters) {
    const label=document.createElement('label'); label.className='field';
    const title=document.createElement('span');title.textContent=`${master.name}（最高 ${master.maxLevel}）`;
    const input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.value='0';input.dataset.reward=master.rewardId;
    input.setAttribute('aria-label',`${master.name}目前持有量`);
    label.append(title,input);root.append(label);
  }
  function refresh(nextRatio=ratio) {
    ratio=nextRatio;
    const body=document.getElementById('dropStateRows');body.replaceChildren();
    const note=document.getElementById('dropStateSummary');
    if(document.getElementById('mapSelect').value!=='stage_1') {note.textContent='目前只提供第一張地圖的狀態權重預覽。';return;}
    try {
      if(daily.value.trim()==='' || [...root.querySelectorAll('input')].some(i=>i.value.trim()===''))throw new Error('請填妥持有量');
      const owned=Object.fromEntries([...root.querySelectorAll('input')].map(i=>[i.dataset.reward,Number(i.value)]));
      const state=rules.begin(data,{daily:Number(daily.value),owned,flags:flag.checked?[6602]:[]});
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
      document.getElementById('flagStateSummary').textContent=`秘石解鎖池：${candidates.some(r=>r.flagType===6602)?'尚未解鎖時，無收穫與秘石原始權重各 50。':'已解鎖秘石，移除秘石候選，只剩無收穫。'} 此表以解鎖事件已符合其他條件為前提，尚未代表事件遭遇率。`;
    } catch(error) {note.textContent=`無法預覽：${error.message}`;document.getElementById('flagStateSummary').textContent='';}
  }
  [daily,flag,mode,...root.querySelectorAll('input')].forEach(el=>el.addEventListener('input',()=>refresh()));
  document.getElementById('mapSelect').addEventListener('change',()=>refresh());
  window.DFCHDropPreview=Object.freeze({refresh});
  refresh();
})();
