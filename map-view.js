(() => {
  let data = window.DFCHMapData;
  const select = document.getElementById('mapSelect');
  const explored = document.getElementById('mapExplored100');
  const target = document.getElementById('mapDataTables');
  const groupNames = {700:'一般戰鬥掉落',300470:'野外贈禮發現',300490:'地圖限定神器',300460:'特殊能力之書發現',300461:'禁斷的守門人召喚石發現',300462:'巨大迷宮的秘寶發現',900070:'野外贈禮發現',900090:'地圖限定神器',900095:'魔王戰後追加獎勵',600:'一般戰鬥掉落',300370:'野外贈禮發現',300390:'地圖限定神器',300360:'士兵五倍成長書發現',300361:'禁斷的守門人召喚石發現',300362:'巨大迷宮的秘寶發現',52:'地圖專屬寶石發現',500:'一般戰鬥掉落',300270:'野外贈禮發現',300290:'地圖限定神器',300260:'能力忘卻之書發現',300261:'特殊能力之書發現',400:'一般戰鬥掉落',300170:'野外贈禮發現',300190:'地圖限定神器',50:'鑽石發現',51:'寶石發現',80:'遠征戰塵與魂片',90:'首領戰後追加獎勵',100:'一般戰鬥掉落',100150:'一般寶箱發現',100151:'不祥寶箱發現',100152:'神奇寶箱發現',100160:'士兵五倍成長書發現',100161:'遠征隊支援物資發現',990100:'鑽石增益區域獎勵',100170:'野外贈禮發現',100190:'地圖限定神器',1000050:'尋寶：黃金寶箱',1000051:'尋寶：神奇寶箱',1000052:'尋寶：紅色寶箱',1000053:'尋寶：荊刺寶箱',100260:'能力忘卻之書發現',100261:'特殊能力之書發現',100270:'野外贈禮發現',100290:'地圖限定神器',1010:'禁斷遭遇追加寶箱',1020:'禁斷遭遇追加寶箱',100360:'能力值忘卻之書發現',100361:'禁斷的永環石發現',100370:'野外贈禮發現',100390:'地圖限定神器',100460:'士兵五倍成長書發現',100461:'被遺忘的祕寶發現',100470:'野外贈禮發現',100490:'地圖限定神器',1030:'禁斷遭遇追加寶箱',110:'一般戰鬥掉落',1040:'禁斷的高夫追加掉落',1050:'禁斷的尼德霍格追加掉落',100560:'禁斷的守門人召喚石發現',100570:'野外贈禮發現',100590:'地圖限定神器',100660:'被遺忘的祕寶發現',100661:'遠征隊支援物資發現',100670:'野外贈禮發現',100690:'地圖限定神器',200:'一般戰鬥掉落',200160:'士兵五倍成長書發現',200161:'禁斷的守門人召喚石發現',200170:'野外贈禮發現',200190:'地圖限定神器',2000:'禁斷遭遇追加掉落',300:'一般戰鬥掉落',200260:'遠征隊支援物資發現',200261:'特殊能力之書發現',200270:'野外贈禮發現',200290:'地圖限定神器'};
  const eventNames = {1:'一般行走',2:'快速行走',3:'休息',200:'小幅探索',201:'深入探索',202:'重大探索',901:'鑽石增益區域',351:'深雪阻行',352:'暴風雪',360:'全隊毒物陷阱',350:'毒霧陷阱',300:'物理陷阱',301:'強力物理陷阱',302:'重型物理陷阱',303:'毒物陷阱',304:'火焰陷阱'};
  const rewardNames = {1:'寶石加成',2:'寶箱掉落加成',3:'新增戰鬥事件',4:'新增一般事件',5:'新增物品發現事件',6:'限定掉落加成',7:'經驗加成'};
  let names = {};
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
        case 111:return `單體陷阱攻擊（原始參數 ${v}；本模擬免除傷害）`;
        case 112:return `全隊陷阱攻擊（原始參數 ${v}；本模擬免除傷害）`;
        case 5:return '顯示陷阱紀錄';
        case 100:return `前進 ${v} 基礎進度${s.args[1]>0?'（不套用速度倍率）':'（套用隊伍速度倍率）'}`;
        case 101:return `消耗耐力（設定值 ${v}）`;
        case 102:return `回復生命（設定值 ${v}）`;
        case 110:return `固定回復耐力 ${v}`;
        case 109:return `探索率增加約 ${fmt(Math.fround(Math.fround(Math.fround(Number(v))*60)/Math.max(data.master.depth,10))*2)} 個百分點（官方原始參數 ${v}）`;
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
      if(t===7)return `耐力至少 ${v}%`;
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
    const selected=(window.DFCHMaps??{stage_1:window.DFCHMapData})[select.value];
    const supported=!!selected;
    if(selected){data=selected;window.DFCHMapData=data;}
    names=Object.fromEntries(data.monsterNames.map(r=>[r.index,r.name]));
    explored.disabled=!supported;
    document.getElementById('mapDataDetails').hidden=!supported;
    document.getElementById('mapDataTitle').textContent=supported?data.name:'此地圖資料尚未接入';
    document.getElementById('mapDataSummary').textContent=supported?`原始遠征時間 ${data.master.duration} 秒（${data.master.duration/60} 分鐘）；目標進度 ${data.master.depth}。${data.master.basicBattleMonsterGroupId>0?`一般戰鬥敵人 ${data.master.basicBattleMinMonsterCount}–${data.master.basicBattleMaxMonsterCount-1} 名（上限不包含）。`:'此地圖沒有一般戰鬥，僅有終點首領戰。'}`:'目前十三張地圖已接入；請選擇已支援地圖。';
    const rate=explored.checked?100:0;
    window.DFCHMapConfig={dungeonKey:select.value,completionRate:rate,combat:'instant-victory',combatDurationSeconds:0};
    const unlocked=data.completionRewards.filter(r=>r.requiredCompletionRate<=rate);
    document.getElementById('mapExplorationSummary').textContent=!supported?'此地圖尚未支援探索效果預覽。':explored.checked?`已按探索 100% 配置，增加探索率的 3 種共用事件會排除；${unlocked.length} 項探索獎勵皆達標；包含本地圖探索解鎖的物品與禁斷遭遇候選事件。仍須抽選與其他條件判定；不是每次必得。`:'目前按探索 0% 預覽。開啟後可比較探索完成所解鎖的效果；探索率與本次行走進度不同。';
    target.replaceChildren();
    table('基本事件抽選權重',['類別','原始權重'],[
      ['一般戰鬥',fmt(data.master.basicBattleWeight)],
      ...data.master.basicItemDropSampleGroupIds.map((id,i)=>[groupNames[id] || '物品獎勵',fmt(data.master.basicItemDropWeights[i])]),
      ['地點解鎖事件（依官方條件）',fmt(data.master.basicFlagUnlockWeights[0])]
    ]);
    if(data.flagUnlockSamples.length)table('地點解鎖候選池',['候選','原始權重'],data.flagUnlockSamples.map(r=>[r.flagType===-1?'無收穫':r.flagType===6613?'解鎖決戰魔王遠征地點':r.flagType===6612?'解鎖巨大迷宮探索下層遠征地點':'發現秘石',fmt(r.weight)]));
    table('共用事件與執行順序',['事件','原始權重','目前探索配置','依序執行'],data.eventSamples.map(r=>[eventNames[r.logEventId] || '共用事件',fmt(r.weight),rate>=100 && data.eventSequences.some(s=>s.logEventId===r.logEventId && s.functionType===109)?'探索完成：排除':'保留候選',sequence(r.logEventId)]));
    table('技能事件與觸發條件',['所需技能','狀態條件','原始權重','依序執行'],data.conditionalTemplates.map(r=>[r.requiredAbilities.filter(Boolean).map(id=>data.abilityNames[id] || '特殊技能').join('、'),conditions(r),fmt(r.weight),sequence(r.logEventId)]));
    [...new Set(data.dropSamples.map(r=>r.dropItemSampleGroupId))].forEach(id=>{
      const unlock=data.completionRewards.find(r=>r.rewardType===5 && r.referenceId===id);
      const state=unlock?`（探索 ${unlock.requiredCompletionRate}% 解鎖；${rate>=unlock.requiredCompletionRate?'已達標':'未達標'}）`:'';
      table(`${groupNames[id] || '物品獎勵'}${state}`,['原始掉落物','地圖轉換後','數量設定','原始權重'],data.dropSamples.filter(r=>r.dropItemSampleGroupId===id).map(r=>[r.rewardName,r.dungeonConversion ? (data.rewardMasters.find(m=>m.rewardId===window.DFCHExpeditionRules.convertDrop(r,1,data).rewardId)?.name || '對應地圖獎勵') : '維持原物品',r.rewardId===-1?'無物品':r.maxValue===0?`${r.minValue}（固定）`:r.minValue===r.maxValue?String(r.minValue):`${r.minValue}–${r.maxValue}`,fmt(r.weight)]));
    });
    const affection = data.dropSamples.filter(r=>Math.floor(r.rewardId/1000000)===305);
    const affectionWeight=affection.reduce((sum,r)=>sum+r.weight,0);
    const pool=data.dropSamples.filter(r=>r.dropItemSampleGroupId===data.master.basicItemDropSampleGroupIds[3]);
    const poolWeight=pool.reduce((sum,r)=>sum+r.weight,0);
    table(`羈絆道具：${data.name}`, ['道具','取得途徑','數量','組內原始權重','原始組內比例'], affection.map(r=>[
      r.rewardName,'野外贈禮事件',r.minValue,r.weight,`${(r.weight/poolWeight*100).toFixed(6)}%`
    ]));
    const note=document.createElement('p');note.className='unit-note';
    note.textContent=`此組還包含無掉落，權重 ${pool.filter(r=>r.rewardId===-1).reduce((sum,r)=>sum+r.weight,0)}；羈絆道具總權重 ${affectionWeight}。這是該組已被抽選後、未套用其他修正的比例，不是每場遠征掉率。`;
    target.appendChild(note);
    table('怪物遭遇' ,['遭遇種類','怪物','原始權重','出現方式'],data.monsterSamples.map(r=>[r.battleEventId===data.master.basicBattleMonsterGroupId?'一般戰鬥':r.battleEventId===data.master.bossBattleGroupId?'地圖首領戰':'探索解鎖的禁斷遭遇',names[r.monsterId] || '特殊魔物',fmt(r.weight),r.isForceAppear?'強制出現':'依權重抽選']));
    table('探索率解鎖效果',['探索率門檻','獎勵效果','目前狀態'],data.completionRewards.map(r=>[`${r.requiredCompletionRate}%`,rewardDetail(r),rate>=r.requiredCompletionRate?'已達標':'尚未達標']));
  }
  select.addEventListener('change',render);explored.addEventListener('change',render);render();
})();
