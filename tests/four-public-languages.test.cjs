'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const prefs=read('display-settings.js');
const guide=read('hero-preferences-view.js');
const team=read('team/js/i18n.js');
const publicI18n=read('public-tool-i18n.js');
const officialText=read('public-official-labels.js');
const labels=JSON.parse(officialText.slice(officialText.indexOf('{'),officialText.lastIndexOf('}')+1));
const supported=['zh_tw','ja','ko','en'];

test('Shared settings and all public tools present only the requested four languages',()=>{
 assert.match(prefs,/LANGUAGES=\['zh_tw','ja','ko','en'\]/);
 assert.match(guide,/visibleLanguages=\['zh_tw','ja','ko','en'\]/);
 assert.match(publicI18n,/LANGUAGES = \['zh_tw','ja','ko','en'\]/);
 assert.match(team,/ACTIVE_LANG=\['zh_tw','ja','ko','en'\]/);
 assert.match(prefs,/langNames=\{zh_tw:'繁體中文',ja:'日本語',ko:'한국어',en:'English'\}/);
 assert.match(prefs,/const saved=localStorage.getItem\(LANG_KEY\)/);
 assert.match(prefs,/if\(saved\)localStorage.setItem\(LANG_KEY,'zh_tw'\)/);
 assert.match(team,/const LANG=\['zh_tw','zh_cn','ja','en','ko','th','vi'\]/);
});
test('Original Japanese, Korean and English guide explanations stay visible',()=>{
 const start=guide.indexOf('const guideCopy={'),end=guide.indexOf('const guideSource=',start);
 assert.ok(start>0&&end>start);
 const notes=new Function(guide.slice(start,end)+'return guideCopy;')();
 for(const [key,translations] of Object.entries(notes)){
  for(const lang of ['ja','ko','en']){
   assert.ok(translations[lang]&&translations[lang]!==key,key+' -> '+lang);
  }
 }
 assert.ok(Object.keys(notes).length>=7);
 assert.doesNotMatch(guide,/\.hidden=lang!=='zh_tw'/);
 assert.match(guide,/localizeGuideCopy\(header\.querySelector\('\.helper'\)\)/);
 assert.match(guide,/localizeGuideCopy\(panel\.querySelector\('\.hero-standalone-link'\)\)/);
});
test('Hero team translates mixed Chinese names from verified official labels',()=>{
 const segment=team.slice(team.indexOf('const LANG='),team.indexOf("window.addEventListener('dfch:language-change'"));
 const factory=new Function('window','localStorage','document','queueMicrotask',segment+'return translate;');
 for(const [lang,name,skill] of [
  ['ja','アカシャ','大海の支配者'],
  ['en','Akasha','Oceanic ruler'],
  ['ko','아카샤','대해의 지배자']
 ]){
  const translate=factory({DFCHOfficialLabels:labels},{getItem:()=>lang},{},()=>{});
  const output=translate('第 2 格・阿卡夏・大海的支配者');
  assert.ok(output.includes(name),lang+' hero name: '+output);
  assert.ok(output.includes(skill),lang+' ability name: '+output);
  assert.ok(!output.includes('阿卡夏')&&!output.includes('大海的支配者'));
  const legacy=factory({DFCHOfficialLabels:labels},{getItem:()=> 'vi'}, {},()=>{});
  assert.equal(legacy('活動效果'),'活動效果');
 }
});
test('Common team notices have real translations in all active non-Chinese languages',()=>{
 const src=team.slice(team.indexOf('const entries='),team.indexOf('const langs='));
 const entries=new Function(src+'return entries;')();
 for(const key of [
  '同名六星英靈不能重複編隊，不同造型也視為同名；「其他」可以配置多格。',
  '技能預設為一般最高等級，可突破的技能勾選後會套用突破等級。',
  '確定要清空全部 12 格編隊？',
  '預設 3%，可依照目前關卡調整。',
  '禁斷守門人的基礎出現率預設為 3%，可自行修改；神器、技能、活動倍率會自動重算。'
 ]){
  assert.ok(entries[key],key);
  for(const offset of [1,2,3])assert.ok(entries[key][offset]&&entries[key][offset]!==key,key+' translation '+offset);
 }
});
test('Hidden-language legacy data and formulas remain intact',()=>{
 assert.match(read('sixstar-abilities.js'),/zh_cn:\{/);
 assert.match(read('team/js/app.js'),/const total=beforeEventTruncated\*eventFactor/);
 assert.match(read('team/js/app.js'),/const greedCombined=greedSum\+greedArtifactTotal/);
 assert.match(read('team/js/app.js'),/const EVENT_OPTIONS=Object\.freeze/);
});
test('All published entrypoints refresh caches for the language scripts',()=>{
 const files=['heroes.html','Bond30/index.html','team/index.html','index.html','scripts/build-heroes-pages.cjs'];
 for(const file of files){
  const source=read(file);
  if(file==='team/index.html')assert.match(source,/\.\/js\/i18n\.js\?v=1\.15\.8/);
  if(file!=='index.html')assert.match(source,/display-settings\.js\?v=2\.1\.1/);
  if(file!=='team/index.html')assert.match(source,/public-tool-i18n\.js\?v=1\.0\.1/);
 }
 for(const file of ['heroes.html','index.html'])assert.match(read(file),/hero-preferences-view\.js\?v=2\.7\.1/);
});

test('Team titles use official localizations and missing UI strings use explicit fallbacks',()=>{
 const data=JSON.parse(read('data/hero-preferences.json'));
 const teamSource=read('team/js/i18n.js');
 const segment=teamSource.slice(teamSource.indexOf('const LANG='),teamSource.indexOf('function refresh()'));
 const factory=new Function('window','localStorage',segment+'return translate;');
 const missing={freya:{en:'Black Goddess Seeking Undying Love',ko:'불멸의 사랑을 찾는 검은 여신'},frigg:{en:'White Goddess Watching Over Bonds',ko:'인연을 지켜보는 하얀 여신'}};
 const sources={DFCHOfficialLabels:labels,DFCHHeroPreferences:data};
 assert.match(read('team/index.html'),/hero-preferences-data\.js\?v=2\.3\.2/);
 for(const lang of ['ja','en','ko']){
  const translate=factory(sources,{getItem:()=>lang});
  for(const hero of data.heroes){
   const expected=hero.translations[lang].title||missing[hero.key]?.[lang];
   assert.ok(expected,hero.key+' missing '+lang+' title');
   assert.equal(translate(hero.translations.zh_tw.title),expected,hero.key+' title -> '+lang);
  }
  for(const key of ['介入者之咒輪等級','壞掉的回路等級','欲望之窺視鏡等級','不祥的迴路等級','最遠距離（每 30）']){
   assert.notEqual(translate(key),key,lang+' untranslated '+key);
  }
 }
 const translate=factory(sources,{getItem:()=> 'en'});
 assert.equal(translate('第 2 格・英靈設定'),'Slot 2 · Hero settings');
});

test('Team help modal shows only the approved full two-section guide across all four languages',()=>{
 const html=read('team/index.html');
 const start=html.indexOf('<div class="overlay help-overlay hidden"');
 const end=html.indexOf('<div class="toast"',start);
 assert.ok(start>=0&&end>start);
 const modal=html.slice(start,end);
 const headings=[...modal.matchAll(/<h3>(.*?)<\/h3>/g)].map(match=>match[1]);
 assert.deepEqual(headings,['使用方式','注意事項']);
 assert.match(modal,/<h2 id="helpTitle">使用方式與注意事項<\/h2>/);
 assert.equal((modal.match(/<li>/g)||[]).length,8);
 for(const phrase of ['弗雷雅（黑色女神）','芙麗嘉（白色女神）','儲存與圖片','角色與能力圖片使用 DFCH 官方資料']){
  assert.ok(!modal.includes(phrase),'Removed help text still present: '+phrase);
 }
 const src=team.slice(team.indexOf('const entries='),team.indexOf('const langs='));
 const entries=new Function(src+'return entries;')();
 const phrases=["使用方式與注意事項","使用方式","點選任一格卡片，可選擇英靈、查看固定技能，並設定可突破的技能。","調整神器、活動、距離與其他條件後，畫面中的機率與寶箱加成會自動重新計算。","設定完成後，點擊「儲存」即可返回 12 格總覽，並保留目前設定。","如需修改，重新點選該卡片即可再次編輯。","注意事項","本工具為非官方整理與試算頁面，結果僅供參考，實際內容仍以遊戲內表現為準。","不同英靈、技能、神器、活動與距離設定，皆可能影響顯示的機率與加成結果。","編隊與相關設定會儲存在目前瀏覽器的本機空間；若清除瀏覽器資料或更換裝置，設定可能消失。","圖片與資料會依目前版本整理，後續若遊戲更新，部分內容可能再調整。"];
 for(const phrase of phrases){
  assert.ok(modal.includes(phrase)||phrase==='使用方式與注意事項','Help text missing: '+phrase);
  assert.ok(entries[phrase],'Missing language key: '+phrase);
  for(const languageIndex of [1,2,3]){
   assert.ok(entries[phrase][languageIndex]&&entries[phrase][languageIndex]!==phrase,'Missing help translation: '+phrase+' / '+languageIndex);
  }
 }
});
