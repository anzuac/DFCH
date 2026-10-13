(() => {
  'use strict';
  if(window.parent===window)return;
  let previous=0;
  function report(){
    const main=document.querySelector('main.container');if(!main)return;
    const h=Math.ceil(main.getBoundingClientRect().bottom-document.body.getBoundingClientRect().top+16);
    if(!Number.isFinite(h)||h<=0||h===previous)return;
    previous=h;
    window.parent.postMessage({type:'dfch-bond30-height',height:h},location.origin);
  }
  window.addEventListener('load',report);
  document.addEventListener('DOMContentLoaded',()=>{
    report();
    if(typeof ResizeObserver!=='undefined'){
      const main=document.querySelector('main.container');
      if(main)new ResizeObserver(report).observe(main);
    }
  });
})();