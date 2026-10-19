(() => {
  'use strict';
  const E=window.DFCHTreasureEngine;
  if (!E) return;
  const $=id=>document.getElementById(id);
  const storeKey='dfch-treasure-continuation-v2';
  const legacyKey='dfch-treasure-continuation-v1';
  const nf=new Intl.NumberFormat('zh-TW');
  const percent=(value,digits=2)=>(100*value).toFixed(digits)+'%';
  const storage=(()=>{try{return window.localStorage;}catch(_){return null;}})();
  const HOLD_DELAY_MS=420;
  const REVEAL_INTERVAL_MS=105;
  const NEXT_CHEST_PAUSE_MS=310;
  const SKIP_NEXT_PAUSE_MS=180;
  const MINIMUM=E.CONFIG.normalMinimum;
  const jackpotTypes=new Set(['A','B','C']);
  const icons={A:'✦',B:'◆',C:'✹',N:'◈',R:'◇',SR:'✧',SSR:'✦',UR:'❖'};
  const rarityGemFiles=Object.freeze({N:'n',R:'r',SR:'sr',SSR:'ssr',UR:'ur'});
  let stats=E.blankStats();
  let skipAnimation=false;
  let activeOpening=null;
  let fastForwarding=false;
  let revealTimer=null;
  let nextChestTimer=null;
  let activePointer=null;
  let holdTimer=null;
  let holdActive=false;
  let holdDraws=0;
  let suppressClick=false;
  const openButton=$('openOnce');
  const skipButton=$('skipAnimation');

  function sanitizeStats(candidate) {
    const s=E.blankStats();
    if (!candidate||typeof candidate!=='object') return s;
    for(const key of Object.keys(s)) {
      if (!Number.isSafeInteger(candidate[key])||candidate[key]<0) return E.blankStats();
      s[key]=candidate[key];
    }
    if (s.items!==s.a+s.b+s.c+s.ordinary ||
        s.ordinary!==s.n+s.r+s.sr+s.ssr+s.ur ||
        s.continuationChecks!==s.continueSuccess+s.runs ||
        s.hitRuns>s.runs) return E.blankStats();
    return s;
  }
  try {
    const saved=storage && JSON.parse(storage.getItem(storeKey));
    if(saved) {
      stats=sanitizeStats(saved.stats);
      if(typeof saved.skipAnimation==='boolean')skipAnimation=saved.skipAnimation;
    } else {
      // Keep the previous animation preference, but never mix incompatible
      // old two-jackpot statistics into the new three-jackpot probability pool.
      const previous=storage && JSON.parse(storage.getItem(legacyKey));
      if(typeof previous?.skipAnimation==='boolean')skipAnimation=previous.skipAnimation;
      else if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)skipAnimation=true;
    }
  } catch(_) { /* optional local storage */ }
  function persist() {
    try{storage?.setItem(storeKey,JSON.stringify({stats,skipAnimation}));}catch(_){/* private browsing */}
  }
  function updateStats() {
    for(const [id,key] of [['statRuns','runs'],['statItems','items'],['statA','a'],['statB','b'],['statC','c'],
      ['statN','n'],['statR','r'],['statSR','sr'],['statSSR','ssr'],['statUR','ur'],['statHitRuns','hitRuns']]) {
      $(id).textContent=nf.format(stats[key]);
    }
    $('statAverage').textContent=stats.runs?(stats.items/stats.runs).toFixed(2)+' 件':'—';
    $('statRetention').textContent=stats.continuationChecks?
      percent(stats.continueSuccess/stats.continuationChecks):'—';
  }
  function updateSkipButton() {
    skipButton.setAttribute('aria-pressed',String(skipAnimation));
    $('skipAnimationLabel').textContent='跳過動畫：'+(skipAnimation?'開啟':'關閉');
    persist();
  }
  function columnsForViewport() {
    return window.matchMedia?.('(max-width:510px)').matches ? 6 :
      window.matchMedia?.('(max-width:780px)').matches ? 8 : 10;
  }
  function updateScrollHint() {
    $('lootRemainder').hidden=$('lootGrid').children.length<=columnsForViewport()*5;
  }
  function createTile(reward) {
    const tile=document.createElement('div');
    tile.className='loot-tile type-'+reward.type;
    tile.dataset.number=String(reward.number);
    const rarityFile=rarityGemFiles[reward.type];
    const icon=document.createElement(rarityFile?'img':'span');
    if(rarityFile) {
      icon.className='tile-gem';
      icon.src='./assets/rarity-'+rarityFile+'.webp';
      icon.alt='';
      icon.width=40;
      icon.height=40;
      icon.decoding='async';
    } else {
      icon.className='tile-icon';
      icon.textContent=icons[reward.type];
    }
    const label=document.createElement('small');
    label.textContent=jackpotTypes.has(reward.type)?'大獎 '+reward.type:reward.type;
    tile.title=`第 ${reward.number} 件：${label.textContent}`;
    tile.append(icon,label);
    return tile;
  }
  function appendReward(reward) {
    const grid=$('lootGrid');
    const followLatest=grid.scrollHeight-grid.clientHeight-grid.scrollTop<=32;
    grid.append(createTile(reward));
    updateScrollHint();
    if(followLatest)grid.scrollTop=grid.scrollHeight;
  }
  function updatePartial(stage) {
    $('lastItems').textContent=nf.format(stage.items);
    $('lastRare').textContent=nf.format(stage.a+stage.b+stage.c);
    $('lastStreak').textContent=nf.format(stage.continueSuccess);
    $('lootCaption').textContent=`大獎 A ×${stage.a} · B ×${stage.b} · C ×${stage.c} · 普通 ×${stage.ordinary}`;
    $('liveDropProgress').classList.toggle('is-rare',jackpotTypes.has(stage.reward.type));
    $('liveDropMessage').textContent=jackpotTypes.has(stage.reward.type)?
      `第 ${nf.format(stage.items)} 件 · ✨ 大獎 ${stage.reward.type}！` :
      `第 ${nf.format(stage.items)} 件 · ${stage.reward.type} 級獎勵`;
    $('liveDropCount').textContent=`${nf.format(stage.items)} 件`;
  }
  function refreshDrawButton() {
    $('drawButtonText').textContent=holdActive?'連續開箱中 · 放開停止':
      activeOpening?'逐件揭曉中…':'點擊開始抽獎';
  }
  function finishOpening(stage) {
    if(!activeOpening)return;
    clearTimeout(revealTimer);
    revealTimer=null;
    const wasHeldOpening=activeOpening.startedByHold;
    activeOpening=null;
    $('resultPanel').classList.remove('is-revealing');
    $('lastMode').textContent='普通開箱 · 已完成';
    E.addStats(stats,stage);
    updateStats();
    persist();
    if(wasHeldOpening)++holdDraws;
    $('lootHeadline').textContent='掉落清單 · 已完成';
    $('liveDropMessage').textContent=`本箱開啟完成 · ${nf.format(stage.items)} 件`;
    $('liveDropProgress').classList.remove('is-rare');
    refreshDrawButton();
    if(holdActive) {
      const status=$('autoDrawStatus');
      status.hidden=false;
      status.textContent=`長按連抽 · 已完成 ${nf.format(holdDraws)} 箱，放開後停止`;
      nextChestTimer=setTimeout(()=>{
        nextChestTimer=null;
        if(holdActive)startOpening();
      },skipAnimation?SKIP_NEXT_PAUSE_MS:NEXT_CHEST_PAUSE_MS);
    } else if(holdDraws>0) {
      $('autoDrawStatus').hidden=false;
      $('autoDrawStatus').textContent=`連抽已停止 · 共完成 ${nf.format(holdDraws)} 箱`;
    }
  }
  function advanceOpening() {
    if(!activeOpening)return;
    const stage=activeOpening.stream.next();
    if(!stage)return;
    appendReward(stage.reward);
    updatePartial(stage);
    if(stage.finished){finishOpening(stage);return;}
    if(!skipAnimation&&!fastForwarding)revealTimer=setTimeout(advanceOpening,REVEAL_INTERVAL_MS);
  }
  function finishAnimationImmediately() {
    if(!activeOpening)return;
    clearTimeout(revealTimer);
    revealTimer=null;
    fastForwarding=true;
    try{while(activeOpening)advanceOpening();}
    finally{fastForwarding=false;}
  }
  function startOpening() {
    if(activeOpening)return;
    if(nextChestTimer!==null){clearTimeout(nextChestTimer);nextChestTimer=null;}
    try {
      activeOpening={stream:E.createOpening(MINIMUM,Math.random),startedByHold:holdActive};
      $('emptyResult').hidden=true;
      $('resultContent').hidden=false;
      $('lootGrid').replaceChildren();
      $('lootGrid').scrollTop=0;
      $('lootRemainder').hidden=true;
      $('lootHeadline').textContent='掉落清單 · 逐件揭曉中';
      $('lastMode').textContent='普通開箱 · 進行中';
      $('lastItems').textContent='0';
      $('lastRare').textContent='0';
      $('lastStreak').textContent='0';
      $('lootCaption').textContent='即將揭曉第一件獎勵';
      $('resultPanel').classList.add('is-revealing');
      $('liveDropProgress').hidden=false;
      $('liveDropMessage').textContent='即將揭曉…';
      $('liveDropCount').textContent='0 件';
      if(!holdActive)$('autoDrawStatus').hidden=true;
      refreshDrawButton();
      if(skipAnimation)finishAnimationImmediately();
      else advanceOpening();
    } catch(error) {
      clearTimeout(revealTimer);
      revealTimer=null;
      activeOpening=null;
      stopPress();
      $('liveDropProgress').hidden=false;
      $('liveDropMessage').textContent=`開箱失敗：${String(error.message||error)}`;
      refreshDrawButton();
    }
  }
  function stopPress() {
    if(holdTimer!==null)clearTimeout(holdTimer);
    if(nextChestTimer!==null)clearTimeout(nextChestTimer);
    holdTimer=null;
    nextChestTimer=null;
    const wasHolding=holdActive;
    activePointer=null;
    holdActive=false;
    openButton.classList.remove('is-holding');
    refreshDrawButton();
    if(wasHolding) {
      suppressClick=true;
      const status=$('autoDrawStatus');
      status.hidden=false;
      status.textContent=activeOpening?
        `已停止連開，完成目前這箱後結束 · 已完成 ${nf.format(holdDraws)} 箱`:
        `連抽已停止 · 共完成 ${nf.format(holdDraws)} 箱`;
    }
  }
  openButton.addEventListener('pointerdown',event=>{
    if(activePointer!==null||activeOpening||!event.isPrimary||
       (event.pointerType==='mouse'&&event.button!==0))return;
    suppressClick=false;
    activePointer=event.pointerId;
    holdDraws=0;
    holdTimer=setTimeout(()=>{
      if(activePointer!==event.pointerId)return;
      holdTimer=null;
      holdActive=true;
      suppressClick=true;
      openButton.classList.add('is-holding');
      startOpening();
    },HOLD_DELAY_MS);
  });
  for(const name of ['pointerup','pointercancel']) {
    window.addEventListener(name,event=>{if(event.pointerId===activePointer)stopPress();});
  }
  openButton.addEventListener('pointerleave',event=>{
    if(event.pointerId===activePointer)stopPress();
  });
  openButton.addEventListener('contextmenu',event=>event.preventDefault());
  openButton.addEventListener('click',event=>{
    if(suppressClick){event.preventDefault();return;}
    if(!activeOpening){holdDraws=0;startOpening();}
  });
  skipButton.addEventListener('click',()=>{
    skipAnimation=!skipAnimation;
    updateSkipButton();
    if(skipAnimation&&activeOpening)finishAnimationImmediately();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stopPress();finishAnimationImmediately();}
  });
  window.addEventListener('blur',()=>{if(activePointer!==null)stopPress();});
  window.addEventListener('resize',updateScrollHint);
  $('resetStats').addEventListener('click',()=>{
    if(activeOpening||holdActive||activePointer!==null||
       !window.confirm('確定重置新版獎池的全部累計抽獎紀錄？'))return;
    stats=E.blankStats();
    holdDraws=0;
    updateStats();
    $('autoDrawStatus').hidden=true;
    $('liveDropProgress').hidden=true;
    $('resultContent').hidden=true;
    $('emptyResult').hidden=false;
    $('lastMode').textContent='尚未開箱';
    persist();
  });
  $('probPerRun').textContent=percent(E.theoreticalHitChance(MINIMUM),3);
  updateSkipButton();
  updateStats();
})();
