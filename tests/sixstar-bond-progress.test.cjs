'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'sixstar-abilities.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/sixstar-visible-abilities.json'),'utf8'));

class Element {
  constructor(tag='div',document=null) {
    this.tag=tag;this.document=document;this.handlers={};this.nodes={};this.children=[];
    this.attributes={};this.style={};this.value='';this.open=false;this.disabled=false;
    this.isConnected=true;this.scrollTop=0;this.textContent='';this.innerHTML='';
  }
  querySelector(selector){return this.nodes[selector] ||= new Element(selector,this.document)}
  append(...nodes){this.children.push(...nodes)}
  replaceChildren(...nodes){this.children=[...nodes]}
  addEventListener(event,handler){(this.handlers[event] ||= []).push(handler)}
  setAttribute(key,value){this.attributes[key]=String(value)}
  getAttribute(key){return this.attributes[key]}
  async fire(event){for(const handler of (this.handlers[event]||[]))await handler({target:this})}
  showModal(){this.open=true}
  close(){this.open=false}
  focus(){if(this.document)this.document.activeElement=this}
}
function fixture(){
  const storage = new Map();
  let dialog;
  const document={
    activeElement:null,
    body:{append(el){dialog=el}},
    createElement(tag){return new Element(tag,document)}
  };
  const context={
    document,
    window:{},
    localStorage:{getItem(key){return storage.get(key)||null},setItem(key,value){storage.set(key,value)}},
    fetch:async url=>url.startsWith('./data/')
      ? {ok:true,json:async()=>data}
      : {ok:false,json:async()=>({})}
  };
  vm.runInNewContext(source,context);
  return {modal:context.window.DFCHSixstarAbilityModal,storage,get dialog(){return dialog},
    control(selector){return dialog.querySelector(selector)}};
}

test('Official 51 cumulative requirements are consistent for every six-star hero',()=>{
  assert.equal(data.heroes.length,23);
  assert.equal(data.bondThresholds.length,51);
  assert.equal(data.bondThresholds[0],0);
  assert.equal(data.bondThresholds[1],100);
  assert.equal(data.bondThresholds[44],10200);
  assert.equal(data.bondThresholds[45],11200);
  assert.equal(data.bondThresholds[50],13000);
  for(let level=1;level<data.bondThresholds.length;level++)
    assert.ok(data.bondThresholds[level]>data.bondThresholds[level-1]);
});

test('Progress from Lv.44 472/1000 calculates 528 remaining and 10672 cumulative',async()=>{
  const ui=fixture();
  await ui.modal.open({heroKey:'frigg',lang:'zh_tw'});
  assert.match(ui.dialog.innerHTML,/id="sixstarBondProgress"/);
  assert.equal(ui.control('.s6-progress-cumulative').textContent,'100');
  const range=ui.control('.s6-bond-range');
  range.value='44';await range.fire('input');
  const input=ui.control('.s6-progress-input');
  assert.equal(ui.control('.s6-progress-cap').textContent,'/ 1,000');
  input.value='472';await input.fire('input');await input.fire('change');
  assert.equal(ui.control('.s6-progress-remaining').textContent,'528');
  assert.equal(ui.control('.s6-progress-cumulative').textContent,'10,672');
  assert.match(ui.control('.s6-progress-target').textContent,/11,200/);
  assert.equal(ui.control('.s6-progress-track').attributes['aria-valuenow'],'472');
  const saved=JSON.parse(ui.storage.get('dfch-sixstar-abilities-v1'));
  assert.equal(saved.frigg.bond,44);
  assert.equal(saved.frigg.progress,472);
});

test('Each hero retains a separate bond amount, without losing older ability levels',async()=>{
  const ui=fixture();
  await ui.modal.open({heroKey:'frigg'});
  const range=ui.control('.s6-bond-range');
  range.value='44';await range.fire('input');
  const input=ui.control('.s6-progress-input');
  input.value='472';await input.fire('change');
  ui.dialog.close();
  await ui.modal.open({heroKey:'freya'});
  assert.equal(ui.control('.s6-progress-input').value,'0');
  range.value='10';await range.fire('input');
  input.value='150';await input.fire('change');
  assert.equal(ui.control('.s6-progress-cumulative').textContent,'1,850');
  ui.dialog.close();
  await ui.modal.open({heroKey:'frigg'});
  assert.equal(ui.control('.s6-bond-number').textContent,'Lv.44 / 50');
  assert.equal(ui.control('.s6-progress-input').value,'472');
  const stored=JSON.parse(ui.storage.get('dfch-sixstar-abilities-v1'));
  assert.equal(stored.frigg.progress,472);
  assert.equal(stored.freya.bond,10);
  assert.equal(stored.freya.progress,150);
});

test('Submitting a full current level automatically advances levels, clamps max, and dragging resets progress',async()=>{
  const ui=fixture();
  await ui.modal.open({heroKey:'frigg'});
  const range=ui.control('.s6-bond-range');
  const input=ui.control('.s6-progress-input');
  range.value='44';await range.fire('input');
  input.value='1000';await input.fire('change');
  assert.equal(ui.control('.s6-bond-number').textContent,'Lv.45 / 50');
  assert.equal(input.value,'0');
  assert.equal(ui.control('.s6-progress-cumulative').textContent,'11,200');
  input.value='2000';await input.fire('change');
  assert.equal(ui.control('.s6-bond-number').textContent,'Lv.50 / 50');
  assert.equal(input.disabled,true);
  assert.equal(ui.control('.s6-progress-remaining').textContent,'已滿級');
  assert.equal(ui.control('.s6-progress-cumulative').textContent,'13,000');
  range.value='44';await range.fire('input');
  assert.equal(input.disabled,false);
  assert.equal(input.value,'0');
  input.value='-123';await input.fire('change');
  assert.equal(input.value,'0');
});
test('Both deployment entrypoints have versioned assets in Cloudflare whitelist',()=>{
  for(const entry of ['index.html','heroes.html']){
    const html=fs.readFileSync(path.join(root,entry),'utf8');
    assert.match(html,/sixstar-abilities\.js\?v=1\.4\.0/);
    assert.match(html,/sixstar-abilities\.css\?v=1\.1\.0/);
  }
  assert.match(source,/sixstar-visible-abilities\.json\?v=1\.3\.0/);
  const manifest=fs.readFileSync(path.join(root,'scripts/build-heroes-pages.cjs'),'utf8');
  for(const p of ['sixstar-abilities.js','sixstar-abilities.css','data/sixstar-visible-abilities.json'])
    assert.ok(manifest.includes("'"+p+"'"));
});
