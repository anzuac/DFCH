(() => {
 'use strict';
 const E=window.DFCHTrainingEngine,PRESETS=window.DFCHTrainingPresets;
 if(!E||!Array.isArray(PRESETS)||PRESETS.length!==23){document.body.textContent='英靈養成資料載入失敗';return;}
 const $=id=>document.getElementById(id),SKEY='dfch-developer-training-v1';
 const modes=['X1','X10','MAX','RANK'];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const num=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function load(){try{const s=JSON.parse(localStorage.getItem(SKEY));return s&&typeof s==='object'?s:null}catch{return null}}
 const state=Object.assign({source:'preset',heroId:PRESETS[0].id,mode:'X1',records:{}},load()||{});
 if(!['custom','preset'].includes(state.source))state.source='preset';
 if(!PRESETS.some(x=>x.id===Number(state.heroId)))state.heroId=PRESETS[0].id;
 if(!modes.includes(state.mode))state.mode='X1';
 if(!state.records||typeof state.records!=='object'||Array.isArray(state.records))state.records={};
 const hero=()=>PRESETS.find(x=>x.id===Number(state.heroId))||PRESETS[0];
 const recordKey=()=>state.source==='custom'?'custom':'hero-'+hero().id;
 function makeRecord(){
  const initial=state.source==='custom'?Array(11).fill(50):hero().levels.slice();
  return {initial:initial,current:initial.slice(),fruit:Array(11).fill(0),used:Array(11).fill(0),points:0,cap:'SSS',label:'自訂英靈'};
 }
 function getRecord(){
  const k=recordKey();let r=state.records[k];
  if(!r||!Array.isArray(r.current)||r.current.length!==11)r=makeRecord();
  if(state.source==='preset')r.initial=hero().levels.slice();
  else if(!Array.isArray(r.initial)||r.initial.length!==11)r.initial=Array(11).fill(50);
  r.initial=r.initial.map(x=>Math.fround(clamp(num(x,50),0,99.9)));
  r.current=r.current.map((x,i)=>Math.fround(clamp(num(x,r.initial[i]),r.initial[i],119.9)));
  r.fruit=(Array.isArray(r.fruit)&&r.fruit.length===11?r.fruit:Array(11).fill(0)).map(x=>Math.trunc(clamp(num(x),0,10000)));
  r.used=(Array.isArray(r.used)&&r.used.length===11?r.used:Array(11).fill(0)).map(x=>Math.trunc(clamp(num(x),0,100000)));
  r.points=Math.trunc(clamp(num(r.points),0,100000));
  if(!Object.prototype.hasOwnProperty.call(E.CAPS,r.cap))r.cap='SSS';
  if(typeof r.label!=='string')r.label='自訂英靈';
  state.records[k]=r;return r;
 }
 function save(){try{localStorage.setItem(SKEY,JSON.stringify(state))}catch{}}
 function portrait(h){const img=$('portrait');if(h){img.hidden=false;img.src='../assets/heroes/'+encodeURIComponent(h.key)+'.webp';img.alt=h.name;img.onerror=()=>{img.hidden=true}}else{img.removeAttribute('src');img.hidden=true}}
 function render(){
  const p=state.source==='preset'?hero():null,r=getRecord();
  document.querySelectorAll('input[name="source"]').forEach(x=>x.checked=x.value===state.source);
  $('presetSelectLabel').hidden=!p;$('customNameLabel').hidden=!!p;$('customBase').hidden=!!p;
  $('heroChoice').value=String(state.heroId);$('customName').value=r.label;
  $('heroName').textContent=p?p.name:(r.label||'自訂英靈');
  $('heroTitle').textContent=p?p.title:'自行設定的能力模板';
  $('starText').textContent=p?'★★★★★★':'CUSTOM';
  portrait(p);$('availableSp').value=r.points;$('rankCap').value=r.cap;
  document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===state.mode;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
  $('customFields').innerHTML=!p?E.NAMES.map((n,i)=>'<label>'+esc(n)+'<input type="number" data-initial="'+i+'" min="0" max="99.9" step="0.1" inputmode="decimal" value="'+r.initial[i]+'"></label>').join(''):'';
  const ignored=new Set(p?.ignored||[]);
  $('statusList').innerHTML=E.NAMES.map((n,i)=>{
   const skip=ignored.has(i),base=r.initial[i],current=r.current[i],fruit=r.fruit[i];
   const L=skip?0:E.totalLevel(base,current,fruit,r.cap);
   const rank=skip?0:E.rankOf(L),label=skip?'—':E.RANKS[rank];
   const value=skip?'不適用':E.show(i,E.valueFromLevel(i,L));
   const preview=skip?null:E.simulate(base,current,fruit,r.points,state.mode,r.cap);
   const cost=preview?.cost||0,active=!!preview?.affordable;
   const actionLabel=preview?.rankUp?'超強化':'強化';
   const btnText=cost?'<span>'+actionLabel+'</span><strong>'+cost+'</strong>':'<span>已達上限</span>';
   const percent=clamp(L/119.9*100,0,100);
   return '<article class="ability-row'+(skip?' is-ignored':'')+'">'+
    '<span class="ability-icon" aria-hidden="true">'+E.ICONS[i]+'</span>'+
    '<strong class="grade grade-'+rank+'">'+label+'</strong>'+
    '<div class="ability-main"><div class="ability-head"><span class="ability-name">'+esc(n)+'</span><strong class="ability-value">'+esc(value)+'</strong></div>'+
    '<div class="ability-meta"><label class="fruit-field">果實 <input type="number" data-fruit="'+i+'" min="0" max="10000" step="1" inputmode="numeric" value="'+fruit+'"'+(skip?' disabled':'')+' aria-label="'+esc(n)+'果實數量"> 顆</label><span class="used-sp">已用 '+r.used[i]+' SP</span></div>'+
    '<div class="ability-track" role="progressbar" aria-label="'+esc(n)+'能力內部等級" aria-valuemin="0" aria-valuemax="119.9" aria-valuenow="'+L.toFixed(2)+'"><div class="ability-fill grade-'+rank+'" style="width:'+percent.toFixed(2)+'%"></div></div></div>'+
    '<button type="button" class="train-button'+(preview?.rankUp?' rank-up':'')+'" data-train="'+i+'"'+(!active?' disabled':'')+' aria-label="'+esc(n)+'，'+esc(actionLabel)+'，需要 '+cost+' 點能力點數">'+btnText+'</button></article>';
  }).join('');
  save();reportHeight();
 }
 const notice=msg=>{$('feedback').textContent=msg};
 function spend(index){
  const r=getRecord(),p=state.source==='preset'?hero():null;if(p?.ignored.includes(index))return;
  const result=E.simulate(r.initial[index],r.current[index],r.fruit[index],r.points,state.mode,r.cap);
  if(!result.affordable){notice('能力點數不足，或已達能力上限。');return}
  r.current[index]=result.current;r.used[index]+=result.cost;r.points-=result.cost;
  const name=E.NAMES[index],rank=E.RANKS[E.rankOf(result.total)];
  notice(name+' 已消耗 '+result.cost+' SP，目前評級 '+rank+'。');render();
 }
 $('heroChoice').innerHTML=PRESETS.map(p=>'<option value="'+p.id+'">'+esc(p.name+'・'+p.title)+'</option>').join('');
 document.querySelectorAll('input[name="source"]').forEach(x=>x.addEventListener('change',()=>{state.source=x.value;notice('');render()}));
 $('heroChoice').addEventListener('change',e=>{state.heroId=Number(e.target.value);notice('');render()});
 $('customName').addEventListener('change',e=>{getRecord().label=e.target.value.slice(0,32)||'自訂英靈';render()});
 $('availableSp').addEventListener('change',e=>{getRecord().points=Math.trunc(clamp(num(e.target.value),0,100000));render()});
 $('rankCap').addEventListener('change',e=>{getRecord().cap=e.target.value;render()});
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;render()}));
 $('customFields').addEventListener('change',e=>{
  const field=e.target.closest('[data-initial]');if(!field)return;
  const i=Number(field.dataset.initial),r=getRecord();
  r.initial[i]=Math.fround(clamp(num(field.value,50),0,99.9));r.current[i]=r.initial[i];r.used[i]=0;
  notice(E.NAMES[i]+' 的初始能力已修改；該項 SP 強化進度已歸零。');render();
 });
 $('statusList').addEventListener('change',e=>{
  const field=e.target.closest('[data-fruit]');if(!field)return;
  const i=Number(field.dataset.fruit),r=getRecord();
  r.fruit[i]=Math.trunc(clamp(num(field.value),0,10000));notice('');render();
 });
 $('statusList').addEventListener('click',e=>{
  const b=e.target.closest('[data-train]');if(b&&!b.disabled)spend(Number(b.dataset.train));
 });
 $('resetTraining').addEventListener('click',()=>{
  if(!window.confirm('重置這位英靈的果實與 SP 強化紀錄？'))return;
  const r=getRecord();// A simulation reset refunds SP previously spent in this local simulation.
  const refund=r.used.reduce((a,b)=>a+b,0);
  r.current=r.initial.slice();r.fruit=Array(11).fill(0);r.used=Array(11).fill(0);
  r.points=Math.min(100000,r.points+refund);
  notice('已重置此英靈的模擬強化。');render();
 });
 function reportHeight(){requestAnimationFrame(()=>{try{parent.postMessage({type:'dfch-training-height',height:Math.ceil(document.documentElement.scrollHeight)+16},location.origin)}catch{}})}
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(reportHeight).observe(document.body);
 window.addEventListener('resize',reportHeight);window.addEventListener('load',reportHeight);
 render();
})();
