const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require(process.env.DFCH_JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..');
for(const page of ['heroes.html','index.html']){
 const make=(saved=false)=>{const w=new JSDOM(fs.readFileSync(path.join(root,page),'utf8'),{url:'https://dfch.test/',runScripts:'outside-only'}).window;if(saved)w.localStorage.setItem('dfch-hero-bond-statue','true');for(const file of ['hero-preferences-data.js','hero-preferences-view.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));return w;};
 const w=make(),d=w.document,toggle=d.getElementById('heroBondStatue');
 const gain=selector=>Number(d.querySelector(selector).dataset.bondGain);
 const milk='[data-hero="13"] .loved [data-gift="305001003"]',pumpkin='#heroCommonGifts [data-gift="305000026"]';
 assert.equal(gain(milk),80);assert.equal(gain(pumpkin),60);
 toggle.click();assert.equal(gain(milk),120);assert.equal(gain(pumpkin),90);assert.equal(w.localStorage.getItem('dfch-hero-bond-statue'),'true');
 assert([...d.querySelectorAll('.favorite [data-bond-gain]')].some(e=>e.dataset.bondGain==='67'));
 const search=d.getElementById('heroSearch');search.value='伊茲';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('.hero-preference-card').length,3);
 for(const lang of ['en','ja','ko','zh_tw']){const e=d.getElementById('heroLanguage');e.value=lang;e.dispatchEvent(new w.Event('change'));assert(toggle.checked);assert.equal(gain(pumpkin),90);assert(d.querySelector('.hero-bond-toggle').textContent.includes(w.DFCHHeroPreferences.bondGains.artifact.translations[lang]));}
 d.getElementById('heroClearFilters').click();assert(toggle.checked);assert.equal(d.querySelectorAll('.hero-preference-card').length,23);
 toggle.click();assert.equal(gain(milk),80);assert.equal(gain(pumpkin),60);w.close();
 const restored=make(true);assert(restored.document.getElementById('heroBondStatue').checked);assert.equal(restored.document.querySelector(milk).dataset.bondGain,'120');restored.close();
}
console.log('Both pages: bond gain, flooring, common gifts, toggle, persistence, filters and four languages passed');
