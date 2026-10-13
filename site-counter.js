/* One D1 page-view POST per browser tab session, shared across all public tools. */
(() => {
  'use strict';
  if(location.hostname!=='dfch.pages.dev')return;
  const flag='dfch-site-views-counted-v1';
  const cache='dfch-last-view-count-v1';
  try{
    if(sessionStorage.getItem(flag)==='1')return;
    sessionStorage.setItem(flag,'1'); // First navigation cannot be counted twice.
  }catch(_){/* Private browsers without sessionStorage cannot guarantee de-duplication. */}
  fetch('/api/guide-views',{method:'POST',credentials:'omit',cache:'no-store',
    signal:typeof AbortSignal.timeout==='function'?AbortSignal.timeout(8000):undefined})
    .then(r=>r.ok?r.json():null).then(data=>{
      if(!Number.isSafeInteger(data?.views)||data.views<0)return;
      try{sessionStorage.setItem(cache,String(data.views));}catch(_){}
      window.dispatchEvent(new CustomEvent('dfch:views',{detail:{views:data.views}}));
    }).catch(()=>{});
})();