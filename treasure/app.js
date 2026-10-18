(() => {
  'use strict';
  const E = window.DFCHTreasureEngine;
  if (!E) return;
  const $ = id => document.getElementById(id);
  const storeKey = 'dfch-treasure-continuation-v1';
  const nf = new Intl.NumberFormat('zh-TW');
  const percent = (value, digits = 2) => (100 * value).toFixed(digits) + '%';
  const storage = (() => { try { return window.localStorage; } catch (_) { return null; } })();
  let minimum = 4;
  let stats = E.blankStats();
  let last = null;
  let busy = false;
  const HOLD_DELAY_MS = 420;
  const HOLD_REPEAT_MS = 300;
  const openButton = $('openOnce');
  let activePointer = null;
  let holdTimer = null;
  let repeatTimer = null;
  let holdActive = false;
  let holdDraws = 0;
  let suppressClick = false;
  const sanitizeStats = candidate => {
    const s = E.blankStats();
    if (!candidate || typeof candidate !== 'object') return s;
    for (const key of Object.keys(s)) {
      const value = candidate[key];
      if (Number.isSafeInteger(value) && value >= 0) s[key] = value;
    }
    // Never use malformed or partly mismatched saved statistics.
    if (s.runs !== s.normalRuns + s.specialRuns || s.items !== s.a + s.b + s.ordinary || s.continuationChecks !== s.continueSuccess + s.runs || s.hitRuns > s.runs) return E.blankStats();
    return s;
  };
  try {
    const saved = storage && JSON.parse(storage.getItem(storeKey));
    if (saved && [4, 11].includes(saved.minimum)) minimum = saved.minimum;
    stats = sanitizeStats(saved?.stats);
  } catch (_) { /* local storage is optional */ }
  function persist() { try { storage?.setItem(storeKey, JSON.stringify({ minimum, stats })); } catch (_) { /* private browsing */ } }
  function updateStats() {
    $('statRuns').textContent = nf.format(stats.runs);
    $('statItems').textContent = nf.format(stats.items);
    $('statA').textContent = nf.format(stats.a);
    $('statB').textContent = nf.format(stats.b);
    $('statAverage').textContent = stats.runs ? (stats.items / stats.runs).toFixed(2) + ' 件' : '—';
    $('statRetention').textContent = stats.continuationChecks ? percent(stats.continueSuccess / stats.continuationChecks) : '—';
    $('statHitRuns').textContent = nf.format(stats.hitRuns);
  }
  function updateMode() {
    document.querySelectorAll('.mode-option').forEach(button => {
      const chosen = Number(button.dataset.minimum) === minimum;
      button.classList.toggle('selected', chosen);
      button.setAttribute('aria-pressed', String(chosen));
    });
    $('minItemCaption').textContent = minimum;
    $('probPerRun').textContent = percent(E.theoreticalHitChance(minimum), 3);
    persist();
  }
  function renderLast(draw) {
    if (!draw) return;
    last = draw;
    $('emptyResult').hidden = true;
    $('resultContent').hidden = false;
    $('lastMode').textContent = draw.minimum === 4 ? '普通開箱' : '特殊續開試算';
    $('lastItems').textContent = nf.format(draw.items);
    $('lastRare').textContent = nf.format(draw.a + draw.b);
    $('lastStreak').textContent = nf.format(draw.continueSuccess);
    $('lootCaption').textContent = `大獎 A ×${draw.a}　大獎 B ×${draw.b}　普通 ×${draw.ordinary}`;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < draw.rewards.length; i++) {
      const reward = draw.rewards[i];
      const tile = document.createElement('div');
      const kind = reward.type;
      tile.className = 'loot-tile type-' + kind;
      tile.style.setProperty('--delay', Math.min(i, 23) * 27 + 'ms');
      const symbol = document.createElement('span');
      symbol.className = 'tile-icon';
      symbol.textContent = kind === 'A' ? '✦' : kind === 'B' ? '◆' : '◈';
      const caption = document.createElement('small');
      caption.textContent = kind === 'ordinary' ? '普通' : '大獎 ' + kind;
      tile.title = `第 ${reward.number} 件：${caption.textContent}`;
      tile.append(symbol, caption);
      fragment.appendChild(tile);
    }
    $('lootGrid').replaceChildren(fragment);
    const hidden = draw.items - draw.rewards.length;
    $('lootRemainder').hidden = hidden <= 0;
    $('lootRemainder').textContent = hidden > 0 ? `另有 ${nf.format(hidden)} 件普通獎勵未展開；所有大獎都會顯示。` : '';
  }
  // Each user action draws exactly one chest. No client-side batch submission
  // or upload of claimed results will be used for the future public leaderboard.
  function drawSingle() {
    if (busy) return false;
    busy = true;
    try {
      const draw = E.drawOnce(minimum, Math.random, { capture: true });
      E.addStats(stats, draw);
      updateStats();
      renderLast(draw);
      persist();
      if (holdActive) {
        holdDraws += 1;
        const status = $('autoDrawStatus');
        status.hidden = false;
        status.textContent = `長按抽獎中 · 已開 ${nf.format(holdDraws)} 次，鬆開立即停止`;
      } else {
        $('autoDrawStatus').hidden = true;
      }
      return true;
    } catch (error) {
      stopPress('error');
      const status = $('autoDrawStatus');
      status.hidden = false;
      status.textContent = '開箱發生錯誤：' + String(error.message || error);
      return false;
    } finally {
      busy = false;
    }
  }
  function stopPress(reason = 'release') {
    if (holdTimer !== null) clearTimeout(holdTimer);
    if (repeatTimer !== null) clearInterval(repeatTimer);
    holdTimer = null;
    repeatTimer = null;
    const wasHolding = holdActive;
    activePointer = null;
    holdActive = false;
    openButton.classList.remove('is-holding');
    $('drawButtonText').textContent = '點擊開始抽獎';
    if (wasHolding) {
      suppressClick = true; // discard the synthetic click generated by a long pointer press
      requestAnimationFrame(() => { suppressClick = false; });
      const status = $('autoDrawStatus');
      status.hidden = false;
      status.textContent = `已停止連續抽獎 · 此次長按共 ${nf.format(holdDraws)} 次`;
    }
  }
  openButton.addEventListener('pointerdown', event => {
    if (activePointer !== null || busy || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    activePointer = event.pointerId;
    holdDraws = 0;
    holdTimer = setTimeout(() => {
      if (activePointer !== event.pointerId) return;
      holdTimer = null;
      holdActive = true;
      suppressClick = true;
      openButton.classList.add('is-holding');
      $('drawButtonText').textContent = '連續抽獎中 · 放開停止';
      if (!drawSingle()) return;
      repeatTimer = setInterval(() => { drawSingle(); }, HOLD_REPEAT_MS);
    }, HOLD_DELAY_MS);
  });
  window.addEventListener('pointerup', event => {
    if (event.pointerId === activePointer) stopPress('release');
  });
  window.addEventListener('pointercancel', event => {
    if (event.pointerId === activePointer) stopPress('cancel');
  });
  openButton.addEventListener('pointerleave', event => {
    if (event.pointerId === activePointer) stopPress('leave');
  });
  openButton.addEventListener('contextmenu', event => event.preventDefault());
  openButton.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); return; }
    drawSingle();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPress('hidden'); });
  window.addEventListener('blur', () => { if (activePointer !== null) stopPress('blur'); });
  document.querySelectorAll('.mode-option').forEach(button => button.addEventListener('click', () => {
    if (busy || activePointer !== null) return;
    minimum = Number(button.dataset.minimum);
    updateMode();
  }));
  $('resetStats').addEventListener('click', () => {
    if (busy || activePointer !== null || !window.confirm('確定重置全部累計開箱紀錄？')) return;
    stats = E.blankStats();
    updateStats();
    $('autoDrawStatus').hidden = true;
    $('resultContent').hidden = true;
    $('emptyResult').hidden = false;
    $('lastMode').textContent = '尚未開箱';
    last = null;
    persist();
  });
  updateMode();
  updateStats();
  // Theoretical values are derived from the fixed 95% Bernoulli continuation process.
})();
