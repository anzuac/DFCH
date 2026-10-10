(() => {
  function ratio(rolePercent, artifactPercent) {
    const role=Number(rolePercent),artifact=Number(artifactPercent);
    if(!Number.isFinite(role)||!Number.isFinite(artifact))return null;
    return (1+Math.max(0,role)/100)*(1+Math.max(0,artifact)/100);
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
