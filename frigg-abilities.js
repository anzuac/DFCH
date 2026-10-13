(() => {
  'use strict';
  // Public, source-limited Frigg lookup. Never bundle Unity tables, APK assets or
  // internal research notes into this page. Screenshot values are snapshots only.
  const STORAGE_KEY='dfch-frigg-bond-query-v2';
  const MIN_BOND=1,MAX_BOND=50;
  const screenshotSkills=Object.freeze([
    {key:'all-hp',name:'高級聲援（全員）IV+',max:30,observed:1,effect:'所有士兵的 HP 進一步提升 12%；畫面顯示下一級為 14%。',abilityId:null,icon:null},
    {key:'greed-3',name:'貪欲 III',max:6,observed:6,effect:'擊敗 Boss 時，有 15% 機率額外增加一個寶箱。',abilityId:null,icon:null},
    {key:'gold-plus',name:'對黃金的渴望+',max:11,observed:11,effect:'任務金幣與擊敗敵人獲得的金幣，以乘算方式進一步增加 45%。',abilityId:null,icon:null},
    {key:'blessing-plus',name:'神妃的恩寵+',max:7,observed:7,effect:'神士兵的攻擊力與最大 HP 提升 120%。',abilityId:null,icon:null},
    {key:'prophet-plus',name:'寡言的預言者+',max:10,observed:10,effect:'自身攻擊力以乘算方式提升 350%，並有 80% 機率使敵人的攻擊無效。',abilityId:null,icon:null}
  ]);
  const labels={
    zh_tw:{heading:'芙麗嘉｜固定能力與羈絆',subtitle:'六星英靈 · 遊戲畫面資料對照',bond:'查詢羈絆等級',skill:'已辨識的能力',observed:'遊戲截圖等級',max:'全部滿等',custom:'自訂技能等級',reset:'還原截圖等級',close:'關閉',level:'等級',icon:'技能圖片待核對',unknown:'此等級的實際效果尚未核對。',source:'技能名稱、等級上限及下列特定等級效果來自你提供的遊戲畫面。完整技能 ID、圖示，以及每級效果仍需與 3.16.1 原始資料逐一核對。',bondNote:'目前尚未核對羈絆各等級的固定能力解鎖表。調整羈絆等級只切換查詢級別，不推測能力會在何時取得。',bondResult:'羈絆 Lv.{n}：固定能力解鎖與強化資料核對中。',fixedNote:'六星英靈依羈絆等級取得固定能力；本頁不提供隨機抽取。'},
    ja:{heading:'フリッグ｜固定能力と絆',subtitle:'星6 · ゲーム画面との照合',bond:'絆レベルを確認',skill:'確認済みの能力名',observed:'スクリーンショットのレベル',max:'すべて最大レベル',custom:'個別レベル設定',reset:'画像のレベルに戻す',close:'閉じる',level:'レベル',icon:'アイコン確認中',unknown:'このレベルの効果は未確認です。',source:'能力名、上限と特定レベルの効果は提供されたゲーム画面に基づきます。ID、アイコン、各レベルの効果は未確認です。',bondNote:'絆レベルごとの固定能力解放条件は確認中です。レベル変更によって未確認の解放を推測しません。',bondResult:'絆 Lv.{n}：固定能力のデータを確認中。',fixedNote:'星6英霊の絆能力は固定報酬です。このページでは抽選しません。'},
    en:{heading:'Frigg | Fixed abilities & bond',subtitle:'Six-star · Verified screenshot entries',bond:'View bond level',skill:'Abilities shown in the game',observed:'Screenshot levels',max:'Set all to max',custom:'Customize levels',reset:'Restore screenshot levels',close:'Close',level:'Level',icon:'Icon not yet verified',unknown:'The effect at this level has not been verified.',source:'Names, level caps and the effects at specific levels come from your game screenshot. Skill IDs, icons and other level effects require verification against 3.16.1.',bondNote:'Bond-level unlocks have not been fully verified. Selecting a level does not assume which abilities are unlocked.',bondResult:'Bond Lv.{n}: fixed ability rewards pending verification.',fixedNote:'Six-star bond abilities are predetermined; this page has no random draw.'},
    ko:{heading:'프리그 | 고정 능력과 인연',subtitle:'6성 · 게임 화면 대조',bond:'인연 레벨 조회',skill:'화면에서 확인한 능력',observed:'화면의 레벨',max:'모두 최대',custom:'직접 설정',reset:'화면 레벨 복원',close:'닫기',level:'레벨',icon:'이미지 확인 중',unknown:'이 레벨의 효과는 확인되지 않았습니다.',source:'능력 이름, 상한, 일부 레벨 효과는 제공된 게임 화면을 바탕으로 합니다. 능력 ID, 이미지 및 다른 레벨 효과는 확인 중입니다.',bondNote:'각 인연 레벨의 고정 능력 해금 조건은 아직 확인 중입니다.',bondResult:'인연 Lv.{n}: 고정 능력 확인 중.',fixedNote:'6성 인연 능력은 정해진 보상이며 추첨하지 않습니다.'}
  };
  const clamp=(x,min,max)=>Math.min(max,Math.max(min,Number.isFinite(+x)?Math.trunc(+x):min));
  const defaults=()=>({bond:50,mode:'screenshot',levels:Object.fromEntries(screenshotSkills.map(s=>[s.key,s.observed]))});
  function readState(){
    let saved;
    try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch{}
    const state=defaults();
    if(saved && typeof saved==='object'){
      state.bond=clamp(saved.bond,MIN_BOND,MAX_BOND);
      state.mode=saved.mode==='custom'?'custom':saved.mode==='max'?'max':'screenshot';
      for(const skill of screenshotSkills){
        state.levels[skill.key]=state.mode==='max'?skill.max:state.mode==='screenshot'?skill.observed:clamp(saved.levels?.[skill.key]??skill.observed,1,skill.max);
      }
    }else{
      // Keep just the old bond-level choice; discard old unverified skill data.
      try{const older=JSON.parse(localStorage.getItem('dfch-frigg-ability-preview-v1')||'null');if(older)state.bond=clamp(older.bond,MIN_BOND,MAX_BOND);}catch{}
    }
    return state;
  }
  function save(state){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}}
  const node=(tag,text,cls)=>{
    const e=document.createElement(tag);if(text!==undefined && text!==null)e.textContent=String(text);if(cls)e.className=cls;return e;
  };
  let currentDialog=null,previousFocus=null;
  function open({lang='zh_tw'}={}){
    const hero=window.DFCHHeroPreferences?.heroes?.find(h=>h.key==='frigg'&&h.index===60);
    if(!hero)return;
    if(currentDialog?.open){currentDialog.focus();return;}
    const l=labels[lang]||labels.zh_tw,state=readState();
    previousFocus=document.activeElement;
    const dialog=node('dialog',null,'frigg-ability-dialog');currentDialog=dialog;dialog.setAttribute('aria-labelledby','friggFixedTitle');
    const layout=node('div',null,'frigg-ability-layout');
    const head=node('header',null,'frigg-ability-head');
    const avatar=node('img',null,'frigg-ability-avatar');avatar.src='./assets/heroes/frigg.webp';avatar.alt='';avatar.width=76;avatar.height=76;
    const identity=node('div',null,'frigg-ability-identity');
    const heading=node('h2',l.heading);heading.id='friggFixedTitle';
    identity.append(node('p',l.subtitle,'frigg-ability-kicker'),heading);
    const close=node('button','×','frigg-ability-close');close.type='button';close.setAttribute('aria-label',l.close);
    head.append(avatar,identity,close);
    const scroll=node('div',null,'frigg-ability-scroll');
    const bondSection=node('section',null,'frigg-ability-bond');
    const titleRow=node('div',null,'frigg-ability-setting-head');
    const bondLabel=node('label',l.bond,'frigg-bond-label');bondLabel.htmlFor='friggBondRange';
    const bondValue=node('strong');titleRow.append(bondLabel,bondValue);
    const sliderRow=node('div',null,'frigg-ability-level-row');
    const minus=node('button','−'),plus=node('button','+');
    for(const x of [minus,plus])x.type='button';
    minus.setAttribute('aria-label',l.bond+' −');plus.setAttribute('aria-label',l.bond+' +');
    const range=node('input');range.id='friggBondRange';range.type='range';range.min=MIN_BOND;range.max=MAX_BOND;range.step=1;range.setAttribute('aria-label',l.bond);
    sliderRow.append(minus,range,plus);
    const bondResult=node('p',null,'frigg-ability-note');
    const bondNote=node('p',l.bondNote,'frigg-ability-uncertainty');
    bondSection.append(titleRow,sliderRow,bondResult,bondNote);
    const skillsSection=node('section',null,'frigg-ability-skills');
    const skillsHeader=node('div',null,'frigg-ability-setting-head');
    skillsHeader.append(node('h3',l.skill),node('span',l.observed,'frigg-ability-tag'));
    const evidence=node('p',l.source,'frigg-ability-note');
    const toolbar=node('div',null,'frigg-ability-toolbar');
    const reset=node('button',l.reset),max=node('button',l.max),custom=node('button',l.custom);
    reset.type=max.type=custom.type='button';toolbar.append(reset,max,custom);
    const list=node('div',null,'frigg-ability-list');
    skillsSection.append(skillsHeader,evidence,toolbar,list);
    const footer=node('section',null,'frigg-ability-new');footer.append(node('p',l.fixedNote));
    scroll.append(bondSection,skillsSection,footer);layout.append(head,scroll);dialog.append(layout);
    function updateBond(){
      range.value=String(state.bond);bondValue.textContent='Lv.'+state.bond+' / '+MAX_BOND;
      bondResult.textContent=l.bondResult.replace('{n}',state.bond);save(state);
    }
    function updateSkills(){
      list.replaceChildren();
      for(const [control,mode] of [[reset,'screenshot'],[max,'max'],[custom,'custom']])control.classList.toggle('active',state.mode===mode);
      for(const skill of screenshotSkills){
        const row=node('article',null,'frigg-ability-row');
        const placeholder=node('div','✦','frigg-skill-placeholder');placeholder.setAttribute('aria-label',l.icon);
        const info=node('div',null,'frigg-ability-row-info');
        info.append(node('strong',skill.name),node('span',l.icon));
        const effect=node('p',state.levels[skill.key]===skill.observed?skill.effect:l.unknown,'frigg-ability-effect');
        info.append(effect);
        const controls=node('div',null,'frigg-ability-skill-controls');
        const levelText=node('strong','Lv.'+state.levels[skill.key]+'/'+skill.max);
        if(state.mode==='custom'){
          const sub=node('button','−'),add=node('button','+');sub.type=add.type='button';
          sub.disabled=state.levels[skill.key]<=1;add.disabled=state.levels[skill.key]>=skill.max;
          sub.setAttribute('aria-label',skill.name+' '+l.level+' −');add.setAttribute('aria-label',skill.name+' '+l.level+' +');
          sub.addEventListener('click',()=>{state.levels[skill.key]=clamp(state.levels[skill.key]-1,1,skill.max);updateSkills()});
          add.addEventListener('click',()=>{state.levels[skill.key]=clamp(state.levels[skill.key]+1,1,skill.max);updateSkills()});
          controls.append(sub,levelText,add);
        }else controls.append(levelText);
        row.append(placeholder,info,controls);list.append(row);
      }
      save(state);
    }
    minus.addEventListener('click',()=>{state.bond=clamp(state.bond-1,MIN_BOND,MAX_BOND);updateBond()});
    plus.addEventListener('click',()=>{state.bond=clamp(state.bond+1,MIN_BOND,MAX_BOND);updateBond()});
    range.addEventListener('input',()=>{state.bond=clamp(range.value,MIN_BOND,MAX_BOND);updateBond()});
    reset.addEventListener('click',()=>{state.mode='screenshot';for(const x of screenshotSkills)state.levels[x.key]=x.observed;updateSkills()});
    max.addEventListener('click',()=>{state.mode='max';for(const x of screenshotSkills)state.levels[x.key]=x.max;updateSkills()});
    custom.addEventListener('click',()=>{state.mode='custom';updateSkills()});
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
    dialog.addEventListener('close',()=>{dialog.remove();currentDialog=null;if(previousFocus?.isConnected)previousFocus.focus()},{once:true});
    document.body.append(dialog);updateBond();updateSkills();dialog.showModal();
  }
  window.DFCHFriggAbility=Object.freeze({open,readState,defaultState:defaults,screenshotSkills:screenshotSkills.map(s=>({...s}))});
})();