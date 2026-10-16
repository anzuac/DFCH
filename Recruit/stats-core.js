/* DFCH Recruit V2.5.0 — compact, independent aggregate counters.
 * Does not duplicate candidate abilities, histories or character records. */
(() => {
  'use strict';
  const key='dfch-recruit-stats-v1';
  const emptyBucket=()=>({rounds:0,candidates:{rarity:[0,0,0,0],types:[0,0,0,0],lowTypes:[0,0,0,0],g:0,slow:0,heroes:{}},obtained:{rarity:[0,0,0,0],types:[0,0,0,0],lowTypes:[0,0,0,0],g:0,slow:0,heroes:{}}});
  const fresh=()=>({version:1,pools:Array.from({length:9},emptyBucket)});
  function read(){
    try{
      const saved=JSON.parse(localStorage.getItem(key)||'null');
      if(saved?.version===1&&Array.isArray(saved.pools)&&saved.pools.length===9)return saved;
    }catch(_){}
    return fresh();
  }
  function category(bucket,item){
    if(!item||!Number.isInteger(item.star)||item.star<3||item.star>6)return;
    const star=item.star,index=star-3,status=item.status||{};
    bucket.rarity[index]++;
    const type=Number(status.humanType);
    if(Number.isInteger(type)&&type>=0&&type<=3){
      bucket.types[type]++;
      if(star<=4)bucket.lowTypes[type]++;
    }
    if(status.speed?.gradeIndex===0||item.speed?.gradeIndex===0)bucket.g++;
    if((status.speed?.display||item.speed?.display)==='0.050 km/s')bucket.slow++;
    if(star>=5&&Number.isInteger(Number(item.id))){
      const id=String(item.id);
      bucket.heroes[id]=(bucket.heroes[id]||0)+1;
    }
  }
  function record(pool,candidates,selected){
    if(!Number.isInteger(pool)||pool<0||pool>=9||!Array.isArray(candidates)||
       !Number.isInteger(selected)||selected<0||selected>=candidates.length)return false;
    try{
      const data=read(),bucket=data.pools[pool];
      bucket.rounds++;
      candidates.forEach(c=>category(bucket.candidates,c));
      category(bucket.obtained,candidates[selected]);
      localStorage.setItem(key,JSON.stringify(data));
      return true;
    }catch(_){return false;}
  }
  function clear(){
    try{localStorage.removeItem(key);return true;}catch(_){return false;}
  }
  function sum(data,indices){
    const result=emptyBucket();
    for(const i of indices){
      const b=data.pools[i];if(!b)continue;
      result.rounds+=Number(b.rounds)||0;
      for(const side of ['candidates','obtained']){
        for(const arr of ['rarity','types','lowTypes'])
          for(let k=0;k<4;k++)result[side][arr][k]+=(Number(b[side]?.[arr]?.[k])||0);
        result[side].g+=Number(b[side]?.g)||0;
        result[side].slow+=Number(b[side]?.slow)||0;
        for(const [id,n] of Object.entries(b[side]?.heroes||{}))
          result[side].heroes[id]=(result[side].heroes[id]||0)+(Number(n)||0);
      }
    }
    return result;
  }
  window.DFCHRecruitStats=Object.freeze({key,read,record,clear,sum,fresh});
})();