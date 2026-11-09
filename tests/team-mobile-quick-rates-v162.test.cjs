'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'team/index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'team/js/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'team/css/style.css'),'utf8');
test('official verified six-star ability image paths and inclusion in the card filter',()=>{
 assert.ok(app.includes("'潮騷的加護':'./assets/303001033.png'"));
 assert.ok(app.includes("'古代魔法的知識':'./assets/303001115.png'"));
 assert.match(app,/key==='潮騷的加護'\|\|key==='古代魔法的知識'/);
 assert.match(app,/getSkills\(h\)\.filter\(x=>tracked\(x.name\)\)/);
});
test('mobile footer is compact, read-only, and updates from the same calculated values',()=>{
 assert.match(html,/id="mobileRateBar"/);
 assert.match(html,/<span>特殊 Boss 掉落<\/span><strong data-mobile-rate="special">/);
 assert.doesNotMatch(html,/<span>特殊 Boss<\/span><strong data-mobile-rate="special">/);
 for(const key of ['guard','abyss','greed','special'])assert.match(html,new RegExp('data-mobile-rate="'+key+'"'));
 assert.match(app,/guard:pct\(d\.total\),abyss:pct\(d\.abyssTotal\),greed:'\+'\+pct\(d\.greedSum\),special:'\+'\+pct\(d\.specialBossTotal\)/);
 assert.match(app,/updateMobileRateBar\(d\)/);
 assert.match(css,/\.mobile-rate-bar\{display:none\}/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/position:fixed;left:0;right:0;bottom:env\(safe-area-inset-bottom,0px\)/);
 assert.match(css,/body\.hero-party-public\{padding-bottom:calc\(62px \+ env\(safe-area-inset-bottom,0px\)\)\}/);
});
test('existing calculations and settings stay unchanged',()=>{
 assert.match(app,/const total=beforeEventTruncated\*eventFactor/);
 assert.match(app,/const greedSum=greed\.reduce/);
 assert.match(app,/const specialBossTotal=specialBoss\.reduce/);
 assert.match(app,/const windAshRate=calcSettings\.windAshEnabled\?/);
});

test('Image assets are available from the team folder and are valid PNG files',()=>{
 for(const id of ['303001033','303001115']){
  const content=fs.readFileSync(path.join(root,'team','assets',id+'.png'));
  assert.deepEqual([...content.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.ok(content.length>1000);
 }
});

test('mobile quick rates are hidden only while the full ability panel is on screen',()=>{
 assert.match(app,/function initMobileRateBarVisibility\(\)/);
 assert.match(app,/observer\.observe\(stats\)/);
 assert.match(app,/initMobileRateBarVisibility\(\);initArtifactSettings\(\);draw\(\)/);
 assert.match(css,/\.mobile-rate-bar\.is-context-hidden\{display:none\}/);
 const start=app.indexOf('function initMobileRateBarVisibility(){');
 const end=app.indexOf('function renderStats(){',start);
 assert.ok(start>0&&end>start);
 const classes=new Set(),attrs={},stats={};
 const bar={classList:{toggle:(name,active)=>active?classes.add(name):classes.delete(name)},setAttribute:(name,value)=>{attrs[name]=String(value)}};
 let watcher,observed;
 class FakeObserver{constructor(cb,options){watcher={cb,options}}observe(target){observed=target}}
 const init=new Function('$','IntersectionObserver',app.slice(start,end)+'return initMobileRateBarVisibility();');
 init(id=>id==='#mobileRateBar'?bar:id==='#officialStats'?stats:null,FakeObserver);
 assert.equal(observed,stats);
 assert.equal(watcher.options.rootMargin,'0px 0px -64px 0px');
 watcher.cb([{isIntersecting:true}]);
 assert.ok(classes.has('is-context-hidden'));
 assert.equal(attrs['aria-hidden'],'true');
 watcher.cb([{isIntersecting:false}]);
 assert.ok(!classes.has('is-context-hidden'));
 assert.equal(attrs['aria-hidden'],'false');
});
