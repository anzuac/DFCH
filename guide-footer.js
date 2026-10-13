(() => {
 'use strict';
 const footer=document.createElement('footer');footer.className='guide-footer';
 const updated=document.createElement('p'),visits=document.createElement('p');footer.append(updated,visits);document.querySelector('.app-shell').append(footer);
 const copy={zh_tw:['最後更新','累計瀏覽','次'],ja:['最終更新','累計閲覧','回'],en:['Last updated','Total views',''],ko:['최근 업데이트','누적 조회','회']};
 const stamp=document.querySelector('meta[name="dfch-updated-at"]')?.content;
 let count=null;
 try{
  const saved=sessionStorage.getItem('dfch-last-view-count-v1');
  if(saved!==null&&Number.isSafeInteger(Number(saved))&&Number(saved)>=0)count=Number(saved);
 }catch{}
 function render(){
  const lang=document.getElementById('heroLanguage')?.value||'zh_tw',labels=copy[lang]||copy.zh_tw;
  let date='—';
  if(stamp&&!Number.isNaN(Date.parse(stamp))){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(stamp));const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));date=`${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute} (UTC+8)`;}
  updated.textContent=`${labels[0]}：${date}`;visits.textContent=`${labels[1]}：${count===null?'—':count.toLocaleString()}${count===null?'':labels[2]}`;
 }
 document.getElementById('heroLanguage')?.addEventListener('change',render);render();
 window.addEventListener('dfch:views',event=>{
  if(Number.isSafeInteger(event.detail?.views)&&event.detail.views>=0){
   count=event.detail.views;render();
  }
 });
})();
