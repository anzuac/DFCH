(() => {
  // Verified rules only. This module does not execute a complete expedition.
  const f=Math.fround;
  function staminaMax(leader, members=[], artifactBonus=0) {
    const values=[leader,...members,artifactBonus].map(Number);
    if(values.some(v=>!Number.isFinite(v)||v<0)||members.length>11)return null;
    let total=f(values[0]);
    for(let i=1;i<values.length-1;i++)total=f(total+f(f(values[i])*0.5));
    return f(total+f(values.at(-1)));
  }
  function consumeStamina(current, cost) {return f(Math.max(0,f(f(current)-f(cost))));}
  function excludeFullyExplored(eventType, completionRate) {return eventType===9 && completionRate>=100;}
  function transferableProgress(eventType, weight, isForce) {return eventType===1 && weight>0 && !isForce;}
  function nextForceCheckpoint(current, delta, eligibleEvents) {
    const end=f(f(current)+f(delta));
    const checkpoints=eligibleEvents.filter(e=>e.isForce && e.checkPointProgress>current && e.checkPointProgress<=end).map(e=>e.checkPointProgress);
    return checkpoints.length?Math.min(...checkpoints):null;
  }
  function minimumMultiDropRolls(continueRate) {
    const p=f(continueRate);
    if(!Number.isFinite(p)||p<0||p>=1)return null;
    return Math.max(3,Math.ceil(1/(1-p)));
  }
  function convertDrop(row, quantity, data) {
    if(!row.dungeonConversion)return {rewardId:row.rewardId,quantity};
    const ref=data.referenceDungeon;
    if(!ref || ![0,2].includes(ref.gameModeType)) throw new Error('尚未支援此參照地圖的獎勵轉換');
    if(row.rewardId===101000000)return {rewardId:ref.returnCurrencyType*1000000,quantity:Math.ceil(quantity*data.master.gemScaler)};
    if(Math.floor(row.rewardId/1000000)===600){
      const index=row.rewardId%1000000;
      const map={2:ref.baseChestSampleType,3:ref.legendChestSampleType,4:ref.illusionChestSampleType,5:ref.epicChestSampleType};
      if(ref.gameModeType===0)return {rewardId:row.rewardId,quantity:Math.ceil(quantity*data.master.chestScaler)};
      if(index>=2 && index<=5 && map[index]!==-1)return {rewardId:600000000+map[index],quantity:Math.ceil(quantity*data.master.chestScaler)};
    }
    return {rewardId:row.rewardId,quantity};
  }
  window.DFCHExpeditionRules=Object.freeze({staminaMax,consumeStamina,excludeFullyExplored,transferableProgress,nextForceCheckpoint,convertDrop,minimumMultiDropRolls});
})();
