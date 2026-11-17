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
test('All 31 heroes have complete, player-readable ability effects for every supported level',()=>{
  assert.equal(data.heroes.length,31);
  assert.equal(data.heroes.reduce((sum,h)=>sum+h.skills.length,0),341);
  for(const h of data.heroes)for(const s of h.skills){
    assert.equal(s.levelEffects.length,s.fullCap);
    assert.ok(s.levelEffects.every(text=>typeof text==='string'&&text.trim().length>0));
  }
  assert.equal(new Set(data.heroes.slice(0,23).flatMap(h=>h.skills.map(s=>s.name))).size,138);
  assert.doesNotMatch(JSON.stringify(data),/能力名稱核對中|\b30300\d{4}\b/);
});
test('All missing skills use the matched official player descriptions',()=>{
  assert.match(at('valentine_queen','手作的禮物',4),/額外獲得 4 個荊刺寶箱/);
  assert.equal(at('eir','手作的禮物',4),at('valentine_queen','手作的禮物',4));
  assert.match(at('beyla','神木的聖弓',8),/9 倍.*耐力消耗變為 3 倍/);
  assert.match(at('akasha','禁斷的魔法術 II',4),/降低 50%.*6 倍/);
  assert.match(at('akasha','禁斷的魔法術 II',5),/降低 50%.*6\.5 倍/);
  assert.match(at('randgrid_dagger','流浪的面紗',6),/6 顆每 5 秒再生一次的心臟/);
  assert.match(at('bandit_leader_wolf','大胃王 II',20),/100%/);
  assert.match(at('bandit_leader_wolf','大胃王 II',21),/103%/);
  assert.match(at('bandit_leader_wolf','大胃王 II',30),/130%/);
  assert.match(at('shion','孤高的天才',6),/其他人類種族.*1\.6 倍/);
  assert.match(at('shion','剎那斬',24),/暴擊傷害.*24%/);
  assert.ok(hero('bandit_leader_wolf').skills.some(s=>s.name==='獸人的嗅覺'));
});
test('Six-star multipliers match in-game effects and native values',()=>{
  const rates=(key,name,re)=>skill(key,name).levelEffects.map((description,i)=>{
    const match=description.match(re);
    assert.ok(match,key+' '+name+' Lv.'+(i+1)+' has a multiplier');
    return Number(match[1]);
  });
  const attack=/攻擊力變(?:為|成)\s*(\d+(?:\.\d+)?)\s*倍/;
  const solo=/提升為\s*(\d+(?:\.\d+)?)\s*倍/;
  assert.deepEqual(rates('beyla','神木的聖弓',attack),[2,3,4,5,6,7,8,9]);
  assert.deepEqual(rates('freya','極大魔法吟唱',attack),[4,5,6,7,8,8.5,9]);
  assert.deepEqual(rates('mithrun','大魔法吟唱',attack),[2,2.5,3,3.5,4,4.2,4.4,4.6,4.8]);
  for(const key of ['akasha','marcille','thistle']){
    const ability=skill(key,'禁斷的魔法術 II');
    assert.deepEqual(rates(key,'禁斷的魔法術 II',attack),[3,4,5,6,6.5,7]);
    assert.ok(ability.levelEffects.every(x=>x.includes('攻擊速度降低 50%')),key+' speed penalty unchanged');
  }
  assert.deepEqual(rates('shion','孤高的天才',solo),[1.1,1.2,1.3,1.4,1.5,1.6]);
  assert.equal(at('shion','孤高的天才',2).match(solo)?.[1],'1.2','in-game screenshot: Shion Lv2/6 is 1.2x');
  const marcille=skill('marcille','學校有史以來最優秀的才女');
  assert.equal(skill('shion','孤高的天才').tribeRule.abilityType,marcille.tribeRule.abilityType);
  assert.deepEqual(rates('marcille','學校有史以來最優秀的才女',/提升至\s*(\d+(?:\.\d+)?)\s*倍/),[1.1,1.2,1.3,1.4,1.5,1.6]);
});

test('Two-element Flaming Aureola levels split holy and fire growth correctly',()=>{
  assert.match(at('idunn_xmas','烈焰光環',1),/神聖.*5%；.*火焰.*5%/);
  assert.match(at('idunn_xmas','烈焰光環',10),/神聖.*50%；.*火焰.*50%/);
  assert.match(at('idunn_xmas','烈焰光環',11),/神聖.*55%；.*火焰.*51%/);
  assert.match(at('idunn_xmas','烈焰光環',12),/神聖.*60%；.*火焰.*52%/);
});
test('Main-site and Cloudflare Pages references use the same refreshed ability data',()=>{
  const get=p=>fs.readFileSync(path.join(root,p),'utf8');
  for(const name of ['index.html','heroes.html'])assert.match(get(name),/sixstar-abilities\.js\?v=1\.5\.7/);
  assert.match(get('sixstar-abilities.js'),/sixstar-visible-abilities\.json\?v=3\.18\.6/);
  assert.match(get('scripts/build-heroes-pages.cjs'),/'data\/sixstar-visible-abilities\.json'/);
});
