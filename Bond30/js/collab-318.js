/* 3.18.0 P1-P3 isolated Bond30 data adapter. Original 9 pools remain unchanged. */
(()=>{'use strict';
 const D=window.DFCH_DATA,X=window.DFCHRecruitCollab318;
 if(!D||!X||Object.keys(D.poolNames).length!==9)throw Error('Legacy Bond30 data unavailable');
 const five=[{"id":76,"name":"萊歐斯（變形者）","key":"shapeshifter_laios","job":1,"fixed":[303000000,303000119,303000123,303000806,303001131]},{"id":77,"name":"瑪露希爾（變形者）","key":"shapeshifter_marcille","job":4,"fixed":[303000000,303000119,303000123,303001132,303001133]},{"id":78,"name":"奇爾查克（變形者）","key":"shapeshifter_chilchack","job":2,"fixed":[303000000,303000119,303000123,303001134,303001135]},{"id":79,"name":"先西（變形者）","key":"shapeshifter_senshi","job":1,"fixed":[303000000,303000119,303000123,303001136,303001137]}];
 const officialNames={"303001131":"領袖的資質？","303001132":"學校有史以來最優秀的才女？","303001133":"古代魔法的知識？","303001134":"老練的開鎖匠？","303001135":"敏銳的五感？","303001136":"魔物料理專家？","303001137":"營養滿分的魔物料理？"};
 for(const h of five){
  D.heroRoster[String(h.id)]={id:h.id,name:h.name,key:h.key,job:h.job,star:5};
  D.heroes[String(h.id)]={fixed:h.fixed.slice()};
 }
 for(const [id,name] of Object.entries(officialNames))D.displayNames[id]=name;
 for(const pool of X.pools){
  const g=pool.rarityHeroGroups;
  D.poolNames[pool.key]=({delicious_first_half:'迷宮飯 P1｜前半期',delicious_second_half:'迷宮飯 P2｜後半期',delicious_final:'迷宮飯 P3｜最終期'})[pool.key];
  D.poolRarityRoster[pool.key]={'3':g[0].slice(),'4':g[1].slice(),'5':g[2].slice()};
  D.poolRows[pool.key]=X.abilities(pool.key).map(x=>[x.id,x.group,x.weight]);
 }
 for(let id=303001112;id<=303001137;id++)D.images[String(id)]='../Recruit/images/collab-318/'+id+'.png';
 for(const id of [303000515,303000806,303000732,303001061,303001087])D.images[String(id)]='../Recruit/images/collab-318/'+id+'.png';
 window.DFCHBond30Collab318=Object.freeze({five,pools:X.pools.map(x=>x.key)});
})();