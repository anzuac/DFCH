/* Read-only rendering of verified APK 3.18.0 banner assets across Recruit tabs. */
(() => {'use strict';
 const keys=['delicious_first_half','delicious_second_half','delicious_final'];
 const asset={delicious_first_half:'banner-P1.webp',delicious_second_half:'banner-P2.webp',delicious_final:'banner-P3.webp'};
 for(const selectId of ['pool','analysisPool','abilityPool','targetPool']){
  const input=document.getElementById(selectId);
  if(!input)continue;
  const img=document.createElement('img');
  img.className='collab-318-pool-banner';img.loading='lazy';img.decoding='async';img.hidden=true;
  const label=input.closest('label');
  if(label)label.insertAdjacentElement('afterend',img);
  else input.insertAdjacentElement('afterend',img);
  const update=()=>{
   const key=window.DFCHRecruitConfig?.keys?.[Number(input.value)];
   if(!keys.includes(key)){img.hidden=true;img.removeAttribute('src');return;}
   const newSrc='./images/collab-318/'+asset[key];
   if(img.getAttribute('src')!==newSrc)img.setAttribute('src',newSrc);
   img.alt='迷宮飯 '+key.replace('delicious_','')+' 招募池官方橫幅';
   img.hidden=false;
  };
  img.onerror=()=>{img.hidden=true;};
  input.addEventListener('change',update);
  update();
 }
})();
