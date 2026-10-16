/* DFCH Recruit V2.3.0 — official APK 3.16.1 artifact recruitment modifiers.
 * GetRarityWeights VA0x02E5F290; GetHumanTypeWeights VA0x02D55978. */
(() => {
  'use strict';
  const f = Math.fround;
  const artifacts = Object.freeze({
    global: Object.freeze({id:301009014,key:'valkyrja_wine',name:'★女武神的蜜酒',abilityType:710,maxLevel:1,amount:20}),
    pool: Object.freeze({
      1:Object.freeze({id:301009022,key:'storm_sorcery_bow',name:'魔嵐之弓',abilityType:713,maxLevel:1,amount:50}),
      3:Object.freeze({id:301009030,key:'snowy_shield',name:'亡國之盾',abilityType:713,maxLevel:1,amount:50}),
      4:Object.freeze({id:301009036,key:'heaven_sage',name:'★通往天之書庫的入館證',abilityType:713,maxLevel:1,amount:50})
    }),
    genius: Object.freeze([
      Object.freeze({id:301008098,key:'brilliant_mane',name:'瑞光的鬃毛',abilityType:731,maxLevel:4,first:5,step:5}),
      Object.freeze({id:301005020,key:'expedition-stage_snow_limited_1',name:'★艾瑪的頭環',abilityType:731,maxLevel:2,first:10,step:10})
    ])
  });
  const validLevel=(level,max)=>{const n=Number(level);return Number.isInteger(n)?Math.max(0,Math.min(max,n)):0;};
  function geniusBonus(maneLevel,emmaLevel){
    const m=validLevel(maneLevel,4),e=validLevel(emmaLevel,2);
    return (m?5+(m-1)*5:0)+(e?10+(e-1)*10:0);
  }
  const poolArtifact=pool=>artifacts.pool[String(pool)]||null;
  const bonus713=(pool,owned)=>poolArtifact(pool)&&owned?.[String(pool)]?50:0;
  function getModifiedWeights(baseline,pool,hasSix,globalOwned,poolOwned){
    if(!Array.isArray(baseline)||baseline.length!==4)throw new Error('Expected four rarity weights');
    const a=baseline.map(x=>f(Number(x)));
    if(!hasSix)a[3]=0;
    const global=globalOwned?20:0,pickup=bonus713(pool,poolOwned);
    // Native float32 stages: each of the two high stars receives global * pickup.
    const g=f(f(100+global)/f(100)),p=f(f(100+pickup)/f(100));
    const five=f(f(a[2]*g)*p),six=f(f(a[3]*g)*p);
    const extra=f(f(five+six)-f(a[2]+a[3]));
    const lowSum=f(a[0]+a[1]);
    const three=lowSum>0?f(Math.max(0,f(a[0]-f(f(extra*a[0])/lowSum)))):a[0];
    const four=lowSum>0?f(Math.max(0,f(a[1]-f(f(extra*a[1])/lowSum)))):a[1];
    return [three,four,five,six];
  }
  window.DFCHRecruitBonus=Object.freeze({version:'2.3.0',artifacts,validLevel,geniusBonus,poolArtifact,bonus713,getModifiedWeights});
})();