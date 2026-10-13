'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const text=fs.readFileSync(path.resolve(__dirname,'../frigg-abilities.js'),'utf8');
function make(values={}){
  const store=new Map(Object.entries(values));
  const window={};
  vm.runInNewContext(text,{window,localStorage:{
    getItem:key=>store.get(key)??null,
    setItem:(key,value)=>store.set(key,String(value))
  }});
  return window.DFCHFriggAbility;
}
test('Screenshot source includes five real entries and unknown raw IDs are not invented',()=>{
  const x=make(),skills=x.screenshotSkills;
  assert.equal(skills.length,5);
  assert.equal(skills[0].name,'高級聲援（全員）IV+');
  assert.equal(skills[0].observed,1);
  assert.equal(skills[0].max,30);
  assert.equal(skills[1].name,'貪欲 III');
  assert.equal(skills[1].observed,6);
  assert.equal(skills[1].max,6);
  assert.match(skills[1].effect,/15%/);
  assert.ok(skills.every(s=>s.abilityId===null && s.icon===null));
});
test('Bond level is bounded 1 to 50 and defaults to 50',()=>{
  assert.equal(make().readState().bond,50);
  assert.equal(make({'dfch-frigg-bond-query-v2':'{"bond":999}'}).readState().bond,50);
  assert.equal(make({'dfch-frigg-bond-query-v2':'{"bond":-999}'}).readState().bond,1);
});
test('Screenshot and max modes are distinct from unverified intermediate levels',()=>{
  assert.equal(make().readState().levels['all-hp'],1);
  assert.equal(make({'dfch-frigg-bond-query-v2':'{"mode":"max"}'}).readState().levels['all-hp'],30);
  const c=make({'dfch-frigg-bond-query-v2':'{"bond":22,"mode":"custom","levels":{"all-hp":999,"greed-3":-90}}'}).readState();
  assert.equal(c.bond,22);
  assert.equal(c.levels['all-hp'],30);
  assert.equal(c.levels['greed-3'],1);
});
test('Prior pilot bond choice is retained without retaining fake ability values',()=>{
  const x=make({'dfch-frigg-ability-preview-v1':'{"bond":32,"mode":"custom","levels":{"reference-cheer-all":16}}'}).readState();
  assert.equal(x.bond,32);
  assert.equal(x.mode,'screenshot');
  assert.equal(x.levels['all-hp'],1);
});
test('No six-star random reward generation is present',()=>{
  assert.ok(!text.includes('friggNewHeading'));
  assert.ok(!text.includes('friggNewBody'));
  assert.ok(!text.includes('Math.random('));
});
