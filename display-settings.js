/* Shared DFCH public-site display preferences.
 * Original guide settings key is preserved: existing visitor preferences migrate automatically.
 * No API calls; the Bond30 and Diamond engines are never modified here.
 */
(() => {
  'use strict';
  const KEY='dfch-guide-display-settings-v1', LANG_KEY='dfch-hero-language';
  const THEMES=['dark','light','blue','green'], LANGUAGES=['zh_tw','ja','en','ko'];
  const SIZES={min:80,max:150,step:10};
  const ui={
    zh_tw:{button:'⚙ 顯示設定',title:'顯示設定',size:'字體大小',smaller:'縮小字體',larger:'放大字體',theme:'背景主題',dark:'深色',light:'淺色',blue:'深藍',green:'護眼綠',language:'語言',note:'六星圖鑑已支援語言切換；羈絆與鑽石模擬器內容目前仍以繁體中文顯示。',reset:'恢復預設',close:'關閉設定'},
    ja:{button:'⚙ 表示設定',title:'表示設定',size:'文字サイズ',smaller:'文字を小さく',larger:'文字を大きく',theme:'背景テーマ',dark:'ダーク',light:'ライト',blue:'ダークブルー',green:'グリーン',language:'言語',note:'六星英霊図鑑は多言語対応です。絆とダイヤのシミュレーター本文は現在中国語（繁体字）のみです。',reset:'初期設定に戻す',close:'設定を閉じる'},
    en:{button:'⚙ Display settings',title:'Display settings',size:'Text size',smaller:'Decrease text size',larger:'Increase text size',theme:'Background theme',dark:'Dark',light:'Light',blue:'Deep blue',green:'Soft green',language:'Language',note:'The six-star guide is translated. The Bond30 and Diamond simulator content is currently available in Traditional Chinese only.',reset:'Reset to default',close:'Close settings'},
    ko:{button:'⚙ 표시 설정',title:'표시 설정',size:'글자 크기',smaller:'글자 축소',larger:'글자 확대',theme:'배경 테마',dark:'다크',light:'라이트',blue:'딥 블루',green:'그린',language:'언어',note:'6성 영령 도감은 다국어를 지원합니다. 인연 및 다이아몬드 시뮬레이터 본문은 현재 번체 중국어만 지원합니다.',reset:'기본값 복원',close:'설정 닫기'}
  };
  function validSize(value){
    const size=Number(value);
    return Number.isInteger(size)&&size>=SIZES.min&&size<=SIZES.max&&size%SIZES.step===0?size:100;
  }
  function readSettings(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY));
      if(raw&&typeof raw==='object')return {size:validSize(raw.size),theme:THEMES.includes(raw.theme)?raw.theme:'dark'};
    }catch(_){}
    return {size:100,theme:'dark'};
  }
  function readLanguage(){
    try{const saved=localStorage.getItem(LANG_KEY);if(LANGUAGES.includes(saved))return saved;}catch(_){}
    return 'zh_tw';
  }
  const settings=readSettings();let lang=readLanguage();
  const html=document.documentElement;
  function apply(){
    html.dataset.guideTheme=settings.theme;
    html.style.setProperty('--guide-font-multiplier',String(settings.size/100));
  }
  function persist(){
    apply();
    try{localStorage.setItem(KEY,JSON.stringify(settings));}catch(_){}
  }
  function setLanguage(next){
    if(!LANGUAGES.includes(next))return;
    lang=next;
    try{localStorage.setItem(LANG_KEY,lang);}catch(_){}
    const legacy=document.getElementById('heroLanguage');
    if(legacy&&legacy.value!==lang){
      legacy.value=lang;
      legacy.dispatchEvent(new Event('change',{bubbles:true}));
    }
    window.dispatchEvent(new CustomEvent('dfch:language-change',{detail:{language:lang}}));
  }
  // Set attributes before the CSS is evaluated to avoid a theme flash.
  apply();
  document.addEventListener('DOMContentLoaded',()=>{
    const header=document.querySelector('.hero-guide-header, .bond30-public .masthead');
    if(!header)return;
    const el=(tag,cls,txt)=>{
      const n=document.createElement(tag);
      if(cls)n.className=cls;
      if(txt!==undefined)n.textContent=txt;
      return n;
    };
    const trigger=el('button','dfch-settings-trigger');trigger.type='button';
    trigger.setAttribute('aria-controls','dfchSettingsPanel');
    trigger.setAttribute('aria-expanded','false');
    const panel=el('section','dfch-settings-panel');panel.id='dfchSettingsPanel';
    panel.setAttribute('aria-labelledby','dfchSettingsTitle');panel.hidden=true;
    const top=el('div','dfch-settings-head');
    const title=el('h2');title.id='dfchSettingsTitle';
    const close=el('button','dfch-settings-close','×');close.type='button';
    top.append(title,close);

    const sizeHead=el('div','dfch-settings-labelrow');
    const sizeLabel=el('span');sizeLabel.id='dfchFontLabel';
    const sizeValue=el('output');sizeValue.id='dfchFontValue';sizeValue.htmlFor='dfchFontRange';
    sizeHead.append(sizeLabel,sizeValue);
    const rangeRow=el('div','dfch-settings-range');
    const minus=el('button','dfch-settings-step','A−');minus.type='button';
    const slider=el('input','dfch-settings-slider');slider.type='range';slider.id='dfchFontRange';
    slider.min=String(SIZES.min);slider.max=String(SIZES.max);slider.step=String(SIZES.step);
    slider.setAttribute('aria-labelledby',sizeLabel.id);
    const plus=el('button','dfch-settings-step','A+');plus.type='button';
    rangeRow.append(minus,slider,plus);

    const themeTitle=el('h3');themeTitle.id='dfchThemesTitle';
    const themeChoices=el('div','dfch-settings-themes');
    themeChoices.setAttribute('role','group');
    themeChoices.setAttribute('aria-labelledby',themeTitle.id);
    const themeOptions=new Map();
    for(const value of THEMES){
      const label=el('label','dfch-settings-theme');
      const input=el('input');input.type='radio';input.name='dfch-theme';input.value=value;
      const swatch=el('span','dfch-theme-swatch dfch-theme-'+value);
      swatch.setAttribute('aria-hidden','true');
      const name=el('span');
      label.append(input,swatch,name);themeChoices.append(label);
      input.addEventListener('change',()=>{
        if(!input.checked)return;
        settings.theme=value;persist();
      });
      themeOptions.set(value,{input,name});
    }

    const languageTitle=el('label','dfch-settings-language-label');
    const languageText=el('span');languageText.id='dfchLanguageLabel';
    const languageSelect=el('select','dfch-settings-language');
    languageSelect.id='dfchSettingsLanguage';
    languageSelect.setAttribute('aria-labelledby',languageText.id);
    const langNames={zh_tw:'繁體中文',ja:'日本語',en:'English',ko:'한국어'};
    for(const value of LANGUAGES){
      const option=el('option',null,langNames[value]);option.value=value;languageSelect.append(option);
    }
    languageTitle.append(languageText,languageSelect);
    const info=el('p','dfch-settings-note');
    const reset=el('button','dfch-settings-reset');reset.type='button';
    panel.append(top,sizeHead,rangeRow,themeTitle,themeChoices,languageTitle,info,reset);
    header.append(trigger,panel);

    function sync(){
      slider.value=String(settings.size);
      sizeValue.textContent=settings.size+'%';
      minus.disabled=settings.size<=SIZES.min;
      plus.disabled=settings.size>=SIZES.max;
      for(const [value,option] of themeOptions)option.input.checked=settings.theme===value;
      languageSelect.value=lang;
    }
    function translate(){
      const t=ui[lang]||ui.zh_tw;
      trigger.textContent=t.button;title.textContent=t.title;
      sizeLabel.textContent=t.size;themeTitle.textContent=t.theme;
      minus.setAttribute('aria-label',t.smaller);plus.setAttribute('aria-label',t.larger);
      for(const [value,opt]of themeOptions)opt.name.textContent=t[value];
      languageText.textContent=t.language;info.textContent=t.note;
      reset.textContent=t.reset;close.setAttribute('aria-label',t.close);
    }
    function changeSize(next){
      settings.size=validSize(next);persist();sync();
    }
    slider.addEventListener('input',()=>changeSize(slider.value));
    minus.addEventListener('click',()=>changeSize(Math.max(SIZES.min,settings.size-SIZES.step)));
    plus.addEventListener('click',()=>changeSize(Math.min(SIZES.max,settings.size+SIZES.step)));
    languageSelect.addEventListener('change',()=>{
      setLanguage(languageSelect.value);translate();sync();
    });
    // Remain compatible with the guide's existing language selector and translations.
    document.getElementById('heroLanguage')?.addEventListener('change',event=>{
      if(LANGUAGES.includes(event.target.value)){
        lang=event.target.value;translate();sync();
        window.dispatchEvent(new CustomEvent('dfch:language-change',{detail:{language:lang}}));
      }
    });
    window.addEventListener('storage',event=>{
      if(event.key===KEY){
        const incoming=readSettings();
        settings.size=incoming.size;settings.theme=incoming.theme;apply();sync();
      }else if(event.key===LANG_KEY){
        setLanguage(readLanguage());translate();sync();
      }
    });
    reset.addEventListener('click',()=>{
      settings.size=100;settings.theme='dark';persist();
      setLanguage('zh_tw');translate();sync();
    });
    function setOpen(open){
      panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));
      if(open)slider.focus();else trigger.focus();
    }
    trigger.addEventListener('click',()=>setOpen(panel.hidden));
    close.addEventListener('click',()=>setOpen(false));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&!panel.hidden){event.preventDefault();setOpen(false);}
    });
    document.addEventListener('pointerdown',event=>{
      if(!panel.hidden&&!panel.contains(event.target)&&!trigger.contains(event.target)){
        panel.hidden=true;trigger.setAttribute('aria-expanded','false');
      }
    });
    translate();sync();
  });
})();