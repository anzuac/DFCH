const assert=require('node:assert/strict');global.window={};
for(const m of ['map-data','random','lottery','event-state','drop-state','stamina','expedition-rules','simulation-runtime','event-pool','simulator','simulation-batch','records'])require('../'+m+'.js');
const d=require('../data/stage-2.json'),S=window.DFCHSimulator,P=window.DFCHEventPool;
assert.deepEqual(window.DFCHMaps.stage_2,d);assert.equal(d.master.duration,1800);assert.equal(d.master.depth,90);assert.equal(d.master.stoneFlag,6603);
for(const map of Object.values(window.DFCHMaps)){
 const groups=new Set(map.dropSamples.map(r=>r.dropItemSampleGroupId)),rewards=new Set(map.rewardMasters.map(r=>r.rewardId));
 for(const row of map.completionRewards){if(row.rewardType===3)assert.ok(groups.has(row.referenceId2));if(row.rewardType===5)assert.ok(groups.has(row.referenceId));}
 for(const row of map.dropSamples)assert.ok(row.rewardId===-1||rewards.has(row.rewardId));
 for(const row of map.monsterSamples)assert.ok(map.monsterNames.some(m=>m.index===row.monsterId));
}
const config={seed:42,multiplier:2,completionRate:0,stamina:window.DFCHStamina.configure('unlimited')};
for(const rate of [0,29.9,30,44.9,45,69.9,70,79.9,80,99.9,100]){
 const c=S.create(d,{...config,completionRate:rate});
 for(const r of d.completionRewards.filter(r=>[3,5].includes(r.rewardType)))assert.equal(c.basePool.some(e=>e.rows.some(s=>s.functionType===(r.rewardType===3?108:7)&&s.args[0]===r.referenceId)),rate>=r.requiredCompletionRate);
 for(let seed=0;seed<100;seed++){
  const r=S.run(d,{...config,seed,completionRate:rate,record:false});assert.equal(r.progress,90);assert.equal(r.bosses,1);assert.equal(r.endReason,'goal');assert.equal(r.configuredDurationSeconds,1800);
 }
}
const flag=S.create(d,{...config,saved:{flags:[6507]}});assert.equal(flag.basePool.find(r=>r.name==='搜尋秘石').conditionValues[0],6603);
flag.drops=window.DFCHDropState.unlock(flag.drops,6603);assert.equal(P.eligible(flag.basePool.find(r=>r.name==='搜尋秘石'),flag),false);
for(let seed=0;seed<100;seed++){
 const r=S.run(d,{...config,seed,completionRate:100,saved:{daily:500,owned:{301005004:10,301005005:1}},record:false});assert.equal(r.ordinaryDiamonds,0);assert.equal(r.rewards[301005004],undefined);assert.equal(r.rewards[301005005],undefined);
 const tired=S.run(d,{...config,seed,stamina:window.DFCHStamina.configure('manual',1),record:false});assert.equal(tired.endReason,'stamina');
}
let samples=[4294967295,4294967294,2147483647,2147483646,0],calls=0;
window.crypto={getRandomValues:a=>{a[0]=samples[calls++];return a;}};
assert.equal(window.DFCHRandom.freshSeed(),0);assert.equal(calls,3);assert.equal(window.DFCHRandom.freshSeed(),2147483646);assert.equal(window.DFCHRandom.freshSeed(),0);
(async()=>{
 let n=100;const r=await window.DFCHSimulationBatch.run(d,config,{count:5,seedFactory:()=>n++});assert.equal(r.first.seed,42);assert.equal(r.last.seed,103);
 const store=window.DFCHRecords.create({getItem:()=>raw,setItem:(k,v)=>raw=v,removeItem:()=>raw=null});
 store.add('independent',d,r.last,config);const first=S.run(window.DFCHMaps.stage_1,config);store.add('independent',window.DFCHMaps.stage_1,first,config);
 assert.equal(store.get('independent','stage_2').totals.completed,1);assert.equal(store.get('independent','stage_1').totals.completed,1);
 store.reset('independent','stage_2');assert.equal(store.get('independent','stage_2'),null);assert.equal(store.get('independent','stage_1').totals.completed,1);
 console.log('Second-map source closure, 1,100 runs, thresholds, caps, ownership, flags, stamina, fresh seeds and isolated records passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
let raw=null;
