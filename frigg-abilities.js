(() => {
  'use strict';
  // Frigg-only UI pilot. The reference screenshot is not proof of the original
  // 3.16.1 ability IDs, growth values, bond rewards or icon assignments.
  const KEY='dfch-frigg-ability-preview-v1';
  const referenceSkills=[
    {id:'reference-cheer-all',name:'高級聲援（全員）IV+',max:30},
    {id:'reference-greed',name:'貪欲 III',max:6},
    {id:'reference-gold',name:'對黃金的渴望+',max:11},
    {id:'reference-consort',name:'神妃的恩寵+',max:7},
    {id:'reference-prophet',name:'寡言的預言者+',max:10},
  ];
  const langLabels={
    zh_tw:{title:'芙麗嘉｜羈絆能力測試',sub:'六星英靈 · 介面測試版',bond:'羈絆等級',skill:'能力等級',max:'全部滿等',custom:'自訂等級',minimum:'全部最低等級',close:'關閉',level:'等級',placeholder:'圖示待核對',noFormula:'羈絆 Lv.1～50 的技能變化與解鎖條件尚未核實，此處只調整查詢介面，不顯示虛構的能力效果。',unverified:'下列 5 個能力名稱與上限暫依你提供的遊戲畫面作為版面測試，尚未從 3.16.1 確認它們是芙麗嘉的固定能力；圖片、實際效果及羈絆獎勵尚待核對。',newSkill:'新增能力與抽選',newHint:'原生流程存在來源池及資格篩選，但芙麗嘉的實際候選清單、權重與獲得等級尚未核對，因此不進行模擬抽選。',reference:'畫面參考 · 非官方能力計算結果'},
    ja:{title:'フリッグ｜絆・能力テスト',sub:'星6 · UIテスト版',bond:'絆レベル',skill:'能力レベル',max:'すべて最大',custom:'個別設定',minimum:'すべて最小',close:'閉じる',level:'レベル',placeholder:'画像確認中',noFormula:'絆Lv.1～50の効果と解放条件は未検証です。これはUIテストであり、効果は計算しません。',unverified:'以下の名称と上限は提供されたゲーム画面による暫定UI例です。フリッグの実能力、画像、数値は未確認です。',newSkill:'追加能力・抽選',newHint:'フリッグの候補、重み、解放条件は未確認のため抽選しません。',reference:'画面参考 · 公式計算ではありません'},
    en:{title:'Frigg | Bond ability preview',sub:'Six-star · UI prototype',bond:'Bond level',skill:'Skill levels',max:'Set all to maximum',custom:'Customize',minimum:'Set all to minimum',close:'Close',level:'Level',placeholder:'Icon pending',noFormula:'Bond Lv.1–50 bonuses and unlocks remain unverified. This is a UI preview, not an official effect calculation.',unverified:'The five skill names and level caps are temporary references from your game screenshot; they are not yet verified as Frigg’s fixed abilities in 3.16.1. Icons and effects are pending.',newSkill:'New abilities & selection',newHint:'Frigg’s eligible pool, weights and unlock conditions are not yet verified, so no random draw is shown.',reference:'Screenshot reference · Not an official calculation'},
    ko:{title:'프리그 | 인연 능력 테스트',sub:'6성 · UI 테스트',bond:'인연 레벨',skill:'능력 레벨',max:'모두 최대',custom:'직접 설정',minimum:'모두 최소',close:'닫기',level:'레벨',placeholder:'이미지 확인 중',noFormula:'인연 Lv.1~50의 효과와 해금 조건은 검증되지 않았습니다. 이 화면은 UI 테스트용입니다.',unverified:'다섯 능력 이름과 레벨 상한은 제공된 게임 화면을 바탕으로 한 임시 예시입니다. 프리그의 실제 능력, 이미지, 수치는 미확인입니다.',newSkill:'추가 능력 및 추첨',newHint:'프리그의 후보 목록, 가중치, 해금 조건이 미확인되어 추첨하지 않습니다.',reference:'화면 참고 · 공식 계산 아님'}
  };
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(value))?Math.trunc(Number(value)):min));
  const defaultState=()=>({bond:50,mode:'max',levels:Object.fromEntries(referenceSkills.map(s=>[s.id,s.max]))});
  function readState(){
    let stored;
    try{stored=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
    const state=defaultState();
    if(stored && typeof stored==='object'){
      state.bond=clamp(stored.bond,1,50);
      state.mode=stored.mode==='custom'?'custom':'max';
      for(const s of referenceSkills)state.levels[s.id]=state.mode==='max'?s.max:clamp(stored.levels?.[s.id],1,s.max);
    }
    return state;
  }
  function writeState(state){
    try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}
  }
  let dialog=null,restoreFocus=null;
  function open({lang='zh_tw'}={}){
    const label=langLabels[lang]||langLabels.zh_tw,state=readState();
    if(dialog?.open){dialog.focus();return;}
    restoreFocus=document.activeElement;
    dialog=document.createElement('dialog');dialog.className='frigg-ability-dialog';dialog.setAttribute('aria-labelledby','friggAbilityTitle');
    dialog.innerHTML=`
      <div class="frigg-ability-layout">
        <header class="frigg-ability-head">
          <img class="frigg-ability-avatar" src="./assets/heroes/frigg.webp" width="76" height="76" alt="">
          <div class="frigg-ability-identity"><p class="frigg-ability-kicker"></p><h2 id="friggAbilityTitle"></h2></div>
          <button type="button" class="frigg-ability-close" aria-label="Close">×</button>
        </header>
        <div class="frigg-ability-scroll">
          <section class="frigg-ability-bond">
            <div class="frigg-ability-setting-head"><label for="friggBondRange" class="frigg-bond-label"></label><strong id="friggBondValue"></strong></div>
            <div class="frigg-ability-level-row">
              <button type="button" id="friggBondMinus" aria-label="Decrease bond level">−</button>
              <input id="friggBondRange" type="range" min="1" max="50" step="1" value="50">
              <button type="button" id="friggBondPlus" aria-label="Increase bond level">+</button>
            </div>
            <p class="frigg-ability-uncertainty" id="friggUnverifiedFormula"></p>
          </section>
          <section class="frigg-ability-skills">
            <div class="frigg-ability-setting-head"><h3 id="friggSkillHeading"></h3><span class="frigg-ability-tag"></span></div>
            <p class="frigg-ability-note" id="friggEvidence"></p>
            <div class="frigg-ability-toolbar">
              <button type="button" id="friggSetMax"></button>
              <button type="button" id="friggCustomize"></button>
              <button type="button" id="friggSetMin" hidden></button>
            </div>
            <div id="friggSkillList" class="frigg-ability-list"></div>
          </section>
          <section class="frigg-ability-new"><h3 id="friggNewHeading"></h3><p id="friggNewBody"></p></section>
        </div>
      </div>`;
    const el=id=>dialog.querySelector('#'+id);
    dialog.querySelector('.frigg-ability-kicker').textContent=label.sub;
    el('friggAbilityTitle').textContent=label.title;
    el('friggBondRange').setAttribute('aria-label',label.bond);
    dialog.querySelector('.frigg-bond-label').textContent=label.bond;
    el('friggSkillHeading').textContent=label.skill;
    dialog.querySelector('.frigg-ability-tag').textContent=label.reference;
    el('friggUnverifiedFormula').textContent=label.noFormula;
    el('friggEvidence').textContent=label.unverified;
    el('friggSetMax').textContent=label.max;
    el('friggCustomize').textContent=label.custom;
    el('friggSetMin').textContent=label.minimum;
    el('friggNewHeading').textContent=label.newSkill;
    el('friggNewBody').textContent=label.newHint;
    dialog.querySelector('.frigg-ability-close').setAttribute('aria-label',label.close);
    const updateBond=()=>{el('friggBondRange').value=String(state.bond);el('friggBondValue').textContent='Lv.'+state.bond+' / 50';writeState(state);};
    const updateSkills=()=>{
      const root=el('friggSkillList');root.replaceChildren();
      el('friggSetMax').classList.toggle('active',state.mode==='max');
      el('friggCustomize').classList.toggle('active',state.mode==='custom');
      el('friggSetMin').hidden=state.mode!=='custom';
      for(const skill of referenceSkills){
        const article=document.createElement('article');article.className='frigg-ability-row';
        const thumb=document.createElement('div');thumb.className='frigg-skill-placeholder';thumb.setAttribute('aria-label',label.placeholder);thumb.textContent='✦';
        const info=document.createElement('div');info.className='frigg-ability-row-info';
        const name=document.createElement('strong');name.textContent=skill.name;
        const subtitle=document.createElement('span');subtitle.textContent=label.placeholder;
        info.append(name,subtitle);
        const control=document.createElement('div');control.className='frigg-ability-skill-controls';
        const level=document.createElement('strong');level.textContent='Lv.'+state.levels[skill.id]+'/'+skill.max;
        if(state.mode==='custom'){
          const minus=document.createElement('button'),plus=document.createElement('button');
          minus.type=plus.type='button';minus.textContent='−';plus.textContent='+';
          minus.setAttribute('aria-label',skill.name+' '+label.level+' −');
          plus.setAttribute('aria-label',skill.name+' '+label.level+' +');
          minus.disabled=state.levels[skill.id]<=1;plus.disabled=state.levels[skill.id]>=skill.max;
          minus.addEventListener('click',()=>{state.levels[skill.id]=clamp(state.levels[skill.id]-1,1,skill.max);writeState(state);updateSkills();});
          plus.addEventListener('click',()=>{state.levels[skill.id]=clamp(state.levels[skill.id]+1,1,skill.max);writeState(state);updateSkills();});
          control.append(minus,level,plus);
        }else control.append(level);
        article.append(thumb,info,control);root.append(article);
      }
      writeState(state);
    };
    dialog.querySelector('.frigg-ability-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{
      dialog.remove();dialog=null;
      if(restoreFocus?.isConnected)restoreFocus.focus();
    },{once:true});
    el('friggBondRange').addEventListener('input',event=>{state.bond=clamp(event.target.value,1,50);updateBond();});
    el('friggBondMinus').addEventListener('click',()=>{state.bond=clamp(state.bond-1,1,50);updateBond();});
    el('friggBondPlus').addEventListener('click',()=>{state.bond=clamp(state.bond+1,1,50);updateBond();});
    el('friggSetMax').addEventListener('click',()=>{state.mode='max';for(const s of referenceSkills)state.levels[s.id]=s.max;updateSkills();});
    el('friggCustomize').addEventListener('click',()=>{state.mode='custom';updateSkills();});
    el('friggSetMin').addEventListener('click',()=>{state.mode='custom';for(const s of referenceSkills)state.levels[s.id]=1;updateSkills();});
    document.body.append(dialog);
    updateBond();updateSkills();dialog.showModal();
  }
  window.DFCHFriggAbility=Object.freeze({open,clamp,referenceSkills:referenceSkills.map(s=>({...s})),defaultState,readState});
})();
