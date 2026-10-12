(() => {
  'use strict';
  const data=window.DFCHHeroPreferences,$=id=>document.getElementById(id),names=new Map(data.items.map(i=>[i.id,i.name])),common=new Set(data.commonFavorite);
  const normalize=value=>value.normalize('NFKC').trim().toLocaleLowerCase();
  function node(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
  function chips(ids){const list=node('ul',null,'gift-list');for(const id of ids){const entry=node('li'),icon=node('img',null,'gift-icon');icon.src=`./assets/gifts/${id}.webp`;icon.alt='';icon.width=36;icon.height=36;icon.loading='lazy';icon.decoding='async';icon.addEventListener('error',()=>icon.remove(),{once:true});entry.append(icon,node('span',names.get(id)));list.append(entry);}return list;}
  $('heroCommonGifts').append(chips(data.commonFavorite));
  for(const h of data.heroes){const option=node('option',`${h.name}｜${h.title}`);option.value=String(h.index);$('heroSelect').append(option);}
  for(const item of [...data.items].sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant'))){const option=node('option',item.name);option.value=String(item.id);$('heroItemFilter').append(option);}
  function render(){
    const query=normalize($('heroSearch').value),selected=$('heroSelect').value,item=Number($('heroItemFilter').value),kind=$('heroPreferenceFilter').value;
    const result=data.heroes.filter(h=>{
      const ids=kind==='loved'?h.loved:kind==='favorite'?h.favorite:[...h.loved,...h.favorite];
      return (!selected||h.index===Number(selected))&&(!item||ids.includes(item))&&(!query||normalize([h.name,h.title,...ids.map(id=>names.get(id))].join(' ')).includes(query));
    });
    const root=$('heroPreferenceResults');root.replaceChildren();$('heroPreferenceCount').textContent=`顯示 ${result.length}／${data.heroes.length} 位六星英靈`;
    if(!result.length){root.append(node('p','找不到符合條件的英靈，請調整搜尋或按「清除篩選」。','hero-empty'));return;}
    for(const h of result){
      const card=node('article',null,'hero-preference-card');card.dataset.hero=h.index;
      const header=node('div',null,'hero-card-header'),portrait=node('img',null,'hero-portrait'),identity=node('div',null,'hero-identity');
      portrait.src=`./assets/heroes/${h.key}.webp`;portrait.alt=`${h.title} ${h.name}`;portrait.width=112;portrait.height=112;portrait.loading='lazy';portrait.decoding='async';
      portrait.addEventListener('error',()=>{const fallback=node('span','圖片暫時無法載入','hero-portrait-fallback');portrait.replaceWith(fallback);},{once:true});
      identity.append(node('p',h.title,'hero-title'),node('h3',h.name),node('span','★★★★★★','hero-stars'));header.append(portrait,identity);card.append(header);
      if(h.nameLanguage!=='zh_tw'||h.titleLanguage!=='zh_tw')card.append(node('p','官方繁中名稱尚未提供，顯示日文原名。','unit-note'));
      const loved=node('section',null,'gift-group loved');loved.append(node('h4','最愛'),h.loved.length?chips(h.loved):node('p','未設定固定最愛物品'));card.append(loved);
      const favorite=node('section',null,'gift-group favorite'),specific=h.favorite.filter(id=>!common.has(id));
      favorite.append(node('h4','喜愛'),specific.length?chips(specific):node('p','無個別喜愛物品'),node('p',`另喜愛上方 ${common.size} 種通用物品。`,'unit-note'));card.append(favorite);root.append(card);
    }
  }
  $('heroSearch').addEventListener('input',render);
  for(const id of ['heroSelect','heroItemFilter','heroPreferenceFilter'])$(id).addEventListener('change',render);
  $('heroClearFilters').addEventListener('click',()=>{for(const id of ['heroSearch','heroSelect','heroItemFilter','heroPreferenceFilter'])$(id).value='';render();$('heroSearch').focus();});
  render();
})();
