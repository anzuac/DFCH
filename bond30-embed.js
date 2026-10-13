(() => {
  'use strict';
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||e.data?.type!=='dfch-bond30-height')return;
    const frame=document.getElementById('bond30EmbeddedFrame');
    if(!frame||e.source!==frame.contentWindow)return;
    const height=Number(e.data.height);
    if(Number.isFinite(height)&&height>=350&&height<=30000)frame.style.height=Math.ceil(height)+'px';
  });
})();