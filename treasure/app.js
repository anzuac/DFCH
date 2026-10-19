(() => {
  'use strict';
  const E = window.DFCHTreasureEngine;
  if (!E) return;
  const $ = id => document.getElementById(id);
  const storeKey = 'dfch-treasure-continuation-v1';
  const nf = new Intl.NumberFormat('zh-TW');
  const percent = (value, digits = 2) => (100 * value).toFixed(digits) + '%';
  const storage = (() => { try { return window.localStorage; } catch (_) { return null; } })();
  const HOLD_DELAY_MS = 420;
  const REVEAL_INTERVAL_MS = 105;
  const NEXT_CHEST_PAUSE_MS = 310;
  const SKIP_NEXT_PAUSE_MS = 180;
  // The reward list now retains all revealed tiles; CSS limits only its viewport.
  let minimum = 4;
  let stats = E.blankStats();
  let profile = { nickname: '', bestNormal: null, bestSpecial: null, bestJackpots: null };
  let skipAnimation = false;
  let activeOpening = null;
  let fastForwarding = false;
  let revealTimer = null;
  let nextChestTimer = null;
  let activePointer = null;
  let holdTimer = null;
  let holdActive = false;
  let holdDraws = 0;
  let suppressClick = false;
  const openButton = $('openOnce');
  const skipButton = $('skipAnimation');

  function sanitizeStats(candidate) {
    const s = E.blankStats();
    if (!candidate || typeof candidate !== 'object') return s;
    for (const key of Object.keys(s)) {
      const value = candidate[key];
      if (Number.isSafeInteger(value) && value >= 0) s[key] = value;
    }
    if (s.runs !== s.normalRuns + s.specialRuns ||
        s.items !== s.a + s.b + s.ordinary ||
        s.continuationChecks !== s.continueSuccess + s.runs ||
        s.hitRuns > s.runs) return E.blankStats();
    return s;
  }
  function sanitizeBest(best, minimum = null) {
    if (!best || typeof best !== 'object') return null;
    const {items,a,b} = best;
    if (![items,a,b].every(x => Number.isSafeInteger(x) && x >= 0) || items < (minimum || 4) || a + b > items) return null;
    return { items, a, b };
  }
  function sanitizeProfile(value) {
    if (!value || typeof value !== 'object') return { nickname: '', bestNormal: null, bestSpecial: null, bestJackpots: null };
    return {
      nickname: typeof value.nickname === 'string' ? value.nickname.trim().slice(0,16) : '',
      bestNormal: sanitizeBest(value.bestNormal,4),
      bestSpecial: sanitizeBest(value.bestSpecial,11),
      bestJackpots: sanitizeBest(value.bestJackpots)
    };
  }
  try {
    const saved = storage && JSON.parse(storage.getItem(storeKey));
    if (saved && [4, 11].includes(saved.minimum)) minimum = saved.minimum;
    stats = sanitizeStats(saved?.stats);
    profile = sanitizeProfile(saved?.profile);
    if (typeof saved?.skipAnimation === 'boolean') skipAnimation = saved.skipAnimation;
    else if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) skipAnimation = true;
  } catch (_) { /* storage is optional */ }
  function persist() {
    try { storage?.setItem(storeKey, JSON.stringify({ minimum, stats, skipAnimation, profile })); }
    catch (_) { /* private browsing */ }
  }
  function updateStats() {
    $('statRuns').textContent = nf.format(stats.runs);
    $('statItems').textContent = nf.format(stats.items);
    $('statA').textContent = nf.format(stats.a);
    $('statB').textContent = nf.format(stats.b);
    $('statAverage').textContent = stats.runs ? (stats.items / stats.runs).toFixed(2) + ' 件' : '—';
    $('statRetention').textContent = stats.continuationChecks ? percent(stats.continueSuccess / stats.continuationChecks) : '—';
    $('statHitRuns').textContent = nf.format(stats.hitRuns);
  }
  function updatePlayerPanel() {
    $('playerNickname').value = profile.nickname;
    $('bestNormal').textContent = profile.bestNormal ? nf.format(profile.bestNormal.items) : '—';
    $('bestSpecial').textContent = profile.bestSpecial ? nf.format(profile.bestSpecial.items) : '—';
    $('bestJackpots').textContent = profile.bestJackpots ? nf.format(profile.bestJackpots.a + profile.bestJackpots.b) : '—';
  }
  function recordPersonalBest(stage) {
    const entry = { items: stage.items, a: stage.a, b: stage.b };
    const key = stage.minimum === 4 ? 'bestNormal' : 'bestSpecial';
    if (!profile[key] || stage.items > profile[key].items) profile[key] = entry;
    const old = profile.bestJackpots;
    if (!old || stage.a + stage.b > old.a + old.b ||
       (stage.a + stage.b === old.a + old.b && (stage.b > old.b ||
        (stage.b === old.b && stage.items > old.items)))) profile.bestJackpots = entry;
    updatePlayerPanel();
  }
  function columnsForViewport() {
    return window.matchMedia?.('(max-width:510px)').matches ? 6 :
      window.matchMedia?.('(max-width:780px)').matches ? 8 : 10;
  }
  function updateScrollHint() {
    $('lootRemainder').hidden = $('lootGrid').children.length <= columnsForViewport() * 5;
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
  function updateSkipButton() {
    skipButton.setAttribute('aria-pressed', String(skipAnimation));
    $('skipAnimationLabel').textContent = '跳過動畫：' + (skipAnimation ? '開啟' : '關閉');
    persist();
  }
  function createTile(reward) {
    const tile = document.createElement('div');
    tile.className = 'loot-tile type-' + reward.type;
    tile.dataset.number = String(reward.number);
    const symbol = document.createElement('span');
    symbol.className = 'tile-icon';
    symbol.textContent = reward.type === 'A' ? '✦' : reward.type === 'B' ? '◆' : '◈';
    const label = document.createElement('small');
    label.textContent = reward.type === 'ordinary' ? '普通' : '大獎 ' + reward.type;
    tile.title = `第 ${reward.number} 件：${label.textContent}`;
    tile.append(symbol, label);
    return tile;
  }
  function appendReward(reward, stage) {
    const grid = $('lootGrid');
    const followLatest = grid.scrollHeight - grid.clientHeight - grid.scrollTop <= 32;
    grid.append(createTile(reward));
    updateScrollHint();
    if (followLatest) grid.scrollTop = grid.scrollHeight;
    // Never remove previous rewards. A five-row scroll viewport constrains height,
    // not the actual prize history of the current chest.
  }
  function updatePartial(stage) {
    $('lastItems').textContent = nf.format(stage.items);
    $('lastRare').textContent = nf.format(stage.a + stage.b);
    $('lastStreak').textContent = nf.format(stage.continueSuccess);
    $('lootCaption').textContent = `大獎 A ×${stage.a}　大獎 B ×${stage.b}　普通 ×${stage.ordinary}`;
    const live = $('liveDropProgress');
    live.classList.toggle('is-rare', stage.reward.type !== 'ordinary');
    $('liveDropMessage').textContent = stage.reward.type === 'ordinary' ?
      `第 ${nf.format(stage.items)} 件 · 普通獎勵` :
      `第 ${nf.format(stage.items)} 件 · ✨ 大獎 ${stage.reward.type}！`;
    $('liveDropCount').textContent = `${nf.format(stage.items)} 件`;
  }
  function refreshDrawButton() {
    $('drawButtonText').textContent = holdActive ? '連續開箱中 · 放開停止' :
      activeOpening ? '逐件揭曉中…' : '點擊開始抽獎';
  }
  function finishOpening(stage) {
    if (!activeOpening) return;
    clearTimeout(revealTimer);
    revealTimer = null;
    const wasHeldOpening = activeOpening.startedByHold;
    activeOpening = null;
    $('resultContent').hidden = false;
    $('resultPanel').classList.remove('is-revealing');
    $('lastMode').textContent = stage.minimum === 4 ? '普通開箱 · 已完成' : '特殊續開 · 已完成';
    E.addStats(stats, stage);
    recordPersonalBest(stage);
    updateStats();
    persist();
    holdDraws += wasHeldOpening ? 1 : 0;
    $('lootHeadline').textContent = '掉落清單 · 已完成';
    $('liveDropMessage').textContent = `本箱開啟完成 · ${nf.format(stage.items)} 件`;
    $('liveDropProgress').classList.remove('is-rare');
    refreshDrawButton();
    if (holdActive) {
      const status = $('autoDrawStatus');
      status.hidden = false;
      status.textContent = `長按連抽 · 已完成 ${nf.format(holdDraws)} 箱，放開後停止`;
      nextChestTimer = setTimeout(() => {
        nextChestTimer = null;
        if (holdActive) startOpening();
      }, skipAnimation ? SKIP_NEXT_PAUSE_MS : NEXT_CHEST_PAUSE_MS);
    } else if (holdDraws > 0) {
      $('autoDrawStatus').hidden = false;
      $('autoDrawStatus').textContent = `連抽已停止 · 共完成 ${nf.format(holdDraws)} 箱`;
    }
  }
  function advanceOpening() {
    if (!activeOpening) return;
    const stage = activeOpening.stream.next();
    if (!stage) return;
    activeOpening.lastStage = stage;
    appendReward(stage.reward, stage);
    updatePartial(stage);
    if (stage.finished) {
      finishOpening(stage);
      return;
    }
    if (!skipAnimation && !fastForwarding) revealTimer = setTimeout(advanceOpening, REVEAL_INTERVAL_MS);
  }
  function finishAnimationImmediately() {
    if (!activeOpening) return;
    clearTimeout(revealTimer);
    revealTimer = null;
    fastForwarding = true;
    try { while (activeOpening) advanceOpening(); }
    finally { fastForwarding = false; }
  }
  function startOpening() {
    if (activeOpening) return;
    if (nextChestTimer !== null) { clearTimeout(nextChestTimer); nextChestTimer = null; }
    try {
      activeOpening = { stream: E.createOpening(minimum, Math.random), lastStage: null, startedByHold: holdActive };
      $('emptyResult').hidden = true;
      $('resultContent').hidden = false;
      $('lootGrid').replaceChildren();
      $('lootGrid').scrollTop = 0;
      $('lootRemainder').hidden = true;
      $('lootHeadline').textContent = '掉落清單 · 逐件揭曉中';
      $('lastMode').textContent = minimum === 4 ? '普通開箱 · 進行中' : '特殊續開 · 進行中';
      $('lastItems').textContent = '0';
      $('lastRare').textContent = '0';
      $('lastStreak').textContent = '0';
      $('lootCaption').textContent = '即將揭曉第一件獎勵';
      $('resultPanel').classList.add('is-revealing');
      $('liveDropProgress').hidden = false;
      $('liveDropMessage').textContent = '即將揭曉…';
      $('liveDropCount').textContent = '0 件';
      if (!holdActive) $('autoDrawStatus').hidden = true;
      refreshDrawButton();
      if (skipAnimation) finishAnimationImmediately();
      else advanceOpening();
    } catch (error) {
      clearTimeout(revealTimer);
      revealTimer = null;
      activeOpening = null;
      stopPress();
      $('liveDropProgress').hidden = false;
      $('liveDropMessage').textContent = `開箱失敗：${String(error.message || error)}`;
      refreshDrawButton();
    }
  }
  function stopPress() {
    if (holdTimer !== null) clearTimeout(holdTimer);
    if (nextChestTimer !== null) clearTimeout(nextChestTimer);
    holdTimer = null;
    nextChestTimer = null;
    const wasHolding = holdActive;
    activePointer = null;
    holdActive = false;
    openButton.classList.remove('is-holding');
    refreshDrawButton();
    if (wasHolding) {
      suppressClick = true;
      const status = $('autoDrawStatus');
      status.hidden = false;
      status.textContent = activeOpening ?
        `已停止連開，完成目前這箱後結束 · 已完成 ${nf.format(holdDraws)} 箱` :
        `連抽已停止 · 共完成 ${nf.format(holdDraws)} 箱`;
    }
  }
  openButton.addEventListener('pointerdown', event => {
    if (activePointer !== null || activeOpening || !event.isPrimary ||
        (event.pointerType === 'mouse' && event.button !== 0)) return;
    suppressClick = false;
    activePointer = event.pointerId;
    holdDraws = 0;
    holdTimer = setTimeout(() => {
      if (activePointer !== event.pointerId) return;
      holdTimer = null;
      holdActive = true;
      suppressClick = true;
      openButton.classList.add('is-holding');
      startOpening();
    }, HOLD_DELAY_MS);
  });
  window.addEventListener('pointerup', event => {
    if (event.pointerId === activePointer) stopPress();
  });
  window.addEventListener('pointercancel', event => {
    if (event.pointerId === activePointer) stopPress();
  });
  openButton.addEventListener('pointerleave', event => {
    if (event.pointerId === activePointer) stopPress();
  });
  openButton.addEventListener('contextmenu', event => event.preventDefault());
  openButton.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); return; }
    if (!activeOpening) { holdDraws = 0; startOpening(); }
  });
  skipButton.addEventListener('click', () => {
    skipAnimation = !skipAnimation;
    updateSkipButton();
    if (skipAnimation && activeOpening) finishAnimationImmediately();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopPress(); finishAnimationImmediately(); }
  });
  window.addEventListener('blur', () => { if (activePointer !== null) stopPress(); });
  document.querySelectorAll('.mode-option').forEach(button => button.addEventListener('click', () => {
    if (activeOpening || holdActive || activePointer !== null) return;
    minimum = Number(button.dataset.minimum);
    updateMode();
  }));
  $('playerNickname').addEventListener('input', () => {
    profile.nickname = $('playerNickname').value.slice(0,16);
    persist();
  });
  window.addEventListener('resize', updateScrollHint);
  $('resetStats').addEventListener('click', () => {
    if (activeOpening || holdActive || activePointer !== null ||
        !window.confirm('確定重置全部累計與個人最佳開箱紀錄？暱稱會保留。')) return;
    stats = E.blankStats();
    profile.bestNormal = null;
    profile.bestSpecial = null;
    profile.bestJackpots = null;
    updatePlayerPanel();
    holdDraws = 0;
    updateStats();
    $('autoDrawStatus').hidden = true;
    $('liveDropProgress').hidden = true;
    $('resultContent').hidden = true;
    $('emptyResult').hidden = false;
    $('lastMode').textContent = '尚未開箱';
    persist();
  });
  updateMode();
  updateSkipButton();
  updateStats();
  updatePlayerPanel();
})();
