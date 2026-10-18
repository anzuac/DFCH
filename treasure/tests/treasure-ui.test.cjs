'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const E = require('../engine.js');
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));

class FakeElement {
  constructor(id=''){
    this.id=id;this.children=[];this.hidden=false;this.dataset={};this.style={setProperty(){}};
    this.attributes={};this.events={};this.textContent='';this.className='';this.parent=null;
    const set=new Set();this.classList={add:c=>set.add(c),remove:c=>set.delete(c),toggle:(c,on)=>{if(on===undefined?(!set.has(c)):on)set.add(c);else set.delete(c)},contains:c=>set.has(c)};
  }
  addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
  dispatch(name,extras={}){for(const fn of this.events[name]||[])fn({pointerId:1,pointerType:'mouse',isPrimary:true,button:0,preventDefault(){},...extras})}
  append(...nodes){for(const n of nodes){this.children.push(n);n.parent=this}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes)}
  setAttribute(k,v){this.attributes[k]=String(v)}
  getAttribute(k){return this.attributes[k]}
  querySelectorAll(selector){if(selector==='.type-ordinary')return this.children.filter(x=>x.className.includes('type-ordinary'));return []}
  remove(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null}}
}
function build(){
  const ids=['openOnce','skipAnimation','skipAnimationLabel','minItemCaption','probPerRun','statRuns','statItems','statA','statB','statAverage','statRetention','statHitRuns','emptyResult','resultContent','lastMode','lastItems','lastRare','lastStreak','lootCaption','lootHeadline','lootGrid','lootRemainder','liveDropProgress','liveDropMessage','liveDropCount','autoDrawStatus','drawButtonText','resetStats','resultPanel'];
  const map=Object.fromEntries(ids.map(id=>[id,new FakeElement(id)]));
  const modes=[4,11].map(minimum=>{const e=new FakeElement();e.dataset.minimum=String(minimum);return e});
  const document=new FakeElement();
  document.hidden=false;
  document.getElementById=id=>{if(!map[id])throw Error('Unknown id '+id);return map[id]};
  document.querySelectorAll=sel=>sel==='.mode-option'?modes:[];
  document.createElement=()=>new FakeElement();
  const win=new FakeElement('window');
  const store={};win.DFCHTreasureEngine=E;win.matchMedia=()=>({matches:false});
  win.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}};
  win.confirm=()=>true;
  const context={window:win,document,console,setTimeout,clearTimeout,Math:Object.create(Math),Intl};
  let pos=0;const seq=[.5,.5,.5,.5,.99];context.Math.random=()=>seq[pos++%seq.length];
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
  return {map,modes,win,document,store};
}

test('tap reveals one item at a time and only records once at chest completion',async()=>{
 const {map}=build();
 map.openOnce.dispatch('click');
 assert.equal(map.statRuns.textContent,'0');
 assert.equal(map.lootGrid.children.length,1);
 assert.equal(map.lastItems.textContent,'1');
 await sleep(155);
 assert.ok(map.lootGrid.children.length>=2 && map.lootGrid.children.length<4);
 assert.equal(map.statRuns.textContent,'0');
 await sleep(260);
 assert.equal(map.statRuns.textContent,'1');
 assert.equal(map.lootGrid.children.length,4);
 assert.equal(map.lastItems.textContent,'4');
 assert.equal(map.lastMode.textContent,'普通開箱 · 已完成');
});

test('skip toggles between instant draw and progressive draw; mid-animation skip completes exactly once',async()=>{
 const {map,store}=build();
 map.skipAnimation.dispatch('click');
 assert.equal(map.skipAnimation.getAttribute('aria-pressed'),'true');
 assert.ok(map.skipAnimationLabel.textContent.endsWith('開啟'));
 map.openOnce.dispatch('click');
 assert.equal(map.statRuns.textContent,'1');
 assert.equal(map.lootGrid.children.length,4);
 map.skipAnimation.dispatch('click');
 map.openOnce.dispatch('click');
 assert.equal(map.statRuns.textContent,'1');
 await sleep(125);
 map.skipAnimation.dispatch('click');
 assert.equal(map.statRuns.textContent,'2');
 await sleep(350);
 assert.equal(map.statRuns.textContent,'2');
 assert.equal(JSON.parse(store['dfch-treasure-continuation-v1']).stats.runs,2);
});

test('release while revealing finishes current chest, with no new chest and correct hold count',async()=>{
 const {map,win}=build();
 map.openOnce.dispatch('pointerdown',{pointerId:31});
 await sleep(530);
 assert.equal(map.statRuns.textContent,'0');
 assert.ok(map.lootGrid.children.length>=1 && map.lootGrid.children.length<4);
 win.dispatch('pointerup',{pointerId:31});
 await sleep(290);
 assert.equal(map.statRuns.textContent,'1');
 assert.ok(map.autoDrawStatus.textContent.includes('完成 1 箱'));
 await sleep(500);
 assert.equal(map.statRuns.textContent,'1');
 // The synthetic click from the old held press must not create another chest.
 map.openOnce.dispatch('click');
 assert.equal(map.statRuns.textContent,'1');
 // A NEW pointer press clears suppression and can draw again.
 map.openOnce.dispatch('pointerdown',{pointerId:32});
 win.dispatch('pointerup',{pointerId:32});
 map.openOnce.dispatch('click');
 await sleep(350);
 assert.equal(map.statRuns.textContent,'2');
});

test('holding while skip is on completes multiple separate chests; release stops immediately',async()=>{
 const {map,win}=build();
 map.skipAnimation.dispatch('click');
 map.openOnce.dispatch('pointerdown',{pointerId:50});
 await sleep(1120);
 assert.ok(Number(map.statRuns.textContent)>=3,map.statRuns.textContent);
 win.dispatch('pointerup',{pointerId:50});
 const final=map.statRuns.textContent;
 await sleep(360);
 assert.equal(map.statRuns.textContent,final);
 assert.equal(map.lastItems.textContent,'4');
});
