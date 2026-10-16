/* Three recruitment tabs with independent selections and preserved draw state. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const tabs=[
    {id:'recruit',button:$('recruitTabButton'),panel:$('recruitTabPanel')},
    {id:'stats',button:$('statsTabButton'),panel:$('statsTabPanel')},
    {id:'abilities',button:$('abilityTabButton'),panel:$('abilityTabPanel')},
    {id:'target',button:$('targetTabButton'),panel:$('targetTabPanel')}
  ];
  if(tabs.some(tab=>!tab.button||!tab.panel))return;
  let selected='';
  function fromHash(){
    if(location.hash==='#stats')return 'stats';
    if(location.hash==='#abilities')return 'abilities';
    if(location.hash==='#target')return 'target';
    return 'recruit';
  }
  function show(which,writeHistory=false){
    const active=tabs.some(x=>x.id===which)?which:'recruit';
    for(const tab of tabs){
      const isActive=tab.id===active;
      tab.panel.hidden=!isActive;
      tab.button.setAttribute('aria-selected',String(isActive));
      tab.button.tabIndex=isActive?0:-1;
      tab.button.classList.toggle('is-active',isActive);
    }
    if(active==='stats')window.DFCHRecruitStatisticsUI?.refresh?.();
    if(active==='abilities')window.DFCHRecruitStatisticsUI?.refreshAbilities?.();
    if(active==='target')window.DFCHTargetDraw?.render?.();
    if(writeHistory&&selected!==active){
      const base=location.pathname+location.search;
      history.pushState({dfchRecruitTab:active},'',base+'#'+active);
    }
    selected=active;
    if(writeHistory)window.scrollTo(0,0);
  }
  tabs.forEach((tab,i)=>{
    tab.button.addEventListener('click',()=>show(tab.id,true));
    tab.button.addEventListener('keydown',event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();
      const direction=event.key==='ArrowRight'?1:-1;
      const next=tabs[(i+direction+tabs.length)%tabs.length];
      show(next.id,true);
      next.button.focus();
    });
  });
  window.addEventListener('popstate',()=>show(fromHash()));
  window.addEventListener('hashchange',()=>show(fromHash()));
  show(fromHash());
})();
