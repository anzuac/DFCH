'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=require('../data/sixstar-visible-abilities.json');
const hero=key=>{
  const result=data.heroes.find(h=>h.slug===key);
  assert.ok(result,'hero '+key);
  return result;
};
const skill=(key,name)=>{
  const result=hero(key).skills.find(s=>s.name===name);
  assert.ok(result,'skill '+key+' '+name);
  return result;
};
const at=(key,name,level)=>skill(key,name).levelEffects[level-1];
test('All 23 heroes have complete, player-readable ability effects for every supported level',()=>{
  assert.equal(data.heroes.length,23);
  assert.equal(data.heroes.reduce((sum,h)=>sum+h.skills.length,0),253);
  for(const h of data.heroes)for(const s of h.skills){
    assert.equal(s.levelEffects.length,s.fullCap);
    assert.ok(s.levelEffects.every(text=>typeof text==='string'&&text.trim().length>0));
  }
  assert.equal(new Set(data.heroes.flatMap(h=>h.skills.map(s=>s.name))).size,138);
  assert.doesNotMatch(JSON.stringify(data),/能力名稱核對中|\b30300\d{4}\b/);
});
test('All missing skills use the matched official player descriptions',()=>{
  assert.match(at('valentine_queen','手作的禮物',4),/額外獲得 4 個荊刺寶箱/);
  assert.equal(at('eir','手作的禮物',4),at('valentine_queen','手作的禮物',4));
  assert.match(at('beyla','神木的聖弓',8),/900 倍.*耐力消耗變為 3 倍/);
  assert.match(at('akasha','禁斷的魔法術 II',4),/降低 50%.*600 倍/);
  assert.match(at('akasha','禁斷的魔法術 II',5),/降低 50%.*650 倍/);
  assert.match(at('randgrid_dagger','流浪的面紗',6),/6 顆每 5 秒再生一次的心臟/);
  assert.match(at('bandit_leader_wolf','大胃王 II',20),/100%/);
  assert.match(at('bandit_leader_wolf','大胃王 II',21),/103%/);
  assert.match(at('bandit_leader_wolf','大胃王 II',30),/130%/);
  assert.match(at('shion','孤高的天才',6),/其他人類種族.*60 倍/);
  assert.match(at('shion','剎那斬',24),/暴擊傷害.*24%/);
  assert.ok(hero('bandit_leader_wolf').skills.some(s=>s.name==='獸人的嗅覺'));
});
test('Two-element Flaming Aureola levels split holy and fire growth correctly',()=>{
  assert.match(at('idunn_xmas','烈焰光環',1),/神聖.*5%；.*火焰.*5%/);
  assert.match(at('idunn_xmas','烈焰光環',10),/神聖.*50%；.*火焰.*50%/);
  assert.match(at('idunn_xmas','烈焰光環',11),/神聖.*55%；.*火焰.*51%/);
  assert.match(at('idunn_xmas','烈焰光環',12),/神聖.*60%；.*火焰.*52%/);
});
test('Main-site and Cloudflare Pages references use the same refreshed ability data',()=>{
  const get=p=>fs.readFileSync(path.join(root,p),'utf8');
  for(const name of ['index.html','heroes.html'])assert.match(get(name),/sixstar-abilities\.js\?v=1\.1\.0/);
  assert.match(get('sixstar-abilities.js'),/sixstar-visible-abilities\.json\?v=1\.1\.0/);
  assert.match(get('scripts/build-heroes-pages.cjs'),/'data\/sixstar-visible-abilities\.json'/);
});
