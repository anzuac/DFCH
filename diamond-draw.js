(() => {
  'use strict';
  const tiers=[{name:'稀有',weight:60},{name:'傳說',weight:34},{name:'夢幻',weight:5},{name:'神',weight:1}];
  const row=(kind,quantity,weight)=>({kind,quantity,weight});
  const standard=[
    [row('token',3,28),row('token',10,17.9),row('diamond',15,28),row('diamond',30,20),row('diamond',100,3),row('diamond',777,.1),row('redChest',1,3)],
    [row('token',10,30),row('diamond',20,30),row('diamond',50,29.4),row('diamond',150,5),row('diamond',7777,.1),row('redChest',1,5),row('redChest',5,.5)],
    [row('diamond',50,30),row('diamond',100,30),row('diamond',500,26.4),row('diamond',1000,3),row('diamond',7777,.1),row('redChest',1,10),row('redChest',10,.5)],
    [row('diamond',100,31.4),row('diamond',500,30),row('diamond',3000,3),row('diamond',9999,.1),row('redChest',1,30),row('redChest',3,5),row('redChest',10,.5)]
  ];
  const horn=[
    [row('diamond',10,23.9),row('diamond',15,20),row('diamond',20,30),row('diamond',40,20),row('diamond',100,3),row('diamond',777,.1),row('thornChest',1,3)],
    [row('diamond',20,30),row('diamond',30,30),row('diamond',50,29.8),row('diamond',150,5),row('diamond',7777,.1),row('thornChest',3,4.6),row('thornChest',10,.5)],
    [row('diamond',50,30),row('diamond',100,30),row('diamond',500,26.8),row('diamond',1000,3),row('diamond',7777,.1),row('thornChest',10,9.7),row('goldChest',10,.4)],
    [row('diamond',100,31.8),row('diamond',500,30),row('diamond',3000,3),row('diamond',9999,.1),row('thornChest',10,30),row('goldChest',10,5),row('goldChest',100,.1)]
  ];
  const names={diamond:'鑽石',token:'金色代幣',redChest:'紅色寶箱',thornChest:'荊刺寶箱',goldChest:'黃金寶箱'};
  const icons={diamond:'💎',token:'🪙',redChest:'🧰',thornChest:'🧰',goldChest:'🎁'};
  const random=()=>{const a=new Uint32Array(1);window.crypto.getRandomValues(a);return a[0]/4294967296;};
  function bounded(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{window.crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%n;}
  function pick(rows,unit){
    if(unit!==undefined&&!(unit>=0&&unit<1))throw new RangeError('亂數必須位於 [0,1)');
    // Integer tenths exactly encode every percentage in the supplied table.
    const weights=rows.map(r=>Math.round(r.weight*10)),sum=weights.reduce((a,b)=>a+b,0);
    if(sum<=0)throw new RangeError('權重總和必須大於零');
    let target=unit===undefined?bounded(sum):unit*sum;
    for(let i=0;i<rows.length;i++){if(target<weights[i])return i;target-=weights[i];}
    return rows.length-1;
  }
  function simple(eye,unit){if(unit!==undefined&&!(unit>=0&&unit<1))throw new RangeError('無效亂數');return {kind:'diamond',quantity:(10+(unit===undefined?bounded(41):Math.floor(unit*41)))*(eye?2:1)};}
  function rewards(owned,tier){return (owned?horn:standard)[tier];}
  function roulette(owned,tierUnit,rewardUnit){
    const tier=pick(tiers,tierUnit),index=pick(rewards(owned,tier),rewardUnit);return {tier,index,...rewards(owned,tier)[index]};
  }
  window.DFCHDiamondDraw=Object.freeze({tiers,standard,horn,names,icons,pick,simple,rewards,roulette,random});
})();
