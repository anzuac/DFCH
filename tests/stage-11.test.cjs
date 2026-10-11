const assert=require('node:assert/strict');global.window={};
for(const m of ['map-data','random','lottery','event-state','drop-state','stamina','expedition-rules','simulation-runtime','event-pool','simulator','simulation-batch','records'])require('../'+m+'.js');
const d=window.DFCHMaps.stage_labyrinth_1,S=window.DFCHSimulator,config={seed:42,multiplier:2,completionRate:0,stamina:window.DFCHStamina.configure('unlimited')};
assert.equal(d.master.duration,36000);assert.equal(d.master.depth,900);assert.equal(d.eventSamples.find(r=>r.logEventId===301).weight,3);
assert.deepEqual(d.eventSequences.filter(r=>r.logEventId===301).map(r=>r.functionType),[111,100,5]);
assert.throws(()=>S.create({...d,simulationPolicy:{...d.simulationPolicy,trapDamage:'official'}},config),/陷阱/);
let traps=0;
for(const rate of [0,29.9,30,44.9,45,69.9,70,79.9,80,99.9,100])for(let seed=0;seed<100;seed++){
 const r=S.run(d,{...config,seed,completionRate:rate,record:false});assert.equal(r.progress,900);assert.equal(r.bosses,1);assert.equal(r.endReason,'goal');assert.equal(r.trapDamagePolicy,'immune');traps+=r.eventCounts['強力物理陷阱']??0;
}
assert.ok(traps>0);
const c=S.create(d,config),trap=c.basePool.find(e=>e.logEventId===301);assert.equal(trap.eventType,6);assert.equal(trap.name,'強力物理陷阱');
const before=c.random.calls;S.handlers[111](d,c);assert.equal(c.random.calls,before);assert.ok(c.log.some(r=>r.text.includes('免除單體陷阱傷害')));
assert.equal(d.master.stoneFlag,0);assert.ok(c.basePool.some(e=>e.name==='搜尋巨大迷宮下層地點'));
const search=c.basePool.find(e=>e.name==='搜尋巨大迷宮下層地點');assert.equal(search.weight,Math.fround(.1));assert.equal(search.conditionValues[0],6612);
c.drops=window.DFCHDropState.unlock(c.drops,6612);assert.equal(window.DFCHEventPool.eligible(search,c),false);
const convert=window.DFCHExpeditionRules.convertDrop;
assert.deepEqual(convert({rewardId:101000000,dungeonConversion:true},7,d),{rewardId:105000001,quantity:11});
for(const [original,target] of [[2,19],[3,20],[4,21],[5,23]]){const out=convert({rewardId:600000000+original,dungeonConversion:true},1,d);assert.equal(out.rewardId,600000000+target);assert.ok(d.rewardMasters.some(r=>r.rewardId===out.rewardId));}
for(let seed=0;seed<100;seed++){
 const owned=Object.fromEntries(d.rewardMasters.filter(r=>d.master.limitedRewardIds.includes(r.rewardId)).map(r=>[r.rewardId,r.maxLevel]));
 const r=S.run(d,{...config,seed,completionRate:100,saved:{daily:500,owned},record:false});assert.equal(r.ordinaryDiamonds,0);for(const id of d.master.limitedRewardIds)assert.equal(r.rewards[id],undefined);
}
let raw=null;const store=window.DFCHRecords.create({getItem:()=>raw,setItem:(k,v)=>raw=v,removeItem:()=>raw=null});
for(const map of Object.values(window.DFCHMaps))for(const mode of ['independent','continuous'])store.add(mode,map,S.run(map,config),config);
store.resetMode('independent');for(const key of Object.keys(window.DFCHMaps)){assert.equal(store.get('independent',key),null);assert.equal(store.get('continuous',key).totals.completed,1);}
assert.deepEqual(window.DFCHRecords.create({getItem:()=>raw}).snapshot(),store.snapshot());
const snapshot=raw;assert.throws(()=>store.resetMode('wrong'),/未知/);assert.equal(raw,snapshot);
store.resetAll();for(const key of Object.keys(window.DFCHMaps))assert.equal(store.get('continuous',key),null);
console.log('Eleventh-map 1,100 runs, physical-trap immunity policy, flags/caps and all-map reset isolation passed');

assert.equal(d.referenceDungeon.gameModeType,3);assert.equal(d.rewardMasters.find(r=>r.rewardId===105000001).name,'黑膽石');
for(const [id,weight] of [[300,5],[301,3],[302,2],[303,1]]){
 const e=S.create(d,config).basePool.find(e=>e.logEventId===id);assert.equal(e.weight,weight);assert.equal(e.eventType,6);
 assert.deepEqual(e.rows.map(r=>r.functionType),[111,100,5]);
}
for(const row of d.completionRewards)for(const rate of [row.requiredCompletionRate-.001,row.requiredCompletionRate]){
 const ctx=S.create(d,{...config,completionRate:rate});
 if(row.rewardType===5)assert.equal(ctx.basePool.some(e=>e.rows.some(s=>s.functionType===7 && s.args[0]===row.referenceId)),rate>=row.requiredCompletionRate);
}
const held=S.create(d,{...config,saved:{flags:[6612]}});assert.equal(window.DFCHEventPool.eligible(held.basePool.find(e=>e.name==='搜尋巨大迷宮下層地點'),held),false);
assert.ok(S.run(d,{...config,saved:{flags:[6612]}}).saved.flags.includes(6612));
assert.equal(S.run(d,{...config,stamina:window.DFCHStamina.configure('manual',1)}).endReason,'stamina');
console.log('Eleventh-map mode 3 currency/chests, four traps, threshold gates and lower-map flag carry-over passed');
