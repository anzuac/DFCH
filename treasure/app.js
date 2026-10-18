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
  function commitBatch(batch, count) {
    for (const key of Object.keys(stats)) stats[key] += batch.stats[key];
    updateStats();
    renderLast(batch.last);
    persist();
    return count;
  }
  function run(count) {
    if (busy) return;
    busy = true;
    $('openOnce').disabled = true;
    $('openBatch').disabled = true;
    const message = $('batchResult');
    message.hidden = false;
    message.textContent = count > 1 ? `正在模擬 ${nf.format(count)} 次開箱…` : '';
    // Keep a chance for UI to paint the busy state before running an in-memory batch.
    requestAnimationFrame(() => setTimeout(() => {
      try {
        const result = E.simulateBatch(count, minimum, Math.random, { captureLast: true });
        commitBatch(result, count);
        message.hidden = count === 1;
        if (count > 1) {
          message.textContent = `這批共開啟 ${nf.format(count)} 次、掉落 ${nf.format(result.stats.items)} 件，命中大獎 A ${nf.format(result.stats.a)} 件、大獎 B ${nf.format(result.stats.b)} 件。下方顯示本批最後一次的獎勵。`;
        }
        if (count === 1) message.textContent = '';
      } catch (error) {
        message.hidden = false;
        message.textContent = '模擬發生錯誤：' + String(error.message || error);
      } finally {
        busy = false;
        $('openOnce').disabled = false;
        $('openBatch').disabled = false;
      }
    }, 12));
  }
  document.querySelectorAll('.mode-option').forEach(b => b.addEventListener('click', () => { if (busy) return; minimum = Number(b.dataset.minimum); updateMode(); }));
  $('openOnce').addEventListener('click', () => run(1));
  $('openBatch').addEventListener('click', () => run(Number($('batchCount').value)));
  $('resetStats').addEventListener('click', () => {
    if (busy || !window.confirm('確定重置全部累計開箱紀錄？')) return;
    stats = E.blankStats();
    updateStats();
    $('batchResult').hidden = true;
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
