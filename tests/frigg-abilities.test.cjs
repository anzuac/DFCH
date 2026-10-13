'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const moduleSource=fs.readFileSync(path.resolve(__dirname,'../frigg-abilities.js'),'utf8');
const make=values=>{
  const storage=new Map(Object.entries(values||{}));
  const window={};
  vm.runInNewContext(moduleSource,{window,localStorage:{
    getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,String(value))
  }});
  return window.DFCHFriggAbility;
};
test('Only Frigg is exposed as a stand-alone UI module; no official formula is fabricated',()=>{
  const app=make();
  assert.equal(typeof app.open,'function');
  assert.equal(app.referenceSkills.length,5);
  assert.equal(app.defaultState().bond,50);
  assert.equal(app.defaultState().mode,'max');
  assert.equal(app.defaultState().levels['reference-cheer-all'],30);
});
test('Bond levels are clamped to 1–50 even when local state is invalid',()=>{
  assert.equal(make({'dfch-frigg-ability-preview-v1':'{"bond":501,"mode":"custom","levels":{"reference-cheer-all":999}}'}).readState().bond,50);
  assert.equal(make({'dfch-frigg-ability-preview-v1':'{"bond":-5,"mode":"custom"}'}).readState().bond,1);
  assert.equal(make({'dfch-frigg-ability-preview-v1':'not JSON'}).readState().bond,50);
});
test('Custom skill levels cannot exceed screenshot reference bounds',()=>{
  const app=make({'dfch-frigg-ability-preview-v1':'{"bond":45,"mode":"custom","levels":{"reference-cheer-all":999,"reference-greed":-2}}'});
  const state=app.readState();
  assert.equal(state.mode,'custom');
  assert.equal(state.levels['reference-cheer-all'],30);
  assert.equal(state.levels['reference-greed'],1);
});
