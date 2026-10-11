(() => {
  const S=window.DFCHSimulator;
  function aggregate(requested,mode) {
    return {requested,mode,completed:0,goals:0,exhausted:0,steps:0,battles:0,bosses:0,randomCalls:0,ordinaryDiamonds:0,godDiamonds:0,affection:0,affectionRuns:0,highDiamonds:{5000:0,7777:0,9999:0},highRuns:0,capStartRuns:0,capEndRuns:0,capCrossRuns:0,quantities:{},rewardRuns:{},eventCounts:{},first:null,last:null,cancelled:false};
  }
  function add(a,r) {
    a.completed++;a.goals+=r.endReason==='goal'?1:0;a.exhausted+=r.endReason==='stamina'?1:0;
    for(const key of ['steps','battles','bosses','randomCalls','ordinaryDiamonds','godDiamonds'])a[key]+=r[key];
    for(const id of [5000,7777,9999])a.highDiamonds[id]+=r.highDiamonds?.[id]??0;
    a.highRuns+=Object.values(r.highDiamonds??{}).some(n=>n>0)?1:0;
    a.capStartRuns+=r.limitReachedAtStart?1:0;a.capEndRuns+=r.limitReachedAtEnd?1:0;
    a.capCrossRuns+=!r.limitReachedAtStart&&r.limitReachedAtEnd?1:0;
    let affection=0;
    for(const [id,n] of Object.entries(r.rewards)) {
      a.quantities[id]=(a.quantities[id]??0)+n;a.rewardRuns[id]=(a.rewardRuns[id]??0)+1;
      if(Math.floor(Number(id)/1000000)===305)affection+=n;
    }
    a.affection+=affection;a.affectionRuns+=affection>0?1:0;
    for(const [name,n] of Object.entries(r.eventCounts))a.eventCounts[name]=(a.eventCounts[name]??0)+n;
    if(!a.first)a.first=r;a.last=r;return a;
  }
  async function run(data,options,{count=1,mode='independent',signal,onProgress=()=>{},onResult=()=>{}}={}) {
    if(!Number.isSafeInteger(count)||count<1||count>1000000)throw new Error('模擬次數須為 1–1,000,000');
    if(!['independent','continuous'].includes(mode))throw new Error('未知批次模式');
    S.validate(data,options);
    // Batch seed scheduling is a simulator policy, not the game's seed writer.
    const seeds=new window.DFCHRandom.OfficialRandom(options.seed),a=aggregate(count,mode);
    let saved=options.saved,completionRate=options.completionRate??0,context=null;
    while(a.completed<count) {
      const started=Date.now();let operations=0;
      do {
        if(signal?.aborted){a.cancelled=true;onProgress(a);return a;}
        if(!context)context=S.create(data,{...options,seed:a.completed===0?options.seed:seeds.next(),saved:mode==='continuous'?saved:options.saved,completionRate:mode==='continuous'?completionRate:options.completionRate,record:a.completed===0||a.completed===count-1});
        const more=S.step(data,context);operations++;
        if(!more) {
          const r=S.result(data,context);await onResult(r);add(a,r);
          if(mode==='continuous'){saved=r.saved;completionRate=r.completionRate;}
          context=null;
        }
      } while(a.completed<count && operations<100 && Date.now()-started<8);
      onProgress(a);
      if(a.completed<count)await new Promise(resolve=>setTimeout(resolve,0));
    }
    return a;
  }
  window.DFCHSimulationBatch=Object.freeze({aggregate,add,run});
})();
