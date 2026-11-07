'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const prefs=require('../data/hero-preferences.json');
const abilities=require('../data/sixstar-visible-abilities.json');
const races={
  idunn:2,siegfried:101,randgrid:2,uni:104,idunn_water:2,siegfried_water:101,
  flowsvan:2,valentine_queen:100,beyla:101,akasha:1,bahra:107,
  randgrid_dagger:2,catgirl_bard:108,bandit_leader_wolf:108,orphia:100,
  idunn_xmas:2,eir:2,shion:100,valentine_queen_water:100,akasha_water:1,
  kolga:101,freya:1,frigg:1,laios:100,marcille:101,chilchack:102,
  senshi:103,izutsumi:108,falin:100,mithrun:101,thistle:101
};
const officialZhTw={1:'神族',2:'墮落的神族',100:'人類族',101:'精靈族',
  102:'地精族',103:'矮人族',104:'褐精族',107:'人魚',108:'獸人'};
test('All 31 six-star tribes match 3.18.0 UniquePlayerParamTable and official localization',()=>{
  assert.equal(prefs.heroes.length,31);
  assert.equal(prefs.tribeSource.pathId,77034);
  assert.equal(prefs.tribeSource.rowsValidated,76);
  assert.equal(prefs.tribeSource.sixStarRowsValidated,31);
  assert.equal(prefs.tribeSource.localizationPathId,77775);
  assert.equal(Object.keys(races).length,31);
  for(const hero of prefs.heroes){
    assert.ok(Object.hasOwn(races,hero.key),hero.key);
    assert.equal(hero.tribeId,races[hero.key],'tribe '+hero.key);
    assert.equal(prefs.tribeDefinitions[hero.tribeId].translations.zh_tw,officialZhTw[hero.tribeId]);
  }
  assert.deepEqual(prefs.heroes.filter(h=>h.altTribeNameKey).map(h=>[h.key,h.altTribeNameKey]),[
    ['laios','tribe-alt-name-tallman'],
    ['chilchack','tribe-alt-name-harffoot'],
    ['falin','tribe-alt-name-tallman']
  ]);
  const counts=prefs.heroes.reduce((map,h)=>(map[h.tribeId]=(map[h.tribeId]||0)+1,map),{});
  assert.deepEqual(counts,{'1':4,'2':7,'100':6,'101':7,'102':1,'103':1,'104':1,'107':1,'108':3});
});
test('Browser six-star hero data equals JSON, and card displays verified race',()=>{
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'hero-preferences-data.js'),'utf8'),context);
  assert.equal(JSON.stringify(context.window.DFCHHeroPreferences),JSON.stringify(prefs));
  const view=fs.readFileSync(path.join(root,'hero-preferences-view.js'),'utf8');
  assert.match(view,/heroRaceName\(h\)/);
  assert.match(view,/hero-race/);
  assert.match(view,/raceUI/);
});
test('All five tribe-dependent fixed skills have explicitly verified modes and targets',()=>{
  const expected=[
    ['beyla','神巫女的血統','fixed-tribe-bonus',303001044,4015,101,101],
    ['beyla','森林的恩寵','fixed-tribe-bonus',303001047,1338,101,101],
    ['shion','孤高的天才','no-other-same-tribe',303001095,4020,100,9999],
    ['marcille','學校有史以來最優秀的才女','no-other-same-tribe',303001114,4020,101,9999],
    ['mithrun','金絲雀小隊的隊長','fixed-tribe-bonus',303001126,4015,101,101]
  ];
  const marked=abilities.heroes.flatMap(h=>h.skills.filter(s=>s.tribeRule).map(s=>[h.slug,s]));
  assert.equal(abilities.heroes.length,31);
  assert.equal(abilities.heroes.reduce((n,h)=>n+h.skills.length,0),341);
  assert.equal(marked.length,5);
  for(const [slug,name,kind,id,type,tribe,index] of expected){
    const hero=abilities.heroes.find(h=>h.slug===slug);
    const skill=hero?.skills.find(s=>s.name===name);
    assert.ok(skill,'missing race skill '+slug+' '+name);
    assert.equal(skill.tribeRule.kind,kind);
    assert.equal(skill.tribeRule.abilityId,id);
    assert.equal(skill.tribeRule.abilityType,type);
    assert.equal(skill.tribeRule.tribeId,tribe);
    assert.equal(skill.tribeRule.rawTargetIndex,index);
    assert.equal(prefs.heroes.find(h=>h.key===slug).tribeId,tribe);
  }
  for(const hero of abilities.heroes)for(const skill of hero.skills)for(const line of skill.levelEffects)
    assert.doesNotMatch(line,/指定種族/,'remaining ambiguous race '+hero.slug+' '+skill.name);
  const mithrun=abilities.heroes.find(h=>h.slug==='mithrun').skills.find(s=>s.name==='金絲雀小隊的隊長');
  assert.equal(mithrun.levelEffects.length,15);
  assert.match(mithrun.levelEffects[0],/^精靈族.*5%/);
  assert.match(mithrun.levelEffects[14],/^精靈族.*75%/);
});
test('Both web pages load updated six-star race data and skill text versions',()=>{
  const loader=fs.readFileSync(path.join(root,'sixstar-abilities.js'),'utf8');
  assert.match(loader,/sixstar-visible-abilities\.json\?v=3\.18\.3/);
  for(const page of ['index.html','heroes.html']){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    assert.match(html,/hero-preferences-data\.js\?v=3\.18\.9/);
    assert.match(html,/hero-preferences-view\.js\?v=2\.9\.5/);
    assert.match(html,/sixstar-abilities\.js\?v=1\.5\.4/);
  }
});
