(() => {
  'use strict';
  // Only player-visible skill descriptions and rewards are used in this client-side view.
  const DATA_URL = './data/sixstar-visible-abilities.json?v=1.1.0';
  const STORAGE = 'dfch-sixstar-abilities-v1';
  const maxBond = 50;
  let dataPromise = null;
  let dialog = null;
  let active = null;
  let previousFocus = null;
  let loadTicket = 0;
  const iconCache = new Map();
  const translations = {
    zh_tw: {kicker:'六星英靈 · 固定能力與羈絆',bond:'羈絆等級',reward:'羈絆加深',skills:'能力',cap:'已解放等級上限',next:'下一個獎勵',max:'全部滿等',reset:'還原至 Lv.1',obtained:'已達成',upcoming:'下一個獎勵',notYet:'未達成',locked:'尚未取得',evolved:'能力進化',close:'關閉',loading:'能力資料載入中…',failed:'目前無法顯示能力資料。',noEffect:'—',finish:'已完成'},
    ja: {kicker:'星6 · 固定能力と絆',bond:'絆レベル',reward:'絆',skills:'能力',cap:'解放した上限',next:'次の報酬',max:'すべて最大',reset:'Lv.1 に戻す',obtained:'達成済',upcoming:'次の報酬',notYet:'未達成',locked:'未習得',evolved:'能力進化',close:'閉じる',loading:'読み込み中…',failed:'能力データを表示できません。',noEffect:'—',finish:'完了'},
    en: {kicker:'Six-star · Abilities & bond',bond:'Bond level',reward:'Bond rewards',skills:'Abilities',cap:'Unlocked level cap',next:'Next reward',max:'Max all',reset:'Reset to Lv.1',obtained:'Unlocked',upcoming:'Next reward',notYet:'Locked',locked:'Not obtained',evolved:'Evolved',close:'Close',loading:'Loading abilities…',failed:'Unable to display abilities.',noEffect:'—',finish:'Complete'},
    ko: {kicker:'6성 · 능력과 인연',bond:'인연 레벨',reward:'인연 보상',skills:'능력',cap:'해방한 레벨 상한',next:'다음 보상',max:'전체 최대',reset:'Lv.1 초기화',obtained:'달성',upcoming:'다음 보상',notYet:'미달성',locked:'미획득',evolved:'능력 진화',close:'닫기',loading:'능력을 불러오는 중…',failed:'능력을 표시할 수 없습니다.',noEffect:'—',finish:'완료'}
  };
  const $ = (selector) => dialog.querySelector(selector);
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined && text !== null) el.textContent = String(text);
    if (className) el.className = className;
    return el;
  };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(Number(x)) ? Math.floor(Number(x)) : lo));
  let stored = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) stored = parsed;
  } catch {}
  function remember() {
    try { localStorage.setItem(STORAGE, JSON.stringify(stored)); } catch {}
  }
  function load() {
    if (!dataPromise) {
      dataPromise = fetch(DATA_URL, {cache:'no-cache'}).then(response => {
        if (!response.ok) throw new Error('Unavailable');
        return response.json();
      }).then(doc => {
        if (!doc || !Array.isArray(doc.heroes) || doc.heroes.length !== 23 || !Array.isArray(doc.bondRewards)) throw new Error('Incomplete');
        return doc;
      }).catch(error => { dataPromise = null; throw error; });
    }
    return dataPromise;
  }
  function resolveIcon(source) {
    if (!source) return Promise.reject(new Error('Missing picture'));
    if (source.startsWith('data:image/png;base64,')) return Promise.resolve(source);
    if (!/^https:\/\/api\.github\.com\/repos\/anzuac\/DFCH\/git\/blobs\/[a-f0-9]{40}$/.test(source)) return Promise.reject(new Error('Invalid picture'));
    if (!iconCache.has(source)) iconCache.set(source, fetch(source, {headers:{Accept:'application/vnd.github+json'}})
      .then(r => {if (!r.ok) throw new Error('Unavailable'); return r.json();})
      .then(blob => {if (!blob.content || blob.encoding !== 'base64') throw new Error('Invalid'); return 'data:image/png;base64,' + blob.content.replace(/\s/g,'');}));
    return iconCache.get(source);
  }
  function mount() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'sixstar-ability-dialog';
    dialog.setAttribute('aria-labelledby', 'sixstarAbilityTitle');
    dialog.innerHTML = [
      '<div class="s6-root">',
        '<header class="s6-header">',
          '<img class="s6-portrait" alt="" width="72" height="72">',
          '<div class="s6-identity"><p class="s6-kicker"></p><h2 id="sixstarAbilityTitle"></h2><p class="s6-subtitle"></p></div>',
          '<button class="s6-close" type="button" aria-label="關閉">×</button>',
        '</header>',
        '<div class="s6-body">',
          '<section class="s6-panel s6-bond-panel">',
            '<div class="s6-heading"><h3 class="s6-bond-heading"></h3><strong class="s6-bond-number"></strong></div>',
            '<div class="s6-bond-controls">',
              '<button class="s6-action s6-minus-bond" type="button" aria-label="降低羈絆等級">−</button>',
              '<input type="range" class="s6-bond-range" min="1" max="50" step="1" aria-label="羈絆等級">',
              '<button class="s6-action s6-plus-bond" type="button" aria-label="增加羈絆等級">＋</button>',
            '</div>',
            '<div class="s6-stats">',
              '<div><small class="s6-cap-label"></small><strong class="s6-total-cap"></strong></div>',
              '<div><small class="s6-next-label"></small><strong class="s6-next-bond"></strong></div>',
            '</div>',
            '<div class="s6-rewards" aria-live="off"></div>',
          '</section>',
          '<section class="s6-panel s6-skills-panel">',
            '<div class="s6-heading s6-skill-heading"><h3 class="s6-skills-heading"></h3>',
              '<div class="s6-actions"><button type="button" class="s6-action s6-all-max"></button><button type="button" class="s6-action s6-all-reset"></button></div>',
            '</div>',
            '<div class="s6-skills"></div>',
          '</section>',
        '</div>',
      '</div>'
    ].join('');
    document.body.append(dialog);
    $('.s6-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {if (event.target === dialog) dialog.close();});
    dialog.addEventListener('close', () => {if (previousFocus && previousFocus.isConnected) previousFocus.focus();});
    $('.s6-minus-bond').addEventListener('click', () => updateBond(active?.bond - 1));
    $('.s6-plus-bond').addEventListener('click', () => updateBond(active?.bond + 1));
    $('.s6-bond-range').addEventListener('input', event => updateBond(event.target.value));
    $('.s6-all-max').addEventListener('click', () => {
      if (!active?.hero) return;
      active.hero.skills.forEach((skill,i) => {const c = skillCap(skill); if (c) active.levels[i] = c;});
      saveCurrent(); draw();
    });
    $('.s6-all-reset').addEventListener('click', () => {
      if (!active?.hero) return;
      active.hero.skills.forEach((_, i) => {active.levels[i] = 1;});
      saveCurrent(); draw();
    });
  }
  function saveCurrent() {
    if (!active) return;
    stored[active.slug] = {bond:active.bond, levels:active.levels};
    remember();
  }
  function skillCap(skill) {
    if (!active || active.bond < skill.unlockAt) return 0;
    return active.bond >= skill.evolveAt && skill.evolveAt !== null ? skill.fullCap : skill.baseCap;
  }
  function updateBond(value) {
    if (!active?.hero) return;
    const next = clamp(value, 1, maxBond);
    if (next === active.bond) return;
    active.bond = next;
    saveCurrent();
    draw();
  }
  function draw() {
    if (!active?.hero || !active.doc) return;
    const t = active.t, h = active.hero;
    $('.s6-bond-number').textContent = 'Lv.' + active.bond + ' / 50';
    $('.s6-bond-range').value = String(active.bond);
    $('.s6-minus-bond').disabled = active.bond === 1;
    $('.s6-plus-bond').disabled = active.bond === 50;
    const currentReward = active.doc.bondRewards.find(r => r.level === active.bond);
    $('.s6-total-cap').textContent = '×' + (currentReward?.totalBreakthrough || 0);
    const combined = [];
    for (const r of active.doc.bondRewards) {
      const texts = h.rewards.filter(x => x.level === r.level).map(x => x.text);
      if (r.breakthrough) texts.unshift('解放等級上限 ×' + r.breakthrough);
      if (texts.length) combined.push({level:r.level, text:texts.join('、')});
    }
    const next = combined.find(r => r.level > active.bond);
    $('.s6-next-bond').textContent = next ? 'Lv.' + next.level : t.finish;
    const rewards = $('.s6-rewards'), previousScroll = rewards.scrollTop;
    rewards.replaceChildren();
    for (const reward of combined) {
      const status = reward.level <= active.bond ? 'done' : (reward.level === next?.level ? 'next' : 'future');
      const row = node('div', null, 's6-reward s6-' + status);
      row.append(node('span', String(reward.level), 's6-reward-level'));
      const body = node('div', null, 's6-reward-content');
      body.append(node('strong', reward.text), node('small', status === 'done' ? t.obtained : status === 'next' ? t.upcoming : t.notYet));
      row.append(body); rewards.append(row);
    }
    rewards.scrollTop = previousScroll;
    const skills = $('.s6-skills');
    skills.replaceChildren();
    for (const [i,skill] of h.skills.entries()) {
      const cap = skillCap(skill), level = cap ? clamp(active.levels[i] || 1, 1, cap) : 0;
      const row = node('article', null, 's6-skill' + (!cap ? ' s6-locked' : ''));
      const icon = node('div', '✦', 's6-icon');
      const iconUrl = active.doc.icons?.[skill.icon];
      if (iconUrl) {
        resolveIcon(iconUrl).then(src => {
          if (active.slug !== h.slug || !icon.isConnected) return;
          const img = node('img'); img.src = src; img.alt = ''; img.width = 52; img.height = 52;
          img.onerror = () => icon.replaceChildren(node('span', '✦'));
          icon.replaceChildren(img);
        }).catch(() => {});
      }
      const content = node('div', null, 's6-skill-content');
      const title = node('div', null, 's6-skill-title');
      const evolved = skill.evolveAt !== null && active.bond >= skill.evolveAt;
      title.append(node('strong', evolved ? skill.evolvedName : skill.name));
      if (evolved) title.append(node('span', t.evolved, 's6-tag'));
      if (skill.unlockAt > 0) title.append(node('span', cap ? t.obtained : 'Lv.' + skill.unlockAt, 's6-tag'));
      content.append(title);
      if (cap) {
        const meter = node('div', null, 's6-skill-meter');
        const minus = node('button', '−', 's6-action');
        const plus = node('button', '＋', 's6-action');
        minus.type = plus.type = 'button';
        minus.disabled = level === 1; plus.disabled = level === cap;
        minus.setAttribute('aria-label', skill.name + ' 降低等級');
        plus.setAttribute('aria-label', skill.name + ' 增加等級');
        minus.addEventListener('click', () => {active.levels[i] = level - 1; saveCurrent(); draw();});
        plus.addEventListener('click', () => {active.levels[i] = level + 1; saveCurrent(); draw();});
        meter.append(minus, node('strong', 'Lv.' + level + '/' + cap), plus);
        content.append(meter);
        const effect = skill.levelEffects?.[level - 1] || t.noEffect;
        content.append(node('p', effect, 's6-effect'));
      } else {
        content.append(node('p', t.locked, 's6-effect s6-muted'));
      }
      row.append(icon, content); skills.append(row);
    }
  }
  async function open({heroKey, lang='zh_tw', heroName=null, heroTitle=null}={}) {
    if (!/^[a-z0-9_]+$/.test(heroKey || '')) return;
    const t = translations[lang] || translations.zh_tw;
    mount();
    previousFocus = document.activeElement;
    const ticket = ++loadTicket;
    if (!dialog.open) dialog.showModal();
    $('.s6-portrait').src = './assets/heroes/' + heroKey + '.webp';
    $('.s6-portrait').alt = '';
    $('.s6-kicker').textContent = t.kicker;
    $('#sixstarAbilityTitle').textContent = heroName || '';
    $('.s6-subtitle').textContent = heroTitle || '';
    $('.s6-close').setAttribute('aria-label', t.close);
    $('.s6-close').focus();
    $('.s6-bond-heading').textContent = t.reward;
    $('.s6-cap-label').textContent = t.cap;
    $('.s6-next-label').textContent = t.next;
    $('.s6-skills-heading').textContent = t.skills;
    $('.s6-all-max').textContent = t.max;
    $('.s6-all-reset').textContent = t.reset;
    $('.s6-rewards').replaceChildren(node('p', t.loading, 's6-loading'));
    $('.s6-skills').replaceChildren(node('p', t.loading, 's6-loading'));
    active = null;
    try {
      const doc = await load();
      if (ticket !== loadTicket || !dialog.open) return;
      const hero = doc.heroes.find(h => h.slug === heroKey);
      if (!hero) throw new Error('Not found');
      const saved = stored[heroKey] || {};
      active = {
        slug:heroKey, hero, doc, t,
        bond:clamp(saved.bond || 1, 1, maxBond),
        levels: saved.levels && typeof saved.levels === 'object' ? saved.levels : {}
      };
      $('#sixstarAbilityTitle').textContent = heroName || hero.name;
      $('.s6-subtitle').textContent = heroTitle || hero.title;
      draw();
    } catch {
      if (ticket !== loadTicket || !dialog.open) return;
      $('.s6-rewards').replaceChildren(node('p', t.failed, 's6-loading'));
      $('.s6-skills').replaceChildren(node('p', t.failed, 's6-loading'));
    }
  }
  window.DFCHSixstarAbilityModal = Object.freeze({open});
})();