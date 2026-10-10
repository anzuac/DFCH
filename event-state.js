(() => {
  // Verified state transitions; full expedition handlers remain separate.
  const f=Math.fround;
  function begin(data, rate=0) {
    if(!Number.isFinite(rate)||rate<0||rate>100)throw new RangeError('探索率須介於 0–100');
    rate=f(rate);
    return {initialCompletionRate:rate,completionRate:rate,
      initialRewards:data.completionRewards.filter(r=>r.requiredCompletionRate<=rate).map(r=>({...r}))};
  }
  function completionDelta(argument, depth) {
    if(!Number.isFinite(argument)||!Number.isFinite(depth)||depth<0)throw new RangeError('探索參數無效');
    const step=f(f(f(argument)*60)/f(Math.max(depth,10)));
    return f(step+step);
  }
  function explore(state, argument, data) {
    return {...state,completionRate:f(Math.max(0,Math.min(100,f(state.completionRate+completionDelta(argument,data.master.depth)))))};
  }
  function currentBonus(state, data, type) {
    let sum=0;
    for(const r of data.completionRewards)if(r.requiredCompletionRate<=state.completionRate && r.rewardType===type)sum=f(sum+f(r.value));
    return sum;
  }
  function combine(base, state, buildCustom, changeId=0, mergeId=0) {
    if(changeId>0)return buildCustom(changeId,state.initialCompletionRate);
    if(mergeId>0)return [...base,...buildCustom(mergeId,state.initialCompletionRate)];
    return [...base];
  }
  function zoneExpired(start, current, buff) {
    if(buff.continueProgressMin!==buff.continueProgressMax)throw new Error('尚未串接隨機區域持續率');
    return buff.continueProgressMax>0 && f(f(current)-f(start))>=buff.continueProgressMax;
  }
  function progressDelta(argument, multiplier, bypass, nextDouble) {
    const value=bypass?f(argument):f(f(argument)*f(multiplier));
    if(!Number.isFinite(value)||value<0)throw new RangeError('進度無效');
    // Official code consumes a random value even when the fraction is zero.
    const random=f(nextDouble());
    if(!Number.isFinite(random)||random<0||random>1)throw new RangeError('亂數無效');
    return Math.trunc(value)+(random<f(value%1)?1:0);
  }
  function sequence(data, id) {
    const rows=data.eventSequences.filter(r=>r.logEventId===id);
    if(!rows.length)throw new Error('找不到官方事件執行序列');
    for(const r of rows)if(!data.enums.ExpeditionEventFunctionType[r.functionType])throw new Error('未知官方事件函式');
    return rows.map(r=>({...r,args:[...r.args],strArgs:[...r.strArgs]}));
  }
  async function execute(rows, handlers, context) {
    // Preflight is a simulator guard, not an assertion about official behavior.
    for(const r of rows)if(typeof handlers[r.functionType]!=='function')throw new Error(`事件函式 ${r.functionType} 尚未串接`);
    for(const r of rows)await handlers[r.functionType](r,context);
  }
  window.DFCHEventState=Object.freeze({begin,completionDelta,explore,currentBonus,combine,zoneExpired,progressDelta,sequence,execute});
})();
