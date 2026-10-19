'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine.js');
function seeded(seed){let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}
test('animated and instant opening produce identical sequences, including rarity counts',()=>{
  for(const seed of [1,2,42,777,123456,4294967295]){
    const instant=E.drawOnce(4,seeded(seed));
    const stream=E.createOpening(4,seeded(seed));
    let s,steps=[];
    while((s=stream.next())!==null){steps.push(s);if(s.finished)break;}
    assert.equal(steps.length,instant.items);
    for(const k of ['items','a','b','c','ordinary','n','r','sr','ssr','ur','continueSuccess','continuationChecks'])
      assert.equal(steps.at(-1)[k],instant[k],`seed ${seed} key ${k}`);
    assert.equal(steps.at(-1).finished,true);
    assert.equal(steps.at(-1).reward.number,instant.items);
    assert.equal(stream.next(),null);
  }
});
test('C is revealed in sequence and does not change continuation rule',()=>{
 const values=[0,.0001,.0001502,.97,.99];let i=0;
 const stream=E.createOpening(4,()=>values[i++]);
 const steps=[stream.next(),stream.next(),stream.next(),stream.next()];
 assert.deepEqual(steps.map(s=>s.reward.type),['A','B','C','SSR']);
 assert.equal(steps.at(-1).finished,true);
 assert.equal(steps.at(-1).continuationChecks,1);
});
