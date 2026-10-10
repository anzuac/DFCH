(() => {
  // ARM64 0x550fd88: double sum -> float32 total; float32 alias columns.
  const f=Math.fround;
  function build(input) {
    const weights=input.map(n=>f(n));
    if(weights.some(n=>!Number.isFinite(n)||n<0))throw new RangeError('權重無效');
    const n=weights.length,total=f(weights.reduce((s,w)=>s+w,0));
    const probability=weights.map(w=>f(f(w*f(n))/total));
    const alias=Array(n).fill(0),work=Array(n).fill(0);
    let small=0,large=n-1;
    for(let i=0;i<n;i++) {
      if(probability[i]<1)work[small++]=i;
      else work[large--]=i;
    }
    while(large<n-1 && small>0) {
      const low=work[--small],high=work[large+1];
      alias[low]=high;
      probability[high]=f(probability[high]+f(probability[low]-1));
      if(probability[high]<1) {work[small++]=high;large++;}
    }
    if(n>0 && weights[0]===0)for(let i=0;i<n;i++)if(alias[i]===0)probability[i]=1;
    return {weights,total,probability,alias};
  }
  function draw(table,nextDouble) {
    // Guard is simulator-side: callers must not roll an empty/zero pool.
    if(!(table.total>0)||!table.weights.length)throw new Error('沒有可抽選候選');
    const r=nextDouble();
    if(!Number.isFinite(r)||r<0||r>=1)throw new RangeError('亂數須介於 0（含）至 1（不含）');
    const value=r*table.weights.length,index=Math.floor(value);
    return value-index<table.probability[index]?index:table.alias[index];
  }
  function setWeight(table,index,value,rebuild=true) {
    if(!Number.isInteger(index)||index<0||index>=table.weights.length||!Number.isFinite(f(value))||value<0)throw new RangeError('權重更新無效');
    const weights=[...table.weights];weights[index]=f(value);
    return rebuild?build(weights):{...table,weights};
  }
  function updateWeights(table,values) {
    if(values.length!==table.weights.length)throw new RangeError('候選數量不一致');
    const weights=values.map(f);
    if(weights.some(n=>!Number.isFinite(n)||n<0))throw new RangeError('權重無效');
    return weights.some((w,i)=>w!==table.weights[i])?build(weights):table;
  }
  function choose(samples,table,nextDouble,eligibleForced=[]) {
    // Forced eligibility (conditions/once/checkpoint) is supplied by the caller.
    // Official chooses greatest original weight; ties preserve the first row.
    let forced=null;
    for(const row of eligibleForced)if(forced===null || row.weight>forced.weight)forced=row;
    if(forced!==null)return forced;
    if(samples.length!==table.weights.length)throw new RangeError('候選與抽選表不一致');
    return samples[draw(table,nextDouble)];
  }
  window.DFCHLottery=Object.freeze({build,draw,setWeight,updateWeights,choose});
})();
