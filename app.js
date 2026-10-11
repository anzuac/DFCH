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

  const staminaMode = document.getElementById("staminaMode");
  const staminaValue = document.getElementById("staminaValue");
  function updateStamina() {
    const manual = staminaMode.value === "manual";
    document.getElementById("staminaValueField").hidden = !manual;
    staminaValue.disabled = !manual;
    const config = window.DFCHStamina.configure(staminaMode.value, staminaValue.value);
    window.DFCHStaminaConfig = config;
    document.getElementById("staminaSummary").textContent = !config.ready ? config.error : manual ? `每輪隊伍耐力：${config.maximum}，恢復上限相同。` : "無限耐力：不會因耐力耗盡而結束遠征。";
    simulateBtn.disabled = !config.ready || Boolean(window.DFCHSimulationRunning);
    document.getElementById('simulateOnceBtn').disabled=simulateBtn.disabled;
  }
  staminaMode.addEventListener("change", updateStamina);
  staminaValue.addEventListener("input", updateStamina);
  updateStamina();

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
    const masters=window.DFCHMapData.collectorMasters;
    let total=0;
    for (const card of allUnitCards()) {
      const level=Number(card.querySelector('.collector-level').value);
      card.querySelectorAll('.ability-tag.active').forEach(button=>{
        const index={collector1:0,collector2:1,collector3:2}[button.dataset.ability];
        const n=index===2?level:index+1;
        const value=window.DFCHAffection.collectorValue(masters[index],n);
        if (value===null || index===2 && level<3) total=NaN;
        else total+=value;
      });
    }
    return total;
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
    if (!Number.isFinite(roleBonus)) {
      affectionBonus.textContent='請填入收集家 III 的有效等級（3–10）';
    } else affectionBonus.textContent = `角色 +${roleBonus}% · 神器 +${artifactBonus}% · 事件權重倍率 ×${window.DFCHAffection.ratio(roleBonus, artifactBonus).toFixed(4)}`;

    window.DFCHDropPreview?.refresh(Number.isFinite(roleBonus) ? window.DFCHAffection.ratio(roleBonus, artifactBonus) : NaN);
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

  let running=false,controller=null;
  const cancel=document.getElementById('cancelSimulation'),bar=document.getElementById('simulationProgress');
  cancel.addEventListener('click',()=>controller?.abort());
  async function startSimulation(once=false) {
    if(running)return;
    try {
      const data=window.DFCHMaps[document.getElementById('mapSelect').value];
      if(!data)throw new Error('此地圖尚未接入');
      const seed=window.DFCHRandom.freshSeed();
      const cards=allUnitCards(),speeds=cards.map(c=>c.querySelector('.speed-input').value);
      const speed=window.DFCHSpeed.calcFromVisibleSpeeds({leaderSpeed:speeds[0],memberSpeeds:speeds.slice(1)});
      if(!speed.ready)throw new Error('請填妥每位角色的步行速度。');
      const role=selectedCollectorBonus();if(!Number.isFinite(role))throw new Error('收集家等級無效。');
      const ids={collector1:0,collector2:1,collector3:2};
      const abilityIds=[...new Set(cards.flatMap(c=>[...c.querySelectorAll('.ability-tag.active')].map(b=>data.collectorMasters[ids[b.dataset.ability]].rewardId)))];
      const ownedInputs=[...document.querySelectorAll('#dropStateControls input')],daily=document.getElementById('dailyDiamondCount');
      if(daily.value.trim()===''||ownedInputs.some(i=>i.value.trim()===''))throw new Error('請填妥持有量與當日鑽石累計。');
      const flags=[];if(document.getElementById('stoneSearchAvailable').checked)flags.push(data.master.basicFlagUnlockConditions[0]);if(document.getElementById('stoneUnlocked').checked)flags.push(data.master.stoneFlag);
      const options={seed,multiplier:speed.multiplier,abilityIds,affectionRatio:window.DFCHAffection.ratio(role,affectionGlasses.checked?30:0),completionRate:window.DFCHMapConfig?.completionRate??0,stamina:window.DFCHStaminaConfig,saved:{daily:Number(daily.value),owned:Object.fromEntries(ownedInputs.map(i=>[i.dataset.reward,Number(i.value)])),flags}};
      // Snapshot all controls: editing during a run cannot change its config.
      const count=once?1:Number(document.getElementById('simulationCount').value),mode=document.getElementById('simulationMode').value;
      if(window.DFCHRecordStore.error)throw new Error(window.DFCHRecordStore.error);
      const previous=window.DFCHRecordStore.get(mode,data.master.key);
      if(mode==='continuous'&&previous){options.saved=previous.latest.saved;options.completionRate=previous.latest.completionRate;}
      window.DFCHSimulator.create(data,options); // fail before replacing prior results
      running=true;window.DFCHSimulationRunning=true;simulateBtn.disabled=true;document.getElementById('mapSelect').disabled=true;document.getElementById('simulateOnceBtn').disabled=true;cancel.hidden=false;bar.hidden=false;bar.max=count;bar.value=0;controller=new AbortController();
      let lastRecordPaint=0;
      const result=await window.DFCHSimulationBatch.run(data,options,{count,mode,signal:controller.signal,seedFactory:window.DFCHRandom.freshSeed,onLimit:info=>{
        window.DFCHRecordView.render();
        simulateMessage.textContent=`已暫停：今日此地圖一般鑽石 ${info.daily}／${info.limit}，已達上限。已完成 ${info.completed} 輪已保存。`;
        return window.confirm(`今日「${info.mapName}」的一般鑽石已達上限（${info.daily}／${info.limit}）。\n已完成 ${info.completed} 輪並存檔，尚有 ${info.requested-info.completed} 輪。\n繼續後將套用一般鑽石上限規則；神級鑽石仍可取得。\n是否繼續遠征？`);
      },onResult:r=>window.DFCHRecordStore.add(mode,data,r,options),onProgress:a=>{bar.value=a.completed;simulateMessage.textContent=`執行中：${a.completed.toLocaleString()}／${count.toLocaleString()} 輪。已完成輪已自動存檔。`;if(Date.now()-lastRecordPaint>=150){window.DFCHRecordView.render();lastRecordPaint=Date.now();}}});
      window.DFCHLastSimulation=result;window.DFCHSimulationView.render(data,result);
      simulateMessage.textContent=`${result.stopReason==='diamond-limit'?'已停止：今日此地圖一般鑽石達到上限':result.cancelled?'已中止':'已完成'}：${result.completed.toLocaleString()} 輪，${result.goals.toLocaleString()} 輪到達終點；第一輪種子 ${seed}。${mode==='continuous'&&result.last?.limitReachedAtEnd?' 今日此地圖一般鑽石已達上限。':''}`;
    } catch(error) {
      simulateMessage.textContent=`模擬未完成：${error.message}。沒有結算未完成的遠征。`;
    } finally {
      running=false;window.DFCHSimulationRunning=false;controller=null;cancel.hidden=true;document.getElementById('mapSelect').disabled=false;updateStamina();document.getElementById('simulateOnceBtn').disabled=simulateBtn.disabled;window.DFCHRecordView.render();
    }
  }
  simulateBtn.addEventListener('click',()=>startSimulation(false));
  document.getElementById('simulateOnceBtn').addEventListener('click',()=>startSimulation(true));
  const modeSelect=document.getElementById('simulationMode');
  function modeNote(){document.getElementById('simulationModeNote').textContent=modeSelect.value==='independent'?'每輪獨立初始化；只累積紀錄，不承接鑽石上限與持有量。':'承接連續面板已存進度；若無紀錄才採用玩家起始配置。可在儀表板調整當日鑽石或重置。';}
  modeSelect.addEventListener('change',modeNote);modeNote();

  addMember({ name: "隊員 1", speed: "0.520" });
  addMember({ name: "隊員 2", speed: "0.480" });
  updateSummary();
})();
