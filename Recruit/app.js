(() => {
  'use strict';
  const D=window.DFCH_DATA, C=window.DFCHRecruitConfig;
  const $=id=>document.getElementById(id);
  const storeKey='dfch-recruit-v1-independent';
  if(!D||!C){$('notice').textContent='資料載入失敗，請重新整理頁面。';return;}
  const name6={13:'伊茲',19:'蘭德格里茲',22:'伊茲（海裝）',23:'齊格菲（海裝）',27:'弗拉斯萬',34:'阿卡夏',43:'蘭德格里茲（異鄉）',44:'露娜',47:'伊茲（聖夜）',53:'戀心公主（海裝）',54:'阿卡夏（海裝）',59:'弗雷雅',60:'芙麗嘉'};
  const state={pool:0,hiddenEye:false,hiddenSword:false,seen:[],progress:{},results:[],selected:0,confirmed:0};
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
    }catch(_){/* Private mode can block storage */}
  }
  function save(){
    try{localStorage.setItem(storeKey,JSON.stringify({
      pool:state.pool,hiddenEye:state.hiddenEye,hiddenSword:state.hiddenSword,
      seen:state.seen,progress:state.progress,confirmed:state.confirmed
    }));}catch(_){}
  }
  const el=(tag,cl,text)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(text!==undefined)n.textContent=String(text);return n;};
  const poolKey=()=>C.keys[state.pool];
  const rarityList=(s)=>{
    const id=poolKey();
    return s===6?C.six[state.pool].filter(i=>!state.seen.includes(i)):
      (D.poolRarityRoster[id]?.[String(s)]||[]);
  };
  const nameOf=(id)=>name6[id]||D.heroRoster[String(id)]?.name||('英靈 '+id);
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
  function imageFor(id){
    const path=D.images[String(id)];
    if(!path)return el('span','skill-icon','◇');
    const img=el('img');
    img.alt=skillName(id);
    img.loading='lazy';
    img.src=new URL('../Bond30/'+path,location.href).href;
    return img;
  }
  function renderDetail(){
    const result=state.results[state.selected];$('detail').replaceChildren();
    if(!result){$('detail').hidden=true;return;}
    $('detail').hidden=false;
    const head=el('h3','',nameOf(result.id)+' · '+result.star+' 星');
    const info=el('p','desc','英靈 ID '+result.id+' · '+
      result.skills.filter(x=>x.role==='固定').length+' 個固定能力 · '+
      result.skills.filter(x=>x.role==='自由').length+' 個自由能力 · '+
      result.skills.filter(x=>x.id===null).length+' 個未填滿格');
    const board=el('div','skills');
    result.skills.forEach((s)=>{
      const cell=el('div','skill'+(s.id===null?' empty':''));
      if(s.id!==null)cell.append(imageFor(s.id));
      cell.append(el('span','text',s.id===null?'未填滿':skillName(s.id)),el('span','role',s.role));
      cell.title=s.id===null?'本次未抽到合格能力':String(s.id);
      board.append(cell);
    });
    $('detail').append(head,info,board);
  }
  function renderCandidates(){
    $('candidates').replaceChildren();
    state.results.forEach((r,i)=>{
      const button=el('button','candidate');button.type='button';
      button.setAttribute('aria-pressed',String(i===state.selected));
      button.append(el('span','stars','★'.repeat(r.star)),
        el('strong','',nameOf(r.id)),
        el('span','sub','ID '+r.id+' · '+r.skills.filter(x=>x.id!==null).length+' 項能力'));
      button.addEventListener('click',()=>{state.selected=i;renderCandidates();renderDetail();});
      $('candidates').append(button);
    });
    renderDetail();
  }
  function draw(){
    state.results=[];
    for(let i=0;i<3;i++){const r=createCandidate();if(r)state.results.push(r);}
    if(!state.results.length){
      $('notice').textContent='無法建立可抽角色，請先檢查卡池與已取得的六星名單。';
      $('confirm').hidden=true;renderCandidates();return;
    }
    state.selected=0;
    $('notice').textContent='已產生 '+state.results.length+' 位候選英靈；點選卡片查看能力格，再確認正式取得。抽選結果不產生速度或戰鬥面板。';
    $('confirm').hidden=false;renderCandidates();
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
    save();
    $('notice').textContent='已確認取得「'+nameOf(r.id)+'」！本頁已更新招募計數及六星取得紀錄。';
    $('confirm').hidden=true;
    state.results=[];renderCandidates();updateSummary();rates();
  }
  function reset(){
    if(!confirm('清除英靈抽取 V1 的所有測試保底與六星取得紀錄？其他遠征紀錄不受影響。'))return;
    state.progress={};state.seen=[];state.confirmed=0;
    state.results=[];save();renderCandidates();$('confirm').hidden=true;
    $('notice').textContent='英靈抽取測試紀錄已重置。';rates();updateSummary();
  }
  function setPool(idx){
    state.pool=idx;state.results=[];$('confirm').hidden=true;
    $('notice').textContent='已切換為「'+D.poolNames[poolKey()]+'」，可開始召喚。';
    renderCandidates();rates();updateSummary();save();
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
    updateSummary();rates();
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