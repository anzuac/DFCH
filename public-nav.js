(() => {
  'use strict';
  const labels={
    zh_tw:{brand:'DFCH · 英靈工具站',guide:'六星英靈喜好',bond30:'羈絆 30 等抽選',diamond:'鑽石抽取模擬器',team:'英靈編隊'},
    ja:{brand:'DFCH · 英霊ツール',guide:'六星英霊の好み',bond30:'絆 Lv.30 抽選',diamond:'ダイヤ抽選',team:'英霊編成'},
    en:{brand:'DFCH · Hero tools',guide:'Six-star gifts',bond30:'Bond Lv.30 draw',diamond:'Diamond simulator',team:'Hero lineup'},
    ko:{brand:'DFCH · 영령 도구',guide:'6성 영령 선물',bond30:'인연 Lv.30 추첨',diamond:'다이아 추첨',team:'영령 편성'},
    zh_cn:{brand:'DFCH · 英灵工具站',guide:'六星英灵喜好',bond30:'羁绊 Lv.30 抽取',diamond:'钻石抽取模拟器',team:'英灵编队'},
    th:{brand:'DFCH · เครื่องมือวีรชน',guide:'ของขวัญวีรชน 6 ดาว',bond30:'สุ่มสายสัมพันธ์ Lv.30',diamond:'จำลองสุ่มเพชร',team:'จัดทีมวีรชน'},
    vi:{brand:'DFCH · Công cụ anh linh',guide:'Quà tặng anh linh 6 sao',bond30:'Rút liên kết Lv.30',diamond:'Mô phỏng rút kim cương',team:'Đội hình anh linh'}
  };
  let brand,links=[];
  function language(){
    try{const stored=localStorage.getItem('dfch-hero-language');if(labels[stored])return stored;}catch(_){}
    return 'zh_tw';
  }
  function translate(next){
    const t=labels[next]||labels.zh_tw;
    if(!brand)return;
    brand.textContent=t.brand;
    for(const [key,a] of links)a.textContent=t[key];
  }
  function init(){
    const base=location.hostname.endsWith('.github.io')?'/DFCH/':'/';
    const path=location.pathname.toLowerCase().replace(/^\/dfch(?=\/)/,'');
    const current=path.startsWith('/bond30/')?'bond30':path.startsWith('/diamond/')?'diamond':path.startsWith('/team/')?'team':'guide';
    const nav=document.createElement('nav');
    nav.className='dfch-public-nav';
    nav.setAttribute('aria-label','DFCH tools / 工具導覽');
    brand=document.createElement('strong');nav.append(brand);
    const group=document.createElement('div');group.className='dfch-public-links';
    for(const [key,url] of [['guide',''],['bond30','bond30/'],['diamond','diamond/'],['team','team/']]){
      const a=document.createElement('a');a.href=base+url;
      if(key===current)a.setAttribute('aria-current','page');
      group.append(a);links.push([key,a]);
    }
    nav.append(group);document.body.prepend(nav);translate(language());
  }
  window.addEventListener('dfch:language-change',event=>translate(event.detail?.language));
  window.addEventListener('storage',event=>{if(event.key==='dfch-hero-language')translate(language());});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();