/* DFCH Recruit V2.5.1 — 11 initial ability levels from APK 3.16.1.
 * 64 unique hero-specific 11-element arrays; fixed 6-star templates.
 * HumanType: weighted 3/4-star Normal/Rare/OldSoldier/Genius; 5/6-star official templates.
 * Ability 731 and secondary OldSoldier status vector remain out of scope.
 * The original Android powf/exp2f and exact tie-rounding may differ by last ULP.
 */
(() => {
  'use strict';
  const levels = [[46.299999,35.799999,22.799999,3.2,0.0,71.0,19.9,18.799999,42.5,65.199997,10.0],[40.0,40.0,14.8,54.400002,0.0,68.199997,9.9,14.1,29.9,61.599998,10.0],[40.0,29.9,35.400002,1.9,0.0,79.199997,13.3,4.7,42.5,76.900002,10.0],[57.099998,41.099998,13.7,0.0,12.7,62.700001,43.299999,61.099998,42.5,43.900002,10.0],[50.0,50.0,21.700001,44.799999,0.0,57.200001,0.0,9.4,17.4,40.0,10.0],[50.299999,50.0,23.9,68.400002,9.5,68.199997,23.299999,14.1,29.9,36.5,10.0],[45.700001,50.0,12.5,76.800003,56.0,61.299999,0.0,7.0,17.4,33.900002,10.0],[60.900002,67.0,15.9,17.9,0.0,37.5,73.300003,30.5,42.5,18.1,10.0],[50.900002,68.699997,13.1,71.0,72.0,15.9,40.0,7.0,17.4,11.3,10.0],[64.5,70.0,19.4,57.599998,0.0,69.599998,13.3,18.799999,29.9,16.0,10.0],[70.0,60.700001,18.200001,22.299999,23.9,60.0,48.0,42.299999,42.5,11.7,10.0],[60.0,71.199997,54.799999,58.200001,44.799999,31.1,13.3,20.700001,17.4,9.9,10.0],[70.0,60.5,37.900002,4.4,25.5,73.199997,76.599998,21.1,47.5,40.0,10.0],[70.0,80.0,58.200001,64.0,95.900002,59.599998,11.9,28.200001,47.5,13.4,10.0],[66.900002,79.0,17.700001,84.900002,76.800003,34.900002,23.299999,7.0,34.900002,19.6,10.0],[69.300003,77.5,64.0,44.799999,0.0,73.699997,3.3,9.4,40.0,19.6,10.0],[74.800003,57.099998,31.9,12.7,15.9,58.700001,76.599998,42.299999,67.5,10.1,50.0],[70.0,79.599998,41.099998,53.700001,0.0,66.0,15.9,9.4,42.5,15.2,10.0],[69.900002,76.900002,39.5,60.099998,0.0,67.099998,9.9,7.0,40.0,19.9,10.0],[70.0,80.0,43.400002,62.0,0.0,64.0,21.299999,32.900002,52.5,9.9,10.0],[66.800003,69.199997,64.0,46.0,0.0,64.0,1.9,14.1,40.0,17.299999,10.0],[40.0,29.9,24.4,62.200001,35.5,22.200001,63.299999,4.7,22.5,76.900002,10.0],[69.099998,79.5,53.700001,57.599998,14.3,57.5,5.9,23.5,50.0,9.9,10.0],[71.400002,70.0,65.099998,28.700001,0.0,66.800003,66.0,28.200001,52.5,9.9,10.0],[60.0,70.0,14.5,89.900002,67.199997,61.299999,0.0,7.0,37.5,22.6,10.0],[60.099998,71.199997,15.4,72.300003,78.400002,61.0,46.599998,7.0,37.5,13.4,10.0],[70.0,70.0,52.5,38.400002,0.0,63.700001,74.599998,11.7,60.0,15.2,10.0],[75.0,77.5,40.0,10.0,13.5,60.0,80.0,45.0,70.0,10.1,10.0],[68.400002,65.199997,52.799999,48.700001,65.199997,36.099998,31.6,58.099998,55.0,18.6,10.0],[65.0,68.300003,37.099998,7.5,0.0,71.400002,29.5,27.200001,60.0,21.799999,10.0],[73.699997,52.200001,21.299999,3.8,8.5,43.700001,62.400002,63.5,70.0,27.5,10.0],[72.5,53.099998,26.4,3.8,8.5,44.299999,62.400002,59.400002,65.0,27.5,10.0],[70.0,78.0,55.599998,61.099998,72.400002,42.700001,15.4,22.5,40.0,15.0,10.0],[72.5,78.0,44.700001,30.200001,0.0,46.799999,27.799999,16.299999,60.0,12.5,10.0],[70.0,85.5,39.0,74.0,98.0,52.400002,10.4,37.200001,55.0,9.4,10.0],[65.099998,69.900002,47.400002,39.599998,46.099998,69.199997,30.0,25.799999,42.5,37.0,10.0],[60.0,75.400002,19.5,72.599998,75.400002,43.0,11.3,6.4,37.5,33.0,10.0],[68.0,71.0,38.599998,80.0,84.5,36.400002,0.0,30.0,28.5,19.9,10.0],[55.0,67.5,53.200001,56.799999,40.299999,64.699997,21.4,8.7,37.5,68.300003,10.0],[72.0,72.0,45.5,45.0,35.0,40.0,60.0,35.0,62.5,30.0,10.0],[72.0,65.0,32.599998,12.2,0.0,58.200001,27.5,35.5,50.0,25.5,10.0],[55.0,67.5,55.700001,48.799999,50.0,42.799999,40.0,32.5,35.0,52.0,10.0],[62.0,73.5,27.299999,75.199997,68.800003,63.200001,20.799999,9.3,40.0,22.200001,10.0],[68.0,80.0,69.5,9.2,0.0,73.199997,19.299999,27.200001,60.0,9.4,10.0],[73.0,68.0,60.200001,53.400002,24.700001,62.799999,5.9,21.299999,50.0,20.0,10.0],[70.0,68.0,48.0,46.0,0.0,58.0,14.0,42.0,51.5,15.0,50.0],[56.0,80.0,37.0,79.0,66.099998,44.700001,21.0,18.200001,40.0,10.1,10.0],[72.0,80.0,57.799999,20.0,68.5,56.0,66.0,42.0,70.0,9.4,10.0],[72.0,82.0,19.5,64.0,66.0,34.900002,60.0,7.0,37.5,18.0,10.0],[68.0,70.0,39.5,55.0,56.0,38.5,14.0,30.0,35.0,15.0,10.0],[65.0,70.0,28.0,70.0,32.0,69.0,24.0,14.1,40.0,32.5,10.0],[72.5,65.0,55.0,56.0,45.0,36.0,0.0,13.0,65.0,13.0,10.0],[54.0,82.0,60.0,35.0,0.0,53.0,75.0,27.200001,50.0,12.0,10.0],[70.0,82.0,60.0,74.0,66.099998,60.0,11.3,21.5,40.0,13.0,10.0],[73.0,82.0,52.0,68.400002,35.5,58.0,20.799999,37.200001,55.0,9.4,10.0],[65.0,71.199997,52.0,72.599998,75.400002,51.0,23.299999,6.4,40.0,33.0,10.0],[69.900002,79.599998,39.5,51.0,0.0,67.099998,18.0,7.0,40.0,19.9,10.0],[70.0,65.0,57.799999,20.0,0.0,63.700001,66.0,28.200001,52.5,15.2,10.0],[70.0,77.0,60.0,40.0,25.0,42.0,70.0,38.0,62.5,15.0,10.0],[60.0,88.0,60.0,70.0,95.0,66.0,9.8,35.0,55.0,8.9,10.0],[70.0,82.5,65.0,72.0,0.0,70.0,22.0,38.0,50.0,8.9,10.0],[58.0,65.0,56.5,55.0,0.0,65.0,11.0,20.0,42.5,60.0,10.0],[55.0,60.0,35.0,55.0,0.0,46.0,0.0,11.0,40.0,33.5,10.0],[70.0,66.0,40.0,8.8,10.8,48.0,57.0,25.0,52.5,35.0,10.0]];
  const fixedSix = new Set([13,16,19,21,22,23,27,32,33,34,39,43,44,45,46,47,51,52,53,54,58,59,60]);
  // UniqueSoldierTemplateTable humanType: 29 five-star templates=Normal,
  // 20 six-star Normal and 3 six-star Rare; no 5/6-star free-type sampling.
  const rareFixedSix = new Set([13,19,47]);
  const typeNames = ['普通','稀有','老兵','天才'];
  const typeBonuses = [0,4,4,11];
  const ignoreArea = new Set([0,1,2,4,7,9,15,17,18,19,20,23,26,29,33,40,43,45,52,56,57,60,61,62]);
  const ignoreKnockBack = new Set([4,51,62]);
  const names = ['體力','攻擊力','移動速度','攻擊射程','攻擊範圍','攻擊速度','擊退','體重','耐力','基本費用','成長速度'];
  const keys = ['hp','atk','walkSpd','range','area','attackSpd','knockback','weight','stamina','baseCost','growSpd'];
  const ranks = ['G','F','E','D','C','B','A','S','SS','SSS'];
  const f = Math.fround;
  const clamp=(x,a,b)=>Math.max(a,Math.min(x,b));
  const ff=(x,n)=>Number(x).toFixed(n);
  function normal(rng) {
    const u1=clamp(Number(rng()),0,1-Number.EPSILON);
    const u2=clamp(Number(rng()),0,1-Number.EPSILON);
    return Math.sqrt(-2*Math.log(1-u1))*Math.cos(2*Math.PI*u2);
  }
  function selectHumanType(id,star,rng,ability731=0) {
    if(star===6 && fixedSix.has(id))return rareFixedSix.has(id)?1:0;
    if(star===5)return 0;
    // GetHumanTypeWeights VA0x02D55978: genius=(100+B731)*0.01/100,
    // then Normal=max(0,1-(Rare+OldSoldier+Genius)).
    const b=Number.isFinite(Number(ability731))?Math.max(0,Number(ability731)):0;
    const rare=f(.20),old=f(.10);
    const genius=f(f(f(100+b)*f(.01))/f(100));
    const ordinary=f(Math.max(0,f(f(1)-f(f(rare+old)+genius))));
    const w=[ordinary,rare,old,genius];
    const total=w.reduce((a,b)=>a+b,0);
    let roll=Math.max(0,Math.min(1-Number.EPSILON,Number(rng())))*total;
    for(let i=0;i<w.length;i++){roll-=w[i];if(roll<0)return i;}
    return 3;
  }
  function calcLevel(base,rng,typeBonus=0) {
    const b=f(f(base)+f(typeBonus));
    const sigma=f(clamp(f(8-f(f(b*4)/70)),1,8));
    return f(clamp(f(b+f(f(normal(rng))*sigma)),0,99.9));
  }
  function pow(base,exponent){ return f(Math.pow(f(base),f(exponent))); }
  function valueFromLevel(index,level) {
    const L=f(clamp(level,0,99.9));
    const high=L>=80, x=f(L-80), n=Math.floor(f(L/10)),m=Math.floor(f(x/10));
    if(index===10)return f(f(10.010009765625)*L);
    if(index===0){
      return high ? f(f(f(63623464*pow(1.065,x))*pow(1.7,m))):f(f(f(30*pow(1.115,L))*pow(2.08,n)));
    }
    if(index===1){
      return high ? f(f(f(4996696*pow(1.06,x))*pow(1.6,m))):f(f(f(4*pow(1.112,L))*f(Math.pow(2,n))));
    }
    if(index===9){
      return high ? f(f(f(1997*pow(0.975,x))*pow(0.8,m))):f(f(f(1500000*pow(0.95,L))*pow(0.73,n)));
    }
    const below=[null,null,[.05,.00875],[.25,.015625],[0,.00625],[7,-.08],[0,.015],[30,2.125],[30,4]];
    const above=[null,null,[.75,.0035175872035324574],[1.5,.010050253],[.5,.0025125633],[.6,-.0125628142],[1.2,.0201005004],[200,10.05025005],[350,2.5125625]];
    const [start,mult]=(high?above:below)[index];
    return f(f(start)+f(f(mult)*(high?x:L)));
  }
  function formatReadable(value) {
    if(!Number.isFinite(value))return '—';
    const a=Math.max(0,value);
    if(a<10000)return String(Math.trunc(a));
    // Native BigInteger.ToReadableString: '0.000E000' then take e%4 digits; no second rounding.
    // JS toExponential(3) is close but differs on exact tie / 1-ULP Android cases.
    const scientific=a.toExponential(3).split('e');
    let significant=scientific[0].replace('.','');
    let exponent=Number(scientific[1]);
    const unitIndex=Math.floor(exponent/4), remainder=exponent%4;
    const units=['','萬','億','兆','京','垓','秭','穰'];
    if(unitIndex<=0||unitIndex>=units.length)return Math.trunc(a).toLocaleString('zh-TW');
    if(remainder===0)return significant[0]+'.'+significant[1]+units[unitIndex];
    if(remainder===1)return significant.slice(0,2)+'.'+significant[2]+units[unitIndex];
    if(remainder===2)return significant.slice(0,3)+units[unitIndex];
    return significant.slice(0,4)+units[unitIndex];
  }
  const shortest=(v,places)=>Number(v.toFixed(places)).toString();
  function format(index,value){
    if(index===2)return ff(value,3)+' km/s';
    if(index===3||index===4||index===6)return shortest(value,3)+' km';
    if(index===5)return ff(value,3)+'s/回';
    if(index===7)return shortest(value,2)+'kg';
    if(index===10)return 'EXP +'+formatReadable(value)+'%';
    return formatReadable(value);
  }
  function generate(id,star,rng=Math.random,options={}){
    const i=Number(id);
    if(!Number.isInteger(i)||i<0||i>=64)return null;
    const fixed=Number(star)===6 && fixedSix.has(i);
    const ability731=Number(options?.ability731)||0;
    const humanType=selectHumanType(i,Number(star),rng,ability731);
    const typeBonus=typeBonuses[humanType];
    const stats=levels[i].map((base,index)=>{
      const ignored=(index===4&&ignoreArea.has(i))||(index===6&&ignoreKnockBack.has(i));
      if(ignored)return {index,key:keys[index],name:names[index],ignored:true,
        initialLevel:null,currentLevel:null,level:null,oldSoldierBonus:0,
        value:null,text:'不適用',grade:null,rank:null,percent:0};
      // CreateRandomStatusData stores initial (x18) and current (x20) separately.
      // OldSoldier gains +4 to the random mean and +3 to current level ONLY.
      // UniqueStatusData.GetTotalLevel clamps current + inheritance to rank-9 cap
      // 99.9 for a newly recruited hero, then GetActualValue / GetRank use total.
      const initialLevel=fixed?f(base):calcLevel(base,rng,typeBonus);
      const oldSoldierBonus=humanType===2?3:0;
      const currentLevel=f(initialLevel+oldSoldierBonus);
      const level=f(Math.min(currentLevel,f(99.9)));
      const value=valueFromLevel(index,level);
      const rank=Math.max(0,Math.min(9,Math.floor(level/10)));
      return {index,key:keys[index],name:names[index],ignored:false,
        initialLevel,currentLevel,oldSoldierBonus,level,value,
        text:format(index,value),grade:ranks[rank],rank,percent:Math.round(level*1000)/1000};
    });
    const speed=stats[2];
    return {stats,fixed,humanType,humanTypeName:typeNames[humanType],ability731,
      humanTypeMode:Number(star)>=5?'模板指定':'按基礎權重抽選',
      // The original OldSoldier additional +3 is reflected in the displayed
      // total/current level, while initialLevel preserves the pre-+3 value.
      mode:fixed?'六星固定模板':humanType===0?'普通類型正負隨機':typeNames[humanType]+'正負隨機',
      speed:{initialLevel:speed.initialLevel,currentLevel:speed.currentLevel,
        level:speed.level,speed:speed.value,display:speed.text,
        gradeIndex:speed.rank,grade:speed.grade,fixed,
        mode:fixed?'六星固定初始值':typeNames[humanType]+'初始值'}
    };
  }
  // Normal CDF approximation for aggregate theory only (not for RNG draws).
  // Accuracy is sufficient for display; Android float32/rounding ties may differ.
  function normalCdf(z){
    if(z<=-9)return 0;
    if(z>=9)return 1;
    const x=Math.abs(z),t=1/(1+0.2316419*x);
    const density=0.3989422804014327*Math.exp(-.5*x*x);
    const tail=density*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
    return clamp(z>=0?1-tail:tail,0,1);
  }
  function speedProbabilities(id,star,ability731=0){
    const i=Number(id),s=Number(star);
    if(!Number.isInteger(i)||i<0||i>=64||![3,4,5,6].includes(s))return null;
    const fixed=s===6&&fixedSix.has(i);
    const b=Number.isFinite(Number(ability731))?Math.max(0,Number(ability731)):0;
    const genius=f(f(f(100+b)*f(.01))/f(100));
    const regular=f(Math.max(0,f(1-f(f(.2)+f(.1)+genius))));
    let shares=[regular,f(.20),f(.10),genius];
    if(s===5)shares=[1,0,0,0];
    if(fixed)shares=rareFixedSix.has(i)?[0,1,0,0]:[1,0,0,0];
    const total=shares.reduce((x,y)=>x+y,0);
    shares=shares.map(v=>v/total);
    const rows=typeNames.map((name,type)=>{
      const chance=shares[type];
      if(fixed){
        const L=levels[i][2],speed=format(2,valueFromLevel(2,L));
        return {name,type,chance,g:L<10?1:0,zero:speed==='0.050 km/s'?1:0};
      }
      const mu=f(f(levels[i][2])+f(typeBonuses[type]));
      const width=f(clamp(f(8-f(f(mu*4)/70)),1,8));
      const extra=type===2?3:0;
      const g=normalCdf((10-extra-mu)/width);
      // With the official F3 panel display, 0.050 spans L in [0, 0.5/8.75].
      // OldSoldier starts at total L>=3, so this event is impossible for it.
      const zero=extra?0:normalCdf((0.0005/0.00875-mu)/width);
      return {name,type,chance,g,zero};
    });
    return {id:i,star:s,fixed,rows,g:rows.reduce((n,r)=>n+r.chance*r.g,0),
      zero:rows.reduce((n,r)=>n+r.chance*r.zero,0)};
  }
  window.DFCHRecruitStatus=Object.freeze({version:'2.5.1',generate,valueFromLevel,formatReadable,speedProbabilities,
    names:Object.freeze(names),typeNames:Object.freeze(typeNames),
    fixedSixIds:Object.freeze([...fixedSix]),rareFixedSixIds:Object.freeze([...rareFixedSix])});
})();
