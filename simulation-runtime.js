(() => {
  // A shared random stream is required for the whole expedition. This is an
  // initialization/replay boundary, not a completed first-map event engine.
  const dependencies=['DFCHRandom','DFCHLottery','DFCHEventState','DFCHDropState','DFCHStamina'];
  function initialize(data, options) {
    for(const name of dependencies)if(!window[name])throw new Error(`缺少模組：${name}`);
    const seed=options.storedCryptoInt===undefined?options.seed:window.DFCHRandom.seedFromStoredCryptoInt(options.storedCryptoInt);
    const random=new window.DFCHRandom.OfficialRandom(seed);
    const exploration=window.DFCHEventState.begin(data,options.completionRate??0);
    const drops=window.DFCHDropState.begin(data,options.saved??{});
    const stamina=window.DFCHStamina.start(options.stamina);
    const nextDouble=()=>random.nextDouble();
    return {
      data,seed,random,nextDouble,exploration,drops,stamina,progress:0,
      draw(weights){return window.DFCHLottery.draw(window.DFCHLottery.build(weights),nextDouble);},
      quantity(min,max){return random.next(min,max);},
      progressDelta(arg,multiplier,bypass=false){return window.DFCHEventState.progressDelta(arg,multiplier,bypass,nextDouble);}
    };
  }
  function preflight(data, handlers={}, integration={}) {
    const missing=[];
    for(const name of dependencies)if(!window[name])missing.push(`缺少模組：${name}`);
    // Dynamic events can use functions absent from the 69 serialized rows.
    for(const [type,name] of Object.entries(data.enums.ExpeditionEventFunctionType))
      if(Number(type)!==0 && typeof handlers[type]!=='function')missing.push(`事件處理未串接：${name}`);
    for(const [key,label] of Object.entries({poolBuilder:'基本、探索、能力與區域候選池',conditions:'能力來源及事件條件',lifecycle:'終點事件、區域到期與結束判定',rewards:'完整掉落、數量修正與結算',randomOrder:'完整事件呼叫的亂數消耗順序'}))
      if(integration[key]!==true)missing.push(`尚未驗證：${label}`);
    return Object.freeze({ready:missing.length===0,missing:Object.freeze(missing)});
  }
  async function replay(context, rows, handlers) {
    // EventState preflights the entire sequence before calling any handler.
    await window.DFCHEventState.execute(rows,handlers,context);
    return context;
  }
  window.DFCHSimulationRuntime=Object.freeze({initialize,preflight,replay});
})();
