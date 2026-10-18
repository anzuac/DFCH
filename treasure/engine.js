/* DFCH treasure continuation — standalone research simulator, not official loot weights. */
(function (root, makeFactory) {
  'use strict';
  const api = makeFactory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DFCHTreasureEngine = Object.freeze(api);
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const CONFIG = Object.freeze({ continueChance: 0.95, prizeA: 0.0001, prizeB: 0.00005, normalMinimum: 4, specialMinimum: 11, safetyMaxItems: 100000 });
  const randomNumber = (random) => {
    const v = Number(random());
    if (!Number.isFinite(v) || v < 0 || v >= 1) throw new RangeError('隨機值必須介於 [0,1)');
    return v;
  };
  function outcome(random = Math.random) {
    const r = randomNumber(random);
    return r < CONFIG.prizeA ? 'A' : r < 0.00015 ? 'B' : 'ordinary';
  }
  // Shared per-item sampler: exposes each reward when it is actually rolled.
  // The exact same state transitions are used by instant and animated openings.
  function createOpening(minimum = CONFIG.normalMinimum, random = Math.random) {
    if (![CONFIG.normalMinimum, CONFIG.specialMinimum].includes(minimum)) throw new RangeError('不支援的保底設定');
    let items = 0, a = 0, b = 0, ordinary = 0, continueSuccess = 0, continuationChecks = 0;
    let finished = false;
    function next() {
      if (finished) return null;
      const type = outcome(random);
      ++items;
      if (type === 'A') ++a;
      else if (type === 'B') ++b;
      else ++ordinary;
      if (items >= minimum) {
        ++continuationChecks;
        if (randomNumber(random) >= CONFIG.continueChance) finished = true;
        else ++continueSuccess;
      }
      if (items >= CONFIG.safetyMaxItems) finished = true;
      return {
        reward: { type, number: items }, items, a, b, ordinary,
        continueSuccess, continuationChecks, minimum,
        finished, safetyStopped: items >= CONFIG.safetyMaxItems
      };
    }
    return Object.freeze({ next });
  }
  function drawOnce(minimum = CONFIG.normalMinimum, random = Math.random, options = {}) {
    if (![CONFIG.normalMinimum, CONFIG.specialMinimum].includes(minimum)) throw new RangeError('不支援的保底設定');
    const capture = options.capture !== false;
    const visibleLimit = Math.max(0, Math.min(100, Number.isInteger(options.visibleLimit) ? options.visibleLimit : 56));
    const rewards = [];
    const opening = createOpening(minimum, random);
    let step;
    do {
      step = opening.next();
      if (capture && (rewards.length < visibleLimit || step.reward.type !== 'ordinary')) rewards.push(step.reward);
    } while (!step.finished);
    const { reward, finished, ...totals } = step;
    return { ...totals, rewards };
  }
  function blankStats() { return { runs: 0, items: 0, a: 0, b: 0, ordinary: 0, hitRuns: 0, continueSuccess: 0, continuationChecks: 0, normalRuns: 0, specialRuns: 0 }; }
  function addStats(stats, draw) {
    stats.runs += 1;
    stats.items += draw.items;
    stats.a += draw.a;
    stats.b += draw.b;
    stats.ordinary += draw.ordinary;
    stats.continueSuccess += draw.continueSuccess;
    stats.continuationChecks += draw.continuationChecks;
    if (draw.a + draw.b) stats.hitRuns += 1;
    if (draw.minimum === CONFIG.normalMinimum) stats.normalRuns += 1;
    else stats.specialRuns += 1;
    return stats;
  }
  function simulateBatch(count, minimum, random = Math.random, options = {}) {
    if (!Number.isInteger(count) || count < 1 || count > 10000) throw new RangeError('單批次最多 10,000 次');
    let last;
    const stats = blankStats();
    const keepFinal = options.captureLast === true;
    for (let i = 0; i < count; i++) {
      last = drawOnce(minimum, random, { capture: keepFinal && i === count - 1 });
      addStats(stats, last);
    }
    return { stats, last };
  }
  function theoreticalAverage(minimum) {
    if (![4, 11].includes(minimum)) throw new RangeError('invalid minimum');
    return minimum + CONFIG.continueChance / (1 - CONFIG.continueChance);
  }
  function theoreticalHitChance(minimum, rewardChance = CONFIG.prizeA + CONFIG.prizeB) {
    if (rewardChance < 0 || rewardChance > 1) throw new RangeError('invalid prize probability');
    // N = minimum + Geometric(number of successes before first failure), with p=.95.
    // P(no jackpot) = (1-p) * (1-q)^minimum / (1 - p(1-q)).
    const p = CONFIG.continueChance, q = rewardChance;
    return 1 - (1-p) * Math.pow(1-q, minimum) / (1 - p * (1-q));
  }
  return { CONFIG, outcome, createOpening, drawOnce, blankStats, addStats, simulateBatch, theoreticalAverage, theoreticalHitChance };
});
