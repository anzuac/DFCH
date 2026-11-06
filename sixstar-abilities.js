(() => {
  'use strict';
  // Only player-visible skill descriptions and rewards are used in this client-side view.
  const DATA_URL = './data/sixstar-visible-abilities.json?v=1.3.0';
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
    ko: {kicker:'6성 · 능력과 인연',bond:'인연 레벨',reward:'인연 보상',skills:'능력',cap:'해방한 레벨 상한',next:'다음 보상',max:'전체 최대',reset:'Lv.1 초기화',obtained:'달성',upcoming:'다음 보상',notYet:'미달성',locked:'미획득',evolved:'능력 진화',close:'닫기',loading:'능력을 불러오는 중…',failed:'능력을 표시할 수 없습니다.',noEffect:'—',finish:'완료'},
    zh_cn:{kicker:'六星英灵 · 固定能力与羁绊',bond:'羁绊等级',reward:'羁绊加深',skills:'能力',cap:'已解放等级上限',next:'下一个奖励',max:'全部满级',reset:'恢复至 Lv.1',obtained:'已达成',upcoming:'下一个奖励',notYet:'未达成',locked:'尚未获得',evolved:'能力进化',close:'关闭',loading:'正在加载能力资料…',failed:'暂时无法显示能力资料。',noEffect:'—',finish:'已完成'},
    th:{kicker:'วีรชน 6 ดาว · ความสามารถและสายสัมพันธ์',bond:'ระดับสายสัมพันธ์',reward:'รางวัลสายสัมพันธ์',skills:'ความสามารถ',cap:'ขีดจำกัดเลเวลที่ปลดล็อก',next:'รางวัลถัดไป',max:'เพิ่มทุกทักษะจนสูงสุด',reset:'กลับเป็น Lv.1',obtained:'สำเร็จแล้ว',upcoming:'รางวัลถัดไป',notYet:'ยังไม่สำเร็จ',locked:'ยังไม่ได้รับ',evolved:'พัฒนาความสามารถ',close:'ปิด',loading:'กำลังโหลดข้อมูล…',failed:'ไม่สามารถแสดงข้อมูลความสามารถได้',noEffect:'—',finish:'เสร็จสิ้น'},
    vi:{kicker:'Anh linh 6 sao · Kỹ năng và liên kết',bond:'Cấp liên kết',reward:'Phần thưởng liên kết',skills:'Kỹ năng',cap:'Giới hạn cấp đã mở',next:'Phần thưởng tiếp theo',max:'Tăng tất cả lên tối đa',reset:'Đặt về Lv.1',obtained:'Đã đạt',upcoming:'Phần thưởng tiếp theo',notYet:'Chưa đạt',locked:'Chưa nhận',evolved:'Tiến hóa kỹ năng',close:'Đóng',loading:'Đang tải kỹ năng…',failed:'Không thể hiển thị dữ liệu kỹ năng.',noEffect:'—',finish:'Hoàn tất'}
  };
  const progressLabels = {
    zh_tw: {current:'目前等級羈絆值',remaining:'距離下一等還需要',cumulative:'目前累積羈絆值',nextLevel:'升至 Lv.',needed:'的累積需求',maximum:'滿級累積需求',maxed:'已滿級',progress:'羈絆進度'},
    ja: {current:'現在のレベル内の絆値',remaining:'次のレベルまで',cumulative:'累計絆値',nextLevel:'Lv.',needed:'の累計必要値',maximum:'最大レベルの必要値',maxed:'最大レベル',progress:'絆の進捗'},
    en: {current:'Bond points at this level',remaining:'Points to next level',cumulative:'Total bond points',nextLevel:'Total for Lv.',needed:'',maximum:'Max-level total',maxed:'Max level',progress:'Bond progress'},
    ko: {current:'현재 레벨의 인연 수치',remaining:'다음 레벨까지',cumulative:'누적 인연 수치',nextLevel:'Lv.',needed:' 누적 필요 수치',maximum:'최대 레벨 필요 수치',maxed:'최고 레벨',progress:'인연 진행도'},
    zh_cn:{current:'当前等级羁绊值',remaining:'距离下一级还需要',cumulative:'当前累计羁绊值',nextLevel:'升至 Lv.',needed:'的累计需求',maximum:'满级累计需求',maxed:'已满级',progress:'羁绊进度'},
    th:{current:'ค่าสายสัมพันธ์ในระดับนี้',remaining:'ต้องการอีกเพื่อเลเวลถัดไป',cumulative:'ค่าสายสัมพันธ์สะสม',nextLevel:'ยอดรวมสำหรับ Lv.',needed:'',maximum:'ยอดรวมระดับสูงสุด',maxed:'ระดับสูงสุด',progress:'ความคืบหน้าสายสัมพันธ์'},
    vi:{current:'Điểm liên kết của cấp hiện tại',remaining:'Cần thêm để lên cấp',cumulative:'Tổng điểm liên kết',nextLevel:'Tổng cần cho Lv.',needed:'',maximum:'Tổng yêu cầu cấp tối đa',maxed:'Đã đạt cấp tối đa',progress:'Tiến độ liên kết'}
  };
  const pretty = number => Number(number).toLocaleString('en-US');
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
        if (!Array.isArray(doc.bondThresholds) || doc.bondThresholds.length !== 51 ||
            !doc.bondThresholds.every((value,index,values) => Number.isSafeInteger(value) && value >= 0 && (!index || value > values[index-1]))) {
          throw new Error('Invalid bond thresholds');
        }
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
              '<div class="s6-progress">',
              '<div class="s6-progress-input-row">',
              '<label class="s6-progress-label" for="sixstarBondProgress"></label>',
              '<div class="s6-progress-input-unit">',
              '<input id="sixstarBondProgress" class="s6-progress-input" type="number" min="0" step="1" inputmode="numeric">',
              '<span class="s6-progress-cap"></span>',
              '</div>',
              '</div>',
              '<div class="s6-progress-track" role="progressbar" aria-valuemin="0">',
              '<div class="s6-progress-fill"></div>',
              '</div>',
              '<div class="s6-progress-metrics">',
              '<div><small class="s6-progress-remaining-label"></small><strong class="s6-progress-remaining"></strong></div>',
              '<div><small class="s6-progress-cumulative-label"></small><strong class="s6-progress-cumulative"></strong></div>',
              '</div>',
              '<p class="s6-progress-target"></p>',
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
    $('.s6-progress-input').addEventListener('input', event => {
      if (!active?.hero) return;
      drawProgress(true, event.target.value);
    });
    $('.s6-progress-input').addEventListener('change', commitProgress);
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
    stored[active.slug] = {bond:active.bond, levels:active.levels, progress:active.progress};
    remember();
  }
  function skillCap(skill) {
    if (!active || active.bond < skill.unlockAt) return 0;
    return active.bond >= skill.evolveAt && skill.evolveAt !== null ? skill.fullCap : skill.baseCap;
  }
  function currentCapacity() {
    if (!active?.doc || active.bond >= maxBond) return 0;
    const values = active.doc.bondThresholds;
    return values[active.bond + 1] - values[active.bond];
  }
  function drawProgress(preserveInput=false, typedValue=null) {
    if (!active?.doc) return;
    const labels = progressLabels[active.language] || progressLabels.zh_tw;
    const input = $('.s6-progress-input'), values = active.doc.bondThresholds;
    const capacity = currentCapacity();
    const maxed = active.bond === maxBond;
    const preview = preserveInput && typedValue !== null ? Number(typedValue) : active.progress;
    const points = maxed ? 0 : Math.min(capacity,Math.max(0,Number.isFinite(preview) ? Math.floor(preview) : 0));
    $('.s6-progress-label').textContent = labels.current;
    $('.s6-progress-remaining-label').textContent = labels.remaining;
    $('.s6-progress-cumulative-label').textContent = labels.cumulative;
    input.disabled = maxed;
    input.max = String(capacity);
    input.setAttribute('aria-label', labels.current);
    if (!preserveInput) input.value = String(maxed ? 0 : active.progress);
    $('.s6-progress-cap').textContent = '/ ' + pretty(capacity);
    const percentage = maxed ? 100 : capacity ? points / capacity * 100 : 0;
    $('.s6-progress-fill').style.width = percentage + '%';
    $('.s6-progress-track').setAttribute('aria-label', labels.progress);
    $('.s6-progress-track').setAttribute('aria-valuemax',String(capacity));
    $('.s6-progress-track').setAttribute('aria-valuenow',String(points));
    $('.s6-progress-remaining').textContent = maxed ? labels.maxed : pretty(capacity - points);
    $('.s6-progress-cumulative').textContent = pretty(values[active.bond] + points);
    $('.s6-progress-target').textContent = maxed
      ? labels.maximum + '：' + pretty(values[maxBond])
      : labels.nextLevel + (active.bond + 1) + labels.needed + '：' + pretty(values[active.bond+1])
          + ' · ' + labels.maximum + '：' + pretty(values[maxBond]);
  }
  function commitProgress() {
    if (!active?.hero) return;
    const raw = Number($('.s6-progress-input').value);
    const points = Number.isFinite(raw) ? Math.max(0,Math.floor(raw)) : 0;
    const totals = active.doc.bondThresholds;
    const target = Math.min(totals[maxBond],totals[active.bond] + points);
    let level = active.bond;
    while (level < maxBond && target >= totals[level + 1]) level += 1;
    active.bond = level;
    active.progress = level === maxBond ? 0 : target - totals[level];
    saveCurrent();
    draw();
  }
  function updateBond(value) {
    if (!active?.hero) return;
    const next = clamp(value, 1, maxBond);
    if (next === active.bond) return;
    active.bond = next;
    active.progress = 0;
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
    drawProgress();
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
        levels: saved.levels && typeof saved.levels === 'object' ? saved.levels : {},
        language:lang,
        progress: 0
      };
      const thresholds = doc.bondThresholds;
      const capacity = active.bond === maxBond ? 0 : thresholds[active.bond+1] - thresholds[active.bond];
      active.progress = capacity ? clamp(saved.progress ?? 0, 0, capacity-1) : 0;
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