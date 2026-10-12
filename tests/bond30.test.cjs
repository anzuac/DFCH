const assert = require("node:assert/strict");
const engine = require("../bond30-engine.js");
const records = [
  {abilityId:303000001,chooseGroupType:1,weight:100,exclusiveGroupIdRaw:0},
  {abilityId:303000002,chooseGroupType:1,weight:50,exclusiveGroupIdRaw:4},
  {abilityId:303000003,chooseGroupType:1,weight:33,exclusiveGroupIdRaw:4},
  {abilityId:303000004,chooseGroupType:0,weight:999,exclusiveGroupIdRaw:0}
];
assert.equal(engine.normalizePool(records).length,3,"Only Optional skills are included");
assert.deepEqual(engine.parseIdList("303000001, 303000002、303000001"),[303000001,303000002]);
const remaining=engine.eligible(records,{excludedIds:[303000001]});
assert.deepEqual(remaining.map(r=>r.abilityId),[303000002,303000003]);
assert.equal(engine.withRates(remaining).reduce((sum,r)=>sum+r.percent,0),100);
assert.equal(engine.choose(remaining,()=>0).abilityId,303000002);
assert.equal(engine.choose(remaining,()=>0.999).abilityId,303000003);
assert.deepEqual(engine.eligible(records,{excludedIds:[303000001],applyGroupExclusions:true,blockedGroups:[4]}),[]);
assert.equal(engine.choose([],()=>0),null);
console.log("bond30 engine: OK");
