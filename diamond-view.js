(() => {
  'use strict';
  const D=window.DFCHDiamondDraw,$=id=>document.getElementById(id);
  let page='simple',timer=null,pending=null,cursor=-1,revealing=false,batch=null;
  let records=[];try {const saved=JSON.parse(localStorage.getItem('DFCH.diamond.history.v1')??'[]');if(Array.isArray(saved))records=saved.filter(r=>['simple','roulette'].includes(r.page)&&D.names[r.kind]&&Number.isSafeInteger(r.quantity)&&r.quantity>0).slice(0,30);}catch{}
  function text(tag,value,cls){const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;}
  function history(){const list=$('diamondHistory');list.replaceChildren();const shown=records.filter(r=>r.page===page);for(const r of shown.slice(0,10))list.append(text('li',`${r.tierName?`${r.tierName} · `:''}${D.names[r.kind]} ×${r.quantity}${r.eye?' · 惡魔之眼雙倍':''}${r.horn?' · 高貴一角的寶牙':''}`));$('diamondHistoryEmpty').hidden=shown.length>0;}
  function probabilities(){const root=$('diamondProbabilities');root.replaceChildren();D.tiers.forEach((t,i)=>{const section=text('section','');section.append(text('h4',`${t.name} · ${t.weight}%`));const table=document.createElement('table');table.className='diamond-prob-table';const head=table.createTHead().insertRow();['獎勵','此稀有度內','整體機率'].forEach(label=>{const th=document.createElement('th');th.textContent=label;head.append(th);});const body=table.createTBody();for(const r of D.rewards($('diamondHorn').checked,i)){const tr=body.insertRow();[`${D.names[r.kind]} ×${r.quantity}`,`${r.weight}%`,`${Number((t.weight*r.weight/100).toFixed(6))}%`].forEach(v=>tr.insertCell().textContent=v);}section.append(table);root.append(section);});}
  function highlight(index){[...$('diamondWheel').children].forEach((e,i)=>{e.classList.toggle('selected',i===index);e.setAttribute('aria-current',String(i===index));});}
  function controls(){
    const busy=!!pending||!!batch?.active;
    for(const id of ['diamondStart','diamondEye','diamondHorn','diamondTarget','diamondAutoStart','diamondSimpleTab','diamondRouletteTab'])$(id).disabled=busy;
    $('diamondStop').hidden=page==='simple';$('diamondAnimationNote').hidden=page==='simple';
    $('diamondStop').disabled=!busy||revealing;
    $('diamondStop').textContent=batch?.active?'停止連續抽取':'揭曉獎勵';
    $('diamondStart').textContent=page==='simple'?'抽取鑽石':'開始抽取';
  }
  function progress(reason=''){
    $('diamondAutoStatus').textContent=batch?`${reason||'連續抽取中'} · 已抽 ${batch.count.toLocaleString()} 次 · 鑽石 ${batch.total.toLocaleString()} 顆 · 目標 ${D.names[batch.target.kind]} ×${batch.target.quantity.toLocaleString()}` : '';
  }
  const rewardKey=r=>`${r.kind}:${r.quantity}`;
  function targets(){
    const input=$('diamondTarget'),previous=input.value,unique=new Map();
    D.tiers.forEach((_,tier)=>D.rewards($('diamondHorn').checked,tier).forEach(r=>{if(r.weight>0)unique.set(rewardKey(r),r);}));
    input.replaceChildren(...[...unique].map(([key,r])=>{const option=text('option',`${D.names[r.kind]} ×${r.quantity.toLocaleString()}`);option.value=key;return option;}));
    input.value=unique.has(previous)?previous:'diamond:7777';
  }
  function persist(){
    try{localStorage.setItem('DFCH.diamond.history.v1',JSON.stringify(records));$('diamondStorageNote').textContent='';}
    catch{$('diamondStorageNote').textContent='瀏覽器無法保存紀錄，目前只保留本次開啟的結果。';}history();
  }
  function save(r){
    $('diamondResult').textContent=`獲得 ${D.icons[r.kind]} ${D.names[r.kind]} ×${r.quantity}`;
    records.unshift(r);records=records.slice(0,30);
    persist();
  }
  function showWheel(r){
    $('diamondTier').textContent=`本輪：${D.tiers[r.tier].name}（稀有度機率 ${D.tiers[r.tier].weight}%）`;
    $('diamondWheel').replaceChildren(...D.rewards(r.horn,r.tier).map(row=>{
      const e=text('div','','diamond-wheel-row');e.append(text('span',D.icons[row.kind],'diamond-reward-icon'),text('strong',`${D.names[row.kind]} ×${row.quantity}`),text('span',`${row.weight}%`,'diamond-row-weight'));return e;
    }));
  }
  function fastBatch(){
    timer=null;if(!batch?.active)return;
    const start=performance.now();let last=null;
    for(let i=0;i<1000;i++){
      const r=D.roulette(batch.horn);
      last={...r,page:'roulette',tierName:D.tiers[r.tier].name,eye:false,horn:batch.horn};
      batch.count++;if(r.kind==='diamond')batch.total+=r.quantity;
      records.unshift(last);if(records.length>30)records.pop();
      if(rewardKey(r)===rewardKey(batch.target)){batch.active=false;batch.hit=true;break;}
      if(performance.now()-start>=8)break;
    }
    if(last){showWheel(last);highlight(last.index);$('diamondResult').textContent=`${batch.hit?'抽中目標！':'最近抽到'} ${D.names[last.kind]} ×${last.quantity}`;persist();}
    progress(batch.hit?'已抽中目標，自動停止':'快速連續抽取中');controls();
    if(batch.active)timer=setTimeout(fastBatch,0);
  }

  function settle(){
    clearTimeout(timer);timer=null;if(!pending)return;
    const r=pending;pending=null;revealing=false;highlight(r.index);save(r);
    controls();
  }

  function animate(){
    if(!pending)return;
    cursor=(cursor+1)%$('diamondWheel').children.length;highlight(cursor);
    if(revealing&&cursor===pending.index){settle();return;}
    timer=setTimeout(animate,90);
  }
  function draw(){
    // Exactly one weighted draw at the start; animation never consumes RNG.
    const r=D.roulette($('diamondHorn').checked);
    pending={...r,page:'roulette',tierName:D.tiers[r.tier].name,eye:false,horn:$('diamondHorn').checked};
    cursor=-1;revealing=false;
    showWheel(pending);
    $('diamondResult').textContent=batch?.active?'連續抽取中…':'獎勵已抽定，按「揭曉獎勵」。';controls();
    const tick=()=>{if(!pending)return;cursor=(cursor+1)%7;highlight(cursor);
      if(revealing&&cursor===pending.index){settle();return;}timer=setTimeout(tick,90);
    };tick();
  }
  function start(){
    if(pending||batch?.active)return;batch=null;progress();
    if(page==='simple'){save({...D.simple($('diamondEye').checked),page,eye:$('diamondEye').checked,horn:false});return;}draw();
  }
  function stop(){
    if(batch?.active){batch.active=false;progress('停止中');}
    if(!pending){clearTimeout(timer);timer=null;progress('已停止');controls();return;}
    if(revealing)return;revealing=true;controls();
    // Continue downward to the already selected result, never redraw on click.
    clearTimeout(timer);timer=setTimeout(animate,90);
  }
  function cancel(){if(batch)batch.active=false;clearTimeout(timer);timer=null;if(pending)settle();else controls();if(batch)progress(batch.hit?'已抽中目標，自動停止':'已停止');}
  function render(){
    cancel();batch=null;progress();const simple=page==='simple';
    $('diamondSimple').hidden=!simple;$('diamondRoulette').hidden=simple;
    $('diamondSimpleTab').setAttribute('aria-selected',String(simple));$('diamondRouletteTab').setAttribute('aria-selected',String(!simple));
    $('diamondResult').textContent=simple?'按「抽取鑽石」立即查看結果。':'按「開始抽取」或設定目標連續抽取。';
    $('diamondWheel').replaceChildren();$('diamondWheel').hidden=simple;
    $('diamondRange').textContent=$('diamondEye').checked?'20–100 顆，每次相差 2 顆。':'10–50 顆，每次相差 1 顆。';
    if(!simple){$('diamondTier').textContent='稀有度：60%／34%／5%／1%。';probabilities();targets();}controls();history();
  }
  $('diamondAutoStart').addEventListener('click',()=>{
    if(pending||batch?.active)return;
    const key=$('diamondTarget').value,horn=$('diamondHorn').checked;
    const target=D.tiers.flatMap((_,i)=>D.rewards(horn,i)).find(r=>r.weight>0&&rewardKey(r)===key);
    if(!target){$('diamondAutoStatus').textContent='請選擇目前獎品表中的目標。';return;}
    batch={active:true,target:{kind:target.kind,quantity:target.quantity},horn,total:0,count:0,hit:false};
    progress();controls();timer=setTimeout(fastBatch,0);
  });
  window.addEventListener('dfch-tab-change',event=>{if(event.detail!=='diamond')cancel();});
  $('diamondSimpleTab').addEventListener('click',()=>{page='simple';render();});$('diamondRouletteTab').addEventListener('click',()=>{page='roulette';render();});
  ['diamondEye','diamondHorn'].forEach(id=>$(id).addEventListener('change',render));
  $('diamondStart').addEventListener('click',start);$('diamondStop').addEventListener('click',stop);$('diamondWheel').addEventListener('click',()=>{if(!batch?.active)stop();});
  $('diamondWheel').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!batch?.active)stop();}});
  render();
})();
