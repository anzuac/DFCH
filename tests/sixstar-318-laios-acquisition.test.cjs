'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=require('../data/hero-preferences.json');
test('Laios (70) is explicitly a limited collaboration gift, not an unknown or a pool hero',()=>{
  const laios=source.heroes.find(h=>h.index===70);
  assert.ok(laios);
  assert.deepEqual(laios.acquisition,{version:null,paidPack:false,pools:[],sourceType:'limited_collab_gift'});
  const seven=[71,72,73,74,75,80,81].map(id=>source.heroes.find(h=>h.index===id));
  assert.equal(seven.length,7);
  for(const hero of seven){
    assert.ok(hero?.acquisition,'Acquisition must remain set for '+hero?.index);
    assert.notEqual(hero.acquisition.sourceType,'limited_collab_gift');
    assert.ok(hero.acquisition.paidPack||hero.acquisition.pools.length,'Preserve normal purchase/pool source '+hero.index);
  }
});
test('The browser view translates limited collaboration gift and preserves existing source selection',()=>{
  const browser={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'hero-preferences-data.js'),'utf8'),browser);
  const data=browser.window.DFCHHeroPreferences;
  assert.equal(data.heroes.find(h=>h.index===70).acquisition.sourceType,'limited_collab_gift');
  const view=fs.readFileSync(path.join(root,'hero-preferences-view.js'),'utf8');
  assert.match(view,/limitedCollabGift:'限定合作贈送'/);
  assert.match(view,/info\.sourceType==='limited_collab_gift'\?copy\.limitedCollabGift/);
  for(const html of ['heroes.html','index.html']){
    const content=fs.readFileSync(path.join(root,html),'utf8');
    assert.match(content,/hero-preferences-data\.js\?v=3\.18\.9/);
    assert.match(content,/hero-preferences-view\.js\?v=2\.9\.5/);
  }
});
