'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

function seeded(seed){let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);}

test('animated stream and instant opening use identical underlying draws', () => {
 for(const minimum of [4,11])for(const seed of [1,2,42,777,123456,4294967295]){
   const instant=E.drawOnce(minimum,seeded(seed));
   const stream=E.createOpening(minimum,seeded(seed));
   let steps=[],s;
   while((s=stream.next())!==null){steps.push(s);if(s.finished)break;}
   const last=steps.at(-1);
   assert.equal(steps.length,instant.items,`seed ${seed}`);
   for (const k of ['items','a','b','ordinary','continueSuccess','continuationChecks','minimum','safetyStopped'])
     assert.equal(last[k],instant[k],`seed ${seed}, ${k}`);
   assert.equal(stream.next(),null,'stream cannot draw extra items after stopping');
   assert.equal(steps[0].items,1);
   assert.equal(steps[minimum-2].continuationChecks,0,'no continuation roll before guarantee');
   assert.ok(steps[minimum-1].continuationChecks>=1);
 }
});

test('two rare prizes appear in chronological order, never merged',()=>{
  let i=0;
  const seq=[0.00001,0.00011,0.5,0.5,0.99];
  const stream=E.createOpening(4,()=>seq[i++]);
  const steps=[stream.next(),stream.next(),stream.next(),stream.next()];
  assert.deepEqual(steps.map(s=>s.reward.type),['A','B','ordinary','ordinary']);
  assert.deepEqual(steps.map(s=>s.items),[1,2,3,4]);
  assert.equal(steps.at(-1).finished,true);
  assert.equal(steps.at(-1).a,1);
  assert.equal(steps.at(-1).b,1);
});

test('stream cannot be started with invalid minimum',()=>{
 assert.throws(()=>E.createOpening(5),RangeError);
});
