'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const c=require('../Recruit/collab-318-core.js');
const pool=['delicious_first_half','delicious_second_half','delicious_final'];
test('all three pools reference one verified source and native pity index 9',()=>{
 assert.deepEqual(c.pools.map(x=>x.poolId),[9,10,11]);
 assert.deepEqual(c.pools.map(x=>x.sixHeroIds.length),[3,3,5]);
 assert.deepEqual(c.pools.map(x=>x.publiclyGodCeiling),[3,3,3]);
 for(const k of pool){assert.equal(c.abilities(k).length,87);assert.equal(c.pityIndex(k),9);}
 assert.strictEqual(c.abilities(pool[0]),c.abilities(pool[2]));
});
test('87 rows retain weights, groups, and official exclusivity',()=>{
 const ids=c.abilities(pool[0]).map(x=>x.id);assert.equal(new Set(ids).size,87);
 assert.deepEqual([0,1,2,3].map(g=>c.groupRows(pool[0],g).length),[1,62,12,12]);
 assert.deepEqual([303000709,303000722].map(id=>c.byId.get(id).exclusiveGroupId),[1,1]);
 assert.equal(c.byId.get(303000709).weight,50);assert.equal(c.byId.get(303000722).weight,25);
 assert.equal(c.groupRows(pool[0],0)[0].weight,0);
});
test('new 3.18 cooking whitelist includes four five-stars but excludes six-stars',()=>{
 const row=c.byId.get(303000604);
 const ctx={star:5,jobMask:7,selected:[]};
 for(const id of [76,77,78,79])assert.equal(c.allowed(row,{...ctx,heroId:id}),true,id);
 for(const id of [71,72,73,74,75])assert.equal(c.allowed(row,{...ctx,heroId:id}),false,id);
});
test('star and profession restrictions and artifact conditions',()=>{
 const base={heroId:76,jobMask:7,star:4,selected:[]};
 assert.equal(c.allowed(c.byId.get(303000004),base),true);
 assert.equal(c.allowed(c.byId.get(303000004),{...base,star:5}),false);
 assert.equal(c.allowed(c.byId.get(303000119),{...base,star:4}),false);
 assert.equal(c.allowed(c.byId.get(303000119),{...base,star:5}),true);
 assert.equal(c.allowed(c.byId.get(303000310),{...base,jobMask:1}),false);
 assert.equal(c.allowed(c.byId.get(303000310),{...base,jobMask:1,artifactIds:[301008020]}),true);
 assert.equal(c.allowed(c.byId.get(303000404),{...base,jobMask:2,artifactIds:[301008017]}),true);
 assert.equal(c.allowed(c.byId.get(303000404),{...base,jobMask:1,artifactIds:[301008017]}),false);
});
test('greed I and greed II cannot co-occur',()=>{
 const o={star:5,heroId:76,jobMask:7};
 assert.equal(c.allowed(c.byId.get(303000722),{...o,selected:[303000709]}),false);
 assert.equal(c.allowed(c.byId.get(303000709),{...o,selected:[303000722]}),false);
});
test('native-style 1000 attempt cap never silently fills an impossible draw',()=>{
 const o={star:5,heroId:72,jobMask:7,selected:[]};
 const result=c.drawGroup(pool[0],1,2,{...o,selected:c.groupRows(pool[0],1).map(x=>x.id)},()=>0.01);
 assert.equal(result.drawn.length,0);assert.equal(result.attempts,1000);assert.equal(result.exhausted,true);
});
