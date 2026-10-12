const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.DFCH_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
for(const page of ['heroes.html','index.html']){
 const w=new JSDOM(fs.readFileSync(path.join(root,page),'utf8'),{url:'https://dfch.test/',runScripts:'outside-only'}).window;
 for(const f of ['hero-preferences-data.js','hero-preferences-view.js'])w.eval(fs.readFileSync(path.join(root,f),'utf8'));
 const d=w.document,buttons=d.querySelectorAll('.hero-guide-tabs button'),results=d.getElementById('giftLocationResults');
 assert.equal(results.children.length,28);assert(d.getElementById('heroGiftLocations').hidden);
 assert(!d.querySelector('.gift-bond-formula'));assert(!d.querySelector('.hero-bond-settings .unit-note'));assert(!d.querySelector('.hero-bond-toggle').textContent.includes('1.5'));
 buttons[1].click();assert(d.getElementById('heroGuideContent').hidden);assert(!d.getElementById('heroGiftLocations').hidden);
 const input=d.getElementById('giftLocationSearch');input.value='琥珀色的蜂蜜';input.dispatchEvent(new w.Event('input'));assert.equal(results.children.length,1);assert.match(results.textContent,/米維克威茲/);assert.match(results.textContent,/世界樹/);
 input.value='';input.dispatchEvent(new w.Event('input'));const select=d.getElementById('giftLocationMap');select.value='13';select.dispatchEvent(new w.Event('change'));assert.equal(results.children.length,5);assert.match(results.textContent,/魔石的碎片/);
 for(const lang of ['en','ja','ko','zh_tw']){const language=d.getElementById('heroLanguage');language.value=lang;language.dispatchEvent(new w.Event('change'));assert.equal(results.children.length,5);assert(!d.getElementById('heroGiftLocations').hidden);assert(!/305001|dropItem|stage_|undefined/.test(results.textContent));}
 buttons[0].click();assert(!d.getElementById('heroGuideContent').hidden);assert(d.getElementById('heroGiftLocations').hidden);
 for(const item of w.DFCHHeroPreferences.giftLocations.items)assert(fs.existsSync(path.join(root,`assets/gifts/${item.id}.webp`)));
 w.close();
}
console.log('Gift locations: both pages, 28 icons, tabs, map/search filters, localization and simplified gains passed');
