/* Gift-efficiency ranking shared by the six-star guide and its embedded expedition tab.
 * Calculates one gift at a time from the already supplied 3.16.1 bond rules.
 * This does not infer combat strength, drop rates, or undisclosed training bonuses.
 */
(() => {
  'use strict';
  function evaluate(giftId, heroes, rules, ownsStatue, selectedHeroIds) {
    const id=Number(giftId),base=rules?.baseValues?.[id];
    if(!Number.isFinite(base)||base<0)return null;
    const allowed=selectedHeroIds instanceof Set?selectedHeroIds:null;
    const multipliers=rules.preferenceMultipliers;
    const artifact=ownsStatue?rules.artifact.multiplier:1;
    const rows=[];
    for(const hero of heroes) {
      if(allowed&&!allowed.has(hero.index))continue;
      const kind=hero.loved.includes(id)?'loved':hero.favorite.includes(id)?'favorite':'normal';
      const gain=Math.floor(base*multipliers[kind]*artifact);
      rows.push({hero,kind,gain,rank:0});
    }
    // Stable, deterministic tie ordering; equal gain always receives the same rank.
    rows.sort((a,b)=>b.gain-a.gain||a.hero.index-b.hero.index);
    let place=0,prior=null;
    for(const row of rows){
      if(row.gain!==prior){place++;prior=row.gain;}
      row.rank=place;
    }
    return {base,rows,best:rows[0]?.gain??null,winners:rows.filter(row=>row.rank===1)};
  }
  window.DFCHGiftRanking=Object.freeze({evaluate});
})();