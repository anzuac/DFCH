const assert=require('node:assert/strict');global.window={};
for(const m of ['map-data','random','lottery','event-state','drop-state','stamina','expedition-rules','simulation-runtime','event-pool','simulator','simulation-batch','records'])require('../'+m+'.js');
const d=window.DFCHMaps.stage_snow,S=window.DFCHSimulator,config={seed:42,multiplier:2,completionRate:0,stamina:window.DFCHStamina.configure('unlimited')};
assert.equal(d.master.duration,28800);assert.equal(d.master.depth,600);
for(const [id,weight,cost] of [[351,15,10],[352,3,20]]){
 assert.equal(d.eventSamples.find(r=>r.logEventId===id).weight,weight);
 assert.deepEqual(d.eventSequences.filter(r=>r.logEventId===id).map(r=>r.functionType),[101,100,5]);
 const manual=S.create(d,{...config,stamina:window.DFCHStamina.configure('manual',100)}),event=manual.basePool.find(e=>e.logEventId===id);
 manual.currentEvent=event;assert.equal(event.eventType,6);
 const before=manual.random.calls;S.handlers[101](d,manual,event.rows[0]);assert.equal(manual.stamina.current,100-cost);assert.equal(manual.random.calls,before);
 S.handlers[5](d,manual,event.rows[2]);assert.ok(!manual.log.at(-1).text.includes('免除傷害'));
 const unlimited=S.create(d,config);S.handlers[101](d,unlimited,event.rows[0]);assert.equal(unlimited.stamina.current,null);
}
let snow=0,storm=0;
for(const rate of [0,14.9,15,39.9,40,44.9,45,79.9,80,99.9,100])for(let seed=0;seed<100;seed++){
 const r=S.run(d,{...config,seed,completionRate:rate,record:false});assert.equal(r.progress,600);assert.equal(r.bosses,1);assert.equal(r.endReason,'goal');assert.equal(r.configuredDurationSeconds,28800);
 snow+=r.eventCounts['深雪阻行']??0;storm+=r.eventCounts['暴風雪']??0;
}
assert.ok(snow>0 && storm>0);
const c=S.create(d,config);assert.ok(!c.basePool.some(e=>e.name==='搜尋秘石'));
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
console.log('Tenth-map 1,100 runs, snow stamina events, flags/caps and all-map reset isolation passed');

assert.equal(d.referenceDungeon.gameModeType,6);
const rules=window.DFCHExpeditionRules;
assert.deepEqual(rules.convertDrop({rewardId:101000000,dungeonConversion:true},1000,d),{rewardId:105000005,quantity:10000000});
for(const [a,b] of [[2,171],[3,172],[4,173],[5,173]])assert.deepEqual(rules.convertDrop({rewardId:600000000+a,dungeonConversion:true},1,d),{rewardId:600000000+b,quantity:1});
assert.equal(d.rewardMasters.find(r=>r.rewardId===105000005).name,'海藍寶石');
const run=S.run(d,config);assert.ok(run.rewards[105000005]>0);
console.log('Tenth-map event currency, chest remapping, snow stamina and localized rewards passed');

for(const row of d.completionRewards)for(const rate of [row.requiredCompletionRate-0.001,row.requiredCompletionRate]){
 const ctx=S.create(d,{...config,completionRate:rate});
 if(row.rewardType===5)assert.equal(ctx.basePool.some(e=>e.rows.some(s=>s.functionType===7 && s.args[0]===row.referenceId)),rate>=row.requiredCompletionRate);
}
assert.throws(()=>rules.convertDrop({rewardId:101000000,dungeonConversion:true},1,{...d,referenceDungeon:{...d.referenceDungeon,dungeonId:4}}),/貨幣索引/);
assert.equal(S.run(d,{...config,stamina:window.DFCHStamina.configure('manual',1)}).endReason,'stamina');
