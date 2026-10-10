(() => {
  function ratio(rolePercent, artifactPercent) {
    const role=Number(rolePercent),artifact=Number(artifactPercent);
    if(!Number.isFinite(role)||!Number.isFinite(artifact))return null;
    // 0x34b17f8–0x34b1848: add/divide role, multiply by
    // (100+artifact), then divide; preserve each float32 operation.
    const f=Math.fround;
    let value=role>=1?f(f(100+f(role))/100):1;
    if(artifact>=1)value=f(f(value*f(100+f(artifact)))/100);
    return value;
  }
  function progressScale(addedAffectionWeight,progressWeight) {
    if(progressWeight<=0)return 1;
    return 1-Math.min(Math.max(addedAffectionWeight,0),progressWeight)/progressWeight;
  }
  function collectorValue(master, level) {
    const n=Number(level);
    if (!master || !Number.isInteger(n) || n<1 || n>master.maxLevel) return null;
    return master.initialValue+(n-1)*master.diffValue;
  }
  function quantityBounds(min,max) {
    if(!Number.isInteger(min)||!Number.isInteger(max)||min<0)return null;
    return max<1?{min,max:min,fixed:true}:min<=max?{min,max,fixed:min===max}:null;
  }
  window.DFCHAffection=Object.freeze({ratio,progressScale,quantityBounds,collectorValue});
})();
