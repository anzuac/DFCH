(() => {
  const state = {
    maxMembers: 20
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
  const affectionBonus = document.getElementById("affectionBonus");
  const simulateBtn = document.getElementById("simulateBtn");
  const simulateMessage = document.getElementById("simulateMessage");

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

  function selectedCollectorBonus() {
    const values = {
      collector1: 1,
      collector2: 2,
      collector3: 10
    };

    return [...document.querySelectorAll(".ability-tag.active")]
      .reduce((total, button) => total + (values[button.dataset.ability] || 0), 0);
  }

  function updateSummary() {
    const units = allUnitCards();
    const nameInput = document.querySelector(".leader-card .unit-name");
    const speeds = units
      .map((card) => Number(card.querySelector(".speed-input")?.value))
      .filter((value) => Number.isFinite(value) && value > 0);

    partyCount.textContent = String(units.length);
    leaderName.textContent = nameInput?.value.trim() || "未命名";

    if (speeds.length) {
      const min = Math.min(...speeds).toFixed(3);
      const max = Math.max(...speeds).toFixed(3);
      partySpeed.textContent = `待解析 · 個體 ${min}–${max}`;
    } else {
      partySpeed.textContent = "待解析";
    }

    const roleBonus = selectedCollectorBonus();
    const artifactBonus = affectionGlasses.checked ? 30 : 0;
    affectionBonus.textContent = `角色 +${roleBonus}% · 神器 +${artifactBonus}%`;
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
    const currentMembers = memberList.querySelectorAll(".member-card").length;
    if (currentMembers >= state.maxMembers) {
      addMemberBtn.textContent = `最多 ${state.maxMembers} 名隊員`;
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
      `V1 已確認操作：${map.options[map.selectedIndex].text} · ${runs.options[runs.selectedIndex].text}。正式抽選於 V4 接入。`;
    simulateBtn.classList.add("clicked");
    window.setTimeout(() => simulateBtn.classList.remove("clicked"), 220);
  });

  // V1 預放兩名隊員，方便直接看到「隊長 + 多隊員」版面。
  addMember({ name: "隊員 1", speed: "0.520" });
  addMember({ name: "隊員 2", speed: "0.480" });
  updateSummary();
})();
