/* Cloudflare-only recruit localization. No changes to drawing or stored data. */
(() => {
  'use strict';
  const langs=['zh_tw','ja','en','ko'], key='dfch-hero-language';
  const dictionary=window.DFCHRecruitTranslations||{};
  const official=window.DFCHOfficialLabels||{};
  const entries={...dictionary,...official};
  const groups=new Map();
  for(const source of Object.keys(entries)){
    if(!source)continue;
    const head=source[0];
    const arr=groups.get(head)||[];
    arr.push(source);groups.set(head,arr);
  }
  for(const words of groups.values())words.sort((a,b)=>b.length-a.length);
  const cache=new Map(),originText=new WeakMap(),originAttrs=new WeakMap();
  let language='zh_tw',queued=false;
  const getLanguage=()=>{
    try{const stored=localStorage.getItem(key);return langs.includes(stored)?stored:'zh_tw';}
    catch{return 'zh_tw';}
  };
  function sourceTranslate(value,lang=language){
    const source=String(value??'');
    if(lang==='zh_tw'||!source)return source;
    const k=lang+'\u0000'+source;
    if(cache.has(k))return cache.get(k);
    const direct=entries[source]?.[lang];
    if(direct){cache.set(k,direct);return direct;}
    let out='';
    for(let i=0;i<source.length;){
      const words=groups.get(source[i])||[];
      let hit=null;
      for(const word of words){
        if(source.startsWith(word,i)&&entries[word]?.[lang]){hit=word;break;}
      }
      if(hit){out+=entries[hit][lang];i+=hit.length;}
      else out+=source[i++];
    }
    if(cache.size>6000)cache.clear();
    cache.set(k,out);return out;
  }
  function scanText(root){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(['SCRIPT','STYLE','CODE','PRE','TEXTAREA'].includes(node.parentElement?.tagName))continue;
      let entry=originText.get(node);
      if(!entry||node.nodeValue!==entry.rendered){
        entry={source:node.nodeValue,rendered:node.nodeValue};
        originText.set(node,entry);
      }
      const translated=sourceTranslate(entry.source);
      if(node.nodeValue!==translated)node.nodeValue=translated;
      entry.rendered=translated;
    }
  }
  function scanAttributes(root){
    const nodes=[root,...root.querySelectorAll('[placeholder],[title],[aria-label],[alt]')];
    for(const el of nodes){
      if(!el?.getAttribute)continue;
      let map=originAttrs.get(el);
      if(!map){map={};originAttrs.set(el,map);}
      for(const attr of ['placeholder','title','aria-label','alt']){
        if(!el.hasAttribute(attr))continue;
        const current=el.getAttribute(attr);
        if(!map[attr]||current!==map[attr].rendered){
          map[attr]={source:current,rendered:current};
        }
        const next=sourceTranslate(map[attr].source);
        if(current!==next)el.setAttribute(attr,next);
        map[attr].rendered=next;
      }
    }
  }
  function roots(){
    const result=[document.querySelector('main.container')];
    for(const dialog of document.querySelectorAll('dialog')){
      if(!result[0]?.contains(dialog))result.push(dialog);
    }
    return result.filter(Boolean);
  }
  function refresh(){
    if(!document.body)return;
    for(const root of roots()){scanText(root);scanAttributes(root);}
    document.documentElement.lang=({
      zh_tw:'zh-Hant',ja:'ja',en:'en',ko:'ko'
    })[language]||'zh-Hant';
    document.title=sourceTranslate('英靈抽取模擬器 V2.6.0｜DFCH');
  }
  function schedule(){
    if(queued)return;
    queued=true;
    if(typeof requestAnimationFrame==='function'){
      requestAnimationFrame(()=>{queued=false;refresh();});
    }else queueMicrotask(()=>{queued=false;refresh();});
  }
  function setLanguage(next){
    language=langs.includes(next)?next:'zh_tw';
    schedule();
  }
  window.DFCHRecruitI18n=Object.freeze({
    getLanguage:()=>language,
    sourceTranslate,
    matchesSkill:(chinese,query)=>{
      const q=String(query||'').trim().toLowerCase();
      if(!q)return true;
      return String(chinese).toLowerCase().includes(q)
        ||sourceTranslate(chinese).toLowerCase().includes(q);
    },
    refresh:schedule
  });
  window.addEventListener('dfch:language-change',e=>setLanguage(e.detail?.language));
  window.addEventListener('storage',e=>{
    if(e.key===key)setLanguage(getLanguage());
  });
  // Confirm dialogs are created by browser chrome, not DOM nodes.
  const nativeConfirm=window.confirm?.bind(window);
  if(nativeConfirm){
    window.confirm=message=>nativeConfirm(sourceTranslate(message));
  }
  function start(){
    language=getLanguage();
    const observer=new MutationObserver(records=>{
      if(records.some(r=>r.type==='childList'
          ||(r.type==='characterData'
            &&(!originText.has(r.target)
              ||originText.get(r.target).rendered!==r.target.nodeValue))))
        schedule();
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    schedule();
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else start();
})();
