(() => {
  'use strict';
  const source=window.DFCHHeroPreferences,$=id=>document.getElementById(id),common=new Set(source.commonFavorite);
  const ui={"zh_tw": ["六星英靈喜好", "搜尋英靈／稱號／物品", "指定英靈", "全部六星英靈", "找出喜歡這個物品的英靈", "全部物品", "喜好範圍", "喜愛與最愛", "只查最愛", "只查喜愛", "清除篩選", "所有六星皆喜愛的通用物品", "最愛", "喜愛", "找不到符合條件的英靈", "缺少此語言翻譯，顯示日文原名。", "另喜愛上方 {n} 種通用物品。", "顯示 {n}／{total} 位六星英靈", "無個別喜愛物品", "未設定固定最愛物品"], "en": ["Six-star hero gift guide", "Search hero / title / gift", "Hero", "All six-star heroes", "Heroes who like this gift", "All gifts", "Preference", "Liked and loved", "Loved only", "Liked only", "Clear filters", "Gifts liked by all six-star heroes", "Loved", "Liked", "No matching heroes", "Translation unavailable; showing Japanese.", "Also likes the {n} common gifts above.", "Showing {n} / {total} six-star heroes", "No individual liked gifts", "No fixed loved gifts"], "ja": ["六星英霊の好み", "英霊・称号・贈り物を検索", "英霊", "すべての六星英霊", "この贈り物が好きな英霊", "すべての贈り物", "好み", "好き・大好き", "大好きのみ", "好きのみ", "絞り込みをクリア", "すべての六星英霊が好きな贈り物", "大好き", "好き", "該当する英霊がいません", "翻訳がないため日本語を表示します。", "上記の共通の贈り物 {n} 種も好きです。", "六星英霊 {n}／{total} 体を表示", "個別の好きな贈り物なし", "固定の大好きな贈り物なし"], "zh_cn": ["六星英灵喜好", "搜索英灵／称号／物品", "指定英灵", "全部六星英灵", "喜欢此物品的英灵", "全部物品", "喜好范围", "喜爱与最爱", "仅最爱", "仅喜爱", "清除筛选", "所有六星均喜爱的通用物品", "最爱", "喜爱", "没有符合条件的英灵", "缺少此语言翻译，显示日文原名。", "另外喜爱上方 {n} 种通用物品。", "显示 {n}／{total} 位六星英灵", "无个别喜爱物品", "未设置固定最爱物品"], "ko": ["6성 영령 선물 도감", "영령 / 칭호 / 선물 검색", "영령 선택", "모든 6성 영령", "이 선물을 좋아하는 영령", "모든 선물", "선호도", "좋아함 및 매우 좋아함", "매우 좋아함만", "좋아함만", "필터 초기화", "모든 6성 영령이 좋아하는 선물", "매우 좋아함", "좋아함", "일치하는 영령이 없습니다", "번역이 없어 일본어로 표시합니다.", "위의 공통 선물 {n}종도 좋아합니다.", "6성 영령 {n} / {total}명 표시", "개별 선호 선물 없음", "고정된 최애 선물 없음"], "th": ["คู่มือของขวัญวีรชน 6 ดาว", "ค้นหาวีรชน / ฉายา / ของขวัญ", "เลือกวีรชน", "วีรชน 6 ดาวทั้งหมด", "วีรชนที่ชอบของขวัญนี้", "ของขวัญทั้งหมด", "ความชอบ", "ชอบและชอบที่สุด", "ชอบที่สุดเท่านั้น", "ชอบเท่านั้น", "ล้างตัวกรอง", "ของขวัญที่วีรชน 6 ดาวทุกคนชอบ", "ชอบที่สุด", "ชอบ", "ไม่พบวีรชนที่ตรงกัน", "ไม่มีคำแปล จึงแสดงภาษาญี่ปุ่น", "ชอบของขวัญร่วม {n} ชนิดด้านบนด้วย", "แสดงวีรชน 6 ดาว {n} / {total} คน", "ไม่มีของขวัญที่ชอบเฉพาะตัว", "ไม่มีของขวัญที่ชอบที่สุดแบบตายตัว"], "vi": ["Quà tặng anh linh 6 sao", "Tìm anh linh / danh hiệu / quà", "Chọn anh linh", "Tất cả anh linh 6 sao", "Anh linh thích món quà này", "Tất cả quà", "Sở thích", "Thích và yêu thích nhất", "Chỉ yêu thích nhất", "Chỉ thích", "Xóa bộ lọc", "Quà mọi anh linh 6 sao đều thích", "Yêu thích nhất", "Thích", "Không tìm thấy anh linh phù hợp", "Chưa có bản dịch; hiển thị tiếng Nhật.", "Cũng thích {n} món quà chung ở trên.", "Hiển thị {n} / {total} anh linh 6 sao", "Không có quà thích riêng", "Không có quà yêu thích nhất cố định"]};
  const acquisitionUI={
    zh_tw:{version:'版本',pool:'卡池',source:'取得來源',paidPack:'付費禮包',original:'原版',swimsuit:'泳裝',christmas:'聖誕',journey:'勇躍壯途'},
    ja:{version:'バージョン',pool:'選定',source:'入手方法',paidPack:'有料パック',original:'通常',swimsuit:'水着',christmas:'クリスマス',journey:'旅装'},
    en:{version:'Version',pool:'Summoning pool',source:'Source',paidPack:'Paid pack',original:'Original',swimsuit:'Swimsuit',christmas:'Christmas',journey:'Journey'},
    ko:{version:'버전',pool:'소환',source:'획득 경로',paidPack:'유료 패키지',original:'기본',swimsuit:'수영복',christmas:'크리스마스',journey:'여행'}
  };
  function acquisitionInfo(hero){
    const info=hero.acquisition;if(!info)return null;
    const labels=acquisitionUI[lang],rows=[];
    if(info.version)rows.push([labels.version,labels[info.version]]);
    if(info.paidPack)rows.push([labels.source,labels.paidPack]);
    for(const pool of info.pools||[])rows.push([labels.pool,pool.translations[lang]||pool.translations.ja]);
    if(!rows.length)return null;
    const block=node('dl',null,'hero-acquisition');
    for(const [label,value] of rows){const row=node('div');row.append(node('dt',label),node('dd',value));block.append(row);}
    return block;
  }
  const visibleLanguages=['zh_tw','ja','en','ko'];
  let lang='zh_tw',data,names;
  try{const saved=localStorage.getItem('dfch-hero-language');if(visibleLanguages.includes(saved))lang=saved;else if(saved)localStorage.setItem('dfch-hero-language',lang);}catch{}
  const t=(i,vars={})=>Object.entries(vars).reduce((v,[k,x])=>v.replaceAll('{'+k+'}',x),ui[lang][i]);
  const normalize=value=>value.normalize('NFKC').trim().toLocaleLowerCase();
  function node(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
  const bondUI={
    zh_tw:{heading:'送禮加成',owns:'擁有',note:'以下為贈送 1 個道具的羈絆提升量；僅計入喜好與此神器，小數無條件捨去。',gain:'羈絆',base:'基礎',artifact:'神器',favorite:'喜愛',loved:'最愛'},
    ja:{heading:'贈り物ボーナス',owns:'所持',note:'贈り物1個あたりの絆上昇量。好みとこのアーティファクトのみを計算し、小数点以下は切り捨てます。',gain:'絆',base:'基礎',artifact:'アーティファクト',favorite:'好き',loved:'大好き'},
    en:{heading:'Gift bonus',owns:'Own',note:'Bond gained per gift, including preference and this artifact only. Fractions are rounded down.',gain:'Bond',base:'Base',artifact:'Artifact',favorite:'Liked',loved:'Loved'},
    ko:{heading:'선물 보너스',owns:'보유',note:'선물 1개당 인연 상승량입니다. 선호도와 이 아티팩트만 적용하며 소수점 이하는 버립니다.',gain:'인연',base:'기본',artifact:'아티팩트',favorite:'좋아함',loved:'매우 좋아함'}
  };
  let ownsBondStatue=false;
  try{ownsBondStatue=localStorage.getItem('dfch-hero-bond-statue')==='true';}catch{}
  function chips(ids,preference='favorite'){
    const list=node('ul',null,'gift-list'),text=bondUI[lang],rules=source.bondGains;
    for(const id of ids){
      const entry=node('li',null,'gift-shortcut-item'),jump=node('button',null,'gift-shortcut'),icon=node('img',null,'gift-icon'),detail=node('span',null,'gift-detail');
      jump.type='button';jump.setAttribute('aria-label',`${names.get(id)} → ${locationUI[lang][1]}`);
      jump.addEventListener('click',()=>openGiftLocation(id));
      icon.src=`./assets/gifts/${id}.webp`;icon.alt='';icon.width=36;icon.height=36;icon.loading='lazy';icon.addEventListener('error',()=>icon.remove(),{once:true});
      const base=rules.baseValues[id],multiplier=rules.preferenceMultipliers[preference],artifact=ownsBondStatue?rules.artifact.multiplier:1;
      const gain=Math.floor(base*multiplier*artifact);
      entry.dataset.gift=id;entry.dataset.bondGain=gain;
      detail.append(node('span',names.get(id),'gift-name'),node('strong',`${text.gain} +${gain}`,'gift-bond-gain'));
      jump.append(icon,detail);entry.append(jump);
      const recommendation=node('button',rankingUI[lang].shortcut,'gift-rank-shortcut');
      recommendation.type='button';
      recommendation.addEventListener('click',()=>openGiftRank(id));
      entry.append(recommendation);
      if(!source.items.find(i=>i.id===id).translations[lang])entry.title=t(15);
      list.append(entry);
    }
    return list;
  }

  const panel=$('heroPreferenceTitle').closest('.hero-preferences-panel'),languageLabel=node('label',null,'field hero-language'),language=node('select');language.id='heroLanguage';languageLabel.append(node('span','Language / 語言'),language);panel.querySelector('.panel-head').after(languageLabel);
  const bondPanel=node('section',null,'hero-bond-settings'),bondHeading=node('h3'),bondLabel=node('label',null,'hero-bond-toggle'),bondCheckbox=node('input'),bondLabelText=node('span'),bondNote=node('p',null,'unit-note');
  bondCheckbox.type='checkbox';bondCheckbox.id='heroBondStatue';bondCheckbox.checked=ownsBondStatue;
  bondLabel.append(bondCheckbox,bondLabelText);bondPanel.append(bondLabel);languageLabel.after(bondPanel);
  bondCheckbox.addEventListener('change',()=>{ownsBondStatue=bondCheckbox.checked;try{localStorage.setItem('dfch-hero-bond-statue',String(ownsBondStatue));}catch{}$('heroCommonGifts').replaceChildren(chips(data.commonFavorite));render();renderRank();});
  const locationUI={
    zh_tw:['英靈喜好','羈絆道具取得方式','搜尋道具／遠征地圖','全部遠征地圖','遠征地圖','找不到符合條件的道具','指定羈絆道具','全部羈絆道具','目前未收錄此道具的遠征地圖取得來源。'],
    ja:['英霊の好み','贈り物の入手方法','贈り物・遠征先を検索','すべての遠征先','遠征先','該当する贈り物がありません','贈り物を指定','すべての贈り物','この贈り物の遠征先での入手情報は未収録です。'],
    en:['Hero preferences','Where to find gifts','Search gift / sortie map','All sortie maps','Sortie maps','No matching gifts','Choose a gift','All gifts','No expedition acquisition location is listed for this gift.'],
    ko:['영령 선호도','선물 획득 방법','선물 / 원정 지도 검색','모든 원정 지도','원정 지도','일치하는 선물이 없습니다','선물 지정','모든 선물','이 선물의 원정 지도 획득 정보는 아직 등록되지 않았습니다.']
  };
  const guideBody=node('div'),locationBody=node('section'),rankBody=node('section'),guideNav=node('nav',null,'hero-guide-tabs'),heroTab=node('button'),locationTab=node('button'),rankTab=node('button');
  guideBody.id='heroGuideContent';locationBody.id='heroGiftLocations';rankBody.id='heroGiftRanking';
  locationBody.hidden=true;rankBody.hidden=true;
  // Shared statue selection stays above all three tabs rather than disappearing outside the first.
  const children=[...panel.children];for(const child of children){
    if(child!==panel.querySelector('.panel-head')&&child!==languageLabel&&child!==bondPanel)guideBody.append(child);
  }
  function showGuideTab(target){
    for(const [button,body] of [[heroTab,guideBody],[locationTab,locationBody],[rankTab,rankBody]]){
      body.hidden=target!==body;
      button.setAttribute('aria-pressed',String(target===body));
    }
  }
  for(const [button,target] of [[heroTab,guideBody],[locationTab,locationBody],[rankTab,rankBody]]){
    button.type='button';button.setAttribute('aria-controls',target.id);button.setAttribute('aria-pressed',String(button===heroTab));
    button.addEventListener('click',()=>showGuideTab(target));guideNav.append(button);
  }
  panel.append(guideNav,guideBody,locationBody,rankBody);
  const locationFilters=node('div',null,'hero-preference-filters'),locationSearchLabel=node('label',null,'field'),locationSearch=node('input'),locationItemLabel=node('label',null,'field'),locationItem=node('select'),locationMapLabel=node('label',null,'field'),locationMap=node('select'),locationList=node('div',null,'hero-preference-grid');
  locationSearch.type='search';locationSearch.id='giftLocationSearch';locationItem.id='giftLocationItem';locationMap.id='giftLocationMap';locationList.id='giftLocationResults';
  locationSearchLabel.append(node('span'),locationSearch);locationItemLabel.append(node('span'),locationItem);locationMapLabel.append(node('span'),locationMap);locationFilters.append(locationSearchLabel,locationItemLabel,locationMapLabel);locationBody.append(locationFilters,locationList);

  // The universal ranking (A) includes all six-star heroes.
  // The personal ranking (B) considers only the heroes the player checks.
  // Both modes use identical 3.16.1 gift-point math and share the statue toggle.
  const rankingUI={
    zh_tw:{tab:'贈送優先排名',heading:'羈絆道具贈送優先排名',chooseGift:'指定羈絆道具',all:'全部英靈效率',personal:'我的培養英靈',chosen:'已選 {n} 位培養英靈',hint:'依每次贈送 1 個道具的實際羈絆增加量排序；相同數值並列。並非戰鬥強度排名。',pick:'勾選想優先培養的英靈，系統會從你勾選的角色中推薦最有效率的贈送對象。',clear:'清除選擇',allHeroes:'全選英靈',noSelection:'請先勾選至少一位想培養的英靈，才會產生你的個人推薦。',noBase:'目前缺少這項道具的官方羈絆基礎值，無法計算排名。',best:'最高羈絆 +{gain}，共有 {n} 位英靈並列第一。',personalBest:'在你選擇的 {count} 位中，最高羈絆 +{gain}，共有 {n} 位並列第一。',preferenceNormal:'一般',preferenceFavorite:'喜愛',preferenceLoved:'最愛',gain:'羈絆 +{gain}',rank:'第 {n} 名',toGuide:'查看英靈喜好',toLocation:'查看取得方式',fromLocation:'查看贈送排名',shortcut:'推薦對象',selectedGift:'道具：{name}'},
    ja:{tab:'贈り物のおすすめ',heading:'贈り物の優先順位',chooseGift:'贈り物を指定',all:'全英霊の効率順',personal:'育成したい英霊',chosen:'育成対象：{n} 体',hint:'贈り物1個あたりの絆上昇量で順位付け。同点は同順位。戦闘性能の評価ではありません。',pick:'育成したい英霊を選ぶと、選択した英霊の中から効率の良い贈り先を提案します。',clear:'選択解除',allHeroes:'すべて選択',noSelection:'先に育成したい英霊を1体以上選んでください。',noBase:'この贈り物の基礎絆値が未収録です。',best:'最大絆 +{gain}：{n} 体が同率1位です。',personalBest:'選択した {count} 体の最大絆 +{gain}：{n} 体が同率1位です。',preferenceNormal:'通常',preferenceFavorite:'好き',preferenceLoved:'大好き',gain:'絆 +{gain}',rank:'{n} 位',toGuide:'英霊の好みを見る',toLocation:'入手方法を見る',fromLocation:'おすすめを表示',shortcut:'おすすめ',selectedGift:'贈り物：{name}'},
    en:{tab:'Gift priority',heading:'Gift-giving efficiency ranking',chooseGift:'Choose a gift',all:'All six-star heroes',personal:'My training targets',chosen:'{n} selected heroes',hint:'Ranked by bond points gained per gift; ties share a rank. Not a combat-strength ranking.',pick:'Select the heroes you want to train. Recommendations automatically rank only those heroes by gift efficiency.',clear:'Clear selection',allHeroes:'Select all',noSelection:'Select at least one hero to see your personal recommendation.',noBase:'No verified bond base value is available for this gift.',best:'Best bond gain +{gain}; {n} heroes tied for first.',personalBest:'Among your {count} selected heroes, best gain +{gain}; {n} tied for first.',preferenceNormal:'Normal',preferenceFavorite:'Liked',preferenceLoved:'Loved',gain:'Bond +{gain}',rank:'Rank {n}',toGuide:'View hero gifts',toLocation:'Where to find',fromLocation:'See gift ranking',shortcut:'Who to give',selectedGift:'Gift: {name}'},
    ko:{tab:'선물 추천 순위',heading:'선물 효율 순위',chooseGift:'선물 선택',all:'전체 영령',personal:'내 육성 영령',chosen:'육성 영령 {n}명 선택',hint:'선물 1개당 인연 증가량 순위입니다. 동점은 공동 순위이며, 전투력 순위가 아닙니다.',pick:'육성할 영령을 선택하면 선택한 영령 중 선물 효율이 가장 좋은 대상을 추천합니다.',clear:'선택 해제',allHeroes:'전체 선택',noSelection:'육성할 영령을 한 명 이상 선택하세요.',noBase:'이 선물의 공식 기본 인연 수치가 없습니다.',best:'최대 인연 +{gain}, {n}명이 공동 1위입니다.',personalBest:'선택한 {count}명 중 최대 인연 +{gain}, {n}명이 공동 1위입니다.',preferenceNormal:'일반',preferenceFavorite:'좋아함',preferenceLoved:'매우 좋아함',gain:'인연 +{gain}',rank:'{n}위',toGuide:'영령 선호도 보기',toLocation:'획득 방법 보기',fromLocation:'추천 순위 보기',shortcut:'추천 대상',selectedGift:'선물: {name}'}
  };
  const rankGroupUI={
    zh_tw:{count:'{n} 位英靈',more:'顯示剩餘 {n} 位',less:'收合多餘頭像',avatar:'查看 {name} 的英靈喜好',toggle:'展開或收合這個羈絆數值分類'},
    ja:{count:'英霊 {n} 体',more:'残り {n} 体を表示',less:'表示を減らす',avatar:'{name} の好みを見る',toggle:'この絆上昇量のグループを開閉'},
    en:{count:'{n} heroes',more:'Show {n} more',less:'Show fewer',avatar:'View {name} gift preferences',toggle:'Expand or collapse this bond-gain group'},
    ko:{count:'영령 {n}명',more:'나머지 {n}명 보기',less:'접기',avatar:'{name} 선호도 보기',toggle:'이 인연 증가량 그룹 펼치기 또는 접기'}
  };
  const RANK_PREVIEW_LIMIT=8;
  const ranking=node('section',null,'gift-rank-wrapper'),
    rankHeader=node('div',null,'gift-rank-header'),
    rankHeading=node('h3'),
    rankIntro=node('p',null,'unit-note'),
    rankModePicker=node('div',null,'gift-rank-modes'),
    rankAllButton=node('button',null,'gift-rank-mode'),
    rankPersonalButton=node('button',null,'gift-rank-mode'),
    rankGiftLabel=node('label',null,'field gift-rank-gift'),
    rankGiftText=node('span'),
    rankGift=node('select'),
    rankJumpLocation=node('button',null,'gift-rank-location'),
    rankSelectedPanel=node('section',null,'gift-rank-selected'),
    rankSelectedTop=node('div',null,'gift-rank-selected-top'),
    rankSelectedTitle=node('h4'),
    rankSelectedHint=node('p',null,'unit-note'),
    rankClearButton=node('button',null,'gift-rank-clear'),
    rankSelectAll=node('button',null,'gift-rank-clear'),
    rankHeroChoices=node('div',null,'gift-rank-hero-options'),
    rankSummary=node('p',null,'gift-rank-summary'),
    rankList=node('div',null,'gift-rank-list');
  rankGift.id='giftRankItem';rankAllButton.type='button';rankPersonalButton.type='button';
  rankJumpLocation.type='button';rankClearButton.type='button';rankSelectAll.type='button';
  rankSummary.setAttribute('role','status');rankSummary.setAttribute('aria-live','polite');
  rankHeader.append(rankHeading,rankIntro);rankModePicker.append(rankAllButton,rankPersonalButton);
  rankGiftLabel.append(rankGiftText,rankGift);
  rankSelectedTop.append(rankSelectedTitle,rankSelectAll,rankClearButton);
  rankSelectedPanel.append(rankSelectedTop,rankSelectedHint,rankHeroChoices);
  ranking.append(rankHeader,rankModePicker,rankGiftLabel,rankJumpLocation,rankSelectedPanel,rankSummary,rankList);
  rankBody.append(ranking);

  const rankGiftChoices=source.items.filter(item=>Number.isFinite(source.bondGains.baseValues[item.id]));
  const rankStorage='dfch-sixstar-training-heroes-v1',rankModeStorage='dfch-sixstar-rank-mode-v1',rankItemStorage='dfch-sixstar-rank-gift-v1';
  const heroIndices=new Set(source.heroes.map(hero=>hero.index));
  let chosenHeroes=new Set(),rankMode='all';
  try{
    const old=JSON.parse(localStorage.getItem(rankStorage));
    if(Array.isArray(old))chosenHeroes=new Set(old.filter(id=>Number.isInteger(id)&&heroIndices.has(id)));
    rankMode=localStorage.getItem(rankModeStorage)==='personal'?'personal':'all';
  }catch(_){}
  const firstRankGift=rankGiftChoices.find(item=>!common.has(item.id))||rankGiftChoices[0];
  let rankedGiftId=firstRankGift?.id||0;
  try{
    const saved=Number(localStorage.getItem(rankItemStorage));
    if(rankGiftChoices.some(item=>item.id===saved))rankedGiftId=saved;
  }catch(_){};
  function textRank(key,vars={}){
    return Object.entries(vars).reduce((s,[name,value])=>s.replaceAll('{'+name+'}',String(value)),rankingUI[lang][key]);
  }
  function saveTrainingHeroes(){
    try{localStorage.setItem(rankStorage,JSON.stringify([...chosenHeroes].sort((a,b)=>a-b)));}catch(_){}
  }
  function scrollToGuideTabs(){
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    guideNav.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
  }
  function openGiftRank(giftId){
    const id=Number(giftId);
    if(!rankGiftChoices.some(item=>item.id===id))return;
    rankedGiftId=id;rankGift.value=String(id);
    try{localStorage.setItem(rankItemStorage,String(id));}catch(_){}
    renderRank();showGuideTab(rankBody);scrollToGuideTabs();
  }
  function viewRankHero(hero){
    $('heroSearch').value='';$('heroSelect').value=String(hero.index);
    $('heroItemFilter').value='';$('heroPreferenceFilter').value='';
    showGuideTab(guideBody);render();scrollToGuideTabs();
  }
  function renderRankHeroes(){
    rankHeroChoices.replaceChildren();
    const tr=rankingUI[lang];
    for(const hero of data.heroes){
      const label=node('label',null,'gift-rank-hero-choice'),checkbox=node('input'),photo=node('img',null,'gift-rank-hero-image'),info=node('span',null,'gift-rank-hero-info');
      checkbox.type='checkbox';checkbox.value=String(hero.index);checkbox.checked=chosenHeroes.has(hero.index);
      photo.src='./assets/heroes/'+hero.key+'.webp';photo.alt='';photo.width=36;photo.height=36;photo.loading='lazy';photo.addEventListener('error',()=>photo.remove(),{once:true});
      info.append(node('strong',hero.name),node('small',hero.title));
      label.append(checkbox,photo,info);rankHeroChoices.append(label);
      checkbox.addEventListener('change',()=>{
        if(checkbox.checked)chosenHeroes.add(hero.index);else chosenHeroes.delete(hero.index);
        saveTrainingHeroes();renderRank();
      });
    }
    rankSelectedTitle.textContent=textRank('chosen',{n:chosenHeroes.size});
    rankSelectedHint.textContent=tr.pick;
  }
  function applyRankLanguage(){
    const labels=rankingUI[lang],current=rankedGiftId;
    rankTab.textContent=labels.tab;
    rankHeading.textContent=labels.heading;rankIntro.textContent=labels.hint;
    rankAllButton.textContent=labels.all;rankPersonalButton.textContent=labels.personal;
    rankGiftText.textContent=labels.chooseGift;
    rankGift.replaceChildren();
    for(const item of [...rankGiftChoices].sort((a,b)=>(a.translations[lang]||a.translations.ja).localeCompare(b.translations[lang]||b.translations.ja))){
      const option=node('option',item.translations[lang]||item.translations.ja);option.value=String(item.id);rankGift.append(option);
    }
    rankGift.value=String(current);
    rankJumpLocation.textContent=labels.toLocation;
    rankClearButton.textContent=labels.clear;rankSelectAll.textContent=labels.allHeroes;
    renderRankHeroes();renderRank();
  }
  function renderRank(){
    if(!data)return;
    const labels=rankingUI[lang],personal=rankMode==='personal';
    rankAllButton.setAttribute('aria-pressed',String(!personal));rankPersonalButton.setAttribute('aria-pressed',String(personal));
    rankSelectedPanel.hidden=!personal;
    rankSelectedTitle.textContent=textRank('chosen',{n:chosenHeroes.size});
    rankList.replaceChildren();
    const allowed=personal?chosenHeroes:null;
    const ranked=window.DFCHGiftRanking.evaluate(rankedGiftId,data.heroes,source.bondGains,ownsBondStatue,allowed);
    if(!ranked){rankSummary.textContent=labels.noBase;return;}
    if(personal&&!chosenHeroes.size){rankSummary.textContent=labels.noSelection;return;}
    rankSummary.textContent=textRank(personal?'personalBest':'best',{
      count:chosenHeroes.size,gain:ranked.best,n:ranked.winners.length
    });
    // A single +bond value represents a rank; show the heroes as a compact portrait grid.
    // Keep ties together and only reveal the best group by default.
    const groups=new Map();
    for(const row of ranked.rows){
      if(!groups.has(row.gain))groups.set(row.gain,{rank:row.rank,rows:[]});
      groups.get(row.gain).rows.push(row);
    }
    const groupLabels=rankGroupUI[lang];
    const groupText=(key,vars={})=>Object.entries(vars).reduce(
      (value,[name,text])=>value.replaceAll('{'+name+'}',String(text)),groupLabels[key]
    );
    let groupIndex=0;
    for(const [gain,group] of groups){
      const section=node('section',null,'gift-rank-group');
      if(groupIndex===0)section.classList.add('gift-rank-group-best');
      const toggle=node('button',null,'gift-rank-group-toggle');
      toggle.type='button';
      toggle.setAttribute('aria-label',groupLabels.toggle+': '+textRank('gain',{gain}));
      toggle.setAttribute('aria-expanded',String(groupIndex===0));
      const groupContent=node('div',null,'gift-rank-group-content');
      groupContent.id='giftRankGroup'+groupIndex;
      groupContent.hidden=groupIndex!==0;
      toggle.setAttribute('aria-controls',groupContent.id);
      const arrow=node('span',groupIndex===0?'▾':'▸','gift-rank-group-arrow');
      arrow.setAttribute('aria-hidden','true');
      toggle.append(
        node('strong',textRank('gain',{gain}),'gift-rank-group-gain'),
        node('span',groupText('count',{n:group.rows.length}),'gift-rank-group-count'),
        node('span',textRank('rank',{n:group.rank}),'gift-rank-group-position'),
        arrow
      );
      toggle.addEventListener('click',()=>{
        groupContent.hidden=!groupContent.hidden;
        toggle.setAttribute('aria-expanded',String(!groupContent.hidden));
        arrow.textContent=groupContent.hidden?'▸':'▾';
      });
      const portraits=node('div',null,'gift-rank-avatar-grid');
      const hiddenPortraits=[];
      for(const [index,row] of group.rows.entries()){
        const hero=row.hero;
        const avatar=node('button',null,'gift-rank-avatar');
        avatar.type='button';
        avatar.title=hero.title+' · '+labels['preference'+row.kind[0].toUpperCase()+row.kind.slice(1)];
        avatar.setAttribute('aria-label',groupText('avatar',{name:hero.name}));
        const portrait=node('img',null,'gift-rank-avatar-photo');
        portrait.src='./assets/heroes/'+hero.key+'.webp';
        portrait.width=64;portrait.height=64;portrait.alt='';
        portrait.loading='lazy';portrait.decoding='async';
        portrait.addEventListener('error',()=>portrait.remove(),{once:true});
        avatar.append(portrait,node('span',hero.name,'gift-rank-avatar-name'));
        avatar.addEventListener('click',()=>viewRankHero(hero));
        if(index>=RANK_PREVIEW_LIMIT){
          avatar.hidden=true;hiddenPortraits.push(avatar);
        }
        portraits.append(avatar);
      }
      groupContent.append(portraits);
      if(hiddenPortraits.length){
        const more=node('button',groupText('more',{n:hiddenPortraits.length}),'gift-rank-show-more');
        more.type='button';
        let expanded=false;
        more.setAttribute('aria-expanded','false');
        more.addEventListener('click',()=>{
          expanded=!expanded;
          for(const avatar of hiddenPortraits)avatar.hidden=!expanded;
          more.textContent=expanded?groupLabels.less:groupText('more',{n:hiddenPortraits.length});
          more.setAttribute('aria-expanded',String(expanded));
        });
        groupContent.append(more);
      }
      section.append(toggle,groupContent);
      rankList.append(section);
      groupIndex++;
    }
  }
  rankAllButton.addEventListener('click',()=>{
    rankMode='all';try{localStorage.setItem(rankModeStorage,rankMode);}catch(_){}
    renderRank();
  });
  rankPersonalButton.addEventListener('click',()=>{
    rankMode='personal';try{localStorage.setItem(rankModeStorage,rankMode);}catch(_){}
    renderRank();
  });
  rankGift.addEventListener('change',()=>{
    rankedGiftId=Number(rankGift.value);
    try{localStorage.setItem(rankItemStorage,String(rankedGiftId));}catch(_){}
    renderRank();
  });
  rankJumpLocation.addEventListener('click',()=>openGiftLocation(rankedGiftId));
  rankClearButton.addEventListener('click',()=>{
    chosenHeroes.clear();saveTrainingHeroes();renderRankHeroes();renderRank();
  });
  rankSelectAll.addEventListener('click',()=>{
    chosenHeroes=new Set(heroIndices);saveTrainingHeroes();renderRankHeroes();renderRank();
  });
  // Include all gifts shown on hero cards, even when expedition drop locations are unknown.
  const locationGiftChoices=[...new Map([...source.giftLocations.items,...source.items].map(item=>[item.id,item])).values()];
  function renderLocations(){
    const labels=locationUI[lang],query=normalize(locationSearch.value),selectedMap=Number(locationMap.value),selectedGift=Number(locationItem.value),locations=source.giftLocations;
    locationList.replaceChildren();
    for(const item of locationGiftChoices){
      if(selectedGift&&item.id!==selectedGift)continue;
      const name=item.translations[lang]||item.translations.ja,maps=locations.maps.filter(m=>m.gifts.includes(item.id));
      if(!maps.length&&!selectedGift&&!query)continue;
      if(selectedMap&&!maps.some(m=>m.id===selectedMap))continue;
      if(query&&!normalize([name,...maps.map(m=>m.translations[lang]||m.translations.ja)].join(' ')).includes(query))continue;
      const card=node('article',null,'hero-preference-card gift-location-card'),header=node('div',null,'gift-location-header'),icon=node('img',null,'gift-icon');
      icon.src=`./assets/gifts/${item.id}.webp`;icon.alt='';icon.width=48;icon.height=48;icon.loading='lazy';icon.addEventListener('error',()=>icon.remove(),{once:true});header.append(icon,node('h3',name));card.append(header);
      if(maps.length){
        card.append(node('h4',labels[4]));
        const list=node('ul',null,'gift-location-maps');for(const map of maps)list.append(node('li',map.translations[lang]||map.translations.ja));card.append(list);
      }else{
        card.append(node('p',labels[8],'gift-location-unlisted'));
      }
      if(rankGiftChoices.some(gift=>gift.id===item.id)){
        const rankLink=node('button',rankingUI[lang].fromLocation,'gift-location-rank-link');
        rankLink.type='button';rankLink.addEventListener('click',()=>openGiftRank(item.id));
        card.append(rankLink);
      }
      locationList.append(card);
    }
    if(!locationList.children.length)locationList.append(node('p',labels[5],'hero-empty'));
  }
  function applyLocationLanguage(){
    const labels=locationUI[lang],selectedMap=locationMap.value,selectedItem=locationItem.value;heroTab.textContent=labels[0];locationTab.textContent=labels[1];guideNav.setAttribute('aria-label',labels[1]);
    locationSearchLabel.firstChild.textContent=labels[2];locationSearch.placeholder=labels[2];
    locationItemLabel.firstChild.textContent=labels[6];locationItem.replaceChildren();const allItems=node('option',labels[7]);allItems.value='';locationItem.append(allItems);
    for(const item of [...locationGiftChoices].sort((a,b)=>(a.translations[lang]||a.translations.ja).localeCompare(b.translations[lang]||b.translations.ja))){
      const option=node('option',item.translations[lang]||item.translations.ja);option.value=item.id;locationItem.append(option);
    }
    locationItem.value=selectedItem;
    locationMapLabel.firstChild.textContent=labels[4];locationMap.replaceChildren();
    const allMaps=node('option',labels[3]);allMaps.value='';locationMap.append(allMaps);for(const map of source.giftLocations.maps){const option=node('option',map.translations[lang]||map.translations.ja);option.value=map.id;locationMap.append(option);}locationMap.value=selectedMap;renderLocations();applyRankLanguage();
  }
  function openGiftLocation(id){
    locationSearch.value='';locationMap.value='';locationItem.value=String(id);
    showGuideTab(locationBody);renderLocations();
    const reducedMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    guideNav.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
  }
  locationSearch.addEventListener('input',renderLocations);locationItem.addEventListener('change',renderLocations);locationMap.addEventListener('change',renderLocations);
  for(const [key,name] of visibleLanguages.map(key=>[key,source.languages[key]])){const o=node('option',name);o.value=key;language.append(o);}language.value=lang;
  function options(id,items,empty){const e=$(id),value=e.value;e.replaceChildren();const first=node('option',empty);first.value='';e.append(first);for(const [key,label] of items){const o=node('option',label);o.value=key;e.append(o);}e.value=value;}
  function applyLanguage(){
    data={...source,heroes:source.heroes.map(h=>{const tr=h.translations[lang],ja=h.translations.ja;return {...h,name:tr.name||ja.name,title:tr.title||ja.title,fallback:!tr.name||!tr.title};}),items:source.items.map(i=>({...i,name:i.translations[lang]||i.translations.ja}))};names=new Map(data.items.map(i=>[i.id,i.name]));
    bondHeading.textContent=bondUI[lang].heading;bondLabelText.textContent=`${bondUI[lang].owns} ${source.bondGains.artifact.translations[lang]}`;bondNote.textContent=bondUI[lang].note;
    panel.lang=lang.replace('_','-');$('heroPreferenceTitle').textContent=t(0);
    for(const [id,i] of [['heroSearch',1],['heroSelect',2],['heroItemFilter',4],['heroPreferenceFilter',6]])$(id).previousElementSibling.textContent=t(i);
    $('heroSearch').placeholder=t(1);$('heroClearFilters').textContent=t(10);panel.querySelector('.hero-common-gifts h3').textContent=t(11);
    options('heroSelect',data.heroes.map(h=>[h.index,`${h.name}｜${h.title}`]),t(3));options('heroItemFilter',[...data.items].sort((a,b)=>a.name.localeCompare(b.name)).map(i=>[i.id,i.name]),t(5));options('heroPreferenceFilter',[['loved',t(8)],['favorite',t(9)]],t(7));
    $('heroCommonGifts').replaceChildren(chips(data.commonFavorite));
    // Secondary explanatory text is Chinese-only, so hide it in other languages.
    for(const e of guideBody.querySelectorAll(':scope > .helper,:scope > .unit-note,.hero-common-gifts > .unit-note'))e.hidden=lang!=='zh_tw';
    panel.querySelector('.status-chip').textContent='3.16.0';
    const header=document.querySelector('.hero-guide-header');if(header){header.querySelector('h1').textContent=t(0);header.querySelector('.helper').hidden=lang!=='zh_tw';document.title=t(0);document.documentElement.lang=lang.replace('_','-');}
    applyLocationLanguage();render();
  }
  function render(){
    const query=normalize($('heroSearch').value),selected=$('heroSelect').value,item=Number($('heroItemFilter').value),kind=$('heroPreferenceFilter').value;
    const result=data.heroes.filter(h=>{
      const ids=kind==='loved'?h.loved:kind==='favorite'?h.favorite:[...h.loved,...h.favorite];
      return (!selected||h.index===Number(selected))&&(!item||ids.includes(item))&&(!query||normalize([h.name,h.title,...ids.map(id=>names.get(id))].join(' ')).includes(query));
    });
    const root=$('heroPreferenceResults');root.replaceChildren();$('heroPreferenceCount').textContent=t(17,{n:result.length,total:data.heroes.length});
    if(!result.length){root.append(node('p',t(14),'hero-empty'));return;}
    for(const h of result){
      const card=node('article',null,'hero-preference-card');card.dataset.hero=h.index;
      const header=node('div',null,'hero-card-header'),portrait=node('img',null,'hero-portrait'),identity=node('div',null,'hero-identity');
      portrait.src=`./assets/heroes/${h.key}.webp`;portrait.alt=`${h.title} ${h.name}`;portrait.width=112;portrait.height=112;portrait.loading='lazy';portrait.decoding='async';
      portrait.addEventListener('error',()=>{const fallback=node('span','圖片暫時無法載入','hero-portrait-fallback');portrait.replaceWith(fallback);},{once:true});
      identity.append(node('p',h.title,'hero-title'),node('h3',h.name),node('span','★★★★★★','hero-stars'));
      if(h.key==='frigg'){
        const trigger=node('button',null,'frigg-avatar-trigger');trigger.type='button';
        const text={zh_tw:'能力測試',ja:'能力テスト',en:'Ability test',ko:'능력 테스트'}[lang]||'能力測試';
        trigger.setAttribute('aria-label',h.name+' · '+text);
        trigger.append(portrait,node('span',text,'frigg-avatar-trigger-label'));
        trigger.addEventListener('click',()=>window.DFCHFriggAbility?.open({lang}));
        header.append(trigger,identity);
      }else header.append(portrait,identity);
      const acquisition=acquisitionInfo(h);if(acquisition)header.append(acquisition);card.append(header);
      if(h.fallback)card.append(node('p',t(15),'unit-note'));
      const loved=node('section',null,'gift-group loved');loved.append(node('h4',t(12)),h.loved.length?chips(h.loved,'loved'):node('p',t(19)));card.append(loved);
      const favorite=node('section',null,'gift-group favorite'),specific=h.favorite.filter(id=>!common.has(id));
      favorite.append(node('h4',t(13)),specific.length?chips(specific):node('p',t(18)),node('p',t(16,{n:common.size}),'unit-note'));card.append(favorite);root.append(card);
    }
  }
  $('heroSearch').addEventListener('input',render);
  for(const id of ['heroSelect','heroItemFilter','heroPreferenceFilter'])$(id).addEventListener('change',render);
  $('heroClearFilters').addEventListener('click',()=>{for(const id of ['heroSearch','heroSelect','heroItemFilter','heroPreferenceFilter'])$(id).value='';render();$('heroSearch').focus();});
  language.addEventListener('change',()=>{lang=language.value;try{localStorage.setItem('dfch-hero-language',lang);}catch{}applyLanguage();});
  applyLanguage();
})();
