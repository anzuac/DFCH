/* The 3.18 collaboration pools are confined to Recruit, not Bond30. */
(() => {'use strict';
const D=window.DFCH_DATA,C=window.DFCHRecruitConfig,X=window.DFCHRecruitCollab318;
if(!D||!C||!X||C.keys.length!==9)throw Error('Invalid original Recruit baseline');
const five=[{"id":76,"key":"shapeshifter_laios","name":"萊歐斯（變形者）","job":1,"fixed":[303000000,303000119,303000123,303000806,303001131],"title":"非比尋常嗜好的擬態"},{"id":77,"key":"shapeshifter_marcille","name":"瑪露希爾（變形者）","job":4,"fixed":[303000000,303000119,303000123,303001132,303001133],"title":"令人畏懼的心理虛像"},{"id":78,"key":"shapeshifter_chilchack","name":"奇爾查克（變形者）","job":2,"fixed":[303000000,303000119,303000123,303001134,303001135],"title":"成長期的誤會"},{"id":79,"key":"shapeshifter_senshi","name":"先西（變形者）","job":1,"fixed":[303000000,303000119,303000123,303001136,303001137],"title":"對雄壯的憧憬"}],six={"71":{"name":"瑪露希爾","title":"鑽研魔法的精靈才女","key":"marcille"},"72":{"name":"奇爾查克","title":"踏實的超毒舌開鎖師","key":"chilchack"},"73":{"name":"先西","title":"可靠的魔物料理掌廚","key":"senshi"},"74":{"name":"莞苞","title":"自由自在的獸人","key":"izutsumi"},"75":{"name":"法琳","title":"心地善良的純真靈魂","key":"falin"}},fixed={"71":[303000000,303000127,303000131,303001114,303001115,303000515,303000511,303000608,303000904,303000506],"72":[303000000,303000127,303000131,303001116,303001117,303001061,303000803,303000805,303000907,303001011],"73":[303000000,303000127,303000131,303001118,303001119,303001070,303000732,303001066,303000605,303001010],"74":[303000000,303000127,303000131,303001120,303001121,303001122,303001015,303001011,303001012,303001023],"75":[303000000,303000127,303000131,303001123,303001124,303001125,303001005,303001087,303000506,303001023]};
const keys=C.keys.slice(),weights=C.weights.map(x=>x.slice()),sixPools=C.six.map(x=>x.slice()),pickups=C.pickups.map(x=>x.slice()),publicCeiling=C.publicCeiling.slice();
for(const h of five){D.heroRoster[String(h.id)]={id:h.id,name:h.name,key:h.key,job:h.job,star:5};D.heroes[String(h.id)]={fixed:h.fixed.slice()};}
for(const [id,h] of Object.entries(six))D.heroRoster[id]={id:Number(id),name:h.name,key:h.key,title:h.title,star:6,job:0};
for(const p of X.pools){const g=p.rarityHeroGroups;keys.push(p.key);weights.push(p.rawWeights.slice());sixPools.push(p.sixHeroIds.slice());pickups.push(p.pickupIds.slice());publicCeiling.push(3);
D.poolNames[p.key]=({'delicious_first_half':'迷宮飯 P1｜前半期','delicious_second_half':'迷宮飯 P2｜後半期','delicious_final':'迷宮飯 P3｜最終期'})[p.key];
D.poolRarityRoster[p.key]={'3':g[0].slice(),'4':g[1].slice(),'5':g[2].slice(),'6':g[3].slice()};
D.poolRows[p.key]=X.abilities(p.key).map(row=>[row.id,row.group,row.weight]);}
const officialFiveNames={"303001131":"領袖的資質？","303001132":"學校有史以來最優秀的才女？","303001133":"古代魔法的知識？","303001134":"老練的開鎖匠？","303001135":"敏銳的五感？","303001136":"魔物料理專家？","303001137":"營養滿分的魔物料理？"};
for(const [id,name] of Object.entries(officialFiveNames))D.displayNames[id]=name;
for(const h of five)for(const id of h.fixed)if(!D.displayNames[String(id)])D.displayNames[String(id)]='能力 '+id;
window.DFCHRecruitConfig=Object.freeze({...C,keys,weights,six:sixPools,pickups,publicCeiling,sixFixed:{...C.sixFixed,...fixed},
groupExclusive:{...C.groupExclusive,...Object.fromEntries(X.pools.map(p=>[p.key,[[303000709,303000722]]]))},
targetPlayerIndexes:C.targetPlayerIndexes});
window.DFCHRecruitCollab318Adapter=Object.freeze({five,levels:{"71":[60,83,38,75.2,70,55,50,25,45,12.5,10],"72":[55,72,65,60,0,65,8,21,52,20,10],"73":[75,70,27.8,5.2,20,60,80,52,65,12,10],"74":[60,80,68,50,0,72,13,32,58,12,10],"75":[70,72,40,65,60,32,0,35,60,15,10],"76":[70,63,40,8.5,0,60,22,38,55,18,10],"77":[55,76,35,72.3,65.1,50,45,28,45,15,10],"78":[50,70,63,60,0,60,5,15,47,25,10],"79":[73,60,27.8,5,20,60,75,49,60,15,10]}});
})();