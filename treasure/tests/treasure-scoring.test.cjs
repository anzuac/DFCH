'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../engine.js');

test('practice scoring is fixed for all eight outcomes',()=>{
  assert.deepEqual(E.POINTS,{N:1,R:3,SR:10,SSR:20,UR:50,A:1000,B:2500,C:100000});
  assert.equal(E.scoreForCounts({n:1,r:1,sr:1,ssr:1,ur:1,a:1,b:1,c:1}),103584);
  assert.equal(E.scoreForCounts({n:4,r:0,sr:0,ssr:0,ur:0,a:0,b:0,c:0}),4);
  assert.equal(E.scoreForCounts({n:0,r:0,sr:0,ssr:0,ur:0,a:0,b:0,c:1}),100000);
});
test('per-reward scoring sums to the displayed chest score',()=>{
  const rolls=[.5,.5,.5,.5,.99];
  let index=0;
  const result=E.drawOnce(4,()=>rolls[index++],{capture:true});
  assert.equal(result.n,4);
  assert.equal(E.scoreForCounts(result),4);
});
test('safe scoring rejects malformed or unsafe count objects',()=>{
  const base={n:0,r:0,sr:0,ssr:0,ur:0,a:0,b:0,c:0};
  assert.throws(()=>E.scoreForCounts({...base,a:-1}),/無效獎勵計數/);
  assert.throws(()=>E.scoreForCounts({...base,r:1.5}),/無效獎勵計數/);
  assert.throws(()=>E.scoreForCounts({...base,c:Number.MAX_SAFE_INTEGER}),/積分總和超出安全整數範圍/);
  assert.throws(()=>E.scoreForCounts(null),/缺少獎勵計數/);
});
