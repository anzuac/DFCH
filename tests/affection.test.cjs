const assert=require('node:assert/strict');global.window={};require('../affection.js');const A=window.DFCHAffection;
assert.ok(Math.abs(A.ratio(10,30)-1.43)<1e-12);
assert.equal(A.ratio(0,0),1);
assert.equal(A.progressScale(5,20),0.75);
assert.equal(A.progressScale(25,20),0);
assert.equal(A.progressScale(5,0),1);
assert.deepEqual(A.quantityBounds(7777,0),{min:7777,max:7777,fixed:true});
assert.deepEqual(A.quantityBounds(3,10),{min:3,max:10,fixed:false});
console.log('Affection event weighting and quantity checks passed');

require('../map-data.js');const masters=window.DFCHMapData.collectorMasters;
assert.deepEqual(masters.map(m=>[m.abilityLevel,m.maxLevel,m.initialValue,m.diffValue]),[[1,1,1,1],[2,2,1,1],[3,10,1,1]]);
assert.equal(A.collectorValue(masters[0],1),1);
assert.equal(A.collectorValue(masters[1],2),2);
assert.equal(A.collectorValue(masters[2],3),3);
assert.equal(A.collectorValue(masters[2],10),10);
assert.equal(A.collectorValue(masters[2],11),null);
