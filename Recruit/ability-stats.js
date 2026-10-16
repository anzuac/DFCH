/* DFCH recruit ability combinations: non-six-star candidate statistics and weighted forecasts. */
(() => {
  'use strict';
  const D=window.DFCH_DATA,C=window.DFCHRecruitConfig,B=window.DFCHRecruitBonus;
  const KEY='dfch-recruit-ability-stats-v1';
  const ids=[303000900,303000903,303000709,303000722,303000805,303000804,303000803];
  const names=['禁斷 I','禁斷 II','貪欲 I','貪欲 II','地下交易','賞金獵人','委託的達人'];
  const bits=new Map(ids.map((id,i)=>[id,1<<i]));
  const m=(...positions)=>positions.reduce((v,i)=>v|(1<<i),0);
  const base=[
    m(0,1,2),m(0,1,3),m(1,2),m(1,3),m(0,1),m(0,3),
    m(0,2,3),m(1,2,3),m(2,3),m(0,1,2,3)
  ];
  const regular=[
    ...base.map(mask=>({mask,section:'禁斷／貪欲'})),
    ...[m(4,5,6),m(4,5),m(4,6),m(5,6)].map(mask=>({mask,section:'三金組合'}))
  ];
  const GOLD=m(4,5,6);
  function label(mask){return names.filter((_,i)=>mask&(1<<i)).join(' ＋ ');}
  function mixed(mask){
    return !!(mask&GOLD)&&base.some(rule=>(mask&rule)===rule);
  }
  function skillMask(candidate){
    return (candidate?.skills||[]).reduce((mask,s)=>mask|(bits.get(s.id)||0),0);
  }
  function bondHits(candidate){
    const hit=new Set();
    for(const e of candidate?.bondEvents||[]){
      if([6,13,23].includes(e.level)&&bits.has(e.id))hit.add(e.id);
    }
    return Math.min(3,hit.size);
  }
  const emptySide=()=>({total:0,regular:{},mixed:{},bond2:0,bond3:0});
  const emptyBucket=()=>({candidates:emptySide(),obtained:emptySide()});
  const fresh=()=>({version:1,pools:Array.from({length:9},emptyBucket)});
  function read(){
    try{
      const obj=JSON.parse(localStorage.getItem(KEY)||'null');
      if(obj?.version===1&&Array.isArray(obj.pools)&&obj.pools.length===9)return obj;
    }catch(_){}
    return fresh();
  }
  function add(side,candidate){
    if(!candidate||candidate.star<3||candidate.star>5)return;
    side.total++;
    const mask=skillMask(candidate);
    for(const row of regular){
      if((mask&row.mask)===row.mask)
        side.regular[row.mask]=(side.regular[row.mask]||0)+1;
    }
    if(mixed(mask))side.mixed[mask]=(side.mixed[mask]||0)+1;
    const hits=bondHits(candidate);
    if(hits===2)side.bond2++;
    if(hits===3)side.bond3++;
  }
  function record(pool,candidates,selected){
    if(!Number.isInteger(pool)||pool<0||pool>8||!Array.isArray(candidates)||
       !Number.isInteger(selected)||selected<0||selected>=candidates.length)return false;
    try{
      const obj=read(),b=obj.pools[pool];
      candidates.forEach(c=>add(b.candidates,c));
      add(b.obtained,candidates[selected]);
      localStorage.setItem(KEY,JSON.stringify(obj));
      return true;
    }catch(_){return false;}
  }
  function clear(){
    try{localStorage.removeItem(KEY);return true;}catch(_){return false;}
  }
  function allowed(row,star,heroId,selected,options,poolKey){
    const id=row[0],rank=star-1;
    if(selected.includes(id))return false;
    if(C.lowOnly.includes(id)&&rank>3)return false;
    if(C.highOnly.includes(id)&&rank<4)return false;
    const condition=D.abilityConditions[String(id)]||{};
    const job=D.heroRoster[String(heroId)]?.job||0;
    if(condition.jobMask&&!(condition.jobMask&job))return false;
    if(condition.cond===1){
      if(condition.condValue===301008017&&!options.ownedEye)return false;
      if(condition.condValue===301008020&&!options.ownedSword)return false;
    }else if(condition.cond!==undefined&&condition.cond!==0)return false;
    if(options.hiddenEye&&C.artifactEye.includes(id))return false;
    if(options.hiddenSword&&C.artifactSword.includes(id))return false;
    if(C.exclusiveSeries.includes(id)&&selected.some(x=>C.exclusiveSeries.includes(x)))return false;
    if((C.groupExclusive[poolKey]||[]).some(group=>group.includes(id)&&selected.some(x=>group.includes(x))))return false;
    const targets=C.targetPlayerIndexes?.[id];
    return !(targets?.length&&!targets.includes(heroId));
  }
  // Exact weighted sampling without replacement, including per-hero fixed skills,
  // job/rarity/artefact restrictions and mutually exclusive skill families.
  // Non-target skills that cannot constrain each other are pooled by equal weight.
  function heroDistribution(pool,star,heroId,options){
    const poolKey=C.keys[pool],all=D.poolRows[poolKey];
    const selected=(star===5?(D.heroes[String(heroId)]?.fixed||[]):
      all.filter(row=>row[1]===0).map(row=>row[0])).slice();
    const free=Math.max(0,(star===5?10:C.unlockedLowStarSlots)-selected.length-(star===5?0:2));
    const fixedMask=selected.reduce((v,id)=>v|(bits.get(id)||0),0);
    const poolGroups=C.groupExclusive[poolKey]||[];
    const specialIds=new Set([...ids,...C.exclusiveSeries,...poolGroups.flat()]);
    const freeRows=all.filter(row=>row[1]===1&&row[2]>0&&
      allowed(row,star,heroId,selected,options,poolKey));
    const special=freeRows.filter(row=>specialIds.has(row[0])).map(row=>({
      id:row[0],w:row[2],target:bits.get(row[0])||0
    }));
    const bins=new Map();
    for(const row of freeRows){
      if(specialIds.has(row[0]))continue;
      bins.set(row[2],(bins.get(row[2])||0)+1);
    }
    const groups=[...bins].map(([w,count])=>({w,count}));
    const conflicts=special.map((row,i)=>special.reduce((mask,other,j)=>{
      if(i===j)return mask;
      if(C.exclusiveSeries.includes(row.id)&&C.exclusiveSeries.includes(other.id))return mask|(1<<j);
      if(poolGroups.some(g=>g.includes(row.id)&&g.includes(other.id)))return mask|(1<<j);
      return mask;
    },0));
    const radix=free+1,powers=groups.map((_,i)=>radix**i),range=radix**groups.length;
    let states=new Map([[0,1]]);
    for(let step=0;step<free;step++){
      const next=new Map();
      const put=(key,p)=>(next.set(key,(next.get(key)||0)+p));
      for(const [key,p] of states){
        const mask=Math.floor(key/range),code=key%range;
        const optionsSpecial=[];
        let denominator=0;
        for(let i=0;i<special.length;i++){
          const bit=1<<i;
          if(mask&bit||mask&conflicts[i])continue;
          optionsSpecial.push(i);denominator+=special[i].w;
        }
        const counts=[];
        for(let i=0;i<groups.length;i++){
          const used=Math.floor(code/powers[i])%radix;
          const weight=(groups[i].count-used)*groups[i].w;
          counts.push(weight);denominator+=weight;
        }
        if(denominator<=0){put(key,p);continue;}
        for(const i of optionsSpecial){
          put((mask|(1<<i))*range+code,p*special[i].w/denominator);
        }
        for(let i=0;i<groups.length;i++){
          if(counts[i]>0)put(key+powers[i],p*counts[i]/denominator);
        }
      }
      states=next;
    }
    const out=new Float64Array(128);
    for(const [key,p] of states){
      const mask=Math.floor(key/range);
      let found=fixedMask;
      for(let i=0;i<special.length;i++)if(mask&(1<<i))found|=special[i].target;
      out[found]+=p;
    }
    return out;
  }
  let theoryCacheKey='',theoryCache=null;
  function theory(pool,options={}){
    const key=JSON.stringify([pool,!!options.hiddenEye,!!options.hiddenSword,
      !!options.ownedEye,!!options.ownedSword,!!options.bonusValkyrja,
      !!options.poolBonusOwned?.[String(pool)],
      C.six[pool].some(id=>!(options.seen||[]).includes(id))]);
    if(key===theoryCacheKey&&theoryCache)return theoryCache;
    const weights=B.getModifiedWeights(C.weights[pool],pool,
      C.six[pool].some(id=>!(options.seen||[]).includes(id)),
      !!options.bonusValkyrja,options.poolBonusOwned||{});
    const k=C.keys[pool],roster=D.poolRarityRoster[k]||{};
    const sum=[3,4,5].reduce((v,s)=>v+(roster[String(s)]?.length?weights[s-3]:0),0);
    const distribution=new Float64Array(128);
    if(sum>0){
      for(const star of [3,4,5]){
        const heroes=roster[String(star)]||[];
        if(!heroes.length||weights[star-3]<=0)continue;
        const probability=weights[star-3]/sum/heroes.length;
        for(const id of heroes){
          const result=heroDistribution(pool,star,id,options);
          for(let mask=0;mask<128;mask++)distribution[mask]+=result[mask]*probability;
        }
      }
    }
    const regularProbs={};
    for(const row of regular){
      regularProbs[row.mask]=distribution.reduce((n,p,mask)=>
        (mask&row.mask)===row.mask?n+p:n,0);
    }
    const specialProbs={};
    let mixedTotal=0;
    for(let mask=0;mask<128;mask++){
      if(mixed(mask)&&distribution[mask]>0){
        specialProbs[mask]=distribution[mask];
        mixedTotal+=distribution[mask];
      }
    }
    theoryCacheKey=key;
    theoryCache={regular:regularProbs,special:specialProbs,mixedTotal};
    return theoryCache;
  }
  window.DFCHRecruitAbilityStats=Object.freeze({
    KEY,ids,names,regular,label,mixed,skillMask,bondHits,read,record,clear,theory
  });
})();
