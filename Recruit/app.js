(() => {
  'use strict';
  const D=window.DFCH_DATA, C=window.DFCHRecruitConfig, ST=window.DFCHRecruitStatus, B=window.DFCHRecruitBonus, T=window.DFCHRecruitStats, BD=window.DFCHRecruitBond, A=window.DFCHRecruitAbilityStats;
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
  if(!D||!C||!ST||!B||!T||!BD){$('notice').textContent='資料載入失敗，請重新整理頁面。';return;}
  const name6={13:'伊茲',19:'蘭德格里茲',22:'伊茲（海裝）',23:'齊格菲（海裝）',27:'弗拉斯萬',34:'阿卡夏',43:'蘭德格里茲（異鄉）',44:'露娜',47:'伊茲（聖夜）',53:'戀心公主（海裝）',54:'阿卡夏（海裝）',59:'弗雷雅',60:'芙麗嘉'};
  const state={pool:0,hiddenEye:false,hiddenSword:false,ownedEye:false,ownedSword:false,bonusValkyrja:false,poolBonusOwned:{},maneLevel:0,emmaLevel:0,bondEnabled:true,bondLevel:50,seen:[],progress:{},results:[],selected:0,confirmed:0,drawCount:0,history:[]};
  function restore(){
    try{
      const saved=JSON.parse(localStorage.getItem(storeKey)||'null');
      if(!saved||typeof saved!=='object')return;
      if(Number.isInteger(saved.pool)&&saved.pool>=0&&saved.pool<9)state.pool=saved.pool;
      state.hiddenEye=!!saved.hiddenEye;state.hiddenSword=!!saved.hiddenSword;
      state.ownedEye=!!saved.ownedEye;state.ownedSword=!!saved.ownedSword;
      state.bonusValkyrja=!!saved.bonusValkyrja;
      if(saved.poolBonusOwned&&typeof saved.poolBonusOwned==='object'){
        for(const idx of [1,3,4])state.poolBonusOwned[idx]=!!saved.poolBonusOwned[idx];
      }
      state.maneLevel=B.validLevel(saved.maneLevel,4);
      state.emmaLevel=B.validLevel(saved.emmaLevel,2);
      state.seen=Array.isArray(saved.seen)?saved.seen.filter(x=>C.six.some(a=>a.includes(x))):[];
      if(saved.progress&&typeof saved.progress==='object')
        for(const [k,v] of Object.entries(saved.progress))
          if(/^[0-8]$/.test(k)&&v&&Number.isInteger(v.count)&&v.count>=0&&v.count<50&&Number.isInteger(v.round)&&v.round>=0&&v.round<=5)
            state.progress[k]={count:v.count,round:v.round};
      if(Number.isInteger(saved.confirmed)&&saved.confirmed>=0)state.confirmed=saved.confirmed;
      // Older versions only retained confirmed draws; use that as the available baseline.
      state.drawCount=Number.isSafeInteger(saved.drawCount)&&saved.drawCount>=state.confirmed
        ?saved.drawCount:state.confirmed;
      if(Array.isArray(saved.history))state.history=saved.history.filter(r=>r&&Number.isInteger(r.pool)&&r.pool>=0&&r.pool<9&&Array.isArray(r.candidates)&&r.candidates.length===3&&Number.isInteger(r.selected)&&r.selected>=0&&r.selected<3).slice(0,50);
    }catch(_){/* Private mode can block storage */}
  }
  function save(){
    try{localStorage.setItem(storeKey,JSON.stringify({
      pool:state.pool,hiddenEye:state.hiddenEye,hiddenSword:state.hiddenSword,
      ownedEye:state.ownedEye,ownedSword:state.ownedSword,
      bonusValkyrja:state.bonusValkyrja,poolBonusOwned:state.poolBonusOwned,
      maneLevel:state.maneLevel,emmaLevel:state.emmaLevel,
      bondEnabled:true,bondLevel:50,
      seen:state.seen,progress:state.progress,confirmed:state.confirmed,
      drawCount:state.drawCount,history:state.history
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
  const nameOf=id=>heroInfo(id)?.name||name6[id]||D.heroRoster[String(id)]?.name||'未知英靈';
  const titleOf=id=>heroInfo(id)?.title||'';
  const sixDoc=id=>abilityGuide?.heroes?.find(h=>h.slug===heroInfo(id)?.key);
  // Official 3–5 star sprite icons exported from Unity; separate from 6-star illustrations.
  const lowStarPortraitIds=new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,14,15,17,18,20,24,25,26,28,29,30,31,35,36,37,38,40,41,42,48,49,50,55,56,57,61,62,63]);
  const portrait=id=>{
    const info=heroInfo(id);
    const isSprite=lowStarPortraitIds.has(Number(id));
    if(!isSprite&&!info)return null;
    const img=el('img',isSprite?'hero-portrait sprite':'hero-portrait');
    img.src=isSprite?'./images/'+id+'.webp':'../assets/heroes/'+encodeURIComponent(info.key)+'.webp';
    img.alt=isSprite?nameOf(id):(info.name+'（'+info.title+'）');
    img.loading='lazy';
    img.onerror=()=>img.remove();
    return img;
  };
  const skillName=(id)=>D.displayNames[String(id)]||'未知能力';
  // V2.0.0 displays only the Normal-type movement-speed model.
  // Rank names above D are withheld until their native text mapping is verified.
  function speedText(candidate){
    return candidate?.speed?.display || '—';
  }
  function speedRankClass(candidate){
    const rank=Number(candidate?.speed?.gradeIndex);
    return Number.isInteger(rank)&&rank>=0&&rank<=9?' speed-rank-'+rank:' speed-rank-unknown';
  }
  const f32=Math.fround;
  function weights(){
    return B.getModifiedWeights(C.weights[state.pool],state.pool,rarityList(6).length>0,
      state.bonusValkyrja,state.poolBonusOwned);
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
  function rollRarity(position,alreadyHasSix){
    const w=weights();
    // APK 3.16.1 ChooseRarityAndMaster:
    // mode 4/6/8 enforces minimum rarity only at candidate index 0.
    // After any six-star candidate has been generated in this group of three,
    // additional six-star attempts are rejected and re-sampled.
    // Removing that weight here reproduces the accepted-rarity distribution.
    if(alreadyHasSix)w[3]=0;
    const mode=position===0?currentMode():'normal';
    if(mode==='six'&&w[3]>0)return 6;
    if(mode==='five'||mode==='six'){
      const i=weightedIndex([w[2],w[3]]);
      return i<0?5:i+5;
    }
    const i=weightedIndex(w);
    return i<0?3:i+3;
  }
  function pickHero(star){
    let pool=rarityList(star);
    if(!pool.length)return null;
    return pool[Math.floor(Math.random()*pool.length)];
  }
  function ownsArtifact(id){
    return id===301008017?state.ownedEye:id===301008020?state.ownedSword:false;
  }
  function allowedSkill(row,star,heroId,selected){
    const id=row.id;
    if(selected.some(x=>x.id===id))return false;
    const rank=star-1;
    if(C.lowOnly.includes(id)&&rank>3)return false;
    if(C.highOnly.includes(id)&&rank<4)return false;
    const info=D.abilityConditions[String(id)]||{};
    const job=D.heroRoster[String(heroId)]?.job||0;
    if(info.jobMask&&!(info.jobMask&job))return false;
    // 原生 CheckCondition(chosenCondType=1) 檢查玩家持有神器數量>0
    if(info.cond===1&&!ownsArtifact(info.condValue))return false;
    if(info.cond!==undefined&&info.cond!==0&&info.cond!==1)return false;
    if(state.hiddenEye&&C.artifactEye.includes(id))return false;
    if(state.hiddenSword&&C.artifactSword.includes(id))return false;
    if(C.exclusiveSeries.includes(id)&&selected.some(x=>C.exclusiveSeries.includes(x.id)))return false;
    const groups=C.groupExclusive[poolKey()]||[];
    if(groups.some(g=>g.includes(id)&&selected.some(x=>g.includes(x.id))))return false;
    // 官方 targetPlayerIndexes 是指定英靈允許名單
    const targets=C.targetPlayerIndexes?.[id];
    if(targets?.length&&!targets.includes(heroId))return false;
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
  function createCandidate(position,alreadyHasSix){
    const star=rollRarity(position,alreadyHasSix),id=pickHero(star);
    if(id===null)return null;
    const status=ST.generate(id,star,Math.random,{
      ability731:B.geniusBonus(state.maneLevel,state.emmaLevel)
    });
    const skills=buildSkills(star,id);
    return {star,id,skills,bondEvents:BD.decide(skills,star,id,Math.random),status,speed:status.speed};
  }

  const groupLabels=['確定能力','自由能力','攻擊增益','HP 增益'];
  const jobName=mask=>({0:'不限職業',1:'劍士',2:'弓箭手',4:'法師',7:'全部職業'})[mask]||'限定職業';
  const starName=id=>C.lowOnly.includes(id)?'3～4 星':C.highOnly.includes(id)?'5～6 星':null;
  function syncRecruitBonuses(){
    $('bonusValkyrja').checked=state.bonusValkyrja;
    $('bonusMane').value=String(state.maneLevel);
    $('bonusEmma').value=String(state.emmaLevel);
    const p=B.poolArtifact(state.pool);
    $('poolBonusGroup').hidden=!p;
    if(p){
      $('poolBonusName').textContent=p.name+' · 五、六星機率加成 +'+p.amount+'%';
      $('poolBonusOwned').checked=!!state.poolBonusOwned[state.pool];
    }
    const total=B.geniusBonus(state.maneLevel,state.emmaLevel);
    $('bonusGeniusSummary').textContent=total?
      '天才類型加成 +'+total+'% · 適用於隨機決定類型的英靈':
      '尚未啟用天才類型加成';
  }
  function setRecruitBonus(key,value){
    if(key==='bonusValkyrja')state.bonusValkyrja=!!value;
    if(key==='poolBonusOwned'&&B.poolArtifact(state.pool))state.poolBonusOwned[state.pool]=!!value;
    if(key==='maneLevel')state.maneLevel=B.validLevel(value,4);
    if(key==='emmaLevel')state.emmaLevel=B.validLevel(value,2);
    syncRecruitBonuses();rates();save();
  }
  function syncArtifacts(){
    for(const [id,key] of [['eye','hiddenEye'],['modalEye','hiddenEye'],['sword','hiddenSword'],
      ['modalSword','hiddenSword'],['ownedEye','ownedEye'],['ownedSword','ownedSword']])
      $(id).checked=state[key];
    $('artifactState').textContent='眼球：'+(state.ownedEye?'已持有':'未持有')+
      ' ／ 魔劍：'+(state.ownedSword?'已持有':'未持有');
  }
  function setArtifact(key,checked){
    state[key]=checked;syncArtifacts();save();
    if($('poolAbilitiesDialog').open)renderPoolAbilities();
  }
  function renderPoolAbilities(){
    $('modalPoolName').textContent=D.poolNames[poolKey()]||poolKey();
    const q=$('abilitySearch').value.trim().toLowerCase();
    const target=$('abilitySections');target.replaceChildren();
    const rows=D.poolRows[poolKey()].map(([id,group,weight])=>({id,group,weight}));
    for(let group=0;group<=3;group++){
      const matching=rows.filter(r=>r.group===group&&skillName(r.id).toLowerCase().includes(q));
      if(!matching.length)continue;
      const section=el('section','ability-category');
      section.append(el('h3','',groupLabels[group]+' · '+matching.length+' 項'));
      const list=el('div','ability-options');
      for(const r of matching){
        const info=D.abilityConditions[String(r.id)]||{};
        const row=el('div','ability-option');
        row.append(imageFor(r.id));
        const content=el('div','ability-option-info');
        content.append(el('strong','',skillName(r.id)));
        const badges=el('div','ability-tags');
        const knownStars=starName(r.id);
        if(knownStars)badges.append(el('span','',knownStars));
        badges.append(el('span','',jobName(info.jobMask)));
        if(C.targetPlayerIndexes?.[r.id]?.length)badges.append(el('span','ability-limited','限定角色'));
        if(info.cond===1){
          const name=info.condValue===301008017?'眼球':'魔劍';
          const excluded=info.condValue===301008017?state.hiddenEye:state.hiddenSword;
          const status=!ownsArtifact(info.condValue)?'未持有'+name:excluded?'已設定排除':'神器條件符合';
          badges.append(el('span',(!ownsArtifact(info.condValue)||excluded)?'ability-blocked':'ability-eligible',status));
        }
        content.append(badges);row.append(content);
        list.append(row);
      }
      section.append(list);target.append(section);
    }
    if(!target.children.length)target.append(el('p','hint','沒有符合搜尋的能力。'));
  }
  function openPoolAbilities(){
    $('abilitySearch').value='';syncArtifacts();renderPoolAbilities();
    if(!$('poolAbilitiesDialog').open)$('poolAbilitiesDialog').showModal();
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
      const sha=path.slice(path.lastIndexOf('/')+1);
      if(/^[a-f0-9]{40}$/.test(sha)){
        img.src='./icons/'+sha+'.png';
        img.onerror=()=>{
          img.onerror=null; // avoid a loop if both the local asset and fallback fail
          getOfficialIcon(path).then(src=>{img.src=src;}).catch(()=>{
            img.removeAttribute('src');
            img.alt=(official?.name||skillName(id))+'（圖示暫時無法載入）';
          });
        };
      }
    }else img.src=path.startsWith('data:image/')?path:
      (path.startsWith('assets/')?new URL('../Bond30/'+path,location.href).href:path);
    return img;
  }
  function effectiveBondLevel(){return 50;}
  function eventsFor(r,doc){
    return r.star===6?BD.sixEvents(doc,r.skills):Array.isArray(r.bondEvents)?r.bondEvents:[];
  }
  function decoratedSkills(r,doc,level=effectiveBondLevel()){
    return BD.decorate(r.skills||[],eventsFor(r,doc),level);
  }
  function bondMark(event){
    return event.kind==='hp'?'HP':event.kind==='attack'?'攻擊':event.kind==='specific'?'指定':'進化';
  }
  function rerollBond(){
    if(!state.results.length)return;
    for(const r of state.results){
      if(r.star!==6)r.bondEvents=BD.decide(r.skills,r.star,r.id,Math.random);
    }
    renderCandidates();
    $('notice').textContent='已重新抽選目前三位候選的羈絆進化能力；英靈、屬性及保底均未改變。';
  }
  function renderDetail(){
    const r=state.results[state.selected];$('detail').replaceChildren();
    if(!r){$('detail').hidden=true;return;}
    $('detail').hidden=false;
    const doc=r.star===6?sixDoc(r.id):null;
    const head=el('div','hero-profile'),photo=portrait(r.id);
    if(photo){
      const photoButton=el('button','detail-portrait-button');photoButton.type='button';
      photoButton.setAttribute('aria-label','查看'+nameOf(r.id)+'的能力');
      photoButton.title='查看能力';
      photoButton.append(photo);photoButton.addEventListener('click',()=>openStatusModal(r));head.append(photoButton);
    }
    const info=el('div','hero-profile-text');
    info.append(el('h3','',nameOf(r.id)+' · '+r.star+' 星'));
    if(Number(r.status?.humanType)>0)info.append(el('span','human-type-tag human-type-'+r.status.humanType,r.status.humanTypeName));
    if(r.star===6&&titleOf(r.id))info.append(el('p','hero-title',titleOf(r.id)));
    info.append(el('p','desc',r.skills.filter(x=>x.role==='固定').length+' 項固定能力 · '+r.skills.filter(x=>x.role==='自由').length+' 項自由能力'+(r.skills.some(x=>x.id===null)?' · '+r.skills.filter(x=>x.id===null).length+' 個空格':'')));
    info.append(el('p','speed-result'+speedRankClass(r),'移動速度 '+speedText(r)));
    const bondDoc=r.star===6?doc:null;
    const activeEvents=eventsFor(r,bondDoc).filter(e=>e.level<=effectiveBondLevel());
    info.append(el('p','bond-summary','羈絆 Lv.50 · 已進化 '+activeEvents.length+' 格'));

    head.append(info);
    const board=el('div','skills');
    const effect=el('div','ability-info');effect.hidden=true;
    decoratedSkills(r,doc).forEach((skill,i)=>{
      const detail=r.star===6&&skill.role==='固定'?doc?.skills?.[i]:null;
      const evolution=skill.bond;
      const cell=el(detail?'button':'div','skill'+(skill.id===null?' empty':'')+(detail?' skill-button':'')+(evolution?' bond-evolved bond-'+evolution.kind:''));
      if(detail)cell.type='button';
      if(skill.id!==null)cell.append(imageFor(skill.id,detail));
      const abilityName=skill.id===null?'未填滿':detail?.name||skillName(skill.id);
      const evolvedName=evolution?(evolution.evolvedName||abilityName+(abilityName.endsWith('+')?'':'+')):abilityName;
      cell.append(el('span','text',evolvedName),el('span','role',skill.role));
      if(evolution)cell.append(el('span','bond-chip',bondMark(evolution)+' · '+evolution.level));
      cell.title=evolution?'羈絆 Lv.'+evolution.level+' · '+bondMark(evolution)+'：'+abilityName+' → '+evolvedName:(detail?'查看能力效果':skill.id===null?'未取得能力':abilityName);
      if(detail)cell.addEventListener('click',()=>{
        effect.replaceChildren(el('strong','',detail.name),el('p','',detail.levelEffects?.[0]||'未提供初始效果說明'),el('small','', '基礎等級上限 '+(detail.baseCap||'—')+' ／ 羈絆後上限 '+(detail.fullCap||'—')));
        effect.hidden=false;
      });
      board.append(cell);
    });
    $('detail').append(head,board,effect);
    if(activeEvents.length){
      const descriptions=activeEvents.map(e=>'Lv.'+e.level+' '+(e.evolvedName||skillName(e.id)+(String(skillName(e.id)).endsWith('+')?'':'+'))+'（'+bondMark(e)+'）');
      $('detail').append(el('p','bond-events-summary','羈絆進化：'+descriptions.join(' · ')));
    }
    if(r.star===6){
      if(!doc)$('detail').append(el('p','desc','技能資料載入中…'));
      else {
        const later=doc.skills.filter(x=>Number(x.unlockAt)>0);
        if(later.length)$('detail').append(el('p','bond-note','羈絆額外解鎖：'+later.map(x=>x.name+'（羈絆 '+x.unlockAt+'）').join('、')));
      }
    }
  }
  const statusIcons=['❤️','⚔️','🥾','🏹','💥','⏱️','🪓','⚖️','💛','🪙','✨'];
  function openStatusModal(r){
    if(!r?.status?.stats){return;}
    const panel=$('statusDialog');if(!panel)return;
    $('statusHero').replaceChildren();
    const portraitNode=portrait(r.id);
    if(portraitNode)$('statusHero').append(portraitNode);
    const heading=el('div','status-hero-heading');
    heading.append(el('h2','',nameOf(r.id)),el('p','',('★'.repeat(r.star))));
    if(Number(r.status.humanType)>0){
      heading.append(el('span','human-type-tag human-type-'+r.status.humanType,r.status.humanTypeName));
    }
    $('statusHero').append(heading);
    $('statusRows').replaceChildren();
    r.status.stats.forEach((a,j)=>{
      const row=el('div','status-row'+(a.ignored?' status-row-ignored':''));
      const icon=el('span','status-icon',statusIcons[j]);icon.setAttribute('aria-hidden','true');
      const content=el('div','status-row-content');
      const header=el('div','status-row-header');
      header.append(el('span','status-name',a.name));
      header.append(el('span','status-value',a.ignored?'不適用':a.text));
      const meter=el('div','status-meter');
      meter.setAttribute('role','progressbar');
      meter.setAttribute('aria-label',a.name+'能力等級');
      meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');
      meter.setAttribute('aria-valuenow',a.ignored?'0':String(Math.round(a.level*10)/10));
      if(!a.ignored){
        const fill=el('div','status-meter-fill grade-'+a.rank);
        fill.style.width=a.percent+'%';
        meter.append(fill);
      }
      content.append(header,meter);
      const rank=el('span','status-grade'+(a.ignored?' is-ignored':' grade-'+a.rank),a.ignored?'—':a.grade);
      row.append(icon,rank,content);
      $('statusRows').append(row);
    });
    if(!panel.open)panel.showModal();
  }
  function renderCandidates(){
    $('candidates').replaceChildren();
    state.results.forEach((r,i)=>{
      const card=el('div','candidate'+(r.star>=5?' rarity'+r.star:'')+(i===state.selected?' selected':''));
      const preview=el('button','candidate-image-button');preview.type='button';
      preview.title='查看能力';preview.setAttribute('aria-label','查看'+nameOf(r.id)+'的能力');
      const photo=portrait(r.id);
      if(photo)preview.append(photo);
      else preview.append(el('span','candidate-fallback','查看能力'));
      if(Number(r.status?.humanType)>0)
        preview.append(el('span','human-type-chip human-type-'+r.status.humanType,r.status.humanTypeName));
      preview.append(el('span','candidate-image-hint','查看能力'));
      preview.addEventListener('click',()=>openStatusModal(r));
      const choose=el('button','candidate-select');choose.type='button';
      choose.setAttribute('aria-pressed',String(i===state.selected));
      choose.title='選擇這位英靈';
      choose.append(el('span','stars','★'.repeat(r.star)),el('strong','candidate-name',nameOf(r.id)));
      if(r.speed)choose.append(el('span','candidate-speed'+speedRankClass(r),speedText(r)));
      choose.addEventListener('click',()=>{state.selected=i;renderCandidates();});
      card.append(preview,choose);$('candidates').append(card);
    });
    renderDetail();
  }
  function rarityNotice(){
    const max=state.results.reduce((n,x)=>Math.max(n,x.star),0),b=$('rarityNotice');
    b.hidden=max<5;b.className='rarity-notice '+(max===6?'six':'five');
    b.replaceChildren();
    if(max>=5){
      b.append(el('strong','',max===6?'✦ 六星英靈出現！':'★ 五星英靈出現！'));
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
    $('historyStats').textContent='已保存 '+state.history.length+' 筆確認紀錄（最多 50 筆） · 累計取得 '+state.confirmed+' 次';
    state.history.forEach(entry=>{
      const r=entry.candidates[entry.selected];if(!r)return;
      const li=el('li','history-entry rarity'+r.star),fold=el('details'),summary=el('summary','history-summary');
      summary.append(el('span','history-time','#'+(entry.sequence||'?')+' · '+(entry.time||'')+' · '+(D.poolNames[C.keys[entry.pool]]||'')),
        el('strong','',r.star+'★ '+nameOf(r.id)));
      if(r.speed)summary.append(el('small','history-speed'+speedRankClass(r),speedText(r)));
      if(Number(r.status?.humanType)>0)summary.append(el('small','history-human-type',r.status.humanTypeName));
      if(r.status?.stats){
        const inspect=el('button','history-status-button','查看已取得能力');inspect.type='button';
        inspect.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openStatusModal(r);});
        // A <summary> cannot safely contain another interactive control; place this after the details summary.
        fold.append(summary,inspect);
      }
      if(!fold.contains(summary))fold.append(summary);
      const row=el('div','history-choice-grid');
      entry.candidates.forEach((candidate,i)=>{
        const card=el('div','history-choice'+(i===entry.selected?' chosen':''));
        const img=portrait(candidate.id);if(img)card.append(img);
        card.append(el('b','',candidate.star+'★ '+nameOf(candidate.id)),el('small','',i===entry.selected?'正式取得':'未選擇'));
        if(candidate.speed)card.append(el('small','history-speed'+speedRankClass(candidate),speedText(candidate)));
        row.append(card);
      });
      fold.append(row);
      const doc=r.star===6?sixDoc(r.id):null;
      const snapshotLevel=entry.bondEnabled===false?0:(Number.isInteger(entry.bondLevel)?entry.bondLevel:0);
      const skills=decoratedSkills(r,doc,snapshotLevel).filter(x=>x.id);
      fold.append(el('p','history-skills','取得技能：'+skills.map(x=>{
        const name=skillName(x.id);return x.bond?(x.bond.evolvedName||name+(name.endsWith('+')?'':'+'))+'〔羈絆'+x.bond.level+'〕':name;
      }).join('、')));
      li.append(fold);list.append(li);
    });
  }
  function renderDrawCost(){
    const cost=BigInt(state.drawCount)*700n;
    const tier=cost>=100000000n?6:cost>=10000000n?5:cost>=1000000n?4:
      cost>=100000n?3:cost>=10000n?2:cost>=1000n?1:0;
    $('recruitCostValue').textContent=cost.toLocaleString('zh-TW')+' 鑽石';
    $('recruitCostBar').className='target-cost-bar target-cost-tier-'+tier;
  }
  function draw(){
    // V2.0.0 preserves the existing rapid draw and confirmation semantics.
    // The first card is highlighted until the player chooses a different card.
    // Confirm the previous draw before generating new candidates, so pity and
    // six-star history are updated in the same order as explicit confirmation.
    let autoSelectedName='';
    if(state.results.length){
      const previous=state.results[state.selected];
      if(previous){
        autoSelectedName=nameOf(previous.id);
        commit();
      }
    }
    state.results=[];
    drawnAt=new Date().toLocaleString('zh-TW',{hour12:false});
    for(let i=0;i<3;i++){
      const r=createCandidate(i,state.results.some(x=>x.star===6));
      if(r)state.results.push(r);
    }
    if(!state.results.length){
      $('notice').textContent='目前無法召喚此卡池的英靈。';
      $('confirm').hidden=true;rarityNotice();$('pendingReminder').hidden=true;renderCandidates();return;
    }
    state.selected=0;
    state.drawCount++;
    save();renderDrawCost();
    $('notice').textContent=(autoSelectedName?'已取得「'+autoSelectedName+'」 · ':'')+'本次召喚 '+state.results.length+' 位候選';
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
    // Stats are stored as tiny independent counters. Never clear them with first-page history.
    T.record(state.pool,state.results,state.selected);
    if(A)A.record(state.pool,state.results,state.selected);
    state.history.unshift({
      pool:state.pool,time:drawnAt||new Date().toLocaleString('zh-TW',{hour12:false}),
      sequence:state.confirmed,selected:state.selected,
      bondLevel:50,bondEnabled:true,
      candidates:state.results.map(x=>({id:x.id,star:x.star,speed:x.speed,status:x.status,bondEvents:x.bondEvents||[],skills:x.skills.map(y=>({id:y.id,role:y.role}))}))
    });
    state.history=state.history.slice(0,50);
    save();renderHistory();
    $('notice').textContent='已確認取得「'+nameOf(r.id)+'」！本頁已更新招募計數及六星取得紀錄。';
    clearPending();updateSummary();rates();
  }
  function reset(){
    if(!confirm('確定重置第一頁的抽取紀錄、保底進度與已取得六星？第二頁累積統計不會清除。'))return;
    state.progress={};state.seen=[];state.confirmed=0;state.drawCount=0;
    state.history=[];clearPending();save();renderHistory();renderDrawCost();
    $('notice').textContent='抽取紀錄已重置';rates();updateSummary();
  }
  function setPool(idx){
    if(!discardPending()){$('pool').value=String(state.pool);return;}
    state.pool=idx;clearPending();
    $('notice').textContent='已切換「'+D.poolNames[poolKey()]+'」';
    syncRecruitBonuses();rates();updateSummary();save();
    if($('poolAbilitiesDialog').open)renderPoolAbilities();
  }
  function bind(){
    C.keys.forEach((k,i)=>{const option=el('option','',D.poolNames[k]||k);option.value=String(i);$('pool').append(option);});
    $('pool').value=String(state.pool);
    syncArtifacts();syncRecruitBonuses();
    $('bonusValkyrja').addEventListener('change',()=>setRecruitBonus('bonusValkyrja',$('bonusValkyrja').checked));
    $('poolBonusOwned').addEventListener('change',()=>setRecruitBonus('poolBonusOwned',$('poolBonusOwned').checked));
    $('bonusMane').addEventListener('change',()=>setRecruitBonus('maneLevel',$('bonusMane').value));
    $('bonusEmma').addEventListener('change',()=>setRecruitBonus('emmaLevel',$('bonusEmma').value));
    $('pool').addEventListener('change',()=>setPool(Number($('pool').value)));
    for(const [id,key] of [['eye','hiddenEye'],['sword','hiddenSword'],
      ['modalEye','hiddenEye'],['modalSword','hiddenSword'],['ownedEye','ownedEye'],['ownedSword','ownedSword']]){
      $(id).addEventListener('change',()=>setArtifact(key,$(id).checked));
    }
    $('closeStatus').addEventListener('click',()=>$('statusDialog').close());
    $('statusDialog').addEventListener('click',e=>{if(e.target===$('statusDialog'))$('statusDialog').close();});
    $('openAbilities').addEventListener('click',openPoolAbilities);
    $('closeAbilities').addEventListener('click',()=>$('poolAbilitiesDialog').close());
    $('abilitySearch').addEventListener('input',renderPoolAbilities);
    $('draw').addEventListener('click',draw);
    $('confirm').addEventListener('click',commit);
    $('reset').addEventListener('click',reset);
    $('clearHistory').addEventListener('click',()=>{
      if(!state.history.length)return;
      if(!confirm('只清除最近 50 筆抽卡明細？保底及第二頁累積統計不會重置。'))return;
      state.history=[];save();renderHistory();
    });
    updateSummary();rates();renderHistory();renderDrawCost();
    fetch('../data/sixstar-visible-abilities.json?v=1.3.0',{cache:'force-cache'})
      .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();})
      .then(data=>{
        if(!Array.isArray(data.heroes)||!data.icons)throw Error('Invalid hero ability data');
        abilityGuide=data;if(state.results.length)renderCandidates();renderHistory();
      }).catch(()=>{$('notice').textContent+=' 技能資料暫時無法載入。';});
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