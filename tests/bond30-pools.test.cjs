const assert = require("node:assert/strict");
const full = require("../data/bond30-all-pools-3.16.1.json");
const optional = require("../data/bond30-pools-3.16.1.json");
const engine = require("../bond30-engine.js");
const keys = Object.keys(full.pools);
assert.equal(keys.length,9,"9 recruit pools");
let count=0,optionalCount=0;
for (const key of keys) {
  const rows = full.pools[key];
  assert.ok(rows.length>0,key+" contains records");
  assert.ok(Array.isArray(optional.pools[key]),key+" has optional pool");
  const groups = new Set(rows.map(r=>r.chooseGroupType));
  assert.deepEqual([...groups].sort(),[1,2,3],key+" has 3 groups");
  assert.ok(rows.every(r=>Number.isSafeInteger(r.abilityId)&&r.abilityId>0&&Number.isFinite(r.weight)&&r.weight>0));
  assert.equal(rows.length,new Set(rows.map(r=>r.abilityId)).size,key+" unique ability IDs");
  const a=engine.normalizePool(rows).map(r=>r.abilityId+":"+r.weight).sort();
  const b=engine.normalizePool(optional.pools[key]).map(r=>r.abilityId+":"+r.weight).sort();
  assert.deepEqual(a,b,key+" optional weights match");
  count+=rows.length;optionalCount+=a.length;
}
assert.equal(count,762,"All raw records");
assert.equal(optionalCount,540,"All Optional records");
console.log("bond30 nine-pool data: OK");
