const assert=require('node:assert/strict');global.window={};require('../lottery.js');
const L=window.DFCHLottery;
let t=L.build([1,5,5]);assert.deepEqual(t.alias,[2,0,1]);
assert.equal(L.draw(t,()=>0),0);assert.equal(L.draw(t,()=>.2),2);assert.equal(L.draw(t,()=>.4),1);
assert.equal(L.draw(t,()=>.8),2);assert.equal(L.draw(t,()=>.95),1);
// Integrate every alias column's mass instead of testing a noisy Monte Carlo.
for(const weights of [[1,5,5],[0,50,0,25,10],[90,10,.01,.01,.01],[.48,5,5],[1,1,1]]) {
 t=L.build(weights);const p=Array(weights.length).fill(0);
 for(let i=0;i<p.length;i++){const q=Math.min(1,Math.max(0,t.probability[i]));p[i]+=q/p.length;p[t.alias[i]]+=(1-q)/p.length;}
 const total=t.weights.reduce((s,w)=>s+w,0);
 p.forEach((value,i)=>assert.ok(Math.abs(value-t.weights[i]/total)<2e-7));
}
t=L.build([1,1]);const staged=L.setWeight(t,0,0,false);assert.deepEqual(staged.probability,t.probability);
assert.equal(L.draw(L.build(staged.weights),()=>0),1);
assert.throws(()=>L.draw(L.build([0,0]),()=>.5));assert.throws(()=>L.build([-1,1]));assert.throws(()=>L.draw(t,()=>1));
assert.equal(L.updateWeights(t,[1,1]),t);
assert.deepEqual(L.updateWeights(t,[0,1]).weights,[0,1]);
let calls=0;const forced=[{weight:2,id:1},{weight:5,id:2},{weight:5,id:3}];
assert.equal(L.choose([],L.build([]),()=>{calls++;return .3},forced).id,2);assert.equal(calls,0);
assert.equal(L.choose(['a','b'],t,()=>{calls++;return .7}),'b');assert.equal(calls,1);
console.log('Official alias partition order, exact draw boundaries, float32 masses and staged rebuild passed');
