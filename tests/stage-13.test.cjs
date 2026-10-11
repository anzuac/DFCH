const assert=require('node:assert/strict');global.window={};
for(const m of ['map-data','random','lottery','event-state','drop-state','stamina','expedition-rules','simulation-runtime','event-pool','simulator','simulation-batch','records'])require('../'+m+'.js');
const d=window.DFCHMaps.stage_satan,S=window.DFCHSimulator,config={seed:42,multiplier:2,completionRate:0,stamina:window.DFCHStamina.configure('unlimited')};
assert.equal(d.master.duration,3600);assert.equal(d.master.depth,10);assert.equal(d.master.basicBattleMonsterGroupId,0);assert.equal(d.master.basicBattleWeight,0);
const c=S.create(d,config);assert.ok(!c.basePool.some(e=>e.name==='怪物遭遇'));assert.ok(!c.basePool.some(e=>e.eventType===10));
assert.ok(c.basePool.some(e=>e.name==='尋找羈絆道具' && e.rows.some(r=>r.args.includes(900070))));assert.ok(!c.basePool.some(e=>e.name==='鑽石礦脈採集'));
assert.equal(d.monsterSamples.length,5);assert.ok(d.monsterSamples.every(r=>r.isForceAppear));assert.equal(d.monsterSamples.filter(r=>r.monsterId===28).length,2);
const convert=window.DFCHExpeditionRules.convertDrop;
assert.deepEqual(convert({rewardId:101000000,dungeonConversion:true},7,d),{rewardId:117000000,quantity:21});
for(const [a,b] of [[2,80],[3,81],[4,82],[5,83]])assert.deepEqual(convert({rewardId:600000000+a,dungeonConversion:true},2,d),{rewardId:600000000+b,quantity:2});
for(const rate of [0,19.9,20,39.9,40,69.9,70,89.9,90,99.9,100])for(let seed=0;seed<100;seed++){
 const r=S.run(d,{...config,seed,completionRate:rate});assert.equal(r.progress,10);assert.equal(r.bosses,1);assert.equal(r.battles,1);assert.equal(r.endReason,'goal');assert.equal(r.combatDurationSeconds,0);
 const battle=r.log.find(l=>l.monsters);assert.deepEqual(battle.monsters,[28,23,28,27,29]);
}
const groups=new Set(d.dropSamples.map(r=>r.dropItemSampleGroupId));for(const id of [900090,900095,80])assert.ok(groups.has(id));
for(let seed=0;seed<100;seed++){
 const owned=Object.fromEntries(d.rewardMasters.filter(r=>d.master.limitedRewardIds.includes(r.rewardId)).map(r=>[r.rewardId,r.maxLevel]));
 const r=S.run(d,{...config,seed,completionRate:100,saved:{daily:500,owned},record:false});assert.equal(r.ordinaryDiamonds,0);for(const id of d.master.limitedRewardIds)assert.equal(r.rewards[id],undefined);
}
assert.equal(S.run(d,{...config,stamina:window.DFCHStamina.configure('manual',1)}).endReason,'stamina');
let raw=null;const store=window.DFCHRecords.create({getItem:()=>raw,setItem:(k,v)=>raw=v,removeItem:()=>raw=null});
for(const map of Object.values(window.DFCHMaps))for(const mode of ['independent','continuous'])store.add(mode,map,S.run(map,config),config);
store.resetMode('independent');for(const key of Object.keys(window.DFCHMaps)){assert.equal(store.get('independent',key),null);assert.equal(store.get('continuous',key).totals.completed,1);}
assert.deepEqual(window.DFCHRecords.create({getItem:()=>raw}).snapshot(),store.snapshot());store.resetAll();assert.equal(store.get('continuous','stage_satan'),null);
console.log('Thirteenth-map 1,100 runs, boss-only encounter, duplicate forced monsters, reward conversion, caps and thirteen-map record isolation passed');
