const assert=require('node:assert/strict');global.window={};require('../expedition-rules.js');const R=window.DFCHExpeditionRules;
// Leadership's speed weight (2:1) must not be reused for stamina (1:0.5 sum).
assert.equal(R.staminaMax(230,[236]),348);
assert.equal(R.staminaMax(230,[236,100],20),418);
assert.equal(R.staminaMax(230,[]),230);
assert.equal(R.consumeStamina(5,10),0);
assert.equal(R.consumeStamina(230,5),225);
assert.equal(R.excludeFullyExplored(9,100),true);
assert.equal(R.excludeFullyExplored(4,100),false);
assert.equal(R.excludeFullyExplored(9,99.9),false);
assert.equal(R.transferableProgress(1,15,false),true);
assert.equal(R.transferableProgress(1,15,true),false);
assert.equal(R.transferableProgress(4,15,false),false);
assert.equal(R.nextForceCheckpoint(58,7,[{isForce:true,checkPointProgress:60}]),60);
assert.equal(R.nextForceCheckpoint(60,7,[{isForce:true,checkPointProgress:60}]),null);
console.log('Verified expedition rule checks passed');

require('../map-data.js');const data=window.DFCHMapData;
assert.equal(data.referenceDungeon.dungeonId,900);
assert.deepEqual(R.convertDrop({rewardId:600000003,dungeonConversion:true},3,data),{rewardId:600000003,quantity:3});
assert.deepEqual(R.convertDrop({rewardId:600000004,dungeonConversion:true},1,data),{rewardId:600000004,quantity:1});
assert.deepEqual(R.convertDrop({rewardId:600000003,dungeonConversion:false},3,data),{rewardId:600000003,quantity:3});
assert.deepEqual(R.convertDrop({rewardId:101000000,dungeonConversion:true},100,data),{rewardId:101000000,quantity:100});

assert.equal(R.minimumMultiDropRolls(0),3);
assert.equal(R.minimumMultiDropRolls(.75),4);
assert.equal(R.minimumMultiDropRolls(1),null);
