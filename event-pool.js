(() => {
  const f=Math.fround;
  const seq=(type,...args)=>({functionType:type,args,strArgs:[]});
  function row(id,type,weight,rows,extra={}) {
    return {logEventSampleId:id,logEventId:id,eventType:type,weight:f(weight),originalWeight:f(weight),
      checkPointProgress:0,isForce:false,isOnce:false,conditionTypes:[],conditionValues:[],rows,...extra};
  }
  function sequence(data,id){return window.DFCHEventState.sequence(data,id);}
  function hasAffection(data,rows) {
    return rows.some(r=>r.functionType===7 && r.args.some(id=>id>0 && data.dropSamples.some(s=>s.dropItemSampleGroupId===id && s.weight>0 && Math.floor(s.rewardId/1000000)===305)));
  }
  function applyAffection(data,pool,ratio) {
    if(ratio<=1)return pool;
    let extra=0,progress=0;
    const boosted=pool.map(r=>{
      if(!r.isForce && r.weight>0 && r.eventType===1)progress=f(progress+r.weight);
      if(!r.isForce && r.weight>0 && r.eventType===4 && hasAffection(data,r.rows)) {
        const weight=f(r.weight*f(ratio));extra=f(extra+f(weight-r.weight));return {...r,weight};
      }
      return r;
    });
    const scale=progress>0?f(1-f(Math.min(Math.max(extra,0),progress)/progress)):1;
    return boosted.map(r=>!r.isForce && r.weight>0 && r.eventType===1?{...r,weight:f(r.weight*scale)}:r);
  }
  function dynamic(data,master,initialRate,flags) {
    const result=[],base=999000000+master.dungeonId*100;
    if(master.basicBattleMonsterGroupId>0)result.push(row(base,2,master.basicBattleWeight,
      [seq(108,master.basicBattleMonsterGroupId,master.basicBattleMinMonsterCount,master.basicBattleMaxMonsterCount),seq(6),seq(100,1),seq(7,master.basicBattleDropSampleGroupId)],{name:'怪物遭遇'}));
    master.basicItemDropSampleGroupIds.forEach((id,i)=>{
      if(id>0 && master.basicItemDropWeights[i]>0)result.push(row(base+20+i,4,master.basicItemDropWeights[i],[seq(100,1),seq(7,id)],{name:Math.floor(id/100000)===9?'鑽石礦脈採集':hasAffection(data,[seq(7,id)])?'尋找羈絆道具':'沿路尋寶'}));
    });
    master.basicFlagUnlockSampleGroupIds.forEach((id,i)=>{
      const prerequisite=master.basicFlagUnlockConditions[i];
      if(id>0 && master.basicFlagUnlockWeights[i]>0 && (prerequisite===-1 || flags.includes(prerequisite))) {
        const unlock=data.flagUnlockSamples.find(r=>r.flagUnlockEventSampleGroupId===id && r.flagType!==-1)?.flagType??-1;
        result.push(row(base+50+i,10,master.basicFlagUnlockWeights[i],[seq(100,1),seq(11,id)],{name:master.key==='stage_atli'?'搜尋決戰魔王地點':master.key==='stage_labyrinth_1'?'搜尋巨大迷宮下層地點':'搜尋秘石',conditionTypes:[9],conditionValues:[unlock]}));
      }
    });
    if(master.bossBattleGroupId>0)result.push(row(base+1,2,0,[seq(1),seq(108,master.bossBattleGroupId),seq(6),seq(100,1),seq(9,master.multiDropContinuousRate,...master.bossDropSampleGroupIds.filter(id=>id>0))],{name:'終點首領',isForce:true,isOnce:true,checkPointProgress:master.depth,boss:true}));
    let dropIndex=0,battleIndex=0;
    if(master.dungeonId===data.master.dungeonId)for(const reward of data.completionRewards) {
      if(reward.requiredCompletionRate>initialRate)continue;
      if(reward.rewardType===5)result.push(row(base+40+dropIndex++,4,reward.value>0?reward.value:1,[seq(100,1),seq(7,reward.referenceId)],{name:'探索解鎖尋寶'}));
      if(reward.rewardType===3)result.push(row(base+30+battleIndex++,2,reward.value>0?reward.value:1,[seq(108,reward.referenceId),seq(6),seq(100,1),seq(7,reward.referenceId2)],{name:'探索解鎖怪物'}));
    }
    return result;
  }
  function build(data,context,master=data.master,includeGlobal=true) {
    let pool=includeGlobal?data.eventSamples.filter(r=>r.limitedDungeonId===-1 || r.limitedDungeonId===master.dungeonId).map(r=>{
      const rows=sequence(data,r.logEventId);
      const type=rows.some(s=>s.functionType===109)?9:rows.some(s=>s.functionType===104)?5:rows.some(s=>s.functionType===3)?3:rows.some(s=>[111,112].includes(s.functionType)) || rows.some(s=>s.functionType===5)?6:1;
      const name={1:'步行',2:'快速步行',3:'休息',200:'小幅探索',201:'探索',202:'深入探索',901:'發現鑽石礦脈',351:'深雪阻行',352:'暴風雪',350:'毒霧陷阱',300:'物理陷阱',301:'強力物理陷阱',302:'重型物理陷阱',303:'毒物陷阱',304:'火焰陷阱'}[r.logEventId]??'地圖事件';
      return {...r,eventType:type,originalWeight:f(r.weight),rows,name};
    }):[];
    pool.push(...dynamic(data,master,context.exploration.initialCompletionRate,context.drops.flags));
    // The current UI provides collector abilities only, none of which unlock
    // these templates. Do not silently activate a template or invent HP input.
    for(const template of data.conditionalTemplates)if(template.requiredAbilities.some(id=>id>0 && context.abilityIds.includes(id)))throw new Error('此能力的角色狀態尚未提供，無法啟用專屬事件');
    return applyAffection(data,pool,context.affectionRatio);
  }
  function conditions(r,c) {
    return r.conditionTypes.every((type,i)=>{
      const value=r.conditionValues[i];
      switch(type) {
        case 0:return true;
        case 1:case 2:case 4:case 6:throw new Error('此條件需要尚未提供的角色狀態');
        case 3:return c.stamina.mode==='manual' && f(f(c.stamina.current/c.stamina.maximum)*100)<value;
        case 5:return c.progress>=value;
        case 7:return c.stamina.mode==='unlimited' || f(f(c.stamina.current/c.stamina.maximum)*100)>=value;
        case 8:return c.exploration.completionRate>=value;
        case 9:return value===-1 || !(c.drops.flags.includes(value)||c.drops.pendingFlags.includes(value));
        default:throw new Error('未知事件條件');
      }
    });
  }
  function eligible(r,c) {
    return !(r.isOnce && c.once.has(r.logEventSampleId)) && conditions(r,c) &&
      !(r.eventType===9 && c.exploration.completionRate>=100) && !(r.eventType===5 && (c.zone || c.drops.limitReached));
  }
  function active(c) {
    return c.zone?[...c.basePool,...c.zonePool]:c.basePool;
  }
  function choose(c) {
    const pool=active(c),forced=pool.filter(r=>r.isForce && eligible(r,c) && r.checkPointProgress<=c.progress);
    const key=c.zone?'merged':'base';
    const weights=pool.map(r=>eligible(r,c) && !r.isForce?r.weight:0);
    const old=c.tables[key];
    const table=old && old.weights.length===weights.length?window.DFCHLottery.updateWeights(old,weights):window.DFCHLottery.build(weights);
    c.tables[key]=table;
    return window.DFCHLottery.choose(pool,table,()=>c.sample('事件抽選'),forced);
  }
  function checkpoint(c,delta) {
    return window.DFCHExpeditionRules.nextForceCheckpoint(c.progress,delta,active(c).filter(r=>eligible(r,c)));
  }
  window.DFCHEventPool=Object.freeze({build,dynamic,applyAffection,conditions,eligible,active,choose,checkpoint});
})();
