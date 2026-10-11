(() => {
  const f=Math.fround,Pool=window.DFCHEventPool,DS=window.DFCHDropState,ES=window.DFCHEventState,Rules=window.DFCHExpeditionRules;
  const indexes=new WeakMap();
  function indexed(data) {
    if(indexes.has(data))return indexes.get(data);
    const group=(rows,key)=>{const out=new Map();for(const r of rows){if(!out.has(r[key]))out.set(r[key],[]);out.get(r[key]).push(r);}return out;};
    const index={drops:group(data.dropSamples,'dropItemSampleGroupId'),effects:group(data.dropEffects,'dropEffectGroupId'),monsters:group(data.monsterSamples,'battleEventId'),flags:group(data.flagUnlockSamples,'flagUnlockEventSampleGroupId'),monsterNames:new Map(data.monsterNames.map(r=>[r.index,r.name]))};
    indexes.set(data,index);return index;
  }
  const unsupported=()=>{throw new Error('目前隊伍未提供此事件所需的角色能力、生命或恢復值；停止執行以避免推測結果。');};
  function validate(data,options) {
    if(data.gameVersion!=='3.16.0'||![1001,1002,1003,1004,1005,1006,2001,2002,3001,3002,3003,3004,9000].includes(data.master.dungeonId))throw new Error('目前只支援已核對的十三張地圖。');
    if(!(Number.isFinite(options.multiplier)&&options.multiplier>=.8&&Number.isFinite(f(options.multiplier))))throw new Error('請填妥有效隊伍速度。');
    const collectors=new Set(data.collectorMasters.map(m=>m.rewardId));
    if((options.abilityIds??[]).some(id=>!collectors.has(id)))throw new Error('目前只開放已接入的收集家能力；其他專屬事件尚缺角色狀態輸入。');
    if(!(Number.isFinite(options.affectionRatio??1)&&(options.affectionRatio??1)>=1))throw new Error('羈絆配置無效。');
    if(!options.stamina?.ready)throw new Error(options.stamina?.error??'耐力配置無效。');
  }
  function create(data,options) {
    validate(data,options);
    const c=window.DFCHSimulationRuntime.initialize(data,options);
    Object.assign(c,{index:indexed(data),multiplier:f(options.multiplier),affectionRatio:f(options.affectionRatio??1),abilityIds:[...(options.abilityIds??[])],once:new Set(),tables:{},zone:null,zonePool:[],monsterInfo:null,steps:0,battles:0,bosses:0,log:[],trace:[],record:options.record!==false,eventCounts:{},rewardHits:{},ordinaryDiamonds:0,godDiamonds:0,highDiamonds:{5000:0,7777:0,9999:0},dailyStart:c.drops.daily,completionStart:c.exploration.completionRate});
    c.sample=label=>{const before=c.random.calls,value=c.random.nextDouble();if(c.record)c.trace.push({label,call:before+1,value});return value;};
    c.integer=(min,max,label)=>{const before=c.random.calls,value=c.random.next(min,max);if(c.record)c.trace.push({label,call:before+1,consumed:c.random.calls-before,min,max,value});return value;};
    c.drawRows=(rows,weights,label)=>{
      if(!rows.length || !weights.some(w=>w>0))return null;
      return rows[window.DFCHLottery.draw(window.DFCHLottery.build(weights),()=>c.sample(label))];
    };
    c.basePool=Pool.build(data,c);
    if(c.basePool.some(e=>e.rows.some(r=>[111,112].includes(r.functionType)))&&data.simulationPolicy.trapDamage!=='immune')throw new Error('陷阱傷害尚未提供角色狀態，無法執行');
    c.emit=(kind,text,extra={})=>{if(c.record)c.log.push({step:c.steps,kind,text,progress:c.progress,completionRate:c.exploration.completionRate,stamina:c.stamina.current,...extra});};
    // Validate every reachable serialized/dynamic function before mutating state.
    for(const r of c.basePool)for(const s of r.rows)if(!implemented.has(s.functionType))throw new Error(`事件 ${r.name} 的處理尚未支援`);
    return c;
  }
  function roll(data,c,groupIds,suppressOrdinary=true) {
    // Group order and row order are both preserved, including zero-weight rows.
    const rows=groupIds.filter(id=>id>0).flatMap(id=>c.index.drops.get(id)??[]);
    const bonus=ES.currentBonus(c.exploration,data,6);
    const weights=rows.map(r=>{
      if(DS.artifactFull(r,c.drops,data)||suppressOrdinary&&c.drops.limitReached&&DS.ordinaryDiamond(r))return 0;
      let weight=f(r.weight);
      if(data.master.limitedRewardIds.includes(r.rewardId))weight=f(f(weight*f(100+bonus))/100);
      return weight;
    });
    const row=c.drawRows(rows,weights,'掉落樣本');
    if(!row)return null;
    let quantity=row.minValue;
    // max<1 bypasses Random entirely; max==min>0 still calls Next.
    if(row.maxValue>=1)quantity=c.integer(row.minValue,row.maxValue+1,'掉落數量');
    const effects=c.index.effects.get(row.dropEffectGroupId)??[];
    const effect=row.dropEffectGroupId>0?c.drawRows(effects,effects.map(r=>r.weight),'掉落演出'):null;
    return {row,quantity,effect};
  }
  function itemDrop(data,c,groupIds) {
    const ids=groupIds.filter(id=>id>0);
    const basic=ids.length>0&&ids.every(id=>data.master.basicItemDropSampleGroupIds.some((n,i)=>n===id&&data.master.basicItemDropWeights[i]>0));
    let drop=roll(data,c,ids,!basic);
    if(drop && basic && c.drops.limitReached && DS.ordinaryDiamond(drop.row)) {
      // First quantity/effect draws have already occurred; reroll does not rewind.
      const groups=DS.fallbackGroups(data,c.affectionRatio);
      const group=c.drawRows(groups,groups.map(r=>r.weight),'鑽石上限重抽群組');
      drop=group?roll(data,c,[group.id],true):null;
    }
    register(data,c,drop);return drop;
  }
  function register(data,c,drop) {
    if(!drop){c.emit('drop','沒有可抽選掉落');return;}
    const {row,effect}=drop;
    if(row.rewardId<0||drop.quantity<=0){c.emit('drop','此次沒有收穫',{sampleId:row.dropItemSampleId,effectId:effect?.dropEffectSampleId});return;}
    let quantity=drop.quantity;
    if(row.rewardId===101000000) {
      const bonus=ES.currentBonus(c.exploration,data,1);
      if(bonus>0)quantity=Math.ceil(f(f(1+f(bonus/100))*f(quantity)));
    }
    const converted=Rules.convertDrop(row,quantity,data);
    c.drops=DS.register(c.drops,{...row,rewardId:converted.rewardId},converted.quantity,data);
    if(DS.ordinaryDiamond(row))c.ordinaryDiamonds+=converted.quantity;
    else if(Math.floor(row.rewardId/1000000)===102){c.godDiamonds+=converted.quantity;if(Object.hasOwn(c.highDiamonds,drop.quantity))c.highDiamonds[drop.quantity]++;}
    c.rewardHits[converted.rewardId]=(c.rewardHits[converted.rewardId]??0)+1;
    const name=data.rewardMasters.find(m=>m.rewardId===converted.rewardId)?.name??row.rewardName??'獎勵';
    c.emit('drop',`${name} ×${converted.quantity}`,{rewardId:converted.rewardId,quantity:converted.quantity,sampleId:row.dropItemSampleId,effectId:effect?.dropEffectSampleId});
  }
  function multiDrop(data,c,args) {
    const p=f(args[0]),ids=args.slice(1).filter(id=>id>0),minimum=Rules.minimumMultiDropRolls(p);
    if(minimum===null)throw new Error('連續掉落參數無效');
    let count=0;
    for(;;) {
      if(count>=100000)throw new Error('連續掉落超過執行保護上限，未結算此輪');
      const drop=roll(data,c,ids,true);if(!drop)break;
      register(data,c,drop);count++;
      if(count>=minimum && !(f(c.sample('連續掉落判定'))<p))break;
    }
    c.emit('multi',`首領連續抽選 ${count} 次`,{rolls:count});
  }
  function progress(data,c,argument,bypass=false) {
    const delta=ES.progressDelta(argument,c.multiplier,bypass,()=>c.sample('小數移動進度'));
    const checkpoint=Pool.checkpoint(c,delta);
    const before=c.progress;
    c.progress=Math.min(data.master.depth,checkpoint===null?before+delta:checkpoint);
    c.emit('progress',`移動 ${c.progress-before}，目前 ${c.progress}／${data.master.depth}`,{delta:c.progress-before});
  }
  function flag(data,c,groupId) {
    const rows=DS.flagPool(c.index.flags.get(groupId)??[],c.drops);
    const selected=c.drawRows(rows,rows.map(r=>r.weight),'秘石解鎖樣本');
    if(!selected)return;
    const effects=c.index.effects.get(selected.dropEffectGroupId)??[];
    const effect=c.drawRows(effects,effects.map(r=>r.weight),'秘石發現演出');
    c.drops=DS.unlock(c.drops,selected.flagType);
    c.emit('flag',selected.flagType===-1?'地點搜尋沒有收穫':selected.flagType===6613?'發現決戰魔王的遠征地點':selected.flagType===6612?'發現巨大迷宮探索下層的遠征地點':'發現秘石，解鎖新的遠征地點',{flag:selected.flagType,effectId:effect?.dropEffectSampleId});
  }
  function battle(data,c) {
    if(!c.monsterInfo)throw new Error('遭遇事件缺少怪物群組');
    const {group,min,max}=c.monsterInfo,rows=c.index.monsters.get(group)??[];
    const forced=rows.filter(r=>r.isForceAppear),ordinary=rows.filter(r=>!r.isForceAppear);
    // Official calls Next(min,max), even for forced-only groups with 0,0.
    const desired=c.integer(min,max,'怪物數量');
    const monsters=[...forced];
    for(let i=forced.length;i<desired;i++) {
      const selected=c.drawRows(ordinary,ordinary.map(r=>r.weight),'怪物種類');
      if(!selected)throw new Error('怪物池沒有可抽選候選');monsters.push(selected);
    }
    c.battles++;if(c.currentEvent.boss)c.bosses++;
    const names=monsters.map(r=>c.index.monsterNames.get(r.monsterId)??'怪物');
    c.emit('battle',`${c.currentEvent.boss?'首領遭遇':'遭遇'}：${names.join('、')}。秒殺勝利，戰鬥耗時 0 秒。`,{monsters:monsters.map(r=>r.monsterId),durationSeconds:0});
  }
  function zone(data,c,id) {
    const buff=data.buffs.find(r=>r.buffId===id),effect=data.buffEffects.find(r=>r.buffId===id&&r.effectType===2),master=data.zoneDungeons.find(r=>r.dungeonId===effect?.value1);
    if(!buff||!master)throw new Error('缺少官方區域資料');
    c.zone={buff,start:c.progress};c.zonePool=Pool.build(data,c,master,false);delete c.tables.merged;
    c.emit('zone','發現鑽石礦脈，基本池與礦脈池合併');
  }
  const handlers={
    1:(d,c)=>c.emit('message',c.currentEvent.boss?'抵達終點首領':'地圖訊息'),
    2:(d,c)=>c.emit('walk','隊伍繼續前進'),
    3:(d,c)=>c.emit('rest','隊伍休息'),
    4:(d,c)=>c.emit('zone','鑽石礦脈事件'),
    5:(d,c,r)=>c.emit('trap',[351,352].includes(c.currentEvent?.logEventId)?(d.localization['expedition-trap-'+r.flavorKey]??'雪地事件：消耗耐力').replace(/<[^>]+>/g,''):'陷阱事件：本模擬設定免除傷害'),
    6:(d,c)=>battle(d,c),
    7:(d,c,r)=>itemDrop(d,c,r.args),
    8:unsupported,
    9:(d,c,r)=>multiDrop(d,c,r.args),
    10:(d,c)=>c.emit('exploration',`探索率 ${c.exploration.completionRate.toFixed(3)}%`),
    11:(d,c,r)=>flag(d,c,r.args[0]),
    100:(d,c,r)=>progress(d,c,r.args[0],Boolean(r.args[1])),
    101:(d,c,r)=>{c.stamina=window.DFCHStamina.change(c.stamina,-f(r.args[0]));c.emit('stamina',`消耗耐力 ${r.args[0]}`);},
    // With instant victory and no enabled damage templates, all units remain at
    // full HP: recovery does not change state or consume expedition RNG.
    102:(d,c)=>c.emit('hp','休息恢復生命（本配置角色生命保持全滿）'),
    103:unsupported,
    104:(d,c,r)=>zone(d,c,r.args[0]),
    105:unsupported,
    106:(d,c,r)=>{if(c.stamina.mode==='manual')c.stamina=window.DFCHStamina.change(c.stamina,-f(f(c.stamina.maximum)*f(r.args[0]/100)));},
    107:()=>{}, // Official Warp.Execute is an empty completed task.
    108:(d,c,r)=>{c.monsterInfo={group:r.args[0],min:r.args[1]??0,max:r.args[2]??0};},
    109:(d,c,r)=>{c.exploration=ES.explore(c.exploration,r.args[0],d);},
    110:(d,c,r)=>{c.stamina=window.DFCHStamina.change(c.stamina,r.args[0]);c.emit('stamina',`恢復耐力 ${r.args[0]}`);},
    111:(d,c)=>{if(d.simulationPolicy.trapDamage!=='immune')unsupported();c.emit('trap','免除單體陷阱傷害（使用者指定假設；略過原版傷害與選擇目標亂數）');},
    112:(d,c)=>{if(d.simulationPolicy.trapDamage!=='immune')unsupported();c.emit('trap','全隊免受陷阱傷害（使用者指定假設；略過原版傷害亂數）');}
  };
  const implemented=new Set(Object.entries(handlers).filter(([,fn])=>fn!==unsupported).map(([type])=>Number(type)));
  function step(data,c) {
    if(c.endReason)return false;
    if(c.steps>=100000)throw new Error('事件超過執行保護上限，未結算此輪');
    const event=Pool.choose(c);c.currentEvent=event;c.steps++;
    if(event.isOnce)c.once.add(event.logEventSampleId);
    c.eventCounts[event.name]=(c.eventCounts[event.name]??0)+1;
    c.emit('event',event.name,{eventId:event.logEventId,rngStart:c.random.calls});
    for(const r of event.rows)handlers[r.functionType](data,c,r);
    // End reason is computed before the official depth-duration buff update.
    if(window.DFCHStamina.exhausted(c.stamina))c.endReason='stamina';
    else if(c.progress>=data.master.depth && !Pool.active(c).some(r=>r.isForce && r.checkPointProgress<=c.progress && Pool.eligible(r,c)))c.endReason='goal';
    if(c.zone && ES.zoneExpired(c.zone.start,c.progress,c.zone.buff)) {
      c.emit('zone-end','鑽石礦脈採集結束');c.zone=null;c.zonePool=[];delete c.tables.merged;
    }
    return !c.endReason;
  }
  function result(data,c) {
    if(!c.endReason)throw new Error('遠征尚未結束，不能結算');
    return {seed:c.seed,endReason:c.endReason,progress:c.progress,depth:data.master.depth,completionStart:c.completionStart,completionRate:c.exploration.completionRate,stamina:c.stamina.current,steps:c.steps,battles:c.battles,bosses:c.bosses,rewards:{...c.drops.pending},rewardHits:{...c.rewardHits},ordinaryDiamonds:c.ordinaryDiamonds,godDiamonds:c.godDiamonds,highDiamonds:{...c.highDiamonds},dailyStart:c.dailyStart,limitReachedAtStart:c.drops.limitReached,limitReachedAtEnd:c.drops.daily>=data.master.dailyDiamondLimit,unlockedFlags:[...c.drops.pendingFlags],saved:DS.commit(c.drops),randomCalls:c.random.calls,eventCounts:{...c.eventCounts},log:c.log,trace:c.trace,configuredDurationSeconds:data.master.duration,combatDurationSeconds:0,trapDamagePolicy:data.simulationPolicy.trapDamage??'not-applicable'};
  }
  function run(data,options) {
    const c=create(data,options);while(step(data,c)){}return result(data,c);
  }
  window.DFCHSimulator=Object.freeze({validate,create,step,result,run,roll,itemDrop,multiDrop,handlers,implemented:[...implemented]});
})();
