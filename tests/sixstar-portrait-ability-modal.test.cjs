'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const data = require('../data/sixstar-visible-abilities.json');
const heroes = require('../data/hero-preferences.json');
const read = name => fs.readFileSync(path.join(root,name), 'utf8');
test('23 player-facing six-star portraits map one-to-one to ability sets', () => {
  assert.equal(data.heroes.length,23);
  const keys = data.heroes.map(h=>h.slug);
  assert.equal(new Set(keys).size,23);
  assert.deepEqual([...keys].sort(), heroes.heroes.map(h=>h.key).sort());
  for (const hero of data.heroes) {
    assert.ok(hero.title);
    assert.equal(hero.skills.length,11);
    assert.deepEqual(hero.rewards.map(r=>r.level), [5,10,20,25,30,35,45]);
    for (const skill of hero.skills) {
      assert.ok(skill.name);
      assert.ok(Array.isArray(skill.levelEffects));
      assert.equal(skill.levelEffects.length,skill.fullCap);
      assert.ok(skill.baseCap>=1 && skill.baseCap<=skill.fullCap);
      if(skill.icon) assert.ok(Object.hasOwn(data.icons, skill.icon));
    }
  }
  assert.notEqual(data.heroes.find(h=>h.slug==='idunn').title,data.heroes.find(h=>h.slug==='idunn_water').title);
});
test('Bond unlocks cover the whole range and preserve rewards', () => {
  assert.equal(data.bondRewards.length,51);
  assert.deepEqual(data.bondRewards.map(x=>x.level),Array.from({length:51},(_,i)=>i));
  assert.equal(data.bondRewards.find(x=>x.level===1).breakthrough,3);
  assert.equal(data.bondRewards.find(x=>x.level===50).totalBreakthrough,50);
});
test('No game internal numeric skill IDs appear in the published player data', () => {
  assert.doesNotMatch(JSON.stringify(data),/\b30300\d{4}\b/);
});
test('Every portrait invokes the shared ability modal on both pages', () => {
  const view=read('hero-preferences-view.js');
  assert.match(view,/DFCHSixstarAbilityModal\?\.open\(\{heroKey:h\.key/);
  assert.doesNotMatch(view,/if\(h\.key==='frigg'\)/);
  for(const page of ['index.html','heroes.html']){
    const html=read(page);
    assert.match(html,/sixstar-abilities\.js\?v=1\.0\.0/);
    assert.match(html,/sixstar-abilities\.css\?v=1\.0\.0/);
    assert.doesNotMatch(html,/frigg-abilities\.js\?v=0\.2\.0/);
  }
});
test('New modal JavaScript parses without depending on DOM evaluation', () => {
  assert.doesNotThrow(()=>new vm.Script(read('sixstar-abilities.js')));
});
