(() => {
  const data = window.DFCHMapData;
  const select = document.getElementById("mapSelect");
  const target = document.getElementById("mapDataTables");
  function table(title, headers, rows) {
    const heading = document.createElement("h3"); heading.textContent = title;
    const wrap = document.createElement("div"); wrap.className = "speed-table-scroll";
    const t = document.createElement("table"); t.className = "speed-table";
    const head = t.createTHead().insertRow();
    headers.forEach(text => { const cell = document.createElement("th"); cell.textContent = text; head.appendChild(cell); });
    const body = t.createTBody();
    rows.forEach(values => { const row = body.insertRow(); values.forEach(text => { const cell = row.insertCell(); cell.textContent = String(text); }); });
    wrap.appendChild(t); target.append(heading, wrap);
  }
  const functions = {100:"前進",101:"消耗耐力",102:"回復生命",110:"固定回復耐力",2:"移動紀錄",3:"休息紀錄",109:"增加探索率",10:"探索率紀錄",104:"區域增益",4:"區域紀錄",8:"技能觸發",7:"物品掉落"};
  const names = Object.fromEntries(data.monsterNames.map(r => [r.index, r.name]));
  function render() {
    const supported = select.value === data.master.key;
    document.getElementById("mapDataDetails").hidden = !supported;
    document.getElementById("mapDataTitle").textContent = supported ? data.name : "此地圖資料尚未接入";
    document.getElementById("mapDataSummary").textContent = supported ?
      `原始遠征時間 ${data.master.duration} 秒（10 分鐘）；目標進度 ${data.master.depth}。一般戰鬥敵人 ${data.master.basicBattleMinMonsterCount}–${data.master.basicBattleMaxMonsterCount} 名。已解析 ${data.eventSamples.length} 個共用事件、${data.conditionalTemplates.length} 個條件模板、${data.dropSamples.length} 條掉落樣本與 ${data.completionRewards.length} 個探索率獎勵。` : "目前僅第一張地圖有官方資料；切回米維克威茲 外緣部查看。";
  }
  table("地圖產生的事件權重", ["類別", "群組", "原始權重"], [
    ["一般戰鬥", data.master.basicBattleMonsterGroupId, data.master.basicBattleWeight],
    ...data.master.basicItemDropSampleGroupIds.map((id,i) => ["物品事件",id,data.master.basicItemDropWeights[i]]),
    ...data.master.basicFlagUnlockSampleGroupIds.map((id,i) => ["解鎖事件（須符合條件）",id,data.master.basicFlagUnlockWeights[i]])
  ]);
  table("共用事件與指令順序", ["事件", "權重", "依序執行"], data.eventSamples.map(r => [r.logEventId, r.weight,
    data.eventSequences.filter(s => s.logEventId === r.logEventId).map(s => `${functions[s.functionType] || data.enums.ExpeditionEventFunctionType[s.functionType]} ${s.args[0]}`).join(" → ") ]));
  table("條件技能事件", ["模板", "事件", "所需能力 ID", "權重", "條件類型 / 值"], data.conditionalTemplates.map(r => [r.templateId,r.logEventId,r.requiredAbilities.join("、"),r.weight,r.conditionTypes.map((type,i) => `${data.enums.ExpeditionEventConditionType[type]} / ${r.conditionValues[i]}`).join("；")]));
  const groups = [...new Set(data.dropSamples.map(r => r.dropItemSampleGroupId))];
  groups.forEach(id => table(`掉落組 ${id}`, ["掉落物", "稀有度代碼", "原始數量 min / max", "原始權重"], data.dropSamples.filter(r => r.dropItemSampleGroupId === id).map(r => [r.rewardName,r.rarityType,`${r.minValue} / ${r.maxValue}`,r.weight])));
  table("怪物出現資料", ["群組", "怪物", "原始權重", "強制出現"], data.monsterSamples.map(r => [r.battleEventId,names[r.monsterId] || r.monsterId,r.weight,r.isForceAppear ? "是（不以零權重排除）" : "否"]));
  table("探索率解鎖獎勵", ["所需探索率", "效果", "參照群組", "原始值"], data.completionRewards.map(r => [r.requiredCompletionRate,data.enums.ExpeditionCompletionRateRewardType[r.rewardType],r.referenceId,r.value]));
  select.addEventListener("change", render); render();
})();
