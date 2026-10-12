(() => {
 'use strict';
 const footer=document.createElement('footer');footer.className='guide-footer';
 const updated=document.createElement('p'),visits=document.createElement('p');footer.append(updated,visits);document.querySelector('.app-shell').append(footer);
 const copy={zh_tw:['最後更新','累計瀏覽','次'],ja:['最終更新','累計閲覧','回'],en:['Last updated','Total views',''],ko:['최근 업데이트','누적 조회','회']};
 const stamp=document.querySelector('meta[name="dfch-updated-at"]')?.content;
 let count=null;
 function render(){
  const lang=document.getElementById('heroLanguage')?.value||'zh_tw',labels=copy[lang]||copy.zh_tw;
  let date='—';
  if(stamp&&!Number.isNaN(Date.parse(stamp))){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(stamp));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));date=`${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute} (UTC+8)`;}
  updated.textContent=`${labels[0]}：${date}`;visits.textContent=`${labels[1]}：${count===null?'—':count.toLocaleString()}${count===null?'':labels[2]}`;
 }
 document.getElementById('heroLanguage')?.addEventListener('change',render);render();
 // Exactly one request per full page load; tab and language changes only render.
 if(location.hostname==='dfch.pages.dev')fetch('/api/guide-views',{method:'POST',cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)})
  .then(r=>r.ok?r.json():null).then(data=>{if(Number.isSafeInteger(data?.views)&&data.views>=0){count=data.views;render();}}).catch(()=>{});
})();
