(() => {
  'use strict';
  const targets={
    'dfch-bond30-height':'bond30EmbeddedFrame',
    'dfch-team-height':'teamEmbeddedFrame',
    'dfch-recruit-height':'recruitEmbeddedFrame'
  };
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin)return;
    const id=targets[e.data?.type];if(!id)return;
    const frame=document.getElementById(id);
    if(!frame||e.source!==frame.contentWindow)return;
    const height=Number(e.data.height);
    if(Number.isFinite(height)&&height>=350&&height<=30000)frame.style.height=Math.ceil(height)+'px';
  });
})();
