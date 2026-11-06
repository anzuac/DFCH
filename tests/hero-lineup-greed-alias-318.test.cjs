'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'team/js/app.js'),'utf8');
const official=require('../data/sixstar-visible-abilities.json');
function segment(start,end){const a=src.indexOf(start),b=src.indexOf(end,a);assert.ok(a>=0&&b>a,start);return src.slice(a,b);}
const functions=segment('function canonicalSkillName(name){','function chosenSkills(s,h){');
const {canonicalSkillName,tracked,skillImage}=new Function('OFFICIAL_SKILL_ICONS','location',functions+'return {canonicalSkillName,tracked,skillImage};')({'貪欲 III':'./assets/greed-iii.png','貪欲 II':'./assets/greed-ii.png','貪欲 I':'./assets/greed-i.png'},{hostname:'anzuac.github.io'});
test('official strong greed III shares existing greed III calculation without renaming displayed skill',()=>{
 const skill=official.heroes.find(h=>h.slug==='chilchack').skills.find(s=>s.name==='強欲Ⅲ');
 assert.ok(skill);
 assert.equal(canonicalSkillName(skill.name),'貪欲 III');
 assert.ok(tracked(skill.name));
 assert.equal(skillImage(skill.name),'./assets/greed-iii.png');
 assert.equal(skill.name,'強欲Ⅲ');
 assert.deepEqual(skill.levelEffects.map(x=>Number(x.match(/(\d+)%/)?.[1])),[5,7,9,11,13,15]);
});
test('all greed aliases map consistently, and 31-hero lineup remains unchanged',()=>{
 for(const [form,expected] of [['強欲Ⅰ','貪欲 I'],['強欲Ⅱ','貪欲 II'],['強欲Ⅲ','貪欲 III'],['貪欲 III','貪欲 III'],['貪欲Ⅲ','貪欲 III']]){
  assert.equal(canonicalSkillName(form),expected);
  assert.equal(tracked(form),true);
 }
 assert.match(src,/getSkills\(h\|\|\{skills:\[\]\}\)\.filter\(x=>tracked\(x.name\)\)/);
 assert.match(src,/const key=canonicalSkillName\(x.name\)/);
 assert.match(fs.readFileSync(path.join(root,'team/index.html'),'utf8'),/app\.js\?v=1\.15\.11/);
});
