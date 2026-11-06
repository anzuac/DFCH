'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const f=require('../Recruit/collab-318-hero-templates.json');
const core=require('../Recruit/collab-318-core.js');
test('all four 3.18 five-star shapeshifter templates have correct source IDs, classes and five fixed skills',()=>{
 assert.deepEqual(f.fiveStar.map(x=>x.id),[76,77,78,79]);
 assert.deepEqual(f.fiveStar.map(x=>x.job),[1,4,2,1]);
 assert.deepEqual(f.fiveStar.map(x=>x.fixed.length),[5,5,5,5]);
 assert.deepEqual(f.fiveStar[0].fixed,[303000000,303000119,303000123,303000806,303001131]);
 assert.deepEqual(f.fiveStar[1].fixed,[303000000,303000119,303000123,303001132,303001133]);
 assert.deepEqual(f.fiveStar[2].fixed,[303000000,303000119,303000123,303001134,303001135]);
 assert.deepEqual(f.fiveStar[3].fixed,[303000000,303000119,303000123,303001136,303001137]);
 for(const pool of core.pools)assert.deepEqual(pool.rarityHeroGroups[2],[76,77,78,79]);
});

test('four five-star names and seven unique lesser fixed skills use official 3.18 Chinese localization',()=>{
 assert.deepEqual(f.fiveStar.map(x=>x.name),["萊歐斯（變形者）","瑪露希爾（變形者）","奇爾查克（變形者）","先西（變形者）"]);
 assert.equal(f.fiveStarAbilities[303001131],'領袖的資質？');
 assert.equal(f.fiveStarAbilities[303001137],'營養滿分的魔物料理？');
});
