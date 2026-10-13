'use strict';
/* Regression tests for the gift-efficiency view.
 * Node: node --test tests/hero-gift-ranking.test.cjs
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const window={};
const context=vm.createContext({window});
for(const file of ['hero-preferences-data.js','hero-gift-ranking.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const {heroes,items,commonFavorite,bondGains}=window.DFCHHeroPreferences;
const {evaluate}=window.DFCHGiftRanking;

test('all 23 official six-star heroes and 32 gifts have known base values',()=>{
  assert.equal(heroes.length,23);assert.equal(items.length,32);
  for(const gift of items)assert.equal(Number.isFinite(bondGains.baseValues[gift.id]),true);
});
test('each individual gift produces a complete, sorted ranking in both artifact states',()=>{
  for(const gift of items){
    for(const statue of [false,true]){
      const result=evaluate(gift.id,heroes,bondGains,statue);
      assert.equal(result.rows.length,heroes.length);
      assert.equal(result.best,result.rows[0].gain);
      assert.ok(result.winners.length>=1);
      for(let i=1;i<result.rows.length;i++){
        const prev=result.rows[i-1],next=result.rows[i];
        assert.ok(prev.gain>=next.gain);
        if(prev.gain===next.gain)assert.equal(next.rank,prev.rank);
        else assert.equal(next.rank,prev.rank+1);
      }
    }
  }
});
test('statue increase uses the same floor-after-product formula as gift cards',()=>{
  for(const gift of items){
    const baseline=evaluate(gift.id,heroes,bondGains,false);
    const statue=evaluate(gift.id,heroes,bondGains,true);
    for(const row of baseline.rows){
      const improved=statue.rows.find(r=>r.hero.index===row.hero.index);
      const m=bondGains.preferenceMultipliers[row.kind];
      assert.equal(row.gain,Math.floor(bondGains.baseValues[gift.id]*m));
      assert.equal(improved.gain,Math.floor(bondGains.baseValues[gift.id]*m*bondGains.artifact.multiplier));
    }
  }
});
test('universal favorite gifts share the same rank for all six-star heroes',()=>{
  for(const id of commonFavorite){
    const result=evaluate(id,heroes,bondGains,false);
    assert.equal(result.rows.length,heroes.length);
    assert.ok(result.rows.every(row=>row.rank===1&&row.kind==='favorite'));
  }
});
test('personal preference filters candidates without ever overwriting official weights',()=>{
  const selection=new Set(heroes.slice(0,3).map(hero=>hero.index));
  const gift=items.find(item=>!commonFavorite.includes(item.id));
  const all=evaluate(gift.id,heroes,bondGains,true);
  const personal=evaluate(gift.id,heroes,bondGains,true,selection);
  assert.equal(personal.rows.length,3);
  assert.ok(personal.rows.every(row=>selection.has(row.hero.index)));
  for(const row of personal.rows)assert.equal(
    row.gain,all.rows.find(r=>r.hero.index===row.hero.index).gain
  );
  assert.equal(evaluate(gift.id,heroes,bondGains,true,new Set()).rows.length,0);
});
test('gift IDs absent from source data do not fabricate a percentage or value',()=>{
  assert.equal(evaluate(123456789,heroes,bondGains,false),null);
});
