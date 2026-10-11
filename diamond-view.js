(() => {
  'use strict';
  const D=window.DFCHDiamondDraw,$=id=>document.getElementById(id),dialog=$('diamondDialog');
  let page='simple',timer=null,pending=null,cursor=-1,revealing=false,opener=null,batch=null;
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
    $('diamondAutoStatus').textContent=batch?`${reason||'連續抽取中'} · 已抽 ${batch.count.toLocaleString()} 次 · 鑽石 ${batch.total.toLocaleString()}／${batch.target.toLocaleString()} 顆` : '';
  }
  function save(r){
    $('diamondResult').textContent=`獲得 ${D.icons[r.kind]} ${D.names[r.kind]} ×${r.quantity}`;
    records.unshift(r);records=records.slice(0,30);
    try{localStorage.setItem('DFCH.diamond.history.v1',JSON.stringify(records));$('diamondStorageNote').textContent='';}
    catch{$('diamondStorageNote').textContent='瀏覽器無法保存紀錄，目前只保留本次開啟的結果。';}history();
  }
  function settle(){
    clearTimeout(timer);timer=null;if(!pending)return;
    const r=pending;pending=null;revealing=false;highlight(r.index);save(r);
    if(batch){batch.count++;if(r.kind==='diamond')batch.total+=r.quantity;
      if(batch.total>=batch.target){batch.active=false;progress('已達目標，自動停止');}
      else progress(batch.active?'':'已停止');
    }
    controls();if(batch?.active)timer=setTimeout(draw,180);
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
    $('diamondTier').textContent=`本輪：${D.tiers[r.tier].name}（稀有度機率 ${D.tiers[r.tier].weight}%）`;
    $('diamondWheel').replaceChildren(...D.rewards(pending.horn,r.tier).map(row=>{
      const e=text('div','','diamond-wheel-row');e.append(text('span',D.icons[row.kind],'diamond-reward-icon'),text('strong',`${D.names[row.kind]} ×${row.quantity}`),text('span',`${row.weight}%`,'diamond-row-weight'));return e;
    }));
    $('diamondResult').textContent=batch?.active?'連續抽取中…':'獎勵已抽定，按「揭曉獎勵」。';controls();
    let steps=0;
    const tick=()=>{if(!pending)return;cursor=(cursor+1)%7;highlight(cursor);steps++;
      if(batch?.active&&steps>=7)revealing=true;
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
  function cancel(){if(batch)batch.active=false;clearTimeout(timer);timer=null;if(pending)settle();else controls();if(batch)progress(batch.total>=batch.target?'已達目標，自動停止':'已停止');}
  function render(){
    cancel();batch=null;progress();const simple=page==='simple';
    $('diamondSimple').hidden=!simple;$('diamondRoulette').hidden=simple;
    $('diamondSimpleTab').setAttribute('aria-selected',String(simple));$('diamondRouletteTab').setAttribute('aria-selected',String(!simple));
    $('diamondResult').textContent=simple?'按「抽取鑽石」立即查看結果。':'按「開始抽取」或設定目標連續抽取。';
    $('diamondWheel').replaceChildren();$('diamondWheel').hidden=simple;
    $('diamondRange').textContent=$('diamondEye').checked?'20–100 顆，每次相差 2 顆。':'10–50 顆，每次相差 1 顆。';
    if(!simple){$('diamondTier').textContent='稀有度：60%／34%／5%／1%。';probabilities();}controls();history();
  }
  $('diamondAutoStart').addEventListener('click',()=>{
    if(pending||batch?.active)return;const input=$('diamondTarget'),target=Number(input.value);
    input.setCustomValidity('');if(input.value.trim()===''||!Number.isSafeInteger(target)||target<1||target>1000000000){input.setCustomValidity('請輸入 1–1,000,000,000 的整數鑽石目標');input.reportValidity();return;}
    batch={active:true,target,total:0,count:0};progress();draw();
  });
  $('diamondTarget').addEventListener('input',()=>$('diamondTarget').setCustomValidity(''));
  $('openDiamondSimulator').addEventListener('click',()=>{opener=document.activeElement;render();if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');});
  $('diamondClose').addEventListener('click',()=>{cancel();if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');opener?.focus();});
  dialog.addEventListener('cancel',cancel);dialog.addEventListener('close',()=>{cancel();opener?.focus();});
  $('diamondSimpleTab').addEventListener('click',()=>{page='simple';render();});$('diamondRouletteTab').addEventListener('click',()=>{page='roulette';render();});
  ['diamondEye','diamondHorn'].forEach(id=>$(id).addEventListener('change',render));
  $('diamondStart').addEventListener('click',start);$('diamondStop').addEventListener('click',stop);$('diamondWheel').addEventListener('click',()=>{if(!batch?.active)stop();});
  $('diamondWheel').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!batch?.active)stop();}});
})();
