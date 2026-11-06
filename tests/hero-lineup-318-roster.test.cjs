'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const official=JSON.parse(read('data/sixstar-visible-abilities.json'));
const {HEROES}=new Function(read('team/js/data.js')+'\nreturn {HEROES};')();
const slugs=['laios','marcille','chilchack','senshi','izutsumi','falin','mithrun','thistle'];
test('lineup selectable catalogue includes exactly 31 six-star heroes',()=>{
  assert.equal(HEROES.length,31);
  assert.equal(new Set(HEROES.map(h=>h.slug)).size,31);
  assert.deepEqual([...HEROES.map(h=>h.slug)].sort(),[...official.heroes.map(h=>h.slug)].sort());
});
test('all eight collaboration heroes have portraits and eleven usable fixed skills in lineup',()=>{
  for(const slug of slugs){
    const hero=HEROES.find(h=>h.slug===slug);
    const master=official.heroes.find(h=>h.slug===slug);
    assert.ok(hero&&master,slug);
    assert.equal(hero.name,master.name);
    assert.equal(hero.title,master.title);
    assert.equal(hero.skills.length,11);
    assert.deepEqual(hero.skills.map(s=>s.name),master.skills.map(s=>s.name));
    for(let i=0;i<11;i++){
      const a=hero.skills[i],b=master.skills[i];
      assert.equal(a.baseCap,b.baseCap);assert.equal(a.fullCap,b.fullCap);
      assert.equal(a.evolvable,b.evolveAt!=null);
    }
    assert.ok(fs.statSync(path.join(root,'assets/heroes',slug+'.webp')).size>0,'portrait '+slug);
  }
});
test('lineup keeps existing team persistence and refreshes official skill cache',()=>{
  const app=read('team/js/app.js'),html=read('team/index.html');
  assert.match(app,/hero-layout-phase1-v1/);
  assert.match(app,/sixstar-visible-abilities\.json\?v=3\.18\.3/);
  assert.match(html,/js\/data\.js\?v=1\.15\.10/);
  assert.match(html,/js\/app\.js\?v=1\.15\.10/);
});
