'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const officialText=read('public-official-labels.js');
const toolText=read('public-tool-i18n.js');
function runtime(){
 const localStorage={getItem:()=> 'zh_tw'};
 const window={addEventListener(){}};
 const document={title:'英靈羈絆 30 等抽選模擬器',readyState:'loading',addEventListener(){},documentElement:{}};
 vm.runInNewContext(officialText,{window});
 vm.runInNewContext(toolText,{window,document,localStorage,MutationObserver:class{}});
 return window.DFCHToolI18n;
}
test('Seven selectable languages are shared across settings and the six-star catalog',()=>{
 const s=read('display-settings.js'),h=read('hero-preferences-view.js');
 assert.match(s,/LANGUAGES=\['zh_tw','zh_cn','ja','en','ko','th','vi'\]/);
 assert.match(h,/visibleLanguages=\['zh_tw','zh_cn','ja','en','ko','th','vi'\]/);
 for(const lang of ['zh_cn','th','vi']){
   assert.ok(s.includes(lang+':{button:'));
   assert.ok(h.includes(lang+':{'));
   assert.ok(read('public-nav.js').includes(lang+':{brand:'));
   assert.ok(read('sixstar-abilities.js').includes(lang+':{kicker:'));
   assert.ok(read('sixstar-abilities.js').includes(lang+':{current:'));
 }
});
test('Official game labels cover all current Bond30 skills and summoning pools',()=>{
 const window={};vm.runInNewContext(officialText,{window});
 vm.runInNewContext(read('Bond30/js/data.js'),{window});
 const names=window.DFCHOfficialLabels;
 const data=window.DFCH_DATA;
 assert.ok(Object.keys(data.displayNames).length>=200);
 for(const str of Object.values(data.displayNames))assert.ok(names[str],str+' missing official localizations');
 for(const str of Object.values(data.poolNames))assert.ok(names[str],str+' missing pool localizations');
 for(const str of Object.values(data.heroRoster).map(h=>h.name))assert.ok(names[str],str+' missing hero localizations');
});
test('Official labels, manual controls, dynamic results and untranslated fallback behave correctly',()=>{
 const t=runtime();
 assert.equal(t.sourceTranslate('氣力','en'),'Resolve');
 assert.equal(t.sourceTranslate('氣力','ja'),'気力');
 assert.equal(t.sourceTranslate('鑽石','vi'),'Kim cương');
 assert.equal(t.sourceTranslate('金色代幣','th'),'โทเค็นทอง');
 assert.equal(t.sourceTranslate('鑽石抽取模擬器','zh_cn'),'钻石抽取模拟器');
 assert.equal(t.sourceTranslate('羈絆 30 等抽選','th'),'สุ่มสายสัมพันธ์ Lv.30');
 assert.match(t.sourceTranslate('九格已配置 9 / 9 · 可以開始抽選','en'),/Slots configured 9 \/ 9.*Ready to draw/);
 assert.match(t.sourceTranslate('獲得 💎 鑽石 ×50','vi'),/Nhận được.*Kim cương/);
 assert.equal(t.sourceTranslate('不含官方翻譯的句子','th'),'不含官方翻譯的句子');
 assert.equal(t.sourceTranslate('氣力','zh_tw'),'氣力');
});
test('Both entrypoints and the Cloudflare Pages build ship the same locale data and runtime',()=>{
 const manifest=read('scripts/build-heroes-pages.cjs'),bond=read('Bond30/index.html');
 for(const file of ['public-official-labels.js','public-tool-i18n.js']) {
   assert.ok(manifest.includes("'"+file+"'"));
   assert.ok(read('heroes.html').includes('./'+file+'?v=1.0.0'));
   assert.ok(read('index.html').includes('./'+file+'?v=1.0.0'));
   assert.ok(bond.includes('../'+file+'?v=1.0.0'));
 }
 assert.ok(bond.includes('display-settings.js?v=2.1.0'));
 assert.ok(manifest.includes('public-tool-i18n.js?v=1.0.0'));
 assert.ok(!manifest.includes("bondHtml=bondHtml.replace('<head>'"));
 assert.ok(manifest.includes('public-tool-i18n.js?v=1.0.0'));
});
test('Simulation engines and their weighted randomness remain untouched',()=>{
 assert.match(read('Bond30/js/app.js'),/Math\.random\(\)\s*\*\s*total/);
 assert.match(read('diamond-draw.js'),/return \{tier,index/);
 for(const f of ['display-settings.js','hero-preferences-view.js','sixstar-abilities.js','public-official-labels.js','public-tool-i18n.js','public-nav.js','scripts/build-heroes-pages.cjs'])assert.doesNotThrow(()=>new vm.Script(read(f)));
});
