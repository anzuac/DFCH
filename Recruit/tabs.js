/* Recruit V2.5.1 — two tabs in one document. Draw state never reinitialized. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const recruit=$('recruitTabButton'),stats=$('statsTabButton');
  const recruitPanel=$('recruitTabPanel'),statsPanel=$('statsTabPanel');
  if(!recruit||!stats||!recruitPanel||!statsPanel)return;
  let selected='';
  function show(which,writeHistory=false){
    const next=which==='stats'?'stats':'recruit';
    const showingStats=next==='stats';
    recruitPanel.hidden=showingStats;
    statsPanel.hidden=!showingStats;
    recruit.setAttribute('aria-selected',String(!showingStats));
    stats.setAttribute('aria-selected',String(showingStats));
    recruit.tabIndex=showingStats?-1:0;
    stats.tabIndex=showingStats?0:-1;
    recruit.classList.toggle('is-active',!showingStats);
    stats.classList.toggle('is-active',showingStats);
    if(showingStats&&window.DFCHRecruitStatisticsUI?.refresh)
      window.DFCHRecruitStatisticsUI.refresh();
    if(writeHistory&&selected!==next){
      const base=location.pathname+location.search;
      history.pushState({dfchRecruitTab:next},'',base+(showingStats?'#stats':'#recruit'));
    }
    selected=next;
    if(writeHistory)window.scrollTo(0,0);
  }
  recruit.addEventListener('click',()=>show('recruit',true));
  stats.addEventListener('click',()=>show('stats',true));
  for(const [control,tab] of [[recruit,'recruit'],[stats,'stats']]){
    control.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();
      const next=tab==='recruit'?'stats':'recruit';
      show(next,true);
      (next==='stats'?stats:recruit).focus();
    });
  }
  window.addEventListener('popstate',()=>show(location.hash==='#stats'?'stats':'recruit'));
  window.addEventListener('hashchange',()=>show(location.hash==='#stats'?'stats':'recruit'));
  show(location.hash==='#stats'?'stats':'recruit');
})();