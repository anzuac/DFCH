(() => {
  const state = {
    maxMembers: 11,
    maxPartySize: 12
  };

  const tabs = [...document.querySelectorAll(".tab")];
  const panels = [...document.querySelectorAll(".tab-panel")];
  const memberList = document.getElementById("memberList");
  const memberTemplate = document.getElementById("memberTemplate");
  const addMemberBtn = document.getElementById("addMemberBtn");
  const partyCount = document.getElementById("partyCount");
  const leaderName = document.getElementById("leaderName");
  const partySpeed = document.getElementById("partySpeed");
  const affectionGlasses = document.getElementById("affectionGlasses");
  const artifactStateText = document.getElementById("artifactStateText");
  const affectionBonus = document.getElementById("affectionBonus");
  const simulateBtn = document.getElementById("simulateBtn");
  const simulateMessage = document.getElementById("simulateMessage");

  const speedDetailsBtn = document.getElementById("speedDetailsBtn");
  const speedDetailsPanel = document.getElementById("speedDetailsPanel");
  speedDetailsBtn.addEventListener("click", () => {
    const expanded = speedDetailsBtn.getAttribute("aria-expanded") !== "true";
    speedDetailsBtn.setAttribute("aria-expanded", String(expanded));
    speedDetailsPanel.hidden = !expanded;
    speedDetailsBtn.textContent = expanded ? "收起詳細資訊" : "詳細資訊";
  });

  function activateTab(name) {
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${name}`));
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  function allUnitCards() {
    return [...document.querySelectorAll(".unit-card")];
  }

  function memberCards() {
    return [...memberList.querySelectorAll(".member-card")];
  }

  function selectedCollectorBonus() {
    const values = {
      collector1: 1,
      collector2: 2,
      collector3: 10
    };

    return [...document.querySelectorAll(".ability-tag.active")]
      .reduce((total, button) => total + (values[button.dataset.ability] || 0), 0);
  }

  function updateSpeedPreview() {
    const cards = allUnitCards();
    const speeds = cards.map((card) => card.querySelector(".speed-input").value);
    const result = window.DFCHSpeed.calcFromVisibleSpeeds({
      leaderSpeed: speeds[0], memberSpeeds: speeds.slice(1)
    });
    const tradeoff = document.getElementById("partySpeedTradeoff");
    const candidateResult = document.getElementById("candidateSpeedResult");
    const final = document.getElementById("officialSpeedResult");
    const detail = document.getElementById("speedDetailRows");
    detail.replaceChildren();
    if (!result.ready) {
      partySpeed.textContent = "請填入有效速度";
      tradeoff.textContent = "請先填妥隊伍速度，才能比較新增隊員的影響。";
      candidateResult.textContent = "等待有效隊伍配置。";
      final.textContent = "尚未完成隊伍換算";
      document.getElementById("speedCalculation").textContent = "每位角色請填入未啟動步行加速技能的面板速度（至少 0.050 km/s）。";
      document.getElementById("speedPrecision").textContent = "";
      return;
    }
    const f = (value) => value.toFixed(6);
    partySpeed.textContent = `約 ×${f(result.multiplier)}`;
    final.textContent = `隊伍最終速度：約 ×${f(result.multiplier)}`;
    const threshold = window.DFCHSpeed.actualWalkSpeedFromLevel(result.averageLevel);
    tradeoff.textContent = `隊長 ×2、隊員 ×1 加權平均，並非人數越多越快。新隊員面板速度高於約 ${threshold.toFixed(6)} km/s 會加快，低於會拖慢，相同則不變；這個門檻由目前隊伍反推估算。`;
    const candidate = document.getElementById("candidateSpeed").value;
    const joined = window.DFCHSpeed.calcFromVisibleSpeeds({leaderSpeed: speeds[0], memberSpeeds: [...speeds.slice(1), candidate]});
    if (speeds.length >= state.maxPartySize) {
      candidateResult.textContent = "隊伍已滿；請先移除一位隊員再比較。";
    } else if (candidate === "") {
      candidateResult.textContent = "輸入速度即可預覽加入後的變化。";
    } else if (!joined.ready) {
      candidateResult.textContent = "請輸入至少 0.050 km/s 的有效速度。";
    } else {
      const delta = joined.multiplier - result.multiplier;
      const direction = Math.abs(delta) < 1e-10 ? "不變" : delta > 0 ? "加快" : "變慢";
      candidateResult.textContent = `加入後：約 ×${f(joined.multiplier)}，${direction}（倍率差 ${delta >= 0 ? "+" : ""}${f(delta)}；約 ${delta >= 0 ? "+" : ""}${(delta / result.multiplier * 100).toFixed(2)}%）。只比較進度速度，未計入其他隊伍能力。`;
    }
    const levels = [result.leaderLevel, ...result.memberLevels];
    const weightedSum = levels.reduce((sum, level, index) => sum + level * (index === 0 ? 2 : 1), 0);
    const weightSum = cards.length + 1;
    cards.forEach((card, index) => {
      const row = document.createElement("tr");
      const weight = index === 0 ? 2 : 1;
      const name = card.querySelector(".unit-name").value.trim() || "未命名";
      const values = [index === 0 ? `隊長：${name}` : `隊員 ${index}：${name}`,
        `${Number(speeds[index]).toFixed(3)} km/s`, f(levels[index]),
        `×${f(window.DFCHSpeed.calcExpeditionWalkMultiplier(levels[index]))}`, `×${weight}`,
        f(levels[index] * weight), f(levels[index] * weight / weightSum)];
      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      detail.appendChild(row);
    });
    document.getElementById("speedCalculation").textContent =
      `加權總和 ${f(weightedSum)} ÷ 總權重 ${weightSum} = 平均步行值 ${f(result.averageLevel)}；` +
      `0.8 + (${f(result.averageLevel)} ÷ 100) × 3.2 = ×${f(result.multiplier)}。`;
    const bounds = [-0.0005, 0.0005].map((delta) => window.DFCHSpeed.calcFromVisibleSpeeds({
      leaderSpeed: Math.max(0.05, Number(speeds[0]) + delta),
      memberSpeeds: speeds.slice(1).map((speed) => Math.max(0.05, Number(speed) + delta))
    }).multiplier);
    document.getElementById("speedPrecision").textContent =
      `若遊戲面板四捨五入至三位小數，對應倍率約 ×${f(bounds[0])}–×${f(bounds[1])}。` +
      "顯示值為反推估算；官方面板的取整方式尚待確認。";
  }

  document.getElementById("candidateSpeed").addEventListener("input", updateSpeedPreview);

  function updateSummary() {
    const units = allUnitCards();
    const members = memberCards();
    const nameInput = document.querySelector(".leader-card .unit-name");

    partyCount.textContent = `${units.length} / ${state.maxPartySize}`;
    leaderName.textContent = nameInput?.value.trim() || "未命名";

    const isFull = members.length >= state.maxMembers;
    addMemberBtn.disabled = isFull;
    addMemberBtn.textContent = isFull
      ? `已達隊員上限 ${state.maxMembers}`
      : "＋ 新增隊員";

    const roleBonus = selectedCollectorBonus();
    const artifactBonus = affectionGlasses.checked ? 30 : 0;
    artifactStateText.textContent = affectionGlasses.checked ? "擁有" : "未擁有";
    affectionBonus.textContent = `角色 +${roleBonus}% · 神器 +${artifactBonus}% · 事件權重倍率 ×${window.DFCHAffection.ratio(roleBonus, artifactBonus).toFixed(4)}`;

    updateSpeedPreview();
  }

  function wireUnit(card) {
    card.querySelectorAll(".ability-tag").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("active");
        updateSummary();
      });
    });

    card.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", updateSummary);
    });

    const remove = card.querySelector(".remove-member");
    if (remove) {
      remove.addEventListener("click", () => {
        card.remove();
        updateSummary();
      });
    }
  }

  function addMember(prefill = {}) {
    const currentMembers = memberCards().length;

    if (currentMembers >= state.maxMembers) {
      updateSummary();
      return;
    }

    const fragment = memberTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".member-card");
    const name = card.querySelector(".unit-name");
    const speed = card.querySelector(".speed-input");

    name.value = prefill.name || `隊員 ${currentMembers + 1}`;
    speed.value = prefill.speed || "0.500";

    memberList.appendChild(card);
    wireUnit(card);
    updateSummary();
  }

  addMemberBtn.addEventListener("click", () => addMember());

  document.querySelectorAll(".leader-card").forEach(wireUnit);
  affectionGlasses.addEventListener("change", updateSummary);

  simulateBtn.addEventListener("click", () => {
    const map = document.getElementById("mapSelect");
    const runs = document.getElementById("simulationCount");
    simulateMessage.textContent =
      `V1.1：${map.options[map.selectedIndex].text} · ${runs.options[runs.selectedIndex].text}。隊伍上限與玩家可見速度欄位已固定；未加速面板速度已換算為遠征倍率；第一張地圖事件與掉落資料已接入檢視。探索配置：${window.DFCHMapConfig?.completionRate ?? 0}%。秒殺勝利模式已設定，完整事件重播與掉落抽選尚未接入。`;
    simulateBtn.classList.add("clicked");
    window.setTimeout(() => simulateBtn.classList.remove("clicked"), 220);
  });

  addMember({ name: "隊員 1", speed: "0.520" });
  addMember({ name: "隊員 2", speed: "0.480" });
  updateSummary();
})();
