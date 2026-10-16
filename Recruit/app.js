(() => {
  'use strict';
  const D=window.DFCH_DATA, C=window.DFCHRecruitConfig;
  const $=id=>document.getElementById(id);
  const storeKey='dfch-recruit-v1-independent';
  const heroGuides=window.DFCHHeroPreferences?.heroes||[];
  const guideByIndex=new Map(heroGuides.map(h=>[h.index,h]));
  let abilityGuide=null,drawnAt='';
  const iconCache=new Map();
  function getOfficialIcon(src){
    if(!src)return Promise.reject(Error('Missing icon'));
    if(src.startsWith('data:image/png;base64,'))return Promise.resolve(src);
    if(!/^https:\/\/api\.github\.com\/repos\/anzuac\/DFCH\/git\/blobs\/[0-9a-f]{40}$/.test(src))return Promise.reject(Error('Invalid icon URL'));
    if(!iconCache.has(src))iconCache.set(src,fetch(src,{headers:{Accept:'application/vnd.github+json'}})
      .then(r=>{if(!r.ok)throw Error('Icon unavailable');return r.json();})
      .then(b=>{if(b.encoding!=='base64'||!b.content)throw Error('Invalid icon blob');return 'data:image/png;base64,'+b.content.replace(/\s/g,'');})
      .catch(err=>{iconCache.delete(src);throw err;}));
    return iconCache.get(src);
  }
  if(!D||!C){$('notice').textContent='資料載入失敗，請重新整理頁面。';return;}
  const name6={13:'伊茲',19:'蘭德格里茲',22:'伊茲（海裝）',23:'齊格菲（海裝）',27:'弗拉斯萬',34:'阿卡夏',43:'蘭德格里茲（異鄉）',44:'露娜',47:'伊茲（聖夜）',53:'戀心公主（海裝）',54:'阿卡夏（海裝）',59:'弗雷雅',60:'芙麗嘉'};
  const state={pool:0,hiddenEye:false,hiddenSword:false,seen:[],progress:{},results:[],selected:0,confirmed:0,history:[]};
  function restore(){
    try{
      const saved=JSON.parse(localStorage.getItem(storeKey)||'null');
      if(!saved||typeof saved!=='object')return;
      if(Number.isInteger(saved.pool)&&saved.pool>=0&&saved.pool<9)state.pool=saved.pool;
      state.hiddenEye=!!saved.hiddenEye;state.hiddenSword=!!saved.hiddenSword;
      state.seen=Array.isArray(saved.seen)?saved.seen.filter(x=>C.six.some(a=>a.includes(x))):[];
      if(saved.progress&&typeof saved.progress==='object')
        for(const [k,v] of Object.entries(saved.progress))
          if(/^[0-8]$/.test(k)&&v&&Number.isInteger(v.count)&&v.count>=0&&v.count<50&&Number.isInteger(v.round)&&v.round>=0&&v.round<=5)
            state.progress[k]={count:v.count,round:v.round};
      if(Number.isInteger(saved.confirmed)&&saved.confirmed>=0)state.confirmed=saved.confirmed;
      if(Array.isArray(saved.history))state.history=saved.history.filter(r=>r&&Number.isInteger(r.pool)&&r.pool>=0&&r.pool<9&&Array.isArray(r.candidates)&&r.candidates.length===3&&Number.isInteger(r.selected)&&r.selected>=0&&r.selected<3).slice(0,200);
    }catch(_){/* Private mode can block storage */}
  }
  function save(){
    try{localStorage.setItem(storeKey,JSON.stringify({
      pool:state.pool,hiddenEye:state.hiddenEye,hiddenSword:state.hiddenSword,
      seen:state.seen,progress:state.progress,confirmed:state.confirmed,history:state.history
    }));}catch(_){}
  }
  const el=(tag,cl,text)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=String(text);return n;};
  const poolKey=()=>C.keys[state.pool];
  const rarityList=(s)=>{
    const id=poolKey();
    return s===6?C.six[state.pool].filter(i=>!state.seen.includes(i)):
      (D.poolRarityRoster[id]?.[String(s)]||[]);
  };
  const heroInfo=id=>guideByIndex.get(Number(id))||null;
  const nameOf=id=>heroInfo(id)?.name||name6[id]||D.heroRoster[String(id)]?.name||('英靈 '+id);
  const titleOf=id=>heroInfo(id)?.title||'';
  const sixDoc=id=>abilityGuide?.heroes?.find(h=>h.slug===heroInfo(id)?.key);
  const portrait=id=>{
    const info=heroInfo(id);if(!info)return null;
    const img=el('img','hero-portrait');
    img.src='../assets/heroes/'+encodeURIComponent(info.key)+'.webp';
    img.alt=info.name+'（'+info.title+'）';img.loading='lazy';
    img.onerror=()=>img.remove();
    return img;
  };
  const skillName=(id)=>D.displayNames[String(id)]||('能力 '+id);
  const f32=Math.fround;
  function weights(){
    const arr=C.weights[state.pool].map(f32);
    if(!rarityList(6).length)arr[3]=0;
    return arr;
  }
  function probability(){
    const arr=weights(),total=arr.reduce((a,b)=>a+b,0);
    return arr.map(w=>total?w/total:0);
  }
  function currentProgress(){return state.progress[state.pool]||{count:0,round:0};}
  function currentMode(){
    const p=currentProgress(),six=rarityList(6).length;
    if(p.count+1<50)return 'normal';
    if(C.publicCeiling[state.pool]&&p.round+1>=C.publicCeiling[state.pool]&&six)return 'six';
    return 'five';
  }
  function weightedIndex(arr){
    const sum=arr.reduce((a,b)=>a+b,0);
    if(sum<=0)return -1;
    let cursor=Math.random()*sum;
    for(let i=0;i<arr.length;i++){cursor-=arr[i];if(cursor<0)return i;}
    return arr.length-1;
  }
  function rollRarity(){
    const w=weights(),mode=currentMode();
    if(mode==='six')return 6;
    if(mode==='five'){const i=weightedIndex([w[2],w[3]]);return i<0?5:i+5;}
    const i=weightedIndex(w);return i<0?3:i+3;
  }
  function pickHero(star){
    let pool=rarityList(star);
    if(!pool.length)return null;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function allowedSkill(row,star,heroId,selected){
    const id=row.id;
    if(selected.some(x=>x.id===id))return false;
    const rank=star-1;
    if(C.lowOnly.includes(id)&&rank>3)return false;
    if(C.highOnly.includes(id)&&rank<4)return false;
    const info=D.abilityConditions[String(id)]||{};
    const job=D.heroRoster[String(heroId)]?.job||0;
    if(info.jobMask&&job&&!(info.jobMask&job))return false;
    if(state.hiddenEye&&C.artifactEye.includes(id))return false;
    if(state.hiddenSword&&C.artifactSword.includes(id))return false;
    if(C.exclusiveSeries.includes(id)&&selected.some(x=>C.exclusiveSeries.includes(x.id)))return false;
    const groups=C.groupExclusive[poolKey()]||[];
    if(groups.some(g=>g.includes(id)&&selected.some(x=>g.includes(x.id))))return false;
    // 主表的特殊角色排除清單（stage10）
    if(id===303000251&&[1,2,4,5,6,8,9,11,14,15,17,18,20].includes(heroId))return false;
    if(id===303000604&&![1,3,4,7,28,29,31,40,41].includes(heroId))return false;
    return true;
  }
  function pickAbilities(rows,group,num,star,heroId,already){
    const items=rows.filter(r=>r.group===group&&r.weight>0);
    let tries=0,done=0;
    while(done<num&&tries<1000&&items.length){
      tries++;
      const i=weightedIndex(items.map(x=>x.weight));
      if(i<0)break;
      const row=items[i];
      if(!allowedSkill(row,star,heroId,already))continue;
      already.push({id:row.id,role:group===1?'自由':group===2?'攻擊增益':'HP 增益'});
      done++;
    }
  }
  function buildSkills(star,heroId){
    const rows=D.poolRows[poolKey()].map(a=>({id:a[0],group:a[1],weight:a[2]}));
    const selected=[];
    if(star===6){
      const ids=C.sixFixed[heroId]||[];
      ids.forEach(id=>selected.push({id,role:'固定'}));
    }else if(star===5){
      const ids=D.heroes[String(heroId)]?.fixed||[];
      ids.forEach(id=>selected.push({id,role:'固定'}));
    }else{
      // Required 無權重、優先加入；兩個確定格的卡池會壓縮自由格。
      rows.filter(r=>r.group===0).forEach(r=>selected.push({id:r.id,role:'確定'}));
      pickAbilities(rows,2,1,star,heroId,selected);
      pickAbilities(rows,3,1,star,heroId,selected);
    }
    const maximum=star>=5?10:C.unlockedLowStarSlots;
    if(selected.length<maximum)pickAbilities(rows,1,maximum-selected.length,star,heroId,selected);
    while(selected.length<maximum)selected.push({id:null,role:'空格'});
    return selected.slice(0,maximum);
  }
  function createCandidate(){
    const star=rollRarity(),id=pickHero(star);
    if(id===null)return null;
    return {star,id,skills:buildSkills(star,id)};
  }
  function rates(){
    $('rates').replaceChildren();
    probability().forEach((v,i)=>{
      const node=el('div','rate');
      node.append(el('small','',String(i+3)+' 星'),el('b','',(v*100).toFixed(3)+'%'));
      $('rates').append(node);
    });
  }
  function updateSummary(){
    const p=currentProgress(),publicLevel=C.publicCeiling[state.pool];
    $('pity').textContent='下一輪進度：'+(p.count+1)+'/50'+
      (publicLevel?' · 公開六星保底輪次 '+(p.round+1)+'/'+publicLevel:' · 此池未設定公開六星保底')+
      ' · 已確認召喚 '+state.confirmed+' 次';
    $('owned').textContent='已取得六星：'+state.seen.length+' 位；本池尚可抽六星 '+rarityList(6).length+' 位';
  }
  function imageFor(id,official){
    const path=(official?.icon&&abilityGuide?.icons?.[official.icon])||D.images[String(id)];
    if(!path)return el('span','skill-icon','◇');
    const img=el('img');
    img.alt=official?.name||skillName(id);img.loading='lazy';
    if(path.startsWith('https://api.github.com/')){
      img.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
      img.style.opacity='0.4';
      getOfficialIcon(path).then(src=>{img.src=src;img.style.opacity='1';}).catch(()=>{
        img.removeAttribute('src');
        img.alt=(official?.name||skillName(id))+'（圖示暫時無法載入）';
      });
    }else img.src=path.startsWith('data:image/')?path:
      (path.startsWith('assets/')?new URL('../Bond30/'+path,location.href).href:path);
    return img;
  }
  function renderDetail(){
    const r=state.results[state.selected];$('detail').replaceChildren();
    if(!r){$('detail').hidden=true;return;}
    $('detail').hidden=false;
    const doc=r.star===6?sixDoc(r.id):null;
    const head=el('div','hero-profile'),photo=r.star===6?portrait(r.id):null;
    if(photo)head.append(photo);
    const info=el('div','hero-profile-text');
    info.append(el('h3','',nameOf(r.id)+' · '+r.star+' 星'));
    if(r.star===6&&titleOf(r.id))info.append(el('p','hero-title',titleOf(r.id)));
    info.append(el('p','desc','英靈 ID '+r.id+' · '+r.skills.filter(x=>x.role==='固定').length+' 個固定能力 · '+r.skills.filter(x=>x.role==='自由').length+' 個自由能力 · '+r.skills.filter(x=>x.id===null).length+' 個未填滿格'));
    head.append(info);
    const board=el('div','skills');
    const effect=el('div','ability-info');effect.hidden=true;
    r.skills.forEach((skill,i)=>{
      const detail=r.star===6&&skill.role==='固定'?doc?.skills?.[i]:null;
      const cell=el(detail?'button':'div','skill'+(skill.id===null?' empty':'')+(detail?' skill-button':''));
      if(detail)cell.type='button';
      if(skill.id!==null)cell.append(imageFor(skill.id,detail));
      cell.append(el('span','text',skill.id===null?'未填滿':detail?.name||skillName(skill.id)),el('span','role',skill.role));
      cell.title=detail?'點擊檢視官方技能效果 · '+skill.id:skill.id===null?'本次未抽到合格能力':String(skill.id);
      if(detail)cell.addEventListener('click',()=>{
        effect.replaceChildren(el('strong','',detail.name),el('p','',detail.levelEffects?.[0]||'未提供初始效果說明'),el('small','', '基礎等級上限 '+(detail.baseCap||'—')+' ／ 羈絆後上限 '+(detail.fullCap||'—')+' · 技能 ID '+skill.id));
        effect.hidden=false;
      });
      board.append(cell);
    });
    $('detail').append(head,board,effect);
    if(r.star===6){
      if(!doc)$('detail').append(el('p','desc','六星完整技能資料載入中；載入後會顯示名稱及正確圖示。'));
      else {
        const later=doc.skills.filter(x=>Number(x.unlockAt)>0);
        if(later.length)$('detail').append(el('p','bond-note','羈絆後續解鎖（不算抽卡固定十格）：'+later.map(x=>x.name+'（羈絆 '+x.unlockAt+'）').join('、')));
      }
    }
  }
  function renderCandidates(){
    $('candidates').replaceChildren();
    state.results.forEach((r,i)=>{
      const card=el('button','candidate'+(r.star>=5?' rarity'+r.star:''));card.type='button';
      card.setAttribute('aria-pressed',String(i===state.selected));
      const photo=r.star===6?portrait(r.id):null;if(photo)card.append(photo);
      card.append(el('span','stars','★'.repeat(r.star)),el('strong','',nameOf(r.id)));
      if(r.star===6&&titleOf(r.id))card.append(el('span','hero-subtitle',titleOf(r.id)));
      card.append(el('span','sub','ID '+r.id+' · '+r.skills.filter(x=>x.id!==null).length+' 項能力'));
      card.addEventListener('click',()=>{state.selected=i;renderCandidates();renderDetail();});
      $('candidates').append(card);
    });
    renderDetail();
  }
  function rarityNotice(){
    const max=state.results.reduce((n,x)=>Math.max(n,x.star),0),b=$('rarityNotice');
    b.hidden=max<5;b.className='rarity-notice '+(max===6?'six':'five');
    b.replaceChildren();
    if(max>=5){
      b.append(el('strong','',max===6?'✦ 六星英靈出現！':'★ 五星英靈出現！'),
        el('span','',max===6?'已出現六星候選！可查看角色圖片、稱號及十項固定能力。':'已出現五星候選！請檢查固定格及自由格。'));
      b.classList.remove('reveal');void b.offsetWidth;b.classList.add('reveal');
    }
  }
  function clearPending(){
    state.results=[];drawnAt='';$('confirm').hidden=true;
    $('rarityNotice').hidden=true;$('pendingReminder').hidden=true;
    renderCandidates();
  }
  function discardPending(){
    if(!state.results.length)return true;
    return confirm(state.results.some(r=>r.star>=5)?
      '這次召喚含五星／六星英靈，尚未正式取得。確定放棄此次候選？':
      '尚未選擇本次召喚的英靈，確定放棄候選？');
  }
  function renderHistory(){
    const list=$('drawHistory');list.replaceChildren();
    $('historyEmpty').hidden=state.history.length>0;
    $('historyStats').textContent='已保存 '+state.history.length+' 筆確認紀錄（最多 200 筆） · 累計取得 '+state.confirmed+' 次';
    state.history.forEach(entry=>{
      const r=entry.candidates[entry.selected];if(!r)return;
      const li=el('li','history-entry rarity'+r.star),fold=el('details'),summary=el('summary','history-summary');
      summary.append(el('span','history-time','#'+(entry.sequence||'?')+' · '+(entry.time||'')+' · '+(D.poolNames[C.keys[entry.pool]]||'')),
        el('strong','',r.star+'★ '+nameOf(r.id)));
      fold.append(summary);
      const row=el('div','history-choice-grid');
      entry.candidates.forEach((candidate,i)=>{
        const card=el('div','history-choice'+(i===entry.selected?' chosen':''));
        const img=candidate.star===6?portrait(candidate.id):null;if(img)card.append(img);
        card.append(el('b','',candidate.star+'★ '+nameOf(candidate.id)),el('small','',i===entry.selected?'正式取得':'未選擇'));row.append(card);
      });
      fold.append(row);
      const skills=(r.skills||[]).map((skill,i)=>({id:skill.id,name:r.star===6?sixDoc(r.id)?.skills?.[i]?.name:null})).filter(x=>x.id);
      fold.append(el('p','history-skills','取得技能：'+skills.map(x=>x.name||skillName(x.id)).join('、')));
      li.append(fold);list.append(li);
    });
  }
  function draw(){
    if(!discardPending())return;
    state.results=[];
    drawnAt=new Date().toLocaleString('zh-TW',{hour12:false});
    for(let i=0;i<3;i++){const r=createCandidate();if(r)state.results.push(r);}
    if(!state.results.length){
      $('notice').textContent='無法建立可抽角色，請先檢查卡池與已取得的六星名單。';
      $('confirm').hidden=true;rarityNotice();$('pendingReminder').hidden=true;renderCandidates();return;
    }
    state.selected=0;
    $('notice').textContent='已產生 '+state.results.length+' 位候選英靈；點選卡片查看能力格，再確認正式取得。抽選結果不產生速度或戰鬥面板。';
    $('confirm').hidden=false;renderCandidates();rarityNotice();$('pendingReminder').hidden=false;
  }
  function commit(){
    const r=state.results[state.selected];if(!r)return;
    const p=currentProgress(),mode=currentMode();
    let count=p.count+1,round=p.round;
    if(count>=50){
      count=0;
      if(mode==='six'||r.star===6)round=0;
      else round++;
    }else if(r.star===6)round=0;
    state.progress[state.pool]={count,round};
    if(r.star===6&&!state.seen.includes(r.id))state.seen.push(r.id);
    state.confirmed++;
    state.history.unshift({
      pool:state.pool,time:drawnAt||new Date().toLocaleString('zh-TW',{hour12:false}),
      sequence:state.confirmed,selected:state.selected,
      candidates:state.results.map(x=>({id:x.id,star:x.star,skills:x.skills.map(y=>({id:y.id,role:y.role}))}))
    });
    state.history=state.history.slice(0,200);
    save();renderHistory();
    $('notice').textContent='已確認取得「'+nameOf(r.id)+'」！本頁已更新招募計數及六星取得紀錄。';
    clearPending();updateSummary();rates();
  }
  function reset(){
    if(!confirm('清除英靈抽取 V1 的所有測試保底與六星取得紀錄？其他遠征紀錄不受影響。'))return;
    state.progress={};state.seen=[];state.confirmed=0;
    state.history=[];clearPending();save();renderHistory();
    $('notice').textContent='英靈抽取測試紀錄已重置。';rates();updateSummary();
  }
  function setPool(idx){
    if(!discardPending()){$('pool').value=String(state.pool);return;}
    state.pool=idx;clearPending();
    $('notice').textContent='已切換為「'+D.poolNames[poolKey()]+'」，可開始召喚。';
    rates();updateSummary();save();
  }
  function bind(){
    C.keys.forEach((k,i)=>{const option=el('option','',D.poolNames[k]||k);option.value=String(i);$('pool').append(option);});
    $('pool').value=String(state.pool);
    $('eye').checked=state.hiddenEye;$('sword').checked=state.hiddenSword;
    $('pool').addEventListener('change',()=>setPool(Number($('pool').value)));
    $('eye').addEventListener('change',()=>{state.hiddenEye=$('eye').checked;save();});
    $('sword').addEventListener('change',()=>{state.hiddenSword=$('sword').checked;save();});
    $('draw').addEventListener('click',draw);
    $('confirm').addEventListener('click',commit);
    $('reset').addEventListener('click',reset);
    $('clearHistory').addEventListener('click',()=>{
      if(!state.history.length)return;
      if(!confirm('只清除抽卡明細？保底、六星取得記錄與累積抽數不會重置。'))return;
      state.history=[];save();renderHistory();
    });
    updateSummary();rates();renderHistory();
    fetch('../data/sixstar-visible-abilities.json?v=1.3.0',{cache:'force-cache'})
      .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();})
      .then(data=>{
        if(!Array.isArray(data.heroes)||!data.icons)throw Error('Invalid hero ability data');
        abilityGuide=data;if(state.results.length)renderCandidates();renderHistory();
      }).catch(()=>{$('notice').textContent+=' 六星完整技能圖示載入失敗，可重新整理重試。';});
    if(window.parent!==window){
      const report=()=>{
        const height=Math.ceil(document.querySelector('main.container').getBoundingClientRect().bottom-document.body.getBoundingClientRect().top+20);
        if(height>350)window.parent.postMessage({type:'dfch-recruit-height',height},location.origin);
      };
      if('ResizeObserver' in window)new ResizeObserver(report).observe(document.querySelector('main.container'));
      window.addEventListener('load',report);
    }
  }
  restore();bind();
})();