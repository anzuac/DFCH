const assert=require('node:assert/strict');global.window={};require('../random.js');require('../lottery.js');require('../event-state.js');
const {OfficialRandom,seedFromStoredCryptoInt}=window.DFCHRandom;
const vectors=require('../docs/evidence/random-native-vectors.json');
for(const row of vectors.rows) {
 let rng=new OfficialRandom(row.seed);
 assert.deepEqual(Array.from({length:row.doubles.length},()=>rng.nextDouble()),row.doubles);
 rng=new OfficialRandom(row.seed);
 assert.deepEqual([[0,1],[3,11],[5,5],[-100,100],[-2147483648,2147483647]].map(([a,b])=>rng.next(a,b)),row.integers);
 assert.equal(rng.calls,6);
}
assert.equal(seedFromStoredCryptoInt('0x123456789abcdef0'),-2004318072);
assert.equal(seedFromStoredCryptoInt('0xffffffffffffffff'),0);
assert.throws(()=>new OfficialRandom(2147483648));assert.throws(()=>new OfficialRandom(1.5));
const rng=new OfficialRandom(42),next=()=>rng.nextDouble();
const t=window.DFCHLottery.build([1,5,5]);
window.DFCHLottery.choose([],t,next,[{id:'boss',weight:1}]);assert.equal(rng.calls,0);
window.DFCHLottery.draw(t,next);assert.equal(rng.calls,1);
window.DFCHEventState.progressDelta(1,1,false,next);assert.equal(rng.calls,2);
rng.next(5,5);assert.equal(rng.calls,3);
console.log('Native APK random vectors, int32 edges, equal-bound consumption and shared lottery/progress RNG passed');
