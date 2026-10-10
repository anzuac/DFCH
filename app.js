(() => {
  const Speed = window.DFCHSpeed;

  const state = {
    hardMaxMembers: 11,
    hardMaxPartySize: 12
  };

  const tabs = [...document.querySelectorAll(".tab")];
  const panels = [...document.querySelectorAll(".tab-panel")];
  const memberList = document.getElementById("memberList");
  const memberTemplate = document.getElementById("memberTemplate");
  const addMemberBtn = document.getElementById("addMemberBtn");
  const partyCount = document.getElementById("partyCount");
  const leaderName = document.getElementById("leaderName");
  const partySpeed = document.getElementById("partySpeed");
  const leaderLeadership = document.getElementById("leaderLeadership");
  const slotCountPreview = document.getElementById("slotCountPreview");
  const memberLimitText = document.getElementById("memberLimitText");
  const averageWalkLevel = document.getElementById("averageWalkLevel");
  const walkMultiplier = document.getElementById("walkMultiplier");
  const affectionGlasses = document.getElementById("affectionGlasses");
  const artifactStateText = document.getElementById("artifactStateText");
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

  function officialPartyCapacity() {
    const leadership = Number(leaderLeadership?.value);
    const calculated = Speed?.calcPartySlotCount(leadership) ?? 1;

    // Current game-facing V1 UI is capped at 12 total slots:
    // 1 leader + 11 members. The underlying formula itself is kept separate.
    return Math.min(state.hardMaxPartySize, calculated);
  }

  function officialMemberCapacity() {
    return Math.max(0, officialPartyCapacity() - 1);
  }

  function readWalkLevel(card) {
    const input = card.querySelector(".walk-level-input");
    if (!input || input.value.trim() === "") return null;
    const value = Number(input.value);
    return Number.isFinite(value) ? value : null;
  }

  function updateOfficialSpeed() {
    const leaderCard = document.querySelector(".leader-card");
    const leaderLevel = readWalkLevel(leaderCard);
    const memberLevels = memberCards().map(readWalkLevel);

    if (leaderLevel === null || memberLevels.some((value) => value === null)) {
      averageWalkLevel.textContent = "—";
      walkMultiplier.textContent = "—";
      partySpeed.textContent = "待填步行等級";
      return;
    }

    const result = Speed.calcPartyWalkSpeed({
      leaderLevel,
      memberLevels
    });

    averageWalkLevel.textContent = result.averageLevel.toFixed(3);
    walkMultiplier.textContent = `×${result.multiplier.toFixed(4)}`;
    partySpeed.textContent = `×${result.multiplier.toFixed(4)}`;
  }

  function updateSummary() {
    const units = allUnitCards();
    const members = memberCards();
    const nameInput = document.querySelector(".leader-card .unit-name");
    const leadership = Number(leaderLeadership?.value) || 0;
    const capacity = officialPartyCapacity();
    const memberCapacity = officialMemberCapacity();

    partyCount.textContent = `${units.length} / ${capacity}`;
    leaderName.textContent = nameInput?.value.trim() || "未命名";
    slotCountPreview.textContent = String(capacity);

    memberLimitText.textContent =
      `統率力 ${leadership} → 可編制 ${capacity} 人（隊長 1 + 隊員 ${memberCapacity}）`;

    const isFull = members.length >= memberCapacity || members.length >= state.hardMaxMembers;
    addMemberBtn.disabled = isFull;
    addMemberBtn.textContent = isFull
      ? `已達隊員上限 ${Math.min(memberCapacity, state.hardMaxMembers)}`
      : "＋ 新增隊員";

    document.querySelector(".leader-card")?.classList.toggle(
      "over-capacity",
      members.length > memberCapacity
    );

    const roleBonus = selectedCollectorBonus();
    const artifactBonus = affectionGlasses.checked ? 30 : 0;
    artifactStateText.textContent = affectionGlasses.checked ? "擁有" : "未擁有";
    affectionBonus.textContent = `角色 +${roleBonus}% · 神器 +${artifactBonus}%`;

    updateOfficialSpeed();
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
    const allowedMembers = Math.min(state.hardMaxMembers, officialMemberCapacity());

    if (currentMembers >= allowedMembers) {
      updateSummary();
      return;
    }

    const fragment = memberTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".member-card");
    const name = card.querySelector(".unit-name");
    const speed = card.querySelector(".speed-input");
    const walkLevel = card.querySelector(".walk-level-input");

    name.value = prefill.name || `隊員 ${currentMembers + 1}`;
    speed.value = prefill.speed || "0.500";
    walkLevel.value = prefill.walkLevel ?? "";

    memberList.appendChild(card);
    wireUnit(card);
    updateSummary();
  }

  addMemberBtn.addEventListener("click", () => addMember());

  document.querySelectorAll(".leader-card").forEach(wireUnit);
  leaderLeadership.addEventListener("input", updateSummary);
  affectionGlasses.addEventListener("change", updateSummary);

  simulateBtn.addEventListener("click", () => {
    const map = document.getElementById("mapSelect");
    const runs = document.getElementById("simulationCount");
    simulateMessage.textContent =
      `V1：${map.options[map.selectedIndex].text} · ${runs.options[runs.selectedIndex].text}。隊伍編制與速度倍率已使用目前確認的官方公式；地圖事件與掉落抽選仍待 V3 / V4 接入。`;
    simulateBtn.classList.add("clicked");
    window.setTimeout(() => simulateBtn.classList.remove("clicked"), 220);
  });

  // V1 保留幾個空白隊員槽作為 UI 預覽；正式上限由統率力公式與 1+11 上限共同限制。
  addMember({ name: "隊員 1", speed: "0.520" });
  addMember({ name: "隊員 2", speed: "0.480" });
  updateSummary();
})();
