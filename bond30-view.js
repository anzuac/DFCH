/* DFCH Bond30 seventh tab — test branch only. Never treat an approximation as official. */
(() => {
  "use strict";
  const root = document.getElementById("tab-bond30");
  if (!root) return;
  const engine = window.DFCHBond30Engine;
  if (!engine) return;
  const ids = ["bondPool","bondHero","bondHeroName","bondFixed","bondImport","bondSearch","bondAbilities","bondApplyGroups","bondCandidateRows","bondPoolStatus","bondQuickTest","bondPoolBreakdown","bondPoolOverview","bondHeroStatus","bondEligibleStatus","bondDraw","bondDrawStatus","bondDrawHistory","bondClear"];
  const ui = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  const poolLabels = {
    default_gacha:"一般召喚", multi_strike_pickup:"魔嵐的弓術士們",
    sea_pickup:"海裝的英傑們", snow_solider_pickup:"雪嶺的守護者們",
    wizard_pickup:"齊聚天之書架的魔導士們", caravan_pickup:"異鄉巡遊的明星們",
    xmas_pickup:"閃耀聖夜的星英們", "2026_sea_pickup":"夏日憩息的海裝英傑們",
    "2026_aniv_pickup":"緣絲交織的聖銳們"
  };
  let pools = {};
  let allPools = {};
  let heroes = {};
  let fixedByHero = {};
  let names = {};
  let owned = new Set();
  let history = [];
  let dataSource = "未載入";
  function text(node, value) { node.textContent = value; }
  function element(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = String(value);
    if (className) node.className = className;
    return node;
  }
  function heroFixedIds() {
    const id = ui.bondHero.value;
    return Array.isArray(fixedByHero[id]) ? engine.parseIdList(fixedByHero[id].join(",")) : [];
  }
  function existingIds() {
    return [...new Set([...owned, ...heroFixedIds()])];
  }
  function poolRows() { return pools[ui.bondPool.value] || []; }
  function allCandidates() {
    const rows = poolRows();
    const exclusions = existingIds();
    const blockedGroups = rows.filter((row) => exclusions.includes(Number(row.abilityId)) && Number(row.exclusiveGroupId) > 0).map((row) => Number(row.exclusiveGroupId));
    return engine.withRates(engine.eligible(rows, {excludedIds:exclusions,blockedGroups,applyGroupExclusions:ui.bondApplyGroups.checked}));
  }
  function labelFor(id) { return names[String(id)] || "能力 #" + String(id).slice(-5) + "（名稱待補）"; }
  function renderHero() {
    const pool = ui.bondPool.value;
    const previous = ui.bondHero.value;
    ui.bondHero.replaceChildren(new Option("自行輸入／未指定", ""));
    const matching = Object.entries(heroes).filter(([, value]) => (value.pools || []).some((p) => p.key === pool));
    matching.sort((a,b) => Number(a[0])-Number(b[0]));
    for (const [id, details] of matching) {
      const label = window.DFCHBond30HeroLabels?.[id] || details.translations?.zh_tw || details.name || "英靈（名稱待補）";
      ui.bondHero.add(new Option(label + "（ID " + id + "）", id));
    }
    if ([...ui.bondHero.options].some((opt) => opt.value === previous)) ui.bondHero.value = previous;
    updateHeroStatus();
  }
  function updateHeroStatus() {
    const fixed = heroFixedIds();
    if (fixed.length) {
      text(ui.bondHeroStatus, "已依驗證資料綁定 " + fixed.length + " 個固定能力：" + fixed.map(labelFor).join("、"));
    } else {
      text(ui.bondHeroStatus, "該英靈的固定能力尚未完成對照，這階段只能測試抽選流程，不代表官方最終可抽技能。");
    }
  }
  function updatePoolOverview() {
    const summary = Object.keys(poolLabels).map((key) => {
      const records = allPools[key] || [];
      const counts = {1:0,2:0,3:0};
      for (const row of records) if (Object.hasOwn(counts, row.chooseGroupType)) counts[row.chooseGroupType]++;
      const available = records.length > 0;
      return {key, records, counts, available};
    });
    const chosen = summary.find((v) => v.key === ui.bondPool.value);
    if (chosen && chosen.available) {
      const c = chosen.counts;
      text(ui.bondPoolBreakdown, `本池原始候選 ${chosen.records.length} 筆：自由 ${c[1]}、攻擊增益 ${c[2]}、HP 增益 ${c[3]}。羈絆 30 等目前只使用自由技能權重；固定能力仍依英靈資料判定。`);
    } else text(ui.bondPoolBreakdown, "尚未取得完整三類型候選資料。");
    ui.bondPoolOverview.replaceChildren();
    for (const row of summary) {
      const tr = element("tr");
      const poolName = element("td", poolLabels[row.key]);
      tr.append(poolName, element("td", row.available ? row.counts[1] : "—"),
        element("td", row.available ? row.counts[2] : "—"),
        element("td", row.available ? row.counts[3] : "—"),
        element("td", row.available ? row.records.length : "—"));
      ui.bondPoolOverview.append(tr);
    }
  }
  function acceptAllPoolData(data) {
    if (!data || !data.pools || typeof data.pools !== "object") throw new Error("三類型候選資料不完整");
    const parsed = {};
    for (const key of Object.keys(poolLabels)) {
      const records = data.pools[key];
      if (!Array.isArray(records)) throw new Error("缺少招募池：" + key);
      parsed[key] = records.map((r) => ({
        abilityId:Number(r.abilityId),
        chooseGroupType:Number(r.chooseGroupType),
        weight:Number(r.weight),
        exclusiveGroupIdRaw:Number(r.exclusiveGroupIdRaw)||0
      })).filter((r) => Number.isSafeInteger(r.abilityId) && r.abilityId > 0 && [1,2,3].includes(r.chooseGroupType) && r.weight > 0);
    }
    allPools = parsed;
    updatePoolOverview();renderAbilities();updateCandidates();
  }
  function renderAbilities() {
    const query = ui.bondSearch.value.trim().toLowerCase();
    const records = (allPools[ui.bondPool.value] || poolRows()).filter((row) => String(row.abilityId).includes(query) || labelFor(row.abilityId).toLowerCase().includes(query));
    ui.bondAbilities.replaceChildren();
    if (!records.length) {
      ui.bondAbilities.append(element("p", Object.keys(pools).length ? "此條件沒有技能" : "先匯入 3.16.1 的候選池 JSON，才能選擇能力。", "bond30-muted"));
      return;
    }
    for (const record of records) {
      const item = element("label", undefined, "bond30-skill");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = owned.has(record.abilityId);
      checkbox.setAttribute("aria-label", labelFor(record.abilityId));
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) owned.add(record.abilityId); else owned.delete(record.abilityId);
        updateCandidates();
      });
      const group = Number(record.chooseGroupType);
      const groupName = ({1:"自由",2:"攻擊增益",3:"HP 增益"})[group] || "其他";
      item.append(checkbox, element("span", labelFor(record.abilityId)), element("small", groupName + " · 權重 " + record.weight));
      ui.bondAbilities.append(item);
    }
  }
  function updateCandidates() {
    const rows = allCandidates();
    const sum = rows.reduce((acc, row) => acc + row.weight, 0);
    text(ui.bondEligibleStatus, `候選 ${rows.length} 項 · 有效權重總和 ${sum} · 排除 ID ${existingIds().length} 項`);
    ui.bondDraw.disabled = !rows.length;
    ui.bondCandidateRows.replaceChildren();
    if (!rows.length) {
      const tr = element("tr");
      const td = element("td", "目前沒有可抽取的候選技能（請先匯入資料或調整排除條件）");
      td.colSpan = 3;
      tr.append(td);
      ui.bondCandidateRows.append(tr);
      return;
    }
    for (const item of rows.sort((a,b) => b.weight - a.weight || a.abilityId - b.abilityId)) {
      const tr = element("tr");
      tr.append(element("td", labelFor(item.abilityId)), element("td", item.weight), element("td", item.percent.toFixed(3) + "%"));
      ui.bondCandidateRows.append(tr);
    }
  }
  function switchPool() {
    owned.clear(); history = [];
    text(ui.bondDrawStatus, "尚未抽選");
    renderHero(); renderAbilities(); updatePoolOverview(); updateCandidates(); renderHistory();
  }
  function renderHistory() {
    ui.bondDrawHistory.replaceChildren();
    for (const record of history.slice(0, 30)) ui.bondDrawHistory.append(element("li", record));
  }
  function acceptPoolData(data, source) {
    if (!data || typeof data.pools !== "object" || Array.isArray(data.pools)) throw new Error("檔案缺少 pools 物件");
    const next = {};
    for (const key of Object.keys(poolLabels)) {
      next[key] = engine.normalizePool(data.pools[key]);
    }
    if (!Object.values(next).some((rows) => rows.length)) throw new Error("沒有有效的 Optional 技能候選");
    pools = next;
    dataSource = source;
    const count = Object.values(next).reduce((total, rows) => total + rows.length, 0);
    text(ui.bondPoolStatus, `已載入 ${count} 筆 Optional 候選 · 來源：${dataSource} · APK 3.16.1（篩選尚未完全驗證）`);
    owned.clear();
    ui.bondSearch.value = "";
    renderAbilities();
    updateCandidates();
  }
  function setHeroData(data) {
    heroes = data?.heroes || {};
    renderHero();
  }
  ui.bondPool.addEventListener("change", switchPool);
  ui.bondHero.addEventListener("change", () => { updateHeroStatus(); updateCandidates(); });
  ui.bondSearch.addEventListener("input", renderAbilities);

  ui.bondApplyGroups.addEventListener("change", updateCandidates);
  ui.bondDraw.addEventListener("click", () => {
    const record = engine.choose(allCandidates());
    if (!record) return;
    const name = labelFor(record.abilityId);
    text(ui.bondDrawStatus, `抽中：${name}（技能 ID ${record.abilityId}；當次機率 ${record.percent.toFixed(3)}%）`);
    history.unshift(name + " · " + record.percent.toFixed(3) + "%");
    renderHistory();
  });
  ui.bondClear.addEventListener("click", () => {
    history = []; owned.clear(); ui.bondSearch.value = "";
    text(ui.bondDrawStatus, "尚未抽選");
    renderHistory(); renderAbilities(); updateCandidates();
  });
  // 只供流程測試的示範技能組合，不是英靈正式九格規則。
  ui.bondQuickTest.addEventListener("click", () => {
    const options = engine.normalizePool(poolRows());
    const picks = [...options].sort(() => Math.random() - 0.5).slice(0, 5);
    owned = new Set(picks.map((item) => item.abilityId));
    history = [];
    text(ui.bondDrawStatus, "已產生五個自由能力的示範配置（不是官方實際招募結果）。");
    renderAbilities(); updateCandidates(); renderHistory();
  });
  const embedded = window.DFCHBond30Data;
  if (embedded && embedded.optional && embedded.all) {
    setHeroData(embedded.acquisition || {});
    fixedByHero = embedded.heroes?.fixedByHero || {};
    names = embedded.heroes?.abilityNames || {};
    acceptPoolData(embedded.optional, "網頁內建資料，無需匯入");
    acceptAllPoolData(embedded.all);
    renderHero(); renderAbilities(); updatePoolOverview(); updateCandidates();
  } else {
    text(ui.bondPoolStatus, "找不到內建資料。請確認 bond30-data.js 與 index.html 在同一個資料夾。");
  }
})();
