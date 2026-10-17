/* Shared DFCH player navigation: home, direct-jump selector and settings slot. */
(() => {
  'use strict';
  const keys=['home','heroes','recruit','bond30','diamond','team'];
  const names={
    zh_tw:['回首頁','快速移動','DFCH 首頁','六星英靈喜好圖鑑','英靈抽取模擬器','羈絆 30 等抽選','鑽石抽取模擬器','英靈編隊'],
    ja:['ホームへ','クイック移動','DFCH ホーム','六星英霊の好み','英霊召喚シミュレーター','絆 Lv.30 抽選','ダイヤ抽選','英霊編成'],
    en:['Home','Quick jump','DFCH home','Six-star hero gifts','Hero recruitment simulator','Bond Lv.30 draw','Diamond simulator','Hero lineup'],
    ko:['홈으로','빠른 이동','DFCH 홈','6성 영령 선물','영령 모집 시뮬레이터','인연 Lv.30 추첨','다이아 추첨','영령 편성']
  };
  const isGitHub=location.hostname.endsWith('.github.io');
  const base=isGitHub?'/DFCH/':'/';
  const route={
    home:base,heroes:isGitHub?base+'heroes.html':base+'heroes/',
    recruit:isGitHub?base+'Recruit/':base+'recruit/',
    bond30:base+(isGitHub?'Bond30/':'bond30/'),
    diamond:isGitHub?base+'#tab-diamond':base+'diamond/',
    team:base+'team/'
  };
  const path=location.pathname.toLowerCase().replace(/^\/dfch(?=\/)/,'');
  const current=path.startsWith('/recruit/')?'recruit':
    path.startsWith('/bond30/')?'bond30':
    path.startsWith('/diamond/')?'diamond':
    path.startsWith('/team/')?'team':
    path.startsWith('/heroes/')||path.endsWith('/heroes.html')?'heroes':'home';
  let home,selector,nav;
  function language(){
    try{const saved=localStorage.getItem('dfch-hero-language');return names[saved]?saved:'zh_tw';}
    catch{return 'zh_tw';}
  }
  function update(next){
    if(!nav)return;
    const t=names[next]||names.zh_tw;
    home.textContent='⌂ '+t[0];selector.setAttribute('aria-label',t[1]);
    selector.options[0].textContent=t[1];
    keys.forEach((key,i)=>{selector.options[i+1].textContent=t[i+2]});
    selector.value='';
  }
  function init(){
    if(document.querySelector('.dfch-public-nav'))return;
    nav=document.createElement('nav');nav.className='dfch-public-nav';
    nav.setAttribute('aria-label','DFCH 公開工具導覽');
    const left=document.createElement('div');left.className='dfch-public-nav-left';
    home=document.createElement('a');home.className='dfch-public-home';home.href=route.home;
    const chooser=document.createElement('div');chooser.className='dfch-public-jump';
    selector=document.createElement('select');selector.id='dfchQuickJump';
    const first=document.createElement('option');first.value='';first.disabled=true;first.selected=true;selector.append(first);
    for(const key of keys){
      const option=document.createElement('option');option.value=key;selector.append(option);
    }
    selector.addEventListener('change',()=>{
      const chosen=selector.value;
      if(!Object.prototype.hasOwnProperty.call(route,chosen))return;
      location.assign(route[chosen]);
    });
    chooser.append(selector);left.append(home,chooser);
    const settings=document.createElement('div');settings.className='dfch-public-settings-slot';
    nav.append(left,settings);document.body.prepend(nav);
    nav.dataset.currentPage=current;
    update(language());
  }
  window.addEventListener('dfch:language-change',e=>update(e.detail?.language));
  window.addEventListener('storage',e=>{if(e.key==='dfch-hero-language')update(language());});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();