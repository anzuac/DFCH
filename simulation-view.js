(() => {
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  const number=n=>Number(n).toLocaleString('zh-TW',{maximumFractionDigits:3});
  function table(headers,rows) {
    const wrap=el('div');wrap.className='simulation-table-scroll';const t=el('table'),head=el('thead'),body=el('tbody'),tr=el('tr');
    for(const h of headers)tr.append(el('th',h));head.append(tr);
    for(const row of rows){const r=el('tr');for(const v of row)r.append(el('td',String(v)));body.append(r);}
    t.append(head,body);wrap.append(t);return wrap;
  }
  function details(result,label) {
    const d=el('details'),list=el('ol');d.append(el('summary',`${label}：種子 ${result.seed} · ${result.steps} 個事件 · ${result.randomCalls} 次亂數`));
    list.className='simulation-log';
    // First/last logs are retained; cap DOM size without altering simulation.
    for(const r of result.log.slice(0,1000))list.append(el('li',`第 ${r.step} 步｜進度 ${r.progress}｜${r.text}`));
    d.append(el('p',`探索 ${number(result.completionStart)}% → ${number(result.completionRate)}%；${result.endReason==='goal'?'到達終點':'耐力耗盡'}；一般鑽石當日累計 ${number(result.saved.daily)}。`),list);
    if(result.log.length>1000)d.append(el('p','畫面只列前 1,000 筆明細；統計包含整輪。'));
    const trace=el('details');trace.append(el('summary','查看亂數呼叫明細'));
    trace.append(table(['次序','抽選階段','結果'],result.trace.slice(0,1000).map(r=>[r.call,r.label,Number.isInteger(r.value)?r.value:r.value.toFixed(9)])));d.append(trace);return d;
  }
  function render(data,a) {
    const root=document.getElementById('simulationResults');root.replaceChildren();
    root.append(el('p',`${a.cancelled?'已中止':'模擬結果'} · 已完成 ${number(a.completed)}／${number(a.requested)} 輪 · ${a.mode==='continuous'?'連續遠征':'每輪獨立'}`));
    if(!a.completed){root.append(el('p','沒有已完成的遠征，本輪尚未結算。'));return;}
    root.append(table(['項目','總量','平均每輪'],[
      ['到達終點',number(a.goals),`${number(a.goals/a.completed*100)}%`],
      ['耐力耗盡',number(a.exhausted),`${number(a.exhausted/a.completed*100)}%`],
      ['一般鑽石',number(a.ordinaryDiamonds),number(a.ordinaryDiamonds/a.completed)],
      ['神級鑽石',number(a.godDiamonds),number(a.godDiamonds/a.completed)],
      ['羈絆道具',number(a.affection),number(a.affection/a.completed)],
      ['遭遇戰鬥',number(a.battles),number(a.battles/a.completed)],
      ['終點首領',number(a.bosses),number(a.bosses/a.completed)]
    ]));
    root.append(el('p',`羈絆取得輪數比例 ${number(a.affectionRuns/a.completed*100)}%；無羈絆輪數 ${number(a.completed-a.affectionRuns)}。`));
    root.append(table(['高額鑽石','抽中次數','取得量（已含在總量）'],[5000,7777,9999].map(n=>[number(n),number(a.highDiamonds[n]),number(n*a.highDiamonds[n])])));
    root.append(el('p',`遇到高額鑽石的輪數 ${number(a.highRuns)}；本輪跨過一般鑽石上限 ${number(a.capCrossRuns)} 輪。`));
    root.append(el('h3','各獎勵統計'));
    root.append(table(['獎勵','總量','平均每輪','取得輪數比例'],Object.entries(a.quantities).map(([id,n])=>[
      data.rewardMasters.find(m=>m.rewardId===Number(id))?.name??'獎勵',number(n),number(n/a.completed),`${number(a.rewardRuns[id]/a.completed*100)}%`
    ])));
    const events=el('details');events.append(el('summary','查看各事件出現次數'),table(['事件','次數'],Object.entries(a.eventCounts).map(([name,n])=>[name,number(n)])));root.append(events);
    root.append(details(a.first,'第一輪'));
    if(a.completed>1)root.append(details(a.last,'最後完成輪'));
    root.append(el('p','取得輪數比例是至少取得一次的輪數／完成輪數；不是原始權重。中止時只結算已完成輪，進行中的遠征捨棄。'));
  }
  window.DFCHSimulationView=Object.freeze({render,table,el,number});
})();
