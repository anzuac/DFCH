'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/sixstar-visible-abilities.json'),'utf8'));
const preferences=JSON.parse(fs.readFileSync(path.join(root,'data/hero-preferences.json'),'utf8'));
const slugs=["laios","marcille","chilchack","senshi","izutsumi","falin","mithrun","thistle"];
const levels=[5,10,20,25,30,35,45];
const heroes=slugs.map(slug=>data.heroes.find(h=>h.slug===slug));
test('3.18.0 roster has 31 unique six-stars including eight collaboration heroes',()=>{
  assert.equal(data.heroes.length,31);
  assert.equal(preferences.heroes.length,31);
  assert.equal(new Set(data.heroes.map(h=>h.slug)).size,31);
  for(let i=0;i<slugs.length;i++){
    assert.ok(heroes[i],slugs[i]);
    assert.ok(preferences.heroes.some(h=>h.key===slugs[i]));
  }
});
test('each collaboration six-star has 11 fixed abilities and complete numeric-level arrays',()=>{
  for(const h of heroes){
    assert.equal(h.skills.length,11,h.slug);
    for(const skill of h.skills){
      assert.ok(skill.name,h.slug);
      assert.ok(skill.baseCap>=1 && skill.fullCap>=skill.baseCap,skill.name);
      assert.equal(skill.levelEffects.length,skill.fullCap,skill.name);
      assert.ok(skill.levelEffects.every(s=>typeof s==='string'&&s.trim()),skill.name);
      assert.ok(skill.icon && Object.hasOwn(data.icons,skill.icon),skill.name);
    }
  }
});
test('each hero has the official seven bond milestones, six evolutions and Lv30 unlock',()=>{
  for(const h of heroes){
    assert.deepEqual(h.rewards.map(r=>r.level),levels,h.slug);
    const unlocked=h.skills.filter(s=>s.unlockAt===30);
    assert.equal(unlocked.length,1,h.slug);
    assert.ok(h.rewards.find(r=>r.level===30).text.includes(unlocked[0].name),h.slug);
    for(const lv of levels.filter(x=>x!==30)){
      const evolved=h.skills.filter(s=>s.evolveAt===lv);
      assert.equal(evolved.length,1,h.slug+' Lv.'+lv);
      assert.ok(h.rewards.find(r=>r.level===lv).text.includes(evolved[0].name),h.slug+' Lv.'+lv);
    }
  }
});
test('3.18.0 bond thresholds span Lv0-Lv50 and 172 player-visible icon references are valid',()=>{
  assert.equal(data.bondThresholds.length,51);
  for(let i=1;i<data.bondThresholds.length;i++)assert.ok(data.bondThresholds[i]>data.bondThresholds[i-1]);
  assert.equal(Object.keys(data.icons).length,172);
  for(const s of data.heroes.flatMap(h=>h.skills))assert.ok(s.icon && Object.hasOwn(data.icons,s.icon),s.name);
  assert.doesNotMatch(JSON.stringify(data),/\b30300\d{4}\b|sab_[a-z]/);
});
test('collector II skill remains explicitly pending, never fabricated as verified',()=>{
  const skill=heroes.find(h=>h.slug==='chilchack').skills.find(s=>s.name==='收集家 II');
  assert.ok(skill);
  assert.ok(skill.levelEffects.every(x=>x.includes('尚待遊戲畫面核實')));
});
