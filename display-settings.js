/* Display-only preferences for the six-star hero guide.
 * Runs before the stylesheet so saved colors and text size apply without a flash.
 * No API calls: each visitor's settings remain in their own browser.
 */
(() => {
  'use strict';

  const KEY = 'dfch-guide-display-settings-v1';
  const THEMES = ['dark', 'light', 'blue', 'green'];
  const MIN = 80, MAX = 150, STEP = 10;
  const labels = {
    zh_tw: {button:'⚙ 顯示設定',heading:'顯示設定',size:'字體大小',smaller:'縮小字體',larger:'放大字體',theme:'背景主題',dark:'深色',light:'淺色',blue:'深藍',green:'護眼綠',reset:'恢復預設',close:'關閉設定'},
    ja: {button:'⚙ 表示設定',heading:'表示設定',size:'文字サイズ',smaller:'文字を小さく',larger:'文字を大きく',theme:'背景テーマ',dark:'ダーク',light:'ライト',blue:'ダークブルー',green:'グリーン',reset:'初期設定に戻す',close:'閉じる'},
    en: {button:'⚙ Display settings',heading:'Display settings',size:'Text size',smaller:'Decrease text size',larger:'Increase text size',theme:'Background theme',dark:'Dark',light:'Light',blue:'Deep blue',green:'Soft green',reset:'Reset to default',close:'Close settings'},
    ko: {button:'⚙ 표시 설정',heading:'표시 설정',size:'글자 크기',smaller:'글자 축소',larger:'글자 확대',theme:'배경 테마',dark:'다크',light:'라이트',blue:'딥 블루',green:'편안한 녹색',reset:'기본값 복원',close:'닫기'}
  };
  const themeKeys = ['dark', 'light', 'blue', 'green'];

  function validScale(value) {
    const size = Number(value);
    return Number.isInteger(size) && size >= MIN && size <= MAX && size % STEP === 0 ? size : 100;
  }
  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      if (stored && typeof stored === 'object') {
        return {size:validScale(stored.size),theme:THEMES.includes(stored.theme) ? stored.theme : 'dark'};
      }
    } catch {}
    return {size:100,theme:'dark'};
  }
  const settings = load();
  function apply() {
    document.documentElement.dataset.guideTheme = settings.theme;
    document.documentElement.style.setProperty('--guide-font-multiplier', String(settings.size / 100));
  }
  function save() {
    apply();
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
  }
  apply();

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.heroes-standalone .hero-guide-header');
    if (!header) return;

    const el = (tag, className, text) => {
      const n = document.createElement(tag);
      if (className) n.className = className;
      if (text) n.textContent = text;
      return n;
    };
    const trigger = el('button', 'guide-settings-trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-controls', 'guideDisplaySettings');
    trigger.setAttribute('aria-expanded', 'false');

    const popup = el('section', 'guide-settings-panel');
    popup.id = 'guideDisplaySettings';
    popup.setAttribute('aria-labelledby', 'guideDisplayTitle');
    popup.hidden = true;
    const head = el('div', 'guide-settings-head');
    const heading = el('h2');
    heading.id = 'guideDisplayTitle';
    const close = el('button', 'guide-settings-close', '×');
    close.type = 'button';
    head.append(heading, close);

    const sizeRow = el('div', 'guide-settings-size-header');
    const sizeTitle = el('span');
    sizeTitle.id = 'guideFontSizeLabel';
    const sizeValue = el('output', 'guide-settings-value');
    sizeValue.id = 'guideFontSizeValue';
    sizeValue.setAttribute('for', 'guideFontSize');
    sizeRow.append(sizeTitle, sizeValue);

    const sizeControls = el('div', 'guide-settings-size-controls');
    const minus = el('button', 'guide-font-step', 'A−');
    minus.type = 'button';
    const slider = el('input', 'guide-font-slider');
    slider.id = 'guideFontSize';
    slider.type = 'range';
    slider.min = String(MIN);
    slider.max = String(MAX);
    slider.step = String(STEP);
    slider.setAttribute('aria-labelledby', 'guideFontSizeLabel');
    const plus = el('button', 'guide-font-step', 'A+');
    plus.type = 'button';
    sizeControls.append(minus, slider, plus);

    const themeTitle = el('h3', 'guide-theme-title');
    themeTitle.id = 'guideThemeTitle';
    const themeGroup = el('div', 'guide-theme-options');
    themeGroup.setAttribute('role', 'group');
    themeGroup.setAttribute('aria-labelledby', 'guideThemeTitle');
    const radioItems = new Map();
    for (const name of themeKeys) {
      const option = el('label', 'guide-theme-option');
      const radio = el('input');
      radio.type = 'radio';
      radio.name = 'guideTheme';
      radio.value = name;
      const swatch = el('span', 'guide-theme-swatch guide-swatch-' + name);
      swatch.setAttribute('aria-hidden', 'true');
      const text = el('span', 'guide-theme-option-text');
      option.append(radio, swatch, text);
      themeGroup.append(option);
      radioItems.set(name, {radio, text});
      radio.addEventListener('change', () => {
        if (!radio.checked) return;
        settings.theme = name;
        save();
      });
    }
    const reset = el('button', 'guide-settings-reset');
    reset.type = 'button';

    popup.append(head, sizeRow, sizeControls, themeTitle, themeGroup, reset);
    header.append(trigger, popup);

    function sync() {
      slider.value = String(settings.size);
      sizeValue.textContent = settings.size + '%';
      minus.disabled = settings.size <= MIN;
      plus.disabled = settings.size >= MAX;
      for (const [name, item] of radioItems) item.radio.checked = name === settings.theme;
    }
    function updateSize(value) {
      settings.size = validScale(value);
      save();
      sync();
    }
    slider.addEventListener('input', () => updateSize(slider.value));
    minus.addEventListener('click', () => updateSize(Math.max(MIN, settings.size - STEP)));
    plus.addEventListener('click', () => updateSize(Math.min(MAX, settings.size + STEP)));
    reset.addEventListener('click', () => {
      settings.size = 100;
      settings.theme = 'dark';
      save();
      sync();
    });

    const language = document.getElementById('heroLanguage');
    function translate() {
      const t = labels[language?.value] || labels.zh_tw;
      trigger.textContent = t.button;
      heading.textContent = t.heading;
      sizeTitle.textContent = t.size;
      minus.setAttribute('aria-label', t.smaller);
      plus.setAttribute('aria-label', t.larger);
      themeTitle.textContent = t.theme;
      for (const [name, item] of radioItems) item.text.textContent = t[name];
      reset.textContent = t.reset;
      close.setAttribute('aria-label', t.close);
    }
    language?.addEventListener('change', translate);
    translate();
    sync();

    function setOpen(open) {
      popup.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) slider.focus();
      else trigger.focus();
    }
    trigger.addEventListener('click', () => setOpen(popup.hidden));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !popup.hidden) {
        event.preventDefault();
        setOpen(false);
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!popup.hidden && !popup.contains(event.target) && !trigger.contains(event.target)) {
        popup.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();
