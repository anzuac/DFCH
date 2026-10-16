/* DFCH — player-facing independent targeted recruitment simulator. */
(() => {
  'use strict';
  const D=window.DFCH_DATA,C=window.DFCHRecruitConfig,B=window.DFCHRecruitBonus,
    ST=window.DFCHRecruitStatus,BD=window.DFCHRecruitBond,A=window.DFCHRecruitAbilityStats;
  const $=id=>document.getElementById(id),KEY='dfch-recruit-target-v1';
  if(!D||!C||!B||!ST||!BD||!A||!$('targetPool'))return;
  const special=new Set(A.ids);
  const guides=new Map((window.DFCHHeroPreferences?.heroes||[]).map(h=>[h.index,h]));
  const nameOf=id=>guides.get(id)?.name||D.heroRoster[String(id)]?.name||('英靈 '+id);
  const skillName=id=>D.displayNames[String(id)]||'未知能力';
  const el=(tag,cls,label)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(label!==undefined)node.textContent=String(label);
    return node;
  };
  const side=()=>({total:0,regular:{},mixed:{},bond2:0,bond3:0});
  const bucket=()=>({rounds:0,candidates:side(),obtained:side()});
  const initial=()=>({version:1,settings:{
    pool:0,sixMode:'exclude',hiddenEye:false,hiddenSword:false,
    ownedEye:false,ownedSword:false,bonusValkyrja:false,poolBonusOwned:{},
    maneLevel:0,emmaLevel:0
  },slots:[0,0,0,0,0,0],run:null,lastRun:null,stats:Array.from({length:9},bucket)});
  let state=initial(),timer=null,refreshStamp=0,roundsInBatch=0;
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved?.version===1&&Array.isArray(saved.stats)&&saved.stats.length===9&&saved.settings){
      state={...initial(),...saved};
      state.settings={...initial().settings,...saved.settings};
      state.slots=Array.from({length:6},(_,i)=>Number(saved.slots?.[i])||0);
      if(state.run?.status==='running')state.run.status='paused';
    }
  }catch(_){}
  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(state));}
    catch(_){$('targetNotice').textContent='瀏覽器無法儲存紀錄；請檢查儲存空間或隱私模式。';}
  }
  function activeRun(){return !!state.run&&['running','paused','hit'].includes(state.run.status);}
  function config(){return activeRun()?state.run.settings:state.settings;}
  function pool(){return activeRun()?state.run.pool:state.settings.pool;}
  function required(){return activeRun()?state.run.ids:state.slots.filter(Boolean);}
  function poolKey(){return C.keys[pool()];}
  function roster(star){
    const ids=star===6?C.six[pool()]:(D.poolRarityRoster[poolKey()]?.[String(star)]||[]);
    return star===6?ids.filter(id=>config().sixMode==='keep'&&!(activeRun()&&state.run.seen.includes(id))):ids;
  }
  function ownsArtifact(id,options){
    return id===301008017?options.ownedEye:id===301008020?options.ownedSword:false;
  }
  function allowed(row,star,heroId,selected,options,key){
    const id=row.id,rank=star-1;
    if(selected.includes(id))return false;
    if(C.lowOnly.includes(id)&&rank>3)return false;
    if(C.highOnly.includes(id)&&rank<4)return false;
    const info=D.abilityConditions[String(id)]||{},job=D.heroRoster[String(heroId)]?.job||0;
    if(info.jobMask&&!(info.jobMask&job))return false;
    if(info.cond===1&&!ownsArtifact(info.condValue,options))return false;
    if(info.cond!==undefined&&info.cond!==0&&info.cond!==1)return false;
    if(options.hiddenEye&&C.artifactEye.includes(id))return false;
    if(options.hiddenSword&&C.artifactSword.includes(id))return false;
    if(C.exclusiveSeries.includes(id)&&selected.some(x=>C.exclusiveSeries.includes(x)))return false;
    if((C.groupExclusive[key]||[]).some(g=>g.includes(id)&&selected.some(x=>g.includes(x))))return false;
    const targets=C.targetPlayerIndexes?.[id];
    return !(targets?.length&&!targets.includes(heroId));
  }
  function selectable(){
    const key=C.keys[state.settings.pool],rows=D.poolRows[key],ids=new Set();
    for(const [id,group,weight] of rows)if(group===1&&weight>0)ids.add(id);
    for(const id of D.poolRarityRoster[key]?.['5']||[])
      for(const skill of D.heroes[String(id)]?.fixed||[])ids.add(skill);
    return [...ids].sort((a,b)=>skillName(a).localeCompare(skillName(b),'zh-Hant'));
  }
  function feasible(ids,options=state.settings,poolIndex=state.settings.pool){
    if(!ids.length||ids.length>6||new Set(ids).size!==ids.length)return false;
    const key=C.keys[poolIndex],rows=D.poolRows[key].map(([id,group,weight])=>({id,group,weight}));
    for(const star of [3,4,5]){
      const roster=D.poolRarityRoster[key]?.[String(star)]||[];
      for(const heroId of roster){
        const fixed=star===5?(D.heroes[String(heroId)]?.fixed||[]):
          rows.filter(r=>r.group===0).map(r=>r.id);
        const remaining=ids.filter(id=>!fixed.includes(id));
        const capacity=(star===5?10:C.unlockedLowStarSlots)-fixed.length-(star===5?0:2);
        if(remaining.length>capacity)continue;
        const chosen=[...fixed],usable=rows.filter(r=>r.group===1&&r.weight>0);
        if(remaining.every(id=>{
          const row=usable.find(r=>r.id===id);
          if(!row||!allowed(row,star,heroId,chosen,options,key))return false;
          chosen.push(id);return true;
        }))return true;
      }
    }
    return false;
  }
  function weightedIndex(items){
    const total=items.reduce((n,v)=>n+v,0);
    if(total<=0)return -1;
    let r=Math.random()*total;
    for(let i=0;i<items.length;i++)if((r-=items[i])<0)return i;
    return items.length-1;
  }
  function weights(){
    const o=config(),hasSix=roster(6).length>0;
    const weights=B.getModifiedWeights(C.weights[pool()],pool(),hasSix,!!o.bonusValkyrja,o.poolBonusOwned||{});
    if(!hasSix)weights[3]=0;
    return weights;
  }
  function currentMode(){
    const r=state.run,p=r.progress,six=roster(6).length;
    if(p.count+1<50)return 'normal';
    if(C.publicCeiling[pool()]&&p.round+1>=C.publicCeiling[pool()]&&six)return 'six';
    return 'five';
  }
  function rollRarity(position,alreadySix){
    const w=weights();
    if(alreadySix)w[3]=0;
    const mode=position===0?currentMode():'normal';
    if(mode==='six'&&w[3]>0)return 6;
    if(mode==='five'||mode==='six'){
      const i=weightedIndex([w[2],w[3]]);
      return i<0?5:i+5;
    }
    const i=weightedIndex(w);
    return i<0?3:i+3;
  }
  function buildSkills(star,heroId){
    const rows=D.poolRows[poolKey()].map(([id,group,weight])=>({id,group,weight}));
    const picked=[];
    if(star===6){
      for(const id of C.sixFixed[heroId]||[])picked.push({id,role:'固定'});
    }else if(star===5){
      for(const id of D.heroes[String(heroId)]?.fixed||[])picked.push({id,role:'固定'});
    }else{
      for(const r of rows.filter(r=>r.group===0))picked.push({id:r.id,role:'確定'});
      pickAbilities(rows,2,1,star,heroId,picked);
      pickAbilities(rows,3,1,star,heroId,picked);
    }
    const max=star>=5?10:C.unlockedLowStarSlots;
    if(picked.length<max)pickAbilities(rows,1,max-picked.length,star,heroId,picked);
    while(picked.length<max)picked.push({id:null,role:'空格'});
    return picked.slice(0,max);
  }
  function pickAbilities(rows,group,num,star,heroId,picked){
    const options=rows.filter(r=>r.group===group&&r.weight>0);
    const base=options.map(x=>x.weight);
    let tries=0,done=0;
    while(done<num&&tries<1000&&options.length){
      tries++;
      const i=weightedIndex(base);
      if(i<0)break;
      const row=options[i];
      if(!allowed(row,star,heroId,picked.map(x=>x.id),config(),poolKey()))continue;
      picked.push({id:row.id,role:group===1?'自由':group===2?'攻擊增益':'HP 增益'});
      done++;
    }
  }
  function candidate(position,alreadySix){
    const star=rollRarity(position,alreadySix),heroes=roster(star);
    if(!heroes.length)return null;
    const id=heroes[Math.floor(Math.random()*heroes.length)];
    const o=config(),skills=buildSkills(star,id);
    const status=ST.generate(id,star,Math.random,{ability731:B.geniusBonus(o.maneLevel,o.emmaLevel)});
    return {id,star,skills,bondEvents:BD.decide(skills,star,id,Math.random),status};
  }
  function hits(candidate,ids){
    if(!candidate||candidate.star===6)return false;
    const present=new Set(candidate.skills.map(skill=>skill.id));
    return ids.every(id=>present.has(id));
  }
  function record(side,candidate){
    if(!candidate||candidate.star===6)return;
    side.total++;
    const mask=A.skillMask(candidate);
    for(const row of A.regular)if((mask&row.mask)===row.mask)
      side.regular[row.mask]=(side.regular[row.mask]||0)+1;
    if(A.mixed(mask))side.mixed[mask]=(side.mixed[mask]||0)+1;
    const hit=A.bondHits(candidate);
    if(hit===2)side.bond2++;
    if(hit===3)side.bond3++;
  }
  function commit(c){
    const r=state.run,old=r.progress,mode=currentMode();
    let count=old.count+1,round=old.round;
    if(count>=50){count=0;if(mode==='six'||c?.star===6)round=0;else round++;}
    else if(c?.star===6)round=0;
    r.progress={count,round};
    if(c?.star===6&&!r.seen.includes(c.id))r.seen.push(c.id);
    record(state.stats[r.pool].obtained,c);
  }
  function oneRound(){
    const r=state.run,three=[];
    for(let i=0;i<3;i++){
      const c=candidate(i,three.some(x=>x.star===6));
      if(c)three.push(c);
    }
    if(three.length!==3){r.status='paused';$('targetNotice').textContent='候選生成失敗，已暫停。';return false;}
    r.rounds++;r.candidates+=3;state.stats[r.pool].rounds++;
    for(const c of three)record(state.stats[r.pool].candidates,c);
    if(three.some(c=>hits(c,r.ids))){
      r.pending=three;r.selected=three.findIndex(c=>hits(c,r.ids));
      r.status='hit';return false;
    }
    commit(three[Math.floor(Math.random()*three.length)]);
    return true;
  }
  const batchSize=n=>n===3?100:n===4?1000:n===5?3000:n>=6?5000:100;
  function schedule(){timer=setTimeout(tick,0);}
  function tick(){
    timer=null;
    const r=state.run;if(!r||r.status!=='running')return;
    const batch=batchSize(r.ids.length),start=performance.now();
    let steps=0,keep=true;
    // Split even large batches into small time-budgeted microsteps.
    while(steps<150&&roundsInBatch<batch&&performance.now()-start<14&&r.status==='running'){
      keep=oneRound();steps++;roundsInBatch++;
      if(!keep)break;
    }
    const now=performance.now();
    if(!keep||roundsInBatch>=batch||now-refreshStamp>130){
      persist();renderProgress();
      refreshStamp=now;
      if(roundsInBatch>=batch)roundsInBatch=0;
    }
    if(r.status==='running')schedule();
    else{persist();render();}
  }
  function resume(){
    if(state.run?.status==='hit')return;
    if(state.run?.status==='paused'){
      state.run.status='running';roundsInBatch=0;refreshStamp=0;persist();render();schedule();return;
    }
    const ids=state.slots.filter(Boolean),p=state.settings.pool;
    if(!feasible(ids,state.settings,p)){
      $('targetNotice').textContent='指定能力無法由同一位三星～五星英靈同時取得，請調整能力或招募池。';return;
    }
    const begin=()=>{
      state.lastRun=null;
      state.run={pool:p,settings:{...state.settings,poolBonusOwned:{...state.settings.poolBonusOwned}},
        ids:[...ids],status:'running',rounds:0,candidates:0,
        progress:{count:0,round:0},seen:[],pending:null,selected:0};
      roundsInBatch=0;refreshStamp=0;persist();render();schedule();
    };
    if(ids.length>=3){
      $('targetWarningText').textContent='目前指定 '+ids.length+' 項能力，可能需要大量抽選才能命中。模擬期間可隨時暫停，並查看累積輪數。';
      $('targetWarning').showModal();pendingStart=begin;
    }else begin();
  }
  let pendingStart=null;
  function pause(){
    if(!state.run||state.run.status!=='running')return;
    state.run.status='paused';
    if(timer!==null){clearTimeout(timer);timer=null;}
    persist();render();
  }
  function stop(){
    if(state.run?.status!=='paused')return;
    if(!confirm('確定停止本次模擬？目前保底及本次進度將結束，但第四頁累積統計仍會保留。'))return;
    state.lastRun={pool:state.run.pool,rounds:state.run.rounds,candidates:state.run.candidates};
    state.run=null;persist();render();
  }
  function confirmChoice(){
    const r=state.run;if(r?.status!=='hit'||!r.pending?.[r.selected])return;
    const chosen=r.pending[r.selected];
    commit(chosen);r.status='finished';
    $('targetNotice').textContent='已取得「'+nameOf(chosen.id)+'」，本次指定抽選完成。';
    persist();render();
  }
  function skillIcon(id,cls){
    if(!id)return el('span',cls+' target-skill-placeholder','◇');
    const path=D.images?.[String(id)];
    if(!path)return el('span',cls+' target-skill-placeholder','✦');
    const img=el('img',cls);
    img.alt='';img.loading='lazy';
    img.src=path.startsWith('assets/')?'../Bond30/'+path:path;
    img.onerror=()=>{img.onerror=null;img.hidden=true;};
    return img;
  }
  function pickedMaskIds(mask){
    return A.ids.filter((id,i)=>mask&(1<<i));
  }
  function presets(){
    const locked=activeRun(),selected=state.slots.filter(Boolean);
    for(const group of [
      {section:'禁斷／貪欲',wrap:'targetBasePresets',body:'targetBasePresetButtons'},
      {section:'三金組合',wrap:'targetGoldPresets',body:'targetGoldPresetButtons'}
    ]){
      const area=$(group.body);area.replaceChildren();
      const matches=A.regular.filter(row=>row.section===group.section)
        .map(row=>({mask:row.mask,ids:pickedMaskIds(row.mask)}))
        .filter(row=>feasible(row.ids));
      $(group.wrap).hidden=!matches.length;
      for(const item of matches){
        const names=item.ids.map(id=>skillName(id));
        const button=el('button','target-preset-button',A.label(item.mask));
        button.type='button';button.disabled=locked;
        button.title=names.join(' ＋ ');
        const chosen=selected.length===item.ids.length&&item.ids.every(id=>selected.includes(id));
        if(chosen)button.classList.add('is-selected');
        button.setAttribute('aria-pressed',String(chosen));
        button.addEventListener('click',()=>{
          if(activeRun())return;
          state.slots=Array.from({length:6},(_,i)=>item.ids[i]||0);
          persist();updateSlots();
        });
        area.append(button);
      }
    }
  }
  let pickerIndex=-1;
  function renderSkillOptions(){
    if(pickerIndex<0)return;
    const container=$('targetSkillOptions');container.replaceChildren();
    const query=$('targetSkillSearch').value.trim().toLowerCase();
    const others=state.slots.filter((id,i)=>id&&i!==pickerIndex);
    const candidateIds=selectable().filter(id=>
      !others.includes(id)&&feasible([...others,id]));
    const options=[0,...candidateIds];
    let matches=0;
    for(const id of options){
      const name=id?skillName(id):'任意能力';
      if(query&&!name.toLowerCase().includes(query))continue;
      const button=el('button','target-skill-option');
      button.type='button';
      if(state.slots[pickerIndex]===id)button.classList.add('is-selected');
      button.setAttribute('aria-pressed',String(state.slots[pickerIndex]===id));
      button.append(skillIcon(id,'target-skill-option-icon'),el('span','target-skill-option-name',name));
      button.addEventListener('click',()=>{
        if(activeRun()||pickerIndex<0)return;
        const index=pickerIndex;
        state.slots[index]=id;
        $('targetSkillDialog').close();pickerIndex=-1;
        persist();updateSlots();
        $('targetSlot'+index).focus();
      });
      container.append(button);matches++;
    }
    if(!matches)container.append(el('p','target-skill-empty','沒有符合條件的能力，可清空其他格子後重新選擇。'));
  }
  function openSkillPicker(index){
    if(activeRun())return;
    pickerIndex=index;
    $('targetSkillDialogTitle').textContent='選擇指定格 '+(index+1)+' 的能力';
    $('targetSkillDialogPool').textContent=D.poolNames[C.keys[state.settings.pool]]||C.keys[state.settings.pool];
    $('targetSkillSearch').value='';
    renderSkillOptions();
    $('targetSkillDialog').showModal();
  }
  function updateSlots(){
    const valid=new Set(selectable());
    for(let i=0;i<6;i++){
      const button=$('targetSlot'+i),id=state.slots[i];
      button.replaceChildren();
      const icon=skillIcon(id,'target-slot-icon');
      button.append(icon,el('span','target-slot-name',id?skillName(id):'任意能力'),
        el('span','target-slot-chevron','›'));
      button.classList.toggle('is-picked',!!id);
      button.setAttribute('aria-label','指定格 '+(i+1)+'：'+(id?skillName(id):'任意能力')+'，點擊選擇');
      if(id&&!valid.has(id))button.classList.add('target-slot-unavailable');
      else button.classList.remove('target-slot-unavailable');
    }
    const ids=state.slots.filter(Boolean);
    const possible=ids.length?feasible(ids):false;
    $('targetSelectedCount').textContent='已指定 '+ids.length+'／6 項能力';
    $('targetFeasibility').textContent=!ids.length?'請至少選擇 1 項能力':
      possible?'此組合有機會由同一位非六星英靈取得':'這組條件在目前卡池無法同時成立';
    $('targetFeasibility').classList.toggle('target-unavailable',!!ids.length&&!possible);
    $('targetClearSlots').disabled=activeRun()||!ids.length;
    presets();
  }
  // Each completed three-candidate draw costs 700 diamonds, regardless of its result.
  const diamondCost=rounds=>BigInt(Math.max(0,Math.trunc(Number(rounds)||0)))*700n;
  function costTier(cost){
    if(cost>=100000000n)return 6;
    if(cost>=10000000n)return 5;
    if(cost>=1000000n)return 4;
    if(cost>=100000n)return 3;
    if(cost>=10000n)return 2;
    if(cost>=1000n)return 1;
    return 0;
  }
  function renderProgress(){
    const r=state.run,summary=r||state.lastRun,stats=state.stats[pool()];
    $('targetRunRounds').textContent=(summary?.rounds||0).toLocaleString('zh-TW');
    $('targetRunCandidates').textContent=(summary?.candidates||0).toLocaleString('zh-TW');
    $('targetLifetimeRounds').textContent=(stats?.rounds||0).toLocaleString('zh-TW');
    $('targetRunPity').textContent=r?(r.progress.count+1)+'／50':'—';
    const cost=diamondCost(summary?.rounds);
    $('targetCostValue').textContent=cost.toLocaleString('zh-TW')+' 鑽石';
    $('targetCostBar').className='target-cost-bar target-cost-tier-'+costTier(cost);
    $('targetCostLabel').textContent=!r&&state.lastRun?'上次模擬花費':'本次模擬花費';
    const status=r?.status;
    $('targetStatus').textContent=status==='running'?'持續抽選中':status==='paused'?'已暫停，可接續或停止':
      status==='hit'?'已命中，請選擇英靈':status==='finished'?'本次模擬已完成':'尚未開始';
    $('targetActivity').hidden=status!=='running'||required().length<3;
  }
  function renderResult(){
    const r=state.run,area=$('targetResults'),waiting=r?.status==='hit';
    area.hidden=!waiting;
    if(!waiting){area.replaceChildren();return;}
    area.replaceChildren();
    const cards=el('div','target-candidates');
    r.pending.forEach((c,i)=>{
      const chosen=i===r.selected,hit=hits(c,r.ids);
      const b=el('button','target-candidate'+(chosen?' is-selected':'')),photo=el('img','target-portrait');
      b.type='button';b.setAttribute('aria-pressed',String(chosen));
      photo.loading='lazy';photo.alt=nameOf(c.id);
      const pref=guides.get(c.id);
      photo.src=pref?.key?'../assets/heroes/'+encodeURIComponent(pref.key)+'.webp':'./images/'+c.id+'.webp';
      photo.onerror=()=>photo.remove();
      b.append(photo,el('strong','',nameOf(c.id)),el('small','',c.star+' ★'),
        el('small','',hit?'符合指定能力':'其他候選'));
      b.addEventListener('click',()=>{r.selected=i;persist();renderResult();});
      cards.append(b);
    });
    area.append(cards);
    const c=r.pending[r.selected],detail=el('div','target-detail');
    detail.append(el('strong','',nameOf(c.id)+' · '+c.star+' 星'));
    const skillArea=el('div','target-skills');
    const mapped=BD.decorate(c.skills,c.bondEvents||[],50);
    for(const sk of mapped){
      const skill=el('div','target-skill'+(r.ids.includes(sk.id)?' target-match':''));
      skill.append(el('span','',sk.id===null?'空格':(sk.bond?skillName(sk.id)+'＋':skillName(sk.id))),
        el('small','',sk.role+(sk.bond?' · 羈絆 Lv.'+sk.bond.level:'')));
      skillArea.append(skill);
    }
    detail.append(skillArea);
    const speed=c.status?.speed?.display;
    if(speed)detail.append(el('p','target-hero-speed','移動速度 '+speed));
    area.append(detail);
  }
  function renderStatistics(){
    const p=pool(),stats=state.stats[p]||bucket(),mode=$('targetCountMode').value,
      values=stats[mode]||side(),o=config();
    const seen=o.sixMode==='exclude'?[...C.six[p]]:state.run?.seen||[];
    const theory=A.theory(p,{...o,seen});
    $('targetStatTotal').textContent='已紀錄 '+values.total.toLocaleString('zh-TW')+' 位非六星'+
      (mode==='obtained'?'正式取得英靈':'候選英靈');
    let visibleGroups=0;
    for(const group of [{kind:'禁斷／貪欲',id:'targetBaseRows',heading:'targetBaseHeading',wrap:'targetBaseWrap'},
      {kind:'三金組合',id:'targetGoldRows',heading:'targetGoldHeading',wrap:'targetGoldWrap'}]){
      const body=$(group.id);body.replaceChildren();
      const subset=A.regular.filter(row=>row.section===group.kind&&theory.regular[row.mask]>0);
      $(group.heading).hidden=!subset.length;
      $(group.wrap).hidden=!subset.length;
      visibleGroups+=subset.length;
      for(const item of subset){
        const tr=el('tr');tr.append(el('td','',A.label(item.mask)),
          el('td','',(values.regular[item.mask]||0).toLocaleString('zh-TW')),
          el('td','',rate(theory.regular[item.mask])));
        body.append(tr);
      }
    }
    const mixed=Object.entries(theory.special).map(([mask,p])=>({mask:Number(mask),p})).sort((a,b)=>b.p-a.p);
    $('targetMixedDetails').hidden=!mixed.length;
    $('targetNone').hidden=visibleGroups>0||mixed.length>0;
    $('targetMixedRate').textContent=rate(theory.mixedTotal);
    $('targetMixedCount').textContent='命中 '+Object.values(values.mixed).reduce((s,n)=>s+n,0).toLocaleString('zh-TW')+' 次';
    const rows=$('targetMixedRows');rows.replaceChildren();
    for(const x of mixed){
      const tr=el('tr');tr.append(el('td','',A.label(x.mask)),
        el('td','',(values.mixed[x.mask]||0).toLocaleString('zh-TW')),el('td','',rate(x.p)));
      rows.append(tr);
    }
    $('targetBondTwo').textContent=values.bond2.toLocaleString('zh-TW')+' 次';
    $('targetBondThree').textContent=values.bond3.toLocaleString('zh-TW')+' 次';
  }
  function rate(p){
    if(!Number.isFinite(p)||p<=0)return '0%';
    const value=p*100;return value<.00000001?'<0.00000001%':value.toFixed(8).replace(/0+$/,'').replace(/\.$/,'')+'%';
  }
  function render(){
    const active=!!state.run&&['running','paused','hit'].includes(state.run.status);
    const running=state.run?.status==='running',paused=state.run?.status==='paused';
    $('targetPool').value=String(state.settings.pool);
    $('targetSixMode').value=state.settings.sixMode;
    for(const key of ['hiddenEye','hiddenSword','ownedEye','ownedSword','bonusValkyrja'])
      $('target_'+key).checked=!!state.settings[key];
    const artifact=B.poolArtifact(state.settings.pool);
    $('targetPoolBonusWrap').hidden=!artifact;
    $('targetPoolBonusName').textContent=artifact?.name||'本池招募神器';
    $('targetPoolBonus').checked=!!state.settings.poolBonusOwned?.[String(state.settings.pool)];
    for(const key of ['maneLevel','emmaLevel'])$('target_'+key).value=String(state.settings[key]||0);
    for(let i=0;i<6;i++)$('targetSlot'+i).disabled=active;
    for(const id of ['targetPool','targetSixMode','target_hiddenEye','target_hiddenSword',
      'target_ownedEye','target_ownedSword','target_bonusValkyrja','targetPoolBonus',
      'target_maneLevel','target_emmaLevel'])$(id).disabled=active;
    updateSlots();
    $('targetMainButton').textContent=running?'暫停模擬':'開始模擬';
    $('targetMainButton').disabled=state.run?.status==='hit';
    $('targetStopButton').hidden=!paused;
    $('targetConfirm').hidden=state.run?.status!=='hit';
    $('targetLocks').hidden=!active;
    renderProgress();renderResult();renderStatistics();
  }
  function bind(){
    for(let i=0;i<C.keys.length;i++){
      const option=el('option','',D.poolNames[C.keys[i]]||C.keys[i]);
      option.value=String(i);$('targetPool').append(option);
    }
    for(let i=0;i<6;i++)$('targetSlot'+i).addEventListener('click',()=>openSkillPicker(i));
    $('targetClearSlots').addEventListener('click',()=>{
      if(activeRun())return;
      state.slots=[0,0,0,0,0,0];persist();updateSlots();
    });
    $('targetSkillSearch').addEventListener('input',renderSkillOptions);
    $('targetSkillClose').addEventListener('click',()=>{
      $('targetSkillDialog').close();pickerIndex=-1;
    });
    $('targetSkillDialog').addEventListener('close',()=>{pickerIndex=-1;});
    $('targetPool').addEventListener('change',()=>{
      state.settings.pool=Number($('targetPool').value);
      state.slots=[0,0,0,0,0,0];
      persist();render();$('targetNotice').textContent='已切換招募池，請重新指定能力。';
    });
    $('targetSixMode').addEventListener('change',()=>{state.settings.sixMode=$('targetSixMode').value;persist();render();});
    for(const key of ['hiddenEye','hiddenSword','ownedEye','ownedSword','bonusValkyrja']){
      $('target_'+key).addEventListener('change',()=>{state.settings[key]=$('target_'+key).checked;persist();render();});
    }
    $('targetPoolBonus').addEventListener('change',()=>{
      state.settings.poolBonusOwned[String(state.settings.pool)]=$('targetPoolBonus').checked;
      persist();render();
    });
    for(const key of ['maneLevel','emmaLevel'])$('target_'+key).addEventListener('change',()=>{
      state.settings[key]=Number($('target_'+key).value)||0;persist();render();
    });
    $('targetMainButton').addEventListener('click',()=>{if(state.run?.status==='running')pause();else resume();});
    $('targetStopButton').addEventListener('click',stop);
    $('targetConfirm').addEventListener('click',confirmChoice);
    $('targetCountMode').addEventListener('change',renderStatistics);
    $('targetWarningCancel').addEventListener('click',()=>{pendingStart=null;$('targetWarning').close();});
    $('targetWarningConfirm').addEventListener('click',()=>{
      $('targetWarning').close();const action=pendingStart;pendingStart=null;if(action)action();
    });
    $('targetWarning').addEventListener('cancel',()=>{pendingStart=null;});
    $('targetClearStats').addEventListener('click',()=>{
      if(state.run?.status==='running')return;
      if(!confirm('清除第四頁所有累積能力紀錄？不影響前三頁資料及本次暫停進度。'))return;
      state.stats=Array.from({length:9},bucket);
      persist();render();$('targetNotice').textContent='第四頁累積統計已清除。';
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  }
  bind();render();
  window.DFCHTargetDraw=Object.freeze({render});
})();
