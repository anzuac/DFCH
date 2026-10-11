const assert=require('node:assert/strict');global.window={};
for(const m of ['map-data','random','lottery','event-state','drop-state','stamina','expedition-rules','simulation-runtime','event-pool','simulator','simulation-batch','records'])require('../'+m+'.js');
const d=window.DFCHMaps.stage_labyrinth_2,S=window.DFCHSimulator,config={seed:42,multiplier:2,completionRate:0,stamina:window.DFCHStamina.configure('unlimited')};
assert.equal(d.master.duration,43200);assert.equal(d.master.depth,1200);assert.equal(d.eventSamples.find(r=>r.logEventId===300).weight,5);
assert.deepEqual(d.eventSequences.filter(r=>r.logEventId===300).map(r=>r.functionType),[111,100,5]);
assert.throws(()=>S.create({...d,simulationPolicy:{...d.simulationPolicy,trapDamage:'official'}},config),/陷阱/);
let traps=0;
for(const rate of [0,29.9,30,44.9,45,69.9,70,79.9,80,99.9,100])for(let seed=0;seed<100;seed++){
 const r=S.run(d,{...config,seed,completionRate:rate,record:false});assert.equal(r.progress,1200);assert.equal(r.bosses,1);assert.equal(r.endReason,'goal');assert.equal(r.trapDamagePolicy,'immune');traps+=r.eventCounts['物理陷阱']??0;
}
assert.ok(traps>0);
const c=S.create(d,config),trap=c.basePool.find(e=>e.logEventId===300);assert.equal(trap.eventType,6);assert.equal(trap.name,'物理陷阱');
const before=c.random.calls;S.handlers[111](d,c);assert.equal(c.random.calls,before);assert.ok(c.log.some(r=>r.text.includes('免除單體陷阱傷害')));
assert.equal(d.master.stoneFlag,0);assert.ok(!c.basePool.some(e=>e.name==='搜尋秘石'));
assert.equal(c.basePool.find(e=>e.logEventId===301).weight,3);
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
console.log('Twelfth-map 1,100 runs, physical-trap immunity policy, flags/caps and all-map reset isolation passed');

assert.equal(d.referenceDungeon.gameModeType,3);
assert.equal(d.eventSamples.find(e=>e.logEventId===360).weight,1);
assert.deepEqual(d.eventSequences.filter(e=>e.logEventId===360).map(e=>e.functionType),[112,100,5]);
const calls=c.random.calls;S.handlers[112](d,c);assert.equal(c.random.calls,calls);
const rules=window.DFCHExpeditionRules;
assert.deepEqual(rules.convertDrop({rewardId:101000000,dungeonConversion:true},1000,d),{rewardId:105000001,quantity:3000});
for(const [a,b] of [[2,19],[3,20],[4,21],[5,23]])assert.deepEqual(rules.convertDrop({rewardId:600000000+a,dungeonConversion:true},1,d),{rewardId:600000000+b,quantity:1});
assert.equal(d.rewardMasters.find(r=>r.rewardId===105000001).name,'黑膽石');
const run=S.run(d,config);assert.ok(run.rewards[105000001]>0);
console.log('Twelfth-map event currency, chest remapping, all-party poison immunity and localized rewards passed');

for(const row of d.completionRewards)for(const rate of [row.requiredCompletionRate-0.001,row.requiredCompletionRate]){
 const ctx=S.create(d,{...config,completionRate:rate});
 if(row.rewardType===5)assert.equal(ctx.basePool.some(e=>e.rows.some(s=>s.functionType===7 && s.args[0]===row.referenceId)),rate>=row.requiredCompletionRate);
}
assert.throws(()=>rules.convertDrop({rewardId:101000000,dungeonConversion:true},1,{...d,referenceDungeon:{...d.referenceDungeon,dungeonId:4}}),/貨幣索引/);
assert.equal(S.run(d,{...config,stamina:window.DFCHStamina.configure('manual',1)}).endReason,'stamina');

for(const [id,weight] of [[300,5],[301,3],[302,3],[303,2],[304,1],[360,1]])assert.equal(c.basePool.find(e=>e.logEventId===id).weight,weight);
assert.ok(d.monsterSamples.filter(r=>r.battleEventId===300490).every(r=>r.isForceAppear));
assert.equal(d.monsterSamples.filter(r=>r.battleEventId===300490).length,4);
