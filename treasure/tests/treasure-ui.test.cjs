'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../engine.js'),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
class FakeElement {
 constructor(id='') {
  this.id=id;this.children=[];this.hidden=false;this.dataset={};this.style={setProperty(){}};
  this.attributes={};this.events={};this.textContent='';this.className='';this.parent=null;
  this.value='';this.scrollTop=0;this.scrollHeight=0;this.clientHeight=310;
  const set=new Set();this.classList={add:c=>set.add(c),remove:c=>set.delete(c),toggle:(c,on)=>{if(on===undefined?!set.has(c):on)set.add(c);else set.delete(c)},contains:c=>set.has(c)};
 }
 addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
 dispatch(name,extras={}){for(const fn of this.events[name]||[])fn({pointerId:1,pointerType:'mouse',isPrimary:true,button:0,preventDefault(){},...extras})}
 append(...nodes){for(const n of nodes){this.children.push(n);n.parent=this;this.scrollHeight=Math.ceil(this.children.length/10)*62}}
 replaceChildren(...nodes){this.children=[];this.scrollHeight=0;this.append(...nodes)}
 setAttribute(k,v){this.attributes[k]=String(v)}
 getAttribute(k){return this.attributes[k]}
}
function build(randomSequence=null,existingStore=null) {
 const ids=['openOnce','skipAnimation','skipAnimationLabel','statRuns','statItems','statA','statB','statC','statN','statR','statSR','statSSR','statUR','statAverage','statRetention','statHitRuns','emptyResult','resultContent','lastMode','lastItems','lastRare','lastStreak','lastPoints','statPracticePoints','lootCaption','lootHeadline','lootGrid','lootRemainder','liveDropProgress','liveDropMessage','liveDropCount','autoDrawStatus','drawButtonText','resetStats','resultPanel'];
 const map=Object.fromEntries(ids.map(id=>[id,new FakeElement(id)]));
 const document=new FakeElement();document.hidden=false;
 document.getElementById=id=>{if(!map[id])throw Error('Unknown id '+id);return map[id]};
 document.createElement=()=>new FakeElement();
 const win=new FakeElement('window'),store=existingStore||{};
 win.DFCHTreasureEngine=E;win.matchMedia=()=>({matches:false});
 win.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}};win.confirm=()=>true;
 const context={window:win,document,console,setTimeout,clearTimeout,Math:Object.create(Math),Intl};
 let pos=0;const seq=randomSequence||[.5,.5,.5,.5,.99];context.Math.random=()=>seq[pos++%seq.length];
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
 return {map,win,document,store};
}
test('tap reveals one item at a time, stats only committed at chest completion',async()=>{
 const {map}=build();
 map.openOnce.dispatch('click');
 assert.equal(map.statRuns.textContent,'0');
 assert.equal(map.lootGrid.children.length,1);
 assert.equal(map.lastItems.textContent,'1');
 await sleep(155);
 assert.ok(map.lootGrid.children.length>=2&&map.lootGrid.children.length<4);
 assert.equal(map.statRuns.textContent,'0');
 await sleep(275);
 assert.equal(map.statRuns.textContent,'1');
 assert.equal(map.lootGrid.children.length,4);
 assert.equal(map.lastMode.textContent,'普通開箱 · 已完成');
});
test('skip reveals immediately and mid-opening skip does not double count',async()=>{
 const {map,store}=build();
 map.skipAnimation.checked=!map.skipAnimation.checked;map.skipAnimation.dispatch('change');
 map.openOnce.dispatch('click');
 assert.equal(map.statRuns.textContent,'1');
 map.skipAnimation.checked=!map.skipAnimation.checked;map.skipAnimation.dispatch('change');
 map.openOnce.dispatch('click');
 assert.equal(map.statRuns.textContent,'1');
 await sleep(120);map.skipAnimation.checked=!map.skipAnimation.checked;map.skipAnimation.dispatch('change');
 assert.equal(map.statRuns.textContent,'2');
 await sleep(350);
 assert.equal(map.statRuns.textContent,'2');
 assert.equal(JSON.parse(store['dfch-treasure-continuation-v2']).stats.runs,2);
});
test('three jackpots and rarity SSR show separately and cumulative counts are exact',()=>{
 const {map,store}=build([.00001,.00011,.0001502,.97,.99]);
 map.skipAnimation.checked=!map.skipAnimation.checked;map.skipAnimation.dispatch('change');map.openOnce.dispatch('click');
 assert.deepEqual(map.lootGrid.children.map(x=>x.className),[
  'loot-tile type-A','loot-tile type-B','loot-tile type-C','loot-tile type-SSR']);
 assert.equal(map.lastRare.textContent,'3');
 assert.equal(map.statA.textContent,'1');
 assert.equal(map.statB.textContent,'1');
 assert.equal(map.statC.textContent,'1');
 assert.equal(map.statSSR.textContent,'1');
 assert.equal(map.statItems.textContent,'4');
 const s=JSON.parse(store['dfch-treasure-continuation-v2']).stats;
 assert.equal(s.items,s.a+s.b+s.c+s.ordinary);
 assert.equal(s.ordinary,s.n+s.r+s.sr+s.ssr+s.ur);
});
test('60 rewards remain in five-row scroll viewport without truncation',()=>{
 const seq=[];for(let i=1;i<=60;i++){seq.push(.5);if(i>=4)seq.push(i===60?.99:.2);}
 const {map}=build(seq);
 map.skipAnimation.checked=!map.skipAnimation.checked;map.skipAnimation.dispatch('change');map.openOnce.dispatch('click');
 assert.equal(map.lootGrid.children.length,60);
 assert.equal(map.lootRemainder.hidden,false);
 assert.equal(map.statRuns.textContent,'1');
 assert.equal(map.lastItems.textContent,'60');
});
test('long hold stops opening additional chests when finger is released',async()=>{
 const {map,win}=build();
 map.openOnce.dispatch('pointerdown',{pointerId:31});
 await sleep(525);
 assert.equal(map.statRuns.textContent,'0');
 win.dispatch('pointerup',{pointerId:31});
 await sleep(295);
 assert.equal(map.statRuns.textContent,'1');
 await sleep(400);
 assert.equal(map.statRuns.textContent,'1');
 map.openOnce.dispatch('click'); // suppress synthetic long press click
 assert.equal(map.statRuns.textContent,'1');
});
test('reset creates a fresh valid v2 record, legacy profile and old statistics remain untouched',()=>{
 const old={stats:{runs:100,items:3000},profile:{nickname:'舊玩家'},skipAnimation:true};
 const store={'dfch-treasure-continuation-v1':JSON.stringify(old)};
 const {map}=build(null,store);
 assert.equal(map.statRuns.textContent,'0','old result distribution must never mix with new pool');
 assert.equal(map.skipAnimation.checked,true,'old animation preference retained');
 map.openOnce.dispatch('click');assert.equal(map.statRuns.textContent,'1');
 map.resetStats.dispatch('click');assert.equal(map.statRuns.textContent,'0');
 assert.deepEqual(JSON.parse(store['dfch-treasure-continuation-v1']),old);
 assert.equal(JSON.parse(store['dfch-treasure-continuation-v2']).stats.runs,0);
});
