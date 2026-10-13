(() => {
  'use strict';
  function init(){
    const path=location.pathname.toLowerCase();
    const current=path.startsWith('/bond30/')?'bond30':path.startsWith('/diamond/')?'diamond':'guide';
    const nav=document.createElement('nav');
    nav.className='dfch-public-nav';
    nav.setAttribute('aria-label','DFCH 工具導覽');
    const title=document.createElement('strong');title.textContent='DFCH · 英靈工具站';nav.append(title);
    const links=document.createElement('div');links.className='dfch-public-links';
    for(const [key,url,label] of [['guide','/','六星英靈喜好'],['bond30','/bond30/','羈絆 30 等抽選'],['diamond','/diamond/','鑽石抽取模擬器']]){
      const a=document.createElement('a');a.href=url;a.textContent=label;
      if(key===current)a.setAttribute('aria-current','page');
      links.append(a);
    }
    nav.append(links);document.body.prepend(nav);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();