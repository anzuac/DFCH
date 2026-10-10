const assert=require('node:assert/strict');global.window={};
for(const module of ['random','lottery','event-state','drop-state','stamina','simulation-runtime'])require(`../${module}.js`);
const data=require('../data/stage-1.json'),R=window.DFCHSimulationRuntime;
const options={seed:42,completionRate:100,stamina:window.DFCHStamina.configure('manual',30),saved:{daily:500,owned:{301005002:4},flags:[6602]}};
const c=R.initialize(data,options);
assert.equal(c.random.calls,0);assert.equal(c.exploration.initialRewards.length,15);assert.equal(c.drops.limitReached,true);assert.equal(c.stamina.current,30);
c.draw([1,5,5]);c.progressDelta(1,1);c.quantity(5,5);assert.equal(c.random.calls,3);
const a=R.initialize(data,options),b=R.initialize(data,options);assert.deepEqual(Array.from({length:10},()=>a.draw([1,5,5])),Array.from({length:10},()=>b.draw([1,5,5])));
const encoded=R.initialize(data,{...options,storedCryptoInt:'0x000000010000002b'});assert.equal(encoded.seed,42);
const report=R.preflight(data);assert.equal(report.ready,false);assert.equal(report.missing.filter(s=>s.startsWith('事件處理')).length,24);
assert.equal(c.random.calls,3); // preflight must consume no RNG
(async()=>{let mutated=false;await assert.rejects(R.replay(c,[{functionType:101},{functionType:7}],{101:()=>{mutated=true;}}));assert.equal(mutated,false);console.log('Shared seed stream, saved snapshots and complete preflight blocking passed');})().catch(e=>{console.error(e);process.exitCode=1;});
