(() => {
  const KEY='dfch-expedition-records-v1',modes=['independent','continuous'],copy=x=>JSON.parse(JSON.stringify(x));
  const empty=()=>({schema:1,modes:{independent:{},continuous:{}}});
  function validate(s){
    if(s?.schema!==1||!s.modes)throw new Error('不支援此存檔格式');
    for(const mode of modes){if(!s.modes[mode]||typeof s.modes[mode]!=='object'||Array.isArray(s.modes[mode]))throw new Error('存檔模式格式錯誤');
      for(const [key,r] of Object.entries(s.modes[mode])){
        if(!['stage_1','stage_2','stage_3','stage_4','stage_5'].includes(key)||r.mode!==mode||!r.totals)throw new Error('存檔地圖格式錯誤');
        const a=r.totals;
        for(const k of ['completed','goals','exhausted','steps','battles','bosses','randomCalls','ordinaryDiamonds','godDiamonds','affection','affectionRuns','highRuns','capStartRuns','capEndRuns','capCrossRuns'])if(!Number.isSafeInteger(a[k])||a[k]<0)throw new Error('存檔統計數量錯誤');
        if(a.goals+a.exhausted!==a.completed||a.affectionRuns>a.completed||a.highRuns>a.completed)throw new Error('統計輪數不一致');
        for(const n of [5000,7777,9999])if(!Number.isSafeInteger(a.highDiamonds?.[n])||a.highDiamonds[n]<0)throw new Error('高額鑽石紀錄錯誤');
        for(const k of ['quantities','rewardRuns','highDiamonds','eventCounts']){if(!a[k]||typeof a[k]!=='object'||Array.isArray(a[k]))throw new Error('存檔統計格式錯誤');for(const n of Object.values(a[k]))if(!Number.isSafeInteger(n)||n<0)throw new Error('存檔數量錯誤');}
        if(!r.latest||!Number.isFinite(r.latest.completionRate)||r.latest.completionRate<0||r.latest.completionRate>100)throw new Error('探索狀態錯誤');
        if(!r.latest.saved||(!r.latest.saved.owned||typeof r.latest.saved.owned!=='object'||Array.isArray(r.latest.saved.owned))||!Array.isArray(r.latest.saved.flags)||!Number.isSafeInteger(r.latest.saved.daily))throw new Error('承接狀態錯誤');
        window.DFCHDropState.begin(window.DFCHMaps?.[key]??window.DFCHMapData,r.latest.saved);
      }
    }return s;
  }
  function create(storage){
    let state=empty(),error=null,expectedRaw=null;
    try{const raw=storage.getItem(KEY);expectedRaw=raw;if(raw)state=validate(JSON.parse(raw));}catch(e){error=`讀取存檔失敗：${e.message}。請先匯出或處理原存檔；未覆寫原資料。`;}
    function persist(next){if(error)throw new Error(error);validate(next);if(storage.getItem(KEY)!==expectedRaw)throw new Error('存檔已被另一分頁修改，請重新載入後再執行');const raw=JSON.stringify(next);storage.setItem(KEY,raw);expectedRaw=raw;state=next;}
    return {
      get error(){return error;},snapshot:()=>copy(state),get:(mode,key)=>copy(state.modes[mode]?.[key]??null),
      add(mode,data,result,config){
        const next=copy(state);let record=next.modes[mode][data.master.key];
        if(!record)record=next.modes[mode][data.master.key]={name:data.name,mode,totals:window.DFCHSimulationBatch.aggregate(0,mode),latest:null};
        window.DFCHSimulationBatch.add(record.totals,result);record.totals.first=null;record.totals.last=null;
        record.latest={seed:result.seed,completionRate:result.completionRate,saved:result.saved,progress:result.progress,endReason:result.endReason};
        record.config=copy(config);record.updatedAt=new Date().toISOString();persist(next);
      },
      setDaily(mode,key,n){if(!Number.isSafeInteger(n)||n<0)throw new Error('當日鑽石須為非負整數');const next=copy(state);if(!next.modes[mode][key])throw new Error('此模式尚無紀錄');next.modes[mode][key].latest.saved.daily=n;persist(next);},
      reset(mode,key){const next=copy(state);delete next.modes[mode][key];persist(next);},
      resetMode(mode){if(!modes.includes(mode))throw new Error('未知紀錄類型');const next=copy(state);next.modes[mode]={};persist(next);},
      resetAll(){storage.removeItem(KEY);state=empty();expectedRaw=null;error=null;},
      import(input){const next=validate(JSON.parse(input));const raw=JSON.stringify(next);storage.setItem(KEY,raw);expectedRaw=raw;state=copy(next);error=null;},
      export:()=>storage.getItem(KEY)??JSON.stringify(state)
    };
  }
  window.DFCHRecords=Object.freeze({create,validate,KEY});
})();
