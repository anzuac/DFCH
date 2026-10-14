if(window.parent!==window)document.body.classList.add("party-embedded");
/* Team configuration, UI, calculations and persistence. */
const KEYS=['禁斷世界的介入者 I','禁斷世界的介入者 II','禁斷世界的介入者 III','貪欲 I','貪欲 II','貪欲 III'];

/* Published official ability icons. Sources: DFCH / Bond30 and six-star ability assets. */
const OFFICIAL_SKILL_ICONS={
 '禁斷世界的介入者 I':'../bond30/assets/icons/303000900.png',
 '禁斷世界的介入者 II':'../bond30/assets/icons/303000903.png',
 '禁斷世界的介入者 III':'../bond30/assets/icons/303000904.png',
 '貪欲 I':'../bond30/assets/icons/303000709.png',
 '貪欲 II':'../bond30/assets/icons/303000722.png',
 '貪欲 III':'./assets/greed-iii.png',
 '深淵世界的解放者':'./assets/abyss-liberator.png',
 '大海的支配者':'./assets/ocean-ruler.png'
};
function skillImage(name){const path=OFFICIAL_SKILL_ICONS[name]||'./assets/abyss-liberator.svg';return location.hostname.endsWith('.github.io')?path.replace('../bond30/','../Bond30/'):path}
function tracked(name){return name==='深淵世界的解放者'||name==='大海的支配者'||/^(禁斷世界(?:的)?介入者\s*(?:I|II|III)|貪欲\s*(?:I|II|III))$/.test(name)}
function chosenSkills(s,h){if(s.type==='other')return KEYS.filter(k=>s.skills[k]?.selected).map(k=>({name:k,up:!!s.skills[k]?.up})); if(!h)return []; return getSkills(h).filter(x=>tracked(x.name)).map(x=>({name:x.name,up:!!s.skills[x.name]?.up}));}
function skillTile(name,up,small=false){return `<span class="skilltile ${up?'is-up':''} ${small?'small':''}" title="${enc(name+(up?'+':''))}"><img src="${skillImage(name)}" alt=""><span class="skilltile-label">${enc(name.replace('禁斷世界的介入者','禁斷').replace('禁斷世界介入者','禁斷').replace('深淵世界的解放者','深淵解放者'))}${up?'<b>+</b>':''}</span></span>`}
const storeKey='hero-layout-phase1-v1';const blank=()=>({type:'',hero:'',skills:{}});let slots=Array.from({length:12},blank);try{const raw=JSON.parse(localStorage.getItem(storeKey));if(Array.isArray(raw)&&raw.length===12)slots=raw.map(s=>({type:s.type||'',hero:s.hero||'',skills:s.skills||{}}));}catch(e){}
let current=-1,draft=null,fullData=null;
const $=s=>document.querySelector(s);const enc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=h=>`../assets/heroes/${encodeURIComponent(h.slug)}.webp`;
function persist(){try{localStorage.setItem(storeKey,JSON.stringify(slots));}catch(e){}}function hero(s){return HEROES.find(h=>h.slug===s.hero)}function announce(s){const t=$('#toast');t.textContent=s;t.style.display='block';clearTimeout(announce.t);announce.t=setTimeout(()=>t.style.display='none',2400)}
function isUpgradeAllowed(slot,skillName){
 if(!slot||!slot.type)return false;
 if(slot.type==='other')return !!SKILL_RATES[skillName]&&SKILL_RATES[skillName].full>SKILL_RATES[skillName].base;
 const h=hero(slot);if(!h)return false;
 const a=getSkills(h).find(x=>x.name===skillName);return !!a&&!!(a.evolveAt!=null?a.evolveAt:a.evolvable);
}
function draw(){
 let n=0;$('#grid').innerHTML='';
 slots.forEach((s,i)=>{
  const h=hero(s);if(s.type)n++;
  const b=document.createElement('button'); b.className='slot';b.type='button';
  const label=s.type==='other'?'其他':h?.name||'尚未設定';
  const subtitle=s.type==='other'?'自訂技能配置':h?.title||'點擊選擇英靈';
  const shown=chosenSkills(s,h).map(x=>({...x,up:x.up&&isUpgradeAllowed(s,x.name)}));
  let mini=shown.length?'<div class="miniicons">'+shown.map(x=>skillTile(x.name,x.up,true)).join('')+'</div>':`<div class="mini">${s.type?'無禁斷／貪欲技能':'點擊設定'}</div>`;
  b.innerHTML=`<div class="slotinner"><div class="portrait"><span>${enc(label.slice(0,2))}</span></div><div class="slottxt"><div class="name">${enc(label)}</div><div class="title">${enc(subtitle)}</div></div></div><div class="slotabilities">${mini}</div><span class="slotno">${String(i+1).padStart(2,'0')}</span>`;
  if(h){const box=b.querySelector('.portrait'),img=document.createElement('img');img.alt=h.name;img.loading='lazy';img.src=source(h);img.onerror=()=>img.remove();box.prepend(img)}
  b.onclick=()=>open(i);$('#grid').appendChild(b);
 });$('#count').textContent=`已編隊 ${n} / 12`;
}
function getSkills(h){let remote=fullData?.heroes?.find(x=>x.slug===h.slug);return remote?.skills||h.skills||[]}
function open(i){current=i;draft=structuredClone(slots[i]);$('#dialogtitle').textContent=`第 ${i+1} 格・英靈設定`;let used=slots.filter((s,j)=>j!==i&&s.type==='six').map(s=>hero(s)?.name);$('#heroSelect').innerHTML='<option value="">－ 尚未選擇 －</option><option value="other">其他（自由技能）</option>';HEROES.forEach(h=>{let o=document.createElement('option');o.value=h.slug;o.textContent=`★6 ${h.name}｜${h.title}`;o.disabled=used.includes(h.name);$('#heroSelect').appendChild(o)});$('#heroSelect').value=draft.type==='other'?'other':draft.hero||'';updateSkills();$('#overlay').classList.remove('hidden')}
function updateSkills(){const v=$('#heroSelect').value;const isOther=v==='other';$('#skillSection').classList.toggle('hidden',!v);if(!v)return;let h=HEROES.find(x=>x.slug===v);let list=isOther?KEYS.map(name=>({name,baseCap:SKILL_RATES[name].base,fullCap:SKILL_RATES[name].full,evolvable:SKILL_RATES[name].full>SKILL_RATES[name].base})):getSkills(h);$('#skillHeading').textContent=isOther?'自訂能力（可同時選多種）':`${h.name}・固定能力`;$('#skills').innerHTML='';list.forEach((item,idx)=>{let key=item.name, old=draft.skills[key]||{};let selected=isOther?!!old.selected:true;let up=!!old.up;let canUp=isOther?(SKILL_RATES[key]?.full>SKILL_RATES[key]?.base):!!(item.evolveAt!=null?item.evolveAt:item.evolvable);let l=document.createElement('div');l.className='skill';let checkbox=isOther?`<input type="checkbox" data-choose="${idx}" ${selected?'checked':''} aria-label="啟用 ${enc(key)}">`:'';let cap=item.baseCap?`Lv.${up&&canUp?item.fullCap:item.baseCap}${SKILL_RATES[key]?` · ${SKILL_RATES[key].levels[(up&&canUp?item.fullCap:item.baseCap)-1]}%`:''}`:'最高等級';l.innerHTML=`<span class="skill-icon">${tracked(key)?`<img src="${skillImage(key)}" alt="">`:(idx+1).toString().padStart(2,'0')}</span>${checkbox}<div class="skillname">${enc(key)}<div class="level">${cap}</div></div><label><input type="checkbox" data-up="${idx}" ${up&&canUp?'checked':''} ${!canUp?'disabled title="此技能無可核實的突破進化"':''}>突破</label>`;let c=l.querySelector('[data-choose]');if(up&&canUp){l.querySelector('.skill-icon').classList.add('is-up')}if(c)c.onchange=()=>{draft.skills[key]={...draft.skills[key],selected:c.checked,up:canUp&&!!draft.skills[key]?.up};l.classList.toggle('off',!c.checked)};l.querySelector('[data-up]').onchange=e=>{draft.skills[key]={selected:isOther?!!draft.skills[key]?.selected:true,up:e.target.checked};updateSkills()};l.classList.toggle('off',!selected);$('#skills').appendChild(l)});$('#note').textContent=isOther?'技能預設為一般最高等級，可突破的技能勾選後會套用突破等級。':fullData?.heroes?.some(x=>x.slug===h.slug)?'有進化能力的技能可勾選突破。':h.skills.length?'此英靈固定技能以現有資料顯示。':'此英靈的完整固定技能需要連線載入。';}
$('#heroSelect').onchange=()=>{draft.skills={};let v=$('#heroSelect').value;draft.type=v?(v==='other'?'other':'six'):'';draft.hero=v==='other'?'':v;updateSkills()};$('#save').onclick=()=>{let v=$('#heroSelect').value;slots[current]=draft.type?draft:blank();persist();$('#overlay').classList.add('hidden');draw()};$('#remove').onclick=()=>{slots[current]=blank();persist();$('#overlay').classList.add('hidden');draw()};$('#close').onclick=()=>$('#overlay').classList.add('hidden');$('#overlay').addEventListener('click',e=>{if(e.target===$('#overlay'))$('#close').click()});document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#close').click()});$('#clear').onclick=()=>{if(confirm('確定要清空全部 12 格編隊？')){slots=Array.from({length:12},blank);persist();draw()}};

fetch('../data/sixstar-visible-abilities.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('offline');return r.json()}).then(d=>{if(Array.isArray(d.heroes)){fullData=d;draw();if(current>=0&&!$('#overlay').classList.contains('hidden'))updateSkills();}}).catch(()=>{});


function pickedTracked(){let out=[];slots.forEach((s,i)=>{if(!s.type)return;const h=hero(s);const name=s.type==='other'?`第 ${i+1} 格・其他`:`第 ${i+1} 格・${h?.name||'英靈'}`;const chosen=s.type==='other'?KEYS.filter(k=>s.skills[k]?.selected).map(k=>({name:k,up:!!s.skills[k]?.up&&isUpgradeAllowed(s,k)})):getSkills(h||{skills:[]}).filter(x=>/^(禁斷世界(?:的)?介入者|貪欲|深淵世界的解放者|大海的支配者)/.test(x.name)).map(x=>({name:x.name,up:!!s.skills[x.name]?.up&&isUpgradeAllowed(s,x.name)}));chosen.forEach(k=>out.push({...k,owner:name}));});return out;}

const calcStoreKey='hero-layout-phase1-v17-calc';
const calcSettings={base:3,crown:false,stone:false,ring:0,event:false,brokenCircuit:0,mysteriousCircuit:false,desireMirror:0,ominousCircuit:0,ominousDistance:30};
try{const v=JSON.parse(localStorage.getItem(calcStoreKey));if(v&&typeof v==='object'){
  if(Number.isFinite(Number(v.base))&&Number(v.base)>=0&&Number(v.base)<=100)calcSettings.base=Number(v.base);
  calcSettings.crown=v.crown===true;calcSettings.stone=v.stone===true;calcSettings.event=v.event===true;
  if(Number.isInteger(+v.ring)&&+v.ring>=0&&+v.ring<=3)calcSettings.ring=+v.ring;
  if(Number.isInteger(v.brokenCircuit)&&v.brokenCircuit>=0&&v.brokenCircuit<=10)calcSettings.brokenCircuit=v.brokenCircuit;
  calcSettings.mysteriousCircuit=v.mysteriousCircuit===true;
  if(Number.isInteger(v.desireMirror)&&v.desireMirror>=0&&v.desireMirror<=15)calcSettings.desireMirror=v.desireMirror;
  if(Number.isInteger(v.ominousCircuit)&&v.ominousCircuit>=0&&v.ominousCircuit<=10)calcSettings.ominousCircuit=v.ominousCircuit;
  if(Number.isInteger(v.ominousDistance)&&v.ominousDistance>=30&&v.ominousDistance<=1800&&v.ominousDistance%30===0)calcSettings.ominousDistance=v.ominousDistance;
}}catch(e){}
function saveCalcSettings(){try{localStorage.setItem(calcStoreKey,JSON.stringify(calcSettings));}catch(e){}}
const rateDigits=n=>Number(n.toFixed(4)).toLocaleString('zh-TW',{maximumFractionDigits:4});
const pct=n=>rateDigits(n)+'%';

function truncToOneDecimal(n){return Math.trunc((n+1e-10)*10)/10;}
// The distance-based effect is listed separately in the native game logic.
// Lv.1 = 0.1%, Lv.10 = 1.0%; distance contributes floor(distance/100).
// That effect is capped at 10% independently from other chest skills/artifacts.
function ominousEffect(level,distance){
 const distanceUnits=Math.floor(distance/100);
 const raw=Number((level*distanceUnits/10).toFixed(4));
 return {distanceUnits,raw,applied:Math.min(10,raw),overCap:raw>10,atCap:raw===10};
}
function buildCalcData(){
 const picked=pickedTracked().map(x=>{
  const key=x.name.replace('禁斷世界介入者','禁斷世界的介入者');
  const rule=SKILL_RATES[key];if(!rule)return null;
  const lv=x.up&&rule.full>rule.base?rule.full:rule.base;
  const amount=rule.levels[lv-1];
  return {...x,key,lv,amount,kind:rule.kind};
 }).filter(Boolean);
 const forbidden=picked.filter(x=>x.kind==='guard');
 const deep=picked.filter(x=>x.kind==='abyss');
 const greed=picked.filter(x=>x.kind==='greed');
 const guardSkills=forbidden.reduce((sum,x)=>sum+x.amount,0);
 const deepGuard=deep.reduce((sum,x)=>sum+x.amount,0);
 const guardTotal=guardSkills+deepGuard;
 const ringFactor=1+calcSettings.ring*.1;
 const adjusted=guardTotal*ringFactor;
 const crownFactor=calcSettings.crown?2:1;
 const stoneFactor=calcSettings.stone?1.1:1;
 const artifactFactor=crownFactor*stoneFactor;
 const abilityFactor=1+adjusted/100;
 const eventFactor=calcSettings.event?1.5:1;


 const beforeEvent=calcSettings.base*artifactFactor*abilityFactor;
 const beforeEventTruncated=truncToOneDecimal(beforeEvent);
 const total=beforeEventTruncated*eventFactor;
 const greedSum=greed.reduce((sum,x)=>sum+x.amount,0);
 const greedCircuitTotal=calcSettings.brokenCircuit+(calcSettings.mysteriousCircuit?30:0);
 const greedMirrorTotal=calcSettings.desireMirror;
 const ominous=calcSettings.ominousCircuit?ominousEffect(calcSettings.ominousCircuit,calcSettings.ominousDistance):ominousEffect(0,calcSettings.ominousDistance);
 const greedArtifactTotal=greedCircuitTotal+greedMirrorTotal+ominous.applied;
 const greedCombined=greedSum+greedArtifactTotal;
 return {forbidden,deep,greed,artifactFactor,abilityFactor,eventFactor,total,greedSum,greedCircuitTotal,greedMirrorTotal,greedArtifactTotal,greedCombined,ominous};
}
function showSkillRows(items){return items.length?items.map(x=>`<div class="statline"><span>${enc(x.owner)} · ${enc(x.key.replace('禁斷世界的介入者','禁斷'))}${x.up?'+':''} Lv.${x.lv}</span><strong>+${pct(x.amount)}</strong></div>`).join(''):'<p class="calc-note">尚未配置相關技能</p>';}

function gameRateMarkup(d,forPopup=false){
 const basic=pct(calcSettings.base);
 const artifact='×'+rateDigits(d.artifactFactor*100)+'%';
 const ability='×'+(d.abilityFactor*100).toFixed(1)+'%';
 const event='×'+rateDigits(d.eventFactor*100)+'%';
 const content=`<div class="rate-guide"><div class="rate-guide-title">關於出現率</div><div class="rate-guide-body">
  <p class="rate-guide-intro">禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響</p>
  <div class="rate-guide-lines">
   <div class="rate-guide-line"><span class="rate-guide-label">・基本出現率</span><strong class="rate-guide-num">${basic}</strong></div>
   <div class="rate-guide-line"><span class="rate-guide-label">・神器效果</span><strong class="rate-guide-num">${artifact}</strong></div>
   <div class="rate-guide-line"><span class="rate-guide-label">・能力效果</span><strong class="rate-guide-num">${ability}</strong></div>
   <div class="rate-guide-gap"></div>
   <div class="rate-guide-line"><span class="rate-guide-label">・活動效果</span><strong class="rate-guide-num">${event}</strong></div>
  </div>
  <div class="rate-guide-total">・總出現率 <strong>${pct(d.total)}</strong></div>
  <div class="rate-guide-action"><button type="button" ${forPopup?'id="ratePopupClose"':'id="ratePopupOpen"'}>${forPopup?'OK':'放大檢視'}</button></div>
 </div></div>`;
 return content;
}
function updatePopup(){
 const node=$('#ratePopupContent');if(node)node.innerHTML=gameRateMarkup(buildCalcData(),true);
 const ok=$('#ratePopupClose');if(ok)ok.onclick=closeRatePopup;
}
function openRatePopup(){updatePopup();$('#ratePopupOverlay').classList.remove('hidden');$('#ratePopupClose').focus()}
function closeRatePopup(){$('#ratePopupOverlay').classList.add('hidden');$('#ratePopupOpen')?.focus()}
$('#ratePopupOverlay').addEventListener('click',e=>{if(e.target===$('#ratePopupOverlay'))closeRatePopup()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#ratePopupOverlay').classList.contains('hidden'))closeRatePopup()});
function showArtifactRows(){
 const rows=[];
 if(calcSettings.brokenCircuit)rows.push(['☆壞掉的回路 Lv.'+calcSettings.brokenCircuit,calcSettings.brokenCircuit]);
 if(calcSettings.mysteriousCircuit)rows.push(['★不可思議的回路',30]);
 if(calcSettings.desireMirror)rows.push(['★欲望之窺視鏡 Lv.'+calcSettings.desireMirror,calcSettings.desireMirror]);
 if(calcSettings.ominousCircuit){
  const e=ominousEffect(calcSettings.ominousCircuit,calcSettings.ominousDistance);
  rows.push(['☆不祥的迴路 Lv.'+calcSettings.ominousCircuit+'｜距離 '+calcSettings.ominousDistance+(e.overCap?'（10% 上限）':''),e.applied]);
 }
 return rows.length?rows.map(([name,amount])=>`<div class="statline"><span>${enc(name)}</span><strong>+${pct(amount)}</strong></div>`).join(''):'<p class="calc-note">尚未選擇寶箱相關神器</p>';
}
function updateOminousOptions(){
 const level=calcSettings.ominousCircuit;
 const select=$('#ominousDistance');
 select.disabled=level===0;
 select.classList.remove('cap-exceeded','cap-reached');
 for(const opt of select.options){
  const distance=Number(opt.value);
  const e=ominousEffect(level,distance);
  opt.className=e.overCap?'is-over-cap':e.atCap?'is-at-cap':'';
  opt.textContent=distance+(level&&e.overCap?' 🟠超過10%':level&&e.atCap?' ✓達10%':'');
  // Native desktop browsers can style options; mobile still shows the 🟠 marker.
  opt.style.color=e.overCap?'#ffd093':e.atCap?'#cfe8b6':'';
  opt.style.backgroundColor=e.overCap?'#58402b':e.atCap?'#314635':'';
 }
 select.value=String(calcSettings.ominousDistance);
 const note=$('#ominousCapNote');
 note.className='circuit-cap-note';
 note.hidden=level===0;
 if(!level){note.textContent='';return;}
 const e=ominousEffect(level,calcSettings.ominousDistance);
 if(e.overCap){
  select.classList.add('cap-exceeded');note.classList.add('is-over-cap');
  note.textContent='🟠 原始 '+pct(e.raw)+' → 上限 10%';
 }else if(e.atCap){
  select.classList.add('cap-reached');note.classList.add('is-at-cap');
  note.textContent='✓ 達上限 10%';
 }else{
  note.textContent='+'+pct(e.applied);
 }
}
function initArtifactSettings(){
 for(let n=0;n<=10;n++){
  const option=document.createElement('option');option.value=String(n);option.textContent=n?`Lv.${n} +${n}%`:'未持有';$('#brokenCircuitLevel').append(option);
 }
 for(let n=0;n<=15;n++){
  const option=document.createElement('option');option.value=String(n);option.textContent=n?`Lv.${n} +${n}%`:'未持有';$('#desireMirrorLevel').append(option);
 }
 for(let n=0;n<=10;n++){
  const opt=document.createElement('option');opt.value=String(n);
  opt.textContent=n?'Lv.'+n+' · 係數 '+(n/10).toFixed(1):'未持有';
  $('#ominousCircuitLevel').append(opt);
 }
 for(let distance=30;distance<=1800;distance+=30){
  const opt=document.createElement('option');opt.value=String(distance);opt.textContent=String(distance);
  $('#ominousDistance').append(opt);
 }
 $('#crownToggle').checked=calcSettings.crown;
 $('#stoneToggle').checked=calcSettings.stone;
 $('#ringLevel').value=String(calcSettings.ring);
 $('#brokenCircuitLevel').value=String(calcSettings.brokenCircuit);
 $('#mysteriousCircuitToggle').checked=calcSettings.mysteriousCircuit;
 $('#desireMirrorLevel').value=String(calcSettings.desireMirror);
 $('#ominousCircuitLevel').value=String(calcSettings.ominousCircuit);
 $('#ominousDistance').value=String(calcSettings.ominousDistance);
 updateOminousOptions();
 for(const [id,key,kind] of [
  ['crownToggle','crown','checked'],['stoneToggle','stone','checked'],
  ['ringLevel','ring','value'],['brokenCircuitLevel','brokenCircuit','value'],
  ['mysteriousCircuitToggle','mysteriousCircuit','checked'],['desireMirrorLevel','desireMirror','value'],
  ['ominousCircuitLevel','ominousCircuit','value'],['ominousDistance','ominousDistance','value']
 ]){
  $('#'+id).onchange=e=>{
   calcSettings[key]=kind==='checked'?e.target.checked:Number(e.target.value);
   saveCalcSettings();
   if(key==='ominousCircuit'||key==='ominousDistance')updateOminousOptions();
   renderStats();
  };
 }
}
function renderStats(){
 const d=buildCalcData();
 $('#officialStats').innerHTML=`
 <h3>編隊能力</h3>
 <section class="statpanel"><h4>基礎機率</h4>
  <div class="fieldrow"><label for="baseInput">守門人基本出現率</label><span><input type="number" id="baseInput" min="0" max="100" step="0.01" inputmode="decimal" value="${calcSettings.base}" aria-label="守門人基本出現率"> %</span></div>
  <p class="calc-note">預設 3%，可依照目前關卡調整。</p>
 </section>
 <section class="statpanel"><h4>活動</h4>
  <div class="fieldrow"><label for="eventToggle">活動效果 <small>（×150%）</small></label><input type="checkbox" id="eventToggle" ${calcSettings.event?'checked':''}></div>
 </section>
 <section class="statpanel"><h4>禁斷的守門人</h4>
  ${gameRateMarkup(d)}
  ${d.total>100?'<p class="statwarn">計算結果超過 100%，請留意遊戲內可能存在其他限制。</p>':''}
 </section>
 <section class="statpanel"><h4>貪欲・寶箱加成</h4>
  <div class="greed-result">
   <div class="greed-breakdown"><span class="greed-skill">英靈 +${pct(d.greedSum)}</span><span class="greed-artifact">神器 +${pct(d.greedArtifactTotal)}</span></div>
   <span class="greed-total-label">搭配加成合計</span><strong id="greedTotal">+${pct(d.greedCombined)}</strong>
   <span class="greed-disclaimer">不同種類的額外寶箱效果合計僅供搭配比較，不代表單次掉落機率。</span>
  </div>
 </section>
 <section class="statpanel"><h4>技能加成明細</h4>
  <div class="subheading">禁斷・守門人</div><div class="skill-summary">${showSkillRows([...d.forbidden,...d.deep])}</div>
  <div class="subheading">貪欲</div><div class="skill-summary">${showSkillRows(d.greed)}</div>
  <div class="subheading">寶箱相關神器</div><div class="skill-summary">${showArtifactRows()}</div>
 </section>`;
 $('#baseInput').onchange=e=>{
  const value=Number(e.target.value);
  if(e.target.value.trim()===''||!Number.isFinite(value)||value<0||value>100){announce('基礎機率請輸入 0 至 100');e.target.value=calcSettings.base;return;}
  calcSettings.base=value;saveCalcSettings();renderStats();
 };
 $('#eventToggle').onchange=e=>{calcSettings.event=e.target.checked;saveCalcSettings();renderStats()};
 $('#ratePopupOpen').onclick=openRatePopup;
 if(!$('#ratePopupOverlay').classList.contains('hidden'))updatePopup();
}

// Player help: visually compact, keyboard accessible, no debug prose on main screen.
const helpOverlay=$('#helpOverlay');
function openHelp(){
 helpOverlay.classList.remove('hidden');
 $('#helpClose').focus();
}
function closeHelp(){
 helpOverlay.classList.add('hidden');
 $('#helpOpen').focus();
}
$('#helpOpen').addEventListener('click',openHelp);
$('#helpClose').addEventListener('click',closeHelp);
$('#helpConfirm').addEventListener('click',closeHelp);
helpOverlay.addEventListener('click',e=>{if(e.target===helpOverlay)closeHelp()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!helpOverlay.classList.contains('hidden'))closeHelp();
 if(e.key==='Tab'&&!helpOverlay.classList.contains('hidden')){
  const controls=[...helpOverlay.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled])')];
  const first=controls[0],last=controls.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
});

const oldDraw=draw;draw=function(){oldDraw();renderStats()};initArtifactSettings();draw();
