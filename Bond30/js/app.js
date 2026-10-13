(() => {
  'use strict';
  const D = window.DFCH_DATA;
  if (!D) return;
  const $ = id => document.getElementById(id);
  const pools = Object.keys(D.poolNames);
  const STORAGE_KEY = 'dfch-bond30-record-v1';
  const ARTIFACTS = [
    { id: 301008017, checkbox: 'artifactEye', abilities: [303000404, 303000405, 303000406] },
    { id: 301008020, checkbox: 'artifactSword', abilities: [303000310, 303000311, 303000312] }
  ];
  const EXTRA_REQUIRED = { default_gacha: 303000901, sea_pickup: 303000250, '2026_sea_pickup': 303000250 };
  const state = {
    pool: pools[0], star: 4, hero: '', buffs: [null, null], chosen: [],
    mode: 'attack', active: 0, artifactExcluded: new Set(),
    totalDraws: 0, lastDraws: 0, history: [], selectedTarget: ''
  };

  function restoreStats() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value) return;
      if (Number.isSafeInteger(value.totalDraws) && value.totalDraws >= 0 && Number.isSafeInteger(value.totalDraws * 500)) state.totalDraws = value.totalDraws;
      if (Array.isArray(value.history)) state.history = value.history.filter(x => typeof x === 'string').slice(0, 35);
    } catch (_) { /* Storage can be unavailable in private/local contexts. */ }
  }
  function persistStats() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({totalDraws: state.totalDraws, history: state.history})); }
    catch (_) { /* Continue with in-memory statistics. */ }
  }

  const make = (tag, text, className) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = String(text);
    if (className) e.className = className;
    return e;
  };
  const nameOf = id => D.displayNames[String(id)] || '未知能力';
  const format = n => Number(n || 0).toLocaleString('zh-TW');
  const percent = (w, total) => total > 0 ? (w / total * 100).toFixed(3) + '%' : '0.000%';
  const groupLabel = g => ({ 0: '確定能力', 1: '自由能力', 2: '攻擊增益', 3: 'HP 增益' })[g];
  const professionName = j => ({ 1: '劍士', 2: '弓箭手', 4: '法師' })[j] || '未知職業';
  const rows = () => D.poolRows[state.pool].map(([id, group, weight]) => ({ id, group, weight }));
  const optional = () => rows().filter(x => x.group === 1);
  const roster = () => D.poolRarityRoster[state.pool][String(state.star)] || [];
  const hero = () => D.heroRoster[state.hero] || null;
  const condition = id => D.abilityConditions[String(id)] || { cond: 0, jobMask: 0 };
  const jobOK = id => {
    const mask = Number(condition(id).jobMask || 0);
    return mask === 0 || Boolean(mask & (hero()?.job || 0));
  };
  const specialArtifact = id => {
    const c = condition(id);
    return c.cond === 1 ? ARTIFACTS.find(a => a.id === c.condValue) : null;
  };
  const artifactExcluded = id => {
    const a = specialArtifact(id);
    return !!a && state.artifactExcluded.has(a.id);
  };
  const requiredExtra = () => {
    if (state.star === 5) return null;
    const id = EXTRA_REQUIRED[state.pool];
    return id && rows().some(r => r.group === 0 && r.id === id) ? id : null;
  };
  const fixedSlots = () => {
    if (state.star === 5) {
      return (D.heroes[state.hero]?.fixed || []).map((id, i) => ({
        id, role: i === 0 ? '確定格' : i === 1 ? '攻擊增益' : i === 2 ? 'HP 增益' : '固有能力'
      }));
    }
    const list = [{ id: 303000000, role: '確定格' }];
    if (requiredExtra()) list.push({ id: requiredExtra(), role: '確定格' });
    return list;
  };
  const freeSize = () => 9 - fixedSlots().length - (state.star === 5 ? 0 : 2);
  const held = () => new Set([
    ...fixedSlots().map(x => x.id),
    ...state.buffs.filter(x => x !== null),
    ...state.chosen.filter(x => x !== null)
  ]);
  const exclusion = x => {
    if (condition(x.id).cond !== 0) return '羈絆限定排除';
    if (!jobOK(x.id)) return '不適用此職業';
    if (held().has(x.id)) return '已擁有';
    return '';
  };
  const choices = () => optional().filter(x => !exclusion(x));
  const totalWeight = list => list.reduce((a, x) => a + x.weight, 0);
  const ready = () => {
    const n = fixedSlots().length + (state.star === 5 ? 0 : state.buffs.filter(x => x !== null).length) + state.chosen.filter(x => x !== null).length;
    return { n, ok: !!hero() && n === 9 && state.chosen.length === freeSize() && state.chosen.every(x => x !== null) && (state.star === 5 || state.buffs.every(x => x !== null)) };
  };
  const image = (id, className) => {
    const src = D.images[String(id)];
    if (!src) return make('span', '◇', className + ' plus');
    const img = make('img', undefined, className); img.src = src; img.alt = nameOf(id); img.loading = 'lazy';
    return img;
  };

  function renderHero() {
    const list = roster(), select = $('fiveHero');
    if (!list.some(id => String(id) === state.hero)) state.hero = list.length ? String(list[0]) : '';
    select.replaceChildren();
    list.forEach(id => {
      const h = D.heroRoster[String(id)];
      if (!h) return;
      const option = make('option', h.name + ' · ' + professionName(h.job)); option.value = String(id); select.append(option);
    });
    select.value = state.hero;
    const h = hero(), extra = requiredExtra();
    $('heroStatus').textContent = !h ? '此池沒有對應英靈。' :
      '已選擇 ' + h.name + '（' + professionName(h.job) + '）' +
      (state.star === 5 ? '，固有能力已自動配置。' : extra ? '，已固定「氣力」及「' + nameOf(extra) + '」。' : '。');
  }

  function renderSlots() {
    const board = $('slots'); board.replaceChildren();
    fixedSlots().forEach(slot => {
      const cell = make('div', undefined, 'slot lock');
      cell.append(image(slot.id, 'glyph'), make('strong', nameOf(slot.id)), make('small', slot.role + ' · 固定'));
      board.append(cell);
    });
    if (state.star !== 5) [0, 1].forEach(i => {
      const kind = i === 0 ? 'attack' : 'hp', id = state.buffs[i];
      const cell = make('button', undefined, 'slot ' + (id !== null ? 'filled' : '') + (state.mode === kind ? ' active' : ''));
      cell.type = 'button';
      cell.append(id !== null ? image(id, 'glyph') : make('span', '＋', 'plus'),
        make('strong', id !== null ? nameOf(id) : (i === 0 ? '選擇攻擊增益' : '選擇 HP 增益')),
        make('small', i === 0 ? '攻擊增益格' : 'HP 增益格'));
      cell.addEventListener('click', () => { state.mode = kind; render(); }); board.append(cell);
    });
    state.chosen.forEach((id, i) => {
      const cell = make('button', undefined, 'slot ' + (id !== null ? 'filled' : '') + (state.mode === 'free' && state.active === i ? ' active' : ''));
      cell.type = 'button';
      cell.append(id !== null ? image(id, 'glyph') : make('span', '＋', 'plus'),
        make('strong', id !== null ? nameOf(id) : '選擇自由能力'), make('small', '自由格 ' + (i + 1)));
      cell.addEventListener('click', () => { state.mode = 'free'; state.active = i; render(); }); board.append(cell);
    });
    $('clearSlot').disabled = state.mode === 'free' ? state.chosen[state.active] == null : state.buffs[state.mode === 'attack' ? 0 : 1] == null;
    $('pickerTitle').textContent = state.mode === 'free' ? '選擇自由能力' : state.mode === 'attack' ? '選擇攻擊增益' : '選擇 HP 增益';
    $('activeLabel').textContent = state.mode === 'free' ? '自由格 ' + (state.active + 1) : state.mode === 'attack' ? '攻擊增益格' : 'HP 增益格';
  }

  function renderSkills() {
    const list = $('skills'); list.replaceChildren();
    const q = $('search').value.trim().toLowerCase();
    const group = state.mode === 'free' ? 1 : state.mode === 'attack' ? 2 : 3;
    const candidates = rows().filter(x => x.group === group && nameOf(x.id).toLowerCase().includes(q))
      .sort((a, b) => b.weight - a.weight || a.id - b.id);
    $('searchInfo').textContent = groupLabel(group) + ' · ' + candidates.length + ' 項';
    const selected = state.mode === 'free' ? state.chosen[state.active] : state.buffs[group === 2 ? 0 : 1];
    const occupied = held();
    candidates.forEach(x => {
      const sameAlreadyHeld = occupied.has(x.id) && selected !== x.id;
      const notForJob = group === 1 && !jobOK(x.id);
      const blockedByArtifact = group === 1 && artifactExcluded(x.id);
      const button = make('button', undefined, 'skill' + (blockedByArtifact ? ' suppressed' : '')); button.type = 'button';
      button.disabled = sameAlreadyHeld || notForJob;
      const info = make('span', undefined, 'info');
      info.append(make('strong', nameOf(x.id)), make('small',
        notForJob ? '不適用此職業' : sameAlreadyHeld ? '九格已持有' :
        blockedByArtifact ? '神器設定已啟用 · 仍可手動配置' :
        specialArtifact(x.id) ? '羈絆 30 等不會抽到此能力' : ''));
      button.append(image(x.id, 'icon'), info, make('span', '權重 ' + x.weight, 'weight'));
      button.addEventListener('click', () => {
        if (group === 1) {
          state.chosen[state.active] = x.id;
          const next = state.chosen.indexOf(null);
          if (next >= 0) state.active = next;
          state.mode = 'free';
        } else {
          state.buffs[group === 2 ? 0 : 1] = x.id;
          state.mode = state.buffs[0] == null ? 'attack' : state.buffs[1] == null ? 'hp' : 'free';
        }
        render();
      });
      list.append(button);
    });
    if (!candidates.length) list.append(make('p', '沒有符合的能力。', 'hint'));
  }

  function renderTarget() {
    const available = choices().sort((a, b) => a.id - b.id), select = $('targetAbility');
    if (!available.some(x => String(x.id) === state.selectedTarget)) {
      state.selectedTarget = available.length ? String(available[0].id) : '';
    }
    select.replaceChildren();
    available.forEach(x => {
      const option = make('option', nameOf(x.id) + ' · ' + percent(x.weight, totalWeight(available)));
      option.value = String(x.id); select.append(option);
    });
    select.value = state.selectedTarget;
    const target = available.find(x => String(x.id) === state.selectedTarget);
    $('targetProbability').textContent = target ? '每次抽中的機率：約 ' + percent(target.weight, totalWeight(available)) : '目前沒有可抽選的目標。';
    $('autoDraw').disabled = !ready().ok || !target || totalWeight(available) <= 0;
    $('draw').disabled = !ready().ok || totalWeight(available) <= 0;
  }
  function renderStats() {
    $('totalDraws').textContent = format(state.totalDraws);
    $('totalDiamonds').textContent = format(state.totalDraws * 500);
    $('lastDraws').textContent = state.lastDraws ? format(state.lastDraws) : '—';
    const history = $('history'); history.replaceChildren();
    state.history.forEach(text => history.append(make('li', text)));
    if (!state.history.length) history.append(make('li', '尚無抽選紀錄。'));
  }
  function renderRates() {
    const available = choices().sort((a, b) => b.weight - a.weight || a.id - b.id);
    const total = totalWeight(available);
    $('valid').textContent = format(available.length);
    $('weights').textContent = format(total);
    $('owned').textContent = state.chosen.filter(x => x !== null).length + ' / ' + freeSize();
    const list = $('rates'); list.replaceChildren();
    available.forEach(x => {
      const line = make('div', undefined, 'rate');
      line.append(make('span', nameOf(x.id)), make('b', percent(x.weight, total) + ' · 權重 ' + x.weight)); list.append(line);
    });
    renderTarget(); renderStats();
  }
  function renderGate() {
    const r = ready();
    $('completionText').textContent = '九格已配置 ' + r.n + ' / 9' + (r.ok ? ' · 可以開始抽選' : ' · 請繼續配置能力');
    $('completionBar').style.width = (r.n / 9 * 100) + '%';
    $('bondGate').hidden = r.ok;
    $('bondStage').hidden = !r.ok;
    $('bondGateMessage').textContent = '仍需配置 ' + (9 - r.n) + ' 格才能開放羈絆抽選。';
  }
  function render() {
    renderHero();
    const extra = requiredExtra();
    $('fixedRequiredNotice').hidden = !extra;
    if (extra) $('fixedRequiredNotice').textContent = '本池確定能力：氣力＋' + nameOf(extra) + '，自由格共 5 格。';
    renderSlots(); renderSkills(); renderGate(); renderRates();
  }
  function showResult(hit, draws, isAutomatic) {
    const result = $('result'); result.replaceChildren();
    const line = make('div', undefined, 'result-line');
    const description = make('div');
    description.append(make('strong', nameOf(hit.id)), make('small',
      (isAutomatic ? '快速抽選成功 · 本次 ' + format(draws) + ' 抽' : '單次抽選') +
      ' · 花費 ' + format(draws * 500) + ' 鑽石'));
    line.append(image(hit.id, 'icon'), description); result.append(line);
  }
  function commitDraw(hit, count, isAutomatic) {
    state.totalDraws += count;
    state.lastDraws = count;
    const entry = (isAutomatic ? '快速抽選 ' : '單抽 ') + nameOf(hit.id) +
      ' · ' + format(count) + ' 抽 · ' + format(count * 500) + ' 鑽石';
    state.history.unshift(entry); state.history = state.history.slice(0, 35);
    showResult(hit, count, isAutomatic); persistStats(); renderStats();
  }
  function drawOne() {
    if (!ready().ok) return;
    const pool = choices(); const total = totalWeight(pool);
    if (!total) return;
    let cursor = Math.random() * total;
    let hit = pool[pool.length - 1];
    for (const x of pool) { cursor -= x.weight; if (cursor < 0) { hit = x; break; } }
    commitDraw(hit, 1, false);
  }
  function drawUntilTarget() {
    if (!ready().ok) return;
    const pool = choices(), total = totalWeight(pool);
    const target = pool.find(x => String(x.id) === state.selectedTarget);
    if (!total || !target || target.weight <= 0) return;
    const p = target.weight / total;
    // A geometric random variable exactly matches repeated independent weighted draws.
    // It avoids blocking the UI when many simulated attempts are needed.
    const u = Math.max(Number.MIN_VALUE, Math.random());
    const count = p >= 1 ? 1 : Math.floor(Math.log(u) / Math.log1p(-p)) + 1;
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(state.totalDraws + count) || !Number.isSafeInteger((state.totalDraws + count) * 500)) {
      $('result').textContent = '抽選次數超出可記錄範圍，請重置紀錄後再試。';
      return;
    }
    commitDraw(target, count, true);
  }
  function resetConfiguration() {
    renderHero();
    state.buffs = [null, null]; state.chosen = Array(freeSize()).fill(null);
    state.mode = state.star === 5 ? 'free' : 'attack'; state.active = 0;
    state.selectedTarget = ''; $('search').value = '';
    $('result').textContent = '尚未抽選。';
    render();
  }

  for (const pool of pools) {
    const option = make('option', D.poolNames[pool]); option.value = pool; $('pool').append(option);
  }
  $('pool').value = state.pool;
  $('star').value = String(state.star);
  $('pool').addEventListener('change', event => { state.pool = event.target.value; state.hero = ''; resetConfiguration(); });
  $('star').addEventListener('change', event => { state.star = Number(event.target.value); state.hero = ''; resetConfiguration(); });
  $('fiveHero').addEventListener('change', event => { state.hero = event.target.value; resetConfiguration(); });
  $('search').addEventListener('input', renderSkills);
  $('targetAbility').addEventListener('change', event => { state.selectedTarget = event.target.value; renderTarget(); });
  $('reset').addEventListener('click', resetConfiguration);
  $('clearSlot').addEventListener('click', () => {
    if (state.mode === 'free') state.chosen[state.active] = null;
    else state.buffs[state.mode === 'attack' ? 0 : 1] = null;
    render();
  });
  for (const a of ARTIFACTS) {
    $(a.checkbox).addEventListener('change', event => {
      if (event.target.checked) state.artifactExcluded.add(a.id);
      else state.artifactExcluded.delete(a.id);
      renderSkills();
    });
  }
  $('autofill').addEventListener('click', () => {
    if (state.star !== 5) {
      [2, 3].forEach((group, i) => {
        const options = rows().filter(x => x.group === group);
        if (options.length) state.buffs[i] = options[Math.floor(Math.random() * options.length)].id;
      });
    }
    state.chosen = Array(freeSize()).fill(null);
    const options = optional().filter(x => jobOK(x.id) && !artifactExcluded(x.id) && !held().has(x.id));
    for (let i = 0; i < state.chosen.length && options.length; i++) {
      const total = totalWeight(options); let cursor = Math.random() * total, index = options.length - 1;
      for (let j = 0; j < options.length; j++) { cursor -= options[j].weight; if (cursor < 0) { index = j; break; } }
      state.chosen[i] = options.splice(index, 1)[0].id;
    }
    state.mode = 'free'; state.active = 0; render();
  });
  $('draw').addEventListener('click', drawOne);
  $('autoDraw').addEventListener('click', drawUntilTarget);
  $('resetCount').addEventListener('click', () => {
    state.totalDraws = 0; state.lastDraws = 0; state.history = [];
    $('result').textContent = '抽選統計已重置。'; persistStats(); renderStats();
  });
  restoreStats();
  resetConfiguration();
})();
