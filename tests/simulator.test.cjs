const assert=require('node:assert/strict');global.window={};
for(const m of ['random','lottery','event-state','drop-state','stamina','expedition-rules','simulation-runtime','event-pool','simulator','simulation-batch'])require('../'+m+'.js');
const data=require('../data/stage-1.json'),S=window.DFCHSimulator,P=window.DFCHEventPool,B=window.DFCHSimulationBatch;
const defaults={seed:42,multiplier:2,completionRate:0,stamina:window.DFCHStamina.configure('unlimited')};
const a=S.run(data,defaults),b=S.run(data,defaults);assert.deepEqual(a,b);
assert.equal(a.endReason,'goal');assert.equal(a.progress,60);assert.equal(a.bosses,1);assert.equal(a.combatDurationSeconds,0);
assert.equal(a.steps,26);assert.equal(a.randomCalls,98);assert.equal(a.rewards[102000000],42); // regression fixture, not a native whole-run oracle
assert.ok(a.log.some(r=>r.text.includes('史萊姆')));assert.ok(!a.log.some(r=>r.text.includes('[object Object]')));
for(const rate of [0,29.9,30,69.9,70,100])for(const multiplier of [.8,2,10])for(let seed=0;seed<100;seed++){
 const r=S.run(data,{...defaults,seed,multiplier,completionRate:rate,record:false});assert.equal(r.progress,60);assert.equal(r.bosses,1);
 assert.ok(r.completionRate>=Math.fround(rate)&&r.completionRate<=100);for(const n of Object.values(r.rewards))assert.ok(Number.isSafeInteger(n)&&n>=0);
 if(rate===100)assert.equal(Object.keys(r.eventCounts).some(n=>n.includes('探索')&&!n.includes('解鎖')),false);
}
const c=S.create(data,defaults);assert.equal(c.random.calls,0);const pool=c.basePool;
assert.equal(pool.filter(r=>r.name==='搜尋秘石').length,0);
const unlocked=S.create(data,{...defaults,saved:{flags:[6504]}});assert.equal(unlocked.basePool.find(r=>r.name==='搜尋秘石').conditionValues[0],6602);
unlocked.drops=window.DFCHDropState.unlock(unlocked.drops,6602);assert.equal(P.eligible(unlocked.basePool.find(r=>r.name==='搜尋秘石'),unlocked),false);
const cap=S.create(data,{...defaults,saved:{daily:500,owned:{301005002:4,301005003:1}}});
assert.equal(P.eligible(cap.basePool.find(r=>r.eventType===5),cap),false);
for(let seed=0;seed<100;seed++){
 const r=S.run(data,{...defaults,seed,completionRate:100,saved:{daily:500,owned:{301005002:4,301005003:1}},record:false});assert.equal(r.ordinaryDiamonds,0);assert.equal(r.rewards[301005002],undefined);assert.equal(r.rewards[301005003],undefined);
 const tired=S.run(data,{...defaults,seed,stamina:window.DFCHStamina.configure('manual',1),record:false});assert.equal(tired.endReason,'stamina');assert.equal(tired.stamina,0);
}
// Explicit merged-pool activation/expiry, without depending on a rare random draw.
S.handlers[104](data,c,{args:[1]});assert.equal(c.zonePool.length,1);assert.equal(P.active(c).length,pool.length+1);
c.progress=20;assert.equal(window.DFCHEventState.zoneExpired(0,c.progress,c.zone.buff),true);
// Integer progress still consumes a sample; forced end event does not draw event RNG.
const forced=S.create(data,defaults);forced.progress=60;const chosen=P.choose(forced);assert.equal(chosen.boss,true);assert.equal(forced.random.calls,0);
assert.throws(()=>S.create(data,{...defaults,abilityIds:[-100]}),/收集家/);
(async()=>{
 const independent=await B.run(data,defaults,{count:20}),again=await B.run(data,defaults,{count:20});assert.deepEqual(independent,again);assert.equal(independent.completed,20);assert.equal(independent.goals,20);
 const continuous=await B.run(data,defaults,{count:100,mode:'continuous'});assert.equal(continuous.completed,100);assert.ok(continuous.last.completionRate>continuous.first.completionRate);
 const expected=S.run(data,{...defaults,seed:continuous.last.seed,saved:continuous.last.saved});assert.ok(expected.saved.daily>=continuous.last.saved.daily);
 const signal={aborted:false};const cancelled=await B.run(data,defaults,{count:10000,signal,onProgress:a=>{if(a.completed>=1)signal.aborted=true;}});assert.equal(cancelled.cancelled,true);assert.ok(cancelled.completed>=1&&cancelled.completed<10000);
 const pre=await B.run(data,defaults,{count:100,signal:{aborted:true}});assert.equal(pre.completed,0);assert.equal(pre.first,null);
 console.log('First-map lifecycle, 1,800 full runs, caps, ownership, flags, replay, batch carry-over and cancellation passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
