(() => {
  const f=Math.fround;
  const source=window.DFCHArtifactData;
  const catalog=source.artifacts;
  const ids={glasses:301009049,telescope:301005015,badge:301005025,compass:301009040,seed:301008114,amber:301005007};
  function value(owned,id) {
    const m=catalog.find(r=>r.rewardId===id),n=Number(owned?.[id]??0);
    if(!Number.isSafeInteger(n)||n<0)throw new RangeError('神器持有量須為非負整數');
    const level=Math.min(n,m.maxLevel);
    return level?m.initialValue+(level-1)*m.diffValue:0;
  }
  function effects(owned={}) {
    return {affection:value(owned,ids.glasses),exploration:value(owned,ids.telescope),
      continuation:value(owned,ids.badge),limited:value(owned,ids.compass),
      bossItems:value(owned,ids.seed)>0,gem:value(owned,ids.amber)};
  }
  function continuation(base,effect=0) {return effect>0?Math.min(f(.99),f(f(base)+f(effect/100))):f(base);}
  function bossGroups(data,effect={}) {return [...data.master.bossDropSampleGroupIds.filter(id=>id>0),...(effect.bossItems?[source.bossBonus.dropItemSampleGroupId]:[])];}
  function drops(data){return [...data.dropSamples,...source.dropSamples];}
  function masters(data){return [...data.rewardMasters,...source.rewardMasters];}
  const isAffection=id=>Number(id)>=305001000&&Number(id)<305002000;
  window.DFCHArtifacts=Object.freeze({catalog,ids,effects,continuation,bossGroups,drops,masters,isAffection});
})();
