(() => {
  const data = window.DFCHMapData;
  const select = document.getElementById('mapSelect');
  const explored = document.getElementById('mapExplored100');
  const target = document.getElementById('mapDataTables');
  const groupNames = {50:'鑽石發現',51:'寶石發現',80:'遠征戰塵與魂片',90:'首領戰後追加獎勵',100:'一般戰鬥掉落',100150:'一般寶箱發現',100151:'不祥寶箱發現',100152:'神奇寶箱發現',100160:'士兵五倍成長書發現',100161:'遠征隊支援物資發現',100170:'野外贈禮發現',100190:'地圖限定神器',1000050:'尋寶：黃金寶箱',1000051:'尋寶：神奇寶箱',1000052:'尋寶：紅色寶箱',1000053:'尋寶：荊刺寶箱'};
  const eventNames = {1:'一般行走',2:'快速行走',3:'休息',200:'小幅探索',201:'深入探索',202:'重大探索',901:'鑽石增益區域'};
  const rewardNames = {1:'寶石加成',2:'寶箱掉落加成',3:'新增戰鬥事件',4:'新增一般事件',5:'新增物品發現事件',6:'限定掉落加成',7:'經驗加成'};
  const names = Object.fromEntries(data.monsterNames.map(r => [r.index,r.name]));
  const fmt = value => String(Number(Number(value).toPrecision(8)));
  function table(title,headers,rows) {
    const h=document.createElement('h3');h.textContent=title;
    const wrap=document.createElement('div');wrap.className='speed-table-scroll';
    const t=document.createElement('table');t.className='speed-table';
    const head=t.createTHead().insertRow();
    headers.forEach(text=>{const c=document.createElement('th');c.textContent=text;head.appendChild(c);});
    const body=t.createTBody();rows.forEach(values=>{const r=body.insertRow();values.forEach(text=>{r.insertCell().textContent=String(text);});});
    wrap.appendChild(t);target.append(h,wrap);
  }
  function sequence(event) {
    return data.eventSequences.filter(s=>s.logEventId===event).map(s=>{
      const v=fmt(s.args[0]);
      switch(s.functionType) {
        case 100:return `前進 ${v} 基礎進度${s.args[1]>0?'（不套用速度倍率）':'（套用隊伍速度倍率）'}`;
        case 101:return `消耗耐力（設定值 ${v}）`;
        case 102:return `回復生命（設定值 ${v}）`;
        case 110:return `固定回復耐力 ${v}`;
        case 109:return `探索率增加 ${v}`;
        case 104:return '進入鑽石增益區域';
        case 7:return `抽選${groupNames[s.args[0]] || '對應物品獎勵'}`;
        case 8:return '顯示技能觸發';
        case 2:return '顯示行走紀錄';
        case 3:return '顯示休息紀錄';
        case 4:return '顯示區域紀錄';
        case 10:return '顯示探索紀錄';
        default:return '執行事件效果';
      }
    }).join(' → ');
  }
  function conditions(row) {
    const list=row.conditionTypes.map((t,i)=>{
      const v=fmt(row.conditionValues[i]);
      if(t===2)return `角色生命低於 ${v}%`;
      if(t===7)return `耐力高於 ${v}%`;
      if(t===0)return '';
      return '須符合額外事件條件';
    }).filter(Boolean);
    return list.join('；') || '沒有額外狀態條件';
  }
  function rewardDetail(row) {
    if(row.rewardType===5)return `${groupNames[row.referenceId] || '新增物品事件'}（抽選設定值 ${fmt(row.value)}）`;
    if(row.rewardType===3)return `禁斷遭遇（抽選設定值 ${fmt(row.value)}）`;
    return `${rewardNames[row.rewardType] || '探索獎勵'}（設定值 ${fmt(row.value)}）`;
  }
  function render() {
    const supported=select.value===data.master.key;
    explored.disabled=!supported;
    document.getElementById('mapDataDetails').hidden=!supported;
    document.getElementById('mapDataTitle').textContent=supported?data.name:'此地圖資料尚未接入';
    document.getElementById('mapDataSummary').textContent=supported?`原始遠征時間 ${data.master.duration} 秒（10 分鐘）；目標進度 ${data.master.depth}。一般戰鬥敵人 ${data.master.basicBattleMinMonsterCount}–${data.master.basicBattleMaxMonsterCount} 名。`:'目前僅第一張地圖有官方資料；切回米維克威茲 外緣部查看。';
    const rate=explored.checked?100:0;
    window.DFCHMapConfig={dungeonKey:select.value,completionRate:rate,combat:'instant-victory',combatDurationSeconds:0};
    const unlocked=data.completionRewards.filter(r=>r.requiredCompletionRate<=rate);
    document.getElementById('mapExplorationSummary').textContent=!supported?'此地圖尚未支援探索效果預覽。':explored.checked?`已按探索 100% 配置，${unlocked.length} 項探索獎勵皆達標；包含新增成長書、不祥寶箱、神奇寶箱、支援物資及禁斷遭遇的候選事件。仍須抽選與其他條件判定；不是每次必得。`:'目前按探索 0% 預覽。開啟後可比較探索完成所解鎖的效果；探索率與本次行走進度不同。';
    target.replaceChildren();
    table('基本事件抽選權重',['類別','原始權重'],[
      ['一般戰鬥',fmt(data.master.basicBattleWeight)],
      ...data.master.basicItemDropSampleGroupIds.map((id,i)=>[groupNames[id],fmt(data.master.basicItemDropWeights[i])]),
      ['道路解鎖事件（須符合解鎖條件）',fmt(data.master.basicFlagUnlockWeights[0])]
    ]);
    table('共用事件與執行順序',['事件','原始權重','依序執行'],data.eventSamples.map(r=>[eventNames[r.logEventId] || '共用事件',fmt(r.weight),sequence(r.logEventId)]));
    table('技能事件與觸發條件',['所需技能','狀態條件','原始權重','依序執行'],data.conditionalTemplates.map(r=>[r.requiredAbilities.filter(Boolean).map(id=>data.abilityNames[id] || '特殊技能').join('、'),conditions(r),fmt(r.weight),sequence(r.logEventId)]));
    [...new Set(data.dropSamples.map(r=>r.dropItemSampleGroupId))].forEach(id=>{
      const unlock=data.completionRewards.find(r=>r.rewardType===5 && r.referenceId===id);
      const state=unlock?`（探索 ${unlock.requiredCompletionRate}% 解鎖；${rate>=unlock.requiredCompletionRate?'已達標':'未達標'}）`:'';
      table(`${groupNames[id] || '物品獎勵'}${state}`,['掉落物','數量設定','原始權重'],data.dropSamples.filter(r=>r.dropItemSampleGroupId===id).map(r=>[r.rewardName,r.rewardId===-1?'無物品':r.maxValue===0?`${r.minValue}（原表上限為零，取量方式待核對）`:r.minValue===r.maxValue?String(r.minValue):`${r.minValue}–${r.maxValue}`,fmt(r.weight)]));
    });
    table('怪物遭遇',['遭遇種類','怪物','原始權重','出現方式'],data.monsterSamples.map(r=>[r.battleEventId===data.master.basicBattleMonsterGroupId?'一般戰鬥':r.battleEventId===data.master.bossBattleGroupId?'地圖首領戰':'探索解鎖的禁斷遭遇',names[r.monsterId] || '特殊魔物',fmt(r.weight),r.isForceAppear?'強制出現':'依權重抽選']));
    table('探索率解鎖效果',['探索率門檻','獎勵效果','目前狀態'],data.completionRewards.map(r=>[`${r.requiredCompletionRate}%`,rewardDetail(r),rate>=r.requiredCompletionRate?'已達標':'尚未達標']));
  }
  select.addEventListener('change',render);explored.addEventListener('change',render);render();
})();
