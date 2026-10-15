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
  if(file==='team/index.html')assert.match(source,/\.\/js\/i18n\.js\?v=1\.15\.6/);
  if(file!=='index.html')assert.match(source,/display-settings\.js\?v=2\.1\.1/);
  if(file!=='team/index.html')assert.match(source,/public-tool-i18n\.js\?v=1\.0\.1/);
 }
 for(const file of ['heroes.html','index.html'])assert.match(read(file),/hero-preferences-view\.js\?v=2\.7\.1/);
});
