/* DFCH treasure simulator — provisional rarity weights, NOT official drop rates. */
(function (root, makeFactory) {
  'use strict';
  const api = makeFactory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DFCHTreasureEngine = Object.freeze(api);
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  // All prize rates are probabilities PER REWARD, not per chest.
  // C 0.00007% = 0.0000007 probability (not 0.00007 probability).
  const WEIGHTS = Object.freeze({N:50, R:30, SR:15, SSR:4, UR:1});
  // Practice scoring schedule: NOT official/leaderboard points until server-side draws are enabled.
  const POINTS = Object.freeze({N:1, R:3, SR:10, SSR:20, UR:50, A:1000, B:2500, C:100000});
  const COUNT_KEYS = Object.freeze({N:'n',R:'r',SR:'sr',SSR:'ssr',UR:'ur',A:'a',B:'b',C:'c'});
  function scoreForCounts(counts) {
    if(!counts || typeof counts!=='object')throw new TypeError('缺少獎勵計數');
    let score=0;
    for(const [type,countKey] of Object.entries(COUNT_KEYS)) {
      const count=counts[countKey];
      if(!Number.isSafeInteger(count)||count<0)throw new RangeError('無效獎勵計數：'+type);
      score+=POINTS[type]*count;
      if(!Number.isSafeInteger(score))throw new RangeError('積分總和超出安全整數範圍');
    }
    return score;
  }
  const TIERS = Object.freeze(Object.keys(WEIGHTS));
  const CONFIG = Object.freeze({
    continueChance:0.95, prizeA:0.0001, prizeB:0.00005, prizeC:0.0000007,
    normalMinimum:4, safetyMaxItems:100000, ordinaryWeights:WEIGHTS
  });
  const GRAND_TOTAL = CONFIG.prizeA + CONFIG.prizeB + CONFIG.prizeC;
  const ORDINARY_TOTAL = 1 - GRAND_TOTAL;
  const WEIGHT_TOTAL = TIERS.reduce((sum,tier)=>sum + WEIGHTS[tier],0);
  const randomNumber = random => {
    const v=Number(random());
    if (!Number.isFinite(v) || v<0 || v>=1) throw new RangeError('隨機值必須介於 [0,1)');
    return v;
  };
  // One uniform roll is split into three exact jackpot intervals followed by
  // the ordinary rarity pool, normalized by the relative weights 50:30:15:4:1.
  function outcome(random=Math.random) {
    const roll=randomNumber(random);
    if (roll<CONFIG.prizeA) return 'A';
    if (roll<CONFIG.prizeA+CONFIG.prizeB) return 'B';
    if (roll<GRAND_TOTAL) return 'C';
    let leftover=(roll-GRAND_TOTAL)/ORDINARY_TOTAL * WEIGHT_TOTAL;
    for (const tier of TIERS) {
      leftover-=WEIGHTS[tier];
      if (leftover<0) return tier;
    }
    return 'UR'; // floating-point boundary near 1
  }
  function createOpening(minimum=CONFIG.normalMinimum,random=Math.random) {
    if (minimum!==CONFIG.normalMinimum) throw new RangeError('僅支援普通開箱 4 件保底');
    let items=0,a=0,b=0,c=0,n=0,r=0,sr=0,ssr=0,ur=0,ordinary=0;
    let continueSuccess=0,continuationChecks=0,finished=false;
    function next() {
      if (finished) return null;
      const type=outcome(random);
      ++items;
      if (type==='A') ++a;
      else if (type==='B') ++b;
      else if (type==='C') ++c;
      else {
        ++ordinary;
        if (type==='N') ++n;
        else if (type==='R') ++r;
        else if (type==='SR') ++sr;
        else if (type==='SSR') ++ssr;
        else ++ur;
      }
      if (items>=minimum) {
        ++continuationChecks;
        if (randomNumber(random)>=CONFIG.continueChance) finished=true;
        else ++continueSuccess;
      }
      if (items>=CONFIG.safetyMaxItems) finished=true;
      return {reward:{type,number:items},items,a,b,c,n,r,sr,ssr,ur,ordinary,
        continueSuccess,continuationChecks,minimum,finished,safetyStopped:items>=CONFIG.safetyMaxItems};
    }
    return Object.freeze({next});
  }
  function drawOnce(minimum=CONFIG.normalMinimum,random=Math.random,options={}) {
    if (minimum!==CONFIG.normalMinimum) throw new RangeError('僅支援普通開箱 4 件保底');
    const capture=options.capture!==false;
    const visibleLimit=Math.max(0,Math.min(100,Number.isInteger(options.visibleLimit)?options.visibleLimit:56));
    const rewards=[],opening=createOpening(minimum,random);
    let stage;
    do {
      stage=opening.next();
      if (capture&&(rewards.length<visibleLimit||'ABC'.includes(stage.reward.type))) rewards.push(stage.reward);
    } while (!stage.finished);
    const {reward,finished,...totals}=stage;
    return {...totals,rewards};
  }
  function blankStats() {
    return {runs:0,items:0,a:0,b:0,c:0,n:0,r:0,sr:0,ssr:0,ur:0,ordinary:0,
      hitRuns:0,continueSuccess:0,continuationChecks:0};
  }
  function addStats(stats,draw) {
    ++stats.runs;
    for (const key of ['items','a','b','c','n','r','sr','ssr','ur','ordinary','continueSuccess','continuationChecks']) stats[key]+=draw[key];
    if (draw.a+draw.b+draw.c) ++stats.hitRuns;
    return stats;
  }
  // Engine-only batch helper for deterministic tests, NOT exposed by the website.
  function simulateBatch(count,minimum=4,random=Math.random,options={}) {
    if (!Number.isInteger(count)||count<1||count>10000) throw new RangeError('單批次最多 10,000 次');
    let last;
    const stats=blankStats();
    for(let i=0;i<count;i++) {
      last=drawOnce(minimum,random,{capture:options.captureLast===true && i===count-1});
      addStats(stats,last);
    }
    return {stats,last};
  }
  function theoreticalAverage(minimum=4) {
    if (minimum!==4) throw new RangeError('僅支援普通開箱');
    return minimum+CONFIG.continueChance/(1-CONFIG.continueChance);
  }
  function theoreticalHitChance(minimum=4,rewardChance=GRAND_TOTAL) {
    if (minimum!==4) throw new RangeError('僅支援普通開箱');
    if (rewardChance<0||rewardChance>1) throw new RangeError('invalid prize probability');
    const p=CONFIG.continueChance,q=rewardChance;
    return 1-(1-p)*Math.pow(1-q,minimum)/(1-p*(1-q));
  }
  return {CONFIG,TIERS,GRAND_TOTAL,ORDINARY_TOTAL,WEIGHT_TOTAL,POINTS,scoreForCounts,
    outcome,createOpening,drawOnce,blankStats,addStats,simulateBatch,theoreticalAverage,theoreticalHitChance};
});
