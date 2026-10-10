(() => {
  function configure(mode, input) {
    if (mode === 'unlimited') return Object.freeze({ready:true,mode,maximum:null});
    const maximum=Number(input);
    if (mode !== 'manual' || String(input).trim()==='' || !Number.isSafeInteger(maximum) || maximum<1 || !Number.isFinite(Math.fround(maximum)))
      return Object.freeze({ready:false,error:'請輸入大於 0 的整數隊伍耐力。'});
    return Object.freeze({ready:true,mode,maximum:Math.fround(maximum)});
  }
  function start(config) {
    if (!config.ready) throw new Error(config.error);
    return {mode:config.mode,maximum:config.maximum,current:config.maximum};
  }
  function change(state, amount) {
    if (!Number.isFinite(amount)) throw new RangeError('耐力變化值無效');
    if (state.mode==='unlimited') return {...state};
    return {...state,current:Math.fround(Math.max(0,Math.min(state.maximum,Math.fround(state.current+Math.fround(amount)))))};
  }
  const exhausted=state=>state.mode==='manual' && state.current<=0;
  window.DFCHStamina=Object.freeze({configure,start,change,exhausted});
})();
