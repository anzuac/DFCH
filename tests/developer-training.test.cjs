'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{}};vm.runInNewContext(read('training/engine.js'),ctx);vm.runInNewContext(read('training/presets.js'),ctx);
const E=ctx.window.DFCHTrainingEngine,heroes=ctx.window.DFCHTrainingPresets;
test('23 distinct six-star templates with complete raw 11-status levels',()=>{
 assert.equal(heroes.length,23);
 assert.equal(new Set(heroes.map(x=>x.id)).size,23);
 assert.equal(new Set(heroes.map(x=>x.key)).size,23);
 for(const h of heroes){assert.equal(h.levels.length,11,h.key);assert.equal(typeof h.name,'string');assert.ok(h.levels.every(v=>Number.isFinite(v)&&v>=0&&v<=99.9));}
 assert.equal(heroes.find(x=>x.key==='freya').id,59);
 assert.equal(heroes.find(x=>x.key==='freya').levels[1],88);
});
test('Fruit channel grows separately from SP and preserves actual panel speed',()=>{
 assert.ok(Math.abs(E.totalLevel(60,60,23,'GOD')-64.139809)<.0001);
 assert.equal(E.show(2,E.valueFromLevel(2,E.totalLevel(60,60,23,'GOD'))),'0.611 km/s');
 assert.equal(E.RANKS[E.rankOf(E.totalLevel(60,60,23,'GOD'))],'A');
});
test('11/11 Freya GOD MAX costs reproduce the APK screenshot',()=>{
 const f=heroes.find(x=>x.key==='freya');
 const fruit=[100,100,23,100,83,100,100,100,61,3,0];
 const costs=[859,827,859,859,452,859,859,859,859,859,859];
 for(let i=0;i<11;i++)assert.equal(E.simulate(f.levels[i],f.levels[i],fruit[i],859,'MAX','GOD').cost,costs[i],E.NAMES[i]);
});
test('X1 X10 RANK MAX, affordability, and caps remain separate',()=>{
 assert.deepEqual(['X1','X10','RANK','MAX'].map(m=>E.simulate(88,88,100,859,m,'GOD').cost).join(','),'1,10,230,827');
 assert.equal(E.simulate(88,88,100,5,'RANK','GOD').affordable,false);
 assert.equal(E.simulate(88,88,100,859,'MAX','SSS').cost,226);
 assert.equal(E.simulate(95,95,83,859,'MAX','SSS').cost,49);
});
test('Developer root has exactly nine tabs, an isolated iframe, and resize mapping',()=>{
 const index=read('index.html');
 assert.equal((index.match(/class="tab(?: active)?"/g)||[]).length,9);
 assert.match(index,/data-tab="training">⑨ 英靈養成/);
 assert.match(index,/id="tab-training"/);
 assert.match(index,/id="trainingEmbeddedFrame"/);
 assert.match(index,/src="\.\/training\/index\.html"/);
 assert.match(read('bond30-embed.js'),/'dfch-training-height':'trainingEmbeddedFrame'/);
 const page=read('training/index.html'),app=read('training/app.js');
 for(const value of ['preset','custom','X1','X10','MAX','RANK','availableSp','rankCap','statusList'])
  assert.ok(page.includes(value)||app.includes(value),value);
 assert.match(app,/const refund=r\.used\.reduce/);
 assert.match(app,/r\.points=Math\.min\(100000,r\.points\+refund\)/);
 for(const src of ['training/engine.js','training/presets.js','training/app.js'])
  assert.doesNotThrow(()=>new Function(read(src)));
});
